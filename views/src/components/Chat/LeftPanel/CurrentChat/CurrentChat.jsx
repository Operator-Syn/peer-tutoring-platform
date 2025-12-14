import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CurrentChat.css";

export default function CurrentChat({ user, messages, onSendMessage, currentUser, onBack }) {
    const [inputText, setInputText] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);

    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // 1. Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 2. Handle sending
    const handleSend = () => {
        if (!inputText.trim()) return;
        onSendMessage(inputText);
        setInputText("");
    };

    // 3. Enter key
    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSend();
    };

    // 4. Time Helper
    const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [hourStr, minuteStr] = timeStr.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        hour = hour ? hour : 12;
        return `${hour}:${minuteStr} ${ampm}`;
    };

    // 5. Report Logic
    const handleReportClick = () => {
        setShowReportModal(true);
    };

    const proceedToReport = () => {
        const fullName = `${user.first_name} ${user.last_name}`;
        setShowReportModal(false); 
        navigate("/Report", { state: { prefilledName: fullName } });
    };

    if (!user) return <div className="p-4">Select a chat to begin.</div>;

    return (
        <>
            {/* ── MAIN CHAT WINDOW ── */}
            <div className="d-flex flex-column bg-white shadow-sm current-chat-container h-100">

                {/* ── HEADER ── */}
                <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        
                        {/* 🟢 BACK BUTTON (Mobile Only) */}
                        {onBack && (
                            <button 
                                onClick={onBack} 
                                className="btn btn-link text-dark p-0 me-2"
                                style={{ textDecoration: 'none' }}
                            >
                                <i className="bi bi-arrow-left fs-3"></i>
                            </button>
                        )}

                        <div>
                            <h5 className="mb-0 text-truncate" style={{maxWidth: "200px"}}>
                                {user.first_name} {user.last_name}
                            </h5>
                            <small className="text-muted d-block">
                                {user.course_code} • {user.appointment_date}
                            </small>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                        <div className="badge bg-primary d-none d-md-block">ID: {user.appointment_id}</div>

                        <button
                            className="btn btn-sm btn-outline-danger"
                            title="Report this user"
                            onClick={handleReportClick}
                        >
                            <i className="bi bi-flag-fill"></i>
                        </button>
                    </div>
                </div>

                {/* ── MESSAGES AREA ── */}
                <div className="flex-grow-1 overflow-auto p-3 chat-messages-area" style={{ minHeight: 0 }}>
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_id === currentUser.id_number;

                        return (
                            <div
                                key={index}
                                className={`d-flex mb-3 ${isMe ? "justify-content-end" : "justify-content-start"}`}
                            >
                                <div className={`p-2 px-3 rounded shadow-sm message-bubble ${isMe ? 'me' : 'them'}`}>
                                    <div className="mb-1 text-break">
                                        {msg.message_text}
                                    </div>

                                    <div className={`text-end message-timestamp ${isMe ? "text-light" : "text-muted"}`}>
                                        {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : "Just now")}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* ── INPUT AREA ── */}
                <div className="p-3 border-top bg-light d-flex gap-2">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button className="btn btn-primary" onClick={handleSend}>
                        Send
                    </button>
                </div>
            </div>

            {/* ── CONFIRMATION MODAL ── */}
            {showReportModal && (
                <div className="modal fade show chat-modal-overlay" tabIndex="-1" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Report User</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowReportModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>You are about to be redirected to the dedicated report page.</p>
                                <p className="mb-0 text-muted small">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Please prepare all your report materials (screenshots, descriptions) beforehand.
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={proceedToReport}
                                >
                                    I Understand, Proceed
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowReportModal(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}