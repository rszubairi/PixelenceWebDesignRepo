# Pixelence MRI System — System Functional Documentation

---

| Field              | Detail                                         |
|--------------------|------------------------------------------------|
| **Document Title** | System Functional Documentation & Architecture |
| **System**         | Pixelence MRI Web Application                  |
| **Version**        | 1.0 (Applify-Branch)                           |
| **Date**           | 18 March 2026                                  |
| **Author**         | Raheel Zubairi                                 |
| **Status**         | Draft — Internal Review                        |

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [System Components](#4-system-components)
   - 4.1 [Next.js Web Application](#41-nextjs-web-application)
   - 4.2 [Convex Backend (BaaS)](#42-convex-backend-baas)
   - 4.3 [Express API Gateway](#43-express-api-gateway)
   - 4.4 [FastAPI ML Service](#44-fastapi-ml-service)
   - 4.5 [Mobile Application](#45-mobile-application)
5. [Data Model (Entity-Relationship)](#5-data-model-entity-relationship)
6. [Roles & Permission Matrix](#6-roles--permission-matrix)
7. [Authentication & Session Architecture](#7-authentication--session-architecture)
8. [Core Clinical Workflow](#8-core-clinical-workflow)
9. [Notification System](#9-notification-system)
10. [License & Multi-Hospital Architecture](#10-license--multi-hospital-architecture)
11. [Frontend Route Map](#11-frontend-route-map)
12. [Convex API Reference](#12-convex-api-reference)
13. [Express Gateway API Reference](#13-express-gateway-api-reference)
14. [Environment Configuration](#14-environment-configuration)
15. [Deployment Architecture](#15-deployment-architecture)

---

## 1. System Overview

Pixelence MRI System is a **multi-tenant, role-based clinical imaging management platform** for hospital MRI workflows. It connects radiographers, radiologists, and doctors in an end-to-end digital chain from patient appointment booking through DICOM image upload, AI-assisted MRI enhancement, radiologist reporting, and final doctor consultation.

### 1.1 Core Purpose

| Domain                | Capability                                                       |
|-----------------------|------------------------------------------------------------------|
| **Clinical Workflow** | Appointment → DICOM upload → AI Analysis → Report → Consultation |
| **Multi-Hospital**    | Isolated data per hospital; super-admin manages all tenants      |
| **Licensing**         | Per-scan or monthly-fixed billing; license gates staff access    |
| **Notifications**     | Real-time in-app (Convex) + email (SMTP) at each workflow stage  |
| **AI Enhancement**    | FastAPI ML service generates enhanced MRI images for radiologists|
| **Mobile Access**     | React Native mobile app for doctors to view reports & comments   |

### 1.2 Key Design Principles

- **Real-time first** — Convex reactive queries push data changes to all connected clients instantly with no polling
- **Role-isolated views** — Each role sees only the pages, data, and actions relevant to their function
- **Hospital-scoped data** — All clinical records are tagged with `hospitalId`; queries are always filtered by hospital
- **License-gated access** — Hospital staff cannot log in unless their hospital's license is active and not expired
- **Dual notifications** — Critical workflow events trigger both in-app (Convex) and email (SMTP via Express gateway) notifications simultaneously

---

## 2. High-Level Architecture

```mermaid
graph TB
    subgraph CLIENT["Client Tier"]
        WEB["Next.js Web App<br/>:3000"]
        MOBILE["React Native / Expo<br/>Mobile App"]
    end

    subgraph BACKEND["Backend Tier"]
        CONVEX["Convex BaaS<br/>(Database + Serverless Functions)"]
        GATEWAY["Express API Gateway<br/>:3001"]
        MLSVC["FastAPI ML Service<br/>:8000"]
        REDIS["Redis Cache<br/>:6379"]
    end

    subgraph EXTERNAL["External Services"]
        SMTP["SMTP Email Server"]
    end

    WEB -- "useQuery / useMutation<br/>(WebSocket)" --> CONVEX
    WEB -- "REST<br/>(DICOM upload, Notifications)" --> GATEWAY
    WEB -- "REST<br/>(Enhanced MRI)" --> MLSVC
    MOBILE -- "useQuery / useMutation<br/>(WebSocket)" --> CONVEX

    CONVEX -- "Convex Actions<br/>(HTTP fetch)" --> GATEWAY
    GATEWAY -- "REST" --> MLSVC
    GATEWAY -- "SMTP" --> SMTP
    GATEWAY --> REDIS

    style CLIENT fill:#ede9fe,stroke:#7c3aed
    style BACKEND fill:#dbeafe,stroke:#2563eb
    style EXTERNAL fill:#fef3c7,stroke:#d97706
```

### 2.1 Data Flow Overview

```mermaid
sequenceDiagram
    participant B as Browser (Next.js)
    participant C as Convex
    participant G as Gateway :3001
    participant ML as ML Service :8000
    participant S as SMTP

    B->>C: useQuery / useMutation (WebSocket)
    C-->>B: Reactive updates (real-time)

    Note over B,G: File upload & notifications
    B->>G: POST /api/dicom (DICOM files)
    G-->>B: Upload confirmation

    Note over C,G: Convex actions call gateway
    C->>G: POST /api/notifications/scan-ready
    G->>S: sendMail (radiologist)

    Note over B,ML: ML enhancement (direct from browser)
    B->>ML: POST /api/v1/enhance-mri/{jobId}
    ML-->>B: Enhanced image path
    B->>C: jobs.saveEnhancedMri(jobId, path)
```

---

## 3. Technology Stack

| Layer              | Technology                     | Version   | Role                                            |
|--------------------|--------------------------------|-----------|-------------------------------------------------|
| **Web Framework**  | Next.js                        | 14.x      | SSR/CSR React framework, page routing           |
| **UI Library**     | React                          | 18.x      | Component model                                 |
| **Styling**        | Tailwind CSS                   | 3.x       | Utility-first CSS                               |
| **Backend-as-a-Service** | Convex                   | Latest    | Reactive database, serverless functions, auth   |
| **Convex Client**  | `convex/react`                 | Latest    | `useQuery`, `useMutation`, `useAction` hooks    |
| **API Gateway**    | Express.js                     | 4.x       | File uploads, email dispatch, ML proxy          |
| **ML Service**     | FastAPI (Python)               | Latest    | MRI image enhancement pipeline                  |
| **Mobile**         | Expo / React Native            | SDK 55    | Cross-platform iOS/Android app                  |
| **Caching**        | Redis                          | 7.x       | Session/rate-limit cache on gateway             |
| **Email**          | Nodemailer                     | 6.x       | SMTP email dispatch                             |
| **Auth Hashing**   | bcryptjs                       | 2.x       | Password hashing (salt rounds: 10)              |
| **Security**       | Helmet, express-rate-limit     | Latest    | HTTP security headers, DDoS rate limiting       |
| **File Upload**    | express-fileupload             | Latest    | DICOM file upload (max 100 MB)                  |
| **Logging**        | Winston                        | 3.x       | Structured JSON logging on gateway              |
| **Monorepo**       | Turborepo                      | Latest    | Monorepo task orchestration                     |

---

## 4. System Components

### 4.1 Next.js Web Application

```mermaid
graph LR
    subgraph NEXTJS["Next.js App — pixelence-mri-system/"]
        direction TB
        PAGES["pages/"]
        COMPS["components/"]
        CTX["contexts/"]
        API_ROUTES["pages/api/"]

        subgraph PAGES
            AUTH["login.js<br/>initialize.js"]
            DASH["dashboard/<br/>doctor | radiologist<br/>radiographer | hospital-admin<br/>super-admin | finance-user | it-admin"]
            APPT["appointments/<br/>index | create | [id]"]
            RPT["reports/<br/>index | [id]"]
            IMG["images/<br/>upload | [jobId]"]
            SA["super-admin/<br/>hospitals/"]
            SET["settings/<br/>license | users | hospital-users"]
        end

        subgraph COMPS
            LAYOUT["layout/<br/>Header | Sidebar | Footer"]
            UI["ui/<br/>Modal | Notification | Button"]
            PROT["ProtectedRoute.js"]
        end

        subgraph CTX
            AUTHCTX["AuthContext.js<br/>(user, login, logout)"]
        end
    end
```

**Key conventions:**
- All pages are wrapped in `ProtectedRoute` specifying `allowedRoles`
- `AuthContext` provides `user`, `isAuthenticated`, `login()`, `logout()` to the entire tree
- `Sidebar` renders role-filtered navigation links based on `user.role`
- Convex hooks (`useQuery`, `useMutation`, `useAction`) are used directly in pages — no separate API layer on the frontend

### 4.2 Convex Backend (BaaS)

```mermaid
graph TB
    subgraph CONVEX["Convex — convex/"]
        direction LR
        SCHEMA["schema.ts<br/>(7 tables)"]

        subgraph MODULES["Function Modules"]
            AUTH_M["auth.ts<br/>login · initializeDefaultAdmin<br/>initializeSampleUsers"]
            USERS_M["users.ts<br/>getByEmail · getById<br/>listByHospital · create<br/>update · deactivate"]
            HOSP_M["hospitals.ts<br/>create · list · getById<br/>update · suspend · activate · getStats"]
            LIC_M["licenses.ts<br/>generate · getByHospital<br/>checkActive · revoke · renew<br/>getExpiringLicenses · expireStale"]
            APPT_M["appointments.ts<br/>create · list · get<br/>updateStatus"]
            JOBS_M["jobs.ts<br/>getRecentJobs · getJobById<br/>completeUpload · saveEnhancedMri<br/>updateStatus · getByRadiologist"]
            RPT_M["reports.ts<br/>create · getAllReports<br/>get · getByJob · submitReport<br/>addDoctorComment · getByDoctor"]
            NOTIF_M["notifications.ts<br/>create · getForUser<br/>getUnreadCount · markRead<br/>markAllRead"]
        end

        SCHEMA --> MODULES
    end

    CLIENT["Web / Mobile"] -- "WebSocket" --> CONVEX
```

**Function types used:**
| Type | Purpose | Network |
|------|---------|---------|
| `query` | Read-only reactive subscriptions | WebSocket (push) |
| `mutation` | Transactional writes to the database | WebSocket |
| `action` | Side effects — can call external HTTP, use bcrypt | HTTP |

### 4.3 Express API Gateway

```mermaid
graph TB
    subgraph GATEWAY["Express Gateway — backend-gateway/src/"]
        SERVER["server.js<br/>Port 3001"]

        subgraph MW["Middleware"]
            HELM["helmet (security headers)"]
            CORS_MW["cors (localhost:3000)"]
            RATE["rate-limit (100 req/15 min)"]
            UPLOAD["express-fileupload (100 MB)"]
            LOG["winston request logger"]
        end

        subgraph ROUTES["Route Modules"]
            AUTH_R["/api/auth"]
            DICOM_R["/api/dicom"]
            JOBS_R["/api/jobs"]
            NOTIF_R["/api/notifications<br/>scan-ready<br/>report-submitted<br/>license-expiring<br/>user-created"]
            HEALTH_R["/health"]
        end

        subgraph SVCS["Services"]
            REDIS_S["redis.js"]
            ML_S["mlService.js"]
        end

        SERVER --> MW
        MW --> ROUTES
        ROUTES --> SVCS
    end

    NOTIF_R -- "SMTP" --> EMAIL["Email Server"]
    SVCS --> REDIS["Redis :6379"]
    SVCS --> ML["FastAPI :8000"]
```

### 4.4 FastAPI ML Service

The ML service is an external Python FastAPI application responsible for AI-based MRI image enhancement. The web application interacts with it directly from the browser on the report detail page.

| Endpoint | Method | Called By | Purpose |
|----------|--------|-----------|---------|
| `/api/v1/enhance-mri/{jobId}` | `POST` | Browser (report detail page) | Generate enhanced MRI for a job |
| `/api/v1/enhance-mri/{jobId}` | `GET` | Browser | Retrieve existing enhanced MRI image |

After enhancement, the browser calls `jobs.saveEnhancedMri(jobId, enhancedMriPath)` to persist the result path in Convex.

### 4.5 Mobile Application

```mermaid
graph LR
    subgraph MOBILE["Expo / React Native — pixelence-mobile/"]
        SCREENS["Screens<br/>LoginScreen<br/>DashboardScreen<br/>ReportListScreen<br/>ReportDetailScreen"]
        CONVEX_PKG["@pixelence/convex<br/>(local package)"]
        SECURE["SecureStore<br/>(auth session)"]
    end

    CONVEX_PKG -- "WebSocket" --> CONVEX["Convex BaaS"]
    SCREENS --> CONVEX_PKG
    SCREENS --> SECURE
```

The mobile app uses the same Convex backend, connecting via `@pixelence/convex` (a local workspace package wrapping `convex-client`). Authentication tokens are stored in Expo SecureStore rather than localStorage. The primary mobile use case is **doctors reviewing reports and adding comments** via `ReportDetailScreen`.

---

## 5. Data Model (Entity-Relationship)

```mermaid
erDiagram
    HOSPITALS {
        id          _id         PK
        string      name
        string      address
        string      contactEmail
        string      contactPhone
        enum        status      "active | inactive | suspended"
        timestamp   createdAt
        timestamp   updatedAt
    }

    LICENSES {
        id          _id         PK
        id          hospitalId  FK
        string      licenseKey
        enum        billingType "per-scan | monthly-fixed"
        number      perScanRate
        number      monthlyRate
        number      minimumScans
        string      startDate
        string      expiryDate
        enum        status      "active | expired | revoked"
        timestamp   createdAt
    }

    USERS {
        id          _id         PK
        id          hospitalId  FK
        string      email
        string      passwordHash
        string      firstName
        string      lastName
        enum        role        "super-admin | hospital-admin | it-admin | doctor | radiologist | radiographer | finance-user"
        boolean     isActive
        string      phone
        string      department
        timestamp   createdAt
    }

    APPOINTMENTS {
        id          _id         PK
        id          hospitalId  FK
        id          radiographerId FK
        id          radiologistId  FK
        id          doctorId       FK
        string      patientName
        string      patientId
        number      age
        string      gender
        string      complaint
        string      medicalHistory
        string      causeOfReferral
        string      referringPhysician
        timestamp   scheduledDateTime
        string      status
        timestamp   createdAt
    }

    JOBS {
        id          _id         PK
        id          appointmentId  FK
        id          hospitalId     FK
        id          radiographerId FK
        id          radiologistId  FK
        string      studyType
        array       dicomFiles
        number      imageCount
        string      status
        string      priority
        string      enhancedMriPath
        timestamp   enhancedMriGeneratedAt
        timestamp   createdAt
    }

    REPORTS {
        id          _id         PK
        id          jobId       FK
        id          appointmentId FK
        id          hospitalId  FK
        id          radiologistId FK
        id          doctorId    FK
        object      aiAnalysis
        string      radiologistComments
        boolean     radiologistApproved
        timestamp   radiologistSubmittedAt
        string      doctorComments
        timestamp   doctorCommentedAt
        string      status
        timestamp   createdAt
    }

    NOTIFICATIONS {
        id          _id         PK
        id          userId      FK
        enum        type        "scan_ready | report_submitted | report_approved | new_case | license_expiring"
        string      title
        string      message
        string      referenceId
        enum        referenceType "job | report | appointment"
        boolean     isRead
        timestamp   createdAt
    }

    HOSPITALS ||--o{ LICENSES         : "has"
    HOSPITALS ||--o{ USERS            : "employs"
    HOSPITALS ||--o{ APPOINTMENTS     : "owns"
    HOSPITALS ||--o{ JOBS             : "owns"
    HOSPITALS ||--o{ REPORTS          : "owns"

    APPOINTMENTS ||--|| JOBS          : "generates"
    JOBS         ||--o| REPORTS       : "produces"

    USERS        ||--o{ NOTIFICATIONS : "receives"
    USERS        }o--o{ APPOINTMENTS  : "assigned to (radiographer/radiologist/doctor)"
    USERS        }o--o{ JOBS          : "assigned to (radiographer/radiologist)"
```

### 5.1 AI Analysis Sub-Object

The `reports.aiAnalysis` field stores structured AI output:

```
aiAnalysis {
  sitesOfUptake          : string   — Anatomical locations with abnormal uptake
  natureOfUptake         : string   — Description of uptake characteristics
  conclusion             : string   — AI-generated clinical conclusion
  diagnosisRecommendations: string  — Recommended next clinical steps
}
```

### 5.2 Status Lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Scheduled : appointment.create()

    Scheduled --> DICOM_Uploaded : jobs.completeUpload()
    DICOM_Uploaded --> Processing : ML pipeline starts
    Processing --> Enhanced : ML enhancement done
    Enhanced --> Analysis_Complete : report.create()
    Analysis_Complete --> Under_Review : radiologist opens report
    Under_Review --> Approved : reports.submitReport(approved=true)
    Under_Review --> Submitted : reports.submitReport(approved=false)
    Approved --> Completed : job & appointment finalised
    Submitted --> Completed : job & appointment finalised
    Scheduled --> Cancelled : manual cancellation
```

---

## 6. Roles & Permission Matrix

### 6.1 Role Definitions

| Role | Code | Scope | Primary Function |
|------|------|-------|-----------------|
| Super Admin | `super-admin` | System-wide (no hospitalId) | Manage all hospitals, licenses, system health |
| Hospital Admin | `hospital-admin` | Single hospital | Manage staff, monitor cases, view reports |
| IT Admin | `it-admin` | Single hospital | System config, user management |
| Doctor | `doctor` | Single hospital | Receive referrals, read reports, add clinical comments |
| Radiologist | `radiologist` | Single hospital | Review DICOM, generate enhanced MRI, submit reports |
| Radiographer | `radiographer` | Single hospital | Upload DICOM files for scheduled appointments |
| Finance User | `finance-user` | Single hospital | Billing, invoice management, revenue tracking |

### 6.2 Page Access Matrix

| Route | super-admin | hospital-admin | it-admin | doctor | radiologist | radiographer | finance-user |
|-------|:-----------:|:--------------:|:--------:|:------:|:-----------:|:------------:|:------------:|
| `/dashboard/super-admin` | ✅ | — | — | — | — | — | — |
| `/dashboard/hospital-admin` | — | ✅ | — | — | — | — | — |
| `/dashboard/it-admin` | — | — | ✅ | — | — | — | — |
| `/dashboard/doctor` | — | — | — | ✅ | — | — | — |
| `/dashboard/radiologist` | — | — | — | — | ✅ | — | — |
| `/dashboard/radiographer` | — | — | — | — | — | ✅ | — |
| `/dashboard/finance-user` | — | — | — | — | — | — | ✅ |
| `/appointments` | ✅ | ✅ | — | — | — | ✅ | — |
| `/appointments/create` | ✅ | ✅ | — | — | — | — | — |
| `/images/upload` | — | — | — | — | — | ✅ | — |
| `/reports` | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `/reports/[id]` | ✅ | ✅ | — | ✅ | ✅ | — | — |
| `/super-admin/hospitals` | ✅ | — | — | — | — | — | — |
| `/settings/license` | — | ✅ | — | — | — | — | — |
| `/settings/hospital-users` | — | ✅ | ✅ | — | — | — | — |
| `/billing` | — | — | — | — | — | — | ✅ |

### 6.3 Report Detail Feature Access

| Feature | super-admin | hospital-admin | doctor | radiologist | radiographer |
|---------|:-----------:|:--------------:|:------:|:-----------:|:------------:|
| View patient info | ✅ | ✅ | ✅ | ✅ | — |
| View AI analysis | ✅ | ✅ | ✅ | ✅ | — |
| Generate Enhanced MRI | — | — | — | ✅ | — |
| Add radiologist comments | — | — | — | ✅ | — |
| Approve & submit report | — | — | — | ✅ | — |
| View radiologist comments (read-only) | ✅ | ✅ | ✅ | — | — |
| Add doctor comments | — | — | ✅ | — | — |
| View doctor comments (read-only) | ✅ | ✅ | — | — | — |

---

## 7. Authentication & Session Architecture

### 7.1 Login Flow

```mermaid
sequenceDiagram
    actor U as User (Browser)
    participant LP as Login Page
    participant AC as AuthContext
    participant CV as Convex auth.login (Action)
    participant UQ as Convex users.getByEmail (Query)
    participant LQ as Convex licenses.checkActive (Query)
    participant LS as localStorage

    U->>LP: Enter email + password, click Sign In
    LP->>CV: useAction(api.auth.login, { email, password })

    CV->>UQ: getByEmail(email)
    UQ-->>CV: user record (or null)

    alt User not found
        CV-->>LP: Error: "Invalid email or password"
    end

    alt isActive === false
        CV-->>LP: Error: "Account is deactivated"
    end

    CV->>CV: bcrypt.compare(password, passwordHash)

    alt Password mismatch
        CV-->>LP: Error: "Invalid email or password"
    end

    alt role !== "super-admin" && hospitalId exists
        CV->>LQ: licenses.checkActive(hospitalId)
        LQ-->>CV: true | false

        alt License inactive / expired
            CV-->>LP: Error: "Hospital license inactive or expired"
        end
    end

    CV-->>LP: User object (no passwordHash)
    LP->>AC: login(userObject)
    AC->>LS: localStorage.setItem("user", JSON.stringify(userObject))
    AC->>AC: setUser(userObject)
    LP->>U: router.push(dashboardForRole)
```

### 7.2 Session & Route Guard

```mermaid
flowchart TD
    A([Page Request]) --> B{AuthContext\nloading?}
    B -- Yes --> C[Show spinner]
    B -- No --> D{user in\nlocalStorage?}
    D -- No --> E[Redirect → /login]
    D -- Yes --> F{role in\nallowedRoles?}
    F -- No --> G[Redirect → role's\nown dashboard]
    F -- Yes --> H[Render page content]
```

### 7.3 Session Storage Model

Session state lives entirely in the browser. No server-side session tokens are issued.

```
localStorage["user"] = {
  _id: "convex-document-id",
  email: "user@hospital.com",
  firstName: "Jane",
  lastName: "Doe",
  role: "radiologist",
  hospitalId: "hospital-convex-id",
  phone: "+60...",
  department: "Radiology"
}
```

**AuthContext API:**

| Member | Type | Description |
|--------|------|-------------|
| `user` | `object \| null` | Current user or null |
| `isAuthenticated` | `boolean` | `user !== null` |
| `loading` | `boolean` | True during initial localStorage read |
| `login(userData)` | `function` | Persists user to localStorage, sets context |
| `logout()` | `function` | Clears localStorage, resets context, redirects to `/login` |

---

## 8. Core Clinical Workflow

### 8.1 End-to-End Workflow

```mermaid
flowchart TD
    START([Patient Arrives]) --> A

    A["Hospital Admin / Doctor<br/>Creates Appointment<br/>/appointments → modal form"]
    A --> B["Convex: appointments.create()<br/>Auto-creates Job with status = Scheduled"]

    B --> C["Radiographer Dashboard<br/>Sees alert: Scan awaiting upload"]
    C --> D["Radiographer uploads DICOM<br/>/images/upload?jobId=..."]
    D --> E["Convex: jobs.completeUpload()<br/>Job → DICOM Uploaded<br/>Appointment → DICOM Uploaded"]

    E --> F1["In-app notification\ncreated for Radiologist"]
    E --> F2["POST /api/notifications/scan-ready\n→ Email to Radiologist"]

    F1 --> G["Radiologist logs in\nSees notification bell increment"]
    F2 --> G

    G --> H["Radiologist opens report\n/reports/[id]"]
    H --> I["Radiologist clicks Generate Enhanced MRI<br/>POST /api/v1/enhance-mri/{jobId}"]
    I --> J["FastAPI ML Service processes DICOM<br/>Returns enhanced image path"]
    J --> K["Convex: jobs.saveEnhancedMri()<br/>Enhanced image displayed"]

    K --> L["Radiologist reviews AI Analysis,\nenhanced image, adds comments"]
    L --> M{Approve?}

    M -- "Approve & Submit" --> N["Convex: reports.submitReport(approved=true)<br/>Report → Approved<br/>Job → Completed<br/>Appointment → Completed"]
    M -- "Submit with Edits" --> N2["Convex: reports.submitReport(approved=false)<br/>Report → Submitted"]

    N --> O1["In-app notification\ncreated for Doctor + Hospital Admin"]
    N --> O2["POST /api/notifications/report-submitted\n→ Email to Doctor + Hospital Admin"]
    N2 --> O1
    N2 --> O2

    O1 --> P["Doctor logs in\nSees notification bell increment"]
    O2 --> P

    P --> Q["Doctor opens report\n/reports/[id]"]
    Q --> R["Doctor reads radiologist comments\nand AI analysis"]
    R --> S["Doctor adds clinical comments\n'Save Comments' button"]
    S --> T["Convex: reports.addDoctorComment()<br/>doctorComments saved<br/>doctorCommentedAt timestamp set"]

    T --> U["Comments visible in\nmobile app ReportDetailScreen"]
    U --> END([Workflow Complete])

    style START fill:#7c3aed,color:#fff
    style END fill:#059669,color:#fff
    style N fill:#dbeafe
    style N2 fill:#fef3c7
```

### 8.2 Appointment & Job Status Transitions

```mermaid
flowchart LR
    A1["Scheduled"] -->|completeUpload| A2["DICOM Uploaded"]
    A2 -->|ML processing| A3["Processing"]
    A3 -->|enhancement done| A4["Enhanced"]
    A4 -->|report created| A5["Analysis Complete"]
    A5 -->|radiologist review| A6["Under Review"]
    A6 -->|submitReport| A7["Approved"]
    A6 -->|submitReport edits| A8["Submitted"]
    A7 -->|finalise| A9["Completed"]
    A8 -->|finalise| A9
    A1 -->|cancel| A10["Cancelled"]

    style A1 fill:#fef3c7
    style A2 fill:#dbeafe
    style A7 fill:#d1fae5
    style A9 fill:#d1fae5
    style A10 fill:#fee2e2
```

---

## 9. Notification System

### 9.1 Dual-Channel Architecture

```mermaid
graph LR
    subgraph TRIGGER["Workflow Trigger"]
        T1["DICOM Upload\njobs.completeUpload()"]
        T2["Report Submitted\nreports.submitReport()"]
        T3["License Expiring\ngetExpiringLicenses()"]
        T4["User Created\nusers.create()"]
    end

    subgraph INAPP["In-App Channel (Convex)"]
        N1["notifications.create()"]
        N2["Convex Table: notifications"]
        N3["useQuery: getForUser()"]
        N4["Notification Bell\n(real-time badge count)"]
    end

    subgraph EMAIL["Email Channel (Express Gateway)"]
        E1["POST /api/notifications/scan-ready"]
        E2["POST /api/notifications/report-submitted"]
        E3["POST /api/notifications/license-expiring"]
        E4["POST /api/notifications/user-created"]
        SMTP["Nodemailer → SMTP"]
    end

    T1 --> N1
    T1 --> E1
    T2 --> N1
    T2 --> E2
    T3 --> N1
    T3 --> E3
    T4 --> E4

    N1 --> N2
    N2 --> N3
    N3 --> N4

    E1 --> SMTP
    E2 --> SMTP
    E3 --> SMTP
    E4 --> SMTP
```

### 9.2 Notification Types

| Type | Trigger | Recipients | In-App | Email |
|------|---------|------------|:------:|:-----:|
| `scan_ready` | `jobs.completeUpload()` | Assigned radiologist | ✅ | ✅ |
| `report_submitted` | `reports.submitReport()` | Doctor + hospital-admins | ✅ | ✅ |
| `report_approved` | `reports.submitReport(approved=true)` | Doctor | ✅ | — |
| `license_expiring` | Scheduled check (≤30 days) | super-admin + hospital-admin | ✅ | ✅ |
| `new_case` | `appointments.create()` | Radiographer | ✅ | — |
| *(user created)* | `users.create()` | New staff member | — | ✅ |

### 9.3 In-App Notification Schema

```
notifications {
  userId        : id(users)         — recipient
  type          : enum              — scan_ready | report_submitted | ...
  title         : string            — short display title
  message       : string            — full notification body
  referenceId   : string?           — linked document id (job/report/appointment)
  referenceType : "job"|"report"|"appointment"
  isRead        : boolean
  createdAt     : timestamp
}

Indexes:
  by_user           [userId]
  by_user_unread    [userId, isRead]
```

### 9.4 Notification Read Flow

```mermaid
sequenceDiagram
    actor U as User
    participant H as Header Component
    participant CV as Convex

    CV-->>H: useQuery(notifications.getUnreadCount) → count (real-time)
    H->>H: Show badge with count

    U->>H: Click notification bell
    H->>CV: useQuery(notifications.getForUser, limit=20)
    CV-->>H: List of notifications (newest first)

    U->>H: Click single notification
    H->>CV: mutation: notifications.markRead(notificationId)
    CV-->>H: Updated unread count (real-time push)

    U->>H: Click "Mark All as Read"
    H->>CV: mutation: notifications.markAllRead(userId)
    CV-->>H: Count → 0 (real-time push)
```

---

## 10. License & Multi-Hospital Architecture

### 10.1 Hospital & License Structure

```mermaid
graph TB
    SA["Super Admin\n(system-wide)"]

    SA --> H1["Hospital Alpha\nstatus: active"]
    SA --> H2["Hospital Beta\nstatus: active"]
    SA --> H3["Hospital Gamma\nstatus: suspended"]

    H1 --> L1["License\nbillingType: per-scan\nperScanRate: RM 50\nexpiry: 2027-01-01\nstatus: active"]
    H2 --> L2["License\nbillingType: monthly-fixed\nmonthlyRate: RM 5000\nminimumScans: 100\nstatus: active"]
    H3 --> L3["License\nstatus: revoked"]

    H1 --> U1["Users\nhospital-admin, doctor\nradiologist, radiographer\nfinance-user, it-admin"]
    H2 --> U2["Users\n..."]
    H3 --> U3["Users\n(cannot login)"]

    H1 --> D1["Appointments\nJobs\nReports\nNotifications"]
    H2 --> D2["Appointments\nJobs\nReports\nNotifications"]
```

### 10.2 License Check at Login

```mermaid
flowchart TD
    A([Login Attempt]) --> B{role === super-admin?}
    B -- Yes --> PASS([Login Succeeds])
    B -- No --> C{hospitalId present?}
    C -- No --> PASS
    C -- Yes --> D["licenses.checkActive(hospitalId)"]
    D --> E{License status?}
    E -- "active + expiryDate > now" --> PASS
    E -- "status = revoked" --> FAIL([Error: License inactive or expired])
    E -- "status = expired" --> FAIL
    E -- "expiryDate < now" --> FAIL
    E -- "hospital.status = suspended" --> FAIL
```

### 10.3 Billing Models

| Model | Field | Behaviour |
|-------|-------|-----------|
| **Per-Scan** | `billingType: "per-scan"`, `perScanRate: number` | Invoice generated per completed MRI scan at the per-scan rate |
| **Monthly-Fixed** | `billingType: "monthly-fixed"`, `monthlyRate: number`, `minimumScans?: number` | Flat monthly fee regardless of scan volume; `minimumScans` is a contractual minimum |

### 10.4 License Key Format

```
PXLC-{hospitalId}-{year}-{randomSuffix}

Example: PXLC-k17d82hx9q3-2026-7f3a
```

A new `generate()` call automatically revokes any existing active license for that hospital before creating the new one.

### 10.5 Data Isolation

All clinical tables carry a `hospitalId` field. Every Convex query that returns clinical data accepts an optional `hospitalId` parameter:

```
appointments.list(hospitalId?)     — filters by hospitalId
jobs.getRecentJobs(limit?, hospitalId?)
reports.getAllReports(hospitalId?)
notifications.getForUser(userId)   — inherently user-scoped
```

The `super-admin` role calls these queries without `hospitalId` to get system-wide results. All other roles pass their own `hospitalId`.

---

## 11. Frontend Route Map

```mermaid
graph TD
    ROOT["/"] -->|authenticated| DASH_REDIRECT["Redirect → role dashboard"]
    ROOT -->|unauthenticated| LOGIN

    LOGIN["/login"] --> AUTH{Authenticate}
    AUTH -->|super-admin| DSA["/dashboard/super-admin"]
    AUTH -->|hospital-admin| DHA["/dashboard/hospital-admin"]
    AUTH -->|it-admin| DIT["/dashboard/it-admin"]
    AUTH -->|doctor| DDR["/dashboard/doctor"]
    AUTH -->|radiologist| DRL["/dashboard/radiologist"]
    AUTH -->|radiographer| DRG["/dashboard/radiographer"]
    AUTH -->|finance-user| DFU["/dashboard/finance-user"]

    DHA --> APPT["/appointments"]
    DRG --> APPT
    DSA --> APPT

    APPT --> APPT_CREATE["/appointments/create"]
    APPT --> APPT_ID["/appointments/[id]\n⚠ placeholder"]
    APPT --> IMG_UPLOAD["/images/upload?jobId=..."]

    DHA --> RPT["/reports"]
    DDR --> RPT
    DRL --> RPT
    DSA --> RPT

    RPT --> RPT_ID["/reports/[id]"]

    DSA --> SA_HOSP["/super-admin/hospitals"]
    SA_HOSP --> SA_NEW["/super-admin/hospitals/new\n⚠ placeholder"]
    SA_HOSP --> SA_ID["/super-admin/hospitals/[id]\n⚠ placeholder"]

    DHA --> SET_LICENSE["/settings/license"]
    DHA --> SET_USERS["/settings/hospital-users\n⚠ placeholder"]
    DHA --> SET_SYS["/settings/system"]

    INIT["/initialize\n(seed super-admin)"]
    INIT_U["/initialize-users\n(seed sample users)"]

    style APPT_ID fill:#fef3c7
    style SA_NEW fill:#fef3c7
    style SA_ID fill:#fef3c7
    style SET_USERS fill:#fef3c7
```

> **Legend:** Nodes marked ⚠ placeholder are routes that exist but render stub/empty content pending implementation.

---

## 12. Convex API Reference

### 12.1 `auth.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `login` | action | `{ email, password }` | User object | Authenticates user; checks bcrypt hash, active status, and license |
| `initializeDefaultAdmin` | action | — | `{ success, message }` | Creates super-admin `admin@pixelenceai.com` / `Click123*` (idempotent) |
| `initializeSampleUsers` | action | — | `{ success, created[] }` | Seeds 5 sample staff users (idempotent) |

### 12.2 `users.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `getByEmail` | query | `{ email }` | User (with hash) or null | Used internally by auth.login |
| `getById` | query | `{ userId }` | User (no hash) or null | Safe public fetch by ID |
| `listByHospital` | query | `{ hospitalId }` | User[] (no hashes) | All staff for a hospital |
| `listAll` | query | — | User[] (no hashes) | Super-admin: all users |
| `createInternal` | mutation | `{ email, passwordHash, firstName, lastName, role, hospitalId?, ... }` | userId | Low-level insert (hash pre-computed) |
| `create` | action | `{ email, password, firstName, lastName, role, hospitalId, ... }` | userId | Hashes password, calls createInternal, triggers welcome email |
| `update` | mutation | `{ userId, firstName?, lastName?, phone?, department?, isActive? }` | void | Patch user fields |
| `deactivate` | mutation | `{ userId }` | void | Sets `isActive: false` — blocks login |

### 12.3 `hospitals.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `create` | mutation | `{ name, address, contactEmail, contactPhone }` | hospitalId | Creates hospital with status "active" |
| `list` | query | — | Hospital[] | All hospitals ordered newest first |
| `getById` | query | `{ hospitalId }` | Hospital or null | Single hospital by ID |
| `update` | mutation | `{ hospitalId, name?, address?, contactEmail?, contactPhone? }` | void | Patch hospital fields |
| `suspend` | mutation | `{ hospitalId }` | void | status → "suspended" |
| `activate` | mutation | `{ hospitalId }` | void | status → "active" |
| `getStats` | query | — | `{ total, active, suspended }` | Aggregate counts |

### 12.4 `licenses.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `generate` | mutation | `{ hospitalId, billingType, perScanRate?, monthlyRate?, minimumScans?, startDate, expiryDate }` | licenseId | Creates new license; revokes existing active license |
| `getByHospital` | query | `{ hospitalId }` | License or null | Latest license for hospital |
| `getAllByHospital` | query | `{ hospitalId }` | License[] | Full license history |
| `checkActive` | query | `{ hospitalId }` | boolean | True if license status=active AND expiryDate > now |
| `expireStale` | mutation | — | void | Marks overdue licenses as "expired" |
| `revoke` | mutation | `{ licenseId }` | void | Sets status → "revoked" |
| `renew` | mutation | `{ licenseId, expiryDate, billingType?, ... }` | void | Updates expiry and billing terms |
| `getExpiringLicenses` | query | `{ daysAhead }` | License[] | Licenses expiring within N days |

### 12.5 `appointments.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `create` | mutation | `{ patientName, age, gender, complaint, referringPhysician, scheduledDateTime, hospitalId, radiographerId?, radiologistId?, doctorId?, ... }` | appointmentId | Creates appointment + auto-creates Job (status=Scheduled, priority=Normal) |
| `list` | query | `{ hospitalId? }` | Appointment[] | All appointments, optionally filtered |
| `getAllAppointments` | query | — | Appointment[] | System-wide (super-admin) |
| `get` | query | `{ id }` | Appointment or null | Single appointment |
| `updateStatus` | mutation | `{ appointmentId, status }` | void | Update status string |

### 12.6 `jobs.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `getRecentJobs` | query | `{ limit?, hospitalId? }` | Job[] | Recent jobs for dashboard |
| `getJobById` | query | `{ jobId }` | Job or null | Single job |
| `getByAppointment` | query | `{ appointmentId }` | Job or null | Job linked to appointment |
| `getByRadiologist` | query | `{ radiologistId }` | Job[] | Jobs assigned to radiologist |
| `completeUpload` | mutation | `{ jobId, dicomFiles[], imageCount, studyType? }` | void | Sets status→DICOM Uploaded; updates appointment; creates notification; calls gateway |
| `saveEnhancedMri` | mutation | `{ jobId, enhancedMriPath }` | void | Persists ML-generated image path |
| `updateStatus` | mutation | `{ jobId, status }` | void | Manual status update |

### 12.7 `reports.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `create` | mutation | `{ jobId, appointmentId, hospitalId, aiAnalysis? }` | reportId | Creates report with status "Analysis Complete" |
| `getAllReports` | query | `{ hospitalId? }` | Report[] | All reports for hospital |
| `get` | query | `{ id }` | Report or null | Single report by string ID |
| `getByJob` | query | `{ jobId }` | Report or null | Report linked to job |
| `getByDoctor` | query | `{ doctorId }` | Report[] | Reports for a specific doctor |
| `submitReport` | mutation | `{ reportId, radiologistId, radiologistComments, approved }` | void | Approves/submits report; updates job/appointment to Completed; creates notifications; calls gateway |
| `addDoctorComment` | mutation | `{ reportId, doctorId, doctorComments }` | void | Saves doctor's clinical notes |

### 12.8 `notifications.ts`

| Function | Type | Args | Returns | Description |
|----------|------|------|---------|-------------|
| `create` | mutation | `{ userId, type, title, message, referenceId?, referenceType? }` | notificationId | Creates in-app notification |
| `getForUser` | query | `{ userId, limit? }` | Notification[] | Notifications for user (newest first) |
| `getUnreadCount` | query | `{ userId }` | number | Count of unread notifications |
| `markRead` | mutation | `{ notificationId }` | void | Marks single notification as read |
| `markAllRead` | mutation | `{ userId }` | void | Marks all notifications read for user |

---

## 13. Express Gateway API Reference

**Base URL:** `http://localhost:3001` (configurable via `PORT` env var)

**Security:**
- Helmet HTTP headers on all responses
- CORS restricted to `CORS_ORIGINS` env var (default: `localhost:3000`)
- Rate limit: 100 requests per 15 minutes per IP on `/api/*`

### 13.1 Health

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Service info JSON |
| `GET` | `/health` | Health check (no auth required) |

### 13.2 `/api/notifications`

#### `POST /api/notifications/scan-ready`

Sends email to radiologist when a DICOM scan is uploaded.

**Request body:**

```json
{
  "radiologistEmail": "radiologist@hospital.com",
  "radiologistName": "Dr. Michael Chen",
  "patientName": "Ahmad bin Abdullah",
  "jobId": "k17d82hx9q3..."
}
```

**Response:**

```json
{ "success": true }
```

---

#### `POST /api/notifications/report-submitted`

Sends email to doctor and hospital admin(s) when a report is submitted.

**Request body:**

```json
{
  "doctorEmail": "doctor@hospital.com",
  "doctorName": "Dr. Sarah Johnson",
  "adminEmails": ["admin@hospital.com"],
  "patientName": "Ahmad bin Abdullah",
  "reportId": "r93js2k...",
  "approved": true
}
```

**Response:**

```json
{ "success": true, "notified": 2 }
```

---

#### `POST /api/notifications/license-expiring`

Sends license expiry warning to super-admin and hospital admin.

**Request body:**

```json
{
  "emails": ["admin@pixelenceai.com", "admin@hospital.com"],
  "hospitalName": "Hospital Alpha",
  "expiryDate": "2026-04-01",
  "daysLeft": 14
}
```

**Response:**

```json
{ "success": true, "notified": 2 }
```

---

#### `POST /api/notifications/user-created`

Sends welcome email with login credentials to a newly created user.

**Request body:**

```json
{
  "email": "newuser@hospital.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "radiologist",
  "password": "TempPass123!",
  "hospitalName": "Hospital Alpha"
}
```

**Response:**

```json
{ "success": true }
```

---

### 13.3 `/api/auth`

Internal auth routes (JWT-based session management for file upload operations).

### 13.4 `/api/dicom`

DICOM file upload handling. Accepts multipart/form-data with files up to 100 MB. Temporary files stored in `backend-gateway/temp/`.

### 13.5 `/api/jobs`

Job management routes — bridge between frontend and backend processing pipeline.

---

## 14. Environment Configuration

### 14.1 Next.js Web App

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | ✅ | — | Convex deployment URL |

### 14.2 Express API Gateway (`backend-gateway/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | — | `3001` | Gateway listening port |
| `SMTP_HOST` | ✅ (email) | — | SMTP server hostname |
| `SMTP_PORT` | — | `587` | SMTP port (465 for SSL) |
| `SMTP_USER` | ✅ (email) | — | SMTP authentication username |
| `SMTP_PASS` | ✅ (email) | — | SMTP authentication password |
| `EMAIL_FROM` | — | `noreply@pixelenceai.com` | Sender address in outgoing emails |
| `APP_URL` | — | `http://localhost:3000` | Frontend URL used in email links |
| `ML_SERVICE_URL` | — | `http://localhost:8000` | FastAPI ML service base URL |
| `REDIS_URL` | — | `redis://localhost:6379` | Redis connection string |
| `JWT_SECRET` | ✅ (prod) | `your-jwt-secret-key` | JWT signing secret |
| `UPLOAD_DIR` | — | `../uploads` | DICOM file upload destination |
| `MAX_FILE_SIZE` | — | `104857600` (100 MB) | Maximum upload file size in bytes |
| `CORS_ORIGINS` | — | `http://localhost:3000` | Comma-separated allowed origins |

> **Note:** If `SMTP_HOST`, `SMTP_USER`, or `SMTP_PASS` are not set, the gateway enters **dry-run mode** — emails are logged to console but not sent. This is the safe default for local development.

### 14.3 Convex

| Variable | Set Via | Description |
|----------|---------|-------------|
| Convex project config | `npx convex dev` | Auto-configured from `.env.local` |
| Gateway URL (in actions) | Hardcoded `http://localhost:3001` | Should be moved to Convex env var for production |

---

## 15. Deployment Architecture

### 15.1 Development Topology

```mermaid
graph LR
    DEV["Developer Machine"]

    subgraph LOCAL["localhost"]
        WEB["Next.js\n:3000"]
        GW["Express Gateway\n:3001"]
        ML["FastAPI ML\n:8000"]
        RD["Redis\n:6379"]
    end

    subgraph CLOUD["Cloud"]
        CV["Convex\n(dev project)"]
        SMTP_C["SMTP Provider\n(e.g. SendGrid / IONOS)"]
    end

    DEV --> WEB
    WEB --> CV
    WEB --> GW
    WEB --> ML
    GW --> RD
    GW --> SMTP_C
    GW --> ML
    CV --> GW
```

### 15.2 Recommended Production Topology

```mermaid
graph TB
    subgraph CDN["CDN / Edge"]
        NEXT_P["Next.js (Vercel / AWS)"]
    end

    subgraph PROD["Production Cloud"]
        GW_P["Express Gateway\n(Docker / ECS)"]
        ML_P["FastAPI ML\n(GPU instance)"]
        RD_P["Redis\n(ElastiCache)"]
        STORE["Object Storage\n(S3 / Azure Blob)\nDICOM files + Enhanced MRI"]
    end

    subgraph SaaS["SaaS"]
        CV_P["Convex\n(production project)"]
        SMTP_P["SMTP\n(SendGrid / SES)"]
    end

    NEXT_P --> CV_P
    NEXT_P --> GW_P
    NEXT_P --> ML_P
    GW_P --> RD_P
    GW_P --> SMTP_P
    GW_P --> ML_P
    GW_P --> STORE
    ML_P --> STORE
    CV_P --> GW_P
```

### 15.3 Monorepo Package Structure

```
PixelenceWebDesignRepo/
├── convex/                      — Convex function source (schema, auth, users, ...)
│   ├── schema.ts
│   ├── auth.ts
│   ├── users.ts
│   ├── hospitals.ts
│   ├── licenses.ts
│   ├── appointments.ts
│   ├── jobs.ts
│   ├── reports.ts
│   ├── notifications.ts
│   └── _generated/              — Auto-generated by npx convex dev (do not edit)
│
├── convex-client/               — Shared Convex client wrapper
│   └── src/index.ts             — anyApi-based untyped client
│
├── pixelence-mri-system/        — Next.js web application
│   ├── pages/                   — All routes
│   ├── components/              — Shared UI components
│   ├── contexts/                — React context providers
│   ├── styles/                  — Global CSS / Tailwind config
│   └── backend-gateway/         — Express API gateway
│       ├── src/
│       │   ├── server.js
│       │   ├── routes/
│       │   ├── middleware/
│       │   └── services/
│       └── package.json
│
├── pixelence-mobile/            — Expo React Native app
│   └── screens/
│
├── docs/                        — Project documentation
│   ├── UAT-Test-Plan.md
│   └── System-Functional-Documentation.md
│
├── turbo.json                   — Turborepo pipeline config
└── package.json                 — Root workspace config
```

---

*Document End — Pixelence MRI System Functional Documentation v1.0*
