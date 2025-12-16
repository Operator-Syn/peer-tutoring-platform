import { useState, useEffect, useRef } from 'react';
import { Nav } from 'react-bootstrap';
import './TutorNotesList.css';

export default function TutorNotesList({ tutorId, tutorAvailability }) {

    const [notesPosts, setNotesPosts] = useState([]);
    const [visibleCount, setVisibleCount] = useState(6);
    const [isOwnProfile, setIsOwnProfile] = useState(false);
    const [overlayNote, setOverlayNote] = useState(null);
    const listRef = useRef(null);

    const fetchNotesPosts = async () => {
        const response = await fetch(`/api/notes-sharing/get-notes/${tutorId}`);
        const data = await response.json();
        setNotesPosts(data);
        setVisibleCount(6);
    }

    useEffect(() => {
        const handleScroll = () => {
            const el = listRef.current;
            if (!el) return;
            // 3. When scrolled to the bottom, show 2 more cards
            if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) {
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

        // Check if viewing own profile
        const checkOwnProfile = async () => {
            const resUser = await fetch(`/api/notes-sharing/isProfileOwner/${tutorId}`, { credentials: 'include' });
            if (resUser.ok) {
                const userData = await resUser.json();
                setIsOwnProfile(userData.is_owner);
                // console.log("Is own profile:", userData.is_owner);
            }
        };
        checkOwnProfile();
    }, []);

    // Group slots by day_of_week
    const groupedSlots = tutorAvailability.reduce((acc, slot) => {
    if (!acc[slot.day_of_week]) acc[slot.day_of_week] = [];
    acc[slot.day_of_week].push(slot);
    return acc;
    }, {});    

    return (
        <>
            <div className="tutor-notes-section">
                <div className='tutor-notes-container'>
                    {/* <h1 style={{color: "#616DBE"}}>Tutor Notes</h1>
                    <hr style={{margin: "0"}} /> */}
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
                    <div className='' style={{height: "100%", width: "100%", marginTop: "10px"}}>

                        <Nav className='pills' variant="tabs" defaultActiveKey="notes" style={{borderBottom: "2px solid #ddd"}}>
                            <Nav.Item>
                                <Nav.Link eventKey="notes" id="notes-tab" data-bs-toggle="tab" href="#note" role="tab" aria-controls="note" aria-selected="true" style={{color: "#616DBE", fontWeight: "bold"}}>Notes</Nav.Link>
                            </Nav.Item>
                            <Nav.Item>
                                <Nav.Link eventKey="schedule" id="schedule-tab" data-bs-toggle="tab" href="#schedule" role="tab" aria-controls="schedule" aria-selected="false" style={{color: "#616DBE", fontWeight: "bold"}}>Schedule</Nav.Link>
                            </Nav.Item>
                        </Nav>

                        <div className='tab-content' id='myTabContent' >
                            <div className='tab-pane fade show active' id="note" role="tabpanel" aria-labelledby="notes-tab">
                                <div className="notes-posts-list" ref={listRef}>
                                    {notesPosts.slice(0, visibleCount).map((note) => (
                                            <div key={note.posted_note_id} style={{width: "fit-content"}}>
                                                <NotePostCard title={note.title} courseCode={note.course_code} fileUrls={note.file_urls} description={note.description} dateUploaded={note.date_posted} onView={() => setOverlayNote(note)} />  
                                            </div>
                                    ))}
                                    {notesPosts.length === 0 && (
                                        <div>
                                            <img src="https://www.svgrepo.com/show/427101/empty-inbox.svg" alt="No Notes" style={{width: "150px", height: "150px", display: "block", marginLeft: "auto", marginRight: "auto", marginTop: "20px"}} />
                                            <p style={{textAlign: "center", marginTop: "20px", color: "#555"}}>No notes uploaded yet.</p>
                                        </div>
                                    )} 
                                </div>
                            </div>

                            <div className='tab-pane fade' id="schedule" role="tabpanel" aria-labelledby="schedule-tab">
                                <div className='slot-list-tnl'>
                                {Object.entries(groupedSlots).map(([day, slots], index) => (
                                    <div key={index} className='availability-slot-card-tnl'>
                                    <h3>{day}</h3>
                                    {slots.map((slot, idx) => (
                                        <p key={idx} style={{ margin: "0" }}>
                                        <span style={{ fontWeight: "bold" }}>{slot.day}</span>
                                        {" "}{slot.start_time} - {slot.end_time}
                                        </p>
                                    ))}
                                    </div>
                                ))}
                                </div>
                            </div>
                        </div>

                    </div>


                </div>
            </div>
            {overlayNote && (
                <div className='note-overlay-bg' onClick={() => setOverlayNote(null)}>
                    <div className='note-overlay-card' onClick={e => e.stopPropagation()}>
                        <h1>
                            {overlayNote.title}
                        </h1>
                        <p>{overlayNote.description}</p>
                        <div className='img-cards-tnl'>
                            {overlayNote.file_urls.map((url, index) => (
                                <FileCard key={index} fileUrl={url} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
            <div style={{height: "30px"}} />
        </>
        
    );
}

function NotePostCard({ title, courseCode, fileUrls, description, dateUploaded, onView }) {
    return (

        <div className="note-post-card" onClick={onView} style={{}}>
            { (fileUrls[0].endsWith('.png') || fileUrls[0].endsWith('.jpeg') || fileUrls[0].endsWith('.jpg')) ? (
                <img src={fileUrls[0]} alt="Note" style={{width: "100%", height: "170px", objectFit: "cover", borderRadius: "4px"}} />
            ) : (
                <img src="https://www.svgrepo.com/show/532791/file-question-alt.svg" alt="Note" style={{width: "100%", height: "170px", objectFit: "contain", borderRadius: "4px"}} />
            )}
            <h3 className="note-post-title" style={{marginBottom: "5px", marginTop: "10px", width: "100%", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", padding: "0 10px"}}>{title}</h3>
            {/* <p className="note-post-description" style={{whiteSpace: "pre-line", textAlign: "justify", wordBreak: "break-word"}}>{description}</p> */}
            {/* <div className='img-cards-tnl'>
                {fileUrls.map((url, index) => (
                    <FileCard key={index} fileUrl={url} />
                ))}
            </div> */}
            <p className="note-post-date" style={{marginBottom: "10px", marginTop: "0px", fontSize: "smaller", color: "#888", padding: "0 10px"}}>{timeAgo(dateUploaded)} ({courseCode})</p>


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
                { (fileUrl.endsWith('.png') || fileUrl.endsWith('.jpeg') || fileUrl.endsWith('.jpg')) ? (
                    <img src={fileUrl} alt="File" className="file-icon-tnl" style={{height: '100%'}} />
                ) : (
                    <img src="https://www.svgrepo.com/show/532791/file-question-alt.svg" alt="File" className="file-icon-tnl" style={{width: '70px', height: '70px'}} />
                )}
            </div>
        </div>
    );
}