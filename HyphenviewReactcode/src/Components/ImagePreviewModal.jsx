import React, { useState, useRef, useEffect } from "react";
import Modal from "react-bootstrap/Modal";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import { Button } from "./globalCSS/Button/Button";
import { FaMagic, FaCrop } from "react-icons/fa";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from "./globalCSS/profile.module.css";
import { toast } from "react-toastify";

const ImagePreviewModal = ({ show, onHide, imageType, imageData }) => {
  // Extract data from props
  const {
    imageFile,
    previewUrl,
    setFile,
    setPreview,
    isProcessing,
    setProcessing,
    originalFile,
    dimensions
  } = imageData;

  // Tab state
  const [activeTab, setActiveTab] = useState('background');

  // Refs
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);

  // Crop states
  const [crop, setCrop] = useState({
    unit: 'px',
    width: dimensions.width,
    height: dimensions.height,
    x: 0,
    y: 0
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);

  // Background removal states
  const [processedImageUrl, setProcessedImageUrl] = useState(null);

  useEffect(() => {
    return () => {
      // Clean up URLs when component unmounts
      if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
    };
  }, [croppedImageUrl, processedImageUrl]);

  // Function to perform cropping
  const completeCrop = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    
    const ctx = canvas.getContext('2d');
    
    // Draw the cropped image
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
    
    // Convert canvas to blob
    const croppedBlob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    // Create a file from the blob
    const originalFileName = imageFile.name;
    const croppedFile = new File([croppedBlob], originalFileName, {
      type: 'image/png',
    });
    
    // Create and set preview URL
    if (croppedImageUrl) URL.revokeObjectURL(croppedImageUrl);
    const newUrl = URL.createObjectURL(croppedBlob);
    setCroppedImageUrl(newUrl);
  };

  // Function to apply the cropped image
  const applyCroppedImage = () => {
    if (!croppedImageUrl) return;
    
    // Convert URL to File object
    fetch(croppedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], imageFile.name, { type: 'image/png' });
        
        // Create a new URL for the parent component
        const newPreviewUrl = URL.createObjectURL(blob);
        
        // Update file and preview in parent component
        setFile(file);
        setPreview(newPreviewUrl);
        
        toast.success("Image cropped successfully", {
          position: "top-right",
          autoClose: 2000,
        });
        
        // Close modal
        onHide();
      });
  };

  // Function to remove background
  const removeBackground = async () => {
    if (!imageFile) return;
    
    setProcessing(true);
    
    try {
      // Create URL for the image
      const imageUrl = URL.createObjectURL(imageFile);
      
      // Load the image
      const img = new Image();
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Set up canvas with image dimensions
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      // Draw the image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Simple background removal (assuming background is mostly in corners)
      // Get color from corners (assuming they're background)
      const corners = [
        { x: 0, y: 0 },
        { x: canvas.width - 1, y: 0 },
        { x: 0, y: canvas.height - 1 },
        { x: canvas.width - 1, y: canvas.height - 1 }
      ];
      
      // Collect background colors from corners
      const bgColors = corners.map(corner => {
        const idx = (corner.y * canvas.width + corner.x) * 4;
        return [data[idx], data[idx + 1], data[idx + 2]];
      });
      
      // Calculate average background color
      const avgBgColor = [0, 0, 0].map((_, i) => 
        Math.round(bgColors.reduce((sum, color) => sum + color[i], 0) / bgColors.length)
      );
      
      // Color similarity threshold
      const threshold = 30;
      
      // Process each pixel
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate color distance from background
        const distance = Math.sqrt(
          Math.pow(r - avgBgColor[0], 2) +
          Math.pow(g - avgBgColor[1], 2) +
          Math.pow(b - avgBgColor[2], 2)
        );
        
        // If close to background color, make transparent
        if (distance < threshold) {
          data[i + 3] = 0; // Set alpha to 0 (transparent)
        }
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert canvas to blob
      const processedBlob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/png');
      });
      
      // Create preview URL
      if (processedImageUrl) URL.revokeObjectURL(processedImageUrl);
      const newUrl = URL.createObjectURL(processedBlob);
      setProcessedImageUrl(newUrl);
      
    } catch (error) {
      console.error("Error removing background:", error);
      toast.error("Failed to remove background", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setProcessing(false);
    }
  };

  // Function to apply the processed image
  const applyProcessedImage = () => {
    if (!processedImageUrl) return;
    
    // Convert URL to File object
    fetch(processedImageUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File(
          [blob], 
          imageFile.name.replace(/\.[^/.]+$/, "") + "_nobg.png", 
          { type: 'image/png' }
        );
        
        // Create a new URL for the parent component
        const newPreviewUrl = URL.createObjectURL(blob);
        
        // Update file and preview in parent component
        setFile(file);
        setPreview(newPreviewUrl);
        
        toast.success("Background removed successfully", {
          position: "top-right",
          autoClose: 2000,
        });
        
        // Close modal
        onHide();
      });
  };

  // Function to restore original image
  const restoreOriginal = () => {
    if (!originalFile) return;
    
    // Create a new URL for the parent component
    const newUrl = URL.createObjectURL(originalFile);
    setPreview(newUrl);
    setFile(originalFile);
    
    toast.info("Restored original image", {
      position: "top-right",
      autoClose: 2000,
    });
    
    onHide();
  };

  // Get image type name for display
  const getImageTypeName = () => {
    switch (imageType) {
      case 'login_logo': return 'Login Logo';
      case 'nav_icon': return 'Nav Icon';
      case 'pdf_logo': return 'PDF Logo';
      default: return 'Image';
    }
  };

  // Fixed gradient style
  const gradientStyle = {
    background: 'linear-gradient(135deg, #2f0573, #5d0fdd)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: '4px',
    padding: '20px',
    minHeight: '150px'
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className={styles.previewModal}
    >
      <Modal.Header closeButton>
        <Modal.Title>Edit {getImageTypeName()}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <canvas ref={previewCanvasRef} style={{ display: 'none' }} />
        
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className={styles.editTabs}
        >
          <Tab eventKey="background" title="Background Removal">
            <div className={styles.tabContent}>
              <div className={styles.imagePreviewPane}>
                <div className={styles.originalImageContainer}>
                  <h5>Original Image</h5>
                  <div style={gradientStyle}>
                    <img 
                      src={previewUrl} 
                      alt="Original" 
                      className={styles.previewImage}
                    />
                  </div>
                </div>
                <div className={styles.processedImageContainer}>
                  <h5>Processed Image</h5>
                  {processedImageUrl ? (
                    <div style={gradientStyle}>
                      <img 
                        src={processedImageUrl} 
                        alt="Processed" 
                        className={styles.previewImage}
                      />
                    </div>
                  ) : (
                    <div className={styles.placeholderContainer}>
                      <p>Click "Remove Background" to preview</p>
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.controlsContainer}>
                <Button 
                  variant="primary" 
                  onClick={removeBackground}
                  disabled={isProcessing}
                  className={styles.controlButton}
                >
                  <FaMagic /> {isProcessing ? "Processing..." : "Remove Background"}
                </Button>
                <Button 
                  variant="success" 
                  onClick={applyProcessedImage}
                  disabled={!processedImageUrl || isProcessing}
                  className={styles.controlButton}
                >
                  Apply
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={restoreOriginal}
                  disabled={!originalFile || !processedImageUrl}
                  className={styles.controlButton}
                >
                  Restore Original
                </Button>
              </div>
            </div>
          </Tab>
          
          <Tab eventKey="crop" title="Crop">
            <div className={styles.tabContent}>
              <div className={styles.cropContainer}>
                <div className={styles.cropperWrapper}>
                  <h5>Adjust Crop ({dimensions.width}x{dimensions.height}px)</h5>
                  <ReactCrop
                    src={previewUrl}
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={dimensions.aspect}
                    className={styles.reactCropContainer}
                  >
                    <img
                      ref={imgRef}
                      src={previewUrl}
                      alt="Crop"
                      className={styles.cropImage}
                    />
                  </ReactCrop>
                </div>
                
                <div className={styles.cropPreviewContainer}>
                  <h5>Preview</h5>
                  {croppedImageUrl ? (
                    <div style={gradientStyle}>
                      <img 
                        src={croppedImageUrl} 
                        alt="Cropped Preview" 
                        className={styles.croppedPreview}
                      />
                    </div>
                  ) : (
                    <div className={styles.placeholderContainer}>
                      <p>Click "Preview Crop" to see result</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.controlsContainer}>
                <Button 
                  variant="primary" 
                  onClick={completeCrop}
                  className={styles.controlButton}
                >
                  <FaCrop /> Preview Crop
                </Button>
                <Button 
                  variant="success" 
                  onClick={applyCroppedImage}
                  disabled={!croppedImageUrl}
                  className={styles.controlButton}
                >
                  Apply Crop
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={restoreOriginal}
                  disabled={!originalFile}
                  className={styles.controlButton}
                >
                  Restore Original
                </Button>
              </div>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ImagePreviewModal;