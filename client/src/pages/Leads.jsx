import React, { useState } from 'react';
import { Users, Search, Filter, Sparkles, CheckCircle2, ChevronRight, X, Phone } from 'lucide-react';

const mockLeads = [
  {
    id: 'lead-1',
    name: 'Sarah Connor',
    email: 'sarah@cyberdyne.com',
    phone: '+1 (555) 234-5678',
    company: 'Cyberdyne Systems',
    status: 'Booked',
    bant: {
      score: 85,
      budget: '$1,299/mo (Enterprise)',
      authority: 'VP Engineering',
      need: 'Automated 24/7 inbound voice screening',
      timeline: 'Immediate (< 3 weeks)',
    },
    lastCall: 'Today, 3:15 PM',
    transcriptSummary: 'Prospect inquired about high-volume voice inbound and booked a demo slot for tomorrow at 3 PM.',
  },
  {
    id: 'lead-2',
    name: 'Vikram Malhotra',
    email: 'vikram@finscale.in',
    phone: '+91 98201 44552',
    company: 'FinScale India',
    status: 'Qualified',
    bant: {
      score: 75,
      budget: '$499/mo (Growth tier)',
      authority: 'Head of Sales Operations',
      need: 'Bilingual Hindi/English speed-to-lead automation',
      timeline: 'Next 30 days',
    },
    lastCall: 'Today, 2:40 PM',
    transcriptSummary: 'Discussed Growth plan pricing and Hindi language accuracy. Very high purchase intent.',
  },
  {
    id: 'lead-3',
    name: 'Elena Rostova',
    email: 'elena@nexushealth.org',
    phone: '+1 (415) 889-1200',
    company: 'Nexus Health',
    status: 'Qualified',
    bant: {
      score: 90,
      budget: 'Approved ($10K+ annual)',
      authority: 'Chief Information Officer',
      need: 'HIPAA compliant patient intake qualification',
      timeline: 'Within 2 weeks',
    },
    lastCall: 'Yesterday, 4:10 PM',
    transcriptSummary: 'Verified HIPAA compliance and data isolation policies. Ready for contract negotiation.',
  },
  {
    id: 'lead-4',
    name: 'David Kim',
    email: 'david@apexlogistics.io',
    phone: '+1 (206) 774-9021',
    company: 'Apex Logistics',
    status: 'New',
    bant: {
      score: 40,
      budget: 'Under evaluation',
      authority: 'Product Manager',
      need: 'Exploring dispatch status voice bots',
      timeline: 'Q4 2026',
    },
    lastCall: '2 days ago',
    transcriptSummary: 'Initial discovery call. Nurture sequence scheduled.',
  },
];

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');
  const [selectedLead, setSelectedLead] = useState(null);

  const filteredLeads = mockLeads.filter(lead => {
    const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lead.company.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'All') return matchesSearch;
    if (filter === 'Hot') return matchesSearch && lead.bant.score >= 70;
    return matchesSearch && lead.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Leads & BANT CRM
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              {mockLeads.length} Total Prospects
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time qualification signals extracted by Alex during voice conversations.</p>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or company..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>

          <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
            {['All', 'Hot', 'Booked', 'New'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-6">Prospect Name</th>
              <th className="py-3.5 px-6">Company</th>
              <th className="py-3.5 px-6">BANT Score</th>
              <th className="py-3.5 px-6">Status</th>
              <th className="py-3.5 px-6">Last Contact</th>
              <th className="py-3.5 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filteredLeads.map((lead) => (
              <tr 
                key={lead.id} 
                onClick={() => setSelectedLead(lead)}
                className="hover:bg-slate-900/40 cursor-pointer transition group"
              >
                <td className="py-4 px-6 font-semibold text-white">
                  {lead.name}
                  <div className="text-[11px] text-slate-500 font-normal">{lead.email}</div>
                </td>
                <td className="py-4 px-6 text-slate-300 font-medium">
                  {lead.company}
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                    lead.bant.score >= 80 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : lead.bant.score >= 60 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {lead.bant.score}/100
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    lead.status === 'Booked' 
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                      : lead.status === 'Qualified'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {lead.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-slate-400">
                  {lead.lastCall}
                </td>
                <td className="py-4 px-6 text-right">
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition inline" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Lead Detail Drawer / Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-card w-full max-w-xl rounded-3xl p-6 border border-slate-800 shadow-2xl relative space-y-6">
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedLead.name}</h3>
                <p className="text-xs text-indigo-400 font-medium">{selectedLead.company} • {selectedLead.phone}</p>
              </div>
              <button 
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* BANT Metrics Grid */}
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400 tracking-wider mb-2 font-bold flex items-center justify-between">
                <span>BANT Qualification Breakdown</span>
                <span className="text-emerald-400 font-bold">{selectedLead.bant.score}/100</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Budget</span>
                  <span className="text-slate-200 font-medium mt-0.5 block">{selectedLead.bant.budget}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Authority</span>
                  <span className="text-slate-200 font-medium mt-0.5 block">{selectedLead.bant.authority}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Need</span>
                  <span className="text-slate-200 font-medium mt-0.5 block">{selectedLead.bant.need}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Timeline</span>
                  <span className="text-slate-200 font-medium mt-0.5 block">{selectedLead.bant.timeline}</span>
                </div>
              </div>
            </div>

            {/* AI Summary */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 space-y-1">
              <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Voice AI Call Summary
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedLead.transcriptSummary}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
