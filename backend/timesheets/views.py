from django.db import transaction
from django.db.models import Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from core.serializers import DecisionSerializer
from core.workflow import can_decide, transition, visible_to

from .filters import TimesheetEntryFilter
from .models import TimesheetEntry, TimesheetStatusHistory
from .serializers import (
    TimesheetEntryDetailSerializer,
    TimesheetEntrySerializer,
)

EDITABLE = (TimesheetEntry.Status.DRAFT, TimesheetEntry.Status.RETURNED)


@extend_schema_view(
    list=extend_schema(tags=["timesheets"]),
    retrieve=extend_schema(tags=["timesheets"]),
    create=extend_schema(tags=["timesheets"]),
    update=extend_schema(tags=["timesheets"]),
    partial_update=extend_schema(tags=["timesheets"]),
    destroy=extend_schema(tags=["timesheets"]),
)
class TimesheetEntryViewSet(viewsets.ModelViewSet):
    """Timesheet entries: owner-scoped CRUD + submit/bulk-submit/approve/return.

    Check order on object endpoints (per docs/api.md):
    1. not visible → 404 (scoped queryset)
    2. relationship not allowed → 403 (owner-only / can_decide)
    3. wrong state or bad input → 400
    """

    lookup_value_regex = r"\d+"
    filterset_class = TimesheetEntryFilter
    ordering_fields = ["date", "status"]
    ordering = ["-date", "-start_time", "-id"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return TimesheetEntry.objects.none()
        qs = TimesheetEntry.objects.select_related(
            "owner", "owner__manager"
        ).prefetch_related("history__actor")
        return visible_to(qs, self.request.user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TimesheetEntryDetailSerializer
        return TimesheetEntrySerializer

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        total_hours = qs.aggregate(t=Sum("hours"))["t"] or 0
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        response = self.get_paginated_response(serializer.data)
        response.data["total_hours"] = str(total_hours)
        return response

    def _detail_response(self, obj):
        return Response(
            TimesheetEntryDetailSerializer(obj, context={"request": self.request}).data
        )

    def _require_owner(self, obj):
        if obj.owner_id != self.request.user.pk:
            raise PermissionDenied()

    def perform_create(self, serializer):
        with transaction.atomic():
            obj = serializer.save(
                owner=self.request.user, status=TimesheetEntry.Status.DRAFT
            )
            TimesheetStatusHistory.objects.create(
                entry=obj,
                actor=self.request.user,
                from_status=None,
                to_status=TimesheetEntry.Status.DRAFT,
                comment="",
            )

    def update(self, request, *args, **kwargs):
        # Owner/state checks run before body validation: 404 → 403 → 400.
        obj = self.get_object()
        self._require_owner(obj)
        if obj.status not in EDITABLE:
            raise ValidationError(
                {"detail": f"Cannot edit a timesheet entry in status '{obj.status}'."}
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        self._require_owner(obj)
        if obj.status != TimesheetEntry.Status.DRAFT:
            raise ValidationError(
                {"detail": "Only draft timesheet entries can be deleted."}
            )
        return super().destroy(request, *args, **kwargs)

    def _decide(self, request, pk, to_status, comment_required):
        obj = self.get_object()
        if not can_decide(request.user, obj.owner):
            raise PermissionDenied()
        body = DecisionSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        comment = body.validated_data.get("comment", "").strip()
        if comment_required and not comment:
            raise ValidationError({"comment": "This field is required."})
        obj = transition(
            obj,
            actor=request.user,
            to_status=to_status,
            history_model=TimesheetStatusHistory,
            history_fk="entry",
            allowed_from=[TimesheetEntry.Status.SUBMITTED],
            comment=comment,
            timestamps={"reviewed_at": timezone.now()},
        )
        return self._detail_response(obj)

    @extend_schema(request=None, responses=TimesheetEntryDetailSerializer)
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        obj = self.get_object()
        self._require_owner(obj)
        obj = transition(
            obj,
            actor=request.user,
            to_status=TimesheetEntry.Status.SUBMITTED,
            history_model=TimesheetStatusHistory,
            history_fk="entry",
            allowed_from=list(EDITABLE),
            timestamps={"submitted_at": timezone.now()},
        )
        return self._detail_response(obj)

    @extend_schema(
        operation_id="timesheets_bulk_submit",
        request=inline_serializer(
            name="BulkSubmitRequest",
            fields={"ids": serializers.ListField(child=serializers.IntegerField())},
        ),
        responses=inline_serializer(
            name="BulkSubmitResponse",
            fields={"submitted": serializers.IntegerField()},
        ),
    )
    @action(detail=False, methods=["post"], url_path="submit")
    def bulk_submit(self, request):
        ids = request.data.get("ids")
        if (
            not isinstance(ids, list)
            or not ids
            or any(not isinstance(i, int) or isinstance(i, bool) for i in ids)
        ):
            raise ValidationError({"ids": "A non-empty list of integer ids is required."})
        unique_ids = set(ids)
        with transaction.atomic():
            rows = list(
                TimesheetEntry.objects.select_for_update().filter(
                    pk__in=unique_ids,
                    owner=request.user,
                    status__in=list(EDITABLE),
                )
            )
            if len(rows) != len(unique_ids):
                raise ValidationError(
                    {"ids": "Some entries are missing, not yours, or not submittable."}
                )
            now = timezone.now()
            for row in rows:
                row = transition(
                    row,
                    actor=request.user,
                    to_status=TimesheetEntry.Status.SUBMITTED,
                    history_model=TimesheetStatusHistory,
                    history_fk="entry",
                    allowed_from=list(EDITABLE),
                    timestamps={"submitted_at": now},
                )
        return Response({"submitted": len(rows)})

    @extend_schema(request=DecisionSerializer, responses=TimesheetEntryDetailSerializer)
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._decide(request, pk, TimesheetEntry.Status.APPROVED, False)

    @extend_schema(request=DecisionSerializer, responses=TimesheetEntryDetailSerializer)
    @action(detail=True, methods=["post"], url_path="return", url_name="return")
    def mark_returned(self, request, pk=None):
        return self._decide(request, pk, TimesheetEntry.Status.RETURNED, True)
