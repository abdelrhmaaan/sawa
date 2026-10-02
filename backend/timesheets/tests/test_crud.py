import datetime
from decimal import Decimal

import pytest
from django.utils import timezone

from timesheets.models import TimesheetEntry, TimesheetStatusHistory

TS = "/api/timesheets/"
YESTERDAY = None  # resolved per test via helper


def yesterday():
    return timezone.localdate() - datetime.timedelta(days=1)


def make_payload(**over):
    payload = {
        "date": yesterday().isoformat(),
        "start_time": "09:00",
        "end_time": "17:00",
        "note": "work",
    }
    payload.update(over)
    return payload


@pytest.mark.django_db
class TestCreate:
    def test_create_computes_hours(self, auth_client, employee):
        res = auth_client(employee).post(TS, make_payload(), format="json")
        assert res.status_code == 201
        assert res.data["hours"] == "8.00"
        assert res.data["status"] == "draft"
        obj = TimesheetEntry.objects.get(pk=res.data["id"])
        assert obj.hours == Decimal("8.00")

    def test_client_status_and_hours_ignored(self, auth_client, employee):
        res = auth_client(employee).post(
            TS, make_payload(status="approved", hours="99.00"), format="json"
        )
        assert res.status_code == 201
        obj = TimesheetEntry.objects.get(pk=res.data["id"])
        assert obj.status == "draft"
        assert obj.hours == Decimal("8.00")

    def test_create_writes_history_row(self, auth_client, employee):
        res = auth_client(employee).post(TS, make_payload(), format="json")
        row = TimesheetStatusHistory.objects.get(entry_id=res.data["id"])
        assert row.from_status is None
        assert row.to_status == "draft"
        assert row.actor_id == employee.pk

    def test_end_before_start_400(self, auth_client, employee):
        res = auth_client(employee).post(
            TS, make_payload(start_time="17:00", end_time="09:00"), format="json"
        )
        assert res.status_code == 400

    def test_future_date_400(self, auth_client, employee):
        future = (timezone.localdate() + datetime.timedelta(days=1)).isoformat()
        res = auth_client(employee).post(TS, make_payload(date=future), format="json")
        assert res.status_code == 400

    def test_today_allowed(self, auth_client, employee):
        res = auth_client(employee).post(
            TS, make_payload(date=timezone.localdate().isoformat()), format="json"
        )
        assert res.status_code == 201

    def test_overlap_400(self, auth_client, employee, make_entry):
        make_entry(employee, start=datetime.time(9, 0), end=datetime.time(13, 0))
        res = auth_client(employee).post(
            TS, make_payload(start_time="12:00", end_time="15:00"), format="json"
        )
        assert res.status_code == 400

    def test_adjacent_allowed(self, auth_client, employee, make_entry):
        make_entry(employee, start=datetime.time(9, 0), end=datetime.time(13, 0))
        res = auth_client(employee).post(
            TS, make_payload(start_time="13:00", end_time="17:00"), format="json"
        )
        assert res.status_code == 201

    def test_overlap_other_owner_ok(
        self, auth_client, employee, make_user, make_entry
    ):
        other = make_user("x@test.dev")
        make_entry(other, start=datetime.time(9, 0), end=datetime.time(17, 0))
        res = auth_client(employee).post(TS, make_payload(), format="json")
        assert res.status_code == 201

    def test_overlap_different_date_ok(self, auth_client, employee, make_entry):
        d2 = timezone.localdate() - datetime.timedelta(days=2)
        make_entry(employee, date=d2)
        res = auth_client(employee).post(TS, make_payload(), format="json")
        assert res.status_code == 201


@pytest.mark.django_db
class TestUpdate:
    def test_patch_recalculates_hours(self, auth_client, employee, make_entry):
        entry = make_entry(employee)
        res = auth_client(employee).patch(
            f"{TS}{entry.pk}/", {"end_time": "13:00"}, format="json"
        )
        assert res.status_code == 200
        entry.refresh_from_db()
        assert entry.hours == Decimal("4.00")

    def test_update_excludes_self_in_overlap_check(
        self, auth_client, employee, make_entry
    ):
        entry = make_entry(employee)
        res = auth_client(employee).patch(
            f"{TS}{entry.pk}/", {"note": "updated"}, format="json"
        )
        assert res.status_code == 200

    def test_update_overlapping_sibling_400(self, auth_client, employee, make_entry):
        make_entry(employee, start=datetime.time(9, 0), end=datetime.time(13, 0))
        e2 = make_entry(employee, start=datetime.time(14, 0), end=datetime.time(17, 0))
        res = auth_client(employee).patch(
            f"{TS}{e2.pk}/", {"start_time": "12:00"}, format="json"
        )
        assert res.status_code == 400

    @pytest.mark.parametrize("status", ["submitted", "approved"])
    def test_edit_read_only_statuses_400(
        self, auth_client, employee, make_entry, status
    ):
        entry = make_entry(employee, status=status)
        res = auth_client(employee).patch(
            f"{TS}{entry.pk}/", {"note": "x"}, format="json"
        )
        assert res.status_code == 400

    def test_non_owner_invalid_body_403_before_400(
        self, auth_client, manager_a, emp_a1, make_entry
    ):
        entry = make_entry(emp_a1, status="submitted")
        res = auth_client(manager_a).patch(
            f"{TS}{entry.pk}/", {"end_time": "06:00"}, format="json"
        )
        assert res.status_code == 403

    def test_owner_invalid_body_wrong_state_400_state_error(
        self, auth_client, emp_a1, make_entry
    ):
        entry = make_entry(emp_a1, status="submitted")
        res = auth_client(emp_a1).patch(
            f"{TS}{entry.pk}/", {"end_time": "06:00"}, format="json"
        )
        assert res.status_code == 400
        assert "detail" in res.data and "status" in res.data["detail"]

    def test_returned_entry_editable(self, auth_client, employee, make_entry):
        entry = make_entry(employee, status="returned")
        res = auth_client(employee).patch(
            f"{TS}{entry.pk}/", {"note": "fixed"}, format="json"
        )
        assert res.status_code == 200

    def test_delete_draft_only(self, auth_client, employee, make_entry):
        entry = make_entry(employee)
        assert auth_client(employee).delete(f"{TS}{entry.pk}/").status_code == 204
        submitted = make_entry(
            employee, status="submitted",
            start=datetime.time(18, 0), end=datetime.time(19, 0),
        )
        assert (
            auth_client(employee).delete(f"{TS}{submitted.pk}/").status_code == 400
        )


@pytest.mark.django_db
class TestAttack:
    def test_other_employee_crud_404(
        self, auth_client, make_user, employee, make_entry
    ):
        other = make_user("y@test.dev")
        entry = make_entry(other)
        client = auth_client(employee)
        assert client.get(f"{TS}{entry.pk}/").status_code == 404
        assert client.patch(f"{TS}{entry.pk}/", {"note": "x"}, format="json").status_code == 404
        assert client.delete(f"{TS}{entry.pk}/").status_code == 404

    def test_unauthenticated_401(self, api_client, employee, make_entry):
        entry = make_entry(employee)
        assert api_client.get(TS).status_code == 401
        assert api_client.get(f"{TS}{entry.pk}/").status_code == 401
