import { SESSION_LOGOUT} from "../constants/actionTypes";
import * as api from '../api/index.js';
    
    
    export const tokenexpire = (formData, router) => async (dispatch) => {
        try{
            const { data } = await api.expireToken(formData);
            dispatch({ type: SESSION_LOGOUT, test : data}); 
            if(data?.validate != false){

            }else{ 
                console.log("error")
            }
        }catch (error) {
            console.log(error);
          }
    }