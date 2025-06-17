//modified By Yuvraj Jaiswal
//changed stackbar and stackcolumn configuration
//changed configuration for all charts, removed mapping logic here as it is not required
import React, { useEffect, useMemo, useState, useRef } from "react";
import HighChartsColors from "../PreviewHighchart/HIghChartsColors.js";
import axios from "axios";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import highchartsExporting from "highcharts/modules/exporting";
import HighchartsMore from "highcharts/highcharts-more";
import highchartsOfflineExporting from "highcharts/modules/offline-exporting";
import Highcharts3D from "highcharts/highcharts-3d";
import HighchartsMap from "highcharts/modules/map";
import DashboardReport from "../DashboardReport/DashboardReport";
import BoxPreview from "./BoxPreview";
import HighchartsBoost from "highcharts/modules/boost";
import { decryptData } from "../utils/EncriptionStore";
import "./HighCharts.css";
import { toast } from "react-toastify";
import { Box, CircularProgress } from "@mui/material";

const apiUrlEndPoint2 = process.env.REACT_APP_API_URL2;
HighchartsBoost(Highcharts);
Highcharts3D(Highcharts);
HighchartsMap(Highcharts);
HighchartsMore(Highcharts);
highchartsExporting(Highcharts);
highchartsOfflineExporting(Highcharts);

