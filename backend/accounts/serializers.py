from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User


class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Email+password login. Lookup is case-insensitive via the user
    manager's get_by_natural_key; inactive users are rejected by
    ModelBackend with the same generic error as bad credentials."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token


class ActiveUserTokenRefreshSerializer(TokenRefreshSerializer):
    """Reject refresh tokens whose user has been deactivated."""

    def validate(self, attrs):
        refresh = RefreshToken(attrs["refresh"])
        user = User.objects.filter(pk=refresh.get("user_id")).first()
        if user is None or not user.is_active:
            raise AuthenticationFailed("No active account found")
        return super().validate(attrs)


class ManagerMixin(serializers.Serializer):
    manager = serializers.SerializerMethodField()

    @extend_schema_field({"type": "object", "nullable": True})
    def get_manager(self, obj):
        m = obj.manager
        if m is None:
            return None
        return {"id": m.pk, "name": m.full_name, "email": m.email}


class MeSerializer(ManagerMixin, serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "manager",
        ]
        read_only_fields = ["email", "role", "department", "manager"]


class UserSerializer(ManagerMixin, serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "department",
            "manager",
            "is_active",
        ]
