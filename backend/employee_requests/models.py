from django.conf import settings
from django.db import models


class Request(models.Model):
    class Type(models.TextChoices):
        LEAVE = "leave", "Leave"
        EQUIPMENT = "equipment", "Equipment"
        WFH = "wfh", "Work from home"
        HR_SERVICE = "hr_service", "HR service"
        GENERAL = "general", "General"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SUBMITTED = "submitted", "Submitted"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        RETURNED = "returned", "Returned"

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="requests"
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.DRAFT
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"{self.owner} — {self.title} ({self.status})"


class RequestStatusHistory(models.Model):
    request = models.ForeignKey(
        Request, on_delete=models.CASCADE, related_name="history"
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
