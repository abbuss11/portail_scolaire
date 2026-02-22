import {
  Absence,
  AuthUser,
  DashboardData,
  Grade,
  Student,
  StudentCreateResult,
  StudentReport,
  Subject,
} from "./types";

type JsonObject = Record<string, unknown>;

interface AuthMeResponse {
  authenticated: boolean;
  user: AuthUser | null;
}

interface LoginResponse {
  authenticated: boolean;
  user: AuthUser;
}

interface DashboardResponse {
  stats: DashboardData["stats"];
  subjectAverages: DashboardData["subjectAverages"];
  monthlyActivity: DashboardData["monthlyActivity"];
  gradeDistribution: DashboardData["gradeDistribution"];
}

interface StudentsResponse {
  students: Student[];
}

interface StudentCreateResponse {
  student: Student;
  credentials: StudentCreateResult["credentials"];
}

interface SubjectsResponse {
  subjects: Subject[];
}

interface GradesResponse {
  grades: Grade[];
}

interface GradeResponse {
  grade: Grade;
}

interface AbsencesResponse {
  absences: Absence[];
}

interface AbsenceResponse {
  absence: Absence;
}

interface ReportResponse {
  report: StudentReport;
}

const API_BASE = "/api";

function getCookie(name: string): string | null {
  const parts = document.cookie.split(";").map((item) => item.trim());
  const cookie = parts.find((item) => item.startsWith(`${name}=`));
  if (!cookie) {
    return null;
  }
  return decodeURIComponent(cookie.split("=").slice(1).join("="));
}

function isUnsafeMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method.toUpperCase());
}

async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_BASE}/auth/csrf/`, {
    credentials: "include",
  });
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers || {});

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isUnsafeMethod(method)) {
    let csrfToken = getCookie("csrftoken");
    if (!csrfToken) {
      await ensureCsrfCookie();
      csrfToken = getCookie("csrftoken");
    }
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    method,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload: JsonObject | null = isJson ? ((await response.json()) as JsonObject) : null;

  if (!response.ok) {
    const errorMessage =
      (payload && typeof payload.error === "string" && payload.error) ||
      `Erreur HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return (payload as T) || ({} as T);
}

export async function bootstrapSession(): Promise<AuthMeResponse> {
  await ensureCsrfCookie();
  return requestJson<AuthMeResponse>("/auth/me/");
}

export async function loginUser(username: string, password: string): Promise<LoginResponse> {
  return requestJson<LoginResponse>("/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function logoutUser(): Promise<void> {
  await requestJson<{ ok: boolean }>("/auth/logout/", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function fetchDashboard(): Promise<DashboardResponse> {
  return requestJson<DashboardResponse>("/dashboard/");
}

export async function fetchStudents(): Promise<StudentsResponse> {
  return requestJson<StudentsResponse>("/students/");
}

export async function createStudent(payload: {
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  telephone?: string;
  dateNaissance?: string;
  username?: string;
  password?: string;
  email?: string;
}): Promise<StudentCreateResponse> {
  return requestJson<StudentCreateResponse>("/students/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchSubjects(): Promise<SubjectsResponse> {
  return requestJson<SubjectsResponse>("/subjects/");
}

export async function fetchGrades(): Promise<GradesResponse> {
  return requestJson<GradesResponse>("/grades/");
}

export async function createGrade(payload: {
  studentId: number;
  subjectId: number;
  value: number;
}): Promise<GradeResponse> {
  return requestJson<GradeResponse>("/grades/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateGrade(
  gradeId: number,
  payload: Partial<{
    studentId: number;
    subjectId: number;
    value: number;
  }>
): Promise<GradeResponse> {
  return requestJson<GradeResponse>(`/grades/${gradeId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteGrade(gradeId: number): Promise<void> {
  await requestJson<{ ok: boolean }>(`/grades/${gradeId}/`, {
    method: "DELETE",
  });
}

export async function fetchAbsences(): Promise<AbsencesResponse> {
  return requestJson<AbsencesResponse>("/absences/");
}

export async function createAbsence(payload: {
  studentId: number;
  date: string;
  justified: boolean;
}): Promise<AbsenceResponse> {
  return requestJson<AbsenceResponse>("/absences/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateAbsence(
  absenceId: number,
  payload: Partial<{
    studentId: number;
    date: string;
    present: boolean;
    justified: boolean;
  }>
): Promise<AbsenceResponse> {
  return requestJson<AbsenceResponse>(`/absences/${absenceId}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteAbsence(absenceId: number): Promise<void> {
  await requestJson<{ ok: boolean }>(`/absences/${absenceId}/`, {
    method: "DELETE",
  });
}

export async function fetchMyReport(): Promise<ReportResponse> {
  return requestJson<ReportResponse>("/student/report/");
}

export async function fetchStudentReport(studentId: number): Promise<ReportResponse> {
  return requestJson<ReportResponse>(`/students/${studentId}/report/`);
}

export async function fetchPublicReport(matricule: string): Promise<ReportResponse> {
  const query = encodeURIComponent(matricule);
  return requestJson<ReportResponse>(`/public/report/?matricule=${query}`);
}
