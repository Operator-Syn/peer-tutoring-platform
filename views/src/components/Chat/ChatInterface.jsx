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

    const selectedUserRef = useRef(null);
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 576);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Helper: Reorder Sidebar ---
    const handleIncomingMessage = (msg, isOwnMessage = false) => {
        setUsers((prevUsers) => {
            const index = prevUsers.findIndex(u => u.appointment_id === msg.appointment_id);
            if (index === -1) return prevUsers;

            const newUsers = [...prevUsers];
            const [movedUser] = newUsers.splice(index, 1);

            const isChatOpen = selectedUserRef.current?.appointment_id === msg.appointment_id;
            
            // Only badge if not looking at it AND not my own message
            if (!isChatOpen && !isOwnMessage) {
                movedUser.unread_count = (movedUser.unread_count || 0) + 1;
            }

            newUsers.unshift(movedUser);
            return newUsers;
        });
    };

    // 1. Fetch Google ID
    useEffect(() => {
        if (googleId) return;
        fetch("/api/auth/get_user")
            .then(res => res.json())
            .then(data => { if (data.sub) setGoogleId(data.sub); })
            .catch(console.error);
    }, [googleId]);

    // 2. Get DB User
    useEffect(() => {
        if (!googleId) return;
        fetch(`/api/tutee/by_google/${googleId}`)
            .then(res => res.json())
            .then(data => { if (data?.id_number) setDbUser(data); })
            .catch(console.error);
    }, [googleId]);

    // 3. Fetch Partners
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

    // 4. Socket Connection (STABLE)
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

    // 5. Socket LISTENERS (STABLE)
    useEffect(() => {
        if (!socket) return;

        const onReceiveMessage = (msg) => {
            if (selectedUserRef.current?.appointment_id === msg.appointment_id) {
                setMessages((prev) => {
                    const exists = prev.some(m => m.id === msg.id || (m.tempId && m.tempId === msg.tempId));
                    return exists ? prev : [...prev, msg];
                });
            }
            handleIncomingMessage(msg, false);
        };

        const onLoadMessages = (msgs) => {
            setMessages(msgs);
        };

        socket.on("receive_message", onReceiveMessage);
        socket.on("load_messages", onLoadMessages);

        return () => {
            socket.off("receive_message", onReceiveMessage);
            socket.off("load_messages", onLoadMessages);
        };
    }, [socket]); 

    // 6. Socket MONITORING
    useEffect(() => {
        if (!socket || users.length === 0) return;
        const appointmentIds = users.map(u => u.appointment_id);
        socket.emit("monitor_appointments", { appointment_ids: appointmentIds });
    }, [socket, users.length]); 

    // --- User Actions ---
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        
        setUsers(prev => prev.map(u => 
            u.appointment_id === user.appointment_id ? { ...u, unread_count: 0 } : u
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
            // 🟢 UPDATE: Replaced 'p-0' with 'large-padding' for sticky navbar support
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