from django.conf import settings
from django.db import models


class Notification(models.Model):
    """A single recipient notification (spec 005 US2, optional).

    Rows are written inside the same transaction as the status transition
    that caused them (see core.workflow.notify callers in the 003/004 views).
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    message = models.CharField(max_length=300)
    link = models.CharField(max_length=200, blank=True)  # frontend route
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["is_read", "-created_at", "-id"]  # unread first, then newest

    def __str__(self):
        return f"→ {self.user} — {self.message[:50]}"
