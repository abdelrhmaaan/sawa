import pytest

from accounts.models import User

ME = "/api/me/"


@pytest.mark.django_db
class TestMeRead:
    def test_get_returns_own_profile(self, auth_client, employee):
        res = auth_client(employee).get(ME)
        assert res.status_code == 200
        for field in ("email", "first_name", "last_name", "role", "department", "manager"):
            assert field in res.data
        assert res.data["manager"]["id"] == employee.manager_id


@pytest.mark.django_db
class TestMeUpdate:
    def test_patch_names_persist(self, auth_client, employee):
        client = auth_client(employee)
        res = client.patch(
            ME, {"first_name": "New", "last_name": "Name"}, format="json"
        )
        assert res.status_code == 200
        employee.refresh_from_db()
        assert employee.first_name == "New"
        assert employee.last_name == "Name"

    def test_patch_read_only_fields_silently_ignored(
        self, auth_client, employee, manager_b
    ):
        client = auth_client(employee)
        before = {f: getattr(employee, f) for f in ("role", "email", "department", "manager_id")}
        res = client.patch(
            ME,
            {
                "role": "hr",
                "email": "hacker@test.dev",
                "department": "Infiltrated",
                "manager": manager_b.pk,
                "first_name": "Legit",
            },
            format="json",
        )
        assert res.status_code == 200
        employee.refresh_from_db()
        after = {f: getattr(employee, f) for f in ("role", "email", "department", "manager_id")}
        assert after == before
        assert employee.first_name == "Legit"

    def test_patch_blank_name_400(self, auth_client, employee):
        res = auth_client(employee).patch(ME, {"first_name": ""}, format="json")
        assert res.status_code == 400
