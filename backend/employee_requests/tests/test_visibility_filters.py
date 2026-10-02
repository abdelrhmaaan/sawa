import pytest
from django.utils import timezone

from employee_requests.models import Request

REQ = "/api/requests/"


@pytest.fixture
def seeded(make_request, emp_a1, emp_a2, emp_b1, hr_user, manager_a):
    return {
        "a1_draft": make_request(emp_a1, title="a1 draft"),
        "a1_sub": make_request(emp_a1, status="submitted", title="a1 sub"),
        "a2_appr": make_request(emp_a2, status="approved", title="a2 appr", type="leave"),
        "b1_sub": make_request(emp_b1, status="submitted", title="b1 sub"),
        "hr_draft": make_request(hr_user, title="hr draft"),
        "hr_sub": make_request(hr_user, status="submitted", title="hr sub"),
        "mgr_sub": make_request(manager_a, status="submitted", title="mgr sub"),
    }


@pytest.mark.django_db
class TestVisibility:
    def test_employee_sees_only_own(self, auth_client, emp_a1, seeded):
        res = auth_client(emp_a1).get(REQ)
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_draft"].pk, seeded["a1_sub"].pk}

    def test_manager_sees_own_plus_reports_non_draft(self, auth_client, manager_a, seeded):
        res = auth_client(manager_a).get(REQ)
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {
            seeded["a1_sub"].pk,
            seeded["a2_appr"].pk,
            seeded["mgr_sub"].pk,
        }

    def test_manager_cannot_read_reports_draft(self, auth_client, manager_a, seeded):
        res = auth_client(manager_a).get(f"{REQ}{seeded['a1_draft'].pk}/")
        assert res.status_code == 404

    def test_hr_sees_all_non_draft_plus_own_drafts(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(REQ)
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
class TestFilters:
    def test_status_filter(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(f"{REQ}?status=submitted")
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_sub"].pk, seeded["b1_sub"].pk, seeded["hr_sub"].pk, seeded["mgr_sub"].pk}

    def test_type_filter(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(f"{REQ}?type=leave")
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a2_appr"].pk}

    def test_owner_filter_narrows_scope(self, auth_client, emp_a1, seeded):
        res = auth_client(emp_a1).get(f"{REQ}?owner={seeded['b1_sub'].owner_id}")
        assert res.data["results"] == []

    def test_created_window_filters(self, auth_client, hr_user, seeded):
        future = (timezone.now() + timezone.timedelta(days=1)).isoformat()
        past = (timezone.now() - timezone.timedelta(days=1)).isoformat()
        res = auth_client(hr_user).get(REQ, {"created_after": future})
        assert res.data["results"] == []
        res = auth_client(hr_user).get(
            REQ, {"created_after": past, "created_before": future}
        )
        assert res.data["count"] == 6

    def test_pending_my_action(self, auth_client, manager_a, hr_user, seeded):
        res = auth_client(manager_a).get(f"{REQ}?pending_my_action=true")
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_sub"].pk}
        res = auth_client(hr_user).get(f"{REQ}?pending_my_action=true")
        ids = {r["id"] for r in res.data["results"]}
        assert ids == {seeded["a1_sub"].pk, seeded["b1_sub"].pk, seeded["mgr_sub"].pk}


@pytest.mark.django_db
class TestOrderingPagination:
    def test_default_ordering_newest_first(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(REQ)
        created = [r["created_at"] for r in res.data["results"]]
        assert created == sorted(created, reverse=True)

    def test_ordering_status(self, auth_client, hr_user, seeded):
        res = auth_client(hr_user).get(f"{REQ}?ordering=status")
        statuses = [r["status"] for r in res.data["results"]]
        assert statuses == sorted(statuses)

    def test_page_size_clamp(self, auth_client, hr_user, make_request, emp_a1):
        for i in range(105):
            make_request(emp_a1, status="submitted", title=f"bulk{i}")
        res = auth_client(hr_user).get(REQ, {"page_size": 500})
        assert len(res.data["results"]) == 100
        # DRF page-number pagination returns 404 for out-of-range pages.
        res = auth_client(hr_user).get(REQ, {"page": 99})
        assert res.status_code == 404


@pytest.mark.django_db
class TestTimeline:
    def test_detail_embeds_ordered_history(
        self, auth_client, employee, manager_a, make_request
    ):
        req = make_request(employee)
        client = auth_client(employee)
        client.post(f"{REQ}{req.pk}/submit/")
        auth_client(manager_a).post(
            f"{REQ}{req.pk}/return/", {"comment": "fix it"}, format="json"
        )
        res = client.get(f"{REQ}{req.pk}/")
        assert res.status_code == 200
        hist = res.data["history"]
        assert [h["to_status"] for h in hist] == ["draft", "submitted", "returned"]
        assert hist[-1]["comment"] == "fix it"
        assert hist[-1]["actor"]["id"] == manager_a.pk
