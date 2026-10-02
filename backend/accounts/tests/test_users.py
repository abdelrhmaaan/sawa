import pytest
from django.core.exceptions import ValidationError
from django.test import Client

from accounts.models import User

USERS = "/api/users/"


@pytest.fixture
def org(hr_user, manager_a, manager_b, emp_a1, emp_a2, emp_b1):
    return [hr_user, manager_a, manager_b, emp_a1, emp_a2, emp_b1]


def url(user):
    return f"{USERS}{user.pk}/"


@pytest.mark.django_db
class TestUserListVisibility:
    def test_hr_lists_all(self, auth_client, hr_user, org):
        res = auth_client(hr_user).get(USERS)
        assert res.status_code == 200
        assert res.data["count"] == len(org)

    def test_manager_lists_self_and_direct_reports(
        self, auth_client, manager_a, emp_a1, emp_a2, emp_b1, manager_b, hr_user
    ):
        res = auth_client(manager_a).get(USERS)
        ids = {u["id"] for u in res.data["results"]}
        assert ids == {manager_a.pk, emp_a1.pk, emp_a2.pk}

    def test_employee_list_forbidden(self, auth_client, employee):
        res = auth_client(employee).get(USERS)
        assert res.status_code == 403

    def test_list_pagination_envelope(self, auth_client, hr_user, org):
        res = auth_client(hr_user).get(USERS)
        for key in ("count", "next", "previous", "results"):
            assert key in res.data

    def test_page_size_clamped_to_100(self, auth_client, hr_user, make_user, org):
        for i in range(105):
            make_user(f"bulk{i}@test.dev")
        res = auth_client(hr_user).get(f"{USERS}?page_size=500")
        assert len(res.data["results"]) == 100


@pytest.mark.django_db
class TestUserDetailVisibility:
    def test_manager_cannot_read_other_teams_report(
        self, auth_client, manager_a, emp_b1
    ):
        assert auth_client(manager_a).get(url(emp_b1)).status_code == 404

    def test_manager_reads_self_and_own_report(
        self, auth_client, manager_a, emp_a1
    ):
        assert auth_client(manager_a).get(url(manager_a)).status_code == 200
        assert auth_client(manager_a).get(url(emp_a1)).status_code == 200

    def test_employee_reads_self_only(self, auth_client, employee, manager_a):
        assert auth_client(employee).get(url(employee)).status_code == 200
        assert auth_client(employee).get(url(manager_a)).status_code == 404

    def test_hr_reads_anyone(self, auth_client, hr_user, employee):
        assert auth_client(hr_user).get(url(employee)).status_code == 200


@pytest.mark.django_db
class TestManagerAssignmentValidation:
    def test_self_manager_rejected(self, employee):
        employee.manager = employee
        with pytest.raises(ValidationError):
            employee.full_clean()

    def test_cycle_rejected(self, manager_a, emp_a1):
        manager_a.manager = emp_a1  # emp_a1 → manager_a → emp_a1
        with pytest.raises(ValidationError):
            manager_a.full_clean()


@pytest.mark.django_db
class TestAdminPath:
    def test_hr_staff_reaches_admin(self, hr_user):
        client = Client()
        client.force_login(hr_user)
        assert client.get("/admin/").status_code == 200
        assert client.get("/admin/accounts/user/").status_code == 200

    def test_hr_can_change_role_and_manager_via_admin(
        self, hr_user, employee, manager_b
    ):
        client = Client()
        client.force_login(hr_user)
        res = client.post(
            f"/admin/accounts/user/{employee.pk}/change/",
            {
                "email": employee.email,
                "first_name": employee.first_name,
                "last_name": employee.last_name,
                "role": "manager",
                "department": "Ops",
                "manager": str(manager_b.pk),
                "is_active": "on",
                "_save": "Save",
            },
        )
        assert res.status_code == 302, res.context["errors"] if hasattr(res, "context") and res.context else ""
        employee.refresh_from_db()
        assert employee.role == "manager"
        assert employee.manager_id == manager_b.pk

    def test_employee_cannot_reach_admin(self, employee):
        client = Client()
        client.force_login(employee)
        assert client.get("/admin/").status_code == 302
