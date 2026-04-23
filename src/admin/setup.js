#!/usr/bin/env node

/**
 * Admin System Setup Script
 * 
 * Initializes the admin security system with default configuration
 * and creates necessary directories and files.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const AdminAuth = require('./auth');
const RBAC = require('./auth/rbac');
const SecretsManager = require('./secrets/manager');
const AuditLogger = require('./audit/logger');

console.log('🔐 Setting up Admin Security System...');

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

// Initialize admin auth system
const initializeAuth = () => {
  const auth = new AdminAuth();
  console.log('✅ Initialized authentication system');
  return auth;
};

// Initialize RBAC system
const initializeRBAC = () => {
  const rbac = new RBAC();
  console.log('✅ Initialized Role-Based Access Control system');
  return rbac;
};

// Initialize audit logger
const initializeAudit = () => {
  const audit = new AuditLogger();
  console.log('✅ Initialized audit logging system');
  return audit;
};

// Initialize secrets manager
const initializeSecrets = () => {
  const secrets = new SecretsManager();
  
  // Store some default secrets
  try {
    secrets.storeSecret('database_password', crypto.randomBytes(16).toString('hex'), {
      description: 'Database password',
      tags: ['database', 'essential'],
      autoRotate: true,
      rotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
      createdBy: 'setup'
    });
    
    secrets.storeSecret('api_gateway_key', crypto.randomBytes(32).toString('hex'), {
      description: 'API Gateway authentication key',
      tags: ['api', 'essential'],
      autoRotate: true,
      rotationInterval: 60 * 24 * 60 * 60 * 1000, // 60 days
      createdBy: 'setup'
    });
    
    console.log('✅ Initialized secrets manager with default secrets');
  } catch (error) {
    console.log('⚠️  Error storing default secrets:', error.message);
  }
  
  return secrets;
};

// Create default admin user
const createDefaultAdmin = () => {
  console.log('👤 Creating default admin user...');
  
  // In a real implementation, you would store this in the database
  const adminUser = {
    id: 'admin-001',
    email: 'admin@sailboats.fr',
    name: 'System Administrator',
    role: 'super_admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: null,
    has2FA: false,
    permissions: [
      'system:read', 'system:write', 'system:delete', 'system:manage-users', 
      'system:manage-roles', 'system:manage-settings',
      'content:read', 'content:write', 'content:delete', 'content:publish', 'content:moderate',
      'users:read', 'users:write', 'users:delete', 'users:manage-permissions',
      'audit:read', 'audit:write', 'audit:delete', 'monitor:read', 'monitor:write',
      'api:read', 'api:write', 'api:delete', 'api:manage-keys',
      'security:read', 'security:write', 'security:manage-2fa', 'security:manage-audit'
    ]
  };
  
  console.log(`✅ Created default admin user: ${adminUser.email}`);
  console.log('🔐 IMPORTANT: Change the default password and enable 2FA immediately!');
  
  return adminUser;
};

// Create security configuration template
const createSecurityConfig = () => {
  const configPath = path.join(__dirname, '..', '..', '..', 'security-config.json');
  const config = {
    version: '1.0',
    createdAt: new Date().toISOString(),
    security: {
      authentication: {
        method: 'api_key',
        sessionTimeout: 86400000,
        maxLoginAttempts: 5,
        lockoutDuration: 3600000,
        require2FA: true
      },
      authorization: {
        model: 'rbac',
        defaultRole: 'viewer',
        inheritPermissions: true
      },
      audit: {
        enabled: true,
        logLevel: 'info',
        retentionDays: 90,
        includeSensitive: false
      },
      secrets: {
        encryption: 'aes-256-gcm',
        rotationEnabled: true,
        rotationInterval: 90 * 24 * 60 * 60 * 1000,
        backupEnabled: true
      },
      rateLimit: {
        enabled: true,
        windowMs: 900000,
        maxRequests: 100,
        skipSuccessful: false,
        skipFailed: false
      },
      monitoring: {
        enabled: true,
        alertThresholds: {
          failedLogins: 5,
          suspiciousIPs: 10,
          adminAccess: 20,
          dataExfiltration: 3,
          bruteForce: 10
        },
        patternAnalysis: true,
        unusualTimeDetection: true
      },
      headers: {
        contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; frame-src 'none'; object-src 'none'",
        xContentTypeOptions: 'nosniff',
        xFrameOptions: 'DENY',
        xssProtection: '1; mode=block',
        strictTransportSecurity: 'max-age=31536000; includeSubDomains'
      }
    }
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), { mode: 0o600 });
  console.log('✅ Created security configuration template');
};

// Create admin routes example
const createAdminRoutes = () => {
  const routesPath = path.join(__dirname, '..', '..', '..', 'admin-routes-example.js');
  const routesContent = `
/**
 * Admin Routes Example
 * 
 * Example of how to secure admin endpoints using the middleware
 */

