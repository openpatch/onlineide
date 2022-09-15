import { EmbeddedStarter } from "./EmbeddedStarter.js";
import "../css/embedded.css";
// declare const require: any;
jQuery(function () {
    let embeddedStarter = new EmbeddedStarter();
    //@ts-ignore
    window.require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' } });
    //@ts-ignore
    window.require.config({
        'vs/nls': {
            availableLanguages: {
                '*': 'de'
            }
        },
        ignoreDuplicateModules: ["vs/editor/editor.main"]
    });
    //@ts-ignore
    window.require(['vs/editor/editor.main'], function () {
        embeddedStarter.initEditor();
        embeddedStarter.initGUI();
    });
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW1iZWRkZWRTdGFydGVyV2VicGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvZW1iZWRkZWQvRW1iZWRkZWRTdGFydGVyV2VicGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFHdkQsT0FBTyxxQkFBcUIsQ0FBQztBQUU3Qiw4QkFBOEI7QUFHOUIsTUFBTSxDQUFDO0lBRUgsSUFBSSxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztJQUU1QyxZQUFZO0lBQ1osTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkUsWUFBWTtJQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ2xCLFFBQVEsRUFBRTtZQUNOLGtCQUFrQixFQUFFO2dCQUNoQixHQUFHLEVBQUUsSUFBSTthQUNaO1NBQ0o7UUFDRCxzQkFBc0IsRUFBRSxDQUFDLHVCQUF1QixDQUFDO0tBQ3BELENBQUMsQ0FBQztJQUNILFlBQVk7SUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsRUFBRTtRQUV0QyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDN0IsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRTlCLENBQUMsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUE7SUFDbkQsSUFBSSxDQUFDLE1BQU07U0FDTixNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDO1NBQzlDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUd6QixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBjaGFyUHJpbWl0aXZlVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSwgZmxvYXRQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBGb3JtYXR0ZXIgfSBmcm9tIFwiLi4vbWFpbi9ndWkvRm9ybWF0dGVyLmpzXCI7XHJcbmltcG9ydCB7IFRoZW1lTWFuYWdlciB9IGZyb20gXCIuLi9tYWluL2d1aS9UaGVtZU1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbkVtYmVkZGVkIH0gZnJvbSBcIi4vTWFpbkVtYmVkZGVkLmpzXCI7XHJcbmltcG9ydCB7IEVtYmVkZGVkU3RhcnRlciB9IGZyb20gXCIuL0VtYmVkZGVkU3RhcnRlci5qc1wiO1xyXG5cclxuXHJcbmltcG9ydCBcIi4uL2Nzcy9lbWJlZGRlZC5jc3NcIjtcclxuXHJcbi8vIGRlY2xhcmUgY29uc3QgcmVxdWlyZTogYW55O1xyXG5cclxuXHJcbmpRdWVyeShmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgbGV0IGVtYmVkZGVkU3RhcnRlciA9IG5ldyBFbWJlZGRlZFN0YXJ0ZXIoKTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlLmNvbmZpZyh7IHBhdGhzOiB7ICd2cyc6ICdsaWIvbW9uYWNvLWVkaXRvci9kZXYvdnMnIH0gfSk7XHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlLmNvbmZpZyh7XHJcbiAgICAgICAgJ3ZzL25scyc6IHtcclxuICAgICAgICAgICAgYXZhaWxhYmxlTGFuZ3VhZ2VzOiB7XHJcbiAgICAgICAgICAgICAgICAnKic6ICdkZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaWdub3JlRHVwbGljYXRlTW9kdWxlczogW1widnMvZWRpdG9yL2VkaXRvci5tYWluXCJdXHJcbiAgICB9KTtcclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgd2luZG93LnJlcXVpcmUoWyd2cy9lZGl0b3IvZWRpdG9yLm1haW4nXSwgZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICAgICBlbWJlZGRlZFN0YXJ0ZXIuaW5pdEVkaXRvcigpO1xyXG4gICAgICAgIGVtYmVkZGVkU3RhcnRlci5pbml0R1VJKCk7XHJcblxyXG4gICAgfSk7XHJcblxyXG4gICAgUElYSS5zZXR0aW5ncy5TQ0FMRV9NT0RFID0gUElYSS5TQ0FMRV9NT0RFUy5ORUFSRVNUXHJcbiAgICBQSVhJLkxvYWRlclxyXG4gICAgICAgIC5zaGFyZWQuYWRkKFwiYXNzZXRzL2dyYXBoaWNzL3Nwcml0ZXNoZWV0Lmpzb25cIilcclxuICAgICAgICAubG9hZCgoKSA9PiB7IH0pO1xyXG5cclxuXHJcbn0pOyJdfQ==