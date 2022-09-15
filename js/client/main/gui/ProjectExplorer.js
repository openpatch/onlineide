import { Module } from "../../compiler/parser/Module.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { Workspace } from "../../workspace/Workspace.js";
import { AccordionPanel, Accordion } from "./Accordion.js";
import { Helper } from "./Helper.js";
import { dateToString } from "../../tools/StringTools.js";
import { DistributeToStudentsDialog } from "./DistributeToStudentsDialog.js";
export class ProjectExplorer {
    constructor(main, $projectexplorerDiv) {
        this.main = main;
        this.$projectexplorerDiv = $projectexplorerDiv;
        this.programPointerModule = null;
        this.programPointerDecoration = [];
        this.lastOpenModule = null;
    }
    initGUI() {
        this.accordion = new Accordion(this.$projectexplorerDiv);
        this.initFilelistPanel();
        this.initWorkspacelistPanel();
    }
    initFilelistPanel() {
        let that = this;
        this.fileListPanel = new AccordionPanel(this.accordion, "Kein Workspace gewählt", "3", "img_add-file-dark", "Neue Datei...", "java", true);
        this.fileListPanel.newElementCallback =
            (accordionElement, successfulNetworkCommunicationCallback) => {
                if (that.main.currentWorkspace == null) {
                    alert('Bitte wählen Sie zuerst einen Workspace aus.');
                    return null;
                }
                let f = {
                    name: accordionElement.name,
                    dirty: false,
                    saved: true,
                    text: "",
                    text_before_revision: null,
                    submitted_date: null,
                    student_edited_after_revision: false,
                    version: 1,
                    panelElement: accordionElement,
                    identical_to_repository_version: false
                };
                let m = new Module(f, that.main);
                let modulStore = that.main.currentWorkspace.moduleStore;
                modulStore.putModule(m);
                that.setModuleActive(m);
                that.main.networkManager.sendCreateFile(m, that.main.currentWorkspace, that.main.workspacesOwnerId, (error) => {
                    if (error == null) {
                        successfulNetworkCommunicationCallback(m);
                    }
                    else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });
            };
        this.fileListPanel.renameCallback =
            (module, newName) => {
                newName = newName.substr(0, 80);
                let file = module.file;
                file.name = newName;
                file.saved = false;
                that.main.networkManager.sendUpdates();
                return newName;
            };
        this.fileListPanel.deleteCallback =
            (module, callbackIfSuccessful) => {
                that.main.networkManager.sendDeleteWorkspaceOrFile("file", module.file.id, (error) => {
                    if (error == null) {
                        that.main.currentWorkspace.moduleStore.removeModule(module);
                        callbackIfSuccessful();
                    }
                    else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });
            };
        this.fileListPanel.contextMenuProvider = (accordionElement) => {
            let cmiList = [];
            if (!(that.main.user.is_teacher || that.main.user.is_admin || that.main.user.is_schooladmin)) {
                let module = accordionElement.externalElement;
                let file = module.file;
                if (file.submitted_date == null) {
                    cmiList.push({
                        caption: "Als Hausaufgabe markieren",
                        callback: (element) => {
                            let file = element.externalElement.file;
                            file.submitted_date = dateToString(new Date());
                            file.saved = false;
                            that.main.networkManager.sendUpdates(null, true);
                            that.renderHomeworkButton(file);
                        }
                    });
                }
                else {
                    cmiList.push({
                        caption: "Hausaufgabenmarkierung entfernen",
                        callback: (element) => {
                            let file = element.externalElement.file;
                            file.submitted_date = null;
                            file.saved = false;
                            that.main.networkManager.sendUpdates(null, true);
                            that.renderHomeworkButton(file);
                        }
                    });
                }
            }
            return cmiList;
        };
        this.fileListPanel.selectCallback =
            (module) => {
                that.setModuleActive(module);
            };
        this.$synchronizeAction = jQuery('<div class="img_open-change jo_button jo_active" style="margin-right: 4px"' +
            ' title="Workspace mit Repository synchronisieren">');
        this.$synchronizeAction.on('mousedown', (e) => {
            this.main.getCurrentWorkspace().synchronizeWithRepository();
            e.stopPropagation();
        });
        this.fileListPanel.addAction(this.$synchronizeAction);
        this.$synchronizeAction.hide();
    }
    renderHomeworkButton(file) {
        var _a, _b;
        let $buttonDiv = (_b = (_a = file === null || file === void 0 ? void 0 : file.panelElement) === null || _a === void 0 ? void 0 : _a.$htmlFirstLine) === null || _b === void 0 ? void 0 : _b.find('.jo_additionalButtonHomework');
        if ($buttonDiv == null)
            return;
        $buttonDiv.find('.jo_homeworkButton').remove();
        let klass = null;
        let title = "";
        if (file.submitted_date != null) {
            klass = "img_homework";
            title = "Wurde als Hausaufgabe abgegeben: " + file.submitted_date;
            if (file.text_before_revision) {
                klass = "img_homework-corrected";
                title = "Korrektur liegt vor.";
            }
        }
        if (klass != null) {
            let $homeworkButtonDiv = jQuery(`<div class="jo_homeworkButton ${klass}" title="${title}"></div>`);
            $buttonDiv.prepend($homeworkButtonDiv);
            if (klass.indexOf("jo_active") >= 0) {
                $homeworkButtonDiv.on('mousedown', (e) => e.stopPropagation());
                $homeworkButtonDiv.on('click', (e) => {
                    e.stopPropagation();
                    // TODO
                });
            }
        }
    }
    initWorkspacelistPanel() {
        let that = this;
        this.workspaceListPanel = new AccordionPanel(this.accordion, "WORKSPACES", "2", "img_add-workspace-dark", "Neuer Workspace...", "workspace", true);
        this.workspaceListPanel.newElementCallback =
            (accordionElement, successfulNetworkCommunicationCallback) => {
                let owner_id = that.main.user.id;
                if (that.main.workspacesOwnerId != null) {
                    owner_id = that.main.workspacesOwnerId;
                }
                let w = new Workspace(accordionElement.name, that.main, owner_id);
                that.main.workspaceList.push(w);
                that.main.networkManager.sendCreateWorkspace(w, that.main.workspacesOwnerId, (error) => {
                    if (error == null) {
                        that.fileListPanel.enableNewButton(true);
                        successfulNetworkCommunicationCallback(w);
                        that.setWorkspaceActive(w);
                        w.renderSynchronizeButton(accordionElement);
                    }
                    else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });
            };
        this.workspaceListPanel.renameCallback =
            (workspace, newName) => {
                newName = newName.substr(0, 80);
                workspace.name = newName;
                workspace.saved = false;
                that.main.networkManager.sendUpdates();
                return newName;
            };
        this.workspaceListPanel.deleteCallback =
            (workspace, successfulNetworkCommunicationCallback) => {
                that.main.networkManager.sendDeleteWorkspaceOrFile("workspace", workspace.id, (error) => {
                    if (error == null) {
                        that.main.removeWorkspace(workspace);
                        that.fileListPanel.enableNewButton(that.main.workspaceList.length > 0);
                        successfulNetworkCommunicationCallback();
                    }
                    else {
                        alert('Der Server ist nicht erreichbar!');
                    }
                });
            };
        this.workspaceListPanel.selectCallback =
            (workspace) => {
                that.main.networkManager.sendUpdates(() => {
                    that.setWorkspaceActive(workspace);
                });
            };
        this.$homeAction = jQuery('<div class="img_home-dark jo_button jo_active" style="margin-right: 4px"' +
            ' title="Meine eigenen Workspaces anzeigen">');
        this.$homeAction.on('mousedown', (e) => {
            that.main.networkManager.sendUpdates(() => {
                that.onHomeButtonClicked();
            });
            that.main.bottomDiv.hideHomeworkTab();
            e.stopPropagation();
        });
        this.workspaceListPanel.addAction(this.$homeAction);
        this.$homeAction.hide();
        this.workspaceListPanel.contextMenuProvider = (workspaceAccordionElement) => {
            let cmiList = [];
            cmiList.push({
                caption: "Duplizieren",
                callback: (element) => {
                    this.main.networkManager.sendDuplicateWorkspace(element.externalElement, (error, workspaceData) => {
                        if (error == null && workspaceData != null) {
                            let newWorkspace = Workspace.restoreFromData(workspaceData, this.main);
                            this.main.workspaceList.push(newWorkspace);
                            newWorkspace.panelElement = {
                                name: newWorkspace.name,
                                externalElement: newWorkspace,
                                iconClass: newWorkspace.repository_id == null ? 'workspace' : 'repository'
                            };
                            this.workspaceListPanel.addElement(newWorkspace.panelElement);
                            this.workspaceListPanel.sortElements();
                        }
                        if (error != null) {
                            alert(error);
                        }
                    });
                }
            });
            if (this.main.user.is_teacher && this.main.teacherExplorer.classPanel.elements.length > 0) {
                cmiList.push({
                    caption: "An Klasse austeilen...",
                    callback: (element) => { },
                    subMenu: this.main.teacherExplorer.classPanel.elements.map((ae) => {
                        return {
                            caption: ae.name,
                            callback: (element) => {
                                let klasse = ae.externalElement;
                                let workspace = element.externalElement;
                                this.main.networkManager.sendDistributeWorkspace(workspace, klasse, null, (error) => {
                                    if (error == null) {
                                        let networkManager = this.main.networkManager;
                                        let dt = networkManager.updateFrequencyInSeconds * networkManager.forcedUpdateEvery;
                                        alert("Der Workspace " + workspace.name + " wurde an die Klasse " + klasse.name + " ausgeteilt. Er wird in maximal " +
                                            dt + " s bei jedem Schüler ankommen.");
                                    }
                                    else {
                                        alert(error);
                                    }
                                });
                            }
                        };
                    })
                }, {
                    caption: "An einzelne Schüler/innen austeilen...",
                    callback: (element) => {
                        let classes = this.main.teacherExplorer.classPanel.elements.map(ae => ae.externalElement);
                        let workspace = element.externalElement;
                        new DistributeToStudentsDialog(classes, workspace, this.main);
                    }
                });
            }
            if (this.main.repositoryOn && this.main.workspacesOwnerId == this.main.user.id) {
                if (workspaceAccordionElement.externalElement.repository_id == null) {
                    cmiList.push({
                        caption: "Repository anlegen...",
                        callback: (element) => {
                            let workspace = element.externalElement;
                            that.main.repositoryCreateManager.show(workspace);
                        },
                        subMenu: null,
                    });
                }
                else {
                    cmiList.push({
                        caption: "Mit Repository synchronisieren",
                        callback: (element) => {
                            let workspace = element.externalElement;
                            workspace.synchronizeWithRepository();
                        }
                    });
                    cmiList.push({
                        caption: "Vom Repository loslösen",
                        color: "#ff8080",
                        callback: (element) => {
                            let workspace = element.externalElement;
                            workspace.repository_id = null;
                            workspace.saved = false;
                            this.main.networkManager.sendUpdates(() => {
                                that.workspaceListPanel.setElementClass(element, "workspace");
                                workspace.renderSynchronizeButton(element);
                            }, true);
                        }
                    });
                }
            }
            return cmiList;
        };
    }
    onHomeButtonClicked() {
        this.main.teacherExplorer.restoreOwnWorkspaces();
        this.main.networkManager.updateFrequencyInSeconds = this.main.networkManager.ownUpdateFrequencyInSeconds;
        this.$homeAction.hide();
        this.fileListPanel.enableNewButton(this.main.workspaceList.length > 0);
    }
    renderFiles(workspace) {
        let name = workspace == null ? "Kein Workspace vorhanden" : workspace.name;
        this.fileListPanel.setCaption(name);
        this.fileListPanel.clear();
        if (this.main.getCurrentWorkspace() != null) {
            for (let module of this.main.getCurrentWorkspace().moduleStore.getModules(false)) {
                module.file.panelElement = null;
            }
        }
        if (workspace != null) {
            let moduleList = [];
            for (let m of workspace.moduleStore.getModules(false)) {
                moduleList.push(m);
            }
            moduleList.sort((a, b) => { return a.file.name > b.file.name ? 1 : a.file.name < b.file.name ? -1 : 0; });
            for (let m of moduleList) {
                m.file.panelElement = {
                    name: m.file.name,
                    externalElement: m
                };
                this.fileListPanel.addElement(m.file.panelElement);
                this.renderHomeworkButton(m.file);
            }
            this.fileListPanel.sortElements();
        }
    }
    renderWorkspaces(workspaceList) {
        this.fileListPanel.clear();
        this.workspaceListPanel.clear();
        for (let w of workspaceList) {
            w.panelElement = {
                name: w.name,
                externalElement: w,
                iconClass: w.repository_id == null ? 'workspace' : 'repository'
            };
            this.workspaceListPanel.addElement(w.panelElement);
            w.renderSynchronizeButton(w.panelElement);
        }
        this.workspaceListPanel.sortElements();
        this.fileListPanel.enableNewButton(workspaceList.length > 0);
    }
    renderErrorCount(workspace, errorCountMap) {
        if (errorCountMap == null)
            return;
        for (let m of workspace.moduleStore.getModules(false)) {
            let errorCount = errorCountMap.get(m);
            let errorCountS = ((errorCount == null || errorCount == 0) ? "" : "(" + errorCount + ")");
            this.fileListPanel.setTextAfterFilename(m.file.panelElement, errorCountS, 'jo_errorcount');
        }
    }
    showRepositoryButtonIfNeeded(w) {
        if (w.repository_id != null && w.owner_id == this.main.user.id) {
            this.$synchronizeAction.show();
            if (!this.main.user.settings.helperHistory.repositoryButtonDone) {
                Helper.showHelper("repositoryButton", this.main, this.$synchronizeAction);
            }
        }
        else {
            this.$synchronizeAction.hide();
        }
    }
    setWorkspaceActive(w, scrollIntoView = false) {
        this.workspaceListPanel.select(w, false, scrollIntoView);
        if (this.main.interpreter.state == InterpreterState.running) {
            this.main.interpreter.stop();
        }
        this.main.currentWorkspace = w;
        this.renderFiles(w);
        if (w != null) {
            let nonSystemModules = w.moduleStore.getModules(false);
            if (w.currentlyOpenModule != null) {
                this.setModuleActive(w.currentlyOpenModule);
            }
            else if (nonSystemModules.length > 0) {
                this.setModuleActive(nonSystemModules[0]);
            }
            else {
                this.setModuleActive(null);
            }
            for (let m of nonSystemModules) {
                m.file.dirty = true;
            }
            if (nonSystemModules.length == 0 && !this.main.user.settings.helperHistory.newFileHelperDone) {
                Helper.showHelper("newFileHelper", this.main, this.fileListPanel.$captionElement);
            }
            this.showRepositoryButtonIfNeeded(w);
        }
        else {
            this.setModuleActive(null);
        }
    }
    writeEditorTextToFile() {
        let cem = this.getCurrentlyEditedModule();
        if (cem != null)
            cem.file.text = cem.getProgramTextFromMonacoModel(); // 29.03. this.main.monaco.getValue();
    }
    setModuleActive(m) {
        this.main.bottomDiv.homeworkManager.hideRevision();
        if (this.lastOpenModule != null) {
            this.lastOpenModule.getBreakpointPositionsFromEditor();
            this.lastOpenModule.file.text = this.lastOpenModule.getProgramTextFromMonacoModel(); // this.main.monaco.getValue();
            this.lastOpenModule.editorState = this.main.getMonacoEditor().saveViewState();
        }
        if (m == null) {
            this.main.getMonacoEditor().setModel(monaco.editor.createModel("Keine Datei vorhanden.", "text"));
            this.main.getMonacoEditor().updateOptions({ readOnly: true });
        }
        else {
            this.main.getMonacoEditor().updateOptions({ readOnly: false });
            this.main.getMonacoEditor().setModel(m.model);
            if (this.main.getBottomDiv() != null)
                this.main.getBottomDiv().errorManager.showParenthesisWarning(m.bracketError);
            if (m.file.text_before_revision != null) {
                this.main.bottomDiv.homeworkManager.showHomeWorkRevisionButton();
            }
            else {
                this.main.bottomDiv.homeworkManager.hideHomeworkRevisionButton();
            }
        }
    }
    setActiveAfterExternalModelSet(m) {
        this.fileListPanel.select(m, false);
        this.lastOpenModule = m;
        if (m.editorState != null) {
            this.main.editor.dontPushNextCursorMove++;
            this.main.getMonacoEditor().restoreViewState(m.editorState);
            this.main.editor.dontPushNextCursorMove--;
        }
        m.renderBreakpointDecorators();
        this.setCurrentlyEditedModule(m);
        this.showProgramPointer();
        setTimeout(() => {
            if (!this.main.getMonacoEditor().getOptions().get(monaco.editor.EditorOption.readOnly)) {
                this.main.getMonacoEditor().focus();
            }
        }, 300);
    }
    showProgramPointer() {
        if (this.programPointerModule == this.getCurrentlyEditedModule() && this.getCurrentlyEditedModule() != null) {
            let position = this.programPointerPosition;
            let range = {
                startColumn: position.column, startLineNumber: position.line,
                endColumn: position.column + position.length, endLineNumber: position.line
            };
            this.main.getMonacoEditor().revealRangeInCenterIfOutsideViewport(range);
            this.programPointerDecoration = this.main.getMonacoEditor().deltaDecorations(this.programPointerDecoration, [
                {
                    range: range,
                    options: {
                        className: 'jo_revealProgramPointer', isWholeLine: true,
                        overviewRuler: {
                            color: "#6fd61b",
                            position: monaco.editor.OverviewRulerLane.Center
                        },
                        minimap: {
                            color: "#6fd61b",
                            position: monaco.editor.MinimapPosition.Inline
                        }
                    }
                },
                {
                    range: range,
                    options: { beforeContentClassName: 'jo_revealProgramPointerBefore' }
                }
            ]);
        }
    }
    showProgramPointerPosition(file, position) {
        // console statement execution:
        if (file == null) {
            return;
        }
        let module = this.main.currentWorkspace.moduleStore.findModuleByFile(file);
        if (module == null) {
            return;
        }
        this.programPointerModule = module;
        this.programPointerPosition = position;
        if (module != this.getCurrentlyEditedModule()) {
            this.setModuleActive(module);
        }
        else {
            this.showProgramPointer();
        }
    }
    hideProgramPointerPosition() {
        if (this.getCurrentlyEditedModule() == this.programPointerModule) {
            this.main.getMonacoEditor().deltaDecorations(this.programPointerDecoration, []);
        }
        this.programPointerModule = null;
        this.programPointerDecoration = [];
    }
    getCurrentlyEditedModule() {
        let ws = this.main.currentWorkspace;
        if (ws == null)
            return null;
        return ws.currentlyOpenModule;
    }
    setCurrentlyEditedModule(m) {
        if (m == null)
            return;
        let ws = this.main.currentWorkspace;
        if (ws.currentlyOpenModule != m) {
            ws.currentlyOpenModule = m;
            ws.saved = false;
            m.file.dirty = true;
        }
    }
    setExplorerColor(color) {
        let caption;
        if (color == null) {
            color = "transparent";
            caption = "Meine WORKSPACES";
        }
        else {
            caption = "Schüler-WORKSPACES";
        }
        this.fileListPanel.$listElement.parent().css('background-color', color);
        this.workspaceListPanel.$listElement.parent().css('background-color', color);
        this.workspaceListPanel.setCaption(caption);
    }
    getNewModule(file) {
        return new Module(file, this.main);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvamVjdEV4cGxvcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9Qcm9qZWN0RXhwbG9yZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFRLE1BQU0sRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBRS9ELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGtDQUFrQyxDQUFDO0FBRXBFLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUV6RCxPQUFPLEVBQUUsY0FBYyxFQUFFLFNBQVMsRUFBOEMsTUFBTSxnQkFBZ0IsQ0FBQztBQUN2RyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBSXJDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUMxRCxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUc3RSxNQUFNLE9BQU8sZUFBZTtJQWF4QixZQUFvQixJQUFVLEVBQVUsbUJBQXdDO1FBQTVELFNBQUksR0FBSixJQUFJLENBQU07UUFBVSx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXFCO1FBWGhGLHlCQUFvQixHQUFXLElBQUksQ0FBQztRQUVwQyw2QkFBd0IsR0FBYSxFQUFFLENBQUM7UUFzaEJ4QyxtQkFBYyxHQUFXLElBQUksQ0FBQztJQTNnQjlCLENBQUM7SUFFRCxPQUFPO1FBRUgsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUV6RCxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUV6QixJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztJQUVsQyxDQUFDO0lBRUQsaUJBQWlCO1FBRWIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxjQUFjLENB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QUMzQixFQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUNqQixDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7U0FDdkI7SUFDTCxDQUFDO0lBRUQsZ0JBQWdCLENBQUMsS0FBYTtRQUMxQixJQUFJLE9BQWUsQ0FBQztRQUVwQixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDZixLQUFLLEdBQUcsYUFBYSxDQUFDO1lBQ3RCLE9BQU8sR0FBRyxrQkFBa0IsQ0FBQztTQUNoQzthQUFNO1lBQ0gsT0FBTyxHQUFHLG9CQUFvQixDQUFDO1NBQ2xDO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3hFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRTdFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUVELFlBQVksQ0FBQyxJQUFVO1FBQ25CLE9BQU8sSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXR3b3JrTWFuYWdlciB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL05ldHdvcmtNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbiB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xyXG5pbXBvcnQgeyBGaWxlLCBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtUHJpbnRlciB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvUHJvZ3JhbVByaW50ZXIuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJwcmV0ZXJTdGF0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRWRpdGFibGUsIG9wZW5Db250ZXh0TWVudSB9IGZyb20gXCIuLi8uLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uLy4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IEFjY29yZGlvblBhbmVsLCBBY2NvcmRpb24sIEFjY29yZGlvbkVsZW1lbnQsIEFjY29yZGlvbkNvbnRleHRNZW51SXRlbSB9IGZyb20gXCIuL0FjY29yZGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi9IZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgdGV4dCB9IGZyb20gXCJleHByZXNzXCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZURhdGEsIFdvcmtzcGFjZXMsIENsYXNzRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgVGlsaW5nU3ByaXRlIH0gZnJvbSBcInBpeGkuanNcIjtcclxuaW1wb3J0IHsgZGF0ZVRvU3RyaW5nIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL1N0cmluZ1Rvb2xzLmpzXCI7XHJcbmltcG9ydCB7IERpc3RyaWJ1dGVUb1N0dWRlbnRzRGlhbG9nIH0gZnJvbSBcIi4vRGlzdHJpYnV0ZVRvU3R1ZGVudHNEaWFsb2cuanNcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUHJvamVjdEV4cGxvcmVyIHtcclxuXHJcbiAgICBwcm9ncmFtUG9pbnRlck1vZHVsZTogTW9kdWxlID0gbnVsbDtcclxuICAgIHByb2dyYW1Qb2ludGVyUG9zaXRpb246IFRleHRQb3NpdGlvbjtcclxuICAgIHByb2dyYW1Qb2ludGVyRGVjb3JhdGlvbjogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICBhY2NvcmRpb246IEFjY29yZGlvbjtcclxuICAgIGZpbGVMaXN0UGFuZWw6IEFjY29yZGlvblBhbmVsO1xyXG4gICAgd29ya3NwYWNlTGlzdFBhbmVsOiBBY2NvcmRpb25QYW5lbDtcclxuXHJcbiAgICAkaG9tZUFjdGlvbjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRzeW5jaHJvbml6ZUFjdGlvbjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1haW46IE1haW4sIHByaXZhdGUgJHByb2plY3RleHBsb3JlckRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0R1VJKCkge1xyXG5cclxuICAgICAgICB0aGlzLmFjY29yZGlvbiA9IG5ldyBBY2NvcmRpb24odGhpcy4kcHJvamVjdGV4cGxvcmVyRGl2KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0RmlsZWxpc3RQYW5lbCgpO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRXb3Jrc3BhY2VsaXN0UGFuZWwoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEZpbGVsaXN0UGFuZWwoKSB7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5maWxlTGlzdFBhbmVsID0gbmV3IEFjY29yZGlvblBhbmVsKHRoaXMuYWNjb3JkaW9uLCBcIktlaW4gV29ya3NwYWNlIGdld8OkaGx0XCIsIFwiM1wiLFxyXG4gICAgICAgICAgICBcImltZ19hZGQtZmlsZS1kYXJrXCIsIFwiTmV1ZSBEYXRlaS4uLlwiLCBcImphdmFcIiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5uZXdFbGVtZW50Q2FsbGJhY2sgPVxyXG5cclxuICAgICAgICAgICAgKGFjY29yZGlvbkVsZW1lbnQsIHN1Y2Nlc3NmdWxOZXR3b3JrQ29tbXVuaWNhdGlvbkNhbGxiYWNrKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQubWFpbi5jdXJyZW50V29ya3NwYWNlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydCgnQml0dGUgd8OkaGxlbiBTaWUgenVlcnN0IGVpbmVuIFdvcmtzcGFjZSBhdXMuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGY6IEZpbGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYWNjb3JkaW9uRWxlbWVudC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpcnR5OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBzYXZlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRfYmVmb3JlX3JldmlzaW9uOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdHRlZF9kYXRlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhbmVsRWxlbWVudDogYWNjb3JkaW9uRWxlbWVudCxcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGljYWxfdG9fcmVwb3NpdG9yeV92ZXJzaW9uOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxldCBtID0gbmV3IE1vZHVsZShmLCB0aGF0Lm1haW4pO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1vZHVsU3RvcmUgPSB0aGF0Lm1haW4uY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZTtcclxuICAgICAgICAgICAgICAgIG1vZHVsU3RvcmUucHV0TW9kdWxlKG0pO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZXRNb2R1bGVBY3RpdmUobSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lm1haW4ubmV0d29ya01hbmFnZXIuc2VuZENyZWF0ZUZpbGUobSwgdGhhdC5tYWluLmN1cnJlbnRXb3Jrc3BhY2UsIHRoYXQubWFpbi53b3Jrc3BhY2VzT3duZXJJZCxcclxuICAgICAgICAgICAgICAgICAgICAoZXJyb3I6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc2Z1bE5ldHdvcmtDb21tdW5pY2F0aW9uQ2FsbGJhY2sobSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRGVyIFNlcnZlciBpc3QgbmljaHQgZXJyZWljaGJhciEnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5yZW5hbWVDYWxsYmFjayA9XHJcbiAgICAgICAgICAgIChtb2R1bGU6IE1vZHVsZSwgbmV3TmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBuZXdOYW1lID0gbmV3TmFtZS5zdWJzdHIoMCwgODApO1xyXG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBtb2R1bGUuZmlsZTtcclxuXHJcbiAgICAgICAgICAgICAgICBmaWxlLm5hbWUgPSBuZXdOYW1lO1xyXG4gICAgICAgICAgICAgICAgZmlsZS5zYXZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmRVcGRhdGVzKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3TmFtZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmZpbGVMaXN0UGFuZWwuZGVsZXRlQ2FsbGJhY2sgPVxyXG4gICAgICAgICAgICAobW9kdWxlOiBNb2R1bGUsIGNhbGxiYWNrSWZTdWNjZXNzZnVsOiAoKSA9PiB2b2lkKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lm1haW4ubmV0d29ya01hbmFnZXIuc2VuZERlbGV0ZVdvcmtzcGFjZU9yRmlsZShcImZpbGVcIiwgbW9kdWxlLmZpbGUuaWQsIChlcnJvcjogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUucmVtb3ZlTW9kdWxlKG1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrSWZTdWNjZXNzZnVsKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0RlciBTZXJ2ZXIgaXN0IG5pY2h0IGVycmVpY2hiYXIhJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGVMaXN0UGFuZWwuY29udGV4dE1lbnVQcm92aWRlciA9IChhY2NvcmRpb25FbGVtZW50OiBBY2NvcmRpb25FbGVtZW50KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNtaUxpc3Q6IEFjY29yZGlvbkNvbnRleHRNZW51SXRlbVtdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoISh0aGF0Lm1haW4udXNlci5pc190ZWFjaGVyIHx8IHRoYXQubWFpbi51c2VyLmlzX2FkbWluIHx8IHRoYXQubWFpbi51c2VyLmlzX3NjaG9vbGFkbWluKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1vZHVsZTogTW9kdWxlID0gPE1vZHVsZT5hY2NvcmRpb25FbGVtZW50LmV4dGVybmFsRWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZSA9IG1vZHVsZS5maWxlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZihmaWxlLnN1Ym1pdHRlZF9kYXRlID09IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbWlMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJBbHMgSGF1c2F1ZmdhYmUgbWFya2llcmVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGUgPSAoPE1vZHVsZT5lbGVtZW50LmV4dGVybmFsRWxlbWVudCkuZmlsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlLnN1Ym1pdHRlZF9kYXRlID0gZGF0ZVRvU3RyaW5nKG5ldyBEYXRlKCkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGUuc2F2ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMobnVsbCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW5kZXJIb21ld29ya0J1dHRvbihmaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY21pTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiSGF1c2F1ZmdhYmVubWFya2llcnVuZyBlbnRmZXJuZW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlID0gKDxNb2R1bGU+ZWxlbWVudC5leHRlcm5hbEVsZW1lbnQpLmZpbGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zdWJtaXR0ZWRfZGF0ZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZS5zYXZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kVXBkYXRlcyhudWxsLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbmRlckhvbWV3b3JrQnV0dG9uKGZpbGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBjbWlMaXN0O1xyXG4gICAgICAgICAgICB9ICAgIFxyXG5cclxuXHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5zZWxlY3RDYWxsYmFjayA9XHJcbiAgICAgICAgICAgIChtb2R1bGU6IE1vZHVsZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZXRNb2R1bGVBY3RpdmUobW9kdWxlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy4kc3luY2hyb25pemVBY3Rpb24gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJpbWdfb3Blbi1jaGFuZ2Ugam9fYnV0dG9uIGpvX2FjdGl2ZVwiIHN0eWxlPVwibWFyZ2luLXJpZ2h0OiA0cHhcIicgK1xyXG4gICAgICAgICAgICAnIHRpdGxlPVwiV29ya3NwYWNlIG1pdCBSZXBvc2l0b3J5IHN5bmNocm9uaXNpZXJlblwiPicpO1xyXG4gICAgICAgIHRoaXMuJHN5bmNocm9uaXplQWN0aW9uLm9uKCdtb3VzZWRvd24nLCAoZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5zeW5jaHJvbml6ZVdpdGhSZXBvc2l0b3J5KCk7XHJcblxyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5hZGRBY3Rpb24odGhpcy4kc3luY2hyb25pemVBY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuJHN5bmNocm9uaXplQWN0aW9uLmhpZGUoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVySG9tZXdvcmtCdXR0b24oZmlsZTogRmlsZSkge1xyXG4gICAgICAgIGxldCAkYnV0dG9uRGl2ID0gZmlsZT8ucGFuZWxFbGVtZW50Py4kaHRtbEZpcnN0TGluZT8uZmluZCgnLmpvX2FkZGl0aW9uYWxCdXR0b25Ib21ld29yaycpO1xyXG4gICAgICAgIGlmICgkYnV0dG9uRGl2ID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgJGJ1dHRvbkRpdi5maW5kKCcuam9faG9tZXdvcmtCdXR0b24nKS5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgbGV0IGtsYXNzOiBzdHJpbmcgPSBudWxsO1xyXG4gICAgICAgIGxldCB0aXRsZTogc3RyaW5nID0gXCJcIjtcclxuICAgICAgICBpZihmaWxlLnN1Ym1pdHRlZF9kYXRlICE9IG51bGwpe1xyXG4gICAgICAgICAgICBrbGFzcyA9IFwiaW1nX2hvbWV3b3JrXCI7XHJcbiAgICAgICAgICAgIHRpdGxlID0gXCJXdXJkZSBhbHMgSGF1c2F1ZmdhYmUgYWJnZWdlYmVuOiBcIiArIGZpbGUuc3VibWl0dGVkX2RhdGVcclxuICAgICAgICAgICAgaWYoZmlsZS50ZXh0X2JlZm9yZV9yZXZpc2lvbil7XHJcbiAgICAgICAgICAgICAgICBrbGFzcyA9IFwiaW1nX2hvbWV3b3JrLWNvcnJlY3RlZFwiO1xyXG4gICAgICAgICAgICAgICAgdGl0bGUgPSBcIktvcnJla3R1ciBsaWVndCB2b3IuXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gXHJcblxyXG4gICAgICAgIGlmIChrbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCAkaG9tZXdvcmtCdXR0b25EaXYgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19ob21ld29ya0J1dHRvbiAke2tsYXNzfVwiIHRpdGxlPVwiJHt0aXRsZX1cIj48L2Rpdj5gKTtcclxuICAgICAgICAgICAgJGJ1dHRvbkRpdi5wcmVwZW5kKCRob21ld29ya0J1dHRvbkRpdik7XHJcbiAgICAgICAgICAgIGlmKGtsYXNzLmluZGV4T2YoXCJqb19hY3RpdmVcIikgPj0gMCl7XHJcbiAgICAgICAgICAgICAgICAkaG9tZXdvcmtCdXR0b25EaXYub24oJ21vdXNlZG93bicsIChlKSA9PiBlLnN0b3BQcm9wYWdhdGlvbigpKTtcclxuICAgICAgICAgICAgICAgICRob21ld29ya0J1dHRvbkRpdi5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ET1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgaW5pdFdvcmtzcGFjZWxpc3RQYW5lbCgpIHtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLndvcmtzcGFjZUxpc3RQYW5lbCA9IG5ldyBBY2NvcmRpb25QYW5lbCh0aGlzLmFjY29yZGlvbiwgXCJXT1JLU1BBQ0VTXCIsIFwiMlwiLFxyXG4gICAgICAgICAgICBcImltZ19hZGQtd29ya3NwYWNlLWRhcmtcIiwgXCJOZXVlciBXb3Jrc3BhY2UuLi5cIiwgXCJ3b3Jrc3BhY2VcIiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLm5ld0VsZW1lbnRDYWxsYmFjayA9XHJcblxyXG4gICAgICAgICAgICAoYWNjb3JkaW9uRWxlbWVudCwgc3VjY2Vzc2Z1bE5ldHdvcmtDb21tdW5pY2F0aW9uQ2FsbGJhY2spID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgb3duZXJfaWQ6IG51bWJlciA9IHRoYXQubWFpbi51c2VyLmlkO1xyXG4gICAgICAgICAgICAgICAgaWYodGhhdC5tYWluLndvcmtzcGFjZXNPd25lcklkICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgICAgIG93bmVyX2lkID0gdGhhdC5tYWluLndvcmtzcGFjZXNPd25lcklkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCB3OiBXb3Jrc3BhY2UgPSBuZXcgV29ya3NwYWNlKGFjY29yZGlvbkVsZW1lbnQubmFtZSwgdGhhdC5tYWluLCBvd25lcl9pZCk7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lm1haW4ud29ya3NwYWNlTGlzdC5wdXNoKHcpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQubWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kQ3JlYXRlV29ya3NwYWNlKHcsIHRoYXQubWFpbi53b3Jrc3BhY2VzT3duZXJJZCwgKGVycm9yOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3IgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbGVMaXN0UGFuZWwuZW5hYmxlTmV3QnV0dG9uKHRydWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWNjZXNzZnVsTmV0d29ya0NvbW11bmljYXRpb25DYWxsYmFjayh3KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXRXb3Jrc3BhY2VBY3RpdmUodyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHcucmVuZGVyU3luY2hyb25pemVCdXR0b24oYWNjb3JkaW9uRWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0RlciBTZXJ2ZXIgaXN0IG5pY2h0IGVycmVpY2hiYXIhJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLndvcmtzcGFjZUxpc3RQYW5lbC5yZW5hbWVDYWxsYmFjayA9XHJcbiAgICAgICAgICAgICh3b3Jrc3BhY2U6IFdvcmtzcGFjZSwgbmV3TmFtZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBuZXdOYW1lID0gbmV3TmFtZS5zdWJzdHIoMCwgODApO1xyXG4gICAgICAgICAgICAgICAgd29ya3NwYWNlLm5hbWUgPSBuZXdOYW1lO1xyXG4gICAgICAgICAgICAgICAgd29ya3NwYWNlLnNhdmVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lm1haW4ubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBuZXdOYW1lO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLmRlbGV0ZUNhbGxiYWNrID1cclxuICAgICAgICAgICAgKHdvcmtzcGFjZTogV29ya3NwYWNlLCBzdWNjZXNzZnVsTmV0d29ya0NvbW11bmljYXRpb25DYWxsYmFjazogKCkgPT4gdm9pZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmREZWxldGVXb3Jrc3BhY2VPckZpbGUoXCJ3b3Jrc3BhY2VcIiwgd29ya3NwYWNlLmlkLCAoZXJyb3I6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5yZW1vdmVXb3Jrc3BhY2Uod29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlTGlzdFBhbmVsLmVuYWJsZU5ld0J1dHRvbih0aGF0Lm1haW4ud29ya3NwYWNlTGlzdC5sZW5ndGggPiAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc2Z1bE5ldHdvcmtDb21tdW5pY2F0aW9uQ2FsbGJhY2soKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRGVyIFNlcnZlciBpc3QgbmljaHQgZXJyZWljaGJhciEnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0UGFuZWwuc2VsZWN0Q2FsbGJhY2sgPVxyXG4gICAgICAgICAgICAod29ya3NwYWNlOiBXb3Jrc3BhY2UpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQubWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kVXBkYXRlcygoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXRXb3Jrc3BhY2VBY3RpdmUod29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGhvbWVBY3Rpb24gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJpbWdfaG9tZS1kYXJrIGpvX2J1dHRvbiBqb19hY3RpdmVcIiBzdHlsZT1cIm1hcmdpbi1yaWdodDogNHB4XCInICtcclxuICAgICAgICAgICAgJyB0aXRsZT1cIk1laW5lIGVpZ2VuZW4gV29ya3NwYWNlcyBhbnplaWdlblwiPicpO1xyXG4gICAgICAgIHRoaXMuJGhvbWVBY3Rpb24ub24oJ21vdXNlZG93bicsIChlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0aGF0Lm1haW4ubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5vbkhvbWVCdXR0b25DbGlja2VkKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhhdC5tYWluLmJvdHRvbURpdi5oaWRlSG9tZXdvcmtUYWIoKTtcclxuXHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0UGFuZWwuYWRkQWN0aW9uKHRoaXMuJGhvbWVBY3Rpb24pO1xyXG4gICAgICAgIHRoaXMuJGhvbWVBY3Rpb24uaGlkZSgpO1xyXG5cclxuICAgICAgICB0aGlzLndvcmtzcGFjZUxpc3RQYW5lbC5jb250ZXh0TWVudVByb3ZpZGVyID0gKHdvcmtzcGFjZUFjY29yZGlvbkVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBjbWlMaXN0OiBBY2NvcmRpb25Db250ZXh0TWVudUl0ZW1bXSA9IFtdO1xyXG5cclxuICAgICAgICAgICAgY21pTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGNhcHRpb246IFwiRHVwbGl6aWVyZW5cIixcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kRHVwbGljYXRlV29ya3NwYWNlKGVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3I6IHN0cmluZywgd29ya3NwYWNlRGF0YSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yID09IG51bGwgJiYgd29ya3NwYWNlRGF0YSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG5ld1dvcmtzcGFjZTogV29ya3NwYWNlID0gV29ya3NwYWNlLnJlc3RvcmVGcm9tRGF0YSh3b3Jrc3BhY2VEYXRhLCB0aGlzLm1haW4pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi53b3Jrc3BhY2VMaXN0LnB1c2gobmV3V29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdXb3Jrc3BhY2UucGFuZWxFbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBuZXdXb3Jrc3BhY2UubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXh0ZXJuYWxFbGVtZW50OiBuZXdXb3Jrc3BhY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGljb25DbGFzczogbmV3V29ya3NwYWNlLnJlcG9zaXRvcnlfaWQgPT0gbnVsbCA/ICd3b3Jrc3BhY2UnIDogJ3JlcG9zaXRvcnknXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0UGFuZWwuYWRkRWxlbWVudChuZXdXb3Jrc3BhY2UucGFuZWxFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLndvcmtzcGFjZUxpc3RQYW5lbC5zb3J0RWxlbWVudHMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnJvciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoaXMubWFpbi51c2VyLmlzX3RlYWNoZXIgJiYgdGhpcy5tYWluLnRlYWNoZXJFeHBsb3Jlci5jbGFzc1BhbmVsLmVsZW1lbnRzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICAgICAgY21pTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkFuIEtsYXNzZSBhdXN0ZWlsZW4uLi5cIixcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQpID0+IHsgfSxcclxuICAgICAgICAgICAgICAgICAgICBzdWJNZW51OiB0aGlzLm1haW4udGVhY2hlckV4cGxvcmVyLmNsYXNzUGFuZWwuZWxlbWVudHMubWFwKChhZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogYWUubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBrbGFzc2UgPSA8YW55PmFlLmV4dGVybmFsRWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHdvcmtzcGFjZTogV29ya3NwYWNlID0gZWxlbWVudC5leHRlcm5hbEVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kRGlzdHJpYnV0ZVdvcmtzcGFjZSh3b3Jrc3BhY2UsIGtsYXNzZSwgbnVsbCwgKGVycm9yOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBuZXR3b3JrTWFuYWdlciA9IHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlcjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBkdCA9IG5ldHdvcmtNYW5hZ2VyLnVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcyAqIG5ldHdvcmtNYW5hZ2VyLmZvcmNlZFVwZGF0ZUV2ZXJ5O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoXCJEZXIgV29ya3NwYWNlIFwiICsgd29ya3NwYWNlLm5hbWUgKyBcIiB3dXJkZSBhbiBkaWUgS2xhc3NlIFwiICsga2xhc3NlLm5hbWUgKyBcIiBhdXNnZXRlaWx0LiBFciB3aXJkIGluIG1heGltYWwgXCIgKyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZHQgKyBcIiBzIGJlaSBqZWRlbSBTY2jDvGxlciBhbmtvbW1lbi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkFuIGVpbnplbG5lIFNjaMO8bGVyL2lubmVuIGF1c3RlaWxlbi4uLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4geyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGNsYXNzZXM6IENsYXNzRGF0YVtdID0gdGhpcy5tYWluLnRlYWNoZXJFeHBsb3Jlci5jbGFzc1BhbmVsLmVsZW1lbnRzLm1hcChhZSA9PiBhZS5leHRlcm5hbEVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgd29ya3NwYWNlOiBXb3Jrc3BhY2UgPSBlbGVtZW50LmV4dGVybmFsRWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IERpc3RyaWJ1dGVUb1N0dWRlbnRzRGlhbG9nKGNsYXNzZXMsIHdvcmtzcGFjZSwgdGhpcy5tYWluKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5tYWluLnJlcG9zaXRvcnlPbiAmJiB0aGlzLm1haW4ud29ya3NwYWNlc093bmVySWQgPT0gdGhpcy5tYWluLnVzZXIuaWQpIHtcclxuICAgICAgICAgICAgICAgIGlmICh3b3Jrc3BhY2VBY2NvcmRpb25FbGVtZW50LmV4dGVybmFsRWxlbWVudC5yZXBvc2l0b3J5X2lkID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBjbWlMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlJlcG9zaXRvcnkgYW5sZWdlbi4uLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQpID0+IHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgd29ya3NwYWNlOiBXb3Jrc3BhY2UgPSBlbGVtZW50LmV4dGVybmFsRWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIuc2hvdyh3b3Jrc3BhY2UpO1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViTWVudTogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gW3sgbjogMCwgdGV4dDogXCJudXIgcHJpdmF0IHNpY2h0YmFyXCIgfSwgeyBuOiAxLCB0ZXh0OiBcInNpY2h0YmFyIGbDvHIgZGllIEtsYXNzZVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHsgbjogMiwgdGV4dDogXCJzaWNodGJhciBmw7xyIGRpZSBTY2h1bGVcIiB9XS5tYXAoKGspID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgY2FwdGlvbjogay50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgICAgIGNhbGxiYWNrOiAoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4ge1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoaXMubWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kQ3JlYXRlUmVwb3NpdG9yeSh3b3Jrc3BhY2UsIGsubiwgKGVycm9yOiBzdHJpbmcsIHJlcG9zaXRvcnlfaWQ/OiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlmIChlcnJvciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0UGFuZWwuc2V0RWxlbWVudENsYXNzKGVsZW1lbnQsIFwicmVwb3NpdG9yeVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICB3b3Jrc3BhY2UucmVuZGVyU3luY2hyb25pemVCdXR0b24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgICAgICB0aGlzLnNob3dSZXBvc2l0b3J5QnV0dG9uSWZOZWVkZWQod29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgYWxlcnQoZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBjbWlMaXN0LnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIk1pdCBSZXBvc2l0b3J5IHN5bmNocm9uaXNpZXJlblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB3b3Jrc3BhY2U6IFdvcmtzcGFjZSA9IGVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya3NwYWNlLnN5bmNocm9uaXplV2l0aFJlcG9zaXRvcnkoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNtaUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiVm9tIFJlcG9zaXRvcnkgbG9zbMO2c2VuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBcIiNmZjgwODBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IChlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgd29ya3NwYWNlOiBXb3Jrc3BhY2UgPSBlbGVtZW50LmV4dGVybmFsRWxlbWVudDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtzcGFjZS5yZXBvc2l0b3J5X2lkID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdvcmtzcGFjZS5zYXZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmRVcGRhdGVzKCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LndvcmtzcGFjZUxpc3RQYW5lbC5zZXRFbGVtZW50Q2xhc3MoZWxlbWVudCwgXCJ3b3Jrc3BhY2VcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd29ya3NwYWNlLnJlbmRlclN5bmNocm9uaXplQnV0dG9uKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIGNtaUxpc3Q7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbkhvbWVCdXR0b25DbGlja2VkKCkge1xyXG4gICAgICAgIHRoaXMubWFpbi50ZWFjaGVyRXhwbG9yZXIucmVzdG9yZU93bldvcmtzcGFjZXMoKTtcclxuICAgICAgICB0aGlzLm1haW4ubmV0d29ya01hbmFnZXIudXBkYXRlRnJlcXVlbmN5SW5TZWNvbmRzID0gdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyLm93blVwZGF0ZUZyZXF1ZW5jeUluU2Vjb25kcztcclxuICAgICAgICB0aGlzLiRob21lQWN0aW9uLmhpZGUoKTtcclxuICAgICAgICB0aGlzLmZpbGVMaXN0UGFuZWwuZW5hYmxlTmV3QnV0dG9uKHRoaXMubWFpbi53b3Jrc3BhY2VMaXN0Lmxlbmd0aCA+IDApO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlckZpbGVzKHdvcmtzcGFjZTogV29ya3NwYWNlKSB7XHJcblxyXG4gICAgICAgIGxldCBuYW1lID0gd29ya3NwYWNlID09IG51bGwgPyBcIktlaW4gV29ya3NwYWNlIHZvcmhhbmRlblwiIDogd29ya3NwYWNlLm5hbWU7XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5zZXRDYXB0aW9uKG5hbWUpO1xyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5jbGVhcigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IG1vZHVsZSBvZiB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBtb2R1bGUuZmlsZS5wYW5lbEVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAod29ya3NwYWNlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IG1vZHVsZUxpc3Q6IE1vZHVsZVtdID0gW107XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBtIG9mIHdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlTGlzdC5wdXNoKG0pO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBtb2R1bGVMaXN0LnNvcnQoKGEsIGIpID0+IHsgcmV0dXJuIGEuZmlsZS5uYW1lID4gYi5maWxlLm5hbWUgPyAxIDogYS5maWxlLm5hbWUgPCBiLmZpbGUubmFtZSA/IC0xIDogMCB9KTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IG0gb2YgbW9kdWxlTGlzdCkge1xyXG5cclxuICAgICAgICAgICAgICAgIG0uZmlsZS5wYW5lbEVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogbS5maWxlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZXh0ZXJuYWxFbGVtZW50OiBtXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5hZGRFbGVtZW50KG0uZmlsZS5wYW5lbEVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXJIb21ld29ya0J1dHRvbihtLmZpbGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmZpbGVMaXN0UGFuZWwuc29ydEVsZW1lbnRzKCk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJXb3Jrc3BhY2VzKHdvcmtzcGFjZUxpc3Q6IFdvcmtzcGFjZVtdKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLmNsZWFyKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHcgb2Ygd29ya3NwYWNlTGlzdCkge1xyXG4gICAgICAgICAgICB3LnBhbmVsRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHcubmFtZSxcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsRWxlbWVudDogdyxcclxuICAgICAgICAgICAgICAgIGljb25DbGFzczogdy5yZXBvc2l0b3J5X2lkID09IG51bGwgPyAnd29ya3NwYWNlJyA6ICdyZXBvc2l0b3J5J1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0UGFuZWwuYWRkRWxlbWVudCh3LnBhbmVsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICB3LnJlbmRlclN5bmNocm9uaXplQnV0dG9uKHcucGFuZWxFbGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLnNvcnRFbGVtZW50cygpO1xyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5lbmFibGVOZXdCdXR0b24od29ya3NwYWNlTGlzdC5sZW5ndGggPiAwKTtcclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW5kZXJFcnJvckNvdW50KHdvcmtzcGFjZTogV29ya3NwYWNlLCBlcnJvckNvdW50TWFwOiBNYXA8TW9kdWxlLCBudW1iZXI+KSB7XHJcbiAgICAgICAgaWYgKGVycm9yQ291bnRNYXAgPT0gbnVsbCkgcmV0dXJuO1xyXG4gICAgICAgIGZvciAobGV0IG0gb2Ygd29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgIGxldCBlcnJvckNvdW50OiBudW1iZXIgPSBlcnJvckNvdW50TWFwLmdldChtKTtcclxuICAgICAgICAgICAgbGV0IGVycm9yQ291bnRTOiBzdHJpbmcgPSAoKGVycm9yQ291bnQgPT0gbnVsbCB8fCBlcnJvckNvdW50ID09IDApID8gXCJcIiA6IFwiKFwiICsgZXJyb3JDb3VudCArIFwiKVwiKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5zZXRUZXh0QWZ0ZXJGaWxlbmFtZShtLmZpbGUucGFuZWxFbGVtZW50LCBlcnJvckNvdW50UywgJ2pvX2Vycm9yY291bnQnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd1JlcG9zaXRvcnlCdXR0b25JZk5lZWRlZCh3OiBXb3Jrc3BhY2Upe1xyXG4gICAgICAgIGlmKHcucmVwb3NpdG9yeV9pZCAhPSBudWxsICYmIHcub3duZXJfaWQgPT0gdGhpcy5tYWluLnVzZXIuaWQpe1xyXG4gICAgICAgICAgICB0aGlzLiRzeW5jaHJvbml6ZUFjdGlvbi5zaG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMubWFpbi51c2VyLnNldHRpbmdzLmhlbHBlckhpc3RvcnkucmVwb3NpdG9yeUJ1dHRvbkRvbmUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBIZWxwZXIuc2hvd0hlbHBlcihcInJlcG9zaXRvcnlCdXR0b25cIiwgdGhpcy5tYWluLCB0aGlzLiRzeW5jaHJvbml6ZUFjdGlvbik7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kc3luY2hyb25pemVBY3Rpb24uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRXb3Jrc3BhY2VBY3RpdmUodzogV29ya3NwYWNlLCBzY3JvbGxJbnRvVmlldzogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLnNlbGVjdCh3LCBmYWxzZSwgc2Nyb2xsSW50b1ZpZXcpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYWluLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUucnVubmluZykge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uaW50ZXJwcmV0ZXIuc3RvcCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tYWluLmN1cnJlbnRXb3Jrc3BhY2UgPSB3O1xyXG4gICAgICAgIHRoaXMucmVuZGVyRmlsZXModyk7XHJcblxyXG4gICAgICAgIGlmICh3ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IG5vblN5c3RlbU1vZHVsZXMgPSB3Lm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHcuY3VycmVudGx5T3Blbk1vZHVsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldE1vZHVsZUFjdGl2ZSh3LmN1cnJlbnRseU9wZW5Nb2R1bGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKG5vblN5c3RlbU1vZHVsZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRNb2R1bGVBY3RpdmUobm9uU3lzdGVtTW9kdWxlc1swXSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldE1vZHVsZUFjdGl2ZShudWxsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBub25TeXN0ZW1Nb2R1bGVzKSB7XHJcbiAgICAgICAgICAgICAgICBtLmZpbGUuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAobm9uU3lzdGVtTW9kdWxlcy5sZW5ndGggPT0gMCAmJiAhdGhpcy5tYWluLnVzZXIuc2V0dGluZ3MuaGVscGVySGlzdG9yeS5uZXdGaWxlSGVscGVyRG9uZSkge1xyXG5cclxuICAgICAgICAgICAgICAgIEhlbHBlci5zaG93SGVscGVyKFwibmV3RmlsZUhlbHBlclwiLCB0aGlzLm1haW4sIHRoaXMuZmlsZUxpc3RQYW5lbC4kY2FwdGlvbkVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zaG93UmVwb3NpdG9yeUJ1dHRvbklmTmVlZGVkKHcpO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNldE1vZHVsZUFjdGl2ZShudWxsKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICB3cml0ZUVkaXRvclRleHRUb0ZpbGUoKSB7XHJcbiAgICAgICAgbGV0IGNlbSA9IHRoaXMuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICAgICAgaWYgKGNlbSAhPSBudWxsKVxyXG4gICAgICAgICAgICBjZW0uZmlsZS50ZXh0ID0gY2VtLmdldFByb2dyYW1UZXh0RnJvbU1vbmFjb01vZGVsKCk7IC8vIDI5LjAzLiB0aGlzLm1haW4ubW9uYWNvLmdldFZhbHVlKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGxhc3RPcGVuTW9kdWxlOiBNb2R1bGUgPSBudWxsO1xyXG4gICAgc2V0TW9kdWxlQWN0aXZlKG06IE1vZHVsZSkge1xyXG5cclxuICAgICAgICB0aGlzLm1haW4uYm90dG9tRGl2LmhvbWV3b3JrTWFuYWdlci5oaWRlUmV2aXNpb24oKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubGFzdE9wZW5Nb2R1bGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmxhc3RPcGVuTW9kdWxlLmdldEJyZWFrcG9pbnRQb3NpdGlvbnNGcm9tRWRpdG9yKCk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdE9wZW5Nb2R1bGUuZmlsZS50ZXh0ID0gdGhpcy5sYXN0T3Blbk1vZHVsZS5nZXRQcm9ncmFtVGV4dEZyb21Nb25hY29Nb2RlbCgpOyAvLyB0aGlzLm1haW4ubW9uYWNvLmdldFZhbHVlKCk7XHJcbiAgICAgICAgICAgIHRoaXMubGFzdE9wZW5Nb2R1bGUuZWRpdG9yU3RhdGUgPSB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuc2F2ZVZpZXdTdGF0ZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG0gPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuc2V0TW9kZWwobW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIktlaW5lIERhdGVpIHZvcmhhbmRlbi5cIiwgXCJ0ZXh0XCIpKTtcclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogdHJ1ZSB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnNldE1vZGVsKG0ubW9kZWwpO1xyXG4gICAgICAgICAgICBpZih0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCkgIT0gbnVsbCkgdGhpcy5tYWluLmdldEJvdHRvbURpdigpLmVycm9yTWFuYWdlci5zaG93UGFyZW50aGVzaXNXYXJuaW5nKG0uYnJhY2tldEVycm9yKTtcclxuXHJcbiAgICAgICAgICAgIGlmKG0uZmlsZS50ZXh0X2JlZm9yZV9yZXZpc2lvbiAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5ib3R0b21EaXYuaG9tZXdvcmtNYW5hZ2VyLnNob3dIb21lV29ya1JldmlzaW9uQnV0dG9uKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4uYm90dG9tRGl2LmhvbWV3b3JrTWFuYWdlci5oaWRlSG9tZXdvcmtSZXZpc2lvbkJ1dHRvbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0QWN0aXZlQWZ0ZXJFeHRlcm5hbE1vZGVsU2V0KG06IE1vZHVsZSkge1xyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC5zZWxlY3QobSwgZmFsc2UpO1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RPcGVuTW9kdWxlID0gbTtcclxuXHJcbiAgICAgICAgaWYgKG0uZWRpdG9yU3RhdGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uZWRpdG9yLmRvbnRQdXNoTmV4dEN1cnNvck1vdmUrKztcclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnJlc3RvcmVWaWV3U3RhdGUobS5lZGl0b3JTdGF0ZSk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi5lZGl0b3IuZG9udFB1c2hOZXh0Q3Vyc29yTW92ZS0tO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbS5yZW5kZXJCcmVha3BvaW50RGVjb3JhdG9ycygpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEN1cnJlbnRseUVkaXRlZE1vZHVsZShtKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXIoKTtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLmdldE9wdGlvbnMoKS5nZXQobW9uYWNvLmVkaXRvci5FZGl0b3JPcHRpb24ucmVhZE9ubHkpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuZm9jdXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDMwMCk7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwcml2YXRlIHNob3dQcm9ncmFtUG9pbnRlcigpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucHJvZ3JhbVBvaW50ZXJNb2R1bGUgPT0gdGhpcy5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKSAmJiB0aGlzLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IHBvc2l0aW9uID0gdGhpcy5wcm9ncmFtUG9pbnRlclBvc2l0aW9uO1xyXG4gICAgICAgICAgICBsZXQgcmFuZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uLCBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICBlbmRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbiArIHBvc2l0aW9uLmxlbmd0aCwgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnJldmVhbFJhbmdlSW5DZW50ZXJJZk91dHNpZGVWaWV3cG9ydChyYW5nZSk7XHJcbiAgICAgICAgICAgIHRoaXMucHJvZ3JhbVBvaW50ZXJEZWNvcmF0aW9uID0gdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLmRlbHRhRGVjb3JhdGlvbnModGhpcy5wcm9ncmFtUG9pbnRlckRlY29yYXRpb24sIFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU6ICdqb19yZXZlYWxQcm9ncmFtUG9pbnRlcicsIGlzV2hvbGVMaW5lOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvdmVydmlld1J1bGVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjNmZkNjFiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbW9uYWNvLmVkaXRvci5PdmVydmlld1J1bGVyTGFuZS5DZW50ZXJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluaW1hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiIzZmZDYxYlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG1vbmFjby5lZGl0b3IuTWluaW1hcFBvc2l0aW9uLklubGluZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2UsXHJcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9uczogeyBiZWZvcmVDb250ZW50Q2xhc3NOYW1lOiAnam9fcmV2ZWFsUHJvZ3JhbVBvaW50ZXJCZWZvcmUnIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzaG93UHJvZ3JhbVBvaW50ZXJQb3NpdGlvbihmaWxlOiBGaWxlLCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uKSB7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUgc3RhdGVtZW50IGV4ZWN1dGlvbjpcclxuICAgICAgICBpZiAoZmlsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGUgPSB0aGlzLm1haW4uY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5maW5kTW9kdWxlQnlGaWxlKGZpbGUpO1xyXG4gICAgICAgIGlmIChtb2R1bGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnByb2dyYW1Qb2ludGVyTW9kdWxlID0gbW9kdWxlO1xyXG4gICAgICAgIHRoaXMucHJvZ3JhbVBvaW50ZXJQb3NpdGlvbiA9IHBvc2l0aW9uO1xyXG5cclxuICAgICAgICBpZiAobW9kdWxlICE9IHRoaXMuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRNb2R1bGVBY3RpdmUobW9kdWxlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNob3dQcm9ncmFtUG9pbnRlcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaGlkZVByb2dyYW1Qb2ludGVyUG9zaXRpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkgPT0gdGhpcy5wcm9ncmFtUG9pbnRlck1vZHVsZSkge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuZGVsdGFEZWNvcmF0aW9ucyh0aGlzLnByb2dyYW1Qb2ludGVyRGVjb3JhdGlvbiwgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnByb2dyYW1Qb2ludGVyTW9kdWxlID0gbnVsbDtcclxuICAgICAgICB0aGlzLnByb2dyYW1Qb2ludGVyRGVjb3JhdGlvbiA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpOiBNb2R1bGUge1xyXG4gICAgICAgIGxldCB3cyA9IHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlO1xyXG4gICAgICAgIGlmICh3cyA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgcmV0dXJuIHdzLmN1cnJlbnRseU9wZW5Nb2R1bGU7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKG06IE1vZHVsZSkge1xyXG4gICAgICAgIGlmIChtID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBsZXQgd3MgPSB0aGlzLm1haW4uY3VycmVudFdvcmtzcGFjZTtcclxuICAgICAgICBpZiAod3MuY3VycmVudGx5T3Blbk1vZHVsZSAhPSBtKSB7XHJcbiAgICAgICAgICAgIHdzLmN1cnJlbnRseU9wZW5Nb2R1bGUgPSBtO1xyXG4gICAgICAgICAgICB3cy5zYXZlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBtLmZpbGUuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRFeHBsb3JlckNvbG9yKGNvbG9yOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgY2FwdGlvbjogc3RyaW5nO1xyXG5cclxuICAgICAgICBpZiAoY29sb3IgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb2xvciA9IFwidHJhbnNwYXJlbnRcIjtcclxuICAgICAgICAgICAgY2FwdGlvbiA9IFwiTWVpbmUgV09SS1NQQUNFU1wiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhcHRpb24gPSBcIlNjaMO8bGVyLVdPUktTUEFDRVNcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUxpc3RQYW5lbC4kbGlzdEVsZW1lbnQucGFyZW50KCkuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgY29sb3IpO1xyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLiRsaXN0RWxlbWVudC5wYXJlbnQoKS5jc3MoJ2JhY2tncm91bmQtY29sb3InLCBjb2xvcik7XHJcblxyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdFBhbmVsLnNldENhcHRpb24oY2FwdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TmV3TW9kdWxlKGZpbGU6IEZpbGUpOiBNb2R1bGUge1xyXG4gICAgICAgIHJldHVybiBuZXcgTW9kdWxlKGZpbGUsIHRoaXMubWFpbik7XHJcbiAgICB9XHJcblxyXG59Il19