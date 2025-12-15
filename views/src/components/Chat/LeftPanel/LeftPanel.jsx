import { useState, useMemo, useEffect } from "react";
import PartnerGroup from "./PartnerGroup/PartnerGroup"; 
import "./LeftPanel.css";

// REMOVED "col-4" from className to make it flexible for Mobile
export default function LeftPanel({ users, onSelectUser, selectedUser, isLoading }) {
    const [filter, setFilter] = useState('Active'); 
    const [expandedPartners, setExpandedPartners] = useState({});

    const filteredUsers = useMemo(() => {
        let filtered = users;
        
        if (filter === 'Active') {
            filtered = users.filter(appt => appt.status === 'BOOKED');
        } else if (filter === 'History') {
            filtered = users.filter(appt => appt.status === 'COMPLETED' || appt.status === 'CANCELLED');
        } else if (filter === 'Pending') {
            filtered = users.filter(appt => appt.status === 'PENDING');
        }
        
        return filtered;
    }, [users, filter]);

    const groupedPartners = useMemo(() => {
        const groups = {};
        
        filteredUsers.forEach((appt) => {
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
                const dateB = new Date(`${b.appointment_date}T${b.end_time}`); 
                return dateB - dateA; 
            });
        });

        return Object.values(groups);
    }, [filteredUsers]); // Dependency changed to filteredUsers

    // Auto-expand Logic
    useEffect(() => {
        if (selectedUser?.partner_id) {
            setExpandedPartners(prev => ({ ...prev, [selectedUser.partner_id]: true }));
        }
    }, [selectedUser]);

    const toggleGroup = (partnerId) => {
        setExpandedPartners(prev => ({ ...prev, [partnerId]: !prev[partnerId] }));
    };

    const getStatusBadge = (status) => {
        let color = 'bg-secondary'; 
        let text = status;

        switch (status) {
            case 'BOOKED':
                color = 'bg-success'; // Green for booked/active
                text = 'Active';
                break;
            case 'COMPLETED':
                color = 'bg-success'; // Green for completed (Historical success)
                text = 'Completed';
                break;
            case 'CANCELLED':
                color = 'bg-danger'; // Red for cancelled
                text = 'Cancelled';
                break;
            case 'PENDING':
                color = 'bg-primary'; // Blue for pending
                text = 'Pending';
                break;
            default:
                break;
        }

        return (
            <span className={`badge ${color} text-uppercase`} style={{ fontSize: '0.65rem', padding: '0.3em 0.5em', minWidth: '50px' }}>
                {text}
            </span>
        );
    };

    return (
        <div className="h-100 d-flex flex-column border-end bg-white shadow-sm left-panel-container">
            <div className="p-3 border-bottom bg-light">
                <h5 className="mb-2 fw-bold d-flex justify-content-between align-items-center">
                    Conversations
                    <select 
                        className="form-select form-select-sm" 
                        style={{ width: 'auto' }}
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="Active">Active (BOOKED)</option>
                        <option value="Pending">Pending</option>
                        <option value="History">History (COMPLETED/CANCELLED)</option>
                        <option value="All">All</option>
                    </select>
                </h5>
                <small className="text-muted">Grouped by Partner</small>
            </div>

            <div className="list-group list-group-flush flex-grow-1 overflow-auto">
                {isLoading ? (
                    <div className="p-4 text-center">Loading...</div>
                ) : groupedPartners.length === 0 ? (
                    <div className="text-center p-4 text-muted mt-5">
                        <p>No {filter !== 'All' ? filter.toLowerCase() : 'matching'} appointments found.</p>
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
                            getStatusBadge={getStatusBadge} 
                        />
                    ))
                )}
            </div>
        </div>
    );
}