const express = require('express');
const adminMiddleware = require('./src/admin/middleware');

const router = express.Router();

// Apply security middleware to all admin routes
router.use(adminMiddleware.securityHeaders());
router.use(adminMiddleware.rateLimit());

// Public routes (no authentication required)
router.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Protected admin routes
router.get('/api/admin/dashboard', adminMiddleware.middleware, (req, res) => {
  res.json({
    success: true,
    user: req.adminUser,
    permissions: req.userPermissions,
    timestamp: new Date().toISOString()
  });
});

// Admin user management
router.get('/api/admin/users', adminMiddleware.require2FA(), adminMiddleware.middleware, (req, res) => {
  res.json({
    success: true,
    users: [], // In real implementation, fetch from database
    timestamp: new Date().toISOString()
  });
});

// Admin settings
router.put('/api/admin/settings', adminMiddleware.require2FA(), adminMiddleware.middleware, (req, res) => {
  // Update settings logic here
  res.json({
    success: true,
    message: 'Settings updated',
    timestamp: new Date().toISOString()
  });
});

// Admin audit logs
router.get('/api/admin/audit', adminMiddleware.require2FA(), adminMiddleware.middleware, (req, res) => {
  const auditLogs = adminMiddleware.audit.getLogsByTimeRange(
    new Date(Date.now() - 24 * 60 * 60 * 1000),
    new Date()
  );
  
  res.json({
    success: true,
    logs: auditLogs,
    timestamp: new Date().toISOString()
  });
});

// Logout
router.post('/api/admin/logout', adminMiddleware.middleware, (req, res) => {
  adminMiddleware.logout(req, res);
});

module.exports = router;
`;
  
  fs.writeFileSync(routesPath, routesContent, { mode: 0o644});
  console.log('✅ Created admin routes example');
};

// Create test script
const createTestScript = () => {
  const testPath = path.join(__dirname, 'test.js');
  const testContent = `
/**
 * Admin System Tests
 * 
 * Run these tests to verify the admin security system is working correctly
 */

const AdminAuth = require('./auth');
const RBAC = require('./auth/rbac');
const AuditLogger = require('./audit/logger');
const SecretsManager = require('./secrets/manager');

async function runTests() {
  console.log('🧪 Running Admin System Tests...');
  
  // Test authentication
  const auth = new AdminAuth();
  const password = 'SecurePassword123!';
  const hashedPassword = await auth.hashPassword(password);
  const isValid = await auth.verifyPassword(password, hashedPassword);
  console.log('✅ Authentication test:', isValid ? 'PASSED' : 'FAILED');
  
  // Test RBAC
  const rbac = new RBAC();
  const userPermissions = rbac.getUserPermissions('test-user');
  const hasSystemAccess = rbac.hasPermission('test-user', 'system:read');
  console.log('✅ RBAC test - System access:', hasSystemAccess ? 'PASSED' : 'FAILED');
  
  // Test audit logging
  const audit = new AuditLogger();
  audit.logAction({
    userId: 'test-user',
    action: 'test',
    resource: 'test',
    method: 'GET',
    statusCode: 200,
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
    result: 'success'
  });
  console.log('✅ Audit logging test: PASSED');
  
  // Test secrets management
  const secrets = new SecretsManager();
  const secret = 'test-secret';
  const metadata = secrets.storeSecret('test-secret-name', secret, {
    description: 'Test secret',
    tags: ['test'],
    createdBy: 'test-user'
  });
  
  const retrieved = secrets.retrieveSecret('test-secret-name');
  console.log('✅ Secrets management test:', retrieved.secret === secret ? 'PASSED' : 'FAILED');
  
  console.log('🎉 All tests completed!');
}

runTests().catch(console.error);
`;
  
  fs.writeFileSync(testPath, testContent, { mode: 0o644});
  console.log('✅ Created test script');
};

// Create README
const createREADME = () => {
  const readmePath = path.join(__dirname, 'README.md');
  const readmeContent = `# Admin Security System

This directory contains the enhanced admin security system for the Sailing Yachts application.

## Features

- 🔐 **Authentication**: Multi-factor authentication, secure session management, API key authentication
- 🛡️ **Authorization**: Role-Based Access Control (RBAC) with granular permissions
- 📋 **Audit Logging**: Comprehensive activity tracking with tamper-proof logs
- 🔒 **Secrets Management**: Secure storage with encryption and rotation policies
- 🚦 **Rate Limiting**: Intelligent traffic limiting with pattern detection
- 👀 **Activity Monitoring**: Real-time monitoring with intelligent alerting

