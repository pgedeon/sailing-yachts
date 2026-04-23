
/**
 * Basic Audit Logging Module
 */

const fs = require('fs');
const path = require('path');

class BasicAudit {
  constructor() {
    this.logDirectory = path.join(__dirname, '..', '..', '..', 'logs', 'audit');
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDirectory)) {
      fs.mkdirSync(this.logDirectory, { recursive: true });
    }
  }

  logAction(action, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      id: crypto.randomUUID()
    };

    const logFile = path.join(this.logDirectory, `audit-${new Date().toISOString().split('T')[0]}.log`);
    const logLine = JSON.stringify(logEntry) + '\n';
    
    fs.appendFileSync(logFile, logLine, 'utf8');
    console.log('[AUDIT]', action, details);
  }
}

module.exports = BasicAudit;
