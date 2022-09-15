import { ajax } from "../communication/AjaxHelper.js";
import { Module } from "../compiler/parser/Module.js";
export class SynchroWorkspace {
    constructor(manager) {
        this.manager = manager;
        this.files = [];
        this.isCurrentRepositoryVersion = false;
    }
    hasChanges() {
        for (let file of this.files) {
            if (file.state != "original")
                return true;
        }
        return false;
    }
    isWritable() {
        return this.copiedFromWorkspace != null || this.isCurrentRepositoryVersion;
    }
    copyFromWorkspace(workspace) {
        this.files = [];
        workspace.moduleStore.getModules(false).forEach(module => {
            let file = module.file;
            if (module.model != null) {
                module.file.text = module.getProgramTextFromMonacoModel();
            }
            this.files.push({
                name: file.name,
                repository_file_version: file.repository_file_version,
                idInsideRepository: file.is_copy_of_id,
                idInsideWorkspace: file.id,
                workspaceFile: file,
                text: file.text.replace(/\r\n/g, "\n"),
                synchroWorkspace: this,
                state: "original",
                markedAsMerged: false,
                originalText: file.text,
                monacoModel: null
            });
        });
        this.name = "Workspace: " + workspace.name;
        this.copiedFromWorkspace = workspace;
        return this;
    }
    copyFromRepository(repository, isCurrentRepositoryVersion) {
        this.isCurrentRepositoryVersion = isCurrentRepositoryVersion;
        this.files = [];
        repository.fileEntries.forEach((fileEntry) => {
            this.files.push({
                name: fileEntry.filename,
                idInsideRepository: fileEntry.id,
                idInsideWorkspace: null,
                workspaceFile: null,
                repository_file_version: fileEntry.version,
                text: fileEntry.text.replace(/\r\n/g, "\n"),
                synchroWorkspace: this,
                state: "original",
                markedAsMerged: false,
                monacoModel: null
            });
        });
        this.name = "Repository: " + repository.name + " (V " + repository.version + ")";
        return this;
    }
    copyFromHistoryElement(historyElement) {
        let repo = historyElement.getRepositoryState();
        this.copyFromRepository(repo, false);
        this.name = "History-Version " + repo.version;
        return this;
    }
    commit(workspace, oldRepository, comment, main, callback) {
        let oldIdToFileMap = {};
        let newIdToFileMap = {};
        let newlyVersionedFileIds = [];
        oldRepository.fileEntries.forEach(file => oldIdToFileMap[file.id] = file);
        this.files.forEach(file => {
            if (file.idInsideRepository != null) {
                newIdToFileMap[file.idInsideRepository] = file;
            }
        });
        let repositoryHistoryEntry = {
            comment: comment,
            name: main.user.rufname + " " + main.user.familienname,
            username: main.user.username,
            isIntermediateEntry: false,
            timestamp: new Date().toUTCString(),
            userId: main.user.id,
            version: oldRepository.version + 1,
            historyFiles: []
        };
        for (let file of this.files) {
            let oldFile = oldIdToFileMap[file.idInsideRepository];
            if (oldFile == null) {
                if (file.idInsideRepository == null && file.committedFromFile != null) {
                    newlyVersionedFileIds.push(file.committedFromFile.idInsideWorkspace);
                    file.committedFromFile.idInsideRepository = file.idInsideWorkspace;
                    file.committedFromFile.repository_file_version = 1;
                }
                repositoryHistoryEntry.historyFiles.push({
                    id: file.idInsideRepository,
                    type: "create",
                    version: 1,
                    content: file.text,
                    filename: file.name
                });
            }
            else if (oldFile.text != file.text) {
                oldFile.version++;
                let patch = this.getPatch(oldFile.text, file.text);
                if (patch == null) {
                    repositoryHistoryEntry.historyFiles.push({
                        id: oldFile.id,
                        type: "intermediate",
                        version: oldFile.version,
                        content: file.text,
                        filename: file.name
                    });
                }
                else {
                    repositoryHistoryEntry.historyFiles.push({
                        id: oldFile.id,
                        type: "change",
                        version: oldFile.version,
                        content: patch,
                        filename: (oldFile.filename == file.name) ? undefined : file.name
                    });
                }
                let cff = file.committedFromFile;
                if (cff != null) {
                    cff.repository_file_version = oldFile.version;
                    cff.workspaceFile.repository_file_version = oldFile.version;
                    cff.workspaceFile.saved = false;
                }
            }
            else if (oldFile.filename != file.name) {
                repositoryHistoryEntry.historyFiles.push({
                    id: oldFile.id,
                    type: "intermediate",
                    version: oldFile.version,
                    filename: file.name
                });
            }
        }
        for (let oldFile of oldRepository.fileEntries) {
            if (newIdToFileMap[oldFile.id] == null) {
                repositoryHistoryEntry.historyFiles.push({
                    id: oldFile.id,
                    type: "delete",
                    version: oldFile.version
                });
            }
        }
        let newFileEntries = this.files.map((synchroFile) => {
            return {
                filename: synchroFile.name,
                id: synchroFile.idInsideRepository,
                text: synchroFile.text,
                version: synchroFile.repository_file_version
            };
        });
        let commitFilesRequest = {
            files: newFileEntries,
            repositoryVersionBeforeCommit: oldRepository.version,
            repository_id: oldRepository.id,
            workspace_id: workspace.id,
            repositoryHistoryEntry: repositoryHistoryEntry,
            newlyVersionedFileIds: newlyVersionedFileIds
        };
        let that = this;
        ajax("commitFiles", commitFilesRequest, (cfr) => {
            workspace.moduleStore.getModules(false).map(m => m.file).forEach((file) => {
                if (newlyVersionedFileIds.indexOf(file.id) >= 0) {
                    file.is_copy_of_id = file.id;
                    file.repository_file_version = 1;
                }
            });
            that.manager.main.networkManager.sendUpdates(() => {
                callback(cfr.repository, null);
            }, true);
        }, (error) => { callback(null, error); });
    }
    getPatch(contentOld, contentNew) {
        //@ts-ignore
        let dmp = new diff_match_patch();
        //@ts-ignore
        let patchObject = dmp.patch_make(contentOld, contentNew);
        let patch = JSON.stringify(patchObject);
        // Test patch and only return it if it is valid!
        let deSerializedPatchObject = JSON.parse(patch);
        let result = dmp.patch_apply(deSerializedPatchObject, contentOld);
        if (result == null || result[0] == null)
            return null;
        if (result[0] == contentNew) {
            return patch;
        }
        else {
            return null;
        }
    }
    writeChangesToWorkspace() {
        let workspace = this.copiedFromWorkspace;
        let oldIdToModuleMap = {};
        let newIdToFileMap = {};
        workspace.moduleStore.getModules(false).forEach(m => {
            if (m.file.is_copy_of_id != null)
                oldIdToModuleMap[m.file.is_copy_of_id] = m;
        });
        this.files.forEach(file => {
            if (file.idInsideWorkspace != null)
                newIdToFileMap[file.idInsideWorkspace] = file;
        });
        let main = this.manager.main;
        for (let module of workspace.moduleStore.getModules(false)) {
            let synchroFile = newIdToFileMap[module.file.id];
            if (synchroFile != null) {
                module.file.text = synchroFile.monacoModel.getValue(monaco.editor.EndOfLinePreference.LF, false);
                synchroFile.text = module.file.text;
                module.file.is_copy_of_id = synchroFile.idInsideRepository;
                module.file.repository_file_version = synchroFile.repository_file_version;
                module.file.saved = false;
                module.model.setValue(synchroFile.text);
            }
            else {
                main.networkManager.sendDeleteWorkspaceOrFile("file", module.file.id, (error) => {
                    if (error == null) {
                        workspace.moduleStore.removeModule(module);
                        if (main.currentWorkspace == workspace && main.projectExplorer.getCurrentlyEditedModule() == module) {
                            main.projectExplorer.setModuleActive(null);
                        }
                    }
                    else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });
            }
        }
        for (let synchroFile of this.files) {
            if (oldIdToModuleMap[synchroFile.idInsideRepository] == null) {
                let f = {
                    name: synchroFile.name,
                    dirty: false,
                    saved: true,
                    text: synchroFile.text,
                    version: 1,
                    is_copy_of_id: synchroFile.idInsideRepository,
                    repository_file_version: synchroFile.repository_file_version
                };
                let m = new Module(f, main);
                workspace.moduleStore.putModule(m);
                main.networkManager.sendCreateFile(m, workspace, main.user.id, (error) => {
                    if (error == null) {
                    }
                    else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });
            }
        }
        main.networkManager.sendUpdates(null, true);
        if (main.currentWorkspace == workspace) {
            let cem = main.getCurrentlyEditedModule();
            main.projectExplorer.setWorkspaceActive(workspace);
            // if module hadn't been deleted while synchronizing:
            if (workspace.moduleStore.getModules(false).indexOf(cem) >= 0) {
                main.projectExplorer.setModuleActive(cem);
                main.projectExplorer.fileListPanel.select(cem, false);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY2hyb1dvcmtzcGFjZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvcmVwb3NpdG9yeS9TeW5jaHJvV29ya3NwYWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN0RCxPQUFPLEVBQVEsTUFBTSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUEwQjVELE1BQU0sT0FBTyxnQkFBZ0I7SUFRekIsWUFBb0IsT0FBK0I7UUFBL0IsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7UUFObkQsVUFBSyxHQUFrQixFQUFFLENBQUM7UUFFMUIsK0JBQTBCLEdBQVksS0FBSyxDQUFDO0lBTTVDLENBQUM7SUFFRCxVQUFVO1FBQ04sS0FBSSxJQUFJLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFDO1lBQ3ZCLElBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxVQUFVO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1NBQzVDO1FBQ0QsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUdELFVBQVU7UUFDTixPQUFPLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLDBCQUEwQixDQUFDO0lBQy9FLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxTQUFvQjtRQUVsQyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUNoQixTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDckQsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQztZQUV2QixJQUFJLE1BQU0sQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO2dCQUN0QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsNkJBQTZCLEVBQUUsQ0FBQzthQUM3RDtZQUVELElBQUksQ0FB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QUksQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxTQUFTLEVBQUU7WUFDcEMsSUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7WUFDMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUVuRCxxREFBcUQ7WUFDckQsSUFBRyxTQUFTLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFDO2dCQUN6RCxJQUFJLENBQUMsZUFBZSxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDMUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN6RDtTQUVKO0lBRUwsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUmVwb3NpdG9yeSB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9tYWluL01haW4uanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgSGlzdG9yeUVsZW1lbnQgfSBmcm9tIFwiLi9IaXN0b3J5RWxlbWVudC5qc1wiO1xyXG5pbXBvcnQgeyBSZXBvc2l0b3J5SGlzdG9yeUVudHJ5LCBSZXBvc2l0b3J5RmlsZUVudHJ5LCBDb21taXRGaWxlc1Jlc3BvbnNlLCBDb21taXRGaWxlc1JlcXVlc3QgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IGFqYXggfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IEZpbGUsIE1vZHVsZSB9IGZyb20gXCIuLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IHdvcmtlciB9IGZyb20gXCIuLi8uLi8uLi9ub2RlX21vZHVsZXMvbW9uYWNvLWVkaXRvci9lc20vdnMvZWRpdG9yL2VkaXRvci5hcGkuanNcIjtcclxuaW1wb3J0IHsgU3luY2hyb25pemF0aW9uTWFuYWdlciB9IGZyb20gXCIuL1N5bmNocm9uaXphdGlvbk1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgVGVhY2hlcnNXaXRoQ2xhc3Nlc01JIH0gZnJvbSBcIi4uL2FkbWluaXN0cmF0aW9uL1RlYWNoZXJzV2l0aENsYXNzZXMuanNcIjtcclxuXHJcblxyXG5leHBvcnQgdHlwZSBTeW5jaHJvRmlsZVN0YXRlID0gXCJvcmlnaW5hbFwiIHwgXCJjaGFuZ2VkXCIgfCBcIm5ld1wiIHwgXCJkZWxldGVkXCI7XHJcblxyXG5leHBvcnQgdHlwZSBTeW5jaHJvRmlsZSA9IHtcclxuICAgIGlkSW5zaWRlUmVwb3NpdG9yeTogbnVtYmVyLFxyXG4gICAgaWRJbnNpZGVXb3Jrc3BhY2U/OiBudW1iZXIsXHJcbiAgICB3b3Jrc3BhY2VGaWxlOiBGaWxlLFxyXG4gICAgY29tbWl0dGVkRnJvbUZpbGU/OiBTeW5jaHJvRmlsZSxcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiBudW1iZXIsXHJcbiAgICB0ZXh0OiBzdHJpbmcsXHJcbiAgICBzeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlLFxyXG4gICAgXHJcbiAgICBzdGF0ZTogU3luY2hyb0ZpbGVTdGF0ZSxcclxuICAgIG1hcmtlZEFzTWVyZ2VkOiBib29sZWFuLFxyXG5cclxuICAgIG9yaWdpbmFsVGV4dD86IHN0cmluZyxcclxuICAgIG1vbmFjb01vZGVsPzogbW9uYWNvLmVkaXRvci5JVGV4dE1vZGVsLFxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFN5bmNocm9Xb3Jrc3BhY2Uge1xyXG5cclxuICAgIGZpbGVzOiBTeW5jaHJvRmlsZVtdID0gW107XHJcbiAgICBjb3BpZWRGcm9tV29ya3NwYWNlOiBXb3Jrc3BhY2U7XHJcbiAgICBpc0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbjogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIG5hbWU6IHN0cmluZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1hbmFnZXI6IFN5bmNocm9uaXphdGlvbk1hbmFnZXIpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaGFzQ2hhbmdlcygpOiBib29sZWFuIHtcclxuICAgICAgICBmb3IobGV0IGZpbGUgb2YgdGhpcy5maWxlcyl7XHJcbiAgICAgICAgICAgIGlmKGZpbGUuc3RhdGUgIT0gXCJvcmlnaW5hbFwiKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBpc1dyaXRhYmxlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvcGllZEZyb21Xb3Jrc3BhY2UgIT0gbnVsbCB8fCB0aGlzLmlzQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGNvcHlGcm9tV29ya3NwYWNlKHdvcmtzcGFjZTogV29ya3NwYWNlKTpTeW5jaHJvV29ya3NwYWNlIHtcclxuXHJcbiAgICAgICAgdGhpcy5maWxlcyA9IFtdO1xyXG4gICAgICAgIHdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKS5mb3JFYWNoKG1vZHVsZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWxlID0gbW9kdWxlLmZpbGU7XHJcblxyXG4gICAgICAgICAgICBpZiAobW9kdWxlLm1vZGVsICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5maWxlLnRleHQgPSBtb2R1bGUuZ2V0UHJvZ3JhbVRleHRGcm9tTW9uYWNvTW9kZWwoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5maWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGZpbGUubmFtZSxcclxuICAgICAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiBmaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgaWRJbnNpZGVSZXBvc2l0b3J5OiBmaWxlLmlzX2NvcHlfb2ZfaWQsXHJcbiAgICAgICAgICAgICAgICBpZEluc2lkZVdvcmtzcGFjZTogZmlsZS5pZCxcclxuICAgICAgICAgICAgICAgIHdvcmtzcGFjZUZpbGU6IGZpbGUsXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlLnRleHQucmVwbGFjZSgvXFxyXFxuL2csIFwiXFxuXCIpLFxyXG4gICAgICAgICAgICAgICAgc3luY2hyb1dvcmtzcGFjZTogdGhpcyxcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc3RhdGU6IFwib3JpZ2luYWxcIixcclxuICAgICAgICAgICAgICAgIG1hcmtlZEFzTWVyZ2VkOiBmYWxzZSxcclxuXHJcbiAgICAgICAgICAgICAgICBvcmlnaW5hbFRleHQ6IGZpbGUudGV4dCxcclxuICAgICAgICAgICAgICAgIG1vbmFjb01vZGVsOiBudWxsXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMubmFtZSA9IFwiV29ya3NwYWNlOiBcIiArIHdvcmtzcGFjZS5uYW1lO1xyXG4gICAgICAgIHRoaXMuY29waWVkRnJvbVdvcmtzcGFjZSA9IHdvcmtzcGFjZTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY29weUZyb21SZXBvc2l0b3J5KHJlcG9zaXRvcnk6IFJlcG9zaXRvcnksIGlzQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uOiBib29sZWFuKTogU3luY2hyb1dvcmtzcGFjZSB7XHJcbiAgICAgICAgdGhpcy5pc0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbiA9IGlzQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uO1xyXG4gICAgICAgIHRoaXMuZmlsZXMgPSBbXTtcclxuICAgICAgICByZXBvc2l0b3J5LmZpbGVFbnRyaWVzLmZvckVhY2goKGZpbGVFbnRyeSkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogZmlsZUVudHJ5LmZpbGVuYW1lLFxyXG4gICAgICAgICAgICAgICAgaWRJbnNpZGVSZXBvc2l0b3J5OiBmaWxlRW50cnkuaWQsXHJcbiAgICAgICAgICAgICAgICBpZEluc2lkZVdvcmtzcGFjZTogbnVsbCxcclxuICAgICAgICAgICAgICAgIHdvcmtzcGFjZUZpbGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICByZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbjogZmlsZUVudHJ5LnZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlRW50cnkudGV4dC5yZXBsYWNlKC9cXHJcXG4vZywgXCJcXG5cIiksXHJcbiAgICAgICAgICAgICAgICBzeW5jaHJvV29ya3NwYWNlOiB0aGlzLFxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBzdGF0ZTogXCJvcmlnaW5hbFwiLFxyXG4gICAgICAgICAgICAgICAgbWFya2VkQXNNZXJnZWQ6IGZhbHNlLFxyXG5cclxuICAgICAgICAgICAgICAgIG1vbmFjb01vZGVsOiBudWxsXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJSZXBvc2l0b3J5OiBcIiArIHJlcG9zaXRvcnkubmFtZSArIFwiIChWIFwiICsgcmVwb3NpdG9yeS52ZXJzaW9uICsgXCIpXCI7XHJcblxyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGNvcHlGcm9tSGlzdG9yeUVsZW1lbnQoaGlzdG9yeUVsZW1lbnQ6IEhpc3RvcnlFbGVtZW50KTogU3luY2hyb1dvcmtzcGFjZSB7XHJcbiAgICAgICAgbGV0IHJlcG8gPSBoaXN0b3J5RWxlbWVudC5nZXRSZXBvc2l0b3J5U3RhdGUoKTtcclxuICAgICAgICB0aGlzLmNvcHlGcm9tUmVwb3NpdG9yeShyZXBvLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gXCJIaXN0b3J5LVZlcnNpb24gXCIgKyByZXBvLnZlcnNpb247XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgY29tbWl0KHdvcmtzcGFjZTogV29ya3NwYWNlLCBvbGRSZXBvc2l0b3J5OiBSZXBvc2l0b3J5LCBjb21tZW50OiBzdHJpbmcsIG1haW46IE1haW4sXHJcbiAgICAgICAgY2FsbGJhY2s6IChyZXBvc2l0b3J5OiBSZXBvc2l0b3J5LCBlcnJvcm1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCkge1xyXG5cclxuICAgICAgICBsZXQgb2xkSWRUb0ZpbGVNYXA6IHsgW2lkOiBudW1iZXJdOiBSZXBvc2l0b3J5RmlsZUVudHJ5IH0gPSB7fTtcclxuICAgICAgICBsZXQgbmV3SWRUb0ZpbGVNYXA6IHsgW2lkOiBudW1iZXJdOiBTeW5jaHJvRmlsZSB9ID0ge307XHJcblxyXG4gICAgICAgIGxldCBuZXdseVZlcnNpb25lZEZpbGVJZHM6IG51bWJlcltdID0gW107XHJcblxyXG4gICAgICAgIG9sZFJlcG9zaXRvcnkuZmlsZUVudHJpZXMuZm9yRWFjaChmaWxlID0+IG9sZElkVG9GaWxlTWFwW2ZpbGUuaWRdID0gZmlsZSk7XHJcbiAgICAgICAgdGhpcy5maWxlcy5mb3JFYWNoKGZpbGUgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZmlsZS5pZEluc2lkZVJlcG9zaXRvcnkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbmV3SWRUb0ZpbGVNYXBbZmlsZS5pZEluc2lkZVJlcG9zaXRvcnldID0gZmlsZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgcmVwb3NpdG9yeUhpc3RvcnlFbnRyeTogUmVwb3NpdG9yeUhpc3RvcnlFbnRyeSA9IHtcclxuICAgICAgICAgICAgY29tbWVudDogY29tbWVudCxcclxuICAgICAgICAgICAgbmFtZTogbWFpbi51c2VyLnJ1Zm5hbWUgKyBcIiBcIiArIG1haW4udXNlci5mYW1pbGllbm5hbWUsXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiBtYWluLnVzZXIudXNlcm5hbWUsXHJcbiAgICAgICAgICAgIGlzSW50ZXJtZWRpYXRlRW50cnk6IGZhbHNlLFxyXG4gICAgICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCkudG9VVENTdHJpbmcoKSxcclxuICAgICAgICAgICAgdXNlcklkOiBtYWluLnVzZXIuaWQsXHJcbiAgICAgICAgICAgIHZlcnNpb246IG9sZFJlcG9zaXRvcnkudmVyc2lvbiArIDEsXHJcbiAgICAgICAgICAgIGhpc3RvcnlGaWxlczogW11cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGZpbGUgb2YgdGhpcy5maWxlcykge1xyXG4gICAgICAgICAgICBsZXQgb2xkRmlsZSA9IG9sZElkVG9GaWxlTWFwW2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5XTtcclxuICAgICAgICAgICAgaWYgKG9sZEZpbGUgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChmaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSA9PSBudWxsICYmIGZpbGUuY29tbWl0dGVkRnJvbUZpbGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld2x5VmVyc2lvbmVkRmlsZUlkcy5wdXNoKGZpbGUuY29tbWl0dGVkRnJvbUZpbGUuaWRJbnNpZGVXb3Jrc3BhY2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUuY29tbWl0dGVkRnJvbUZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5ID0gZmlsZS5pZEluc2lkZVdvcmtzcGFjZTtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlLmNvbW1pdHRlZEZyb21GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uID0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXBvc2l0b3J5SGlzdG9yeUVudHJ5Lmhpc3RvcnlGaWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZS5pZEluc2lkZVJlcG9zaXRvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJjcmVhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IGZpbGUudGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZS5uYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChvbGRGaWxlLnRleHQgIT0gZmlsZS50ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICBvbGRGaWxlLnZlcnNpb24rKztcclxuICAgICAgICAgICAgICAgIGxldCBwYXRjaDogc3RyaW5nID0gdGhpcy5nZXRQYXRjaChvbGRGaWxlLnRleHQsIGZpbGUudGV4dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocGF0Y2ggPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlcG9zaXRvcnlIaXN0b3J5RW50cnkuaGlzdG9yeUZpbGVzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogb2xkRmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJpbnRlcm1lZGlhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogb2xkRmlsZS52ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50OiBmaWxlLnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBmaWxlLm5hbWVcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVwb3NpdG9yeUhpc3RvcnlFbnRyeS5oaXN0b3J5RmlsZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBvbGRGaWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImNoYW5nZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiBvbGRGaWxlLnZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IHBhdGNoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogKG9sZEZpbGUuZmlsZW5hbWUgPT0gZmlsZS5uYW1lKSA/IHVuZGVmaW5lZCA6IGZpbGUubmFtZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjZmYgPSBmaWxlLmNvbW1pdHRlZEZyb21GaWxlO1xyXG4gICAgICAgICAgICAgICAgaWYoY2ZmICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNmZi5yZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbiA9IG9sZEZpbGUudmVyc2lvbjtcclxuICAgICAgICAgICAgICAgICAgICBjZmYud29ya3NwYWNlRmlsZS5yZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbiA9IG9sZEZpbGUudmVyc2lvbjtcclxuICAgICAgICAgICAgICAgICAgICBjZmYud29ya3NwYWNlRmlsZS5zYXZlZCA9IGZhbHNlOyAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG9sZEZpbGUuZmlsZW5hbWUgIT0gZmlsZS5uYW1lKSB7XHJcbiAgICAgICAgICAgICAgICByZXBvc2l0b3J5SGlzdG9yeUVudHJ5Lmhpc3RvcnlGaWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogb2xkRmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImludGVybWVkaWF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IG9sZEZpbGUudmVyc2lvbixcclxuICAgICAgICAgICAgICAgICAgICBmaWxlbmFtZTogZmlsZS5uYW1lXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgb2xkRmlsZSBvZiBvbGRSZXBvc2l0b3J5LmZpbGVFbnRyaWVzKSB7XHJcbiAgICAgICAgICAgIGlmIChuZXdJZFRvRmlsZU1hcFtvbGRGaWxlLmlkXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICByZXBvc2l0b3J5SGlzdG9yeUVudHJ5Lmhpc3RvcnlGaWxlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogb2xkRmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImRlbGV0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IG9sZEZpbGUudmVyc2lvblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgbmV3RmlsZUVudHJpZXM6IFJlcG9zaXRvcnlGaWxlRW50cnlbXSA9IHRoaXMuZmlsZXMubWFwKChzeW5jaHJvRmlsZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IHN5bmNocm9GaWxlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICBpZDogc3luY2hyb0ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5LFxyXG4gICAgICAgICAgICAgICAgdGV4dDogc3luY2hyb0ZpbGUudGV4dCxcclxuICAgICAgICAgICAgICAgIHZlcnNpb246IHN5bmNocm9GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG5cclxuXHJcbiAgICAgICAgbGV0IGNvbW1pdEZpbGVzUmVxdWVzdDogQ29tbWl0RmlsZXNSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICBmaWxlczogbmV3RmlsZUVudHJpZXMsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlWZXJzaW9uQmVmb3JlQ29tbWl0OiBvbGRSZXBvc2l0b3J5LnZlcnNpb24sXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfaWQ6IG9sZFJlcG9zaXRvcnkuaWQsXHJcbiAgICAgICAgICAgIHdvcmtzcGFjZV9pZDogd29ya3NwYWNlLmlkLFxyXG4gICAgICAgICAgICByZXBvc2l0b3J5SGlzdG9yeUVudHJ5OiByZXBvc2l0b3J5SGlzdG9yeUVudHJ5LFxyXG4gICAgICAgICAgICBuZXdseVZlcnNpb25lZEZpbGVJZHM6IG5ld2x5VmVyc2lvbmVkRmlsZUlkc1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGFqYXgoXCJjb21taXRGaWxlc1wiLCBjb21taXRGaWxlc1JlcXVlc3QsIChjZnI6IENvbW1pdEZpbGVzUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgd29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpLm1hcChtID0+IG0uZmlsZSkuZm9yRWFjaCgoZmlsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5ld2x5VmVyc2lvbmVkRmlsZUlkcy5pbmRleE9mKGZpbGUuaWQpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWxlLmlzX2NvcHlfb2ZfaWQgPSBmaWxlLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIGZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24gPSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdGhhdC5tYW5hZ2VyLm1haW4ubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2soY2ZyLnJlcG9zaXRvcnksIG51bGwpO1xyXG4gICAgICAgICAgICB9LCB0cnVlKTtcclxuICAgICAgICB9LCAoZXJyb3I6IHN0cmluZykgPT4geyBjYWxsYmFjayggbnVsbCwgZXJyb3IpIH0pXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFBhdGNoKGNvbnRlbnRPbGQ6IHN0cmluZywgY29udGVudE5ldzogc3RyaW5nKTogc3RyaW5nIHtcclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICBsZXQgZG1wOiBkaWZmX21hdGNoX3BhdGNoID0gbmV3IGRpZmZfbWF0Y2hfcGF0Y2goKTtcclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICBsZXQgcGF0Y2hPYmplY3Q6IHBhdGNoX29ialtdID0gZG1wLnBhdGNoX21ha2UoY29udGVudE9sZCwgY29udGVudE5ldyk7XHJcblxyXG4gICAgICAgIGxldCBwYXRjaDogc3RyaW5nID0gSlNPTi5zdHJpbmdpZnkocGF0Y2hPYmplY3QpO1xyXG5cclxuICAgICAgICAvLyBUZXN0IHBhdGNoIGFuZCBvbmx5IHJldHVybiBpdCBpZiBpdCBpcyB2YWxpZCFcclxuICAgICAgICBsZXQgZGVTZXJpYWxpemVkUGF0Y2hPYmplY3QgPSBKU09OLnBhcnNlKHBhdGNoKTtcclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdDogW3N0cmluZywgYm9vbGVhbltdXSA9IGRtcC5wYXRjaF9hcHBseShkZVNlcmlhbGl6ZWRQYXRjaE9iamVjdCwgY29udGVudE9sZCk7XHJcblxyXG4gICAgICAgIGlmIChyZXN1bHQgPT0gbnVsbCB8fCByZXN1bHRbMF0gPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGlmIChyZXN1bHRbMF0gPT0gY29udGVudE5ldykge1xyXG4gICAgICAgICAgICByZXR1cm4gcGF0Y2g7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB3cml0ZUNoYW5nZXNUb1dvcmtzcGFjZSgpIHtcclxuICAgICAgICBsZXQgd29ya3NwYWNlID0gdGhpcy5jb3BpZWRGcm9tV29ya3NwYWNlO1xyXG4gICAgICAgIGxldCBvbGRJZFRvTW9kdWxlTWFwOiB7IFtpZDogbnVtYmVyXTogTW9kdWxlIH0gPSB7fTtcclxuICAgICAgICBsZXQgbmV3SWRUb0ZpbGVNYXA6IHsgW2lkOiBudW1iZXJdOiBTeW5jaHJvRmlsZSB9ID0ge307XHJcblxyXG4gICAgICAgIHdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKS5mb3JFYWNoKG0gPT4ge1xyXG4gICAgICAgICAgICBpZiAobS5maWxlLmlzX2NvcHlfb2ZfaWQgIT0gbnVsbCkgb2xkSWRUb01vZHVsZU1hcFttLmZpbGUuaXNfY29weV9vZl9pZF0gPSBtO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmZpbGVzLmZvckVhY2goZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChmaWxlLmlkSW5zaWRlV29ya3NwYWNlICE9IG51bGwpIG5ld0lkVG9GaWxlTWFwW2ZpbGUuaWRJbnNpZGVXb3Jrc3BhY2VdID0gZmlsZTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IG1haW4gPSB0aGlzLm1hbmFnZXIubWFpbjtcclxuICAgICAgICBmb3IgKGxldCBtb2R1bGUgb2Ygd29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3luY2hyb0ZpbGUgPSBuZXdJZFRvRmlsZU1hcFttb2R1bGUuZmlsZS5pZF07XHJcbiAgICAgICAgICAgIGlmIChzeW5jaHJvRmlsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS50ZXh0ID0gc3luY2hyb0ZpbGUubW9uYWNvTW9kZWwuZ2V0VmFsdWUobW9uYWNvLmVkaXRvci5FbmRPZkxpbmVQcmVmZXJlbmNlLkxGLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBzeW5jaHJvRmlsZS50ZXh0ID0gbW9kdWxlLmZpbGUudGV4dDtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5maWxlLmlzX2NvcHlfb2ZfaWQgPSBzeW5jaHJvRmlsZS5pZEluc2lkZVJlcG9zaXRvcnk7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS5yZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbiA9IHN5bmNocm9GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uO1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUuc2F2ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIG1vZHVsZS5tb2RlbC5zZXRWYWx1ZShzeW5jaHJvRmlsZS50ZXh0KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICBtYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmREZWxldGVXb3Jrc3BhY2VPckZpbGUoXCJmaWxlXCIsIG1vZHVsZS5maWxlLmlkLCAoZXJyb3I6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtzcGFjZS5tb2R1bGVTdG9yZS5yZW1vdmVNb2R1bGUobW9kdWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1haW4uY3VycmVudFdvcmtzcGFjZSA9PSB3b3Jrc3BhY2UgJiYgbWFpbi5wcm9qZWN0RXhwbG9yZXIuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkgPT0gbW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYWluLnByb2plY3RFeHBsb3Jlci5zZXRNb2R1bGVBY3RpdmUobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRGVyIFNlcnZlciBpc3QgbmljaHQgZXJyZWljaGJhciEnKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IHN5bmNocm9GaWxlIG9mIHRoaXMuZmlsZXMpIHtcclxuICAgICAgICAgICAgaWYgKG9sZElkVG9Nb2R1bGVNYXBbc3luY2hyb0ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5XSA9PSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGY6IEZpbGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc3luY2hyb0ZpbGUubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBkaXJ0eTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgc2F2ZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogc3luY2hyb0ZpbGUudGV4dCxcclxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzX2NvcHlfb2ZfaWQ6IHN5bmNocm9GaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSxcclxuICAgICAgICAgICAgICAgICAgICByZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbjogc3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb25cclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBsZXQgbSA9IG5ldyBNb2R1bGUoZiwgbWFpbik7XHJcbiAgICAgICAgICAgICAgICB3b3Jrc3BhY2UubW9kdWxlU3RvcmUucHV0TW9kdWxlKG0pO1xyXG4gICAgICAgICAgICAgICAgbWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kQ3JlYXRlRmlsZShtLCB3b3Jrc3BhY2UsIG1haW4udXNlci5pZCxcclxuICAgICAgICAgICAgICAgICAgICAoZXJyb3I6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgPT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFsZXJ0KCdEZXIgU2VydmVyIGlzdCBuaWNodCBlcnJlaWNoYmFyIScpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kVXBkYXRlcyhudWxsLCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKG1haW4uY3VycmVudFdvcmtzcGFjZSA9PSB3b3Jrc3BhY2UpIHtcclxuICAgICAgICAgICAgbGV0IGNlbSA9IG1haW4uZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICAgICAgICAgIG1haW4ucHJvamVjdEV4cGxvcmVyLnNldFdvcmtzcGFjZUFjdGl2ZSh3b3Jrc3BhY2UpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgbW9kdWxlIGhhZG4ndCBiZWVuIGRlbGV0ZWQgd2hpbGUgc3luY2hyb25pemluZzpcclxuICAgICAgICAgICAgaWYod29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpLmluZGV4T2YoY2VtKSA+PSAwKXtcclxuICAgICAgICAgICAgICAgIG1haW4ucHJvamVjdEV4cGxvcmVyLnNldE1vZHVsZUFjdGl2ZShjZW0pO1xyXG4gICAgICAgICAgICAgICAgbWFpbi5wcm9qZWN0RXhwbG9yZXIuZmlsZUxpc3RQYW5lbC5zZWxlY3QoY2VtLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbn0iXX0=