/**
 * Environment Configuration
 * Environment variable validation and configuration management
 */

require('dotenv').config();

/**
 * Required environment variables
 */
const REQUIRED_ENV_VARS = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_PRIVATE_KEY_ID', 
    'FIREBASE_PRIVATE_KEY',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_CLIENT_ID',
    'FIREBASE_DATABASE_URL',
    'GEMINI_API_KEY'
];

/**
 * Validate all required environment variables are present
 * @throws {Error} If any required environment variables are missing
 */
const validateEnvironment = () => {
    const missingEnvVars = REQUIRED_ENV_VARS.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
        console.error('\n💡 Please check your .env file and ensure all required variables are set.');
        throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }

    console.log('✅ Environment variables loaded successfully');
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔧 Firebase Project: ${process.env.FIREBASE_PROJECT_ID}`);
};

/**
 * Configuration object with environment variables
 */
const config = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        nodeEnv: process.env.NODE_ENV || 'development',
        trustProxy: process.env.TRUST_PROXY === 'true',
        helmetEnabled: process.env.HELMET_ENABLED !== 'false'
    },

    // Firebase Configuration
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        clientId: process.env.FIREBASE_CLIENT_ID,
        authUri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
        tokenUri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
        authProviderX509CertUrl: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
        clientX509CertUrl: process.env.FIREBASE_CLIENT_X509_CERT_URL,
        databaseUrl: process.env.FIREBASE_DATABASE_URL
    },

    // Gemini AI Configuration
    gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        apiUrl: process.env.GEMINI_API_URL || "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    },

    // CORS Configuration
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS 
            ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
            : ['http://localhost:3000', 'http://localhost:3001']
    },

    // Rate Limiting Configuration
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
        message: process.env.RATE_LIMIT_MESSAGE || "Too many requests from this IP, please try again later"
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined'
    }
};

/**
 * Check if running in development mode
 * @returns {boolean}
 */
const isDevelopment = () => config.server.nodeEnv === 'development';

/**
 * Check if running in production mode
 * @returns {boolean}
 */
const isProduction = () => config.server.nodeEnv === 'production';

/**
 * Get configuration for specific environment
 * @param {string} env - Environment name
 * @returns {Object} Environment-specific configuration
 */
const getEnvConfig = (env = config.server.nodeEnv) => {
    const baseConfig = { ...config };
    
    switch (env) {
        case 'development':
            baseConfig.cors.allowedOrigins = [
                'http://localhost:3000', 
                'http://localhost:3001', 
                'http://localhost:8080'
            ];
            baseConfig.logging.level = 'debug';
            break;
            
        case 'production':
            baseConfig.server.trustProxy = true;
            baseConfig.logging.level = 'warn';
            baseConfig.rateLimit.maxRequests = 60; // Stricter in production
            break;
            
        case 'test':
            baseConfig.logging.level = 'error';
            baseConfig.rateLimit.maxRequests = 1000; // Higher for testing
            break;
    }
    
    return baseConfig;
};

module.exports = {
    config,
    validateEnvironment,
    isDevelopment,
    isProduction,
    getEnvConfig,
    REQUIRED_ENV_VARS
};
