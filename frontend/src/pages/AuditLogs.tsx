import { useState, useMemo } from 'react';
import { 
  useReactTable, getCoreRowModel, flexRender, getPaginationRowModel 
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';

import { useAppStore } from '../store/useAppStore';
import type { GuardrailLog } from '../data/mockData';
import { ActionBadge } from '../components/ui/ActionBadge';
import { TemplateTag, ViolationChip } from '../components/ui/Tags';
import { cn } from '../components/layout/Sidebar';

export function AuditLogs() {
  const allLogs = useAppStore(state => state.logs);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  // Simplified filters for demo
  const [actionFilter, setActionFilter] = useState('All');
  
  const filteredLogs = useMemo(() => {
     let logs = allLogs;
     if (actionFilter !== 'All') logs = logs.filter(l => l.action === actionFilter);
     if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        logs = logs.filter(l => 
          l.requestPreview.toLowerCase().includes(lower) || 
          l.id.toLowerCase().includes(lower) ||
          l.template.toLowerCase().includes(lower)
        );
     }
     return logs;
  }, [allLogs, actionFilter, searchTerm]);

  const columns = useMemo<ColumnDef<GuardrailLog>[]>(() => [
    {
      accessorKey: 'timestamp',
      header: 'Timestamp',
      cell: info => <span className="text-muted text-xs whitespace-nowrap">{format(info.getValue<number>(), 'MMM d, HH:mm:ss')}</span>
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
      header: 'Score',
      cell: info => <span className="font-mono text-xs">{info.getValue<number>().toFixed(2)}</span>
    },
    {
      accessorKey: 'violations',
      header: 'Violations',
      cell: info => (
        <div className="flex gap-1 flex-wrap">
          {info.getValue<string[]>().slice(0,2).map(v => <ViolationChip key={v} type={v as any} />)}
          {info.getValue<string[]>().length > 2 && <span className="text-[10px] text-muted">+{info.getValue<string[]>().length - 2}</span>}
        </div>
      )
    },
    {
      accessorKey: 'requestPreview',
      header: 'Preview',
      cell: info => <span className="text-xs font-mono text-muted truncate max-w-[200px] block" title={info.getValue<string>()}>{info.getValue<string>()}</span>
    },
    {
       id: 'expand',
       cell: () => <button className="p-1 hover:bg-white/10 rounded"><Maximize2 className="w-3.5 h-3.5 text-muted" /></button>
    }
  ], []);

  const table = useReactTable({
    data: filteredLogs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
       pagination: {
          pageSize: 25,
       }
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] overflow-hidden">
      
      {/* Header and Search */}
      <div className="flex items-center gap-4 mb-4 shrink-0">
         <div className="flex-1 relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search logs by UUID, template, or text content... try 'template:healthcare'"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder:text-muted focus:outline-none focus:border-primary-brand/50 transition-colors"
            />
         </div>
         <button className="flex items-center gap-2 bg-surface border border-border hover:bg-white/5 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Export CSV
         </button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden gap-4 min-h-0">
         
         {/* Filter Sidebar */}
         <div className={cn("bg-surface border border-border rounded-lg flex flex-col transition-all overflow-hidden shrink-0", isFilterOpen ? "w-64" : "w-0 border-none")}>
            <div className="p-4 border-b border-border flex items-center justify-between">
               <span className="font-semibold text-white flex items-center gap-2"><Filter className="w-4 h-4" /> Filters</span>
               <button onClick={()=>setIsFilterOpen(false)} className="text-muted hover:text-white"><ChevronLeft className="w-4 h-4" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
               <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Action</label>
                  <select value={actionFilter} onChange={e=>setActionFilter(e.target.value)} className="w-full bg-canvas border border-border text-xs rounded p-2 text-white outline-none">
                     <option value="All">All Actions</option>
                     <option value="ALLOW">ALLOW</option>
                     <option value="WARN">WARN</option>
                     <option value="BLOCK">BLOCK</option>
                  </select>
               </div>
               
               <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Risk Score</label>
                  <input type="range" min="0" max="1" step="0.1" className="w-full accent-primary-brand" />
                  <div className="flex justify-between text-[10px] text-muted mt-1">
                     <span>0.0</span><span>1.0</span>
                  </div>
               </div>
               
               {/* Placeholders for other filtering controls requested */}
               <div>
                  <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 block">Date Range</label>
                  <div className="text-xs text-muted bg-canvas p-2 border border-border rounded text-center">Calendar UI Placeholder</div>
               </div>
            </div>
         </div>

         {/* Table Area */}
         <div className="flex-1 flex flex-col bg-surface border border-border rounded-lg overflow-hidden relative">
            {!isFilterOpen && (
               <button onClick={()=>setIsFilterOpen(true)} className="absolute top-2 left-2 z-10 w-8 h-8 flex items-center justify-center bg-[#15161e] border border-border text-muted hover:text-white rounded-md shadow-sm">
                 <Filter className="w-4 h-4" />
               </button>
            )}

            <div className="flex-1 overflow-auto w-full">
               <table className="w-full text-left border-collapse text-sm">
                 <thead className="bg-[#15161e] sticky top-0 z-10 border-b border-border shadow-sm">
                   {table.getHeaderGroups().map(headerGroup => (
                     <tr key={headerGroup.id}>
                       {headerGroup.headers.map(header => (
                         <th key={header.id} className={cn("p-3 text-muted font-medium text-xs uppercase tracking-wider", !isFilterOpen && header.id === 'timestamp' && 'pl-12')}>
                           {flexRender(header.column.columnDef.header, header.getContext())}
                         </th>
                       ))}
                     </tr>
                   ))}
                 </thead>
                 <tbody className="divide-y divide-border/50">
                   {table.getRowModel().rows.map(row => (
                     <tr key={row.id} className="hover:bg-white/5 cursor-pointer transition-colors group">
                       {row.getVisibleCells().map(cell => (
                         <td key={cell.id} className={cn("p-3 align-middle", !isFilterOpen && cell.column.id === 'timestamp' && 'pl-12')}>
                           {flexRender(cell.column.columnDef.cell, cell.getContext())}
                         </td>
                       ))}
                     </tr>
                   ))}
                   {table.getRowModel().rows.length === 0 && (
                      <tr>
                        <td colSpan={columns.length} className="p-8 text-center text-muted">No logs found matching your criteria.</td>
                      </tr>
                   )}
                 </tbody>
               </table>
            </div>

            {/* Pagination */}
            <div className="p-3 border-t border-border bg-[#111118] flex items-center justify-between shrink-0">
               <div className="text-xs text-muted">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, filteredLogs.length)} of {filteredLogs.length} records
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="p-1.5 border border-border rounded text-muted hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="p-1.5 border border-border rounded text-muted hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                     <ChevronRight className="w-4 h-4" />
                  </button>
               </div>
            </div>

         </div>

      </div>
    </div>
  );
}
