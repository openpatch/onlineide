import { AccordionPanel } from "./Accordion.js";
import { ajax } from "../../communication/AjaxHelper.js";
import { Helper } from "./Helper.js";
export class TeacherExplorer {
    constructor(main, classData) {
        this.main = main;
        this.classData = classData;
    }
    removePanels() {
        this.classPanel.remove();
        this.studentPanel.remove();
    }
    initGUI() {
        this.initStudentPanel();
        this.initClassPanel();
        this.renderClasses(this.classData);
    }
    initStudentPanel() {
        let that = this;
        this.studentPanel = new AccordionPanel(this.main.projectExplorer.accordion, "Schüler/innen", "2", null, "", "student", false, false, "student", false, []);
        this.studentPanel.selectCallback = (ae) => {
            that.main.networkManager.sendUpdates(() => {
                let request = {
                    ws_userId: ae.id,
                    userId: this.main.user.id,
                    language: 0
                };
                ajax("getWorkspaces", request, (response) => {
                    if (response.success == true) {
                        if (that.main.workspacesOwnerId == that.main.user.id) {
                            that.ownWorkspaces = that.main.workspaceList.slice();
                            that.currentOwnWorkspace = that.main.currentWorkspace;
                        }
                        that.main.restoreWorkspaces(response.workspaces, false);
                        that.main.workspacesOwnerId = ae.id;
                        that.main.projectExplorer.setExplorerColor("rgba(255, 0, 0, 0.2");
                        that.main.projectExplorer.$homeAction.show();
                        Helper.showHelper("homeButtonHelper", this.main);
                        that.main.bottomDiv.showHomeworkTab();
                        that.main.bottomDiv.homeworkManager.attachToWorkspaces(that.main.workspaceList);
                    }
                    this.main.networkManager.updateFrequencyInSeconds = this.main.networkManager.teacherUpdateFrequencyInSeconds;
                    this.main.networkManager.secondsTillNextUpdate = this.main.networkManager.teacherUpdateFrequencyInSeconds;
                });
            });
        };
    }
    restoreOwnWorkspaces() {
        let main = this.main;
        // main.monaco.setModel(monaco.editor.createModel("Keine Datei vorhanden.", "text"));
        main.getMonacoEditor().updateOptions({ readOnly: true });
        main.workspaceList = this.ownWorkspaces;
        main.currentWorkspace = this.currentOwnWorkspace;
        main.workspacesOwnerId = main.user.id;
        main.projectExplorer.setExplorerColor(null);
        main.projectExplorer.renderWorkspaces(main.workspaceList);
        if (main.currentWorkspace == null && main.workspaceList.length > 0) {
            main.currentWorkspace = main.workspaceList[0];
        }
        if (main.currentWorkspace != null) {
            main.projectExplorer.setWorkspaceActive(main.currentWorkspace, true);
        }
        this.studentPanel.select(null, false);
    }
    initClassPanel() {
        let that = this;
        this.classPanel = new AccordionPanel(this.main.projectExplorer.accordion, "Klassen", "1", null, "", "class", false, false, "class", false, []);
        this.classPanel.selectCallback = (ea) => {
            that.main.networkManager.sendUpdates(() => {
                let classData = ea;
                if (classData != null) {
                    this.renderStudents(classData.students);
                }
            });
        };
    }
    renderStudents(userDataList) {
        this.studentPanel.clear();
        userDataList.sort((a, b) => {
            if (a.familienname > b.familienname)
                return -1;
            if (b.familienname > a.familienname)
                return 1;
            if (a.rufname > b.rufname)
                return -1;
            if (b.rufname > a.rufname)
                return 1;
            return 0;
        });
        for (let i = 0; i < userDataList.length; i++) {
            let ud = userDataList[i];
            let ae = {
                name: ud.familienname + ", " + ud.rufname,
                sortName: ud.familienname + " " + ud.rufname,
                externalElement: ud,
                isFolder: false,
                path: []
            };
            this.studentPanel.addElement(ae, true);
        }
    }
    renderClasses(classDataList) {
        this.studentPanel.clear();
        classDataList.sort((a, b) => {
            if (a.name > b.name)
                return 1;
            if (b.name > a.name)
                return -1;
            return 0;
        });
        for (let cd of classDataList) {
            let ae = {
                name: cd.name,
                externalElement: cd,
                isFolder: false,
                path: []
            };
            this.classPanel.addElement(ae, true);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVhY2hlckV4cGxvcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9UZWFjaGVyRXhwbG9yZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGNBQWMsRUFBb0IsTUFBTSxnQkFBZ0IsQ0FBQztBQUdsRSxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFFekQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUVyQyxNQUFNLE9BQU8sZUFBZTtJQVN4QixZQUFvQixJQUFVLEVBQVUsU0FBc0I7UUFBMUMsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUFVLGNBQVMsR0FBVCxTQUFTLENBQWE7SUFFOUQsQ0FBQztJQUVELFlBQVk7UUFDUixJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELE9BQU87UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztRQUV4QixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFFdEIsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFdkMsQ0FBQztJQUVELGdCQUFnQjtRQUVaLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUVoQixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFDdEUsZUFBZSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQzFCLEVBQUUsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRXZELElBQUksQ0FBQyxZQUFZLENBQUMsY0FBYyxHQUFHLENBQUMsRUFBWSxFQUFF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LElBQUk7Z0JBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQztZQUMvQixPQUFPLENBQUMsQ0FBQztRQUNiLENBQUMsQ0FBQyxDQUFBO1FBRUYsS0FBSyxJQUFJLEVBQUUsSUFBSSxhQUFhLEVBQUU7WUFDMUIsSUFBSSxFQUFFLEdBQXFCO2dCQUN2QixJQUFJLEVBQUUsRUFBRSxDQUFDLElBQUk7Z0JBQ2IsZUFBZSxFQUFFLEVBQUU7Z0JBQ25CLFFBQVEsRUFBRSxLQUFLO2dCQUNmLElBQUksRUFBRSxFQUFFO2FBQ1gsQ0FBQTtZQUNELElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN4QztJQUVMLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFjY29yZGlvblBhbmVsLCBBY2NvcmRpb25FbGVtZW50IH0gZnJvbSBcIi4vQWNjb3JkaW9uLmpzXCI7XHJcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBDbGFzc0RhdGEsIFVzZXJEYXRhLCBDUlVEVXNlclJlcXVlc3QsIENSVURDbGFzc1JlcXVlc3QsIEdldFdvcmtzcGFjZXNSZXNwb25zZSwgR2V0V29ya3NwYWNlc1JlcXVlc3QsIFdvcmtzcGFjZXMgfSBmcm9tIFwiLi4vLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IGFqYXggfSBmcm9tIFwiLi4vLi4vY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZSB9IGZyb20gXCIuLi8uLi93b3Jrc3BhY2UvV29ya3NwYWNlLmpzXCI7XHJcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL0hlbHBlci5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFRlYWNoZXJFeHBsb3JlciB7XHJcblxyXG4gICAgc3R1ZGVudFBhbmVsOiBBY2NvcmRpb25QYW5lbDtcclxuICAgIGNsYXNzUGFuZWw6IEFjY29yZGlvblBhbmVsO1xyXG5cclxuICAgIC8vIHNhdmUgdGhlbSBoZXJlIHdoZW4gZGlzcGxheWluZyBwdXBpbHMgd29ya3NwYWNlczpcclxuICAgIG93bldvcmtzcGFjZXM6IFdvcmtzcGFjZVtdO1xyXG4gICAgY3VycmVudE93bldvcmtzcGFjZTogV29ya3NwYWNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbiwgcHJpdmF0ZSBjbGFzc0RhdGE6IENsYXNzRGF0YVtdKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVBhbmVscygpIHtcclxuICAgICAgICB0aGlzLmNsYXNzUGFuZWwucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy5zdHVkZW50UGFuZWwucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0U3R1ZGVudFBhbmVsKCk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdENsYXNzUGFuZWwoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJDbGFzc2VzKHRoaXMuY2xhc3NEYXRhKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdFN0dWRlbnRQYW5lbCgpIHtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnN0dWRlbnRQYW5lbCA9IG5ldyBBY2NvcmRpb25QYW5lbCh0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmFjY29yZGlvbixcclxuICAgICAgICAgICAgXCJTY2jDvGxlci9pbm5lblwiLCBcIjJcIiwgbnVsbCxcclxuICAgICAgICAgICAgXCJcIiwgXCJzdHVkZW50XCIsIGZhbHNlLCBmYWxzZSwgXCJzdHVkZW50XCIsIGZhbHNlLCBbXSk7XHJcblxyXG4gICAgICAgIHRoaXMuc3R1ZGVudFBhbmVsLnNlbGVjdENhbGxiYWNrID0gKGFlOiBVc2VyRGF0YSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmRVcGRhdGVzKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdDogR2V0V29ya3NwYWNlc1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgd3NfdXNlcklkOiBhZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhbmd1YWdlOiAwXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYWpheChcImdldFdvcmtzcGFjZXNcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBHZXRXb3Jrc3BhY2VzUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2VzcyA9PSB0cnVlKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5tYWluLndvcmtzcGFjZXNPd25lcklkID09IHRoYXQubWFpbi51c2VyLmlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm93bldvcmtzcGFjZXMgPSB0aGF0Lm1haW4ud29ya3NwYWNlTGlzdC5zbGljZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50T3duV29ya3NwYWNlID0gdGhhdC5tYWluLmN1cnJlbnRXb3Jrc3BhY2U7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5yZXN0b3JlV29ya3NwYWNlcyhyZXNwb25zZS53b3Jrc3BhY2VzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi53b3Jrc3BhY2VzT3duZXJJZCA9IGFlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucHJvamVjdEV4cGxvcmVyLnNldEV4cGxvcmVyQ29sb3IoXCJyZ2JhKDI1NSwgMCwgMCwgMC4yXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucHJvamVjdEV4cGxvcmVyLiRob21lQWN0aW9uLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgSGVscGVyLnNob3dIZWxwZXIoXCJob21lQnV0dG9uSGVscGVyXCIsIHRoaXMubWFpbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4uYm90dG9tRGl2LnNob3dIb21ld29ya1RhYigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4uYm90dG9tRGl2LmhvbWV3b3JrTWFuYWdlci5hdHRhY2hUb1dvcmtzcGFjZXModGhhdC5tYWluLndvcmtzcGFjZUxpc3QpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyLnVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcyA9IHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlci50ZWFjaGVyVXBkYXRlRnJlcXVlbmN5SW5TZWNvbmRzO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlci5zZWNvbmRzVGlsbE5leHRVcGRhdGUgPSB0aGlzLm1haW4ubmV0d29ya01hbmFnZXIudGVhY2hlclVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcztcclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVzdG9yZU93bldvcmtzcGFjZXMoKSB7XHJcbiAgICAgICAgbGV0IG1haW4gPSB0aGlzLm1haW47XHJcblxyXG4gICAgICAgIC8vIG1haW4ubW9uYWNvLnNldE1vZGVsKG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJLZWluZSBEYXRlaSB2b3JoYW5kZW4uXCIsIFwidGV4dFwiKSk7XHJcbiAgICAgICAgbWFpbi5nZXRNb25hY29FZGl0b3IoKS51cGRhdGVPcHRpb25zKHsgcmVhZE9ubHk6IHRydWUgfSk7XHJcblxyXG4gICAgICAgIG1haW4ud29ya3NwYWNlTGlzdCA9IHRoaXMub3duV29ya3NwYWNlcztcclxuICAgICAgICBtYWluLmN1cnJlbnRXb3Jrc3BhY2UgPSB0aGlzLmN1cnJlbnRPd25Xb3Jrc3BhY2U7XHJcbiAgICAgICAgbWFpbi53b3Jrc3BhY2VzT3duZXJJZCA9IG1haW4udXNlci5pZDtcclxuICAgICAgICBtYWluLnByb2plY3RFeHBsb3Jlci5zZXRFeHBsb3JlckNvbG9yKG51bGwpO1xyXG5cclxuICAgICAgICBtYWluLnByb2plY3RFeHBsb3Jlci5yZW5kZXJXb3Jrc3BhY2VzKG1haW4ud29ya3NwYWNlTGlzdCk7XHJcblxyXG4gICAgICAgIGlmIChtYWluLmN1cnJlbnRXb3Jrc3BhY2UgPT0gbnVsbCAmJiBtYWluLndvcmtzcGFjZUxpc3QubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBtYWluLmN1cnJlbnRXb3Jrc3BhY2UgPSBtYWluLndvcmtzcGFjZUxpc3RbMF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWFpbi5jdXJyZW50V29ya3NwYWNlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbWFpbi5wcm9qZWN0RXhwbG9yZXIuc2V0V29ya3NwYWNlQWN0aXZlKG1haW4uY3VycmVudFdvcmtzcGFjZSwgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0dWRlbnRQYW5lbC5zZWxlY3QobnVsbCwgZmFsc2UpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0Q2xhc3NQYW5lbCgpIHtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NQYW5lbCA9IG5ldyBBY2NvcmRpb25QYW5lbCh0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmFjY29yZGlvbixcclxuICAgICAgICAgICAgXCJLbGFzc2VuXCIsIFwiMVwiLCBudWxsLCBcIlwiLCBcImNsYXNzXCIsIGZhbHNlLCBmYWxzZSwgXCJjbGFzc1wiLCBmYWxzZSwgW10pO1xyXG5cclxuICAgICAgICB0aGlzLmNsYXNzUGFuZWwuc2VsZWN0Q2FsbGJhY2sgPSAoZWEpID0+IHtcclxuICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmRVcGRhdGVzKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY2xhc3NEYXRhID0gPENsYXNzRGF0YT5lYTtcclxuICAgICAgICAgICAgICAgIGlmIChjbGFzc0RhdGEgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyU3R1ZGVudHMoY2xhc3NEYXRhLnN0dWRlbnRzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlclN0dWRlbnRzKHVzZXJEYXRhTGlzdDogVXNlckRhdGFbXSkge1xyXG4gICAgICAgIHRoaXMuc3R1ZGVudFBhbmVsLmNsZWFyKCk7XHJcblxyXG4gICAgICAgIHVzZXJEYXRhTGlzdC5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChhLmZhbWlsaWVubmFtZSA+IGIuZmFtaWxpZW5uYW1lKSByZXR1cm4gLTE7XHJcbiAgICAgICAgICAgIGlmIChiLmZhbWlsaWVubmFtZSA+IGEuZmFtaWxpZW5uYW1lKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgaWYgKGEucnVmbmFtZSA+IGIucnVmbmFtZSkgcmV0dXJuIC0xO1xyXG4gICAgICAgICAgICBpZiAoYi5ydWZuYW1lID4gYS5ydWZuYW1lKSByZXR1cm4gMTtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yKGxldCBpID0gMDsgaSA8IHVzZXJEYXRhTGlzdC5sZW5ndGg7IGkrKyl7XHJcbiAgICAgICAgICAgIGxldCB1ZCA9IHVzZXJEYXRhTGlzdFtpXTtcclxuICAgICAgICAgICAgbGV0IGFlOiBBY2NvcmRpb25FbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogdWQuZmFtaWxpZW5uYW1lICsgXCIsIFwiICsgdWQucnVmbmFtZSxcclxuICAgICAgICAgICAgICAgIHNvcnROYW1lOiB1ZC5mYW1pbGllbm5hbWUgKyBcIiBcIiArIHVkLnJ1Zm5hbWUsXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEVsZW1lbnQ6IHVkLFxyXG4gICAgICAgICAgICAgICAgaXNGb2xkZXI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogW11cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnN0dWRlbnRQYW5lbC5hZGRFbGVtZW50KGFlLCB0cnVlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlckNsYXNzZXMoY2xhc3NEYXRhTGlzdDogQ2xhc3NEYXRhW10pIHtcclxuICAgICAgICB0aGlzLnN0dWRlbnRQYW5lbC5jbGVhcigpO1xyXG5cclxuICAgICAgICBjbGFzc0RhdGFMaXN0LnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgaWYgKGEubmFtZSA+IGIubmFtZSkgcmV0dXJuIDE7XHJcbiAgICAgICAgICAgIGlmIChiLm5hbWUgPiBhLm5hbWUpIHJldHVybiAtMTtcclxuICAgICAgICAgICAgcmV0dXJuIDA7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY2Qgb2YgY2xhc3NEYXRhTGlzdCkge1xyXG4gICAgICAgICAgICBsZXQgYWU6IEFjY29yZGlvbkVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBjZC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxFbGVtZW50OiBjZCxcclxuICAgICAgICAgICAgICAgIGlzRm9sZGVyOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHBhdGg6IFtdXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5jbGFzc1BhbmVsLmFkZEVsZW1lbnQoYWUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==