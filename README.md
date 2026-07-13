# Android Server Dashboard

A lightweight, self-hosted web dashboard designed to run natively on Android devices (via UserLAnd/Alpine or Termux) to monitor system resources and manage processes.

## Prerequisites

- **Node.js** (v18 or higher)
- **Git** (for cloning and the built-in deployment manager)
- *(Optional but recommended)* **PM2** (`npm install -g pm2`) for process management

---

## 🚀 Installation (Common Steps)

Regardless of how you plan to run the dashboard, start by downloading and building the code:

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd AndroidDashboard
   ```

2. **Install dependencies:**
   This project uses a root `package.json` that manages both frontend and backend workspaces.
   ```bash
   npm install
   ```

3. **Build the project:**
   This command compiles the backend TypeScript and builds the optimized frontend static assets.
   ```bash
   npm run build
   ```

---

## 🏃 Running the Application

You can run the dashboard using different methods depending on your environment.

### Option A: With PM2 (Recommended)
PM2 is a production process manager that keeps your application running in the background and restarts it automatically if it crashes.

1. Install PM2 globally if you haven't already:
   ```bash
   npm install -g pm2
   ```
2. Start the dashboard:
   ```bash
   cd backend
   pm2 start dist/server.js --name dashboard-api
   ```
3. *(Optional)* Save your PM2 list so it restarts on boot:
   ```bash
   pm2 save
   ```

### Option B: Without PM2 (Standard Node.js)
If you don't want to use PM2 or are running in an environment that restricts background daemon processes, you can run it as a standard Node application.

1. Start the server directly:
   ```bash
   cd backend
   node dist/server.js
   ```
   *Note: This will tie up your terminal. If you close the terminal, the dashboard will stop. You can run it in the background using `nohup node dist/server.js &` on Linux/Alpine.*

### Option C: Using a Generic Server or Systemd
If you are deploying this on a standard Linux server (like Ubuntu/Debian) rather than an Android environment, you can use `systemd` to manage the service.

1. Create a service file:
   ```bash
   sudo nano /etc/systemd/system/android-dashboard.service
   ```
2. Add the following configuration (adjust paths and user accordingly):
   ```ini
   [Unit]
   Description=Android Server Dashboard
   After=network.target

   [Service]
   Type=simple
   User=your_username
   WorkingDirectory=/path/to/AndroidDashboard/backend
   ExecStart=/usr/bin/node dist/server.js
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable and start the service:
   ```bash
   sudo systemctl enable android-dashboard
   sudo systemctl start android-dashboard
   ```

---

## ⚙️ Configuration & Usage

Once running, the dashboard will be available at `http://<your-device-ip>:4000` (or the port defined in your `.env` file).

- **First Launch:** Default applications are not hardcoded. Use the **+ Add Application** button in the UI to link your running processes (e.g., `n8n`, `beszel`) for live telemetry.
- **Environment Variables:** You can create a `.env` file in the `backend/` directory to customize settings like the `PORT`, `JWT_SECRET`, or `DATA_DIR`.

## ✨ Features

- **System Telemetry:** Real-time CPU, RAM, disk, network, and battery monitoring (with custom fallbacks for restricted Android environments like UserLAnd).
- **Process Manager:** Start, stop, restart, and view logs for PM2 processes directly from the UI.
- **Git Deployments:** Built-in CI/CD to pull the latest code, rebuild, and hot-reload via the dashboard interface.
