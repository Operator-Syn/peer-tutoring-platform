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

// 1. Import useState and useEffect
import { useNavigate } from 'react-router-dom';
import { useLoginCheck } from '../../../hooks/useLoginCheck';
import { useState, useEffect } from 'react';

export default function HomePage() {
    const navigate = useNavigate();
    const loginCheck = useLoginCheck();
    const checkIfLoggedinBeforeCreatingAppointment = useLoginCheck({ route: "/CreateAppointment" })

    // 2. State to hold user data
    const [currentUser, setCurrentUser] = useState(null);

    // 3. Effect: Fetch user data automatically when the page loads
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch("/api/auth/get_user");
                if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data);
                }
            } catch (error) {
                console.error("Background user fetch failed:", error);
            }
        };
        fetchUser();
    }, []); // Empty dependency array = runs once on mount

    // 4. Handler: Now SYNCHRONOUS (Instant)
    const handleAppointmentsClick = (appointmentId = null) => {
        // We check the variable we already have in memory.
        // No fetch, no waiting, no flash.
        
        const isActiveTutor = currentUser?.role === "TUTOR" && currentUser?.tutor_status === "ACTIVE";

        if (isActiveTutor) {
            navigate("/TutorAppointments", {
                state: { highlightId: appointmentId }
            });
        } else {
            // Default for students, guests, or if data hasn't loaded yet
            navigate("/Appointments", {
                state: { highlightId: appointmentId }
            });
        }
    };

    return (
        <>
            <div className='container-fluid justify-content-center align-items-center d-flex flex-column px-3'>
                <div className='justify-content-between g-4 large-padding homepage-header mb-5'>
                    <h1 className='text-center'>Inspiring Excellence through Education</h1>

                    <div className="row d-flex justify-content-between gx-5 px-2">
                        <div className="left-column col-lg-6 d-flex flex-column justify-content-around align-items-center mx-auto ps-lg-0 pe-lg-5 mb-3 mb-lg-0">
                            <div className='introduction'>
                                <p style={{ textIndent: '60px' }}>
                                    We believe that every student possesses unique potential, and our mission is to unlock it through personalized learning experiences. Our tutoring booking connects you with dedicated educators who provide tailored support, helping you to grasp difficult concepts, build confidence, and achieve your academic goals. Whether you're looking to catch up, keep up, or get ahead, we offer a supportive environment where learning thrives and students are empowered to reach new heights. Invest in your education and discover the transformative power of dedicated, individualized guidance.
                                </p>
                            </div>

                            <div className='stats'>
                                <Stat top_text='100%' bottom_text='Effective' />
                                <Stat top_text='60+' bottom_text='Offered Subjects' />
                                <Stat top_text='Peer' bottom_text='Tutoring' />
                            </div>

                            <div className='row gap-3 align-items-center justify-content-center mt-4'>
                                <BasicButton onClick={() => {
                                    checkIfLoggedinBeforeCreatingAppointment();
                                }}>Start Learning</BasicButton>

                                {/* 5. This button is now connected to the instant handler */}
                                <BasicButton onClick={() => handleAppointmentsClick()} light={true}>
                                    Appointments
                                </BasicButton>
                            </div>
                        </div>

                        <div className="right-column col-lg-6 d-flex flex-column justify-content-center align-items-center pe-lg-0 ps-lg-5 mb-3 mb-lg-0">
                            <div className='tutor-sched d-flex flex-row' style={{ borderRadius: '15px' }}>
                                <Carousel style={{ width: '' }}>
                                    <Carousel.Item>
                                        <img className='img-fluid custom-carousel-img' src={tutorSchedulesImg} alt="Homepage Illustration" />
                                    </Carousel.Item>
                                    <Carousel.Item>
                                        <img className='img-fluid custom-carousel-img' src={caro1} alt="Homepage Illustration" />
                                    </Carousel.Item>
                                    <Carousel.Item>
                                        <img className='img-fluid custom-carousel-img' src={caro2} alt="Homepage Illustration" />
                                    </Carousel.Item>
                                </Carousel>

                                <div className='custom-border' />
                            </div>
                        </div>
                    </div>
                </div>

                <div className='home-bottom row gap-4 justify-content-center align-items-center mx-auto pb-5'>
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

function Stat({ top_text = 'Top', bottom_text = 'Bottom' }) {
    return (
        <div className='stat'>
            <p className='top-text'>{top_text}</p>
            <p className='bottom-text'>{bottom_text}</p>
        </div>
    );
}