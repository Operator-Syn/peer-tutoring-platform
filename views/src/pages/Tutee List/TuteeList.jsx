import { useEffect, useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import Select from 'react-select';
import Pagination from '../../components/TableComponents/Pagination';
import SortButton from '../../components/TableComponents/SortButton';
import SortBy from '../../components/TableComponents/SortBy';

import './TuteeList.css';
import loadingIcon from '../../assets/loading.svg';
import sortIcon from '../../assets/sort.png';

export default function TuteeList() {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const [tutees, setTutees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
	const [maxPages, setMaxPages] = useState(1);
    const [studentsPerPage, setStudentsPerPage] = useState(10);

    const [ascending, setAscending] = useState(true);
    const [sortBy, setSortBy] = useState('last_name');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchTutees = async () => {
            if (!page) return;
            try {
                const result = await fetch(`${API_URL}/api/tutee-list/all?page=${page}&asc=${ascending}&sortBy=${sortBy}&search=${searchQuery}`, {
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

        setLoading(true);

    }, [page, ascending, sortBy, searchQuery]);

    useEffect(() => {
        setPage(1);
    }, [maxPages]);

    const sortButtonClick = () => {
        setAscending(!ascending);
    }

    return (
        <div className="tutee-list">
            <h1 style={{fontSize: "3rem", color: "#616DBE", fontWeight: "bold"}}>Tutees</h1>

            <div className='tutee-list-search d-flex gap-3 mb-3'>
                <div className='tutee-list-search-bar p-0' style={{width: "100%", minWidth: "17rem"}}>
                    <Form>
                        <Form.Control type="search" placeholder="Search" className="me-2" aria-label="Search" onChange={e => {setSearchQuery(e.target.value)}} />
                    </Form>
                </div>

                <div className='d-flex row-md gap-2 justify-content-center'>
                    <SortBy 
                        options={[
                            { value: 'id_number', label: 'ID Number' },
                            { value: 'first_name', label: 'First Name' },
                            { value: 'last_name', label: 'Last Name' },
                            { value: 'year_level', label: 'Year Level' },
                            { value: 'program_code', label: 'Program Code' },
                        ]}
                        onChange={selectedOption => {
                            setSortBy(selectedOption ? selectedOption.value : 'last_name');
                        }}
                    />
                    
                    <SortButton onClick={sortButtonClick} ascending={ascending} />    
                </div>
                
            
            </div>  

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

            <div className='pagination-container'>
                <Pagination page={page} setPage={setPage} maxPages={maxPages} />            
            </div>

        </div>
    );
}