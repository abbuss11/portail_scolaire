import { ReactNode } from "react";
import { GraduationCap, LogOut, User } from "lucide-react";

import { AuthUser } from "../types";

interface LayoutProps {
  children: ReactNode;
  user: AuthUser;
  onLogout: () => void;
}

function roleLabel(role: AuthUser["role"]): string {
  if (role === "admin") {
    return "Administrateur";
  }
  if (role === "teacher") {
    return "Professeur";
  }
  return "Eleve";
}

export default function Layout({ children, user, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Gestion Scolaire</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 px-4 py-2 bg-slate-50 rounded-lg">
                <User className="h-5 w-5 text-slate-600" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">{user.fullName}</p>
                  <p className="text-xs text-slate-500">{roleLabel(user.role)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                title="Se deconnecter"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}
