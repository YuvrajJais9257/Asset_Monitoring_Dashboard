import React, { useEffect, useMemo, useState } from 'react'
import Header from '../header';
import './../globalCSS/usermanagement/assignandfeature.css';
import PopupAddGroup from './PopupAddGroup';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {featureName } from '../../actions/auth'
import { listofgroup} from '../../actions/newgroup'
import { assignfeaturetothegroup,getfeatureaccessmask } from '../../actions/assignFeature'
import { ExpendableButton } from "../ExpendableButton/ExpendableButton";
import useOpenController from "../Hooks/useOpenController";
import {toast } from 'react-toastify';
// import TableRow from './TableRow';
import { Button } from './../globalCSS/Button/Button';
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
export default function AssignationAndFeature() {

    const user = JSON.parse(localStorage.getItem('profile'));

    
    const [search, setSearch] = useState("")
    const dispatch = useDispatch();
    const history = useNavigate();
    const apiData = useSelector((state) => state);
    const { isOpen, toggle } = useOpenController(false);

    const [featurewitheccessmask, setfeaturewitheccessmask] = useState();
    const initialstate = {
        group_id : "",
        featurelist:[]
    }

  

   

    const [popupaddateparameter, setpopupaddateparameter] = useState(false);
    const [listofReportId, setlistofReportId] = useState(initialstate);
    const accessfeaturesss = apiData?.assignfeaturetothegroup.assignrespontoget;
   

    const listofallgroup = apiData?.newgroup.list_of_group;
    const listofallfeature = apiData?.auth.list_of_feature;
    


    

    useMemo(() => {
        dispatch(listofgroup({ email: user.user_email_id, database_type: "mysql" }))
        dispatch(featureName({ email: user.user_email_id, database_type: "mysql" }))
    }, [])
   
    const accessmask = [
        { value: "Add", lable: "Add" },
        { value: "Edit", lable: "Edit" },
        { value: "Delete", lable: "Delete" },
        { value: "View", lable: "View" },
        { value: "Admin Mode(access to all record)", lable: "Admin Mode(access to all record)" }
    ]
    
    const [expandedRows, setExpandedRows] = useState([]);
    const [checkboxStates, setCheckboxStates] = useState({});
    
   

    const handleRowToggle = () => {
        history('/ReportAccessMap')
    };


    const handleSelectGroup = (e,groupid) => {
        setCheckboxStates([])
        dispatch(getfeatureaccessmask({ group_id: groupid, database_type: "mysql" }))
        setlistofReportId((prev) => {
            if (prev.group_id === groupid) {
                return prev;
            }
            const updatedCheckboxStates = {};
            setCheckboxStates(updatedCheckboxStates)
            return { ...prev, group_id: groupid,featurelist : []};
        });
    };

    const handelAddFeature = () =>{
        history('/FeatureAssign')
    }
    useEffect(() => {
       
        accessfeaturesss && accessfeaturesss.forEach((item) => {
            const feature = item.featurename;
            const newFeatureList = [];
    
            for (let i = 0; i < item.accessmask.length; i++) {
                const ch = item.accessmask.charAt(i);
                const accessmask = mapAccessreversed(ch);
    
                setCheckboxStates(prevCheckboxStates => ({
                    ...prevCheckboxStates,
                    [`${feature}_${accessmask}`]: true
                }));
    
                newFeatureList.push({ feature, accessmask });
            }
    
            setlistofReportId(prev => ({
                ...prev,
                featurelist: [...prev.featurelist, ...newFeatureList]
            }));
        });
    }, [accessfeaturesss]);
    




    
 
    const handelresponjsonforfeature = (result,group_id,user) =>{
        const featurelist = result?.map((item)=>item.feature)
        const accessallowes = result?.map((item)=>item.accessmask)
        
        const featuresendpayload = listofallfeature.map((feitem)=>
        {
            if(!featurelist.includes(feitem.featurename)){
                featurelist.push(feitem.featurename);
                accessallowes.push('null')
            }
        })
        
        // console.log(featuresendpayload,featurelist,accessallowes)
        if(featurelist.length>0&&accessallowes.length>0){
            const payloadform = {
                group_id : group_id,
                database_type : "mysql",
                email : user.user_email_id,
                feature_names : featurelist,
                access_masks : accessallowes,
            }
            return payloadform;
        }
        
        
    }




    const handelsavefeature = async() =>{
        const group_id = listofReportId.group_id;
        if(group_id!=null){
        
        const result = processData1(listofReportId);
        if(result.length>0){
            const getrespodn1 =  handelresponjsonforfeature(result,group_id,user)
            if(Object.keys(getrespodn1).length > 0){
                 dispatch(assignfeaturetothegroup(getrespodn1,history))
            }
        }
       }else{
        toast.success("can you plealse select any of the group", {position: "top-right",autoClose: 5000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
       }
    
    }

    const mapAccessMask = (accessmask) => {
        switch (accessmask) {
            case 'Add':
                return 'a';
            case 'Delete':
                return 'd';
            case 'Edit':
                return 'e';
            case 'View':
                return 'v';
            case 'Admin Mode(access to all record)':
                return 'adve';
            default:
                return '';
        }
    };

    const processData1 = (data) => {
        // Group data by feature
        const groupedData = data.featurelist.reduce((result, entry) => {
            const key = entry.feature;
            if (!result[key]) {
                result[key] = [];
            }
            result[key].push(mapAccessMask(entry.accessmask));
            return result;
        }, {});
    
        // Convert grouped data to the desired format
        const resultData = Object.entries(groupedData).map(([feature, accessmasks]) => {
            return {
                feature: feature,
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



    const handleCheckboxChange = (e, accessmask, feature) => {
       
        // if(accessmask==='Admin Mode(access to all record)'){
            
        // }
        setlistofReportId((prev) => {
            const existingFeatureIndex = prev.featurelist.findIndex(
                (f) => f.feature === feature && f.accessmask === accessmask    
            );
            
            if (existingFeatureIndex !== -1) {
                const updatedFeatureList = [...prev.featurelist];
                updatedFeatureList.splice(existingFeatureIndex, 1);
    
                // Update checkbox state
                const updatedCheckboxStates = { ...checkboxStates };
                updatedCheckboxStates[`${feature}_${accessmask}`] = false;
                setCheckboxStates(updatedCheckboxStates);
    
                return { ...prev, featurelist: updatedFeatureList };
            } else {
                const newFeatureList = [...prev.featurelist, { feature, accessmask }];
    
                // Update checkbox state
                const updatedCheckboxStates = { ...checkboxStates };
                updatedCheckboxStates[`${feature}_${accessmask}`] = true;
                setCheckboxStates(updatedCheckboxStates);
    
                return { ...prev, featurelist: newFeatureList };
            }
        });
    };

    const handelclickgotoDashboard = () => {
        history('/Dashboard')
    }

    const mapAccessreversed = (accessmask) => {
        switch (accessmask) {
            case 'a':
                return 'Add';
            case 'd':
                return 'Delete';
            case 'e':
                return 'Edit';
            case 'v':
                return 'View';
            case 'adve':
                return 'Admin Mode(access to all record)';
            default:
                return '';
        }
    };

    const handleCheckboxselectedAll = (e, accessmask, feature) => {
        const isAdminModeChecked = e;
        setlistofReportId((prev) => {
            let featureIndex = prev.featurelist.findIndex((f) => f.feature === feature);
            const updatedCheckboxStates = { ...checkboxStates };
            if (featureIndex !== -1) {
                const selestdfdsf = mapAccessMask(accessmask);
                selestdfdsf.split('').map((item)=>{
                   if(item==='a'){
                    prev.featurelist.push({ feature, accessmask: 'Add'});
                    updatedCheckboxStates[`${feature}_${'Add'}`] = isAdminModeChecked;
                   }else if(item==='d'){
                    updatedCheckboxStates[`${feature}_${'Delete'}`] = isAdminModeChecked;
                    prev.featurelist.push({ feature, accessmask: 'Delete'});
                   }else if(item==='e'){
                    updatedCheckboxStates[`${feature}_${'Edit'}`] = isAdminModeChecked;
                    prev.featurelist.push({ feature, accessmask: 'Edit' });
                   }else if(item==='v'){
                    updatedCheckboxStates[`${feature}_${'View'}`] = isAdminModeChecked;
                    prev.featurelist.push({ feature, accessmask: 'View'});
                   }
                })
                

            } else {
                const updatedFeatureList = [...prev.featurelist];
                const filteredFeatureList = updatedFeatureList.filter((item) => item.feature !== feature);
                const updatedCheckboxStates = { ...checkboxStates };
                updatedFeatureList.forEach((item) => {
                    Object.keys(updatedCheckboxStates)
                        .filter((key) => key.startsWith(`${feature}_`))
                        .forEach((key) => delete updatedCheckboxStates[key]);
                });
                setCheckboxStates(updatedCheckboxStates);
                return { ...prev, featurelist: filteredFeatureList };
            }
            setCheckboxStates(updatedCheckboxStates);
    
            return { ...prev };
        });
    };

    const handelAsignGroup = () =>{
        history('/TableRow')
    }
    
    

    return (
        <div>
            {popupaddateparameter && popupaddateparameter ? (<PopupAddGroup setpopupaddateparameter={setpopupaddateparameter}/>) : undefined}
            <div className="side-nav"><Header /></div>
            <div className="Assin_feature_to_group">
            <span class="fas fa-house-user" aria-hidden="true" onClick={handelclickgotoDashboard}></span>
            <span>/</span>
            <span>Access Features</span>
           </div>
            <div className='Assignation_sub_container'>
                <div className='Assignation_button_cnt'>
                    <Button onClick={handelsavefeature}>Save</Button>
                    {/* <Button>Reset</Button> */}
                </div>
                <div className='Assignation_button_cnt2'>
                    <Button onClick={() => { setpopupaddateparameter(true) }}>Add New Group</Button>
                    <Button onClick={handelAddFeature}>Add New Feature</Button>
                    {/* <Button onClick={handelAsignGroup}>Assign Report</Button> */}
                </div>
            </div>

            <div className='group_displayed'>
                <div style={{marginRight: "125px"}}>
                {listofallgroup && listofallgroup?.map((colname, index) => (
                    <Button id={`groupId${index}`} 
                     style={{
                        marginRight:"5px",
                        backgroundColor: listofReportId.group_id === colname.group_id ? 'white' : '#424344',
                        color: listofReportId.group_id === colname.group_id ? '#424344' : 'white',
                        borderRadius:"5px"

                      }} key={index} onClick={(e)=>handleSelectGroup(e,colname.group_id)}>{colname.groupname}</Button>
                ))}
            </div>
            </div>
            <div className='Assignation_table_container'>
                <table className='table table-striped table-bordered table-hover' style={{ width: "100%" }}>
                    <thead>
                        <tr>
                            {/* <th></th> */}
                            <th><span className='AssignationAdFeature_search'>
                                <span className="fa fa-search form-control-feedback"></span>
                                <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /></span></th>
                                {accessmask && accessmask.map((mask, maskIndex) => (
                                <td style={{textAlign:"center"}} key={`empty_${maskIndex}`}>{mask.value}</td>
                            ))}
                        </tr>
                </thead>
                    <tbody>
                        <tr>
                            {/* <td></td> */}
                            <td>expend all</td>
                        </tr>
                        {listofallfeature && listofallfeature.map((feature, index) => (
                    <React.Fragment key={index}>
                        <tr>
                            {/* <td></td> */}
                            <td className='dropright'>
                                <span>{feature.featurename}</span>
                                {/* && (feature.featurename !=="Report Management") && */}
                                <span>{feature.featurename ==="Report Management" && <ExpendableButton isOpen={expandedRows.includes(index)} toggle={() => handleRowToggle(index)} />}</span>
                            </td>
                            {accessmask && accessmask.map((colname, colIndex) => (
                                    <td key={colIndex} style={{textAlign:"center"}}>
                                        {colname.value!='Admin Mode(access to all record)' ? <input
                                            type="checkbox"
                                            checked={checkboxStates[`${feature.featurename}_${colname.value}`]}
                                            onChange={(e) => handleCheckboxChange(e.target.checked, colname.value, feature.featurename)}
                                            className="custom-control-input"
                                            id={`customCheck_${colIndex}_${colIndex + 1}`}
                                        /> :
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            checked={checkboxStates[`${feature.featurename}_${colname.value}`]}
                                            onChange={(e) => handleCheckboxselectedAll(e.target.checked, colname.value, feature.featurename)}
                                            id={`customCheck_${colIndex}_${colIndex + 1}`}
                                        />
                                        }
                                    </td>
                                ))}
                        </tr>
                      
                    </React.Fragment>

                        ))}
                    
                    </tbody>
                </table>
            </div>
        </div>
    )
}

