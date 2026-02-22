import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";

import {
  bootstrapSession,
  createAbsence,
  createGrade,
  createStudent,
  deleteAbsence,
  deleteGrade,
  fetchAbsences,
  fetchDashboard,
  fetchGrades,
  fetchMyReport,
  fetchPublicReport,
  fetchStudents,
  fetchSubjects,
  loginUser,
  logoutUser,
  updateAbsence,
  updateGrade,
} from "./api";
import AbsencesManager from "./components/AbsencesManager";
import Dashboard from "./components/Dashboard";
import GradesManager from "./components/GradesManager";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Navigation, { AppTab } from "./components/Navigation";
import StudentReport from "./components/StudentReport";
import StudentsManager from "./components/StudentsManager";
import {
  Absence,
  AuthUser,
  DashboardData,
  Grade,
  Student,
  StudentReport as StudentReportType,
  Subject,
} from "./types";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur inattendue est survenue.";
}

function ReportLookup({
  onSearch,
  loading,
  error,
  report,
}: {
  onSearch: (matricule: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  report: StudentReportType | null;
}) {
  const [matricule, setMatricule] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSearch(matricule.trim());
  };

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold text-slate-900">Recherche d un eleve par matricule</h2>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={matricule}
            onChange={(event) => setMatricule(event.target.value)}
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg"
            placeholder="Ex: MAT001"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Recherche..." : "Rechercher"}
          </button>
        </form>
        {error && <p className="text-sm text-red-700 mt-3">{error}</p>}
      </div>

      {report && <StudentReport report={report} title="Releve de notes eleve" showIdentity />}
    </div>
  );
}

