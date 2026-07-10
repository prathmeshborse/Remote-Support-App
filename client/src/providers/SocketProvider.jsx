// File path: client/src/providers/SocketProvider.jsx
import React, { useState, useContext, useEffect, createContext } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

/**
 * Custom hook to safely consume the central Socket.io instance
 * @returns {{ socket: Socket }}
 */
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error("useSocket must be consumed within a SocketProvider wrapper");
    }
    return context;
};

export const SocketProvider = ({ children }) => {
    // 1. Dynamic endpoint target reading from Vite configurations
    const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3000";

    // lazy initializer, setSocket() omited because never used and io() is executed only once, during the component's initial render.
    const [socket] = useState(() => 
        // 2. Initialize connection with HTTP cookie credentials enabled
        io(SOCKET_SERVER_URL, {
            autoConnect: false,
            withCredentials: true, // Forces browser to pass HttpOnly JWT cookies on socket handshake
            reconnectionAttempts: 5, // Auto-retry connection during temporary network drops
            reconnectionDelay: 1000
        })
    );

    // 3. Centralized lifecycle listener managing clean disconnections
    useEffect(() => {
        
        return () => {
            if (socket) {
                socket.disconnect();
                console.log("WebSocket connection cleanly terminated on provider teardown.");
            }
        };
    }, [socket]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};