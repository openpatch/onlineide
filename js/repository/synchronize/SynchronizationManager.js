import { ajax } from "../../communication/AjaxHelper.js";
import { EmbeddedSlider } from "../../embedded/EmbeddedSlider.js";
import { makeDiv } from "../../tools/HtmlTools.js";
import { HistoryElement } from "./HistoryElement.js";
import { RepositoryTool } from "./RepositoryTool.js";
import { SynchronizationListElement } from "./SynchronizationListElement.js";
import { SynchroWorkspace } from "./SynchroWorkspace.js";
export class SynchronizationManager {
    constructor(main) {
        this.main = main;
        this.$fileListHeaderDivs = [];
        this.$fileListDivs = [];
        this.guiReady = false;
        this.synchronizationListElements = [];
        this.historyElements = [];
    }
    synchronizeWithWorkspace(workspace) {
        this.gainRepositoryLock(workspace.repository_id, (success) => {
            if (success) {
                this.attachToWorkspaceAndRepository(workspace);
                this.show();
                this.timer = setInterval(() => {
                    this.gainRepositoryLock(this.currentRepository.id, (success) => {
                        if (!success) {
                            alert('Der Server ist temporär nicht erreichbar.');
                            window.history.back();
                        }
                    });
                }, 10000);
            }
        });
    }
    gainRepositoryLock(repository_id, callback) {
        let request = { repository_id: repository_id };
        ajax('gainRepositoryLock', request, (response) => {
            callback(response.success);
            // console.log("Lock for repository_id " + repository_id + " has been granted.")
        }, (message) => {
            alert(message);
            callback(false);
        });
    }
    attachToWorkspaceAndRepository(workspace) {
        this.currentUserSynchroWorkspace = new SynchroWorkspace(this).copyFromWorkspace(workspace);
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;
        let that = this;
        let request = { repository_id: workspace.repository_id, workspace_id: workspace.id };
        ajax("getRepository", request, (response) => {
            that.attachToRepository(response.repository);
        }, (message) => {
            alert(message);
            window.history.back();
        });
    }
    attachToRepository(repository) {
        this.currentRepository = repository;
        RepositoryTool.deserializeRepository(this.currentRepository);
        this.currentRepositorySynchroWorkspace = new SynchroWorkspace(this).copyFromRepository(this.currentRepository, true);
        this.rightSynchroWorkspace = this.currentRepositorySynchroWorkspace;
        this.setupSynchronizationListElements();
        this.setupHistoryElements();
    }
    setupHistoryElements() {
        this.$historyScrollDiv.empty();
        this.historyElements = [];
        this.lastShownHistoryElement = null;
        this.currentRepository.historyEntries.forEach((he, index) => {
            this.historyElements.push(new HistoryElement(this, this.currentRepository, he, index));
        });
    }
    setupSynchronizationListElements() {
        let lastSynchroFileLeft = null;
        let lastSynchroFileRight = null;
        if (this.lastShownSynchronizationElement != null) {
            lastSynchroFileLeft = this.lastShownSynchronizationElement.leftSynchroFile;
            lastSynchroFileRight = this.lastShownSynchronizationElement.rightSynchroFile;
        }
        this.$fileListDivs.forEach($div => $div.empty());
        this.synchronizationListElements.forEach(se => se.emptyGUI());
        this.synchronizationListElements = [];
        this.lastShownSynchronizationElement = null;
        let fileElements = [];
        let synchroFileMap = {};
        this.leftSynchroWorkspace.files.forEach(sfile => {
            let fileElement = {
                id: sfile.idInsideRepository,
                name: sfile.name,
                leftSynchroFile: sfile,
                rightSynchroFile: null
            };
            fileElements.push(fileElement);
            if (sfile.idInsideRepository != null) {
                synchroFileMap[sfile.idInsideRepository] = fileElement;
            }
        });
        this.rightSynchroWorkspace.files.forEach(sfile => {
            let fileElement = null;
            if (sfile.idInsideRepository != null)
                fileElement = synchroFileMap[sfile.idInsideRepository];
            if (fileElement == null) {
                fileElement = {
                    id: sfile.idInsideRepository,
                    name: sfile.name,
                    leftSynchroFile: null,
                    rightSynchroFile: sfile
                };
                fileElements.push(fileElement);
            }
            else {
                fileElement.rightSynchroFile = sfile;
            }
        });
        fileElements.sort((fe1, fe2) => fe1.name.localeCompare(fe2.name));
        fileElements.forEach(fe => {
            let synchroListElement = new SynchronizationListElement(this, fe.leftSynchroFile, fe.rightSynchroFile, this.leftSynchroWorkspace, this.rightSynchroWorkspace);
            this.synchronizationListElements.push(synchroListElement);
            synchroListElement.compareFilesAndAdaptGUI();
        });
        this.diffEditor.setModel({
            original: monaco.editor.createModel("Wählen Sie oben eine Datei aus!", "myJava"),
            modified: monaco.editor.createModel("Wählen Sie oben eine Datei aus!", "myJava")
        });
        this.diffEditor.updateOptions({
            originalEditable: false
        });
        if (this.leftSynchroWorkspace == this.currentUserSynchroWorkspace) {
            this.setHeader("left", "Dein Workspace:");
            this.$backToWorkspaceButton.hide();
        }
        else {
            this.setHeader("left", this.leftSynchroWorkspace.name + ":");
            this.$backToWorkspaceButton.show();
            this.$writeWorkspaceChangesButton.hide();
        }
        if (this.rightSynchroWorkspace == this.currentRepositorySynchroWorkspace) {
            let writable = this.currentUserSynchroWorkspace.copiedFromWorkspace.has_write_permission_to_repository ? ", mit Schreibzugriff" : ", ohne Schreibzugriff";
            this.setHeader("right", "Repository (aktuelle Version" + writable + "):");
            this.$backToCurrentRepositoryVersionButton.hide();
        }
        else {
            this.setHeader("right", this.rightSynchroWorkspace.name + ":");
            this.$backToCurrentRepositoryVersionButton.show();
            this.$writeRepositoryChangesButton.hide();
        }
        jQuery('#jo_synchro_main_heading_text').text(`Synchronisieren mit Repository "${this.currentRepository.name}"`);
        let lastFileSelected = false;
        if (lastSynchroFileLeft != null || lastSynchroFileRight != null) {
            for (let sle of this.synchronizationListElements) {
                if (sle.leftSynchroFile != null && sle.leftSynchroFile == lastSynchroFileLeft ||
                    sle.rightSynchroFile != null && sle.rightSynchroFile == lastSynchroFileRight) {
                    sle.select();
                    lastFileSelected = true;
                    break;
                }
            }
        }
        if (!lastFileSelected && this.synchronizationListElements.length > 0) {
            this.synchronizationListElements[0].select();
        }
    }
    show() {
        if (!this.guiReady) {
            this.initGUI();
        }
        let $synchroDiv = jQuery('#synchronize-div');
        $synchroDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');
        this.$writeWorkspaceChangesButton.hide();
        this.$writeRepositoryChangesButton.hide();
        let that = this;
        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });
    }
    hide() {
        let $synchroDiv = jQuery('#synchronize-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
        clearInterval(this.timer);
        let request = { repository_id: this.currentRepository.id };
        ajax('leaseRepositoryLock', request, (response) => {
            // console.log("Lock for repository_id " + request.repository_id + " has been released.")
        }, (message) => {
        });
    }
    initGUI() {
        this.guiReady = true;
        let $synchroDiv = jQuery('#synchronize-div');
        let that = this;
        $synchroDiv.append(this.$mainHeadingDiv = jQuery('<div id="jo_synchro_main_heading"><span id="jo_synchro_main_heading_text">Java-Online: Workspace mit Repository synchronisieren</span></div>'), this.$belowMainHeadingDiv = makeDiv("jo_synchro_below_main_heading"));
        let $buttonsTopRightDiv = makeDiv("jo_synchro_buttonsTopRight");
        this.$mainHeadingDiv.append($buttonsTopRightDiv);
        $buttonsTopRightDiv.append(this.$exitButton = jQuery('<div id="jo_synchro_exitButton" class="jo_synchro_button">Zurück zum Programmieren</div>'));
        this.$exitButton.on('click', () => {
            window.history.back();
        });
        this.$leftDiv = makeDiv("jo_synchro_leftDiv");
        this.$historyOuterDiv = makeDiv("jo_synchro_historyOuterDiv");
        this.$historyOuterDiv.append(jQuery('<div id="jo_synchro_historyHeader"><div class="jo_synchro_tabHeading">History:</div></div>)'));
        this.$belowMainHeadingDiv.append(this.$leftDiv, this.$historyOuterDiv);
        new EmbeddedSlider(this.$historyOuterDiv, true, false, () => { this.diffEditor.layout(); }).$sliderDiv.css('left', '-3px');
        this.$historyOuterDiv.find('.joe_slider').css('position', 'absolute');
        this.$historyScrollDiv = makeDiv("historyScrollDiv", "jo_srollable");
        this.$historyOuterDiv.append(this.$historyScrollDiv);
        this.$leftDiv.append(this.$leftUpperDiv = makeDiv("jo_synchro_leftUpper"), this.$editorDiv = makeDiv("jo_synchro_editor"));
        this.$leftUpperDiv.append(this.$fileListHeaderOuterDiv = makeDiv("jo_synchro_fileListHeaderOuter"), this.$fileListOuterDiv = makeDiv("jo_synchro_fileListOuter", "jo_scrollable"), this.$fileListFooterDiv = makeDiv("jo_synchro_fileListFooter"));
        this.$fileListHeaderContainerRight = makeDiv(null, "jo_synchro_fileListHeaderContainerRight");
        let fileListHeaderRight = makeDiv(null, "jo_synchro_fileListHeader");
        this.$fileListHeaderContainerRight.append(fileListHeaderRight);
        let $fileListHeaderCenter = makeDiv(null, "jo_synchro_fileListHeaderCenter");
        $fileListHeaderCenter.append(this.$updateAllButton = SynchronizationListElement.makeButton("updateAll", "left", () => { that.updateAll(); }));
        $fileListHeaderCenter.append(this.$commitAllButton = SynchronizationListElement.makeButton("commitAll", "right", () => { that.commitAll(); }));
        this.$fileListHeaderDivs.push(makeDiv(null, "jo_synchro_fileListHeader", "", { "flex": "2 0" }), $fileListHeaderCenter, this.$fileListHeaderContainerRight, makeDiv(null, "jo_synchro_scrollbarPlaceholder"));
        this.$fileListDivs.push(makeDiv(null, "jo_synchro_fileList"), makeDiv(null, "jo_synchro_fileListButtonsLeft"), makeDiv(null, "jo_synchro_fileListButtonsRight"), makeDiv(null, "jo_synchro_fileList"));
        this.$fileListHeaderOuterDiv.append(this.$fileListHeaderDivs);
        this.$fileListOuterDiv.append(this.$fileListDivs);
        this.$fileListHeaderDivs[0].append("<div class='jo_synchro_tabHeading'>Dein Workspace:</div>");
        fileListHeaderRight.append("<div class='jo_synchro_tabHeading'>Repository (aktuelle Version):</div>");
        this.$fileListHeaderDivs[0].append(this.$backToWorkspaceButton = jQuery('<div class="jo_synchro_button jo_synchro_backToButton">Zeige eigenen Workspace</div>'));
        this.$backToWorkspaceButton.on('click', () => {
            that.backToWorkspace();
        });
        this.$backToWorkspaceButton.hide();
        fileListHeaderRight.append(this.$backToCurrentRepositoryVersionButton = jQuery('<div class="jo_synchro_button jo_synchro_backToButton">Zeige aktuelle Repository-Version</div>'));
        this.$backToCurrentRepositoryVersionButton.on('click', () => {
            that.backToCurrentRepositoryVersion();
        });
        this.$backToWorkspaceButton.hide();
        this.$fileListHeaderDivs[0].append(this.$writeWorkspaceChangesButton = jQuery('<div id="jo_synchro_writeChangesButton" class="jo_synchro_button">Änderungen am Workspace (rot!) speichern</div>'));
        this.$writeWorkspaceChangesButton.on('click', () => {
            that.writeWorkspaceChanges();
        });
        this.$writeWorkspaceChangesButton.hide();
        fileListHeaderRight.append(this.$writeRepositoryChangesButton = jQuery('<div id="jo_synchro_writeChangesButton" class="jo_synchro_button">Änderungen am Repository (rot!) speichern</div>'));
        this.$writeRepositoryChangesButton.on('click', () => {
            that.writeRepositoryChanges();
        });
        this.$writeRepositoryChangesButton.hide();
        let horizontalSlider = new EmbeddedSlider(this.$editorDiv, true, true, () => { this.diffEditor.layout(); });
        horizontalSlider.setColor('var(--slider)');
        this.makeDroppable("left", this.$fileListDivs[0]);
        this.makeDroppable("right", this.$fileListDivs[3]);
        this.initEditor();
    }
    backToWorkspace() {
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;
        this.setupSynchronizationListElements();
        this.onContentChanged("left");
    }
    backToCurrentRepositoryVersion() {
        this.rightSynchroWorkspace = this.currentRepositorySynchroWorkspace;
        this.setupSynchronizationListElements();
        this.onContentChanged("right");
    }
    makeDroppable(leftRight, $dropZoneDiv) {
        let that = this;
        $dropZoneDiv.on("dragover", (e) => {
            $dropZoneDiv.addClass('jo_synchro_dragZone');
            e.preventDefault();
        });
        $dropZoneDiv.on("dragleave", () => {
            $dropZoneDiv.removeClass('jo_synchro_dragZone');
        });
        $dropZoneDiv.on("drop", (e) => {
            let sw = new SynchroWorkspace(that).copyFromHistoryElement(HistoryElement.currentlyDragged);
            switch (leftRight) {
                case "left":
                    that.leftSynchroWorkspace = sw;
                    break;
                case "right":
                    that.rightSynchroWorkspace = sw;
                    break;
            }
            that.setupSynchronizationListElements();
            $dropZoneDiv.removeClass('jo_synchro_dragZone');
        });
    }
    setHeader(leftRight, caption) {
        let index = leftRight == "left" ? 0 : 2;
        this.$fileListHeaderDivs[index].find('.jo_synchro_tabHeading').text(caption);
    }
    writeRepositoryChanges() {
        let that = this;
        this.$writeRepositoryChangesButton.hide();
        let $dialogDiv = makeDiv("", "jo_synchro_commitDialogDiv");
        $dialogDiv.hide();
        this.$fileListHeaderContainerRight.append($dialogDiv);
        $dialogDiv.append(makeDiv("", "jo_synchro_commitDialogCaption", "Bitte beschreibe kurz die vorgenommenen Änderungen am Repository:"));
        let $dialogTextarea = jQuery('<textarea class="jo_synchro_commitDialogTextarea"></textarea>');
        $dialogDiv.append($dialogTextarea);
        let $dialogButtonDiv = makeDiv("", "jo_synchro_commitDialogButtonDiv");
        $dialogDiv.append($dialogButtonDiv);
        let $buttonCancel = makeDiv("", "jo_synchro_button", "Abbrechen", { "background-color": "var(--updateButtonBackground)", "color": "var(--updateButtonColor)" });
        $dialogButtonDiv.append($buttonCancel);
        $buttonCancel.on("click", () => {
            $dialogDiv.remove();
            that.$writeRepositoryChangesButton.show();
        });
        let $buttonOK = makeDiv("", "jo_synchro_button", "OK", { "background-color": "var(--createButtonBackground)", "color": "var(--createButtonColor)" });
        $dialogButtonDiv.append($buttonOK);
        $dialogDiv.show(600);
        $buttonOK.on("click", () => {
            let comment = $dialogTextarea.val();
            $dialogDiv.remove();
            this.currentRepositorySynchroWorkspace.commit(this.currentUserSynchroWorkspace.copiedFromWorkspace, this.currentRepository, comment, this.main, (repository, errorMessage) => {
                if (errorMessage != null) {
                    alert(errorMessage);
                    this.attachToWorkspaceAndRepository(this.currentRepositorySynchroWorkspace.copiedFromWorkspace);
                }
                else {
                    this.attachToRepository(repository);
                    this.$writeRepositoryChangesButton.hide();
                }
            });
        });
    }
    writeWorkspaceChanges() {
        this.currentUserSynchroWorkspace.writeChangesToWorkspace();
        this.currentUserSynchroWorkspace = new SynchroWorkspace(this).copyFromWorkspace(this.currentUserSynchroWorkspace.copiedFromWorkspace);
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;
        this.setupSynchronizationListElements();
        this.$writeWorkspaceChangesButton.hide();
    }
    initEditor() {
        this.diffEditor = monaco.editor.createDiffEditor(document.getElementById("jo_synchro_editor"), {
            originalEditable: true,
            readOnly: true,
            automaticLayout: true
        });
    }
    onContentChanged(leftRight) {
        let $button = leftRight == "left" ? this.$writeWorkspaceChangesButton : this.$writeRepositoryChangesButton;
        let synchroWorkspace = leftRight == "left" ? this.currentUserSynchroWorkspace : this.currentRepositorySynchroWorkspace;
        if (synchroWorkspace.hasChanges()) {
            $button.show();
        }
        else {
            $button.hide();
        }
    }
    updateAll() {
        let updateButtons = this.$fileListDivs[1].find('.jo_synchro_updateButton');
        updateButtons.click();
    }
    commitAll() {
        let commitButtons = this.$fileListDivs[2].find('.jo_synchro_commitButton');
        commitButtons.click();
    }
    updateCenterButtons() {
        let updateButtons = this.$fileListDivs[1].find('.jo_synchro_updateButton');
        if (updateButtons.length > 0) {
            this.$updateAllButton.css("visibility", "inherited");
        }
        else {
            this.$updateAllButton.css("visibility", "hidden");
        }
        let commitButtons = this.$fileListDivs[2].find('.jo_synchro_commitButton');
        if (commitButtons.length > 0) {
            this.$commitAllButton.css("visibility", "inherited");
        }
        else {
            this.$commitAllButton.css("visibility", "hidden");
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY2hyb25pemF0aW9uTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcmVwb3NpdG9yeS9zeW5jaHJvbml6ZS9TeW5jaHJvbml6YXRpb25NYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUV6RCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFFbEUsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRW5ELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFhLDBCQUEwQixFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFDeEYsT0FBTyxFQUFlLGdCQUFnQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFXdEUsTUFBTSxPQUFPLHNCQUFzQjtJQXNEL0IsWUFBbUIsSUFBVTtRQUFWLFNBQUksR0FBSixJQUFJLENBQU07UUFqQzdCLHdCQUFtQixHQUE2QixFQUFFLENBQUM7UUFTbkQsa0JBQWEsR0FBNkIsRUFBRSxDQUFDO1FBTTdDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFXMUIsZ0NBQTJCLEdBQWlDLEVBQUUsQ0FBQztRQUcvRCxvQkFBZSxHQUFxQixFQUFFLENBQUM7SUFLdkMsQ0FBQztJQUVELHdCQUF3QixDQUFDLFNBQW9CO1FBRXpDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDekQsSUFBRyxPQUFPLEVBQUM7Z0JBQ1AsSUFBSSxDQUFDLDhCQUE4QixDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUMvQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBRVosSUFBSSxDQUFDLEtB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Q0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDM0UsSUFBRyxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztZQUN4QixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxXQUFXLENBQUMsQ0FBQztTQUN4RDthQUFNO1lBQ0gsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDckQ7UUFFRCxJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzNFLElBQUcsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUM7WUFDeEIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDeEQ7YUFBTTtZQUNILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3JEO0lBQ0wsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgR2V0UmVwb3NpdG9yeVJlcXVlc3QsIEdldFJlcG9zaXRvcnlSZXNwb25zZSwgUmVwb3NpdG9yeSwgR2FpblJlcG9zaXRvcnlMb2NrUmVxdWVzdCwgR2FpblJlcG9zaXRvcnlMb2NrUmVzcG9uc2UsIExlYXNlUmVwb3NpdG9yeUxvY2tSZXF1ZXN0LCBMZWFzZVJlcG9zaXRvcnlMb2NrUmVzcG9uc2UgfSBmcm9tIFwiLi4vLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IEVtYmVkZGVkU2xpZGVyIH0gZnJvbSBcIi4uLy4uL2VtYmVkZGVkL0VtYmVkZGVkU2xpZGVyLmpzXCI7XHJcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vLi4vbWFpbi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IG1ha2VEaXYgfSBmcm9tIFwiLi4vLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZSB9IGZyb20gXCIuLi8uLi93b3Jrc3BhY2UvV29ya3NwYWNlLmpzXCI7XHJcbmltcG9ydCB7IEhpc3RvcnlFbGVtZW50IH0gZnJvbSBcIi4vSGlzdG9yeUVsZW1lbnQuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeVRvb2wgfSBmcm9tIFwiLi9SZXBvc2l0b3J5VG9vbC5qc1wiO1xyXG5pbXBvcnQgeyBMZWZ0UmlnaHQsIFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50IH0gZnJvbSBcIi4vU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQuanNcIjtcclxuaW1wb3J0IHsgU3luY2hyb0ZpbGUsIFN5bmNocm9Xb3Jrc3BhY2UgfSBmcm9tIFwiLi9TeW5jaHJvV29ya3NwYWNlLmpzXCI7XHJcbmltcG9ydCB7IERpYWxvZyB9IGZyb20gXCIuLi8uLi9tYWluL2d1aS9EaWFsb2cuanNcIjtcclxuXHJcblxyXG50eXBlIEZpbGVFbGVtZW50ID0ge1xyXG4gICAgaWQ6IG51bWJlcixcclxuICAgIG5hbWU6IHN0cmluZyxcclxuICAgIGxlZnRTeW5jaHJvRmlsZTogU3luY2hyb0ZpbGUsXHJcbiAgICByaWdodFN5bmNocm9GaWxlOiBTeW5jaHJvRmlsZVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU3luY2hyb25pemF0aW9uTWFuYWdlciB7XHJcblxyXG4gICAgJG1haW5IZWFkaW5nRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+OyAvLyBoZWFkaW5nIFwiSmF2YS1PbmxpbmU6IFN5bmNocm9uaXplIHJlcG9zaXRvcmllc1wiXHJcblxyXG4gICAgJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuICAgICR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgICRiYWNrVG9Xb3Jrc3BhY2VCdXR0b246IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uQnV0dG9uOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgICRleGl0QnV0dG9uOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgICRiZWxvd01haW5IZWFkaW5nRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+OyAvLyBjb250YWlucyBhbGwgZWxlbWVudHMgYmVsb3cgbWFpbiBoZWFkaW5nXHJcblxyXG4gICAgJGxlZnREaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47IC8vIGNvbnRhaW5zIGhlYWRpbmdzLCBmaWxlIGxpc3RzIGFuZCBlZGl0b3JzXHJcbiAgICAkaGlzdG9yeU91dGVyRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+OyAvLyBjb250YWlucyBoaXN0b3J5XHJcbiAgICAkaGlzdG9yeVNjcm9sbERpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICAkbGVmdFVwcGVyRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+OyAvLyBjb250YWlucyBmaWxlIGxpc3QgaGVhZGVyLCBmaWxlIGxpc3QgYW5kIGZpbGUgbGlzdCBmb290ZXJcclxuXHJcbiAgICAkZmlsZUxpc3RIZWFkZXJPdXRlckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuICAgICRmaWxlTGlzdEhlYWRlckRpdnM6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD5bXSA9IFtdO1xyXG5cclxuICAgICRmaWxlTGlzdEhlYWRlckNvbnRhaW5lclJpZ2h0OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgICR1cGRhdGVBbGxCdXR0b246IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkY29tbWl0QWxsQnV0dG9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuXHJcbiAgICAkZmlsZUxpc3RPdXRlckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuICAgICRmaWxlTGlzdERpdnM6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD5bXSA9IFtdO1xyXG5cclxuICAgICRmaWxlTGlzdEZvb3RlckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICAkZWRpdG9yRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgIGd1aVJlYWR5OiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBkaWZmRWRpdG9yOiBtb25hY28uZWRpdG9yLklTdGFuZGFsb25lRGlmZkVkaXRvcjtcclxuXHJcbiAgICBjdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICBjdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICBjdXJyZW50UmVwb3NpdG9yeTogUmVwb3NpdG9yeTtcclxuXHJcbiAgICBsZWZ0U3luY2hyb1dvcmtzcGFjZTogU3luY2hyb1dvcmtzcGFjZTtcclxuICAgIHJpZ2h0U3luY2hyb1dvcmtzcGFjZTogU3luY2hyb1dvcmtzcGFjZTtcclxuXHJcbiAgICBsYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50OiBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudDtcclxuICAgIHN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50czogU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRbXSA9IFtdO1xyXG5cclxuICAgIGxhc3RTaG93bkhpc3RvcnlFbGVtZW50OiBIaXN0b3J5RWxlbWVudDtcclxuICAgIGhpc3RvcnlFbGVtZW50czogSGlzdG9yeUVsZW1lbnRbXSA9IFtdO1xyXG5cclxuICAgIHRpbWVyOiBhbnk7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIG1haW46IE1haW4pIHtcclxuICAgIH1cclxuXHJcbiAgICBzeW5jaHJvbml6ZVdpdGhXb3Jrc3BhY2Uod29ya3NwYWNlOiBXb3Jrc3BhY2UpIHtcclxuXHJcbiAgICAgICAgdGhpcy5nYWluUmVwb3NpdG9yeUxvY2sod29ya3NwYWNlLnJlcG9zaXRvcnlfaWQsIChzdWNjZXNzKSA9PiB7XHJcbiAgICAgICAgICAgIGlmKHN1Y2Nlc3Mpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb1dvcmtzcGFjZUFuZFJlcG9zaXRvcnkod29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVyID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmdhaW5SZXBvc2l0b3J5TG9jayh0aGlzLmN1cnJlbnRSZXBvc2l0b3J5LmlkLCAoc3VjY2VzcykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZighc3VjY2Vzcyl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRGVyIFNlcnZlciBpc3QgdGVtcG9yw6RyIG5pY2h0IGVycmVpY2hiYXIuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgIH0sIDEwMDAwKVxyXG4gICAgICAgICAgICB9IFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnYWluUmVwb3NpdG9yeUxvY2socmVwb3NpdG9yeV9pZDogbnVtYmVyLCBjYWxsYmFjazogKHN1Y2Nlc3M6IGJvb2xlYW4pID0+IHZvaWQpe1xyXG4gICAgICAgIGxldCByZXF1ZXN0OiBHYWluUmVwb3NpdG9yeUxvY2tSZXF1ZXN0ID0ge3JlcG9zaXRvcnlfaWQ6IHJlcG9zaXRvcnlfaWR9O1xyXG4gICAgICAgIGFqYXgoJ2dhaW5SZXBvc2l0b3J5TG9jaycsIHJlcXVlc3QsIChyZXNwb25zZTogR2FpblJlcG9zaXRvcnlMb2NrUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgY2FsbGJhY2socmVzcG9uc2Uuc3VjY2Vzcyk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiTG9jayBmb3IgcmVwb3NpdG9yeV9pZCBcIiArIHJlcG9zaXRvcnlfaWQgKyBcIiBoYXMgYmVlbiBncmFudGVkLlwiKVxyXG4gICAgICAgIH0sIChtZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgICAgIGFsZXJ0KG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhmYWxzZSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgYXR0YWNoVG9Xb3Jrc3BhY2VBbmRSZXBvc2l0b3J5KHdvcmtzcGFjZTogV29ya3NwYWNlKSB7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhpcykuY29weUZyb21Xb3Jrc3BhY2Uod29ya3NwYWNlKTtcclxuICAgICAgICB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlID0gdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2U7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IEdldFJlcG9zaXRvcnlSZXF1ZXN0ID0geyByZXBvc2l0b3J5X2lkOiB3b3Jrc3BhY2UucmVwb3NpdG9yeV9pZCwgd29ya3NwYWNlX2lkOiB3b3Jrc3BhY2UuaWQgfTtcclxuICAgICAgICBhamF4KFwiZ2V0UmVwb3NpdG9yeVwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IEdldFJlcG9zaXRvcnlSZXNwb25zZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhhdC5hdHRhY2hUb1JlcG9zaXRvcnkocmVzcG9uc2UucmVwb3NpdG9yeSk7XHJcblxyXG4gICAgICAgIH0sIChtZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgYWxlcnQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBhdHRhY2hUb1JlcG9zaXRvcnkocmVwb3NpdG9yeTogUmVwb3NpdG9yeSkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJlcG9zaXRvcnkgPSByZXBvc2l0b3J5O1xyXG4gICAgICAgIFJlcG9zaXRvcnlUb29sLmRlc2VyaWFsaXplUmVwb3NpdG9yeSh0aGlzLmN1cnJlbnRSZXBvc2l0b3J5KTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZSA9IG5ldyBTeW5jaHJvV29ya3NwYWNlKHRoaXMpLmNvcHlGcm9tUmVwb3NpdG9yeSh0aGlzLmN1cnJlbnRSZXBvc2l0b3J5LCB0cnVlKTtcclxuXHJcbiAgICAgICAgdGhpcy5yaWdodFN5bmNocm9Xb3Jrc3BhY2UgPSB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZTtcclxuICAgICAgICB0aGlzLnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICAgICAgdGhpcy5zZXR1cEhpc3RvcnlFbGVtZW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldHVwSGlzdG9yeUVsZW1lbnRzKCkge1xyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlTY3JvbGxEaXYuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmhpc3RvcnlFbGVtZW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMubGFzdFNob3duSGlzdG9yeUVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5Lmhpc3RvcnlFbnRyaWVzLmZvckVhY2goKGhlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmhpc3RvcnlFbGVtZW50cy5wdXNoKG5ldyBIaXN0b3J5RWxlbWVudCh0aGlzLCB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5LCBoZSwgaW5kZXgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpIHtcclxuXHJcbiAgICAgICAgbGV0IGxhc3RTeW5jaHJvRmlsZUxlZnQgPSBudWxsO1xyXG4gICAgICAgIGxldCBsYXN0U3luY2hyb0ZpbGVSaWdodCA9IG51bGw7XHJcbiAgICAgICAgaWYodGhpcy5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50ICE9IG51bGwpe1xyXG4gICAgICAgICAgICBsYXN0U3luY2hyb0ZpbGVMZWZ0ID0gdGhpcy5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50LmxlZnRTeW5jaHJvRmlsZTtcclxuICAgICAgICAgICAgbGFzdFN5bmNocm9GaWxlUmlnaHQgPSB0aGlzLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQucmlnaHRTeW5jaHJvRmlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0RGl2cy5mb3JFYWNoKCRkaXYgPT4gJGRpdi5lbXB0eSgpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMuZm9yRWFjaChzZSA9PiBzZS5lbXB0eUdVSSgpKTtcclxuICAgICAgICB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMubGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudCA9IG51bGw7XHJcblxyXG4gICAgICAgIGxldCBmaWxlRWxlbWVudHM6IEZpbGVFbGVtZW50W10gPSBbXTtcclxuICAgICAgICBsZXQgc3luY2hyb0ZpbGVNYXA6IHsgW2lkOiBudW1iZXJdOiBGaWxlRWxlbWVudCB9ID0ge307XHJcblxyXG4gICAgICAgIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UuZmlsZXMuZm9yRWFjaChzZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWxlRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnksXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzZmlsZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbGVmdFN5bmNocm9GaWxlOiBzZmlsZSxcclxuICAgICAgICAgICAgICAgIHJpZ2h0U3luY2hyb0ZpbGU6IG51bGxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGZpbGVFbGVtZW50cy5wdXNoKGZpbGVFbGVtZW50KTtcclxuICAgICAgICAgICAgaWYgKHNmaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBzeW5jaHJvRmlsZU1hcFtzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnldID0gZmlsZUVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yaWdodFN5bmNocm9Xb3Jrc3BhY2UuZmlsZXMuZm9yRWFjaChzZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWxlRWxlbWVudDogRmlsZUVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAoc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5ICE9IG51bGwpIGZpbGVFbGVtZW50ID0gc3luY2hyb0ZpbGVNYXBbc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5XTtcclxuICAgICAgICAgICAgaWYgKGZpbGVFbGVtZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVFbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc2ZpbGUubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0U3luY2hyb0ZpbGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgcmlnaHRTeW5jaHJvRmlsZTogc2ZpbGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBmaWxlRWxlbWVudHMucHVzaChmaWxlRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlRWxlbWVudC5yaWdodFN5bmNocm9GaWxlID0gc2ZpbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZmlsZUVsZW1lbnRzLnNvcnQoKGZlMSwgZmUyKSA9PiBmZTEubmFtZS5sb2NhbGVDb21wYXJlKGZlMi5uYW1lKSk7XHJcblxyXG4gICAgICAgIGZpbGVFbGVtZW50cy5mb3JFYWNoKGZlID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBzeW5jaHJvTGlzdEVsZW1lbnQgPSBuZXcgU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQodGhpcywgZmUubGVmdFN5bmNocm9GaWxlLCBmZS5yaWdodFN5bmNocm9GaWxlLCB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlLCB0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzLnB1c2goc3luY2hyb0xpc3RFbGVtZW50KTtcclxuICAgICAgICAgICAgc3luY2hyb0xpc3RFbGVtZW50LmNvbXBhcmVGaWxlc0FuZEFkYXB0R1VJKCk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpZmZFZGl0b3Iuc2V0TW9kZWwoe1xyXG4gICAgICAgICAgICBvcmlnaW5hbDogbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlfDpGhsZW4gU2llIG9iZW4gZWluZSBEYXRlaSBhdXMhXCIsIFwibXlKYXZhXCIpLFxyXG4gICAgICAgICAgICBtb2RpZmllZDogbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlfDpGhsZW4gU2llIG9iZW4gZWluZSBEYXRlaSBhdXMhXCIsIFwibXlKYXZhXCIpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlmZkVkaXRvci51cGRhdGVPcHRpb25zKHtcclxuICAgICAgICAgICAgb3JpZ2luYWxFZGl0YWJsZTogZmFsc2VcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5sZWZ0U3luY2hyb1dvcmtzcGFjZSA9PSB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcihcImxlZnRcIiwgXCJEZWluIFdvcmtzcGFjZTpcIik7XHJcbiAgICAgICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXIoXCJsZWZ0XCIsIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UubmFtZSArIFwiOlwiKTtcclxuICAgICAgICAgICAgdGhpcy4kYmFja1RvV29ya3NwYWNlQnV0dG9uLnNob3coKTtcclxuICAgICAgICAgICAgdGhpcy4kd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZSA9PSB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZSkge1xyXG4gICAgICAgICAgICBsZXQgd3JpdGFibGU6IHN0cmluZyA9IHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlLmNvcGllZEZyb21Xb3Jrc3BhY2UuaGFzX3dyaXRlX3Blcm1pc3Npb25fdG9fcmVwb3NpdG9yeSA/IFwiLCBtaXQgU2NocmVpYnp1Z3JpZmZcIiA6IFwiLCBvaG5lIFNjaHJlaWJ6dWdyaWZmXCI7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVyKFwicmlnaHRcIiwgXCJSZXBvc2l0b3J5IChha3R1ZWxsZSBWZXJzaW9uXCIgKyB3cml0YWJsZSArIFwiKTpcIik7XHJcbiAgICAgICAgICAgIHRoaXMuJGJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbkJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXIoXCJyaWdodFwiLCB0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZS5uYW1lICsgXCI6XCIpO1xyXG4gICAgICAgICAgICB0aGlzLiRiYWNrVG9DdXJyZW50UmVwb3NpdG9yeVZlcnNpb25CdXR0b24uc2hvdygpO1xyXG4gICAgICAgICAgICB0aGlzLiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2pvX3N5bmNocm9fbWFpbl9oZWFkaW5nX3RleHQnKS50ZXh0KGBTeW5jaHJvbmlzaWVyZW4gbWl0IFJlcG9zaXRvcnkgXCIke3RoaXMuY3VycmVudFJlcG9zaXRvcnkubmFtZX1cImApO1xyXG5cclxuICAgICAgICBsZXQgbGFzdEZpbGVTZWxlY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgIGlmKGxhc3RTeW5jaHJvRmlsZUxlZnQgIT0gbnVsbCB8fCBsYXN0U3luY2hyb0ZpbGVSaWdodCAhPSBudWxsKXtcclxuICAgICAgICAgICAgZm9yKGxldCBzbGUgb2YgdGhpcy5zeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMpe1xyXG4gICAgICAgICAgICAgICAgaWYoXHJcbiAgICAgICAgICAgICAgICAgICAgc2xlLmxlZnRTeW5jaHJvRmlsZSAhPSBudWxsICYmIHNsZS5sZWZ0U3luY2hyb0ZpbGUgPT0gbGFzdFN5bmNocm9GaWxlTGVmdCB8fCBcclxuICAgICAgICAgICAgICAgICAgICBzbGUucmlnaHRTeW5jaHJvRmlsZSAhPSBudWxsICYmIHNsZS5yaWdodFN5bmNocm9GaWxlID09IGxhc3RTeW5jaHJvRmlsZVJpZ2h0ICBcclxuICAgICAgICAgICAgICAgICAgICApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGUuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RGaWxlU2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCFsYXN0RmlsZVNlbGVjdGVkICYmIHRoaXMuc3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50c1swXS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNob3coKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmd1aVJlYWR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEdVSSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgJHN5bmNocm9EaXYgPSBqUXVlcnkoJyNzeW5jaHJvbml6ZS1kaXYnKTtcclxuICAgICAgICAkc3luY2hyb0Rpdi5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgICAgIGxldCAkbWFpbkRpdiA9IGpRdWVyeSgnI21haW4nKTtcclxuICAgICAgICAkbWFpbkRpdi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcblxyXG4gICAgICAgIHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLm1haW4ud2luZG93U3RhdGVNYW5hZ2VyLnJlZ2lzdGVyT25lVGltZUJhY2tCdXR0b25MaXN0ZW5lcigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuaGlkZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGhpZGUoKSB7XHJcbiAgICAgICAgbGV0ICRzeW5jaHJvRGl2ID0galF1ZXJ5KCcjc3luY2hyb25pemUtZGl2Jyk7XHJcbiAgICAgICAgJHN5bmNocm9EaXYuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgICAgIGxldCAkbWFpbkRpdiA9IGpRdWVyeSgnI21haW4nKTtcclxuICAgICAgICAkbWFpbkRpdi5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG5cclxuICAgICAgICBjbGVhckludGVydmFsKHRoaXMudGltZXIpO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogTGVhc2VSZXBvc2l0b3J5TG9ja1JlcXVlc3QgPSB7cmVwb3NpdG9yeV9pZDogdGhpcy5jdXJyZW50UmVwb3NpdG9yeS5pZH07XHJcbiAgICAgICAgYWpheCgnbGVhc2VSZXBvc2l0b3J5TG9jaycsIHJlcXVlc3QsIChyZXNwb25zZTogTGVhc2VSZXBvc2l0b3J5TG9ja1Jlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiTG9jayBmb3IgcmVwb3NpdG9yeV9pZCBcIiArIHJlcXVlc3QucmVwb3NpdG9yeV9pZCArIFwiIGhhcyBiZWVuIHJlbGVhc2VkLlwiKVxyXG4gICAgICAgIH0sIChtZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuICAgICAgICB0aGlzLmd1aVJlYWR5ID0gdHJ1ZTtcclxuICAgICAgICBsZXQgJHN5bmNocm9EaXYgPSBqUXVlcnkoJyNzeW5jaHJvbml6ZS1kaXYnKTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICRzeW5jaHJvRGl2LmFwcGVuZChcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJG1haW5IZWFkaW5nRGl2ID0galF1ZXJ5KCc8ZGl2IGlkPVwiam9fc3luY2hyb19tYWluX2hlYWRpbmdcIj48c3BhbiBpZD1cImpvX3N5bmNocm9fbWFpbl9oZWFkaW5nX3RleHRcIj5KYXZhLU9ubGluZTogV29ya3NwYWNlIG1pdCBSZXBvc2l0b3J5IHN5bmNocm9uaXNpZXJlbjwvc3Bhbj48L2Rpdj4nKSxcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGJlbG93TWFpbkhlYWRpbmdEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19iZWxvd19tYWluX2hlYWRpbmdcIikpO1xyXG5cclxuICAgICAgICBsZXQgJGJ1dHRvbnNUb3BSaWdodERpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2J1dHRvbnNUb3BSaWdodFwiKTtcclxuICAgICAgICB0aGlzLiRtYWluSGVhZGluZ0Rpdi5hcHBlbmQoJGJ1dHRvbnNUb3BSaWdodERpdik7XHJcblxyXG4gICAgICAgICRidXR0b25zVG9wUmlnaHREaXYuYXBwZW5kKHRoaXMuJGV4aXRCdXR0b24gPSBqUXVlcnkoJzxkaXYgaWQ9XCJqb19zeW5jaHJvX2V4aXRCdXR0b25cIiBjbGFzcz1cImpvX3N5bmNocm9fYnV0dG9uXCI+WnVyw7xjayB6dW0gUHJvZ3JhbW1pZXJlbjwvZGl2PicpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZXhpdEJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHdpbmRvdy5oaXN0b3J5LmJhY2soKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kbGVmdERpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2xlZnREaXZcIik7XHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeU91dGVyRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9faGlzdG9yeU91dGVyRGl2XCIpO1xyXG5cclxuICAgICAgICB0aGlzLiRoaXN0b3J5T3V0ZXJEaXYuYXBwZW5kKGpRdWVyeSgnPGRpdiBpZD1cImpvX3N5bmNocm9faGlzdG9yeUhlYWRlclwiPjxkaXYgY2xhc3M9XCJqb19zeW5jaHJvX3RhYkhlYWRpbmdcIj5IaXN0b3J5OjwvZGl2PjwvZGl2PiknKSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJlbG93TWFpbkhlYWRpbmdEaXYuYXBwZW5kKHRoaXMuJGxlZnREaXYsIHRoaXMuJGhpc3RvcnlPdXRlckRpdik7XHJcblxyXG4gICAgICAgIG5ldyBFbWJlZGRlZFNsaWRlcih0aGlzLiRoaXN0b3J5T3V0ZXJEaXYsIHRydWUsIGZhbHNlLCAoKSA9PiB7IHRoaXMuZGlmZkVkaXRvci5sYXlvdXQoKTsgfSkuJHNsaWRlckRpdi5jc3MoJ2xlZnQnLCAnLTNweCcpO1xyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlPdXRlckRpdi5maW5kKCcuam9lX3NsaWRlcicpLmNzcygncG9zaXRpb24nLCAnYWJzb2x1dGUnKTtcclxuXHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeVNjcm9sbERpdiA9IG1ha2VEaXYoXCJoaXN0b3J5U2Nyb2xsRGl2XCIsIFwiam9fc3JvbGxhYmxlXCIpO1xyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlPdXRlckRpdi5hcHBlbmQodGhpcy4kaGlzdG9yeVNjcm9sbERpdik7XHJcblxyXG5cclxuICAgICAgICB0aGlzLiRsZWZ0RGl2LmFwcGVuZChcclxuICAgICAgICAgICAgdGhpcy4kbGVmdFVwcGVyRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fbGVmdFVwcGVyXCIpLFxyXG4gICAgICAgICAgICB0aGlzLiRlZGl0b3JEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19lZGl0b3JcIilcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0aGlzLiRsZWZ0VXBwZXJEaXYuYXBwZW5kKFxyXG4gICAgICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlck91dGVyRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fZmlsZUxpc3RIZWFkZXJPdXRlclwiKSxcclxuICAgICAgICAgICAgdGhpcy4kZmlsZUxpc3RPdXRlckRpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2ZpbGVMaXN0T3V0ZXJcIiwgXCJqb19zY3JvbGxhYmxlXCIpLFxyXG4gICAgICAgICAgICB0aGlzLiRmaWxlTGlzdEZvb3RlckRpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2ZpbGVMaXN0Rm9vdGVyXCIpXHJcbiAgICAgICAgKVxyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckNvbnRhaW5lclJpZ2h0ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RIZWFkZXJDb250YWluZXJSaWdodFwiKTtcclxuICAgICAgICBsZXQgZmlsZUxpc3RIZWFkZXJSaWdodCA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0SGVhZGVyXCIpO1xyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyQ29udGFpbmVyUmlnaHQuYXBwZW5kKGZpbGVMaXN0SGVhZGVyUmlnaHQpO1xyXG5cclxuICAgICAgICBsZXQgJGZpbGVMaXN0SGVhZGVyQ2VudGVyID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RIZWFkZXJDZW50ZXJcIik7XHJcbiAgICAgICAgJGZpbGVMaXN0SGVhZGVyQ2VudGVyLmFwcGVuZCh0aGlzLiR1cGRhdGVBbGxCdXR0b24gPSBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudC5tYWtlQnV0dG9uKFwidXBkYXRlQWxsXCIsIFwibGVmdFwiLCAoKSA9PiB7dGhhdC51cGRhdGVBbGwoKX0pKTtcclxuICAgICAgICAkZmlsZUxpc3RIZWFkZXJDZW50ZXIuYXBwZW5kKHRoaXMuJGNvbW1pdEFsbEJ1dHRvbiA9IFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50Lm1ha2VCdXR0b24oXCJjb21taXRBbGxcIiwgXCJyaWdodFwiLCAoKSA9PiB7dGhhdC5jb21taXRBbGwoKX0pKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzLnB1c2gobWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RIZWFkZXJcIiwgXCJcIiwge1wiZmxleFwiOiBcIjIgMFwifSksICRmaWxlTGlzdEhlYWRlckNlbnRlciwgdGhpcy4kZmlsZUxpc3RIZWFkZXJDb250YWluZXJSaWdodCwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fc2Nyb2xsYmFyUGxhY2Vob2xkZXJcIikpO1xyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0RGl2cy5wdXNoKG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0XCIpLCBtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdEJ1dHRvbnNMZWZ0XCIpLCBtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdEJ1dHRvbnNSaWdodFwiKSwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RcIikpO1xyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlck91dGVyRGl2LmFwcGVuZCh0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnMpO1xyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0T3V0ZXJEaXYuYXBwZW5kKHRoaXMuJGZpbGVMaXN0RGl2cyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyRGl2c1swXS5hcHBlbmQoXCI8ZGl2IGNsYXNzPSdqb19zeW5jaHJvX3RhYkhlYWRpbmcnPkRlaW4gV29ya3NwYWNlOjwvZGl2PlwiKTtcclxuICAgICAgICBmaWxlTGlzdEhlYWRlclJpZ2h0LmFwcGVuZChcIjxkaXYgY2xhc3M9J2pvX3N5bmNocm9fdGFiSGVhZGluZyc+UmVwb3NpdG9yeSAoYWt0dWVsbGUgVmVyc2lvbik6PC9kaXY+XCIpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzWzBdLmFwcGVuZCh0aGlzLiRiYWNrVG9Xb3Jrc3BhY2VCdXR0b24gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvbiBqb19zeW5jaHJvX2JhY2tUb0J1dHRvblwiPlplaWdlIGVpZ2VuZW4gV29ya3NwYWNlPC9kaXY+JykpO1xyXG4gICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuYmFja1RvV29ya3NwYWNlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy4kYmFja1RvV29ya3NwYWNlQnV0dG9uLmhpZGUoKTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAgICAgZmlsZUxpc3RIZWFkZXJSaWdodC5hcHBlbmQodGhpcy4kYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uQnV0dG9uID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fc3luY2hyb19idXR0b24gam9fc3luY2hyb19iYWNrVG9CdXR0b25cIj5aZWlnZSBha3R1ZWxsZSBSZXBvc2l0b3J5LVZlcnNpb248L2Rpdj4nKSk7XHJcbiAgICAgICAgdGhpcy4kYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uQnV0dG9uLm9uKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgdGhhdC5iYWNrVG9DdXJyZW50UmVwb3NpdG9yeVZlcnNpb24oKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLiRiYWNrVG9Xb3Jrc3BhY2VCdXR0b24uaGlkZSgpO1xyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnNbMF0uYXBwZW5kKHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbiA9IGpRdWVyeSgnPGRpdiBpZD1cImpvX3N5bmNocm9fd3JpdGVDaGFuZ2VzQnV0dG9uXCIgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvblwiPsOEbmRlcnVuZ2VuIGFtIFdvcmtzcGFjZSAocm90ISkgc3BlaWNoZXJuPC9kaXY+JykpO1xyXG4gICAgICAgIHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQud3JpdGVXb3Jrc3BhY2VDaGFuZ2VzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy4kd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgZmlsZUxpc3RIZWFkZXJSaWdodC5hcHBlbmQodGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbiA9IGpRdWVyeSgnPGRpdiBpZD1cImpvX3N5bmNocm9fd3JpdGVDaGFuZ2VzQnV0dG9uXCIgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvblwiPsOEbmRlcnVuZ2VuIGFtIFJlcG9zaXRvcnkgKHJvdCEpIHNwZWljaGVybjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLm9uKCdjbGljaycsICgpID0+IHtcclxuICAgICAgICAgICAgdGhhdC53cml0ZVJlcG9zaXRvcnlDaGFuZ2VzKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgIGxldCBob3Jpem9udGFsU2xpZGVyID0gbmV3IEVtYmVkZGVkU2xpZGVyKHRoaXMuJGVkaXRvckRpdiwgdHJ1ZSwgdHJ1ZSwgKCkgPT4geyB0aGlzLmRpZmZFZGl0b3IubGF5b3V0KCk7IH0pO1xyXG4gICAgICAgIGhvcml6b250YWxTbGlkZXIuc2V0Q29sb3IoJ3ZhcigtLXNsaWRlciknKTtcclxuXHJcbiAgICAgICAgdGhpcy5tYWtlRHJvcHBhYmxlKFwibGVmdFwiLCB0aGlzLiRmaWxlTGlzdERpdnNbMF0pO1xyXG4gICAgICAgIHRoaXMubWFrZURyb3BwYWJsZShcInJpZ2h0XCIsIHRoaXMuJGZpbGVMaXN0RGl2c1szXSk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEVkaXRvcigpO1xyXG4gICAgfVxyXG5cclxuICAgIGJhY2tUb1dvcmtzcGFjZSgpIHtcclxuICAgICAgICB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlID0gdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICAgICAgdGhpcy5zZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpO1xyXG4gICAgICAgIHRoaXMub25Db250ZW50Q2hhbmdlZChcImxlZnRcIik7XHJcbiAgICB9XHJcblxyXG4gICAgYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uKCkge1xyXG4gICAgICAgIHRoaXMucmlnaHRTeW5jaHJvV29ya3NwYWNlID0gdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICAgICAgdGhpcy5zZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpO1xyXG4gICAgICAgIHRoaXMub25Db250ZW50Q2hhbmdlZChcInJpZ2h0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIG1ha2VEcm9wcGFibGUobGVmdFJpZ2h0OiBMZWZ0UmlnaHQsICRkcm9wWm9uZURpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAkZHJvcFpvbmVEaXYub24oXCJkcmFnb3ZlclwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAkZHJvcFpvbmVEaXYuYWRkQ2xhc3MoJ2pvX3N5bmNocm9fZHJhZ1pvbmUnKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkcm9wWm9uZURpdi5vbihcImRyYWdsZWF2ZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICRkcm9wWm9uZURpdi5yZW1vdmVDbGFzcygnam9fc3luY2hyb19kcmFnWm9uZScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkcm9wWm9uZURpdi5vbihcImRyb3BcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgbGV0IHN3ID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhhdCkuY29weUZyb21IaXN0b3J5RWxlbWVudChIaXN0b3J5RWxlbWVudC5jdXJyZW50bHlEcmFnZ2VkKTtcclxuICAgICAgICAgICAgc3dpdGNoIChsZWZ0UmlnaHQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb1dvcmtzcGFjZSA9IHN3O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJpZ2h0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yaWdodFN5bmNocm9Xb3Jrc3BhY2UgPSBzdztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICRkcm9wWm9uZURpdi5yZW1vdmVDbGFzcygnam9fc3luY2hyb19kcmFnWm9uZScpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEhlYWRlcihsZWZ0UmlnaHQ6IExlZnRSaWdodCwgY2FwdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBsZWZ0UmlnaHQgPT0gXCJsZWZ0XCIgPyAwIDogMjtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnNbaW5kZXhdLmZpbmQoJy5qb19zeW5jaHJvX3RhYkhlYWRpbmcnKS50ZXh0KGNhcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlUmVwb3NpdG9yeUNoYW5nZXMoKSB7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgbGV0ICRkaWFsb2dEaXYgPSBtYWtlRGl2KFwiXCIsIFwiam9fc3luY2hyb19jb21taXREaWFsb2dEaXZcIik7XHJcbiAgICAgICAgJGRpYWxvZ0Rpdi5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJDb250YWluZXJSaWdodC5hcHBlbmQoJGRpYWxvZ0Rpdik7XHJcblxyXG4gICAgICAgICRkaWFsb2dEaXYuYXBwZW5kKG1ha2VEaXYoXCJcIiwgXCJqb19zeW5jaHJvX2NvbW1pdERpYWxvZ0NhcHRpb25cIiwgXCJCaXR0ZSBiZXNjaHJlaWJlIGt1cnogZGllIHZvcmdlbm9tbWVuZW4gw4RuZGVydW5nZW4gYW0gUmVwb3NpdG9yeTpcIikpO1xyXG4gICAgICAgIGxldCAkZGlhbG9nVGV4dGFyZWE6IEpRdWVyeTxIVE1MVGV4dEFyZWFFbGVtZW50PiA9IGpRdWVyeSgnPHRleHRhcmVhIGNsYXNzPVwiam9fc3luY2hyb19jb21taXREaWFsb2dUZXh0YXJlYVwiPjwvdGV4dGFyZWE+Jyk7XHJcbiAgICAgICAgJGRpYWxvZ0Rpdi5hcHBlbmQoJGRpYWxvZ1RleHRhcmVhKTtcclxuXHJcbiAgICAgICAgbGV0ICRkaWFsb2dCdXR0b25EaXYgPSBtYWtlRGl2KFwiXCIsIFwiam9fc3luY2hyb19jb21taXREaWFsb2dCdXR0b25EaXZcIik7XHJcbiAgICAgICAgJGRpYWxvZ0Rpdi5hcHBlbmQoJGRpYWxvZ0J1dHRvbkRpdik7XHJcblxyXG4gICAgICAgIGxldCAkYnV0dG9uQ2FuY2VsID0gbWFrZURpdihcIlwiLCBcImpvX3N5bmNocm9fYnV0dG9uXCIsIFwiQWJicmVjaGVuXCIsIHtcImJhY2tncm91bmQtY29sb3JcIjogXCJ2YXIoLS11cGRhdGVCdXR0b25CYWNrZ3JvdW5kKVwiLCBcImNvbG9yXCI6IFwidmFyKC0tdXBkYXRlQnV0dG9uQ29sb3IpXCJ9KVxyXG4gICAgICAgICRkaWFsb2dCdXR0b25EaXYuYXBwZW5kKCRidXR0b25DYW5jZWwpO1xyXG5cclxuICAgICAgICAkYnV0dG9uQ2FuY2VsLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAkZGlhbG9nRGl2LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGF0LiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLnNob3coKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBsZXQgJGJ1dHRvbk9LID0gbWFrZURpdihcIlwiLCBcImpvX3N5bmNocm9fYnV0dG9uXCIsIFwiT0tcIiwge1wiYmFja2dyb3VuZC1jb2xvclwiOiBcInZhcigtLWNyZWF0ZUJ1dHRvbkJhY2tncm91bmQpXCIsIFwiY29sb3JcIjogXCJ2YXIoLS1jcmVhdGVCdXR0b25Db2xvcilcIn0pXHJcbiAgICAgICAgJGRpYWxvZ0J1dHRvbkRpdi5hcHBlbmQoJGJ1dHRvbk9LKTtcclxuXHJcbiAgICAgICAgJGRpYWxvZ0Rpdi5zaG93KDYwMCk7XHJcblxyXG4gICAgICAgICRidXR0b25PSy5vbihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgbGV0IGNvbW1lbnQgPSA8c3RyaW5nPiRkaWFsb2dUZXh0YXJlYS52YWwoKTtcclxuICAgICAgICAgICAgJGRpYWxvZ0Rpdi5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlLmNvbW1pdCh0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZS5jb3BpZWRGcm9tV29ya3NwYWNlLCB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5LCBjb21tZW50LFxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLCAocmVwb3NpdG9yeTogUmVwb3NpdG9yeSwgZXJyb3JNZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvck1lc3NhZ2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbGVydChlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvV29ya3NwYWNlQW5kUmVwb3NpdG9yeSh0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZS5jb3BpZWRGcm9tV29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvUmVwb3NpdG9yeShyZXBvc2l0b3J5KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICB9XHJcblxyXG4gICAgd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzKCkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlLndyaXRlQ2hhbmdlc1RvV29ya3NwYWNlKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2UgPSBuZXcgU3luY2hyb1dvcmtzcGFjZSh0aGlzKS5jb3B5RnJvbVdvcmtzcGFjZSh0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZS5jb3BpZWRGcm9tV29ya3NwYWNlKTtcclxuICAgICAgICB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlID0gdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICAgICAgdGhpcy5zZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpO1xyXG4gICAgICAgIHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEVkaXRvcigpIHtcclxuICAgICAgICB0aGlzLmRpZmZFZGl0b3IgPSBtb25hY28uZWRpdG9yLmNyZWF0ZURpZmZFZGl0b3IoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJqb19zeW5jaHJvX2VkaXRvclwiKSwge1xyXG4gICAgICAgICAgICBvcmlnaW5hbEVkaXRhYmxlOiB0cnVlLCAvLyBmb3IgbGVmdCBwYW5lXHJcbiAgICAgICAgICAgIHJlYWRPbmx5OiB0cnVlLCAgICAgICAgIC8vIGZvciByaWdodCBwYW5lXHJcbiAgICAgICAgICAgIGF1dG9tYXRpY0xheW91dDogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uQ29udGVudENoYW5nZWQobGVmdFJpZ2h0OiBMZWZ0UmlnaHQpIHtcclxuICAgICAgICBsZXQgJGJ1dHRvbjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PiA9IGxlZnRSaWdodCA9PSBcImxlZnRcIiA/IHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbiA6IHRoaXMuJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b25cclxuICAgICAgICBsZXQgc3luY2hyb1dvcmtzcGFjZTogU3luY2hyb1dvcmtzcGFjZSA9IGxlZnRSaWdodCA9PSBcImxlZnRcIiA/IHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlIDogdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2U7XHJcblxyXG4gICAgICAgIGlmIChzeW5jaHJvV29ya3NwYWNlLmhhc0NoYW5nZXMoKSkge1xyXG4gICAgICAgICAgICAkYnV0dG9uLnNob3coKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkYnV0dG9uLmhpZGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZUFsbCgpe1xyXG4gICAgICAgIGxldCB1cGRhdGVCdXR0b25zID0gdGhpcy4kZmlsZUxpc3REaXZzWzFdLmZpbmQoJy5qb19zeW5jaHJvX3VwZGF0ZUJ1dHRvbicpO1xyXG4gICAgICAgIHVwZGF0ZUJ1dHRvbnMuY2xpY2soKTtcclxuICAgIH1cclxuXHJcbiAgICBjb21taXRBbGwoKXtcclxuICAgICAgICBsZXQgY29tbWl0QnV0dG9ucyA9IHRoaXMuJGZpbGVMaXN0RGl2c1syXS5maW5kKCcuam9fc3luY2hyb19jb21taXRCdXR0b24nKTtcclxuICAgICAgICBjb21taXRCdXR0b25zLmNsaWNrKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHVwZGF0ZUNlbnRlckJ1dHRvbnMoKXtcclxuICAgICAgICBsZXQgdXBkYXRlQnV0dG9ucyA9IHRoaXMuJGZpbGVMaXN0RGl2c1sxXS5maW5kKCcuam9fc3luY2hyb191cGRhdGVCdXR0b24nKTtcclxuICAgICAgICBpZih1cGRhdGVCdXR0b25zLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICB0aGlzLiR1cGRhdGVBbGxCdXR0b24uY3NzKFwidmlzaWJpbGl0eVwiLCBcImluaGVyaXRlZFwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiR1cGRhdGVBbGxCdXR0b24uY3NzKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBjb21taXRCdXR0b25zID0gdGhpcy4kZmlsZUxpc3REaXZzWzJdLmZpbmQoJy5qb19zeW5jaHJvX2NvbW1pdEJ1dHRvbicpO1xyXG4gICAgICAgIGlmKGNvbW1pdEJ1dHRvbnMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgIHRoaXMuJGNvbW1pdEFsbEJ1dHRvbi5jc3MoXCJ2aXNpYmlsaXR5XCIsIFwiaW5oZXJpdGVkXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGNvbW1pdEFsbEJ1dHRvbi5jc3MoXCJ2aXNpYmlsaXR5XCIsIFwiaGlkZGVuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG59Il19