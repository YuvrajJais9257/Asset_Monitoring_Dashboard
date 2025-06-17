# 🚀 Asset Monitoring Dashboard – Full Stack App (React + FastAPI)

A scalable, full-stack solution for managing organizational reports, users, dashboards, and schedulers. Built with a **React.js frontend** and a **FastAPI backend**, it empowers both admins and end-users with rich features, dynamic layouts, and automated alerts.

---

## 📦 Tech Stack

* **Frontend:** React.js
* **Backend:** FastAPI, Python
* **Database:** MySQL
* **Task Scheduler & Mailer:** Python multiprocessing + SMTP
* **Authentication:** JWT

---

## 🧩 Key Features

### 📝 1. Report Management

* **Create, edit, delete, and view reports**
* Customize:

  * **Content & Title**
  * **Font styles, colors, formatting**
  * **Chart type**: Box, Card, Table, Graphs
  * **SQL query** to update live data
* **Drill-down reports**
* Assign reports to users or groups with specific access levels

### 👥 2. User & Group Management

* **Role-based access control (RBAC)**
* Admin capabilities:

  * Add, delete, update users and groups
  * Move or copy users between groups
  * Reset user passwords
* Users can:

  * Update personal information
  * View only authorized features and data sources

### 📊 3. Dashboard Management

* **Drag-and-drop layout builder**
* **Resizable widgets**
* Add, remove, edit dashboard components
* Create multiple dashboards with unique configurations
* Assign dashboards to groups with custom access (read/write/view)

### ⏰ 4. Report Scheduler

* Schedule reports to be:

  * Sent **daily/weekly/monthly**
  * Delivered as **PDF, Excel, or CSV**
* Email includes:

  * Table/chart visualizations
  * Real-time data snapshots
  * Descriptive content
* Alerts and report delivery sent to registered user emails

---

## 📁 Folder Structure

### Backend (`/app`)

| Folder/File         | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `api/endpoints/v1/` | All core API routes (user, report, dashboard, scheduler) |
| `config/`           | App and DB settings (`config.ini`)                       |
| `utilities/`        | Logging, encryption, DB interaction, auth                |
| `middleware/`       | Router registration and app initialization               |
| `service/`          | Business logic layer for each domain                     |
| `ScheduleTask.py`   | Handles scheduled tasks and email automation             |
| `main.py`           | Entry point for launching services using multiprocessing |
| `logs/`             | Rotating log files by module/date                        |

---

### Frontend (`/frontend`)

| Feature                  | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| **React UI**             | Built using React functional components                                   |
| **Role-based rendering** | Feature components rendered based on user privileges                      |
| **Dashboard builder**    | Drag, resize, and save dashboard frames using Grid Layout                 |
| **Dynamic theming**      | Report and dashboard visuals (fonts, colors, etc.) are customizable       |
| **API Integration**      | Fully integrated with the FastAPI backend via secure token-based requests |

---

## 🛠️ Installation

### Backend Setup

```bash
git clone https://github.com/your-repo/asset-monitoring-dashboard
cd backend/
pip install -r requirements.txt
python main.py
```

Ensure you encrypt DB password using `encryption.py` and update it in `config.ini`.

### Frontend Setup

```bash
cd frontend/
npm install
npm start
```

---

## 🔐 Authentication

1. Use `/validate-login` to authenticate user
2. Copy the JWT `access_token` from response
3. Use the token in **Authorization Header** for further requests

---

## 🧪 API Overview (Major Routes)

### ✅ Report

* `POST /updateReport`
* `POST /getReportTemplatealldetail`
* `POST /assignReports`
* `POST /saveDrillDownReport`

### 👤 User

* `POST /saveUser`
* `POST /deleteUser`
* `POST /resetPassword`
* `POST /authorization`

### 📋 Dashboard

* `POST /saveFrame`
* `POST /updateFrame`
* `POST /listDashboard`
* `POST /deleteFrame`

### 📆 Scheduler

* `POST /saveScheduler`
* `POST /updateScheduler`
* `POST /listScheduler`
* `POST /deleteScheduler`

---

## ✨ Live Features Preview

* Dynamic dashboards with **drag-resize-save** functionality
* Real-time **email alerts with embedded visuals**
* Admin can copy/move users across groups and **reset passwords**
* Restricted feature visibility **based on user roles**


