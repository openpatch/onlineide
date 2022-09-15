import { AdminMenuItem } from "./AdminMenuItem.js";
import { ajax } from "../communication/AjaxHelper.js";
import { PasswordPopup } from "./PasswordPopup.js";
export class ClassesWithStudentsMI extends AdminMenuItem {
    constructor(administration) {
        super(administration);
        this.classesGridName = "classesGrid";
        this.studentGridName = "studentsGrid";
        this.allClassesList = [];
        this.initChooseClassPopup();
    }
    checkPermission(user) {
        return user.is_teacher;
    }
    getButtonIdentifier() {
        return "Klassen mit Schülern";
    }
    onMenuButtonPressed($mainHeading, $tableLeft, $tableRight, $mainFooter) {
        $tableRight.css('flex', '2');
        let that = this;
        if (w2ui[this.classesGridName] != null) {
            let grid = w2ui[this.classesGridName];
            grid.render();
        }
        else {
            $tableLeft.w2grid({
                name: this.classesGridName,
                header: 'Klassen',
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
                recid: "id",
                columns: [
                    { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                    { field: 'name', caption: 'Bezeichnung', size: '30%', sortable: true, resizable: true, editable: { type: 'text' } },
                    {
                        field: 'numberOfStudents', caption: 'Schüler/innen', size: '30%', sortable: true, resizable: true,
                        render: function (record) {
                            return '<div>' + record.students.length + '</div>';
                        }
                    },
                ],
                searches: [
                    { field: 'name', label: 'Bezeichnung', type: 'text' }
                ],
                sortData: [{ field: 'name', direction: 'ASC' }],
                onSelect: (event) => { that.onSelectClass(event); },
                onUnselect: (event) => { that.onSelectClass(event); },
                onAdd: (event) => { that.onAddClass(); },
                onChange: (event) => { that.onUpdateClass(event); },
                onDelete: (event) => { that.onDeleteClass(event); },
            });
        }
        this.loadClassDataList(() => {
            this.loadTables();
            if (w2ui[this.studentGridName] != null) {
                let grid = w2ui[this.studentGridName];
                grid.render();
            }
            else {
                $tableRight.w2grid({
                    name: this.studentGridName,
                    header: 'Schüler/innen',
                    selectType: "cell",
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
                            { type: 'button', id: 'passwordButton', text: 'Passwort ändern...' },
                            { type: 'button', id: 'changeClassButton', text: 'Klasse ändern...' } //, img: 'fa-key' }
                        ],
                        onClick: function (target, data) {
                            if (target == "passwordButton") {
                                that.changePassword();
                            }
                            else if (target == "changeClassButton") {
                                that.changeClass();
                            }
                        }
                    },
                    recid: "id",
                    columns: [
                        { field: 'id', caption: 'ID', size: '20px', sortable: true, hidden: true },
                        {
                            field: 'klasse', caption: 'Klasse', size: '10%', sortable: true, resizable: true
                        },
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
                    onAdd: (event) => { that.onAddStudent(); },
                    onChange: (event) => { that.onUpdateStudent(event); },
                    onDelete: (event) => { that.onDeleteStudent(event); },
                    onClick: (event) => {
                        if (event.column == 1) {
                            w2ui[that.studentGridName].editField(event.recid, event.column);
                        }
                    },
                    onSelect: (event) => { event.done(() => { that.onSelectStudent(event); }); },
                    onUnselect: (event) => { event.done(() => { that.onSelectStudent(event); }); },
                });
            }
        });
    }
    onSelectStudent(event) {
        let studentGrid = w2ui[this.studentGridName];
        let selection = studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        if (selection.length > 0) {
            //@ts-ignore
            studentGrid.toolbar.enable('changeClassButton');
        }
        else {
            //@ts-ignore
            studentGrid.toolbar.disable('changeClassButton');
        }
        if (selection.length == 1) {
            //@ts-ignore
            studentGrid.toolbar.enable('passwordButton');
        }
        else {
            //@ts-ignore
            studentGrid.toolbar.disable('passwordButton');
        }
    }
    changeClass() {
        let recIds;
        let that = this;
        let studentGrid = w2ui[this.studentGridName];
        let classesGrid = w2ui[this.classesGridName];
        //@ts-ignore
        recIds = studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let students = recIds.map((id) => studentGrid.get(id + ""));
        this.openChooseClassPopup((newClass) => {
            newClass = that.allClassesList.find((cl) => cl.id == newClass.id);
            let request = {
                student_ids: recIds,
                new_class_id: newClass.id
            };
            ajax("changeClassOfStudents", request, (response) => {
                w2alert("Die Schüler wurden erfolgreich in die Klasse " + newClass.name + " verschoben.");
                for (let klasse of this.allClassesList) {
                    klasse.students = klasse.students.filter((student) => recIds.indexOf(student.id) < 0);
                }
                for (let student of students)
                    newClass.students.push(student);
                for (let rc of classesGrid.records) {
                    let rc1 = rc;
                    rc1.students = this.allClassesList.find((cl) => cl.id == rc1.id).students;
                }
                classesGrid.refresh();
                that.updateStudentTableToSelectedClasses();
            }, (message) => {
                w2alert("Fehler beim versetzen der Schüler: " + message);
            });
        }, this.allClassesList);
    }
    changePassword(recIds = []) {
        let that = this;
        let studentGrid = w2ui[this.studentGridName];
        if (recIds.length == 0) {
            //@ts-ignore
            recIds = studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        }
        if (recIds.length != 1) {
            studentGrid.error("Zum Ändern eines Passworts muss genau ein Schüler ausgewählt werden.");
        }
        else {
            let student = studentGrid.get(recIds[0] + "", false);
            let passwordFor = student.rufname + " " + student.familienname + " (" + student.username + ")";
            PasswordPopup.open(passwordFor, () => {
                studentGrid.searchReset();
                that.preparePasswordButtons();
            }, (password) => {
                student.password = password;
                let request = {
                    type: "update",
                    data: student,
                };
                //@ts-ignore
                w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);
                ajax("CRUDUser", request, (response) => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Das Passwort für ' + student.rufname + " " + student.familienname + " (" + student.username + ") wurde erfolgreich geändert.");
                    studentGrid.searchReset();
                    that.preparePasswordButtons();
                }, () => {
                    //@ts-ignore
                    w2utils.unlock(jQuery('body'));
                    w2alert('Fehler beim Ändern des Passworts!');
                    studentGrid.searchReset();
                    that.preparePasswordButtons();
                });
            });
            // w2prompt({
            //     label: 'Neues Passwort',
            //     value: '',
            //     attrs: 'style="width: 200px" type="password"',
            //     title: "Passwort für " + student.rufname + " " + student.familienname + " (" + student.username + ")",
            //     ok_text: "OK",
            //     cancel_text: "Abbrechen",
            //     width: 600,
            //     height: 200
            // })
            //     .change(function (event) {
            //     })
            //     .ok(function (password) {
            //         student.password = password;
            //         let request: CRUDUserRequest = {
            //             type: "update",
            //             data: student,
            //         }
            //         ajax("CRUDUser", request, (response: CRUDResponse) => {
            //             w2alert('Das Passwort für ' + student.rufname + " " + student.familienname + " (" + student.username + ") wurde erfolgreich geändert.");
            //             studentGrid.searchReset();
            //             that.preparePasswordButtons();
            //         }, () => {
            //             w2alert('Fehler beim Ändern des Passworts!');
            //             studentGrid.searchReset();
            //             that.preparePasswordButtons();
            //         });
            //     })
            // .cancel(function () {
            //     studentGrid.searchReset();
            //     that.preparePasswordButtons();
            // });
            // jQuery('#w2ui-popup #w2prompt').attr("type", "password");                
        }
    }
    onDeleteClass(event) {
        if (!event.force || event.isStopped)
            return;
        let recIds;
        let classesGrid = w2ui[this.classesGridName];
        //@ts-ignore
        recIds = classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let selectedClasses = classesGrid.records.filter((cd) => recIds.indexOf(cd.id) >= 0);
        let request = {
            type: "delete",
            data: null,
            ids: recIds,
        };
        ajax("CRUDClass", request, (response) => {
            recIds.forEach(id => classesGrid.remove("" + id));
            classesGrid.refresh();
        }, () => {
            classesGrid.refresh();
        });
    }
    onUpdateClass(event) {
        let classesGrid = w2ui[this.classesGridName];
        let data = classesGrid.records[event.index];
        data[classesGrid.columns[event.column]["field"]] = event.value_new;
        let request = {
            type: "update",
            data: data,
        };
        ajax("CRUDClass", request, (response) => {
            // console.log(data);
            delete data["w2ui"]["changes"];
            classesGrid.refresh();
        }, () => {
            data[classesGrid.columns[event.column]["field"]] = event.value_original;
            classesGrid.refresh();
        });
    }
    onAddClass() {
        let userData = this.administration.userData;
        let request = {
            type: "create",
            data: {
                id: -1,
                schule_id: userData.schule_id,
                lehrkraft_id: userData.id,
                name: "Name der Klasse",
                students: []
            },
        };
        ajax("CRUDClass", request, (response) => {
            let classesGrid = w2ui[this.classesGridName];
            let cd = request.data;
            cd.id = response.id;
            classesGrid.add(cd);
            classesGrid.editField(cd.id + "", 1, undefined, { keyCode: 13 });
            this.selectTextInCell();
        });
    }
    onSelectClass(event) {
        let that = this;
        event.done(() => {
            that.updateStudentTableToSelectedClasses();
            that.preparePasswordButtons();
        });
    }
    preparePasswordButtons() {
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
    updateStudentTableToSelectedClasses() {
        let recIds;
        let classesGrid = w2ui[this.classesGridName];
        //@ts-ignore
        recIds = classesGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let selectedClasses = this.allClassesList.filter((cd) => recIds.indexOf(cd.id) >= 0);
        let studentsGrid = w2ui[this.studentGridName];
        let studentList = [];
        for (let cd of selectedClasses) {
            for (let sd of cd.students) {
                //@ts-ignore
                sd.klasse = cd.name;
                studentList.push(sd);
            }
        }
        // studentsGrid.records = studentList;
        setTimeout(() => {
            studentsGrid.clear();
            studentsGrid.add(studentList);
            studentsGrid.refresh();
            this.onSelectStudent(null);
        }, 20);
    }
    loadClassDataList(callback) {
        let request = {
            school_id: this.administration.userData.schule_id
        };
        ajax('getClassesData', request, (response) => {
            this.allClassesList = response.classDataList;
            for (let cd of this.allClassesList) {
                cd.text = cd.name;
            }
            callback();
        });
    }
    loadTables() {
        let classesTable = w2ui[this.classesGridName];
        classesTable.clear();
        classesTable.add(this.allClassesList);
        classesTable.refresh();
    }
    onDeleteStudent(event) {
        if (!event.force || event.isStopped)
            return;
        let recIds;
        let studentGrid = w2ui[this.studentGridName];
        let classesGrid = w2ui[this.classesGridName];
        //@ts-ignore
        recIds = studentGrid.getSelection().map((str) => str.recid).filter((value, index, array) => array.indexOf(value) === index);
        let request = {
            type: "delete",
            data: null,
            ids: recIds,
        };
        let that = this;
        ajax("CRUDUser", request, (response) => {
            recIds.forEach(id => studentGrid.remove("" + id));
            this.allClassesList.forEach(klass => {
                for (let i = 0; i < klass.students.length; i++) {
                    let student = klass.students[i];
                    if (recIds.indexOf(student.id) >= 0) {
                        klass.students.splice(i, 1);
                        i--;
                    }
                }
            });
            studentGrid.refresh();
            classesGrid.refresh();
        }, (message) => {
            w2alert('Fehler beim Löschen der Schüler: ' + message);
            studentGrid.refresh();
        });
    }
    onUpdateStudent(event) {
        let studentGrid = w2ui[this.studentGridName];
        let data = studentGrid.records[event.index];
        let value_new_presented = event.value_new;
        let value_old_database = data.klasse_id;
        if (event.column == 1) {
            let classData = event.value_new;
            value_new_presented = classData.name;
            data.klasse_id = event.value_new.id;
            if (event.value_new.id == null) {
                event.preventDefault();
                return;
            }
        }
        data[studentGrid.columns[event.column]["field"]] = value_new_presented;
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
            // studentGrid.last.inEditMode = false;
        }, () => {
            data[studentGrid.columns[event.column]["field"]] = event.value_original;
            data.klasse_id = value_old_database;
            // studentGrid.refresh();
        });
    }
    onAddStudent() {
        let userData = this.administration.userData;
        let studentGrid = w2ui[this.studentGridName];
        let classesGrid = w2ui[this.classesGridName];
        let selectedClasses = classesGrid.getSelection().filter((value, index, array) => array.indexOf(value) === index).map(cl => cl.recid);
        if (selectedClasses.length != 1) {
            studentGrid.error("Wenn Sie Schüler hinzufügen möchten muss links genau eine Klasse ausgewählt sein.");
            return;
        }
        let classId = selectedClasses[0];
        let klass = classesGrid.get("" + classId, false);
        let request = {
            type: "create",
            data: {
                id: -1,
                schule_id: userData.schule_id,
                klasse_id: classId,
                username: "Benutzername" + Math.round(Math.random() * 10000000),
                rufname: "Rufname",
                familienname: "Familienname",
                is_admin: false,
                is_schooladmin: false,
                is_teacher: false,
                password: Math.round(Math.random() * 10000000) + "x"
            },
        };
        //@ts-ignore
        w2utils.lock(jQuery('body'), "Bitte warten, das Hashen <br> des Passworts kann <br>bis zu 1 Minute<br> dauern...", true);
        ajax("CRUDUser", request, (response) => {
            let ud = request.data;
            ud.id = response.id;
            ud["klasse"] = klass.name;
            studentGrid.add(ud);
            studentGrid.editField(ud.id + "", 2, undefined, { keyCode: 13 });
            klass.students.push(ud);
            this.selectTextInCell();
            this.preparePasswordButtons();
            classesGrid.refresh();
            // @ts-ignore
            w2utils.unlock(jQuery('body'));
        }, (errormessage) => {
            //@ts-ignore
            w2utils.unlock(jQuery('body'));
            w2alert("Beim Anlegen des Benutzers ist ein Fehler aufgetreten: " + errormessage);
        });
    }
    initChooseClassPopup() {
        let that = this;
        if (!w2ui.chooseClassForm) {
            jQuery().w2form({
                name: 'chooseClassForm',
                style: 'border: 0px; background-color: transparent;',
                formHTML: '<div class="w2ui-page page-0">' +
                    '    <div class="w2ui-field">' +
                    '        <label>Neue Klasse:</label>' +
                    '        <div>' +
                    '           <input name="newClass" type="text" style="width: 150px"/>' +
                    '        </div>' +
                    '    </div>' +
                    '</div>' +
                    '<div class="w2ui-buttons">' +
                    '    <button class="w2ui-btn" name="cancel">Abbrechen</button>' +
                    '    <button class="w2ui-btn" name="OK">OK</button>' +
                    '</div>',
                fields: [
                    {
                        field: 'newClass', type: 'list', required: true,
                        options: { items: [] }
                    },
                ],
                record: {
                    newClass: 'John',
                },
                actions: {
                    "cancel": function () {
                        w2popup.close();
                    },
                    "OK": function () {
                        w2popup.close();
                        this.myCallback(this.record.newClass);
                    }
                }
            });
        }
    }
    openChooseClassPopup(callback, classList) {
        w2ui["chooseClassForm"].myCallback = callback;
        w2ui["chooseClassForm"].fields[0].options.items = classList;
        //@ts-ignore
        jQuery().w2popup('open', {
            title: 'Neue Klasse wählen',
            body: '<div id="form" style="width: 100%; height: 100%;"></div>',
            style: 'padding: 15px 0px 0px 0px',
            width: 500,
            height: 300,
            showMax: true,
            onToggle: function (event) {
                jQuery(w2ui.chooseClassForm.box).hide();
                event.onComplete = function () {
                    jQuery(w2ui.chooseClassForm.box).show();
                    w2ui.chooseClassForm.resize();
                };
            },
            onOpen: function (event) {
                event.onComplete = function () {
                    // specifying an onOpen handler instead is equivalent to specifying an onBeforeOpen handler, which would make this code execute too early and hence not deliver.
                    //@ts-ignore
                    jQuery('#w2ui-popup #form').w2render('chooseClassForm');
                };
            }
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3Nlc1dpdGhTdHVkZW50c01JLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9hZG1pbmlzdHJhdGlvbi9DbGFzc2VzV2l0aFN0dWRlbnRzTUkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBRW5ELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUd0RCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFLbkQsTUFBTSxPQUFPLHFCQUFzQixTQUFRLGFBQWE7SUFPcEQsWUFBWSxjQUE4QjtRQUN0QyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFOMUIsb0JBQWUsR0FBRyxhQUFhLENBQUM7UUFDaEMsb0JBQWUsR0FBRyxjQUFjLENBQUM7UUFFakMsbUJBQWMsR0FBZ0IsRUFBRSxDQUFDO1FBSTdCLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO0lBQ2hDLENBQUM7SUFFRCxlQUFlLENBQUMsSUFBYztRQUMxQixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDM0IsQ0FBQztJQUVELG1CQUFtQjtRQUNmLE9BQU8sc0JBQXNCLENBQUM7SUFDbEMsQ0FBQztJQUVELG1CQUFtQixDQUFDLFlBQWlDLEVBQUUsVUFBK0IsRUFDbEYsV0FBZ0MsRUFBRSxXQUFnQztRQUVsRSxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztRQUU3QixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFFaEIsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLElBQUksRUFBRTtZQUNwQyxJQUFJLElBQUksR0FBZ0IsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsQ0FBQztZQUNuRCxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7U0FDakI7YUFBTTtZ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dCI6WyJpbXBvcnQgeyBBZG1pbk1lbnVJdGVtIH0gZnJvbSBcIi4vQWRtaW5NZW51SXRlbS5qc1wiO1xyXG5pbXBvcnQgeyBVc2VyRGF0YSwgQ2xhc3NEYXRhLCBDUlVEQ2xhc3NSZXF1ZXN0LCBDUlVEVXNlclJlcXVlc3QsIENSVURSZXNwb25zZSwgR2V0Q2xhc3Nlc0RhdGFSZXF1ZXN0LCBHZXRDbGFzc2VzRGF0YVJlc3BvbnNlLCBDaGFuZ2VDbGFzc09mU3R1ZGVudHNSZXF1ZXN0LCBDaGFuZ2VDbGFzc09mU3R1ZGVudHNSZXNwb25zZSB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgQWRtaW5pc3RyYXRpb24gfSBmcm9tIFwiLi9BZG1pbmlzdHJhdGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBUZWFjaGVyc1dpdGhDbGFzc2VzTUkgfSBmcm9tIFwiLi9UZWFjaGVyc1dpdGhDbGFzc2VzLmpzXCI7XHJcbmltcG9ydCB7IFBhc3N3b3JkUG9wdXAgfSBmcm9tIFwiLi9QYXNzd29yZFBvcHVwLmpzXCI7XHJcblxyXG5kZWNsYXJlIHZhciB3MnByb21wdDogYW55O1xyXG5kZWNsYXJlIHZhciB3MmFsZXJ0OiBhbnk7XHJcblxyXG5leHBvcnQgY2xhc3MgQ2xhc3Nlc1dpdGhTdHVkZW50c01JIGV4dGVuZHMgQWRtaW5NZW51SXRlbSB7XHJcblxyXG4gICAgY2xhc3Nlc0dyaWROYW1lID0gXCJjbGFzc2VzR3JpZFwiO1xyXG4gICAgc3R1ZGVudEdyaWROYW1lID0gXCJzdHVkZW50c0dyaWRcIjtcclxuXHJcbiAgICBhbGxDbGFzc2VzTGlzdDogQ2xhc3NEYXRhW10gPSBbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihhZG1pbmlzdHJhdGlvbjogQWRtaW5pc3RyYXRpb24pIHtcclxuICAgICAgICBzdXBlcihhZG1pbmlzdHJhdGlvbik7XHJcbiAgICAgICAgdGhpcy5pbml0Q2hvb3NlQ2xhc3NQb3B1cCgpO1xyXG4gICAgfVxyXG5cclxuICAgIGNoZWNrUGVybWlzc2lvbih1c2VyOiBVc2VyRGF0YSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB1c2VyLmlzX3RlYWNoZXI7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QnV0dG9uSWRlbnRpZmllcigpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBcIktsYXNzZW4gbWl0IFNjaMO8bGVyblwiO1xyXG4gICAgfVxyXG5cclxuICAgIG9uTWVudUJ1dHRvblByZXNzZWQoJG1haW5IZWFkaW5nOiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkdGFibGVMZWZ0OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LFxyXG4gICAgICAgICR0YWJsZVJpZ2h0OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCAkbWFpbkZvb3RlcjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuICAgICAgICAkdGFibGVSaWdodC5jc3MoJ2ZsZXgnLCAnMicpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh3MnVpW3RoaXMuY2xhc3Nlc0dyaWROYW1lXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBncmlkOiBXMlVJLlcyR3JpZCA9IHcydWlbdGhpcy5jbGFzc2VzR3JpZE5hbWVdO1xyXG4gICAgICAgICAgICBncmlkLnJlbmRlcigpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICR0YWJsZUxlZnQudzJncmlkKHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuY2xhc3Nlc0dyaWROYW1lLFxyXG4gICAgICAgICAgICAgICAgaGVhZGVyOiAnS2xhc3NlbicsXHJcbiAgICAgICAgICAgICAgICBzZWxlY3RUeXBlOiBcImNlbGxcIixcclxuICAgICAgICAgICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgICAgICAgICBoZWFkZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyQWRkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXJEZWxldGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdENvbHVtbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFyU2VhcmNoOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0b29sYmFySW5wdXQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcmVjaWQ6IFwiaWRcIixcclxuICAgICAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnaWQnLCBjYXB0aW9uOiAnSUQnLCBzaXplOiAnMjBweCcsIHNvcnRhYmxlOiB0cnVlLCBoaWRkZW46IHRydWUgfSxcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnbmFtZScsIGNhcHRpb246ICdCZXplaWNobnVuZycsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBlZGl0YWJsZTogeyB0eXBlOiAndGV4dCcgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICdudW1iZXJPZlN0dWRlbnRzJywgY2FwdGlvbjogJ1NjaMO8bGVyL2lubmVuJywgc2l6ZTogJzMwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcjogZnVuY3Rpb24gKHJlY29yZDogQ2xhc3NEYXRhKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXY+JyArIHJlY29yZC5zdHVkZW50cy5sZW5ndGggKyAnPC9kaXY+JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgc2VhcmNoZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnbmFtZScsIGxhYmVsOiAnQmV6ZWljaG51bmcnLCB0eXBlOiAndGV4dCcgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHNvcnREYXRhOiBbeyBmaWVsZDogJ25hbWUnLCBkaXJlY3Rpb246ICdBU0MnIH1dLFxyXG4gICAgICAgICAgICAgICAgb25TZWxlY3Q6IChldmVudCkgPT4geyB0aGF0Lm9uU2VsZWN0Q2xhc3MoZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICBvblVuc2VsZWN0OiAoZXZlbnQpID0+IHsgdGhhdC5vblNlbGVjdENsYXNzKGV2ZW50KSB9LFxyXG4gICAgICAgICAgICAgICAgb25BZGQ6IChldmVudCkgPT4geyB0aGF0Lm9uQWRkQ2xhc3MoKSB9LFxyXG4gICAgICAgICAgICAgICAgb25DaGFuZ2U6IChldmVudCkgPT4geyB0aGF0Lm9uVXBkYXRlQ2xhc3MoZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICBvbkRlbGV0ZTogKGV2ZW50KSA9PiB7IHRoYXQub25EZWxldGVDbGFzcyhldmVudCkgfSxcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubG9hZENsYXNzRGF0YUxpc3QoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmxvYWRUYWJsZXMoKTtcclxuICAgICAgICAgICAgaWYgKHcydWlbdGhpcy5zdHVkZW50R3JpZE5hbWVdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCBncmlkOiBXMlVJLlcyR3JpZCA9IHcydWlbdGhpcy5zdHVkZW50R3JpZE5hbWVdO1xyXG4gICAgICAgICAgICAgICAgZ3JpZC5yZW5kZXIoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICR0YWJsZVJpZ2h0LncyZ3JpZCh7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogdGhpcy5zdHVkZW50R3JpZE5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiAnU2Now7xsZXIvaW5uZW4nLFxyXG4gICAgICAgICAgICAgICAgICAgIHNlbGVjdFR5cGU6IFwiY2VsbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaGVhZGVyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sYmFyQWRkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b29sYmFyRGVsZXRlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGVjdENvbHVtbjogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdG9vbGJhclNlYXJjaDogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdHlwZTogJ2JyZWFrJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYnV0dG9uJywgaWQ6ICdwYXNzd29yZEJ1dHRvbicsIHRleHQ6ICdQYXNzd29ydCDDpG5kZXJuLi4uJyB9LCAvLywgaW1nOiAnZmEta2V5JyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyB0eXBlOiAnYnV0dG9uJywgaWQ6ICdjaGFuZ2VDbGFzc0J1dHRvbicsIHRleHQ6ICdLbGFzc2Ugw6RuZGVybi4uLicgfSAvLywgaW1nOiAnZmEta2V5JyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICh0YXJnZXQsIGRhdGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgPT0gXCJwYXNzd29yZEJ1dHRvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jaGFuZ2VQYXNzd29yZCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0YXJnZXQgPT0gXCJjaGFuZ2VDbGFzc0J1dHRvblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jaGFuZ2VDbGFzcygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICByZWNpZDogXCJpZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ2lkJywgY2FwdGlvbjogJ0lEJywgc2l6ZTogJzIwcHgnLCBzb3J0YWJsZTogdHJ1ZSwgaGlkZGVuOiB0cnVlIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpZWxkOiAna2xhc3NlJywgY2FwdGlvbjogJ0tsYXNzZScsIHNpemU6ICcxMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgZmllbGQ6ICd1c2VybmFtZScsIGNhcHRpb246ICdCZW51dHplcm5hbWUnLCBzaXplOiAnMzAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgZWRpdGFibGU6IHsgdHlwZTogJ3RleHQnIH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3J1Zm5hbWUnLCBjYXB0aW9uOiAnUnVmbmFtZScsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBlZGl0YWJsZTogeyB0eXBlOiAndGV4dCcgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7IGZpZWxkOiAnZmFtaWxpZW5uYW1lJywgY2FwdGlvbjogJ0ZhbWlsaWVubmFtZScsIHNpemU6ICczMCUnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBlZGl0YWJsZTogeyB0eXBlOiAndGV4dCcgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ2lkJywgY2FwdGlvbjogJ1BXJywgc2l6ZTogJzQwcHgnLCBzb3J0YWJsZTogZmFsc2UsIHJlbmRlcjogKGUpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJzxkaXYgY2xhc3M9XCJwd19idXR0b25cIiB0aXRsZT1cIlBhc3N3b3J0IMOkbmRlcm5cIiBkYXRhLXJlY2lkPVwiJyArIGUucmVjaWQgKyAnXCI+UFchPC9kaXY+JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3VzZXJuYW1lJywgbGFiZWw6ICdCZW51dHplcm5hbWUnLCB0eXBlOiAndGV4dCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ3J1Zm5hbWUnLCBsYWJlbDogJ1J1Zm5hbWUnLCB0eXBlOiAndGV4dCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgeyBmaWVsZDogJ2ZhbWlsaWVubmFtZScsIGxhYmVsOiAnRmFtaWxpZW5uYW1lJywgdHlwZTogJ3RleHQnIH1cclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvcnREYXRhOiBbeyBmaWVsZDogJ2tsYXNzZScsIGRpcmVjdGlvbjogJ2FzYycgfSwgeyBmaWVsZDogJ2ZhbWlsaWVubmFtZScsIGRpcmVjdGlvbjogJ2FzYycgfSwgeyBmaWVsZDogJ3J1Zm5hbWUnLCBkaXJlY3Rpb246ICdhc2MnIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQWRkOiAoZXZlbnQpID0+IHsgdGhhdC5vbkFkZFN0dWRlbnQoKSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlOiAoZXZlbnQpID0+IHsgdGhhdC5vblVwZGF0ZVN0dWRlbnQoZXZlbnQpIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25EZWxldGU6IChldmVudCkgPT4geyB0aGF0Lm9uRGVsZXRlU3R1ZGVudChldmVudCkgfSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGV2ZW50LmNvbHVtbiA9PSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3MnVpW3RoYXQuc3R1ZGVudEdyaWROYW1lXS5lZGl0RmllbGQoZXZlbnQucmVjaWQsIGV2ZW50LmNvbHVtbik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uU2VsZWN0OiAoZXZlbnQpID0+IHsgZXZlbnQuZG9uZSgoKSA9PiB7IHRoYXQub25TZWxlY3RTdHVkZW50KGV2ZW50KSB9KSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9uVW5zZWxlY3Q6IChldmVudCkgPT4geyBldmVudC5kb25lKCgpID0+IHsgdGhhdC5vblNlbGVjdFN0dWRlbnQoZXZlbnQpIH0pIH0sXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25TZWxlY3RTdHVkZW50KGV2ZW50OiBhbnkpIHtcclxuXHJcbiAgICAgICAgbGV0IHN0dWRlbnRHcmlkID0gdzJ1aVt0aGlzLnN0dWRlbnRHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIGxldCBzZWxlY3Rpb24gPSBzdHVkZW50R3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKHN0cikgPT4gc3RyLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgc3R1ZGVudEdyaWQudG9vbGJhci5lbmFibGUoJ2NoYW5nZUNsYXNzQnV0dG9uJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHN0dWRlbnRHcmlkLnRvb2xiYXIuZGlzYWJsZSgnY2hhbmdlQ2xhc3NCdXR0b24nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZWxlY3Rpb24ubGVuZ3RoID09IDEpIHtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIHN0dWRlbnRHcmlkLnRvb2xiYXIuZW5hYmxlKCdwYXNzd29yZEJ1dHRvbicpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICBzdHVkZW50R3JpZC50b29sYmFyLmRpc2FibGUoJ3Bhc3N3b3JkQnV0dG9uJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VDbGFzcygpIHtcclxuICAgICAgICBsZXQgcmVjSWRzOiBudW1iZXJbXTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBzdHVkZW50R3JpZDogVzJVSS5XMkdyaWQgPSB3MnVpW3RoaXMuc3R1ZGVudEdyaWROYW1lXTtcclxuICAgICAgICBsZXQgY2xhc3Nlc0dyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLmNsYXNzZXNHcmlkTmFtZV07XHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgcmVjSWRzID0gPGFueT5zdHVkZW50R3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKHN0cikgPT4gc3RyLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcbiAgICAgICAgbGV0IHN0dWRlbnRzOiBVc2VyRGF0YVtdID0gcmVjSWRzLm1hcCgoaWQpID0+IDxVc2VyRGF0YT5zdHVkZW50R3JpZC5nZXQoaWQgKyBcIlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMub3BlbkNob29zZUNsYXNzUG9wdXAoKG5ld0NsYXNzOiBDbGFzc0RhdGEpID0+IHtcclxuXHJcbiAgICAgICAgICAgIG5ld0NsYXNzID0gdGhhdC5hbGxDbGFzc2VzTGlzdC5maW5kKChjbCkgPT4gY2wuaWQgPT0gbmV3Q2xhc3MuaWQpO1xyXG5cclxuICAgICAgICAgICAgbGV0IHJlcXVlc3Q6IENoYW5nZUNsYXNzT2ZTdHVkZW50c1JlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICBzdHVkZW50X2lkczogcmVjSWRzLFxyXG4gICAgICAgICAgICAgICAgbmV3X2NsYXNzX2lkOiBuZXdDbGFzcy5pZFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBhamF4KFwiY2hhbmdlQ2xhc3NPZlN0dWRlbnRzXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ2hhbmdlQ2xhc3NPZlN0dWRlbnRzUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICB3MmFsZXJ0KFwiRGllIFNjaMO8bGVyIHd1cmRlbiBlcmZvbGdyZWljaCBpbiBkaWUgS2xhc3NlIFwiICsgbmV3Q2xhc3MubmFtZSArIFwiIHZlcnNjaG9iZW4uXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGtsYXNzZSBvZiB0aGlzLmFsbENsYXNzZXNMaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAga2xhc3NlLnN0dWRlbnRzID0ga2xhc3NlLnN0dWRlbnRzLmZpbHRlcigoc3R1ZGVudCkgPT4gcmVjSWRzLmluZGV4T2Yoc3R1ZGVudC5pZCkgPCAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzdHVkZW50IG9mIHN0dWRlbnRzKSBuZXdDbGFzcy5zdHVkZW50cy5wdXNoKHN0dWRlbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHJjIG9mIGNsYXNzZXNHcmlkLnJlY29yZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmMxID0gPENsYXNzRGF0YT5yYztcclxuICAgICAgICAgICAgICAgICAgICByYzEuc3R1ZGVudHMgPSB0aGlzLmFsbENsYXNzZXNMaXN0LmZpbmQoKGNsKSA9PiBjbC5pZCA9PSByYzEuaWQpLnN0dWRlbnRzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY2xhc3Nlc0dyaWQucmVmcmVzaCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQudXBkYXRlU3R1ZGVudFRhYmxlVG9TZWxlY3RlZENsYXNzZXMoKTtcclxuXHJcbiAgICAgICAgICAgIH0sIChtZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIHcyYWxlcnQoXCJGZWhsZXIgYmVpbSB2ZXJzZXR6ZW4gZGVyIFNjaMO8bGVyOiBcIiArIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfSwgdGhpcy5hbGxDbGFzc2VzTGlzdCk7XHJcblxyXG5cclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjaGFuZ2VQYXNzd29yZChyZWNJZHM6IG51bWJlcltdID0gW10pIHtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG5cclxuICAgICAgICBsZXQgc3R1ZGVudEdyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLnN0dWRlbnRHcmlkTmFtZV07XHJcblxyXG5cclxuICAgICAgICBpZiAocmVjSWRzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICByZWNJZHMgPSA8YW55PnN0dWRlbnRHcmlkLmdldFNlbGVjdGlvbigpLm1hcCgoc3RyKSA9PiBzdHIucmVjaWQpLmZpbHRlcigodmFsdWUsIGluZGV4LCBhcnJheSkgPT4gYXJyYXkuaW5kZXhPZih2YWx1ZSkgPT09IGluZGV4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChyZWNJZHMubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgc3R1ZGVudEdyaWQuZXJyb3IoXCJadW0gw4RuZGVybiBlaW5lcyBQYXNzd29ydHMgbXVzcyBnZW5hdSBlaW4gU2Now7xsZXIgYXVzZ2V3w6RobHQgd2VyZGVuLlwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgc3R1ZGVudDogVXNlckRhdGEgPSA8VXNlckRhdGE+c3R1ZGVudEdyaWQuZ2V0KHJlY0lkc1swXSArIFwiXCIsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBwYXNzd29yZEZvcjogc3RyaW5nID0gc3R1ZGVudC5ydWZuYW1lICsgXCIgXCIgKyBzdHVkZW50LmZhbWlsaWVubmFtZSArIFwiIChcIiArIHN0dWRlbnQudXNlcm5hbWUgKyBcIilcIjtcclxuICAgICAgICAgICAgUGFzc3dvcmRQb3B1cC5vcGVuKHBhc3N3b3JkRm9yLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBzdHVkZW50R3JpZC5zZWFyY2hSZXNldCgpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5wcmVwYXJlUGFzc3dvcmRCdXR0b25zKCk7XHJcbiAgICAgICAgICAgIH0sIChwYXNzd29yZCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIHN0dWRlbnQucGFzc3dvcmQgPSBwYXNzd29yZDtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFVzZXJSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogc3R1ZGVudCxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgdzJ1dGlscy5sb2NrKGpRdWVyeSgnYm9keScpLCBcIkJpdHRlIHdhcnRlbiwgZGFzIEhhc2hlbiA8YnI+IGRlcyBQYXNzd29ydHMga2FubiA8YnI+YmlzIHp1IDEgTWludXRlPGJyPiBkYXVlcm4uLi5cIiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICAgICAgdzJ1dGlscy51bmxvY2soalF1ZXJ5KCdib2R5JykpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB3MmFsZXJ0KCdEYXMgUGFzc3dvcnQgZsO8ciAnICsgc3R1ZGVudC5ydWZuYW1lICsgXCIgXCIgKyBzdHVkZW50LmZhbWlsaWVubmFtZSArIFwiIChcIiArIHN0dWRlbnQudXNlcm5hbWUgKyBcIikgd3VyZGUgZXJmb2xncmVpY2ggZ2XDpG5kZXJ0LlwiKTtcclxuICAgICAgICAgICAgICAgICAgICBzdHVkZW50R3JpZC5zZWFyY2hSZXNldCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQucHJlcGFyZVBhc3N3b3JkQnV0dG9ucygpO1xyXG4gICAgICAgICAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIHcydXRpbHMudW5sb2NrKGpRdWVyeSgnYm9keScpKTtcclxuICAgICAgICAgICAgICAgICAgICB3MmFsZXJ0KCdGZWhsZXIgYmVpbSDDhG5kZXJuIGRlcyBQYXNzd29ydHMhJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R1ZGVudEdyaWQuc2VhcmNoUmVzZXQoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LnByZXBhcmVQYXNzd29yZEJ1dHRvbnMoKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgICAgIC8vIHcycHJvbXB0KHtcclxuICAgICAgICAgICAgLy8gICAgIGxhYmVsOiAnTmV1ZXMgUGFzc3dvcnQnLFxyXG4gICAgICAgICAgICAvLyAgICAgdmFsdWU6ICcnLFxyXG4gICAgICAgICAgICAvLyAgICAgYXR0cnM6ICdzdHlsZT1cIndpZHRoOiAyMDBweFwiIHR5cGU9XCJwYXNzd29yZFwiJyxcclxuICAgICAgICAgICAgLy8gICAgIHRpdGxlOiBcIlBhc3N3b3J0IGbDvHIgXCIgKyBzdHVkZW50LnJ1Zm5hbWUgKyBcIiBcIiArIHN0dWRlbnQuZmFtaWxpZW5uYW1lICsgXCIgKFwiICsgc3R1ZGVudC51c2VybmFtZSArIFwiKVwiLFxyXG4gICAgICAgICAgICAvLyAgICAgb2tfdGV4dDogXCJPS1wiLFxyXG4gICAgICAgICAgICAvLyAgICAgY2FuY2VsX3RleHQ6IFwiQWJicmVjaGVuXCIsXHJcbiAgICAgICAgICAgIC8vICAgICB3aWR0aDogNjAwLFxyXG4gICAgICAgICAgICAvLyAgICAgaGVpZ2h0OiAyMDBcclxuICAgICAgICAgICAgLy8gfSlcclxuICAgICAgICAgICAgLy8gICAgIC5jaGFuZ2UoZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgfSlcclxuICAgICAgICAgICAgLy8gICAgIC5vayhmdW5jdGlvbiAocGFzc3dvcmQpIHtcclxuICAgICAgICAgICAgLy8gICAgICAgICBzdHVkZW50LnBhc3N3b3JkID0gcGFzc3dvcmQ7XHJcblxyXG4gICAgICAgICAgICAvLyAgICAgICAgIGxldCByZXF1ZXN0OiBDUlVEVXNlclJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHR5cGU6IFwidXBkYXRlXCIsXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGRhdGE6IHN0dWRlbnQsXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gICAgICAgICBhamF4KFwiQ1JVRFVzZXJcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHcyYWxlcnQoJ0RhcyBQYXNzd29ydCBmw7xyICcgKyBzdHVkZW50LnJ1Zm5hbWUgKyBcIiBcIiArIHN0dWRlbnQuZmFtaWxpZW5uYW1lICsgXCIgKFwiICsgc3R1ZGVudC51c2VybmFtZSArIFwiKSB3dXJkZSBlcmZvbGdyZWljaCBnZcOkbmRlcnQuXCIpO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBzdHVkZW50R3JpZC5zZWFyY2hSZXNldCgpO1xyXG4gICAgICAgICAgICAvLyAgICAgICAgICAgICB0aGF0LnByZXBhcmVQYXNzd29yZEJ1dHRvbnMoKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIHcyYWxlcnQoJ0ZlaGxlciBiZWltIMOEbmRlcm4gZGVzIFBhc3N3b3J0cyEnKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgc3R1ZGVudEdyaWQuc2VhcmNoUmVzZXQoKTtcclxuICAgICAgICAgICAgLy8gICAgICAgICAgICAgdGhhdC5wcmVwYXJlUGFzc3dvcmRCdXR0b25zKCk7XHJcbiAgICAgICAgICAgIC8vICAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8gICAgIH0pXHJcblxyXG5cclxuICAgICAgICAgICAgLy8gLmNhbmNlbChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIC8vICAgICBzdHVkZW50R3JpZC5zZWFyY2hSZXNldCgpO1xyXG4gICAgICAgICAgICAvLyAgICAgdGhhdC5wcmVwYXJlUGFzc3dvcmRCdXR0b25zKCk7XHJcbiAgICAgICAgICAgIC8vIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8galF1ZXJ5KCcjdzJ1aS1wb3B1cCAjdzJwcm9tcHQnKS5hdHRyKFwidHlwZVwiLCBcInBhc3N3b3JkXCIpOyAgICAgICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uRGVsZXRlQ2xhc3MoZXZlbnQ6IGFueSkge1xyXG4gICAgICAgIGlmICghZXZlbnQuZm9yY2UgfHwgZXZlbnQuaXNTdG9wcGVkKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCByZWNJZHM6IG51bWJlcltdO1xyXG5cclxuICAgICAgICBsZXQgY2xhc3Nlc0dyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLmNsYXNzZXNHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHJlY0lkcyA9IDxhbnk+Y2xhc3Nlc0dyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICBsZXQgc2VsZWN0ZWRDbGFzc2VzOiBDbGFzc0RhdGFbXSA9IDxDbGFzc0RhdGFbXT5jbGFzc2VzR3JpZC5yZWNvcmRzLmZpbHRlcihcclxuICAgICAgICAgICAgKGNkOiBDbGFzc0RhdGEpID0+IHJlY0lkcy5pbmRleE9mKGNkLmlkKSA+PSAwKTtcclxuXHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDUlVEQ2xhc3NSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRlbGV0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxyXG4gICAgICAgICAgICBpZHM6IHJlY0lkcyxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEQ2xhc3NcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgcmVjSWRzLmZvckVhY2goaWQgPT4gY2xhc3Nlc0dyaWQucmVtb3ZlKFwiXCIgKyBpZCkpO1xyXG4gICAgICAgICAgICBjbGFzc2VzR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSwgKCkgPT4ge1xyXG4gICAgICAgICAgICBjbGFzc2VzR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uVXBkYXRlQ2xhc3MoZXZlbnQ6IGFueSkge1xyXG4gICAgICAgIGxldCBjbGFzc2VzR3JpZDogVzJVSS5XMkdyaWQgPSB3MnVpW3RoaXMuY2xhc3Nlc0dyaWROYW1lXTtcclxuXHJcbiAgICAgICAgbGV0IGRhdGE6IENsYXNzRGF0YSA9IDxDbGFzc0RhdGE+Y2xhc3Nlc0dyaWQucmVjb3Jkc1tldmVudC5pbmRleF07XHJcblxyXG4gICAgICAgIGRhdGFbY2xhc3Nlc0dyaWQuY29sdW1uc1tldmVudC5jb2x1bW5dW1wiZmllbGRcIl1dID0gZXZlbnQudmFsdWVfbmV3O1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRENsYXNzUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJ1cGRhdGVcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEQ2xhc3NcIiwgcmVxdWVzdCwgKHJlc3BvbnNlOiBDUlVEUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coZGF0YSk7XHJcbiAgICAgICAgICAgIGRlbGV0ZSBkYXRhW1widzJ1aVwiXVtcImNoYW5nZXNcIl07XHJcbiAgICAgICAgICAgIGNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRhdGFbY2xhc3Nlc0dyaWQuY29sdW1uc1tldmVudC5jb2x1bW5dW1wiZmllbGRcIl1dID0gZXZlbnQudmFsdWVfb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIGNsYXNzZXNHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBvbkFkZENsYXNzKCkge1xyXG4gICAgICAgIGxldCB1c2VyRGF0YSA9IHRoaXMuYWRtaW5pc3RyYXRpb24udXNlckRhdGE7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDUlVEQ2xhc3NSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImNyZWF0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBpZDogLTEsXHJcbiAgICAgICAgICAgICAgICBzY2h1bGVfaWQ6IHVzZXJEYXRhLnNjaHVsZV9pZCxcclxuICAgICAgICAgICAgICAgIGxlaHJrcmFmdF9pZDogdXNlckRhdGEuaWQsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcIk5hbWUgZGVyIEtsYXNzZVwiLFxyXG4gICAgICAgICAgICAgICAgc3R1ZGVudHM6IFtdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYWpheChcIkNSVURDbGFzc1wiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgY2xhc3Nlc0dyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLmNsYXNzZXNHcmlkTmFtZV07XHJcbiAgICAgICAgICAgIGxldCBjZDogQ2xhc3NEYXRhID0gcmVxdWVzdC5kYXRhO1xyXG4gICAgICAgICAgICBjZC5pZCA9IHJlc3BvbnNlLmlkO1xyXG4gICAgICAgICAgICBjbGFzc2VzR3JpZC5hZGQoY2QpO1xyXG4gICAgICAgICAgICBjbGFzc2VzR3JpZC5lZGl0RmllbGQoY2QuaWQgKyBcIlwiLCAxLCB1bmRlZmluZWQsIHsga2V5Q29kZTogMTMgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdFRleHRJbkNlbGwoKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgb25TZWxlY3RDbGFzcyhldmVudDogYW55KSB7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgZXZlbnQuZG9uZSgoKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQudXBkYXRlU3R1ZGVudFRhYmxlVG9TZWxlY3RlZENsYXNzZXMoKTtcclxuICAgICAgICAgICAgdGhhdC5wcmVwYXJlUGFzc3dvcmRCdXR0b25zKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByZXBhcmVQYXNzd29yZEJ1dHRvbnMoKSB7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBqUXVlcnkoJy5wd19idXR0b24nKS5vZmYoJ2NsaWNrJyk7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnLnB3X2J1dHRvbicpLm9uKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVjaWQgPSBqUXVlcnkoZS50YXJnZXQpLmRhdGEoJ3JlY2lkJyk7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5jaGFuZ2VQYXNzd29yZChbcmVjaWRdKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSwgMTUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgdXBkYXRlU3R1ZGVudFRhYmxlVG9TZWxlY3RlZENsYXNzZXMoKSB7XHJcbiAgICAgICAgbGV0IHJlY0lkczogbnVtYmVyW107XHJcblxyXG4gICAgICAgIGxldCBjbGFzc2VzR3JpZDogVzJVSS5XMkdyaWQgPSB3MnVpW3RoaXMuY2xhc3Nlc0dyaWROYW1lXTtcclxuXHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgcmVjSWRzID0gPGFueT5jbGFzc2VzR3JpZC5nZXRTZWxlY3Rpb24oKS5tYXAoKHN0cikgPT4gc3RyLnJlY2lkKS5maWx0ZXIoKHZhbHVlLCBpbmRleCwgYXJyYXkpID0+IGFycmF5LmluZGV4T2YodmFsdWUpID09PSBpbmRleCk7XHJcblxyXG4gICAgICAgIGxldCBzZWxlY3RlZENsYXNzZXM6IENsYXNzRGF0YVtdID0gdGhpcy5hbGxDbGFzc2VzTGlzdC5maWx0ZXIoXHJcbiAgICAgICAgICAgIChjZDogQ2xhc3NEYXRhKSA9PiByZWNJZHMuaW5kZXhPZihjZC5pZCkgPj0gMCk7XHJcblxyXG4gICAgICAgIGxldCBzdHVkZW50c0dyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLnN0dWRlbnRHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIGxldCBzdHVkZW50TGlzdDogVXNlckRhdGFbXSA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjZCBvZiBzZWxlY3RlZENsYXNzZXMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgc2Qgb2YgY2Quc3R1ZGVudHMpIHtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgc2Qua2xhc3NlID0gY2QubmFtZTtcclxuICAgICAgICAgICAgICAgIHN0dWRlbnRMaXN0LnB1c2goc2QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBzdHVkZW50c0dyaWQucmVjb3JkcyA9IHN0dWRlbnRMaXN0O1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICBzdHVkZW50c0dyaWQuY2xlYXIoKTtcclxuICAgICAgICAgICAgc3R1ZGVudHNHcmlkLmFkZChzdHVkZW50TGlzdCk7XHJcbiAgICAgICAgICAgIHN0dWRlbnRzR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIHRoaXMub25TZWxlY3RTdHVkZW50KG51bGwpO1xyXG4gICAgICAgIH0sIDIwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbG9hZENsYXNzRGF0YUxpc3QoY2FsbGJhY2s6ICgpID0+IHZvaWQpIHtcclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IEdldENsYXNzZXNEYXRhUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgc2Nob29sX2lkOiB0aGlzLmFkbWluaXN0cmF0aW9uLnVzZXJEYXRhLnNjaHVsZV9pZFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgYWpheCgnZ2V0Q2xhc3Nlc0RhdGEnLCByZXF1ZXN0LCAocmVzcG9uc2U6IEdldENsYXNzZXNEYXRhUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5hbGxDbGFzc2VzTGlzdCA9IHJlc3BvbnNlLmNsYXNzRGF0YUxpc3Q7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGNkIG9mIHRoaXMuYWxsQ2xhc3Nlc0xpc3QpIHtcclxuICAgICAgICAgICAgICAgIGNkLnRleHQgPSBjZC5uYW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBsb2FkVGFibGVzKCkge1xyXG4gICAgICAgIGxldCBjbGFzc2VzVGFibGUgPSB3MnVpW3RoaXMuY2xhc3Nlc0dyaWROYW1lXTtcclxuICAgICAgICBjbGFzc2VzVGFibGUuY2xlYXIoKTtcclxuXHJcbiAgICAgICAgY2xhc3Nlc1RhYmxlLmFkZCh0aGlzLmFsbENsYXNzZXNMaXN0KTtcclxuICAgICAgICBjbGFzc2VzVGFibGUucmVmcmVzaCgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uRGVsZXRlU3R1ZGVudChldmVudDogYW55KSB7XHJcbiAgICAgICAgaWYgKCFldmVudC5mb3JjZSB8fCBldmVudC5pc1N0b3BwZWQpIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHJlY0lkczogbnVtYmVyW107XHJcblxyXG4gICAgICAgIGxldCBzdHVkZW50R3JpZDogVzJVSS5XMkdyaWQgPSB3MnVpW3RoaXMuc3R1ZGVudEdyaWROYW1lXTtcclxuICAgICAgICBsZXQgY2xhc3Nlc0dyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLmNsYXNzZXNHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHJlY0lkcyA9IDxhbnk+c3R1ZGVudEdyaWQuZ2V0U2VsZWN0aW9uKCkubWFwKChzdHIpID0+IHN0ci5yZWNpZCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpO1xyXG5cclxuICAgICAgICBsZXQgcmVxdWVzdDogQ1JVRFVzZXJSZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB0eXBlOiBcImRlbGV0ZVwiLFxyXG4gICAgICAgICAgICBkYXRhOiBudWxsLFxyXG4gICAgICAgICAgICBpZHM6IHJlY0lkcyxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgYWpheChcIkNSVURVc2VyXCIsIHJlcXVlc3QsIChyZXNwb25zZTogQ1JVRFJlc3BvbnNlKSA9PiB7XHJcbiAgICAgICAgICAgIHJlY0lkcy5mb3JFYWNoKGlkID0+IHN0dWRlbnRHcmlkLnJlbW92ZShcIlwiICsgaWQpKTtcclxuICAgICAgICAgICAgdGhpcy5hbGxDbGFzc2VzTGlzdC5mb3JFYWNoKGtsYXNzID0+IHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwga2xhc3Muc3R1ZGVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3R1ZGVudCA9IGtsYXNzLnN0dWRlbnRzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWNJZHMuaW5kZXhPZihzdHVkZW50LmlkKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtsYXNzLnN0dWRlbnRzLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaS0tO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgIHN0dWRlbnRHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICAgICAgY2xhc3Nlc0dyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgIH0sIChtZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgdzJhbGVydCgnRmVobGVyIGJlaW0gTMO2c2NoZW4gZGVyIFNjaMO8bGVyOiAnICsgbWVzc2FnZSk7XHJcbiAgICAgICAgICAgIHN0dWRlbnRHcmlkLnJlZnJlc2goKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgb25VcGRhdGVTdHVkZW50KGV2ZW50OiBhbnkpIHtcclxuICAgICAgICBsZXQgc3R1ZGVudEdyaWQ6IFcyVUkuVzJHcmlkID0gdzJ1aVt0aGlzLnN0dWRlbnRHcmlkTmFtZV07XHJcblxyXG4gICAgICAgIGxldCBkYXRhOiBVc2VyRGF0YSA9IDxVc2VyRGF0YT5zdHVkZW50R3JpZC5yZWNvcmRzW2V2ZW50LmluZGV4XTtcclxuXHJcbiAgICAgICAgbGV0IHZhbHVlX25ld19wcmVzZW50ZWQgPSBldmVudC52YWx1ZV9uZXc7XHJcbiAgICAgICAgbGV0IHZhbHVlX29sZF9kYXRhYmFzZTogbnVtYmVyID0gZGF0YS5rbGFzc2VfaWQ7XHJcblxyXG4gICAgICAgIGlmIChldmVudC5jb2x1bW4gPT0gMSkge1xyXG4gICAgICAgICAgICBsZXQgY2xhc3NEYXRhOiBDbGFzc0RhdGEgPSBldmVudC52YWx1ZV9uZXc7XHJcbiAgICAgICAgICAgIHZhbHVlX25ld19wcmVzZW50ZWQgPSBjbGFzc0RhdGEubmFtZTtcclxuICAgICAgICAgICAgZGF0YS5rbGFzc2VfaWQgPSBldmVudC52YWx1ZV9uZXcuaWQ7XHJcbiAgICAgICAgICAgIGlmIChldmVudC52YWx1ZV9uZXcuaWQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZGF0YVtzdHVkZW50R3JpZC5jb2x1bW5zW2V2ZW50LmNvbHVtbl1bXCJmaWVsZFwiXV0gPSB2YWx1ZV9uZXdfcHJlc2VudGVkO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHJlcXVlc3Q6IENSVURVc2VyUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgdHlwZTogXCJ1cGRhdGVcIixcclxuICAgICAgICAgICAgZGF0YTogZGF0YSxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEVXNlclwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhkYXRhKTtcclxuICAgICAgICAgICAgZm9yIChsZXQga2V5IGluIGRhdGFbXCJ3MnVpXCJdW1wiY2hhbmdlc1wiXSkge1xyXG4gICAgICAgICAgICAgICAgZGVsZXRlIGRhdGFbXCJ3MnVpXCJdW1wiY2hhbmdlc1wiXVtrZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAvLyBzdHVkZW50R3JpZC5sYXN0LmluRWRpdE1vZGUgPSBmYWxzZTtcclxuICAgICAgICB9LCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGRhdGFbc3R1ZGVudEdyaWQuY29sdW1uc1tldmVudC5jb2x1bW5dW1wiZmllbGRcIl1dID0gZXZlbnQudmFsdWVfb3JpZ2luYWw7XHJcbiAgICAgICAgICAgIGRhdGEua2xhc3NlX2lkID0gdmFsdWVfb2xkX2RhdGFiYXNlO1xyXG4gICAgICAgICAgICAvLyBzdHVkZW50R3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uQWRkU3R1ZGVudCgpIHtcclxuICAgICAgICBsZXQgdXNlckRhdGEgPSB0aGlzLmFkbWluaXN0cmF0aW9uLnVzZXJEYXRhO1xyXG4gICAgICAgIGxldCBzdHVkZW50R3JpZDogVzJVSS5XMkdyaWQgPSB3MnVpW3RoaXMuc3R1ZGVudEdyaWROYW1lXTtcclxuXHJcbiAgICAgICAgbGV0IGNsYXNzZXNHcmlkOiBXMlVJLlcyR3JpZCA9IHcydWlbdGhpcy5jbGFzc2VzR3JpZE5hbWVdO1xyXG4gICAgICAgIGxldCBzZWxlY3RlZENsYXNzZXMgPSA8bnVtYmVyW10+Y2xhc3Nlc0dyaWQuZ2V0U2VsZWN0aW9uKCkuZmlsdGVyKCh2YWx1ZSwgaW5kZXgsIGFycmF5KSA9PiBhcnJheS5pbmRleE9mKHZhbHVlKSA9PT0gaW5kZXgpLm1hcChjbCA9PiAoPGFueT5jbCkucmVjaWQpO1xyXG4gICAgICAgIGlmIChzZWxlY3RlZENsYXNzZXMubGVuZ3RoICE9IDEpIHtcclxuICAgICAgICAgICAgc3R1ZGVudEdyaWQuZXJyb3IoXCJXZW5uIFNpZSBTY2jDvGxlciBoaW56dWbDvGdlbiBtw7ZjaHRlbiBtdXNzIGxpbmtzIGdlbmF1IGVpbmUgS2xhc3NlIGF1c2dld8OkaGx0IHNlaW4uXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjbGFzc0lkID0gc2VsZWN0ZWRDbGFzc2VzWzBdO1xyXG4gICAgICAgIGxldCBrbGFzcyA9IDxDbGFzc0RhdGE+Y2xhc3Nlc0dyaWQuZ2V0KFwiXCIgKyBjbGFzc0lkLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIGxldCByZXF1ZXN0OiBDUlVEVXNlclJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgIHR5cGU6IFwiY3JlYXRlXCIsXHJcbiAgICAgICAgICAgIGRhdGE6IHtcclxuICAgICAgICAgICAgICAgIGlkOiAtMSxcclxuICAgICAgICAgICAgICAgIHNjaHVsZV9pZDogdXNlckRhdGEuc2NodWxlX2lkLFxyXG4gICAgICAgICAgICAgICAga2xhc3NlX2lkOiBjbGFzc0lkLFxyXG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IFwiQmVudXR6ZXJuYW1lXCIgKyBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiAxMDAwMDAwMCksXHJcbiAgICAgICAgICAgICAgICBydWZuYW1lOiBcIlJ1Zm5hbWVcIixcclxuICAgICAgICAgICAgICAgIGZhbWlsaWVubmFtZTogXCJGYW1pbGllbm5hbWVcIixcclxuICAgICAgICAgICAgICAgIGlzX2FkbWluOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzX3NjaG9vbGFkbWluOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIGlzX3RlYWNoZXI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIDEwMDAwMDAwKSArIFwieFwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgdzJ1dGlscy5sb2NrKGpRdWVyeSgnYm9keScpLCBcIkJpdHRlIHdhcnRlbiwgZGFzIEhhc2hlbiA8YnI+IGRlcyBQYXNzd29ydHMga2FubiA8YnI+YmlzIHp1IDEgTWludXRlPGJyPiBkYXVlcm4uLi5cIiwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGFqYXgoXCJDUlVEVXNlclwiLCByZXF1ZXN0LCAocmVzcG9uc2U6IENSVURSZXNwb25zZSkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdWQ6IFVzZXJEYXRhID0gcmVxdWVzdC5kYXRhO1xyXG4gICAgICAgICAgICB1ZC5pZCA9IHJlc3BvbnNlLmlkO1xyXG4gICAgICAgICAgICB1ZFtcImtsYXNzZVwiXSA9IGtsYXNzLm5hbWU7XHJcbiAgICAgICAgICAgIHN0dWRlbnRHcmlkLmFkZCh1ZCk7XHJcbiAgICAgICAgICAgIHN0dWRlbnRHcmlkLmVkaXRGaWVsZCh1ZC5pZCArIFwiXCIsIDIsIHVuZGVmaW5lZCwgeyBrZXlDb2RlOiAxMyB9KTtcclxuICAgICAgICAgICAga2xhc3Muc3R1ZGVudHMucHVzaCh1ZCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnNlbGVjdFRleHRJbkNlbGwoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMucHJlcGFyZVBhc3N3b3JkQnV0dG9ucygpO1xyXG4gICAgICAgICAgICBjbGFzc2VzR3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcclxuICAgICAgICAgICAgdzJ1dGlscy51bmxvY2soalF1ZXJ5KCdib2R5JykpO1xyXG5cclxuICAgICAgICB9LCAoZXJyb3JtZXNzYWdlKSA9PiB7XHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICB3MnV0aWxzLnVubG9jayhqUXVlcnkoJ2JvZHknKSk7XHJcbiAgICAgICAgICAgIHcyYWxlcnQoXCJCZWltIEFubGVnZW4gZGVzIEJlbnV0emVycyBpc3QgZWluIEZlaGxlciBhdWZnZXRyZXRlbjogXCIgKyBlcnJvcm1lc3NhZ2UpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRDaG9vc2VDbGFzc1BvcHVwKCkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBpZiAoIXcydWkuY2hvb3NlQ2xhc3NGb3JtKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeSgpLncyZm9ybSh7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnY2hvb3NlQ2xhc3NGb3JtJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiAnYm9yZGVyOiAwcHg7IGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50OycsXHJcbiAgICAgICAgICAgICAgICBmb3JtSFRNTDpcclxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIncydWktcGFnZSBwYWdlLTBcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAnICAgIDxkaXYgY2xhc3M9XCJ3MnVpLWZpZWxkXCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgJyAgICAgICAgPGxhYmVsPk5ldWUgS2xhc3NlOjwvbGFiZWw+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgJyAgICAgICAgPGRpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAnICAgICAgICAgICA8aW5wdXQgbmFtZT1cIm5ld0NsYXNzXCIgdHlwZT1cInRleHRcIiBzdHlsZT1cIndpZHRoOiAxNTBweFwiLz4nICtcclxuICAgICAgICAgICAgICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAnICAgIDwvZGl2PicgK1xyXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcclxuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cIncydWktYnV0dG9uc1wiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICcgICAgPGJ1dHRvbiBjbGFzcz1cIncydWktYnRuXCIgbmFtZT1cImNhbmNlbFwiPkFiYnJlY2hlbjwvYnV0dG9uPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICcgICAgPGJ1dHRvbiBjbGFzcz1cIncydWktYnRuXCIgbmFtZT1cIk9LXCI+T0s8L2J1dHRvbj4nICtcclxuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyxcclxuICAgICAgICAgICAgICAgIGZpZWxkczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICduZXdDbGFzcycsIHR5cGU6ICdsaXN0JywgcmVxdWlyZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHsgaXRlbXM6IFtdIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHJlY29yZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIG5ld0NsYXNzOiAnSm9obicsXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY2FuY2VsXCI6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdzJwb3B1cC5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJPS1wiOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5teUNhbGxiYWNrKHRoaXMucmVjb3JkLm5ld0NsYXNzKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBvcGVuQ2hvb3NlQ2xhc3NQb3B1cChjYWxsYmFjazogKG5ld0NsYXNzOiBDbGFzc0RhdGEpID0+IHZvaWQsIGNsYXNzTGlzdDogYW55KSB7XHJcblxyXG4gICAgICAgIHcydWlbXCJjaG9vc2VDbGFzc0Zvcm1cIl0ubXlDYWxsYmFjayA9IGNhbGxiYWNrO1xyXG4gICAgICAgIHcydWlbXCJjaG9vc2VDbGFzc0Zvcm1cIl0uZmllbGRzWzBdLm9wdGlvbnMuaXRlbXMgPSBjbGFzc0xpc3Q7XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIGpRdWVyeSgpLncycG9wdXAoJ29wZW4nLCB7XHJcbiAgICAgICAgICAgIHRpdGxlOiAnTmV1ZSBLbGFzc2Ugd8OkaGxlbicsXHJcbiAgICAgICAgICAgIGJvZHk6ICc8ZGl2IGlkPVwiZm9ybVwiIHN0eWxlPVwid2lkdGg6IDEwMCU7IGhlaWdodDogMTAwJTtcIj48L2Rpdj4nLFxyXG4gICAgICAgICAgICBzdHlsZTogJ3BhZGRpbmc6IDE1cHggMHB4IDBweCAwcHgnLFxyXG4gICAgICAgICAgICB3aWR0aDogNTAwLFxyXG4gICAgICAgICAgICBoZWlnaHQ6IDMwMCxcclxuICAgICAgICAgICAgc2hvd01heDogdHJ1ZSxcclxuICAgICAgICAgICAgb25Ub2dnbGU6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KHcydWkuY2hvb3NlQ2xhc3NGb3JtLmJveCkuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgZXZlbnQub25Db21wbGV0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkodzJ1aS5jaG9vc2VDbGFzc0Zvcm0uYm94KS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdzJ1aS5jaG9vc2VDbGFzc0Zvcm0ucmVzaXplKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG9uT3BlbjogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5vbkNvbXBsZXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNwZWNpZnlpbmcgYW4gb25PcGVuIGhhbmRsZXIgaW5zdGVhZCBpcyBlcXVpdmFsZW50IHRvIHNwZWNpZnlpbmcgYW4gb25CZWZvcmVPcGVuIGhhbmRsZXIsIHdoaWNoIHdvdWxkIG1ha2UgdGhpcyBjb2RlIGV4ZWN1dGUgdG9vIGVhcmx5IGFuZCBoZW5jZSBub3QgZGVsaXZlci5cclxuICAgICAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyN3MnVpLXBvcHVwICNmb3JtJykudzJyZW5kZXIoJ2Nob29zZUNsYXNzRm9ybScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG59Il19