import { useState } from 'react';
import { Copy, Check, Info } from 'lucide-react';
import { cn } from '../layout/Sidebar';

export function CopyableKey({ apiKey, className }: { apiKey: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <code className="text-muted bg-surface border border-border px-1.5 py-0.5 rounded text-xs select-all">
        {apiKey}
      </code>
      <button 
        onClick={handleCopy}
        className="text-muted hover:text-white transition-colors"
        title="Copy to clipboard"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function EmptyState({ message, icon: Icon = Info, action }: { message: string, icon?: any, action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border rounded-lg bg-surface/50 w-full">
      <Icon className="w-8 h-8 text-muted mb-3 opacity-50" />
      <p className="text-muted text-sm max-w-sm mb-4">{message}</p>
      {action}
    </div>
  );
}
