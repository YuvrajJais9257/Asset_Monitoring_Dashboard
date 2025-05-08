//modified by Yuvraj Jaiswal
//changed stackbar and stackcolumn configuration
//changed configuration for all charts, removed mapping logic here as it is not required
import React, { useEffect, useMemo, useState } from "react";
import HighChartsColors from "../PreviewHighchart/HIghChartsColors";
import Header from "../header";
import { useDispatch, useSelector } from "react-redux";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import highchartsExporting from "highcharts/modules/exporting";
import HighchartsMore from "highcharts/highcharts-more";
import highchartsOfflineExporting from "highcharts/modules/offline-exporting";
import Highcharts3D from "highcharts/highcharts-3d";
import HighchartsMap from "highcharts/modules/map";
import SolidGauge from "highcharts/modules/solid-gauge";
import { generateChartTypeReport } from "../../actions/reportmanagement";
import {Box , CircularProgress} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "./../globalCSS/Button/Button";
import HighchartsBoost from "highcharts/modules/boost";
import { decryptData } from "../utils/EncriptionStore";
import './../globalCSS/reportmanagement/ShowChartReport.css';

 
HighchartsBoost(Highcharts);
Highcharts3D(Highcharts);
HighchartsMap(Highcharts);
HighchartsMore(Highcharts);
highchartsExporting(Highcharts);
highchartsOfflineExporting(Highcharts);
SolidGauge(Highcharts);

