import { useState } from "react";
import { Card } from "react-bootstrap";
import ModalComponent from "../modalComponent/ModalComponent";
import "./CardComponent.css";

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
    tutorMessage,
    modalButtonsLeft = [],
    modalButtonsRight = [],
    disableModal = false,
}) {
    const [showModal, setShowModal] = useState(false);

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
                    <Card.Img
                        variant="top"
                        src={image}
                        className={!disableModal ? "card-img-fixed" : ""}
                    />
                )}

                <Card.Body>
                    <Card.Title>{renderTitle(title)}</Card.Title>
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
                    leftButtons={wrapButtons(modalButtonsLeft)}
                    rightButtons={wrapButtons(modalButtonsRight)}
                    spaceBetweenGroups={true}
                />
            )}
        </>
    );
}
