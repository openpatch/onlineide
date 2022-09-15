import { makeTabs } from "../../tools/HtmlTools.js";
import { ProgramPrinter } from "../../compiler/parser/ProgramPrinter.js";
import { MyConsole } from "./console/MyConsole.js";
import { ErrorManager } from "./ErrorManager.js";
import { InterpreterState } from "../../interpreter/Interpreter.js";
import { HomeworkManager } from "./HomeworkManager.js";
export class BottomDiv {
    constructor(main, $bottomDiv, $mainDiv) {
        this.main = main;
        this.$bottomDiv = $bottomDiv;
        this.$mainDiv = $mainDiv;
        if (this.$bottomDiv.find('.jo_tabs>.jo_pcodeTab').length > 0) {
            this.programPrinter = new ProgramPrinter(main, $bottomDiv);
        }
        if (this.$bottomDiv.find('.jo_tabheadings>.jo_console-tab').length > 0) {
            this.console = new MyConsole(main, $bottomDiv);
        }
        else {
            this.console = new MyConsole(main, null);
        }
        if (this.$bottomDiv.find('.jo_tabheadings>.jo_homeworkTabheading').length > 0) {
            this.homeworkManager = new HomeworkManager(main, $bottomDiv);
        }
        this.errorManager = new ErrorManager(main, $bottomDiv, $mainDiv);
    }
    initGUI() {
        makeTabs(this.$bottomDiv);
        if (this.programPrinter != null)
            this.programPrinter.initGUI();
        if (this.console != null)
            this.console.initGUI();
        if (this.homeworkManager != null)
            this.homeworkManager.initGUI();
        this.$bottomDiv.find('.jo_tabs').children().first().trigger("click");
        let that = this;
        jQuery(".jo_pcodeTab").on("myshow", () => {
            that.printCurrentlyExecutedModule();
        });
    }
    printCurrentlyExecutedModule() {
        var _a;
        let interpreter = this.main.getInterpreter();
        if (interpreter.state == InterpreterState.running || interpreter.state == InterpreterState.paused) {
            let module = (_a = interpreter.currentProgram) === null || _a === void 0 ? void 0 : _a.module;
            this.printModuleToBottomDiv(null, module);
        }
    }
    printModuleToBottomDiv(currentWorkspace, module) {
        if (this.programPrinter != null)
            this.programPrinter.printModuleToBottomDiv(currentWorkspace, module);
    }
    showHomeworkTab() {
        jQuery('.jo_homeworkTabheading').css('visibility', 'visible');
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        jQuery('.jo_homeworkTabheading').trigger(mousePointer + "down");
    }
    hideHomeworkTab() {
        jQuery('.jo_homeworkTabheading').css('visibility', 'hidden');
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        jQuery('.jo_tabheadings').children().first().trigger(mousePointer + "down");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQm90dG9tRGl2LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9Cb3R0b21EaXYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBRXBELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSx5Q0FBeUMsQ0FBQztBQUd6RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDbkQsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLGtDQUFrQyxDQUFDO0FBRXBFLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxzQkFBc0IsQ0FBQztBQUV2RCxNQUFNLE9BQU8sU0FBUztJQU9sQixZQUFvQixJQUFjLEVBQVMsVUFBK0IsRUFBUyxRQUE2QjtRQUE1RixTQUFJLEdBQUosSUFBSSxDQUFVO1FBQVMsZUFBVSxHQUFWLFVBQVUsQ0FBcUI7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFxQjtRQUU1RyxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUMxRCxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksY0FBYyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztTQUM5RDtRQUVELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsaUNBQWlDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ3BFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ2xEO2FBQU07WUFDSCxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztTQUM1QztRQUVELElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsd0NBQXdDLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQzNFLElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxlQUFlLENBQU8sSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3RFO1FBRUQsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQ3JFLENBQUM7SUFFRCxPQUFPO1FBQ0gsUUFBUSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQixJQUFJLElBQUksQ0FBQyxjQUFjLElBQUksSUFBSTtZQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0QsSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUk7WUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pELElBQUcsSUFBSSxDQUFDLGVBQWUsSUFBSSxJQUFJO1lBQUUsSUFBSSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUVoRSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFckUsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLE1BQU0sQ0FBQyxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUNyQyxJQUFJLENBQUMsNEJBQTRCLEVBQUUsQ0FBQztRQUN4QyxDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFFRCw0QkFBNEI7O1FBQ3hCLElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsSUFBSSxXQUFXLENBQUMsS0FBSyxJQUFJLGdCQUFnQixDQUFDLE9BQU8sSUFBSSxXQUFXLENBQUMsS0FBSyxJQUFJLGdCQUFnQixDQUFDLE1BQU0sRUFBRTtZQUMvRixJQUFJLE1BQU0sU0FBRyxXQUFXLENBQUMsY0FBYywwQ0FBRSxNQUFNLENBQUM7WUFDaEQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztTQUM3QztJQUNMLENBQUM7SUFFRCxzQkFBc0IsQ0FBQyxnQkFBMkIsRUFBRSxNQUFjO1FBQzlELElBQUksSUFBSSxDQUFDLGNBQWMsSUFBSSxJQUFJO1lBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMxRyxDQUFDO0lBR0QsZUFBZTtRQUVYLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUQsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDN0QsTUFBTSxDQUFDLHdCQUF3QixDQUFDLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsQ0FBQztJQUVwRSxDQUFDO0lBRUQsZUFBZTtRQUVYLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDN0QsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUM7UUFDN0QsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUMsT0FBTyxDQUFDLFlBQVksR0FBRyxNQUFNLENBQUMsQ0FBQztJQUVoRixDQUFDO0NBR0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBtYWtlVGFicyB9IGZyb20gXCIuLi8uLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IFByb2dyYW1QcmludGVyIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Qcm9ncmFtUHJpbnRlci5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBNeUNvbnNvbGUgfSBmcm9tIFwiLi9jb25zb2xlL015Q29uc29sZS5qc1wiO1xyXG5pbXBvcnQgeyBFcnJvck1hbmFnZXIgfSBmcm9tIFwiLi9FcnJvck1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbkJhc2UgfSBmcm9tIFwiLi4vTWFpbkJhc2UuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJwcmV0ZXJTdGF0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBVc2VyRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgSG9tZXdvcmtNYW5hZ2VyIH0gZnJvbSBcIi4vSG9tZXdvcmtNYW5hZ2VyLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQm90dG9tRGl2IHtcclxuXHJcbiAgICBwcm9ncmFtUHJpbnRlcjogUHJvZ3JhbVByaW50ZXI7XHJcbiAgICBjb25zb2xlOiBNeUNvbnNvbGU7XHJcbiAgICBlcnJvck1hbmFnZXI6IEVycm9yTWFuYWdlcjtcclxuICAgIGhvbWV3b3JrTWFuYWdlcjogSG9tZXdvcmtNYW5hZ2VyO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbkJhc2UsIHB1YmxpYyAkYm90dG9tRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+LCBwdWJsaWMgJG1haW5EaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuJGJvdHRvbURpdi5maW5kKCcuam9fdGFicz4uam9fcGNvZGVUYWInKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvZ3JhbVByaW50ZXIgPSBuZXcgUHJvZ3JhbVByaW50ZXIobWFpbiwgJGJvdHRvbURpdik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy4kYm90dG9tRGl2LmZpbmQoJy5qb190YWJoZWFkaW5ncz4uam9fY29uc29sZS10YWInKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29uc29sZSA9IG5ldyBNeUNvbnNvbGUobWFpbiwgJGJvdHRvbURpdik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jb25zb2xlID0gbmV3IE15Q29uc29sZShtYWluLCBudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLiRib3R0b21EaXYuZmluZCgnLmpvX3RhYmhlYWRpbmdzPi5qb19ob21ld29ya1RhYmhlYWRpbmcnKS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaG9tZXdvcmtNYW5hZ2VyID0gbmV3IEhvbWV3b3JrTWFuYWdlcig8TWFpbj5tYWluLCAkYm90dG9tRGl2KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZXJyb3JNYW5hZ2VyID0gbmV3IEVycm9yTWFuYWdlcihtYWluLCAkYm90dG9tRGl2LCAkbWFpbkRpdik7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuICAgICAgICBtYWtlVGFicyh0aGlzLiRib3R0b21EaXYpO1xyXG4gICAgICAgIGlmICh0aGlzLnByb2dyYW1QcmludGVyICE9IG51bGwpIHRoaXMucHJvZ3JhbVByaW50ZXIuaW5pdEdVSSgpO1xyXG4gICAgICAgIGlmICh0aGlzLmNvbnNvbGUgIT0gbnVsbCkgdGhpcy5jb25zb2xlLmluaXRHVUkoKTtcclxuICAgICAgICBpZih0aGlzLmhvbWV3b3JrTWFuYWdlciAhPSBudWxsKSB0aGlzLmhvbWV3b3JrTWFuYWdlci5pbml0R1VJKCk7XHJcblxyXG4gICAgICAgIHRoaXMuJGJvdHRvbURpdi5maW5kKCcuam9fdGFicycpLmNoaWxkcmVuKCkuZmlyc3QoKS50cmlnZ2VyKFwiY2xpY2tcIik7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBqUXVlcnkoXCIuam9fcGNvZGVUYWJcIikub24oXCJteXNob3dcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnByaW50Q3VycmVudGx5RXhlY3V0ZWRNb2R1bGUoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnRDdXJyZW50bHlFeGVjdXRlZE1vZHVsZSgpIHtcclxuICAgICAgICBsZXQgaW50ZXJwcmV0ZXIgPSB0aGlzLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKTtcclxuICAgICAgICBpZiAoaW50ZXJwcmV0ZXIuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5ydW5uaW5nIHx8IGludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUucGF1c2VkKSB7XHJcbiAgICAgICAgICAgIGxldCBtb2R1bGUgPSBpbnRlcnByZXRlci5jdXJyZW50UHJvZ3JhbT8ubW9kdWxlO1xyXG4gICAgICAgICAgICB0aGlzLnByaW50TW9kdWxlVG9Cb3R0b21EaXYobnVsbCwgbW9kdWxlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnRNb2R1bGVUb0JvdHRvbURpdihjdXJyZW50V29ya3NwYWNlOiBXb3Jrc3BhY2UsIG1vZHVsZTogTW9kdWxlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMucHJvZ3JhbVByaW50ZXIgIT0gbnVsbCkgdGhpcy5wcm9ncmFtUHJpbnRlci5wcmludE1vZHVsZVRvQm90dG9tRGl2KGN1cnJlbnRXb3Jrc3BhY2UsIG1vZHVsZSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHNob3dIb21ld29ya1RhYigpIHtcclxuXHJcbiAgICAgICAgalF1ZXJ5KCcuam9faG9tZXdvcmtUYWJoZWFkaW5nJykuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG4gICAgICAgIGpRdWVyeSgnLmpvX2hvbWV3b3JrVGFiaGVhZGluZycpLnRyaWdnZXIobW91c2VQb2ludGVyICsgXCJkb3duXCIpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBoaWRlSG9tZXdvcmtUYWIoKSB7XHJcblxyXG4gICAgICAgIGpRdWVyeSgnLmpvX2hvbWV3b3JrVGFiaGVhZGluZycpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcclxuICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG4gICAgICAgIGpRdWVyeSgnLmpvX3RhYmhlYWRpbmdzJykuY2hpbGRyZW4oKS5maXJzdCgpLnRyaWdnZXIobW91c2VQb2ludGVyICsgXCJkb3duXCIpO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG59Il19