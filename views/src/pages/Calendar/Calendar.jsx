import React, { useState, useEffect, use } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useLoginCheck } from '../../hooks/useLoginCheck';
import BasicButton from '../../components/BasicButton/BasicButton';

// Setup the localizer for date-fns
const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

export default function Calendar() {
    const [events, setEvents] = useState([]);
    const [view, setView] = useState('month');
    const [date, setDate] = useState(new Date());
    const [isTutor, setIsTutor] = useState(false);
    const [id, setId] = useState(null);
    const [viewAsTutor, setViewAsTutor] = useState(false);
    const [buttonText, setButtonText] = useState('Tutee');
    const loginCheck = useLoginCheck();

    useEffect(() => {

        const fetchUserRoleAndId = async () => {
            try {
                const user = await loginCheck();
                const gId = user ? user.sub : null;
                const response = await fetch(`http://localhost:5000/api/calendar/check-if-tutor/${gId}`);
                const data = await response.json();
                setIsTutor(data.is_tutor);
                setId(data.tutee_id);
                console.log("User role and ID fetched:", data);
            } catch (error) {
                console.error("Error fetching user role and ID:", error);
            }
        };

        fetchUserRoleAndId();


    // Replace '12345' with the actual logged-in ID
        // fetch(`http://localhost:5000/api/calendar/my-calendar?user_id=${id}&role=tutee`)
        // .then(res => res.json())
        // .then(data => {
        //     // Convert string dates to JS Date objects
        //     console.log("Raw fetched data:", data);
        //     const formattedEvents = data.map(evt => ({
        //         ...evt,
        //         start: new Date(evt.start.replace(' ', 'T')),
        //         end: new Date(evt.end.replace(' ', 'T'))
        //     }));
        //     setEvents(formattedEvents);
        //     console.log("Fetched events:", formattedEvents);
        // })
        // .catch(err => console.error("Error fetching events:", err));
    }, []);

    useEffect(() => {
        let role = 'tutee';
        if (viewAsTutor) {
            role = 'tutor';
        } else {
            role = 'tutee';
        }
        setEvents([]); // Clear events before fetching new ones
        fetch(`http://localhost:5000/api/calendar/my-calendar?user_id=${id}&role=${role}`)
        .then(res => res.json())
        .then(data => {
            // Convert string dates to JS Date objects
            console.log("Raw fetched data:", data);
            const formattedEvents = data.map(evt => ({
                ...evt,
                start: new Date(evt.start.replace(' ', 'T')),
                end: new Date(evt.end.replace(' ', 'T'))
            }));
            setEvents(formattedEvents);
            console.log("Fetched events:", formattedEvents);
        })
        .catch(err => console.error("Error fetching events:", err));
    }, [viewAsTutor, id]);


// Custom styling to color-code events based on status
    const eventStyleGetter = (event) => {
    const style = {
        backgroundColor: event.color,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block'
    };
        return { style };
    };

    return (
        <div style={{padding: "0px 40px", marginTop: "90px", display: 'flex', justifyContent: 'center', height: '700px'}}>
            <div style={{ height: '500px', padding: '20px', maxWidth: '1000px', width: '100%'}}>
                <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
                    <h1 style={{color: "#616DBE"}}>My Appointments</h1>
                    {isTutor && (
                        <div>
                            View as: 
                            <BasicButton
                                onClick={() => { setViewAsTutor(v => !v); setButtonText(t => t === 'Tutee' ? 'Tutor' : 'Tutee'); }}
                                style={{marginLeft: '10px', width: '100px', height: '30px', fontSize: '14px', padding: '0px'}}
                            >
                                {buttonText}
                            </BasicButton>    
                        </div>
                        
                    )}
                </div>

                <div style={{ marginBottom: '10px' }}>
                    <span style={{ marginRight: '15px' }}>🟢 Confirmed (Booked)</span>
                    <span style={{ marginRight: '15px' }}>🟡 Pending</span>
                    <span>🔘 Completed</span>
                </div>

                <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 500 }}
                    eventPropGetter={eventStyleGetter} // Applies the colors
                    views={['month', 'week', 'day']} // Allows switching views
                    defaultView='month'
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                />
            </div>            
        </div>

    );
}