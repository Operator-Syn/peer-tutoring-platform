import { useState, useMemo, useEffect } from "react";
import PartnerGroup from "./PartnerGroup/PartnerGroup"; 
import "./LeftPanel.css";

// REMOVED "col-4" from className to make it flexible for Mobile
export default function LeftPanel({ users, onSelectUser, selectedUser, isLoading }) {
    const [expandedPartners, setExpandedPartners] = useState({});

    // Grouping Logic (Same as before)
    const groupedPartners = useMemo(() => {
        const groups = {};
        users.forEach((appt) => {
            const partnerId = appt.partner_id;
            if (!groups[partnerId]) {
                groups[partnerId] = {
                    partnerId: partnerId,
                    firstName: appt.first_name,
                    lastName: appt.last_name,
                    appointments: [],
                    totalUnread: 0,
                };
            }
            groups[partnerId].appointments.push(appt);
            groups[partnerId].totalUnread += (appt.unread_count || 0);
        });
        
        // Sorting Logic
        Object.values(groups).forEach(group => {
            group.appointments.sort((a, b) => {
                const dateA = new Date(`${a.appointment_date}T${a.start_time}`);
                const dateB = new Date(`${b.appointment_date}T${b.start_time}`);
                return dateB - dateA; 
            });
        });

        return Object.values(groups);
    }, [users]);

    // Auto-expand Logic
    useEffect(() => {
        if (selectedUser?.partner_id) {
            setExpandedPartners(prev => ({ ...prev, [selectedUser.partner_id]: true }));
        }
    }, [selectedUser]);

    const toggleGroup = (partnerId) => {
        setExpandedPartners(prev => ({ ...prev, [partnerId]: !prev[partnerId] }));
    };

    return (
        <div className="h-100 d-flex flex-column border-end bg-white shadow-sm left-panel-container">
            <div className="p-3 border-bottom bg-light">
                <h5 className="mb-0 fw-bold">Conversations</h5>
                <small className="text-muted">Grouped by Tutor</small>
            </div>

            <div className="list-group list-group-flush flex-grow-1 overflow-auto">
                {isLoading ? (
                    <div className="p-4 text-center">Loading...</div>
                ) : groupedPartners.length === 0 ? (
                    <div className="text-center p-4 text-muted mt-5">
                        <p>No confirmed appointments found.</p>
                    </div>
                ) : (
                    groupedPartners.map((group) => (
                        <PartnerGroup
                            key={group.partnerId}
                            group={group}
                            isExpanded={!!expandedPartners[group.partnerId]}
                            onToggle={() => toggleGroup(group.partnerId)}
                            selectedUser={selectedUser}
                            onSelectUser={onSelectUser}
                        />
                    ))
                )}
            </div>
        </div>
    );
}