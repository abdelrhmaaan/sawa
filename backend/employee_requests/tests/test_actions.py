import pytest

from employee_requests.models import RequestStatusHistory

REQ = "/api/requests/"


def act(client, req, action, comment=None):
    data = {} if comment is None else {"comment": comment}
    return client.post(f"{REQ}{req.pk}/{action}/", data, format="json")


@pytest.mark.django_db
class TestSubmit:
    def test_submit_draft(self, auth_client, employee, make_request):
        req = make_request(employee)
        res = act(auth_client(employee), req, "submit")
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == "submitted"
        assert req.submitted_at is not None
        last = req.history.order_by("created_at").last()
        assert (last.from_status, last.to_status, last.actor_id) == (
            "draft",
            "submitted",
            employee.pk,
        )

    @pytest.mark.parametrize("status", ["submitted", "approved", "rejected"])
    def test_submit_wrong_state_400(self, auth_client, employee, make_request, status):
        req = make_request(employee, status=status)
        assert act(auth_client(employee), req, "submit").status_code == 400

    def test_resubmit_returned(self, auth_client, employee, make_request):
        req = make_request(employee, status="returned")
        assert act(auth_client(employee), req, "submit").status_code == 200
        req.refresh_from_db()
        assert req.status == "submitted"

    def test_non_owner_submit_403(self, auth_client, manager_a, emp_a1, make_request):
        req = make_request(emp_a1, status="draft")
        # manager can't see reports' drafts → 404; use returned (visible)
        assert act(auth_client(manager_a), req, "submit").status_code == 404
        req.status = "submitted"
        req.save()
        assert act(auth_client(manager_a), req, "submit").status_code == 403


@pytest.mark.django_db
class TestDecisions:
    def test_approve(self, auth_client, manager_a, emp_a1, make_request):
        req = make_request(emp_a1, status="submitted")
        res = act(auth_client(manager_a), req, "approve", "LGTM")
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == "approved"
        assert req.decided_at is not None
        last = req.history.order_by("created_at").last()
        assert last.actor_id == manager_a.pk
        assert last.comment == "LGTM"

    def test_reject_requires_comment(self, auth_client, manager_a, emp_a1, make_request):
        req = make_request(emp_a1, status="submitted")
        client = auth_client(manager_a)
        assert act(client, req, "reject").status_code == 400
        assert act(client, req, "reject", "   ").status_code == 400
        assert act(client, req, "reject", "Not now").status_code == 200

    def test_return_requires_comment(self, auth_client, manager_a, emp_a1, make_request):
        req = make_request(emp_a1, status="submitted")
        client = auth_client(manager_a)
        assert act(client, req, "return").status_code == 400
        res = act(client, req, "return", "Fix dates")
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.status == "returned"

    @pytest.mark.parametrize("action", ["approve", "reject", "return"])
    def test_decisions_on_non_submitted_400(
        self, auth_client, manager_a, emp_a1, make_request, action
    ):
        req = make_request(emp_a1, status="returned")
        # 'returned' is visible to manager? No — returned is non-draft → visible.
        res = act(auth_client(manager_a), req, action, "c")
        assert res.status_code == 400

    def test_double_approve_400(self, auth_client, manager_a, emp_a1, make_request):
        req = make_request(emp_a1, status="submitted")
        client = auth_client(manager_a)
        assert act(client, req, "approve").status_code == 200
        assert act(client, req, "approve").status_code == 400

    def test_owner_cannot_decide_own(self, auth_client, emp_a1, make_request):
        req = make_request(emp_a1, status="submitted")
        client = auth_client(emp_a1)
        for action in ("approve", "reject", "return"):
            assert act(client, req, action, "c").status_code == 403

    def test_hr_cannot_decide_own(self, auth_client, hr_user, make_request):
        req = make_request(hr_user, status="submitted")
        assert act(auth_client(hr_user), req, "approve").status_code == 403

    def test_hr_decides_when_owner_has_no_manager(
        self, auth_client, hr_user, make_user, make_request
    ):
        orphan = make_user("orphan@test.dev")
        req = make_request(orphan, status="submitted")
        assert act(auth_client(hr_user), req, "approve").status_code == 200

    @pytest.mark.parametrize("comment", [["x"], {"a": 1}])
    def test_non_string_comment_400(
        self, auth_client, manager_a, emp_a1, make_request, comment
    ):
        req = make_request(emp_a1, status="submitted")
        assert act(auth_client(manager_a), req, "approve", comment).status_code == 400

    def test_hr_decides_any_submitted(self, auth_client, hr_user, emp_a1, make_request):
        req = make_request(emp_a1, status="submitted")
        assert act(auth_client(hr_user), req, "return", "back to you").status_code == 200

    def test_manager_cannot_decide_other_team(
        self, auth_client, manager_a, emp_b1, make_request
    ):
        req = make_request(emp_b1, status="submitted")
        client = auth_client(manager_a)
        for action in ("approve", "reject", "return"):
            assert act(client, req, action, "c").status_code == 404
