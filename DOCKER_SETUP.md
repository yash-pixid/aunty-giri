# Docker Setup Guide

This guide explains how to run the Student Monitor Backend with PostgreSQL using Docker, so you don't need to install PostgreSQL locally.

## Prerequisites

- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)

## Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd student-monitor-backend
```

### 2. Environment Configuration

Copy the environment template:
```bash
cp .env.example .env
```

Edit `.env` file if needed (default values work for Docker setup):
```bash
# Database Configuration
DB_HOST=postgres  # Use 'postgres' for Docker, 'localhost' for local
DB_PORT=5432
DB_NAME=student_monitor
DB_USER=postgres
DB_PASSWORD=password123

# Application Configuration
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 3. Run with Docker Compose

#### Option A: Database Only (Recommended for Development)
Run only PostgreSQL in Docker, app runs locally:

```bash
# Start PostgreSQL
docker-compose up postgres -d

# Install dependencies and run app locally
npm install
npm run dev
```

#### Option B: Full Stack (Database + Application)
Run both PostgreSQL and the application in Docker:

```bash
# Start both services
docker-compose --profile full-stack up -d
```

#### Option C: With pgAdmin (Database Management UI)
Include pgAdmin for database management:

```bash
# Start PostgreSQL + pgAdmin
docker-compose --profile with-pgadmin up postgres pgadmin -d
```

## Docker Commands

### Start Services
```bash
# Database only
docker-compose up postgres -d

# Full stack
docker-compose --profile full-stack up -d

# With pgAdmin
docker-compose --profile with-pgadmin up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f app
```

### Restart Services
```bash
docker-compose restart postgres
docker-compose restart app
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Application | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | postgres/password123 |
| pgAdmin | http://localhost:8080 | admin@example.com/admin123 |

## Database Management

### Using pgAdmin (Web UI)
1. Start with pgAdmin profile: `docker-compose --profile with-pgadmin up -d`
2. Open http://localhost:8080
3. Login: admin@example.com / admin123
4. Add server:
   - Host: postgres
   - Port: 5432
   - Database: student_monitor
   - Username: postgres
   - Password: password123

### Using psql (Command Line)
```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d student_monitor

# Run SQL commands
\dt  # List tables
\q   # Quit
```

## Data Persistence

- Database data is stored in Docker volume `postgres_data`
- Data persists between container restarts
- To reset database: `docker-compose down -v` (removes volumes)

## Development Workflow

### Recommended Setup for Development:
1. Run PostgreSQL in Docker: `docker-compose up postgres -d`
2. Run application locally: `npm run dev`
3. This gives you:
   - Fast application restarts
   - Easy debugging
   - File watching for auto-reload
   - Database in isolated container

### Generate Test Data
```bash
# Make sure database is running
docker-compose up postgres -d

# Generate test data (run locally)
npm install
node scripts/generateTestData.js
```

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### Application Issues
```bash
# Check application logs
docker-compose logs app

# Restart application
docker-compose restart app
```

### Reset Everything
```bash
# Stop all services and remove volumes
docker-compose down -v

# Remove images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up postgres -d
```

## Production Deployment

### Environment Variables
Update `.env` for production:
```bash
NODE_ENV=production
DB_PASSWORD=<strong-password>
JWT_SECRET=<strong-jwt-secret>
DB_SSL=true  # If using managed database
```

### Docker Compose Override
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - /var/lib/postgresql/data:/var/lib/postgresql/data
  
  app:
    environment:
      NODE_ENV: production
    restart: always
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## File Structure

```
student-monitor-backend/
├── docker-compose.yml      # Docker services configuration
├── Dockerfile             # Application container
├── .env                   # Environment variables
├── .env.example          # Environment template
├── healthcheck.js        # Docker health check
└── DOCKER_SETUP.md       # This guide
```

## Benefits of Docker Setup

✅ **No PostgreSQL Installation Required**
- Run PostgreSQL in isolated container
- No conflicts with system packages
- Easy to start/stop/reset

✅ **Consistent Environment**
- Same database version for all developers
- Reproducible setup across machines
- Easy CI/CD integration

✅ **Easy Database Management**
- pgAdmin web interface included
- Simple backup/restore with volumes
- Easy to switch between database versions

✅ **Development Flexibility**
- Run database in Docker, app locally (recommended)
- Or run everything in Docker
- Easy to add more services (Redis, etc.)

## Next Steps

1. Start PostgreSQL: `docker-compose up postgres -d`
2. Install dependencies: `npm install`
3. Generate test data: `node scripts/generateTestData.js`
4. Start development: `npm run dev`
5. Test APIs: Import `openapi.yaml` into Postman

For questions or issues, check the troubleshooting section above.
