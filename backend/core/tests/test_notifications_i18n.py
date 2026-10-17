"""US3 (T-006-29/30): notifications render in the reader's language.

Stored rows keep the English `message`; `kind` + `params` drive the
localized rendering. `kind`/`params` are never exposed by the API.
"""

import pytest
from django.utils import translation
from django.utils.translation import gettext

from core.models import Notification

LIST = "/api/notifications/"


def _latest(user):
    return Notification.objects.filter(user=user).latest("id")


def _get_message(client, note_id=None):
    res = client.get(LIST)
    assert res.status_code == 200
    items = res.json()["results"]
    if note_id is not None:
        items = [i for i in items if i["id"] == note_id]
    return items


@pytest.mark.django_db
class TestRenderedLanguages:
    def test_request_submitted_ar_and_en(
        self, api_client, auth_client, make_request, emp_a1, manager_a
    ):
        req = make_request(emp_a1, title="Eid leave")
        res = auth_client(emp_a1).post(f"/api/requests/{req.pk}/submit/")
        assert res.status_code == 200
        note = _latest(manager_a)
        assert note.kind == "request_submitted"
        assert note.params == {"actor": emp_a1.full_name, "title": "Eid leave"}
        expected_en = f'{emp_a1.full_name} submitted "Eid leave" for approval.'
        assert note.message == expected_en

        res = auth_client(manager_a).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
        item = res.json()["results"][0]
        assert item["id"] == note.id
        assert item["message"] != expected_en
        assert emp_a1.full_name in item["message"]
        assert "Eid leave" in item["message"]

        res = auth_client(manager_a).get(LIST)
        assert res.json()["results"][0]["message"] == expected_en

    def test_request_decisions(
        self, api_client, auth_client, make_request, emp_a1, manager_a
    ):
        cases = {
            "approve": ("request_approved", "approved"),
            "reject": ("request_rejected", "rejected"),
            "return": ("request_returned", "returned"),
        }
        for action, (kind, word) in cases.items():
            req = make_request(emp_a1, status="submitted", title=f"t-{action}")
            res = auth_client(manager_a).post(
                f"/api/requests/{req.pk}/{action}/",
                {"comment": "c"},
                format="json",
            )
            assert res.status_code == 200, action
            note = _latest(emp_a1)
            assert note.kind == kind
            assert note.params == {"title": req.title}
            assert note.message == f'Your request "{req.title}" was {word}.'

            res = auth_client(emp_a1).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
            item = [i for i in res.json()["results"] if i["id"] == note.id][0]
            assert item["message"] != note.message
            assert req.title in item["message"]

            res = auth_client(emp_a1).get(LIST)
            item = [i for i in res.json()["results"] if i["id"] == note.id][0]
            assert item["message"] == note.message

    def test_timesheet_submitted(
        self, api_client, auth_client, make_entry, emp_a1, manager_a
    ):
        entry = make_entry(emp_a1)
        res = auth_client(emp_a1).post(f"/api/timesheets/{entry.pk}/submit/")
        assert res.status_code == 200
        note = _latest(manager_a)
        assert note.kind == "timesheet_submitted"
        assert note.params == {"actor": emp_a1.full_name, "date": str(entry.date)}
        expected_en = (
            f"{emp_a1.full_name} submitted a timesheet entry for {entry.date}."
        )
        assert note.message == expected_en

        res = auth_client(manager_a).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
        item = res.json()["results"][0]
        assert item["message"] != expected_en
        assert str(entry.date).replace("-", "\u2011") in item["message"]
        assert emp_a1.full_name in item["message"]

    def test_timesheet_bulk_submitted_plurals(
        self, api_client, auth_client, make_entry, emp_a1, manager_a
    ):
        import datetime

        e1 = make_entry(emp_a1)
        res = auth_client(emp_a1).post(
            "/api/timesheets/submit/", {"ids": [e1.pk]}, format="json"
        )
        assert res.status_code == 200
        note = _latest(manager_a)
        assert note.kind == "timesheet_bulk_submitted"
        assert note.params == {"actor": emp_a1.full_name, "count": 1}
        assert note.message == (
            f"{emp_a1.full_name} submitted 1 timesheet entry for review."
        )

        e2 = make_entry(
            emp_a1,
            date=e1.date - datetime.timedelta(days=1),
            start=datetime.time(9, 0),
            end=datetime.time(10, 0),
        )
        e3 = make_entry(
            emp_a1,
            date=e1.date - datetime.timedelta(days=2),
            start=datetime.time(9, 0),
            end=datetime.time(10, 0),
        )
        e4 = make_entry(
            emp_a1,
            date=e1.date - datetime.timedelta(days=3),
            start=datetime.time(9, 0),
            end=datetime.time(10, 0),
        )
        res = auth_client(emp_a1).post(
            "/api/timesheets/submit/",
            {"ids": [e2.pk, e3.pk, e4.pk]},
            format="json",
        )
        assert res.status_code == 200
        note = _latest(manager_a)
        assert note.params == {"actor": emp_a1.full_name, "count": 3}
        assert note.message == (
            f"{emp_a1.full_name} submitted 3 timesheet entries for review."
        )
        res = auth_client(manager_a).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
        item = [i for i in res.json()["results"] if i["id"] == note.id][0]
        assert item["message"] != note.message
        assert emp_a1.full_name in item["message"]

    def test_timesheet_decisions(
        self, api_client, auth_client, make_entry, emp_a1, manager_a
    ):
        import datetime

        cases = {
            "approve": ("timesheet_approved", "approved"),
            "return": ("timesheet_returned", "returned"),
        }
        for i, (action, (kind, word)) in enumerate(cases.items()):
            entry = make_entry(
                emp_a1,
                status="submitted",
                start=datetime.time(9 + i, 0),
                end=datetime.time(10 + i, 0),
            )
            res = auth_client(manager_a).post(
                f"/api/timesheets/{entry.pk}/{action}/",
                {"comment": "c"},
                format="json",
            )
            assert res.status_code == 200, action
            note = _latest(emp_a1)
            assert note.kind == kind
            assert note.params == {"date": str(entry.date)}
            assert note.message == (
                f"Your timesheet entry for {entry.date} was {word}."
            )
            res = auth_client(emp_a1).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
            item = [i for i in res.json()["results"] if i["id"] == note.id][0]
            assert item["message"] != note.message
            assert str(entry.date).replace("-", "\u2011") in item["message"]


    def test_arabic_params_wrapped_in_bidi_isolates(
        self, api_client, auth_client, make_request, make_entry, emp_a1, manager_a
    ):
        # RTL rendering wraps substituted strings in FSI/PDI (\u2068/\u2069)
        # so Latin names, titles, and ISO dates stay in order; English (LTR)
        # output contains none of them.
        req = make_request(emp_a1, title="Eid leave")
        auth_client(emp_a1).post(f"/api/requests/{req.pk}/submit/")
        entry = make_entry(emp_a1)
        auth_client(emp_a1).post(f"/api/timesheets/{entry.pk}/submit/")
        req_note = _latest(manager_a)  # timesheet_submitted
        notes = Notification.objects.filter(user=manager_a).order_by("-id")[:2]
        ts_note, req_note = notes[0], notes[1]

        res = auth_client(manager_a).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
        by_id = {i["id"]: i["message"] for i in res.json()["results"]}
        ar_req = by_id[req_note.id]
        ar_ts = by_id[ts_note.id]
        assert f"\u2068{emp_a1.full_name}\u2069" in ar_req
        assert "\u2068Eid leave\u2069" in ar_req
        assert f"\u2068{emp_a1.full_name}\u2069" in ar_ts
        # Letter-free values (ISO date) get LRI (U+2066) + non-breaking
        # hyphens (U+2011) so the date never wraps internally.
        iso_nb = str(entry.date).replace("-", "\u2011")
        assert f"\u2066{iso_nb}\u2069" in ar_ts

        res = auth_client(manager_a).get(LIST)
        for item in res.json()["results"]:
            assert "\u2066" not in item["message"]
            assert "\u2068" not in item["message"]
            assert "\u2069" not in item["message"]


