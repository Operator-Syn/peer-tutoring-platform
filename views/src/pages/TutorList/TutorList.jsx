import './TutorList.css';

import { useState } from "react";
import BasicButton from '../../components/BasicButton/BasicButton.jsx';
import Select from 'react-select';
import { Form, Card, Button } from 'react-bootstrap';

const courseOptions = [
	{ value: 'cs101', label: 'CS101' },
	{ value: 'cs103', label: 'CS103' },
	// ...
];

const availabilityOptions = [
	{ value: 'monday', label: 'Monday' },
	{ value: 'tuesday', label: 'Tuesday' },
	// ...
];

const tutors = [
	{ tutorName: "Alice Johnson", courses: ["CS101", "MATH201"] },
	{ tutorName: "Bob Smith", courses: ["ENG150", "HIST210"] },
	{ tutorName: "Charlie Brown", courses: ["BIO110", "CHEM120"] },
	{ tutorName: "Diana Prince", courses: ["PHYS130", "CS102"] },
	{ tutorName: "Ethan Hunt", courses: ["MATH202", "STAT300"] },
	{ tutorName: "Fiona Gallagher", courses: ["PSY101", "SOC200"] },
	{ tutorName: "Fiona Gallagher", courses: ["PSY101", "SOC200"] },
	{ tutorName: "Fiona Gallagher", courses: ["PSY101", "SOC200"] }
];

export default function TutorList() {
	const [page, setPage] = useState(1);

	return (
		<div className="tutor-list align-items-center">
			<h1 style={{marginTop: "5rem", fontSize: "3rem", color: "#616DBE", fontWeight: "bold"}}>Tutors</h1>

			<div className='tutor-list-search d-flex gap-3 mb-3'>

				<div className='d-flex gap-3 justify-content-center'>
					<div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
						<Select options={courseOptions} isSearchable placeholder="Course" />
					</div>
					<div className='p-0' style={{width: "11rem", minWidth: "140px"}}>
						<Select options={availabilityOptions} isSearchable placeholder="Availability" />
					</div>
				</div>

				<div className='tutor-list-search-bar p-0' style={{width: "100%", minWidth: "17rem", maxWidth: "30rem", marginLeft: "auto"}}>
					<Form>
						<Form.Control type="search" placeholder="Search" className="me-2" aria-label="Search" />
					</Form>
				</div>
				
			</div>

			<div className='row justify-content-center flex-wrap gap-3'>
				{tutors.map((tutor, idx) => (
					<div className="col-lg-4 col-md-6 col-12 p-0 w-auto m-auto" key={idx}>
						<TutorCard {...tutor} />
					</div>
				))}
			</div>

			<div className="d-flex align-items-center justify-content-center gap-2 mt-3">
				<Button variant="outline-primary">
					&lt;
				</Button>
				<span>
					<Form.Control
					type="number"
					min={1}
					max={3}
					value={page}
					style={{ width: "60px", display: "inline-block", textAlign: "center" }}
					/>{" "}
					of {3}
				</span>
				<Button variant="outline-primary">
					&gt;
				</Button>
			</div>

		</div>
	);
}


function TutorCard({tutorName="Tutor Name", courses}) {

	return (
		<Card className="column" style={{ width: '18rem', padding: "1rem", gap: "1rem" }}>
			<Card.Body className="d-flex tutor-info-1" style={{padding: "0"}}>
				<Card.Img variant="top" src="https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg" style={{width: "58px", height: "58px", padding: "0"}}/>
				<div className="column m-auto">
					<Card.Title className='text-center'>{tutorName}</Card.Title>
					<Card.Text className='text-center'>Tutor</Card.Text>
				</div>
			</Card.Body>
			<Card.Body className="d-flex tutor-info-2" style={{padding: "0rem"}}>
				<CourseTag courseCode="CS101" />
				<CourseTag courseCode="CS101" />
				<CourseTag courseCode="CS101" />
			</Card.Body>
			<BasicButton style={{fontSize: "0.8rem", borderRadius: "4px", width: "fit-content", height: "auto", minWidth: 0, padding: "0.175rem 0.75rem", marginLeft: "auto"}}> View Profile </BasicButton>
		</Card>


	);
}

function CourseTag({ courseCode }) {

	return (
		<div className="course-tag-list me-2">
			<p style={{margin: "0px", fontSize: "0.7rem"}}>{courseCode}</p>
		</div>
	);
}