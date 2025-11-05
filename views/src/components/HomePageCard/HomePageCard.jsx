import './HomePageCard.css';

export default function BasicCard({ 
    title='Title', 
    description='Description', 
    icon=null, 
    style={/* Add your custom styles here */} }) {

    const customBorder = {
        display: 'flex',
        flexDirection: 'row-reverse',
        width: '25px',
        backgroundColor: '#4956AD',
        height: '100%',
        borderRadius: '15px',
        position: 'absolute',
        left: '0px'
    }

    const customBorder2 = {
        width: '15px',
        backgroundColor: '#FFFFFF',
        height: '100%',
        borderRadius: '25px',
    }

    return (
        <>
            <div className='home-page-card' style={style}>
                <div style={customBorder}>
                    <div style={customBorder2} />
                </div>
                <img src={icon} alt="Icon" /> 
                <div className='home-page-card-text'>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>        
        </>

    );
}