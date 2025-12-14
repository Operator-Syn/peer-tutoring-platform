import { Button } from "react-bootstrap";
import sortIcon from '../../assets/sort.png';

export default function SortButton({ onClick, ascending, style }) {

    return (
        <Button variant="primary" onClick={onClick} style={{width: "38px", height: "38px", display: "flex", alignItems: "center", justifyContent: "center"}}>
            <img src={sortIcon} alt="Sort" style={{
                    width: "20px", 
                    height: "20px", 
                    filter: "invert(1)",
                    transform: ascending ? "none" : "rotate(180deg)", // Flip the image if not ascending
                    transition: "transform 0.3s ease",
                    ...style?.img,
                }} />
        </Button>
    );
}