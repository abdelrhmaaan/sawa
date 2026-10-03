from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from core.serializers import DecisionSerializer
from core.workflow import (
    can_decide,
    notify,
    submission_recipients,
    transition,
    visible_to,
)

from .filters import RequestFilter
from .models import Request, RequestStatusHistory
from .serializers import (
    RequestDetailSerializer,
    RequestSerializer,
)

EDITABLE = (Request.Status.DRAFT, Request.Status.RETURNED)


@extend_schema_view(
    list=extend_schema(tags=["requests"]),
    retrieve=extend_schema(tags=["requests"]),
    create=extend_schema(tags=["requests"]),
    update=extend_schema(tags=["requests"]),
    partial_update=extend_schema(tags=["requests"]),
    destroy=extend_schema(tags=["requests"]),
)
class RequestViewSet(viewsets.ModelViewSet):
    """Employee requests: owner-scoped CRUD + submit/approve/reject/return.

    Check order on object endpoints (per docs/api.md):
    1. not visible → 404 (scoped queryset)
    2. relationship not allowed → 403 (owner-only / can_decide)
    3. wrong state or bad input → 400
    """

    lookup_value_regex = r"\d+"
    filterset_class = RequestFilter
    ordering_fields = ["created_at", "updated_at", "status"]
    ordering = ["-created_at", "-id"]

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False) or not self.request.user.is_authenticated:
            return Request.objects.none()
        qs = Request.objects.select_related("owner", "owner__manager").prefetch_related(
            "history__actor"
        )
        return visible_to(qs, self.request.user)

    def get_serializer_class(self):
        if self.action == "retrieve":
            return RequestDetailSerializer
        return RequestSerializer

    def _detail_response(self, obj):
        return Response(
            RequestDetailSerializer(obj, context={"request": self.request}).data
        )

    def _require_owner(self, obj):
        if obj.owner_id != self.request.user.pk:
            raise PermissionDenied()

    def perform_create(self, serializer):
        with transaction.atomic():
            obj = serializer.save(
                owner=self.request.user, status=Request.Status.DRAFT
            )
            RequestStatusHistory.objects.create(
                request=obj,
                actor=self.request.user,
                from_status=None,
                to_status=Request.Status.DRAFT,
                comment="",
            )

    def update(self, request, *args, **kwargs):
        # Owner/state checks run before body validation: 404 → 403 → 400.
        obj = self.get_object()
        self._require_owner(obj)
        if obj.status not in EDITABLE:
            raise ValidationError(
                {"detail": f"Cannot edit a request in status '{obj.status}'."}
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        self._require_owner(obj)
        if obj.status != Request.Status.DRAFT:
            raise ValidationError(
                {"detail": "Only draft requests can be deleted."}
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
        timestamps = {}
        if to_status in (Request.Status.APPROVED, Request.Status.REJECTED):
            timestamps["decided_at"] = timezone.now()
        with transaction.atomic():
            obj = transition(
                obj,
                actor=request.user,
                to_status=to_status,
                history_model=RequestStatusHistory,
                history_fk="request",
                allowed_from=[Request.Status.SUBMITTED],
                comment=comment,
                timestamps=timestamps,
            )
            notify(
                obj.owner,
                f'Your request "{obj.title}" was {to_status}.',
                link=f"/requests/{obj.pk}",
            )
        return self._detail_response(obj)

    @extend_schema(request=None, responses=RequestDetailSerializer)
    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        obj = self.get_object()
        self._require_owner(obj)
        with transaction.atomic():
            obj = transition(
                obj,
                actor=request.user,
                to_status=Request.Status.SUBMITTED,
                history_model=RequestStatusHistory,
                history_fk="request",
                allowed_from=list(EDITABLE),
                timestamps={"submitted_at": timezone.now()},
            )
            for recipient in submission_recipients(obj.owner):
                notify(
                    recipient,
                    f'{obj.owner.full_name} submitted "{obj.title}" for approval.',
                    link=f"/requests/{obj.pk}",
                )
        return self._detail_response(obj)

    @extend_schema(request=DecisionSerializer, responses=RequestDetailSerializer)
    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._decide(request, pk, Request.Status.APPROVED, False)

    @extend_schema(request=DecisionSerializer, responses=RequestDetailSerializer)
    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._decide(request, pk, Request.Status.REJECTED, True)

    @extend_schema(request=DecisionSerializer, responses=RequestDetailSerializer)
    @action(detail=True, methods=["post"], url_path="return", url_name="return")
    def mark_returned(self, request, pk=None):
        return self._decide(request, pk, Request.Status.RETURNED, True)
