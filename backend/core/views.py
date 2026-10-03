"""GET /api/dashboard/ — role-shaped aggregate payload (spec 005 US1).

All numbers are computed from the same scoped querysets as 003/004:
nothing here may widen visibility (constitution IV/VI).
"""

import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.utils import timezone
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import mixins, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Notification
from core.serializers import NotificationSerializer
from core.workflow import pending_for

User = get_user_model()


def _status_counts(qs, statuses):
    counts = {s: 0 for s in statuses}
    for row in qs.values("status").annotate(n=Count("pk")):
        counts[row["status"]] = row["n"]
    return counts


def _hours(qs):
    total = qs.aggregate(t=Sum("hours"))["t"] or Decimal("0")
    return str(Decimal(total).quantize(Decimal("0.01")))


def _week_range():
    monday = timezone.localdate() - datetime.timedelta(
        days=timezone.localdate().weekday()
    )
    return monday, monday + datetime.timedelta(days=6)


DASHBOARD_SCHEMA = inline_serializer(
    name="Dashboard",
    fields={
        "my_requests": serializers.DictField(child=serializers.IntegerField()),
        "my_entries": serializers.DictField(child=serializers.IntegerField()),
        "my_hours_this_week": serializers.CharField(),
        "team": inline_serializer(
            name="DashboardTeam",
            fields={
                "pending_requests": serializers.IntegerField(),
                "pending_timesheets": serializers.IntegerField(),
                "team_hours_this_week": serializers.CharField(),
            },
            required=False,
        ),
        "org": inline_serializer(
            name="DashboardOrg",
            fields={
                "pending_requests": serializers.IntegerField(),
                "pending_timesheets": serializers.IntegerField(),
                "hours_this_week": serializers.CharField(),
                "users_by_role": serializers.DictField(
                    child=serializers.IntegerField()
                ),
            },
            required=False,
        ),
    },
)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["dashboard"], responses=DASHBOARD_SCHEMA)
    def get(self, request):
        from employee_requests.models import Request
        from timesheets.models import TimesheetEntry

        user = request.user
        start, end = _week_range()

        payload = {
            "my_requests": _status_counts(
                Request.objects.filter(owner=user), Request.Status.values
            ),
            "my_entries": _status_counts(
                TimesheetEntry.objects.filter(owner=user),
                TimesheetEntry.Status.values,
            ),
            "my_hours_this_week": _hours(
                TimesheetEntry.objects.filter(
                    owner=user, date__range=(start, end)
                )
            ),
        }

        if user.role == "manager":
            payload["team"] = {
                "pending_requests": pending_for(
                    Request.objects.all(), user
                ).count(),
                "pending_timesheets": pending_for(
                    TimesheetEntry.objects.all(), user
                ).count(),
                "team_hours_this_week": _hours(
                    TimesheetEntry.objects.filter(
                        owner__manager=user,
                        date__range=(start, end),
                    ).exclude(status=TimesheetEntry.Status.DRAFT)
                ),
            }
        elif user.role == "hr":
            payload["org"] = {
                "pending_requests": pending_for(
                    Request.objects.all(), user
                ).count(),
                "pending_timesheets": pending_for(
                    TimesheetEntry.objects.all(), user
                ).count(),
                "hours_this_week": _hours(
                    TimesheetEntry.objects.filter(
                        date__range=(start, end)
                    ).exclude(status=TimesheetEntry.Status.DRAFT)
                ),
                "users_by_role": _role_counts(),
            }

        return Response(payload)


def _role_counts():
    counts = {r: 0 for r in User.Role.values}
    for row in User.objects.values("role").annotate(n=Count("pk")):
        counts[row["role"]] = row["n"]
    return counts


@extend_schema_view(
    list=extend_schema(tags=["notifications"]),
)
class NotificationViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Own notifications, unread first, paginated (spec 005 US2).

    The queryset is already scoped to the caller, so reading another user's
    notification id returns 404 — existence never leaks.
    """

    serializer_class = NotificationSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user.is_authenticated:
            return Notification.objects.none()
        return Notification.objects.filter(user=user)

    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        unread_count = qs.filter(is_read=False).count()
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page, many=True)
        response = self.get_paginated_response(serializer.data)
        response.data["unread_count"] = unread_count
        return response

    @extend_schema(request=None, responses=NotificationSerializer)
    @action(detail=True, methods=["post"], url_path="read")
    def mark_read(self, request, pk=None):
        obj = self.get_object()
        if not obj.is_read:
            obj.is_read = True
            obj.save(update_fields=["is_read"])
        return Response(self.get_serializer(obj).data)

    @extend_schema(
        request=None,
        responses=inline_serializer(
            name="ReadAllResponse",
            fields={"marked_read": serializers.IntegerField()},
        ),
    )
    @action(detail=False, methods=["post"], url_path="read-all")
    def read_all(self, request):
        marked = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"marked_read": marked})
