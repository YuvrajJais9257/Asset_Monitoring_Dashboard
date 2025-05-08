import React, { useState, useEffect } from 'react';
import styles from './../globalCSS/reportmanagement/CustomFilter.module.css';
import { decryptData } from '../utils/EncriptionStore';
import { getfilterdata, generateReportId } from "../../actions/reportmanagement";
import { useDispatch } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import { toast } from 'react-toastify';
import axios from 'axios'
const apiUrlEndPoint2 = process.env.REACT_APP_API_URL2;
axios.interceptors.request.use(
    (config) => {
        const token = JSON.parse(localStorage.getItem('token')); // Retrieve the token from local storage
        if (token) {
            config.headers['Authorization'] = `Bearer ${token.access_token}`; // Attach the token to the headers
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

function getStyles(name, personName, theme) {
    return {
        fontWeight: personName.includes(name)
            ? theme.typography.fontWeightMedium
            : theme.typography.fontWeightRegular,
    };
}


const CustomFilter = ({ setOpenCustomFilter, columns, data, pagination, setShowcolumnFilter, conditions, setConditions, sorting, length }) => {
    const theme = useTheme();
    const TotalColumns = Object.keys(columns);
    const [activeIndex, setActiveIndex] = useState(length - 1);
    const [conditionOperator, setConditionOperator] = useState("AND");
    const [loading, setLoading] = useState(true);
    const DateTimeType = [
        "TIMESTAMP", "DATE", "DATETIME", "NEWDATE", "TIMESTAMPTZ", "TIMETZ"
    ]
    const IntigetType = [
        "INT", "INTEGER", "FLOAT", "DOUBLE", "INT2VECTOR", "NUMRANGE", "INT4RANGE"
    ]

    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();
    const conditionTypesForInputBox = [
        "startsWith",
        "endsWith",
        "contains",
    ];


    const queryParameters = new URLSearchParams(window.location.search);
    const report_id = queryParameters.get("report_id");
    const dispatch = useDispatch();


    const handleSelectedData = async (index, value) => {
        setActiveIndex(index);
        const newConditions = [...conditions];
        newConditions[index].selectedData = value;
        newConditions[index].type = columns[conditions[index].selectedData];
        newConditions[index].filteredValues = [];
        newConditions[index].selectedCondition = "";

        setConditions(newConditions)

        const formData = {
            report_id,
            database_type: user.database_type,
            customer_id: user.customer_id,
            column_name: newConditions[index].selectedData,
            flag: "generatereport"
        }

        const res = await axios.post(`${apiUrlEndPoint2}/fetchUniques/`, formData)
        const apiData = await res?.data;

        if (apiData?.StatusCode === 404 || apiData?.StatusCode === 400) {
            toast.error(`${apiData?.error || apiData?.message}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            return
        } else if (apiData?.StatusCode === 500 || apiData?.StatusCode === 502) {
            toast.error(`${apiData?.error || apiData?.message}`, {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                theme: "light",
            });
            return
        }
        if (value) {
            newConditions[index].filteredValues = apiData?.data;
        } else {
            newConditions[index].filteredValues = [];
        }
        setConditions(newConditions);
    };

    const handleRemoveCondition = (index) => {
        const newConditions = conditions.filter((_, i) => i !== index);

        setConditions(
            newConditions.length
                ? [...newConditions]
                : [{ selectedData: "", selectedCondition: "", selectedValue: [], filteredValues: [] }]
        );

        setActiveIndex((prev) => {
            if (newConditions.length === 0) {
                return 0;
            }
            return prev > 0 ? prev - 1 : 0;
        });
    };

    const handleAddCondition = () => {
        setActiveIndex((prev) => prev + 1)
        setConditions([
            ...conditions,
            { selectedData: "", selectedCondition: "", selectedValue: [], filteredValues: [] }
        ]);
    };

    const handleFieldChange = (index, field, value) => {
        const newConditions = [...conditions];
        newConditions[index][field] = value;
        newConditions[index].selectedValue = [];
        setConditions(newConditions);
    };

    const handleSelectedValue = (index, value) => {
        setConditions((prevConditions) => {
            const updatedConditions = [...prevConditions];
            updatedConditions[index].selectedValue = value; // Update the selectedValue for the given index
            return updatedConditions; // Return the updated state
        });
    };

    const applyFilter = () => {
        setShowcolumnFilter((prev) => !prev)
        setOpenCustomFilter(false)
    }

    function createFilters(inputArray) {
        const filter_operations = [];
        const filter_options = [];

        inputArray.forEach(item => {
            const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;

            if (selectedData) {
                // Prepare filter operation
                const operationEntry = {
                    [selectedData]: selectedCondition,
                };
                filter_operations.push(operationEntry);

                // Prepare filter option
                let value = [...selectedValue];
                if (DateTimeType.includes(type)) {
                    if (startDate) value.push(startDate);
                    if (endDate) value.push(endDate);
                }

                const optionEntry = {
                    [selectedData]: value,
                };
                filter_options.push(optionEntry);
            }
        });

        return { filter_operations, filter_options };
    }

    const handleAddApplyFilter = async () => {
        for (const item of conditions) {
            const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;

            if (selectedData && selectedCondition && Array.isArray(selectedValue)) {
                if (!DateTimeType.includes(type) && selectedValue.length === 0) {
                    toast.error(`Please select or enter a value for ${selectedData}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "light",
                    });
                    return;
                }
                else if (DateTimeType.includes(type) && selectedCondition === "between" && (!startDate || !endDate)) {
                    toast.error(`Please enter both the start and end dates for ${selectedData}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "light",
                    });
                    return;
                }
                else if (DateTimeType.includes(type) && !startDate) {
                    toast.error(`Please enter a date for ${selectedData}`, {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        theme: "light",
                    });
                    return;
                }
            } else {
                toast.error("Please select the data", {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    theme: "light",
                });
                return;
            }
        }
        const createfilter = createFilters(conditions)
        if (createfilter) {
            try {
                await dispatch(
                    getfilterdata({
                        report_id,
                        email: user.user_email_id,
                        customer_id: user.customer_id,
                        database_type : user.database_type,
                        filter_options: createfilter.filter_options,
                        filter_operations: createfilter.filter_operations,
                        page_no: pagination.pageIndex + 1,
                        page_size: pagination.pageSize,
                        sorting_options: sorting,
                        flag: "generatereport"
                    })
                );
            } catch (error) {
                console.error("Error generating report ID:", error);
            } finally {
                setShowcolumnFilter((prev) => !prev)
            }
        }
        setOpenCustomFilter(false)
    }

    const handleClearFilter = async () => {
        const queryParameters = new URLSearchParams(window.location.search);
        const report_id = queryParameters.get("report_id");
        setLoading(true);
        try {
            // Reset conditions state
            setConditions([
                { selectedData: "", selectedCondition: "", selectedValue: [], filteredValues: [], startDate: "", endDate: "", type: "" }
            ]);
            await dispatch(
                generateReportId({
                    report_id,
                    email: user.user_email_id,
                    database_type : user.database_type,
                    page_no: 1,
                    page_size: 10,
                })
            );
        } catch (error) {
            console.error("Error clearing filter:", error);
        } finally {
            setLoading(false);
            setShowcolumnFilter((prev) => !prev)
            setOpenCustomFilter(false)
        }
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContainer}>
                <div className={styles.conditionGroup}>
                    <div
                        className={styles.conditionButton}
                    >
                        <button className={styles.rotateButton}>{conditionOperator}</button>
                    </div>
                    <div>
                        {conditions?.map((condition, index) => (
                            <div className={styles.conditionGroup} key={index}>
                                <div>
                                    <select
                                        className={styles.selectInput}
                                        onChange={(e) => handleSelectedData(index, e.target.value)}
                                        value={condition.selectedData}
                                    >
                                        <option value="" disabled>Data</option>
                                        {TotalColumns?.map((name, idx) => {
                                            return (
                                                <option style={{ cursor: "ponter !important" }} key={idx} value={name}>
                                                    {name}
                                                </option>
                                            );
                                        })}

                                    </select>

                                </div>
                                {(DateTimeType.includes(columns[conditions[index].selectedData]) || IntigetType.includes(columns[conditions[index].selectedData])) ? (
                                    <div style={{ display: 'flex', gap: '7px' }}>
                                        <select
                                            className={styles.selectInput}
                                            onChange={(e) => {
                                                const newConditions = [...conditions];
                                                newConditions[index].selectedCondition = e.target.value;
                                                newConditions[index].selectedValue = [];
                                                // newConditions[index].filteredValues = [];
                                                setConditions(newConditions);
                                            }}
                                            value={conditions[index]?.selectedCondition}
                                        >
                                            <option value="" disabled>Condition</option>
                                            <option value="equals">Equals</option>
                                            <option value="notEquals">Not Equals</option>
                                            {DateTimeType.includes(columns[conditions[index].selectedData]) &&
                                                <option value="between">Between Inclusive</option>
                                            }
                                            <option value="greaterThan">Greater Than</option>
                                            <option value="greaterThanOrEqualTo">Greater Than Or Equals to</option>
                                            <option value="lessThan">Less Than</option>
                                            <option value="lessThanOrEqualTo">Less Than Or Equals To</option>
                                        </select>
                                        {IntigetType.includes(columns[conditions[index].selectedData]) ? (
                                            conditions[index].selectedCondition === "equals" || conditions[index].selectedCondition === "notEquals" ? (
                                                <div style={{ display: "flex", gap: "4px" }}>
                                                    <FormControl variant="outlined" sx={{ width: 200 }} disabled={!conditions[index]?.selectedCondition || conditions[index].selectedCondition.length === 0}>
                                                        <Select
                                                            value={conditions[index].selectedValue}
                                                            onChange={(e) => handleSelectedValue(index, e.target.value)}
                                                            displayEmpty
                                                            input={<OutlinedInput />}
                                                            renderValue={() => {
                                                                if (conditions[index].selectedValue.length === 0) {
                                                                    return <em>Value</em>;
                                                                }
                                                                return conditions[index].selectedValue.join(" , ");
                                                            }}
                                                            multiple
                                                            sx={{ padding: '3px' }}
                                                        >
                                                            <MenuItem disabled value="">
                                                                <em>Value</em>
                                                            </MenuItem>
                                                            {conditions[index].filteredValues?.map((value, idx) => (
                                                                <MenuItem
                                                                    key={idx}
                                                                    value={value}
                                                                    sx={{
                                                                        backgroundColor: conditions[index].selectedValue.includes(value)
                                                                            ? "#c8e6c9"
                                                                            : "inherit", // Highlight selected items
                                                                        "&:hover": {
                                                                            backgroundColor: conditions[index].selectedValue.includes(value)
                                                                                ? "#a5d6a7"
                                                                                : "#f5f5f5", // Hover effect for menu items
                                                                        },
                                                                    }}
                                                                >
                                                                    {value}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </div>
                                            ) : (
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Enter value"
                                                        value={conditions[index].selectedValue}
                                                        onChange={(e) => {
                                                            const updatedConditions = [...conditions];
                                                            updatedConditions[index].selectedValue[0] = e.target.value;
                                                            setConditions(updatedConditions);
                                                        }}
                                                        style={{
                                                            width: "200px",
                                                            padding: "6px",
                                                            border: "1px solid #ccc",
                                                            borderRadius: "4px",
                                                        }}
                                                    />
                                                </div>
                                            )
                                        ) : (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="datetime-local"
                                                    step="1"
                                                    className={styles.date}
                                                    value={conditions[index].startDate}
                                                    onChange={(e) => {
                                                        const updatedConditions = [...conditions];
                                                        updatedConditions[index] = {
                                                            ...updatedConditions[index],
                                                            startDate: e.target.value
                                                        };
                                                        setConditions(updatedConditions);
                                                    }} />
                                                {conditions[index].selectedCondition === "between" &&
                                                    <input
                                                        type="datetime-local"
                                                        step="1"
                                                        className={styles.date}
                                                        value={conditions[index].endDate}
                                                        onChange={(e) => {
                                                            const updatedConditions = [...conditions];
                                                            updatedConditions[index] = {
                                                                ...updatedConditions[index],
                                                                endDate: e.target.value
                                                            };
                                                            setConditions(updatedConditions);
                                                        }}
                                                    />
                                                }
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '7px' }}>
                                        <div>
                                            <select
                                                className={styles.selectInput}
                                                onChange={(e) => handleFieldChange(index, "selectedCondition", e.target.value)}
                                                value={condition.selectedCondition}
                                            >
                                                <option value="" disabled>Condition</option>
                                                <option value="equals">Equals</option>
                                                <option value="notEquals">Not Equals</option>
                                                <option value="startsWith">Starts With</option>
                                                <option value="contains">Contains</option>
                                                <option value="endsWith">Ends With</option>
                                            </select>
                                        </div>
                                        {conditionTypesForInputBox.includes(conditions[index].selectedCondition) && (
                                            <div>
                                                <input
                                                    type="text"
                                                    className={styles.textInput}
                                                    onChange={(e) => {
                                                        const updatedConditions = [...conditions];
                                                        updatedConditions[index].selectedValue[0] = e.target.value;
                                                        setConditions(updatedConditions);
                                                    }}
                                                    value={conditions[index].selectedValue[0]}
                                                />
                                            </div>
                                        )}
                                        {!conditionTypesForInputBox.includes(conditions[index].selectedCondition) && (
                                            <div>
                                                <FormControl variant="outlined" sx={{ width: 200 }} disabled={!conditions[index]?.selectedCondition || conditions[index].selectedCondition.length === 0}>
                                                    <Select
                                                        value={conditions[index].selectedValue}
                                                        onChange={(e) => handleSelectedValue(index, e.target.value)}
                                                        displayEmpty
                                                        input={<OutlinedInput />}
                                                        renderValue={() => {
                                                            if (conditions[index].selectedValue.length === 0) {
                                                                return <em>Value</em>;
                                                            }
                                                            return conditions[index].selectedValue.join(' , ');
                                                        }}
                                                        multiple
                                                        sx={{ padding: '3px' }}
                                                    >
                                                        <MenuItem disabled value="">
                                                            <em>value</em>
                                                        </MenuItem>{ }
                                                        {conditions[index].filteredValues?.map((value, idx) => {
                                                            return (
                                                                <MenuItem
                                                                    key={idx}
                                                                    value={value}
                                                                    style={getStyles(value, conditions[index].selectedValue, theme)}
                                                                >
                                                                    {value}
                                                                </MenuItem>
                                                            );
                                                        })}
                                                    </Select>
                                                </FormControl>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div>
                                    <button
                                        className={styles.removeConditionButton}
                                        onClick={() => handleRemoveCondition(index)}
                                    >
                                        ❎
                                    </button>
                                </div>
                            </div>
                        ))}
                        <div className={styles.actionButtons}>
                            <button
                                className={styles.primaryButton}
                                onClick={handleAddCondition}
                            >
                                Add Condition +
                            </button>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <button
                                    className={styles.primaryButton}
                                    onClick={handleClearFilter}
                                >
                                    Clear Filter Value x
                                </button>
                                <button
                                    className={styles.primaryButton}
                                    onClick={handleAddApplyFilter}
                                >
                                    Apply Filter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <button className={styles.close} onClick={applyFilter}>❌</button>
            </div>
        </div>
    );
};


export default CustomFilter;