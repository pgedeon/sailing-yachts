
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
