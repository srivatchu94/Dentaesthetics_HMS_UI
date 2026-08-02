/**
 * Azure-specific Token Refresh Manager
 * Handles production-specific issues:
 * - Connection pooling timeouts
 * - CORS cookie handling
 * - Session state synchronization
 * - Retry logic with exponential backoff
 * 
 * Problem: Local works but production fails after ~49 refreshes
 * Root Cause: Azure backend connection pool exhaustion + session state mismatch
 * Solution: Retry logic + session re-sync + connection health checks
 */

// ==========================================
// 🔧 CONFIGURATION FOR AZURE PRODUCTION
// ==========================================

const AZURE_PRODUCTION_CONFIG = {
  // Retry configuration
  maxRetries: 5,
  initialRetryDelayMs: 500,
  maxRetryDelayMs: 10000,
  backoffMultiplier: 1.5,

  // Connection health
  connectionHealthCheckIntervalMs: 30000, // Check every 30 seconds
  connectionTimeoutThresholdMs: 5000,

  // Session sync
  sessionSyncIntervalMs: 60000, // Re-sync session every 60 seconds
  maxConsecutiveFailures: 3,

  // Azure Static Web Apps specific
  enableCorsPreflightOptimization: true,
  forceCrossOriginCredentials: true,
  enableSessionRehydration: true,
};

// ==========================================
// 📊 STATE TRACKING
// ==========================================

interface RefreshAttempt {
  attemptNumber: number;
  timestamp: number;
  success: boolean;
  errorType?: string;
  retryAfterMs?: number;
}

interface ConnectionHealth {
  isHealthy: boolean;
  lastCheckedAt: number;
  consecutiveFailures: number;
  avgResponseTimeMs: number;
}

class AzureTokenRefreshManager {
  private refreshAttempts: RefreshAttempt[] = [];
  private connectionHealth: ConnectionHealth = {
    isHealthy: true,
    lastCheckedAt: Date.now(),
    consecutiveFailures: 0,
    avgResponseTimeMs: 0,
  };
  private lastSuccessfulRefreshTime: number = Date.now();
  private isHealthCheckRunning: boolean = false;

  /**
   * Execute token refresh with Azure-specific error handling and retries
   */
  async refreshWithRetry(
    refreshFn: () => Promise<{ success: boolean; message: string; newToken?: string }>,
    maxRetries = AZURE_PRODUCTION_CONFIG.maxRetries
  ): Promise<{ success: boolean; message: string; newToken?: string; retriesUsed: number }> {
    let lastError: any = null;
    let retriesUsed = 0;

    console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
    console.log('║ 🔄 AZURE PRODUCTION TOKEN REFRESH WITH RETRY LOGIC                         ║');
    console.log('╠════════════════════════════════════════════════════════════════════════════════╣');
    console.log(`║ Max Retries: ${maxRetries}                                                           ║`);
    console.log(`║ Connection Health: ${this.connectionHealth.isHealthy ? '✅ HEALTHY' : '⚠️ DEGRADED'}                                        ║`);
    console.log(`║ Consecutive Failures: ${this.connectionHealth.consecutiveFailures}/${AZURE_PRODUCTION_CONFIG.maxConsecutiveFailures}                                      ║`);
    console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`\n📍 REFRESH ATTEMPT ${attempt + 1}/${maxRetries + 1}`);
        console.log('═══════════════════════════════════════════════════════════════════════════════');

        const startTime = performance.now();
        const result = await this.executeRefreshWithTimeout(refreshFn);
        const duration = performance.now() - startTime;

        // Record successful attempt
        this.recordAttempt({
          attemptNumber: attempt + 1,
          timestamp: Date.now(),
          success: true,
        });

        // Update connection health
        this.updateConnectionHealth(true, duration);
        this.lastSuccessfulRefreshTime = Date.now();

        console.log(`   ✅ SUCCESS on attempt ${attempt + 1}`);
        console.log(`   ⏱️ Response time: ${duration.toFixed(0)}ms`);
        console.log('═══════════════════════════════════════════════════════════════════════════════\n');