function App() {
  const [ready, setReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appError, setAppError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [myReport, setMyReport] = useState<StudentReportType | null>(null);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupReport, setLookupReport] = useState<StudentReportType | null>(null);

  const loadAuthenticatedData = useCallback(
    async (user: AuthUser) => {
      setLoadingData(true);
      setAppError(null);
      try {
        const [dashboardResponse, gradesResponse, absencesResponse] = await Promise.all([
          fetchDashboard(),
          fetchGrades(),
          fetchAbsences(),
        ]);
        setDashboard(dashboardResponse);
        setGrades(gradesResponse.grades);
        setAbsences(absencesResponse.absences);

        if (user.role === "student") {
          const reportResponse = await fetchMyReport();
          setMyReport(reportResponse.report);
          setStudents(reportResponse.report.student ? [reportResponse.report.student] : []);
          setSubjects([]);
        } else {
          const [studentsResponse, subjectsResponse] = await Promise.all([
            fetchStudents(),
            fetchSubjects(),
          ]);
          setStudents(studentsResponse.students);
          setSubjects(subjectsResponse.subjects);
          setMyReport(null);
        }
      } catch (error) {
        setAppError(getErrorMessage(error));
      } finally {
        setLoadingData(false);
      }
    },
    [setDashboard, setGrades, setAbsences, setStudents, setSubjects, setMyReport]
  );

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const response = await bootstrapSession();
        if (!mounted) {
          return;
        }
        if (response.authenticated && response.user) {
          setCurrentUser(response.user);
        }
      } catch (error) {
        if (mounted) {
          setAuthError(getErrorMessage(error));
        }
      } finally {
        if (mounted) {
          setReady(true);
        }
      }
    };

    void initialize();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    void loadAuthenticatedData(currentUser);
  }, [currentUser, loadAuthenticatedData]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }
    if (
      currentUser.role === "student" &&
      (activeTab === "grades" || activeTab === "absences" || activeTab === "students")
    ) {
      setActiveTab("dashboard");
    }
  }, [currentUser, activeTab]);

  const handleLogin = async (identifier: string, password: string) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const response = await loginUser(identifier, password);
      setCurrentUser(response.user);
      setActiveTab("dashboard");
      setLookupReport(null);
      setLookupError(null);
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      setAuthError(getErrorMessage(error));
    } finally {
      setCurrentUser(null);
      setDashboard(null);
      setStudents([]);
      setSubjects([]);
      setGrades([]);
      setAbsences([]);
      setMyReport(null);
      setLookupReport(null);
      setLookupError(null);
      setActiveTab("dashboard");
    }
  };

  const handleSearchMatricule = async (matricule: string) => {
    if (!matricule) {
      setLookupError("Veuillez saisir un matricule.");
      setLookupReport(null);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const response = await fetchPublicReport(matricule);
      setLookupReport(response.report);
    } catch (error) {
      setLookupError(getErrorMessage(error));
      setLookupReport(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const refreshAfterMutation = async () => {
    if (!currentUser) {
      return;
    }
    await loadAuthenticatedData(currentUser);
  };

  const handleAddGrade = async (payload: { studentId: number; subjectId: number; value: number }) => {
    await createGrade(payload);
    await refreshAfterMutation();
  };

  const handleUpdateGrade = async (
    gradeId: number,
    payload: { studentId: number; subjectId: number; value: number }
  ) => {
    await updateGrade(gradeId, payload);
    await refreshAfterMutation();
  };

  const handleDeleteGrade = async (gradeId: number) => {
    await deleteGrade(gradeId);
    await refreshAfterMutation();
  };

  const handleAddAbsence = async (payload: {
    studentId: number;
    date: string;
    justified: boolean;
  }) => {
    await createAbsence(payload);
    await refreshAfterMutation();
  };

  const handleUpdateAbsence = async (
    absenceId: number,
    payload: { studentId: number; date: string; justified: boolean }
  ) => {
    await updateAbsence(absenceId, payload);
    await refreshAfterMutation();
  };

  const handleDeleteAbsence = async (absenceId: number) => {
    await deleteAbsence(absenceId);
    await refreshAfterMutation();
  };

  const handleAddStudent = async (payload: {
    matricule: string;
    nom: string;
    prenom: string;
    classe: string;
    telephone?: string;
    dateNaissance?: string;
    username?: string;
    password?: string;
    email?: string;
  }) => {
    const result = await createStudent(payload);
    await refreshAfterMutation();
    return result;
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-700">
        Initialisation...
      </div>
    );
  }

  if (!currentUser) {
    return (
      <Login
        onLogin={handleLogin}
        loading={authLoading}
        error={authError}
        onSearchMatricule={handleSearchMatricule}
        searchLoading={lookupLoading}
        searchError={lookupError}
        searchReport={lookupReport}
      />
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      <Navigation role={currentUser.role} activeTab={activeTab} onTabChange={setActiveTab} />

      {appError && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {appError}
        </div>
      )}

      {activeTab === "dashboard" && (
        <Dashboard user={currentUser} data={dashboard} loading={loadingData} />
      )}

      {activeTab === "grades" && currentUser.role !== "student" && (
        <GradesManager
          grades={grades}
          subjects={subjects}
          students={students}
          userRole={currentUser.role}
          loading={loadingData}
          onAddGrade={handleAddGrade}
          onUpdateGrade={handleUpdateGrade}
          onDeleteGrade={handleDeleteGrade}
        />
      )}

      {activeTab === "absences" && currentUser.role !== "student" && (
        <AbsencesManager
          absences={absences}
          students={students}
          userRole={currentUser.role}
          loading={loadingData}
          onAddAbsence={handleAddAbsence}
          onUpdateAbsence={handleUpdateAbsence}
          onDeleteAbsence={handleDeleteAbsence}
        />
      )}

      {activeTab === "students" && currentUser.role !== "student" && (
        <StudentsManager
          students={students}
          userRole={currentUser.role}
          loading={loadingData}
          onAddStudent={handleAddStudent}
        />
      )}

      {activeTab === "report" && currentUser.role === "student" && myReport && (
        <StudentReport report={myReport} title="Mon releve de notes" showIdentity={false} />
      )}

      {activeTab === "report" && currentUser.role === "student" && !myReport && !loadingData && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 text-slate-600">
          Aucun releve disponible pour le moment.
        </div>
      )}

      {activeTab === "report" && currentUser.role !== "student" && (
        <ReportLookup
          onSearch={handleSearchMatricule}
          loading={lookupLoading}
          error={lookupError}
          report={lookupReport}
        />
      )}
    </Layout>
  );
}

export default App;
