import { Activity } from "lucide-react";

type BiteChartProps = {
  weather: any;
  timeX: number;
  currentTimeString: string;
};

export default function BiteChart({
  weather,
  timeX,
  currentTimeString,
}: BiteChartProps) {
  const generateLivePath = () =>
    weather.hourlyBiteIndex
      .map(
        (v: number, h: number) =>
          `${h === 0 ? "M" : "L"} ${(h / 23) * 100} ${22 - ((v - 10) / 90) * 16}`,
      )
      .join(" ");
  const getCurrentY = () =>
    22 -
    (((weather.hourlyBiteIndex[new Date().getHours()] || 50) - 10) / 90) * 16;

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div className="chart-title">
          <Activity size={16} color="var(--accent-cyan)" />
          <span>Beißverlauf (Live-Wetter)</span>
        </div>
        <span className="chart-subtitle">Aktuell: {currentTimeString}</span>
      </div>
      <div className="chart-visual-container">
        <div className="chart-grid-line" style={{ top: "0%" }}></div>
        <div className="chart-grid-line" style={{ top: "50%" }}></div>
        <div className="chart-grid-line" style={{ top: "100%" }}></div>
        <svg
          viewBox="0 0 100 25"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", overflow: "visible" }}
        >
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--accent-cyan)"
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor="var(--accent-cyan)"
                stopOpacity="0.0"
              />
            </linearGradient>
          </defs>
          <path
            d={`${generateLivePath()} L 100 25 L 0 25 Z`}
            fill="url(#waveGradient)"
          />
          <path
            d={generateLivePath()}
            fill="none"
            stroke="var(--accent-cyan)"
            strokeWidth="1"
            strokeLinecap="round"
          />
          <line
            x1={timeX}
            y1="0"
            x2={timeX}
            y2="25"
            stroke="var(--accent-orange)"
            strokeWidth="0.6"
            strokeDasharray="1,1"
          />
          <circle
            cx={timeX}
            cy={getCurrentY()}
            r="1.8"
            fill="var(--accent-orange)"
          />
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "10px",
          width: "100%",
        }}
      >
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          00:00
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          06:00
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          12:00
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          18:00
        </span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
          24:00
        </span>
      </div>
    </div>
  );
}
