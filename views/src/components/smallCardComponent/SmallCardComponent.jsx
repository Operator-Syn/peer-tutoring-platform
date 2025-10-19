import { useState } from "react";
import { Card } from "react-bootstrap";
import ModalComponent from "../modalComponent/ModalComponent";
import "./SmallCardComponent.css";

export default function SmallCardComponent({
    title,
    modalTitle,
    leftAlignText, // string
    rightAlignTop,
    rightAlignBottom,
    image,
    footer,
    modalFooter,
    modalContent, // array of { text, role, url }
    tutorMessage, // string
    modalButtons,
    disableModal = false,
}) {
    const [showModal, setShowModal] = useState(false);

    const handleClick = () => {
        if (!disableModal) setShowModal(true);
    };

    const wrappedButtons = modalButtons?.map((btn) => ({
        ...btn,
        onClick: (event) => btn.onClick?.(() => setShowModal(false), event),
    })) || [];

    const leftTexts = leftAlignText ? [leftAlignText] : [];

    return (
        <>
            <Card
                className={`shadow-sm hover-shadow-lg transition-all border-0 ${!disableModal ? "card-fixed card-clickable" : ""}`}
                onClick={handleClick}
            >
                {image && (
                    <Card.Img
                        variant="top"
                        src={image}
                        className={!disableModal ? "card-img-fixed" : ""}
                    />
                )}
                <Card.Body>
                    {title && <Card.Title>{title}</Card.Title>}
                    {leftTexts.map((text, idx) => (
                        <Card.Text key={idx} className="m-0">
                            {text}
                        </Card.Text>
                    ))}

                    {disableModal && (
                        <>
                            {modalContent?.map((item, idx) => (
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

                            {tutorMessage && (
                                <Card.Text className="my-2 p-3 border rounded bg-light">
                                    <strong>Tutor's Message:</strong> {tutorMessage}
                                </Card.Text>
                            )}
                        </>
                    )}

                    {rightAlignTop && (
                        <Card.Text className="text-end small text-muted m-0">{rightAlignTop}</Card.Text>
                    )}
                    {rightAlignBottom && (
                        <Card.Text className="text-end small text-muted m-0">{rightAlignBottom}</Card.Text>
                    )}
                </Card.Body>

                {footer && <Card.Footer className="text-muted small">{footer}</Card.Footer>}
            </Card>

            {!disableModal && (
                <ModalComponent
                    show={showModal}
                    onHide={() => setShowModal(false)}
                    title={modalTitle || title}
                    body={
                        <SmallCardComponent
                            title={title}
                            modalContent={modalContent}
                            tutorMessage={tutorMessage}
                            rightAlignTop={rightAlignTop}
                            rightAlignBottom={rightAlignBottom}
                            image={image}
                            footer={modalFooter || footer}
                            disableModal={true}
                        />
                    }
                    footer={modalFooter}
                    buttons={wrappedButtons}
                />
            )}
        </>
    );
}
