import datetime
from decimal import Decimal

import pytest
from django.utils import timezone

TS = "/api/timesheets/"


@pytest.fixture
def seeded(make_entry, emp_a1, emp_a2, emp_b1, hr_user, manager_a):
    d = timezone.localdate() - datetime.timedelta(days=2)
    d2 = d - datetime.timedelta(days=1)
    return {
        "a1_draft": make_entry(emp_a1, date=d, start=datetime.time(9), end=datetime.time(11)),
        "a1_sub": make_entry(emp_a1, status="submitted", date=d, start=datetime.time(13), end=datetime.time(17)),
        "a2_appr": make_entry(emp_a2, status="approved", date=d2),
        "b1_sub": make_entry(emp_b1, status="submitted", date=d2),
        "hr_draft": make_entry(hr_user, date=d, start=datetime.time(9), end=datetime.time(10)),
        "hr_sub": make_entry(hr_user, status="submitted", date=d2, start=datetime.time(10), end=datetime.time(12)),
        "mgr_sub": make_entry(manager_a, status="submitted", date=d),
    }


@pytest.mark.django_db
class TestVisibility:
    def test_employee_sees_only_own(self, auth_client, emp_a1, seeded):
        res = auth_client(emp_a1).get(TS)
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_draft"].pk, seeded["a1_sub"].pk}

    def test_manager_scope(self, auth_client, manager_a, seeded):
        res = auth_client(manager_a).get(TS)
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_sub"].pk, seeded["a2_appr"].pk, seeded["mgr_sub"].pk}

    def test_manager_cannot_read_reports_draft(self, auth_client, manager_a, seeded):
        assert (
            auth_client(manager_a).get(f"{TS}{seeded['a1_draft'].pk}/").status_code
            == 404
        )

    def test_hr_scope(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(TS)
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {
            seeded["a1_sub"].pk,
            seeded["a2_appr"].pk,
            seeded["b1_sub"].pk,
            seeded["hr_draft"].pk,
            seeded["hr_sub"].pk,
            seeded["mgr_sub"].pk,
        }


@pytest.mark.django_db
class TestFiltersAndTotals:
    def test_status_filter(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(TS, {"status": "submitted"})
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_sub"].pk, seeded["b1_sub"].pk, seeded["hr_sub"].pk, seeded["mgr_sub"].pk}

    def test_owner_filter_narrows_scope(self, auth_client, emp_a1, seeded):
        res = auth_client(emp_a1).get(TS, {"owner": seeded["b1_sub"].owner_id})
        assert res.data["results"] == []

    def test_date_range(self, auth_client, hr_user, seeded):
        today = timezone.localdate()
        res = auth_client(hr_user).get(
            TS, {"date_from": today.isoformat()}
        )
        assert res.data["results"] == []
        res = auth_client(hr_user).get(
            TS, {"date_to": (today - datetime.timedelta(days=3)).isoformat()}
        )
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a2_appr"].pk, seeded["b1_sub"].pk, seeded["hr_sub"].pk}

    def test_pending_my_action(self, auth_client, manager_a, hr_user, seeded):
        res = auth_client(manager_a).get(TS, {"pending_my_action": "true"})
        assert {r["id"] for r in res.data["results"]} == {seeded["a1_sub"].pk}
        res = auth_client(hr_user).get(TS, {"pending_my_action": "true"})
        assert {r["id"] for r in res.data["results"]} == {
            seeded["a1_sub"].pk,
            seeded["b1_sub"].pk,
            seeded["mgr_sub"].pk,
        }

    def test_total_hours_sums_filtered_scope(self, auth_client, emp_a1, seeded):
        res = auth_client(emp_a1).get(TS)
        # own entries: 2h draft + 4h submitted
        assert Decimal(res.data["total_hours"]) == Decimal("6.00")
        res = auth_client(emp_a1).get(TS, {"status": "draft"})
        assert Decimal(res.data["total_hours"]) == Decimal("2.00")

    def test_default_ordering_newest_date_first(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(TS)
        dates = [r["date"] for r in res.data["results"]]
        assert dates == sorted(dates, reverse=True)


@pytest.mark.django_db
class TestTimeline:
    def test_detail_embeds_ordered_history(
        self, auth_client, employee, manager_a, make_entry
    ):
        entry = make_entry(employee)
        client = auth_client(employee)
        client.post(f"{TS}{entry.pk}/submit/")
        auth_client(manager_a).post(
            f"{TS}{entry.pk}/return/", {"comment": "fix"}, format="json"
        )
        res = client.get(f"{TS}{entry.pk}/")
        hist = res.data["history"]
        assert [h["to_status"] for h in hist] == ["draft", "submitted", "returned"]
        assert hist[-1]["actor"]["id"] == manager_a.pk
