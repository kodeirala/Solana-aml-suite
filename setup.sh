#!/bin/bash

# Solana AML Suite - Quick Setup Script
# Run this to get the entire platform running in one command

set -e

echo "🚀 Solana AML Suite - Quick Setup"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if ! pg_isready -q; then
    echo -e "${RED}❌ PostgreSQL is not running. Please start it first.${NC}"
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo service postgresql start"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL is running${NC}"

# Check if Redis is running
echo -e "${YELLOW}Checking Redis...${NC}"
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Redis is not running. Please start it first.${NC}"
    echo "   macOS: brew services start redis"
    echo "   Linux: sudo service redis-server start"
    exit 1
fi
echo -e "${GREEN}✅ Redis is running${NC}"

# Setup database
echo -e "${YELLOW}Setting up database...${NC}"
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw solana_aml; then
    echo "Creating database..."
    createdb solana_aml
fi

echo "Running schema..."
psql -U postgres -d solana_aml -f db-schema.sql > /dev/null 2>&1
echo -e "${GREEN}✅ Database ready${NC}"

# Setup backend
echo -e "${YELLOW}Setting up backend...${NC}"
cd backend

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration${NC}"
fi

echo -e "${GREEN}✅ Backend ready${NC}"
cd ..

# Setup frontend
echo -e "${YELLOW}Setting up frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

if [ ! -f ".env.local" ]; then
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
fi

echo -e "${GREEN}✅ Frontend ready${NC}"
cd ..

# Create start script
echo -e "${YELLOW}Creating start script...${NC}"
cat > start.sh << 'EOF'
#!/bin/bash

# Start all services for Solana AML Suite

echo "🚀 Starting Solana AML Suite..."

# Trap to kill all background processes on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start backend API
echo "📡 Starting backend API..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
sleep 5

# Start transaction indexer
echo "🔍 Starting transaction indexer..."
cd backend
node src/indexer.js &
INDEXER_PID=$!
cd ..

# Start frontend
echo "🎨 Starting frontend dashboard..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   🛡️  Solana AML Suite Running       ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "📊 Dashboard:  http://localhost:3000"
echo "🔌 Backend API: http://localhost:3001"
echo "📡 WebSocket:   ws://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all processes
wait
EOF

chmod +x start.sh

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Solana AML Suite..."

# Kill all node processes related to our project
pkill -f "node.*server.js"
pkill -f "node.*indexer.js"
pkill -f "next dev"

echo "✅ All services stopped"
EOF

chmod +x stop.sh

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "╔════════════════════════════════════════╗"
echo "║   Ready to start building! 🚀         ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Quick start commands:"
echo "  ./start.sh     - Start all services"
echo "  ./stop.sh      - Stop all services"
echo ""
echo "Manual start:"
echo "  cd backend && npm start            # Start API"
echo "  cd backend && node src/indexer.js  # Start indexer"
echo "  cd frontend && npm run dev         # Start dashboard"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your Solana RPC URL and Helius API key"
echo "2. Run './start.sh' to start all services"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For smart contract deployment:"
echo "  cd programs"
echo "  anchor build"
echo "  anchor deploy --provider.cluster devnet"
echo ""
