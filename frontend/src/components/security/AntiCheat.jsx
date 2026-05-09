import React, { useState, useEffect } from 'react';

const AntiCheat = ({ onViolation, enabled = true }) => {
  const [violations, setViolations] = useState([]);
  const [monitoring, setMonitoring] = useState(enabled);

  useEffect(() => {
    if (!monitoring) return;

    const detectors = {
      // Detect developer tools
      checkDevTools: () => {
        const widthThreshold = 160;
        const check = () => {
          if (window.outerWidth - window.innerWidth > widthThreshold || 
              window.outerHeight - window.innerHeight > widthThreshold) {
            return 'Developer tools detected';
          }
          return null;
        };
        return check();
      },

      // Detect copy/paste blocking
      checkCopyPaste: () => {
        let violation = null;
        const blockCopy = (e) => {
          if (e.ctrlKey && (e.key === 'c' || e.key === 'C' || e.key === 'x' || e.key === 'X')) {
            violation = 'Copy/paste attempt detected';
          }
        };
        
        document.addEventListener('keydown', blockCopy);
        return () => document.removeEventListener('keydown', blockCopy);
      },

      // Detect right-click context menu
      checkRightClick: () => {
        const blockRightClick = (e) => {
          if (e.button === 2) {
            e.preventDefault();
            return 'Right-click disabled';
          }
          return null;
        };

        document.addEventListener('contextmenu', blockRightClick);
        return () => document.removeEventListener('contextmenu', blockRightClick);
      },

      // Detect tab switching
      checkTabFocus: () => {
        const handleVisibilityChange = () => {
          if (document.hidden) {
            return 'Tab switched away from application';
          }
          return null;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
      },

      // Detect keyboard shortcuts for refresh
      checkRefreshShortcut: () => {
        const blockRefresh = (e) => {
          if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            return 'Page refresh attempt detected';
          }
          if (e.key === 'F5') {
            e.preventDefault();
            return 'Page refresh attempt detected';
          }
          return null;
        };

        document.addEventListener('keydown', blockRefresh);
        return () => document.removeEventListener('keydown', blockRefresh);
      }
    };

    // Start monitoring
    const interval = setInterval(() => {
      const newViolations = [];
      
      // Check dev tools
      const devToolsViolation = detectors.checkDevTools();
      if (devToolsViolation) {
        newViolations.push(devToolsViolation);
      }

      // Add other checks here...

      if (newViolations.length > 0) {
        setViolations(prev => [...prev, ...newViolations]);
        newViolations.forEach(violation => onViolation?.(violation));
      }
    }, 1000);

    // Setup event listeners
    const cleanupRightClick = detectors.checkRightClick();
    const cleanupCopyPaste = detectors.checkCopyPaste();
    const cleanupTabFocus = detectors.checkTabFocus();
    const cleanupRefresh = detectors.checkRefreshShortcut();

    return () => {
      clearInterval(interval);
      cleanupRightClick?.();
      cleanupCopyPaste?.();
      cleanupTabFocus?.();
      cleanupRefresh?.();
    };
  }, [monitoring, onViolation]);

  const toggleMonitoring = () => {
    setMonitoring(!monitoring);
  };

  const clearViolations = () => {
    setViolations([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Anti-Cheat Protection
        </h3>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={clearViolations}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
          >
            Clear Log
          </button>
          
          <button
            onClick={toggleMonitoring}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              monitoring 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {monitoring ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center space-x-2 mb-4">
        <div className={`w-3 h-3 rounded-full ${
          monitoring ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        }`}></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {monitoring ? 'Monitoring active' : 'Monitoring disabled'}
        </span>
      </div>

      {/* Violations Log */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          Security Events ({violations.length})
        </h4>
        
        {violations.length > 0 ? (
          <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
            {violations.map((violation, index) => (
              <div
                key={index}
                className="p-3 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
              >
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">{violation}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date().toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
            No security events detected
          </div>
        )}
      </div>

      {/* Protection Features */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Dev Tools Detection</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Copy/Paste Blocking</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Right-Click Protection</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Tab Switch Detection</span>
        </div>
      </div>
    </div>
  );
};

export default AntiCheat;