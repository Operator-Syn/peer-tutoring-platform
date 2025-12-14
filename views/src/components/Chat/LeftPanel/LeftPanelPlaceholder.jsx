import "./LeftPanelPlaceholder.css";

export default function LeftPanelPlaceholder() {
    return (
        <>
            {[1, 2, 3, 4, 5].map((n) => (
                <div 
                    key={n} 
                    className="p-3 border-bottom placeholder-glow d-flex align-items-center gap-2"
                >
                    {/* Fake Avatar */}
                    <span className="placeholder rounded-circle bg-secondary placeholder-avatar" />
                    
                    <div className="flex-grow-1">
                        {/* Fake Name */}
                        <span className="placeholder col-6 bg-secondary d-block mb-1"></span>
                        {/* Fake Subtitle */}
                        <span className="placeholder col-4 bg-secondary d-block"></span>
                    </div>
                    
                    {/* Fake Expand Icon */}
                    <span className="placeholder col-1 bg-secondary"></span>
                </div>
            ))}
        </>
    );
}