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
