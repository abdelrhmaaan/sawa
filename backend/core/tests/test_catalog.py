"""T-006-24: the Arabic catalog is complete and the committed .mo is
in sync with the .po (catches a forgotten `compile_catalog`)."""

import re
from pathlib import Path

import polib

PO_PATH = (
    Path(__file__).resolve().parents[2]
    / "locale"
    / "ar"
    / "LC_MESSAGES"
    / "django.po"
)
MO_PATH = PO_PATH.with_suffix(".mo")

PLACEHOLDER = re.compile(r"%\([^)]+\)[sd]|\{[a-zA-Z_][a-zA-Z0-9_]*\}")


def _placeholders(text):
    return sorted(PLACEHOLDER.findall(text))


def test_every_entry_translated_and_placeholders_match():
    po = polib.pofile(str(PO_PATH))
    assert len(po) > 0
    problems = []
    for entry in po:
        if entry.obsolete:
            continue
        label = entry.msgid_with_context or entry.msgid
        if entry.flags and "fuzzy" in entry.flags:
            problems.append(f"fuzzy: {label}")
        if entry.msgid_plural:
            expected = set(range(6))  # Arabic nplurals=6
            filled = set(entry.msgstr_plural.keys())
            if filled != expected or any(
                not v.strip() for v in entry.msgstr_plural.values()
            ):
                problems.append(f"plural not fully translated: {label}")
            for n, msgstr in entry.msgstr_plural.items():
                if _placeholders(msgstr) != _placeholders(
                    entry.msgid_plural
                ):
                    problems.append(
                        f"plural placeholder mismatch: {label}[{n}]"
                    )
            if _placeholders(entry.msgid) != _placeholders(entry.msgid_plural):
                problems.append(f"singular/plural placeholders differ: {label}")
        else:
            if not entry.msgstr.strip():
                problems.append(f"empty msgstr: {label}")
            elif _placeholders(entry.msgstr) != _placeholders(entry.msgid):
                problems.append(f"placeholder mismatch: {label}")
    assert not problems, "\n".join(problems)


def test_mo_matches_po():
    po = polib.pofile(str(PO_PATH))
    mo = polib.mofile(str(MO_PATH))
    po_map = {
        (e.msgctxt or "", e.msgid, e.msgid_plural): (
            e.msgstr_plural if e.msgid_plural else e.msgstr
        )
        for e in po
        if not e.obsolete and (e.msgstr or e.msgstr_plural)
    }
    mo_map = {
        (e.msgctxt or "", e.msgid, e.msgid_plural): (
            e.msgstr_plural if e.msgid_plural else e.msgstr
        )
        for e in mo
        if e.msgstr or e.msgstr_plural
    }
    assert po_map == mo_map, (
        "django.mo is out of sync with django.po — run "
        "`manage.py compile_catalog`."
    )
