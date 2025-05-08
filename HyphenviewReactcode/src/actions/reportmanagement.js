import {
    GET_REPORT_ON_DASHBOARD, REMOVE_REPORT, UPDATE_REPORT, GENERATE_REPORT_BY_ID, LOADED, LOADING, GET_REPORT_DETAIL_BY_ID, GET_REPORTS_ACCESS_GROUP_ID, GET_REPORT_ACCESS_DETAIL,
    GET_CHART_REPORT_DETAIL_BY_ID, GET_BOX_REPORT_DETAIL_BY_ID, GET_LIST_OF_COLUMN_FIRST, GET_LIST_OF_COLUMN_SECOND, REMOVE_LIST_OF_COLUMN_FIRST, REMOVE_LIST_OF_COLUMN_SECOND,
    SAVE_MAP_DATA_FOR_DRILLDOWN, GET_DRILL_DOWN_DATA, INITIAL_GET_DRILL_DOWN_DATA, CHECK_DRILL_DOWN, DEFAULT_CHECK_DRILL_DOWN, CHAT_BOT_TEXT_TO_QUERY, CHAT_BOT_TEXT_TO_QUERY_RESET,
    UPDATE_MAP_DATA_FOR_DRILLDOWN, DEFAULT_GET_DRILLDOWN_FOR_UPDATE, GET_DRILLDOWN_FOR_UPDATE, ADD_UPDATE_GET_REPORT_ON_DASHBOARD, UPDATE_GET_REPORT_ON_DASHBOARD, GET_CHART_REPORT_DETAIL_BY_ID_BEFORE,
    EXPORT_EXCEL_REPORT, EXPORT_PDF_REPORT, DEFAULT_EXPORT_CSV_REPORT, GET_DRILL_DOWN_DATA_VALUE, FILTER_DATA_REPORT_BY_ID_DRILL, EXPORT_CSV_REPORT, FILTER_DATA_REPORT_BY_ID, GET_COLUMN_DRILL_DOWN_DATA
} from "../constants/actionTypes";
import * as api from '../api/index.js';
import logMessage from "../logserver.js";
import { toast } from 'react-toastify';
import ShowAlert from './ShowAlert.js';
import { decryptData } from "../Components/utils/EncriptionStore";

const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
})();



