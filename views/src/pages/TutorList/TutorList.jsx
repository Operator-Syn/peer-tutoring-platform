import './TutorList.css';
import loadingIcon from '../../assets/loading.svg';

import { use, useEffect, useState } from "react";
import BasicButton from '../../components/BasicButton/BasicButton.jsx';
import Select from 'react-select';
import { Form, Card, Button } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";


const availabilityOptions = [
	{ value: 'monday', label: 'Monday' },
	{ value: 'tuesday', label: 'Tuesday' },
	{ value: 'wednesday', label: 'Wednesday' },
	{ value: 'thursday', label: 'Thursday' },
	{ value: 'friday', label: 'Friday' },
	{ value: 'saturday', label: 'Saturday' },
	{ value: 'sunday', label: 'Sunday' }
];


export default function TutorList() {
	const [page, setPage] = useState(1);
	const [maxPages, setMaxPages] = useState(1);
	const [tutors, setTutors] = useState([]);
	const [courseOptions, setCourseOptions] = useState([]);
	const [courseSearch, setCourseSearch] = useState('');
	const [availabilitySearch, setAvailabilitySearch] = useState('');
	const [nameSearch, setNameSearch] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!page) return;
		fetch(`/api/tutor-list/all?page=${page ? page : 1}${courseSearch ? `&course=${encodeURIComponent(courseSearch.value)}` : ''}&availability=${availabilitySearch ? encodeURIComponent(availabilitySearch.value) : ''}${nameSearch ? `&name=${encodeURIComponent(nameSearch)}` : ''}`)
			.then(res => res.json())
			.then(data => {
				setTutors(Array.isArray(data.tutors) ? data.tutors : []);
				setMaxPages(data.max_pages);
			})
			.catch(error => console.error("Error fetching tutors:", error))
			.finally(() => setLoading(false));
		setLoading(true);
	}, [page, courseSearch, availabilitySearch, nameSearch]);

	useEffect(() => {
		if (!page) {
			setLoading(true);
		}
	}, [page]);

	const fetchCourses = (search = '') => {
		fetch(`/api/tutor-list/courses?search=${encodeURIComponent(search)}`)
		.then(res => res.json())
		.then(data => {
			setCourseOptions(
			(data.courses || []).map(c => ({ value: c, label: c }))
			);
		});
	};

	return (
		<div className="tutor-list align-items-center">
			<h1 style={{marginTop: "5rem", fontSize: "3rem", color: "#616DBE", fontWeight: "bold"}}>Tutors</h1>

			<div className='tutor-list-search d-flex gap-3 mb-3'>

				<div className='d-flex gap-3 justify-content-center'>
					<div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
						<Select options={courseOptions} isSearchable isClearable placeholder="Course" onInputChange={e => {fetchCourses(e);}} onChange={e => {setCourseSearch(e);setPage(1);}} />
					</div>
					<div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
						<Select options={availabilityOptions} isClearable isSearchable={false} placeholder="Availability" onChange={e => {setAvailabilitySearch(e);setPage(1);}} />
					</div>
				</div>

				<div className='tutor-list-search-bar p-0' style={{width: "100%", minWidth: "17rem", maxWidth: "30rem", marginLeft: "auto"}}>
					<Form>
						<Form.Control type="search" placeholder="Search" className="me-2" aria-label="Search" onChange={e => {setNameSearch(e.target.value); setPage(1);}} />
					</Form>
				</div>
				
			</div>

			<div className='tutor-card-grid' style={{minHeight: "33.8rem"}}>

				{(loading) && (
					<div className="loading-overlay">
						<img src={loadingIcon} alt="Loading..." />
					</div>
				)}

				{tutors.map((tutor, idx) => (
					// <div key={idx}>
						<TutorCard {...tutor} />
					// </div>
				))}
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


function TutorCard({tutorName="Tutor Name", courses, tutorId}) {
	const navigate = useNavigate();

	return (
		<Card className="column tutor-card-a" style={{ width: '18rem', padding: "1rem", gap: "1rem", height: "fit-content", minHeight: "166.24px" }}>
			<Card.Body className="d-flex tutor-info-1" style={{padding: "0"}}>
				<Card.Img variant="top" src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" style={{width: "58px", height: "58px", padding: "0"}}/>
				<div className="column m-auto">
					<Card.Title className='tutor-card-a-name text-center'>{tutorName}</Card.Title>
					<Card.Text className='text-center'>Tutor</Card.Text>
				</div>
			</Card.Body>
			<Card.Body className="row tutor-info-2-preview gap-2" style={{padding: "0rem", margin: "0", maxWidth: "254px", overflowX: "auto"}}>
				{courses.slice(0,3).map((course, idx) => (
					<CourseTag key={idx} courseCode={course} />
				))}
				{courses.length > 3 && <CourseTag courseCode={'...'} />}
			</Card.Body>
			<Card.Body className="row tutor-info-2 gap-2" style={{padding: "0rem", margin: "0", maxWidth: "254px", overflowX: "auto"}}>
				{courses.map((course, idx) => (
					<CourseTag key={idx} courseCode={course} />
				))}
			</Card.Body>
			<BasicButton style={{fontSize: "0.8rem", borderRadius: "4px", width: "fit-content", height: "auto", minWidth: 0, padding: "0.175rem 0.75rem", marginLeft: "auto"}} onClick={() => { navigate(`/tutor/${tutorId}`) }}> 
				View Profile 
			</BasicButton>
		</Card>


	);
}

function CourseTag({ courseCode }) {

	return (
		<div className="course-tag-list">
			<p style={{margin: "0px", fontSize: "0.7rem"}}>{courseCode}</p>
		</div>
	);
}