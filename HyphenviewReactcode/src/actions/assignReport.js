import { LOADED, LOADING, ASSIGN_GROUP_ID_TO_REPORT, GET_REPORT_DETAIL_BASEON_GROUP_ID,GET_REPORT_DETAIL_BASEON_GROUP_ID_REPORTS } from "../constants/actionTypes";
import * as api from '../api/index.js';
import logMessage from "../logserver.js";
import { toast } from 'react-toastify';
import { decryptData } from "../Components/utils/EncriptionStore";

const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
})();

export const assignreporttothegroup = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const {data} = await api.assignreporttothegroup(formData);
        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: ASSIGN_GROUP_ID_TO_REPORT, data });
            toast.success(data?.data || "Report assign successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.data || "Report assign successfully");
        } else{
            toast.success(data?.data || "Somthing wrong Report not assign!", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.data || "Report not assign!");
        }
    } catch (error) {
        console.log(error.message);
    }
}
export const getReportDetailonbasisOFgroupid= (formData, router) => async (dispatch) => {
    dispatch({type: LOADING});
    try {
        const {data} = await api.getReportDetailonbasisOFgroupid(formData);
        dispatch({type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_REPORT_DETAIL_BASEON_GROUP_ID, data });
            logMessage(user?.user_email_id,data?.StatusCode,data?.message||"Report Details Fetched");
        }else if(data?.StatusCode === 404 || data?.StatusCode === 400) {
            logMessage(user?.user_email_id,data?.StatusCode,data?.message||"Report Details Not Fetched");
        }else{
            logMessage(user?.user_email_id,data?.StatusCode,data?.message||"Report Details Not Fetched");
        }
    }catch (error) {
        console.log(error.message);
      }
}

