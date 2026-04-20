import { ShieldCheck, Ban, Timer, Key } from 'lucide-react';
import { MetricCard, Card } from '../components/ui/MetricCard';
import { ActionBadge } from '../components/ui/ActionBadge';
import { useAppStore } from '../store/useAppStore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export function Overview() {
  const logs = useAppStore(state => state.logs);
  const keys = useAppStore(state => state.apiKeys);

  const totalRequests = logs.length;
  const blocks = logs.filter(l => l.action === 'BLOCK').length;
  const blockRate = totalRequests > 0 ? ((blocks / totalRequests) * 100).toFixed(1) : '0';
  const avgLatencyMs = totalRequests > 0 
    ? Math.round(logs.reduce((acc, curr) => acc + curr.latency, 0) / totalRequests) 
    : 0;
  const activeKeys = keys.filter(k => k.status === 'Active').length;

  const timeData = [
    { time: '00:00', Allow: 0, Warn: 0, Block: 0 },
    { time: '04:00', Allow: 0, Warn: 0, Block: 0 },
    { time: '08:00', Allow: 0, Warn: 0, Block: 0 },
    { time: '12:00', Allow: 0, Warn: 0, Block: 0 },
    { time: '16:00', Allow: 0, Warn: 0, Block: 0 },
    { time: '20:00', Allow: 0, Warn: 0, Block: 0 },
  ];
  
  logs.forEach(log => {
      const idx = Math.floor(Math.random() * timeData.length);
      const actionMap = { 'ALLOW': 'Allow', 'WARN': 'Warn', 'BLOCK': 'Block' };
      timeData[idx][actionMap[log.action] as 'Allow'|'Warn'|'Block'] += 1;
  });

  const vCounts = { PII: 0, Toxicity: 0, Injection: 0 };
  logs.forEach(log => {
    log.violations.forEach(v => {
      if (v === 'PII') vCounts.PII++;
      if (v === 'Toxicity') vCounts.Toxicity++;
      if (v === 'Prompt Injection') vCounts.Injection++;
    });
  });

  const pieData = [
    { name: 'PII Detection', value: vCounts.PII, color: '#f59e0b' },
    { name: 'Toxicity', value: vCounts.Toxicity, color: '#6366f1' },
    { name: 'Prompt Injection', value: vCounts.Injection, color: '#ef4444' },
  ];

  // Top Triggered Templates Bar Chart
  const templateCounts: Record<string, number> = {};
  logs.forEach(l => {
    if (l.action !== 'ALLOW') {
      templateCounts[l.template] = (templateCounts[l.template] || 0) + 1;
    }
  });
  
  const barData = Object.entries(templateCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }))
    .slice(0, 5);

  const recentViolations = logs.filter(l => l.action !== 'ALLOW').slice(0, 8);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Requests" value={totalRequests.toLocaleString()} delta={12.4} icon={ShieldCheck} />
        <MetricCard title="Block Rate" value={`${blockRate}%`} delta={-1.2} icon={Ban} />
        <MetricCard title="Avg Latency" value={`${avgLatencyMs}ms`} delta={0.5} icon={Timer} />
        <MetricCard title="Active API Keys" value={activeKeys.toString()} delta={0} icon={Key} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="p-4 lg:col-span-3 min-h-[300px] flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Requests Over Time</h2>
            <select className="bg-surface border border-border text-xs rounded px-2 py-1 outline-none text-muted">
              <option>Last 24h</option>
              <option>Last 7d</option>
            </select>
          </div>
          <div className="flex-1 w-full min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e303a" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: '#1e1e2e', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#64748b' }} />
                <Line type="monotone" dataKey="Allow" stroke="#22c55e" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Warn" stroke="#f59e0b" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="Block" stroke="#ef4444" strokeWidth={2} dot={{ r: 0 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4 lg:col-span-2 min-h-[300px] flex flex-col">
          <h2 className="text-sm font-semibold text-white mb-4">Violations by Type</h2>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111118', borderColor: '#1e1e2e', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" verticalAlign="bottom" wrapperStyle={{ fontSize: 12, paddingTop: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Triggered Templates */}
        <Card className="p-4 flex flex-col min-h-[350px]">
          <h2 className="text-sm font-semibold text-white mb-4">Top Triggered Templates</h2>
          <div className="flex-1 w-full min-h-[250px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#2e303a" />
                  <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: '#2e303a', opacity: 0.2}} contentStyle={{ backgroundColor: '#111118', borderColor: '#1e1e2e', color: '#fff' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24} />
               </BarChart>
             </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Violations Feed */}
        <Card className="p-4 flex flex-col min-h-[350px]">
          <div className="flex items-center justify-between mb-4">
             <h2 className="text-sm font-semibold text-white">Recent Violations</h2>
             <a href="/audit" className="text-xs text-primary-brand hover:underline font-medium">View All &rarr;</a>
          </div>
          <div className="flex flex-col gap-2 overflow-hidden flex-1">
             {recentViolations.map((log) => (
                <div key={log.id} className="flex items-center gap-3 p-2 rounded hover:bg-white/5 transition-colors group">
                   <div className="shrink-0 w-16">
                     <ActionBadge variant={log.action} />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                         <span className="text-xs font-medium text-white line-clamp-1">{log.template}</span>
                         <span className="text-[10px] text-muted whitespace-nowrap">
                           {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                         </span>
                      </div>
                      <div className="text-xs text-muted truncate font-mono">
                         {log.requestPreview}
                      </div>
                   </div>
                </div>
             ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
