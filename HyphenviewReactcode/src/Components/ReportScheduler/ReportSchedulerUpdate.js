import React, { useState, useRef, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import './../globalCSS/reportscheduler/reportschedulernew.css';
import { toast } from 'react-toastify';
import { getreporttitlefromondashbaord } from "../../actions/reportmanagement";
import {
  updatescheduleinfo,
  getschedulereportdetailforupdate,
} from "../../actions/reportscheduler";
import {
  FaSearch,
  FaTimesCircle,
} from "react-icons/fa";

import { ReactMultiEmail } from "react-multi-email";
import "react-multi-email/dist/style.css";

import Header from "../header";
import { useDispatch, useSelector } from "react-redux";
import {useNavigate } from "react-router-dom";
import { decryptData } from "../utils/EncriptionStore";

const ReportSchedulerUpdateNew = () => {

  // State variables for managing form inputs and selections
  const [reportTitle, setReportTitle] = useState("");
  const [selectedPdfReports, setSelectedPdfReports] = useState([]);
  const [selectedExcelReports, setSelectedExcelReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState([]);
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [searchPdfReport, setSearchPdfReport] = useState("");
  const [searchExcelReport, setSearchExcelReport] = useState("");

  // State variables for dropdown toggles and email handling
  const [dropdownToggle, setDropdownToggle] = useState(false);
  const [excelDropdownToggle, setExcelDropdownToggle] = useState(false);
  
  // Refs for dropdown elements to detect clicks outside
  const pdfDropdownRef = useRef(null);
  const excelDropdownRef = useRef(null);

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const history = useNavigate();
  const dispatch = useDispatch();
  const apiData = useSelector((state) => state);

  const queryParameters = new URLSearchParams(window.location.search);
  const scheduleidforupdate = queryParameters.get("scheduleid");

  const reportdetail = apiData?.reportmanagement?.allReportDetail;
  const reportupdatedetail =
    apiData?.reportscheduler?.detailofscheduleforupdate;

  const form = useRef();
  const [startDate, setStartDate] = useState(null);
  const [emailTo, setEmailTo] = useState([]);
  const [emailCC, setEmailCC] = useState([]);
  const [invalidEmails, setInvalidEmails] = useState([]);
  let _invalidEmails = [];
  const [emailBody, setEmailBody] = useState("");
  const [interval, setInterval] = useState("Daily");

  // Add event listener for clicks outside dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownToggle && 
          pdfDropdownRef.current && 
          !pdfDropdownRef.current.contains(event.target)) {
        setDropdownToggle(false);
      }
      
      if (excelDropdownToggle && 
          excelDropdownRef.current && 
          !excelDropdownRef.current.contains(event.target)) {
        setExcelDropdownToggle(false);
      }
    }

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownToggle, excelDropdownToggle]);

  // Fetching report titles on component mount
  useEffect(() => {
    dispatch(
      getreporttitlefromondashbaord({
        email: user.user_email_id,
        database_type: user.database_type,
        customer_id: user.customer_id,
        group_id: user.group_id,
      })
    );
  }, []);


  useEffect(() => {
    dispatch(
      getschedulereportdetailforupdate({
        customer_id: user.customer_id,
        scheduleid: scheduleidforupdate,
        database_type: user.database_type,
      })
    );
  }, [scheduleidforupdate]);


  // handel to prefield the data in all form filed
  useEffect(() => {
    if (reportupdatedetail && reportupdatedetail?.Schedulers) {
    
      setReportTitle(reportupdatedetail.Schedulers.report_title);

      if (reportupdatedetail.Schedulers?.reportattachment) {
        try {
          const pdfValue = JSON.parse(
            reportupdatedetail.Schedulers.reportattachment
          ).pdf;
          const seletedreportforpdf = reportdetail.filter((item) => {
            return pdfValue.some((value) => item.report_id === value);
          });

          const valuepdf = seletedreportforpdf.map((report) => ({
            report_id: report.report_id,
            report_name: report.report_name,
          }));

          const xlsValue = JSON.parse(
            reportupdatedetail.Schedulers.reportattachment
          ).xlsx;
          const seletedreportforxls = reportdetail.filter((item) => {
            return xlsValue.some((value) => item.report_id === value);
          });

          const valuexls = seletedreportforxls.map((report) => ({
            report_id: report.report_id,
            report_name: report.report_name,
          }));
          setSelectedPdfReports(valuepdf);
          setSelectedExcelReports(valuexls);
        } catch (error) {
          console.error("Error parsing report attachment:", error);
        }
      } else {
        console.log("report attachment property is undefined.");
      }
      if (reportupdatedetail.Schedulers?.report_ideb) {
        try {
          const parsedID = parseInt(reportupdatedetail.Schedulers.report_ideb);
          const matchedReport = reportdetail.filter(
            (report) => report.report_id === parsedID
          );
          setSelectedReport(matchedReport);
        } catch (error) {
          console.error("Error parsing selected report ID:", error);
        }
      } else {
        console.log("selected report id property is empty string.");
      }
      setSelectedTime(new Date(reportupdatedetail.Schedulers.scheduled_time));
     
      if (reportupdatedetail.Schedulers.start_date != null) {
        setStartDate(new Date(reportupdatedetail.Schedulers.start_date));
      }
      else {
        setStartDate(null);
      }


      setEmailTo(JSON.parse(reportupdatedetail.Schedulers.emailid));
      setEmailCC(JSON.parse(reportupdatedetail.Schedulers.emailcc));
      setEmailBody(reportupdatedetail.Schedulers.email_body_content);
      setInterval(reportupdatedetail.Schedulers.scheduler_period);
    } else {
      console.log("Report detail or Schedulers property is undefined.");
    }
   
  }, [reportupdatedetail]);

  // Handling selection and deselection of PDF reports
  const handleOptionChange = (reportId, reportName) => {
    if (selectedPdfReports.some((report) => report.report_id === reportId)) {
      setSelectedPdfReports((prev) =>
        prev.filter((report) => report.report_id !== reportId)
      );
    } else {
      if (selectedPdfReports.length < 10) {
        setSelectedPdfReports((prev) => [
          ...prev,
          { report_id: reportId, report_name: reportName },
        ]);
      } else {
        toast.success("You can only select up to 10 reports.", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
      }
    }
  };

  // Handling selection and deselection of Excel reports
  const handleExcelOptionChange = (reportid, reportname) => {

    if (selectedExcelReports.some((report) => report.report_id === reportid)) {
      setSelectedExcelReports((prev) =>
        prev.filter((report) => report.report_id !== reportid)
      );
    } else {
      if (selectedExcelReports.length < 10) {
        setSelectedExcelReports((prev) => [
          ...prev,
          { report_id: reportid, report_name: reportname },
        ]);
      } else {
        toast.success("You can only select up to 10 reports.", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
      }
    }
  };

  // Handle date selection for the schedule
  const handleDateChange = (newDate) => {
    if (newDate > new Date()) {
      setSelectedTime(newDate);
    } else {
      setSelectedTime(newDate);
    }
  };

  // Regex for validating email addresses
  const emailRegex =
    /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;

  // Function to remove duplicate emails from the list  
  const removeDuplicates = (list) => Array.from(new Set(list));

  // Handle date selection for the schedule start date
  const handleScheduleDate = (date) => {
    setStartDate(date);
  };


  // Handle form submission for scheduling the report
  const handleEmail = async (e) => {
    e.preventDefault();
    if (emailTo.length == 0)
      toast.success("You need to add atleast one email in Email to Field", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
    else {
      if (selectedExcelReports.length == 0 && selectedPdfReports.length == 0)
        toast.success("You need to select atleast PDF or Excel Format to submit", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
      else {
        const reportattachment = {
          pdf: selectedPdfReports.map((item) => item.report_id),
          xlsx: selectedExcelReports.map((item) => item.report_id),
        };

        const timeString = selectedTime.toLocaleString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        let startdate = null;
        if (startDate != null) {
          startdate = startDate.toISOString().split("T")[0] + " " + timeString;
        }

        const isoDateString = selectedTime.toISOString().split("T")[0];

        const formattedDateTime = isoDateString + " " + timeString;

        const selectedreport =
          selectedReport.length > 0 ? selectedReport[0].report_id : null;
        const dataEntries = {
          scheduleid: scheduleidforupdate,
          customer_id: user.customer_id,
          reportTitle,
          reportattachment,
          selectedreport,
          scheduledTime: formattedDateTime,
          emailTo: emailTo,
          emailBody,
          emailCC: emailCC,
          interval,
          startDate: startdate,
          database_type:user.database_type,
        };
        if (emailTo.length == 0) {
          toast.success("Please Input EmailTo Address", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });

        }
        else {
      
          dispatch(updatescheduleinfo(dataEntries, history));
        }
      }
    }
  };

  // Handle selection of a report from the dropdown
  const handleReportChange = (value) => {
    const report = reportdetail.filter((item) => item.report_name === value);
    setSelectedReport(report);
  };

  // Toggle visibility of the PDF report dropdown
  const handlePdfToggle = () => {
    setDropdownToggle(!dropdownToggle);
    setExcelDropdownToggle(false);
  };

  // Toggle visibility of the Excel report dropdown
  const handleExcelToggle = () => {
    setExcelDropdownToggle(!excelDropdownToggle);
    setDropdownToggle(false);
  };

  // Close all dropdowns
  const handleReportToggle = () => {
    setDropdownToggle(false);
    setExcelDropdownToggle(false);
  };

  // Filter reports based on search input for PDF reports
  const filteredPdfReports = reportdetail.filter((report) =>
    report.report_name.toLowerCase().includes(searchPdfReport.toLowerCase())
  );

  // Filter reports based on search input for Excel reports
  const filteredExcelReports = reportdetail.filter((report) =>
    report.report_name.toLowerCase().includes(searchExcelReport.toLowerCase())
  );

  // Redirect to dashboard
  const handelclickgotoDashboard = () => {
    history('/Dashboard')
  }

  const handleClickGoToReportScheduler = () => {
    history("/ReportSchedulerList");
  };
  
  const handleclosebyclickoutside = () => {
    setDropdownToggle(false)
    setExcelDropdownToggle(false)
  }

  return (
    <div className="ReportSchedulerUpdate-Container">
      <div id="header" className="side-nav">
        <Header />
      </div>
      <div id="big-container">
        <div className="schedule_report_container">
          <span class="fas fa-house-user" onClick={handelclickgotoDashboard}></span><span>/</span>
          <span onClick={handleClickGoToReportScheduler}>Scheduled Reports For Dashboard</span>
          <span>/</span>
          <span id="main-title">Edit Scheduled Report</span>
        </div>        
        <div id="form-container">
          {(dropdownToggle || excelDropdownToggle) && <div className="clickout" onClick={handleclosebyclickoutside}></div>}
          <form id="report-scheduler-form" onSubmit={(e) => handleEmail(e)} className="max-w-screen-xl overflow-x-auto mx-auto p-4">
          <div className="flex flex-col space-y-4 ">
          <div className="grid grid-cols-1 gap-2">
          
          <label className="control-label label">
                Report Title
              </label>

              <div className="input-group-container">
        <div className="input-group flex-nowrap">
                  <input
                    required
                    placeholder="Report Title"
                    className="form-control border-style"
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>
              </div>
            
            </div>
            <div className="grid grid-cols-2 row">
            <div className="col-md-6 input-group-container relative">
        <label className="control-label label">
                Select Reports (PDF)
              </label>
              <div className="input-group flex-nowrap">
          <div className="border-style dropdown-button-container form-control">
            <button
                      className="btn btn-light dropdown-setter-button "
                      type="button"
                      id="dropdownMenuButton"
                      style={{
                        width: "100%",
                        padding: "0px 10px",
                        fontSize: "0.9rem",
                        backgroundColor: "white",
                        border: "none"
                      }}
                      onClick={handlePdfToggle}
                      aria-expanded={dropdownToggle}
                    >
                      {selectedPdfReports.length === reportdetail.length
                        ? `All reports are selected (${selectedPdfReports.length})`
                        : selectedPdfReports.length > 0
                          ? selectedPdfReports
                            .map((item) => item.report_name)
                            .join(", ")
                          : "None Selected"}
                    </button>
                  </div>
                  {dropdownToggle && (
                   <ul ref={pdfDropdownRef} className="unordered-list-container absolute bg-white z-10 max-h-60 overflow-y-auto p-2 ">
              <div className="searchbarwrap p-2">
              <div className="search-bar flex items-center border border-gray-300 px-2">
                          <FaSearch className="text-gray-500 mr-2" />
                                            <input
                                              className="w-full h-8 rounded-md focus:outline-none"
                                              type="text"
                                              value={searchPdfReport}
                                              placeholder="Search Report"
                                              onChange={(e) => setSearchPdfReport(e.target.value)}
                                            />
                                             <FaTimesCircle
                                                        className="text-gray-500 ml-2 cursor-pointer"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          setSearchPdfReport("");
                                                          setDropdownToggle(false);
                                                        }}
                                                      />
                        </div>
                        <div className="bg-gray-200 p-2 max-h-40 overflow-y-auto rounded-md mt-2">
                  {filteredPdfReports.map((reportOption, index) => (
                            <li key={index} style={{ listStyle: "none" }}>
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`reportOption${index}`}
                                  checked={selectedPdfReports.some(
                                    (report) =>
                                      report.report_id ===
                                      reportOption.report_id
                                  )}
                                  onChange={() =>
                                    handleOptionChange(
                                      reportOption.report_id,
                                      reportOption.report_name
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`reportOption${index}`}
                                  className="form-check-label ms-2"
                                >
                                  {reportOption.report_name}
                                </label>
                              </div>
                            </li>
                          ))}
                        </div>
                      </div>
                    </ul>
                  )}
                </div>
            </div>
            
            <div className="col-md-6 input-group-container relative">
        <label className="control-label label">
                Select Reports (Excel)
              </label>
              <div className="input-group flex-nowrap">
          <div className="border-style dropdown-button-container form-control">
            <button
                      className="btn btn-light dropdown-setter-button dropdown-toggle "
                      type="button"
                      style={{
                        width: "100%",
                        padding: "0px 10px",
                        fontSize: "0.9rem",
                        backgroundColor: "white",
                        border: "none"
                      }}
                      id="dropdownMenuButtonExcel"
                      onClick={handleExcelToggle}
                      aria-expanded={excelDropdownToggle}
                    >
                      {selectedExcelReports.length === reportdetail.length
                        ? `All reports are selected (${selectedExcelReports.length})`
                        : selectedExcelReports.length > 0
                          ? selectedExcelReports
                            .map((item) => item.report_name)
                            .join(", ")
                          : "None Selected"}
                    </button>
                  </div>
                  {excelDropdownToggle && (
                    <ul ref={excelDropdownRef} className="unordered-list-container absolute bg-white z-10 max-h-60 overflow-y-auto p-2 ">
                      <div className="exceldivwrap p-2">
                      <div className="search-bar flex items-center border border-gray-300 px-2">
                          <FaSearch className="text-gray-500 mr-2" />
                          <input
                            className="w-full h-8 rounded-md focus:outline-none"
                            type="text"
                            value={searchExcelReport}
                            placeholder="Search Report"
                            onChange={(e) =>
                              setSearchExcelReport(e.target.value)
                            }
                          />
                          <FaTimesCircle
                            className="text-gray-500 ml-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSearchExcelReport("");
                              setExcelDropdownToggle(false);
                            }}
                          />
                        </div>
                        <div className="bg-gray-200 p-2 max-h-40 overflow-y-auto rounded-md mt-2">
                  {filteredExcelReports.map((reportOption, index) => (
                            <li key={index} style={{ listStyle: "none" }}>
                              <div className="form-check">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  id={`excelReportOptions${index}`}
                                  checked={selectedExcelReports.some(
                                    (report) =>
                                      report.report_id ===
                                      reportOption.report_id
                                  )}
                                  onChange={() =>
                                    handleExcelOptionChange(
                                      reportOption.report_id,
                                      reportOption.report_name
                                    )
                                  }
                                />
                                <label
                                  htmlFor={`excelReportOptions${index}`}
                                  className="form-check-label ms-2"
                                >
                                  {reportOption.report_name}
                                </label>
                              </div>
                            </li>
                          ))}
                        </div>
                      </div>
                    </ul>
                  )}
                </div>
             </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
            <label className="control-label label">
                ScheduledTime
              </label>
              <div className="input-group-container">
        <div className="input-group flex-nowrap">
                  
                  <DatePicker
                    required
                    className="border-style form-control "
                    selected={selectedTime}
                    onChange={handleDateChange}
                    showTimeSelect
                    placeholderText="Scehduled Time"
                    timeFormat="HH:mm:ss"
                    timeIntervals={5}
                    dateFormat="yyyy-MM-dd HH:mm:ss"
                    minDate={new Date()}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 row">
            <div className="col-md-6 input-group-container relative">
            <label className="control-label label">Email To</label>
              
                <div className="w-full email-input-container" style={{ minHeight: '38px', height: 'auto', width: '100%' }}>
                                    <ReactMultiEmail
                    required
                    className="form-control border-style"
                    placeholder="Email To"
                    emails={emailTo}
                    validateEmail={(email) => {

                      if (invalidEmails.length !== 0) {
                        setInvalidEmails([]);
                      }

                      if (email === "undefined") {
                        return false;
                      }

                      const isValid = emailRegex.test(email);

                      if (!isValid && _invalidEmails.indexOf(email) === -1) {
                        _invalidEmails.push(email);
                      }

                      return isValid;
                    }}
                    onChange={(_emails) => {
                      setInvalidEmails(removeDuplicates(_invalidEmails));
                      setEmailTo(removeDuplicates(_emails));
                    }}
                    getLabel={(email, index, removeEmail) => {
                      return (
                        <div data-tag key={index}>
                          {email}
                          <span
                            data-tag-handle
                            onClick={() => removeEmail(index)}
                          >
                            ×
                          </span>
                        </div>
                      );
                    }}
                  />
                </div>
              
            </div>
           
            <div className="col-md-6 input-group-container relative">
            <label className="control-label label">Email Cc</label>
              
            <div className="w-full email-input-container" style={{ minHeight: '38px', height: 'auto', width: '100%' }}>
                                <ReactMultiEmail
                    required
                    className="form-control border-style"
                    placeholder="emailCC"
                    emails={emailCC}
                    validateEmail={(email) => {

                      // using this as an "onChange" event and getting rid of old values
                      if (invalidEmails.length !== 0) {
                        setInvalidEmails([]);
                      }

                      if (email === "undefined") {
                        return false;
                      }

                      const isValid = emailRegex.test(email);

                      if (!isValid && _invalidEmails.indexOf(email) === -1) {
                        _invalidEmails.push(email);
                      }

                      return isValid;
                    }}
                    onChange={(_emails) => {
                      setInvalidEmails(removeDuplicates(_invalidEmails));
                      setEmailCC(removeDuplicates(_emails));
                    }}
                    // getLabel?
                    getLabel={(email, index, removeEmail) => {
                      return (
                        <div data-tag key={index}>
                          {email}
                          <span
                            data-tag-handle
                            onClick={() => removeEmail(index)}
                          >
                            ×
                          </span>
                        </div>
                      );
                    }}
                  />
                </div>
              
            </div>
            </div>


            <div class="grid grid-cols-1 gap-2">
            <label className="control-label label">Email Body</label>
            <div className="input-group-container">
            <div className="input-group flex-nowrap">
                  
                  <textarea
                    required
                   className="form-control border-style"
                    id="email-body-textarea"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    name="message"
                    placeholder="Email Body Content..."
                  />
                </div>
              </div>
            </div>


            <div class="grid grid-cols-2">
            <label className="control-label label">Interval</label>
            <div className="input-group-container">
            <div className="input-group flex-nowrap">
                 
                  <select
                    required
                    className="form-control border-style"
                    id="interval"
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                  >
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>


            <div class="grid grid-cols-2">
            <label className="control-label label">
                Start Date(Optional)
              </label>
              <div className="input-group-container">
              <div className="input-group flex-nowrap">
                  
                  <DatePicker
                    style={{ width: "100%" }}
                    className="form-control border-style"
                    id="startdate"
                    selected={startDate}
                    onChange={handleScheduleDate}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Start Date"
                    minDate={new Date()}
                  />
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 external-button-container">
                <div className="input-group button-container flex-nowrap mt-3">
                            <button
                  className="ReportSchedulerUpdate-Button"
                  id="add-scheduler-button"
                  type="submit"
                >
                  Update Scheduler
                </button>
              </div>
            </div>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default ReportSchedulerUpdateNew;