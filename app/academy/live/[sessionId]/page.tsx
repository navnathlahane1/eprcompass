'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Video, Users, Clock, FileText, MessageSquare, LogOut,
  CheckCircle, XCircle, Plus, Send, Share2, Link, Save,
  AlertTriangle, Unlock, ChevronRight
} from 'lucide-react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'Present' | 'Absent' | 'Unknown';
}

interface QnA {
  id: string;
  question: string;
  askedBy: string;
  answeredBy: string;
  answer: string;
  time: string;
}

interface SharedFile {
  id: string;
  name: string;
  sharedAt: string;
  size: string;
}

const MOCK_ATTENDEES: Attendee[] = [];

const MOCK_QNA: QnA[] = [];

const MOCK_FILES: SharedFile[] = [];

const TABS = ['Attendance', 'Q&A Log', 'Resources', 'End Session'] as const;
type Tab = typeof TABS[number];

export default function SessionCockpitPage() {
  const params = useParams();
  const sessionId = params?.sessionId || 'S002';
  const [activeTab, setActiveTab] = useState<Tab>('Attendance');
  const [attendees, setAttendees] = useState<Attendee[]>(MOCK_ATTENDEES);
  const [qnaList, setQnaList] = useState<QnA[]>(MOCK_QNA);
  const [files, setFiles] = useState<SharedFile[]>(MOCK_FILES);
  const [recordingUrl, setRecordingUrl] = useState('');
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [surveySent, setSurveySent] = useState(false);
  const [moduleUnlocked, setModuleUnlocked] = useState(false);
  const [showQnaForm, setShowQnaForm] = useState(false);
  const [newQ, setNewQ] = useState({ question: '', askedBy: '', answeredBy: '', answer: '' });

  const toggleAttendance = (id: string) => {
    setAttendees(prev => prev.map(a => a.id === id ? { ...a, status: a.status === 'Present' ? 'Absent' : 'Present' } : a));
  };

  const presentCount = attendees.filter(a => a.status === 'Present').length;
  const absentList = attendees.filter(a => a.status !== 'Present');

  const addQna = () => {
    if (!newQ.question.trim()) return;
    setQnaList(prev => [...prev, {
      id: `Q${prev.length + 1}`,
      ...newQ,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }]);
    setNewQ({ question: '', askedBy: '', answeredBy: '', answer: '' });
    setShowQnaForm(false);
  };

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Session Header */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-wide">LIVE</span>
              <span className="text-slate-500 text-xs font-mono">{sessionId}</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-1">EPR-T1-MAY26-B7 · EPR Essentials</h1>
            <div className="flex gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Trainer: <span className="text-slate-300">Rahul Verma</span></span>
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> 02:00 PM – 03:30 PM</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-emerald-400" /> <span className="text-emerald-400">{presentCount}</span>/{attendees.length} present</span>
            </div>
          </div>
          <a
            href="https://zoom.us/j/98765000002"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Video className="w-4 h-4" /> Open Zoom
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0c1022] border border-slate-800/80 rounded-xl p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Attendance Tab */}
      {activeTab === 'Attendance' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-200 font-semibold">Attendance</h2>
            <div className="flex gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">{presentCount} Present</span>
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/10 border border-red-500/30 text-red-400">{attendees.length - presentCount} Absent</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attendees.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
            )}
            {attendees.map(a => (
              <div key={a.id} className={`bg-[#0c1022] border rounded-xl p-4 flex items-center gap-3 ${a.status === 'Present' ? 'border-emerald-500/30' : 'border-red-500/20'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${a.status === 'Present' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {a.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-xs font-medium truncate">{a.name}</p>
                </div>
                <button
                  onClick={() => toggleAttendance(a.id)}
                  className={`rounded-lg p-1.5 transition-colors ${a.status === 'Present' ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-red-400 hover:bg-red-500/10'}`}
                >
                  {a.status === 'Present' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Q&A Log Tab */}
      {activeTab === 'Q&A Log' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-200 font-semibold">Q&A Log</h2>
            <button
              onClick={() => setShowQnaForm(!showQnaForm)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Log Question
            </button>
          </div>

          {showQnaForm && (
            <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 mb-4 space-y-3">
              <input placeholder="Question" value={newQ.question} onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))} className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Asked by" value={newQ.askedBy} onChange={e => setNewQ(p => ({ ...p, askedBy: e.target.value }))} className="bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
                <input placeholder="Answered by" value={newQ.answeredBy} onChange={e => setNewQ(p => ({ ...p, answeredBy: e.target.value }))} className="bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
              <textarea placeholder="Answer / response" value={newQ.answer} onChange={e => setNewQ(p => ({ ...p, answer: e.target.value }))} rows={2} className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowQnaForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
                <button onClick={addQna} className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  <Send className="w-3 h-3" /> Save
                </button>
              </div>
            </div>
          )}

          <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Question</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Asked By</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3 hidden md:table-cell">Answer</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wide px-4 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {qnaList.length === 0 ? (
                  <tr><td colSpan={4} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
                ) : qnaList.map((q, i) => (
                  <tr key={q.id} className={`border-b border-slate-800/50 hover:bg-slate-800/20 ${i === qnaList.length - 1 ? 'border-0' : ''}`}>
                    <td className="px-4 py-3 text-slate-300 text-sm max-w-[200px]">{q.question}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="text-slate-300 text-xs">{q.askedBy}</div>
                      <div className="text-slate-500 text-xs">→ {q.answeredBy}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-[250px]">{q.answer}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{q.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'Resources' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-200 font-semibold">Files Shared in Session</h2>
            <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Share2 className="w-4 h-4" /> Share File
            </button>
          </div>
          <div className="space-y-3">
            {files.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
            )}
            {files.map(f => (
              <div key={f.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-200 text-sm font-medium">{f.name}</p>
                  <p className="text-slate-500 text-xs">Shared at {f.sharedAt} · {f.size}</p>
                </div>
                <button className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs border border-indigo-500/30 rounded-lg px-3 py-1.5 hover:bg-indigo-500/10 transition-colors">
                  <Link className="w-3 h-3" /> Copy Link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* End Session Tab */}
      {activeTab === 'End Session' && (
        <div className="space-y-5">
          <h2 className="text-slate-200 font-semibold">Session Summary & End Actions</h2>

          {/* Summary */}
          <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{presentCount}</div>
              <div className="text-slate-500 text-xs mt-1">Present</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-400">{attendees.length - presentCount}</div>
              <div className="text-slate-500 text-xs mt-1">Absent</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400">{qnaList.length}</div>
              <div className="text-slate-500 text-xs mt-1">Questions Logged</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-400">{files.length}</div>
              <div className="text-slate-500 text-xs mt-1">Files Shared</div>
            </div>
          </div>

          {/* Missing Learners */}
          <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
            <h3 className="text-slate-300 font-medium text-sm mb-3">Missing Learners ({absentList.length})</h3>
            <div className="flex flex-wrap gap-2">
              {absentList.map(a => (
                <span key={a.id} className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 border border-red-500/20 text-red-300">
                  {a.name}
                </span>
              ))}
            </div>
          </div>

          {/* Recording URL */}
          <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <Video className="w-4 h-4 text-slate-400" />
              <h3 className="text-slate-300 font-medium text-sm">Paste Recording URL</h3>
            </div>
            <p className="text-slate-500 text-xs mb-3 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              Recording link auto-expires in 30 days. Save promptly.
            </p>
            <div className="flex gap-3">
              <input
                type="url"
                placeholder="https://zoom.us/rec/..."
                value={recordingUrl}
                onChange={e => setRecordingUrl(e.target.value)}
                className="flex-1 bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => setRecordingSaved(true)}
                disabled={!recordingUrl || recordingSaved}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${recordingSaved ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'}`}
              >
                <Save className="w-4 h-4" /> {recordingSaved ? 'Saved ✓' : 'Save Recording'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSurveySent(true)}
              disabled={surveySent}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-medium transition-colors ${surveySent ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-violet-600/20 border-violet-500/30 text-violet-400 hover:bg-violet-600/30'}`}
            >
              <MessageSquare className="w-4 h-4" />
              {surveySent ? 'Survey Triggered ✓' : 'Trigger Feedback Survey'}
            </button>
            <button
              onClick={() => setModuleUnlocked(true)}
              disabled={moduleUnlocked}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border text-sm font-medium transition-colors ${moduleUnlocked ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30'}`}
            >
              <Unlock className="w-4 h-4" />
              {moduleUnlocked ? 'Next Module Unlocked ✓' : 'Unlock Next Module'}
            </button>
            <button className="flex items-center justify-center gap-2 p-4 rounded-xl border border-red-500/30 text-red-400 bg-red-500/10 hover:bg-red-500/20 text-sm font-medium transition-colors">
              <LogOut className="w-4 h-4" /> End & Close Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
