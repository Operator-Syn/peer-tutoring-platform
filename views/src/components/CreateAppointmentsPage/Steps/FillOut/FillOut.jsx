import React from "react";

export default function FillOut({ data, update }) {
    return (
        <div>
            <h3>Step 1: Fill Out</h3>
            <label>
                First Name:
                <input
                    type="text"
                    value={data.firstName}
                    onChange={(e) => update({ firstName: e.target.value })}
                />
            </label>
            <br />
            <label>
                Last Name:
                <input
                    type="text"
                    value={data.lastName}
                    onChange={(e) => update({ lastName: e.target.value })}
                />
            </label>
        </div>
    );
}
