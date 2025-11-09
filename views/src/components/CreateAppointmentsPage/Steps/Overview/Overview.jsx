import React from "react";

export default function Overview({ data }) {
    return (
        <div>
            <h3>Step 3: Overview</h3>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
