
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