export const getreporttitlefromondashbaord = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const {data} = await api.getreporttitlefromondashbaord(formData);
        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_REPORT_ON_DASHBOARD, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Report Details Fetch Successfully");
        } else if (data?.StatusCode === 204 || data?.StatusCode === 400 || data?.StatusCode === 404) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Report Details Not Fetch ");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Report Details Not Fetch "); 
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getreportdetailwithaccessforassignreport = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const {data} = await api.getreportdetailwithaccessforassignreport(formData);
        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_REPORT_ACCESS_DETAIL, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Fetched");
        } else if (data?.StatusCode === 404 || data?.StatusCode === 400) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Fetched");
        }else {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Fetched");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const checkdrilldown = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });

    try {
        const {data} = await api.checkdrilldown(formData);
        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: CHECK_DRILL_DOWN, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        } else if (data?.StatusCode === 404) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const defaultcheckdrilldown = () => async (dispatch) => {
    try {
        dispatch({ type: DEFAULT_CHECK_DRILL_DOWN, });
        dispatch({ type: LOADED });
    } catch (error) {
        console.log(error.message);
    }
}


export const getdataforDrilldown = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.getdataforDrilldown(formData);
        if (data?.StatusCode===200) {
           dispatch({ type: GET_DRILL_DOWN_DATA, data });
           logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Fetched");
        }else {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Not Fetched");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getdatacolumnforDrilldown = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.getdatacolumnforDrilldown(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_COLUMN_DRILL_DOWN_DATA, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Fetched");
        }else if(data?.StatusCode === 404){
            const dataval = await data?.data
            dispatch({ type: GET_COLUMN_DRILL_DOWN_DATA, dataval });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Data Not Found");
            dispatch({ type: LOADED });
        } else {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Data Not Found");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getdataforDrilldownval = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const { data } = await api.getdataforDrilldownval(formData);
        if (data?.StatusCode===200) {
            dispatch({ type: GET_DRILL_DOWN_DATA_VALUE, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Fetched");
         }else {
             logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details Not Fetched");
         }
    } catch (error) {
        console.log(error.message);
    }
}

export const drilldowninsitialvalue = () => async (dispatch) => {
    dispatch({ type: INITIAL_GET_DRILL_DOWN_DATA, });
}

export const getReportDetailByID = (formData, router) => async (dispatch) => {
    dispatch({ type: LOADING });
    try {
        const {data} = await api.getReportDetailByID(formData);
        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_REPORT_DETAIL_BY_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message);
        } else if (data?.StatusCode === 404) {
            dispatch({ type: GET_REPORT_DETAIL_BY_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message);
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const removereportaftercheck = (formData, router) => async (dispatch) => {

    try {
        const {data} = await api.removereportaftercheck(formData);

        if (data?.StatusCode === 200) {
            dispatch({ type: REMOVE_REPORT, formData });
            logMessage(user?.user_email_id, data?.StatusCode, data?.data);
        } else if (data?.status === 204) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.data);
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.data);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const removereport = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.removereport(formData);

        if (data?.StatusCode === 200 && data?.data?.Reports.length > 0) {
            const userConfirmed = await ShowAlert({
                title: "Confirmation",
                message: `This drilldown report is mapped with the master report ${data?.data?.Reports[0]}. Still do you want to continue delete?`,
                options: ["OK", "Cancel"]
            });
            if (userConfirmed === "OK") {
                dispatch(removereportaftercheck(formData, router));
            }
            logMessage(user?.user_email_id, data?.StatusCode, data?.data?.message);
        } else if (data?.StatusCode === 200 && data?.data?.Reports.length === 0) {
            dispatch(removereportaftercheck(formData, router));
            logMessage(user?.user_email_id, data?.StatusCode, data?.data?.message);
        } else if (data?.StatusCode === 204) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.data?.message);
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.data?.message);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const updateReportdetail = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.updateReportdetail(formData);
        if (data?.StatusCode === 200) {
            localStorage.removeItem("customeDetailOfReport");
            localStorage.removeItem("uploadLogo");
            dispatch({ type: UPDATE_REPORT, data });
            router('/ListOfReports')
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details updated!");
        }else if(data?.StatusCode === 403){
            toast.error(data?.message || "Report Details Not updated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Report Details updated!");
        } else {
            toast.error(data?.error || "Report Details Not updated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.error||"Report Details Not updated!");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const saveMapDataForDrillDown = (formData, router) => async (dispatch) => {
    try {

        const {data} = await api.saveMapDataForDrillDown(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: SAVE_MAP_DATA_FOR_DRILLDOWN, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
            toast.success(data?.data || data?.message || "Table Mapping done", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        } else if (data?.StatusCode === 400) {
            toast.success(data?.data || data?.message || "Table Mapping done", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const updateMapDataForDrillDown = (formData, router) => async (dispatch) => {
    const toastId = toast.info("Updating table mapping, please wait...", {
            position: "top-center",
            autoClose: 5000,
            closeOnClick: false,
            draggable: false,
        });
    try {
        const data = await api.updateMapDataForDrillDown(formData);
        toast.dismiss(toastId);
        if (data?.status === 200) {
            dispatch({ type: UPDATE_MAP_DATA_FOR_DRILLDOWN, data });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
            toast.success("Table Mapping updated successfully!", {
                position: "top-right",
                color: "green",
                autoClose: 3000,
            });
        } else if (data?.status === 204) {
            toast.success(data?.data || "Table Mapping updated", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        }
    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to update table mapping. Please try again.", {
            position: "top-right",
            color: "red",
            autoClose: 5000,
        });
    }
}

export const generateReportId = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.generateReportId(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: GENERATE_REPORT_BY_ID, data});
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Details Fetch Successfully");
        } else if (data?.status === 204) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Somthing Went Wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getlistofcolumnformappingfirst = (formData, router) => async (dispatch) => {
    const toastId = toast.info("Please wait, fetching columns...", {
        position: "top-right",
        closeOnClick: false,
        draggable: false,
        autoClose: 5000,
    });
    try {
        const {data} = await api.getlistofcolumnformappingfirst(formData);
        toast.dismiss(toastId);
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_LIST_OF_COLUMN_FIRST, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
            toast.success("Columns fetched successfully!", {
                position: "top-right",
                color: "green",
                autoClose: 2000,
            });
        } else if (data?.StatusCode === 404) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "");
            toast.warn("No columns available to map.", {
                position: "top-right",
                color: "red",
                autoClose: 2000,
            });
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "");
            toast.warn("No columns available to map.", {
                position: "top-right",
                color: "red",
                autoClose: 2000,
            });

        }
    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to fetch columns. Please try again.", {
            position: "top-right",
            color: "red",
            autoClose: 5000,
        });
    }

}

