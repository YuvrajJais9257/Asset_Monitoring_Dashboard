/*created by yuvraj jaiswal 12 feb 2025 action creators to dow hite listing and reset password purposes */
import {
  UPLOAD_IMAGES,
  FETCH_NAV_ICON,
  FETCH_LOGIN_LOGO,
  FETCH_PDF_LOGO,
} from "../constants/actionTypes";
import * as api from "../api/index.js";
import {toast } from 'react-toastify';
export const uploadImages = (formData) => async (dispatch) => {
  const toastId = toast.info("Uploading images, please wait...", {
    position: "top-right",
    autoClose:5000,
    closeOnClick: false,
    draggable: false,
  });
  dispatch({ type: UPLOAD_IMAGES, payload: { uploading: true } });
  try {
    const response = await api.uploadImages(formData);
    toast.dismiss(toastId);
    dispatch({
      type: UPLOAD_IMAGES,
      payload: {
        uploading: false,
        message: response?.data?.message,
        error: null,
      },
    });
    toast.success(response?.data?.message || "Images uploaded successfully!", {
      position: "top-right",
      color: "green",
      autoClose: 5000,
    });
  } catch (error) {
    dispatch({
      type: UPLOAD_IMAGES,
      payload: { uploading: false, message: null, error: error.message },
    });
    toast.error(error.message || "Failed to upload images!", {
      position: "top-right",
      autoClose: 5000,
    });
  }
};

const fetchImage = (apiCall, type) => async (dispatch) => {
  try {
    const response = await apiCall;
    // Convert Base64 to Blob
    const base64Data = response?.data.image; // API should return base64 encoded string
    const contentType = response?.headers["content-type"] || "image/png"; // Default to PNG if missing
 
    if (!base64Data) throw new Error("Invalid Base64 response");
 
    // Convert Base64 to Blob URL
    const byteCharacters = atob(base64Data); // Decode Base64
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
 
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    const objectURL = URL.createObjectURL(blob);
 
    // Dispatch with Object URL
    dispatch({ type, payload: objectURL });
  } catch (error) {
    console.error("Error fetching image:", error);
    dispatch({ type, payload: null });
  }
};

export const fetchNavIcon = (customerId) => async (dispatch) => {
  return fetchImage(api.fetchNavIcon(customerId), FETCH_NAV_ICON)(dispatch);
};
export const fetchLoginLogo = (customerId) => async (dispatch) => {
  return fetchImage(api.fetchLoginLogo(customerId), FETCH_LOGIN_LOGO)(dispatch);
};
export const fetchPdfLogo = (customerId) => async (dispatch) => {
  return fetchImage(api.fetchPDFLogo(customerId), FETCH_PDF_LOGO)(dispatch);
};
