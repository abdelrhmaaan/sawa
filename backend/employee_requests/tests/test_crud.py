import pytest

from employee_requests.models import Request, RequestStatusHistory

REQ = "/api/requests/"


def make_payload(**over):
    payload = {"type": "leave", "title": "Annual leave", "description": "Eid break"}
    payload.update(over)
    return payload


@pytest.mark.django_db
class TestCreate:
    def test_create_defaults_owner_and_draft(self, auth_client, employee):
        res = auth_client(employee).post(REQ, make_payload(), format="json")
        assert res.status_code == 201
        assert res.data["status"] == "draft"
        assert res.data["owner"]["id"] == employee.pk
        obj = Request.objects.get(pk=res.data["id"])
        assert obj.owner_id == employee.pk
        assert obj.status == "draft"

    def test_client_owner_and_status_ignored(self, auth_client, employee, manager_a):
        res = auth_client(employee).post(
            REQ,
            make_payload(owner=manager_a.pk, status="approved"),
            format="json",
        )
        assert res.status_code == 201
        obj = Request.objects.get(pk=res.data["id"])
        assert obj.owner_id == employee.pk
        assert obj.status == "draft"

    @pytest.mark.parametrize(
        "payload",
        [
            {"type": "leave", "description": "no title"},
            {"type": "leave", "title": "x", "description": ""},
            {"type": "nope", "title": "t", "description": "d"},
            {"type": "leave", "title": "x" * 201, "description": "d"},
        ],
    )
    def test_invalid_payload_400(self, auth_client, employee, payload):
        assert auth_client(employee).post(REQ, payload, format="json").status_code == 400

    def test_create_writes_history_row(self, auth_client, employee):
        res = auth_client(employee).post(REQ, make_payload(), format="json")
        history = RequestStatusHistory.objects.filter(request_id=res.data["id"])
        assert history.count() == 1
        row = history.get()
        assert row.from_status is None
        assert row.to_status == "draft"
        assert row.actor_id == employee.pk


@pytest.mark.django_db
class TestEditDelete:
    def test_owner_patches_draft(self, auth_client, employee, make_request):
        req = make_request(employee)
        res = auth_client(employee).patch(
            f"{REQ}{req.pk}/", {"title": "New title"}, format="json"
        )
        assert res.status_code == 200
        req.refresh_from_db()
        assert req.title == "New title"

    def test_owner_edits_returned(self, auth_client, employee, make_request):
        req = make_request(employee, status="returned")
        res = auth_client(employee).patch(
            f"{REQ}{req.pk}/", {"title": "Fixed"}, format="json"
        )
        assert res.status_code == 200

    @pytest.mark.parametrize("status", ["submitted", "approved", "rejected"])
    def test_edit_non_editable_status_400(
        self, auth_client, employee, make_request, status
    ):
        req = make_request(employee, status=status)
        res = auth_client(employee).patch(
            f"{REQ}{req.pk}/", {"title": "x"}, format="json"
        )
        assert res.status_code == 400

    def test_non_owner_invalid_body_403_before_400(
        self, auth_client, manager_a, emp_a1, make_request
    ):
        req = make_request(emp_a1, status="submitted")
        res = auth_client(manager_a).patch(
            f"{REQ}{req.pk}/", {"title": ""}, format="json"
        )
        assert res.status_code == 403

    def test_owner_invalid_body_wrong_state_400_state_error(
        self, auth_client, emp_a1, make_request
    ):
        req = make_request(emp_a1, status="submitted")
        res = auth_client(emp_a1).patch(
            f"{REQ}{req.pk}/", {"title": ""}, format="json"
        )
        assert res.status_code == 400
        assert "detail" in res.data and "status" in res.data["detail"]

    def test_owner_deletes_draft(self, auth_client, employee, make_request):
        req = make_request(employee)
        res = auth_client(employee).delete(f"{REQ}{req.pk}/")
        assert res.status_code == 204
        assert not Request.objects.filter(pk=req.pk).exists()

    def test_delete_submitted_400(self, auth_client, employee, make_request):
        req = make_request(employee, status="submitted")
        assert auth_client(employee).delete(f"{REQ}{req.pk}/").status_code == 400


@pytest.mark.django_db
class TestAttack:
    def test_other_employee_cannot_read_patch_delete(
        self, auth_client, make_user, employee, make_request
    ):
        other = make_user("other@test.dev")
        req = make_request(other)
        client = auth_client(employee)
        assert client.get(f"{REQ}{req.pk}/").status_code == 404
        assert client.patch(f"{REQ}{req.pk}/", {"title": "x"}, format="json").status_code == 404
        assert client.delete(f"{REQ}{req.pk}/").status_code == 404

    def test_visible_non_owner_patch_403(
        self, auth_client, manager_a, emp_a1, make_request
    ):
        req = make_request(emp_a1, status="submitted")
        res = auth_client(manager_a).patch(
            f"{REQ}{req.pk}/", {"title": "x"}, format="json"
        )
        assert res.status_code == 403

    def test_unauthenticated_401(self, api_client, employee, make_request):
        req = make_request(employee)
        assert api_client.get(REQ).status_code == 401
        assert api_client.get(f"{REQ}{req.pk}/").status_code == 401
