// File path: server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const { Server } = require("socket.io");
const { createServer } = require("http");

// Import Database & Cloud Storage Connections
const connectDB = require("./config/db");
const { cloudinaryConnect } = require("./config/cloudinary");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const ticketRoutes = require("./routes/ticketRoutes");

const Ticket = require("./models/Ticket");

const app = express();

// 1. Establish External Connections
connectDB();
cloudinaryConnect();

// 2. Global HTTP Processing Middlewares
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Crucial for reading/writing HttpOnly JWT cookies
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());
app.use(cookieParser()); // Parses cookies into req.cookies

// Configure express-fileupload to support streaming media to Cloudinary
app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/" // Stashes video segments locally in temp directories before Cloudinary uploads
}));

// 3. API Routes Mounting
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/tickets", ticketRoutes);

// 4. Server & Socket.io Configuration
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Memory stores mapping users to socket sessions
const emailToSocket = new Map();
const socketToEmail = new Map();

// 5. Real-Time WebRTC Socket.io Engine
io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // Socket joins the secure support room
    // Upgraded Handshake with Dynamic Session Locking inside server/index.js
    socket.on("join-room", async ({ email, roomId, clientToken }) => {
        if (!email || !roomId) { return; }

        try {
            // 1. Fetch active ticket and populate the Agent reference
            const ticket = await Ticket.findOne({ roomId }).populate("agent");
            if (!ticket) {
                socket.emit("join-error", { message: "Invalid room link" });
                return;
            }

            // 2. Prevent entry if the ticket has already been resolved and closed
            if (ticket.overallStatus === "resolved") {
                socket.emit("join-error", { message: "Access denied. Support ticket is already resolved." });
                return;
            }

            // 3. Verify user identities matching the ticket whitelist
            const isClient = (email === ticket.clientEmail);
            const isAgent = (ticket.agent && email === ticket.agent.email);

            if (!isClient && !isAgent) {
                socket.emit("join-error", { message: "Access denied. Email is not authorized for this support ticket." });
                return;
            }

            // 4. Role-Based Gateway
            if (isAgent) {
                // If Agent joins, connect them immediately
                socket.join(roomId);
                socket.data.email = email;
                socket.data.roomId = roomId;
                socket.data.isAgent = true;

                emailToSocket.set(email, socket.id);
                socketToEmail.set(socket.id, email);

                socket.emit("room-joined", { roomId, role: "agent" });
                
                // Broadcast presence to any waiting clients currently inside the room
                socket.to(roomId).emit("agent-joined", { email });
                console.log(`Agent ${email} activated and joined room ${roomId}`);

            } else if (isClient) {
                // --------------------------------------------------------
                // SECURITY ADDITION: DYNAMIC SESSION LOCKING
                // --------------------------------------------------------
                let verifiedToken = clientToken;

                // Case A: The ticket is already locked to a specific browser
                if (ticket.clientToken) {
                    // Reject the request if the incoming token does not match the lock in the database
                    if (ticket.clientToken !== clientToken) {
                        socket.emit("join-error", { 
                            message: "Access denied. This support session is already active on another browser or device." 
                        });
                        console.warn(`Blocked unauthorized hijack attempt for client ${email} in room ${roomId}`);
                        return;
                    }
                    
                    // The token matches! (This is the same client refreshing their browser or switching tabs)
                    // To handle refreshes and prevent duplicate ghost streams, disconnect the older active socket:
                    const activeSockets = await io.in(roomId).fetchSockets();
                    for (const activeSocket of activeSockets) {
                        if (activeSocket.data.email === email && activeSocket.id !== socket.id) {
                            activeSocket.emit("kicked", { message: "Session opened in another window" });
                            activeSocket.disconnect(true); // Terminate the old socket cleanly
                            console.log(`Disconnected redundant socket session for client ${email}`);
                        }
                    }
                } 
                // Case B: This is the client's first connection attempt (No lock exists yet)
                else {
                    // Generate a cryptographically secure UUID natively
                    const crypto = require("crypto");
                    const generatedToken = crypto.randomUUID();

                    // Persist the token to MongoDB to lock the room
                    ticket.clientToken = generatedToken;
                    await ticket.save();

                    verifiedToken = generatedToken; // Send this token back to React for localStorage saving
                    console.log(`Locked room ${roomId} to client token: ${verifiedToken}`);
                }
                // --------------------------------------------------------

                // Gatekeeper: Inspect active sockets in room to verify Agent presence
                const activeSockets = await io.in(roomId).fetchSockets();
                const isAgentPresent = activeSockets.some(s => s.data.isAgent === true);

                if (isAgentPresent) {
                    // Agent is present. Allow client to join and send them their verified token
                    socket.join(roomId);
                    socket.data.email = email;
                    socket.data.roomId = roomId;
                    socket.data.isAgent = false;

                    emailToSocket.set(email, socket.id);
                    socketToEmail.set(socket.id, email);

                    socket.emit("room-joined", { roomId, role: "client", clientToken: verifiedToken });
                    console.log(`Client ${email} joined active room ${roomId}`);
                } else {
                    // Agent is offline. Sandbox client so they can listen for "agent-joined" triggers,
                    // but instruct the React app to display the "Waiting Lobby" screen.
                    socket.join(roomId);
                    socket.data.email = email;
                    socket.data.roomId = roomId;
                    socket.data.isAgent = false;

                    socket.emit("waiting-for-agent", { roomId, clientToken: verifiedToken });
                    console.log(`Client ${email} sandboxed in waiting state in room ${roomId}`);
                }
            }

        } catch (error) {
            console.error("Socket join-room Error:", error);
            socket.emit("join-error", { message: "Internal server error occurred during connection handshake" });
        }
    });

    // Notify other peer that user has loaded their device media and is ready to talk
    socket.on("user-ready", () => {
        const email = socket.data.email;
        const roomId = socket.data.roomId;
        if (email && roomId) {
            socket.to(roomId).emit("user-joined", { email });
            console.log(`Notification sent: ${email} is ready in room ${roomId}`);
        }
    });

    // Client A initiates call (sends Offer)
    socket.on('call-user', ({ email, offer }) => {
        console.log("call-user Target email:", email);
        const socketId = emailToSocket.get(email);

        if (!socketId) {
            console.log("Socket not found for email:", email);
            return;
        }

        socket.to(socketId).emit('incoming-call', {
            from: socketToEmail.get(socket.id),
            offer
        });
    });

    // Client B accepts call (sends back Answer)
    socket.on('call-received', ({ email, ans }) => {
        const socketId = emailToSocket.get(email);
        if (!socketId) return;

        socket.to(socketId).emit('call-accepted', { ans });
    });

    // Forward network routing details (ICE Candidates) P2P
    socket.on('ice-candidate', ({ email, candidate }) => {
        const socketId = emailToSocket.get(email);
        if (!socketId) return;
        socket.to(socketId).emit('incoming-ice-candidate', { candidate });
    });

    // Voluntary leave room signal
    socket.on("leave-room", async ({ roomId, email }) => { // Make this handler async
        if (roomId && email) {
            socket.to(roomId).emit("user-left", { email });
            console.log(`${email} left room ${roomId} voluntarily.`);

            // MongoDB Audit Trail: Update the DB Connection to "normal-exit" on voluntary departure
            try {
                const ticket = await Ticket.findOne({ roomId });
                if (ticket && ticket.connections.length > 0) {
                    const lastConnection = ticket.connections[ticket.connections.length - 1];
                    
                    // If the connection is unclosed, record the clean departure
                    if (!lastConnection.leftAt) {
                        lastConnection.leftAt = Date.now();
                        lastConnection.exitReason = "normal-exit"; // Log as clean voluntary exit
                        await ticket.save();
                        console.log(`Logged voluntary departure audit for room ${roomId}`);
                    }
                }
            } catch (dbError) {
                console.error("Database leave-room audit error:", dbError);
            }
        }
    });

    // Sudden disconnection or page refreshes
    socket.on("disconnect", async () => { // Make this function async so we can use await
        const email = socketToEmail.get(socket.id);
        const roomId = socket.data.roomId;

        console.log("Disconnected:", socket.id, email);

        socketToEmail.delete(socket.id);
        if (email) {
            emailToSocket.delete(email);
        }

        // Broadcast to remaining peer
        if (roomId && email) {
            socket.to(roomId).emit("user-left", { email });
        }

        // MongoDB Audit Trail: Automatically write disconnect metadata on WebSocket drops
        if (roomId) {
            try {
                const ticket = await Ticket.findOne({ roomId });
                if (ticket && ticket.connections.length > 0) {
                    const lastConnection = ticket.connections[ticket.connections.length - 1];
                    
                    // If the connection is unclosed, record the drop timestamp and cause
                    if (!lastConnection.leftAt) {
                        lastConnection.leftAt = Date.now();
                        lastConnection.exitReason = "abrupt-disconnect";
                        await ticket.save();
                        console.log(`Logged abrupt disconnection audit for room ${roomId}`);
                    }
                }
            } catch (dbError) {
                console.error("Database disconnect audit error:", dbError);
            }
        }
    });
});


// 6. Start Consolidated Server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});