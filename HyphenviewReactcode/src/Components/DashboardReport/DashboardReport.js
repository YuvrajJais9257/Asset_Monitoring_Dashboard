import React, { useEffect, useMemo, useState } from 'react';
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Tooltip,
    Slider
} from "@mui/material";
import { CircularProgress } from "@mui/material";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import GetAppIcon from '@mui/icons-material/GetApp';
import _ from "lodash";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { MdPictureAsPdf } from "react-icons/md";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";
import './../globalCSS/dashboardreport/dashboardreport.css';
import { decryptData } from '../utils/EncriptionStore';
import axios from 'axios';
import { exportcsvreport, exportexcelreport, exportpdfreport } from '../../actions/reportmanagement';
import { useDispatch, useSelector } from 'react-redux';
import pako from 'pako';
import { toast } from 'react-toastify';
const apiUrlEndPoint2 = process.env.REACT_APP_API_URL2;
function DashboardReport({ TableData, height }) {
    const [data, setData] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [rowCount, setRowCount] = useState();
    const [tabledetail, setTabledata] = useState([])
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 5,
    });
    const dispatch = useDispatch();
    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();
    const open = Boolean(anchorEl);
    const apiData = useSelector((state) => state);
    const exportedfilepath = apiData?.reportmanagement?.exportedfilepath;

    const isDateTime = (value) => {
        const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?$/;
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateTimeRegex.test(value) || dateRegex.test(value);
    };

    const previewReportTableRowDiv = document.querySelector(".MuiTableRow-head")

    if (previewReportTableRowDiv) {
        previewReportTableRowDiv.classList.add("dashboardresponsive-header");
        previewReportTableRowDiv.addEventListener("mouseenter", () => {
            previewReportTableRowDiv.style.backgroundColor = "#4d5256";
            previewReportTableRowDiv.style.color = "#fff";
        });
    }


    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAndDecompressFile = async () => {
            try {
                const compressedData = new Uint8Array(exportedfilepath.data);
                const Filename = exportedfilepath.headers.get('X-Filename');
                const decompressedData = pako.inflate(compressedData);
                const blob = new Blob([decompressedData], { type: "application/pdf" }); // Change type based on the file
                const link = document.createElement("a");
                link.href = window.URL.createObjectURL(blob);
                link.download = Filename; // Desired file name
                document.body.appendChild(link);
                link.click();

                // Clean up the temporary link
                document.body.removeChild(link);
            } catch (err) {
                setError("Failed to fetch or decompress the file.");
                console.error(err);
            }
        };

        fetchAndDecompressFile();
    }, [exportedfilepath]);

    useEffect(() => {
        if (TableData?.data.length > 0) {
            setData(TableData?.data);
            setTabledata(TableData)
            setLoading(false);
            setRowCount(TableData && TableData?.total_records || 10)
        }
    }, [TableData]);

    const columns = useMemo(() => {
        return tabledetail?.column_names
            ?.filter(column => tabledetail?.data.some(val => val[column] !== null && val[column] !== undefined)).map(column => {
                const isDateColumn = tabledetail?.data.some(val => isDateTime(val[column]));
                const isIntegerColumn = tabledetail?.data.every(val => Number.isInteger(val[column]));

                if (isDateColumn) {
                    return {
                        accessorFn: (originalRow) => {
                            const value = originalRow[column];
                            return value ? new Date(value) : null; // Only convert to Date if value is present
                        },
                        id: column,
                        header: column,
                        Cell: ({ cell }) => {
                            const value = cell.getValue();
                            if (!value) return ""; // Return empty string if value is null or undefined
                            return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`;
                        },
                    };
                } else if (isIntegerColumn) {
                    return {
                        accessorFn: row => Number(row[column]),
                        id: column,
                        header: column,
                        // filterVariant: 'range-slider',
                        Cell: ({ cell }) => cell.getValue(),
                    };
                } else if (column != '' || column != null) {
                    return {
                        header: column,
                        id: column,
                        accessorFn: row => String(row[column]),
                        enableClickToCopy: false,
                        muiTableBodyCellProps: {
                            sx: {
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                flexGrow: 1,
                            }
                        },
                        muiTableHeadCellProps: {
                            sx: {
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                flexGrow: 1,
                            }
                        }
                    };
                }
            }) || [];
    }, [data, TableData]);



    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleExportPdf = () => {
        const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
        const columnThatNeedToExport = visibleColumns.map((item) => item.header);
        if (columnThatNeedToExport.length === 0) {
            toast.error(`None of the column is selected you can select at list one column in filter`);
            return
        } else if (columnThatNeedToExport.length > 12) {
            toast.warn(`For PDF download, a maximum of 12 columns is supported. Kindly Select up to 12 columns.`);
            return
        }
        const report_name = tabledetail?.title;
        dispatch(exportpdfreport({
            report_name,
            database_type: user.database_type,
            file_format: "pdf",
            customer_id: user.customer_id,
            user_email_id: user?.user_email_id,
            column_names: columnThatNeedToExport
        }))
    };

    const handleExportExcel = () => {
        const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
        const columnthatneedtoexport = visibleColumns.map((item) => item.header)
        const report_name = tabledetail?.title;
        dispatch(exportexcelreport({
            report_name,
            ddatabase_type: user.database_type,
            file_format: "excel",
            customer_id: user.customer_id,
            user_email_id: user?.user_email_id,
            column_names: columnthatneedtoexport
        }))

    };



    const handleExportCSV = () => {
        const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
        const columnthatneedtoexport = visibleColumns.map((item) => item.header)
        const report_name = tabledetail?.title;
        dispatch(exportcsvreport({
            report_name,
            database_type: user.database_type,
            file_format: "csv",
            customer_id: user.customer_id,
            user_email_id: user?.user_email_id,
            column_names: columnthatneedtoexport
        }))
    };

    const handlePaginationChange = async (updaterOrState) => {
        const newState = typeof updaterOrState === "function" ? updaterOrState(pagination) : updaterOrState;

        // Guard clause for invalid data
        if (!tabledetail?.title || !user?.user_email_id) {
            console.warn("Missing required data (title or user email).");
            return;
        }

        if (newState && newState.pageIndex >= 0) {
            try {
                setLoading(true);
                // Fetch updated report data
                const response = await axios.post(`${apiUrlEndPoint2}/getReportData/`, {
                    report_title: tabledetail.title,
                    database_type: user.database_type,
                    email: user.user_email_id,
                    page_no: newState.pageIndex + 1, // Backend pagination is 1-based
                    page_size: newState.pageSize,
                });
                if (response.status === 200 && response?.data?.report_type === "table") {
                    setData(response?.data?.data); // Update the main data state
                    setTabledata(response.data || []); // Update table content state
                } else {
                    console.warn("Unexpected report type or no data returned.");
                }
            } catch (error) {
                console.error("Error fetching report data:", error.message || error);
            } finally {
                setLoading(false); // Ensure spinner is hidden after processing
            }
        }

        // Update pagination state
        setPagination(newState);
    };


    const table = useMaterialReactTable({
        columns,
        data,
        enableStickyHeader: false,
        enableStickyFooter: true,
        paginationDisplayMode: "pages",
        enableHiding: false,
        state: { pagination, },
        enableColumnVisibility: false,
        enableFilters: false,
        enableGlobalFilter: false,
        enableDensityToggle: false,
        enableClickToCopy: false,
        enableColumnActions: false,
        enableColumnFilters: false,
        enableFullScreenToggle: false,
        layoutMode: 'grid',
        enableColumnResizing: false,
        rowCount: rowCount,
        enableSorting: false,
        muiTableProps: {
            sx: (theme) => ({
                "& td[data-pinned='true'],th[data-pinned='true']": {
                    color: theme.palette.common.white,
                },
                padding: 0,
                margin: 0,
                width: '100%',
                overflowX: 'auto',
            }),
        },
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
                            <span style={{ height: "22px" }}>
                                <GetAppIcon style={{ color: "white" }} />
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
                </Box>
                <Typography
                    variant="h6"
                    sx={{ textAlign: 'center', fontWeight: 'bold', flex: 1 }}
                >
                    {table?.getState()?.caption || tabledetail?.title}
                </Typography>
            </Box>
        ),
        // enableFacetedValues: true,
        manualPagination: true,
        onPaginationChange: handlePaginationChange,
        initialState: { pagination: { pageSize: 5, pageIndex: 0 }, density: 'compact' },
    });



    return (
        <div>

            <div className='DashboardReport_table_main_container'>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
                        <CircularProgress /> {/* Display spinner while loading */}
                    </Box>
                ) : (
                    <LocalizationProvider dateAdapter={AdapterMoment}>
                        <Box sx={{ py: 3, border: '1px solid #ddd', borderRadius: '4px', height: height, overflowY: "scroll" }}>
                            <MaterialReactTable
                                table={table}
                                sx={{ width: '100%', overflowX: 'auto', border: '2px solid #ddd', borderRadius: '10px' }}
                                className="horizontal-stripe-table"
                            />
                        </Box>
                    </LocalizationProvider>
                )}
            </div>
        </div>
    );
}

export default DashboardReport;