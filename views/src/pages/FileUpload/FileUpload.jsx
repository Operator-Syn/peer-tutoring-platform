
import './FileUpload.css';
import { useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import Select from 'react-select';
import BasicButton from '../../components/BasicButton/BasicButton';

export default function FileUpload() {
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const [files, setFiles] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);

    const retrieveCourses = async (search='') => {
        // Fetch courses from API or database
        const result = await fetch(`${API_URL}/api/tutor-list/courses?search=${encodeURIComponent(search)}`);
        const data = await result.json();
        setCourses((data.courses || []).map(c => ({ value: c, label: c })));
    }

    

    return (
        <>
            <div className="file-upload-fu">
                <h1 style={{color: "#616DBE"}}>Share your notes to everyone!</h1>
                <hr></hr>

                <div className='input-forms-container-fu'>
                    <div className='input-forms-left-fu'>
                        <InputFormFU label="Topic Title">
                            <Form.Control type="text" placeholder="Topic Title" className='input-field-tt' />
                        </InputFormFU> 
                        <InputFormFU label="Related Course">
                            <Select isClearable placeholder="Course" options={courses} onInputChange={e => {retrieveCourses(e);}} onChange={e => setSelectedCourse(e)} />
                        </InputFormFU>
                        <InputFormFU label="Upload File" customClass='upload-file-form'>
                            <div className='upload-file-container'>
                                <BasicButton text="Choose File" style={{padding: "0px", width: "40px", height: "40px", boxShadow: "none"}} light={true}>
                                    <img src="https://www.svgrepo.com/show/533718/upload.svg" alt="upload icon" style={{width: "40px"}} />
                                </BasicButton>
                                <FileList files={files} />
                            </div>
                            
                        </InputFormFU>
                    </div>
                    <div className='input-forms-right-fu'>
                        <InputFormFU label="Note Description" customClass='note-description-form'>
                            <Form.Control as="textarea" placeholder="Note Description" className='input-field-nd' style={{height: "100%"}} />
                        </InputFormFU>
                    </div>
                </div>

                <div style={{display: "flex", justifyContent: "center", marginTop: "20px"}}>
                    <BasicButton style={{height: "40px", fontSize: "16px", padding: "0 20px"}}>Submit Note</BasicButton>
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

function FileList({ files }) {
    return (
        <div className='file-list' style={{border: "1px solid #ccc", borderRadius: "5px", width: "100%", flex: "1"}}>
            {/* {files.map((file, index) => (
                <div key={index} className='file-item'>
                    {file.name}
                </div>
            ))} */}
            <FileItem file={{ name: "example_note.pdfsadhasghgashdgasdhasgdhasgd" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
            <FileItem file={{ name: "example_note.pdf" }} />
        </div>
    );
}

function FileItem({ file }) {
    return (
        <div className='file-item' style={{flex: "1"}}>
            <div style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "170px"}}>
            {file.name}
            </div>
            <BasicButton className="flex" style={{padding: "0", width: "25px", height: "25px", boxShadow: "none", alignItems: "center", justifyContent: "center"}} danger={true} light={true}>
                <img src="https://www.svgrepo.com/show/310733/delete.svg" alt="delete icon" style={{width: "15px", filter: "invert(23%) sepia(99%) saturate(7492%) hue-rotate(357deg) brightness(97%) contrast(119%)"}} />
            </BasicButton>
        </div>
    );
}