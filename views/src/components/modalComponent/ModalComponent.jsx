import { Modal, Button } from "react-bootstrap";

export default function ModalComponent({ show, onHide, title, body, extraContent, footer, buttons }) {
    // Default Close button if none provided
    const modalButtons = buttons && buttons.length > 0
        ? buttons
        : [{ text: "Close", variant: "secondary", onClick: onHide }];

    return (
        <Modal show={show} onHide={onHide} centered>
            {title && (
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
            )}

            <Modal.Body>
                {/* Extra content above the card */}
                {extraContent && (
                    <div className="mb-3">
                        {extraContent}
                    </div>
                )}

                {/* Main card or modal body */}
                {body}
            </Modal.Body>

            {(footer || modalButtons.length > 0) && (
                <Modal.Footer>
                    {footer}
                    {modalButtons.map((btn, idx) => (
                        <div key={idx} className="d-flex">
                            <Button
                                variant={btn.variant || undefined}
                                className={btn.className || undefined}
                                onClick={btn.onClick}
                            >
                                {btn.text}
                            </Button>
                        </div>
                    ))}
                </Modal.Footer>
            )}
        </Modal>
    );
}