const ShowChartReport = () => {
  const containerId = "highcharts-container";
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const safeParseJSON = (jsonString) => {
    try {
      if (!jsonString) return {};
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Invalid JSON:", error);
      return null;
    }
  };
  const userdetail = () => {
    const encryptedValue = localStorage.getItem("profile");
    if (encryptedValue) {
      return decryptData(encryptedValue); // Ensure decryptData is implemented securely
    }
    return null;
  };
  const [loading, setLoading] = useState(false); 
  
  const user = useMemo(() => userdetail(), []);

  const queryParameters = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );

  const report_id = queryParameters.get("report_id");

  const apiData = useSelector((state) => state);

  //to generateChartTypeReport
  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true); // Show loader
      await dispatch(
        generateChartTypeReport({
          report_id,
          email: user.user_email_id,
          database_type: user.database_type,
        })
      );
      setLoading(false); // Hide loader after API call
    };

    fetchReport();
  }, [report_id, user.user_email_id, dispatch]);

  //to get the data from the api
  const generatereportdetail =
    apiData?.reportmanagement?.getcharttypeofreportdetail;

  const [chart_type, setChartType] = useState();

  useEffect(() => {
    setChartType(generatereportdetail?.chart_type?.toLowerCase());
  }, [generatereportdetail]);

  const [columnCount, setcolumnCount] = useState();
  const [parsedColors, setParsedColors] = useState([]);

  //to set columnCount
  useMemo(() => {
    if (
      generatereportdetail?.len_col &&
      (generatereportdetail?.chart_type === "bar" ||
        generatereportdetail?.chart_type === "column" ||
        generatereportdetail?.chart_type === "stackbar" ||
        generatereportdetail?.chart_type === "drillcolumn" ||
        generatereportdetail?.chart_type === "stackcolumn")
    ) {
      setcolumnCount(generatereportdetail?.len_col);
    }
  }, [generatereportdetail]);

  const [legends, setLegends] = useState([]);
  const [defaultColors, setDefaultColors] = useState([]);

    useEffect(() => {
      if (!generatereportdetail) return;

      if (typeof generatereportdetail.chart_colours === "object") {
        // If it's already a JSON object
        setParsedColors(generatereportdetail.chart_colours);
      } else {
        // If it's a JSON string
        setParsedColors(safeParseJSON(generatereportdetail.chart_colours));
      }
  
      const newLegends = [];
  
      if (generatereportdetail && generatereportdetail?.chart_type) {
        if (
          generatereportdetail?.chart_type === "3dpie" ||
          generatereportdetail?.chart_type === "3d donut" ||
          generatereportdetail?.chart_type === "pie" ||
          generatereportdetail?.chart_type === "donut" ||
          generatereportdetail?.chart_type === "drillcolumn" ||
          (generatereportdetail?.chart_type === "bar" && columnCount <= 2) ||
          (generatereportdetail?.chart_type === "column" && columnCount <= 2) ||
          (generatereportdetail?.chart_type === "stackbar" && columnCount <= 2) ||
          (generatereportdetail?.chart_type === "stackcolumn" && columnCount <= 2)
        ) {
          if (generatereportdetail?.xAxis && Array.isArray(generatereportdetail.xAxis)) {
            generatereportdetail.xAxis.forEach((item) => {
              item?.categories?.forEach((category) => {
                   const nameAsString = String(category)
                if (!newLegends.includes(nameAsString)) {
                  newLegends.push(nameAsString);
                }
              });
            });
          }
        } else {
          if (generatereportdetail?.series && Array.isArray(generatereportdetail.series)) {
            generatereportdetail.series.forEach((seriesItem) => {
               const nameAsString = String(seriesItem.name)
              if (!newLegends.includes(nameAsString)) {
                newLegends.push(nameAsString);
              }
            });
          }
        }
      }

      const parsedColorsval = generatereportdetail?.chart_colours
      ? typeof generatereportdetail?.chart_colours === "object"
        ? generatereportdetail?.chart_colours
        : safeParseJSON(generatereportdetail?.chart_colours)
      : {};

      if (Array.isArray(newLegends) && newLegends.length > 0) {
        if (parsedColorsval) {
          const validLegends=newLegends.filter((key) => parsedColorsval[key] !== undefined);

          const getRandomColors = (colors, count) => {
            let shuffledColors = [...colors].sort(() => 0.5 - Math.random());
            return shuffledColors.slice(0, count);
          };
      
          //to set defaultColors
          let defaultColorsForJson =
            Array.isArray(validLegends) && validLegends?.length > 0
              ? getRandomColors(Object.values(HighChartsColors), validLegends.length)
              : [];
      
          setDefaultColors(defaultColorsForJson);
          setLegends(validLegends);
        }

      }

    }, [columnCount, generatereportdetail]);


  //to pick random colors from HighChartsColors and set defaultColors

  const [chartColoursFromJson, setChartColoursFromJson] = useState(defaultColors);


  useEffect(() => {
    if (parsedColors && legends.length > 0) {
      // Map valid legends to their corresponding colors
      const colorsInOrder = legends.map((legend) => parsedColors[legend]);
      setChartColoursFromJson(colorsInOrder);
    } else {
      // Reset chart colors if legends are empty
      setChartColoursFromJson([]);
    }
  }, [legends, parsedColors]);


  const [topology, setTopology] = useState(null);

  useEffect(() => {
    if (generatereportdetail?.chart_type === "geomap") {
      const fetchTopology = async () => {
        const response = await fetch(
          "https://code.highcharts.com/mapdata/countries/in/custom/in-all-disputed.topo.json"
        );
        const topologyData = await response.json();
        setTopology(topologyData);
      };
      fetchTopology();
    }
  }, []);

  const chartOptions = useMemo(() => {
    if (!generatereportdetail) return {};

    let options = {};
    switch (chart_type) {
      case "line":
        options = {
          chart: { type: "line" },
          title: { text: generatereportdetail?.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          credits: { enabled: false },
          xAxis: {
            categories: generatereportdetail?.xAxis[0]?.categories || [],
          },
          yAxis: [
            { title: { text: null } },
            { opposite: true, title: { text: null } },
          ],
          plotOptions: {
            line: {
              marker: {
                enabled: false,
                symbol: "circle",
                radius: 2,
                states: {
                  hover: { enabled: true }, // Highlight markers on hover
                },
              },
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
          series: generatereportdetail?.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
                defaultColors[index % defaultColors.length], // Correct color mapping
            })),
        };
        break;
      case "area":
        options = {
          chart: { type: "area" },
          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          yAxis: [
            { title: { text: null } },
            { opposite: true, title: { text: null } },
          ],
          xAxis: { categories: generatereportdetail.xAxis[0].categories },
          plotOptions: {
            area: {
              marker: {
                enabled: true,
                states: { hover: { enabled: true } },
              },
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
          series: generatereportdetail?.series
            .filter((series, index) => {
              // Exclude series where all data points are strings (e.g., labels)
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
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
                defaultColors[index % defaultColors.length], // Assign colors cyclically
            })),
        };
        break;
      case "bar":
        if (columnCount > 2) {
          options = {
            chart: { type: "bar" },
            title: { text: generatereportdetail?.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            plotOptions: {
              bar: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            xAxis: {
              categories: generatereportdetail?.xAxis[0]?.categories || [],
            },
            credits: { enabled: false },
            series: generatereportdetail?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series, index) => ({
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
          options = {
            chart: { type: "bar" },
            title: { text: generatereportdetail?.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: {
              categories: generatereportdetail?.xAxis[0]?.categories || [],
            },
            plotOptions: {
              bar: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            series: generatereportdetail?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series) => {
                const categoryColors =
                  generatereportdetail?.xAxis[0]?.categories.map((category) => {
                    // Match the legend to its color in order
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0]; // Fallback to the first color
                  });

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                        ? true
                        : false, // Enable data labels
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
                      defaultColors[pointIndex % defaultColors.length], // Match the category's color
                  })),
                };
              }),
          };
        }
        break;
      case "column":
        if (columnCount > 2) {
          options = {
            chart: { type: "column" },
            title: { text: generatereportdetail.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: {
              categories: generatereportdetail?.xAxis[0]?.categories || [],
            },
            credits: { enabled: false },
            plotOptions: {
              series: {
                colorByPoint: false, // Ensure color is applied per series
              },
              column: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            series: generatereportdetail?.series
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
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
          options = {
            chart: { type: "column" },
            title: { text: generatereportdetail.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: {
              categories: generatereportdetail?.xAxis[0]?.categories || [],
            },
            plotOptions: {
              column: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            series: generatereportdetail?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series) => {
                // Map colors to categories
                const categoryColors =
                  generatereportdetail?.xAxis[0]?.categories.map((category) => {
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0]; // Fallback to the first color
                  });

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
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
                      defaultColors[pointIndex % defaultColors.length], // Assign correct category color
                  })),
                };
              }),
          };
        }
        break;
      case "3dpie":
        options = {
          chart: {
            type: "pie",
            options3d: { enabled: true, alpha: 45, beta: 0 }, // 3D options for the pie chart
          },
          title: { text: generatereportdetail?.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          accessibility: { point: { valueSuffix: "%" } }, // Adding percentage to the values for accessibility
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>", // Tooltip formatting to show percentage
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              allowPointSelect: true, // Allows clicking on pie slices
              cursor: "pointer", // Cursor style when hovering over slices
              colors:
                chartColoursFromJson?.map((color, index) => color) ||
                defaultColors, // Dynamically map colors from `chart_colours`
              depth: 35, // Sets the depth for the 3D effect
              dataLabels: {
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
                enabled:
                  generatereportdetail?.enable_labels.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}", // Format for data labels
              },
              showInLegend: true, // Display the pie chart legend
            },
          },
          series: [
            {
              boostThreshold: 1000, // Performance improvement for large datasets
              name: generatereportdetail?.series[0]?.name || "Series", // Fallback name in case of undefined
              colorByPoint: true, // Each point gets a distinct color
              data: generatereportdetail?.series[0]?.data.map(
                (name, index) => ({
                  name: name, // Category name
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  y: generatereportdetail?.series[1]?.data[index] || 0, // Value of the point, fallback to 0 if missing
                })
              ),
            },
          ],
        };
        break;
      case "3d donut":
        options = {
          chart: { type: "pie", options3d: { enabled: true, alpha: 45 } },
          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: 100,
              depth: 45,
              colors: chartColoursFromJson || defaultColors,
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}: {point.y}",
                color: "black",
                style: {
                  textOutline: "none", // Disables the white shadow/outline
                },
              },
              showInLegend: true,
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: generatereportdetail?.series[0]?.name,
              colorByPoint: true,
              data: generatereportdetail?.series[0]?.data.map(
                (name, index) => ({
                  name,
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  y: generatereportdetail?.series[1]?.data[index],
                  color:
                    chartColoursFromJson[index % chartColoursFromJson.length] ||
                    defaultColors[index % defaultColors.length],
                })
              ),
            },
          ],
        };
        break;
      case "donut":
        const total = generatereportdetail?.series[1]?.data.reduce(
          (sum, value) => sum + value,
          0
        );

        options = {
          chart: {
            type: "pie",
            events: {
              render: function () {
                // Calculate the exact center of the chart dynamically
                const centerX = this.plotLeft + this.plotWidth / 2;
                const centerY = this.plotTop + this.plotHeight / 2;

                // Add or update the custom label
                if (!this.customLabel) {
                  this.customLabel = this.renderer
                    .text(`Total<br><b>${total}</b>`, centerX, centerY)
                    .css({
                      color: "#000",
                      fontSize: "16px",
                      textAlign: "center",
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
                  });
                }
              },
            },
          },
          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: "70%",
              depth: 45,
              colors: chartColoursFromJson || defaultColors,
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}: {point.y}",
                color: "black",
                style: {
                  textOutline: "none", // Disables the white shadow/outline
                },
              },
              showInLegend: true,
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: generatereportdetail?.series[0]?.name,
              colorByPoint: true,
              data: generatereportdetail?.series[0]?.data.map(
                (name, index) => ({
                  name,
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  y: generatereportdetail?.series[1]?.data[index],
                  color:
                    chartColoursFromJson[index % chartColoursFromJson.length] ||
                    defaultColors[index % defaultColors.length],
                })
              ),
            },
          ],
        };
        break;
      case "geomap":
        if (!topology) return {};
        options = {
          chart: { map: topology },
          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
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
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
          colorAxis: {
            min: 0,
            stops: Object.values(HighChartsColors)
              .slice(0, 5)
              .map((color, index) => [index / 4, color]),
          },
          series: [
            {
              boostThreshold: 1000,
              name: generatereportdetail?.series[0]?.name,
              
              data: generatereportdetail?.series[0]?.data.map(
                (name, index) => ({
                  name,
                  value: generatereportdetail?.series[1]?.data[index],
                  color:
                    chartColoursFromJson[index % chartColoursFromJson.length] ||
                    defaultColors[index % defaultColors.length],
                })
              ),
              states: { hover: { color: "#2BD925" } },
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false,
                format: "{point.name}",
              },
            },
          ],
        };
        break;
      case "pie":
        options = {
          chart: { type: "pie" },
          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          yAxis: [
            { title: { text: "Values" } },
            { opposite: true, title: { text: "Time" } },
          ],
          tooltip: {
            valueSuffix: "%",
          },
          plotOptions: {
            series: {
              allowPointSelect: true,
              cursor: "pointer",
              colors: chartColoursFromJson || defaultColors,
              showInLegend: true,
              dataLabels: [
                {
                  enabled: true,
                  distance: 20,
                },
                {
                  enabled: true,
                  distance: -40,
                  format: "{point.percentage:.1f}%",
                  style: {
                    fontSize: "1.2em",
                    textOutline: "none",
                    opacity: 0.7,
                  },
                  filter: {
                    operator: ">",
                    property: "percentage",
                    value: 10,
                  },
                },
              ],
            },
          },
          credits: { enabled: false },
          series: [
            {
              boostThreshold: 1000,
              name: generatereportdetail?.series[0]?.name,
              colorByPoint: true,
              data: generatereportdetail?.series[0]?.data.map(
                (name, index) => ({
                  name,
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                  y: generatereportdetail?.series[1]?.data[index],
                })
              ),
            },
          ],
        };

        break;
      case "stackarea":
        options = {
          chart: { type: "area" },
          title: { text: generatereportdetail?.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          yAxis: [
            { title: { text: "Values" } },
            { opposite: true, title: { text: "Time" } },
          ],
          xAxis: { categories: generatereportdetail.xAxis[0].categories },
          plotOptions: {
            area: {
              stacking: "normal",
              lineColor: "#666666",
              lineWidth: 1,
              marker: {
                lineWidth: 1,
                lineColor: "#666666",
              },
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
          series: generatereportdetail?.series
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
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
        if (columnCount > 2) {
          options = {
            chart: { type: "bar" },
            title: { text: generatereportdetail.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: "Values" } },
              { opposite: true, title: { text: "Time" } },
            ],

            plotOptions: {
              series: {
                stacking: "normal",
              },
              bar: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            xAxis: { categories: generatereportdetail?.xAxis[0].categories },
            credits: { enabled: false },
            series: generatereportdetail?.series
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
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
                  defaultColors[index % defaultColors.length], // Ensure order of colors is preserved
              })),
          };
        } else if (columnCount <= 2) {
          options = {
            chart: { type: "bar" },
            title: { text: generatereportdetail.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: "Values" } },
              { opposite: true, title: { text: "Time" } },
            ],

            plotOptions: {
              series: {
                stacking: "normal",
              },
              bar: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            xAxis: { categories: generatereportdetail?.xAxis[0].categories },
            credits: { enabled: false },
            series: generatereportdetail?.series.filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            }).map((series) => {
              // Assign category colors based on their respective legends
              const categoryColors =
                generatereportdetail?.xAxis[0]?.categories.map((category) => {
                  const colorIndex = legends.indexOf(category);
                  return colorIndex >= 0
                    ? chartColoursFromJson[colorIndex]
                    : chartColoursFromJson[0]; // Fallback to the first color
                });

              return {
                boostThreshold: 1000,
                name: series.name,
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() ===
                    "yes"
                      ? true
                      : false, // Enable data labels
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
        if (columnCount > 2) {
          options = {
            chart: { type: "column" },
            title: { text: generatereportdetail.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: "Values" } },
              { opposite: true, title: { text: "Time" } },
            ],
            xAxis: { categories: generatereportdetail?.xAxis[0].categories },
            plotOptions: {
              series: {
                stacking: "normal",
              },
              column: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            series: generatereportdetail?.series.filter((series, index) => {
              if (index === 0) {
                return !series.data.every((item) => typeof item === "string");
              }
              return true;
            }).map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
                defaultColors[index % defaultColors],
            })),
          };
        } else if (columnCount <= 2) {
          options = {
            chart: { type: "column" },
            title: { text: generatereportdetail.title || "" },
            subtitle: { text: generatereportdetail?.chart_subtitle || "" },
            yAxis: [
              { title: { text: "Values" } },
              { opposite: true, title: { text: "Time" } },
            ],
            xAxis: { categories: generatereportdetail?.xAxis[0].categories },
            plotOptions: {
              series: {
                stacking: "normal",
              },
              column: {
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false, // Enable data labels
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
            series: generatereportdetail?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data.every((item) => typeof item === "string");
                }
                return true;
              })
              .map((series) => {
                const categoryColors =
                  generatereportdetail?.xAxis[0]?.categories.map((category) => {
                    const colorIndex = legends.indexOf(category);
                    return colorIndex >= 0
                      ? chartColoursFromJson[colorIndex]
                      : chartColoursFromJson[0]; // Fallback to first color
                  });

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
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
        options = {
          chart: {
            type: "gauge",
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false,
            height: "30%",
          },

          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
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
                to: 30,
                thickness: 20,
                borderRadius: "50%",
              },
              {
                from: 31,
                to: 50,
                thickness: 20,
                borderRadius: "50%",
              },
              {
                from: 51,
                to: 200,
                thickness: 20,
              },
            ],
          },

          series: [
            {
              boostThreshold: 1000,
              name: generatereportdetail.series[0].name,
              data: generatereportdetail?.series[0].data,
              dataLabels: {
                borderWidth: 0,
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false,
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              dial: {
                radius: "80%",
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                radius: 6,
              },
            },
          ],
        };
        break;
      case "gauge":
        options = {
          chart: {
            type: "solidgauge",
            plotBackgroundColor: null,
            plotBackgroundImage: null,
            plotBorderWidth: 0,
            plotShadow: false,
          },

          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          pane: {
            center: ["50%", "85%"],
            size: "100%",
            startAngle: -90,
            endAngle: 90,
            background: {
              innerRadius: "60%",
              outerRadius: "100%",
              shape: "arc",
            },
          },
          plotOptions: {
            gauge: {
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false,
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
                formatter: function () {
                  return this.y; // Display the y-value
                },
              },
            },
          },
          credits: { enabled: false },
          yAxis: {
            min: 0,
            max: 10000,
            tickPixelInterval: 72,
            tickPosition: "inside",

            tickLength: 20,
            tickWidth: 2,
            minorTickInterval: null,
            labels: {
              distance: 20,
              style: {
                fontSize: "14px",
              },
            },

            plotBands: [
              {
                from: 0,
                to: 120,
                thickness: 40,
              },
              {
                from: 120,
                to: 160,
                thickness: 40,
              },
              {
                from: 160,
                to: 200,
                thickness: 40,
              },
            ],
          },

          exporting: {
            enabled: false,
          },

          series: [
            {
              boostThreshold: 1000,
              name: generatereportdetail.series[0].name,
              data: generatereportdetail?.series[0].data,
                dataLabels: {
                  enabled:
                    generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                      ? true
                      : false,
                  style: {
                    fontSize: "0.9rem",
                    fontWeight: "700",
                    color: "#333", // Customize label color
                  },
                  formatter: function () {
                    return this.y; // Display the y-value
                  },
                  borderWidth: 0,
                },
              dial: {
                radius: "80%",
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                radius: 6,
              },
            },
          ],
        };

        break;
      case "radialbar":
        options = {
          chart: {
            type: "column",
            polar: true,
            inverted: true,
          },
          title: {
            text: generatereportdetail.title || "",
          },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
          pane: {
            size: "85%",
            innerSize: "40%",
            startAngle: 0,
            endAngle: 270,
          },
          yAxis: [
            {
              lineWidth: 0,
              tickInterval: 25,
              reversedStacks: false,
              endOnTick: true,
              showLastLabel: true,
              gridLineWidth: 0,
              title: { text: "Values" },
            },
            {
              opposite: true,
              title: { text: "Time" },
            },
          ],
          xAxis: {
            tickInterval: 1,
            labels: {
              align: "right",
              useHTML: true,
              allowOverlap: true,
              step: 1,
              y: 3,
              style: { fontSize: "13px" },
            },
            lineWidth: 0,
            gridLineWidth: 0,
            categories: generatereportdetail?.xAxis[0].categories.map(
              (category, index) =>
                `${category} <span class="f16"><span id="flag" class="flag ${index}"></span></span>`
            ),
          },
          plotOptions: {
            column: {
              stacking: "normal",
              borderWidth: 0,
              pointPadding: 0,
              groupPadding: 0.15,
              borderRadius: "50%",
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
            series: {
              stacking: "normal",
            },
          },
          credits: { enabled: false },
          series: generatereportdetail?.series
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
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
                defaultColors[index % defaultColors],
            })),
        };
        break;
      case "3darea":
        options = {
          chart: {
            type: "area",
            options3d: { enabled: true, alpha: 15, beta: 30, depth: 200 },
          },
          title: { text: generatereportdetail.title || "" },
          subtitle: { text: generatereportdetail?.chart_subtitle || "" },
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
          xAxis: { categories: generatereportdetail?.xAxis[0].categories },
          plotOptions: {
            area: {
              depth: 100,
              marker: { enabled: false },
              dataLabels: {
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
                formatter: function () {
                  return this.y; // Display the y-value
                },
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              states: { inactive: { enabled: false } },
            },
          },
          credits: { enabled: false },
          series: generatereportdetail?.series
            .filter((series, index) => {
              // Filter out series with only string data points
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
                enabled:
                  generatereportdetail?.enable_labels?.toLowerCase() === "yes"
                    ? true
                    : false, // Enable data labels
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
                defaultColors[index % defaultColors],
            })),
        };
        break;
      case "drillcolumn":
          options = {
           chart: {type: 'column'},
           title: {align: 'center',text: generatereportdetail.title || ""},
           subtitle: { text: generatereportdetail?.chart_subtitle || "" },
           accessibility: {announceNewData: {enabled: true}},
           xAxis: {type: 'category'},
           yAxis: {title: {text: null}},
           legend: {enabled: false},
           credits: { enabled: false },
           plotOptions: {series: {borderWidth: 0,cursor: "pointer",colors: chartColoursFromJson || defaultColors,dataLabels: {enabled: true,format: '{point.y:.1f}'}},},
           tooltip: {
             headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
             pointFormat: '<span style="color:{point.color}">{point.name}</span>: ' +
                 '<b>{point.y:.2f}</b> of total<br/>'
             },
             series: [
               {
                 boostThreshold: 1000,
                 name: generatereportdetail?.series[0]?.name,
                 colorByPoint: true,
                 data: generatereportdetail?.series[0]?.data.map((name, index) => ({
                   name,
                   dataLabels: {
                    enabled:
                      generatereportdetail?.enable_labels?.toLowerCase() ===
                      "yes"
                        ? true
                        : false, // Enable data labels
                    formatter: function () {
                      return this.y; // Display the y-value
                    },
                    style: {
                      fontSize: "0.9rem",
                      fontWeight: "700",
                      color: "#333", // Customize label color
                    },
                  },
                   y: generatereportdetail?.series[1]?.data[index],
                 })),
               },
             ],
          }
         break;
      default:
        break;
    }
    return options;
  }, [generatereportdetail, topology, chartColoursFromJson]);

  const isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;
  return (
    <div>
      <div className="side-nav">
        <Header />
      </div>
      <div className="showtablereportgenerator" style={{ margin: "20px" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <CircularProgress />
          </Box>
        ) : isEmptyObject(generatereportdetail) ? (
          <Box sx={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#4e5ff5", padding: "20px" }}>
            No data found for this report
          </Box>
        ) : (
          <HighchartsReact highcharts={Highcharts} options={chartOptions} containerProps={{ id: containerId }} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "row", justifyContent: "center" }}>
        <Button type="button" style={{ marginRight: "3px" }} onClick={() => navigate(-1)}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default ShowChartReport;
