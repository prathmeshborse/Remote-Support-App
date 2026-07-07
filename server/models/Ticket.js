// File path: server/models/Ticket.js
const mongoose = require("mongoose");

// ----------------------------------------------------------------
// 1. The Discrepancy Sub-Schema
// ----------------------------------------------------------------
const discrepancySchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["network", "file-transfer", "media-permission", "system-crash", "other"],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    severity: {
        type: String,
        enum: ["low", "medium", "high"],
        required: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    }
});

// ----------------------------------------------------------------
// 2. The Recording Sub-Schema
// ----------------------------------------------------------------
const recordingSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    },
    duration: {
        type: Number // stored in seconds
    }
});


// ----------------------------------------------------------------
// 3. The File Metadata Sub-Schema (For P2P File Transfers)
// ----------------------------------------------------------------
const fileMetadataSchema = new mongoose.Schema({
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    fileSize: {
        type: Number, // stored in bytes
        required: true
    },
    fileType: {
        type: String,
        trim: true
    },
    senderRole: {
        type: String,
        enum: ["agent", "client"],
        required: true
    },
    transferredAt: {
        type: Date,
        default: Date.now
    }
});


// ----------------------------------------------------------------
// 3. The Connection (Rejoin) Sub-Schema
// ----------------------------------------------------------------
const connectionSchema = new mongoose.Schema({
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: {
        type: Date
    },
    exitReason: {
        type: String,
        enum: ["normal-exit", "abrupt-disconnect", "user-refresh"],
        default: "abrupt-disconnect"
    },
    // Captured client hardware specs for this reconnection attempt
    deviceSpecs: {
        os: { type: String, trim: true },
        browser: { type: String, trim: true },
        resolution: { type: String, trim: true },
        batteryLevel: { type: Number }
    },
    // Captured quality metrics for this specific connection
    connectionMetrics: {
        maxLatency: { type: Number, default: 0 }, // in milliseconds
        packetLoss: { type: Number, default: 0 }  // percentage
    },
    // Array of discrete discrepancies that occurred strictly during this connection
    discrepancies: [discrepancySchema], // <-- Added the missing comma here

    // Single recording captured during this specific connection segment
    recording: recordingSchema,

    // Total chat messages exchanged during this specific connection attempt
    totalMessagesExchanged: {
        type: Number,
        default: 0
    },

    // Embedded array tracking files transferred over the P2P DataChannel during this attempt
    filesTransferred: [fileMetadataSchema]
});

// ----------------------------------------------------------------
// 4. The Main Ticket Schema
// ----------------------------------------------------------------
const ticketSchema = new mongoose.Schema({
    // Parent Reference: Links this ticket back to the Agent who created it
    agent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Agent",
        required: true
    },
    clientName: {
        type: String,
        required: [true, "Client name is required"],
        trim: true
    },
    clientEmail: {
        type: String,
        required: [true, "Client email is required"],
        trim: true,
        lowercase: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please provide a valid client email address"
        ]
    },
    roomId: {
        type: String,
        required: [true, "Room ID is required"],
        trim: true
    },
    // Dynamically locks the room to the first authorized client browser
    clientToken: {
        type: String,
        default: null
    },
    ticketStartTime: {
        type: Date,
        default: Date.now
    },
    ticketEndTime: {
        type: Date
    },
    overallStatus: {
        type: String,
        enum: ["resolved", "unresolved", "in-progress"],
        default: "in-progress"
    },
    agentNotes: {
        type: String,
        trim: true
    },
    // The embedded array of all established connections/rejoins
    connections: [connectionSchema]

}, { timestamps: true });

// ----------------------------------------------------------------
// 5. Performance Indexes
// ----------------------------------------------------------------
ticketSchema.index({ agent: 1 });
ticketSchema.index({ roomId: 1 });

module.exports = mongoose.model("Ticket", ticketSchema);


/*
When you write:

ticketSchema.index({ agent: 1 });

you are telling MongoDB:

"Create a separate, highly organized, sorted list (specifically a B-Tree data structure)
containing only Agent IDs and their exact memory locations in the database."

The value `1` means ascending order.
(If we used `-1`, MongoDB would create the index in descending order.)

===============================================================================
WHY THESE TWO INDEXES ARE VITAL FOR THE PROJECT
===============================================================================

1. ticketSchema.index({ agent: 1 })  // Dashboard Optimization

What it does:
When an agent logs in and opens their profile, the React app sends:

    Ticket.find({ agent: agentId });

to fetch all tickets assigned to that agent.

How it helps:
Without an index, MongoDB performs a collection scan and checks every document.

With the index:
- MongoDB jumps directly to the agentId in the B-Tree.
- Only matching ticket records are read.
- Dashboard queries remain extremely fast even with millions of tickets.

===============================================================================

2. ticketSchema.index({ roomId: 1 })  // Real-Time Signaling Optimization

What it does:
When a client disconnects and reconnects, the Socket.io server receives:

    join-room(roomId)

The server must quickly find the active ticket associated with that room
and append the reconnection event.

How it helps:
Real-time WebSocket operations must remain low-latency.

Without an index:
- MongoDB may scan large portions of the collection.
- Lookups can take significantly longer as data grows.

With the roomId index:
- MongoDB performs a fast index lookup.
- Query complexity improves from O(N) to approximately O(log N).
- Reconnection handling remains responsive.
- The Node.js event loop stays free from database bottlenecks.

===============================================================================
PLACEMENT / SYSTEM DESIGN INTERVIEW TALKING POINT
===============================================================================

Q: How did you ensure your WebSocket server remained low-latency while
writing connection logs to MongoDB during call drops?

A:
"We indexed the roomId and agent fields in our Ticket collection.
This reduced lookups from linear collection scans (O(N)) to logarithmic
index scans (O(log N)). As a result, Socket.io events could quickly locate
and update active tickets, minimizing database latency and preventing the
single-threaded Node.js event loop from becoming a bottleneck."
*/