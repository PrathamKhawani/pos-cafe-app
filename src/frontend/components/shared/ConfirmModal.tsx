'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen, title, message, onConfirm, onCancel,
  confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const styles = {
    danger:  { iconBg: '#FDECEA', iconColor: '#C0392B', btnBg: '#C0392B', btnText: '#fff', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    warning: { iconBg: '#FEF6E4', iconColor: '#D4870A', btnBg: '#D4870A', btnText: '#fff', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
    info:    { iconBg: '#EFF4FF', iconColor: '#2563EB', btnBg: '#2563EB', btnText: '#fff', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  };
  const s = styles[type];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
         style={{ background: 'rgba(28,20,12,0.55)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        {/* Icon + Title */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
               style={{ background: s.iconBg }}>
            <svg className="w-6 h-6" fill="none" stroke={s.iconColor} strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
            </svg>
          </div>
          <h3 className="text-base font-bold text-neutral-800 mb-1.5">{title}</h3>
          <p className="text-sm text-neutral-500 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onCancel}
            className="flex-1 py-2 px-4 rounded-lg border border-neutral-200 bg-white text-neutral-600 text-sm font-semibold hover:bg-neutral-50 transition-colors">
            {cancelText}
          </button>
          <button onClick={() => { onConfirm(); }}
            className="flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors"
            style={{ background: s.btnBg, color: s.btnText }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
