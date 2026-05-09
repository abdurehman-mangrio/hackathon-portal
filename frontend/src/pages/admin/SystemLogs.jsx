import React, { useState, useEffect, useRef } from 'react';
import { logService } from '../../services/logService';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    level: '',
    service: '',
    search: '',
    dateRange: '24h'
  });
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [logStats, setLogStats] = useState({
    totalCount: 0,
    errorCount: 0,
    warnCount: 0,
    infoCount: 0,
    debugCount: 0
  });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messagesPerSecond, setMessagesPerSecond] = useState(0);
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);
  const messageCountRef = useRef(0);
  const statsIntervalRef = useRef(null);

  useEffect(() => {
    fetchLogs();
    fetchLogStats();

    if (autoRefresh && !realTimeEnabled) {
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, realTimeEnabled]);

  useEffect(() => {
    filterLogs();
  }, [logs, filters]);

  useEffect(() => {
    scrollToBottom();
  }, [filteredLogs]);

  useEffect(() => {
    if (realTimeEnabled) {
      startRealTimeLogs();
    } else {
      stopRealTimeLogs();
    }

    return () => {
      stopRealTimeLogs();
    };
  }, [realTimeEnabled]);

  // Calculate messages per second
  useEffect(() => {
    if (realTimeEnabled) {
      statsIntervalRef.current = setInterval(() => {
        setMessagesPerSecond(messageCountRef.current);
        messageCountRef.current = 0;
      }, 1000);
    } else {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
      setMessagesPerSecond(0);
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [realTimeEnabled]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await logService.getLogs(filters);
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      addLocalLog('error', 'system-logs', `Failed to fetch logs: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogStats = async () => {
    try {
      const data = await logService.getLogStats();
      setLogStats(data);
    } catch (error) {
      console.error('Error fetching log stats:', error);
      // Set default stats if API fails
      setLogStats({
        totalCount: logs.length,
        errorCount: logs.filter(log => log.level === 'error').length,
        warnCount: logs.filter(log => log.level === 'warn').length,
        infoCount: logs.filter(log => log.level === 'info').length,
        debugCount: logs.filter(log => log.level === 'debug').length
      });
    }
  };

  const startRealTimeLogs = async () => {
    try {
      setConnectionStatus('connecting');
      
      const cleanup = await logService.getRealTimeLogs((log) => {
        messageCountRef.current++;
        setLogs(prev => [log, ...prev]);
      });

      wsRef.current = cleanup;
      setConnectionStatus('connected');
      addLocalLog('info', 'system-logs', 'Real-time log streaming started');
    } catch (error) {
      console.error('Error starting real-time logs:', error);
      setConnectionStatus('error');
      addLocalLog('error', 'system-logs', `Failed to start real-time logging: ${error.message}`);
    }
  };

  const stopRealTimeLogs = () => {
    if (wsRef.current) {
      wsRef.current();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
    addLocalLog('info', 'system-logs', 'Real-time log streaming stopped');
  };

  const addLocalLog = (level, service, message) => {
    const localLog = {
      id: Date.now() + Math.random(),
      level,
      service,
      message,
      timestamp: new Date().toISOString(),
      source: 'frontend'
    };
    setLogs(prev => [localLog, ...prev]);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (filters.level) {
      filtered = filtered.filter(log => log.level === filters.level);
    }

    if (filters.service) {
      filtered = filtered.filter(log => log.service === filters.service);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message?.toLowerCase().includes(searchTerm) ||
        log.service?.toLowerCase().includes(searchTerm) ||
        (log.user && log.user.toLowerCase().includes(searchTerm)) ||
        (log.source && log.source.toLowerCase().includes(searchTerm))
      );
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffTime = new Date();

      switch (filters.dateRange) {
        case '1h':
          cutoffTime.setHours(now.getHours() - 1);
          break;
        case '24h':
          cutoffTime.setDate(now.getDate() - 1);
          break;
        case '7d':
          cutoffTime.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffTime.setDate(now.getDate() - 30);
          break;
        default:
          cutoffTime = new Date(0);
      }

      filtered = filtered.filter(log => new Date(log.timestamp) >= cutoffTime);
    }

    setFilteredLogs(filtered);
  };

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        await logService.clearLogs();
        setLogs([]);
        setFilteredLogs([]);
        addLocalLog('info', 'system-logs', 'All logs cleared by user');
      } catch (error) {
        console.error('Error clearing logs:', error);
        addLocalLog('error', 'system-logs', `Failed to clear logs: ${error.message}`);
      }
    }
  };

  const exportLogs = async () => {
    try {
      const blob = await logService.exportLogs();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `system-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      addLocalLog('info', 'system-logs', 'Logs exported successfully');
    } catch (error) {
      console.error('Error exporting logs:', error);
      addLocalLog('error', 'system-logs', `Failed to export logs: ${error.message}`);
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'warn': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'debug': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getLogLevelIcon = (level) => {
    switch (level) {
      case 'error': return '❌';
      case 'warn': return '⚠️';
      case 'info': return 'ℹ️';
      case 'debug': return '🐛';
      default: return '📝';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const services = [...new Set(logs.map(log => log.service).filter(Boolean))];
  const levels = ['error', 'warn', 'info', 'debug'];

  if (loading && logs.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading system logs...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            System Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor system activity and debug issues
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={exportLogs}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Logs
          </button>
          <button
            onClick={clearLogs}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear Logs
          </button>
        </div>
      </div>

      {/* Log Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-500 mb-1">
            {logStats.errorCount || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Errors</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-500 mb-1">
            {logStats.warnCount || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Warnings</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-500 mb-1">
            {logStats.infoCount || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Info</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-500 mb-1">
            {logs.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Logs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Level
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level.toUpperCase()}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Service
            </label>
            <select
              value={filters.service}
              onChange={(e) => setFilters(prev => ({ ...prev, service: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">All Services</option>
              {services.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="1h">Last 1 hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search logs..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex items-end space-x-3">
            <button
              onClick={() => setFilters({ level: '', service: '', search: '', dateRange: '24h' })}
              className="flex-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh</span>
            </label>
          </div>
        </div>
      </div>

      {/* Logs Container */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        <div className="px-4 py-3 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
          <div className="text-sm font-medium text-gray-200">
            System Logs {filteredLogs.length > 0 && `(${filteredLogs.length} entries)`}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchLogs}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>

        <div className="h-96 overflow-y-auto font-mono text-sm">
          {filteredLogs.length > 0 ? (
            <div className="p-4 space-y-1">
              {filteredLogs.map((log, index) => (
                <div
                  key={log.id || index}
                  className="flex items-start space-x-3 hover:bg-gray-800 px-2 py-1 rounded"
                >
                  <div className="flex-shrink-0 w-20 text-gray-500 text-xs">
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                      {getLogLevelIcon(log.level)} {log.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-shrink-0 text-cyan-400 font-medium">
                    [{log.service}]
                  </div>
                  <div className="flex-1 text-gray-300">
                    {log.message}
                    {log.source === 'frontend' && (
                      <span className="text-gray-500 text-xs ml-2">(local)</span>
                    )}
                  </div>
                  {log.user && (
                    <div className="flex-shrink-0 text-purple-400">
                      user:{log.user}
                    </div>
                  )}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              {logs.length === 0 ? 'No logs available' : 'No logs found matching your filters'}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Log Monitor */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Real-time Log Monitor
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                WebSocket Connection
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect to receive real-time log updates
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={realTimeEnabled}
                onChange={(e) => setRealTimeEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}></div>
              <span className="text-gray-600 dark:text-gray-400">
                Status: {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Messages/sec: {messagesPerSecond}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">
                Buffer: {logs.length} logs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLogs;