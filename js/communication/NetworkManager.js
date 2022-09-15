import { ajax, PerformanceCollector } from "./AjaxHelper.js";
import { NotifierClient } from "./NotifierClient.js";
export class NetworkManager {
    constructor(main, $updateTimerDiv) {
        this.main = main;
        this.$updateTimerDiv = $updateTimerDiv;
        this.ownUpdateFrequencyInSeconds = 25;
        this.teacherUpdateFrequencyInSeconds = 5;
        this.updateFrequencyInSeconds = 25;
        this.forcedUpdateEvery = 25;
        this.forcedUpdatesInARow = 0;
        this.secondsTillNextUpdate = this.updateFrequencyInSeconds;
        this.errorHappened = false;
    }
    initializeTimer() {
        let that = this;
        this.$updateTimerDiv.find('svg').attr('width', that.updateFrequencyInSeconds);
        if (this.interval != null)
            clearInterval(this.interval);
        this.counterTillForcedUpdate = this.forcedUpdateEvery;
        this.interval = setInterval(() => {
            if (that.main.user == null)
                return; // don't call server if no user is logged in
            that.secondsTillNextUpdate--;
            if (that.secondsTillNextUpdate < 0) {
                that.secondsTillNextUpdate = that.updateFrequencyInSeconds;
                that.counterTillForcedUpdate--;
                let doForceUpdate = that.counterTillForcedUpdate == 0;
                if (doForceUpdate) {
                    this.forcedUpdatesInARow++;
                    that.counterTillForcedUpdate = this.forcedUpdateEvery;
                    if (this.forcedUpdatesInARow > 50) {
                        that.counterTillForcedUpdate = this.forcedUpdateEvery * 10;
                    }
                }
                that.sendUpdates(() => { }, doForceUpdate, false);
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
            PerformanceCollector.sendDataToServer();
        }, 1000);
    }
    initializeNotifierClient() {
        this.notifierClient = new NotifierClient(this.main, this);
    }
    sendUpdates(callback, sendIfNothingIsDirty = false, sendBeacon = false) {
        var _a, _b;
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
            this.sendUpdateUserSettings(() => { }, sendBeacon);
            this.forcedUpdatesInARow = 0;
        }
        classDiagram.dirty = false;
        let wdList = [];
        let fdList = [];
        for (let ws of this.main.workspaceList) {
            if (!ws.saved) {
                wdList.push(ws.getWorkspaceData(false));
                ws.saved = true;
                this.forcedUpdatesInARow = 0;
            }
            for (let m of ws.moduleStore.getModules(false)) {
                if (!m.file.saved) {
                    this.forcedUpdatesInARow = 0;
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
            language: 0,
            currentWorkspaceId: (_b = this.main.currentWorkspace) === null || _b === void 0 ? void 0 : _b.id,
            getModifiedWorkspaces: sendIfNothingIsDirty
        };
        let that = this;
        if (wdList.length > 0 || fdList.length > 0 || sendIfNothingIsDirty) {
            if (sendBeacon) {
                navigator.sendBeacon("sendUpdates", JSON.stringify(request));
            }
            else {
                ajax('sendUpdates', request, (response) => {
                    that.errorHappened = !response.success;
                    if (!that.errorHappened) {
                        // if (this.main.workspacesOwnerId == this.main.user.id) {
                        if (response.workspaces != null) {
                            that.updateWorkspaces(request, response);
                        }
                        if (response.filesToForceUpdate != null) {
                            that.updateFiles(response.filesToForceUpdate);
                        }
                        if (callback != null) {
                            callback();
                            return;
                        }
                        // }
                    }
                }, () => {
                    that.errorHappened = true;
                });
            }
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
    sendSetSecret(repositoryId, read, write, callback) {
        let request = { repository_id: repositoryId, newSecretRead: read, newSecretWrite: write };
        ajax("setRepositorySecret", request, (response) => {
            callback(response);
        }, (message) => { alert(message); });
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
    sendUpdateUserSettings(callback, sendBeacon = false) {
        if (this.main.user.is_testuser) {
            callback(null);
            return;
        }
        let request = {
            settings: this.main.user.settings,
            userId: this.main.user.id
        };
        if (sendBeacon) {
            navigator.sendBeacon("updateUserSettings", JSON.stringify(request));
        }
        else {
            ajax("updateUserSettings", request, (response) => {
                if (response.success) {
                    callback(null);
                }
                else {
                    callback("Netzwerkfehler!");
                }
            }, callback);
        }
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
                    else if (fileIdsSended.indexOf(fileId) < 0 && module.file.text != remoteFileData.text) {
                        module.file.text = remoteFileData.text;
                        module.model.setValue(remoteFileData.text);
                        module.file.saved = true;
                        module.lastSavedVersionId = module.model.getAlternativeVersionId();
                    }
                    module.file.version = remoteFileData.version;
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
    updateFiles(filesFromServer) {
        let fileIdToLocalModuleMap = new Map();
        for (let workspace of this.main.workspaceList) {
            for (let module of workspace.moduleStore.getModules(false)) {
                fileIdToLocalModuleMap[module.file.id] = module;
            }
        }
        for (let remoteFile of filesFromServer) {
            let module = fileIdToLocalModuleMap[remoteFile.id];
            if (module != null && module.file.text != remoteFile.text) {
                module.file.text = remoteFile.text;
                module.model.setValue(remoteFile.text);
                module.file.saved = true;
                module.lastSavedVersionId = module.model.getAlternativeVersionId();
                module.file.version = remoteFile.version;
            }
        }
    }
    createNewWorkspaceFromWorkspaceData(remoteWorkspace, withSort = false) {
        let w = this.main.createNewWorkspace(remoteWorkspace.name, remoteWorkspace.owner_id);
        w.id = remoteWorkspace.id;
        w.repository_id = remoteWorkspace.repository_id;
        w.has_write_permission_to_repository = remoteWorkspace.has_write_permission_to_repository;
        w.path = remoteWorkspace.path;
        w.isFolder = remoteWorkspace.isFolder;
        w.moduleStore.dirty = true;
        if (remoteWorkspace.settings != null && remoteWorkspace.settings.startsWith("{")) {
            let remoteWorkspaceSettings = JSON.parse(remoteWorkspace.settings);
            w.settings = remoteWorkspaceSettings;
            w.moduleStore.setAdditionalLibraries(remoteWorkspaceSettings.libraries);
        }
        this.main.workspaceList.push(w);
        let path = remoteWorkspace.path.split("/");
        if (path.length == 1 && path[0] == "")
            path = [];
        let panelElement = {
            name: remoteWorkspace.name,
            externalElement: w,
            iconClass: remoteWorkspace.repository_id == null ? "workspace" : "repository",
            isFolder: remoteWorkspace.isFolder,
            path: path
        };
        this.main.projectExplorer.workspaceListPanel.addElement(panelElement, true);
        w.panelElement = panelElement;
        if (w.repository_id != null) {
            w.renderSynchronizeButton(panelElement);
        }
        for (let fileData of remoteWorkspace.files) {
            this.createFile(w, fileData);
        }
        if (withSort) {
            this.main.projectExplorer.workspaceListPanel.sortElements();
            this.main.projectExplorer.fileListPanel.sortElements();
        }
        return w;
    }
    createFile(workspace, remoteFile) {
        let ae = null; //AccordionElement
        if (workspace == this.main.currentWorkspace) {
            ae = {
                name: remoteFile.name,
                externalElement: null
            };
            this.main.projectExplorer.fileListPanel.addElement(ae, true);
        }
        let f = {
            id: remoteFile.id,
            name: remoteFile.name,
            dirty: true,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV0d29ya01hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2NvbW11bmljYXRpb24vTmV0d29ya01hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBTzdELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUVyRCxNQUFNLE9BQU8sY0FBYztJQW9CdkIsWUFBb0IsSUFBVSxFQUFVLGVBQW9DO1FBQXhELFNBQUksR0FBSixJQUFJLENBQU07UUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBcUI7UUFoQjVFLGdDQUEyQixHQUFXLEVBQUUsQ0FBQztRQUN6QyxvQ0FBK0IsR0FBVyxDQUFDLENBQUM7UUFFNUMsNkJBQXdCLEdBQVcsRUFBRSxDQUFDO1FBQ3RDLHNCQUFpQixHQUFXLEVBQUUsQ0FBQztRQUMvQix3QkFBbUIsR0FBVyxDQUFDLENBQUM7UUFFaEMsMEJBQXFCLEdBQVcsSUFBSSxDQUFDLHdCQUF3QixDQUFDO1FBQzlELGtCQUFhLEdBQVksS0FBSyxDQUFDO0lBVS9CLENBQUM7SUFFRCxlQUFlO1FBRVgsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLHdCQUF3QixDQUFDLENBQUM7UUFFOUUsSUFBSSxJQUFJLENBQUMsUUFBUSxJQUFJLElBQUk7WUFBRSxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXhELElBQUksQ0FBQyx1QkFBdUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7UUFFdEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxXQUFXLENBQUMsR0FBRyxFQUFFO1lBRTdCLElBQUksSUFBSSxDQUFDLElBQUks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RSxVQUFVLENBQUMsYUFBYTtZQUN2Qyx1QkFBdUIsRUFBRSxVQUFVLENBQUMsdUJBQXVCO1lBQzNELCtCQUErQixFQUFFLElBQUk7WUFDckMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxFQUFFO1lBQzFCLFlBQVksRUFBRSxFQUFFO1NBQ25CLENBQUM7UUFDRixJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQywyQkFBMkI7UUFDOUUsSUFBSSxFQUFFLElBQUksSUFBSTtZQUFFLEVBQUUsQ0FBQyxlQUFlLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZDLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQyxXQUFXLENBQUM7UUFDdkMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUU1QixDQUFDO0NBSUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBhamF4LCBQZXJmb3JtYW5jZUNvbGxlY3RvciB9IGZyb20gXCIuL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlRGF0YSwgRmlsZURhdGEsIFNlbmRVcGRhdGVzUmVxdWVzdCwgU2VuZFVwZGF0ZXNSZXNwb25zZSwgQ3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VSZXF1ZXN0LCBDUlVEUmVzcG9uc2UsIFVwZGF0ZVVzZXJTZXR0aW5nc1JlcXVlc3QsIFVwZGF0ZVVzZXJTZXR0aW5nc1Jlc3BvbnNlLCBEdXBsaWNhdGVXb3Jrc3BhY2VSZXF1ZXN0LCBEdXBsaWNhdGVXb3Jrc3BhY2VSZXNwb25zZSwgQ2xhc3NEYXRhLCBEaXN0cmlidXRlV29ya3NwYWNlUmVxdWVzdCwgRGlzdHJpYnV0ZVdvcmtzcGFjZVJlc3BvbnNlLCBDb2xsZWN0UGVyZm9ybWFuY2VEYXRhUmVxdWVzdCwgU2V0UmVwb3NpdG9yeVNlY3JldFJlcXVlc3QsIFNldFJlcG9zaXRvcnlTZWNyZXRSZXNwb25zZSB9IGZyb20gXCIuL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgQWNjb3JkaW9uRWxlbWVudCwgQWNjb3JkaW9uUGFuZWwgfSBmcm9tIFwiLi4vbWFpbi9ndWkvQWNjb3JkaW9uLmpzXCI7XHJcbmltcG9ydCB7V29ya3NwYWNlU2V0dGluZ3MgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IHJlc3BvbnNlIH0gZnJvbSBcImV4cHJlc3NcIjtcclxuaW1wb3J0IHsgTm90aWZpZXJDbGllbnQgfSBmcm9tIFwiLi9Ob3RpZmllckNsaWVudC5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE5ldHdvcmtNYW5hZ2VyIHtcclxuXHJcbiAgICB0aW1lcmhhbmRsZTogYW55O1xyXG5cclxuICAgIG93blVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kczogbnVtYmVyID0gMjU7XHJcbiAgICB0ZWFjaGVyVXBkYXRlRnJlcXVlbmN5SW5TZWNvbmRzOiBudW1iZXIgPSA1O1xyXG5cclxuICAgIHVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kczogbnVtYmVyID0gMjU7XHJcbiAgICBmb3JjZWRVcGRhdGVFdmVyeTogbnVtYmVyID0gMjU7XHJcbiAgICBmb3JjZWRVcGRhdGVzSW5BUm93OiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHNlY29uZHNUaWxsTmV4dFVwZGF0ZTogbnVtYmVyID0gdGhpcy51cGRhdGVGcmVxdWVuY3lJblNlY29uZHM7XHJcbiAgICBlcnJvckhhcHBlbmVkOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgaW50ZXJ2YWw6IGFueTtcclxuXHJcbiAgICBjb3VudGVyVGlsbEZvcmNlZFVwZGF0ZTogbnVtYmVyO1xyXG5cclxuICAgIG5vdGlmaWVyQ2xpZW50OiBOb3RpZmllckNsaWVudDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1haW46IE1haW4sIHByaXZhdGUgJHVwZGF0ZVRpbWVyRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXRpYWxpemVUaW1lcigpIHtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMuJHVwZGF0ZVRpbWVyRGl2LmZpbmQoJ3N2ZycpLmF0dHIoJ3dpZHRoJywgdGhhdC51cGRhdGVGcmVxdWVuY3lJblNlY29uZHMpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pbnRlcnZhbCAhPSBudWxsKSBjbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xyXG5cclxuICAgICAgICB0aGlzLmNvdW50ZXJUaWxsRm9yY2VkVXBkYXRlID0gdGhpcy5mb3JjZWRVcGRhdGVFdmVyeTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0Lm1haW4udXNlciA9PSBudWxsKSByZXR1cm47IC8vIGRvbid0IGNhbGwgc2VydmVyIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluXHJcblxyXG4gICAgICAgICAgICB0aGF0LnNlY29uZHNUaWxsTmV4dFVwZGF0ZS0tO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQuc2Vjb25kc1RpbGxOZXh0VXBkYXRlIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZWNvbmRzVGlsbE5leHRVcGRhdGUgPSB0aGF0LnVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcztcclxuICAgICAgICAgICAgICAgIHRoYXQuY291bnRlclRpbGxGb3JjZWRVcGRhdGUtLTtcclxuICAgICAgICAgICAgICAgIGxldCBkb0ZvcmNlVXBkYXRlID0gdGhhdC5jb3VudGVyVGlsbEZvcmNlZFVwZGF0ZSA9PSAwO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRvRm9yY2VVcGRhdGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZvcmNlZFVwZGF0ZXNJbkFSb3crKztcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmNvdW50ZXJUaWxsRm9yY2VkVXBkYXRlID0gdGhpcy5mb3JjZWRVcGRhdGVFdmVyeTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5mb3JjZWRVcGRhdGVzSW5BUm93ID4gNTApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jb3VudGVyVGlsbEZvcmNlZFVwZGF0ZSA9IHRoaXMuZm9yY2VkVXBkYXRlRXZlcnkgKiAxMDtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuc2VuZFVwZGF0ZXMoKCkgPT4geyB9LCBkb0ZvcmNlVXBkYXRlLCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgJHJlY3QgPSB0aGlzLiR1cGRhdGVUaW1lckRpdi5maW5kKCcuam9fdXBkYXRlVGltZXJSZWN0Jyk7XHJcblxyXG4gICAgICAgICAgICAkcmVjdC5hdHRyKCd3aWR0aCcsIHRoYXQuc2Vjb25kc1RpbGxOZXh0VXBkYXRlICsgXCJweFwiKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0LmVycm9ySGFwcGVuZWQpIHtcclxuICAgICAgICAgICAgICAgICRyZWN0LmNzcygnZmlsbCcsICcjYzAwMDAwJyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiR1cGRhdGVUaW1lckRpdi5hdHRyKCd0aXRsZScsIFwiRmVobGVyIGJlaW0gbGV0enRlbiBTcGVpY2hlcnZvcmdhbmcgLT4gV2VyZCdzIHdpZWRlciB2ZXJzdWNoZW5cIik7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAkcmVjdC5jc3MoJ2ZpbGwnLCAnIzAwODAwMCcpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kdXBkYXRlVGltZXJEaXYuYXR0cigndGl0bGUnLCB0aGF0LnNlY29uZHNUaWxsTmV4dFVwZGF0ZSArIFwiIFNla3VuZGVuIGJpcyB6dW0gbsOkY2hzdGVuIFNwZWljaGVyblwiKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgUGVyZm9ybWFuY2VDb2xsZWN0b3Iuc2VuZERhdGFUb1NlcnZlcigpO1xyXG5cclxuICAgICAgICB9LCAxMDAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdGlhbGl6ZU5vdGlmaWVyQ2xpZW50KCl7XHJcbiAgICAgICAgdGhpcy5ub3RpZmllckNsaWVudCA9IG5ldyBOb3RpZmllckNsaWVudCh0aGlzLm1haW4sIHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbmRVcGRhdGVzKGNhbGxiYWNrPzogKCkgPT4gdm9pZCwgc2VuZElmTm90aGluZ0lzRGlydHk6IGJvb2xlYW4gPSBmYWxzZSwgc2VuZEJlYWNvbjogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW4udXNlciA9PSBudWxsIHx8IHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKSB7XHJcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLndyaXRlRWRpdG9yVGV4dFRvRmlsZSgpO1xyXG5cclxuICAgICAgICBsZXQgY2xhc3NEaWFncmFtID0gdGhpcy5tYWluLnJpZ2h0RGl2Py5jbGFzc0RpYWdyYW07XHJcbiAgICAgICAgbGV0IHVzZXJTZXR0aW5ncyA9IHRoaXMubWFpbi51c2VyLnNldHRpbmdzO1xyXG5cclxuICAgICAgICBpZiAoY2xhc3NEaWFncmFtPy5kaXJ0eSB8fCB0aGlzLm1haW4udXNlckRhdGFEaXJ0eSkge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLnVzZXJEYXRhRGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgdXNlclNldHRpbmdzLmNsYXNzRGlhZ3JhbSA9IGNsYXNzRGlhZ3JhbT8uc2VyaWFsaXplKCk7XHJcbiAgICAgICAgICAgIHRoaXMuc2VuZFVwZGF0ZVVzZXJTZXR0aW5ncygoKSA9PiB7IH0sIHNlbmRCZWFjb24pO1xyXG4gICAgICAgICAgICB0aGlzLmZvcmNlZFVwZGF0ZXNJbkFSb3cgPSAwO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY2xhc3NEaWFncmFtLmRpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCB3ZExpc3Q6IFdvcmtzcGFjZURhdGFbXSA9IFtdO1xyXG4gICAgICAgIGxldCBmZExpc3Q6IEZpbGVEYXRhW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgd3Mgb2YgdGhpcy5tYWluLndvcmtzcGFjZUxpc3QpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICghd3Muc2F2ZWQpIHtcclxuICAgICAgICAgICAgICAgIHdkTGlzdC5wdXNoKHdzLmdldFdvcmtzcGFjZURhdGEoZmFsc2UpKTtcclxuICAgICAgICAgICAgICAgIHdzLnNhdmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZm9yY2VkVXBkYXRlc0luQVJvdyA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IG0gb2Ygd3MubW9kdWxlU3RvcmUuZ2V0TW9kdWxlcyhmYWxzZSkpIHtcclxuICAgICAgICAgICAgICAgIGlmICghbS5maWxlLnNhdmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mb3JjZWRVcGRhdGVzSW5BUm93ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBtLmZpbGUudGV4dCA9IG0uZ2V0UHJvZ3JhbVRleHRGcm9tTW9uYWNvTW9kZWwoKTtcclxuICAgICAgICAgICAgICAgICAgICBmZExpc3QucHVzaChtLmdldEZpbGVEYXRhKHdzKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJTYXZlIGZpbGUgXCIgKyBtLmZpbGUubmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5maWxlLnNhdmVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IFNlbmRVcGRhdGVzUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgd29ya3NwYWNlc1dpdGhvdXRGaWxlczogd2RMaXN0LFxyXG4gICAgICAgICAgICBmaWxlczogZmRMaXN0LFxyXG4gICAgICAgICAgICBvd25lcl9pZDogdGhpcy5tYWluLndvcmtzcGFjZXNPd25lcklkLFxyXG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogMCxcclxuICAgICAgICAgICAgY3VycmVudFdvcmtzcGFjZUlkOiB0aGlzLm1haW4uY3VycmVudFdvcmtzcGFjZT8uaWQsXHJcbiAgICAgICAgICAgIGdldE1vZGlmaWVkV29ya3NwYWNlczogc2VuZElmTm90aGluZ0lzRGlydHlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBpZiAod2RMaXN0Lmxlbmd0aCA+IDAgfHwgZmRMaXN0Lmxlbmd0aCA+IDAgfHwgc2VuZElmTm90aGluZ0lzRGlydHkpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChzZW5kQmVhY29uKSB7XHJcbiAgICAgICAgICAgICAgICBuYXZpZ2F0b3Iuc2VuZEJlYWNvbihcInNlbmRVcGRhdGVzXCIsIEpTT04uc3RyaW5naWZ5KHJlcXVlc3QpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICBhamF4KCdzZW5kVXBkYXRlcycsIHJlcXVlc3QsIChyZXNwb25zZTogU2VuZFVwZGF0ZXNSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZXJyb3JIYXBwZW5lZCA9ICFyZXNwb25zZS5zdWNjZXNzO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhhdC5lcnJvckhhcHBlbmVkKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpZiAodGhpcy5tYWluLndvcmtzcGFjZXNPd25lcklkID09IHRoaXMubWFpbi51c2VyLmlkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uud29ya3NwYWNlcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC51cGRhdGVXb3Jrc3BhY2VzKHJlcXVlc3QsIHJlc3BvbnNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5maWxlc1RvRm9yY2VVcGRhdGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlRmlsZXMocmVzcG9uc2UuZmlsZXNUb0ZvcmNlVXBkYXRlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZXJyb3JIYXBwZW5lZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbmRDcmVhdGVXb3Jrc3BhY2UodzogV29ya3NwYWNlLCBvd25lcl9pZDogbnVtYmVyLCBjYWxsYmFjazogKGVycm9yOiBzdHJpbmcpID0+IHZvaWQpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKSB7XHJcbiAgICAgICAgICAgIHcuaWQgPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgd2Q6IFdvcmtzcGFjZURhdGEgPSB3LmdldFdvcmtzcGFjZURhdGEoZmFsc2UpO1xyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDcmVhdGVPckRlbGV0ZUZpbGVPcldvcmtzcGFjZVJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICAgIGVudGl0eTogXCJ3b3Jrc3BhY2VcIixcclxuICAgICAgICAgICAgZGF0YTogd2QsXHJcbiAgICAgICAgICAgIG93bmVyX2lkOiBvd25lcl9pZCxcclxuICAgICAgICAgICAgdXNlcklkOiB0aGlzLm1haW4udXNlci5pZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcImNyZWF0ZU9yRGVsZXRlRmlsZU9yV29ya3NwYWNlXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHcuaWQgPSByZXNwb25zZS5pZDtcclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgfSwgY2FsbGJhY2spO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZW5kQ3JlYXRlRmlsZShtOiBNb2R1bGUsIHdzOiBXb3Jrc3BhY2UsIG93bmVyX2lkOiBudW1iZXIsIGNhbGxiYWNrOiAoZXJyb3I6IHN0cmluZykgPT4gdm9pZCkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYWluLnVzZXIuaXNfdGVzdHVzZXIpIHtcclxuICAgICAgICAgICAgbS5maWxlLmlkID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhudWxsKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGxldCBmZDogRmlsZURhdGEgPSBtLmdldEZpbGVEYXRhKHdzKTtcclxuICAgICAgICBsZXQgcmVxdWVzdDogQ3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICBlbnRpdHk6IFwiZmlsZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBmZCxcclxuICAgICAgICAgICAgb3duZXJfaWQ6IG93bmVyX2lkLFxyXG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMubWFpbi51c2VyLmlkXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiY3JlYXRlT3JEZWxldGVGaWxlT3JXb3Jrc3BhY2VcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbS5maWxlLmlkID0gcmVzcG9uc2UuaWQ7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgIH0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZER1cGxpY2F0ZVdvcmtzcGFjZSh3czogV29ya3NwYWNlLCBjYWxsYmFjazogKGVycm9yOiBzdHJpbmcsIHdvcmtzcGFjZURhdGE/OiBXb3Jrc3BhY2VEYXRhKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW4udXNlci5pc190ZXN0dXNlcikge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhcIkRpZXNlIEFrdGlvbiBpc3QgZsO8ciBkZW4gVGVzdHVzZXIgbmljaHQgbcO2Z2xpY2guXCIsIG51bGwpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IER1cGxpY2F0ZVdvcmtzcGFjZVJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHdvcmtzcGFjZV9pZDogd3MuaWQsXHJcbiAgICAgICAgICAgIGxhbmd1YWdlOiAwXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiZHVwbGljYXRlV29ya3NwYWNlXCIsIHJlcXVlc3QsIChyZXNwb25zZTogRHVwbGljYXRlV29ya3NwYWNlUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UubWVzc2FnZSwgcmVzcG9uc2Uud29ya3NwYWNlKVxyXG4gICAgICAgIH0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZERpc3RyaWJ1dGVXb3Jrc3BhY2Uod3M6IFdvcmtzcGFjZSwga2xhc3NlOiBDbGFzc0RhdGEsIHN0dWRlbnRfaWRzOiBudW1iZXJbXSwgY2FsbGJhY2s6IChlcnJvcjogc3RyaW5nKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW4udXNlci5pc190ZXN0dXNlcikge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhcIkRpZXNlIEFrdGlvbiBpc3QgZsO8ciBkZW4gVGVzdHVzZXIgbmljaHQgbcO2Z2xpY2guXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5zZW5kVXBkYXRlcygoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVxdWVzdDogRGlzdHJpYnV0ZVdvcmtzcGFjZVJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc3BhY2VfaWQ6IHdzLmlkLFxyXG4gICAgICAgICAgICAgICAgY2xhc3NfaWQ6IGtsYXNzZT8uaWQsXHJcbiAgICAgICAgICAgICAgICBzdHVkZW50X2lkczogc3R1ZGVudF9pZHMsXHJcbiAgICAgICAgICAgICAgICBsYW5ndWFnZTogMFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhamF4KFwiZGlzdHJpYnV0ZVdvcmtzcGFjZVwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IERpc3RyaWJ1dGVXb3Jrc3BhY2VSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UubWVzc2FnZSlcclxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xyXG5cclxuICAgICAgICB9LCBmYWxzZSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbmRTZXRTZWNyZXQocmVwb3NpdG9yeUlkOiBudW1iZXIsIHJlYWQ6IGJvb2xlYW4sIHdyaXRlOiBib29sZWFuLCBjYWxsYmFjazogKHJlc3BvbnNlOiBTZXRSZXBvc2l0b3J5U2VjcmV0UmVzcG9uc2UpID0+IHZvaWQpe1xyXG4gICAgICAgIGxldCByZXF1ZXN0OiBTZXRSZXBvc2l0b3J5U2VjcmV0UmVxdWVzdCA9IHtyZXBvc2l0b3J5X2lkOiByZXBvc2l0b3J5SWQsIG5ld1NlY3JldFJlYWQ6IHJlYWQsIG5ld1NlY3JldFdyaXRlOiB3cml0ZX07XHJcblxyXG4gICAgICAgIGFqYXgoXCJzZXRSZXBvc2l0b3J5U2VjcmV0XCIsIHJlcXVlc3QsIChyZXNwb25zZTogU2V0UmVwb3NpdG9yeVNlY3JldFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlc3BvbnNlKVxyXG4gICAgICAgIH0sIChtZXNzYWdlKSA9PiB7YWxlcnQobWVzc2FnZSl9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZENyZWF0ZVJlcG9zaXRvcnkod3M6IFdvcmtzcGFjZSwgcHVibGlzaF90bzogbnVtYmVyLCByZXBvTmFtZTogc3RyaW5nLCByZXBvRGVzY3JpcHRpb246IHN0cmluZywgY2FsbGJhY2s6IChlcnJvcjogc3RyaW5nLCByZXBvc2l0b3J5X2lkPzogbnVtYmVyKSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW4udXNlci5pc190ZXN0dXNlcikge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhcIkRpZXNlIEFrdGlvbiBpc3QgZsO8ciBkZW4gVGVzdHVzZXIgbmljaHQgbcO2Z2xpY2guXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5zZW5kVXBkYXRlcygoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgcmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHdvcmtzcGFjZV9pZDogd3MuaWQsXHJcbiAgICAgICAgICAgICAgICBwdWJsaXNoX3RvOiBwdWJsaXNoX3RvLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogcmVwb05hbWUsXHJcbiAgICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogcmVwb0Rlc2NyaXB0aW9uXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGFqYXgoXCJjcmVhdGVSZXBvc2l0b3J5XCIsIHJlcXVlc3QsIChyZXNwb25zZTogeyBzdWNjZXNzOiBib29sZWFuLCBtZXNzYWdlPzogc3RyaW5nLCByZXBvc2l0b3J5X2lkPzogbnVtYmVyIH0pID0+IHtcclxuICAgICAgICAgICAgICAgIHdzLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpLmZvckVhY2gobSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5maWxlLmlzX2NvcHlfb2ZfaWQgPSBtLmZpbGUuaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgbS5maWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uID0gMTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB3cy5yZXBvc2l0b3J5X2lkID0gcmVzcG9uc2UucmVwb3NpdG9yeV9pZDtcclxuICAgICAgICAgICAgICAgIHdzLmhhc193cml0ZV9wZXJtaXNzaW9uX3RvX3JlcG9zaXRvcnkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2UubWVzc2FnZSwgcmVzcG9uc2UucmVwb3NpdG9yeV9pZClcclxuICAgICAgICAgICAgfSwgY2FsbGJhY2spO1xyXG5cclxuICAgICAgICB9LCB0cnVlKTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbmREZWxldGVXb3Jrc3BhY2VPckZpbGUodHlwZTogXCJ3b3Jrc3BhY2VcIiB8IFwiZmlsZVwiLCBpZDogbnVtYmVyLCBjYWxsYmFjazogKGVycm9yOiBzdHJpbmcpID0+IHZvaWQpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFpbi51c2VyLmlzX3Rlc3R1c2VyKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENyZWF0ZU9yRGVsZXRlRmlsZU9yV29ya3NwYWNlUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJkZWxldGVcIixcclxuICAgICAgICAgICAgZW50aXR5OiB0eXBlLFxyXG4gICAgICAgICAgICBpZDogaWQsXHJcbiAgICAgICAgICAgIHVzZXJJZDogdGhpcy5tYWluLnVzZXIuaWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoXCJjcmVhdGVPckRlbGV0ZUZpbGVPcldvcmtzcGFjZVwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBpZiAocmVzcG9uc2Uuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhcIk5ldHp3ZXJrZmVobGVyIVwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIGNhbGxiYWNrKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2VuZFVwZGF0ZVVzZXJTZXR0aW5ncyhjYWxsYmFjazogKGVycm9yOiBzdHJpbmcpID0+IHZvaWQsIHNlbmRCZWFjb246IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYWluLnVzZXIuaXNfdGVzdHVzZXIpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBVcGRhdGVVc2VyU2V0dGluZ3NSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBzZXR0aW5nczogdGhpcy5tYWluLnVzZXIuc2V0dGluZ3MsXHJcbiAgICAgICAgICAgIHVzZXJJZDogdGhpcy5tYWluLnVzZXIuaWRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZW5kQmVhY29uKSB7XHJcbiAgICAgICAgICAgIG5hdmlnYXRvci5zZW5kQmVhY29uKFwidXBkYXRlVXNlclNldHRpbmdzXCIsIEpTT04uc3RyaW5naWZ5KHJlcXVlc3QpKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhamF4KFwidXBkYXRlVXNlclNldHRpbmdzXCIsIHJlcXVlc3QsIChyZXNwb25zZTogVXBkYXRlVXNlclNldHRpbmdzUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5zdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sobnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKFwiTmV0endlcmtmZWhsZXIhXCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LCBjYWxsYmFjayk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlV29ya3NwYWNlcyhzZW5kVXBkYXRlc1JlcXVlc3Q6IFNlbmRVcGRhdGVzUmVxdWVzdCwgc2VuZFVwZGF0ZXNSZXNwb25zZTogU2VuZFVwZGF0ZXNSZXNwb25zZSkge1xyXG5cclxuICAgICAgICBsZXQgaWRUb1JlbW90ZVdvcmtzcGFjZURhdGFNYXA6IE1hcDxudW1iZXIsIFdvcmtzcGFjZURhdGE+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICBsZXQgZmlsZUlkc1NlbmRlZCA9IFtdO1xyXG4gICAgICAgIHNlbmRVcGRhdGVzUmVxdWVzdC5maWxlcy5mb3JFYWNoKGZpbGUgPT4gZmlsZUlkc1NlbmRlZC5wdXNoKGZpbGUuaWQpKTtcclxuXHJcbiAgICAgICAgc2VuZFVwZGF0ZXNSZXNwb25zZS53b3Jrc3BhY2VzLndvcmtzcGFjZXMuZm9yRWFjaCh3ZCA9PiBpZFRvUmVtb3RlV29ya3NwYWNlRGF0YU1hcC5zZXQod2QuaWQsIHdkKSk7XHJcblxyXG4gICAgICAgIGxldCBuZXdXb3Jrc3BhY2VOYW1lczogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcmVtb3RlV29ya3NwYWNlIG9mIHNlbmRVcGRhdGVzUmVzcG9uc2Uud29ya3NwYWNlcy53b3Jrc3BhY2VzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgbG9jYWxXb3Jrc3BhY2VzID0gdGhpcy5tYWluLndvcmtzcGFjZUxpc3QuZmlsdGVyKHdzID0+IHdzLmlkID09IHJlbW90ZVdvcmtzcGFjZS5pZCk7XHJcblxyXG4gICAgICAgICAgICAvLyBEaWQgc3R1ZGVudCBnZXQgYSB3b3Jrc3BhY2UgZnJvbSBoaXMvaGVyIHRlYWNoZXI/XHJcbiAgICAgICAgICAgIGlmIChsb2NhbFdvcmtzcGFjZXMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgICAgIG5ld1dvcmtzcGFjZU5hbWVzLnB1c2gocmVtb3RlV29ya3NwYWNlLm5hbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVOZXdXb3Jrc3BhY2VGcm9tV29ya3NwYWNlRGF0YShyZW1vdGVXb3Jrc3BhY2UpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICBmb3IgKGxldCB3b3Jrc3BhY2Ugb2YgdGhpcy5tYWluLndvcmtzcGFjZUxpc3QpIHtcclxuICAgICAgICAgICAgbGV0IHJlbW90ZVdvcmtzcGFjZTogV29ya3NwYWNlRGF0YSA9IGlkVG9SZW1vdGVXb3Jrc3BhY2VEYXRhTWFwLmdldCh3b3Jrc3BhY2UuaWQpO1xyXG4gICAgICAgICAgICBpZiAocmVtb3RlV29ya3NwYWNlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCBpZFRvUmVtb3RlRmlsZURhdGFNYXA6IE1hcDxudW1iZXIsIEZpbGVEYXRhPiA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgICAgIHJlbW90ZVdvcmtzcGFjZS5maWxlcy5mb3JFYWNoKGZkID0+IGlkVG9SZW1vdGVGaWxlRGF0YU1hcC5zZXQoZmQuaWQsIGZkKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGlkVG9Nb2R1bGVNYXA6IE1hcDxudW1iZXIsIE1vZHVsZT4gPSBuZXcgTWFwKCk7XHJcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUvZGVsZXRlIGZpbGVzIGlmIG5lY2Vzc2FyeVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIHdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWxlSWQgPSBtb2R1bGUuZmlsZS5pZDtcclxuICAgICAgICAgICAgICAgICAgICBpZFRvTW9kdWxlTWFwLnNldChmaWxlSWQsIG1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlbW90ZUZpbGVEYXRhID0gaWRUb1JlbW90ZUZpbGVEYXRhTWFwLmdldChmaWxlSWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZW1vdGVGaWxlRGF0YSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuZmlsZUxpc3RQYW5lbC5yZW1vdmVFbGVtZW50KG1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLnJlbW92ZU1vZHVsZShtb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZUlkc1NlbmRlZC5pbmRleE9mKGZpbGVJZCkgPCAwICYmIG1vZHVsZS5maWxlLnRleHQgIT0gcmVtb3RlRmlsZURhdGEudGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS50ZXh0ID0gcmVtb3RlRmlsZURhdGEudGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlLm1vZGVsLnNldFZhbHVlKHJlbW90ZUZpbGVEYXRhLnRleHQpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUuc2F2ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2R1bGUubGFzdFNhdmVkVmVyc2lvbklkID0gbW9kdWxlLm1vZGVsLmdldEFsdGVybmF0aXZlVmVyc2lvbklkKClcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUudmVyc2lvbiA9IHJlbW90ZUZpbGVEYXRhLnZlcnNpb247XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIC8vIGFkZCBmaWxlcyBpZiBuZWNlc3NhcnlcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHJlbW90ZUZpbGUgb2YgcmVtb3RlV29ya3NwYWNlLmZpbGVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlkVG9Nb2R1bGVNYXAuZ2V0KHJlbW90ZUZpbGUuaWQpID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jcmVhdGVGaWxlKHdvcmtzcGFjZSwgcmVtb3RlRmlsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobmV3V29ya3NwYWNlTmFtZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBsZXQgbWVzc2FnZTogc3RyaW5nID0gbmV3V29ya3NwYWNlTmFtZXMubGVuZ3RoID4gMSA/IFwiRm9sZ2VuZGUgV29ya3NwYWNlcyBoYXQgRGVpbmUgTGVocmtyYWZ0IERpciBnZXNlbmRldDogXCIgOiBcIkZvbGdlbmRlbiBXb3Jrc3BhY2UgaGF0IERlaW5lIExlaHJrcmFmdCBEaXIgZ2VzZW5kZXQ6IFwiO1xyXG4gICAgICAgICAgICBtZXNzYWdlICs9IG5ld1dvcmtzcGFjZU5hbWVzLmpvaW4oXCIsIFwiKTtcclxuICAgICAgICAgICAgYWxlcnQobWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLndvcmtzcGFjZUxpc3RQYW5lbC5zb3J0RWxlbWVudHMoKTtcclxuICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmZpbGVMaXN0UGFuZWwuc29ydEVsZW1lbnRzKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgdXBkYXRlRmlsZXMoZmlsZXNGcm9tU2VydmVyOiBGaWxlRGF0YVtdKSB7XHJcbiAgICAgICAgbGV0IGZpbGVJZFRvTG9jYWxNb2R1bGVNYXA6IE1hcDxudW1iZXIsIE1vZHVsZT4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHdvcmtzcGFjZSBvZiB0aGlzLm1haW4ud29ya3NwYWNlTGlzdCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtb2R1bGUgb2Ygd29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlSWRUb0xvY2FsTW9kdWxlTWFwW21vZHVsZS5maWxlLmlkXSA9IG1vZHVsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgcmVtb3RlRmlsZSBvZiBmaWxlc0Zyb21TZXJ2ZXIpIHtcclxuICAgICAgICAgICAgbGV0IG1vZHVsZSA9IGZpbGVJZFRvTG9jYWxNb2R1bGVNYXBbcmVtb3RlRmlsZS5pZF07XHJcbiAgICAgICAgICAgIGlmIChtb2R1bGUgIT0gbnVsbCAmJiBtb2R1bGUuZmlsZS50ZXh0ICE9IHJlbW90ZUZpbGUudGV4dCkge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUudGV4dCA9IHJlbW90ZUZpbGUudGV4dDtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5tb2RlbC5zZXRWYWx1ZShyZW1vdGVGaWxlLnRleHQpO1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUuc2F2ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmxhc3RTYXZlZFZlcnNpb25JZCA9IG1vZHVsZS5tb2RlbC5nZXRBbHRlcm5hdGl2ZVZlcnNpb25JZCgpXHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS52ZXJzaW9uID0gcmVtb3RlRmlsZS52ZXJzaW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjcmVhdGVOZXdXb3Jrc3BhY2VGcm9tV29ya3NwYWNlRGF0YShyZW1vdGVXb3Jrc3BhY2U6IFdvcmtzcGFjZURhdGEsIHdpdGhTb3J0OiBib29sZWFuID0gZmFsc2UpOiBXb3Jrc3BhY2Uge1xyXG4gICAgICAgIGxldCB3ID0gdGhpcy5tYWluLmNyZWF0ZU5ld1dvcmtzcGFjZShyZW1vdGVXb3Jrc3BhY2UubmFtZSwgcmVtb3RlV29ya3NwYWNlLm93bmVyX2lkKTtcclxuICAgICAgICB3LmlkID0gcmVtb3RlV29ya3NwYWNlLmlkO1xyXG4gICAgICAgIHcucmVwb3NpdG9yeV9pZCA9IHJlbW90ZVdvcmtzcGFjZS5yZXBvc2l0b3J5X2lkO1xyXG4gICAgICAgIHcuaGFzX3dyaXRlX3Blcm1pc3Npb25fdG9fcmVwb3NpdG9yeSA9IHJlbW90ZVdvcmtzcGFjZS5oYXNfd3JpdGVfcGVybWlzc2lvbl90b19yZXBvc2l0b3J5O1xyXG4gICAgICAgIHcucGF0aCA9IHJlbW90ZVdvcmtzcGFjZS5wYXRoO1xyXG4gICAgICAgIHcuaXNGb2xkZXIgPSByZW1vdGVXb3Jrc3BhY2UuaXNGb2xkZXI7XHJcbiAgICAgICAgdy5tb2R1bGVTdG9yZS5kaXJ0eSA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmKHJlbW90ZVdvcmtzcGFjZS5zZXR0aW5ncyAhPSBudWxsICYmIHJlbW90ZVdvcmtzcGFjZS5zZXR0aW5ncy5zdGFydHNXaXRoKFwie1wiKSl7XHJcbiAgICAgICAgICAgIGxldCByZW1vdGVXb3Jrc3BhY2VTZXR0aW5nczpXb3Jrc3BhY2VTZXR0aW5ncyA9IEpTT04ucGFyc2UocmVtb3RlV29ya3NwYWNlLnNldHRpbmdzKTtcclxuICAgICAgICAgICAgdy5zZXR0aW5ncyA9IHJlbW90ZVdvcmtzcGFjZVNldHRpbmdzO1xyXG4gICAgICAgICAgICB3Lm1vZHVsZVN0b3JlLnNldEFkZGl0aW9uYWxMaWJyYXJpZXMocmVtb3RlV29ya3NwYWNlU2V0dGluZ3MubGlicmFyaWVzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi53b3Jrc3BhY2VMaXN0LnB1c2godyk7XHJcbiAgICAgICAgbGV0IHBhdGggPSByZW1vdGVXb3Jrc3BhY2UucGF0aC5zcGxpdChcIi9cIik7XHJcbiAgICAgICAgaWYgKHBhdGgubGVuZ3RoID09IDEgJiYgcGF0aFswXSA9PSBcIlwiKSBwYXRoID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHBhbmVsRWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgbmFtZTogcmVtb3RlV29ya3NwYWNlLm5hbWUsXHJcbiAgICAgICAgICAgIGV4dGVybmFsRWxlbWVudDogdyxcclxuICAgICAgICAgICAgaWNvbkNsYXNzOiByZW1vdGVXb3Jrc3BhY2UucmVwb3NpdG9yeV9pZCA9PSBudWxsID8gXCJ3b3Jrc3BhY2VcIiA6IFwicmVwb3NpdG9yeVwiLFxyXG4gICAgICAgICAgICBpc0ZvbGRlcjogcmVtb3RlV29ya3NwYWNlLmlzRm9sZGVyLFxyXG4gICAgICAgICAgICBwYXRoOiBwYXRoXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuYWRkRWxlbWVudChwYW5lbEVsZW1lbnQsIHRydWUpO1xyXG4gICAgICAgIHcucGFuZWxFbGVtZW50ID0gcGFuZWxFbGVtZW50O1xyXG5cclxuICAgICAgICBpZih3LnJlcG9zaXRvcnlfaWQgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHcucmVuZGVyU3luY2hyb25pemVCdXR0b24ocGFuZWxFbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGZpbGVEYXRhIG9mIHJlbW90ZVdvcmtzcGFjZS5maWxlcykge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZUZpbGUodywgZmlsZURhdGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHdpdGhTb3J0KSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIud29ya3NwYWNlTGlzdFBhbmVsLnNvcnRFbGVtZW50cygpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmZpbGVMaXN0UGFuZWwuc29ydEVsZW1lbnRzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB3O1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlRmlsZSh3b3Jrc3BhY2U6IFdvcmtzcGFjZSwgcmVtb3RlRmlsZTogRmlsZURhdGEpIHtcclxuICAgICAgICBsZXQgYWU6IGFueSA9IG51bGw7IC8vQWNjb3JkaW9uRWxlbWVudFxyXG4gICAgICAgIGlmICh3b3Jrc3BhY2UgPT0gdGhpcy5tYWluLmN1cnJlbnRXb3Jrc3BhY2UpIHtcclxuICAgICAgICAgICAgYWUgPSB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiByZW1vdGVGaWxlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBleHRlcm5hbEVsZW1lbnQ6IG51bGxcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5maWxlTGlzdFBhbmVsLmFkZEVsZW1lbnQoYWUsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGY6IGFueSA9IHsgLy8gRmlsZVxyXG4gICAgICAgICAgICBpZDogcmVtb3RlRmlsZS5pZCxcclxuICAgICAgICAgICAgbmFtZTogcmVtb3RlRmlsZS5uYW1lLFxyXG4gICAgICAgICAgICBkaXJ0eTogdHJ1ZSxcclxuICAgICAgICAgICAgc2F2ZWQ6IHRydWUsXHJcbiAgICAgICAgICAgIHRleHQ6IHJlbW90ZUZpbGUudGV4dCxcclxuICAgICAgICAgICAgdmVyc2lvbjogcmVtb3RlRmlsZS52ZXJzaW9uLFxyXG4gICAgICAgICAgICBpc19jb3B5X29mX2lkOiByZW1vdGVGaWxlLmlzX2NvcHlfb2ZfaWQsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiByZW1vdGVGaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uLFxyXG4gICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiB0cnVlLFxyXG4gICAgICAgICAgICB3b3Jrc3BhY2VfaWQ6IHdvcmtzcGFjZS5pZCxcclxuICAgICAgICAgICAgcGFuZWxFbGVtZW50OiBhZVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgbGV0IG0gPSB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLmdldE5ld01vZHVsZShmKTsgLy9uZXcgTW9kdWxlKGYsIHRoaXMubWFpbik7XHJcbiAgICAgICAgaWYgKGFlICE9IG51bGwpIGFlLmV4dGVybmFsRWxlbWVudCA9IG07XHJcbiAgICAgICAgbGV0IG1vZHVsU3RvcmUgPSB3b3Jrc3BhY2UubW9kdWxlU3RvcmU7XHJcbiAgICAgICAgbW9kdWxTdG9yZS5wdXRNb2R1bGUobSk7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19