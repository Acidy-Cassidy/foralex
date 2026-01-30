# Setup Instructions (WSL for Windows)

## Prerequisites

1. **WSL 2** installed and configured
2. **Node.js** 18+ installed in WSL
3. **PostgreSQL** 14+ installed in WSL (or Docker in WSL)
4. **npm** or **yarn** package manager

## WSL Setup

### 1. Install/Verify WSL 2

If you don't have WSL 2 installed:

```powershell
# Run in PowerShell as Administrator
wsl --install
```

Or install a specific distribution:
```powershell
wsl --install -d Ubuntu
```

Verify WSL is installed:
```bash
wsl --list --verbose
# Should show your distribution with VERSION 2
```

### 2. Access Your Project in WSL

The project is located in Windows at `C:\Users\pvcon\companycam-clone`. In WSL, access it via:

```bash
# Navigate to Windows user directory in WSL
cd /mnt/c/Users/pvcon/companycam-clone

# Or create a symlink for easier access
ln -s /mnt/c/Users/pvcon/companycam-clone ~/companycam-clone
cd ~/companycam-clone
```

### 3. Install Node.js in WSL

```bash
# Update package list
sudo apt update

# Install Node.js 18+ using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

## Quick Start

### 1. Install Dependencies

**Important:** Run all commands in WSL terminal, not PowerShell/CMD.

```bash
# Navigate to project (if not already there)
cd /mnt/c/Users/pvcon/companycam-clone

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set Up Database

#### Option A: Using Docker in WSL (Recommended)

First, install Docker in WSL:

```bash
# Install Docker in WSL
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER

# Start Docker service
sudo service docker start
```

Then start PostgreSQL:

```bash
# Navigate to project directory
cd /mnt/c/Users/pvcon/companycam-clone

# Start PostgreSQL container
docker-compose up -d

# Wait for database to be ready (about 10 seconds)
# Verify it's running
docker ps
```

#### Option B: Install PostgreSQL in WSL

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# Create the database
sudo -u postgres createdb companycam

# Verify database was created
sudo -u postgres psql -l
```

### 3. Configure Environment Variables

#### Backend (.env)

Create `backend/.env` file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/companycam"
JWT_SECRET="your-secret-key-change-in-production"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=10485760
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_VIDEO_TYPES=video/mp4,video/webm
```

#### Frontend (.env)

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:3001/api
```

### 4. Run Database Migrations

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 5. Start Development Servers

#### Option A: Run Both Together (from root)

```bash
npm run dev
```

#### Option B: Run Separately

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 6. Access the Application

**Important:** Access from your Windows browser, not WSL terminal.

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

The servers running in WSL are accessible from Windows via `localhost` automatically.

## Troubleshooting

### WSL-Specific Issues

**File Permissions:**
- If you get permission errors, you may need to fix file ownership:
```bash
sudo chown -R $USER:$USER /mnt/c/Users/pvcon/companycam-clone
```

**Line Endings:**
- If you encounter issues with scripts, ensure line endings are correct:
```bash
# Install dos2unix if needed
sudo apt install dos2unix

# Convert line endings (if needed)
find . -type f -name "*.sh" -exec dos2unix {} \;
```

**Performance:**
- For better performance, consider moving the project to WSL filesystem:
```bash
# Copy project to WSL home directory
cp -r /mnt/c/Users/pvcon/companycam-clone ~/companycam-clone
cd ~/companycam-clone
```

### Database Connection Issues

**Docker:**
- Ensure Docker service is running: `sudo service docker status`
- Start Docker if needed: `sudo service docker start`
- Check container: `docker ps`

**PostgreSQL:**
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Start PostgreSQL if needed: `sudo service postgresql start`
- Check DATABASE_URL in `backend/.env`
- Verify database exists: `sudo -u postgres psql -l`

### Port Already in Use

- Check what's using the port: `sudo netstat -tulpn | grep :3001` (or :5173)
- Kill the process if needed: `sudo kill -9 <PID>`
- Or change PORT in `backend/.env`
- Update VITE_API_URL in `frontend/.env` accordingly

### Prisma Issues

```bash
cd backend
npx prisma generate
npx prisma migrate reset  # WARNING: This deletes all data
```

### Camera Not Working

- Ensure you're using HTTPS or localhost (accessing from Windows browser)
- Check browser permissions for camera access
- Some browsers require user interaction before accessing camera
- WSL doesn't affect camera access - it works from Windows browser

### WSL Network Issues

If you can't access localhost from Windows:
- Ensure WSL 2 is being used (not WSL 1)
- Check Windows Firewall settings
- Try accessing via `127.0.0.1` instead of `localhost`

## Production Build

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
# Serve the dist/ folder with a web server
```
