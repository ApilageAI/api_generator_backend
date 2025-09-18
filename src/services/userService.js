/**
 * User Service
 * Handle user-related operations and credit management
 */

const { getDatabase, admin } = require('../config/database');
const { ApiError } = require('../middleware/errorHandler');

/**
 * Deduct credits from user account
 * @param {string} userId - User ID
 * @param {number} creditsToDeduct - Number of credits to deduct
 * @returns {Promise<Object>} Updated user data
 */
const deductCredits = async (userId, creditsToDeduct = 1) => {
    try {
        const db = getDatabase();
        const userRef = db.collection('users').doc(userId);
        
        const result = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
                throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
            }
            
            const userData = userDoc.data();
            const currentCredits = userData.credits || 0;
            
            if (currentCredits < creditsToDeduct) {
                throw new ApiError('Insufficient credits', 403, 'INSUFFICIENT_CREDITS');
            }
            
            const newCredits = currentCredits - creditsToDeduct;
            const newTotalRequests = (userData.totalRequests || 0) + 1;
            
            transaction.update(userRef, {
                credits: newCredits,
                totalRequests: newTotalRequests,
                lastUsed: admin.firestore.FieldValue.serverTimestamp()
            });
            
            return {
                ...userData,
                credits: newCredits,
                totalRequests: newTotalRequests
            };
        });
        
        console.log(`💳 Credits deducted: ${creditsToDeduct} (${result.credits} remaining)`);
        return result;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error('Credit deduction error:', error);
        throw new ApiError('Failed to process credit deduction', 500, 'CREDIT_DEDUCTION_ERROR');
    }
};

/**
 * Get user statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async (userId) => {
    try {
        const db = getDatabase();
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            throw new ApiError('User not found', 404, 'USER_NOT_FOUND');
        }
        
        const userData = userDoc.data();
        
        return {
            credits_remaining: userData.credits || 0,
            total_requests: userData.totalRequests || 0,
            email: userData.email,
            api_key: userData.apiKey,
            created_at: userData.createdAt,
            last_used: userData.lastUsed,
            status: userData.status || 'active'
        };
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error('Get user stats error:', error);
        throw new ApiError('Failed to retrieve user statistics', 500, 'USER_STATS_ERROR');
    }
};

/**
 * Log user request for analytics
 * @param {string} userId - User ID
 * @param {Object} requestData - Request data to log
 * @returns {Promise<string>} Request ID
 */
const logUserRequest = async (userId, requestData) => {
    try {
        const db = getDatabase();
        
        // Generate unique request ID
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const requestLogData = {
            userId: userId,
            requestId: requestId,
            message: requestData.message?.substring(0, 500), // First 500 chars
            responseLength: requestData.responseLength || 0,
            responseTime: requestData.responseTime || 0,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            creditsUsed: requestData.creditsUsed || 1,
            model: requestData.model || 'gemini-2.0-flash',
            ip: requestData.ip,
            userAgent: requestData.userAgent
        };
        
        await db.collection('requests').add(requestLogData);
        
        console.log(`📊 Request logged: ${requestId}`);
        return requestId;
    } catch (error) {
        console.error('Request logging error:', error);
        // Don't throw error for logging failures, just log it
        return null;
    }
};

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user data
 */
const updateUserProfile = async (userId, updateData) => {
    try {
        const db = getDatabase();
        const userRef = db.collection('users').doc(userId);
        
        // Validate update data
        const allowedFields = ['email', 'displayName', 'preferences', 'settings'];
        const sanitizedData = {};
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                sanitizedData[field] = updateData[field];
            }
        }
        
        if (Object.keys(sanitizedData).length === 0) {
            throw new ApiError('No valid fields to update', 400, 'NO_VALID_FIELDS');
        }
        
        sanitizedData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        await userRef.update(sanitizedData);
        
        // Return updated user data
        const updatedDoc = await userRef.get();
        return updatedDoc.data();
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.error('Update user profile error:', error);
        throw new ApiError('Failed to update user profile', 500, 'UPDATE_PROFILE_ERROR');
    }
};

/**
 * Check if user exists
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} Whether user exists
 */
const userExists = async (userId) => {
    try {
        const db = getDatabase();
        const userDoc = await db.collection('users').doc(userId).get();
        return userDoc.exists;
    } catch (error) {
        console.error('User exists check error:', error);
        return false;
    }
};

/**
 * Get user request history
 * @param {string} userId - User ID
 * @param {number} limit - Number of requests to return
 * @returns {Promise<Array>} Request history
 */
const getUserRequestHistory = async (userId, limit = 10) => {
    try {
        const db = getDatabase();
        
        const requestsSnapshot = await db.collection('requests')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();
        
        const requests = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        return requests;
    } catch (error) {
        console.error('Get request history error:', error);
        throw new ApiError('Failed to retrieve request history', 500, 'REQUEST_HISTORY_ERROR');
    }
};

module.exports = {
    deductCredits,
    getUserStats,
    logUserRequest,
    updateUserProfile,
    userExists,
    getUserRequestHistory
};
