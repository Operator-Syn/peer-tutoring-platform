import { Modal, Button, Form } from "react-bootstrap";

export default function AppointmentFilterModal({ isOpen, onClose, filters, onToggle }) {
    return (
        <Modal show={isOpen} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="fw-bold">Filter Appointments</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                <p className="text-muted small mb-3">Select which appointment statuses you want to see.</p>
                
                <div className="d-flex flex-column gap-2">
                    {Object.keys(filters).map((status) => (
                        <Form.Check 
                            key={status}
                            type="checkbox"
                            id={`filter-${status}`}
                            label={status.toLowerCase()}
                            checked={filters[status]}
                            onChange={() => onToggle(status)}
                            style={{ textTransform: "capitalize", cursor: "pointer" }}
                        />
                    ))}
                </div>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="primary" onClick={onClose}>
                    Apply Filters
                </Button>
            </Modal.Footer>
        </Modal>
    );
}