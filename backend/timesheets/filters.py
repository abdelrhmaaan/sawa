import django_filters

from core.workflow import pending_for

from .models import TimesheetEntry


class TimesheetEntryFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=TimesheetEntry.Status.choices)
    owner = django_filters.NumberFilter(field_name="owner_id")
    date_from = django_filters.DateFilter(field_name="date", lookup_expr="gte")
    date_to = django_filters.DateFilter(field_name="date", lookup_expr="lte")
    pending_my_action = django_filters.BooleanFilter(method="filter_pending")

    class Meta:
        model = TimesheetEntry
        fields = [
            "status",
            "owner",
            "date_from",
            "date_to",
            "pending_my_action",
        ]

    def filter_pending(self, qs, name, value):
        if not value:
            return qs
        return pending_for(qs, self.request.user)
