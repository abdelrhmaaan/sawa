import datetime

import pytest

from timesheets.models import TimesheetEntry

TS = "/api/timesheets/"


def act(client, entry, action, comment=None):
    data = {} if comment is None else {"comment": comment}
    return client.post(f"{TS}{entry.pk}/{action}/", data, format="json")


@pytest.mark.django_db
class TestSubmit:
    def test_submit_draft(self, auth_client, employee, make_entry):
        entry = make_entry(employee)
        res = act(auth_client(employee), entry, "submit")
        assert res.status_code == 200
        entry.refresh_from_db()
        assert entry.status == "submitted"
        assert entry.submitted_at is not None
        assert res.data["status"] == "submitted"

    def test_resubmit_returned(self, auth_client, employee, make_entry):
        entry = make_entry(employee, status="returned")
        assert act(auth_client(employee), entry, "submit").status_code == 200

    @pytest.mark.parametrize("status", ["submitted", "approved"])
    def test_submit_wrong_state_400(self, auth_client, employee, make_entry, status):
        entry = make_entry(employee, status=status)
        assert act(auth_client(employee), entry, "submit").status_code == 400


@pytest.mark.django_db
class TestBulkSubmit:
    def test_bulk_submit_happy_path(self, auth_client, employee, make_entry):
        e1 = make_entry(employee)
        e2 = make_entry(
            employee, date=e1.date - datetime.timedelta(days=1)
        )
        res = auth_client(employee).post(
            f"{TS}submit/", {"ids": [e1.pk, e2.pk]}, format="json"
        )
        assert res.status_code == 200
        assert res.data == {"submitted": 2}
        e1.refresh_from_db()
        e2.refresh_from_db()
        assert e1.status == e2.status == "submitted"

    def test_bulk_submit_includes_foreign_id_atomic_400(
        self, auth_client, employee, make_user, make_entry
    ):
        other = make_user("z@test.dev")
        mine = make_entry(employee)
        foreign = make_entry(other)
        res = auth_client(employee).post(
            f"{TS}submit/", {"ids": [mine.pk, foreign.pk]}, format="json"
        )
        assert res.status_code == 400
        mine.refresh_from_db()
        foreign.refresh_from_db()
        assert mine.status == "draft"
        assert foreign.status == "draft"

    def test_bulk_submit_wrong_state_atomic_400(
        self, auth_client, employee, make_entry
    ):
        draft = make_entry(employee)
        submitted = make_entry(
            employee,
            status="submitted",
            date=draft.date - datetime.timedelta(days=1),
        )
        res = auth_client(employee).post(
            f"{TS}submit/", {"ids": [draft.pk, submitted.pk]}, format="json"
        )
        assert res.status_code == 400
        draft.refresh_from_db()
        assert draft.status == "draft"

    @pytest.mark.parametrize(
        "body",
        [{}, {"ids": []}, {"ids": "1,2"}, {"ids": ["a"]}, {"ids": [True]}],
    )
    def test_bulk_submit_bad_body_400(self, auth_client, employee, body):
        res = auth_client(employee).post(f"{TS}submit/", body, format="json")
        assert res.status_code == 400

    def test_bulk_submit_is_collection_route(
        self, auth_client, employee, make_entry
    ):
        # 'submit' must not be mistaken for a pk: no 'Expected a number' error.
        res = auth_client(employee).post(f"{TS}submit/", {"ids": []}, format="json")
        assert res.status_code == 400  # validation error, not routing error
        assert "ids" in res.data


@pytest.mark.django_db
class TestDecisions:
    def test_approve(self, auth_client, manager_a, emp_a1, make_entry):
        entry = make_entry(emp_a1, status="submitted")
        res = act(auth_client(manager_a), entry, "approve")
        assert res.status_code == 200
        entry.refresh_from_db()
        assert entry.status == "approved"
        assert entry.reviewed_at is not None

    def test_return_requires_comment(self, auth_client, manager_a, emp_a1, make_entry):
        entry = make_entry(emp_a1, status="submitted")
        client = auth_client(manager_a)
        assert act(client, entry, "return").status_code == 400
        assert act(client, entry, "return", "  ").status_code == 400
        assert act(client, entry, "return", "Fix notes").status_code == 200

    def test_double_approve_400(self, auth_client, manager_a, emp_a1, make_entry):
        entry = make_entry(emp_a1, status="submitted")
        client = auth_client(manager_a)
        assert act(client, entry, "approve").status_code == 200
        assert act(client, entry, "approve").status_code == 400

    def test_self_approve_403(self, auth_client, emp_a1, make_entry):
        entry = make_entry(emp_a1, status="submitted")
        assert act(auth_client(emp_a1), entry, "approve").status_code == 403

    def test_hr_cannot_decide_own(self, auth_client, hr_user, make_entry):
        entry = make_entry(hr_user, status="submitted")
        assert act(auth_client(hr_user), entry, "approve").status_code == 403

    def test_other_team_manager_404(self, auth_client, manager_a, emp_b1, make_entry):
        entry = make_entry(emp_b1, status="submitted")
        client = auth_client(manager_a)
        for action in ("approve", "return"):
            assert act(client, entry, action, "c").status_code == 404

    @pytest.mark.parametrize("comment", [["x"], {"a": 1}])
    def test_non_string_comment_400(
        self, auth_client, manager_a, emp_a1, make_entry, comment
    ):
        entry = make_entry(emp_a1, status="submitted")
        assert act(auth_client(manager_a), entry, "approve", comment).status_code == 400

    def test_hr_decides_any(self, auth_client, hr_user, emp_a1, make_entry):
        entry = make_entry(emp_a1, status="submitted")
        assert act(auth_client(hr_user), entry, "approve").status_code == 200
