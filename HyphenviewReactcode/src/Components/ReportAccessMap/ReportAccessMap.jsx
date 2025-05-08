import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getreportdetailwithaccessforassignreport } from '../../actions/reportmanagement';
import { getReportDetailonbasisOFgroupid } from '../../actions/assignReport';
import { listofgroup } from '../../actions/newgroup'
import { useNavigate } from "react-router-dom";
import { Button } from '../globalCSS/Button/Button';
import Pagination from '../Pagination/Pagination';
import Header from '../header';
import { Tab, Tabs } from "react-tabs-scrollable";
import './../globalCSS/ReportAccessMap/reportaccessmap.css';
import "./../globalCSS/NewDashboard/NewTabs.css";
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
import { assignreporttothegroup } from '../../actions/assignReport'
import { toast } from 'react-toastify';
import ShowAlert from "../../actions/ShowAlert";
import { decryptData } from "../utils/EncriptionStore";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import "./../globalCSS/dashboardmanagement/ListTable.css"
import "./../globalCSS/dashboardmanagement/DownloadButton.css"
const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false);
  const [isReportsInitialized, setIsReportsInitialized] = useState(false);

  const dispatch = useDispatch();
  const history = useNavigate();

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const apiData = useSelector((state) => state);
  const reportdetail = apiData?.reportmanagement.getreportdetalwithaccess;
  const reportdetailofgroupId = apiData?.assignreporttothegroup.getreportdetailonbasisofgroupId;


  const listofallgroup =
    Array.isArray(apiData?.newgroup?.list_of_group) && apiData.newgroup.list_of_group.length > 0
      ? apiData.newgroup.list_of_group.some((item) => item.groupname === "SuperAdmin" && user.groupname === "SuperAdmin") // Check if any item matches user.groupname
        ? apiData.newgroup.list_of_group // If a match is found, leave the array unchanged
        : apiData.newgroup.list_of_group.filter((item) => item.groupname !== "SuperAdmin") // Otherwise, filter out items with groupname "SuperAdmin"
      : [];

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlGroupId = Number(queryParams.get("group_id"));
    dispatch(getreportdetailwithaccessforassignreport({ database_type: user.database_type, email: user.user_email_id, group_id: urlGroupId })); // search on the basis of group_id
    dispatch(getReportDetailonbasisOFgroupid({ customer_id: user.customer_id, database_type: user.database_type }));
    dispatch(listofgroup({ email: user.user_email_id, database_type: user.database_type }));
  }, []);




  useEffect(() => {
    if (reportdetail) {
      const updatedReports = reportdetail.map(report => ({
        name: report.report_name,
        report_id: report.report_id,
        export: false,
        edit: false,
        delete: false,
        view: false,
        adminMode: false
      }));
      setReports(updatedReports);
      setIsLoading(true);
      setIsReportsInitialized(true);
    }
  }, [reportdetail]);

  useEffect(() => {
    if (!listofallgroup?.length || !reportdetail?.length) return;
    const queryParams = new URLSearchParams(window.location.search);
    const urlGroupId = Number(queryParams.get("group_id"));
    const indexofgroup = listofallgroup.findIndex(item => item.group_id === urlGroupId);
    if (indexofgroup !== -1) {
      setActiveTab(indexofgroup);
      setTimeout(() => {
        handleSelectGroup(urlGroupId);
      }, 500);
    }
    setIsReportsInitialized(false);

  }, [isReportsInitialized])

  useEffect(() => {
    setCurrentPage(1); 
  }, [search]);


  const [currentPage, setCurrentPage] = useState(1)
  let PageSize = 5


  const filteredData = useMemo(() => {
    if (!search) return reports;
    return reports?.filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, reports]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);


  const handleCheckboxChange = (reportId, key) => {
    setReports(prevReports => {
      const updatedReports = prevReports.map(report => {
        if (report.report_id === reportId) {
          const updatedReport = { ...report, [key]: !report[key] };

          if (key === "adminMode") {
            updatedReport.export = updatedReport.edit = updatedReport.delete = updatedReport.view = updatedReport.adminMode;
          } else {
            updatedReport.adminMode = ["export", "edit", "delete", "view"].every(checkbox => updatedReport[checkbox]);
          }

          return updatedReport;
        }
        return report;
      });
      return updatedReports;
    });
  };

  const [activeTab, setActiveTab] = useState(1);

  const onTabClick = (e, index) => {
    if (index >= 0 && index < listofallgroup.length) {
      const selectedTab = listofallgroup[index];
      handleSelectGroup(selectedTab.group_id); // Call handleSelectGroup with the group_id
      setActiveTab(index);

    } else {
      console.error(`Invalid tabIndex: ${index}. No group found.`);
    }
  };

  const handleSelectGroup = (groupid) => {
    // dispatch(getReportDetailonbasisOFgroupid({ customer_id: user.customer_id, database_type: user.database_type }));

    if (reportdetailofgroupId) {
      if (!reports.length || !reportdetailofgroupId?.length) return;
      const assignedReports = reportdetailofgroupId?.filter(item => item.group_id === groupid);
      const updatedReports = reports.map(report => {
        const assignedReport = assignedReports.find(item => item.report_id === report.report_id);
        return {
          ...report,
          edit: assignedReport?.access_mask.includes('e') || false,
          delete: assignedReport?.access_mask.includes('d') || false,
          export: assignedReport?.access_mask.includes('p') || false,
          view: assignedReport?.access_mask.includes('v') || false,
          adminMode: assignedReport?.access_mask.includes('p') && assignedReport?.access_mask.includes('e') && assignedReport?.access_mask.includes('d') && assignedReport?.access_mask.includes('v') || false,
          group_id: groupid
        };
      });
      setReports(updatedReports);
    }
  };


  // const handleSelectGroup = (groupid) => {
  //   if (!reports.length || !reportdetailofgroupId?.length) return;
  //   const assignedReports = reportdetailofgroupId.filter(item => item.group_id === groupid);
  //   const updatedReports = reports.map(report => {
  //     const assignedReport = assignedReports.find(item => item.report_id === report.report_id);
  //     return {
  //       ...report,
  //       edit: assignedReport?.access_mask.includes('e') || false,
  //       delete: assignedReport?.access_mask.includes('d') || false,
  //       export: assignedReport?.access_mask.includes('p') || false,
  //       view: assignedReport?.access_mask.includes('v') || false,
  //       adminMode: ['p', 'e', 'd', 'v'].every(flag => assignedReport?.access_mask.includes(flag)),
  //       group_id: groupid
  //     };
  //   });

  //   setReports(updatedReports);
  // };

  const accessMap = {
    export: 'p',
    edit: 'e',
    delete: 'd',
    view: 'v'
  };

  const handelsavereport = async () => {
    const userConfirmed = await ShowAlert({
      title: "Confirmation",
      message: "Are you sure Want to Assign Reports?",
      options: ["OK", "Cancel"]
    });
    if (userConfirmed === "OK") {
      if (reports[0].group_id != null) {
        const result = reports.map(item => {
          const access = Object.keys(accessMap).filter(key => item[key]).map(key => accessMap[key]).join('');
          return { report_id: item.report_id, access: access };
        });
        if (result.length > 0) {
          let payloadform = {
            group_id: reports[0].group_id,
            database_type: user.database_type,
            email: user.user_email_id,
            report_ids: result.map((item) => item.report_id),
            access_masks: result.map(item => item.access === '' ? 'null' : item.access)
          }
          if (Object.keys(payloadform).length > 0) {
            dispatch(assignreporttothegroup(payloadform, history))
          }
        }
      } else {
        toast.success("can you plealse select any of the group", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
      }
    }
  }


  const handelclickgotoDashboard = () => {
    history('/Dashboard')
  }

  const handleclickgotoUserManagement = () => {
    history("/UserManagementList");
  };

  const handleClickGoBackToFeatureAssignPage = () => {
    history("/FeatureAssignpage");
  };




  return (
    <div>
      <div className="side-nav"><Header /></div>
      <div className="Test_report_to_group">
        <div className="Page-Header">
          <span
            class="fas fa-house-user"
            aria-hidden="true"
            onClick={handelclickgotoDashboard}
          ></span>
          {/*new change */}
          <span>/</span>
          <span
            style={{ cursor: "pointer" }}
            onClick={handleclickgotoUserManagement}
          >
            {" "}
            User Management
          </span>
          <span>/</span>
          <span
            style={{ cursor: "pointer" }}
            onClick={handleClickGoBackToFeatureAssignPage}
          >
            {" "}
            Access Features
          </span>
          {/*new change */}
          <span>/</span>
          <span> Assign Reports To Group</span>
        </div>
        <div className='Test_report_displayed'>
          <div className='Test_report_sub_container'>
            <div className='Test_report_button_cnt'>
              <Button onClick={handelsavereport}>Save</Button>
              {/* <Button>Reset</Button> */}
            </div>
          </div>

          <div className='feature_report_displayed'>
            <div
              className="feature_report_displayed_subContainer"
            >
              <Tabs
                activeTab={activeTab}
                onTabClick={onTabClick}  // Correctly passing the function
                hideNavBtnsOnMobile={false}
                leftBtnIcon={
                  <FiChevronLeft
                    size={"1.5em"}
                    style={{
                      color: "black",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  />
                }
                rightBtnIcon={
                  <FiChevronRight
                    size={"1.5em"}
                    style={{
                      color: "black",
                      display: "inline-block",
                      verticalAlign: "middle",
                    }}
                  />
                }
              >
                {listofallgroup.map((tab, index) => (
                  <Tab key={index}>
                    {tab.groupname}
                  </Tab>
                ))}
              </Tabs>
            </div>
          </div>

        </div>
        <div>

        </div>
        <div className='Test_report_table_container'>
          <table className='responsive-table'>
            <thead>
              <tr className="table-header ">
                <th><span className='Test_Report_search'>
                  <span className="fa fa-search form-control-feedback"></span>
                  <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /></span></th>
                <th style={{ textAlign: "center" }}>Edit</th>
                <th style={{ textAlign: "center" }}>Delete</th>
                <th style={{ textAlign: "center" }}>Export</th>
                <th style={{ textAlign: "center" }}>View</th>
                <th style={{ textAlign: "center" }}>Admin Mode</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData && paginatedData.map((report) => (
                <tr key={report.report_id}>
                  <td>{report.name}</td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={report.edit}
                      onChange={() => handleCheckboxChange(report.report_id, "edit")}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={report.delete}
                      onChange={() => handleCheckboxChange(report.report_id, "delete")}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={report.export}
                      onChange={() => handleCheckboxChange(report.report_id, "export")}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={report.view}
                      onChange={() => handleCheckboxChange(report.report_id, "view")}
                    />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={report.adminMode}
                      onChange={() => handleCheckboxChange(report.report_id, "adminMode")}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <Pagination
            className="pagination-bar"
            currentPage={currentPage}
            totalCount={filteredData ? filteredData.length : 1}
            pageSize={PageSize}
            onPageChange={page => setCurrentPage(page)}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportManagement;
