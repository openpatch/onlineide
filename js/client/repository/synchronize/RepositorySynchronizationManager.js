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
                this.repositoryIsWritable = true;
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
            else {
                // User has no write permission to repository => no lock needed.
                this.attachToWorkspaceAndRepository(workspace);
                this.repositoryIsWritable = false;
                this.show();
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
            let writable = this.repositoryIsWritable ? ", mit Schreibzugriff" : ", ohne Schreibzugriff";
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
        $dialogTextarea.focus();
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
            this.$updateAllButton.css("visibility", "inherit");
        }
        else {
            this.$updateAllButton.css("visibility", "hidden");
        }
        let commitButtons = this.$fileListDivs[2].find('.jo_synchro_commitButton');
        if (commitButtons.length > 0) {
            this.$commitAllButton.css("visibility", "inherit");
        }
        else {
            this.$commitAllButton.css("visibility", "hidden");
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVwb3NpdG9yeVN5bmNocm9uaXphdGlvbk1hbmFnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L3JlcG9zaXRvcnkvc3luY2hyb25pemUvUmVwb3NpdG9yeVN5bmNocm9uaXphdGlvbk1hbmFnZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLG1DQUFtQyxDQUFDO0FBRXpELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUVsRSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFFbkQsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUNyRCxPQUFPLEVBQWEsMEJBQTBCLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN4RixPQUFPLEVBQWUsZ0JBQWdCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQVd0RSxNQUFNLE9BQU8sc0JBQXNCO0lBd0QvQixZQUFtQixJQUFVO1FBQVYsU0FBSSxHQUFKLElBQUksQ0FBTTtRQW5DN0Isd0JBQW1CLEdBQTZCLEVBQUUsQ0FBQztRQVNuRCxrQkFBYSxHQUE2QixFQUFFLENBQUM7UUFNN0MsYUFBUSxHQUFZLEtBQUssQ0FBQztRQVcxQixnQ0FBMkIsR0FBaUMsRUFBRSxDQUFDO1FBRy9ELG9CQUFlLEdBQXFCLEVBQUUsQ0FBQztJQU92QyxDQUFDO0lBRUQsd0JBQXdCLENBQUMsU0FBb0I7UUFFekMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUN6RCxJQUFJLE9BQU8sRUFBRTtnQkFDVCxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO2dCQUNqQyxJQUFJLENBQUMsOEJBQThCLENBQUMsU0FB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LGFBQWEsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMxQixDQUFDO0lBRUQsU0FBUztRQUNMLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLDBCQUEwQixDQUFDLENBQUM7UUFDM0UsYUFBYSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzFCLENBQUM7SUFHRCxtQkFBbUI7UUFDZixJQUFJLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQzNFLElBQUksYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDMUIsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDdEQ7YUFBTTtZQUNILElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ3JEO1FBRUQsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUMzRSxJQUFJLGFBQWEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzFCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQ3REO2FBQU07WUFDSCxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQztTQUNyRDtJQUNMLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGFqYXggfSBmcm9tIFwiLi4vLi4vY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IEdldFJlcG9zaXRvcnlSZXF1ZXN0LCBHZXRSZXBvc2l0b3J5UmVzcG9uc2UsIFJlcG9zaXRvcnksIEdhaW5SZXBvc2l0b3J5TG9ja1JlcXVlc3QsIEdhaW5SZXBvc2l0b3J5TG9ja1Jlc3BvbnNlLCBMZWFzZVJlcG9zaXRvcnlMb2NrUmVxdWVzdCwgTGVhc2VSZXBvc2l0b3J5TG9ja1Jlc3BvbnNlIH0gZnJvbSBcIi4uLy4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBFbWJlZGRlZFNsaWRlciB9IGZyb20gXCIuLi8uLi9lbWJlZGRlZC9FbWJlZGRlZFNsaWRlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uLy4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRGl2IH0gZnJvbSBcIi4uLy4uL3Rvb2xzL0h0bWxUb29scy5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBIaXN0b3J5RWxlbWVudCB9IGZyb20gXCIuL0hpc3RvcnlFbGVtZW50LmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlUb29sIH0gZnJvbSBcIi4vUmVwb3NpdG9yeVRvb2wuanNcIjtcclxuaW1wb3J0IHsgTGVmdFJpZ2h0LCBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudCB9IGZyb20gXCIuL1N5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50LmpzXCI7XHJcbmltcG9ydCB7IFN5bmNocm9GaWxlLCBTeW5jaHJvV29ya3NwYWNlIH0gZnJvbSBcIi4vU3luY2hyb1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBEaWFsb2cgfSBmcm9tIFwiLi4vLi4vbWFpbi9ndWkvRGlhbG9nLmpzXCI7XHJcblxyXG5cclxudHlwZSBGaWxlRWxlbWVudCA9IHtcclxuICAgIGlkOiBudW1iZXIsXHJcbiAgICBuYW1lOiBzdHJpbmcsXHJcbiAgICBsZWZ0U3luY2hyb0ZpbGU6IFN5bmNocm9GaWxlLFxyXG4gICAgcmlnaHRTeW5jaHJvRmlsZTogU3luY2hyb0ZpbGVcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFN5bmNocm9uaXphdGlvbk1hbmFnZXIge1xyXG5cclxuICAgICRtYWluSGVhZGluZ0RpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjsgLy8gaGVhZGluZyBcIkphdmEtT25saW5lOiBTeW5jaHJvbml6ZSByZXBvc2l0b3JpZXNcIlxyXG5cclxuICAgICR3cml0ZVdvcmtzcGFjZUNoYW5nZXNCdXR0b246IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICAkYmFja1RvV29ya3NwYWNlQnV0dG9uOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG4gICAgJGJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbkJ1dHRvbjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICAkZXhpdEJ1dHRvbjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICAkYmVsb3dNYWluSGVhZGluZ0RpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjsgLy8gY29udGFpbnMgYWxsIGVsZW1lbnRzIGJlbG93IG1haW4gaGVhZGluZ1xyXG5cclxuICAgICRsZWZ0RGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+OyAvLyBjb250YWlucyBoZWFkaW5ncywgZmlsZSBsaXN0cyBhbmQgZWRpdG9yc1xyXG4gICAgJGhpc3RvcnlPdXRlckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjsgLy8gY29udGFpbnMgaGlzdG9yeVxyXG4gICAgJGhpc3RvcnlTY3JvbGxEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJGxlZnRVcHBlckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjsgLy8gY29udGFpbnMgZmlsZSBsaXN0IGhlYWRlciwgZmlsZSBsaXN0IGFuZCBmaWxlIGxpc3QgZm9vdGVyXHJcblxyXG4gICAgJGZpbGVMaXN0SGVhZGVyT3V0ZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkZmlsZUxpc3RIZWFkZXJEaXZzOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+W10gPSBbXTtcclxuXHJcbiAgICAkZmlsZUxpc3RIZWFkZXJDb250YWluZXJSaWdodDogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICAkdXBkYXRlQWxsQnV0dG9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJGNvbW1pdEFsbEJ1dHRvbjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcblxyXG4gICAgJGZpbGVMaXN0T3V0ZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkZmlsZUxpc3REaXZzOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+W10gPSBbXTtcclxuXHJcbiAgICAkZmlsZUxpc3RGb290ZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJGVkaXRvckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICBndWlSZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgZGlmZkVkaXRvcjogbW9uYWNvLmVkaXRvci5JU3RhbmRhbG9uZURpZmZFZGl0b3I7XHJcblxyXG4gICAgY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgY3VycmVudFJlcG9zaXRvcnk6IFJlcG9zaXRvcnk7XHJcblxyXG4gICAgbGVmdFN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICByaWdodFN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2U7XHJcblxyXG4gICAgbGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudDogU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQ7XHJcbiAgICBzeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHM6IFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50W10gPSBbXTtcclxuXHJcbiAgICBsYXN0U2hvd25IaXN0b3J5RWxlbWVudDogSGlzdG9yeUVsZW1lbnQ7XHJcbiAgICBoaXN0b3J5RWxlbWVudHM6IEhpc3RvcnlFbGVtZW50W10gPSBbXTtcclxuXHJcbiAgICB0aW1lcjogYW55O1xyXG5cclxuICAgIHJlcG9zaXRvcnlJc1dyaXRhYmxlOiBib29sZWFuO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtYWluOiBNYWluKSB7XHJcbiAgICB9XHJcblxyXG4gICAgc3luY2hyb25pemVXaXRoV29ya3NwYWNlKHdvcmtzcGFjZTogV29ya3NwYWNlKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZ2FpblJlcG9zaXRvcnlMb2NrKHdvcmtzcGFjZS5yZXBvc2l0b3J5X2lkLCAoc3VjY2VzcykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvc2l0b3J5SXNXcml0YWJsZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvV29ya3NwYWNlQW5kUmVwb3NpdG9yeSh3b3Jrc3BhY2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lciA9IHNldEludGVydmFsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5nYWluUmVwb3NpdG9yeUxvY2sodGhpcy5jdXJyZW50UmVwb3NpdG9yeS5pZCwgKHN1Y2Nlc3MpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFzdWNjZXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGVydCgnRGVyIFNlcnZlciBpc3QgdGVtcG9yw6RyIG5pY2h0IGVycmVpY2hiYXIuJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgIH0sIDEwMDAwKVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgLy8gVXNlciBoYXMgbm8gd3JpdGUgcGVybWlzc2lvbiB0byByZXBvc2l0b3J5ID0+IG5vIGxvY2sgbmVlZGVkLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb1dvcmtzcGFjZUFuZFJlcG9zaXRvcnkod29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVwb3NpdG9yeUlzV3JpdGFibGUgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvdygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdhaW5SZXBvc2l0b3J5TG9jayhyZXBvc2l0b3J5X2lkOiBudW1iZXIsIGNhbGxiYWNrOiAoc3VjY2VzczogYm9vbGVhbikgPT4gdm9pZCkge1xyXG4gICAgICAgIGxldCByZXF1ZXN0OiBHYWluUmVwb3NpdG9yeUxvY2tSZXF1ZXN0ID0geyByZXBvc2l0b3J5X2lkOiByZXBvc2l0b3J5X2lkIH07XHJcbiAgICAgICAgYWpheCgnZ2FpblJlcG9zaXRvcnlMb2NrJywgcmVxdWVzdCwgKHJlc3BvbnNlOiBHYWluUmVwb3NpdG9yeUxvY2tSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhyZXNwb25zZS5zdWNjZXNzKTtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJMb2NrIGZvciByZXBvc2l0b3J5X2lkIFwiICsgcmVwb3NpdG9yeV9pZCArIFwiIGhhcyBiZWVuIGdyYW50ZWQuXCIpXHJcbiAgICAgICAgfSwgKG1lc3NhZ2UpID0+IHtcclxuICAgICAgICAgICAgYWxlcnQobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBhdHRhY2hUb1dvcmtzcGFjZUFuZFJlcG9zaXRvcnkod29ya3NwYWNlOiBXb3Jrc3BhY2UpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2UgPSBuZXcgU3luY2hyb1dvcmtzcGFjZSh0aGlzKS5jb3B5RnJvbVdvcmtzcGFjZSh3b3Jrc3BhY2UpO1xyXG4gICAgICAgIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZTtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogR2V0UmVwb3NpdG9yeVJlcXVlc3QgPSB7IHJlcG9zaXRvcnlfaWQ6IHdvcmtzcGFjZS5yZXBvc2l0b3J5X2lkLCB3b3Jrc3BhY2VfaWQ6IHdvcmtzcGFjZS5pZCB9O1xyXG4gICAgICAgIGFqYXgoXCJnZXRSZXBvc2l0b3J5XCIsIHJlcXVlc3QsIChyZXNwb25zZTogR2V0UmVwb3NpdG9yeVJlc3BvbnNlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0aGF0LmF0dGFjaFRvUmVwb3NpdG9yeShyZXNwb25zZS5yZXBvc2l0b3J5KTtcclxuXHJcbiAgICAgICAgfSwgKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChtZXNzYWdlKTtcclxuICAgICAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGF0dGFjaFRvUmVwb3NpdG9yeShyZXBvc2l0b3J5OiBSZXBvc2l0b3J5KSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UmVwb3NpdG9yeSA9IHJlcG9zaXRvcnk7XHJcbiAgICAgICAgUmVwb3NpdG9yeVRvb2wuZGVzZXJpYWxpemVSZXBvc2l0b3J5KHRoaXMuY3VycmVudFJlcG9zaXRvcnkpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhpcykuY29weUZyb21SZXBvc2l0b3J5KHRoaXMuY3VycmVudFJlcG9zaXRvcnksIHRydWUpO1xyXG5cclxuICAgICAgICB0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZSA9IHRoaXMuY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgICAgIHRoaXMuc2V0dXBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMoKTtcclxuICAgICAgICB0aGlzLnNldHVwSGlzdG9yeUVsZW1lbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0dXBIaXN0b3J5RWxlbWVudHMoKSB7XHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeVNjcm9sbERpdi5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuaGlzdG9yeUVsZW1lbnRzID0gW107XHJcbiAgICAgICAgdGhpcy5sYXN0U2hvd25IaXN0b3J5RWxlbWVudCA9IG51bGw7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFJlcG9zaXRvcnkuaGlzdG9yeUVudHJpZXMuZm9yRWFjaCgoaGUsIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuaGlzdG9yeUVsZW1lbnRzLnB1c2gobmV3IEhpc3RvcnlFbGVtZW50KHRoaXMsIHRoaXMuY3VycmVudFJlcG9zaXRvcnksIGhlLCBpbmRleCkpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCkge1xyXG5cclxuICAgICAgICBsZXQgbGFzdFN5bmNocm9GaWxlTGVmdCA9IG51bGw7XHJcbiAgICAgICAgbGV0IGxhc3RTeW5jaHJvRmlsZVJpZ2h0ID0gbnVsbDtcclxuICAgICAgICBpZiAodGhpcy5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGFzdFN5bmNocm9GaWxlTGVmdCA9IHRoaXMubGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudC5sZWZ0U3luY2hyb0ZpbGU7XHJcbiAgICAgICAgICAgIGxhc3RTeW5jaHJvRmlsZVJpZ2h0ID0gdGhpcy5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50LnJpZ2h0U3luY2hyb0ZpbGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdERpdnMuZm9yRWFjaCgkZGl2ID0+ICRkaXYuZW1wdHkoKSk7XHJcblxyXG4gICAgICAgIHRoaXMuc3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzLmZvckVhY2goc2UgPT4gc2UuZW1wdHlHVUkoKSk7XHJcbiAgICAgICAgdGhpcy5zeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMgPSBbXTtcclxuICAgICAgICB0aGlzLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICBsZXQgZmlsZUVsZW1lbnRzOiBGaWxlRWxlbWVudFtdID0gW107XHJcbiAgICAgICAgbGV0IHN5bmNocm9GaWxlTWFwOiB7IFtpZDogbnVtYmVyXTogRmlsZUVsZW1lbnQgfSA9IHt9O1xyXG5cclxuICAgICAgICB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlLmZpbGVzLmZvckVhY2goc2ZpbGUgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZmlsZUVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5LFxyXG4gICAgICAgICAgICAgICAgbmFtZTogc2ZpbGUubmFtZSxcclxuICAgICAgICAgICAgICAgIGxlZnRTeW5jaHJvRmlsZTogc2ZpbGUsXHJcbiAgICAgICAgICAgICAgICByaWdodFN5bmNocm9GaWxlOiBudWxsXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBmaWxlRWxlbWVudHMucHVzaChmaWxlRWxlbWVudCk7XHJcbiAgICAgICAgICAgIGlmIChzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnkgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc3luY2hyb0ZpbGVNYXBbc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5XSA9IGZpbGVFbGVtZW50O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMucmlnaHRTeW5jaHJvV29ya3NwYWNlLmZpbGVzLmZvckVhY2goc2ZpbGUgPT4ge1xyXG4gICAgICAgICAgICBsZXQgZmlsZUVsZW1lbnQ6IEZpbGVFbGVtZW50ID0gbnVsbDtcclxuICAgICAgICAgICAgaWYgKHNmaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSAhPSBudWxsKSBmaWxlRWxlbWVudCA9IHN5bmNocm9GaWxlTWFwW3NmaWxlLmlkSW5zaWRlUmVwb3NpdG9yeV07XHJcbiAgICAgICAgICAgIGlmIChmaWxlRWxlbWVudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5LFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IHNmaWxlLm5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgbGVmdFN5bmNocm9GaWxlOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgIHJpZ2h0U3luY2hyb0ZpbGU6IHNmaWxlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgZmlsZUVsZW1lbnRzLnB1c2goZmlsZUVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZmlsZUVsZW1lbnQucmlnaHRTeW5jaHJvRmlsZSA9IHNmaWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZpbGVFbGVtZW50cy5zb3J0KChmZTEsIGZlMikgPT4gZmUxLm5hbWUubG9jYWxlQ29tcGFyZShmZTIubmFtZSkpO1xyXG5cclxuICAgICAgICBmaWxlRWxlbWVudHMuZm9yRWFjaChmZSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3luY2hyb0xpc3RFbGVtZW50ID0gbmV3IFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50KHRoaXMsIGZlLmxlZnRTeW5jaHJvRmlsZSwgZmUucmlnaHRTeW5jaHJvRmlsZSwgdGhpcy5sZWZ0U3luY2hyb1dvcmtzcGFjZSwgdGhpcy5yaWdodFN5bmNocm9Xb3Jrc3BhY2UpO1xyXG4gICAgICAgICAgICB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cy5wdXNoKHN5bmNocm9MaXN0RWxlbWVudCk7XHJcbiAgICAgICAgICAgIHN5bmNocm9MaXN0RWxlbWVudC5jb21wYXJlRmlsZXNBbmRBZGFwdEdVSSgpO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5kaWZmRWRpdG9yLnNldE1vZGVsKHtcclxuICAgICAgICAgICAgb3JpZ2luYWw6IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJXw6RobGVuIFNpZSBvYmVuIGVpbmUgRGF0ZWkgYXVzIVwiLCBcIm15SmF2YVwiKSxcclxuICAgICAgICAgICAgbW9kaWZpZWQ6IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJXw6RobGVuIFNpZSBvYmVuIGVpbmUgRGF0ZWkgYXVzIVwiLCBcIm15SmF2YVwiKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpZmZFZGl0b3IudXBkYXRlT3B0aW9ucyh7XHJcbiAgICAgICAgICAgIG9yaWdpbmFsRWRpdGFibGU6IGZhbHNlXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPT0gdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2UpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXIoXCJsZWZ0XCIsIFwiRGVpbiBXb3Jrc3BhY2U6XCIpO1xyXG4gICAgICAgICAgICB0aGlzLiRiYWNrVG9Xb3Jrc3BhY2VCdXR0b24uaGlkZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVyKFwibGVmdFwiLCB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlLm5hbWUgKyBcIjpcIik7XHJcbiAgICAgICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5zaG93KCk7XHJcbiAgICAgICAgICAgIHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5yaWdodFN5bmNocm9Xb3Jrc3BhY2UgPT0gdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2UpIHtcclxuICAgICAgICAgICAgbGV0IHdyaXRhYmxlOiBzdHJpbmcgPSB0aGlzLnJlcG9zaXRvcnlJc1dyaXRhYmxlID8gXCIsIG1pdCBTY2hyZWlienVncmlmZlwiIDogXCIsIG9obmUgU2NocmVpYnp1Z3JpZmZcIjtcclxuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXIoXCJyaWdodFwiLCBcIlJlcG9zaXRvcnkgKGFrdHVlbGxlIFZlcnNpb25cIiArIHdyaXRhYmxlICsgXCIpOlwiKTtcclxuICAgICAgICAgICAgdGhpcy4kYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uQnV0dG9uLmhpZGUoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcihcInJpZ2h0XCIsIHRoaXMucmlnaHRTeW5jaHJvV29ya3NwYWNlLm5hbWUgKyBcIjpcIik7XHJcbiAgICAgICAgICAgIHRoaXMuJGJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbkJ1dHRvbi5zaG93KCk7XHJcbiAgICAgICAgICAgIHRoaXMuJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b24uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgalF1ZXJ5KCcjam9fc3luY2hyb19tYWluX2hlYWRpbmdfdGV4dCcpLnRleHQoYFN5bmNocm9uaXNpZXJlbiBtaXQgUmVwb3NpdG9yeSBcIiR7dGhpcy5jdXJyZW50UmVwb3NpdG9yeS5uYW1lfVwiYCk7XHJcblxyXG4gICAgICAgIGxldCBsYXN0RmlsZVNlbGVjdGVkOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICAgICAgaWYgKGxhc3RTeW5jaHJvRmlsZUxlZnQgIT0gbnVsbCB8fCBsYXN0U3luY2hyb0ZpbGVSaWdodCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHNsZSBvZiB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKFxyXG4gICAgICAgICAgICAgICAgICAgIHNsZS5sZWZ0U3luY2hyb0ZpbGUgIT0gbnVsbCAmJiBzbGUubGVmdFN5bmNocm9GaWxlID09IGxhc3RTeW5jaHJvRmlsZUxlZnQgfHxcclxuICAgICAgICAgICAgICAgICAgICBzbGUucmlnaHRTeW5jaHJvRmlsZSAhPSBudWxsICYmIHNsZS5yaWdodFN5bmNocm9GaWxlID09IGxhc3RTeW5jaHJvRmlsZVJpZ2h0XHJcbiAgICAgICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgICAgICBzbGUuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFzdEZpbGVTZWxlY3RlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghbGFzdEZpbGVTZWxlY3RlZCAmJiB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzWzBdLnNlbGVjdCgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2hvdygpIHtcclxuICAgICAgICBpZiAoIXRoaXMuZ3VpUmVhZHkpIHtcclxuICAgICAgICAgICAgdGhpcy5pbml0R1VJKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCAkc3luY2hyb0RpdiA9IGpRdWVyeSgnI3N5bmNocm9uaXplLWRpdicpO1xyXG4gICAgICAgICRzeW5jaHJvRGl2LmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XHJcbiAgICAgICAgbGV0ICRtYWluRGl2ID0galF1ZXJ5KCcjbWFpbicpO1xyXG4gICAgICAgICRtYWluRGl2LmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcclxuXHJcbiAgICAgICAgdGhpcy4kd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuICAgICAgICB0aGlzLiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMubWFpbi53aW5kb3dTdGF0ZU1hbmFnZXIucmVnaXN0ZXJPbmVUaW1lQmFja0J1dHRvbkxpc3RlbmVyKCgpID0+IHtcclxuICAgICAgICAgICAgdGhhdC5oaWRlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZSgpIHtcclxuICAgICAgICBsZXQgJHN5bmNocm9EaXYgPSBqUXVlcnkoJyNzeW5jaHJvbml6ZS1kaXYnKTtcclxuICAgICAgICAkc3luY2hyb0Rpdi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICAgICAgbGV0ICRtYWluRGl2ID0galF1ZXJ5KCcjbWFpbicpO1xyXG4gICAgICAgICRtYWluRGl2LmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XHJcblxyXG4gICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBMZWFzZVJlcG9zaXRvcnlMb2NrUmVxdWVzdCA9IHsgcmVwb3NpdG9yeV9pZDogdGhpcy5jdXJyZW50UmVwb3NpdG9yeS5pZCB9O1xyXG4gICAgICAgIGFqYXgoJ2xlYXNlUmVwb3NpdG9yeUxvY2snLCByZXF1ZXN0LCAocmVzcG9uc2U6IExlYXNlUmVwb3NpdG9yeUxvY2tSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkxvY2sgZm9yIHJlcG9zaXRvcnlfaWQgXCIgKyByZXF1ZXN0LnJlcG9zaXRvcnlfaWQgKyBcIiBoYXMgYmVlbiByZWxlYXNlZC5cIilcclxuICAgICAgICB9LCAobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRHVUkoKSB7XHJcbiAgICAgICAgdGhpcy5ndWlSZWFkeSA9IHRydWU7XHJcbiAgICAgICAgbGV0ICRzeW5jaHJvRGl2ID0galF1ZXJ5KCcjc3luY2hyb25pemUtZGl2Jyk7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICAkc3luY2hyb0Rpdi5hcHBlbmQoXHJcblxyXG4gICAgICAgICAgICB0aGlzLiRtYWluSGVhZGluZ0RpdiA9IGpRdWVyeSgnPGRpdiBpZD1cImpvX3N5bmNocm9fbWFpbl9oZWFkaW5nXCI+PHNwYW4gaWQ9XCJqb19zeW5jaHJvX21haW5faGVhZGluZ190ZXh0XCI+SmF2YS1PbmxpbmU6IFdvcmtzcGFjZSBtaXQgUmVwb3NpdG9yeSBzeW5jaHJvbmlzaWVyZW48L3NwYW4+PC9kaXY+JyksXHJcblxyXG4gICAgICAgICAgICB0aGlzLiRiZWxvd01haW5IZWFkaW5nRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fYmVsb3dfbWFpbl9oZWFkaW5nXCIpKTtcclxuXHJcbiAgICAgICAgbGV0ICRidXR0b25zVG9wUmlnaHREaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19idXR0b25zVG9wUmlnaHRcIik7XHJcbiAgICAgICAgdGhpcy4kbWFpbkhlYWRpbmdEaXYuYXBwZW5kKCRidXR0b25zVG9wUmlnaHREaXYpO1xyXG5cclxuICAgICAgICAkYnV0dG9uc1RvcFJpZ2h0RGl2LmFwcGVuZCh0aGlzLiRleGl0QnV0dG9uID0galF1ZXJ5KCc8ZGl2IGlkPVwiam9fc3luY2hyb19leGl0QnV0dG9uXCIgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvblwiPlp1csO8Y2sgenVtIFByb2dyYW1taWVyZW48L2Rpdj4nKSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGV4aXRCdXR0b24ub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB3aW5kb3cuaGlzdG9yeS5iYWNrKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGxlZnREaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19sZWZ0RGl2XCIpO1xyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlPdXRlckRpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2hpc3RvcnlPdXRlckRpdlwiKTtcclxuXHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeU91dGVyRGl2LmFwcGVuZChqUXVlcnkoJzxkaXYgaWQ9XCJqb19zeW5jaHJvX2hpc3RvcnlIZWFkZXJcIj48ZGl2IGNsYXNzPVwiam9fc3luY2hyb190YWJIZWFkaW5nXCI+SGlzdG9yeTo8L2Rpdj48L2Rpdj4pJykpO1xyXG5cclxuICAgICAgICB0aGlzLiRiZWxvd01haW5IZWFkaW5nRGl2LmFwcGVuZCh0aGlzLiRsZWZ0RGl2LCB0aGlzLiRoaXN0b3J5T3V0ZXJEaXYpO1xyXG5cclxuICAgICAgICBuZXcgRW1iZWRkZWRTbGlkZXIodGhpcy4kaGlzdG9yeU91dGVyRGl2LCB0cnVlLCBmYWxzZSwgKCkgPT4geyB0aGlzLmRpZmZFZGl0b3IubGF5b3V0KCk7IH0pLiRzbGlkZXJEaXYuY3NzKCdsZWZ0JywgJy0zcHgnKTtcclxuICAgICAgICB0aGlzLiRoaXN0b3J5T3V0ZXJEaXYuZmluZCgnLmpvZV9zbGlkZXInKS5jc3MoJ3Bvc2l0aW9uJywgJ2Fic29sdXRlJyk7XHJcblxyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlTY3JvbGxEaXYgPSBtYWtlRGl2KFwiaGlzdG9yeVNjcm9sbERpdlwiLCBcImpvX3Nyb2xsYWJsZVwiKTtcclxuICAgICAgICB0aGlzLiRoaXN0b3J5T3V0ZXJEaXYuYXBwZW5kKHRoaXMuJGhpc3RvcnlTY3JvbGxEaXYpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy4kbGVmdERpdi5hcHBlbmQoXHJcbiAgICAgICAgICAgIHRoaXMuJGxlZnRVcHBlckRpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2xlZnRVcHBlclwiKSxcclxuICAgICAgICAgICAgdGhpcy4kZWRpdG9yRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fZWRpdG9yXCIpXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdGhpcy4kbGVmdFVwcGVyRGl2LmFwcGVuZChcclxuICAgICAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJPdXRlckRpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2ZpbGVMaXN0SGVhZGVyT3V0ZXJcIiksXHJcbiAgICAgICAgICAgIHRoaXMuJGZpbGVMaXN0T3V0ZXJEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19maWxlTGlzdE91dGVyXCIsIFwiam9fc2Nyb2xsYWJsZVwiKSxcclxuICAgICAgICAgICAgdGhpcy4kZmlsZUxpc3RGb290ZXJEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19maWxlTGlzdEZvb3RlclwiKVxyXG4gICAgICAgIClcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJDb250YWluZXJSaWdodCA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0SGVhZGVyQ29udGFpbmVyUmlnaHRcIik7XHJcbiAgICAgICAgbGV0IGZpbGVMaXN0SGVhZGVyUmlnaHQgPSBtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdEhlYWRlclwiKTtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckNvbnRhaW5lclJpZ2h0LmFwcGVuZChmaWxlTGlzdEhlYWRlclJpZ2h0KTtcclxuXHJcbiAgICAgICAgbGV0ICRmaWxlTGlzdEhlYWRlckNlbnRlciA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0SGVhZGVyQ2VudGVyXCIpO1xyXG4gICAgICAgICRmaWxlTGlzdEhlYWRlckNlbnRlci5hcHBlbmQodGhpcy4kdXBkYXRlQWxsQnV0dG9uID0gU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQubWFrZUJ1dHRvbihcInVwZGF0ZUFsbFwiLCBcImxlZnRcIiwgKCkgPT4geyB0aGF0LnVwZGF0ZUFsbCgpIH0pKTtcclxuICAgICAgICAkZmlsZUxpc3RIZWFkZXJDZW50ZXIuYXBwZW5kKHRoaXMuJGNvbW1pdEFsbEJ1dHRvbiA9IFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50Lm1ha2VCdXR0b24oXCJjb21taXRBbGxcIiwgXCJyaWdodFwiLCAoKSA9PiB7IHRoYXQuY29tbWl0QWxsKCkgfSkpO1xyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnMucHVzaChtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdEhlYWRlclwiLCBcIlwiLCB7IFwiZmxleFwiOiBcIjIgMFwiIH0pLCAkZmlsZUxpc3RIZWFkZXJDZW50ZXIsIHRoaXMuJGZpbGVMaXN0SGVhZGVyQ29udGFpbmVyUmlnaHQsIG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX3Njcm9sbGJhclBsYWNlaG9sZGVyXCIpKTtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdERpdnMucHVzaChtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdFwiKSwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RCdXR0b25zTGVmdFwiKSwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RCdXR0b25zUmlnaHRcIiksIG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0XCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJPdXRlckRpdi5hcHBlbmQodGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzKTtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdE91dGVyRGl2LmFwcGVuZCh0aGlzLiRmaWxlTGlzdERpdnMpO1xyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnNbMF0uYXBwZW5kKFwiPGRpdiBjbGFzcz0nam9fc3luY2hyb190YWJIZWFkaW5nJz5EZWluIFdvcmtzcGFjZTo8L2Rpdj5cIik7XHJcbiAgICAgICAgZmlsZUxpc3RIZWFkZXJSaWdodC5hcHBlbmQoXCI8ZGl2IGNsYXNzPSdqb19zeW5jaHJvX3RhYkhlYWRpbmcnPlJlcG9zaXRvcnkgKGFrdHVlbGxlIFZlcnNpb24pOjwvZGl2PlwiKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyRGl2c1swXS5hcHBlbmQodGhpcy4kYmFja1RvV29ya3NwYWNlQnV0dG9uID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fc3luY2hyb19idXR0b24gam9fc3luY2hyb19iYWNrVG9CdXR0b25cIj5aZWlnZSBlaWdlbmVuIFdvcmtzcGFjZTwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiRiYWNrVG9Xb3Jrc3BhY2VCdXR0b24ub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LmJhY2tUb1dvcmtzcGFjZSgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5oaWRlKCk7XHJcblxyXG5cclxuXHJcblxyXG4gICAgICAgIGZpbGVMaXN0SGVhZGVyUmlnaHQuYXBwZW5kKHRoaXMuJGJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbkJ1dHRvbiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX3N5bmNocm9fYnV0dG9uIGpvX3N5bmNocm9fYmFja1RvQnV0dG9uXCI+WmVpZ2UgYWt0dWVsbGUgUmVwb3NpdG9yeS1WZXJzaW9uPC9kaXY+JykpO1xyXG4gICAgICAgIHRoaXMuJGJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbkJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy4kYmFja1RvV29ya3NwYWNlQnV0dG9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzWzBdLmFwcGVuZCh0aGlzLiR3cml0ZVdvcmtzcGFjZUNoYW5nZXNCdXR0b24gPSBqUXVlcnkoJzxkaXYgaWQ9XCJqb19zeW5jaHJvX3dyaXRlQ2hhbmdlc0J1dHRvblwiIGNsYXNzPVwiam9fc3luY2hyb19idXR0b25cIj7DhG5kZXJ1bmdlbiBhbSBXb3Jrc3BhY2UgKHJvdCEpIHNwZWljaGVybjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiR3cml0ZVdvcmtzcGFjZUNoYW5nZXNCdXR0b24ub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LndyaXRlV29ya3NwYWNlQ2hhbmdlcygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIGZpbGVMaXN0SGVhZGVyUmlnaHQuYXBwZW5kKHRoaXMuJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b24gPSBqUXVlcnkoJzxkaXYgaWQ9XCJqb19zeW5jaHJvX3dyaXRlQ2hhbmdlc0J1dHRvblwiIGNsYXNzPVwiam9fc3luY2hyb19idXR0b25cIj7DhG5kZXJ1bmdlbiBhbSBSZXBvc2l0b3J5IChyb3QhKSBzcGVpY2hlcm48L2Rpdj4nKSk7XHJcbiAgICAgICAgdGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQud3JpdGVSZXBvc2l0b3J5Q2hhbmdlcygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b24uaGlkZSgpO1xyXG5cclxuXHJcblxyXG5cclxuICAgICAgICBsZXQgaG9yaXpvbnRhbFNsaWRlciA9IG5ldyBFbWJlZGRlZFNsaWRlcih0aGlzLiRlZGl0b3JEaXYsIHRydWUsIHRydWUsICgpID0+IHsgdGhpcy5kaWZmRWRpdG9yLmxheW91dCgpOyB9KTtcclxuICAgICAgICBob3Jpem9udGFsU2xpZGVyLnNldENvbG9yKCd2YXIoLS1zbGlkZXIpJyk7XHJcblxyXG4gICAgICAgIHRoaXMubWFrZURyb3BwYWJsZShcImxlZnRcIiwgdGhpcy4kZmlsZUxpc3REaXZzWzBdKTtcclxuICAgICAgICB0aGlzLm1ha2VEcm9wcGFibGUoXCJyaWdodFwiLCB0aGlzLiRmaWxlTGlzdERpdnNbM10pO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRFZGl0b3IoKTtcclxuICAgIH1cclxuXHJcbiAgICBiYWNrVG9Xb3Jrc3BhY2UoKSB7XHJcbiAgICAgICAgdGhpcy5sZWZ0U3luY2hyb1dvcmtzcGFjZSA9IHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgICAgIHRoaXMuc2V0dXBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMoKTtcclxuICAgICAgICB0aGlzLm9uQ29udGVudENoYW5nZWQoXCJsZWZ0XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbigpIHtcclxuICAgICAgICB0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZSA9IHRoaXMuY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgICAgIHRoaXMuc2V0dXBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMoKTtcclxuICAgICAgICB0aGlzLm9uQ29udGVudENoYW5nZWQoXCJyaWdodFwiKTtcclxuICAgIH1cclxuXHJcbiAgICBtYWtlRHJvcHBhYmxlKGxlZnRSaWdodDogTGVmdFJpZ2h0LCAkZHJvcFpvbmVEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD4pIHtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgJGRyb3Bab25lRGl2Lm9uKFwiZHJhZ292ZXJcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgJGRyb3Bab25lRGl2LmFkZENsYXNzKCdqb19zeW5jaHJvX2RyYWdab25lJyk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZHJvcFpvbmVEaXYub24oXCJkcmFnbGVhdmVcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAkZHJvcFpvbmVEaXYucmVtb3ZlQ2xhc3MoJ2pvX3N5bmNocm9fZHJhZ1pvbmUnKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICAkZHJvcFpvbmVEaXYub24oXCJkcm9wXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBzdyA9IG5ldyBTeW5jaHJvV29ya3NwYWNlKHRoYXQpLmNvcHlGcm9tSGlzdG9yeUVsZW1lbnQoSGlzdG9yeUVsZW1lbnQuY3VycmVudGx5RHJhZ2dlZCk7XHJcbiAgICAgICAgICAgIHN3aXRjaCAobGVmdFJpZ2h0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwibGVmdFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSBzdztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyaWdodFwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQucmlnaHRTeW5jaHJvV29ya3NwYWNlID0gc3c7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC5zZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpO1xyXG4gICAgICAgICAgICAkZHJvcFpvbmVEaXYucmVtb3ZlQ2xhc3MoJ2pvX3N5bmNocm9fZHJhZ1pvbmUnKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRIZWFkZXIobGVmdFJpZ2h0OiBMZWZ0UmlnaHQsIGNhcHRpb246IHN0cmluZykge1xyXG4gICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gbGVmdFJpZ2h0ID09IFwibGVmdFwiID8gMCA6IDI7XHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzW2luZGV4XS5maW5kKCcuam9fc3luY2hyb190YWJIZWFkaW5nJykudGV4dChjYXB0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICB3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzKCkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIGxldCAkZGlhbG9nRGl2ID0gbWFrZURpdihcIlwiLCBcImpvX3N5bmNocm9fY29tbWl0RGlhbG9nRGl2XCIpO1xyXG4gICAgICAgICRkaWFsb2dEaXYuaGlkZSgpO1xyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyQ29udGFpbmVyUmlnaHQuYXBwZW5kKCRkaWFsb2dEaXYpO1xyXG5cclxuICAgICAgICAkZGlhbG9nRGl2LmFwcGVuZChtYWtlRGl2KFwiXCIsIFwiam9fc3luY2hyb19jb21taXREaWFsb2dDYXB0aW9uXCIsIFwiQml0dGUgYmVzY2hyZWliZSBrdXJ6IGRpZSB2b3JnZW5vbW1lbmVuIMOEbmRlcnVuZ2VuIGFtIFJlcG9zaXRvcnk6XCIpKTtcclxuICAgICAgICBsZXQgJGRpYWxvZ1RleHRhcmVhOiBKUXVlcnk8SFRNTFRleHRBcmVhRWxlbWVudD4gPSBqUXVlcnkoJzx0ZXh0YXJlYSBjbGFzcz1cImpvX3N5bmNocm9fY29tbWl0RGlhbG9nVGV4dGFyZWFcIj48L3RleHRhcmVhPicpO1xyXG4gICAgICAgICRkaWFsb2dEaXYuYXBwZW5kKCRkaWFsb2dUZXh0YXJlYSk7XHJcblxyXG4gICAgICAgIGxldCAkZGlhbG9nQnV0dG9uRGl2ID0gbWFrZURpdihcIlwiLCBcImpvX3N5bmNocm9fY29tbWl0RGlhbG9nQnV0dG9uRGl2XCIpO1xyXG4gICAgICAgICRkaWFsb2dEaXYuYXBwZW5kKCRkaWFsb2dCdXR0b25EaXYpO1xyXG5cclxuICAgICAgICBsZXQgJGJ1dHRvbkNhbmNlbCA9IG1ha2VEaXYoXCJcIiwgXCJqb19zeW5jaHJvX2J1dHRvblwiLCBcIkFiYnJlY2hlblwiLCB7IFwiYmFja2dyb3VuZC1jb2xvclwiOiBcInZhcigtLXVwZGF0ZUJ1dHRvbkJhY2tncm91bmQpXCIsIFwiY29sb3JcIjogXCJ2YXIoLS11cGRhdGVCdXR0b25Db2xvcilcIiB9KVxyXG4gICAgICAgICRkaWFsb2dCdXR0b25EaXYuYXBwZW5kKCRidXR0b25DYW5jZWwpO1xyXG5cclxuICAgICAgICAkYnV0dG9uQ2FuY2VsLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAkZGlhbG9nRGl2LnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGF0LiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLnNob3coKTtcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBsZXQgJGJ1dHRvbk9LID0gbWFrZURpdihcIlwiLCBcImpvX3N5bmNocm9fYnV0dG9uXCIsIFwiT0tcIiwgeyBcImJhY2tncm91bmQtY29sb3JcIjogXCJ2YXIoLS1jcmVhdGVCdXR0b25CYWNrZ3JvdW5kKVwiLCBcImNvbG9yXCI6IFwidmFyKC0tY3JlYXRlQnV0dG9uQ29sb3IpXCIgfSlcclxuICAgICAgICAkZGlhbG9nQnV0dG9uRGl2LmFwcGVuZCgkYnV0dG9uT0spO1xyXG5cclxuICAgICAgICAkZGlhbG9nRGl2LnNob3coNjAwKTtcclxuXHJcbiAgICAgICAgJGJ1dHRvbk9LLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY29tbWVudCA9IDxzdHJpbmc+JGRpYWxvZ1RleHRhcmVhLnZhbCgpO1xyXG4gICAgICAgICAgICAkZGlhbG9nRGl2LnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2UuY29tbWl0KHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlLmNvcGllZEZyb21Xb3Jrc3BhY2UsIHRoaXMuY3VycmVudFJlcG9zaXRvcnksIGNvbW1lbnQsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4sIChyZXBvc2l0b3J5OiBSZXBvc2l0b3J5LCBlcnJvck1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3JNZXNzYWdlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb1dvcmtzcGFjZUFuZFJlcG9zaXRvcnkodGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2UuY29waWVkRnJvbVdvcmtzcGFjZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb1JlcG9zaXRvcnkocmVwb3NpdG9yeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b24uaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgJGRpYWxvZ1RleHRhcmVhLmZvY3VzKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlV29ya3NwYWNlQ2hhbmdlcygpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZS53cml0ZUNoYW5nZXNUb1dvcmtzcGFjZSgpO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhpcykuY29weUZyb21Xb3Jrc3BhY2UodGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2UuY29waWVkRnJvbVdvcmtzcGFjZSk7XHJcbiAgICAgICAgdGhpcy5sZWZ0U3luY2hyb1dvcmtzcGFjZSA9IHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgICAgIHRoaXMuc2V0dXBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMoKTtcclxuICAgICAgICB0aGlzLiR3cml0ZVdvcmtzcGFjZUNoYW5nZXNCdXR0b24uaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRFZGl0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5kaWZmRWRpdG9yID0gbW9uYWNvLmVkaXRvci5jcmVhdGVEaWZmRWRpdG9yKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiam9fc3luY2hyb19lZGl0b3JcIiksIHtcclxuICAgICAgICAgICAgb3JpZ2luYWxFZGl0YWJsZTogdHJ1ZSwgLy8gZm9yIGxlZnQgcGFuZVxyXG4gICAgICAgICAgICByZWFkT25seTogdHJ1ZSwgICAgICAgICAvLyBmb3IgcmlnaHQgcGFuZVxyXG4gICAgICAgICAgICBhdXRvbWF0aWNMYXlvdXQ6IHRydWVcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbkNvbnRlbnRDaGFuZ2VkKGxlZnRSaWdodDogTGVmdFJpZ2h0KSB7XHJcbiAgICAgICAgbGV0ICRidXR0b246IEpRdWVyeTxIVE1MRGl2RWxlbWVudD4gPSBsZWZ0UmlnaHQgPT0gXCJsZWZ0XCIgPyB0aGlzLiR3cml0ZVdvcmtzcGFjZUNoYW5nZXNCdXR0b24gOiB0aGlzLiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uXHJcbiAgICAgICAgbGV0IHN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2UgPSBsZWZ0UmlnaHQgPT0gXCJsZWZ0XCIgPyB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZSA6IHRoaXMuY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlO1xyXG5cclxuICAgICAgICBpZiAoc3luY2hyb1dvcmtzcGFjZS5oYXNDaGFuZ2VzKCkpIHtcclxuICAgICAgICAgICAgJGJ1dHRvbi5zaG93KCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJGJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVBbGwoKSB7XHJcbiAgICAgICAgbGV0IHVwZGF0ZUJ1dHRvbnMgPSB0aGlzLiRmaWxlTGlzdERpdnNbMV0uZmluZCgnLmpvX3N5bmNocm9fdXBkYXRlQnV0dG9uJyk7XHJcbiAgICAgICAgdXBkYXRlQnV0dG9ucy5jbGljaygpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbW1pdEFsbCgpIHtcclxuICAgICAgICBsZXQgY29tbWl0QnV0dG9ucyA9IHRoaXMuJGZpbGVMaXN0RGl2c1syXS5maW5kKCcuam9fc3luY2hyb19jb21taXRCdXR0b24nKTtcclxuICAgICAgICBjb21taXRCdXR0b25zLmNsaWNrKCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHVwZGF0ZUNlbnRlckJ1dHRvbnMoKSB7XHJcbiAgICAgICAgbGV0IHVwZGF0ZUJ1dHRvbnMgPSB0aGlzLiRmaWxlTGlzdERpdnNbMV0uZmluZCgnLmpvX3N5bmNocm9fdXBkYXRlQnV0dG9uJyk7XHJcbiAgICAgICAgaWYgKHVwZGF0ZUJ1dHRvbnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICB0aGlzLiR1cGRhdGVBbGxCdXR0b24uY3NzKFwidmlzaWJpbGl0eVwiLCBcImluaGVyaXRcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kdXBkYXRlQWxsQnV0dG9uLmNzcyhcInZpc2liaWxpdHlcIiwgXCJoaWRkZW5cIik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29tbWl0QnV0dG9ucyA9IHRoaXMuJGZpbGVMaXN0RGl2c1syXS5maW5kKCcuam9fc3luY2hyb19jb21taXRCdXR0b24nKTtcclxuICAgICAgICBpZiAoY29tbWl0QnV0dG9ucy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGNvbW1pdEFsbEJ1dHRvbi5jc3MoXCJ2aXNpYmlsaXR5XCIsIFwiaW5oZXJpdFwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRjb21taXRBbGxCdXR0b24uY3NzKFwidmlzaWJpbGl0eVwiLCBcImhpZGRlblwiKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==