import { ajax } from "./AjaxHelper.js";
export class NetworkManager {
    constructor(main, $updateTimerDiv) {
        this.main = main;
        this.$updateTimerDiv = $updateTimerDiv;
        this.ownUpdateFrequencyInSeconds = 20;
        this.teacherUpdateFrequencyInSeconds = 5;
        this.updateFrequencyInSeconds = 20;
        this.forcedUpdateEvery = 2;
        this.secondsTillNextUpdate = this.updateFrequencyInSeconds;
        this.errorHappened = false;
    }
    initializeTimer() {
        let that = this;
        this.$updateTimerDiv.find('svg').attr('width', that.updateFrequencyInSeconds);
        if (this.interval != null)
            clearInterval(this.interval);
        let counterTillForcedUpdate = this.forcedUpdateEvery;
        this.interval = setInterval(() => {
            if (that.main.user == null)
                return; // don't call server if no user is logged in
            that.secondsTillNextUpdate--;
            if (that.secondsTillNextUpdate < 0) {
                that.secondsTillNextUpdate = that.updateFrequencyInSeconds;
                counterTillForcedUpdate--;
                let forceUpdate = counterTillForcedUpdate == 0;
                if (forceUpdate)
                    counterTillForcedUpdate = this.forcedUpdateEvery;
                that.sendUpdates(() => { }, forceUpdate);
            }
            let $rect = this.$updateTimerDiv.find('.jo_updateTimerRect');
            $rect.attr('width', that.secondsTillNextUpdate + "px");
            if (that.errorHappened) {
                $rect.css('fill', '#c00000');
                this.$updateTimerDiv.attr('title', "Fehler beim letzten Speichervorgang -> Werd's wieder versuchen");
            }
            else {
                $rect.css('fill', '#008000');
                this.$updateTimerDiv.attr('title', that.secondsTillNextUpdate + " Sekunden bis zum nächsten Speichern");
            }
        }, 1000);
    }
    sendUpdates(callback, sendIfNothingIsDirty = false) {
        var _a;
        if (this.main.user == null || this.main.user.is_testuser) {
            if (callback != null)
                callback();
            return;
        }
        this.main.projectExplorer.writeEditorTextToFile();
        let classDiagram = (_a = this.main.rightDiv) === null || _a === void 0 ? void 0 : _a.classDiagram;
        let userSettings = this.main.user.settings;
        if ((classDiagram === null || classDiagram === void 0 ? void 0 : classDiagram.dirty) || this.main.userDataDirty) {
            this.main.userDataDirty = false;
            userSettings.classDiagram = classDiagram === null || classDiagram === void 0 ? void 0 : classDiagram.serialize();
            this.sendUpdateUserSettings(() => { });
        }
        classDiagram.dirty = false;
        let wdList = [];
        let fdList = [];
        for (let ws of this.main.workspaceList) {
            if (!ws.saved) {
                wdList.push(ws.getWorkspaceData(false));
                ws.saved = true;
            }
            for (let m of ws.moduleStore.getModules(false)) {
                if (!m.file.saved) {
                    m.file.text = m.getProgramTextFromMonacoModel();
                    fdList.push(m.getFileData(ws));
                    // console.log("Save file " + m.file.name);
                    m.file.saved = true;
                }
            }
        }
        let request = {
            workspacesWithoutFiles: wdList,
            files: fdList,
            owner_id: this.main.workspacesOwnerId,
            userId: this.main.user.id,
            language: 0
        };
        let that = this;
        if (wdList.length > 0 || fdList.length > 0 || sendIfNothingIsDirty) {
            ajax('sendUpdates', request, (response) => {
                that.errorHappened = !response.success;
                if (!that.errorHappened) {
                    that.updateWorkspaces(request, response);
                    if (callback != null) {
                        callback();
                        return;
                    }
                }
            }, () => {
                that.errorHappened = true;
            });
        }
        else {
            if (callback != null) {
                callback();
                return;
            }
        }
    }
    sendCreateWorkspace(w, owner_id, callback) {
        if (this.main.user.is_testuser) {
            w.id = Math.round(Math.random() * 10000000);
            callback(null);
            return;
        }
        let wd = w.getWorkspaceData(false);
        let request = {
            type: "create",
            entity: "workspace",
            data: wd,
            owner_id: owner_id,
            userId: this.main.user.id
        };
        ajax("createOrDeleteFileOrWorkspace", request, (response) => {
            w.id = response.id;
            callback(null);
        }, callback);
    }
    sendCreateFile(m, ws, owner_id, callback) {
        if (this.main.user.is_testuser) {
            m.file.id = Math.round(Math.random() * 10000000);
            callback(null);
            return;
        }
        let fd = m.getFileData(ws);
        let request = {
            type: "create",
            entity: "file",
            data: fd,
            owner_id: owner_id,
            userId: this.main.user.id
        };
        ajax("createOrDeleteFileOrWorkspace", request, (response) => {
            m.file.id = response.id;
            callback(null);
        }, callback);
    }
    sendDuplicateWorkspace(ws, callback) {
        if (this.main.user.is_testuser) {
            callback("Diese Aktion ist für den Testuser nicht möglich.", null);
            return;
        }
        let request = {
            workspace_id: ws.id,
            language: 0
        };
        ajax("duplicateWorkspace", request, (response) => {
            callback(response.message, response.workspace);
        }, callback);
    }
    sendDistributeWorkspace(ws, klasse, student_ids, callback) {
        if (this.main.user.is_testuser) {
            callback("Diese Aktion ist für den Testuser nicht möglich.");
            return;
        }
        this.sendUpdates(() => {
            let request = {
                workspace_id: ws.id,
                class_id: klasse === null || klasse === void 0 ? void 0 : klasse.id,
                student_ids: student_ids,
                language: 0
            };
            ajax("distributeWorkspace", request, (response) => {
                callback(response.message);
            }, callback);
        }, false);
    }
    sendCreateRepository(ws, publish_to, repoName, repoDescription, callback) {
        if (this.main.user.is_testuser) {
            callback("Diese Aktion ist für den Testuser nicht möglich.");
            return;
        }
        this.sendUpdates(() => {
            let request = {
                workspace_id: ws.id,
                publish_to: publish_to,
                name: repoName,
                description: repoDescription
            };
            ajax("createRepository", request, (response) => {
                ws.moduleStore.getModules(false).forEach(m => {
                    m.file.is_copy_of_id = m.file.id;
                    m.file.repository_file_version = 1;
                });
                ws.repository_id = response.repository_id;
                ws.has_write_permission_to_repository = true;
                callback(response.message, response.repository_id);
            }, callback);
        }, true);
    }
    sendDeleteWorkspaceOrFile(type, id, callback) {
        if (this.main.user.is_testuser) {
            callback(null);
            return;
        }
        let request = {
            type: "delete",
            entity: type,
            id: id,
            userId: this.main.user.id
        };
        ajax("createOrDeleteFileOrWorkspace", request, (response) => {
            if (response.success) {
                callback(null);
            }
            else {
                callback("Netzwerkfehler!");
            }
        }, callback);
    }
    sendUpdateUserSettings(callback) {
        if (this.main.user.is_testuser) {
            callback(null);
            return;
        }
        let request = {
            settings: this.main.user.settings,
            userId: this.main.user.id
        };
        ajax("updateUserSettings", request, (response) => {
            if (response.success) {
                callback(null);
            }
            else {
                callback("Netzwerkfehler!");
            }
        }, callback);
    }
    updateWorkspaces(sendUpdatesRequest, sendUpdatesResponse) {
        let idToRemoteWorkspaceDataMap = new Map();
        let fileIdsSended = [];
        sendUpdatesRequest.files.forEach(file => fileIdsSended.push(file.id));
        sendUpdatesResponse.workspaces.workspaces.forEach(wd => idToRemoteWorkspaceDataMap.set(wd.id, wd));
        let newWorkspaceNames = [];
        for (let remoteWorkspace of sendUpdatesResponse.workspaces.workspaces) {
            let localWorkspaces = this.main.workspaceList.filter(ws => ws.id == remoteWorkspace.id);
            // Did student get a workspace from his/her teacher?
            if (localWorkspaces.length == 0) {
                newWorkspaceNames.push(remoteWorkspace.name);
                this.createNewWorkspaceFromWorkspaceData(remoteWorkspace);
            }
        }
        for (let workspace of this.main.workspaceList) {
            let remoteWorkspace = idToRemoteWorkspaceDataMap.get(workspace.id);
            if (remoteWorkspace != null) {
                let idToRemoteFileDataMap = new Map();
                remoteWorkspace.files.forEach(fd => idToRemoteFileDataMap.set(fd.id, fd));
                let idToModuleMap = new Map();
                // update/delete files if necessary
                for (let module of workspace.moduleStore.getModules(false)) {
                    let fileId = module.file.id;
                    idToModuleMap.set(fileId, module);
                    let remoteFileData = idToRemoteFileDataMap.get(fileId);
                    if (remoteFileData == null) {
                        this.main.projectExplorer.fileListPanel.removeElement(module);
                        this.main.currentWorkspace.moduleStore.removeModule(module);
                    }
                    else if (remoteFileData.version > module.file.version) {
                        if (fileIdsSended.indexOf(fileId) < 0 || remoteFileData.forceUpdate) {
                            module.file.text = remoteFileData.text;
                            module.model.setValue(remoteFileData.text);
                            module.file.saved = true;
                            module.lastSavedVersionId = module.model.getAlternativeVersionId();
                        }
                        module.file.version = remoteFileData.version;
                    }
                }
                // add files if necessary
                for (let remoteFile of remoteWorkspace.files) {
                    if (idToModuleMap.get(remoteFile.id) == null) {
                        this.createFile(workspace, remoteFile);
                    }
                }
            }
        }
        if (newWorkspaceNames.length > 0) {
            let message = newWorkspaceNames.length > 1 ? "Folgende Workspaces hat Deine Lehrkraft Dir gesendet: " : "Folgenden Workspace hat Deine Lehrkraft Dir gesendet: ";
            message += newWorkspaceNames.join(", ");
            alert(message);
        }
        this.main.projectExplorer.workspaceListPanel.sortElements();
        this.main.projectExplorer.fileListPanel.sortElements();
    }
    createNewWorkspaceFromWorkspaceData(remoteWorkspace, withSort = false) {
        let w = this.main.createNewWorkspace(remoteWorkspace.name, remoteWorkspace.owner_id);
        w.id = remoteWorkspace.id;
        w.repository_id = remoteWorkspace.repository_id;
        w.has_write_permission_to_repository = remoteWorkspace.has_write_permission_to_repository;
        this.main.workspaceList.push(w);
        this.main.projectExplorer.workspaceListPanel.addElement({
            name: remoteWorkspace.name,
            externalElement: w,
            iconClass: remoteWorkspace.repository_id == null ? "workspace" : "repository"
        });
        for (let fileData of remoteWorkspace.files) {
            this.createFile(w, fileData);
        }
        if (withSort) {
            this.main.projectExplorer.workspaceListPanel.sortElements();
            this.main.projectExplorer.fileListPanel.sortElements();
        }
    }
    createFile(workspace, remoteFile) {
        let ae = null; //AccordionElement
        if (workspace == this.main.currentWorkspace) {
            ae = {
                name: remoteFile.name,
                externalElement: null
            };
            this.main.projectExplorer.fileListPanel.addElement(ae);
        }
        let f = {
            id: remoteFile.id,
            name: remoteFile.name,
            dirty: false,
            saved: true,
            text: remoteFile.text,
            version: remoteFile.version,
            is_copy_of_id: remoteFile.is_copy_of_id,
            repository_file_version: remoteFile.repository_file_version,
            identical_to_repository_version: true,
            workspace_id: workspace.id,
            panelElement: ae
        };
        let m = this.main.projectExplorer.getNewModule(f); //new Module(f, this.main);
        if (ae != null)
            ae.externalElement = m;
        let modulStore = workspace.moduleStore;
        modulStore.putModule(m);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV0d29ya01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbW11bmljYXRpb24vTmV0d29ya01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBS3ZDLE1BQU0sT0FBTyxjQUFjO0lBY3ZCLFlBQW9CLElBQVUsRUFBVSxlQUFvQztRQUF4RCxTQUFJLEdBQUosSUFBSSxDQUFNO1FBQVUsb0JBQWUsR0FBZixlQUFlLENBQXFCO1FBVjVFLGdDQUEyQixHQUFXLEVBQUUsQ0FBQztRQUN6QyxvQ0FBK0IsR0FBVyxDQUFDLENBQUM7UUFFNUMsNkJBQXdCLEdBQVcsRUFBRSxDQUFDO1FBQ3RDLHNCQUFpQixHQUFXLENBQUMsQ0FBQztRQUM5QiwwQkFBcUIsR0FBVyxJQUFJLENBQUMsd0JBQXdCLENBQUM7UUFDOUQsa0JBQWEsR0FBWSxLQUFLLENBQUM7SUFNL0IsQ0FBQztJQUVELGVBQWU7UUFFWCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsd0JBQXdCLENBQUMsQ0FBQztRQUU5RSxJQUFHLElBQUksQ0FBQyxRQUFRLElBQUksSUFBSTtZQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdkQsSUFBSSx1QkFBdUIsR0FBVyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFFN0QsSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRSxFQUFFO1lBRTVCLElBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSTtnQkFBRSxPQUFPLENBQUMsNENBQTRDO1lBRS9FLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBRTdCLElBQUcs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QUEyQjtRQUM5RSxJQUFJLEVBQUUsSUFBSSxJQUFJO1lBQUUsRUFBRSxDQUFDLGVBQWUsR0FBRyxDQUFDLENBQUM7UUFDdkMsSUFBSSxVQUFVLEdBQUcsU0FBUyxDQUFDLFdBQVcsQ0FBQztRQUN2QyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRTVCLENBQUM7Q0FJSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vbWFpbi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IGFqYXggfSBmcm9tIFwiLi9BamF4SGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZURhdGEsIEZpbGVEYXRhLCBTZW5kVXBkYXRlc1JlcXVlc3QsIFNlbmRVcGRhdGVzUmVzcG9uc2UsIENyZWF0ZU9yRGVsZXRlRmlsZU9yV29ya3NwYWNlUmVxdWVzdCwgQ1JVRFJlc3BvbnNlLCBVcGRhdGVVc2VyU2V0dGluZ3NSZXF1ZXN0LCBVcGRhdGVVc2VyU2V0dGluZ3NSZXNwb25zZSwgRHVwbGljYXRlV29ya3NwYWNlUmVxdWVzdCwgRHVwbGljYXRlV29ya3NwYWNlUmVzcG9uc2UsIENsYXNzRGF0YSwgRGlzdHJpYnV0ZVdvcmtzcGFjZVJlcXVlc3QsIERpc3RyaWJ1dGVXb3Jrc3BhY2VSZXNwb25zZSB9IGZyb20gXCIuL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBOZXR3b3JrTWFuYWdlciB7XHJcbiAgICBcclxuICAgIHRpbWVyaGFuZGxlOiBhbnk7XHJcblxyXG4gICAgb3duVXBkYXRlRnJlcXVlbmN5SW5TZWNvbmRzOiBudW1iZXIgPSAyMDtcclxuICAgIHRlYWNoZXJVcGRhdGVGcmVxdWVuY3lJblNlY29uZHM6IG51bWJlciA9IDU7XHJcblxyXG4gICAgdXBkYXRlRnJlcXVlbmN5SW5TZWNvbmRzOiBudW1iZXIgPSAyMDtcclxuICAgIGZvcmNlZFVwZGF0ZUV2ZXJ5OiBudW1iZXIgPSAyO1xyXG4gICAgc2Vjb25kc1RpbGxOZXh0VXBkYXRlOiBudW1iZXIgPSB0aGlzLnVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcztcclxuICAgIGVycm9ySGFwcGVuZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBpbnRlcnZhbDogYW55O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbiwgcHJpdmF0ZSAkdXBkYXRlVGltZXJEaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4peyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdGlhbGl6ZVRpbWVyKCkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kdXBkYXRlVGltZXJEaXYuZmluZCgnc3ZnJykuYXR0cignd2lkdGgnLCB0aGF0LnVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcyk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMuaW50ZXJ2YWwgIT0gbnVsbCkgY2xlYXJJbnRlcnZhbCh0aGlzLmludGVydmFsKTtcclxuXHJcbiAgICAgICAgbGV0IGNvdW50ZXJUaWxsRm9yY2VkVXBkYXRlOiBudW1iZXIgPSB0aGlzLmZvcmNlZFVwZGF0ZUV2ZXJ5O1xyXG5cclxuICAgICAgICB0aGlzLmludGVydmFsID0gc2V0SW50ZXJ2YWwoKCk9PntcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHRoYXQubWFpbi51c2VyID09IG51bGwpIHJldHVybjsgLy8gZG9uJ3QgY2FsbCBzZXJ2ZXIgaWYgbm8gdXNlciBpcyBsb2dnZWQgaW5cclxuXHJcbiAgICAgICAgICAgIHRoYXQuc2Vjb25kc1RpbGxOZXh0VXBkYXRlLS07XHJcblxyXG4gICAgICAgICAgICBpZih0aGF0LnNlY29uZHNUaWxsTmV4dFVwZGF0ZSA8IDAgKXtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2Vjb25kc1RpbGxOZXh0VXBkYXRlID0gdGhhdC51cGRhdGVGcmVxdWVuY3lJblNlY29uZHM7XHJcbiAgICAgICAgICAgICAgICBjb3VudGVyVGlsbEZvcmNlZFVwZGF0ZS0tO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZvcmNlVXBkYXRlID0gY291bnRlclRpbGxGb3JjZWRVcGRhdGUgPT0gMDtcclxuICAgICAgICAgICAgICAgIGlmKGZvcmNlVXBkYXRlKSBjb3VudGVyVGlsbEZvcmNlZFVwZGF0ZSA9IHRoaXMuZm9yY2VkVXBkYXRlRXZlcnk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnNlbmRVcGRhdGVzKCgpID0+IHt9LCBmb3JjZVVwZGF0ZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCAkcmVjdCA9IHRoaXMuJHVwZGF0ZVRpbWVyRGl2LmZpbmQoJy5qb191cGRhdGVUaW1lclJlY3QnKTtcclxuXHJcbiAgICAgICAgICAgICRyZWN0LmF0dHIoJ3dpZHRoJywgdGhhdC5zZWNvbmRzVGlsbE5leHRVcGRhdGUgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYodGhhdC5lcnJvckhhcHBlbmVkKXtcclxuICAgICAgICAgICAgICAgICRyZWN0LmNzcygnZmlsbCcsICcjYzAwMDAwJyk7ICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgdGhpcy4kdXBkYXRlVGltZXJEaXYuYXR0cigndGl0bGUnLFwiRmVobGVyIGJlaW0gbGV0enRlbiBTcGVpY2hlcnZvcmdhbmcgLT4gV2VyZCdzIHdpZWRlciB2ZXJzdWNoZW5cIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkcmVjdC5jc3MoJ2ZpbGwnLCAnIzAwODAwMCcpOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoaXMuJHVwZGF0ZVRpbWVyRGl2LmF0dHIoJ3RpdGxlJyx0aGF0LnNlY29uZHNUaWxsTmV4dFVwZGF0ZSArIFwiIFNla3VuZGVuIGJpcyB6dW0gbsOkY2hzdGVuIFNwZWljaGVyblwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICBcclxuICAgIH1cclxuICAgIFxyXG4gICAgc2VuZFVwZGF0ZXMoY2FsbGJhY2s/OiAoKT0+dm9pZCwgc2VuZElmTm90aGluZ0lzRGlydHk6IGJvb2xlYW4gPSBmYWxzZSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhpcy5tYWluLnVzZXIgPT0gbnVsbCB8fCB0aGlzLm1haW4udXNlci5pc190ZXN0dXNlcil7XHJcbiAgICAgICAgICAgIGlmKGNhbGxiYWNrICE9IG51bGwpIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9IFxyXG5cclxuICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLndyaXRlRWRpdG9yVGV4dFRvRmlsZSgpO1xyXG5cclxuICAgICAgICBsZXQgY2xhc3NEaWFncmFtID0gdGhpcy5tYWluLnJpZ2h0RGl2Py5jbGFzc0RpYWdyYW07XHJcbiAgICAgICAgbGV0IHVzZXJTZXR0aW5ncyA9IHRoaXMubWFpbi51c2VyLnNldHRpbmdzO1xyXG5cclxuICAgICAgICBpZihjbGFzc0RpYWdyYW0/LmRpcnR5IHx8IHRoaXMubWFpbi51c2VyRGF0YURpcnR5KXtcclxuICAgICAgICAgICAgdGhpcy5tYWluLnVzZXJEYXRhRGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgdXNlclNldHRpbmdzLmNsYXNzRGlhZ3JhbSA9IGNsYXNzRGlhZ3JhbT8uc2VyaWFsaXplKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZFVwZGF0ZVVzZXJTZXR0aW5ncygoKSA9PiB7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjbGFzc0RpYWdyYW0uZGlydHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgbGV0IHdkTGlzdDogV29ya3NwYWNlRGF0YVtdID0gW107XHJcbiAgICAgICAgbGV0IGZkTGlzdDogRmlsZURhdGFbXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IobGV0IHdzIG9mIHRoaXMubWFpbi53b3Jrc3BhY2VMaXN0KXtcclxuXHJcbiAgICAgICAgICAgIGlmKCF3cy5zYXZlZCl7XHJcbiAgICAgICAgICAgICAgICB3ZExpc3QucHVzaCh3cy5nZXRXb3Jrc3BhY2VEYXRhKGZhbHNlKSk7XHJcbiAgICAgICAgICAgICAgICB3cy5zYXZlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGZvcihsZXQgbSBvZiB3cy5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSl7XHJcbiAgICAgICAgICAgICAgICBpZighbS5maWxlLnNhdmVkKXtcclxuICAgICAgICAgICAgICAgICAgICBtLmZpbGUudGV4dCA9IG0uZ2V0UHJvZ3JhbVRleHRGcm9tTW9uYWNvTW9kZWwoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZExpc3QucHVzaChtLmdldEZpbGVEYXRhKHdzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJTYXZlIGZpbGUgXCIgKyBtLmZpbGUubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5maWxlLnNhdmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICBsZXQgcmVxdWVzdDogU2VuZFVwZGF0ZXNSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB3b3Jrc3BhY2VzV2l0aG91dEZpbGVzOiB3ZExpc3QsXHJcbiAgICAgICAgICAgIGZpbGVzOiBmZExpc3QsIFxyXG4gICAgICAgICAgICBvd25lcl9pZDogdGhpcy5tYWluLndvcmtzcGFjZXNPd25lcklkLFxyXG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGlmKHdkTGlzdC5sZW5ndGggPiAwIHx8IGZkTGlzdC5sZW5ndGggPiAwIHx8IHNlbmRJZk5vdGhpbmdJc0RpcnR5KXtcclxuICAgICAgICAgICAgYWpheCgnc2VuZFVwZGF0ZXMnLCByZXF1ZXN0LCAocmVzcG9uc2U6IFNlbmRVcGRhdGVzUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQuZXJyb3JIYXBwZW5lZCA9ICFyZXNwb25zZS5zdWNjZXNzO1xyXG4gICAgICAgICAgICAgICAgaWYoIXRoYXQuZXJyb3JIYXBwZW5lZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlV29ya3NwYWNlcyhyZXF1ZXN0LCByZXNwb25zZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKGNhbGxiYWNrICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmVycm9ySGFwcGVuZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoY2FsbGJhY2sgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzZW5kQ3JlYXRlV29ya3NwYWNlKHc6IFdvcmtzcGFjZSwgb3duZXJfaWQ6IG51bWJlciwgY2FsbGJhY2s6IChlcnJvcjogc3RyaW5nKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgdy5pZCA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKTtcclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB3ZDogV29ya3NwYWNlRGF0YSA9IHcuZ2V0V29ya3NwYWNlRGF0YShmYWxzZSk7XHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENyZWF0ZU9yRGVsZXRlRmlsZU9yV29ya3NwYWNlUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJjcmVhdGVcIixcclxuICAgICAgICAgICAgZW50aXR5OiBcIndvcmtzcGFjZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiB3ZCxcclxuICAgICAgICAgICAgb3duZXJfaWQ6IG93bmVyX2lkLCAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiY3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdy5pZCA9IHJlc3BvbnNlLmlkO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcclxuICAgICAgICB9LCBjYWxsYmFjayk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbmRDcmVhdGVGaWxlKG06IE1vZHVsZSwgd3M6IFdvcmtzcGFjZSwgb3duZXJfaWQ6IG51bWJlciwgY2FsbGJhY2s6IChlcnJvcjogc3RyaW5nKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgbS5maWxlLmlkID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGxldCBmZDogRmlsZURhdGEgPSBtLmdldEZpbGVEYXRhKHdzKTtcclxuICAgICAgICBsZXQgcmVxdWVzdDogQ3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICBlbnRpdHk6IFwiZmlsZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBmZCxcclxuICAgICAgICAgICAgb3duZXJfaWQ6IG93bmVyX2lkLFxyXG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiY3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbS5maWxlLmlkID0gcmVzcG9uc2UuaWQ7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgIH0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZER1cGxpY2F0ZVdvcmtzcGFjZSh3czogV29ya3NwYWNlLCBjYWxsYmFjazogKGVycm9yOiBzdHJpbmcsIHdvcmtzcGFjZURhdGE/OiBXb3Jrc3BhY2VEYXRhKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgY2FsbGJhY2soXCJEaWVzZSBBa3Rpb24gaXN0IGbDvHIgZGVuIFRlc3R1c2VyIG5pY2h0IG3DtmdsaWNoLlwiLCBudWxsKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBEdXBsaWNhdGVXb3Jrc3BhY2VSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB3b3Jrc3BhY2VfaWQ6IHdzLmlkLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcImR1cGxpY2F0ZVdvcmtzcGFjZVwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IER1cGxpY2F0ZVdvcmtzcGFjZVJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlLm1lc3NhZ2UsIHJlc3BvbnNlLndvcmtzcGFjZSlcclxuICAgICAgICB9LCBjYWxsYmFjayk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbmREaXN0cmlidXRlV29ya3NwYWNlKHdzOiBXb3Jrc3BhY2UsIGtsYXNzZTogQ2xhc3NEYXRhLCBzdHVkZW50X2lkczogbnVtYmVyW10sIGNhbGxiYWNrOiAoZXJyb3I6IHN0cmluZykgPT4gdm9pZCkge1xyXG5cclxuICAgICAgICBpZih0aGlzLm1haW4udXNlci5pc190ZXN0dXNlcil7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKFwiRGllc2UgQWt0aW9uIGlzdCBmw7xyIGRlbiBUZXN0dXNlciBuaWNodCBtw7ZnbGljaC5cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0aGlzLnNlbmRVcGRhdGVzKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCByZXF1ZXN0OiBEaXN0cmlidXRlV29ya3NwYWNlUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHdvcmtzcGFjZV9pZDogd3MuaWQsXHJcbiAgICAgICAgICAgICAgICBjbGFzc19pZDoga2xhc3NlPy5pZCxcclxuICAgICAgICAgICAgICAgIHN0dWRlbnRfaWRzOiBzdHVkZW50X2lkcyxcclxuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiAwXHJcbiAgICAgICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgICAgICBhamF4KFwiZGlzdHJpYnV0ZVdvcmtzcGFjZVwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IERpc3RyaWJ1dGVXb3Jrc3BhY2VSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UubWVzc2FnZSlcclxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xyXG4gICAgXHJcbiAgICAgICAgfSwgZmFsc2UpO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgc2VuZENyZWF0ZVJlcG9zaXRvcnkod3M6IFdvcmtzcGFjZSwgcHVibGlzaF90bzogbnVtYmVyLCByZXBvTmFtZTogc3RyaW5nLCByZXBvRGVzY3JpcHRpb246IHN0cmluZywgY2FsbGJhY2s6IChlcnJvcjogc3RyaW5nLCByZXBvc2l0b3J5X2lkPzogbnVtYmVyKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgY2FsbGJhY2soXCJEaWVzZSBBa3Rpb24gaXN0IGbDvHIgZGVuIFRlc3R1c2VyIG5pY2h0IG3DtmdsaWNoLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIHRoaXMuc2VuZFVwZGF0ZXMoKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgbGV0IHJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc3BhY2VfaWQ6IHdzLmlkLFxyXG4gICAgICAgICAgICAgICAgcHVibGlzaF90bzogcHVibGlzaF90byxcclxuICAgICAgICAgICAgICAgIG5hbWU6IHJlcG9OYW1lLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246IHJlcG9EZXNjcmlwdGlvblxyXG4gICAgICAgICAgICB9XHJcbiAgICBcclxuICAgICAgICAgICAgYWpheChcImNyZWF0ZVJlcG9zaXRvcnlcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiB7c3VjY2VzczogYm9vbGVhbiwgbWVzc2FnZT86IHN0cmluZywgcmVwb3NpdG9yeV9pZD86IG51bWJlcn0pID0+IHtcclxuICAgICAgICAgICAgICAgIHdzLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpLmZvckVhY2gobSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5maWxlLmlzX2NvcHlfb2ZfaWQgPSBtLmZpbGUuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5maWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uID0gMTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB3cy5yZXBvc2l0b3J5X2lkID0gcmVzcG9uc2UucmVwb3NpdG9yeV9pZDtcclxuICAgICAgICAgICAgICAgIHdzLmhhc193cml0ZV9wZXJtaXNzaW9uX3RvX3JlcG9zaXRvcnkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UubWVzc2FnZSwgcmVzcG9uc2UucmVwb3NpdG9yeV9pZClcclxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xyXG4gICAgXHJcbiAgICAgICAgfSwgdHJ1ZSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZW5kRGVsZXRlV29ya3NwYWNlT3JGaWxlKHR5cGU6IFwid29ya3NwYWNlXCIgfCBcImZpbGVcIiwgaWQ6IG51bWJlciwgY2FsbGJhY2s6IChlcnJvcjogc3RyaW5nKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRlbGV0ZVwiLFxyXG4gICAgICAgICAgICBlbnRpdHk6IHR5cGUsXHJcbiAgICAgICAgICAgIGlkOiBpZCxcclxuICAgICAgICAgICAgdXNlcklkOiB0aGlzLm1haW4udXNlci5pZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcImNyZWF0ZU9yRGVsZXRlRmlsZU9yV29ya3NwYWNlXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHJlc3BvbnNlLnN1Y2Nlc3Mpe1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcIk5ldHp3ZXJrZmVobGVyIVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZFVwZGF0ZVVzZXJTZXR0aW5ncyhjYWxsYmFjazogKGVycm9yOiBzdHJpbmcpID0+IHZvaWQpe1xyXG5cclxuICAgICAgICBpZih0aGlzLm1haW4udXNlci5pc190ZXN0dXNlcil7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogVXBkYXRlVXNlclNldHRpbmdzUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgc2V0dGluZ3M6IHRoaXMubWFpbi51c2VyLnNldHRpbmdzLFxyXG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwidXBkYXRlVXNlclNldHRpbmdzXCIsIHJlcXVlc3QsIChyZXNwb25zZTogVXBkYXRlVXNlclNldHRpbmdzUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgaWYocmVzcG9uc2Uuc3VjY2Vzcyl7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiTmV0endlcmtmZWhsZXIhXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgY2FsbGJhY2spO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSB1cGRhdGVXb3Jrc3BhY2VzKHNlbmRVcGRhdGVzUmVxdWVzdDogU2VuZFVwZGF0ZXNSZXF1ZXN0LCBzZW5kVXBkYXRlc1Jlc3BvbnNlOiBTZW5kVXBkYXRlc1Jlc3BvbnNlKXtcclxuXHJcbiAgICAgICAgbGV0IGlkVG9SZW1vdGVXb3Jrc3BhY2VEYXRhTWFwOiBNYXA8bnVtYmVyLCBXb3Jrc3BhY2VEYXRhPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAgICAgbGV0IGZpbGVJZHNTZW5kZWQgPSBbXTtcclxuICAgICAgICBzZW5kVXBkYXRlc1JlcXVlc3QuZmlsZXMuZm9yRWFjaChmaWxlID0+IGZpbGVJZHNTZW5kZWQucHVzaChmaWxlLmlkKSk7XHJcblxyXG4gICAgICAgIHNlbmRVcGRhdGVzUmVzcG9uc2Uud29ya3NwYWNlcy53b3Jrc3BhY2VzLmZvckVhY2god2QgPT4gaWRUb1JlbW90ZVdvcmtzcGFjZURhdGFNYXAuc2V0KHdkLmlkLCB3ZCkpO1xyXG5cclxuICAgICAgICBsZXQgbmV3V29ya3NwYWNlTmFtZXM6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHJlbW90ZVdvcmtzcGFjZSBvZiBzZW5kVXBkYXRlc1Jlc3BvbnNlLndvcmtzcGFjZXMud29ya3NwYWNlcykge1xyXG5cclxuICAgICAgICAgICAgbGV0IGxvY2FsV29ya3NwYWNlcyA9IHRoaXMubWFpbi53b3Jrc3BhY2VMaXN0LmZpbHRlcih3cyA9PiB3cy5pZCA9PSByZW1vdGVXb3Jrc3BhY2UuaWQpO1xyXG5cclxuICAgICAgICAgICAgLy8gRGlkIHN0dWRlbnQgZ2V0IGEgd29ya3NwYWNlIGZyb20gaGlzL2hlciB0ZWFjaGVyP1xyXG4gICAgICAgICAgICBpZiAobG9jYWxXb3Jrc3BhY2VzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdXb3Jrc3BhY2VOYW1lcy5wdXNoKHJlbW90ZVdvcmtzcGFjZS5uYW1lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlTmV3V29ya3NwYWNlRnJvbVdvcmtzcGFjZURhdGEocmVtb3RlV29ya3NwYWNlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgZm9yKGxldCB3b3Jrc3BhY2Ugb2YgdGhpcy5tYWluLndvcmtzcGFjZUxpc3Qpe1xyXG4gICAgICAgICAgICBsZXQgcmVtb3RlV29ya3NwYWNlOiBXb3Jrc3BhY2VEYXRhID0gaWRUb1JlbW90ZVdvcmtzcGFjZURhdGFNYXAuZ2V0KHdvcmtzcGFjZS5pZCk7XHJcbiAgICAgICAgICAgIGlmKHJlbW90ZVdvcmtzcGFjZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIGxldCBpZFRvUmVtb3RlRmlsZURhdGFNYXA6IE1hcDxudW1iZXIsIEZpbGVEYXRhPiA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgICAgIHJlbW90ZVdvcmtzcGFjZS5maWxlcy5mb3JFYWNoKGZkID0+IGlkVG9SZW1vdGVGaWxlRGF0YU1hcC5zZXQoZmQuaWQsIGZkKSk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGxldCBpZFRvTW9kdWxlTWFwOiBNYXA8bnVtYmVyLCBNb2R1bGU+ID0gbmV3IE1hcCgpO1xyXG4gICAgICAgICAgICAgICAgLy8gdXBkYXRlL2RlbGV0ZSBmaWxlcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICAgICAgICAgIGZvcihsZXQgbW9kdWxlIG9mIHdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGVJZCA9IG1vZHVsZS5maWxlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGlkVG9Nb2R1bGVNYXAuc2V0KGZpbGVJZCwgbW9kdWxlKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmVtb3RlRmlsZURhdGEgPSBpZFRvUmVtb3RlRmlsZURhdGFNYXAuZ2V0KGZpbGVJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYocmVtb3RlRmlsZURhdGEgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuZmlsZUxpc3RQYW5lbC5yZW1vdmVFbGVtZW50KG1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLnJlbW92ZU1vZHVsZShtb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihyZW1vdGVGaWxlRGF0YS52ZXJzaW9uID4gbW9kdWxlLmZpbGUudmVyc2lvbil7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGZpbGVJZHNTZW5kZWQuaW5kZXhPZihmaWxlSWQpIDwgMCB8fCByZW1vdGVGaWxlRGF0YS5mb3JjZVVwZGF0ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS50ZXh0ID0gcmVtb3RlRmlsZURhdGEudGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZHVsZS5tb2RlbC5zZXRWYWx1ZShyZW1vdGVGaWxlRGF0YS50ZXh0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS5zYXZlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUubGFzdFNhdmVkVmVyc2lvbklkID0gbW9kdWxlLm1vZGVsLmdldEFsdGVybmF0aXZlVmVyc2lvbklkKClcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS52ZXJzaW9uID0gcmVtb3RlRmlsZURhdGEudmVyc2lvbjtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gYWRkIGZpbGVzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgICAgICAgICAgZm9yKGxldCByZW1vdGVGaWxlIG9mIHJlbW90ZVdvcmtzcGFjZS5maWxlcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYoaWRUb01vZHVsZU1hcC5nZXQocmVtb3RlRmlsZS5pZCkgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlRmlsZSh3b3Jrc3BhY2UsIHJlbW90ZUZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gICAgICAgIFxyXG5cclxuICAgICAgICBpZihuZXdXb3Jrc3BhY2VOYW1lcy5sZW5ndGggPiAwKXtcclxuICAgICAgICAgICAgbGV0IG1lc3NhZ2U6IHN0cmluZyA9IG5ld1dvcmtzcGFjZU5hbWVzLmxlbmd0aCA+IDEgPyBcIkZvbGdlbmRlIFdvcmtzcGFjZXMgaGF0IERlaW5lIExlaHJrcmFmdCBEaXIgZ2VzZW5kZXQ6IFwiIDogXCJGb2xnZW5kZW4gV29ya3NwYWNlIGhhdCBEZWluZSBMZWhya3JhZnQgRGlyIGdlc2VuZGV0OiBcIjtcclxuICAgICAgICAgICAgbWVzc2FnZSArPSBuZXdXb3Jrc3BhY2VOYW1lcy5qb2luKFwiLCBcIik7XHJcbiAgICAgICAgICAgIGFsZXJ0KG1lc3NhZ2UpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuc29ydEVsZW1lbnRzKCk7XHJcbiAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5maWxlTGlzdFBhbmVsLnNvcnRFbGVtZW50cygpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY3JlYXRlTmV3V29ya3NwYWNlRnJvbVdvcmtzcGFjZURhdGEocmVtb3RlV29ya3NwYWNlOiBXb3Jrc3BhY2VEYXRhLCB3aXRoU29ydDogYm9vbGVhbiA9IGZhbHNlKSB7XHJcbiAgICAgICAgbGV0IHcgPSB0aGlzLm1haW4uY3JlYXRlTmV3V29ya3NwYWNlKHJlbW90ZVdvcmtzcGFjZS5uYW1lLCByZW1vdGVXb3Jrc3BhY2Uub3duZXJfaWQpO1xyXG4gICAgICAgIHcuaWQgPSByZW1vdGVXb3Jrc3BhY2UuaWQ7XHJcbiAgICAgICAgdy5yZXBvc2l0b3J5X2lkID0gcmVtb3RlV29ya3NwYWNlLnJlcG9zaXRvcnlfaWQ7XHJcbiAgICAgICAgdy5oYXNfd3JpdGVfcGVybWlzc2lvbl90b19yZXBvc2l0b3J5ID0gcmVtb3RlV29ya3NwYWNlLmhhc193cml0ZV9wZXJtaXNzaW9uX3RvX3JlcG9zaXRvcnk7XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi53b3Jrc3BhY2VMaXN0LnB1c2godyk7XHJcbiAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuYWRkRWxlbWVudCh7XHJcbiAgICAgICAgICAgIG5hbWU6IHJlbW90ZVdvcmtzcGFjZS5uYW1lLFxyXG4gICAgICAgICAgICBleHRlcm5hbEVsZW1lbnQ6IHcsXHJcbiAgICAgICAgICAgIGljb25DbGFzczogcmVtb3RlV29ya3NwYWNlLnJlcG9zaXRvcnlfaWQgPT0gbnVsbCA/IFwid29ya3NwYWNlXCIgOiBcInJlcG9zaXRvcnlcIlxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBmaWxlRGF0YSBvZiByZW1vdGVXb3Jrc3BhY2UuZmlsZXMpIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVGaWxlKHcsIGZpbGVEYXRhKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHdpdGhTb3J0KXtcclxuICAgICAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuc29ydEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuZmlsZUxpc3RQYW5lbC5zb3J0RWxlbWVudHMoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVGaWxlKHdvcmtzcGFjZTogV29ya3NwYWNlLCByZW1vdGVGaWxlOiBGaWxlRGF0YSkge1xyXG4gICAgICAgIGxldCBhZTogYW55ID0gbnVsbDsgLy9BY2NvcmRpb25FbGVtZW50XHJcbiAgICAgICAgaWYgKHdvcmtzcGFjZSA9PSB0aGlzLm1haW4uY3VycmVudFdvcmtzcGFjZSkge1xyXG4gICAgICAgICAgICBhZSA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHJlbW90ZUZpbGUubmFtZSxcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsRWxlbWVudDogbnVsbFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmZpbGVMaXN0UGFuZWwuYWRkRWxlbWVudChhZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZjogYW55ID0geyAvLyBGaWxlXHJcbiAgICAgICAgICAgIGlkOiByZW1vdGVGaWxlLmlkLFxyXG4gICAgICAgICAgICBuYW1lOiByZW1vdGVGaWxlLm5hbWUsXHJcbiAgICAgICAgICAgIGRpcnR5OiBmYWxzZSxcclxuICAgICAgICAgICAgc2F2ZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHRleHQ6IHJlbW90ZUZpbGUudGV4dCxcclxuICAgICAgICAgICAgdmVyc2lvbjogcmVtb3RlRmlsZS52ZXJzaW9uLFxyXG4gICAgICAgICAgICBpc19jb3B5X29mX2lkOiByZW1vdGVGaWxlLmlzX2NvcHlfb2ZfaWQsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiByZW1vdGVGaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uLFxyXG4gICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiB0cnVlLFxyXG4gICAgICAgICAgICB3b3Jrc3BhY2VfaWQ6IHdvcmtzcGFjZS5pZCxcclxuICAgICAgICAgICAgcGFuZWxFbGVtZW50OiBhZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbGV0IG0gPSB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmdldE5ld01vZHVsZShmKTsgLy9uZXcgTW9kdWxlKGYsIHRoaXMubWFpbik7XHJcbiAgICAgICAgaWYgKGFlICE9IG51bGwpIGFlLmV4dGVybmFsRWxlbWVudCA9IG07XHJcbiAgICAgICAgbGV0IG1vZHVsU3RvcmUgPSB3b3Jrc3BhY2UubW9kdWxlU3RvcmU7XHJcbiAgICAgICAgbW9kdWxTdG9yZS5wdXRNb2R1bGUobSk7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19