// File path: server/routes/ticketRoutes.js
const express = require("express");
const router = express.Router();

const {
    createTicket,
    getAgentTickets,
    saveConnectionRecording,
    closeTicket,
    startConnection,
    validateTicket
} = require("../controllers/ticketController");

const { auth } = require("../middleware/authMiddleware");

// Private/Protected Routes (Agents Only)
router.post("/create", auth, createTicket);
router.put("/close", auth, closeTicket);
router.get("/history", auth, getAgentTickets);
router.post("/upload-recording", auth, saveConnectionRecording);
router.post("/connection-start", auth, startConnection);

// Public Validation Route
router.get("/validate/:roomId", validateTicket);

module.exports = router;