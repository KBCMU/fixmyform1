"use client";

interface ScheduleStepProps {
  daysPerWeek?: number;
  minutesPerSession?: number;
  onChange: (field: "daysPerWeek" | "minutesPerSession", value: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const DAY_OPTIONS = [2, 3, 4, 5, 6];
const TIME_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "60 min" },
  { value: 75, label: "75 min" },
  { value: 90, label: "90 min+" },
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: selected ? "rgba(230,106,35,0.12)" : "#0A0A0A",
        border: `1px solid ${selected ? "#E66A23" : "rgba(255,255,255,0.08)"}`,
        borderRadius: "4px",
        padding: "10px 20px",
        color: selected ? "#E66A23" : "rgba(255,255,255,0.7)",
        fontWeight: selected ? 600 : 400,
        fontSize: "14px",
        cursor: "pointer",
        transition: "all 0.15s ease",
        minWidth: "56px",
      }}
      onMouseEnter={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
          e.currentTarget.style.color = "rgba(255,255,255,0.9)";
        }
      }}
      onMouseLeave={(e) => {
        if (!selected) {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.color = "rgba(255,255,255,0.7)";
        }
      }}
    >
      {label}
    </button>
  );
}

export default function ScheduleStep({
  daysPerWeek,
  minutesPerSession,
  onChange,
  onNext,
  onBack,
}: ScheduleStepProps) {
  const isValid = daysPerWeek !== undefined && minutesPerSession !== undefined;

  return (
    <div>
      <div className="mb-10 text-center">
        <h2
          style={{
            fontFamily: "var(--font-serif), 'Cormorant Garamond', serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            color: "rgba(255,255,255,0.9)",
            letterSpacing: "0.02em",
            marginBottom: "8px",
          }}
        >
          Your Schedule
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          How often can you train, and for how long?
        </p>
      </div>

      <div style={{ maxWidth: "560px", margin: "0 auto 40px" }}>
        {/* Days per week */}
        <div style={{ marginBottom: "36px" }}>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#AAAAAA",
              marginBottom: "14px",
            }}
          >
            Days per week
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {DAY_OPTIONS.map((d) => (
              <Chip
                key={d}
                label={String(d)}
                selected={daysPerWeek === d}
                onClick={() => onChange("daysPerWeek", d)}
              />
            ))}
          </div>
        </div>

        {/* Time per session */}
        <div>
          <div
            style={{
              fontSize: "11px",
              fontFamily: "'Geist Mono', monospace",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#AAAAAA",
              marginBottom: "14px",
            }}
          >
            Time per session
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {TIME_OPTIONS.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={minutesPerSession === t.value}
                onClick={() => onChange("minutesPerSession", t.value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "4px",
            padding: "14px 28px",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)";
            e.currentTarget.style.color = "rgba(255,255,255,0.9)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            background: isValid ? "#E66A23" : "rgba(255,255,255,0.05)",
            color: isValid ? "#ffffff" : "rgba(255,255,255,0.3)",
            border: "none",
            borderRadius: "4px",
            padding: "14px 40px",
            fontSize: "14px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            cursor: isValid ? "pointer" : "not-allowed",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            if (isValid) e.currentTarget.style.background = "#D1834B";
          }}
          onMouseLeave={(e) => {
            if (isValid) e.currentTarget.style.background = "#E66A23";
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
