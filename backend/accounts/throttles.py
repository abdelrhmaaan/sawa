from rest_framework.throttling import SimpleRateThrottle


class LoginEmailThrottle(SimpleRateThrottle):
    """Per-account login limit, keyed on the submitted email so rotating
    IPs can't bypass it."""

    scope = "login_email"

    def get_cache_key(self, request, view):
        data = request.data
        email = data.get("email") if hasattr(data, "get") else None
        if not isinstance(email, str) or not email.strip():
            return None
        return self.cache_format % {
            "scope": self.scope,
            "ident": email.strip().lower(),
        }


class LoginIPThrottle(SimpleRateThrottle):
    """Per-client-IP login limit — stops one machine spraying many accounts."""

    scope = "login_ip"

    def get_cache_key(self, request, view):
        return self.cache_format % {
            "scope": self.scope,
            "ident": self.get_ident(request),
        }
