import { ChartPoint } from "../../types";

interface SubjectBarChartProps {
  data: ChartPoint[];
}

function truncateLabel(label: string, maxLength = 14): string {
  if (label.length <= maxLength) {
    return label;
  }
  return `${label.slice(0, maxLength - 1)}...`;
}

export default function SubjectBarChart({ data }: SubjectBarChartProps) {
  if (data.length === 0) {
    return <p className="text-slate-500">Aucune note disponible.</p>;
  }

  const width = 820;
  const height = 340;
  const padding = { top: 20, right: 20, bottom: 80, left: 44 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const step = chartWidth / data.length;
  const barWidth = Math.max(step * 0.62, 18);
  const maxValue = Math.max(...data.map((item) => item.value), 20);
  const gridLines = 5;

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[640px]">
        <defs>
          <linearGradient id="subjectBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>

        {[...Array(gridLines + 1)].map((_, index) => {
          const y = padding.top + (chartHeight / gridLines) * index;
          const tickValue = ((gridLines - index) / gridLines) * maxValue;
          return (
            <g key={index}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[11px] fill-slate-500"
              >
                {tickValue.toFixed(0)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const ratio = item.value / maxValue;
          const barHeight = Math.max(ratio * chartHeight, 2);
          const x = padding.left + index * step + (step - barWidth) / 2;
          const y = padding.top + chartHeight - barHeight;

          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={6}
                fill="url(#subjectBarGradient)"
              >
                <title>
                  {item.label}: {item.value.toFixed(2)}/20
                </title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={padding.top + chartHeight + 18}
                textAnchor="middle"
                className="text-[11px] fill-slate-600"
              >
                {truncateLabel(item.label)}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                className="text-[11px] fill-slate-700 font-semibold"
              >
                {item.value.toFixed(1)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