@pytest.mark.django_db
class TestFallbackAndAttacks:
    def test_legacy_row_returns_stored_message(
        self, auth_client, manager_a
    ):
        note = Notification.objects.create(
            user=manager_a, message="Legacy text.", kind="", params={}
        )
        for header in (None, "ar"):
            kw = {} if header is None else {"HTTP_ACCEPT_LANGUAGE": header}
            item = _get_message(auth_client(manager_a), note.id)
            res = auth_client(manager_a).get(LIST, **kw)
            found = [i for i in res.json()["results"] if i["id"] == note.id][0]
            assert found["message"] == "Legacy text."

    def test_unknown_kind_and_missing_param_fall_back(
        self, auth_client, manager_a
    ):
        unknown = Notification.objects.create(
            user=manager_a, message="Fallback A.", kind="nope", params={}
        )
        missing = Notification.objects.create(
            user=manager_a,
            message="Fallback B.",
            kind="request_approved",
            params={},
        )
        res = auth_client(manager_a).get(LIST, HTTP_ACCEPT_LANGUAGE="ar")
        by_id = {i["id"]: i for i in res.json()["results"]}
        assert by_id[unknown.id]["message"] == "Fallback A."
        assert by_id[missing.id]["message"] == "Fallback B."

    def test_other_users_note_404_no_leak(
        self, auth_client, make_request, emp_a1, emp_b1, manager_a, manager_b
    ):
        # manager_b cannot read/mark manager_a's notification (404, no params).
        req = make_request(emp_a1, title="SecretTitle-X")
        auth_client(emp_a1).post(f"/api/requests/{req.pk}/submit/")
        note = _latest(manager_a)
        res = auth_client(manager_b).post(
            f"/api/notifications/{note.pk}/read/",
            {},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 404
        body = res.content.decode()
        assert "SecretTitle-X" not in body
        assert emp_a1.full_name not in body

    def test_malicious_title_rendered_literally(
        self, api_client, auth_client, make_request, emp_a1, manager_a
    ):
        evil = "%(actor)s <script>alert(1)</script> {{x}}"
        req = make_request(emp_a1, title=evil)
        auth_client(emp_a1).post(f"/api/requests/{req.pk}/submit/")
        note = _latest(manager_a)
        assert evil in note.message
        for header in (None, "ar"):
            kw = {} if header is None else {"HTTP_ACCEPT_LANGUAGE": header}
            res = auth_client(manager_a).get(LIST, **kw)
            item = [i for i in res.json()["results"] if i["id"] == note.id][0]
            assert evil in item["message"]

    def test_item_shape_unchanged(
        self, auth_client, make_request, emp_a1, manager_a
    ):
        req = make_request(emp_a1)
        auth_client(emp_a1).post(f"/api/requests/{req.pk}/submit/")
        res = auth_client(manager_a).get(LIST)
        item = res.json()["results"][0]
        assert set(item.keys()) == {
            "id",
            "message",
            "link",
            "is_read",
            "created_at",
        }
