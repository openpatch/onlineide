// export var credentials: { username: string, password: string } = { username: null, password: null };
export function ajax(url, request, successCallback, errorCallback) {
    showNetworkBusy(true);
    $.ajax({
        type: 'POST',
        async: true,
        data: JSON.stringify(request),
        contentType: 'application/json',
        url: url,
        success: function (response) {
            showNetworkBusy(false);
            if (response.success != null && response.success == false || typeof (response) == "string" && response == '') {
                let error = "Fehler bei der Bearbeitung der Anfrage";
                if (response.message != null)
                    error = response.message;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWpheEhlbHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLHVHQUF1RztBQUd2RyxNQUFNLFVBQVUsSUFBSSxDQUFDLEdBQVcsRUFBRSxPQUFZLEVBQUUsZUFBd0MsRUFDcEYsYUFBeUM7SUFDekMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDSCxJQUFJLEVBQUUsTUFBTTtRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsSUFBSSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDO1FBQzdCLFdBQVcsRUFBRSxrQkFBa0I7UUFDL0IsR0FBRyxFQUFFLEdBQUc7UUFDUixPQUFPLEVBQUUsVUFBVSxRQUFhO1lBQzVCLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QixJQUFJLFFBQVEsQ0FBQyxPQUFPLElBQUksSUFBSSxJQUFJLFFBQVEsQ0FBQyxPQUFPLElBQUksS0FBSyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLElBQUksUUFBUSxJQUFJLEVBQUUsRUFBRTtnQkFDMUcsSUFBSSxLQUFLLEdBQUcsd0NBQXdDLENBQUE7Z0JBQ3BELElBQUksUUFBUSxDQUFDLE9BQU8sSUFBSSxJQUFJO29CQUFFLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDO2dCQUV2RCxJQUFJLEtBQUssSUFBSSxlQUFlLEVBQUU7b0JBQzFCLG1GQUFtRjtvQkFDbkYscUJBQXFCO2lCQUN4QjtnQkFFRCxJQUFJLGFBQWE7b0JBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQzNDO2lCQUFNO2dCQUNILGVBQWUsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM3QjtZQUNELE9BQU87UUFFWCxDQUFDO1FBQ0QsS0FBSyxFQUFFLFVBQVUsS0FBSyxFQUFFLE9BQU87WUFDM0IsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLElBQUksYUFBYSxFQUFFO2dCQUNmLElBQUksVUFBVSxHQUFHLDBCQUEwQixDQUFBO2dCQUMzQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO29CQUNuQixVQUFVLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUE7aUJBQ2pDO2dCQUNELGFBQWEsQ0FBQyxPQUFPLEdBQUcsSUFBSSxHQUFHLFVBQVUsQ0FBQyxDQUFDO2dCQUMzQyxPQUFPO2FBQ1Y7UUFDTCxDQUFDO0tBQ0osQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsSUFBYTtJQUN6QyxJQUFJLElBQUksRUFBRTtRQUNOLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQ3JDO1NBQU07UUFDSCxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUNyQztBQUNMLENBQUM7QUFJRCxnR0FBZ0c7QUFDaEcsbURBQW1EO0FBRW5ELGdEQUFnRDtBQUNoRCx5R0FBeUc7QUFFekcsZUFBZTtBQUNmLHdCQUF3QjtBQUN4Qiw4Q0FBOEM7QUFDOUMsMkNBQTJDO0FBQzNDLHdCQUF3QjtBQUN4Qiw4Q0FBOEM7QUFDOUMsOEhBQThIO0FBQzlILHVCQUF1QjtBQUN2QixzRUFBc0U7QUFDdEUsZ0JBQWdCO0FBQ2hCLHNCQUFzQjtBQUN0QixhQUFhO0FBQ2IsNkNBQTZDO0FBQzdDLG9FQUFvRTtBQUNwRSxZQUFZO0FBQ1osVUFBVTtBQUNWLElBQUkiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBMb2dpblJlcXVlc3QgfSBmcm9tIFwiLi9EYXRhLmpzXCI7XHJcblxyXG4vLyBleHBvcnQgdmFyIGNyZWRlbnRpYWxzOiB7IHVzZXJuYW1lOiBzdHJpbmcsIHBhc3N3b3JkOiBzdHJpbmcgfSA9IHsgdXNlcm5hbWU6IG51bGwsIHBhc3N3b3JkOiBudWxsIH07XHJcblxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGFqYXgodXJsOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgc3VjY2Vzc0NhbGxiYWNrOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZCxcclxuICAgIGVycm9yQ2FsbGJhY2s/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkKSB7XHJcbiAgICBzaG93TmV0d29ya0J1c3kodHJ1ZSk7XHJcbiAgICAkLmFqYXgoe1xyXG4gICAgICAgIHR5cGU6ICdQT1NUJyxcclxuICAgICAgICBhc3luYzogdHJ1ZSxcclxuICAgICAgICBkYXRhOiBKU09OLnN0cmluZ2lmeShyZXF1ZXN0KSxcclxuICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgIHVybDogdXJsLFxyXG4gICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZTogYW55KSB7XHJcbiAgICAgICAgICAgIHNob3dOZXR3b3JrQnVzeShmYWxzZSk7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzICE9IG51bGwgJiYgcmVzcG9uc2Uuc3VjY2VzcyA9PSBmYWxzZSB8fCB0eXBlb2YgKHJlc3BvbnNlKSA9PSBcInN0cmluZ1wiICYmIHJlc3BvbnNlID09ICcnKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3IgPSBcIkZlaGxlciBiZWkgZGVyIEJlYXJiZWl0dW5nIGRlciBBbmZyYWdlXCJcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5tZXNzYWdlICE9IG51bGwpIGVycm9yID0gcmVzcG9uc2UubWVzc2FnZTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoZXJyb3IgPT0gXCJOb3QgbG9nZ2VkIGluXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBzZXRUaW1lb3V0KCgpID0+IG5ld0xvZ2luKHVybCwgcmVxdWVzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKSwgMTAwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlcnJvckNhbGxiYWNrKSBlcnJvckNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjayhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICB9LFxyXG4gICAgICAgIGVycm9yOiBmdW5jdGlvbiAoanFYSFIsIG1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgc2hvd05ldHdvcmtCdXN5KGZhbHNlKTtcclxuICAgICAgICAgICAgaWYgKGVycm9yQ2FsbGJhY2spIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdGF0dXNUZXh0ID0gXCJTZXJ2ZXIgbmljaHQgZXJyZWljaGJhci5cIlxyXG4gICAgICAgICAgICAgICAgaWYgKGpxWEhSLnN0YXR1cyAhPSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdHVzVGV4dCA9IFwiXCIgKyBqcVhIUi5zdGF0dXNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVycm9yQ2FsbGJhY2sobWVzc2FnZSArIFwiOiBcIiArIHN0YXR1c1RleHQpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBzaG93TmV0d29ya0J1c3koYnVzeTogYm9vbGVhbikge1xyXG4gICAgaWYgKGJ1c3kpIHtcclxuICAgICAgICBqUXVlcnkoJy5qb19uZXR3b3JrLWJ1c3knKS5zaG93KCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGpRdWVyeSgnLmpvX25ldHdvcmstYnVzeScpLmhpZGUoKTtcclxuICAgIH1cclxufVxyXG5cclxuXHJcblxyXG4vLyBleHBvcnQgZnVuY3Rpb24gbmV3TG9naW4odXJsOiBzdHJpbmcsIHJlcXVlc3Q6IGFueSwgc3VjY2Vzc0NhbGxiYWNrOiAocmVzcG9uc2U6IGFueSkgPT4gdm9pZCxcclxuLy8gICAgIGVycm9yQ2FsbGJhY2s/OiAobWVzc2FnZTogc3RyaW5nKSA9PiB2b2lkKSB7XHJcblxyXG4vLyAgICAgaWYgKGNyZWRlbnRpYWxzLnVzZXJuYW1lID09IG51bGwpIHJldHVybjtcclxuLy8gICAgIGxldCBsb2dpblJlcXVlc3Q6IExvZ2luUmVxdWVzdCA9IHt1c2VybmFtZTogY3JlZGVudGlhbHMudXNlcm5hbWUsIHBhc3N3b3JkOiBjcmVkZW50aWFscy5wYXNzd29yZH07XHJcblxyXG4vLyAgICAgJC5hamF4KHtcclxuLy8gICAgICAgICB0eXBlOiAnUE9TVCcsXHJcbi8vICAgICAgICAgZGF0YTogSlNPTi5zdHJpbmdpZnkobG9naW5SZXF1ZXN0KSxcclxuLy8gICAgICAgICBjb250ZW50VHlwZTogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4vLyAgICAgICAgIHVybDogXCJsb2dpblwiLFxyXG4vLyAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZTogYW55KSB7XHJcbi8vICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzICE9IG51bGwgJiYgcmVzcG9uc2Uuc3VjY2VzcyA9PSBmYWxzZSB8fCB0eXBlb2YgKHJlc3BvbnNlKSA9PSBcInN0cmluZ1wiICYmIHJlc3BvbnNlID09ICcnKSB7XHJcbi8vICAgICAgICAgICAgIH0gZWxzZSB7XHJcbi8vICAgICAgICAgICAgICAgICBhamF4KHVybCwgcmVxdWVzdCwgc3VjY2Vzc0NhbGxiYWNrLCBlcnJvckNhbGxiYWNrKTtcclxuLy8gICAgICAgICAgICAgfVxyXG4vLyAgICAgICAgICAgICByZXR1cm47XHJcbi8vICAgICAgICAgfSxcclxuLy8gICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGpxWEhSLCBtZXNzYWdlKSB7XHJcbi8vIC8vICAgICAgICAgICAgYWpheCh1cmwsIHJlcXVlc3QsIHN1Y2Nlc3NDYWxsYmFjaywgZXJyb3JDYWxsYmFjayk7XHJcbi8vICAgICAgICAgfVxyXG4vLyAgICAgfSk7XHJcbi8vIH1cclxuIl19