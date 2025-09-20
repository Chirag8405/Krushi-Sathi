import { Sprout, Sun } from "lucide-react";

export default function LoadingSeed({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6">
      <div className="relative">
        <div className="absolute -top-6 -left-6 text-brand-sun/70 animate-sun-pulse">
          <Sun className="h-10 w-10" />
        </div>
        <div className="rounded-full bg-brand-sky/80 p-6 shadow-inner">
          <Sprout className="h-12 w-12 text-brand-leaf animate-seed-sprout" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {label}
      </p>
    </div>
  );
}
