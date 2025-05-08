import * as actionType from "../constants/actionTypes";
 
const initialState = {
  list_of_group: [],
  groupwithid: {}
};
 
const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionType.LIST_OF_GROUP:
      return { ...state, list_of_group: action.data.group_names, loading: false, error: null };
 
      case actionType.ADD_GROUP:
        return {
          ...state,
          list_of_group: [
            ...state.list_of_group,
            {
              group_id: action.data?.groupDetail.group_id,
              groupname: action.data?.groupDetail.groupname,
              customer_id: action.data?.groupDetail.customer_id
            }
          ],
          loading: false,
          error: null
        };
 
    case actionType.CHECK_REMOVE_OF_GROUP:
      return { ...state, check_remove_of_group: action.data, error: null };
 
 
    case actionType.DELETE_GROUP:
      return { ...state, list_of_group: state.list_of_group?.filter((group) => group.group_id !== action.formData.group_id), error: null };
 
    case actionType.EDIT_OF_GROUP:
      return {
        ...state,
        list_of_group: state.list_of_group.map((group) =>
          group.group_id === action.formData.group_id
            ? { ...group, groupname: action.formData.new_group_name }
            : group
        ),
        edit_group_name : action.data,
        error: null
      };
   
    case actionType.RESET_MESSAGE_GROUP:
      return { ...state, addgroupmessage: null, loading: false, error: null };
 
    case actionType.EDIT_OF_GROUP_MESSAGE:
      return {...state, edit_group_name : null,loading: false, error: null}
 
    case actionType.MESSAGE_ADD_GROUP:
      return { ...state, addgroupmessage: action.data, loading: false, error: null };
 
    default:
      return state;
  }
};
 
export default authReducer;
 