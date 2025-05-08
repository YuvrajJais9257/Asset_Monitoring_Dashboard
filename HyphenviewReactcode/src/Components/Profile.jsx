import React, { useState, useEffect, useRef } from "react";
import Card from "react-bootstrap/Card";
import { Button } from "./globalCSS/Button/Button";
import styles from "./globalCSS/profile.module.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTrash, FaEye } from "react-icons/fa";
import profileManLogo from "../assets/images/profile.png";
import { decryptData } from "../Components/utils/EncriptionStore";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import ImagePreviewModal from "./ImagePreviewModal";
import {
  uploadImages,
  fetchLoginLogo,
  fetchNavIcon,
  fetchPdfLogo,
} from "../actions/logowhitelisting";

// Gradient style for previews
const gradientStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '4px',
  padding: '15px',
  marginBottom: '10px'
};

const Profile = () => {
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const customer_id = user?.customer_id;
  const database_type = user?.database_type;
  const isSuperAdmin = user?.groupname
    ? user.groupname.toString().toLowerCase() === "superadmin"
    : false;

  const history = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    localStorage.removeItem("profile");
    history("/");
  };

  const handleBack = () => {
    history("/Dashboard");
  };

  const { login_logo, nav_icon, pdf_logo } = useSelector(
    (state) => state.logowhitelisting?.images || {}
  );

  useEffect(() => {
    if (login_logo) {
      setLoginLogo(login_logo);
    }
  }, [login_logo]);

  useEffect(() => {
    if (nav_icon) {
      setNavIcon(nav_icon);
    }
  }, [nav_icon]);

  useEffect(() => {
    if (pdf_logo) {
      setPdfLogo(pdf_logo);
    }
  }, [pdf_logo]);

  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [uploadedNavIcon, setUploadedNavIcon] = useState(null);
  const [uploadedPdfLogo, setUploadedPdfLogo] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loginLogo, setLoginLogo] = useState(null);
  const [navIcon, setNavIcon] = useState(null);
  const [pdfLogo, setPdfLogo] = useState(null);

  const [previewLoginLogo, setPreviewLoginLogo] = useState(null);
  const [previewNavIcon, setPreviewNavIcon] = useState(null);
  const [previewPdfLogo, setPreviewPdfLogo] = useState(null);
  
  // Original files before background removal
  const [originalLogo, setOriginalLogo] = useState(null);
  const [originalNavIcon, setOriginalNavIcon] = useState(null);
  const [originalPdfLogo, setOriginalPdfLogo] = useState(null);
  
  // Processing states
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  const [isProcessingNavIcon, setIsProcessingNavIcon] = useState(false);
  const [isProcessingPdfLogo, setIsProcessingPdfLogo] = useState(false);

  // Preview modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewType, setPreviewType] = useState(null);
  const [previewModalData, setPreviewModalData] = useState(null);
  
  // Flag to track if preview image needs refreshing
  const [refreshPreview, setRefreshPreview] = useState(false);

  const handleLogoAndIconUpload = (setState, setPreview, setOriginal) => (event) => {
    const file = event.target.files[0];

    if (file) {
      // Check file size (Max: 1MB)
      if (file.size > 1024 * 1024) {
        toast.error("File size should not exceed 1MB", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      // Create file URL and set original file
      const fileUrl = URL.createObjectURL(file);
      setOriginal(file);
      setPreview(fileUrl);
      
      const img = new Image();
      img.src = fileUrl;
      img.onload = () => {
        setState(file);
        
        // Check image dimensions based on type
        let expectedDimensions = {};
        let imageType = "";
        
        if (setPreview === setPreviewLoginLogo) {
          expectedDimensions = { width: 300, height: 100 };
          imageType = "Login Logo";
        } else if (setPreview === setPreviewNavIcon) {
          expectedDimensions = { width: 50, height: 50 };
          imageType = "Nav Icon";
        } else if (setPreview === setPreviewPdfLogo) {
          expectedDimensions = { width: 300, height: 100 };
          imageType = "PDF Logo";
        }
        
        if (img.width > expectedDimensions.width || img.height > expectedDimensions.height) {
          toast.warning(
            `${imageType} image exceeds recommended dimensions (${expectedDimensions.width}x${expectedDimensions.height}px). Please crop your image or it will be automatically resized.`, 
            {
              position: "top-right",
              autoClose: 5000,
            }
          );
        }
      };
    }
  };

  // Function to clear uploaded image and its preview
  const handleClearImage = (setFile, setPreview, setOriginal) => {
    if (setPreview) {
      const currentPreview = setPreview(null);
      if (currentPreview) URL.revokeObjectURL(currentPreview);
    }
    setFile(null);
    setOriginal(null);
  };

  // Function to open the preview modal
  const openPreviewModal = (type) => {
    let modalData = null;
    
    if (type === 'login_logo') {
      modalData = {
        imageFile: originalLogo || uploadedLogo,
        previewUrl: previewLoginLogo,
        setFile: setUploadedLogo,
        setPreview: setPreviewLoginLogo,
        isProcessing: isProcessingLogo,
        setProcessing: setIsProcessingLogo,
        originalFile: originalLogo,
        dimensions: { width: 300, height: 100, aspect: 3 / 1 }
      };
    } else if (type === 'nav_icon') {
      modalData = {
        imageFile: originalNavIcon || uploadedNavIcon,
        previewUrl: previewNavIcon,
        setFile: setUploadedNavIcon,
        setPreview: setPreviewNavIcon,
        isProcessing: isProcessingNavIcon,
        setProcessing: setIsProcessingNavIcon,
        originalFile: originalNavIcon,
        dimensions: { width: 50, height: 50, aspect: 1 / 1 }
      };
    } else if (type === 'pdf_logo') {
      modalData = {
        imageFile: originalPdfLogo || uploadedPdfLogo,
        previewUrl: previewPdfLogo,
        setFile: setUploadedPdfLogo,
        setPreview: setPreviewPdfLogo,
        isProcessing: isProcessingPdfLogo,
        setProcessing: setIsProcessingPdfLogo,
        originalFile: originalPdfLogo,
        dimensions: { width: 300, height: 100, aspect: 3 / 1 }
      };
    }
    
    if (modalData && modalData.imageFile) {
      setPreviewType(type);
      setPreviewModalData(modalData);
      setShowPreviewModal(true);
    } else {
      toast.error("Please upload an image first", {
        position: "top-right",
        autoClose: 2000,
      });
    }
  };

  // Effect to handle modal closing and refreshing previews
  useEffect(() => {
    if (!showPreviewModal && previewModalData) {
      // Set refresh flag when modal closes
      setRefreshPreview(true);
    }
  }, [showPreviewModal]);

  // Effect to refresh previews after modal operations
  useEffect(() => {
    if (refreshPreview && !showPreviewModal) {
      // Refresh the appropriate preview based on type
      if (previewType === 'login_logo' && uploadedLogo) {
        // If the preview URL is not updated by the modal, re-create it
        if (!previewLoginLogo) {
          setPreviewLoginLogo(URL.createObjectURL(uploadedLogo));
        }
      } else if (previewType === 'nav_icon' && uploadedNavIcon) {
        if (!previewNavIcon) {
          setPreviewNavIcon(URL.createObjectURL(uploadedNavIcon));
        }
      } else if (previewType === 'pdf_logo' && uploadedPdfLogo) {
        if (!previewPdfLogo) {
          setPreviewPdfLogo(URL.createObjectURL(uploadedPdfLogo));
        }
      }
      
      setRefreshPreview(false);
    }
  }, [refreshPreview, previewType, uploadedLogo, uploadedNavIcon, uploadedPdfLogo, 
      previewLoginLogo, previewNavIcon, previewPdfLogo, showPreviewModal]);

  const handleSaveAssets = async () => {
    if (!uploadedLogo && !uploadedNavIcon && !uploadedPdfLogo) {
      alert("Please upload at least one image.");
      return;
    }

    const formData = new FormData();
    formData.append("customer_id", customer_id);
    formData.append("database_type",database_type)
    
    if (uploadedLogo) formData.append("login_logo", uploadedLogo);
    if (uploadedNavIcon) formData.append("nav_icon", uploadedNavIcon);
    if (uploadedPdfLogo) formData.append("pdf_logo", uploadedPdfLogo);

    try {
      await dispatch(uploadImages(formData));
          
      // Fetch updated images
      dispatch(fetchLoginLogo(customer_id));
      dispatch(fetchNavIcon(customer_id));
      dispatch(fetchPdfLogo(customer_id));
      
      toast.success("Branding assets saved successfully", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Error saving assets:", error);
      toast.error("Failed to save branding assets", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      if (previewLoginLogo) URL.revokeObjectURL(previewLoginLogo);
      if (previewNavIcon) URL.revokeObjectURL(previewNavIcon);
      if (previewPdfLogo) URL.revokeObjectURL(previewPdfLogo);
    };
  }, []);

  const handleNavigateReset = () => {
    history(`/ResetPassword?user_email_id=${user?.user_email_id}&updateemail_pass=profile`);
  };
  

  return (
    <div className={styles.profileContainer}>
      {/* Preview Modal */}
      {showPreviewModal && previewModalData && (
        <ImagePreviewModal 
          show={showPreviewModal}
          onHide={() => setShowPreviewModal(false)}
          imageType={previewType}
          imageData={previewModalData}
        />
      )}

      <div className={styles.topButtons}>
        <div className={styles.backIconContainer} onClick={handleBack}>
          <FaArrowLeft className={styles.backIcon} />
        </div>
        <Button variant="dark" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className={styles.profileContent}>
        <Card className={styles.avatarCard}>
          <div className={styles.avatarContainer}>
            <img
              src={profileManLogo}
              alt="User Avatar"
              className={styles.avatar}
            />
          </div>
          <Card.Body className={styles.userInfo}>
            <h3 className={styles.userName}>{user?.groupname}</h3>
            <p className={styles.userEmail}>{user?.user_email_id}</p>
            <Button variant="dark" onClick={handleNavigateReset}>Reset Password</Button>
          </Card.Body>
        </Card>

        {isSuperAdmin && (
          <>
            <Card className={styles.uploadCard}>
              <h4>Upload Branding Assets</h4>
              <div className={styles.uploadSection}>
                <label>Login Page Logo (Max: 1MB, 300x100px)</label>
                <input
                  className="form-control"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleLogoAndIconUpload(
                    setUploadedLogo, 
                    setPreviewLoginLogo,
                    setOriginalLogo
                  )}
                />
                {previewLoginLogo && (
                  <div className={styles.previewContainer}>
                    <div style={gradientStyle}>
                      <img
                        key={`login-preview-${previewLoginLogo}`}
                        src={previewLoginLogo}
                        alt="Login Logo Preview"
                        className={styles.profilePageImage}
                      />
                    </div>
                    <div className={styles.previewControls}>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className={styles.actionButton}
                        onClick={() => openPreviewModal('login_logo')}
                      >
                        <FaEye /> Preview & Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className={styles.actionButton}
                        onClick={() => handleClearImage(
                          setUploadedLogo, 
                          setPreviewLoginLogo,
                          setOriginalLogo
                        )}
                      >
                        <FaTrash /> Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.uploadSection}>
                <label>Dashboard Nav Icon (Max: 1MB, 50x50px)</label>
                <input
                  className="form-control"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleLogoAndIconUpload(
                    setUploadedNavIcon, 
                    setPreviewNavIcon,
                    setOriginalNavIcon
                  )}
                />
                {previewNavIcon && (
                  <div className={styles.previewContainer}>
                    <div style={gradientStyle}>
                      <img
                        key={`nav-preview-${previewNavIcon}`}
                        src={previewNavIcon}
                        alt="Nav Icon Preview"
                        className={styles.profilePageImage}
                      />
                    </div>
                    <div className={styles.previewControls}>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className={styles.actionButton}
                        onClick={() => openPreviewModal('nav_icon')}
                      >
                        <FaEye /> Preview & Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className={styles.actionButton}
                        onClick={() => handleClearImage(
                          setUploadedNavIcon, 
                          setPreviewNavIcon,
                          setOriginalNavIcon
                        )}
                      >
                        <FaTrash /> Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.uploadSection}>
                <label>PDF Logo (Max: 1MB, 300x100px)</label>
                <input
                  className="form-control"
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleLogoAndIconUpload(
                    setUploadedPdfLogo, 
                    setPreviewPdfLogo,
                    setOriginalPdfLogo
                  )}
                />
                {previewPdfLogo && (
                  <div className={styles.previewContainer}>
                    <div style={gradientStyle}>
                      <img
                        key={`pdf-preview-${previewPdfLogo}`}
                        src={previewPdfLogo}
                        alt="PDF Logo Preview"
                        className={styles.profilePageImage}
                      />
                    </div>
                    <div className={styles.previewControls}>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className={styles.actionButton}
                        onClick={() => openPreviewModal('pdf_logo')}
                      >
                        <FaEye /> Preview & Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        className={styles.actionButton}
                        onClick={() => handleClearImage(
                          setUploadedPdfLogo, 
                          setPreviewPdfLogo,
                          setOriginalPdfLogo
                        )}
                      >
                        <FaTrash /> Clear
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.profileButtonContainer}>
                <Button
                  variant="primary"
                  className={styles.profilePagesaveButton}
                  onClick={handleSaveAssets}
                >
                  Save Branding Assets
                </Button>
              </div>
              {message && (
                <p
                  className={`${styles.successMessage} ${
                    messageType === "error" ? styles.errorMessage : ""
                  }`}
                >
                  {message}
                </p>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;