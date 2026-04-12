'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface POSConfig {
  id?: string;
  cashEnabled: boolean;
  digitalEnabled: boolean;
  upiEnabled: boolean;
  upiId?: string;
  selfOrderEnabled: boolean;
  selfOrderMode: 'ONLINE_ORDERING' | 'QR_MENU';
  bgImageUrl?: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<POSConfig>({
    cashEnabled: true, digitalEnabled: true, upiEnabled: false,
    selfOrderEnabled: false, selfOrderMode: 'ONLINE_ORDERING'
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/pos-config')
      .then(r => r.json())
      .then(c => {
        if (c) setConfig(c);
      });
  }, []);

  async function save() {
    setSaving(true);
    try {
      await fetch('/api/pos-config', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      toast.success('Configuration saved');
    } catch { toast.error('Failed to save settings'); }
    finally { setSaving(false); }
  }

  return (
    <div className="page-content py-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure hardware, payments & self-service</p>
        </div>
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Payment Methods */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-5 pb-3 border-b border-neutral-100">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-neutral-800">Payments</h2>
          </div>

          <div className="space-y-4">
            {[
              { key: 'cashEnabled', title: 'Cash Payments', desc: 'Settle via cash drawer' },
              { key: 'digitalEnabled', title: 'Digital / Card', desc: 'Credit, debit, SWIPE' },
              { key: 'upiEnabled', title: 'UPI / QR', desc: 'Scan to pay on receipt' }
            ].map(item => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-semibold text-neutral-800">{item.title}</div>
                  <div className="text-xs text-neutral-500 mt-0.5">{item.desc}</div>
                </div>
                <div className={`toggle-track ${(config as any)[item.key] ? 'on' : ''}`}>
                   <span className="toggle-thumb" />
                   <input type="checkbox" className="hidden"
                     checked={(config as any)[item.key]}
                     onChange={e => setConfig({ ...config, [item.key]: e.target.checked })} />
                </div>
              </label>
            ))}

            {config.upiEnabled && (
              <div className="pt-3 animate-slide-up">
                <label className="label">Merchant UPI ID</label>
                <input className="input font-mono text-sm" placeholder="merchant@upi"
                  value={config.upiId || ''} onChange={e => setConfig({ ...config, upiId: e.target.value })} />
                <p className="text-2xs text-neutral-400 mt-1.5">Required for printing UPI QR on receipts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Ordering */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-neutral-100">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                 <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                 </svg>
               </div>
               <h2 className="text-base font-bold text-neutral-800">Customer Display / Self-Ordering</h2>
             </div>
             <label className={`toggle-track ${config.selfOrderEnabled ? 'on' : ''} cursor-pointer`}>
               <span className="toggle-thumb" />
               <input type="checkbox" className="hidden"
                 checked={config.selfOrderEnabled} onChange={e => setConfig({ ...config, selfOrderEnabled: e.target.checked })} />
             </label>
          </div>

          {config.selfOrderEnabled ? (
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="label mb-2">Display Mode</label>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setConfig({ ...config, selfOrderMode: 'ONLINE_ORDERING' })}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${config.selfOrderMode === 'ONLINE_ORDERING' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <div className="text-lg mb-1">🛒</div>
                    <div className={`text-xs font-semibold ${config.selfOrderMode === 'ONLINE_ORDERING' ? 'text-primary-700' : 'text-neutral-600'}`}>Full Kiosk Menu</div>
                  </button>
                  <button onClick={() => setConfig({ ...config, selfOrderMode: 'QR_MENU' })}
                    className={`py-3 px-2 rounded-xl border text-center transition-all ${config.selfOrderMode === 'QR_MENU' ? 'border-primary-500 bg-primary-50' : 'border-neutral-200 hover:border-neutral-300'}`}>
                    <div className="text-lg mb-1">📖</div>
                    <div className={`text-xs font-semibold ${config.selfOrderMode === 'QR_MENU' ? 'text-primary-700' : 'text-neutral-600'}`}>View-only Menu</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Background Image URL</label>
                <input className="input" placeholder="https://..." value={config.bgImageUrl || ''}
                  onChange={e => setConfig({ ...config, bgImageUrl: e.target.value })} />
              </div>
              <button className="btn-secondary w-full" onClick={() => window.open('/customer-display', '_blank')}>
                Preview Customer Display
              </button>
            </div>
          ) : (
             <div className="py-8 flex flex-col items-center justify-center text-neutral-400">
                <svg className="w-10 h-10 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-sm">Self-service is currently disabled</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
