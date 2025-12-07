import { useEffect, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import Select from 'react-select';
import './TuteeList.css';
import loadingIcon from '../../assets/loading.svg';

export default function TuteeList() {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const [tutees, setTutees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
	const [maxPages, setMaxPages] = useState(1);
    const [studentsPerPage, setStudentsPerPage] = useState(0);

    useEffect(() => {

        const fetchTutees = async () => {
            try {
                const result = await fetch(`${API_URL}/api/tutee-list/all?page=${page}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })     
                const response = await result.json();
                setTutees(response.tutees || []);
                setMaxPages(Math.ceil((response.total_count || 1) / (response.per_page || 1)));
                setStudentsPerPage(response.per_page || 0);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tutees:', error);
            }
        };

        fetchTutees();

    }, [page]);

    useEffect(() => {
        setLoading(true);
    }, [page]);

    return (
        <div className="tutee-list">
            <h1 style={{fontSize: "3rem", color: "#616DBE", fontWeight: "bold"}}>Tutees</h1>
            <SearchComponent />

            <div className='table-container'>
            {loading && <div className='loading-overlay'>
                <img src={loadingIcon} alt="Loading..." />
            </div>}    
            <table className='tutees-table'>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Year</th>
                        <th>Program</th>
                    </tr>
                </thead>
                <tbody>
                    {tutees.map((tutee) => (
                        <tr key={tutee.id_number} className='tutee-card'>
                            <td>{tutee.id_number}</td>
                            <td>{tutee.first_name}</td>
                            <td>{tutee.last_name}</td>
                            <td>{tutee.year_level}</td>
                            <td>{tutee.program_code}</td>
                        </tr>
                        
                    ))}
                    {Array.from({ length: Math.max(0, studentsPerPage - tutees.length) }).map((_, index) => (
                        <tr key={`empty-${index}`} className="empty-row">
                            <td colSpan="5">&nbsp;</td>
                        </tr>
                    ))}
                </tbody>
            </table>    
            </div>

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


        </div>
    );
}

function SearchComponent() {

    return (
        <div className='tutee-list-search d-flex gap-3 mb-3'>

            <div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
                <Select options={null} isClearable isSearchable={false} onChange={e => {null;}} />
            </div>

            <div className='tutee-list-search-bar p-0' style={{width: "100%", minWidth: "17rem"}}>
                <Form>
                    <Form.Control type="search" placeholder="Search" className="me-2" aria-label="Search" onChange={e => {null;}} />
                </Form>
            </div>
            
        </div>
    );
}

function TuteeCard({ children }) {

    return (
        <div className="tutee-card">
            {children}
        </div>
    )
}