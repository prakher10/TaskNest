# TaskNest — Modern Project Management Platform

TaskNest is a high-fidelity, full-stack project management application designed for modern teams. It features a sleek, animated UI, real-time-ready data management with MongoDB, and a robust authentication system.

## 🚀 Key Features

- **Dynamic Dashboard**: Visualize your workspace progress at a glance.
- **Kanban Task Board**: Manage tasks with a professional drag-and-drop style interface.
- **Project Detail View**: Complex SVG animations (trash can lid, paper spinning) for delightful micro-interactions.
- **Animated Components**: Sliding letter buttons and premium hover effects throughout.
- **Full Auth System**: Secure login, signup, and profile management with JWT and OTP verification.
- **Cloud-Ready**: Fully integrated with MongoDB Atlas for global data persistence.

## 📁 Project Structure

This is a mono-repo containing both the frontend and backend:

- `/backend`: Node.js/Express API with MongoDB/Mongoose.
- `/project-harmony-ui-main`: React/Vite frontend with Tailwind CSS and Framer Motion.

---

## 🛠️ Local Setup

### 1. Backend Setup
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure Environment Variables:
   Create a `.env` file in the `/backend` folder.
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_secret
   EMAIL_USER=your_gmail
   EMAIL_PASS=your_app_password
   ```
4. Seed the database:
   ```bash
   node scripts/seed.js
   ```
5. Start the server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd project-harmony-ui-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## ☁️ Deployment Guide

### Step 1: Push to GitHub
1. Initialize git in the root folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 2: Deploy to Railway
1. **Backend**: Create a service, set Root Directory to `backend`, add your `.env` variables.
2. **Frontend**: Create a second service, set Root Directory to `project-harmony-ui-main`, add `VITE_API_URL` variable pointing to your backend.

---

## 📄 License
MIT License. Created by Prakher Singh.
