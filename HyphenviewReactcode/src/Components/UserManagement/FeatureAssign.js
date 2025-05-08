import { Button } from './../globalCSS/Button/Button';
import { useState } from "react";
import './../globalCSS/usermanagement/assignfeature.css';
import { uploadicon } from '../../actions/auth';
import { useDispatch } from 'react-redux';
import Header from '../header';
import { toast } from 'react-toastify';
import { decryptData } from '../utils/EncriptionStore';

function FeatureAssign() {
    const [selectedFile, setSelectedFile] = useState({});
    const [featurename, setFeatureName] = useState('');
    const dispatch = useDispatch();
    const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
    })();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        if (file && file.type === "image/png" && file.size <= 1048576) { 
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
            toast.success("Please select a PNG file with a maximum size of 1 MB.", {position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light"});
        }
    };
    
    const handleNameChange = (e) => {
        const checkFeature = user.features.some(item => item.featurename === e.target.value);    
        if (checkFeature) {
            toast.success("Please write down another feature name.", {position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light"});
        } else {
            setFeatureName(e.target.value);
        }
    };
    
    const handleUpload = (e) => {
        e.preventDefault();
        
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('feature_name', featurename);
            formData.append('customer_id', user.customer_id);
            formData.append('database_type', "mysql");

            dispatch(uploadicon(formData));
        } else {
            toast.success("Please select a PNG file with a maximum size of 1 MB.", {position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light"});
        }
    };

    return (
        <div>
            <div className=""><Header /></div>

            <div className="form-wrapper">
                <form onSubmit={handleUpload} className="form-container">
                    <h2>Add New Feature</h2>

                    <label htmlFor="fname">Feature Name:</label>
                    <input
                        className="feature-name"
                        type="text"
                        id="fname"
                        name="firstname"
                        value={featurename}
                        onChange={handleNameChange}
                        placeholder="Your name.."
                    />

                    <label htmlFor="formFile">Feature Icon:</label>
                    <input
                    className="choose-file"
                        name="file"
                        type="file"
                        accept="image/png"
                        onChange={handleFileChange}
                    />

                    <p className="note">
                        Note: Ensure that only PNG files can be uploaded and that the maximum file size is not more than 1MB.
                    </p>

                    <div className="button-group">
                        <Button className="feature-assign-save" type="submit">Save</Button>
                        <Button className="feature-assign-back" type="button" onClick={() => window.history.back()}>Back</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default FeatureAssign;
