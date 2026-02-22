from __future__ import annotations

import json
from collections import defaultdict
from datetime import date
from functools import wraps
from typing import Any

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import transaction
from django.db.models import Avg, Count, QuerySet
from django.db.models.functions import TruncMonth
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_http_methods

from .models import Attendance, Grade, Profile, Student, Subject

User = get_user_model()

ROLE_MAP = {
    "ADMIN": "admin",
    "PROF": "teacher",
    "STUDENT": "student",
}

CLASS_LEVELS = [choice[0] for choice in Student.NIVEAU_CHOICES]

CLASS_LEVEL_NORMALIZATION_MAP = {
    "L1": "L1",
    "L2": "L2",
    "L3": "L3",
    "M1": "M1",
    "M2": "M2",
    "LICENCE1": "L1",
    "LICENCE2": "L2",
    "LICENCE3": "L3",
    "LICENSE1": "L1",
    "LICENSE2": "L2",
    "LICENSE3": "L3",
    "MASTER1": "M1",
    "MASTER2": "M2",
}


def api_login_required(view_func):
    @wraps(view_func)
    def _wrapped(request: HttpRequest, *args, **kwargs):
        if not request.user.is_authenticated:
            return json_error("Authentification requise.", status=401)
        return view_func(request, *args, **kwargs)

    return _wrapped


def json_error(message: str, status: int = 400) -> JsonResponse:
    return JsonResponse({"error": message}, status=status)


def parse_json_body(request: HttpRequest) -> dict[str, Any]:
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}


def parse_boolean(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return bool(value)


def parse_iso_date(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    try:
        return date.fromisoformat(value).isoformat()
    except ValueError:
        return None


def normalize_class_level(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip().upper().replace(" ", "")
    return CLASS_LEVEL_NORMALIZATION_MAP.get(cleaned)


def get_user_role(user: User) -> str:
    if user.is_superuser or user.is_staff:
        return "admin"

    profile = getattr(user, "profile", None)
    if profile is None:
        return "student"
    return ROLE_MAP.get(profile.role, "student")


def can_manage_school_data(user: User) -> bool:
    return get_user_role(user) in {"admin", "teacher"}


def get_student_for_user(user: User) -> Student | None:
    profile = getattr(user, "profile", None)
    if profile is None:
        return None
    try:
        return Student.objects.select_related("profile", "profile__user").get(profile=profile)
    except Student.DoesNotExist:
        return None


def serialize_user(user: User) -> dict[str, Any]:
    role = get_user_role(user)
    payload: dict[str, Any] = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "fullName": user.get_full_name().strip() or user.username,
        "role": role,
    }

    if role == "student":
        student = get_student_for_user(user)
        if student is not None:
            payload["student"] = {
                "id": student.id,
                "matricule": student.matricule,
                "classe": student.classe,
                "fullName": f"{student.nom} {student.prenom}",
            }

    return payload


def serialize_student(student: Student) -> dict[str, Any]:
    account_username = None
    if hasattr(student, "profile") and hasattr(student.profile, "user"):
        account_username = student.profile.user.username
    return {
        "id": student.id,
        "matricule": student.matricule,
        "nom": student.nom,
        "prenom": student.prenom,
        "fullName": f"{student.nom} {student.prenom}",
        "classe": student.classe,
        "dateNaissance": student.date_naissance.isoformat() if student.date_naissance else None,
        "telephone": student.telephone,
        "accountUsername": account_username,
    }


def serialize_subject(subject: Subject) -> dict[str, Any]:
    return {
        "id": subject.id,
        "name": subject.name,
        "coefficient": subject.coefficient,
    }


def serialize_grade(grade: Grade) -> dict[str, Any]:
    return {
        "id": grade.id,
        "studentId": grade.student_id,
        "studentName": f"{grade.student.nom} {grade.student.prenom}",
        "matricule": grade.student.matricule,
        "subjectId": grade.subject_id,
        "subjectName": grade.subject.name,
        "coefficient": grade.subject.coefficient,
        "value": grade.value,
        "date": grade.date.isoformat() if grade.date else None,
    }


def serialize_absence(absence: Attendance) -> dict[str, Any]:
    return {
        "id": absence.id,
        "studentId": absence.student_id,
        "studentName": f"{absence.student.nom} {absence.student.prenom}",
        "matricule": absence.student.matricule,
        "date": absence.date.isoformat(),
        "present": absence.present,
        "justified": absence.justified,
    }


def build_student_report(student: Student) -> dict[str, Any]:
    grades = list(
        Grade.objects.filter(student=student)
        .select_related("subject", "student")
        .order_by("-date", "-id")
    )
    absences_qs = Attendance.objects.filter(student=student, present=False)

    total_weight = 0
    weighted_sum = 0.0
    by_subject_data: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"sum": 0.0, "count": 0, "coefficient": 1}
    )

    for grade in grades:
        coefficient = grade.subject.coefficient or 1
        total_weight += coefficient
        weighted_sum += grade.value * coefficient

        entry = by_subject_data[grade.subject.name]
        entry["sum"] += grade.value
        entry["count"] += 1
        entry["coefficient"] = coefficient

    average = round(weighted_sum / total_weight, 2) if total_weight > 0 else None

    by_subject = [
        {
            "subject": subject_name,
            "average": round(data["sum"] / data["count"], 2),
            "gradesCount": data["count"],
            "coefficient": data["coefficient"],
        }
        for subject_name, data in sorted(by_subject_data.items())
    ]

    total_absences = absences_qs.count()
    justified_absences = absences_qs.filter(justified=True).count()

    return {
        "student": serialize_student(student),
        "average": average,
        "totalGrades": len(grades),
        "grades": [serialize_grade(grade) for grade in grades],
        "bySubject": by_subject,
        "absences": {
            "total": total_absences,
            "justified": justified_absences,
            "unjustified": total_absences - justified_absences,
        },
    }


