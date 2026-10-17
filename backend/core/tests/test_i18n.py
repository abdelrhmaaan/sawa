"""US2 (T-006-22/23): API messages follow Accept-Language.

Every user-facing error/detail string must come back in Arabic when the
request carries `Accept-Language: ar`, and byte-for-byte English without
it (or with an unsupported/malformed value).
"""

import pytest
from django.utils import translation
from django.utils.translation import gettext, ngettext, pgettext

from conftest import obtain_tokens


def ar(msgid):
    """The Arabic msgstr our catalog maps `msgid` to."""
    with translation.override("ar"):
        return gettext(msgid)


def ar_ctx(context, msgid):
    with translation.override("ar"):
        return pgettext(context, msgid)


def ar_pl(singular, plural, n):
    with translation.override("ar"):
        return ngettext(singular, plural, n)


def _flatten(data):
    """All string leaves of a response body."""
    if isinstance(data, str):
        yield data
    elif isinstance(data, dict):
        for v in data.values():
            yield from _flatten(v)
    elif isinstance(data, list):
        for v in data:
            yield from _flatten(v)


def assert_arabic(res, msgid=None, fmt=None):
    """Body contains the Arabic translation of msgid (with % fmt applied)."""
    expected = ar(msgid)
    if fmt:
        expected = expected % fmt
    assert res.headers.get("Content-Language") == "ar", res.headers
    texts = list(_flatten(res.json()))
    assert any(expected == t or expected in t for t in texts), (
        f"expected Arabic {expected!r} in {texts!r}"
    )


