import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import highchartsExporting from "highcharts/modules/exporting";
import HighchartsMore from "highcharts/highcharts-more";
import highchartsOfflineExporting from "highcharts/modules/offline-exporting";
import HighchartsBoost from "highcharts/modules/boost";
import { getdatacolumnforDrilldown } from "../../actions/reportmanagement";
import HighchartsDrilldown from "highcharts/modules/drilldown";
import { Box, CircularProgress } from "@mui/material";
import SecondLableDrilldown from "./SecondLableDrilldown";
import { toast } from "react-toastify";
import { decryptData } from '../utils/EncriptionStore';
HighchartsDrilldown(Highcharts);
HighchartsBoost(Highcharts);
HighchartsMore(Highcharts);
highchartsExporting(Highcharts);
highchartsOfflineExporting(Highcharts);

function Columndrilldown() {
    const [chartDatastore, setChartDatastore] = useState(null);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    const user = (() => {
        const encryptedData = localStorage.getItem("profile");
        return encryptedData ? decryptData(encryptedData) : null;
    })();

    const [detaildorsecondleval, setDetailForSecondLeval] = useState(null)
    const data = useSelector((state) => state?.reportmanagement?.detailcolumndatafordrilldown)
    const searchParams = new URLSearchParams(window.location.search);
    const reportTitle = searchParams.get("report_title");
    const categoryValue = searchParams.get("category_value");
    const selectedSeriesName = searchParams.get("selected_series_name");
    const allcategory = JSON.parse(searchParams.get("selected_value_y_coordinate"));


    useEffect(() => {
        const fetchData = async () => {
            if (reportTitle && categoryValue) {
                setLoading(true);  // Enable loader
                await dispatch(
                    getdatacolumnforDrilldown({
                        customer_id: user?.customer_id,
                        master_report: reportTitle,
                        filter_value: categoryValue,
                        selectedSeriesName: selectedSeriesName,
                        database_type:user.database_type,
                    })
                );
                setLoading(false);  // Disable loader after data fetch
            }
        };
        fetchData();
    }, [reportTitle, categoryValue, selectedSeriesName, dispatch]);


    useEffect(() => {
        let chartData = {};
        if (!data || Object.keys(data).length === 0) {
            setChartDatastore(null);
            return;
        }
        const getNameFromValue = (value) => {
            for (let obj of data?.series) {
                if (obj.data?.includes(value)) {
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
            setDetailForSecondLeval(wantedData)
        };
        const pointEventdrill =
            data.drilldown !== "yes"
                ? {
                    click: function () {
                        const seriesName = this.options.name;
                        const category = data?.xAxis[0]?.categories[0] || this.name;
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
        if (data?.len_col > 2) {
            chartData = {
                chart: {
                    type: "column",
                    events: {
                        load() {
                            const chart = this;

                            // Remove any existing select dropdown to avoid duplicates
                            document.getElementById("chart-select-dropdown")?.remove();

                            // Create the select element
                            const select = document.createElement("select");
                            select.id = "chart-select-dropdown";
                            select.className = "highchart-custom-dropdown";

                            // Add options dynamically
                            const options = allcategory || [];
                            options.forEach((optionText) => {
                                const option = document.createElement("option");
                                option.value = optionText;
                                option.textContent = optionText;
                                select.appendChild(option);
                            });

                            // Set current selection from URL
                            select.value = categoryValue || options[0];

                            // Apply styles for absolute positioning
                            select.style.position = "absolute";
                            select.style.top = "10px";
                            select.style.right = "10px";
                            select.style.padding = "5px";
                            select.style.border = "1px solid #ccc";
                            select.style.borderRadius = "4px";
                            select.style.cursor = "pointer";

                            // Append select inside the chart container
                            chart.container.parentNode.appendChild(select);

                            // Add event listener for change
                            select.addEventListener("change", async (event) => {
                                const selectedCategory = event.target.value;

                                // Disable the dropdown while loading
                                select.disabled = true;
                                setLoading(true);

                                // Update the URL parameter
                                const params = new URLSearchParams(window.location.search);
                                params.set("category_value", selectedCategory);
                                window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

                                // Dispatch action with the new category value
                                await dispatch(
                                    getdatacolumnforDrilldown({
                                        customer_id: user?.customer_id,
                                        master_report: reportTitle,
                                        filter_value: selectedCategory,
                                        selectedSeriesName: selectedSeriesName,
                                        database_type:user.database_type,
                                    })
                                );
                                // Re-enable the dropdown and hide loader
                                setLoading(false);
                                setDetailForSecondLeval(null)
                                select.disabled = false;
                            });
                        },
                    },
                },
                title: { align: "center", text: data?.title || "Chart" },
                accessibility: { announceNewData: { enabled: true } },
                xAxis: { categories: data?.series?.map((item) => item.name) || [] },
                yAxis: { title: { text: null } },
                legend: { enabled: false },
                credits: { enabled: false },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        cursor: "pointer",
                        point: { events: pointEventdrill },
                        dataLabels: { enabled: true, format: "{point.y}" },
                    },
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{point.name}</span><br>',
                    pointFormat:
                        '<span style="color:{point.color}">{point.name}</span>: ' +
                        "<b>{point.y}</b> of total<br/>",
                },

                series: [
                    {
                        boostThreshold: 1000,
                        name: data?.series[0]?.name || data?.xAxis[0].categories || "",
                        colorByPoint: true,
                        data: data?.series.map((entry) => ({
                            name: entry.name,
                            y: entry.data[0]
                        })) || [],
                    },
                ],

            };
        } else if (data?.len_col <= 2) {
            chartData = {
                chart: {
                    type: "column",
                    events: {
                        load() {
                            const chart = this;

                            // Remove any existing select dropdown to avoid duplicates
                            document.getElementById("chart-select-dropdown")?.remove();

                            // Create the select element
                            const select = document.createElement("select");
                            select.id = "chart-select-dropdown";
                            select.className = "highchart-custom-dropdown";

                            // Add options dynamically
                            const options = allcategory || [];
                            options.forEach((optionText) => {
                                const option = document.createElement("option");
                                option.value = optionText;
                                option.textContent = optionText;
                                select.appendChild(option);
                            });

                            // Set current selection from URL
                            select.value = categoryValue || options[0];

                            // Apply styles for absolute positioning
                            select.style.position = "absolute";
                            select.style.top = "10px";
                            select.style.right = "10px";
                            select.style.padding = "5px";
                            select.style.border = "1px solid #ccc";
                            select.style.borderRadius = "4px";
                            select.style.cursor = "pointer";

                            // Append select inside the chart container
                            chart.container.parentNode.appendChild(select);

                            // Add event listener for change
                            select.addEventListener("change", async (event) => {
                                const selectedCategory = event.target.value;

                                // Disable the dropdown while loading
                                select.disabled = true;
                                setLoading(true);

                                // Update the URL parameter
                                const params = new URLSearchParams(window.location.search);
                                params.set("category_value", selectedCategory);
                                window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);

                                // Dispatch action with the new category value
                                await dispatch(
                                    getdatacolumnforDrilldown({
                                        customer_id: user?.customer_id,
                                        master_report: reportTitle,
                                        filter_value: selectedCategory,
                                        selectedSeriesName: selectedSeriesName,
                                        database_type:user.database_type,
                                    })
                                );
                                // Re-enable the dropdown and hide loader
                                setLoading(false);
                                setDetailForSecondLeval(null)
                                select.disabled = false;
                            });
                        },
                    },
                },
                title: { align: "center", text: data?.title || "Chart" },
                accessibility: { announceNewData: { enabled: true } },
                xAxis: { categories: data?.xAxis[0]?.categories || [] },
                yAxis: { title: { text: null } },
                legend: { enabled: false },
                credits: { enabled: false },
                plotOptions: {
                    series: {
                        borderWidth: 0,
                        cursor: "pointer",
                        point: { events: pointEventdrill },
                        dataLabels: { enabled: true, format: "{point.y}" },
                    },
                },
                tooltip: {
                    headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
                    pointFormat:
                        '<span style="color:{point.color}">{point.name}</span>: ' +
                        "<b>{point.y}</b> of total<br/>",
                },

                series: [
                    {
                        boostThreshold: 1000,
                        name: data?.series[0]?.name,
                        colorByPoint: true,
                        data: data?.series[0]?.data.map((name, index) => ({
                            name,
                            y: data?.series[1]?.data[index],
                        })) || [],
                    },
                ],

            };
        }
        setChartDatastore(chartData);
    }, [data]);

    return (
        <div>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <CircularProgress />
                </Box>
            ) : chartDatastore ? (
                <HighchartsReact
                    highcharts={Highcharts}
                    options={chartDatastore}
                    containerProps={{ style: { height: "400px" } }}
                />
            ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
                    <p>No data available</p>
                </Box>
            )}
            <Box>
                {detaildorsecondleval ? (
                    <SecondLableDrilldown detaildorsecondleval={detaildorsecondleval} />
                ) : (
                    <p>...</p>
                )}
            </Box>
        </div>
    );
}

export default Columndrilldown;
