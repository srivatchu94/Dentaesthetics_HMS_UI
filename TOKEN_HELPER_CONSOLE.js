/**
 * 🎯 INSTANT TOKEN DEBUGGING HELPER
 * 
 * Copy and paste this into your browser console at any time
 * It will instantly show you the status of your tokens
 */

const TOKEN_HELPER = {
  /**
   * Print current token status in a nice format
   */
  status: function() {
    console.clear();
    console.log('%c🔍 TOKEN STATUS CHECK', 'font-size: 16px; font-weight: bold; color: #2196F3');
    console.log('%c' + '='.repeat(60), 'font-size: 12px; color: #666');

    const now = new Date();
    console.log(`\n📅 Time: ${now.toLocaleString()}`);

    // Access Token
    console.log('\n' + '%c📋 ACCESS TOKEN', 'font-weight: bold; color: #2196F3');
    const accessToken = sessionStorage.getItem('accessToken_session');
    if (accessToken) {
      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const exp = new Date(payload.exp * 1000);
          const remaining = (exp - now) / 1000 / 60;
          
          console.log(`   ✅ Present`);
          console.log(`   👤 User: ${payload.sub || payload.username || 'N/A'}`);
          console.log(`   🕐 Expires: ${exp.toLocaleString()}`);
          console.log(`   ⏱️  Remaining: ${remaining.toFixed(1)} minutes`);
          
          if (remaining < 5) {
            console.log('%c   ⚠️  EXPIRING SOON! Should refresh immediately', 'color: #FF9800');
          } else if (remaining < 0) {
            console.log('%c   ❌ EXPIRED! User should be logged out', 'color: #F44336');
          } else {
            console.log('%c   ✅ Still valid', 'color: #4CAF50');
          }
        } else {
          console.log('   ❌ Invalid JWT format');
        }
      } catch (e) {
        console.log('   ❌ Could not decode:', e.message);
      }
    } else {
      console.log('   ❌ NOT FOUND');
    }

    // Refresh Token Cookie
    console.log('\n' + '%c🍪 REFRESH TOKEN COOKIE', 'font-weight: bold; color: #2196F3');
    const allCookies = document.cookie;
    if (allCookies.includes('refreshToken') || allCookies.includes('refresh')) {
      console.log('   ✅ Present');
      const cookies = allCookies.split(';').map(c => c.trim());
      cookies.forEach(c => {
        if (c.includes('refresh')) {
          console.log(`   └─ ${c.substring(0, 50)}...`);
        }
      });
    } else {
      console.log('   ❌ NOT FOUND or HttpOnly');
    }
    console.log(`   ℹ️  HttpOnly cookies cannot be viewed from JS (that's good!)`);

    // Token Expiry Metadata
    console.log('\n' + '%c⏰ TOKEN EXPIRY METADATA', 'font-weight: bold; color: #2196F3');
    const expiry = sessionStorage.getItem('accessTokenExpiry');
    if (expiry) {
      console.log(`   ✅ ${expiry}`);
    } else {
      console.log('   ❌ NOT FOUND');
    }

    // LocalStorage
    console.log('\n' + '%c💾 LOCAL STORAGE', 'font-weight: bold; color: #2196F3');
    const userData = localStorage.getItem('userData');
    const userAccess = localStorage.getItem('userAccess');
    const selectedAccess = localStorage.getItem('selectedAccess');

    console.log(`   userData: ${userData ? '✅' : '❌'}`);
    console.log(`   userAccess: ${userAccess ? '✅' : '❌'}`);
    console.log(`   selectedAccess: ${selectedAccess ? '✅' : '❌'}`);

    console.log('%c' + '='.repeat(60), 'font-size: 12px; color: #666');
    console.log('\n💡 Use TOKEN_HELPER.analyze() for detailed troubleshooting\n');
  },

  /**
   * Detailed analysis with recommendations
   */
  analyze: function() {
    this.status();

    console.log('%c🔧 ANALYSIS & RECOMMENDATIONS', 'font-size: 14px; font-weight: bold; color: #FF9800');
    console.log('%c' + '='.repeat(60), 'font-size: 12px; color: #666');

    const accessToken = sessionStorage.getItem('accessToken_session');
    const expiry = sessionStorage.getItem('accessTokenExpiry');
    const refreshCookie = document.cookie.includes('refreshToken');

    let issues = [];

    // Check 1: Token Present
    if (!accessToken) {
      issues.push({
        severity: 'CRITICAL',
        issue: 'Access token missing',
        fix: 'User must LOGIN again. Refresh token may have expired.'
      });
    }

    // Check 2: Token Validity
    if (accessToken) {
      try {
        const parts = accessToken.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const exp = new Date(payload.exp * 1000);
        const remaining = (exp - new Date()) / 1000 / 60;

        if (remaining < 0) {
          issues.push({
            severity: 'CRITICAL',
            issue: 'Access token is EXPIRED',
            fix: 'Need to refresh. If refresh fails, user must login again.'
          });
        } else if (remaining < 3) {
          issues.push({
            severity: 'WARNING',
            issue: 'Access token expiring within 3 minutes',
            fix: 'Refresh should be triggered automatically. Check console for "AUTO-REFRESH" logs.'
          });
        }
      } catch (e) {
        issues.push({
          severity: 'ERROR',
          issue: 'Could not decode access token',
          fix: 'Token format is corrupted. User must login again.'
        });
      }
    }

    // Check 3: Expiry Metadata
    if (accessToken && !expiry) {
      issues.push({
        severity: 'WARNING',
        issue: 'Token expiry metadata missing from sessionStorage',
        fix: 'Refresh timer may not work properly. Refresh timer uses JWT exp claim as fallback.'
      });
    }

    // Check 4: Refresh Cookie
    if (!refreshCookie) {
      issues.push({
        severity: 'WARNING',
        issue: 'Refresh token cookie not visible (HttpOnly, Secure)',
        fix: 'This is NORMAL! HttpOnly cookies are hidden for security. If refresh is failing, backend is not setting it correctly.'
      });
    }

    // Print Issues
    if (issues.length === 0) {
      console.log('%c✅ NO ISSUES FOUND - Tokens look good!', 'color: #4CAF50; font-weight: bold');
    } else {
      issues.forEach((item, idx) => {
        const color = item.severity === 'CRITICAL' ? '#F44336' : 
                     item.severity === 'ERROR' ? '#FF6F00' : 
                     '#FF9800';
        const emoji = item.severity === 'CRITICAL' ? '🚨' : 
                     item.severity === 'ERROR' ? '⚠️' : 
                     '💡';

        console.log(`\n${emoji} ${item.severity}: ${item.issue}`);
        console.log(`   → Fix: ${item.fix}`);
      });
    }

    console.log('\n' + '%c' + '='.repeat(60), 'font-size: 12px; color: #666');
    console.log('\n💡 Next steps:\n');
    console.log('   1. TOKEN_HELPER.watch()     - Watch for refresh events');
    console.log('   2. TOKEN_HELPER.testRefresh() - Manually test refresh');
    console.log('   3. TOKEN_HELPER.logs()      - View last 10 token logs\n');
  },

  /**
   * Watch for token refresh events
   */
  watch: function() {
    console.clear();
    console.log('%c👁️ WATCHING FOR TOKEN REFRESH EVENTS', 'font-size: 16px; font-weight: bold; color: #4CAF50');
    console.log('%c' + '='.repeat(60), 'font-size: 12px; color: #666');
    console.log('\n⏳ Watching console for:\n');
    console.log('   • 🔄 AUTO-REFRESH TRIGGERED');
    console.log('   • ✅ TOKEN REFRESH SUCCESSFUL');
    console.log('   • ❌ FAILED TO REFRESH TOKEN');
    console.log('\n💾 Keep this window open and continue using app normally.\n');
    console.log('If you see refresh events appearing above, that\'s good!');
    console.log('If you DON\'T see any after 10+ minutes, the timer isn\'t working.\n');
    
    // Set up a periodic check
    let lastCheck = Date.now();
    setInterval(() => {
      const accessToken = sessionStorage.getItem('accessToken_session');
      if (accessToken) {
        const parts = accessToken.split('.');
        const payload = JSON.parse(atob(parts[1]));
        const exp = new Date(payload.exp * 1000);
        const remaining = (exp - new Date()) / 1000 / 60;
        
        // Log every 2 minutes
        const now = Date.now();
        if (now - lastCheck > 120000) {
          console.log(`📊 [CHECK] Token valid for ${remaining.toFixed(1)} minutes`);
          lastCheck = now;
        }
      }
    }, 10000);
  },

  /**
   * Manually test token refresh
   */
  testRefresh: async function() {
    console.clear();
    console.log('%c🧪 MANUAL TOKEN REFRESH TEST', 'font-size: 16px; font-weight: bold; color: #2196F3');
    console.log('%c' + '='.repeat(60), 'font-size: 12px; color: #666\n');

    const accessToken = sessionStorage.getItem('accessToken_session');
    if (!accessToken) {
      console.log('❌ No access token found. Cannot test refresh.');
      return;
    }

    console.log('📤 Sending refresh request to /api/Authentication/refresh-token...\n');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/Authentication/refresh-token', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ accessToken })
      });

      const duration = Date.now() - startTime;
      console.log(`🎯 Response: ${response.status} ${response.statusText} (${duration}ms)`);

      if (response.status === 200) {
        const data = await response.json();
        console.log('%c✅ SUCCESS!', 'color: #4CAF50; font-weight: bold');
        console.log('   New token received:', data.accessToken?.substring(0, 50) + '...');
        console.log('   Expires: ' + (data.accessTokenExpiresAt || 'N/A'));
      } else if (response.status === 401) {
        console.log('%c❌ 401 UNAUTHORIZED', 'color: #F44336; font-weight: bold');
        console.log('   Refresh token has expired. User must login again.');
      } else if (response.status === 403) {
        console.log('%c❌ 403 FORBIDDEN', 'color: #F44336; font-weight: bold');
        console.log('   User may not have permission to refresh token.');
      } else {
        const text = await response.text();
        console.log('%c❌ ERROR', 'color: #F44336; font-weight: bold');
        console.log('   Response:', text.substring(0, 200));
      }
    } catch (error) {
      console.log('%c❌ NETWORK ERROR', 'color: #F44336; font-weight: bold');
      console.log('   ' + error.message);
    }

    console.log('\n' + '%c' + '='.repeat(60), 'font-size: 12px; color: #666');
  },

  /**
   * Show recent token-related logs
   */
  logs: function() {
    console.clear();
    console.log('%c📜 RECENT TOKEN LOGS', 'font-size: 16px; font-weight: bold; color: #673AB7');
    console.log('%c' + '='.repeat(60), 'font-size: 12px; color: #666');
    console.log('\n(Open browser console to see full logs)\n');
    console.log('Search for these keywords:');
    console.log('   🔄 AUTO-REFRESH');
    console.log('   💓 [Heartbeat]');
    console.log('   ⏰ TOKEN REFRESH TIMER');
    console.log('   ✅ Token Refresh Successful');
    console.log('   ❌ FAILED TO REFRESH\n');
    console.log('Filter the console:')
    console.log('   1. Open DevTools (F12)');
    console.log('   2. Go to Console tab');
    console.log('   3. In filter box, type: "🔄" or "AUTO-REFRESH"\n');
  },

  /**
   * Export diagnostic data
   */
  export: function() {
    const data = {
      timestamp: new Date().toISOString(),
      token: {
        present: !!sessionStorage.getItem('accessToken_session'),
        expires: sessionStorage.getItem('accessTokenExpiry'),
      },
      cookies: {
        all: document.cookie,
        hasRefresh: document.cookie.includes('refreshToken')
      },
      storage: {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      }
    };

    console.log('%c📦 DIAGNOSTIC DATA', 'font-size: 14px; font-weight: bold');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n📋 Copy above data and share with support');

    return data;
  }
};

// Make it global
window.TOKEN_HELPER = TOKEN_HELPER;

console.log('%c✅ TOKEN_HELPER loaded!', 'color: #4CAF50; font-weight: bold; font-size: 12px');
console.log('%cUsage:', 'font-weight: bold; font-size: 12px');
console.log('  TOKEN_HELPER.status()      - Quick token status');
console.log('  TOKEN_HELPER.analyze()     - Detailed analysis');
console.log('  TOKEN_HELPER.watch()       - Monitor refresh events');
console.log('  TOKEN_HELPER.testRefresh() - Test refresh manually');
console.log('  TOKEN_HELPER.export()      - Export diagnostic data');
