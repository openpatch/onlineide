import { Module } from "../../compiler/parser/Module.js";
import { Workspace } from "../../workspace/Workspace.js";
import { Dialog } from "./Dialog.js";
export class WorkspaceImporter {
    constructor(main, path = []) {
        this.main = main;
        this.path = path;
        this.dialog = new Dialog();
    }
    show() {
        let that = this;
        this.dialog.init();
        this.dialog.heading("Workspace importieren");
        this.dialog.description("Bitte klicken Sie auf den Button 'Datei auswählen...' oder ziehen Sie eine Datei auf das gestrichelt umrahmte Feld.");
        let pathDescription = "Dieser Workspace wird auf unterster Ordnerebene in der Workspaceliste importiert.";
        if (this.path.length > 0) {
            pathDescription = "Dieser Workspace wird in den Ordner " + this.path.join("/") + " importiert.";
        }
        this.dialog.description(pathDescription);
        let $fileInputButton = jQuery('<input type="file" id="file" name="file" multiple />');
        this.dialog.addDiv($fileInputButton);
        let exportedWorkspaces = [];
        let $errorDiv = this.dialog.description("", "red");
        let $workspacePreviewDiv = jQuery(`<ul></ul>`);
        let registerFiles = (files) => {
            for (let i = 0; i < files.length; i++) {
                let f = files[i];
                var reader = new FileReader();
                reader.onload = (event) => {
                    let text = event.target.result;
                    if (!text.startsWith("{")) {
                        $errorDiv.append(jQuery(`<div>Das Format der Datei ${f.name} passt nicht.</div>`));
                        return;
                    }
                    let ew = JSON.parse(text);
                    if (ew.modules == null || ew.name == null || ew.settings == null) {
                        $errorDiv.append(jQuery(`<div>Das Format der Datei ${f.name} passt nicht.</div>`));
                        return;
                    }
                    exportedWorkspaces.push(ew);
                    $workspacePreviewDiv.append(jQuery(`<li>Workspace ${ew.name} mit ${ew.modules.length} Dateien</li>`));
                };
                reader.readAsText(f);
            }
        };
        $fileInputButton.on('change', (event) => {
            //@ts-ignore
            var files = event.originalEvent.target.files;
            registerFiles(files);
        });
        let $dropZone = jQuery(`<div class="jo_workspaceimport_dropzone">Dateien hierhin ziehen</div>`);
        this.dialog.addDiv($dropZone);
        this.dialog.description('<b>Diese Workspaces werden importiert:</b>');
        $dropZone.on('dragover', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            evt.originalEvent.dataTransfer.dropEffect = 'copy';
        });
        $dropZone.on('drop', (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            var files = evt.originalEvent.dataTransfer.files;
            registerFiles(files);
        });
        this.dialog.addDiv($workspacePreviewDiv);
        let waitDiv = this.dialog.waitMessage("Bitte warten...");
        this.dialog.buttons([
            {
                caption: "Abbrechen",
                color: "#a00000",
                callback: () => { this.dialog.close(); }
            },
            {
                caption: "Importieren",
                color: "green",
                callback: () => {
                    let networkManager = this.main.networkManager;
                    let projectExplorer = this.main.projectExplorer;
                    let owner_id = this.main.user.id;
                    if (this.main.workspacesOwnerId != null) {
                        owner_id = this.main.workspacesOwnerId;
                    }
                    let count = 0;
                    for (let wse of exportedWorkspaces)
                        count += 1 + wse.modules.length;
                    let firstWorkspace;
                    for (let wse of exportedWorkspaces) {
                        let ws = new Workspace(wse.name, this.main, owner_id);
                        if (firstWorkspace == null)
                            firstWorkspace = ws;
                        ws.isFolder = false;
                        ws.path = this.path.join("/");
                        ws.settings = wse.settings;
                        this.main.workspaceList.push(ws);
                        ws.alterAdditionalLibraries();
                        networkManager.sendCreateWorkspace(ws, owner_id, (error) => {
                            count--;
                            if (error == null) {
                                projectExplorer.workspaceListPanel.addElement({
                                    name: ws.name,
                                    externalElement: ws,
                                    iconClass: "workspace",
                                    isFolder: false,
                                    path: that.path
                                }, true);
                                for (let mo of wse.modules) {
                                    let f = {
                                        name: mo.name,
                                        dirty: false,
                                        saved: true,
                                        text: mo.text,
                                        text_before_revision: null,
                                        submitted_date: null,
                                        student_edited_after_revision: false,
                                        version: 1,
                                        is_copy_of_id: null,
                                        repository_file_version: null,
                                        identical_to_repository_version: null
                                    };
                                    let m = new Module(f, this.main);
                                    ws.moduleStore.putModule(m);
                                    networkManager.sendCreateFile(m, ws, owner_id, (error) => {
                                        count--;
                                        if (error == null) {
                                            projectExplorer.workspaceListPanel.sortElements();
                                            this.dialog.close();
                                            if (firstWorkspace != null)
                                                projectExplorer.setWorkspaceActive(firstWorkspace, true);
                                        }
                                        else {
                                            alert('Der Server ist nicht erreichbar!');
                                        }
                                    });
                                }
                            }
                            else {
                                alert('Der Server ist nicht erreichbar!');
                            }
                        });
                    }
                }
            },
        ]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ya3NwYWNlSW1wb3J0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL1dvcmtzcGFjZUltcG9ydGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBMkIsTUFBTSxFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDbEYsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBRXpELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFckMsTUFBTSxPQUFPLGlCQUFpQjtJQUkxQixZQUFvQixJQUFVLEVBQVUsT0FBaUIsRUFBRTtRQUF2QyxTQUFJLEdBQUosSUFBSSxDQUFNO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBZTtRQUV2RCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7SUFFL0IsQ0FBQztJQUVELElBQUk7UUFDQSxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLHFIQUFxSCxDQUFDLENBQUE7UUFDOUksSUFBSSxlQUFlLEdBQUcsbUZBQW1GLENBQUM7UUFDMUcsSUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBSSxDQUFDLEVBQUM7WUFDckIsZUFBZSxHQUFHLHNDQUFzQyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLGNBQWMsQ0FBQztTQUNuRztRQUNELElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRXpDLElBQUksZ0JBQWdCLEdBQUcsTUFBTSxDQUFDLHNEQUFzRCxDQUFDLENBQUM7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QUksRUFBRSxFQUFFLENBQUMsSUFBSTt3Q0FDYixvQkFBb0IsRUFBRSxJQUFJO3dDQUMxQixjQUFjLEVBQUUsSUFBSTt3Q0FDcEIsNkJBQTZCLEVBQUUsS0FBSzt3Q0FDcEMsT0FBTyxFQUFFLENBQUM7d0NBQ1YsYUFBYSxFQUFFLElBQUk7d0NBQ25CLHVCQUF1QixFQUFFLElBQUk7d0NBQzdCLCtCQUErQixFQUFFLElBQUk7cUNBQ3hDLENBQUM7b0NBQ0YsSUFBSSxDQUFDLEdBQUcsSUFBSSxNQUFNLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztvQ0FDakMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7b0NBQzVCLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxRQUFRLEVBQ3pDLENBQUMsS0FBYSxFQUFFLEVBQUU7d0NBQ2QsS0FBSyxFQUFFLENBQUM7d0NBQ1IsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFOzRDQUNmLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLEVBQUUsQ0FBQzs0Q0FDbEQsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQzs0Q0FDcEIsSUFBRyxjQUFjLElBQUksSUFBSTtnREFBRSxlQUFlLENBQUMsa0JBQWtCLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxDQUFDO3lDQUN2Rjs2Q0FBTTs0Q0FDSCxLQUFLLENBQUMsa0NBQWtDLENBQUMsQ0FBQzt5Q0FFN0M7b0NBQ0wsQ0FBQyxDQUFDLENBQUM7aUNBQ1Y7NkJBRUo7aUNBQU07Z0NBQ0gsS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUM7NkJBRTdDO3dCQUNMLENBQUMsQ0FBQyxDQUFDO3FCQUlOO2dCQUVMLENBQUM7YUFDSjtTQUNKLENBQUMsQ0FBQTtJQUNOLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEV4cG9ydGVkV29ya3NwYWNlLCBGaWxlLCBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uLy4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vTWFpbi5qc1wiO1xuaW1wb3J0IHsgRGlhbG9nIH0gZnJvbSBcIi4vRGlhbG9nLmpzXCI7XG5cbmV4cG9ydCBjbGFzcyBXb3Jrc3BhY2VJbXBvcnRlciB7XG5cbiAgICBkaWFsb2c6IERpYWxvZztcblxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbiwgcHJpdmF0ZSBwYXRoOiBzdHJpbmdbXSA9IFtdKSB7XG5cbiAgICAgICAgdGhpcy5kaWFsb2cgPSBuZXcgRGlhbG9nKCk7XG4gICAgICAgIFxuICAgIH1cblxuICAgIHNob3coKSB7XG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICAgICAgdGhpcy5kaWFsb2cuaW5pdCgpO1xuICAgICAgICB0aGlzLmRpYWxvZy5oZWFkaW5nKFwiV29ya3NwYWNlIGltcG9ydGllcmVuXCIpO1xuICAgICAgICB0aGlzLmRpYWxvZy5kZXNjcmlwdGlvbihcIkJpdHRlIGtsaWNrZW4gU2llIGF1ZiBkZW4gQnV0dG9uICdEYXRlaSBhdXN3w6RobGVuLi4uJyBvZGVyIHppZWhlbiBTaWUgZWluZSBEYXRlaSBhdWYgZGFzIGdlc3RyaWNoZWx0IHVtcmFobXRlIEZlbGQuXCIpXG4gICAgICAgIGxldCBwYXRoRGVzY3JpcHRpb24gPSBcIkRpZXNlciBXb3Jrc3BhY2Ugd2lyZCBhdWYgdW50ZXJzdGVyIE9yZG5lcmViZW5lIGluIGRlciBXb3Jrc3BhY2VsaXN0ZSBpbXBvcnRpZXJ0LlwiO1xuICAgICAgICBpZih0aGlzLnBhdGgubGVuZ3RoICA+IDApe1xuICAgICAgICAgICAgcGF0aERlc2NyaXB0aW9uID0gXCJEaWVzZXIgV29ya3NwYWNlIHdpcmQgaW4gZGVuIE9yZG5lciBcIiArIHRoaXMucGF0aC5qb2luKFwiL1wiKSArIFwiIGltcG9ydGllcnQuXCI7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kaWFsb2cuZGVzY3JpcHRpb24ocGF0aERlc2NyaXB0aW9uKTtcblxuICAgICAgICBsZXQgJGZpbGVJbnB1dEJ1dHRvbiA9IGpRdWVyeSgnPGlucHV0IHR5cGU9XCJmaWxlXCIgaWQ9XCJmaWxlXCIgbmFtZT1cImZpbGVcIiBtdWx0aXBsZSAvPicpO1xuICAgICAgICB0aGlzLmRpYWxvZy5hZGREaXYoJGZpbGVJbnB1dEJ1dHRvbik7XG4gICAgICAgIFxuICAgICAgICBsZXQgZXhwb3J0ZWRXb3Jrc3BhY2VzOiBFeHBvcnRlZFdvcmtzcGFjZVtdID0gW107XG4gICAgICAgIFxuICAgICAgICBsZXQgJGVycm9yRGl2ID0gdGhpcy5kaWFsb2cuZGVzY3JpcHRpb24oXCJcIiwgXCJyZWRcIik7XG4gICAgICAgIGxldCAkd29ya3NwYWNlUHJldmlld0RpdiA9IGpRdWVyeShgPHVsPjwvdWw+YCk7XG4gICAgICAgIFxuICAgICAgICBsZXQgcmVnaXN0ZXJGaWxlcyA9IChmaWxlczogRmlsZUxpc3QpID0+IHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZmlsZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBsZXQgZiA9IGZpbGVzW2ldO1xuICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRleHQ6IHN0cmluZyA9IDxzdHJpbmc+ZXZlbnQudGFyZ2V0LnJlc3VsdDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF0ZXh0LnN0YXJ0c1dpdGgoXCJ7XCIpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZXJyb3JEaXYuYXBwZW5kKGpRdWVyeShgPGRpdj5EYXMgRm9ybWF0IGRlciBEYXRlaSAke2YubmFtZX0gcGFzc3QgbmljaHQuPC9kaXY+YCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICBsZXQgZXc6IEV4cG9ydGVkV29ya3NwYWNlID0gSlNPTi5wYXJzZSh0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGlmKGV3Lm1vZHVsZXMgPT0gbnVsbCB8fCBldy5uYW1lID09IG51bGwgfHwgZXcuc2V0dGluZ3MgPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZXJyb3JEaXYuYXBwZW5kKGpRdWVyeShgPGRpdj5EYXMgRm9ybWF0IGRlciBEYXRlaSAke2YubmFtZX0gcGFzc3QgbmljaHQuPC9kaXY+YCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZWRXb3Jrc3BhY2VzLnB1c2goZXcpO1xuICAgICAgICAgICAgICAgICAgICAkd29ya3NwYWNlUHJldmlld0Rpdi5hcHBlbmQoalF1ZXJ5KGA8bGk+V29ya3NwYWNlICR7ZXcubmFtZX0gbWl0ICR7ZXcubW9kdWxlcy5sZW5ndGh9IERhdGVpZW48L2xpPmApKTtcblxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAkZmlsZUlucHV0QnV0dG9uLm9uKCdjaGFuZ2UnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxuICAgICAgICAgICAgdmFyIGZpbGVzOiBGaWxlTGlzdCA9IGV2ZW50Lm9yaWdpbmFsRXZlbnQudGFyZ2V0LmZpbGVzO1xuICAgICAgICAgICAgcmVnaXN0ZXJGaWxlcyhmaWxlcyk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgbGV0ICRkcm9wWm9uZSA9IGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3dvcmtzcGFjZWltcG9ydF9kcm9wem9uZVwiPkRhdGVpZW4gaGllcmhpbiB6aWVoZW48L2Rpdj5gKTtcbiAgICAgICAgdGhpcy5kaWFsb2cuYWRkRGl2KCRkcm9wWm9uZSk7XG4gICAgICAgIHRoaXMuZGlhbG9nLmRlc2NyaXB0aW9uKCc8Yj5EaWVzZSBXb3Jrc3BhY2VzIHdlcmRlbiBpbXBvcnRpZXJ0OjwvYj4nKTtcblxuXG5cbiAgICAgICAgJGRyb3Bab25lLm9uKCdkcmFnb3ZlcicsIChldnQpID0+IHtcbiAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgZXZ0Lm9yaWdpbmFsRXZlbnQuZGF0YVRyYW5zZmVyLmRyb3BFZmZlY3QgPSAnY29weSc7XG4gICAgICAgIH0pXG4gICAgICAgICRkcm9wWm9uZS5vbignZHJvcCcsIChldnQpID0+IHtcbiAgICAgICAgICAgIGV2dC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGV2dC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgICAgICB2YXIgZmlsZXMgPSBldnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZmlsZXM7XG4gICAgICAgICAgICByZWdpc3RlckZpbGVzKGZpbGVzKTtcbiAgICAgICAgfSlcblxuICAgICAgICB0aGlzLmRpYWxvZy5hZGREaXYoJHdvcmtzcGFjZVByZXZpZXdEaXYpO1xuXG4gICAgICAgIGxldCB3YWl0RGl2ID0gdGhpcy5kaWFsb2cud2FpdE1lc3NhZ2UoXCJCaXR0ZSB3YXJ0ZW4uLi5cIilcblxuICAgICAgICB0aGlzLmRpYWxvZy5idXR0b25zKFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkFiYnJlY2hlblwiLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBcIiNhMDAwMDBcIixcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4geyB0aGlzLmRpYWxvZy5jbG9zZSgpIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY2FwdGlvbjogXCJJbXBvcnRpZXJlblwiLFxuICAgICAgICAgICAgICAgIGNvbG9yOiBcImdyZWVuXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIGxldCBuZXR3b3JrTWFuYWdlciA9IHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlcjtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb2plY3RFeHBsb3JlciA9IHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXI7XG5cbiAgICAgICAgICAgICAgICAgICAgbGV0IG93bmVyX2lkOiBudW1iZXIgPSB0aGlzLm1haW4udXNlci5pZDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFpbi53b3Jrc3BhY2VzT3duZXJJZCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvd25lcl9pZCA9IHRoaXMubWFpbi53b3Jrc3BhY2VzT3duZXJJZDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvcihsZXQgd3NlIG9mIGV4cG9ydGVkV29ya3NwYWNlcykgY291bnQgKz0gMSArIHdzZS5tb2R1bGVzLmxlbmd0aDtcblxuICAgICAgICAgICAgICAgICAgICBsZXQgZmlyc3RXb3Jrc3BhY2U6IFdvcmtzcGFjZTtcblxuICAgICAgICAgICAgICAgICAgICBmb3IobGV0IHdzZSBvZiBleHBvcnRlZFdvcmtzcGFjZXMpe1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgd3M6IFdvcmtzcGFjZSA9IG5ldyBXb3Jrc3BhY2Uod3NlLm5hbWUsIHRoaXMubWFpbiwgb3duZXJfaWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoZmlyc3RXb3Jrc3BhY2UgPT0gbnVsbCkgZmlyc3RXb3Jrc3BhY2UgPSB3cztcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLmlzRm9sZGVyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB3cy5wYXRoID0gdGhpcy5wYXRoLmpvaW4oXCIvXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgd3Muc2V0dGluZ3MgPSB3c2Uuc2V0dGluZ3M7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1haW4ud29ya3NwYWNlTGlzdC5wdXNoKHdzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdzLmFsdGVyQWRkaXRpb25hbExpYnJhcmllcygpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXR3b3JrTWFuYWdlci5zZW5kQ3JlYXRlV29ya3NwYWNlKHdzLCBvd25lcl9pZCwgKGVycm9yOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3VudC0tO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvciA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuYWRkRWxlbWVudCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB3cy5uYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZXJuYWxFbGVtZW50OiB3cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25DbGFzczogXCJ3b3Jrc3BhY2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzRm9sZGVyOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IHRoYXQucGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCB0cnVlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IobGV0IG1vIG9mIHdzZS5tb2R1bGVzKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmOiBGaWxlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IG1vLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlydHk6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVkOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IG1vLnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dF9iZWZvcmVfcmV2aXNpb246IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VibWl0dGVkX2RhdGU6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3R1ZGVudF9lZGl0ZWRfYWZ0ZXJfcmV2aXNpb246IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZlcnNpb246IDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXNfY29weV9vZl9pZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiBudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG0gPSBuZXcgTW9kdWxlKGYsIHRoaXMubWFpbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3cy5tb2R1bGVTdG9yZS5wdXRNb2R1bGUobSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXR3b3JrTWFuYWdlci5zZW5kQ3JlYXRlRmlsZShtLCB3cywgb3duZXJfaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVycm9yOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY291bnQtLTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuc29ydEVsZW1lbnRzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRpYWxvZy5jbG9zZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYoZmlyc3RXb3Jrc3BhY2UgIT0gbnVsbCkgcHJvamVjdEV4cGxvcmVyLnNldFdvcmtzcGFjZUFjdGl2ZShmaXJzdFdvcmtzcGFjZSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRGVyIFNlcnZlciBpc3QgbmljaHQgZXJyZWljaGJhciEnKTtcbiAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0RlciBTZXJ2ZXIgaXN0IG5pY2h0IGVycmVpY2hiYXIhJyk7XG4gICAgICAgIFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG5cblxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICBdKVxuICAgIH1cblxufSJdfQ==