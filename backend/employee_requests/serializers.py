from rest_framework import serializers

from core.serializers import (
    DecisionSerializer,
    OwnerRefMixin,
    StatusHistorySerializer,
)

__all__ = [
    "DecisionSerializer",
    "RequestSerializer",
    "RequestDetailSerializer",
    "RequestStatusHistorySerializer",
]

from .models import Request, RequestStatusHistory


class RequestStatusHistorySerializer(StatusHistorySerializer):
    class Meta:
        model = RequestStatusHistory
        fields = ["id", "actor", "from_status", "to_status", "comment", "created_at"]


class RequestSerializer(OwnerRefMixin, serializers.ModelSerializer):
    class Meta:
        model = Request
        fields = [
            "id",
            "owner",
            "type",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
            "submitted_at",
            "decided_at",
        ]
        read_only_fields = [
            "owner",
            "status",
            "created_at",
            "updated_at",
            "submitted_at",
            "decided_at",
        ]


class RequestDetailSerializer(RequestSerializer):
    history = RequestStatusHistorySerializer(many=True, read_only=True)

    class Meta(RequestSerializer.Meta):
        fields = RequestSerializer.Meta.fields + ["history"]

