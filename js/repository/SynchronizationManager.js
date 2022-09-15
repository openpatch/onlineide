import { EmbeddedSlider } from "../embedded/EmbeddedSlider.js";
import { makeDiv } from "../tools/HtmlTools.js";
import { SynchronizationListElement } from "./SynchronizationListElement.js";
import { ajax } from "../communication/AjaxHelper.js";
import { RepositoryTool } from "./RepositoryTool.js";
import { HistoryElement } from "./HistoryElement.js";
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
    attachToWorkspaceAndRepository(workspace) {
        this.currentUserSynchroWorkspace = new SynchroWorkspace(this).copyFromWorkspace(workspace);
        this.leftSynchroWorkspace = this.currentUserSynchroWorkspace;
        let that = this;
        let request = { repository_id: workspace.repository_id, workspace_id: workspace.id };
        ajax("getRepository", request, (response) => {
            that.attachToRepository(response.repository);
        }, (message) => {
            alert(message);
            this.hide();
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
        this.lastShownSynchronizationElement = null;
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
        }
        if (this.rightSynchroWorkspace == this.currentRepositorySynchroWorkspace) {
            this.setHeader("right", "Repository (aktuelle Version):");
            this.$backToCurrentRepositoryVersionButton.hide();
        }
        else {
            this.setHeader("right", this.rightSynchroWorkspace.name + ":");
            this.$backToCurrentRepositoryVersionButton.show();
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
    }
    hide() {
        let $synchroDiv = jQuery('#synchronize-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
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
            that.hide();
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
        this.$fileListHeaderDivs.push(makeDiv(null, "jo_synchro_fileListHeader"), makeDiv(null, "jo_synchro_fileListHeaderCenter"), makeDiv(null, "jo_synchro_fileListHeader"), makeDiv(null, "jo_synchro_scrollbarPlaceholder"));
        this.$fileListDivs.push(makeDiv(null, "jo_synchro_fileList"), makeDiv(null, "jo_synchro_fileListButtonsLeft"), makeDiv(null, "jo_synchro_fileListButtonsRight"), makeDiv(null, "jo_synchro_fileList"));
        this.$fileListHeaderOuterDiv.append(this.$fileListHeaderDivs);
        this.$fileListOuterDiv.append(this.$fileListDivs);
        this.$fileListHeaderDivs[0].append("<div class='jo_synchro_tabHeading'>Dein Workspace:</div>");
        this.$fileListHeaderDivs[2].append("<div class='jo_synchro_tabHeading'>Repository (aktuelle Version):</div>");
        this.$fileListHeaderDivs[0].append(this.$backToWorkspaceButton = jQuery('<div class="jo_synchro_button jo_synchro_backToButton">Zeige eigenen Workspace</div>'));
        this.$backToWorkspaceButton.on('click', () => {
            that.backToWorkspace();
        });
        this.$backToWorkspaceButton.hide();
        this.$fileListHeaderDivs[2].append(this.$backToCurrentRepositoryVersionButton = jQuery('<div class="jo_synchro_button jo_synchro_backToButton">Zeige aktuelle Repository-Version</div>'));
        this.$backToCurrentRepositoryVersionButton.on('click', () => {
            that.backToCurrentRepositoryVersion();
        });
        this.$backToWorkspaceButton.hide();
        this.$fileListHeaderDivs[0].append(this.$writeWorkspaceChangesButton = jQuery('<div id="jo_synchro_writeChangesButton" class="jo_synchro_button">Änderungen am Workspace speichern</div>'));
        this.$writeWorkspaceChangesButton.on('click', () => {
            that.writeWorkspaceChanges();
        });
        this.$writeWorkspaceChangesButton.hide();
        this.$fileListHeaderDivs[2].append(this.$writeRepositoryChangesButton = jQuery('<div id="jo_synchro_writeChangesButton" class="jo_synchro_button">Änderungen am Repository speichern</div>'));
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
    }
    backToCurrentRepositoryVersion() {
        this.rightSynchroWorkspace = this.currentRepositorySynchroWorkspace;
        this.setupSynchronizationListElements();
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
        this.currentRepositorySynchroWorkspace.commit(this.currentUserSynchroWorkspace.copiedFromWorkspace, this.currentRepository, "Test-Comment", this.main, (repository, errorMessage) => {
            if (errorMessage != null) {
                alert(errorMessage);
                this.attachToWorkspaceAndRepository(this.currentRepositorySynchroWorkspace.copiedFromWorkspace);
            }
            else {
                this.attachToRepository(repository);
            }
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY2hyb25pemF0aW9uTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvcmVwb3NpdG9yeS9TeW5jaHJvbml6YXRpb25NYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUvRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDaEQsT0FBTyxFQUFhLDBCQUEwQixFQUFFLE1BQU0saUNBQWlDLENBQUM7QUFFeEYsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ3RELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUVyRCxPQUFPLEVBQUUsY0FBYyxFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDckQsT0FBTyxFQUFFLGdCQUFnQixFQUFlLE1BQU0sdUJBQXVCLENBQUM7QUFZdEUsTUFBTSxPQUFPLHNCQUFzQjtJQThDL0IsWUFBbUIsSUFBVTtRQUFWLFNBQUksR0FBSixJQUFJLENBQU07UUF6QjdCLHdCQUFtQixHQUE2QixFQUFFLENBQUM7UUFHbkQsa0JBQWEsR0FBNkIsRUFBRSxDQUFDO1FBTTdDLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFXMUIsZ0NBQTJCLEdBQWlDLEVBQUUsQ0FBQztRQUcvRCxvQkFBZSxHQUFxQixFQUFFLENBQUM7SUFHdkMsQ0FBQztJQUdELDhCQUE4QixDQUFDLFNBQW9CO1FBRS9DLElBQUksQ0FBQywyQkFBMkIsR0FBRyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQzNGLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsMkJBQTJCLENBQUM7UUFFN0QsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksT0FBTyxHQUF5QixFQUFFLGFB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OlsiaW1wb3J0IHsgUmVwb3NpdG9yeUZpbGVFbnRyeSwgUmVwb3NpdG9yeSwgR2V0UmVwb3NpdG9yeVJlcXVlc3QsIEdldFJlcG9zaXRvcnlSZXNwb25zZSwgUmVwb3NpdG9yeUhpc3RvcnlGaWxlRW50cnksIFJlcG9zaXRvcnlIaXN0b3J5RW50cnkgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IEZpbGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBFbWJlZGRlZFNsaWRlciB9IGZyb20gXCIuLi9lbWJlZGRlZC9FbWJlZGRlZFNsaWRlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRGl2IH0gZnJvbSBcIi4uL3Rvb2xzL0h0bWxUb29scy5qc1wiO1xyXG5pbXBvcnQgeyBMZWZ0UmlnaHQsIFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50IH0gZnJvbSBcIi4vU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeVRvb2wgfSBmcm9tIFwiLi9SZXBvc2l0b3J5VG9vbC5qc1wiO1xyXG5pbXBvcnQgeyBSZXBlYXRUeXBlQ2xhc3MgfSBmcm9tIFwiLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUmVwZWF0VHlwZS5qc1wiO1xyXG5pbXBvcnQgeyBIaXN0b3J5RWxlbWVudCB9IGZyb20gXCIuL0hpc3RvcnlFbGVtZW50LmpzXCI7XHJcbmltcG9ydCB7IFN5bmNocm9Xb3Jrc3BhY2UsIFN5bmNocm9GaWxlIH0gZnJvbSBcIi4vU3luY2hyb1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBUZWFjaGVyc1dpdGhDbGFzc2VzTUkgfSBmcm9tIFwiLi4vYWRtaW5pc3RyYXRpb24vVGVhY2hlcnNXaXRoQ2xhc3Nlcy5qc1wiO1xyXG5pbXBvcnQgeyBUaWxpbmdTcHJpdGUgfSBmcm9tIFwicGl4aS5qc1wiO1xyXG5cclxuXHJcbnR5cGUgRmlsZUVsZW1lbnQgPSB7XHJcbiAgICBpZDogbnVtYmVyLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgbGVmdFN5bmNocm9GaWxlOiBTeW5jaHJvRmlsZSxcclxuICAgIHJpZ2h0U3luY2hyb0ZpbGU6IFN5bmNocm9GaWxlXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBTeW5jaHJvbml6YXRpb25NYW5hZ2VyIHtcclxuXHJcbiAgICAkbWFpbkhlYWRpbmdEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47IC8vIGhlYWRpbmcgXCJKYXZhLU9ubGluZTogU3luY2hyb25pemUgcmVwb3NpdG9yaWVzXCJcclxuXHJcbiAgICAkd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG4gICAgJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b246IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuICAgICRiYWNrVG9DdXJyZW50UmVwb3NpdG9yeVZlcnNpb25CdXR0b246IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJGV4aXRCdXR0b246IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJGJlbG93TWFpbkhlYWRpbmdEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47IC8vIGNvbnRhaW5zIGFsbCBlbGVtZW50cyBiZWxvdyBtYWluIGhlYWRpbmdcclxuXHJcbiAgICAkbGVmdERpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjsgLy8gY29udGFpbnMgaGVhZGluZ3MsIGZpbGUgbGlzdHMgYW5kIGVkaXRvcnNcclxuICAgICRoaXN0b3J5T3V0ZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47IC8vIGNvbnRhaW5zIGhpc3RvcnlcclxuICAgICRoaXN0b3J5U2Nyb2xsRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgICRsZWZ0VXBwZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47IC8vIGNvbnRhaW5zIGZpbGUgbGlzdCBoZWFkZXIsIGZpbGUgbGlzdCBhbmQgZmlsZSBsaXN0IGZvb3RlclxyXG5cclxuICAgICRmaWxlTGlzdEhlYWRlck91dGVyRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG4gICAgJGZpbGVMaXN0SGVhZGVyRGl2czogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PltdID0gW107XHJcblxyXG4gICAgJGZpbGVMaXN0T3V0ZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkZmlsZUxpc3REaXZzOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+W10gPSBbXTtcclxuXHJcbiAgICAkZmlsZUxpc3RGb290ZXJEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJGVkaXRvckRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICBndWlSZWFkeTogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgZGlmZkVkaXRvcjogbW9uYWNvLmVkaXRvci5JU3RhbmRhbG9uZURpZmZFZGl0b3I7XHJcblxyXG4gICAgY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgY3VycmVudFJlcG9zaXRvcnlTeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlO1xyXG4gICAgY3VycmVudFJlcG9zaXRvcnk6IFJlcG9zaXRvcnk7XHJcblxyXG4gICAgbGVmdFN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICByaWdodFN5bmNocm9Xb3Jrc3BhY2U6IFN5bmNocm9Xb3Jrc3BhY2U7XHJcblxyXG4gICAgbGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudDogU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQ7XHJcbiAgICBzeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHM6IFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50W10gPSBbXTtcclxuXHJcbiAgICBsYXN0U2hvd25IaXN0b3J5RWxlbWVudDogSGlzdG9yeUVsZW1lbnQ7XHJcbiAgICBoaXN0b3J5RWxlbWVudHM6IEhpc3RvcnlFbGVtZW50W10gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgbWFpbjogTWFpbikge1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhdHRhY2hUb1dvcmtzcGFjZUFuZFJlcG9zaXRvcnkod29ya3NwYWNlOiBXb3Jrc3BhY2UpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2UgPSBuZXcgU3luY2hyb1dvcmtzcGFjZSh0aGlzKS5jb3B5RnJvbVdvcmtzcGFjZSh3b3Jrc3BhY2UpO1xyXG4gICAgICAgIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZTtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogR2V0UmVwb3NpdG9yeVJlcXVlc3QgPSB7IHJlcG9zaXRvcnlfaWQ6IHdvcmtzcGFjZS5yZXBvc2l0b3J5X2lkLCB3b3Jrc3BhY2VfaWQ6IHdvcmtzcGFjZS5pZCB9O1xyXG4gICAgICAgIGFqYXgoXCJnZXRSZXBvc2l0b3J5XCIsIHJlcXVlc3QsIChyZXNwb25zZTogR2V0UmVwb3NpdG9yeVJlc3BvbnNlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0aGF0LmF0dGFjaFRvUmVwb3NpdG9yeShyZXNwb25zZS5yZXBvc2l0b3J5KTtcclxuXHJcbiAgICAgICAgfSwgKG1lc3NhZ2U6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChtZXNzYWdlKTtcclxuICAgICAgICAgICAgdGhpcy5oaWRlKCk7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICB9XHJcblxyXG4gICAgYXR0YWNoVG9SZXBvc2l0b3J5KHJlcG9zaXRvcnk6IFJlcG9zaXRvcnkpIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5ID0gcmVwb3NpdG9yeTtcclxuICAgICAgICBSZXBvc2l0b3J5VG9vbC5kZXNlcmlhbGl6ZVJlcG9zaXRvcnkodGhpcy5jdXJyZW50UmVwb3NpdG9yeSk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2UgPSBuZXcgU3luY2hyb1dvcmtzcGFjZSh0aGlzKS5jb3B5RnJvbVJlcG9zaXRvcnkodGhpcy5jdXJyZW50UmVwb3NpdG9yeSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMucmlnaHRTeW5jaHJvV29ya3NwYWNlID0gdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICAgICAgdGhpcy5zZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpO1xyXG4gICAgICAgIHRoaXMuc2V0dXBIaXN0b3J5RWxlbWVudHMoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXR1cEhpc3RvcnlFbGVtZW50cygpIHtcclxuICAgICAgICB0aGlzLiRoaXN0b3J5U2Nyb2xsRGl2LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy5oaXN0b3J5RWxlbWVudHMgPSBbXTtcclxuICAgICAgICB0aGlzLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5Lmhpc3RvcnlFbnRyaWVzLmZvckVhY2goKGhlLCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmhpc3RvcnlFbGVtZW50cy5wdXNoKG5ldyBIaXN0b3J5RWxlbWVudCh0aGlzLCB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5LCBoZSwgaW5kZXgpKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpIHtcclxuXHJcbiAgICAgICAgbGV0IGxhc3RTeW5jaHJvRmlsZUxlZnQgPSBudWxsO1xyXG4gICAgICAgIGxldCBsYXN0U3luY2hyb0ZpbGVSaWdodCA9IG51bGw7XHJcbiAgICAgICAgaWYodGhpcy5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50ICE9IG51bGwpe1xyXG4gICAgICAgICAgICBsYXN0U3luY2hyb0ZpbGVMZWZ0ID0gdGhpcy5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50LmxlZnRTeW5jaHJvRmlsZTtcclxuICAgICAgICAgICAgbGFzdFN5bmNocm9GaWxlUmlnaHQgPSB0aGlzLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQucmlnaHRTeW5jaHJvRmlsZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0RGl2cy5mb3JFYWNoKCRkaXYgPT4gJGRpdi5lbXB0eSgpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMuZm9yRWFjaChzZSA9PiBzZS5lbXB0eUdVSSgpKTtcclxuICAgICAgICB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cyA9IFtdO1xyXG4gICAgICAgIHRoaXMubGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudCA9IG51bGw7XHJcblxyXG4gICAgICAgIGxldCBmaWxlRWxlbWVudHM6IEZpbGVFbGVtZW50W10gPSBbXTtcclxuICAgICAgICBsZXQgc3luY2hyb0ZpbGVNYXA6IHsgW2lkOiBudW1iZXJdOiBGaWxlRWxlbWVudCB9ID0ge307XHJcblxyXG4gICAgICAgIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UuZmlsZXMuZm9yRWFjaChzZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWxlRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgICAgIGlkOiBzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnksXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzZmlsZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbGVmdFN5bmNocm9GaWxlOiBzZmlsZSxcclxuICAgICAgICAgICAgICAgIHJpZ2h0U3luY2hyb0ZpbGU6IG51bGxcclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIGZpbGVFbGVtZW50cy5wdXNoKGZpbGVFbGVtZW50KTtcclxuICAgICAgICAgICAgaWYgKHNmaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBzeW5jaHJvRmlsZU1hcFtzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnldID0gZmlsZUVsZW1lbnQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5yaWdodFN5bmNocm9Xb3Jrc3BhY2UuZmlsZXMuZm9yRWFjaChzZmlsZSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWxlRWxlbWVudDogRmlsZUVsZW1lbnQgPSBudWxsO1xyXG4gICAgICAgICAgICBpZiAoc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5ICE9IG51bGwpIGZpbGVFbGVtZW50ID0gc3luY2hyb0ZpbGVNYXBbc2ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5XTtcclxuICAgICAgICAgICAgaWYgKGZpbGVFbGVtZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZpbGVFbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBzZmlsZS5pZEluc2lkZVJlcG9zaXRvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogc2ZpbGUubmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0U3luY2hyb0ZpbGU6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgcmlnaHRTeW5jaHJvRmlsZTogc2ZpbGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBmaWxlRWxlbWVudHMucHVzaChmaWxlRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmaWxlRWxlbWVudC5yaWdodFN5bmNocm9GaWxlID0gc2ZpbGU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZmlsZUVsZW1lbnRzLnNvcnQoKGZlMSwgZmUyKSA9PiBmZTEubmFtZS5sb2NhbGVDb21wYXJlKGZlMi5uYW1lKSk7XHJcblxyXG4gICAgICAgIGZpbGVFbGVtZW50cy5mb3JFYWNoKGZlID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBzeW5jaHJvTGlzdEVsZW1lbnQgPSBuZXcgU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQodGhpcywgZmUubGVmdFN5bmNocm9GaWxlLCBmZS5yaWdodFN5bmNocm9GaWxlLCB0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlLCB0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZSk7XHJcbiAgICAgICAgICAgIHRoaXMuc3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzLnB1c2goc3luY2hyb0xpc3RFbGVtZW50KTtcclxuICAgICAgICAgICAgc3luY2hyb0xpc3RFbGVtZW50LmNvbXBhcmVGaWxlc0FuZEFkYXB0R1VJKCk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmRpZmZFZGl0b3Iuc2V0TW9kZWwoe1xyXG4gICAgICAgICAgICBvcmlnaW5hbDogbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlfDpGhsZW4gU2llIG9iZW4gZWluZSBEYXRlaSBhdXMhXCIsIFwibXlKYXZhXCIpLFxyXG4gICAgICAgICAgICBtb2RpZmllZDogbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlfDpGhsZW4gU2llIG9iZW4gZWluZSBEYXRlaSBhdXMhXCIsIFwibXlKYXZhXCIpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGlmZkVkaXRvci51cGRhdGVPcHRpb25zKHtcclxuICAgICAgICAgICAgb3JpZ2luYWxFZGl0YWJsZTogZmFsc2VcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5sZWZ0U3luY2hyb1dvcmtzcGFjZSA9PSB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcihcImxlZnRcIiwgXCJEZWluIFdvcmtzcGFjZTpcIik7XHJcbiAgICAgICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXIoXCJsZWZ0XCIsIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UubmFtZSArIFwiOlwiKTtcclxuICAgICAgICAgICAgdGhpcy4kYmFja1RvV29ya3NwYWNlQnV0dG9uLnNob3coKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZSA9PSB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldEhlYWRlcihcInJpZ2h0XCIsIFwiUmVwb3NpdG9yeSAoYWt0dWVsbGUgVmVyc2lvbik6XCIpO1xyXG4gICAgICAgICAgICB0aGlzLiRiYWNrVG9DdXJyZW50UmVwb3NpdG9yeVZlcnNpb25CdXR0b24uaGlkZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVyKFwicmlnaHRcIiwgdGhpcy5yaWdodFN5bmNocm9Xb3Jrc3BhY2UubmFtZSArIFwiOlwiKTtcclxuICAgICAgICAgICAgdGhpcy4kYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uQnV0dG9uLnNob3coKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2pvX3N5bmNocm9fbWFpbl9oZWFkaW5nX3RleHQnKS50ZXh0KGBTeW5jaHJvbmlzaWVyZW4gbWl0IFJlcG9zaXRvcnkgXCIke3RoaXMuY3VycmVudFJlcG9zaXRvcnkubmFtZX1cImApO1xyXG5cclxuICAgICAgICBsZXQgbGFzdEZpbGVTZWxlY3RlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG4gICAgICAgIGlmKGxhc3RTeW5jaHJvRmlsZUxlZnQgIT0gbnVsbCB8fCBsYXN0U3luY2hyb0ZpbGVSaWdodCAhPSBudWxsKXtcclxuICAgICAgICAgICAgZm9yKGxldCBzbGUgb2YgdGhpcy5zeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudHMpe1xyXG4gICAgICAgICAgICAgICAgaWYoXHJcbiAgICAgICAgICAgICAgICAgICAgc2xlLmxlZnRTeW5jaHJvRmlsZSAhPSBudWxsICYmIHNsZS5sZWZ0U3luY2hyb0ZpbGUgPT0gbGFzdFN5bmNocm9GaWxlTGVmdCB8fCBcclxuICAgICAgICAgICAgICAgICAgICBzbGUucmlnaHRTeW5jaHJvRmlsZSAhPSBudWxsICYmIHNsZS5yaWdodFN5bmNocm9GaWxlID09IGxhc3RTeW5jaHJvRmlsZVJpZ2h0ICBcclxuICAgICAgICAgICAgICAgICAgICApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzbGUuc2VsZWN0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RGaWxlU2VsZWN0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCFsYXN0RmlsZVNlbGVjdGVkICYmIHRoaXMuc3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICB0aGlzLnN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50c1swXS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNob3coKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmd1aVJlYWR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEdVSSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgJHN5bmNocm9EaXYgPSBqUXVlcnkoJyNzeW5jaHJvbml6ZS1kaXYnKTtcclxuICAgICAgICAkc3luY2hyb0Rpdi5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgICAgIGxldCAkbWFpbkRpdiA9IGpRdWVyeSgnI21haW4nKTtcclxuICAgICAgICAkbWFpbkRpdi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaGlkZSgpIHtcclxuICAgICAgICBsZXQgJHN5bmNocm9EaXYgPSBqUXVlcnkoJyNzeW5jaHJvbml6ZS1kaXYnKTtcclxuICAgICAgICAkc3luY2hyb0Rpdi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICAgICAgbGV0ICRtYWluRGl2ID0galF1ZXJ5KCcjbWFpbicpO1xyXG4gICAgICAgICRtYWluRGl2LmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuICAgICAgICB0aGlzLmd1aVJlYWR5ID0gdHJ1ZTtcclxuICAgICAgICBsZXQgJHN5bmNocm9EaXYgPSBqUXVlcnkoJyNzeW5jaHJvbml6ZS1kaXYnKTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgICRzeW5jaHJvRGl2LmFwcGVuZChcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJG1haW5IZWFkaW5nRGl2ID0galF1ZXJ5KCc8ZGl2IGlkPVwiam9fc3luY2hyb19tYWluX2hlYWRpbmdcIj48c3BhbiBpZD1cImpvX3N5bmNocm9fbWFpbl9oZWFkaW5nX3RleHRcIj5KYXZhLU9ubGluZTogV29ya3NwYWNlIG1pdCBSZXBvc2l0b3J5IHN5bmNocm9uaXNpZXJlbjwvc3Bhbj48L2Rpdj4nKSxcclxuXHJcbiAgICAgICAgICAgIHRoaXMuJGJlbG93TWFpbkhlYWRpbmdEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19iZWxvd19tYWluX2hlYWRpbmdcIikpO1xyXG5cclxuICAgICAgICBsZXQgJGJ1dHRvbnNUb3BSaWdodERpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2J1dHRvbnNUb3BSaWdodFwiKTtcclxuICAgICAgICB0aGlzLiRtYWluSGVhZGluZ0Rpdi5hcHBlbmQoJGJ1dHRvbnNUb3BSaWdodERpdik7XHJcblxyXG4gICAgICAgICRidXR0b25zVG9wUmlnaHREaXYuYXBwZW5kKHRoaXMuJGV4aXRCdXR0b24gPSBqUXVlcnkoJzxkaXYgaWQ9XCJqb19zeW5jaHJvX2V4aXRCdXR0b25cIiBjbGFzcz1cImpvX3N5bmNocm9fYnV0dG9uXCI+WnVyw7xjayB6dW0gUHJvZ3JhbW1pZXJlbjwvZGl2PicpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZXhpdEJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuaGlkZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRsZWZ0RGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fbGVmdERpdlwiKTtcclxuICAgICAgICB0aGlzLiRoaXN0b3J5T3V0ZXJEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19oaXN0b3J5T3V0ZXJEaXZcIik7XHJcblxyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlPdXRlckRpdi5hcHBlbmQoalF1ZXJ5KCc8ZGl2IGlkPVwiam9fc3luY2hyb19oaXN0b3J5SGVhZGVyXCI+PGRpdiBjbGFzcz1cImpvX3N5bmNocm9fdGFiSGVhZGluZ1wiPkhpc3Rvcnk6PC9kaXY+PC9kaXY+KScpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kYmVsb3dNYWluSGVhZGluZ0Rpdi5hcHBlbmQodGhpcy4kbGVmdERpdiwgdGhpcy4kaGlzdG9yeU91dGVyRGl2KTtcclxuXHJcbiAgICAgICAgbmV3IEVtYmVkZGVkU2xpZGVyKHRoaXMuJGhpc3RvcnlPdXRlckRpdiwgdHJ1ZSwgZmFsc2UsICgpID0+IHsgdGhpcy5kaWZmRWRpdG9yLmxheW91dCgpOyB9KS4kc2xpZGVyRGl2LmNzcygnbGVmdCcsICctM3B4Jyk7XHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeU91dGVyRGl2LmZpbmQoJy5qb2Vfc2xpZGVyJykuY3NzKCdwb3NpdGlvbicsICdhYnNvbHV0ZScpO1xyXG5cclxuICAgICAgICB0aGlzLiRoaXN0b3J5U2Nyb2xsRGl2ID0gbWFrZURpdihcImhpc3RvcnlTY3JvbGxEaXZcIiwgXCJqb19zcm9sbGFibGVcIik7XHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeU91dGVyRGl2LmFwcGVuZCh0aGlzLiRoaXN0b3J5U2Nyb2xsRGl2KTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuJGxlZnREaXYuYXBwZW5kKFxyXG4gICAgICAgICAgICB0aGlzLiRsZWZ0VXBwZXJEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19sZWZ0VXBwZXJcIiksXHJcbiAgICAgICAgICAgIHRoaXMuJGVkaXRvckRpdiA9IG1ha2VEaXYoXCJqb19zeW5jaHJvX2VkaXRvclwiKVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIHRoaXMuJGxlZnRVcHBlckRpdi5hcHBlbmQoXHJcbiAgICAgICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyT3V0ZXJEaXYgPSBtYWtlRGl2KFwiam9fc3luY2hyb19maWxlTGlzdEhlYWRlck91dGVyXCIpLFxyXG4gICAgICAgICAgICB0aGlzLiRmaWxlTGlzdE91dGVyRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fZmlsZUxpc3RPdXRlclwiLCBcImpvX3Njcm9sbGFibGVcIiksXHJcbiAgICAgICAgICAgIHRoaXMuJGZpbGVMaXN0Rm9vdGVyRGl2ID0gbWFrZURpdihcImpvX3N5bmNocm9fZmlsZUxpc3RGb290ZXJcIilcclxuICAgICAgICApXHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyRGl2cy5wdXNoKG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0SGVhZGVyXCIpLCBtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdEhlYWRlckNlbnRlclwiKSwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RIZWFkZXJcIiksIG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX3Njcm9sbGJhclBsYWNlaG9sZGVyXCIpKTtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdERpdnMucHVzaChtYWtlRGl2KG51bGwsIFwiam9fc3luY2hyb19maWxlTGlzdFwiKSwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RCdXR0b25zTGVmdFwiKSwgbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fZmlsZUxpc3RCdXR0b25zUmlnaHRcIiksIG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2ZpbGVMaXN0XCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJPdXRlckRpdi5hcHBlbmQodGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzKTtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdE91dGVyRGl2LmFwcGVuZCh0aGlzLiRmaWxlTGlzdERpdnMpO1xyXG5cclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnNbMF0uYXBwZW5kKFwiPGRpdiBjbGFzcz0nam9fc3luY2hyb190YWJIZWFkaW5nJz5EZWluIFdvcmtzcGFjZTo8L2Rpdj5cIik7XHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzWzJdLmFwcGVuZChcIjxkaXYgY2xhc3M9J2pvX3N5bmNocm9fdGFiSGVhZGluZyc+UmVwb3NpdG9yeSAoYWt0dWVsbGUgVmVyc2lvbik6PC9kaXY+XCIpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzWzBdLmFwcGVuZCh0aGlzLiRiYWNrVG9Xb3Jrc3BhY2VCdXR0b24gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvbiBqb19zeW5jaHJvX2JhY2tUb0J1dHRvblwiPlplaWdlIGVpZ2VuZW4gV29ya3NwYWNlPC9kaXY+JykpO1xyXG4gICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuYmFja1RvV29ya3NwYWNlKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy4kYmFja1RvV29ya3NwYWNlQnV0dG9uLmhpZGUoKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZUxpc3RIZWFkZXJEaXZzWzJdLmFwcGVuZCh0aGlzLiRiYWNrVG9DdXJyZW50UmVwb3NpdG9yeVZlcnNpb25CdXR0b24gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvbiBqb19zeW5jaHJvX2JhY2tUb0J1dHRvblwiPlplaWdlIGFrdHVlbGxlIFJlcG9zaXRvcnktVmVyc2lvbjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiRiYWNrVG9DdXJyZW50UmVwb3NpdG9yeVZlcnNpb25CdXR0b24ub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LmJhY2tUb0N1cnJlbnRSZXBvc2l0b3J5VmVyc2lvbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJGJhY2tUb1dvcmtzcGFjZUJ1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyRGl2c1swXS5hcHBlbmQodGhpcy4kd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uID0galF1ZXJ5KCc8ZGl2IGlkPVwiam9fc3luY2hyb193cml0ZUNoYW5nZXNCdXR0b25cIiBjbGFzcz1cImpvX3N5bmNocm9fYnV0dG9uXCI+w4RuZGVydW5nZW4gYW0gV29ya3NwYWNlIHNwZWljaGVybjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiR3cml0ZVdvcmtzcGFjZUNoYW5nZXNCdXR0b24ub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LndyaXRlV29ya3NwYWNlQ2hhbmdlcygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuJHdyaXRlV29ya3NwYWNlQ2hhbmdlc0J1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuJGZpbGVMaXN0SGVhZGVyRGl2c1syXS5hcHBlbmQodGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvbiA9IGpRdWVyeSgnPGRpdiBpZD1cImpvX3N5bmNocm9fd3JpdGVDaGFuZ2VzQnV0dG9uXCIgY2xhc3M9XCJqb19zeW5jaHJvX2J1dHRvblwiPsOEbmRlcnVuZ2VuIGFtIFJlcG9zaXRvcnkgc3BlaWNoZXJuPC9kaXY+JykpO1xyXG4gICAgICAgIHRoaXMuJHdyaXRlUmVwb3NpdG9yeUNoYW5nZXNCdXR0b24ub24oJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LndyaXRlUmVwb3NpdG9yeUNoYW5nZXMoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLiR3cml0ZVJlcG9zaXRvcnlDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuXHJcblxyXG5cclxuXHJcbiAgICAgICAgbGV0IGhvcml6b250YWxTbGlkZXIgPSBuZXcgRW1iZWRkZWRTbGlkZXIodGhpcy4kZWRpdG9yRGl2LCB0cnVlLCB0cnVlLCAoKSA9PiB7IHRoaXMuZGlmZkVkaXRvci5sYXlvdXQoKTsgfSk7XHJcbiAgICAgICAgaG9yaXpvbnRhbFNsaWRlci5zZXRDb2xvcigndmFyKC0tc2xpZGVyKScpO1xyXG5cclxuICAgICAgICB0aGlzLm1ha2VEcm9wcGFibGUoXCJsZWZ0XCIsIHRoaXMuJGZpbGVMaXN0RGl2c1swXSk7XHJcbiAgICAgICAgdGhpcy5tYWtlRHJvcHBhYmxlKFwicmlnaHRcIiwgdGhpcy4kZmlsZUxpc3REaXZzWzNdKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0RWRpdG9yKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYmFja1RvV29ya3NwYWNlKCkge1xyXG4gICAgICAgIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZTtcclxuICAgICAgICB0aGlzLnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgYmFja1RvQ3VycmVudFJlcG9zaXRvcnlWZXJzaW9uKCkge1xyXG4gICAgICAgIHRoaXMucmlnaHRTeW5jaHJvV29ya3NwYWNlID0gdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2U7XHJcbiAgICAgICAgdGhpcy5zZXR1cFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50cygpO1xyXG4gICAgfVxyXG5cclxuICAgIG1ha2VEcm9wcGFibGUobGVmdFJpZ2h0OiBMZWZ0UmlnaHQsICRkcm9wWm9uZURpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAkZHJvcFpvbmVEaXYub24oXCJkcmFnb3ZlclwiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAkZHJvcFpvbmVEaXYuYWRkQ2xhc3MoJ2pvX3N5bmNocm9fZHJhZ1pvbmUnKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkcm9wWm9uZURpdi5vbihcImRyYWdsZWF2ZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICRkcm9wWm9uZURpdi5yZW1vdmVDbGFzcygnam9fc3luY2hyb19kcmFnWm9uZScpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRkcm9wWm9uZURpdi5vbihcImRyb3BcIiwgKGUpID0+IHtcclxuICAgICAgICAgICAgbGV0IHN3ID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhhdCkuY29weUZyb21IaXN0b3J5RWxlbWVudChIaXN0b3J5RWxlbWVudC5jdXJyZW50bHlEcmFnZ2VkKTtcclxuICAgICAgICAgICAgc3dpdGNoIChsZWZ0UmlnaHQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb1dvcmtzcGFjZSA9IHN3O1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJpZ2h0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yaWdodFN5bmNocm9Xb3Jrc3BhY2UgPSBzdztcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0LnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICRkcm9wWm9uZURpdi5yZW1vdmVDbGFzcygnam9fc3luY2hyb19kcmFnWm9uZScpO1xyXG4gICAgICAgIH0pXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEhlYWRlcihsZWZ0UmlnaHQ6IExlZnRSaWdodCwgY2FwdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBsZWZ0UmlnaHQgPT0gXCJsZWZ0XCIgPyAwIDogMjtcclxuICAgICAgICB0aGlzLiRmaWxlTGlzdEhlYWRlckRpdnNbaW5kZXhdLmZpbmQoJy5qb19zeW5jaHJvX3RhYkhlYWRpbmcnKS50ZXh0KGNhcHRpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlUmVwb3NpdG9yeUNoYW5nZXMoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UmVwb3NpdG9yeVN5bmNocm9Xb3Jrc3BhY2UuY29tbWl0KHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlLmNvcGllZEZyb21Xb3Jrc3BhY2UsIHRoaXMuY3VycmVudFJlcG9zaXRvcnksIFwiVGVzdC1Db21tZW50XCIsXHJcbiAgICAgICAgICAgIHRoaXMubWFpbiwgKHJlcG9zaXRvcnk6IFJlcG9zaXRvcnksIGVycm9yTWVzc2FnZTogc3RyaW5nKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yTWVzc2FnZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0dGFjaFRvV29ya3NwYWNlQW5kUmVwb3NpdG9yeSh0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZS5jb3BpZWRGcm9tV29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdHRhY2hUb1JlcG9zaXRvcnkocmVwb3NpdG9yeSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB3cml0ZVdvcmtzcGFjZUNoYW5nZXMoKSB7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2Uud3JpdGVDaGFuZ2VzVG9Xb3Jrc3BhY2UoKTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZSA9IG5ldyBTeW5jaHJvV29ya3NwYWNlKHRoaXMpLmNvcHlGcm9tV29ya3NwYWNlKHRoaXMuY3VycmVudFVzZXJTeW5jaHJvV29ya3NwYWNlLmNvcGllZEZyb21Xb3Jrc3BhY2UpO1xyXG4gICAgICAgIHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSB0aGlzLmN1cnJlbnRVc2VyU3luY2hyb1dvcmtzcGFjZTtcclxuICAgICAgICB0aGlzLnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICAgICAgdGhpcy4kd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uLmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBpbml0RWRpdG9yKCkge1xyXG4gICAgICAgIHRoaXMuZGlmZkVkaXRvciA9IG1vbmFjby5lZGl0b3IuY3JlYXRlRGlmZkVkaXRvcihkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImpvX3N5bmNocm9fZWRpdG9yXCIpLCB7XHJcbiAgICAgICAgICAgIG9yaWdpbmFsRWRpdGFibGU6IHRydWUsIC8vIGZvciBsZWZ0IHBhbmVcclxuICAgICAgICAgICAgcmVhZE9ubHk6IHRydWUsICAgICAgICAgLy8gZm9yIHJpZ2h0IHBhbmVcclxuICAgICAgICAgICAgYXV0b21hdGljTGF5b3V0OiB0cnVlXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25Db250ZW50Q2hhbmdlZChsZWZ0UmlnaHQ6IExlZnRSaWdodCkge1xyXG4gICAgICAgIGxldCAkYnV0dG9uOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+ID0gbGVmdFJpZ2h0ID09IFwibGVmdFwiID8gdGhpcy4kd3JpdGVXb3Jrc3BhY2VDaGFuZ2VzQnV0dG9uIDogdGhpcy4kd3JpdGVSZXBvc2l0b3J5Q2hhbmdlc0J1dHRvblxyXG4gICAgICAgIGxldCBzeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlID0gbGVmdFJpZ2h0ID09IFwibGVmdFwiID8gdGhpcy5jdXJyZW50VXNlclN5bmNocm9Xb3Jrc3BhY2UgOiB0aGlzLmN1cnJlbnRSZXBvc2l0b3J5U3luY2hyb1dvcmtzcGFjZTtcclxuXHJcbiAgICAgICAgaWYgKHN5bmNocm9Xb3Jrc3BhY2UuaGFzQ2hhbmdlcygpKSB7XHJcbiAgICAgICAgICAgICRidXR0b24uc2hvdygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRidXR0b24uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxufSJdfQ==