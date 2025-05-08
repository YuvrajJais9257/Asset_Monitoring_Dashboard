import {
    LOGIN, AUTH, DB_CONNECTION, VALIDATE_CONNECTION, SCHEMA_DATA, REPORT_TEMPLATE_DATA_SAVE, GET_REPORT_FORMATE_DATA, REQUEST_OTP_FAILURE,
    TEST_QUERY_CUSTOM, CUSTOM_PREVIEW_DATA_TABLE, CUSTOM_PREVIEW_DATA_CHART, LIST_OF_FEATURE, RESET_TEST_QUERY_CUSTOM, DATA_WITH_BACK_BUTTON, RESET_DATA_WITH_BACK_BUTTON,
    ASSIGN_GROUP_ID_TO_USER, CUSTOM_PREVIEW_DATA_BOX, BOX_COLOR_DATA_SAVE, DB_CONNECTION_SET_DEFAULT, TEST_QUERY_CUSTOM_MESSAGE_TYPE,
    LOGIN_MESSAGE, TEST_QUERY_CUSTOM_DRILL_DOWN, RESET_TEST_QUERY_CUSTOM_DRILL_DOWN,
    IS_AUTHORIZE_USER, ASSIGN_GROUP_ID_TO_DBSOURCE, GET_DB_DETAILS, SET_USERNAME, VERIFY_OTP, RESEND_OTP, REQUEST_OTP
} from "../constants/actionTypes";
import * as api from '../api/index.js';
import { toast } from 'react-toastify';
import logMessage from "../logserver.js";
import { decryptData } from "../Components/utils/EncriptionStore";

const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
})();


