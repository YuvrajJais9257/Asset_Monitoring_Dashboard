import * as actionType from "../constants/actionTypes";

const initialState = {
 
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionType.SESSION_LOGOUT:
      return { ...state, session_logout: action.data.group_names, loading: false, error: null };

    default:
      return state;
  }
};

export default authReducer;