export const removelistofcolumnformappingfirst = () => async (dispatch) => {
    dispatch({ type: REMOVE_LIST_OF_COLUMN_FIRST });

}
export const removelistofcolumnformappingsecond = () => async (dispatch) => {

    dispatch({ type: REMOVE_LIST_OF_COLUMN_SECOND });

}


export const getlistofcolumnformappingsecond = (formData, router) => async (dispatch) => {
    const toastId = toast.info("Please wait, fetching columns...", {
        position: "top-right",
        closeOnClick: false,
        draggable: false,
        autoClose: 5000,
    });
    try {
        const {data} = await api.getlistofcolumnformappingsecond(formData);
        toast.dismiss(toastId);
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_LIST_OF_COLUMN_SECOND, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "");
            toast.success("Columns fetched successfully!", {
                position: "top-right",
                color: "green",
                autoClose: 2000,
            });
        } else if (data?.StatusCode === 404) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "");
            toast.warn("No columns available to map.", {
                position: "top-right",
                color: "red",
                autoClose: 2000,
            });
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "");
            toast.warn("No columns available to map.", {
                position: "top-right",
                color: "red",
                autoClose: 2000,
            });

        }
    } catch (error) {
        toast.dismiss(toastId);
        toast.error("Failed to fetch columns. Please try again.", {
            position: "top-right",
            color: "red",
            autoClose: 5000,
        });
    }


}