@pytest.mark.django_db
class TestArabicResponses:
    def test_login_wrong_password(self, api_client, make_user):
        make_user("u@test.dev", password="right-pass")
        res = api_client.post(
            "/api/auth/token/",
            {"email": "u@test.dev", "password": "wrong"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 401
        assert_arabic(res, "No active account found with the given credentials")

    def test_login_throttled(self, api_client, make_user):
        make_user("u@test.dev", password="right-pass")
        for _ in range(5):
            api_client.post(
                "/api/auth/token/",
                {"email": "u@test.dev", "password": "wrong"},
                format="json",
            )
        res = api_client.post(
            "/api/auth/token/",
            {"email": "u@test.dev", "password": "wrong"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 429
        detail = res.json()["detail"]
        en_head = gettext("Request was throttled.")
        assert ar(en_head) in detail
        # Seconds count rendered with Arabic plural forms.
        assert any(p in detail for p in (ar_pl(
            "Expected available in {wait} second.",
            "Expected available in {wait} seconds.",
            n,
        ).format(wait=n) for n in range(1, 120))), detail
        assert "throttled" not in detail.lower() or "طلب" in detail

    def test_request_create_missing_title(self, api_client, auth_client, emp_a1):
        res = auth_client(emp_a1).post(
            "/api/requests/",
            {"type": "general", "description": "x"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        assert_arabic(res, "This field is required.")

    def test_edit_submitted_request(self, api_client, auth_client, make_request, emp_a1):
        req = make_request(emp_a1, status="submitted")
        res = auth_client(emp_a1).patch(
            f"/api/requests/{req.pk}/",
            {"title": "new"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        expected = ar("Cannot edit a request in status '%(status)s'.") % {
            "status": ar_ctx("status", "submitted")
        }
        assert expected in res.json()["detail"]

    def test_delete_non_draft_request(self, api_client, auth_client, make_request, emp_a1):
        req = make_request(emp_a1, status="submitted")
        res = auth_client(emp_a1).delete(
            f"/api/requests/{req.pk}/", HTTP_ACCEPT_LANGUAGE="ar"
        )
        assert res.status_code == 400
        assert_arabic(res, "Only draft requests can be deleted.")

    def test_reject_without_comment(
        self, api_client, auth_client, make_request, emp_a1, manager_a
    ):
        req = make_request(emp_a1, status="submitted")
        res = auth_client(manager_a).post(
            f"/api/requests/{req.pk}/reject/",
            {},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        assert_arabic(res, "This field is required.")

    def test_timesheet_end_before_start(self, api_client, auth_client, emp_a1):
        res = auth_client(emp_a1).post(
            "/api/timesheets/",
            {"date": "2026-10-14", "start_time": "10:00", "end_time": "09:00"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        assert_arabic(res, "End time must be after start time.")

    def test_timesheet_future_date(self, api_client, auth_client, emp_a1):
        res = auth_client(emp_a1).post(
            "/api/timesheets/",
            {"date": "2999-01-01", "start_time": "09:00", "end_time": "10:00"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        assert_arabic(res, "Date cannot be in the future.")

    def test_timesheet_overlap(self, api_client, auth_client, make_entry, emp_a1):
        entry = make_entry(emp_a1)
        res = auth_client(emp_a1).post(
            "/api/timesheets/",
            {
                "date": str(entry.date),
                "start_time": "10:00",
                "end_time": "18:00",
            },
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        assert_arabic(res, "This entry overlaps another entry on the same date.")

    def test_timesheet_edit_wrong_status(
        self, api_client, auth_client, make_entry, emp_a1
    ):
        entry = make_entry(emp_a1, status="submitted")
        res = auth_client(emp_a1).patch(
            f"/api/timesheets/{entry.pk}/",
            {"note": "x"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        expected = ar("Cannot edit a timesheet entry in status '%(status)s'.") % {
            "status": ar_ctx("status", "submitted")
        }
        assert expected in res.json()["detail"]

    def test_timesheet_delete_wrong_status(
        self, api_client, auth_client, make_entry, emp_a1
    ):
        entry = make_entry(emp_a1, status="submitted")
        res = auth_client(emp_a1).delete(
            f"/api/timesheets/{entry.pk}/", HTTP_ACCEPT_LANGUAGE="ar"
        )
        assert res.status_code == 400
        assert_arabic(res, "Only draft timesheet entries can be deleted.")

    def test_transition_from_wrong_status(
        self, api_client, auth_client, make_request, emp_a1, manager_a
    ):
        req = make_request(emp_a1, status="approved")
        res = auth_client(manager_a).post(
            f"/api/requests/{req.pk}/reject/",
            {"comment": "c"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        expected = ar("Cannot change status from '%(from)s' to '%(to)s'.") % {
            "from": ar_ctx("status", "approved"),
            "to": ar_ctx("status", "rejected"),
        }
        assert expected in res.json()["detail"]

    def test_bulk_submit_bad_ids(self, api_client, auth_client, emp_a1):
        res = auth_client(emp_a1).post(
            "/api/timesheets/submit/",
            {"ids": "nope"},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 400
        assert_arabic(res, "A non-empty list of integer ids is required.")

    def test_manager_self_manager(self, make_user):
        user = make_user("selfman@test.dev")
        user.manager_id = user.pk
        from django.core.exceptions import ValidationError

        with translation.override("ar"):
            with pytest.raises(ValidationError) as exc:
                user.full_clean()
        assert ar("A user cannot be their own manager.") in str(exc.value)

    def test_refresh_deactivated_user(self, api_client, make_user):
        user = make_user("gone@test.dev", password="pass1234!")
        tokens = obtain_tokens(api_client, "gone@test.dev", "pass1234!")
        refresh = tokens.json()["refresh"]
        user.is_active = False
        user.save()
        res = api_client.post(
            "/api/auth/token/refresh/",
            {"refresh": refresh},
            format="json",
            HTTP_ACCEPT_LANGUAGE="ar",
        )
        assert res.status_code == 401
        assert_arabic(res, "No active account found")


@pytest.mark.django_db
class TestEnglishUnchanged:
    """T-006-23: no header, `en`, `fr`, and malformed values → English."""

    def test_wrong_password_languages(self, api_client, make_user):
        make_user("u@test.dev", password="right-pass")
        expected = "No active account found with the given credentials"
        for header in (None, "en", "fr"):
            kw = {} if header is None else {"HTTP_ACCEPT_LANGUAGE": header}
            res = api_client.post(
                "/api/auth/token/",
                {"email": "u@test.dev", "password": "wrong"},
                format="json",
                **kw,
            )
            assert res.status_code == 401
            assert res.json()["detail"] == expected
            assert res.headers.get("Content-Language") == "en", header

    def test_edit_submitted_request_languages(
        self, api_client, auth_client, make_request, emp_a1
    ):
        req = make_request(emp_a1, status="submitted")
        expected = "Cannot edit a request in status 'submitted'."
        for header in (None, "en", "fr"):
            kw = {} if header is None else {"HTTP_ACCEPT_LANGUAGE": header}
            res = auth_client(emp_a1).patch(
                f"/api/requests/{req.pk}/", {"title": "x"}, format="json", **kw
            )
            assert res.status_code == 400
            assert res.json()["detail"] == expected

    def test_malformed_headers_never_500(self, api_client, make_user):
        make_user("u@test.dev", password="right-pass")
        for bad in ("x" * 5000, "ar;q=abc,,,", "../../etc"):
            res = api_client.post(
                "/api/auth/token/",
                {"email": "u@test.dev", "password": "wrong"},
                format="json",
                HTTP_ACCEPT_LANGUAGE=bad,
            )
            assert res.status_code == 401
            assert (
                res.json()["detail"]
                == "No active account found with the given credentials"
            )
            assert res.headers.get("Content-Language") == "en"
