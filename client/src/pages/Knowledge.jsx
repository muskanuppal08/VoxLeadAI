import React, { useState, useEffect } from 'react';
import { BookOpen, ShieldCheck, Tag, Cpu, Check, Layers } from 'lucide-react';

export default function Knowledge() {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5001/api/v1/knowledge')
      .then(res => res.json())
      .then(data => {
        if (data.documents) setDocs(data.documents);
      })
      .catch(() => {
        setDocs([
          {
            id: 'pricing',
            title: 'Pricing & Plans',
            category: 'pricing',
            content: 'Starter: $199/mo (1k mins). Growth: $499/mo (5k mins, English + Hindi). Enterprise: $1,299/mo (Unlimited + SOC-2/HIPAA).'
          },
          {
            id: 'security',
            title: 'Security & Compliance',
            category: 'security',
            content: 'SOC-2 Type II certified. HIPAA compliant on Enterprise. TLS 1.3 in transit and AES-256 encryption at rest.'
          }
        ]);
      });
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Company Knowledge Grounding Store
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
            Zero Hallucination
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Grounded documents dynamically retrieved by Alex using tool calling during live conversations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {docs.map(doc => (
          <div key={doc.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold">
                {doc.category}
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>

            <h3 className="text-sm font-bold text-white">{doc.title}</h3>
            <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800 font-mono">
              {doc.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
