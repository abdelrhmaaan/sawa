"""Notification event registry (feature 006 US3, data-model.md).

Each `kind` maps to an English template stored at creation time; the
template is rendered in the reader's language at read time. Params are
only ever substituted into our own templates — never used as templates —
so user-entered titles containing '%(x)s' or markup render literally.
"""

from django.utils.translation import get_language_bidi
from django.utils.translation import gettext_lazy
from django.utils.translation import ngettext_lazy

# kind → params → English template. The English text matches what was
# stored in `message` before `kind` existed, so older rows read the same.
KINDS = {
    "request_submitted": gettext_lazy(
        '%(actor)s submitted "%(title)s" for approval.'
    ),
    "request_approved": gettext_lazy('Your request "%(title)s" was approved.'),
    "request_rejected": gettext_lazy('Your request "%(title)s" was rejected.'),
    "request_returned": gettext_lazy('Your request "%(title)s" was returned.'),
    "timesheet_submitted": gettext_lazy(
        "%(actor)s submitted a timesheet entry for %(date)s."
    ),
    "timesheet_bulk_submitted": ngettext_lazy(
        "%(actor)s submitted %(count)d timesheet entry for review.",
        "%(actor)s submitted %(count)d timesheet entries for review.",
        0,
    ),
    "timesheet_approved": gettext_lazy(
        "Your timesheet entry for %(date)s was approved."
    ),
    "timesheet_returned": gettext_lazy(
        "Your timesheet entry for %(date)s was returned."
    ),
}


def render(kind, params, fallback):
    """Render the template for `kind` in the active language.

    Any unknown kind, missing param, or bad count falls back to the
    stored (English) `message` — rendering never raises.
    """
    template = KINDS.get(kind)
    if template is None:
        return fallback
    try:
        if kind == "timesheet_bulk_submitted":
            # ngettext_lazy picks by the count embedded in the lazy object;
            # rebuild it with the real count so plurals resolve correctly.
            from django.utils.translation import ngettext

            singular = (
                "%(actor)s submitted %(count)d timesheet entry for review."
            )
            plural = (
                "%(actor)s submitted %(count)d timesheet entries for review."
            )
            text = ngettext(singular, plural, params["count"])
        else:
            text = str(template)
        if get_language_bidi():
            # RTL: isolate substituted values so the bidi algorithm can't
            # scramble them (US3). Values with letters get FSI (U+2068),
            # which keeps their own direction; letter-free values like ISO
            # dates have no strong character for FSI to key on, so they
            # get LRI (U+2066) to force LTR. Numbers are left bare —
            # %(count)d stays an int and Arabic templates place it.
            def isolate(v):
                if not isinstance(v, str):
                    return v
                if any(c.isalpha() for c in v):
                    return "\u2068" + v + "\u2069"
                # Letter-free values like ISO dates: LRI forces LTR, and
                # U+2011 keeps hyphenated values from wrapping mid-date.
                return "\u2066" + v.replace("-", "\u2011") + "\u2069"

            params = {k: isolate(v) for k, v in params.items()}
        return text % params
    except (KeyError, TypeError, ValueError):
        return fallback
