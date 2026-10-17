from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class Request(models.Model):
    class Type(models.TextChoices):
        LEAVE = "leave", _("Leave")
        EQUIPMENT = "equipment", _("Equipment")
        WFH = "wfh", _("Work from home")
        HR_SERVICE = "hr_service", _("HR service")
        GENERAL = "general", _("General")

    class Status(models.TextChoices):
        DRAFT = "draft", _("Draft")
        SUBMITTED = "submitted", _("Submitted")
        APPROVED = "approved", _("Approved")
        REJECTED = "rejected", _("Rejected")
        RETURNED = "returned", _("Returned")

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
