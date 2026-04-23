# Admin Security System (Simple)

This directory contains the basic admin security system for the Sailing Yachts application.

## Features

- 🔐 **Basic Authentication**: Simple API key authentication
- 📋 **Audit Logging**: Basic activity tracking
- 🛡️ **Security Middleware**: Basic protection for admin routes

## Directory Structure

```
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
```

## Setup

1. Run the setup script:
   ```bash
   node src/admin/setup-simple.js
   ```

2. Run basic tests:
   ```bash
   node src/admin/test-basic.js
   ```

## Usage

### Basic Authentication

```javascript
const BasicAuth = require('./src/admin/auth/basic');

const auth = new BasicAuth();
const hash = await auth.hashPassword('password');
const isValid = await auth.verifyPassword('password', hash);
```

### Middleware Usage

```javascript
const BasicMiddleware = require('./src/admin/middleware/basic');

router.use(BasicMiddleware.middleware);
```

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
