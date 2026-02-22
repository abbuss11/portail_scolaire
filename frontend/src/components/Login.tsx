import { useState } from "react";
import { GraduationCap, Search } from "lucide-react";

import StudentReport from "./StudentReport";
import { StudentReport as StudentReportType } from "../types";

interface LoginProps {
  onLogin: (identifier: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  onSearchMatricule: (matricule: string) => Promise<void>;
  searchLoading: boolean;
  searchError: string | null;
  searchReport: StudentReportType | null;
}

export default function Login({
  onLogin,
  loading,
  error,
  onSearchMatricule,
  searchLoading,
  searchError,
  searchReport,
}: LoginProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [matricule, setMatricule] = useState("");

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(identifier.trim(), password);
  };

  const handleLookupSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSearchMatricule(matricule.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 self-start">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-2xl mb-4">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Portail Scolaire</h1>
            <p className="text-slate-600 mt-2">Connexion</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-2">
                Nom utilisateur, email ou matricule
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="ex: admin, user@ecole.fr ou 9941mn"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="********"
                required
              />
            </div>

            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-60"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-5">
            <Search className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">Recherche par matricule</h2>
          </div>
          <p className="text-slate-600 mb-5">
            Vous etes etudiant connecter consulter vos notes.
          </p>

          <form onSubmit={handleLookupSubmit} className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={matricule}
              onChange={(event) => setMatricule(event.target.value)}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: MAT001"
              required
            />
            <button
              type="submit"
              disabled={searchLoading}
              className="px-5 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {searchLoading ? "Recherche..." : "Rechercher"}
            </button>
          </form>

          {searchError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {searchError}
            </div>
          )}

          {searchReport && <StudentReport report={searchReport} title="Resultat de recherche" showIdentity />}
        </div>
      </div>
    </div>
  );
}
