# 🚀 DevInterviewer: Real-Time Collaborative Interview Platform

**DevInterviewer** is a high-performance, full-stack technical recruitment platform designed to facilitate seamless live coding interviews. It combines a synchronized professional code editor with integrated **Real-Time Video Conferencing**, enabling interviewers and candidates to collaborate as if they were in the same room.

---

## ✨ Core Features

* **📹 Live Video & Audio:** Integrated Peer-to-Peer (P2P) communication using **WebRTC**, allowing for low-latency face-to-face technical discussions.
* **💻 Synchronized Code Workspace:** A shared **Monaco Editor** (the engine behind VS Code) where both parties see code changes in real-time.
* **⚡ Bi-Directional Sync:** Powered by **Socket.io** for instant signaling, room management, and code synchronization.
* **📊 Smart Dashboard:** A clean management interface to schedule interviews, manage candidate profiles, and review past session notes.
* **🎨 SaaS-Level UI/UX:** A modern, minimal interface built with **Angular 21**, **Tailwind CSS**, and **DaisyUI**, featuring dynamic theme support.
* **🔐 Secure Access:** JWT-based authentication ensures that only authorized interviewers can create and manage "Interview Rooms."

---

## 🛠️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Angular 21 (Signals, Standalone Components, RxJS) |
| **Real-Time** | Socket.io (Signaling) & PeerJS / WebRTC (Media) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Mongoose ODM) |
| **Styling** | Tailwind CSS + DaisyUI |

---

## 🏗️ System Architecture

The project follows a modern, decoupled architecture:

1.  **Signaling Server:** A Node.js/Socket.io server that handles the "handshake" between the interviewer and the candidate to establish a connection.
2.  **Peer-to-Peer Stream:** Once the handshake is complete, video and audio data travel directly between browsers via WebRTC to ensure maximum speed and privacy.
3.  **State Management:** **Angular Signals** manage the local UI state (camera toggles, mute status, editor content) for a highly reactive and bug-free experience.

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18+)
* MongoDB Atlas account or a local MongoDB instance
* Angular CLI (`npm install -g @angular/cli`)

### 2. Installation

```bash
# Clone the repository
git clone [https://github.com/your-username/DevInterviewer.git](https://github.com/your-username/DevInterviewer.git)

# Setup Backend
cd backend
npm install
# Create a .env file and add:
# PORT=5000
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_secret_key

# Setup Frontend
cd ../frontend
npm install