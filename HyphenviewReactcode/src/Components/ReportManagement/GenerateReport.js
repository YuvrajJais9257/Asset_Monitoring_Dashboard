import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { generateReportId, getfilterdata, exportexcelreport, exportpdfreport, exportcsvreport } from "../../actions/reportmanagement";
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    Container,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Tooltip,
    Slider,
    CircularProgress,
} from "@mui/material";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import GetAppIcon from '@mui/icons-material/GetApp';
import _ from "lodash";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { MdPictureAsPdf } from "react-icons/md";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";
import Header from '../header';
import './../globalCSS/reportmanagement/generatereport.css';
import '../HighCharts/DrilldownStyleCorrector.css'
import { decryptData } from '../utils/EncriptionStore';
import CustomFilter from './CustomFilter';
import pako from 'pako';
import { toast } from 'react-toastify';



function GenerateReport() {
    const [data, setData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [sorting, setSorting] = useState([]);
    const [openCustomFilter, setOpenCustomFilter] = useState(false)
    const [conditions, setConditions] = useState([
        { selectedData: "", selectedCondition: "", selectedValue: [], filteredValues: [], startDate: "", endDate: "", type: "" }
    ]);
    const open = Boolean(anchorEl);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [rowCount, setRowCount] = useState();
    const DateTimeType = [
        "TIMESTAMP", "DATE", "DATETIME", "NEWDATE", "TIMESTAMPTZ", "TIMETZ"
    ]
    const IntigetType = [
        "INT", "INTEGER", "FLOAT", "DOUBLE", "INT2VECTOR", "NUMRANGE", "INT4RANGE"
    ]
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 10,
    });

    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();

    const [loading, setLoading] = useState(true);
    const apiData = useSelector((state) => state);

    useEffect(() => {
        const fetchData = async () => {
            const queryParameters = new URLSearchParams(window.location.search);
            const report_id = queryParameters.get("report_id");
            if (report_id && user?.user_email_id) {
                await dispatch(
                    generateReportId({
                        report_id,
                        email: user.user_email_id,
                        database_type: user.database_type,
                        page_no: pagination.pageIndex + 1,
                        page_size: pagination.pageSize,
                    })
                );
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const previewReportTableRowDiv = document.querySelector(".MuiTableRow-head")
    if (previewReportTableRowDiv) {
        previewReportTableRowDiv.classList.add("Generateresponsive-header");
        previewReportTableRowDiv.addEventListener("mouseenter", () => {
            previewReportTableRowDiv.style.backgroundColor = "#4d5256";
            previewReportTableRowDiv.style.color = "#fff";
        })
    }

    const generatreportdetail = apiData?.reportmanagement?.generate_report_id;
    const exportedfilepath = apiData?.reportmanagement?.exportedfilepath;
   

    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndDecompressFile = async () => {
            try {
                const compressedData = new Uint8Array(exportedfilepath.data);
                const Filename = exportedfilepath.headers.get('X-Filename');
                const decompressedData = pako.inflate(compressedData);
                const blob = new Blob([decompressedData], { type: "application/pdf" });
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = Filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (err) {
                setError("Failed to fetch or decompress the file.");
                console.error(err);
            }
        };

        fetchAndDecompressFile();
    }, [exportedfilepath]);



    const columns = useMemo(() => {
        setRowCount(generatreportdetail && generatreportdetail?.total_records || 10)
        return generatreportdetail?.column_names?.map(column => {
            const dateType = generatreportdetail?.column_types?.[column] && DateTimeType.includes(generatreportdetail?.column_types[column])
                ? 'datetime'
                : generatreportdetail?.column_types?.[column] === 'DATE'
                    ? 'date'
                    : null;

            if (dateType === 'datetime') {
                return {
                    accessorFn: (originalRow) => {
                        const value = originalRow[column];
                        return value ? new Date(value) : null;
                    },
                    id: column,
                    header: column,
                    filterVariant: 'datetime',
                    Cell: ({ cell }) => {
                        const value = cell.getValue();
                        if (!value) return "";
                        return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`;
                    },
                };
            } else if (dateType === 'date') {
                return {
                    accessorFn: (originalRow) => {
                        const value = originalRow[column];
                        return value ? new Date(value) : null;
                    },
                    id: column,
                    header: column,
                    filterVariant: 'date',
                    Cell: ({ cell }) => {
                        const value = cell.getValue();
                        if (!value) return "";
                        return value.toLocaleDateString();
                    },
                };
            }
            else {
                return {
                    header: column,
                    id: column,
                    accessorFn: row => String(row[column]),
                    enableClickToCopy: false,
                };
            }
        }) || [];
    }, [data, generatreportdetail]);

    const [showcolumnFilter, setShowcolumnFilter] = useState(false)

    

    const handlePaginationChange = async (updaterOrState) => {
        try {
            const newState = typeof updaterOrState === "function" ? updaterOrState(pagination) : updaterOrState;
            const queryParameters = new URLSearchParams(window.location.search);
            const report_id = queryParameters.get("report_id");
            
            if (report_id && user?.user_email_id) {
                if (conditions.length > 0 && conditions[0].selectedData !== "") {
                    for (const item of conditions) {
                        const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;
                        
                        if (selectedData && selectedCondition && Array.isArray(selectedValue)) {
                            if (!DateTimeType.includes(type) && selectedValue.length === 0) {
                                toast.error(`Please select or enter a value for ${selectedData}`);
                                return;
                            } else if (DateTimeType.includes(type) && selectedCondition === "between" && (!startDate || !endDate)) {
                                toast.error(`Please enter both the start and end dates for ${selectedData}`);
                                return;
                            } else if (DateTimeType.includes(type) && !startDate) {
                                toast.error(`Please enter a date for ${selectedData}`);
                                return;
                            }
                        } else {
                            toast.error("Please select the data");
                            return;
                        }
                    }
                    
                    const createfilter = createFilters(conditions);
                    if (createfilter.filter_options.length > 0) {
                        setLoading(true); 
                        await dispatch(
                            getfilterdata({
                                report_id,
                                email: user.user_email_id,
                                customer_id: user.customer_id,
                                database_type:user.database_type,
                                filter_options: createfilter.filter_options,
                                filter_operations: createfilter.filter_operations,
                                page_no: newState.pageIndex + 1,
                                page_size: newState.pageSize,
                                sorting_options: sorting,
                                flag: "generatereport"
                            })
                        );
                    }
                } else {
                    setLoading(true); 
                    await dispatch(
                        generateReportId({
                            report_id,
                            email: user.user_email_id,
                            database_type: user.database_type,
                            page_no: newState.pageIndex + 1,
                            page_size: newState.pageSize,
                        })
                    );
                }
            }
            
            setPagination((old) => {
                return typeof updaterOrState === "function" ? updaterOrState(old) : updaterOrState;
            });
        } catch (error) {
            console.error("Error in handlePaginationChange:", error);
            toast.error("An error occurred while processing pagination.");
        } finally {
            setLoading(false); // Stop loader
        }
    };
    
    useEffect(() => {
        if (generatreportdetail?.data) {
            setData(generatreportdetail.data);
        }
    }, [generatreportdetail]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const queryParameters = new URLSearchParams(window.location.search);
    const report_id = queryParameters.get("report_id");

    function createFilters(inputArray) {
        const filter_operations = [];
        const filter_options = [];
        inputArray.forEach(item => {
            const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;
            if (selectedData) {
                const operationEntry = {
                    [selectedData]: selectedCondition,
                };
                filter_operations.push(operationEntry);
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

    const handleExportPdf = async () => {
        try {
            const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
            const columnThatNeedToExport = visibleColumns.map((item) => item.header);
            if(columnThatNeedToExport.length===0){
                toast.error(`None of the column is selected you can select at list one column in filter`);
                return
            }else if(columnThatNeedToExport.length > 12){
                toast.warn(`For PDF download, a maximum of 12 columns is supported. Kindly Select up to 12 columns.`);
                return
            }

            if (conditions.length > 0 && conditions[0].selectedData !== "") {
                for (const item of conditions) {
                    const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;

                    if (selectedData && selectedCondition && Array.isArray(selectedValue)) {
                        if (!DateTimeType.includes(type) && selectedValue.length === 0) {
                            toast.error(`Please select or enter a value for ${selectedData} in filter`);
                            return;
                        } else if (DateTimeType.includes(type) && selectedCondition === "between" && (!startDate || !endDate)) {
                            toast.error(`Please enter both the start and end dates for ${selectedData} in filter`);
                            return;
                        } else if (DateTimeType.includes(type) && !startDate) {
                            toast.error(`Please enter a date for ${selectedData} in filter`);
                            return;
                        }
                    } else {
                        toast.error("Please select the data in filter");
                        return;
                    }
                }
                const createfilter = createFilters(conditions)
                setLoading(true);
                await dispatch(exportpdfreport({
                    report_name:generatreportdetail?.report_title,
                    database_type:user.database_type,
                    file_format: "pdf",
                    customer_id: user.customer_id,
                    user_email_id : user?.user_email_id,
                    column_names: columnThatNeedToExport,
                    filter_options: createfilter.filter_options,
                    filter_operations: createfilter.filter_operations,
                    sorting_options: sorting,
                    flag: "generatereport"
                }))
            }else{
                setLoading(true);
                await dispatch(exportpdfreport({
                    report_name:generatreportdetail?.report_title,
                    database_type: user.database_type,
                    file_format: "pdf",
                    customer_id: user.customer_id,
                    user_email_id : user?.user_email_id,
                    column_names: columnThatNeedToExport,
                    filter_options: [],
                    filter_operations: [],
                    sorting_options: sorting,
                    flag: "generatereport"
                }))
            }
        } catch (error) {
            console.error("Error generating report ID:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
            const columnthatneedtoexport = visibleColumns.map((item) => item.header)
            if(columnthatneedtoexport.length===0){
                toast.error(`None of the column is selected you can select at list one column in filter`);
                return
              }
            if (conditions.length > 0 && conditions[0].selectedData !== "") {
                for (const item of conditions) {
                    const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;

                    if (selectedData && selectedCondition && Array.isArray(selectedValue)) {
                        if (!DateTimeType.includes(type) && selectedValue.length === 0) {
                            toast.error(`Please select or enter a value for ${selectedData} in filter`);
                            return;
                        } else if (DateTimeType.includes(type) && selectedCondition === "between" && (!startDate || !endDate)) {
                            toast.error(`Please enter both the start and end dates for ${selectedData} in filter`);
                            return;
                        } else if (DateTimeType.includes(type) && !startDate) {
                            toast.error(`Please enter a date for ${selectedData} filter`);
                            return;
                        }
                    } else {
                        toast.error("Please select the data in filter");
                        return;
                    }
                }
                const createfilter = createFilters(conditions)
                setLoading(true);
                await dispatch(exportexcelreport({
                    report_name:generatreportdetail?.report_title,
                    database_type: user.database_type,
                    file_format: "excel",
                    customer_id: user.customer_id,
                    column_names: columnthatneedtoexport,
                    user_email_id : user?.user_email_id,
                    filter_options: createfilter.filter_options,
                    filter_operations: createfilter.filter_operations,
                    sorting_options: sorting,
                    flag: "generatereport"
                }))
            }else{
                setLoading(true);
                await dispatch(exportexcelreport({
                    report_name:generatreportdetail?.report_title,
                    database_type: user.database_type,
                    file_format: "excel",
                    customer_id: user.customer_id,
                    user_email_id : user?.user_email_id,
                    column_names: columnthatneedtoexport,
                    filter_options: [],
                    filter_operations: [],
                    sorting_options: sorting,
                    flag: "generatereport"
                }))
            }
        } catch (error) {
            console.error("Error generating report ID:", error);
        } finally {
            setLoading(false);
        }

    };

    const handleExportCSV = async () => {
        try {
            const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
            const columnthatneedtoexport = visibleColumns.map((item) => item.header)
            if(columnthatneedtoexport.length===0){
                toast.error(`None of the column is selected you can select at list one column in filter`);
                return
              }
            if (conditions.length > 0 && conditions[0].selectedData !== "") {
                for (const item of conditions) {
                    const { selectedData, selectedCondition, selectedValue, type, startDate, endDate } = item;

                    if (selectedData && selectedCondition && Array.isArray(selectedValue)) {
                        if (!DateTimeType.includes(type) && selectedValue.length === 0) {
                            toast.error(`Please select or enter a value for ${selectedData} in filter`);
                            return;
                        } else if (DateTimeType.includes(type) && selectedCondition === "between" && (!startDate || !endDate)) {
                            toast.error(`Please enter both the start and end dates for ${selectedData} in filter`);
                            return;
                        } else if (DateTimeType.includes(type) && !startDate) {
                            toast.error(`Please enter a date for ${selectedData} in filter`);
                            return;
                        }
                    } else {
                        toast.error("Please select the data in filter");
                        return;
                    }
                }
                const createfilter = createFilters(conditions)
                setLoading(true);
                await dispatch(exportcsvreport({
                    report_name:generatreportdetail?.report_title,
                    database_type: user.database_type,
                    file_format: "csv",
                    customer_id: user.customer_id,
                    user_email_id : user?.user_email_id,
                    column_names: columnthatneedtoexport,
                    filter_options: createfilter.filter_options,
                    filter_operations: createfilter.filter_operations,
                    sorting_options: sorting,
                    flag: "generatereport"
                }))
            }else{
                setLoading(true);
                await dispatch(exportcsvreport({
                    report_name:generatreportdetail?.report_title,
                    database_type: user.database_type,
                    file_format: "csv",
                    customer_id: user.customer_id,
                    user_email_id : user?.user_email_id,
                    column_names: columnthatneedtoexport,
                    filter_options: [],
                    filter_operations: [],
                    sorting_options: sorting,
                    flag: "generatereport"
                }))
            }
        } catch (error) {
            console.error("Error generating report ID:", error);
        } finally {
            setLoading(false);
        }
    };

    const handelcolumnchanges = async () => {
        setOpenCustomFilter((prev) => !prev);
        setShowcolumnFilter((prev) => !prev);
    };

    const table = useMaterialReactTable({
        columns,
        data,
        enableStickyHeader: false,
        enableStickyFooter: true,
        paginationDisplayMode: "pages",
        enableColumnResizing: true,
        enableGlobalFilter: false,
        enableClickToCopy: false,
        enableColumnActions: false,
        manualPagination: true,
        rowCount: rowCount,
        onShowColumnFiltersChange: handelcolumnchanges,
        state: { sorting, pagination, showColumnFilters: showcolumnFilter, },
        layoutMode: 'grid',
        onSortingChange: (newSorting) => {
            const newSortingsorting = newSorting();
            const updatedSorting = [...sorting];

            newSortingsorting.forEach((newSort) => {
                const existingIndex = updatedSorting.findIndex((s) => s.id === newSort.id);
                if (existingIndex > -1) {
                    if (updatedSorting[existingIndex].desc !== newSort.desc) {
                        updatedSorting.splice(existingIndex, 1);

                    } else {
                        updatedSorting[existingIndex] = newSort;
                    }
                } else {
                    updatedSorting.push(newSort);
                }
            });
            setSorting(updatedSorting);
        },
        enableColumnFilters: true,
        isMultiSortEvent: () => true,
        muiTableProps: {
            sx: (theme) => ({
                "& td[data-pinned='true'],th[data-pinned='true']": {
                    color: theme.palette.common.white,
                },
                padding: 0,
                margin: 0,
                width: '100%',
                overflowX: 'auto !important',
            }),
        },
        enableColumnOrdering: true,
        //enableRowOrdering: true,
        muiRowDragHandleProps: ({ table }) => ({
            onDragEnd: () => {
                const { draggingRow, hoveredRow } = table.getState();
                if (hoveredRow && draggingRow) {
                    data.splice(
                        hoveredRow.index,
                        0,
                        data.splice(draggingRow.index, 1)[0]
                    );
                    setData([...data]);
                }
            },
        }),
        muiPaginationProps: {
            variant: "outlined",
            shape: "rounded",
            sx: (theme) => ({
                "& .Mui-selected": {
                    background: `${theme.palette.primary.main} !important`,
                    color: theme.palette.common.white,
                },
            }),
        },
        renderTopToolbarCustomActions: ({ table }) => (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title="Download">
                        <IconButton onClick={handleClick}>
                            <span style={{height: "22px" }}>
                            <GetAppIcon style={{ color: "white" }}/>
                            </span>
                        </IconButton>
                    </Tooltip>
                    <Menu
                        id="export-menu"
                        anchorEl={anchorEl}
                        open={open}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    >
                        <MenuItem onClick={() => handleExportPdf()}>
                            <MdPictureAsPdf color="primary" /> Export PDF
                        </MenuItem>
                        <MenuItem onClick={() => handleExportExcel()}>
                            <FaFileExcel color="primary" /> Export Excel
                        </MenuItem>
                        <MenuItem onClick={() => handleExportCSV()}>
                            <FaFileCsv color="primary" /> Export CSV
                        </MenuItem>
                    </Menu>
                    <Tooltip title="Clear All Sorting">
                        <span>
                            <Button
                                size="small"
                                color="primary"
                                onClick={() => setSorting([])}
                                disabled={sorting.length === 0}
                            >
                                <ClearAllIcon />
                            </Button>
                        </span>
                    </Tooltip>
                </Box>
                <Typography
                    variant="h6"
                    sx={{ textAlign: 'center', fontWeight: 'bold', flex: 1 }}
                >
                    {table?.getState()?.caption || generatreportdetail?.report_title}
                </Typography>
            </Box>
        ),
        enableFacetedValues: true,
        manualPagination: true,
        onPaginationChange: handlePaginationChange,
        initialState: { pagination: { pageSize: 10, pageIndex: 0 }, showColumnFilters: showcolumnFilter, density: 'compact' },
    });

    const handleGoToDashboard = () => {
        navigate('/Dashboard');
    };

    const handleGoToReportManagement = () => {
        navigate("/ListOfReports");
    };



    return (
        <>
            <div className='side-nav'>
                <Header />
            </div>
            <div className='Custom_container'>
                <div className="View-Report-Page-Header">
                    {openCustomFilter && <CustomFilter setOpenCustomFilter={setOpenCustomFilter} columns={generatreportdetail?.column_types} data={generatreportdetail?.data} pagination={pagination} setShowcolumnFilter={setShowcolumnFilter} conditions={conditions} setConditions={setConditions}  sorting={sorting} length={conditions.length}/>}
                    <span className="fas fa-house-user" aria-hidden="true" onClick={handleGoToDashboard}></span>
                    <span>/</span>
                    <span
                        className="go-back-link-tag"
                        onClick={handleGoToReportManagement}
                        style={{ cursor: "pointer" }}
                    >
                        Report Management
                    </span>
                    <span>/</span>
                    <span>View Report</span>

                </div>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <div style={{ height: 400, marginLeft: "80px", width: "calc(100% - 95px)" }}>
                        <LocalizationProvider dateAdapter={AdapterMoment}>
                            <Box sx={{ px: 5, py: 3, border: '1px solid #ddd', borderRadius: '4px' }} className="scrollable-table-container" >
                                <MaterialReactTable
                                    table={table}
                                    sx={{ width: '100%', overflowX: 'auto', border: '2px solid #ddd', borderRadius: '10px' }}
                                // className="horizontal-stripe-table"
                                />
                            </Box>
                        </LocalizationProvider>
                    </div>
                )}
            </div>

        </>
    );
}

export default GenerateReport;