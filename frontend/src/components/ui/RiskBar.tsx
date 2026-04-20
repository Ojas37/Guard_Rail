import { motion } from 'framer-motion';
import { cn } from '../layout/Sidebar';

interface RiskBarProps {
  score: number; // 0.0 to 1.0
  className?: string;
}

export function RiskBar({ score, className }: RiskBarProps) {
  const percentage = Math.min(Math.max(score, 0), 1) * 100;
  
  let colorClass = "bg-success";
  if (score >= 0.5) colorClass = "bg-warning";
  if (score >= 0.75) colorClass = "bg-danger";

  return (
    <div className={cn("w-full h-1.5 bg-surface border border-border rounded-full overflow-hidden", className)}>
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("h-full rounded-full", colorClass)}
      />
    </div>
  );
}
