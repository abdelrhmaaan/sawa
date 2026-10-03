"""Shared serializer helpers: compact user references and the common
status-history shape used by employee_requests and timesheets."""

from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from .models import Notification

USER_REF_SCHEMA = {
    "type": "object",
    "nullable": True,
    "properties": {
        "id": {"type": "integer"},
        "name": {"type": "string"},
        "email": {"type": "string"},
    },
}


def user_ref(user):
    if user is None:
        return None
    return {"id": user.pk, "name": user.full_name, "email": user.email}


class OwnerRefMixin(serializers.Serializer):
    owner = serializers.SerializerMethodField()

    @extend_schema_field(USER_REF_SCHEMA)
    def get_owner(self, obj):
        return user_ref(obj.owner)


class StatusHistorySerializer(serializers.ModelSerializer):
    """Base for the per-app history serializers — subclass sets Meta.model."""

    actor = serializers.SerializerMethodField()

    @extend_schema_field(USER_REF_SCHEMA)
    def get_actor(self, obj):
        return user_ref(obj.actor)


class DecisionSerializer(serializers.Serializer):
    """Body for approve/reject/return actions (comment optional/required per action)."""

    comment = serializers.CharField(
        required=False, allow_blank=True, trim_whitespace=True, max_length=2000
    )


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "message", "link", "is_read", "created_at"]
        read_only_fields = fields
