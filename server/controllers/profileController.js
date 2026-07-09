// File path: server/controllers/profileController.js
const Agent = require("../models/Agent");
const Profile = require("../models/Profile");
const Ticket = require("../models/Ticket");
const cloudinary = require("cloudinary").v2;

// @desc    Get complete details of the logged-in Agent
// @route   GET /api/profile/details
// @access  Private (requires auth middleware)
exports.getAgentDetails = async (req, res) => {
    try {
        const agentId = req.user.id;

        // Fetch Agent details and join with their secondary Profile specs
        const agent = await Agent.findById(agentId).populate("additionalDetails").select("-password").exec();

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found"
            });
        }

        // Return populated Agent and Profile data
        return res.status(200).json({
            success: true,
            message: "Agent details fetched successfully",
            agent: agent
        });

    } catch (error) {
        console.error("Error in getAgentDetails:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// @desc    Update Agent profile fields (Agent & Profile models)
// @route   PUT /api/profile/update
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const agentId = req.user.id;
        const { firstName, lastName, phoneNumber, bio, organization } = req.body;

        // 1. Locate the Agent to access their linked Profile reference
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found"
            });
        }

        // Update main Agent account fields if provided
        let namesChanged = false;
        if (firstName) {
            agent.firstName = firstName;
            namesChanged = true;
        }
        if (lastName) {
            agent.lastName = lastName;
            namesChanged = true;
        }

        // 2. Fetch the linked secondary Profile document
        const profile = await Profile.findById(agent.additionalDetails);
        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Linked profile document not found"
            });
        }

        // Dynamic Initials Avatar Update:
        // If the name changed AND the user is still using an auto-generated initials avatar,
        // dynamically regenerate a new initials avatar URL matching their new name.
        if (namesChanged && profile.avatarUrl && profile.avatarUrl.includes("api.dicebear.com")) {
            const seedName = `${agent.firstName} ${agent.lastName}`;
            profile.avatarUrl = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seedName)}`;
        }

        // Update secondary Profile fields if provided (allows empty strings, checks for undefined)
        if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber;
        if (bio !== undefined) profile.bio = bio;
        if (organization !== undefined) profile.organization = organization;

        // 3. Commit both document saves to MongoDB
        await agent.save();
        await profile.save();

        // Retrieve the populated object to return to the frontend
        const updatedAgent = await Agent.findById(agentId).populate("additionalDetails").select("-password").exec();

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully",
            agent: updatedAgent
        });

    } catch (error) {
        console.error("Error in updateProfile:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


// @desc    Cascadingly delete Agent account, profile, tickets, and session logs
// @route   DELETE /api/profile/delete
// @access  Private
exports.deleteAccount = async (req, res) => {
    try {
        const agentId = req.user.id;

        // 1. Find the Agent to find the Profile ID reference (additionalDetails)
        const agent = await Agent.findById(agentId);
        if (!agent) {
            return res.status(404).json({
                success: false,
                message: "Agent not found"
            });
        }

        // 2. Cascade Step A: Retrieve associated Tickets to collect Cloudinary file references
        // (Wiping the DB records without removing Cloudinary files results in orphan cloud storage space)
        const tickets = await Ticket.find({ agent: agentId });

        const recordingPublicIds = [];
        tickets.forEach(ticket => {
            // Collect nested, connection - specific recording public IDs
            if (ticket.connections && ticket.connections.length > 0) {
                ticket.connections.forEach(conn => {
                    if (conn.recording && conn.recording.publicId) {
                        recordingPublicIds.push(conn.recording.publicId);
                    }
                });
            }
        });

        // Once Cloudinary helpers are fully integrated, you can wipe video files here:
        if (recordingPublicIds.length > 0) {
            for (const publicId of recordingPublicIds) {
                await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
            }
        }

        // 3. Cascade Step B: Delete all associated Tickets from MongoDB
        await Ticket.deleteMany({ agent: agentId });

        // 4. Cascade Step C: Delete the linked Profile document
        await Profile.findByIdAndDelete(agent.additionalDetails);

        // 5. Cascade Step D: Delete the main Agent document
        await Agent.findByIdAndDelete(agentId);

        // 6. Clear browser authorization cookie
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict"
        });

        return res.status(200).json({
            success: true,
            message: "Agent account and all associated profile, ticket, and session logs permanently wiped."
        });

    } catch (error) {
        console.error("Error in deleteAccount cascading process:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error occurred while deleting account",
            error: error.message
        });
    }
};