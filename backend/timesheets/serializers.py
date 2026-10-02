from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from core.serializers import OwnerRefMixin, StatusHistorySerializer

from .models import TimesheetEntry, TimesheetStatusHistory


class TimesheetStatusHistorySerializer(StatusHistorySerializer):
    class Meta:
        model = TimesheetStatusHistory
        fields = ["id", "actor", "from_status", "to_status", "comment", "created_at"]


class TimesheetEntrySerializer(OwnerRefMixin, serializers.ModelSerializer):
    class Meta:
        model = TimesheetEntry
        fields = [
            "id",
            "owner",
            "date",
            "start_time",
            "end_time",
            "hours",
            "note",
            "status",
            "created_at",
            "updated_at",
            "submitted_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "owner",
            "hours",
            "status",
            "created_at",
            "updated_at",
            "submitted_at",
            "reviewed_at",
        ]

    def validate(self, attrs):
        merged = {}
        for field in ("date", "start_time", "end_time", "note"):
            if field in attrs:
                merged[field] = attrs[field]
            elif self.instance is not None:
                merged[field] = getattr(self.instance, field)
            else:
                merged[field] = TimesheetEntry._meta.get_field(field).get_default()
        owner = (
            self.instance.owner
            if self.instance is not None
            else self.context["request"].user
        )
        probe = TimesheetEntry(
            pk=self.instance.pk if self.instance is not None else None,
            owner=owner,
            **merged,
        )
        try:
            probe.clean()
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                exc.message_dict if hasattr(exc, "message_dict") else exc.messages
            )
        return attrs


class TimesheetEntryDetailSerializer(TimesheetEntrySerializer):
    history = TimesheetStatusHistorySerializer(many=True, read_only=True)

    class Meta(TimesheetEntrySerializer.Meta):
        fields = TimesheetEntrySerializer.Meta.fields + ["history"]
