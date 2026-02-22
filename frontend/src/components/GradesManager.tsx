import { useMemo, useState } from "react";
import { Edit2, Plus, Trash2, TrendingUp } from "lucide-react";

import { Grade, Student, Subject, UserRole } from "../types";

interface GradeFormData {
  studentId: string;
  subjectId: string;
  value: string;
}

interface GradesManagerProps {
  grades: Grade[];
  subjects: Subject[];
  students: Student[];
  userRole: UserRole;
  loading: boolean;
  onAddGrade: (payload: { studentId: number; subjectId: number; value: number }) => Promise<void>;
  onUpdateGrade: (
    gradeId: number,
    payload: { studentId: number; subjectId: number; value: number }
  ) => Promise<void>;
  onDeleteGrade: (gradeId: number) => Promise<void>;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-FR");
}

export default function GradesManager({
  grades,
  subjects,
  students,
  userRole,
  loading,
  onAddGrade,
  onUpdateGrade,
  onDeleteGrade,
}: GradesManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingGradeId, setEditingGradeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<GradeFormData>({
    studentId: "",
    subjectId: "",
    value: "",
  });

  const canEdit = userRole === "admin" || userRole === "teacher";
  const sortedGrades = useMemo(
    () => [...grades].sort((a, b) => Number(new Date(b.date || "").getTime()) - Number(new Date(a.date || "").getTime())),
    [grades]
  );

  const resetForm = () => {
    setFormData({ studentId: "", subjectId: "", value: "" });
    setEditingGradeId(null);
    setFormError(null);
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const studentId = Number(formData.studentId);
    const subjectId = Number(formData.subjectId);
    const value = Number(formData.value);

    if (!studentId || !subjectId || Number.isNaN(value)) {
      setFormError("Veuillez remplir tous les champs.");
      return;
    }

    if (value < 0 || value > 20) {
      setFormError("La note doit etre entre 0 et 20.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingGradeId) {
        await onUpdateGrade(editingGradeId, { studentId, subjectId, value });
      } else {
        await onAddGrade({ studentId, subjectId, value });
      }
      resetForm();
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (grade: Grade) => {
    setEditingGradeId(grade.id);
    setShowForm(true);
    setFormData({
      studentId: String(grade.studentId),
      subjectId: String(grade.subjectId),
      value: String(grade.value),
    });
    setFormError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Gestion des notes</h2>
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
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter une note</span>
          </button>
        )}
      </div>

      {showForm && canEdit && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingGradeId ? "Modifier la note" : "Nouvelle note"}
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
              <label className="block text-sm font-medium text-slate-700 mb-2">Matiere</label>
              <select
                value={formData.subjectId}
                onChange={(event) => setFormData((prev) => ({ ...prev, subjectId: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              >
                <option value="">Selectionner</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} (coef {subject.coefficient})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Note /20</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.25}
                value={formData.value}
                onChange={(event) => setFormData((prev) => ({ ...prev, value: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>

            {formError && <p className="md:col-span-3 text-sm text-red-700">{formError}</p>}

            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Enregistrement..." : editingGradeId ? "Mettre a jour" : "Ajouter"}
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
                  Matiere
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Coef
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Note
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
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : sortedGrades.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-slate-500">
                    Aucune note enregistree.
                  </td>
                </tr>
              ) : (
                sortedGrades.map((grade) => (
                  <tr key={grade.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-700">{formatDate(grade.date)}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {grade.studentName}
                      <div className="text-xs text-slate-500">{grade.matricule}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{grade.subjectName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{grade.coefficient}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{grade.value}/20</td>
                    {canEdit && (
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => startEdit(grade)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!window.confirm("Supprimer cette note ?")) {
                              return;
                            }
                            try {
                              await onDeleteGrade(grade.id);
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
