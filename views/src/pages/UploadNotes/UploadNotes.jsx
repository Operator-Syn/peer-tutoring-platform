
import './UploadNotes.css';
import { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import Select from 'react-select';
import BasicButton from '../../components/BasicButton/BasicButton';
import PopUpMessage from '../../components/PopUpMessage';
import { useNavigate } from 'react-router-dom';

export default function UploadNotes() {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
    const navigate = useNavigate();

    const [files, setFiles] = useState([]);
    const fileInputRef =  useRef(null);
    const [previewFile, setPreviewFile] = useState(null);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tutorId, setTutorId] = useState(null);
    const [uploadProcess, setUploadProcess] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');

    const showMessage = (message) => {
        setPopupMessage(message);
        setShowPopup(true);
    }

    const submitPost = async () => {
        if (uploadProcess) {
            return;
        }
        setUploadProcess(true);
        // Validation (optional)
        if (!title || !selectedCourse || files.length === 0 || !description) {
            showMessage("Please fill in all required fields.");
            setUploadProcess(false);
            return;
        }

        // Upload files first
        const fileUrls = [];
        for (const file of files) {
            const uploadedUrl = await uploadFileToServer(file);
            // console.log("Uploaded file URL:", fileUrls);
            if (!uploadedUrl) {
                showMessage("File upload failed. Please try again.");
                setUploadProcess(false);
                return;
            }
            fileUrls.push(uploadedUrl);
        }

        // Prepare the payload
        const payload = {
            title,
            description,
            course_code: selectedCourse.value, 
            file_urls: fileUrls,     
            tutor_id: tutorId    
        };

        // console.log("Submitting payload:", payload);

        try {
            const response = await fetch(`${API_URL}/api/notes-sharing/all`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (response.ok) {
                showMessage("Note shared successfully!");
                clearInputFields();
            } else {
                showMessage("Failed to share note: " + (data.error || "Unknown error"));
            }
        } catch (err) {
            showMessage("An error occurred: " + err.message);
        } finally {
            setUploadProcess(false);
        }
    };

    useEffect(() => {
        const checkIfTUtor = async () => {
            const res = await fetch(`${API_URL}/api/auth/get_user`, { credentials: 'include' });
            const user = await res.json();
            // console.log("Current user:", user);
            // Fetch tutor ID from tutee based on user info
            const tutorId = await fetch(`${API_URL}/api/tutee/by_google/${user.sub}`, {
                method: 'GET',
            });
            const tutorData = await tutorId.json();
            // console.log("Tutor data:", tutorData);
            //Check if tutee ID is tutor
            const tutorCheck = await fetch(`${API_URL}/api/notes-sharing/check-tutor/${tutorData.id_number}`, {
                method: 'GET',
            });
            const tutorCheckData = await tutorCheck.json();
            // console.log("Tutor check response:", tutorCheckData.is_tutor);
            if (!tutorCheckData.is_tutor) {
                navigate('/profile/apply');
                return;
            }
            setTutorId(tutorData.id_number);
        };

        checkIfTUtor();
    }, []);

    const uploadFileToServer = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('tutor_id', tutorId);

        try {
            const response = await fetch(`${API_URL}/api/notes-sharing/upload-notes`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Failed to upload file');
            }

            const data = await response.json();
            return data.file_url;
        } catch (error) {
            showMessage("Error uploading file: " + error.message);
            return null;
        }
    };

    const retrieveCourses = async (search='') => {
        // Fetch courses from API or database
        const result = await fetch(`${API_URL}/api/notes-sharing/courses/${tutorId}`);
        const data = await result.json();
        setCourses((data.courses || []).map(c => ({ value: c, label: c })));
    }

    const handleChooseFile = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        setFiles(prevFiles => {
            // Remove any old file with the same name as a new file
            const filteredPrev = prevFiles.filter(
                oldFile => !newFiles.some(newFile => newFile.name === oldFile.name)
            );
            // Combine and limit to 10 files
            const combined = [...filteredPrev, ...newFiles];
            if (combined.length > 10) {
                showMessage("You can only upload up to 10 files.");
                return combined.slice(0, 10);
            }
            return combined;
        });
        // console.log("Selected files:", newFiles);
    };

    const deleteFile = (fileName) => {
        setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    }

    const clearInputFields = () => {
        setTitle('');
        setDescription('');
        setSelectedCourse(null);
        setFiles([]);
        setSelectedCourse(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    }
    
    if (!tutorId) {
        return <div>Loading...</div>;
    }
    return (
        <>
            <PopUpMessage message={popupMessage} isOpen={showPopup} onClose={() => setShowPopup(false)} />
            <div className="file-upload-fu" style={{position: "relative"}}>
                {uploadProcess && <div style={{position: "absolute", backdropFilter: "blur(3px)", width: "100%", height: "100%", zIndex: "10", left: 0, top: 0}}>Uploading files, please wait...</div>}
                <h1 style={{color: "#616DBE"}}>Share your notes to everyone!</h1>
                <hr></hr>

                <div className='input-forms-container-fu'>
                    <div className='input-forms-left-fu'>
                        <InputFormFU label="Title">
                            <Form.Control type="text" placeholder="Title" className='input-field-tt' value={title} onChange={e => setTitle(e.target.value)} maxLength={40} />
                        </InputFormFU> 
                        <InputFormFU label="Related Course">
                            <Select isClearable placeholder="Course Code" options={courses} value={selectedCourse} onInputChange={e => {retrieveCourses(e);}} onChange={e => setSelectedCourse(e)} />
                        </InputFormFU>

                        <InputFormFU label="Upload File" customClass='upload-file-form'>
                            <div className='upload-file-container'>
                                <BasicButton text="Choose File" style={{padding: "0px", width: "40px", height: "40px", boxShadow: "none"}} light={true} onClick={handleChooseFile}>
                                    <img src="https://www.svgrepo.com/show/533718/upload.svg" alt="upload icon" style={{width: "40px"}} />
                                </BasicButton>
                                <input
                                    type="file"
                                    accept='.png,.jpeg,.jpg,.pdf,.doc,.docx,.ppt,.pptx,.txt'
                                    multiple
                                    ref={fileInputRef}
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <FileList files={files} deleteFileFunc={deleteFile} onPreview={setPreviewFile} />
                                {previewFile && (
                                    <div
                                        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center",
                                            justifyContent: "center",
                                            zIndex: 100000
                                        }}
                                        onClick={() => setPreviewFile(null)}
                                    >
                                    <img
                                        src={URL.createObjectURL(previewFile)} alt={previewFile.name} style={{maxWidth: "90vw", maxHeight: "90vh", background: "#fff", borderRadius: "8px"}}
                                        onClick={e => {e.stopPropagation(); setPreviewFile(null);}}
                                    />
                                    </div>
                                )}
                            </div>
                        </InputFormFU>


                    </div>
                    <div className='input-forms-right-fu'>
                        <InputFormFU label="Note Description" customClass='note-description-form'>
                            <Form.Control as="textarea" placeholder="Note Description" className='input-field-nd' style={{height: "100%"}} value={description} onChange={e => setDescription(e.target.value)} maxLength={255} />
                        </InputFormFU>
                    </div>
                </div>

                <div style={{display: "flex", justifyContent: "center", marginTop: "20px"}}>
                    <BasicButton style={{height: "40px", fontSize: "16px", padding: "0 20px"}} onClick={submitPost}>Submit</BasicButton>
                </div>

            </div>
            {/* <div style={{height: '10px'}} /> */}
        </>
    );
}

