import React, { useEffect, useMemo, useState } from "react";
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

import "./HighCharts.css";
import { toast } from "react-toastify";
const apiUrlEndPoint2 = process.env.REACT_APP_API_URL2;
HighchartsBoost(Highcharts);
Highcharts3D(Highcharts);
HighchartsMap(Highcharts);
HighchartsMore(Highcharts);
highchartsExporting(Highcharts);
highchartsOfflineExporting(Highcharts);

function HighCharts({ height, width, charttype, key }) {
  const [chartDatastore, setchartDatastore] = useState();
  const [data, setData] = useState();
  const [legends, setLegends] = useState([]);
  const [columnCount, setcolumnCount] = useState(0);

  //to be fixed
  useMemo(() => {
    if (
      data?.xAxis[0]?.categories &&
      (data.chart_type === "bar" || data.chart_type === "column")
    ) {
      setcolumnCount(data?.series?.length);
    }
  }, [data]);

  useMemo(() => {
    setLegends([]);
    if (
      data?.chart_type === "3dpie" ||
      data?.chart_type === "3d donut" ||
      data?.chart_type === "donut" ||
      data?.chart_type === "pie" ||
      (data?.chart_type === "bar" && columnCount <= 2) ||
      (data?.chart_type === "column" && columnCount <= 2) ||
      (data.chart_type === "stackcolumn" && columnCount <= 2) ||
      (data.chart_type === "stackbar" && columnCount <= 2)
    ) {
      data?.xAxis?.forEach((item) => {
        item?.categories?.forEach((category) => {
          setLegends((prevLegends) => {
            if (!prevLegends.includes(category)) {
              return [...prevLegends, category];
            }
            return prevLegends;
          });
        });
      });
    } else {
      if (data?.series && Array.isArray(data?.series)) {
        data?.series.forEach((seriesItem) => {
          setLegends((prevLegends) => {
            if (!prevLegends.includes(seriesItem.name)) {
              return [...prevLegends, seriesItem.name];
            }
            return prevLegends;
          });
        });
      }
    }
  }, [data, columnCount]);

  useEffect(() => {
    const getRandomColors = (colors, count) => {
      let shuffledColors = [...colors].sort(() => 0.5 - Math.random());
      return shuffledColors.slice(0, count);
    };
    let defaultColorsForJson =
      Array.isArray(legends) && legends?.length > 0
        ? getRandomColors(Object.values(HighChartsColors), legends.length)
        : [];

    setDefaultColors(defaultColorsForJson);
  }, []);

  const [defaultColors, setDefaultColors] = useState([]);
  const [TableData, setTableData] = useState();
  const [DataNotFount, setDataNotfound] = useState({ status: "", message: "" });
  const [Boxdata, setBoxdata] = useState();
  const [topology, setTopology] = useState(null);
  const user = JSON.parse(localStorage.getItem("profile"));

  axios.interceptors.request.use(
    (config) => {
      const token = JSON.parse(localStorage.getItem("token"));
      if (token) {
        config.headers["Authorization"] = `Bearer ${token.access_token}`;
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
        const response = await axios.post(`${apiUrlEndPoint2}/getReportData/`, {
          report_title: charttype,
          database_type: "mysql",
          email: user.user_email_id,
        });
        if (response?.status === 204) {
          setDataNotfound({
            status: 204,
            message: "Data Not Found",
            Report_name: charttype,
          });
          return;
        } else {
          setDataNotfound({ status: "", message: "" });
        }
        if (
          response?.data?.report_type === "chart" &&
          response?.data?.chart_type !== "geomap"
        ) {
          interval = response?.data?.auto_update_interval * 60000;
          setData(response.data);
        } else if (response?.data?.report_type === "table") {
          interval = response?.data?.auto_update_interval * 60000;
          setTableData(response.data);
        } else if (response?.data?.report_type === "box") {
          interval = response?.data?.auto_update_interval * 60000;
          setBoxdata(response.data);
        } else if (
          response?.data?.report_type === "chart" &&
          response?.data?.chart_type === "geomap"
        ) {
          const fetchTopology = async () => {
            const response = await fetch(
              "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json"
            );
            const topologyData = await response.json();
            setTopology(topologyData);
          };
          fetchTopology();
        }
      } catch (error) {
        console.log(error);
      }
    };

    postData();

    intervalId = setInterval(postData, interval);

    return () => clearInterval(intervalId);
  }, [charttype]);

  useMemo(() => {
    let chartData = {};
    if (!data || !data?.chart_type) return;
    let drilldownWindow = null;

    const getNameFromValue = (value) => {
      for (let obj of data.series) {
        if (obj.data.includes(value)) {
          return obj.name;
        }
      }
      return null;
    };

    const wantedInfo = (title, category, seriesName, value) => {
      const category_name = getNameFromValue(category);
      const wantedData = {
        report_title: title,
        category_name: category_name,
        category_value: category,
        selected_series_name: seriesName,
        selected_value_y_coordinate: value,
      };
      if (wantedData) {
        const queryString = new URLSearchParams(wantedData).toString();
        const url = `/drillDown?${queryString}`;

        if (drilldownWindow && !drilldownWindow.closed) {
          drilldownWindow.location.href = url;
          drilldownWindow.focus();
        } else {
          drilldownWindow = window.open(url, "_blank", "width=600,height=400");
        }
      }
    };

    const safeParseJSON = (jsonString) => {
      try {
        return JSON.parse(jsonString);
      } catch (error) {
        console.error("Invalid JSON:", error);
        return null;
      }
    };

    const mapColorsToLegends = (chart_colours) => {
      return legends.map((legend) => {
        if (chart_colours?.[legend]) {
          return chart_colours[legend];
        }

        const matchingKey = Object.keys(chart_colours || {}).find(
          (key) => legend.includes(key) || key.includes(legend)
        );

        return matchingKey ? chart_colours[matchingKey] : null;
      });
    };

    const dataChartColours = mapColorsToLegends(
      safeParseJSON(data.chart_colours) || []
    );

    switch (data.chart_type) {
      case "line":
        const pointEvents =
          data.drilldown === "yes"
            ? {
                click: function () {
                  const seriesName = data?.series.map(
                    (series) => this.series.name
                  )[0];
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
            },
          },
          navigation: {
            menuStyle: {
              background: "white",
              height: "150px",
              overflow: "scroll",
            },
          },
          series: data.series?.map((series, index) => ({
            boostThreshold: 1000,
            name: series.name,
            data: series.data,
            color:
              dataChartColours[index % dataChartColours.length] ||
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
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
              color:
                dataChartColours[index % dataChartColours.length] ||
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
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
                color:
                  dataChartColours[index % dataChartColours.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          console.log("columnCount Bar", columnCount);
          chartData = {
            chart: { type: "bar" },
            title: { text: data.title || "" },
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
              },
            },
            series: data.series
              .filter((series, index) =>
                index === 0
                  ? !series.data.every((item) => typeof item === "string")
                  : true
              )
              .map((series, index) => {
                const categoryColors = data?.xAxis[0]?.categories.map(
                  (category, catIndex) =>
                    dataChartColours[catIndex % dataChartColours.length] ||
                    defaultColors[catIndex % defaultColors.length]
                );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    color: categoryColors[pointIndex % categoryColors.length],
                  })),
                };
              }),
          };
        }
        break;
      case "pie":
        const pointEvent3 =
          data.drilldown === "yes"
            ? {
                click: function () {
                  const seriesName = this.series.name;
                  const category = this.name;
                  wantedInfo(data?.title, category, seriesName, this.y);
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
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
            valueSuffix: "%",
          },
          plotOptions: {
            series: {
              allowPointSelect: true,
              cursor: "pointer",
              colors: dataChartColours || defaultColors,
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
                    fontSize: "1.0em",
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
                  enabled: false,
                  distance: 20,
                  formatter: function () {
                    return `${this.point.name}`; // Legends outside the pie
                  },
                  style: {
                    fontSize: "0.75em",
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
              data: data?.series[0]?.data.map((name, index) => ({
                name,
                y: data?.series[1]?.data[index],
              })),
            },
          ],
          credits: { enabled: false },
        };
        break;
      case "3dpie":
        const pointEvent31 =
          data.drilldown === "yes"
            ? {
                click: function () {
                  const seriesName = this.series.name;
                  const category = this.name;
                  wantedInfo(data?.title, category, seriesName, this.y);
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
              colors: dataChartColours || defaultColors,
              point: {
                events: pointEvent31,
              },
            },
            pie: {
              allowPointSelect: true,
              cursor: "pointer",
              depth: 35,
              dataLabels: {
                enabled: true,
                format: "{point.name}: {point.y}",
              },
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: data && data?.series[0]?.name,
              colorByPoint: true,
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
                  wantedInfo(data?.title, category, seriesName, this.y);
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
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.name}: {point.y}</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: 100,
              depth: 45,
            },
            series: {
              allowPointSelect: true,
              dataLabels: {
                enabled: true,
                format: "{point.name}: {point.y}",
                color: "black",
                style: {
                  textOutline: "none", // Disables the white shadow/outline
                },
              },
              cursor: "pointer",
              colors: dataChartColours || defaultColors,
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
                  wantedInfo(data?.title, category, seriesName, this.y);
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
                enabled: false,
                format: "{point.name}: {point.y}",
                color: "black",
                style: {
                  textOutline: "none", // Disables the white shadow/outline
                },
              },
              showInLegend: true,
            },
            series: {
              allowPointSelect: true,
              cursor: "pointer",
              colors: dataChartColours || defaultColors,
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
              data:
                data?.series[0]?.data?.map((name, index) => ({
                  name,
                  y: data?.series[1]?.data[index],
                })) || [],
            },
          ],
        };
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

          title: {
            text: "Speedometer",
          },

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
                color: dataChartColours[0] || defaultColors[0],
                thickness: 20,
                borderRadius: "50%",
              },
              {
                from: 150,
                to: 200,
                color: dataChartColours[1] || defaultColors[1],
                thickness: 20,
                borderRadius: "50%",
              },
              {
                from: 120,
                to: 160,
                color: dataChartColours[2] || defaultColors[2],
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
                borderWidth: 0,
                color:
                  (Highcharts.defaultOptions.title &&
                    Highcharts.defaultOptions.title.style &&
                    Highcharts.defaultOptions.title.style.color) ||
                  "#333333",
                style: {
                  fontSize: "16px",
                },
              },
              dial: {
                radius: "80%",
                backgroundColor: dataChartColours[3] || defaultColors[3],
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                backgroundColor: dataChartColours[4] || defaultColors[4],
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
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
                color: dataChartColours[0] || defaultColors[0],
                thickness: 50,
              },
              {
                from: 150,
                to: 300,
                color: dataChartColours[1] || defaultColors[1],
                thickness: 50,
              },
              {
                from: 300,
                to: 500,
                color: dataChartColours[2] || defaultColors[2],
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
          },

          series: [
            {
              boostThreshold: 1000,
              name: data?.series[0].name,
              data: data?.series[0].data,
              color: HighChartsColors.yellow,
              dataLabels: {
                borderWidth: 0,
                color:
                  (Highcharts.defaultOptions.title &&
                    Highcharts.defaultOptions.title.style &&
                    Highcharts.defaultOptions.title.style.color) ||
                  "#333333",
                style: {
                  fontSize: "16px",
                },
              },
              dial: {
                radius: "80%",
                backgroundColor: dataChartColours[3] || defaultColors[3],
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                backgroundColor: dataChartColours[4] || defaultColors[4],
                radius: 6,
              },
            },
          ],
        };

        break;
      case "stackcolumn":
        const pointEvent9 =
          data.drilldown === "yes"
            ? {
                click: function () {
                  const seriesName = data?.series.map(
                    (series) => this.series.name
                  )[0];
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
          },
          title: {
            text: data.title || "",
          },
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
                enabled: false,
                style: {
                  textOutline: false,
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
              color:
                dataChartColours[index % dataChartColours.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "3darea":
        chartData = {
          chart: {
            type: "area",
            options3d: { enabled: true, alpha: 15, beta: 30, depth: 200 },
          },
          title: { text: data.title || "" },
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
              depth: 100,
              marker: { enabled: false },
              states: { inactive: { enabled: false } },
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
              color:
                dataChartColours[index % dataChartColours.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "geomap":
        if (!topology) return {};
        chartData = {
          chart: { map: topology },
          title: { text: data.title || "" },
          mapNavigation: {
            enabled: true,
            buttonOptions: { verticalAlign: "bottom" },
          },
          plotOptions: {
            series: {
              point: {
                events: {
                  click: function () {
                    alert(this.name);
                  },
                },
              },
              dataLabels: { enabled: true, style: { textOutline: false } },
            },
          },
          colorAxis: {
            min: 0,
          },
          series: [
            {
              boostThreshold: 1000,
              name: data && data?.series[0]?.name,
              data:
                data &&
                data?.series[0]?.data.map((name, index) => ({
                  name,
                  value: data && data?.series[1]?.data[index],
                  color:
                    dataChartColours[index % dataChartColours.length] ||
                    defaultColors[index % defaultColors.length],
                })),
              states: { hover: { color: "#2BD925" } },
              dataLabels: { enabled: true, format: "{point.name}" },
            },
          ],
        };
        break;
      case "column":
        const pointEvent4 =
          data.drilldown === "yes"
            ? {
                click: function () {
                  const seriesName = this.series.name;
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
                colorByPoint: false, // Ensure color is applied per series
              },
              column: {
                cursor: "pointer",
                point: { events: pointEvent4 },
                marker: {
                  enabled: true,
                  states: { hover: { enabled: true } },
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
                color:
                  dataChartColours[index % dataChartColours.length] ||
                  defaultColors[index % defaultColors.length], // Map colors to each series
              })),
          };
        } else if (columnCount <= 2) {
          chartData = {
            chart: { type: "column" },
            title: { text: data.title || "" },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: data?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
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
                color:
                  dataChartColours[index % dataChartColours.length] ||
                  defaultColors[index % defaultColors.length], // Apply color to each series
              })),
          };
        }

        break;
      case "stackarea":
        const pointEvent5 =
          data.drilldown === "yes"
            ? {
                click: function () {
                  const seriesName = data?.series.map(
                    (series) => this.series.name
                  )[0];
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
              cursor: "pointer",
              marker: {
                lineWidth: 1,
                lineColor: "#666666",
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
              color:
                dataChartColours[index % dataChartColours.length] ||
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
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
                  enabled: false,
                  style: {
                    textOutline: false,
                  },
                },
              },
            },

            series: data.series?.map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              color:
                dataChartColours[index % dataChartColours.length] ||
                defaultColors[index % defaultColors.length],
            })),
          };
        }
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
                enabled: false,
                style: {
                  textOutline: false,
                },
              },
            },
          },

          series: data.series?.map((series, index) => ({
            boostThreshold: 1000,
            name: series.name,
            data: series.data,
            color:
              dataChartColours[index % dataChartColours.length] ||
              defaultColors[index % defaultColors.length],
          })),
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
                  wantedInfo(data?.title, this.category, seriesName, this.y);
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
              color:
                dataChartColours[index % dataChartColours.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      default:
        break;
    }
    setchartDatastore(chartData);
  }, [data, defaultColors, legends, topology]);

  return (
    <div>
      <div style={{ width: { width }, height: { height } }}>
        {DataNotFount?.status === 204 ? (
          <div className="report_header_container">
            <div className="report-name-show">{DataNotFount?.Report_name}</div>
            <div className="data-check-message">{DataNotFount?.message}</div>
          </div>
        ) : (
          <div id={key}>
            {TableData && (
              <DashboardReport
                height={height}
                width={width}
                style={{ height: { height }, width: { width } }}
                TableData={TableData}
              />
            )}

            {chartDatastore && (
              <HighchartsReact
                highcharts={Highcharts}
                options={chartDatastore}
                containerProps={{ id: key, style: { height: height } }}
              />
            )}
            {Boxdata && (
              <BoxPreview
                Boxdata={Boxdata}
                height={height}
                width={width}
                style={{ height: { height }, width: { width } }}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HighCharts;
