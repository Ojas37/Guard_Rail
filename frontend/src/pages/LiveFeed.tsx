import { useState, useEffect, useMemo } from 'react';
import { 
  useReactTable, getCoreRowModel, flexRender
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Play, Pause, X, Maximize2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '../store/useAppStore';
import { generateSingleLog } from '../data/mockData';
import type { GuardrailLog } from '../data/mockData';
import { ActionBadge } from '../components/ui/ActionBadge';
import { TemplateTag, ViolationChip } from '../components/ui/Tags';
import { RiskBar } from '../components/ui/RiskBar';
import { JsonViewer } from '../components/ui/JsonViewer';
import { cn } from '../components/layout/Sidebar';

export function LiveFeed() {
  const logs = useAppStore(state => state.logs);
  const addLog = useAppStore(state => state.addLog);
  const isPaused = useAppStore(state => state.isLiveFeedPaused);
  const togglePause = useAppStore(state => state.toggleLiveFeed);

  const [selectedRow, setSelectedRow] = useState<GuardrailLog | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [templateFilter, setTemplateFilter] = useState<string>('All');
  const [violationFilters, setViolationFilters] = useState<string[]>([]);

  // Simulator Interval
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      addLog(generateSingleLog());
    }, 2500); // New log every 2.5s
    return () => clearInterval(interval);
  }, [isPaused, addLog]);

  // Derived filtered data
  const filteredData = useMemo(() => {
    return logs.filter(log => {
      if (actionFilter !== 'All' && log.action !== actionFilter) return false;
      if (templateFilter !== 'All' && log.template !== templateFilter) return false;
      if (violationFilters.length > 0) {
        const hasMatch = violationFilters.some(v => log.violations.includes(v as any));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [logs, actionFilter, templateFilter, violationFilters]);

  // Columns
  const columns = useMemo<ColumnDef<GuardrailLog>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: info => (
        <div className="text-secondary whitespace-nowrap text-xs" title={new Date(info.getValue<number>()).toLocaleString()}>
          {formatDistanceToNow(info.getValue<number>(), { addSuffix: true })}
        </div>
      )
    },
    {
      accessorKey: 'action',
      header: 'Action',
      cell: info => <ActionBadge variant={info.getValue<any>()} />
    },
    {
      accessorKey: 'template',
      header: 'Template',
      cell: info => <TemplateTag name={info.getValue<string>()} />
    },
    {
      accessorKey: 'riskScore',
      header: 'Risk Score',
      cell: info => (
         <div className="w-24">
            <div className="text-xs mb-1 font-mono">{info.getValue<number>().toFixed(2)}</div>
            <RiskBar score={info.getValue<number>()} />
         </div>
      )
    },
    {
      accessorKey: 'violations',
      header: 'Violations',
      cell: info => (
        <div className="flex flex-wrap gap-1">
          {info.getValue<string[]>().map(v => <ViolationChip key={v} type={v as any} />)}
        </div>
      )
    },
    {
      accessorKey: 'latency',
      header: 'Latency',
      cell: info => <div className="font-mono text-xs text-muted">{info.getValue<number>()}ms</div>
    },
    {
      id: 'actions',
      cell: () => <Maximize2 className="w-4 h-4 text-muted mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    }
  ], []);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleViolation = (v: string) => {
    setViolationFilters(prev => 
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden relative">
      
      {/* Controls Bar */}
      <div className="flex items-center justify-between mb-4 shrink-0 bg-surface border border-border p-3 rounded-lg shadow-sm w-full gap-4 overflow-x-auto">
        <div className="flex items-center gap-6 min-w-max">
          
          {/* Action Filter */}
          <div className="flex bg-canvas border border-border rounded-md p-1">
            {['All', 'ALLOW', 'WARN', 'BLOCK'].map(a => (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-sm transition-colors",
                  actionFilter === a ? "bg-surface text-white shadow-sm" : "text-muted hover:text-white"
                )}
              >
                {a}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-border mx-2"></div>

          {/* Template Filter */}
          <select 
            className="bg-canvas border border-border text-xs text-white rounded-md px-3 py-1.5 outline-none min-w-[140px]"
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
          >
            <option value="All">All Templates</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Finance">Finance</option>
            <option value="General Purpose">General Purpose</option>
          </select>

          <div className="w-px h-6 bg-border mx-2"></div>

          {/* Violation Chips Filter */}
          <div className="flex gap-2">
             {['PII', 'Toxicity', 'Prompt Injection'].map(v => (
               <button
                 key={v}
                 onClick={() => toggleViolation(v)}
                 className={cn(
                   "px-2 py-1 flex items-center gap-1.5 text-xs rounded-full border transition-all",
                   violationFilters.includes(v) 
                      ? "bg-primary-brand/20 border-primary-brand/50 text-primary-brand" 
                      : "bg-surface border-border text-muted hover:bg-white/5"
                 )}
               >
                 {v}
               </button>
             ))}
          </div>
        </div>

        {/* Play / Pause Toggle */}
        <button 
          onClick={togglePause}
          className={cn(
            "flex items-center gap-2 px-4 py-1.5 rounded-md border text-sm font-medium transition-colors shrink-0",
             isPaused 
               ? "border-warning/50 bg-warning/10 text-warning" 
               : "border-success/50 bg-success/10 text-success"
          )}
        >
          {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {isPaused ? 'Resume Feed' : 'Live Feed Active'}
        </button>
      </div>

      {/* Main Table Area */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-surface relative">
        <table className="w-full text-left border-collapse text-sm">
          <thead className="bg-[#1a1b26] sticky top-0 z-10 border-b border-border shadow-sm">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="p-3 text-muted font-medium text-xs uppercase tracking-wider">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border/50">
            {table.getRowModel().rows.map(row => (
              <tr 
                key={row.id} 
                onClick={() => setSelectedRow(row.original)}
                className="group hover:bg-white/5 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
               <tr>
                 <td colSpan={columns.length} className="p-12 text-center text-muted">
                    No logs matching the current filters.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Side Drawer */}
      <AnimatePresence>
        {selectedRow && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRow(null)}
              className="absolute inset-0 bg-canvas/60 backdrop-blur-sm z-20"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-full max-w-md bg-surface border-l border-border z-30 shadow-2xl overflow-y-auto"
            >
              <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-surface/95 backdrop-blur z-10">
                <h3 className="font-semibold text-white">Request Details</h3>
                <button onClick={() => setSelectedRow(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors text-muted hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 flex flex-col gap-6">
                
                {/* Header Summary */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                     <ActionBadge variant={selectedRow.action} className="text-sm px-3 py-1" />
                     <TemplateTag name={selectedRow.template} />
                  </div>
                  <div className="text-xs text-muted flex gap-4 mt-1">
                     <span>{new Date(selectedRow.timestamp).toLocaleString()}</span>
                     <span>Latency: {selectedRow.latency}ms</span>
                  </div>
                </div>

                {/* Risk Breakdown Area */}
                <div>
                   <h4 className="text-xs uppercase font-bold text-muted mb-3 flex items-center gap-2 tracking-wider">
                      Risk Breakdown
                      <span className="bg-canvas border border-border px-1.5 rounded text-white font-mono">{selectedRow.riskScore.toFixed(2)}</span>
                   </h4>
                   <RiskBar score={selectedRow.riskScore} className="h-2 mb-4" />
                   
                   {selectedRow.violations.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedRow.violations.map(v => <ViolationChip key={v} type={v} />)}
                      </div>
                   ) : (
                      <div className="text-xs text-success bg-success/10 border border-success/20 px-2 py-1 rounded inline-block">
                        No violations detected.
                      </div>
                   )}
                </div>

                {/* Simulated Request Body / text snippet */}
                <div>
                   <h4 className="text-xs uppercase font-bold text-muted mb-2 tracking-wider">Intercepted Text</h4>
                   <div className="bg-[#0d0d12] border border-border rounded-md p-3 text-sm font-mono text-gray-300 relative overflow-hidden group">
                      
                      {/* Fake redacted effect if PII present limit for visual demo */}
                      {selectedRow.violations.includes('PII') ? (
                         <span>
                            User prompt: {selectedRow.requestPreview.split(' ').map((word, i) => (
                               Math.random() > 0.8 || word.match(/[0-9]/) 
                                 ? <span key={i} className="bg-warning/20 text-warning px-1 mx-0.5 rounded border border-warning/30">[REDACTED]</span> 
                                 : word + ' '
                            ))}
                         </span>
                      ) : (
                         <span>User prompt: {selectedRow.requestPreview}</span>
                      )}
                      
                   </div>
                </div>

                {/* Metadata JSON */}
                <div>
                   <h4 className="text-xs uppercase font-bold text-muted mb-2 tracking-wider">Metadata Payload</h4>
                   <JsonViewer data={selectedRow.metadata} defaultExpanded={true} />
                </div>
                
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
