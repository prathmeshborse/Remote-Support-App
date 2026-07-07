// File path: server/controllers/ticketController.js
const crypto = require("crypto");
const Ticket = require("../models/Ticket");
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");

const Agent = require("../models/Agent");
const mailSender = require("../utils/mailSender");
const supportInvitationTemplate = require("../email_template/supportInvitationTemplate");
const { url } = require("inspector");

// @desc    Create a new support ticket and generate a secure Room ID
// @route   POST /api/tickets/create
// @access  Private (Agent only)
exports.createTicket = async (req, res) => {
    try {
        const { clientName, clientEmail } = req.body;
        const agentId = req.user.id;

        // 1. Validation check
        if (!clientName || !clientEmail) {
            return res.status(400).json({
                success: false,
                message: "Client name and email are required"
            });
        }

        // 2. Fetch the Agent to access their full name for the invitation email
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found"
            });
        }

        // 3. Generate a standard RFC 4122 v4 UUID natively
        const roomId = crypto.randomUUID();

        // 4. Create the Ticket record in MongoDB
        const ticket = await Ticket.create({
            agent: agentId,
            clientName,
            clientEmail,
            roomId,
            overallStatus: "in-progress"
        });

        // 5. Construct the full front-end joining URL
        const frontendUrl = process.env.CLIENT_URL || "http://localhost:5173";
        const joiningUrl = `${frontendUrl}/room/${roomId}`;

        // 6. Send the automated HTML invitation directly to the client's inbox
        try {
            await mailSender(
                clientEmail,
                `Remote Support Session Invitation - Ticket Generated`,
                supportInvitationTemplate(joiningUrl, agent.firstName, agent.lastName)
            );
            console.log(`Support invitation email successfully sent to ${clientEmail}`);
        } catch (mailError) {
            // Log mail failure, but do not block API execution (allows local manual copy-paste fallback)
            console.error("Warning: Support email invitation failed to send:", mailError);
        }

        // 7. Return the created ticket metadata (including roomId) to the Agent
        return res.status(201).json({
            success: true,
            message: "Support ticket generated and client invitation dispatched successfully.",
            data: ticket,
            joiningUrl: joiningUrl
        });

    } catch (error) {
        console.error("Error in createTicket:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while creating ticket",
            error: error.message
        });
    }
};


// @desc    Get all support tickets created by the authenticated Agent
// @route   GET /api/tickets/history
// @access  Private
exports.getAgentTickets = async (req, res) => {
    try {
        const agentId = req.user.id;

        // Fetch all tickets for this agent, sorting newest to oldest
        const tickets = await Ticket.find({ agent: agentId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            message: "Agent tickets history retrieved successfully",
            totalTickets: tickets.length,
            data: tickets
        });

    } catch (error) {
        console.error("Error in getAgentTickets:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while fetching history",
            error: error.message
        });
    }
};


// @desc    Upload recorded video segment to Cloudinary and link it to a specific connection
// @route   POST /api/tickets/upload-recording
// @access  Private
exports.saveConnectionRecording = async (req, res) => {
    try {
        const { roomId, connectionId, startedAt, endedAt, duration } = req.body;
        
        // Assumes file-handling middleware (like express-fileupload) is configured on the server
        const videoFile = req.files?.video; 

        // 1. Validation check
        if (!roomId || !connectionId || !videoFile) {
            return res.status(400).json({
                success: false,
                message: "Room ID, Connection ID, and video file are required"
            });
        }

        // 2. Find the parent Ticket document by roomId
        const ticket = await Ticket.findOne({ roomId });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found with provided Room ID"
            });
        }

        // 3. Locate the sub-document connection using Mongoose's built-in .id() helper
        const connection = ticket.connections.id(connectionId);
        if (!connection) {
            return res.status(404).json({
                success: false,
                message: "Specific connection attempt not found under this ticket"
            });
        }

        // 4. Upload video segment to Cloudinary
        const uploadResponse = await uploadToCloudinary(
            videoFile,
            "support-recordings",
            "auto",
            "video"
        );

        // 5. Append the Cloudinary reference details directly to the connection
        connection.recording = {
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
            startedAt: startedAt ? new Date(startedAt) : undefined,
            endedAt: endedAt ? new Date(endedAt) : undefined,
            duration: duration ? Number(duration) : undefined
        };

        // 6. Save the parent ticket document to write changes to DB
        await ticket.save();

        return res.status(200).json({
            success: true,
            message: "Recording successfully saved to connection segment",
            data: connection
        });

    } catch (error) {
        console.error("Error in saveConnectionRecording:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred during recording upload",
            error: error.message
        });
    }
};


