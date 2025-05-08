import React, { useEffect, useState } from 'react';
import './../globalCSS/reportmanagement/dbconnection.css';
import SchemaSelection from './SchemaSelection';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { validateConnection,validateConnectionwithsuperadmin } from "../../actions/auth";
import ConnectionForm from './ConnectionForm';
import { Button } from './../globalCSS/Button/Button';
import { decryptData } from '../utils/EncriptionStore';

function DbConnection({ DbType }) {
    const [initialDataRetrieved, setInitialDataRetrieved] = useState(false);

    // Get user data from localStorage
    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
      })();
    // Get navigate function from useNavigate hook
    let history = useNavigate();

    const dispatch = useDispatch(); // Get dispatch function from useDispatch hook
    const apiData = useSelector((state) => state.auth); // Get data from Redux store

    // Effect to validate connection when DbType changes
    useEffect(() => {
        const fetchData = async () => {
            if(user.groupname==="SuperAdmin"){
            dispatch(validateConnectionwithsuperadmin({ email: user.user_email_id, database_type: user.database_type, connection_type: DbType }));
            }else{
            dispatch(validateConnection({ group_id: user.group_id, database_type: user.database_type, customer_id:user.customer_id,connection_type: DbType}));
            }
            setInitialDataRetrieved(true)
        };
        fetchData();
    }, [DbType]);


    // Extract data from Redux store
    const getSchema = apiData?.validate?.result;
   

    // Handler for clicking on New Connection button
    const handelClickNewConnection = () => {
        localStorage.setItem("SelectedSchema", JSON.stringify({ selectedSchema: selectedSchema, databasename: DbType }));
        history('/ConnectionForm'); // Navigate to ConnectionForm page
    };

    // State for selected schema/SID
    const [selectedSchema, setSelectedSchema] = useState('select the schema/SID');

    // Handler for changing the selected schema/SID
    const handleSchemaChange = (event) => {
        console.log(event)
        setSelectedSchema(event.target.value);
    };

    // Handler for building a query
    const handleBuildQuery = async () => {
        if (selectedSchema === 'select the schema/SID') {
            alert("Please select the Schema"); // Show alert if schema/SID is not selected
        } else {
            // Store selected schema/SID and database name in localStorage
            localStorage.setItem("SelectedSchema", JSON.stringify({ selectedSchema: selectedSchema, databasename: DbType }));
            history('../BuildQueryNew'); // Navigate to BuildQueryNew page
        }
    };

    // Handler for custom query
    const handleCustomQuery = async () => {
        if (selectedSchema === 'select the schema/SID') {
            alert("Please select the Schema"); // Show alert if schema/SID is not selected
        } else {
            // Store selected schema/SID and database name in localStorage
            localStorage.setItem("SelectedSchema", JSON.stringify({ selectedSchema: selectedSchema, databasename: DbType }));
            history('../CustomQuery'); // Navigate to CustomQuery page
        }
    };



    return (
        <div>
            <div className='shema_connecton_cnt'>
                <div className='Query_Connect_container'>
                    <div className='Select_schema_container'>
                        <div className='Select_schema'>
                            <div className='schema_sid'><span >Schema/SID Section : </span></div>
                            <select className='select_dbshema' value={selectedSchema} onChange={handleSchemaChange} required>
                                <option value='select the schema/SID'>select the schema/SID</option>
                                {getSchema?.map((schema) => <option key={schema} value={schema.db_schema_name}>{schema.db_schema_name}</option>)}
                            </select>
                            <div className='new_connetion_button'>
                                <Button type="button" onClick={handelClickNewConnection}>New Connection</Button></div>
                        </div>
                        <div className='Query_type'>
                            <Button className='Query_button' type='button' onClick={handleBuildQuery}>Build Query</Button>
                            <Button className='Query_button' type='button' onClick={handleCustomQuery}>Custom Query</Button>
                        </div>
                    </div>
                </div>

                {/* {(makeNewConnection && getSchema) && <><ConnectionForm databasetype={DbType} /></>} */}
            </div>
        </div>
    );
}

export default DbConnection;

