// export var credentials: { username: string, password: string } = { username: null, password: null };
export class PerformanceCollector {
    static registerPerformanceEntry(url, startTime) {
        let pe = PerformanceCollector.performanceData.find(pe => pe.url == url);
        if (pe == null) {
            pe = { count: 0, sumTime: 0, url: url };
            PerformanceCollector.performanceData.push(pe);
        }
        pe.count++; //Test
        let dt = Math.round(performance.now() - startTime);
        pe.sumTime += dt;
        PerformanceCollector.performanceDataCount++;
        // console.log("Performance entry for path " + pe.url + ": " + dt + " ms, aggregated: " + pe.sumTime + " for " + pe.count + " requests.");
    }
    static sendDataToServer() {
        if (performance.now() - PerformanceCollector.lastTimeSent > 3 * 60 * 1000) {
            let request = {
                data: PerformanceCollector.performanceData
            };
            PerformanceCollector.performanceData = [];
            PerformanceCollector.performanceDataCount = 0;
            PerformanceCollector.lastTimeSent = performance.now();
            ajax("collectPerformanceData", request, () => { });
        }
    }
}
PerformanceCollector.performanceData = [];
PerformanceCollector.performanceDataCount = 0;
PerformanceCollector.lastTimeSent = performance.now();
export function ajax(url, request, successCallback, errorCallback) {
    showNetworkBusy(true);
    let time = performance.now();
    $.ajax({
        type: 'POST',
        async: true,
        data: JSON.stringify(request),
        contentType: 'application/json',
        url: "servlet/" + url,
        success: function (response) {
            PerformanceCollector.registerPerformanceEntry(url, time);
            showNetworkBusy(false);
            if (response.success != null && response.success == false || typeof (response) == "string" && response == '') {
                let error = "Fehler bei der Bearbeitung der Anfrage";
                if (response.message != null)
                    error = response.message;
                if (response.error != null)
                    error = response.error;
                if (error == "Not logged in") {
                    // setTimeout(() => newLogin(url, request, successCallback, errorCallback), 10000);
                    // location.reload();
                }
                if (errorCallback)
                    errorCallback(error);
            }
            else {
                successCallback(response);
            }
            return;
        },
        error: function (jqXHR, message) {
            showNetworkBusy(false);
            if (errorCallback) {
                let statusText = "Server nicht erreichbar.";
                if (jqXHR.status != 0) {
                    statusText = "" + jqXHR.status;
                }
                errorCallback(message + ": " + statusText);
                return;
            }
        }
    });
}
export function showNetworkBusy(busy) {
    if (busy) {
        jQuery('.jo_network-busy').show();
    }
    else {
        jQuery('.jo_network-busy').hide();
    }
}
// export function newLogin(url: string, request: any, successCallback: (response: any) => void,
//     errorCallback?: (message: string) => void) {
//     if (credentials.username == null) return;
//     let loginRequest: LoginRequest = {username: credentials.username, password: credentials.password};
//     $.ajax({
//         type: 'POST',
//         data: JSON.stringify(loginRequest),
//         contentType: 'application/json',
//         url: "login",
//         success: function (response: any) {
//             if (response.success != null && response.success == false || typeof (response) == "string" && response == '') {
//             } else {
//                 ajax(url, request, successCallback, errorCallback);
//             }
//             return;
//         },
//         error: function (jqXHR, message) {
// //            ajax(url, request, successCallback, errorCallback);
//         }
//     });
// }
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWpheEhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLHVHQUF1RztBQUV2RyxNQUFNLE9BQU8sb0JBQW9CO0lBSzdCLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFXLEVBQUUsU0FBaUI7UUFDMUQsSUFBSSxFQUFFLEdBQW9CLG9CQUFvQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDO1FBQ3pGLElBQUksRUFBRSxJQUFJLElBQUksRUFBRTtZQUNaLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7WUFDeEMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNqRDtRQUNELEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLE1BQU07UUFDbEIsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDbkQsRUFBRSxDQUFDLE9BQU8sSUFBSSxFQUFFLENBQUM7UUFDakIsb0JBQW9CLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztRQUM1QywwSUFBMEk7SUFDOUksQ0FBQztJQUVELE1BQU0sQ0FBQyxnQkFBZ0I7UUFDbkIsSUFBSSxXQUFXLENBQUMsR0FBRyxFQUFFLEdBQUcsb0JBQW9CLENBQUMsWUFBWSxHQUFHLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxFQUFFO1lBQ3ZFLElBQUksT0FBTyxHQUFHO2dCQUNWLElBQUksRUFBRSxvQkFBb0IsQ0FBQyxlQUFlO2FBQzdDLENBQUE7WUFFRCxvQkFB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MkM7QUFDM0Msd0JBQXdCO0FBQ3hCLDhDQUE4QztBQUM5Qyw4SEFBOEg7QUFDOUgsdUJBQXVCO0FBQ3ZCLHNFQUFzRTtBQUN0RSxnQkFBZ0I7QUFDaEIsc0JBQXNCO0FBQ3RCLGFBQWE7QUFDYiw2Q0FBNkM7QUFDN0Msb0VBQW9FO0FBQ3BFLFlBQVk7QUFDWixVQUFVO0FBQ1YsSUFBSSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IExvZ2luUmVxdWVzdCwgUGVyZm9ybWFuY2VEYXRhIH0gZnJvbSBcIi4vRGF0YS5qc1wiO1xyXG5cclxuLy8gZXhwb3J0IHZhciBjcmVkZW50aWFsczogeyB1c2VybmFtZTogc3RyaW5nLCBwYXNzd29yZDogc3RyaW5nIH0gPSB7IHVzZXJuYW1lOiBudWxsLCBwYXNzd29yZDogbnVsbCB9O1xyXG5cclxuZXhwb3J0IGNsYXNzIFBlcmZvcm1hbmNlQ29sbGVjdG9yIHtcclxuICAgIHN0YXRpYyBwZXJmb3JtYW5jZURhdGE6IFBlcmZvcm1hbmNlRGF0YVtdID0gW107XHJcbiAgICBzdGF0aWMgcGVyZm9ybWFuY2VEYXRhQ291bnQ6IG51bWJlciA9IDA7XHJcbiAgICBzdGF0aWMgbGFzdFRpbWVTZW50OiBudW1iZXIgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICBzdGF0aWMgcmVnaXN0ZXJQZXJmb3JtYW5jZUVudHJ5KHVybDogc3RyaW5nLCBzdGFydFRpbWU6IG51bWJlcikge1xyXG4gICAgICAgIGxldCBwZTogUGVyZm9ybWFuY2VEYXRhID0gUGVyZm9ybWFuY2VDb2xsZWN0b3IucGVyZm9ybWFuY2VEYXRhLmZpbmQocGUgPT4gcGUudXJsID09IHVybCk7XHJcbiAgICAgICAgaWYgKHBlID09IG51bGwpIHtcclxuICAgICAgICAgICAgcGUgPSB7IGNvdW50OiAwLCBzdW1UaW1lOiAwLCB1cmw6IHVybCB9O1xyXG4gICAgICAgICAgICBQZXJmb3JtYW5jZUNvbGxlY3Rvci5wZXJmb3JtYW5jZURhdGEucHVzaChwZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHBlLmNvdW50Kys7IC8vVGVzdFxyXG4gICAgICAgIGxldCBkdCA9IE1hdGgucm91bmQocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydFRpbWUpO1xyXG4gICAgICAgIHBlLnN1bVRpbWUgKz0gZHQ7XHJcbiAgICAgICAgUGVyZm9ybWFuY2VDb2xsZWN0b3IucGVyZm9ybWFuY2VEYXRhQ291bnQrKztcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlBlcmZvcm1hbmNlIGVudHJ5IGZvciBwYXRoIFwiICsgcGUudXJsICsgXCI6IFwiICsgZHQgKyBcIiBtcywgYWdncmVnYXRlZDogXCIgKyBwZS5zdW1UaW1lICsgXCIgZm9yIFwiICsgcGUuY291bnQgKyBcIiByZXF1ZXN0cy5cIik7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIHNlbmREYXRhVG9TZXJ2ZXIoKSB7XHJcbiAgICAgICAgaWYgKHBlcmZvcm1hbmNlLm5vdygpIC0gUGVyZm9ybWFuY2VDb2xsZWN0b3IubGFzdFRpbWVTZW50ID4gMyAqIDYwICogMTAwMCkge1xyXG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIGRhdGE6IFBlcmZvcm1hbmNlQ29sbGVjdG9yLnBlcmZvcm1hbmNlRGF0YVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBQZXJmb3JtYW5jZUNvbGxlY3Rvci5wZXJmb3JtYW5jZURhdGEgPSBbXTtcclxuICAgICAgICAgICAgUGVyZm9ybWFuY2VDb2xsZWN0b3IucGVyZm9ybWFuY2VEYXRhQ291bnQgPSAwO1xyXG4gICAgICAgICAgICBQZXJmb3JtYW5jZUNvbGxlY3Rvci5sYXN0VGltZVNlbnQgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgICAgICAgIGFqYXgoXCJjb2xsZWN0UGVyZm9ybWFuY2VEYXRhXCIsIHJlcXVlc3QsICgpID0+IHsgfSlcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFqYXgodXJsOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgc3VjY2Vzc0NhbGxiYWNrOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZCxcclxuXHJcbiAgICBlcnJvckNhbGxiYWNrPzogKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCkge1xyXG5cclxuICAgIHNob3dOZXR3b3JrQnVzeSh0cnVlKTtcclxuICAgIGxldCB0aW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgJC5hamF4KHtcclxuICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbiAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdCksXHJcbiAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi9qc29uJyxcclxuICAgICAgICB1cmw6IFwic2VydmxldC9cIiArIHVybCxcclxuICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2U6IGFueSkge1xyXG5cclxuICAgICAgICAgICAgUGVyZm9ybWFuY2VDb2xsZWN0b3IucmVnaXN0ZXJQZXJmb3JtYW5jZUVudHJ5KHVybCwgdGltZSk7XHJcblxyXG4gICAgICAgICAgICBzaG93TmV0d29ya0J1c3koZmFsc2UpO1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2VzcyAhPSBudWxsICYmIHJlc3BvbnNlLnN1Y2Nlc3MgPT0gZmFsc2UgfHwgdHlwZW9mIChyZXNwb25zZSkgPT0gXCJzdHJpbmdcIiAmJiByZXNwb25zZSA9PSAnJykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVycm9yID0gXCJGZWhsZXIgYmVpIGRlciBCZWFyYmVpdHVuZyBkZXIgQW5mcmFnZVwiXHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UubWVzc2FnZSAhPSBudWxsKSBlcnJvciA9IHJlc3BvbnNlLm1lc3NhZ2U7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IgIT0gbnVsbCkgZXJyb3IgPSByZXNwb25zZS5lcnJvcjtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgPT0gXCJOb3QgbG9nZ2VkIGluXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+IG5ld0xvZ2luKHVybCwgcmVxdWVzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSwgMTAwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSBlcnJvckNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB9LFxyXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiAoanFYSFIsIG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgc2hvd05ldHdvcmtCdXN5KGZhbHNlKTtcclxuICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdGF0dXNUZXh0ID0gXCJTZXJ2ZXIgbmljaHQgZXJyZWljaGJhci5cIlxyXG4gICAgICAgICAgICAgICAgaWYgKGpxWEhSLnN0YXR1cyAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dCA9IFwiXCIgKyBqcVhIUi5zdGF0dXNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sobWVzc2FnZSArIFwiOiBcIiArIHN0YXR1c1RleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG93TmV0d29ya0J1c3koYnVzeTogYm9vbGVhbikge1xyXG4gICAgaWYgKGJ1c3kpIHtcclxuICAgICAgICBqUXVlcnkoJy5qb19uZXR3b3JrLWJ1c3knKS5zaG93KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGpRdWVyeSgnLmpvX25ldHdvcmstYnVzeScpLmhpZGUoKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG4vLyBleHBvcnQgZnVuY3Rpb24gbmV3TG9naW4odXJsOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgc3VjY2Vzc0NhbGxiYWNrOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZCxcclxuLy8gICAgIGVycm9yQ2FsbGJhY2s/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkKSB7XHJcblxyXG4vLyAgICAgaWYgKGNyZWRlbnRpYWxzLnVzZXJuYW1lID09IG51bGwpIHJldHVybjtcclxuLy8gICAgIGxldCBsb2dpblJlcXVlc3Q6IExvZ2luUmVxdWVzdCA9IHt1c2VybmFtZTogY3JlZGVudGlhbHMudXNlcm5hbWUsIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZH07XHJcblxyXG4vLyAgICAgJC5hamF4KHtcclxuLy8gICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbi8vICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5SZXF1ZXN0KSxcclxuLy8gICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4vLyAgICAgICAgIHVybDogXCJsb2dpblwiLFxyXG4vLyAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZTogYW55KSB7XHJcbi8vICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzICE9IG51bGwgJiYgcmVzcG9uc2Uuc3VjY2VzcyA9PSBmYWxzZSB8fCB0eXBlb2YgKHJlc3BvbnNlKSA9PSBcInN0cmluZ1wiICYmIHJlc3BvbnNlID09ICcnKSB7XHJcbi8vICAgICAgICAgICAgIH0gZWxzZSB7XHJcbi8vICAgICAgICAgICAgICAgICBhamF4KHVybCwgcmVxdWVzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcclxuLy8gICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgICByZXR1cm47XHJcbi8vICAgICAgICAgfSxcclxuLy8gICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGpxWEhSLCBtZXNzYWdlKSB7XHJcbi8vIC8vICAgICAgICAgICAgYWpheCh1cmwsIHJlcXVlc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XHJcbi8vICAgICAgICAgfVxyXG4vLyAgICAgfSk7XHJcbi8vIH1cclxuIl19