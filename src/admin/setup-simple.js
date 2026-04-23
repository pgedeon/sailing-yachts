#!/usr/bin/env node

/**
 * Simple Admin System Setup Script
 * 
 * Initializes basic admin security components without complex dependencies.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🔐 Setting up Admin Security System (Simple)...');

// Ensure required directories exist
const ensureDirectories = () => {
  const directories = [
    path.join(__dirname, '..', '..', '..', 'logs', 'audit'),
    path.join(__dirname, '..', '..', '..', 'secrets'),
    path.join(__dirname, '..', '..', '..', 'backups')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Generate secure API key
const generateApiKey = () => {
  const apiKey = crypto.randomBytes(32).toString('hex');
  console.log(`🔑 Generated API key: ${apiKey.substring(0, 16)}...${apiKey.substring(-16)}`);
  return apiKey;
};

// Setup environment file
const setupEnvironment = () => {
  const envPath = path.join(__dirname, '..', '..', '..', '.env');
  const apiKey = generateApiKey();
  
  const envContent = `# Database Configuration
DATABASE_URL=postgresql://neondb_owner:npg_3azLQtYjN0WM@ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Admin Configuration
ADMIN_API_KEY=${apiKey}
AUDIT_SECRET=${crypto.randomBytes(32).toString('hex')}

# Authentication
NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('hex')}
NEXT_PUBLIC_APP_URL=https://info.sailboats.fr

# Security Headers
CSP_DEFAULT_SRC='self'
CSP_SCRIPT_SRC='self' 'unsafe-inline'
CSP_STYLE_SRC='self' 'unsafe-inline'
CSP_IMG_SRC='self' data: https:
CSP_CONNECT_SRC='self' https:
CSP_FRAME_SRC='none'
CSP_OBJECT_SRC='none'

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Session Settings
SESSION_TIMEOUT_MS=86400000
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}

# 2FA Settings
OTP_ISSUER=Sailing Yachts
OTP_ISSUER_URL=https://info.sailboats.fr

# Monitoring
MONITORING_ENABLED=true
ALERT_EMAIL=admin@sailboats.fr
ALERT_WEBHOOK_URL=

# Backup
BACKUP_ENABLED=true
BACKUP_INTERVAL_MS=86400000
BACKUP_RETENTION_DAYS=30
`;

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent, { mode: 0o600 });
    console.log('✅ Created .env file with secure configuration');
  } else {
    console.log('⚠️  .env file already exists, skipping creation');
  }
};

// Create basic auth module
const createBasicAuth = () => {
  const authPath = path.join(__dirname, 'auth', 'basic.js');
  const authContent = `
/**
 * Basic Authentication Module
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class BasicAuth {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.failedAttempts = new Map();
  }

  hashPassword(password) {
    return bcrypt.hash(password, 12);
  }

  verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  validateApiKey(apiKey) {
    const validApiKey = process.env.ADMIN_API_KEY;
    return apiKey === validApiKey;
  }
}

module.exports = BasicAuth;
`;

  fs.writeFileSync(authPath, authContent, { mode: 0o644});
  console.log('✅ Created basic authentication module');
};

// Create basic audit module
const createBasicAudit = () => {
  const auditPath = path.join(__dirname, 'audit', 'basic.js');
  const auditContent = `
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

    const logFile = path.join(this.logDirectory, \`audit-\${new Date().toISOString().split('T')[0]}.log\`);
    const logLine = JSON.stringify(logEntry) + '\\n';
    
    fs.appendFileSync(logFile, logLine, 'utf8');
    console.log('[AUDIT]', action, details);
  }
}

module.exports = BasicAudit;
`;

  fs.writeFileSync(auditPath, auditContent, { mode: 0o644});
  console.log('✅ Created basic audit logging module');
};

// Create basic middleware
const createBasicMiddleware = () => {
  const middlewarePath = path.join(__dirname, 'middleware', 'basic.js');
  const middlewareContent = `
/**
 * Basic Security Middleware
 */

const BasicAuth = require('../auth/basic');

class BasicMiddleware {
  constructor() {
    this.auth = new BasicAuth();
  }

  middleware(req, res, next) {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API key required' });
    }

    if (!this.auth.validateApiKey(apiKey)) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.adminUser = { id: 'admin', email: 'admin@sailboats.fr' };
    next();
  }
}

module.exports = BasicMiddleware;
`;

  fs.writeFileSync(middlewarePath, middlewareContent, { mode: 0o644});
  console.log('✅ Created basic security middleware');
};

// Create admin routes example
const createAdminRoutes = () => {
  const routesPath = path.join(__dirname, '..', '..', '..', 'admin-routes.js');
  const routesContent = `
