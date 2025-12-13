import "./ChatUsers.css"; 

export default function ChatUser({ 
    name, 
    avatar, 
    lastMessage, 
    timestamp, 
    isActive, 
    onClick,
    unreadCount = 0 
}) {
    return (
        <button 
            className={`list-group-item list-group-item-action d-flex gap-3 align-items-center chat-user-item ${isActive ? 'active' : ''}`}
            onClick={onClick}
        >
            {/* Avatar Logic */}
            {avatar ? (
                <img
                    src={avatar}
                    alt={name}
                    className="rounded-circle border chat-user-avatar"
                />
            ) : (
                <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold chat-user-avatar-placeholder">
                    {name.charAt(0).toUpperCase()}
                </div>
            )}

            {/* Text Content */}
            <div className="d-flex flex-column text-start flex-grow-1 overflow-hidden chat-text-container">
                {/* Bold name if unread */}
                <div className={`text-truncate ${unreadCount > 0 && !isActive ? "fw-bold text-dark" : "fw-semibold"}`}>
                    {name}
                </div>
                <div 
                    className={`text-truncate chat-last-message ${isActive ? 'text-white-50' : 'text-muted'}`} 
                    title={lastMessage}
                >
                    {lastMessage}
                </div>
            </div>

            {/* Right Side: Timestamp & Badge */}
            <div className="d-flex flex-column align-items-end flex-shrink-0 ms-2">
                <small className={`chat-timestamp ${isActive ? 'text-white-50' : 'text-muted'}`}>
                    {timestamp}
                </small>

                {/* The Red Badge */}
                {unreadCount > 0 && (
                    <span 
                        className={`badge rounded-pill mt-1 chat-unread-badge ${isActive ? "bg-white text-primary" : "bg-danger"}`} 
                    >
                        {unreadCount}
                    </span>
                )}
            </div>
        </button>
    );
}