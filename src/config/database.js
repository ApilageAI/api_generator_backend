/**
 * Database Configuration
 * Firebase Firestore setup and connection management
 */

const admin = require('firebase-admin');

// Firebase Admin SDK configuration using environment variables
const serviceAccount = {
    "type": "service_account",
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
    "token_uri": process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": "googleapis.com"
};

let db = null;

/**
 * Initialize Firebase Admin SDK
 * @returns {Object} Firestore database instance
 */
const initializeDatabase = () => {
    try {
        // Initialize Firebase Admin SDK
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: process.env.FIREBASE_DATABASE_URL
        });

        db = admin.firestore();
        console.log('✅ Firebase Firestore connected successfully');
        return db;
    } catch (error) {
        console.error('❌ Failed to initialize Firebase:', error.message);
        process.exit(1);
    }
};

/**
 * Get database instance
 * @returns {Object} Firestore database instance
 */
const getDatabase = () => {
    if (!db) {
        throw new Error('Database not initialized. Call initializeDatabase() first.');
    }
    return db;
};

/**
 * Test database connection
 * @returns {Promise<boolean>} Connection test result
 */
const testConnection = async () => {
    try {
        const testDoc = await db.collection('_health_check').doc('test').get();
        console.log('✅ Database connection test passed');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
};

module.exports = {
    initializeDatabase,
    getDatabase,
    testConnection,
    admin
};
