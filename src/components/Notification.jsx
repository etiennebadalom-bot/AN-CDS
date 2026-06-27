import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const icons = {
  success: <CheckCircle size={18} className="text-green-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  warning: <AlertCircle size={18} className="text-yellow-500" />,
  info: <Info size={18} className="text-blue-500" />,
};

const colors = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

export default function Notification() {
  const { notification } = useApp();
  if (!notification) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg fade-in max-w-sm ${colors[notification.type || 'success']}`}>
      {icons[notification.type || 'success']}
      <span className="text-sm font-medium">{notification.message}</span>
    </div>
  );
}
