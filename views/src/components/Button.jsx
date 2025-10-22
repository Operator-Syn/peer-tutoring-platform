

export default function Button({ children, onClick = () => {}, light=false }) {

const buttonStyle = {
  backgroundColor: light ? '#FFFFFF' : '#4956AD',
  color: light ? '#4956AD' : '#FFFFFF',
  border: '2px solid #4956AD',
  padding: '10px 30px',
  fontSize: '20px',
  fontWeight: 'bold',
  borderRadius: '5px',
  cursor: 'pointer',
  height: '54px',
  width: '200px',
  whiteSpace: 'nowrap',
  boxShadow: '0 8px 20px rgba(0,0,0,0.25)'
};

    return (    
        <button onClick={onClick} style={buttonStyle}>
            {children}
        </button>
    );
}