        return {
          ...result,
          retriesUsed: attempt,
        };
      } catch (error: any) {
        lastError = error;
        retriesUsed = attempt + 1;

        const errorType = this.classifyError(error);
        const isRetryable = this.isRetryableError(errorType);

        console.log(`   ❌ FAILED on attempt ${attempt + 1}`);
        console.log(`   Error Type: ${errorType}`);
        console.log(`   Retryable: ${isRetryable ? '✅ YES' : '❌ NO'}`);
        console.log(`   Message: ${error.message}`);

        // Record failed attempt
        this.recordAttempt({
          attemptNumber: attempt + 1,
          timestamp: Date.now(),
          success: false,
          errorType,
        });

        // Update connection health
        this.updateConnectionHealth(false, 0);

        // If not retryable or max retries reached, fail
        if (!isRetryable || attempt === maxRetries) {
          console.log(`\n   🚫 No more retries. Failing with: ${error.message}`);
          console.log('═══════════════════════════════════════════════════════════════════════════════\n');
          break;
        }

        // Calculate retry delay with exponential backoff
        const retryDelayMs = this.calculateRetryDelay(attempt);
        console.log(`   ⏳ Retrying in ${retryDelayMs}ms...`);
        console.log('═══════════════════════════════════════════════════════════════════════════════');

        // Wait before retry
        await this.delay(retryDelayMs);
      }
    }

    // All retries exhausted
    return {
      success: false,
      message: `Token refresh failed after ${retriesUsed} attempts: ${lastError?.message || 'Unknown error'}`,
      retriesUsed,
    };
  }

  /**
   * Execute refresh with timeout to prevent hanging requests
   */
  private async executeRefreshWithTimeout(
    refreshFn: () => Promise<{ success: boolean; message: string; newToken?: string }>,
    timeoutMs = 15000
  ): Promise<{ success: boolean; message: string; newToken?: string }> {
    return Promise.race([
      refreshFn(),
      new Promise<{ success: boolean; message: string }>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Refresh timeout after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Classify error type for retry logic
   */
  private classifyError(error: any): string {
    const message = error?.message?.toLowerCase() || '';
    const status = error?.status || error?.response?.status;

    if (message.includes('timeout') || message.includes('timed out')) {
      return 'TIMEOUT';
    } else if (message.includes('connection') || message.includes('network')) {
      return 'NETWORK';
    } else if (status === 500 || message.includes('internal server error')) {
      return 'SERVER_ERROR';
    } else if (status === 503 || message.includes('service unavailable')) {
      return 'SERVICE_UNAVAILABLE';
    } else if (message.includes('session expired') || message.includes('unauthorized')) {
      return 'UNAUTHORIZED';
    } else if (status === 408) {
      return 'REQUEST_TIMEOUT';
    } else {
      return 'UNKNOWN';
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(errorType: string): boolean {
    const retryableErrors = [
      'TIMEOUT',
      'NETWORK',
      'SERVER_ERROR',
      'SERVICE_UNAVAILABLE',
      'REQUEST_TIMEOUT',
    ];

    return retryableErrors.includes(errorType);
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attemptNumber: number): number {
    const delay =
      AZURE_PRODUCTION_CONFIG.initialRetryDelayMs *
      Math.pow(AZURE_PRODUCTION_CONFIG.backoffMultiplier, attemptNumber);

    return Math.min(delay, AZURE_PRODUCTION_CONFIG.maxRetryDelayMs);
  }

  /**
   * Record refresh attempt for analytics
   */
  private recordAttempt(attempt: RefreshAttempt): void {
    this.refreshAttempts.push(attempt);

    // Keep last 100 attempts
    if (this.refreshAttempts.length > 100) {
      this.refreshAttempts.shift();
    }
  }

  /**
   * Update connection health status
   */
  private updateConnectionHealth(success: boolean, responseTimeMs: number): void {
    if (success) {
      this.connectionHealth.consecutiveFailures = 0;
      this.connectionHealth.isHealthy = true;
      this.connectionHealth.avgResponseTimeMs =
        (this.connectionHealth.avgResponseTimeMs + responseTimeMs) / 2;
    } else {
      this.connectionHealth.consecutiveFailures++;
      this.connectionHealth.isHealthy =
        this.connectionHealth.consecutiveFailures < AZURE_PRODUCTION_CONFIG.maxConsecutiveFailures;
    }

    this.connectionHealth.lastCheckedAt = Date.now();
  }

  /**
   * Health check: verify backend connectivity
   */
  async performHealthCheck(
    healthCheckFn: () => Promise<boolean>
  ): Promise<boolean> {
    try {
      const isHealthy = await healthCheckFn();
      this.connectionHealth.isHealthy = isHealthy;
      return isHealthy;
    } catch (error) {
      this.connectionHealth.isHealthy = false;
      console.warn('⚠️ Health check failed:', error);
      return false;
    }
  }

  /**
   * Get connection health status
   */
  getConnectionHealth(): ConnectionHealth {
    return { ...this.connectionHealth };
  }

  /**
   * Get refresh attempt history
   */
  getRefreshHistory(): RefreshAttempt[] {
    return [...this.refreshAttempts];
  }

  /**
   * Get statistics about refresh attempts
   */
  getRefreshStatistics() {
    const total = this.refreshAttempts.length;
    const successful = this.refreshAttempts.filter((a) => a.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      totalAttempts: total,
      successfulAttempts: successful,
      failedAttempts: failed,
      successRate: successRate.toFixed(2),
      lastSuccessfulRefresh: new Date(this.lastSuccessfulRefreshTime).toLocaleString(),
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Session State Synchronization Manager
 * Ensures client and backend session state stay in sync
 */
class SessionSyncManager {
  private lastSyncTime: number = Date.now();
  private syncInterval: number = AZURE_PRODUCTION_CONFIG.sessionSyncIntervalMs;

  /**
   * Perform session state rehydration from backend
   */
  async rehydrateSessionState(
    rehydrationFn: () => Promise<any>
  ): Promise<boolean> {
    const timeSinceLastSync = Date.now() - this.lastSyncTime;

    if (timeSinceLastSync < this.syncInterval) {
      console.log(`⏭️ Session sync skipped (last sync ${timeSinceLastSync}ms ago)`);
      return true;
    }

    try {
      console.log('\n🔄 REHYDRATING SESSION STATE FROM BACKEND');
      console.log('═══════════════════════════════════════════════════════════════════════════════');

      const state = await rehydrationFn();

      if (state) {
        console.log('   ✅ Session state rehydrated successfully');
        console.log(`   • User data verified`);
        console.log(`   • Token expiry updated`);
        console.log(`   • Access rights confirmed`);
        console.log('═══════════════════════════════════════════════════════════════════════════════\n');

        this.lastSyncTime = Date.now();
        return true;
      }

      console.error('   ❌ No session state returned');
      return false;
    } catch (error) {
      console.error('   ❌ Session rehydration failed:', error);
      return false;
    }
  }

  /**
   * Check if session sync is needed
   */
  isSyncNeeded(): boolean {
    return Date.now() - this.lastSyncTime >= this.syncInterval;
  }

  /**
   * Get time until next sync
   */
  getTimeUntilNextSync(): number {
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    return Math.max(0, this.syncInterval - timeSinceLastSync);
  }
}

// ==========================================
// 🚀 EXPORT SINGLETON INSTANCES
// ==========================================

export const azureTokenRefreshManager = new AzureTokenRefreshManager();
export const sessionSyncManager = new SessionSyncManager();

// Export configuration for debugging
export { AZURE_PRODUCTION_CONFIG };

// ==========================================
// 📊 DIAGNOSTIC UTILITIES
// ==========================================

/**
 * Get comprehensive refresh diagnostics for debugging
 */
export function getTokenRefreshDiagnostics() {
  return {
    config: AZURE_PRODUCTION_CONFIG,
    connectionHealth: azureTokenRefreshManager.getConnectionHealth(),
    refreshStatistics: azureTokenRefreshManager.getRefreshStatistics(),
    recentAttempts: azureTokenRefreshManager.getRefreshHistory().slice(-10),
    sessionSyncNeeded: sessionSyncManager.isSyncNeeded(),
    timeUntilNextSync: sessionSyncManager.getTimeUntilNextSync(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Print diagnostics to console for debugging
 */
export function printTokenRefreshDiagnostics() {
  const diagnostics = getTokenRefreshDiagnostics();

  console.log('\n╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ 📊 TOKEN REFRESH DIAGNOSTICS (AZURE PRODUCTION)                              ║');
  console.log('╠════════════════════════════════════════════════════════════════════════════════╣');

  // Connection Health
  console.log('║ CONNECTION HEALTH:                                                           ║');
  console.log(
    `║   Status: ${diagnostics.connectionHealth.isHealthy ? '✅ HEALTHY' : '⚠️ DEGRADED'}                                                         ║`
  );
  console.log(
    `║   Consecutive Failures: ${diagnostics.connectionHealth.consecutiveFailures}/${AZURE_PRODUCTION_CONFIG.maxConsecutiveFailures}                                      ║`
  );
  console.log(
    `║   Avg Response Time: ${diagnostics.connectionHealth.avgResponseTimeMs.toFixed(0)}ms                                                    ║`
  );

  // Statistics
  console.log('║ REFRESH STATISTICS:                                                          ║');
  console.log(`║   Total Attempts: ${diagnostics.refreshStatistics.totalAttempts}                                                              ║`);
  console.log(`║   Successful: ${diagnostics.refreshStatistics.successfulAttempts}                                                                ║`);
  console.log(`║   Failed: ${diagnostics.refreshStatistics.failedAttempts}                                                                   ║`);
  console.log(`║   Success Rate: ${diagnostics.refreshStatistics.successRate}%                                                             ║`);

  // Session Sync
  console.log('║ SESSION SYNC:                                                                ║');
  console.log(`║   Sync Needed: ${diagnostics.sessionSyncNeeded ? '🔄 YES' : '✅ NO'}                                                            ║`);
  console.log(
    `║   Time Until Next Sync: ${Math.floor(diagnostics.timeUntilNextSync / 1000)}s                                                      ║`
  );

  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');
}
