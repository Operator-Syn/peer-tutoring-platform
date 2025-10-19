import { Modal, Button } from "react-bootstrap";

export default function ModalComponent({
    show,
    onHide,
    title,
    body,
    extraContent,
    footer,
    leftButtons = [],
    rightButtons = [],
    spaceBetweenGroups = false
}) {
    return (
        <Modal show={show} onHide={onHide} centered>
            {title && (
                <Modal.Header closeButton>
                    <Modal.Title>{title}</Modal.Title>
                </Modal.Header>
            )}

            <Modal.Body>
                {extraContent && <div className="mb-3">{extraContent}</div>}
                {body}
            </Modal.Body>

            {(footer || leftButtons.length > 0 || rightButtons.length > 0) && (
                <Modal.Footer
                    className={`d-flex ${spaceBetweenGroups ? "justify-content-between" : ""}`}
                >
                    {/* Left group */}
                    <div className="d-flex gap-1">
                        {leftButtons.map((btn, idx) => (
                            <Button
                                key={idx}
                                variant={btn.variant || "primary"}
                                className={btn.className || ""}
                                onClick={btn.onClick}
                            >
                                {btn.text}
                            </Button>
                        ))}
                    </div>

                    {/* Optional Footer content in the middle */}
                    {footer && <div>{footer}</div>}

                    {/* Right group */}
                    <div className="d-flex gap-1">
                        {rightButtons.map((btn, idx) => (
                            <Button
                                key={idx}
                                variant={btn.variant || "primary"}
                                className={btn.className || ""}
                                onClick={btn.onClick}
                            >
                                {btn.text}
                            </Button>
                        ))}
                    </div>
                </Modal.Footer>
            )}
        </Modal>
    );
}
