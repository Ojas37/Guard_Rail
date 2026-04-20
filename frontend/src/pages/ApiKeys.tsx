import { useState, useMemo } from 'react';
import { 
  useReactTable, getCoreRowModel, flexRender 
} from '@tanstack/react-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, X, RefreshCw, Trash2, Shield, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

import { useAppStore } from '../store/useAppStore';
import type { ApiKey } from '../data/mockData';
import { Card } from '../components/ui/MetricCard';
import { CopyableKey } from '../components/ui/MiscUI';
import { cn } from '../components/layout/Sidebar';

export function ApiKeys() {
  const apiKeys = useAppStore(state => state.apiKeys);
  const revokeApiKey = useAppStore(state => state.revokeApiKey);
  const addApiKey = useAppStore(state => state.addApiKey);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const [selectedKeyForChart, setSelectedKeyForChart] = useState<string>(apiKeys[0]?.id || '');

  // Columns for the API Keys table
  const columns = useMemo<ColumnDef<ApiKey>[]>(() => [
    {
      accessorKey: 'keyPreview',
      header: 'Key Preview',
      cell: info => <CopyableKey apiKey={info.getValue<string>()} />
    },
    {
      accessorKey: 'label',
      header: 'Label',
      cell: info => <span className="font-medium text-white">{info.getValue<string>()}</span>
    },
    {
      accessorKey: 'requests24h',
      header: 'Requests (24h)',
      cell: info => <span className="font-mono text-muted">{info.getValue<number>().toLocaleString()}</span>
    },
    {
      accessorKey: 'rateLimit',
      header: 'Rate Limit',
      cell: info => <span className="text-muted text-xs">{info.getValue<number>()} req/min</span>
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: info => <span className="text-secondary text-xs">{formatDistanceToNow(info.getValue<number>(), { addSuffix: true })}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: info => {
         const val = info.getValue<string>();
         const isActive = val === 'Active';
         return (
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
               <span className={cn("w-2 h-2 rounded-full", isActive ? "bg-success" : "bg-muted")}></span>
               <span className={isActive ? "text-white" : "text-muted"}>{val}</span>
            </div>
         );
      }
    },
    {
      id: 'actions',
      cell: ({ row }) => {
         const isActive = row.original.status === 'Active';
         if (!isActive) return null;
         
         return (
            <div className="flex items-center justify-end gap-2 text-muted">
               <button className="p-1.5 hover:text-white hover:bg-white/10 rounded transition-colors" title="Rotate Key">
                 <RefreshCw className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => revokeApiKey(row.original.id)}
                 className="p-1.5 hover:text-danger hover:bg-danger/10 rounded transition-colors" 
                 title="Revoke Key"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
         );
      }
    }
  ], [revokeApiKey]);

  const table = useReactTable({
    data: apiKeys,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newK = 'aegis_sk_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const id = 'KEY-' + Math.floor(Math.random()*1000);
    setGeneratedKey(newK);
    
    addApiKey({
       id: id,
       keyPreview: `aegis_sk_****${newK.slice(-4)}`,
       label: newKeyLabel || 'Untitled Key',
       requests24h: 0,
       rateLimit: newKeyRateLimit,
       createdAt: Date.now(),
       status: 'Active'
    });
  };

  const closeGenerateModal = () => {
     setIsGenerateModalOpen(false);
     setGeneratedKey(null);
     setNewKeyLabel('');
     setNewKeyRateLimit(100);
  };

  // Fake chart data based on selected key
  const chartData = Array.from({length: 12}).map((_, i) => ({
      hour: `${i*2}:00`,
      requests: Math.floor(Math.random() * (apiKeys.find(k => k.id === selectedKeyForChart)?.requests24h || 100) / 20)
  }));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-white tracking-tight">API Keys Management</h2>
           <p className="text-sm text-muted mt-1">Manage integration keys, rate limits, and view usage metrics.</p>
        </div>
        <button 
          onClick={() => setIsGenerateModalOpen(true)}
          className="flex items-center gap-2 bg-primary-brand hover:bg-primary-brand/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Generate New Key
        </button>
      </div>

      {/* Keys Table */}
      <Card className="overflow-hidden border-border/50">
        <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse text-sm">
             <thead className="bg-[#15161e] border-b border-border/50">
               {table.getHeaderGroups().map(headerGroup => (
                 <tr key={headerGroup.id}>
                   {headerGroup.headers.map(header => (
                     <th key={header.id} className="p-4 text-muted font-medium text-xs uppercase tracking-wider">
                       {flexRender(header.column.columnDef.header, header.getContext())}
                     </th>
                   ))}
                 </tr>
               ))}
             </thead>
             <tbody className="divide-y divide-border/50">
               {table.getRowModel().rows.map(row => (
                 <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                   {row.getVisibleCells().map(cell => (
                     <td key={cell.id} className="p-4 align-middle">
                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
                     </td>
                   ))}
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </Card>

      {/* Usage Panel */}
      <Card className="p-5 flex flex-col min-h-[350px]">
        <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-2 text-white font-semibold flex-1">
              <Activity className="w-5 h-5 text-primary-brand" />
              Key Usage (7 Days)
           </div>
           
           <select 
             className="bg-canvas border border-border text-sm text-white rounded-md px-3 py-1.5 outline-none min-w-[200px]"
             value={selectedKeyForChart}
             onChange={(e) => setSelectedKeyForChart(e.target.value)}
           >
             {apiKeys.map(k => (
                <option key={k.id} value={k.id}>{k.label} ({k.keyPreview})</option>
             ))}
           </select>
        </div>

        <div className="flex-1 w-full min-h-[250px]">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" vertical={false} />
               <XAxis dataKey="hour" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
               <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
               <RechartsTooltip contentStyle={{ backgroundColor: '#111118', borderColor: '#1e1e2e', color: '#fff' }} />
               <Line type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
             </LineChart>
           </ResponsiveContainer>
        </div>
      </Card>

      {/* Generate Modal */}
      <AnimatePresence>
        {isGenerateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-canvas/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-md z-10 overflow-hidden flex flex-col">
               
               <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-white">Generate New API Key</h3>
                  <button onClick={closeGenerateModal} className="text-muted hover:text-white"><X className="w-4 h-4" /></button>
               </div>
               
               <div className="p-5 flex flex-col gap-5">
                  {!generatedKey ? (
                     <form id="gen-key" onSubmit={handleGenerate} className="flex flex-col gap-4">
                        <div>
                           <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Key Label</label>
                           <input required value={newKeyLabel} onChange={e=>setNewKeyLabel(e.target.value)} type="text" placeholder="e.g. Production Subnet..." className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-white placeholder:text-muted/50 focus:outline-none focus:border-primary-brand/50" />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-muted uppercase tracking-wider mb-1.5">Rate Limit</label>
                           <select value={newKeyRateLimit} onChange={e=>setNewKeyRateLimit(Number(e.target.value))} className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-brand/50">
                              <option value={10}>10 req/min (Dev)</option>
                              <option value={50}>50 req/min</option>
                              <option value={100}>100 req/min</option>
                              <option value={500}>500 req/min (Pro)</option>
                           </select>
                        </div>
                     </form>
                  ) : (
                     <div className="flex flex-col items-center justify-center py-4 text-center">
                        <div className="w-12 h-12 bg-success/10 border border-success/20 rounded-full flex items-center justify-center mb-4">
                           <Shield className="w-6 h-6 text-success" />
                        </div>
                        <h4 className="text-white font-semibold mb-2">Key Generated Successfully</h4>
                        <p className="text-xs text-muted mb-4">Please copy this key now. For your security, <strong className="text-danger">it will not be shown again</strong>.</p>
                        
                        <div className="w-full bg-canvas border border-border p-3 rounded-md flex items-center justify-between">
                           <code className="text-white text-sm select-all tracking-wider font-mono">{generatedKey}</code>
                           <CopyableKey apiKey={generatedKey} className="ml-3" />
                        </div>
                     </div>
                  )}
               </div>

               <div className="p-4 border-t border-border flex justify-end gap-3 bg-[#111118]">
                  <button onClick={closeGenerateModal} className="px-4 py-2 text-sm font-medium text-muted hover:text-white">
                     {generatedKey ? 'Close' : 'Cancel'}
                  </button>
                  {!generatedKey && (
                     <button form="gen-key" type="submit" className="px-4 py-2 text-sm font-medium bg-primary-brand text-white rounded hover:bg-primary-brand/90 transition-colors">
                        Generate
                     </button>
                  )}
               </div>
               
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