// @desc    Initialize a connection attempt inside the Ticket's connection array (Captures System Specs)
// @route   POST /api/tickets/connection-start
// @access  Private (Agent only)
exports.startConnection = async (req, res) => {
    try {
        const { roomId, deviceSpecs } = req.body;

        // 1. Validation check
        if (!roomId) {
            return res.status(400).json({
                success: false,
                message: "Room ID is required to start a connection log"
            });
        }

        // 2. Locate the parent Ticket by its Room ID
        const ticket = await Ticket.findOne({ roomId });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found with provided Room ID"
            });
        }

        // 3. Optional Integrity Check: If there's an unclosed connection, mark it as abruptly disconnected
        if (ticket.connections && ticket.connections.length > 0) {
            const lastConn = ticket.connections[ticket.connections.length - 1];
            if (!lastConnection.leftAt) {
                lastConnection.leftAt = Date.now();
                lastConnection.exitReason = "abrupt-disconnect";
            }
        }

        // 4. Push a new connection sub-document into the array
        ticket.connections.push({
            joinedAt: Date.now(),
            deviceSpecs: deviceSpecs || {} // Saves the client diagnostics (OS, Browser, screen specs)
        });

        // 5. Commit changes to MongoDB
        await ticket.save();

        // 6. Access the newly created connection (the last item in the connections array)
        const newConnection = ticket.connections[ticket.connections.length - 1];

        return res.status(201).json({
            success: true,
            message: "Connection segment initialized on database",
            connectionId: newConnection._id, // Return this ID to React so we can link video recordings to it
            data: ticket
        });

    } catch (error) {
        console.error("Error in startConnection:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while initializing connection",
            error: error.message
        });
    }
};


// @desc    Close and resolve support ticket with agent notes and clean exit tracking
// @route   PUT /api/tickets/ticket-close
// @access  Private
exports.closeTicket = async (req, res) => {
    try {
        const { roomId, overallStatus, agentNotes } = req.body;

        // 1. Validation check
        if (!roomId || !overallStatus) {
            return res.status(400).json({
                success: false,
                message: "Room ID and final status are required to close ticket"
            });
        }

        // 2. Locate the ticket by Room ID
        const ticket = await Ticket.findOne({ roomId });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Ticket not found with provided Room ID"
            });
        }

        // 3. Update parent ticket details
        ticket.overallStatus = overallStatus;
        ticket.ticketEndTime = Date.now();
        if (agentNotes !== undefined) {
            ticket.agentNotes = agentNotes;
        }

        // 4. Clean Connection Close: Mark the last unclosed connection attempt as a clean exit
        if (ticket.connections && ticket.connections.length > 0) {
            const lastConnection = ticket.connections[ticket.connections.length - 1];
            if (!lastConnection.leftAt) {
                lastConnection.leftAt = Date.now();
                lastConnection.exitReason = "normal-exit"; // Log as clean exit
            }
        }

        // 5. Save updates
        await ticket.save();

        return res.status(200).json({
            success: true,
            message: "Support ticket successfully resolved and closed",
            data: ticket
        });

    } catch (error) {
        console.error("Error in closeTicket:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while closing ticket",
            error: error.message
        });
    }
};



// @desc    Public endpoint to validate support link status and temporal expiration
// @route   GET /api/tickets/validate/:roomId
// @access  Public (No authorization token required)
exports.validateTicket = async (req, res) => {
    try {
        const { roomId } = req.params;

        // 1. Locate the ticket in MongoDB
        const ticket = await Ticket.findOne({ roomId });
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: "Invalid support room link"
            });
        }

        // 2. Gatekeeper Check A: Has the ticket already been resolved?
        if (ticket.overallStatus === "resolved") {
            return res.status(400).json({
                success: false,
                message: "This support session has already been completed and resolved"
            });
        }

        // 3. Gatekeeper Check B: Enforce the strict 30-day expiration window
        const ticketStart = new Date(ticket.ticketStartTime || ticket.createdAt);
        const expiryTime = ticketStart.getTime() + (30 * 24 * 60 * 60 * 1000); // 30 days in milliseconds

        if (Date.now() > expiryTime) {
            return res.status(400).json({
                success: false,
                message: "This support session link has expired (30-day limit exceeded)"
            });
        }

        // 4. Return success and the client details (used to automatically pre-fill the name field in React)
        return res.status(200).json({
            success: true,
            message: "Support session link is active and valid",
            data: {
                clientName: ticket.clientName,
                clientEmail: ticket.clientEmail,
                overallStatus: ticket.overallStatus
            }
        });

    } catch (error) {
        console.error("Error in validateTicket:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while verifying room status"
        });
    }
};