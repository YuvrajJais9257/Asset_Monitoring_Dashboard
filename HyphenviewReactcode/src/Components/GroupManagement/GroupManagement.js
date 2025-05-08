/*modified  By Yuvraj jaiswal */
import { useNavigate } from "react-router-dom";
import { Button } from '../globalCSS/Button/Button';
import Header from '../header';
import './../globalCSS/ReportAccessMap/featureAssign.css';
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
import Pagination from '../Pagination/Pagination';
import './../globalCSS/GroupManagement/GroupManagement.css';
import React, { useEffect, useMemo, useState } from "react";
import PopupAddGroup from '../UserManagement/PopupAddGroup';
import PopupEditGroup from './PopupEditGroup';
import { listofgroup, resertgroupmessage,checkremovegroup,editgroupnamemessage } from '../../actions/newgroup';
import { useDispatch, useSelector } from "react-redux";
import  ShowAlert  from '../../actions/ShowAlert.js';
import { decryptData } from "../utils/EncriptionStore.js";

function GroupManagement() {

    const [popupaddateparameter, setpopupaddateparameter] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState({ group_id: null, groupname: '' });
    const [search, setSearch] = useState("")
    const [popupforedit,setpopupforedit] = useState(false);
    const [currentPage, setCurrentPage] = useState(1)
    const dispatch = useDispatch();
    const history = useNavigate();

    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();

    const apiData = useSelector((state) => state);

    const listofallgroup =
    Array.isArray(apiData?.newgroup?.list_of_group) && apiData?.newgroup?.list_of_group.length > 0
        ? apiData?.newgroup.list_of_group.some((item) => item.groupname === "SuperAdmin" && user.groupname==="SuperAdmin") // Check if any item matches user.group_id
            ? apiData?.newgroup?.list_of_group // If a match is found, leave the array unchanged
            : apiData?.newgroup?.list_of_group.filter((item) => item.groupname !== "SuperAdmin") // Otherwise, filter out non-matching items
        : [];
    

    const requiredValues = ['a', 'e', 'd', 'v'];
    const reportsManagementObject = user.features.find(
        (obj) =>
          obj.featurename === "User Management" && user.group_id === obj.group_id
      );

    useEffect(() => {
        setCurrentPage(1); // Reset to the first page when search term changes
      }, [search]);

    let PageSize = 5;


    const filteredData = useMemo(() => {
        if (!search) return listofallgroup;
        return listofallgroup?.filter(item =>
            Object.values(item).some(value =>
                String(value).toLowerCase().includes(search.toLowerCase())
            )
        );
    }, [search, listofallgroup]);

    const paginatedData = useMemo(() => {
        const firstPageIndex = (currentPage - 1) * PageSize;
        const lastPageIndex = firstPageIndex + PageSize;
        return filteredData?.slice(firstPageIndex, lastPageIndex);
    }, [currentPage, filteredData, PageSize]);


    useEffect(() => {
        dispatch(listofgroup({ email: user.user_email_id, database_type: user.database_type }))
    }, []);

    const handelclickgotoDashboard = () => {
        history('/Dashboard')
    };

    const handleclickgotoUserManagement = () => {
        history("/UserManagementList");
    };

    const handelAddGroup = () => {
        dispatch(resertgroupmessage())
        setpopupaddateparameter(true)
    }

    const handelremoveReport = async(groupid,groupname) => {

        try {
            const userConfirmed = await ShowAlert({
                title: "Confirmation",
                message: "Are you sure you want to delete this Group?",
                options: ["OK", "Cancel"]
            });
            
            if (userConfirmed === "OK") {
                dispatch(checkremovegroup({ groupname:groupname, group_id: groupid, database_type: user.database_type, customer_id: user.customer_id }, history))
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

    }

    const handleEditClick = (group_id, groupname) => {
        dispatch(editgroupnamemessage())
        setSelectedGroup({ group_id, groupname });
        setpopupforedit(true);
    };

    return (
        <div>
            {popupaddateparameter && popupaddateparameter ? (<PopupAddGroup setpopupaddateparameter={setpopupaddateparameter} />) : undefined}
            {popupforedit && popupforedit ? ( <PopupEditGroup setpopupforedit={setpopupforedit} group_id={selectedGroup.group_id} groupname={selectedGroup.groupname}/>) : undefined}
            <div className="side-nav"><Header /></div>
            <div className="group_report_to_group">
            <div className="Page-Header">
                <span
                    class="fas fa-house-user"
                    aria-hidden="true"
                    onClick={handelclickgotoDashboard}
                ></span>
                <span>/</span>
                <span onClick={handleclickgotoUserManagement}>User Management</span>
                <span>/</span>
                <span>Group Management</span>
            </div>
            <div className='group_report_sub_container'>
                <div className='group_report_button_cnt'>
                    <Button onClick={() => { history("/UserManagementList") }}>Back</Button>
                    {/* <Button>Reset</Button> */}
                </div>
                <div className='group_button_cnt2'>
                    {requiredValues.every(value => reportsManagementObject.accessmask.includes(value)) ? <Button onClick={handelAddGroup}>Add New Group</Button> : null}
                    {/* <Button onClick={handelAsignGroup}>Assign Report</Button> */}
                </div>
            </div>
            <div className='group_report_table_container'>
                <table className='responsive-table' >
                    <thead>
                        <tr class="table-header ">
                            <th><span className='group_list_search'>
                                <span className="fa fa-search form-control-feedback"></span>
                                <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /></span></th>
                            <th style={{ textAlign: "center" }}>Edit Group Name</th>
                            <th style={{ textAlign: "center" }}>Delete Group</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData && paginatedData.map((group, index) => (
                            <tr key={index}>
                                <td className='dropright'>
                                    <span>{group.groupname}</span>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                <span>
                                        <i
                                            style={{ cursor: 'pointer', marginLeft: "5px"}}
                                            onClick={() => handleEditClick(group.group_id, group.groupname)}
                                            className="fa-solid fa-pen-to-square edit-button"
                                        ></i>
                                    </span>
                                    
                                </td>
                                <td style={{ textAlign: "center" }}>
                                <span>
                                        <i
                                            style={{ cursor: 'pointer', marginLeft: "5px"}}
                                            onClick={() => handelremoveReport(group.group_id, group.groupname)}
                                            className="fa-solid fa-trash-can delete-button"
                                        ></i>
                                    </span>
                                </td>
                            </tr>
                        ))}


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
    )

}

export default GroupManagement;