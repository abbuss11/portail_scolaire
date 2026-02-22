from django.urls import path

from . import api_views

app_name = "api"

urlpatterns = [
    path("auth/csrf/", api_views.csrf_token_view, name="auth_csrf"),
    path("auth/me/", api_views.auth_me_view, name="auth_me"),
    path("auth/login/", api_views.auth_login_view, name="auth_login"),
    path("auth/logout/", api_views.auth_logout_view, name="auth_logout"),
    path("dashboard/", api_views.dashboard_view, name="dashboard"),
    path("students/", api_views.students_view, name="students"),
    path("students/<int:student_id>/report/", api_views.student_report_view, name="student_report"),
    path("subjects/", api_views.subjects_view, name="subjects"),
    path("grades/", api_views.grades_view, name="grades"),
    path("grades/<int:grade_id>/", api_views.grade_detail_view, name="grade_detail"),
    path("absences/", api_views.absences_view, name="absences"),
    path("absences/<int:absence_id>/", api_views.absence_detail_view, name="absence_detail"),
    path("student/report/", api_views.my_report_view, name="my_report"),
    path("public/report/", api_views.public_report_view, name="public_report"),
]
