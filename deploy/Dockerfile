# Simple and Stable Dockerfile for Choreo
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Add non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm ci --only=production --silent && npm cache clean --force

# Copy application code
COPY . .

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Simple health check with longer intervals
HEALTHCHECK --interval=60s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000/api/health/live || exit 1

# Expose port
EXPOSE 3000

# Simple environment - no aggressive optimization
ENV NODE_ENV=production \
    PORT=3000 \
    DISABLE_MEMORY_MONITORING=true

# Start the application with simple command
CMD ["npm", "start"]
