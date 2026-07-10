// File path: client/src/pages/Room.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
    Loader2, ShieldAlert, PlaySquare, StopCircle, Save
} from "lucide-react";

// Import State Providers
import { useSocket } from "../providers/SocketProvider";
import { usePeer } from "../providers/PeerProvider";
import { useAuth } from "../providers/AuthProvider";

// Import Operations and Helpers
import { getDeviceDiagnostics } from "../services/operations/deviceHelper";
import * as ticketService from "../services/operations/ticketAPI";

// Import Modular UI Sub-components
import ClientVerificationForm from "../components/core/Room/ClientVerificationForm";
import AgentPreJoin from "../components/core/Room/AgentPreJoin";
import Lobby from "../components/core/Room/Lobby";
import RoomHeader from "../components/core/Room/RoomHeader";
import VideoGrid from "../components/core/Room/VideoGrid";
import ControlBar from "../components/core/Room/ControlBar";
import ClientTelemetry from "../components/core/Room/ClientTelemetry";
import ChatPanel from "../components/core/Room/ChatPanel";

export default function Room() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Core Context Hooks
    const { socket } = useSocket();
    const { agent } = useAuth();
    const {
        peer, remoteStream, dataChannel, connectionStatus, iceStatus,
        setRemotePeerEmail, createOffer, createAnswer, setRemoteAnswer,
        sendStream, replaceTrack, initDataChannel, resetPeerConnection
    } = usePeer();

    // 1. Core Handshaking Pages/Lobbies States
    const [isValidating, setIsValidating] = useState(true);
    const [validationError, setValidationError] = useState(null);
    const [isWaitingForAgent, setIsWaitingForAgent] = useState(false);
    const [ticketDetails, setTicketDetails] = useState(null);
    const [isJoined, setIsJoined] = useState(false);

    // Active Connection Database Identifier
    const [activeConnectionId, setActiveConnectionId] = useState(null);

    // Local Media Track States (Webcam/Audio records)
    const [localStream, setLocalStream] = useState(null);
    const [isCamMuted, setIsCamMuted] = useState(false);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const [isSharingScreen, setIsSharingScreen] = useState(false);

    // Telemetry Specs State
    const [clientSpecs, setClientSpecs] = useState(null);

    // Chat and File Sharing States [1]
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [filesTransferred, setFilesTransferred] = useState([]); // Tracks metadata of P2P file transfers [1]

    // NEW STATE: Tracks remote peer's email locally to trigger Handshake Sync [1]
    const [remoteEmail, setRemoteEmail] = useState(null);

    // Refs for tracking real-time connection metrics securely during unmount cleanups [1]
    const messagesCountRef = useRef(0);
    const filesTransferredRef = useRef([]);

    // Keep refs synchronized with active states
    useEffect(() => {
        messagesCountRef.current = messages.length;
    }, [messages]);

    useEffect(() => {
        filesTransferredRef.current = filesTransferred;
    }, [filesTransferred]);

    // Session Duration Timer
    const [callDuration, setCallDuration] = useState(0);

    const [isRecording, setIsRecording] = useState(false); // Agent side: recording active
    const [isRemoteRecording, setIsRemoteRecording] = useState(false); // Client side: remote peer recording active
    const [recordingDialog, setRecordingDialog] = useState(false); // Controls Agent save dialog
    const [recordingTimestamps, setRecordingTimestamps] = useState({ startedAt: null, endedAt: null });

    // Refs for tracking MediaRecorder and raw binary RAM chunk buffer
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);

    // SECURITY REF: Guarantees Client specs are transmitted strictly once per connection segment [1]
    const hasSentTelemetryRef = useRef(false);

    const localStreamRef = useRef(null);

    const activeConnectionIdRef = useRef(null);
    useEffect(() => {
        activeConnectionIdRef.current = activeConnectionId;
    }, [activeConnectionId]);

    // HTML Video elements refs
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    // Pre-Flight Verification & Auto-Connection Lifecycle
    useEffect(() => {
        const runPreFlightCheck = async () => {
            try {
                if (agent && !location.state?.fromDashboard) {
                    toast.error("Please join support sessions directly from your Agent Dashboard.");
                    navigate("/dashboard");
                    return;
                }

                const result = await ticketService.validateSupportRoom(roomId);
                if (result?.success) {
                    setTicketDetails(result.data);
                }
            } catch (err) {
                setValidationError(err.message || "Unauthorized support workspace link.");
            } finally {
                setIsValidating(false);
            }
        };

        runPreFlightCheck();

        return () => {
            // Emits the final connection metadata cleanly using refs to prevent pre-flight re-runs! [✓]
            if (socket.connected && activeConnectionIdRef.current) {
                socket.emit("leave-room", {
                    roomId,
                    email: agent ? agent.email : localStorage.getItem("user-email"),
                    totalMessagesExchanged: messagesCountRef.current,
                    filesTransferred: filesTransferredRef.current
                });
            }
            socket.disconnect(); // Only disconnect socket on unmount [2]
        };
    }, [roomId, agent, location, socket, navigate]); // Removed activeConnectionId completely! [✓]

    // Duration Timer increments every second on connected state
    useEffect(() => {
        let interval = null;
        if (connectionStatus === "connected") {
            interval = setInterval(() => {
                setCallDuration((prev) => prev + 1);
            }, 1000);
        } else {
            setCallDuration(0);
        }
        return () => clearInterval(interval);
    }, [connectionStatus]);

    // Capture Webcam and Microphone Drivers
    const initLocalMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            setLocalStream(stream);
            localStreamRef.current = stream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }

            await sendStream(stream);
            return stream;
        } catch (err) {
            toast.error("Unable to access local camera/microphone drivers.");
            console.error(err);
            return null;
        }
    }, [sendStream]);

    // Bind local stream
    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // Emit "user-ready" once the socket is connected and local media is ready
    useEffect(() => {
        if (socket && localStream) {
            socket.emit("user-ready");
            console.log("Emitted user-ready signal to server.");
        }
    }, [socket, localStream]);

    // AUTO-ATTACH HOOK: Auto-binds tracks whenever the peer connection resets [1]
    useEffect(() => {
        if (peer && localStream) {
            sendStream(localStream);
            console.log("Automatically re-attached active local tracks to the peer connection.");
        }
    }, [peer, localStream, sendStream]);

    // ----------------------------------------------------------------
    // HARDWARE CLEANUP UNMOUNT HOOK: Auto-stops and releases webcam, mic, and screen sharing [1, 1.1.1, 1.1.5, 2]
    // ----------------------------------------------------------------
    useEffect(() => {
        return () => {
            // 1. Stop all tracks inside the current active stream reference [1.1.1]
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Released hardware track: ${track.label}`);
                });
            }
            // 2. Stop any active screen sharing tracks currently bound to the video element [1.1.5]
            if (localVideoRef.current && localVideoRef.current.srcObject) {
                localVideoRef.current.srcObject.getTracks().forEach(track => {
                    track.stop();
                    console.log(`Released screen share track: ${track.label}`);
                });
            }
        };
    }, []); // <-- EMPTY DEPENDENCY ARRAY: Runs strictly once on unmount! [1]

    // Bind remote stream
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // Agent-Side Call Initiator Hook: Triggers the offer exchange strictly AFTER local stream is loaded AND client is present [1.1.1]
    useEffect(() => {
        if (agent && localStream && remoteEmail) {
            const initiateCall = async () => {
                try {
                    console.log(`Both peers fully loaded. Generating Offer to: ${remoteEmail}`);
                    const offer = await createOffer();
                    socket.emit("call-user", { email: remoteEmail, offer });
                } catch (err) {
                    console.error("Failed to generate WebRTC offer:", err);
                }
            };
            initiateCall();
        }
    }, [agent, localStream, remoteEmail, createOffer, socket]);

    // ----------------------------------------------------------------
    // Real-Time Socket Handshaking Receivers
    // ----------------------------------------------------------------
    const handleUserJoined = useCallback(async ({ email }) => {
        console.log(`P2P Handshake initiated by client: ${email}`);
        setRemotePeerEmail(email);
        setRemoteEmail(email); // Save client email locally to trigger the initiator hook [1.1.1]

        // Create reliable P2P DataChannel on Agent side [1]
        const channel = initDataChannel("supportChannel");
        setupDataChannel(channel);
    }, [setRemotePeerEmail, initDataChannel]);

    const handleIncomingCall = useCallback(async ({ from, offer }) => {
        console.log(`Receiving live Offer handshake from: ${from}`);
        setRemotePeerEmail(from);
        setRemoteEmail(from); // Save agent email locally to keep state aligned [1.1.1]

        const ans = await createAnswer(offer);
        socket.emit("call-received", { email: from, ans });
    }, [socket, createAnswer, setRemotePeerEmail]);

    const handleCallAccepted = useCallback(async ({ ans }) => {
        await setRemoteAnswer(ans);
    }, [setRemoteAnswer]);

    // Upgraded: Cleanly unmount, wipe connection logs, and reset both Agent and Client back to custom pre-join portals on disconnect [1.1, 1.1.1, 2.2]
    const handleUserLeft = useCallback(() => {
        toast.error("Disconnection event registered.");
        resetPeerConnection();
        setMessages([]);

        // 1. Reset recording, dialog, and telemetry states on disconnect [✓]
        setIsRecording(false);
        setIsRemoteRecording(false);
        setRecordingDialog(false);
        recordedChunksRef.current = [];
        hasSentTelemetryRef.current = false;
        setRemoteEmail(null); // Clear remote email reference

        // 2. Reset local hardware tracks and UI states back to unmuted baseline [2.2]
        if (localStream) {
            localStream.getTracks().forEach(track => {
                track.stop();
            });
            localStreamRef.current = null;
            setLocalStream(null); // Release state reference [2.2]
        }
        setIsMicMuted(false); // Reset mute state [2.2]
        setIsCamMuted(false); // Reset camera state [2.2]

        // 3. Fallback: unmount active workspace [1.1.1]
        setIsJoined(false);

        // Client fall back cleanly to Waiting Lobby [1.1.1]
        if (!agent) {
            setIsWaitingForAgent(true);
        }
    }, [resetPeerConnection, localStream, agent]);

    // Bind Signaling Socket event listeners
    useEffect(() => {
        socket.on("user-joined", handleUserJoined);
        socket.on("incoming-call", handleIncomingCall);
        socket.on("call-accepted", handleCallAccepted);
        socket.on("user-left", handleUserLeft);

        socket.on("room-joined", async ({ role, clientToken }) => {
            if (role === "client") {
                if (clientToken) localStorage.setItem(`client-token-${roomId}`, clientToken);
                await initLocalMedia();

                const specs = await getDeviceDiagnostics();
                setClientSpecs(specs);
            }
        });

        socket.on("waiting-for-agent", ({ clientToken }) => {
            if (clientToken) localStorage.setItem(`client-token-${roomId}`, clientToken);
            setIsWaitingForAgent(true);
        });

        socket.on("agent-joined", async () => {
            setIsWaitingForAgent(false);
            setIsJoined(true);
            await initLocalMedia();

            const specs = await getDeviceDiagnostics();
            setClientSpecs(specs);
        });

        socket.on("join-error", ({ message }) => {
            toast.error(message || "Unauthorized room credentials.");
            setValidationError(message || "Unauthorized room credentials.");
            setIsValidating(false);
        });

        return () => {
            socket.off("user-joined", handleUserJoined);
            socket.off("incoming-call", handleIncomingCall);
            socket.off("call-accepted", handleCallAccepted);
            socket.off("user-left", handleUserLeft);
            socket.off("room-joined");
            socket.off("waiting-for-agent");
            socket.off("agent-joined");
            socket.off("join-error");
        };
    }, [socket, handleUserJoined, handleIncomingCall, handleCallAccepted, handleUserLeft, initLocalMedia, roomId]);

    // ----------------------------------------------------------------
    // SCTP DataChannel Event Handlers [1]
    // ----------------------------------------------------------------
    const setupDataChannel = useCallback((channel) => {
        if (!channel) return;

        channel.onopen = () => {
            console.log("P2P DataChannel active.");
            if (agent) {
                channel.send(JSON.stringify({ type: "request-telemetry" }));
            }
        };

        channel.onmessage = async (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === "chat") {
                    setMessages((prev) => [...prev, { sender: "remote", text: payload.text }]);
                } else if (payload.type === "request-telemetry") {
                    if (clientSpecs && !hasSentTelemetryRef.current) {
                        channel.send(JSON.stringify({ type: "telemetry", specs: clientSpecs }));
                        hasSentTelemetryRef.current = true;
                    }
                } else if (payload.type === "telemetry") {
                    setClientSpecs(payload.specs);
                    toast.success("Client system specs successfully loaded.");

                    try {
                        const dbRecord = await ticketService.startConnectionSession(roomId, payload.specs);
                        if (dbRecord?.success && dbRecord?.connectionId) {
                            setActiveConnectionId(dbRecord.connectionId);
                            console.log(`Connection logged in database. Active ID: ${dbRecord.connectionId}`);
                        }
                    } catch (err) {
                        console.error("Failed to register connection log in database.");
                    }
                } else if (payload.type === "recording-state") {
                    setIsRemoteRecording(payload.active);
                    if (payload.active) {
                        toast("Technician has started recording this session.", { icon: "🎥" });
                    } else {
                        toast("Technician stopped the recording.");
                    }
                }
            } catch (err) {
                console.warn("Unreadable DataChannel packet.");
            }
        };
    }, [agent, clientSpecs, roomId]);

    useEffect(() => {
        if (dataChannel) {
            setupDataChannel(dataChannel);
        }
    }, [dataChannel, setupDataChannel]);

    useEffect(() => {
        if (!agent && dataChannel && dataChannel.readyState === "open" && clientSpecs && !hasSentTelemetryRef.current) {
            try {
                dataChannel.send(JSON.stringify({ type: "telemetry", specs: clientSpecs }));
                hasSentTelemetryRef.current = true;
                console.log("Client specs automatically pushed over active DataChannel.");
            } catch (err) {
                console.warn("Failed to push specs over active channel.");
            }
        }
    }, [agent, dataChannel, clientSpecs]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !dataChannel || dataChannel.readyState !== "open") return;

        dataChannel.send(JSON.stringify({ type: "chat", text: chatInput }));
        setMessages((prev) => [...prev, { sender: "self", text: chatInput }]);
        setChatInput("");
    };

    // ----------------------------------------------------------------
    // NEW WEB-RECORDING FUNCTIONS
    // ----------------------------------------------------------------
    const handleStartRecording = () => {
        if (!remoteStream) {
            toast.error("No active remote screen feed to record.");
            return;
        }

        recordedChunksRef.current = [];

        try {
            const options = { mimeType: "video/webm;codecs=vp9" };
            const recorder = new MediaRecorder(remoteStream, options);

            recorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };

            recorder.start(1000);
            mediaRecorderRef.current = recorder;

            setIsRecording(true);
            setRecordingTimestamps({ startedAt: new Date(), endedAt: null });

            if (dataChannel && dataChannel.readyState === "open") {
                dataChannel.send(JSON.stringify({ type: "recording-state", active: true }));
            }

            toast.success("Session recording started.");
        } catch (err) {
            console.error("Failed to start MediaRecorder:", err);
            toast.error("Video recording is not supported in this browser.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingTimestamps((prev) => ({ ...prev, endedAt: new Date() }));

            if (dataChannel && dataChannel.readyState === "open") {
                dataChannel.send(JSON.stringify({ type: "recording-state", active: false }));
            }

            setRecordingDialog(true);
        }
    };

    const handleSaveRecording = async () => {
        if (recordedChunksRef.current.length === 0) {
            toast.error("No recorded video data found.");
            return;
        }

        const toastId = toast.loading("Saving and uploading secure recording...");
        setRecordingDialog(false);

        try {
            const signatureData = await ticketService.getUploadSignature();
            const { signature, timestamp, apiKey, cloudName, folder } = signatureData;

            const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
            const videoFile = new File([blob], `support-${roomId}.webm`, { type: "video/webm" });

            const uploadResult = await ticketService.uploadVideoToCloudinaryDirect(
                videoFile,
                signature,
                timestamp,
                apiKey,
                folder,
                cloudName
            );

            const duration = Math.round((recordingTimestamps.endedAt - recordingTimestamps.startedAt) / 1000);

            await ticketService.saveConnectionRecordingMetadata({
                roomId,
                connectionId: activeConnectionId,
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                startedAt: recordingTimestamps.startedAt,
                endedAt: recordingTimestamps.endedAt,
                duration
            });

            toast.success("Recording successfully saved to ticket history!");
            recordedChunksRef.current = [];
        } catch (error) {
            console.error("Failed to upload recording:", error);
            toast.error("Recording upload failed. You can try saving again.");
            setRecordingDialog(true);
        } finally {
            toast.dismiss(toastId);
        }
    };

    const handleDiscardRecording = () => {
        const confirmDiscard = window.confirm("Are you sure you want to discard this recording? It will be deleted from memory permanently.");
        if (confirmDiscard) {
            recordedChunksRef.current = [];
            setRecordingDialog(false);
            toast.success("Recording discarded.");
        }
    };

    // ----------------------------------------------------------------
    // Media Toggle Triggers (Perfect Hardware Mappings)
    // ----------------------------------------------------------------
    const toggleCamera = () => {
        // Inspect whatever stream is actively attached to your video ref [✓]
        const activeStream = localVideoRef.current?.srcObject;
        if (activeStream) {
            const videoTrack = activeStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsCamMuted(!videoTrack.enabled);
            }
        }
    };

    const toggleMic = () => {
        // Mute Local Stream Directly [✓]
        if (localStream) {
            const audioTrack = localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicMuted(!audioTrack.enabled);
                console.log(`Microphone physically toggled to: ${audioTrack.enabled ? "Active" : "Muted"}`);
            }
        }
    };

    const toggleScreenShare = async () => {
        try {
            if (!isSharingScreen) {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
                const screenTrack = screenStream.getVideoTracks()[0];
                const success = await replaceTrack("video", screenTrack);

                if (success) {
                    setIsSharingScreen(true);
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = screenStream;
                    }
                    screenTrack.onended = async () => {
                        await revertToWebcam();
                    };
                }
            } else {
                await revertToWebcam();
            }
        } catch (err) {
            console.error("Screen share blocked.");
        }
    };

    const revertToWebcam = async () => {
        // 1. Terminate the active screen capture tracks cleanly [1.1.5]
        if (localVideoRef.current?.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }

        try {
            // 2. ONLY request the video track to prevent creating duplicate mic instances [1.1.1, 1.1.5]
            const webcamStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const webcamTrack = webcamStream.getVideoTracks()[0];

            // 3. Hot-swap the video track in WebRTC [1, 1.1.1]
            await replaceTrack("video", webcamTrack);
            setIsSharingScreen(false);

            // 4. Combine the untouched local audio track with the new webcam video track [1.1.1]
            const combinedStream = new MediaStream();

            // Read the active audio track from our ref [1]
            if (localStreamRef.current) {
                const audioTrack = localStreamRef.current.getAudioTracks()[0];
                if (audioTrack) {
                    combinedStream.addTrack(audioTrack);
                }
            }

            combinedStream.addTrack(webcamTrack);

            // 5. Update local stream reference state perfectly [✓]
            setLocalStream(combinedStream);
            localStreamRef.current = combinedStream;

            if (localVideoRef.current) {
                localVideoRef.current.srcObject = combinedStream;
            }
            setIsCamMuted(false); // Reset mute indicator on camera revert
        } catch (err) {
            console.error("Failed to revert to webcam:", err);
        }
    };

    // Action: Agent initiates first connection handshake
    const handleAgentJoin = async () => {
        socket.connect();
        socket.emit("join-room", { email: agent.email, roomId });
        setIsJoined(true);
        await initLocalMedia();
    };

    // Action: Client validates credentials locally first before connecting WebSocket [2]
    const handleClientVerifySuccess = ({ name, email }) => {
        localStorage.setItem("user-email", email);

        socket.connect();
        socket.emit("join-room", { email, roomId, clientToken: localStorage.getItem(`client-token-${roomId}`) });
        setIsJoined(true);
    };

    const handleLeaveRoom = () => {
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        socket.emit("leave-room", { roomId, email: agent ? agent.email : ticketDetails?.clientEmail });
        resetPeerConnection();

        // 1. Reset recording, dialog, and telemetry states on manual leave [✓]
        setIsRecording(false);
        setIsRemoteRecording(false);
        setRecordingDialog(false);
        recordedChunksRef.current = [];
        hasSentTelemetryRef.current = false;
        setRemoteEmail(null); // Clear remote email reference

        toast.success("Disconnected from room.");
        navigate(agent ? "/dashboard" : "/");
    };

    const handleEndTicket = async () => {
        try {
            const confirmEnd = window.confirm("Are you sure you want to resolve and permanently close this ticket?");
            if (!confirmEnd) return;

            const notes = prompt("Enter final support summary notes:");
            await ticketService.closeSupportTicket(roomId, "resolved", notes || "Closed cleanly.");

            if (localStream) {
                localStream.getTracks().forEach(t => t.stop());
            }

            socket.emit("leave-room", { roomId, email: agent.email });
            resetPeerConnection();

            // 1. Reset recording, dialog, and telemetry states on ticket resolution [✓]
            setIsRecording(false);
            setIsRemoteRecording(false);
            setRecordingDialog(false);
            recordedChunksRef.current = [];
            hasSentTelemetryRef.current = false;
            setRemoteEmail(null); // Clear remote email reference

            toast.success("Ticket successfully resolved and finalized.");
            navigate("/dashboard");
        } catch (err) {
            toast.error("Failed to close ticket.");
        }
    };

    const formatTimer = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, "0");
        const s = (seconds % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
    };

    // ----------------------------------------------------------------
    // RENDER INTERFACES (PRIORITY-ORDERED)
    // ----------------------------------------------------------------

    // Case A: Render Client Waiting Lobby (Highest priority if waiting) [1.1.1]
    if (isWaitingForAgent) {
        return <Lobby onCancel={handleLeaveRoom} />;
    }

    // Case B: Render Agent Pre-Join Overview
    if (!isJoined && agent) {
        return (
            <AgentPreJoin
                clientName={ticketDetails?.clientName}
                clientEmail={ticketDetails?.clientEmail}
                onJoin={handleAgentJoin}
                onCancel={() => navigate("/dashboard")}
            />
        );
    }

    // Case C: Render Client Credentials Verification Form [2]
    if (!isJoined && !agent) {
        return (
            <ClientVerificationForm
                clientEmail={ticketDetails?.clientEmail}
                clientName={ticketDetails?.clientName}
                onVerifySuccess={handleClientVerifySuccess}
                onCancel={() => navigate("/")}
            />
        );
    }

    // Case D: Render Active Calling Workspace Grid
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col relative">

            {/* Privacy Warning Banner: Renders dynamically on Client screen when Agent starts recording */}
            {isRemoteRecording && !agent && (
                <div className="bg-red-500 text-white text-xs font-semibold py-2 px-6 flex items-center justify-center gap-2 select-none animate-slideDown shrink-0">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span>Recording Active — This support session is currently being recorded by your representative.</span>
                </div>
            )}

            {/* Reusable Header */}
            <RoomHeader
                roomId={roomId}
                connectionStatus={connectionStatus}
                callDuration={callDuration}
                formatTimer={formatTimer}
            />

            <div className="flex-1 flex overflow-hidden">
                <main className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto relative">
                    {/* Main Video Stream Window */}
                    <VideoGrid
                        localVideoRef={localVideoRef}
                        remoteVideoRef={remoteVideoRef}
                        remoteStream={remoteStream}
                    />

                    {/* Dynamic Control Bar (Supports live recorder controls for Agent) */}
                    <div className="flex items-center gap-4 shrink-0">
                        {agent && remoteStream && (
                            <div className="flex items-center gap-2 shrink-0">
                                {!isRecording ? (
                                    <button onClick={handleStartRecording} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-3.5 rounded-full transition-all active:scale-95 focus:outline-none shadow-sm shadow-blue-600/10">
                                        <PlaySquare className="w-4 h-4" />
                                        Record Segment
                                    </button>
                                ) : (
                                    <button onClick={handleStopRecording} className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-3.5 rounded-full transition-all active:scale-95 focus:outline-none animate-pulse">
                                        <StopCircle className="w-4 h-4" />
                                        Stop Recording
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="flex-1">
                            <ControlBar
                                isMicMuted={isMicMuted}
                                isCamMuted={isCamMuted}
                                isSharingScreen={isSharingScreen}
                                toggleMic={toggleMic}
                                toggleCamera={toggleCamera}
                                toggleScreenShare={toggleScreenShare}
                                onLeave={handleLeaveRoom}
                                onEndTicket={handleEndTicket}
                                isAgent={!!agent}
                            />
                        </div>
                    </div>
                </main>

                {/* Sidebar Workspace */}
                <aside className="w-80 border-l border-slate-100 bg-white flex-col shrink-0 select-none hidden lg:flex">
                    {agent && <ClientTelemetry clientSpecs={clientSpecs} />}

                    <ChatPanel
                        messages={messages}
                        chatInput={chatInput}
                        setChatInput={setChatInput}
                        onSendMessage={handleSendMessage}
                        dataChannel={dataChannel}
                    />
                </aside>
            </div>

            {/* Agent Save/Discard Dialog Modal (RAM Buffering) */}
            {recordingDialog && agent && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
                    <div className="max-w-md w-full bg-white border border-slate-100 rounded-3xl p-8 text-center shadow-2xl">
                        <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                            <Save className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Save Session Segment?</h3>
                        <p className="text-sm text-slate-500 leading-relaxed mb-6">
                            The recorded segment is currently buffered in local memory. Would you like to upload and link it to this ticket's historical timeline?
                        </p>
                        <div className="flex flex-col gap-2">
                            <button onClick={handleSaveRecording} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-full shadow-md shadow-blue-500/10 active:scale-95 transition-all focus:outline-none">
                                Yes, Save & Upload Recording
                            </button>
                            <button onClick={handleDiscardRecording} className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold py-2.5 rounded-full transition-all focus:outline-none">
                                Discard Segment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}