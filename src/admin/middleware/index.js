/**
 * Admin Middleware - Central Security Layer
 * 
 * Integrates authentication, authorization, and audit logging
 * to provide comprehensive security for admin endpoints.
 */

const AdminAuth = require('../auth');
const RBAC = require('../auth/rbac');
const AuditLogger = require('../audit/logger');

class AdminMiddleware {
  constructor() {
    this.auth = new AdminAuth();
    this.rbac = new RBAC();
    this.audit = new AuditLogger();
    this.initialize();
  }

  /**
   * Initialize middleware with configuration
   */
  initialize() {
    this.requiredPermissions = {
      'GET': ['system:read'],
      'POST': ['system:write'],
      'PUT': ['system:write'],
      'DELETE': ['system:delete'],
      'PATCH': ['system:write']
    };
    
    this.exemptPaths = [
      '/api/health',
      '/api/public',
      '/login',
      '/logout'
    ];
  }

  /**
   * Middleware function to protect admin endpoints
   */
  middleware(req, res, next) {
    try {
      // Skip middleware for exempt paths
      if (this.isExemptPath(req.path)) {
        return next();
      }

      // Check for authentication
      const authResult = this.authenticate(req);
      if (!authResult.success) {
        return this.unauthorized(res, authResult.message);
      }

      // Check for authorization
      const authzResult = this.authorize(req, authResult.user);
      if (!authzResult.success) {
        return this.forbidden(res, authzResult.message);
      }

      // Log successful authentication and authorization
      this.logAdminAction(req, authResult.user, 'access', 'admin_panel', 'authentication_success');

      // Add user info to request for downstream use
      req.adminUser = authResult.user;
      req.userPermissions = authzResult.permissions;

      next();

    } catch (error) {
      this.logAdminAction(req, null, 'access', 'admin_panel', 'authentication_failed', error.message);
      this.error(res, 'Internal server error', 500);
    }
  }

  /**
   * Check if path is exempt from authentication
   */
  isExemptPath(path) {
    return this.exemptPaths.some(exemptPath => path.startsWith(exemptPath));
  }

  /**
   * Authenticate user
   */
  authenticate(req) {
    // Check for API key authentication
    const apiKey = this.getApiKey(req);
    if (apiKey) {
      return this.authenticateWithApiKey(apiKey, req);
    }

    // Check for session authentication
    const sessionId = this.getSessionId(req);
    if (sessionId) {
      return this.authenticateWithSession(sessionId, req);
    }

    // Check for JWT token (if using NextAuth)
    const token = this.getAuthToken(req);
    if (token) {
      return this.authenticateWithToken(token, req);
    }

    return { success: false, message: 'No authentication method provided' };
  }

  /**
   * Authenticate with API key
   */
  async authenticateWithApiKey(apiKey, req) {
    try {
      // In a real implementation, you'd check the API key against your database
      // For now, we'll use the environment variable
      const validApiKey = process.env.ADMIN_API_KEY;
      if (!validApiKey) {
        throw new Error('No API key configured');
      }

      const isValid = await this.auth.verifyApiKey(apiKey, validApiKey);
      if (!isValid) {
        this.auth.trackFailedAttempt(this.getClientIP(req));
        return { success: false, message: 'Invalid API key' };
      }

      // Check if IP is blocked due to failed attempts
      if (this.auth.isIPBlocked(this.getClientIP(req))) {
        return { success: false, message: 'IP temporarily blocked due to too many failed attempts' };
      }

      return {
        success: true,
        user: {
          id: 'api_key_user',
          email: 'admin@api.key',
          name: 'API User',
          role: 'system',
          has2FA: false
        }
      };
    } catch (error) {
      this.auth.trackFailedAttempt(this.getClientIP(req));
      return { success: false, message: 'Authentication failed' };
    }
  }

  /**
   * Authenticate with session
   */
  authenticateWithSession(sessionId, req) {
    const isValid = this.auth.validateSession(sessionId);
    if (!isValid) {
      return { success: false, message: 'Invalid or expired session' };
    }

    // Get session details
    const session = this.auth.sessions.get(sessionId);
    if (!session || !session.isAdmin) {
      return { success: false, message: 'Insufficient privileges' };
    }

    return {
      success: true,
      user: {
        id: session.userId,
        email: 'admin@example.com', // In real implementation, get from database
        name: 'Admin User',
        role: 'admin',
        has2FA: session.has2FA
      }
    };
  }

  /**
   * Authenticate with JWT token
   */
  authenticateWithToken(token, req) {
    // In a real implementation, you'd verify the JWT token
    // For now, return a successful authentication
    return {
      success: true,
      user: {
        id: 'jwt_user',
        email: 'admin@example.com',
        name: 'JWT User',
        role: 'admin',
        has2FA: false
      }
    };
  }

