from rest_framework.routers import DefaultRouter

from .views import TimesheetEntryViewSet

router = DefaultRouter()
router.register("timesheets", TimesheetEntryViewSet, basename="timesheet")

urlpatterns = router.urls
