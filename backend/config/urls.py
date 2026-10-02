from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from accounts.serializers import (
    ActiveUserTokenRefreshSerializer,
    EmailTokenObtainPairSerializer,
)
from accounts.views import MeView, UserViewSet

router = DefaultRouter()
router.register("users", UserViewSet, basename="user")

urlpatterns = [
    path("admin/", admin.site.urls),
    path(
        "api/schema/",
        SpectacularAPIView.as_view(permission_classes=[AllowAny]),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[AllowAny]),
        name="docs",
    ),
    path(
        "api/auth/token/",
        TokenObtainPairView.as_view(serializer_class=EmailTokenObtainPairSerializer),
        name="token_obtain_pair",
    ),
    path(
        "api/auth/token/refresh/",
        TokenRefreshView.as_view(serializer_class=ActiveUserTokenRefreshSerializer),
        name="token_refresh",
    ),
    path("api/me/", MeView.as_view(), name="me"),
    path("api/", include(router.urls)),
]
