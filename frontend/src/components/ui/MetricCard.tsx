import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../layout/Sidebar';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("bg-surface border border-border rounded-lg shadow-sm w-full", className)}>
      {children}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  delta: number; // positive or negative percentage
  icon: LucideIcon;
  className?: string;
}

export function MetricCard({ title, value, delta, icon: Icon, className }: MetricCardProps) {
  const isPositive = delta > 0;
  const isNeutral = delta === 0;

  let deltaColorClass = "text-muted";
  if (!isNeutral) {
     // Generally higher is worse for block rate/latency, but context dependent.
     // Will just color red/green for generic use right now. Let's make positive green.
     deltaColorClass = isPositive ? "text-success" : "text-danger";
  }

  return (
    <Card className={cn("p-4 flex flex-col justify-between", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{title}</span>
        <Icon className="w-4 h-4 text-primary-brand opacity-80" />
      </div>
      
      <div className="mt-4 flex items-end justify-between">
        <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
        
        <div className={cn("flex items-center text-xs font-medium", deltaColorClass)}>
          {!isNeutral && isPositive && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
          {!isNeutral && !isPositive && <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
          {Math.abs(delta)}%
          <span className="text-[10px] text-muted ml-1 opacity-70">vs 24h</span>
        </div>
      </div>
    </Card>
  );
}
