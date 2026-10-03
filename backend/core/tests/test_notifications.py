import pytest

from core.models import Notification

LIST = "/api/notifications/"


def _notes_for(user):
    return Notification.objects.filter(user=user).order_by("-created_at")


@pytest.mark.django_db
class TestCreation:
    """T-005-09: transitions write notifications for the right recipients."""

    def test_request_submit_notifies_manager(
        self, auth_client, make_request, emp_a1, manager_a
    ):
        req = make_request(emp_a1)
        res = auth_client(emp_a1).post(f"/api/requests/{req.pk}/submit/")
        assert res.status_code == 200
        notes = _notes_for(manager_a)
        assert notes.count() == 1
        assert notes[0].link == f"/requests/{req.pk}"
        assert not notes[0].is_read

    def test_request_submit_no_manager_notifies_all_hr(
        self, auth_client, make_request, make_user, hr_user
    ):
        # Owner with no manager → every active HR user is notified.
        hr2 = make_user("hr2@test.dev", role="hr")
        orphan = make_user("orphan@test.dev")  # employee, no manager
        req = make_request(orphan)
        res = auth_client(orphan).post(f"/api/requests/{req.pk}/submit/")
        assert res.status_code == 200
        assert _notes_for(hr_user).count() == 1
        assert _notes_for(hr2).count() == 1
        assert _notes_for(orphan).count() == 0  # never notify the actor

    def test_request_approve_reject_return_notify_owner(
        self, auth_client, make_request, emp_a1, manager_a
    ):
        for action in ("approve", "reject", "return"):
            req = make_request(emp_a1, status="submitted")
            res = auth_client(manager_a).post(
                f"/api/requests/{req.pk}/{action}/", {"comment": "note"}, format="json"
            )
            assert res.status_code == 200, (action, res.json())
        notes = _notes_for(emp_a1)
        assert notes.count() == 3

    def test_decision_links_point_at_request(
        self, auth_client, make_request, emp_a1, manager_a
    ):
        req = make_request(emp_a1, status="submitted")
        auth_client(manager_a).post(f"/api/requests/{req.pk}/approve/")
        note = _notes_for(emp_a1).get()
        assert note.link == f"/requests/{req.pk}"
        assert "approved" in note.message

    def test_timesheet_submit_approve_return(
        self, auth_client, make_entry, emp_a1, manager_a
    ):
        import datetime

        entry = make_entry(emp_a1)
        res = auth_client(emp_a1).post(f"/api/timesheets/{entry.pk}/submit/")
        assert res.status_code == 200
        assert _notes_for(manager_a).count() == 1

        entry2 = make_entry(
            emp_a1, status="submitted",
            start=datetime.time(9, 0), end=datetime.time(11, 0),
        )
        res = auth_client(manager_a).post(
            f"/api/timesheets/{entry2.pk}/return/", {"comment": "fix it"}, format="json"
        )
        assert res.status_code == 200
        assert _notes_for(emp_a1).count() == 1
        assert "returned" in _notes_for(emp_a1).first().message

        entry3 = make_entry(
            emp_a1, status="submitted",
            start=datetime.time(13, 0), end=datetime.time(15, 0),
        )
        res = auth_client(manager_a).post(f"/api/timesheets/{entry3.pk}/approve/")
        assert res.status_code == 200
        assert _notes_for(emp_a1).count() == 2

    def test_bulk_submit_notifies_once(
        self, auth_client, make_entry, emp_a1, manager_a
    ):
        import datetime

        e1 = make_entry(emp_a1, start=datetime.time(9), end=datetime.time(11))
        e2 = make_entry(emp_a1, start=datetime.time(13), end=datetime.time(15))
        res = auth_client(emp_a1).post(
            "/api/timesheets/submit/", {"ids": [e1.pk, e2.pk]}, format="json"
        )
        assert res.status_code == 200
        assert _notes_for(manager_a).count() == 1  # one summary, not one per row


@pytest.mark.django_db
class TestEndpoints:
    """T-005-10: list/read/read-all behaviour."""

    def _seed(self, user, unread=2, read=1):
        for i in range(read):
            Notification.objects.create(
                user=user, message=f"read {i}", is_read=True
            )
        for i in range(unread):
            Notification.objects.create(user=user, message=f"unread {i}")

    def test_list_own_unread_first_with_count(
        self, auth_client, emp_a1, emp_a2
    ):
        self._seed(emp_a1)
        self._seed(emp_a2)  # other user's notifications must not appear
        res = auth_client(emp_a1).get(LIST)
        assert res.status_code == 200
        body = res.json()
        assert body["count"] == 3
        assert body["unread_count"] == 2
        results = body["results"]
        assert [r["is_read"] for r in results] == [False, False, True]

    def test_read_marks_notification(self, auth_client, emp_a1):
        note = Notification.objects.create(user=emp_a1, message="hi")
        res = auth_client(emp_a1).post(f"{LIST}{note.pk}/read/")
        assert res.status_code == 200
        assert res.json()["is_read"] is True
        res = auth_client(emp_a1).get(LIST)
        assert res.json()["unread_count"] == 0

    def test_read_all(self, auth_client, emp_a1):
        self._seed(emp_a1, unread=3, read=0)
        res = auth_client(emp_a1).post(f"{LIST}read-all/")
        assert res.status_code == 200
        assert res.json()["marked_read"] == 3
        assert _notes_for(emp_a1).filter(is_read=False).count() == 0

    def test_pagination(self, auth_client, emp_a1):
        for i in range(25):
            Notification.objects.create(user=emp_a1, message=f"n{i}")
        res = auth_client(emp_a1).get(LIST)
        assert res.json()["count"] == 25
        assert len(res.json()["results"]) == 20
        assert res.json()["next"]


@pytest.mark.django_db
class TestAttacks:
    """T-005-11: scope never leaks; unauthenticated rejected."""

    def test_read_other_users_notification_is_404(
        self, auth_client, emp_a1, emp_b1
    ):
        note = Notification.objects.create(user=emp_b1, message="secret")
        res = auth_client(emp_a1).post(f"{LIST}{note.pk}/read/")
        assert res.status_code == 404
        res = auth_client(emp_a1).get(f"{LIST}{note.pk}/read/")
        # No retrieve endpoint — only list + the two actions exist.
        assert res.status_code in (404, 405)

    def test_read_all_only_touches_own(
        self, auth_client, emp_a1, emp_b1
    ):
        Notification.objects.create(user=emp_a1, message="a")
        Notification.objects.create(user=emp_b1, message="b")
        auth_client(emp_a1).post(f"{LIST}read-all/")
        assert _notes_for(emp_b1).get().is_read is False

    def test_unauthenticated(self, api_client, emp_a1):
        note = Notification.objects.create(user=emp_a1, message="hi")
        assert api_client.get(LIST).status_code == 401
        assert api_client.post(f"{LIST}{note.pk}/read/").status_code == 401
        assert api_client.post(f"{LIST}read-all/").status_code == 401
