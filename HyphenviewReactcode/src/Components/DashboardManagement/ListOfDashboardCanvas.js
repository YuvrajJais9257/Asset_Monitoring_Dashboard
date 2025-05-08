/*modified By Yuvraj Jaiswal */
import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./../globalCSS/dashboardmanagement/listofdashboardcanvas.css";
import "./../globalCSS/dashboardmanagement/ListTable.css"
import "./../globalCSS/dashboardmanagement/DownloadButton.css"
import {
  listofdashboardframename,
  deletecanvashframe,
} from "../../actions/canvascreation";

import { useDispatch, useSelector } from "react-redux";
import Pagination from "./../Pagination/Pagination";
import { Dropdown } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ShowAlert from "../../actions/ShowAlert";
import { decryptData } from '../utils/EncriptionStore';
import { exportExcel } from '../utils/ExportExcel';

// Auther:- ASHISH KUMAR
function ListOfDashboardCanvas() {
  // Hooks for navigation and location
  const history = useNavigate();

  // Redux hooks for dispatching actions and selecting state
  const dispatch = useDispatch();

  // Local state for search input
  const [search, setSearch] = useState("");
  const apiData = useSelector((state) => state);
  const listofdashboardsname =
    apiData?.canvascreation?.listofdashboardcanvasframe;

  // Fetch user profile from localStorage
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const requiredValues = ["a", "e", "d", "v"];
  const reportsManagementObject = user.features.find(
    (obj) => obj.featurename === "Dashboard Management"
  );

  // Fetch dashboard frame names on component mount
  useEffect(() => {
    dispatch(
      listofdashboardframename({
        customer_id: user.customer_id,
        group_id: user.group_id,
        database_type: user.database_type,
      })
    );
  }, []);

  // Handlers for navigation
  const handelclickgotoDashboard = () => {
    history("/Dashboard");
  };

  const handelclickCreateCanvash = () => {
    history("/SplitView");
  };

  const handelclickModifiedCanvash = () => {
    history("/ModifiedCanvasPage");
  };

  let PageSize = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search) return listofdashboardsname;
    return listofdashboardsname?.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, listofdashboardsname]);

  // Handler for deleting a dashboard frame
  const handelremoveDashboardframe = async (value, group_id, groupname) => {
    try {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Are you sure you want to delete this Canvas?",
        options: ["OK", "Cancel"],
      });
      if (userConfirmed === "OK") {
        dispatch(
          deletecanvashframe(
            {
              customer_id: user.customer_id,
              frame_name: value,
              groupname: groupname,
              group_id: group_id,
              database_type: user.database_type,
            },
            history
          )
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
      console.error("Error removing user:", error);
    }
  };

  // Pagination setup

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);

  // Function to export table to Excel
  const handleExport = () => {
    exportExcel(listofdashboardsname,"ListofDashboards");
  };

  useEffect(() => {
    setCurrentPage(1); // Reset to the first page when search term changes
  }, [search]);

  return (
    <div>
      <div className="side-nav">
        <Header />
      </div>
      <div className="Dashboard_Management_List">
        <div className='Page-Header'>
        <span
          class="fas fa-house-user"
          aria-hidden="true"
          onClick={handelclickgotoDashboard}
        ></span>
        <span>/</span>Dashboard Management

        
        {requiredValues.every((value) =>
          reportsManagementObject.accessmask.includes(value)
        ) ? (
          <div class="dropdown hyphenview_manage_users_dropdown">
            <Dropdown>
              <Dropdown.Toggle
                  style={{
                    border: "none",
                    fontSize: "0.875rem !important",
                    marginLeft: "5px",
                  }}
                id="dropdown-basic"
              >
                Canvas
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={handelclickCreateCanvash}
                  id="createbutton"
                  href="#"
                >
                  Create
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        ) : null}
 
 </div>
      <div style={{ width: 'calc(100vw - 120px)' }}>
        <div className='table-top'>
        <div className="right-side-elements hyphenview_download_and_search_container">
          <div className="download-container hyphenview_download_button_container">
            <button
              className="download-btn hyphenview_download-button"
              onClick={handleExport}
            >
              <i className="fas fa-download"></i>
              <span className="download-text"></span>
            </button>
          </div>

          <div className="search-container hyphenview_search">
            <input
              type="text"
              placeholder="Search"
              value={search}
              maxLength={120}
              onChange={(e) => setSearch(e.target.value)}
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
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="16"
                y1="16"
                x2="21"
                y2="21"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
        </div>
        <div className="dashboard-management-List_table_sub_container hyphenview_features_table_container">
          <table
            id="table-to-excel"
            // className='table table-striped table-bordered table-hover'
            className="responsive-table"
          >
            <thead>
              <tr className="table-header">
                <th>Dashboard Name</th>
                <th>Group Name</th>
                <th>Dashboard Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData &&
                paginatedData?.map((reportdata, index) => (
                  <tr key={index}>
                    <td>{reportdata.dashboard_report_name}</td>
                    <td>{reportdata.groupname}</td>
                    <td>{reportdata.dashboard_description}</td>
                    <td>
                      {
                        <span>
                          <i
                            style={{
                              marginLeft: "5px",
                              cursor: "pointer",
                              pointerEvents: ["d"].every((value) =>
                                reportsManagementObject.accessmask.includes(
                                  value
                                )
                              )
                                ? "auto"
                                : "none",
                              backgroundColor: ["d"].every((value) =>
                                reportsManagementObject.accessmask.includes(
                                  value
                                )
                              )
                                ? "#f44336 !important"
                                : "grey",
                            }}
                            onClick={() =>
                              handelremoveDashboardframe(
                                reportdata.dashboard_report_name,
                                reportdata.group_id,
                                reportdata.groupname
                              )
                            }
                            className="fa-solid fa-trash-can delete-button"
                          ></i>
                          <span
                            style={{ fontSize: "15px", marginLeft: "3px" }}
                          ></span>
                          <Link
                            id={`dashboardframemovefy${reportdata.group_id}`}
                            to={`/ModifiedCanvasPage?group_id=${reportdata.group_id}&dashboardreportname=${reportdata.dashboard_report_name}&groupname=${reportdata.groupname}&dashboard_description=${reportdata.dashboard_description} `}
                            style={{
                              fontWeight: "20px",
                              pointerEvents: ["w"].every((value) =>
                                [...reportdata.access].includes(value)
                              )
                                ? "auto"
                                : "none",
                              backgroundColor: ["w"].every((value) =>
                                [...reportdata.access].includes(value)
                              )
                                ? "#45a049 !important"
                                : "grey",
                            }}
                            className="fa-solid fa-pen-to-square 
                            edit-button"
                          ></Link>
                        </span>
                      }
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
            onPageChange={(page) => setCurrentPage(page)}
          />
        </div>
      </div>
      </div>
    </div>
  );
}

export default ListOfDashboardCanvas;
