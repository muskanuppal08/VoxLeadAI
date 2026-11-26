import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mic, ShieldCheck, Sparkles, ArrowRight, Lock, Mail, Bot } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('muskan@voxlead.ai');
  const [password, setPassword] = useState('••••••••••••');

  const handleSubmit = (e) => {
    e.preventDefault();
    login({
      name: 'Muskan Uppal',
      email: email,
      role: 'Lead AI Evaluator',
      org: 'VoxLead AI Solutions',
    });
  };

  const handleQuickDemo = () => {
    login({
      name: 'Muskan Uppal',
      email: 'muskan@voxlead.ai',
      role: 'Lead AI Evaluator',
      org: 'VoxLead AI Solutions',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 relative z-10 shadow-2xl border border-slate-800/80">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-rose-500 shadow-xl shadow-fuchsia-500/30 mb-4 animate-float">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            VoxLeadAI
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30">
              Agent Arohi
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Autonomous AI Sales Voice Agent & BANT Qualification Engine</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-fuchsia-600/30 transition-all active:scale-95 mt-2"
          >
            Sign In to Console
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
          <span className="relative bg-slate-950 px-3 text-[11px] text-slate-500 uppercase tracking-wider">or instant evaluation</span>
        </div>

        {/* 1-Click Recruiter Demo Button */}
        <button
          onClick={handleQuickDemo}
          type="button"
          className="w-full py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-600/20 via-purple-600/20 to-rose-600/20 hover:from-fuchsia-600/30 hover:to-rose-600/30 text-fuchsia-200 border border-fuchsia-500/40 transition-all active:scale-95 shadow-md shadow-fuchsia-500/10"
        >
          <Sparkles className="w-4 h-4 text-fuchsia-400 animate-spin" style={{ animationDuration: '4s' }} />
          1-Click Recruiter Demo Access
        </button>

        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SOC-2 Type II & HIPAA Compliant Voice Pipeline</span>
        </div>
      </div>
    </div>
  );
}
