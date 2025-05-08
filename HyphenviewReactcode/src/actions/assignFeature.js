import { ASSIGN_REPORT_ID_TO_FEATURE,LOADED,LOADING,LIST_ASSIGN_GROUP_ID_TO_FEATURE} from "../constants/actionTypes";
import * as api from '../api/index.js';
import logMessage from "../logserver.js";
import {toast } from 'react-toastify';

import { decryptData } from "../Components/utils/EncriptionStore";

const user = (() => {
  const encryptedData = localStorage.getItem("profile");
  return encryptedData ? decryptData(encryptedData) : null;
})();

export const  assignfeaturetothegroup= (formData, router) => async (dispatch) => {
    dispatch({type: LOADING});
    try {
        const {data} = await api.assignfeaturetothegroup(formData);
        dispatch({type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: ASSIGN_REPORT_ID_TO_FEATURE, data });
            toast.success(data?.data || "Features Updated Successfully!", {position: "top-right",autoClose: 5000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "Features Updated Successfully!");
        }else{
            toast.success(data?.data || "Somthing Wrong Features Not Updated!", {position: "top-right",autoClose: 5000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "Somthing Wrong Features Not Updated!");
        }
    }catch (error) {
        console.log(error.message);
      }
}

export const  getfeatureaccessmask= (formData, router) => async (dispatch) => {
    dispatch({type: LOADING});
    try {
        const {data} = await api.getfeatureaccessmask(formData);
        dispatch({type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: LIST_ASSIGN_GROUP_ID_TO_FEATURE, data });
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "Fetching Access Succfully");
        }else if(data?.StatusCode === 204 ||data?.StatusCode === 400 || data?.StatusCode === 404 ) {
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "Not Able to Fetch Access");
        }else{
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "Not Able to Fetch Access");
        }
    }catch (error) {
        console.log(error.message);
      }
}