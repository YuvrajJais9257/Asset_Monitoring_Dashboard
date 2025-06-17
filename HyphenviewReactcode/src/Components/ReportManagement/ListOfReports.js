/*modified by Yuvraj Jaiswal */
import React, { useEffect, useMemo, useState } from "react";
import Header from "../header";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import "./../globalCSS/reportmanagement/listofreports.css";
import "./../globalCSS/dashboardmanagement/ListTable.css";
import "./../globalCSS/dashboardmanagement/DownloadButton.css";
import {
  getreporttitlefromondashbaord,
  removereport,
  generateChartTypeReportbefore,
  defaultexport,
} from "../../actions/reportmanagement";
import { useDispatch, useSelector } from "react-redux";
import Pagination from "./../Pagination/Pagination";
import { Button } from "./../globalCSS/Button/Button";
import "bootstrap/dist/css/bootstrap.min.css";
import ShowAlert from "../../actions/ShowAlert";
import { decryptData } from "../utils/EncriptionStore";
import { exportExcel } from "../utils/ExportExcel";

/*today change */
import { Sun, Moon } from "lucide-react";
import { toggleTheme } from "../../actions/new_dashboard";

function ListOfReports() {
  const history = useNavigate();
  const dispatch = useDispatch();
  const [search, setSearch] = useState("");
  const apiData = useSelector((state) => state);
  const reportdetail = apiData?.reportmanagement?.allReportDetail;

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const useraccessmask = user.features.filter(
    (item) =>
      item.featurename === "Report Management" &&
      user.group_id === item.group_id
  );
  let selectaccessmask;
  if (useraccessmask.length > 0) {
    selectaccessmask = [...useraccessmask[0].accessmask];
  }

  useEffect(() => {
    const createreportproperty = document.getElementsByClassName(
      "newReport_create_access"
    );
    const addingnewreport = ["a"].every((value) =>
      selectaccessmask.includes(value)
    );
    Array.from(createreportproperty).forEach((button) => {
      if (!addingnewreport) {
        button.style.display = "none";
      } else {
        button.style.display = "inline";
      }
    });
  }, [selectaccessmask]);

  useEffect(() => {
    dispatch(generateChartTypeReportbefore());
    dispatch(defaultexport());
    dispatch(
      getreporttitlefromondashbaord({
        database_type: user.database_type,
        email: user.user_email_id,
        customer_id: user.customer_id,
        group_id: user.group_id,
      })
    );
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handelclickgotoDashboard = () => {
    history("/Dashboard");
  };

  const handelclickAddNewReport = () => {
    history("/ApexChart");
  };

  let PageSize = 5;

  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = useMemo(() => {
    if (!search) return reportdetail;
    return reportdetail?.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );
  }, [search, reportdetail]);

  const paginatedData = useMemo(() => {
    const firstPageIndex = (currentPage - 1) * PageSize;
    const lastPageIndex = firstPageIndex + PageSize;
    return filteredData?.slice(firstPageIndex, lastPageIndex);
  }, [currentPage, filteredData, PageSize]);

  const handelremoveReport = async (event) => {
    try {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Are you sure you want to delete this Report?",
        options: ["OK", "Cancel"],
      });
      if (userConfirmed === "OK") {
        dispatch(
          removereport(
            {
              report_id: event,
              database_type: user.database_type,
              customer_id: user.customer_id,
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
      console.error("Error removing Schedule report:", error);
    }
  };

  const handleExport = () => {
    exportExcel(reportdetail, "Listofreports");
  };

  useEffect(() => {
    let sessionTimeout = setTimeout(() => {
      history("/");
    }, 20 * 60 * 1000);

    const resetTimer = () => {
      clearTimeout(sessionTimeout);
      sessionTimeout = setTimeout(() => {
        history("/");
      }, 20 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    return () => {
      clearTimeout(sessionTimeout);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [history]);

  /*today change */
  const app_theme = useSelector((state) => state?.theme);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <div>
      <div className="side-nav">
        <Header />
      </div>
      <div className="Report_Management_List">
        {/*today change */}
        <div className="list_management_header">
          <div className="Page-Header">
            <span
              class="fas fa-house-user"
              aria-hidden="true"
              onClick={handelclickgotoDashboard}
            ></span>
            <span>/</span>Report Management
            <Button
              className="newReport_create_access"
              onClick={handelclickAddNewReport}
            >
              New Report
            </Button>
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
        <div style={{ width: "calc(100vw - 120px)" }}>
          <div className="table-top">
            <div className="right-side-elements">
              <div className="download-container">
                <button className="download-btn" onClick={handleExport}>
                  <i
                    className="fas fa-download download-icon"
                    style={{ fontSize: "16px" }}
                  ></i>
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

          <div className="report-management-List_table_sub_container">
            <table id="table-to-excel" className="responsive-table">
              <thead>
                <tr className="table-header">
                  <th>Report Name</th>
                  <th>Report Type</th>
                  <th>Chart Type</th>
                  <th>Drildown</th>
                  <th>Source</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData &&
                  paginatedData?.map((reportdata, index) => (
                    <tr key={index}>
                      <td>{reportdata.report_name}</td>
                      <td>{reportdata.report_type}</td>
                      <td>
                        {" "}
                        {reportdata.report_type === "Table"
                          ? "table"
                          : reportdata.report_type === "Box"
                          ? "box"
                          : reportdata.chart_type || "chart"}
                      </td>
                      <td>{reportdata.drilldown || "no"}</td>
                      <td>{reportdata.db_schema_name}</td>
                      <td>
                        {reportdata.report_type === "Table" ||
                        reportdata.report_type === "Merged" ? (
                          <span>
                            {" "}
                            <Link
                              id={`customeidwithtable${reportdata.report_id}`}
                              to={`/UpdateReportPage?report_id=${reportdata.report_id}`}
                              style={{
                                fontWeight: "20px",
                                pointerEvents: reportdata.access_mask.includes(
                                  "e"
                                )
                                  ? "auto"
                                  : "none",
                                backgroundColor:
                                  reportdata.access_mask.includes("e")
                                    ? "#4caf50"
                                    : "grey",
                              }}
                              className="fa-solid fa-pen-to-square edit-button"
                              onClick={(e) => {
                                if (!reportdata.access_mask.includes("e")) {
                                  e.preventDefault(); // Prevent navigation if 'e' is not in access_mask
                                }
                              }}
                            >
                              <span
                                style={{ fontSize: "15px", marginLeft: "3px" }}
                              ></span>
                            </Link>
                            <Link
                              to={`/GenerateReport?report_id=${reportdata.report_id}`}
                              id={`customeidgeneratewithtable${reportdata.report_id}`}
                              style={{
                                fontWeight: "20px",
                                pointerEvents: reportdata.access_mask.includes(
                                  "v"
                                )
                                  ? "auto"
                                  : "none",
                                backgroundColor:
                                  reportdata.access_mask.includes("v")
                                    ? "#eea944"
                                    : "grey",
                              }}
                              className="fa-solid fa-download download-button"
                              onClick={(e) => {
                                if (!reportdata.access_mask.includes("v")) {
                                  e.preventDefault(); // Prevent navigation if "v" is not in access_mask
                                }
                              }}
                            >
                              <span
                                style={{ fontSize: "13px", marginLeft: "3px" }}
                              ></span>
                            </Link>
                            <i
                              style={{
                                cursor: reportdata.access_mask.includes("d")
                                  ? "pointer"
                                  : "not-allowed",
                                backgroundColor:
                                  reportdata.access_mask.includes("d")
                                    ? "#f44336"
                                    : "grey",
                              }}
                              id={`customeidremovewithtable${reportdata.report_id}`}
                              onClick={(e) => {
                                if (reportdata.access_mask.includes("d")) {
                                  handelremoveReport(reportdata.report_id);
                                } else {
                                  e.preventDefault(); // Prevent action if "d" is missing
                                }
                              }}
                              className="fa-solid fa-trash-can delete-button"
                            ></i>
                          </span>
                        ) : (
                          <span>
                            {/* Edit Button (Controlled by "e") */}
                            <Link
                              id={`customeidwithchart${reportdata.report_id}`}
                              to={`/UpdateReportPage?report_id=${reportdata.report_id}`}
                              style={{
                                fontWeight: "20px",
                                cursor: reportdata.access_mask.includes("e")
                                  ? "pointer"
                                  : "not-allowed",
                                backgroundColor:
                                  reportdata.access_mask.includes("e")
                                    ? "#4caf50"
                                    : "grey",
                              }}
                              className="fa-solid fa-pen-to-square edit-button"
                              onClick={(e) => {
                                if (!reportdata.access_mask.includes("e"))
                                  e.preventDefault();
                              }}
                            >
                              <span
                                style={{ fontSize: "15px", marginLeft: "3px" }}
                              ></span>
                            </Link>

                            {/* View Button (Controlled by "v" only) */}
                            {reportdata.report_type === "Chart" ? (
                              <Link
                                id={`customeidwithchart${reportdata.report_id}`}
                                to={`/ShowChartReport?report_id=${reportdata.report_id}`}
                                style={{
                                  fontWeight: "20px",
                                  textDecoration: "none",
                                  cursor: reportdata.access_mask.includes("v")
                                    ? "pointer"
                                    : "not-allowed",
                                  backgroundColor:
                                    reportdata.access_mask.includes("v")
                                      ? "#4bb9da"
                                      : "grey",
                                }}
                                className="fa-solid fa-eye hide-button"
                                onClick={(e) => {
                                  if (!reportdata.access_mask.includes("v"))
                                    e.preventDefault();
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "15px",
                                    marginLeft: "3px",
                                  }}
                                ></span>
                              </Link>
                            ) : (
                              <Link
                                id={`customeidwithbox${reportdata.report_id}`}
                                to={`/ShowBoxchart?report_id=${reportdata.report_id}`}
                                style={{
                                  fontWeight: "20px",
                                  textDecoration: "none",
                                  cursor: reportdata.access_mask.includes("v")
                                    ? "pointer"
                                    : "not-allowed",
                                  backgroundColor:
                                    reportdata.access_mask.includes("v")
                                      ? "#4bb9da"
                                      : "grey",
                                }}
                                className="fa-solid fa-eye hide-button"
                                onClick={(e) => {
                                  if (!reportdata.access_mask.includes("v"))
                                    e.preventDefault();
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "15px",
                                    marginLeft: "3px",
                                  }}
                                ></span>
                              </Link>
                            )}

                            {/* Delete Button (Controlled by "d") */}
                            <i
                              id={`customeidremovewithchart${reportdata.report_id}`}
                              style={{
                                cursor: reportdata.access_mask.includes("d")
                                  ? "pointer"
                                  : "not-allowed",
                                backgroundColor:
                                  reportdata.access_mask.includes("d")
                                    ? "#f44336"
                                    : "grey",
                              }}
                              className="fa-solid fa-trash-can delete-button"
                              onClick={(e) => {
                                if (reportdata.access_mask.includes("d")) {
                                  handelremoveReport(reportdata.report_id);
                                } else {
                                  e.preventDefault();
                                }
                              }}
                            ></i>
                          </span>
                        )}
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

export default ListOfReports;
