import { ChartPoint } from "../../types";

interface GradeDistributionDonutProps {
  data: ChartPoint[];
}

const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#f97316", "#8b5cf6", "#ec4899"];

export default function GradeDistributionDonut({ data }: GradeDistributionDonutProps) {
  if (data.length === 0) {
    return <p className="text-slate-500">Aucune note pour calculer la repartition.</p>;
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return <p className="text-slate-500">Aucune note pour calculer la repartition.</p>;
  }

  const size = 260;
  const radius = 90;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let accumulated = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6 items-center">
      <div className="flex justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-[250px] h-[250px]">
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />

          {data.map((item, index) => {
            const segment = (item.value / total) * circumference;
            const dashArray = `${segment} ${circumference - segment}`;
            const dashOffset = -accumulated;
            const color = COLORS[index % COLORS.length];
            accumulated += segment;

            return (
              <circle
                key={item.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${center} ${center})`}
              >
                <title>
                  {item.label}: {item.value} ({((item.value / total) * 100).toFixed(1)}%)
                </title>
              </circle>
            );
          })}

          <text x={center} y={center - 4} textAnchor="middle" className="text-[28px] fill-slate-900 font-bold">
            {total}
          </text>
          <text x={center} y={center + 18} textAnchor="middle" className="text-[12px] fill-slate-500">
            Notes totales
          </text>
        </svg>
      </div>

      <div className="space-y-2">
        {data.map((item, index) => {
          const color = COLORS[index % COLORS.length];
          const percent = (item.value / total) * 100;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm text-slate-700">{item.label}</span>
              </div>
              <div className="text-sm text-slate-900 font-semibold">
                {item.value} ({percent.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
