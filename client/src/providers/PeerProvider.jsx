// File path: client/src/providers/PeerProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSocket } from "./SocketProvider"; // Child of SocketProvider can consume the hook

const PeerContext = createContext(null);

/**
 * Custom hook to safely access WebRTC peer methods and connection states
 * @returns {object} Peer Context Value
 */
export const usePeer = () => {
    const context = useContext(PeerContext);
    if (!context) {
        throw new Error("usePeer must be consumed within a PeerProvider wrapper");
    }
    return context;
};

/**
 * Clean utility to generate a fresh RTCPeerConnection instance with default STUN configurations
 * @returns {RTCPeerConnection}
 */
const createPeerConnectionInstance = () => {
    return new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                ],
            },
        ],
    });
};

export const PeerProvider = ({ children }) => {
    const { socket } = useSocket();

    // 1. Core connection and stream states
    const [peer, setPeer] = useState(() => createPeerConnectionInstance());
    const [remoteStream, setRemoteStream] = useState(null);
    const [dataChannel, setDataChannel] = useState(null);

    // 2. Network connectivity progress states for UI tracking
    const [connectionStatus, setConnectionStatus] = useState("new");
    const [iceStatus, setIceStatus] = useState("new");

    // 3. React Ref to store remote email securely to prevent listener stale closures
    const remoteEmailRef = useRef(null);

    // Method exposed to Room UI to bind the target email dynamically
    const setRemotePeerEmail = useCallback((email) => {
        remoteEmailRef.current = email;
        console.log(`WebRTC signaling targeted to: ${email}`);
    }, []);

    // Action: Generate WebRTC Offer (Initiator/Agent)
    const createOffer = useCallback(async () => {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        return offer;
    }, [peer]);

    // Action: Generate WebRTC Answer (Receiver/Client)
    const createAnswer = useCallback(async (offer) => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const ans = await peer.createAnswer();
        await peer.setLocalDescription(ans);
        return ans;
    }, [peer]);

    // Action: Save incoming WebRTC Answer (Initiator/Agent)
    const setRemoteAnswer = useCallback(async (ans) => {
        await peer.setRemoteDescription(new RTCSessionDescription(ans));
    }, [peer]);

    // Action: Attach local tracks cleanly
    const sendStream = useCallback(async (stream) => {
        if (!stream) return;
        const tracks = stream.getTracks();
        for (const track of tracks) {
            const alreadyAdded = peer.getSenders().some(s => s.track === track);
            if (!alreadyAdded) {
                peer.addTrack(track, stream);
            }
        }
    }, [peer]);

    // Action: Initialize DataChannel (Agent side)
    const initDataChannel = useCallback((label = "supportChannel") => {
        const channel = peer.createDataChannel(label);
        setDataChannel(channel);
        return channel;
    }, [peer]);

    // Action: Hot-swap audio or video tracks over live connections
    const replaceTrack = useCallback(async (kind, newTrack) => {
        try {
            const sender = peer.getSenders().find(s => s.track && s.track.kind === kind);
            if (sender) {
                const oldTrack = sender.track;
                await sender.replaceTrack(newTrack);
                if (oldTrack) oldTrack.stop(); // Stops hardware (e.g. camera green light)
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Failed to execute replaceTrack for ${kind}:`, error);
            return false;
        }
    }, [peer]);

    // Action: Teardown connection and recycle states
    const resetPeerConnection = useCallback(() => {
        if (peer) {
            peer.close();
        }
        setRemoteStream(null);
        setDataChannel(null);
        remoteEmailRef.current = null;
        setConnectionStatus("new");
        setIceStatus("new");
        
        setPeer(createPeerConnectionInstance());
        console.log("WebRTC interface cleanly reset.");
    }, [peer]);

    // 4. Centralized Network, Handshake, & Socket Event Listeners
    useEffect(() => {
        // Defensive Candidate Staging Queue
        const candidatesQueue = [];

        // Handler: Forward generated local candidates to socket automatically [1]
        const handleLocalIceCandidate = (event) => {
            if (event.candidate && remoteEmailRef.current) {
                socket.emit("ice-candidate", {
                    email: remoteEmailRef.current,
                    candidate: event.candidate
                });
            }
        };

        // Handler: Dequeue candidate pool once signaling state settles to "stable"
        const handleSignalingStateChange = async () => {
            if (peer.signalingState === "stable" && peer.remoteDescription) {
                while (candidatesQueue.length > 0) {
                    const queuedCand = candidatesQueue.shift();
                    try {
                        await peer.addIceCandidate(new RTCIceCandidate(queuedCand));
                        console.log("Queued incoming candidate applied successfully.");
                    } catch (err) {
                        console.error("Error applying queued remote candidate:", err);
                    }
                }
            }
        };

        // Handler: Listen for incoming remote candidates over the Socket.io connection
        const handleIncomingIceCandidate = async ({ candidate }) => {
            try {
                if (peer.remoteDescription) {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } else {
                    candidatesQueue.push(candidate); // Cache until SDPs settle
                }
            } catch (err) {
                console.error("Error applying immediate incoming candidate:", err);
            }
        };

        // Handler: Capture incoming remote tracks
        const handleTrackEvent = (event) => {
            const streams = event.streams;
            if (streams && streams[0]) {
                setRemoteStream(streams[0]);
            }
        };

        // Handler: Capture incoming DataChannel connections
        const handleDataChannelEvent = (event) => {
            setDataChannel(event.channel);
        };

        // Handler: Capture general connection lifecycle state changes
        const handleConnectionStateChange = () => {
            setConnectionStatus(peer.connectionState);
            console.log(`WebRTC Connection State: ${peer.connectionState}`);
        };

        // Handler: Capture raw ICE candidate matching state changes
        const handleIceConnectionStateChange = () => {
            setIceStatus(peer.iceConnectionState);
            console.log(`WebRTC ICE Status: ${peer.iceConnectionState}`);
        };

        // Bind WebRTC connection listeners
        peer.addEventListener("icecandidate", handleLocalIceCandidate);
        peer.addEventListener("signalingstatechange", handleSignalingStateChange);
        peer.addEventListener("track", handleTrackEvent);
        peer.addEventListener("datachannel", handleDataChannelEvent);
        peer.addEventListener("connectionstatechange", handleConnectionStateChange);
        peer.addEventListener("iceconnectionstatechange", handleIceConnectionStateChange);

        // Bind Socket connection listeners
        socket.on("incoming-ice-candidate", handleIncomingIceCandidate);

        // Teardown: Cleanly detach events when the connection is reset or unmounted
        return () => {
            peer.removeEventListener("icecandidate", handleLocalIceCandidate);
            peer.removeEventListener("signalingstatechange", handleSignalingStateChange);
            peer.removeEventListener("track", handleTrackEvent);
            peer.removeEventListener("datachannel", handleDataChannelEvent);
            peer.removeEventListener("connectionstatechange", handleConnectionStateChange);
            peer.removeEventListener("iceconnectionstatechange", handleIceConnectionStateChange);
            
            socket.off("incoming-ice-candidate", handleIncomingIceCandidate);
        };
    }, [peer, socket]);

    // Hard-close connection when provider completely unmounts (e.g. Agent exits panel)
    useEffect(() => {
        return () => {
            if (peer) peer.close();
        };
    }, [peer]);

    // 5. Context Output
    const contextValue = useMemo(() => ({
        peer,
        remoteStream,
        dataChannel,
        connectionStatus, // Expose status states to render loading badges in the UI
        iceStatus,
        setRemotePeerEmail, // Exposed so Room can map the target email
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        replaceTrack,
        initDataChannel,
        resetPeerConnection
    }), [
        peer,
        remoteStream,
        dataChannel,
        connectionStatus,
        iceStatus,
        setRemotePeerEmail,
        createOffer,
        createAnswer,
        setRemoteAnswer,
        sendStream,
        replaceTrack,
        initDataChannel,
        resetPeerConnection
    ]);

    return (
        <PeerContext.Provider value={contextValue}>
            {children}
        </PeerContext.Provider>
    );
};