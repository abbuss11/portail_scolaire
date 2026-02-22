export type UserRole = "admin" | "teacher" | "student";

export interface StudentUserInfo {
  id: number;
  matricule: string;
  classe: string;
  fullName: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  student?: StudentUserInfo;
}

export interface Student {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  fullName: string;
  classe: string;
  dateNaissance: string | null;
  telephone: string;
  accountUsername: string | null;
}

export interface StudentCredentials {
  username: string;
  password: string;
  defaultPasswordUsed: boolean;
}

export interface StudentCreateResult {
  student: Student;
  credentials: StudentCredentials;
}

export interface Subject {
  id: number;
  name: string;
  coefficient: number;
}

export interface Grade {
  id: number;
  studentId: number;
  studentName: string;
  matricule: string;
  subjectId: number;
  subjectName: string;
  coefficient: number;
  value: number;
  date: string | null;
}

export interface Absence {
  id: number;
  studentId: number;
  studentName: string;
  matricule: string;
  date: string;
  present: boolean;
  justified: boolean;
}

export interface DashboardStats {
  totalStudents: number;
  totalSubjects: number;
  totalGrades: number;
  totalAbsences: number;
  averageGrade: number;
  justifiedAbsences: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface MonthlyActivityPoint {
  label: string;
  grades: number;
  absences: number;
}

export interface DashboardData {
  stats: DashboardStats;
  subjectAverages: ChartPoint[];
  monthlyActivity: MonthlyActivityPoint[];
  gradeDistribution: ChartPoint[];
}

export interface StudentSubjectSummary {
  subject: string;
  average: number;
  gradesCount: number;
  coefficient: number;
}

export interface StudentAbsenceSummary {
  total: number;
  justified: number;
  unjustified: number;
}

export interface StudentReport {
  student: Student;
  average: number | null;
  totalGrades: number;
  grades: Grade[];
  bySubject: StudentSubjectSummary[];
  absences: StudentAbsenceSummary;
}
