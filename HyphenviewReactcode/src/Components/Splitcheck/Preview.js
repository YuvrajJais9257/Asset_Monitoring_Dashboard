//modified by Yuvraj Jaiswal
//changed borderRadius from 5px to 2rem
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useNavigate } from 'react-router-dom';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Header from '../header';
import {toast } from 'react-toastify';
import { Button } from './../globalCSS/Button/Button';
import HighCharts from '../HighCharts/HighCharts';
import { savecanvasframedata } from '../../actions/canvascreation';
import ShowAlert from '../../actions/ShowAlert';
import './../globalCSS/splitcheck/preview.css'
const ResponsiveGridLayout = WidthProvider(Responsive);

const PreviewPage = () => {
  const [freamData, setfreamData] = useState([]);
  const dispatch = useDispatch();
  const history = useNavigate();
 
  const apiData = useSelector((state) => state?.canvascreation);

  useEffect(() => {
    const sessionFrameVal = localStorage.getItem('finalfream');
    const finalFrameArray = sessionFrameVal ? JSON.parse(sessionFrameVal).dashboard_json_frame_data : [];
   
    if (finalFrameArray.length === 0) {
      console.log('No value found in localStorage for the key');
    }
   
    setfreamData(finalFrameArray);
  }, []);

  useEffect(()=>{
    if(apiData?.responscanvasdetail?.statusCode===200){
      history('/Dashboard')
    }
  },[apiData])




  const checkChartType = (widgetData) => {
 
    for (let i = 0; i < widgetData.length; i++) {
      if (!widgetData[i].hasOwnProperty('chartType')) {
        return false; // Return false if any object does not have 'chartType'
      }
    }
    return true; // Return true if all objects have 'chartType'
  }
 
 
 
  const handleSaveDashboardFrame = async () => {
    const frameLayout = localStorage.getItem('finalfream');
    const finalFrameArray = frameLayout ? JSON.parse(frameLayout) : {};
 
    const checkEmptyWidget = checkChartType(finalFrameArray?.dashboard_json_frame_data);
 
    if (checkEmptyWidget.length === 0) {
      toast.success("Please add at least one chart to the frame", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
    } else if (!checkEmptyWidget) {
      toast.success("Please add a chart to the empty widget", {position: "top-right",autoClose: 3000,hideProgressBar: false,closeOnClick: true,pauseOnHover: true,draggable: true,theme: "light",});
    } else {
      try {
        const userConfirmed = await ShowAlert({
          title: "Confirmation",
          message: "Are you sure you want to add this frame?",
          options: ["OK", "Cancel"]
        });
        if (userConfirmed === "OK") {
          dispatch(savecanvasframedata(finalFrameArray, history));
          localStorage.setItem('finalfream', frameLayout);
        } else {
          console.log("User canceled the operation.");
        }
      } catch (error) {
        console.error("Error saving the dashboard frame:", error);
      }
    }
  };
 
 


  return (
    <div>
      <div className="headerofpreview">
        <Header />
      </div>
      <div className='previewpage_container'>
        <br></br>
      <div style={{textAlign:"center"}}><h3>Dashboard Preview</h3></div>
     <div className='previewpage_sub_container'>
      <div style={{ width: '75%', margin: '10px', border: "1px solid black", textAlign:"center", marginLeft:"12%"}}>
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: freamData }}
          breakpoints={{ xxl: 1600, xl: 1400, lg: 1263, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ xxl: 10, xl: 10, lg: 10, md: 10, sm: 10, xs: 10, xxs: 10 }}
          rowHeight={30}
          isResizable={false}
          isDraggable={false}
          width={1200}
        >
          {freamData?.map((item, index) => (
            <div
              key={item.i}
              style={{
                border: '1px solid black',
                background: 'white',
                overflow: 'hidden',
                borderRadius: "5px",
                width: `${item.w * 100}%`,
                height: `${item.h * 30}px`,
              }}
            > 
              {<HighCharts key={index} width={`${item.w * 100}%`} height={`${item.h * 38}px`} charttype={item.chartType} reportType={item.reportType}  />}
              
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
      </div>

      <div className="show_Dashboar" style={{ textAlign: 'center', margin : "5px"  }}>
      {/* <Button style={{marginRight:"5px"}} onClick={() => {
            history('/ModifiedCanvasPage')}}>Back</Button> */}
         <Button style={{
            fontSize: '1.00rem', 
            padding: '3px 8px',
          }}
        
        onClick={handleSaveDashboardFrame}>Save Dashboard</Button>
        
      </div>
      </div>
    </div>
  );
};

export default PreviewPage;


