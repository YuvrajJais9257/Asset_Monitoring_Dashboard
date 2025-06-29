import { combineReducers } from 'redux';
import auth from './auth';
import usermanagement from './usermanagement'
import reportmanagement from './reportmanagement'
import assignfeaturetothegroup from './assignfeaturetothegroup'
import assignreporttothegroup from './assignreporttothegroup'
import canvascreation from './canvascreation'
import restapi from './restapi'
import reportscheduler from './reportscheduler'
import newgroup from './newgroup'
import sessionlogout from './sessionlogout'
import logowhitelisting from "./logowhitelisting";

//today change
import themeReducer from "./new_dashboard";

const reducers = combineReducers({ auth,usermanagement,reportmanagement,assignfeaturetothegroup,assignreporttothegroup,canvascreation,restapi,reportscheduler,newgroup,sessionlogout,logowhitelisting, theme: themeReducer });

export default reducers;