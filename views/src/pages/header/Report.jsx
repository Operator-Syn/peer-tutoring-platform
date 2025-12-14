import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./Report.css";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Report() {
  const location = useLocation();

  const [selectedReasons, setSelectedReasons] = useState([]);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const fileInputRef = useRef(null);

  const [showOptions, setShowOptions] = useState(false);
  const [nameOptions, setNameOptions] = useState([]);
  const [nameToIdMap, setNameToIdMap] = useState({});
  const [files, setFiles] = useState([]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [userGoogleId, setUserGoogleId] = useState(null);
  const [tuteeId, setTuteeId] = useState(null);
  const [reportedId, setReportedId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);

  const reasons = [
    "Harassment",
    "Racist",
    "Verbal Abuse",
    "Cursing",
    "Inappropriate Profile",
    "Mocking",
    "Other",
  ];

  const toastOpts = {
    position: "top-right",
    autoClose: 2500,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  };

  const filteredOptions = useMemo(() => {
    return nameOptions.filter((opt) =>
      opt.toLowerCase().includes(name.toLowerCase())
    );
  }, [nameOptions, name]);

  // ✅ Prefill name from navigation state: navigate("/report", { state: { prefilledName: "..." } })
  // Wait for nameToIdMap to exist so we can auto-map name -> id
  useEffect(() => {
    if (location.state?.prefilledName && Object.keys(nameToIdMap).length > 0) {
      const prefilledName = location.state.prefilledName;

      setName(prefilledName);

      if (nameToIdMap[prefilledName]) {
        // prevent self-report
        if (nameToIdMap[prefilledName] === tuteeId) {
          setReportedId("");
          toast.warning("You can’t report yourself.", toastOpts);
        } else {
          setReportedId(nameToIdMap[prefilledName]);
        }
      }
    }
  }, [location.state, nameToIdMap, tuteeId]);

  // 1) Get all tutees → build name list & map fullName -> id_number (excluding self)
  useEffect(() => {
    const fetchTutees = async () => {
      try {
        if (!API_BASE_URL) return;

        const res = await fetch(`${API_BASE_URL}/api/tutee/all`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("tutee/all failed:", res.status, await res.text());
          toast.error("Failed to load names list.", toastOpts);
          return;
        }

        const data = await res.json();

        const nameMap = {};
        const names = data
          .filter((t) => {
            if (!tuteeId) return true;
            return t.id_number !== tuteeId;
          })
          .map((tutee) => {
            const fullName = [tutee.first_name, tutee.middle_name, tutee.last_name]
              .filter(Boolean)
              .join(" ");

            if (fullName) nameMap[fullName] = tutee.id_number;
            return fullName;
          });

        const uniqueNames = [...new Set(names)].filter(Boolean);
        setNameOptions(uniqueNames);
        setNameToIdMap(nameMap);
      } catch (err) {
        console.error("Error fetching tutees:", err);
        toast.error("Something went wrong while loading names.", toastOpts);
      }
    };

    fetchTutees();
  }, [tuteeId]);

  // 2) Get logged in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!API_BASE_URL) return;

        const res = await fetch(`${API_BASE_URL}/api/auth/get_user`, {
          credentials: "include",
        });

        if (!res.ok) {
          console.error("get_user failed:", res.status, await res.text());
          toast.error("Please log in again.", toastOpts);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setUserGoogleId(data.sub || data.google_id);
      } catch (err) {
        console.error("Failed to fetch logged-in user:", err);
        toast.error("Could not identify your session. Please re-login.", toastOpts);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // 3) Get tuteeId from google id
  useEffect(() => {
    const fetchTuteeId = async () => {
      if (!userGoogleId || !API_BASE_URL) return;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/tutee/by_google/${userGoogleId}`,
          { credentials: "include" }
        );

        if (!res.ok) {
          console.error("by_google failed:", res.status, await res.text());
          toast.error("Could not load your account info.", toastOpts);
          return;
        }

        const data = await res.json();
        if (data.id_number) {
          setTuteeId(data.id_number);
        } else {
          toast.error("Account not found. Please re-login.", toastOpts);
        }
      } catch (err) {
        console.error("Error fetching tutee ID:", err);
        toast.error("Something went wrong while loading your account.", toastOpts);
      } finally {
        setLoading(false);
      }
    };

    fetchTuteeId();
  }, [userGoogleId]);

  const toggleReason = (reason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason]
    );
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
    if (e.target.files?.length) toast.info("Files attached.", toastOpts);
  };

  const handleConfirmClick = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmYes = async () => {
    setShowConfirmModal(false);

    if (!tuteeId) {
      toast.error("Could not identify your account. Please re-login.", toastOpts);
      return;
    }
    if (!reportedId) {
      toast.warning("Please choose a person from the suggestions list.", toastOpts);
      return;
    }
    if (selectedReasons.length === 0 && description.trim() === "") {
      toast.warning("Select at least one reason or add a description.", toastOpts);
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("reporter_id", tuteeId);
      formData.append("reported_id", reportedId);
      formData.append("type", "TUTOR_REPORT");
      formData.append("description", description);

      selectedReasons.forEach((reason) => formData.append("reasons", reason));
      files.forEach((file) => formData.append("files", file));

      const res = await fetch(`${API_BASE_URL}/api/tutee/report`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to submit report");

      toast.success(
        `Report submitted successfully! Uploaded ${data?.file_urls?.length || 0} file(s).`,
        toastOpts
      );

      setSelectedReasons([]);
      setDescription("");
      setName("");
      setReportedId("");
      setFiles([]);

      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Report submission error:", err);
      toast.error(err.message || "Error submitting report. Please try again.", toastOpts);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmNo = () => setShowConfirmModal(false);

  if (loading) {
    return (
      <div className="report-loading">
        <div className="report-loading-box">
          <div className="spinner-border" role="status" />
          <span className="ms-2">Loading report form...</span>
        </div>

        <ToastContainer newestOnTop limit={2} theme="light" />
      </div>
    );
  }

  return (
    <div className="spacing">
      <ToastContainer newestOnTop limit={2} theme="light" />

      <div className="container my-5 mt-0 p-5">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-9">
            <div className="border rounded-3 bg-white p-4 report-container d-flex flex-column align-items-start">
              <div className="spacing-report w-100">
                <div className="w-100 px-3 px-md-5">
                  <div className="text-start fw-bold fs-2 fs-md-1 h1 mb-4 report-title">
                    Report a Violation
                  </div>

                  <p className="Report-message">
                    LAV has a zero-tolerance policy for bullying. Please describe the
                    incident truthfully and with as much detail as possible. We will
                    review the report and, if warranted, impose appropriate
                    consequences.
                  </p>

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
                      ref={fileInputRef}
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

                        const chosenId = nameToIdMap[value] || "";

                        if (chosenId && chosenId === tuteeId) {
                          setReportedId("");
                          setShowOptions(false);
                          toast.warning("You can’t report yourself.", toastOpts);
                          return;
                        }

                        setReportedId(chosenId);

                        if (value.trim().length > 0 && filteredOptions.length > 0) {
                          setShowOptions(true);
                        } else {
                          setShowOptions(false);
                        }
                      }}
                      onBlur={() => setTimeout(() => setShowOptions(false), 150)}
                      onFocus={() => {
                        if (name.trim().length > 0 && filteredOptions.length > 0) {
                          setShowOptions(true);
                        }
                      }}
                    />

                    {showOptions && filteredOptions.length > 0 && (
                      <div className="border rounded bg-white position-absolute w-100 mt-1 shadow-sm z-3 name-suggestions">
                        {filteredOptions.map((opt) => {
                          const optId = nameToIdMap[opt];
                          if (optId === tuteeId) return null;

                          return (
                            <div
                              key={opt}
                              className="px-3 py-2 option-item cursor-pointer"
                              onMouseDown={() => {
                                if (nameToIdMap[opt] === tuteeId) return;
                                setName(opt);
                                setReportedId(nameToIdMap[opt] || "");
                                setShowOptions(false);
                              }}
                            >
                              {opt}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 d-flex justify-content-center gap-4">
                    <button
                      type="button"
                      className="btn btn-primary btn-lg px-4 report-confirm-btn"
                      onClick={handleConfirmClick}
                      disabled={isSubmitting || !tuteeId}
                    >
                      {isSubmitting ? "Submitting..." : "Confirm"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

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
        </div>
      </div>
    </div>
  );
}

export default Report;
