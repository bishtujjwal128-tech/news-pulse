FROM node:20-bookworm

# Install Python
RUN apt-get update \
    && apt-get install -y python3 python3-pip python3-venv \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install Node dependencies
WORKDIR /app/backend
RUN npm install

# Copy the entire project
WORKDIR /app
COPY backend ./backend
COPY scraper ./scraper

# Install Python dependencies
RUN pip3 install --default-timeout=300 --retries=10 --break-system-packages -r scraper/requirements.txt

# Environment
ENV NODE_ENV=production

# Backend port
EXPOSE 5050

# Start Node backend
CMD ["node", "backend/src/server.js"]