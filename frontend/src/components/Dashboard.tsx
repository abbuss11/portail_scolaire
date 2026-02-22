import { Calendar, GraduationCap, TrendingUp, Users } from "lucide-react";

import { AuthUser, DashboardData } from "../types";
import GradeDistributionDonut from "./charts/GradeDistributionDonut";
import MonthlyTrendChart from "./charts/MonthlyTrendChart";
import SubjectBarChart from "./charts/SubjectBarChart";

interface DashboardProps {
  user: AuthUser;
  data: DashboardData | null;
  loading: boolean;
}

function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function roleWelcome(role: AuthUser["role"]): string {
  if (role === "admin") {
    return "Espace administrateur";
  }
  if (role === "teacher") {
    return "Espace professeur";
  }
  return "Espace eleve";
}

export default function Dashboard({ user, data, loading }: DashboardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-600">
        Chargement du tableau de bord...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-700">
        Impossible de charger les statistiques.
      </div>
    );
  }

  const cards = [
    {
      title: "Eleves",
      value: data.stats.totalStudents,
      icon: Users,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      title: "Matieres",
      value: data.stats.totalSubjects,
      icon: GraduationCap,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      title: "Notes",
      value: data.stats.totalGrades,
      icon: TrendingUp,
      color: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      title: "Absences",
      value: data.stats.totalAbsences,
      icon: Calendar,
      color: "text-orange-700",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Bonjour, {user.fullName}</h2>
        <p className="text-slate-600 mt-1">
          {roleWelcome(user.role)} - moyenne generale: {formatValue(data.stats.averageGrade)}/20
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Moyenne par matiere (graphique dynamique)
          </h3>
          <SubjectBarChart data={data.subjectAverages} />
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Courbes d activite mensuelle (notes vs absences)
          </h3>
          <MonthlyTrendChart data={data.monthlyActivity} />
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          Repartition des notes (donut dynamique)
        </h3>
        <GradeDistributionDonut data={data.gradeDistribution} />
      </section>
    </div>
  );
}
