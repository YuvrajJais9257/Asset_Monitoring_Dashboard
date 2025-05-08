//modified By Yuvraj Jaiswal
//modified stackbar and stackcolumn configuration
import React, { useEffect, useMemo, useState } from "react";
import HighChartsColors from "./HIghChartsColors";
import { useDispatch, useSelector } from "react-redux";
import { customPreviewChartData } from "../../actions/auth";
import Highcharts, { chart } from "highcharts";
import HighchartsReact from "highcharts-react-official";
import highchartsExporting from "highcharts/modules/exporting";
import HighchartsMore from "highcharts/highcharts-more";
import highchartsOfflineExporting from "highcharts/modules/offline-exporting";
import Highcharts3D from "highcharts/highcharts-3d";
import HighchartsMap from "highcharts/modules/map";
import SolidGauge from "highcharts/modules/solid-gauge";
import { Offcanvas } from "react-bootstrap";
// import drawOnChart from "./../../assets/images/drawOnChart.png";
import paintbrush from "../aserts/images/brush.png";
import HighchartsBoost from "highcharts/modules/boost";
import { decryptData } from "../utils/EncriptionStore";
import { Box, CircularProgress } from "@mui/material";
import "../globalCSS/previewhighcharts/previewhighcharts.css";

HighchartsBoost(Highcharts);
Highcharts3D(Highcharts);
HighchartsMap(Highcharts);
HighchartsMore(Highcharts);
highchartsExporting(Highcharts);
highchartsOfflineExporting(Highcharts);
SolidGauge(Highcharts);

