import { MonthlyActivityPoint } from "../../types";

interface Point {
  x: number;
  y: number;
}

interface MonthlyTrendChartProps {
  data: MonthlyActivityPoint[];
}

function toSmoothPath(points: Point[]): string {
  if (points.length === 0) {
    return "";
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function toAreaPath(points: Point[], baselineY: number): string {
  if (points.length === 0) {
    return "";
  }
  return `${toSmoothPath(points)} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;
}

function monthLabel(label: string): string {
  if (!/^\d{4}-\d{2}$/.test(label)) {
    return label;
  }
  const [year, month] = label.split("-");
  return `${month}/${year.slice(2)}`;
}

export default function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length === 0) {
    return <p className="text-slate-500">Aucune activite a afficher.</p>;
  }

  const width = 860;
  const height = 360;
  const padding = { top: 24, right: 24, bottom: 56, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...data.flatMap((entry) => [entry.grades, entry.absences]),
    1
  );
  const yTicks = 5;

  const xForIndex = (index: number) => {
    if (data.length === 1) {
      return padding.left + chartWidth / 2;
    }
    return padding.left + (index / (data.length - 1)) * chartWidth;
  };

  const yForValue = (value: number) => padding.top + chartHeight - (value / maxValue) * chartHeight;
  const baselineY = padding.top + chartHeight;

  const gradePoints: Point[] = data.map((entry, index) => ({
    x: xForIndex(index),
    y: yForValue(entry.grades),
  }));
  const absencePoints: Point[] = data.map((entry, index) => ({
    x: xForIndex(index),
    y: yForValue(entry.absences),
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-5 text-sm mb-2 px-2">
        <span className="inline-flex items-center gap-2 text-slate-700">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          Notes
        </span>
        <span className="inline-flex items-center gap-2 text-slate-700">
          <span className="w-3 h-3 rounded-full bg-orange-500" />
          Absences
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px]">
        <defs>
          <linearGradient id="gradesAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="absencesAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fb923c" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fb923c" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[...Array(yTicks + 1)].map((_, index) => {
          const y = padding.top + (chartHeight / yTicks) * index;
          const value = ((yTicks - index) / yTicks) * maxValue;
          return (
            <g key={index}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-500"
              >
                {value.toFixed(0)}
              </text>
            </g>
          );
        })}

        <path d={toAreaPath(gradePoints, baselineY)} fill="url(#gradesAreaGradient)" />
        <path d={toAreaPath(absencePoints, baselineY)} fill="url(#absencesAreaGradient)" />

        <path d={toSmoothPath(gradePoints)} fill="none" stroke="#10b981" strokeWidth={3} />
        <path d={toSmoothPath(absencePoints)} fill="none" stroke="#f97316" strokeWidth={3} />

        {gradePoints.map((point, index) => (
          <g key={`grade-${index}`}>
            <circle cx={point.x} cy={point.y} r={4.5} fill="#10b981">
              <title>
                {data[index].label} - Notes: {data[index].grades}
              </title>
            </circle>
          </g>
        ))}
        {absencePoints.map((point, index) => (
          <g key={`absence-${index}`}>
            <circle cx={point.x} cy={point.y} r={4.5} fill="#f97316">
              <title>
                {data[index].label} - Absences: {data[index].absences}
              </title>
            </circle>
          </g>
        ))}

        {data.map((entry, index) => {
          const x = xForIndex(index);
          return (
            <text
              key={entry.label}
              x={x}
              y={baselineY + 20}
              textAnchor="middle"
              className="text-[11px] fill-slate-600"
            >
              {monthLabel(entry.label)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
