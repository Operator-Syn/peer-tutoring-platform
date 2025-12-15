import BasicButton from "./BasicButton/BasicButton";
import { useNavigate } from "react-router-dom";

export default function CalendarOverlay() {
	const navigate = useNavigate();

	return (
		<div style={{position: "fixed", bottom: "20px", right: "20px", zIndex: 1000}}>
			<BasicButton text="Open Calendar" onClick={() => navigate("/calendar")} style={{width: "54px", padding: "0px", backgroundColor: "#616DBE", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)", borderRadius: "80px"}}>
				<img src="https://www.svgrepo.com/show/533381/calendar-alt.svg" alt="Calendar" style={{width: "37px", height: "37px", filter: "invert(1)"}} />
			</BasicButton>	
		</div>
	);
}