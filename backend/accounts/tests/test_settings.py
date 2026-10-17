import json
import os
import subprocess
import sys

from django.conf import settings
from django.test import Client, override_settings


class TestSecretsHygiene:
    def test_secret_key_is_set(self):
        assert settings.SECRET_KEY

    def test_env_is_gitignored(self):
        root_gitignore = settings.BASE_DIR.parent / ".gitignore"
        assert ".env" in root_gitignore.read_text()

    @override_settings(ALLOWED_HOSTS=["example.com"], DEBUG=False)
    def test_debug_false_honours_allowed_hosts(self):
        client = Client()
        # Disallowed host → Django turns DisallowedHost into a 400.
        assert client.get("/", SERVER_NAME="evil.example.org").status_code == 400
        # Allowed host passes the host check (404 here — no such route).
        assert client.get("/", SERVER_NAME="example.com").status_code == 404


def _settings_subprocess(debug: str):
    """Load settings in a fresh interpreter and dump the HTTPS flags."""
    env = {
        k: v
        for k, v in os.environ.items()
        if k
        not in {
            "SECURE_SSL_REDIRECT",
            "SESSION_COOKIE_SECURE",
            "CSRF_COOKIE_SECURE",
            "SECURE_HSTS_SECONDS",
        }
    }
    env.update(
        {
            "DJANGO_SETTINGS_MODULE": "config.settings",
            "DEBUG": debug,
            "ALLOWED_HOSTS": "example.com",
        }
    )
    out = subprocess.run(
        [
            sys.executable,
            "-c",
            "import django, json; django.setup();"
            "from django.conf import settings as s;"
            "print(json.dumps([s.SECURE_SSL_REDIRECT, s.SESSION_COOKIE_SECURE,"
            " s.CSRF_COOKIE_SECURE, s.SECURE_HSTS_SECONDS]))",
        ],
        cwd=settings.BASE_DIR,
        env=env,
        capture_output=True,
        text=True,
        check=True,
    )
    return json.loads(out.stdout.strip())


class TestHttpsHardening:
    def test_production_defaults_turn_https_on(self):
        assert _settings_subprocess("False") == [True, True, True, 2592000]

    def test_debug_defaults_leave_https_off(self):
        assert _settings_subprocess("True") == [False, False, False, 0]

    @override_settings(
        DEBUG=False,
        ALLOWED_HOSTS=["example.com"],
        SECURE_SSL_REDIRECT=True,
        SECURE_HSTS_SECONDS=2592000,
        SECURE_PROXY_SSL_HEADER=("HTTP_X_FORWARDED_PROTO", "https"),
    )
    def test_http_redirects_but_forwarded_https_does_not(self):
        client = Client()
        res = client.get("/api/me/", SERVER_NAME="example.com")
        assert res.status_code == 301
        assert res["Location"].startswith("https://example.com")

        res = client.get(
            "/api/me/",
            SERVER_NAME="example.com",
            HTTP_X_FORWARDED_PROTO="https",
        )
        assert res.status_code == 401  # unauthenticated, not a redirect
        assert "max-age=2592000" in res["Strict-Transport-Security"]
