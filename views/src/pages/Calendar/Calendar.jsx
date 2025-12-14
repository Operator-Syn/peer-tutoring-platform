import React, { useState, useEffect } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

    useEffect(() => {
    // Replace '12345' with the actual logged-in ID
        fetch(`http://localhost:5000/api/calendar/my-calendar?user_id=${'2023-0783'}&role=tutor`)
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
    }, []);

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
        <div style={{padding: "0px 40px", marginTop: "90px"}}>
            <div style={{ height: '500px', padding: '20px' }}>
                <h2>My Appointments</h2>
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