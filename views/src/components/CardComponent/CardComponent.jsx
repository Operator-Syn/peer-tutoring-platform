import { useState } from "react";
import { Card, Badge } from "react-bootstrap"; 
import ModalComponent from "../modalComponent/ModalComponent";
import "./CardComponent.css";

export default function CardComponent({
    title,
    modalTitle,
    leftAlignText,
    rightAlignTop,
    rightAlignBottom,
    image,
    footer,
    modalFooter,
    modalContent,
    tutorMessage,
    modalButtonsLeft = [],
    modalButtonsRight = [],
    disableModal = false,
    rating = null, 
}) {
    const [showModal, setShowModal] = useState(false);
    
    // NEW: State to track if the image has finished loading
    const [imgLoaded, setImgLoaded] = useState(false);

    const handleClick = () => {
        if (!disableModal) setShowModal(true);
    };

    const wrapButtons = (buttons) =>
        (buttons || []).map((btn) => ({
            text: btn.text,
            variant: btn.variant,
            className: btn.className,
            onClick: (event) => {
                if (btn.onClick) btn.onClick(() => setShowModal(false), event);
            },
        }));

    const leftTexts = leftAlignText ? [leftAlignText] : [];

    // --- Helper: Render Stars or "New Tutor" Badge ---
    const renderRating = () => {
        // 1. Loading State
        if (rating === null || rating === undefined) {
            return (
                <div className="placeholder-glow" style={{ width: "80px" }}>
                    <span className="placeholder w-100 bg-secondary opacity-25 rounded"></span>
                </div>
            );
        }

        const numRating = parseFloat(rating) || 0;

        // 2. New Tutor State (0 Rating)
        if (numRating === 0) {
            return (
                <Badge bg="info" className="text-dark shadow-sm">
                    <i className="bi bi-stars me-1"></i>New Tutor
                </Badge>
            );
        }

        // 3. Star Rating State
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (numRating >= i) {
                stars.push(<i key={i} className="bi bi-star-fill text-warning" style={{ fontSize: "0.9rem" }}></i>);
            } else if (numRating >= i - 0.5) {
                stars.push(<i key={i} className="bi bi-star-half text-warning" style={{ fontSize: "0.9rem" }}></i>);
            } else {
                stars.push(<i key={i} className="bi bi-star text-muted opacity-25" style={{ fontSize: "0.9rem" }}></i>);
            }
        }

        return (
            <div className="d-flex align-items-center" title={`${numRating.toFixed(1)} / 5`}>
                <span className="me-1">{stars}</span>
                <small className="text-muted" style={{ fontSize: "0.85rem" }}>({numRating.toFixed(1)})</small>
            </div>
        );
    };

    // --- Helper functions ---
    const renderTitle = (title) => {
        if (!title) return null;
        if (typeof title === "string") return title;
        if (Array.isArray(title)) {
            return title.map((item, idx) => (
                <span key={idx}>
                    {item.label} {item.value}{idx < title.length - 1 ? " " : ""}
                </span>
            ));
        }
        if (title.label && title.value) return `${title.label} ${title.value}`;
        return null;
    };

    const renderLeftTexts = (texts) =>
        texts.map((text, idx) => (
            <Card.Text key={idx} className="m-0">
                {text}
            </Card.Text>
        ));

    const renderRightTexts = (top, bottom) => (
        <>
            {top && <Card.Text className="text-end small text-muted m-0">{top}</Card.Text>}
            {bottom && <Card.Text className="text-end small text-muted m-0">{bottom}</Card.Text>}
        </>
    );

    const renderModalContent = (content, message) => (
        <>
            {content?.map((item, idx) => (
                <Card.Text
                    key={idx}
                    className="m-0 d-flex align-items-center justify-content-between"
                >
                    <span>
                        {item.role && <strong>{item.role}: </strong>}
                        {item.text}
                    </span>
                    {item.role === "Tutor" && item.url && (
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ms-2"
                        >
                            <i className="bi bi-box-arrow-up-right"></i>
                        </a>
                    )}
                </Card.Text>
            ))}

            {message && (
                <Card.Text className="my-2 p-3 border rounded bg-light">
                    <strong>Tutor's Message:</strong> {message}
                </Card.Text>
            )}
        </>
    );

    return (
        <>
            <Card
                className={`shadow-sm hover-shadow-lg transition-all border-0 ${!disableModal ? "card-fixed card-clickable" : ""
                    }`}
                onClick={handleClick}
            >
                {image && (
                    <>
                        {/* 1. Placeholder: Visible only while loading */}
                        {!imgLoaded && (
                            <div 
                                // We apply 'card-img-fixed' here too so the placeholder 
                                // takes the exact same dimensions as your CSS defines for the image.
                                className={`bg-secondary-subtle placeholder-glow ${!disableModal ? "card-img-fixed" : ""}`}
                                // Fallback height (200px) just in case your CSS class relies on the image's intrinsic height
                                style={{ width: "100%", minHeight: !disableModal ? "200px" : "auto" }}
                            >
                                <span className="placeholder w-100 h-100"></span>
                            </div>
                        )}

                        {/* 2. Actual Image: Hidden until loaded */}
                        <Card.Img
                            variant="top"
                            src={image}
                            // We combine your class with 'd-none' if not loaded
                            className={`${!disableModal ? "card-img-fixed" : ""} ${!imgLoaded ? "d-none" : ""}`}
                            onLoad={() => setImgLoaded(true)}
                        />
                    </>
                )}

                <Card.Body>
                    {/* --- CHANGED: Flex container for Title + Rating on the same line --- */}
                    <Card.Title className="d-flex justify-content-between align-items-center mb-2">
                        <span className="text-truncate me-2">{renderTitle(title)}</span>
                        <span className="flex-shrink-0">{renderRating()}</span>
                    </Card.Title>

                    {renderLeftTexts(leftTexts)}
                    {disableModal && renderModalContent(modalContent, tutorMessage)}
                    {renderRightTexts(rightAlignTop, rightAlignBottom)}
                </Card.Body>

                {footer && <Card.Footer className="text-muted small">{footer}</Card.Footer>}
            </Card>

            {!disableModal && (
                <ModalComponent
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    title={modalTitle || title}
                    body={
                        <CardComponent
                            title={title}
                            modalContent={modalContent}
                            tutorMessage={tutorMessage}
                            rightAlignTop={rightAlignTop}
                            rightAlignBottom={rightAlignBottom}
                            image={image}
                            footer={modalFooter || footer}
                            disableModal={true}
                            rating={rating} 
                        />
                    }
                    footer={modalFooter}
                    leftButtons={wrapButtons(modalButtonsLeft)}
                    rightButtons={wrapButtons(modalButtonsRight)}
                    spaceBetweenGroups={true}
                />
            )}
        </>
    );
}