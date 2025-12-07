import { Button, Form } from "react-bootstrap";

export default function Pagination({ page, setPage, maxPages }) {

    return (
        <div className="d-flex align-items-center justify-content-center gap-2 mt-3">
            <Button variant="outline-primary" onClick={() => setPage(prev => Math.max(1, Number(prev) - 1))}>
                &lt;
            </Button>
            <span>
                <Form.Control value={page}   onChange={e => {
                        const val = e.target.value;
                        // Allow empty string for controlled input, or check if value is a positive integer
                        if (val === "" || (/^\d+$/.test(val) && Number(val) >= 1 && Number(val) <= maxPages)) {
                            setPage(val === "" ? "" : Number(val));
                        }
                    }} 
                    style={{ width: "60px", display: "inline-block", textAlign: "center" }} />
                {" "} of {maxPages}
            </span>
            <Button variant="outline-primary" onClick={() => setPage(prev => Math.min(maxPages, Number(prev) + 1))}>
                &gt;
            </Button>
        </div>
    )
}