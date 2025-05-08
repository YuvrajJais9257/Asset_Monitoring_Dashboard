/*modified by Yuvraj Jaiswal */
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Header from "../header";
import "./../globalCSS/reportscheduler/reportschedulerlist.css";
import "./../globalCSS/dashboardmanagement/ListTable.css"
import "./../globalCSS/dashboardmanagement/DownloadButton.css"
import { Button } from "./../globalCSS/Button/Button";
import {
  listofSchedulereport,
  removeschedulereport,
} from "../../actions/reportscheduler";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "./../Pagination/Pagination";
import * as XLSX from "xlsx";
import ShowAlert from "../../actions/ShowAlert";
import { decryptData } from '../utils/EncriptionStore';

function ReportSchedulerList() {
  const history = useNavigate();
  const location = useLocation();
  console.log(location, "location");
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");

  // get the schedule reports throught the reduler
  const apiData = useSelector((state) => state);
  const schedulereportdetail = apiData?.reportscheduler?.allScheduleReportDetail;

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  // this useEffect help to dispatch the list of schedule reports
  useEffect(() => {
    // const shemaDetail = JSON.parse(localStorage.getItem('SelectedSchema'));
    dispatch(
      listofSchedulereport({
        database_type: user.database_type,
        customer_id: user.customer_id,
        group_id: user.group_id,
      })
    );
  }, []);

  let PageSize = 5;

  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search) return schedulereportdetail;
    return schedulereportdetail?.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, schedulereportdetail]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);

  const useraccessmask = user.features.filter(
    (item) =>
      item.featurename === "Report Scheduler" && user.group_id === item.group_id
  );
  let selectaccessmask;
  if (useraccessmask.length > 0) {
    selectaccessmask = [...useraccessmask[0].accessmask];
  }

  useEffect(() => {
    const editButtons = document.getElementsByClassName("fa-pen-to-square");
    const removeButtons = document.getElementsByClassName("fa-trash-can");
    const addingnewschedulereport = document.getElementsByClassName(
      "adding_new_schedule_report"
    );

    const addingnewuserntothegroup = ["a"].every((value) =>
      selectaccessmask.includes(value)
    );
    const allValuesExist = ["e"].every((value) =>
      selectaccessmask.includes(value)
    );
    const allValuesExist3 = ["d"].every((value) =>
      selectaccessmask.includes(value)
    );

    // Function to update button styles and classes
    const updateButtonStyles = (
      buttons,
      condition,
      disabledClass,
      enabledClass
    ) => {
      Array.from(buttons).forEach((button) => {
        if (!condition) {
          button.style.pointerEvents = "none";
          button.style.color = "grey"; // Hide the button if access mask does not have required value
          button.style.display = "none"; // Hide the button
          button.classList.add(disabledClass);
        } else {
          button.style.pointerEvents = "auto"; // Enable pointer events
          button.style.display = "inline"; // Show the button
          button.classList.add(enabledClass);
        }
      });
    };

    // Show or hide the edit buttons based on access mask
    updateButtonStyles(
      editButtons,
      allValuesExist,
      "edit-button-disabled",
      "edit-button-enabled"
    );

    // Show or hide the adding new schedule report buttons based on access mask
    updateButtonStyles(
      addingnewschedulereport,
      addingnewuserntothegroup,
      "edit-button-disabled",
      "edit-button-enabled"
    );

    // Show or hide the remove buttons based on access mask
    updateButtonStyles(
      removeButtons,
      allValuesExist3,
      "edit-button-disabled",
      "edit-button-enabled"
    );
  }, [selectaccessmask]);

  useEffect(() => {
    setCurrentPage(1); // Reset to the first page when search term changes
  }, [search]);
  // export the schedule reports in excel formate
  const handleExport = () => {
    exportExcel(schedulereportdetail,"ListofScheduleReports");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(schedulereportdetail);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    XLSX.writeFile(workbook, "ListofScheduleReports.xlsx");
  };


  const handelclickgotoDashboard = () => {
    history("/Dashboard");
  };

  // it help to handel the remove schedule report
  const handelremoveReport = async (schedulerid) => {
    try {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Are you sure you want to delete this Scheduled Report?",
        options: ["OK", "Cancel"],
      });
      if (userConfirmed === "OK") {
        dispatch(
          removeschedulereport({
            scheduleid: schedulerid,
            customer_id: user.customer_id,
            database_type:user.database_type,
          })
        )
          .then(() => {
            const remainingReports = filteredData.length - 1;
            const lastPageIndex = (currentPage - 1) * PageSize;
            if (remainingReports <= lastPageIndex && currentPage > 1) {
              setCurrentPage(currentPage - 1);
            }
          })
          .catch((error) => {
            console.error("Error removing report:", error);
          });
      } else {
        console.log("User canceled the operation.");
      }
    } catch (error) {
      console.error("Error removing Schedule report:", error);
    }
  };

  return (
    <div>
      <div className="side-nav">
        <Header />
      </div>
      <div className="report-scheduler-container">
      <div className="Page-Header">
        <span class="fas fa-house-user" aria-hidden="true" onClick={handelclickgotoDashboard}></span>
        <span>/</span><span>Scheduled Reports for Dashboard</span>
        <Button className='Report_scheduler_Button' onClick={() => history('/ReportSchedulerNew')}>New Scheduler for DashBoard Report</Button>
      </div>
      <div className='Report_scheduler_container'>


        <div className="table-top">
          <div className="right-side-elements">
            <div className="download-container">
              <button className="download-btn" onClick={handleExport}>
                <i className="fas fa-download download-icon" style={{ fontSize: '16px' }}></i>
              </button>
            </div>

            <div className="search-container">
              <input
                type="text"
                placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)}
                className="search-box"
              />
              <svg
                className="search-icon"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                width="16"
                height="16"
              >
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>



        <div className='Report_scheduler_table_content'>
          {/* <div className='report-scheduler-List_table_sub_container'> */}
            <table id='table-to-excel' className="responsive-table">
              <thead>
                <tr className="table-header">
                  <th>Report Title</th>
                  <th>Scheduled Report</th>
                  <th>Scheduler Period</th>
                  <th>Email To</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData && paginatedData?.map((schedulertpid, index) => (
                  <tr>
                    <td>{schedulertpid?.report_title}</td>
                    <td>{schedulertpid?.scheduled_time?.replace('T', ' ')}</td>
                    <td>{schedulertpid?.scheduler_period}</td>
                    <td>{schedulertpid?.emailid.slice(1, -1).split(',').map(email => email.trim().replace(/"/g, '')).join(', ')}</td>
                    <td>
                      <Link to={`/ReportSchedulerUpdate?scheduleid=${schedulertpid?.scheduled_id}`} className="fa-solid fa-pen-to-square edit-button">
                        <span style={{ fontSize: "15px", marginLeft: "3px" }}></span></Link>
                      <i onClick={() => handelremoveReport(schedulertpid?.scheduled_id)} class="fa-solid fa-trash-can delete-button"></i>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          {/* </div> */}
        </div>
      </div>
      <div>
        <Pagination
          className="pagination-bar"
          currentPage={currentPage}
          totalCount={filteredData ? filteredData.length : 1}
          pageSize={PageSize}
          onPageChange={page => setCurrentPage(page)}
        /></div>
        </div>
    </div>
  )
}

export default ReportSchedulerList;
