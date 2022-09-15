import { makeDiv, openContextMenu } from "../tools/HtmlTools.js";
import { SynchroWorkspace } from "./SynchroWorkspace.js";
export class HistoryElement {
    constructor(manager, repository, repositoryHistoryEntry, historyEntryIndex) {
        this.manager = manager;
        this.repository = repository;
        this.repositoryHistoryEntry = repositoryHistoryEntry;
        this.historyEntryIndex = historyEntryIndex;
        this.$historyElementDiv = makeDiv(null, "jo_synchro_historyElement");
        this.$historyElementDiv.attr("draggable", "true");
        let that = this;
        this.$historyElementDiv.on('drag', () => {
            HistoryElement.currentlyDragged = that;
        });
        let line1 = makeDiv(null, "jo_synchro_historyElementLine1");
        line1.append(jQuery(`<div class="jo_synchro_he_version">V ${repositoryHistoryEntry.version}</div>`));
        line1.append(jQuery(`<div class="jo_synchro_he_name">${repositoryHistoryEntry.name}</div>`));
        this.$historyElementDiv.append(line1);
        let line2 = makeDiv(null, "jo_synchro_historyElementLine2");
        line2.append(jQuery(`<div class="jo_synchro_he_timestamp">${repositoryHistoryEntry.timestamp}</div>`));
        this.$historyElementDiv.append(line2);
        let line3 = makeDiv(null, "jo_synchro_historyElementLine3");
        line3.append(jQuery(`<div class="jo_synchro_he_comment">${repositoryHistoryEntry.comment}</div>`));
        this.$historyElementDiv.append(line3);
        manager.$historyScrollDiv.prepend(this.$historyElementDiv);
        this.$historyElementDiv.on("click contextmenu", (ev) => {
            ev.preventDefault();
            openContextMenu([
                {
                    caption: "Auf der linken Seite darstellen",
                    callback: () => {
                        let sw = new SynchroWorkspace(this.manager).copyFromHistoryElement(this);
                        this.manager.leftSynchroWorkspace = sw;
                        this.manager.setupSynchronizationListElements();
                    }
                },
                {
                    caption: "Auf der rechten Seite darstellen",
                    callback: () => {
                        let sw = new SynchroWorkspace(this.manager).copyFromHistoryElement(this);
                        this.manager.leftSynchroWorkspace = sw;
                        this.manager.setupSynchronizationListElements();
                    }
                },
            ], ev.pageX + 2, ev.pageY + 2);
        });
    }
    getRepositoryState() {
        let entries = this.repository.historyEntries;
        // get last intermediate state
        let startIndex = this.historyEntryIndex;
        while (startIndex > 0 && !(entries[startIndex].isIntermediateEntry)) {
            startIndex--;
        }
        let files = [];
        for (let index = startIndex; index <= this.historyEntryIndex; index++) {
            let entry = entries[index];
            for (let fileEntry of entry.historyFiles) {
                if (entry.isIntermediateEntry) {
                    this.setIntermediateState(fileEntry, files);
                }
                else {
                    switch (fileEntry.type) {
                        case "create":
                            this.createFile(fileEntry, files);
                            break;
                        case "delete":
                            this.deleteFile(fileEntry, files);
                            break;
                        case "change":
                            this.changeFile(fileEntry, files);
                            break;
                        case "intermediate":
                            this.setIntermediateState(fileEntry, files);
                            break;
                    }
                }
            }
        }
        let repository = Object.assign({}, this.repository);
        repository.fileEntries = files;
        repository.version = this.repositoryHistoryEntry.version;
        return repository;
    }
    setIntermediateState(fileEntry, files) {
        let file = files.find(file => file.id == fileEntry.id);
        if (file != null) {
            file.text = fileEntry.content;
            file.version = fileEntry.version;
        }
    }
    changeFile(fileEntry, files) {
        let file = files.find(file => file.id == fileEntry.id);
        if (file != null) {
            if (fileEntry.content != null) {
                //@ts-ignore
                let patch = JSON.parse(fileEntry.content);
                let oldText = file.text;
                //@ts-ignore
                let dmp = new diff_match_patch();
                let newText = dmp.patch_apply(patch, oldText);
                file.text = newText[0];
                file.version = fileEntry.version;
            }
        }
    }
    deleteFile(fileEntry, files) {
        let index = files.findIndex(file => file.id == fileEntry.id);
        if (index != null) {
            files.splice(index, 1);
        }
    }
    createFile(fileEntry, files) {
        let file = {
            id: fileEntry.id,
            text: fileEntry.content,
            filename: fileEntry.filename,
            version: fileEntry.version
        };
        files.push(file);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGlzdG9yeUVsZW1lbnQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L3JlcG9zaXRvcnkvSGlzdG9yeUVsZW1lbnQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUV6RCxNQUFNLE9BQU8sY0FBYztJQU12QixZQUFvQixPQUErQixFQUFVLFVBQXNCLEVBQVUsc0JBQThDLEVBQVUsaUJBQXlCO1FBQTFKLFlBQU8sR0FBUCxPQUFPLENBQXdCO1FBQVUsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUFVLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBd0I7UUFBVSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQVE7UUFFMUssSUFBSSxDQUFDLGtCQUFrQixHQUFHLE9BQU8sQ0FBQyxJQUFJLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztRQUNyRSxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVsRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO1lBQ3BDLGNBQWMsQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUM7UUFDM0MsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsSUFBSSxFQUFFLGdDQUFnQyxDQUFDLENBQUM7UUFDNUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsd0NBQXdDLHNCQUFzQixDQUFDLE9BQU8sUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNyRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQ0FBbUMsc0JBQXNCLENBQUMsSUFBSSxR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WUFDNUIsT0FBTyxFQUFFLFNBQVMsQ0FBQyxPQUFPO1NBQzdCLENBQUE7UUFDRCxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3JCLENBQUM7Q0FLSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFJlcG9zaXRvcnlIaXN0b3J5RW50cnksIFJlcG9zaXRvcnksIFJlcG9zaXRvcnlIaXN0b3J5RmlsZUVudHJ5LCBSZXBvc2l0b3J5RmlsZUVudHJ5IH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBTeW5jaHJvbml6YXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4vU3luY2hyb25pemF0aW9uTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBtYWtlRGl2LCBvcGVuQ29udGV4dE1lbnUgfSBmcm9tIFwiLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IFN5bmNocm9Xb3Jrc3BhY2UgfSBmcm9tIFwiLi9TeW5jaHJvV29ya3NwYWNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgSGlzdG9yeUVsZW1lbnQge1xyXG5cclxuICAgICRoaXN0b3J5RWxlbWVudERpdjogSlF1ZXJ5PEhUTUxEaXZFbGVtZW50PjtcclxuXHJcbiAgICBzdGF0aWMgY3VycmVudGx5RHJhZ2dlZDogSGlzdG9yeUVsZW1lbnQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYW5hZ2VyOiBTeW5jaHJvbml6YXRpb25NYW5hZ2VyLCBwcml2YXRlIHJlcG9zaXRvcnk6IFJlcG9zaXRvcnksIHByaXZhdGUgcmVwb3NpdG9yeUhpc3RvcnlFbnRyeTogUmVwb3NpdG9yeUhpc3RvcnlFbnRyeSwgcHJpdmF0ZSBoaXN0b3J5RW50cnlJbmRleDogbnVtYmVyKSB7XHJcblxyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlFbGVtZW50RGl2ID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9faGlzdG9yeUVsZW1lbnRcIik7XHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeUVsZW1lbnREaXYuYXR0cihcImRyYWdnYWJsZVwiLCBcInRydWVcIik7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLiRoaXN0b3J5RWxlbWVudERpdi5vbignZHJhZycsICgpID0+IHtcclxuICAgICAgICAgICAgSGlzdG9yeUVsZW1lbnQuY3VycmVudGx5RHJhZ2dlZCA9IHRoYXQ7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBsaW5lMSA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2hpc3RvcnlFbGVtZW50TGluZTFcIik7XHJcbiAgICAgICAgbGluZTEuYXBwZW5kKGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9faGVfdmVyc2lvblwiPlYgJHtyZXBvc2l0b3J5SGlzdG9yeUVudHJ5LnZlcnNpb259PC9kaXY+YCkpO1xyXG4gICAgICAgIGxpbmUxLmFwcGVuZChqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19zeW5jaHJvX2hlX25hbWVcIj4ke3JlcG9zaXRvcnlIaXN0b3J5RW50cnkubmFtZX08L2Rpdj5gKSk7XHJcbiAgICAgICAgdGhpcy4kaGlzdG9yeUVsZW1lbnREaXYuYXBwZW5kKGxpbmUxKTtcclxuXHJcbiAgICAgICAgbGV0IGxpbmUyID0gbWFrZURpdihudWxsLCBcImpvX3N5bmNocm9faGlzdG9yeUVsZW1lbnRMaW5lMlwiKTtcclxuICAgICAgICBsaW5lMi5hcHBlbmQoalF1ZXJ5KGA8ZGl2IGNsYXNzPVwiam9fc3luY2hyb19oZV90aW1lc3RhbXBcIj4ke3JlcG9zaXRvcnlIaXN0b3J5RW50cnkudGltZXN0YW1wfTwvZGl2PmApKVxyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlFbGVtZW50RGl2LmFwcGVuZChsaW5lMik7XHJcblxyXG4gICAgICAgIGxldCBsaW5lMyA9IG1ha2VEaXYobnVsbCwgXCJqb19zeW5jaHJvX2hpc3RvcnlFbGVtZW50TGluZTNcIik7XHJcbiAgICAgICAgbGluZTMuYXBwZW5kKGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX3N5bmNocm9faGVfY29tbWVudFwiPiR7cmVwb3NpdG9yeUhpc3RvcnlFbnRyeS5jb21tZW50fTwvZGl2PmApKVxyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlFbGVtZW50RGl2LmFwcGVuZChsaW5lMyk7XHJcblxyXG4gICAgICAgIG1hbmFnZXIuJGhpc3RvcnlTY3JvbGxEaXYucHJlcGVuZCh0aGlzLiRoaXN0b3J5RWxlbWVudERpdik7XHJcblxyXG4gICAgICAgIHRoaXMuJGhpc3RvcnlFbGVtZW50RGl2Lm9uKFwiY2xpY2sgY29udGV4dG1lbnVcIiwgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIG9wZW5Db250ZXh0TWVudShbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJBdWYgZGVyIGxpbmtlbiBTZWl0ZSBkYXJzdGVsbGVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN3ID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhpcy5tYW5hZ2VyKS5jb3B5RnJvbUhpc3RvcnlFbGVtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hbmFnZXIubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSBzdztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkF1ZiBkZXIgcmVjaHRlbiBTZWl0ZSBkYXJzdGVsbGVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHN3ID0gbmV3IFN5bmNocm9Xb3Jrc3BhY2UodGhpcy5tYW5hZ2VyKS5jb3B5RnJvbUhpc3RvcnlFbGVtZW50KHRoaXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1hbmFnZXIubGVmdFN5bmNocm9Xb3Jrc3BhY2UgPSBzdztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5tYW5hZ2VyLnNldHVwU3luY2hyb25pemF0aW9uTGlzdEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIGV2LnBhZ2VYICsgMiwgZXYucGFnZVkgKyAyKVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRSZXBvc2l0b3J5U3RhdGUoKTogUmVwb3NpdG9yeSB7XHJcblxyXG4gICAgICAgIGxldCBlbnRyaWVzID0gdGhpcy5yZXBvc2l0b3J5Lmhpc3RvcnlFbnRyaWVzO1xyXG5cclxuICAgICAgICAvLyBnZXQgbGFzdCBpbnRlcm1lZGlhdGUgc3RhdGVcclxuICAgICAgICBsZXQgc3RhcnRJbmRleCA9IHRoaXMuaGlzdG9yeUVudHJ5SW5kZXg7XHJcblxyXG4gICAgICAgIHdoaWxlIChzdGFydEluZGV4ID4gMCAmJiAhKGVudHJpZXNbc3RhcnRJbmRleF0uaXNJbnRlcm1lZGlhdGVFbnRyeSkpIHtcclxuICAgICAgICAgICAgc3RhcnRJbmRleC0tO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZpbGVzOiBSZXBvc2l0b3J5RmlsZUVudHJ5W10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSBzdGFydEluZGV4OyBpbmRleCA8PSB0aGlzLmhpc3RvcnlFbnRyeUluZGV4OyBpbmRleCsrKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgZW50cnkgPSBlbnRyaWVzW2luZGV4XTtcclxuICAgICAgICAgICAgZm9yIChsZXQgZmlsZUVudHJ5IG9mIGVudHJ5Lmhpc3RvcnlGaWxlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbnRyeS5pc0ludGVybWVkaWF0ZUVudHJ5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRJbnRlcm1lZGlhdGVTdGF0ZShmaWxlRW50cnksIGZpbGVzKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChmaWxlRW50cnkudHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiY3JlYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZUZpbGUoZmlsZUVudHJ5LCBmaWxlcyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSBcImRlbGV0ZVwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5kZWxldGVGaWxlKGZpbGVFbnRyeSwgZmlsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgXCJjaGFuZ2VcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2hhbmdlRmlsZShmaWxlRW50cnksIGZpbGVzKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW50ZXJtZWRpYXRlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNldEludGVybWVkaWF0ZVN0YXRlKGZpbGVFbnRyeSwgZmlsZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCByZXBvc2l0b3J5OiBSZXBvc2l0b3J5ID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcy5yZXBvc2l0b3J5KTtcclxuICAgICAgICByZXBvc2l0b3J5LmZpbGVFbnRyaWVzID0gZmlsZXM7XHJcbiAgICAgICAgcmVwb3NpdG9yeS52ZXJzaW9uID0gdGhpcy5yZXBvc2l0b3J5SGlzdG9yeUVudHJ5LnZlcnNpb247XHJcblxyXG4gICAgICAgIHJldHVybiByZXBvc2l0b3J5O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZXRJbnRlcm1lZGlhdGVTdGF0ZShmaWxlRW50cnk6IFJlcG9zaXRvcnlIaXN0b3J5RmlsZUVudHJ5LCBmaWxlczogUmVwb3NpdG9yeUZpbGVFbnRyeVtdKSB7XHJcbiAgICAgICAgbGV0IGZpbGU6IFJlcG9zaXRvcnlGaWxlRW50cnkgPSBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5pZCA9PSBmaWxlRW50cnkuaWQpO1xyXG4gICAgICAgIGlmIChmaWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZmlsZS50ZXh0ID0gZmlsZUVudHJ5LmNvbnRlbnQ7XHJcbiAgICAgICAgICAgIGZpbGUudmVyc2lvbiA9IGZpbGVFbnRyeS52ZXJzaW9uO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VGaWxlKGZpbGVFbnRyeTogUmVwb3NpdG9yeUhpc3RvcnlGaWxlRW50cnksIGZpbGVzOiBSZXBvc2l0b3J5RmlsZUVudHJ5W10pIHtcclxuICAgICAgICBsZXQgZmlsZTogUmVwb3NpdG9yeUZpbGVFbnRyeSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLmlkID09IGZpbGVFbnRyeS5pZCk7XHJcbiAgICAgICAgaWYgKGZpbGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBpZiAoZmlsZUVudHJ5LmNvbnRlbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICBsZXQgcGF0Y2g6IHBhdGNoX29ialtdID0gSlNPTi5wYXJzZShmaWxlRW50cnkuY29udGVudCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2xkVGV4dCA9IGZpbGUudGV4dDtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgbGV0IGRtcDogZGlmZl9tYXRjaF9wYXRjaCA9IG5ldyBkaWZmX21hdGNoX3BhdGNoKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgbmV3VGV4dDogW3N0cmluZywgYm9vbGVhbltdXSA9IGRtcC5wYXRjaF9hcHBseShwYXRjaCwgb2xkVGV4dCk7XHJcbiAgICAgICAgICAgICAgICBmaWxlLnRleHQgPSBuZXdUZXh0WzBdO1xyXG4gICAgICAgICAgICAgICAgZmlsZS52ZXJzaW9uID0gZmlsZUVudHJ5LnZlcnNpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZGVsZXRlRmlsZShmaWxlRW50cnk6IFJlcG9zaXRvcnlIaXN0b3J5RmlsZUVudHJ5LCBmaWxlczogUmVwb3NpdG9yeUZpbGVFbnRyeVtdKSB7XHJcbiAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBmaWxlcy5maW5kSW5kZXgoZmlsZSA9PiBmaWxlLmlkID09IGZpbGVFbnRyeS5pZCk7XHJcbiAgICAgICAgaWYgKGluZGV4ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZmlsZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlRmlsZShmaWxlRW50cnk6IFJlcG9zaXRvcnlIaXN0b3J5RmlsZUVudHJ5LCBmaWxlczogUmVwb3NpdG9yeUZpbGVFbnRyeVtdKSB7XHJcbiAgICAgICAgbGV0IGZpbGU6IFJlcG9zaXRvcnlGaWxlRW50cnkgPSB7XHJcbiAgICAgICAgICAgIGlkOiBmaWxlRW50cnkuaWQsXHJcbiAgICAgICAgICAgIHRleHQ6IGZpbGVFbnRyeS5jb250ZW50LFxyXG4gICAgICAgICAgICBmaWxlbmFtZTogZmlsZUVudHJ5LmZpbGVuYW1lLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiBmaWxlRW50cnkudmVyc2lvblxyXG4gICAgICAgIH1cclxuICAgICAgICBmaWxlcy5wdXNoKGZpbGUpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG5cclxufSJdfQ==