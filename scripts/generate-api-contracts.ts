#!/usr/bin/env tsx

/**
 * API Contract Generator
 * 
 * This script analyzes API responses and generates TypeScript interfaces
 * to ensure type safety and contract consistency across the API.
 */

import fetch from 'node-fetch';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
const OUTPUT_FILE = 'lib/api-contracts.ts';
const TEST_FILE = 'tests/api-contracts.test.ts';

// API endpoints to analyze
const ENDPOINTS = [
  { path: '/api/yachts?limit=5', name: 'yachts' },
  { path: '/api/search?q=test&mode=autocomplete&limit=5', name: 'search-autocomplete' },
  { path: '/api/search?q=test&mode=full&limit=3', name: 'search-full' },
  { path: '/api/manufacturers', name: 'manufacturers' },
  { path: '/api/v1/yachts?limit=3', name: 'v1-yachts' },
];

// Type generation helpers
function generateTypeDefinition(name: string, data: any): string {
  if (Array.isArray(data) && data.length > 0) {
    return generateInterfaceDefinition(`${name}Item`, data[0]);
  } else if (typeof data === 'object' && data !== null) {
    return generateInterfaceDefinition(name, data);
  }
  return `export type ${name} = ${typeof data};`;
}

function generateInterfaceDefinition(name: string, obj: any): string {
  let definition = `export interface ${name} {\n`;
  
  for (const [key, value] of Object.entries(obj)) {
    const type = getTypeFromValue(value, key);
    const optional = value === null || value === undefined ? '?' : '';
    definition += `  ${key}${optional}: ${type};\n`;
  }
  
  definition += '}';
  return definition;
}

function getTypeFromValue(value: any, key: string): string {
  if (value === null || value === undefined) {
    return 'any';
  }
  
  if (Array.isArray(value)) {
    if (value.length > 0) {
      const itemType = getTypeFromValue(value[0], key);
      return `${itemType}[]`;
    }
    return 'any[]';
  }
  
  if (typeof value === 'object') {
    // Handle special cases
    if (key.includes('date') || key.includes('time') || key.includes('At')) {
      return 'string';
    }
    
    // Generate nested interface
    const nestedName = `${key.charAt(0).toUpperCase() + key.slice(1)}`;
    return generateInterfaceDefinition(nestedName, value)
      .split('\n')
      .slice(1, -1) // Remove interface declaration and closing brace
      .map(line => `  ${line}`) // Add indentation
      .join('\n');
  }
  
  return typeof value;
}

// Contract validation helpers
function generateValidationFunction(name: string, data: any): string {
  const properties = Object.keys(data || {});
  const validationChecks = properties.map(prop => {
    const type = typeof data[prop];
    switch (type) {
      case 'number':
        return `typeof data.${prop} === 'number'`;
      case 'string':
        return `typeof data.${prop} === 'string'`;
      case 'boolean':
        return `typeof data.${prop} === 'boolean'`;
      case 'object':
        return `typeof data.${prop} === 'object' && data.${prop} !== null`;
      default:
        return `typeof data.${prop} === '${type}'`;
    }
  });
  
  const optionalChecks = properties.filter(prop => data[prop] === null || data[prop] === undefined)
    .map(prop => `data.${prop} === undefined`);
  
  const allChecks = [...validationChecks, ...optionalChecks];
  
  return `export function validate${name}Contract(data: any): data is ${name} {
  return (
    typeof data === 'object' &&
    ${allChecks.join(' &&\n    ')}
  );
}`;
}

// Main function
async function generateContracts() {
  console.log('🚀 Starting API contract generation...');
  
  try {
    // Collect API responses
    const apiResponses: Record<string, any> = {};
    
    for (const endpoint of ENDPOINTS) {
      console.log(`📡 Fetching ${endpoint.name} from ${endpoint.path}...`);
      
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint.path}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        apiResponses[endpoint.name] = data;
        console.log(`✅ Successfully fetched ${endpoint.name}`);
      } catch (error) {
        console.error(`❌ Failed to fetch ${endpoint.name}:`, error);
        // Continue with other endpoints
      }
    }
    
    // Generate contract file
    let contractContent = `// API Contract Types for Sailing Yachts
// Generated on ${new Date().toISOString()}
// Automatically generated - do not edit manually

`;
    
    // Generate interface definitions
    for (const [name, data] of Object.entries(apiResponses)) {
      const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
      contractContent += generateTypeDefinition(interfaceName, data) + '\n\n';
    }
    
    // Add validation helpers
    contractContent += `\n// Contract validation helpers\n`;
    
    for (const [name, data] of Object.entries(apiResponses)) {
      const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
      contractContent += generateValidationFunction(interfaceName, data) + '\n\n';
    }
    
    // Write to file
    require('fs').writeFileSync(OUTPUT_FILE, contractContent);
    console.log(`✅ Generated contract file: ${OUTPUT_FILE}`);
    
    // Generate test file
    generateTestFile(apiResponses);
    
    console.log('🎉 API contract generation completed successfully!');
    
  } catch (error) {
    console.error('❌ Contract generation failed:', error);
    process.exit(1);
  }
}

function generateTestFile(apiResponses: Record<string, any>) {
  console.log('🧪 Generating test file...');
  
  let testContent = `// API Contract Tests
// Generated on ${new Date().toISOString()}
// Tests for automatically generated API contracts

import { test, expect } from '@playwright/test';
`;
  
  // Add imports for validation functions
  const validationImports = Object.keys(apiResponses).map(name => {
    const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
    return `validate${interfaceName}Contract`;
  }).join(', ');
  
  if (validationImports) {
    testContent += `import { ${validationImports} } from '../lib/api-contracts';\n`;
  }
  
  testContent += `
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

`;
  
  // Generate test cases for each endpoint
  for (const [name, data] of Object.entries(apiResponses)) {
    const endpointName = name.replace('-', ' ');
    const interfaceName = name.charAt(0).toUpperCase() + name.slice(1);
    
    testContent += `test.describe('${endpointName} endpoint', () => {
  test('should return valid response structure', async () => {
    // This test would be customized based on the specific endpoint
    // For now, it validates the contract structure
    expect(typeof data).toBe('object');
    expect(validate${interfaceName}Contract(data)).toBe(true);
  });
});

`;
  }
  
  require('fs').writeFileSync(TEST_FILE, testContent);
  console.log(`✅ Generated test file: ${TEST_FILE}`);
}

// Run if called directly
if (require.main === module) {
  generateContracts();
}

export { generateContracts };