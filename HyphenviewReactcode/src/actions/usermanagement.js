import { LIST_OF_USER,RESET_PASSWORD,RESET_PASSWORD_NEW,DELETE_USER,SAVE_USER,RESET_MESSAGE_TEST_QUERY_CUSTOM,LOADING,LOADED,RESET_PASSWORD_MESSAGE} from "../constants/actionTypes";
import * as api from '../api/index.js';
import logMessage from "../logserver.js";
import {toast } from 'react-toastify';
import { decryptData } from "../Components/utils/EncriptionStore";


const user = (() => {
  const encryptedData = localStorage.getItem("profile");
  return encryptedData ? decryptData(encryptedData) : null;
})();


export const  listOfuser= (formData, router) => async (dispatch) => {
    dispatch({type: LOADING,});
    try {
        const {data} = await api.listOfuser(formData);
        dispatch({type: LOADED });
        if (data?.StatusCode === 200) {
            dispatch({ type: LIST_OF_USER, data });
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "User List Fetch Successfully");
        }else if(data?.StatusCode === 204 || data?.StatusCode===400) {
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "User List Not Fetch");
        }else{
            logMessage(user?.user_email_id,data?.StatusCode,data?.message || "User List Not Fetch");
        }
    }catch (error) {
        console.log(error.message);
      }
}

export const resetPassword = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.resetPassword(formData);
      
        if (data?.statusCode === 200) {
            if(formData?.email === user?.user_email_id){
                router("/",{state:{message:"Password Reset Successfully!"}})  
                logMessage(user?.user_email_id,data?.statusCode,data?.message || "Password Reset Successfully!");
            }else{
                router("/UserManagementList",{state:{message:"Password Reset Successfully!"}}) 
                logMessage(user?.user_email_id,data?.statusCode,data?.message || "Password Reset Successfully!"); 
            } 
            dispatch({ type: RESET_PASSWORD, data });
        }else {
            dispatch({ type: RESET_PASSWORD, data });
            logMessage(user?.user_email_id,data?.statusCode,data?.message || "Somthing Went Wrong Password Not Reset!"); 
        }
    }catch (error) {
        console.log(error.message);
      }
}

export const resetPasswordnew = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.resetPasswordnew(formData);
        if (data?.status === 'success') {
            dispatch({ type: RESET_PASSWORD_NEW, data });
            // alert("Password Reset Successfully!")
            router("/",{state:{message:"Password Reset Successfully!"}})     
        }else {
            dispatch({ type: RESET_PASSWORD_NEW, data });
            // alert(data.message);
        }
    }catch (error) {
        console.log(error.message);
      }
}

export const resetmessagePassword = () => async (dispatch) => {
    try {
        dispatch({ type: RESET_PASSWORD_MESSAGE});
    }catch (error) {
      }
}

export const deleteUser = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.deleteUser(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: DELETE_USER, formData });
            toast.success(data?.message || "user is deleted Successfully!", {position: "top-right",autoClose: 5000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
            logMessage(user?.user_email_id,data?.statusCode,data?.message || "user is deleted Successfully!");
        }else {
            toast.error(data?.message || "user is not deleted!", {position: "top-right",autoClose: 5000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
            logMessage(user?.user_email_id,data?.statusCode,data?.message || "user is not deleted!");
        }
    }catch (error) {
        console.log(error.message);
      }
}

export const saveUser = (formData, router) => async (dispatch) => {
    try {
        const {data} = await api.saveUser(formData);
        dispatch({ type: SAVE_USER, data });
        if (data?.message === 'User Added Successfully!') {
            // setTimeout("alert(User Added Successfully)", 2000);
            router("/UserManagementList",{state:{message:"User Added Successfully!"}})     
        }else {
            // alert("User is not valid");
        }
    }catch (error) {
        console.log(error.message);
      }
}

export const  resetmessageshown= () => async (dispatch) => {
    
    dispatch({ type: RESET_MESSAGE_TEST_QUERY_CUSTOM});
    // if (data?.validate) {
    //    dispatch(auth(formData, router));
    // }else {
    //     alert("User is not valid");
    // }
}



