import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useLocation } from "react-router-dom"; // 🎯 Import useLocation
import LeftPanel from "./LeftPanel/LeftPanel";
import CurrentChat from "./LeftPanel/CurrentChat/CurrentChat";
import MobileChatLayout from "./MobileChatLayout";

export default function ChatInterface({ googleId: propGoogleId }) {
    const location = useLocation(); 
    const [googleId, setGoogleId] = useState(propGoogleId);
    const [dbUser, setDbUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // 🟢 NEW GLOBAL NOTIFICATION STATES (Kept for completeness, though managed by parent/Header)
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0); 

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

    const socketUrl = import.meta.env.VITE_WEBSOCKET_URL || "http://localhost:5000";

    // =========================================================
    // 🟢 1. REFS (Updated)
    // =========================================================
    const selectedUserRef = useRef(null);
    const usersRef = useRef([]);      
    const dbUserRef = useRef(null);   
    const notificationsRef = useRef([]); 

    // Keep Refs synced with State
    useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
    useEffect(() => { usersRef.current = users; }, [users]);
    useEffect(() => { dbUserRef.current = dbUser; }, [dbUser]);
    useEffect(() => { notificationsRef.current = notifications; }, [notifications]); 

    // Handle Window Resize
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 576);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Helper: Reorder Sidebar & Sync Read Badge ---
    const handleIncomingMessage = (msg, isOwnMessage = false) => {
        setUsers((prevUsers) => {
            const index = prevUsers.findIndex(u => String(u.appointment_id) === String(msg.appointment_id));
            if (index === -1) return prevUsers;

            const newUsers = [...prevUsers];
            const [movedUser] = newUsers.splice(index, 1);

            // Check if we are currently viewing this chat
            const isChatOpen = String(selectedUserRef.current?.appointment_id) === String(msg.appointment_id);
            
            // LOGIC: If chat is open, force unread to 0. Otherwise, increment.
            if (isChatOpen) {
                movedUser.unread_count = 0; 
            } else if (!isOwnMessage) {
                movedUser.unread_count = (movedUser.unread_count || 0) + 1;
            }

            newUsers.unshift(movedUser);
            return newUsers;
        });
    };

    // 🟢 NEW HANDLER TO MARK GLOBAL CHAT NOTIFICATION AS READ LOCALLY (WITH RECIPIENT CHECK)
    const markChatNotificationAsReadLocally = (appointmentId) => {
        let wasUnread = false;
        const currentRecipientId = dbUserRef.current?.id_number;

        // 1. Mark the specific NEW_MESSAGE notification as read
        setNotifications(prev => 
            prev.map(n => {
                if (n.type === 'NEW_MESSAGE' && 
                    String(n.reference_id) === String(appointmentId) && 
                    String(n.recipient_id) === String(currentRecipientId) &&
                    !n.is_read) 
                {
                    wasUnread = true;
                    return { ...n, is_read: true };
                }
                return n;
            })
        );
        
        // 2. Decrement global unread count if it was marked unread
        if (wasUnread) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    }


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
    // 🟢 6. Socket LISTENERS
    // =========================================================
    useEffect(() => {
        if (!socket) return;

        // A. Handle Receiving Messages
        const onReceiveMessage = (msg) => {
            const currentApptId = selectedUserRef.current?.appointment_id;
            const isForOpenChat = currentApptId && String(currentApptId) === String(msg.appointment_id);
            
            // 1. Update Messages List
            if (isForOpenChat) {
                
                // ... (deduplication/optimistic update logic)
                setMessages((prev) => {
                    const isDuplicate = prev.some(m => {
                        if (m.id && msg.id) return m.id === msg.id;
                        if (m.tempId && msg.tempId) return m.tempId === msg.tempId;
                        return false; 
                    });
                    if (isDuplicate) return prev;

                    const myId = dbUserRef.current?.id_number;
                    if (String(msg.sender_id) === String(myId)) {
                        const pendingIndex = prev.findIndex(m => m.tempId && m.message_text === msg.message_text);
                        if (pendingIndex !== -1) {
                            const newMsgs = [...prev];
                            newMsgs[pendingIndex] = msg; 
                            return newMsgs;
                        }
                    }
                    return [...prev, msg];
                });

                // 2. AUTO-READ: Execute the read-marking logic.
                if (dbUserRef.current) {
                    
                    // Explicitly clear the chat badge in the sidebar for the active chat
                    setUsers(prev => prev.map(u => 
                        String(u.appointment_id) === String(currentApptId) ? { ...u, unread_count: 0 } : u
                    ));

                    // Mark messages read via socket (prevents unread status on message table)
                    socket.emit("mark_read", {
                        appointment_id: msg.appointment_id,
                        user_id: dbUserRef.current.id_number
                    });
                    
                    // Mark chat notification as read locally and on the server 
                    markChatNotificationAsReadLocally(msg.appointment_id);
                    const apptId = msg.appointment_id;
                    const recipientId = dbUserRef.current.id_number;
                    
                    fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                        .then(() => {
                             // 🟢 CRITICAL SYNC EMIT (Receive Message): Notify other components (Header/NotificationPanel) that this chat notification is now read
                            socket.emit("notification_read_sync", {
                                type: 'NEW_MESSAGE',
                                reference_id: apptId, // The appointment ID
                                user_id: recipientId // The user who marked it read
                            });
                        })
                        .catch(err => console.error("Failed to mark chat notification as read on server (socket receive):", err));
                    
                    // 3. SIDEBAR SYNC: Update the sidebar order.
                    handleIncomingMessage(msg, false); 
                    
                }
            
            } else {
                // If chat is NOT open, just update the sidebar order and badges
                handleIncomingMessage(msg, false);
            }
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
        
        // C. Handle Incoming Global Notifications
        const onNewGlobalNotification = (newNotif) => {
            console.log("🚨 New Global Notification:", newNotif);
            
            const currentApptId = selectedUserRef.current?.appointment_id;
            const currentUserId = dbUserRef.current?.id_number;
            
            if (String(newNotif.recipient_id) !== String(currentUserId)) {
                return;
            }

            const isForOpenChat = 
                newNotif.type === 'NEW_MESSAGE' && 
                currentApptId && 
                String(currentApptId) === String(newNotif.reference_id);

            // If a new message notification arrives while the chat is open, mark it read immediately
            if (isForOpenChat) {
                markChatNotificationAsReadLocally(newNotif.reference_id);
                // Also trigger server read and sync emit to ensure Header is updated
                if (dbUserRef.current) {
                    const apptId = newNotif.reference_id;
                    const recipientId = currentUserId;
                    fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                        .then(() => {
                            socket.emit("notification_read_sync", {
                                type: 'NEW_MESSAGE',
                                reference_id: apptId, 
                                user_id: recipientId 
                            });
                        })
                        .catch(err => console.error("Failed to mark chat notification as read on server (socket new notif):", err));
                }
                return; 
            }

            const existingNotif = notificationsRef.current.find(n => n.notification_id === newNotif.notification_id);
            
            if (existingNotif) {
                if (existingNotif.is_read !== newNotif.is_read || existingNotif.created_at !== newNotif.created_at) {
                     setNotifications(prev => prev.map(n => 
                        String(n.notification_id) === String(newNotif.notification_id) ? newNotif : n 
                    ));
                }
            } else {
                setNotifications(prev => [newNotif, ...prev]);
                
                if (!newNotif.is_read) {
                    setUnreadCount(prev => prev + 1);
                }
            }
        };


        socket.on("receive_message", onReceiveMessage);
        socket.on("load_messages", onLoadMessages);
        socket.on("connect", onConnect);
        socket.on("new_global_notification", onNewGlobalNotification); 

        return () => {
            socket.off("receive_message", onReceiveMessage);
            socket.off("load_messages", onLoadMessages);
            socket.off("connect", onConnect);
            socket.off("new_global_notification", onNewGlobalNotification); 
        };
    }, [socket]); 

    // 7. Initial Monitoring
    useEffect(() => {
        if (!socket || users.length === 0) return;
        const appointmentIds = users.map(u => u.appointment_id);
        socket.emit("monitor_appointments", { appointment_ids: appointmentIds });
    }, [socket, users.length]); 
    
    // 8. Initial Load of Global Notifications
    useEffect(() => {
        if (!dbUser) return;
        
        const fetchNotifications = async () => {
            try {
                const res = await fetch(`/api/notifications/`);
                if (!res.ok) throw new Error("Failed to fetch notifications");
                
                const data = await res.json();
                setNotifications(data);
                
                const initialUnread = data.filter(n => !n.is_read).length;
                setUnreadCount(initialUnread);
            } catch (error) {
                console.error("Error loading global notifications:", error);
            }
        };
        
        fetchNotifications();
    }, [dbUser]);


    // =========================================================
    // 🎯 9. Deep Linking via Router State
    // =========================================================
    useEffect(() => {
        if (loading || !dbUser || users.length === 0) return;

        const deepLinkAppointmentId = location.state?.deepLinkAppointmentId;

        if (deepLinkAppointmentId) {
            console.log(`Attempting deep link for Appointment ID: ${deepLinkAppointmentId}`);
            const targetUser = users.find(u => String(u.appointment_id) === String(deepLinkAppointmentId));
            
            if (targetUser) {
                handleSelectUser(targetUser); 
                
                // Clean up the state so refreshing the page doesn't re-select the chat
                if (window.history.replaceState) {
                    const newState = { ...location.state };
                    delete newState.deepLinkAppointmentId;
                    window.history.replaceState(newState, '', location.pathname);
                }
            } else {
                console.warn(`Deep link failed: User not found for Appointment ID: ${deepLinkAppointmentId}`);
            }
        }
    }, [dbUser, users, location.state, loading]);


    // --- User Actions ---
    const handleSelectUser = (user) => {
        
        // 💥 CRITICAL FIX: PREVENT REDUNDANT CALLS TO join_appointment
        if (selectedUserRef.current && String(selectedUserRef.current.appointment_id) === String(user.appointment_id)) {
            console.log("Chat already active. Skipping re-selection logic to save DB connections.");
            return; 
        }

        setSelectedUser(user);
        
        // 1. Reset chat sidebar unread locally immediately
        setUsers(prev => prev.map(u => 
            String(u.appointment_id) === String(user.appointment_id) ? { ...u, unread_count: 0 } : u
        ));

        // 🟢 2. Mark the global chat notification as read LOCALLY and on the Server.
        if (dbUser) {
            markChatNotificationAsReadLocally(user.appointment_id);
            
            const apptId = user.appointment_id;
            const recipientId = dbUser.id_number;

            fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                .then(() => {
                    // 🟢 CRITICAL SYNC EMIT (Select User): Notify Header/NotificationPanel that this chat notification is now read
                    if (socket) {
                        socket.emit("notification_read_sync", {
                            type: 'NEW_MESSAGE',
                            reference_id: apptId, // The appointment ID
                            user_id: recipientId // The user who marked it read
                        });
                    }
                })
                .catch(err => console.error("Failed to mark chat notification as read on server (select user):", err));
        }

        // 3. Join the appointment room and implicitly mark messages as read on the server
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
        
        // Mark notification as read when sending a message
        if (dbUser) {
            const apptId = selectedUser.appointment_id;
            const recipientId = dbUser.id_number;

            markChatNotificationAsReadLocally(apptId);
            
            fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                .then(() => {
                     // 🟢 CRITICAL SYNC EMIT (Send Message): Notify Header/NotificationPanel that this chat notification is now read
                    if (socket) {
                        socket.emit("notification_read_sync", {
                            type: 'NEW_MESSAGE',
                            reference_id: apptId, 
                            user_id: recipientId
                        });
                    }
                })
                .catch(err => console.error("Failed to mark chat notification as read on server (send message):", err));
        }
    };
    
    // 🟢 HANDLER TO MARK ANY GLOBAL NOTIFICATION AS READ (Kept for completeness, though primary logic is in NotificationPanel)
    const markNotificationAsRead = async (notifId) => {
        try {
            await fetch(`/api/notifications/read/${notifId}`, { method: 'POST' });
            
            // Update local state
            setNotifications(prev => 
                prev.map(n => 
                    n.notification_id === notifId ? { ...n, is_read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
        }
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