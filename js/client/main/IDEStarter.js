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
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
    main.initGUI();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSURFU3RhcnRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvbWFpbi9JREVTdGFydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxXQUFXLENBQUM7QUFDakMsT0FBTyxFQUFFLHNCQUFzQixFQUFFLE1BQU0sK0RBQStELENBQUM7QUFDdkcsT0FBTyxFQUFFLHVCQUF1QixFQUFFLE1BQU0saURBQWlELENBQUM7QUFDMUYsT0FBTyxFQUFFLHlCQUF5QixFQUFFLE1BQU0sbURBQW1ELENBQUM7QUFDOUYsT0FBTyxFQUFFLHlCQUF5QixFQUFFLE1BQU0sbURBQW1ELENBQUM7QUFHOUYsTUFBTSxDQUFDO0lBRUgsSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUV0QixZQUFZO0lBQ1osTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxLQUFLLEVBQUUsRUFBRSxJQUFJLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDdkUsWUFBWTtJQUNaLE1BQU0sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQ2xCLFFBQVEsRUFBRTtZQUNOLGtCQUFrQixFQUFFO2dCQUNoQixHQUFHLEVBQUUsSUFBSTthQUNaO1NBQ0o7UUFDRCxzQkFBc0IsRUFBRSxDQUFDLHVCQUF1QixDQUFDO0tBQ3BELENBQUMsQ0FBQztJQUVILFlBQVk7SUFDWixNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsdUJBQXVCLENBQUMsRUFBRTtRQUV0QyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRXpELElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFekIsSUFBRyxJQUFJLENBQUMsWUFBWSxFQUFDO1lBQ2pCLElBQUksQ0FBQyxzQkFBc0IsR0FBRyxJQUFJLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQy9ELElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxPQUFPLEVBQUUsQ0FBQztZQUN0QyxJQUFJLENBQUMsdUJBQXVCLEdBQUcsSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsdUJBQXVCLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDdkMsSUFBSSxDQUFDLHVCQUF1QixHQUFHLElBQUkseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDbkUsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3ZDLElBQUksQ0FBQyx5QkFBeUIsR0FBRyxJQUFJLHlCQUF5QixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3JFLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUU1QztRQUNELHdCQUF3QjtJQUc1QixDQUFDLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxNQUFNO1NBQ04sTUFBTSxDQUFDLEdBQUcsQ0FBQyxrQ0FBa0MsQ0FBQztTQUM5QyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFFckIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBRW5CLENBQUMsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuL01haW4uanNcIjtcclxuaW1wb3J0IHsgU3luY2hyb25pemF0aW9uTWFuYWdlciB9IGZyb20gXCIuLi9yZXBvc2l0b3J5L3N5bmNocm9uaXplL1JlcG9zaXRvcnlTeW5jaHJvbml6YXRpb25NYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlDcmVhdGVNYW5hZ2VyIH0gZnJvbSBcIi4uL3JlcG9zaXRvcnkvdXBkYXRlL1JlcG9zaXRvcnlDcmVhdGVNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlTZXR0aW5nc01hbmFnZXIgfSBmcm9tIFwiLi4vcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBSZXBvc2l0b3J5Q2hlY2tvdXRNYW5hZ2VyIH0gZnJvbSBcIi4uL3JlcG9zaXRvcnkvdXBkYXRlL1JlcG9zaXRvcnlDaGVja291dE1hbmFnZXIuanNcIjtcclxuXHJcblxyXG5qUXVlcnkoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgIGxldCBtYWluID0gbmV3IE1haW4oKTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlLmNvbmZpZyh7IHBhdGhzOiB7ICd2cyc6ICdsaWIvbW9uYWNvLWVkaXRvci9kZXYvdnMnIH0gfSk7XHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlLmNvbmZpZyh7XHJcbiAgICAgICAgJ3ZzL25scyc6IHtcclxuICAgICAgICAgICAgYXZhaWxhYmxlTGFuZ3VhZ2VzOiB7XHJcbiAgICAgICAgICAgICAgICAnKic6ICdkZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaWdub3JlRHVwbGljYXRlTW9kdWxlczogW1widnMvZWRpdG9yL2VkaXRvci5tYWluXCJdXHJcbiAgICB9KTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIHdpbmRvdy5yZXF1aXJlKFsndnMvZWRpdG9yL2VkaXRvci5tYWluJ10sIGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgbWFpbi5pbml0RWRpdG9yKCk7XHJcbiAgICAgICAgbWFpbi5nZXRNb25hY29FZGl0b3IoKS51cGRhdGVPcHRpb25zKHsgcmVhZE9ubHk6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIG1haW4uYm90dG9tRGl2LmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgaWYobWFpbi5yZXBvc2l0b3J5T24pe1xyXG4gICAgICAgICAgICBtYWluLnN5bmNocm9uaXphdGlvbk1hbmFnZXIgPSBuZXcgU3luY2hyb25pemF0aW9uTWFuYWdlcihtYWluKTtcclxuICAgICAgICAgICAgbWFpbi5zeW5jaHJvbml6YXRpb25NYW5hZ2VyLmluaXRHVUkoKTtcclxuICAgICAgICAgICAgbWFpbi5yZXBvc2l0b3J5Q3JlYXRlTWFuYWdlciA9IG5ldyBSZXBvc2l0b3J5Q3JlYXRlTWFuYWdlcihtYWluKTtcclxuICAgICAgICAgICAgbWFpbi5yZXBvc2l0b3J5Q3JlYXRlTWFuYWdlci5pbml0R1VJKCk7XHJcbiAgICAgICAgICAgIG1haW4ucmVwb3NpdG9yeVVwZGF0ZU1hbmFnZXIgPSBuZXcgUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlcihtYWluKTtcclxuICAgICAgICAgICAgbWFpbi5yZXBvc2l0b3J5VXBkYXRlTWFuYWdlci5pbml0R1VJKCk7XHJcbiAgICAgICAgICAgIG1haW4ucmVwb3NpdG9yeUNoZWNrb3V0TWFuYWdlciA9IG5ldyBSZXBvc2l0b3J5Q2hlY2tvdXRNYW5hZ2VyKG1haW4pO1xyXG4gICAgICAgICAgICBtYWluLnJlcG9zaXRvcnlDaGVja291dE1hbmFnZXIuaW5pdEdVSSgpO1xyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gbWFpbi5sb2FkV29ya3NwYWNlKCk7XHJcblxyXG5cclxuICAgIH0pO1xyXG5cclxuICAgIFBJWEkuTG9hZGVyXHJcbiAgICAgICAgLnNoYXJlZC5hZGQoXCJhc3NldHMvZ3JhcGhpY3Mvc3ByaXRlc2hlZXQuanNvblwiKVxyXG4gICAgICAgIC5sb2FkKCgpID0+IHsgfSk7XHJcblxyXG4gICAgbWFpbi5pbml0R1VJKCk7XHJcblxyXG59KTsiXX0=