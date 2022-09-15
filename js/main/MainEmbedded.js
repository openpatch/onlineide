import { Compiler, CompilerStatus } from "../compiler/Compiler.js";
import { booleanPrimitiveType, charPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Debugger } from "../interpreter/Debugger.js";
import { Interpreter, InterpreterState } from "../interpreter/Interpreter.js";
import { ActionManager } from "./gui/ActionManager.js";
import { BottomDiv } from "./gui/BottomDiv.js";
import { Editor } from "./gui/Editor.js";
import { Formatter } from "./gui/Formatter.js";
import { ProgramControlButtons } from "./gui/ProgramControlButtons.js";
import { RightDiv } from "./gui/RightDiv.js";
import { ThemeManager } from "./gui/ThemeManager.js";
export class MainEmbedded {
    constructor() {
        this.startupComplete = 2;
        this.programIsExecutable = false;
        this.version = 0;
    }
    initGUI() {
        this.actionManager = new ActionManager();
        this.actionManager.init();
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
        new Formatter(this).init();
        this.monaco_editor = this.editor.initGUI();
        this.checkStartupComplete();
    }
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
            that.monaco_editor.layout();
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
                this.printProgram();
                this.version++;
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
}
// export var main: Main;
$(function () {
    let main = new MainEmbedded();
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
        main.monaco_editor.updateOptions({ readOnly: true });
        main.bottomDiv.initGUI();
        // main.loadWorkspace();
    });
    //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.Loader
        .shared.add("assets/graphics/spritesheet.json")
        .load(() => { });
    main.initGUI();
});
//# sourceMappingURL=MainEmbedded.js.map