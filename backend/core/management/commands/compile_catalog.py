import polib
from django.conf import settings
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Compile LOCALE_PATHS .po files to .mo with polib (no gettext needed)."

    def handle(self, *args, **options):
        for base in settings.LOCALE_PATHS:
            for po_path in sorted(base.glob("*/LC_MESSAGES/django.po")):
                po = polib.pofile(str(po_path))
                mo = polib.MOFile()
                for entry in po:
                    if entry.obsolete or "fuzzy" in entry.flags:
                        continue
                    mo.append(entry)
                mo_path = po_path.with_suffix(".mo")
                mo.save(str(mo_path))
                self.stdout.write(f"compiled {mo_path}")
