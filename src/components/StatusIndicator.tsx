import { Wifi, WifiOff } from 'lucide-react';

interface StatusIndicatorProps {
  isConnected: boolean;
  error: string | null;
}

export function StatusIndicator({ isConnected, error }: StatusIndicatorProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            <div className="relative">
              <Wifi className="w-5 h-5 text-green-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            </div>
            <span className="text-sm font-medium text-green-700">Connected</span>
          </>
        ) : (
          <>
            <WifiOff className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-red-700">Disconnected</span>
          </>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </span>
      )}
    </div>
  );
}
