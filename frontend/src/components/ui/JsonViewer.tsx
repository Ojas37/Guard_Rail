import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface JsonViewerProps {
  data: any;
  defaultExpanded?: boolean;
}

export function JsonViewer({ data, defaultExpanded = false }: JsonViewerProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!data) return <div className="text-muted text-xs">null</div>;

  return (
    <div className="font-mono text-xs text-white bg-canvas border border-border rounded-md p-2 overflow-x-auto">
      <div 
        className="flex items-center cursor-pointer text-muted hover:text-white"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="w-3.5 h-3.5 mr-1" /> : <ChevronRight className="w-3.5 h-3.5 mr-1" />}
        <span>{Array.isArray(data) ? 'Array' : 'Object'}</span>
      </div>
      
      {isExpanded && (
        <pre className="pl-4 mt-2">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
