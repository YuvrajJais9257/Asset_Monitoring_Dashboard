import * as actionType from "../constants/actionTypes";
import { encryptData } from "../Components/utils/EncriptionStore";
const authReducer = (state = {authData : null}, action) => {
    switch (action.type){
        // case actionType.LOGIN:
        // localStorage.setItem("token", JSON.stringify(action.data));
        // return {...state, authData: action.data, loading: false, error : null}

        case actionType.LOGIN_MESSAGE:
        return {...state, authData: null, loading: false, error : null}
        
        case actionType.AUTH:
        localStorage.setItem("token", JSON.stringify(action.data.access_token));
        const encryptedProfile = encryptData(action.data.user_data);
        if (encryptedProfile) {
            localStorage.setItem("profile", encryptedProfile);
        }
        return {...state, user: action.data, loading: false, error : null}
        
        case actionType.DB_CONNECTION:
        return {...state, dbconnection: action.data, loading: false, error : null}

        case actionType.DB_CONNECTION_SET_DEFAULT:
        return {...state, dbconnection: null, loading: false, error : null}

        case actionType.SET_DIV_COUNT:
        return { ...state, authData: action.payload,loading: false, error : null };

        case actionType.VALIDATE_CONNECTION:
        return { ...state, validate: action.data, loading: false, error : null };

        case actionType.SCHEMA_DATA:
        return { ...state, SchemaMetadata: action.data.data, loading: false, error : null };

        case actionType.REPORT_TEMPLATE_DATA_SAVE:
        return { ...state, report_template_data_save: action.data, loading: false, error : null };

        case actionType.GET_REPORT_ON_DASHBOARD:
        return { ...state, get_report_on_dashboard: action.data, loading: false, error : null };
      
        case actionType.GET_REPORT_FORMATE_DATA:
            
        return { ...state, get_report_formate_data: action.data, loading: false, error : null };

        case actionType.TEST_QUERY_CUSTOM:
        return { ...state, test_custom_query: action.data, loading: false, error : null };
        
        case actionType.TEST_QUERY_CUSTOM_DRILL_DOWN:
        return { ...state, test_custom_query_drilldown: action.data, loading: false, error : null };

        case actionType.RESET_TEST_QUERY_CUSTOM:
        return { ...state, test_custom_query: null, loading: false, error : null };

        case actionType.RESET_TEST_QUERY_CUSTOM_DRILL_DOWN:
        return { ...state, test_custom_query_drilldown: null, loading: false, error : null };
        
        case actionType.CUSTOM_PREVIEW_DATA_TABLE:
        return { ...state, custom_preview_table: action.data.data, loading: false, error : null };

        case actionType.CUSTOM_PREVIEW_DATA_CHART:
        return { ...state, custom_preview_chart: action.data.data, loading: false, error : null };

        case actionType.CUSTOM_PREVIEW_DATA_BOX:
        return { ...state, custom_preview_box: action.data, loading: false, error : null };

        case actionType.DATA_WITH_BACK_BUTTON:
        return { ...state, datawithbackbutton: action.formData, loading: false, error : null };

        case actionType.RESET_DATA_WITH_BACK_BUTTON:
        return { ...state, datawithbackbutton: null, loading: false, error : null };

        case actionType.REMOVE_REPORT:
        return { ...state, remove_response: action.data, loading: false, error : null };

        case actionType.UPDATE_REPORT:
        return { ...state, update_report: action.data, loading: false, error : null };

        case actionType.GENERATE_REPORT_BY_ID:
        return { ...state, generate_report_id: action.data, loading: false, error : null };

        case actionType.LIST_OF_GROUP:
        return { ...state, list_of_group: action.data, loading: false, error : null };

        case actionType.LIST_OF_FEATURE:
        return { ...state, list_of_feature: action.data.data, loading: false, error : null };

        case actionType.ADD_GROUP:
        return { ...state, add_group: action.data, loading: false, error : null };

        case actionType.ASSIGN_GROUP_ID_TO_USER:
        return { ...state, assign_group_to_user: action.data.data, error : null };

        case actionType.BOX_COLOR_DATA_SAVE:
        return { ...state, box_color_data: action.formData, error : null };

        case actionType.ASSIGN_GROUP_ID_TO_DBSOURCE:
        return { ...state, assign_group_to_source: action.data.data, error : null };

        case actionType.GET_DB_DETAILS:
        return { ...state, dbdetailsformap: action.data, loading: false, error : null };

        case actionType.REQUEST_OTP:
            return {
                ...state,
                otpRequestSuccess: true,
                loading: false,
                error: null,
            };

        case actionType.REQUEST_OTP_FAILURE:
            return {
                ...state,
                otpRequestSuccess: false,
                loading: false,
                error: action.payload,
            };

        case actionType.RESEND_OTP:
            if (action.data?.message) {
                return {
                    ...state,
                    otpResendSuccess: true,
                    loading: false,
                    error: null,
                };
            } else {
                return {
                    ...state,
                    otpResendSuccess: false,
                    loading: false,
                    error: null,
                };
            }

        case actionType.VERIFY_OTP:
            if (action.data?.message) {
                return {
                    ...state,
                    otpVerified: true,
                    loading: false,
                    error: null,
                };
            } else {
                return {
                    ...state,
                    otpVerified: false,
                    loading: false,
                    error: null,
                };
            }
        case actionType.SET_USERNAME:
            return {
                ...state,
                username: action.formData,
                loading: false,
                error: null,
            };


        default:
			return state;
    }
};

export default authReducer;