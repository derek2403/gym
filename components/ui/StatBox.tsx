import Card from "./Card";

interface StatBoxProps {
  value: string | number;
  label: string;
  unit?: string;
}

export default function StatBox({ value, label, unit }: StatBoxProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-4">
      <span className="font-mono text-2xl font-bold text-zinc-50">
        {value}
        {unit && <span className="text-sm font-normal text-zinc-500">{unit}</span>}
      </span>
      <span className="mt-1 text-xs text-zinc-500">{label}</span>
    </Card>
  );
}