function InputFormFU({ children, label, style, customClass}) {
    return (
        <div className={customClass ? customClass : 'input-form-fu'} style={style}>
            <label style={{
                color: "#A3A3A3",
                fontWeight: "lighter",
                fontSize: "small",
                marginLeft: "10px"
            }}>{label}</label>
            {children}
        </div>
    );
}

function FileList({ files, deleteFileFunc, onPreview }) {
    return (
        <div className='file-list' style={{border: "1px solid #ccc", borderRadius: "5px", width: "100%", flex: "1"}}>
            {files.map((file, index) => (
                <FileItem key={index} file={file} deleteFileFunc={deleteFileFunc} onPreview={onPreview} />
            ))}
        </div>
    );
}

function FileItem({ file, deleteFileFunc, onPreview }) {
    return (
        <div className='file-item' style={{flex: "1"}} onClick={() => onPreview(file)}>
            <div style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "170px"}}>
                {file.name}
            </div>
            <BasicButton className="flex" style={{padding: "0", width: "25px", height: "25px", boxShadow: "none", alignItems: "center", justifyContent: "center"}} danger={true} light={true} onClick={e => {e.stopPropagation(); deleteFileFunc(file.name);}}>
                <img src="https://www.svgrepo.com/show/310733/delete.svg" alt="delete icon" style={{width: "15px", filter: "invert(23%) sepia(99%) saturate(7492%) hue-rotate(357deg) brightness(97%) contrast(119%)"}} />
            </BasicButton>
        </div>
    );
}