const PreviewHighchart = ({
  customizationOptionsPreview,
  setCustomizationOptionsPreview,
  dragMe,
  setDragMe,
}) => {
  const containerId = "highcharts-container";
  const dispatch = useDispatch();

  const user = (() => {
    const encryptedData = localStorage.getItem("profile");
    return encryptedData ? decryptData(encryptedData) : null;
  })();

  const [topology, setTopology] = useState(null);
  const [legends, setLegends] = useState([]);
  const [legendsFromApi, setLegendsFromApi] = useState([]);
  const [totalLegends, setTotalLegends] = useState([]);

  const apiData = useSelector((state) => state?.auth);

  const [columnCount, setcolumnCount] = useState(0);
  const [defaultColors, setDefaultColors] = useState([]);
  const [loading, setLoading] = useState(false);

  const CustomeDetailOfReport = JSON.parse(
    localStorage.getItem("customeDetailOfReport")
  );
  const [isTyping, setIsTyping] = useState(false);

  const PreviewchartData = apiData?.custom_preview_chart;

  const [buttonPosition, setButtonPosition] = useState({
    top: "10%",
    left: "auto",
  });
  /*new change */
  useEffect(() => {
    const updateButtonPosition = () => {
      const exportingGroup = document.querySelector(".highcharts-exporting-group");

      if (exportingGroup) {
        const rect = exportingGroup.getBoundingClientRect();
        let leftPos = rect.left - 40;

        // Ensure the button doesn't go off-screen
        if (leftPos < 0) leftPos = 10;
        if (leftPos > window.innerWidth - 50) leftPos = window.innerWidth - 50;

        setButtonPosition({
          top: `${rect.bottom + 10 - 40}px`,
          left: `${leftPos}px`,
        });
      }
    };

    updateButtonPosition(); // Call on mount
    window.addEventListener("resize", updateButtonPosition);

    return () => window.removeEventListener("resize", updateButtonPosition);
  }, []);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true); // Show loader
      await dispatch(
        customPreviewChartData({
          report_name: CustomeDetailOfReport?.title,
          report_type: CustomeDetailOfReport?.type,
          chart_type: CustomeDetailOfReport?.chart_type,
          query: CustomeDetailOfReport?.query,
          email: user.user_email_id,
          database_type: user.database_type,
          connection_type: CustomeDetailOfReport?.connection_type,
          schema: CustomeDetailOfReport?.schema,
        })
      );
      setLoading(false); // Hide loader after API call
    };

    fetchReport();
  }, []);

  //to set legends from data already stored in database
  useMemo(() => {
    if (CustomeDetailOfReport?.chart_colours) {
      let apiLegends = Object.keys(CustomeDetailOfReport.chart_colours);
      setLegendsFromApi(apiLegends);
    }
  }, []);

  //to set Column count based on query data
  useMemo(() => {
    if (
      PreviewchartData?.len_col &&
      (CustomeDetailOfReport?.chart_type === "bar" ||
        CustomeDetailOfReport?.chart_type === "column" ||
        CustomeDetailOfReport?.chart_type === "stackbar" ||
        CustomeDetailOfReport?.chart_type === "stackcolumn")
    ) {
      setcolumnCount(PreviewchartData?.len_col);
    }
  }, [PreviewchartData]);

  //to set legends based on columns length returned by query
  useMemo(() => {
    setLegends([]);
    if (
      CustomeDetailOfReport?.chart_type === "3Dpie" ||
      CustomeDetailOfReport?.chart_type === "3D Donut" ||
      CustomeDetailOfReport?.chart_type === "pie" ||
      CustomeDetailOfReport?.chart_type === "donut" ||
      CustomeDetailOfReport?.chart_type === "drillcolumn" ||
      (CustomeDetailOfReport?.chart_type === "bar" && columnCount <= 2) ||
      (CustomeDetailOfReport?.chart_type === "column" && columnCount <= 2) ||
      (CustomeDetailOfReport?.chart_type === "stackbar" && columnCount <= 2) ||
      (CustomeDetailOfReport?.chart_type === "stackcolumn" && columnCount <= 2)
    ) {
      if (
        PreviewchartData?.xAxis &&
        Array.isArray(PreviewchartData?.xAxis) &&
        PreviewchartData?.xAxis.length > 0
      ) {
        PreviewchartData?.xAxis.forEach((item) => {
          // Iterate through categories and add to legends
          item?.categories?.forEach((category) => {
            setLegends((prevLegends) => {
              const nameAsString = String(category);
              // Only add category if it's not already in legends
              if (!prevLegends.includes(nameAsString)) {
                return [...prevLegends, nameAsString];
              }
              return prevLegends;
            });
          });
        });
      }
    } else {
      if (PreviewchartData?.series && Array.isArray(PreviewchartData?.series)) {
        PreviewchartData?.series
          .filter((series, index) => {
            if (index === 0) {
              return !series.data?.every((item) => typeof item === "string");
            }
            return true;
          })
          .forEach((seriesItem) => {
            setLegends((prevLegends) => {
              const nameAsString = String(seriesItem.name);
              if (!prevLegends.includes(nameAsString)) {
                return [...prevLegends, nameAsString];
              }

              return prevLegends;
            });
          });
      }
    }
  }, [PreviewchartData, columnCount]);

  useMemo(() => {
    const allLegends = Array.from(new Set([...legends, ...legendsFromApi]));
    setTotalLegends(allLegends);
  }, [legends, legendsFromApi]);

  //to set default colors for legends
  useEffect(() => {
    //to get random colors from HighChartsColors.js
    const getRandomColors = (colors, count) => {
      let shuffledColors = [...colors].sort(() => 0.5 - Math.random());
      return shuffledColors.slice(0, count);
    };

    //to set default colors for legends
    let defaultColorsForJson =
      Array.isArray(totalLegends) && totalLegends?.length > 0
        ? getRandomColors(Object.values(HighChartsColors), totalLegends.length)
        : [];

    setDefaultColors(defaultColorsForJson);
  }, [totalLegends]);

  const [chartColoursFromJson, setChartColoursFromJson] =
    useState(defaultColors);

  //to load report data based on report name

  useEffect(() => {
    if (CustomeDetailOfReport?.chart_type === "geomap") {
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

  //to extract base legend key before bracket
  const getBaseLegendKey = (legend) => {
    const index = legend?.toString().indexOf("(");
    return index !== -1 ? legend.substring(0, index).trim() : legend;
  };

  //to map colors to each legend
  useMemo(() => {
    //function to map colors to legends
    const mapColorsToLegends = (chart_colours) => {
      const colorMapping = {};
      const baseColorMapping = {};

      //to set color for each legend
      totalLegends?.forEach((key) => {
        //obtain base key for each legend
        const baseKey = getBaseLegendKey(key);

        //if legend present as key in chart_colours object
        if (chart_colours[key]) {
          colorMapping[key] = chart_colours[key];
        }

        //if a legend with  similar base key is not present in chart_colours object
        if (!baseColorMapping[baseKey]) {
          baseColorMapping[baseKey] = chart_colours[key];
        }
      });

      return totalLegends.map((legend, index) => {
        //if exact legend is present in chart_colours object
        if (colorMapping[legend]) {
          return colorMapping[legend];
        }
        //if one legend has similar base key as other legend
        const baseKey = getBaseLegendKey(legend);
        if (baseColorMapping[baseKey]) {
          return baseColorMapping[baseKey];
        }
        //if no legend is present in chart_colours object
        return defaultColors[index % defaultColors.length];
      });
    };

    if (customizationOptionsPreview?.chart_colours) {
      setChartColoursFromJson(
        mapColorsToLegends(customizationOptionsPreview?.chart_colours)
      );
    } else if (CustomeDetailOfReport?.chart_colours) {
      setChartColoursFromJson(
        mapColorsToLegends(CustomeDetailOfReport?.chart_colours)
      );
    }
  }, [customizationOptionsPreview?.chart_colours, defaultColors, totalLegends]);

  function mapLegendsToColors(legends, customColors, defaultColors) {
    const colorMapping = {};
    const prefixColorMap = {};

    // Iterate through each legend
    legends.forEach((legend) => {
      // Extract the prefix (assuming prefix is everything before an underscore)
      const prefix = legend.split("(")[0];

      // Check if there is a color defined in customColors for this legend
      if (customColors && customColors[legend]) {
        // Assign the defined color to this legend and its prefixes
        colorMapping[legend] = customColors[legend];
        prefixColorMap[prefix] = customColors[legend]; // Store the color for the prefix
      } else if (prefixColorMap[prefix]) {
        // If no specific color, use the prefix's color if it exists
        colorMapping[legend] = prefixColorMap[prefix];
      } else {
        // If no colors defined, assign a default color based on index
        const defaultColorIndex =
          Object.keys(colorMapping).length % defaultColors.length;
        colorMapping[legend] = defaultColors[defaultColorIndex];
      }
    });

    return colorMapping;
  }

  useEffect(() => {
    setCustomizationOptionsPreview({
      ...customizationOptionsPreview,
      chart_colours: mapLegendsToColors(
        totalLegends,
        CustomeDetailOfReport?.chart_colours,
        defaultColors
      ),
    });
  }, [totalLegends, defaultColors]);

  useEffect(() => {
    if (CustomeDetailOfReport?.chart_subtitle && !isTyping) {
      setCustomizationOptionsPreview({
        ...customizationOptionsPreview,
        chart_subtitle: CustomeDetailOfReport?.chart_subtitle,
      });
    }
  }, [isTyping]);

  useEffect(() => {
    if (CustomeDetailOfReport?.enable_labels) {
      setCustomizationOptionsPreview((prev) => ({
        ...prev,
        enable_labels: CustomeDetailOfReport.enable_labels,
      }));
    }
  }, []);

  const chartOptions = useMemo(() => {
    if (!CustomeDetailOfReport || !PreviewchartData || Object.keys(PreviewchartData).length === 0) return {};
    const { chart_type } = CustomeDetailOfReport;

    let options = {};
    switch (chart_type) {
      case "line":
        options = {
          chart: { type: "line" },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
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
                states: { hover: { enabled: true } },
              },
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
            },
          },
          xAxis: { categories: PreviewchartData?.xAxis[0].categories },
          credits: { enabled: false },
          series: PreviewchartData?.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data?.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "area":
        options = {
          chart: { type: "area" },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
          yAxis: [
            { title: { text: null } },
            { opposite: true, title: { text: null } },
          ],
          xAxis: { categories: PreviewchartData?.xAxis[0]?.categories },
          plotOptions: {
            area: {
              marker: {
                enabled: true,
                states: { hover: { enabled: true } },
              },
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
            },
          },
          credits: { enabled: false },
          series: PreviewchartData?.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data?.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "bar":
        if (columnCount > 2) {
          options = {
            chart: { type: "bar" },
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: PreviewchartData?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
            plotOptions: {
              bar: {
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              },
            },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          options = {
            chart: { type: "bar" },
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: PreviewchartData?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
            plotOptions: {
              bar: {
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              },
            },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => {
                const categoryColors =
                  PreviewchartData?.xAxis[0]?.categories.map(
                    (category, catIndex) =>
                      chartColoursFromJson[
                      catIndex % chartColoursFromJson.length
                      ]
                  );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    dataLabels: {
                      enabled:
                        customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
        if (columnCount > 2) {
          options = {
            chart: { type: "column" },
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: PreviewchartData?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
            plotOptions: {
              series: {
                colorByPoint: false,
              },
              column: {
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              },
            },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          options = {
            chart: { type: "column" },
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
            yAxis: [
              { title: { text: null } },
              { opposite: true, title: { text: null } },
            ],
            xAxis: { categories: PreviewchartData?.xAxis[0]?.categories || [] },
            credits: { enabled: false },
            plotOptions: {
              series: {
                colorByPoint: false,
              },
              column: {
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              },
            },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => {
                const categoryColors =
                  PreviewchartData?.xAxis[0]?.categories.map(
                    (category, catIndex) =>
                      chartColoursFromJson[
                      catIndex % chartColoursFromJson.length
                      ]
                  );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  dataLabels: {
                    enabled:
                      customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
      case "3Dpie":
        options = {
          chart: {
            type: "pie",
            options3d: { enabled: true, alpha: 45, beta: 0 },
          },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              allowPointSelect: true,
              cursor: "pointer",

              colors:
                chartColoursFromJson?.map((color, index) => color) ||
                defaultColors,
              depth: 35,
              dataLabels: {
                enabled:true, // Enable data labels
                format: "{point.name}",
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
              name: PreviewchartData?.series[0]?.name,
              colorByPoint: true,
              data: PreviewchartData?.series[0]?.data.map((name, index) => ({
                name,
                y: PreviewchartData?.series[1]?.data[index],
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              })),
            },
          ],
        };
        break;
      case "3D Donut":
        options = {
          chart: { type: "pie", options3d: { enabled: true, alpha: 45 } },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: 100,
              depth: 45,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
              colors: chartColoursFromJson || defaultColors,
            },
          },
          series: [
            {
              boostThreshold: 1000,
              name: PreviewchartData?.series[0]?.name,
              colorByPoint: true,
              data: PreviewchartData?.series[0]?.data.map((name, index) => ({
                name,
                y: PreviewchartData?.series[1]?.data[index],
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
            },
          ],
        };
        break;
      case "donut":
        const total = PreviewchartData?.series[1]?.data.reduce(
          (sum, value) => sum + value,
          0
        );

        options = {
          chart: {
            type: "pie",
            events: {
              render: function () {
                // Add the total at the center of the donut
                if (!this.customLabel) {
                  this.customLabel = this.renderer
                    .text(
                      `Total<br><b>${total}</b>`,
                      this.plotLeft + this.plotWidth / 2,
                      this.plotTop + this.plotHeight / 2
                    )
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
                    text: `Total<br><b>${total}</b>`,
                  });
                }
              },
            },
          },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
          accessibility: { point: { valueSuffix: "%" } },
          tooltip: {
            pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>",
          },
          credits: { enabled: false },
          plotOptions: {
            pie: {
              innerSize: "70%",
              colors: chartColoursFromJson || defaultColors,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}: {point.y}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
            showInLegend: true,
          },
          series: [
            {
              boostThreshold: 1000,
              name: PreviewchartData?.series[0]?.name,
              colorByPoint: true,
              data: PreviewchartData?.series[0]?.data.map((name, index) => ({
                name,
                y: PreviewchartData?.series[1]?.data[index],
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
            },
          ],
        };
        break;
      case "geomap":
        if (!topology) return {};
        options = {
          chart: { map: topology },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
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
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
                  textOutline: false,
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
              name: PreviewchartData?.series[0]?.name,
              data: PreviewchartData?.series[0]?.data.map((name, index) => ({
                name,
                value: PreviewchartData?.series[1]?.data[index],

                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
              states: { hover: { color: "#2BD925" } },
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                  textOutline: false,
                },
              },
            },
          ],
        };
        break;
      case "pie":
        options = {
          chart: { type: "pie" },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
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
              showInLegend: true,
              colors: chartColoursFromJson || defaultColors,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
                    ? true
                    : false, // Enable data labels
                format: "{point.name}",
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#333", // Customize label color
                },
              },
            },
          },
          credits: { enabled: false },
          series: [
            {
              boostThreshold: 1000,
              name: PreviewchartData?.series[0]?.name,
              colorByPoint: true,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              data: PreviewchartData?.series[0]?.data.map((name, index) => ({
                name,
                y: PreviewchartData?.series[1]?.data[index],
              })),
            },
          ],
        };

        break;
      case "stackarea":
        options = {
          chart: { type: "area" },
          title: { text: CustomeDetailOfReport?.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
          yAxis: [
            { title: { text: "Values" } },
            { opposite: true, title: { text: "Time" } },
          ],
          xAxis: { categories: PreviewchartData?.xAxis[0].categories },
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
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
          series: PreviewchartData?.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data?.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
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
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                      "yes"
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
            xAxis: { categories: PreviewchartData?.xAxis[0].categories },
            credits: { enabled: false },
            series: PreviewchartData?.series.map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              color: chartColoursFromJson[index % chartColoursFromJson.length],
            })),
          };
        } else if (columnCount <= 2) {
          options = {
            chart: { type: "bar" },
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
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
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                      "yes"
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
            xAxis: { categories: PreviewchartData?.xAxis[0].categories },
            credits: { enabled: false },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => {
                const categoryColors =
                  PreviewchartData?.xAxis[0]?.categories.map(
                    (category, catIndex) =>
                      chartColoursFromJson[
                      catIndex % chartColoursFromJson.length
                      ]
                  );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    color: categoryColors[pointIndex % categoryColors.length],
                    dataLabels: {
                      enabled:
                        customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                          "yes"
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
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
            yAxis: [
              { title: { text: "Values" } },
              { opposite: true, title: { text: "Time" } },
            ],
            xAxis: { categories: PreviewchartData?.xAxis[0].categories },
            plotOptions: {
              series: {
                stacking: "normal",
              },
              column: {
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              },
            },
            credits: { enabled: false },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => ({
                boostThreshold: 1000,
                name: series.name,
                data: series.data,
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
                color:
                  chartColoursFromJson[index % chartColoursFromJson.length] ||
                  defaultColors[index % defaultColors.length],
              })),
          };
        } else if (columnCount <= 2) {
          options = {
            chart: { type: "column" },
            title: { text: CustomeDetailOfReport.title || "" },
            subtitle: {
              text: customizationOptionsPreview?.chart_subtitle || "",
            },
            yAxis: [
              { title: { text: "Values" } },
              { opposite: true, title: { text: "Time" } },
            ],
            xAxis: { categories: PreviewchartData?.xAxis[0].categories },
            plotOptions: {
              series: {
                stacking: "normal",
              },
              column: {
                dataLabels: {
                  enabled:
                    customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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
              },
            },
            credits: { enabled: false },
            series: PreviewchartData?.series
              .filter((series, index) => {
                if (index === 0) {
                  return !series.data?.every(
                    (item) => typeof item === "string"
                  );
                }
                return true;
              })
              .map((series, index) => {
                const categoryColors =
                  PreviewchartData?.xAxis[0]?.categories.map(
                    (category, catIndex) =>
                      chartColoursFromJson[
                      catIndex % chartColoursFromJson.length
                      ]
                  );

                return {
                  boostThreshold: 1000,
                  name: series.name,
                  data: series.data.map((dataPoint, pointIndex) => ({
                    y: dataPoint,
                    dataLabels: {
                      enabled:
                        customizationOptionsPreview?.enable_labels?.toLowerCase() ===
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

          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },

          pane: {
            startAngle: -90,
            endAngle: 89.9,
            background: null,
            center: ["50%", "75%"],
            size: "110%",
          },
          plotOptions: {
            gauge: {
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              name: PreviewchartData?.series[0].name,
              data: PreviewchartData?.series[0].data,
              dataLabels: {
                borderWidth: 0,
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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

          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
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
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              name: PreviewchartData?.series[0].name,
              data: PreviewchartData?.series[0].data,
              color:
                HighChartsColors.gray ||
                Highcharts.defaultOptions.chart.backgroundColor,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
                    ? true
                    : false,
                borderWidth: 0,
                style: {
                  fontSize: "0.9rem",
                  fontWeight: "700",
                },
              },
              dial: {
                radius: "80%",

                backgroundColor: chartColoursFromJson[3],
                baseWidth: 12,
                baseLength: "0%",
                rearLength: "0%",
              },
              pivot: {
                backgroundColor: chartColoursFromJson[4],
                radius: 6,
              },
            },
          ],
        };

        break;
      case "radialBar":
        options = {
          chart: {
            type: "column",
            polar: true,
            inverted: true,
          },
          title: {
            text: CustomeDetailOfReport.title || "",
          },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
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
            categories: PreviewchartData?.xAxis[0].categories.map(
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
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
            series: {
              stacking: "normal",
            },
          },
          credits: { enabled: false },
          series: PreviewchartData?.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data?.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "3Darea":
        options = {
          chart: {
            type: "area",
            options3d: { enabled: true, alpha: 15, beta: 30, depth: 200 },
          },
          title: { text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
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
          xAxis: { categories: PreviewchartData?.xAxis[0].categories },
          plotOptions: {
            area: {
              depth: 100,
              marker: { enabled: false },
              states: { inactive: { enabled: false } },
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
          series: PreviewchartData?.series
            .filter((series, index) => {
              if (index === 0) {
                return !series.data?.every((item) => typeof item === "string");
              }
              return true;
            })
            .map((series, index) => ({
              boostThreshold: 1000,
              name: series.name,
              data: series.data,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              color:
                chartColoursFromJson[index % chartColoursFromJson.length] ||
                defaultColors[index % defaultColors.length],
            })),
        };
        break;
      case "drillcolumn":
        options = {
          chart: { type: "column" },
          title: { align: "center", text: CustomeDetailOfReport.title || "" },
          subtitle: { text: customizationOptionsPreview?.chart_subtitle || "" },
          accessibility: { announceNewData: { enabled: true } },
          xAxis: { type: "category" },
          yAxis: { title: { text: null } },
          legend: { enabled: false },
          credits: { enabled: false },
          //  plotOptions: {series: {borderWidth: 0,cursor: "pointer",colors: chartColoursFromJson || defaultColors,dataLabels: {enabled: true,format: '{point.y:.1f}'}},},
          plotOptions: {
            series: {
              borderWidth: 0,

              cursor: "pointer",

              colors: chartColoursFromJson || defaultColors,

              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
                    ? true
                    : false,

                format: "{point.y:.1f}",
              },
            },
          },
          tooltip: {
            headerFormat:
              '<span style="font-size:11px">{series.name}</span><br>',
            pointFormat:
              '<span style="color:{point.color}">{point.name}</span>: ' +
              "<b>{point.y:.2f}</b> of total<br/>",
          },
          series: [
            {
              boostThreshold: 1000,
              name: PreviewchartData?.series[0]?.name,
              colorByPoint: true,
              dataLabels: {
                enabled:
                  customizationOptionsPreview?.enable_labels?.toLowerCase() ===
                    "yes"
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
              data: PreviewchartData?.series[0]?.data.map((name, index) => ({
                name,
                y: PreviewchartData?.series[1]?.data[index],
              })),
            },
          ],
        };
        break;
      default:
        break;
    }
    return options;
  }, [
    PreviewchartData,
    topology,
    chartColoursFromJson,
    customizationOptionsPreview,
  ]);

  const handleColorChange = (legend, newColor) => {
    setCustomizationOptionsPreview((prevState) => {
      const updatedColors = { ...prevState.chart_colours };

      updatedColors[legend] = newColor;
      return {
        ...prevState,
        chart_colours: updatedColors,
      };
    });
  };

  const handleApplyLabel = (e) => {
    setCustomizationOptionsPreview({
      ...customizationOptionsPreview,
      enable_labels: e.target.value,
    });
  };

  const handleChartSubtitleChange = (e) => {
    setIsTyping(true);
    setCustomizationOptionsPreview({
      ...customizationOptionsPreview,
      chart_subtitle: e.target.value,
    });
  };

  const isEmptyObject = (obj) => !obj || Object.keys(obj).length === 0;

  return (
    <div className="superHighChartsDisplayView">
      <div className="previewChartpage highChartsDisplayView" id={containerId}>
      {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "300px" }}>
            <CircularProgress />
          </Box>
        ) : isEmptyObject(PreviewchartData) ? (
          <Box sx={{ textAlign: "center", fontSize: "18px", fontWeight: "bold", color: "#4e5ff5", padding: "20px" }}>
            No data found for this report
          </Box>
        ) : (
          <HighchartsReact
            highcharts={Highcharts}
            options={chartOptions}
            containerProps={{ id: containerId }}
          />
        )}
      </div>
      {CustomeDetailOfReport?.type?.toLowerCase() === "chart" && (
        <div
          className="draggable-toggle-button"
          onClick={() => setDragMe(!dragMe)}
          style={{
            position: "absolute",

            top: buttonPosition.top,

            left: buttonPosition.left,
          }}
        >
          <img
            src={paintbrush}
            alt="paintbrush"
            className="customize-chart-icon"
          />
        </div>
      )}
      <Offcanvas
        className="custom-color-super-container"
        show={dragMe}
        onHide={() => setDragMe(!dragMe)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Chart Color Configuration</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body style={{ minWidth: "300px" }}>
          <div className="add-chart-subtitle">
            <label className="chart-subtitle-label">Chart Subtitle</label>
            <input
              className="chart-subtitle-input form-control"
              type="text"
              maxLength={40}
              value={customizationOptionsPreview?.chart_subtitle}
              onChange={handleChartSubtitleChange}
            />
          </div>
          <div className="add-chart-label">
            <label className="chart-label">Apply label</label>
            <select
              className="form-control chart-label-select"
              value={customizationOptionsPreview?.enable_labels ?? ""}
              onChange={handleApplyLabel} // Pass the entire event
            >
              <option value="" disabled>
                Apply Label
              </option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>
          {CustomeDetailOfReport?.chart_type?.toLowerCase() === "gauge" ||
            CustomeDetailOfReport?.chart_type?.toLowerCase() ===
            "speedometer" ? null : (
            <div className="highCharts-color-configurationview">
              {totalLegends
                .filter((legend) => legends.includes(legend))
                .map((legend, index) => (
                  <div key={index} className="custom-color-input">
                    <div className="custom-color-show">
                      <input
                        type="color"
                        value={
                          customizationOptionsPreview?.chart_colours[legend]
                        }
                        onChange={(e) =>
                          handleColorChange(legend, e.target.value)
                        }
                      />
                    </div>
                    <div className="custom-color-label">
                      {/*new changes*/}
                      <label style={{cursor:"pointer"}} title={legend} >{legend}</label>
                      {/*new changes*/}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );
};

export default PreviewHighchart;
