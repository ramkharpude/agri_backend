# Backend Documentation - AgriConsult Pro

## Overview

The **AgriConsult Pro Backend** is a robust RESTful API built with **Node.js** and **Express.js**. It powers the mobile applications (User & Admin) by managing data persistence, authentication, real-time communications, and logic for agricultural consultations and e-commerce.

It is written in **TypeScript** for type safety and scalability, using **Sequelize ORM** for database interactions.

---

## Technology Stack

*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Language**: TypeScript
*   **Database**: PostgreSQL (Production) / SQLite (Dev)
*   **ORM**: Sequelize
*   **Real-time Communication**: Socket.io
*   **Authentication**: JWT (JSON Web Tokens)
*   **File Uploads**: Multer + Cloudinary (presumed based on common patterns) or Local Storage
*   **Security**: Helmet, CORS, Express-Rate-Limit

### System Architecture
```mermaid
graph TD
    Client[Mobile Apps] -->|HTTP/REST| LB[Load Balancer/Render]
    LB --> Server[Express Server]
    Server -->|Auth Middleware| Auth[JWT Validation]
    Auth --> Controller[Controllers]
    Controller --> Service[Business Logic]
    Service -->|Sequelize ORM| DB[(PostgreSQL Database)]
    
    Client -->|Socket.io| Socket[Socket Service]
    Socket <-->|Events| Room[Consultation Rooms]
    Socket --> DB
```

---

## Setup & Configuration

### Prerequisites
*   Node.js v16+
*   PostgreSQL (or SQLite for local dev)
*   TypeScript Compiler (`tsc`)

### Environment Variables (`.env`)
Create a `.env` file in the root directory:

\`\`\`env
PORT=5000
NODE_ENV=development
# Database Connection
DATABASE_URL=postgres://user:pass@host:5432/dbname
# Authentication
JWT_SECRET=your_super_secret_key
# External Services
CLOUDINARY_URL=cloudinary://key:secret@cloudname
\`\`\`

### Installation
1.  **Install Dependencies**:
    \`\`\`bash
    npm install
    \`\`\`
2.  **Build Project**:
    \`\`\`bash
    npm run build
    \`\`\`
3.  **Run Development Server**:
    \`\`\`bash
    npm run dev
    \`\`\`
4.  **Database Migration**:
    The server automatically syncs models on startup (`sequelize.sync({ alter: true })`).

---

## Database Schema (ERD)

The application uses a relational database model managed by Sequelize.

```mermaid
erDiagram
    User ||--o{ Plot : owns
    User ||--o{ Order : places
    User ||--o{ Consultation : requests
    User ||--o{ Notification : receives
    
    Plot ||--o{ DiseaseReport : has
    Consultation ||--o{ Message : contains
    Consultation }o--|| Schedule : linked_to
    
    User {
        int id PK
        string phoneNumber
        string role "farmer/admin"
        string pushToken
    }
    
    Plot {
        int id PK
        int userId FK
        string cropType
        string location
    }
    
    DiseaseReport {
        int id PK
        int plotId FK
        string image
        string status "pending/diagnosed"
        string solution
    }
    
    Order {
        int id PK
        int userId FK
        string status
        float totalAmount
    }
```

---

## API Documentation

### 1. Authentication (`/api/auth`)
Handles user registration via OTP and Admin login.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/send-otp` | Sends OTP to phone number. |
| POST | `/verify-otp` | Verifies OTP and returns JWT. |
| POST | `/admin-login` | Email/Password login for admins. |
| POST | `/update-fcm-token` | Updates device push token for notifications. |

### 2. Admin Dashboard (`/api/admin`)
Aggregated data for the admin app.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/stats` | Dashboard counters (Users, Plots, etc.). |
| GET | `/shop-stats` | E-commerce analytics. |
| PUT | `/plots/:id/status` | Approve/Reject user plots. |

### 3. Consultations & Chat
Manage doctor-farmer interactions.

*   **REST API**: `/api/consultations` for creating and listing sessions.
*   **Socket.io**: Real-time chat.

#### Socket Event Flow
```mermaid
sequenceDiagram
    participant Farmer
    participant Server
    participant Admin
    
    Note over Farmer: Join Consultation
    Farmer->>Server: emit('join_consultation', consultationId)
    Server-->>Farmer: join(room)
    
    Note over Farmer: Send Message
    Farmer->>Server: emit('send_message', {content, type, ...})
    Server->>DB: Save Message
    Server-->>Admin: emit('receive_message', msg)
    Server-->>Farmer: emit('receive_message', msg)
```

### 4. Products & Orders (`/api/products`, `/api/orders`)
E-commerce functionality.

*   **Products**: CRUD for seeds, fertilizers, tools.
*   **Orders**: Lifecycle management (Placed -> Shipped -> Delivered).

### 5. Disease Management (`/api/diseases`)
*   **Upload**: Doctors/Farmers upload crop images.
*   **Diagnosis**: Admins update the record with solutions.

---

## Real-time Services (Socket.io)

The `socket.service.ts` module initializes a WebSocket server.

*   **Connection**: Clients connect to the base URL.
*   **Rooms**: Each consultation has a unique ID used as a room name.
*   **Events**:
    *   `join_consultation`: Client joins a specific chat room.
    *   `send_message`: Client sends a text/image message.
    *   `receive_message`: Server broadcasts the message to the room.

---

## Deployment

The backend is configured for deployment on platforms like **Render** or **Heroku**.

*   **Build Step**: Compiles TypeScript to JavaScript in `dist/`.
*   **Start Command**: `node dist/index.js`.
*   **Timezone**: Configured to `Asia/Kolkata` in `index.ts`.
*   **Rate Limiting**: Configured to prevent abuse (1000 req/15min).

---

*Generated by AgriConsult Pro Dev Team*
