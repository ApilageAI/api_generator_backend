# 📁 Project Structure

## Overview
The Apilage AI Platform backend is organized into a clean, professional structure that separates concerns and makes the codebase maintainable and scalable.

## 🏗️ Directory Structure

```
api_generator_backend/
├── 📂 src/                          # Main application source code
│   ├── app.js                       # Main application file & server setup
│   ├── 📂 config/                   # Configuration modules
│   │   ├── database.js              # Firebase/Firestore configuration
│   │   ├── env.js                   # Environment variable validation
│   │   └── gemini.js                # Gemini AI configuration
│   ├── 📂 middleware/               # Express middleware
│   │   ├── auth.js                  # Authentication middleware
│   │   ├── cors.js                  # CORS configuration
│   │   └── errorHandler.js          # Error handling middleware
│   ├── 📂 routes/                   # API route handlers
│   │   ├── chat.js                  # Chat/AI endpoints
│   │   ├── health.js                # Health check endpoints
│   │   └── stats.js                 # Statistics endpoints
│   ├── 📂 services/                 # Business logic services
│   │   ├── geminiService.js         # Gemini AI integration
│   │   └── userService.js           # User management & credits
│   └── 📂 utils/                    # Utility functions
│       ├── logger.js                # Logging utilities
│       ├── memoryMonitor.js         # Memory monitoring
│       └── validators.js            # Input validation
├── 📂 tests/                        # Comprehensive test suite
│   ├── 📂 utils/                    # Test utilities
│   │   └── testHelper.js            # Test helper functions
│   ├── 📂 unit/                     # Unit tests
│   │   └── health.test.js           # Health endpoint tests
│   ├── 📂 integration/              # Integration tests
│   │   └── api.test.js              # API integration tests
│   ├── 📂 load/                     # Performance tests
│   │   └── stress.test.js           # Load & stress tests
│   ├── 📂 e2e/                      # End-to-end tests
│   │   └── full-system.test.js      # Full system tests
│   └── test-runner.js               # Main test orchestrator
├── 📂 docs/                         # Documentation
│   ├── PROJECT_STRUCTURE.md        # This file
│   ├── CHOREO_DEPLOYMENT.md        # Choreo deployment guide
│   ├── TESTING.md                  # Testing documentation
│   └── index.html                  # API documentation (HTML)
├── 📂 deploy/                       # Deployment configurations
│   ├── .choreo.yml                 # Choreo deployment config
│   ├── choreo-config.yml           # Alternative Choreo config
│   ├── Dockerfile                  # Docker configuration
│   └── README.md                   # Deployment guide
├── 📂 config/                       # Configuration templates
│   └── env.template                # Environment variables template
├── 📂 scripts/                      # Utility scripts
│   ├── 📂 legacy/                   # Legacy files
│   │   ├── server.js                # Old server implementation
│   │   └── test.js                  # Old test file
│   ├── dev-setup.js                # Development setup script
│   └── health-check.js             # Health check script
├── 📄 README.md                     # Main project documentation
├── 📄 package.json                  # Dependencies & scripts
├── 📄 .env                         # Environment variables (local)
└── 📄 .gitignore                   # Git ignore rules
```

## 🎯 Key Design Principles

### 1. **Separation of Concerns**
- **Config**: Environment and service configurations
- **Middleware**: Request processing and validation
- **Routes**: API endpoint definitions
- **Services**: Business logic and external integrations
- **Utils**: Reusable utility functions

### 2. **Testing First**
- Comprehensive test suite with multiple test types
- Professional test utilities and helpers
- Automated test runners with detailed reporting
- Performance and load testing included

### 3. **Deployment Ready**
- Multiple deployment configurations (Choreo, Docker)
- Health check endpoints for container orchestration
- Environment-specific configurations
- Production optimization settings

### 4. **Developer Experience**
- Clear documentation for all components
- Setup scripts for easy onboarding
- Helpful development utilities
- Organized folder structure

## 📋 File Responsibilities

### Core Application (`src/`)
- **`app.js`**: Main application setup, middleware configuration, server startup
- **`config/`**: All configuration logic isolated and reusable
- **`middleware/`**: Express middleware for common functionality
- **`routes/`**: API endpoint definitions and request handling
- **`services/`**: Business logic separated from route handlers
- **`utils/`**: Common utilities used across the application

### Testing (`tests/`)
- **`utils/testHelper.js`**: Common test utilities and server management
- **`unit/`**: Fast, isolated tests for individual components
- **`integration/`**: Tests for component interaction
- **`load/`**: Performance and stress testing
- **`e2e/`**: Full system workflow testing
- **`test-runner.js`**: Orchestrates all test suites

### Documentation (`docs/`)
- **Deployment guides**: Step-by-step deployment instructions
- **Testing documentation**: How to run and interpret tests
- **API documentation**: Endpoint specifications and examples

### Deployment (`deploy/`)
- **Choreo configurations**: Production-ready Choreo deployment
- **Docker setup**: Container deployment configuration
- **Deployment guides**: Platform-specific instructions

### Configuration (`config/`)
- **Environment templates**: Example configurations
- **Deployment-specific configs**: Environment-specific settings

### Scripts (`scripts/`)
- **Development utilities**: Setup and health check scripts
- **Legacy files**: Old implementations kept for reference

## 🔄 Development Workflow

### 1. **Setup**
```bash
npm run setup          # Check environment and dependencies
npm install            # Install dependencies
```

### 2. **Development**
```bash
npm run dev            # Start development server
npm run health-check   # Verify server health
```

### 3. **Testing**
```bash
npm run test:smoke     # Quick validation
npm test               # Full test suite
npm run test:load      # Performance testing
```

### 4. **Deployment**
```bash
npm run deploy:check   # Pre-deployment validation
npm run deploy:validate # Full deployment validation
```

## 🎨 Code Organization Patterns

### 1. **Configuration Pattern**
All configuration is centralized in `src/config/` with environment validation and type checking.

### 2. **Service Layer Pattern**
Business logic is separated into services, making it testable and reusable.

### 3. **Middleware Pattern**
Cross-cutting concerns (auth, CORS, logging) are handled through middleware.

### 4. **Error Handling Pattern**
Centralized error handling with proper HTTP status codes and user-friendly messages.

### 5. **Testing Pattern**
Multiple test types with utilities and helpers for maintainable test code.

## 🚀 Benefits of This Structure

- **✅ Maintainable**: Clear separation of concerns
- **✅ Testable**: Comprehensive test coverage
- **✅ Scalable**: Easy to add new features
- **✅ Deployable**: Multiple deployment options
- **✅ Professional**: Industry-standard organization
- **✅ Documented**: Clear documentation for all components

## 🔧 Extending the Structure

### Adding New Features
1. Create service in `src/services/`
2. Add routes in `src/routes/`
3. Add tests in appropriate `tests/` subdirectory
4. Update documentation

### Adding New Deployment Target
1. Add configuration to `deploy/`
2. Update deployment documentation
3. Add deployment validation scripts

### Adding New Testing
1. Add test files to appropriate `tests/` subdirectory
2. Update test runner if needed
3. Update testing documentation

This structure supports the full development lifecycle from initial development through production deployment and maintenance.
