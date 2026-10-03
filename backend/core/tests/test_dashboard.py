import datetime
from decimal import Decimal

import pytest
from django.utils import timezone

DASH = "/api/dashboard/"


def this_week():
    today = timezone.localdate()
    monday = today - datetime.timedelta(days=today.weekday())
    return monday


@pytest.fixture
def seeded(make_request, make_entry, emp_a1, emp_a2, emp_b1, hr_user, manager_a, manager_b):
    monday = this_week()
    last_week = monday - datetime.timedelta(days=7)
    t = datetime.time
    return {
        # requests
        "a1_draft_req": make_request(emp_a1),  # own draft counts in my_requests
        "a1_sub_req": make_request(emp_a1, status="submitted"),
        "a2_appr_req": make_request(emp_a2, status="approved"),
        "b1_sub_req": make_request(emp_b1, status="submitted"),
        "hr_sub_req": make_request(hr_user, status="submitted"),
        # timesheet entries this ISO week
        "a1_week_draft": make_entry(emp_a1, date=monday, start=t(9), end=t(11)),       # 2h
        "a1_week_sub": make_entry(emp_a1, status="submitted", date=monday, start=t(13), end=t(17)),  # 4h
        "a2_week_appr": make_entry(emp_a2, status="approved", date=monday, start=t(9), end=t(13)),   # 4h
        "b1_week_sub": make_entry(emp_b1, status="submitted", date=monday),          # 8h
        "hr_week_sub": make_entry(hr_user, status="submitted", date=monday, start=t(9), end=t(10)),  # 1h
        "mgr_week": make_entry(manager_a, status="approved", date=monday, start=t(9), end=t(10)),    # 1h
        # outside this week — must not count
        "a1_last_week": make_entry(emp_a1, status="approved", date=last_week),       # 8h
    }


@pytest.mark.django_db
class TestPayloadShape:
    def test_employee_shape(self, auth_client, emp_a1, seeded):
        res = auth_client(emp_a1).get(DASH)
        assert res.status_code == 200
        assert set(res.data.keys()) == {
            "my_requests",
            "my_entries",
            "my_hours_this_week",
        }
        assert set(res.data["my_requests"].keys()) == {
            "draft", "submitted", "approved", "rejected", "returned",
        }
        assert set(res.data["my_entries"].keys()) == {
            "draft", "submitted", "approved", "returned",
        }

    def test_manager_shape(self, auth_client, manager_a, seeded):
        res = auth_client(manager_a).get(DASH)
        assert "team" in res.data and "org" not in res.data
        assert set(res.data["team"].keys()) == {
            "pending_requests",
            "pending_timesheets",
            "team_hours_this_week",
        }

    def test_hr_shape(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(DASH)
        assert "org" in res.data and "team" not in res.data
        assert set(res.data["org"].keys()) == {
            "pending_requests",
            "pending_timesheets",
            "hours_this_week",
            "users_by_role",
        }
        assert set(res.data["org"]["users_by_role"].keys()) == {
            "employee", "manager", "hr",
        }


@pytest.mark.django_db
class TestNumbers:
    def test_employee_my_counts_include_drafts(self, auth_client, emp_a1, seeded):
        data = auth_client(emp_a1).get(DASH).data
        assert data["my_requests"]["draft"] == 1
        assert data["my_requests"]["submitted"] == 1
        assert data["my_requests"]["approved"] == 0
        assert data["my_entries"]["draft"] == 1
        assert data["my_entries"]["submitted"] == 1
        # own entries this week regardless of status: 2h draft + 4h submitted
        assert Decimal(data["my_hours_this_week"]) == Decimal("6.00")

    def test_manager_team(self, auth_client, manager_a, seeded):
        team = auth_client(manager_a).get(DASH).data["team"]
        # pending: a1_sub_req only (b1 belongs to manager B; hr req not a report)
        assert team["pending_requests"] == 1
        assert team["pending_timesheets"] == 1  # a1_week_sub
        # reports' non-draft this week: a1 4h + a2 4h = 8h (a1 draft excluded)
        assert Decimal(team["team_hours_this_week"]) == Decimal("8.00")

    def test_hr_org(self, auth_client, hr_user, seeded):
        org = auth_client(hr_user).get(DASH).data["org"]
        # all submitted not-own: a1_sub_req + b1_sub_req (hr_sub_req excluded)
        assert org["pending_requests"] == 2
        assert org["pending_timesheets"] == 2  # a1_week_sub + b1_week_sub
        # all non-draft this week: 4+4+8+1+1 = 18h
        assert Decimal(org["hours_this_week"]) == Decimal("18.00")
        assert org["users_by_role"]["employee"] == 3
        assert org["users_by_role"]["manager"] == 2
        assert org["users_by_role"]["hr"] == 1


@pytest.mark.django_db
class TestAttack:
    def test_manager_a_excludes_manager_b_team(
        self, auth_client, manager_b, seeded
    ):
        team = auth_client(manager_b).get(DASH).data["team"]
        assert team["pending_requests"] == 1  # b1_sub_req only, not team A's
        assert team["pending_timesheets"] == 1  # b1_week_sub only
        assert Decimal(team["team_hours_this_week"]) == Decimal("8.00")

    def test_unauthenticated_401(self, api_client):
        assert api_client.get(DASH).status_code == 401
