FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/server/package.json ./packages/server/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Create db directory with proper permissions
RUN mkdir -p /app/packages/server/db && \
    chmod 777 /app/packages/server/db

# Expose the port your app runs on
EXPOSE 3000

# Start the application
WORKDIR /app/packages/server
CMD ["bun", "run", "start"]
