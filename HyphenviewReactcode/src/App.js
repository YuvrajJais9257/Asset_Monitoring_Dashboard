import './App.css';
import LoginFormNew from './Components/LoginFormNew/LoginFormNew';
import React from 'react';
import {Routes, Route } from 'react-router-dom';
import '@mdi/font/css/materialdesignicons.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@coreui/coreui/dist/css/coreui.min.css';
import SplitView from './Components/Splitcheck/SplitView';
import "bootstrap/dist/css/bootstrap.min.css";  

import ApexChart from './Components/ReportManagement/ApexChart';
import Preview from './Components/Splitcheck/Preview';
import HighCharts from './Components/HighCharts/HighCharts';
import CustomQuery from './Components/QueryType/CustomQuery';
import UpdateCutomQuery from './Components/QueryType/UpdateCutomQuery';
import ListOfReports from './Components/ReportManagement/ListOfReports';
import PreviewPage from './Components/ReportManagement/PreviewPage';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import BuildQueryNew from './Components/QueryType/QuerybuilderNew';
import ReportTable from './Components/ReportTypeTable/ReportTable';
import ConnectionForm from './Components/ReportManagement/ConnectionForm';
import UserManagementList from './Components/UserManagement/UserManagementList';
import NewUser from './Components/UserManagement/NewUser';
import ReportSchedulerList from './Components/ReportScheduler/ReportSchedulerList';
import GenerateReport from './Components/ReportManagement/GenerateReport';
import UpdateGroup from './Components/UserManagement/UpdateGroup';
import ResetPassword from './Components/UserManagement/ResetPassword';
import FeatureAssign from './Components/UserManagement/FeatureAssign';
import ModifiedCanvasPage from './Components/ModifiedCanvas/ModifiedCanvasPage';
import DataProvider from './Components/RestApiSection/Components/DataProvider';
import HomePage from './Components/RestApiSection/Components/HomePage';
import ReportSchedulerUpdate from './Components/ReportScheduler/ReportSchedulerUpdate';
import ReportSchedulerNew from './Components/ReportScheduler/ReportSchedulerNew';
import TableRow from './Components/UserManagement/TableRow';
import ReportAccessMap from './Components/ReportAccessMap/ReportAccessMap';
import FeatureAssignpage from './Components/ReportAccessMap/FeatureAssignpage';
import ShowChartReport from './Components/ReportManagement/ShowChartReport';
import ShowBoxchart from './Components/ReportManagement/ShowBoxchart';
import DataFromBackPage from './Components/QueryType/DataFromBackPage'
import ConvertToCSV from './Components/RestApiSection/Components/ConvertToCSV'
import Profile from './Components/Profile'
import SampleQueryForDrilldown from './Components/QueryType/SampleQueryForDrilldown'
import DrillDown from './Components/HighCharts/DrillDown';
import DashboardManagement from './Components/DashboardManagement/DashboardManagement'
import ListOfDashboardCanvas from './Components/DashboardManagement/ListOfDashboardCanvas'
import Geomap from './Components/HighCharts/geomap';
// import NewDashboard from './Components/NewDashboard/NewDashboard';
import ProtectedRoute from './Components/utils/ProtectedRoute';
import NewDashboard from './Components/NewDashboard/NewDashboard';
import GroupManagement from './Components/GroupManagement/GroupManagement';
import NewTabs from "./Components/NewDashboard/NewTabs";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { lazy,Suspense } from 'react';
import CircularProgress from '@mui/material/CircularProgress';

import Columndrilldown from './Components/HighCharts/Columndrilldown';
const NodataFound = lazy(()=>import('./Components/utils/NodataFound'))
const DataSourceAccess = lazy(()=> import('./Components/UserManagement/DataSourceAccess'))
const ResetPasswordNew = lazy(()=> import('./Components/LoginFormNew/ResetPasswordNew'))
// import ReportDashBoardNew from './Components/DefaultPage/ReportDashBoardNew';
 
 
 
 
 
