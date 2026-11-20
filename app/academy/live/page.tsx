'use client';

import { useState } from 'react';
import {
  Video, Users, Clock, AlertTriangle, Bell,
  MessageSquare, ChevronRight, Calendar, Wifi, WifiOff, CheckCircle
} from 'lucide-react';

type SessionStatus = 'Live' | 'Not Started' | 'Ended';

interface LiveSession {
  id: string;
  batch: string;
  trainer: string;
  time: string;
  expectedAttendees: number;
  status: SessionStatus;
  zoomLink: string;
  trainerJoined: boolean;
  program: string;
}

const TODAY_SESSIONS: LiveSession[] = [];

const UPCOMING_SESSIONS: { id: string; batch: string; trainer: string; date: string; time: string; program: string; attendees: number }[] = [];

const STATUS_CONFIG: Record<SessionStatus, { color: string; bg: string; dot: string; label: string }> = {
  'Live': { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', dot: 'bg-emerald-400', label: 'LIVE' },
  'Not Started': { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30', dot: 'bg-amber-400', label: 'Not Started' },
  'Ended': { color: 'text-slate-400', bg: 'bg-slate-700/50 border-slate-600/30', dot: 'bg-slate-500', label: 'Ended' },
};

export default function LiveSessionsPage() {
  const [alertSent, setAlertSent] = useState<Set<string>>(new Set());
  const [whatsappSent, setWhatsappSent] = useState<Set<string>>(new Set());

  const sendAlert = (id: string) => setAlertSent(prev => new Set([...prev, id]));
  const sendWhatsapp = (id: string) => setWhatsappSent(prev => new Set([...prev, id]));

  const liveCount = TODAY_SESSIONS.filter(s => s.status === 'Live').length;
  const totalAttendees = TODAY_SESSIONS.filter(s => s.status === 'Live').reduce((a, s) => a + s.expectedAttendees, 0);

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-bold text-white">Live Sessions Control Room</h1>
          </div>
          <p className="text-slate-400 text-sm mt-1">Friday, 30 May 2026 · 04:12 PM IST · EPR Compass</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-[#0c1022] border border-slate-800/80 rounded-lg px-4 py-2 text-sm">
            <span className="text-emerald-400 font-bold">{liveCount}</span>
            <span className="text-slate-400"> sessions live</span>
          </div>
          <div className="bg-[#0c1022] border border-slate-800/80 rounded-lg px-4 py-2 text-sm">
            <span className="text-indigo-400 font-bold">{totalAttendees}</span>
            <span className="text-slate-400"> expected live</span>
          </div>
        </div>
      </div>

      {/* Warning Banner — trainer not joined */}
      {TODAY_SESSIONS.filter(s => s.status === 'Not Started' && !s.trainerJoined).map(s => (
        <div key={s.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div>
              <span className="text-amber-300 font-medium text-sm">Trainer Alert: </span>
              <span className="text-amber-200 text-sm">{s.trainer} has not joined session {s.batch} scheduled at {s.time}.</span>
            </div>
          </div>
          <button
            onClick={() => sendAlert(s.id)}
            disabled={alertSent.has(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${alertSent.has(s.id) ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-amber-500 hover:bg-amber-600 text-black'}`}
          >
            <Bell className="w-4 h-4" />
            {alertSent.has(s.id) ? 'Alert Sent' : 'Alert Director'}
          </button>
        </div>
      ))}

      {/* Today's Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Today&apos;s Sessions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TODAY_SESSIONS.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">No sessions scheduled for today.</div>
          )}
          {TODAY_SESSIONS.map(session => {
            const cfg = STATUS_CONFIG[session.status];
            return (
              <div key={session.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors">
                {/* Status & Batch */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-indigo-400 font-mono text-xs font-bold">{session.id} · {session.batch}</span>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${session.status === 'Live' ? 'animate-pulse' : ''}`} />
                    {cfg.label}
                  </div>
                </div>

                {/* Details */}
                <h3 className="text-slate-100 font-semibold text-sm mb-1">{session.program}</h3>
                <div className="space-y-1 text-xs text-slate-400 mb-4">
                  <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Trainer: <span className="text-slate-300">{session.trainer}</span></div>
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {session.time}</div>
                  <div className="flex items-center gap-2">
                    {session.trainerJoined ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-red-400" />}
                    <span className={session.trainerJoined ? 'text-emerald-400' : 'text-red-400'}>
                      Trainer {session.trainerJoined ? 'joined' : 'not joined'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2"><Users className="w-3.5 h-3.5" /> {session.expectedAttendees} expected attendees</div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 flex-wrap">
                  <a
                    href={session.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Video className="w-3 h-3" /> Open Zoom
                  </a>
                  <button
                    onClick={() => sendWhatsapp(session.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${whatsappSent.has(session.id) ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                  >
                    <MessageSquare className="w-3 h-3" /> {whatsappSent.has(session.id) ? 'Posted ✓' : 'Post to WhatsApp'}
                  </button>
                  <a href={`/academy/live/${session.id}`} className="flex items-center gap-1 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                    Session Cockpit <ChevronRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-3">Upcoming — Next 3 Days</h2>
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Batch</th>
                <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Program</th>
                <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Trainer</th>
                <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Date & Time</th>
                <th className="text-right text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Attendees</th>
              </tr>
            </thead>
            <tbody>
              {UPCOMING_SESSIONS.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              ) : UPCOMING_SESSIONS.map((s, i) => (
                <tr key={s.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors ${i === UPCOMING_SESSIONS.length - 1 ? 'border-0' : ''}`}>
                  <td className="px-4 py-3 text-indigo-400 font-mono text-xs font-medium">{s.batch}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{s.program}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{s.trainer}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{s.date} · {s.time}</td>
                  <td className="px-4 py-3 text-right text-slate-400 text-sm">{s.attendees}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

