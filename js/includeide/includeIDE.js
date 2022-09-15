let base = "https://onlineide.openpatch.org/";
// includeJs(base + "lib/pixijs/pixi.js");
// includeCss(base + 'js.webpack/javaOnlineEmbedded.css');
// includeJs(base + "lib/jquery/jquery-3.3.1.js");
// includeJs(base + "lib/markdownit/markdownit.min.js");
// includeJs(base + "lib/monaco-editor/dev/vs/loader.js");
// includeJs(base + "js/runtimelibrary/graphics/SpriteLibrary.js");
// includeJs(base + "lib/howler/howler.core.min.js");
let scripts = [
    base + "lib/pixijs/pixi.js",
    base + "lib/pixi3d/pixi3d.js",
    base + 'js.webpack/javaOnlineEmbedded.css',
    base + "lib/jquery/jquery-3.3.1.js",
    base + "lib/markdownit/markdownit.min.js",
    base + "lib/monaco-editor/dev/vs/loader.js",
    base + "js/runtimelibrary/graphics/SpriteLibrary.js",
    base + "lib/howler/howler.core.min.js"
];
includeJsAndCss(scripts, () => {
    window.onload = function () {
        if (window.jo_doc.startsWith("http")) {
            $.ajax({
                url: window.jo_doc,
                type: "get",
                dataType: 'text',
                success: function (data) {
                    initScripts(data);
                },
                error: function () {
                    alert("Fehler beim Laden von " + jo_doc);
                }
            });
        }
        else {
            initScripts(window.jo_doc);
        }
    };
});
function initScripts(jo_doc) {
    let scriptPosition = jo_doc.indexOf('<script');
    let scripts = jo_doc.substr(scriptPosition);
    let config = jo_doc.substr(0, scriptPosition);
    if (config.indexOf('{') < 0) {
        config = "{}";
    }
    let htmlElement = document.getElementsByTagName('html')[0];
    let bodyElement = document.getElementsByTagName('body')[0];
    /** @type HTMLDivElement */
    let divElement = document.createElement('div');
    divElement.classList.add('java-online');
    divElement.setAttribute("data-java-online", config);
    divElement.style.margin = "0 0 0 15px";
    divElement.style.width = "calc(100% - 40px)";
    divElement.style.height = "calc(100% - 45px)";
    divElement.style.top = "15px";
    bodyElement.appendChild(divElement);
    divElement.innerHTML = scripts;
    // document.body.innerHTML = window.jo_doc;
    // divElement = document.getElementsByClassName('java-online')[0];
    htmlElement.style.height = "100%";
    htmlElement.style.margin = "0";
    bodyElement.style.height = "100%";
    bodyElement.style.margin = "0";
    window.javaOnlineDir = base;
    includeJs(base + "js.webpack/javaOnline-embedded.js");
    includeJs(base + "lib/p5.js/p5.js");
}
function includeJs(src, callback, type) {
    var script = document.createElement('script');
    if (callback) {
        script.onload = callback;
    }
    if (type) {
        script.type = type;
    }
    script.src = src;
    document.head.appendChild(script);
}
function includeCss(src) {
    var head = document.getElementsByTagName('head')[0];
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = src;
    link.media = 'all';
    head.appendChild(link);
}
function includeJsAndCss(urlList, callback) {
    if (urlList.length > 0) {
        let url = urlList.shift();
        if (url.endsWith('.js')) {
            includeJs(url, () => {
                includeJsAndCss(urlList, callback);
            });
        }
        else {
            includeCss(url);
            includeJsAndCss(urlList, callback);
        }
    }
    else {
        callback();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5jbHVkZUlERS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvaW5jbHVkZWlkZS9pbmNsdWRlSURFLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksSUFBSSxHQUFHLGtDQUFrQyxDQUFDO0FBRTlDLDBDQUEwQztBQUMxQywwREFBMEQ7QUFDMUQsa0RBQWtEO0FBQ2xELHdEQUF3RDtBQUN4RCwwREFBMEQ7QUFDMUQsbUVBQW1FO0FBQ25FLHFEQUFxRDtBQUVyRCxJQUFJLE9BQU8sR0FBRztJQUNWLElBQUksR0FBRyxvQkFBb0I7SUFDM0IsSUFBSSxHQUFHLHNCQUFzQjtJQUM3QixJQUFJLEdBQUcsbUNBQW1DO0lBQzFDLElBQUksR0FBRyw0QkFBNEI7SUFDbkMsSUFBSSxHQUFHLGtDQUFrQztJQUN6QyxJQUFJLEdBQUcsb0NBQW9DO0lBQzNDLElBQUksR0FBRyw2Q0FBNkM7SUFDcEQsSUFBSSxHQUFHLCtCQUErQjtDQUN6QyxDQUFBO0FBRUQsZUFBZSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7SUFDMUIsTUFBTSxDQUFDLE1BQU0sR0FBRztRQUNaLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDbEMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDSCxHQUFHLEVBQUUsTUFBTSxDQUFDLE1BQU07Z0JBQ2xCLElBQUksRUFBRSxLQUFLO2dCQUNYLFFBQVEsRUFBRSxNQUFNO2dCQUNoQixPQUFPLEVBQUUsVUFBVSxJQUFJO29CQUNuQixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLENBQUM7Z0JBQ0QsS0FBSyxFQUFFO29CQUNILEtBQUssQ0FBQyx3QkFBd0IsR0FBRyxNQUFNLENBQUMsQ0FBQztnQkFDN0MsQ0FBQzthQUNKLENBQUMsQ0FBQztTQUNOO2FBQU07WUFDSCxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQzlC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SUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDO0FBR0QsU0FBUyxlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVE7SUFFdEMsSUFBRyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztRQUNsQixJQUFJLEdBQUcsR0FBRyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsSUFBRyxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFDO1lBQ25CLFNBQVMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFO2dCQUNoQixlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1lBQ3ZDLENBQUMsQ0FBQyxDQUFBO1NBQ0w7YUFBTTtZQUNILFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNoQixlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3RDO0tBQ0o7U0FBTTtRQUNILFFBQVEsRUFBRSxDQUFDO0tBQ2Q7QUFFTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsibGV0IGJhc2UgPSBcImh0dHBzOi8vZW1iZWQubGVhcm5qLmRlL2luY2x1ZGUvXCI7XG5cbi8vIGluY2x1ZGVKcyhiYXNlICsgXCJsaWIvcGl4aWpzL3BpeGkuanNcIik7XG4vLyBpbmNsdWRlQ3NzKGJhc2UgKyAnanMud2VicGFjay9qYXZhT25saW5lRW1iZWRkZWQuY3NzJyk7XG4vLyBpbmNsdWRlSnMoYmFzZSArIFwibGliL2pxdWVyeS9qcXVlcnktMy4zLjEuanNcIik7XG4vLyBpbmNsdWRlSnMoYmFzZSArIFwibGliL21hcmtkb3duaXQvbWFya2Rvd25pdC5taW4uanNcIik7XG4vLyBpbmNsdWRlSnMoYmFzZSArIFwibGliL21vbmFjby1lZGl0b3IvZGV2L3ZzL2xvYWRlci5qc1wiKTtcbi8vIGluY2x1ZGVKcyhiYXNlICsgXCJqcy9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9TcHJpdGVMaWJyYXJ5LmpzXCIpO1xuLy8gaW5jbHVkZUpzKGJhc2UgKyBcImxpYi9ob3dsZXIvaG93bGVyLmNvcmUubWluLmpzXCIpO1xuXG5sZXQgc2NyaXB0cyA9IFtcbiAgICBiYXNlICsgXCJsaWIvcGl4aWpzL3BpeGkuanNcIixcbiAgICBiYXNlICsgXCJsaWIvcGl4aTNkL3BpeGkzZC5qc1wiLFxuICAgIGJhc2UgKyAnanMud2VicGFjay9qYXZhT25saW5lRW1iZWRkZWQuY3NzJyxcbiAgICBiYXNlICsgXCJsaWIvanF1ZXJ5L2pxdWVyeS0zLjMuMS5qc1wiLFxuICAgIGJhc2UgKyBcImxpYi9tYXJrZG93bml0L21hcmtkb3duaXQubWluLmpzXCIsXG4gICAgYmFzZSArIFwibGliL21vbmFjby1lZGl0b3IvZGV2L3ZzL2xvYWRlci5qc1wiLFxuICAgIGJhc2UgKyBcImpzL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1Nwcml0ZUxpYnJhcnkuanNcIixcbiAgICBiYXNlICsgXCJsaWIvaG93bGVyL2hvd2xlci5jb3JlLm1pbi5qc1wiXG5dXG5cbmluY2x1ZGVKc0FuZENzcyhzY3JpcHRzLCAoKSA9PiB7XG4gICAgd2luZG93Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5qb19kb2Muc3RhcnRzV2l0aChcImh0dHBcIikpIHtcbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdXJsOiB3aW5kb3cuam9fZG9jLFxuICAgICAgICAgICAgICAgIHR5cGU6IFwiZ2V0XCIsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGU6ICd0ZXh0JyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpbml0U2NyaXB0cyhkYXRhKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGFsZXJ0KFwiRmVobGVyIGJlaW0gTGFkZW4gdm9uIFwiICsgam9fZG9jKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGluaXRTY3JpcHRzKHdpbmRvdy5qb19kb2MpO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuXG5mdW5jdGlvbiBpbml0U2NyaXB0cyhqb19kb2MpIHtcbiAgICBsZXQgc2NyaXB0UG9zaXRpb24gPSBqb19kb2MuaW5kZXhPZignPHNjcmlwdCcpO1xuICAgIGxldCBzY3JpcHRzID0gam9fZG9jLnN1YnN0cihzY3JpcHRQb3NpdGlvbik7XG4gICAgbGV0IGNvbmZpZyA9IGpvX2RvYy5zdWJzdHIoMCwgc2NyaXB0UG9zaXRpb24pO1xuICAgIGlmIChjb25maWcuaW5kZXhPZigneycpIDwgMCkge1xuICAgICAgICBjb25maWcgPSBcInt9XCI7XG4gICAgfVxuICAgIGxldCBodG1sRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdodG1sJylbMF07XG4gICAgbGV0IGJvZHlFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2JvZHknKVswXTtcbiAgICAvKiogQHR5cGUgSFRNTERpdkVsZW1lbnQgKi9cbiAgICBsZXQgZGl2RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIGRpdkVsZW1lbnQuY2xhc3NMaXN0LmFkZCgnamF2YS1vbmxpbmUnKTtcbiAgICBkaXZFbGVtZW50LnNldEF0dHJpYnV0ZShcImRhdGEtamF2YS1vbmxpbmVcIiwgY29uZmlnKTtcbiAgICBkaXZFbGVtZW50LnN0eWxlLm1hcmdpbiA9IFwiMCAwIDAgMTVweFwiO1xuICAgIGRpdkVsZW1lbnQuc3R5bGUud2lkdGggPSBcImNhbGMoMTAwJSAtIDQwcHgpXCI7XG4gICAgZGl2RWxlbWVudC5zdHlsZS5oZWlnaHQgPSBcImNhbGMoMTAwJSAtIDQ1cHgpXCI7XG4gICAgZGl2RWxlbWVudC5zdHlsZS50b3AgPSBcIjE1cHhcIjtcbiAgICBib2R5RWxlbWVudC5hcHBlbmRDaGlsZChkaXZFbGVtZW50KTtcbiAgICBkaXZFbGVtZW50LmlubmVySFRNTCA9IHNjcmlwdHM7XG4gICAgLy8gZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB3aW5kb3cuam9fZG9jO1xuICAgIC8vIGRpdkVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdqYXZhLW9ubGluZScpWzBdO1xuICAgIGh0bWxFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgIGh0bWxFbGVtZW50LnN0eWxlLm1hcmdpbiA9IFwiMFwiO1xuICAgIGJvZHlFbGVtZW50LnN0eWxlLmhlaWdodCA9IFwiMTAwJVwiO1xuICAgIGJvZHlFbGVtZW50LnN0eWxlLm1hcmdpbiA9IFwiMFwiO1xuICAgIHdpbmRvdy5qYXZhT25saW5lRGlyID0gYmFzZTtcbiAgICBpbmNsdWRlSnMoYmFzZSArIFwianMud2VicGFjay9qYXZhT25saW5lLWVtYmVkZGVkLmpzXCIpO1xuICAgIGluY2x1ZGVKcyhiYXNlICsgXCJsaWIvcDUuanMvcDUuanNcIik7XG5cbn1cblxuZnVuY3Rpb24gaW5jbHVkZUpzKHNyYywgY2FsbGJhY2ssIHR5cGUpIHtcbiAgICB2YXIgc2NyaXB0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgaWYgKGNhbGxiYWNrKSB7XG4gICAgICAgIHNjcmlwdC5vbmxvYWQgPSBjYWxsYmFjaztcbiAgICB9XG5cbiAgICBpZiAodHlwZSkge1xuICAgICAgICBzY3JpcHQudHlwZSA9IHR5cGU7XG4gICAgfVxuXG4gICAgc2NyaXB0LnNyYyA9IHNyYztcblxuICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoc2NyaXB0KTtcbn1cblxuZnVuY3Rpb24gaW5jbHVkZUNzcyhzcmMpIHtcbiAgICB2YXIgaGVhZCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF07XG4gICAgdmFyIGxpbmsgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgbGluay5yZWwgPSAnc3R5bGVzaGVldCc7XG4gICAgbGluay50eXBlID0gJ3RleHQvY3NzJztcbiAgICBsaW5rLmhyZWYgPSBzcmM7XG4gICAgbGluay5tZWRpYSA9ICdhbGwnO1xuICAgIGhlYWQuYXBwZW5kQ2hpbGQobGluayk7XG59XG5cblxuZnVuY3Rpb24gaW5jbHVkZUpzQW5kQ3NzKHVybExpc3QsIGNhbGxiYWNrKXtcblxuICAgIGlmKHVybExpc3QubGVuZ3RoID4gMCl7XG4gICAgICAgIGxldCB1cmwgPSB1cmxMaXN0LnNoaWZ0KCk7XG4gICAgICAgIGlmKHVybC5lbmRzV2l0aCgnLmpzJykpe1xuICAgICAgICAgICAgaW5jbHVkZUpzKHVybCwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGluY2x1ZGVKc0FuZENzcyh1cmxMaXN0LCBjYWxsYmFjayk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaW5jbHVkZUNzcyh1cmwpO1xuICAgICAgICAgICAgaW5jbHVkZUpzQW5kQ3NzKHVybExpc3QsIGNhbGxiYWNrKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuXG59Il19
