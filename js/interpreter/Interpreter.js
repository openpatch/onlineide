import { TokenType } from "../compiler/lexer/Token.js";
import { ArrayType } from "../compiler/types/Array.js";
import { Klass, Interface } from "../compiler/types/Class.js";
import { Enum, EnumRuntimeObject } from "../compiler/types/Enum.js";
import { PrimitiveType, Method } from "../compiler/types/Types.js";
import { PrintManager } from "../main/gui/PrintManager.js";
import { RuntimeObject } from "./RuntimeObject.js";
import { intPrimitiveType, stringPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { InputManager } from "./InputManager.js";
import { Helper } from "../main/gui/Helper.js";
import { KeyboardTool } from "../tools/KeyboardTool.js";
import { GamepadTool } from "../tools/GamepadTool.js";
export var InterpreterState;
(function (InterpreterState) {
    InterpreterState[InterpreterState["not_initialized"] = 0] = "not_initialized";
    InterpreterState[InterpreterState["running"] = 1] = "running";
    InterpreterState[InterpreterState["paused"] = 2] = "paused";
    InterpreterState[InterpreterState["error"] = 3] = "error";
    InterpreterState[InterpreterState["done"] = 4] = "done";
    InterpreterState[InterpreterState["waitingForInput"] = 5] = "waitingForInput";
    InterpreterState[InterpreterState["waitingForTimersToEnd"] = 6] = "waitingForTimersToEnd";
})(InterpreterState || (InterpreterState = {}));
export class Interpreter {
    constructor(main, debugger_, controlButtons, $runDiv) {
        this.main = main;
        this.debugger_ = debugger_;
        this.controlButtons = controlButtons;
        this.moduleStoreVersion = -100;
        this.stepsPerSecond = 2;
        this.maxStepsPerSecond = 1000000;
        this.timerDelayMs = 10;
        this.programStack = [];
        this.stack = [];
        this.stackframes = [];
        this.heap = {};
        this.timerStopped = true;
        this.timerExtern = false;
        this.steps = 0;
        this.timeNetto = 0;
        this.timeWhenProgramStarted = 0;
        this.stepOverNestingLevel = 0;
        this.leaveLine = -1;
        this.additionalStepFinishedFlag = false;
        this.isFirstStatement = true;
        this.showProgrampointerUptoStepsPerSecond = 15;
        this.webSocketsToCloseAfterProgramHalt = [];
        this.actions = ["start", "pause", "stop", "stepOver",
            "stepInto", "stepOut", "restart"];
        // buttonActiveMatrix[button][i] tells if button is active at 
        // InterpreterState i
        this.buttonActiveMatrix = {
            "start": [false, false, true, true, true, false],
            "pause": [false, true, false, false, false, false],
            "stop": [false, true, true, false, false, true],
            "stepOver": [false, false, true, true, true, false],
            "stepInto": [false, false, true, true, true, false],
            "stepOut": [false, false, true, false, false, false],
            "restart": [false, true, true, true, true, true]
        };
        this.timerEvents = 0;
        this.lastStepTime = 0;
        this.lastTimeBetweenEvents = 0;
        this.lastPrintedModule = null;
        this.stepFinished = false;
        this.runningStates = [InterpreterState.paused, InterpreterState.running, InterpreterState.waitingForInput];
        this.printManager = new PrintManager($runDiv, this.main);
        this.inputManager = new InputManager($runDiv, this.main);
        if (main.isEmbedded()) {
            this.keyboardTool = new KeyboardTool(jQuery('html'), main);
        }
        else {
            this.keyboardTool = new KeyboardTool(jQuery(window), main);
        }
        this.gamepadTool = new GamepadTool();
        this.debugger = debugger_;
        controlButtons.setInterpreter(this);
        this.timeWhenProgramStarted = performance.now();
        this.steps = 0;
        this.timeNetto = 0;
        this.timerEvents = 0;
        this.timerDelayMs = 7;
        let that = this;
        let periodicFunction = () => {
            if (!that.timerExtern) {
                that.timerFunction(that.timerDelayMs, false, 0.7);
            }
        };
        this.timerId = setInterval(periodicFunction, this.timerDelayMs);
        let keepAliveRequest = { command: 5 };
        let req = JSON.stringify(keepAliveRequest);
        setInterval(() => {
            that.webSocketsToCloseAfterProgramHalt.forEach(ws => ws.send(req));
        }, 30000);
    }
    initGUI() {
        let that = this;
        let am = this.main.getActionManager();
        let startFunction = () => {
            that.stepOverNestingLevel = 1000000;
            that.start();
        };
        let pauseFunction = () => {
            that.pause();
        };
        am.registerAction("interpreter.start", ['F4'], () => {
            if (am.isActive("interpreter.start")) {
                startFunction();
            }
            else {
                pauseFunction();
            }
        }, "Programm starten", this.controlButtons.$buttonStart);
        am.registerAction("interpreter.pause", ['F4'], () => {
            if (am.isActive("interpreter.start")) {
                startFunction();
            }
            else {
                pauseFunction();
            }
        }, "Pause", this.controlButtons.$buttonPause);
        am.registerAction("interpreter.stop", [], () => {
            that.stop(false);
            that.steps = 0;
        }, "Programm anhalten", this.controlButtons.$buttonStop);
        // this.controlButtons.$buttonEdit.on('click', (e) => {
        //     e.stopPropagation();
        //     am.trigger('interpreter.stop');
        // });
        am.registerAction("interpreter.stepOver", ['F6'], () => {
            this.oneStep(false);
        }, "Einzelschritt (Step over)", this.controlButtons.$buttonStepOver);
        am.registerAction("interpreter.stepInto", ['F7'], () => {
            this.oneStep(true);
        }, "Einzelschritt (Step into)", this.controlButtons.$buttonStepInto);
        am.registerAction("interpreter.stepOut", [], () => {
            this.stepOut();
        }, "Step out", this.controlButtons.$buttonStepOut);
        am.registerAction("interpreter.restart", [], () => {
            that.stop(true);
        }, "Neu starten", this.controlButtons.$buttonRestart);
        this.setState(InterpreterState.not_initialized);
    }
    getStartableModule(moduleStore) {
        let cem;
        cem = this.main.getCurrentlyEditedModule();
        let currentlyEditedModuleIsClassOnly = false;
        // decide which module to start
        // first attempt: is currently edited Module startable?
        if (cem != null) {
            let currentlyEditedModule = moduleStore.findModuleByFile(cem.file);
            if (currentlyEditedModule != null) {
                currentlyEditedModuleIsClassOnly = !cem.hasErrors()
                    && !currentlyEditedModule.isStartable;
                if (currentlyEditedModule.isStartable) {
                    return currentlyEditedModule;
                }
            }
        }
        // second attempt: which module has been started last time?
        if (this.mainModule != null && currentlyEditedModuleIsClassOnly) {
            let lastMainModule = moduleStore.findModuleByFile(this.mainModule.file);
            if (lastMainModule != null && lastMainModule.isStartable) {
                return lastMainModule;
            }
        }
        // third attempt: pick first startable module of current workspace
        if (currentlyEditedModuleIsClassOnly) {
            for (let m of moduleStore.getModules(false)) {
                if (m.isStartable) {
                    return m;
                }
            }
        }
        return null;
    }
    /*
        After user clicks start button (or stepover/stepInto-Button when no program is running) this
        method ist called.
    */
    init() {
        var _a, _b, _c, _d;
        this.timerStopped = true;
        let cem = this.main.getCurrentlyEditedModule();
        cem.getBreakpointPositionsFromEditor();
        (_b = (_a = this.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.clearExceptions();
        /*
            As long as there is no startable new Version of current workspace we keep current compiled modules so
            that variables and objects defined/instantiated via console can be kept, too.
        */
        if (this.moduleStoreVersion != this.main.version && this.main.getCompiler().atLeastOneModuleIsStartable) {
            this.main.copyExecutableModuleStoreToInterpreter();
            this.heap = {}; // clear variables/objects defined via console
            (_d = (_c = this.main.getBottomDiv()) === null || _c === void 0 ? void 0 : _c.console) === null || _d === void 0 ? void 0 : _d.detachValues(); // detach values from console entries
        }
        let newMainModule = this.getStartableModule(this.moduleStore);
        if (newMainModule == null) {
            this.setState(InterpreterState.not_initialized);
            return;
        }
        this.mainModule = newMainModule;
        this.currentProgramPosition = 0;
        this.programStack = [];
        this.stack = [];
        this.stackframes = [];
        this.currentStackframe = 0;
        this.setState(InterpreterState.done);
        this.isFirstStatement = true;
        this.stepOverNestingLevel = 1000000;
        // Instantiate enum value-objects; initialize static attributes; call static constructors
        this.programStack.push({
            program: this.mainModule.mainProgram,
            programPosition: 0,
            textPosition: { line: 1, column: 1, length: 0 },
            method: "Hauptprogramm",
            callbackAfterReturn: null,
            isCalledFromOutside: "Hauptprogramm"
        });
        for (let m of this.moduleStore.getModules(false)) {
            this.initializeEnums(m);
            this.initializeClasses(m);
        }
        this.popProgram();
    }
    popProgram() {
        let p = this.programStack.pop();
        this.currentProgram = p.program;
        this.currentProgramPosition = p.programPosition;
        this.currentMethod = p.method;
        this.currentCallbackAfterReturn = p.callbackAfterReturn;
        this.currentIsCalledFromOutside = p.isCalledFromOutside;
        if (p.stackElementsToPushBeforeFirstExecuting != null) {
            this.stackframes.push(this.currentStackframe == null ? 0 : this.currentStackframe);
            this.currentStackframe = this.stack.length;
            for (let se of p.stackElementsToPushBeforeFirstExecuting)
                this.stack.push(se);
            p.stackElementsToPushBeforeFirstExecuting = null;
        }
    }
    initializeClasses(m) {
        for (let klass of m.typeStore.typeList) {
            if (klass instanceof Klass) {
                klass.staticClass.classObject = new RuntimeObject(klass.staticClass);
                klass.pushStaticInitializationPrograms(this.programStack);
            }
            if (klass instanceof Enum) {
                // let staticValueMap = klass.staticClass.classObject.attributeValues.get(klass.identifier);
                let staticValueList = klass.staticClass.classObject.attributes;
                for (let enumInfo of klass.enumInfoList) {
                    // staticValueMap.get(enumInfo.identifier).value = enumInfo.object;
                    staticValueList[enumInfo.ordinal].value = enumInfo.object;
                }
            }
        }
    }
    initializeEnums(m) {
        for (let enumClass of m.typeStore.typeList) {
            if (enumClass instanceof Enum) {
                enumClass.pushStaticInitializationPrograms(this.programStack);
                let valueList = [];
                let valueInitializationProgram = {
                    module: enumClass.module,
                    labelManager: null,
                    statements: []
                };
                let hasAttributeInitializationProgram = enumClass.attributeInitializationProgram.statements.length > 0;
                if (hasAttributeInitializationProgram) {
                    this.programStack.push({
                        program: valueInitializationProgram,
                        programPosition: 0,
                        textPosition: { line: 1, column: 1, length: 0 },
                        method: "Attribut-Initialisierung der Klasse " + enumClass.identifier,
                        callbackAfterReturn: null,
                        isCalledFromOutside: "Initialisierung eines Enums"
                    });
                }
                for (let enumInfo of enumClass.enumInfoList) {
                    enumInfo.object = new EnumRuntimeObject(enumClass, enumInfo);
                    valueList.push({
                        type: enumClass,
                        value: enumInfo.object
                    });
                    if (enumInfo.constructorCallProgram != null) {
                        this.programStack.push({
                            program: enumInfo.constructorCallProgram,
                            programPosition: 0,
                            textPosition: { line: 1, column: 1, length: 0 },
                            method: "Konstruktor von " + enumClass.identifier,
                            callbackAfterReturn: null,
                            isCalledFromOutside: "Initialisierung eines Enums"
                        });
                    }
                    if (hasAttributeInitializationProgram) {
                        valueInitializationProgram.statements.push({
                            type: TokenType.initializeEnumValue,
                            position: enumInfo.position,
                            enumClass: enumClass,
                            valueIdentifier: enumInfo.identifier
                        });
                    }
                }
                if (hasAttributeInitializationProgram) {
                    valueInitializationProgram.statements.push({
                        type: TokenType.programEnd,
                        position: { line: 0, column: 0, length: 1 }
                    });
                }
                enumClass.valueList = {
                    type: new ArrayType(enumClass),
                    value: valueList
                };
            }
        }
    }
    start(callback) {
        var _a, _b;
        (_b = (_a = this.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.clearErrors();
        this.callbackAfterExecution = callback;
        this.isFirstStatement = true;
        this.pauseUntil = null;
        if (this.state == InterpreterState.error || this.state == InterpreterState.done) {
            this.init();
            this.resetRuntime();
        }
        this.setState(InterpreterState.running);
        this.hideProgrampointerPosition();
        this.timeWhenProgramStarted = performance.now();
        this.timerStopped = false;
        this.getTimerClass().startTimer();
    }
    getTimerClass() {
        let baseModule = this.main.getCurrentWorkspace().moduleStore.getModule("Base Module");
        return baseModule.typeStore.getType("Timer");
    }
    timerFunction(timerDelayMs, forceRun, maxWorkloadFactor) {
        let t0 = performance.now();
        if (!forceRun) {
            let timeBetweenSteps = 1000 / this.stepsPerSecond;
            if (this.timerStopped || t0 - this.lastStepTime < timeBetweenSteps)
                return;
            this.lastStepTime = t0;
        }
        this.lastTimeBetweenEvents = t0 - this.lastStepTime;
        let n_stepsPerTimerGoal = forceRun ? Number.MAX_SAFE_INTEGER : this.stepsPerSecond * this.timerDelayMs / 1000;
        this.timerEvents++;
        let exception;
        let i = 0;
        while (i < n_stepsPerTimerGoal && !this.timerStopped && exception == null &&
            (performance.now() - t0) / timerDelayMs < maxWorkloadFactor) {
            exception = this.nextStep();
            if (exception != null) {
                break;
            }
            if (this.stepsPerSecond <= this.showProgrampointerUptoStepsPerSecond && !forceRun) {
                this.showProgramPointerAndVariables();
            }
            if (this.state == InterpreterState.error ||
                this.state == InterpreterState.done) {
                this.timerStopped = true;
            }
            if (this.stepOverNestingLevel < 0 && !this.timerStopped) {
                let node = this.currentProgram.statements[this.currentProgramPosition];
                let position = node.position;
                if (position == null || position.line != this.leaveLine) {
                    this.timerStopped = true;
                    this.setState(InterpreterState.paused);
                    if (this.comesStatement(TokenType.closeStackframe)) {
                        exception = this.nextStep();
                        if (exception == null && this.comesStatement(TokenType.programEnd)) {
                            exception = this.nextStep();
                        }
                    }
                }
            }
            i++;
        }
        if (exception != null) {
            this.throwException(exception);
        }
        if (this.timerStopped) {
            if (this.state == InterpreterState.paused || this.state == InterpreterState.waitingForInput) {
                this.showProgramPointerAndVariables();
            }
            if (this.callbackAfterExecution != null) {
                this.callbackAfterExecution();
                this.callbackAfterExecution = null;
            }
        }
        let dt = performance.now() - t0;
        this.timeNetto += dt;
        // if (
        //     this.timerEvents % 300 == 0) {
        //     console.log("Last time between Events: " + this.lastTimeBetweenEvents);
        // }
    }
    throwException(exception) {
        var _a, _b, _c;
        this.timerStopped = true;
        this.setState(InterpreterState.error);
        let $errorDiv = jQuery('<div class="jo_exception"></div>');
        let consolePresent = true;
        if (this.main.isEmbedded()) {
            let mainEmbedded = this.main;
            let config = mainEmbedded.config;
            if (config.withBottomPanel != true && config.withConsole != true) {
                consolePresent = false;
                let positionString = "";
                let currentStatement = this.currentProgram.statements[this.currentProgramPosition];
                if (currentStatement != null) {
                    let textPosition = currentStatement === null || currentStatement === void 0 ? void 0 : currentStatement.position;
                    positionString = " in Zeile " + textPosition.line + ", Spalte " + textPosition.column;
                    (_b = (_a = this.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.showError(this.currentProgram.module, textPosition);
                }
                alert("Fehler" + positionString + ": " + exception);
            }
        }
        if (consolePresent) {
            $errorDiv.append(jQuery("<span class='jo_error-caption'>Fehler:</span>&nbsp;" + exception + "<br>"));
            this.pushCurrentProgram();
            let first = true;
            for (let i = this.programStack.length - 1; i >= 0; i--) {
                let p = this.programStack[i];
                let m = (p.method instanceof Method) ? p.method.identifier : p.method;
                let s = "<span class='jo_error-caption'>" + (first ? "Ort" : "aufgerufen von") + ": </span>" + m;
                if (p.textPosition != null)
                    s += " <span class='jo_runtimeErrorPosition'>(Z " + p.textPosition.line + ", S " + p.textPosition.column + ")</span>";
                s += "<br>";
                let errorLine = jQuery(s);
                if (p.textPosition != null) {
                    let that = this;
                    jQuery(errorLine[2]).on('mousedown', () => {
                        var _a, _b;
                        (_b = (_a = that.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.showError(p.program.module, p.textPosition);
                    });
                }
                $errorDiv.append(errorLine);
                first = false;
                if (p.isCalledFromOutside != null) {
                    break;
                }
            }
            let console = (_c = this.main.getBottomDiv()) === null || _c === void 0 ? void 0 : _c.console;
            if (console != null) {
                console.writeConsoleEntry($errorDiv, null, 'rgba(255, 0, 0, 0.4');
                console.showTab();
            }
        }
    }
    hideProgrampointerPosition() {
        if (this.state == InterpreterState.running) {
            if (this.stepsPerSecond > this.showProgrampointerUptoStepsPerSecond) {
                this.main.hideProgramPointerPosition();
            }
        }
    }
    comesStatement(statement) {
        if (this.currentProgram == null)
            return false;
        if (this.currentProgramPosition > this.currentProgram.statements.length - 1)
            return false;
        return this.currentProgram.statements[this.currentProgramPosition].type == statement;
    }
    resetRuntime() {
        var _a, _b, _c;
        this.printManager.clear();
        (_a = this.worldHelper) === null || _a === void 0 ? void 0 : _a.destroyWorld();
        (_b = this.processingHelper) === null || _b === void 0 ? void 0 : _b.destroyWorld();
        (_c = this.gngEreignisbehandlungHelper) === null || _c === void 0 ? void 0 : _c.detachEvents();
        this.gngEreignisbehandlungHelper = null;
    }
    stop(restart = false) {
        var _a;
        this.inputManager.hide();
        this.setState(InterpreterState.paused);
        this.timerStopped = true;
        if (this.worldHelper != null) {
            this.worldHelper.spriteAnimations = [];
        }
        (_a = this.gngEreignisbehandlungHelper) === null || _a === void 0 ? void 0 : _a.detachEvents();
        this.gngEreignisbehandlungHelper = null;
        this.main.hideProgramPointerPosition();
        this.getTimerClass().stopTimer();
        if (this.worldHelper != null) {
            this.worldHelper.cacheAsBitmap();
        }
        this.heap = {};
        this.programStack = [];
        this.stack = [];
        this.stackframes = [];
        setTimeout(() => {
            this.setState(InterpreterState.done);
            this.main.hideProgramPointerPosition();
            if (restart) {
                this.start();
            }
        }, 500);
    }
    pause() {
        this.setState(InterpreterState.paused);
        this.showProgramPointerAndVariables();
        this.timerStopped = true;
    }
    showProgramPointerAndVariables() {
        if (this.currentProgram == null)
            return;
        let node = this.currentProgram.statements[this.currentProgramPosition];
        if (node == null)
            return;
        let position = node.position;
        if (position != null) {
            this.main.showProgramPointerPosition(this.currentProgram.module.file, position);
            this.debugger.showData(this.currentProgram, position, this.stack, this.currentStackframe, this.heap);
            let bottomDiv = this.main.getBottomDiv();
            if (bottomDiv.programPrinter != null) {
                if (this.currentProgram.module != this.lastPrintedModule) {
                    this.main.getBottomDiv().printModuleToBottomDiv(null, this.currentProgram.module);
                    this.lastPrintedModule = this.currentProgram.module;
                }
                this.main.getBottomDiv().programPrinter.showNode(node);
            }
        }
    }
    stepOut() {
        this.stepOverNestingLevel = 0;
        this.start();
    }
    oneStep(stepInto) {
        var _a, _b;
        (_b = (_a = this.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.clearErrors();
        this.isFirstStatement = true;
        if (this.state != InterpreterState.paused) {
            this.init();
            if (this.state == InterpreterState.not_initialized) {
                return;
            }
            this.resetRuntime();
            this.showProgramPointerAndVariables();
            this.setState(InterpreterState.paused);
            // Are there static Variables to initialize?
            if (this.currentMethod == "Hauptprogramm") {
                // No static variable initializers
                this.return;
            }
        }
        this.stepOverNestingLevel = 10000;
        let oldStepOverNestingLevel = this.stepOverNestingLevel;
        let node = this.currentProgram.statements[this.currentProgramPosition];
        let position = node.position;
        let exception = this.nextStep();
        if (exception != null) {
            this.throwException(exception);
            return;
        }
        if (!stepInto && this.stepOverNestingLevel > oldStepOverNestingLevel) {
            this.stepOverNestingLevel = 0;
            if (position != null) {
                this.leaveLine = position.line;
            }
            else {
                this.leaveLine = -1;
            }
            this.start();
        }
        else 
        //@ts-ignore
        if (this.state == InterpreterState.done) {
            this.main.hideProgramPointerPosition();
        }
        else {
            this.showProgramPointerAndVariables();
            //@ts-ignore
            if (this.state != InterpreterState.waitingForInput) {
                this.setState(InterpreterState.paused);
            }
        }
    }
    nextStep() {
        this.stepFinished = false;
        let node;
        let exception;
        while (!this.stepFinished && !this.additionalStepFinishedFlag && exception == null) {
            if (typeof this.currentProgram == "undefined") {
                debugger;
            }
            if (this.currentProgramPosition > this.currentProgram.statements.length - 1) {
                this.setState(InterpreterState.done);
                break;
            }
            node = this.currentProgram.statements[this.currentProgramPosition];
            if (node.stepFinished != null) {
                this.stepFinished = node.stepFinished;
            }
            exception = this.executeNode(node);
        }
        this.additionalStepFinishedFlag = false;
        this.steps++;
        return exception;
    }
    executeNode(node) {
        var _a, _b;
        if (node.breakpoint != null && !this.isFirstStatement) {
            this.additionalStepFinishedFlag = true;
            this.pause();
            return;
        }
        this.isFirstStatement = false;
        let stackTop = this.stack.length - 1;
        let stackframeBegin = this.currentStackframe;
        let stack = this.stack;
        let value;
        switch (node.type) {
            case TokenType.castValue:
                let relPos = node.stackPosRelative == null ? 0 : node.stackPosRelative;
                value = stack[stackTop + relPos];
                stack[stackTop + relPos] = value.type.castTo(value, node.newType);
                break;
            case TokenType.checkCast:
                value = stack[stackTop];
                if (value.value == null)
                    break;
                let rto = value.value;
                if (node.newType instanceof Klass) {
                    if (typeof rto == "object") {
                        if (!rto.class.hasAncestorOrIs(node.newType)) {
                            return ("Das Objekt der Klasse " + rto.class.identifier + " kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        }
                    }
                    else {
                        if (typeof rto == "number" && ["Integer", "Double", "Float"].indexOf(node.newType.identifier) < 0) {
                            return ("Eine Zahl kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        }
                        else if (typeof rto == "string" && ["String", "Character"].indexOf(node.newType.identifier) < 0) {
                            return ("Eine Zeichenkette kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        }
                        else if (typeof rto == "boolean" && node.newType.identifier != "Boolean") {
                            return ("Ein boolescher Wert kann nicht nach " + node.newType.identifier + " gecastet werden.");
                        }
                    }
                }
                else if (node.newType instanceof Interface) {
                    if (!rto.class.implementsInterface(node.newType)) {
                        return ("Das Objekt der Klasse " + rto.class.identifier + " implementiert nicht das Interface " + node.newType.identifier + ".");
                    }
                }
                break;
            case TokenType.localVariableDeclaration:
                let variable = node.variable;
                let type = variable.type;
                value = {
                    type: type,
                    value: null
                };
                if (type instanceof PrimitiveType) {
                    value.value = type.initialValue;
                }
                stack[variable.stackPos + stackframeBegin] = value;
                if (node.pushOnTopOfStackForInitialization) {
                    stack.push(value);
                }
                break;
            case TokenType.pushLocalVariableToStack:
                stack.push(stack[node.stackposOfVariable + stackframeBegin]);
                break;
            case TokenType.popAndStoreIntoVariable:
                stack[node.stackposOfVariable + stackframeBegin] = stack.pop();
                break;
            case TokenType.pushAttribute:
                let object1 = node.useThisObject ? stack[stackframeBegin].value : stack.pop().value;
                if (object1 == null)
                    return "Zugriff auf ein Attribut (" + node.attributeIdentifier + ") des null-Objekts";
                let value1 = object1.getValue(node.attributeIndex);
                if ((value1 === null || value1 === void 0 ? void 0 : value1.updateValue) != null) {
                    value1.updateValue(value1);
                }
                stack.push(value1);
                break;
            case TokenType.pushArrayLength:
                let a = stack.pop().value;
                if (a == null)
                    return "Zugriff auf das length-Attribut des null-Objekts";
                stack.push({ type: intPrimitiveType, value: a.length });
                break;
            case TokenType.assignment:
                value = stack.pop();
                stack[stackTop - 1].value = value.value;
                if (!(stack[stackTop - 1].type instanceof PrimitiveType)) {
                    stack[stackTop - 1].type = value.type;
                }
                if (!node.leaveValueOnStack) {
                    stack.pop();
                }
                break;
            case TokenType.plusAssignment:
                value = stack.pop();
                stack[stackTop - 1].value += value.value;
                break;
            case TokenType.minusAssignment:
                value = stack.pop();
                stack[stackTop - 1].value -= value.value;
                break;
            case TokenType.multiplicationAssignment:
                value = stack.pop();
                stack[stackTop - 1].value *= value.value;
                break;
            case TokenType.divisionAssignment:
                value = stack.pop();
                stack[stackTop - 1].value /= value.value;
                break;
            case TokenType.moduloAssignment:
                value = stack.pop();
                stack[stackTop - 1].value %= value.value;
                break;
            case TokenType.ANDAssigment:
                value = stack.pop();
                stack[stackTop - 1].value &= value.value;
                break;
            case TokenType.ORAssigment:
                value = stack.pop();
                stack[stackTop - 1].value |= value.value;
                break;
            case TokenType.XORAssigment:
                value = stack.pop();
                stack[stackTop - 1].value ^= value.value;
                break;
            case TokenType.shiftLeftAssigment:
                value = stack.pop();
                stack[stackTop - 1].value <<= value.value;
                break;
            case TokenType.shiftRightAssigment:
                value = stack.pop();
                stack[stackTop - 1].value >>= value.value;
                break;
            case TokenType.shiftRightUnsignedAssigment:
                value = stack.pop();
                stack[stackTop - 1].value >>>= value.value;
                break;
            case TokenType.binaryOp:
                let secondOperand = stack.pop();
                let resultValue = node.leftType.compute(node.operator, stack[stackTop - 1], secondOperand);
                let resultType = node.leftType.getResultType(node.operator, secondOperand.type);
                stack[stackTop - 1] = {
                    type: resultType,
                    value: resultValue
                };
                break;
            case TokenType.unaryOp:
                let oldValue = stack.pop();
                if (node.operator == TokenType.minus) {
                    stack.push({
                        type: oldValue.type,
                        value: -oldValue.value
                    });
                }
                else {
                    stack.push({
                        type: oldValue.type,
                        value: !oldValue.value
                    });
                }
                break;
            case TokenType.pushConstant:
                stack.push({
                    value: node.value,
                    type: node.dataType
                });
                break;
            case TokenType.pushStaticClassObject:
                if (node.klass instanceof Klass) {
                    stack.push({
                        type: node.klass.staticClass,
                        value: node.klass.staticClass.classObject
                    });
                }
                else {
                    // This is to enable instanceof operator with interfaces
                    stack.push({
                        type: node.klass,
                        value: node.klass
                    });
                }
                break;
            case TokenType.pushStaticAttribute:
                value = node.klass.classObject.getValue(node.attributeIndex);
                if (value.updateValue != null) {
                    value.updateValue(value);
                }
                stack.push(value);
                break;
            // case TokenType.pushStaticAttributeIntrinsic:
            //     value = node.
            //     stack.push({ type: node.attribute.type, value: node.attribute.updateValue(null) });
            //     break;
            case TokenType.selectArrayElement:
                let index = stack.pop();
                let array = stack.pop();
                if (array.value == null)
                    return "Zugriff auf ein Element eines null-Feldes";
                if (index.value >= array.value.length || index.value < 0) {
                    return "Zugriff auf das Element mit Index " + index.value + " eines Feldes der Länge " + array.value.length;
                }
                stack.push(array.value[index.value]);
                break;
            case TokenType.callMainMethod:
                this.stack.push({ value: node.staticClass.classObject, type: node.staticClass });
                let parameter = {
                    value: [{ value: "Test", type: stringPrimitiveType }],
                    type: new ArrayType(stringPrimitiveType)
                };
                let parameterBegin2 = stackTop + 2; // 1 parameter
                this.stack.push(parameter);
                this.stackframes.push(this.currentStackframe);
                this.programStack.push({
                    program: this.currentProgram,
                    programPosition: this.currentProgramPosition + 1,
                    textPosition: node.position,
                    method: this.currentMethod,
                    callbackAfterReturn: this.currentCallbackAfterReturn,
                    isCalledFromOutside: null
                });
                this.currentCallbackAfterReturn = null;
                this.currentStackframe = parameterBegin2;
                this.currentProgram = node.method.program;
                this.currentMethod = node.method;
                this.currentProgramPosition = -1; // gets increased after switch statement...
                for (let i = 0; i < node.method.reserveStackForLocalVariables; i++) {
                    stack.push(null);
                }
                // this.stepOverNestingLevel++;
                break;
            case TokenType.makeEllipsisArray:
                let ellipsisArray = stack.splice(stack.length - node.parameterCount, node.parameterCount);
                stack.push({
                    value: ellipsisArray,
                    type: node.arrayType
                });
                break;
            case TokenType.callMethod:
                // node.stackframebegin = -(parameters.parameterTypes.length + 1)
                let method = node.method;
                let parameterBegin = stackTop + 1 + node.stackframeBegin;
                let parameters1 = method.parameterlist.parameters;
                for (let i = parameterBegin + 1; i <= stackTop; i++) {
                    if (this.stack[i] != null && this.stack[i].type instanceof PrimitiveType) {
                        stack[i] = {
                            type: parameters1[i - parameterBegin - 1].type,
                            value: stack[i].value
                        };
                    }
                }
                if (stack[parameterBegin].value == null && !method.isStatic) {
                    return "Aufruf der Methode " + method.identifier + " des null-Objekts";
                }
                if (method.isAbstract || method.isVirtual && !node.isSuperCall) {
                    let object = stack[parameterBegin];
                    if (object.value instanceof RuntimeObject) {
                        method = object.value.class.getMethodBySignature(method.signature);
                    }
                    else {
                        method = object.type.getMethodBySignature(method.signature);
                    }
                }
                if (method == null) {
                    // TODO: raise runtime error
                    break;
                }
                if (method.invoke != null) {
                    let rt = method.getReturnType();
                    let parameters = stack.splice(parameterBegin);
                    let returnValue = method.invoke(parameters);
                    if (rt != null && rt.identifier != 'void') {
                        stack.push({
                            value: returnValue,
                            type: rt
                        });
                    }
                }
                else {
                    this.stackframes.push(this.currentStackframe);
                    this.programStack.push({
                        program: this.currentProgram,
                        programPosition: this.currentProgramPosition + 1,
                        textPosition: node.position,
                        method: this.currentMethod,
                        callbackAfterReturn: this.currentCallbackAfterReturn,
                        isCalledFromOutside: null
                    });
                    this.currentCallbackAfterReturn = null;
                    this.currentStackframe = parameterBegin;
                    this.currentProgram = method.program;
                    this.currentMethod = method;
                    this.currentProgramPosition = -1; // gets increased after switch statement...
                    for (let i = 0; i < method.reserveStackForLocalVariables; i++) {
                        stack.push(null);
                    }
                    this.stepOverNestingLevel++;
                    this.additionalStepFinishedFlag = true;
                }
                break;
            case TokenType.callInputMethod:
                // node.stackframebegin = -(parameters.parameterTypes.length + 1)
                let method1 = node.method;
                let parameterBegin1 = stackTop + 1 + node.stackframeBegin;
                let parameters = stack.splice(parameterBegin1);
                this.timerStopped = true;
                let oldState = this.state;
                this.setState(InterpreterState.waitingForInput);
                // this.main.showProgramPointerPosition(this.currentProgram.module.file, node.position);
                this.showProgramPointerAndVariables();
                let that = this;
                this.inputManager.readInput(method1, parameters, (value) => {
                    stack.push(value);
                    this.main.hideProgramPointerPosition();
                    that.setState(InterpreterState.paused);
                    if (oldState == InterpreterState.running) {
                        that.start();
                    }
                    else {
                        that.showProgramPointerAndVariables();
                        // that.oneStep(false);
                    }
                });
                break;
            case TokenType.return:
                this.return(node, stack);
                break;
            case TokenType.decreaseStackpointer:
                stack.splice(stackTop + 1 - node.popCount);
                break;
            case TokenType.initStackframe:
                this.stackframes.push(this.currentStackframe);
                this.currentStackframe = stackTop + 1;
                for (let i = 0; i < node.reserveForLocalVariables; i++) {
                    stack.push(null);
                }
                break;
            case TokenType.closeStackframe:
                stack.splice(stackframeBegin);
                this.currentStackframe = this.stackframes.pop();
                break;
            case TokenType.newObject:
                let object = new RuntimeObject(node.class);
                value = {
                    value: object,
                    type: node.class
                };
                stack.push(value);
                if (node.subsequentConstructorCall) {
                    stack.push(value);
                    stackTop++;
                }
                let klass = node.class;
                while (klass != null) {
                    let aip = klass.attributeInitializationProgram;
                    if (aip.statements.length > 0) {
                        this.stackframes.push(this.currentStackframe);
                        this.programStack.push({
                            program: this.currentProgram,
                            programPosition: this.currentProgramPosition + 1,
                            textPosition: node.position,
                            method: this.currentMethod,
                            callbackAfterReturn: this.currentCallbackAfterReturn,
                            isCalledFromOutside: null
                        });
                        this.currentCallbackAfterReturn = null;
                        this.currentStackframe = stackTop + 1;
                        this.currentProgram = aip;
                        this.currentProgramPosition = -1;
                        this.currentMethod = "Konstruktor von " + klass.identifier;
                        this.stepOverNestingLevel++;
                        this.additionalStepFinishedFlag = true;
                    }
                    klass = klass.baseClass;
                }
                // N.B.: constructor call is next statement
                break;
            case TokenType.processPostConstructorCallbacks:
                value = stack[stackTop];
                let classType = value.type;
                for (let pcc of classType.getPostConstructorCallbacks()) {
                    pcc(value.value);
                }
                break;
            case TokenType.extendedForLoopInit:
                stack[node.stackPosOfCounter + stackframeBegin] = {
                    type: intPrimitiveType,
                    value: 0
                };
                break;
            case TokenType.extendedForLoopCheckCounterAndGetElement:
                let counter = stack[node.stackPosOfCounter + stackframeBegin].value++;
                let collection = stack[node.stackPosOfCollection + stackframeBegin].value;
                switch (node.kind) {
                    case "array":
                        if (counter < collection.length) {
                            stack[node.stackPosOfElement + stackframeBegin].value = collection[counter].value;
                            stack[node.stackPosOfElement + stackframeBegin].type = collection[counter].type;
                        }
                        else {
                            this.currentProgramPosition = node.destination - 1;
                        }
                        break;
                    case "internalList":
                        let list = collection.intrinsicData["ListHelper"].valueArray;
                        if (counter < list.length) {
                            stack[node.stackPosOfElement + stackframeBegin].value = list[counter].value;
                            stack[node.stackPosOfElement + stackframeBegin].type = list[counter].type;
                        }
                        else {
                            this.currentProgramPosition = node.destination - 1;
                        }
                        break;
                    case "group":
                        let list1 = collection.intrinsicData["Actor"].shapes;
                        if (counter < list1.length) {
                            stack[node.stackPosOfElement + stackframeBegin].value = list1[counter];
                            stack[node.stackPosOfElement + stackframeBegin].type = list1[counter].klass;
                        }
                        else {
                            this.currentProgramPosition = node.destination - 1;
                        }
                        break;
                }
                break;
            case TokenType.incrementDecrementBefore:
                value = stack[stackTop];
                value.value += node.incrementDecrementBy;
                break;
            case TokenType.incrementDecrementAfter:
                value = stack[stackTop];
                // replace value by copy:
                stack[stackTop] = {
                    value: value.value,
                    type: value.type
                };
                // increment value which is not involved in subsequent 
                value.value += node.incrementDecrementBy;
                break;
            case TokenType.jumpAlways:
                this.currentProgramPosition = node.destination - 1;
                break;
            case TokenType.jumpIfTrue:
                value = stack.pop();
                if (value.value) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.jumpIfFalse:
                value = stack.pop();
                if (!value.value) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.jumpIfTrueAndLeaveOnStack:
                value = stack[stackTop];
                if (value.value) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.jumpIfFalseAndLeaveOnStack:
                value = stack[stackTop];
                if (!value.value) {
                    this.currentProgramPosition = node.destination - 1;
                }
                break;
            case TokenType.noOp:
                break;
            case TokenType.programEnd:
                if (this.programStack.length > 0) {
                    this.popProgram();
                    this.currentProgramPosition--; // gets increased later on after switch ends
                    this.additionalStepFinishedFlag = true;
                    this.leaveLine = -1;
                    if (node.pauseAfterProgramEnd) {
                        this.stepOverNestingLevel = -1;
                    }
                    break;
                }
                if ((this.worldHelper != null && this.worldHelper.hasActors()) || this.processingHelper != null
                    || (this.gngEreignisbehandlungHelper != null && this.gngEreignisbehandlungHelper.hasAktionsEmpfaenger())) {
                    this.currentProgramPosition--;
                    break;
                }
                let baseModule = this.main.getCurrentWorkspace().moduleStore.getModule("Base Module");
                let timerClass = baseModule.typeStore.getType("Timer");
                if (timerClass.timerEntries.length > 0) {
                    this.currentProgramPosition--;
                    break;
                }
                // this.setState(InterpreterState.done);
                this.currentProgram = null;
                this.currentProgramPosition = -1;
                this.additionalStepFinishedFlag = true;
                Helper.showHelper("speedControlHelper", this.main);
                this.printManager.showProgramEnd();
                if (this.steps > 0) {
                    let dt = performance.now() - this.timeWhenProgramStarted;
                    let message = 'Executed ' + this.steps + ' steps in ' + this.round(dt)
                        + ' ms (' + this.round(this.steps / dt * 1000) + ' steps/s)';
                    (_b = (_a = this.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.writeConsoleEntry(message, null);
                    // console.log(this.timerEvents + " TimeEvents in " + dt + " ms ergibt ein Event alle " + dt/this.timerEvents + " ms.");
                    // console.log("Vorgegebene Timerfrequenz: Alle " + this.timerDelayMs + " ms");
                    this.steps = -1;
                }
                // if (this.worldHelper != null) {
                //     this.worldHelper.spriteAnimations = [];
                // }
                // this.gngEreignisbehandlungHelper?.detachEvents();
                // this.gngEreignisbehandlungHelper = null;
                // this.main.hideProgramPointerPosition();
                // if(this.worldHelper != null){
                //     this.worldHelper.cacheAsBitmap();
                // }
                this.currentProgramPosition--;
                this.stop();
                break;
            case TokenType.print:
            case TokenType.println:
                let text = null;
                let color = null;
                if (node.withColor)
                    color = stack.pop().value;
                if (!node.empty)
                    text = stack.pop().value;
                if (node.type == TokenType.println) {
                    this.printManager.println(text, color);
                }
                else {
                    this.printManager.print(text, color);
                }
                break;
            case TokenType.pushEmptyArray:
                let counts = [];
                for (let i = 0; i < node.dimension; i++) {
                    counts.push(stack.pop().value);
                }
                stack.push(this.makeEmptyArray(counts, node.arrayType));
                break;
            case TokenType.beginArray:
                stack.push({
                    type: node.arrayType,
                    value: []
                });
                break;
            case TokenType.addToArray:
                stackTop -= node.numberOfElementsToAdd;
                // let values: Value[] = stack.splice(stackTop + 1, node.numberOfElementsToAdd);
                let values = stack.splice(stackTop + 1, node.numberOfElementsToAdd).map(tvo => ({ type: tvo.type, value: tvo.value }));
                stack[stackTop].value = stack[stackTop].value.concat(values);
                break;
            case TokenType.pushEnumValue:
                let enumInfo = node.enumClass.identifierToInfoMap[node.valueIdentifier];
                stack.push(node.enumClass.valueList.value[enumInfo.ordinal]);
                break;
            case TokenType.keywordSwitch:
                let switchValue = stack.pop().value;
                let destination = node.destinationMap[switchValue];
                if (destination != null) {
                    this.currentProgramPosition = destination - 1; // it will be increased after this switch-statement!
                }
                else {
                    if (node.defaultDestination != null) {
                        this.currentProgramPosition = node.defaultDestination - 1;
                    }
                    // there's a jumpnode after this node which jumps right after last switch case,
                    // so there's nothing more to do here.
                }
                break;
            case TokenType.heapVariableDeclaration:
                let v = node.variable;
                this.heap[v.identifier] = v;
                v.value = {
                    type: v.type,
                    value: (v.type instanceof PrimitiveType) ? v.type.initialValue : null
                };
                if (node.pushOnTopOfStackForInitialization) {
                    this.stack.push(v.value);
                }
                break;
            case TokenType.pushFromHeapToStack:
                let v1 = this.heap[node.identifier];
                if (v1 != null) {
                    this.stack.push(v1.value);
                }
                else {
                    return "Die Variable " + node.identifier + " ist nicht bekannt.";
                }
                break;
            case TokenType.returnIfDestroyed:
                let shapeRuntimeObject = this.stack[stackframeBegin].value;
                if (shapeRuntimeObject != null) {
                    let shape = shapeRuntimeObject.intrinsicData["Actor"];
                    if (shape["isDestroyed"] == true) {
                        this.return(null, stack);
                    }
                }
                break;
            case TokenType.setPauseDuration:
                let duration = this.stack.pop().value;
                if (this.pauseUntil == null) {
                    this.pauseUntil = performance.now() + duration;
                }
                break;
            case TokenType.pause:
                node.stepFinished = true;
                if (this.pauseUntil != null && performance.now() < this.pauseUntil) {
                    this.currentProgramPosition--;
                }
                else {
                    this.pauseUntil = null;
                }
                break;
        }
        this.currentProgramPosition++;
    }
    return(node, stack) {
        let currentCallbackAfterReturn = this.currentCallbackAfterReturn;
        if (node != null && node.copyReturnValueToStackframePos0) {
            let returnValue = stack.pop();
            stack[this.currentStackframe] = returnValue;
            stack.splice(this.currentStackframe + 1);
        }
        else {
            stack.splice(this.currentStackframe + ((node != null && node.leaveThisObjectOnStack) ? 1 : 0));
        }
        this.currentStackframe = this.stackframes.pop();
        this.popProgram();
        if (node != null && node.methodWasInjected == true)
            this.currentProgramPosition++;
        this.currentProgramPosition--; // position gets increased by one at the end of this switch-statement, so ... - 1
        this.stepOverNestingLevel--;
        if (currentCallbackAfterReturn != null) {
            currentCallbackAfterReturn(this);
        }
        if (this.stepOverNestingLevel < 0 && this.currentProgram.statements[this.currentProgramPosition + 1].type == TokenType.jumpAlways) {
            this.stepFinished = false;
        }
    }
    makeEmptyArray(counts, type) {
        let type1 = type.arrayOfType;
        if (counts.length == 1) {
            let array = [];
            for (let i = 0; i < counts[0]; i++) {
                let v = {
                    type: type1,
                    value: null
                };
                if (type1 instanceof PrimitiveType) {
                    v.value = type1.initialValue;
                }
                array.push(v);
            }
            return {
                type: type,
                value: array
            };
        }
        else {
            let array = [];
            let n = counts.pop();
            for (let i = 0; i < n; i++) {
                array.push(this.makeEmptyArray(counts, type1));
            }
            return {
                type: type,
                value: array
            };
        }
    }
    round(n) {
        return "" + Math.round(n * 10000) / 10000;
    }
    setState(state) {
        // console.log("Set state " + InterpreterState[state]);
        var _a;
        let oldState = this.state;
        this.state = state;
        if (state == InterpreterState.error || state == InterpreterState.done) {
            this.closeAllWebsockets();
        }
        let am = this.main.getActionManager();
        for (let actionId of this.actions) {
            am.setActive("interpreter." + actionId, this.buttonActiveMatrix[actionId][state]);
        }
        let buttonStartActive = this.buttonActiveMatrix['start'][state];
        if (buttonStartActive) {
            this.controlButtons.$buttonStart.show();
            this.controlButtons.$buttonPause.hide();
        }
        else {
            this.controlButtons.$buttonStart.hide();
            this.controlButtons.$buttonPause.show();
        }
        let buttonStopActive = this.buttonActiveMatrix['stop'][state];
        if (buttonStopActive) {
            // this.controlButtons.$buttonEdit.show();
        }
        else {
            // this.controlButtons.$buttonEdit.hide();
            if (this.worldHelper != null) {
                this.worldHelper.clearActorLists();
            }
            (_a = this.gngEreignisbehandlungHelper) === null || _a === void 0 ? void 0 : _a.detachEvents();
            this.gngEreignisbehandlungHelper = null;
        }
        if (this.runningStates.indexOf(oldState) >= 0 && this.runningStates.indexOf(state) < 0) {
            this.debugger.disable();
            // this.main.getMonacoEditor().updateOptions({ readOnly: false });
            this.keyboardTool.unsubscribeAllListeners();
        }
        if (this.runningStates.indexOf(oldState) < 0 && this.runningStates.indexOf(state) >= 0) {
            this.debugger.enable();
            // this.main.getMonacoEditor().updateOptions({ readOnly: true });
        }
    }
    closeAllWebsockets() {
        this.webSocketsToCloseAfterProgramHalt.forEach(socket => socket.close());
        this.webSocketsToCloseAfterProgramHalt = [];
    }
    pushCurrentProgram() {
        if (this.currentProgram == null)
            return;
        let textPosition;
        let currentStatement = this.currentProgram.statements[this.currentProgramPosition];
        if (currentStatement != null) {
            textPosition = currentStatement.position;
        }
        this.programStack.push({
            program: this.currentProgram,
            programPosition: this.currentProgramPosition,
            textPosition: textPosition,
            method: this.currentMethod,
            callbackAfterReturn: this.currentCallbackAfterReturn,
            isCalledFromOutside: this.currentIsCalledFromOutside
        });
        this.currentCallbackAfterReturn = null;
        this.currentIsCalledFromOutside = null;
    }
    // runTimer(method: Method, stackElements: Value[],
    //     callbackAfterReturn: (interpreter: Interpreter) => void) {
    //     if(this.state != InterpreterState.running){
    //         return;
    //     }
    //     this.pushCurrentProgram();
    //     this.currentProgram = method.program;
    //     this.currentMethod = method;
    //     this.currentProgramPosition = 0;
    //     this.currentCallbackAfterReturn = callbackAfterReturn;
    //     this.currentIsCalledFromOutside = "Timer";
    //     this.stackframes.push(this.currentStackframe);
    //     this.currentStackframe = this.stack.length;
    //     for (let se of stackElements) this.stack.push(se);
    //     let statements = method.program.statements;
    //     // if program ends with return then this return-statement decreases stepOverNestingLevel. So we increase it
    //     // beforehand to compensate this effect.
    //     if(statements[statements.length - 1].type == TokenType.return) this.stepOverNestingLevel++;
    // }
    runTimer(method, stackElements, callbackAfterReturn, isActor) {
        if (this.state != InterpreterState.running) {
            return;
        }
        let statements = method.program.statements;
        if (isActor || this.programStack.length == 0) {
            // Main Program is running => Timer has higher precedence
            this.pushCurrentProgram();
            this.currentProgram = method.program;
            this.currentMethod = method;
            this.currentProgramPosition = 0;
            this.currentCallbackAfterReturn = callbackAfterReturn;
            this.currentIsCalledFromOutside = "Timer";
            this.stackframes.push(this.currentStackframe);
            this.currentStackframe = this.stack.length;
            this.stack = this.stack.concat(stackElements);
            // for (let se of stackElements) this.stack.push(se);
            // if program ends with return then this return-statement decreases stepOverNestingLevel. So we increase it
            // beforehand to compensate this effect.
            if (statements[statements.length - 1].type == TokenType.return)
                this.stepOverNestingLevel++;
        }
        else {
            // another Timer is running => queue up
            // position 0 in program stack is main program
            // => insert timer in position 1
            this.programStack.splice(1, 0, {
                program: method.program,
                programPosition: 0,
                textPosition: { line: 0, column: 0, length: 0 },
                method: method,
                callbackAfterReturn: callbackAfterReturn,
                isCalledFromOutside: "Timer",
                stackElementsToPushBeforeFirstExecuting: stackElements
            });
            if (statements[statements.length - 1].type == TokenType.return)
                this.stepOverNestingLevel++;
        }
    }
    evaluate(program) {
        this.pushCurrentProgram();
        this.currentProgram = program;
        this.currentProgramPosition = 0;
        let stacksizeBefore = this.stack.length;
        let oldInterpreterState = this.state;
        let stepOverNestingLevel = this.stepOverNestingLevel;
        let additionalStepFinishedFlag = this.additionalStepFinishedFlag;
        let oldStackframe = this.currentStackframe;
        let error;
        let stepCount = 0;
        try {
            while (error == null &&
                (this.currentProgram != program || this.currentProgramPosition <
                    this.currentProgram.statements.length)
                && stepCount < 100000
            // && this.currentProgram == program
            ) {
                error = this.nextStep();
                stepCount++;
            }
        }
        catch (e) {
            error = "Fehler bei der Auswertung";
        }
        if (this.currentProgram == program && this.programStack.length > 0) {
            this.popProgram();
        }
        let stackTop;
        if (this.stack.length > stacksizeBefore) {
            stackTop = this.stack.pop();
            while (this.stack.length > stacksizeBefore) {
                this.stack.pop();
            }
        }
        this.stepOverNestingLevel = stepOverNestingLevel;
        this.additionalStepFinishedFlag = additionalStepFinishedFlag;
        this.setState(oldInterpreterState);
        return {
            error: error,
            value: stackTop
        };
    }
    executeImmediatelyInNewStackframe(program, valuesToPushBeforeExecuting) {
        this.pushCurrentProgram();
        this.currentProgram = program;
        let oldProgramPosition = this.currentProgramPosition;
        this.currentProgramPosition = 0;
        let numberOfStackframesBefore = this.stackframes.length;
        this.stackframes.push(this.currentStackframe);
        let stacksizeBefore = this.stack.length;
        this.currentStackframe = stacksizeBefore;
        for (let v of valuesToPushBeforeExecuting)
            this.stack.push(v);
        let oldInterpreterState = this.state;
        let stepOverNestingLevel = this.stepOverNestingLevel;
        let additionalStepFinishedFlag = this.additionalStepFinishedFlag;
        let stepCount = 0;
        let error = null;
        try {
            while (this.stackframes.length > numberOfStackframesBefore
                && stepCount < 100000 && error == null) {
                let node = this.currentProgram.statements[this.currentProgramPosition];
                error = this.executeNode(node);
                stepCount++;
            }
        }
        catch (e) {
            error = "Fehler bei der Auswertung";
        }
        if (stepCount == 100000)
            this.throwException("Die Ausführung des Konstruktors dauerte zu lange.");
        let stackTop;
        if (this.stack.length > stacksizeBefore) {
            stackTop = this.stack.pop();
            while (this.stack.length > stacksizeBefore) {
                this.stack.pop();
            }
        }
        this.stepOverNestingLevel = stepOverNestingLevel;
        this.additionalStepFinishedFlag = additionalStepFinishedFlag;
        // this.currentProgramPosition++;
        this.currentProgramPosition = oldProgramPosition;
        this.setState(oldInterpreterState);
        return {
            error: error,
            value: stackTop
        };
    }
    instantiateObjectImmediately(klass) {
        let object = new RuntimeObject(klass);
        let value = {
            value: object,
            type: klass
        };
        let klass1 = klass;
        while (klass1 != null) {
            let aip = klass1.attributeInitializationProgram;
            if (aip.statements.length > 0) {
                this.executeImmediatelyInNewStackframe(aip, [value]);
            }
            klass1 = klass1.baseClass;
        }
        let constructor = klass.getMethodBySignature(klass.identifier + "()");
        if (constructor != null && constructor.program != null) {
            // let programWithoutReturnStatement: Program = {
            //     labelManager: null,
            //     module: constructor.program.module,
            //     statements: constructor.program.statements.slice(0, constructor.program.statements.length - 1)
            // };
            this.executeImmediatelyInNewStackframe(constructor.program, [value]);
        }
        return object;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJwcmV0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2ludGVycHJldGVyL0ludGVycHJldGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBZ0IsU0FBUyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFHckUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDOUQsT0FBTyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxhQUFhLEVBQXFCLE1BQU0sRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3RGLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUczRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDNUYsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUUvQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFTeEQsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXRELE1BQU0sQ0FBTixJQUFZLGdCQUVYO0FBRkQsV0FBWSxnQkFBZ0I7SUFDeEIsNkVBQWUsQ0FBQTtJQUFFLDZEQUFPLENBQUE7SUFBRSwyREFBTSxDQUFBO0lBQUUseURBQUssQ0FBQTtJQUFFLHVEQUFJLENBQUE7SUFBRSw2RUFBZSxDQUFBO0lBQUUseUZBQXFCLENBQUE7QUFDekYsQ0FBQyxFQUZXLGdCQUFnQixLQUFoQixnQkFBZ0IsUUFFM0I7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O1lBQ1IsS0FBSyxFQUFFLE1BQU07WUFDYixJQUFJLEVBQUUsS0FBSztTQUNkLENBQUM7UUFFRixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFFbkIsT0FBTyxNQUFNLElBQUksSUFBSSxFQUFFO1lBQ25CLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQztZQUNoRCxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFFM0IsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFFeEQ7WUFDRCxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztTQUM3QjtRQUVELElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3RFLElBQUksV0FBVyxJQUFJLElBQUksSUFBSSxXQUFXLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtZQUNwRCxpREFBaUQ7WUFDakQsMEJBQTBCO1lBQzFCLDBDQUEwQztZQUMxQyxxR0FBcUc7WUFDckcsS0FBSztZQUNMLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN4RTtRQUVELE9BQU8sTUFBTSxDQUFDO0lBRWxCLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRQb3NpdGlvbiwgVG9rZW5UeXBlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSwgTW9kdWxlU3RvcmUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtLCBTdGF0ZW1lbnQsIFJldHVyblN0YXRlbWVudCB9IGZyb20gXCIuLi9jb21waWxlci9wYXJzZXIvUHJvZ3JhbS5qc1wiO1xyXG5pbXBvcnQgeyBBcnJheVR5cGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvQXJyYXkuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MsIEludGVyZmFjZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtLCBFbnVtUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9FbnVtLmpzXCI7XHJcbmltcG9ydCB7IFByaW1pdGl2ZVR5cGUsIFR5cGUsIFZhbHVlLCBIZWFwLCBNZXRob2QgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgUHJpbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL21haW4vZ3VpL1ByaW50TWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBEZWJ1Z2dlciB9IGZyb20gXCIuL0RlYnVnZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IGludFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgSW5wdXRNYW5hZ2VyIH0gZnJvbSBcIi4vSW5wdXRNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFdvcmxkSGVscGVyIH0gZnJvbSBcIi4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1dvcmxkLmpzXCI7XHJcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9tYWluL2d1aS9IZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgVGltZXJDbGFzcyB9IGZyb20gXCIuLi9ydW50aW1lbGlicmFyeS9UaW1lci5qc1wiO1xyXG5pbXBvcnQgeyBLZXlib2FyZFRvb2wgfSBmcm9tIFwiLi4vdG9vbHMvS2V5Ym9hcmRUb29sLmpzXCI7XHJcbmltcG9ydCB7IFByb2dyYW1Db250cm9sQnV0dG9ucyB9IGZyb20gXCIuLi9tYWluL2d1aS9Qcm9ncmFtQ29udHJvbEJ1dHRvbnMuanNcIjtcclxuaW1wb3J0IHsgTWFpbkJhc2UgfSBmcm9tIFwiLi4vbWFpbi9NYWluQmFzZS5qc1wiO1xyXG5pbXBvcnQgeyBMaXN0SGVscGVyIH0gZnJvbSBcIi4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0FycmF5TGlzdC5qc1wiO1xyXG5pbXBvcnQgeyBHcm91cEhlbHBlciB9IGZyb20gXCIuLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Hcm91cC5qc1wiO1xyXG5pbXBvcnQgeyBXZWJTb2NrZXRSZXF1ZXN0S2VlcEFsaXZlIH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluRW1iZWRkZWQgfSBmcm9tIFwiLi4vZW1iZWRkZWQvTWFpbkVtYmVkZGVkLmpzXCI7XHJcbmltcG9ydCB7IFByb2Nlc3NpbmdIZWxwZXIgfSBmcm9tIFwiLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUHJvY2Vzc2luZy5qc1wiO1xyXG5pbXBvcnQgeyBHTkdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIgfSBmcm9tIFwiLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR0VyZWlnbmlzYmVoYW5kbHVuZy5qc1wiO1xyXG5pbXBvcnQgeyBHYW1lcGFkVG9vbCB9IGZyb20gXCIuLi90b29scy9HYW1lcGFkVG9vbC5qc1wiO1xyXG5cclxuZXhwb3J0IGVudW0gSW50ZXJwcmV0ZXJTdGF0ZSB7XHJcbiAgICBub3RfaW5pdGlhbGl6ZWQsIHJ1bm5pbmcsIHBhdXNlZCwgZXJyb3IsIGRvbmUsIHdhaXRpbmdGb3JJbnB1dCwgd2FpdGluZ0ZvclRpbWVyc1RvRW5kXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFByb2dyYW1TdGFja0VsZW1lbnQgPSB7XHJcbiAgICBwcm9ncmFtOiBQcm9ncmFtLFxyXG4gICAgcHJvZ3JhbVBvc2l0aW9uOiBudW1iZXIsICAvLyBuZXh0IHBvc2l0aW9uIHRvIGV4ZWN1dGUgYWZ0ZXIgcmV0dXJuXHJcbiAgICB0ZXh0UG9zaXRpb246IFRleHRQb3NpdGlvbiwgLy8gdGV4dHBvc2l0aW9uIG9mIG1ldGhvZCBjYWxsXHJcbiAgICBtZXRob2Q6IE1ldGhvZCB8IHN0cmluZyxcclxuICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IChpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXIpID0+IHZvaWQsXHJcbiAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiBzdHJpbmcsXHJcbiAgICBzdGFja0VsZW1lbnRzVG9QdXNoQmVmb3JlRmlyc3RFeGVjdXRpbmc/OiBWYWx1ZVtdXHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJwcmV0ZXIge1xyXG5cclxuICAgIGRlYnVnZ2VyOiBEZWJ1Z2dlcjtcclxuXHJcbiAgICBtYWluTW9kdWxlOiBNb2R1bGU7XHJcbiAgICBtb2R1bGVTdG9yZTogTW9kdWxlU3RvcmU7XHJcbiAgICBtb2R1bGVTdG9yZVZlcnNpb246IG51bWJlciA9IC0xMDA7XHJcblxyXG4gICAgcHJpbnRNYW5hZ2VyOiBQcmludE1hbmFnZXI7XHJcbiAgICBpbnB1dE1hbmFnZXI6IElucHV0TWFuYWdlcjtcclxuXHJcbiAgICBzdGVwc1BlclNlY29uZCA9IDI7XHJcbiAgICBtYXhTdGVwc1BlclNlY29uZCA9IDEwMDAwMDA7XHJcbiAgICB0aW1lckRlbGF5TXMgPSAxMDtcclxuXHJcbiAgICB0aW1lcklkOiBhbnk7XHJcbiAgICBzdGF0ZTogSW50ZXJwcmV0ZXJTdGF0ZTtcclxuXHJcbiAgICBjdXJyZW50UHJvZ3JhbTogUHJvZ3JhbTtcclxuICAgIGN1cnJlbnRQcm9ncmFtUG9zaXRpb246IG51bWJlcjtcclxuICAgIGN1cnJlbnRNZXRob2Q6IE1ldGhvZCB8IHN0cmluZztcclxuICAgIGN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuOiAoaW50ZXJwcmV0ZXI6IEludGVycHJldGVyKSA9PiB2b2lkO1xyXG4gICAgY3VycmVudElzQ2FsbGVkRnJvbU91dHNpZGU6IHN0cmluZ1xyXG5cclxuICAgIHByb2dyYW1TdGFjazogUHJvZ3JhbVN0YWNrRWxlbWVudFtdID0gW107XHJcblxyXG4gICAgc3RhY2s6IFZhbHVlW10gPSBbXTtcclxuICAgIHN0YWNrZnJhbWVzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgY3VycmVudFN0YWNrZnJhbWU6IG51bWJlcjtcclxuXHJcbiAgICBoZWFwOiBIZWFwID0ge307XHJcblxyXG4gICAgdGltZXJTdG9wcGVkOiBib29sZWFuID0gdHJ1ZTtcclxuICAgIHRpbWVyRXh0ZXJuOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgc3RlcHM6IG51bWJlciA9IDA7XHJcbiAgICB0aW1lTmV0dG86IG51bWJlciA9IDA7XHJcbiAgICB0aW1lV2hlblByb2dyYW1TdGFydGVkOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHN0ZXBPdmVyTmVzdGluZ0xldmVsOiBudW1iZXIgPSAwO1xyXG4gICAgbGVhdmVMaW5lOiBudW1iZXIgPSAtMTtcclxuICAgIGFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgaXNGaXJzdFN0YXRlbWVudDogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgc2hvd1Byb2dyYW1wb2ludGVyVXB0b1N0ZXBzUGVyU2Vjb25kID0gMTU7XHJcblxyXG4gICAgd29ybGRIZWxwZXI6IFdvcmxkSGVscGVyO1xyXG4gICAgZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyOiBHTkdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXI7XHJcbiAgICBwcm9jZXNzaW5nSGVscGVyOiBQcm9jZXNzaW5nSGVscGVyO1xyXG5cclxuICAgIGtleWJvYXJkVG9vbDogS2V5Ym9hcmRUb29sO1xyXG4gICAgZ2FtZXBhZFRvb2w6IEdhbWVwYWRUb29sO1xyXG5cclxuICAgIHdlYlNvY2tldHNUb0Nsb3NlQWZ0ZXJQcm9ncmFtSGFsdDogV2ViU29ja2V0W10gPSBbXTtcclxuXHJcbiAgICBwYXVzZVVudGlsPzogbnVtYmVyO1xyXG5cclxuICAgIGFjdGlvbnM6IHN0cmluZ1tdID0gW1wic3RhcnRcIiwgXCJwYXVzZVwiLCBcInN0b3BcIiwgXCJzdGVwT3ZlclwiLFxyXG4gICAgICAgIFwic3RlcEludG9cIiwgXCJzdGVwT3V0XCIsIFwicmVzdGFydFwiXTtcclxuXHJcbiAgICAvLyBidXR0b25BY3RpdmVNYXRyaXhbYnV0dG9uXVtpXSB0ZWxscyBpZiBidXR0b24gaXMgYWN0aXZlIGF0IFxyXG4gICAgLy8gSW50ZXJwcmV0ZXJTdGF0ZSBpXHJcbiAgICBidXR0b25BY3RpdmVNYXRyaXg6IHsgW2J1dHRvbk5hbWU6IHN0cmluZ106IGJvb2xlYW5bXSB9ID0ge1xyXG4gICAgICAgIFwic3RhcnRcIjogW2ZhbHNlLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgZmFsc2VdLFxyXG4gICAgICAgIFwicGF1c2VcIjogW2ZhbHNlLCB0cnVlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgXCJzdG9wXCI6IFtmYWxzZSwgdHJ1ZSwgdHJ1ZSwgZmFsc2UsIGZhbHNlLCB0cnVlXSxcclxuICAgICAgICBcInN0ZXBPdmVyXCI6IFtmYWxzZSwgZmFsc2UsIHRydWUsIHRydWUsIHRydWUsIGZhbHNlXSxcclxuICAgICAgICBcInN0ZXBJbnRvXCI6IFtmYWxzZSwgZmFsc2UsIHRydWUsIHRydWUsIHRydWUsIGZhbHNlXSxcclxuICAgICAgICBcInN0ZXBPdXRcIjogW2ZhbHNlLCBmYWxzZSwgdHJ1ZSwgZmFsc2UsIGZhbHNlLCBmYWxzZV0sXHJcbiAgICAgICAgXCJyZXN0YXJ0XCI6IFtmYWxzZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZV1cclxuICAgIH1cclxuXHJcbiAgICBjYWxsYmFja0FmdGVyRXhlY3V0aW9uOiAoKSA9PiB2b2lkO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtYWluOiBNYWluQmFzZSwgcHVibGljIGRlYnVnZ2VyXzogRGVidWdnZXIsIHB1YmxpYyBjb250cm9sQnV0dG9uczogUHJvZ3JhbUNvbnRyb2xCdXR0b25zLFxyXG4gICAgICAgICRydW5EaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuICAgICAgICB0aGlzLnByaW50TWFuYWdlciA9IG5ldyBQcmludE1hbmFnZXIoJHJ1bkRpdiwgdGhpcy5tYWluKTtcclxuICAgICAgICB0aGlzLmlucHV0TWFuYWdlciA9IG5ldyBJbnB1dE1hbmFnZXIoJHJ1bkRpdiwgdGhpcy5tYWluKTtcclxuICAgICAgICBpZiAobWFpbi5pc0VtYmVkZGVkKCkpIHtcclxuICAgICAgICAgICAgdGhpcy5rZXlib2FyZFRvb2wgPSBuZXcgS2V5Ym9hcmRUb29sKGpRdWVyeSgnaHRtbCcpLCBtYWluKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkVG9vbCA9IG5ldyBLZXlib2FyZFRvb2woalF1ZXJ5KHdpbmRvdyksIG1haW4pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5nYW1lcGFkVG9vbCA9IG5ldyBHYW1lcGFkVG9vbCgpO1xyXG5cclxuICAgICAgICB0aGlzLmRlYnVnZ2VyID0gZGVidWdnZXJfO1xyXG5cclxuICAgICAgICBjb250cm9sQnV0dG9ucy5zZXRJbnRlcnByZXRlcih0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy50aW1lV2hlblByb2dyYW1TdGFydGVkID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdGhpcy5zdGVwcyA9IDA7XHJcbiAgICAgICAgdGhpcy50aW1lTmV0dG8gPSAwO1xyXG4gICAgICAgIHRoaXMudGltZXJFdmVudHMgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLnRpbWVyRGVsYXlNcyA9IDc7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHBlcmlvZGljRnVuY3Rpb24gPSAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoYXQudGltZXJFeHRlcm4pIHtcclxuICAgICAgICAgICAgICAgIHRoYXQudGltZXJGdW5jdGlvbih0aGF0LnRpbWVyRGVsYXlNcywgZmFsc2UsIDAuNyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnRpbWVySWQgPSBzZXRJbnRlcnZhbChwZXJpb2RpY0Z1bmN0aW9uLCB0aGlzLnRpbWVyRGVsYXlNcyk7XHJcbiAgICAgICAgbGV0IGtlZXBBbGl2ZVJlcXVlc3Q6IFdlYlNvY2tldFJlcXVlc3RLZWVwQWxpdmUgPSB7IGNvbW1hbmQ6IDUgfTtcclxuICAgICAgICBsZXQgcmVxID0gSlNPTi5zdHJpbmdpZnkoa2VlcEFsaXZlUmVxdWVzdCk7XHJcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LndlYlNvY2tldHNUb0Nsb3NlQWZ0ZXJQcm9ncmFtSGFsdC5mb3JFYWNoKHdzID0+IHdzLnNlbmQocmVxKSk7XHJcbiAgICAgICAgfSwgMzAwMDApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0R1VJKCkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBhbSA9IHRoaXMubWFpbi5nZXRBY3Rpb25NYW5hZ2VyKCk7XHJcblxyXG4gICAgICAgIGxldCBzdGFydEZ1bmN0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gMTAwMDAwMDtcclxuICAgICAgICAgICAgdGhhdC5zdGFydCgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBwYXVzZUZ1bmN0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnBhdXNlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYW0ucmVnaXN0ZXJBY3Rpb24oXCJpbnRlcnByZXRlci5zdGFydFwiLCBbJ0Y0J10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChhbS5pc0FjdGl2ZShcImludGVycHJldGVyLnN0YXJ0XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXVzZUZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9LCBcIlByb2dyYW1tIHN0YXJ0ZW5cIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RhcnQpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnBhdXNlXCIsIFsnRjQnXSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFtLmlzQWN0aXZlKFwiaW50ZXJwcmV0ZXIuc3RhcnRcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydEZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdXNlRnVuY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0sIFwiUGF1c2VcIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uUGF1c2UpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnN0b3BcIiwgW10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc3RvcChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnN0ZXBzID0gMDtcclxuICAgICAgICAgICAgfSwgXCJQcm9ncmFtbSBhbmhhbHRlblwiLCB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25TdG9wKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uRWRpdC5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgIC8vICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIC8vICAgICBhbS50cmlnZ2VyKCdpbnRlcnByZXRlci5zdG9wJyk7XHJcbiAgICAgICAgLy8gfSk7XHJcblxyXG4gICAgICAgIGFtLnJlZ2lzdGVyQWN0aW9uKFwiaW50ZXJwcmV0ZXIuc3RlcE92ZXJcIiwgWydGNiddLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uZVN0ZXAoZmFsc2UpO1xyXG4gICAgICAgICAgICB9LCBcIkVpbnplbHNjaHJpdHQgKFN0ZXAgb3ZlcilcIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RlcE92ZXIpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnN0ZXBJbnRvXCIsIFsnRjcnXSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbmVTdGVwKHRydWUpO1xyXG4gICAgICAgICAgICB9LCBcIkVpbnplbHNjaHJpdHQgKFN0ZXAgaW50bylcIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RlcEludG8pO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnN0ZXBPdXRcIiwgW10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RlcE91dCgpO1xyXG4gICAgICAgICAgICB9LCBcIlN0ZXAgb3V0XCIsIHRoaXMuY29udHJvbEJ1dHRvbnMuJGJ1dHRvblN0ZXBPdXQpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnJlc3RhcnRcIiwgW10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc3RvcCh0cnVlKTtcclxuICAgICAgICAgICAgfSwgXCJOZXUgc3RhcnRlblwiLCB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25SZXN0YXJ0KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFN0YXJ0YWJsZU1vZHVsZShtb2R1bGVTdG9yZTogTW9kdWxlU3RvcmUpOiBNb2R1bGUge1xyXG5cclxuICAgICAgICBsZXQgY2VtOiBNb2R1bGU7XHJcbiAgICAgICAgY2VtID0gdGhpcy5tYWluLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpO1xyXG5cclxuICAgICAgICBsZXQgY3VycmVudGx5RWRpdGVkTW9kdWxlSXNDbGFzc09ubHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gZGVjaWRlIHdoaWNoIG1vZHVsZSB0byBzdGFydFxyXG5cclxuICAgICAgICAvLyBmaXJzdCBhdHRlbXB0OiBpcyBjdXJyZW50bHkgZWRpdGVkIE1vZHVsZSBzdGFydGFibGU/XHJcbiAgICAgICAgaWYgKGNlbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50bHlFZGl0ZWRNb2R1bGUgPSBtb2R1bGVTdG9yZS5maW5kTW9kdWxlQnlGaWxlKGNlbS5maWxlKTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRseUVkaXRlZE1vZHVsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlFZGl0ZWRNb2R1bGVJc0NsYXNzT25seSA9ICFjZW0uaGFzRXJyb3JzKClcclxuICAgICAgICAgICAgICAgICAgICAmJiAhY3VycmVudGx5RWRpdGVkTW9kdWxlLmlzU3RhcnRhYmxlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRseUVkaXRlZE1vZHVsZS5pc1N0YXJ0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50bHlFZGl0ZWRNb2R1bGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNlY29uZCBhdHRlbXB0OiB3aGljaCBtb2R1bGUgaGFzIGJlZW4gc3RhcnRlZCBsYXN0IHRpbWU/XHJcbiAgICAgICAgaWYgKHRoaXMubWFpbk1vZHVsZSAhPSBudWxsICYmIGN1cnJlbnRseUVkaXRlZE1vZHVsZUlzQ2xhc3NPbmx5KSB7XHJcbiAgICAgICAgICAgIGxldCBsYXN0TWFpbk1vZHVsZSA9IG1vZHVsZVN0b3JlLmZpbmRNb2R1bGVCeUZpbGUodGhpcy5tYWluTW9kdWxlLmZpbGUpO1xyXG4gICAgICAgICAgICBpZiAobGFzdE1haW5Nb2R1bGUgIT0gbnVsbCAmJiBsYXN0TWFpbk1vZHVsZS5pc1N0YXJ0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RNYWluTW9kdWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0aGlyZCBhdHRlbXB0OiBwaWNrIGZpcnN0IHN0YXJ0YWJsZSBtb2R1bGUgb2YgY3VycmVudCB3b3Jrc3BhY2VcclxuICAgICAgICBpZiAoY3VycmVudGx5RWRpdGVkTW9kdWxlSXNDbGFzc09ubHkpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBtb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0uaXNTdGFydGFibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAgICBBZnRlciB1c2VyIGNsaWNrcyBzdGFydCBidXR0b24gKG9yIHN0ZXBvdmVyL3N0ZXBJbnRvLUJ1dHRvbiB3aGVuIG5vIHByb2dyYW0gaXMgcnVubmluZykgdGhpc1xyXG4gICAgICAgIG1ldGhvZCBpc3QgY2FsbGVkLlxyXG4gICAgKi9cclxuICAgIGluaXQoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgbGV0IGNlbSA9IHRoaXMubWFpbi5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKTtcclxuXHJcbiAgICAgICAgY2VtLmdldEJyZWFrcG9pbnRQb3NpdGlvbnNGcm9tRWRpdG9yKCk7XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZT8uY2xlYXJFeGNlcHRpb25zKCk7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICAgIEFzIGxvbmcgYXMgdGhlcmUgaXMgbm8gc3RhcnRhYmxlIG5ldyBWZXJzaW9uIG9mIGN1cnJlbnQgd29ya3NwYWNlIHdlIGtlZXAgY3VycmVudCBjb21waWxlZCBtb2R1bGVzIHNvXHJcbiAgICAgICAgICAgIHRoYXQgdmFyaWFibGVzIGFuZCBvYmplY3RzIGRlZmluZWQvaW5zdGFudGlhdGVkIHZpYSBjb25zb2xlIGNhbiBiZSBrZXB0LCB0b28uIFxyXG4gICAgICAgICovXHJcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlU3RvcmVWZXJzaW9uICE9IHRoaXMubWFpbi52ZXJzaW9uICYmIHRoaXMubWFpbi5nZXRDb21waWxlcigpLmF0TGVhc3RPbmVNb2R1bGVJc1N0YXJ0YWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uY29weUV4ZWN1dGFibGVNb2R1bGVTdG9yZVRvSW50ZXJwcmV0ZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5oZWFwID0ge307IC8vIGNsZWFyIHZhcmlhYmxlcy9vYmplY3RzIGRlZmluZWQgdmlhIGNvbnNvbGVcclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlPy5kZXRhY2hWYWx1ZXMoKTsgIC8vIGRldGFjaCB2YWx1ZXMgZnJvbSBjb25zb2xlIGVudHJpZXNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdNYWluTW9kdWxlID0gdGhpcy5nZXRTdGFydGFibGVNb2R1bGUodGhpcy5tb2R1bGVTdG9yZSk7XHJcblxyXG4gICAgICAgIGlmIChuZXdNYWluTW9kdWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubWFpbk1vZHVsZSA9IG5ld01haW5Nb2R1bGU7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrID0gW107XHJcbiAgICAgICAgdGhpcy5zdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuc3RhY2tmcmFtZXMgPSBbXTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLmRvbmUpO1xyXG5cclxuICAgICAgICB0aGlzLmlzRmlyc3RTdGF0ZW1lbnQgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gMTAwMDAwMDtcclxuXHJcblxyXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIGVudW0gdmFsdWUtb2JqZWN0czsgaW5pdGlhbGl6ZSBzdGF0aWMgYXR0cmlidXRlczsgY2FsbCBzdGF0aWMgY29uc3RydWN0b3JzXHJcblxyXG4gICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICBwcm9ncmFtOiB0aGlzLm1haW5Nb2R1bGUubWFpblByb2dyYW0sXHJcbiAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAwIH0sXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJIYXVwdHByb2dyYW1tXCIsXHJcbiAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IG51bGwsXHJcbiAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiSGF1cHRwcm9ncmFtbVwiXHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVFbnVtcyhtKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplQ2xhc3NlcyhtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucG9wUHJvZ3JhbSgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwb3BQcm9ncmFtKCkge1xyXG4gICAgICAgIGxldCBwID0gdGhpcy5wcm9ncmFtU3RhY2sucG9wKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IHAucHJvZ3JhbTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBwLnByb2dyYW1Qb3NpdGlvbjtcclxuICAgICAgICB0aGlzLmN1cnJlbnRNZXRob2QgPSBwLm1ldGhvZDtcclxuICAgICAgICB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gcC5jYWxsYmFja0FmdGVyUmV0dXJuO1xyXG4gICAgICAgIHRoaXMuY3VycmVudElzQ2FsbGVkRnJvbU91dHNpZGUgPSBwLmlzQ2FsbGVkRnJvbU91dHNpZGU7XHJcbiAgICAgICAgaWYgKHAuc3RhY2tFbGVtZW50c1RvUHVzaEJlZm9yZUZpcnN0RXhlY3V0aW5nICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhY2tmcmFtZXMucHVzaCh0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID09IG51bGwgPyAwIDogdGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSB0aGlzLnN0YWNrLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHNlIG9mIHAuc3RhY2tFbGVtZW50c1RvUHVzaEJlZm9yZUZpcnN0RXhlY3V0aW5nKSB0aGlzLnN0YWNrLnB1c2goc2UpO1xyXG4gICAgICAgICAgICBwLnN0YWNrRWxlbWVudHNUb1B1c2hCZWZvcmVGaXJzdEV4ZWN1dGluZyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluaXRpYWxpemVDbGFzc2VzKG06IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBmb3IgKGxldCBrbGFzcyBvZiBtLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICBpZiAoa2xhc3MgaW5zdGFuY2VvZiBLbGFzcykge1xyXG4gICAgICAgICAgICAgICAga2xhc3Muc3RhdGljQ2xhc3MuY2xhc3NPYmplY3QgPSBuZXcgUnVudGltZU9iamVjdChrbGFzcy5zdGF0aWNDbGFzcyk7XHJcbiAgICAgICAgICAgICAgICBrbGFzcy5wdXNoU3RhdGljSW5pdGlhbGl6YXRpb25Qcm9ncmFtcyh0aGlzLnByb2dyYW1TdGFjayk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChrbGFzcyBpbnN0YW5jZW9mIEVudW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIGxldCBzdGF0aWNWYWx1ZU1hcCA9IGtsYXNzLnN0YXRpY0NsYXNzLmNsYXNzT2JqZWN0LmF0dHJpYnV0ZVZhbHVlcy5nZXQoa2xhc3MuaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhdGljVmFsdWVMaXN0ID0ga2xhc3Muc3RhdGljQ2xhc3MuY2xhc3NPYmplY3QuYXR0cmlidXRlcztcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGVudW1JbmZvIG9mIGtsYXNzLmVudW1JbmZvTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0YXRpY1ZhbHVlTWFwLmdldChlbnVtSW5mby5pZGVudGlmaWVyKS52YWx1ZSA9IGVudW1JbmZvLm9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0aWNWYWx1ZUxpc3RbZW51bUluZm8ub3JkaW5hbF0udmFsdWUgPSBlbnVtSW5mby5vYmplY3Q7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGluaXRpYWxpemVFbnVtcyhtOiBNb2R1bGUpIHtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZW51bUNsYXNzIG9mIG0udHlwZVN0b3JlLnR5cGVMaXN0KSB7XHJcbiAgICAgICAgICAgIGlmIChlbnVtQ2xhc3MgaW5zdGFuY2VvZiBFbnVtKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZW51bUNsYXNzLnB1c2hTdGF0aWNJbml0aWFsaXphdGlvblByb2dyYW1zKHRoaXMucHJvZ3JhbVN0YWNrKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWVMaXN0OiBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlSW5pdGlhbGl6YXRpb25Qcm9ncmFtOiBQcm9ncmFtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZTogZW51bUNsYXNzLm1vZHVsZSxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogW11cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGhhc0F0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSA9IGVudW1DbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChoYXNBdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2dyYW1TdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogdmFsdWVJbml0aWFsaXphdGlvblByb2dyYW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJBdHRyaWJ1dC1Jbml0aWFsaXNpZXJ1bmcgZGVyIEtsYXNzZSBcIiArIGVudW1DbGFzcy5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0FmdGVyUmV0dXJuOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiBcIkluaXRpYWxpc2llcnVuZyBlaW5lcyBFbnVtc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBlbnVtSW5mbyBvZiBlbnVtQ2xhc3MuZW51bUluZm9MaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW51bUluZm8ub2JqZWN0ID0gbmV3IEVudW1SdW50aW1lT2JqZWN0KGVudW1DbGFzcywgZW51bUluZm8pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVudW1DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVudW1JbmZvLm9iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZW51bUluZm8uY29uc3RydWN0b3JDYWxsUHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogZW51bUluZm8uY29uc3RydWN0b3JDYWxsUHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIktvbnN0cnVrdG9yIHZvbiBcIiArIGVudW1DbGFzcy5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiSW5pdGlhbGlzaWVydW5nIGVpbmVzIEVudW1zXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0F0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmluaXRpYWxpemVFbnVtVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogZW51bUluZm8ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtQ2xhc3M6IGVudW1DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlSWRlbnRpZmllcjogZW51bUluZm8uaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc0F0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLnN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wcm9ncmFtRW5kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyBsaW5lOiAwLCBjb2x1bW46IDAsIGxlbmd0aDogMSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbnVtQ2xhc3MudmFsdWVMaXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG5ldyBBcnJheVR5cGUoZW51bUNsYXNzKSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVMaXN0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB0aW1lckV2ZW50czogbnVtYmVyID0gMDtcclxuICAgIHN0YXJ0KGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xyXG5cclxuICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LmNsZWFyRXJyb3JzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tBZnRlckV4ZWN1dGlvbiA9IGNhbGxiYWNrO1xyXG5cclxuICAgICAgICB0aGlzLmlzRmlyc3RTdGF0ZW1lbnQgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLnBhdXNlVW50aWwgPSBudWxsO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmVycm9yIHx8IHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0UnVudGltZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcpO1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVQcm9ncmFtcG9pbnRlclBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMudGltZVdoZW5Qcm9ncmFtU3RhcnRlZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gZmFsc2U7XHJcblxyXG4gICAgICAgIHRoaXMuZ2V0VGltZXJDbGFzcygpLnN0YXJ0VGltZXIoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0VGltZXJDbGFzcygpOiBUaW1lckNsYXNzIHtcclxuICAgICAgICBsZXQgYmFzZU1vZHVsZSA9IHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkubW9kdWxlU3RvcmUuZ2V0TW9kdWxlKFwiQmFzZSBNb2R1bGVcIik7XHJcbiAgICAgICAgcmV0dXJuIDxUaW1lckNsYXNzPmJhc2VNb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJUaW1lclwiKTtcclxuICAgIH1cclxuXHJcbiAgICBsYXN0U3RlcFRpbWU6IG51bWJlciA9IDA7XHJcbiAgICBsYXN0VGltZUJldHdlZW5FdmVudHM6IG51bWJlciA9IDA7XHJcblxyXG4gICAgdGltZXJGdW5jdGlvbih0aW1lckRlbGF5TXM6IG51bWJlciwgZm9yY2VSdW46IGJvb2xlYW4sIG1heFdvcmtsb2FkRmFjdG9yOiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgbGV0IHQwID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgICAgIGlmICghZm9yY2VSdW4pIHtcclxuICAgICAgICAgICAgbGV0IHRpbWVCZXR3ZWVuU3RlcHMgPSAxMDAwIC8gdGhpcy5zdGVwc1BlclNlY29uZDtcclxuICAgICAgICAgICAgaWYgKHRoaXMudGltZXJTdG9wcGVkIHx8IHQwIC0gdGhpcy5sYXN0U3RlcFRpbWUgPCB0aW1lQmV0d2VlblN0ZXBzKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMubGFzdFN0ZXBUaW1lID0gdDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxhc3RUaW1lQmV0d2VlbkV2ZW50cyA9IHQwIC0gdGhpcy5sYXN0U3RlcFRpbWU7XHJcblxyXG4gICAgICAgIGxldCBuX3N0ZXBzUGVyVGltZXJHb2FsID0gZm9yY2VSdW4gPyBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA6IHRoaXMuc3RlcHNQZXJTZWNvbmQgKiB0aGlzLnRpbWVyRGVsYXlNcyAvIDEwMDA7XHJcblxyXG4gICAgICAgIHRoaXMudGltZXJFdmVudHMrKztcclxuXHJcbiAgICAgICAgbGV0IGV4Y2VwdGlvbjogc3RyaW5nO1xyXG4gICAgICAgIGxldCBpID0gMDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGkgPCBuX3N0ZXBzUGVyVGltZXJHb2FsICYmICF0aGlzLnRpbWVyU3RvcHBlZCAmJiBleGNlcHRpb24gPT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAocGVyZm9ybWFuY2Uubm93KCkgLSB0MCkgLyB0aW1lckRlbGF5TXMgPCBtYXhXb3JrbG9hZEZhY3RvclxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBleGNlcHRpb24gPSB0aGlzLm5leHRTdGVwKCk7XHJcbiAgICAgICAgICAgIGlmIChleGNlcHRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0ZXBzUGVyU2Vjb25kIDw9IHRoaXMuc2hvd1Byb2dyYW1wb2ludGVyVXB0b1N0ZXBzUGVyU2Vjb25kICYmICFmb3JjZVJ1bikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5lcnJvciB8fFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsIDwgMCAmJiAhdGhpcy50aW1lclN0b3BwZWQpIHtcclxuICAgICAgICAgICAgICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24gPSBub2RlLnBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgcG9zaXRpb24ubGluZSAhPSB0aGlzLmxlYXZlTGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUucGF1c2VkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tZXNTdGF0ZW1lbnQoVG9rZW5UeXBlLmNsb3NlU3RhY2tmcmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gdGhpcy5uZXh0U3RlcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjZXB0aW9uID09IG51bGwgJiYgdGhpcy5jb21lc1N0YXRlbWVudChUb2tlblR5cGUucHJvZ3JhbUVuZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IHRoaXMubmV4dFN0ZXAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChleGNlcHRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnRocm93RXhjZXB0aW9uKGV4Y2VwdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy50aW1lclN0b3BwZWQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQgfHwgdGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLndhaXRpbmdGb3JJbnB1dCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAodGhpcy5jYWxsYmFja0FmdGVyRXhlY3V0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBZnRlckV4ZWN1dGlvbigpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFja0FmdGVyRXhlY3V0aW9uID0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGR0ID0gcGVyZm9ybWFuY2Uubm93KCkgLSB0MDtcclxuICAgICAgICB0aGlzLnRpbWVOZXR0byArPSBkdDtcclxuXHJcbiAgICAgICAgLy8gaWYgKFxyXG4gICAgICAgIC8vICAgICB0aGlzLnRpbWVyRXZlbnRzICUgMzAwID09IDApIHtcclxuICAgICAgICAvLyAgICAgY29uc29sZS5sb2coXCJMYXN0IHRpbWUgYmV0d2VlbiBFdmVudHM6IFwiICsgdGhpcy5sYXN0VGltZUJldHdlZW5FdmVudHMpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHRocm93RXhjZXB0aW9uKGV4Y2VwdGlvbjogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy50aW1lclN0b3BwZWQgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5lcnJvcik7XHJcblxyXG4gICAgICAgIGxldCAkZXJyb3JEaXYgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19leGNlcHRpb25cIj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgbGV0IGNvbnNvbGVQcmVzZW50OiBib29sZWFuID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5tYWluLmlzRW1iZWRkZWQoKSkge1xyXG4gICAgICAgICAgICBsZXQgbWFpbkVtYmVkZGVkOiBNYWluRW1iZWRkZWQgPSA8TWFpbkVtYmVkZGVkPnRoaXMubWFpbjtcclxuICAgICAgICAgICAgbGV0IGNvbmZpZyA9IG1haW5FbWJlZGRlZC5jb25maWc7XHJcbiAgICAgICAgICAgIGlmIChjb25maWcud2l0aEJvdHRvbVBhbmVsICE9IHRydWUgJiYgY29uZmlnLndpdGhDb25zb2xlICE9IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGVQcmVzZW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb25TdHJpbmcgPSBcIlwiO1xyXG4gICAgICAgICAgICAgICAgbGV0IGN1cnJlbnRTdGF0ZW1lbnQgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHNbdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uXTtcclxuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U3RhdGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdGV4dFBvc2l0aW9uID0gY3VycmVudFN0YXRlbWVudD8ucG9zaXRpb247XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zaXRpb25TdHJpbmcgPSBcIiBpbiBaZWlsZSBcIiArIHRleHRQb3NpdGlvbi5saW5lICsgXCIsIFNwYWx0ZSBcIiArIHRleHRQb3NpdGlvbi5jb2x1bW47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZT8uc2hvd0Vycm9yKHRoaXMuY3VycmVudFByb2dyYW0ubW9kdWxlLCB0ZXh0UG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFsZXJ0KFwiRmVobGVyXCIgKyBwb3NpdGlvblN0cmluZyArIFwiOiBcIiArIGV4Y2VwdGlvbik7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoY29uc29sZVByZXNlbnQpIHtcclxuICAgICAgICAgICAgJGVycm9yRGl2LmFwcGVuZChqUXVlcnkoXCI8c3BhbiBjbGFzcz0nam9fZXJyb3ItY2FwdGlvbic+RmVobGVyOjwvc3Bhbj4mbmJzcDtcIiArIGV4Y2VwdGlvbiArIFwiPGJyPlwiKSk7XHJcbiAgICAgICAgICAgIHRoaXMucHVzaEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZmlyc3QgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gdGhpcy5wcm9ncmFtU3RhY2subGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcCA9IHRoaXMucHJvZ3JhbVN0YWNrW2ldO1xyXG4gICAgICAgICAgICAgICAgbGV0IG0gPSAocC5tZXRob2QgaW5zdGFuY2VvZiBNZXRob2QpID8gcC5tZXRob2QuaWRlbnRpZmllciA6IHAubWV0aG9kO1xyXG4gICAgICAgICAgICAgICAgbGV0IHM6IHN0cmluZyA9IFwiPHNwYW4gY2xhc3M9J2pvX2Vycm9yLWNhcHRpb24nPlwiICsgKGZpcnN0ID8gXCJPcnRcIiA6IFwiYXVmZ2VydWZlbiB2b25cIikgKyBcIjogPC9zcGFuPlwiICsgbTtcclxuICAgICAgICAgICAgICAgIGlmIChwLnRleHRQb3NpdGlvbiAhPSBudWxsKSBzICs9IFwiIDxzcGFuIGNsYXNzPSdqb19ydW50aW1lRXJyb3JQb3NpdGlvbic+KFogXCIgKyBwLnRleHRQb3NpdGlvbi5saW5lICsgXCIsIFMgXCIgKyBwLnRleHRQb3NpdGlvbi5jb2x1bW4gKyBcIik8L3NwYW4+XCI7XHJcbiAgICAgICAgICAgICAgICBzICs9IFwiPGJyPlwiO1xyXG4gICAgICAgICAgICAgICAgbGV0IGVycm9yTGluZSA9IGpRdWVyeShzKTtcclxuICAgICAgICAgICAgICAgIGlmIChwLnRleHRQb3NpdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeShlcnJvckxpbmVbMl0pLm9uKCdtb3VzZWRvd24nLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZT8uc2hvd0Vycm9yKHAucHJvZ3JhbS5tb2R1bGUsIHAudGV4dFBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICRlcnJvckRpdi5hcHBlbmQoZXJyb3JMaW5lKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmaXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHAuaXNDYWxsZWRGcm9tT3V0c2lkZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBjb25zb2xlID0gdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlO1xyXG5cclxuICAgICAgICAgICAgaWYgKGNvbnNvbGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS53cml0ZUNvbnNvbGVFbnRyeSgkZXJyb3JEaXYsIG51bGwsICdyZ2JhKDI1NSwgMCwgMCwgMC40Jyk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLnNob3dUYWIoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGhpZGVQcm9ncmFtcG9pbnRlclBvc2l0aW9uKCkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcpIHtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0ZXBzUGVyU2Vjb25kID4gdGhpcy5zaG93UHJvZ3JhbXBvaW50ZXJVcHRvU3RlcHNQZXJTZWNvbmQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY29tZXNTdGF0ZW1lbnQoc3RhdGVtZW50OiBUb2tlblR5cGUpIHtcclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UHJvZ3JhbSA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA+IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggLSAxKSByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50c1t0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb25dLnR5cGUgPT0gc3RhdGVtZW50O1xyXG4gICAgfVxyXG5cclxuICAgIHJlc2V0UnVudGltZSgpIHtcclxuICAgICAgICB0aGlzLnByaW50TWFuYWdlci5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMud29ybGRIZWxwZXI/LmRlc3Ryb3lXb3JsZCgpO1xyXG4gICAgICAgIHRoaXMucHJvY2Vzc2luZ0hlbHBlcj8uZGVzdHJveVdvcmxkKCk7XHJcbiAgICAgICAgdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXI/LmRldGFjaEV2ZW50cygpO1xyXG4gICAgICAgIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyID0gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RvcChyZXN0YXJ0OiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICB0aGlzLmlucHV0TWFuYWdlci5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnBhdXNlZCk7XHJcbiAgICAgICAgdGhpcy50aW1lclN0b3BwZWQgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy53b3JsZEhlbHBlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuc3ByaXRlQW5pbWF0aW9ucyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmduZ0VyZWlnbmlzYmVoYW5kbHVuZ0hlbHBlcj8uZGV0YWNoRXZlbnRzKCk7XHJcbiAgICAgICAgdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLm1haW4uaGlkZVByb2dyYW1Qb2ludGVyUG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRUaW1lckNsYXNzKCkuc3RvcFRpbWVyKCk7XHJcbiAgICAgICAgaWYgKHRoaXMud29ybGRIZWxwZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLndvcmxkSGVscGVyLmNhY2hlQXNCaXRtYXAoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaGVhcCA9IHt9O1xyXG4gICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrID0gW107XHJcbiAgICAgICAgdGhpcy5zdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuc3RhY2tmcmFtZXMgPSBbXTtcclxuXHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUuZG9uZSk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICBpZiAocmVzdGFydCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSwgNTAwKTtcclxuICAgIH1cclxuXHJcbiAgICBwYXVzZSgpIHtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUucGF1c2VkKTtcclxuICAgICAgICB0aGlzLnNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpO1xyXG4gICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBsYXN0UHJpbnRlZE1vZHVsZTogTW9kdWxlID0gbnVsbDtcclxuICAgIHNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpIHtcclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UHJvZ3JhbSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgbGV0IG5vZGUgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHNbdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uXTtcclxuICAgICAgICBpZiAobm9kZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcclxuICAgICAgICBpZiAocG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uc2hvd1Byb2dyYW1Qb2ludGVyUG9zaXRpb24odGhpcy5jdXJyZW50UHJvZ3JhbS5tb2R1bGUuZmlsZSwgcG9zaXRpb24pO1xyXG4gICAgICAgICAgICB0aGlzLmRlYnVnZ2VyLnNob3dEYXRhKHRoaXMuY3VycmVudFByb2dyYW0sIHBvc2l0aW9uLCB0aGlzLnN0YWNrLCB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lLCB0aGlzLmhlYXApO1xyXG4gICAgICAgICAgICBsZXQgYm90dG9tRGl2ID0gdGhpcy5tYWluLmdldEJvdHRvbURpdigpO1xyXG4gICAgICAgICAgICBpZiAoYm90dG9tRGl2LnByb2dyYW1QcmludGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQcm9ncmFtLm1vZHVsZSAhPSB0aGlzLmxhc3RQcmludGVkTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpLnByaW50TW9kdWxlVG9Cb3R0b21EaXYobnVsbCwgdGhpcy5jdXJyZW50UHJvZ3JhbS5tb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdFByaW50ZWRNb2R1bGUgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLm1vZHVsZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKS5wcm9ncmFtUHJpbnRlci5zaG93Tm9kZShub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzdGVwT3V0KCkge1xyXG4gICAgICAgIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwgPSAwO1xyXG4gICAgICAgIHRoaXMuc3RhcnQoKTtcclxuICAgIH1cclxuXHJcbiAgICBvbmVTdGVwKHN0ZXBJbnRvOiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlPy5jbGVhckVycm9ycygpO1xyXG4gICAgICAgIHRoaXMuaXNGaXJzdFN0YXRlbWVudCA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5pbml0KCk7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlID09IEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhpcy5yZXNldFJ1bnRpbWUoKTtcclxuICAgICAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnBhdXNlZCk7XHJcbiAgICAgICAgICAgIC8vIEFyZSB0aGVyZSBzdGF0aWMgVmFyaWFibGVzIHRvIGluaXRpYWxpemU/XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRNZXRob2QgPT0gXCJIYXVwdHByb2dyYW1tXCIpIHtcclxuICAgICAgICAgICAgICAgIC8vIE5vIHN0YXRpYyB2YXJpYWJsZSBpbml0aWFsaXplcnNcclxuICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwgPSAxMDAwMDtcclxuICAgICAgICBsZXQgb2xkU3RlcE92ZXJOZXN0aW5nTGV2ZWwgPSB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsO1xyXG4gICAgICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gbm9kZS5wb3NpdGlvbjtcclxuICAgICAgICBsZXQgZXhjZXB0aW9uID0gdGhpcy5uZXh0U3RlcCgpO1xyXG4gICAgICAgIGlmIChleGNlcHRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnRocm93RXhjZXB0aW9uKGV4Y2VwdGlvbik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghc3RlcEludG8gJiYgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCA+IG9sZFN0ZXBPdmVyTmVzdGluZ0xldmVsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwgPSAwO1xyXG4gICAgICAgICAgICBpZiAocG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sZWF2ZUxpbmUgPSBwb3NpdGlvbi5saW5lO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5sZWF2ZUxpbmUgPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gSW50ZXJwcmV0ZXJTdGF0ZS53YWl0aW5nRm9ySW5wdXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUucGF1c2VkKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGVwRmluaXNoZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBuZXh0U3RlcCgpOiBzdHJpbmcge1xyXG5cclxuICAgICAgICB0aGlzLnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG5cclxuICAgICAgICBsZXQgbm9kZTogU3RhdGVtZW50O1xyXG5cclxuICAgICAgICBsZXQgZXhjZXB0aW9uOiBzdHJpbmc7XHJcblxyXG4gICAgICAgIHdoaWxlICghdGhpcy5zdGVwRmluaXNoZWQgJiYgIXRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgJiYgZXhjZXB0aW9uID09IG51bGwpIHtcclxuXHJcblxyXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMuY3VycmVudFByb2dyYW0gPT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICAgICAgICAgICAgZGVidWdnZXI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPiB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLmRvbmUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIG5vZGUgPSB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHNbdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uXTtcclxuXHJcbiAgICAgICAgICAgIGlmIChub2RlLnN0ZXBGaW5pc2hlZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0ZXBGaW5pc2hlZCA9IG5vZGUuc3RlcEZpbmlzaGVkO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBleGNlcHRpb24gPSB0aGlzLmV4ZWN1dGVOb2RlKG5vZGUpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGVwcysrO1xyXG5cclxuICAgICAgICByZXR1cm4gZXhjZXB0aW9uO1xyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGVOb2RlKG5vZGU6IFN0YXRlbWVudCk6IHN0cmluZyB7XHJcblxyXG4gICAgICAgIGlmIChub2RlLmJyZWFrcG9pbnQgIT0gbnVsbCAmJiAhdGhpcy5pc0ZpcnN0U3RhdGVtZW50KSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaXNGaXJzdFN0YXRlbWVudCA9IGZhbHNlO1xyXG4gICAgICAgIGxldCBzdGFja1RvcCA9IHRoaXMuc3RhY2subGVuZ3RoIC0gMTtcclxuICAgICAgICBsZXQgc3RhY2tmcmFtZUJlZ2luID0gdGhpcy5jdXJyZW50U3RhY2tmcmFtZTtcclxuICAgICAgICBsZXQgc3RhY2sgPSB0aGlzLnN0YWNrO1xyXG4gICAgICAgIGxldCB2YWx1ZTogVmFsdWU7XHJcblxyXG4gICAgICAgIHN3aXRjaCAobm9kZS50eXBlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNhc3RWYWx1ZTpcclxuICAgICAgICAgICAgICAgIGxldCByZWxQb3MgPSBub2RlLnN0YWNrUG9zUmVsYXRpdmUgPT0gbnVsbCA/IDAgOiBub2RlLnN0YWNrUG9zUmVsYXRpdmU7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrW3N0YWNrVG9wICsgcmVsUG9zXTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wICsgcmVsUG9zXSA9IHZhbHVlLnR5cGUuY2FzdFRvKHZhbHVlLCBub2RlLm5ld1R5cGUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNoZWNrQ2FzdDpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tbc3RhY2tUb3BdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlID09IG51bGwpIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJ0byA9IDxSdW50aW1lT2JqZWN0PnZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubmV3VHlwZSBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBydG8gPT0gXCJvYmplY3RcIikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXJ0by5jbGFzcy5oYXNBbmNlc3Rvck9ySXMobm9kZS5uZXdUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcIkRhcyBPYmpla3QgZGVyIEtsYXNzZSBcIiArIHJ0by5jbGFzcy5pZGVudGlmaWVyICsgXCIga2FubiBuaWNodCBuYWNoIFwiICsgbm9kZS5uZXdUeXBlLmlkZW50aWZpZXIgKyBcIiBnZWNhc3RldCB3ZXJkZW4uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBydG8gPT0gXCJudW1iZXJcIiAmJiBbXCJJbnRlZ2VyXCIsIFwiRG91YmxlXCIsIFwiRmxvYXRcIl0uaW5kZXhPZihub2RlLm5ld1R5cGUuaWRlbnRpZmllcikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFwiRWluZSBaYWhsIGthbm4gbmljaHQgbmFjaCBcIiArIG5vZGUubmV3VHlwZS5pZGVudGlmaWVyICsgXCIgZ2VjYXN0ZXQgd2VyZGVuLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnRvID09IFwic3RyaW5nXCIgJiYgW1wiU3RyaW5nXCIsIFwiQ2hhcmFjdGVyXCJdLmluZGV4T2Yobm9kZS5uZXdUeXBlLmlkZW50aWZpZXIpIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChcIkVpbmUgWmVpY2hlbmtldHRlIGthbm4gbmljaHQgbmFjaCBcIiArIG5vZGUubmV3VHlwZS5pZGVudGlmaWVyICsgXCIgZ2VjYXN0ZXQgd2VyZGVuLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgcnRvID09IFwiYm9vbGVhblwiICYmIG5vZGUubmV3VHlwZS5pZGVudGlmaWVyICE9IFwiQm9vbGVhblwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFwiRWluIGJvb2xlc2NoZXIgV2VydCBrYW5uIG5pY2h0IG5hY2ggXCIgKyBub2RlLm5ld1R5cGUuaWRlbnRpZmllciArIFwiIGdlY2FzdGV0IHdlcmRlbi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5vZGUubmV3VHlwZSBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICghKDxLbGFzcz5ydG8uY2xhc3MpLmltcGxlbWVudHNJbnRlcmZhY2Uobm9kZS5uZXdUeXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFwiRGFzIE9iamVrdCBkZXIgS2xhc3NlIFwiICsgcnRvLmNsYXNzLmlkZW50aWZpZXIgKyBcIiBpbXBsZW1lbnRpZXJ0IG5pY2h0IGRhcyBJbnRlcmZhY2UgXCIgKyBub2RlLm5ld1R5cGUuaWRlbnRpZmllciArIFwiLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubG9jYWxWYXJpYWJsZURlY2xhcmF0aW9uOlxyXG4gICAgICAgICAgICAgICAgbGV0IHZhcmlhYmxlID0gbm9kZS52YXJpYWJsZTtcclxuICAgICAgICAgICAgICAgIGxldCB0eXBlID0gdmFyaWFibGUudHlwZTtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS52YWx1ZSA9IHR5cGUuaW5pdGlhbFZhbHVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RhY2tbdmFyaWFibGUuc3RhY2tQb3MgKyBzdGFja2ZyYW1lQmVnaW5dID0gdmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5wdXNoT25Ub3BPZlN0YWNrRm9ySW5pdGlhbGl6YXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wdXNoTG9jYWxWYXJpYWJsZVRvU3RhY2s6XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHN0YWNrW25vZGUuc3RhY2twb3NPZlZhcmlhYmxlICsgc3RhY2tmcmFtZUJlZ2luXSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucG9wQW5kU3RvcmVJbnRvVmFyaWFibGU6XHJcbiAgICAgICAgICAgICAgICBzdGFja1tub2RlLnN0YWNrcG9zT2ZWYXJpYWJsZSArIHN0YWNrZnJhbWVCZWdpbl0gPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wdXNoQXR0cmlidXRlOlxyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdDEgPSBub2RlLnVzZVRoaXNPYmplY3QgPyBzdGFja1tzdGFja2ZyYW1lQmVnaW5dLnZhbHVlIDogc3RhY2sucG9wKCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAob2JqZWN0MSA9PSBudWxsKSByZXR1cm4gXCJadWdyaWZmIGF1ZiBlaW4gQXR0cmlidXQgKFwiICsgbm9kZS5hdHRyaWJ1dGVJZGVudGlmaWVyICsgXCIpIGRlcyBudWxsLU9iamVrdHNcIjtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZTEgPSAoPFJ1bnRpbWVPYmplY3Q+b2JqZWN0MSkuZ2V0VmFsdWUobm9kZS5hdHRyaWJ1dGVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUxPy51cGRhdGVWYWx1ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUxLnVwZGF0ZVZhbHVlKHZhbHVlMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlMSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaEFycmF5TGVuZ3RoOlxyXG4gICAgICAgICAgICAgICAgbGV0IGEgPSBzdGFjay5wb3AoKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChhID09IG51bGwpIHJldHVybiBcIlp1Z3JpZmYgYXVmIGRhcyBsZW5ndGgtQXR0cmlidXQgZGVzIG51bGwtT2JqZWt0c1wiO1xyXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7IHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIHZhbHVlOiAoPGFueVtdPmEpLmxlbmd0aCB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5hc3NpZ25tZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgPSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghKHN0YWNrW3N0YWNrVG9wIC0gMV0udHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS50eXBlID0gdmFsdWUudHlwZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmICghbm9kZS5sZWF2ZVZhbHVlT25TdGFjaykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnBsdXNBc3NpZ25tZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgKz0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubWludXNBc3NpZ25tZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgLT0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubXVsdGlwbGljYXRpb25Bc3NpZ25tZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgKj0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuZGl2aXNpb25Bc3NpZ25tZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgLz0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubW9kdWxvQXNzaWdubWVudDpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBzdGFja1tzdGFja1RvcCAtIDFdLnZhbHVlICU9IHZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLkFOREFzc2lnbWVudDpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBzdGFja1tzdGFja1RvcCAtIDFdLnZhbHVlICY9IHZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLk9SQXNzaWdtZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgfD0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuWE9SQXNzaWdtZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgXj0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuc2hpZnRMZWZ0QXNzaWdtZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgPDw9IHZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNoaWZ0UmlnaHRBc3NpZ21lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSA+Pj0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuc2hpZnRSaWdodFVuc2lnbmVkQXNzaWdtZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgPj4+PSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5iaW5hcnlPcDpcclxuICAgICAgICAgICAgICAgIGxldCBzZWNvbmRPcGVyYW5kID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzdWx0VmFsdWUgPVxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUubGVmdFR5cGUuY29tcHV0ZShub2RlLm9wZXJhdG9yLCBzdGFja1tzdGFja1RvcCAtIDFdLCBzZWNvbmRPcGVyYW5kKTtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHRUeXBlID0gbm9kZS5sZWZ0VHlwZS5nZXRSZXN1bHRUeXBlKG5vZGUub3BlcmF0b3IsIHNlY29uZE9wZXJhbmQudHlwZSk7XHJcbiAgICAgICAgICAgICAgICBzdGFja1tzdGFja1RvcCAtIDFdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHJlc3VsdFR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJlc3VsdFZhbHVlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnVuYXJ5T3A6XHJcbiAgICAgICAgICAgICAgICBsZXQgb2xkVmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLm9wZXJhdG9yID09IFRva2VuVHlwZS5taW51cykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBvbGRWYWx1ZS50eXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogLW9sZFZhbHVlLnZhbHVlXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IG9sZFZhbHVlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAhb2xkVmFsdWUudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hDb25zdGFudDpcclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBub2RlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG5vZGUuZGF0YVR5cGVcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hTdGF0aWNDbGFzc09iamVjdDpcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLmtsYXNzIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS5rbGFzcy5zdGF0aWNDbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG5vZGUua2xhc3Muc3RhdGljQ2xhc3MuY2xhc3NPYmplY3RcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyB0byBlbmFibGUgaW5zdGFuY2VvZiBvcGVyYXRvciB3aXRoIGludGVyZmFjZXNcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS5rbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG5vZGUua2xhc3NcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wdXNoU3RhdGljQXR0cmlidXRlOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBub2RlLmtsYXNzLmNsYXNzT2JqZWN0LmdldFZhbHVlKG5vZGUuYXR0cmlidXRlSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlLnVwZGF0ZVZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZS51cGRhdGVWYWx1ZSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAvLyBjYXNlIFRva2VuVHlwZS5wdXNoU3RhdGljQXR0cmlidXRlSW50cmluc2ljOlxyXG4gICAgICAgICAgICAvLyAgICAgdmFsdWUgPSBub2RlLlxyXG4gICAgICAgICAgICAvLyAgICAgc3RhY2sucHVzaCh7IHR5cGU6IG5vZGUuYXR0cmlidXRlLnR5cGUsIHZhbHVlOiBub2RlLmF0dHJpYnV0ZS51cGRhdGVWYWx1ZShudWxsKSB9KTtcclxuICAgICAgICAgICAgLy8gICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zZWxlY3RBcnJheUVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXggPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGxldCBhcnJheSA9IHN0YWNrLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChhcnJheS52YWx1ZSA9PSBudWxsKSByZXR1cm4gXCJadWdyaWZmIGF1ZiBlaW4gRWxlbWVudCBlaW5lcyBudWxsLUZlbGRlc1wiO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbmRleC52YWx1ZSA+PSBhcnJheS52YWx1ZS5sZW5ndGggfHwgaW5kZXgudmFsdWUgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiWnVncmlmZiBhdWYgZGFzIEVsZW1lbnQgbWl0IEluZGV4IFwiICsgaW5kZXgudmFsdWUgKyBcIiBlaW5lcyBGZWxkZXMgZGVyIEzDpG5nZSBcIiArIGFycmF5LnZhbHVlLmxlbmd0aDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goYXJyYXkudmFsdWVbaW5kZXgudmFsdWVdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2FsbE1haW5NZXRob2Q6XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YWNrLnB1c2goeyB2YWx1ZTogbm9kZS5zdGF0aWNDbGFzcy5jbGFzc09iamVjdCwgdHlwZTogbm9kZS5zdGF0aWNDbGFzcyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVyOiBWYWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogW3sgdmFsdWU6IFwiVGVzdFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG5ldyBBcnJheVR5cGUoc3RyaW5nUHJpbWl0aXZlVHlwZSlcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVyQmVnaW4yID0gc3RhY2tUb3AgKyAyOyAvLyAxIHBhcmFtZXRlclxyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaChwYXJhbWV0ZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2tmcmFtZXMucHVzaCh0aGlzLmN1cnJlbnRTdGFja2ZyYW1lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHByb2dyYW06IHRoaXMuY3VycmVudFByb2dyYW0sXHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbVBvc2l0aW9uOiB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gKyAxLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHRoaXMuY3VycmVudE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0FmdGVyUmV0dXJuOiB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuLFxyXG4gICAgICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IG51bGxcclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHBhcmFtZXRlckJlZ2luMjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gbm9kZS5tZXRob2QucHJvZ3JhbTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudE1ldGhvZCA9IG5vZGUubWV0aG9kO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gLTE7IC8vIGdldHMgaW5jcmVhc2VkIGFmdGVyIHN3aXRjaCBzdGF0ZW1lbnQuLi5cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUubWV0aG9kLnJlc2VydmVTdGFja0ZvckxvY2FsVmFyaWFibGVzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwrKztcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubWFrZUVsbGlwc2lzQXJyYXk6XHJcbiAgICAgICAgICAgICAgICBsZXQgZWxsaXBzaXNBcnJheTogVmFsdWVbXSA9IHN0YWNrLnNwbGljZShzdGFjay5sZW5ndGggLSBub2RlLnBhcmFtZXRlckNvdW50LCBub2RlLnBhcmFtZXRlckNvdW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZWxsaXBzaXNBcnJheSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLmFycmF5VHlwZVxyXG4gICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2FsbE1ldGhvZDpcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBub2RlLnN0YWNrZnJhbWViZWdpbiA9IC0ocGFyYW1ldGVycy5wYXJhbWV0ZXJUeXBlcy5sZW5ndGggKyAxKVxyXG4gICAgICAgICAgICAgICAgbGV0IG1ldGhvZCA9IG5vZGUubWV0aG9kO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXJCZWdpbiA9IHN0YWNrVG9wICsgMSArIG5vZGUuc3RhY2tmcmFtZUJlZ2luO1xyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtZXRlcnMxID0gbWV0aG9kLnBhcmFtZXRlcmxpc3QucGFyYW1ldGVycztcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSBwYXJhbWV0ZXJCZWdpbiArIDE7IGkgPD0gc3RhY2tUb3A7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YWNrW2ldICE9IG51bGwgJiYgdGhpcy5zdGFja1tpXS50eXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFja1tpXSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHBhcmFtZXRlcnMxW2kgLSBwYXJhbWV0ZXJCZWdpbiAtIDFdLnR5cGUsICAvLyBjYXN0IHRvIHBhcmFtZXRlciB0eXBlLi4uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc3RhY2tbaV0udmFsdWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc3RhY2tbcGFyYW1ldGVyQmVnaW5dLnZhbHVlID09IG51bGwgJiYgIW1ldGhvZC5pc1N0YXRpYykge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBcIkF1ZnJ1ZiBkZXIgTWV0aG9kZSBcIiArIG1ldGhvZC5pZGVudGlmaWVyICsgXCIgZGVzIG51bGwtT2JqZWt0c1wiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZXRob2QuaXNBYnN0cmFjdCB8fCBtZXRob2QuaXNWaXJ0dWFsICYmICFub2RlLmlzU3VwZXJDYWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG9iamVjdCA9IHN0YWNrW3BhcmFtZXRlckJlZ2luXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAob2JqZWN0LnZhbHVlIGluc3RhbmNlb2YgUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAoPEtsYXNzPig8UnVudGltZU9iamVjdD5vYmplY3QudmFsdWUpLmNsYXNzKS5nZXRNZXRob2RCeVNpZ25hdHVyZShtZXRob2Quc2lnbmF0dXJlKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2QgPSAoPEtsYXNzPm9iamVjdC50eXBlKS5nZXRNZXRob2RCeVNpZ25hdHVyZShtZXRob2Quc2lnbmF0dXJlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1ldGhvZCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcmFpc2UgcnVudGltZSBlcnJvclxyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZXRob2QuaW52b2tlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcnQgPSBtZXRob2QuZ2V0UmV0dXJuVHlwZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXJzID0gc3RhY2suc3BsaWNlKHBhcmFtZXRlckJlZ2luKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcmV0dXJuVmFsdWUgPSBtZXRob2QuaW52b2tlKHBhcmFtZXRlcnMpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChydCAhPSBudWxsICYmIHJ0LmlkZW50aWZpZXIgIT0gJ3ZvaWQnKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJldHVyblZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogcnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWNrZnJhbWVzLnB1c2godGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcm9ncmFtU3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW06IHRoaXMuY3VycmVudFByb2dyYW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uICsgMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHRoaXMuY3VycmVudE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXNDYWxsZWRGcm9tT3V0c2lkZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gcGFyYW1ldGVyQmVnaW47XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBtZXRob2QucHJvZ3JhbTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNZXRob2QgPSBtZXRob2Q7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gLTE7IC8vIGdldHMgaW5jcmVhc2VkIGFmdGVyIHN3aXRjaCBzdGF0ZW1lbnQuLi5cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtZXRob2QucmVzZXJ2ZVN0YWNrRm9yTG9jYWxWYXJpYWJsZXM7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCsrO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNhbGxJbnB1dE1ldGhvZDpcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBub2RlLnN0YWNrZnJhbWViZWdpbiA9IC0ocGFyYW1ldGVycy5wYXJhbWV0ZXJUeXBlcy5sZW5ndGggKyAxKVxyXG4gICAgICAgICAgICAgICAgbGV0IG1ldGhvZDEgPSBub2RlLm1ldGhvZDtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVyQmVnaW4xID0gc3RhY2tUb3AgKyAxICsgbm9kZS5zdGFja2ZyYW1lQmVnaW47XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtZXRlcnMgPSBzdGFjay5zcGxpY2UocGFyYW1ldGVyQmVnaW4xKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVyU3RvcHBlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2xkU3RhdGUgPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLndhaXRpbmdGb3JJbnB1dCk7XHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLm1haW4uc2hvd1Byb2dyYW1Qb2ludGVyUG9zaXRpb24odGhpcy5jdXJyZW50UHJvZ3JhbS5tb2R1bGUuZmlsZSwgbm9kZS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgIHRoaXMuaW5wdXRNYW5hZ2VyLnJlYWRJbnB1dChtZXRob2QxLCBwYXJhbWV0ZXJzLCAodmFsdWU6IFZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLmhpZGVQcm9ncmFtUG9pbnRlclBvc2l0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnBhdXNlZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9sZFN0YXRlID09IEludGVycHJldGVyU3RhdGUucnVubmluZykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhhdC5vbmVTdGVwKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucmV0dXJuOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5yZXR1cm4obm9kZSwgc3RhY2spO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmRlY3JlYXNlU3RhY2twb2ludGVyOlxyXG4gICAgICAgICAgICAgICAgc3RhY2suc3BsaWNlKHN0YWNrVG9wICsgMSAtIG5vZGUucG9wQ291bnQpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmluaXRTdGFja2ZyYW1lOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHN0YWNrVG9wICsgMTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5yZXNlcnZlRm9yTG9jYWxWYXJpYWJsZXM7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gobnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2xvc2VTdGFja2ZyYW1lOlxyXG4gICAgICAgICAgICAgICAgc3RhY2suc3BsaWNlKHN0YWNrZnJhbWVCZWdpbik7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gdGhpcy5zdGFja2ZyYW1lcy5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5uZXdPYmplY3Q6XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0ID0gbmV3IFJ1bnRpbWVPYmplY3Qobm9kZS5jbGFzcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG9iamVjdCxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLmNsYXNzXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuc3Vic2VxdWVudENvbnN0cnVjdG9yQ2FsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrVG9wKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGtsYXNzOiBLbGFzcyA9IG5vZGUuY2xhc3M7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGtsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgYWlwID0ga2xhc3MuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhaXAuc3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWNrZnJhbWVzLnB1c2godGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogdGhpcy5jdXJyZW50UHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uICsgMSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogdGhpcy5jdXJyZW50TWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gbnVsbDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHN0YWNrVG9wICsgMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBhaXA7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRNZXRob2QgPSBcIktvbnN0cnVrdG9yIHZvbiBcIiArIGtsYXNzLmlkZW50aWZpZXI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwrKztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAga2xhc3MgPSBrbGFzcy5iYXNlQ2xhc3M7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gTi5CLjogY29uc3RydWN0b3IgY2FsbCBpcyBuZXh0IHN0YXRlbWVudFxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wcm9jZXNzUG9zdENvbnN0cnVjdG9yQ2FsbGJhY2tzOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja1tzdGFja1RvcF07XHJcbiAgICAgICAgICAgICAgICBsZXQgY2xhc3NUeXBlID0gPEtsYXNzPnZhbHVlLnR5cGU7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBwY2Mgb2YgY2xhc3NUeXBlLmdldFBvc3RDb25zdHJ1Y3RvckNhbGxiYWNrcygpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcGNjKHZhbHVlLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5leHRlbmRlZEZvckxvb3BJbml0OlxyXG4gICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mQ291bnRlciArIHN0YWNrZnJhbWVCZWdpbl0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogMFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmV4dGVuZGVkRm9yTG9vcENoZWNrQ291bnRlckFuZEdldEVsZW1lbnQ6XHJcbiAgICAgICAgICAgICAgICBsZXQgY291bnRlcjogbnVtYmVyID0gc3RhY2tbbm9kZS5zdGFja1Bvc09mQ291bnRlciArIHN0YWNrZnJhbWVCZWdpbl0udmFsdWUrKztcclxuICAgICAgICAgICAgICAgIGxldCBjb2xsZWN0aW9uID0gc3RhY2tbbm9kZS5zdGFja1Bvc09mQ29sbGVjdGlvbiArIHN0YWNrZnJhbWVCZWdpbl0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChub2RlLmtpbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiYXJyYXlcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50ZXIgPCAoPGFueVtdPmNvbGxlY3Rpb24pLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mRWxlbWVudCArIHN0YWNrZnJhbWVCZWdpbl0udmFsdWUgPSAoPGFueVtdPmNvbGxlY3Rpb24pW2NvdW50ZXJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mRWxlbWVudCArIHN0YWNrZnJhbWVCZWdpbl0udHlwZSA9ICg8YW55W10+Y29sbGVjdGlvbilbY291bnRlcl0udHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJpbnRlcm5hbExpc3RcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3Q6IGFueVtdID0gKDxMaXN0SGVscGVyPig8UnVudGltZU9iamVjdD5jb2xsZWN0aW9uKS5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXSkudmFsdWVBcnJheTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvdW50ZXIgPCBsaXN0Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mRWxlbWVudCArIHN0YWNrZnJhbWVCZWdpbl0udmFsdWUgPSBsaXN0W2NvdW50ZXJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mRWxlbWVudCArIHN0YWNrZnJhbWVCZWdpbl0udHlwZSA9IGxpc3RbY291bnRlcl0udHlwZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgXCJncm91cFwiOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgbGlzdDE6IGFueVtdID0gKDxHcm91cEhlbHBlcj4oPFJ1bnRpbWVPYmplY3Q+Y29sbGVjdGlvbikuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdKS5zaGFwZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudGVyIDwgbGlzdDEubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdGFja1tub2RlLnN0YWNrUG9zT2ZFbGVtZW50ICsgc3RhY2tmcmFtZUJlZ2luXS52YWx1ZSA9IGxpc3QxW2NvdW50ZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mRWxlbWVudCArIHN0YWNrZnJhbWVCZWdpbl0udHlwZSA9IGxpc3QxW2NvdW50ZXJdLmtsYXNzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gbm9kZS5kZXN0aW5hdGlvbiAtIDE7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaW5jcmVtZW50RGVjcmVtZW50QmVmb3JlOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja1tzdGFja1RvcF07XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS52YWx1ZSArPSBub2RlLmluY3JlbWVudERlY3JlbWVudEJ5O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmluY3JlbWVudERlY3JlbWVudEFmdGVyOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja1tzdGFja1RvcF07XHJcbiAgICAgICAgICAgICAgICAvLyByZXBsYWNlIHZhbHVlIGJ5IGNvcHk6XHJcbiAgICAgICAgICAgICAgICBzdGFja1tzdGFja1RvcF0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHZhbHVlLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHZhbHVlLnR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAvLyBpbmNyZW1lbnQgdmFsdWUgd2hpY2ggaXMgbm90IGludm9sdmVkIGluIHN1YnNlcXVlbnQgXHJcbiAgICAgICAgICAgICAgICB2YWx1ZS52YWx1ZSArPSBub2RlLmluY3JlbWVudERlY3JlbWVudEJ5O1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmp1bXBBbHdheXM6XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5qdW1wSWZUcnVlOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGlmICg8Ym9vbGVhbj52YWx1ZS52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmp1bXBJZkZhbHNlOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGlmICghKDxib29sZWFuPnZhbHVlLnZhbHVlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmp1bXBJZlRydWVBbmRMZWF2ZU9uU3RhY2s6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrW3N0YWNrVG9wXTtcclxuICAgICAgICAgICAgICAgIGlmICg8Ym9vbGVhbj52YWx1ZS52YWx1ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmp1bXBJZkZhbHNlQW5kTGVhdmVPblN0YWNrOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja1tzdGFja1RvcF07XHJcbiAgICAgICAgICAgICAgICBpZiAoISg8Ym9vbGVhbj52YWx1ZS52YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5ub09wOlxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnByb2dyYW1FbmQ6XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvZ3JhbVN0YWNrLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnBvcFByb2dyYW0oKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24tLTsgLy8gZ2V0cyBpbmNyZWFzZWQgbGF0ZXIgb24gYWZ0ZXIgc3dpdGNoIGVuZHNcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxlYXZlTGluZSA9IC0xO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobm9kZS5wYXVzZUFmdGVyUHJvZ3JhbUVuZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gLTE7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoKHRoaXMud29ybGRIZWxwZXIgIT0gbnVsbCAmJiB0aGlzLndvcmxkSGVscGVyLmhhc0FjdG9ycygpKSB8fCB0aGlzLnByb2Nlc3NpbmdIZWxwZXIgIT0gbnVsbFxyXG4gICAgICAgICAgICAgICAgICAgIHx8ICh0aGlzLmduZ0VyZWlnbmlzYmVoYW5kbHVuZ0hlbHBlciAhPSBudWxsICYmIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyLmhhc0FrdGlvbnNFbXBmYWVuZ2VyKCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYmFzZU1vZHVsZSA9IHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkubW9kdWxlU3RvcmUuZ2V0TW9kdWxlKFwiQmFzZSBNb2R1bGVcIik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGltZXJDbGFzczogVGltZXJDbGFzcyA9IDxUaW1lckNsYXNzPmJhc2VNb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJUaW1lclwiKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lckNsYXNzLnRpbWVyRW50cmllcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLyB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUuZG9uZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IC0xO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgSGVscGVyLnNob3dIZWxwZXIoXCJzcGVlZENvbnRyb2xIZWxwZXJcIiwgdGhpcy5tYWluKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByaW50TWFuYWdlci5zaG93UHJvZ3JhbUVuZCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0ZXBzID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkdCA9IHBlcmZvcm1hbmNlLm5vdygpIC0gdGhpcy50aW1lV2hlblByb2dyYW1TdGFydGVkO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlID0gJ0V4ZWN1dGVkICcgKyB0aGlzLnN0ZXBzICsgJyBzdGVwcyBpbiAnICsgdGhpcy5yb3VuZChkdClcclxuICAgICAgICAgICAgICAgICAgICAgICAgKyAnIG1zICgnICsgdGhpcy5yb3VuZCh0aGlzLnN0ZXBzIC8gZHQgKiAxMDAwKSArICcgc3RlcHMvcyknO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZT8ud3JpdGVDb25zb2xlRW50cnkobWVzc2FnZSwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2codGhpcy50aW1lckV2ZW50cyArIFwiIFRpbWVFdmVudHMgaW4gXCIgKyBkdCArIFwiIG1zIGVyZ2lidCBlaW4gRXZlbnQgYWxsZSBcIiArIGR0L3RoaXMudGltZXJFdmVudHMgKyBcIiBtcy5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJWb3JnZWdlYmVuZSBUaW1lcmZyZXF1ZW56OiBBbGxlIFwiICsgdGhpcy50aW1lckRlbGF5TXMgKyBcIiBtc1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0ZXBzID0gLTE7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gaWYgKHRoaXMud29ybGRIZWxwZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgLy8gICAgIHRoaXMud29ybGRIZWxwZXIuc3ByaXRlQW5pbWF0aW9ucyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXI/LmRldGFjaEV2ZW50cygpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIgPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIHRoaXMubWFpbi5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGlmKHRoaXMud29ybGRIZWxwZXIgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgdGhpcy53b3JsZEhlbHBlci5jYWNoZUFzQml0bWFwKCk7XHJcbiAgICAgICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0b3AoKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wcmludDpcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHJpbnRsbjpcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIGxldCBjb2xvciA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS53aXRoQ29sb3IpIGNvbG9yID0gPHN0cmluZyB8IG51bWJlcj5zdGFjay5wb3AoKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICghbm9kZS5lbXB0eSkgdGV4dCA9IDxzdHJpbmc+c3RhY2sucG9wKCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS50eXBlID09IFRva2VuVHlwZS5wcmludGxuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wcmludE1hbmFnZXIucHJpbnRsbih0ZXh0LCBjb2xvcik7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRNYW5hZ2VyLnByaW50KHRleHQsIGNvbG9yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wdXNoRW1wdHlBcnJheTpcclxuICAgICAgICAgICAgICAgIGxldCBjb3VudHM6IG51bWJlcltdID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUuZGltZW5zaW9uOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBjb3VudHMucHVzaCg8bnVtYmVyPnN0YWNrLnBvcCgpLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godGhpcy5tYWtlRW1wdHlBcnJheShjb3VudHMsIG5vZGUuYXJyYXlUeXBlKSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYmVnaW5BcnJheTpcclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG5vZGUuYXJyYXlUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBbXVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuYWRkVG9BcnJheTpcclxuICAgICAgICAgICAgICAgIHN0YWNrVG9wIC09IG5vZGUubnVtYmVyT2ZFbGVtZW50c1RvQWRkO1xyXG4gICAgICAgICAgICAgICAgLy8gbGV0IHZhbHVlczogVmFsdWVbXSA9IHN0YWNrLnNwbGljZShzdGFja1RvcCArIDEsIG5vZGUubnVtYmVyT2ZFbGVtZW50c1RvQWRkKTtcclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZXM6IFZhbHVlW10gPSBzdGFjay5zcGxpY2Uoc3RhY2tUb3AgKyAxLCBub2RlLm51bWJlck9mRWxlbWVudHNUb0FkZCkubWFwKHR2byA9PiAoeyB0eXBlOiB0dm8udHlwZSwgdmFsdWU6IHR2by52YWx1ZSB9KSk7XHJcbiAgICAgICAgICAgICAgICBzdGFja1tzdGFja1RvcF0udmFsdWUgPSAoPGFueVtdPnN0YWNrW3N0YWNrVG9wXS52YWx1ZSkuY29uY2F0KHZhbHVlcyk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaEVudW1WYWx1ZTpcclxuICAgICAgICAgICAgICAgIGxldCBlbnVtSW5mbyA9IG5vZGUuZW51bUNsYXNzLmlkZW50aWZpZXJUb0luZm9NYXBbbm9kZS52YWx1ZUlkZW50aWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChub2RlLmVudW1DbGFzcy52YWx1ZUxpc3QudmFsdWVbZW51bUluZm8ub3JkaW5hbF0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmtleXdvcmRTd2l0Y2g6XHJcbiAgICAgICAgICAgICAgICBsZXQgc3dpdGNoVmFsdWUgPSBzdGFjay5wb3AoKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBkZXN0aW5hdGlvbiA9IG5vZGUuZGVzdGluYXRpb25NYXBbc3dpdGNoVmFsdWVdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGRlc3RpbmF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBkZXN0aW5hdGlvbiAtIDE7IC8vIGl0IHdpbGwgYmUgaW5jcmVhc2VkIGFmdGVyIHRoaXMgc3dpdGNoLXN0YXRlbWVudCFcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUuZGVmYXVsdERlc3RpbmF0aW9uICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gbm9kZS5kZWZhdWx0RGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGVyZSdzIGEganVtcG5vZGUgYWZ0ZXIgdGhpcyBub2RlIHdoaWNoIGp1bXBzIHJpZ2h0IGFmdGVyIGxhc3Qgc3dpdGNoIGNhc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gc28gdGhlcmUncyBub3RoaW5nIG1vcmUgdG8gZG8gaGVyZS5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5oZWFwVmFyaWFibGVEZWNsYXJhdGlvbjpcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdiA9IG5vZGUudmFyaWFibGU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmhlYXBbdi5pZGVudGlmaWVyXSA9IHY7XHJcbiAgICAgICAgICAgICAgICB2LnZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IHYudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogKHYudHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUpID8gdi50eXBlLmluaXRpYWxWYWx1ZSA6IG51bGxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChub2RlLnB1c2hPblRvcE9mU3RhY2tGb3JJbml0aWFsaXphdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaCh2LnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaEZyb21IZWFwVG9TdGFjazpcclxuICAgICAgICAgICAgICAgIGxldCB2MSA9IHRoaXMuaGVhcFtub2RlLmlkZW50aWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYxICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWNrLnB1c2godjEudmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJEaWUgVmFyaWFibGUgXCIgKyBub2RlLmlkZW50aWZpZXIgKyBcIiBpc3QgbmljaHQgYmVrYW5udC5cIjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5yZXR1cm5JZkRlc3Ryb3llZDpcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZVJ1bnRpbWVPYmplY3Q6IFJ1bnRpbWVPYmplY3QgPSB0aGlzLnN0YWNrW3N0YWNrZnJhbWVCZWdpbl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGVSdW50aW1lT2JqZWN0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2hhcGUgPSBzaGFwZVJ1bnRpbWVPYmplY3QuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaGFwZVtcImlzRGVzdHJveWVkXCJdID09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5yZXR1cm4obnVsbCwgc3RhY2spO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zZXRQYXVzZUR1cmF0aW9uOlxyXG4gICAgICAgICAgICAgICAgbGV0IGR1cmF0aW9uID0gdGhpcy5zdGFjay5wb3AoKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnBhdXNlVW50aWwgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucGF1c2VVbnRpbCA9IHBlcmZvcm1hbmNlLm5vdygpICsgZHVyYXRpb247XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucGF1c2U6XHJcbiAgICAgICAgICAgICAgICBub2RlLnN0ZXBGaW5pc2hlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wYXVzZVVudGlsICE9IG51bGwgJiYgcGVyZm9ybWFuY2Uubm93KCkgPCB0aGlzLnBhdXNlVW50aWwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24tLTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYXVzZVVudGlsID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24rKztcclxuXHJcbiAgICB9XHJcbiAgICByZXR1cm4obm9kZTogUmV0dXJuU3RhdGVtZW50IHwgbnVsbCwgc3RhY2s6IFZhbHVlW10pIHtcclxuXHJcbiAgICAgICAgbGV0IGN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCAmJiBub2RlLmNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczApIHtcclxuICAgICAgICAgICAgbGV0IHJldHVyblZhbHVlOiBWYWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICBzdGFja1t0aGlzLmN1cnJlbnRTdGFja2ZyYW1lXSA9IHJldHVyblZhbHVlO1xyXG4gICAgICAgICAgICBzdGFjay5zcGxpY2UodGhpcy5jdXJyZW50U3RhY2tmcmFtZSArIDEpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHN0YWNrLnNwbGljZSh0aGlzLmN1cnJlbnRTdGFja2ZyYW1lICsgKChub2RlICE9IG51bGwgJiYgbm9kZS5sZWF2ZVRoaXNPYmplY3RPblN0YWNrKSA/IDEgOiAwKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gdGhpcy5zdGFja2ZyYW1lcy5wb3AoKTtcclxuXHJcbiAgICAgICAgdGhpcy5wb3BQcm9ncmFtKCk7XHJcbiAgICAgICAgaWYgKG5vZGUgIT0gbnVsbCAmJiBub2RlLm1ldGhvZFdhc0luamVjdGVkID09IHRydWUpIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbisrO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbi0tOyAgLy8gcG9zaXRpb24gZ2V0cyBpbmNyZWFzZWQgYnkgb25lIGF0IHRoZSBlbmQgb2YgdGhpcyBzd2l0Y2gtc3RhdGVtZW50LCBzbyAuLi4gLSAxXHJcbiAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbC0tO1xyXG5cclxuICAgICAgICBpZiAoY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybih0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsIDwgMCAmJiB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHNbdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uICsgMV0udHlwZSA9PSBUb2tlblR5cGUuanVtcEFsd2F5cykge1xyXG4gICAgICAgICAgICB0aGlzLnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIG1ha2VFbXB0eUFycmF5KGNvdW50czogbnVtYmVyW10sIHR5cGU6IFR5cGUpOiBWYWx1ZSB7XHJcbiAgICAgICAgbGV0IHR5cGUxID0gKDxBcnJheVR5cGU+dHlwZSkuYXJyYXlPZlR5cGU7XHJcbiAgICAgICAgaWYgKGNvdW50cy5sZW5ndGggPT0gMSkge1xyXG4gICAgICAgICAgICBsZXQgYXJyYXk6IFZhbHVlW10gPSBbXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudHNbMF07IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHYgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZTEsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG51bGxcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUxIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHYudmFsdWUgPSB0eXBlMS5pbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYXJyYXkucHVzaCh2KTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogYXJyYXlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgYXJyYXk6IFZhbHVlW10gPSBbXTtcclxuICAgICAgICAgICAgbGV0IG4gPSBjb3VudHMucG9wKCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBhcnJheS5wdXNoKHRoaXMubWFrZUVtcHR5QXJyYXkoY291bnRzLCB0eXBlMSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IGFycmF5XHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICByb3VuZChuOiBudW1iZXIpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiBcIlwiICsgTWF0aC5yb3VuZChuICogMTAwMDApIC8gMTAwMDA7XHJcbiAgICB9XHJcblxyXG4gICAgcnVubmluZ1N0YXRlczogSW50ZXJwcmV0ZXJTdGF0ZVtdID0gW0ludGVycHJldGVyU3RhdGUucGF1c2VkLCBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcsIEludGVycHJldGVyU3RhdGUud2FpdGluZ0ZvcklucHV0XTtcclxuXHJcbiAgICBzZXRTdGF0ZShzdGF0ZTogSW50ZXJwcmV0ZXJTdGF0ZSkge1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNldCBzdGF0ZSBcIiArIEludGVycHJldGVyU3RhdGVbc3RhdGVdKTtcclxuXHJcbiAgICAgICAgbGV0IG9sZFN0YXRlID0gdGhpcy5zdGF0ZTtcclxuICAgICAgICB0aGlzLnN0YXRlID0gc3RhdGU7XHJcblxyXG4gICAgICAgIGlmIChzdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmVycm9yIHx8IHN0YXRlID09IEludGVycHJldGVyU3RhdGUuZG9uZSkge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlQWxsV2Vic29ja2V0cygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFtID0gdGhpcy5tYWluLmdldEFjdGlvbk1hbmFnZXIoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYWN0aW9uSWQgb2YgdGhpcy5hY3Rpb25zKSB7XHJcbiAgICAgICAgICAgIGFtLnNldEFjdGl2ZShcImludGVycHJldGVyLlwiICsgYWN0aW9uSWQsIHRoaXMuYnV0dG9uQWN0aXZlTWF0cml4W2FjdGlvbklkXVtzdGF0ZV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJ1dHRvblN0YXJ0QWN0aXZlID0gdGhpcy5idXR0b25BY3RpdmVNYXRyaXhbJ3N0YXJ0J11bc3RhdGVdO1xyXG5cclxuICAgICAgICBpZiAoYnV0dG9uU3RhcnRBY3RpdmUpIHtcclxuICAgICAgICAgICAgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RhcnQuc2hvdygpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25QYXVzZS5oaWRlKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RhcnQuaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25QYXVzZS5zaG93KCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYnV0dG9uU3RvcEFjdGl2ZSA9IHRoaXMuYnV0dG9uQWN0aXZlTWF0cml4WydzdG9wJ11bc3RhdGVdO1xyXG4gICAgICAgIGlmIChidXR0b25TdG9wQWN0aXZlKSB7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuY29udHJvbEJ1dHRvbnMuJGJ1dHRvbkVkaXQuc2hvdygpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIHRoaXMuY29udHJvbEJ1dHRvbnMuJGJ1dHRvbkVkaXQuaGlkZSgpO1xyXG4gICAgICAgICAgICBpZiAodGhpcy53b3JsZEhlbHBlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkSGVscGVyLmNsZWFyQWN0b3JMaXN0cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyPy5kZXRhY2hFdmVudHMoKTtcclxuICAgICAgICAgICAgdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMucnVubmluZ1N0YXRlcy5pbmRleE9mKG9sZFN0YXRlKSA+PSAwICYmIHRoaXMucnVubmluZ1N0YXRlcy5pbmRleE9mKHN0YXRlKSA8IDApIHtcclxuICAgICAgICAgICAgdGhpcy5kZWJ1Z2dlci5kaXNhYmxlKCk7XHJcbiAgICAgICAgICAgIC8vIHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKS51cGRhdGVPcHRpb25zKHsgcmVhZE9ubHk6IGZhbHNlIH0pO1xyXG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkVG9vbC51bnN1YnNjcmliZUFsbExpc3RlbmVycygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMucnVubmluZ1N0YXRlcy5pbmRleE9mKG9sZFN0YXRlKSA8IDAgJiYgdGhpcy5ydW5uaW5nU3RhdGVzLmluZGV4T2Yoc3RhdGUpID49IDApIHtcclxuICAgICAgICAgICAgdGhpcy5kZWJ1Z2dlci5lbmFibGUoKTtcclxuICAgICAgICAgICAgLy8gdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnVwZGF0ZU9wdGlvbnMoeyByZWFkT25seTogdHJ1ZSB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNsb3NlQWxsV2Vic29ja2V0cygpIHtcclxuICAgICAgICB0aGlzLndlYlNvY2tldHNUb0Nsb3NlQWZ0ZXJQcm9ncmFtSGFsdC5mb3JFYWNoKHNvY2tldCA9PiBzb2NrZXQuY2xvc2UoKSk7XHJcbiAgICAgICAgdGhpcy53ZWJTb2NrZXRzVG9DbG9zZUFmdGVyUHJvZ3JhbUhhbHQgPSBbXTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVzaEN1cnJlbnRQcm9ncmFtKCkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UHJvZ3JhbSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCB0ZXh0UG9zaXRpb246IFRleHRQb3NpdGlvbjtcclxuICAgICAgICBsZXQgY3VycmVudFN0YXRlbWVudCA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50c1t0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb25dO1xyXG4gICAgICAgIGlmIChjdXJyZW50U3RhdGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGV4dFBvc2l0aW9uID0gY3VycmVudFN0YXRlbWVudC5wb3NpdGlvbjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICBwcm9ncmFtOiB0aGlzLmN1cnJlbnRQcm9ncmFtLFxyXG4gICAgICAgICAgICBwcm9ncmFtUG9zaXRpb246IHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbixcclxuICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiB0ZXh0UG9zaXRpb24sXHJcbiAgICAgICAgICAgIG1ldGhvZDogdGhpcy5jdXJyZW50TWV0aG9kLFxyXG4gICAgICAgICAgICBjYWxsYmFja0FmdGVyUmV0dXJuOiB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuLFxyXG4gICAgICAgICAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiB0aGlzLmN1cnJlbnRJc0NhbGxlZEZyb21PdXRzaWRlXHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IG51bGw7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50SXNDYWxsZWRGcm9tT3V0c2lkZSA9IG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vIHJ1blRpbWVyKG1ldGhvZDogTWV0aG9kLCBzdGFja0VsZW1lbnRzOiBWYWx1ZVtdLFxyXG4gICAgLy8gICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IChpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXIpID0+IHZvaWQpIHtcclxuXHJcbiAgICAvLyAgICAgaWYodGhpcy5zdGF0ZSAhPSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcpe1xyXG4gICAgLy8gICAgICAgICByZXR1cm47XHJcbiAgICAvLyAgICAgfVxyXG5cclxuICAgIC8vICAgICB0aGlzLnB1c2hDdXJyZW50UHJvZ3JhbSgpO1xyXG5cclxuICAgIC8vICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gbWV0aG9kLnByb2dyYW07XHJcbiAgICAvLyAgICAgdGhpcy5jdXJyZW50TWV0aG9kID0gbWV0aG9kO1xyXG4gICAgLy8gICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcbiAgICAvLyAgICAgdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IGNhbGxiYWNrQWZ0ZXJSZXR1cm47XHJcbiAgICAvLyAgICAgdGhpcy5jdXJyZW50SXNDYWxsZWRGcm9tT3V0c2lkZSA9IFwiVGltZXJcIjtcclxuXHJcbiAgICAvLyAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgLy8gICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSB0aGlzLnN0YWNrLmxlbmd0aDtcclxuICAgIC8vICAgICBmb3IgKGxldCBzZSBvZiBzdGFja0VsZW1lbnRzKSB0aGlzLnN0YWNrLnB1c2goc2UpO1xyXG4gICAgLy8gICAgIGxldCBzdGF0ZW1lbnRzID0gbWV0aG9kLnByb2dyYW0uc3RhdGVtZW50cztcclxuXHJcbiAgICAvLyAgICAgLy8gaWYgcHJvZ3JhbSBlbmRzIHdpdGggcmV0dXJuIHRoZW4gdGhpcyByZXR1cm4tc3RhdGVtZW50IGRlY3JlYXNlcyBzdGVwT3Zlck5lc3RpbmdMZXZlbC4gU28gd2UgaW5jcmVhc2UgaXRcclxuICAgIC8vICAgICAvLyBiZWZvcmVoYW5kIHRvIGNvbXBlbnNhdGUgdGhpcyBlZmZlY3QuXHJcbiAgICAvLyAgICAgaWYoc3RhdGVtZW50c1tzdGF0ZW1lbnRzLmxlbmd0aCAtIDFdLnR5cGUgPT0gVG9rZW5UeXBlLnJldHVybikgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCsrO1xyXG5cclxuICAgIC8vIH1cclxuXHJcbiAgICBydW5UaW1lcihtZXRob2Q6IE1ldGhvZCwgc3RhY2tFbGVtZW50czogVmFsdWVbXSxcclxuICAgICAgICBjYWxsYmFja0FmdGVyUmV0dXJuOiAoaW50ZXJwcmV0ZXI6IEludGVycHJldGVyKSA9PiB2b2lkLCBpc0FjdG9yOiBib29sZWFuKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnN0YXRlICE9IEludGVycHJldGVyU3RhdGUucnVubmluZykge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhdGVtZW50cyA9IG1ldGhvZC5wcm9ncmFtLnN0YXRlbWVudHM7XHJcblxyXG4gICAgICAgIGlmIChpc0FjdG9yIHx8IHRoaXMucHJvZ3JhbVN0YWNrLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIC8vIE1haW4gUHJvZ3JhbSBpcyBydW5uaW5nID0+IFRpbWVyIGhhcyBoaWdoZXIgcHJlY2VkZW5jZVxyXG4gICAgICAgICAgICB0aGlzLnB1c2hDdXJyZW50UHJvZ3JhbSgpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IG1ldGhvZC5wcm9ncmFtO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRNZXRob2QgPSBtZXRob2Q7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4gPSBjYWxsYmFja0FmdGVyUmV0dXJuO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRJc0NhbGxlZEZyb21PdXRzaWRlID0gXCJUaW1lclwiO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gdGhpcy5zdGFjay5sZW5ndGg7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhY2sgPSB0aGlzLnN0YWNrLmNvbmNhdChzdGFja0VsZW1lbnRzKTtcclxuICAgICAgICAgICAgLy8gZm9yIChsZXQgc2Ugb2Ygc3RhY2tFbGVtZW50cykgdGhpcy5zdGFjay5wdXNoKHNlKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmIHByb2dyYW0gZW5kcyB3aXRoIHJldHVybiB0aGVuIHRoaXMgcmV0dXJuLXN0YXRlbWVudCBkZWNyZWFzZXMgc3RlcE92ZXJOZXN0aW5nTGV2ZWwuIFNvIHdlIGluY3JlYXNlIGl0XHJcbiAgICAgICAgICAgIC8vIGJlZm9yZWhhbmQgdG8gY29tcGVuc2F0ZSB0aGlzIGVmZmVjdC5cclxuICAgICAgICAgICAgaWYgKHN0YXRlbWVudHNbc3RhdGVtZW50cy5sZW5ndGggLSAxXS50eXBlID09IFRva2VuVHlwZS5yZXR1cm4pIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwrKztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBhbm90aGVyIFRpbWVyIGlzIHJ1bm5pbmcgPT4gcXVldWUgdXBcclxuICAgICAgICAgICAgLy8gcG9zaXRpb24gMCBpbiBwcm9ncmFtIHN0YWNrIGlzIG1haW4gcHJvZ3JhbVxyXG4gICAgICAgICAgICAvLyA9PiBpbnNlcnQgdGltZXIgaW4gcG9zaXRpb24gMVxyXG5cclxuICAgICAgICAgICAgdGhpcy5wcm9ncmFtU3RhY2suc3BsaWNlKDEsIDAsIHtcclxuICAgICAgICAgICAgICAgIHByb2dyYW06IG1ldGhvZC5wcm9ncmFtLFxyXG4gICAgICAgICAgICAgICAgcHJvZ3JhbVBvc2l0aW9uOiAwLFxyXG4gICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiB7IGxpbmU6IDAsIGNvbHVtbjogMCwgbGVuZ3RoOiAwIH0sXHJcbiAgICAgICAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcclxuICAgICAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IGNhbGxiYWNrQWZ0ZXJSZXR1cm4sXHJcbiAgICAgICAgICAgICAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiBcIlRpbWVyXCIsXHJcbiAgICAgICAgICAgICAgICBzdGFja0VsZW1lbnRzVG9QdXNoQmVmb3JlRmlyc3RFeGVjdXRpbmc6IHN0YWNrRWxlbWVudHNcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGVtZW50c1tzdGF0ZW1lbnRzLmxlbmd0aCAtIDFdLnR5cGUgPT0gVG9rZW5UeXBlLnJldHVybikgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCsrO1xyXG5cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBldmFsdWF0ZShwcm9ncmFtOiBQcm9ncmFtKTogeyBlcnJvcjogc3RyaW5nLCB2YWx1ZTogVmFsdWUgfSB7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBwcm9ncmFtO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIGxldCBzdGFja3NpemVCZWZvcmUgPSB0aGlzLnN0YWNrLmxlbmd0aDtcclxuXHJcbiAgICAgICAgbGV0IG9sZEludGVycHJldGVyU3RhdGUgPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIGxldCBzdGVwT3Zlck5lc3RpbmdMZXZlbCA9IHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWw7XHJcbiAgICAgICAgbGV0IGFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnID0gdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZztcclxuXHJcbiAgICAgICAgbGV0IG9sZFN0YWNrZnJhbWUgPSB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lO1xyXG5cclxuICAgICAgICBsZXQgZXJyb3I6IHN0cmluZztcclxuICAgICAgICBsZXQgc3RlcENvdW50ID0gMDtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgd2hpbGUgKGVycm9yID09IG51bGwgJiZcclxuICAgICAgICAgICAgICAgICh0aGlzLmN1cnJlbnRQcm9ncmFtICE9IHByb2dyYW0gfHwgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uIDxcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgJiYgc3RlcENvdW50IDwgMTAwMDAwXHJcbiAgICAgICAgICAgICAgICAvLyAmJiB0aGlzLmN1cnJlbnRQcm9ncmFtID09IHByb2dyYW1cclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBlcnJvciA9IHRoaXMubmV4dFN0ZXAoKTtcclxuICAgICAgICAgICAgICAgIHN0ZXBDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBlcnJvciA9IFwiRmVobGVyIGJlaSBkZXIgQXVzd2VydHVuZ1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW0gPT0gcHJvZ3JhbSAmJiB0aGlzLnByb2dyYW1TdGFjay5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMucG9wUHJvZ3JhbSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YWNrVG9wOiBWYWx1ZTtcclxuICAgICAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPiBzdGFja3NpemVCZWZvcmUpIHtcclxuICAgICAgICAgICAgc3RhY2tUb3AgPSB0aGlzLnN0YWNrLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuc3RhY2subGVuZ3RoID4gc3RhY2tzaXplQmVmb3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCA9IHN0ZXBPdmVyTmVzdGluZ0xldmVsO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSBhZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZztcclxuICAgICAgICB0aGlzLnNldFN0YXRlKG9sZEludGVycHJldGVyU3RhdGUpO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBlcnJvcjogZXJyb3IsXHJcbiAgICAgICAgICAgIHZhbHVlOiBzdGFja1RvcFxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZUltbWVkaWF0ZWx5SW5OZXdTdGFja2ZyYW1lKHByb2dyYW06IFByb2dyYW0sIHZhbHVlc1RvUHVzaEJlZm9yZUV4ZWN1dGluZzogVmFsdWVbXSk6IHsgZXJyb3I6IHN0cmluZywgdmFsdWU6IFZhbHVlIH0ge1xyXG5cclxuICAgICAgICB0aGlzLnB1c2hDdXJyZW50UHJvZ3JhbSgpO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gcHJvZ3JhbTtcclxuICAgICAgICBsZXQgb2xkUHJvZ3JhbVBvc2l0aW9uID0gdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIGxldCBudW1iZXJPZlN0YWNrZnJhbWVzQmVmb3JlID0gdGhpcy5zdGFja2ZyYW1lcy5sZW5ndGg7XHJcbiAgICAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgICAgIGxldCBzdGFja3NpemVCZWZvcmUgPSB0aGlzLnN0YWNrLmxlbmd0aDtcclxuICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gc3RhY2tzaXplQmVmb3JlO1xyXG5cclxuICAgICAgICBmb3IgKGxldCB2IG9mIHZhbHVlc1RvUHVzaEJlZm9yZUV4ZWN1dGluZykgdGhpcy5zdGFjay5wdXNoKHYpO1xyXG5cclxuICAgICAgICBsZXQgb2xkSW50ZXJwcmV0ZXJTdGF0ZSA9IHRoaXMuc3RhdGU7XHJcbiAgICAgICAgbGV0IHN0ZXBPdmVyTmVzdGluZ0xldmVsID0gdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbDtcclxuICAgICAgICBsZXQgYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSB0aGlzLmFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHN0ZXBDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IGVycm9yID0gbnVsbDtcclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuc3RhY2tmcmFtZXMubGVuZ3RoID4gbnVtYmVyT2ZTdGFja2ZyYW1lc0JlZm9yZVxyXG4gICAgICAgICAgICAgICAgJiYgc3RlcENvdW50IDwgMTAwMDAwICYmIGVycm9yID09IG51bGxcclxuICAgICAgICAgICAgKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgbm9kZSA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50c1t0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb25dO1xyXG5cclxuICAgICAgICAgICAgICAgIGVycm9yID0gdGhpcy5leGVjdXRlTm9kZShub2RlKTtcclxuICAgICAgICAgICAgICAgIHN0ZXBDb3VudCsrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgICAgICBlcnJvciA9IFwiRmVobGVyIGJlaSBkZXIgQXVzd2VydHVuZ1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN0ZXBDb3VudCA9PSAxMDAwMDApIHRoaXMudGhyb3dFeGNlcHRpb24oXCJEaWUgQXVzZsO8aHJ1bmcgZGVzIEtvbnN0cnVrdG9ycyBkYXVlcnRlIHp1IGxhbmdlLlwiKTtcclxuXHJcbiAgICAgICAgbGV0IHN0YWNrVG9wOiBWYWx1ZTtcclxuICAgICAgICBpZiAodGhpcy5zdGFjay5sZW5ndGggPiBzdGFja3NpemVCZWZvcmUpIHtcclxuICAgICAgICAgICAgc3RhY2tUb3AgPSB0aGlzLnN0YWNrLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgd2hpbGUgKHRoaXMuc3RhY2subGVuZ3RoID4gc3RhY2tzaXplQmVmb3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCA9IHN0ZXBPdmVyTmVzdGluZ0xldmVsO1xyXG4gICAgICAgIHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSBhZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZztcclxuICAgICAgICAvLyB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24rKztcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gb2xkUHJvZ3JhbVBvc2l0aW9uO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUob2xkSW50ZXJwcmV0ZXJTdGF0ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICAgICAgdmFsdWU6IHN0YWNrVG9wXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbnN0YW50aWF0ZU9iamVjdEltbWVkaWF0ZWx5KGtsYXNzOiBLbGFzcyk6IFJ1bnRpbWVPYmplY3Qge1xyXG4gICAgICAgIGxldCBvYmplY3QgPSBuZXcgUnVudGltZU9iamVjdChrbGFzcyk7XHJcblxyXG4gICAgICAgIGxldCB2YWx1ZSA9IHtcclxuICAgICAgICAgICAgdmFsdWU6IG9iamVjdCxcclxuICAgICAgICAgICAgdHlwZToga2xhc3NcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBsZXQga2xhc3MxID0ga2xhc3M7XHJcblxyXG4gICAgICAgIHdoaWxlIChrbGFzczEgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBsZXQgYWlwID0ga2xhc3MxLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTtcclxuICAgICAgICAgICAgaWYgKGFpcC5zdGF0ZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4ZWN1dGVJbW1lZGlhdGVseUluTmV3U3RhY2tmcmFtZShhaXAsIFt2YWx1ZV0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBrbGFzczEgPSBrbGFzczEuYmFzZUNsYXNzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGNvbnN0cnVjdG9yID0ga2xhc3MuZ2V0TWV0aG9kQnlTaWduYXR1cmUoa2xhc3MuaWRlbnRpZmllciArIFwiKClcIik7XHJcbiAgICAgICAgaWYgKGNvbnN0cnVjdG9yICE9IG51bGwgJiYgY29uc3RydWN0b3IucHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIC8vIGxldCBwcm9ncmFtV2l0aG91dFJldHVyblN0YXRlbWVudDogUHJvZ3JhbSA9IHtcclxuICAgICAgICAgICAgLy8gICAgIGxhYmVsTWFuYWdlcjogbnVsbCxcclxuICAgICAgICAgICAgLy8gICAgIG1vZHVsZTogY29uc3RydWN0b3IucHJvZ3JhbS5tb2R1bGUsXHJcbiAgICAgICAgICAgIC8vICAgICBzdGF0ZW1lbnRzOiBjb25zdHJ1Y3Rvci5wcm9ncmFtLnN0YXRlbWVudHMuc2xpY2UoMCwgY29uc3RydWN0b3IucHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCAtIDEpXHJcbiAgICAgICAgICAgIC8vIH07XHJcbiAgICAgICAgICAgIHRoaXMuZXhlY3V0ZUltbWVkaWF0ZWx5SW5OZXdTdGFja2ZyYW1lKGNvbnN0cnVjdG9yLnByb2dyYW0sIFt2YWx1ZV0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcclxuXHJcbiAgICB9XHJcblxyXG59Il19