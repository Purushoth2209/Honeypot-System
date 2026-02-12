import React, { useState, useEffect } from 'react';

interface CriticalAlert {
  id: string;
  ip: string;
  attackType: string;
  ruleName: string;
  severity: string;
  timestamp: string;
}

interface CriticalAlertBannerProps {
  alert: CriticalAlert | null;
  onDismiss: () => void;
}

const CriticalAlertBanner: React.FC<CriticalAlertBannerProps> = ({ alert, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setIsVisible(true);
      // Auto-dismiss after 10 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Wait for animation to complete
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [alert, onDismiss]);

  if (!alert || !isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-500">
      <div className="bg-rose-900 border border-rose-500 rounded-xl p-4 shadow-2xl shadow-rose-500/20 max-w-md">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-rose-500 rounded-full flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <path d="M12 9v4"/>
              <path d="m12 17 .01 0"/>
            </svg>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-bold text-white">CRITICAL THREAT DETECTED</h4>
              <span className="text-xs text-rose-300 bg-rose-800 px-2 py-0.5 rounded-full font-medium">
                LIVE
              </span>
            </div>
            
            <div className="space-y-1 text-xs text-rose-100">
              <div className="flex items-center gap-2">
                <span className="text-rose-300">IP:</span>
                <span className="font-mono font-medium">{alert.ip}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-300">Attack:</span>
                <span className="font-medium">{alert.attackType.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-300">Rule:</span>
                <span className="font-medium truncate">{alert.ruleName}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(onDismiss, 300);
            }}
            className="flex-shrink-0 text-rose-300 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"/>
              <path d="m6 6 12 12"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CriticalAlertBanner;