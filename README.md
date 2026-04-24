# 🌍 Air Quality Monitoring System

A full-stack web application for real-time air pollution tracking across multiple monitoring stations. Built with **Spring Boot** (backend) and **Angular** (frontend).

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [System Architecture](#-system-architecture)
- [Database Schema](#-database-schema)
- [REST API Reference](#-rest-api-reference)
- [Frontend Pages](#-frontend-pages)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Future Enhancements](#-future-enhancements)

---

## 🚨 Problem Statement

Air pollution poses serious risks to human health. Existing monitoring solutions are either too costly or lack real-time visibility. This system provides a lightweight, browser-based platform to:

- Collect pollution readings from multiple stations
- Flag readings that exceed safe thresholds
- Visualise live trends through an interactive dashboard
- Allow administrators to configure safety limits

---

## 🎯 Objectives

| # | Objective |
|---|---|
| 1 | Store air quality readings from multiple stations in a relational database |
| 2 | Detect and flag readings exceeding safe pollutant limits |
| 3 | Provide a real-time visual dashboard with live chart animations |
| 4 | Allow admins to configure safe-limit thresholds via a protected panel |
| 5 | Generate analytical insights — worst pollution hour, daily averages |
| 6 | Expose a clean REST API consumable by any client |

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Core language |
| Spring Boot | 4.0.5 | Application framework |
| Spring Data JPA | managed | ORM / database abstraction |
| Spring Web MVC | managed | REST API layer |
| Hibernate | managed | JPA implementation |
| MySQL | 8.x | Relational database |
| Lombok | managed | Boilerplate reduction |
| Maven Wrapper | present | Build tool |

### Frontend
| Technology | Purpose |
|---|---|
| Angular 19 (standalone) | UI framework |
| TypeScript | Language |
| Chart.js | Line & bar chart visualisations |
| Angular Signals | Reactive state for limit thresholds |
| Angular Router | Client-side navigation |
| HttpClient | REST API communication |

---

## 📁 Project Structure

```
airquality/
├── air-quality-backend/
│   ├── pom.xml
│   └── src/main/java/com/airquality/
│       ├── AirQualityApplication.java       # Entry point
│       ├── controller/
│       │   ├── ReadingController.java        # Reading REST endpoints
│       │   └── StationController.java        # Station REST endpoints
│       ├── entity/
│       │   ├── Reading.java                  # Sensor reading record
│       │   ├── Station.java                  # Monitoring station
│       │   ├── Pollutant.java                # Pollutant type (PM2.5, CO₂)
│       │   └── LimitValue.java               # Safe threshold per pollutant
│       ├── repository/
│       │   ├── ReadingRepository.java        # Reading DB access + custom queries
│       │   ├── StationRepository.java        # Station DB access
│       │   ├── PollutantRepository.java      # Pollutant DB access
│       │   └── LimitRepository.java          # Limit DB access
│       ├── service/
│       │   ├── ReadingService.java           # Exceed detection, aggregation
│       │   └── ReportService.java            # Daily average report builder
│       └── resources/
│           └── application.properties        # DB config, server port
│
└── air-quality-frontend/
    └── src/app/
        ├── app.ts                            # Root shell component
        ├── app.routes.ts                     # Route definitions
        ├── app.config.ts                     # Global providers
        ├── api.ts                            # HTTP service (ApiService)
        ├── limits.service.ts                 # Reactive limits state (Signals)
        ├── readings/
        │   ├── readings.ts                   # Main dashboard component
        │   ├── readings.html                 # Dashboard template
        │   └── readings.css                  # Dashboard styles
        ├── login/
        │   ├── login.ts                      # Admin login component
        │   ├── login.html                    # Login form template
        │   └── login.css
        └── admin/
            ├── admin.ts                      # Admin panel component
            ├── admin.html                    # Admin panel template
            └── admin.css
```

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser (Angular SPA)               │
│                                                  │
│  ReadingsDashboard → LoginPage → AdminPanel      │
│              ↓ HttpClient                        │
│           ApiService                             │
└──────────────────┬──────────────────────────────┘
                   │ HTTP REST (port 8081)
┌──────────────────▼──────────────────────────────┐
│            Spring Boot Backend                   │
│                                                  │
│  Controllers → Services → Repositories           │
└──────────────────┬──────────────────────────────┘
                   │ JDBC
        ┌──────────▼──────────┐
        │  MySQL (air_quality) │
        │  station             │
        │  pollutant           │
        │  reading             │
        │  limit_value         │
        └─────────────────────┘
```

---

## 🗄 Database Schema

```sql
CREATE TABLE station (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(255),
    location VARCHAR(255)
);

CREATE TABLE pollutant (
    id   INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255),    -- e.g. PM2.5, CO₂
    unit VARCHAR(50)      -- e.g. µg/m³, ppm
);

CREATE TABLE reading (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    station_id   INT,
    pollutant_id INT,
    value        DOUBLE,
    timestamp    DATETIME
);

CREATE TABLE limit_value (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    pollutant_id INT,
    safe_limit   DOUBLE
);
```

> **Note:** `spring.jpa.hibernate.ddl-auto=update` automatically creates these tables on first run.

---

## 📡 REST API Reference

**Base URL:** `http://localhost:8081/api`

### Stations

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/stations` | Get all monitoring stations |

### Readings

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/readings` | Get all sensor readings | — |
| `POST` | `/readings` | Add a new reading | `Reading` JSON |
| `GET` | `/readings/exceed` | Readings above safe limits | — |
| `GET` | `/readings/exceed/daily` | Exceed counts grouped by station | — |
| `GET` | `/readings/worst-hour` | Hour of day with highest avg pollution | — |
| `GET` | `/readings/daily-report` | Average reading value per date | — |

#### Example — POST `/api/readings`

```json
{
  "stationId": 1,
  "pollutantId": 2,
  "value": 134.5,
  "timestamp": "2025-04-16T10:30:00"
}
```

#### Example — GET `/api/readings/daily-report` Response

```json
{
  "2025-04-15": 87.3,
  "2025-04-16": 65.1
}
```

---

## 🖥 Frontend Pages

### `/` — Dashboard (ReadingsComponent)

The main monitoring dashboard featuring:

- **Summary cards** — total stations, total readings, safe/unsafe counts
- **Station Map Lite** — colour-coded grid (🟢 Safe / 🟡 Moderate / 🔴 Danger) per station
- **Live PM2.5 chart** — animated Chart.js line chart, replays readings hour by hour
- **Live CO₂ chart** — animated Chart.js line chart for CO₂ trends
- **Exceed bar chart** — readings over the limit per station
- **Worst hour panel** — shows which hour of day has peak average pollution
- **Filterable readings table** — filter by station, configurable page size

Speed controls: **0.5× / 1× / 1.5× / 2×** for the live simulation playback.

---

### `/login` — Admin Login (LoginComponent)

Simple login form gating access to the admin panel.

| Credential | Value |
|---|---|
| Username | `admin` |
| Password | `admin123` |

On success, sets `localStorage['aq_admin']` and redirects to `/admin`.

---

### `/admin` — Admin Panel (AdminComponent)

Allows administrators to configure safe-limit thresholds for PM2.5 and CO₂. Changes are applied reactively across the entire dashboard via Angular Signals without a page reload.

- **PM2.5 Limit** (default: `100 µg/m³`)
- **CO₂ Limit** (default: `500 ppm`)

> Limits are held in memory and reset on page refresh (not yet persisted to the backend).

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|---|---|
| Java JDK | 17+ |
| Maven | via wrapper (`mvnw`) |
| Node.js | 18+ |
| Angular CLI | `npm install -g @angular/cli` |
| MySQL | 8.x running locally |

---

### 1. Database Setup

```sql
CREATE DATABASE air_quality;
```

Create a MySQL user or use `root`. The tables are created automatically by Hibernate on first run.

---

### 2. Backend Setup

```bash
cd air-quality-backend

# Configure database credentials in:
# src/main/resources/application.properties

# Run the application
./mvnw spring-boot:run        # Linux/Mac
.\mvnw.cmd spring-boot:run    # Windows
```

Backend starts on **http://localhost:8081**

---

### 3. Frontend Setup

```bash
cd air-quality-frontend

npm install

ng serve
```

Frontend starts on **http://localhost:4200**

---

## ⚙ Configuration

`air-quality-backend/src/main/resources/application.properties`

```properties
# Database
spring.datasource.url=jdbc:mysql://localhost:3306/air_quality
spring.datasource.username=root
spring.datasource.password=root

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.database-platform=org.hibernate.dialect.MySQLDialect

# Server
server.port=8081
spring.application.name=air-quality
```

---

## 🔮 Future Enhancements

| Area | Enhancement |
|---|---|
| **Security** | JWT-based authentication with Spring Security |
| **Security** | BCrypt-hashed passwords stored in the database |
| **Backend** | Proper `@ManyToOne` JPA relationships between entities |
| **Backend** | SQL-level exceed detection instead of in-memory loop |
| **Backend** | Pagination on all list endpoints |
| **Backend** | WebSocket / SSE for true real-time data push |
| **Backend** | Global exception handler with structured error responses |
| **Database** | Flyway/Liquibase schema versioning |
| **Database** | Indexes on `timestamp`, `station_id`, `pollutant_id` |
| **Frontend** | Persist admin limits to backend database |
| **Frontend** | Angular `CanActivate` route guards (replace localStorage check) |
| **Frontend** | Global HTTP error interceptor |
| **Frontend** | CSV / PDF export for readings and reports |
| **Frontend** | Mobile-responsive CSS improvements |
| **DevOps** | Docker + Docker Compose for one-command deployment |
| **DevOps** | GitHub Actions CI/CD pipeline |
| **Alerts** | Email/SMS notifications on threshold breach via SendGrid/Twilio |

---

## 👤 Author

Air Quality Monitoring System — developed as a full-stack demonstration project using Spring Boot and Angular.
