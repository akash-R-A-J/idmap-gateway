<div align="left">

# 🔐 idmap-gateway

### Passwordless Authentication & Transaction Signing for Solana
IdMap is a decentralized identity management protocol that bridges Web2 authentication and Web3 key infrastructure using WebAuthn and Distributed Key Generation (DKG). It generates and manages key shares across two independent Rust servers, ensuring that private keys are never fully reconstructed in one place — enabling secure, user-friendly, and trustless onboarding for users and dApps.

*Powered by WebAuthn and Distributed Key Generation (DKG)*



---

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=solana&logoColor=white)](https://solana.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io/)

</div>

---

## 📖 Overview

This system enables users to create Solana wallets and sign transactions using **biometric authentication** (fingerprint, Face ID) or **hardware security keys** instead of traditional private keys.

**Key Features:**
- ✅ Passwordless authentication using WebAuthn
- ✅ Distributed key generation (no single point of failure)
- ✅ Biometric transaction signing
- ✅ Threshold signature scheme across multiple nodes
- ✅ Zero private key exposure to servers

---

## 🌐 Resources & Links

Here are all the key resources related to **IdMap** and its components:

- 🎥 **Demo Video – IdMap in Action:** [demo video](https://drive.google.com/file/d/1-GDJuX2uXrtBun4gd9xo5r3dXT6XhaDU/view?usp=sharing)
- 🔗 **IdMap Core Repository:** [github.com/akash-R-A-J/idmap-core](https://github.com/akash-R-A-J/idmap-core)
- 📘 **IdMap Gateway – Detailed Documentation:** [deepwiki.com/akash-R-A-J/idmap-gateway](https://deepwiki.com/akash-R-A-J/idmap-gateway)
- 📗 **IdMap Core – Detailed Documentation:** [deepwiki.com/akash-R-A-J/idmap-core](https://deepwiki.com/akash-R-A-J/idmap-core)
- 🚀 **Live Website:** [id-map.shop](https://www.id-map.shop/)

---

## 🏗️ Architecture & Workflow

### 🧩 System Components

<table>
<tr>
<td width="50%">

#### 🖥️ Frontend (React + Vite)
- User interface for registration, login, and transactions
- Handles WebAuthn browser APIs for passkey authentication
- Communicates with backend via REST API
- Submits signed transactions to Solana RPC

#### ⚙️ Backend (Express + TypeScript)
- REST API server with JWT-based authentication
- Manages WebAuthn challenge generation and verification
- Coordinates with DKG nodes via Redis Pub/Sub
- Stores user data, credentials, and session keys

</td>
<td width="50%">

#### 🗄️ PostgreSQL Database
- `user_schema.users` - User accounts
- `credential_schema.credentials` - WebAuthn credentials
- `key_schema.keys` - DKG session keys & Solana addresses

#### 🔄 Redis Pub/Sub
- Real-time messaging for DKG node coordination
- Distributed transaction signing without centralized storage

#### 🔗 External DKG Nodes
- Multiple servers participate in threshold signing
- Each holds a share of the signing key
- Coordinate via Redis to generate partial signatures

</td>
</tr>
</table>

---

### 📝 Registration Flow

> **User creates account and generates Solana wallet using biometric authentication**

```mermaid
sequenceDiagram
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant D as 🔗 DKG Nodes
    participant DB as 🗄️ Database

    F->>B: POST /register-options (email)
    B->>B: Generate WebAuthn challenge
    B->>F: Return WebAuthn options
    F->>F: Browser prompts for passkey
    F->>B: POST /register-verify (email, signed response)
    B->>B: Verify signature
    B->>DB: Store user & credential
    B->>D: Request DKG wallet generation
    D->>D: Generate key shares & public key
    D->>B: Return Solana address
    B->>DB: Store session key
    B->>F: Return JWT + Solana address
```

<details>
<summary><b>📊 Text-Based Flow Diagram</b></summary>

```
┌──────────┐           ┌─────────┐           ┌───────────┐        ┌──────────┐
│ Frontend │           │ Backend │           │ DKG Nodes │        │ Database │
└────┬─────┘           └────┬────┘           └─────┬─────┘        └────┬─────┘
     │                      │                      │                   │
     │  POST /register      │                      │                   │
     │  -options (email)    │                      │                   │
     ├─────────────────────>│                      │                   │
     │                      │                      │                   │
     │                      │  Generate WebAuthn   │                   │
     │                      │  challenge           │                   │
     │                      │                      │                   │
     │  <WebAuthn options>  │                      │                   │
     │<─────────────────────│                      │                   │
     │                      │                      │                   │
     │  Browser prompts     │                      │                   │
     │  for passkey         │                      │                   │
     │                      │                      │                   │
     │  POST /register      │                      │                   │
     │  -verify (signed)    │                      │                   │
     ├─────────────────────>│                      │                   │
     │                      │                      │                   │
     │                      │  Verify signature    │                   │
     │                      │                      │                   │
     │                      │  Store user          │                   │
     │                      │  & credential        │                   │
     │                      ├──────────────────────────────────────────>│
     │                      │                      │                   │
     │                      │  Request DKG wallet  │                   │
     │                      ├─────────────────────>│                   │
     │                      │                      │                   │
     │                      │                      │  Generate shares  │
     │                      │                      │  & public key     │
     │                      │                      │                   │
     │                      │  Solana address      │                   │
     │                      │<─────────────────────│                   │
     │                      │                      │                   │
     │                      │  Store session key   │                   │
     │                      ├──────────────────────────────────────────>│
     │                      │                      │                   │
     │  JWT + Solana addr   │                      │                   │
     │<─────────────────────│                      │                   │
     │                      │                      │                   │
```

</details>

---

### 🔑 Login Flow

> **Existing user authenticates using their registered passkey**

```mermaid
sequenceDiagram
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant DB as 🗄️ Database

    F->>B: POST /login-options (email)
    B->>DB: Fetch credentials
    DB->>B: Return user credentials
    B->>B: Generate challenge
    B->>F: Return WebAuthn options
    F->>F: Browser prompts for passkey
    F->>B: POST /login-verify (signed response + JWT)
    B->>B: Verify signature
    B->>DB: Update counter
    B->>F: Success + JWT token
```

<details>
<summary><b>📊 Text-Based Flow Diagram</b></summary>

```
┌──────────┐           ┌─────────┐           ┌──────────┐
│ Frontend │           │ Backend │           │ Database │
└────┬─────┘           └────┬────┘           └────┬─────┘
     │                      │                      │
     │  POST /login         │                      │
     │  -options (email)    │                      │
     ├─────────────────────>│                      │
     │                      │                      │
     │                      │  Fetch credentials   │
     │                      ├─────────────────────>│
     │                      │                      │
     │                      │  User credentials    │
     │                      │<─────────────────────│
     │                      │                      │
     │                      │  Generate challenge  │
     │                      │                      │
     │  <WebAuthn options>  │                      │
     │<─────────────────────│                      │
     │                      │                      │
     │  Browser prompts     │                      │
     │  for passkey         │                      │
     │                      │                      │
     │  POST /login-verify  │                      │
     │  (signed response)   │                      │
     ├─────────────────────>│                      │
     │                      │                      │
     │                      │  Verify signature    │
     │                      │                      │
     │                      │  Update counter      │
     │                      ├─────────────────────>│
     │                      │                      │
     │  Success + JWT       │                      │
     │<─────────────────────│                      │
     │                      │                      │
```

</details>

---

### ✍️ Transaction Signing Flow

> **User signs Solana transaction using distributed threshold signatures**

```mermaid
sequenceDiagram
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant R as 🔄 Redis Pub/Sub
    participant D as 🔗 DKG Nodes
    participant S as 🌐 Solana Network

    F->>F: User creates transaction
    F->>B: POST /send-options (JWT token)
    B->>B: Verify JWT
    B->>F: Return WebAuthn challenge
    F->>F: Browser prompts for passkey
    F->>B: POST /send-verify (signed response)
    B->>B: Verify signature
    B->>R: PUBLISH sign-start (session, message)
    R->>D: Broadcast to DKG nodes
    D->>D: Generate partial signatures
    D->>R: PUBLISH sign-result (partial sig 1)
    D->>R: PUBLISH sign-result (partial sig 2)
    D->>R: PUBLISH sign-result (partial sig N)
    R->>B: Collect all partial signatures
    B->>B: Aggregate signatures
    B->>F: Return complete signature
    F->>S: Submit signed transaction
    S->>F: Transaction confirmation
```

<details>
<summary><b>📊 Text-Based Flow Diagram</b></summary>

```
┌──────────┐    ┌─────────┐    ┌────────────┐    ┌───────────┐    ┌─────────────┐
│ Frontend │    │ Backend │    │Redis Pub/Sub│    │ DKG Nodes │    │Solana Network│
└────┬─────┘    └────┬────┘    └──────┬─────┘    └─────┬─────┘    └──────┬──────┘
     │               │                │                │                  │
     │  User creates │                │                │                  │
     │  transaction  │                │                │                  │
     │               │                │                │                  │
     │  POST /send   │                │                │                  │
     │  -options     │                │                │                  │
     ├──────────────>│                │                │                  │
     │               │                │                │                  │
     │               │  Verify JWT    │                │                  │
     │               │                │                │                  │
     │  <challenge>  │                │                │                  │
     │<──────────────│                │                │                  │
     │               │                │                │                  │
     │  Passkey      │                │                │                  │
     │  prompt       │                │                │                  │
     │               │                │                │                  │
     │  POST /send   │                │                │                  │
     │  -verify      │                │                │                  │
     ├──────────────>│                │                │                  │
     │               │                │                │                  │
     │               │  Verify sig    │                │                  │
     │               │                │                │                  │
     │               │  PUBLISH       │                │                  │
     │               │  sign-start    │                │                  │
     │               ├───────────────>│                │                  │
     │               │                │                │                  │
     │               │                │  Broadcast     │                  │
     │               │                ├───────────────>│                  │
     │               │                │                │                  │
     │               │                │                │  Generate        │
     │               │                │                │  partial sigs    │
     │               │                │                │                  │
     │               │                │  PUBLISH       │                  │
     │               │                │  sign-result   │                  │
     │               │                │<───────────────│                  │
     │               │                │  (partial 1)   │                  │
     │               │                │                │                  │
     │               │                │  PUBLISH       │                  │
     │               │                │  sign-result   │                  │
     │               │                │<───────────────│                  │
     │               │                │  (partial 2)   │                  │
     │               │                │                │                  │
     │               │  Collect all   │                │                  │
     │               │  partials      │                │                  │
     │               │<───────────────│                │                  │
     │               │                │                │                  │
     │               │  Aggregate     │                │                  │
     │               │  signatures    │                │                  │
     │               │                │                │                  │
     │  Complete sig │                │                │                  │
     │<──────────────│                │                │                  │
     │               │                │                │                  │
     │  Submit signed transaction     │                │                  │
     ├────────────────────────────────────────────────────────────────────>│
     │               │                │                │                  │
     │               │                │                │  Confirmation    │
     │<────────────────────────────────────────────────────────────────────│
     │               │                │                │                  │
```

</details>

---

### 🔒 Key Design Principles

<table>
<tr>
<td width="50%" valign="top">

#### 🛡️ Passwordless Security
- WebAuthn eliminates password-based vulnerabilities
- Private keys remain on user's device (TPM/Secure Enclave)
- Biometric authentication provides seamless UX

#### 🌐 Distributed Trust
- No single entity holds complete signing key
- Threshold signature scheme (e.g., 2-of-3) prevents single point of failure
- Redis Pub/Sub enables real-time coordination without shared state

</td>
<td width="50%" valign="top">

#### 🎫 Stateless Authentication
- JWTs carry user identity without server-side sessions
- Middleware validates tokens on protected routes
- WebAuthn counter prevents replay attacks

#### 🗂️ Database Isolation
- Separate schemas for users, credentials, and keys
- Foreign key constraints ensure referential integrity
- Automatic schema initialization on startup

</td>
</tr>
</table>

---

## 🚀 Setup Instructions

### 📋 Prerequisites

Make sure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | v18+ | JavaScript runtime |
| **PostgreSQL** | v14+ | Primary database |
| **Redis** | v6+ | Pub/Sub messaging |

---

### ⚙️ Backend Setup

<details open>
<summary><b>Click to expand/collapse</b></summary>

#### 1️⃣ Clone this repo and Navigate to backend directory
```bash
git clone https://github.com/akash-R-A-J/idmap-gateway.git
cd backend
```

#### 2️⃣ Install dependencies
```bash
npm install
```

#### 3️⃣ Configure environment variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000

# Database Configuration
PG_URL=postgresql://postgres:password@localhost:5432/idmap_db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key-change-this-in-production

# WebAuthn Configuration
RP_ID=localhost
ORIGIN=http://localhost:5173

# DKG Node Configuration
BACKEND_ID=0
TOTAL_NODES=2
REDIS_ACTION=sign
```

> **⚠️ Security Note:** Configure PG_URL and REDIS_URL according to your connection string!

#### 4️⃣ Start the development server
```bash
npm run dev
```

✅ **Backend will be running at** `http://localhost:5000`

> The server automatically initializes PostgreSQL schemas on startup.

</details>

---

### 🖥️ Frontend Setup

<details open>
<summary><b>Click to expand/collapse</b></summary>

#### 1️⃣ Navigate to frontend directory
```bash
cd ..
cd frontend
```

#### 2️⃣ Install dependencies
```bash
npm install
```

#### 3️⃣ Configure API endpoint (optional)

If your backend is **not** running on `localhost:5000`, update the API URLs in:
- `src/components/register.tsx`
- `src/components/login.tsx`
- `src/components/send.tsx`

Replace `http://localhost:5000` with your backend URL.

#### 4️⃣ Start the development server
```bash
npm run dev
```

✅ **Frontend will be running at** `http://localhost:5173`

</details>

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### 🔧 Backend

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js + TypeScript |
| **Framework** | Express |
| **Database** | PostgreSQL (pg driver) |
| **Cache/Messaging** | Redis |
| **Authentication** | @simplewebauthn/server<br>jsonwebtoken |
| **Blockchain** | @solana/web3.js |
| **Logging** | Pino |
| **Password Hashing** | Argon2 |

</td>
<td width="50%" valign="top">

### 💻 Frontend

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + Vite |
| **Language** | TypeScript |
| **Routing** | React Router |
| **Authentication** | @simplewebauthn/browser |
| **Blockchain** | @solana/web3.js |
| **HTTP Client** | Axios |
| **UI Library** | Radix UI |
| **Styling** | Tailwind CSS |
| **Animations** | Framer Motion |

</td>
</tr>
</table>

---

## 📚 Additional Notes

### 🗄️ Database Schema

The backend automatically creates three PostgreSQL schemas on startup:

| Schema | Table | Purpose |
|--------|-------|---------|
| `user_schema` | `users` | User accounts (id, email, created_at) |
| `credential_schema` | `credentials` | WebAuthn passkey data (publicKey, counter, transports) |
| `key_schema` | `keys` | DKG session keys and Solana wallet addresses |

---

### 🔐 Security Features

<table>
<tr>
<td width="50%">

**Passkey Authentication**
- Public-key cryptography (no password transmission)
- Private keys never leave user's device
- Stored in TPM/Secure Enclave

**JWT Protection**
- Stateless authentication
- Required for all protected routes
- Short-lived tokens

</td>
<td width="50%">

**Anti-Replay Mechanisms**
- WebAuthn counter increments per auth
- Backend validates counter progression
- Prevents credential replay attacks

**Distributed Signing**
- No single node holds complete key
- Threshold scheme (2-of-3, configurable)
- Redis Pub/Sub for coordination

</td>
</tr>
</table>

---

### 🔗 DKG Integration

This system requires **external DKG nodes** to be running and connected to Redis:

#### Redis Channels
| Channel | Direction | Payload |
|---------|-----------|---------|
| `sign-start` | Backend → DKG Nodes | `{id, action, session, message}` |
| `sign-result` | DKG Nodes → Backend | `{id, server_id, result_type, data}` |

#### Configuration Variables
- **`BACKEND_ID`**: Unique identifier for this backend instance (e.g., `0`)
- **`TOTAL_NODES`**: Expected number of DKG nodes (e.g., `2` or `3`)
- **`REDIS_ACTION`**: Operation type (default: `"sign"`)

> **Note:** Ensure all DKG nodes are configured and running before attempting transaction signing.

---

### 🌐 Browser Requirements

| Environment | Requirement |
|-------------|-------------|
| **Production** | HTTPS required for WebAuthn |
| **Development** | `localhost` over HTTP is permitted |
| **Supported Browsers** | Chrome 67+, Firefox 60+, Safari 13+, Edge 18+ |

**WebAuthn Authenticators:**
- Biometric sensors (Touch ID, Face ID, Windows Hello)
- Hardware security keys (YubiKey, Titan Key)
- Platform authenticators (TPM chips)

---

### 📡 API Endpoints

#### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/register-options` | Generate WebAuthn registration challenge |
| `POST` | `/api/v1/register-verify` | Verify registration and create account |
| `POST` | `/api/v1/login-options` | Generate WebAuthn login challenge |

#### Protected Endpoints (Require JWT)

| Method | Endpoint | Description | Headers |
|--------|----------|-------------|---------|
| `POST` | `/api/v1/login-verify` | Verify login and issue JWT | `token: <JWT>` |
| `POST` | `/api/v1/send-options` | Generate transaction signing challenge | `token: <JWT>` |
| `POST` | `/api/v1/send-verify` | Sign transaction via DKG nodes | `token: <JWT>` |

---

<div align="left">

### 🎯 Quick Start Checklist

- [ ] PostgreSQL running on port 5432
- [ ] Redis running on port 6379
- [ ] Backend `.env` configured
- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] DKG nodes connected to Redis
- [ ] Browser supports WebAuthn

**Ready to test?** Open `http://localhost:5173` and register your first account!

---

## Future Roadmap / Upcoming Features

- **Client-side WASM & IndexedDB**: Execute part of the DKG in-browser and store encrypted key shares client-side to enhance transparency and trust.  
- **Rust-SGX Enclave**: Securely persist server-side key shares within Intel SGX enclaves for stronger protection and decentralization.  
- **Mobile App Integration**: Enable biometric WebAuthn and local encrypted key storage for a seamless mobile identity experience.  
- **Security & TLS Layer**: Implement TLS, encryption, and request signing across all inter-service communications.  
- **Key Recovery Protocol**: Develop a decentralized recovery mechanism using threshold cryptography and multi-party consent.

---

### 📄 License

This project is part of an open-source initiative for passwordless Web3 authentication.

### 🤝 Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.

---

**Built with ❤️ for secure, passwordless Solana transactions**

</div>
