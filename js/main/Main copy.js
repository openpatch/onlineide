import { NetworkManager } from "../communication/NetworkManager.js";
import { Compiler, CompilerStatus } from "../compiler/Compiler.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
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
export class Main {
    constructor() {
        this.workspaceList = [];
        this.startupComplete = 2;
        this.programIsExecutable = false;
        this.version = 0;
    }
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
    initGUI() {
        this.login = new Login(this);
        this.login.initGUI();
        this.actionManager = new ActionManager();
        this.actionManager.init();
        this.networkManager = new NetworkManager(this, $('#bottomdiv-outer .jo_updateTimerDiv'));
        let sliders = new Sliders(this);
        sliders.initSliders();
        this.mainMenu = new MainMenu(this);
        this.projectExplorer = new ProjectExplorer(this, $('#leftpanel>.jo_projectexplorer'));
        this.projectExplorer.initGUI();
        this.bottomDiv = new BottomDiv(this, $('#bottomdiv-outer>.jo_bottomdiv-inner'));
        this.rightDiv = new RightDiv(this, $('#rightdiv-inner'));
        this.rightDiv.initGUI();
        this.debugger = new Debugger(this, $('#leftpanel>.jo_debugger'), $('#leftpanel>.jo_projectexplorer'));
        this.interpreter = new Interpreter(this, this.debugger, new ProgramControlButtons($('#controls'), $('#editor')), $('#rightdiv-inner .jo_run'));
        this.interpreter.initGUI();
        this.initTypes();
        this.checkStartupComplete();
        this.correctPIXITransform();
        PIXI.utils.skipHello(); // don't show PIXI-Message in browser console
        this.themeManager = new ThemeManager();
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
        this.editor = new Editor(this);
        new Formatter().init();
        // this.monaco_editor = 
        this.editor.initGUI($('#editor'));
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
            this.compiler.compilerStatus != CompilerStatus.compiling) {
            try {
                this.compiler.moduleStore = this.currentWorkspace.moduleStore;
                this.compiler.compile();
                let errors = (_b = (_a = this.bottomDiv) === null || _a === void 0 ? void 0 : _a.errorManager) === null || _b === void 0 ? void 0 : _b.showErrors(this.currentWorkspace);
                this.projectExplorer.renderErrorCount(this.currentWorkspace, errors);
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
            this.projectExplorer.setWorkspaceActive(this.currentWorkspace);
        }
        if (this.workspaceList.length == 0) {
            Helper.showHelper("newWorkspaceHelper", this, this.projectExplorer.workspaceListPanel.$captionElement);
        }
    }
}
// export var main: Main;
$(function () {
    let main = new Main();
    //@ts-ignore
    window.require.config({ paths: { 'vs': 'lib/monaco-editor/dev/vs' } });
    //@ts-ignore
    window.require.config({
        'vs/nls': {
            availableLanguages: {
                '*': 'de'
            }
        },
        ignoreDuplicateModules: ["vs/editor/editor.main"]
    });
    //@ts-ignore
    window.require(['vs/editor/editor.main'], function () {
        main.initEditor();
        main.getMonacoEditor().updateOptions({ readOnly: true });
        main.bottomDiv.initGUI();
        // main.loadWorkspace();
    });
    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
    main.initGUI();
});
//# sourceMappingURL=Main copy.js.map