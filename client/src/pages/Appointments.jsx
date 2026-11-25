import React, { useState, useEffect } from 'react';
import { Calendar, Video, Clock, CheckCircle2, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:5001/api/v1/appointments');
      const data = await res.json();
      if (data.success && data.appointments) {
        setAppointments(data.appointments);
      }
    } catch (err) {
      console.warn('Using default demo bookings fallback:', err);
      setAppointments([
        {
          id: 'demo-1',
          bookingId: 'DEMO-8492',
          prospectName: 'Sarah Connor (Cyberdyne)',
          prospectEmail: 'sarah@cyberdyne.com',
          date: 'Tomorrow',
          time: '03:00 PM IST',
          meetingLink: 'https://meet.google.com/vox-lead-demo',
          status: 'confirmed',
          bookedAt: 'Today, 3:15 PM',
        },
        {
          id: 'demo-2',
          bookingId: 'DEMO-5519',
          prospectName: 'Vikram Malhotra (FinScale)',
          prospectEmail: 'vikram@finscale.in',
          date: 'Nov 27, 2026',
          time: '11:00 AM IST',
          meetingLink: 'https://meet.google.com/fin-scale-vox',
          status: 'confirmed',
          bookedAt: 'Today, 2:40 PM',
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Booked Demos & Appointments
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {appointments.length} Confirmed
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">Autonomous demo scheduling executed by Alex using calendar tool calling.</p>
        </div>

        <button
          onClick={fetchAppointments}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs text-slate-300 font-medium flex items-center gap-1.5 border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Bookings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {appointments.map((appt) => (
          <div key={appt.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 hover:border-slate-700 transition">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                  {appt.bookingId || 'DEMO-CONFIRMED'}
                </span>
                <h3 className="text-sm font-bold text-white mt-2">{appt.prospectName}</h3>
                <p className="text-[11px] text-slate-400">{appt.prospectEmail}</p>
              </div>
              <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-semibold">{appt.date}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{appt.time}</span>
              </div>
            </div>

            <a
              href={appt.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              Join Google Meet Demo
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
