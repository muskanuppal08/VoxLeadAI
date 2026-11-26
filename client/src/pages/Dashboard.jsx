import React from 'react';
import { 
  PhoneCall, 
  CheckCircle2, 
  Calendar, 
  Zap, 
  ArrowUpRight, 
  TrendingUp,
  Play,
  Clock,
  Sparkles,
  Bot
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const chartData = [
  { day: 'Mon', calls: 32, qualified: 18 },
  { day: 'Tue', calls: 45, qualified: 26 },
  { day: 'Wed', calls: 64, qualified: 42 },
  { day: 'Thu', calls: 58, qualified: 35 },
  { day: 'Fri', calls: 78, qualified: 52 },
  { day: 'Sat', calls: 40, qualified: 22 },
  { day: 'Sun', calls: 51, qualified: 33 },
];

const recentActivity = [
  {
    id: 1,
    lead: 'Sarah Connor',
    company: 'Cyberdyne Systems',
    time: '5 mins ago',
    bant: 85,
    outcome: 'Demo Booked by Arohi (Tomorrow 3 PM)',
    status: 'hot',
  },
  {
    id: 2,
    lead: 'Vikram Malhotra',
    company: 'FinScale India',
    time: '24 mins ago',
    bant: 75,
    outcome: 'Pricing Inquired ($499 Growth in Hindi)',
    status: 'warm',
  },
  {
    id: 3,
    lead: 'Elena Rostova',
    company: 'Nexus Health',
    time: '1 hour ago',
    bant: 90,
    outcome: 'HIPAA Compliance Verified by Arohi',
    status: 'hot',
  },
  {
    id: 4,
    lead: 'David Kim',
    company: 'Apex Logistics',
    time: '3 hours ago',
    bant: 40,
    outcome: 'Exploring Q4 Timeline',
    status: 'cold',
  },
];

export default function Dashboard({ setActiveTab }) {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Arohi AI Sales Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Gateway Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Autonomous voice prospecting, real-time BANT qualification, and appointment scheduling.</p>
        </div>

        <button
          onClick={() => setActiveTab('voice')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-fuchsia-600/25 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          Talk to Arohi (Live Voice)
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-violet-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Total Voice Calls</span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">368</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% from last week</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-fuchsia-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Hot Leads (BANT &gt; 70)</span>
            <div className="p-2.5 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">228</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>62% qualification rate</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-rose-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Demo Bookings</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">84</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-fuchsia-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Direct Google Meet links</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800/80 hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Avg Audio Latency</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">680 ms</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-400 font-medium">
            <span>Sub-second duplex voice</span>
          </div>
        </div>
      </div>

      {/* Main Analytics & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Analytics Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-white">Call Volume & Lead Qualification Trends</h3>
              <p className="text-xs text-slate-400">Daily inbound calls vs. verified BANT qualified prospects</p>
            </div>
            <span className="text-xs font-mono text-slate-300 px-3 py-1 bg-slate-900 rounded-xl border border-slate-800">
              Last 7 Days
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="callsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="qualifiedGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.35}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d121e', borderColor: '#334155', borderRadius: '14px', fontSize: '12px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="calls" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#callsGradient)" name="Total Calls" />
                <Area type="monotone" dataKey="qualified" stroke="#d946ef" strokeWidth={2.5} fillOpacity={1} fill="url(#qualifiedGradient)" name="Qualified Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Recent Activity */}
        <div className="glass-card rounded-3xl p-6 border border-slate-800/80 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Arohi's Recent Discovered Leads</h3>
            <button onClick={() => setActiveTab('leads')} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 font-medium">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {recentActivity.map((item) => (
              <div key={item.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{item.lead}</h4>
                    <p className="text-[11px] text-slate-400">{item.company}</p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    item.bant >= 80 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    BANT {item.bant}
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-fuchsia-300 truncate">
                  {item.outcome}
                </div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
