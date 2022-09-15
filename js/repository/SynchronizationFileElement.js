import { makeDiv } from "../tools/HtmlTools.js";
export class SynchronizationListElement {
    constructor(manager, workspaceFile, repositoryFile) {
        this.manager = manager;
        this.workspaceFile = workspaceFile;
        this.repositoryFile = repositoryFile;
        this.$buttons = [];
        this.pending = false;
        if (workspaceFile != null) {
            this.originalWorkspaceText = workspaceFile.text;
        }
        this.$workspaceFileDiv = makeDiv(null, "jo_synchro_workspaceFileDiv jo_synchro_listDiv");
        this.$buttonLeftDiv = makeDiv(null, "jo_synchro_buttonDiv jo_synchro_listDiv jo_synchro_buttonLeftDiv");
        this.$buttonRightDiv = makeDiv(null, "jo_synchro_buttonDiv jo_synchro_listDiv jo_synchro_buttonRightDiv");
        this.$repositoryFileDiv = makeDiv(null, "jo_synchro_repositoryFileDiv jo_synchro_listDiv");
        manager.$fileListDivs[0].append(this.$workspaceFileDiv);
        manager.$fileListDivs[1].append(this.$buttonLeftDiv);
        manager.$fileListDivs[2].append(this.$buttonRightDiv);
        manager.$fileListDivs[3].append(this.$repositoryFileDiv);
        let allDivs = [this.$workspaceFileDiv, this.$buttonLeftDiv, this.$buttonRightDiv, this.$repositoryFileDiv];
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
                jQuery('#jo_synchro_fileListOuter').find('.jo_synchro_activeLine').removeClass('jo_synchro_activeLine');
                for (let $div of allDivs)
                    $div.addClass('jo_synchro_activeLine');
                if (that.manager.lastShownSynchronizationElement != null) {
                    that.manager.lastShownSynchronizationElement.editorState = that.manager.diffEditor.saveViewState();
                }
                that.manager.lastShownSynchronizationElement = this;
                that.setEditorModel();
                if (that.editorState != null) {
                    that.manager.diffEditor.restoreViewState(that.editorState);
                }
                that.manager.diffEditor.updateOptions({
                    originalEditable: that.workspaceFile != null
                });
            });
        }
        this.createWorkspaceFileModel();
        this.createRepositoryFileModel();
    }
    createRepositoryFileModel() {
        if (this.repositoryFile != null) {
            this.repositoryFileModel = monaco.editor.createModel(this.repositoryFile.text, "myJava");
        }
        else {
            this.repositoryFileModel = monaco.editor.createModel("", "myJava");
        }
    }
    setEditorModel() {
        if (this.manager.lastShownSynchronizationElement == this) {
            this.manager.diffEditor.setModel({
                original: this.workspaceFileModel,
                modified: this.repositoryFileModel
            });
        }
    }
    createWorkspaceFileModel() {
        if (this.workspaceFile != null) {
            this.workspaceFileModel = monaco.editor.createModel(this.workspaceFile.text, "myJava");
            this.workspaceFileModel.onDidChangeContent((event) => {
                this.manager.onWorkspaceContentChanged();
                // throttle comparison to avoid editor-slowdown
                if (!this.pending) {
                    this.pending = true;
                    setTimeout(() => {
                        if (this.originalWorkspaceText != null &&
                            this.workspaceFileModel.getValue(monaco.editor.EndOfLinePreference.LF, false) == this.originalWorkspaceText) {
                            this.$workspaceFileDiv.removeClass("jo_dirty");
                        }
                        else {
                            this.$workspaceFileDiv.addClass("jo_dirty");
                        }
                        this.pending = false;
                    }, 700);
                }
            });
        }
        else {
            this.workspaceFileModel = monaco.editor.createModel("", "myJava");
        }
    }
    onWorkspaceFileChanged(withCommitButtons) {
        this.createWorkspaceFileModel();
        this.setEditorModel();
        this.compareFilesAndAdaptGUI(withCommitButtons);
        this.manager.onWorkspaceContentChanged();
        this.$workspaceFileDiv.addClass("jo_dirty");
    }
    onRepositoryFileChanged(withCommitButtons) {
        this.createRepositoryFileModel();
        this.setEditorModel();
        this.compareFilesAndAdaptGUI(withCommitButtons);
        this.manager.onRepositoryContentChanged();
        this.$repositoryFileDiv.addClass("jo_dirty");
    }
    compareFilesAndAdaptGUI(withCommitButtons) {
        this.emptyGUI();
        let that = this;
        let fileCaption = this.workspaceFile == null ? "---" : this.workspaceFile.name;
        let fileVersionCaption = this.workspaceFile == null ? "" : "(V " + this.workspaceFile.version;
        let repoFileCaption = this.repositoryFile == null ? "---" : this.repositoryFile.filename;
        let repoVersionCaption = this.repositoryFile == null ? "" : "(V " + this.repositoryFile.version + ")";
        let $spacer1 = makeDiv("", "jo_synchro_5px_spacer");
        let $spacer2 = makeDiv("", "jo_synchro_5px_spacer");
        this.$buttonRightDiv.append($spacer2);
        if (this.workspaceFile == null) {
            this.$buttonLeftDiv.append(this.makeButton("create", "left", () => {
                that.workspaceFile = {
                    name: that.repositoryFile.filename,
                    id: that.repositoryFile.id,
                    text: that.repositoryFile.text,
                    version: that.repositoryFile.version,
                    dirty: true,
                    saved: false
                };
                that.onWorkspaceFileChanged(withCommitButtons);
            }));
            if (withCommitButtons) {
                this.$buttonRightDiv.append(this.makeButton("delete", "right", () => {
                    that.repositoryFile = null;
                    that.onRepositoryFileChanged(withCommitButtons);
                }));
            }
        }
        else if (this.repositoryFile == null) {
            if (withCommitButtons) {
                this.$buttonRightDiv.append(this.makeButton("create", "right", () => {
                    that.repositoryFile = {
                        filename: that.workspaceFile.name,
                        id: that.workspaceFile.id,
                        text: that.workspaceFile.text,
                        version: that.workspaceFile.version
                    };
                    that.onRepositoryFileChanged(withCommitButtons);
                }));
            }
            this.$buttonLeftDiv.append(this.makeButton("delete", "left", () => {
                that.workspaceFile = null;
                that.onWorkspaceFileChanged(withCommitButtons);
            }));
        }
        else {
            let isSynchronized = true;
            if (this.workspaceFile.version == this.repositoryFile.version) {
                if (this.workspaceFile.text != this.repositoryFile.text) {
                    isSynchronized = false;
                    fileVersionCaption += " + Änderungen";
                }
            }
            else {
                isSynchronized = false;
            }
            if (isSynchronized) {
                this.$buttonLeftDiv.append(jQuery('<div>synchron - </div>'));
                if (withCommitButtons) {
                    this.$buttonRightDiv.append(jQuery('<div> - synchron</div>'));
                }
            }
            else {
                this.$buttonLeftDiv.append(this.makeButton("update", "left", () => {
                    that.workspaceFile.text = that.repositoryFile.text;
                    that.workspaceFile.version = that.repositoryFile.version;
                    that.onWorkspaceFileChanged(withCommitButtons);
                }));
                if (withCommitButtons) {
                    this.$buttonRightDiv.append(this.makeButton("commit", "right", () => {
                        that.repositoryFile.text = that.workspaceFile.text;
                        that.repositoryFile.version++;
                        that.workspaceFile.version = that.repositoryFile.version;
                        that.onRepositoryFileChanged(withCommitButtons);
                    }));
                }
            }
        }
        this.$buttonLeftDiv.append($spacer1);
        if (this.workspaceFile != null)
            fileVersionCaption += ")";
        this.$workspaceFileDiv.append(jQuery(`<div class="jo_synchro_filename">${fileCaption}<span class="jo_synchro_fileVersion">${fileVersionCaption}</span></div>`));
        this.$repositoryFileDiv.append(jQuery(`<div class="jo_synchro_filename">${repoFileCaption}<span class="jo_synchro_fileVersion">${repoVersionCaption}</span></div>`));
    }
    emptyGUI() {
        this.$workspaceFileDiv.empty();
        this.$repositoryFileDiv.empty();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3luY2hyb25pemF0aW9uRmlsZUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L3JlcG9zaXRvcnkvU3luY2hyb25pemF0aW9uRmlsZUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBR0EsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBT2hELE1BQU0sT0FBTywwQkFBMEI7SUFnQm5DLFlBQW9CLE9BQStCLEVBQVMsYUFBbUIsRUFBUyxjQUFtQztRQUF2RyxZQUFPLEdBQVAsT0FBTyxDQUF3QjtRQUFTLGtCQUFhLEdBQWIsYUFBYSxDQUFNO1FBQVMsbUJBQWMsR0FBZCxjQUFjLENBQXFCO1FBUDNILGFBQVEsR0FBNkIsRUFBRSxDQUFDO1FBdUZ4QyxZQUFPLEdBQVksS0FBSyxDQUFDO1FBOUVyQixJQUFJLGFBQWEsSUFBSSxJQUFJLEVBQUU7WUFDdkIsSUFBSSxDQUFDLHFCQUFxQixHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7U0FDbkQ7UUFFRCxJQUFJLENBQUMsaUJBQWlCLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO1FBQ3pGLElBQUksQ0FBQyxjQUFjLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxrRUFBa0UsQ0FBQyxDQUFDO1FBQ3hHLElBQUksQ0FBQyxlQUFlLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRSxtRUFBbUUsQ0FBQyxDQUFDO1FBQzFHLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLGlEQUFpRCxDQUFDLENBQUM7UUFDM0YsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDeEQsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFD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QUEsQ0FBQyxDQUFDLENBQUMsQ0FBQTtRQUVuRCxPQUFPLEdBQUcsQ0FBQztJQUVmLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRlYWNoZXJzV2l0aENsYXNzZXNNSSB9IGZyb20gXCIuLi9hZG1pbmlzdHJhdGlvbi9UZWFjaGVyc1dpdGhDbGFzc2VzLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlGaWxlRW50cnkgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IEZpbGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRGl2IH0gZnJvbSBcIi4uL3Rvb2xzL0h0bWxUb29scy5qc1wiO1xyXG5pbXBvcnQgeyBTeW5jaHJvbml6YXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4vU3luY2hyb25pemF0aW9uTWFuYWdlci5qc1wiO1xyXG5cclxudHlwZSBCdXR0b25LaW5kID0gXCJjcmVhdGVcIiB8IFwiZGVsZXRlXCIgfCBcInVwZGF0ZVwiIHwgXCJjb21taXRcIjtcclxudHlwZSBBcnJvd0RpcmVjdGlvbiA9IFwibGVmdFwiIHwgXCJyaWdodFwiO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBTeW5jaHJvbml6YXRpb25MaXN0RWxlbWVudCB7XHJcblxyXG4gICAgJHdvcmtzcGFjZUZpbGVEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkcmVwb3NpdG9yeUZpbGVEaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAkYnV0dG9uTGVmdERpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuICAgICRidXR0b25SaWdodERpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICBlZGl0b3JTdGF0ZTogbW9uYWNvLmVkaXRvci5JRGlmZkVkaXRvclZpZXdTdGF0ZTtcclxuXHJcbiAgICAkYnV0dG9uczogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PltdID0gW107XHJcblxyXG4gICAgd29ya3NwYWNlRmlsZU1vZGVsOiBtb25hY28uZWRpdG9yLklUZXh0TW9kZWw7XHJcbiAgICByZXBvc2l0b3J5RmlsZU1vZGVsOiBtb25hY28uZWRpdG9yLklUZXh0TW9kZWw7XHJcblxyXG4gICAgb3JpZ2luYWxXb3Jrc3BhY2VUZXh0OiBzdHJpbmc7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYW5hZ2VyOiBTeW5jaHJvbml6YXRpb25NYW5hZ2VyLCBwdWJsaWMgd29ya3NwYWNlRmlsZTogRmlsZSwgcHVibGljIHJlcG9zaXRvcnlGaWxlOiBSZXBvc2l0b3J5RmlsZUVudHJ5KSB7XHJcblxyXG4gICAgICAgIGlmICh3b3Jrc3BhY2VGaWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5vcmlnaW5hbFdvcmtzcGFjZVRleHQgPSB3b3Jrc3BhY2VGaWxlLnRleHQ7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLiR3b3Jrc3BhY2VGaWxlRGl2ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fd29ya3NwYWNlRmlsZURpdiBqb19zeW5jaHJvX2xpc3REaXZcIik7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdiA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2J1dHRvbkRpdiBqb19zeW5jaHJvX2xpc3REaXYgam9fc3luY2hyb19idXR0b25MZWZ0RGl2XCIpO1xyXG4gICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fYnV0dG9uRGl2IGpvX3N5bmNocm9fbGlzdERpdiBqb19zeW5jaHJvX2J1dHRvblJpZ2h0RGl2XCIpO1xyXG4gICAgICAgIHRoaXMuJHJlcG9zaXRvcnlGaWxlRGl2ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9fcmVwb3NpdG9yeUZpbGVEaXYgam9fc3luY2hyb19saXN0RGl2XCIpO1xyXG4gICAgICAgIG1hbmFnZXIuJGZpbGVMaXN0RGl2c1swXS5hcHBlbmQodGhpcy4kd29ya3NwYWNlRmlsZURpdik7XHJcbiAgICAgICAgbWFuYWdlci4kZmlsZUxpc3REaXZzWzFdLmFwcGVuZCh0aGlzLiRidXR0b25MZWZ0RGl2KTtcclxuICAgICAgICBtYW5hZ2VyLiRmaWxlTGlzdERpdnNbMl0uYXBwZW5kKHRoaXMuJGJ1dHRvblJpZ2h0RGl2KTtcclxuICAgICAgICBtYW5hZ2VyLiRmaWxlTGlzdERpdnNbM10uYXBwZW5kKHRoaXMuJHJlcG9zaXRvcnlGaWxlRGl2KTtcclxuXHJcbiAgICAgICAgbGV0IGFsbERpdnM6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD5bXSA9IFt0aGlzLiR3b3Jrc3BhY2VGaWxlRGl2LCB0aGlzLiRidXR0b25MZWZ0RGl2LCB0aGlzLiRidXR0b25SaWdodERpdiwgdGhpcy4kcmVwb3NpdG9yeUZpbGVEaXZdO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGZvciAobGV0ICRkaXYgb2YgYWxsRGl2cykge1xyXG4gICAgICAgICAgICAkZGl2Lm9uKFwibW91c2VlbnRlclwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCAkZGl2IG9mIGFsbERpdnMpICRkaXYuYWRkQ2xhc3MoJ2pvX3N5bmNocm9faG92ZXJMaW5lJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAkZGl2Lm9uKFwibW91c2VsZWF2ZVwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCAkZGl2IG9mIGFsbERpdnMpICRkaXYucmVtb3ZlQ2xhc3MoJ2pvX3N5bmNocm9faG92ZXJMaW5lJykucmVtb3ZlQ2xhc3MoXCJqb19zeW5jaHJvX2hvdmVyQWN0aXZlTGluZVwiKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAkZGl2Lm9uKFwibW91c2Vkb3duXCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0ICRkaXYgb2YgYWxsRGl2cykgJGRpdi5hZGRDbGFzcygnam9fc3luY2hyb19ob3ZlckFjdGl2ZUxpbmUnKVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgJGRpdi5vbihcIm1vdXNldXBcIiwgKCkgPT4geyBmb3IgKGxldCAkZGl2IG9mIGFsbERpdnMpICRkaXYucmVtb3ZlQ2xhc3MoJ2pvX3N5bmNocm9faG92ZXJBY3RpdmVMaW5lJykgfSk7XHJcblxyXG4gICAgICAgICAgICAkZGl2Lm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjam9fc3luY2hyb19maWxlTGlzdE91dGVyJykuZmluZCgnLmpvX3N5bmNocm9fYWN0aXZlTGluZScpLnJlbW92ZUNsYXNzKCdqb19zeW5jaHJvX2FjdGl2ZUxpbmUnKTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0ICRkaXYgb2YgYWxsRGl2cykgJGRpdi5hZGRDbGFzcygnam9fc3luY2hyb19hY3RpdmVMaW5lJyk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5tYW5hZ2VyLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubWFuYWdlci5sYXN0U2hvd25TeW5jaHJvbml6YXRpb25FbGVtZW50LmVkaXRvclN0YXRlID0gdGhhdC5tYW5hZ2VyLmRpZmZFZGl0b3Iuc2F2ZVZpZXdTdGF0ZSgpXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5tYW5hZ2VyLmxhc3RTaG93blN5bmNocm9uaXphdGlvbkVsZW1lbnQgPSB0aGlzO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuc2V0RWRpdG9yTW9kZWwoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhhdC5lZGl0b3JTdGF0ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tYW5hZ2VyLmRpZmZFZGl0b3IucmVzdG9yZVZpZXdTdGF0ZSh0aGF0LmVkaXRvclN0YXRlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0Lm1hbmFnZXIuZGlmZkVkaXRvci51cGRhdGVPcHRpb25zKHtcclxuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEVkaXRhYmxlOiB0aGF0LndvcmtzcGFjZUZpbGUgIT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZVdvcmtzcGFjZUZpbGVNb2RlbCgpO1xyXG4gICAgICAgIHRoaXMuY3JlYXRlUmVwb3NpdG9yeUZpbGVNb2RlbCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVSZXBvc2l0b3J5RmlsZU1vZGVsKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnJlcG9zaXRvcnlGaWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXBvc2l0b3J5RmlsZU1vZGVsID0gbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbCh0aGlzLnJlcG9zaXRvcnlGaWxlLnRleHQsIFwibXlKYXZhXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVwb3NpdG9yeUZpbGVNb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJcIiwgXCJteUphdmFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNldEVkaXRvck1vZGVsKCkge1xyXG4gICAgICAgIGlmICh0aGlzLm1hbmFnZXIubGFzdFNob3duU3luY2hyb25pemF0aW9uRWxlbWVudCA9PSB0aGlzKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFuYWdlci5kaWZmRWRpdG9yLnNldE1vZGVsKHtcclxuICAgICAgICAgICAgICAgIG9yaWdpbmFsOiB0aGlzLndvcmtzcGFjZUZpbGVNb2RlbCxcclxuICAgICAgICAgICAgICAgIG1vZGlmaWVkOiB0aGlzLnJlcG9zaXRvcnlGaWxlTW9kZWxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBwZW5kaW5nOiBib29sZWFuID0gZmFsc2U7XHJcbiAgICBjcmVhdGVXb3Jrc3BhY2VGaWxlTW9kZWwoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMud29ya3NwYWNlRmlsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMud29ya3NwYWNlRmlsZU1vZGVsID0gbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbCh0aGlzLndvcmtzcGFjZUZpbGUudGV4dCwgXCJteUphdmFcIik7XHJcbiAgICAgICAgICAgIHRoaXMud29ya3NwYWNlRmlsZU1vZGVsLm9uRGlkQ2hhbmdlQ29udGVudCgoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFuYWdlci5vbldvcmtzcGFjZUNvbnRlbnRDaGFuZ2VkKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdGhyb3R0bGUgY29tcGFyaXNvbiB0byBhdm9pZCBlZGl0b3Itc2xvd2Rvd25cclxuICAgICAgICAgICAgICAgIGlmKCF0aGlzLnBlbmRpbmcpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGVuZGluZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKT0+e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5vcmlnaW5hbFdvcmtzcGFjZVRleHQgIT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2VGaWxlTW9kZWwuZ2V0VmFsdWUobW9uYWNvLmVkaXRvci5FbmRPZkxpbmVQcmVmZXJlbmNlLkxGLCBmYWxzZSkgPT0gdGhpcy5vcmlnaW5hbFdvcmtzcGFjZVRleHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHdvcmtzcGFjZUZpbGVEaXYucmVtb3ZlQ2xhc3MoXCJqb19kaXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJHdvcmtzcGFjZUZpbGVEaXYuYWRkQ2xhc3MoXCJqb19kaXJ0eVwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnBlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICB9LCA3MDApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLndvcmtzcGFjZUZpbGVNb2RlbCA9IG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJcIiwgXCJteUphdmFcIik7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIG9uV29ya3NwYWNlRmlsZUNoYW5nZWQod2l0aENvbW1pdEJ1dHRvbnM6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLmNyZWF0ZVdvcmtzcGFjZUZpbGVNb2RlbCgpO1xyXG4gICAgICAgIHRoaXMuc2V0RWRpdG9yTW9kZWwoKTtcclxuICAgICAgICB0aGlzLmNvbXBhcmVGaWxlc0FuZEFkYXB0R1VJKHdpdGhDb21taXRCdXR0b25zKTtcclxuICAgICAgICB0aGlzLm1hbmFnZXIub25Xb3Jrc3BhY2VDb250ZW50Q2hhbmdlZCgpO1xyXG4gICAgICAgIHRoaXMuJHdvcmtzcGFjZUZpbGVEaXYuYWRkQ2xhc3MoXCJqb19kaXJ0eVwiKTtcclxuICAgIH1cclxuXHJcbiAgICBvblJlcG9zaXRvcnlGaWxlQ2hhbmdlZCh3aXRoQ29tbWl0QnV0dG9uczogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMuY3JlYXRlUmVwb3NpdG9yeUZpbGVNb2RlbCgpO1xyXG4gICAgICAgIHRoaXMuc2V0RWRpdG9yTW9kZWwoKTtcclxuICAgICAgICB0aGlzLmNvbXBhcmVGaWxlc0FuZEFkYXB0R1VJKHdpdGhDb21taXRCdXR0b25zKTtcclxuICAgICAgICB0aGlzLm1hbmFnZXIub25SZXBvc2l0b3J5Q29udGVudENoYW5nZWQoKTtcclxuICAgICAgICB0aGlzLiRyZXBvc2l0b3J5RmlsZURpdi5hZGRDbGFzcyhcImpvX2RpcnR5XCIpO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBhcmVGaWxlc0FuZEFkYXB0R1VJKHdpdGhDb21taXRCdXR0b25zOiBib29sZWFuKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZW1wdHlHVUkoKTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBmaWxlQ2FwdGlvbiA9IHRoaXMud29ya3NwYWNlRmlsZSA9PSBudWxsID8gXCItLS1cIiA6IHRoaXMud29ya3NwYWNlRmlsZS5uYW1lO1xyXG4gICAgICAgIGxldCBmaWxlVmVyc2lvbkNhcHRpb24gPSB0aGlzLndvcmtzcGFjZUZpbGUgPT0gbnVsbCA/IFwiXCIgOiBcIihWIFwiICsgdGhpcy53b3Jrc3BhY2VGaWxlLnZlcnNpb247XHJcblxyXG4gICAgICAgIGxldCByZXBvRmlsZUNhcHRpb24gPSB0aGlzLnJlcG9zaXRvcnlGaWxlID09IG51bGwgPyBcIi0tLVwiIDogdGhpcy5yZXBvc2l0b3J5RmlsZS5maWxlbmFtZTtcclxuICAgICAgICBsZXQgcmVwb1ZlcnNpb25DYXB0aW9uID0gdGhpcy5yZXBvc2l0b3J5RmlsZSA9PSBudWxsID8gXCJcIiA6IFwiKFYgXCIgKyB0aGlzLnJlcG9zaXRvcnlGaWxlLnZlcnNpb24gKyBcIilcIjtcclxuXHJcbiAgICAgICAgbGV0ICRzcGFjZXIxID0gbWFrZURpdihcIlwiLCBcImpvX3N5bmNocm9fNXB4X3NwYWNlclwiKTtcclxuICAgICAgICBsZXQgJHNwYWNlcjIgPSBtYWtlRGl2KFwiXCIsIFwiam9fc3luY2hyb181cHhfc3BhY2VyXCIpO1xyXG5cclxuICAgICAgICB0aGlzLiRidXR0b25SaWdodERpdi5hcHBlbmQoJHNwYWNlcjIpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy53b3Jrc3BhY2VGaWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5hcHBlbmQodGhpcy5tYWtlQnV0dG9uKFwiY3JlYXRlXCIsIFwibGVmdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LndvcmtzcGFjZUZpbGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhhdC5yZXBvc2l0b3J5RmlsZS5maWxlbmFtZSxcclxuICAgICAgICAgICAgICAgICAgICBpZDogdGhhdC5yZXBvc2l0b3J5RmlsZS5pZCxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0aGF0LnJlcG9zaXRvcnlGaWxlLnRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogdGhhdC5yZXBvc2l0b3J5RmlsZS52ZXJzaW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIGRpcnR5OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVkOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhhdC5vbldvcmtzcGFjZUZpbGVDaGFuZ2VkKHdpdGhDb21taXRCdXR0b25zKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICBpZiAod2l0aENvbW1pdEJ1dHRvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmFwcGVuZCh0aGlzLm1ha2VCdXR0b24oXCJkZWxldGVcIiwgXCJyaWdodFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZXBvc2l0b3J5RmlsZSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vblJlcG9zaXRvcnlGaWxlQ2hhbmdlZCh3aXRoQ29tbWl0QnV0dG9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMucmVwb3NpdG9yeUZpbGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAod2l0aENvbW1pdEJ1dHRvbnMpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvblJpZ2h0RGl2LmFwcGVuZCh0aGlzLm1ha2VCdXR0b24oXCJjcmVhdGVcIiwgXCJyaWdodFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZXBvc2l0b3J5RmlsZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsZW5hbWU6IHRoYXQud29ya3NwYWNlRmlsZS5uYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogdGhhdC53b3Jrc3BhY2VGaWxlLmlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiB0aGF0LndvcmtzcGFjZUZpbGUudGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogdGhhdC53b3Jrc3BhY2VGaWxlLnZlcnNpb25cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5vblJlcG9zaXRvcnlGaWxlQ2hhbmdlZCh3aXRoQ29tbWl0QnV0dG9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5hcHBlbmQodGhpcy5tYWtlQnV0dG9uKFwiZGVsZXRlXCIsIFwibGVmdFwiLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LndvcmtzcGFjZUZpbGUgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5vbldvcmtzcGFjZUZpbGVDaGFuZ2VkKHdpdGhDb21taXRCdXR0b25zKTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgaXNTeW5jaHJvbml6ZWQ6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMud29ya3NwYWNlRmlsZS52ZXJzaW9uID09IHRoaXMucmVwb3NpdG9yeUZpbGUudmVyc2lvbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMud29ya3NwYWNlRmlsZS50ZXh0ICE9IHRoaXMucmVwb3NpdG9yeUZpbGUudGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlzU3luY2hyb25pemVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgZmlsZVZlcnNpb25DYXB0aW9uICs9IFwiICsgw4RuZGVydW5nZW5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGlzU3luY2hyb25pemVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChpc1N5bmNocm9uaXplZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5hcHBlbmQoalF1ZXJ5KCc8ZGl2PnN5bmNocm9uIC0gPC9kaXY+JykpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHdpdGhDb21taXRCdXR0b25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uUmlnaHREaXYuYXBwZW5kKGpRdWVyeSgnPGRpdj4gLSBzeW5jaHJvbjwvZGl2PicpKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvbkxlZnREaXYuYXBwZW5kKHRoaXMubWFrZUJ1dHRvbihcInVwZGF0ZVwiLCBcImxlZnRcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQud29ya3NwYWNlRmlsZS50ZXh0ID0gdGhhdC5yZXBvc2l0b3J5RmlsZS50ZXh0O1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQud29ya3NwYWNlRmlsZS52ZXJzaW9uID0gdGhhdC5yZXBvc2l0b3J5RmlsZS52ZXJzaW9uO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQub25Xb3Jrc3BhY2VGaWxlQ2hhbmdlZCh3aXRoQ29tbWl0QnV0dG9ucyk7XHJcbiAgICAgICAgICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHdpdGhDb21taXRCdXR0b25zKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uUmlnaHREaXYuYXBwZW5kKHRoaXMubWFrZUJ1dHRvbihcImNvbW1pdFwiLCBcInJpZ2h0XCIsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZXBvc2l0b3J5RmlsZS50ZXh0ID0gdGhhdC53b3Jrc3BhY2VGaWxlLnRleHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQucmVwb3NpdG9yeUZpbGUudmVyc2lvbisrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LndvcmtzcGFjZUZpbGUudmVyc2lvbiA9IHRoYXQucmVwb3NpdG9yeUZpbGUudmVyc2lvbjtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5vblJlcG9zaXRvcnlGaWxlQ2hhbmdlZCh3aXRoQ29tbWl0QnV0dG9ucyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy4kYnV0dG9uTGVmdERpdi5hcHBlbmQoJHNwYWNlcjEpO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKHRoaXMud29ya3NwYWNlRmlsZSAhPSBudWxsKSBmaWxlVmVyc2lvbkNhcHRpb24gKz0gXCIpXCI7XHJcblxyXG4gICAgICAgIHRoaXMuJHdvcmtzcGFjZUZpbGVEaXYuYXBwZW5kKGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9fZmlsZW5hbWVcIj4ke2ZpbGVDYXB0aW9ufTxzcGFuIGNsYXNzPVwiam9fc3luY2hyb19maWxlVmVyc2lvblwiPiR7ZmlsZVZlcnNpb25DYXB0aW9ufTwvc3Bhbj48L2Rpdj5gKSk7XHJcbiAgICAgICAgdGhpcy4kcmVwb3NpdG9yeUZpbGVEaXYuYXBwZW5kKGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9fZmlsZW5hbWVcIj4ke3JlcG9GaWxlQ2FwdGlvbn08c3BhbiBjbGFzcz1cImpvX3N5bmNocm9fZmlsZVZlcnNpb25cIj4ke3JlcG9WZXJzaW9uQ2FwdGlvbn08L3NwYW4+PC9kaXY+YCkpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBlbXB0eUdVSSgpIHtcclxuICAgICAgICB0aGlzLiR3b3Jrc3BhY2VGaWxlRGl2LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy4kcmVwb3NpdG9yeUZpbGVEaXYuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLiRidXR0b25MZWZ0RGl2LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy4kYnV0dG9uUmlnaHREaXYuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBtYWtlQnV0dG9uKGtpbmQ6IEJ1dHRvbktpbmQsIGFycm93RGlyZWN0aW9uOiBBcnJvd0RpcmVjdGlvbiwgY2FsbGJhY2s6ICgpID0+IHZvaWQpOiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+IHtcclxuXHJcbiAgICAgICAgbGV0IGNhcHRpb24gPSBcIlwiO1xyXG4gICAgICAgIGxldCBrbGFzcyA9IFwiXCI7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoa2luZCkge1xyXG4gICAgICAgICAgICBjYXNlIFwiY29tbWl0XCI6IGNhcHRpb24gPSBcImNvbW1pdFwiOyBrbGFzcyA9IFwiam9fc3luY2hyb19jb21taXRCdXR0b25cIjsgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ1cGRhdGVcIjogY2FwdGlvbiA9IFwidXBkYXRlXCI7IGtsYXNzID0gXCJqb19zeW5jaHJvX3VwZGF0ZUJ1dHRvblwiOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImNyZWF0ZVwiOiBjYXB0aW9uID0gXCJjcmVhdGVcIjsga2xhc3MgPSBcImpvX3N5bmNocm9fY3JlYXRlQnV0dG9uXCI7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwiZGVsZXRlXCI6IGNhcHRpb24gPSBcImRlbGV0ZVwiOyBrbGFzcyA9IFwiam9fc3luY2hyb19kZWxldGVCdXR0b25cIjsgYnJlYWs7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzd2l0Y2ggKGFycm93RGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6IGtsYXNzICs9IFwiIGpvX3N5bmNocm9fYXJyb3dMZWZ0XCI7IGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwicmlnaHRcIjoga2xhc3MgKz0gXCIgam9fc3luY2hyb19hcnJvd1JpZ2h0XCI7IGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PiA9IGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9fYnV0dG9uICR7a2xhc3N9XCI+JHtjYXB0aW9ufTwvZGl2PmApO1xyXG5cclxuICAgICAgICBkaXYub24oXCJjbGlja1wiLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkgY2FsbGJhY2soKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZGl2Lm9uKFwibW91c2Vkb3duXCIsIChlKSA9PiB7IGUuc3RvcFByb3BhZ2F0aW9uKCkgfSlcclxuXHJcbiAgICAgICAgcmV0dXJuIGRpdjtcclxuXHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==