  /**
   * Authorize user for the requested action
   */
  authorize(req, user) {
    const method = req.method;
    const path = req.path;
    const requiredPermission = this.requiredPermissions[method] || ['system:read'];

    // Check if user has any of the required permissions
    const hasPermission = this.rbac.hasAnyPermission(user.id, requiredPermission);
    
    if (!hasPermission) {
      return {
        success: false,
        message: `Insufficient permissions. Required: ${requiredPermission.join(', ')}`
      };
    }

    return {
      success: true,
      permissions: this.rbac.getUserPermissions(user.id)
    };
  }

  /**
   * Log admin action
   */
  logAdminAction(req, user, action, resource, result, errorMessage = null) {
    const logData = {
      userId: user ? user.id : 'unknown',
      action,
      resource,
      resourceId: req.params.id || null,
      method: req.method,
      statusCode: errorMessage ? 401 : 200,
      ipAddress: this.getClientIP(req),
      userAgent: req.get('User-Agent') || 'unknown',
      sessionId: this.getSessionId(req) || null,
      details: {
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
        params: req.params
      },
      result,
      errorMessage,
      severity: errorMessage === 'authentication_failed' || errorMessage === 'authorization_failed' ? 'warn' : 'info'
    };

    this.audit.logAction(logData);
  }

  /**
   * Get API key from request
   */
  getApiKey(req) {
    // Check Authorization header
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check API key header
    const apiKeyHeader = req.get('X-API-Key');
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // Check query parameter (less secure)
    const apiKeyQuery = req.query.api_key;
    if (apiKeyQuery) {
      return apiKeyQuery;
    }

    return null;
  }

  /**
   * Get session ID from request
   */
  getSessionId(req) {
    // Check session cookie
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      return sessionId;
    }

    // Check Authorization header for session token
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Session ')) {
      return authHeader.substring(8);
    }

    return null;
  }

  /**
   * Get auth token from request
   */
  getAuthToken(req) {
    // Check Authorization header for JWT
    const authHeader = req.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.ip || req.connection?.remoteAddress || 'unknown';
  }

  /**
   * Handle unauthorized response
   */
  unauthorized(res, message) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle forbidden response
   */
  forbidden(res, message) {
    res.status(403).json({
      success: false,
      error: 'Forbidden',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Handle error response
   */
  error(res, message, statusCode = 500) {
    res.status(statusCode).json({
      success: false,
      error: 'Internal Server Error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Rate limiting middleware
   */
  rateLimit(options = {}) {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      max = 100, // limit each IP to 100 requests per windowMs
      message = 'Too many requests from this IP, please try again later.'
    } = options;

    const requests = new Map();

    return (req, res, next) => {
      const clientId = this.getClientIP(req);
      const now = Date.now();
      
      // Clean old requests
      if (requests.has(clientId)) {
        const clientRequests = requests.get(clientId);
        const validRequests = clientRequests.filter(time => now - time < windowMs);
        requests.set(clientId, validRequests);
      }

      const currentRequests = requests.get(clientId) || [];
      
      if (currentRequests.length >= max) {
        return this.error(res, message, 429);
      }

      currentRequests.push(now);
      requests.set(clientId, currentRequests);
      next();
    };
  }

  /**
   * Security headers middleware
   */
  securityHeaders() {
    return (req, res, next) => {
      // Add security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
      
      // Content Security Policy (adjust based on your needs)
      res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: https:; " +
        "font-src 'self'; " +
        "connect-src 'self' https:; " +
        "frame-src 'none'; " +
        "object-src 'none'"
      );

      next();
    };
  }

  /**
   * Require 2FA middleware
   */
  require2FA() {
    return (req, res, next) => {
      const user = req.adminUser;
      if (user && user.has2FA) {
        // Check if 2FA is verified in the session
        const is2FAVerified = req.session?.is2FAVerified || false;
        if (!is2FAVerified) {
          return this.unauthorized(res, 'Two-factor authentication required');
        }
      }
      next();
    };
  }

  /**
   * Log out user
   */
  logout(req, res) {
    const sessionId = this.getSessionId(req);
    if (sessionId) {
      this.auth.endSession(sessionId);
    }

    // Clear cookies
    res.clearCookie('sessionId');
    res.clearCookie('token');

    // Log logout action
    const user = req.adminUser;
    if (user) {
      this.logAdminAction(req, user, 'logout', 'admin_panel', 'success');
    }

    res.json({
      success: true,
      message: 'Successfully logged out',
      timestamp: new Date().toISOString()
    });
  }
}

// Export middleware instance
const adminMiddleware = new AdminMiddleware();

module.exports = adminMiddleware;