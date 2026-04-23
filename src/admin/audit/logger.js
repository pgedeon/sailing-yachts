/**
 * Audit Logger for Admin Actions
 * 
 * Comprehensive audit logging with user attribution, action tracking,
 * and secure storage of audit trails.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class AuditLogger {
  constructor() {
    this.logDirectory = path.join(__dirname, '..', '..', '..', 'logs', 'audit');
    this.ensureLogDirectory();
    this.currentLogFile = this.getCurrentLogFile();
  }

  /**
   * Ensure audit log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  /**
   * Get current audit log file name (rotated daily)
   */
  getCurrentLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDirectory, `audit-${date}.log`);
  }

  /**
   * Log admin action with comprehensive details
   */
  logAction({
    userId,
    action,
    resource,
    resourceId,
    method,
    statusCode,
    ipAddress,
    userAgent,
    sessionId,
    details = {},
    result = 'success',
    errorMessage = null,
    severity = 'info' // info, warn, error, critical
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId,
      action,
      resource,
      resourceId,
      method,
      statusCode,
      ipAddress,
      userAgent,
      sessionId,
      details,
      result,
      errorMessage,
      severity,
      // Calculate signature for integrity verification
      signature: this.generateSignature(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId,
        action,
        resource,
        resourceId,
        method,
        statusCode,
        ipAddress,
        userAgent,
        sessionId,
        details,
        result,
        errorMessage,
        severity
      }))
    };

    this.writeLogEntry(logEntry);
    this.rotateLogsIfNeeded();
  }

  /**
   * Write log entry to file
   */
  writeLogEntry(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Ensure we're using the current log file (in case of day rollover)
      this.currentLogFile = this.getCurrentLogFile();
      
      fs.appendFileSync(this.currentLogFile, logLine, 'utf8');
      
      // Also write to console for development (with different colors based on severity)
      this.logToConsole(logEntry);
      
    } catch (error) {
      console.error('Failed to write audit log:', error);
    }
  }

  /**
   * Log to console with severity-based coloring
   */
  logToConsole(logEntry) {
    const timestamp = new Date(logEntry.timestamp).toLocaleString();
    const { userId, action, resource, result, severity } = logEntry;
    
    const colorMap = {
      info: '\x1b[36m',     // Cyan
      warn: '\x1b[33m',     // Yellow
      error: '\x1b[31m',    // Red
      critical: '\x1b[35m'  // Magenta
    };
    
    const color = colorMap[severity] || '\x1b[0m';
    const reset = '\x1b[0m';
    
    console.log(`${color}[AUDIT] ${timestamp} | User: ${userId} | Action: ${action} | Resource: ${resource} | Result: ${result}${reset}`);
  }

  /**
   * Generate signature for log integrity
   */
  generateSignature(data) {
    const hmac = crypto.createHmac('sha256', process.env.AUDIT_SECRET || process.env.NEXTAUTH_SECRET);
    return hmac.update(data).digest('hex');
  }

  /**
   * Verify log entry integrity
   */
  verifyLogSignature(logEntry) {
    const data = JSON.stringify({
      timestamp: logEntry.timestamp,
      userId: logEntry.userId,
      action: logEntry.action,
      resource: logEntry.resource,
      resourceId: logEntry.resourceId,
      method: logEntry.method,
      statusCode: logEntry.statusCode,
      ipAddress: logEntry.ipAddress,
      userAgent: logEntry.userAgent,
      sessionId: logEntry.sessionId,
      details: logEntry.details,
      result: logEntry.result,
      errorMessage: logEntry.errorMessage,
      severity: logEntry.severity
    });
    
    const expectedSignature = this.generateSignature(data);
    return logEntry.signature === expectedSignature;
  }

  /**
   * Get audit logs for a specific time range
   */
  getLogsByTimeRange(startTime, endTime) {
    const logs = [];
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Find all relevant log files in the time range
    const logFiles = fs.readdirSync(this.logDirectory)
      .filter(file => file.startsWith('audit-') && file.endsWith('.log'))
      .map(file => path.join(this.logDirectory, file))
      .sort();
    
    for (const logFile of logFiles) {
      try {
        const fileContent = fs.readFileSync(logFile, 'utf8');
        const lines = fileContent.trim().split('\n');
        
        for (const line of lines) {
          if (line) {
            const logEntry = JSON.parse(line);
            const logDate = new Date(logEntry.timestamp);
            
            if (logDate >= startDate && logDate <= endDate) {
              logs.push(logEntry);
            }
          }
        }
      } catch (error) {
        console.error(`Error reading log file ${logFile}:`, error);
      }
    }
    
    return logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Get audit logs for a specific user
   */
  getLogsByUser(userId, limit = 100) {
    const allLogs = this.getLogsByTimeRange(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      new Date()
    );
    
    return allLogs
      .filter(log => log.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get audit logs for a specific action
   */
  getLogsByAction(action, limit = 100) {
    const allLogs = this.getLogsByTimeRange(
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      new Date()
    );
    
    return allLogs
      .filter(log => log.action === action)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Get security-related logs (failures, critical actions)
   */
  getSecurityLogs(severity = ['error', 'critical'], limit = 100) {
    const allLogs = this.getLogsByTimeRange(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      new Date()
    );
    
    return allLogs
      .filter(log => severity.includes(log.severity))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Check if logs need rotation (daily)
   */
  rotateLogsIfNeeded() {
    const today = new Date().toISOString().split('T')[0];
    const logFileDate = this.currentLogFile.split('-').pop().replace('.log', '');
    
    if (today !== logFileDate) {
      this.currentLogFile = this.getCurrentLogFile();
    }
  }

  /**
   * Clean old audit logs (keep last 90 days)
   */
  cleanupOldLogs() {
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];
    
    try {
      const logFiles = fs.readdirSync(this.logDirectory);
      
      for (const file of logFiles) {
        if (file.startsWith('audit-') && file.endsWith('.log')) {
          const fileDate = file.split('-').pop().replace('.log', '');
          
          if (fileDate < cutoffDateString) {
            const filePath = path.join(this.logDirectory, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted old audit log: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Error cleaning up old audit logs:', error);
    }
  }

  /**
   * Generate audit report
   */
  generateReport(options = {}) {
    const {
      startTime = new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      endTime = new Date(),
      userId,
      action,
      severity
    } = options;
    
    let logs = this.getLogsByTimeRange(startTime, endTime);
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId);
    }
    
    if (action) {
      logs = logs.filter(log => log.action === action);
    }
    
    if (severity) {
      logs = logs.filter(log => log.severity === severity);
    }
    
    const report = {
      summary: {
        totalActions: logs.length,
        successfulActions: logs.filter(log => log.result === 'success').length,
        failedActions: logs.filter(log => log.result === 'failed').length,
        criticalActions: logs.filter(log => log.severity === 'critical').length,
        uniqueUsers: new Set(logs.map(log => log.userId)).size,
        timeRange: {
          start: startTime.toISOString(),
          end: endTime.toISOString()
        }
      },
      actions: logs.reduce((acc, log) => {
        const actionCount = acc[log.action] || 0;
        acc[log.action] = actionCount + 1;
        return acc;
      }, {}),
      users: logs.reduce((acc, log) => {
        const userCount = acc[log.userId] || 0;
        acc[log.userId] = userCount + 1;
        return acc;
      }, {}),
      resources: logs.reduce((acc, log) => {
        const resourceCount = acc[log.resource] || 0;
        acc[log.resource] = resourceCount + 1;
        return acc;
      }, {})
    };
    
    return report;
  }
}

module.exports = AuditLogger;