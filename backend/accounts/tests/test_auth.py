import pytest

from conftest import obtain_tokens

TOKEN_URL = "/api/auth/token/"
REFRESH_URL = "/api/auth/token/refresh/"


@pytest.mark.django_db
class TestTokenObtain:
    def test_obtain_returns_access_and_refresh(self, api_client, employee):
        res = obtain_tokens(api_client, employee.email, "pass1234!")
        assert res.status_code == 200
        assert res.data["access"]
        assert res.data["refresh"]

    def test_wrong_password_and_unknown_email_identical_401(
        self, api_client, employee
    ):
        res_wrong = obtain_tokens(api_client, employee.email, "wrong-pass")
        res_unknown = obtain_tokens(api_client, "ghost@test.dev", "pass1234!")
        assert res_wrong.status_code == 401
        assert res_unknown.status_code == 401
        assert res_wrong.data == res_unknown.data

    def test_inactive_user_obtain_401(self, api_client, make_user):
        user = make_user("inactive@test.dev")
        user.is_active = False
        user.save()
        res = obtain_tokens(api_client, user.email, "pass1234!")
        assert res.status_code == 401

    def test_email_lookup_case_insensitive(self, api_client, employee):
        res = obtain_tokens(api_client, employee.email.upper(), "pass1234!")
        assert res.status_code == 200


@pytest.mark.django_db
class TestProtectedAccess:
    def test_no_token_returns_401(self, api_client):
        assert api_client.get("/api/me/").status_code == 401
        assert api_client.get("/api/users/").status_code == 401

    def test_access_token_grants_me(self, api_client, employee):
        tokens = obtain_tokens(api_client, employee.email, "pass1234!").data
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        res = api_client.get("/api/me/")
        assert res.status_code == 200
        assert res.data["email"] == employee.email
        assert res.data["role"] == employee.role


@pytest.mark.django_db
class TestRefresh:
    def test_refresh_rotates_pair(self, api_client, employee):
        tokens = obtain_tokens(api_client, employee.email, "pass1234!").data
        res = api_client.post(
            REFRESH_URL, {"refresh": tokens["refresh"]}, format="json"
        )
        assert res.status_code == 200
        assert res.data["access"]
        assert res.data["refresh"]
        assert res.data["refresh"] != tokens["refresh"]

    def test_rotated_refresh_reuse_rejected(self, api_client, employee):
        tokens = obtain_tokens(api_client, employee.email, "pass1234!").data
        api_client.post(REFRESH_URL, {"refresh": tokens["refresh"]}, format="json")
        reuse = api_client.post(
            REFRESH_URL, {"refresh": tokens["refresh"]}, format="json"
        )
        assert reuse.status_code == 401

    def test_deactivated_user_refresh_401(self, api_client, employee):
        tokens = obtain_tokens(api_client, employee.email, "pass1234!").data
        employee.is_active = False
        employee.save()
        res = api_client.post(
            REFRESH_URL, {"refresh": tokens["refresh"]}, format="json"
        )
        assert res.status_code == 401
