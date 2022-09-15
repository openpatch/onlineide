let base = "https://learnj.de/javaonline/";
// includeJs("lib/monaco-editor/dev/vs/editor/editor.main.js");
// includeJs("lib/monaco-editor/dev/vs/editor/editor.main.nls.de.js");
includeCss(base + 'js.webpack/javaOnlineEmbedded.css');
includeJs(base + "lib/jquery/jquery-3.3.1.js");
includeJs(base + "lib/markdownit/markdownit.min.js");
includeJs(base + "lib/monaco-editor/dev/vs/loader.js");
includeJs(base + "js/runtimelibrary/graphics/SpriteLibrary.js");
window.onload = function () {
    // debugger;
    // let iframes = window.parent.document.getElementsByTagName('iframe');
    // for(let i = 0; i < iframes.length; i++){
        //     let iframe = iframes[i];
        //     if(iframe.contentWindow == this){
            //         document.body.innerHTML = iframe.textContent;
            //     }
            // }
            // document.body.innerHTML = window.frameElement.textContent;
            document.body.innerHTML = window.jo_doc;
            htmlElement = document.getElementsByTagName('html')[0];
            bodyElement = document.getElementsByTagName('body')[0];
            divElement = document.getElementsByClassName('java-online')[0];
            htmlElement.style.height = "100%";
            htmlElement.style.margin = "0";
            bodyElement.style.height = "100%";
            bodyElement.style.margin = "0";
            divElement.style.margin = "0 0 0 10px";
            divElement.style.width = "calc(100% - 35px)";
            divElement.style.height = "calc(100% - 40px)";
            divElement.style.top = "15px";
            window.javaOnlineDir = "https://learnj.de/javaonline/";
            includeJs(base + "js.webpack/javaOnline-embedded.js");
            includeJs(base + "lib/pixijs/pixi.js");
            includeJs(base + "lib/howler/howler.core.min.js");
            includeJs(base + "lib/p5.js/p5.js");
        };
