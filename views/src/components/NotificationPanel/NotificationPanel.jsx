import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Offcanvas, ListGroup, Badge, Spinner } from 'react-bootstrap';

// This function converts the database notification object into a displayable format
const formatNotification = (notification) => {
    let iconClass = '';
    let variant = 'primary'; // Default variant

    switch (notification.type) {
        case 'NEW_MESSAGE':
            iconClass = 'bi bi-chat-dots';
            variant = 'info';
            break;
        case 'BOOKING_REQUEST':
            iconClass = 'bi bi-calendar-plus';
            variant = 'warning';
            break;
        case 'BOOKING_APPROVED':
            iconClass = 'bi bi-calendar-check';
            variant = 'success';
            break;
        case 'BOOKING_REJECTED':
            iconClass = 'bi bi-calendar-x';
            variant = 'danger';
            break;
        default:
            iconClass = 'bi bi-bell';
            variant = 'secondary';
    }

    return {
        ...notification,
        iconClass,
        variant,
        // Use a more readable date format
        timeAgo: new Date(notification.created_at).toLocaleString('en-US', {
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit'
        }), 
    };
};

export default function NotificationPanel({ 
    user, 
    socket, 
    show, 
    handleClose, 
    onNotificationClick, 
    onUnreadCountChange, 
    onAppointmentClick // 🎯 ADDED NEW PROP
}) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);

    const userId = user?.id_number;

    // Use useCallback for onUnreadCountChange to stabilize the dependency array
    const stableOnUnreadCountChange = useCallback(onUnreadCountChange, [onUnreadCountChange]);

    // 🟢 HELPER: Recalculate and Report Unread Count
    const updateUnreadCount = useCallback((notifs) => {
        const unreadCount = notifs.filter(n => !n.is_read).length;
        // This passes the absolute count to the parent component
        stableOnUnreadCountChange(unreadCount);
    }, [stableOnUnreadCountChange]);

    // --- 1. Fetch Notifications ---
    const fetchNotifications = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/notifications/user/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch notifications');

            const data = await response.json();
            const formatted = data.map(formatNotification);
            setNotifications(formatted);

            // CRITICAL FIX: Report absolute unread count after fetch
            updateUnreadCount(formatted);

        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch data on userId change (mount)
    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId]); 


    // --- 2. Handle Real-Time Updates (New Notifications AND Read Sync) ---
    useEffect(() => {
        if (!socket || !userId) return;

        // Listener for brand new notifications (push new)
        const onNewNotification = (newNotif) => {
            console.log("Real-time notification received:", newNotif);

            // Consistency check: only process for the current user
            if (String(newNotif.recipient_id) !== String(userId)) return;

            setNotifications(prev => {
                const newFormattedNotif = formatNotification(newNotif);

                const exists = prev.some(n =>
                    String(n.notification_id) === String(newNotif.notification_id)
                );

                let updatedNotifications;

                if (exists) {
                    // Update existing notification
                    updatedNotifications = prev.map(n =>
                        String(n.notification_id) === String(newNotif.notification_id)
                            ? newFormattedNotif
                            : n
                    );
                } else {
                    // Prepend new notification
                    updatedNotifications = [newFormattedNotif, ...prev];
                }

                // Recalculate and report the total unread count from the new list
                updateUnreadCount(updatedNotifications);

                return updatedNotifications;
            });
        };

        // Handle synchronization for notifications marked read in ChatInterface
        const onReadSync = (syncData) => {
            console.log("Notification Read Sync received:", syncData);

            if (String(syncData.user_id) !== String(userId)) return;
            if (syncData.type !== 'NEW_MESSAGE') return;

            setNotifications(prev => {
                const updatedNotifications = prev.map(n => {
                    // Match the NEW_MESSAGE notification by its reference_id (appointment_id)
                    if (n.type === 'NEW_MESSAGE' && String(n.reference_id) === String(syncData.reference_id) && !n.is_read) {
                        return { ...n, is_read: true }; // Mark as read locally
                    }
                    return n;
                });

                updateUnreadCount(updatedNotifications);
                return updatedNotifications;
            });
        };


        socket.on('new_global_notification', onNewNotification);
        socket.on('notification_read_sync', onReadSync);

        return () => {
            socket.off('new_global_notification', onNewNotification);
            socket.off('notification_read_sync', onReadSync);
        };
    }, [socket, userId, updateUnreadCount]);


    // --- 3. Handle Notification Click ---
    const handleNotificationClick = async (notification) => {

        // --- 1. HANDLE MARKING AS READ (Only if unread) ---
        if (!notification.is_read) {
            try {
                const response = await fetch(`/api/notifications/read/${notification.notification_id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) throw new Error('Failed to mark as read');

                // Update local state and recalculate count
                setNotifications(prev => {
                    const updatedNotifications = prev.map(n =>
                        n.notification_id === notification.notification_id ? { ...n, is_read: true } : n
                    );

                    updateUnreadCount(updatedNotifications);

                    return updatedNotifications;
                });

                // Emit sync event 
                if (socket && userId) {
                    socket.emit("notification_read_sync", {
                        type: notification.type,
                        reference_id: notification.reference_id,
                        user_id: userId,
                        notification_id: notification.notification_id
                    });
                }

            } catch (error) {
                console.error("Error marking notification read:", error);
            }
        }

        // --- 2. HANDLE NAVIGATION ---

        // A. Handle Chat Messages (NEW_MESSAGE)
        if (notification.type === 'NEW_MESSAGE' && onNotificationClick) {
            handleClose(); 
            onNotificationClick(notification.reference_id); // Navigates to /Messages
        } 
        // 🎯 B. Handle Appointment/Booking Notifications
        else if (
            (notification.type === 'BOOKING_REQUEST' || 
             notification.type === 'BOOKING_APPROVED' || 
             notification.type === 'BOOKING_REJECTED') && 
             onAppointmentClick // Check if the new prop is provided
        ) {
            handleClose(); 
            onAppointmentClick(notification.reference_id); // Navigates to /Appointments or /TutorAppointments
        } 
        // C. Default Close
        else if (handleClose) {
            handleClose();
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
                                <h6 className={`mb-1 ${!n.is_read ? 'text-dark' : ''}`}>
                                    <i className={`${n.iconClass} me-2 text-${n.variant}`}></i>
                                    {n.message_text}
                                </h6>
                            </div>
                            <small className={!n.is_read ? 'text-dark' : 'text-muted'}>
                                {n.timeAgo}
                            </small>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Offcanvas.Body>
        </Offcanvas>
    );
}