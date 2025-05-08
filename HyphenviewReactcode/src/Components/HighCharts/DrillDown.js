import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { getdataforDrilldown, getfilterdatadrill, exportexcelreport, exportpdfreport, exportcsvreport, defaultexport } from "../../actions/reportmanagement";
import { Box, Button, Container, IconButton, Menu, MenuItem, CircularProgress } from "@mui/material";
import { MaterialReactTable, useMaterialReactTable } from "material-react-table";
import GetAppIcon from '@mui/icons-material/GetApp';
import { Tooltip } from "@mui/material";
import Typography from '@mui/material/Typography';
import _ from "lodash";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterMoment } from "@mui/x-date-pickers/AdapterMoment";
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { MdPictureAsPdf } from "react-icons/md";
import { FaFileExcel } from "react-icons/fa6";
import { FaFileCsv } from "react-icons/fa";
import { decryptData } from '../utils/EncriptionStore';
import pako from 'pako';
import CustomFilterDrilldown from './CustomFilterDrilldown';
import { toast } from 'react-toastify';

function DrillDown() {

  const [data, setData] = useState([]);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [titlereport, settitleOfReport] = React.useState('');
  const [sorting, setSorting] = useState([]);
  const [loading, setLoading] = useState(true); // New loading state
  const [rowCount, setRowCount] = useState();
  const [openCustomFilter, setOpenCustomFilter] = useState(false)
  const [showcolumnFilter, setShowcolumnFilter] = useState(false)
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  console.log(sorting,"sorting")
  const [conditions, setConditions] = useState([
    { selectedData: "", selectedCondition: "", selectedValue: [], filteredValues: [], startDate: "", endDate: "", type: "" }
  ]);
  const DateTimeType = [
    "TIMESTAMP", "DATE", "DATETIME", "NEWDATE", "TIMESTAMPTZ", "TIMETZ"
  ]
  const IntigetType = [
    "INT", "INTEGER", "FLOAT", "DOUBLE", "INT2VECTOR", "NUMRANGE", "INT4RANGE"
  ]
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const dispatch = useDispatch();
  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const previewReportTableRowDiv = document.querySelector(".MuiTableRow-head")
  if (previewReportTableRowDiv) {
    previewReportTableRowDiv.classList.add("Drilldownresponsive-header");
    previewReportTableRowDiv.addEventListener("mouseenter", () => {
      previewReportTableRowDiv.style.backgroundColor = "#4d5256";
      previewReportTableRowDiv.style.color = "#fff";
    });
  }

  const apiData = useSelector((state) => state);

  useEffect(() => {
    dispatch(defaultexport())
    const fetchData = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const reportTitle = searchParams.get("report_title");
      settitleOfReport(reportTitle);
      const categoryValue = searchParams.get("category_value");
      const selectedSeriesName = searchParams.get("selected_series_name");
      try {
        setLoading(true);
        if (reportTitle && categoryValue) {
          await dispatch(
            getdataforDrilldown({
              customer_id: user?.customer_id,
              master_report: reportTitle,
              filter_value: categoryValue,
              selectedSeriesName: selectedSeriesName,
              page_no: pagination.pageIndex + 1,
              page_size: pagination.pageSize,
              database_type:user.database_type,
            })
          );
        }
        else {
          await dispatch(
            getdataforDrilldown({
              customer_id: user?.customer_id,
              master_report: reportTitle,
              selectedSeriesName: selectedSeriesName,
              filter_value: "",
              page_no: pagination.pageIndex + 1,
              page_size: pagination.pageSize,
              database_type:user.database_type,
            })
          );
        }

      } catch (error) {
        console.error("Error generating report ID:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const searchParams = new URLSearchParams(window.location.search);
  const categoryValue = searchParams.get("category_value") || "";
  const selectedSeriesName = searchParams.get("selected_series_name") || "";

  const handlePaginationChange = async (updaterOrState) => {
    const searchParams = new URLSearchParams(window.location.search);
    const newState = typeof updaterOrState === "function" ? updaterOrState(pagination) : updaterOrState;
    const reportTitle = searchParams.get("report_title");
    settitleOfReport(reportTitle);
    const categoryValue = searchParams.get("category_value");
    const selectedSeriesName = searchParams.get("selected_series_name");
    try {
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
          if (createfilter && reportTitle && categoryValue) {
            setLoading(true);
            await dispatch(
              getfilterdatadrill({
                report_name: reportTitle,
                email: user.user_email_id,
                customer_id: user.customer_id,
                database_type:user.database_type,
                filter_options: createfilter.filter_options,
                filter_operations: createfilter.filter_operations,
                filter_value: categoryValue,
                selectedSeriesName: selectedSeriesName,
                sorting_options: sorting,
                page_no: newState.pageIndex + 1,
                page_size: newState.pageSize,
                flag: "drilldownpage"

              })
            );
          } else {
            setLoading(true);
            await dispatch(
              getfilterdatadrill({
                report_name: reportTitle,
                email: user.user_email_id,
                customer_id: user.customer_id,
                database_type:user.database_type,
                filter_options: createfilter.filter_options,
                filter_operations: createfilter.filter_operations,
                page_no: newState.pageIndex + 1,
                page_size: newState.pageSize,
                sorting_options: sorting,
                filter_value: "",
                selectedSeriesName: "",
                flag: "drilldownpage"
              })
            );
          }
        }
      } else {
        if (reportTitle && categoryValue) {
          setLoading(true);
          await dispatch(
            getdataforDrilldown({
              customer_id: user?.customer_id,
              master_report: reportTitle,
              filter_value: categoryValue,
              selectedSeriesName: selectedSeriesName,
              page_no: newState.pageIndex + 1,
              page_size: newState.pageSize,
              database_type:user.database_type,
            })
          );
        } else {
          setLoading(true);
          await dispatch(
            getdataforDrilldown({
              customer_id: user?.customer_id,
              master_report: reportTitle,
              selectedSeriesName: selectedSeriesName,
              filter_value: "",
              page_no: newState.pageIndex + 1,
              page_size: newState.pageSize,
              database_type:user.database_type,
            })
          );
        }
      }
    } catch (error) {
      console.error("Error generating report ID:", error);
    } finally {
      setLoading(false);
    }

    // Closing brace was missing before updating pagination
    setPagination((old) => {
      const newPagination = typeof updaterOrState === "function" ? updaterOrState(old) : updaterOrState;
      return newPagination;
    });
  };


  const [error, setError] = useState(null);

  const drilldownData = apiData?.reportmanagement.detaildatafordrilldown;
  const exportedfilepath = apiData?.reportmanagement?.exportedfilepath;

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
    setRowCount(drilldownData && drilldownData?.total_records || 10)
    return drilldownData?.column_names?.map(column => {
      const dateType = drilldownData?.column_types?.[column] && DateTimeType.includes(drilldownData?.column_types[column])
        ? 'datetime'
        : drilldownData?.column_types?.[column] === 'DATE'
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
            if (!value) return ""; // Return empty string if value is null or undefined
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
          filterVariant: 'multi-select',
        };
      }
    }) || [];
  }, [data, drilldownData]);

  useMemo(() => {
    if (drilldownData?.data) {
      setData(drilldownData.data);
    }
  }, [drilldownData]);

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
              toast.error(`Please select or enter a value for ${selectedData} in filter `);
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
          report_name: titlereport,
          database_type:user.database_type,
          file_format: "pdf",
          customer_id: user.customer_id,
          user_email_id : user?.user_email_id,
          column_names: columnThatNeedToExport,
          filter_options: createfilter.filter_options,
          filter_operations: createfilter.filter_operations,
          filter_value: categoryValue,
          selectedSeriesName: selectedSeriesName,
          sorting_options: sorting,
          flag: "drilldownpage"
        }))

      }else{
        setLoading(true);
        await dispatch(exportpdfreport({
          report_name: titlereport,
          database_type:user.database_type,
          file_format: "pdf",
          customer_id: user.customer_id,
          user_email_id : user?.user_email_id,
          column_names: columnThatNeedToExport,
          filter_options: [],
          filter_operations: [],
          filter_value: categoryValue,
          selectedSeriesName: selectedSeriesName,
          sorting_options: sorting,
          flag: "drilldownpage"
        }))
      }
    } catch (error) {
      console.error("Error generating report ID:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    const visibleColumns = columns.filter((column) => table.getColumn(column.id).getIsVisible());
    const columnThatNeedToExport = visibleColumns.map((item) => item.header);
    if(columnThatNeedToExport.length===0){
      toast.error(`None of the column is selected you can select at list one column in filter`);
      return
    }
    try {
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
        await dispatch(exportexcelreport({
          report_name: titlereport,
          database_type:user.database_type,
          file_format: "excel",
          customer_id: user.customer_id,
          user_email_id : user?.user_email_id,
          column_names: columnThatNeedToExport,
          filter_options: createfilter.filter_options,
          filter_operations: createfilter.filter_operations,
          filter_value: categoryValue,
          selectedSeriesName: selectedSeriesName,
          sorting_options: sorting,
          flag: "drilldownpage"

        }))
      }else{
        setLoading(true);
        await dispatch(exportexcelreport({
          report_name: titlereport,
          database_type:user.database_type,
          file_format: "excel",
          customer_id: user.customer_id,
          user_email_id : user?.user_email_id,
          column_names: columnThatNeedToExport,
          filter_options: [],
          filter_operations: [],
          filter_value: categoryValue,
          selectedSeriesName: selectedSeriesName,
          sorting_options: sorting,
          flag: "drilldownpage"
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
      const columnThatNeedToExport = visibleColumns.map((item) => item.header);
      if(columnThatNeedToExport.length===0){
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
          report_name: titlereport,
          database_type:user.database_type,
          file_format: "csv",
          customer_id: user.customer_id,
          user_email_id : user?.user_email_id,
          column_names: columnThatNeedToExport,
          filter_options: createfilter.filter_options,
          filter_operations: createfilter.filter_operations,
          filter_value: categoryValue,
          selectedSeriesName: selectedSeriesName,
          sorting_options: sorting,
          flag: "drilldownpage"
        }))
      }else{
        setLoading(true);
        await dispatch(exportcsvreport({
          report_name: titlereport,
          database_type:user.database_type,
          file_format: "csv",
          customer_id: user.customer_id,
          user_email_id : user?.user_email_id,
          column_names: columnThatNeedToExport,
          filter_options: [],
          filter_operations: [],
          filter_value: categoryValue,
          selectedSeriesName: selectedSeriesName,
          sorting_options: sorting,
          flag: "drilldownpage"
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
    enableStickyHeader: true,
    enableStickyFooter: true,
    paginationDisplayMode: "pages",
    enableColumnResizing: true,
    enableGlobalFilter: false,
    enableColumnActions: false,
    enableClickToCopy: false,
    manualPagination: true,
    layoutMode: 'grid',
    rowCount: rowCount,
    onShowColumnFiltersChange: handelcolumnchanges,
    state: { sorting, pagination, showColumnFilters: showcolumnFilter, },
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
    isMultiSortEvent: () => true,

    muiTableBodyCellProps: {
      sx: {
        cursor: 'pointer',
        '&:tr td hover': {
          backgroundColor: '#e0f7fa', // Row hover color
        },
      },
    },

    enableColumnPinning: true,
    muiTableContainerProps: {
      sx: (theme) => ({
        "td[data-pinned='true']::before,th[data-pinned='true']::before": {
          background: theme.palette.primary.main,
        },
        "td[data-pinned='true'],th[data-pinned='true']": {
          color: theme.palette.common.white,
        },
        padding: 0,
        margin: 0,
        width: '100%',
        overflowX: 'auto',

      }),
    },
    enableColumnOrdering: true,

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
            <IconButton onClick={handleClick} >
              <span style={{ height: "22px" ,color:"white"}}>
                <GetAppIcon style={{ color: "white" }}/>
              </span>
            </IconButton>
          </Tooltip>
          <Menu
            id="export-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
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
                <ClearAllIcon style={{ color: "white" }} />
              </Button>
            </span>
          </Tooltip>
        </Box>
        {/* Centered and Bold Caption */}
        <Typography
          variant="h6" // Adjust variant as per your need
          sx={{ textAlign: 'center', fontWeight: 'bold', flex: 1 }} // Center and make bold
        >
          {table?.getState()?.caption || drilldownData?.report_title}
        </Typography>
      </Box>
    ),
    enableColumnFilters: true,
    enableFacetedValues: true,
    manualPagination: true,
    onPaginationChange: handlePaginationChange,
    initialState: { pagination: { pageSize: 10, pageIndex: 0 }, showColumnFilters: showcolumnFilter, density: 'compact' },

  });

  return (
    <Box sx={{ px: 5, border: '1px solid #ddd', borderRadius: '4px' }}>
      {openCustomFilter && <CustomFilterDrilldown setOpenCustomFilter={setOpenCustomFilter} columns={drilldownData?.column_types || []} data={drilldownData?.data || []} pagination={pagination} setShowcolumnFilter={setShowcolumnFilter} conditions={conditions} setConditions={setConditions} sorting={sorting} length={conditions.length} />}
      {titlereport && (
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000;', pb: 1, mb: 2, mt: 2, textAlign: 'center' }}>
          {titlereport}
        </Typography>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
          <CircularProgress />
        </Box>
      ) : (
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <Box sx={{ px: 5, py: 3, border: '1px solid #ddd', borderRadius: '4px' }}>
            <MaterialReactTable table={table} sx={{ width: '100%', overflowX: 'auto', border: '2px solid #ddd', borderRadius: '10px' }} />
          </Box>
        </LocalizationProvider>
      )}
    </Box>
  );
}


export default DrillDown;