import React from "react";

export default function Schedule({ data, update }) {
    return (
        <div>
            <h3>Step 2: Schedule</h3>
            <label>
                Preferred Date:
                <input
                    type="date"
                    value={data.date}
                    onChange={(e) => update({ date: e.target.value })}
                />
            </label>
        </div>
    );
}
