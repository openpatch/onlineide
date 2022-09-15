import { ajax } from "../communication/AjaxHelper.js";
class Statistics {
    constructor() {
        this.timeFormat = 'YYYY-MM-DD HH:mm';
    }
    start() {
        let request = { now: false };
        let that = this;
        let secondsSinceLastUpdate = 0;
        ajax("getStatistics", request, (response) => {
            that.plotGraph(response.data);
            setInterval(() => {
                secondsSinceLastUpdate = 0;
                that.updateGraph();
            }, response.statisticPeriodSeconds * 1000);
            setInterval(() => {
                $('#updatetimer').text('Nächste Messung in ' + (response.statisticPeriodSeconds - secondsSinceLastUpdate) + " s");
                secondsSinceLastUpdate++;
            }, 1000);
        }, (message) => {
            alert("Es ist ein Fehler aufgetreten: " + message);
        });
        let getCurrentLoad = () => {
            let request = { now: true };
            ajax("getStatistics", request, (response) => {
                let d = response.data[0];
                let text = d.users + " User, " + Math.round(d.memory / 1000) + " kB, Requests pro Minute: " + d.requestsPerMinute + ", " + that.getMsPerRequest(d) + " ms/Request.";
                text += "<br>WebSockets: " + d.webSocketSessionCount + " Sessions with " + d.webSocketClientCount + " Clients, ";
                text += d.webSocketRequestPerSecond + " Requests pro Sekunde";
                $('#current').html(text);
                $('#userlist').text(d.userlist.join(", "));
                $('#current').css("color", "#0000ff");
                $('#current').animate({ color: "#000000" }, 1500);
            }, (message) => {
                alert("Es ist ein Fehler aufgetreten: " + message);
            });
        };
        getCurrentLoad();
        setInterval(getCurrentLoad, 5000);
    }
    updateGraph() {
        let request = { now: false };
        let that = this;
        ajax("getStatistics", request, (response) => {
            let incomingData = response.data;
            let optionsData = that.chart.data;
            let newData = [];
            if (that.rawLabels.length > 0) {
                let lastPlottedTime = that.rawLabels[that.rawLabels.length - 1];
                let i = 0;
                while (i < incomingData.length && incomingData[i].time != lastPlottedTime) {
                    i++;
                }
                if (i == incomingData.length) {
                    newData = incomingData;
                }
                else {
                    newData = incomingData.slice(i + 1);
                }
            }
            else {
                newData = incomingData;
            }
            for (let d of newData) {
                //@ts-ignore
                optionsData.labels.push(moment(d.time, this.timeFormat));
                optionsData.datasets[0].data.push(d.users);
                optionsData.datasets[1].data.push(d.memory / 1000000);
                optionsData.datasets[2].data.push(d.requestsPerMinute);
                optionsData.datasets[3].data.push(d.webSocketRequestPerSecond);
                optionsData.datasets[4].data.push(this.getMsPerRequest(d));
                that.rawLabels.push(d.time);
            }
            this.chart.update();
        }, (message) => {
            // alert("Es ist ein Fehler aufgetreten: " + message);
        });
    }
    getMsPerRequest(data) {
        let count = 0;
        let sumTime = 0;
        data.performanceDataList.forEach(pd => {
            count += pd.count;
            sumTime += pd.sumTime;
        });
        return Math.min(1000, Math.round(sumTime / count));
    }
    plotGraph(data) {
        let ctx = document.getElementById('chart').getContext('2d');
        this.rawLabels = data.map((d) => d.time);
        //java: yyyy-MM-dd HH:mm
        let options = {
            // The type of chart we want to create
            type: 'line',
            // The data for our dataset
            data: {
                //@ts-ignore
                labels: data.map((d) => moment(d.time, this.timeFormat)),
                datasets: [
                    {
                        label: 'User',
                        fill: false,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: 'rgb(255, 99, 132)',
                        data: data.map((d) => d.users),
                        yAxisID: 'y-axis-1',
                        lineTension: 0
                    },
                    {
                        label: 'Memory (MB)',
                        fill: false,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: 'rgb(0, 100, 255)',
                        data: data.map((d) => Math.round(d.memory / 1000000)),
                        yAxisID: 'y-axis-2',
                        lineTension: 0
                    },
                    {
                        label: 'Requests per minute',
                        fill: false,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: 'rgb(0, 255, 100)',
                        data: data.map((d) => Math.round(d.requestsPerMinute)),
                        yAxisID: 'y-axis-1',
                        lineTension: 0
                    },
                    {
                        label: 'WS-Requests per second',
                        fill: false,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: 'rgb(100, 0, 255)',
                        data: data.map((d) => Math.round(d.webSocketRequestPerSecond)),
                        yAxisID: 'y-axis-2',
                        lineTension: 0
                    },
                    {
                        label: 'ms per Request',
                        fill: false,
                        backgroundColor: 'rgba(0, 0, 0, 0)',
                        borderColor: 'rgb(255, 255, 0)',
                        data: data.map((d) => this.getMsPerRequest(d)),
                        yAxisID: 'y-axis-2',
                        lineTension: 0
                    },
                ]
            },
            // Configuration options go here
            options: {
                responsive: true,
                maintainAspectRatio: false,
                hover: { mode: "index" },
                title: {
                    display: false,
                    text: 'Serverauslastung'
                },
                scales: {
                    xAxes: [{
                            type: 'time',
                            time: {
                                parser: this.timeFormat,
                                displayFormats: {
                                    hour: 'D.M.|H:mm'
                                }
                            },
                            distribution: 'series',
                            offset: true,
                            ticks: {
                                major: {
                                    enabled: true,
                                    fontStyle: 'bold'
                                },
                                source: 'data',
                                autoSkip: true,
                                autoSkipPadding: 75,
                                maxRotation: 0,
                                sampleSize: 100
                            }
                        }],
                    yAxes: [{
                            type: 'linear',
                            display: true,
                            position: 'left',
                            id: 'y-axis-1',
                        }, {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            id: 'y-axis-2',
                            // grid line settings
                            gridLines: {
                                drawOnChartArea: false,
                            },
                        }],
                }
            }
        };
        //@ts-ignore
        this.chart = new Chart(ctx, options);
    }
}
$(() => {
    new Statistics().start();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3RhdGlzdGljcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYWRtaW5pc3RyYXRpb24vU3RhdGlzdGljcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFHdEQsTUFBTSxVQUFVO0lBQWhCO1FBS0ksZUFBVSxHQUFHLGtCQUFrQixDQUFDO0lBbVBwQyxDQUFDO0lBalBHLEtBQUs7UUFDRCxJQUFJLE9BQU8sR0FBeUIsRUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFDLENBQUM7UUFDakQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksc0JBQXNCLEdBQVcsQ0FBQyxDQUFDO1FBRXZDLElBQUksQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLENBQUMsUUFBK0IsRUFBRSxFQUFFO1lBRS9ELElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTlCLFdBQVcsQ0FBQyxHQUFHLEVBQUU7Z0JBQ2Isc0JBQXNCLEdBQUcsQ0FBQyxDQUFDO2dCQUMzQixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDdkIsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxzQkFBc0IsR0FBQyxJQUFJLENBQUMsQ0FBQztZQUV6QyxXQUFXLENBQUMsR0FBRSxFQUFFO2dCQUNaLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsQ0FBQyxRQUFRLENBQUMsc0JBQXNCLEdBQUcsc0JBQXNCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztnQkFDbEgsc0JBQXNCLEVBQUUsQ0FBQztZQUM3QixDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFYixDQUFDLEVBQUUsQ0FBQyxPQUFlLEVBQUUsRUFBRTtZQUNuQixLQUFLLENBQUMsaUNBQWlDLEdBQUcsT0FBTyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFD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QUFVOzRCQUVkLHFCQUFxQjs0QkFDckIsU0FBUyxFQUFFO2dDQUNQLGVBQWUsRUFBRSxLQUFLOzZCQUN6Qjt5QkFDSixDQUFDO2lCQUNMO2FBQ0o7U0FFSixDQUFBO1FBRUQsWUFBWTtRQUNaLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRXpDLENBQUM7Q0FJSjtBQUdELENBQUMsQ0FBQyxHQUFFLEVBQUU7SUFDRixJQUFJLFVBQVUsRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgR2V0U3RhdGlzdGljc1JlcXVlc3QsIEdldFN0YXRpc3RpY3NSZXNwb25zZSwgU3RhdGlzdGljRGF0YSB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuXHJcbmNsYXNzIFN0YXRpc3RpY3Mge1xyXG5cclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgY2hhcnQ6IENoYXJ0O1xyXG4gICAgcmF3TGFiZWxzOiBzdHJpbmdbXTtcclxuICAgIHRpbWVGb3JtYXQgPSAnWVlZWS1NTS1ERCBISDptbSc7XHJcblxyXG4gICAgc3RhcnQoKXtcclxuICAgICAgICBsZXQgcmVxdWVzdDogR2V0U3RhdGlzdGljc1JlcXVlc3QgPSB7bm93OiBmYWxzZX07XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgc2Vjb25kc1NpbmNlTGFzdFVwZGF0ZTogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgYWpheChcImdldFN0YXRpc3RpY3NcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBHZXRTdGF0aXN0aWNzUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoYXQucGxvdEdyYXBoKHJlc3BvbnNlLmRhdGEpO1xyXG5cclxuICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgc2Vjb25kc1NpbmNlTGFzdFVwZGF0ZSA9IDA7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnVwZGF0ZUdyYXBoKCk7XHJcbiAgICAgICAgICAgIH0sIHJlc3BvbnNlLnN0YXRpc3RpY1BlcmlvZFNlY29uZHMqMTAwMCk7ICAgIFxyXG5cclxuICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCk9PntcclxuICAgICAgICAgICAgICAgICQoJyN1cGRhdGV0aW1lcicpLnRleHQoJ07DpGNoc3RlIE1lc3N1bmcgaW4gJyArIChyZXNwb25zZS5zdGF0aXN0aWNQZXJpb2RTZWNvbmRzIC0gc2Vjb25kc1NpbmNlTGFzdFVwZGF0ZSkgKyBcIiBzXCIpO1xyXG4gICAgICAgICAgICAgICAgc2Vjb25kc1NpbmNlTGFzdFVwZGF0ZSsrO1xyXG4gICAgICAgICAgICB9LCAxMDAwKTtcclxuXHJcbiAgICAgICAgfSwgKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChcIkVzIGlzdCBlaW4gRmVobGVyIGF1ZmdldHJldGVuOiBcIiArIG1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgZ2V0Q3VycmVudExvYWQgPSAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCByZXF1ZXN0OiBHZXRTdGF0aXN0aWNzUmVxdWVzdCA9IHtub3c6IHRydWV9O1xyXG4gICAgICAgICAgICBhamF4KFwiZ2V0U3RhdGlzdGljc1wiLCByZXF1ZXN0LCAocmVzcG9uc2U6IEdldFN0YXRpc3RpY3NSZXNwb25zZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBkID0gcmVzcG9uc2UuZGF0YVswXTtcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0OiBzdHJpbmcgPSBkLnVzZXJzICsgXCIgVXNlciwgXCIgKyBNYXRoLnJvdW5kKGQubWVtb3J5LzEwMDApICsgXCIga0IsIFJlcXVlc3RzIHBybyBNaW51dGU6IFwiICsgZC5yZXF1ZXN0c1Blck1pbnV0ZSArIFwiLCBcIiArIHRoYXQuZ2V0TXNQZXJSZXF1ZXN0KGQpICsgXCIgbXMvUmVxdWVzdC5cIjtcclxuICAgICAgICAgICAgICAgIHRleHQgKz0gXCI8YnI+V2ViU29ja2V0czogXCIgKyBkLndlYlNvY2tldFNlc3Npb25Db3VudCArIFwiIFNlc3Npb25zIHdpdGggXCIgKyBkLndlYlNvY2tldENsaWVudENvdW50ICsgXCIgQ2xpZW50cywgXCI7XHJcbiAgICAgICAgICAgICAgICB0ZXh0ICs9IGQud2ViU29ja2V0UmVxdWVzdFBlclNlY29uZCArIFwiIFJlcXVlc3RzIHBybyBTZWt1bmRlXCI7XHJcbiAgICAgICAgICAgICAgICAkKCcjY3VycmVudCcpLmh0bWwodGV4dCk7XHJcblxyXG4gICAgICAgICAgICAgICAgJCgnI3VzZXJsaXN0JykudGV4dChkLnVzZXJsaXN0LmpvaW4oXCIsIFwiKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgJCgnI2N1cnJlbnQnKS5jc3MoXCJjb2xvclwiLCBcIiMwMDAwZmZcIik7XHJcbiAgICAgICAgICAgICAgICAkKCcjY3VycmVudCcpLmFuaW1hdGUoe2NvbG9yOiBcIiMwMDAwMDBcIn0sIDE1MDApO1xyXG4gICAgXHJcbiAgICBcclxuICAgICAgICAgICAgfSwgKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgYWxlcnQoXCJFcyBpc3QgZWluIEZlaGxlciBhdWZnZXRyZXRlbjogXCIgKyBtZXNzYWdlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBnZXRDdXJyZW50TG9hZCgpO1xyXG5cclxuICAgICAgICBzZXRJbnRlcnZhbChnZXRDdXJyZW50TG9hZCwgNTAwMCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZUdyYXBoKCl7XHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IEdldFN0YXRpc3RpY3NSZXF1ZXN0ID0ge25vdzogZmFsc2V9O1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgYWpheChcImdldFN0YXRpc3RpY3NcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBHZXRTdGF0aXN0aWNzUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBpbmNvbWluZ0RhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICBsZXQgb3B0aW9uc0RhdGEgPSB0aGF0LmNoYXJ0LmRhdGE7XHJcblxyXG4gICAgICAgICAgICBsZXQgbmV3RGF0YTogU3RhdGlzdGljRGF0YVtdID0gW107XHJcbiAgICAgICAgICAgIGlmKHRoYXQucmF3TGFiZWxzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICAgICAgbGV0IGxhc3RQbG90dGVkVGltZSA9IHRoYXQucmF3TGFiZWxzW3RoYXQucmF3TGFiZWxzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGkgPSAwO1xyXG4gICAgICAgICAgICAgICAgd2hpbGUoaSA8IGluY29taW5nRGF0YS5sZW5ndGggJiYgaW5jb21pbmdEYXRhW2ldLnRpbWUgIT0gbGFzdFBsb3R0ZWRUaW1lKXtcclxuICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoaSA9PSBpbmNvbWluZ0RhdGEubGVuZ3RoKXtcclxuICAgICAgICAgICAgICAgICAgICBuZXdEYXRhID0gaW5jb21pbmdEYXRhO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBuZXdEYXRhID0gaW5jb21pbmdEYXRhLnNsaWNlKGkgKyAxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5ld0RhdGEgPSBpbmNvbWluZ0RhdGE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvcihsZXQgZCBvZiBuZXdEYXRhKXtcclxuXHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIG9wdGlvbnNEYXRhLmxhYmVscy5wdXNoKG1vbWVudChkLnRpbWUsIHRoaXMudGltZUZvcm1hdCkpO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc0RhdGEuZGF0YXNldHNbMF0uZGF0YS5wdXNoKGQudXNlcnMpO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc0RhdGEuZGF0YXNldHNbMV0uZGF0YS5wdXNoKGQubWVtb3J5LzEwMDAwMDApO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc0RhdGEuZGF0YXNldHNbMl0uZGF0YS5wdXNoKGQucmVxdWVzdHNQZXJNaW51dGUpO1xyXG4gICAgICAgICAgICAgICAgb3B0aW9uc0RhdGEuZGF0YXNldHNbM10uZGF0YS5wdXNoKGQud2ViU29ja2V0UmVxdWVzdFBlclNlY29uZCk7XHJcbiAgICAgICAgICAgICAgICBvcHRpb25zRGF0YS5kYXRhc2V0c1s0XS5kYXRhLnB1c2godGhpcy5nZXRNc1BlclJlcXVlc3QoZCkpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5yYXdMYWJlbHMucHVzaChkLnRpbWUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNoYXJ0LnVwZGF0ZSgpO1xyXG5cclxuICAgICAgICB9LCAobWVzc2FnZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGFsZXJ0KFwiRXMgaXN0IGVpbiBGZWhsZXIgYXVmZ2V0cmV0ZW46IFwiICsgbWVzc2FnZSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldE1zUGVyUmVxdWVzdChkYXRhOiBTdGF0aXN0aWNEYXRhKXtcclxuXHJcbiAgICAgICAgbGV0IGNvdW50ID0gMDtcclxuICAgICAgICBsZXQgc3VtVGltZSA9IDA7XHJcbiAgICAgICAgZGF0YS5wZXJmb3JtYW5jZURhdGFMaXN0LmZvckVhY2gocGQgPT4ge1xyXG4gICAgICAgICAgICBjb3VudCArPSBwZC5jb3VudDtcclxuICAgICAgICAgICAgc3VtVGltZSArPSBwZC5zdW1UaW1lO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHJldHVybiBNYXRoLm1pbigxMDAwLCBNYXRoLnJvdW5kKHN1bVRpbWUvY291bnQpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcGxvdEdyYXBoKGRhdGE6IFN0YXRpc3RpY0RhdGFbXSkge1xyXG5cclxuICAgICAgICBsZXQgY3R4ID0gKDxIVE1MQ2FudmFzRWxlbWVudD5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhcnQnKSkuZ2V0Q29udGV4dCgnMmQnKTtcclxuXHJcbiAgICAgICAgdGhpcy5yYXdMYWJlbHMgPSBkYXRhLm1hcCgoZCkgPT4gZC50aW1lKTtcclxuXHJcbiAgICAgICAgLy9qYXZhOiB5eXl5LU1NLWRkIEhIOm1tXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIGxldCBvcHRpb25zOiBDaGFydC5DaGFydENvbmZpZ3VyYXRpb24gPSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSB0eXBlIG9mIGNoYXJ0IHdlIHdhbnQgdG8gY3JlYXRlXHJcbiAgICAgICAgICAgIHR5cGU6ICdsaW5lJyxcclxuICAgICAgICAgICAgLy8gVGhlIGRhdGEgZm9yIG91ciBkYXRhc2V0XHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgbGFiZWxzOiBkYXRhLm1hcCgoZCkgPT4gbW9tZW50KGQudGltZSwgdGhpcy50aW1lRm9ybWF0KSksXHJcbiAgICAgICAgICAgICAgICBkYXRhc2V0czogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogJ1VzZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGw6IGZhbHNlLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsIDAsIDAsIDApJyxcclxuICAgICAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3JnYigyNTUsIDk5LCAxMzIpJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLm1hcCgoZCkgPT4gZC51c2VycyksXHJcbiAgICAgICAgICAgICAgICAgICAgeUF4aXNJRDogJ3ktYXhpcy0xJyxcclxuICAgICAgICAgICAgICAgICAgICBsaW5lVGVuc2lvbjogMFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdNZW1vcnkgKE1CKScsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgwLCAwLCAwLCAwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICdyZ2IoMCwgMTAwLCAyNTUpJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLm1hcCgoZCkgPT4gTWF0aC5yb3VuZChkLm1lbW9yeS8xMDAwMDAwKSksXHJcbiAgICAgICAgICAgICAgICAgICAgeUF4aXNJRDogJ3ktYXhpcy0yJyxcclxuICAgICAgICAgICAgICAgICAgICBsaW5lVGVuc2lvbjogMFxyXG5cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnUmVxdWVzdHMgcGVyIG1pbnV0ZScsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsbDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAncmdiYSgwLCAwLCAwLCAwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgYm9yZGVyQ29sb3I6ICdyZ2IoMCwgMjU1LCAxMDApJyxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBkYXRhLm1hcCgoZCkgPT4gTWF0aC5yb3VuZChkLnJlcXVlc3RzUGVyTWludXRlKSksXHJcbiAgICAgICAgICAgICAgICAgICAgeUF4aXNJRDogJ3ktYXhpcy0xJyxcclxuICAgICAgICAgICAgICAgICAgICBsaW5lVGVuc2lvbjogMFxyXG5cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6ICdXUy1SZXF1ZXN0cyBwZXIgc2Vjb25kJyxcclxuICAgICAgICAgICAgICAgICAgICBmaWxsOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICdyZ2JhKDAsIDAsIDAsIDApJyxcclxuICAgICAgICAgICAgICAgICAgICBib3JkZXJDb2xvcjogJ3JnYigxMDAsIDAsIDI1NSknLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGRhdGEubWFwKChkKSA9PiBNYXRoLnJvdW5kKGQud2ViU29ja2V0UmVxdWVzdFBlclNlY29uZCkpLFxyXG4gICAgICAgICAgICAgICAgICAgIHlBeGlzSUQ6ICd5LWF4aXMtMicsXHJcbiAgICAgICAgICAgICAgICAgICAgbGluZVRlbnNpb246IDBcclxuXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiAnbXMgcGVyIFJlcXVlc3QnLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbGw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogJ3JnYmEoMCwgMCwgMCwgMCknLFxyXG4gICAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAncmdiKDI1NSwgMjU1LCAwKScsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogZGF0YS5tYXAoKGQpID0+IHRoaXMuZ2V0TXNQZXJSZXF1ZXN0KGQpKSxcclxuICAgICAgICAgICAgICAgICAgICB5QXhpc0lEOiAneS1heGlzLTInLFxyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVUZW5zaW9uOiAwXHJcblxyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICBcclxuICAgICAgICAgICAgLy8gQ29uZmlndXJhdGlvbiBvcHRpb25zIGdvIGhlcmVcclxuICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgcmVzcG9uc2l2ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG1haW50YWluQXNwZWN0UmF0aW86IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaG92ZXI6IHttb2RlOiBcImluZGV4XCJ9LFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnU2VydmVyYXVzbGFzdHVuZydcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzY2FsZXM6IHtcclxuXHRcdFx0XHRcdHhBeGVzOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAndGltZScsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpbWU6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlcjogdGhpcy50aW1lRm9ybWF0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheUZvcm1hdHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3VyOiAnRC5NLnxIOm1tJ1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG5cdFx0XHRcdFx0XHRkaXN0cmlidXRpb246ICdzZXJpZXMnLFxyXG5cdFx0XHRcdFx0XHRvZmZzZXQ6IHRydWUsXHJcblx0XHRcdFx0XHRcdHRpY2tzOiB7XHJcblx0XHRcdFx0XHRcdFx0bWFqb3I6IHtcclxuXHRcdFx0XHRcdFx0XHRcdGVuYWJsZWQ6IHRydWUsXHJcblx0XHRcdFx0XHRcdFx0XHRmb250U3R5bGU6ICdib2xkJ1xyXG5cdFx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdFx0c291cmNlOiAnZGF0YScsXHJcblx0XHRcdFx0XHRcdFx0YXV0b1NraXA6IHRydWUsXHJcblx0XHRcdFx0XHRcdFx0YXV0b1NraXBQYWRkaW5nOiA3NSxcclxuXHRcdFx0XHRcdFx0XHRtYXhSb3RhdGlvbjogMCxcclxuXHRcdFx0XHRcdFx0XHRzYW1wbGVTaXplOiAxMDBcclxuXHRcdFx0XHRcdFx0fVxyXG4gICAgICAgICAgICAgICAgICAgIH1dLCAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgeUF4ZXM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdsaW5lYXInLCAvLyBvbmx5IGxpbmVhciBidXQgYWxsb3cgc2NhbGUgdHlwZSByZWdpc3RyYXRpb24uIFRoaXMgYWxsb3dzIGV4dGVuc2lvbnMgdG8gZXhpc3Qgc29sZWx5IGZvciBsb2cgc2NhbGUgZm9yIGluc3RhbmNlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3BsYXk6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiAnbGVmdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAneS1heGlzLTEnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2xpbmVhcicsIC8vIG9ubHkgbGluZWFyIGJ1dCBhbGxvdyBzY2FsZSB0eXBlIHJlZ2lzdHJhdGlvbi4gVGhpcyBhbGxvd3MgZXh0ZW5zaW9ucyB0byBleGlzdCBzb2xlbHkgZm9yIGxvZyBzY2FsZSBmb3IgaW5zdGFuY2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcGxheTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246ICdyaWdodCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAneS1heGlzLTInLFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZ3JpZCBsaW5lIHNldHRpbmdzXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyaWRMaW5lczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZHJhd09uQ2hhcnRBcmVhOiBmYWxzZSwgLy8gb25seSB3YW50IHRoZSBncmlkIGxpbmVzIGZvciBvbmUgYXhpcyB0byBzaG93IHVwXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICB0aGlzLmNoYXJ0ID0gbmV3IENoYXJ0KGN0eCwgb3B0aW9ucyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIFxyXG5cclxufVxyXG5cclxuXHJcbiQoKCk9PntcclxuICAgIG5ldyBTdGF0aXN0aWNzKCkuc3RhcnQoKTtcclxufSkiXX0=