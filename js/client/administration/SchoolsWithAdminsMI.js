import { AdminMenuItem } from "./AdminMenuItem.js";
import { ajax } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";
export class SchoolsWithAdminsMI extends AdminMenuItem {
    constructor() {
        super(...arguments);
        this.schoolGridName = "schoolsGrid";
        this.adminGridName = "adminsGrid";
        this.schoolDataList = [];
    }
    checkPermission(user) {
        return user.is_admin;
    }
    getButtonIdentifier() {
        return "Schulen mit Administratoren";
    }
    onMenuButtonPressed($mainHeading, $tableLeft, $tableRight, $mainFooter) {
        let that = this;
        if (this.schoolGrid != null) {
            this.schoolGrid.render();
        }
        else {
            $tableLeft.w2grid({
                name: this.schoolGridName,
                header: 'Schulen',
                selectType: "cell",
                multiSelect: false,
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true,
                    toolbarSearch: false
                },
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'kuerzel', caption: 'Kürzel', size: '10%', sortable: true, resizable: true, editable: { type: 'text', maxlength: "10" } },
                    { field: 'numberOfClasses', caption: 'Klassen', size: '30%', sortable: true, resizable: true },
                    { field: 'numberOfUsers', caption: 'User', size: '30%', sortable: true, resizable: true },
                ],
                searches: [
                    { field: 'name', label: 'Bezeichnung', type: 'text' }
                ],
                sortData: [{ field: 'name', direction: 'asc' }, { field: 'kuerzel', direction: 'asc' },
                    { field: 'numberOfClasses', direction: 'asc' }, { field: 'numberOfUsers', direction: 'asc' }],
                onSelect: (event) => { that.onSelectSchool(event); },
                onUnselect: (event) => { that.onSelectSchool(event); },
                onAdd: (event) => { that.onAddSchool(); },
                onChange: (event) => { that.onUpdateSchool(event); },
                onDelete: (event) => { that.onDeleteSchool(event); },
            });
            this.schoolGrid = w2ui[this.schoolGridName];
        }
        this.loadTablesFromSchoolObject();
        if (this.adminGrid != null) {
            this.adminGrid.render();
        }
        else {
            $tableRight.w2grid({
                name: this.adminGridName,
                header: 'Schuladmins',
                selectType: "cell",
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true,
                    toolbarSearch: false,
                    toolbarInput: false
                },
                toolbar: {
                    items: [
                        { type: 'break' },
                        { type: 'button', id: 'passwordButton', text: 'Passwort ändern...' } //, img: 'fa-key' }
                    ],
                    onClick: function (target, data) {
                        if (target == "passwordButton") {
                            that.changePassword();
                        }
                    }
                },
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'username', caption: 'Benutzername', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'rufname', caption: 'Rufname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    { field: 'familienname', caption: 'Familienname', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    {
                        field: 'id', caption: 'PW', size: '40px', sortable: false, render: (e) => {
                            return '<div class="pw_button" title="Passwort ändern" data-recid="' + e.recid + '">PW!</div>';
                        }
                    }
                ],
                searches: [
                    { field: 'username', label: 'Benutzername', type: 'text' },
                    { field: 'rufname', label: 'Rufname', type: 'text' },
                    { field: 'familienname', label: 'Familienname', type: 'text' }
                ],
                sortData: [{ field: 'klasse', direction: 'asc' }, { field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
                onAdd: (event) => { that.onAddAdmin(); },
                onChange: (event) => { that.onUpdateAdmin(event); },
                onDelete: (event) => { that.onDeleteAdmin(event); },
                onSelect: (event) => { event.done(() => { that.onSelectAdmin(event); }); },
                onUnselect: (event) => { event.done(() => { that.onSelectAdmin(event); }); },
            });
            this.adminGrid = w2ui[this.adminGridName];
        }
    }
    onSelectAdmin(event) {
        let adminGrid = w2ui[this.adminGridName];
        let selection = adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selection.length == 1) {
            //@ts-ignore
            adminGrid.toolbar.enable('passwordButton');
        }
        else {
            //@ts-ignore
            adminGrid.toolbar.disable('passwordButton');
        }
    }
    changePassword(recIds = []) {
        let that = this;
        if (recIds.length == 0) {
            //@ts-ignore
            recIds = this.adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        }
        if (recIds.length != 1) {
            this.adminGrid.error("Zum Ändern eines Passworts muss genau ein Admin ausgewählt werden.");
        }
        else {
            let admin = this.adminGrid.get(recIds[0] + "", false);
            let passwordFor = admin.rufname + " " + admin.familienname + " (" + admin.username + ")";
            PasswordPopup.open(passwordFor, () => {
            }, (password) => {
                admin.password = password;
                let request = {
                    type: "update",
                    data: admin,
                };
                //@ts-ignore
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);
                ajax("CRUDUser", request, (response) => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + admin.rufname + " " + admin.familienname + " (" + admin.username + ") wurde erfolgreich geändert.");
                }, () => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                });
            });
        }
    }
    onDeleteSchool(event) {
        if (!event.force || event.isStopped)
            return;
        let recIds;
        //@ts-ignore
        recIds = this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let selectedSchools = this.schoolGrid.records.filter((cd) => recIds.indexOf(cd.id) >= 0);
        let request = {
            type: "delete",
            data: null,
            id: recIds[0],
        };
        ajax("CRUDSchool", request, (response) => {
            recIds.forEach(id => this.schoolGrid.remove("" + id));
            this.schoolGrid.refresh();
        }, () => {
            this.schoolGrid.refresh();
        });
    }
    onUpdateSchool(event) {
        let data = this.schoolGrid.records[event.index];
        data[this.schoolGrid.columns[event.column]["field"]] = event.value_new;
        let request = {
            type: "update",
            data: data,
        };
        ajax("CRUDSchool", request, (response) => {
            // console.log(data);
            delete data["w2ui"]["changes"];
            this.schoolGrid.refresh();
        }, () => {
            data[this.schoolGrid.columns[event.column]["field"]] = event.value_original;
            this.schoolGrid.refresh();
        });
    }
    onAddSchool() {
        let request = {
            type: "create",
            data: {
                id: -1,
                name: "Name der Schule",
                kuerzel: "kuerzel",
                classes: [],
                usersWithoutClass: []
            },
        };
        ajax("CRUDSchool", request, (response) => {
            let cd = request.data;
            cd.id = response.id;
            this.schoolGrid.add(cd);
            this.schoolGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });
            this.selectTextInCell();
        });
    }
    onSelectSchool(event) {
        let that = this;
        event.done(() => {
            let recIds;
            //@ts-ignore
            recIds = this.schoolGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
            let selectedSchools = this.schoolGrid.records.filter((cd) => recIds.indexOf(cd.id) >= 0);
            this.adminGrid.clear();
            let adminList = [];
            for (let sc of selectedSchools) {
                this.adminGrid.header = "Admins der Schule " + sc.name;
                for (let sd of sc.usersWithoutClass) {
                    if (sd.is_schooladmin)
                        adminList.push(sd);
                }
            }
            setTimeout(() => {
                this.adminGrid.add(adminList);
                this.adminGrid.refresh();
                this.onSelectAdmin(null);
                this.initializePasswordButtons();
            }, 20);
        });
    }
    initializePasswordButtons() {
        let that = this;
        setTimeout(() => {
            jQuery('.pw_button').off('click');
            jQuery('.pw_button').on('click', (e) => {
                let recid = jQuery(e.target).data('recid');
                e.preventDefault();
                e.stopPropagation();
                that.changePassword([recid]);
            });
        }, 1500);
    }
    loadTablesFromSchoolObject() {
        let userData = this.administration.userData;
        let school_id = userData.schule_id;
        if (userData.is_admin)
            school_id = null;
        let request = { school_id: school_id };
        ajax("getSchoolData", request, (data) => {
            this.schoolDataList = data.schoolData;
            this.schoolGrid.clear();
            if (this.adminGrid != null)
                this.adminGrid.clear();
            for (let school of this.schoolDataList) {
                school["numberOfClasses"] = school.classes.length;
                let n = 0;
                school.classes.forEach(c => n += c.students.length);
                n += school.usersWithoutClass.length;
                school["numberOfUsers"] = n;
            }
            this.schoolGrid.add(this.schoolDataList);
            this.schoolGrid.refresh();
        }, (error) => {
            w2alert('Fehler beim Holen der Daten: ' + error);
            debugger;
        });
    }
    onDeleteAdmin(event) {
        if (!event.force || event.isStopped)
            return;
        let recIds;
        //@ts-ignore
        recIds = this.adminGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let selectedadmins = this.adminGrid.records.filter((cd) => recIds.indexOf(cd.id) >= 0 && this.administration.userData.id != cd.id);
        let request = {
            type: "delete",
            data: null,
            ids: recIds,
        };
        ajax("CRUDUser", request, (response) => {
            recIds.forEach(id => this.adminGrid.remove("" + id));
            for (let school of this.schoolDataList) {
                for (let i = 0; i < school.usersWithoutClass.length; i++) {
                    if (recIds.indexOf(school.usersWithoutClass[i].id) >= 0) {
                        school.usersWithoutClass.splice(i, 1);
                        i--;
                        school["numberOfUsers"] -= 1;
                    }
                }
            }
            this.adminGrid.refresh();
            this.schoolGrid.refresh();
        }, () => {
            this.adminGrid.refresh();
        });
    }
    onUpdateAdmin(event) {
        let data = this.adminGrid.records[event.index];
        data[this.adminGrid.columns[event.column]["field"]] = event.value_new;
        let request = {
            type: "update",
            data: data,
        };
        ajax("CRUDUser", request, (response) => {
            // console.log(data);
            for (let key in data["w2ui"]["changes"]) {
                delete data["w2ui"]["changes"][key];
            }
            // //@ts-ignore
            // this.adminGrid.last.inEditMode = false;
        }, () => {
            data[this.adminGrid.columns[event.column]["field"]] = event.value_original;
            // this.adminGrid.refresh();
        });
    }
    onAddAdmin() {
        let selectedSchools = this.schoolGrid.getSelection().map((d) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selectedSchools.length != 1) {
            this.adminGrid.error("Wenn Sie Admins hinzufügen möchten muss links genau eine Schule ausgewählt sein.");
            return;
        }
        let schoolId = selectedSchools[0];
        let school = this.schoolGrid.get("" + schoolId, false);
        let request = {
            type: "create",
            data: {
                id: -1,
                schule_id: schoolId,
                klasse_id: null,
                username: "Benutzername" + Math.round(Math.random() * 10000000),
                rufname: "Rufname",
                familienname: "Familienname",
                is_admin: false,
                is_schooladmin: true,
                is_teacher: true,
                password: Math.round(Math.random() * 10000000) + "x"
            },
        };
        ajax("CRUDUser", request, (response) => {
            let ud = request.data;
            ud.id = response.id;
            this.adminGrid.add(ud);
            this.adminGrid.editField(ud.id + "", 1, undefined, { keyCode: 13 });
            school.usersWithoutClass.push(ud);
            this.selectTextInCell();
            this.initializePasswordButtons();
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2Nob29sc1dpdGhBZG1pbnNNSS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvYWRtaW5pc3RyYXRpb24vU2Nob29sc1dpdGhBZG1pbnNNSS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFbkQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRXRELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUtuRCxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsYUFBYTtJQUF0RDs7UUFFSSxtQkFBYyxHQUFHLGFBQWEsQ0FBQztRQUMvQixrQkFBYSxHQUFHLFlBQVksQ0FBQztRQUs3QixtQkFBYyxHQUFpQixFQUFFLENBQUM7SUFxYnRDLENBQUM7SUFuYkcsZUFBZSxDQUFDLElBQWM7UUFDMUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0lBQ3pCLENBQUM7SUFFRCxtQkFBbUI7UUFDZixPQUFPLDZCQUE2QixDQUFDO0lBQ3pDLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxZQUFpQyxFQUFFLFVBQStCLEVBQ2xGLFdBQWdDLEVBQUUsV0FBZ0M7UUFDbEUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJLEVBQUU7WUFDekIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUM1QjthQUFNO1lBQ0gsVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFDZCxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWM7Z0JBQ3pCLE1BQU0sRUFBRSxTQUFTO2dCQUNqQixVQUFVLEVBQUUsTUFBTTtnQkFDbEIsV0FBVyxFQUFFLEtBQUs7Z0JBQ2xCLElBQUksRUFBRTtvQkFDRixNQUFNLEVBQUUsSUFBSTtvQkFDWixPQUFPLEVBQUUsSUFBSTtvQkFDYixVQUFV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QUFJLENBQUMsTUFBTSxFQUFFLEdBQUcsUUFBUSxDQUFDLEdBQUcsR0FBRzthQUN2RDtTQUNKLENBQUM7UUFFRixJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU8sRUFBRSxDQUFDLFFBQXNCLEVBQUUsRUFBRTtZQUNqRCxJQUFJLEVBQUUsR0FBYSxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ2hDLEVBQUUsQ0FBQyxFQUFFLEdBQUcsUUFBUSxDQUFDLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2QixJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7WUFDcEUsTUFBTSxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUVsQyxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMseUJBQXlCLEVBQUUsQ0FBQztRQUNyQyxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkbWluTWVudUl0ZW0gfSBmcm9tIFwiLi9BZG1pbk1lbnVJdGVtLmpzXCI7XHJcbmltcG9ydCB7IFVzZXJEYXRhLCBDUlVEVXNlclJlcXVlc3QsIENSVURTY2hvb2xSZXF1ZXN0LCBDUlVEUmVzcG9uc2UsIFNjaG9vbERhdGEsIEdldFNjaG9vbERhdGFSZXF1ZXN0LCBHZXRTY2hvb2xEYXRhUmVzcG9uc2UgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IGFqYXggfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IFRpbGluZ1Nwcml0ZSB9IGZyb20gXCJwaXhpLmpzXCI7XHJcbmltcG9ydCB7IFBhc3N3b3JkUG9wdXAgfSBmcm9tIFwiLi9QYXNzd29yZFBvcHVwLmpzXCI7XHJcblxyXG5kZWNsYXJlIHZhciB3MnByb21wdDogYW55O1xyXG5kZWNsYXJlIHZhciB3MmFsZXJ0OiBhbnk7XHJcblxyXG5leHBvcnQgY2xhc3MgU2Nob29sc1dpdGhBZG1pbnNNSSBleHRlbmRzIEFkbWluTWVudUl0ZW0ge1xyXG5cclxuICAgIHNjaG9vbEdyaWROYW1lID0gXCJzY2hvb2xzR3JpZFwiO1xyXG4gICAgYWRtaW5HcmlkTmFtZSA9IFwiYWRtaW5zR3JpZFwiO1xyXG5cclxuICAgIHNjaG9vbEdyaWQ6IFcyVUkuVzJHcmlkO1xyXG4gICAgYWRtaW5HcmlkOiBXMlVJLlcyR3JpZDtcclxuXHJcbiAgICBzY2hvb2xEYXRhTGlzdDogU2Nob29sRGF0YVtdID0gW107XHJcblxyXG4gICAgY2hlY2tQZXJtaXNzaW9uKHVzZXI6IFVzZXJEYXRhKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXIuaXNfYWRtaW47XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QnV0dG9uSWRlbnRpZmllcigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBcIlNjaHVsZW4gbWl0IEFkbWluaXN0cmF0b3JlblwiO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTWVudUJ1dHRvblByZXNzZWQoJG1haW5IZWFkaW5nOiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkdGFibGVMZWZ0OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LFxyXG4gICAgICAgICR0YWJsZVJpZ2h0OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkbWFpbkZvb3RlcjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc2Nob29sR3JpZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nob29sR3JpZC5yZW5kZXIoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdGFibGVMZWZ0LncyZ3JpZCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLnNjaG9vbEdyaWROYW1lLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiAnU2NodWxlbicsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RUeXBlOiBcImNlbGxcIixcclxuICAgICAgICAgICAgICAgIG11bHRpU2VsZWN0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyQWRkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJEZWxldGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdENvbHVtbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyU2VhcmNoOiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHJlY2lkOiBcImlkXCIsXHJcbiAgICAgICAgICAgICAgICBjb2x1bW5zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ2lkJywgY2FwdGlvbjogJ0lEJywgc2l6ZTogJzIwcHgnLCBzb3J0YWJsZTogdHJ1ZSwgaGlkZGVuOiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ25hbWUnLCBjYXB0aW9uOiAnQmV6ZWljaG51bmcnLCBzaXplOiAnMzAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgZWRpdGFibGU6IHsgdHlwZTogJ3RleHQnIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAna3VlcnplbCcsIGNhcHRpb246ICdLw7xyemVsJywgc2l6ZTogJzEwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JywgbWF4bGVuZ3RoOiBcIjEwXCIgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdudW1iZXJPZkNsYXNzZXMnLCBjYXB0aW9uOiAnS2xhc3NlbicsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ251bWJlck9mVXNlcnMnLCBjYXB0aW9uOiAnVXNlcicsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnbmFtZScsIGxhYmVsOiAnQmV6ZWljaG51bmcnLCB0eXBlOiAndGV4dCcgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNvcnREYXRhOiBbeyBmaWVsZDogJ25hbWUnLCBkaXJlY3Rpb246ICdhc2MnIH0sIHtmaWVsZDogJ2t1ZXJ6ZWwnLCBkaXJlY3Rpb246ICdhc2MnfSwgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHtmaWVsZDogJ251bWJlck9mQ2xhc3NlcycsIGRpcmVjdGlvbjogJ2FzYyd9LCB7ZmllbGQ6ICdudW1iZXJPZlVzZXJzJywgZGlyZWN0aW9uOiAnYXNjJ31dLFxyXG4gICAgICAgICAgICAgICAgb25TZWxlY3Q6IChldmVudCkgPT4geyB0aGF0Lm9uU2VsZWN0U2Nob29sKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICAgICAgb25VbnNlbGVjdDogKGV2ZW50KSA9PiB7IHRoYXQub25TZWxlY3RTY2hvb2woZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICBvbkFkZDogKGV2ZW50KSA9PiB7IHRoYXQub25BZGRTY2hvb2woKSB9LFxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IChldmVudCkgPT4geyB0aGF0Lm9uVXBkYXRlU2Nob29sKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICAgICAgb25EZWxldGU6IChldmVudCkgPT4geyB0aGF0Lm9uRGVsZXRlU2Nob29sKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zY2hvb2xHcmlkID0gdzJ1aVt0aGlzLnNjaG9vbEdyaWROYW1lXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5sb2FkVGFibGVzRnJvbVNjaG9vbE9iamVjdCgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5hZG1pbkdyaWQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmFkbWluR3JpZC5yZW5kZXIoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdGFibGVSaWdodC53MmdyaWQoe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5hZG1pbkdyaWROYW1lLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiAnU2NodWxhZG1pbnMnLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0VHlwZTogXCJjZWxsXCIsXHJcbiAgICAgICAgICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhckFkZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyRGVsZXRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RDb2x1bW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhclNlYXJjaDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhcklucHV0OiBmYWxzZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IHR5cGU6ICdicmVhaycgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYnV0dG9uJywgaWQ6ICdwYXNzd29yZEJ1dHRvbicsIHRleHQ6ICdQYXNzd29ydCDDpG5kZXJuLi4uJyB9IC8vLCBpbWc6ICdmYS1rZXknIH1cclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICh0YXJnZXQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCA9PSBcInBhc3N3b3JkQnV0dG9uXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY2hhbmdlUGFzc3dvcmQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZWNpZDogXCJpZFwiLFxyXG4gICAgICAgICAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdpZCcsIGNhcHRpb246ICdJRCcsIHNpemU6ICcyMHB4Jywgc29ydGFibGU6IHRydWUsIGhpZGRlbjogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICd1c2VybmFtZScsIGNhcHRpb246ICdCZW51dHplcm5hbWUnLCBzaXplOiAnMzAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgZWRpdGFibGU6IHsgdHlwZTogJ3RleHQnIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAncnVmbmFtZScsIGNhcHRpb246ICdSdWZuYW1lJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ2ZhbWlsaWVubmFtZScsIGNhcHRpb246ICdGYW1pbGllbm5hbWUnLCBzaXplOiAnMzAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgZWRpdGFibGU6IHsgdHlwZTogJ3RleHQnIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnaWQnLCBjYXB0aW9uOiAnUFcnLCBzaXplOiAnNDBweCcsIHNvcnRhYmxlOiBmYWxzZSwgcmVuZGVyOiAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8ZGl2IGNsYXNzPVwicHdfYnV0dG9uXCIgdGl0bGU9XCJQYXNzd29ydCDDpG5kZXJuXCIgZGF0YS1yZWNpZD1cIicgKyBlLnJlY2lkICsgJ1wiPlBXITwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAndXNlcm5hbWUnLCBsYWJlbDogJ0JlbnV0emVybmFtZScsIHR5cGU6ICd0ZXh0JyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdydWZuYW1lJywgbGFiZWw6ICdSdWZuYW1lJywgdHlwZTogJ3RleHQnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ2ZhbWlsaWVubmFtZScsIGxhYmVsOiAnRmFtaWxpZW5uYW1lJywgdHlwZTogJ3RleHQnIH1cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBzb3J0RGF0YTogW3sgZmllbGQ6ICdrbGFzc2UnLCBkaXJlY3Rpb246ICdhc2MnIH0sIHsgZmllbGQ6ICdmYW1pbGllbm5hbWUnLCBkaXJlY3Rpb246ICdhc2MnIH0sIHsgZmllbGQ6ICdydWZuYW1lJywgZGlyZWN0aW9uOiAnYXNjJyB9XSxcclxuICAgICAgICAgICAgICAgIG9uQWRkOiAoZXZlbnQpID0+IHsgdGhhdC5vbkFkZEFkbWluKCkgfSxcclxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlOiAoZXZlbnQpID0+IHsgdGhhdC5vblVwZGF0ZUFkbWluKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICAgICAgb25EZWxldGU6IChldmVudCkgPT4geyB0aGF0Lm9uRGVsZXRlQWRtaW4oZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICBvblNlbGVjdDogKGV2ZW50KSA9PiB7IGV2ZW50LmRvbmUoKCkgPT4geyB0aGF0Lm9uU2VsZWN0QWRtaW4oZXZlbnQpIH0pIH0sXHJcbiAgICAgICAgICAgICAgICBvblVuc2VsZWN0OiAoZXZlbnQpID0+IHsgZXZlbnQuZG9uZSgoKSA9PiB7IHRoYXQub25TZWxlY3RBZG1pbihldmVudCkgfSkgfSxcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hZG1pbkdyaWQgPSB3MnVpW3RoaXMuYWRtaW5HcmlkTmFtZV07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3RBZG1pbihldmVudDogYW55KSB7XHJcblxyXG4gICAgICAgIGxldCBhZG1pbkdyaWQgPSB3MnVpW3RoaXMuYWRtaW5HcmlkTmFtZV07XHJcblxyXG4gICAgICAgIGxldCBzZWxlY3Rpb24gPSBhZG1pbkdyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICBpZiAoc2VsZWN0aW9uLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICBhZG1pbkdyaWQudG9vbGJhci5lbmFibGUoJ3Bhc3N3b3JkQnV0dG9uJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGFkbWluR3JpZC50b29sYmFyLmRpc2FibGUoJ3Bhc3N3b3JkQnV0dG9uJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGNoYW5nZVBhc3N3b3JkKHJlY0lkczogbnVtYmVyW10gPSBbXSkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHJlY0lkcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgcmVjSWRzID0gPGFueT50aGlzLmFkbWluR3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKHN0cikgPT4gc3RyLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVjSWRzLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRtaW5HcmlkLmVycm9yKFwiWnVtIMOEbmRlcm4gZWluZXMgUGFzc3dvcnRzIG11c3MgZ2VuYXUgZWluIEFkbWluIGF1c2dld8OkaGx0IHdlcmRlbi5cIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGFkbWluOiBVc2VyRGF0YSA9IDxVc2VyRGF0YT50aGlzLmFkbWluR3JpZC5nZXQocmVjSWRzWzBdICsgXCJcIiwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHBhc3N3b3JkRm9yOiBzdHJpbmcgPSBhZG1pbi5ydWZuYW1lICsgXCIgXCIgKyBhZG1pbi5mYW1pbGllbm5hbWUgKyBcIiAoXCIgKyBhZG1pbi51c2VybmFtZSArIFwiKVwiO1xyXG5cclxuICAgICAgICAgICAgUGFzc3dvcmRQb3B1cC5vcGVuKHBhc3N3b3JkRm9yLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB9LCAocGFzc3dvcmQpID0+IHtcclxuICAgICAgICAgICAgICAgIGFkbWluLnBhc3N3b3JkID0gcGFzc3dvcmQ7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURVc2VyUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBcInVwZGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGFkbWluLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB3MnV0aWxzLmxvY2soalF1ZXJ5KCdib2R5JyksIFwiQml0dGUgd2FydGVuLCBkYXMgSGFzaGVuIDxicj4gZGVzIFBhc3N3b3J0cyBrYW5uIDxicj5iaXMgenUgMSBNaW51dGU8YnI+IGRhdWVybi4uLlwiLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgdzJ1dGlscy51bmxvY2soalF1ZXJ5KCdib2R5JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHcyYWxlcnQoJ0RhcyBQYXNzd29ydCBmw7xyICcgKyBhZG1pbi5ydWZuYW1lICsgXCIgXCIgKyBhZG1pbi5mYW1pbGllbm5hbWUgKyBcIiAoXCIgKyBhZG1pbi51c2VybmFtZSArIFwiKSB3dXJkZSBlcmZvbGdyZWljaCBnZcOkbmRlcnQuXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICB3MnV0aWxzLnVubG9jayhqUXVlcnkoJ2JvZHknKSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdzJhbGVydCgnRmVobGVyIGJlaW0gw4RuZGVybiBkZXMgUGFzc3dvcnRzIScpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uRGVsZXRlU2Nob29sKGV2ZW50OiBhbnkpIHtcclxuICAgICAgICBpZiAoIWV2ZW50LmZvcmNlIHx8IGV2ZW50LmlzU3RvcHBlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgcmVjSWRzOiBudW1iZXJbXTtcclxuXHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHJlY0lkcyA9IDxhbnk+dGhpcy5zY2hvb2xHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoc3RyKSA9PiBzdHIucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuXHJcbiAgICAgICAgbGV0IHNlbGVjdGVkU2Nob29sczogU2Nob29sRGF0YVtdID0gPFNjaG9vbERhdGFbXT50aGlzLnNjaG9vbEdyaWQucmVjb3Jkcy5maWx0ZXIoXHJcbiAgICAgICAgICAgIChjZDogU2Nob29sRGF0YSkgPT4gcmVjSWRzLmluZGV4T2YoY2QuaWQpID49IDApO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURTY2hvb2xSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRlbGV0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxyXG4gICAgICAgICAgICBpZDogcmVjSWRzWzBdLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURTY2hvb2xcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgcmVjSWRzLmZvckVhY2goaWQgPT4gdGhpcy5zY2hvb2xHcmlkLnJlbW92ZShcIlwiICsgaWQpKTtcclxuICAgICAgICAgICAgdGhpcy5zY2hvb2xHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nob29sR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uVXBkYXRlU2Nob29sKGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IGRhdGE6IFNjaG9vbERhdGEgPSA8U2Nob29sRGF0YT50aGlzLnNjaG9vbEdyaWQucmVjb3Jkc1tldmVudC5pbmRleF07XHJcblxyXG4gICAgICAgIGRhdGFbdGhpcy5zY2hvb2xHcmlkLmNvbHVtbnNbZXZlbnQuY29sdW1uXVtcImZpZWxkXCJdXSA9IGV2ZW50LnZhbHVlX25ldztcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURTY2hvb2xSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcInVwZGF0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURTY2hvb2xcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW1widzJ1aVwiXVtcImNoYW5nZXNcIl07XHJcbiAgICAgICAgICAgIHRoaXMuc2Nob29sR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICBkYXRhW3RoaXMuc2Nob29sR3JpZC5jb2x1bW5zW2V2ZW50LmNvbHVtbl1bXCJmaWVsZFwiXV0gPSBldmVudC52YWx1ZV9vcmlnaW5hbDtcclxuICAgICAgICAgICAgdGhpcy5zY2hvb2xHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbkFkZFNjaG9vbCgpIHtcclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFNjaG9vbFJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGlkOiAtMSxcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiTmFtZSBkZXIgU2NodWxlXCIsXHJcbiAgICAgICAgICAgICAgICBrdWVyemVsOiBcImt1ZXJ6ZWxcIixcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcnNXaXRob3V0Q2xhc3M6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYWpheChcIkNSVURTY2hvb2xcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGNkOiBTY2hvb2xEYXRhID0gcmVxdWVzdC5kYXRhO1xyXG4gICAgICAgICAgICBjZC5pZCA9IHJlc3BvbnNlLmlkO1xyXG4gICAgICAgICAgICB0aGlzLnNjaG9vbEdyaWQuYWRkKGNkKTtcclxuICAgICAgICAgICAgdGhpcy5zY2hvb2xHcmlkLmVkaXRGaWVsZChjZC5pZCArIFwiXCIsIDEsIHVuZGVmaW5lZCwgeyBrZXlDb2RlOiAxMyB9KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0VGV4dEluQ2VsbCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uU2VsZWN0U2Nob29sKGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBldmVudC5kb25lKCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IHJlY0lkczogbnVtYmVyW107XHJcblxyXG5cclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHJlY0lkcyA9IDxhbnk+dGhpcy5zY2hvb2xHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoc3RyKSA9PiBzdHIucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzZWxlY3RlZFNjaG9vbHM6IFNjaG9vbERhdGFbXSA9IDxTY2hvb2xEYXRhW10+dGhpcy5zY2hvb2xHcmlkLnJlY29yZHMuZmlsdGVyKFxyXG4gICAgICAgICAgICAgICAgKGNkOiBTY2hvb2xEYXRhKSA9PiByZWNJZHMuaW5kZXhPZihjZC5pZCkgPj0gMCk7XHJcblxyXG5cclxuICAgICAgICAgICAgdGhpcy5hZG1pbkdyaWQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBhZG1pbkxpc3Q6IFVzZXJEYXRhW10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHNjIG9mIHNlbGVjdGVkU2Nob29scykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZG1pbkdyaWQuaGVhZGVyID0gXCJBZG1pbnMgZGVyIFNjaHVsZSBcIiArIHNjLm5hbWU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzZCBvZiBzYy51c2Vyc1dpdGhvdXRDbGFzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZC5pc19zY2hvb2xhZG1pbikgYWRtaW5MaXN0LnB1c2goc2QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkbWluR3JpZC5hZGQoYWRtaW5MaXN0KTtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRtaW5HcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgIHRoaXMub25TZWxlY3RBZG1pbihudWxsKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVBhc3N3b3JkQnV0dG9ucygpO1xyXG4gICAgICAgICAgICB9LCAyMCk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdGlhbGl6ZVBhc3N3b3JkQnV0dG9ucygpe1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgalF1ZXJ5KCcucHdfYnV0dG9uJykub2ZmKCdjbGljaycpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJy5wd19idXR0b24nKS5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlY2lkID0galF1ZXJ5KGUudGFyZ2V0KS5kYXRhKCdyZWNpZCcpO1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuY2hhbmdlUGFzc3dvcmQoW3JlY2lkXSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0sIDE1MDApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsb2FkVGFibGVzRnJvbVNjaG9vbE9iamVjdCgpIHtcclxuXHJcbiAgICAgICAgbGV0IHVzZXJEYXRhID0gdGhpcy5hZG1pbmlzdHJhdGlvbi51c2VyRGF0YTtcclxuICAgICAgICBsZXQgc2Nob29sX2lkID0gdXNlckRhdGEuc2NodWxlX2lkO1xyXG4gICAgICAgIGlmICh1c2VyRGF0YS5pc19hZG1pbikgc2Nob29sX2lkID0gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IEdldFNjaG9vbERhdGFSZXF1ZXN0ID0geyBzY2hvb2xfaWQ6IHNjaG9vbF9pZCB9O1xyXG5cclxuICAgICAgICBhamF4KFwiZ2V0U2Nob29sRGF0YVwiLCByZXF1ZXN0LCAoZGF0YTogR2V0U2Nob29sRGF0YVJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nob29sRGF0YUxpc3QgPSBkYXRhLnNjaG9vbERhdGE7XHJcbiAgICAgICAgICAgIHRoaXMuc2Nob29sR3JpZC5jbGVhcigpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5hZG1pbkdyaWQgIT0gbnVsbCkgdGhpcy5hZG1pbkdyaWQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHNjaG9vbCBvZiB0aGlzLnNjaG9vbERhdGFMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICBzY2hvb2xbXCJudW1iZXJPZkNsYXNzZXNcIl0gPSBzY2hvb2wuY2xhc3Nlcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBsZXQgbiA9IDA7XHJcbiAgICAgICAgICAgICAgICBzY2hvb2wuY2xhc3Nlcy5mb3JFYWNoKGMgPT4gbiArPSBjLnN0dWRlbnRzLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBuICs9IHNjaG9vbC51c2Vyc1dpdGhvdXRDbGFzcy5sZW5ndGg7XHJcbiAgICAgICAgICAgICAgICBzY2hvb2xbXCJudW1iZXJPZlVzZXJzXCJdID0gbjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5zY2hvb2xHcmlkLmFkZCh0aGlzLnNjaG9vbERhdGFMaXN0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2Nob29sR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSwgKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIHcyYWxlcnQoJ0ZlaGxlciBiZWltIEhvbGVuIGRlciBEYXRlbjogJyArIGVycm9yKTtcclxuICAgICAgICAgICAgZGVidWdnZXI7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbkRlbGV0ZUFkbWluKGV2ZW50OiBhbnkpIHtcclxuICAgICAgICBpZiAoIWV2ZW50LmZvcmNlIHx8IGV2ZW50LmlzU3RvcHBlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgcmVjSWRzOiBudW1iZXJbXTtcclxuXHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHJlY0lkcyA9IDxhbnk+dGhpcy5hZG1pbkdyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICBsZXQgc2VsZWN0ZWRhZG1pbnM6IFVzZXJEYXRhW10gPSA8VXNlckRhdGFbXT50aGlzLmFkbWluR3JpZC5yZWNvcmRzLmZpbHRlcihcclxuICAgICAgICAgICAgKGNkOiBVc2VyRGF0YSkgPT4gcmVjSWRzLmluZGV4T2YoY2QuaWQpID49IDAgJiYgdGhpcy5hZG1pbmlzdHJhdGlvbi51c2VyRGF0YS5pZCAhPSBjZC5pZCk7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDUlVEVXNlclJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiZGVsZXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXHJcbiAgICAgICAgICAgIGlkczogcmVjSWRzLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHJlY0lkcy5mb3JFYWNoKGlkID0+IHRoaXMuYWRtaW5HcmlkLnJlbW92ZShcIlwiICsgaWQpKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgc2Nob29sIG9mIHRoaXMuc2Nob29sRGF0YUxpc3QpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2Nob29sLnVzZXJzV2l0aG91dENsYXNzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlY0lkcy5pbmRleE9mKHNjaG9vbC51c2Vyc1dpdGhvdXRDbGFzc1tpXS5pZCkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2hvb2wudXNlcnNXaXRob3V0Q2xhc3Muc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNjaG9vbFtcIm51bWJlck9mVXNlcnNcIl0gLT0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5hZG1pbkdyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICB0aGlzLnNjaG9vbEdyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hZG1pbkdyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvblVwZGF0ZUFkbWluKGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IGRhdGE6IFVzZXJEYXRhID0gPFVzZXJEYXRhPnRoaXMuYWRtaW5HcmlkLnJlY29yZHNbZXZlbnQuaW5kZXhdO1xyXG5cclxuICAgICAgICBkYXRhW3RoaXMuYWRtaW5HcmlkLmNvbHVtbnNbZXZlbnQuY29sdW1uXVtcImZpZWxkXCJdXSA9IGV2ZW50LnZhbHVlX25ldztcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURVc2VyUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJ1cGRhdGVcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEVXNlclwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRhdGFbXCJ3MnVpXCJdW1wiY2hhbmdlc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGRhdGFbXCJ3MnVpXCJdW1wiY2hhbmdlc1wiXVtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAvLyB0aGlzLmFkbWluR3JpZC5sYXN0LmluRWRpdE1vZGUgPSBmYWxzZTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRhdGFbdGhpcy5hZG1pbkdyaWQuY29sdW1uc1tldmVudC5jb2x1bW5dW1wiZmllbGRcIl1dID0gZXZlbnQudmFsdWVfb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuYWRtaW5HcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25BZGRBZG1pbigpIHtcclxuXHJcbiAgICAgICAgbGV0IHNlbGVjdGVkU2Nob29scyA9IDxudW1iZXJbXT50aGlzLnNjaG9vbEdyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChkOiB7IHJlY2lkOiBudW1iZXIgfSkgPT4gZC5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG4gICAgICAgIGlmIChzZWxlY3RlZFNjaG9vbHMubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5hZG1pbkdyaWQuZXJyb3IoXCJXZW5uIFNpZSBBZG1pbnMgaGluenVmw7xnZW4gbcO2Y2h0ZW4gbXVzcyBsaW5rcyBnZW5hdSBlaW5lIFNjaHVsZSBhdXNnZXfDpGhsdCBzZWluLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgc2Nob29sSWQgPSBzZWxlY3RlZFNjaG9vbHNbMF07XHJcbiAgICAgICAgbGV0IHNjaG9vbCA9IDxTY2hvb2xEYXRhPnRoaXMuc2Nob29sR3JpZC5nZXQoXCJcIiArIHNjaG9vbElkLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDUlVEVXNlclJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGlkOiAtMSxcclxuICAgICAgICAgICAgICAgIHNjaHVsZV9pZDogc2Nob29sSWQsXHJcbiAgICAgICAgICAgICAgICBrbGFzc2VfaWQ6IG51bGwsXHJcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogXCJCZW51dHplcm5hbWVcIiArIE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKSxcclxuICAgICAgICAgICAgICAgIHJ1Zm5hbWU6IFwiUnVmbmFtZVwiLFxyXG4gICAgICAgICAgICAgICAgZmFtaWxpZW5uYW1lOiBcIkZhbWlsaWVubmFtZVwiLFxyXG4gICAgICAgICAgICAgICAgaXNfYWRtaW46IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaXNfc2Nob29sYWRtaW46IHRydWUsXHJcbiAgICAgICAgICAgICAgICBpc190ZWFjaGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKSArIFwieFwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCB1ZDogVXNlckRhdGEgPSByZXF1ZXN0LmRhdGE7XHJcbiAgICAgICAgICAgIHVkLmlkID0gcmVzcG9uc2UuaWQ7XHJcbiAgICAgICAgICAgIHRoaXMuYWRtaW5HcmlkLmFkZCh1ZCk7XHJcbiAgICAgICAgICAgIHRoaXMuYWRtaW5HcmlkLmVkaXRGaWVsZCh1ZC5pZCArIFwiXCIsIDEsIHVuZGVmaW5lZCwgeyBrZXlDb2RlOiAxMyB9KTtcclxuICAgICAgICAgICAgc2Nob29sLnVzZXJzV2l0aG91dENsYXNzLnB1c2godWQpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RUZXh0SW5DZWxsKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdGlhbGl6ZVBhc3N3b3JkQnV0dG9ucygpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcbn0iXX0=