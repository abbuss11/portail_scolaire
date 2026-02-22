import { Calendar, FileSearch, LayoutDashboard, TrendingUp, Users } from "lucide-react";

import { UserRole } from "../types";

export type AppTab = "dashboard" | "grades" | "absences" | "students" | "report";

interface NavigationProps {
  role: UserRole;
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

interface TabItem {
  id: AppTab;
  label: string;
  icon: typeof LayoutDashboard;
}

export default function Navigation({ role, activeTab, onTabChange }: NavigationProps) {
  const tabs: TabItem[] =
    role === "student"
      ? [
          { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
          { id: "report", label: "Mon releve", icon: FileSearch },
        ]
      : [
          { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
          { id: "grades", label: "Notes", icon: TrendingUp },
          { id: "absences", label: "Absences", icon: Calendar },
          { id: "students", label: "Etudiants", icon: Users },
          { id: "report", label: "Recherche eleve", icon: FileSearch },
        ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
