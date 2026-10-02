import os
from pathlib import Path

import environ

# Test env. backend/.env is read FIRST so real dev values (e.g. Postgres on
# 5434) win; setdefault below only fills gaps when .env is absent.
# DATABASE_URL falls back to sqlite only when no DATABASE_URL exists anywhere.
BASE_DIR = Path(__file__).resolve().parent

environ.Env.read_env(BASE_DIR / ".env")

os.environ.setdefault("SECRET_KEY", "insecure-pytest-key")
os.environ.setdefault("DEBUG", "true")
os.environ.setdefault("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")
os.environ.setdefault("SEED_DEMO_PASSWORD", "demo-pass-123")
os.environ.setdefault(
    "DATABASE_URL", f"sqlite:///{BASE_DIR / 'test_db.sqlite3'}"
)

import pytest
from rest_framework.test import APIClient

from accounts.models import User


@pytest.fixture(autouse=True)
def _fast_password_hasher(settings):
    settings.PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def make_user(db, _fast_password_hasher):
    def _make(email, password="pass1234!", role=User.Role.EMPLOYEE, manager=None, **kw):
        kw.setdefault("first_name", email.split("@")[0].title())
        kw.setdefault("last_name", "Test")
        return User.objects.create_user(
            email=email, password=password, role=role, manager=manager, **kw
        )

    return _make


@pytest.fixture
def hr_user(make_user):
    user = make_user("hr@test.dev", role=User.Role.HR, is_staff=True)
    # Same admin perms seed_demo grants: all permissions on the User model.
    from django.contrib.auth.models import Permission
    from django.contrib.contenttypes.models import ContentType

    user.user_permissions.set(
        Permission.objects.filter(content_type=ContentType.objects.get_for_model(User))
    )
    return user


@pytest.fixture
def manager_a(make_user):
    return make_user("manager.a@test.dev", role=User.Role.MANAGER)


@pytest.fixture
def manager_b(make_user):
    return make_user("manager.b@test.dev", role=User.Role.MANAGER)


@pytest.fixture
def emp_a1(make_user, manager_a):
    return make_user("emp.a1@test.dev", manager=manager_a)


@pytest.fixture
def emp_a2(make_user, manager_a):
    return make_user("emp.a2@test.dev", manager=manager_a)


@pytest.fixture
def emp_b1(make_user, manager_b):
    return make_user("emp.b1@test.dev", manager=manager_b)


@pytest.fixture
def employee(emp_a1):
    return emp_a1


@pytest.fixture
def auth_client(db):
    """auth_client(user) → APIClient authenticated as that user."""
    def _for(user):
        client = APIClient()
        client.force_authenticate(user=user)
        return client

    return _for


def obtain_tokens(client, email, password):
    return client.post(
        "/api/auth/token/", {"email": email, "password": password}, format="json"
    )
