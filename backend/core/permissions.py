from rest_framework.permissions import BasePermission


class IsHR(BasePermission):
    def has_permission(self, request, view):
        return _role_is(request, "hr")


class IsManagerOrHR(BasePermission):
    def has_permission(self, request, view):
        return _role_is(request, "manager", "hr")


def _role_is(request, *roles):
    user = getattr(request, "user", None)
    return bool(
        user and user.is_authenticated and getattr(user, "role", None) in roles
    )


def get_approver(user):
    """Approver of a user's items: direct manager, else an HR user.

    Never returns the user themself (a user must never approve their own
    items). Returns None when there is no manager and no other HR user.
    """
    if user.manager_id and user.manager_id != user.pk:
        return user.manager
    from accounts.models import User

    return (
        User.objects.filter(role=User.Role.HR, is_active=True)
        .exclude(pk=user.pk)
        .first()
    )
