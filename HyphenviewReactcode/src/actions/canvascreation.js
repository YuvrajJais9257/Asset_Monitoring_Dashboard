import { LOADED, LOADING, CREATE_CANVAS_PAGE, CANVAS_FRAME_PAGE_DATA, LIST_DASHBOARD_CANVAS_FRAME_NAME_WITH, UPDATE_CANVAS_FRAME_PAGE_DATA, DELETE_CANVAS_FRAME, CHECK_DASHBOARD_CANVAS_FRAME, LIST_DASHBOARD_CANVAS_FRAME_NAME, UPDATE_DASHBOARD_ACCESS, LIST_DASHBOARD_CANVAS_FRAME_ACCESS, GET_FRAME_PAGE_DATA_BASE_ON_ID, INITIAL_CHECK_DASHBOARD_CANVAS_FRAME, MESSAGE_CREATE_CANVAS_PAGE, UPDATE_CANVAS_FRAME_PAGE_DATA_MESSAGE } from "../constants/actionTypes";
import * as api from '../api/index.js';
import { toast } from 'react-toastify';
import logMessage from "../logserver.js";
import { decryptData } from "../Components/utils/EncriptionStore";

const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
})();

export const savecanvasframedata = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.savecanvasframedata(formData);
        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            dispatch({ type: CREATE_CANVAS_PAGE, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Frame Save Successfully");
            localStorage.removeItem("finalfream");
        } else if (data?.statusCode === 400) {
            toast.success(data?.message || "Dashboard frame data notsave", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Frame Save Successfully");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Frame Save Successfully");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const deletecanvashframe = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.deletecanvashframe(formData);
        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            dispatch({ type: DELETE_CANVAS_FRAME, formData });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Details Fetch Successfully");
            toast.success(data?.message || "Dashboard delete successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        } else {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Details Fetch Successfully");
            toast.error(data?.message || "Try again there is some issue with server", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const listofaccessmask = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.listofaccessmask(formData);
        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            dispatch({ type: LIST_DASHBOARD_CANVAS_FRAME_ACCESS, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Details Fetch Successfully");
        }else if(data?.statusCode===400||data.statusCode===404){
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "list of accessmask not geting");
        } else {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "List of accessmask not geting");
            toast.success("list of accessmask not geting", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const canvashframedataformodification = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.canvashframedataformodification(formData);
        console.log(data,"data")
        
        dispatch({ type: CANVAS_FRAME_PAGE_DATA, data });
        dispatch({ type: LOADED });
        // if (data?.status==='success') {
        //     alert(data?.message);
        // }else {
        //     alert("User is not valid");
        // }
    } catch (error) {
        console.log(error.message);
    }
}

export const getreportframedatabygroupid = (formData, router) => async (dispatch) => {
    
    dispatch({ type: LOADING });
    try {
        const { data } = await api.getreportframedatabygroupid(formData);
        if(data?.statusCode===200){
            dispatch({ type: GET_FRAME_PAGE_DATA_BASE_ON_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Frame Fetch Successfully");
            dispatch({ type: LOADED });
        }else if(data?.statusCode===400 || data?.statusCode===404){
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Not able to fetch dashboard farme");
        }else {
             logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Not able to fetch dashboard farme");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const listofdashboardframename = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.listofdashboardframename(formData);
        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            dispatch({ type: LIST_DASHBOARD_CANVAS_FRAME_NAME, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Dashboard Details Fetch Successfully");
        } else {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Unable to get the list of dashboard name");
            toast.success("Unable to get the list of dashboard name", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const listofdashboardframenamewithdistiinct = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.listofdashboardframenamewithdistiinct(formData);

        dispatch({ type: LOADED });
        if (data?.status === 'success') {
            dispatch({ type: LIST_DASHBOARD_CANVAS_FRAME_NAME_WITH, data });
        } else {
            toast.success("Unable to get the list of dashboard name", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const checkdashboardcanvasname = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.checkdashboardcanvasname(formData);
        dispatch({ type: LOADED });
        if (data?.statusCode === 404) {
            dispatch({ type: CHECK_DASHBOARD_CANVAS_FRAME, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "ITSM Dashboardhhhh not found");
            toast.success(data?.message || "canvas name validated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        } else if (data?.statusCode === 200) {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Frame exist with name ITSM Dashboard");
            toast.success(data?.message || "canvas name validated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
        else {
            toast.success(data?.message || "canvas name validated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const updatecanvashframedataformodification = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.updatecanvashframedataformodification(formData);


        dispatch({ type: LOADED });
        if (data?.statusCode === 200) {
            toast.success(data?.message || "canvas frame updated successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            dispatch({ type: UPDATE_CANVAS_FRAME_PAGE_DATA, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "JsonFrame Updated Successfully!");
        } else {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Unable to update canvas!");
            toast.success("Unable to update canvas", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const updateaccessofdashboard = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.updateaccessofdashboard(formData);
        dispatch({ type: LOADED });
        if (data?.status === 'success') {
            toast.success(data?.message || "Dashboard access is updated successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            dispatch({ type: UPDATE_DASHBOARD_ACCESS, formData });
        } else {
            toast.success(data?.message || "Somthing went wrong!", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const initialcheckdashboardcanvasname = () => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        dispatch({ type: INITIAL_CHECK_DASHBOARD_CANVAS_FRAME, });
    } catch (error) {
        console.log(error.message);
    }
}

export const savecanvasframedatamessage = () => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        dispatch({ type: MESSAGE_CREATE_CANVAS_PAGE, });
    } catch (error) {
        console.log(error.message);
    }
}

export const updatecanvashframedataformodificationmessage = () => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        dispatch({ type: UPDATE_CANVAS_FRAME_PAGE_DATA_MESSAGE, });
    } catch (error) {
        console.log(error.message);
    }
}