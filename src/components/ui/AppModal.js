import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

const toneMap = {
  success: {
    icon: CheckCircle2,
    ring: "border-green-400/30 bg-green-500/10 text-green-100",
    button: "bg-green-400 text-gray-950 hover:bg-green-300",
  },
  error: {
    icon: XCircle,
    ring: "border-red-400/30 bg-red-500/10 text-red-100",
    button: "bg-red-500 text-white hover:bg-red-400",
  },
  warning: {
    icon: AlertTriangle,
    ring: "border-yellow-300/30 bg-yellow-300/10 text-yellow-100",
    button: "bg-yellow-400 text-gray-950 hover:bg-yellow-300",
  },
  info: {
    icon: Info,
    ring: "border-white/10 bg-white/5 text-gray-100",
    button: "bg-yellow-400 text-gray-950 hover:bg-yellow-300",
  },
};

function ModalShell({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-3 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-md rounded-lg border border-white/10 bg-gray-950 p-4 text-white shadow-2xl shadow-black/50 sm:p-6">
        {children}
      </div>
      <button className="sr-only" onClick={onClose}>Close</button>
    </div>
  );
}

export function AlertModal({ open, title, message, tone = "info", confirmText = "OK", onClose }) {
  if (!open) return null;

  const theme = toneMap[tone] || toneMap.info;
  const Icon = theme.icon;

  return (
    <ModalShell onClose={onClose}>
      <div className={`flex items-start gap-3 rounded-md border p-3 ${theme.ring}`}>
        <Icon className="mt-0.5 flex-none" size={22} />
        <div className="min-w-0">
          <h2 className="safe-text text-lg font-bold">{title}</h2>
          {message && <p className="safe-text mt-2 whitespace-pre-line text-sm opacity-90">{message}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className={`w-full rounded-md px-4 py-2 font-semibold sm:w-auto ${theme.button}`}
        >
          {confirmText}
        </button>
      </div>
    </ModalShell>
  );
}

export function ConfirmModal({
  open,
  title,
  message,
  tone = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const theme = toneMap[tone] || toneMap.warning;
  const Icon = theme.icon;

  return (
    <ModalShell onClose={onCancel}>
      <div className={`flex items-start gap-3 rounded-md border p-3 ${theme.ring}`}>
        <Icon className="mt-0.5 flex-none" size={22} />
        <div className="min-w-0">
          <h2 className="safe-text text-lg font-bold">{title}</h2>
          {message && <p className="safe-text mt-2 whitespace-pre-line text-sm opacity-90">{message}</p>}
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/15"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-md px-4 py-2 font-semibold ${theme.button}`}
        >
          {confirmText}
        </button>
      </div>
    </ModalShell>
  );
}
