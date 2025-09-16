#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🔍 Checking for processes using development ports...${NC}"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo -e "${RED}⚠️  Killing process $pid on port $port${NC}"
        kill -9 $pid 2>/dev/null
        return 0
    else
        echo -e "${GREEN}✅ Port $port is free${NC}"
        return 1
    fi
}

# Kill processes on development ports
kill_port 8080
kill_port 3005

# Wait for ports to be freed
echo -e "${YELLOW}⏳ Waiting for ports to be freed...${NC}"
sleep 3

# Start development servers
echo -e "${GREEN}🚀 Starting development servers...${NC}"
npm run dev