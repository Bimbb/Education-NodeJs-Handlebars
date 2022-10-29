(function ($) {
    "use strict";
    $(function () {
        var visitorsTodayData = {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
            datasets: [
                {
                    label: "Cost",
                    data: [15, 25, 20, 18, 24, 20, 16, 20],
                    backgroundColor: ["rgba(238, 91, 91, .9)"],
                    borderColor: ["#ee5b5b"],
                    borderWidth: 2,
                    fill: true,
                    pointBorderWidth: 4,
                },
                {
                    label: "Product",
                    data: [20, 30, 25, 23, 29, 25, 21, 25],
                    backgroundColor: ["rgba(70, 77, 238, 1)"],
                    borderColor: ["#464dee"],
                    borderWidth: 2,
                    fill: true,
                    pointBorderWidth: 4,
                },
                {
                    label: "Margin",
                    data: [25, 35, 30, 28, 33, 30, 26, 30],
                    backgroundColor: ["rgba(81, 225, 195, .9)"],
                    borderColor: ["#51e1c3"],
                    borderWidth: 2,
                    fill: true,
                },
            ],
        };
        var visitorsTodayOptions = {
            scales: {
                yAxes: [
                    {
                        display: false,
                        gridLines: {
                            drawBorder: false,
                            display: false,
                        },
                    },
                ],
                xAxes: [
                    {
                        position: "bottom",
                        display: true,
                        gridLines: {
                            drawBorder: false,
                            display: true,
                            color: "#f2f2f2",
                            borderDash: [8, 4],
                        },
                        ticks: {
                            beginAtZero: false,
                            stepSize: 200,
                        },
                    },
                ],
            },
            legend: {
                display: false,
            },
            elements: {
                point: {
                    radius: 0,
                },
            },
            plugins: {
                datalabels: {
                    display: false,
                    align: "center",
                    anchor: "center",
                },
            },
        };
        if ($("#visitorsToday").length) {
            var lineChartCanvas = $("#visitorsToday").get(0).getContext("2d");
            var saleschart = new Chart(lineChartCanvas, {
                type: "line",
                data: visitorsTodayData,
                options: visitorsTodayOptions,
            });
        }
    });
})(jQuery);
