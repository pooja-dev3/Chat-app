# 💬 Real-Time Chat Application

A full-stack, real-time messaging application built with **React**, **Node.js**, **Express**, **Socket.io**, and **MongoDB**.

---

## 🚀 Features

- 🔐 **User Authentication**: Secure JWT-based authentication (Register / Login / Logout).
- 💬 **Real-time Messaging**: Instant message delivery powered by **Socket.io**.
- 🖼️ **Media Sharing**: Image uploads supported via **Multer**.
- 🟢 **Online Status Tracking**: Real-time tracking of active and offline users.
- 📬 **Message Status & Read Receipts**: Track unread messages and message status.
- 👤 **User Profiles**: View and update user profiles, bios, and profile pictures.
- 🎨 **Modern Responsive UI**: Built with React 19, Tailwind CSS v4, and Vite for optimal performance across devices.

---

## 🛠️ Tech Stack

### Frontend (`/client`)
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4
- **Routing**: React Router v7
- **Real-Time Client**: Socket.io Client

### Backend (`/server`)
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-Time Server**: Socket.io
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs
- **File Storage**: Multer for handling multipart/form-data uploads

---

## 📁 Project Structure

```text
chat-devdeploy/
│
├── client/                 # Frontend React application
│   ├── public/             # Static public assets
│   ├── src/                # React source code (components, pages, context)
│   ├── package.json        # Frontend dependencies & scripts
│   └── vite.config.js      # Vite configuration
│
├── server/                 # Backend Node.js/Express server
│   ├── middleware/         # Custom authentication & validation middleware
│   ├── models/             # Mongoose schemas (User, Message)
│   ├── routes/             # API routes (Auth, User, Message)
│   ├── index.js            # Server entry point & Socket.io initialization
│   └── package.json        # Backend dependencies & scripts
│
├── docker/                 # Containerization configuration
│   ├── Dockerfile.client   # Dockerfile for client frontend
│   └── Dockerfile.server   # Dockerfile for server backend
│
├── .github/                # GitHub Actions & CI/CD workflows
│   └── workflows/          # CI workflow definitions (ci.yml)
│
├── .gitignore              # Git ignore rules
├── README.md               # Project documentation
└── docker-compose.yml      # Multi-container Docker compose setup
```

---

## ⚙️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas connection URI)

---

### 1. Clone the Repository

```bash
git clone https://github.com/pooja-dev3/Chat-app.git
cd Chat-app
```

---

### 2. Backend Setup (`/server`)

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the `server` root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   ```

4. Start the backend server:
   ```bash
   # Development mode (with nodemon auto-reload)
   npm run dev

   # Production mode
   npm start
   ```
   The backend server will start on `http://localhost:5000`.

---

### 3. Frontend Setup (`/client`)

1. Open a new terminal window and navigate to the `client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
### 4. Running with Docker Compose 🐳

Alternatively, you can run the entire stack (MongoDB, Backend, Frontend) with a single Docker Compose command:

```bash
docker-compose up --build
```

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017/chatapp`

---

## 📡 API Routes Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Log in user and receive JWT token |
| `GET` | `/api/auth/me` | Fetch current authenticated user |
| `POST` | `/api/auth/logout` | Log out user |
| `PUT` | `/api/auth/profile` | Update user profile |
| `GET` | `/api/users/all` | Fetch all registered users |
| `GET` | `/api/users/search?q=query` | Search users by name/email |
| `GET` | `/api/messages/:userId` | Get chat history with a specific user |
| `POST` | `/api/messages/send` | Send a new message (text / image) |
| `PUT` | `/api/messages/:messageId/seen` | Mark a message as seen |

---

## 🌿 Git Branching Strategy

We follow a simple structured branching workflow:

```text
feature/*  ───(Pull Request / Merge)───>  develop  ───>  main  ───>  production
```

### Branch Hierarchy

- **`feature/*`**: Active development of individual features/fixes (e.g., `feature/chat-ui`, `feature/socket-fix`, `feature/auth`).
- **`develop`**: Primary integration branch for completed feature branches.
- **`main`**: Pre-release / staging branch containing verified code.
- **`production`**: Live production code.

---

### Step-by-Step Workflow Guide

#### 1. Create a Feature Branch from `develop`
```bash
git checkout develop
git pull origin develop
git checkout -b feature/chat-ui
```

#### 2. Commit Changes & Push Feature Branch
```bash
git add .
git commit -m "feat: implement chat user interface component"
git push -u origin feature/chat-ui
```

#### 3. Merge Feature Branch into `develop`
```bash
git checkout develop
git merge feature/chat-ui
git push origin develop
```

#### 4. Promote from `develop` → `main` → `production`
```bash
# Merge develop into main
git checkout main
git merge develop
git push origin main

# Merge main into production
git checkout production
git merge main
git push origin production
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page or submit pull requests.

---

## 📜 License

This project is licensed under the **ISC License**.
