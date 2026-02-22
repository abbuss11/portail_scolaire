import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";

import { Student, StudentCreateResult, UserRole } from "../types";

interface StudentCreatePayload {
  matricule: string;
  nom: string;
  prenom: string;
  classe: string;
  telephone?: string;
  dateNaissance?: string;
  username?: string;
  password?: string;
  email?: string;
}

interface StudentsManagerProps {
  students: Student[];
  userRole: UserRole;
  loading: boolean;
  onAddStudent: (payload: StudentCreatePayload) => Promise<StudentCreateResult>;
}

const CLASS_LEVEL_OPTIONS = ["L1", "L2", "L3", "M1", "M2"] as const;

export default function StudentsManager({
  students,
  userRole,
  loading,
  onAddStudent,
}: StudentsManagerProps) {
  const canManage = userRole === "admin" || userRole === "teacher";
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<StudentCreateResult["credentials"] | null>(
    null
  );
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    matricule: "",
    classe: "L1",
    telephone: "",
    dateNaissance: "",
    username: "",
    password: "",
    email: "",
  });

  const sortedStudents = useMemo(
    () =>
      [...students].sort((a, b) => {
        const byName = a.fullName.localeCompare(b.fullName, "fr");
        if (byName !== 0) {
          return byName;
        }
        return a.matricule.localeCompare(b.matricule, "fr");
      }),
    [students]
  );

  const resetForm = () => {
    setFormData({
      nom: "",
      prenom: "",
      matricule: "",
      classe: "L1",
      telephone: "",
      dateNaissance: "",
      username: "",
      password: "",
      email: "",
    });
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setCreatedCredentials(null);

    if (!formData.matricule || !formData.nom || !formData.prenom || !formData.classe) {
      setFormError("Matricule, nom, prenom et niveau/classe sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await onAddStudent({
        matricule: formData.matricule.trim(),
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        classe: formData.classe.trim(),
        telephone: formData.telephone.trim() || undefined,
        dateNaissance: formData.dateNaissance || undefined,
        username: formData.username.trim() || undefined,
        password: formData.password || undefined,
        email: formData.email.trim() || undefined,
      });
      setCreatedCredentials(result.credentials);
      resetForm();
      setShowForm(false);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Erreur lors de la creation de l'eleve.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-2xl font-bold text-slate-900">Gestion des etudiants</h2>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormError(null);
            }}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>Ajouter un etudiant</span>
          </button>
        )}
      </div>

      {createdCredentials && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4">
          <p className="font-semibold">Compte eleve cree avec succes.</p>
          <p className="text-sm mt-1">Nom utilisateur: {createdCredentials.username}</p>
          <p className="text-sm">
            Mot de passe initial: {createdCredentials.password}
            {createdCredentials.defaultPasswordUsed ? " (defaut: matricule)" : ""}
          </p>
        </div>
      )}

      {showForm && canManage && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Nouvel etudiant</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom *</label>
              <input
                type="text"
                value={formData.nom}
                onChange={(event) => setFormData((prev) => ({ ...prev, nom: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Prenom *</label>
              <input
                type="text"
                value={formData.prenom}
                onChange={(event) => setFormData((prev) => ({ ...prev, prenom: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Matricule *</label>
              <input
                type="text"
                value={formData.matricule}
                onChange={(event) => setFormData((prev) => ({ ...prev, matricule: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Niveau/Classe *</label>
              <select
                value={formData.classe}
                onChange={(event) => setFormData((prev) => ({ ...prev, classe: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                required
              >
                {CLASS_LEVEL_OPTIONS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Telephone</label>
              <input
                type="text"
                value={formData.telephone}
                onChange={(event) => setFormData((prev) => ({ ...prev, telephone: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Date de naissance</label>
              <input
                type="date"
                value={formData.dateNaissance}
                onChange={(event) => setFormData((prev) => ({ ...prev, dateNaissance: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nom utilisateur (optionnel)</label>
              <input
                type="text"
                value={formData.username}
                onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="Defaut: matricule"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe (optionnel)</label>
              <input
                type="text"
                value={formData.password}
                onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                placeholder="Defaut: matricule"
              />
            </div>

            {formError && <p className="md:col-span-3 text-sm text-red-700">{formError}</p>}

            <div className="md:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submitting ? "Creation..." : "Creer l'etudiant"}
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
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Etudiant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Niveau/Classe
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Compte
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Telephone
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Chargement...
                  </td>
                </tr>
              ) : sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Aucun etudiant enregistre.
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.fullName}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.matricule}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.classe}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.accountUsername || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{student.telephone || "-"}</td>
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
