import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./FillOut.css";

export default function FillOut({ data, update }) {
    return (
        <div className="p-3">
            <h3 className="mb-3">Step 1: Fill Out</h3>

            <div className="border-label-group mb-3">
                <label className="form-label border-label">First Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={data.firstName}
                    onChange={(e) => update({ firstName: e.target.value })}
                />
            </div>

            <div className="border-label-group mb-3">
                <label className="form-label border-label">Last Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={data.lastName}
                    onChange={(e) => update({ lastName: e.target.value })}
                />
            </div>
        </div>
    );
}
