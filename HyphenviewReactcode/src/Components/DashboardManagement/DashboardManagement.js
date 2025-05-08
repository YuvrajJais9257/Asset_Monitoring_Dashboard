import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { listofgroup } from "../../actions/newgroup";
import { useDispatch, useSelector } from "react-redux";
import "./../globalCSS/dashboardmanagement/dashboardmanagement.css";
import { useNavigate } from "react-router-dom";
import { Button } from "../globalCSS/Button/Button";
import { Tab, Tabs } from "react-tabs-scrollable";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import {
  listofdashboardframenamewithdistiinct,
  listofaccessmask,
  updateaccessofdashboard,
} from "../../actions/canvascreation";
import styles from "./../globalCSS/SearchTable/SearchTable.module.css";
import Pagination from "../Pagination/Pagination";
import { toast } from 'react-toastify';
import { decryptData } from "../utils/EncriptionStore";
import "./../globalCSS/dashboardmanagement/ListTable.css"
import "./../globalCSS/dashboardmanagement/DownloadButton.css"
import "./../globalCSS/NewDashboard/NewTabs.css";
import { Box, CircularProgress } from "@mui/material";

// Auther:- Ashish Kumar
function DashboardManagement() {
  const dispatch = useDispatch();
  const history = useNavigate();

  // Local state variables
  const [addnewgroup, setaddnewgroup] = useState();
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [listofframe, setFramedetail] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [checkboxStates, setCheckboxStates] = useState({}); //yuvraj

  // Fetch user data from local storage
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  // Fetch data from Redux store
  const apiData = useSelector((state) => state);
  const listofallgroup =
    Array.isArray(apiData?.newgroup?.list_of_group) && apiData.newgroup.list_of_group.length > 0
      ? apiData.newgroup.list_of_group.some((item) => item.groupname === "SuperAdmin" && user.groupname === "SuperAdmin") // Check if any item matches user.groupname
        ? apiData.newgroup.list_of_group // If a match is found, leave the array unchanged
        : apiData.newgroup.list_of_group.filter((item) => item.groupname !== "SuperAdmin") // Otherwise, filter out items with groupname "SuperAdmin"
      : [];



  useEffect(() => {
    const queryParameters = new URLSearchParams(window.location.search);
    const group_id = Number(queryParameters.get("group_id"));
    setaddnewgroup(group_id)
    const timeoutId = setTimeout(() => {
      if (apiData?.newgroup?.list_of_group && group_id) {
        const index = apiData?.newgroup?.list_of_group.findIndex(item => item.group_id === group_id);
        if (index !== -1) {
          setActiveTab(index);
          dispatch(listofaccessmask({ customer_id: user.customer_id, group_id: group_id,database_type:user.database_type }));
        } else {
          console.log("User group ID not found in tabs.");
        }
      } else {
        console.log("Tabs or user group ID not available.");
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [apiData?.newgroup?.list_of_group]);

  const listofdashboardsname =
    apiData?.canvascreation?.listofdashboardcanvasframewithdisnict?.dashboards;

  const listofdash =
    apiData?.canvascreation?.listofdashboardcanvasaccess?.frame;




  const [defaultDashboardName, setDefaultDashboardName] = useState([]);


  const handleDefaultCheckboxChange = (dashboardName, inputValue) => {
    setDefaultDashboardName((prev) => {
      const trimmedInput = inputValue.trim();

      if (trimmedInput === "") {
        return prev.map((item) =>
          item.dashboard_name === dashboardName
            ? { ...item, index: null }
            : item
        );
      }

      const isIndexUsed = prev.some(
        (item) => item.index === trimmedInput && item.dashboard_name !== dashboardName
      );

      if (isIndexUsed) {
        toast.error(`The index ${trimmedInput} is already assigned to another dashboard.`, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "light",
        });
        return prev;
      }


      const existingDashboard = prev.find(
        (item) => item.dashboard_name === dashboardName
      );

      if (existingDashboard) {
        return prev.map((item) =>
          item.dashboard_name === dashboardName
            ? { ...item, index: trimmedInput }
            : item
        );
      } else {
        return [...prev, { dashboard_name: dashboardName, index: trimmedInput }];
      }
    });
  };

  // Initialize frame details based on dashboards name list
  useEffect(() => {
    if (listofdashboardsname) {
      const updatedReports =
        listofdashboardsname &&
        listofdashboardsname.map((dashboardname) => ({
          name: dashboardname.dashboard_report_name,
          read: false,
          write: false,
          adminMode: false,
        }));
      setFramedetail(updatedReports);
      setIsLoading(false);
    }
  }, [listofdashboardsname]);

  // Filter and paginate the table data
  let PageSize = 5;

  const filteredData = useMemo(() => {
    if (!search) return listofframe;
    return listofframe?.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, listofframe]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);

  const accessMap = {
    read: "r",
    write: "w",
  };

  // Handle checkbox change for read, write, and admin mode
  const handleCheckboxChange = (index, key, dashboardname) => {

    if (key === "adminMode" || key === "read") {
      setDefaultDashboardName((prev) => {
        return prev.map((item) =>
          item.dashboard_name === dashboardname
            ? { ...item, index: null }
            : item
        );
      });
    }
   
    setFramedetail((prevReports) => {
      const updatedReports = prevReports.map((report, i) => {
        if (i === index) {
          return { ...report, [key]: !report[key] };
        }
        return report;
      });
      if (key === "adminMode") {
        // If adminMode is checked, set all other checkboxes to true
        if (updatedReports[index].adminMode) {
          updatedReports[index].read = true;
          updatedReports[index].write = true;
        } else {
          // If adminMode is unchecked, set all other checkboxes to false
          updatedReports[index].read = false;
          updatedReports[index].write = false;
        }
      } else {
        // Check if all checkboxes except adminMode are checked
        const allChecked = ["read", "write"].every(
          (checkbox) => updatedReports[index][checkbox]
        );
        updatedReports[index].adminMode = allChecked;
      }
      setCheckboxStates((prev) => ({
        ...prev,
        [index]: updatedReports[index],
      }));
      return updatedReports;
    });
  };

  // Update frame details based on access list
  useEffect(() => {
    if (listofdash) {
      const updatedReports = listofframe?.map((report) => {
        const assignedReport = listofdash?.find(
          (item) => item.dashboard_report_name === report.name
        );
        return {
          ...report,
          read: assignedReport?.access.includes("r") || false,
          write: assignedReport?.access.includes("w") || false,
          adminMode:
            (assignedReport?.access.includes("r") &&
              assignedReport?.access.includes("w")) ||
            false,
          group_id: addnewgroup,
        };
      });

      const checkUpdatedDashboard = listofdash.map((item) => ({
        dashboard_name: item.dashboard_report_name,
        index: item.default_dashboard
      }));


      if (checkUpdatedDashboard.length > 0) {
        setDefaultDashboardName(checkUpdatedDashboard);
      } else {
        setDefaultDashboardName([]);
      }



      setFramedetail(updatedReports);
      setCheckboxStates(
        updatedReports.reduce((acc, item, idx) => {
          acc[idx] = item;
          return acc;
        }, {})
      );
    }
  }, [listofdash]);

  // Fetch initial data for groups and dashboard frames
  useEffect(() => {
    setDefaultDashboardName([]);
    dispatch(
      listofdashboardframenamewithdistiinct({ customer_id: user.customer_id,database_type:user.database_type })
    );
    dispatch(
      listofgroup({ email: user.user_email_id, database_type: user.database_type })
    );
  }, []);

  // Handle group selection
  const handleSelectGroup = async (groupid) => {
    dispatch(
      listofaccessmask({ customer_id: user.customer_id, group_id: groupid,database_type:user.database_type })
    );
    setaddnewgroup(groupid);
  };


  const handelclickgotoDashboard = () => {
    history("/Dashboard");
  };

  // Handle save report action
  const handelsavereport = async () => {
    const result = listofframe.reduce((acc, item) => {
      const access = Object.keys(accessMap)
        .filter((key) => item[key])
        .map((key) => accessMap[key])
        .join("");

      acc[item.name] = access;
      return acc;
    }, {});
    const defaultDashboard = defaultDashboardName ? defaultDashboardName : [];
    if (Object.keys(result).length > 0) {
      let payloadform = {
        group_id: listofframe[0].group_id,
        database_type: user.database_type,
        dashboard_access: result,
        default_dashboard: defaultDashboard,
        customer_id: user.customer_id,
      };
      if (Object.keys(payloadform).length > 0) {

        dispatch(updateaccessofdashboard(payloadform, history));
      }
    }
  };
  //new change
  const handleclickgotoUserManagement = () => {
    history("/UserManagementList");
  };
  //new change
  const handleClickGoBackToFeatureAssignPage = () => {
    history("/featureassignpage");
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

  return (
    <div>
      <div className="side-nav">
        <Header />
        <div className="DashboardManagement_report_to_group">
          <div className="Page-Header">
            <span
              className="fas fa-house-user"
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
            <span> Assign Dashboard To The Group</span>
          </div>
          <div className="for-row">
            <div className="DashboardManagement_report_sub_container">
              <div className="DashboardManagement_report_button_cnt">
                <Button onClick={handelsavereport}>Save</Button>
              </div>
            </div>


            <div className='DashboardManagement_report_displayed'>
              <div
                className="DashboardManagement_displayed_updation_pavi"
              >
                <div class="feature_report_displayed_subContainer">
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
          </div>
          <div className="DashboardManagement_report_table_container">
            <table
              className="responsive-table"
              style={{ width: "100%" }}
            >
              <thead>


                <tr className="table-header ">

                  <th>
                    <span className="DashboardManagement_Report_search">
                      <span className="fa fa-search form-control-feedback"></span>
                      <input
                        type="text"
                        className={styles.inputSearch}
                        placeholder="Search"
                        value={search}
                        maxLength={120}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </span>
                  </th>

                  <th style={{ textAlign: "center" }}>Dashboard Ordering</th>

                  <th style={{ textAlign: "center" }}>Read</th>

                  <th style={{ textAlign: "center" }}>Write</th>

                  <th style={{ textAlign: "center" }}>Admin Mode</th>
                </tr>
              </thead>

              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                        <CircularProgress />
                      </Box>
                    </td>
                  </tr>
                ) : paginatedData && paginatedData.length > 0 ? (
                  paginatedData.map((item, index) => {
                    const globalIndex = (currentPage - 1) * PageSize + index;
                    return (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td style={{ textAlign: "center" }}>
                          <select
                            style={{
                              width: "180px",
                              border: "1px solid #00000030",
                              borderRadius: "20px",
                              textAlign: "center",
                              height: "35px",
                              cursor: "pointer",
                            }}
                            value={
                              defaultDashboardName.find((val) => val.dashboard_name === item.name)?.index || ""
                            }
                            disabled={!(
                              checkboxStates[globalIndex] ? checkboxStates[globalIndex].read : item.read
                            )}
                            onChange={(e) => handleDefaultCheckboxChange(item.name, e.target.value)}
                          >
                            <option value="">Select</option>

                            {Array.from({ length: listofframe.length }, (_, index) => (
                              <option key={index} value={index + 1}>
                                {index + 1}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={
                              checkboxStates[globalIndex]
                                ? checkboxStates[globalIndex].read
                                : item.read
                            }
                            onChange={() =>
                              handleCheckboxChange(globalIndex, "read", item.name)
                            }
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={
                              checkboxStates[globalIndex]
                                ? checkboxStates[globalIndex].write
                                : item.write
                            }
                            onChange={() =>
                              handleCheckboxChange(globalIndex, "write")
                            }
                          />
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <input
                            type="checkbox"
                            checked={
                              checkboxStates[globalIndex]
                                ? checkboxStates[globalIndex].adminMode
                                : item.adminMode
                            }
                            onChange={() =>
                              handleCheckboxChange(globalIndex, "adminMode", item.name)
                            }
                          />
                        </td>
                      </tr>
                    )
                  })) : (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                      Dashboard Loading....
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="Pagination_Container">
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

export default DashboardManagement;
