import Card from "./Card";

interface StatBoxProps {
  value: string | number;
  label: string;
  unit?: string;
}

export default function StatBox({ value, label, unit }: StatBoxProps) {
  return (
    <Card variant="subtle" className="flex flex-col items-center justify-center gap-1 py-5">
      <span className="text-metric text-[1.5rem] leading-none">
        {value}
        {unit && (
          <span className="ml-1 text-[0.75rem] font-normal tracking-normal text-[color:var(--ink-quaternary)]">
            {unit}
          </span>
        )}
      </span>
      <span className="text-caption">{label}</span>
    </Card>
  );
}
