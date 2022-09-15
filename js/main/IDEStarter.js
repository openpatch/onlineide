import { Main } from "./Main.js";
import { SynchronizationManager } from "../repository/synchronize/RepositorySynchronizationManager.js";
import { RepositoryCreateManager } from "../repository/update/RepositoryCreateManager.js";
import { RepositorySettingsManager } from "../repository/update/RepositorySettingsManager.js";
import { RepositoryCheckoutManager } from "../repository/update/RepositoryCheckoutManager.js";
jQuery(function () {
    let main = new Main();
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
        main.initEditor();
        main.getMonacoEditor().updateOptions({ readOnly: true });
        main.bottomDiv.initGUI();
        main.checkStartupComplete();
        if (main.repositoryOn) {
            main.synchronizationManager = new SynchronizationManager(main);
            main.synchronizationManager.initGUI();
            main.repositoryCreateManager = new RepositoryCreateManager(main);
            main.repositoryCreateManager.initGUI();
            main.repositoryUpdateManager = new RepositorySettingsManager(main);
            main.repositoryUpdateManager.initGUI();
            main.repositoryCheckoutManager = new RepositoryCheckoutManager(main);
            main.repositoryCheckoutManager.initGUI();
        }
        // main.loadWorkspace();
    });
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.Loader
        .shared.add("spritesheet", "assets/graphics/spritesheet.json")
        .add("steve", "assets/graphics/robot/minecraft_steve/scene.gltf")
        .load(() => { });
    main.initGUI();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSURFU3RhcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvbWFpbi9JREVTdGFydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sK0RBQStELENBQUM7QUFDdkcsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0saURBQWlELENBQUM7QUFDMUYsT0FBTyxFQUFFLHlCQUF5QixFQUFFLE1BQU0sbURBQW1ELENBQUM7QUFDOUYsT0FBTyxFQUFFLHlCQUF5QixFQUFFLE1BQU0sbURBQW1ELENBQUM7QUFHOUYsTUFBTSxDQUFDO0lBRUgsSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUV0QixZQUFZO0lBQ1osTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkUsWUFBWTtJQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ2xCLFFBQVEsRUFBRTtZQUNOLGtCQUFrQixFQUFFO2dCQUNoQixHQUFHLEVBQUUsSUFBSTthQUNaO1NBQ0o7UUFDRCxzQkFBc0IsRUFBRSxDQUFDLHVCQUF1QixDQUFDO0tBQ3BELENBQUMsQ0FBQztJQUVILFlBQVk7SUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsRUFBRTtRQUV0QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXpELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLG9CQUFvQixFQUFFLENBQUM7UUFFNUIsSUFBRyxJQUFJLENBQUMsWUFBWSxFQUFDO1lBQ2pCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUU1QztRQUNELHdCQUF3QjtJQUc1QixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDO0lBQ3BELElBQUksQ0FBQyxNQUFNO1NBQ1YsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsa0NBQWtDLENBQUM7U0FDN0QsR0FBRyxDQUFDLE9BQU8sRUFBRSxrREFBa0QsQ0FBQztTQUNoRSxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFakIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBRW5CLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuL01haW4uanNcIjtcclxuaW1wb3J0IHsgU3luY2hyb25pemF0aW9uTWFuYWdlciB9IGZyb20gXCIuLi9yZXBvc2l0b3J5L3N5bmNocm9uaXplL1JlcG9zaXRvcnlTeW5jaHJvbml6YXRpb25NYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlDcmVhdGVNYW5hZ2VyIH0gZnJvbSBcIi4uL3JlcG9zaXRvcnkvdXBkYXRlL1JlcG9zaXRvcnlDcmVhdGVNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlTZXR0aW5nc01hbmFnZXIgfSBmcm9tIFwiLi4vcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBSZXBvc2l0b3J5Q2hlY2tvdXRNYW5hZ2VyIH0gZnJvbSBcIi4uL3JlcG9zaXRvcnkvdXBkYXRlL1JlcG9zaXRvcnlDaGVja291dE1hbmFnZXIuanNcIjtcclxuXHJcblxyXG5qUXVlcnkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGxldCBtYWluID0gbmV3IE1haW4oKTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlLmNvbmZpZyh7IHBhdGhzOiB7ICd2cyc6ICdsaWIvbW9uYWNvLWVkaXRvci9kZXYvdnMnIH0gfSk7XHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlLmNvbmZpZyh7XHJcbiAgICAgICAgJ3ZzL25scyc6IHtcclxuICAgICAgICAgICAgYXZhaWxhYmxlTGFuZ3VhZ2VzOiB7XHJcbiAgICAgICAgICAgICAgICAnKic6ICdkZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaWdub3JlRHVwbGljYXRlTW9kdWxlczogW1widnMvZWRpdG9yL2VkaXRvci5tYWluXCJdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlKFsndnMvZWRpdG9yL2VkaXRvci5tYWluJ10sIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgbWFpbi5pbml0RWRpdG9yKCk7XHJcbiAgICAgICAgbWFpbi5nZXRNb25hY29FZGl0b3IoKS51cGRhdGVPcHRpb25zKHsgcmVhZE9ubHk6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIG1haW4uYm90dG9tRGl2LmluaXRHVUkoKTtcclxuICAgICAgICBtYWluLmNoZWNrU3RhcnR1cENvbXBsZXRlKCk7XHJcblxyXG4gICAgICAgIGlmKG1haW4ucmVwb3NpdG9yeU9uKXtcclxuICAgICAgICAgICAgbWFpbi5zeW5jaHJvbml6YXRpb25NYW5hZ2VyID0gbmV3IFN5bmNocm9uaXphdGlvbk1hbmFnZXIobWFpbik7XHJcbiAgICAgICAgICAgIG1haW4uc3luY2hyb25pemF0aW9uTWFuYWdlci5pbml0R1VJKCk7XHJcbiAgICAgICAgICAgIG1haW4ucmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIgPSBuZXcgUmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIobWFpbik7XHJcbiAgICAgICAgICAgIG1haW4ucmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIuaW5pdEdVSSgpO1xyXG4gICAgICAgICAgICBtYWluLnJlcG9zaXRvcnlVcGRhdGVNYW5hZ2VyID0gbmV3IFJlcG9zaXRvcnlTZXR0aW5nc01hbmFnZXIobWFpbik7XHJcbiAgICAgICAgICAgIG1haW4ucmVwb3NpdG9yeVVwZGF0ZU1hbmFnZXIuaW5pdEdVSSgpO1xyXG4gICAgICAgICAgICBtYWluLnJlcG9zaXRvcnlDaGVja291dE1hbmFnZXIgPSBuZXcgUmVwb3NpdG9yeUNoZWNrb3V0TWFuYWdlcihtYWluKTtcclxuICAgICAgICAgICAgbWFpbi5yZXBvc2l0b3J5Q2hlY2tvdXRNYW5hZ2VyLmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIG1haW4ubG9hZFdvcmtzcGFjZSgpO1xyXG5cclxuICAgICAgICBcclxuICAgIH0pO1xyXG4gICAgXHJcbiAgICBQSVhJLnNldHRpbmdzLlNDQUxFX01PREUgPSBQSVhJLlNDQUxFX01PREVTLk5FQVJFU1Q7XHJcbiAgICBQSVhJLkxvYWRlclxyXG4gICAgLnNoYXJlZC5hZGQoXCJzcHJpdGVzaGVldFwiLCBcImFzc2V0cy9ncmFwaGljcy9zcHJpdGVzaGVldC5qc29uXCIpXHJcbiAgICAuYWRkKFwic3RldmVcIiwgXCJhc3NldHMvZ3JhcGhpY3Mvcm9ib3QvbWluZWNyYWZ0X3N0ZXZlL3NjZW5lLmdsdGZcIilcclxuICAgIC5sb2FkKCgpID0+IHsgfSk7XHJcbiAgICBcclxuICAgIG1haW4uaW5pdEdVSSgpO1xyXG5cclxufSk7Il19