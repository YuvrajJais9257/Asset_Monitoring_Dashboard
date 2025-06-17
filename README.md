# 🚀 Asset Monitoring Dashboard – Full Stack App (React + FastAPI)

[![Live Demo](https://img.shields.io/badge/🌐%20Live-Demo-blue?style=flat-square&logo=google-chrome)](https://hyphenview.in/)

A scalable, full-stack solution for managing organizational reports, users, dashboards, and schedulers. Built with a **React.js frontend** and a **FastAPI backend**, it empowers both admins and end-users with rich features, dynamic layouts, and automated alerts.

---

## 📸 Screenshots

> 📂 Located in `/Screenshots` folder. Preview of major app features below:

### 🖥️ Dashboard & Builder UI

![Screenshot 2025-06-18 023719](./Screenshots/Screenshot%202025-06-18%20023719.png)
![Screenshot 2025-06-18 023731](./Screenshots/Screenshot%202025-06-18%20023731.png)
![Screenshot 2025-06-18 023741](./Screenshots/Screenshot%202025-06-18%20023741.png)
![Screenshot 2025-06-18 023750](./Screenshots/Screenshot%202025-06-18%20023750.png)

### 📋 Report & Query Editor

![Screenshot 2025-06-18 023758](./Screenshots/Screenshot%202025-06-18%20023758.png)
![Screenshot 2025-06-18 023805](./Screenshots/Screenshot%202025-06-18%20023805.png)
![Screenshot 2025-06-18 023818](./Screenshots/Screenshot%202025-06-18%20023818.png)
![Screenshot 2025-06-18 023832](./Screenshots/Screenshot%202025-06-18%20023832.png)

### 👥 User & Group Management

![Screenshot 2025-06-18 023842](./Screenshots/Screenshot%202025-06-18%20023842.png)
![Screenshot 2025-06-18 023854](./Screenshots/Screenshot%202025-06-18%20023854.png)
![Screenshot 2025-06-18 023903](./Screenshots/Screenshot%202025-06-18%20023903.png)
![Screenshot 2025-06-18 023912](./Screenshots/Screenshot%202025-06-18%20023912.png)

### ⏰ Scheduler & Mail Preview

![Screenshot 2025-06-18 023921](./Screenshots/Screenshot%202025-06-18%20023921.png)
![Screenshot 2025-06-18 023927](./Screenshots/Screenshot%202025-06-18%20023927.png)
![Screenshot 2025-06-18 023935](./Screenshots/Screenshot%202025-06-18%20023935.png)

### 🔧 Miscellaneous Settings & Features

![Screenshot 2025-06-18 024024](./Screenshots/Screenshot%202025-06-18%20024024.png)
![Screenshot 2025-06-18 024040](./Screenshots/Screenshot%202025-06-18%20024040.png)
![Screenshot 2025-06-18 024050](./Screenshots/Screenshot%202025-06-18%20024050.png)
![Screenshot 2025-06-18 024100](./Screenshots/Screenshot%202025-06-18%20024100.png)
![Screenshot 2025-06-18 024110](./Screenshots/Screenshot%202025-06-18%20024110.png)
![Screenshot 2025-06-18 024127](./Screenshots/Screenshot%202025-06-18%20024127.png)

---

## 📦 Tech Stack

- **Frontend:** React.js
- **Backend:** FastAPI (Python)
- **Database:** MySQL
- **Scheduler:** Python multiprocessing + SMTP
- **Auth:** JWT

---

## 🧩 Major Features

### 📝 Report Management
- Create, edit, preview reports
- Customize font, color, title, SQL query, and chart type (Box, Table, Graph)
- Support for drill-downs and feature tagging

### 👥 User Management
- Add/remove/edit users and groups
- Move/copy users between groups
- Admin resets passwords; users can edit personal data
- Data source restrictions based on role

### 📊 Dashboard Builder
- Drag-and-drop, resizable components
- Add charts, boxes, tables
- Group-based access and multi-dashboard support

### ⏰ Report Scheduler
- Email scheduled reports (PDF/CSV/XLSX)
- Supports attachments and HTML preview
- Multiple recipients and interval setup (Daily, Weekly, etc.)

---

## 📁 Project Structure

### Backend (`/app`)
- `api/`: Endpoints (reports, users, dashboards, scheduler)
- `service/`: Business logic
- `middleware/`: Router integration
- `utilities/`: Logging, auth, encryption
- `config.ini`: DB and JWT setup
- `main.py`: Launch APIs with multiprocessing

### Frontend (`/frontend`)
- React app with role-based rendering
- Layout: Responsive & modular
- Integrated with FastAPI using JWT-based APIs

---

## 🛠️ Setup

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
````

> 🔐 Encrypt DB password using `encryption.py` before updating `config.ini`.

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🔐 Authentication Flow

1. Call `POST /validate-login` with user credentials
2. Copy the `access_token` from the response
3. Use it as `Authorization: Bearer <token>` in all secure endpoints

### 🧪 Default Login Credentials

```txt
Username: test@erasmith.com
Password: 12345
```

> ⚠️ For production, replace or disable test credentials.

---

## 🧪 API Highlights

* `/getReportTemplates`, `/updateReport`, `/assignReports`
* `/saveUser`, `/deleteUser`, `/authorization`
* `/saveFrame`, `/updateFrame`, `/listDashboard`
* `/saveScheduler`, `/listScheduler`, `/deleteScheduler`

