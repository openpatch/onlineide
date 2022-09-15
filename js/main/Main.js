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
import { InconsistencyFixer } from "../workspace/InconsistencyFixer.js";
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
        let hashIndex = window.location.href.indexOf('#');
        if (hashIndex > 0) {
            var ticket = window.location.href.substr(hashIndex + 1);
            window.history.replaceState({}, "Online-IDE", window.location.href.substr(0, hashIndex));
            this.login.initGUI(true);
            this.login.loginWithTicket(ticket);
        }
        else {
            this.login.initGUI(false);
        }
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
        //        this.checkStartupComplete();
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
        $(window).on('unload', function () {
            if (navigator.sendBeacon && that.user != null) {
                that.networkManager.sendUpdates(null, false, true);
                that.networkManager.sendUpdateUserSettings(() => { });
                that.interpreter.closeAllWebsockets();
            }
        });
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
    restoreWorkspaces(workspaces, fixInconsistencies) {
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
        /**
         * Find inconsistencies and fix them
         */
        if (fixInconsistencies) {
            new InconsistencyFixer().start(this.workspaceList, this.networkManager, this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvbWFpbi9NYWluLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBQ25FLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxtQkFBbUIsRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDalEsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFDdEQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQztBQUMvQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0saUJBQWlCLENBQUM7QUFDekMsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQy9DLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sZ0NBQWdDLENBQUM7QUFDdkUsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQzNELE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxtQkFB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SUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDOUM7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtZQUVoQyxNQUFNLENBQUMsVUFBVSxDQUFDLG9CQUFvQixFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsZUFBZSxDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBRTFHO0lBR0wsQ0FBQztJQUVELGtCQUFrQixDQUFDLElBQVksRUFBRSxRQUFnQjtRQUM3QyxPQUFPLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDL0MsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2xhc3NEYXRhLCBVc2VyRGF0YSwgV29ya3NwYWNlcyB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgTmV0d29ya01hbmFnZXIgfSBmcm9tIFwiLi4vY29tbXVuaWNhdGlvbi9OZXR3b3JrTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBDb21waWxlciwgQ29tcGlsZXJTdGF0dXMgfSBmcm9tIFwiLi4vY29tcGlsZXIvQ29tcGlsZXIuanNcIjtcclxuaW1wb3J0IHsgYm9vbGVhblByaW1pdGl2ZVR5cGUsIGNoYXJQcmltaXRpdmVUeXBlLCBkb3VibGVQcmltaXRpdmVUeXBlLCBmbG9hdFByaW1pdGl2ZVR5cGUsIGludFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIHZvaWRQcmltaXRpdmVUeXBlLCBJbnRlZ2VyVHlwZSwgRG91YmxlVHlwZSwgQ2hhcmFjdGVyVHlwZSwgQm9vbGVhblR5cGUsIEZsb2F0VHlwZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBEZWJ1Z2dlciB9IGZyb20gXCIuLi9pbnRlcnByZXRlci9EZWJ1Z2dlci5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciwgSW50ZXJwcmV0ZXJTdGF0ZSB9IGZyb20gXCIuLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBBY3Rpb25NYW5hZ2VyIH0gZnJvbSBcIi4vZ3VpL0FjdGlvbk1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgQm90dG9tRGl2IH0gZnJvbSBcIi4vZ3VpL0JvdHRvbURpdi5qc1wiO1xyXG5pbXBvcnQgeyBFZGl0b3IgfSBmcm9tIFwiLi9ndWkvRWRpdG9yLmpzXCI7XHJcbmltcG9ydCB7IEZvcm1hdHRlciB9IGZyb20gXCIuL2d1aS9Gb3JtYXR0ZXIuanNcIjtcclxuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4vZ3VpL0hlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluTWVudSB9IGZyb20gXCIuL2d1aS9NYWluTWVudS5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtQ29udHJvbEJ1dHRvbnMgfSBmcm9tIFwiLi9ndWkvUHJvZ3JhbUNvbnRyb2xCdXR0b25zLmpzXCI7XHJcbmltcG9ydCB7IFByb2plY3RFeHBsb3JlciB9IGZyb20gXCIuL2d1aS9Qcm9qZWN0RXhwbG9yZXIuanNcIjtcclxuaW1wb3J0IHsgUmlnaHREaXYgfSBmcm9tIFwiLi9ndWkvUmlnaHREaXYuanNcIjtcclxuaW1wb3J0IHsgU2xpZGVycyB9IGZyb20gXCIuL2d1aS9TbGlkZXJzLmpzXCI7XHJcbmltcG9ydCB7IFRlYWNoZXJFeHBsb3JlciB9IGZyb20gXCIuL2d1aS9UZWFjaGVyRXhwbG9yZXIuanNcIjtcclxuaW1wb3J0IHsgVGhlbWVNYW5hZ2VyIH0gZnJvbSBcIi4vZ3VpL1RoZW1lTWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBMb2dpbiB9IGZyb20gXCIuL0xvZ2luLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4vTWFpbkJhc2UuanNcIlxyXG5pbXBvcnQgeyBNb2R1bGUsIEZpbGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBUZXh0UG9zaXRpb24gfSBmcm9tIFwiLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgVmlld01vZGVDb250cm9sbGVyIH0gZnJvbSBcIi4vZ3VpL1ZpZXdNb2RlQ29udHJvbGxlci5qc1wiO1xyXG5pbXBvcnQgeyBFcnJvck1hbmFnZXIgfSBmcm9tIFwiLi9ndWkvRXJyb3JNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFNlbWljb2xvbkFuZ2VsIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9TZW1pY29sb25BbmdlbC5qc1wiO1xyXG5pbXBvcnQgeyBTeW5jaHJvbml6YXRpb25NYW5hZ2VyIH0gZnJvbSBcIi4uL3JlcG9zaXRvcnkvc3luY2hyb25pemUvUmVwb3NpdG9yeVN5bmNocm9uaXphdGlvbk1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIgfSBmcm9tIFwiLi4vcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXIuanNcIjtcclxuaW1wb3J0IHsgUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlciB9IGZyb20gXCIuLi9yZXBvc2l0b3J5L3VwZGF0ZS9SZXBvc2l0b3J5U2V0dGluZ3NNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJlcG9zaXRvcnlDaGVja291dE1hbmFnZXIgfSBmcm9tIFwiLi4vcmVwb3NpdG9yeS91cGRhdGUvUmVwb3NpdG9yeUNoZWNrb3V0TWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBXaW5kb3dTdGF0ZU1hbmFnZXIgfSBmcm9tIFwiLi9ndWkvV2luZG93U3RhdGVNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbldpdGhNb2R1bGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgY2hlY2tJZk1vdXNlUHJlc2VudCB9IGZyb20gXCIuLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgSW5jb25zaXN0ZW5jeUZpeGVyIH0gZnJvbSBcIi4uL3dvcmtzcGFjZS9JbmNvbnNpc3RlbmN5Rml4ZXIuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNYWluIGltcGxlbWVudHMgTWFpbkJhc2Uge1xyXG5cclxuICAgIHBpeGlBcHA6IFBJWEkuQXBwbGljYXRpb247XHJcblxyXG4gICAgcmVwb3NpdG9yeU9uOiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICBpc0VtYmVkZGVkKCk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICBnZXRJbnRlcnByZXRlcigpOiBJbnRlcnByZXRlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJwcmV0ZXI7XHJcbiAgICB9XHJcbiAgICBnZXRDdXJyZW50V29ya3NwYWNlKCk6IFdvcmtzcGFjZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFdvcmtzcGFjZTtcclxuICAgIH1cclxuICAgIGdldERlYnVnZ2VyKCk6IERlYnVnZ2VyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWJ1Z2dlcjtcclxuICAgIH1cclxuICAgIGdldE1vbmFjb0VkaXRvcigpOiBtb25hY28uZWRpdG9yLklTdGFuZGFsb25lQ29kZUVkaXRvciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yLmVkaXRvcjtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSaWdodERpdigpOiBSaWdodERpdiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmlnaHREaXY7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qm90dG9tRGl2KCk6IEJvdHRvbURpdiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYm90dG9tRGl2O1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFZPUlNJQ0hUOiBnZ2YuIE1vZHVsZSAtPiBhbnlcclxuICAgIGdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpOiBNb2R1bGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnByb2plY3RFeHBsb3Jlci5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRBY3Rpb25NYW5hZ2VyKCk6IEFjdGlvbk1hbmFnZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmFjdGlvbk1hbmFnZXI7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd1Byb2dyYW1Qb2ludGVyUG9zaXRpb24oZmlsZTogRmlsZSwgcG9zaXRpb246IFRleHRQb3NpdGlvbikge1xyXG4gICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnNob3dQcm9ncmFtUG9pbnRlclBvc2l0aW9uKGZpbGUsIHBvc2l0aW9uKTtcclxuICAgIH1cclxuICAgIGhpZGVQcm9ncmFtUG9pbnRlclBvc2l0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLmhpZGVQcm9ncmFtUG9pbnRlclBvc2l0aW9uKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29tcGlsZXIoKTogQ29tcGlsZXIge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyO1xyXG4gICAgfVxyXG5cclxuICAgIHNldE1vZHVsZUFjdGl2ZShtb2R1bGU6IE1vZHVsZSkge1xyXG4gICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnNldE1vZHVsZUFjdGl2ZShtb2R1bGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFNlbWljb2xvbkFuZ2VsKCk6IFNlbWljb2xvbkFuZ2VsIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5zZW1pY29sb25BbmdlbDtcclxuICAgIH1cclxuXHJcbiAgICBqdW1wVG9EZWNsYXJhdGlvbihtb2R1bGU6IE1vZHVsZSwgZGVjbGFyYXRpb246IFRleHRQb3NpdGlvbldpdGhNb2R1bGUpIHtcclxuICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zZXRNb2R1bGVBY3RpdmUobW9kdWxlKTtcclxuICAgICAgICB0aGlzLmVkaXRvci5lZGl0b3IucmV2ZWFsTGluZUluQ2VudGVyKGRlY2xhcmF0aW9uLnBvc2l0aW9uLmxpbmUpO1xyXG4gICAgICAgIHRoaXMuZWRpdG9yLmVkaXRvci5zZXRQb3NpdGlvbih7Y29sdW1uOiBkZWNsYXJhdGlvbi5wb3NpdGlvbi5jb2x1bW4sIGxpbmVOdW1iZXI6IGRlY2xhcmF0aW9uLnBvc2l0aW9uLmxpbmV9KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgd29ya3NwYWNlTGlzdDogV29ya3NwYWNlW10gPSBbXTtcclxuICAgIHdvcmtzcGFjZXNPd25lcklkOiBudW1iZXI7XHJcblxyXG4gICAgLy8gbW9uYWNvX2VkaXRvcjogbW9uYWNvLmVkaXRvci5JU3RhbmRhbG9uZUNvZGVFZGl0b3I7XHJcbiAgICBlZGl0b3I6IEVkaXRvcjtcclxuICAgIGN1cnJlbnRXb3Jrc3BhY2U6IFdvcmtzcGFjZTtcclxuICAgIHByb2plY3RFeHBsb3JlcjogUHJvamVjdEV4cGxvcmVyO1xyXG4gICAgdGVhY2hlckV4cGxvcmVyOiBUZWFjaGVyRXhwbG9yZXI7XHJcbiAgICBuZXR3b3JrTWFuYWdlcjogTmV0d29ya01hbmFnZXI7XHJcbiAgICBhY3Rpb25NYW5hZ2VyOiBBY3Rpb25NYW5hZ2VyO1xyXG4gICAgbWFpbk1lbnU6IE1haW5NZW51O1xyXG5cclxuICAgIHN5bmNocm9uaXphdGlvbk1hbmFnZXI6IFN5bmNocm9uaXphdGlvbk1hbmFnZXI7XHJcbiAgICByZXBvc2l0b3J5Q3JlYXRlTWFuYWdlcjogUmVwb3NpdG9yeUNyZWF0ZU1hbmFnZXI7XHJcbiAgICByZXBvc2l0b3J5VXBkYXRlTWFuYWdlcjogUmVwb3NpdG9yeVNldHRpbmdzTWFuYWdlcjtcclxuICAgIHJlcG9zaXRvcnlDaGVja291dE1hbmFnZXI6IFJlcG9zaXRvcnlDaGVja291dE1hbmFnZXI7XHJcblxyXG4gICAgd2luZG93U3RhdGVNYW5hZ2VyOiBXaW5kb3dTdGF0ZU1hbmFnZXIgPSBuZXcgV2luZG93U3RhdGVNYW5hZ2VyKHRoaXMpO1xyXG5cclxuICAgIGxvZ2luOiBMb2dpbjtcclxuXHJcbiAgICBjb21waWxlcjogQ29tcGlsZXI7XHJcblxyXG4gICAgaW50ZXJwcmV0ZXI6IEludGVycHJldGVyO1xyXG5cclxuICAgIGRlYnVnZ2VyOiBEZWJ1Z2dlcjtcclxuXHJcbiAgICBzZW1pY29sb25BbmdlbDogU2VtaWNvbG9uQW5nZWw7XHJcblxyXG4gICAgYm90dG9tRGl2OiBCb3R0b21EaXY7XHJcblxyXG4gICAgc3RhcnR1cENvbXBsZXRlID0gMjtcclxuICAgIHdhaXRGb3JHVUlDYWxsYmFjazogKCkgPT4gdm9pZDtcclxuXHJcbiAgICBwcm9ncmFtSXNFeGVjdXRhYmxlID0gZmFsc2U7XHJcbiAgICB2ZXJzaW9uOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHRpbWVySGFuZGxlOiBhbnk7XHJcblxyXG4gICAgdXNlcjogVXNlckRhdGE7XHJcbiAgICB1c2VyRGF0YURpcnR5OiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgdGhlbWVNYW5hZ2VyOiBUaGVtZU1hbmFnZXI7XHJcblxyXG4gICAgcmlnaHREaXY6IFJpZ2h0RGl2O1xyXG5cclxuICAgIGRlYm91bmNlRGlhZ3JhbURyYXdpbmc6IGFueTtcclxuXHJcbiAgICB2aWV3TW9kZUNvbnRyb2xsZXI6IFZpZXdNb2RlQ29udHJvbGxlcjtcclxuXHJcbiAgICBpbml0R1VJKCkge1xyXG5cclxuICAgICAgICBjaGVja0lmTW91c2VQcmVzZW50KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgdGhpcy5sb2dpbiA9IG5ldyBMb2dpbih0aGlzKTtcclxuICAgICAgICBsZXQgaGFzaEluZGV4OiBudW1iZXIgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCcjJyk7XHJcbiAgICAgICAgaWYoaGFzaEluZGV4ID4gMCl7XHJcbiAgICBcclxuICAgICAgICAgICAgdmFyIHRpY2tldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnN1YnN0cihoYXNoSW5kZXggKyAxKTtcclxuICAgICAgICAgICAgd2luZG93Lmhpc3RvcnkucmVwbGFjZVN0YXRlKHt9LCBcIk9ubGluZS1JREVcIiwgd2luZG93LmxvY2F0aW9uLmhyZWYuc3Vic3RyKDAsIGhhc2hJbmRleCkpO1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2luLmluaXRHVUkodHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMubG9naW4ubG9naW5XaXRoVGlja2V0KHRpY2tldCk7XHJcbiAgICBcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmxvZ2luLmluaXRHVUkoZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIFxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hY3Rpb25NYW5hZ2VyID0gbmV3IEFjdGlvbk1hbmFnZXIobnVsbCwgdGhpcyk7XHJcbiAgICAgICAgdGhpcy5hY3Rpb25NYW5hZ2VyLmluaXQoKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXR3b3JrTWFuYWdlciA9IG5ldyBOZXR3b3JrTWFuYWdlcih0aGlzLCBqUXVlcnkoJyNib3R0b21kaXYtb3V0ZXIgLmpvX3VwZGF0ZVRpbWVyRGl2JykpO1xyXG5cclxuICAgICAgICBsZXQgc2xpZGVycyA9IG5ldyBTbGlkZXJzKHRoaXMpO1xyXG4gICAgICAgIHNsaWRlcnMuaW5pdFNsaWRlcnMoKTtcclxuICAgICAgICB0aGlzLm1haW5NZW51ID0gbmV3IE1haW5NZW51KHRoaXMpO1xyXG4gICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyID0gbmV3IFByb2plY3RFeHBsb3Jlcih0aGlzLCBqUXVlcnkoJyNsZWZ0cGFuZWw+LmpvX3Byb2plY3RleHBsb3JlcicpKTtcclxuICAgICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5pbml0R1VJKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYm90dG9tRGl2ID0gbmV3IEJvdHRvbURpdih0aGlzLCBqUXVlcnkoJyNib3R0b21kaXYtb3V0ZXI+LmpvX2JvdHRvbWRpdi1pbm5lcicpLCBqUXVlcnkoJ2JvZHknKSk7XHJcblxyXG4gICAgICAgIHRoaXMucmlnaHREaXYgPSBuZXcgUmlnaHREaXYodGhpcywgalF1ZXJ5KCcjcmlnaHRkaXYtaW5uZXInKSk7XHJcbiAgICAgICAgdGhpcy5yaWdodERpdi5pbml0R1VJKCk7XHJcblxyXG4gICAgICAgIHRoaXMuZGVidWdnZXIgPSBuZXcgRGVidWdnZXIodGhpcywgalF1ZXJ5KCcjbGVmdHBhbmVsPi5qb19kZWJ1Z2dlcicpLCBqUXVlcnkoJyNsZWZ0cGFuZWw+LmpvX3Byb2plY3RleHBsb3JlcicpKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlciA9IG5ldyBJbnRlcnByZXRlcih0aGlzLCB0aGlzLmRlYnVnZ2VyLFxyXG4gICAgICAgICAgICBuZXcgUHJvZ3JhbUNvbnRyb2xCdXR0b25zKGpRdWVyeSgnI2NvbnRyb2xzJyksIGpRdWVyeSgnI2VkaXRvcicpKSxcclxuICAgICAgICAgICAgalF1ZXJ5KCcjcmlnaHRkaXYtaW5uZXIgLmpvX3J1bicpKTtcclxuICAgICAgICB0aGlzLmludGVycHJldGVyLmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0VHlwZXMoKTtcclxuXHJcbiAgICAgICAgdGhpcy5jaGVja1N0YXJ0dXBDb21wbGV0ZSgpO1xyXG5cclxuICAgICAgICB0aGlzLmNvcnJlY3RQSVhJVHJhbnNmb3JtKCk7XHJcblxyXG4gICAgICAgIFBJWEkudXRpbHMuc2tpcEhlbGxvKCk7IC8vIGRvbid0IHNob3cgUElYSS1NZXNzYWdlIGluIGJyb3dzZXIgY29uc29sZVxyXG5cclxuICAgICAgICB0aGlzLnRoZW1lTWFuYWdlciA9IG5ldyBUaGVtZU1hbmFnZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy52aWV3TW9kZUNvbnRyb2xsZXIgPSBuZXcgVmlld01vZGVDb250cm9sbGVyKGpRdWVyeShcIiN2aWV3LW1vZGVcIiksIHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLnNlbWljb2xvbkFuZ2VsID0gbmV3IFNlbWljb2xvbkFuZ2VsKHRoaXMpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb3JyZWN0UElYSVRyYW5zZm9ybSgpIHtcclxuXHJcbiAgICAgICAgUElYSS5UcmFuc2Zvcm0ucHJvdG90eXBlLnVwZGF0ZVRyYW5zZm9ybSA9IGZ1bmN0aW9uIChwYXJlbnRUcmFuc2Zvcm0pIHtcclxuICAgICAgICAgICAgdmFyIGx0ID0gdGhpcy5sb2NhbFRyYW5zZm9ybTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuX2xvY2FsSUQgIT09IHRoaXMuX2N1cnJlbnRMb2NhbElEKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBnZXQgdGhlIG1hdHJpeCB2YWx1ZXMgb2YgdGhlIGRpc3BsYXlvYmplY3QgYmFzZWQgb24gaXRzIHRyYW5zZm9ybSBwcm9wZXJ0aWVzLi5cclxuICAgICAgICAgICAgICAgIC8vIGx0LmEgPSB0aGlzLl9jeCAqIHRoaXMuc2NhbGUueDtcclxuICAgICAgICAgICAgICAgIC8vIGx0LmIgPSB0aGlzLl9zeCAqIHRoaXMuc2NhbGUueDtcclxuICAgICAgICAgICAgICAgIC8vIGx0LmMgPSB0aGlzLl9jeSAqIHRoaXMuc2NhbGUueTtcclxuICAgICAgICAgICAgICAgIC8vIGx0LmQgPSB0aGlzLl9zeSAqIHRoaXMuc2NhbGUueTtcclxuICAgICAgICAgICAgICAgIC8vIGx0LnR4ID0gdGhpcy5wb3NpdGlvbi54IC0gKCh0aGlzLnBpdm90LnggKiBsdC5hKSArICh0aGlzLnBpdm90LnkgKiBsdC5jKSk7XHJcbiAgICAgICAgICAgICAgICAvLyBsdC50eSA9IHRoaXMucG9zaXRpb24ueSAtICgodGhpcy5waXZvdC54ICogbHQuYikgKyAodGhpcy5waXZvdC55ICogbHQuZCkpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5fY3VycmVudExvY2FsSUQgPSB0aGlzLl9sb2NhbElEO1xyXG4gICAgICAgICAgICAgICAgLy8gZm9yY2UgYW4gdXBkYXRlLi5cclxuICAgICAgICAgICAgICAgIHRoaXMuX3BhcmVudElEID0gLTE7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGlmICh0aGlzLl9wYXJlbnRJRCAhPT0gcGFyZW50VHJhbnNmb3JtLl93b3JsZElEKSB7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25jYXQgdGhlIHBhcmVudCBtYXRyaXggd2l0aCB0aGUgb2JqZWN0cyB0cmFuc2Zvcm0uXHJcbiAgICAgICAgICAgICAgICB2YXIgcHQgPSBwYXJlbnRUcmFuc2Zvcm0ud29ybGRUcmFuc2Zvcm07XHJcbiAgICAgICAgICAgICAgICB2YXIgd3QgPSB0aGlzLndvcmxkVHJhbnNmb3JtO1xyXG4gICAgICAgICAgICAgICAgd3QuYSA9IChsdC5hICogcHQuYSkgKyAobHQuYiAqIHB0LmMpO1xyXG4gICAgICAgICAgICAgICAgd3QuYiA9IChsdC5hICogcHQuYikgKyAobHQuYiAqIHB0LmQpO1xyXG4gICAgICAgICAgICAgICAgd3QuYyA9IChsdC5jICogcHQuYSkgKyAobHQuZCAqIHB0LmMpO1xyXG4gICAgICAgICAgICAgICAgd3QuZCA9IChsdC5jICogcHQuYikgKyAobHQuZCAqIHB0LmQpO1xyXG4gICAgICAgICAgICAgICAgd3QudHggPSAobHQudHggKiBwdC5hKSArIChsdC50eSAqIHB0LmMpICsgcHQudHg7XHJcbiAgICAgICAgICAgICAgICB3dC50eSA9IChsdC50eCAqIHB0LmIpICsgKGx0LnR5ICogcHQuZCkgKyBwdC50eTtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgdGhpcy5fcGFyZW50SUQgPSBwYXJlbnRUcmFuc2Zvcm0uX3dvcmxkSUQ7XHJcbiAgICAgICAgICAgICAgICAvLyB1cGRhdGUgdGhlIGlkIG9mIHRoZSB0cmFuc2Zvcm0uLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5fd29ybGRJRCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXRFZGl0b3IoKSB7XHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBuZXcgRWRpdG9yKHRoaXMsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICBuZXcgRm9ybWF0dGVyKCkuaW5pdCgpO1xyXG4gICAgICAgIC8vIHRoaXMubW9uYWNvX2VkaXRvciA9IFxyXG4gICAgICAgIHRoaXMuZWRpdG9yLmluaXRHVUkoalF1ZXJ5KCcjZWRpdG9yJykpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgalF1ZXJ5KHdpbmRvdykub24oJ3Jlc2l6ZScsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNib3R0b21kaXYtb3V0ZXInKS5jc3MoJ2hlaWdodCcsICcxNTBweCcpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNlZGl0b3InKS5jc3MoJ2hlaWdodCcsICh3aW5kb3cuaW5uZXJIZWlnaHQgLSAxNTAgLSAzMCAtIDIpICsgXCJweFwiKTtcclxuICAgICAgICAgICAgdGhhdC5lZGl0b3IuZWRpdG9yLmxheW91dCgpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNlZGl0b3InKS5jc3MoJ2hlaWdodCcsIFwiXCIpO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgalF1ZXJ5KHdpbmRvdykudHJpZ2dlcigncmVzaXplJyk7XHJcblxyXG4vLyAgICAgICAgdGhpcy5jaGVja1N0YXJ0dXBDb21wbGV0ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIGluaXRUZWFjaGVyRXhwbG9yZXIoY2xhc3NkYXRhOiBDbGFzc0RhdGFbXSkge1xyXG4gICAgICAgIHRoaXMudGVhY2hlckV4cGxvcmVyID0gbmV3IFRlYWNoZXJFeHBsb3Jlcih0aGlzLCBjbGFzc2RhdGEpO1xyXG4gICAgICAgIHRoaXMudGVhY2hlckV4cGxvcmVyLmluaXRHVUkoKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gbG9hZFdvcmtzcGFjZSgpIHtcclxuICAgIC8vICAgICB0aGlzLndvcmtzcGFjZUxpc3QucHVzaChnZXRNb2NrdXBXb3Jrc3BhY2UodGhpcykpO1xyXG4gICAgLy8gICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnJlbmRlcldvcmtzcGFjZXModGhpcy53b3Jrc3BhY2VMaXN0KTtcclxuICAgIC8vICAgICB0aGlzLnByb2plY3RFeHBsb3Jlci5zZXRXb3Jrc3BhY2VBY3RpdmUodGhpcy53b3Jrc3BhY2VMaXN0WzBdKTtcclxuICAgIC8vICAgICB0aGlzLmNoZWNrU3RhcnR1cENvbXBsZXRlKCk7XHJcblxyXG4gICAgLy8gfVxyXG5cclxuICAgIGNoZWNrU3RhcnR1cENvbXBsZXRlKCkge1xyXG4gICAgICAgIHRoaXMuc3RhcnR1cENvbXBsZXRlLS07XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhcnR1cENvbXBsZXRlID09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpbml0VHlwZXMoKSB7XHJcbiAgICAgICAgdm9pZFByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGludFByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGZsb2F0UHJpbWl0aXZlVHlwZS5pbml0KCk7XHJcbiAgICAgICAgZG91YmxlUHJpbWl0aXZlVHlwZS5pbml0KCk7XHJcbiAgICAgICAgYm9vbGVhblByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIHN0cmluZ1ByaW1pdGl2ZVR5cGUuaW5pdCgpO1xyXG4gICAgICAgIGNoYXJQcmltaXRpdmVUeXBlLmluaXQoKTtcclxuXHJcbiAgICAgICAgSW50ZWdlclR5cGUuaW5pdCgpO1xyXG4gICAgICAgIEZsb2F0VHlwZS5pbml0KCk7XHJcbiAgICAgICAgRG91YmxlVHlwZS5pbml0KCk7XHJcbiAgICAgICAgQ2hhcmFjdGVyVHlwZS5pbml0KCk7XHJcbiAgICAgICAgQm9vbGVhblR5cGUuaW5pdCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGFydCgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMud2FpdEZvckdVSUNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy53YWl0Rm9yR1VJQ2FsbGJhY2soKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgdGhhdC5nZXRNb25hY29FZGl0b3IoKS5sYXlvdXQoKTtcclxuICAgICAgICB9LCAyMDApO1xyXG5cclxuICAgICAgICB0aGlzLmNvbXBpbGVyID0gbmV3IENvbXBpbGVyKHRoaXMpO1xyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcclxuXHJcbiAgICAgICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKG5hdmlnYXRvci5zZW5kQmVhY29uICYmIHRoYXQudXNlciAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHRoYXQubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZXMobnVsbCwgZmFsc2UsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5uZXR3b3JrTWFuYWdlci5zZW5kVXBkYXRlVXNlclNldHRpbmdzKCgpID0+IHt9KTtcclxuICAgICAgICAgICAgICAgIHRoYXQuaW50ZXJwcmV0ZXIuY2xvc2VBbGxXZWJzb2NrZXRzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0VGltZXIoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudGltZXJIYW5kbGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMudGltZXJIYW5kbGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHRoaXMudGltZXJIYW5kbGUgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0aGF0LmNvbXBpbGVJZkRpcnR5KCk7XHJcblxyXG4gICAgICAgIH0sIDUwMCk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb21waWxlSWZEaXJ0eSgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdvcmtzcGFjZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUuaXNEaXJ0eSgpICYmXHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZXIuY29tcGlsZXJTdGF0dXMgIT0gQ29tcGlsZXJTdGF0dXMuY29tcGlsaW5nXHJcbiAgICAgICAgICAgICYmIHRoaXMuaW50ZXJwcmV0ZXIuc3RhdGUgIT0gSW50ZXJwcmV0ZXJTdGF0ZS5ydW5uaW5nXHJcbiAgICAgICAgICAgICYmIHRoaXMuaW50ZXJwcmV0ZXIuc3RhdGUgIT0gSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpIHtcclxuICAgICAgICAgICAgdHJ5IHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXBpbGVyLmNvbXBpbGUodGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZXJyb3JzID0gdGhpcy5ib3R0b21EaXY/LmVycm9yTWFuYWdlcj8uc2hvd0Vycm9ycyh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9qZWN0RXhwbG9yZXIucmVuZGVyRXJyb3JDb3VudCh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UsIGVycm9ycyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihudWxsKTsgLy8gbWFyayBvY2N1cnJlbmNpZXMgb2Ygc3ltYm9sIHVuZGVyIGN1cnNvclxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucHJpbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvamVjdEV4cGxvcmVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy52ZXJzaW9uKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHN0YXJ0YWJsZSA9IHRoaXMuaW50ZXJwcmV0ZXIuZ2V0U3RhcnRhYmxlTW9kdWxlKHRoaXMuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZSkgIT0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhcnRhYmxlICYmXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29weUV4ZWN1dGFibGVNb2R1bGVTdG9yZVRvSW50ZXJwcmV0ZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUuZG9uZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhpcy5pbnRlcnByZXRlci5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCFzdGFydGFibGUgJiZcclxuICAgICAgICAgICAgICAgICAgICAodGhpcy5pbnRlcnByZXRlci5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmRvbmUgfHwgdGhpcy5pbnRlcnByZXRlci5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmVycm9yKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5ub3RfaW5pdGlhbGl6ZWQpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZHJhd0NsYXNzRGlhZ3JhbXMoIXRoaXMucmlnaHREaXYuaXNDbGFzc0RpYWdyYW1FbmFibGVkKCkpO1xyXG5cclxuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZXIuY29tcGlsZXJTdGF0dXMgPSBDb21waWxlclN0YXR1cy5lcnJvcjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG4gICAgcHJpbnRQcm9ncmFtKCkge1xyXG5cclxuICAgICAgICB0aGlzLmJvdHRvbURpdi5wcmludE1vZHVsZVRvQm90dG9tRGl2KHRoaXMuY3VycmVudFdvcmtzcGFjZSwgdGhpcy5wcm9qZWN0RXhwbG9yZXIuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkcmF3Q2xhc3NEaWFncmFtcyhvbmx5VXBkYXRlSWRlbnRpZmllcnM6IGJvb2xlYW4pIHtcclxuICAgICAgICBjbGVhclRpbWVvdXQodGhpcy5kZWJvdW5jZURpYWdyYW1EcmF3aW5nKTtcclxuICAgICAgICB0aGlzLmRlYm91bmNlRGlhZ3JhbURyYXdpbmcgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5yaWdodERpdj8uY2xhc3NEaWFncmFtPy5kcmF3RGlhZ3JhbSh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UsIG9ubHlVcGRhdGVJZGVudGlmaWVycyk7XHJcbiAgICAgICAgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBjb3B5RXhlY3V0YWJsZU1vZHVsZVN0b3JlVG9JbnRlcnByZXRlcigpIHtcclxuICAgICAgICBsZXQgbXMgPSB0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUuY29weSgpO1xyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIubW9kdWxlU3RvcmUgPSBtcztcclxuICAgICAgICB0aGlzLmludGVycHJldGVyLm1vZHVsZVN0b3JlVmVyc2lvbiA9IHRoaXMudmVyc2lvbjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaW50ZXJwcmV0ZXIuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5ub3RfaW5pdGlhbGl6ZWQgJiYgdGhpcy5wcm9ncmFtSXNFeGVjdXRhYmxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZVdvcmtzcGFjZSh3OiBXb3Jrc3BhY2UpIHtcclxuICAgICAgICB0aGlzLndvcmtzcGFjZUxpc3Quc3BsaWNlKHRoaXMud29ya3NwYWNlTGlzdC5pbmRleE9mKHcpLCAxKTtcclxuICAgIH1cclxuXHJcbiAgICByZXN0b3JlV29ya3NwYWNlcyh3b3Jrc3BhY2VzOiBXb3Jrc3BhY2VzLCBmaXhJbmNvbnNpc3RlbmNpZXM6IGJvb2xlYW4pIHtcclxuXHJcbiAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0ID0gW107XHJcbiAgICAgICAgdGhpcy5jdXJyZW50V29ya3NwYWNlID0gbnVsbDtcclxuICAgICAgICAvLyB0aGlzLm1vbmFjby5zZXRNb2RlbChtb25hY28uZWRpdG9yLmNyZWF0ZU1vZGVsKFwiS2VpbmUgRGF0ZWkgdm9yaGFuZGVuLlwiICwgXCJ0ZXh0XCIpKTtcclxuICAgICAgICB0aGlzLmdldE1vbmFjb0VkaXRvcigpLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogdHJ1ZSB9KTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgd3Mgb2Ygd29ya3NwYWNlcy53b3Jrc3BhY2VzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgd29ya3NwYWNlOiBXb3Jrc3BhY2UgPSBXb3Jrc3BhY2UucmVzdG9yZUZyb21EYXRhKHdzLCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy53b3Jrc3BhY2VMaXN0LnB1c2god29ya3NwYWNlKTtcclxuICAgICAgICAgICAgaWYgKHdzLmlkID09IHRoaXMudXNlci5jdXJyZW50V29ya3NwYWNlX2lkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRXb3Jrc3BhY2UgPSB3b3Jrc3BhY2U7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqIEZpbmQgaW5jb25zaXN0ZW5jaWVzIGFuZCBmaXggdGhlbVxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIGlmKGZpeEluY29uc2lzdGVuY2llcyl7XHJcbiAgICAgICAgICAgIG5ldyBJbmNvbnNpc3RlbmN5Rml4ZXIoKS5zdGFydCh0aGlzLndvcmtzcGFjZUxpc3QsIHRoaXMubmV0d29ya01hbmFnZXIsIHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wcm9qZWN0RXhwbG9yZXIucmVuZGVyV29ya3NwYWNlcyh0aGlzLndvcmtzcGFjZUxpc3QpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50V29ya3NwYWNlID09IG51bGwgJiYgdGhpcy53b3Jrc3BhY2VMaXN0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50V29ya3NwYWNlID0gdGhpcy53b3Jrc3BhY2VMaXN0WzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdvcmtzcGFjZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnNldFdvcmtzcGFjZUFjdGl2ZSh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UsIHRydWUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucHJvamVjdEV4cGxvcmVyLnNldE1vZHVsZUFjdGl2ZShudWxsKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLndvcmtzcGFjZUxpc3QubGVuZ3RoID09IDApIHtcclxuXHJcbiAgICAgICAgICAgIEhlbHBlci5zaG93SGVscGVyKFwibmV3V29ya3NwYWNlSGVscGVyXCIsIHRoaXMsIHRoaXMucHJvamVjdEV4cGxvcmVyLndvcmtzcGFjZUxpc3RQYW5lbC4kY2FwdGlvbkVsZW1lbnQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjcmVhdGVOZXdXb3Jrc3BhY2UobmFtZTogc3RyaW5nLCBvd25lcl9pZDogbnVtYmVyKTogV29ya3NwYWNlIHtcclxuICAgICAgICByZXR1cm4gbmV3IFdvcmtzcGFjZShuYW1lLCB0aGlzLCBvd25lcl9pZCk7XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuIl19