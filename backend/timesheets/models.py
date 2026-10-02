import datetime
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class TimesheetEntry(models.Model):
    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        RETURNED = "returned", "Returned"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="timesheet_entries",
    )
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    hours = models.DecimalField(max_digits=4, decimal_places=2)
    note = models.CharField(max_length=500, blank=True)
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-date", "-start_time", "-id"]

    def __str__(self):
        return f"{self.owner} — {self.date} {self.start_time}-{self.end_time} ({self.status})"

    def clean(self):
        errors = {}
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            errors["end_time"] = "End time must be after start time."
        if self.date and self.date > timezone.localdate():
            errors["date"] = "Date cannot be in the future."
        if self.date and self.start_time and self.end_time and self.owner_id:
            overlap = (
                TimesheetEntry.objects.filter(
                    owner_id=self.owner_id,
                    date=self.date,
                    start_time__lt=self.end_time,
                    end_time__gt=self.start_time,
                )
                .exclude(pk=self.pk)
                .exists()
            )
            if overlap:
                errors["start_time"] = (
                    "This entry overlaps another entry on the same date."
                )
        if errors:
            raise ValidationError(errors)

    def save(self, *args, **kwargs):
        if self.start_time and self.end_time:
            start = datetime.datetime.combine(self.date, self.start_time)
            end = datetime.datetime.combine(self.date, self.end_time)
            delta = Decimal(str((end - start).total_seconds() / 3600))
            self.hours = delta.quantize(Decimal("0.01"))
        super().save(*args, **kwargs)


class TimesheetStatusHistory(models.Model):
    entry = models.ForeignKey(
        TimesheetEntry, on_delete=models.CASCADE, related_name="history"
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="+"
    )
    from_status = models.CharField(max_length=20, null=True)
    to_status = models.CharField(max_length=20)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
