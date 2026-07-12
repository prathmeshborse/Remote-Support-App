# Portal.rtc – Zero-Installation P2P Remote Support Platform

**Portal.rtc** is a high-performance, browser-native remote assistance platform. It enables technical support agents to establish secure, direct Peer-to-Peer (P2P) connections with clients for real-time screen sharing, hardware diagnostics, and binary data exchange without requiring any software installation.

---

## Key Features

### 1. Real-Time Support Interface
*   **P2P Screen Sharing:** High-bandwidth, low-latency screen streaming utilizing WebRTC `getDisplayMedia`.
*   **Dynamic Track Swapping:** Seamlessly switch between webcam and screen sharing during active calls using the `RTCRtpSender.replaceTrack` pattern.
*   **Direct Audio/Video:** Encrypted voice and video communication directly between browsers.

### 2. High-Performance File Transfer
*   **SCTP DataChannels:** Secure, server-less file exchange.
*   **Binary Chunking:** Large files are sliced into **16KB chunks** to ensure compatibility and network stability.
*   **Flow Control & Backpressure:** Leverages the `bufferedAmount` API to monitor the outgoing buffer, preventing memory overflow and browser crashes during large transfers.

### 3. Engineering & Security
*   **Automated Telemetry:** Programmatically captures client diagnostics (OS, Browser, Battery Level, Resolution) to aid troubleshooting.
*   **Session Recording:** Integrated `MediaRecorder` API allows agents to record session segments and upload them directly to **Cloudinary**.
*   **Secure Authentication:** Multi-factor onboarding with **OTP verification** and **HttpOnly JWT Cookies** for stateful session management.
*   **Audit Trail:** Complete ticket history with connection logs and performance metrics stored in **MongoDB**.

---

## Technical Architecture

The platform follows a **MERN** stack architecture with a specialized **Signaling Layer** for WebRTC orchestration.

*   **Frontend:** React.js (Vite), Tailwind CSS, Context API (Singleton Provider Pattern).
*   **Backend:** Node.js, Express 5.x, Socket.io (Signaling Server).
*   **Database:** MongoDB Atlas (Ticket & Agent Schema).
*   **Storage:** Cloudinary (Secure Video Archiving).

### WebRTC Handshake Sequence

The following diagram illustrates how the `PeerProvider` manages the handshake and data lifecycle between two peers:

```text
USER A (Agent/Caller)               USER B (Client/Receiver)
      │                                    │
PeerProvider Mount                  PeerProvider Mount
      │                                    │
createPeerConnectionInstance()      createPeerConnectionInstance()
      │                                    │
createOffer()                              │
      │                                    │
peer.createOffer()                         │
peer.setLocalDescription()                 │
      │                                    │
      ├─────────── Offer ────────────────► │
      │                                    │
      │                        setRemoteDescription(offer)
      │                                    │
      │                          createAnswer()
      │                                    │
      │                          peer.createAnswer()
      │                          peer.setLocalDescription()
      │                                    │
      ◄─────────── Answer ─────────────────┤
      │                                    │
setRemoteAnswer(answer)                    │
peer.setRemoteDescription()                │
      │                                    │
      │       ICE Candidate Exchange       │
      ◄────────────────────────────────────►
      │                                    │
      ▼                                    ▼
connectionState = "connected"        connectionState = "connected"
      │                                    │
      │            (Automatic)             │
      │                                    │
getUserMedia()                       getUserMedia()
      │                                    │
sendStream(stream)                   sendStream(stream)
      │                                    │
peer.addTrack()                      peer.addTrack()
      │                                    │
      ├──────── Audio/Video Tracks ──────► │
      │                                    │
      │                            track event listener
      │                                    │
      │                             setRemoteStream()
      │                                    │
      │                             Remote Video Plays
      │                                    │
initDataChannel()                          │
peer.createDataChannel()                   │
      │                                    │
      ├──────── DataChannel ─────────────► │
      │                                    │
      │                        datachannel event listener
      │                                    │
      │                             setDataChannel()
      │                                    │
      ▼                                    ▼
      Chat / File Transfer / Messages / Telemetry
```

---

## Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Atlas Account
*   Cloudinary Account

### 1. Clone the Repository
```bash
git clone https://github.com/prathmeshborse/Remote-Support-App.git
cd Remote-Support-App
```

### 2. Backend Configuration
Navigate to the `server` directory and create a `.env` file:
```bash
cd server
npm install
```
**Variables:**
```env
PORT=3000
MONGODB_URL=your_mongodb_uri
JWT_SECRET=your_secret_key
MAIL_HOST=smtp.gmail.com
MAIL_USER=your_email
MAIL_PASS=your_app_password
CLOUD_NAME=your_cloud_name
API_KEY=your_api_key
API_SECRET=your_api_secret
```

### 3. Frontend Configuration
Navigate to the `client` directory and create a `.env` file:
```bash
cd ../client
npm install
```
**Variables:**
```env
VITE_SOCKET_URL=http://localhost:3000
VITE_BACKEND_URL=http://localhost:3000/api/v1
```

### 4. Run the Application
**Start Server:** `npm run dev` (in /server)  
**Start Client:** `npm run dev` (in /client)

---

## Engineering Highlights

*   **P2P Reliability:** Implemented defensive candidate staging to ensure ICE candidates are only applied after the Remote Description is set, preventing race conditions during handshakes.
*   **Memory Safety:** Utilized `ArrayBuffer` and `FileReader` for file transfers to keep the main thread responsive during heavy binary processing.
*   **Provider Pattern:** Encapsulated complex WebRTC logic into a global `PeerProvider`, ensuring connection persistence across React route changes.

---

---

**Developed by Prathamesh Borse** – Focused on scalable, real-time communication systems.
