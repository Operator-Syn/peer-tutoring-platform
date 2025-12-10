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
    const loginCheck = useLoginCheck({ route: "/Appointments" });
    const checkIfLoggedinBeforeCreatingAppointment = useLoginCheck({ route: "/CreateAppointment" })

    const handleAppointmentsClick = async () => {
        const isLoggedIn = await loginCheck();
        if (!isLoggedIn) return;

        try {
            const resUser = await fetch("/api/auth/get_user", { credentials: "include" });
            if (resUser.status === 401) {
                window.location.href = "/api/auth/login";
                return;
            }
            const loggedInUser = await resUser.json();

            // Fetch all tutees
            const tutees = await fetch("/api/tutee/all").then(r => r.json());
            const userData = tutees.find(u => u.google_id === loggedInUser.sub);

            // Fetch all tutors
            const tutors = await fetch("/api/tutor/all").then(r => r.json());
            const tutorData = tutors.find(t => t.tutor_id === userData?.id_number);

            // Build a JSON object that includes everything you need
            const userJSON = {
                id_number: userData?.id_number,
                google_id: userData?.google_id,
                name: userData?.name,
                isTutor: !!tutorData,
                tutor_id: tutorData?.tutor_id || null
            };

            console.log("User JSON:", userJSON);

            // You can also store this in localStorage, context, or pass it to the next page
            localStorage.setItem("userInfo", JSON.stringify(userJSON));

            // Then navigate
            navigate(userJSON.isTutor ? "/TutorAppointments" : "/Appointments");

        } catch (err) {
            console.error(err);
        }
    };


    return (
        <>
            <div className='container-fluid justify-content-center align-items-center d-flex flex-column px-3'>
                <div className='justify-content-between g-4 large-padding homepage-header mb-5'>
                    {/* Header H1 */}
                    <h1 className='text-center'>Inspiring Excellence through Education</h1>

                    {/* Row wrapper for columns */}
                    <div className="row d-flex justify-content-between gx-5 px-2">
                        <div className="left-column col-lg-6 d-flex flex-column justify-content-around align-items-center mx-auto ps-lg-0 pe-lg-5 mb-3 mb-lg-0">
                            <div className='introduction'>
                                <p style={{ textIndent: '60px' }}>
                                    We believe that every student possesses unique potential, and our mission is to unlock it through personalized learning experiences. Our tutoring booking connects you with dedicated educators who provide tailored support, helping you to grasp difficult concepts, build confidence, and achieve your academic goals. Whether you're looking to catch up, keep up, or get ahead, we offer a supportive environment where learning thrives and students are empowered to reach new heights. Invest in your education and discover the transformative power of dedicated, individualized guidance.
                                </p>
                            </div>

                            <div className='d-flex flex-row justify-content-evenly gap-5'>
                                <Stat top_text='100%' bottom_text='Effective' />
                                <Stat top_text='60+' bottom_text='Offered Subjects' />
                                <Stat top_text='Peer' bottom_text='Tutoring' />
                            </div>

                            <div className='row gap-3 align-items-center justify-content-center mt-4'>
                                <BasicButton onClick={() => {
                                    checkIfLoggedinBeforeCreatingAppointment();
                                }}>Start Learning</BasicButton>
                                <BasicButton onClick={handleAppointmentsClick} light={true}>
                                    Appointments
                                </BasicButton>
                            </div>
                        </div>

                        <div className="right-column col-lg-6 d-flex flex-column justify-content-center align-items-center pe-lg-0 ps-lg-5 mb-3 mb-lg-0">
                            <div className='tutor-sched d-flex flex-row' style={{ borderRadius: '15px' }}>
                                <Carousel style={{ width: '' }}>
                                    <Carousel.Item>
                                        <img className='img-fluid custom-carousel-img' src={tutorSchedulesImg} alt="Homepage Illustration" onClick={() => { }} />
                                    </Carousel.Item>
                                    <Carousel.Item>
                                        <img className='img-fluid custom-carousel-img' src={caro1} alt="Homepage Illustration" onClick={() => { }} />
                                    </Carousel.Item>
                                    <Carousel.Item>
                                        <img className='img-fluid custom-carousel-img' src={caro2} alt="Homepage Illustration" onClick={() => { }} />
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
        <>
            <div className='stat'>
                <p className='top-text'>{top_text}</p>
                <p className='bottom-text'>{bottom_text}</p>
            </div>
        </>
    );
}
