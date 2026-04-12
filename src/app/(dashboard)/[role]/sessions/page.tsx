'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Session {
  id: string; openedAt: string; closedAt?: string; openingCash: number; closingCash?: number;
  user: { name: string; email: string };
  branch?: { name: string; type: string };
}

export default function SessionsPage() {
  const router = useRouter();
  const [sessions,      setSessions]      = useState<Session[]>([]);
  const [openingCash,   setOpeningCash]   = useState('0');
  const [loading,       setLoading]       = useState(false);
  const [activeSession, setActiveSession] = useState<Session | null>(null);

  async function load() {
    const res = await fetch('/api/sessions');
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setSessions(list);
    setActiveSession(list.find((s: Session) => !s.closedAt) || null);
  }
  useEffect(() => { load(); }, []);

  async function openSession() {
    setLoading(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openingCash }),
      });
      const session = await res.json();
      if (!res.ok) { toast.error(session.error || 'Failed to open session'); return; }
      toast.success('Session opened');
      setActiveSession(session);
      router.push('/pos/floor');
    } catch { toast.error('Failed to open session'); }
    finally { setLoading(false); }
  }

  async function closeSession() {
    if (!activeSession) return;
    const cash = prompt('Enter closing cash amount (₹):', '0');
    if (cash === null) return;
    await fetch(`/api/sessions/${activeSession.id}/close`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ closingCash: cash }),
    });
    toast.success('Session closed'); load();
  }

  const closedSessions = sessions.filter(s => s.closedAt);

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">POS Sessions</h1>
          <p className="page-subtitle">
            {activeSession
              ? 'A session is currently active'
              : 'No active session — open one to begin selling'}
          </p>
        </div>
        {activeSession && (
          <button className="btn-primary" onClick={() => router.push('/pos/floor')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Launch POS
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">
        {/* Left: Session Control */}
        <div className="card p-5">
          <h3 className="text-sm font-bold text-neutral-700 mb-4 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeSession ? 'bg-green-400' : 'bg-neutral-300'}`} />
            {activeSession ? 'Active Session' : 'Open New Session'}
          </h3>

          {activeSession ? (
            <div className="space-y-3">
              {/* Session Details */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 text-xs">Opened at</span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(activeSession.openedAt).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-green-100 pt-2">
                  <span className="text-neutral-500 text-xs">Opened by</span>
                  <span className="font-semibold text-neutral-800">{activeSession.user.name}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-green-100 pt-2">
                  <span className="text-neutral-500 text-xs">Opening cash</span>
                  <span className="font-bold text-neutral-800 font-mono">₹{activeSession.openingCash}</span>
                </div>
                {activeSession.branch && (
                  <div className="flex justify-between items-center text-sm border-t border-green-100 pt-2">
                    <span className="text-neutral-500 text-xs">Branch</span>
                    <span className="font-semibold text-neutral-800">{activeSession.branch.name}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className="btn-primary flex-1" onClick={() => router.push('/pos/floor')}>
                  Open POS Terminal
                </button>
                <button className="btn-danger" onClick={closeSession}>
                  Close Session
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Last session info */}
              {closedSessions[0] && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 mb-2">
                  <p className="text-xs font-semibold text-neutral-400 mb-1.5">Last Session</p>
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-500">Closed</span>
                    <span className="font-medium text-neutral-700">
                      {new Date(closedSessions[0].closedAt!).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-neutral-500">Closing cash</span>
                    <span className="font-semibold text-neutral-800 font-mono">₹{closedSessions[0].closingCash || 0}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="label">Opening Cash (₹)</label>
                <input className="input font-mono text-base font-semibold" type="number" min="0"
                       value={openingCash} onChange={e => setOpeningCash(e.target.value)} />
              </div>

              <button className="btn-primary w-full" onClick={openSession} disabled={loading}>
                {loading ? 'Opening session...' : 'Open Session & Launch POS'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Sessions History */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Session History ({sessions.length})
            </span>
          </div>
          <div className="overflow-y-auto max-h-64">
            {sessions.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-neutral-400">
                <p className="text-sm">No sessions recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {sessions.map(s => (
                  <div key={s.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-neutral-800">{s.user.name}</span>
                      <span className={`badge text-2xs ${s.closedAt ? 'badge-gray' : 'badge-green'}`}>
                        {s.closedAt ? 'Closed' : 'Active'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-neutral-400 mt-1">
                      <span>{new Date(s.openedAt).toLocaleString('en-IN')}</span>
                      {s.branch && <span className="font-medium text-primary-600">{s.branch.name}</span>}
                    </div>
                    {s.closedAt && (
                      <div className="flex gap-3 mt-1 text-xs">
                        <span className="text-neutral-400">Cash in: <span className="font-mono font-medium text-neutral-600">₹{s.openingCash}</span></span>
                        <span className="text-neutral-400">Cash out: <span className="font-mono font-medium text-neutral-600">₹{s.closingCash || 0}</span></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
