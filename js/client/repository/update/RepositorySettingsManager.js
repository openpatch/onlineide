import { makeDiv, setSelectItems, getSelectedObject, openContextMenu } from "../../tools/HtmlTools.js";
import { ajax } from "../../communication/AjaxHelper.js";
export class RepositorySettingsManager {
    constructor(main) {
        this.main = main;
        this.guiReady = false;
        this.publishedToItems = [];
        this.repositoryOwnerItems = [];
        this.users = [];
    }
    initGUI() {
        this.guiReady = true;
        let that = this;
        let $updateDiv = jQuery('#updateRepo-div');
        $updateDiv.append(this.$mainHeading = makeDiv('updateRepo-mainHeading', "createUpdateRepo-mainHeading", ""));
        this.$mainHeading.append(makeDiv("", "", "Repositories verwalten"));
        this.$mainHeading.append(this.$exitButton = makeDiv("", "jo_synchro_button", "Zurück zum Programmieren", { "background-color": "var(--speedcontrol-grip)", "color": "var(--fontColorLight)", "font-size": "10pt" }));
        this.$exitButton.on("click", () => { that.exitButtonClicked(); });
        let $divBelow = makeDiv("updateRepo-divBelow");
        $updateDiv.append($divBelow);
        let $divLeft = makeDiv("updateRepo-divLeft");
        $divBelow.append($divLeft);
        $divLeft.append(makeDiv('', 'updateRepo-minorHeading', 'Repositories:'));
        this.$repoListDiv = makeDiv("updateRepo-repoListDiv");
        $divLeft.append(this.$repoListDiv);
        let $rightDiv = makeDiv("updateRepo-divRight");
        $divBelow.append($rightDiv);
        this.$settingsDiv = makeDiv("", "createUpdateRepo-settingsDiv");
        $rightDiv.append(this.$settingsDiv);
        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Name des Repositorys:</div>'));
        this.$settingsDiv.append(this.$repoName = jQuery('<input type="text" class="createUpdateRepo-inputcolumn"></input>'));
        this.$repoName.on("input", () => { that.enableSaveButton(); });
        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Beschreibung:</div>'));
        this.$settingsDiv.append(this.$repoDescription = jQuery('<textarea class="createUpdateRepo-inputcolumn" style="min-height: 4em"></textarea>'));
        this.$repoDescription.on("input", () => { that.enableSaveButton(); });
        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Veröffentlicht für:</div>'));
        this.$settingsDiv.append(this.$repoPublishedTo = jQuery('<select class="createUpdateRepo-inputcolumn"></select>'));
        this.$repoPublishedTo.on("change", () => { that.enableSaveButton(); });
        this.$settingsDiv.append(jQuery('<div class="createUpdateRepo-settingsLabel">Eigentümer:</div>'));
        this.$settingsDiv.append(this.$repoOwner = jQuery('<select class="createUpdateRepo-inputcolumn"></select>'));
        this.$repoOwner.on("change", () => { that.enableSaveButton(); });
        $rightDiv.append(this.$userlistDiv = makeDiv("updateRepo-userlistDiv"));
        this.$userlistDiv.append(makeDiv(null, "updateRepo-userlistheading", "Benutzer, die das Repository nutzen", { "grid-column": 1 }));
        this.$userlistDiv.append(makeDiv(null, "updateRepo-userlistheading", "Schreibberechtigung", { "grid-column": 2 }));
        let $buttonDiv = makeDiv("updateRepo-buttonDiv");
        $buttonDiv.append(this.$saveButton = makeDiv("", "jo_synchro_button", "Änderungen speichern", { "background-color": "var(--updateButtonBackground)", "color": "var(--updateButtonColor)" }));
        this.$saveButton.on("click", () => { that.saveButtonClicked(); });
        this.$saveButton.hide();
        $rightDiv.append($buttonDiv);
    }
    enableSaveButton() {
        this.$saveButton.show();
    }
    show(repository_id) {
        if (!this.guiReady) {
            this.initGUI();
        }
        let $synchroDiv = jQuery('#updateRepo-div');
        $synchroDiv.css('visibility', 'visible');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'hidden');
        let user = this.main.user;
        let is_student = !(user.is_teacher || user.is_admin || user.is_schooladmin);
        this.publishedToItems = [
            { value: 0, object: 0, caption: "Keine Veröffentlichung (privates Repository)" },
            { value: 1, object: 1, caption: is_student ? "Veröffentlicht für alle Schüler/innen der Klasse" : "Veröffentlicht für alle Schüler/innen der unterrichteten Klassen" },
            { value: 2, object: 2, caption: "Veröffentlicht für alle Schüler/innen der Schule" },
        ];
        setSelectItems(this.$repoPublishedTo, this.publishedToItems, 0);
        this.$saveButton.show();
        this.showRepositoryList();
        let that = this;
        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.hide();
        });
    }
    deleteRepository(repInfo) {
        let that = this;
        let request = { repository_id: repInfo.id };
        ajax('deleteRepository', request, () => {
            that.showRepositoryList();
        });
    }
    showRepositoryList() {
        this.emptyRepositoryInfo();
        let grlq = {
            onlyOwnRepositories: true
        };
        this.$repoListDiv.empty();
        let that = this;
        ajax('getRepositoryList', grlq, (response) => {
            let $firstDiv;
            let firstRepInfo;
            if (response.repositories.length == 0) {
                alert('Sie haben noch keine Repositories, und\nkönnen daher keine verwalten.\nTipp: Ein Repository können Sie durch Rechtsklick auf einen Workspace anlegen.');
                that.exitButtonClicked();
                return;
            }
            response.repositories.forEach(repInfo => {
                let $div = makeDiv('', 'updateRepo-repoListItem');
                let $namediv = makeDiv('', '', repInfo.name);
                let $deleteDiv = jQuery('<div class="img_delete jo_button jo_active" title="Repository löschen..."></div>');
                $div.append($namediv, $deleteDiv);
                this.$repoListDiv.append($div);
                $div.on('click', (e) => {
                    that.selectRepository($div, repInfo);
                });
                $div.data('repoInfo', repInfo);
                if (firstRepInfo == null) {
                    firstRepInfo = repInfo;
                    $firstDiv = $div;
                }
                $deleteDiv.on("click", (ev) => {
                    ev.preventDefault();
                    openContextMenu([{
                            caption: "Abbrechen",
                            callback: () => { }
                        }, {
                            caption: "Ich bin mir sicher: löschen!",
                            color: "#ff6060",
                            callback: () => {
                                that.deleteRepository(repInfo);
                            }
                        }], ev.pageX + 2, ev.pageY + 2);
                    ev.stopPropagation();
                });
            });
            if ($firstDiv != null) {
                this.selectRepository($firstDiv, firstRepInfo);
            }
        }, (message) => {
            console.log(message);
            alert('Sie haben noch keine Repositories, und\nkönnen daher keine verwalten.\nTipp: Ein Repository können Sie durch Rechtsklick auf einen Workspace anlegen.');
            that.exitButtonClicked();
            return;
        });
    }
    selectRepository($repoDiv, repInfo) {
        this.emptyRepositoryInfo();
        if (this.$saveButton.is(":visible")) {
            let selectedItem = this.$repoListDiv.find('.active').first();
            let repoData = selectedItem.data('repoInfo');
            if (repoData) {
                alert(`Deine Änderungen am Repository "${repoData.name}" wurden nicht gespeichert.`);
            }
        }
        this.$saveButton.hide();
        this.$repoListDiv.find('.updateRepo-repoListItem').removeClass('active');
        $repoDiv.addClass('active');
        this.$repoName.val(repInfo.name);
        this.$repoDescription.val(repInfo.description);
        this.$repoPublishedTo.val(repInfo.published_to);
        this.$repoOwner.empty();
        this.$userlistDiv.children().not('.updateRepo-userlistheading').remove();
        let req = { repository_id: repInfo.id };
        let that = this;
        ajax('getRepositoryUserList', req, (response) => {
            response.repositoryUserList.forEach(userData => {
                let $userDiv = makeDiv("", "updateRepo-userDiv", `${userData.firstName} ${userData.lastName} (${userData.username})`, { 'grid-column': 1 });
                let $canWriteDiv = makeDiv("", "canWriteDiv", "", { 'grid-column': 2 });
                let $canWriteCheckBox = jQuery('<input type="checkbox">');
                $canWriteDiv.append($canWriteCheckBox);
                //@ts-ignore
                $canWriteCheckBox.attr('checked', userData.canWrite);
                $canWriteCheckBox.data('user', userData);
                $canWriteCheckBox.on("change", () => { that.enableSaveButton(); });
                that.$userlistDiv.append($userDiv, $canWriteDiv);
            });
            that.$repoOwner.empty();
            setSelectItems(that.$repoOwner, response.repositoryUserList.map(userData => {
                let se = {
                    caption: `${userData.firstName} ${userData.lastName} (${userData.username})`,
                    object: userData,
                    value: userData.user_id + ""
                };
                return se;
            }), repInfo.owner_id + "");
        });
    }
    emptyRepositoryInfo() {
        this.$repoOwner.empty();
        this.$repoName.val('');
        this.$repoDescription.val('');
        this.$userlistDiv.find('.updateRepo-userDiv').remove();
        this.$userlistDiv.find('.canWriteDiv').remove();
    }
    hide() {
        let $synchroDiv = jQuery('#updateRepo-div');
        $synchroDiv.css('visibility', 'hidden');
        let $mainDiv = jQuery('#main');
        $mainDiv.css('visibility', 'visible');
    }
    saveButtonClicked() {
        let that = this;
        let selectedItem = this.$repoListDiv.find('.active').first();
        let repoData = selectedItem.data('repoInfo');
        let name = this.$repoName.val();
        let owner = getSelectedObject(this.$repoOwner);
        let published_to = getSelectedObject(this.$repoPublishedTo);
        let updateRepositoryRequest = {
            owner_id: owner.user_id,
            description: this.$repoDescription.val(),
            published_to: published_to,
            repository_id: repoData.id,
            name: name
        };
        // update user write access:
        let writeAccessList = [];
        that.$userlistDiv.find('input').each((index, element) => {
            let $element = jQuery(element);
            let user = $element.data('user');
            writeAccessList.push({
                has_write_access: jQuery(element).is(':checked'),
                user_id: user.user_id
            });
        });
        let request = {
            repository_id: repoData.id,
            writeAccessList: writeAccessList
        };
        if (repoData.owner_id == owner.user_id ||
            confirm("Soll die Eigentümerschaft über das Repository " + repoData.name + " wirklich an " + owner.firstName + " " + owner.lastName + " übertragen werden?")) {
            ajax('updateRepositoryUserWriteAccess', request, (response) => {
                ajax("updateRepository", updateRepositoryRequest, (response) => {
                    repoData.name = name;
                    repoData.owner_id = owner.user_id;
                    repoData.owner_name = owner.firstName + " " + owner.lastName;
                    repoData.owner_username = owner.username;
                    repoData.published_to = published_to;
                    repoData.description = updateRepositoryRequest.description;
                    alert('Die Änderungen wurden erfolgreich gespeichert.');
                    that.$saveButton.hide();
                    that.showRepositoryList();
                }, (errorMessage) => {
                    alert("Fehler: " + errorMessage);
                    that.exitButtonClicked();
                });
            }, (errorMessage) => {
                alert("Fehler: " + errorMessage);
                that.exitButtonClicked();
            });
        }
        else {
            alert("Der Speichervorgang wurde nicht durchgeführt.");
        }
    }
    exitButtonClicked() {
        window.history.back();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsT0FBTyxFQUFjLGNBQWMsRUFBRSxpQkFBaUIsRUFBRSxlQUFlLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUVuSCxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sbUNBQW1DLENBQUM7QUFHekQsTUFBTSxPQUFPLHlCQUF5QjtJQTRCbEMsWUFBbUIsSUFBVTtRQUFWLFNBQUksR0FBSixJQUFJLENBQU07UUExQjdCLGFBQVEsR0FBWSxLQUFLLENBQUM7UUFrQjFCLHFCQUFnQixHQUFpQixFQUFFLENBQUM7UUFFcEMseUJBQW9CLEdBQWlCLEVBQUUsQ0FBQztRQUV4QyxVQUFLLEdBQXFCLEVBQUUsQ0FBQztJQUs3QixDQUFDO0lBRUQsT0FBTztRQUNILElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQ3JCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUUzQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixFQUFFLDhCQUE4QixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDN0csSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBQ3BFLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLEdBQUcsT0FBTyxDQUFDLEVBQUUsRUFBRSxtQkFBbUIsRUFBRSwwQkFBMEIsRUFBRSxFQUFF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V0FBVyxDQUFDLElBQUksRUFBRSxDQUFDO29CQUN4QixJQUFJLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztnQkFHOUIsQ0FBQyxFQUFFLENBQUMsWUFBb0IsRUFBRSxFQUFFO29CQUN4QixLQUFLLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQyxDQUFDO29CQUNqQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztnQkFDN0IsQ0FBQyxDQUFDLENBQUM7WUFFUCxDQUFDLEVBQUUsQ0FBQyxZQUFvQixFQUFFLEVBQUU7Z0JBQ3hCLEtBQUssQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQzdCLENBQUMsQ0FDQSxDQUFDO1NBQ0w7YUFBTTtZQUNILEtBQUssQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDO1NBQzFEO0lBQ0wsQ0FBQztJQUdELGlCQUFpQjtRQUNiLE1BQU0sQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDMUIsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi8uLi9tYWluL01haW4uanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uLy4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgbWFrZURpdiwgU2VsZWN0SXRlbSwgc2V0U2VsZWN0SXRlbXMsIGdldFNlbGVjdGVkT2JqZWN0LCBvcGVuQ29udGV4dE1lbnUgfSBmcm9tIFwiLi4vLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlVc2VyLCBHZXRSZXBvc2l0b3J5UmVxdWVzdCwgR2V0UmVwb3NpdG9yeVJlc3BvbnNlLCBHZXRSZXBvc2l0b3J5VXNlckxpc3RSZXF1ZXN0LCBHZXRSZXBvc2l0b3J5VXNlckxpc3RSZXNwb25zZSwgVXNlckRhdGEsIEdldFJlcG9zaXRvcnlMaXN0UmVxdWVzdCwgR2V0UmVwb3NpdG9yeUxpc3RSZXNwb25zZSwgUmVwb3NpdG9yeUluZm8sIFVwZGF0ZVJlcG9zaXRvcnlSZXF1ZXN0LCBVcGRhdGVSZXBvc2l0b3J5UmVzcG9uc2UsIFJlcG9zaXRvcnlVc2VyV3JpdGVBY2Nlc3NEYXRhLCBVcGRhdGVSZXBvc2l0b3J5VXNlcldyaXRlQWNjZXNzUmVxdWVzdCwgVXBkYXRlUmVwb3NpdG9yeVVzZXJXcml0ZUFjY2Vzc1Jlc3BvbnNlLCBEZWxldGVSZXBvc2l0b3J5UmVxdWVzdCB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlciB7XHJcblxyXG4gICAgZ3VpUmVhZHk6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICAkbWFpbkhlYWRpbmc6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcblxyXG4gICAgJHNldHRpbmdzRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJHJlcG9OYW1lOiBKUXVlcnk8SFRNTElucHV0RWxlbWVudD47XHJcbiAgICAkcmVwb0Rlc2NyaXB0aW9uOiBKUXVlcnk8SFRNTFRleHRBcmVhRWxlbWVudD47XHJcbiAgICAkcmVwb1B1Ymxpc2hlZFRvOiBKUXVlcnk8SFRNTFNlbGVjdEVsZW1lbnQ+O1xyXG4gICAgJHJlcG9Pd25lcjogSlF1ZXJ5PEhUTUxTZWxlY3RFbGVtZW50PjtcclxuXHJcbiAgICAkcmVwb0xpc3REaXY6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgJHVzZXJsaXN0RGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgICRleGl0QnV0dG9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJHNhdmVCdXR0b246IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkZGVsZXRlQnV0dG9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIHB1Ymxpc2hlZFRvSXRlbXM6IFNlbGVjdEl0ZW1bXSA9IFtdO1xyXG5cclxuICAgIHJlcG9zaXRvcnlPd25lckl0ZW1zOiBTZWxlY3RJdGVtW10gPSBbXTtcclxuXHJcbiAgICB1c2VyczogUmVwb3NpdG9yeVVzZXJbXSA9IFtdO1xyXG5cclxuICAgIHdvcmtzcGFjZTogV29ya3NwYWNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtYWluOiBNYWluKSB7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuICAgICAgICB0aGlzLmd1aVJlYWR5ID0gdHJ1ZTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgbGV0ICR1cGRhdGVEaXYgPSBqUXVlcnkoJyN1cGRhdGVSZXBvLWRpdicpO1xyXG5cclxuICAgICAgICAkdXBkYXRlRGl2LmFwcGVuZCh0aGlzLiRtYWluSGVhZGluZyA9IG1ha2VEaXYoJ3VwZGF0ZVJlcG8tbWFpbkhlYWRpbmcnLCBcImNyZWF0ZVVwZGF0ZVJlcG8tbWFpbkhlYWRpbmdcIiwgXCJcIikpO1xyXG4gICAgICAgIHRoaXMuJG1haW5IZWFkaW5nLmFwcGVuZChtYWtlRGl2KFwiXCIsIFwiXCIsIFwiUmVwb3NpdG9yaWVzIHZlcndhbHRlblwiKSk7XHJcbiAgICAgICAgdGhpcy4kbWFpbkhlYWRpbmcuYXBwZW5kKHRoaXMuJGV4aXRCdXR0b24gPSBtYWtlRGl2KFwiXCIsIFwiam9fc3luY2hyb19idXR0b25cIiwgXCJadXLDvGNrIHp1bSBQcm9ncmFtbWllcmVuXCIsIHsgXCJiYWNrZ3JvdW5kLWNvbG9yXCI6IFwidmFyKC0tc3BlZWRjb250cm9sLWdyaXApXCIsIFwiY29sb3JcIjogXCJ2YXIoLS1mb250Q29sb3JMaWdodClcIiwgXCJmb250LXNpemVcIjogXCIxMHB0XCIgfSkpO1xyXG4gICAgICAgIHRoaXMuJGV4aXRCdXR0b24ub24oXCJjbGlja1wiLCAoKSA9PiB7IHRoYXQuZXhpdEJ1dHRvbkNsaWNrZWQoKSB9KVxyXG5cclxuXHJcbiAgICAgICAgbGV0ICRkaXZCZWxvdyA9IG1ha2VEaXYoXCJ1cGRhdGVSZXBvLWRpdkJlbG93XCIpO1xyXG4gICAgICAgICR1cGRhdGVEaXYuYXBwZW5kKCRkaXZCZWxvdyk7XHJcblxyXG4gICAgICAgIGxldCAkZGl2TGVmdCA9IG1ha2VEaXYoXCJ1cGRhdGVSZXBvLWRpdkxlZnRcIik7XHJcbiAgICAgICAgJGRpdkJlbG93LmFwcGVuZCgkZGl2TGVmdCk7XHJcblxyXG4gICAgICAgICRkaXZMZWZ0LmFwcGVuZChtYWtlRGl2KCcnLCAndXBkYXRlUmVwby1taW5vckhlYWRpbmcnLCAnUmVwb3NpdG9yaWVzOicpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kcmVwb0xpc3REaXYgPSBtYWtlRGl2KFwidXBkYXRlUmVwby1yZXBvTGlzdERpdlwiKTtcclxuICAgICAgICAkZGl2TGVmdC5hcHBlbmQodGhpcy4kcmVwb0xpc3REaXYpO1xyXG5cclxuICAgICAgICBsZXQgJHJpZ2h0RGl2ID0gbWFrZURpdihcInVwZGF0ZVJlcG8tZGl2UmlnaHRcIik7XHJcbiAgICAgICAgJGRpdkJlbG93LmFwcGVuZCgkcmlnaHREaXYpO1xyXG5cclxuICAgICAgICB0aGlzLiRzZXR0aW5nc0RpdiA9IG1ha2VEaXYoXCJcIiwgXCJjcmVhdGVVcGRhdGVSZXBvLXNldHRpbmdzRGl2XCIpO1xyXG4gICAgICAgICRyaWdodERpdi5hcHBlbmQodGhpcy4kc2V0dGluZ3NEaXYpO1xyXG5cclxuICAgICAgICB0aGlzLiRzZXR0aW5nc0Rpdi5hcHBlbmQoalF1ZXJ5KCc8ZGl2IGNsYXNzPVwiY3JlYXRlVXBkYXRlUmVwby1zZXR0aW5nc0xhYmVsXCI+TmFtZSBkZXMgUmVwb3NpdG9yeXM6PC9kaXY+JykpO1xyXG4gICAgICAgIHRoaXMuJHNldHRpbmdzRGl2LmFwcGVuZCh0aGlzLiRyZXBvTmFtZSA9IGpRdWVyeSgnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJjcmVhdGVVcGRhdGVSZXBvLWlucHV0Y29sdW1uXCI+PC9pbnB1dD4nKSk7XHJcbiAgICAgICAgdGhpcy4kcmVwb05hbWUub24oXCJpbnB1dFwiLCAoKSA9PiB7IHRoYXQuZW5hYmxlU2F2ZUJ1dHRvbigpIH0pO1xyXG5cclxuICAgICAgICB0aGlzLiRzZXR0aW5nc0Rpdi5hcHBlbmQoalF1ZXJ5KCc8ZGl2IGNsYXNzPVwiY3JlYXRlVXBkYXRlUmVwby1zZXR0aW5nc0xhYmVsXCI+QmVzY2hyZWlidW5nOjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiRzZXR0aW5nc0Rpdi5hcHBlbmQodGhpcy4kcmVwb0Rlc2NyaXB0aW9uID0galF1ZXJ5KCc8dGV4dGFyZWEgY2xhc3M9XCJjcmVhdGVVcGRhdGVSZXBvLWlucHV0Y29sdW1uXCIgc3R5bGU9XCJtaW4taGVpZ2h0OiA0ZW1cIj48L3RleHRhcmVhPicpKTtcclxuICAgICAgICB0aGlzLiRyZXBvRGVzY3JpcHRpb24ub24oXCJpbnB1dFwiLCAoKSA9PiB7IHRoYXQuZW5hYmxlU2F2ZUJ1dHRvbigpIH0pO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy4kc2V0dGluZ3NEaXYuYXBwZW5kKGpRdWVyeSgnPGRpdiBjbGFzcz1cImNyZWF0ZVVwZGF0ZVJlcG8tc2V0dGluZ3NMYWJlbFwiPlZlcsO2ZmZlbnRsaWNodCBmw7xyOjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiRzZXR0aW5nc0Rpdi5hcHBlbmQodGhpcy4kcmVwb1B1Ymxpc2hlZFRvID0galF1ZXJ5KCc8c2VsZWN0IGNsYXNzPVwiY3JlYXRlVXBkYXRlUmVwby1pbnB1dGNvbHVtblwiPjwvc2VsZWN0PicpKTtcclxuICAgICAgICB0aGlzLiRyZXBvUHVibGlzaGVkVG8ub24oXCJjaGFuZ2VcIiwgKCkgPT4geyB0aGF0LmVuYWJsZVNhdmVCdXR0b24oKSB9KTtcclxuXHJcbiAgICAgICAgdGhpcy4kc2V0dGluZ3NEaXYuYXBwZW5kKGpRdWVyeSgnPGRpdiBjbGFzcz1cImNyZWF0ZVVwZGF0ZVJlcG8tc2V0dGluZ3NMYWJlbFwiPkVpZ2VudMO8bWVyOjwvZGl2PicpKTtcclxuICAgICAgICB0aGlzLiRzZXR0aW5nc0Rpdi5hcHBlbmQodGhpcy4kcmVwb093bmVyID0galF1ZXJ5KCc8c2VsZWN0IGNsYXNzPVwiY3JlYXRlVXBkYXRlUmVwby1pbnB1dGNvbHVtblwiPjwvc2VsZWN0PicpKTtcclxuICAgICAgICB0aGlzLiRyZXBvT3duZXIub24oXCJjaGFuZ2VcIiwgKCkgPT4geyB0aGF0LmVuYWJsZVNhdmVCdXR0b24oKSB9KTtcclxuXHJcbiAgICAgICAgJHJpZ2h0RGl2LmFwcGVuZCh0aGlzLiR1c2VybGlzdERpdiA9IG1ha2VEaXYoXCJ1cGRhdGVSZXBvLXVzZXJsaXN0RGl2XCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy4kdXNlcmxpc3REaXYuYXBwZW5kKG1ha2VEaXYobnVsbCwgXCJ1cGRhdGVSZXBvLXVzZXJsaXN0aGVhZGluZ1wiLCBcIkJlbnV0emVyLCBkaWUgZGFzIFJlcG9zaXRvcnkgbnV0emVuXCIsIHsgXCJncmlkLWNvbHVtblwiOiAxIH0pKVxyXG4gICAgICAgIHRoaXMuJHVzZXJsaXN0RGl2LmFwcGVuZChtYWtlRGl2KG51bGwsIFwidXBkYXRlUmVwby11c2VybGlzdGhlYWRpbmdcIiwgXCJTY2hyZWliYmVyZWNodGlndW5nXCIsIHsgXCJncmlkLWNvbHVtblwiOiAyIH0pKVxyXG5cclxuICAgICAgICBsZXQgJGJ1dHRvbkRpdiA9IG1ha2VEaXYoXCJ1cGRhdGVSZXBvLWJ1dHRvbkRpdlwiKTtcclxuXHJcbiAgICAgICAgJGJ1dHRvbkRpdi5hcHBlbmQodGhpcy4kc2F2ZUJ1dHRvbiA9IG1ha2VEaXYoXCJcIiwgXCJqb19zeW5jaHJvX2J1dHRvblwiLCBcIsOEbmRlcnVuZ2VuIHNwZWljaGVyblwiLCB7IFwiYmFja2dyb3VuZC1jb2xvclwiOiBcInZhcigtLXVwZGF0ZUJ1dHRvbkJhY2tncm91bmQpXCIsIFwiY29sb3JcIjogXCJ2YXIoLS11cGRhdGVCdXR0b25Db2xvcilcIiB9KSk7XHJcbiAgICAgICAgdGhpcy4kc2F2ZUJ1dHRvbi5vbihcImNsaWNrXCIsICgpID0+IHsgdGhhdC5zYXZlQnV0dG9uQ2xpY2tlZCgpIH0pXHJcbiAgICAgICAgdGhpcy4kc2F2ZUJ1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgICRyaWdodERpdi5hcHBlbmQoJGJ1dHRvbkRpdik7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGVuYWJsZVNhdmVCdXR0b24oKSB7XHJcbiAgICAgICAgdGhpcy4kc2F2ZUJ1dHRvbi5zaG93KCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvdyhyZXBvc2l0b3J5X2lkOiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmd1aVJlYWR5KSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdEdVSSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0ICRzeW5jaHJvRGl2ID0galF1ZXJ5KCcjdXBkYXRlUmVwby1kaXYnKTtcclxuICAgICAgICAkc3luY2hyb0Rpdi5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgICAgIGxldCAkbWFpbkRpdiA9IGpRdWVyeSgnI21haW4nKTtcclxuICAgICAgICAkbWFpbkRpdi5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcblxyXG4gICAgICAgIGxldCB1c2VyID0gdGhpcy5tYWluLnVzZXI7XHJcbiAgICAgICAgbGV0IGlzX3N0dWRlbnQgPSAhKHVzZXIuaXNfdGVhY2hlciB8fCB1c2VyLmlzX2FkbWluIHx8IHVzZXIuaXNfc2Nob29sYWRtaW4pO1xyXG5cclxuICAgICAgICB0aGlzLnB1Ymxpc2hlZFRvSXRlbXMgPSBbXHJcbiAgICAgICAgICAgIHsgdmFsdWU6IDAsIG9iamVjdDogMCwgY2FwdGlvbjogXCJLZWluZSBWZXLDtmZmZW50bGljaHVuZyAocHJpdmF0ZXMgUmVwb3NpdG9yeSlcIiB9LFxyXG4gICAgICAgICAgICB7IHZhbHVlOiAxLCBvYmplY3Q6IDEsIGNhcHRpb246IGlzX3N0dWRlbnQgPyBcIlZlcsO2ZmZlbnRsaWNodCBmw7xyIGFsbGUgU2Now7xsZXIvaW5uZW4gZGVyIEtsYXNzZVwiIDogXCJWZXLDtmZmZW50bGljaHQgZsO8ciBhbGxlIFNjaMO8bGVyL2lubmVuIGRlciB1bnRlcnJpY2h0ZXRlbiBLbGFzc2VuXCIgfSxcclxuICAgICAgICAgICAgeyB2YWx1ZTogMiwgb2JqZWN0OiAyLCBjYXB0aW9uOiBcIlZlcsO2ZmZlbnRsaWNodCBmw7xyIGFsbGUgU2Now7xsZXIvaW5uZW4gZGVyIFNjaHVsZVwiIH0sXHJcbiAgICAgICAgXTtcclxuXHJcbiAgICAgICAgc2V0U2VsZWN0SXRlbXModGhpcy4kcmVwb1B1Ymxpc2hlZFRvLCB0aGlzLnB1Ymxpc2hlZFRvSXRlbXMsIDApO1xyXG5cclxuICAgICAgICB0aGlzLiRzYXZlQnV0dG9uLnNob3coKTtcclxuXHJcbiAgICAgICAgdGhpcy5zaG93UmVwb3NpdG9yeUxpc3QoKTtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLm1haW4ud2luZG93U3RhdGVNYW5hZ2VyLnJlZ2lzdGVyT25lVGltZUJhY2tCdXR0b25MaXN0ZW5lcigoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuaGlkZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkZWxldGVSZXBvc2l0b3J5KHJlcEluZm86IFJlcG9zaXRvcnlJbmZvKSB7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBsZXQgcmVxdWVzdDogRGVsZXRlUmVwb3NpdG9yeVJlcXVlc3QgPSB7IHJlcG9zaXRvcnlfaWQ6IHJlcEluZm8uaWQgfTtcclxuICAgICAgICBhamF4KCdkZWxldGVSZXBvc2l0b3J5JywgcmVxdWVzdCwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnNob3dSZXBvc2l0b3J5TGlzdCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzaG93UmVwb3NpdG9yeUxpc3QoKSB7XHJcbiAgICAgICAgdGhpcy5lbXB0eVJlcG9zaXRvcnlJbmZvKCk7XHJcbiAgICAgICAgbGV0IGdybHE6IEdldFJlcG9zaXRvcnlMaXN0UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgb25seU93blJlcG9zaXRvcmllczogdHJ1ZVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy4kcmVwb0xpc3REaXYuZW1wdHkoKTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgYWpheCgnZ2V0UmVwb3NpdG9yeUxpc3QnLCBncmxxLCAocmVzcG9uc2U6IEdldFJlcG9zaXRvcnlMaXN0UmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCAkZmlyc3REaXY6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD47XHJcbiAgICAgICAgICAgIGxldCBmaXJzdFJlcEluZm86IFJlcG9zaXRvcnlJbmZvO1xyXG5cclxuICAgICAgICAgICAgaWYocmVzcG9uc2UucmVwb3NpdG9yaWVzLmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgICAgIGFsZXJ0KCdTaWUgaGFiZW4gbm9jaCBrZWluZSBSZXBvc2l0b3JpZXMsIHVuZFxcbmvDtm5uZW4gZGFoZXIga2VpbmUgdmVyd2FsdGVuLlxcblRpcHA6IEVpbiBSZXBvc2l0b3J5IGvDtm5uZW4gU2llIGR1cmNoIFJlY2h0c2tsaWNrIGF1ZiBlaW5lbiBXb3Jrc3BhY2UgYW5sZWdlbi4nKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZXhpdEJ1dHRvbkNsaWNrZWQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmVzcG9uc2UucmVwb3NpdG9yaWVzLmZvckVhY2gocmVwSW5mbyA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgJGRpdiA9IG1ha2VEaXYoJycsICd1cGRhdGVSZXBvLXJlcG9MaXN0SXRlbScpO1xyXG4gICAgICAgICAgICAgICAgbGV0ICRuYW1lZGl2ID0gbWFrZURpdignJywgJycsIHJlcEluZm8ubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgJGRlbGV0ZURpdiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImltZ19kZWxldGUgam9fYnV0dG9uIGpvX2FjdGl2ZVwiIHRpdGxlPVwiUmVwb3NpdG9yeSBsw7ZzY2hlbi4uLlwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgJGRpdi5hcHBlbmQoJG5hbWVkaXYsICRkZWxldGVEaXYpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kcmVwb0xpc3REaXYuYXBwZW5kKCRkaXYpO1xyXG4gICAgICAgICAgICAgICAgJGRpdi5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0UmVwb3NpdG9yeSgkZGl2LCByZXBJbmZvKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAkZGl2LmRhdGEoJ3JlcG9JbmZvJywgcmVwSW5mbyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoZmlyc3RSZXBJbmZvID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBmaXJzdFJlcEluZm8gPSByZXBJbmZvO1xyXG4gICAgICAgICAgICAgICAgICAgICRmaXJzdERpdiA9ICRkaXY7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgJGRlbGV0ZURpdi5vbihcImNsaWNrXCIsIChldikgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbkNvbnRleHRNZW51KFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiQWJicmVjaGVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7IH1cclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiSWNoIGJpbiBtaXIgc2ljaGVyOiBsw7ZzY2hlbiFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiI2ZmNjA2MFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kZWxldGVSZXBvc2l0b3J5KHJlcEluZm8pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfV0sIGV2LnBhZ2VYICsgMiwgZXYucGFnZVkgKyAyKTtcclxuICAgICAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmICgkZmlyc3REaXYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZWxlY3RSZXBvc2l0b3J5KCRmaXJzdERpdiwgZmlyc3RSZXBJbmZvKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCAobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhtZXNzYWdlKTtcclxuICAgICAgICAgICAgYWxlcnQoJ1NpZSBoYWJlbiBub2NoIGtlaW5lIFJlcG9zaXRvcmllcywgdW5kXFxua8O2bm5lbiBkYWhlciBrZWluZSB2ZXJ3YWx0ZW4uXFxuVGlwcDogRWluIFJlcG9zaXRvcnkga8O2bm5lbiBTaWUgZHVyY2ggUmVjaHRza2xpY2sgYXVmIGVpbmVuIFdvcmtzcGFjZSBhbmxlZ2VuLicpO1xyXG4gICAgICAgICAgICB0aGF0LmV4aXRCdXR0b25DbGlja2VkKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3RSZXBvc2l0b3J5KCRyZXBvRGl2OiBKUXVlcnk8SFRNTERpdkVsZW1lbnQ+LCByZXBJbmZvOiBSZXBvc2l0b3J5SW5mbykge1xyXG4gICAgICAgIHRoaXMuZW1wdHlSZXBvc2l0b3J5SW5mbygpO1xyXG4gICAgICAgIGlmICh0aGlzLiRzYXZlQnV0dG9uLmlzKFwiOnZpc2libGVcIikpIHtcclxuICAgICAgICAgICAgbGV0IHNlbGVjdGVkSXRlbSA9IHRoaXMuJHJlcG9MaXN0RGl2LmZpbmQoJy5hY3RpdmUnKS5maXJzdCgpO1xyXG4gICAgICAgICAgICBsZXQgcmVwb0RhdGE6IFJlcG9zaXRvcnlJbmZvID0gPGFueT5zZWxlY3RlZEl0ZW0uZGF0YSgncmVwb0luZm8nKTtcclxuICAgICAgICAgICAgaWYgKHJlcG9EYXRhKSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChgRGVpbmUgw4RuZGVydW5nZW4gYW0gUmVwb3NpdG9yeSBcIiR7cmVwb0RhdGEubmFtZX1cIiB3dXJkZW4gbmljaHQgZ2VzcGVpY2hlcnQuYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJHNhdmVCdXR0b24uaGlkZSgpO1xyXG4gICAgICAgIHRoaXMuJHJlcG9MaXN0RGl2LmZpbmQoJy51cGRhdGVSZXBvLXJlcG9MaXN0SXRlbScpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcclxuICAgICAgICAkcmVwb0Rpdi5hZGRDbGFzcygnYWN0aXZlJyk7XHJcbiAgICAgICAgdGhpcy4kcmVwb05hbWUudmFsKHJlcEluZm8ubmFtZSk7XHJcbiAgICAgICAgdGhpcy4kcmVwb0Rlc2NyaXB0aW9uLnZhbChyZXBJbmZvLmRlc2NyaXB0aW9uKTtcclxuICAgICAgICB0aGlzLiRyZXBvUHVibGlzaGVkVG8udmFsKHJlcEluZm8ucHVibGlzaGVkX3RvKTtcclxuXHJcbiAgICAgICAgdGhpcy4kcmVwb093bmVyLmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy4kdXNlcmxpc3REaXYuY2hpbGRyZW4oKS5ub3QoJy51cGRhdGVSZXBvLXVzZXJsaXN0aGVhZGluZycpLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICBsZXQgcmVxOiBHZXRSZXBvc2l0b3J5VXNlckxpc3RSZXF1ZXN0ID0geyByZXBvc2l0b3J5X2lkOiByZXBJbmZvLmlkIH07XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBhamF4KCdnZXRSZXBvc2l0b3J5VXNlckxpc3QnLCByZXEsIChyZXNwb25zZTogR2V0UmVwb3NpdG9yeVVzZXJMaXN0UmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLnJlcG9zaXRvcnlVc2VyTGlzdC5mb3JFYWNoKHVzZXJEYXRhID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgJHVzZXJEaXYgPSBtYWtlRGl2KFwiXCIsIFwidXBkYXRlUmVwby11c2VyRGl2XCIsIGAke3VzZXJEYXRhLmZpcnN0TmFtZX0gJHt1c2VyRGF0YS5sYXN0TmFtZX0gKCR7dXNlckRhdGEudXNlcm5hbWV9KWAsIHsgJ2dyaWQtY29sdW1uJzogMSB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgJGNhbldyaXRlRGl2ID0gbWFrZURpdihcIlwiLCBcImNhbldyaXRlRGl2XCIsIFwiXCIsIHsgJ2dyaWQtY29sdW1uJzogMiB9KTtcclxuICAgICAgICAgICAgICAgIGxldCAkY2FuV3JpdGVDaGVja0JveCA9IGpRdWVyeSgnPGlucHV0IHR5cGU9XCJjaGVja2JveFwiPicpO1xyXG4gICAgICAgICAgICAgICAgJGNhbldyaXRlRGl2LmFwcGVuZCgkY2FuV3JpdGVDaGVja0JveCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAkY2FuV3JpdGVDaGVja0JveC5hdHRyKCdjaGVja2VkJywgdXNlckRhdGEuY2FuV3JpdGUpO1xyXG4gICAgICAgICAgICAgICAgJGNhbldyaXRlQ2hlY2tCb3guZGF0YSgndXNlcicsIHVzZXJEYXRhKTtcclxuICAgICAgICAgICAgICAgICRjYW5Xcml0ZUNoZWNrQm94Lm9uKFwiY2hhbmdlXCIsICgpID0+IHsgdGhhdC5lbmFibGVTYXZlQnV0dG9uKCkgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC4kdXNlcmxpc3REaXYuYXBwZW5kKCR1c2VyRGl2LCAkY2FuV3JpdGVEaXYpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoYXQuJHJlcG9Pd25lci5lbXB0eSgpO1xyXG4gICAgICAgICAgICBzZXRTZWxlY3RJdGVtcyh0aGF0LiRyZXBvT3duZXIsIHJlc3BvbnNlLnJlcG9zaXRvcnlVc2VyTGlzdC5tYXAodXNlckRhdGEgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHNlOiBTZWxlY3RJdGVtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246IGAke3VzZXJEYXRhLmZpcnN0TmFtZX0gJHt1c2VyRGF0YS5sYXN0TmFtZX0gKCR7dXNlckRhdGEudXNlcm5hbWV9KWAsXHJcbiAgICAgICAgICAgICAgICAgICAgb2JqZWN0OiB1c2VyRGF0YSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdXNlckRhdGEudXNlcl9pZCArIFwiXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiBzZTtcclxuICAgICAgICAgICAgfSksIHJlcEluZm8ub3duZXJfaWQgKyBcIlwiKVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZW1wdHlSZXBvc2l0b3J5SW5mbygpIHtcclxuICAgICAgICB0aGlzLiRyZXBvT3duZXIuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLiRyZXBvTmFtZS52YWwoJycpO1xyXG4gICAgICAgIHRoaXMuJHJlcG9EZXNjcmlwdGlvbi52YWwoJycpO1xyXG4gICAgICAgIHRoaXMuJHVzZXJsaXN0RGl2LmZpbmQoJy51cGRhdGVSZXBvLXVzZXJEaXYnKS5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLiR1c2VybGlzdERpdi5maW5kKCcuY2FuV3JpdGVEaXYnKS5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBoaWRlKCkge1xyXG4gICAgICAgIGxldCAkc3luY2hyb0RpdiA9IGpRdWVyeSgnI3VwZGF0ZVJlcG8tZGl2Jyk7XHJcbiAgICAgICAgJHN5bmNocm9EaXYuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgICAgIGxldCAkbWFpbkRpdiA9IGpRdWVyeSgnI21haW4nKTtcclxuICAgICAgICAkbWFpbkRpdi5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG4gICAgfVxyXG5cclxuICAgIHNhdmVCdXR0b25DbGlja2VkKCkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBzZWxlY3RlZEl0ZW0gPSB0aGlzLiRyZXBvTGlzdERpdi5maW5kKCcuYWN0aXZlJykuZmlyc3QoKTtcclxuICAgICAgICBsZXQgcmVwb0RhdGE6IFJlcG9zaXRvcnlJbmZvID0gPGFueT5zZWxlY3RlZEl0ZW0uZGF0YSgncmVwb0luZm8nKTtcclxuXHJcbiAgICAgICAgbGV0IG5hbWU6IHN0cmluZyA9IDxzdHJpbmc+dGhpcy4kcmVwb05hbWUudmFsKCk7XHJcbiAgICAgICAgbGV0IG93bmVyOiBSZXBvc2l0b3J5VXNlciA9IGdldFNlbGVjdGVkT2JqZWN0KHRoaXMuJHJlcG9Pd25lcik7XHJcbiAgICAgICAgbGV0IHB1Ymxpc2hlZF90bzogbnVtYmVyID0gZ2V0U2VsZWN0ZWRPYmplY3QodGhpcy4kcmVwb1B1Ymxpc2hlZFRvKTtcclxuXHJcbiAgICAgICAgbGV0IHVwZGF0ZVJlcG9zaXRvcnlSZXF1ZXN0OiBVcGRhdGVSZXBvc2l0b3J5UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgb3duZXJfaWQ6IG93bmVyLnVzZXJfaWQsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiA8c3RyaW5nPnRoaXMuJHJlcG9EZXNjcmlwdGlvbi52YWwoKSxcclxuICAgICAgICAgICAgcHVibGlzaGVkX3RvOiBwdWJsaXNoZWRfdG8sXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfaWQ6IHJlcG9EYXRhLmlkLFxyXG4gICAgICAgICAgICBuYW1lOiBuYW1lXHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgICAgIC8vIHVwZGF0ZSB1c2VyIHdyaXRlIGFjY2VzczpcclxuXHJcbiAgICAgICAgbGV0IHdyaXRlQWNjZXNzTGlzdDogUmVwb3NpdG9yeVVzZXJXcml0ZUFjY2Vzc0RhdGFbXSA9IFtdO1xyXG5cclxuICAgICAgICB0aGF0LiR1c2VybGlzdERpdi5maW5kKCdpbnB1dCcpLmVhY2goKGluZGV4LCBlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCAkZWxlbWVudCA9IGpRdWVyeShlbGVtZW50KTtcclxuICAgICAgICAgICAgbGV0IHVzZXI6IFJlcG9zaXRvcnlVc2VyID0gPGFueT4kZWxlbWVudC5kYXRhKCd1c2VyJyk7XHJcbiAgICAgICAgICAgIHdyaXRlQWNjZXNzTGlzdC5wdXNoKHtcclxuICAgICAgICAgICAgICAgIGhhc193cml0ZV9hY2Nlc3M6IDxhbnk+alF1ZXJ5KGVsZW1lbnQpLmlzKCc6Y2hlY2tlZCcpLFxyXG4gICAgICAgICAgICAgICAgdXNlcl9pZDogdXNlci51c2VyX2lkXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogVXBkYXRlUmVwb3NpdG9yeVVzZXJXcml0ZUFjY2Vzc1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnlfaWQ6IHJlcG9EYXRhLmlkLFxyXG4gICAgICAgICAgICB3cml0ZUFjY2Vzc0xpc3Q6IHdyaXRlQWNjZXNzTGlzdFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHJlcG9EYXRhLm93bmVyX2lkID09IG93bmVyLnVzZXJfaWQgfHwgXHJcbiAgICAgICAgICAgICAgY29uZmlybShcIlNvbGwgZGllIEVpZ2VudMO8bWVyc2NoYWZ0IMO8YmVyIGRhcyBSZXBvc2l0b3J5IFwiICsgcmVwb0RhdGEubmFtZSArIFwiIHdpcmtsaWNoIGFuIFwiICsgb3duZXIuZmlyc3ROYW1lICsgXCIgXCIgKyBvd25lci5sYXN0TmFtZSArIFwiIMO8YmVydHJhZ2VuIHdlcmRlbj9cIikpIHtcclxuICAgICAgICAgICAgYWpheCgndXBkYXRlUmVwb3NpdG9yeVVzZXJXcml0ZUFjY2VzcycsIHJlcXVlc3QsIChyZXNwb25zZTogVXBkYXRlUmVwb3NpdG9yeVVzZXJXcml0ZUFjY2Vzc1Jlc3BvbnNlKSA9PiB7XHJcblxyXG5cclxuICAgICAgICAgICAgICAgIGFqYXgoXCJ1cGRhdGVSZXBvc2l0b3J5XCIsIHVwZGF0ZVJlcG9zaXRvcnlSZXF1ZXN0LCAocmVzcG9uc2U6IFVwZGF0ZVJlcG9zaXRvcnlSZXNwb25zZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICByZXBvRGF0YS5uYW1lID0gbmFtZTtcclxuICAgICAgICAgICAgICAgICAgICByZXBvRGF0YS5vd25lcl9pZCA9IG93bmVyLnVzZXJfaWQ7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVwb0RhdGEub3duZXJfbmFtZSA9IG93bmVyLmZpcnN0TmFtZSArIFwiIFwiICsgb3duZXIubGFzdE5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVwb0RhdGEub3duZXJfdXNlcm5hbWUgPSBvd25lci51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgICAgICByZXBvRGF0YS5wdWJsaXNoZWRfdG8gPSBwdWJsaXNoZWRfdG87XHJcbiAgICAgICAgICAgICAgICAgICAgcmVwb0RhdGEuZGVzY3JpcHRpb24gPSB1cGRhdGVSZXBvc2l0b3J5UmVxdWVzdC5kZXNjcmlwdGlvbjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0RpZSDDhG5kZXJ1bmdlbiB3dXJkZW4gZXJmb2xncmVpY2ggZ2VzcGVpY2hlcnQuJylcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LiRzYXZlQnV0dG9uLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnNob3dSZXBvc2l0b3J5TGlzdCgpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICAgICB9LCAoZXJyb3JNZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBhbGVydChcIkZlaGxlcjogXCIgKyBlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZXhpdEJ1dHRvbkNsaWNrZWQoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfSwgKGVycm9yTWVzc2FnZTogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChcIkZlaGxlcjogXCIgKyBlcnJvck1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5leGl0QnV0dG9uQ2xpY2tlZCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWxlcnQoXCJEZXIgU3BlaWNoZXJ2b3JnYW5nIHd1cmRlIG5pY2h0IGR1cmNoZ2Vmw7xocnQuXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgZXhpdEJ1dHRvbkNsaWNrZWQoKSB7XHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG4gICAgfVxyXG5cclxuXHJcbn0iXX0=