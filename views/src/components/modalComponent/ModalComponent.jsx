import { Modal, Button } from "react-bootstrap";

export default function ModalComponent({ show, onHide, title, body, footer, buttons }) {
    // Use default button if none are provided
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

            {body && <Modal.Body>{body}</Modal.Body>}

            {(footer || modalButtons.length > 0) && (
                <Modal.Footer>
                    {footer}

                    {modalButtons.map((btn, idx) => {
                        // Explicitly define button props
                        const variant = btn.variant || undefined;
                        const className = btn.className || undefined;
                        const onClick = btn.onClick;

                        return (
                            <Button key={idx} variant={variant} className={className} onClick={onClick}>
                                {btn.text}
                            </Button>
                        );
                    })}
                </Modal.Footer>
            )}
        </Modal>
    );
}
