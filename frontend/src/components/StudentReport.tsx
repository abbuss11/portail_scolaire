import { Printer } from "lucide-react";

import { StudentReport as StudentReportType } from "../types";

interface StudentReportProps {
  report: StudentReportType;
  title?: string;
  showIdentity?: boolean;
}

function formatDate(dateValue: string | null): string {
  if (!dateValue) {
    return "-";
  }
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }
  return parsed.toLocaleDateString("fr-FR");
}

function formatAverage(value: number | null): string {
  if (value === null) {
    return "-";
  }
  return `${value.toFixed(2)}/20`;
}

export default function StudentReport({
  report,
  title = "Releve de notes",
  showIdentity = true,
}: StudentReportProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          {showIdentity && (
            <p className="text-slate-600 mt-1">
              {report.student.fullName} - Matricule {report.student.matricule} - Classe{" "}
              {report.student.classe}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Moyenne generale</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{formatAverage(report.average)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Nombre de notes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{report.totalGrades}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Absences justifiees</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{report.absences.justified}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-sm text-slate-500">Absences non justifiees</p>
          <p className="text-2xl font-bold text-red-700 mt-1">{report.absences.unjustified}</p>
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Moyenne par matiere</h3>
        {report.bySubject.length === 0 ? (
          <p className="text-slate-500">Aucune note disponible.</p>
        ) : (
          <div className="space-y-3">
            {report.bySubject.map((item) => (
              <div key={item.subject} className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <p className="font-medium text-slate-800">{item.subject}</p>
                  <p className="text-xs text-slate-500">
                    Coef {item.coefficient} - {item.gradesCount} note(s)
                  </p>
                </div>
                <p className="font-semibold text-slate-900">{item.average.toFixed(2)}/20</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-lg font-semibold text-slate-900">Details des notes</h3>
        </div>
        <div className="overflow-x-auto mt-3">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-600">Date</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-600">Matiere</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-600">Coef</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-600">Note</th>
              </tr>
            </thead>
            <tbody>
              {report.grades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                    Aucune note enregistree.
                  </td>
                </tr>
              ) : (
                report.grades.map((grade) => (
                  <tr key={grade.id} className="border-b border-slate-100">
                    <td className="px-5 py-3 text-sm text-slate-700">{formatDate(grade.date)}</td>
                    <td className="px-5 py-3 text-sm font-medium text-slate-900">{grade.subjectName}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{grade.coefficient}</td>
                    <td className="px-5 py-3 text-sm font-semibold text-slate-900">{grade.value}/20</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
