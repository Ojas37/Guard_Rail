import { useState } from 'react';
import { Card } from '../components/ui/MetricCard';
import { AlertCircle, Trash2, Webhook, Database, Bell, Settings2 } from 'lucide-react';
import { cn } from '../components/layout/Sidebar';
import { useAppStore } from '../store/useAppStore';

type SettingsTab = 'General' | 'Notifications' | 'Danger Zone';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('General');
  
  const [env, setEnv] = useState('Production');
  const [logLevel, setLogLevel] = useState('Info');
  const [rentention, setRetention] = useState('90');

  const [alertBlockRate, setAlertBlockRate] = useState(true);
  const [blockThresh, setBlockThresh] = useState('5.0');
  const [alertLatency, setAlertLatency] = useState(true);
  const [latThresh, setLatThresh] = useState('500');
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/...');

  const clearOldLogs = useAppStore(state => state.clearOldLogs);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
     setToastMessage(msg);
     setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePurgeLogs = () => {
     if (window.confirm('Are you sure you want to purge audit logs older than 90 days? This action cannot be undone.')) {
        clearOldLogs();
        showToast('Successfully purged old audit logs.');
     }
  };

  const handleFlushRedis = () => {
     if (window.confirm('Are you sure you want to flush the Redis cache? This may cause a temporary spike in latency.')) {
        showToast('Redis cache flushed successfully.');
     }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div>
         <h2 className="text-xl font-bold text-white tracking-tight">Platform Settings</h2>
         <p className="text-sm text-muted mt-1">Configure global guardrail behaviors, alerts, and data retention.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mt-2 items-start">
         
         {/* Left Nav */}
         <div className="w-full md:w-56 flex flex-col gap-1 shrink-0">
            {[
               { name: 'General', icon: Settings2 },
               { name: 'Notifications', icon: Bell },
               { name: 'Danger Zone', icon: AlertCircle }
            ].map(tab => (
               <button
                 key={tab.name}
                 onClick={() => setActiveTab(tab.name as SettingsTab)}
                 className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left",
                    activeTab === tab.name 
                      ? "bg-primary-brand/10 text-primary-brand" 
                      : "text-muted hover:text-white hover:bg-white/5"
                 )}
               >
                 <tab.icon className="w-4 h-4" />
                 {tab.name}
               </button>
            ))}
         </div>

         {/* Content Area */}
         <div className="flex-1 w-full">
            {activeTab === 'General' && (
               <Card className="p-6 flex flex-col gap-6 min-h-[400px]">
                  <h3 className="text-lg font-semibold text-white border-b border-border pb-4">General Settings</h3>
                  
                  <div className="flex flex-col gap-2 max-w-md">
                     <label className="text-sm font-medium text-white">Environment</label>
                     <p className="text-xs text-muted mb-1">Set the current operating environment context.</p>
                     <select value={env} onChange={e=>setEnv(e.target.value)} className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-brand/50">
                        <option value="Development">Development</option>
                        <option value="Staging">Staging</option>
                        <option value="Production">Production</option>
                     </select>
                  </div>

                  <div className="flex flex-col gap-2 max-w-md">
                     <label className="text-sm font-medium text-white">Log Level</label>
                     <p className="text-xs text-muted mb-1">Verbosity of internal application logging.</p>
                     <select value={logLevel} onChange={e=>setLogLevel(e.target.value)} className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-brand/50">
                        <option value="Debug">Debug</option>
                        <option value="Info">Info</option>
                        <option value="Warn">Warn</option>
                        <option value="Error">Error</option>
                     </select>
                  </div>

                  <div className="flex flex-col gap-2 max-w-md">
                     <label className="text-sm font-medium text-white">Data Retention Period</label>
                     <p className="text-xs text-muted mb-1">How long to store audit logs before auto-purging.</p>
                     <select value={rentention} onChange={e=>setRetention(e.target.value)} className="w-full bg-canvas border border-border rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-brand/50">
                        <option value="30">30 Days</option>
                        <option value="60">60 Days</option>
                        <option value="90">90 Days</option>
                        <option value="180">180 Days</option>
                     </select>
                  </div>
                  
                  <div className="mt-4 border-t border-border pt-4">
                     <button onClick={()=>showToast('Settings saved successfully.')} className="bg-primary-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-brand/90 transition-colors">
                        Save Changes
                     </button>
                  </div>
               </Card>
            )}

            {activeTab === 'Notifications' && (
               <Card className="p-6 flex flex-col gap-6 min-h-[400px]">
                  <h3 className="text-lg font-semibold text-white border-b border-border pb-4">Notification & Alerts</h3>
                  
                  <div className="flex flex-col gap-4">
                     
                     {/* Block Rate Alert */}
                     <div className="flex items-center justify-between p-4 bg-canvas rounded-lg border border-border">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <input type="checkbox" checked={alertBlockRate} onChange={e=>setAlertBlockRate(e.target.checked)} className="rounded bg-surface border-border text-primary-brand focus:ring-primary-brand w-4 h-4" />
                              <span className="text-sm font-medium text-white">High Block Rate Alert</span>
                           </div>
                           <p className="text-xs text-muted ml-6">Trigger an alert when the block rate exceeds the threshold over 5 mins.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <input type="number" disabled={!alertBlockRate} value={blockThresh} onChange={e=>setBlockThresh(e.target.value)} className="w-20 bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-white text-center focus:outline-none disabled:opacity-50" />
                           <span className="text-muted text-sm">%</span>
                        </div>
                     </div>

                     {/* Latency Alert */}
                     <div className="flex items-center justify-between p-4 bg-canvas rounded-lg border border-border">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <input type="checkbox" checked={alertLatency} onChange={e=>setAlertLatency(e.target.checked)} className="rounded bg-surface border-border text-primary-brand focus:ring-primary-brand w-4 h-4" />
                              <span className="text-sm font-medium text-white">High Latency Alert</span>
                           </div>
                           <p className="text-xs text-muted ml-6">Trigger an alert when p95 latency exceeds threshold.</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <input type="number" disabled={!alertLatency} value={latThresh} onChange={e=>setLatThresh(e.target.value)} className="w-20 bg-surface border border-border rounded-md px-2 py-1.5 text-sm text-white text-center focus:outline-none disabled:opacity-50" />
                           <span className="text-muted text-sm">ms</span>
                        </div>
                     </div>

                     {/* Webhook */}
                     <div className="mt-4">
                        <label className="flex items-center gap-2 text-sm font-medium text-white mb-2">
                           <Webhook className="w-4 h-4 text-muted" /> Webhook URL
                        </label>
                        <p className="text-xs text-muted mb-2">Send JSON payloads to this endpoint when alerts trigger.</p>
                        <input type="url" value={webhookUrl} onChange={e=>setWebhookUrl(e.target.value)} className="w-full max-w-lg bg-canvas border border-border rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary-brand/50" />
                     </div>

                  </div>

                  <div className="mt-auto border-t border-border pt-4">
                     <button onClick={()=>showToast('Notification preferences saved.')} className="bg-primary-brand text-white px-4 py-2 rounded text-sm font-medium hover:bg-primary-brand/90 transition-colors">
                        Save Configurations
                     </button>
                  </div>
               </Card>
            )}

            {activeTab === 'Danger Zone' && (
               <Card className="p-6 flex flex-col gap-6 border-danger/30 bg-danger/5 min-h-[400px]">
                  <h3 className="text-lg font-semibold text-danger border-b border-danger/20 pb-4">Danger Zone</h3>
                  
                  <div className="bg-[#111118] border border-danger/20 rounded-lg p-5 flex items-center justify-between">
                     <div>
                        <h4 className="text-white font-medium flex items-center gap-2"><Database className="w-4 h-4 text-muted" /> Flush Redis Cache</h4>
                        <p className="text-xs text-muted mt-1 max-w-md">Forces all guardrail instances to re-fetch configurations from Postgres on the next request. May cause a temporary latency spike.</p>
                     </div>
                     <button onClick={handleFlushRedis} className="bg-surface hover:bg-danger/10 text-danger border border-danger/30 px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap">
                        Flush Cache
                     </button>
                  </div>

                  <div className="bg-[#111118] border border-danger/20 rounded-lg p-5 flex items-center justify-between">
                     <div>
                        <h4 className="text-white font-medium flex items-center gap-2"><Trash2 className="w-4 h-4 text-muted" /> Purge Old Logs</h4>
                        <p className="text-xs text-muted mt-1 max-w-md">Permanently delete all audit logs older than the current 90 day retention policy. This action is irreversible.</p>
                     </div>
                     <button onClick={handlePurgeLogs} className="bg-danger hover:bg-danger/90 text-white px-4 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap">
                        Purge Audit Logs
                     </button>
                  </div>
               </Card>
            )}
         </div>

      </div>

      {/* Simple Toast */}
      {toastMessage && (
         <div className="fixed bottom-6 right-6 bg-success text-white px-4 py-3 rounded shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 z-50 text-sm font-medium">
            <Bell className="w-4 h-4" /> {toastMessage}
         </div>
      )}

    </div>
  );
}
