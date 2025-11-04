import React from "react";
import TutorApplicationForm from "../../components/TutorApplication/TutorApplicationForm";

export default function Apply() {
    return (
        <div className="container" style={{ paddingTop: "70px", height: "100vh" }}>
            <div className="row h-100">
                <div className="col-12">
                    <TutorApplicationForm />
                </div>
            </div>
        </div>
    );
}