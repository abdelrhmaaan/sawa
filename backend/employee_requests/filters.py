import django_filters

from core.workflow import pending_for

from .models import Request


class RequestFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=Request.Status.choices)
    type = django_filters.ChoiceFilter(choices=Request.Type.choices)
    owner = django_filters.NumberFilter(field_name="owner_id")
    created_after = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="gte"
    )
    created_before = django_filters.DateTimeFilter(
        field_name="created_at", lookup_expr="lte"
    )
    pending_my_action = django_filters.BooleanFilter(method="filter_pending")

    class Meta:
        model = Request
        fields = [
            "status",
            "type",
            "owner",
            "created_after",
            "created_before",
            "pending_my_action",
        ]

    def filter_pending(self, qs, name, value):
        if not value:
            return qs
        return pending_for(qs, self.request.user)
