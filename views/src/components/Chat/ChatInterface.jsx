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
    
    // 🟢 NEW GLOBAL NOTIFICATION STATES
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
                // If chat is open, we let the explicit setUsers call in onReceiveMessage handle the clear.
                // We ensure it's 0 here just for the reordered object consistency.
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
        const currentRecipientId = dbUserRef.current?.id_number; // Get current user's ID

        // 1. Mark the specific NEW_MESSAGE notification as read
        setNotifications(prev => 
            prev.map(n => {
                // Ensure the notification is for this chat AND this recipient
                if (n.type === 'NEW_MESSAGE' && 
                    String(n.reference_id) === String(appointmentId) && 
                    String(n.recipient_id) === String(currentRecipientId) && // <-- CRITICAL CHECK
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
    // 🟢 6. Socket LISTENERS (FIXED Auto-Read)
    // =========================================================
    useEffect(() => {
        if (!socket) return;

        // A. Handle Receiving Messages
        const onReceiveMessage = (msg) => {
            const currentApptId = selectedUserRef.current?.appointment_id;
            const isForOpenChat = currentApptId && String(currentApptId) === String(msg.appointment_id);
            
            // 1. Update Messages List
            if (isForOpenChat) {
                
                // Existing logic for updating messages list, deduplication, and optimistic update handling
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

                // 2. 🔥 AUTO-READ FIX: Execute the read-marking logic immediately.
                if (dbUserRef.current) {
                    
                    // 💥 FINAL FIX: Explicitly clear the chat badge in the sidebar for the active chat
                    setUsers(prev => prev.map(u => 
                        String(u.appointment_id) === String(currentApptId) ? { ...u, unread_count: 0 } : u
                    ));

                    // Mark messages read via socket (prevents unread status on message table)
                    socket.emit("mark_read", {
                        appointment_id: msg.appointment_id,
                        user_id: dbUserRef.current.id_number
                    });
                    
                    // 🟢 Mark chat notification as read locally (prevents global bell unread status)
                    markChatNotificationAsReadLocally(msg.appointment_id);
                    
                    // 🟢 Mark chat notification as read on the server 
                    const apptId = msg.appointment_id;
                    const recipientId = dbUserRef.current.id_number;
                    
                    // FIX: Ensure both IDs are explicitly cast to string for the URL
                    fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                        .catch(err => console.error("Failed to mark chat notification as read on server (socket receive):", err));
                    
                    // 3. SIDEBAR SYNC: Update the sidebar order. Count is already 0.
                    handleIncomingMessage(msg, false); 
                    
                }
            
            } else {
                // If chat is NOT open, just update the sidebar order and badges (which will increment count)
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
        
        // 🟢 C. Handle Incoming Global Notifications (FIXED FOR DUPLICATES/RACE CONDITIONS)
        const onNewGlobalNotification = (newNotif) => {
            console.log("🚨 New Global Notification:", newNotif);
            
            const currentApptId = selectedUserRef.current?.appointment_id;
            const currentUserId = dbUserRef.current?.id_number; // Get current user's ID
            
            // 1. Ignore notifications not meant for this user immediately
            if (String(newNotif.recipient_id) !== String(currentUserId)) {
                return;
            }

            const isForOpenChat = 
                newNotif.type === 'NEW_MESSAGE' && 
                currentApptId && 
                String(currentApptId) === String(newNotif.reference_id);

            // 2. If notification is for the currently open chat, mark it read and STOP processing it.
            if (isForOpenChat) {
                // This will execute markChatNotificationAsReadLocally, clearing the badge.
                markChatNotificationAsReadLocally(newNotif.reference_id);
                return; 
            }

            // 3. Check for an existing notification with the same ID.
            const existingNotif = notificationsRef.current.find(n => n.notification_id === newNotif.notification_id);
            
            if (existingNotif) {
                // If it exists (e.g., received as a duplicate event or an update), only update the state
                if (existingNotif.is_read !== newNotif.is_read || existingNotif.created_at !== newNotif.created_at) {
                     setNotifications(prev => prev.map(n => 
                        String(n.notification_id) === String(newNotif.notification_id) ? newNotif : n 
                    ));
                }
            } else {
                // 4. If it is a completely NEW notification, add it and increment the count.
                setNotifications(prev => [newNotif, ...prev]);
                
                // 5. Only increment the count if it's new AND unread.
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
    
    // 🟢 8. Initial Load of Global Notifications
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


    // --- User Actions ---
    const handleSelectUser = (user) => {
        setSelectedUser(user);
        
        // 1. Reset chat sidebar unread locally immediately
        setUsers(prev => prev.map(u => 
            String(u.appointment_id) === String(user.appointment_id) ? { ...u, unread_count: 0 } : u
        ));

        // 🟢 2. Mark the global chat notification as read locally and on server
        if (dbUser) {
            markChatNotificationAsReadLocally(user.appointment_id);
            
            const apptId = user.appointment_id;
            const recipientId = dbUser.id_number;

            // FIX: Ensure both IDs are explicitly cast to string for the URL
            fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                .catch(err => console.error("Failed to mark chat notification as read on server (select user):", err));
        }


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
        
        // 🟢 FIX: When sending a message, the user is viewing the chat,
        // so we must clear any existing unread notification for the *current user*.
        if (dbUser) {
            const apptId = selectedUser.appointment_id;
            const recipientId = dbUser.id_number;

            // Mark locally
            markChatNotificationAsReadLocally(apptId);
            
            // Mark on server
            fetch(`/api/notifications/mark_chat_read/${String(apptId)}/${String(recipientId)}`, { method: 'POST' })
                .catch(err => console.error("Failed to mark chat notification as read on server (send message):", err));
        }
    };
    
    // 🟢 NEW: HANDLER TO MARK ANY GLOBAL NOTIFICATION AS READ
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