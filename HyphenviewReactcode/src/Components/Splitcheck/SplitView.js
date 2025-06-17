/*modified by Pavitra*/
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './../globalCSS/splitcheck/splitcheck.css';
import { useNavigate } from 'react-router-dom';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Button } from './../globalCSS/Button/Button';
import { getreporttitlefromondashbaord, updategetreporttitlefromondashbaord, addgetreporttitlefromondashbaord } from '../../actions/reportmanagement';
import styles from './../globalCSS/SearchTable/SearchTable.module.css'
import { v4 as uuidv4 } from 'uuid';
import { listofgroup } from "../../actions/newgroup";
import Header from '../header';
import { checkdashboardcanvasname,savecanvasframedatamessage} from "../../actions/canvascreation"
import {toast } from 'react-toastify';
import { decryptData } from '../utils/EncriptionStore';
const ResponsiveGridLayout = WidthProvider(Responsive);

// Auther:- Ashish Kumar
const SplitView = () => {

  const dispatch = useDispatch();
  let history = useNavigate();

  // State variables
  const [isDragging, setIsDragging] = useState(false);
  const [layouts, setLayouts] = useState({ lg: [] });
  const [selectedItem, setSelectedItem] = useState(null);
  const [widgetData, setWidgetData] = useState([]);
  const [freameId, setFreamId] = useState([])
  const [search, setSearch] = useState("")
  const [resultdata, setResultdata] = useState();
  const [droppedText, setDroppedText] = useState([]);
  const [showCanvasOptions, setShowCanvasOptions] = useState(false);
  const [selectedUserGroup, setSelectedUserGroup] = useState(null);
  const [dashboardNameInput, setDashboardNameInput] = useState();
  const [enableobuttonoptions, setEnableButtonOptions] = useState(false)
  const [dashboardDescriptionInput, setDashboardDescriptionInput] = useState("");


  const handleResize = (layout, oldItem, newItem, placeholder, e, element) => {
    const toastId = "box-resize-warning";

    toast.info("Box widgets cannot be resized below width 2", {
      toastId, // <- prevents duplicates
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored",
    });

    const resizableItem = widgetData.find(
      (item) => item.i === newItem.i && item.reportType === "Box"
    );

    if (resizableItem && newItem.w < 2) {
      newItem.w = 2;
    }

    console.log("resize function Triggered");
  };

  // Handle user group change
  const handleUserGroupChange = (event) => {
    setSelectedUserGroup(event.target.value);
    dispatch(getreporttitlefromondashbaord({ database_type:user.database_type , email: user.user_email_id, customer_id: user.customer_id, group_id: event.target.value }));
  };


  // Handle dashboard name change
  const handleDashboardNameChange = (e) => {
    setDashboardNameInput(e.target.value);
  };

  // Handle verify button click
  const handleVerifyClick = async () => {
    if (!dashboardNameInput)
      toast.success("Enter a dashBoard Name", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
    else {
      dispatch(checkdashboardcanvasname({ dashboard_report_name: dashboardNameInput, customer_id: user.customer_id,database_type:user.database_type }))
      setEnableButtonOptions(true)
    }
  };

  // featch the report details
  const apiData = useSelector((state) => state);
  const chartTytel = apiData?.reportmanagement.allReportDetail;
  const listofallgroup = apiData?.newgroup.list_of_group;
  const checkframename = apiData?.canvascreation.checkdashboardcanvasframe

 

 

  // Handle check frame name state
  useEffect(() => {
    if (checkframename && checkframename.verify === 1) {
      setShowCanvasOptions(false);
    } else if (checkframename && checkframename.verify === 0 && enableobuttonoptions) {
      setShowCanvasOptions(true);
    }
  }, [checkframename])

  // Set result data
  let results = chartTytel;
  useEffect(() => {
    if (results) {
      setResultdata(results)
    }

  }, [results])

  // Filter results based on search
  useEffect(() => {
    if (search) {
      const filteredResults = chartTytel.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(search.toLowerCase())
        )
      );
      setResultdata(filteredResults);
    } else {
      setResultdata(chartTytel || []);
    }
  }, [search, chartTytel]);

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();
  // Fetch initial data on component mount
  useEffect(() => {
    const user = (() => {
      const encryptedData = localStorage.getItem("profile");
      return encryptedData ? decryptData(encryptedData) : null;
    })();

    dispatch(getreporttitlefromondashbaord({ database_type:user.database_type , email: user.user_email_id, customer_id: user.customer_id, group_id: user.group_id }));
    dispatch(listofgroup({ email: user.user_email_id, database_type:user.database_type  }));
    dispatch(savecanvasframedatamessage());
    setSelectedUserGroup(user.group_id);  // changes at point
  }, []);


  // Handle drag start
  const handleDragStart = (event) => {
    setIsDragging(true);
    event.dataTransfer.setData('text/plain', event.target.id);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle drop
  const handleDrop = (event, id) => {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    const draggedItem = document.getElementById(data);
    const chartType = draggedItem.getAttribute('data-report-name');
    const reportType = draggedItem.getAttribute('data-report-type');
    const chart_type = draggedItem.getAttribute('data-chart-type');
    const updatedWidgetData = [...widgetData];
    const existingItemIndex = updatedWidgetData.findIndex(item => item.i === id);
    if (existingItemIndex !== -1) {
      // Check if chartType already exists on the card
      if (updatedWidgetData[existingItemIndex].chartType) {
        toast.success("This card already has a chart type assigned. No additional charts can be dropped here.", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
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
          i: uuidv4(),
          x: (layouts.lg.length * 4) % 16,
          y: Math.floor(layouts.lg.length / 4) * 4,
          w: 4,
          h: 4,
          minH: 4,
         // maxH: 12,
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
    setFreamId(updatedatasave)
    setWidgetData(updatedWidgetData);
    //event.target.appendChild(draggedItem);
    setResultdata((currentData) => currentData.filter(item => item.report_name !== chartType));
    const dropchatdata = results.filter(item => item.report_name === chartType);
    setDroppedText(current => [...current, ...dropchatdata]);
    dispatch(updategetreporttitlefromondashbaord({ "report_name": chartType }))
  };

  // Handle drag over
  const handleDragOver = (event) => {
    event.preventDefault();
  };

  //Add new widget
  const handleAddWidget = () => {
    const newItem = {
      // i: `ContainerWidget${layouts.lg.length}`,
      i: uuidv4(),
      x: (layouts.lg.length * 4) % 16,
      y: Math.floor(layouts.lg.length / 4) * 4,
      w: 4,
      h: 4,
      minH: 4,
     // maxH: 12,
    };

    setLayouts({ ...layouts, lg: [...layouts.lg, newItem] });
  };
 
  
  // Delete selected widget
  const handleDelete = () => {
    if (selectedItem === null) {
      return;
    }
    if (selectedItem.chatId !== null) {
      setWidgetData((prevData) => {
        const { [selectedItem.chatId]: deletedItem, ...rest } = prevData;
        return rest;
      });

      const updatedLayout = layouts.lg.filter((item) => item.i !== selectedItem.chatId);
      setLayouts({ ...layouts, lg: updatedLayout });
      const finditem = droppedText.filter((item) => item.report_name === selectedItem.chartName)
      dispatch(addgetreporttitlefromondashbaord(finditem[0]))
      setResultdata(current => [...current, ...finditem]);
      setDroppedText((currentData) => currentData.filter(item => item.report_name !== selectedItem.chartName));
      setSelectedItem(null);
    }
  };

  // Handle layout change
  const onLayoutChange = (newLayout) => {
    const updatedLayout = newLayout.map((fream) => {
      const matchingId = freameId.find((item) => item.i === fream.i);
      if (matchingId) {

        return { ...fream, chartType: matchingId.chartType, reportType: matchingId.reportType,chart_type: matchingId.chart_type};
      }
      return fream;
    });
    setWidgetData(updatedLayout);
    setLayouts({ ...layouts, lg: updatedLayout });
  };


  const checkChartType = (widgetData) => {

    for (let i = 0; i < widgetData.length; i++) {
      if (!widgetData[i].hasOwnProperty('chartType') || widgetData[i].chartType === undefined) {
        return false; // Return false if any object does not have 'chartType'
      }
    }
    return true; // Return true if all objects have 'chartType'
  }
  
  // Handle double click on widget
  const handleDoubleClick = (item) => {
    if (item.i === selectedItem?.chatId) {
      setSelectedItem({ "chatId": null, "chartName": null });
    } else {
      setSelectedItem({ "chatId": item.i, "chartName": item.chartType });
    }
  };

 

  const handleClickGoBackToDashboardManagement = () => {
    history("/ListOfDashboardCanvas");
  };

  const redirectPreviewPage = async () => {
    const checkEmptyWidget = checkChartType(widgetData);
    if (widgetData.length === 0) {
      toast.success("Please add atleast one chart to the frame", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
    }
 
    else if (!checkEmptyWidget) {
      toast.success("Please add chart to the Empty Widget", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
    }
    else {
      const responjson = {
        dashboard_json_frame_data: widgetData,
        customer_id: user.customer_id,
        dashboard_report_name: dashboardNameInput,
        group_id: selectedUserGroup,
        dashboard_description: dashboardDescriptionInput,
        database_type:user.database_type,
      }
      try {
          localStorage.setItem('finalfream', JSON.stringify(responjson));
          history('/Preview');
      } catch (error) {
        console.error("Error removing user:", error);
      }
    }
  };


  return (
    <div className="Generator_page">
      <div className="header_styling">
        <Header />
      </div>
      <div>
        <div id="dashboard-details-input-container">
          <div
            className="input-group flex-nowrap dashboard-detail-entry"
          >
            <select
              required
              className="form-control"
              id="user-group-select-dropdown"
              value={selectedUserGroup}
              disabled
              onChange={(e) => handleUserGroupChange(e)}
            >
              <option value="">None Selected</option>
              {listofallgroup?.map((groupdetail) => (
                <option key={groupdetail.group_id} value={groupdetail.group_id}>
                  {groupdetail.groupname}
                </option>
              ))}
            </select>
          </div>
          <div
            id="dashboard-name-input-container"
            className="input-group flex-nowrap dashboard-detail-entry"
          >
            <input
              required
              className="form-control"
              id="dashboard-name-input"
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
            id="dashboard-description-textarea-container "
            style={{ width: "100%" }}
            className="input-group flex-nowrap dashboard-detail-entry"
          >
            <textarea
              required
              style={{ transform: "translateX(6%)" }}
              className="form-control"
              id="dashboard-description"
              placeholder="Description..."
              value={dashboardDescriptionInput}
              onChange={(e) => setDashboardDescriptionInput(e.target.value)}
            />
          </div>
          <div id="verification-button-container">
            <Button
              onClick={handleVerifyClick}
              id="dashboard-verify-button"
              type="button"
            >
              Verify
            </Button>
          </div>
        </div>
      </div>
      <div className="generator_container">
        <div className="side_bar">
          <div class="form-group generator_has-search generator_report_search">
            <span className="fa fa-search form-control-feedback"></span>
            {/* <input type="text" className="form-control" placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} /> */}
            <input type="text" className={styles.inputSearch} placeholder="Search" value={search} maxLength={120} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="generator_sidebar-content" style={{ maxHeight: 'calc(100vh - 20px)', overflowY: 'auto' }}>
            {resultdata &&
              resultdata?.map((element, index) => (
                <div
                  className="chart_type"
                  id={`chart_type_${index}`}
                  draggable
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  key={index}
                  data-report-name={element.report_name}
                  data-report-type={element.report_type}
                  data-chart-type={element.chart_type}

                  style={{ border: isDragging ? '1px solid black' : '1px solid rgba(128, 128, 128, 0.2)' }}
                >
                  {element.report_name}
                  <p style={{ margin: "2px", fontSize: "9px" }}>
                    {element.report_type === 'Chart' ? `${element.report_type}(${element.chart_type})` : element.report_type}
                  </p>


                  {/* {element.report_type != "Table" && element.report_type != "Box" &&<p>{element.chart_type}</p>} */}

                </div>
              ))}
          </div>
        </div>
        <div className="toggling_part">
          <ResponsiveGridLayout
            className="layout"
            style={{ height: "100vh", overflowY: "scroll" }}
            layouts={layouts}
            breakpoints={{ xxl: 1600, xl: 1400, lg: 1263, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ xxl: 10, xl: 10, lg: 10, md: 10, sm: 10, xs: 10, xxs: 10 }}
            rowHeight={30}
            onResize={handleResize}
            onLayoutChange={onLayoutChange}
            
          >
            {layouts.lg.map((item, index) => (
              <div
                onDrop={(event) => handleDrop(event, item.i)}
                onDragOver={handleDragOver}
                key={item.i}
                style={{
                  border: selectedItem?.chatId === item.i ? '3px solid black' : '1px solid black',
                  cursor: 'pointer',
                  color: selectedItem?.chatId === item.i ? 'lightblue' : '',
                }}
                onClick={() => handleDoubleClick(item)}
              >
                <div className="grid-stack-item-content">
                  <div className="p-2">
                    <div className="grid-stack-container" id={item.i}>
                      <span id={`graph${item.i}`} style={{ background: 'white' }}>
                        {Array.isArray(widgetData) && widgetData.find(widget => widget.i === item.i)?.chartType && (
                          <div className="widget-data-info">
                            <h3>{widgetData.find(widget => widget.i === item.i).chartType}</h3>
                            <p>{widgetData.find(widget => widget.i === item.i).reportType}</p>
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
        <div className="right_part_of_container">
          <Button
            disabled={!showCanvasOptions}
            className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`}
            onClick={handleAddWidget}>
            Add Div
          </Button>
          <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={handleDelete}>
            Delete
          </Button>
          {/* <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={handleSaveAddWidget}>
            Save
          </Button> */}
          <Button disabled={!showCanvasOptions} className={`button ${!showCanvasOptions ? "disabled-cnvas-btn" : "enabled-cnvas-btn"}`} onClick={redirectPreviewPage}>
            Preview
          </Button>

          <Button onClick={handleClickGoBackToDashboardManagement}>Back</Button>
        </div>
      </div>
    </div>
  );
};

export default SplitView;