export const generateChartTypeReport = (formData, router) => async (dispatch) => {
    // dispatch({type: LOADING});
    try {
        const {data} = await api.generateChartTypeReport(formData);
        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_CHART_REPORT_DETAIL_BY_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Report Data Fetch Successfully!");
        } else if(data?.StatusCode === 404){
            dispatch({ type: GET_CHART_REPORT_DETAIL_BY_ID, data: data?.data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Data Not Found");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Somthing Went Wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const generateBoxTypeReport = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.generateBoxTypeReport(formData);

        dispatch({ type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_BOX_REPORT_DETAIL_BY_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Detasil Fetch Successfully");
        } else if (data?.StatusCode === 404) {
            dispatch({ type: GET_BOX_REPORT_DETAIL_BY_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "No Data Found");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message || "Somthing went Wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getreportaccessonbasisofgroupid = (formData, router) => async (dispatch) => {
    try {
        const data = await api.getreportaccessonbasisofgroupid(formData);
        if (data?.status === 200) {
            dispatch({ type: GET_REPORTS_ACCESS_GROUP_ID, data });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        } else if (data?.status === 204) {
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const texttoquerychartbot = (formData, router) => async (dispatch) => {
    try {
        const data = await api.texttoquerychartbot(formData);
        if (data?.status === 200) {
            dispatch({ type: CHAT_BOT_TEXT_TO_QUERY, data });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        } else if (data?.status === 204) {
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        }
    } catch (error) {
        logMessage(user?.user_email_id, error.data?.status, error.data?.statusText);
    }
}

export const texttoquerychartbotreset = () => async (dispatch) => {
    dispatch({ type: CHAT_BOT_TEXT_TO_QUERY_RESET });
}

export const getDrilldowndetailforupdated = (formData, router) => async (dispatch) => {

    try {
        const {data} = await api.getDrilldowndetailforupdated(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_DRILLDOWN_FOR_UPDATE, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        } else{
            toast.error(data?.error || data?.message || "Not able to get the drilldown data may we issue with maping", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }
    } catch (error) {
        console.log(error.message);
    }

}

export const defaultgetDrilldowndetailforupdated = () => async (dispatch) => {
    dispatch({ type: DEFAULT_GET_DRILLDOWN_FOR_UPDATE, });
}

export const updategetreporttitlefromondashbaord = (formData) => async (dispatch) => {
    try {
        dispatch({ type: UPDATE_GET_REPORT_ON_DASHBOARD, formData });
        dispatch({ type: LOADED });
    } catch (error) {
        console.log(error.message);
    }
}

export const addgetreporttitlefromondashbaord = (formData) => async (dispatch) => {
    try {
        dispatch({ type: ADD_UPDATE_GET_REPORT_ON_DASHBOARD, formData });
        dispatch({ type: LOADED });
    } catch (error) {
        console.log(error.message);
    }
}

export const generateChartTypeReportbefore = () => async (dispatch) => {
    try {
        dispatch({ type: GET_CHART_REPORT_DETAIL_BY_ID_BEFORE, });
    } catch (error) {
        console.log(error.message);
    }
}

export const exportexcelreport = (formData) => async (dispatch) => {
    const data = await api.exportexcelreport(formData);
    try {
        dispatch({ type: EXPORT_EXCEL_REPORT, data });
    } catch (error) {
        console.log(error.message);
    }

}

export const exportpdfreport = (formData) => async (dispatch) => {
    const data = await api.exportpdfreport(formData);
    try {
        dispatch({ type: EXPORT_PDF_REPORT, data });
    } catch (error) {
        console.log(error.message);
    }

}

export const exportcsvreport = (formData) => async (dispatch) => {
    const data = await api.exportcsvreport(formData);
    try {
        dispatch({ type: EXPORT_CSV_REPORT, data });
    } catch (error) {
        console.log(error.message);
    }

}

export const defaultexport = () => async (dispatch) => {
    try {
        dispatch({ type: DEFAULT_EXPORT_CSV_REPORT, });
    } catch (error) {
        console.log(error.message);
    }
}

export const getfilterdata = (formData, router) => async (dispatch) => {

    try {
        const {data} = await api.getfilterdata(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: FILTER_DATA_REPORT_BY_ID, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        } else if (data?.status === 204) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getfilterdatadrill = (formData, router) => async (dispatch) => {

    try {
        const {data} = await api.getfilterdatadrill(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: FILTER_DATA_REPORT_BY_ID_DRILL, data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"");
        } else if (data?.StatusCode === 204) {
            logMessage(user?.user_email_id, data?.StatusCode,data?.message||"");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode,data?.message||"");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const getfilterdatadrillval = (formData, router) => async (dispatch) => {

    try {
        const {data} = await api.getfilterdatadrillval(formData);
        if (data?.StatusCode === 200) {
            dispatch({ type: GET_DRILL_DOWN_DATA_VALUE, data: data });
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Data fetched successfully.");
        } else if (data?.status === 204) {
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Somthing went Wrong.");
        }else{
            logMessage(user?.user_email_id, data?.StatusCode, data?.message||"Somthing went Wrong.");
        }
    } catch (error) {
        console.log(error.message);
    }
}

