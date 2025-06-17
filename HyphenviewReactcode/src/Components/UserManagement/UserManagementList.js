/*modified by Yuvraj Jaiswal */
import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./../globalCSS/usermanagement/usermanagementlist.css";
import "./../globalCSS/dashboardmanagement/ListTable.css"
import "./../globalCSS/dashboardmanagement/DownloadButton.css"
import { listOfuser, deleteUser } from "../../actions/usermanagement";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "./../Pagination/Pagination";
import { Dropdown } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import ShowAlert from "../../actions/ShowAlert";
import { decryptData } from '../utils/EncriptionStore';
import { exportExcel } from '../utils/ExportExcel';
//today change
import { toggleTheme } from "../../actions/new_dashboard";
import { Sun, Moon } from "lucide-react";

function UserManagementList() {
  const history = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const apiData = useSelector((state) => state.usermanagement);
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();


  const requiredValues = ["a", "e", "d", "v"];
  const reportsManagementObject = user.features.find(
    (obj) =>
      obj.featurename === "User Management" && user.group_id === obj.group_id
  );
  const useraccessmask = user.features.filter(
    (item) =>
      item.featurename === "User Management" && user.group_id === item.group_id
  );
  const accessMask = useraccessmask?.[0]?.accessmask || "";

  const deleteButtonStyle = {
    cursor: "pointer",
    pointerEvents: accessMask.includes("d") ? "auto" : "none",
    backgroundColor: accessMask.includes("d") ? "#f44336" : "grey",
  };

  const editButtonStyle = {
    cursor: "pointer",
    pointerEvents: accessMask.includes("e") ? "auto" : "none",
    backgroundColor: accessMask.includes("e") ? "#4caf50" : "grey",
  };

  const handelclickgotoDashboard = () => {
    history("/Dashboard");
  };
  useEffect(() => {
    setCurrentPage(1); 
  }, [search]);

  const handelclickAddNewReport = () => {
    history("/NewUser");
  };

  useEffect(() => {
    dispatch(
      listOfuser({ email: user.user_email_id, database_type: user.database_type}, history)
    );
  }, []);


  const listofalluser =
    Array.isArray(apiData?.allUserDetail) && apiData?.allUserDetail.length > 0
      ? apiData?.allUserDetail.some((item) => item.groupname === "SuperAdmin" && user.groupname === "SuperAdmin")
        ? apiData?.allUserDetail 
        : apiData?.allUserDetail.filter((item) => item.groupname !== "SuperAdmin")
      : [];

  let PageSize = 5;

  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search) return listofalluser;
    return listofalluser?.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, listofalluser]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);

  const handelclicktoAssignation = () => {
    history("/FeatureAssignpage");
  };

  const handelclickGroupupdate = () => {
    history("/UpdateGroup");
  };
  const handelclickGroupManagement = () => {
    history("/GroupManagement");
  };

  const handelclickGroupSourceManagement = () => {
    history('/datasourceaccess')
  }

  const handelclick = async (e) => {
    try {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Are you sure you want to delete this user?",
        options: ["OK", "Cancel"],
      });
      if (userConfirmed === "OK") {
        dispatch(deleteUser({ email: e, database_type: user.database_type }, history))
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

  const handleExport = () => {
    exportExcel(listofalluser,"ListofUsers");
  };

  //today change
    const app_theme = useSelector((state) => state.theme);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };


  return (
    <div>
      <div className="side-nav">
        <Header />
      </div>
      <div className="user_management_page">
        {/*today change */}
        <div className="list_management_header">
          <div className="Page-Header">
            <span
              className="fas fa-house-user"
              aria-hidden="true"
              onClick={handelclickgotoDashboard}
            ></span>
            <span>/</span>
            <span>User Management</span>
            {requiredValues.every((value) =>
              reportsManagementObject.accessmask.includes(value)
            ) && (
              <div className="dropdown">
                <Dropdown>
                  <Dropdown.Toggle
                    style={{
                      border: "none",
                      backgroundColor: "var(--dropdown-hover)",
                      marginLeft: "5px",
                      color: "var(--text-main)",
                    }}
                    id="dropdown-basic"
                  >
                    User Action
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {requiredValues.every((value) =>
                      reportsManagementObject.accessmask.includes(value)
                    ) && (
                      <>
                        <Dropdown.Item
                          onClick={handelclicktoAssignation}
                          id="accessFeatureId"
                          href="#"
                        >
                          Access Features
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={handelclickAddNewReport}
                          id="newUserId"
                          href="#"
                        >
                          Add New User
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={handelclickGroupupdate}
                          id="groupAssignationId"
                          href="#"
                        >
                          Group Assignation
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={handelclickGroupManagement}
                          id="groupManagementId"
                          href="#"
                        >
                          Group Management
                        </Dropdown.Item>
                        {user.groupname === "SuperAdmin" && (
                          <Dropdown.Item
                            onClick={handelclickGroupSourceManagement}
                            id="datasourceaccess"
                            href="#"
                          >
                            Source Management
                          </Dropdown.Item>
                        )}
                      </>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            )}
          </div>

          <div className="theme-button-container">
            <div
              className={`theme-button ${
                app_theme === "dark" ? "dark" : "light"
              }`}
            >
              <button
                onClick={handleThemeToggle}
                className="toggle-theme-button"
                aria-label="Toggle theme"
              >
                {app_theme === "dark" ? (
                  <Sun className="theme-icon sun-theme-icon" />
                ) : (
                  <Moon className="theme-icon moon-theme-icon" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className='user_management_table_container' style={{ margin: "0 auto" }}>

          <div className="table-top">
            <div className="right-side-elements">
              <div className="download-container">
                <button
                  className="download-btn"
                  onClick={handleExport}
                >
                  <i className="fas fa-download download-icon"></i>
                  {/* <span className="download-text"></span> */}
                </button>
              </div>
              <div className="search-container">
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
          <div className="List_table_sub_container"
            style={{ margin: "0 auto" }}>
            <table
              id="table-to-excel"
              className="responsive-table"
            >
              <thead>
                <tr className="table-header">
                  <th>User Email Id</th>
                  <th>Group Name</th>
                  <th>Status</th>
                  <th>Created Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData &&
                  paginatedData?.map((userdata, index) => (
                    <tr key={index}>
                      <td>{userdata.user_email_id}</td>
                      <td>{userdata.groupname}</td>
                      <td>{userdata.user_status}</td>
                      <td>{userdata.user_creation_date.split(".")[0].replace("T", " ")}</td>
                      <td>
                        <Link
                          to={`/ResetPassword?user_email_id=${userdata.user_email_id}&updateemail_pass=usermanagement`}
                          style={editButtonStyle}
                          className="fa-solid fa-pen-to-square edit-button"
                        >
                          <span
                            style={{ fontSize: "15px", marginLeft: "3px" }}
                          ></span>
                        </Link>

                        <i className="fa-solid fa-trash-can delete-button" onClick={() => handelclick(userdata.user_email_id)} style={deleteButtonStyle}></i>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
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
  );
}

export default UserManagementList;
