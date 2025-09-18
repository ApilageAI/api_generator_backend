/**
 * Main Application File
 * Structured Express.js application with proper separation of concerns
 */

const express = require('express');
const path = require('path');

// Configuration imports
const { config, validateEnvironment } = require('./config/env');
const { initializeDatabase } = require('./config/database');

// Middleware imports
const { getCorsMiddleware, corsErrorHandler, handlePreflight } = require('./middleware/cors');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger, logStartup, logShutdown } = require('./utils/logger');

// Route imports
const chatRoutes = require('./routes/chat');
const statsRoutes = require('./routes/stats');
const healthRoutes = require('./routes/health');

// Initialize Express app
const app = express();

/**
 * Initialize application
 */
const initializeApp = async () => {
    try {
        console.log('🚀 Initializing Apilage AI Platform...\n');

        // 1. Validate environment variables
        console.log('🔧 Validating environment...');
        validateEnvironment();

        // 2. Initialize database connection
        console.log('🗄️  Initializing database...');
        initializeDatabase();

        console.log('✅ Application initialized successfully\n');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error.message);
        process.exit(1);
    }
};

/**
 * Configure middleware
 */
const configureMiddleware = () => {
    console.log('⚙️  Configuring middleware...');

    // Trust proxy in production
    if (config.server.trustProxy) {
        app.set('trust proxy', true);
    }

    // Request logging
    app.use(requestLogger);

    // CORS configuration
    app.use(getCorsMiddleware());
    app.use(corsErrorHandler);
    app.use(handlePreflight);

    // Body parsing middleware
    app.use(express.json({ 
        limit: '1mb',
        strict: true
    }));
    app.use(express.urlencoded({ 
        extended: true, 
        limit: '1mb' 
    }));

    // Static files
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // Security headers middleware
    app.use((req, res, next) => {
        res.set({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Referrer-Policy': 'strict-origin-when-cross-origin'
        });
        next();
    });

    console.log('✅ Middleware configured\n');
};

/**
 * Configure routes
 */
const configureRoutes = () => {
    console.log('🛣️  Configuring routes...');

    // Serve main HTML file at root
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '..', 'index.html'));
    });

    // API routes
    app.use('/api/chat', chatRoutes);
    app.use('/api/stats', statsRoutes);
    app.use('/api/health', healthRoutes);

    // API documentation endpoint
    app.get('/api/docs', (req, res) => {
        res.json({
            name: "Apilage AI Platform",
            version: "2.0.0",
            description: "AI-powered educational platform for Sri Lankan students",
            documentation: {
                base_url: `${req.protocol}://${req.get('host')}`,
                authentication: "Bearer token required for most endpoints",
                rate_limits: {
                    requests_per_minute: 60,
                    requests_per_hour: 1000
                }
            },
            endpoints: {
                "POST /api/chat": {
                    description: "Send a message to the AI and get a response",
                    authentication: "required",
                    headers: {
                        "Authorization": "Bearer YOUR_API_KEY",
                        "Content-Type": "application/json"
                    },
                    body: {
                        message: "string (required, max 10000 chars)"
                    },
                    response: {
                        success: "boolean",
                        response: "string",
                        credits_remaining: "number",
                        request_id: "string",
                        model: "string",
                        response_time_ms: "number"
                    }
                },
                "GET /api/stats": {
                    description: "Get your account statistics",
                    authentication: "required",
                    headers: {
                        "Authorization": "Bearer YOUR_API_KEY"
                    },
                    response: {
                        success: "boolean",
                        credits_remaining: "number",
                        total_requests: "number",
                        email: "string"
                    }
                },
                "GET /api/stats/usage": {
                    description: "Get detailed usage statistics",
                    authentication: "required",
                    query_params: {
                        limit: "number (optional, max 50, default 10)"
                    }
                },
                "GET /api/health": {
                    description: "Basic health check",
                    authentication: "none",
                    response: {
                        success: "boolean",
                        status: "string",
                        timestamp: "string",
                        version: "string"
                    }
                },
                "GET /api/health/detailed": {
                    description: "Detailed health check with dependency status",
                    authentication: "none"
                }
            },
            models: {
                "gemini-2.0-flash": {
                    description: "Primary AI model for educational content",
                    max_tokens: 2048,
                    cost_per_request: 1,
                    features: [
                        "Text generation",
                        "Code assistance",
                        "Mathematical problem solving",
                        "Sri Lankan curriculum support"
                    ]
                }
            },
            support: {
                email: "support@apilageai.com",
                documentation: `${req.protocol}://${req.get('host')}/docs`
            }
        });
    });

    console.log('✅ Routes configured\n');
};

/**
 * Configure error handling
 */
const configureErrorHandling = () => {
    console.log('🛡️  Configuring error handling...');

    // 404 handler (must be after all routes)
    app.use(notFoundHandler);

    // Global error handler (must be last)
    app.use(errorHandler);

    console.log('✅ Error handling configured\n');
};

/**
 * Setup graceful shutdown
 */
const setupGracefulShutdown = () => {
    const gracefulShutdown = (signal) => {
        logShutdown(signal);
        console.log('🔄 Closing HTTP server...');
        
        // Close server gracefully
        if (global.httpServer) {
            global.httpServer.close(() => {
                console.log('✅ HTTP server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('💥 Uncaught Exception:', error);
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
};

/**
 * Start the server
 */
const startServer = () => {
    const PORT = config.server.port;
    
    global.httpServer = app.listen(PORT, () => {
        logStartup(PORT);
        console.log(`🌟 Apilage AI Platform is ready!\n`);
    });

    return global.httpServer;
};

/**
 * Main initialization function
 */
const main = async () => {
    try {
        await initializeApp();
        configureMiddleware();
        configureRoutes();
        configureErrorHandling();
        setupGracefulShutdown();
        startServer();
    } catch (error) {
        console.error('💥 Failed to start server:', error);
        process.exit(1);
    }
};

// Export app for testing
module.exports = app;

// Start server if this file is run directly
if (require.main === module) {
    main();
}
