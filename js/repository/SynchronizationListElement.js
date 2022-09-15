import { makeDiv } from "../tools/HtmlTools.js";
export class SynchronizationListElement {
    constructor(manager, leftSynchroFile, rightSynchroFile, leftSynchroWorkspace, rightSynchroWorkspace) {
        this.manager = manager;
        this.leftSynchroFile = leftSynchroFile;
        this.rightSynchroFile = rightSynchroFile;
        this.leftSynchroWorkspace = leftSynchroWorkspace;
        this.rightSynchroWorkspace = rightSynchroWorkspace;
        this.$buttons = [];
        this.pending = false;
        this.$leftFileDiv = makeDiv(null, "jo_synchro_workspaceFileDiv jo_synchro_listDiv");
        this.$buttonLeftDiv = makeDiv(null, "jo_synchro_buttonDiv jo_synchro_listDiv jo_synchro_buttonLeftDiv");
        this.$buttonRightDiv = makeDiv(null, "jo_synchro_buttonDiv jo_synchro_listDiv jo_synchro_buttonRightDiv");
        this.$rightFileDiv = makeDiv(null, "jo_synchro_repositoryFileDiv jo_synchro_listDiv");
        manager.$fileListDivs[0].append(this.$leftFileDiv);
        manager.$fileListDivs[1].append(this.$buttonLeftDiv);
        manager.$fileListDivs[2].append(this.$buttonRightDiv);
        manager.$fileListDivs[3].append(this.$rightFileDiv);
        if (leftSynchroFile != null && leftSynchroFile.state != "original")
            this.$leftFileDiv.addClass('jo_dirty');
        if (rightSynchroFile != null && rightSynchroFile.state != "original")
            this.$rightFileDiv.addClass('jo_dirty');
        let allDivs = [this.$leftFileDiv, this.$buttonLeftDiv, this.$buttonRightDiv, this.$rightFileDiv];
        let that = this;
        for (let $div of allDivs) {
            $div.on("mouseenter", () => {
                for (let $div of allDivs)
                    $div.addClass('jo_synchro_hoverLine');
            });
            $div.on("mouseleave", () => {
                for (let $div of allDivs)
                    $div.removeClass('jo_synchro_hoverLine').removeClass("jo_synchro_hoverActiveLine");
            });
            $div.on("mousedown", () => {
                for (let $div of allDivs)
                    $div.addClass('jo_synchro_hoverActiveLine');
            });
            $div.on("mouseup", () => { for (let $div of allDivs)
                $div.removeClass('jo_synchro_hoverActiveLine'); });
            $div.on("click", () => {
                that.select();
            });
        }
        this.createLeftFileModel();
        this.createRightFileModel();
    }
    select() {
        var _a;
        let allDivs = [this.$leftFileDiv, this.$buttonLeftDiv, this.$buttonRightDiv, this.$rightFileDiv];
        jQuery('#jo_synchro_fileListOuter').find('.jo_synchro_activeLine').removeClass('jo_synchro_activeLine');
        for (let $div of allDivs)
            $div.addClass('jo_synchro_activeLine');
        if (this.manager.lastShownSynchronizationElement != null) {
            this.manager.lastShownSynchronizationElement.editorState = this.manager.diffEditor.saveViewState();
        }
        this.manager.lastShownSynchronizationElement = this;
        this.setEditorModel();
        if (this.editorState != null) {
            this.manager.diffEditor.restoreViewState(this.editorState);
        }
        this.manager.diffEditor.updateOptions({
            originalEditable: ((_a = this.leftSynchroFile) === null || _a === void 0 ? void 0 : _a.originalText) != null
        });
    }
    createRightFileModel() {
        if (this.rightSynchroFile != null) {
            this.rightSynchroFile.monacoModel = monaco.editor.createModel(this.rightSynchroFile.text, "myJava");
        }
        else {
            this.rightSynchroFile.monacoModel = monaco.editor.createModel("", "myJava");
        }
    }
    setEditorModel() {
        if (this.manager.lastShownSynchronizationElement == this) {
            this.manager.diffEditor.setModel({
                original: this.leftSynchroFile == null ? this.getEmptyMonacoModel() : this.leftSynchroFile.monacoModel,
                modified: this.rightSynchroFile == null ? this.getEmptyMonacoModel() : this.rightSynchroFile.monacoModel
            });
        }
    }
    getEmptyMonacoModel() {
        return monaco.editor.createModel("", "myJava");
    }
    createLeftFileModel() {
        if (this.leftSynchroFile != null) {
            this.leftSynchroFile.monacoModel = monaco.editor.createModel(this.leftSynchroFile.text, "myJava");
            this.leftSynchroFile.monacoModel.onDidChangeContent((event) => {
                // throttle comparison to avoid editor-slowdown
                if (!this.pending) {
                    this.pending = true;
                    setTimeout(() => {
                        var _a, _b;
                        if (this.leftSynchroFile != null && ((_a = this.leftSynchroFile) === null || _a === void 0 ? void 0 : _a.state) != "deleted") {
                            if (((_b = this.leftSynchroFile) === null || _b === void 0 ? void 0 : _b.originalText) != null &&
                                this.leftSynchroFile.monacoModel.getValue(monaco.editor.EndOfLinePreference.LF, false) == this.leftSynchroFile.originalText) {
                                this.$leftFileDiv.removeClass("jo_dirty");
                                this.leftSynchroFile.state = "original";
                            }
                            else {
                                this.$leftFileDiv.addClass("jo_dirty");
                                this.leftSynchroFile.state = "changed";
                            }
                            this.manager.onContentChanged("left");
                        }
                        this.pending = false;
                    }, 700);
                }
            });
        }
    }
    onFileChanged(leftRight) {
        if (leftRight == "left") {
            this.createLeftFileModel();
        }
        else {
            this.createRightFileModel();
        }
        this.setEditorModel();
        this.compareFilesAndAdaptGUI();
        switch (leftRight) {
            case "left":
                if (this.leftSynchroFile != null && this.leftSynchroFile.state != "original") {
                    this.$leftFileDiv.addClass("jo_dirty");
                }
                else {
                    this.$leftFileDiv.removeClass("jo_dirty");
                }
                break;
            case "right":
                if (this.rightSynchroFile != null && this.rightSynchroFile.state != "original") {
                    this.$rightFileDiv.addClass("jo_dirty");
                }
                else {
                    this.$rightFileDiv.removeClass("jo_dirty");
                }
                break;
        }
        this.manager.onContentChanged(leftRight);
    }
    compareFilesAndAdaptGUI() {
        var _a;
        this.emptyGUI();
        let that = this;
        let leftCaption = "---";
        let leftVersionCaption = "";
        let needsMerge = false;
        if (this.leftSynchroFile != null) {
            leftCaption = this.leftSynchroFile.name;
            if (this.leftSynchroFile.idInsideRepository == null) {
                leftVersionCaption = "(ohne Version)";
            }
            else {
                leftVersionCaption = "(V " + this.leftSynchroFile.repository_file_version;
                if (this.rightSynchroFile != null && this.rightSynchroFile.repository_file_version == this.leftSynchroFile.repository_file_version && this.rightSynchroFile.text != this.leftSynchroFile.text) {
                    leftVersionCaption += '<span class="jo_synchro_withChanges"> mit Änderungen</span>';
                    needsMerge = !this.leftSynchroFile.markedAsMerged;
                }
                leftVersionCaption += ")";
            }
            if (this.leftSynchroFile.state == "deleted") {
                leftCaption += " - GELÖSCHT";
                leftVersionCaption = "";
            }
        }
        let rightCaption = this.rightSynchroFile == null ? "---" : this.rightSynchroFile.name;
        let rightVersionCaption = this.rightSynchroFile == null ? "" : "(V " + this.rightSynchroFile.repository_file_version + ")";
        if (((_a = this.rightSynchroFile) === null || _a === void 0 ? void 0 : _a.state) == "deleted") {
            rightCaption += " - GELÖSCHT";
            rightVersionCaption = "";
        }
        let $spacer1 = makeDiv("", "jo_synchro_5px_spacer");
        let $spacer2 = makeDiv("", "jo_synchro_5px_spacer");
        this.$buttonRightDiv.append($spacer2);
        if (this.leftSynchroFile == null) {
            if (this.leftSynchroWorkspace.isWritable()) {
                this.$buttonLeftDiv.append(this.makeButton("create", "left", () => {
                    that.leftSynchroFile = {
                        name: that.rightSynchroFile.name,
                        idInsideRepository: that.rightSynchroFile.idInsideRepository,
                        repository_file_version: that.rightSynchroFile.repository_file_version,
                        state: "new",
                        markedAsMerged: false,
                        text: this.rightSynchroFile.text,
                        synchroWorkspace: that.leftSynchroWorkspace,
                        idInsideWorkspace: null,
                        workspaceFile: null,
                        originalText: null,
                        monacoModel: null
                    };
                    that.leftSynchroWorkspace.files.push(that.leftSynchroFile);
                    that.onFileChanged("left");
                }));
            }
            if (that.rightSynchroWorkspace.isWritable()) {
                this.$buttonRightDiv.append(this.makeButton("delete", "right", () => {
                    that.rightSynchroFile.state = "deleted";
                    that.onFileChanged("right");
                }));
            }
        }
        else if (this.rightSynchroFile == null) {
            if (this.rightSynchroWorkspace.isWritable()) {
                this.$buttonRightDiv.append(this.makeButton("create", "right", () => {
                    that.rightSynchroFile = {
                        name: that.leftSynchroFile.name,
                        committedFromFile: that.leftSynchroWorkspace.isWritable() ? that.leftSynchroFile : null,
                        idInsideRepository: that.leftSynchroFile.idInsideRepository == null ? that.leftSynchroFile.idInsideWorkspace : that.leftSynchroFile.idInsideRepository,
                        repository_file_version: that.leftSynchroFile.repository_file_version == null ? 1 : that.leftSynchroFile.repository_file_version,
                        state: "new",
                        markedAsMerged: false,
                        text: this.leftSynchroFile.text,
                        synchroWorkspace: that.rightSynchroWorkspace,
                        idInsideWorkspace: null,
                        workspaceFile: null,
                        originalText: null,
                        monacoModel: null
                    };
                    that.onFileChanged("right");
                }));
            }
            if (that.leftSynchroWorkspace.isWritable()) {
                this.$buttonLeftDiv.append(this.makeButton("delete", "left", () => {
                    that.leftSynchroFile.state = "deleted";
                    that.onFileChanged("left");
                }));
            }
        }
        else {
            // Both SynchroFiles != null
            let isSynchronized = true;
            if (this.leftSynchroFile.repository_file_version == this.rightSynchroFile.repository_file_version) {
                if (this.leftSynchroFile.text != this.rightSynchroFile.text) {
                    isSynchronized = false;
                }
            }
            else {
                isSynchronized = false;
            }
            if (isSynchronized) {
                this.$buttonLeftDiv.append(jQuery('<div>synchron - </div>'));
                this.$buttonRightDiv.append(jQuery('<div> - synchron</div>'));
            }
            else {
                if (this.leftSynchroWorkspace.isWritable()) {
                    this.$buttonLeftDiv.append(this.makeButton("update", "left", () => {
                        that.leftSynchroFile.text = that.rightSynchroFile.text;
                        that.leftSynchroFile.repository_file_version = that.rightSynchroFile.repository_file_version;
                        that.leftSynchroFile.state = "changed";
                        that.onFileChanged("left");
                    }));
                }
                if (this.rightSynchroWorkspace.isWritable() && !needsMerge) {
                    this.$buttonRightDiv.append(this.makeButton("commit", "right", () => {
                        that.rightSynchroFile.text = that.leftSynchroFile.text;
                        that.rightSynchroFile.repository_file_version++;
                        if (that.leftSynchroWorkspace.isWritable())
                            that.rightSynchroFile.committedFromFile = that.leftSynchroFile;
                        if (that.leftSynchroWorkspace.isWritable()) {
                            that.leftSynchroFile.repository_file_version = that.rightSynchroFile.repository_file_version;
                        }
                        that.rightSynchroFile.state = "changed";
                        that.onFileChanged("right");
                    }));
                }
            }
        }
        this.$buttonLeftDiv.append($spacer1);
        this.$leftFileDiv.append(jQuery(`<div class="jo_synchro_filename">${leftCaption}<span class="jo_synchro_fileVersion">${leftVersionCaption}</span></div>`));
        this.$rightFileDiv.append(jQuery(`<div class="jo_synchro_filename">${rightCaption}<span class="jo_synchro_fileVersion">${rightVersionCaption}</span></div>`));
        if (needsMerge) {
            this.$markAsMergedButtonDiv = jQuery(`<div class="jo_synchro_button jo_synchro_markAsMergedButton">Als "merged" markieren</div>`);
            this.$leftFileDiv.append(this.$markAsMergedButtonDiv);
            this.$markAsMergedButtonDiv.on("click", (e) => {
                e.stopPropagation();
                this.leftSynchroFile.markedAsMerged = true;
                this.compareFilesAndAdaptGUI();
            });
        }
        if (this.leftSynchroFile != null && this.leftSynchroFile.markedAsMerged) {
            this.showMergedDiv();
        }
    }
    showMergedDiv() {
        let $mergedDiv = jQuery(`<div class="jo_synchro_mergedDiv">merged</div><div class="img_errorfree"></div>`);
        this.$leftFileDiv.append($mergedDiv);
    }
    emptyGUI() {
        this.$leftFileDiv.empty();
        this.$rightFileDiv.empty();
        this.$buttonLeftDiv.empty();
        this.$buttonRightDiv.empty();
    }
    makeButton(kind, arrowDirection, callback) {
        let caption = "";
        let klass = "";
        switch (kind) {
            case "commit":
                caption = "commit";
                klass = "jo_synchro_commitButton";
                break;
            case "update":
                caption = "update";
                klass = "jo_synchro_updateButton";
                break;
            case "create":
                caption = "create";
                klass = "jo_synchro_createButton";
                break;
            case "delete":
                caption = "delete";
                klass = "jo_synchro_deleteButton";
                break;
        }
        switch (arrowDirection) {
            case "left":
                klass += " jo_synchro_arrowLeft";
                break;
            case "right":
                klass += " jo_synchro_arrowRight";
                break;
        }
        let div = jQuery(`<div class="jo_synchro_button ${klass}">${caption}</div>`);
        div.on("click", (e) => {
            e.stopPropagation();
            if (callback != null)
                callback();
        });
        div.on("mousedown", (e) => { e.stopPropagation(); });
        return div;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L3JlcG9zaXRvcnkvU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBUWhELE1BQU0sT0FBTywwQkFBMEI7SUFjbkMsWUFBb0IsT0FBK0IsRUFBUyxlQUE0QixFQUFTLGdCQUE2QixFQUNuSCxvQkFBc0MsRUFBUyxxQkFBdUM7UUFEN0UsWUFBTyxHQUFQLE9BQU8sQ0FBd0I7UUFBUyxvQkFBZSxHQUFmLGVBQWUsQ0FBYTtRQUFTLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBYTtRQUNuSCx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQWtCO1FBQVMsMEJBQXFCLEdBQXJCLHFCQUFxQixDQUFrQjtRQUhqRyxhQUFRLEdBQTZCLEVBQUUsQ0FBQztRQTJGeEMsWUFBTyxHQUFZLEtBQUssQ0FBQztRQXRGckIsSUFBSSxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLGdEQUFnRCxDQUFDLENBQUM7UUFDcEYsSUFBSSxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLGtFQUFrRSxDQUFDLENBQUM7UUFDeEcsSUFBSSxDQUFDLGVBQWUsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLG1FQUFtRSxDQUFDLENBQUM7UUFDMUcsSUFBSSxDQUFDLGFBQWEsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLGlEQUFpRCxDQUFDLENBQUM7UUFDdEYsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQ25ELE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FB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T0FBTyxHQUFHLFFBQVEsQ0FBQztnQkFBQyxLQUFLLEdBQUcseUJBQXlCLENBQUM7Z0JBQUMsTUFBTTtZQUM1RSxLQUFLLFFBQVE7Z0JBQUUsT0FBTyxHQUFHLFFBQVEsQ0FBQztnQkFBQyxLQUFLLEdBQUcseUJBQXlCLENBQUM7Z0JBQUMsTUFBTTtZQUM1RSxLQUFLLFFBQVE7Z0JBQUUsT0FBTyxHQUFHLFFBQVEsQ0FBQztnQkFBQyxLQUFLLEdBQUcseUJBQXlCLENBQUM7Z0JBQUMsTUFBTTtTQUMvRTtRQUVELFFBQVEsY0FBYyxFQUFFO1lBQ3BCLEtBQUssTUFBTTtnQkFBRSxLQUFLLElBQUksdUJBQXVCLENBQUM7Z0JBQUMsTUFBTTtZQUNyRCxLQUFLLE9BQU87Z0JBQUUsS0FBSyxJQUFJLHdCQUF3QixDQUFDO2dCQUFDLE1BQU07U0FDMUQ7UUFFRCxJQUFJLEdBQUcsR0FBMkIsTUFBTSxDQUFDLGlDQUFpQyxLQUFLLEtBQUssT0FBTyxRQUFRLENBQUMsQ0FBQztRQUVyRyxHQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ2xCLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixJQUFJLFFBQVEsSUFBSSxJQUFJO2dCQUFFLFFBQVEsRUFBRSxDQUFDO1FBQ3JDLENBQUMsQ0FBQyxDQUFDO1FBRUgsR0FBRyxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQSxDQUFDLENBQUMsQ0FBQyxDQUFBO1FBRW5ELE9BQU8sR0FBRyxDQUFDO0lBRWYsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGVhY2hlcnNXaXRoQ2xhc3Nlc01JIH0gZnJvbSBcIi4uL2FkbWluaXN0cmF0aW9uL1RlYWNoZXJzV2l0aENsYXNzZXMuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeUZpbGVFbnRyeSB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgRmlsZSB9IGZyb20gXCIuLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IG1ha2VEaXYgfSBmcm9tIFwiLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IFN5bmNocm9uaXphdGlvbk1hbmFnZXIgfSBmcm9tIFwiLi9TeW5jaHJvbml6YXRpb25NYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFN5bmNocm9GaWxlLCBTeW5jaHJvV29ya3NwYWNlIH0gZnJvbSBcIi4vU3luY2hyb1dvcmtzcGFjZS5qc1wiO1xyXG5cclxudHlwZSBCdXR0b25LaW5kID0gXCJjcmVhdGVcIiB8IFwiZGVsZXRlXCIgfCBcInVwZGF0ZVwiIHwgXCJjb21taXRcIjtcclxuZXhwb3J0IHR5cGUgTGVmdFJpZ2h0ID0gXCJsZWZ0XCIgfCBcInJpZ2h0XCI7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFN5bmNocm9uaXphdGlvbkxpc3RFbGVtZW50IHtcclxuXHJcbiAgICAkbGVmdEZpbGVEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkcmlnaHRGaWxlRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG4gICAgJGJ1dHRvbkxlZnREaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkYnV0dG9uUmlnaHREaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJG1hcmtBc01lcmdlZEJ1dHRvbkRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuICAgICRtZXJnZWRGbGFnOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+O1xyXG5cclxuICAgIGVkaXRvclN0YXRlOiBtb25hY28uZWRpdG9yLklEaWZmRWRpdG9yVmlld1N0YXRlO1xyXG5cclxuICAgICRidXR0b25zOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+W10gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1hbmFnZXI6IFN5bmNocm9uaXphdGlvbk1hbmFnZXIsIHB1YmxpYyBsZWZ0U3luY2hyb0ZpbGU6IFN5bmNocm9GaWxlLCBwdWJsaWMgcmlnaHRTeW5jaHJvRmlsZTogU3luY2hyb0ZpbGUsXHJcbiAgICAgICAgcHVibGljIGxlZnRTeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlLCBwdWJsaWMgcmlnaHRTeW5jaHJvV29ya3NwYWNlOiBTeW5jaHJvV29ya3NwYWNlKSB7XHJcblxyXG4gICAgICAgIHRoaXMuJGxlZnRGaWxlRGl2ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fd29ya3NwYWNlRmlsZURpdiBqb19zeW5jaHJvX2xpc3REaXZcIik7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdiA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2J1dHRvbkRpdiBqb19zeW5jaHJvX2xpc3REaXYgam9fc3luY2hyb19idXR0b25MZWZ0RGl2XCIpO1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fYnV0dG9uRGl2IGpvX3N5bmNocm9fbGlzdERpdiBqb19zeW5jaHJvX2J1dHRvblJpZ2h0RGl2XCIpO1xyXG4gICAgICAgIHRoaXMuJHJpZ2h0RmlsZURpdiA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX3JlcG9zaXRvcnlGaWxlRGl2IGpvX3N5bmNocm9fbGlzdERpdlwiKTtcclxuICAgICAgICBtYW5hZ2VyLiRmaWxlTGlzdERpdnNbMF0uYXBwZW5kKHRoaXMuJGxlZnRGaWxlRGl2KTtcclxuICAgICAgICBtYW5hZ2VyLiRmaWxlTGlzdERpdnNbMV0uYXBwZW5kKHRoaXMuJGJ1dHRvbkxlZnREaXYpO1xyXG4gICAgICAgIG1hbmFnZXIuJGZpbGVMaXN0RGl2c1syXS5hcHBlbmQodGhpcy4kYnV0dG9uUmlnaHREaXYpO1xyXG4gICAgICAgIG1hbmFnZXIuJGZpbGVMaXN0RGl2c1szXS5hcHBlbmQodGhpcy4kcmlnaHRGaWxlRGl2KTtcclxuXHJcbiAgICAgICAgaWYgKGxlZnRTeW5jaHJvRmlsZSAhPSBudWxsICYmIGxlZnRTeW5jaHJvRmlsZS5zdGF0ZSAhPSBcIm9yaWdpbmFsXCIpIHRoaXMuJGxlZnRGaWxlRGl2LmFkZENsYXNzKCdqb19kaXJ0eScpO1xyXG4gICAgICAgIGlmIChyaWdodFN5bmNocm9GaWxlICE9IG51bGwgJiYgcmlnaHRTeW5jaHJvRmlsZS5zdGF0ZSAhPSBcIm9yaWdpbmFsXCIpIHRoaXMuJHJpZ2h0RmlsZURpdi5hZGRDbGFzcygnam9fZGlydHknKTtcclxuXHJcbiAgICAgICAgXHJcblxyXG4gICAgICAgIGxldCBhbGxEaXZzOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+W10gPSBbdGhpcy4kbGVmdEZpbGVEaXYsIHRoaXMuJGJ1dHRvbkxlZnREaXYsIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LCB0aGlzLiRyaWdodEZpbGVEaXZdO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGZvciAobGV0ICRkaXYgb2YgYWxsRGl2cykge1xyXG4gICAgICAgICAgICAkZGl2Lm9uKFwibW91c2VlbnRlclwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCAkZGl2IG9mIGFsbERpdnMpICRkaXYuYWRkQ2xhc3MoJ2pvX3N5bmNocm9faG92ZXJMaW5lJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkZGl2Lm9uKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCAkZGl2IG9mIGFsbERpdnMpICRkaXYucmVtb3ZlQ2xhc3MoJ2pvX3N5bmNocm9faG92ZXJMaW5lJykucmVtb3ZlQ2xhc3MoXCJqb19zeW5jaHJvX2hvdmVyQWN0aXZlTGluZVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAkZGl2Lm9uKFwibW91c2Vkb3duXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0ICRkaXYgb2YgYWxsRGl2cykgJGRpdi5hZGRDbGFzcygnam9fc3luY2hyb19ob3ZlckFjdGl2ZUxpbmUnKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJGRpdi5vbihcIm1vdXNldXBcIiwgKCkgPT4geyBmb3IgKGxldCAkZGl2IG9mIGFsbERpdnMpICRkaXYucmVtb3ZlQ2xhc3MoJ2pvX3N5bmNocm9faG92ZXJBY3RpdmVMaW5lJykgfSk7XHJcblxyXG4gICAgICAgICAgICAkZGl2Lm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3JlYXRlTGVmdEZpbGVNb2RlbCgpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlUmlnaHRGaWxlTW9kZWwoKTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHNlbGVjdCgpe1xyXG4gICAgICAgIGxldCBhbGxEaXZzOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+W10gPSBbdGhpcy4kbGVmdEZpbGVEaXYsIHRoaXMuJGJ1dHRvbkxlZnREaXYsIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LCB0aGlzLiRyaWdodEZpbGVEaXZdO1xyXG4gICAgICAgIGpRdWVyeSgnI2pvX3N5bmNocm9fZmlsZUxpc3RPdXRlcicpLmZpbmQoJy5qb19zeW5jaHJvX2FjdGl2ZUxpbmUnKS5yZW1vdmVDbGFzcygnam9fc3luY2hyb19hY3RpdmVMaW5lJyk7XHJcbiAgICAgICAgZm9yIChsZXQgJGRpdiBvZiBhbGxEaXZzKSAkZGl2LmFkZENsYXNzKCdqb19zeW5jaHJvX2FjdGl2ZUxpbmUnKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFuYWdlci5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQuZWRpdG9yU3RhdGUgPSB0aGlzLm1hbmFnZXIuZGlmZkVkaXRvci5zYXZlVmlld1N0YXRlKClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubWFuYWdlci5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5zZXRFZGl0b3JNb2RlbCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5lZGl0b3JTdGF0ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5kaWZmRWRpdG9yLnJlc3RvcmVWaWV3U3RhdGUodGhpcy5lZGl0b3JTdGF0ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLm1hbmFnZXIuZGlmZkVkaXRvci51cGRhdGVPcHRpb25zKHtcclxuICAgICAgICAgICAgb3JpZ2luYWxFZGl0YWJsZTogdGhpcy5sZWZ0U3luY2hyb0ZpbGU/Lm9yaWdpbmFsVGV4dCAhPSBudWxsXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlUmlnaHRGaWxlTW9kZWwoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucmlnaHRTeW5jaHJvRmlsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmlnaHRTeW5jaHJvRmlsZS5tb25hY29Nb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwodGhpcy5yaWdodFN5bmNocm9GaWxlLnRleHQsIFwibXlKYXZhXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmlnaHRTeW5jaHJvRmlsZS5tb25hY29Nb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJcIiwgXCJteUphdmFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEVkaXRvck1vZGVsKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm1hbmFnZXIubGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudCA9PSB0aGlzKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5kaWZmRWRpdG9yLnNldE1vZGVsKHtcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsOiB0aGlzLmxlZnRTeW5jaHJvRmlsZSA9PSBudWxsID8gdGhpcy5nZXRFbXB0eU1vbmFjb01vZGVsKCkgOiB0aGlzLmxlZnRTeW5jaHJvRmlsZS5tb25hY29Nb2RlbCxcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVkOiB0aGlzLnJpZ2h0U3luY2hyb0ZpbGUgPT0gbnVsbCA/IHRoaXMuZ2V0RW1wdHlNb25hY29Nb2RlbCgpIDogdGhpcy5yaWdodFN5bmNocm9GaWxlLm1vbmFjb01vZGVsXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRFbXB0eU1vbmFjb01vZGVsKCk6IG1vbmFjby5lZGl0b3IuSVRleHRNb2RlbHtcclxuICAgICAgICByZXR1cm4gbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlwiLCBcIm15SmF2YVwiKVxyXG4gICAgfVxyXG5cclxuICAgIHBlbmRpbmc6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIGNyZWF0ZUxlZnRGaWxlTW9kZWwoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMubGVmdFN5bmNocm9GaWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5sZWZ0U3luY2hyb0ZpbGUubW9uYWNvTW9kZWwgPSBtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKHRoaXMubGVmdFN5bmNocm9GaWxlLnRleHQsIFwibXlKYXZhXCIpO1xyXG4gICAgICAgICAgICB0aGlzLmxlZnRTeW5jaHJvRmlsZS5tb25hY29Nb2RlbC5vbkRpZENoYW5nZUNvbnRlbnQoKGV2ZW50KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdGhyb3R0bGUgY29tcGFyaXNvbiB0byBhdm9pZCBlZGl0b3Itc2xvd2Rvd25cclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy5wZW5kaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wZW5kaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubGVmdFN5bmNocm9GaWxlICE9IG51bGwgJiYgdGhpcy5sZWZ0U3luY2hyb0ZpbGU/LnN0YXRlICE9IFwiZGVsZXRlZFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5sZWZ0U3luY2hyb0ZpbGU/Lm9yaWdpbmFsVGV4dCAhPSBudWxsICYmXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sZWZ0U3luY2hyb0ZpbGUubW9uYWNvTW9kZWwuZ2V0VmFsdWUobW9uYWNvLmVkaXRvci5FbmRPZkxpbmVQcmVmZXJlbmNlLkxGLCBmYWxzZSkgPT0gdGhpcy5sZWZ0U3luY2hyb0ZpbGUub3JpZ2luYWxUZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kbGVmdEZpbGVEaXYucmVtb3ZlQ2xhc3MoXCJqb19kaXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxlZnRTeW5jaHJvRmlsZS5zdGF0ZSA9IFwib3JpZ2luYWxcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy4kbGVmdEZpbGVEaXYuYWRkQ2xhc3MoXCJqb19kaXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxlZnRTeW5jaHJvRmlsZS5zdGF0ZSA9IFwiY2hhbmdlZFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLm9uQ29udGVudENoYW5nZWQoXCJsZWZ0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sIDcwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcblxyXG4gICAgb25GaWxlQ2hhbmdlZChsZWZ0UmlnaHQ6IExlZnRSaWdodCkge1xyXG4gICAgICAgIGlmIChsZWZ0UmlnaHQgPT0gXCJsZWZ0XCIpIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVMZWZ0RmlsZU1vZGVsKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jcmVhdGVSaWdodEZpbGVNb2RlbCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNldEVkaXRvck1vZGVsKCk7XHJcbiAgICAgICAgdGhpcy5jb21wYXJlRmlsZXNBbmRBZGFwdEdVSSgpO1xyXG4gICAgICAgIHN3aXRjaChsZWZ0UmlnaHQpe1xyXG4gICAgICAgICAgICBjYXNlIFwibGVmdFwiOlxyXG4gICAgICAgICAgICAgICAgaWYodGhpcy5sZWZ0U3luY2hyb0ZpbGUgIT0gbnVsbCAmJiB0aGlzLmxlZnRTeW5jaHJvRmlsZS5zdGF0ZSAhPSBcIm9yaWdpbmFsXCIpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGxlZnRGaWxlRGl2LmFkZENsYXNzKFwiam9fZGlydHlcIik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGxlZnRGaWxlRGl2LnJlbW92ZUNsYXNzKFwiam9fZGlydHlcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInJpZ2h0XCI6XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnJpZ2h0U3luY2hyb0ZpbGUgIT0gbnVsbCAmJiB0aGlzLnJpZ2h0U3luY2hyb0ZpbGUuc3RhdGUgIT0gXCJvcmlnaW5hbFwiKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRyaWdodEZpbGVEaXYuYWRkQ2xhc3MoXCJqb19kaXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kcmlnaHRGaWxlRGl2LnJlbW92ZUNsYXNzKFwiam9fZGlydHlcIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tYW5hZ2VyLm9uQ29udGVudENoYW5nZWQobGVmdFJpZ2h0KTtcclxuICAgIH1cclxuXHJcbiAgICBjb21wYXJlRmlsZXNBbmRBZGFwdEdVSSgpIHtcclxuXHJcbiAgICAgICAgdGhpcy5lbXB0eUdVSSgpO1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGxlZnRDYXB0aW9uOiBzdHJpbmcgPSBcIi0tLVwiO1xyXG4gICAgICAgIGxldCBsZWZ0VmVyc2lvbkNhcHRpb246IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgICAgIGxldCBuZWVkc01lcmdlID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmxlZnRTeW5jaHJvRmlsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxlZnRDYXB0aW9uID0gdGhpcy5sZWZ0U3luY2hyb0ZpbGUubmFtZTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubGVmdFN5bmNocm9GaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0VmVyc2lvbkNhcHRpb24gPSBcIihvaG5lIFZlcnNpb24pXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZWZ0VmVyc2lvbkNhcHRpb24gPSBcIihWIFwiICsgdGhpcy5sZWZ0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb247XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yaWdodFN5bmNocm9GaWxlICE9IG51bGwgJiYgdGhpcy5yaWdodFN5bmNocm9GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uID09IHRoaXMubGVmdFN5bmNocm9GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uICYmIHRoaXMucmlnaHRTeW5jaHJvRmlsZS50ZXh0ICE9IHRoaXMubGVmdFN5bmNocm9GaWxlLnRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0VmVyc2lvbkNhcHRpb24gKz0gJzxzcGFuIGNsYXNzPVwiam9fc3luY2hyb193aXRoQ2hhbmdlc1wiPiBtaXQgw4RuZGVydW5nZW48L3NwYW4+JztcclxuICAgICAgICAgICAgICAgICAgICBuZWVkc01lcmdlID0gIXRoaXMubGVmdFN5bmNocm9GaWxlLm1hcmtlZEFzTWVyZ2VkO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgbGVmdFZlcnNpb25DYXB0aW9uICs9IFwiKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxlZnRTeW5jaHJvRmlsZS5zdGF0ZSA9PSBcImRlbGV0ZWRcIikge1xyXG4gICAgICAgICAgICAgICAgbGVmdENhcHRpb24gKz0gXCIgLSBHRUzDllNDSFRcIjtcclxuICAgICAgICAgICAgICAgIGxlZnRWZXJzaW9uQ2FwdGlvbiA9IFwiXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByaWdodENhcHRpb24gPSB0aGlzLnJpZ2h0U3luY2hyb0ZpbGUgPT0gbnVsbCA/IFwiLS0tXCIgOiB0aGlzLnJpZ2h0U3luY2hyb0ZpbGUubmFtZTtcclxuICAgICAgICBsZXQgcmlnaHRWZXJzaW9uQ2FwdGlvbiA9IHRoaXMucmlnaHRTeW5jaHJvRmlsZSA9PSBudWxsID8gXCJcIiA6IFwiKFYgXCIgKyB0aGlzLnJpZ2h0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24gKyBcIilcIjtcclxuICAgICAgICBpZiAodGhpcy5yaWdodFN5bmNocm9GaWxlPy5zdGF0ZSA9PSBcImRlbGV0ZWRcIikge1xyXG4gICAgICAgICAgICByaWdodENhcHRpb24gKz0gXCIgLSBHRUzDllNDSFRcIjtcclxuICAgICAgICAgICAgcmlnaHRWZXJzaW9uQ2FwdGlvbiA9IFwiXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgJHNwYWNlcjEgPSBtYWtlRGl2KFwiXCIsIFwiam9fc3luY2hyb181cHhfc3BhY2VyXCIpO1xyXG4gICAgICAgIGxldCAkc3BhY2VyMiA9IG1ha2VEaXYoXCJcIiwgXCJqb19zeW5jaHJvXzVweF9zcGFjZXJcIik7XHJcblxyXG4gICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmFwcGVuZCgkc3BhY2VyMik7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmxlZnRTeW5jaHJvRmlsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxlZnRTeW5jaHJvV29ya3NwYWNlLmlzV3JpdGFibGUoKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5hcHBlbmQodGhpcy5tYWtlQnV0dG9uKFwiY3JlYXRlXCIsIFwibGVmdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb0ZpbGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHRoYXQucmlnaHRTeW5jaHJvRmlsZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZEluc2lkZVJlcG9zaXRvcnk6IHRoYXQucmlnaHRTeW5jaHJvRmlsZS5pZEluc2lkZVJlcG9zaXRvcnksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uOiB0aGF0LnJpZ2h0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiBcIm5ld1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZWRBc01lcmdlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMucmlnaHRTeW5jaHJvRmlsZS50ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzeW5jaHJvV29ya3NwYWNlOiB0aGF0LmxlZnRTeW5jaHJvV29ya3NwYWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZEluc2lkZVdvcmtzcGFjZTogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya3NwYWNlRmlsZTogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxUZXh0OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb25hY29Nb2RlbDogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb1dvcmtzcGFjZS5maWxlcy5wdXNoKHRoYXQubGVmdFN5bmNocm9GaWxlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm9uRmlsZUNoYW5nZWQoXCJsZWZ0XCIpO1xyXG4gICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGF0LnJpZ2h0U3luY2hyb1dvcmtzcGFjZS5pc1dyaXRhYmxlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmFwcGVuZCh0aGlzLm1ha2VCdXR0b24oXCJkZWxldGVcIiwgXCJyaWdodFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yaWdodFN5bmNocm9GaWxlLnN0YXRlID0gXCJkZWxldGVkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vbkZpbGVDaGFuZ2VkKFwicmlnaHRcIik7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmlnaHRTeW5jaHJvRmlsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZS5pc1dyaXRhYmxlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmFwcGVuZCh0aGlzLm1ha2VCdXR0b24oXCJjcmVhdGVcIiwgXCJyaWdodFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yaWdodFN5bmNocm9GaWxlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiB0aGF0LmxlZnRTeW5jaHJvRmlsZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21taXR0ZWRGcm9tRmlsZTogdGhhdC5sZWZ0U3luY2hyb1dvcmtzcGFjZS5pc1dyaXRhYmxlKCkgPyB0aGF0LmxlZnRTeW5jaHJvRmlsZSA6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkSW5zaWRlUmVwb3NpdG9yeTogdGhhdC5sZWZ0U3luY2hyb0ZpbGUuaWRJbnNpZGVSZXBvc2l0b3J5ID09IG51bGwgPyB0aGF0LmxlZnRTeW5jaHJvRmlsZS5pZEluc2lkZVdvcmtzcGFjZSA6IHRoYXQubGVmdFN5bmNocm9GaWxlLmlkSW5zaWRlUmVwb3NpdG9yeSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3NpdG9yeV9maWxlX3ZlcnNpb246IHRoYXQubGVmdFN5bmNocm9GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uID09IG51bGwgPyAxIDogdGhhdC5sZWZ0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlOiBcIm5ld1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtYXJrZWRBc01lcmdlZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHRoaXMubGVmdFN5bmNocm9GaWxlLnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN5bmNocm9Xb3Jrc3BhY2U6IHRoYXQucmlnaHRTeW5jaHJvV29ya3NwYWNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZEluc2lkZVdvcmtzcGFjZTogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgd29ya3NwYWNlRmlsZTogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgb3JpZ2luYWxUZXh0OiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtb25hY29Nb2RlbDogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm9uRmlsZUNoYW5nZWQoXCJyaWdodFwiKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhhdC5sZWZ0U3luY2hyb1dvcmtzcGFjZS5pc1dyaXRhYmxlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvbkxlZnREaXYuYXBwZW5kKHRoaXMubWFrZUJ1dHRvbihcImRlbGV0ZVwiLCBcImxlZnRcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubGVmdFN5bmNocm9GaWxlLnN0YXRlID0gXCJkZWxldGVkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vbkZpbGVDaGFuZ2VkKFwibGVmdFwiKTtcclxuICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIEJvdGggU3luY2hyb0ZpbGVzICE9IG51bGxcclxuICAgICAgICAgICAgbGV0IGlzU3luY2hyb25pemVkOiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmxlZnRTeW5jaHJvRmlsZS5yZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbiA9PSB0aGlzLnJpZ2h0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24pIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmxlZnRTeW5jaHJvRmlsZS50ZXh0ICE9IHRoaXMucmlnaHRTeW5jaHJvRmlsZS50ZXh0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXNTeW5jaHJvbml6ZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlzU3luY2hyb25pemVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N5bmNocm9uaXplZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5hcHBlbmQoalF1ZXJ5KCc8ZGl2PnN5bmNocm9uIC0gPC9kaXY+JykpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uUmlnaHREaXYuYXBwZW5kKGpRdWVyeSgnPGRpdj4gLSBzeW5jaHJvbjwvZGl2PicpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMubGVmdFN5bmNocm9Xb3Jrc3BhY2UuaXNXcml0YWJsZSgpKXtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25MZWZ0RGl2LmFwcGVuZCh0aGlzLm1ha2VCdXR0b24oXCJ1cGRhdGVcIiwgXCJsZWZ0XCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb0ZpbGUudGV4dCA9IHRoYXQucmlnaHRTeW5jaHJvRmlsZS50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmxlZnRTeW5jaHJvRmlsZS5yZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbiA9IHRoYXQucmlnaHRTeW5jaHJvRmlsZS5yZXBvc2l0b3J5X2ZpbGVfdmVyc2lvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb0ZpbGUuc3RhdGUgPSBcImNoYW5nZWRcIjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5vbkZpbGVDaGFuZ2VkKFwibGVmdFwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZih0aGlzLnJpZ2h0U3luY2hyb1dvcmtzcGFjZS5pc1dyaXRhYmxlKCkgJiYgIW5lZWRzTWVyZ2Upe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmFwcGVuZCh0aGlzLm1ha2VCdXR0b24oXCJjb21taXRcIiwgXCJyaWdodFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmlnaHRTeW5jaHJvRmlsZS50ZXh0ID0gdGhhdC5sZWZ0U3luY2hyb0ZpbGUudGV4dDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yaWdodFN5bmNocm9GaWxlLnJlcG9zaXRvcnlfZmlsZV92ZXJzaW9uKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHRoYXQubGVmdFN5bmNocm9Xb3Jrc3BhY2UuaXNXcml0YWJsZSgpKSB0aGF0LnJpZ2h0U3luY2hyb0ZpbGUuY29tbWl0dGVkRnJvbUZpbGUgPSB0aGF0LmxlZnRTeW5jaHJvRmlsZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYodGhhdC5sZWZ0U3luY2hyb1dvcmtzcGFjZS5pc1dyaXRhYmxlKCkpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5sZWZ0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb24gPSB0aGF0LnJpZ2h0U3luY2hyb0ZpbGUucmVwb3NpdG9yeV9maWxlX3ZlcnNpb247XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yaWdodFN5bmNocm9GaWxlLnN0YXRlID0gXCJjaGFuZ2VkXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQub25GaWxlQ2hhbmdlZChcInJpZ2h0XCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiRidXR0b25MZWZ0RGl2LmFwcGVuZCgkc3BhY2VyMSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLiRsZWZ0RmlsZURpdi5hcHBlbmQoalF1ZXJ5KGA8ZGl2IGNsYXNzPVwiam9fc3luY2hyb19maWxlbmFtZVwiPiR7bGVmdENhcHRpb259PHNwYW4gY2xhc3M9XCJqb19zeW5jaHJvX2ZpbGVWZXJzaW9uXCI+JHtsZWZ0VmVyc2lvbkNhcHRpb259PC9zcGFuPjwvZGl2PmApKTtcclxuICAgICAgICB0aGlzLiRyaWdodEZpbGVEaXYuYXBwZW5kKGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9fZmlsZW5hbWVcIj4ke3JpZ2h0Q2FwdGlvbn08c3BhbiBjbGFzcz1cImpvX3N5bmNocm9fZmlsZVZlcnNpb25cIj4ke3JpZ2h0VmVyc2lvbkNhcHRpb259PC9zcGFuPjwvZGl2PmApKTtcclxuXHJcbiAgICAgICAgaWYobmVlZHNNZXJnZSl7XHJcbiAgICAgICAgICAgIHRoaXMuJG1hcmtBc01lcmdlZEJ1dHRvbkRpdiA9IGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9fYnV0dG9uIGpvX3N5bmNocm9fbWFya0FzTWVyZ2VkQnV0dG9uXCI+QWxzIFwibWVyZ2VkXCIgbWFya2llcmVuPC9kaXY+YCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGxlZnRGaWxlRGl2LmFwcGVuZCh0aGlzLiRtYXJrQXNNZXJnZWRCdXR0b25EaXYpO1xyXG4gICAgICAgICAgICB0aGlzLiRtYXJrQXNNZXJnZWRCdXR0b25EaXYub24oXCJjbGlja1wiLCAoZSk9PiB7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sZWZ0U3luY2hyb0ZpbGUubWFya2VkQXNNZXJnZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21wYXJlRmlsZXNBbmRBZGFwdEdVSSgpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLmxlZnRTeW5jaHJvRmlsZSAhPSBudWxsICYmIHRoaXMubGVmdFN5bmNocm9GaWxlLm1hcmtlZEFzTWVyZ2VkKXtcclxuICAgICAgICAgICAgdGhpcy5zaG93TWVyZ2VkRGl2KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzaG93TWVyZ2VkRGl2KCl7XHJcbiAgICAgICAgbGV0ICRtZXJnZWREaXYgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19zeW5jaHJvX21lcmdlZERpdlwiPm1lcmdlZDwvZGl2PjxkaXYgY2xhc3M9XCJpbWdfZXJyb3JmcmVlXCI+PC9kaXY+YCk7XHJcbiAgICAgICAgdGhpcy4kbGVmdEZpbGVEaXYuYXBwZW5kKCRtZXJnZWREaXYpO1xyXG4gICAgfVxyXG5cclxuICAgIGVtcHR5R1VJKCkge1xyXG4gICAgICAgIHRoaXMuJGxlZnRGaWxlRGl2LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy4kcmlnaHRGaWxlRGl2LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmVtcHR5KCk7XHJcbiAgICB9XHJcblxyXG4gICAgbWFrZUJ1dHRvbihraW5kOiBCdXR0b25LaW5kLCBhcnJvd0RpcmVjdGlvbjogTGVmdFJpZ2h0LCBjYWxsYmFjazogKCkgPT4gdm9pZCk6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD4ge1xyXG5cclxuICAgICAgICBsZXQgY2FwdGlvbiA9IFwiXCI7XHJcbiAgICAgICAgbGV0IGtsYXNzID0gXCJcIjtcclxuXHJcbiAgICAgICAgc3dpdGNoIChraW5kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJjb21taXRcIjogY2FwdGlvbiA9IFwiY29tbWl0XCI7IGtsYXNzID0gXCJqb19zeW5jaHJvX2NvbW1pdEJ1dHRvblwiOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInVwZGF0ZVwiOiBjYXB0aW9uID0gXCJ1cGRhdGVcIjsga2xhc3MgPSBcImpvX3N5bmNocm9fdXBkYXRlQnV0dG9uXCI7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6IGNhcHRpb24gPSBcImNyZWF0ZVwiOyBrbGFzcyA9IFwiam9fc3luY2hyb19jcmVhdGVCdXR0b25cIjsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJkZWxldGVcIjogY2FwdGlvbiA9IFwiZGVsZXRlXCI7IGtsYXNzID0gXCJqb19zeW5jaHJvX2RlbGV0ZUJ1dHRvblwiOyBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHN3aXRjaCAoYXJyb3dEaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSBcImxlZnRcIjoga2xhc3MgKz0gXCIgam9fc3luY2hyb19hcnJvd0xlZnRcIjsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJyaWdodFwiOiBrbGFzcyArPSBcIiBqb19zeW5jaHJvX2Fycm93UmlnaHRcIjsgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+ID0galF1ZXJ5KGA8ZGl2IGNsYXNzPVwiam9fc3luY2hyb19idXR0b24gJHtrbGFzc31cIj4ke2NhcHRpb259PC9kaXY+YCk7XHJcblxyXG4gICAgICAgIGRpdi5vbihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSBjYWxsYmFjaygpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBkaXYub24oXCJtb3VzZWRvd25cIiwgKGUpID0+IHsgZS5zdG9wUHJvcGFnYXRpb24oKSB9KVxyXG5cclxuICAgICAgICByZXR1cm4gZGl2O1xyXG5cclxuICAgIH1cclxuXHJcblxyXG59Il19