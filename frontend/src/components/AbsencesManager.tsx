import { useMemo, useState } from "react";
import { Calendar, CheckCircle, Edit2, Plus, Trash2, XCircle } from "lucide-react";

import { Absence, Student, UserRole } from "../types";

interface AbsenceFormData {
  studentId: string;
  date: string;
  justified: boolean;
}

interface AbsencesManagerProps {
  absences: Absence[];
  students: Student[];
  userRole: UserRole;
  loading: boolean;
  onAddAbsence: (payload: { studentId: number; date: string; justified: boolean }) => Promise<void>;
  onUpdateAbsence: (
    absenceId: number,
    payload: { studentId: number; date: string; justified: boolean }
  ) => Promise<void>;
  onDeleteAbsence: (absenceId: number) => Promise<void>;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-FR");
}

export default function AbsencesManager({
  absences,
  students,
  userRole,
  loading,
  onAddAbsence,
  onUpdateAbsence,
  onDeleteAbsence,
}: AbsencesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingAbsenceId, setEditingAbsenceId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<AbsenceFormData>({
    studentId: "",
    date: "",
    justified: false,
  });

  const canEdit = userRole === "admin" || userRole === "teacher";
  const sortedAbsences = useMemo(
    () => [...absences].sort((a, b) => Number(new Date(b.date).getTime()) - Number(new Date(a.date).getTime())),
    [absences]
  );

  const resetForm = () => {
    setFormData({ studentId: "", date: "", justified: false });
    setEditingAbsenceId(null);
    setFormError(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const studentId = Number(formData.studentId);
    if (!studentId || !formData.date) {
      setFormError("Veuillez renseigner l'eleve et la date.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingAbsenceId) {
        await onUpdateAbsence(editingAbsenceId, {
          studentId,
          date: formData.date,
          justified: formData.justified,
        });
      } else {
        await onAddAbsence({
          studentId,
          date: formData.date,
          justified: formData.justified,
        });
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (absence: Absence) => {
    setEditingAbsenceId(absence.id);
    setShowForm(true);
    setFormData({
      studentId: String(absence.studentId),
      date: absence.date,
      justified: absence.justified,
    });
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-orange-600" />
          <h2 className="text-2xl font-bold text-slate-900">Gestion des absences</h2>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              if (showForm) {
                resetForm();
              }
            }}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter une absence</span>
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingAbsenceId ? "Modifier l'absence" : "Nouvelle absence"}
          </h3>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Eleve</label>
              <select
                value={formData.studentId}
                onChange={(event) => setFormData((prev) => ({ ...prev, studentId: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Selectionner</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.matricule})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.justified}
                  onChange={(event) => setFormData((prev) => ({ ...prev, justified: event.target.checked }))}
                  className="w-4 h-4 text-orange-600 border-slate-300 rounded"
                />
                <span className="text-sm font-medium text-slate-700">Absence justifiee</span>
              </label>
            </div>

            {formError && <p className="md:col-span-3 text-sm text-red-700">{formError}</p>}

            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {submitting ? "Enregistrement..." : editingAbsenceId ? "Mettre a jour" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Eleve
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Statut
                </th>
                {canEdit && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : sortedAbsences.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                    Aucune absence enregistree.
                  </td>
                </tr>
              ) : (
                sortedAbsences.map((absence) => (
                  <tr key={absence.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700">{formatDate(absence.date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">{absence.studentName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{absence.matricule}</td>
                    <td className="px-6 py-4 text-sm">
                      {absence.justified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          <CheckCircle className="h-4 w-4" />
                          Justifiee
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-50 text-red-700">
                          <XCircle className="h-4 w-4" />
                          Non justifiee
                        </span>
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(absence)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("Supprimer cette absence ?")) {
                              return;
                            }
                            try {
                              await onDeleteAbsence(absence.id);
                            } catch (error) {
                              setFormError(
                                error instanceof Error
                                  ? error.message
                                  : "Erreur lors de la suppression."
                              );
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
