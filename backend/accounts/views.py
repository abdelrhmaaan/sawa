from django.db.models import Q
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import generics, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    EmailTokenObtainPairSerializer,
    MeSerializer,
    UserSerializer,
)
from .throttles import LoginEmailThrottle, LoginIPThrottle


@extend_schema(tags=["auth"])
class LoginView(TokenObtainPairView):
    """Email+password → JWT pair. Rate-limited per email and per client IP
    to blunt credential guessing; token refresh is deliberately not
    throttled (it already requires a valid refresh token)."""

    serializer_class = EmailTokenObtainPairSerializer
    throttle_classes = [LoginIPThrottle, LoginEmailThrottle]


@extend_schema(tags=["me"])
class MeView(generics.RetrieveUpdateAPIView):
    """Read/update the caller's own profile. Only first/last name are
    writable; role, email, department and manager are read-only."""

    serializer_class = MeSerializer
    http_method_names = ["get", "patch", "head", "options"]

    def get_object(self):
        return self.request.user


@extend_schema_view(
    list=extend_schema(tags=["users"]),
    retrieve=extend_schema(tags=["users"]),
)
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """Scoped, read-only user directory.

    hr → all users; manager → self + direct reports; employee → self only
    (the list action itself is forbidden for employees). Objects outside
    the caller's scope return 404.
    """

    serializer_class = UserSerializer

    def get_queryset(self):
        user = self.request.user
        if getattr(self, "swagger_fake_view", False) or not user.is_authenticated:
            return User.objects.none()
        if user.role == User.Role.HR:
            return User.objects.all()
        if user.role == User.Role.MANAGER:
            return User.objects.filter(Q(pk=user.pk) | Q(manager=user))
        return User.objects.filter(pk=user.pk)

    def list(self, request, *args, **kwargs):
        if request.user.role == User.Role.EMPLOYEE:
            raise PermissionDenied()
        return super().list(request, *args, **kwargs)
