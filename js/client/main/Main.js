import { NetworkManager } from "../communication/NetworkManager.js";
import { Compiler, CompilerStatus } from "../compiler/Compiler.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType, IntegerType, DoubleType, CharacterType, BooleanType, FloatType } from "../compiler/types/PrimitiveTypes.js";
import { Debugger } from "../interpreter/Debugger.js";
import { Interpreter, InterpreterState } from "../interpreter/Interpreter.js";
import { Workspace } from "../workspace/Workspace.js";
import { ActionManager } from "./gui/ActionManager.js";
import { BottomDiv } from "./gui/BottomDiv.js";
import { Editor } from "./gui/Editor.js";
import { Formatter } from "./gui/Formatter.js";
import { Helper } from "./gui/Helper.js";
import { MainMenu } from "./gui/MainMenu.js";
import { ProgramControlButtons } from "./gui/ProgramControlButtons.js";
import { ProjectExplorer } from "./gui/ProjectExplorer.js";
import { RightDiv } from "./gui/RightDiv.js";
import { Sliders } from "./gui/Sliders.js";
import { TeacherExplorer } from "./gui/TeacherExplorer.js";
import { ThemeManager } from "./gui/ThemeManager.js";
import { Login } from "./Login.js";
import { ViewModeController } from "./gui/ViewModeController.js";
import { SemicolonAngel } from "../compiler/parser/SemicolonAngel.js";
import { WindowStateManager } from "./gui/WindowStateManager.js";
import { checkIfMousePresent } from "../tools/HtmlTools.js";
export class Main {
    constructor() {
        this.repositoryOn = true;
        this.workspaceList = [];
        this.windowStateManager = new WindowStateManager(this);
        this.startupComplete = 2;
        this.programIsExecutable = false;
        this.version = 0;
        this.userDataDirty = false;
    }
    isEmbedded() { return false; }
    getInterpreter() {
        return this.interpreter;
    }
    getCurrentWorkspace() {
        return this.currentWorkspace;
    }
    getDebugger() {
        return this.debugger;
    }
    getMonacoEditor() {
        return this.editor.editor;
    }
    getRightDiv() {
        return this.rightDiv;
    }
    getBottomDiv() {
        return this.bottomDiv;
    }
    // VORSICHT: ggf. Module -> any
    getCurrentlyEditedModule() {
        return this.projectExplorer.getCurrentlyEditedModule();
    }
    getActionManager() {
        return this.actionManager;
    }
    showProgramPointerPosition(file, position) {
        this.projectExplorer.showProgramPointerPosition(file, position);
    }
    hideProgramPointerPosition() {
        this.projectExplorer.hideProgramPointerPosition();
    }
    getCompiler() {
        return this.compiler;
    }
    setModuleActive(module) {
        this.projectExplorer.setModuleActive(module);
    }
    getSemicolonAngel() {
        return this.semicolonAngel;
    }
    jumpToDeclaration(module, declaration) {
        this.projectExplorer.setModuleActive(module);
        this.editor.editor.revealLineInCenter(declaration.position.line);
        this.editor.editor.setPosition({ column: declaration.position.column, lineNumber: declaration.position.line });
    }
    initGUI() {
        checkIfMousePresent();
        this.login = new Login(this);
        this.login.initGUI();
        this.actionManager = new ActionManager(null, this);
        this.actionManager.init();
        this.networkManager = new NetworkManager(this, jQuery('#bottomdiv-outer .jo_updateTimerDiv'));
        let sliders = new Sliders(this);
        sliders.initSliders();
        this.mainMenu = new MainMenu(this);
        this.projectExplorer = new ProjectExplorer(this, jQuery('#leftpanel>.jo_projectexplorer'));
        this.projectExplorer.initGUI();
        this.bottomDiv = new BottomDiv(this, jQuery('#bottomdiv-outer>.jo_bottomdiv-inner'), jQuery('body'));
        this.rightDiv = new RightDiv(this, jQuery('#rightdiv-inner'));
        this.rightDiv.initGUI();
        this.debugger = new Debugger(this, jQuery('#leftpanel>.jo_debugger'), jQuery('#leftpanel>.jo_projectexplorer'));
        this.interpreter = new Interpreter(this, this.debugger, new ProgramControlButtons(jQuery('#controls'), jQuery('#editor')), jQuery('#rightdiv-inner .jo_run'));
        this.interpreter.initGUI();
        this.initTypes();
        this.checkStartupComplete();
        this.correctPIXITransform();
        PIXI.utils.skipHello(); // don't show PIXI-Message in browser console
        this.themeManager = new ThemeManager();
        this.viewModeController = new ViewModeController(jQuery("#view-mode"), this);
        this.semicolonAngel = new SemicolonAngel(this);
    }
    correctPIXITransform() {
        PIXI.Transform.prototype.updateTransform = function (parentTransform) {
            var lt = this.localTransform;
            if (this._localID !== this._currentLocalID) {
                // get the matrix values of the displayobject based on its transform properties..
                // lt.a = this._cx * this.scale.x;
                // lt.b = this._sx * this.scale.x;
                // lt.c = this._cy * this.scale.y;
                // lt.d = this._sy * this.scale.y;
                // lt.tx = this.position.x - ((this.pivot.x * lt.a) + (this.pivot.y * lt.c));
                // lt.ty = this.position.y - ((this.pivot.x * lt.b) + (this.pivot.y * lt.d));
                this._currentLocalID = this._localID;
                // force an update..
                this._parentID = -1;
            }
            //@ts-ignore
            if (this._parentID !== parentTransform._worldID) {
                // concat the parent matrix with the objects transform.
                var pt = parentTransform.worldTransform;
                var wt = this.worldTransform;
                wt.a = (lt.a * pt.a) + (lt.b * pt.c);
                wt.b = (lt.a * pt.b) + (lt.b * pt.d);
                wt.c = (lt.c * pt.a) + (lt.d * pt.c);
                wt.d = (lt.c * pt.b) + (lt.d * pt.d);
                wt.tx = (lt.tx * pt.a) + (lt.ty * pt.c) + pt.tx;
                wt.ty = (lt.tx * pt.b) + (lt.ty * pt.d) + pt.ty;
                //@ts-ignore
                this._parentID = parentTransform._worldID;
                // update the id of the transform..
                this._worldID++;
            }
        };
    }
    initEditor() {
        this.editor = new Editor(this, true, false);
        new Formatter().init();
        // this.monaco_editor = 
        this.editor.initGUI(jQuery('#editor'));
        let that = this;
        jQuery(window).on('resize', (event) => {
            jQuery('#bottomdiv-outer').css('height', '150px');
            jQuery('#editor').css('height', (window.innerHeight - 150 - 30 - 2) + "px");
            that.editor.editor.layout();
            jQuery('#editor').css('height', "");
        });
        jQuery(window).trigger('resize');
        this.checkStartupComplete();
    }
    initTeacherExplorer(classdata) {
        this.teacherExplorer = new TeacherExplorer(this, classdata);
        this.teacherExplorer.initGUI();
    }
    // loadWorkspace() {
    //     this.workspaceList.push(getMockupWorkspace(this));
    //     this.projectExplorer.renderWorkspaces(this.workspaceList);
    //     this.projectExplorer.setWorkspaceActive(this.workspaceList[0]);
    //     this.checkStartupComplete();
    // }
    checkStartupComplete() {
        this.startupComplete--;
        if (this.startupComplete == 0) {
            this.start();
        }
    }
    initTypes() {
        voidPrimitiveType.init();
        intPrimitiveType.init();
        floatPrimitiveType.init();
        doublePrimitiveType.init();
        booleanPrimitiveType.init();
        stringPrimitiveType.init();
        charPrimitiveType.init();
        IntegerType.init();
        FloatType.init();
        DoubleType.init();
        CharacterType.init();
        BooleanType.init();
    }
    start() {
        if (this.waitForGUICallback != null) {
            this.waitForGUICallback();
        }
        let that = this;
        setTimeout(() => {
            that.getMonacoEditor().layout();
        }, 200);
        this.compiler = new Compiler(this);
        this.startTimer();
    }
    startTimer() {
        if (this.timerHandle != null) {
            clearInterval(this.timerHandle);
        }
        let that = this;
        this.timerHandle = setInterval(() => {
            that.compileIfDirty();
        }, 500);
    }
    compileIfDirty() {
        var _a, _b;
        if (this.currentWorkspace == null)
            return;
        if (this.currentWorkspace.moduleStore.isDirty() &&
            this.compiler.compilerStatus != CompilerStatus.compiling
            && this.interpreter.state != InterpreterState.running
            && this.interpreter.state != InterpreterState.paused) {
            try {
                this.compiler.compile(this.currentWorkspace.moduleStore);
                let errors = (_b = (_a = this.bottomDiv) === null || _a === void 0 ? void 0 : _a.errorManager) === null || _b === void 0 ? void 0 : _b.showErrors(this.currentWorkspace);
                this.projectExplorer.renderErrorCount(this.currentWorkspace, errors);
                this.editor.onDidChangeCursorPosition(null); // mark occurrencies of symbol under cursor
                this.printProgram();
                if (this.projectExplorer) {
                    this.version++;
                }
                let startable = this.interpreter.getStartableModule(this.currentWorkspace.moduleStore) != null;
                if (startable &&
                    this.interpreter.state == InterpreterState.not_initialized) {
                    this.copyExecutableModuleStoreToInterpreter();
                    this.interpreter.setState(InterpreterState.done);
                    // this.interpreter.init();
                }
                if (!startable &&
                    (this.interpreter.state == InterpreterState.done || this.interpreter.state == InterpreterState.error)) {
                    this.interpreter.setState(InterpreterState.not_initialized);
                }
                this.drawClassDiagrams(!this.rightDiv.isClassDiagramEnabled());
            }
            catch (e) {
                console.error(e);
                this.compiler.compilerStatus = CompilerStatus.error;
            }
        }
    }
    printProgram() {
        this.bottomDiv.printModuleToBottomDiv(this.currentWorkspace, this.projectExplorer.getCurrentlyEditedModule());
    }
    drawClassDiagrams(onlyUpdateIdentifiers) {
        clearTimeout(this.debounceDiagramDrawing);
        this.debounceDiagramDrawing = setTimeout(() => {
            var _a, _b;
            (_b = (_a = this.rightDiv) === null || _a === void 0 ? void 0 : _a.classDiagram) === null || _b === void 0 ? void 0 : _b.drawDiagram(this.currentWorkspace, onlyUpdateIdentifiers);
        }, 500);
    }
    copyExecutableModuleStoreToInterpreter() {
        let ms = this.currentWorkspace.moduleStore.copy();
        this.interpreter.moduleStore = ms;
        this.interpreter.moduleStoreVersion = this.version;
        if (this.interpreter.state == InterpreterState.not_initialized && this.programIsExecutable) {
            this.interpreter.setState(InterpreterState.done);
        }
    }
    removeWorkspace(w) {
        this.workspaceList.splice(this.workspaceList.indexOf(w), 1);
    }
    restoreWorkspaces(workspaces) {
        this.workspaceList = [];
        this.currentWorkspace = null;
        // this.monaco.setModel(monaco.editor.createModel("Keine Datei vorhanden." , "text"));
        this.getMonacoEditor().updateOptions({ readOnly: true });
        for (let ws of workspaces.workspaces) {
            let workspace = Workspace.restoreFromData(ws, this);
            this.workspaceList.push(workspace);
            if (ws.id == this.user.currentWorkspace_id) {
                this.currentWorkspace = workspace;
            }
        }
        this.projectExplorer.renderWorkspaces(this.workspaceList);
        if (this.currentWorkspace == null && this.workspaceList.length > 0) {
            this.currentWorkspace = this.workspaceList[0];
        }
        if (this.currentWorkspace != null) {
            this.projectExplorer.setWorkspaceActive(this.currentWorkspace, true);
        }
        else {
            this.projectExplorer.setModuleActive(null);
        }
        if (this.workspaceList.length == 0) {
            Helper.showHelper("newWorkspaceHelper", this, this.projectExplorer.workspaceListPanel.$captionElement);
        }
    }
    createNewWorkspace(name, owner_id) {
        return new Workspace(name, this, owner_id);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvbWFpbi9NYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ25FLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDalEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDdEQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDdkUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQzNELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxt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SSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUVoQyxNQUFNLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBRTFHO0lBR0wsQ0FBQztJQUVELGtCQUFrQixDQUFDLElBQVksRUFBRSxRQUFnQjtRQUM3QyxPQUFPLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2xhc3NEYXRhLCBVc2VyRGF0YSwgV29ya3NwYWNlcyB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgTmV0d29ya01hbmFnZXIgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9OZXR3b3JrTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBDb21waWxlciwgQ29tcGlsZXJTdGF0dXMgfSBmcm9tIFwiLi4vY29tcGlsZXIvQ29tcGlsZXIuanNcIjtcclxuaW1wb3J0IHsgYm9vbGVhblByaW1pdGl2ZVR5cGUsIGNoYXJQcmltaXRpdmVUeXBlLCBkb3VibGVQcmltaXRpdmVUeXBlLCBmbG9hdFByaW1pdGl2ZVR5cGUsIGludFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIHZvaWRQcmltaXRpdmVUeXBlLCBJbnRlZ2VyVHlwZSwgRG91YmxlVHlwZSwgQ2hhcmFjdGVyVHlwZSwgQm9vbGVhblR5cGUsIEZsb2F0VHlwZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBEZWJ1Z2dlciB9IGZyb20gXCIuLi9pbnRlcnByZXRlci9EZWJ1Z2dlci5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciwgSW50ZXJwcmV0ZXJTdGF0ZSB9IGZyb20gXCIuLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBBY3Rpb25NYW5hZ2VyIH0gZnJvbSBcIi4vZ3VpL0FjdGlvbk1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgQm90dG9tRGl2IH0gZnJvbSBcIi4vZ3VpL0JvdHRvbURpdi5qc1wiO1xyXG5pbXBvcnQgeyBFZGl0b3IgfSBmcm9tIFwiLi9ndWkvRWRpdG9yLmpzXCI7XHJcbmltcG9ydCB7IEZvcm1hdHRlciB9IGZyb20gXCIuL2d1aS9Gb3JtYXR0ZXIuanNcIjtcclxuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4vZ3VpL0hlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluTWVudSB9IGZyb20gXCIuL2d1aS9NYWluTWVudS5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtQ29udHJvbEJ1dHRvbnMgfSBmcm9tIFwiLi9ndWkvUHJvZ3JhbUNvbnRyb2xCdXR0b25zLmpzXCI7XHJcbmltcG9ydCB7IFByb2plY3RFeHBsb3JlciB9IGZyb20gXCIuL2d1aS9Qcm9qZWN0RXhwbG9yZXIuanNcIjtcclxuaW1wb3J0IHsgUmlnaHREaXYgfSBmcm9tIFwiLi9ndWkvUmlnaHREaXYuanNcIjtcclxuaW1wb3J0IHsgU2xpZGVycyB9IGZyb20gXCIuL2d1aS9TbGlkZXJzLmpzXCI7XHJcbmltcG9ydCB7IFRlYWNoZXJFeHBsb3JlciB9IGZyb20gXCIuL2d1aS9UZWFjaGVyRXhwbG9yZXIuanNcIjtcclxuaW1wb3J0IHsgVGhlbWVNYW5hZ2VyIH0gZnJvbSBcIi4vZ3VpL1RoZW1lTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBMb2dpbiB9IGZyb20gXCIuL0xvZ2luLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4vTWFpbkJhc2UuanNcIlxyXG5pbXBvcnQgeyBNb2R1bGUsIEZpbGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBUZXh0UG9zaXRpb24gfSBmcm9tIFwiLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgVmlld01vZGVDb250cm9sbGVyIH0gZnJvbSBcIi4vZ3VpL1ZpZXdNb2RlQ29udHJvbGxlci5qc1wiO1xyXG5pbXBvcnQgeyBFcnJvck1hbmFnZXIgfSBmcm9tIFwiLi9ndWkvRXJyb3JNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFNlbWljb2xvbkFuZ2VsIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9TZW1pY29sb25BbmdlbC5qc1wiO1xyXG5pbXBvcnQgeyBTeW5jaHJvbml6YXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4uL3JlcG9zaXRvcnkvc3luY2hyb25pemUvUmVwb3NpdG9yeVN5bmNocm9uaXphdGlvbk1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIgfSBmcm9tIFwiLi4vcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlciB9IGZyb20gXCIuLi9yZXBvc2l0b3J5L3VwZGF0ZS9SZXBvc2l0b3J5U2V0dGluZ3NNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlDaGVja291dE1hbmFnZXIgfSBmcm9tIFwiLi4vcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeUNoZWNrb3V0TWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBXaW5kb3dTdGF0ZU1hbmFnZXIgfSBmcm9tIFwiLi9ndWkvV2luZG93U3RhdGVNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbldpdGhNb2R1bGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgY2hlY2tJZk1vdXNlUHJlc2VudCB9IGZyb20gXCIuLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNYWluIGltcGxlbWVudHMgTWFpbkJhc2Uge1xyXG5cclxuICAgIHJlcG9zaXRvcnlPbjogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgaXNFbWJlZGRlZCgpOiBib29sZWFuIHsgcmV0dXJuIGZhbHNlOyB9XHJcblxyXG4gICAgZ2V0SW50ZXJwcmV0ZXIoKTogSW50ZXJwcmV0ZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmludGVycHJldGVyO1xyXG4gICAgfVxyXG4gICAgZ2V0Q3VycmVudFdvcmtzcGFjZSgpOiBXb3Jrc3BhY2Uge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRXb3Jrc3BhY2U7XHJcbiAgICB9XHJcbiAgICBnZXREZWJ1Z2dlcigpOiBEZWJ1Z2dlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZGVidWdnZXI7XHJcbiAgICB9XHJcbiAgICBnZXRNb25hY29FZGl0b3IoKTogbW9uYWNvLmVkaXRvci5JU3RhbmRhbG9uZUNvZGVFZGl0b3Ige1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVkaXRvci5lZGl0b3I7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UmlnaHREaXYoKTogUmlnaHREaXYge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJpZ2h0RGl2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldEJvdHRvbURpdigpOiBCb3R0b21EaXYge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmJvdHRvbURpdjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBWT1JTSUNIVDogZ2dmLiBNb2R1bGUgLT4gYW55XHJcbiAgICBnZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKTogTW9kdWxlIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wcm9qZWN0RXhwbG9yZXIuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QWN0aW9uTWFuYWdlcigpOiBBY3Rpb25NYW5hZ2VyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hY3Rpb25NYW5hZ2VyO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3dQcm9ncmFtUG9pbnRlclBvc2l0aW9uKGZpbGU6IEZpbGUsIHBvc2l0aW9uOiBUZXh0UG9zaXRpb24pIHtcclxuICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zaG93UHJvZ3JhbVBvaW50ZXJQb3NpdGlvbihmaWxlLCBwb3NpdGlvbik7XHJcbiAgICB9XHJcbiAgICBoaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpIHtcclxuICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBpbGVyKCk6IENvbXBpbGVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlcjtcclxuICAgIH1cclxuXHJcbiAgICBzZXRNb2R1bGVBY3RpdmUobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zZXRNb2R1bGVBY3RpdmUobW9kdWxlKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRTZW1pY29sb25BbmdlbCgpOiBTZW1pY29sb25BbmdlbCB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2VtaWNvbG9uQW5nZWw7XHJcbiAgICB9XHJcblxyXG4gICAganVtcFRvRGVjbGFyYXRpb24obW9kdWxlOiBNb2R1bGUsIGRlY2xhcmF0aW9uOiBUZXh0UG9zaXRpb25XaXRoTW9kdWxlKSB7XHJcbiAgICAgICAgdGhpcy5wcm9qZWN0RXhwbG9yZXIuc2V0TW9kdWxlQWN0aXZlKG1vZHVsZSk7XHJcbiAgICAgICAgdGhpcy5lZGl0b3IuZWRpdG9yLnJldmVhbExpbmVJbkNlbnRlcihkZWNsYXJhdGlvbi5wb3NpdGlvbi5saW5lKTtcclxuICAgICAgICB0aGlzLmVkaXRvci5lZGl0b3Iuc2V0UG9zaXRpb24oe2NvbHVtbjogZGVjbGFyYXRpb24ucG9zaXRpb24uY29sdW1uLCBsaW5lTnVtYmVyOiBkZWNsYXJhdGlvbi5wb3NpdGlvbi5saW5lfSk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHdvcmtzcGFjZUxpc3Q6IFdvcmtzcGFjZVtdID0gW107XHJcbiAgICB3b3Jrc3BhY2VzT3duZXJJZDogbnVtYmVyO1xyXG5cclxuICAgIC8vIG1vbmFjb19lZGl0b3I6IG1vbmFjby5lZGl0b3IuSVN0YW5kYWxvbmVDb2RlRWRpdG9yO1xyXG4gICAgZWRpdG9yOiBFZGl0b3I7XHJcbiAgICBjdXJyZW50V29ya3NwYWNlOiBXb3Jrc3BhY2U7XHJcbiAgICBwcm9qZWN0RXhwbG9yZXI6IFByb2plY3RFeHBsb3JlcjtcclxuICAgIHRlYWNoZXJFeHBsb3JlcjogVGVhY2hlckV4cGxvcmVyO1xyXG4gICAgbmV0d29ya01hbmFnZXI6IE5ldHdvcmtNYW5hZ2VyO1xyXG4gICAgYWN0aW9uTWFuYWdlcjogQWN0aW9uTWFuYWdlcjtcclxuICAgIG1haW5NZW51OiBNYWluTWVudTtcclxuXHJcbiAgICBzeW5jaHJvbml6YXRpb25NYW5hZ2VyOiBTeW5jaHJvbml6YXRpb25NYW5hZ2VyO1xyXG4gICAgcmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXI6IFJlcG9zaXRvcnlDcmVhdGVNYW5hZ2VyO1xyXG4gICAgcmVwb3NpdG9yeVVwZGF0ZU1hbmFnZXI6IFJlcG9zaXRvcnlTZXR0aW5nc01hbmFnZXI7XHJcbiAgICByZXBvc2l0b3J5Q2hlY2tvdXRNYW5hZ2VyOiBSZXBvc2l0b3J5Q2hlY2tvdXRNYW5hZ2VyO1xyXG5cclxuICAgIHdpbmRvd1N0YXRlTWFuYWdlcjogV2luZG93U3RhdGVNYW5hZ2VyID0gbmV3IFdpbmRvd1N0YXRlTWFuYWdlcih0aGlzKTtcclxuXHJcbiAgICBsb2dpbjogTG9naW47XHJcblxyXG4gICAgY29tcGlsZXI6IENvbXBpbGVyO1xyXG5cclxuICAgIGludGVycHJldGVyOiBJbnRlcnByZXRlcjtcclxuXHJcbiAgICBkZWJ1Z2dlcjogRGVidWdnZXI7XHJcblxyXG4gICAgc2VtaWNvbG9uQW5nZWw6IFNlbWljb2xvbkFuZ2VsO1xyXG5cclxuICAgIGJvdHRvbURpdjogQm90dG9tRGl2O1xyXG5cclxuICAgIHN0YXJ0dXBDb21wbGV0ZSA9IDI7XHJcbiAgICB3YWl0Rm9yR1VJQ2FsbGJhY2s6ICgpID0+IHZvaWQ7XHJcblxyXG4gICAgcHJvZ3JhbUlzRXhlY3V0YWJsZSA9IGZhbHNlO1xyXG4gICAgdmVyc2lvbjogbnVtYmVyID0gMDtcclxuXHJcbiAgICB0aW1lckhhbmRsZTogYW55O1xyXG5cclxuICAgIHVzZXI6IFVzZXJEYXRhO1xyXG4gICAgdXNlckRhdGFEaXJ0eTogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHRoZW1lTWFuYWdlcjogVGhlbWVNYW5hZ2VyO1xyXG5cclxuICAgIHJpZ2h0RGl2OiBSaWdodERpdjtcclxuXHJcbiAgICBkZWJvdW5jZURpYWdyYW1EcmF3aW5nOiBhbnk7XHJcblxyXG4gICAgdmlld01vZGVDb250cm9sbGVyOiBWaWV3TW9kZUNvbnRyb2xsZXI7XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuXHJcbiAgICAgICAgY2hlY2tJZk1vdXNlUHJlc2VudCgpO1xyXG5cclxuICAgICAgICB0aGlzLmxvZ2luID0gbmV3IExvZ2luKHRoaXMpO1xyXG4gICAgICAgIHRoaXMubG9naW4uaW5pdEdVSSgpO1xyXG5cclxuICAgICAgICB0aGlzLmFjdGlvbk1hbmFnZXIgPSBuZXcgQWN0aW9uTWFuYWdlcihudWxsLCB0aGlzKTtcclxuICAgICAgICB0aGlzLmFjdGlvbk1hbmFnZXIuaW5pdCgpO1xyXG5cclxuICAgICAgICB0aGlzLm5ldHdvcmtNYW5hZ2VyID0gbmV3IE5ldHdvcmtNYW5hZ2VyKHRoaXMsIGpRdWVyeSgnI2JvdHRvbWRpdi1vdXRlciAuam9fdXBkYXRlVGltZXJEaXYnKSk7XHJcblxyXG4gICAgICAgIGxldCBzbGlkZXJzID0gbmV3IFNsaWRlcnModGhpcyk7XHJcbiAgICAgICAgc2xpZGVycy5pbml0U2xpZGVycygpO1xyXG4gICAgICAgIHRoaXMubWFpbk1lbnUgPSBuZXcgTWFpbk1lbnUodGhpcyk7XHJcbiAgICAgICAgdGhpcy5wcm9qZWN0RXhwbG9yZXIgPSBuZXcgUHJvamVjdEV4cGxvcmVyKHRoaXMsIGpRdWVyeSgnI2xlZnRwYW5lbD4uam9fcHJvamVjdGV4cGxvcmVyJykpO1xyXG4gICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5ib3R0b21EaXYgPSBuZXcgQm90dG9tRGl2KHRoaXMsIGpRdWVyeSgnI2JvdHRvbWRpdi1vdXRlcj4uam9fYm90dG9tZGl2LWlubmVyJyksIGpRdWVyeSgnYm9keScpKTtcclxuXHJcbiAgICAgICAgdGhpcy5yaWdodERpdiA9IG5ldyBSaWdodERpdih0aGlzLCBqUXVlcnkoJyNyaWdodGRpdi1pbm5lcicpKTtcclxuICAgICAgICB0aGlzLnJpZ2h0RGl2LmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5kZWJ1Z2dlciA9IG5ldyBEZWJ1Z2dlcih0aGlzLCBqUXVlcnkoJyNsZWZ0cGFuZWw+LmpvX2RlYnVnZ2VyJyksIGpRdWVyeSgnI2xlZnRwYW5lbD4uam9fcHJvamVjdGV4cGxvcmVyJykpO1xyXG5cclxuICAgICAgICB0aGlzLmludGVycHJldGVyID0gbmV3IEludGVycHJldGVyKHRoaXMsIHRoaXMuZGVidWdnZXIsXHJcbiAgICAgICAgICAgIG5ldyBQcm9ncmFtQ29udHJvbEJ1dHRvbnMoalF1ZXJ5KCcjY29udHJvbHMnKSwgalF1ZXJ5KCcjZWRpdG9yJykpLFxyXG4gICAgICAgICAgICBqUXVlcnkoJyNyaWdodGRpdi1pbm5lciAuam9fcnVuJykpO1xyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIuaW5pdEdVSSgpO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRUeXBlcygpO1xyXG5cclxuICAgICAgICB0aGlzLmNoZWNrU3RhcnR1cENvbXBsZXRlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY29ycmVjdFBJWElUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAgICAgUElYSS51dGlscy5za2lwSGVsbG8oKTsgLy8gZG9uJ3Qgc2hvdyBQSVhJLU1lc3NhZ2UgaW4gYnJvd3NlciBjb25zb2xlXHJcblxyXG4gICAgICAgIHRoaXMudGhlbWVNYW5hZ2VyID0gbmV3IFRoZW1lTWFuYWdlcigpO1xyXG5cclxuICAgICAgICB0aGlzLnZpZXdNb2RlQ29udHJvbGxlciA9IG5ldyBWaWV3TW9kZUNvbnRyb2xsZXIoalF1ZXJ5KFwiI3ZpZXctbW9kZVwiKSwgdGhpcyk7XHJcblxyXG4gICAgICAgIHRoaXMuc2VtaWNvbG9uQW5nZWwgPSBuZXcgU2VtaWNvbG9uQW5nZWwodGhpcyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNvcnJlY3RQSVhJVHJhbnNmb3JtKCkge1xyXG5cclxuICAgICAgICBQSVhJLlRyYW5zZm9ybS5wcm90b3R5cGUudXBkYXRlVHJhbnNmb3JtID0gZnVuY3Rpb24gKHBhcmVudFRyYW5zZm9ybSkge1xyXG4gICAgICAgICAgICB2YXIgbHQgPSB0aGlzLmxvY2FsVHJhbnNmb3JtO1xyXG4gICAgICAgICAgICBpZiAodGhpcy5fbG9jYWxJRCAhPT0gdGhpcy5fY3VycmVudExvY2FsSUQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGdldCB0aGUgbWF0cml4IHZhbHVlcyBvZiB0aGUgZGlzcGxheW9iamVjdCBiYXNlZCBvbiBpdHMgdHJhbnNmb3JtIHByb3BlcnRpZXMuLlxyXG4gICAgICAgICAgICAgICAgLy8gbHQuYSA9IHRoaXMuX2N4ICogdGhpcy5zY2FsZS54O1xyXG4gICAgICAgICAgICAgICAgLy8gbHQuYiA9IHRoaXMuX3N4ICogdGhpcy5zY2FsZS54O1xyXG4gICAgICAgICAgICAgICAgLy8gbHQuYyA9IHRoaXMuX2N5ICogdGhpcy5zY2FsZS55O1xyXG4gICAgICAgICAgICAgICAgLy8gbHQuZCA9IHRoaXMuX3N5ICogdGhpcy5zY2FsZS55O1xyXG4gICAgICAgICAgICAgICAgLy8gbHQudHggPSB0aGlzLnBvc2l0aW9uLnggLSAoKHRoaXMucGl2b3QueCAqIGx0LmEpICsgKHRoaXMucGl2b3QueSAqIGx0LmMpKTtcclxuICAgICAgICAgICAgICAgIC8vIGx0LnR5ID0gdGhpcy5wb3NpdGlvbi55IC0gKCh0aGlzLnBpdm90LnggKiBsdC5iKSArICh0aGlzLnBpdm90LnkgKiBsdC5kKSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLl9jdXJyZW50TG9jYWxJRCA9IHRoaXMuX2xvY2FsSUQ7XHJcbiAgICAgICAgICAgICAgICAvLyBmb3JjZSBhbiB1cGRhdGUuLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50SUQgPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgaWYgKHRoaXMuX3BhcmVudElEICE9PSBwYXJlbnRUcmFuc2Zvcm0uX3dvcmxkSUQpIHtcclxuICAgICAgICAgICAgICAgIC8vIGNvbmNhdCB0aGUgcGFyZW50IG1hdHJpeCB3aXRoIHRoZSBvYmplY3RzIHRyYW5zZm9ybS5cclxuICAgICAgICAgICAgICAgIHZhciBwdCA9IHBhcmVudFRyYW5zZm9ybS53b3JsZFRyYW5zZm9ybTtcclxuICAgICAgICAgICAgICAgIHZhciB3dCA9IHRoaXMud29ybGRUcmFuc2Zvcm07XHJcbiAgICAgICAgICAgICAgICB3dC5hID0gKGx0LmEgKiBwdC5hKSArIChsdC5iICogcHQuYyk7XHJcbiAgICAgICAgICAgICAgICB3dC5iID0gKGx0LmEgKiBwdC5iKSArIChsdC5iICogcHQuZCk7XHJcbiAgICAgICAgICAgICAgICB3dC5jID0gKGx0LmMgKiBwdC5hKSArIChsdC5kICogcHQuYyk7XHJcbiAgICAgICAgICAgICAgICB3dC5kID0gKGx0LmMgKiBwdC5iKSArIChsdC5kICogcHQuZCk7XHJcbiAgICAgICAgICAgICAgICB3dC50eCA9IChsdC50eCAqIHB0LmEpICsgKGx0LnR5ICogcHQuYykgKyBwdC50eDtcclxuICAgICAgICAgICAgICAgIHd0LnR5ID0gKGx0LnR4ICogcHQuYikgKyAobHQudHkgKiBwdC5kKSArIHB0LnR5O1xyXG4gICAgICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgICAgICB0aGlzLl9wYXJlbnRJRCA9IHBhcmVudFRyYW5zZm9ybS5fd29ybGRJRDtcclxuICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgaWQgb2YgdGhlIHRyYW5zZm9ybS4uXHJcbiAgICAgICAgICAgICAgICB0aGlzLl93b3JsZElEKys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEVkaXRvcigpIHtcclxuICAgICAgICB0aGlzLmVkaXRvciA9IG5ldyBFZGl0b3IodGhpcywgdHJ1ZSwgZmFsc2UpO1xyXG4gICAgICAgIG5ldyBGb3JtYXR0ZXIoKS5pbml0KCk7XHJcbiAgICAgICAgLy8gdGhpcy5tb25hY29fZWRpdG9yID0gXHJcbiAgICAgICAgdGhpcy5lZGl0b3IuaW5pdEdVSShqUXVlcnkoJyNlZGl0b3InKSk7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBqUXVlcnkod2luZG93KS5vbigncmVzaXplJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2JvdHRvbWRpdi1vdXRlcicpLmNzcygnaGVpZ2h0JywgJzE1MHB4Jyk7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2VkaXRvcicpLmNzcygnaGVpZ2h0JywgKHdpbmRvdy5pbm5lckhlaWdodCAtIDE1MCAtIDMwIC0gMikgKyBcInB4XCIpO1xyXG4gICAgICAgICAgICB0aGF0LmVkaXRvci5lZGl0b3IubGF5b3V0KCk7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2VkaXRvcicpLmNzcygnaGVpZ2h0JywgXCJcIik7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkod2luZG93KS50cmlnZ2VyKCdyZXNpemUnKTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0dXBDb21wbGV0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRUZWFjaGVyRXhwbG9yZXIoY2xhc3NkYXRhOiBDbGFzc0RhdGFbXSkge1xyXG4gICAgICAgIHRoaXMudGVhY2hlckV4cGxvcmVyID0gbmV3IFRlYWNoZXJFeHBsb3Jlcih0aGlzLCBjbGFzc2RhdGEpO1xyXG4gICAgICAgIHRoaXMudGVhY2hlckV4cGxvcmVyLmluaXRHVUkoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gbG9hZFdvcmtzcGFjZSgpIHtcclxuICAgIC8vICAgICB0aGlzLndvcmtzcGFjZUxpc3QucHVzaChnZXRNb2NrdXBXb3Jrc3BhY2UodGhpcykpO1xyXG4gICAgLy8gICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnJlbmRlcldvcmtzcGFjZXModGhpcy53b3Jrc3BhY2VMaXN0KTtcclxuICAgIC8vICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zZXRXb3Jrc3BhY2VBY3RpdmUodGhpcy53b3Jrc3BhY2VMaXN0WzBdKTtcclxuICAgIC8vICAgICB0aGlzLmNoZWNrU3RhcnR1cENvbXBsZXRlKCk7XHJcblxyXG4gICAgLy8gfVxyXG5cclxuICAgIGNoZWNrU3RhcnR1cENvbXBsZXRlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhcnR1cENvbXBsZXRlLS07XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnR1cENvbXBsZXRlID09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbml0VHlwZXMoKSB7XHJcbiAgICAgICAgdm9pZFByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGludFByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGZsb2F0UHJpbWl0aXZlVHlwZS5pbml0KCk7XHJcbiAgICAgICAgZG91YmxlUHJpbWl0aXZlVHlwZS5pbml0KCk7XHJcbiAgICAgICAgYm9vbGVhblByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIHN0cmluZ1ByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGNoYXJQcmltaXRpdmVUeXBlLmluaXQoKTtcclxuXHJcbiAgICAgICAgSW50ZWdlclR5cGUuaW5pdCgpO1xyXG4gICAgICAgIEZsb2F0VHlwZS5pbml0KCk7XHJcbiAgICAgICAgRG91YmxlVHlwZS5pbml0KCk7XHJcbiAgICAgICAgQ2hhcmFjdGVyVHlwZS5pbml0KCk7XHJcbiAgICAgICAgQm9vbGVhblR5cGUuaW5pdCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGFydCgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMud2FpdEZvckdVSUNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy53YWl0Rm9yR1VJQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgdGhhdC5nZXRNb25hY29FZGl0b3IoKS5sYXlvdXQoKTtcclxuICAgICAgICB9LCAyMDApO1xyXG5cclxuICAgICAgICB0aGlzLmNvbXBpbGVyID0gbmV3IENvbXBpbGVyKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRUaW1lcigpIHtcclxuICAgICAgICBpZiAodGhpcy50aW1lckhhbmRsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lckhhbmRsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy50aW1lckhhbmRsZSA9IHNldEludGVydmFsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoYXQuY29tcGlsZUlmRGlydHkoKTtcclxuXHJcbiAgICAgICAgfSwgNTAwKTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGVJZkRpcnR5KCkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50V29ya3NwYWNlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5pc0RpcnR5KCkgJiZcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlci5jb21waWxlclN0YXR1cyAhPSBDb21waWxlclN0YXR1cy5jb21waWxpbmdcclxuICAgICAgICAgICAgJiYgdGhpcy5pbnRlcnByZXRlci5zdGF0ZSAhPSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmdcclxuICAgICAgICAgICAgJiYgdGhpcy5pbnRlcnByZXRlci5zdGF0ZSAhPSBJbnRlcnByZXRlclN0YXRlLnBhdXNlZCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZXIuY29tcGlsZSh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBlcnJvcnMgPSB0aGlzLmJvdHRvbURpdj8uZXJyb3JNYW5hZ2VyPy5zaG93RXJyb3JzKHRoaXMuY3VycmVudFdvcmtzcGFjZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5yZW5kZXJFcnJvckNvdW50KHRoaXMuY3VycmVudFdvcmtzcGFjZSwgZXJyb3JzKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKG51bGwpOyAvLyBtYXJrIG9jY3VycmVuY2llcyBvZiBzeW1ib2wgdW5kZXIgY3Vyc29yXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludFByb2dyYW0oKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcm9qZWN0RXhwbG9yZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnZlcnNpb24rKztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRhYmxlID0gdGhpcy5pbnRlcnByZXRlci5nZXRTdGFydGFibGVNb2R1bGUodGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlKSAhPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGFydGFibGUgJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb3B5RXhlY3V0YWJsZU1vZHVsZVN0b3JlVG9JbnRlcnByZXRlcigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmludGVycHJldGVyLmluaXQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0YWJsZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUuZG9uZSB8fCB0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUuZXJyb3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5kcmF3Q2xhc3NEaWFncmFtcyghdGhpcy5yaWdodERpdi5pc0NsYXNzRGlhZ3JhbUVuYWJsZWQoKSk7XHJcblxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21waWxlci5jb21waWxlclN0YXR1cyA9IENvbXBpbGVyU3RhdHVzLmVycm9yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgICBwcmludFByb2dyYW0oKSB7XHJcblxyXG4gICAgICAgIHRoaXMuYm90dG9tRGl2LnByaW50TW9kdWxlVG9Cb3R0b21EaXYodGhpcy5jdXJyZW50V29ya3NwYWNlLCB0aGlzLnByb2plY3RFeHBsb3Jlci5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdDbGFzc0RpYWdyYW1zKG9ubHlVcGRhdGVJZGVudGlmaWVyczogYm9vbGVhbikge1xyXG4gICAgICAgIGNsZWFyVGltZW91dCh0aGlzLmRlYm91bmNlRGlhZ3JhbURyYXdpbmcpO1xyXG4gICAgICAgIHRoaXMuZGVib3VuY2VEaWFncmFtRHJhd2luZyA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnJpZ2h0RGl2Py5jbGFzc0RpYWdyYW0/LmRyYXdEaWFncmFtKHRoaXMuY3VycmVudFdvcmtzcGFjZSwgb25seVVwZGF0ZUlkZW50aWZpZXJzKTtcclxuICAgICAgICB9LCA1MDApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvcHlFeGVjdXRhYmxlTW9kdWxlU3RvcmVUb0ludGVycHJldGVyKCkge1xyXG4gICAgICAgIGxldCBtcyA9IHRoaXMuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5jb3B5KCk7XHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci5tb2R1bGVTdG9yZSA9IG1zO1xyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIubW9kdWxlU3RvcmVWZXJzaW9uID0gdGhpcy52ZXJzaW9uO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5pbnRlcnByZXRlci5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCAmJiB0aGlzLnByb2dyYW1Jc0V4ZWN1dGFibGUpIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLmRvbmUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlV29ya3NwYWNlKHc6IFdvcmtzcGFjZSkge1xyXG4gICAgICAgIHRoaXMud29ya3NwYWNlTGlzdC5zcGxpY2UodGhpcy53b3Jrc3BhY2VMaXN0LmluZGV4T2YodyksIDEpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlc3RvcmVXb3Jrc3BhY2VzKHdvcmtzcGFjZXM6IFdvcmtzcGFjZXMpIHtcclxuXHJcbiAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5jdXJyZW50V29ya3NwYWNlID0gbnVsbDtcclxuICAgICAgICAvLyB0aGlzLm1vbmFjby5zZXRNb2RlbChtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKFwiS2VpbmUgRGF0ZWkgdm9yaGFuZGVuLlwiICwgXCJ0ZXh0XCIpKTtcclxuICAgICAgICB0aGlzLmdldE1vbmFjb0VkaXRvcigpLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgd3Mgb2Ygd29ya3NwYWNlcy53b3Jrc3BhY2VzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgd29ya3NwYWNlOiBXb3Jrc3BhY2UgPSBXb3Jrc3BhY2UucmVzdG9yZUZyb21EYXRhKHdzLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0LnB1c2god29ya3NwYWNlKTtcclxuICAgICAgICAgICAgaWYgKHdzLmlkID09IHRoaXMudXNlci5jdXJyZW50V29ya3NwYWNlX2lkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRXb3Jrc3BhY2UgPSB3b3Jrc3BhY2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnJlbmRlcldvcmtzcGFjZXModGhpcy53b3Jrc3BhY2VMaXN0KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdvcmtzcGFjZSA9PSBudWxsICYmIHRoaXMud29ya3NwYWNlTGlzdC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFdvcmtzcGFjZSA9IHRoaXMud29ya3NwYWNlTGlzdFswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zZXRXb3Jrc3BhY2VBY3RpdmUodGhpcy5jdXJyZW50V29ya3NwYWNlLCB0cnVlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zZXRNb2R1bGVBY3RpdmUobnVsbCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy53b3Jrc3BhY2VMaXN0Lmxlbmd0aCA9PSAwKSB7XHJcblxyXG4gICAgICAgICAgICBIZWxwZXIuc2hvd0hlbHBlcihcIm5ld1dvcmtzcGFjZUhlbHBlclwiLCB0aGlzLCB0aGlzLnByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuJGNhcHRpb25FbGVtZW50KTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY3JlYXRlTmV3V29ya3NwYWNlKG5hbWU6IHN0cmluZywgb3duZXJfaWQ6IG51bWJlcik6IFdvcmtzcGFjZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBXb3Jrc3BhY2UobmFtZSwgdGhpcywgb3duZXJfaWQpO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuXHJcbiJdfQ==