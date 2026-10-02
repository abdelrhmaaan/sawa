from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand, CommandError

from accounts.models import User

DEMO_DOMAIN = "sawa.demo"


class Command(BaseCommand):
    help = "Seed the demo organization: 1 HR, 2 managers, 4 employees. Idempotent."

    def handle(self, *args, **options):
        password = settings.SEED_DEMO_PASSWORD
        if not password:
            raise CommandError(
                "SEED_DEMO_PASSWORD is not set (env var or backend/.env)"
            )

        hr = self._upsert(
            "hr", "Huda", "Rahim", User.Role.HR, is_staff=True, department="People"
        )
        # HR gets admin access to manage users (no superuser needed).
        user_perms = Permission.objects.filter(
            content_type=ContentType.objects.get_for_model(User)
        )
        hr.user_permissions.set(user_perms)

        manager_a = self._upsert(
            "manager.a", "Layla", "Nasser", User.Role.MANAGER, department="Engineering"
        )
        manager_b = self._upsert(
            "manager.b", "Omar", "Farouk", User.Role.MANAGER, department="Operations"
        )

        self._upsert("sara", "Sara", "Hassan", User.Role.EMPLOYEE, manager=manager_a, department="Engineering")
        self._upsert("karim", "Karim", "Adel", User.Role.EMPLOYEE, manager=manager_a, department="Engineering")
        self._upsert("mona", "Mona", "Said", User.Role.EMPLOYEE, manager=manager_b, department="Operations")
        self._upsert("tarek", "Tarek", "Nabil", User.Role.EMPLOYEE, manager=manager_b, department="Operations")

        # --- extension points for features 003/004 sample data ---
        self._seed_requests(password)
        self._seed_timesheets(password)

        emails = [f"{local}@{DEMO_DOMAIN}" for local in
                  ("hr", "manager.a", "manager.b", "sara", "karim", "mona", "tarek")]
        self.stdout.write(
            self.style.SUCCESS(
                "Seeded demo org (idempotent). Emails: " + ", ".join(emails)
            )
        )

    def _upsert(self, local, first, last, role, manager=None, department="", is_staff=False):
        email = f"{local}@{DEMO_DOMAIN}"
        user, _ = User.objects.update_or_create(
            email=email,
            defaults={
                "first_name": first,
                "last_name": last,
                "role": role,
                "manager": manager,
                "department": department,
                "is_staff": is_staff,
                "is_active": True,
            },
        )
        user.set_password(settings.SEED_DEMO_PASSWORD)
        user.save()
        return user

    def _seed_requests(self, password):
        """Populated by feature 003 (sample requests in varied statuses)."""

    def _seed_timesheets(self, password):
        """Populated by feature 004 (a week of entries in varied statuses)."""
