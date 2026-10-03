import datetime

from django.conf import settings
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

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
        """Sample requests in varied statuses (idempotent on owner+title)."""
        from employee_requests.models import Request, RequestStatusHistory

        # (owner_local, type, title, description, target_status, comment)
        rows = [
            ("sara", "leave", "Eid leave", "Three days off for Eid.", "approved", "Enjoy!"),
            ("sara", "equipment", "New monitor", "Second monitor for home setup.", "submitted", ""),
            ("sara", "wfh", "WFH Fridays", "Prefer remote on Fridays.", "draft", ""),
            ("karim", "general", "Parking pass", "Need a parking permit.", "rejected", "Lot is full."),
            ("karim", "hr_service", "Salary certificate", "For bank loan.", "returned", "Add bank name."),
            ("mona", "leave", "August vacation", "One week in August.", "submitted", ""),
            ("tarek", "equipment", "Keyboard", "Ergonomic keyboard.", "approved", ""),
            ("hr", "general", "Team outing budget", "Q4 team event.", "draft", ""),
        ]
        users = {u.email: u for u in User.objects.filter(email__endswith="@" + DEMO_DOMAIN)}
        for local, rtype, title, desc, status, comment in rows:
            owner = users[f"{local}@{DEMO_DOMAIN}"]
            req, created = Request.objects.get_or_create(
                owner=owner, title=title, defaults={"type": rtype, "description": desc}
            )
            if not created:
                continue
            self._apply_request_path(req, status, comment)

    def _apply_request_path(self, req, status, comment):
        """Replay the transition chain so history matches the final status."""
        from employee_requests.models import RequestStatusHistory as H

        def hist(actor, frm, to, c=""):
            H.objects.create(request=req, actor=actor, from_status=frm, to_status=to, comment=c)

        now = timezone.now()
        hist(req.owner, None, "draft")
        if status == "draft":
            return
        decider = req.owner.manager or User.objects.filter(role="hr").exclude(pk=req.owner.pk).first()
        req.status = "submitted"
        req.submitted_at = now
        hist(req.owner, "draft", "submitted")
        if status == "submitted":
            req.save()
            return
        if status == "returned":
            req.status = "returned"
            req.decided_at = now
            req.save()
            hist(decider, "submitted", "returned", comment)
            return
        req.status = status  # approved | rejected
        req.decided_at = now
        req.save()
        hist(decider, "submitted", status, comment)

    def _seed_timesheets(self, password):
        """A week of non-overlapping entries per employee in varied statuses."""
        from timesheets.models import TimesheetEntry, TimesheetStatusHistory

        today = timezone.localdate()
        monday = today - datetime.timedelta(days=today.weekday())  # current ISO week
        # (day offset, start, end, status, note)
        template = [
            (0, "09:00", "17:00", "approved", "Feature work"),
            (1, "09:00", "17:30", "approved", "Feature work"),
            (2, "09:00", "13:00", "submitted", "Half day"),
            (3, "09:00", "17:00", "submitted", ""),
            (4, "10:00", "16:00", "returned", "Clarify tasks"),
            (4, "16:30", "18:00", "draft", "Overtime"),
        ]
        users = User.objects.filter(
            email__in=[f"{l}@{DEMO_DOMAIN}" for l in ("sara", "karim", "mona", "tarek")]
        )
        for owner in users:
            for offset, start, end, status, note in template:
                day = monday + datetime.timedelta(days=offset)
                if day > today:  # entries can't be future-dated
                    continue
                st = datetime.time(*map(int, start.split(":")))
                et = datetime.time(*map(int, end.split(":")))
                entry, created = TimesheetEntry.objects.get_or_create(
                    owner=owner, date=day, start_time=st,
                    defaults={"end_time": et, "note": note},
                )
                if not created:
                    continue
                self._apply_entry_path(entry, status)

    def _apply_entry_path(self, entry, status):
        from timesheets.models import TimesheetStatusHistory as H

        def hist(actor, frm, to, c=""):
            H.objects.create(entry=entry, actor=actor, from_status=frm, to_status=to, comment=c)

        now = timezone.now()
        hist(entry.owner, None, "draft")
        if status == "draft":
            return
        decider = entry.owner.manager or User.objects.filter(role="hr").exclude(pk=entry.owner.pk).first()
        entry.status = "submitted"
        entry.submitted_at = now
        hist(entry.owner, "draft", "submitted")
        if status == "submitted":
            entry.save()
            return
        if status == "returned":
            entry.status = "returned"
            entry.reviewed_at = now
            entry.save()
            hist(decider, "submitted", "returned", "Please add detail.")
            return
        entry.status = status  # approved
        entry.reviewed_at = now
        entry.save()
        hist(decider, "submitted", status)
