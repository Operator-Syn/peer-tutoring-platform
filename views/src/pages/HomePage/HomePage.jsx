import tutorSchedulesImg from '../../assets/tutor_schedules.png';
import searchSvg from '../../assets/search_icon.svg';
import bookSvg from '../../assets/book_icon.svg';
import peopleSvg from '../../assets/people_icon.svg';

import './HomePage.css';
import Button from '../../components/button';
import HomePageCard from '../../components/HomePageCard/HomePageCard';

export default function HomePage() {

    return (
        <>  
            <div className='home container-fluid column align-center height-100'>
                <div className='home-top row align-items-center justify-content-center height-auto mx-auto gap-3' style={{width: '80%', maxWidth: '1500px', paddingTop: '70px', paddingBottom: '70px'}}>
                    <div className="left-column col d-flex flex-column justify-content-center align-items-center" style={{paddingLeft: '0px', paddingRight: '0px'}}>
                        <div className='introduction'>
                            <h1>Inspiring Excellence through Education</h1>
                            <p>
                                Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknovhwn printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also
                            </p>
                        </div>

                        <div className='d-flex flex-row justify-content-between gap-3'>
                            <Stat top_text='100%' bottom_text='Effective' />
                            <Stat top_text='60+' bottom_text='Offered Subjects' />
                            <Stat top_text='Peer' bottom_text='Tutoring' />
                        </div>

                        <div className='row gap-3 align-items-center justify-content-center mt-4'>
                            <Button>Start Learning</Button>
                            <Button light={true}>Appointments</Button>
                        </div>
                    </div>

                    <div className="right-column col d-flex flex-column justify-content-center align-items-center" style={{paddingLeft: '0px', paddingRight: '0px'}}>
                        <div className='tutor-sched d-flex flex-row' style={{borderRadius: '15px'}} >
                            <img className='img-fluid' src={tutorSchedulesImg} alt="Homepage Illustration" style={{borderRadius: '15px 0px 0px 15px'}} />
                            <div className='custom-border' />
                        </div>
                    </div>
                </div>

                <div className='home-bottom row gap-4 justify-content-center align-items-center mx-auto' style={{width: '80%', maxWidth: '1500px', paddingBottom: '70px'}}>
                    <HomePageCard icon={searchSvg} title='Explore' description='Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum text ever since the 1500s.' />
                    <HomePageCard icon={bookSvg} title='Education' description='Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum text ever since the 1500s.' />
                    <HomePageCard icon={peopleSvg} title='Diversity' description='Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum text ever since the 1500s.' />
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

