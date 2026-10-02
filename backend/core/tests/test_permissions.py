import pytest

from accounts.models import User
from core.pagination import StandardPagination
from core.permissions import get_approver


@pytest.mark.django_db
class TestGetApprover:
    def test_employee_with_manager_gets_manager(self, emp_a1, manager_a):
        assert get_approver(emp_a1) == manager_a

    def test_employee_without_manager_gets_hr(self, make_user, hr_user):
        orphan = make_user("orphan@test.dev")
        assert get_approver(orphan) == hr_user

    def test_hr_without_manager_gets_none_not_self(self, hr_user):
        # Only one HR exists → no valid approver (never self).
        assert get_approver(hr_user) is None

    def test_second_hr_approves_first_hr(self, make_user, hr_user):
        hr2 = make_user("hr2@test.dev", role=User.Role.HR)
        assert get_approver(hr2) == hr_user
        assert get_approver(hr_user) == hr2


class TestStandardPagination:
    def test_defaults(self):
        p = StandardPagination()
        assert p.page_size == 20
        assert p.page_size_query_param == "page_size"
        assert p.max_page_size == 100
