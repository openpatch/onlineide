import { AdminMenuItem } from "./AdminMenuItem.js";
import { ajax } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";
export class TeachersWithClassesMI extends AdminMenuItem {
    constructor() {
        super(...arguments);
        this.classesGridName = "tgClassesGrid";
        this.teachersGridName = "TgTeachersGrid";
        this.teacherDataList = [];
    }
    checkPermission(user) {
        return user.is_schooladmin;
    }
    getButtonIdentifier() {
        return "Lehrkräfte mit Klassen";
    }
    onMenuButtonPressed($mainHeading, $tableLeft, $tableRight, $mainFooter) {
        let that = this;
        if (this.teachersGrid != null) {
            this.teachersGrid.render();
        }
        else {
            $tableLeft.w2grid({
                name: this.teachersGridName,
                header: 'Lehrkräfte',
                selectType: "cell",
                multiSelect: true,
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true,
                    toolbarSearch: false
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
                        field: 'numberOfClasses', caption: 'Klassen', size: '30%', sortable: true, resizable: true,
                        render: function (record) {
                            return '<div>' + record.classes.length + '</div>';
                        }
                    },
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
                sortData: [{ field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
                onSelect: (event) => { that.onSelectTeacher(event); },
                onUnselect: (event) => { that.onSelectTeacher(event); },
                onAdd: (event) => { that.onAddTeacher(); },
                onChange: (event) => { that.onUpdateTeacher(event); },
                onDelete: (event) => { that.onDeleteTeacher(event); },
            });
            this.teachersGrid = w2ui[this.teachersGridName];
        }
        this.loadTablesFromTeacherObject();
        this.initializePasswordButtons();
        if (this.classesGrid != null) {
            this.classesGrid.render();
        }
        else {
            $tableRight.w2grid({
                name: this.classesGridName,
                header: 'Klassen',
                selectType: "cell",
                show: {
                    header: true,
                    toolbar: true,
                    toolbarAdd: true,
                    toolbarDelete: true,
                    footer: true,
                    selectColumn: true
                },
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Name', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    {
                        field: 'teacher', caption: 'Lehrkraft', size: '30%', sortable: true, resizable: true,
                        editable: { type: 'list', items: that.teacherDataList, filter: false }
                    },
                ],
                searches: [
                    { field: 'name', label: 'Name', type: 'text' },
                ],
                sortData: [{ field: 'name', direction: 'asc' }],
                onAdd: (event) => { that.onAddClass(); },
                onChange: (event) => { that.onUpdateClass(event); },
                onDelete: (event) => { that.onDeleteClass(event); },
            });
            this.classesGrid = w2ui[this.classesGridName];
        }
    }
    initializePasswordButtons() {
        setTimeout(() => {
            jQuery('.pw_button').off('click');
            let that = this;
            jQuery('.pw_button').on('click', (e) => {
                let recid = jQuery(e.target).data('recid');
                e.preventDefault();
                e.stopPropagation();
                that.changePassword([recid]);
            });
        }, 1500);
    }
    changePassword(recIds = []) {
        let that = this;
        if (recIds.length == 0) {
            //@ts-ignore
            recIds = this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        }
        if (recIds.length != 1) {
            this.teachersGrid.error("Zum Ändern eines Passworts muss genau eine Lehrkraft ausgewählt werden.");
        }
        else {
            let teacher = (this.teachersGrid.get(recIds[0] + "", false)["userData"]);
            let passwordFor = teacher.rufname + " " + teacher.familienname + " (" + teacher.username + ")";
            PasswordPopup.open(passwordFor, () => { }, (password) => {
                teacher.password = password;
                let request = {
                    type: "update",
                    data: teacher,
                };
                //@ts-ignore
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);
                ajax("CRUDUser", request, (response) => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + teacher.rufname + " " + teacher.familienname + " (" + teacher.username + ") wurde erfolgreich geändert.");
                }, () => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                });
            });
            // w2prompt({
            //     label: 'Neues Passwort',
            //     value: '',
            //     attrs: 'style="width: 200px" type="password"',
            //     title: "Passwort für " + admin.rufname + " " + admin.familienname + " (" + admin.username + ")",
            //     ok_text: "OK",
            //     cancel_text: "Abbrechen",
            //     width: 600,
            //     height: 200
            // })
            //     .change(function (event) {
            //     })
            //     .ok(function (password) {
            //         admin.password = password;
            //         let request: CRUDUserRequest = {
            //             type: "update",
            //             data: admin,
            //         }
            //         ajax("CRUDUser", request, (response: CRUDResponse) => {
            //             w2alert('Das Passwort für ' + admin.rufname + " " + admin.familienname + " (" + admin.username + ") wurde erfolgreich geändert.");
            //         }, () => {
            //             w2alert('Fehler beim Ändern des Passworts!');
            //         });
            //     });
            // jQuery('#w2prompt').attr("type", "password");
        }
    }
    onAddTeacher() {
        let schoolId = this.administration.userData.schule_id;
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
                is_schooladmin: false,
                is_teacher: true,
                password: Math.round(Math.random() * 10000000) + "x"
            },
        };
        ajax("CRUDUser", request, (response) => {
            let ud = request.data;
            ud.id = response.id;
            let teacherData = {
                userData: ud,
                classes: [],
                username: ud.username,
                familienname: ud.familienname,
                rufname: ud.rufname,
                id: ud.id,
                text: ud.rufname + " " + ud.familienname
            };
            this.teachersGrid.add(teacherData);
            this.teachersGrid.editField(ud.id + "", 1, undefined, { keyCode: 13 });
            this.teacherDataList.push(teacherData);
            this.selectTextInCell();
            this.initializePasswordButtons();
        });
    }
    // lastRecId: number = -1;
    onSelectTeacher(event) {
        // if (event.recid == this.lastRecId) {
        //     return;
        // }
        // this.lastRecId = event.recid;
        event.done(() => {
            let recIds;
            //@ts-ignore
            recIds = this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
            if (recIds.length == 1) {
                //@ts-ignore
                this.teachersGrid.toolbar.enable('passwordButton');
            }
            else {
                //@ts-ignore
                this.teachersGrid.toolbar.disable('passwordButton');
            }
            let selectedTeachers = this.teacherDataList.filter((cd) => recIds.indexOf(cd.userData.id) >= 0);
            let classesList = [];
            for (let sc of selectedTeachers) {
                for (let sd of sc.classes) {
                    sd["teacher"] = sc.userData.rufname + " " + sc.userData.familienname;
                    classesList.push(sd);
                }
            }
            setTimeout(() => {
                this.classesGrid.clear();
                this.classesGrid.add(classesList);
                this.classesGrid.refresh();
            }, 5);
        });
    }
    loadTablesFromTeacherObject() {
        let request = { school_id: this.administration.userData.schule_id };
        ajax("getTeacherData", request, (data) => {
            this.teacherDataList = data.teacherData;
            this.teachersGrid.clear();
            for (let teacher of this.teacherDataList) {
                teacher["id"] = teacher.userData.id;
                teacher["username"] = teacher.userData.username;
                teacher["familienname"] = teacher.userData.familienname;
                teacher["rufname"] = teacher.userData.rufname;
                teacher["text"] = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
            this.teachersGrid.add(this.teacherDataList);
            this.teachersGrid.refresh();
            if (this.classesGrid != null) {
                this.classesGrid.columns[2]["editable"].items = this.teacherDataList;
                this.classesGrid.clear();
            }
        }, () => {
            w2alert('Fehler beim Holen der Daten.');
        });
    }
    onDeleteTeacher(event) {
        if (!event.force || event.isStopped)
            return;
        let recIds;
        //@ts-ignore
        recIds = this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let selectedteachers = this.teachersGrid.records.filter((cd) => recIds.indexOf(cd.userData.id) >= 0 && this.administration.userData.id != cd.userData.id);
        let request = {
            type: "delete",
            data: null,
            ids: recIds,
        };
        ajax("CRUDUser", request, (response) => {
            recIds.forEach(id => this.teachersGrid.remove("" + id));
            for (let i = 0; i < this.teacherDataList.length; i++) {
                if (recIds.indexOf(this.teacherDataList[i].userData.id) >= 0) {
                    this.teacherDataList.splice(i, 1);
                    i--;
                }
            }
            this.teachersGrid.refresh();
            this.classesGrid.clear();
        }, () => {
            this.teachersGrid.refresh();
        });
    }
    onUpdateTeacher(event) {
        let data = this.teachersGrid.records[event.index];
        data.userData[this.teachersGrid.columns[event.column]["field"]] = event.value_new;
        data[this.teachersGrid.columns[event.column]["field"]] = event.value_new;
        data.userData.password = null;
        let request = {
            type: "update",
            data: data.userData,
        };
        ajax("CRUDUser", request, (response) => {
            // console.log(data);
            for (let key in data["w2ui"]["changes"]) {
                delete data["w2ui"]["changes"][key];
            }
        }, () => {
            data.userData[this.teachersGrid.columns[event.column]["field"]] = event.value_original;
            data[this.teachersGrid.columns[event.column]["field"]] = event.value_original;
        });
    }
    onAddClass() {
        let selectedTeachers = this.teachersGrid.getSelection().map((d) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selectedTeachers.length != 1) {
            this.classesGrid.error("Wenn Sie Klassen hinzufügen möchten muss links genau eine Lehrkraft ausgewählt sein.");
            return;
        }
        let teacherId = selectedTeachers[0];
        let teacherData = this.teachersGrid.get("" + teacherId, false);
        let request = {
            type: "create",
            data: {
                id: -1,
                name: "Name",
                lehrkraft_id: teacherId,
                schule_id: teacherData.userData.schule_id,
                students: []
            },
        };
        ajax("CRUDClass", request, (response) => {
            let cd = request.data;
            cd.id = response.id;
            cd["teacher"] = teacherData.userData.rufname + " " + teacherData.userData.familienname;
            this.classesGrid.add(cd);
            this.classesGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });
            teacherData.classes.push(cd);
            this.selectTextInCell();
        });
    }
    onDeleteClass(event) {
        if (!event.force || event.isStopped)
            return;
        let recIds;
        //@ts-ignore
        recIds = this.classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let selectedClasss = this.classesGrid.records.filter((cd) => recIds.indexOf(cd.id) >= 0);
        let request = {
            type: "delete",
            data: null,
            ids: recIds,
        };
        ajax("CRUDClass", request, (response) => {
            recIds.forEach(id => {
                let cd = this.classesGrid.get(id + "");
                this.classesGrid.remove("" + id);
                let ld = this.teachersGrid.get(cd.lehrkraft_id + "");
                if (ld != null) {
                    ld.classes = ld.classes.filter((cl) => cl.id != cd.id);
                }
            });
            this.classesGrid.refresh();
        }, () => {
            this.classesGrid.refresh();
        });
    }
    onUpdateClass(event) {
        let data = this.classesGrid.records[event.index];
        if (event.column == 2) {
            let teacher = event.value_new;
            if (teacher == null || typeof teacher == "string") {
                this.classesGrid.refresh();
                return;
            }
            else {
                let teacherOld1 = this.teacherDataList.find((td) => td.userData.id == data.lehrkraft_id);
                if (teacherOld1 != null)
                    teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                let teacherOld2 = this.teachersGrid.get(data.lehrkraft_id + "");
                if (teacherOld2 != null)
                    teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.lehrkraft_id = teacher.userData.id;
                teacher.classes.push(data);
                let teacherNew2 = this.teachersGrid.get(teacher.userData.id + "");
                if (teacherNew2 != null)
                    teacherNew2.classes.push(data);
                event.value_new = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }
        data[this.classesGrid.columns[event.column]["field"]] = event.value_new;
        let request = {
            type: "update",
            data: data,
        };
        ajax("CRUDClass", request, (response) => {
            // console.log(data);
            if (event.column != 2)
                delete data["w2ui"]["changes"];
            this.classesGrid.refresh();
        }, () => {
            data[this.classesGrid.columns[event.column]["field"]] = event.value_original;
            this.classesGrid.refresh();
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVhY2hlcnNXaXRoQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvYWRtaW5pc3RyYXRpb24vVGVhY2hlcnNXaXRoQ2xhc3Nlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFbkQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBRXRELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUtuRCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsYUFBYTtJQUF4RDs7UUFFSSxvQkFBZSxHQUFHLGVBQWUsQ0FBQztRQUNsQyxxQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUtwQyxvQkFBZSxHQUFrQixFQUFFLENBQUM7SUFzZnhDLENBQUM7SUFwZkcsZUFBZSxDQUFDLElBQWM7UUFDMUIsT0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO0lBQy9CLENBQUM7SUFFRCxtQkFBbUI7UUFDZixPQUFPLHdCQUF3QixDQUFDO0lBQ3BDLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxZQUFpQyxFQUFFLFVBQStCLEVBQ2xGLFdBQWdDLEVBQUUsV0FBZ0M7UUFDbEUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLEVBQUU7WUFDM0IsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztTQUM5QjthQUFNO1lBQ0gsVUFBVSxDQUFDLE1BQU0sQ0FBQztnQkFDZCxJQUFJLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtnQkFDM0IsTUFBTSxFQUFFLFlBQVk7Z0JBQ3BCLFVBQVUsRUFBRSxNQUFNO2dCQUNsQixXQUFXLEVBQUUsSUFBSTtnQkFDakIsSUFBSSxFQUFFO29CQUNGLE1BQU0sRUFBRSxJQUFJO29CQUNaLE9BQU8sRUFBRSxJQUFJO29CQUNi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QUksT0FBTyxHQUFxQjtZQUM1QixJQUFJLEVBQUUsUUFBUTtZQUNkLElBQUksRUFBRSxJQUFJO1NBQ2IsQ0FBQTtRQUVELElBQUksQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLENBQUMsUUFBc0IsRUFBRSxFQUFFO1lBQ2xELHFCQUFxQjtZQUNyQixJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksQ0FBQztnQkFBRSxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUN0RCxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLENBQUMsRUFBRSxHQUFHLEVBQUU7WUFDSixJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztZQUM3RSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRtaW5NZW51SXRlbSB9IGZyb20gXCIuL0FkbWluTWVudUl0ZW0uanNcIjtcclxuaW1wb3J0IHsgVXNlckRhdGEsIENSVURVc2VyUmVxdWVzdCwgQ1JVRFNjaG9vbFJlcXVlc3QsIENSVURSZXNwb25zZSwgU2Nob29sRGF0YSwgR2V0U2Nob29sRGF0YVJlcXVlc3QsIEdldFNjaG9vbERhdGFSZXNwb25zZSwgVGVhY2hlckRhdGEsIENsYXNzRGF0YSwgQ1JVRENsYXNzUmVxdWVzdCwgR2V0VGVhY2hlckRhdGFSZXF1ZXN0LCBHZXRUZWFjaGVyRGF0YVJlc3BvbnNlIH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBhamF4IH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vQWpheEhlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBUaWxpbmdTcHJpdGUgfSBmcm9tIFwicGl4aS5qc1wiO1xyXG5pbXBvcnQgeyBQYXNzd29yZFBvcHVwIH0gZnJvbSBcIi4vUGFzc3dvcmRQb3B1cC5qc1wiO1xyXG5cclxuZGVjbGFyZSB2YXIgdzJwcm9tcHQ6IGFueTtcclxuZGVjbGFyZSB2YXIgdzJhbGVydDogYW55O1xyXG5cclxuZXhwb3J0IGNsYXNzIFRlYWNoZXJzV2l0aENsYXNzZXNNSSBleHRlbmRzIEFkbWluTWVudUl0ZW0ge1xyXG5cclxuICAgIGNsYXNzZXNHcmlkTmFtZSA9IFwidGdDbGFzc2VzR3JpZFwiO1xyXG4gICAgdGVhY2hlcnNHcmlkTmFtZSA9IFwiVGdUZWFjaGVyc0dyaWRcIjtcclxuXHJcbiAgICBjbGFzc2VzR3JpZDogVzJVSS5XMkdyaWQ7XHJcbiAgICB0ZWFjaGVyc0dyaWQ6IFcyVUkuVzJHcmlkO1xyXG5cclxuICAgIHRlYWNoZXJEYXRhTGlzdDogVGVhY2hlckRhdGFbXSA9IFtdO1xyXG5cclxuICAgIGNoZWNrUGVybWlzc2lvbih1c2VyOiBVc2VyRGF0YSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB1c2VyLmlzX3NjaG9vbGFkbWluO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEJ1dHRvbklkZW50aWZpZXIoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gXCJMZWhya3LDpGZ0ZSBtaXQgS2xhc3NlblwiO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTWVudUJ1dHRvblByZXNzZWQoJG1haW5IZWFkaW5nOiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkdGFibGVMZWZ0OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LFxyXG4gICAgICAgICR0YWJsZVJpZ2h0OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkbWFpbkZvb3RlcjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMudGVhY2hlcnNHcmlkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQucmVuZGVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHRhYmxlTGVmdC53MmdyaWQoe1xyXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy50ZWFjaGVyc0dyaWROYW1lLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiAnTGVocmtyw6RmdGUnLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0VHlwZTogXCJjZWxsXCIsXHJcbiAgICAgICAgICAgICAgICBtdWx0aVNlbGVjdDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyQWRkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJEZWxldGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdENvbHVtbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyU2VhcmNoOiBmYWxzZVxyXG5cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYnJlYWsnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2J1dHRvbicsIGlkOiAncGFzc3dvcmRCdXR0b24nLCB0ZXh0OiAnUGFzc3dvcnQgw6RuZGVybi4uLicgfSAvLywgaW1nOiAnZmEta2V5JyB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAodGFyZ2V0LCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPT0gXCJwYXNzd29yZEJ1dHRvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNoYW5nZVBhc3N3b3JkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVjaWQ6IFwiaWRcIixcclxuICAgICAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnaWQnLCBjYXB0aW9uOiAnSUQnLCBzaXplOiAnMjBweCcsIHNvcnRhYmxlOiB0cnVlLCBoaWRkZW46IHRydWUgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAndXNlcm5hbWUnLCBjYXB0aW9uOiAnQmVudXR6ZXJuYW1lJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3J1Zm5hbWUnLCBjYXB0aW9uOiAnUnVmbmFtZScsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBlZGl0YWJsZTogeyB0eXBlOiAndGV4dCcgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdmYW1pbGllbm5hbWUnLCBjYXB0aW9uOiAnRmFtaWxpZW5uYW1lJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ251bWJlck9mQ2xhc3NlcycsIGNhcHRpb246ICdLbGFzc2VuJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcjogZnVuY3Rpb24gKHJlY29yZDogVGVhY2hlckRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdj4nICsgcmVjb3JkLmNsYXNzZXMubGVuZ3RoICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICdpZCcsIGNhcHRpb246ICdQVycsIHNpemU6ICc0MHB4Jywgc29ydGFibGU6IGZhbHNlLCByZW5kZXI6IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwd19idXR0b25cIiB0aXRsZT1cIlBhc3N3b3J0IMOkbmRlcm5cIiBkYXRhLXJlY2lkPVwiJyArIGUucmVjaWQgKyAnXCI+UFchPC9kaXY+JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBzZWFyY2hlczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICd1c2VybmFtZScsIGxhYmVsOiAnQmVudXR6ZXJuYW1lJywgdHlwZTogJ3RleHQnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3J1Zm5hbWUnLCBsYWJlbDogJ1J1Zm5hbWUnLCB0eXBlOiAndGV4dCcgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnZmFtaWxpZW5uYW1lJywgbGFiZWw6ICdGYW1pbGllbm5hbWUnLCB0eXBlOiAndGV4dCcgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNvcnREYXRhOiBbeyBmaWVsZDogJ2ZhbWlsaWVubmFtZScsIGRpcmVjdGlvbjogJ2FzYycgfSwgeyBmaWVsZDogJ3J1Zm5hbWUnLCBkaXJlY3Rpb246ICdhc2MnIH1dLFxyXG4gICAgICAgICAgICAgICAgb25TZWxlY3Q6IChldmVudCkgPT4geyB0aGF0Lm9uU2VsZWN0VGVhY2hlcihldmVudCkgfSxcclxuICAgICAgICAgICAgICAgIG9uVW5zZWxlY3Q6IChldmVudCkgPT4geyB0aGF0Lm9uU2VsZWN0VGVhY2hlcihldmVudCkgfSxcclxuICAgICAgICAgICAgICAgIG9uQWRkOiAoZXZlbnQpID0+IHsgdGhhdC5vbkFkZFRlYWNoZXIoKSB9LFxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IChldmVudCkgPT4geyB0aGF0Lm9uVXBkYXRlVGVhY2hlcihldmVudCkgfSxcclxuICAgICAgICAgICAgICAgIG9uRGVsZXRlOiAoZXZlbnQpID0+IHsgdGhhdC5vbkRlbGV0ZVRlYWNoZXIoZXZlbnQpIH0sXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZCA9IHcydWlbdGhpcy50ZWFjaGVyc0dyaWROYW1lXTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxvYWRUYWJsZXNGcm9tVGVhY2hlck9iamVjdCgpO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRpYWxpemVQYXNzd29yZEJ1dHRvbnMoKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2xhc3Nlc0dyaWQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlbmRlcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICR0YWJsZVJpZ2h0LncyZ3JpZCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLmNsYXNzZXNHcmlkTmFtZSxcclxuICAgICAgICAgICAgICAgIGhlYWRlcjogJ0tsYXNzZW4nLFxyXG4gICAgICAgICAgICAgICAgc2VsZWN0VHlwZTogXCJjZWxsXCIsXHJcbiAgICAgICAgICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhckFkZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyRGVsZXRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBzZWxlY3RDb2x1bW46IHRydWVcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICByZWNpZDogXCJpZFwiLFxyXG4gICAgICAgICAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdpZCcsIGNhcHRpb246ICdJRCcsIHNpemU6ICcyMHB4Jywgc29ydGFibGU6IHRydWUsIGhpZGRlbjogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICduYW1lJywgY2FwdGlvbjogJ05hbWUnLCBzaXplOiAnMzAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgZWRpdGFibGU6IHsgdHlwZTogJ3RleHQnIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAndGVhY2hlcicsIGNhcHRpb246ICdMZWhya3JhZnQnLCBzaXplOiAnMzAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWRpdGFibGU6IHsgdHlwZTogJ2xpc3QnLCBpdGVtczogdGhhdC50ZWFjaGVyRGF0YUxpc3QsIGZpbHRlcjogZmFsc2UgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnbmFtZScsIGxhYmVsOiAnTmFtZScsIHR5cGU6ICd0ZXh0JyB9LFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNvcnREYXRhOiBbeyBmaWVsZDogJ25hbWUnLCBkaXJlY3Rpb246ICdhc2MnIH1dLFxyXG4gICAgICAgICAgICAgICAgb25BZGQ6IChldmVudCkgPT4geyB0aGF0Lm9uQWRkQ2xhc3MoKSB9LFxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IChldmVudCkgPT4geyB0aGF0Lm9uVXBkYXRlQ2xhc3MoZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICBvbkRlbGV0ZTogKGV2ZW50KSA9PiB7IHRoYXQub25EZWxldGVDbGFzcyhldmVudCkgfSxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkID0gdzJ1aVt0aGlzLmNsYXNzZXNHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdGlhbGl6ZVBhc3N3b3JkQnV0dG9ucygpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgalF1ZXJ5KCcucHdfYnV0dG9uJykub2ZmKCdjbGljaycpO1xyXG4gICAgICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnLnB3X2J1dHRvbicpLm9uKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVjaWQgPSBqUXVlcnkoZS50YXJnZXQpLmRhdGEoJ3JlY2lkJyk7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5jaGFuZ2VQYXNzd29yZChbcmVjaWRdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMTUwMCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNoYW5nZVBhc3N3b3JkKHJlY0lkczogbnVtYmVyW10gPSBbXSkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKHJlY0lkcy5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgcmVjSWRzID0gPGFueT50aGlzLnRlYWNoZXJzR3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKHN0cikgPT4gc3RyLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAocmVjSWRzLmxlbmd0aCAhPSAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLmVycm9yKFwiWnVtIMOEbmRlcm4gZWluZXMgUGFzc3dvcnRzIG11c3MgZ2VuYXUgZWluZSBMZWhya3JhZnQgYXVzZ2V3w6RobHQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgdGVhY2hlcjogVXNlckRhdGEgPSA8VXNlckRhdGE+KHRoaXMudGVhY2hlcnNHcmlkLmdldChyZWNJZHNbMF0gKyBcIlwiLCBmYWxzZSlbXCJ1c2VyRGF0YVwiXSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgcGFzc3dvcmRGb3I6IHN0cmluZyA9IHRlYWNoZXIucnVmbmFtZSArIFwiIFwiICsgdGVhY2hlci5mYW1pbGllbm5hbWUgKyBcIiAoXCIgKyB0ZWFjaGVyLnVzZXJuYW1lICsgXCIpXCI7XHJcbiAgICAgICAgICAgIFBhc3N3b3JkUG9wdXAub3BlbihwYXNzd29yZEZvciwgKCkgPT4geyB9LCAocGFzc3dvcmQpID0+IHtcclxuICAgICAgICAgICAgICAgIHRlYWNoZXIucGFzc3dvcmQgPSBwYXNzd29yZDtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFVzZXJSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogdGVhY2hlcixcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgdzJ1dGlscy5sb2NrKGpRdWVyeSgnYm9keScpLCBcIkJpdHRlIHdhcnRlbiwgZGFzIEhhc2hlbiA8YnI+IGRlcyBQYXNzd29ydHMga2FubiA8YnI+YmlzIHp1IDEgTWludXRlPGJyPiBkYXVlcm4uLi5cIiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIHcydXRpbHMudW5sb2NrKGpRdWVyeSgnYm9keScpKTtcclxuICAgICAgICAgICAgICAgICAgICB3MmFsZXJ0KCdEYXMgUGFzc3dvcnQgZsO8ciAnICsgdGVhY2hlci5ydWZuYW1lICsgXCIgXCIgKyB0ZWFjaGVyLmZhbWlsaWVubmFtZSArIFwiIChcIiArIHRlYWNoZXIudXNlcm5hbWUgKyBcIikgd3VyZGUgZXJmb2xncmVpY2ggZ2XDpG5kZXJ0LlwiKTtcclxuICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB3MnV0aWxzLnVubG9jayhqUXVlcnkoJ2JvZHknKSk7XHJcbiAgICAgICAgICAgICAgICB3MmFsZXJ0KCdGZWhsZXIgYmVpbSDDhG5kZXJuIGRlcyBQYXNzd29ydHMhJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gdzJwcm9tcHQoe1xyXG4gICAgICAgICAgICAvLyAgICAgbGFiZWw6ICdOZXVlcyBQYXNzd29ydCcsXHJcbiAgICAgICAgICAgIC8vICAgICB2YWx1ZTogJycsXHJcbiAgICAgICAgICAgIC8vICAgICBhdHRyczogJ3N0eWxlPVwid2lkdGg6IDIwMHB4XCIgdHlwZT1cInBhc3N3b3JkXCInLFxyXG4gICAgICAgICAgICAvLyAgICAgdGl0bGU6IFwiUGFzc3dvcnQgZsO8ciBcIiArIGFkbWluLnJ1Zm5hbWUgKyBcIiBcIiArIGFkbWluLmZhbWlsaWVubmFtZSArIFwiIChcIiArIGFkbWluLnVzZXJuYW1lICsgXCIpXCIsXHJcbiAgICAgICAgICAgIC8vICAgICBva190ZXh0OiBcIk9LXCIsXHJcbiAgICAgICAgICAgIC8vICAgICBjYW5jZWxfdGV4dDogXCJBYmJyZWNoZW5cIixcclxuICAgICAgICAgICAgLy8gICAgIHdpZHRoOiA2MDAsXHJcbiAgICAgICAgICAgIC8vICAgICBoZWlnaHQ6IDIwMFxyXG4gICAgICAgICAgICAvLyB9KVxyXG4gICAgICAgICAgICAvLyAgICAgLmNoYW5nZShmdW5jdGlvbiAoZXZlbnQpIHtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICB9KVxyXG4gICAgICAgICAgICAvLyAgICAgLm9rKGZ1bmN0aW9uIChwYXNzd29yZCkge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgIGFkbWluLnBhc3N3b3JkID0gcGFzc3dvcmQ7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgICAgIGxldCByZXF1ZXN0OiBDUlVEVXNlclJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGRhdGE6IGFkbWluLFxyXG4gICAgICAgICAgICAvLyAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB3MmFsZXJ0KCdEYXMgUGFzc3dvcnQgZsO8ciAnICsgYWRtaW4ucnVmbmFtZSArIFwiIFwiICsgYWRtaW4uZmFtaWxpZW5uYW1lICsgXCIgKFwiICsgYWRtaW4udXNlcm5hbWUgKyBcIikgd3VyZGUgZXJmb2xncmVpY2ggZ2XDpG5kZXJ0LlwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB3MmFsZXJ0KCdGZWhsZXIgYmVpbSDDhG5kZXJuIGRlcyBQYXNzd29ydHMhJyk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8galF1ZXJ5KCcjdzJwcm9tcHQnKS5hdHRyKFwidHlwZVwiLCBcInBhc3N3b3JkXCIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25BZGRUZWFjaGVyKCkge1xyXG4gICAgICAgIGxldCBzY2hvb2xJZCA9IHRoaXMuYWRtaW5pc3RyYXRpb24udXNlckRhdGEuc2NodWxlX2lkO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFVzZXJSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBpZDogLTEsXHJcbiAgICAgICAgICAgICAgICBzY2h1bGVfaWQ6IHNjaG9vbElkLFxyXG4gICAgICAgICAgICAgICAga2xhc3NlX2lkOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IFwiQmVudXR6ZXJuYW1lXCIgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCksXHJcbiAgICAgICAgICAgICAgICBydWZuYW1lOiBcIlJ1Zm5hbWVcIixcclxuICAgICAgICAgICAgICAgIGZhbWlsaWVubmFtZTogXCJGYW1pbGllbm5hbWVcIixcclxuICAgICAgICAgICAgICAgIGlzX2FkbWluOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzX3NjaG9vbGFkbWluOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzX3RlYWNoZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApICsgXCJ4XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IHVkOiBVc2VyRGF0YSA9IHJlcXVlc3QuZGF0YTtcclxuICAgICAgICAgICAgdWQuaWQgPSByZXNwb25zZS5pZDtcclxuXHJcbiAgICAgICAgICAgIGxldCB0ZWFjaGVyRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB1ZCxcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVkLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgZmFtaWxpZW5uYW1lOiB1ZC5mYW1pbGllbm5hbWUsXHJcbiAgICAgICAgICAgICAgICBydWZuYW1lOiB1ZC5ydWZuYW1lLFxyXG4gICAgICAgICAgICAgICAgaWQ6IHVkLmlkLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogdWQucnVmbmFtZSArIFwiIFwiICsgdWQuZmFtaWxpZW5uYW1lXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5hZGQodGVhY2hlckRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5lZGl0RmllbGQodWQuaWQgKyBcIlwiLCAxLCB1bmRlZmluZWQsIHsga2V5Q29kZTogMTMgfSk7XHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlckRhdGFMaXN0LnB1c2godGVhY2hlckRhdGEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RUZXh0SW5DZWxsKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVQYXNzd29yZEJ1dHRvbnMoKTtcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gbGFzdFJlY0lkOiBudW1iZXIgPSAtMTtcclxuXHJcbiAgICBvblNlbGVjdFRlYWNoZXIoZXZlbnQ6IGFueSkge1xyXG5cclxuICAgICAgICAvLyBpZiAoZXZlbnQucmVjaWQgPT0gdGhpcy5sYXN0UmVjSWQpIHtcclxuICAgICAgICAvLyAgICAgcmV0dXJuO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgLy8gdGhpcy5sYXN0UmVjSWQgPSBldmVudC5yZWNpZDtcclxuXHJcbiAgICAgICAgZXZlbnQuZG9uZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCByZWNJZHM6IG51bWJlcltdO1xyXG5cclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHJlY0lkcyA9IDxhbnk+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHJlY0lkcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC50b29sYmFyLmVuYWJsZSgncGFzc3dvcmRCdXR0b24nKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQudG9vbGJhci5kaXNhYmxlKCdwYXNzd29yZEJ1dHRvbicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgc2VsZWN0ZWRUZWFjaGVyczogVGVhY2hlckRhdGFbXSA9IDxUZWFjaGVyRGF0YVtdPnRoaXMudGVhY2hlckRhdGFMaXN0LmZpbHRlcihcclxuICAgICAgICAgICAgICAgIChjZDogVGVhY2hlckRhdGEpID0+IHJlY0lkcy5pbmRleE9mKGNkLnVzZXJEYXRhLmlkKSA+PSAwKTtcclxuXHJcblxyXG4gICAgICAgICAgICBsZXQgY2xhc3Nlc0xpc3Q6IENsYXNzRGF0YVtdID0gW107XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBzYyBvZiBzZWxlY3RlZFRlYWNoZXJzKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzZCBvZiBzYy5jbGFzc2VzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2RbXCJ0ZWFjaGVyXCJdID0gc2MudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgc2MudXNlckRhdGEuZmFtaWxpZW5uYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzZXNMaXN0LnB1c2goc2QpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmNsZWFyKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmFkZChjbGFzc2VzTGlzdCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgfSwgNSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxvYWRUYWJsZXNGcm9tVGVhY2hlck9iamVjdCgpIHtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IEdldFRlYWNoZXJEYXRhUmVxdWVzdCA9IHsgc2Nob29sX2lkOiB0aGlzLmFkbWluaXN0cmF0aW9uLnVzZXJEYXRhLnNjaHVsZV9pZCB9O1xyXG5cclxuICAgICAgICBhamF4KFwiZ2V0VGVhY2hlckRhdGFcIiwgcmVxdWVzdCwgKGRhdGE6IEdldFRlYWNoZXJEYXRhUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyRGF0YUxpc3QgPSBkYXRhLnRlYWNoZXJEYXRhO1xyXG5cclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHRlYWNoZXIgb2YgdGhpcy50ZWFjaGVyRGF0YUxpc3QpIHtcclxuICAgICAgICAgICAgICAgIHRlYWNoZXJbXCJpZFwiXSA9IHRlYWNoZXIudXNlckRhdGEuaWQ7XHJcbiAgICAgICAgICAgICAgICB0ZWFjaGVyW1widXNlcm5hbWVcIl0gPSB0ZWFjaGVyLnVzZXJEYXRhLnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlcltcImZhbWlsaWVubmFtZVwiXSA9IHRlYWNoZXIudXNlckRhdGEuZmFtaWxpZW5uYW1lO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlcltcInJ1Zm5hbWVcIl0gPSB0ZWFjaGVyLnVzZXJEYXRhLnJ1Zm5hbWU7XHJcbiAgICAgICAgICAgICAgICB0ZWFjaGVyW1widGV4dFwiXSA9IHRlYWNoZXIudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgdGVhY2hlci51c2VyRGF0YS5mYW1pbGllbm5hbWVcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQuYWRkKHRoaXMudGVhY2hlckRhdGFMaXN0KTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLnJlZnJlc2goKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNsYXNzZXNHcmlkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQuY29sdW1uc1syXVtcImVkaXRhYmxlXCJdLml0ZW1zID0gdGhpcy50ZWFjaGVyRGF0YUxpc3Q7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmNsZWFyKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdzJhbGVydCgnRmVobGVyIGJlaW0gSG9sZW4gZGVyIERhdGVuLicpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25EZWxldGVUZWFjaGVyKGV2ZW50OiBhbnkpIHtcclxuICAgICAgICBpZiAoIWV2ZW50LmZvcmNlIHx8IGV2ZW50LmlzU3RvcHBlZCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgcmVjSWRzOiBudW1iZXJbXTtcclxuXHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHJlY0lkcyA9IDxhbnk+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICBsZXQgc2VsZWN0ZWR0ZWFjaGVyczogVGVhY2hlckRhdGFbXSA9IDxUZWFjaGVyRGF0YVtdPnRoaXMudGVhY2hlcnNHcmlkLnJlY29yZHMuZmlsdGVyKFxyXG4gICAgICAgICAgICAoY2Q6IFRlYWNoZXJEYXRhKSA9PiByZWNJZHMuaW5kZXhPZihjZC51c2VyRGF0YS5pZCkgPj0gMCAmJiB0aGlzLmFkbWluaXN0cmF0aW9uLnVzZXJEYXRhLmlkICE9IGNkLnVzZXJEYXRhLmlkKTtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURVc2VyUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJkZWxldGVcIixcclxuICAgICAgICAgICAgZGF0YTogbnVsbCxcclxuICAgICAgICAgICAgaWRzOiByZWNJZHMsXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgcmVjSWRzLmZvckVhY2goaWQgPT4gdGhpcy50ZWFjaGVyc0dyaWQucmVtb3ZlKFwiXCIgKyBpZCkpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGVhY2hlckRhdGFMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVjSWRzLmluZGV4T2YodGhpcy50ZWFjaGVyRGF0YUxpc3RbaV0udXNlckRhdGEuaWQpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRlYWNoZXJEYXRhTGlzdC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5jbGVhcigpO1xyXG4gICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvblVwZGF0ZVRlYWNoZXIoZXZlbnQ6IGFueSkge1xyXG5cclxuICAgICAgICBsZXQgZGF0YTogVGVhY2hlckRhdGEgPSA8VGVhY2hlckRhdGE+dGhpcy50ZWFjaGVyc0dyaWQucmVjb3Jkc1tldmVudC5pbmRleF07XHJcblxyXG4gICAgICAgIGRhdGEudXNlckRhdGFbdGhpcy50ZWFjaGVyc0dyaWQuY29sdW1uc1tldmVudC5jb2x1bW5dW1wiZmllbGRcIl1dID0gZXZlbnQudmFsdWVfbmV3O1xyXG4gICAgICAgIGRhdGFbdGhpcy50ZWFjaGVyc0dyaWQuY29sdW1uc1tldmVudC5jb2x1bW5dW1wiZmllbGRcIl1dID0gZXZlbnQudmFsdWVfbmV3O1xyXG5cclxuICAgICAgICBkYXRhLnVzZXJEYXRhLnBhc3N3b3JkID0gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURVc2VyUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJ1cGRhdGVcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YS51c2VyRGF0YSxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEVXNlclwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRhdGFbXCJ3MnVpXCJdW1wiY2hhbmdlc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGRhdGFbXCJ3MnVpXCJdW1wiY2hhbmdlc1wiXVtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICBkYXRhLnVzZXJEYXRhW3RoaXMudGVhY2hlcnNHcmlkLmNvbHVtbnNbZXZlbnQuY29sdW1uXVtcImZpZWxkXCJdXSA9IGV2ZW50LnZhbHVlX29yaWdpbmFsO1xyXG4gICAgICAgICAgICBkYXRhW3RoaXMudGVhY2hlcnNHcmlkLmNvbHVtbnNbZXZlbnQuY29sdW1uXVtcImZpZWxkXCJdXSA9IGV2ZW50LnZhbHVlX29yaWdpbmFsO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbkFkZENsYXNzKCkge1xyXG5cclxuICAgICAgICBsZXQgc2VsZWN0ZWRUZWFjaGVycyA9IDxudW1iZXJbXT50aGlzLnRlYWNoZXJzR3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKGQ6IHsgcmVjaWQ6IG51bWJlciB9KSA9PiBkLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcbiAgICAgICAgaWYgKHNlbGVjdGVkVGVhY2hlcnMubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5lcnJvcihcIldlbm4gU2llIEtsYXNzZW4gaGluenVmw7xnZW4gbcO2Y2h0ZW4gbXVzcyBsaW5rcyBnZW5hdSBlaW5lIExlaHJrcmFmdCBhdXNnZXfDpGhsdCBzZWluLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBsZXQgdGVhY2hlcklkID0gc2VsZWN0ZWRUZWFjaGVyc1swXTtcclxuICAgICAgICBsZXQgdGVhY2hlckRhdGEgPSA8VGVhY2hlckRhdGE+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0KFwiXCIgKyB0ZWFjaGVySWQsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURDbGFzc1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGlkOiAtMSxcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwiTmFtZVwiLFxyXG4gICAgICAgICAgICAgICAgbGVocmtyYWZ0X2lkOiB0ZWFjaGVySWQsXHJcbiAgICAgICAgICAgICAgICBzY2h1bGVfaWQ6IHRlYWNoZXJEYXRhLnVzZXJEYXRhLnNjaHVsZV9pZCxcclxuICAgICAgICAgICAgICAgIHN0dWRlbnRzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEQ2xhc3NcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGNkOiBDbGFzc0RhdGEgPSByZXF1ZXN0LmRhdGE7XHJcbiAgICAgICAgICAgIGNkLmlkID0gcmVzcG9uc2UuaWQ7XHJcbiAgICAgICAgICAgIGNkW1widGVhY2hlclwiXSA9IHRlYWNoZXJEYXRhLnVzZXJEYXRhLnJ1Zm5hbWUgKyBcIiBcIiArIHRlYWNoZXJEYXRhLnVzZXJEYXRhLmZhbWlsaWVubmFtZTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmVkaXRGaWVsZChjZC5pZCArIFwiXCIsIDEsIHVuZGVmaW5lZCwgeyBrZXlDb2RlOiAxMyB9KTtcclxuICAgICAgICAgICAgdGVhY2hlckRhdGEuY2xhc3Nlcy5wdXNoKGNkKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0VGV4dEluQ2VsbCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uRGVsZXRlQ2xhc3MoZXZlbnQ6IGFueSkge1xyXG4gICAgICAgIGlmICghZXZlbnQuZm9yY2UgfHwgZXZlbnQuaXNTdG9wcGVkKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCByZWNJZHM6IG51bWJlcltdO1xyXG5cclxuXHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgcmVjSWRzID0gPGFueT50aGlzLmNsYXNzZXNHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoc3RyKSA9PiBzdHIucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuXHJcbiAgICAgICAgbGV0IHNlbGVjdGVkQ2xhc3NzOiBDbGFzc0RhdGFbXSA9IDxDbGFzc0RhdGFbXT50aGlzLmNsYXNzZXNHcmlkLnJlY29yZHMuZmlsdGVyKFxyXG4gICAgICAgICAgICAoY2Q6IENsYXNzRGF0YSkgPT4gcmVjSWRzLmluZGV4T2YoY2QuaWQpID49IDApO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURDbGFzc1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiZGVsZXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXHJcbiAgICAgICAgICAgIGlkczogcmVjSWRzLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURDbGFzc1wiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICByZWNJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2Q6IENsYXNzRGF0YSA9IDxDbGFzc0RhdGE+dGhpcy5jbGFzc2VzR3JpZC5nZXQoaWQgKyBcIlwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQucmVtb3ZlKFwiXCIgKyBpZClcclxuICAgICAgICAgICAgICAgIGxldCBsZDogVGVhY2hlckRhdGEgPSA8VGVhY2hlckRhdGE+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0KGNkLmxlaHJrcmFmdF9pZCArIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZC5jbGFzc2VzID0gbGQuY2xhc3Nlcy5maWx0ZXIoKGNsKSA9PiBjbC5pZCAhPSBjZC5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvblVwZGF0ZUNsYXNzKGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IGRhdGE6IENsYXNzRGF0YSA9IDxDbGFzc0RhdGE+dGhpcy5jbGFzc2VzR3JpZC5yZWNvcmRzW2V2ZW50LmluZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LmNvbHVtbiA9PSAyKSB7XHJcbiAgICAgICAgICAgIGxldCB0ZWFjaGVyOiBUZWFjaGVyRGF0YSA9IGV2ZW50LnZhbHVlX25ldztcclxuICAgICAgICAgICAgaWYgKHRlYWNoZXIgPT0gbnVsbCB8fCB0eXBlb2YgdGVhY2hlciA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCB0ZWFjaGVyT2xkMSA9IHRoaXMudGVhY2hlckRhdGFMaXN0LmZpbmQoKHRkKSA9PiB0ZC51c2VyRGF0YS5pZCA9PSBkYXRhLmxlaHJrcmFmdF9pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVhY2hlck9sZDEgIT0gbnVsbCkgdGVhY2hlck9sZDEuY2xhc3NlcyA9IHRlYWNoZXJPbGQxLmNsYXNzZXMuZmlsdGVyKGNkID0+IGNkLmlkICE9IGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRlYWNoZXJPbGQyID0gdGhpcy50ZWFjaGVyc0dyaWQuZ2V0KGRhdGEubGVocmtyYWZ0X2lkICsgXCJcIik7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVhY2hlck9sZDIgIT0gbnVsbCkgdGVhY2hlck9sZDEuY2xhc3NlcyA9IHRlYWNoZXJPbGQxLmNsYXNzZXMuZmlsdGVyKGNkID0+IGNkLmlkICE9IGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5sZWhya3JhZnRfaWQgPSB0ZWFjaGVyLnVzZXJEYXRhLmlkO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlci5jbGFzc2VzLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGVhY2hlck5ldzI6IFRlYWNoZXJEYXRhID0gPGFueT50aGlzLnRlYWNoZXJzR3JpZC5nZXQodGVhY2hlci51c2VyRGF0YS5pZCArIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRlYWNoZXJOZXcyICE9IG51bGwpIHRlYWNoZXJOZXcyLmNsYXNzZXMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnZhbHVlX25ldyA9IHRlYWNoZXIudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgdGVhY2hlci51c2VyRGF0YS5mYW1pbGllbm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGRhdGFbdGhpcy5jbGFzc2VzR3JpZC5jb2x1bW5zW2V2ZW50LmNvbHVtbl1bXCJmaWVsZFwiXV0gPSBldmVudC52YWx1ZV9uZXc7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDUlVEQ2xhc3NSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcInVwZGF0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURDbGFzc1wiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmNvbHVtbiAhPSAyKSBkZWxldGUgZGF0YVtcIncydWlcIl1bXCJjaGFuZ2VzXCJdO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRhdGFbdGhpcy5jbGFzc2VzR3JpZC5jb2x1bW5zW2V2ZW50LmNvbHVtbl1bXCJmaWVsZFwiXV0gPSBldmVudC52YWx1ZV9vcmlnaW5hbDtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==