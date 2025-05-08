import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { featureName } from '../../actions/auth';
import { addGroup, listofgroup, resertgroupmessage } from '../../actions/newgroup';
import { assignfeaturetothegroup, getfeatureaccessmask } from '../../actions/assignFeature';
import { Link, useNavigate } from "react-router-dom";
import { Button } from '../globalCSS/Button/Button';
import Header from '../header';
import './../globalCSS/ReportAccessMap/featureAssign.css';
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
import { Tab, Tabs } from "react-tabs-scrollable";
import "react-tabs-scrollable/dist/rts.css";
import "./../globalCSS/NewDashboard/NewTabs.css";
import Pagination from '../Pagination/Pagination';
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { CloseIcon } from "../../assets/Icons";
import { Modal } from "react-bootstrap";
import { toast } from "react-toastify";
import ShowAlert from '../../actions/ShowAlert';
import "./../globalCSS/dashboardmanagement/ListTable.css"
import "./../globalCSS/dashboardmanagement/DownloadButton.css"
import { decryptData } from "../utils/EncriptionStore";
import { Box, CircularProgress } from "@mui/material";

const FeatureAssignpage = () => {
    const [AddGroup, setAddGroup] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [features, setfeatures] = useState([]);
    const [popupaddateparameter, setpopupaddateparameter] = useState(false);
    const [search, setSearch] = useState("")
    const [addnewgroup, setaddnewgroup] = useState();
    const [isLoading, setIsLoading] = useState(true);
    const dispatch = useDispatch();
    const history = useNavigate();

    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();

    const apiData = useSelector((state) => state);
    const response = apiData?.addgroupmessage;

    useEffect(() => {
        if (response?.status === 'success') {
            setpopupaddateparameter(false)
        }
    }, [response])

    const handlecreateGroup = async (e) => {
        e.preventDefault();
        try {
            const userConfirmed = window.confirm("Are you sure you want to Add new group?");
            if (userConfirmed) {
                dispatch(addGroup({ email: user.user_email_id, customer_id: user.customer_id, database_type: user.database_type, group_name: AddGroup }, history));
                dispatch(listofgroup({ email: user.user_email_id, database_type: user.database_type }));
            }
        } catch (error) {
            console.error("Error removing user:", error);
        }
        setpopupaddateparameter(false)
    };

    const handleInputChange = (e) => {
        const inputValue = e.target.value;
        if (/^[a-zA-Z_]*$/.test(inputValue)) {
            setAddGroup(inputValue);
            setErrorMessage('');
        } else {
            setErrorMessage('Only alphabet values are allowed');
        }
    };

    const listofallgroup = apiData?.newgroup.list_of_group;
    const [activeTab, setActiveTab] = useState(1);

    const tabs =
        Array.isArray(listofallgroup) && listofallgroup.length > 0
            ? listofallgroup.some((item) => item.groupname === "SuperAdmin" && user.groupname === "SuperAdmin") // Check if any item matches user.group_id
                ? listofallgroup
                : listofallgroup.filter((item) => item.groupname !== "SuperAdmin")
            : [];

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (listofallgroup && user?.group_id) {
                const index = listofallgroup.findIndex(item => item.group_id === user.group_id);
                if (index !== -1) {
                    setActiveTab(index);
                    dispatch(getfeatureaccessmask({ group_id: user.group_id, database_type: user.database_type }));
                } else {
                    console.log("User group ID not found in tabs.");
                }
            } else {
                console.log("Tabs or user group ID not available.");
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [listofallgroup, user?.group_id]);



    const onTabClick = (e, index) => {
        if (index >= 0 && index < tabs.length) {
            const selectedTab = tabs[index];
            handleSelectGroup(selectedTab.group_id); // Call handleSelectGroup with the group_id
            setActiveTab(index);

        } else {
            console.error(`Invalid tabIndex: ${index}. No group found.`);
        }
    };

    const listofallfeature = apiData?.auth?.list_of_feature?.data;
    const accessfeaturesss = apiData?.assignfeaturetothegroup.assignrespontoget;
    const requiredValues = ['a', 'e', 'd', 'v'];
    const reportsManagementObject = user.features.find(
        (obj) =>
          obj.featurename === "User Management" && user.group_id === obj.group_id
      );

    useEffect(() => {
        dispatch(listofgroup({ email: user.user_email_id, database_type: user.database_type }))
        dispatch(featureName({ email: user.user_email_id, database_type: user.database_type }))
        setaddnewgroup(user.group_id)
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    useEffect(() => {
        if (listofallfeature) {
            const updatedReports = listofallfeature && listofallfeature.map(feature => ({
                name: feature.featurename,
                add: false,
                edit: false,
                delete: false,
                view: false,
                adminMode: false
            }));
            setfeatures(updatedReports);
            setIsLoading(false);
        }
    }, [listofallfeature]);


    const [currentPage, setCurrentPage] = useState(1)

    let PageSize = 8


    const filteredData = useMemo(() => {
        if (!search) return features;
        return features?.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(search.toLowerCase())
            )
        );
    }, [search, features]);

    const paginatedData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * PageSize;
        const lastPageIndex = firstPageIndex + PageSize;
        return filteredData?.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, filteredData, PageSize]);

    const handleCheckboxChange = (index, key) => {
        setfeatures((prevReports) => {
            const filteredIndex = features.findIndex(feature => feature.name === filteredData[index].name);
            const updatedReports = prevReports.map((report, i) => {
                if (i === filteredIndex) {
                    const updatedReport = { ...report, [key]: !report[key] };

                    if (key === "adminMode") {
                        // If adminMode is checked, set all other checkboxes to true
                        if (updatedReport.adminMode) {
                            updatedReport.add = true;
                            updatedReport.edit = true;
                            updatedReport.delete = true;
                            updatedReport.view = true;
                        } else {
                            // If adminMode is unchecked, set all other checkboxes to false
                            updatedReport.add = false;
                            updatedReport.edit = false;
                            updatedReport.delete = false;
                            updatedReport.view = false;
                        }
                    } else {
                        // Check if all checkboxes except adminMode are checked
                        const allChecked = ["add", "edit", "delete", "view"].every(
                            (checkbox) => updatedReport[checkbox]
                        );
                        updatedReport.adminMode = allChecked;
                    }

                    return updatedReport;
                }
                return report;
            });
            return updatedReports;
        });
    };

    useEffect(() => {
        if (accessfeaturesss && features.length > 0) {
            const updatedReports = features.map(report => {
                const assignedReport = accessfeaturesss.find(item => item.featurename === report.name);
                return {
                    ...report,
                    add: assignedReport?.accessmask.includes('a') || false,
                    edit: assignedReport?.accessmask.includes('e') || false,
                    delete: assignedReport?.accessmask.includes('d') || false,
                    view: assignedReport?.accessmask.includes('v') || false,
                    adminMode: assignedReport?.accessmask.includes('a') && assignedReport?.accessmask.includes('e') && assignedReport?.accessmask.includes('d') && assignedReport?.accessmask.includes('v') || false,
                    group_id: addnewgroup
                };
            });
            setfeatures(updatedReports);
        }
    }, [accessfeaturesss]);


    const handleSelectGroup = (groupId) => {
        dispatch(getfeatureaccessmask({ group_id: groupId,database_type: user.database_type }));
        setaddnewgroup(groupId);
    };


    const accessMap = {
        add: 'a',
        edit: 'e',
        delete: 'd',
        view: 'v'
    };

    const handelsavereport = async () => {
        const userConfirmed = await ShowAlert({
            title: "Confirmation",
            message: "Are you sure Want to Assign Features?",
            options: ["OK", "Cancel"]
        });

        if (userConfirmed === "OK") {
            if (features[0].group_id != null) {
                const result = features.map(item => {
                    const access = Object.keys(accessMap).filter(key => item[key]).map(key => accessMap[key]).join('');
                    return { feature_names: item.name, access_masks: access };
                });
                if (result.length > 0) {
                    let payloadform = {
                        group_id: features[0].group_id,
                        database_type: user.database_type,
                        email: user.user_email_id,
                        feature_names: result.map((item) => item.feature_names),
                        access_masks: result.map(item => item.access_masks === '' ? 'null' : item.access_masks)
                    }
                    if (Object.keys(payloadform).length > 0) {
                        dispatch(assignfeaturetothegroup(payloadform, history))
                    }


                }
            } else {

                toast.success("Please select any one of the Group.", { position: "top-right", autoClose: 5000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
            }
        }
    }

    const handelclickgotoDashboard = () => {
        history('/Dashboard')
    };


    const handleRowToggle = () => {
        history('/ReportAccessMap')
    };

    const handelAddFeature = () => {
        history('/FeatureAssign')
    }

    const handleclickgotoUserManagement = () => {
        history("/UserManagementList");
    };

    const handelAddGroup = () => {
        dispatch(resertgroupmessage())
        setpopupaddateparameter(true)
    }

    const handleClose = () => setpopupaddateparameter(false);


    return (
        <div>
            <div className="add-group-modal">
                <Modal className="add-group-new-modal" show={popupaddateparameter} onHide={handleClose} centered>
                    <Modal.Header>
                        <Modal.Title>Add New Group</Modal.Title>
                        <div className="add-group-modal-close-contaiyyner">
                            <CloseIcon onClick={handleClose} />
                        </div>

                    </Modal.Header>
                    <Modal.Body>
                        {response && <div><p style={{ textAlign: "center", color: "red" }}>{response?.message}</p></div>}
                        <form onSubmit={handlecreateGroup}>
                            <div className="form-group">
                                <label htmlFor="groupname" className="form-label">Group Name</label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        id="groupname"
                                        name="groupname"
                                        maxLength={25}
                                        minLength={5}
                                        value={AddGroup}
                                        className="form-control"
                                        placeholder={errorMessage || "Enter Group Name"}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                        </form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" onClick={handlecreateGroup}>
                            Save
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>

            <div className="side-nav"><Header /></div>
            <div className="feature_report_to_group">
                <div className="Page-Header">
                    <span
                        class="fas fa-house-user"
                        aria-hidden="true"
                        onClick={handelclickgotoDashboard}
                    ></span>
                    <span>/</span>
                    <span onClick={handleclickgotoUserManagement}>User Management</span>
                    <span>/</span>
                    <span>Access Features</span>
                </div>
                <div className='feature_report_sub_container'>
                    <div className='feature_report_button_cnt'>
                        <Button onClick={handelsavereport}>Save</Button>
                    </div>
                    <div className='feature_button_cnt2'>
                        {requiredValues.every(value => reportsManagementObject.accessmask.includes(value)) ? <Button onClick={handelAddGroup}>Add New Group</Button> : null}
                        {requiredValues.every(value => reportsManagementObject.accessmask.includes(value) && (user.groupname === "SuperAdmin")) ? <Button onClick={handelAddFeature}>Add New Feature</Button> : null}
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
                            {tabs.map((tab, index) => (
                                <Tab key={index}>
                                    {tab.groupname}
                                </Tab>
                            ))}
                        </Tabs>
                    </div>
                </div>
                <div className='feature_report_table_container'>
                    <table className='responsive-table'>
                        <thead>
                            <tr className="table-header ">
                                <th style={{ textAlign: "center", width: "20px" }}><span className='feature_Report_search'>
                                    <span className="fa fa-search form-control-feedback"></span>
                                    <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /></span></th>
                                <th style={{ textAlign: "center", width: "20px" }}>Add</th>
                                <th style={{ textAlign: "center", width: "20px" }}>Edit</th>
                                <th style={{ textAlign: "center", width: "20px" }}>Delete</th>
                                <th style={{ textAlign: "center", width: "20px" }}>View</th>
                                <th style={{ textAlign: "center", width: "20px" }}>Admin Mode</th>
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
                                paginatedData.map((feature, index) => (
                                    <tr key={index}>
                                        <td className="dropright">
                                            <span>{feature.name}</span>
                                            {feature.name === "Report Management" && (
                                                <Link to={`/ReportAccessMap?group_id=${addnewgroup}`}>
                                                    <i style={{ marginLeft: "5px", color: "black" }} className="fa-solid fa-caret-right"></i>
                                                </Link>
                                            )}
                                            {feature.name === "Dashboard Management" && (
                                                <Link to={`/DashboardManagement?group_id=${addnewgroup}`}>
                                                    <i style={{ marginLeft: "5px", color: "black" }} className="fa-solid fa-caret-right"></i>
                                                </Link>
                                            )}
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={feature.add}
                                                onChange={() => handleCheckboxChange(index, "add")}
                                            />
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={feature.edit}
                                                onChange={() => handleCheckboxChange(index, "edit")}
                                            />
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={feature.delete}
                                                onChange={() => handleCheckboxChange(index, "delete")}
                                            />
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={feature.view}
                                                onChange={() => handleCheckboxChange(index, "view")}
                                            />
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                            <input
                                                type="checkbox"
                                                checked={feature.adminMode}
                                                onChange={() => handleCheckboxChange(index, "adminMode")}
                                            />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Row if no features are available after loading
                                <tr>
                                    <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                                        Features Loading....
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div></div>
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

export default FeatureAssignpage;



