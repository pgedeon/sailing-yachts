/**
 * Enhanced Rate Limiter with Dynamic Scaling
 * 
 * Implements intelligent rate limiting with IP-based tracking,
   automatic scaling, and security thresholds.
 */

const crypto = require('crypto');
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxRequests = options.maxRequests || 100;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    this.blockDuration = options.blockDuration || 60 * 60 * 1000; // 1 hour
    
    // Track requests per IP
    this.ipRequests = new Map();
    this.blockedIPs = new Map();
    
    // Track requests per endpoint
    this.endpointRequests = new Map();
    
    // Track authentication attempts
    this.authAttempts = new Map();
    
    // Track suspicious patterns
    this.suspiciousIPs = new Map();
    
    // Configuration
    this.securityThresholds = {
      maxAuthAttempts: 5,
      maxBlockedRequests: 50,
      maxEndpointRequests: 1000,
      suspiciousThreshold: 10
    };
  }

  /**
   * Check if request is allowed
   */
  async middleware(req, res, next) {
    try {
      const clientIP = this.getClientIP(req);
      const endpoint = req.path;
      
      // Check if IP is blocked
      if (this.isIPBlocked(clientIP)) {
        return this.blockRequest(req, res, 'IP temporarily blocked');
      }
      
      // Check rate limits
      const ipLimit = this.checkIPLimit(clientIP);
      const endpointLimit = this.checkEndpointLimit(endpoint);
      const authLimit = this.checkAuthLimit(clientIP, req);
      
      // Check for suspicious patterns
      if (this.isSuspicious(clientIP, req)) {
        this.recordSuspiciousActivity(clientIP, req);
      }
      
      // Apply most restrictive limit
      const maxAllowed = Math.min(
        ipLimit.remaining,
        endpointLimit.remaining,
        authLimit.remaining
      );
      
      if (maxAllowed <= 0) {
        const reason = this.getLimitReason(ipLimit, endpointLimit, authLimit);
        return this.blockRequest(req, res, reason);
      }
      
      // Add headers for rate limiting info
      this.addRateLimitHeaders(res, ipLimit, endpointLimit, authLimit);
      
      // Track the request
      this.trackRequest(clientIP, endpoint, req);
      
      // Call next middleware
      next();
      
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(error);
    }
  }

  /**
   * Get client IP address
   */
  getClientIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           'unknown';
  }

  /**
   * Check IP rate limit
   */
  checkIPLimit(ip) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old requests
    if (this.ipRequests.has(ip)) {
      const requests = this.ipRequests.get(ip);
      const validRequests = requests.filter(time => time > windowStart);
      this.ipRequests.set(ip, validRequests);
    }
    
    const currentRequests = this.ipRequests.get(ip) || [];
    const remaining = Math.max(0, this.maxRequests - currentRequests.length);
    
    return {
      remaining,
      limit: this.maxRequests,
      reset: windowStart + this.windowMs,
      total: currentRequests.length
    };
  }

  /**
   * Check endpoint rate limit
   */
  checkEndpointLimit(endpoint) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old requests
    if (this.endpointRequests.has(endpoint)) {
      const requests = this.endpointRequests.get(endpoint);
      const validRequests = requests.filter(time => time > windowStart);
      this.endpointRequests.set(endpoint, validRequests);
    }
    
    const currentRequests = this.endpointRequests.get(endpoint) || [];
    const remaining = Math.max(0, this.securityThresholds.maxEndpointRequests - currentRequests.length);
    
    return {
      remaining,
      limit: this.securityThresholds.maxEndpointRequests,
      reset: windowStart + this.windowMs,
      total: currentRequests.length
    };
  }

  /**
   * Check authentication rate limit
   */
  checkAuthLimit(ip, req) {
    const isAuthRequest = this.isAuthRequest(req);
    if (!isAuthRequest) {
      return {
        remaining: this.securityThresholds.maxAuthAttempts,
        limit: this.securityThresholds.maxAuthAttempts,
        reset: Date.now() + this.windowMs,
        total: 0
      };
    }
    
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean old attempts
    if (this.authAttempts.has(ip)) {
      const attempts = this.authAttempts.get(ip);
      const validAttempts = attempts.filter(time => time > windowStart);
      this.authAttempts.set(ip, validAttempts);
    }
    
    const currentAttempts = this.authAttempts.get(ip) || [];
    const remaining = Math.max(0, this.securityThresholds.maxAuthAttempts - currentAttempts.length);
    
    return {
      remaining,
      limit: this.securityThresholds.maxAuthAttempts,
      reset: windowStart + this.windowMs,
      total: currentAttempts.length
    };
  }

  /**
   * Check if request is authentication-related
   */
  isAuthRequest(req) {
    const authPaths = ['/api/auth/login', '/api/auth/2fa', '/api/auth/register'];
    return authPaths.some(path => req.path.startsWith(path));
  }

  /**
   * Track request
   */
  trackRequest(ip, endpoint, req) {
    // Track IP requests
    if (!this.ipRequests.has(ip)) {
      this.ipRequests.set(ip, []);
    }
    this.ipRequests.get(ip).push(Date.now());
    
    // Track endpoint requests
    if (!this.endpointRequests.has(endpoint)) {
      this.endpointRequests.set(endpoint, []);
    }
    this.endpointRequests.get(endpoint).push(Date.now());
    
    // Track authentication attempts
    if (this.isAuthRequest(req)) {
      if (!this.authAttempts.has(ip)) {
        this.authAttempts.set(ip, []);
      }
      this.authAttempts.get(ip).push(Date.now());
    }
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip) {
    const blockInfo = this.blockedIPs.get(ip);
    if (!blockInfo) return false;
    
    // Check if block has expired
    if (Date.now() > blockInfo.expires) {
      this.blockedIPs.delete(ip);
      return false;
    }
    
    return true;
  }

  /**
   * Block request
   */
  blockRequest(req, res, reason) {
    const clientIP = this.getClientIP(req);
    
    // Block the IP
    this.blockIP(clientIP, reason);
    
    res.set({
      'X-RateLimit-Limit': this.maxRequests,
      'X-RateLimit-Remaining': 0,
      'X-RateLimit-Reset': Date.now() + this.blockDuration,
      'Retry-After': Math.ceil(this.blockDuration / 1000)
    });
    
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: reason,
      retryAfter: Math.ceil(this.blockDuration / 1000),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Block IP address
   */
  blockIP(ip, reason) {
    this.blockedIPs.set(ip, {
      reason,
      blockedAt: Date.now(),
      expires: Date.now() + this.blockDuration,
      count: this.blockedIPs.get(ip)?.count || 0 + 1
    });
    
    console.log(`[SECURITY] Blocked IP: ${ip} - Reason: ${reason}`);
  }

  /**
   * Record suspicious activity
   */
  recordSuspiciousActivity(ip, req) {
    if (!this.suspiciousIPs.has(ip)) {
      this.suspiciousIPs.set(ip, {
        count: 0,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        activities: []
      });
    }
    
    const suspiciousInfo = this.suspiciousIPs.get(ip);
    suspiciousInfo.count++;
    suspiciousInfo.lastSeen = Date.now();
    
    suspiciousInfo.activities.push({
      timestamp: Date.now(),
      path: req.path,
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip
    });
    
    // Check if IP should be blocked
    if (suspiciousInfo.count >= this.securityThresholds.suspiciousThreshold) {
      this.blockIP(ip, 'Suspicious activity detected');
    }
  }

  /**
   * Check for suspicious patterns
   */
  isSuspicious(ip, req) {
    const suspiciousInfo = this.suspiciousIPs.get(ip);
    
    // Check for rapid successive requests to different endpoints
    if (suspiciousInfo && suspiciousInfo.activities.length > 5) {
      const recentActivities = suspiciousInfo.activities.slice(-5);
      const uniqueEndpoints = new Set(recentActivities.map(a => a.path));
      
      if (uniqueEndpoints.size >= 4) {
        return true;
      }
    }
    
    // Check for unusual user agents
    const userAgent = req.get('User-Agent');
    if (userAgent && (userAgent.length < 10 || userAgent.includes('bot') || userAgent.includes('crawler'))) {
      return true;
    }
    
    // Check for suspicious request patterns
    if (req.path.includes('/admin') || req.path.includes('/api/internal')) {
      return true;
    }
    
    return false;
  }

  /**
   * Add rate limiting headers
   */
  addRateLimitHeaders(res, ipLimit, endpointLimit, authLimit) {
    res.set({
      'X-RateLimit-Limit': ipLimit.limit,
      'X-RateLimit-Remaining': ipLimit.remaining,
      'X-RateLimit-Reset': ipLimit.reset,
      'X-Endpoint-Limit': endpointLimit.limit,
      'X-Endpoint-Remaining': endpointLimit.remaining,
      'X-Auth-Limit': authLimit.limit,
      'X-Auth-Remaining': authLimit.remaining
    });
  }

  /**
   * Get the reason for rate limiting
   */
  getLimitReason(ipLimit, endpointLimit, authLimit) {
    if (ipLimit.remaining <= 0) {
      return `IP rate limit exceeded (${ipLimit.total}/${ipLimit.limit})`;
    }
    
    if (endpointLimit.remaining <= 0) {
      return `Endpoint rate limit exceeded (${endpointLimit.total}/${endpointLimit.limit})`;
    }
    
    if (authLimit.remaining <= 0) {
      return `Authentication rate limit exceeded (${authLimit.total}/${authLimit.limit})`;
    }
    
    return 'Rate limit exceeded';
  }

  /**
   * Get rate limiting statistics
   */
  getStats() {
    return {
      totalIPs: this.ipRequests.size,
      blockedIPs: this.blockedIPs.size,
      totalAuthAttempts: this.authAttempts.size,
      suspiciousIPs: this.suspiciousIPs.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests
    };
  }

  /**
   * Get blocked IPs
   */
  getBlockedIPs() {
    return Array.from(this.blockedIPs.entries()).map(([ip, info]) => ({
      ip,
      reason: info.reason,
      blockedAt: info.blockedAt,
      expires: info.expires,
      count: info.count
    }));
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Clean IP requests
    for (const [ip, requests] of this.ipRequests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.ipRequests.delete(ip);
      }
    }
    
    // Clean endpoint requests
    for (const [endpoint, requests] of this.endpointRequests.entries()) {
      const validRequests = requests.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.endpointRequests.delete(endpoint);
      }
    }
    
    // Clean auth attempts
    for (const [ip, attempts] of this.authAttempts.entries()) {
      const validAttempts = attempts.filter(time => time > windowStart);
      if (validAttempts.length === 0) {
        this.authAttempts.delete(ip);
      }
    }
    
    // Clean blocked IPs that have expired
    for (const [ip, info] of this.blockedIPs.entries()) {
      if (now > info.expires) {
        this.blockedIPs.delete(ip);
      }
    }
  }

  /**
   * Unblock an IP
   */
  unblockIP(ip) {
    return this.blockedIPs.delete(ip);
  }

  /**
   * Reset rate limits for an IP
   */
  resetIP(ip) {
    this.ipRequests.delete(ip);
    this.authAttempts.delete(ip);
    this.unblockIP(ip);
    return true;
  }
}

module.exports = RateLimiter;