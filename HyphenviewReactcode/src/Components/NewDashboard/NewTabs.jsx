import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import HighCharts from "../HighCharts/HighCharts";
import ReportDashBoardNew from "../DefaultPage/ReportDashBoardNew";
import { canvashframedataformodification } from "../../actions/canvascreation";
import { listofgroup } from "../../actions/newgroup";
import { Tab, Tabs } from "react-tabs-scrollable";
import "react-tabs-scrollable/dist/rts.css";
import "./../globalCSS/NewDashboard/NewTabs.css";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";
import { decryptData } from "../utils/EncriptionStore";
import { Box, CircularProgress } from "@mui/material";
/*today change */
import { toggleTheme } from "../../actions/new_dashboard";
import { Sun, Moon } from "lucide-react";

const ResponsiveGridLayout = WidthProvider(Responsive);

const NewTabs = ({ sideBarWidth }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [rightSideWidth, setRightSideWidth] = useState(0);
  const [loader, setLoader] = useState(true);
  const [percentage, setPercentage] = useState(0);
  const [visibleTabs, setVisibleTabs] = useState(0);

  const tabContainerRef = useRef(null);

  const tabRefs = useRef([]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setRightSideWidth(window.innerWidth - sideBarWidth);
      setPercentage((rightSideWidth / windowWidth) * 100);
      updateVisibleTabs();
    };
    const updateVisibleTabs = () => {
      if (tabContainerRef.current) {
        const containerWidth = tabContainerRef.current.offsetWidth;
        let totalTabWidth = 0;
        let count = 0;
        tabRefs.current.forEach((tab) => {
          totalTabWidth += tab.offsetWidth;

          if (totalTabWidth <= containerWidth) {
            count += 1;
          }
        });
        setVisibleTabs(count);
      }
    };

    // Initial calculation
    handleResize();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [rightSideWidth, sideBarWidth, windowWidth]);

  const [activeTab, setActiveTab] = useState(1);
  const dispatch = useDispatch();
  const apiData = useSelector((state) => state);

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  console.log(user, "user");

  const [freamData, setfreamData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(
            canvashframedataformodification({
              customer_id: user.customer_id,
              group_id: user.group_id,
            })
          ).unwrap(),
          dispatch(
            listofgroup({ email: user.user_email_id, database_type: "mysql" })
          ).unwrap(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoader(false);
      }
    };
    fetchData();
  }, []);

  const frameChartdata = apiData?.canvascreation.canvasframedetail;
  useEffect(() => {
    const frames = frameChartdata?.frames?.[0]?.frame || [];
    if (frames.length > 0) {
      setfreamData(frames);
      setActiveTab(0);
      setLoader(false);
    } else {
      console.log('No value found in localStorage for the key "finalfream"');
    }
  }, [frameChartdata]);

  const tabs =
    Array.isArray(frameChartdata?.frames) && frameChartdata?.frames?.length > 0
      ? frameChartdata?.frames
      : [];

  const onTabClick = (e, index) => {
    setActiveTab(index);
    setfreamData(tabs[index].frame);
  };
  /*today change */
  const app_theme = useSelector((state) => state.theme);

  console.log(app_theme, "app_theme");

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  return (
    <div className="frame-responsive-container">
      {/*today change */}
      <div className="tabs-and-theme-toggle-container">
        <div style={{ width: "95%" }}>
          {" "}
          <Tabs
            activeTab={activeTab}
            onTabClick={onTabClick}
            hideNavBtnsOnMobile={false}
            leftBtnIcon={
              <FiChevronLeft
                size={"1.5em"}
                style={{
                  color: "black",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
            }
            rightBtnIcon={
              <FiChevronRight
                size={"1.5em"}
                style={{
                  color: "black",
                  display: "inline-block",
                  verticalAlign: "middle",
                }}
              />
            }
          >
            {tabs.map((tab) => (
              <Tab key={tab}>{tab.dashboard_name}</Tab>
            ))}
          </Tabs>
        </div>

        <div className="dashboard-theme-button-container">
          <div
            className={`dashboard-theme-button ${
              app_theme === "dark" ? "dark" : "light"
            }`}
          >
            <button
              onClick={handleThemeToggle}
              className="theme-toggle-button"
              aria-label="Toggle theme"
            >
              {app_theme === "dark" ? (
                <Sun className="icon sun-icon" />
              ) : (
                <Moon className="icon moon-icon" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div>
        {loader ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 2,
            }}
          >
            <CircularProgress color="secondary" />
          </Box>
        ) : frameChartdata?.frames?.length === 0 ? (
          <ReportDashBoardNew />
        ) : (
          <div className="layoutSuperContainer">
            <ResponsiveGridLayout
              className="layout"
              layouts={{ lg: freamData }}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 20, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={30}
              isResizable={false}
              isDraggable={false}
              margin={[10, 10]}
          
            >
              {freamData?.map((item) => (
                <div
                  className="box-layout-and-chart"
                  key={item.i}
                  style={{
                    border: "1px solid rgba(128, 128, 128, 0.2)",
                    background: "white",
                    overflow: "hidden",
                    borderRadius: "5px",
                    width: `${item.w * 10}%`,
                    height: `${item.h * 30}px`,
                  }}
                >
                  <HighCharts
                    width={`${item.w * 100}%`}
                    height={`${item.h * 40}px`}
                    charttype={item.chartType}
                    chartColours={item.chart_colours}
                    reportType={item.reportType}
                  />
                </div>
              ))}
            </ResponsiveGridLayout>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewTabs;
