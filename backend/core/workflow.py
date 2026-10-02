"""Shared visibility / decision rules and the status-transition helper
used by employee_requests and timesheets (specs 003/004, docs/api.md)."""

from django.db import transaction
from django.db.models import Q
from rest_framework.exceptions import ValidationError


def visible_to(qs, user):
    """Scope a queryset of owned items to what `user` may see.

    employee → own; manager → own + direct reports' non-draft;
    hr → own + all non-draft. Drafts are private to their owner.
    """
    own = Q(owner=user)
    if user.role == "hr":
        return qs.filter(own | ~Q(status="draft"))
    if user.role == "manager":
        return qs.filter(own | (Q(owner__manager=user) & ~Q(status="draft")))
    return qs.filter(own)


def can_decide(user, owner):
    """True when `user` may approve/reject/return `owner`'s submitted item.

    Approver = owner's direct manager, or HR (any submitted item).
    Nobody decides their own item — including HR.
    """
    return user.pk != owner.pk and (
        user.role == "hr" or owner.manager_id == user.pk
    )


def pending_for(qs, user):
    """Submitted items awaiting the caller's decision."""
    q = Q(status="submitted") & ~Q(owner=user)
    if user.role == "hr":
        return qs.filter(q)
    if user.role == "manager":
        return qs.filter(q & Q(owner__manager=user))
    return qs.none()


def transition(
    obj,
    *,
    actor,
    to_status,
    history_model,
    history_fk,
    allowed_from,
    comment="",
    timestamps=None,
):
    """Atomically move `obj` to `to_status` and write a history row.

    Re-locks the row with select_for_update; wrong state → ValidationError
    (400). `timestamps` maps field names to values set alongside status.
    """
    with transaction.atomic():
        locked = type(obj).objects.select_for_update().get(pk=obj.pk)
        if locked.status not in allowed_from:
            raise ValidationError(
                {
                    "detail": (
                        f"Cannot change status from "
                        f"'{locked.status}' to '{to_status}'."
                    )
                }
            )
        from_status = locked.status
        locked.status = to_status
        for field, value in (timestamps or {}).items():
            setattr(locked, field, value)
        locked.save()
        history_model.objects.create(
            **{history_fk: locked},
            actor=actor,
            from_status=from_status,
            to_status=to_status,
            comment=comment,
        )
        return locked