def subject_average_chart(grades_qs: QuerySet[Grade]) -> list[dict[str, Any]]:
    chart_data = (
        grades_qs.values("subject__name")
        .annotate(value=Avg("value"))
        .order_by("subject__name")
    )
    return [
        {
            "label": item["subject__name"],
            "value": round(item["value"] or 0.0, 2),
        }
        for item in chart_data
    ]


def monthly_activity_chart(
    grades_qs: QuerySet[Grade], absences_qs: QuerySet[Attendance]
) -> list[dict[str, Any]]:
    grade_counts = {
        item["month"].strftime("%Y-%m"): item["count"]
        for item in grades_qs.annotate(month=TruncMonth("date"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
        if item["month"] is not None
    }
    absence_counts = {
        item["month"].strftime("%Y-%m"): item["count"]
        for item in absences_qs.annotate(month=TruncMonth("date"))
        .values("month")
        .annotate(count=Count("id"))
        .order_by("month")
        if item["month"] is not None
    }

    labels = sorted(set(grade_counts.keys()) | set(absence_counts.keys()))
    return [
        {
            "label": label,
            "grades": grade_counts.get(label, 0),
            "absences": absence_counts.get(label, 0),
        }
        for label in labels
    ]


def grade_distribution_chart(grades_qs: QuerySet[Grade]) -> list[dict[str, Any]]:
    bins = [
        ("0-9", 0, 10),
        ("10-11", 10, 12),
        ("12-13", 12, 14),
        ("14-15", 14, 16),
        ("16-20", 16, 20.01),
    ]
    values = list(grades_qs.values_list("value", flat=True))
    payload: list[dict[str, Any]] = []
    for label, min_value, max_value in bins:
        count = len([value for value in values if min_value <= value < max_value])
        payload.append({"label": label, "value": count})
    return payload


@require_GET
@ensure_csrf_cookie
def csrf_token_view(request: HttpRequest) -> JsonResponse:
    return JsonResponse({"detail": "CSRF cookie set"})


@require_GET
def auth_me_view(request: HttpRequest) -> JsonResponse:
    if not request.user.is_authenticated:
        return JsonResponse({"authenticated": False, "user": None})
    return JsonResponse({"authenticated": True, "user": serialize_user(request.user)})


@require_http_methods(["POST"])
def auth_login_view(request: HttpRequest) -> JsonResponse:
    data = parse_json_body(request)
    identifier = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not identifier or not password:
        return json_error("Nom utilisateur/email et mot de passe requis.")

    username = identifier
    if "@" in identifier:
        user_by_email = User.objects.filter(email__iexact=identifier).first()
        if user_by_email is not None:
            username = user_by_email.username
    else:
        student = (
            Student.objects.select_related("profile", "profile__user")
            .filter(matricule__iexact=identifier)
            .first()
        )
        if student is not None and hasattr(student.profile, "user"):
            username = student.profile.user.username

    user = authenticate(request, username=username, password=password)
    if user is None:
        return json_error("Identifiants invalides.", status=401)

    if not user.is_active:
        return json_error("Compte desactive.", status=403)

    login(request, user)
    return JsonResponse({"authenticated": True, "user": serialize_user(user)})


@require_http_methods(["POST"])
def auth_logout_view(request: HttpRequest) -> JsonResponse:
    if request.user.is_authenticated:
        logout(request)
    return JsonResponse({"ok": True})


@api_login_required
@require_GET
def dashboard_view(request: HttpRequest) -> JsonResponse:
    role = get_user_role(request.user)

    if role == "student":
        student = get_student_for_user(request.user)
        if student is None:
            return json_error("Aucun profil eleve associe a ce compte.", status=404)
        grades_qs = Grade.objects.filter(student=student)
        absences_qs = Attendance.objects.filter(student=student, present=False)

        average_grade = grades_qs.aggregate(value=Avg("value"))["value"] or 0.0
        stats = {
            "totalStudents": 1,
            "totalSubjects": grades_qs.values("subject_id").distinct().count(),
            "totalGrades": grades_qs.count(),
            "totalAbsences": absences_qs.count(),
            "averageGrade": round(average_grade, 2),
            "justifiedAbsences": absences_qs.filter(justified=True).count(),
        }
    else:
        grades_qs = Grade.objects.all()
        absences_qs = Attendance.objects.filter(present=False)
        average_grade = grades_qs.aggregate(value=Avg("value"))["value"] or 0.0
        stats = {
            "totalStudents": Student.objects.count(),
            "totalSubjects": Subject.objects.count(),
            "totalGrades": grades_qs.count(),
            "totalAbsences": absences_qs.count(),
            "averageGrade": round(average_grade, 2),
            "justifiedAbsences": absences_qs.filter(justified=True).count(),
        }

    return JsonResponse(
        {
            "stats": stats,
            "subjectAverages": subject_average_chart(grades_qs),
            "monthlyActivity": monthly_activity_chart(grades_qs, absences_qs),
            "gradeDistribution": grade_distribution_chart(grades_qs),
        }
    )


@api_login_required
@require_http_methods(["GET", "POST"])
def students_view(request: HttpRequest) -> JsonResponse:
    if request.method == "POST":
        if not can_manage_school_data(request.user):
            return json_error("Action reservee aux administrateurs et professeurs.", status=403)

        data = parse_json_body(request)
        matricule = (data.get("matricule") or "").strip()
        nom = (data.get("nom") or "").strip()
        prenom = (data.get("prenom") or "").strip()
        classe_input = (data.get("classe") or "").strip()
        classe = normalize_class_level(classe_input)
        telephone = (data.get("telephone") or "").strip()
        email = (data.get("email") or "").strip()
        username = (data.get("username") or "").strip() or matricule.lower()
        password = (data.get("password") or "").strip()
        parsed_date_naissance = parse_iso_date(data.get("dateNaissance") or data.get("date_naissance"))

        if not matricule or not nom or not prenom or not classe_input:
            return json_error(
                "Les champs matricule, nom, prenom et niveau/classe sont obligatoires."
            )

        if classe not in CLASS_LEVELS:
            return json_error("Niveau/classe invalide. Valeurs autorisees: L1, L2, L3, M1, M2.")

        if (data.get("dateNaissance") or data.get("date_naissance")) and not parsed_date_naissance:
            return json_error("Format de date de naissance invalide (YYYY-MM-DD).")

        if Student.objects.filter(matricule__iexact=matricule).exists():
            return json_error("Ce matricule existe deja.", status=409)

        if User.objects.filter(username__iexact=username).exists():
            return json_error("Ce nom utilisateur existe deja.", status=409)

        default_password_used = False
        if not password:
            password = matricule
            default_password_used = True

        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                is_active=True,
            )
            profile = getattr(user, "profile", None)
            if profile is None:
                profile = Profile.objects.create(user=user, role="STUDENT")
            elif profile.role != "STUDENT":
                profile.role = "STUDENT"
                profile.save(update_fields=["role"])
            student = Student.objects.create(
                profile=profile,
                matricule=matricule,
                nom=nom,
                prenom=prenom,
                classe=classe,
                telephone=telephone,
                date_naissance=parsed_date_naissance,
            )

        student = Student.objects.select_related("profile", "profile__user").get(pk=student.pk)
        return JsonResponse(
            {
                "student": serialize_student(student),
                "credentials": {
                    "username": username,
                    "password": password,
                    "defaultPasswordUsed": default_password_used,
                },
            },
            status=201,
        )

    role = get_user_role(request.user)
    if role == "student":
        student = get_student_for_user(request.user)
        if student is None:
            return JsonResponse({"students": []})
        return JsonResponse({"students": [serialize_student(student)]})

    students = Student.objects.select_related("profile", "profile__user").order_by("nom", "prenom")
    return JsonResponse({"students": [serialize_student(student) for student in students]})


@api_login_required
@require_GET
def subjects_view(request: HttpRequest) -> JsonResponse:
    subjects = Subject.objects.order_by("name")
    return JsonResponse({"subjects": [serialize_subject(subject) for subject in subjects]})


@api_login_required
@require_http_methods(["GET", "POST"])
def grades_view(request: HttpRequest) -> JsonResponse:
    role = get_user_role(request.user)

    if request.method == "GET":
        grades_qs = Grade.objects.select_related("student", "subject").order_by("-date", "-id")
        if role == "student":
            student = get_student_for_user(request.user)
            if student is None:
                return JsonResponse({"grades": []})
            grades_qs = grades_qs.filter(student=student)
        return JsonResponse({"grades": [serialize_grade(grade) for grade in grades_qs]})

    if not can_manage_school_data(request.user):
        return json_error("Action reservee aux administrateurs et professeurs.", status=403)

    data = parse_json_body(request)
    try:
        student = Student.objects.get(pk=int(data.get("studentId")))
        subject = Subject.objects.get(pk=int(data.get("subjectId")))
        value = float(data.get("value"))
    except (TypeError, ValueError, Student.DoesNotExist, Subject.DoesNotExist):
        return json_error("Donnees de note invalides.")

    if value < 0 or value > 20:
        return json_error("La note doit etre comprise entre 0 et 20.")

    grade = Grade.objects.create(student=student, subject=subject, value=value)
    grade = Grade.objects.select_related("student", "subject").get(pk=grade.pk)
    return JsonResponse({"grade": serialize_grade(grade)}, status=201)


@api_login_required
@require_http_methods(["PUT", "PATCH", "DELETE"])
def grade_detail_view(request: HttpRequest, grade_id: int) -> JsonResponse:
    if not can_manage_school_data(request.user):
        return json_error("Action reservee aux administrateurs et professeurs.", status=403)

    try:
        grade = Grade.objects.select_related("student", "subject").get(pk=grade_id)
    except Grade.DoesNotExist:
        return json_error("Note introuvable.", status=404)

    if request.method == "DELETE":
        grade.delete()
        return JsonResponse({"ok": True})

    data = parse_json_body(request)

    if "studentId" in data:
        try:
            grade.student = Student.objects.get(pk=int(data["studentId"]))
        except (TypeError, ValueError, Student.DoesNotExist):
            return json_error("Eleve invalide.")

    if "subjectId" in data:
        try:
            grade.subject = Subject.objects.get(pk=int(data["subjectId"]))
        except (TypeError, ValueError, Subject.DoesNotExist):
            return json_error("Matiere invalide.")

    if "value" in data:
        try:
            value = float(data["value"])
        except (TypeError, ValueError):
            return json_error("Valeur de note invalide.")
        if value < 0 or value > 20:
            return json_error("La note doit etre comprise entre 0 et 20.")
        grade.value = value

    grade.save()
    grade = Grade.objects.select_related("student", "subject").get(pk=grade.pk)
    return JsonResponse({"grade": serialize_grade(grade)})


@api_login_required
@require_http_methods(["GET", "POST"])
def absences_view(request: HttpRequest) -> JsonResponse:
    role = get_user_role(request.user)

    if request.method == "GET":
        absences_qs = Attendance.objects.select_related("student").order_by("-date", "-id")
        if role == "student":
            student = get_student_for_user(request.user)
            if student is None:
                return JsonResponse({"absences": []})
            absences_qs = absences_qs.filter(student=student, present=False)
        else:
            absences_qs = absences_qs.filter(present=False)
        return JsonResponse({"absences": [serialize_absence(absence) for absence in absences_qs]})

    if not can_manage_school_data(request.user):
        return json_error("Action reservee aux administrateurs et professeurs.", status=403)

    data = parse_json_body(request)
    try:
        student = Student.objects.get(pk=int(data.get("studentId")))
        absence_date = parse_iso_date(data.get("date"))
        justified = parse_boolean(data.get("justified", False))
    except (TypeError, ValueError, Student.DoesNotExist):
        return json_error("Donnees d'absence invalides.")

    if not absence_date:
        return json_error("La date est obligatoire.")

    absence = Attendance.objects.create(
        student=student,
        date=absence_date,
        present=False,
        justified=justified,
    )

    absence = Attendance.objects.select_related("student").get(pk=absence.pk)
    return JsonResponse({"absence": serialize_absence(absence)}, status=201)


@api_login_required
@require_http_methods(["PUT", "PATCH", "DELETE"])
def absence_detail_view(request: HttpRequest, absence_id: int) -> JsonResponse:
    if not can_manage_school_data(request.user):
        return json_error("Action reservee aux administrateurs et professeurs.", status=403)

    try:
        absence = Attendance.objects.select_related("student").get(pk=absence_id)
    except Attendance.DoesNotExist:
        return json_error("Absence introuvable.", status=404)

    if request.method == "DELETE":
        absence.delete()
        return JsonResponse({"ok": True})

    data = parse_json_body(request)

    if "studentId" in data:
        try:
            absence.student = Student.objects.get(pk=int(data["studentId"]))
        except (TypeError, ValueError, Student.DoesNotExist):
            return json_error("Eleve invalide.")

    if "date" in data:
        parsed_date = parse_iso_date(data["date"])
        if not parsed_date:
            return json_error("Format de date invalide (YYYY-MM-DD).")
        absence.date = parsed_date

    if "justified" in data:
        absence.justified = parse_boolean(data["justified"])

    if "present" in data:
        absence.present = parse_boolean(data["present"])

    absence.save()
    absence = Attendance.objects.select_related("student").get(pk=absence.pk)
    return JsonResponse({"absence": serialize_absence(absence)})


@api_login_required
@require_GET
def my_report_view(request: HttpRequest) -> JsonResponse:
    role = get_user_role(request.user)
    if role != "student":
        return json_error("Endpoint reserve aux comptes eleves.", status=403)

    student = get_student_for_user(request.user)
    if student is None:
        return json_error("Aucun profil eleve associe a ce compte.", status=404)
    return JsonResponse({"report": build_student_report(student)})


@api_login_required
@require_GET
def student_report_view(request: HttpRequest, student_id: int) -> JsonResponse:
    if not can_manage_school_data(request.user):
        return json_error("Action reservee aux administrateurs et professeurs.", status=403)
    try:
        student = Student.objects.get(pk=student_id)
    except Student.DoesNotExist:
        return json_error("Eleve introuvable.", status=404)
    return JsonResponse({"report": build_student_report(student)})


@require_GET
def public_report_view(request: HttpRequest) -> JsonResponse:
    matricule = (request.GET.get("matricule") or "").strip()
    if not matricule:
        return json_error("Veuillez renseigner un matricule.")

    try:
        student = Student.objects.get(matricule__iexact=matricule)
    except Student.DoesNotExist:
        return json_error("Aucun eleve trouve pour ce matricule.", status=404)

    return JsonResponse({"report": build_student_report(student)})
