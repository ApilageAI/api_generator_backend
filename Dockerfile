# Choreo-optimized Dockerfile
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production --silent && npm cache clean --force

# Copy application code
COPY . .

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1

# Expose port
EXPOSE 3000

# Environment variables for container optimization
ENV NODE_ENV=production \
    NODE_OPTIONS="--max-old-space-size=384 --gc-interval=100" \
    PORT=3000

# Start the application
CMD ["npm", "start"]
