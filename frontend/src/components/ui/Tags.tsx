import { ShieldAlert, Fingerprint, MessageSquareWarning } from 'lucide-react';
import type { ViolationType } from '../../data/mockData';
import { cn } from '../layout/Sidebar';

export function TemplateTag({ name, className }: { name: string; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-brand/10 text-primary-brand border border-primary-brand/30 shrink-0", 
      className
    )}>
      {name}
    </span>
  );
}

export function ViolationChip({ type, className }: { type: ViolationType; className?: string }) {
  let Icon = ShieldAlert;
  let color = "text-danger border-danger/30 bg-danger/10";
  
  if (type === 'PII') {
    Icon = Fingerprint;
    color = "text-warning border-warning/30 bg-warning/10";
  } else if (type === 'Toxicity') {
    Icon = MessageSquareWarning;
    color = "text-danger border-danger/30 bg-danger/10";
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-medium border uppercase tracking-wider",
      color,
      className
    )}>
      <Icon className="w-3 h-3" />
      {type}
    </div>
  );
}
