export class DistributeToStudentsDialog {
    constructor(classes, workspace, main) {
        this.classes = classes;
        this.workspace = workspace;
        this.main = main;
        this.studentCount = 0;
        this.init();
    }
    init() {
        this.$dialog = jQuery('#dialog');
        jQuery('#main').css('visibility', 'hidden');
        this.$dialog.append(jQuery(`<div class="jo_ds_heading">Austeilen eines Workspace an einzelne Schüler/innen</div>
             <div class="jo_ds_settings">
                <div class="jo_ds_settings_caption">Workspace:</div><div class="jo_ds_workspacename">${this.workspace.name}</div>
                <div class="jo_ds_settings_caption">Liste filtern:</div><div class="jo_ds_filterdiv"><input class="dialog-input"></input></div>
             </div>
             <div class="jo_ds_student_list jo_scrollable">
             </div>
             <div class="jo_ds_selected_message"></div>
             <div class="dialog-buttonRow jo_ds_buttonRow">
                <button id="jo_ds_cancel_button">Abbrechen</button>
                <button id="jo_ds_distribute_button">Austeilen</button>
             </div>
            `));
        let $studentList = jQuery('.jo_ds_student_list');
        let that = this;
        for (let klass of this.classes) {
            for (let student of klass.students) {
                let $studentLine = jQuery('<div class="jo_ds_student_line">');
                let $studentClass = jQuery(`<div class="jo_ds_student_class">${klass.name}</div>`);
                let $studentName = jQuery(`<div class="jo_ds_student_name">${student.rufname} ${student.familienname}</div>`);
                $studentLine.append($studentClass, $studentName);
                $studentList.append($studentLine);
                $studentLine.on('mousedown', () => {
                    $studentLine.toggleClass('jo_active');
                    that.studentCount += $studentLine.hasClass('jo_active') ? 1 : -1;
                    jQuery('.jo_ds_selected_message').text(`${that.studentCount} Schüler/inn/en selektiert`);
                });
                $studentLine.data('student', student);
                $studentLine.data('klass', klass);
            }
        }
        jQuery('.jo_ds_filterdiv>input').on('input', () => {
            let filterText = jQuery('.jo_ds_filterdiv>input').val();
            if (filterText == null || filterText == "") {
                $('.jo_ds_student_line').show();
            }
            else {
                $('.jo_ds_student_line').each((index, element) => {
                    let $element = jQuery(element);
                    let klass = $element.data('klass');
                    let student = $element.data('student');
                    let text = klass.name + " " + student.rufname + " " + student.familienname;
                    if (text.indexOf(filterText) >= 0) {
                        $element.show();
                    }
                    else {
                        $element.hide();
                    }
                });
            }
        });
        this.$dialogMain = this.$dialog.find('.dialog-main');
        this.$dialog.css('visibility', 'visible');
        jQuery('#jo_ds_cancel_button').on('click', () => { window.history.back(); });
        jQuery('#jo_ds_distribute_button').on('click', () => { that.distributeWorkspace(); });
        this.main.windowStateManager.registerOneTimeBackButtonListener(() => {
            that.close();
        });
    }
    distributeWorkspace() {
        let student_ids = [];
        $('.jo_ds_student_line').each((index, element) => {
            let $element = jQuery(element);
            if ($element.hasClass('jo_active')) {
                let student = $element.data('student');
                student_ids.push(student.id);
            }
        });
        window.history.back();
        this.main.networkManager.sendDistributeWorkspace(this.workspace, null, student_ids, (error) => {
            if (error == null) {
                let networkManager = this.main.networkManager;
                let dt = networkManager.updateFrequencyInSeconds * networkManager.forcedUpdateEvery;
                alert(`Der Workspace ${this.workspace.name} wurde an ${student_ids.length} Schüler/innen ausgeteilt. Er wird in maximal ${dt} s bei jedem Schüler ankommen.`);
            }
            else {
                alert(error);
            }
        });
    }
    close() {
        this.$dialog.css('visibility', 'hidden');
        this.$dialog.empty();
        jQuery('#main').css('visibility', 'visible');
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGlzdHJpYnV0ZVRvU3R1ZGVudHNEaWFsb2cuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL0Rpc3RyaWJ1dGVUb1N0dWRlbnRzRGlhbG9nLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBLE1BQU0sT0FBTywwQkFBMEI7SUFNbkMsWUFBb0IsT0FBb0IsRUFBVSxTQUFvQixFQUFVLElBQVU7UUFBdEUsWUFBTyxHQUFQLE9BQU8sQ0FBYTtRQUFVLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFNO1FBRjFGLGlCQUFZLEdBQVcsQ0FBQyxDQUFDO1FBR3JCLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNoQixDQUFDO0lBRU8sSUFBSTtRQUNSLElBQUksQ0FBQyxPQUFPLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ2pDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzVDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FDdEI7O3VHQUUyRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUk7Ozs7Ozs7Ozs7YUFVN0csQ0FDSixDQUFDLENBQUM7UUFFSCxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMscUJBQXFCLENBQUMsQ0FBQztRQUNqRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFFaEIsS0FBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsT0FBTyxFQUFDO1lBQzFCLEtBQUksSUFBSSxPQUFPLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBQztnQkFDOUIsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLGtDQUFrQyxDQUFDLENBQUM7Z0JBQzlELElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxvQ0FBb0MsS0FBSyxDQUFDLElBQUksUUFBUSxDQUFDLENBQUM7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LENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDakQsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2xhc3NEYXRhLCBVc2VyRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uLy4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IGlzRW1wdHlPYmplY3QgfSBmcm9tIFwianF1ZXJ5XCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGlzdHJpYnV0ZVRvU3R1ZGVudHNEaWFsb2cge1xyXG5cclxuICAgICRkaWFsb2c6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkZGlhbG9nTWFpbjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIHN0dWRlbnRDb3VudDogbnVtYmVyID0gMDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGNsYXNzZXM6IENsYXNzRGF0YVtdLCBwcml2YXRlIHdvcmtzcGFjZTogV29ya3NwYWNlLCBwcml2YXRlIG1haW46IE1haW4pe1xyXG4gICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgaW5pdCgpIHtcclxuICAgICAgICB0aGlzLiRkaWFsb2cgPSBqUXVlcnkoJyNkaWFsb2cnKTtcclxuICAgICAgICBqUXVlcnkoJyNtYWluJykuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpO1xyXG4gICAgICAgIHRoaXMuJGRpYWxvZy5hcHBlbmQoalF1ZXJ5KFxyXG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cImpvX2RzX2hlYWRpbmdcIj5BdXN0ZWlsZW4gZWluZXMgV29ya3NwYWNlIGFuIGVpbnplbG5lIFNjaMO8bGVyL2lubmVuPC9kaXY+XHJcbiAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fZHNfc2V0dGluZ3NcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19kc19zZXR0aW5nc19jYXB0aW9uXCI+V29ya3NwYWNlOjwvZGl2PjxkaXYgY2xhc3M9XCJqb19kc193b3Jrc3BhY2VuYW1lXCI+JHt0aGlzLndvcmtzcGFjZS5uYW1lfTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2RzX3NldHRpbmdzX2NhcHRpb25cIj5MaXN0ZSBmaWx0ZXJuOjwvZGl2PjxkaXYgY2xhc3M9XCJqb19kc19maWx0ZXJkaXZcIj48aW5wdXQgY2xhc3M9XCJkaWFsb2ctaW5wdXRcIj48L2lucHV0PjwvZGl2PlxyXG4gICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fZHNfc3R1ZGVudF9saXN0IGpvX3Njcm9sbGFibGVcIj5cclxuICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2RzX3NlbGVjdGVkX21lc3NhZ2VcIj48L2Rpdj5cclxuICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJkaWFsb2ctYnV0dG9uUm93IGpvX2RzX2J1dHRvblJvd1wiPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBpZD1cImpvX2RzX2NhbmNlbF9idXR0b25cIj5BYmJyZWNoZW48L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgIDxidXR0b24gaWQ9XCJqb19kc19kaXN0cmlidXRlX2J1dHRvblwiPkF1c3RlaWxlbjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIGBcclxuICAgICAgICApKTtcclxuXHJcbiAgICAgICAgbGV0ICRzdHVkZW50TGlzdCA9IGpRdWVyeSgnLmpvX2RzX3N0dWRlbnRfbGlzdCcpO1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgZm9yKGxldCBrbGFzcyBvZiB0aGlzLmNsYXNzZXMpe1xyXG4gICAgICAgICAgICBmb3IobGV0IHN0dWRlbnQgb2Yga2xhc3Muc3R1ZGVudHMpe1xyXG4gICAgICAgICAgICAgICAgbGV0ICRzdHVkZW50TGluZSA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2RzX3N0dWRlbnRfbGluZVwiPicpO1xyXG4gICAgICAgICAgICAgICAgbGV0ICRzdHVkZW50Q2xhc3MgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19kc19zdHVkZW50X2NsYXNzXCI+JHtrbGFzcy5uYW1lfTwvZGl2PmApOyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGxldCAkc3R1ZGVudE5hbWUgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19kc19zdHVkZW50X25hbWVcIj4ke3N0dWRlbnQucnVmbmFtZX0gJHtzdHVkZW50LmZhbWlsaWVubmFtZX08L2Rpdj5gKTtcclxuICAgICAgICAgICAgICAgICRzdHVkZW50TGluZS5hcHBlbmQoJHN0dWRlbnRDbGFzcywgJHN0dWRlbnROYW1lKTtcclxuICAgICAgICAgICAgICAgICRzdHVkZW50TGlzdC5hcHBlbmQoJHN0dWRlbnRMaW5lKTtcclxuICAgICAgICAgICAgICAgICRzdHVkZW50TGluZS5vbignbW91c2Vkb3duJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICRzdHVkZW50TGluZS50b2dnbGVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgIHRoYXQuc3R1ZGVudENvdW50ICs9ICRzdHVkZW50TGluZS5oYXNDbGFzcygnam9fYWN0aXZlJykgPyAxIDogLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnLmpvX2RzX3NlbGVjdGVkX21lc3NhZ2UnKS50ZXh0KGAke3RoYXQuc3R1ZGVudENvdW50fSBTY2jDvGxlci9pbm4vZW4gc2VsZWt0aWVydGApO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAkc3R1ZGVudExpbmUuZGF0YSgnc3R1ZGVudCcsIHN0dWRlbnQpO1xyXG4gICAgICAgICAgICAgICAgJHN0dWRlbnRMaW5lLmRhdGEoJ2tsYXNzJywga2xhc3MpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqUXVlcnkoJy5qb19kc19maWx0ZXJkaXY+aW5wdXQnKS5vbignaW5wdXQnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBmaWx0ZXJUZXh0ID0gPHN0cmluZz5qUXVlcnkoJy5qb19kc19maWx0ZXJkaXY+aW5wdXQnKS52YWwoKTtcclxuICAgICAgICAgICAgaWYoZmlsdGVyVGV4dCA9PSBudWxsIHx8IGZpbHRlclRleHQgPT0gXCJcIil7XHJcbiAgICAgICAgICAgICAgICAkKCcuam9fZHNfc3R1ZGVudF9saW5lJykuc2hvdygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJCgnLmpvX2RzX3N0dWRlbnRfbGluZScpLmVhY2goKGluZGV4LCBlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0ICRlbGVtZW50ID0galF1ZXJ5KGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBrbGFzczpDbGFzc0RhdGEgPSAkZWxlbWVudC5kYXRhKCdrbGFzcycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBzdHVkZW50OiBVc2VyRGF0YSA9ICRlbGVtZW50LmRhdGEoJ3N0dWRlbnQnKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IGtsYXNzLm5hbWUgKyBcIiBcIiArIHN0dWRlbnQucnVmbmFtZSArIFwiIFwiICsgc3R1ZGVudC5mYW1pbGllbm5hbWU7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYodGV4dC5pbmRleE9mKGZpbHRlclRleHQpID49IDApe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkZWxlbWVudC5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuJGRpYWxvZ01haW4gPSB0aGlzLiRkaWFsb2cuZmluZCgnLmRpYWxvZy1tYWluJyk7XHJcbiAgICAgICAgdGhpcy4kZGlhbG9nLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2pvX2RzX2NhbmNlbF9idXR0b24nKS5vbignY2xpY2snLCAoKSA9PiB7IHdpbmRvdy5oaXN0b3J5LmJhY2soKTsgfSk7XHJcbiAgICAgICAgalF1ZXJ5KCcjam9fZHNfZGlzdHJpYnV0ZV9idXR0b24nKS5vbignY2xpY2snLCAoKSA9PiB7dGhhdC5kaXN0cmlidXRlV29ya3NwYWNlKCk7fSk7XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi53aW5kb3dTdGF0ZU1hbmFnZXIucmVnaXN0ZXJPbmVUaW1lQmFja0J1dHRvbkxpc3RlbmVyKCgpID0+IHtcclxuICAgICAgICAgICAgdGhhdC5jbG9zZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkaXN0cmlidXRlV29ya3NwYWNlKCkge1xyXG5cclxuICAgICAgICBsZXQgc3R1ZGVudF9pZHM6IG51bWJlcltdID0gW107XHJcbiAgICAgICAgJCgnLmpvX2RzX3N0dWRlbnRfbGluZScpLmVhY2goKGluZGV4LCBlbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGxldCAkZWxlbWVudCA9IGpRdWVyeShlbGVtZW50KTtcclxuICAgICAgICAgICAgaWYoJGVsZW1lbnQuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKXtcclxuICAgICAgICAgICAgICAgIGxldCBzdHVkZW50OiBVc2VyRGF0YSA9ICRlbGVtZW50LmRhdGEoJ3N0dWRlbnQnKTtcclxuICAgICAgICAgICAgICAgIHN0dWRlbnRfaWRzLnB1c2goc3R1ZGVudC5pZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgd2luZG93Lmhpc3RvcnkuYmFjaygpO1xyXG5cclxuICAgICAgICB0aGlzLm1haW4ubmV0d29ya01hbmFnZXIuc2VuZERpc3RyaWJ1dGVXb3Jrc3BhY2UodGhpcy53b3Jrc3BhY2UsIG51bGwsIHN0dWRlbnRfaWRzLCAoZXJyb3I6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXJyb3IgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IG5ldHdvcmtNYW5hZ2VyID0gdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyO1xyXG4gICAgICAgICAgICAgICAgbGV0IGR0ID0gbmV0d29ya01hbmFnZXIudXBkYXRlRnJlcXVlbmN5SW5TZWNvbmRzICogbmV0d29ya01hbmFnZXIuZm9yY2VkVXBkYXRlRXZlcnk7XHJcbiAgICAgICAgICAgICAgICBhbGVydChgRGVyIFdvcmtzcGFjZSAke3RoaXMud29ya3NwYWNlLm5hbWV9IHd1cmRlIGFuICR7c3R1ZGVudF9pZHMubGVuZ3RofSBTY2jDvGxlci9pbm5lbiBhdXNnZXRlaWx0LiBFciB3aXJkIGluIG1heGltYWwgJHtkdH0gcyBiZWkgamVkZW0gU2Now7xsZXIgYW5rb21tZW4uYCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhbGVydChlcnJvcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIGNsb3NlKCkge1xyXG4gICAgICAgIHRoaXMuJGRpYWxvZy5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICAgICAgdGhpcy4kZGlhbG9nLmVtcHR5KCk7XHJcbiAgICAgICAgalF1ZXJ5KCcjbWFpbicpLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==