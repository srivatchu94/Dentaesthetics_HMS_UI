/**
 * 🔍 TOKEN REFRESH DEBUGGING TOOL
 * 
 * Add this script to window for real-time token monitoring
 * Usage: window.TOKEN_DEBUG.start()
 */

(function() {
  const TOKEN_DEBUG = {
    /**
     * Start comprehensive token monitoring
     */
    start: function() {
      console.log('🚀 ==================== TOKEN REFRESH DEBUGGER STARTED ====================');
      this.logCurrentStatus();
      this.monitorRefreshEvents();
      this.monitorApiCalls();
      this.setupChecks();
      console.log('🚀 ===================================================================\n');
    },

    /**
     * Log current token status
     */
    logCurrentStatus: function() {
      console.log('\n📊 CURRENT TOKEN STATUS:');
      
      // Check memory token
      const memToken = sessionStorage.getItem('accessToken_session');
      if (memToken) {
        try {
          const parts = memToken.split('.');
          const payload = JSON.parse(atob(parts[1]));
          const exp = new Date(payload.exp * 1000);
          const now = new Date();
          const remaining = (exp - now) / 1000 / 60;
          
          console.log(`✅ Access Token: Present`);
          console.log(`   Token ID: ${payload.aud || payload.sub || 'N/A'}`);
          console.log(`   Expires: ${exp.toISOString()}`);
          console.log(`   Remaining: ${remaining.toFixed(1)} minutes`);
          console.log(`   Created: ${payload.iat ? new Date(payload.iat * 1000).toISOString() : 'N/A'}`);
        } catch (e) {
          console.error(`❌ Could not decode access token:`, e);
        }
      } else {
        console.log('❌ Access Token: MISSING');
      }

      // Check refresh token cookie
      const hasRefreshCookie = document.cookie.includes('refreshToken') || document.cookie.includes('refresh');
      console.log(`🍪 Refresh Token Cookie: ${hasRefreshCookie ? '✅ Present' : '❌ MISSING'}`);
      
      // List all cookies
      if (document.cookie) {
        const cookies = document.cookie.split(';').map(c => c.trim().split('=')[0]);
        console.log(`   All cookies: ${cookies.join(', ')}`);
      }

      // Check expiry metadata
      const expiry = sessionStorage.getItem('accessTokenExpiry');
      console.log(`📋 Expiry in SessionStorage: ${expiry ? expiry : '❌ MISSING'}`);
    },

    /**
     * Monitor for refresh events in logs
     */
    monitorRefreshEvents: function() {
      const originalLog = console.log;
      const originalError = console.error;
      
      let refreshAttempts = 0;
      let refreshSuccess = 0;
      let refreshFailed = 0;

      console.log('\n👁️ MONITORING REFRESH EVENTS:');
      console.log('   Watching for: 🔄 AUTO-REFRESH, ✅ TOKEN REFRESH SUCCESSFUL, ❌ FAILED TO REFRESH');
      
      // Intercept logs (careful not to break console)
      window.addEventListener('hms:token-refresh', (e) => {
        refreshAttempts++;
        console.log(`   [${new Date().toLocaleTimeString()}] Refresh Event #${refreshAttempts}:`, e.detail);
      });
    },

    /**
     * Monitor API calls that might be affecting refresh
     */
    monitorApiCalls: function() {
      const originalFetch = window.fetch;
      
      window.fetch = function(...args) {
        const url = typeof args[0] === 'string' ? args[0] : args[0].url;
        const method = (args[1]?.method || 'GET').toUpperCase();
        
        // Log refresh-token calls specifically
        if (url.includes('refresh-token') || url.includes('refresh')) {
          const startTime = Date.now();
          console.log(`\n🔄 REFRESH REQUEST INITIATED:`);
          console.log(`   URL: ${url}`);
          console.log(`   Time: ${new Date().toLocaleTimeString()}`);
          
          return originalFetch.apply(window, args)
            .then(res => {
              const duration = Date.now() - startTime;
              console.log(`🔄 REFRESH RESPONSE:`);
              console.log(`   Status: ${res.status} ${res.statusText}`);
              console.log(`   Duration: ${duration}ms`);
              
              if (res.status === 200) {
                console.log(`   ✅ SUCCESS - Token should be refreshed`);
              } else if (res.status === 401) {
                console.log(`   ❌ UNAUTHORIZED - Refresh token may be expired`);
              } else if (res.status === 403) {
                console.log(`   ❌ FORBIDDEN - User may not have permission to refresh`);
              } else if (res.status >= 500) {
                console.log(`   ❌ SERVER ERROR - Backend /refresh endpoint has issues`);
              }
              
              return res;
            })
            .catch(err => {
              console.error(`❌ REFRESH REQUEST FAILED:`, err);
              throw err;
            });
        }
        
        return originalFetch.apply(window, args);
      };
      
      console.log('\n🌐 MONITORING API CALLS: (refresh-token calls will be logged specially)');
    },

    /**
     * Setup periodic checks
     */
    setupChecks: function() {
      console.log('\n⏰ SCHEDULED CHECKS:');
      console.log('   Every 30 seconds: Token status check');
      
      let checkCount = 0;
      setInterval(() => {
        checkCount++;
        const status = sessionStorage.getItem('accessToken_session') ? '✅' : '❌';
        const expiry = sessionStorage.getItem('accessTokenExpiry');
        
        if (expiry) {
          const exp = new Date(expiry);
          const now = new Date();
          const remaining = (exp - now) / 1000 / 60;
          
          // Only log if significant change
          if (remaining < 5 || remaining % 10 === 0) {
            console.log(`[Check #${checkCount}] ${status} Token valid for ${remaining.toFixed(1)}m`);
          }
        }
      }, 30000);
    },

    /**
     * Check specific conditions
     */
    checkCondition: function(name, test) {
      const result = test();
      console.log(`\n🔍 CHECK: ${name}`);
      console.log(`   Result: ${result ? '✅ PASS' : '❌ FAIL'}`);
      return result;
    },

    /**
     * Manual refresh trigger (for testing)
     */
    manualRefresh: function() {
      console.log('\n⚡ MANUALLY TRIGGERING TOKEN REFRESH FOR TESTING');
      // This would normally be called by authService
      // Dispatch a custom event that authService listens to
      const event = new CustomEvent('hms:manual-refresh');
      window.dispatchEvent(event);
    },

    /**
     * Export all diagnostics
     */
    exportDiagnostics: function() {
      return {
        timestamp: new Date().toISOString(),
        tokenPresent: !!sessionStorage.getItem('accessToken_session'),
        tokenExpiry: sessionStorage.getItem('accessTokenExpiry'),
        refreshCookie: document.cookie.includes('refreshToken'),
        allCookies: document.cookie,
        localStorage: Object.keys(localStorage).reduce((acc, key) => {
          if (!key.includes('token') && !key.includes('secret')) {
            acc[key] = localStorage.getItem(key);
          }
          return acc;
        }, {}),
        sessionStorage: Object.keys(sessionStorage).reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {})
      };
    }
  };

  // Expose to window
  window.TOKEN_DEBUG = TOKEN_DEBUG;
  
  console.log('✅ TOKEN_DEBUG available - Run: window.TOKEN_DEBUG.start()');
})();
