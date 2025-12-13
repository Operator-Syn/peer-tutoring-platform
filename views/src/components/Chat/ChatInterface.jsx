import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import LeftPanel from "./LeftPanel/LeftPanel";
import CurrentChat from "./LeftPanel/CurrentChat/CurrentChat";
import MobileChatLayout from "./MobileChatLayout";

export default function ChatInterface({ googleId: propGoogleId }) {
    const [googleId, setGoogleId] = useState(propGoogleId);
    const [dbUser, setDbUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000";

    // =========================================================
    // 🟢 1. REFS
    // =========================================================
    const selectedUserRef = useRef(null);
    const usersRef = useRef([]);      
    const dbUserRef = useRef(null);   

    // Keep Refs synced with State
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
    useEffect(() => { usersRef.current = users; }, [users]);
    useEffect(() => { dbUserRef.current = dbUser; }, [dbUser]);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 576);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Helper: Reorder Sidebar ---
    const handleIncomingMessage = (msg, isOwnMessage = false) => {
        setUsers((prevUsers) => {
            // FIX: Convert IDs to String for safe comparison
            const index = prevUsers.findIndex(u => String(u.appointment_id) === String(msg.appointment_id));
            if (index === -1) return prevUsers;

            const newUsers = [...prevUsers];
            const [movedUser] = newUsers.splice(index, 1);

            // FIX: Convert IDs to String here too
            const isChatOpen = String(selectedUserRef.current?.appointment_id) === String(msg.appointment_id);
            
            // Only badge if not looking at it AND not my own message
            if (!isChatOpen && !isOwnMessage) {
                movedUser.unread_count = (movedUser.unread_count || 0) + 1;
            }

            newUsers.unshift(movedUser);
            return newUsers;
        });
    };

    // 2. Fetch Google ID
    useEffect(() => {
        if (googleId) return;
        fetch("/api/auth/get_user")
            .then(res => res.json())
            .then(data => { if (data.sub) setGoogleId(data.sub); })
            .catch(console.error);
    }, [googleId]);

    // 3. Get DB User
    useEffect(() => {
        if (!googleId) return;
        fetch(`/api/tutee/by_google/${googleId}`)
            .then(res => res.json())
            .then(data => { if (data?.id_number) setDbUser(data); })
            .catch(console.error);
    }, [googleId]);

    // 4. Fetch Partners
    useEffect(() => {
        if (!dbUser) return;
        setLoading(true);
        fetch(`/api/chat/partners?user_id=${dbUser.id_number}`)
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [dbUser]);

    // 5. Socket Connection
    useEffect(() => {
        if (!dbUser) return;

        const s = io(socketUrl, {
            transports: ["websocket"],
            secure: socketUrl.includes("https"),
            query: { user_id: dbUser.id_number }
        });
        setSocket(s);

        return () => s.disconnect();
    }, [dbUser, socketUrl]);

    // =========================================================
    // 🟢 6. Socket LISTENERS (THE CORRECT FIX)
    // =========================================================
    useEffect(() => {
        if (!socket) return;

        // A. Handle Receiving Messages
        const onReceiveMessage = (msg) => {
            const currentApptId = selectedUserRef.current?.appointment_id;
            
            // FIX: Strict Type Safety (String vs String)
            if (currentApptId && String(currentApptId) === String(msg.appointment_id)) {
                
                setMessages((prev) => {
                    // 1. DEDUPLICATION LOGIC
                    // Only check for ID match if BOTH messages actually have an ID.
                    // This prevents "undefined === undefined" from blocking valid messages.
                    const isDuplicate = prev.some(m => {
                        if (m.id && msg.id) return m.id === msg.id;
                        if (m.tempId && msg.tempId) return m.tempId === msg.tempId;
                        return false; 
                    });

                    if (isDuplicate) return prev;

                    // 2. HANDLE "ECHO" (Sender updates)
                    const myId = dbUserRef.current?.id_number;
                    if (String(msg.sender_id) === String(myId)) {
                        const pendingIndex = prev.findIndex(m => m.tempId && m.message_text === msg.message_text);
                        if (pendingIndex !== -1) {
                            const newMsgs = [...prev];
                            newMsgs[pendingIndex] = msg; // Swap optimistic for confirmed
                            return newMsgs;
                        }
                    }

                    // 3. Add New Message (Receiver)
                    return [...prev, msg];
                });
            }
            
            handleIncomingMessage(msg, false);
        };

        const onLoadMessages = (msgs) => {
            setMessages(msgs);
        };

        // B. Handle Reconnection
        const onConnect = () => {
            console.log("🔌 Socket connected. Re-joining rooms...");
            
            const currentUsers = usersRef.current;
            if (currentUsers && currentUsers.length > 0) {
                const appointmentIds = currentUsers.map(u => u.appointment_id);
                socket.emit("monitor_appointments", { appointment_ids: appointmentIds });
            }

            const activeChat = selectedUserRef.current;
            const user = dbUserRef.current;
            if (activeChat && user) {
                socket.emit("join_appointment", {
                    appointment_id: activeChat.appointment_id,
                    user_id: user.id_number
                });
            }
        };

        socket.on("receive_message", onReceiveMessage);
        socket.on("load_messages", onLoadMessages);
        socket.on("connect", onConnect);

        return () => {
            socket.off("receive_message", onReceiveMessage);
            socket.off("load_messages", onLoadMessages);
            socket.off("connect", onConnect);
        };
    }, [socket]); 

    // 7. Initial Monitoring
    useEffect(() => {
        if (!socket || users.length === 0) return;
        const appointmentIds = users.map(u => u.appointment_id);
        socket.emit("monitor_appointments", { appointment_ids: appointmentIds });
    }, [socket, users.length]); 

    // --- User Actions ---
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        
        // Reset unread locally
        setUsers(prev => prev.map(u => 
            String(u.appointment_id) === String(user.appointment_id) ? { ...u, unread_count: 0 } : u
        ));

        if (socket && dbUser) {
            socket.emit("join_appointment", {
                appointment_id: user.appointment_id,
                user_id: dbUser.id_number
            });
            setMessages([]); 
        }
    };

    const sendMessage = (text) => {
        if (!socket || !selectedUser || !dbUser) return;
        
        const payload = {
            appointment_id: selectedUser.appointment_id,
            sender_id: dbUser.id_number,
            message_text: text,
            tempId: Date.now(),
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, payload]);
        socket.emit("send_message", payload);
        handleIncomingMessage(payload, true); 
    };

    // --- Render ---
    if (isMobile) {
        return (
            <div className="container-fluid large-padding" style={{ height: "100vh" }}>
                <MobileChatLayout 
                    users={users}
                    selectedUser={selectedUser}
                    onSelectUser={handleSelectUser}
                    messages={messages}
                    onSendMessage={sendMessage}
                    currentUser={dbUser}
                    loading={loading}
                    onBack={() => setSelectedUser(null)} 
                />
            </div>
        );
    }

    // DESKTOP
    return (
        <div className="container-fluid large-padding" style={{ height: "85vh" }}>
            <div className="row justify-content-center h-100">
                <div className="col-4 h-100 p-0">
                    <LeftPanel
                        users={users}
                        onSelectUser={handleSelectUser}
                        selectedUser={selectedUser}
                        isLoading={loading} 
                    />
                </div>
                <div className="col-6 h-100">
                    {selectedUser ? (
                        <CurrentChat
                            user={selectedUser}
                            messages={messages}
                            onSendMessage={sendMessage}
                            currentUser={dbUser}
                        />
                    ) : (
                        <div className="p-4 text-center h-100 d-flex align-items-center justify-content-center border bg-light">
                            <h5 className="text-muted">Select an appointment to chat</h5>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}