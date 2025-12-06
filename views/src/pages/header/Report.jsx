import { useState, useEffect } from "react";
import "./Report.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Report() {
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [nameOptions, setNameOptions] = useState([]);
  const [nameToIdMap, setNameToIdMap] = useState({});   // 🔹 fullName -> id_number
  const [files, setFiles] = useState([]);

  // confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // logged in user & ids
  const [userGoogleId, setUserGoogleId] = useState(null);
  const [tuteeId, setTuteeId] = useState(null);         // 🔹 reporter_id
  const [reportedId, setReportedId] = useState("");     // 🔹 reported_id (from chosen name)
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredOptions = nameOptions.filter((opt) =>
    opt.toLowerCase().includes(name.toLowerCase())
  );

  const reasons = [
    "Harassment",
    "Racist",
    "Verbal Abuse",
    "Cursing",
    "Inappropriate Profile",
    "Mocking",
    "Other",
  ];

  // 1) Get all tutees → build name list & map fullName -> id_number
  useEffect(() => {
    const fetchTutees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tutee/all`);
        const data = await res.json();

        const nameMap = {};
        const names = data.map((tutee) => {
          const fullName = [tutee.first_name, tutee.middle_name, tutee.last_name]
            .filter(Boolean)
            .join(" ");
          if (fullName) {
            nameMap[fullName] = tutee.id_number;
          }
          return fullName;
        });

        const uniqueNames = [...new Set(names)];
        setNameOptions(uniqueNames);
        setNameToIdMap(nameMap);
      } catch (err) {
        console.error("Error fetching tutees:", err);
      }
    };

    fetchTutees();
  }, []);

  // 2) Get logged-in user (google id)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/get_user`);
        if (!res.ok) throw new Error("Not authenticated");
        const data = await res.json();
        setUserGoogleId(data.sub || data.google_id);
      } catch (err) {
        console.error("Failed to fetch logged-in user:", err);
      }
    };
    fetchUser();
  }, []);

  // 3) Get tutee id_number (reporter_id) from google id
  useEffect(() => {
    const fetchTuteeId = async () => {
      if (!userGoogleId) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/tutee/by_google/${userGoogleId}`
        );
        const data = await res.json();
        if (res.ok && data.id_number) {
          setTuteeId(data.id_number);
        } else {
          console.error("Failed to fetch tutee ID:", data.error);
        }
      } catch (err) {
        console.error("Error fetching tutee ID:", err);
      }
    };
    fetchTuteeId();
  }, [userGoogleId]);

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    setFiles(selected);
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  // ✅ Submit to DB
  const handleConfirmYes = async () => {
    setShowConfirmModal(false);

    if (!tuteeId) {
      alert("Could not identify your account. Please re-login.");
      return;
    }
    if (!reportedId) {
      alert("Please choose a person from the suggestions list.");
      return;
    }
    if (selectedReasons.length === 0 && description.trim() === "") {
      alert("Please select at least one reason or add a description.");
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("reporter_id", tuteeId);
      formData.append("reported_id", reportedId);
      formData.append("type", "TUTOR_REPORT"); // or another type if you want
      formData.append("description", description);
      // status is defaulted in backend, no need to send unless you want
      // formData.append("status", "PENDING");

      selectedReasons.forEach((reason) =>
        formData.append("reasons", reason)
      );
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`${API_BASE_URL}/api/tutee/report`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      alert("Report submitted successfully!");

      // reset form
      setSelectedReasons([]);
      setDescription("");
      setName("");
      setReportedId("");
      setFiles([]);
    } catch (err) {
      console.error("Report submission error:", err);
      alert("Error submitting report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmModal(false);
  };

  const handleCancel = () => {
    setSelectedReasons([]);
    setDescription("");
    setName("");
    setReportedId("");
    setFiles([]);
  };

  return (
    <div className="spacing">
      <div className="container my-5 mt-0 p-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-9">
            <div className="border rounded-3 bg-white p-4 report-container d-flex flex-column align-items-start">
              <div className="spacing-report">
                <div className="w-100 px-3 px-md-5">
                  <div className="text-start fw-bold fs-2 fs-md-1 h1 mb-4 report-title">
                    Report a Violation
                  </div>

                  <p className="Report-message">
                    LAV has a zero-tolerance policy for bullying. Please
                    describe the incident truthfully and with as much detail
                    as possible. We will review the report and, if warranted,
                    impose appropriate consequences.
                  </p>

                  {/* Reason chips */}
                  <div className="report-options">
                    {reasons.map((reason) => (
                      <div
                        key={reason}
                        className={`report-chip ${
                          selectedReasons.includes(reason) ? "active" : ""
                        }`}
                        onClick={() => toggleReason(reason)}
                        role="button"
                      >
                        {reason}
                      </div>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="mt-4 w-100">
                    <label
                      htmlFor="description"
                      className="form-label fw-semibold report-label"
                    >
                      Description
                    </label>
                    <textarea
                      id="description"
                      className="form-control something"
                      rows={4}
                      placeholder="Describe what happened"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {/* Attach files */}
                  <div className="mt-3 w-100">
                    <label
                      htmlFor="reportFiles"
                      className="form-label fw-semibold report-label"
                    >
                      Attach files (optional)
                    </label>
                    <input
                      id="reportFiles"
                      type="file"
                      className="form-control"
                      multiple
                      onChange={handleFileChange}
                    />

                    {files.length > 0 && (
                      <ul className="mt-2 small text-muted">
                        {files.map((file) => (
                          <li key={file.name}>{file.name}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Name with suggestions */}
                  <div className="mt-3 w-100 position-relative">
                    <label
                      htmlFor="fullName"
                      className="form-label fw-semibold report-label"
                    >
                      Name of the reported person
                    </label>

                    <input
                      type="text"
                      id="fullName"
                      className="form-control fullname"
                      placeholder="e.g. Lebron James"
                      value={name}
                      onChange={(e) => {
                        const value = e.target.value;
                        setName(value);
                        // If user typed an exact existing fullName, set reportedId
                        if (nameToIdMap[value]) {
                          setReportedId(nameToIdMap[value]);
                        } else {
                          setReportedId("");
                        }

                        if (
                          value.trim().length > 0 &&
                          filteredOptions.length > 0
                        ) {
                          setShowOptions(true);
                        } else {
                          setShowOptions(false);
                        }
                      }}
                      onBlur={() => {
                        setTimeout(() => setShowOptions(false), 150);
                      }}
                      onFocus={() => {
                        if (
                          name.trim().length > 0 &&
                          filteredOptions.length > 0
                        ) {
                          setShowOptions(true);
                        }
                      }}
                    />

                    {showOptions && filteredOptions.length > 0 && (
                      <div className="border rounded bg-white position-absolute w-100 mt-1 shadow-sm z-3 name-suggestions">
                        {filteredOptions.map((opt) => (
                          <div
                            key={opt}
                            className="px-3 py-2 option-item"
                            style={{ cursor: "pointer" }}
                            onMouseDown={() => {
                              setName(opt);
                              setReportedId(nameToIdMap[opt] || "");
                              setShowOptions(false);
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Buttons: Confirm + Cancel */}
                  <div className="mt-4 d-flex justify-content-center gap-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-lg px-4 report-cancel-btn"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-lg px-4 report-confirm-btn"
                      onClick={handleConfirmClick}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </div>

              {/*End container*/}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirmModal && (
        <div className="report-confirm-overlay">
          <div className="report-confirm-modal">
            <h5>Submit Report</h5>
            <p>Are you sure you want to submit this report?</p>
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button
                type="button"
                className="btn btn-outline-secondary report-modal-cancel-btn"
                onClick={handleConfirmNo}
              >
                No
              </button>
              <button
                type="button"
                className="btn btn-primary report-modal-confirm-btn"
                onClick={handleConfirmYes}
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Report;
