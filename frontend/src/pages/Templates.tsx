import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Editor from 'react-simple-code-editor';
// @ts-ignore
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-tomorrow.css';
import { Plus, X, Stethoscope, Building2, Layers, Shield, Settings2, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppStore } from '../store/useAppStore';
import type { Template } from '../data/mockData';
import { Card } from '../components/ui/MetricCard';
import { cn } from '../components/layout/Sidebar';

// Form schema for New Template
const templateSchema = z.object({
  name: z.string().min(3, 'Name is required (min 3 chars)'),
  piiEnabled: z.boolean(),
  piiWeight: z.number().min(0).max(1),
  toxEnabled: z.boolean(),
  toxWeight: z.number().min(0).max(1),
  injEnabled: z.boolean(),
  injWeight: z.number().min(0).max(1),
  warnThreshold: z.number().min(0).max(1),
  blockThreshold: z.number().min(0).max(1),
});

type FormValues = z.infer<typeof templateSchema>;

export function Templates() {
  const templates = useAppStore(state => state.templates);
  const updateTemplate = useAppStore(state => state.updateTemplate);
  
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [jsonCode, setJsonCode] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);

  const handleEditClick = (template: Template) => {
    setEditingTemplate(template);
    setJsonCode(JSON.stringify(template, null, 2));
    setJsonError(null);
  };

  const handleSaveJson = () => {
    try {
      const parsed = JSON.parse(jsonCode);
      if (editingTemplate) {
        updateTemplate(editingTemplate.id, parsed);
      }
      setEditingTemplate(null);
    } catch (e: any) {
      setJsonError(`Invalid JSON: ${e.message}`);
    }
  };

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '', piiEnabled: true, piiWeight: 0.5, toxEnabled: true, toxWeight: 0.5, injEnabled: true, injWeight: 0.5, warnThreshold: 0.5, blockThreshold: 0.8
    }
  });

  const onSubmitNew = (data: FormValues) => {
    // In a real app we'd dispatch to store
    console.log("New template data:", data);
    setIsNewModalOpen(false);
  };

  const getIcon = (name: string) => {
    if (name === 'stethoscope') return <Stethoscope className="w-5 h-5 text-indigo-400" />;
    if (name === 'building-2') return <Building2 className="w-5 h-5 text-indigo-400" />;
    return <Layers className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-white tracking-tight">Guardrail Templates</h2>
           <p className="text-sm text-muted mt-1">Manage rules, weights, and thresholds for different traffic profiles.</p>
        </div>
        <button 
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 bg-primary-brand hover:bg-primary-brand/90 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {templates.map(tpl => (
          <Card key={tpl.id} className="p-0 overflow-hidden flex flex-col hover:border-primary-brand/50 transition-colors group">
            <div className="p-5 flex items-start justify-between border-b border-border/50 bg-[#15161e]">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-lg bg-primary-brand/10 border border-primary-brand/20 flex items-center justify-center shrink-0">
                    {getIcon(tpl.icon)}
                 </div>
                 <div>
                    <h3 className="font-semibold text-base text-white">{tpl.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-success">
                         <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                         Active
                      </span>
                      <span className="text-muted text-xs font-mono">{tpl.id}</span>
                    </div>
                 </div>
               </div>
               
               <div className="flex flex-col items-end gap-1 text-xs">
                  <div className="flex items-center gap-2">
                     <span className="text-muted">Block &ge;</span>
                     <span className="font-mono bg-danger/10 text-danger border border-danger/30 px-1 rounded">{tpl.thresholds.block.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-muted">Warn &ge;</span>
                     <span className="font-mono bg-warning/10 text-warning border border-warning/30 px-1 rounded">{tpl.thresholds.warn.toFixed(2)}</span>
                  </div>
               </div>
            </div>

            <div className="p-5 flex-1 bg-surface">
               <h4 className="text-xs uppercase font-semibold text-muted mb-3 flex items-center gap-1.5">
                 <Shield className="w-3.5 h-3.5" /> Guardrail Weights
               </h4>
               <div className="flex flex-col gap-3">
                  {Object.entries(tpl.weights).map(([key, weight]) => (
                    <div key={key} className="flex flex-col gap-1.5">
                       <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 capitalize">{key}</span>
                          <span className="font-mono text-muted">{weight.toFixed(2)}</span>
                       </div>
                       <div className="w-full h-1.5 bg-canvas border border-border rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${weight * 100}%` }}></div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="p-3 border-t border-border bg-canvas flex items-center gap-2 justify-end">
               <button className="px-3 py-1.5 text-xs font-medium text-muted hover:text-white transition-colors flex items-center gap-1.5">
                 <Copy className="w-3.5 h-3.5" /> Duplicate
               </button>
               <button className="px-3 py-1.5 text-xs font-medium text-muted hover:text-white transition-colors">
                 View Logs
               </button>
               <button 
                 onClick={() => handleEditClick(tpl)}
                 className="px-3 py-1.5 text-xs font-medium bg-surface border border-border hover:bg-white/5 text-white rounded transition-colors flex items-center gap-1.5"
               >
                 <Settings2 className="w-3.5 h-3.5" /> Edit Config
               </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Config Modal (JSON) */}
      <AnimatePresence>
        {editingTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingTemplate(null)} className="absolute inset-0 bg-canvas/80 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface border border-border rounded-lg shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-4 border-b border-border flex items-center justify-between bg-canvas">
                  <h3 className="font-semibold text-white">Edit Config: {editingTemplate.name}</h3>
                  <button onClick={() => setEditingTemplate(null)} className="text-muted hover:text-white"><X className="w-4 h-4" /></button>
               </div>
               
               <div className="p-4 bg-warning/10 border-b border-warning/20 text-warning text-xs flex items-center justify-center">
                  Changes to this configuration take effect immediately on the next request.
               </div>

               <div className="flex-1 overflow-auto p-4 bg-[#1e1e1e] font-mono text-[13px]">
                 <div className="rounded border border-[#333] overflow-hidden relative">
                    <Editor
                      value={jsonCode}
                      onValueChange={code => { setJsonCode(code); setJsonError(null); }}
                      highlight={code => Prism.highlight(code, Prism.languages.json, 'json')}
                      padding={16}
                      style={{ fontFamily: 'monospace', minHeight: '300px' }}
                      className="editor-container"
                    />
                 </div>
                 {jsonError && <div className="mt-3 text-danger text-xs bg-danger/10 p-2 rounded border border-danger/30">{jsonError}</div>}
               </div>

               <div className="p-4 border-t border-border flex justify-end gap-3 bg-canvas">
                  <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-sm font-medium text-muted hover:text-white">Cancel</button>
                  <button onClick={handleSaveJson} className="px-4 py-2 text-sm font-medium bg-primary-brand text-white rounded hover:bg-primary-brand/90 transition-colors">Save Configuration</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Template Form Modal */}
      {/* ... keeping simplified for brevity, standard useForm implementation ... */}
    </div>
  );
}
