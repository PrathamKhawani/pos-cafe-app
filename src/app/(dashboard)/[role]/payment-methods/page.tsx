'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface POSConfig {
  id: string; 
  cashEnabled: boolean; 
  onlineEnabled: boolean;
  razorpayTerminalId?: string;
}

const PAYMENT_METHODS = [
  {
    key:  'cashEnabled' as const,
    icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z',
    label: 'Cash Payment',
    desc:  'Manual payments with cash in-hand',
  },
  {
    key:  'onlineEnabled' as const,
    icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    label: 'Online Payment (Razorpay)',
    desc:  'Automatic UPI, Cards & Netbanking via Razorpay gateway',
  },
];

export default function PaymentMethodsPage() {
  const [config, setConfig] = useState<POSConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/pos-config').then(r => r.json()).then(setConfig);
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/pos-config', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config) });
      toast.success('Payment settings saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  }

  if (!config) return (
    <div className="page-content py-5 flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-neutral-300 border-t-primary-500 rounded-full animate-spin mr-3" />
      <span className="text-sm text-neutral-500">Loading payment settings...</span>
    </div>
  );

  const toggle = (key: keyof POSConfig) =>
    setConfig(prev => ({ ...prev!, [key]: !prev![key as keyof POSConfig] }));

  const activeCount = PAYMENT_METHODS.filter(m => config[m.key]).length;

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Methods</h1>
          <p className="page-subtitle">{activeCount} of {PAYMENT_METHODS.length} methods enabled</p>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="max-w-xl space-y-3">
        {PAYMENT_METHODS.map(method => (
          <div key={method.key}
            className={`card p-4 flex items-center justify-between gap-4 cursor-pointer transition-all ${config[method.key] ? 'border-primary-300' : ''}`}
            style={config[method.key] ? { boxShadow: '0 0 0 1px rgba(124,92,62,0.2)', borderColor: '#C9A87D' } : {}}
            onClick={() => toggle(method.key)}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${config[method.key] ? 'bg-primary-100' : 'bg-neutral-100'}`}>
                <svg className="w-4.5 h-4.5" fill="none"
                     stroke={config[method.key] ? '#7C5C3E' : '#908A7F'}
                     strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={method.icon} />
                </svg>
              </div>
              <div>
                <div className={`text-sm font-semibold transition-colors ${config[method.key] ? 'text-neutral-800' : 'text-neutral-500'}`}>
                  {method.label}
                </div>
                <div className="text-xs text-neutral-400">{method.desc}</div>
              </div>
            </div>

            {/* Toggle */}
            <div className={`toggle-track flex-shrink-0 ${config[method.key] ? 'on' : ''}`}>
              <span className="toggle-thumb" />
            </div>
          </div>
        ))}

        {/* Hardware Integration */}
        <div className="card p-4 space-y-2.5 border-primary-300" style={{ borderColor: '#C9A87D' }}>
          <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
             </div>
             <label className="text-sm font-bold text-neutral-800">Hardware POS Terminal</label>
          </div>
          <p className="text-xs text-neutral-500 mb-2">Connect a physical card machine by entering your Razorpay Terminal ID.</p>
          <input 
            className="input font-mono" 
            placeholder="term_XXXXXXXXXXXXXX"
            value={config.razorpayTerminalId || ''}
            onChange={e => setConfig({ ...config, razorpayTerminalId: e.target.value })} 
          />
          <p className="text-[10px] text-neutral-400">
            Find this in your Razorpay Dashboard under **Settings &gt; Terminals**.
          </p>
        </div>

        {/* Info */}
        <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200 flex items-start gap-2">
          <svg className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-neutral-500">
            Changes apply immediately to all active POS sessions. At least one payment method must remain active.
          </p>
        </div>
      </div>
    </div>
  );
}
