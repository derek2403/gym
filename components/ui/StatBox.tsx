import Card from "./Card";

interface StatBoxProps {
  value: string | number;
  label: string;
  unit?: string;
}

export default function StatBox({ value, label, unit }: StatBoxProps) {
  return (
    <Card variant="subtle" className="flex flex-col items-center justify-center py-5">
      <span className="font-mono text-[24px] font-bold tracking-tighter text-white/90">
        {value}
        {unit && <span className="text-[13px] font-normal tracking-normal text-white/30">{unit}</span>}
      </span>
      <span className="text-caption mt-1.5">{label}</span>
    </Card>
  );
}
