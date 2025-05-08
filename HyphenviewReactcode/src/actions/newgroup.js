import { LIST_OF_GROUP, ADD_GROUP, RESET_MESSAGE_GROUP, MESSAGE_ADD_GROUP, DELETE_GROUP, EDIT_OF_GROUP_MESSAGE, EDIT_OF_GROUP } from "../constants/actionTypes";
import * as api from '../api/index.js';
import ShowAlert from './ShowAlert.js';
import { toast } from 'react-toastify';
import logMessage from "../logserver.js";
import { decryptData } from "../Components/utils/EncriptionStore.js";

const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
})();


export const listofgroup = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.listofgroup(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: LIST_OF_GROUP, data });
            logMessage(formData.email, data?.statusCode, data?.message);
        } else if (data?.statusCod === 400 || data?.statusCod === 404 || data?.statusCod === 400) {
            logMessage(formData.email, data?.statusCode, data?.message);
        } else {
            logMessage(formData.email, data?.statusCode, data?.message);
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const addGroup = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.addGroup(formData);
        if (data?.statusCode === 200) {
            toast.success(data?.message || "Group Added successfully", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            dispatch({ type: ADD_GROUP, data });
            dispatch({ type: MESSAGE_ADD_GROUP, data });
            router("/FeatureAssignpage", { state: { message: "Group Added Successfully!" } })
        } else if (data.statusCode === 403) {
            toast.warn(data?.message || "Not Added Group", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            dispatch({ type: ADD_GROUP, data });
        } else {
            dispatch({ type: MESSAGE_ADD_GROUP, data });
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const resertgroupmessage = () => async (dispatch) => {
    dispatch({ type: RESET_MESSAGE_GROUP });
}

export const removeGroup = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.removeGroup(formData);

        if (data?.statusCode === 200) {
            dispatch({ type: DELETE_GROUP, formData });
            logMessage(user.user_email_id, data?.statusCode, data?.message || "Members found for group Addgroupnw");
        } else {
            toast.error("Somthing when wrong group is not removed", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user.user_email_id, data?.statusCode, data?.message || "Somthing when wrong group is not removed");
        }
    } catch (error) {
        console.log(error.message);
    }
}


export const checkremovegroup = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.checkremovegroup(formData);

        if (data?.statusCode === 200 && data?.count == 0) {
            const response = await ShowAlert({
                title: "Confirmation",
                message: "None of the users is mapped with this group. Do you want to delete this group?",
                options: ["OK", "Cancel"]
            });
            if (response === "OK") {
                dispatch(removeGroup(formData));
            } else {
                console.log("User canceled the operation.");
            }

        } else if (data?.statusCode === 200 && data?.count > 0) {
            const response = await ShowAlert({
                title: "Warning",
                message: `This group has ${data?.count} associated users. Deleting the group will also delete all associated users. If you wish to retain the users, please click on assign button this operation and reassign them to another group before proceeding with the deletion.`,
                options: ["OK", "Cancel", "Assign"]
            });

            if (response === "OK") {
                const confirmDelete = await ShowAlert({
                    title: "Confirm Deletion",
                    message: "Are you sure you want to delete this group and all associated users?",
                    options: ["OK", "Cancel"]
                });

                if (confirmDelete === "OK") {
                    dispatch(removeGroup(formData));
                } else {
                    console.log("User canceled the operation.");
                }
            } else if (response === "Assign") {
                console.log("User chose to reassign users before deleting the group.");
                router("/UpdateGroup", { state: { message: "Group Added Successfully!" } });
            } else {
                console.log("User canceled the operation.");
            }
        } else {
            toast.success("Somthing went wrong!", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        }
    } catch (error) {
        console.log("Error during group removal process:", error.message);
    }
};


export const editGroup = (formData, router) => async (dispatch) => {
    try {
        const { data } = await api.editGroup(formData);
        if (data?.statusCode === 200) {
            dispatch({ type: EDIT_OF_GROUP, formData, data });
            toast.success("GroupName Updated Successfully!", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user.user_email_id, data?.statusCode, data?.message || "GroupName Updated Successfully!");
        } else {
            toast.error("Somthing went wron with not able to editgroup", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            logMessage(user.user_email_id, data?.statusCode, data?.message || "Somthing went wron with not able to editgroup");
        }
    } catch (error) {
        console.log(error.message);
    }
}

export const editgroupnamemessage = () => async (dispatch) => {
    dispatch({ type: EDIT_OF_GROUP_MESSAGE, });
}