// <link rel="preload" href="lib/monaco-editor/dev/vs/editor/editor.main.js" as="script">
// <link rel="preload" href="lib/monaco-editor/dev/vs/editor/editor.main.nls.de.js" as="script">
// <script src="lib/pixijs/pixi.js"></script>
// <link rel='stylesheet' type='text/css' media='screen' href='js.webpack/javaOnlineEmbedded.css'>
// <script src="lib/jquery/jquery-3.3.1.js"></script>
// <script src="lib/markdownit/markdownit.min.js"></script>
// <script src="lib/monaco-editor/dev/vs/loader.js"></script>
// <script src="js/runtimelibrary/graphics/SpriteLibrary.js"></script>
// <script src="lib/howler/howler.core.min.js"></script>
// <script src="lib/p5.js/p5.js"></script>
// <script type="module" src="js.webpack/javaOnline-embedded.js"></script>
function includeJs(src, callback, type) {
    var script = document.createElement('script');
    if (callback) {
        script.onload = function () {
            //do stuff with the script
        };
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5jbHVkZUlERS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0L2luY2x1ZGVJREUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsSUFBSSxJQUFJLEdBQUcsK0JBQStCLENBQUM7QUFFM0MsK0RBQStEO0FBQy9ELHNFQUFzRTtBQUN0RSxTQUFTLENBQUMsSUFBSSxHQUFHLG9CQUFvQixDQUFDLENBQUM7QUFDdkMsVUFBVSxDQUFDLElBQUksR0FBRyxtQ0FBbUMsQ0FBQyxDQUFDO0FBQ3ZELFNBQVMsQ0FBQyxJQUFJLEdBQUcsNEJBQTRCLENBQUMsQ0FBQztBQUMvQyxTQUFTLENBQUMsSUFBSSxHQUFHLGtDQUFrQyxDQUFDLENBQUM7QUFDckQsU0FBUyxDQUFDLElBQUksR0FBRyxvQ0FBb0MsQ0FBQyxDQUFDO0FBQ3ZELFNBQVMsQ0FBQyxJQUFJLEdBQUcsNkNBQTZDLENBQUMsQ0FBQztBQUNoRSxTQUFTLENBQUMsSUFBSSxHQUFHLCtCQUErQixDQUFDLENBQUM7QUFDbEQsU0FBUyxDQUFDLElBQUksR0FBRyxpQkFBaUIsQ0FBQyxDQUFDO0FBRXBDLE1BQU0sQ0FBQyxNQUFNLEdBQUc7SUFDWixZQUFZO0lBQ1osdUVBQXVFO0lBQ3ZFLDJDQUEyQztJQUMzQywrQkFBK0I7SUFDL0Isd0NBQXdDO0lBQ3hDLHdEQUF3RDtJQUN4RCxRQUFRO0lBQ1IsSUFBSTtJQUVKLDZEQUE2RDtJQUM3RCxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDO0lBQ3hDLFdBQVcsR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkQsV0FBVyxHQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxVQUFVLEdBQUcsUUFBUSxDQUFDLHNCQUFzQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQy9ELFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztJQUNsQyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7SUFDL0IsV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ2xDLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztJQUMvQixVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7SUFDdkMsVUFBVSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsbUJBQW1CLENBQUM7SUFDN0MsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsbUJBQW1CLENBQUM7SUFFOUMsTUFBTSxDQUFDLGFBQWEsR0FBRywrQkFBK0IsQ0FBQztJQUN2RCxTQUFTLENBQUMsSUFBSSxHQUFHLG1DQUFtQyxDQUFDLENBQUM7QUFDMUQsQ0FBQyxDQUFDO0FBRUYseUZBQXlGO0FBQ3pGLGdHQUFnRztBQUVoRyw2Q0FBNkM7QUFFN0Msa0dBQWtHO0FBQ2xHLHFEQUFxRDtBQUNyRCwyREFBMkQ7QUFDM0QsNkRBQTZEO0FBQzdELHNFQUFzRTtBQUN0RSx3REFBd0Q7QUFDeEQsMENBQTBDO0FBRTFDLDBFQUEwRTtBQUcxRSxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLElBQUk7SUFDbEMsSUFBSSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QyxJQUFJLFFBQVEsRUFBRTtRQUNWLE1BQU0sQ0FBQyxNQUFNLEdBQUc7WUFDWiwwQkFBMEI7UUFDOUIsQ0FBQyxDQUFDO0tBQ0w7SUFFRCxJQUFJLElBQUksRUFBRTtRQUNOLE1BQU0sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0tBQ3RCO0lBRUQsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFFakIsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDdEMsQ0FBQztBQUVELFNBQVMsVUFBVSxDQUFDLEdBQUc7SUFDbkIsSUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3BELElBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDMUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxZQUFZLENBQUM7SUFDeEIsSUFBSSxDQUFDLElBQUksR0FBRyxVQUFVLENBQUM7SUFDdkIsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7SUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiXG5sZXQgYmFzZSA9IFwiaHR0cHM6Ly9sZWFybmouZGUvamF2YW9ubGluZS9cIjtcblxuLy8gaW5jbHVkZUpzKFwibGliL21vbmFjby1lZGl0b3IvZGV2L3ZzL2VkaXRvci9lZGl0b3IubWFpbi5qc1wiKTtcbi8vIGluY2x1ZGVKcyhcImxpYi9tb25hY28tZWRpdG9yL2Rldi92cy9lZGl0b3IvZWRpdG9yLm1haW4ubmxzLmRlLmpzXCIpO1xuaW5jbHVkZUpzKGJhc2UgKyBcImxpYi9waXhpanMvcGl4aS5qc1wiKTtcbmluY2x1ZGVDc3MoYmFzZSArICdqcy53ZWJwYWNrL2phdmFPbmxpbmVFbWJlZGRlZC5jc3MnKTtcbmluY2x1ZGVKcyhiYXNlICsgXCJsaWIvanF1ZXJ5L2pxdWVyeS0zLjMuMS5qc1wiKTtcbmluY2x1ZGVKcyhiYXNlICsgXCJsaWIvbWFya2Rvd25pdC9tYXJrZG93bml0Lm1pbi5qc1wiKTtcbmluY2x1ZGVKcyhiYXNlICsgXCJsaWIvbW9uYWNvLWVkaXRvci9kZXYvdnMvbG9hZGVyLmpzXCIpO1xuaW5jbHVkZUpzKGJhc2UgKyBcImpzL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1Nwcml0ZUxpYnJhcnkuanNcIik7XG5pbmNsdWRlSnMoYmFzZSArIFwibGliL2hvd2xlci9ob3dsZXIuY29yZS5taW4uanNcIik7XG5pbmNsdWRlSnMoYmFzZSArIFwibGliL3A1LmpzL3A1LmpzXCIpO1xuXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKXtcbiAgICAvLyBkZWJ1Z2dlcjtcbiAgICAvLyBsZXQgaWZyYW1lcyA9IHdpbmRvdy5wYXJlbnQuZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2lmcmFtZScpO1xuICAgIC8vIGZvcihsZXQgaSA9IDA7IGkgPCBpZnJhbWVzLmxlbmd0aDsgaSsrKXtcbiAgICAvLyAgICAgbGV0IGlmcmFtZSA9IGlmcmFtZXNbaV07XG4gICAgLy8gICAgIGlmKGlmcmFtZS5jb250ZW50V2luZG93ID09IHRoaXMpe1xuICAgIC8vICAgICAgICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSBpZnJhbWUudGV4dENvbnRlbnQ7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBkb2N1bWVudC5ib2R5LmlubmVySFRNTCA9IHdpbmRvdy5mcmFtZUVsZW1lbnQudGV4dENvbnRlbnQ7XG4gICAgZG9jdW1lbnQuYm9keS5pbm5lckhUTUwgPSB3aW5kb3cuam9fZG9jO1xuICAgIGh0bWxFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2h0bWwnKVswXTtcbiAgICBib2R5RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdib2R5JylbMF07XG4gICAgZGl2RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2phdmEtb25saW5lJylbMF07XG4gICAgaHRtbEVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gICAgaHRtbEVsZW1lbnQuc3R5bGUubWFyZ2luID0gXCIwXCI7XG4gICAgYm9keUVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCIxMDAlXCI7XG4gICAgYm9keUVsZW1lbnQuc3R5bGUubWFyZ2luID0gXCIwXCI7XG4gICAgZGl2RWxlbWVudC5zdHlsZS5tYXJnaW4gPSBcIjAgMCAwIDEwcHhcIjtcbiAgICBkaXZFbGVtZW50LnN0eWxlLndpZHRoID0gXCJjYWxjKDEwMCUgLSAzMHB4KVwiO1xuICAgIGRpdkVsZW1lbnQuc3R5bGUuaGVpZ2h0ID0gXCJjYWxjKDEwMCUgLSAzMHB4KVwiO1xuXG4gICAgd2luZG93LmphdmFPbmxpbmVEaXIgPSBcImh0dHBzOi8vbGVhcm5qLmRlL2phdmFvbmxpbmUvXCI7XG4gICAgaW5jbHVkZUpzKGJhc2UgKyBcImpzLndlYnBhY2svamF2YU9ubGluZS1lbWJlZGRlZC5qc1wiKTtcbn07XG5cbi8vIDxsaW5rIHJlbD1cInByZWxvYWRcIiBocmVmPVwibGliL21vbmFjby1lZGl0b3IvZGV2L3ZzL2VkaXRvci9lZGl0b3IubWFpbi5qc1wiIGFzPVwic2NyaXB0XCI+XG4vLyA8bGluayByZWw9XCJwcmVsb2FkXCIgaHJlZj1cImxpYi9tb25hY28tZWRpdG9yL2Rldi92cy9lZGl0b3IvZWRpdG9yLm1haW4ubmxzLmRlLmpzXCIgYXM9XCJzY3JpcHRcIj5cblxuLy8gPHNjcmlwdCBzcmM9XCJsaWIvcGl4aWpzL3BpeGkuanNcIj48L3NjcmlwdD5cblxuLy8gPGxpbmsgcmVsPSdzdHlsZXNoZWV0JyB0eXBlPSd0ZXh0L2NzcycgbWVkaWE9J3NjcmVlbicgaHJlZj0nanMud2VicGFjay9qYXZhT25saW5lRW1iZWRkZWQuY3NzJz5cbi8vIDxzY3JpcHQgc3JjPVwibGliL2pxdWVyeS9qcXVlcnktMy4zLjEuanNcIj48L3NjcmlwdD5cbi8vIDxzY3JpcHQgc3JjPVwibGliL21hcmtkb3duaXQvbWFya2Rvd25pdC5taW4uanNcIj48L3NjcmlwdD5cbi8vIDxzY3JpcHQgc3JjPVwibGliL21vbmFjby1lZGl0b3IvZGV2L3ZzL2xvYWRlci5qc1wiPjwvc2NyaXB0PlxuLy8gPHNjcmlwdCBzcmM9XCJqcy9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9TcHJpdGVMaWJyYXJ5LmpzXCI+PC9zY3JpcHQ+XG4vLyA8c2NyaXB0IHNyYz1cImxpYi9ob3dsZXIvaG93bGVyLmNvcmUubWluLmpzXCI+PC9zY3JpcHQ+XG4vLyA8c2NyaXB0IHNyYz1cImxpYi9wNS5qcy9wNS5qc1wiPjwvc2NyaXB0PlxuXG4vLyA8c2NyaXB0IHR5cGU9XCJtb2R1bGVcIiBzcmM9XCJqcy53ZWJwYWNrL2phdmFPbmxpbmUtZW1iZWRkZWQuanNcIj48L3NjcmlwdD5cblxuXG5mdW5jdGlvbiBpbmNsdWRlSnMoc3JjLCBjYWxsYmFjaywgdHlwZSkge1xuICAgIHZhciBzY3JpcHQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgICAgc2NyaXB0Lm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vZG8gc3R1ZmYgd2l0aCB0aGUgc2NyaXB0XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKHR5cGUpIHtcbiAgICAgICAgc2NyaXB0LnR5cGUgPSB0eXBlO1xuICAgIH1cblxuICAgIHNjcmlwdC5zcmMgPSBzcmM7XG5cbiAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKHNjcmlwdCk7XG59XG5cbmZ1bmN0aW9uIGluY2x1ZGVDc3Moc3JjKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnaGVhZCcpWzBdO1xuICAgIHZhciBsaW5rID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgIGxpbmsucmVsID0gJ3N0eWxlc2hlZXQnO1xuICAgIGxpbmsudHlwZSA9ICd0ZXh0L2Nzcyc7XG4gICAgbGluay5ocmVmID0gc3JjO1xuICAgIGxpbmsubWVkaWEgPSAnYWxsJztcbiAgICBoZWFkLmFwcGVuZENoaWxkKGxpbmspO1xufSJdfQ==