import tutorSchedulesImg from '../assets/tutor_schedules.png';
import searchSvg from '../assets/search_icon.svg';
import bookSvg from '../assets/book_icon.svg';
import peopleSvg from '../assets/people_icon.svg';

import './HomePage.css';
import Button from '../components/button';

export default function HomePage() {

    return (
        <>  
            <div className='home'>
                <div className='home-top'>
                    <div className="col-6 left-column">
                        <div>
                            <div className='introduction'>
                                <h1>Inspiring Excellence through Education</h1>
                                <p>
                                    Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknovhwn printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also
                                </p>
                            </div>

                            <div className='stats'>
                                <Stat top_text='100%' bottom_text='Effective' />
                                <Stat top_text='60+' bottom_text='Offered Subjects' />
                                <Stat top_text='Peer' bottom_text='Tutoring' />
                            </div>

                            <div className='button-section'>
                                <Button>Start Learning</Button>
                                <Button light={true}>Appointments</Button>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 right-column">
                        <div className='tutor-sched'>
                            <img src={tutorSchedulesImg} alt="Homepage Illustration" />
                            <div className='custom-border' />
                        </div>
                    </div>
                </div>

                <div className='home-bottom'>
                    <Card icon={searchSvg} title='Explore' description='Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum text ever since the 1500s.' />
                    <Card icon={bookSvg} description='Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum text ever since the 1500s.' />
                    <Card icon={peopleSvg} description='Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum text ever since the 1500s.' />
                </div>
            </div>
            
        </>
    );
}

function Stat({ top_text='Top', bottom_text='Bottom' }) {

    return (
        <>
            <div className='stat'>
                <p className='top-text'>{top_text}</p>
                <p className='bottom-text'>{bottom_text}</p>
            </div>
        </>
    );
}

function Card({ title='Title', description='Description', icon=null }) {

    const customBorder = {
        display: 'flex',
        flexDirection: 'row-reverse',
        width: '30px',
        backgroundColor: '#4956AD',
        height: '100%',
        borderRadius: '15px',
    }

    const customBorder2 = {
        width: '15px',
        backgroundColor: '#FFFFFF',
        height: '100%',
        borderRadius: '25px',
    }

    return (
        <>

            <div className='card'>
                <div style={customBorder}>
                    <div style={customBorder2} />
                </div>
                <img src={icon} alt="Icon" /> 
                <div className='card-text'>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>        
        </>

    );
}