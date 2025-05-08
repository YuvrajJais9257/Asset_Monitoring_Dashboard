/*created by yuvraj jaiswal 12 feb 2025 to store and update the images uplaoded by user */
import * as actionType from "../constants/actionTypes";

const initialState = {
  uploading: false,
  message: null,
  images: {
    login_logo: null,
    nav_icon: null,
    pdf_logo: null,
  },
  error: null,
};

const imageReducer = (state = initialState, action) => {
  switch (action.type) {
    case actionType.UPLOAD_IMAGES:
      return {
        ...state,
        uploading: action.payload.uploading,
        message: action.payload.message,
        error: action.payload.error,
      };

    case actionType.FETCH_NAV_ICON:
      return {
        ...state,
        images: { ...state.images, nav_icon: action.payload },
      };

    case actionType.FETCH_LOGIN_LOGO:
      return {
        ...state,
        images: { ...state.images, login_logo: action.payload },
      };

    case actionType.FETCH_PDF_LOGO:
      return {
        ...state,
        images: { ...state.images, pdf_logo: action.payload },
      };

    default:
      return state;
  }
};

export default imageReducer;
