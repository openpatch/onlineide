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
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRW1iZWRkZWRTdGFydGVyV2VicGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvZW1iZWRkZWQvRW1iZWRkZWRTdGFydGVyV2VicGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFFdkQsT0FBTyxxQkFBcUIsQ0FBQztBQUU3Qiw4QkFBOEI7QUFHOUIsTUFBTSxDQUFDO0lBRUgsSUFBSSxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztJQUU1QyxZQUFZO0lBQ1osTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkUsWUFBWTtJQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ2xCLFFBQVEsRUFBRTtZQUNOLGtCQUFrQixFQUFFO2dCQUNoQixHQUFHLEVBQUUsSUFBSTthQUNaO1NBQ0o7UUFDRCxzQkFBc0IsRUFBRSxDQUFDLHVCQUF1QixDQUFDO0tBQ3BELENBQUMsQ0FBQztJQUNILFlBQVk7SUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsRUFBRTtRQUV0QyxlQUFlLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDN0IsZUFBZSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBRTlCLENBQUMsQ0FBQyxDQUFDO0lBR0gsSUFBSSxDQUFDLE1BQU07U0FDTixNQUFNLENBQUMsR0FBRyxDQUFDLGtDQUFrQyxDQUFDO1NBQzlDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUd6QixDQUFDLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBjaGFyUHJpbWl0aXZlVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSwgZmxvYXRQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBGb3JtYXR0ZXIgfSBmcm9tIFwiLi4vbWFpbi9ndWkvRm9ybWF0dGVyLmpzXCI7XHJcbmltcG9ydCB7IFRoZW1lTWFuYWdlciB9IGZyb20gXCIuLi9tYWluL2d1aS9UaGVtZU1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbkVtYmVkZGVkIH0gZnJvbSBcIi4vTWFpbkVtYmVkZGVkLmpzXCI7XHJcbmltcG9ydCB7IEVtYmVkZGVkU3RhcnRlciB9IGZyb20gXCIuL0VtYmVkZGVkU3RhcnRlci5qc1wiO1xyXG5cclxuaW1wb3J0IFwiLi4vY3NzL2VtYmVkZGVkLmNzc1wiO1xyXG5cclxuLy8gZGVjbGFyZSBjb25zdCByZXF1aXJlOiBhbnk7XHJcblxyXG5cclxualF1ZXJ5KGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICBsZXQgZW1iZWRkZWRTdGFydGVyID0gbmV3IEVtYmVkZGVkU3RhcnRlcigpO1xyXG5cclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgd2luZG93LnJlcXVpcmUuY29uZmlnKHsgcGF0aHM6IHsgJ3ZzJzogJ2xpYi9tb25hY28tZWRpdG9yL2Rldi92cycgfSB9KTtcclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgd2luZG93LnJlcXVpcmUuY29uZmlnKHtcclxuICAgICAgICAndnMvbmxzJzoge1xyXG4gICAgICAgICAgICBhdmFpbGFibGVMYW5ndWFnZXM6IHtcclxuICAgICAgICAgICAgICAgICcqJzogJ2RlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBpZ25vcmVEdXBsaWNhdGVNb2R1bGVzOiBbXCJ2cy9lZGl0b3IvZWRpdG9yLm1haW5cIl1cclxuICAgIH0pO1xyXG4gICAgLy9AdHMtaWdub3JlXHJcbiAgICB3aW5kb3cucmVxdWlyZShbJ3ZzL2VkaXRvci9lZGl0b3IubWFpbiddLCBmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgIGVtYmVkZGVkU3RhcnRlci5pbml0RWRpdG9yKCk7XHJcbiAgICAgICAgZW1iZWRkZWRTdGFydGVyLmluaXRHVUkoKTtcclxuXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgUElYSS5Mb2FkZXJcclxuICAgICAgICAuc2hhcmVkLmFkZChcImFzc2V0cy9ncmFwaGljcy9zcHJpdGVzaGVldC5qc29uXCIpXHJcbiAgICAgICAgLmxvYWQoKCkgPT4geyB9KTtcclxuXHJcblxyXG59KTsiXX0=