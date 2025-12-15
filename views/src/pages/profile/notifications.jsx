import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Offcanvas, ListGroup, Badge, Button, Spinner } from 'react-bootstrap';

// Note: Ensure Bootstrap Icons CSS/package is included in your project globally 
// for these class names (e.g., <i class="bi bi-bell"></i>) to render correctly.

// This function converts the database notification object into a displayable format
const formatNotification = (notification) => {
    let iconClass = '';
    let variant = 'primary'; // Default variant

    switch (notification.type) {
        case 'NEW_MESSAGE':
            // 💬 
            iconClass = 'bi bi-chat-dots';
            variant = 'info';
            break;
        case 'BOOKING_REQUEST':
            // ✍️ 
            iconClass = 'bi bi-calendar-plus';
            variant = 'warning';
            break;
        case 'BOOKING_APPROVED':
            // ✅ 
            iconClass = 'bi bi-calendar-check';
            variant = 'success';
            break;
        case 'BOOKING_REJECTED':
            // ❌ 
            iconClass = 'bi bi-calendar-x';
            variant = 'danger';
            break;
        default:
            // 🔔 
            iconClass = 'bi bi-bell';
            variant = 'secondary';
    }

    return {
        ...notification,
        iconClass,
        variant,
        timeAgo: new Date(notification.created_at).toLocaleString(), // Simple timestamp for display
        // The message_text already contains the sender's name from the backend
    };
};

export default function NotificationPanel({ user, socket, show, handleClose, onNotificationClick, onUnreadCountChange }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const userId = user?.id_number;

    // --- 1. Fetch Notifications ---
    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/notifications/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');
            
            const data = await response.json();
            setNotifications(data.map(formatNotification));
            
            // Calculate and report the new unread count to the parent component
            const unreadCount = data.filter(n => !n.is_read).length;
            onUnreadCountChange(unreadCount);

        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data when the panel opens
    useEffect(() => {
        if (show) {
            fetchNotifications();
        }
    }, [show, userId]);


    // --- 2. Handle Real-Time Updates ---
    // Use useCallback for onUnreadCountChange to stabilize the dependency array
    const stableOnUnreadCountChange = useCallback(onUnreadCountChange, [onUnreadCountChange]);

    useEffect(() => {
        if (!socket) return;
        
        const onNewNotification = (data) => {
            console.log("Real-time notification received:", data);
            
            if (show) {
                // Panel is open, fetch new list
                fetchNotifications();
            } else {
                // Panel is closed, just increment the badge count.
                stableOnUnreadCountChange(prev => prev + 1);
            }
        };

        socket.on('new_notification', onNewNotification);

        return () => {
            socket.off('new_notification', onNewNotification);
        };
    }, [socket, show, stableOnUnreadCountChange]);


    // --- 3. Handle Notification Click ---
    const handleNotificationClick = async (notification) => {
        // Prevent action if already marked read
        if (notification.is_read) return;

        // 1. Mark as read in DB
        try {
            const response = await fetch(`/api/notifications/mark-read/${notification.notification_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            
            if (!response.ok) throw new Error('Failed to mark as read');
            
            // 2. Update local state
            setNotifications(prev => prev.map(n => 
                n.notification_id === notification.notification_id ? { ...n, is_read: true } : n
            ));
            
            // 3. Update global unread count
            stableOnUnreadCountChange(prev => Math.max(0, prev - 1));

        } catch (error) {
            console.error("Error marking notification read:", error);
            fetchNotifications(); 
        }

        // 4. Handle navigation/action (e.g., open chat)
        if (notification.type === 'NEW_MESSAGE' && onNotificationClick) {
            onNotificationClick(notification.reference_id); // Pass appointment_id
            handleClose(); // Close panel after action
        }
    };

    // --- 4. Render ---
    return (
        <Offcanvas show={show} onHide={handleClose} placement="end" style={{ width: '400px' }}>
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>
                    Notifications 
                    <Badge bg="danger" className="ms-2">
                        {notifications.filter(n => !n.is_read).length} Unread
                    </Badge>
                </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body className="p-0">
                {loading && <div className="text-center p-4"><Spinner animation="border" size="sm" /> Loading...</div>}
                
                {!loading && notifications.length === 0 && (
                    <p className="text-muted text-center p-4">No notifications yet.</p>
                )}

                <ListGroup variant="flush">
                    {notifications.map((n) => (
                        <ListGroup.Item 
                            key={n.notification_id} 
                            action 
                            onClick={() => handleNotificationClick(n)}
                            active={!n.is_read}
                            className={!n.is_read ? 'bg-light' : ''}
                        >
                            <div className="d-flex w-100 justify-content-between">
                                <h6 className="mb-1">
                                    {/* 🟢 Render the Bootstrap Icon using the <i> tag */}
                                    <i className={`${n.iconClass} me-2 text-${n.variant}`}></i>
                                    {n.message_text}
                                </h6>
                            </div>
                            <small className="text-muted">{n.timeAgo}</small>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Offcanvas.Body>
        </Offcanvas>
    );
}