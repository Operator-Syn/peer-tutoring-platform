import React from "react";
import ChatUser from "../ChatUsers/ChatUsers"; 
import "./PartnerGroup.css"; 

export default function PartnerGroup({ 
    group, 
    isExpanded, 
    onToggle, 
    selectedUser, 
    onSelectUser,
    getStatusBadge
}) {
    const isActiveGroup = selectedUser?.partner_id === group.partnerId;

    return (
        <div className="border-bottom">
            {/* Group Header (Clickable) */}
            <div 
                className={`p-3 d-flex justify-content-between align-items-center partner-group-header ${isActiveGroup ? 'bg-light' : ''}`}
                onClick={onToggle}
            >
                <div className="d-flex align-items-center gap-2">
                    {/* Avatar Circle */}
                    <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center partner-group-avatar">
                        {group.firstName?.[0]}{group.lastName?.[0]}
                    </div>
                    {/* Name & Count */}
                    <div>
                        <h6 className="mb-0 fw-bold text-dark">{group.firstName} {group.lastName}</h6>
                        <small className="text-muted">{group.appointments.length} Sessions</small>
                    </div>
                </div>
                
                {/* Chevron & Badge */}
                <div className="d-flex align-items-center gap-2">
                    {group.totalUnread > 0 && (
                        <span className="badge rounded-pill bg-danger">{group.totalUnread}</span>
                    )}
                    <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} text-muted`}></i>
                </div>
            </div>

            {/* Expanded List (Appointments) */}
            {isExpanded && (
                <div className="bg-light ps-4"> 
                    {group.appointments.map((appt) => (
                        <ChatUser
                            key={appt.appointment_id}
                            name={`${appt.course_code}`} 
                            avatar={null} 
                            lastMessage={`${appt.appointment_date} • ${appt.start_time.slice(0,5)}`}
                            timestamp={`#${appt.appointment_id}`} 
                            unreadCount={appt.unread_count || 0}
                            isActive={selectedUser?.appointment_id === appt.appointment_id}
                            onClick={() => onSelectUser(appt)}
                            statusBadge={getStatusBadge(appt.status)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}