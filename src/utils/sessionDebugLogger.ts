/**
 * SESSION DEBUG LOGGER
 * Captures comprehensive login/logout flow logs
 * Provides downloadable log file on logout
 */

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG';
  step: string;
  message: string;
  details?: any;
}

class SessionDebugLogger {
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 10000;
  private startTime: number = Date.now();

  /**
   * Add a log entry
   */
  addLog(step: string, level: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'DEBUG', message: string, details?: any): void {
    const now = new Date();
    const timestamp = now.toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(3);

    const entry: LogEntry = {
      timestamp,
      level,
      step,
      message,
      details
    };

    this.logs.push(entry);

    // Prevent memory bloat
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-5000);
    }

    // Also log to console with color
    const prefix = `[${elapsed}s] [${level}] ${step}:`;
    const style = this.getConsoleStyle(level);
    console.log(`%c${prefix}`, style, message, details ? details : '');

    // Store to localStorage for persistence
    this.persistLogs();
  }

  /**
   * Log step: User clicked login
   */
  logLoginAttempt(username: string): void {
    this.addLog('LOGIN_ATTEMPT', 'INFO', `User attempting to login with username: ${username}`, {
      username,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }

  /**
   * Log step: API request sent
   */
  logApiRequest(endpoint: string, method: string, body?: any): void {
    this.addLog('API_REQUEST', 'DEBUG', `${method} ${endpoint}`, {
      endpoint,
      method,
      bodyKeys: body ? Object.keys(body) : []
    });
  }

  /**
   * Log step: API response received
   */
  logApiResponse(endpoint: string, status: number, responseKeys?: string[]): void {
    const level = status >= 200 && status < 300 ? 'SUCCESS' : 'ERROR';
    this.addLog('API_RESPONSE', level, `${status} from ${endpoint}`, {
      endpoint,
      status,
      responseKeys
    });
  }

  /**
   * Log step: Token saved
   */
  logTokenSaved(tokenType: 'ACCESS' | 'REFRESH' | 'BOTH', location: 'MEMORY' | 'SESSIONSTORAGE' | 'BOTH', expiresAt?: string): void {
    this.addLog('TOKEN_SAVED', 'SUCCESS', `${tokenType} token saved to ${location}`, {
      tokenType,
      location,
      expiresAt,
      sessionStorageKeys: Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i))
    });
  }

  /**
   * Log step: User data saved
   */
  logUserDataSaved(userData: any): void {
    this.addLog('USER_DATA_SAVED', 'SUCCESS', `User data saved for ${userData.username}`, {
      username: userData.username,
      userId: userData.userId,
      localStorageKeys: Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i))
    });
  }

  /**
   * Log step: Session initialized
   */
  logSessionInitialized(access: any[], selectedAccess?: any): void {
    this.addLog('SESSION_INITIALIZED', 'SUCCESS', `Session initialized with ${access.length} access configurations`, {
      accessCount: access.length,
      accessConfigs: access.map((a: any) => ({
        enterpriseId: a.enterpriseId,
        clinicId: a.clinicId,
        roleIds: a.roleIds
      })),
      selectedAccess,
      timers: {
        refreshTimer: 'STARTED',
        inactivityTimer: 'STARTED',
        heartbeat: 'STARTED'
      }
    });
  }

  /**
   * Log step: Token refresh
   */
  logTokenRefresh(success: boolean, reason?: string): void {
    this.addLog('TOKEN_REFRESH', success ? 'SUCCESS' : 'ERROR', `Token refresh ${success ? 'succeeded' : 'failed'}${reason ? `: ${reason}` : ''}`, {
      success,
      reason,
      newTokenExpiry: success ? sessionStorage.getItem('accessTokenExpiry') : 'N/A'
    });
  }

  /**
   * Log step: Session expired
   */
  logSessionExpired(reason: string): void {
    this.addLog('SESSION_EXPIRED', 'WARNING', `Session expired: ${reason}`, {
      reason,
      lastActivity: sessionStorage.getItem('lastActivity'),
      tokenExpiry: sessionStorage.getItem('accessTokenExpiry'),
      timeNow: new Date().toISOString()
    });
  }

  /**
   * Log step: User logout
   */
  logLogout(reason: string = 'User initiated'): void {
    this.addLog('LOGOUT', 'INFO', `User logging out: ${reason}`, {
      reason,
      sessionDuration: ((Date.now() - this.startTime) / 1000 / 60).toFixed(2) + ' minutes',
      totalLogs: this.logs.length
    });
  }

  /**
   * Log step: Error occurred
   */
  logError(step: string, error: any): void {
    this.addLog(step, 'ERROR', error.message || String(error), {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get console style based on level
   */
  private getConsoleStyle(level: string): string {
    const styles: { [key: string]: string } = {
      'INFO': 'color: #0066cc; font-weight: bold;',
      'SUCCESS': 'color: #00cc00; font-weight: bold;',
      'WARNING': 'color: #ff9900; font-weight: bold;',
      'ERROR': 'color: #cc0000; font-weight: bold;',
      'DEBUG': 'color: #666666; font-weight: normal;'
    };
    return styles[level] || 'color: #666666;';
  }

  /**
   * Persist logs to localStorage
   */
  private persistLogs(): void {
    try {
      localStorage.setItem('SESSION_DEBUG_LOGS', JSON.stringify(this.logs));
      localStorage.setItem('SESSION_DEBUG_LOGS_TIMESTAMP', new Date().toISOString());
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return this.logs;
  }

  /**
   * Format logs as text for download
   */
  getLogsAsText(): string {
    const header = `
╔════════════════════════════════════════════════════════════════════════════════╗
║                     DENTAESTHETICS HMS - SESSION DEBUG LOG                     ║
║                     Generated: ${new Date().toISOString()}                      ║
╚════════════════════════════════════════════════════════════════════════════════╝

BROWSER & ENVIRONMENT INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  User Agent: ${navigator.userAgent}
  URL: ${window.location.href}
  Session Duration: ${((Date.now() - this.startTime) / 1000 / 60).toFixed(2)} minutes
  Total Log Entries: ${this.logs.length}
  LocalStorage Size: ${localStorage.length} items
  SessionStorage Size: ${sessionStorage.length} items

DETAILED LOG ENTRIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    const logsText = this.logs.map((log, index) => {
      const levelEmoji = {
        'INFO': 'ℹ️',
        'SUCCESS': '✅',
        'WARNING': '⚠️',
        'ERROR': '❌',
        'DEBUG': '🔍'
      }[log.level];

      let entry = `\n[${index + 1}] ${levelEmoji} [${log.level}] [${log.timestamp}] ${log.step}
    Message: ${log.message}`;

      if (log.details) {
        entry += `\n    Details:`;
        if (typeof log.details === 'object') {
          Object.entries(log.details).forEach(([key, value]) => {
            const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            entry += `\n      ${key}: ${displayValue}`;
          });
        } else {
          entry += `\n      ${log.details}`;
        }
      }

      return entry;
    }).join('\n');

    const footer = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL STATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AccessToken in SessionStorage: ${sessionStorage.getItem('accessToken_session') ? '✅ PRESENT' : '❌ MISSING'}
RefreshToken in SessionStorage: ${sessionStorage.getItem('refreshToken_session') ? '✅ PRESENT' : '❌ MISSING'}
User Data in LocalStorage: ${localStorage.getItem('userData') ? '✅ PRESENT' : '❌ MISSING'}
Selected Access in LocalStorage: ${localStorage.getItem('selectedAccess') ? '✅ PRESENT' : '❌ MISSING'}

LocalStorage Keys: ${Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).join(', ')}
SessionStorage Keys: ${Array.from({ length: sessionStorage.length }, (_, i) => sessionStorage.key(i)).join(', ')}

═════════════════════════════════════════════════════════════════════════════════`;

    return header + logsText + footer;
  }

  /**
   * Download logs as a text file - with proper timing to ensure browser receives it
   */
  downloadLogs(): Promise<void> {
    return new Promise((resolve) => {
      try {
        console.log('🔍 SESSION DEBUG LOGGER - Preparing to download logs...');
        console.log(`📊 Total log entries: ${this.logs.length}`);
        
        const logsText = this.getLogsAsText();
        console.log(`📝 Generated log text: ${logsText.length} characters`);
        
        const element = document.createElement('a');
        element.style.display = 'none';  // Ensure element is invisible
        const file = new Blob([logsText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(file);
        
        element.href = url;
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + new Date().toISOString().split('T')[1].replace(/[:.]/g, '-').substring(0, 8);
        element.download = `HMS_DEBUG_LOGS_${timestamp}.log`;
        
        console.log(`💾 Triggering download: ${element.download}`);
        
        // Append to body and click
        document.body.appendChild(element);
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(() => {
          element.click();
          console.log('✅ Download click triggered');
        });
        
        // Wait longer to ensure browser's download manager receives the file
        // Different browsers have different timings
        const cleanupTimeout = setTimeout(() => {
          try {
            if (element.parentNode) {
              document.body.removeChild(element);
            }
            URL.revokeObjectURL(url);
            console.log('✅ Cleanup completed - logs should be in Downloads folder');
            resolve();
          } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
            resolve();  // Still resolve even if cleanup fails
          }
        }, 2000);  // Increased from 100ms to 2000ms to ensure browser processes download
        
        // Add timeout to prevent promise hanging indefinitely
        const maxWaitTimeout = setTimeout(() => {
          clearTimeout(cleanupTimeout);
          if (element.parentNode) {
            document.body.removeChild(element);
          }
          URL.revokeObjectURL(url);
          console.log('⚠️ Max wait timeout reached - resolving download');
          resolve();
        }, 5000);  // Absolute max wait is 5 seconds
        
      } catch (error) {
        console.error('❌ CRITICAL: Failed to download session debug logs:', error);
        console.error('Error details:', {
          name: error?.name,
          message: error?.message,
          stack: error?.stack
        });
        
        // Try fallback: log to console for user to copy
        try {
          console.log('\n⚠️ FALLBACK: Logs cannot be auto-downloaded. Copy logs from below:\n');
          const fallbackLogs = this.getLogsAsText();
          console.log(fallbackLogs);
          console.log('\n⚠️ You can right-click → Save as to save the logs above');
        } catch (fallbackError) {
          console.error('❌ FALLBACK ALSO FAILED:', fallbackError);
        }
        
        resolve();  // Always resolve to not block logout
      }
    });
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.startTime = Date.now();
    localStorage.removeItem('SESSION_DEBUG_LOGS');
    console.log('🗑️ Session debug logs cleared');
  }

  /**
   * Load logs from previous session
   */
  loadPreviousLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('SESSION_DEBUG_LOGS');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load previous logs:', error);
      return [];
    }
  }
}

// Export singleton instance
export const sessionDebugLogger = new SessionDebugLogger();

// Expose to window for console access
if (typeof window !== 'undefined') {
  (window as any).sessionDebugLogger = sessionDebugLogger;
  console.log('✅ Session debug logger initialized - Access via window.sessionDebugLogger');
  console.log('   Commands:');
  console.log('     - sessionDebugLogger.downloadLogs() - Download current session logs');
  console.log('     - sessionDebugLogger.getLogs() - View all logs');
  console.log('     - sessionDebugLogger.getLogsAsText() - Get formatted text');
}
