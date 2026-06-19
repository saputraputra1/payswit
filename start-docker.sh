#!/bin/bash

echo "========================================"
echo "  Payswit Docker Setup"
echo "========================================"
echo ""

echo "[1/4] Copying environment files..."
cp -f server/.env.docker server/.env
cp -f client/.env.docker client/.env
echo "Done!"
echo ""

echo "[2/4] Building Docker images..."
docker-compose build
if [ $? -ne 0 ]; then
    echo "ERROR: Docker build failed!"
    exit 1
fi
echo "Done!"
echo ""

echo "[3/4] Starting containers..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start containers!"
    exit 1
fi
echo "Done!"
echo ""

echo "[4/4] Waiting for services..."
sleep 10
echo ""

echo "========================================"
echo "  Payswit is running!"
echo "========================================"
echo ""
echo "  Client:  http://localhost:3000"
echo "  Server:  http://localhost:5000"
echo "  Health:  http://localhost:5000/api/health"
echo ""
echo "========================================"