function App() {
 
  return (
    <div>
      <Suspense fallback={<div><CircularProgress /></div>}>
      <Routes>
        
       
        <Route path="/" element={<LoginFormNew />} />  
        <Route path="/Dashboard" element={<ProtectedRoute Component = {NewDashboard}/>} />
        <Route path="/ApexChart" element={<ProtectedRoute Component = {ApexChart }/>} />
        <Route path="/SplitView" element={<ProtectedRoute Component = {SplitView} />}/>
        <Route path="/Preview" element={<ProtectedRoute Component = {Preview }/>} />
        <Route path="/HighCharts" element={<ProtectedRoute Component = {HighCharts }/>} />
        <Route path="/CustomQuery" element={<ProtectedRoute Component = {CustomQuery }/>} />    
        <Route path="/UpdateReportPage" element={<ProtectedRoute Component = {UpdateCutomQuery }/>} />    
        <Route path="/ListOfReports" element={<ProtectedRoute Component = {ListOfReports }/>} />
        <Route path="/PreviewPage" element={<ProtectedRoute Component = {PreviewPage }/>} />
        <Route path="/BuildQueryNew" element={<ProtectedRoute Component = {BuildQueryNew }/>} />
        <Route path="/ReportTable" element={<ProtectedRoute Component = {ReportTable }/>} />
        <Route path="/ConnectionForm" element={<ProtectedRoute Component = {ConnectionForm }/>} />
        <Route path="/UserManagementList" element={<ProtectedRoute Component = {UserManagementList }/>} />
        <Route path="/NewUser" element={<ProtectedRoute Component = {NewUser} />} />
        <Route path="/ReportSchedulerList" element={<ProtectedRoute Component = {ReportSchedulerList }/>} />
        <Route path="/GenerateReport" element={<ProtectedRoute Component = {GenerateReport}/>} />
        <Route path="/UpdateGroup" element={<ProtectedRoute Component = {UpdateGroup}/>} />
        <Route path="/ResetPassword" element={<ProtectedRoute Component = {ResetPassword}/>}/>
        <Route path="/FeatureAssign" element={<ProtectedRoute Component = {FeatureAssign}/>}/>
        <Route path="/ModifiedCanvasPage" element={<ProtectedRoute Component = {ModifiedCanvasPage}/>}/>
        <Route path="/HomePage" element={<DataProvider><HomePage /></DataProvider>} />
        <Route path="/ReportSchedulerUpdate" element={<ProtectedRoute Component = {ReportSchedulerUpdate}/>}/>
        <Route path="/ReportSchedulerNew" element={<ProtectedRoute Component = {ReportSchedulerNew}/>}/>
        <Route path="/TableRow" element={<ProtectedRoute Component = {TableRow}/>}/>
        <Route path="/ReportAccessMap" element={<ProtectedRoute Component = {ReportAccessMap}/>}/>
        <Route path="/FeatureAssignpage" element={<ProtectedRoute Component = {FeatureAssignpage}/>}/>
        <Route path="/ShowChartReport" element={<ProtectedRoute Component = {ShowChartReport}/>}/>
        <Route path="/columndrilldown" element={<ProtectedRoute Component = {Columndrilldown}/>} />
        <Route path="/ShowBoxchart" element={<ProtectedRoute Component = {ShowBoxchart}/>}/>
        <Route path="/DataFromBackPage" element={<ProtectedRoute Component = {DataFromBackPage}/>}/>
        <Route path="/json-to-ui" element={<ProtectedRoute Component = {ConvertToCSV}/>}/>
        <Route path="/profile" element={<ProtectedRoute Component = {Profile }/>} />
        <Route path="/SampleQueryForDrilldown" element={<ProtectedRoute Component = {SampleQueryForDrilldown}/>}/>
        <Route path="/drillDown" element={<ProtectedRoute Component = {DrillDown}/>} />
        <Route path="/DashboardManagement" element={<ProtectedRoute Component = {DashboardManagement} />} />
        <Route path="/Geomap" element={<ProtectedRoute Component = {Geomap }/>} />
        <Route path="/ListOfDashboardCanvas" element={<ProtectedRoute Component = {ListOfDashboardCanvas }/>} />
        <Route path="/GroupManagement" element={<ProtectedRoute Component = {GroupManagement} />} />
        <Route path="/newTabs" element={<ProtectedRoute Component = {NewTabs} />} />
        <Route path="/datasourceaccess" element={<ProtectedRoute Component = {DataSourceAccess} />} />
        <Route path="/resetNew" element={<ResetPasswordNew />} />
        <Route path="*" element={<NodataFound />} />
 
       
      </Routes>
      </Suspense>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
    
  );
}
 
export default App;
 
