import { useState } from "react";
import { Card } from "react-bootstrap";
import ModalComponent from "../modalComponent/ModalComponent";
import "./SmallCardComponent.css";

export default function SmallCardComponent({
    title,
    modalTitle,
    leftAlignText,
    rightAlignTop,
    rightAlignBottom,
    image,
    footer,
    modalFooter,
    modalContent,
    modalButtons,
}) {
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        if (modalContent) setShowModal(true);
    };

    // Wrap buttons for modal
    const wrappedButtons = modalButtons?.map((btn) => {
        // Define a new onClick function that receives the click event
        const handleButtonClick = (event) => {
            // Call the original button function, passing a close function
            if (btn.onClick) {
                btn.onClick(() => setShowModal(false), event);
            }
        };

        // Build the button object explicitly
        const button = {
            text: btn.text,
            variant: btn.variant || undefined,
            className: btn.className || undefined,
            onClick: handleButtonClick,
        };

        return button;
    }) || [];

    return (
        <>
            <Card
                className={`shadow-sm hover-shadow-lg transition-all border-0 card-fixed ${modalContent ? "card-clickable" : ""
                    }`}
                onClick={handleClick}
            >
                {image && (
                    <Card.Img variant="top" src={image} className="card-img-fixed" />
                )}
                <Card.Body>
                    {title && <Card.Title>{title}</Card.Title>}
                    {leftAlignText && <Card.Text className="my-3">{leftAlignText}</Card.Text>}
                    {rightAlignTop && (
                        <Card.Text className="text-end small text-muted m-0">
                            {rightAlignTop}
                        </Card.Text>
                    )}
                    {rightAlignBottom && (
                        <Card.Text className="text-end small text-muted m-0">
                            {rightAlignBottom}
                        </Card.Text>
                    )}
                </Card.Body>

                {footer && <Card.Footer className="text-muted small">{footer}</Card.Footer>}
            </Card>

            {modalContent && (
                <ModalComponent
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    title={modalTitle || title}
                    body={modalContent}
                    footer={modalFooter}
                    buttons={wrappedButtons}
                />
            )}
        </>
    );
}
