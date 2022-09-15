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
                // selectType: "cell",
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
                            return '<div class="pw_button" title="Passwort ändern" style="visibility: hidden" data-recid="' + e.recid + '">PW!</div>';
                        }
                    }
                ],
                searches: [
                    { field: 'username', label: 'Benutzername', type: 'text' },
                    { field: 'rufname', label: 'Rufname', type: 'text' },
                    { field: 'familienname', label: 'Familienname', type: 'text' }
                ],
                sortData: [{ field: 'familienname', direction: 'asc' }, { field: 'rufname', direction: 'asc' }],
                onSelect: (event) => { event.done(() => { that.onSelectTeacher(event); }); },
                onUnselect: (event) => { that.onUnSelectTeacher(event); },
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
                // selectType: "cell",
                multiSelect: true,
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
                    {
                        field: 'teacher2', caption: 'Zweitlehrkraft', size: '30%', sortable: true, resizable: true,
                        render: function (record) {
                            let teacher = that.teacherDataList.find(td => td.userData.id == record.zweitlehrkraft_id);
                            if (teacher != null) {
                                return '<div>' + teacher.userData.rufname + " " + teacher.userData.familienname + '</div>';
                            }
                        },
                        editable: { type: 'list', items: that.teacherDataList.slice(0).concat([{
                                    //@ts-ignore
                                    userData: { id: -1, rufname: "Keine Zweitlehrkraft", familienname: "" },
                                    classes: [],
                                    id: -1,
                                    text: "Keine Zweitlehrkraft"
                                }]), filter: false }
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
            }).css('visibility', 'visible');
        }, 1000);
    }
    changePassword(recIds = []) {
        if (recIds.length == 0) {
            recIds = this.teachersGrid.getSelection();
            //@ts-ignore
            //recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
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
    onUnSelectTeacher(event) {
        this.classesGrid.clear();
    }
    onSelectTeacher(event) {
        let recIds = this.teachersGrid.getSelection();
        if (recIds.length != 1)
            return;
        // //@ts-ignore
        // recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
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
                let teacher2 = this.teacherDataList.find(td => td.userData.id == sd.zweitlehrkraft_id);
                if (teacher2 != null) {
                    sd["teacher2"] = sc.userData.rufname + " " + sc.userData.familienname;
                }
                classesList.push(sd);
            }
        }
        this.classesGrid.clear();
        this.classesGrid.add(classesList);
        this.classesGrid.refresh();
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
                this.classesGrid.columns[3]["editable"].items = this.teacherDataList;
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
        recIds = this.teachersGrid.getSelection();
        //@ts-ignore
        // recIds = <any>this.teachersGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        // let selectedteachers: TeacherData[] = <TeacherData[]>this.teachersGrid.records.filter(
        //     (cd: TeacherData) => recIds.indexOf(cd.userData.id) >= 0 && this.administration.userData.id != cd.userData.id);
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
        let field = this.teachersGrid.columns[event.column]["field"];
        data.userData[field] = event.value_new;
        data[field] = event.value_new;
        data.userData.password = null;
        let request = {
            type: "update",
            data: data.userData,
        };
        ajax("CRUDUser", request, (response) => {
            // console.log(data);
            // for (let key in data["w2ui"]["changes"]) {
            delete data["w2ui"]["changes"][field];
            // }
            this.teachersGrid.refreshCell(data["recid"], field);
        }, () => {
            data.userData[field] = event.value_original;
            data[field] = event.value_original;
            delete data["w2ui"]["changes"][field];
            this.teachersGrid.refreshCell(data["recid"], field);
        });
    }
    onAddClass() {
        let selectedTeachers = this.teachersGrid.getSelection();
        // let selectedTeachers = <number[]>this.teachersGrid.getSelection().map((d: { recid: number }) => d.recid).filter((value, index, array) => array.indexOf(value) === index);
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
                zweitlehrkraft_id: null,
                schule_id: teacherData.userData.schule_id,
                aktiv: true,
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
        let recIds = this.classesGrid.getSelection();
        //@ts-ignore
        // recIds = <any>this.classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        // let selectedClasss: ClassData[] = <ClassData[]>this.classesGrid.records.filter(
        //     (cd: ClassData) => recIds.indexOf(cd.id) >= 0);
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
                // let teacherOld2 = this.teachersGrid.get(data.lehrkraft_id + "");
                // if (teacherOld2 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.lehrkraft_id = teacher.userData.id;
                teacher.classes.push(data);
                let teacherNew2 = this.teachersGrid.get(teacher.userData.id + "");
                if (teacherNew2 != null)
                    teacherNew2.classes.push(data);
                event.value_new = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }
        if (event.column == 3) {
            let teacher = event.value_new;
            if (teacher == null || typeof teacher == "string") {
                this.classesGrid.refresh();
                return;
            }
            else {
                let teacherOld1 = this.teacherDataList.find((td) => td.userData.id == data.zweitlehrkraft_id);
                if (teacherOld1 != null)
                    teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                // let teacherOld2 = this.teachersGrid.get(data.zweitlehrkraft_id + "");
                // if (teacherOld2 != null) teacherOld1.classes = teacherOld1.classes.filter(cd => cd.id != data.id);
                data.zweitlehrkraft_id = teacher.userData.id == -1 ? null : teacher.userData.id;
                teacher.classes.push(data);
                let teacherNew2 = this.teachersGrid.get(teacher.userData.id + "");
                if (teacherNew2 != null)
                    teacherNew2.classes.push(data);
                event.value_new = teacher.userData.rufname + " " + teacher.userData.familienname;
            }
        }
        let field = this.classesGrid.columns[event.column]["field"];
        data[field] = event.value_new;
        let request = {
            type: "update",
            data: data,
        };
        ajax("CRUDClass", request, (response) => {
            // console.log(data);
            delete data["w2ui"]["changes"][field];
            this.classesGrid.refreshCell(data["recid"], field);
        }, () => {
            data[field] = event.value_original;
            delete data["w2ui"]["changes"][field];
            this.classesGrid.refreshCell(data["recid"], field);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGVhY2hlcnNXaXRoQ2xhc3Nlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYWRtaW5pc3RyYXRpb24vVGVhY2hlcnNXaXRoQ2xhc3Nlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFFbkQsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBQ3RELE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUtuRCxNQUFNLE9BQU8scUJBQXNCLFNBQVEsYUFBYTtJQUF4RDs7UUFFSSxvQkFBZSxHQUFHLGVBQWUsQ0FBQztRQUNsQyxxQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQztRQUtwQyxvQkFBZSxHQUFrQixFQUFFLENBQUM7SUFpZ0J4QyxDQUFDO0lBL2ZHLGVBQWUsQ0FBQyxJQUFjO1FBQzFCLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUMvQixDQUFDO0lBRUQsbUJBQW1CO1FBQ2YsT0FBTyx3QkFBd0IsQ0FBQztJQUNwQyxDQUFDO0lBRUQsbUJBQW1CLENBQUMsWUFBaUMsRUFBRSxVQUErQixFQUNsRixXQUFnQyxFQUFFLFdBQWdDO1FBQ2xFLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUVoQixJQUFJLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxFQUFFO1lBQzNCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDOUI7YUFBTTtZQUNILFVBQVUsQ0FBQyxNQUFNLENBQUM7Z0JBQ2QsSUFBSSxFQUFFLElBQUksQ0FBQyxnQkFBZ0I7Z0JBQzNCLE1BQU0sRUFBRSxZQUFZO2dCQUNwQixzQkFBc0I7Z0JBQ3RCLFdBQVcsRUFBRSxLQUFLO2dCQUNsQixJQUFJLEVBQUU7b0JBQ0YsTUFBTSxFQUFFLElBQUk7b0JBQ1osT0FBTyxFQUFFLElBQUk7b0JBQ2IsVUFBVSxFQUFF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S0FBSyxDQUFDLGNBQWMsQ0FBQztZQUNuQyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0QyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBR0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZG1pbk1lbnVJdGVtIH0gZnJvbSBcIi4vQWRtaW5NZW51SXRlbS5qc1wiO1xyXG5pbXBvcnQgeyBVc2VyRGF0YSwgQ1JVRFVzZXJSZXF1ZXN0LCBDUlVEU2Nob29sUmVxdWVzdCwgQ1JVRFJlc3BvbnNlLCBTY2hvb2xEYXRhLCBHZXRTY2hvb2xEYXRhUmVxdWVzdCwgR2V0U2Nob29sRGF0YVJlc3BvbnNlLCBUZWFjaGVyRGF0YSwgQ2xhc3NEYXRhLCBDUlVEQ2xhc3NSZXF1ZXN0LCBHZXRUZWFjaGVyRGF0YVJlcXVlc3QsIEdldFRlYWNoZXJEYXRhUmVzcG9uc2UgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9EYXRhLmpzXCI7XHJcbmltcG9ydCB7IGFqYXggfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9BamF4SGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IFBhc3N3b3JkUG9wdXAgfSBmcm9tIFwiLi9QYXNzd29yZFBvcHVwLmpzXCI7XHJcblxyXG5kZWNsYXJlIHZhciB3MnByb21wdDogYW55O1xyXG5kZWNsYXJlIHZhciB3MmFsZXJ0OiBhbnk7XHJcblxyXG5leHBvcnQgY2xhc3MgVGVhY2hlcnNXaXRoQ2xhc3Nlc01JIGV4dGVuZHMgQWRtaW5NZW51SXRlbSB7XHJcblxyXG4gICAgY2xhc3Nlc0dyaWROYW1lID0gXCJ0Z0NsYXNzZXNHcmlkXCI7XHJcbiAgICB0ZWFjaGVyc0dyaWROYW1lID0gXCJUZ1RlYWNoZXJzR3JpZFwiO1xyXG5cclxuICAgIGNsYXNzZXNHcmlkOiBXMlVJLlcyR3JpZDtcclxuICAgIHRlYWNoZXJzR3JpZDogVzJVSS5XMkdyaWQ7XHJcblxyXG4gICAgdGVhY2hlckRhdGFMaXN0OiBUZWFjaGVyRGF0YVtdID0gW107XHJcblxyXG4gICAgY2hlY2tQZXJtaXNzaW9uKHVzZXI6IFVzZXJEYXRhKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHVzZXIuaXNfc2Nob29sYWRtaW47XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QnV0dG9uSWRlbnRpZmllcigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBcIkxlaHJrcsOkZnRlIG1pdCBLbGFzc2VuXCI7XHJcbiAgICB9XHJcblxyXG4gICAgb25NZW51QnV0dG9uUHJlc3NlZCgkbWFpbkhlYWRpbmc6IEpRdWVyeTxIVE1MRWxlbWVudD4sICR0YWJsZUxlZnQ6IEpRdWVyeTxIVE1MRWxlbWVudD4sXHJcbiAgICAgICAgJHRhYmxlUmlnaHQ6IEpRdWVyeTxIVE1MRWxlbWVudD4sICRtYWluRm9vdGVyOiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAodGhpcy50ZWFjaGVyc0dyaWQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5yZW5kZXIoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkdGFibGVMZWZ0LncyZ3JpZCh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiB0aGlzLnRlYWNoZXJzR3JpZE5hbWUsXHJcbiAgICAgICAgICAgICAgICBoZWFkZXI6ICdMZWhya3LDpGZ0ZScsXHJcbiAgICAgICAgICAgICAgICAvLyBzZWxlY3RUeXBlOiBcImNlbGxcIixcclxuICAgICAgICAgICAgICAgIG11bHRpU2VsZWN0OiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyQWRkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJEZWxldGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdENvbHVtbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyU2VhcmNoOiBmYWxzZVxyXG5cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYnJlYWsnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2J1dHRvbicsIGlkOiAncGFzc3dvcmRCdXR0b24nLCB0ZXh0OiAnUGFzc3dvcnQgw6RuZGVybi4uLicgfSAvLywgaW1nOiAnZmEta2V5JyB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAodGFyZ2V0LCBkYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPT0gXCJwYXNzd29yZEJ1dHRvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmNoYW5nZVBhc3N3b3JkKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVjaWQ6IFwiaWRcIixcclxuICAgICAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnaWQnLCBjYXB0aW9uOiAnSUQnLCBzaXplOiAnMjBweCcsIHNvcnRhYmxlOiB0cnVlLCBoaWRkZW46IHRydWUgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAndXNlcm5hbWUnLCBjYXB0aW9uOiAnQmVudXR6ZXJuYW1lJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3J1Zm5hbWUnLCBjYXB0aW9uOiAnUnVmbmFtZScsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBlZGl0YWJsZTogeyB0eXBlOiAndGV4dCcgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdmYW1pbGllbm5hbWUnLCBjYXB0aW9uOiAnRmFtaWxpZW5uYW1lJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ251bWJlck9mQ2xhc3NlcycsIGNhcHRpb246ICdLbGFzc2VuJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcjogZnVuY3Rpb24gKHJlY29yZDogVGVhY2hlckRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAnPGRpdj4nICsgcmVjb3JkLmNsYXNzZXMubGVuZ3RoICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICdpZCcsIGNhcHRpb246ICdQVycsIHNpemU6ICc0MHB4Jywgc29ydGFibGU6IGZhbHNlLCByZW5kZXI6IChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwd19idXR0b25cIiB0aXRsZT1cIlBhc3N3b3J0IMOkbmRlcm5cIiBzdHlsZT1cInZpc2liaWxpdHk6IGhpZGRlblwiIGRhdGEtcmVjaWQ9XCInICsgZS5yZWNpZCArICdcIj5QVyE8L2Rpdj4nO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNlYXJjaGVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3VzZXJuYW1lJywgbGFiZWw6ICdCZW51dHplcm5hbWUnLCB0eXBlOiAndGV4dCcgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAncnVmbmFtZScsIGxhYmVsOiAnUnVmbmFtZScsIHR5cGU6ICd0ZXh0JyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICdmYW1pbGllbm5hbWUnLCBsYWJlbDogJ0ZhbWlsaWVubmFtZScsIHR5cGU6ICd0ZXh0JyB9XHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc29ydERhdGE6IFt7IGZpZWxkOiAnZmFtaWxpZW5uYW1lJywgZGlyZWN0aW9uOiAnYXNjJyB9LCB7IGZpZWxkOiAncnVmbmFtZScsIGRpcmVjdGlvbjogJ2FzYycgfV0sXHJcbiAgICAgICAgICAgICAgICBvblNlbGVjdDogKGV2ZW50KSA9PiB7IGV2ZW50LmRvbmUoKCkgPT4geyB0aGF0Lm9uU2VsZWN0VGVhY2hlcihldmVudCkgfSkgfSxcclxuICAgICAgICAgICAgICAgIG9uVW5zZWxlY3Q6IChldmVudCkgPT4geyB0aGF0Lm9uVW5TZWxlY3RUZWFjaGVyKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICAgICAgb25BZGQ6IChldmVudCkgPT4geyB0aGF0Lm9uQWRkVGVhY2hlcigpIH0sXHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZTogKGV2ZW50KSA9PiB7IHRoYXQub25VcGRhdGVUZWFjaGVyKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICAgICAgb25EZWxldGU6IChldmVudCkgPT4geyB0aGF0Lm9uRGVsZXRlVGVhY2hlcihldmVudCkgfSxcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkID0gdzJ1aVt0aGlzLnRlYWNoZXJzR3JpZE5hbWVdO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubG9hZFRhYmxlc0Zyb21UZWFjaGVyT2JqZWN0KCk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdGlhbGl6ZVBhc3N3b3JkQnV0dG9ucygpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jbGFzc2VzR3JpZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQucmVuZGVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgJHRhYmxlUmlnaHQudzJncmlkKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuY2xhc3Nlc0dyaWROYW1lLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiAnS2xhc3NlbicsXHJcbiAgICAgICAgICAgICAgICAvLyBzZWxlY3RUeXBlOiBcImNlbGxcIixcclxuICAgICAgICAgICAgICAgIG11bHRpU2VsZWN0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJBZGQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhckRlbGV0ZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0Q29sdW1uOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVjaWQ6IFwiaWRcIixcclxuICAgICAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnaWQnLCBjYXB0aW9uOiAnSUQnLCBzaXplOiAnMjBweCcsIHNvcnRhYmxlOiB0cnVlLCBoaWRkZW46IHRydWUgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnbmFtZScsIGNhcHRpb246ICdOYW1lJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIGVkaXRhYmxlOiB7IHR5cGU6ICd0ZXh0JyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ3RlYWNoZXInLCBjYXB0aW9uOiAnTGVocmtyYWZ0Jywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRhYmxlOiB7IHR5cGU6ICdsaXN0JywgaXRlbXM6IHRoYXQudGVhY2hlckRhdGFMaXN0LCBmaWx0ZXI6IGZhbHNlIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICd0ZWFjaGVyMicsIGNhcHRpb246ICdad2VpdGxlaHJrcmFmdCcsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZW5kZXI6IGZ1bmN0aW9uIChyZWNvcmQ6IENsYXNzRGF0YSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHRlYWNoZXIgPSB0aGF0LnRlYWNoZXJEYXRhTGlzdC5maW5kKHRkID0+IHRkLnVzZXJEYXRhLmlkID09IHJlY29yZC56d2VpdGxlaHJrcmFmdF9pZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVhY2hlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICc8ZGl2PicgKyB0ZWFjaGVyLnVzZXJEYXRhLnJ1Zm5hbWUgKyBcIiBcIiArIHRlYWNoZXIudXNlckRhdGEuZmFtaWxpZW5uYW1lICsgJzwvZGl2Pic7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRhYmxlOiB7IHR5cGU6ICdsaXN0JywgaXRlbXM6IHRoYXQudGVhY2hlckRhdGFMaXN0LnNsaWNlKDApLmNvbmNhdChbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YToge2lkOiAtMSwgcnVmbmFtZTogXCJLZWluZSBad2VpdGxlaHJrcmFmdFwiLCBmYW1pbGllbm5hbWU6IFwiXCJ9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NlczogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZDogLTEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiBcIktlaW5lIFp3ZWl0bGVocmtyYWZ0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfV0pLCBmaWx0ZXI6IGZhbHNlIH0gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnbmFtZScsIGxhYmVsOiAnTmFtZScsIHR5cGU6ICd0ZXh0JyB9LFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNvcnREYXRhOiBbeyBmaWVsZDogJ25hbWUnLCBkaXJlY3Rpb246ICdhc2MnIH1dLFxyXG4gICAgICAgICAgICAgICAgb25BZGQ6IChldmVudCkgPT4geyB0aGF0Lm9uQWRkQ2xhc3MoKSB9LFxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IChldmVudCkgPT4geyB0aGF0Lm9uVXBkYXRlQ2xhc3MoZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICBvbkRlbGV0ZTogKGV2ZW50KSA9PiB7IHRoYXQub25EZWxldGVDbGFzcyhldmVudCkgfSxcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkID0gdzJ1aVt0aGlzLmNsYXNzZXNHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdGlhbGl6ZVBhc3N3b3JkQnV0dG9ucygpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgalF1ZXJ5KCcucHdfYnV0dG9uJykub2ZmKCdjbGljaycpO1xyXG4gICAgICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnLnB3X2J1dHRvbicpLm9uKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVjaWQgPSBqUXVlcnkoZS50YXJnZXQpLmRhdGEoJ3JlY2lkJyk7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5jaGFuZ2VQYXNzd29yZChbcmVjaWRdKTtcclxuICAgICAgICAgICAgfSkuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgICAgICB9LCAxMDAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlUGFzc3dvcmQocmVjSWRzOiBudW1iZXJbXSA9IFtdKSB7XHJcblxyXG4gICAgICAgIGlmIChyZWNJZHMubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgcmVjSWRzID0gPG51bWJlcltdPnRoaXMudGVhY2hlcnNHcmlkLmdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgLy9yZWNJZHMgPSA8YW55PnRoaXMudGVhY2hlcnNHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoc3RyKSA9PiBzdHIucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZWNJZHMubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQuZXJyb3IoXCJadW0gw4RuZGVybiBlaW5lcyBQYXNzd29ydHMgbXVzcyBnZW5hdSBlaW5lIExlaHJrcmFmdCBhdXNnZXfDpGhsdCB3ZXJkZW4uXCIpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCB0ZWFjaGVyOiBVc2VyRGF0YSA9IDxVc2VyRGF0YT4odGhpcy50ZWFjaGVyc0dyaWQuZ2V0KHJlY0lkc1swXSArIFwiXCIsIGZhbHNlKVtcInVzZXJEYXRhXCJdKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBwYXNzd29yZEZvcjogc3RyaW5nID0gdGVhY2hlci5ydWZuYW1lICsgXCIgXCIgKyB0ZWFjaGVyLmZhbWlsaWVubmFtZSArIFwiIChcIiArIHRlYWNoZXIudXNlcm5hbWUgKyBcIilcIjtcclxuICAgICAgICAgICAgUGFzc3dvcmRQb3B1cC5vcGVuKHBhc3N3b3JkRm9yLCAoKSA9PiB7IH0sIChwYXNzd29yZCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlci5wYXNzd29yZCA9IHBhc3N3b3JkO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByZXF1ZXN0OiBDUlVEVXNlclJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJ1cGRhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiB0ZWFjaGVyLFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB3MnV0aWxzLmxvY2soalF1ZXJ5KCdib2R5JyksIFwiQml0dGUgd2FydGVuLCBkYXMgSGFzaGVuIDxicj4gZGVzIFBhc3N3b3J0cyBrYW5uIDxicj5iaXMgenUgMSBNaW51dGU8YnI+IGRhdWVybi4uLlwiLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgdzJ1dGlscy51bmxvY2soalF1ZXJ5KCdib2R5JykpO1xyXG4gICAgICAgICAgICAgICAgICAgIHcyYWxlcnQoJ0RhcyBQYXNzd29ydCBmw7xyICcgKyB0ZWFjaGVyLnJ1Zm5hbWUgKyBcIiBcIiArIHRlYWNoZXIuZmFtaWxpZW5uYW1lICsgXCIgKFwiICsgdGVhY2hlci51c2VybmFtZSArIFwiKSB3dXJkZSBlcmZvbGdyZWljaCBnZcOkbmRlcnQuXCIpO1xyXG4gICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIHcydXRpbHMudW5sb2NrKGpRdWVyeSgnYm9keScpKTtcclxuICAgICAgICAgICAgICAgICAgICB3MmFsZXJ0KCdGZWhsZXIgYmVpbSDDhG5kZXJuIGRlcyBQYXNzd29ydHMhJyk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25BZGRUZWFjaGVyKCkge1xyXG4gICAgICAgIGxldCBzY2hvb2xJZCA9IHRoaXMuYWRtaW5pc3RyYXRpb24udXNlckRhdGEuc2NodWxlX2lkO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFVzZXJSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBpZDogLTEsXHJcbiAgICAgICAgICAgICAgICBzY2h1bGVfaWQ6IHNjaG9vbElkLFxyXG4gICAgICAgICAgICAgICAga2xhc3NlX2lkOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IFwiQmVudXR6ZXJuYW1lXCIgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCksXHJcbiAgICAgICAgICAgICAgICBydWZuYW1lOiBcIlJ1Zm5hbWVcIixcclxuICAgICAgICAgICAgICAgIGZhbWlsaWVubmFtZTogXCJGYW1pbGllbm5hbWVcIixcclxuICAgICAgICAgICAgICAgIGlzX2FkbWluOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzX3NjaG9vbGFkbWluOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzX3RlYWNoZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMTAwMDAwMDApICsgXCJ4XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IHVkOiBVc2VyRGF0YSA9IHJlcXVlc3QuZGF0YTtcclxuICAgICAgICAgICAgdWQuaWQgPSByZXNwb25zZS5pZDtcclxuXHJcbiAgICAgICAgICAgIGxldCB0ZWFjaGVyRGF0YSA9IHtcclxuICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB1ZCxcclxuICAgICAgICAgICAgICAgIGNsYXNzZXM6IFtdLFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IHVkLnVzZXJuYW1lLFxyXG4gICAgICAgICAgICAgICAgZmFtaWxpZW5uYW1lOiB1ZC5mYW1pbGllbm5hbWUsXHJcbiAgICAgICAgICAgICAgICBydWZuYW1lOiB1ZC5ydWZuYW1lLFxyXG4gICAgICAgICAgICAgICAgaWQ6IHVkLmlkLFxyXG4gICAgICAgICAgICAgICAgdGV4dDogdWQucnVmbmFtZSArIFwiIFwiICsgdWQuZmFtaWxpZW5uYW1lXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5hZGQodGVhY2hlckRhdGEpO1xyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5lZGl0RmllbGQodWQuaWQgKyBcIlwiLCAxLCB1bmRlZmluZWQsIHsga2V5Q29kZTogMTMgfSk7XHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlckRhdGFMaXN0LnB1c2godGVhY2hlckRhdGEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zZWxlY3RUZXh0SW5DZWxsKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVQYXNzd29yZEJ1dHRvbnMoKTtcclxuXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgb25VblNlbGVjdFRlYWNoZXIoZXZlbnQpIHtcclxuICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmNsZWFyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3RUZWFjaGVyKGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IHJlY0lkczogbnVtYmVyW10gPSA8bnVtYmVyW10+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgICAgIGlmKHJlY0lkcy5sZW5ndGggIT0gMSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAvLyAvL0B0cy1pZ25vcmVcclxuICAgICAgICAvLyByZWNJZHMgPSA8YW55PnRoaXMudGVhY2hlcnNHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoc3RyKSA9PiBzdHIucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuXHJcbiAgICAgICAgaWYgKHJlY0lkcy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQudG9vbGJhci5lbmFibGUoJ3Bhc3N3b3JkQnV0dG9uJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLnRvb2xiYXIuZGlzYWJsZSgncGFzc3dvcmRCdXR0b24nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzZWxlY3RlZFRlYWNoZXJzOiBUZWFjaGVyRGF0YVtdID0gPFRlYWNoZXJEYXRhW10+dGhpcy50ZWFjaGVyRGF0YUxpc3QuZmlsdGVyKFxyXG4gICAgICAgICAgICAoY2Q6IFRlYWNoZXJEYXRhKSA9PiByZWNJZHMuaW5kZXhPZihjZC51c2VyRGF0YS5pZCkgPj0gMCk7XHJcblxyXG5cclxuICAgICAgICBsZXQgY2xhc3Nlc0xpc3Q6IENsYXNzRGF0YVtdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IHNjIG9mIHNlbGVjdGVkVGVhY2hlcnMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgc2Qgb2Ygc2MuY2xhc3Nlcykge1xyXG4gICAgICAgICAgICAgICAgc2RbXCJ0ZWFjaGVyXCJdID0gc2MudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgc2MudXNlckRhdGEuZmFtaWxpZW5uYW1lO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRlYWNoZXIyID0gdGhpcy50ZWFjaGVyRGF0YUxpc3QuZmluZCh0ZCA9PiB0ZC51c2VyRGF0YS5pZCA9PSBzZC56d2VpdGxlaHJrcmFmdF9pZCk7XHJcbiAgICAgICAgICAgICAgICBpZih0ZWFjaGVyMiAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgICAgICBzZFtcInRlYWNoZXIyXCJdID0gc2MudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgc2MudXNlckRhdGEuZmFtaWxpZW5uYW1lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2xhc3Nlc0xpc3QucHVzaChzZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5hZGQoY2xhc3Nlc0xpc3QpO1xyXG4gICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQucmVmcmVzaCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBsb2FkVGFibGVzRnJvbVRlYWNoZXJPYmplY3QoKSB7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBHZXRUZWFjaGVyRGF0YVJlcXVlc3QgPSB7IHNjaG9vbF9pZDogdGhpcy5hZG1pbmlzdHJhdGlvbi51c2VyRGF0YS5zY2h1bGVfaWQgfTtcclxuXHJcbiAgICAgICAgYWpheChcImdldFRlYWNoZXJEYXRhXCIsIHJlcXVlc3QsIChkYXRhOiBHZXRUZWFjaGVyRGF0YVJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlckRhdGFMaXN0ID0gZGF0YS50ZWFjaGVyRGF0YTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCB0ZWFjaGVyIG9mIHRoaXMudGVhY2hlckRhdGFMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICB0ZWFjaGVyW1wiaWRcIl0gPSB0ZWFjaGVyLnVzZXJEYXRhLmlkO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlcltcInVzZXJuYW1lXCJdID0gdGVhY2hlci51c2VyRGF0YS51c2VybmFtZTtcclxuICAgICAgICAgICAgICAgIHRlYWNoZXJbXCJmYW1pbGllbm5hbWVcIl0gPSB0ZWFjaGVyLnVzZXJEYXRhLmZhbWlsaWVubmFtZTtcclxuICAgICAgICAgICAgICAgIHRlYWNoZXJbXCJydWZuYW1lXCJdID0gdGVhY2hlci51c2VyRGF0YS5ydWZuYW1lO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlcltcInRleHRcIl0gPSB0ZWFjaGVyLnVzZXJEYXRhLnJ1Zm5hbWUgKyBcIiBcIiArIHRlYWNoZXIudXNlckRhdGEuZmFtaWxpZW5uYW1lXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLmFkZCh0aGlzLnRlYWNoZXJEYXRhTGlzdCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5yZWZyZXNoKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jbGFzc2VzR3JpZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmNvbHVtbnNbMl1bXCJlZGl0YWJsZVwiXS5pdGVtcyA9IHRoaXMudGVhY2hlckRhdGFMaXN0O1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5jb2x1bW5zWzNdW1wiZWRpdGFibGVcIl0uaXRlbXMgPSB0aGlzLnRlYWNoZXJEYXRhTGlzdDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQuY2xlYXIoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICB3MmFsZXJ0KCdGZWhsZXIgYmVpbSBIb2xlbiBkZXIgRGF0ZW4uJyk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbkRlbGV0ZVRlYWNoZXIoZXZlbnQ6IGFueSkge1xyXG4gICAgICAgIGlmICghZXZlbnQuZm9yY2UgfHwgZXZlbnQuaXNTdG9wcGVkKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCByZWNJZHM6IG51bWJlcltdO1xyXG5cclxuICAgICAgICByZWNJZHMgPSA8bnVtYmVyW10+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIC8vIHJlY0lkcyA9IDxhbnk+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICAvLyBsZXQgc2VsZWN0ZWR0ZWFjaGVyczogVGVhY2hlckRhdGFbXSA9IDxUZWFjaGVyRGF0YVtdPnRoaXMudGVhY2hlcnNHcmlkLnJlY29yZHMuZmlsdGVyKFxyXG4gICAgICAgIC8vICAgICAoY2Q6IFRlYWNoZXJEYXRhKSA9PiByZWNJZHMuaW5kZXhPZihjZC51c2VyRGF0YS5pZCkgPj0gMCAmJiB0aGlzLmFkbWluaXN0cmF0aW9uLnVzZXJEYXRhLmlkICE9IGNkLnVzZXJEYXRhLmlkKTtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURVc2VyUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJkZWxldGVcIixcclxuICAgICAgICAgICAgZGF0YTogbnVsbCxcclxuICAgICAgICAgICAgaWRzOiByZWNJZHMsXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgcmVjSWRzLmZvckVhY2goaWQgPT4gdGhpcy50ZWFjaGVyc0dyaWQucmVtb3ZlKFwiXCIgKyBpZCkpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMudGVhY2hlckRhdGFMaXN0Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVjSWRzLmluZGV4T2YodGhpcy50ZWFjaGVyRGF0YUxpc3RbaV0udXNlckRhdGEuaWQpID49IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnRlYWNoZXJEYXRhTGlzdC5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMudGVhY2hlcnNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5jbGVhcigpO1xyXG4gICAgICAgIH0sICgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy50ZWFjaGVyc0dyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvblVwZGF0ZVRlYWNoZXIoZXZlbnQ6IGFueSkge1xyXG5cclxuICAgICAgICBsZXQgZGF0YTogVGVhY2hlckRhdGEgPSA8VGVhY2hlckRhdGE+dGhpcy50ZWFjaGVyc0dyaWQucmVjb3Jkc1tldmVudC5pbmRleF07XHJcblxyXG4gICAgICAgIGxldCBmaWVsZCA9IHRoaXMudGVhY2hlcnNHcmlkLmNvbHVtbnNbZXZlbnQuY29sdW1uXVtcImZpZWxkXCJdOyAgICAgICBcclxuXHJcbiAgICAgICAgZGF0YS51c2VyRGF0YVtmaWVsZF0gPSBldmVudC52YWx1ZV9uZXc7XHJcbiAgICAgICAgZGF0YVtmaWVsZF0gPSBldmVudC52YWx1ZV9uZXc7XHJcblxyXG4gICAgICAgIGRhdGEudXNlckRhdGEucGFzc3dvcmQgPSBudWxsO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFVzZXJSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcInVwZGF0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBkYXRhLnVzZXJEYXRhLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBrZXkgaW4gZGF0YVtcIncydWlcIl1bXCJjaGFuZ2VzXCJdKSB7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgZGF0YVtcIncydWlcIl1bXCJjaGFuZ2VzXCJdW2ZpZWxkXTtcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5yZWZyZXNoQ2VsbChkYXRhW1wicmVjaWRcIl0sIGZpZWxkKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRhdGEudXNlckRhdGFbZmllbGRdID0gZXZlbnQudmFsdWVfb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIGRhdGFbZmllbGRdID0gZXZlbnQudmFsdWVfb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW1widzJ1aVwiXVtcImNoYW5nZXNcIl1bZmllbGRdO1xyXG4gICAgICAgICAgICB0aGlzLnRlYWNoZXJzR3JpZC5yZWZyZXNoQ2VsbChkYXRhW1wicmVjaWRcIl0sIGZpZWxkKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25BZGRDbGFzcygpIHtcclxuXHJcbiAgICAgICAgbGV0IHNlbGVjdGVkVGVhY2hlcnMgPSA8bnVtYmVyW10+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vIGxldCBzZWxlY3RlZFRlYWNoZXJzID0gPG51bWJlcltdPnRoaXMudGVhY2hlcnNHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoZDogeyByZWNpZDogbnVtYmVyIH0pID0+IGQucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuICAgICAgICBpZiAoc2VsZWN0ZWRUZWFjaGVycy5sZW5ndGggIT0gMSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmVycm9yKFwiV2VubiBTaWUgS2xhc3NlbiBoaW56dWbDvGdlbiBtw7ZjaHRlbiBtdXNzIGxpbmtzIGdlbmF1IGVpbmUgTGVocmtyYWZ0IGF1c2dld8OkaGx0IHNlaW4uXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCB0ZWFjaGVySWQgPSBzZWxlY3RlZFRlYWNoZXJzWzBdO1xyXG4gICAgICAgIGxldCB0ZWFjaGVyRGF0YSA9IDxUZWFjaGVyRGF0YT50aGlzLnRlYWNoZXJzR3JpZC5nZXQoXCJcIiArIHRlYWNoZXJJZCwgZmFsc2UpO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRENsYXNzUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJjcmVhdGVcIixcclxuICAgICAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICAgICAgaWQ6IC0xLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJOYW1lXCIsXHJcbiAgICAgICAgICAgICAgICBsZWhya3JhZnRfaWQ6IHRlYWNoZXJJZCxcclxuICAgICAgICAgICAgICAgIHp3ZWl0bGVocmtyYWZ0X2lkOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgc2NodWxlX2lkOiB0ZWFjaGVyRGF0YS51c2VyRGF0YS5zY2h1bGVfaWQsXHJcbiAgICAgICAgICAgICAgICBha3RpdjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0dWRlbnRzOiBbXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEQ2xhc3NcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgbGV0IGNkOiBDbGFzc0RhdGEgPSByZXF1ZXN0LmRhdGE7XHJcbiAgICAgICAgICAgIGNkLmlkID0gcmVzcG9uc2UuaWQ7XHJcbiAgICAgICAgICAgIGNkW1widGVhY2hlclwiXSA9IHRlYWNoZXJEYXRhLnVzZXJEYXRhLnJ1Zm5hbWUgKyBcIiBcIiArIHRlYWNoZXJEYXRhLnVzZXJEYXRhLmZhbWlsaWVubmFtZTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLmVkaXRGaWVsZChjZC5pZCArIFwiXCIsIDEsIHVuZGVmaW5lZCwgeyBrZXlDb2RlOiAxMyB9KTtcclxuICAgICAgICAgICAgdGVhY2hlckRhdGEuY2xhc3Nlcy5wdXNoKGNkKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VsZWN0VGV4dEluQ2VsbCgpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIG9uRGVsZXRlQ2xhc3MoZXZlbnQ6IGFueSkge1xyXG4gICAgICAgIGlmICghZXZlbnQuZm9yY2UgfHwgZXZlbnQuaXNTdG9wcGVkKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCByZWNJZHM6IG51bWJlcltdID0gPG51bWJlcltdPnRoaXMuY2xhc3Nlc0dyaWQuZ2V0U2VsZWN0aW9uKCk7XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIC8vIHJlY0lkcyA9IDxhbnk+dGhpcy5jbGFzc2VzR3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKHN0cikgPT4gc3RyLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcblxyXG4gICAgICAgIC8vIGxldCBzZWxlY3RlZENsYXNzczogQ2xhc3NEYXRhW10gPSA8Q2xhc3NEYXRhW10+dGhpcy5jbGFzc2VzR3JpZC5yZWNvcmRzLmZpbHRlcihcclxuICAgICAgICAvLyAgICAgKGNkOiBDbGFzc0RhdGEpID0+IHJlY0lkcy5pbmRleE9mKGNkLmlkKSA+PSAwKTtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURDbGFzc1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiZGVsZXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IG51bGwsXHJcbiAgICAgICAgICAgIGlkczogcmVjSWRzLFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheChcIkNSVURDbGFzc1wiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICByZWNJZHMuZm9yRWFjaChpZCA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2Q6IENsYXNzRGF0YSA9IDxDbGFzc0RhdGE+dGhpcy5jbGFzc2VzR3JpZC5nZXQoaWQgKyBcIlwiKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQucmVtb3ZlKFwiXCIgKyBpZClcclxuICAgICAgICAgICAgICAgIGxldCBsZDogVGVhY2hlckRhdGEgPSA8VGVhY2hlckRhdGE+dGhpcy50ZWFjaGVyc0dyaWQuZ2V0KGNkLmxlaHJrcmFmdF9pZCArIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGxkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZC5jbGFzc2VzID0gbGQuY2xhc3Nlcy5maWx0ZXIoKGNsKSA9PiBjbC5pZCAhPSBjZC5pZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xhc3Nlc0dyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvblVwZGF0ZUNsYXNzKGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IGRhdGE6IENsYXNzRGF0YSA9IDxDbGFzc0RhdGE+dGhpcy5jbGFzc2VzR3JpZC5yZWNvcmRzW2V2ZW50LmluZGV4XTtcclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LmNvbHVtbiA9PSAyKSB7XHJcbiAgICAgICAgICAgIGxldCB0ZWFjaGVyOiBUZWFjaGVyRGF0YSA9IGV2ZW50LnZhbHVlX25ldztcclxuICAgICAgICAgICAgaWYgKHRlYWNoZXIgPT0gbnVsbCB8fCB0eXBlb2YgdGVhY2hlciA9PSBcInN0cmluZ1wiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCB0ZWFjaGVyT2xkMSA9IHRoaXMudGVhY2hlckRhdGFMaXN0LmZpbmQoKHRkKSA9PiB0ZC51c2VyRGF0YS5pZCA9PSBkYXRhLmxlaHJrcmFmdF9pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVhY2hlck9sZDEgIT0gbnVsbCkgdGVhY2hlck9sZDEuY2xhc3NlcyA9IHRlYWNoZXJPbGQxLmNsYXNzZXMuZmlsdGVyKGNkID0+IGNkLmlkICE9IGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgLy8gbGV0IHRlYWNoZXJPbGQyID0gdGhpcy50ZWFjaGVyc0dyaWQuZ2V0KGRhdGEubGVocmtyYWZ0X2lkICsgXCJcIik7XHJcbiAgICAgICAgICAgICAgICAvLyBpZiAodGVhY2hlck9sZDIgIT0gbnVsbCkgdGVhY2hlck9sZDEuY2xhc3NlcyA9IHRlYWNoZXJPbGQxLmNsYXNzZXMuZmlsdGVyKGNkID0+IGNkLmlkICE9IGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgZGF0YS5sZWhya3JhZnRfaWQgPSB0ZWFjaGVyLnVzZXJEYXRhLmlkO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlci5jbGFzc2VzLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGVhY2hlck5ldzI6IFRlYWNoZXJEYXRhID0gPGFueT50aGlzLnRlYWNoZXJzR3JpZC5nZXQodGVhY2hlci51c2VyRGF0YS5pZCArIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRlYWNoZXJOZXcyICE9IG51bGwpIHRlYWNoZXJOZXcyLmNsYXNzZXMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnZhbHVlX25ldyA9IHRlYWNoZXIudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgdGVhY2hlci51c2VyRGF0YS5mYW1pbGllbm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChldmVudC5jb2x1bW4gPT0gMykge1xyXG4gICAgICAgICAgICBsZXQgdGVhY2hlcjogVGVhY2hlckRhdGEgPSBldmVudC52YWx1ZV9uZXc7XHJcbiAgICAgICAgICAgIGlmICh0ZWFjaGVyID09IG51bGwgfHwgdHlwZW9mIHRlYWNoZXIgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGVhY2hlck9sZDEgPSB0aGlzLnRlYWNoZXJEYXRhTGlzdC5maW5kKCh0ZCkgPT4gdGQudXNlckRhdGEuaWQgPT0gZGF0YS56d2VpdGxlaHJrcmFmdF9pZCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodGVhY2hlck9sZDEgIT0gbnVsbCkgdGVhY2hlck9sZDEuY2xhc3NlcyA9IHRlYWNoZXJPbGQxLmNsYXNzZXMuZmlsdGVyKGNkID0+IGNkLmlkICE9IGRhdGEuaWQpO1xyXG4gICAgICAgICAgICAgICAgLy8gbGV0IHRlYWNoZXJPbGQyID0gdGhpcy50ZWFjaGVyc0dyaWQuZ2V0KGRhdGEuendlaXRsZWhya3JhZnRfaWQgKyBcIlwiKTtcclxuICAgICAgICAgICAgICAgIC8vIGlmICh0ZWFjaGVyT2xkMiAhPSBudWxsKSB0ZWFjaGVyT2xkMS5jbGFzc2VzID0gdGVhY2hlck9sZDEuY2xhc3Nlcy5maWx0ZXIoY2QgPT4gY2QuaWQgIT0gZGF0YS5pZCk7XHJcbiAgICAgICAgICAgICAgICBkYXRhLnp3ZWl0bGVocmtyYWZ0X2lkID0gdGVhY2hlci51c2VyRGF0YS5pZCA9PSAtMSA/IG51bGwgOiB0ZWFjaGVyLnVzZXJEYXRhLmlkO1xyXG4gICAgICAgICAgICAgICAgdGVhY2hlci5jbGFzc2VzLnB1c2goZGF0YSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGVhY2hlck5ldzI6IFRlYWNoZXJEYXRhID0gPGFueT50aGlzLnRlYWNoZXJzR3JpZC5nZXQodGVhY2hlci51c2VyRGF0YS5pZCArIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRlYWNoZXJOZXcyICE9IG51bGwpIHRlYWNoZXJOZXcyLmNsYXNzZXMucHVzaChkYXRhKTtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnZhbHVlX25ldyA9IHRlYWNoZXIudXNlckRhdGEucnVmbmFtZSArIFwiIFwiICsgdGVhY2hlci51c2VyRGF0YS5mYW1pbGllbm5hbWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgbGV0IGZpZWxkID0gdGhpcy5jbGFzc2VzR3JpZC5jb2x1bW5zW2V2ZW50LmNvbHVtbl1bXCJmaWVsZFwiXTtcclxuICAgICAgICBkYXRhW2ZpZWxkXSA9IGV2ZW50LnZhbHVlX25ldztcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURDbGFzc1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBhamF4KFwiQ1JVRENsYXNzXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKGRhdGEpO1xyXG4gICAgICAgICAgICBkZWxldGUgZGF0YVtcIncydWlcIl1bXCJjaGFuZ2VzXCJdW2ZpZWxkXTtcclxuICAgICAgICAgICAgdGhpcy5jbGFzc2VzR3JpZC5yZWZyZXNoQ2VsbChkYXRhW1wicmVjaWRcIl0sIGZpZWxkKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRhdGFbZmllbGRdID0gZXZlbnQudmFsdWVfb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW1widzJ1aVwiXVtcImNoYW5nZXNcIl1bZmllbGRdO1xyXG4gICAgICAgICAgICB0aGlzLmNsYXNzZXNHcmlkLnJlZnJlc2hDZWxsKGRhdGFbXCJyZWNpZFwiXSwgZmllbGQpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuXHJcbn0iXX0=