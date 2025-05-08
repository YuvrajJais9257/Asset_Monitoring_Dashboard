/*modified by Yuvraj Jaiswal */
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Tooltip,
  Slider,
  CircularProgress,

} from "@mui/material";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import GetAppIcon from "@mui/icons-material/GetApp";
import _ from "lodash";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import { MdPictureAsPdf } from "react-icons/md";
import { FaFileExcel, FaFileCsv } from "react-icons/fa";
import "./../globalCSS/previewhighcharts/previewreporttable.css";
import { customPreviewChartData } from "../../actions/auth";
import "./../HighCharts/DrilldownStyleCorrector.css";
import { decryptData } from '../utils/EncriptionStore';
import { exportcsvreport, exportexcelreport, exportpdfreport } from "../../actions/reportmanagement";
import pako from 'pako';
import { toast } from 'react-toastify';
function PreviewReportTable() {
  const [data, setData] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const dispatch = useDispatch();
  const [rowCount, setRowCount] = useState();
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const [loading, setLoading] = useState(true);
  const CustomeDetailOfReport = JSON.parse(
    localStorage.getItem("customeDetailOfReport")
  );

  const apiData = useSelector((state) => state);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true); // Start the loader
        await dispatch(
          customPreviewChartData({
            report_name: CustomeDetailOfReport.title,
            report_type: CustomeDetailOfReport.type,
            chart_type: CustomeDetailOfReport.chart_type,
            query: CustomeDetailOfReport.query,
            email: user.user_email_id,
            database_type: user.database_type,
            connection_type: CustomeDetailOfReport.connection_type,
            schema: CustomeDetailOfReport.schema,
            page_no: pagination.pageIndex + 1, // Backend pagination is 1-based
            page_size: pagination.pageSize,
          })
        );
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false); // Stop the loader
      }
    };

    fetchData();
  }, []);

  const previewReportTableRowDiv = document.querySelector(".MuiTableRow-head")
  if (previewReportTableRowDiv) {
    previewReportTableRowDiv.classList.add("Prevresponsive-header");
    previewReportTableRowDiv.addEventListener("mouseenter", () => {
      previewReportTableRowDiv.style.backgroundColor = "#4d5256";
      previewReportTableRowDiv.style.color = "#fff";
    });
  }
  const PreviewchartData = apiData?.auth?.custom_preview_table;
  const exportedfilepath = apiData?.reportmanagement?.exportedfilepath;

  const isDateTime = (value) => {
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?$/;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateTimeRegex.test(value) || dateRegex.test(value);
  };

  useEffect(() => {
    if (!PreviewchartData || Object.keys(PreviewchartData).length === 0) {
      return;
    }
    if (Array.isArray(PreviewchartData?.data) && PreviewchartData?.data.length > 0) {
      setData(PreviewchartData?.data);
      setRowCount(PreviewchartData && PreviewchartData?.total_records || 10);
    }
  }, [PreviewchartData]);



  const columns = useMemo(() => {
    return (
      PreviewchartData?.column_names
        ?.filter((column) =>
          PreviewchartData?.data.some(
            (val) => val[column] !== null && val[column] !== undefined
          )
        )
        .map((column) => {
          const isDateColumn = PreviewchartData?.data.some((val) =>
            isDateTime(val[column])
          );
          const isIntegerColumn = PreviewchartData?.data.every((val) =>
            Number.isInteger(val[column])
          );

          if (isDateColumn) {
            return {
              accessorFn: (originalRow) => {
                const value = originalRow[column];
                return value ? new Date(value) : null;
              },
              id: column,
              header: column,
              Cell: ({ cell }) => {
                const value = cell.getValue();
                if (!value) return "";
                return `${value.toLocaleDateString()} ${value.toLocaleTimeString()}`;
              },
            };
          } else if (isIntegerColumn) {
            return {
              accessorFn: (row) => Number(row[column]),
              id: column,
              header: column,
              Cell: ({ cell }) => cell.getValue(),

            };
          } else if (column != "" || column != null) {
            return {
              header: column,
              id: column,
              accessorFn: (row) => String(row[column]),
              enableClickToCopy: false,
              muiTableBodyCellProps: {
                sx: {
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  flexGrow: 1,
                },
              },
              muiTableHeadCellProps: {
                sx: {
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  flexGrow: 1,
                },
              },
            };
          }
        }) || []
    );
  }, [data, PreviewchartData]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  useEffect(() => {
    const fetchAndDecompressFile = async () => {
      try {
        const compressedData = new Uint8Array(exportedfilepath.data);
        const decompressedData = pako.inflate(compressedData);
        const Filename = exportedfilepath.headers.get('X-Filename');
        const blob = new Blob([decompressedData], { type: "application/pdf" }); // Change type based on the file
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = Filename; // Desired file name
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
    const report_name = CustomeDetailOfReport?.title;
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
    const report_name = CustomeDetailOfReport?.title;
    dispatch(exportexcelreport({
      report_name,
      database_type: user.database_type,
      file_format: "excel",
      customer_id: user.customer_id,
      user_email_id: user?.user_email_id,
      column_names: columnthatneedtoexport
    }))

  };



  const handleExportCSV = () => {
    const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
    const columnthatneedtoexport = visibleColumns.map((item) => item.header)
    const report_name = CustomeDetailOfReport?.title;
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
    const fetchData = async () => {
      try {
        setLoading(true); // Start the loader
        await dispatch(
          customPreviewChartData({
            report_name: CustomeDetailOfReport.title,
            report_type: CustomeDetailOfReport.type,
            chart_type: CustomeDetailOfReport.chart_type,
            query: CustomeDetailOfReport.query,
            email: user.user_email_id,
            database_type: user.database_type,
            connection_type: CustomeDetailOfReport.connection_type,
            schema: CustomeDetailOfReport.schema,
            page_no: newState.pageIndex + 1, // Backend pagination is 1-based
            page_size: newState.pageSize,
          })
        );
      } catch (error) {
        console.error("Error fetching chart data:", error);
      } finally {
        setLoading(false); // Stop the loader
      }
    };
    setPagination(newState);

    fetchData();
  };

  const table = useMaterialReactTable({
    columns,
    data,
    enableStickyHeader: false,
    enableStickyFooter: true,
    paginationDisplayMode: "pages",
    enableHiding: false,
    enableColumnVisibility: false,
    enableFilters: false,
    enableGlobalFilter: false,
    enableClickToCopy: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableColumnResizing: false,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableSorting: false,
    layoutMode: 'grid',
    state: { pagination, },
    rowCount: rowCount,
    muiTableProps: {
      sx: (theme) => ({
        "& td[data-pinned='true'],th[data-pinned='true']": {
          color: theme.palette.common.white,
        },
        padding: 0,
        margin: 0,
        width: "100%",
        overflowX: "auto",
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
      <Box
        sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
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
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
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
          sx={{ textAlign: "center", fontWeight: "bold", flex: 1 }}
        >
          {table?.getState()?.caption || CustomeDetailOfReport?.title}
        </Typography>
      </Box>
    ),
    manualPagination: true,
    onPaginationChange: handlePaginationChange,
    initialState: {
      pagination: { pageSize: 10, pageIndex: 0 },
      density: "compact",
    },
  });

  const isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

  return (
    <div>
      <div className="PreviewPage_table_main_container">
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <CircularProgress />
          </Box>
        ) : isEmptyObject(PreviewchartData) ? (
          <Box sx={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#4e5ff5", padding: "20px" }}>
            No data found for this report
          </Box>
        ) : (
          <div>
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <Box
                sx={{
                  height: 489,
                  width: "100%",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              >
                <MaterialReactTable
                  table={table}
                  sx={{
                    width: "100%",
                    border: "2px solid #ddd",
                    borderRadius: "10px",
                  }}
                  className="horizontal-stripe-table"
                />
              </Box>
            </LocalizationProvider>
          </div>)}

      </div>
    </div>
  );
}

export default PreviewReportTable;
