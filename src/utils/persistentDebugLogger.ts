/**
 * Persistent Debug Logger
 * Stores logs in localStorage so they survive logout, page refresh, and console clearing
 * Logs are timestamped and tagged by category
 */

const DEBUG_LOG_KEY = 'HMS_DEBUG_LOGS';
const MAX_LOGS = 500; // Keep last 500 logs
const DEBUG_ENABLED = true;

interface DebugLog {
  timestamp: number;
  time: string;
  category: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

/**
 * Get all stored logs from localStorage
 */
export const getStoredLogs = (): DebugLog[] => {
  try {
    const logsStr = localStorage.getItem(DEBUG_LOG_KEY);
    if (!logsStr) return [];
    return JSON.parse(logsStr);
  } catch (error) {
    console.error('Failed to retrieve debug logs:', error);
    return [];
  }
};

/**
 * Add a log entry (persisted to localStorage)
 */
export const addDebugLog = (
  category: string,
  message: string,
  level: 'info' | 'warn' | 'error' | 'debug' = 'info',
  data?: any
): void => {
  if (!DEBUG_ENABLED) return;

  try {
    const logs = getStoredLogs();
    const now = Date.now();
    
    const logEntry: DebugLog = {
      timestamp: now,
      time: new Date(now).toLocaleTimeString(),
      category,
      level,
      message,
      data: data ? JSON.stringify(data) : undefined
    };

    logs.push(logEntry);

    // Keep only last MAX_LOGS entries
    if (logs.length > MAX_LOGS) {
      logs.splice(0, logs.length - MAX_LOGS);
    }

    localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(logs));

    // Also log to console
    const prefix = `[${logEntry.time}] [${category}]`;
    if (level === 'error') {
      console.error(prefix, message, data);
    } else if (level === 'warn') {
      console.warn(prefix, message, data);
    } else if (level === 'debug') {
      console.debug(prefix, message, data);
    } else {
      console.log(prefix, message, data);
    }
  } catch (error) {
    console.error('Failed to add debug log:', error);
  }
};

/**
 * Clear all stored logs
 */
export const clearDebugLogs = (): void => {
  try {
    localStorage.removeItem(DEBUG_LOG_KEY);
    console.log('✅ Debug logs cleared');
  } catch (error) {
    console.error('Failed to clear debug logs:', error);
  }
};

/**
 * Export logs as string for copying/pasting
 */
export const exportDebugLogs = (): string => {
  try {
    const logs = getStoredLogs();
    let output = '═══════════════════════════════════════════════════════════════\n';
    output += 'HMS DEBUG LOGS EXPORT\n';
    output += `Exported at: ${new Date().toLocaleString()}\n`;
    output += `Total Logs: ${logs.length}\n`;
    output += '═══════════════════════════════════════════════════════════════\n\n';

    logs.forEach((log, index) => {
      output += `[${log.time}] [${log.level.toUpperCase()}] [${log.category}]\n`;
      output += `   ${log.message}\n`;
      if (log.data) {
        output += `   Data: ${log.data}\n`;
      }
      output += '\n';
    });

    return output;
  } catch (error) {
    console.error('Failed to export debug logs:', error);
    return '';
  }
};

/**
 * Print all logs to console (for visibility)
 */
export const printDebugLogs = (): void => {
  try {
    const logs = getStoredLogs();
    console.log('\n\n╔════════════════════════════════════════════════════════════════╗');
    console.log('║           HMS DEBUG LOGS - PERSISTENT STORAGE                  ║');
    console.log(`║ Total Logs: ${logs.length.toString().padEnd(55)}║`);
    console.log(`║ Timestamp: ${new Date().toLocaleString().padEnd(55)}║`);
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    logs.forEach((log, index) => {
      const prefix = `[Log #${(index + 1).toString().padStart(3, '0')}]`;
      const timeStr = `[${log.time}]`;
      const levelStr = `[${log.level.toUpperCase()}]`;
      const categoryStr = `[${log.category}]`;
      
      console.log(`${prefix} ${timeStr} ${levelStr} ${categoryStr}`);
      console.log(`    → ${log.message}`);
      
      if (log.data) {
        try {
          const parsed = JSON.parse(log.data);
          console.log(`    → Data:`, parsed);
        } catch {
          console.log(`    → Data: ${log.data}`);
        }
      }
    });

    console.log('\n');
  } catch (error) {
    console.error('Failed to print debug logs:', error);
  }
};

/**
 * Log token refresh events
 */
export const logTokenRefreshEvent = (event: string, details?: any): void => {
  addDebugLog('TOKEN_REFRESH', event, 'info', details);
};

/**
 * Log timer events
 */
export const logTimerEvent = (event: string, details?: any): void => {
  addDebugLog('TIMER', event, 'info', details);
};

/**
 * Log API calls
 */
export const logApiCall = (endpoint: string, method: string, status?: number, error?: any): void => {
  const msg = `${method} ${endpoint} ${status ? `(${status})` : ''}`;
  const level = error ? 'error' : 'info';
  addDebugLog('API', msg, level, error);
};

/**
 * Log authentication events
 */
export const logAuthEvent = (event: string, details?: any): void => {
  addDebugLog('AUTH', event, 'info', details);
};

/**
 * Log inactivity events
 */
export const logInactivityEvent = (event: string, details?: any): void => {
  addDebugLog('INACTIVITY', event, 'warn', details);
};

/**
 * Log logout events
 */
export const logLogoutEvent = (reason: string, details?: any): void => {
  addDebugLog('LOGOUT', reason, 'warn', details);
};

/**
 * Log error events
 */
export const logErrorEvent = (category: string, error: Error | string, details?: any): void => {
  const message = error instanceof Error ? error.message : error;
  addDebugLog(category, message, 'error', details);
};

/**
 * Log storage operations
 */
export const logStorageEvent = (operation: string, key: string, value?: any): void => {
  const details = value ? { key, value: String(value).substring(0, 50) + '...' } : { key };
  addDebugLog('STORAGE', operation, 'debug', details);
};

export default {
  addDebugLog,
  getStoredLogs,
  clearDebugLogs,
  exportDebugLogs,
  printDebugLogs,
  logTokenRefreshEvent,
  logTimerEvent,
  logApiCall,
  logAuthEvent,
  logInactivityEvent,
  logLogoutEvent,
  logErrorEvent,
  logStorageEvent
};
