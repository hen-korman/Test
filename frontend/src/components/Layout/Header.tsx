import { Hash, Zap } from 'lucide-react';

interface HeaderProps {
  connectionStatus: 'connected' | 'mock' | 'error';
}

export function Header({ connectionStatus }: HeaderProps) {
  const statusConfig = {
    connected: { label: 'Live', color: 'bg-emerald-500' },
    mock: { label: 'Demo Mode', color: 'bg-amber-500' },
    error: { label: 'Disconnected', color: 'bg-red-500' },
  };

  const status = statusConfig[connectionStatus];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Hash className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              Slack Group Builder
            </h1>
            <p className="text-xs text-slate-500">
              Dynamic groups from HiBob criteria
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-sm">
            <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
            <span className="text-slate-600 font-medium">{status.label}</span>
          </div>
          <a
            href="https://apidocs.hibob.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-indigo-500 transition-colors"
          >
            <Zap className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