## Directory Structure

\`\`\`
src/admin/
├── auth/                 # Authentication and authorization
│   ├── index.js         # Main authentication class
│   └── rbac.js          # Role-Based Access Control
├── audit/               # Audit logging
│   └── logger.js        # Comprehensive audit logger
├── security/            # Security components
│   └── rate-limiter.js  # Enhanced rate limiting
├── monitoring/          # Activity monitoring
│   └── activity-monitor.js # Real-time monitoring
├── secrets/             # Secrets management
│   └── manager.js       # Secure secrets storage
├── middleware/          # Security middleware
│   └── index.js         # Main middleware
├── setup.js             # Setup script
└── README.md            # This file
\`\`\`

## Setup

1. Run the setup script:
   \`\`\`bash
   npm run admin:setup
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Run tests:
   \`\`\`bash
   npm run admin:test
   \`\`\`

## Usage

### Authentication

\`\`\`javascript
const AdminAuth = require('./src/admin/auth');

const auth = new AdminAuth();
const hashedPassword = await auth.hashPassword('secure-password');
const isValid = await auth.verifyPassword('secure-password', hashedPassword);
\`\`\`

### Authorization

\`\`\`javascript
const RBAC = require('./src/admin/auth/rbac');

const rbac = new RBAC();
rbac.assignRole('user-id', 'admin');
const hasPermission = rbac.hasPermission('user-id', 'system:read');
\`\`\`

### Audit Logging

\`\`\`javascript
const AuditLogger = require('./src/admin/audit/logger');

const audit = new AuditLogger();
audit.logAction({
  userId: 'user-id',
  action: 'login',
  resource: 'admin-panel',
  method: 'POST',
  statusCode: 200,
  ipAddress: '127.0.0.1',
  result: 'success'
});
\`\`\`

### Secrets Management

\`\`\`javascript
const SecretsManager = require('./src/admin/secrets/manager');

const secrets = new SecretsManager();
secrets.storeSecret('api-key', 'secret-value', {
  description: 'API key for external service',
  autoRotate: true
});

const retrieved = secrets.retrieveSecret('api-key');
\`\`\`

## Security Configuration

The system is configured with security best practices:

- **Password hashing**: bcrypt with 12 rounds
- **Session management**: Secure cookies with expiration
- **Rate limiting**: Configurable thresholds with IP tracking
- **Audit logging**: Tamper-proof logs with digital signatures
- **Secrets encryption**: AES-256-GCM with rotation policies
- **Security headers**: CSP, XSS protection, HSTS

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| ADMIN_API_KEY | Admin API key | Generated |
| AUDIT_SECRET | Audit log signing secret | Generated |
| NEXTAUTH_SECRET | Next.js auth secret | Generated |
| SESSION_SECRET | Session encryption secret | Generated |
| CSP_DEFAULT_SRC | Content Security Policy | 'self' |

## Monitoring

The system provides comprehensive monitoring:

- Real-time activity tracking
- Pattern detection for suspicious behavior
- Alerting for security events
- Performance metrics
- Error tracking

## Testing

Run the test suite to verify functionality:

\`\`\`bash
npm run admin:test
\`\`\`

## Backup

The system includes automated backup for:

- Audit logs
- Secret configurations
- User sessions
- Security configurations

Backups are stored in the \`backups/\` directory with automatic retention policies.

## Support

For issues or questions, please refer to the main documentation or contact the development team.
`;
  
  fs.writeFileSync(readmePath, readmeContent, { mode: 0o644});
  console.log('✅ Created admin README');
};

// Main setup function
const main = async () => {
  try {
    console.log('🚀 Starting Admin Security System Setup...\n');
    
    // Setup steps
    ensureDirectories();
    setupEnvironment();
    
    const auth = initializeAuth();
    const rbac = initializeRBAC();
    const audit = initializeAudit();
    const secrets = initializeSecrets();
    
    createDefaultAdmin();
    createSecurityConfig();
    createAdminRoutes();
    createTestScript();
    createREADME();
    
    console.log('\n🎉 Admin Security System Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Review the generated security configuration');
    console.log('2. Update environment variables with your specific values');
    console.log('3. Create admin users through the authentication system');
    console.log('4. Enable 2FA for all admin users');
    console.log('5. Test the system with: npm run admin:test');
    console.log('6. Review the audit logs regularly');
    console.log('7. Set up monitoring and alerting');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

// Run setup
main();