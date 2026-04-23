
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