export const login = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.logIn(formData);
        if (data?.validate && data?.statusCode === 200) {
            dispatch({ type: AUTH, data });
            logMessage(formData.username, data?.statusCode, data?.message);
            return data?.validate;
        }
        else if (!data?.validate && data?.statusCode === 200) {
            logMessage(formData.username, data?.statusCode, data?.message);
            toast.error(data?.message, { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            return data?.validate;
        }
        else if (data?.statusCode === 400) {
            dispatch({ type: LOGIN, data });
            logMessage(formData.username, data?.statusCode, data?.message);
            router("", { state: { message: "Invalid username or password" } })
            return false;
        } else if (data?.statusCode === 401) {
            dispatch({ type: LOGIN, data });
            toast.error(data?.message, { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            router("", { state: { message: "Invalid username or password" } })
            return false;
        } else {
            dispatch({ type: LOGIN, data });
            logMessage(formData.username, data?.statusCode, data?.message);
            router("", { state: { message: "Invalid username or password" } })
            return false;
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const loginmessage = () => async (dispatch) => {
    dispatch({ type: LOGIN_MESSAGE });
}

export const databaseconnection = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.databaseconnection(formData);

        if (data?.statusCode === 200) {
            dispatch({ type: DB_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.detail || "");
        } else if (data?.statusCode === 404 || data?.statusCode === 403) {
            dispatch({ type: DB_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "");
        }
        else if (data?.statusCode === 500) {
            dispatch({ type: DB_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.error || data.message || "");
        } else if (data?.status_code === 200) {
            router('/ApexChart')
            dispatch({ type: DB_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "");
        } else {
            dispatch({ type: DB_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || data?.error || "");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const databaseconnectionsetdefault = (formData, router) => async (dispatch) => {
    try {
        dispatch({ type: DB_CONNECTION_SET_DEFAULT, formData });
    }
    catch (error) {
        console.log(error.message);
    }
}

export const validateConnection = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.validateConnection(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: VALIDATE_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Db details Fetch Successfully");
        } else {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Somthing when wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const schemametaData = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.schemametaData(formData);

        if (data?.statusCode === 200) {
            dispatch({ type: SCHEMA_DATA, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || " Schema Details Fetch Successfully!");
        } else {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || " Schema Details Not Fetch !");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const savereportTemplate = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.savereportTemplate(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: REPORT_TEMPLATE_DATA_SAVE, data });
            localStorage.removeItem("customeDetailOfReport");
            localStorage.removeItem("uploadLogo")
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Report Created Successfully!");
            router('/ListOfReports')
        } else if (data?.statusCode === 404) {
            dispatch({ type: REPORT_TEMPLATE_DATA_SAVE, data });
            toast.success(data?.message || "Somthing when wrong with report create it again", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        } else if (data?.statusCode === 403) {
            toast.success(data?.message || "Somthing when wrong with report create it again", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Somthing when wrong with report create it again!");
        }
        else {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Somthing when wrong with report create it again!");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const savetheboxdata = (formData, router) => async (dispatch) => {
    try {
        dispatch({ type: BOX_COLOR_DATA_SAVE, formData });
    } catch (error) {

    }
}

export const customPreviewChartData = (formData, router) => async (dispatch) => {
    try {
        if (formData.report_type === "Table") {
            const { data } = await api.customPreviewChartData(formData);
            if (data?.StatusCode === 200) {
                dispatch({ type: CUSTOM_PREVIEW_DATA_TABLE, data });
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            } else if (data?.StatusCode === 404) {
                dispatch({ type: CUSTOM_PREVIEW_DATA_TABLE, data: data?.data });
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            } else {
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            }
        } else if (formData.report_type === "Chart") {
            const { data } = await api.customPreviewChartData(formData);
            if (data?.StatusCode === 200) {
                dispatch({ type: CUSTOM_PREVIEW_DATA_CHART, data });
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            } else if (data.StatusCode === 404) {
                dispatch({ type: CUSTOM_PREVIEW_DATA_CHART, data: data?.data });
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            } else {
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            }
        } else if (formData.report_type === "Box") {
            const { data } = await api.customPreviewChartData(formData);
            if (data?.StatusCode === 200) {
                dispatch({ type: CUSTOM_PREVIEW_DATA_BOX, data });
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            } else if (data?.StatusCode === 404) {
                dispatch({ type: CUSTOM_PREVIEW_DATA_BOX, data: data });
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            } else {
                logMessage(user?.user_email_id, data?.StatusCode, data?.message);
            }
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const testquryonCustompagefordrilldown = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.testquryonCustompagefordrilldown(formData);
        dispatch({ type: TEST_QUERY_CUSTOM_DRILL_DOWN, data });
        // if (data?.validate) {
        //    dispatch(auth(formData, router));
        // }else {
        //     alert("User is not valid");
        // }
    } catch (error) {
        console.log(error.message);
    }
}

export const testquryonCustompage = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.testquryonCustompage(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: TEST_QUERY_CUSTOM, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Query Is Valid");
        }
        else if (data?.statusCode === 401) {
            dispatch({ type: TEST_QUERY_CUSTOM, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Query Is Not Valid");
        }
        else {
            dispatch({ type: TEST_QUERY_CUSTOM, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Query Is Not Valid");
        }
    } catch (error) {
        console.log(error.message);
    }
}

// export const  testqueryoncustompageforresponse= () => async (dispatch) => {
//     console.log("getreport",formData)
//     try {
//         dispatch({ type: TEST_QUERY_CUSTOM_MESSAGE_TYPE, data });
//         // if (data?.validate) {
//         //    dispatch(auth(formData, router));
//         // }else {
//         //     alert("User is not valid");
//         // }
//     }catch (error) {
//         console.log(error.message);
//       }
// }

export const resettestquryonCustompage = () => async (dispatch) => {

    dispatch({ type: RESET_TEST_QUERY_CUSTOM });
    // if (data?.validate) {
    //    dispatch(auth(formData, router));
    // }else {
    //     alert("User is not valid");
    // }
}

export const resettestquryonCustompagefordrilldown = () => async (dispatch) => {
    dispatch({ type: RESET_TEST_QUERY_CUSTOM_DRILL_DOWN });
}

export const backtocustomquerypagewithdata = (formData, router) => async (dispatch) => {

    dispatch({ type: DATA_WITH_BACK_BUTTON, formData });
}

export const resetbacktocustomquerypagewithdata = () => async (dispatch) => {
    dispatch({ type: RESET_DATA_WITH_BACK_BUTTON });
}



export const featureName = (formData, router) => async (dispatch) => {
    try {
        const data = await api.featureName(formData);
        if (data?.status === 200 && data?.data?.StatusCode === 200) {
            dispatch({ type: LIST_OF_FEATURE, data });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        } else if (data?.status === 204) {
            toast.success(data?.message || "Somthing when wrong with Backend", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        }
    } catch (error) {
        console.log(error.message);
    }
}


export const assigngrouptouser = (formData, router) => async (dispatch) => {
    const user = () => {
        const encryptedValue = localStorage.getItem("profile");
        if (encryptedValue) {
            return decryptData(encryptedValue);
        }
        return null;
    };

    try {
        const { data } = await api.assigngrouptouser(formData);
        dispatch({ type: ASSIGN_GROUP_ID_TO_USER, data });
        if (data?.statusCode === 200) {
            toast.success(data?.message || "Group Assign Successful", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            if (user?.user_email_id === formData?.user_email) {
                router("", { state: { message: "Group Added Successfully!" } })
            }
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Group Added Successfully!");
        } else {
            toast.error(data?.message || "Somthing when wrong", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Somthing when wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const uploadicon = (formData, router) => async (dispatch) => {
    try {
        const data = await api.uploadicon(formData);
        if (data?.status === 200) {
            dispatch({ type: ASSIGN_GROUP_ID_TO_USER, data });
            toast.success(data?.data || "Icon uploaded successful", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            router("/FeatureAssignpage", { state: { message: "Added feature with Icon Successfully!" } })
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        } else if (data?.status === 204) {
            toast.success(data?.data || "Somthing when wrong", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user?.user_email_id, data?.status, data?.statusText);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const validateConnectionwithsuperadmin = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.validateConnectionwithsuperadmin(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: VALIDATE_CONNECTION, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Db details Fetch Successfully");
        } else {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "Somthing when wrong");
        }
    } catch (error) {
        console.log(error.message);
    }
}


export const getDBdetails = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.getDBdetails(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: GET_DB_DETAILS, data });
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "DB details fetched Successfully.");
        } else {
            logMessage(user?.user_email_id, data?.statusCode, data?.message || "DB details Not fetched.");
        }
    } catch (error) {
        console.log(error.message);
    }
}


export const assigndatasourcetogroup = (formData, router) => async (dispatch) => {
    const user = () => {
        const encryptedValue = localStorage.getItem("profile");
        if (encryptedValue) {
            return decryptData(encryptedValue);
        }
        return null;
    };

    try {
        const { data } = await api.assigndatasourcetogroup(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: ASSIGN_GROUP_ID_TO_DBSOURCE, data });
            toast.success(data?.message || "Group Assign To Source Successful", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            if (user?.user_email_id === formData?.user_email) {
                router("", { state: { message: "Group Added Successfully!" } })
            }
        } else {
            toast.success(data?.message || "Somthing when wrong", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log(error.message);
    }
}

// export const  getreportformateddata= (formData, router) => async (dispatch) => {
//     console.log("getreport",formData)
//     try {
//         const {data} = await api.getreportformateddata(formData);
//         console.log(data, "response");
//         dispatch({ type: GET_REPORT_FORMATE_DATA, data });
//         // if (data?.validate) {
//         //    dispatch(auth(formData, router));
//         // }else {
//         //     alert("User is not valid");
//         // }
//     }catch (error) {
//         console.log(error.message);
//       }
// }


export const requestOTP = (formData, router) => async (dispatch) => {
    try {
        const response = await api.requestOTP(formData);
        dispatch({ type: REQUEST_OTP, payload: response?.data });

        toast.success(response?.data?.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

        return true;
    } catch (error) {
        const errorMessage =
            error.response?.data?.message ||
            "An error occurred while requesting OTP.";

        toast.error(errorMessage, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

        dispatch({
            type: REQUEST_OTP_FAILURE,
            payload: errorMessage,
        });

        return false;
    }
};

export const resendOTP = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.resendOTP(formData);
        dispatch({ type: RESEND_OTP, data });
        toast.success(data?.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
        return true;
    } catch (error) {
        toast.error("An error occurred while resending OTP.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
        return false;
    }
};

export const verifyOTP = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.verifyOTP(formData);
        dispatch({ type: VERIFY_OTP, data });

        toast.success(data?.message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });

        return true;
    } catch (error) {
        toast.error("An error occurred while verifying OTP.", {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            theme: "light",
        });
        return false;
    }
};

export const setUserName = (formData, router) => async (dispatch) => {
    try {
        dispatch({ type: SET_USERNAME, formData });
    } catch (error) {
        console.log(error.message);
    }
};