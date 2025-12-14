import React from "react";
import LeftPanel from "./LeftPanel/LeftPanel";
import CurrentChat from "./LeftPanel/CurrentChat/CurrentChat";

export default function MobileChatLayout({
    users,
    selectedUser,
    onSelectUser,
    messages,
    onSendMessage,
    currentUser,
    loading,
    onBack // Function to clear selected user
}) {
    // VIEW 1: Chat Window (Active if a user is selected)
    if (selectedUser) {
        return (
            <div className="d-flex flex-column h-100 bg-white">
                <CurrentChat
                    user={selectedUser}
                    messages={messages}
                    onSendMessage={onSendMessage}
                    currentUser={currentUser}
                    onBack={onBack} // Pass back function to show arrow
                />
            </div>
        );
    }

    // VIEW 2: List of Partners (Default)
    return (
        <div className="d-flex flex-column h-100 bg-white">
            <LeftPanel
                users={users}
                onSelectUser={onSelectUser}
                selectedUser={selectedUser}
                isLoading={loading}
            />
        </div>
    );
}