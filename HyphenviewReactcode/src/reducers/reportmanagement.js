import * as actionType from "../constants/actionTypes";

const initialState = {
  allReportDetail: [],
  reports: {},
  exportedfilepath: null,
  generate_report_id:{},
  detaildatafordrilldown:{}

};

const authReducer = (state = initialState, action) => {
  switch (action.type) {

    case actionType.GET_REPORT_ON_DASHBOARD:
      return { ...state, allReportDetail: action.data.content, loading: false, error: null };

      case actionType.UPDATE_GET_REPORT_ON_DASHBOARD:
      return { ...state, allReportDetail: state.allReportDetail?.filter((report) => report.report_name !== action.formData.report_name), loading: false, error: null };
 
 
    case actionType.ADD_UPDATE_GET_REPORT_ON_DASHBOARD:
      
      const reportExists = state.allReportDetail?.some((report) => report.report_id === action.formData.report_id);
      return {
        ...state,
        allReportDetail: reportExists
          ? state.allReportDetail
          : [...(state.allReportDetail || []), action.formData],
        error: null,
      };
    case actionType.REMOVE_REPORT:
      return { ...state, allReportDetail: state.allReportDetail?.filter((report) => report.report_id !== action.formData.report_id), error: null };

    case actionType.UPDATE_REPORT:
      return { ...state, update_report: action.data.data, loading: false, error: null };

    case actionType.GENERATE_REPORT_BY_ID:
      return { ...state, generate_report_id: action.data.data, loading: false, error: null };

    case actionType.FILTER_DATA_REPORT_BY_ID:
      return { ...state, generate_report_id: action.data.data, loading: false, error: null };

    case actionType.FILTER_DATA_REPORT_BY_ID_DRILL:
      return {...state, detaildatafordrilldown : action.data.data, loading: false, error: null }

    case actionType.CHECK_DRILL_DOWN:
      return { ...state, checkdrilldown: action.data.data, loading: false, error: null };

    case actionType.DEFAULT_CHECK_DRILL_DOWN:
      return { ...state, checkdrilldown: null, loading: false, error: null };

    case actionType.GET_REPORT_DETAIL_BY_ID:
      return { ...state, generate_detail_by_id: action.data, loading: false, error: null };

    case actionType.GET_REPORTS_ACCESS_GROUP_ID:
      return { ...state, getreport_access_detail_by_id: action.data.data, loading: false, error: null };

    case actionType.GET_REPORT_ACCESS_DETAIL:
      return { ...state, getreportdetalwithaccess: action.data.content, loading: false, error: null };

    case actionType.GET_CHART_REPORT_DETAIL_BY_ID:
      return { ...state, getcharttypeofreportdetail: action.data.data, loading: false, error: null };
    case actionType.GET_CHART_REPORT_DETAIL_BY_ID_BEFORE:
      return { ...state, getcharttypeofreportdetail: null, loading: false, error: null };

    case actionType.GET_BOX_REPORT_DETAIL_BY_ID:
      return { ...state, getboxtypeofreportdetail: action.data.data, loading: false, error: null };

    case actionType.GET_LIST_OF_COLUMN_FIRST:
      return { ...state, getlistofcolumfirst: action.data.data, loading: false, error: null };

    case actionType.GET_LIST_OF_COLUMN_SECOND:
      return { ...state, getlistofcolumsecond: action.data.data, loading: false, error: null };

    case actionType.REMOVE_LIST_OF_COLUMN_FIRST:
      return { ...state, getlistofcolumfirst: null, loading: false, error: null };

    case actionType.REMOVE_LIST_OF_COLUMN_SECOND:
      return { ...state, getlistofcolumsecond: null, loading: false, error: null };

    case actionType.SAVE_MAP_DATA_FOR_DRILLDOWN:
      return { ...state, savemapdatafordrilldown: action.data.data, loading: false, error: null };

    case actionType.UPDATE_MAP_DATA_FOR_DRILLDOWN:
      return { ...state, updateemapdatafordrilldown: action.data.data, loading: false, error: null };

    case actionType.GET_DRILL_DOWN_DATA:
      return { ...state, detaildatafordrilldown: action.data.data, loading: false, error: null };

    case actionType.GET_COLUMN_DRILL_DOWN_DATA:
      return { ...state, detailcolumndatafordrilldown: action.data.data, loading: false, error: null };


    case actionType.INITIAL_GET_DRILL_DOWN_DATA:
      return { ...state, detaildatafordrilldown: null, loading: false, error: null };

    case actionType.CHAT_BOT_TEXT_TO_QUERY:
      return { ...state, texttochatbox: action.data, loading: false, error: null };

    case actionType.CHAT_BOT_TEXT_TO_QUERY_RESET:
      return { ...state, texttochatbox: {}, loading: false, error: null };

    case actionType.GET_DRILLDOWN_FOR_UPDATE:
      return { ...state, getdrildowndataforupdate: action.data.content, loading: false, error: null };

    case actionType.EXPORT_EXCEL_REPORT:
        return { ...state, exportedfilepath: action.data, loading: false, error: null };
  
    case actionType.EXPORT_PDF_REPORT:
        return { ...state, exportedfilepath: action.data, loading: false, error: null };
  
    case actionType.EXPORT_CSV_REPORT:
        return { ...state, exportedfilepath: action.data, loading: false, error: null };

    case actionType.DEFAULT_EXPORT_CSV_REPORT:
        return { ...state, exportedfilepath: null, loading: false, error: null };

    case actionType.DEFAULT_GET_DRILLDOWN_FOR_UPDATE:
      return { ...state, getdrildowndataforupdate: null, loading: false, error: null };

    // case actionType.GET_UNIQUE_COLUMN_VALUE:
    //   return { ...state, getuniquecolumnname: action.data, loading: false, error: null };

    case actionType.GET_DRILL_DOWN_DATA_VALUE:
      return { ...state, detaildatafordrilldownvalue: action.data.data, loading: false, error: null };
    
    default:
      return state;
  }
};

export default authReducer;