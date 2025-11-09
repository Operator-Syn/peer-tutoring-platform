import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginCheck } from "../hooks/useLoginCheck";

export default function AccountCreation() {
    // Get User Info
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const loginCheck = useLoginCheck({ login: false });

    useEffect(() => {
        async function fetchUser() {
            const userData = await loginCheck();

            if (userData && userData.registered_tutee) {
                navigate("/");
            } else {
                return setUser(userData);
            }
        }
        fetchUser();
    }, []);

    // Form State
    const [form, setForm] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        id_number: "",
        year_level: "",
        program_code: "",
    });

    useEffect(() => {
        if (user) {
            setForm((prev) => ({
                ...prev,
                first_name: user.given_name || "",
                last_name: user.family_name || "",
            }));
        }
    }, [user]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value }); 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await fetch("/api/auth/register_tutee", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            id_number: form.id_number,
            year_level: parseInt(form.year_level, 10),
            program_code: form.program_code,
            }),
        });
        const data = await res.json();
        if (res.ok) {
            alert("Account created successfully!");
            navigate("/");
        } else {
            alert(data.error || "Failed to create account.");
        }
    };

    return (
        <div style={{ padding: "15rem" }}>
        <h2>Account Creation</h2>
        <p>Create your account here.</p>
        <form onSubmit={handleSubmit}>
        <input
            type="text"
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
        /><br /><br />
        <input
            type="text"
            name="middle_name"
            placeholder="Middle Name"
            value={form.middle_name}
            onChange={handleChange}
        /><br /><br />
        <input
            type="text"
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
        /><br /><br />
        <input
            type="text"
            name="id_number"
            placeholder="Student ID"
            value={form.id_number}
            onChange={handleChange}
        /><br /><br />
        <input
            type="number"
            name="year_level"
            placeholder="Year Level"
            value={form.year_level}
            onChange={handleChange}
        /><br /><br />
        <input
            type="text"
            name="program_code"
            placeholder="Program Code"
            value={form.program_code}
            onChange={handleChange}
        /><br /><br />
        <button type="submit">Create Account</button>
        </form>
        </div>
    );
}