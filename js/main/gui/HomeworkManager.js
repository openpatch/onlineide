import { makeDiv } from "../../tools/HtmlTools.js";
import { stringToDate, dateToStringWithoutTime } from "../../tools/StringTools.js";
export class HomeworkManager {
    constructor(main, $bottomDiv) {
        this.main = main;
        this.$bottomDiv = $bottomDiv;
        this.showRevisionActive = false;
        this.$homeworkTab = $bottomDiv.find('.jo_tabs>.jo_homeworkTab');
    }
    initGUI() {
        let that = this;
        this.$homeworkTab.append(this.$homeworkTabLeft = makeDiv("", "jo_homeworkTabLeft jo_scrollable"));
        this.$homeworkTab.append(this.$homeworkTabRight = makeDiv("", "jo_homeworkTabRight jo_scrollable"));
        this.$showRevisionButton = makeDiv("", "jo_button jo_active jo_homeworkRevisionButton", "");
        jQuery('#view-mode').prepend(this.$showRevisionButton);
        this.$showRevisionButton.on("click", () => {
            if (this.showRevisionActive) {
                this.hideRevision();
            }
            else {
                this.showRevision(that.main.getCurrentlyEditedModule());
            }
        });
        this.$showRevisionButton.hide();
        jQuery('#diffEditor').hide();
    }
    showHomeWorkRevisionButton() {
        this.$showRevisionButton.text(this.showRevisionActive ? "Normalansicht" : "Korrekturen zeigen");
        this.$showRevisionButton.show();
    }
    hideHomeworkRevisionButton() {
        this.$showRevisionButton.hide();
    }
    showRevision(module) {
        module.file.text = module.getProgramTextFromMonacoModel();
        let file = module.file;
        jQuery('#editor').hide();
        jQuery('#diffEditor').show();
        var originalModel = monaco.editor.createModel(file.text_before_revision, "myJava");
        var modifiedModel = monaco.editor.createModel(file.text, "myJava");
        this.diffEditor = monaco.editor.createDiffEditor(document.getElementById("diffEditor"), {
            // You can optionally disable the resizing
            enableSplitViewResizing: true,
            originalEditable: false,
            readOnly: true,
            // Render the diff inline
            renderSideBySide: true
        });
        this.diffEditor.setModel({
            original: originalModel,
            modified: modifiedModel
        });
        this.showRevisionActive = true;
        this.showHomeWorkRevisionButton();
    }
    hideRevision() {
        if (this.showRevisionActive) {
            jQuery('#diffEditor').hide();
            this.diffEditor.dispose();
            this.diffEditor = null;
            jQuery('#editor').show();
            this.showRevisionActive = false;
            this.showHomeWorkRevisionButton();
        }
    }
    attachToWorkspaces(workspaces) {
        let daysWithModules = [];
        let map = {};
        workspaces.forEach(ws => {
            ws.moduleStore.getModules(false).forEach(module => {
                let dateString = module.file.submitted_date;
                if (dateString != null) {
                    let date = stringToDate(dateString);
                    let dateWithoutTime = dateToStringWithoutTime(date);
                    let dwm = map[dateWithoutTime];
                    if (dwm == null) {
                        dwm = {
                            date: date,
                            day: dateWithoutTime,
                            modules: []
                        };
                        map[dateWithoutTime] = dwm;
                        daysWithModules.push(dwm);
                    }
                    dwm.modules.push({ module: module, workspace: ws });
                }
            });
        });
        this.$homeworkTabLeft.empty();
        this.$homeworkTabRight.empty();
        let that = this;
        this.$homeworkTabLeft.append(makeDiv("", "jo_homeworkHeading", "Abgabetage:"));
        daysWithModules.sort((a, b) => {
            if (a.date.getFullYear() != b.date.getFullYear())
                return -Math.sign(a.date.getFullYear() - b.date.getFullYear());
            if (a.date.getMonth() != b.date.getMonth())
                return -Math.sign(a.date.getMonth() - b.date.getMonth());
            if (a.date.getDate() != b.date.getDate())
                return -Math.sign(a.date.getDate() - b.date.getDate());
            return 0;
        });
        let first = true;
        daysWithModules.forEach(dwm => {
            dwm.modules.sort((m1, m2) => m1.module.file.name.localeCompare(m2.module.file.name));
            let $div = makeDiv("", "jo_homeworkDate", dwm.day);
            this.$homeworkTabLeft.append($div);
            $div.on("click", (e) => {
                this.$homeworkTabLeft.find('.jo_homeworkDate').removeClass('jo_active');
                $div.addClass('jo_active');
                that.select(dwm);
            });
            if (first) {
                first = false;
                $div.addClass('jo_active');
                that.select(dwm);
            }
        });
    }
    select(dwm) {
        this.$homeworkTabRight.empty();
        this.$homeworkTabRight.append(makeDiv("", "jo_homeworkHeading", "Abgegebene Dateien:"));
        let that = this;
        dwm.modules.forEach(moduleWithWorkspace => {
            let $div = jQuery(`<div class="jo_homeworkEntry">Workspace <span class="jo_homework-workspace">
                    ${moduleWithWorkspace.workspace.name}</span>, Datei <span class="jo_homework-file">
                    ${moduleWithWorkspace.module.file.name}</span> (Abgabe: ${moduleWithWorkspace.module.file.submitted_date} )</div>`);
            that.$homeworkTabRight.append($div);
            $div.on("click", () => {
                that.main.projectExplorer.setWorkspaceActive(moduleWithWorkspace.workspace, true);
                that.main.projectExplorer.setModuleActive(moduleWithWorkspace.module);
                that.main.projectExplorer.fileListPanel.select(moduleWithWorkspace.module, false);
            });
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSG9tZXdvcmtNYW5hZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9Ib21ld29ya01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBR25ELE9BQU8sRUFBRSxZQUFZLEVBQUUsdUJBQXVCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQWNuRixNQUFNLE9BQU8sZUFBZTtJQVd4QixZQUFvQixJQUFVLEVBQVMsVUFBK0I7UUFBbEQsU0FBSSxHQUFKLElBQUksQ0FBTTtRQUFTLGVBQVUsR0FBVixVQUFVLENBQXFCO1FBSnRFLHVCQUFrQixHQUFZLEtBQUssQ0FBQztRQUtoQyxJQUFJLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztJQUNwRSxDQUFDO0lBRUQsT0FBTztRQUNILElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLEVBQUUsRUFBRSxrQ0FBa0MsQ0FBQyxDQUFDLENBQUM7UUFDbEcsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLE9BQU8sQ0FBQyxFQUFFLEVBQUUsbUNBQW1DLENBQUMsQ0FBQyxDQUFDO1FBQ3BHLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxPQUFPLENBQUMsRUFBRSxFQUFFLCtDQUErQyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1FBQzNGLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDdkQsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFO1lBQ3RDLElBQUksSUFB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QUFFLEdBQUcsRUFBRTtnQkFDZCxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ2xGLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFDdEUsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUYsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDLENBQUMsQ0FBQTtJQUVOLENBQUM7Q0FJSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL01haW5CYXNlLmpzXCI7XHJcbmltcG9ydCB7IG1ha2VEaXYgfSBmcm9tIFwiLi4vLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZSB9IGZyb20gXCIuLi8uLi93b3Jrc3BhY2UvV29ya3NwYWNlLmpzXCI7XHJcbmltcG9ydCB7IEZpbGUsIE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IHN0cmluZ1RvRGF0ZSwgZGF0ZVRvU3RyaW5nV2l0aG91dFRpbWUgfSBmcm9tIFwiLi4vLi4vdG9vbHMvU3RyaW5nVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcblxyXG50eXBlIE1vZHVsZVdpdGhXb3Jrc3BhY2UgPSB7XHJcbiAgICBtb2R1bGU6IE1vZHVsZSxcclxuICAgIHdvcmtzcGFjZTogV29ya3NwYWNlXHJcbn1cclxuXHJcbnR5cGUgRGF5V2l0aE1vZHVsZXMgPSB7XHJcbiAgICBkYXRlOiBEYXRlO1xyXG4gICAgZGF5OiBzdHJpbmc7XHJcbiAgICBtb2R1bGVzOiBNb2R1bGVXaXRoV29ya3NwYWNlW107XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBIb21ld29ya01hbmFnZXIge1xyXG5cclxuICAgICRob21ld29ya1RhYjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRob21ld29ya1RhYkxlZnQ6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkaG9tZXdvcmtUYWJSaWdodDogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICAkc2hvd1JldmlzaW9uQnV0dG9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgc2hvd1JldmlzaW9uQWN0aXZlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgZGlmZkVkaXRvcjogbW9uYWNvLmVkaXRvci5JU3RhbmRhbG9uZURpZmZFZGl0b3I7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluLCBwdWJsaWMgJGJvdHRvbURpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIHRoaXMuJGhvbWV3b3JrVGFiID0gJGJvdHRvbURpdi5maW5kKCcuam9fdGFicz4uam9faG9tZXdvcmtUYWInKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0R1VJKCkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLiRob21ld29ya1RhYi5hcHBlbmQodGhpcy4kaG9tZXdvcmtUYWJMZWZ0ID0gbWFrZURpdihcIlwiLCBcImpvX2hvbWV3b3JrVGFiTGVmdCBqb19zY3JvbGxhYmxlXCIpKTtcclxuICAgICAgICB0aGlzLiRob21ld29ya1RhYi5hcHBlbmQodGhpcy4kaG9tZXdvcmtUYWJSaWdodCA9IG1ha2VEaXYoXCJcIiwgXCJqb19ob21ld29ya1RhYlJpZ2h0IGpvX3Njcm9sbGFibGVcIikpO1xyXG4gICAgICAgIHRoaXMuJHNob3dSZXZpc2lvbkJ1dHRvbiA9IG1ha2VEaXYoXCJcIiwgXCJqb19idXR0b24gam9fYWN0aXZlIGpvX2hvbWV3b3JrUmV2aXNpb25CdXR0b25cIiwgXCJcIilcclxuICAgICAgICBqUXVlcnkoJyN2aWV3LW1vZGUnKS5wcmVwZW5kKHRoaXMuJHNob3dSZXZpc2lvbkJ1dHRvbik7XHJcbiAgICAgICAgdGhpcy4kc2hvd1JldmlzaW9uQnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5zaG93UmV2aXNpb25BY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaGlkZVJldmlzaW9uKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dSZXZpc2lvbih0aGF0Lm1haW4uZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy4kc2hvd1JldmlzaW9uQnV0dG9uLmhpZGUoKTtcclxuICAgICAgICBqUXVlcnkoJyNkaWZmRWRpdG9yJykuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3dIb21lV29ya1JldmlzaW9uQnV0dG9uKCkge1xyXG4gICAgICAgIHRoaXMuJHNob3dSZXZpc2lvbkJ1dHRvbi50ZXh0KHRoaXMuc2hvd1JldmlzaW9uQWN0aXZlID8gXCJOb3JtYWxhbnNpY2h0XCIgOiBcIktvcnJla3R1cmVuIHplaWdlblwiKTtcclxuICAgICAgICB0aGlzLiRzaG93UmV2aXNpb25CdXR0b24uc2hvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIGhpZGVIb21ld29ya1JldmlzaW9uQnV0dG9uKCkge1xyXG4gICAgICAgIHRoaXMuJHNob3dSZXZpc2lvbkJ1dHRvbi5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd1JldmlzaW9uKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIG1vZHVsZS5maWxlLnRleHQgPSBtb2R1bGUuZ2V0UHJvZ3JhbVRleHRGcm9tTW9uYWNvTW9kZWwoKTtcclxuICAgICAgICBsZXQgZmlsZSA9IG1vZHVsZS5maWxlO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNlZGl0b3InKS5oaWRlKCk7XHJcbiAgICAgICAgalF1ZXJ5KCcjZGlmZkVkaXRvcicpLnNob3coKTtcclxuXHJcbiAgICAgICAgdmFyIG9yaWdpbmFsTW9kZWwgPSBtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKGZpbGUudGV4dF9iZWZvcmVfcmV2aXNpb24sIFwibXlKYXZhXCIpO1xyXG4gICAgICAgIHZhciBtb2RpZmllZE1vZGVsID0gbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChmaWxlLnRleHQsIFwibXlKYXZhXCIpO1xyXG5cclxuICAgICAgICB0aGlzLmRpZmZFZGl0b3IgPSBtb25hY28uZWRpdG9yLmNyZWF0ZURpZmZFZGl0b3IoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJkaWZmRWRpdG9yXCIpLCB7XHJcbiAgICAgICAgICAgIC8vIFlvdSBjYW4gb3B0aW9uYWxseSBkaXNhYmxlIHRoZSByZXNpemluZ1xyXG4gICAgICAgICAgICBlbmFibGVTcGxpdFZpZXdSZXNpemluZzogdHJ1ZSxcclxuICAgICAgICAgICAgb3JpZ2luYWxFZGl0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgIHJlYWRPbmx5OiB0cnVlLFxyXG4gICAgICAgICAgICAvLyBSZW5kZXIgdGhlIGRpZmYgaW5saW5lXHJcbiAgICAgICAgICAgIHJlbmRlclNpZGVCeVNpZGU6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kaWZmRWRpdG9yLnNldE1vZGVsKHtcclxuICAgICAgICAgICAgb3JpZ2luYWw6IG9yaWdpbmFsTW9kZWwsXHJcbiAgICAgICAgICAgIG1vZGlmaWVkOiBtb2RpZmllZE1vZGVsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2hvd1JldmlzaW9uQWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnNob3dIb21lV29ya1JldmlzaW9uQnV0dG9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZVJldmlzaW9uKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnNob3dSZXZpc2lvbkFjdGl2ZSkge1xyXG5cclxuICAgICAgICAgICAgalF1ZXJ5KCcjZGlmZkVkaXRvcicpLmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy5kaWZmRWRpdG9yLmRpc3Bvc2UoKTtcclxuICAgICAgICAgICAgdGhpcy5kaWZmRWRpdG9yID0gbnVsbDtcclxuICAgICAgICAgICAgalF1ZXJ5KCcjZWRpdG9yJykuc2hvdygpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zaG93UmV2aXNpb25BY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5zaG93SG9tZVdvcmtSZXZpc2lvbkJ1dHRvbigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgYXR0YWNoVG9Xb3Jrc3BhY2VzKHdvcmtzcGFjZXM6IFdvcmtzcGFjZVtdKSB7XHJcblxyXG4gICAgICAgIGxldCBkYXlzV2l0aE1vZHVsZXM6IERheVdpdGhNb2R1bGVzW10gPSBbXTtcclxuICAgICAgICBsZXQgbWFwOiB7IFtkYXk6IHN0cmluZ106IERheVdpdGhNb2R1bGVzIH0gPSB7fTtcclxuXHJcbiAgICAgICAgd29ya3NwYWNlcy5mb3JFYWNoKHdzID0+IHtcclxuICAgICAgICAgICAgd3MubW9kdWxlU3RvcmUuZ2V0TW9kdWxlcyhmYWxzZSkuZm9yRWFjaChtb2R1bGUgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBkYXRlU3RyaW5nID0gbW9kdWxlLmZpbGUuc3VibWl0dGVkX2RhdGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGF0ZVN0cmluZyAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRlOiBEYXRlID0gc3RyaW5nVG9EYXRlKGRhdGVTdHJpbmcpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRlV2l0aG91dFRpbWUgPSBkYXRlVG9TdHJpbmdXaXRob3V0VGltZShkYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZHdtOiBEYXlXaXRoTW9kdWxlcyA9IG1hcFtkYXRlV2l0aG91dFRpbWVdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChkd20gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkd20gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRlOiBkYXRlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5OiBkYXRlV2l0aG91dFRpbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGVzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXBbZGF0ZVdpdGhvdXRUaW1lXSA9IGR3bTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGF5c1dpdGhNb2R1bGVzLnB1c2goZHdtKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZHdtLm1vZHVsZXMucHVzaCh7bW9kdWxlOiBtb2R1bGUsIHdvcmtzcGFjZTogd3N9KTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGhvbWV3b3JrVGFiTGVmdC5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuJGhvbWV3b3JrVGFiUmlnaHQuZW1wdHkoKTtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLiRob21ld29ya1RhYkxlZnQuYXBwZW5kKG1ha2VEaXYoXCJcIiwgXCJqb19ob21ld29ya0hlYWRpbmdcIiwgXCJBYmdhYmV0YWdlOlwiKSk7XHJcblxyXG5cclxuICAgICAgICBkYXlzV2l0aE1vZHVsZXMuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoYS5kYXRlLmdldEZ1bGxZZWFyKCkgIT0gYi5kYXRlLmdldEZ1bGxZZWFyKCkpIHJldHVybiAtTWF0aC5zaWduKGEuZGF0ZS5nZXRGdWxsWWVhcigpIC0gYi5kYXRlLmdldEZ1bGxZZWFyKCkpO1xyXG4gICAgICAgICAgICBpZiAoYS5kYXRlLmdldE1vbnRoKCkgIT0gYi5kYXRlLmdldE1vbnRoKCkpIHJldHVybiAtTWF0aC5zaWduKGEuZGF0ZS5nZXRNb250aCgpIC0gYi5kYXRlLmdldE1vbnRoKCkpO1xyXG4gICAgICAgICAgICBpZiAoYS5kYXRlLmdldERhdGUoKSAhPSBiLmRhdGUuZ2V0RGF0ZSgpKSByZXR1cm4gLU1hdGguc2lnbihhLmRhdGUuZ2V0RGF0ZSgpIC0gYi5kYXRlLmdldERhdGUoKSk7XHJcbiAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgZmlyc3Q6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgICAgICBkYXlzV2l0aE1vZHVsZXMuZm9yRWFjaChkd20gPT4ge1xyXG5cclxuICAgICAgICAgICAgZHdtLm1vZHVsZXMuc29ydCgobTEsIG0yKSA9PiBtMS5tb2R1bGUuZmlsZS5uYW1lLmxvY2FsZUNvbXBhcmUobTIubW9kdWxlLmZpbGUubmFtZSkpO1xyXG5cclxuICAgICAgICAgICAgbGV0ICRkaXYgPSBtYWtlRGl2KFwiXCIsIFwiam9faG9tZXdvcmtEYXRlXCIsIGR3bS5kYXkpO1xyXG4gICAgICAgICAgICB0aGlzLiRob21ld29ya1RhYkxlZnQuYXBwZW5kKCRkaXYpO1xyXG5cclxuICAgICAgICAgICAgJGRpdi5vbihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRob21ld29ya1RhYkxlZnQuZmluZCgnLmpvX2hvbWV3b3JrRGF0ZScpLnJlbW92ZUNsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgICRkaXYuYWRkQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3QoZHdtKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlyc3QpIHtcclxuICAgICAgICAgICAgICAgIGZpcnN0ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAkZGl2LmFkZENsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0KGR3bSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdChkd206IERheVdpdGhNb2R1bGVzKSB7XHJcbiAgICAgICAgdGhpcy4kaG9tZXdvcmtUYWJSaWdodC5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuJGhvbWV3b3JrVGFiUmlnaHQuYXBwZW5kKG1ha2VEaXYoXCJcIiwgXCJqb19ob21ld29ya0hlYWRpbmdcIiwgXCJBYmdlZ2ViZW5lIERhdGVpZW46XCIpKTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgZHdtLm1vZHVsZXMuZm9yRWFjaChtb2R1bGVXaXRoV29ya3NwYWNlID0+IHtcclxuICAgICAgICAgICAgbGV0ICRkaXYgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19ob21ld29ya0VudHJ5XCI+V29ya3NwYWNlIDxzcGFuIGNsYXNzPVwiam9faG9tZXdvcmstd29ya3NwYWNlXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgJHttb2R1bGVXaXRoV29ya3NwYWNlLndvcmtzcGFjZS5uYW1lfTwvc3Bhbj4sIERhdGVpIDxzcGFuIGNsYXNzPVwiam9faG9tZXdvcmstZmlsZVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICR7bW9kdWxlV2l0aFdvcmtzcGFjZS5tb2R1bGUuZmlsZS5uYW1lfTwvc3Bhbj4gKEFiZ2FiZTogJHttb2R1bGVXaXRoV29ya3NwYWNlLm1vZHVsZS5maWxlLnN1Ym1pdHRlZF9kYXRlfSApPC9kaXY+YCk7XHJcbiAgICAgICAgICAgIHRoYXQuJGhvbWV3b3JrVGFiUmlnaHQuYXBwZW5kKCRkaXYpO1xyXG4gICAgICAgICAgICAkZGl2Lm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5wcm9qZWN0RXhwbG9yZXIuc2V0V29ya3NwYWNlQWN0aXZlKG1vZHVsZVdpdGhXb3Jrc3BhY2Uud29ya3NwYWNlLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucHJvamVjdEV4cGxvcmVyLnNldE1vZHVsZUFjdGl2ZShtb2R1bGVXaXRoV29ya3NwYWNlLm1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLnByb2plY3RFeHBsb3Jlci5maWxlTGlzdFBhbmVsLnNlbGVjdChtb2R1bGVXaXRoV29ya3NwYWNlLm1vZHVsZSwgZmFsc2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19