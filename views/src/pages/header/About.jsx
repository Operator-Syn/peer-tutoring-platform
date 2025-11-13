import React from "react";
import {useParams} from "react-router-dom"
import { useEffect, useState } from "react";
function About() {
   
    const { tutorId } = useParams(); // pulled from URL dynamically
  const [tutor, setTutor] = useState(null);

  useEffect(() => {
    fetch(`/api/tutor/${tutorId}`)
      .then(res => res.json())
      .then(setTutor);
  }, [tutorId]);

  if (!tutor) return <p>Loading...</p>;

  return (
    <div>
      <h2>{tutor.first_name} {tutor.last_name}</h2>
      <p>ID: {tutor.tutor_id}</p>
      <p>Program: {tutor.program_code}</p>
    </div>
  );
}

export default About;
