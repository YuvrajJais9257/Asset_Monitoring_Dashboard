/*modified by Pavitra*/
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './../globalCSS/modifiedcanvas/modifiedcanvas.css';
import { useNavigate } from 'react-router-dom';
import HighCharts from '../HighCharts/HighCharts';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button } from './../globalCSS/Button/Button';
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
import { getreporttitlefromondashbaord } from '../../actions/reportmanagement';
import { updatecanvashframedataformodificationmessage, updatecanvashframedataformodification, getreportframedatabygroupid, checkdashboardcanvasname, initialcheckdashboardcanvasname } from '../../actions/canvascreation';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import { decryptData } from '../utils/EncriptionStore';
import Header from '../header';
import ShowAlert from '../../actions/ShowAlert';
import { Box, CircularProgress } from '@mui/material';


// Wrap ResponsiveGridLayout with WidthProvider to automatically determine the width
const ResponsiveGridLayout = WidthProvider(Responsive);


// Auther:- Ashish Kumar
const ModifiedCanvasPage = () => {

  // State variables to manage component state
  const [isDragging, setIsDragging] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [widgetData, setWidgetData] = useState([]);
  const [widgetframeData, setWidgetframeData] = useState([]);
  const [freameId, setFreamId] = useState([])
  const [resultdata, setResultdata] = useState();
  const [search, setSearch] = useState("")
  const [droppedText, setDroppedText] = useState([]);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const [showCanvasOptions, setShowCanvasOptions] = useState(true);



  // Initialize dispatch and get API data using useSelector
  const dispatch = useDispatch();
  const apiData = useSelector((state) => state);
  const datareport = apiData?.reportmanagement.allReportDetail

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();
  const dropdownRef = useRef(null);
  const checkframename = apiData?.canvascreation.checkdashboardcanvasframe

  // Extract query parameters from the URL
  const queryParameters = new URLSearchParams(window.location.search);
  const groupid = queryParameters.get('group_id');
  const dashboardreportname = queryParameters.get('dashboardreportname');
  const dashboard_description = queryParameters.get('dashboard_description')
  const groupname = queryParameters.get('groupname');
  const [dashboardDescriptionInput, setDashboardDescriptionInput] = useState("");
  const [dashboardNameInput, setDashboardNameInput] = useState();
  const [loading, setLoading] = useState(true);

  // Fetch data on component mount and when groupid changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const encryptedData = localStorage.getItem("profile");
      const user = encryptedData ? decryptData(encryptedData) : null;

      setDashboardNameInput(dashboardreportname);
      setDashboardDescriptionInput(dashboard_description);

      await dispatch(initialcheckdashboardcanvasname());
      await dispatch(getreportframedatabygroupid({
        customer_id: user.customer_id,
        group_id: groupid,
        dashboard_name: dashboardreportname,
        email: user.user_email_id,
        database_type: user.database_type
      }));
      await dispatch(getreporttitlefromondashbaord({
        database_type: user.database_type,
        email: user.user_email_id,
        customer_id: user.customer_id,
        group_id: user.group_id
      }));

      setLoading(false);
    };

    fetchData();
  }, [groupid]);


  // Memoize frame data to avoid unnecessary re-renders
  const frameChartdata = apiData?.canvascreation.getdashboardframewithid;
  const framesaveresponse = apiData?.canvascreation.canvasframe;


  useEffect(() => {
    if (checkframename === 'null') {
      setShowCanvasOptions(false)
    }
    dispatch(updatecanvashframedataformodificationmessage())
  }, [])

  useMemo(() => {
    if (checkframename?.status === 200) {
      setShowCanvasOptions(true)
    }
  }, [checkframename])


  useMemo(() => {
    const frames = frameChartdata?.length != 0 && frameChartdata?.frames[0]?.frame || [];
    setWidgetframeData(frames);
    frames.forEach((frame, index) => {
      const { reportType, chartType, chart_type, i } = frame;
      setFreamId((prevIds) => [...prevIds, { reportType, chartType, chart_type, i }]);
    })
  }, [frameChartdata]);



  let history = useNavigate();

  // Handle drag start event
  const handleDragStart = (event) => {
    setIsDragging(true);
    event.dataTransfer.setData('text/plain', event.target.id);
  };

  // Handle drag end event
  const handleDragEnd = () => {
    setIsDragging(false);
  };


  var results = frameChartdata && frameChartdata.frames && frameChartdata.frames.length > 0 ? frameChartdata.frames[0]?.report_excluded : null;

  useEffect(() => {
    if (frameChartdata && frameChartdata.frames && frameChartdata.frames.length > 0) {
      let newresults = frameChartdata.frames[0]?.report_excluded;
      if (newresults) {
        setResultdata(newresults);
      }
    }
  }, [frameChartdata]);

  const handleDrop = (event, id) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    // const draggedItem = document.getElementById(data);
    const draggedItem = document.getElementById(data);
    const chartType = draggedItem.getAttribute('data-report-name');
    const reportType = draggedItem.getAttribute('data-report-type');
    const chart_type = draggedItem.getAttribute('data-chart-type');

    const updatedWidgetData = [...widgetData];
    const existingItemIndex = updatedWidgetData.findIndex(item => item.i === id);



    if (existingItemIndex !== -1) {
      // Check if chartType already exists on the card
      if (updatedWidgetData[existingItemIndex].chartType) {
        toast.success("This card already has a chart type assigned. No additional charts can be dropped here.", { position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
        return;
      } else {
        // Update chartType if no chartType was previously assigned
        updatedWidgetData[existingItemIndex].chartType = chartType;
        updatedWidgetData[existingItemIndex].reportType = reportType;
        updatedWidgetData[existingItemIndex].chart_type = chart_type;
      }
    } else {
      const newItem = {
        id,
        chartType,
        reportType,
        layout: {
          i: uuidv4(), // Generate unique ID
          x: (widgetframeData.length * 4) % 16,
          y: Math.floor(widgetframeData.length / 4) * 4,
          w: 4,
          h: 4,
        },
      };
      updatedWidgetData.push(newItem);
    }
    const updatedatasave = updatedWidgetData.map(item => ({
      chartType: item.chartType,
      reportType: item.reportType,
      chart_type: item.chart_type,
      i: item.i,
    }));
    // results = results.filter((item)=>item.report_name != chartType)
    setFreamId(updatedatasave)
    setWidgetData(updatedWidgetData);
    setResultdata((currentData) => currentData.filter(item => item.report_name !== chartType));
    const dropchatdata = results.filter(item => item.report_name === chartType);
    setDroppedText(current => [...current, ...dropchatdata]);
    // event.target.appendChild(draggedItem);
    // setDroppedText
  };


  const handleDragOver = (event) => {
    event.preventDefault();
  };
  const handleClickGoBackToDashboardManagement = () => {
    history("/ListOfDashboardCanvas");
  };

  // Filter results based on search query
  useEffect(() => {
    if (search) {
      const filteredResults = frameChartdata?.frames[0]?.report_excluded.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
      setResultdata(filteredResults);
    } else {
      setResultdata(frameChartdata && frameChartdata.frames && frameChartdata.frames.length > 0 && frameChartdata?.frames[0]?.report_excluded || []);
    }
  }, [search, frameChartdata]);



  // Add a new widget to the layout
  const handleAddWidget = () => {
    const newItem = {
      i: uuidv4(),
      x: (widgetframeData.length * 4) % 16,
      y: Math.floor(widgetframeData.length / 4) * 4,
      w: 4,
      h: 4,
      minH: 4,
      // maxH: 12,
    };
    setWidgetframeData((prevData) => [...prevData, newItem]);
  };


  // Delete the selected widget
  const handleDelete = () => {
    if (selectedItem === null) {
      return;
    }
    if (selectedItem.chatId !== null) {
      setWidgetData((prevData) => {
        const { [selectedItem.chatId]: deletedItem, ...rest } = prevData;
        return rest;
      });
      const updatedLayout = widgetframeData.filter((item) => item.i !== selectedItem.chatId);
      const updatedidfrom = freameId.filter((item) => item.i !== selectedItem.chatId)
      setFreamId(updatedidfrom)
      setWidgetframeData(updatedLayout);
      const finditem = droppedText.filter((item) => item.report_name === selectedItem.chartName)
      const updated = widgetframeData.filter((item) => item.i === selectedItem.chatId);
      if (finditem.length === 0 && updated.length > 0) {
        let finditemvalue = [];
        if (updated[0].reportType === "Chart") {
          finditemvalue.push({ report_name: updated[0].chartType, report_type: updated[0].reportType, chart_type: updated[0].chart_type })
        } else {
          finditemvalue.push({ report_name: updated[0].chartType, report_type: updated[0].reportType, chart_type: '' })
        }
        setResultdata(current => [...current, ...finditemvalue]);
      }
      setResultdata(current => [...current, ...finditem]);
      setDroppedText((currentData) => currentData.filter(item => item.report_name !== selectedItem.chartName));
    }
  };

  const checkChartType = (widgetData) => {
    for (let i = 0; i < widgetData.length; i++) {
      if (!widgetData[i].hasOwnProperty('chartType')) {
        return false; // Return false if any object does not have 'chartType'
      }
    }
    return true; // Return true if all objects have 'chartType'
  }
  const checkButtonEnable = (name, description) => {
    // if ((name.trim() !== '' || description.trim() !== '') && isHovered) {
    setIsButtonEnabled(true);
    // } else {
    //   setIsButtonEnabled(false);
    // }
  };
  // Save the current layout to local storage and dispatch an update action
  const handleSaveAddWidget = async () => {
    const framelayout = JSON.stringify(widgetData);
    const checkEmptyWidget = checkChartType(widgetData);

    if (widgetData.length === 0) {
      toast.success("Please add atleast one chart to the frame", { position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
    }

    else if (!checkEmptyWidget) {
      toast.success("Please add chart to the Empty Widget", { position: "top-right", autoClose: 2000, hideProgressBar: false, closeOnClick: true, pauseOnHover: true, draggable: true, theme: "light", });
    }

    else {

      localStorage.setItem('finalfream', framelayout);
      // setWidgetframeData([])
      const responjson = {
        dashboard_json_frame_data: widgetData,
        customer_id: user.customer_id,
        new_dashboard_report_name: dashboardNameInput,
        old_dashboard_report_name: dashboardreportname,
        dashboard_description: dashboardDescriptionInput,
        database_type: user.database_type

      }
      try {
        const userConfirmed = await ShowAlert({
          title: "Confirmation",
          message: "Are you sure you want to Save the Updated Report?",
          options: ["OK", "Cancel"]
        });
        if (userConfirmed === "OK") {
          dispatch(updatecanvashframedataformodification(responjson, history));
          localStorage.setItem('finalfream', framelayout);
        } else {
          console.log("User canceled the operation.");
        }
      } catch (error) {
        console.error("Error removing user:", error);
      }
    }
  };

  // Handle double-click event to select or deselect a widget
  const handleDoubleClick = (item) => {
    if (item.i === selectedItem?.chatId) {
      setSelectedItem({ "chatId": null, "chartName": null });
    } else {
      setSelectedItem({ "chatId": item.i, "chartName": item.chartType });
    }
  };

  const redirectDashboardPage = async () => {
    const checkDetail = widgetData.every((repoData) =>
      frameChartdata && frameChartdata?.frames[0]?.frame.some((reportVal) => reportVal.chartType === repoData.chartType)
    );
    if (checkDetail) {
      setWidgetframeData([]);
      history('/Dashboard');
    } else if (framesaveresponse?.status === 200 || framesaveresponse?.status === "success") {
      history('/Dashboard');
    } else {
      const userConfirmed = await ShowAlert({
        title: "Confirmation",
        message: "Leave Page without Saving? Changes you made may not be saved.",
        options: ["OK", "Cancel"]
      });
      if (userConfirmed === "OK") {
        history('/Dashboard');
      } else {
        console.log("User canceled the operation.");
      }



    }

  };

  const handleResize = (layout, oldItem, newItem, placeholder, e, element) => {
    // Check if the resizable item contains a "box" type of report

    const resizableItem = widgetframeData.find(item => item.i === newItem.i && item.reportType === "Box");
    if (resizableItem) {
      newItem.h = oldItem.h;
    }
  };

  // Update state with the new layout when it changes
  const onLayoutChange = (newLayout) => {
    const updatedLayout = newLayout.map((fream) => {
      const matchingId = freameId.find((item) => item.i === fream.i);
      if (matchingId) {
        return { ...fream, chartType: matchingId.chartType, reportType: matchingId.reportType, chart_type: matchingId.chart_type };
      }
      return fream;
    });
    setWidgetData(updatedLayout);
    setWidgetframeData(updatedLayout)
  }
  const handleDashboardNameChange = (e) => {
    const value = e.target.value;
    setShowCanvasOptions(false)
    setDashboardNameInput(value);
    checkButtonEnable(value, dashboardDescriptionInput);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;

    setDashboardDescriptionInput(value);

  };

  const handlemodifydashboardname = () => {
    dispatch(checkdashboardcanvasname({ dashboard_report_name: dashboardNameInput, customer_id: user.customer_id, database_type: user.database_type }))
  };



  return (
    <div className="main-container">
      <div className="header_styling">
        <Header />
      </div>
      <div>
        <div id="modified-details-input-container" ref={dropdownRef}>
          <div
            className="input-group flex-nowrap modified-detail-entry"
          >
            <input className="form-control" type="text" value={groupname && groupname} disabled />
          </div>
          <div
            id="modified-name-input-container"
            className="input-group flex-nowrap modified-detail-entry"

          >
            <input
              required
              className="form-control"
              id="modified-name-input"
              type="text"
              placeholder="Dashboard Name: "
              value={dashboardNameInput}
              maxLength={40}
              onChange={(e) => {
                const value = e.target.value;
                if (/^[A-Za-z0-9 \-\_]*$/.test(value)) {
                  handleDashboardNameChange(e);
                }
              }}
            />
          </div>
          <div
            id="modified-description-textarea-container"
            style={{ width: "100%" }}
            className="input-group flex-nowrap modified-detail-entry"

          >
            <textarea
              required
              style={{ transform: "translateX(6%)" }}
              className="form-control"
              id="modified-description"
              placeholder="Description..."
              value={dashboardDescriptionInput}
              onChange={handleDescriptionChange}
            />
          </div>
          <div id="modified-verification-button-container">
            <Button
              onClick={handlemodifydashboardname}
              id="modified-verify-button"
              type="button"
              disabled={!isButtonEnabled}
              className={`button ${!isButtonEnabled ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`}
            >
              Modify Dashboard Name
            </Button>
          </div>
        </div>
      </div>
      <div className="modified_container">
        <div className="modified_side_bar">
          <div class="form-group modified_has-search modified_report_search">
            <span className="fa fa-search form-control-feedback"></span>
            <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="modified_sidebar-content" style={{ maxHeight: 'calc(80vh - 20px)', overflowY: 'auto' }}>
            {resultdata &&
              resultdata.map((element, index) => (
                <div
                  className="modified_chart_type"
                  id={`chart_type_${index}`}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  key={index}
                  data-report-name={element.report_name}
                  data-report-type={element.report_type}
                  data-chart-type={element.chart_type}
                  style={{ border: isDragging ? '1px solid black' : '' }}
                >
                  {element.report_name}
                  <p style={{ margin: "1px", fontSize: "9px" }}>
                    {element.report_type === 'Chart' ? `${element.report_type}(${element.chart_type})` : element.report_type}
                  </p>
                </div>
              ))}
          </div>
        </div>
        <div className="modified_toggling_part">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <ResponsiveGridLayout
                className="layout"
                style={{ height: "100vh", overflowY: "scroll" }}
                isResizable={true}
                isDraggable={true}
                layouts={{ lg: widgetframeData }}
                breakpoints={{ xxl: 1600, xl: 1400, lg: 1263, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ xxl: 10, xl: 10, lg: 10, md: 10, sm: 10, xs: 10, xxs: 10 }}
                rowHeight={30}
                onLayoutChange={onLayoutChange}
                onResize={handleResize}
                width={2400}
              >
                {widgetframeData &&
                  widgetframeData.map((item, index) => (
                    <div
                      key={item.i}
                      onDrop={(event) => handleDrop(event, item.i)}
                      onDragOver={handleDragOver}
                      style={{
                        border: selectedItem?.chatId === item.i ? '3px solid black' : '1px solid black',
                        cursor: 'pointer',
                        color: selectedItem?.chatId === item.i ? 'lightblue' : '',
                        overflow: 'hidden',
                        borderRadius: '10px',
                        width: `calc(${item.w} * 100%)`,
                        height: `${item.h * 30}px`,
                      }}
                      onClick={() => handleDoubleClick(item)}
                    >
                      {item.chartType ? (
                        <HighCharts width={`${item.w * 100}px`} height={`${item.h * 38}px`} charttype={item.chartType} reportType={item.reportType} flag={"diabledrilldown"} />
                      ) : null}
                    </div>
                  ))}
              </ResponsiveGridLayout>
            </>
          )}
        </div>
        <div className="modified_right_part_of_container">
          <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={handleAddWidget}>
            Add Div
          </Button>
          <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={handleDelete}>
            Delete
          </Button>
          <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={handleSaveAddWidget}>
            Save
          </Button>
          <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={redirectDashboardPage}>
            Show On Dashboard
          </Button>
          <Button onClick={handleClickGoBackToDashboardManagement}>Back</Button>
        </div>
      </div>
    </div>
  );
};

export default ModifiedCanvasPage;



