import { useState, useEffect, useRef } from 'react';
import './TutorNotesList.css';

export default function TutorNotesList({ tutorId }) {

    const [notesPosts, setNotesPosts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(14);
    const listRef = useRef(null);

    const fetchNotesPosts = async () => {
        const response = await fetch(`/api/notes-sharing/get-notes/${tutorId}`);
        const data = await response.json();
        setNotesPosts(data);
        setVisibleCount(14);
    }

    useEffect(() => {
        const handleScroll = () => {
            const el = listRef.current;
            if (!el) return;
            // 3. When scrolled to the bottom, show 2 more cards
            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) {
                setVisibleCount((prev) => Math.min(prev + 2, notesPosts.length));
            }
        };
        const el = listRef.current;
        if (el) el.addEventListener('scroll', handleScroll);
        return () => {
            if (el) el.removeEventListener('scroll', handleScroll);
        };
    }, [notesPosts.length]);

    useEffect(() => {
        fetchNotesPosts();
    }, []);

    return (
        <>
            <div className="tutor-notes-section">
                <div className='tutor-notes-container'>
                    <h1 style={{color: "#616DBE"}}>Tutor Notes</h1>
                    <hr style={{margin: "0"}} />
                    {/* <div className="notes-posts-list" ref={listRef}>
                        {notesPosts.slice(0, visibleCount).map((note) => (
                            <NotePostCard 
                                key={note.posted_note_id}
                                title={note.title}
                                courseCode={note.course_code}
                                fileUrls={note.file_urls}
                                description={note.description}
                                dateUploaded={note.date_posted}
                            />
                        ))}
                    </div> */}
                    <div class='accordion' ref={listRef} style={{height: "100%", overflowY: "auto", width: "100%", marginTop: "10px"}}>
                        {notesPosts.slice(0, visibleCount).map((note) => (
                            <div class='accordion-item' key={note.posted_note_id}>
                                <h2 class='accordion-header'>
                                    <button class='accordion-button collapsed' type='button' data-bs-toggle='collapse' data-bs-target={`#collapse${note.posted_note_id}`} aria-expanded='false' aria-controls={`collapse${note.posted_note_id}`}>
                                        {note.title} &nbsp; <span style={{fontSize: "12px", color: "#555"}}>({note.course_code})</span>
                                    </button>
                                </h2>
                                <div id={`collapse${note.posted_note_id}`} class='accordion-collapse collapse' data-bs-parent='.accordion'>
                                    <div class='accordion-body' style={{backgroundColor: "#f2f2f2"}}>
                                        <NotePostCard title={note.title} courseCode={note.course_code} fileUrls={note.file_urls} description={note.description} dateUploaded={note.date_posted} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>


                </div>
            </div>
            <div style={{height: "30px"}} />
        </>
        
    );
}

function NotePostCard({ title, courseCode, fileUrls, description, dateUploaded }) {
    return (
        <div className="" style={{}}>
            <p className="note-post-description" style={{whiteSpace: "pre-line", textAlign: "justify", wordBreak: "break-word"}}>{description}</p>
            <div className='img-cards-tnl'>
                {fileUrls.map((url, index) => (
                    <FileCard key={index} fileUrl={url} />
                ))}
            </div>
            <p className="note-post-date" style={{marginBottom: "0px", marginTop: "10px", fontSize: "smaller", color: "#888"}}>{timeAgo(dateUploaded)}</p>
        </div>
    );
}

function timeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (now.getFullYear() === date.getFullYear()) {
        return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    }
    return date.getFullYear();
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
            <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%"}}>
                {(fileUrl.endsWith('.png') || fileUrl.endsWith('.jpeg') || fileUrl.endsWith('.jpg')) && (
                    <img src={fileUrl} alt="File" className="file-icon-tnl" style={{height: '100%'}} />
                )}
                {(fileUrl.endsWith('.pdf') || fileUrl.endsWith('.doc') || fileUrl.endsWith('.docx') || fileUrl.endsWith('.ppt') || fileUrl.endsWith('.pptx') || fileUrl.endsWith('.txt')) && (
                    <img src="https://www.svgrepo.com/show/532791/file-question-alt.svg" alt="File" className="file-icon-tnl" style={{width: '70px', height: '70px'}} />
                )}
            </div>
        </div>
    );
}