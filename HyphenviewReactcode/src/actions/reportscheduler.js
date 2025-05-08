import { LIST_OF_SCHEDULE_REPORT, LOADED, LOADING, SAVE_SCHEDULE_REPORT, DETAIL_SCHEDULE_REPORT_FOR_UPDATE, UPDATE_SCHEDULER, REMOVE_SCHEDULER } from "../constants/actionTypes";
import * as api from '../api/index.js';
import { toast } from 'react-toastify';
import logMessage from "../logserver.js";
import { decryptData } from "../Components/utils/EncriptionStore";

const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
})();

export const savenewSchedulereport = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.savenewSchedulereport(formData);
        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            dispatch({ type: SAVE_SCHEDULE_REPORT, data });
            toast.success(data?.message || "Reports schedule successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Reports schedule successfully");
            router("/ReportSchedulerList", { state: { message: data.message } })
        } else {
            toast.error(data?.message || "Somthing went wrong !", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Somthing went wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const listofSchedulereport = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.listofSchedulereport(formData);

        if (data?.statusCode === 200) {
            dispatch({ type: LIST_OF_SCHEDULE_REPORT, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "User List Fetch Successfully");
            dispatch({ type: LOADED });
        } else if(data?.statusCode === 400 || data?.statusCode === 404){
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "User List Fetch Successfully");
        }else{
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "User List Fetch Successfully");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getschedulereportdetailforupdate = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.getschedulereportdetailforupdate(formData);

        if(data?.statusCode===200){
            dispatch({ type: DETAIL_SCHEDULE_REPORT_FOR_UPDATE, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Schedule Details Fetch Successfully");
        }else{
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "somthing went wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const updatescheduleinfo = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.updatescheduleinfo(formData);

        dispatch({ type: UPDATE_SCHEDULER, data });
        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            toast.success(data?.message || "Schedule info is updated successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            router("/ReportSchedulerList", { state: { message: data.message } })
        } else {
            toast.error(data?.message || "Schedule info is not updated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const removeschedulereport = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.removeschedulereport(formData);

        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            dispatch({ type: REMOVE_SCHEDULER, formData });
            toast.success(data?.message || "Scheduler Deleted Successfully!", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Scheduler Deleted Successfully!");
        } else {
            toast.error(data?.message || "somthing went wrong", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "somthing went wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}