function HighCharts({ height, width, charttype, key, reportType, flag }) {
  const [chartDatastore, setchartDatastore] = useState();
  const [data, setData] = useState();

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const [TableData, setTableData] = useState();
  const [DataNotFount, setDataNotfound] = useState({ status: "", message: "" });
  const [Boxdata, setBoxdata] = useState();
  const [columnCount, setcolumnCount] = useState(0);
  const [loadingTable, setLoadingTable] = useState();
  const [loadingChart, setLoadingChart] = useState();
  const [loadingBox, setLoadingBox] = useState();

  axios.interceptors.request.use(
    (config) => {
      const token = JSON.parse(localStorage.getItem("token"));
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  useEffect(() => {
    let interval = 300000;
    let intervalId;
    const postData = async () => {
      try {
        const requestData = {
          report_title: charttype,
          database_type: "mysql",
          email: user.user_email_id,
          database_type: user.database_type,
        };
        if (reportType === "Table") {
          requestData.page_no = 1;
          requestData.page_size = 10;
        }
        if (reportType === "Chart") {
          setLoadingChart(true);
        } else if (reportType === "Table") {
          setLoadingTable(true);
        } else if (reportType === "Box") {
          console.log(reportType, "reportType")
          setLoadingBox(true);
        }
        const response = await axios.post(`${apiUrlEndPoint2}/getReportData/`, requestData);
        if (response?.status === 200 && response?.data?.StatusCode === 404) {
          setDataNotfound({
            status: 404,
            message: "Data Not Found",
            Report_name: charttype,
          });
          return;
        } else {
          setDataNotfound({ status: "", message: "" });
        }

        if (response?.data?.data?.report_type === "chart") {
          interval = response?.data?.data?.auto_update_interval * 60000;
          setData(response.data.data);
          setLoadingChart(false);
        } else if (response?.data?.data?.report_type === "table") {
          interval = response?.data?.data?.auto_update_interval * 60000;
          setTableData(response.data.data);
          setLoadingTable(false);
        } else if (response?.data?.data.report_type === "box") {
          setLoadingBox(false);
          interval = response?.data?.data.auto_update_interval * 60000;
          setBoxdata(response.data.data);
          console.log(loadingBox, "loadingBox")
        }
      } catch (error) {
        console.log(error);
      }
    };
    postData();
    intervalId = setInterval(postData, interval);
    return () => clearInterval(intervalId);
  }, [charttype]);

  useEffect(() => {
    if (
      data?.len_col &&
      (data.chart_type === "bar" ||
        data.chart_type === "column" ||
        data.chart_type === "stackcolumn" ||
        data.chart_type === "stackbar")
    ) {
      setcolumnCount(data?.len_col);
    }
  }, [data]);

  const [legends, setLegends] = useState([]);
  // const [legendsReference, setLegendsReference] = useState([]);
  const [parsedColors, setParsedColors] = useState([]);
  const [defaultColors, setDefaultColors] = useState([]);

  const safeParseJSON = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Invalid JSON:", error);
      return null;
    }
  };

  useEffect(() => {
    if (!data) return;

    if (data?.chart_colours) {
      const colors =
        typeof data?.chart_colours === "string"
          ? safeParseJSON(data?.chart_colours)
          : data?.chart_colours;
      setParsedColors(colors || {});
    }

    const isSimpleChart = (type) =>
      ["3dpie", "3d donut", "pie", "donut", "drillcolumn"].includes(type) ||
      (["bar", "column", "stackbar", "stackcolumn"].includes(type) &&
        columnCount <= 2);
    const extractLegends = () => {
      const legends = [];
      if (isSimpleChart(data?.chart_type)) {
        data?.xAxis?.forEach((item) => {
          item?.categories?.forEach((category) => {
            const nameAsString = String(category);
            if (!legends.includes(nameAsString)) legends.push(nameAsString);
          });
        });
      } else {
        data?.series?.forEach((seriesItem) => {
          const nameAsString = String(seriesItem.name);
          if (!legends.includes(nameAsString)) legends.push(nameAsString);
        });
      }
      return legends;
    };
    const newLegends = extractLegends();
    const parsedColorsval = data?.chart_colours
      ? typeof data?.chart_colours === "object"
        ? data?.chart_colours
        : safeParseJSON(data?.chart_colours)
      : {};

    if (Array.isArray(newLegends) && newLegends.length > 0) {
      if (parsedColorsval) {
        const validLegends = newLegends.filter(
          (key) => parsedColorsval[key] !== undefined
        );
        const getRandomColors = (colors, count) => {
          const shuffled = [...colors].sort(() => 0.5 - Math.random());
          return shuffled.slice(0, count);
        };
        const defaultColorsForJson =
          validLegends.length > 0
            ? getRandomColors(
              Object.values(HighChartsColors),
              validLegends.length
            )
            : [];
        setDefaultColors(defaultColorsForJson);
        setLegends(validLegends);
      }
    }
  }, [columnCount, data]);

  const [chartColoursFromJson, setChartColoursFromJson] =
    useState(defaultColors);

  useEffect(() => {
    if (parsedColors && legends.length > 0) {
      const colorsInOrder = legends.map((legend) => parsedColors[legend]);
      setChartColoursFromJson(colorsInOrder);
    } else {
      setChartColoursFromJson([]);
    }
  }, [legends, parsedColors]);

  const drilldownWindowRef = useRef(null);

  useMemo(() => {
    let chartData = {};
    if (!data || !data?.chart_type) return;

    const getNameFromValue = (value) => {
      for (let obj of data.series) {
        if (obj.data.includes(value)) {
          return obj.name;
        }
      }
      return null;
    };

    // const wantedInfo = (title, charttype, category, seriesName, value) => {
    //   const category_name = getNameFromValue(category);
    //   const wantedData = {
    //     report_title: title,
    //     category_name: category_name,
    //     category_value: category,
    //     selected_series_name: seriesName,
    //     selected_value_y_coordinate: value,
    //   };
    //   if (wantedData && charttype !== "drillcolumn") {
    //     const queryString = new URLSearchParams(wantedData).toString();
    //     const url = `/drillDown?${queryString}`;

    //     if (drilldownWindow && !drilldownWindow.closed) {
    //       drilldownWindow.location.href = url;
    //       drilldownWindow.focus();
    //     } else {
    //       drilldownWindow = window.open(url, "_blank", "width=600,height=400");
    //     }
    //   } else {
    //     const queryString = new URLSearchParams(wantedData).toString();
    //     const url = `/columndrilldown?${queryString}`;

    //     if (drilldownWindow && !drilldownWindow.closed) {
    //       drilldownWindow.location.href = url;
    //       drilldownWindow.focus();
    //     } else {
    //       drilldownWindow = window.open(url, "_blank", "width=600,height=400");
    //     }
    //   }
    // };
    
    const wantedInfo = (title, charttype, category, seriesName, value) => {
      const category_name = getNameFromValue(category);
      const wantedData = {
        report_title: title,
        category_name: category_name,
        category_value: category,
        selected_series_name: seriesName,
        selected_value_y_coordinate: value,
      };
      const queryString = new URLSearchParams(wantedData).toString();
      const isColumnChart = charttype === "drillcolumn";
      const url = isColumnChart ? `/columndrilldown?${queryString}` : `/drillDown?${queryString}`;

      if (drilldownWindowRef.current && !drilldownWindowRef.current.closed) {
        drilldownWindowRef.current.location.href = url;
        drilldownWindowRef.current.focus();
      } else {
        drilldownWindowRef.current = window.open(url, "_blank", "width=600,height=400");
      }
    };
    
    const chart_subtitle = data?.chart_subtitle || "";
    switch (data?.chart_type) {
      case "line":
        const pointEvents =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "line", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: { type: "line", events: {} },
          title: { text: data.title || "" },
          subtitle: { text: chart_subtitle },
          tooltip: { shared: true },
          credits: { enabled: false },
          xAxis: { categories: data && data.xAxis[0].categories },
          yAxis: [
            { min: 0, title: { text: null } },
            { opposite: true, title: { text: null } },
          ],
          plotOptions: {
            line: {
              cursor: "pointer",
              point: { events: pointEvents },
              marker: { enabled: true, states: { hover: { enabled: true } } },
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          navigation: {
            menuStyle: {
              background: "white",
              height: "150px",
              overflow: "scroll",
            },
          },
          series: data.series
            ?.filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };

        break;
      case "area":
        const pointEvent =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "area", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: { type: "area" },
          title: { text: data.title || "" },
          subtitle: { text: chart_subtitle },
          tooltip: { shared: true },
          credits: { enabled: false },
          xAxis: { categories: data && data.xAxis[0].categories },
          yAxis: [
            { min: 0, title: { text: null } },
            { opposite: true, title: { text: null } },
          ],
          plotOptions: {
            area: {
              cursor: "pointer",
              point: { events: pointEvent },
              marker: {
                enabled: true,
                states: {
                  hover: {
                    enabled: true,
                  },
                },
              },
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          series: data.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "bar":
        const pointEvent2 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                wantedInfo(data?.title, "bar", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };

        if (columnCount > 2) {
          chartData = {
            chart: { type: "bar" },
            title: { text: data.title || "" },
            subtitle: { text: chart_subtitle },
            tooltip: { shared: true },
            credits: { enabled: false },
            xAxis: { categories: data?.xAxis[0]?.categories || [] },
            yAxis: [
              { min: 0, title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            plotOptions: {
              bar: {
                cursor: "pointer",
                point: { events: pointEvent2 },
                marker: {
                  enabled: true,
                  states: { hover: { enabled: true } },
                },
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },
            series: data.series
              .filter((series, index) =>
                index === 0
                  ? !series.data.every((item) => typeof item === "string")
                  : true
              )
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          chartData = {
            chart: { type: "bar" },
            title: { text: data.title || "" },
            subtitle: { text: chart_subtitle },
            tooltip: { shared: true },
            credits: { enabled: false },
            xAxis: { categories: data?.xAxis[0]?.categories || [] },
            yAxis: [
              { min: 0, title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            plotOptions: {
              bar: {
                cursor: "pointer",
                point: { events: pointEvent2 },
                marker: {
                  enabled: true,
                  states: { hover: { enabled: true } },
                },
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },
            series: data.series
              .filter((series, index) =>
                index === 0
                  ? !series.data.every((item) => typeof item === "string")
                  : true
              )
              .map((series) => {
                const categoryColors = data?.xAxis[0]?.categories.map(
                  (category) => {
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0];
                  }
                );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    dataLabels: {
                      enabled:
                        data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                      formatter: function () {
                        return this.y; // Display the y-value
                      },
                      style: {
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        color: "#333", // Customize label color
                      },
                    },
                    color:
                      categoryColors[pointIndex % categoryColors.length] ||
                      defaultColors[pointIndex % defaultColors.length],
                  })),
                };
              }),
          };
        }
        break;
      case "column":
        const pointEvent4 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                wantedInfo(data?.title, "column", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };

        if (columnCount > 2) {
          chartData = {
            chart: { type: "column" },
            title: { text: data.title || "" },
            subtitle: { text: chart_subtitle },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: data?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
            plotOptions: {
              series: {
                colorByPoint: false, // Ensure color is applied per series
              },
              column: {
                colorByPoint: false,
                cursor: "pointer",
                point: { events: pointEvent4 },
                marker: {
                  enabled: true,
                  states: { hover: { enabled: true } },
                },
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },
            series: data?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length], // Map colors to each series
              })),
          };
        } else if (columnCount <= 2) {
          chartData = {
            chart: { type: "column" },
            title: { text: data.title || "" },
            subtitle: { text: chart_subtitle },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: data?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
            plotOptions: {
              column: {
                colorByPoint: false,
                cursor: "pointer",
                point: { events: pointEvent4 },
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },
            series: data.series
              .filter((series, index) =>
                index === 0
                  ? !series.data.every((item) => typeof item === "string")
                  : true
              )
              .map((series) => {
                const categoryColors = data?.xAxis[0]?.categories.map(
                  (category) => {
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0];
                  }
                );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    color:
                      categoryColors[pointIndex % categoryColors.length] ||
                      defaultColors[pointIndex % defaultColors.length],
                  })),
                };
              }),
          };
        }
        break;
      case "3dpie":
        const pointEvent31 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                const category = this.name;
                wantedInfo(data?.title, "3dpie", category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: {
            type: "pie",
            options3d: {
              enabled: true,
              alpha: 45,
              beta: 0,
            },
          },
          title: {
            text: data.title || "",
          },
          subtitle: { text: chart_subtitle },
          accessibility: {
            point: {
              valueSuffix: "%",
            },
          },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.name}: {point.y}</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            series: {
              allowPointSelect: true,
              cursor: "pointer",
              colors: chartColoursFromJson || defaultColors,
              point: {
                events: pointEvent31,
              },
            },
            pie: {
              allowPointSelect: true,
              cursor: "pointer",
              depth: 35,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                format: "{point.name}: {point.y}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: data && data?.series[0]?.name,
              colorByPoint: true,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              data:
                data &&
                data?.series[0]?.data.map((name, index) => [
                  name,
                  data && data?.series[1]?.data[index],
                ]),
            },
          ],
        };
        break;
      case "3d donut":
        const pointEvent32 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                const category = this.name;
                wantedInfo(data?.title, "3d donut", category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: { type: "pie", options3d: { enabled: true, alpha: 45 } },
          title: { text: data.title || "" },
          subtitle: { text: chart_subtitle },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.name}: {point.y}</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: 100,
              depth: 45,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                format: "{point.name}: {point.y}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  textOutline: false,
                  color: "#333", // Customize label color
                },
              },
            },
            series: {
              allowPointSelect: true,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                format: "{point.name}: {point.y}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  textOutline: false,
                  color: "#333", // Customize label color
                },
              },
              cursor: "pointer",
              colors: chartColoursFromJson || defaultColors,
              point: {
                events: pointEvent32,
              },
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: data && data?.series[0]?.name,
              colorByPoint: true,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              data:
                data &&
                data?.series[0]?.data.map((name, index) => [
                  name,
                  data && data?.series[1]?.data[index],
                ]),
            },
          ],
        };
        break;
      case "donut":
        const pointEvent33 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                const category = this.name;
                wantedInfo(data?.title, "donut", category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };

        // Calculate the total value for the donut center
        const total =
          data?.series[1]?.data?.reduce((sum, value) => sum + value, 0) || 0;

        chartData = {
          chart: {
            type: "pie",
            events: {
              render: function () {
                const centerX = this.plotLeft + this.plotWidth / 2;
                const centerY = this.plotTop + this.plotHeight / 2;

                // Calculate the inner radius of the donut chart (the hole size)
                const innerRadius =
                  this.innerRadius || (this.plotWidth / 2) * 0.7; // Default inner size is 70% of the outer radius
                const radius = this.plotWidth / 2;

                // Dynamically calculate font size based on the inner radius
                const fontSize = Math.min(innerRadius * 0.45, 20); // Font size is 15% of inner radius, but max is 20px

                // Dynamically create or update the "Total" label in the center of the donut hole
                if (!this.customLabel) {
                  this.customLabel = this.renderer
                    .text(`Total<br><b>${total}</b>`, centerX, centerY)
                    .css({
                      color: "#000",
                      fontSize: `${fontSize}px`,
                      textAlign: "center",
                      fontWeight: "bold",
                    })
                    .attr({
                      align: "center",
                      zIndex: 5,
                    })
                    .add();
                } else {
                  this.customLabel.attr({
                    x: centerX,
                    y: centerY,
                    text: `Total<br><b>${total}</b>`,
                    style: { fontSize: `${fontSize}px` }, // Update font size dynamically
                  });
                }
              },
            },
          },
          title: { text: data.title || "" },
          subtitle: { text: chart_subtitle },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.name}: {point.y}</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: "70%", // Adjust this value for desired donut thickness
              depth: 45,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                format: "{point.name}: {point.y}",
                style: {
                  textOutline: false,
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },

              showInLegend: true,
            },
            series: {
              allowPointSelect: true,
              cursor: "pointer",
              colors: chartColoursFromJson || defaultColors,
              point: {
                events: pointEvent33,
              },
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: data?.series[0]?.name || "Series 1",
              colorByPoint: true,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              data:
                data?.series[0]?.data?.map((name, index) => ({
                  name,
                  y: data?.series[1]?.data[index],
                  color:
                    chartColoursFromJson[index % chartColoursFromJson.length] ||
                    defaultColors[index % defaultColors.length],
                })) || [],
            },
          ],
        };
        break;
      case "pie":
        const pointEvent3 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                const category = this.name;
                wantedInfo(data?.title, "pie", category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: {
            type: "pie",
            events: {},
          },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}</b>",
            valueSuffix: "%",
          },
          plotOptions: {
            series: {
              allowPointSelect: true,
              cursor: "pointer",
              colors: chartColoursFromJson || defaultColors,
              point: {
                events: pointEvent3,
              },
              dataLabels: [
                {
                  enabled: true,
                  distance: -40,
                  formatter: function () {
                    return this.y; // Count inside the pie
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "white",
                    textOutline: "none",
                  },
                  filter: {
                    operator: ">",
                    property: "percentage",
                    value: 10,
                  },
                },
                {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  distance: 20,
                  formatter: function () {
                    return `${this.point.name}`; // Legends outside the pie
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "black",
                    textOutline: "none",
                  },
                  allowOverlap: false,
                },
              ],
              showInLegend: true,
            },
          },
          navigation: {
            menuStyle: {
              background: "#FFFFFF",
              height: "150px",
              overflow: "scroll",
            },
          },
          title: { text: data.title || "" },

          series: [
            {
              boostThreshold: 1000,
              name: data?.series[0]?.name,
              colorByPoint: true,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              data: data?.series[0]?.data.map((name, index) => ({
                name,
                y: data?.series[1]?.data[index],
              })),
            },
          ],
          credits: { enabled: false },
        };
        break;
      case "stackarea":
        const pointEvent5 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "stackarea", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: {
            type: "area",
            backgroundColor: "rgba(33,37,41,0.1)",
          },
          title: {
            text: data.title || "",
          },
          subtitle: { text: chart_subtitle },
          tooltip: {
            shared: true,
          },
          credits: {
            enabled: false,
          },
          xAxis: { categories: data && data.xAxis[0].categories },
          legend: {
            shadow: false,
          },
          yAxis: [
            {
              min: 0,
              title: {
                text: null,
              },
            },

            {
              opposite: true,
              title: {
                text: null,
              },
            },
          ],
          plotOptions: {
            area: {
              cursor: "pointer",
              point: {
                events: pointEvent5,
              },
              stacking: "normal",
              lineColor: "#666666",
              lineWidth: 1,
              marker: {
                lineWidth: 1,
                lineColor: "#666666",
              },
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          series: data.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "stackbar":
        const pointEvent6 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "stackbar", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        if (columnCount > 2) {
          chartData = {
            chart: {
              type: "bar",
            },
            legend: {
              reversed: true,
            },
            title: {
              text: data.title || "",
            },
            subtitle: { text: chart_subtitle },
            tooltip: {
              shared: true,
            },
            credits: {
              enabled: false,
            },
            xAxis: { categories: data && data.xAxis[0].categories },
            yAxis: [
              {
                min: 0,
                title: {
                  text: null,
                },
              },
              {
                opposite: true,
                title: {
                  text: null,
                },
              },
            ],
            plotOptions: {
              series: {
                cursor: "pointer",
                point: {
                  events: pointEvent6,
                },
                stacking: "normal",
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                    textOutline: false,
                  },
                },
              },
              bar: {
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },

            series: data.series
              ?.filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
                data: series.data,
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          chartData = {
            chart: {
              type: "bar",
            },
            legend: {
              reversed: true,
            },
            title: {
              text: data.title || "",
            },
            subtitle: { text: chart_subtitle },
            tooltip: {
              shared: true,
            },
            credits: {
              enabled: false,
            },
            xAxis: { categories: data && data.xAxis[0].categories },
            yAxis: [
              {
                min: 0,
                title: {
                  text: null,
                },
              },
              {
                opposite: true,
                title: {
                  text: null,
                },
              },
            ],
            plotOptions: {
              series: {
                cursor: "pointer",
                point: {
                  events: pointEvent6,
                },
                stacking: "normal",
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
              bar: {
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },

            series: data.series
              ?.filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series) => {
                const categoryColors = data?.xAxis[0]?.categories.map(
                  (category) => {
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0];
                  }
                );
                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    color:
                      categoryColors[pointIndex % categoryColors.length] ||
                      defaultColors[pointIndex % defaultColors.length],
                  })),
                };
              }),
          };
        }
        break;
      case "stackcolumn":
        const pointEvent9 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "stackcolumn", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        if (columnCount > 2) {
          chartData = {
            chart: {
              type: "column",
            },
            title: {
              text: data.title || "",
            },
            subtitle: { text: chart_subtitle },
            tooltip: {
              shared: true,
            },
            credits: {
              enabled: false,
            },
            xAxis: { categories: data && data.xAxis[0].categories },
            yAxis: [
              {
                min: 0,
                title: {
                  text: null,
                },
              },
              {
                opposite: true,
                title: {
                  text: null,
                },
              },
            ],
            plotOptions: {
              column: {
                cursor: "pointer",
                point: {
                  events: pointEvent9,
                },
                stacking: "normal",
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    textOutline: false,
                    color: "#333", // Customize label color
                  },
                },
              },
            },
            series: data.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          chartData = {
            chart: {
              type: "column",
            },
            title: {
              text: data.title || "",
            },
            subtitle: { text: chart_subtitle },
            tooltip: {
              shared: true,
            },
            credits: {
              enabled: false,
            },
            xAxis: { categories: data && data.xAxis[0].categories },
            yAxis: [
              {
                min: 0,
                title: {
                  text: null,
                },
              },
              {
                opposite: true,
                title: {
                  text: null,
                },
              },
            ],
            plotOptions: {
              column: {
                cursor: "pointer",
                point: {
                  events: pointEvent9,
                },
                stacking: "normal",
                dataLabels: {
                  enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  style: {
                    textOutline: false,
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                },
              },
            },
            series: data.series
              .filter((series, index) =>
                index === 0
                  ? !series.data.every((item) => typeof item === "string")
                  : true
              )
              .map((series) => {
                const categoryColors = data?.xAxis[0]?.categories.map(
                  (category) => {
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0];
                  }
                );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    color:
                      categoryColors[pointIndex % categoryColors.length] ||
                      defaultColors[pointIndex % defaultColors.length],
                  })),
                };
              }),
          };
        }
        break;
      case "speedometer":
        chartData = {
          chart: {
            type: "gauge",
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false,
            height: "30%",
          },
          plotOptions: {
            gauge: {
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          title: { text: data.title || "" },
          subtitle: { text: chart_subtitle },
          pane: {
            startAngle: -90,
            endAngle: 89.9,
            background: null,
            center: ["50%", "75%"],
            size: "110%",
          },

          yAxis: {
            min: 0,
            max: 200,
            tickPixelInterval: 72,
            tickPosition: "inside",
            tickColor:
              Highcharts.defaultOptions.chart.backgroundColor || "#FFFFFF",
            tickLength: 20,
            tickWidth: 2,
            minorTickInterval: null,
            labels: {
              distance: 20,
              style: {
                fontSize: "14px",
              },
            },
            lineWidth: 0,
            plotBands: [
              {
                from: 0,
                to: 130,
                color: chartColoursFromJson[0] || defaultColors[0],
                thickness: 20,
                borderRadius: "50%",
              },
              {
                from: 150,
                to: 200,
                color: chartColoursFromJson[1] || defaultColors[1],
                thickness: 20,
                borderRadius: "50%",
              },
              {
                from: 120,
                to: 160,
                color: chartColoursFromJson[2] || defaultColors[2],
                thickness: 20,
              },
            ],
          },
          credits: { enabled: false },
          series: [
            {
              boostThreshold: 1000,
              name: data?.series[0].name,
              data: data?.series[0].data,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  borderWidth: 0,
                  color: "#333", // Customize label color
                },
              },
              dial: {
                radius: "80%",
                backgroundColor: chartColoursFromJson[3] || defaultColors[3],
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                backgroundColor: chartColoursFromJson[4] || defaultColors[4],
                radius: 6,
              },
            },
          ],
        };
        break;
      case "gauge":
        const pointEvent_2 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "gauge", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: {
            type: "solidgauge",
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false,
          },
          title: {
            text: data.title || "",
          },
          subtitle: { text: chart_subtitle },
          pane: {
            center: ["50%", "75%"],
            size: "100%",
            startAngle: -90,
            endAngle: 90,
            background: {
              backgroundColor:
                Highcharts.defaultOptions.legend.backgroundColor || "#EEE",
              innerRadius: "60%",
              outerRadius: "100%",
              shape: "arc",
            },
          },

          credits: { enabled: false },
          yAxis: {
            min: 0,
            max: 500,
            tickPixelInterval: 72,
            tickPosition: "inside",
            tickLength: 20,
            tickWidth: 2,
            minorTickInterval: null,
            labels: {
              distance: 10,
              style: {
                fontSize: "14px",
              },
            },
            lineWidth: 0,
            plotBands: [
              {
                from: 0,
                to: 150,
                color: chartColoursFromJson[0] || defaultColors[0],
                thickness: 50,
              },
              {
                from: 150,
                to: 300,
                color: chartColoursFromJson[1] || defaultColors[1],
                thickness: 50,
              },
              {
                from: 300,
                to: 500,
                color: chartColoursFromJson[2] || defaultColors[2],
                thickness: 50,
              },
            ],
          },
          navigation: {
            menuStyle: {
              background: "#FFFFFF",
              height: "150px",
              overflow: "scroll",
            },
          },

          plotOptions: {
            series: {
              cursor: "pointer",
              point: pointEvent_2,
            },
            gauge: {
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },

          series: [
            {
              boostThreshold: 1000,
              name: data?.series[0].name,
              data: data?.series[0].data,
              color: HighChartsColors.yellow,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                borderWidth: 0,
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              dial: {
                radius: "80%",
                backgroundColor: chartColoursFromJson[3] || defaultColors[3],
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                backgroundColor: chartColoursFromJson[4] || defaultColors[4],
                radius: 6,
              },
            },
          ],
        };

        break;
      case "radialbar":
        const pointEvent8 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "radialbar", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: {
            type: "column",
            inverted: true,
            polar: true,
          },
          title: {
            text: data.title || "",
          },
          subtitle: { text: chart_subtitle },
          tooltip: {
            shared: true,
          },
          credits: {
            enabled: false,
          },
          pane: {
            size: "85%",
            innerSize: "40%",
            endAngle: 270,
          },
          xAxis: {
            tickInterval: 1,
            labels: {
              align: "right",
              useHTML: true,
              allowOverlap: true,
              step: 1,
              y: 3,
              style: {
                fontSize: "13px",
              },
            },
            lineWidth: 0,
            gridLineWidth: 0,

            categories: data.xAxis[0].categories.map(
              (category, index) =>
                `${category} <span class="f16"><span id="flag" class="flag ${index}"></span></span>`
            ),
          },
          yAxis: {
            lineWidth: 0,
            tickInterval: 25,
            reversedStacks: false,
            endOnTick: true,
            showLastLabel: true,
            gridLineWidth: 0,
          },
          plotOptions: {
            column: {
              stacking: "normal",
              borderWidth: 0,
              pointPadding: 0,
              groupPadding: 0.15,
              borderRadius: "50%",
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
            bar: {
              cursor: "pointer",
              point: {
                events: pointEvent8,
              },
              marker: {
                enabled: true,
                states: {
                  hover: {
                    enabled: true,
                  },
                },
              },
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          series: data.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "3darea":
        const pointEvent13 =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = data?.series.map(
                  (series) => this.series.name
                )[0];
                wantedInfo(data?.title, "3darea", this.category, seriesName, this.y);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: {
            type: "area",
            options3d: { enabled: true, alpha: 15, beta: 30, depth: 200 },
          },
          title: { text: data.title || "" },
          subtitle: { text: chart_subtitle },
          accessibility: {
            keyboardNavigation: { seriesNavigation: { mode: "serialize" } },
          },
          lang: {
            accessibility: {
              axis: {
                xAxisDescriptionPlural:
                  "The chart has 3 unlabelled X axes, " +
                  "one for each series.",
              },
            },
          },
          yAxis: {
            title: { x: -40 },
            labels: { format: "{value:,.0f}" },
            gridLineDashStyle: "Dash",
          },
          xAxis: { categories: data && data.xAxis[0].categories },
          plotOptions: {
            area: {
              point: {
                events: pointEvent13,
              },
              cursor: "pointer",
              depth: 100,
              marker: { enabled: false },
              states: { inactive: { enabled: false } },
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          credits: { enabled: false },
          series: data.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "drillcolumn":
        const pointEventdrill =
          data.drilldown === "yes"
            ? {
              click: function () {
                const seriesName = this.series.name;
                const category = this.name;
                const allcategory = JSON.stringify(data?.xAxis[0]?.categories || [])
                wantedInfo(data?.title, "drillcolumn", category, seriesName, allcategory);
              },
            }
            : {
              click: function () {
                toast.success("Drilldown is not enabled", {
                  position: "top-right",
                  autoClose: 2000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: true,
                  theme: "light",
                });
              },
            };
        chartData = {
          chart: { type: 'column' },
          exporting: {
            enabled: true,
            buttons: {
              contextButton: {
                menuItems: [
                  'downloadPDF',
                  'downloadCSV',
                  'printChart',
                  'viewFullscreen',
                  'downloadPNG',
                  'downloadJPEG'
                ]

              }
            }
          },
          title: { align: 'center', text: data.title || "" },
          accessibility: { announceNewData: { enabled: true } },
          xAxis: { type: 'category' },
          yAxis: { title: { text: null } },
          legend: { enabled: false },
          credits: { enabled: false },
          plotOptions: { series: { borderWidth: 0, cursor: "pointer", point: { events: pointEventdrill }, colors: chartColoursFromJson || defaultColors, dataLabels: { enabled: true, format: '{point.y:.1f}' } }, },
          tooltip: {
            headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat: '<span style="color:{point.color}">{point.name}</span>: ' +
              '<b>{point.y:.2f}</b> of total<br/>'
          },
          series: [
            {
              boostThreshold: 1000,
              name: data?.series[0]?.name,
              colorByPoint: true,
              dataLabels: {
                enabled: data?.labels?.toLowerCase() === "yes" ? true : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              data: data?.series[0]?.data.map((name, index) => ({
                name,
                y: data?.series[1]?.data[index],
                drilldown: null
              })),
            },
          ],
        }
        break;
      default:
        break;
    }

    setchartDatastore(chartData);
  }, [chartColoursFromJson, columnCount, data, defaultColors]);

  return (
    <div>
      <div style={{ width: { width }, height: { height } }}>
        {DataNotFount?.status === 404 ? (
          <div className="report_header_container" style={{ height: height }}>
            <div className="report-name-show">{DataNotFount?.Report_name}</div>
            <div className="data-check-message">{DataNotFount?.message}</div>
          </div>
        ) : (
          <div id={key}>
            {loadingTable ? (
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
                <CircularProgress />
              </Box>
            ) : (TableData && (
              <DashboardReport
                height={height}
                width={width}
                style={{ height: { height }, width: { width } }}
                TableData={TableData}
              />)
            )}
            {loadingChart ? (
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
                <CircularProgress />
              </Box>
            ) : (
              chartDatastore && (
                <HighchartsReact
                  highcharts={Highcharts}
                  options={chartDatastore}
                  callback={() => setLoadingChart(false)} // Hide loader when chart is ready
                  containerProps={{ id: key, style: { height: height } }}
                />
              )
            )}
            {loadingBox ? (
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
                <CircularProgress />
              </Box>
            ) : (
              Boxdata && (
                <BoxPreview
                  Boxdata={Boxdata}
                  height={height}
                  width={width}
                  style={{ height: { height }, width: { width } }}
                  flagvalue={flag}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HighCharts;
