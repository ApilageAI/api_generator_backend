#!/usr/bin/env node
/**
 * Development Setup Script
 * Helps developers quickly set up the development environment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Apilage AI Platform - Development Setup');
console.log('========================================\n');

// Check for .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
    console.log('⚠️  .env file not found!');
    console.log('📋 Please create a .env file with the following variables:');
    console.log(`
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id  
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
PORT=3000
    `);
} else {
    console.log('✅ .env file found');
}

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = 'v20.0.0';
console.log(`📊 Node.js version: ${nodeVersion}`);

if (nodeVersion < requiredVersion) {
    console.log('⚠️  Warning: Node.js 20+ is recommended');
} else {
    console.log('✅ Node.js version compatible');
}

// Quick setup commands
console.log('\n📋 Quick Setup Commands:');
console.log('========================');
console.log('npm install              # Install dependencies');
console.log('npm run dev             # Start development server');  
console.log('npm run test:smoke      # Quick health check');
console.log('npm test                # Full test suite');

console.log('\n🌐 After setup, your server will be available at:');
console.log('http://localhost:3000/api/health - Main health check');
console.log('http://localhost:3000/api/health/debug - Debug information');

console.log('\n✨ Setup validation complete!');
