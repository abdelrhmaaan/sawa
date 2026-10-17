import pytest
from rest_framework_simplejwt.tokens import RefreshToken

from conftest import obtain_tokens

TOKEN_URL = "/api/auth/token/"
REFRESH_URL = "/api/auth/token/refresh/"


def post_login(client, email, password="whatever"):
    return client.post(
        TOKEN_URL, {"email": email, "password": password}, format="json"
    )


@pytest.mark.django_db
class TestLoginEmailThrottle:
    def test_sixth_attempt_is_429_even_with_correct_password(
        self, api_client, employee
    ):
        for _ in range(5):
            res = post_login(api_client, employee.email, "wrong-pass")
            assert res.status_code == 401

        res = post_login(api_client, employee.email, "wrong-pass")
        assert res.status_code == 429
        assert isinstance(res.data["detail"], str)

        # Lockout applies regardless of the password being right.
        res = post_login(api_client, employee.email, "pass1234!")
        assert res.status_code == 429

    def test_email_normalization_shares_one_bucket(self, api_client, employee):
        variants = [
            employee.email,
            employee.email.upper(),
            f" {employee.email} ",
            f" {employee.email.upper()}",
            employee.email,
        ]
        for variant in variants:
            res = post_login(api_client, variant, "wrong-pass")
            assert res.status_code == 401

        res = post_login(api_client, employee.email, "wrong-pass")
        assert res.status_code == 429

    def test_other_account_not_throttled_from_same_ip(
        self, api_client, employee, make_user
    ):
        other = make_user("other@test.dev")
        for _ in range(5):
            post_login(api_client, employee.email, "wrong-pass")
        assert post_login(api_client, employee.email).status_code == 429

        res = obtain_tokens(api_client, other.email, "pass1234!")
        assert res.status_code == 200

    def test_missing_email_is_not_throttled(self, api_client):
        res = api_client.post(TOKEN_URL, {"password": "x"}, format="json")
        assert res.status_code in (400, 401)


@pytest.mark.django_db
class TestLoginIPThrottle:
    def test_twenty_first_attempt_from_one_ip_is_429(self, api_client):
        for i in range(20):
            res = post_login(api_client, f"ghost{i}@test.dev")
            assert res.status_code == 401
        res = post_login(api_client, "ghost20@test.dev")
        assert res.status_code == 429
        assert isinstance(res.data["detail"], str)


@pytest.mark.django_db
class TestRefreshNotThrottled:
    def test_refresh_works_while_login_is_throttled(self, api_client, employee):
        for _ in range(5):
            post_login(api_client, employee.email, "wrong-pass")
        assert post_login(api_client, employee.email).status_code == 429

        res = api_client.post(
            REFRESH_URL,
            {"refresh": str(RefreshToken.for_user(employee))},
            format="json",
        )
        assert res.status_code == 200
        assert res.data["access"]
