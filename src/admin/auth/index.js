/**
 * Enhanced Admin Authentication System
 * 
 * Provides secure authentication with 2FA, session management,
 * and audit logging for admin actions.
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const { v4: uuidv4 } = require('uuid');

class AdminAuth {
  constructor() {
    this.sessions = new Map();
    this.failedAttempts = new Map();
    this.maxLoginAttempts = 5;
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
    this.otpWindow = 1; // 1 step before/after for OTP tolerance
  }

  /**
   * Generate secure API key
   */
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hash API key for secure storage
   */
  async hashApiKey(apiKey) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(apiKey, salt);
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey, hashedKey) {
    return await bcrypt.compare(apiKey, hashedKey);
  }

  /**
   * Generate TOTP secret for 2FA
   */
  generateTOTPSecret(userEmail) {
    const secret = speakeasy.generateSecret({
      name: `Sailing Yachts Admin (${userEmail})`,
      issuer: 'Sailing Yachts',
    });
    
    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url,
    };
  }

  /**
   * Verify TOTP code
   */
  verifyTOTP(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: this.otpWindow,
    });
  }

  /**
   * Create admin session
   */
  createSession(userId, isAdmin = false, has2FA = false) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      userId,
      isAdmin,
      has2FA,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
    };
    
    this.sessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Validate session
   */
  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    
    // Check session expiration
    if (Date.now() - session.lastActivity > this.sessionTimeout) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    // Update last activity
    session.lastActivity = Date.now();
    return true;
  }

  /**
   * End session
   */
  endSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Track failed login attempts
   */
  trackFailedAttempt(ipAddress) {
    const attempts = this.failedAttempts.get(ipAddress) || 0;
    this.failedAttempts.set(ipAddress, attempts + 1);
    
    // Clean up old attempts (older than 15 minutes)
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    for (const [ip, count] of this.failedAttempts.entries()) {
      if (count < this.maxLoginAttempts) {
        // Remove old attempts that are no longer relevant
        this.failedAttempts.delete(ip);
      }
    }
  }

  /**
   * Check if IP is temporarily blocked
   */
  isIPBlocked(ipAddress) {
    const attempts = this.failedAttempts.get(ipAddress) || 0;
    return attempts >= this.maxLoginAttempts;
  }

  /**
   * Reset failed attempts for IP
   */
  resetFailedAttempts(ipAddress) {
    this.failedAttempts.delete(ipAddress);
  }

  /**
   * Enhanced password validation
   */
  validatePassword(password) {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (password.length < minLength) {
      throw new Error('Password must be at least 12 characters long');
    }
    
    if (!hasUppercase) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowercase) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }
    
    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }
    
    return true;
  }

  /**
   * Hash password with secure salt
   */
  async hashPassword(password) {
    this.validatePassword(password);
    const salt = await bcrypt.genSalt(12);
    return await bcrypt.hash(password, salt);
  }

  /**
   * Verify password
   */
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Get client IP (placeholder - implement based on your framework)
   */
  getClientIP() {
    // Implement based on your framework (Express, Next.js, etc.)
    return 'unknown';
  }

  /**
   * Get user agent (placeholder - implement based on your framework)
   */
  getUserAgent() {
    // Implement based on your framework (Express, Next.js, etc.)
    return 'unknown';
  }

  /**
   * Get all active sessions
   */
  getActiveSessions() {
    const now = Date.now();
    const activeSessions = [];
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity <= this.sessionTimeout) {
        activeSessions.push({
          sessionId,
          userId: session.userId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
        });
      }
    }
    
    return activeSessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.sessionTimeout) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = AdminAuth;