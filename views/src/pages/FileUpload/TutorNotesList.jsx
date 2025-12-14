import { useState, useEffect } from 'react';
import './TutorNotesList.css';

export default function TutorNotesList({ tutorId }) {

    const [notesPosts, setNotesPosts] = useState([]);

    const fetchNotesPosts = async () => {
        const response = await fetch(`/api/notes-sharing/get-notes/${tutorId}`);
        const data = await response.json();
        setNotesPosts(data);
        console.log(data);
    }

    useEffect(() => {
        fetchNotesPosts();
    }, []);

    return (
        <>
            <div className="tutor-notes-section">
                <div className='tutor-notes-container'>
                    <h1 style={{color: "#616DBE"}}>Tutor Notes</h1>
                    <hr style={{margin: "0"}} />
                    <div className="notes-posts-list">
                        {notesPosts.map((note) => (
                            <NotePostCard 
                                key={note.id}
                                title={note.title}
                                courseCode={note.course_code}
                                fileUrls={note.file_urls}
                                description={note.description}
                                dateUploaded={note.date_posted}
                            />
                        ))}
                    </div>
                    
                </div>
            </div>
            <div style={{height: "100px"}} />
        </>
        
    );
}

function NotePostCard({ title, courseCode, fileUrls, description, dateUploaded }) {
    return (
        <div className="note-post-card">
            <div style={{fontSize: "9px"}}>{courseCode}</div>
            <h2 className="note-post-title">{title}</h2>
            <p className="note-post-description" style={{whiteSpace: "pre-line"}}>{description}</p>
            <div className='img-cards-tnl'>
                {fileUrls.map((url, index) => (
                    <FileCard key={index} fileUrl={url} />
                ))}
            </div>
            <p className="note-post-date" style={{marginBottom: "0px", marginTop: "10px", fontSize: "smaller", color: "#888"}}>Uploaded on: {new Date(dateUploaded).toLocaleDateString()}</p>
        </div>
    );
}

function FileCard({ fileUrl }) {
    const fileName = fileUrl.split('/').pop().split('_').slice(1).join('_');
    

    const handleDownload = (e) => {
        e.preventDefault();
        fetch(fileUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="img-card-tnl" onClick={handleDownload}>
            <div className='img-card-overlay-tnl'>
                <p className="file-name-tnl" style={{color: "white", textOverflow: "ellipsis", width: "100%", fontSize: "10px"}}>{fileName}</p>
            </div>
            <img src={fileUrl} alt="Image File" className="file-icon-tnl" />
        </div>
    );
}