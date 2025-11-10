import tutorSchedulesImg from '../../../assets/tutor_schedules.png';
import searchSvg from '../../../assets/search_icon.svg';
import bookSvg from '../../../assets/book_icon.svg';
import peopleSvg from '../../../assets/people_icon.svg';
import caro1 from '../../../assets/caro1.jpg';
import caro2 from '../../../assets/caro2.jpg';
import caro3 from '../../../assets/caro3.jpg';

import './HomePage.css';
import BasicButton from '../../../components/BasicButton/BasicButton';
import HomePageCard from '../../../components/HomePageCard/HomePageCard';
import Carousel from 'react-bootstrap/Carousel';
import { useNavigate } from 'react-router-dom';
import { useLoginCheck } from '../../../hooks/useLoginCheck';

export default function HomePage() {
    const navigate = useNavigate();
    const loginCheck = useLoginCheck({route: "/Appointments"});
    const checkIfLoggedinBeforeCreatingAppointment = useLoginCheck({route: "/CreateAppointment"})

    return (
        <>  
            <div className='home container-fluid column align-center height-100'>
                <div className='home-top row align-items-center justify-content-center height-auto mx-auto gap-3' style={{width: '90%', maxWidth: '1500px', paddingTop: '130px', paddingBottom: '70px'}}>
                    <div className="left-column col d-flex flex-column justify-content-center align-items-center" style={{paddingLeft: '0px', paddingRight: '0px'}}>
                        <div className='introduction'>
                            <h1>Inspiring Excellence through Education</h1>
                            <p style={{textIndent: '60px'}}>
                                We believe that every student possesses unique potential, and our mission is to unlock it through personalized learning experiences. Our tutoring booking connects you with dedicated educators who provide tailored support, helping you to grasp difficult concepts, build confidence, and achieve your academic goals. Whether you're looking to catch up, keep up, or get ahead, we offer a supportive environment where learning thrives and students are empowered to reach new heights. Invest in your education and discover the transformative power of dedicated, individualized guidance.                            
                            </p>                 
                        </div>

                        <div className='d-flex flex-row justify-content-between gap-3'>
                            <Stat top_text='100%' bottom_text='Effective' />
                            <Stat top_text='60+' bottom_text='Offered Subjects' />
                            <Stat top_text='Peer' bottom_text='Tutoring' />
                        </div>

                        <div className='row gap-3 align-items-center justify-content-center mt-4'>
                            <BasicButton onClick={() => {
                                checkIfLoggedinBeforeCreatingAppointment();
                            }}>Start Learning</BasicButton>
                            <BasicButton onClick={() => {
                                loginCheck();
                            }} light={true}>Appointments</BasicButton>
                        </div>
                    </div>

                    <div className="right-column col d-flex flex-column justify-content-center align-items-center" style={{paddingLeft: '0px', paddingRight: '0px'}}>
                        <div className='tutor-sched d-flex flex-row' style={{borderRadius: '15px'}} >

                            <Carousel style={{width: ''}}>
                                <Carousel.Item>
                                    <img className='img-fluid' src={tutorSchedulesImg} alt="Homepage Illustration" style={{borderRadius: '15px 0px 0px 15px'}} onClick={() => {
                                        
                                        }} />                                    
                                </Carousel.Item>
                                <Carousel.Item>
                                    <img className='img-fluid' src={caro1} alt="Homepage Illustration" style={{borderRadius: '15px 0px 0px 15px'}} onClick={() => {
                                        
                                        }} />                                    
                                </Carousel.Item>
                                <Carousel.Item>
                                    <img className='img-fluid' src={caro2} alt="Homepage Illustration" style={{borderRadius: '15px 0px 0px 15px'}} onClick={() => {
                                        
                                        }} />                                    
                                </Carousel.Item>
                            </Carousel>

                            <div className='custom-border' />
                        </div>
                    </div>
                </div>

                <div className='home-bottom row gap-4 justify-content-center align-items-center mx-auto' style={{width: '90%', maxWidth: '1500px', paddingBottom: '70px'}}>
                    <HomePageCard icon={searchSvg} title='Explore' description='
                        Discover new worlds and spark your curiosity. Navigate subjects and expand your knowledge with our guidance.
                    ' />
                    <HomePageCard icon={bookSvg} title='Education' description='
                        Empowering learners with strong foundations for success. Engage with content that fosters deep understanding and a love for learning.
                    ' />
                    <HomePageCard icon={peopleSvg} title='Diversity' description='
                        Celebrating unique perspectives for a dynamic learning experience. We foster an inclusive and empowering environment for all.
                    ' />
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

