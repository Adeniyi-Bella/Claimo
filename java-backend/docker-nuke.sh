#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

echo "Stopping compose stack and removing project resources..."
docker compose -f docker-compose.local.yml down --volumes --remove-orphans || true

echo "Removing project volume..."
docker volume rm -f claimo_claimo_pgdata 2>/dev/null || true

echo "Removing all Docker containers/images/networks/volumes..."
docker rm -f $(docker ps -aq) 2>/dev/null || true
docker system prune -a --volumes -f

echo "Docker has been fully cleaned."