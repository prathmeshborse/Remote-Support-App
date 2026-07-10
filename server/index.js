// File path: server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cookie = require("cookie"); // <-- Import the lightweight cookie parser
const jwt = require("jsonwebtoken");
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

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/"
}));

// 3. API Routes Mounting
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/tickets", ticketRoutes);

// 4. Server & Socket.io Configuration
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    },
});

// Memory stores mapping active users to socket IDs
const emailToSocket = new Map();
const socketToEmail = new Map();

// 5. Real-Time WebRTC Socket.io Engine
io.on("connection", (socket) => {
    console.log("A user connected: ", socket.id);

    // SECURE INTERCEPTOR: Automatically parse and verify HttpOnly JWT cookie on connection
    try {
        const cookies = socket.handshake.headers.cookie;
        if (cookies) {
            // Parse cookies from the handshake headers
            const parsedCookies = require("cookie").parse(cookies);
            const token = parsedToken = parsedCookies.token;

            if (token) {
                // Verify the JWT payload securely
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                // Bind the authenticated Agent's database ID directly to the socket context
                socket.data.authenticatedAgentId = decoded.id;
                console.log(`Socket ${socket.id} authenticated securely as Agent: ${decoded.id}`);
            }
        }
    } catch (authError) {
        // Safe fail: if it fails, socket.data.authenticatedAgentId remains undefined (e.g. client connections)
        socket.data.authenticatedAgentId = null;
    }

    // Upgraded Secure Handshake with Dynamic Session Locking and Identity Verification
    socket.on("join-room", async ({ email, roomId, clientToken }) => {
        if (!email || !roomId) { return; }

        try {
            // 1. Fetch the ticket from MongoDB
            const ticket = await Ticket.findOne({ roomId }).populate("agent");
            if (!ticket) {
                socket.emit("join-error", { message: "Invalid room link." });
                return;
            }

            // 2. Prevent entry if the ticket has already been resolved and closed
            if (ticket.overallStatus === "resolved") {
                socket.emit("join-error", { message: "Access denied. Support ticket is already resolved." });
                return;
            }

            // 3. Security Verify identities
            // A. Check if they are the authorized client
            const isClient = (email === ticket.clientEmail);
            // B. Enforce that they are the EXACT Agent who created this ticket
            const isCreatorAgent = (
                ticket.agent && 
                socket.data.authenticatedAgentId && 
                socket.data.authenticatedAgentId === ticket.agent._id.toString()
            );

            if (!isClient && !isCreatorAgent) {
                socket.emit("join-error", { message: "Access denied. You are not authorized to join this workspace." });
                console.warn(`Blocked unauthorized access attempt for email ${email} in room ${roomId}`);
                return;
            }
            
            // ----------------------------------------------------------------
            // NEW FIX: Map Socket Connections immediately upon successful validation [2.1]
            // This ensures sandboxed clients are fully mapped before the Agent arrives!
            // ----------------------------------------------------------------
            emailToSocket.set(email, socket.id);
            socketToEmail.set(socket.id, email);
            // ----------------------------------------------------------------

            
            // 4. Role-Based Routing
            if (isCreatorAgent) {
                // Agent joins cleanly
                socket.join(roomId);
                socket.data.email = email;
                socket.data.roomId = roomId;
                socket.data.isAgent = true;

                socket.emit("room-joined", { roomId, role: "agent" });
                
                // Alert any sandboxed clients currently waiting inside the room
                socket.to(roomId).emit("agent-joined", { email });
                console.log(`Creator Agent ${email} joined and activated room ${roomId}`);

            } else if (isClient) {
                // --------------------------------------------------------
                // ANTI-HIJACKING GATEKEEPER: DYNAMIC SESSION LOCKING
                // --------------------------------------------------------
                let verifiedToken = clientToken;

                if (ticket.clientToken) {
                    // Mismatch: Different browser tries to claim the same email
                    if (ticket.clientToken !== clientToken) {
                        socket.emit("join-error", { 
                            message: "Access denied. This support session is already active on another browser or device." 
                        });
                        console.warn(`Blocked unauthorized hijack attempt for client ${email} in room ${roomId}`);
                        return;
                    }
                    
                    // Match: Same browser reloads or re-joins. Terminate older active socket to handle refreshes cleanly
                    const activeSockets = await io.in(roomId).fetchSockets();
                    for (const activeSocket of activeSockets) {
                        if (activeSocket.data.email === email && activeSocket.id !== socket.id) {
                            activeSocket.emit("kicked", { message: "Session opened in another window" });
                            activeSocket.disconnect(true);
                            console.log(`Terminated redundant socket session for client ${email}`);
                        }
                    }
                } else {
                    // First Join: Lock this ticket to this client's browser
                    const crypto = require("crypto");
                    const generatedToken = crypto.randomUUID();

                    ticket.clientToken = generatedToken;
                    await ticket.save();

                    verifiedToken = generatedToken;
                    console.log(`Locked room ${roomId} to client token: ${verifiedToken}`);
                }
                // --------------------------------------------------------

                // Gatekeeper Check: Ensure the creator Agent is actively online in the room
                const activeSockets = await io.in(roomId).fetchSockets();
                const isAgentPresent = activeSockets.some(s => s.data.isAgent === true);

                if (isAgentPresent) {
                    // Agent is online. Connect the Client to signaling pool immediately
                    socket.join(roomId);
                    socket.data.email = email;
                    socket.data.roomId = roomId;
                    socket.data.isAgent = false;

                    socket.emit("room-joined", { roomId, role: "client", clientToken: verifiedToken });
                    console.log(`Client ${email} joined active room ${roomId}`);
                } else {
                    // Agent is offline. Sandbox the Client in a waiting state
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
            socket.emit("join-error", { message: "Internal server error during connection handshake." });
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

    // Voluntary leave room signal (Combines connection closure and metadata logging in a single save) [✓]
    socket.on("leave-room", async ({ roomId, email, totalMessagesExchanged, filesTransferred }) => {
        if (roomId && email) {
            socket.to(roomId).emit("user-left", { email });
            console.log(`${email} left room ${roomId} voluntarily.`);

            // MongoDB Audit Trail: Update the DB Connection in a single atomic transaction [4.1]
            try {
                const ticket = await Ticket.findOne({ roomId });
                if (ticket && ticket.connections.length > 0) {
                    const lastConnection = ticket.connections[ticket.connections.length - 1];
                    
                    // If the connection is unclosed, record the clean departure and metadata
                    if (!lastConnection.leftAt) {
                        lastConnection.leftAt = Date.now();
                        lastConnection.exitReason = "normal-exit";
                        lastConnection.totalMessagesExchanged = totalMessagesExchanged || 0;
                        lastConnection.filesTransferred = filesTransferred || [];
                        await ticket.save();
                        console.log(`Logged voluntary departure and synchronized metadata for room ${roomId}`);
                    }
                }
            } catch (dbError) {
                console.error("Database leave-room audit error:", dbError);
            }
        }
    });

    // Sudden disconnection or page refreshes
    socket.on("disconnect", async () => {
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