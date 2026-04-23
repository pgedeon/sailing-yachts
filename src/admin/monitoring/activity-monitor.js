/**
 * Activity Monitoring and Alerting System
 * 
 * Real-time monitoring of admin activities with intelligent
   pattern detection and alerting.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ActivityMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Configuration
    this.windowSize = options.windowSize || 5 * 60 * 1000; // 5 minutes
    this.alertThresholds = options.alertThresholds || {
      failedLogins: 5,
      suspiciousIPs: 10,
      adminAccess: 20,
      dataExfiltration: 3,
      bruteForce: 10
    };
    
    // Activity tracking
    this.activities = [];
    this.userActivities = new Map();
    this.ipActivities = new Map();
    this.suspiciousPatterns = new Map();
    
    // Alert system
    this.alerts = [];
    this.alertHistory = [];
    this.alertCooldowns = new Map();
    
    // Statistics
    this.stats = {
      totalActivities: 0,
      failedActivities: 0,
      successfulActivities: 0,
      alertCount: 0,
      blockedIPs: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  /**
   * Start monitoring system
   */
  startMonitoring() {
    // Clean up old activities periodically
    setInterval(() => this.cleanupActivities(), this.windowSize);
    
    // Check for patterns periodically
    setInterval(() => this.analyzePatterns(), 30 * 1000); // Every 30 seconds
    
    // Clean up old alerts
    setInterval(() => this.cleanupAlerts(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Log activity
   */
  logActivity(activity) {
    const timestamp = Date.now();
    const enrichedActivity = {
      ...activity,
      id: crypto.randomUUID(),
      timestamp,
      processedAt: timestamp
    };
    
    // Add to activities array
    this.activities.push(enrichedActivity);
    this.stats.totalActivities++;
    
    // Track by user
    this.trackUserActivity(activity.userId || 'unknown', enrichedActivity);
    
    // Track by IP
    this.trackIPActivity(activity.ipAddress || 'unknown', enrichedActivity);
    
    // Emit activity event
    this.emit('activity', enrichedActivity);
    
    // Check for immediate alerts
    this.checkImmediateAlerts(enrichedActivity);
  }

  /**
   * Track user activity
   */
  trackUserActivity(userId, activity) {
    if (!this.userActivities.has(userId)) {
      this.userActivities.set(userId, []);
    }
    
    const userActivities = this.userActivities.get(userId);
    userActivities.push(activity);
    
    // Keep only recent activities (last hour)
    const cutoff = Date.now() - 60 * 60 * 1000;
    const recentActivities = userActivities.filter(a => a.timestamp > cutoff);
    this.userActivities.set(userId, recentActivities);
  }

  /**
   * Track IP activity
   */
  trackIPActivity(ipAddress, activity) {
    if (!this.ipActivities.has(ipAddress)) {
      this.ipActivities.set(ipAddress, []);
    }
    
    const ipActivities = this.ipActivities.get(ipAddress);
    ipActivities.push(activity);
    
    // Keep only recent activities (last hour)
    const cutoff = Date.now() - 60 * 60 * 1000;
    const recentActivities = ipActivities.filter(a => a.timestamp > cutoff);
    this.ipActivities.set(ipAddress, recentActivities);
  }

  /**
   * Check for immediate alerts
   */
  checkImmediateAlerts(activity) {
    // Failed login alerts
    if (activity.action === 'login' && activity.result === 'failed') {
      this.checkFailedLoginAlert(activity);
    }
    
    // Suspicious IP alerts
    if (activity.result === 'failed') {
      this.checkSuspiciousIPAlert(activity);
    }
    
    // Admin access alerts
    if (activity.isAdmin && activity.action.includes('admin')) {
      this.checkAdminAccessAlert(activity);
    }
    
    // Brute force alerts
    if (this.isBruteForceAttempt(activity)) {
      this.checkBruteForceAlert(activity);
    }
    
    // Data exfiltration alerts
    if (this.isDataExfiltration(activity)) {
      this.checkDataExfiltrationAlert(activity);
    }
  }

  /**
   * Check for failed login alerts
   */
  checkFailedLoginAlert(activity) {
    const userId = activity.userId || 'unknown';
    const userActivities = this.userActivities.get(userId) || [];
    
    const recentFailures = userActivities.filter(a => 
      a.action === 'login' && 
      a.result === 'failed' && 
      a.timestamp > Date.now() - 15 * 60 * 1000
    );
    
    if (recentFailures.length >= this.alertThresholds.failedLogins) {
      this.createAlert('brute_force', 'Multiple failed login attempts', {
        userId,
        failureCount: recentFailures.length,
        activities: recentFailures
      });
    }
  }

  /**
   * Check for suspicious IP alerts
   */
  checkSuspiciousIPAlert(activity) {
    const ip = activity.ipAddress || 'unknown';
    const ipActivities = this.ipActivities.get(ip) || [];
    
    const recentFailures = ipActivities.filter(a => 
      a.result === 'failed' && 
      a.timestamp > Date.now() - 5 * 60 * 1000
    );
    
    if (recentFailures.length >= this.alertThresholds.suspiciousIPs) {
      this.createAlert('suspicious_ip', 'Multiple failed requests from same IP', {
        ip,
        failureCount: recentFailures.length,
        activities: recentFailures
      });
    }
  }

  /**
   * Check for admin access alerts
   */
  checkAdminAccessAlert(activity) {
    const userId = activity.userId || 'unknown';
    const userActivities = this.userActivities.get(userId) || [];
    
    const recentAdminAccess = userActivities.filter(a => 
      a.isAdmin && 
      a.timestamp > Date.now() - 5 * 60 * 1000
    );
    
    if (recentAdminAccess.length >= this.alertThresholds.adminAccess) {
      this.createAlert('excessive_admin_access', 'Excessive admin activity detected', {
        userId,
        accessCount: recentAdminAccess.length,
        activities: recentAdminAccess
      });
    }
  }

  /**
   * Check for brute force alerts
   */
  checkBruteForceAlert(activity) {
    const ip = activity.ipAddress || 'unknown';
    const ipActivities = this.ipActivities.get(ip) || [];
    
    const recentAttempts = ipActivities.filter(a => 
      a.timestamp > Date.now() - 2 * 60 * 1000 // Last 2 minutes
    );
    
    if (recentAttempts.length >= this.alertThresholds.bruteForce) {
      this.createAlert('brute_force', 'Potential brute force attack', {
        ip,
        attemptCount: recentAttempts.length,
        activities: recentAttempts
      });
    }
  }

  /**
   * Check for data exfiltration alerts
   */
  checkDataExfiltrationAlert(activity) {
    if (activity.action.includes('download') || activity.action.includes('export')) {
      const userId = activity.userId || 'unknown';
      const userActivities = this.userActivities.get(userId) || [];
      
      const recentExports = userActivities.filter(a => 
        a.action.includes('download') || a.action.includes('export')
      );
      
      if (recentExports.length >= this.alertThresholds.dataExfiltration) {
        this.createAlert('data_exfiltration', 'Potential data exfiltration', {
          userId,
          exportCount: recentExports.length,
          activities: recentExports
        });
      }
    }
  }

  /**
   * Analyze patterns
   */
  analyzePatterns() {
    // Analyze user behavior patterns
    this.analyzeUserPatterns();
    
    // Analyze IP behavior patterns
    this.analyzeIPPatterns();
    
    // Analyze time-based patterns
    this.analyzeTimePatterns();
  }

  /**
   * Analyze user behavior patterns
   */
  analyzeUserPatterns() {
    for (const [userId, activities] of this.userActivities.entries()) {
      const recentActivities = activities.filter(a => 
        a.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
      );
      
      // Check for unusual activity times
      this.checkUnusualActivityTimes(userId, recentActivities);
      
      // Check for rapid successive actions
      this.checkRapidActions(userId, recentActivities);
    }
  }

  /**
   * Analyze IP behavior patterns
   */
  analyzeIPPatterns() {
    for (const [ip, activities] of this.ipActivities.entries()) {
      const recentActivities = activities.filter(a => 
        a.timestamp > Date.now() - 60 * 60 * 1000 // Last hour
      );
      
      // Check for scanning behavior
      this.checkScanningBehavior(ip, recentActivities);
      
      // Check for credential stuffing
      this.checkCredentialStuffing(ip, recentActivities);
    }
  }

  /**
   * Analyze time-based patterns
   */
  analyzeTimePatterns() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Check for unusual login times
    if (currentHour < 6 || currentHour > 22) {
      const nightActivities = this.activities.filter(a => {
        const activityTime = new Date(a.timestamp);
        return activityTime.getHours() < 6 || activityTime.getHours() > 22;
      });
      
      if (nightActivities.length > 10) {
        this.createAlert('unusual_time', 'Unusual activity detected during non-business hours', {
          hour: currentHour,
          activityCount: nightActivities.length
        });
      }
    }
  }

  /**
   * Check for unusual activity times
   */
  checkUnusualActivityTimes(userId, activities) {
    const userHours = activities.map(a => new Date(a.timestamp).getHours());
    const uniqueHours = new Set(userHours);
    
    // If user is active at unusual times
    if (uniqueHours.size > 10) {
      this.createAlert('unusual_hours', 'User active at unusual times', {
        userId,
        uniqueHours: uniqueHours.size
      });
    }
  }

  /**
   * Check for rapid successive actions
   */
  checkRapidActions(userId, activities) {
    if (activities.length < 3) return;
    
    const sortedActivities = activities.sort((a, b) => a.timestamp - b.timestamp);
    const timeDifferences = [];
    
    for (let i = 1; i < sortedActivities.length; i++) {
      const diff = sortedActivities[i].timestamp - sortedActivities[i-1].timestamp;
      timeDifferences.push(diff);
    }
    
    const avgDiff = timeDifferences.reduce((a, b) => a + b, 0) / timeDifferences.length;
    
    if (avgDiff < 1000) { // Less than 1 second between actions
      this.createAlert('rapid_actions', 'User performing actions very rapidly', {
        userId,
        avgInterval: avgDiff
      });
    }
  }

  /**
   * Check for scanning behavior
   */
  checkScanningBehavior(ip, activities) {
    const uniqueEndpoints = new Set(activities.map(a => a.resource));
    const uniqueMethods = new Set(activities.map(a => a.method));
    
    if (uniqueEndpoints.size > 20 && uniqueMethods.size > 3) {
      this.createAlert('scanning', 'Potential scanning behavior detected', {
        ip,
        uniqueEndpoints: uniqueEndpoints.size,
        uniqueMethods: uniqueMethods.size
      });
    }
  }

  /**
   * Check for credential stuffing
   */
  checkCredentialStuffing(ip, activities) {
    const loginAttempts = activities.filter(a => a.action === 'login');
    const uniqueUsers = new Set(loginAttempts.map(a => a.userId));
    
    if (loginAttempts.length > 10 && uniqueUsers.size > 5) {
      this.createAlert('credential_stuffing', 'Potential credential stuffing attack', {
        ip,
        attemptCount: loginAttempts.length,
        uniqueUsers: uniqueUsers.size
      });
    }
  }

  /**
   * Create alert
   */
  createAlert(type, message, details = {}) {
    const alertId = crypto.randomUUID();
    const alert = {
      id: alertId,
      type,
      message,
      details,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type),
      acknowledged: false
    };
    
    // Check cooldown
    const cooldownKey = `${type}-${details.userId || details.ip || 'unknown'}`;
    const lastAlert = this.alertCooldowns.get(cooldownKey);
    
    if (lastAlert && Date.now() - lastAlert < 10 * 60 * 1000) { // 10 minute cooldown
      return;
    }
    
    this.alerts.push(alert);
    this.alertCooldowns.set(cooldownKey, Date.now());
    this.stats.alertCount++;
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Log alert
    console.log(`[ALERT] ${type}: ${message}`, details);
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severityMap = {
      'brute_force': 'high',
      'suspicious_ip': 'high',
      'excessive_admin_access': 'medium',
      'data_exfiltration': 'critical',
      'scanning': 'high',
      'credential_stuffing': 'critical',
      'unusual_time': 'low',
      'unusual_hours': 'medium',
      'rapid_actions': 'medium'
    };
    
    return severityMap[type] || 'low';
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId) {
    const index = this.alerts.findIndex(a => a.id === alertId);
    if (index !== -1) {
      const alert = this.alerts.splice(index, 1)[0];
      alert.resolvedAt = Date.now();
      this.alertHistory.push(alert);
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(limit = 100) {
    return this.alerts.slice(-limit);
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit = 100) {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get user activity summary
   */
  getUserActivitySummary(userId) {
    const userActivities = this.userActivities.get(userId) || [];
    const recentActivities = userActivities.filter(a => 
      a.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    const actions = {};
    let failedCount = 0;
    let successCount = 0;
    
    recentActivities.forEach(activity => {
      actions[activity.action] = (actions[activity.action] || 0) + 1;
      if (activity.result === 'failed') {
        failedCount++;
      } else {
        successCount++;
      }
    });
    
    return {
      userId,
      totalActivities: recentActivities.length,
      failedActivities: failedCount,
      successfulActivities: successCount,
      successRate: recentActivities.length > 0 ? successCount / recentActivities.length : 0,
      actions,
      recentActivities: recentActivities.slice(-10)
    };
  }

  /**
   * Get IP activity summary
   */
  getIPActivitySummary(ip) {
    const ipActivities = this.ipActivities.get(ip) || [];
    const recentActivities = ipActivities.filter(a => 
      a.timestamp > Date.now() - 24 * 60 * 60 * 1000 // Last 24 hours
    );
    
    return {
      ip,
      totalActivities: recentActivities.length,
      uniqueUsers: new Set(recentActivities.map(a => a.userId)).size,
      uniqueEndpoints: new Set(recentActivities.map(a => a.resource)).size,
      recentActivities: recentActivities.slice(-10)
    };
  }

  /**
   * Cleanup old activities
   */
  cleanupActivities() {
    const cutoff = Date.now() - this.windowSize;
    this.activities = this.activities.filter(a => a.timestamp > cutoff);
  }

  /**
   * Cleanup old alerts
   */
  cleanupAlerts() {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // Last 24 hours
    this.alerts = this.alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    return {
      ...this.stats,
      activeAlerts: this.alerts.length,
      alertHistory: this.alertHistory.length,
      uniqueUsers: this.userActivities.size,
      uniqueIPs: this.ipActivities.size,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Reset monitoring statistics
   */
  resetStats() {
    this.stats = {
      totalActivities: 0,
      failedActivities: 0,
      successfulActivities: 0,
      alertCount: 0,
      blockedIPs: 0
    };
  }

  /**
   * Helper methods
   */
  isBruteForceAttempt(activity) {
    return activity.action === 'login' && 
           activity.result === 'failed' && 
           activity.userId !== 'unknown';
  }

  isDataExfiltration(activity) {
    return activity.action.includes('download') || 
           activity.action.includes('export') || 
           activity.action.includes('backup');
  }
}

module.exports = ActivityMonitor;