/**
 * Basic Admin Routes Example
 */

const express = require('express');
const BasicMiddleware = require('./src/admin/middleware/basic');

const router = express.Router();

// Apply basic authentication middleware
router.use(BasicMiddleware.middleware);

// Admin dashboard
router.get('/admin/dashboard', (req, res) => {
  res.json({
    success: true,
    user: req.adminUser,
    message: 'Admin dashboard accessible',
    timestamp: new Date().toISOString()
  });
});

// Admin users
router.get('/admin/users', (req, res) => {
  res.json({
    success: true,
    users: [],
    message: 'Users endpoint accessible',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
`;

  fs.writeFileSync(routesPath, routesContent, { mode: 0o644});
  console.log('✅ Created basic admin routes');
};

// Create test script
const createTestScript = () => {
  const testPath = path.join(__dirname, 'test-basic.js');
  const testContent = `
/**
 * Basic Admin System Tests
 */

const BasicAuth = require('./auth/basic');

async function runTests() {
  console.log('🧪 Running Basic Admin System Tests...');
  
  const auth = new BasicAuth();
  
  // Test password hashing
  const password = 'TestPassword123!';
  const hash = await auth.hashPassword(password);
  const isValid = await auth.verifyPassword(password, hash);
  
  console.log('✅ Password hashing test:', isValid ? 'PASSED' : 'FAILED');
  
  // Test API key validation
  const testApiKey = 'test-key';
  process.env.ADMIN_API_KEY = testApiKey;
  const isValidKey = auth.validateApiKey(testApiKey);
  
  console.log('✅ API key validation test:', isValidKey ? 'PASSED' : 'FAILED');
  
  console.log('🎉 Basic tests completed!');
}

runTests().catch(console.error);
`;

  fs.writeFileSync(testPath, testContent, { mode: 0o644});
  console.log('✅ Created basic test script');
};

// Create README
const createREADME = () => {
  const readmePath = path.join(__dirname, 'README.md');
  const readmeContent = `# Admin Security System (Simple)

This directory contains the basic admin security system for the Sailing Yachts application.

## Features

- 🔐 **Basic Authentication**: Simple API key authentication
- 📋 **Audit Logging**: Basic activity tracking
- 🛡️ **Security Middleware**: Basic protection for admin routes

## Directory Structure

\`\`\`
src/admin/
├── auth/                 # Authentication modules
│   ├── basic.js         # Basic authentication
├── audit/               # Audit logging
│   └── basic.js        # Basic audit logger
├── middleware/          # Security middleware
│   └── basic.js         # Basic middleware
├── setup-simple.js     # This setup script
├── test-basic.js       # Basic tests
└── README.md           # This file
\`\`\`

## Setup

1. Run the setup script:
   \`\`\`bash
   node src/admin/setup-simple.js
   \`\`\`

2. Run basic tests:
   \`\`\`bash
   node src/admin/test-basic.js
   \`\`\`

## Usage

### Basic Authentication

\`\`\`javascript
const BasicAuth = require('./src/admin/auth/basic');

const auth = new BasicAuth();
const hash = await auth.hashPassword('password');
const isValid = await auth.verifyPassword('password', hash);
\`\`\`

### Middleware Usage

\`\`\`javascript
const BasicMiddleware = require('./src/admin/middleware/basic');

router.use(BasicMiddleware.middleware);
\`\`\`

## Next Steps

1. Expand the basic modules with additional security features
2. Add database integration for user management
3. Implement 2FA and session management
4. Add comprehensive audit logging
5. Implement rate limiting and monitoring

## Security Notes

This is a basic implementation. For production use, consider:

- Using a proper database for user management
- Implementing session management
- Adding 2FA support
- Implementing comprehensive audit logging
- Adding rate limiting and monitoring
- Using proper HTTPS and security headers
`;

  fs.writeFileSync(readmePath, readmeContent, { mode: 0o644});
  console.log('✅ Created basic README');
};

// Main setup function
const main = async () => {
  try {
    console.log('🚀 Starting Simple Admin Security System Setup...\n');
    
    // Setup steps
    ensureDirectories();
    setupEnvironment();
    
    createBasicAuth();
    createBasicAudit();
    createBasicMiddleware();
    createAdminRoutes();
    createTestScript();
    createREADME();
    
    console.log('\n🎉 Simple Admin Security System Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the basic system: node src/admin/test-basic.js');
    console.log('2. Review the generated files');
    console.log('3. Integrate with your application');
    console.log('4. Expand functionality as needed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

// Run setup
main();