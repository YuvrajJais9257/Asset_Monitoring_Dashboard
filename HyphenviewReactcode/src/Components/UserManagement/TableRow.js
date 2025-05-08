import React, { useEffect, useMemo, useState } from 'react';
import useOpenController from "../Hooks/useOpenController";
import { getreportdetailwithaccessforassignreport } from '../../actions/reportmanagement';
import { getReportDetailonbasisOFgroupid } from '../../actions/assignReport';
import { useDispatch, useSelector } from 'react-redux';
import { listofgroup } from '../../actions/newgroup'
import './../globalCSS/usermanagement/tablerow.css';
import { Button } from './../globalCSS/Button/Button';
import { assignreporttothegroup } from '../../actions/assignReport'
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
import { useNavigate } from 'react-router-dom';
import Header from '../header';
import {toast } from 'react-toastify';
import { decryptData } from '../utils/EncriptionStore';

function TableRow() {
    const dispatch = useDispatch();
    const history = useNavigate();

    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
      })();

    const apiData = useSelector((state) => state);
    const reportdetail = apiData?.reportmanagement.getreportdetalwithaccess;
    const reportdetailofgroupId = apiData?.assignreporttothegroup.getreportdetailonbasisofgroupId;

    const listofallgroup = apiData?.newgroup.list_of_group;
 

    const initialstate2 = {
        group_id: "",
        allreportId: []
    }
    const [listofreport, setlistofreport] = useState(initialstate2);
    const [reportcheckboxStates, setreportcheckboxStates] = useState({});
    const [search, setSearch] = useState("")

    // useEffect(() => {
    //     const selectButtonAtIndex1 = () => {
    //       const buttonAtIndex1 = document.getElementById("groupId0");
    //       console.log(buttonAtIndex1, "buttonAtIndex1");
      
    //       if (buttonAtIndex1) {
    //         buttonAtIndex1.click();
    //       }
    //     };
      
    //     // Ensure that the DOM is fully loaded before selecting the button
    //     if (document.readyState === 'complete') {
    //       selectButtonAtIndex1();
    //     } else {
    //       window.onload = selectButtonAtIndex1;
    //     }
    //   }, []);


    useEffect(() => {
        // const shemaDetail = JSON.parse(localStorage.getItem('SelectedSchema'));
        dispatch(getreportdetailwithaccessforassignreport({ database_type: "mysql", email: user.user_email_id }));
        dispatch(getReportDetailonbasisOFgroupid({customer_id:user.customer_id, database_type: "mysql" }));
        dispatch(listofgroup({ email: user.user_email_id, database_type: "mysql" }))
    }, []);

    const mapAccessMaskrever = (accessmask) => {
        switch (accessmask) {
            case 'Delete':
                return 'd';
            case 'Edit':
                return 'e';
            case 'View':
                return 'v';
            case 'Admin Mode(access to all record)':
                return 'adve';
            case 'Print/Export':
                return 'P';
            default:
                return '';
        }
    };

    const mapAccessMask = (accessmask) => {
        switch (accessmask) {
            case 'd':
                return 'Delete';
            case 'e':
                return 'Edit';
            case 'v':
                return 'View';
            case 'p':
                return 'Print/Export';
            case 'adve':
                return 'Admin Mode(access to all record)';
            default:
                return '';
        }
    };

    // useEffect(() => {
    //     console.log("gusa")

        
    // }, [reportdetailofgroupId])





    const handleCheckboxChange = (e, reportId, accessmask) => {
        setlistofreport((prev) => {
            const existingFeatureIndex = prev.allreportId.findIndex(
                (f) => f.reportId === reportId && f.accessmask === accessmask
            );

            
            if (existingFeatureIndex !== -1) {
                const updatedFeatureList = [...prev.allreportId];
                updatedFeatureList.splice(existingFeatureIndex, 1);

                // Update checkbox state
                const updatedCheckboxStates = { ...reportcheckboxStates };
                updatedCheckboxStates[`${reportId}_${accessmask}`] = false;
                setreportcheckboxStates(updatedCheckboxStates);

                return { ...prev, allreportId: updatedFeatureList };
            } else {
                const newFeatureList = [...prev.allreportId, { reportId, accessmask }];

                // Update checkbox state
                const updatedCheckboxStates = { ...reportcheckboxStates };
                updatedCheckboxStates[`${reportId}_${accessmask}`] = true;
                setreportcheckboxStates(updatedCheckboxStates);

                return { ...prev, allreportId: newFeatureList };
            }

            // const updatedFeatureList = existingFeatureIndex !== -1
            //     ? [...prev.allreportId.slice(0, existingFeatureIndex), ...prev.allreportId.slice(existingFeatureIndex + 1)]
            //     : [...prev.allreportId, { reportId, accessmask }];

            // // Update checkbox state
            // const updatedCheckboxStates = { ...reportcheckboxStates };
            // updatedCheckboxStates[`${reportId}_${accessmask}`] = !existingFeatureIndex;
            // setreportcheckboxStates(updatedCheckboxStates);

            // return { ...prev, allreportId: updatedFeatureList };
        });
    };


  

    const accessmask = [
        { value: "Edit", lable: "Edit" },
        { value: "Delete", lable: "Delete" },
        { value: "View", lable: "View" },
        { value: "Export", lable: "Export" },
        { value: "Admin Mode(access to all record)", lable: "Admin Mode(access to all record)" }
    ]

    const handelclickgotoDashboard = () => {
        history('/Dashboard')
    }

    const processData2 = (data) => {
        // Group data by feature
        const groupedData = data.allreportId.reduce((result, entry) => {
            const key = entry.reportId;
            if (!result[key]) {
                result[key] = [];
            }
            if (entry.accessmask) {
                result[key].push(mapAccessMaskrever(entry.accessmask));
            }
            return result;
        }, {});
    
        // Convert grouped data to the desired format
        const resultData = Object.entries(groupedData).map(([reportId, accessmasks]) => {
            return {
                reportId: reportId,
                accessmask: accessmasks.join(''),
            };
        });
    
        return resultData;
    };

    useEffect(() => {
        const selectButtonAtIndex1 = () => {
          const buttonAtIndex1 = document.getElementById("groupId0");
      
          if (buttonAtIndex1) {
            buttonAtIndex1.click();
          }
        };
      
        // Ensure that the DOM is fully loaded before selecting the button
        if (document.readyState === 'complete') {
          selectButtonAtIndex1();
        } else {
          window.onload = selectButtonAtIndex1;
        }
      }, []);

    const handelresponjsonforreport = (reportdetailresult,group_id,user) =>{
        
        const reportlist = reportdetailresult?.map((item)=>item.reportId)
        const accessallowes = reportdetailresult?.map((item)=>item.accessmask)
        

        const featuresendpayload = reportdetail.map((item)=>
        {
            // console.log(toString(item.report_id),reportlist,"reportdetailresult")
            if (!reportlist.includes(item.report_id.toString())) {
                reportlist.push(item.report_id.toString());
                accessallowes.push('null');
            }
            
        })
        if(reportlist.length>0&&accessallowes.length>0){
            const payloadform = {
                group_id : group_id,
                database_type : "mysql",
                email : user.user_email_id,
                report_ids : reportlist,
                access_masks : accessallowes
            }
            return payloadform;
        }
        
       
    }

    const handelsavereport = () => {
        const group_id = listofreport.group_id;
        if(group_id!=null){
        
        const reportdetailresult = processData2(listofreport);
        
        if(reportdetailresult.length>0){
            const getrespodn2 = handelresponjsonforreport(reportdetailresult,group_id,user)
            if(Object.keys(getrespodn2).length > 0){
                 dispatch(assignreporttothegroup(getrespodn2,history))
            }
        }
       }else{
        toast.success("can you plealse select any of the group", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
       }

    }



    const handleSelectGroup = (e, groupid) => {
        dispatch(getReportDetailonbasisOFgroupid({ customer_id:user.customer_id,database_type: "mysql" }));
        setreportcheckboxStates([])
        setlistofreport((prev) => {
            if (prev.group_id === groupid) {
                return prev;
            }
            // const updatedCheckboxStates = {};
            // setCheckboxStates(updatedCheckboxStates)
            // setreportcheckboxStates(updatedCheckboxStates)
            return { ...prev, group_id: groupid, allreportId: [] };
        });
        
        if (reportdetailofgroupId) {
            const assignedreportwithaccess = reportdetailofgroupId && reportdetailofgroupId.filter((item) => (item.group_id === groupid))
            assignedreportwithaccess?.forEach((item) => {
                const reportId = item.report_id;
                for (let i = 0; i < item.access_mask.length; i++) {
                    const ch = item.access_mask.charAt(i);
                    const accessmask = mapAccessMask(ch);
                    
                    // Use functional update form to ensure you are working with the latest state
                    setreportcheckboxStates((prevCheckboxStates) => ({
                        ...prevCheckboxStates,
                        [`${reportId}_${accessmask}`]: true,
                    }));

                    setlistofreport((prev) => {
                        const updatedFeatureList = [...prev.allreportId, { reportId: reportId, accessmask: accessmask }];
                        return { ...prev, allreportId: updatedFeatureList };
                    });
                }
            }, [assignedreportwithaccess.report_id]);
            // setreportcheckboxStates()
        }

    };

   

    return (
        <div>
            <div className="side-nav"><Header /></div>
            <div className="Assin_report_to_group">
                <span class="fas fa-house-user" aria-hidden="true" onClick={handelclickgotoDashboard}></span>
                <span>/</span>
                <span>Assign Reports To The Group</span>

            </div>
            <div className='Assignation_report_sub_container'>
                <div className='Assignation_report_button_cnt'>
                    <Button onClick={handelsavereport}>Save</Button>
                    {/* <Button>Reset</Button> */}
                </div>
            </div>
            <div className='report_displayed'>
            <div style={{marginRight: "100px"}}>
                {listofallgroup && listofallgroup?.map((colname, index) => (
                    <Button id={`groupId${index}`}
                        style={{
                            marginRight: "5px",
                            backgroundColor: listofreport.group_id === colname.group_id ? 'white' : '#424344',
                            color: listofreport.group_id === colname.group_id ? '#424344' : 'white',
                            borderRadius: "5px"

                        }} key={index} onClick={(e) => handleSelectGroup(e, colname.group_id)}>{colname.groupname}</Button>
                ))}
            </div>
            </div>
            {/* {reportdetail && reportdetail.map((report, index) => (
                <tr key={index}>
                    <td></td>
                    <td style={{ textAlign: "center" }}>{report.report_name}</td>
                    {accessmask && accessmask.map((colname, colIndex) => (

                        <td key={colIndex} style={{ textAlign: "center" }}>
                            {colname.value != 'Add' ? <input
                                type="checkbox"
                                checked={reportcheckboxStates[`${report.report_id}_${colname.value}`]}
                                onChange={(e) => handleCheckboxChange(e.target.checked, report.report_id, colname.value)}
                                className="custom-control-input"
                            /> : <input type="checkbox" disabled className="custom-control-input" />
                            }
                        </td>
                    ))}
                </tr>
            ))} */}



            <div className='Assignation_report_table_container'>
                <table className='table table-striped table-bordered table-hover' style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            <th></th>
                            <th><span className='AssignationReport_search'>
                                <span className="fa fa-search form-control-feedback"></span>
                                <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /></span></th>
                            {accessmask && accessmask.map((mask, maskIndex) => (
                                <td style={{ textAlign: "center" }} key={`empty_${maskIndex}`}>{mask.value}</td>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td></td>
                            <td>expend all</td>
                        </tr>
                        {reportdetail && reportdetail.map((report, index) => (
                            <React.Fragment key={index}>
                                <tr>
                                    <td></td>
                                    <td className='dropright'>
                                        {report.report_name}
                                        {/* && (feature.featurename !=="Report Management") && */}
                                        {/* <ExpendableButton isOpen={expandedRows.includes(index)} toggle={() => handleRowToggle(index)} /> */}
                                    </td>
                                    {accessmask && accessmask.map((colname, colIndex) => (
                                        <td key={colIndex} style={{ textAlign: "center" }}>
                                            {colname.value != 'Admin Mode(access to all record)' ? <input
                                                type="checkbox"
                                                checked={reportcheckboxStates[`${report.report_id}_${colname.value}`]}
                                                onChange={(e) => handleCheckboxChange(e.target.checked, report.report_id, colname.value)}
                                                className="custom-control-input"
                                                id={`customCheck_${colIndex}_${colIndex + 1}`}
                                            /> :  
                                                <input
                                                    type="checkbox"
                                                    checked={reportcheckboxStates[`${report.report_id}_${colname.value}`]}
                                                    onChange={(e) => handleCheckboxChange(e.target.checked, report.report_id, colname.value)}
                                                    className="custom-control-input"
                                                    id={`customCheck_${colIndex}_${colIndex + 1}`}
                                                />
                                            }
                                        </td>
                                    ))}
                                </tr>
                                {/* {expandedRows.includes(index) && (feature.featurename==="Report Management") && <TableRow setlistofreport={setlistofreport} listofreport={listofreport} listofReportId={listofReportId} setreportcheckboxStates={setreportcheckboxStates} reportcheckboxStates={reportcheckboxStates} />} */}
                            </React.Fragment>

                        ))}
                        {/* {isOpen&&<TableRow />} */}
                    </tbody>
                </table>
            </div>
            </div>
            );

}
export default TableRow;

