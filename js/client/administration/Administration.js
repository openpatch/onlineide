import { SchoolsWithAdminsMI } from "./SchoolsWithAdminsMI.js";
import { ajax } from "../communication/AjaxHelper.js";
import { TeachersWithClassesMI } from "./TeachersWithClasses.js";
import { ClassesWithStudentsMI } from "./ClassesWithStudentsMI.js";
import { StudentBulkImportMI } from "./StudentBulkImortMI.js";
export class Administration {
    constructor() {
        this.menuItems = [
            new SchoolsWithAdminsMI(this),
            new TeachersWithClassesMI(this),
            new ClassesWithStudentsMI(this),
            new StudentBulkImportMI(this)
        ];
    }
    start() {
        let that = this;
        //@ts-ignore
        w2utils.locale('de-de');
        ajax("getUserData", {}, (response) => {
            that.userData = response.user;
            that.classes = response.classdata;
            this.initMenu();
            jQuery('#schoolName').text(response.schoolName);
        }, (message) => {
            alert(message);
        });
    }
    initMenu() {
        for (let mi of this.menuItems) {
            if (mi.checkPermission(this.userData)) {
                let $button = jQuery('<div class="jo_menuitem">' + mi.getButtonIdentifier() + '</div>');
                jQuery('#menuitems').append($button);
                $button.on('click', () => {
                    jQuery('#main-heading').empty();
                    jQuery('#main-table-left').empty().css("flex-grow", "1");
                    jQuery('#main-table-right').empty().css("flex-grow", "1");
                    this.removeGrid(jQuery('#main-table-left'));
                    this.removeGrid(jQuery('#main-table-right'));
                    jQuery('#main-footer').empty();
                    mi.onMenuButtonPressed(jQuery('#main-heading'), jQuery('#main-table-left'), jQuery('#main-table-right'), jQuery('#main-footer'));
                    jQuery('#menuitems .jo_menuitem').removeClass('jo_active');
                    $button.addClass('jo_active');
                });
            }
        }
        jQuery('#menuitems .jo_menuitem').first().click();
    }
    removeGrid($element) {
        $element.removeClass('w2ui-reset w2ui-grid w2ui-ss');
        $element.css('flex', '');
    }
}
jQuery(() => {
    new Administration().start();
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWRtaW5pc3RyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2FkbWluaXN0cmF0aW9uL0FkbWluaXN0cmF0aW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQy9ELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQUV0RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUNqRSxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUNuRSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUU5RCxNQUFNLE9BQU8sY0FBYztJQUEzQjtRQUVJLGNBQVMsR0FBb0I7WUFDekIsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7WUFDN0IsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7WUFDL0IsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLENBQUM7WUFDL0IsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUM7U0FDaEMsQ0FBQTtJQXNETCxDQUFDO0lBakRHLEtBQUs7UUFDRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsWUFBWTtRQUNaLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFeEIsSUFBSSxDQUFDLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxRQUE2QixFQUFFLEVBQUU7WUFDdEQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUMsSUFBSSxDQUFDO1lBQzlCLElBQUksQ0FBQyxPQUFPLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUNsQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDaEIsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDcEQsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDWCxLQUFLLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkIsQ0FBQyxDQUFDLENBQUM7SUFFUCxDQUFDO0lBRUQsUUFBUTtRQUVKLEtBQUssSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRTtZQUMzQixJQUFJLEVBQUUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNuQyxJQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsMkJBQTJCLEdBQUcsRUFBRSxDQUFDLG1CQUFtQixFQUFFLEdBQUcsUUFBUSxDQUFDLENBQUM7Z0JBQ3hGLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRTtvQkFFckIsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUNoQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN6RCxNQUFNLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUMxRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUM7b0JBQzVDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztvQkFDN0MsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO29CQUUvQixFQUFFLENBQUMsbUJBQW1CLENBQ2xCLE1BQU0sQ0FBQyxlQUFlLENBQUMsRUFBRSxNQUFNLENBQUMsa0JBQWtCLENBQUMsRUFBRSxNQUFNLENBQUMsbUJBQW1CLENBQUMsRUFDaEYsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7b0JBRTVCLE1BQU0sQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsQ0FBQztvQkFDM0QsT0FBTyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDbEMsQ0FBQyxDQUFDLENBQUM7YUFDTjtTQUNKO1FBRUQsTUFBTSxDQUFDLHlCQUF5QixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdEQsQ0FBQztJQUVELFVBQVUsQ0FBQyxRQUE2QjtRQUNwQyxRQUFRLENBQUMsV0FBVyxDQUFDLDhCQUE4QixDQUFDLENBQUM7UUFDckQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUVKO0FBRUQsTUFBTSxDQUFDLEdBQUcsRUFBRTtJQUNSLElBQUksY0FBYyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDakMsQ0FBQyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBZG1pbk1lbnVJdGVtIH0gZnJvbSBcIi4vQWRtaW5NZW51SXRlbS5qc1wiO1xyXG5pbXBvcnQgeyBTY2hvb2xzV2l0aEFkbWluc01JIH0gZnJvbSBcIi4vU2Nob29sc1dpdGhBZG1pbnNNSS5qc1wiO1xyXG5pbXBvcnQgeyBhamF4IH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vQWpheEhlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBHZXRVc2VyRGF0YVJlc3BvbnNlLCBVc2VyRGF0YSwgQ2xhc3NEYXRhIH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBUZWFjaGVyc1dpdGhDbGFzc2VzTUkgfSBmcm9tIFwiLi9UZWFjaGVyc1dpdGhDbGFzc2VzLmpzXCI7XHJcbmltcG9ydCB7IENsYXNzZXNXaXRoU3R1ZGVudHNNSSB9IGZyb20gXCIuL0NsYXNzZXNXaXRoU3R1ZGVudHNNSS5qc1wiO1xyXG5pbXBvcnQgeyBTdHVkZW50QnVsa0ltcG9ydE1JIH0gZnJvbSBcIi4vU3R1ZGVudEJ1bGtJbW9ydE1JLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQWRtaW5pc3RyYXRpb24ge1xyXG5cclxuICAgIG1lbnVJdGVtczogQWRtaW5NZW51SXRlbVtdID0gW1xyXG4gICAgICAgIG5ldyBTY2hvb2xzV2l0aEFkbWluc01JKHRoaXMpLFxyXG4gICAgICAgIG5ldyBUZWFjaGVyc1dpdGhDbGFzc2VzTUkodGhpcyksXHJcbiAgICAgICAgbmV3IENsYXNzZXNXaXRoU3R1ZGVudHNNSSh0aGlzKSxcclxuICAgICAgICBuZXcgU3R1ZGVudEJ1bGtJbXBvcnRNSSh0aGlzKVxyXG4gICAgXVxyXG5cclxuICAgIHVzZXJEYXRhOiBVc2VyRGF0YTtcclxuICAgIGNsYXNzZXM6IENsYXNzRGF0YVtdO1xyXG5cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICB3MnV0aWxzLmxvY2FsZSgnZGUtZGUnKTtcclxuXHJcbiAgICAgICAgYWpheChcImdldFVzZXJEYXRhXCIsIHt9LCAocmVzcG9uc2U6IEdldFVzZXJEYXRhUmVzcG9uc2UpID0+IHtcclxuICAgICAgICAgICAgdGhhdC51c2VyRGF0YSA9IHJlc3BvbnNlLnVzZXI7XHJcbiAgICAgICAgICAgIHRoYXQuY2xhc3NlcyA9IHJlc3BvbnNlLmNsYXNzZGF0YTtcclxuICAgICAgICAgICAgdGhpcy5pbml0TWVudSgpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNzY2hvb2xOYW1lJykudGV4dChyZXNwb25zZS5zY2hvb2xOYW1lKTtcclxuICAgICAgICB9LCAobWVzc2FnZSkgPT4ge1xyXG4gICAgICAgICAgICBhbGVydChtZXNzYWdlKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdE1lbnUoKSB7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG1pIG9mIHRoaXMubWVudUl0ZW1zKSB7XHJcbiAgICAgICAgICAgIGlmIChtaS5jaGVja1Blcm1pc3Npb24odGhpcy51c2VyRGF0YSkpIHtcclxuICAgICAgICAgICAgICAgIGxldCAkYnV0dG9uID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fbWVudWl0ZW1cIj4nICsgbWkuZ2V0QnV0dG9uSWRlbnRpZmllcigpICsgJzwvZGl2PicpO1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbWVudWl0ZW1zJykuYXBwZW5kKCRidXR0b24pO1xyXG4gICAgICAgICAgICAgICAgJGJ1dHRvbi5vbignY2xpY2snLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnI21haW4taGVhZGluZycpLmVtcHR5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCcjbWFpbi10YWJsZS1sZWZ0JykuZW1wdHkoKS5jc3MoXCJmbGV4LWdyb3dcIiwgXCIxXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnI21haW4tdGFibGUtcmlnaHQnKS5lbXB0eSgpLmNzcyhcImZsZXgtZ3Jvd1wiLCBcIjFcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmVHcmlkKGpRdWVyeSgnI21haW4tdGFibGUtbGVmdCcpKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZUdyaWQoalF1ZXJ5KCcjbWFpbi10YWJsZS1yaWdodCcpKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNtYWluLWZvb3RlcicpLmVtcHR5KCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1pLm9uTWVudUJ1dHRvblByZXNzZWQoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnI21haW4taGVhZGluZycpLCBqUXVlcnkoJyNtYWluLXRhYmxlLWxlZnQnKSwgalF1ZXJ5KCcjbWFpbi10YWJsZS1yaWdodCcpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNtYWluLWZvb3RlcicpKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCcjbWVudWl0ZW1zIC5qb19tZW51aXRlbScpLnJlbW92ZUNsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgICAgICAkYnV0dG9uLmFkZENsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBqUXVlcnkoJyNtZW51aXRlbXMgLmpvX21lbnVpdGVtJykuZmlyc3QoKS5jbGljaygpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZUdyaWQoJGVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD4pe1xyXG4gICAgICAgICRlbGVtZW50LnJlbW92ZUNsYXNzKCd3MnVpLXJlc2V0IHcydWktZ3JpZCB3MnVpLXNzJyk7XHJcbiAgICAgICAgJGVsZW1lbnQuY3NzKCdmbGV4JywgJycpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxualF1ZXJ5KCgpID0+IHtcclxuICAgIG5ldyBBZG1pbmlzdHJhdGlvbigpLnN0YXJ0KCk7XHJcbn0pOyJdfQ==