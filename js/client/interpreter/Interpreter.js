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
        this.runningStates = [InterpreterState.paused, InterpreterState.running, InterpreterState.waitingForInput];
        this.printManager = new PrintManager($runDiv, this.main);
        this.inputManager = new InputManager($runDiv, this.main);
        if (main.isEmbedded()) {
            this.keyboardTool = new KeyboardTool(jQuery('html'), main);
        }
        else {
            this.keyboardTool = new KeyboardTool(jQuery(window), main);
        }
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
        if (this.state == InterpreterState.error || this.state == InterpreterState.done) {
            this.init();
            this.resetRuntime();
        }
        this.setState(InterpreterState.running);
        this.hideProgrampointerPosition();
        this.timeWhenProgramStarted = performance.now();
        this.timerStopped = false;
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
            if (this.state == InterpreterState.paused) {
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
        this.pause();
        if (this.worldHelper != null) {
            this.worldHelper.spriteAnimations = [];
        }
        (_a = this.gngEreignisbehandlungHelper) === null || _a === void 0 ? void 0 : _a.detachEvents();
        this.gngEreignisbehandlungHelper = null;
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
        }
        else {
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
    }
    nextStep() {
        let stepFinished = false;
        let node;
        let exception;
        while (!stepFinished && !this.additionalStepFinishedFlag && exception == null) {
            if (this.currentProgramPosition > this.currentProgram.statements.length - 1) {
                this.setState(InterpreterState.done);
                break;
            }
            node = this.currentProgram.statements[this.currentProgramPosition];
            if (node.stepFinished != null) {
                stepFinished = node.stepFinished;
            }
            exception = this.executeNode(node);
        }
        this.additionalStepFinishedFlag = false;
        this.steps++;
        return exception;
    }
    executeNode(node) {
        var _a, _b, _c;
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
                    method = object.value.class.getMethodBySignature(method.signature);
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
                if ((this.worldHelper != null && this.worldHelper.actActors.length > 0) || this.processingHelper != null
                    || (this.gngEreignisbehandlungHelper != null && this.gngEreignisbehandlungHelper.aktionsempfaengerMap["ausführen"].length > 0)) {
                    this.currentProgramPosition--;
                    break;
                }
                let baseModule = this.main.getCurrentWorkspace().moduleStore.getModule("Base Module");
                let timerClass = baseModule.typeStore.getType("Timer");
                if (timerClass.timerEntries.length > 0) {
                    this.currentProgramPosition--;
                    break;
                }
                this.setState(InterpreterState.done);
                this.currentProgram = null;
                this.currentProgramPosition = -1;
                this.additionalStepFinishedFlag = true;
                Helper.showHelper("speedControlHelper", this.main);
                this.printManager.showProgramEnd();
                if (this.worldHelper != null) {
                    this.worldHelper.spriteAnimations = [];
                }
                (_a = this.gngEreignisbehandlungHelper) === null || _a === void 0 ? void 0 : _a.detachEvents();
                this.gngEreignisbehandlungHelper = null;
                this.main.hideProgramPointerPosition();
                if (this.steps > 0) {
                    let dt = performance.now() - this.timeWhenProgramStarted;
                    let message = 'Executed ' + this.steps + ' steps in ' + this.round(dt)
                        + ' ms (' + this.round(this.steps / dt * 1000) + ' steps/s)';
                    (_c = (_b = this.main.getBottomDiv()) === null || _b === void 0 ? void 0 : _b.console) === null || _c === void 0 ? void 0 : _c.writeConsoleEntry(message, null);
                    // console.log(this.timerEvents + " TimeEvents in " + dt + " ms ergibt ein Event alle " + dt/this.timerEvents + " ms.");
                    // console.log("Vorgegebene Timerfrequenz: Alle " + this.timerDelayMs + " ms");
                    this.steps = -1;
                }
                this.currentProgramPosition--;
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
            this.webSocketsToCloseAfterProgramHalt.forEach(socket => socket.close());
            this.webSocketsToCloseAfterProgramHalt = [];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW50ZXJwcmV0ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2ludGVycHJldGVyL0ludGVycHJldGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBZ0IsU0FBUyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFHckUsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3ZELE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDOUQsT0FBTyxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ3BFLE9BQU8sRUFBRSxhQUFhLEVBQXFCLE1BQU0sRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3RGLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSw2QkFBNkIsQ0FBQztBQUczRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDbkQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFDNUYsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBRWpELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUUvQyxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFVeEQsTUFBTSxDQUFOLElBQVksZ0JBRVg7QUFGRCxXQUFZLGdCQUFnQjtJQUN4Qiw2RUFBZSxDQUFBO0lBQUUsNkRBQU8sQ0FBQTtJQUFFLDJEQUFNLENBQUE7SUFBRSx5REFBSyxDQUFBO0lBQUUsdURBQUksQ0FBQTtJQUFFLDZFQUFlLENBQUE7SUFBRSx5RkFBcUIsQ0FBQTtBQUN6RixDQUFDLEVBRlcsZ0JBQWdCLEtBQWhCLGdCQUFnQixRQUUzQjtBQVlELE1BQU0sT0FBTyxXQUFXO0lBeUVwQixZQUFtQixJQUFjLEVB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YixJQUFJLEVBQUUsS0FBSztTQUNkLENBQUM7UUFFRixJQUFJLE1BQU0sR0FBRyxLQUFLLENBQUM7UUFFbkIsT0FBTyxNQUFNLElBQUksSUFBSSxFQUFFO1lBQ25CLElBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyw4QkFBOEIsQ0FBQztZQUNoRCxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFFM0IsSUFBSSxDQUFDLGlDQUFpQyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7YUFFeEQ7WUFDRCxNQUFNLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztTQUM3QjtRQUVELElBQUksV0FBVyxHQUFHLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3RFLElBQUksV0FBVyxJQUFJLElBQUksSUFBSSxXQUFXLENBQUMsT0FBTyxJQUFJLElBQUksRUFBRTtZQUNwRCxpREFBaUQ7WUFDakQsMEJBQTBCO1lBQzFCLDBDQUEwQztZQUMxQyxxR0FBcUc7WUFDckcsS0FBSztZQUNMLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztTQUN4RTtRQUVELE9BQU8sTUFBTSxDQUFDO0lBRWxCLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFRleHRQb3NpdGlvbiwgVG9rZW5UeXBlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSwgTW9kdWxlU3RvcmUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtLCBTdGF0ZW1lbnQsIFJldHVyblN0YXRlbWVudCB9IGZyb20gXCIuLi9jb21waWxlci9wYXJzZXIvUHJvZ3JhbS5qc1wiO1xyXG5pbXBvcnQgeyBBcnJheVR5cGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvQXJyYXkuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MsIEludGVyZmFjZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtLCBFbnVtUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9FbnVtLmpzXCI7XHJcbmltcG9ydCB7IFByaW1pdGl2ZVR5cGUsIFR5cGUsIFZhbHVlLCBIZWFwLCBNZXRob2QgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgUHJpbnRNYW5hZ2VyIH0gZnJvbSBcIi4uL21haW4vZ3VpL1ByaW50TWFuYWdlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBEZWJ1Z2dlciB9IGZyb20gXCIuL0RlYnVnZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IGludFByaW1pdGl2ZVR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgSW5wdXRNYW5hZ2VyIH0gZnJvbSBcIi4vSW5wdXRNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFdvcmxkSGVscGVyIH0gZnJvbSBcIi4uL3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1dvcmxkLmpzXCI7XHJcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuLi9tYWluL2d1aS9IZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgVGltZXJDbGFzcyB9IGZyb20gXCIuLi9ydW50aW1lbGlicmFyeS9UaW1lci5qc1wiO1xyXG5pbXBvcnQgeyBLZXlib2FyZFRvb2wgfSBmcm9tIFwiLi4vdG9vbHMvS2V5Ym9hcmRUb29sLmpzXCI7XHJcbmltcG9ydCB7IFByb2dyYW1Db250cm9sQnV0dG9ucyB9IGZyb20gXCIuLi9tYWluL2d1aS9Qcm9ncmFtQ29udHJvbEJ1dHRvbnMuanNcIjtcclxuaW1wb3J0IHsgTWFpbkJhc2UgfSBmcm9tIFwiLi4vbWFpbi9NYWluQmFzZS5qc1wiO1xyXG5pbXBvcnQgeyBMaXN0SGVscGVyIH0gZnJvbSBcIi4uL3J1bnRpbWVsaWJyYXJ5L2NvbGxlY3Rpb25zL0FycmF5TGlzdC5qc1wiO1xyXG5pbXBvcnQgeyBHcm91cEhlbHBlciB9IGZyb20gXCIuLi9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Hcm91cC5qc1wiO1xyXG5pbXBvcnQgeyBXZWJTb2NrZXRSZXF1ZXN0S2VlcEFsaXZlIH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluRW1iZWRkZWQgfSBmcm9tIFwiLi4vZW1iZWRkZWQvTWFpbkVtYmVkZGVkLmpzXCI7XHJcbmltcG9ydCB7IFByb2Nlc3NpbmdIZWxwZXIgfSBmcm9tIFwiLi4vcnVudGltZWxpYnJhcnkvZ3JhcGhpY3MvUHJvY2Vzc2luZy5qc1wiO1xyXG5pbXBvcnQgeyBHTkdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIgfSBmcm9tIFwiLi4vcnVudGltZWxpYnJhcnkvZ25nL0dOR0VyZWlnbmlzYmVoYW5kbHVuZy5qc1wiO1xyXG5cclxuZXhwb3J0IGVudW0gSW50ZXJwcmV0ZXJTdGF0ZSB7XHJcbiAgICBub3RfaW5pdGlhbGl6ZWQsIHJ1bm5pbmcsIHBhdXNlZCwgZXJyb3IsIGRvbmUsIHdhaXRpbmdGb3JJbnB1dCwgd2FpdGluZ0ZvclRpbWVyc1RvRW5kXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFByb2dyYW1TdGFja0VsZW1lbnQgPSB7XHJcbiAgICBwcm9ncmFtOiBQcm9ncmFtLFxyXG4gICAgcHJvZ3JhbVBvc2l0aW9uOiBudW1iZXIsICAvLyBuZXh0IHBvc2l0aW9uIHRvIGV4ZWN1dGUgYWZ0ZXIgcmV0dXJuXHJcbiAgICB0ZXh0UG9zaXRpb246IFRleHRQb3NpdGlvbiwgLy8gdGV4dHBvc2l0aW9uIG9mIG1ldGhvZCBjYWxsXHJcbiAgICBtZXRob2Q6IE1ldGhvZCB8IHN0cmluZyxcclxuICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IChpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXIpID0+IHZvaWQsXHJcbiAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiBzdHJpbmcsXHJcbiAgICBzdGFja0VsZW1lbnRzVG9QdXNoQmVmb3JlRmlyc3RFeGVjdXRpbmc/OiBWYWx1ZVtdXHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgSW50ZXJwcmV0ZXIge1xyXG5cclxuICAgIGRlYnVnZ2VyOiBEZWJ1Z2dlcjtcclxuXHJcbiAgICBtYWluTW9kdWxlOiBNb2R1bGU7XHJcbiAgICBtb2R1bGVTdG9yZTogTW9kdWxlU3RvcmU7XHJcbiAgICBtb2R1bGVTdG9yZVZlcnNpb246IG51bWJlciA9IC0xMDA7XHJcblxyXG4gICAgcHJpbnRNYW5hZ2VyOiBQcmludE1hbmFnZXI7XHJcbiAgICBpbnB1dE1hbmFnZXI6IElucHV0TWFuYWdlcjtcclxuXHJcbiAgICBzdGVwc1BlclNlY29uZCA9IDI7XHJcbiAgICBtYXhTdGVwc1BlclNlY29uZCA9IDEwMDAwMDA7XHJcbiAgICB0aW1lckRlbGF5TXMgPSAxMDtcclxuXHJcbiAgICB0aW1lcklkOiBhbnk7XHJcbiAgICBzdGF0ZTogSW50ZXJwcmV0ZXJTdGF0ZTtcclxuXHJcbiAgICBjdXJyZW50UHJvZ3JhbTogUHJvZ3JhbTtcclxuICAgIGN1cnJlbnRQcm9ncmFtUG9zaXRpb246IG51bWJlcjtcclxuICAgIGN1cnJlbnRNZXRob2Q6IE1ldGhvZCB8IHN0cmluZztcclxuICAgIGN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuOiAoaW50ZXJwcmV0ZXI6IEludGVycHJldGVyKSA9PiB2b2lkO1xyXG4gICAgY3VycmVudElzQ2FsbGVkRnJvbU91dHNpZGU6IHN0cmluZ1xyXG5cclxuICAgIHByb2dyYW1TdGFjazogUHJvZ3JhbVN0YWNrRWxlbWVudFtdID0gW107XHJcblxyXG4gICAgc3RhY2s6IFZhbHVlW10gPSBbXTtcclxuICAgIHN0YWNrZnJhbWVzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgY3VycmVudFN0YWNrZnJhbWU6IG51bWJlcjtcclxuXHJcbiAgICBoZWFwOiBIZWFwID0ge307XHJcblxyXG4gICAgdGltZXJTdG9wcGVkOiBib29sZWFuID0gdHJ1ZTtcclxuICAgIHRpbWVyRXh0ZXJuOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgc3RlcHM6IG51bWJlciA9IDA7XHJcbiAgICB0aW1lTmV0dG86IG51bWJlciA9IDA7XHJcbiAgICB0aW1lV2hlblByb2dyYW1TdGFydGVkOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHN0ZXBPdmVyTmVzdGluZ0xldmVsOiBudW1iZXIgPSAwO1xyXG4gICAgbGVhdmVMaW5lOiBudW1iZXIgPSAtMTtcclxuICAgIGFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgaXNGaXJzdFN0YXRlbWVudDogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgc2hvd1Byb2dyYW1wb2ludGVyVXB0b1N0ZXBzUGVyU2Vjb25kID0gMTU7XHJcblxyXG4gICAgd29ybGRIZWxwZXI6IFdvcmxkSGVscGVyO1xyXG4gICAgZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyOiBHTkdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXI7XHJcbiAgICBwcm9jZXNzaW5nSGVscGVyOiBQcm9jZXNzaW5nSGVscGVyO1xyXG5cclxuICAgIGtleWJvYXJkVG9vbDogS2V5Ym9hcmRUb29sO1xyXG5cclxuICAgIHdlYlNvY2tldHNUb0Nsb3NlQWZ0ZXJQcm9ncmFtSGFsdDogV2ViU29ja2V0W10gPSBbXTtcclxuXHJcblxyXG4gICAgYWN0aW9uczogc3RyaW5nW10gPSBbXCJzdGFydFwiLCBcInBhdXNlXCIsIFwic3RvcFwiLCBcInN0ZXBPdmVyXCIsXHJcbiAgICAgICAgXCJzdGVwSW50b1wiLCBcInN0ZXBPdXRcIiwgXCJyZXN0YXJ0XCJdO1xyXG5cclxuICAgIC8vIGJ1dHRvbkFjdGl2ZU1hdHJpeFtidXR0b25dW2ldIHRlbGxzIGlmIGJ1dHRvbiBpcyBhY3RpdmUgYXQgXHJcbiAgICAvLyBJbnRlcnByZXRlclN0YXRlIGlcclxuICAgIGJ1dHRvbkFjdGl2ZU1hdHJpeDogeyBbYnV0dG9uTmFtZTogc3RyaW5nXTogYm9vbGVhbltdIH0gPSB7XHJcbiAgICAgICAgXCJzdGFydFwiOiBbZmFsc2UsIGZhbHNlLCB0cnVlLCB0cnVlLCB0cnVlLCBmYWxzZV0sXHJcbiAgICAgICAgXCJwYXVzZVwiOiBbZmFsc2UsIHRydWUsIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlXSxcclxuICAgICAgICBcInN0b3BcIjogW2ZhbHNlLCB0cnVlLCB0cnVlLCBmYWxzZSwgZmFsc2UsIHRydWVdLFxyXG4gICAgICAgIFwic3RlcE92ZXJcIjogW2ZhbHNlLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgZmFsc2VdLFxyXG4gICAgICAgIFwic3RlcEludG9cIjogW2ZhbHNlLCBmYWxzZSwgdHJ1ZSwgdHJ1ZSwgdHJ1ZSwgZmFsc2VdLFxyXG4gICAgICAgIFwic3RlcE91dFwiOiBbZmFsc2UsIGZhbHNlLCB0cnVlLCBmYWxzZSwgZmFsc2UsIGZhbHNlXSxcclxuICAgICAgICBcInJlc3RhcnRcIjogW2ZhbHNlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlLCB0cnVlXVxyXG4gICAgfVxyXG5cclxuICAgIGNhbGxiYWNrQWZ0ZXJFeGVjdXRpb246ICgpID0+IHZvaWQ7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHVibGljIG1haW46IE1haW5CYXNlLCBwdWJsaWMgZGVidWdnZXJfOiBEZWJ1Z2dlciwgcHVibGljIGNvbnRyb2xCdXR0b25zOiBQcm9ncmFtQ29udHJvbEJ1dHRvbnMsXHJcbiAgICAgICAgJHJ1bkRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIHRoaXMucHJpbnRNYW5hZ2VyID0gbmV3IFByaW50TWFuYWdlcigkcnVuRGl2LCB0aGlzLm1haW4pO1xyXG4gICAgICAgIHRoaXMuaW5wdXRNYW5hZ2VyID0gbmV3IElucHV0TWFuYWdlcigkcnVuRGl2LCB0aGlzLm1haW4pO1xyXG4gICAgICAgIGlmIChtYWluLmlzRW1iZWRkZWQoKSkge1xyXG4gICAgICAgICAgICB0aGlzLmtleWJvYXJkVG9vbCA9IG5ldyBLZXlib2FyZFRvb2woalF1ZXJ5KCdodG1sJyksIG1haW4pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMua2V5Ym9hcmRUb29sID0gbmV3IEtleWJvYXJkVG9vbChqUXVlcnkod2luZG93KSwgbWFpbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmRlYnVnZ2VyID0gZGVidWdnZXJfO1xyXG5cclxuICAgICAgICBjb250cm9sQnV0dG9ucy5zZXRJbnRlcnByZXRlcih0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy50aW1lV2hlblByb2dyYW1TdGFydGVkID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdGhpcy5zdGVwcyA9IDA7XHJcbiAgICAgICAgdGhpcy50aW1lTmV0dG8gPSAwO1xyXG4gICAgICAgIHRoaXMudGltZXJFdmVudHMgPSAwO1xyXG5cclxuICAgICAgICB0aGlzLnRpbWVyRGVsYXlNcyA9IDc7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IHBlcmlvZGljRnVuY3Rpb24gPSAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoYXQudGltZXJFeHRlcm4pIHtcclxuICAgICAgICAgICAgICAgIHRoYXQudGltZXJGdW5jdGlvbih0aGF0LnRpbWVyRGVsYXlNcywgZmFsc2UsIDAuNyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnRpbWVySWQgPSBzZXRJbnRlcnZhbChwZXJpb2RpY0Z1bmN0aW9uLCB0aGlzLnRpbWVyRGVsYXlNcyk7XHJcbiAgICAgICAgbGV0IGtlZXBBbGl2ZVJlcXVlc3Q6IFdlYlNvY2tldFJlcXVlc3RLZWVwQWxpdmUgPSB7IGNvbW1hbmQ6IDUgfTtcclxuICAgICAgICBsZXQgcmVxID0gSlNPTi5zdHJpbmdpZnkoa2VlcEFsaXZlUmVxdWVzdCk7XHJcbiAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LndlYlNvY2tldHNUb0Nsb3NlQWZ0ZXJQcm9ncmFtSGFsdC5mb3JFYWNoKHdzID0+IHdzLnNlbmQocmVxKSk7XHJcbiAgICAgICAgfSwgMzAwMDApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0R1VJKCkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBhbSA9IHRoaXMubWFpbi5nZXRBY3Rpb25NYW5hZ2VyKCk7XHJcblxyXG4gICAgICAgIGxldCBzdGFydEZ1bmN0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gMTAwMDAwMDtcclxuICAgICAgICAgICAgdGhhdC5zdGFydCgpO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBwYXVzZUZ1bmN0aW9uID0gKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnBhdXNlKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYW0ucmVnaXN0ZXJBY3Rpb24oXCJpbnRlcnByZXRlci5zdGFydFwiLCBbJ0Y0J10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChhbS5pc0FjdGl2ZShcImludGVycHJldGVyLnN0YXJ0XCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhcnRGdW5jdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBwYXVzZUZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9LCBcIlByb2dyYW1tIHN0YXJ0ZW5cIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RhcnQpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnBhdXNlXCIsIFsnRjQnXSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFtLmlzQWN0aXZlKFwiaW50ZXJwcmV0ZXIuc3RhcnRcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFydEZ1bmN0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhdXNlRnVuY3Rpb24oKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0sIFwiUGF1c2VcIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uUGF1c2UpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnN0b3BcIiwgW10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc3RvcChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LnN0ZXBzID0gMDtcclxuICAgICAgICAgICAgfSwgXCJQcm9ncmFtbSBhbmhhbHRlblwiLCB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25TdG9wKTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uRWRpdC5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgIC8vICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIC8vICAgICBhbS50cmlnZ2VyKCdpbnRlcnByZXRlci5zdG9wJyk7XHJcbiAgICAgICAgLy8gfSk7XHJcblxyXG4gICAgICAgIGFtLnJlZ2lzdGVyQWN0aW9uKFwiaW50ZXJwcmV0ZXIuc3RlcE92ZXJcIiwgWydGNiddLFxyXG4gICAgICAgICAgICAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm9uZVN0ZXAoZmFsc2UpO1xyXG4gICAgICAgICAgICB9LCBcIkVpbnplbHNjaHJpdHQgKFN0ZXAgb3ZlcilcIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RlcE92ZXIpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnN0ZXBJbnRvXCIsIFsnRjcnXSxcclxuICAgICAgICAgICAgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vbmVTdGVwKHRydWUpO1xyXG4gICAgICAgICAgICB9LCBcIkVpbnplbHNjaHJpdHQgKFN0ZXAgaW50bylcIiwgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uU3RlcEludG8pO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnN0ZXBPdXRcIiwgW10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RlcE91dCgpO1xyXG4gICAgICAgICAgICB9LCBcIlN0ZXAgb3V0XCIsIHRoaXMuY29udHJvbEJ1dHRvbnMuJGJ1dHRvblN0ZXBPdXQpO1xyXG5cclxuICAgICAgICBhbS5yZWdpc3RlckFjdGlvbihcImludGVycHJldGVyLnJlc3RhcnRcIiwgW10sXHJcbiAgICAgICAgICAgICgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc3RvcCh0cnVlKTtcclxuICAgICAgICAgICAgfSwgXCJOZXUgc3RhcnRlblwiLCB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25SZXN0YXJ0KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldFN0YXJ0YWJsZU1vZHVsZShtb2R1bGVTdG9yZTogTW9kdWxlU3RvcmUpOiBNb2R1bGUge1xyXG5cclxuICAgICAgICBsZXQgY2VtOiBNb2R1bGU7XHJcbiAgICAgICAgY2VtID0gdGhpcy5tYWluLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpO1xyXG5cclxuICAgICAgICBsZXQgY3VycmVudGx5RWRpdGVkTW9kdWxlSXNDbGFzc09ubHkgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gZGVjaWRlIHdoaWNoIG1vZHVsZSB0byBzdGFydFxyXG5cclxuICAgICAgICAvLyBmaXJzdCBhdHRlbXB0OiBpcyBjdXJyZW50bHkgZWRpdGVkIE1vZHVsZSBzdGFydGFibGU/XHJcbiAgICAgICAgaWYgKGNlbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50bHlFZGl0ZWRNb2R1bGUgPSBtb2R1bGVTdG9yZS5maW5kTW9kdWxlQnlGaWxlKGNlbS5maWxlKTtcclxuICAgICAgICAgICAgaWYgKGN1cnJlbnRseUVkaXRlZE1vZHVsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBjdXJyZW50bHlFZGl0ZWRNb2R1bGVJc0NsYXNzT25seSA9ICFjZW0uaGFzRXJyb3JzKClcclxuICAgICAgICAgICAgICAgICAgICAmJiAhY3VycmVudGx5RWRpdGVkTW9kdWxlLmlzU3RhcnRhYmxlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRseUVkaXRlZE1vZHVsZS5pc1N0YXJ0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJyZW50bHlFZGl0ZWRNb2R1bGU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHNlY29uZCBhdHRlbXB0OiB3aGljaCBtb2R1bGUgaGFzIGJlZW4gc3RhcnRlZCBsYXN0IHRpbWU/XHJcbiAgICAgICAgaWYgKHRoaXMubWFpbk1vZHVsZSAhPSBudWxsICYmIGN1cnJlbnRseUVkaXRlZE1vZHVsZUlzQ2xhc3NPbmx5KSB7XHJcbiAgICAgICAgICAgIGxldCBsYXN0TWFpbk1vZHVsZSA9IG1vZHVsZVN0b3JlLmZpbmRNb2R1bGVCeUZpbGUodGhpcy5tYWluTW9kdWxlLmZpbGUpO1xyXG4gICAgICAgICAgICBpZiAobGFzdE1haW5Nb2R1bGUgIT0gbnVsbCAmJiBsYXN0TWFpbk1vZHVsZS5pc1N0YXJ0YWJsZSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RNYWluTW9kdWxlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB0aGlyZCBhdHRlbXB0OiBwaWNrIGZpcnN0IHN0YXJ0YWJsZSBtb2R1bGUgb2YgY3VycmVudCB3b3Jrc3BhY2VcclxuICAgICAgICBpZiAoY3VycmVudGx5RWRpdGVkTW9kdWxlSXNDbGFzc09ubHkpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgbSBvZiBtb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0uaXNTdGFydGFibGUpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICAgICBBZnRlciB1c2VyIGNsaWNrcyBzdGFydCBidXR0b24gKG9yIHN0ZXBvdmVyL3N0ZXBJbnRvLUJ1dHRvbiB3aGVuIG5vIHByb2dyYW0gaXMgcnVubmluZykgdGhpc1xyXG4gICAgICAgIG1ldGhvZCBpc3QgY2FsbGVkLlxyXG4gICAgKi9cclxuICAgIGluaXQoKSB7XHJcblxyXG4gICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgbGV0IGNlbSA9IHRoaXMubWFpbi5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKTtcclxuXHJcbiAgICAgICAgY2VtLmdldEJyZWFrcG9pbnRQb3NpdGlvbnNGcm9tRWRpdG9yKCk7XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZT8uY2xlYXJFeGNlcHRpb25zKCk7XHJcblxyXG4gICAgICAgIC8qXHJcbiAgICAgICAgICAgIEFzIGxvbmcgYXMgdGhlcmUgaXMgbm8gc3RhcnRhYmxlIG5ldyBWZXJzaW9uIG9mIGN1cnJlbnQgd29ya3NwYWNlIHdlIGtlZXAgY3VycmVudCBjb21waWxlZCBtb2R1bGVzIHNvXHJcbiAgICAgICAgICAgIHRoYXQgdmFyaWFibGVzIGFuZCBvYmplY3RzIGRlZmluZWQvaW5zdGFudGlhdGVkIHZpYSBjb25zb2xlIGNhbiBiZSBrZXB0LCB0b28uIFxyXG4gICAgICAgICovXHJcbiAgICAgICAgaWYgKHRoaXMubW9kdWxlU3RvcmVWZXJzaW9uICE9IHRoaXMubWFpbi52ZXJzaW9uICYmIHRoaXMubWFpbi5nZXRDb21waWxlcigpLmF0TGVhc3RPbmVNb2R1bGVJc1N0YXJ0YWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uY29weUV4ZWN1dGFibGVNb2R1bGVTdG9yZVRvSW50ZXJwcmV0ZXIoKTtcclxuICAgICAgICAgICAgdGhpcy5oZWFwID0ge307IC8vIGNsZWFyIHZhcmlhYmxlcy9vYmplY3RzIGRlZmluZWQgdmlhIGNvbnNvbGVcclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlPy5kZXRhY2hWYWx1ZXMoKTsgIC8vIGRldGFjaCB2YWx1ZXMgZnJvbSBjb25zb2xlIGVudHJpZXNcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdNYWluTW9kdWxlID0gdGhpcy5nZXRTdGFydGFibGVNb2R1bGUodGhpcy5tb2R1bGVTdG9yZSk7XHJcblxyXG4gICAgICAgIGlmIChuZXdNYWluTW9kdWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubWFpbk1vZHVsZSA9IG5ld01haW5Nb2R1bGU7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrID0gW107XHJcbiAgICAgICAgdGhpcy5zdGFjayA9IFtdO1xyXG4gICAgICAgIHRoaXMuc3RhY2tmcmFtZXMgPSBbXTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gMDtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLmRvbmUpO1xyXG5cclxuICAgICAgICB0aGlzLmlzRmlyc3RTdGF0ZW1lbnQgPSB0cnVlO1xyXG5cclxuICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gMTAwMDAwMDtcclxuXHJcblxyXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIGVudW0gdmFsdWUtb2JqZWN0czsgaW5pdGlhbGl6ZSBzdGF0aWMgYXR0cmlidXRlczsgY2FsbCBzdGF0aWMgY29uc3RydWN0b3JzXHJcblxyXG4gICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICBwcm9ncmFtOiB0aGlzLm1haW5Nb2R1bGUubWFpblByb2dyYW0sXHJcbiAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAwIH0sXHJcbiAgICAgICAgICAgIG1ldGhvZDogXCJIYXVwdHByb2dyYW1tXCIsXHJcbiAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IG51bGwsXHJcbiAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiSGF1cHRwcm9ncmFtbVwiXHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgdGhpcy5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxpemVFbnVtcyhtKTtcclxuICAgICAgICAgICAgdGhpcy5pbml0aWFsaXplQ2xhc3NlcyhtKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucG9wUHJvZ3JhbSgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwb3BQcm9ncmFtKCkge1xyXG4gICAgICAgIGxldCBwID0gdGhpcy5wcm9ncmFtU3RhY2sucG9wKCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IHAucHJvZ3JhbTtcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBwLnByb2dyYW1Qb3NpdGlvbjtcclxuICAgICAgICB0aGlzLmN1cnJlbnRNZXRob2QgPSBwLm1ldGhvZDtcclxuICAgICAgICB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gcC5jYWxsYmFja0FmdGVyUmV0dXJuO1xyXG4gICAgICAgIHRoaXMuY3VycmVudElzQ2FsbGVkRnJvbU91dHNpZGUgPSBwLmlzQ2FsbGVkRnJvbU91dHNpZGU7XHJcbiAgICAgICAgaWYgKHAuc3RhY2tFbGVtZW50c1RvUHVzaEJlZm9yZUZpcnN0RXhlY3V0aW5nICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc3RhY2tmcmFtZXMucHVzaCh0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID09IG51bGwgPyAwIDogdGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSB0aGlzLnN0YWNrLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IHNlIG9mIHAuc3RhY2tFbGVtZW50c1RvUHVzaEJlZm9yZUZpcnN0RXhlY3V0aW5nKSB0aGlzLnN0YWNrLnB1c2goc2UpO1xyXG4gICAgICAgICAgICBwLnN0YWNrRWxlbWVudHNUb1B1c2hCZWZvcmVGaXJzdEV4ZWN1dGluZyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGluaXRpYWxpemVDbGFzc2VzKG06IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBmb3IgKGxldCBrbGFzcyBvZiBtLnR5cGVTdG9yZS50eXBlTGlzdCkge1xyXG4gICAgICAgICAgICBpZiAoa2xhc3MgaW5zdGFuY2VvZiBLbGFzcykge1xyXG4gICAgICAgICAgICAgICAga2xhc3Muc3RhdGljQ2xhc3MuY2xhc3NPYmplY3QgPSBuZXcgUnVudGltZU9iamVjdChrbGFzcy5zdGF0aWNDbGFzcyk7XHJcbiAgICAgICAgICAgICAgICBrbGFzcy5wdXNoU3RhdGljSW5pdGlhbGl6YXRpb25Qcm9ncmFtcyh0aGlzLnByb2dyYW1TdGFjayk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChrbGFzcyBpbnN0YW5jZW9mIEVudW0pIHtcclxuICAgICAgICAgICAgICAgIC8vIGxldCBzdGF0aWNWYWx1ZU1hcCA9IGtsYXNzLnN0YXRpY0NsYXNzLmNsYXNzT2JqZWN0LmF0dHJpYnV0ZVZhbHVlcy5nZXQoa2xhc3MuaWRlbnRpZmllcik7XHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhdGljVmFsdWVMaXN0ID0ga2xhc3Muc3RhdGljQ2xhc3MuY2xhc3NPYmplY3QuYXR0cmlidXRlcztcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGVudW1JbmZvIG9mIGtsYXNzLmVudW1JbmZvTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0YXRpY1ZhbHVlTWFwLmdldChlbnVtSW5mby5pZGVudGlmaWVyKS52YWx1ZSA9IGVudW1JbmZvLm9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICBzdGF0aWNWYWx1ZUxpc3RbZW51bUluZm8ub3JkaW5hbF0udmFsdWUgPSBlbnVtSW5mby5vYmplY3Q7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIGluaXRpYWxpemVFbnVtcyhtOiBNb2R1bGUpIHtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZW51bUNsYXNzIG9mIG0udHlwZVN0b3JlLnR5cGVMaXN0KSB7XHJcbiAgICAgICAgICAgIGlmIChlbnVtQ2xhc3MgaW5zdGFuY2VvZiBFbnVtKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZW51bUNsYXNzLnB1c2hTdGF0aWNJbml0aWFsaXphdGlvblByb2dyYW1zKHRoaXMucHJvZ3JhbVN0YWNrKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWVMaXN0OiBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlSW5pdGlhbGl6YXRpb25Qcm9ncmFtOiBQcm9ncmFtID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZTogZW51bUNsYXNzLm1vZHVsZSxcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RhdGVtZW50czogW11cclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGhhc0F0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSA9IGVudW1DbGFzcy5hdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGggPiAwO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChoYXNBdHRyaWJ1dGVJbml0aWFsaXphdGlvblByb2dyYW0pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2dyYW1TdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogdmFsdWVJbml0aWFsaXphdGlvblByb2dyYW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAwIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGhvZDogXCJBdHRyaWJ1dC1Jbml0aWFsaXNpZXJ1bmcgZGVyIEtsYXNzZSBcIiArIGVudW1DbGFzcy5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFja0FmdGVyUmV0dXJuOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiBcIkluaXRpYWxpc2llcnVuZyBlaW5lcyBFbnVtc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBlbnVtSW5mbyBvZiBlbnVtQ2xhc3MuZW51bUluZm9MaXN0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW51bUluZm8ub2JqZWN0ID0gbmV3IEVudW1SdW50aW1lT2JqZWN0KGVudW1DbGFzcywgZW51bUluZm8pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZUxpc3QucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGVudW1DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGVudW1JbmZvLm9iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZW51bUluZm8uY29uc3RydWN0b3JDYWxsUHJvZ3JhbSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogZW51bUluZm8uY29uc3RydWN0b3JDYWxsUHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogMCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiBcIktvbnN0cnVrdG9yIHZvbiBcIiArIGVudW1DbGFzcy5pZGVudGlmaWVyLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiSW5pdGlhbGlzaWVydW5nIGVpbmVzIEVudW1zXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhhc0F0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUluaXRpYWxpemF0aW9uUHJvZ3JhbS5zdGF0ZW1lbnRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmluaXRpYWxpemVFbnVtVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogZW51bUluZm8ucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbnVtQ2xhc3M6IGVudW1DbGFzcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlSWRlbnRpZmllcjogZW51bUluZm8uaWRlbnRpZmllclxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGhhc0F0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlSW5pdGlhbGl6YXRpb25Qcm9ncmFtLnN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5wcm9ncmFtRW5kLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogeyBsaW5lOiAwLCBjb2x1bW46IDAsIGxlbmd0aDogMSB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbnVtQ2xhc3MudmFsdWVMaXN0ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG5ldyBBcnJheVR5cGUoZW51bUNsYXNzKSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWVMaXN0XHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB0aW1lckV2ZW50czogbnVtYmVyID0gMDtcclxuICAgIHN0YXJ0KGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xyXG5cclxuICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LmNsZWFyRXJyb3JzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsbGJhY2tBZnRlckV4ZWN1dGlvbiA9IGNhbGxiYWNrO1xyXG5cclxuICAgICAgICB0aGlzLmlzRmlyc3RTdGF0ZW1lbnQgPSB0cnVlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmVycm9yIHx8IHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnJlc2V0UnVudGltZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcpO1xyXG5cclxuICAgICAgICB0aGlzLmhpZGVQcm9ncmFtcG9pbnRlclBvc2l0aW9uKCk7XHJcblxyXG4gICAgICAgIHRoaXMudGltZVdoZW5Qcm9ncmFtU3RhcnRlZCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBsYXN0U3RlcFRpbWU6IG51bWJlciA9IDA7XHJcbiAgICBsYXN0VGltZUJldHdlZW5FdmVudHM6IG51bWJlciA9IDA7XHJcblxyXG4gICAgdGltZXJGdW5jdGlvbih0aW1lckRlbGF5TXM6IG51bWJlciwgZm9yY2VSdW46IGJvb2xlYW4sIG1heFdvcmtsb2FkRmFjdG9yOiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgbGV0IHQwID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcblxyXG4gICAgICAgIGlmICghZm9yY2VSdW4pIHtcclxuICAgICAgICAgICAgbGV0IHRpbWVCZXR3ZWVuU3RlcHMgPSAxMDAwIC8gdGhpcy5zdGVwc1BlclNlY29uZDtcclxuICAgICAgICAgICAgaWYgKHRoaXMudGltZXJTdG9wcGVkIHx8IHQwIC0gdGhpcy5sYXN0U3RlcFRpbWUgPCB0aW1lQmV0d2VlblN0ZXBzKSByZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMubGFzdFN0ZXBUaW1lID0gdDA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxhc3RUaW1lQmV0d2VlbkV2ZW50cyA9IHQwIC0gdGhpcy5sYXN0U3RlcFRpbWU7XHJcblxyXG4gICAgICAgIGxldCBuX3N0ZXBzUGVyVGltZXJHb2FsID0gZm9yY2VSdW4gPyBOdW1iZXIuTUFYX1NBRkVfSU5URUdFUiA6IHRoaXMuc3RlcHNQZXJTZWNvbmQgKiB0aGlzLnRpbWVyRGVsYXlNcyAvIDEwMDA7XHJcblxyXG4gICAgICAgIHRoaXMudGltZXJFdmVudHMrKztcclxuXHJcbiAgICAgICAgbGV0IGV4Y2VwdGlvbjogc3RyaW5nO1xyXG4gICAgICAgIGxldCBpID0gMDtcclxuXHJcbiAgICAgICAgd2hpbGUgKGkgPCBuX3N0ZXBzUGVyVGltZXJHb2FsICYmICF0aGlzLnRpbWVyU3RvcHBlZCAmJiBleGNlcHRpb24gPT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAocGVyZm9ybWFuY2Uubm93KCkgLSB0MCkgLyB0aW1lckRlbGF5TXMgPCBtYXhXb3JrbG9hZEZhY3RvclxyXG4gICAgICAgICkge1xyXG4gICAgICAgICAgICBleGNlcHRpb24gPSB0aGlzLm5leHRTdGVwKCk7XHJcbiAgICAgICAgICAgIGlmIChleGNlcHRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0ZXBzUGVyU2Vjb25kIDw9IHRoaXMuc2hvd1Byb2dyYW1wb2ludGVyVXB0b1N0ZXBzUGVyU2Vjb25kICYmICFmb3JjZVJ1bikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5lcnJvciB8fFxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLmRvbmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsIDwgMCAmJiAhdGhpcy50aW1lclN0b3BwZWQpIHtcclxuICAgICAgICAgICAgICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9zaXRpb24gPSBub2RlLnBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwgfHwgcG9zaXRpb24ubGluZSAhPSB0aGlzLmxlYXZlTGluZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUucGF1c2VkKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuY29tZXNTdGF0ZW1lbnQoVG9rZW5UeXBlLmNsb3NlU3RhY2tmcmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZXhjZXB0aW9uID0gdGhpcy5uZXh0U3RlcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXhjZXB0aW9uID09IG51bGwgJiYgdGhpcy5jb21lc1N0YXRlbWVudChUb2tlblR5cGUucHJvZ3JhbUVuZCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4Y2VwdGlvbiA9IHRoaXMubmV4dFN0ZXAoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGkrKztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChleGNlcHRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLnRocm93RXhjZXB0aW9uKGV4Y2VwdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy50aW1lclN0b3BwZWQpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd1Byb2dyYW1Qb2ludGVyQW5kVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHRoaXMuY2FsbGJhY2tBZnRlckV4ZWN1dGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrQWZ0ZXJFeGVjdXRpb24oKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2FsbGJhY2tBZnRlckV4ZWN1dGlvbiA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBkdCA9IHBlcmZvcm1hbmNlLm5vdygpIC0gdDA7XHJcbiAgICAgICAgdGhpcy50aW1lTmV0dG8gKz0gZHQ7XHJcblxyXG4gICAgICAgIC8vIGlmIChcclxuICAgICAgICAvLyAgICAgdGhpcy50aW1lckV2ZW50cyAlIDMwMCA9PSAwKSB7XHJcbiAgICAgICAgLy8gICAgIGNvbnNvbGUubG9nKFwiTGFzdCB0aW1lIGJldHdlZW4gRXZlbnRzOiBcIiArIHRoaXMubGFzdFRpbWVCZXR3ZWVuRXZlbnRzKTtcclxuICAgICAgICAvLyB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICB0aHJvd0V4Y2VwdGlvbihleGNlcHRpb246IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMudGltZXJTdG9wcGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUuZXJyb3IpO1xyXG5cclxuICAgICAgICBsZXQgJGVycm9yRGl2ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fZXhjZXB0aW9uXCI+PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgIGxldCBjb25zb2xlUHJlc2VudDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMubWFpbi5pc0VtYmVkZGVkKCkpIHtcclxuICAgICAgICAgICAgbGV0IG1haW5FbWJlZGRlZDogTWFpbkVtYmVkZGVkID0gPE1haW5FbWJlZGRlZD50aGlzLm1haW47XHJcbiAgICAgICAgICAgIGxldCBjb25maWcgPSBtYWluRW1iZWRkZWQuY29uZmlnO1xyXG4gICAgICAgICAgICBpZiAoY29uZmlnLndpdGhCb3R0b21QYW5lbCAhPSB0cnVlICYmIGNvbmZpZy53aXRoQ29uc29sZSAhPSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlUHJlc2VudCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHBvc2l0aW9uU3RyaW5nID0gXCJcIjtcclxuICAgICAgICAgICAgICAgIGxldCBjdXJyZW50U3RhdGVtZW50ID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudFN0YXRlbWVudCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRleHRQb3NpdGlvbiA9IGN1cnJlbnRTdGF0ZW1lbnQ/LnBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uU3RyaW5nID0gXCIgaW4gWmVpbGUgXCIgKyB0ZXh0UG9zaXRpb24ubGluZSArIFwiLCBTcGFsdGUgXCIgKyB0ZXh0UG9zaXRpb24uY29sdW1uO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LnNob3dFcnJvcih0aGlzLmN1cnJlbnRQcm9ncmFtLm1vZHVsZSwgdGV4dFBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhbGVydChcIkZlaGxlclwiICsgcG9zaXRpb25TdHJpbmcgKyBcIjogXCIgKyBleGNlcHRpb24pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGNvbnNvbGVQcmVzZW50KSB7XHJcbiAgICAgICAgICAgICRlcnJvckRpdi5hcHBlbmQoalF1ZXJ5KFwiPHNwYW4gY2xhc3M9J2pvX2Vycm9yLWNhcHRpb24nPkZlaGxlcjo8L3NwYW4+Jm5ic3A7XCIgKyBleGNlcHRpb24gKyBcIjxicj5cIikpO1xyXG4gICAgICAgICAgICB0aGlzLnB1c2hDdXJyZW50UHJvZ3JhbSgpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGZpcnN0ID0gdHJ1ZTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IHRoaXMucHJvZ3JhbVN0YWNrLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHAgPSB0aGlzLnByb2dyYW1TdGFja1tpXTtcclxuICAgICAgICAgICAgICAgIGxldCBtID0gKHAubWV0aG9kIGluc3RhbmNlb2YgTWV0aG9kKSA/IHAubWV0aG9kLmlkZW50aWZpZXIgOiBwLm1ldGhvZDtcclxuICAgICAgICAgICAgICAgIGxldCBzOiBzdHJpbmcgPSBcIjxzcGFuIGNsYXNzPSdqb19lcnJvci1jYXB0aW9uJz5cIiArIChmaXJzdCA/IFwiT3J0XCIgOiBcImF1ZmdlcnVmZW4gdm9uXCIpICsgXCI6IDwvc3Bhbj5cIiArIG07XHJcbiAgICAgICAgICAgICAgICBpZiAocC50ZXh0UG9zaXRpb24gIT0gbnVsbCkgcyArPSBcIiA8c3BhbiBjbGFzcz0nam9fcnVudGltZUVycm9yUG9zaXRpb24nPihaIFwiICsgcC50ZXh0UG9zaXRpb24ubGluZSArIFwiLCBTIFwiICsgcC50ZXh0UG9zaXRpb24uY29sdW1uICsgXCIpPC9zcGFuPlwiO1xyXG4gICAgICAgICAgICAgICAgcyArPSBcIjxicj5cIjtcclxuICAgICAgICAgICAgICAgIGxldCBlcnJvckxpbmUgPSBqUXVlcnkocyk7XHJcbiAgICAgICAgICAgICAgICBpZiAocC50ZXh0UG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZXJyb3JMaW5lWzJdKS5vbignbW91c2Vkb3duJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LnNob3dFcnJvcihwLnByb2dyYW0ubW9kdWxlLCBwLnRleHRQb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAkZXJyb3JEaXYuYXBwZW5kKGVycm9yTGluZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgIGlmIChwLmlzQ2FsbGVkRnJvbU91dHNpZGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsZXQgY29uc29sZSA9IHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb25zb2xlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUud3JpdGVDb25zb2xlRW50cnkoJGVycm9yRGl2LCBudWxsLCAncmdiYSgyNTUsIDAsIDAsIDAuNCcpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5zaG93VGFiKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBoaWRlUHJvZ3JhbXBvaW50ZXJQb3NpdGlvbigpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5ydW5uaW5nKSB7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5zdGVwc1BlclNlY29uZCA+IHRoaXMuc2hvd1Byb2dyYW1wb2ludGVyVXB0b1N0ZXBzUGVyU2Vjb25kKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4uaGlkZVByb2dyYW1Qb2ludGVyUG9zaXRpb24oKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNvbWVzU3RhdGVtZW50KHN0YXRlbWVudDogVG9rZW5UeXBlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW0gPT0gbnVsbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPiB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoIC0gMSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRQcm9ncmFtLnN0YXRlbWVudHNbdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uXS50eXBlID09IHN0YXRlbWVudDtcclxuICAgIH1cclxuXHJcbiAgICByZXNldFJ1bnRpbWUoKSB7XHJcbiAgICAgICAgdGhpcy5wcmludE1hbmFnZXIuY2xlYXIoKTtcclxuICAgICAgICB0aGlzLndvcmxkSGVscGVyPy5kZXN0cm95V29ybGQoKTtcclxuICAgICAgICB0aGlzLnByb2Nlc3NpbmdIZWxwZXI/LmRlc3Ryb3lXb3JsZCgpO1xyXG4gICAgICAgIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyPy5kZXRhY2hFdmVudHMoKTtcclxuICAgICAgICB0aGlzLmduZ0VyZWlnbmlzYmVoYW5kbHVuZ0hlbHBlciA9IG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgc3RvcChyZXN0YXJ0OiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgICAgICB0aGlzLmlucHV0TWFuYWdlci5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy5wYXVzZSgpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy53b3JsZEhlbHBlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuc3ByaXRlQW5pbWF0aW9ucyA9IFtdO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmduZ0VyZWlnbmlzYmVoYW5kbHVuZ0hlbHBlcj8uZGV0YWNoRXZlbnRzKCk7XHJcbiAgICAgICAgdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIgPSBudWxsO1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLmRvbmUpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW4uaGlkZVByb2dyYW1Qb2ludGVyUG9zaXRpb24oKTtcclxuICAgICAgICAgICAgaWYgKHJlc3RhcnQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sIDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgcGF1c2UoKSB7XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnBhdXNlZCk7XHJcbiAgICAgICAgdGhpcy50aW1lclN0b3BwZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIGxhc3RQcmludGVkTW9kdWxlOiBNb2R1bGUgPSBudWxsO1xyXG4gICAgc2hvd1Byb2dyYW1Qb2ludGVyQW5kVmFyaWFibGVzKCkge1xyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQcm9ncmFtID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBsZXQgbm9kZSA9IHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50c1t0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb25dO1xyXG4gICAgICAgIGlmIChub2RlID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBsZXQgcG9zaXRpb24gPSBub2RlLnBvc2l0aW9uO1xyXG4gICAgICAgIGlmIChwb3NpdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi5zaG93UHJvZ3JhbVBvaW50ZXJQb3NpdGlvbih0aGlzLmN1cnJlbnRQcm9ncmFtLm1vZHVsZS5maWxlLCBwb3NpdGlvbik7XHJcbiAgICAgICAgICAgIHRoaXMuZGVidWdnZXIuc2hvd0RhdGEodGhpcy5jdXJyZW50UHJvZ3JhbSwgcG9zaXRpb24sIHRoaXMuc3RhY2ssIHRoaXMuY3VycmVudFN0YWNrZnJhbWUsIHRoaXMuaGVhcCk7XHJcbiAgICAgICAgICAgIGxldCBib3R0b21EaXYgPSB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk7XHJcbiAgICAgICAgICAgIGlmIChib3R0b21EaXYucHJvZ3JhbVByaW50ZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFByb2dyYW0ubW9kdWxlICE9IHRoaXMubGFzdFByaW50ZWRNb2R1bGUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCkucHJpbnRNb2R1bGVUb0JvdHRvbURpdihudWxsLCB0aGlzLmN1cnJlbnRQcm9ncmFtLm1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0UHJpbnRlZE1vZHVsZSA9IHRoaXMuY3VycmVudFByb2dyYW0ubW9kdWxlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpLnByb2dyYW1QcmludGVyLnNob3dOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHN0ZXBPdXQoKSB7XHJcbiAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCA9IDA7XHJcbiAgICAgICAgdGhpcy5zdGFydCgpO1xyXG4gICAgfVxyXG5cclxuICAgIG9uZVN0ZXAoc3RlcEludG86IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LmNsZWFyRXJyb3JzKCk7XHJcbiAgICAgICAgdGhpcy5pc0ZpcnN0U3RhdGVtZW50ID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5zdGF0ZSAhPSBJbnRlcnByZXRlclN0YXRlLnBhdXNlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5ub3RfaW5pdGlhbGl6ZWQpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLnJlc2V0UnVudGltZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUucGF1c2VkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gMTAwMDA7XHJcbiAgICAgICAgICAgIGxldCBvbGRTdGVwT3Zlck5lc3RpbmdMZXZlbCA9IHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWw7XHJcbiAgICAgICAgICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcbiAgICAgICAgICAgIGxldCBwb3NpdGlvbiA9IG5vZGUucG9zaXRpb247XHJcbiAgICAgICAgICAgIGxldCBleGNlcHRpb24gPSB0aGlzLm5leHRTdGVwKCk7XHJcbiAgICAgICAgICAgIGlmIChleGNlcHRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy50aHJvd0V4Y2VwdGlvbihleGNlcHRpb24pO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXN0ZXBJbnRvICYmIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwgPiBvbGRTdGVwT3Zlck5lc3RpbmdMZXZlbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCA9IDA7XHJcbiAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGVhdmVMaW5lID0gcG9zaXRpb24ubGluZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZWF2ZUxpbmUgPSAtMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnQoKTtcclxuICAgICAgICAgICAgfSBlbHNlXHJcbiAgICAgICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlID09IEludGVycHJldGVyU3RhdGUuZG9uZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLnN0YXRlICE9IEludGVycHJldGVyU3RhdGUud2FpdGluZ0ZvcklucHV0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBuZXh0U3RlcCgpOiBzdHJpbmcge1xyXG5cclxuICAgICAgICBsZXQgc3RlcEZpbmlzaGVkOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCBub2RlOiBTdGF0ZW1lbnQ7XHJcblxyXG4gICAgICAgIGxldCBleGNlcHRpb246IHN0cmluZztcclxuXHJcbiAgICAgICAgd2hpbGUgKCFzdGVwRmluaXNoZWQgJiYgIXRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgJiYgZXhjZXB0aW9uID09IG51bGwpIHtcclxuXHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID4gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBub2RlID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcblxyXG4gICAgICAgICAgICBpZiAobm9kZS5zdGVwRmluaXNoZWQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkID0gbm9kZS5zdGVwRmluaXNoZWQ7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGV4Y2VwdGlvbiA9IHRoaXMuZXhlY3V0ZU5vZGUobm9kZSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IGZhbHNlO1xyXG5cclxuICAgICAgICB0aGlzLnN0ZXBzKys7XHJcblxyXG4gICAgICAgIHJldHVybiBleGNlcHRpb247XHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZU5vZGUobm9kZTogU3RhdGVtZW50KTogc3RyaW5nIHtcclxuXHJcbiAgICAgICAgaWYgKG5vZGUuYnJlYWtwb2ludCAhPSBudWxsICYmICF0aGlzLmlzRmlyc3RTdGF0ZW1lbnQpIHtcclxuICAgICAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMucGF1c2UoKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5pc0ZpcnN0U3RhdGVtZW50ID0gZmFsc2U7XHJcbiAgICAgICAgbGV0IHN0YWNrVG9wID0gdGhpcy5zdGFjay5sZW5ndGggLSAxO1xyXG4gICAgICAgIGxldCBzdGFja2ZyYW1lQmVnaW4gPSB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lO1xyXG4gICAgICAgIGxldCBzdGFjayA9IHRoaXMuc3RhY2s7XHJcbiAgICAgICAgbGV0IHZhbHVlOiBWYWx1ZTtcclxuXHJcbiAgICAgICAgc3dpdGNoIChub2RlLnR5cGUpIHtcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2FzdFZhbHVlOlxyXG4gICAgICAgICAgICAgICAgbGV0IHJlbFBvcyA9IG5vZGUuc3RhY2tQb3NSZWxhdGl2ZSA9PSBudWxsID8gMCA6IG5vZGUuc3RhY2tQb3NSZWxhdGl2ZTtcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tbc3RhY2tUb3AgKyByZWxQb3NdO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgKyByZWxQb3NdID0gdmFsdWUudHlwZS5jYXN0VG8odmFsdWUsIG5vZGUubmV3VHlwZSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuY2hlY2tDYXN0OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja1tzdGFja1RvcF07XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUudmFsdWUgPT0gbnVsbCkgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBsZXQgcnRvID0gPFJ1bnRpbWVPYmplY3Q+dmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5uZXdUeXBlIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJ0byA9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghcnRvLmNsYXNzLmhhc0FuY2VzdG9yT3JJcyhub2RlLm5ld1R5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFwiRGFzIE9iamVrdCBkZXIgS2xhc3NlIFwiICsgcnRvLmNsYXNzLmlkZW50aWZpZXIgKyBcIiBrYW5uIG5pY2h0IG5hY2ggXCIgKyBub2RlLm5ld1R5cGUuaWRlbnRpZmllciArIFwiIGdlY2FzdGV0IHdlcmRlbi5cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHJ0byA9PSBcIm51bWJlclwiICYmIFtcIkludGVnZXJcIiwgXCJEb3VibGVcIiwgXCJGbG9hdFwiXS5pbmRleE9mKG5vZGUubmV3VHlwZS5pZGVudGlmaWVyKSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXCJFaW5lIFphaGwga2FubiBuaWNodCBuYWNoIFwiICsgbm9kZS5uZXdUeXBlLmlkZW50aWZpZXIgKyBcIiBnZWNhc3RldCB3ZXJkZW4uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBydG8gPT0gXCJzdHJpbmdcIiAmJiBbXCJTdHJpbmdcIiwgXCJDaGFyYWN0ZXJcIl0uaW5kZXhPZihub2RlLm5ld1R5cGUuaWRlbnRpZmllcikgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gKFwiRWluZSBaZWljaGVua2V0dGUga2FubiBuaWNodCBuYWNoIFwiICsgbm9kZS5uZXdUeXBlLmlkZW50aWZpZXIgKyBcIiBnZWNhc3RldCB3ZXJkZW4uXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBydG8gPT0gXCJib29sZWFuXCIgJiYgbm9kZS5uZXdUeXBlLmlkZW50aWZpZXIgIT0gXCJCb29sZWFuXCIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXCJFaW4gYm9vbGVzY2hlciBXZXJ0IGthbm4gbmljaHQgbmFjaCBcIiArIG5vZGUubmV3VHlwZS5pZGVudGlmaWVyICsgXCIgZ2VjYXN0ZXQgd2VyZGVuLlwiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAobm9kZS5uZXdUeXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoPEtsYXNzPnJ0by5jbGFzcykuaW1wbGVtZW50c0ludGVyZmFjZShub2RlLm5ld1R5cGUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAoXCJEYXMgT2JqZWt0IGRlciBLbGFzc2UgXCIgKyBydG8uY2xhc3MuaWRlbnRpZmllciArIFwiIGltcGxlbWVudGllcnQgbmljaHQgZGFzIEludGVyZmFjZSBcIiArIG5vZGUubmV3VHlwZS5pZGVudGlmaWVyICsgXCIuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5sb2NhbFZhcmlhYmxlRGVjbGFyYXRpb246XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFyaWFibGUgPSBub2RlLnZhcmlhYmxlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHR5cGUgPSB2YXJpYWJsZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgUHJpbWl0aXZlVHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLnZhbHVlID0gdHlwZS5pbml0aWFsVmFsdWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGFja1t2YXJpYWJsZS5zdGFja1BvcyArIHN0YWNrZnJhbWVCZWdpbl0gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLnB1c2hPblRvcE9mU3RhY2tGb3JJbml0aWFsaXphdGlvbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hMb2NhbFZhcmlhYmxlVG9TdGFjazpcclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goc3RhY2tbbm9kZS5zdGFja3Bvc09mVmFyaWFibGUgKyBzdGFja2ZyYW1lQmVnaW5dKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wb3BBbmRTdG9yZUludG9WYXJpYWJsZTpcclxuICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2twb3NPZlZhcmlhYmxlICsgc3RhY2tmcmFtZUJlZ2luXSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hBdHRyaWJ1dGU6XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0MSA9IG5vZGUudXNlVGhpc09iamVjdCA/IHN0YWNrW3N0YWNrZnJhbWVCZWdpbl0udmFsdWUgOiBzdGFjay5wb3AoKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGlmIChvYmplY3QxID09IG51bGwpIHJldHVybiBcIlp1Z3JpZmYgYXVmIGVpbiBBdHRyaWJ1dCAoXCIgKyBub2RlLmF0dHJpYnV0ZUlkZW50aWZpZXIgKyBcIikgZGVzIG51bGwtT2JqZWt0c1wiO1xyXG4gICAgICAgICAgICAgICAgbGV0IHZhbHVlMSA9ICg8UnVudGltZU9iamVjdD5vYmplY3QxKS5nZXRWYWx1ZShub2RlLmF0dHJpYnV0ZUluZGV4KTtcclxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZTE/LnVwZGF0ZVZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTEudXBkYXRlVmFsdWUodmFsdWUxKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUxKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wdXNoQXJyYXlMZW5ndGg6XHJcbiAgICAgICAgICAgICAgICBsZXQgYSA9IHN0YWNrLnBvcCgpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGEgPT0gbnVsbCkgcmV0dXJuIFwiWnVncmlmZiBhdWYgZGFzIGxlbmd0aC1BdHRyaWJ1dCBkZXMgbnVsbC1PYmpla3RzXCI7XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHsgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgdmFsdWU6ICg8YW55W10+YSkubGVuZ3RoIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmFzc2lnbm1lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSA9IHZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKCFub2RlLmxlYXZlVmFsdWVPblN0YWNrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucGx1c0Fzc2lnbm1lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSArPSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5taW51c0Fzc2lnbm1lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSAtPSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5tdWx0aXBsaWNhdGlvbkFzc2lnbm1lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSAqPSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5kaXZpc2lvbkFzc2lnbm1lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSAvPSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5tb2R1bG9Bc3NpZ25tZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgJT0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuQU5EQXNzaWdtZW50OlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0udmFsdWUgJj0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuT1JBc3NpZ21lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSB8PSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5YT1JBc3NpZ21lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSBePSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zaGlmdExlZnRBc3NpZ21lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSA8PD0gdmFsdWUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuc2hpZnRSaWdodEFzc2lnbWVudDpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBzdGFja1tzdGFja1RvcCAtIDFdLnZhbHVlID4+PSB2YWx1ZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5zaGlmdFJpZ2h0VW5zaWduZWRBc3NpZ21lbnQ6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3AgLSAxXS52YWx1ZSA+Pj49IHZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmJpbmFyeU9wOlxyXG4gICAgICAgICAgICAgICAgbGV0IHNlY29uZE9wZXJhbmQgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHRWYWx1ZSA9XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5sZWZ0VHlwZS5jb21wdXRlKG5vZGUub3BlcmF0b3IsIHN0YWNrW3N0YWNrVG9wIC0gMV0sIHNlY29uZE9wZXJhbmQpO1xyXG4gICAgICAgICAgICAgICAgbGV0IHJlc3VsdFR5cGUgPSBub2RlLmxlZnRUeXBlLmdldFJlc3VsdFR5cGUobm9kZS5vcGVyYXRvciwgc2Vjb25kT3BlcmFuZC50eXBlKTtcclxuICAgICAgICAgICAgICAgIHN0YWNrW3N0YWNrVG9wIC0gMV0gPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogcmVzdWx0VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcmVzdWx0VmFsdWVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUudW5hcnlPcDpcclxuICAgICAgICAgICAgICAgIGxldCBvbGRWYWx1ZSA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUub3BlcmF0b3IgPT0gVG9rZW5UeXBlLm1pbnVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IG9sZFZhbHVlLnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiAtb2xkVmFsdWUudmFsdWVcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogb2xkVmFsdWUudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICFvbGRWYWx1ZS52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaENvbnN0YW50OlxyXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IG5vZGUudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS5kYXRhVHlwZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaFN0YXRpY0NsYXNzT2JqZWN0OlxyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUua2xhc3MgaW5zdGFuY2VvZiBLbGFzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLmtsYXNzLnN0YXRpY0NsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbm9kZS5rbGFzcy5zdGF0aWNDbGFzcy5jbGFzc09iamVjdFxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGlzIHRvIGVuYWJsZSBpbnN0YW5jZW9mIG9wZXJhdG9yIHdpdGggaW50ZXJmYWNlc1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLmtsYXNzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbm9kZS5rbGFzc1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hTdGF0aWNBdHRyaWJ1dGU6XHJcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG5vZGUua2xhc3MuY2xhc3NPYmplY3QuZ2V0VmFsdWUobm9kZS5hdHRyaWJ1dGVJbmRleCk7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUudXBkYXRlVmFsdWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlLnVwZGF0ZVZhbHVlKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIC8vIGNhc2UgVG9rZW5UeXBlLnB1c2hTdGF0aWNBdHRyaWJ1dGVJbnRyaW5zaWM6XHJcbiAgICAgICAgICAgIC8vICAgICB2YWx1ZSA9IG5vZGUuXHJcbiAgICAgICAgICAgIC8vICAgICBzdGFjay5wdXNoKHsgdHlwZTogbm9kZS5hdHRyaWJ1dGUudHlwZSwgdmFsdWU6IG5vZGUuYXR0cmlidXRlLnVwZGF0ZVZhbHVlKG51bGwpIH0pO1xyXG4gICAgICAgICAgICAvLyAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnNlbGVjdEFycmF5RWxlbWVudDpcclxuICAgICAgICAgICAgICAgIGxldCBpbmRleCA9IHN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFycmF5ID0gc3RhY2sucG9wKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGFycmF5LnZhbHVlID09IG51bGwpIHJldHVybiBcIlp1Z3JpZmYgYXVmIGVpbiBFbGVtZW50IGVpbmVzIG51bGwtRmVsZGVzXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4LnZhbHVlID49IGFycmF5LnZhbHVlLmxlbmd0aCB8fCBpbmRleC52YWx1ZSA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gXCJadWdyaWZmIGF1ZiBkYXMgRWxlbWVudCBtaXQgSW5kZXggXCIgKyBpbmRleC52YWx1ZSArIFwiIGVpbmVzIEZlbGRlcyBkZXIgTMOkbmdlIFwiICsgYXJyYXkudmFsdWUubGVuZ3RoO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgc3RhY2sucHVzaChhcnJheS52YWx1ZVtpbmRleC52YWx1ZV0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jYWxsTWFpbk1ldGhvZDpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucHVzaCh7IHZhbHVlOiBub2RlLnN0YXRpY0NsYXNzLmNsYXNzT2JqZWN0LCB0eXBlOiBub2RlLnN0YXRpY0NsYXNzIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXI6IFZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBbeyB2YWx1ZTogXCJUZXN0XCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogbmV3IEFycmF5VHlwZShzdHJpbmdQcmltaXRpdmVUeXBlKVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXJCZWdpbjIgPSBzdGFja1RvcCArIDI7IC8vIDEgcGFyYW1ldGVyXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFjay5wdXNoKHBhcmFtZXRlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wcm9ncmFtU3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3JhbTogdGhpcy5jdXJyZW50UHJvZ3JhbSxcclxuICAgICAgICAgICAgICAgICAgICBwcm9ncmFtUG9zaXRpb246IHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dFBvc2l0aW9uOiBub2RlLnBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogdGhpcy5jdXJyZW50TWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4sXHJcbiAgICAgICAgICAgICAgICAgICAgaXNDYWxsZWRGcm9tT3V0c2lkZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRTdGFja2ZyYW1lID0gcGFyYW1ldGVyQmVnaW4yO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBub2RlLm1ldGhvZC5wcm9ncmFtO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWV0aG9kID0gbm9kZS5tZXRob2Q7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSAtMTsgLy8gZ2V0cyBpbmNyZWFzZWQgYWZ0ZXIgc3dpdGNoIHN0YXRlbWVudC4uLlxyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZS5tZXRob2QucmVzZXJ2ZVN0YWNrRm9yTG9jYWxWYXJpYWJsZXM7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gobnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCsrO1xyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5tYWtlRWxsaXBzaXNBcnJheTpcclxuICAgICAgICAgICAgICAgIGxldCBlbGxpcHNpc0FycmF5OiBWYWx1ZVtdID0gc3RhY2suc3BsaWNlKHN0YWNrLmxlbmd0aCAtIG5vZGUucGFyYW1ldGVyQ291bnQsIG5vZGUucGFyYW1ldGVyQ291bnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBlbGxpcHNpc0FycmF5LFxyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IG5vZGUuYXJyYXlUeXBlXHJcbiAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jYWxsTWV0aG9kOlxyXG5cclxuICAgICAgICAgICAgICAgIC8vIG5vZGUuc3RhY2tmcmFtZWJlZ2luID0gLShwYXJhbWV0ZXJzLnBhcmFtZXRlclR5cGVzLmxlbmd0aCArIDEpXHJcbiAgICAgICAgICAgICAgICBsZXQgbWV0aG9kID0gbm9kZS5tZXRob2Q7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtZXRlckJlZ2luID0gc3RhY2tUb3AgKyAxICsgbm9kZS5zdGFja2ZyYW1lQmVnaW47XHJcbiAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVyczEgPSBtZXRob2QucGFyYW1ldGVybGlzdC5wYXJhbWV0ZXJzO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IHBhcmFtZXRlckJlZ2luICsgMTsgaSA8PSBzdGFja1RvcDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuc3RhY2tbaV0gIT0gbnVsbCAmJiB0aGlzLnN0YWNrW2ldLnR5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW2ldID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogcGFyYW1ldGVyczFbaSAtIHBhcmFtZXRlckJlZ2luIC0gMV0udHlwZSwgIC8vIGNhc3QgdG8gcGFyYW1ldGVyIHR5cGUuLi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBzdGFja1tpXS52YWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGFja1twYXJhbWV0ZXJCZWdpbl0udmFsdWUgPT0gbnVsbCAmJiAhbWV0aG9kLmlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiQXVmcnVmIGRlciBNZXRob2RlIFwiICsgbWV0aG9kLmlkZW50aWZpZXIgKyBcIiBkZXMgbnVsbC1PYmpla3RzXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKG1ldGhvZC5pc0Fic3RyYWN0IHx8IG1ldGhvZC5pc1ZpcnR1YWwgJiYgIW5vZGUuaXNTdXBlckNhbGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgb2JqZWN0ID0gc3RhY2tbcGFyYW1ldGVyQmVnaW5dO1xyXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZCA9ICg8S2xhc3M+KDxSdW50aW1lT2JqZWN0Pm9iamVjdC52YWx1ZSkuY2xhc3MpLmdldE1ldGhvZEJ5U2lnbmF0dXJlKG1ldGhvZC5zaWduYXR1cmUpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmIChtZXRob2QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IHJhaXNlIHJ1bnRpbWUgZXJyb3JcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAobWV0aG9kLmludm9rZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJ0ID0gbWV0aG9kLmdldFJldHVyblR5cGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGFyYW1ldGVycyA9IHN0YWNrLnNwbGljZShwYXJhbWV0ZXJCZWdpbik7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJldHVyblZhbHVlID0gbWV0aG9kLmludm9rZShwYXJhbWV0ZXJzKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAocnQgIT0gbnVsbCAmJiBydC5pZGVudGlmaWVyICE9ICd2b2lkJykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiByZXR1cm5WYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHJ0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJvZ3JhbVN0YWNrLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtOiB0aGlzLmN1cnJlbnRQcm9ncmFtLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtUG9zaXRpb246IHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRQb3NpdGlvbjogbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiB0aGlzLmN1cnJlbnRNZXRob2QsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHBhcmFtZXRlckJlZ2luO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gbWV0aG9kLnByb2dyYW07XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWV0aG9kID0gbWV0aG9kO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IC0xOyAvLyBnZXRzIGluY3JlYXNlZCBhZnRlciBzd2l0Y2ggc3RhdGVtZW50Li4uXHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWV0aG9kLnJlc2VydmVTdGFja0ZvckxvY2FsVmFyaWFibGVzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2sucHVzaChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwrKztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5jYWxsSW5wdXRNZXRob2Q6XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gbm9kZS5zdGFja2ZyYW1lYmVnaW4gPSAtKHBhcmFtZXRlcnMucGFyYW1ldGVyVHlwZXMubGVuZ3RoICsgMSlcclxuICAgICAgICAgICAgICAgIGxldCBtZXRob2QxID0gbm9kZS5tZXRob2Q7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBhcmFtZXRlckJlZ2luMSA9IHN0YWNrVG9wICsgMSArIG5vZGUuc3RhY2tmcmFtZUJlZ2luO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwYXJhbWV0ZXJzID0gc3RhY2suc3BsaWNlKHBhcmFtZXRlckJlZ2luMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy50aW1lclN0b3BwZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9sZFN0YXRlID0gdGhpcy5zdGF0ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS53YWl0aW5nRm9ySW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5tYWluLnNob3dQcm9ncmFtUG9pbnRlclBvc2l0aW9uKHRoaXMuY3VycmVudFByb2dyYW0ubW9kdWxlLmZpbGUsIG5vZGUucG9zaXRpb24pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmlucHV0TWFuYWdlci5yZWFkSW5wdXQobWV0aG9kMSwgcGFyYW1ldGVycywgKHZhbHVlOiBWYWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnB1c2godmFsdWUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi5oaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChvbGRTdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2hvd1Byb2dyYW1Qb2ludGVyQW5kVmFyaWFibGVzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQub25lU3RlcChmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnJldHVybjpcclxuICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuKG5vZGUsIHN0YWNrKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5kZWNyZWFzZVN0YWNrcG9pbnRlcjpcclxuICAgICAgICAgICAgICAgIHN0YWNrLnNwbGljZShzdGFja1RvcCArIDEgLSBub2RlLnBvcENvdW50KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5pbml0U3RhY2tmcmFtZTpcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2tmcmFtZXMucHVzaCh0aGlzLmN1cnJlbnRTdGFja2ZyYW1lKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSBzdGFja1RvcCArIDE7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGUucmVzZXJ2ZUZvckxvY2FsVmFyaWFibGVzOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKG51bGwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmNsb3NlU3RhY2tmcmFtZTpcclxuICAgICAgICAgICAgICAgIHN0YWNrLnNwbGljZShzdGFja2ZyYW1lQmVnaW4pO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHRoaXMuc3RhY2tmcmFtZXMucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubmV3T2JqZWN0OlxyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KG5vZGUuY2xhc3MpO1xyXG5cclxuICAgICAgICAgICAgICAgIHZhbHVlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBvYmplY3QsXHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogbm9kZS5jbGFzc1xyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgIGlmIChub2RlLnN1YnNlcXVlbnRDb25zdHJ1Y3RvckNhbGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICBzdGFja1RvcCsrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxldCBrbGFzczogS2xhc3MgPSBub2RlLmNsYXNzO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChrbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFpcCA9IGtsYXNzLmF0dHJpYnV0ZUluaXRpYWxpemF0aW9uUHJvZ3JhbTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWlwLnN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFja2ZyYW1lcy5wdXNoKHRoaXMuY3VycmVudFN0YWNrZnJhbWUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2dyYW1TdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2dyYW06IHRoaXMuY3VycmVudFByb2dyYW0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9ncmFtUG9zaXRpb246IHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiArIDEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXh0UG9zaXRpb246IG5vZGUucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHRoaXMuY3VycmVudE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpc0NhbGxlZEZyb21PdXRzaWRlOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSBzdGFja1RvcCArIDE7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gYWlwO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSAtMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50TWV0aG9kID0gXCJLb25zdHJ1a3RvciB2b24gXCIgKyBrbGFzcy5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsKys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGtsYXNzID0ga2xhc3MuYmFzZUNsYXNzO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIE4uQi46IGNvbnN0cnVjdG9yIGNhbGwgaXMgbmV4dCBzdGF0ZW1lbnRcclxuXHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHJvY2Vzc1Bvc3RDb25zdHJ1Y3RvckNhbGxiYWNrczpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tbc3RhY2tUb3BdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNsYXNzVHlwZSA9IDxLbGFzcz52YWx1ZS50eXBlO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcGNjIG9mIGNsYXNzVHlwZS5nZXRQb3N0Q29uc3RydWN0b3JDYWxsYmFja3MoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHBjYyh2YWx1ZS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuZXh0ZW5kZWRGb3JMb29wSW5pdDpcclxuICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2tQb3NPZkNvdW50ZXIgKyBzdGFja2ZyYW1lQmVnaW5dID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IDBcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5leHRlbmRlZEZvckxvb3BDaGVja0NvdW50ZXJBbmRHZXRFbGVtZW50OlxyXG4gICAgICAgICAgICAgICAgbGV0IGNvdW50ZXI6IG51bWJlciA9IHN0YWNrW25vZGUuc3RhY2tQb3NPZkNvdW50ZXIgKyBzdGFja2ZyYW1lQmVnaW5dLnZhbHVlKys7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29sbGVjdGlvbiA9IHN0YWNrW25vZGUuc3RhY2tQb3NPZkNvbGxlY3Rpb24gKyBzdGFja2ZyYW1lQmVnaW5dLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIHN3aXRjaCAobm9kZS5raW5kKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSBcImFycmF5XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudGVyIDwgKDxhbnlbXT5jb2xsZWN0aW9uKS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2tQb3NPZkVsZW1lbnQgKyBzdGFja2ZyYW1lQmVnaW5dLnZhbHVlID0gKDxhbnlbXT5jb2xsZWN0aW9uKVtjb3VudGVyXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2tQb3NPZkVsZW1lbnQgKyBzdGFja2ZyYW1lQmVnaW5dLnR5cGUgPSAoPGFueVtdPmNvbGxlY3Rpb24pW2NvdW50ZXJdLnR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiaW50ZXJuYWxMaXN0XCI6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBsaXN0OiBhbnlbXSA9ICg8TGlzdEhlbHBlcj4oPFJ1bnRpbWVPYmplY3Q+Y29sbGVjdGlvbikuaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl0pLnZhbHVlQXJyYXk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudGVyIDwgbGlzdC5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2tQb3NPZkVsZW1lbnQgKyBzdGFja2ZyYW1lQmVnaW5dLnZhbHVlID0gbGlzdFtjb3VudGVyXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2tQb3NPZkVsZW1lbnQgKyBzdGFja2ZyYW1lQmVnaW5dLnR5cGUgPSBsaXN0W2NvdW50ZXJdLnR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIFwiZ3JvdXBcIjpcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGxpc3QxOiBhbnlbXSA9ICg8R3JvdXBIZWxwZXI+KDxSdW50aW1lT2JqZWN0PmNvbGxlY3Rpb24pLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSkuc2hhcGVzO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoY291bnRlciA8IGxpc3QxLmxlbmd0aCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhY2tbbm9kZS5zdGFja1Bvc09mRWxlbWVudCArIHN0YWNrZnJhbWVCZWdpbl0udmFsdWUgPSBsaXN0MVtjb3VudGVyXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YWNrW25vZGUuc3RhY2tQb3NPZkVsZW1lbnQgKyBzdGFja2ZyYW1lQmVnaW5dLnR5cGUgPSBsaXN0MVtjb3VudGVyXS5rbGFzcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVzdGluYXRpb24gLSAxO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmluY3JlbWVudERlY3JlbWVudEJlZm9yZTpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tbc3RhY2tUb3BdO1xyXG4gICAgICAgICAgICAgICAgdmFsdWUudmFsdWUgKz0gbm9kZS5pbmNyZW1lbnREZWNyZW1lbnRCeTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5pbmNyZW1lbnREZWNyZW1lbnRBZnRlcjpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tbc3RhY2tUb3BdO1xyXG4gICAgICAgICAgICAgICAgLy8gcmVwbGFjZSB2YWx1ZSBieSBjb3B5OlxyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3BdID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB2YWx1ZS52YWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB2YWx1ZS50eXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgLy8gaW5jcmVtZW50IHZhbHVlIHdoaWNoIGlzIG5vdCBpbnZvbHZlZCBpbiBzdWJzZXF1ZW50IFxyXG4gICAgICAgICAgICAgICAgdmFsdWUudmFsdWUgKz0gbm9kZS5pbmNyZW1lbnREZWNyZW1lbnRCeTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5qdW1wQWx3YXlzOlxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gbm9kZS5kZXN0aW5hdGlvbiAtIDE7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuanVtcElmVHJ1ZTpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoPGJvb2xlYW4+dmFsdWUudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5qdW1wSWZGYWxzZTpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoISg8Ym9vbGVhbj52YWx1ZS52YWx1ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5qdW1wSWZUcnVlQW5kTGVhdmVPblN0YWNrOlxyXG4gICAgICAgICAgICAgICAgdmFsdWUgPSBzdGFja1tzdGFja1RvcF07XHJcbiAgICAgICAgICAgICAgICBpZiAoPGJvb2xlYW4+dmFsdWUudmFsdWUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBub2RlLmRlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5qdW1wSWZGYWxzZUFuZExlYXZlT25TdGFjazpcclxuICAgICAgICAgICAgICAgIHZhbHVlID0gc3RhY2tbc3RhY2tUb3BdO1xyXG4gICAgICAgICAgICAgICAgaWYgKCEoPGJvb2xlYW4+dmFsdWUudmFsdWUpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gbm9kZS5kZXN0aW5hdGlvbiAtIDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUubm9PcDpcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5wcm9ncmFtRW5kOlxyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnByb2dyYW1TdGFjay5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wb3BQcm9ncmFtKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07IC8vIGdldHMgaW5jcmVhc2VkIGxhdGVyIG9uIGFmdGVyIHN3aXRjaCBlbmRzXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sZWF2ZUxpbmUgPSAtMTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKG5vZGUucGF1c2VBZnRlclByb2dyYW1FbmQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCA9IC0xO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKCh0aGlzLndvcmxkSGVscGVyICE9IG51bGwgJiYgdGhpcy53b3JsZEhlbHBlci5hY3RBY3RvcnMubGVuZ3RoID4gMCkgfHwgdGhpcy5wcm9jZXNzaW5nSGVscGVyICE9IG51bGwgXHJcbiAgICAgICAgICAgICAgICAgICAgfHwgKHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyICE9IG51bGwgJiYgdGhpcy5nbmdFcmVpZ25pc2JlaGFuZGx1bmdIZWxwZXIuYWt0aW9uc2VtcGZhZW5nZXJNYXBbXCJhdXNmw7xocmVuXCJdLmxlbmd0aCA+IDApKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYmFzZU1vZHVsZSA9IHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkubW9kdWxlU3RvcmUuZ2V0TW9kdWxlKFwiQmFzZSBNb2R1bGVcIik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGltZXJDbGFzczogVGltZXJDbGFzcyA9IDxUaW1lckNsYXNzPmJhc2VNb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJUaW1lclwiKTtcclxuICAgICAgICAgICAgICAgIGlmICh0aW1lckNsYXNzLnRpbWVyRW50cmllcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUuZG9uZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IC0xO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICAgICAgSGVscGVyLnNob3dIZWxwZXIoXCJzcGVlZENvbnRyb2xIZWxwZXJcIiwgdGhpcy5tYWluKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnByaW50TWFuYWdlci5zaG93UHJvZ3JhbUVuZCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLndvcmxkSGVscGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLndvcmxkSGVscGVyLnNwcml0ZUFuaW1hdGlvbnMgPSBbXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyPy5kZXRhY2hFdmVudHMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4uaGlkZVByb2dyYW1Qb2ludGVyUG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zdGVwcyA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZHQgPSBwZXJmb3JtYW5jZS5ub3coKSAtIHRoaXMudGltZVdoZW5Qcm9ncmFtU3RhcnRlZDtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZSA9ICdFeGVjdXRlZCAnICsgdGhpcy5zdGVwcyArICcgc3RlcHMgaW4gJyArIHRoaXMucm91bmQoZHQpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJyBtcyAoJyArIHRoaXMucm91bmQodGhpcy5zdGVwcyAvIGR0ICogMTAwMCkgKyAnIHN0ZXBzL3MpJztcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LndyaXRlQ29uc29sZUVudHJ5KG1lc3NhZ2UsIG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKHRoaXMudGltZXJFdmVudHMgKyBcIiBUaW1lRXZlbnRzIGluIFwiICsgZHQgKyBcIiBtcyBlcmdpYnQgZWluIEV2ZW50IGFsbGUgXCIgKyBkdC90aGlzLnRpbWVyRXZlbnRzICsgXCIgbXMuXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiVm9yZ2VnZWJlbmUgVGltZXJmcmVxdWVuejogQWxsZSBcIiArIHRoaXMudGltZXJEZWxheU1zICsgXCIgbXNcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGVwcyA9IC0xO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLS07XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHJpbnQ6XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnByaW50bG46XHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29sb3IgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUud2l0aENvbG9yKSBjb2xvciA9IDxzdHJpbmcgfCBudW1iZXI+c3RhY2sucG9wKCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBpZiAoIW5vZGUuZW1wdHkpIHRleHQgPSA8c3RyaW5nPnN0YWNrLnBvcCgpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PSBUb2tlblR5cGUucHJpbnRsbikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJpbnRNYW5hZ2VyLnByaW50bG4odGV4dCwgY29sb3IpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnByaW50TWFuYWdlci5wcmludCh0ZXh0LCBjb2xvcik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucHVzaEVtcHR5QXJyYXk6XHJcbiAgICAgICAgICAgICAgICBsZXQgY291bnRzOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlLmRpbWVuc2lvbjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY291bnRzLnB1c2goPG51bWJlcj5zdGFjay5wb3AoKS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHRoaXMubWFrZUVtcHR5QXJyYXkoY291bnRzLCBub2RlLmFycmF5VHlwZSkpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmJlZ2luQXJyYXk6XHJcbiAgICAgICAgICAgICAgICBzdGFjay5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBub2RlLmFycmF5VHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogW11cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLmFkZFRvQXJyYXk6XHJcbiAgICAgICAgICAgICAgICBzdGFja1RvcCAtPSBub2RlLm51bWJlck9mRWxlbWVudHNUb0FkZDtcclxuICAgICAgICAgICAgICAgIC8vIGxldCB2YWx1ZXM6IFZhbHVlW10gPSBzdGFjay5zcGxpY2Uoc3RhY2tUb3AgKyAxLCBub2RlLm51bWJlck9mRWxlbWVudHNUb0FkZCk7XHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZVtdID0gc3RhY2suc3BsaWNlKHN0YWNrVG9wICsgMSwgbm9kZS5udW1iZXJPZkVsZW1lbnRzVG9BZGQpLm1hcCh0dm8gPT4gKHsgdHlwZTogdHZvLnR5cGUsIHZhbHVlOiB0dm8udmFsdWUgfSkpO1xyXG4gICAgICAgICAgICAgICAgc3RhY2tbc3RhY2tUb3BdLnZhbHVlID0gKDxhbnlbXT5zdGFja1tzdGFja1RvcF0udmFsdWUpLmNvbmNhdCh2YWx1ZXMpO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hFbnVtVmFsdWU6XHJcbiAgICAgICAgICAgICAgICBsZXQgZW51bUluZm8gPSBub2RlLmVudW1DbGFzcy5pZGVudGlmaWVyVG9JbmZvTWFwW25vZGUudmFsdWVJZGVudGlmaWVyXTtcclxuICAgICAgICAgICAgICAgIHN0YWNrLnB1c2gobm9kZS5lbnVtQ2xhc3MudmFsdWVMaXN0LnZhbHVlW2VudW1JbmZvLm9yZGluYWxdKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFRva2VuVHlwZS5rZXl3b3JkU3dpdGNoOlxyXG4gICAgICAgICAgICAgICAgbGV0IHN3aXRjaFZhbHVlID0gc3RhY2sucG9wKCkudmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGVzdGluYXRpb24gPSBub2RlLmRlc3RpbmF0aW9uTWFwW3N3aXRjaFZhbHVlXTtcclxuICAgICAgICAgICAgICAgIGlmIChkZXN0aW5hdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gZGVzdGluYXRpb24gLSAxOyAvLyBpdCB3aWxsIGJlIGluY3JlYXNlZCBhZnRlciB0aGlzIHN3aXRjaC1zdGF0ZW1lbnQhXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChub2RlLmRlZmF1bHREZXN0aW5hdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IG5vZGUuZGVmYXVsdERlc3RpbmF0aW9uIC0gMTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlcmUncyBhIGp1bXBub2RlIGFmdGVyIHRoaXMgbm9kZSB3aGljaCBqdW1wcyByaWdodCBhZnRlciBsYXN0IHN3aXRjaCBjYXNlLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHNvIHRoZXJlJ3Mgbm90aGluZyBtb3JlIHRvIGRvIGhlcmUuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUuaGVhcFZhcmlhYmxlRGVjbGFyYXRpb246XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHYgPSBub2RlLnZhcmlhYmxlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5oZWFwW3YuaWRlbnRpZmllcl0gPSB2O1xyXG4gICAgICAgICAgICAgICAgdi52YWx1ZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB2LnR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6ICh2LnR5cGUgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSA/IHYudHlwZS5pbml0aWFsVmFsdWUgOiBudWxsXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5wdXNoT25Ub3BPZlN0YWNrRm9ySW5pdGlhbGl6YXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWNrLnB1c2godi52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgVG9rZW5UeXBlLnB1c2hGcm9tSGVhcFRvU3RhY2s6XHJcbiAgICAgICAgICAgICAgICBsZXQgdjEgPSB0aGlzLmhlYXBbbm9kZS5pZGVudGlmaWVyXTtcclxuICAgICAgICAgICAgICAgIGlmICh2MSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFjay5wdXNoKHYxLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFwiRGllIFZhcmlhYmxlIFwiICsgbm9kZS5pZGVudGlmaWVyICsgXCIgaXN0IG5pY2h0IGJla2FubnQuXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBUb2tlblR5cGUucmV0dXJuSWZEZXN0cm95ZWQ6XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hhcGVSdW50aW1lT2JqZWN0OiBSdW50aW1lT2JqZWN0ID0gdGhpcy5zdGFja1tzdGFja2ZyYW1lQmVnaW5dLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlUnVudGltZU9iamVjdCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNoYXBlID0gc2hhcGVSdW50aW1lT2JqZWN0LmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoc2hhcGVbXCJpc0Rlc3Ryb3llZFwiXSA9PSB0cnVlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmV0dXJuKG51bGwsIHN0YWNrKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uKys7XHJcblxyXG4gICAgfVxyXG4gICAgcmV0dXJuKG5vZGU6IFJldHVyblN0YXRlbWVudCB8IG51bGwsIHN0YWNrOiBWYWx1ZVtdKSB7XHJcblxyXG4gICAgICAgIGxldCBjdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChub2RlICE9IG51bGwgJiYgbm9kZS5jb3B5UmV0dXJuVmFsdWVUb1N0YWNrZnJhbWVQb3MwKSB7XHJcbiAgICAgICAgICAgIGxldCByZXR1cm5WYWx1ZTogVmFsdWUgPSBzdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgc3RhY2tbdGhpcy5jdXJyZW50U3RhY2tmcmFtZV0gPSByZXR1cm5WYWx1ZTtcclxuICAgICAgICAgICAgc3RhY2suc3BsaWNlKHRoaXMuY3VycmVudFN0YWNrZnJhbWUgKyAxKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzdGFjay5zcGxpY2UodGhpcy5jdXJyZW50U3RhY2tmcmFtZSArICgobm9kZSAhPSBudWxsICYmIG5vZGUubGVhdmVUaGlzT2JqZWN0T25TdGFjaykgPyAxIDogMCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHRoaXMuc3RhY2tmcmFtZXMucG9wKCk7XHJcblxyXG4gICAgICAgIHRoaXMucG9wUHJvZ3JhbSgpO1xyXG4gICAgICAgIGlmIChub2RlICE9IG51bGwgJiYgbm9kZS5tZXRob2RXYXNJbmplY3RlZCA9PSB0cnVlKSB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24rKztcclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24tLTsgIC8vIHBvc2l0aW9uIGdldHMgaW5jcmVhc2VkIGJ5IG9uZSBhdCB0aGUgZW5kIG9mIHRoaXMgc3dpdGNoLXN0YXRlbWVudCwgc28gLi4uIC0gMVxyXG4gICAgICAgIHRoaXMuc3RlcE92ZXJOZXN0aW5nTGV2ZWwtLTtcclxuXHJcbiAgICAgICAgaWYgKGN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4odGhpcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgbWFrZUVtcHR5QXJyYXkoY291bnRzOiBudW1iZXJbXSwgdHlwZTogVHlwZSk6IFZhbHVlIHtcclxuICAgICAgICBsZXQgdHlwZTEgPSAoPEFycmF5VHlwZT50eXBlKS5hcnJheU9mVHlwZTtcclxuICAgICAgICBpZiAoY291bnRzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgICAgICAgIGxldCBhcnJheTogVmFsdWVbXSA9IFtdO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50c1swXTsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdiA9IHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlMSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodHlwZTEgaW5zdGFuY2VvZiBQcmltaXRpdmVUeXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdi52YWx1ZSA9IHR5cGUxLmluaXRpYWxWYWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhcnJheS5wdXNoKHYpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgICAgICAgICAgIHZhbHVlOiBhcnJheVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBhcnJheTogVmFsdWVbXSA9IFtdO1xyXG4gICAgICAgICAgICBsZXQgbiA9IGNvdW50cy5wb3AoKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGFycmF5LnB1c2godGhpcy5tYWtlRW1wdHlBcnJheShjb3VudHMsIHR5cGUxKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogYXJyYXlcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJvdW5kKG46IG51bWJlcik6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIFwiXCIgKyBNYXRoLnJvdW5kKG4gKiAxMDAwMCkgLyAxMDAwMDtcclxuICAgIH1cclxuXHJcbiAgICBydW5uaW5nU3RhdGVzOiBJbnRlcnByZXRlclN0YXRlW10gPSBbSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQsIEludGVycHJldGVyU3RhdGUucnVubmluZywgSW50ZXJwcmV0ZXJTdGF0ZS53YWl0aW5nRm9ySW5wdXRdO1xyXG5cclxuICAgIHNldFN0YXRlKHN0YXRlOiBJbnRlcnByZXRlclN0YXRlKSB7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiU2V0IHN0YXRlIFwiICsgSW50ZXJwcmV0ZXJTdGF0ZVtzdGF0ZV0pO1xyXG5cclxuICAgICAgICBsZXQgb2xkU3RhdGUgPSB0aGlzLnN0YXRlO1xyXG4gICAgICAgIHRoaXMuc3RhdGUgPSBzdGF0ZTtcclxuXHJcbiAgICAgICAgaWYgKHN0YXRlID09IEludGVycHJldGVyU3RhdGUuZXJyb3IgfHwgc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKSB7XHJcbiAgICAgICAgICAgIHRoaXMud2ViU29ja2V0c1RvQ2xvc2VBZnRlclByb2dyYW1IYWx0LmZvckVhY2goc29ja2V0ID0+IHNvY2tldC5jbG9zZSgpKTtcclxuICAgICAgICAgICAgdGhpcy53ZWJTb2NrZXRzVG9DbG9zZUFmdGVyUHJvZ3JhbUhhbHQgPSBbXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBhbSA9IHRoaXMubWFpbi5nZXRBY3Rpb25NYW5hZ2VyKCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGFjdGlvbklkIG9mIHRoaXMuYWN0aW9ucykge1xyXG4gICAgICAgICAgICBhbS5zZXRBY3RpdmUoXCJpbnRlcnByZXRlci5cIiArIGFjdGlvbklkLCB0aGlzLmJ1dHRvbkFjdGl2ZU1hdHJpeFthY3Rpb25JZF1bc3RhdGVdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBidXR0b25TdGFydEFjdGl2ZSA9IHRoaXMuYnV0dG9uQWN0aXZlTWF0cml4WydzdGFydCddW3N0YXRlXTtcclxuXHJcbiAgICAgICAgaWYgKGJ1dHRvblN0YXJ0QWN0aXZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbEJ1dHRvbnMuJGJ1dHRvblN0YXJ0LnNob3coKTtcclxuICAgICAgICAgICAgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uUGF1c2UuaGlkZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29udHJvbEJ1dHRvbnMuJGJ1dHRvblN0YXJ0LmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy5jb250cm9sQnV0dG9ucy4kYnV0dG9uUGF1c2Uuc2hvdygpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGJ1dHRvblN0b3BBY3RpdmUgPSB0aGlzLmJ1dHRvbkFjdGl2ZU1hdHJpeFsnc3RvcCddW3N0YXRlXTtcclxuICAgICAgICBpZiAoYnV0dG9uU3RvcEFjdGl2ZSkge1xyXG4gICAgICAgICAgICAvLyB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25FZGl0LnNob3coKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyB0aGlzLmNvbnRyb2xCdXR0b25zLiRidXR0b25FZGl0LmhpZGUoKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMud29ybGRIZWxwZXIgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5jbGVhckFjdG9yTGlzdHMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmduZ0VyZWlnbmlzYmVoYW5kbHVuZ0hlbHBlcj8uZGV0YWNoRXZlbnRzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZ25nRXJlaWduaXNiZWhhbmRsdW5nSGVscGVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmdTdGF0ZXMuaW5kZXhPZihvbGRTdGF0ZSkgPj0gMCAmJiB0aGlzLnJ1bm5pbmdTdGF0ZXMuaW5kZXhPZihzdGF0ZSkgPCAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVidWdnZXIuZGlzYWJsZSgpO1xyXG4gICAgICAgICAgICAvLyB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkudXBkYXRlT3B0aW9ucyh7IHJlYWRPbmx5OiBmYWxzZSB9KTtcclxuICAgICAgICAgICAgdGhpcy5rZXlib2FyZFRvb2wudW5zdWJzY3JpYmVBbGxMaXN0ZW5lcnMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnJ1bm5pbmdTdGF0ZXMuaW5kZXhPZihvbGRTdGF0ZSkgPCAwICYmIHRoaXMucnVubmluZ1N0YXRlcy5pbmRleE9mKHN0YXRlKSA+PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZGVidWdnZXIuZW5hYmxlKCk7XHJcbiAgICAgICAgICAgIC8vIHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKS51cGRhdGVPcHRpb25zKHsgcmVhZE9ubHk6IHRydWUgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdXNoQ3VycmVudFByb2dyYW0oKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRQcm9ncmFtID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgbGV0IHRleHRQb3NpdGlvbjogVGV4dFBvc2l0aW9uO1xyXG4gICAgICAgIGxldCBjdXJyZW50U3RhdGVtZW50ID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcbiAgICAgICAgaWYgKGN1cnJlbnRTdGF0ZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0ZXh0UG9zaXRpb24gPSBjdXJyZW50U3RhdGVtZW50LnBvc2l0aW9uO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5wcm9ncmFtU3RhY2sucHVzaCh7XHJcbiAgICAgICAgICAgIHByb2dyYW06IHRoaXMuY3VycmVudFByb2dyYW0sXHJcbiAgICAgICAgICAgIHByb2dyYW1Qb3NpdGlvbjogdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uLFxyXG4gICAgICAgICAgICB0ZXh0UG9zaXRpb246IHRleHRQb3NpdGlvbixcclxuICAgICAgICAgICAgbWV0aG9kOiB0aGlzLmN1cnJlbnRNZXRob2QsXHJcbiAgICAgICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IHRoaXMuY3VycmVudENhbGxiYWNrQWZ0ZXJSZXR1cm4sXHJcbiAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IHRoaXMuY3VycmVudElzQ2FsbGVkRnJvbU91dHNpZGVcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gbnVsbDtcclxuICAgICAgICB0aGlzLmN1cnJlbnRJc0NhbGxlZEZyb21PdXRzaWRlID0gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgLy8gcnVuVGltZXIobWV0aG9kOiBNZXRob2QsIHN0YWNrRWxlbWVudHM6IFZhbHVlW10sXHJcbiAgICAvLyAgICAgY2FsbGJhY2tBZnRlclJldHVybjogKGludGVycHJldGVyOiBJbnRlcnByZXRlcikgPT4gdm9pZCkge1xyXG5cclxuICAgIC8vICAgICBpZih0aGlzLnN0YXRlICE9IEludGVycHJldGVyU3RhdGUucnVubmluZyl7XHJcbiAgICAvLyAgICAgICAgIHJldHVybjtcclxuICAgIC8vICAgICB9XHJcblxyXG4gICAgLy8gICAgIHRoaXMucHVzaEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgLy8gICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBtZXRob2QucHJvZ3JhbTtcclxuICAgIC8vICAgICB0aGlzLmN1cnJlbnRNZXRob2QgPSBtZXRob2Q7XHJcbiAgICAvLyAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gMDtcclxuICAgIC8vICAgICB0aGlzLmN1cnJlbnRDYWxsYmFja0FmdGVyUmV0dXJuID0gY2FsbGJhY2tBZnRlclJldHVybjtcclxuICAgIC8vICAgICB0aGlzLmN1cnJlbnRJc0NhbGxlZEZyb21PdXRzaWRlID0gXCJUaW1lclwiO1xyXG5cclxuICAgIC8vICAgICB0aGlzLnN0YWNrZnJhbWVzLnB1c2godGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAvLyAgICAgdGhpcy5jdXJyZW50U3RhY2tmcmFtZSA9IHRoaXMuc3RhY2subGVuZ3RoO1xyXG4gICAgLy8gICAgIGZvciAobGV0IHNlIG9mIHN0YWNrRWxlbWVudHMpIHRoaXMuc3RhY2sucHVzaChzZSk7XHJcbiAgICAvLyAgICAgbGV0IHN0YXRlbWVudHMgPSBtZXRob2QucHJvZ3JhbS5zdGF0ZW1lbnRzO1xyXG5cclxuICAgIC8vICAgICAvLyBpZiBwcm9ncmFtIGVuZHMgd2l0aCByZXR1cm4gdGhlbiB0aGlzIHJldHVybi1zdGF0ZW1lbnQgZGVjcmVhc2VzIHN0ZXBPdmVyTmVzdGluZ0xldmVsLiBTbyB3ZSBpbmNyZWFzZSBpdFxyXG4gICAgLy8gICAgIC8vIGJlZm9yZWhhbmQgdG8gY29tcGVuc2F0ZSB0aGlzIGVmZmVjdC5cclxuICAgIC8vICAgICBpZihzdGF0ZW1lbnRzW3N0YXRlbWVudHMubGVuZ3RoIC0gMV0udHlwZSA9PSBUb2tlblR5cGUucmV0dXJuKSB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsKys7XHJcblxyXG4gICAgLy8gfVxyXG5cclxuICAgIHJ1blRpbWVyKG1ldGhvZDogTWV0aG9kLCBzdGFja0VsZW1lbnRzOiBWYWx1ZVtdLFxyXG4gICAgICAgIGNhbGxiYWNrQWZ0ZXJSZXR1cm46IChpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXIpID0+IHZvaWQsIGlzQWN0b3I6IGJvb2xlYW4pIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuc3RhdGUgIT0gSW50ZXJwcmV0ZXJTdGF0ZS5ydW5uaW5nKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzdGF0ZW1lbnRzID0gbWV0aG9kLnByb2dyYW0uc3RhdGVtZW50cztcclxuXHJcbiAgICAgICAgaWYgKGlzQWN0b3IgfHwgdGhpcy5wcm9ncmFtU3RhY2subGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgLy8gTWFpbiBQcm9ncmFtIGlzIHJ1bm5pbmcgPT4gVGltZXIgaGFzIGhpZ2hlciBwcmVjZWRlbmNlXHJcbiAgICAgICAgICAgIHRoaXMucHVzaEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtID0gbWV0aG9kLnByb2dyYW07XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudE1ldGhvZCA9IG1ldGhvZDtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gMDtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2FsbGJhY2tBZnRlclJldHVybiA9IGNhbGxiYWNrQWZ0ZXJSZXR1cm47XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudElzQ2FsbGVkRnJvbU91dHNpZGUgPSBcIlRpbWVyXCI7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnN0YWNrZnJhbWVzLnB1c2godGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSB0aGlzLnN0YWNrLmxlbmd0aDtcclxuICAgICAgICAgICAgdGhpcy5zdGFjayA9IHRoaXMuc3RhY2suY29uY2F0KHN0YWNrRWxlbWVudHMpO1xyXG4gICAgICAgICAgICAvLyBmb3IgKGxldCBzZSBvZiBzdGFja0VsZW1lbnRzKSB0aGlzLnN0YWNrLnB1c2goc2UpO1xyXG5cclxuICAgICAgICAgICAgLy8gaWYgcHJvZ3JhbSBlbmRzIHdpdGggcmV0dXJuIHRoZW4gdGhpcyByZXR1cm4tc3RhdGVtZW50IGRlY3JlYXNlcyBzdGVwT3Zlck5lc3RpbmdMZXZlbC4gU28gd2UgaW5jcmVhc2UgaXRcclxuICAgICAgICAgICAgLy8gYmVmb3JlaGFuZCB0byBjb21wZW5zYXRlIHRoaXMgZWZmZWN0LlxyXG4gICAgICAgICAgICBpZiAoc3RhdGVtZW50c1tzdGF0ZW1lbnRzLmxlbmd0aCAtIDFdLnR5cGUgPT0gVG9rZW5UeXBlLnJldHVybikgdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbCsrO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIGFub3RoZXIgVGltZXIgaXMgcnVubmluZyA9PiBxdWV1ZSB1cFxyXG4gICAgICAgICAgICAvLyBwb3NpdGlvbiAwIGluIHByb2dyYW0gc3RhY2sgaXMgbWFpbiBwcm9ncmFtXHJcbiAgICAgICAgICAgIC8vID0+IGluc2VydCB0aW1lciBpbiBwb3NpdGlvbiAxXHJcblxyXG4gICAgICAgICAgICB0aGlzLnByb2dyYW1TdGFjay5zcGxpY2UoMSwgMCwge1xyXG4gICAgICAgICAgICAgICAgcHJvZ3JhbTogbWV0aG9kLnByb2dyYW0sXHJcbiAgICAgICAgICAgICAgICBwcm9ncmFtUG9zaXRpb246IDAsXHJcbiAgICAgICAgICAgICAgICB0ZXh0UG9zaXRpb246IHsgbGluZTogMCwgY29sdW1uOiAwLCBsZW5ndGg6IDAgfSxcclxuICAgICAgICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tBZnRlclJldHVybjogY2FsbGJhY2tBZnRlclJldHVybixcclxuICAgICAgICAgICAgICAgIGlzQ2FsbGVkRnJvbU91dHNpZGU6IFwiVGltZXJcIixcclxuICAgICAgICAgICAgICAgIHN0YWNrRWxlbWVudHNUb1B1c2hCZWZvcmVGaXJzdEV4ZWN1dGluZzogc3RhY2tFbGVtZW50c1xyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChzdGF0ZW1lbnRzW3N0YXRlbWVudHMubGVuZ3RoIC0gMV0udHlwZSA9PSBUb2tlblR5cGUucmV0dXJuKSB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsKys7XHJcblxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGV2YWx1YXRlKHByb2dyYW06IFByb2dyYW0pOiB7IGVycm9yOiBzdHJpbmcsIHZhbHVlOiBWYWx1ZSB9IHtcclxuXHJcbiAgICAgICAgdGhpcy5wdXNoQ3VycmVudFByb2dyYW0oKTtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbSA9IHByb2dyYW07XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gMDtcclxuXHJcbiAgICAgICAgbGV0IHN0YWNrc2l6ZUJlZm9yZSA9IHRoaXMuc3RhY2subGVuZ3RoO1xyXG5cclxuICAgICAgICBsZXQgb2xkSW50ZXJwcmV0ZXJTdGF0ZSA9IHRoaXMuc3RhdGU7XHJcbiAgICAgICAgbGV0IHN0ZXBPdmVyTmVzdGluZ0xldmVsID0gdGhpcy5zdGVwT3Zlck5lc3RpbmdMZXZlbDtcclxuICAgICAgICBsZXQgYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWcgPSB0aGlzLmFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnO1xyXG5cclxuICAgICAgICBsZXQgb2xkU3RhY2tmcmFtZSA9IHRoaXMuY3VycmVudFN0YWNrZnJhbWU7XHJcblxyXG4gICAgICAgIGxldCBlcnJvcjogc3RyaW5nO1xyXG4gICAgICAgIGxldCBzdGVwQ291bnQgPSAwO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB3aGlsZSAoZXJyb3IgPT0gbnVsbCAmJlxyXG4gICAgICAgICAgICAgICAgKHRoaXMuY3VycmVudFByb2dyYW0gIT0gcHJvZ3JhbSB8fCB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPFxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0uc3RhdGVtZW50cy5sZW5ndGgpXHJcbiAgICAgICAgICAgICAgICAmJiBzdGVwQ291bnQgPCAxMDAwMDBcclxuICAgICAgICAgICAgICAgIC8vICYmIHRoaXMuY3VycmVudFByb2dyYW0gPT0gcHJvZ3JhbVxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIGVycm9yID0gdGhpcy5uZXh0U3RlcCgpO1xyXG4gICAgICAgICAgICAgICAgc3RlcENvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGVycm9yID0gXCJGZWhsZXIgYmVpIGRlciBBdXN3ZXJ0dW5nXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UHJvZ3JhbSA9PSBwcm9ncmFtICYmIHRoaXMucHJvZ3JhbVN0YWNrLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5wb3BQcm9ncmFtKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc3RhY2tUb3A6IFZhbHVlO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCA+IHN0YWNrc2l6ZUJlZm9yZSkge1xyXG4gICAgICAgICAgICBzdGFja1RvcCA9IHRoaXMuc3RhY2sucG9wKCk7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5zdGFjay5sZW5ndGggPiBzdGFja3NpemVCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gc3RlcE92ZXJOZXN0aW5nTGV2ZWw7XHJcbiAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IGFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnO1xyXG4gICAgICAgIHRoaXMuc2V0U3RhdGUob2xkSW50ZXJwcmV0ZXJTdGF0ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGVycm9yOiBlcnJvcixcclxuICAgICAgICAgICAgdmFsdWU6IHN0YWNrVG9wXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlSW1tZWRpYXRlbHlJbk5ld1N0YWNrZnJhbWUocHJvZ3JhbTogUHJvZ3JhbSwgdmFsdWVzVG9QdXNoQmVmb3JlRXhlY3V0aW5nOiBWYWx1ZVtdKTogeyBlcnJvcjogc3RyaW5nLCB2YWx1ZTogVmFsdWUgfSB7XHJcblxyXG4gICAgICAgIHRoaXMucHVzaEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudFByb2dyYW0gPSBwcm9ncmFtO1xyXG4gICAgICAgIGxldCBvbGRQcm9ncmFtUG9zaXRpb24gPSB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb247XHJcbiAgICAgICAgdGhpcy5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gMDtcclxuXHJcbiAgICAgICAgbGV0IG51bWJlck9mU3RhY2tmcmFtZXNCZWZvcmUgPSB0aGlzLnN0YWNrZnJhbWVzLmxlbmd0aDtcclxuICAgICAgICB0aGlzLnN0YWNrZnJhbWVzLnB1c2godGhpcy5jdXJyZW50U3RhY2tmcmFtZSk7XHJcbiAgICAgICAgbGV0IHN0YWNrc2l6ZUJlZm9yZSA9IHRoaXMuc3RhY2subGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuY3VycmVudFN0YWNrZnJhbWUgPSBzdGFja3NpemVCZWZvcmU7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHYgb2YgdmFsdWVzVG9QdXNoQmVmb3JlRXhlY3V0aW5nKSB0aGlzLnN0YWNrLnB1c2godik7XHJcblxyXG4gICAgICAgIGxldCBvbGRJbnRlcnByZXRlclN0YXRlID0gdGhpcy5zdGF0ZTtcclxuICAgICAgICBsZXQgc3RlcE92ZXJOZXN0aW5nTGV2ZWwgPSB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsO1xyXG4gICAgICAgIGxldCBhZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IHRoaXMuYWRkaXRpb25hbFN0ZXBGaW5pc2hlZEZsYWc7XHJcblxyXG5cclxuICAgICAgICBsZXQgc3RlcENvdW50ID0gMDtcclxuICAgICAgICBsZXQgZXJyb3IgPSBudWxsO1xyXG5cclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5zdGFja2ZyYW1lcy5sZW5ndGggPiBudW1iZXJPZlN0YWNrZnJhbWVzQmVmb3JlXHJcbiAgICAgICAgICAgICAgICAmJiBzdGVwQ291bnQgPCAxMDAwMDAgJiYgZXJyb3IgPT0gbnVsbFxyXG4gICAgICAgICAgICApIHtcclxuICAgICAgICAgICAgICAgIGxldCBub2RlID0gdGhpcy5jdXJyZW50UHJvZ3JhbS5zdGF0ZW1lbnRzW3RoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbl07XHJcblxyXG4gICAgICAgICAgICAgICAgZXJyb3IgPSB0aGlzLmV4ZWN1dGVOb2RlKG5vZGUpO1xyXG4gICAgICAgICAgICAgICAgc3RlcENvdW50Kys7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgIGVycm9yID0gXCJGZWhsZXIgYmVpIGRlciBBdXN3ZXJ0dW5nXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3RlcENvdW50ID09IDEwMDAwMCkgdGhpcy50aHJvd0V4Y2VwdGlvbihcIkRpZSBBdXNmw7xocnVuZyBkZXMgS29uc3RydWt0b3JzIGRhdWVydGUgenUgbGFuZ2UuXCIpO1xyXG5cclxuICAgICAgICBsZXQgc3RhY2tUb3A6IFZhbHVlO1xyXG4gICAgICAgIGlmICh0aGlzLnN0YWNrLmxlbmd0aCA+IHN0YWNrc2l6ZUJlZm9yZSkge1xyXG4gICAgICAgICAgICBzdGFja1RvcCA9IHRoaXMuc3RhY2sucG9wKCk7XHJcblxyXG4gICAgICAgICAgICB3aGlsZSAodGhpcy5zdGFjay5sZW5ndGggPiBzdGFja3NpemVCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnN0ZXBPdmVyTmVzdGluZ0xldmVsID0gc3RlcE92ZXJOZXN0aW5nTGV2ZWw7XHJcbiAgICAgICAgdGhpcy5hZGRpdGlvbmFsU3RlcEZpbmlzaGVkRmxhZyA9IGFkZGl0aW9uYWxTdGVwRmluaXNoZWRGbGFnO1xyXG4gICAgICAgIC8vIHRoaXMuY3VycmVudFByb2dyYW1Qb3NpdGlvbisrO1xyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRQcm9ncmFtUG9zaXRpb24gPSBvbGRQcm9ncmFtUG9zaXRpb247XHJcbiAgICAgICAgdGhpcy5zZXRTdGF0ZShvbGRJbnRlcnByZXRlclN0YXRlKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZXJyb3I6IGVycm9yLFxyXG4gICAgICAgICAgICB2YWx1ZTogc3RhY2tUb3BcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluc3RhbnRpYXRlT2JqZWN0SW1tZWRpYXRlbHkoa2xhc3M6IEtsYXNzKTogUnVudGltZU9iamVjdCB7XHJcbiAgICAgICAgbGV0IG9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KGtsYXNzKTtcclxuXHJcbiAgICAgICAgbGV0IHZhbHVlID0ge1xyXG4gICAgICAgICAgICB2YWx1ZTogb2JqZWN0LFxyXG4gICAgICAgICAgICB0eXBlOiBrbGFzc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGxldCBrbGFzczEgPSBrbGFzcztcclxuXHJcbiAgICAgICAgd2hpbGUgKGtsYXNzMSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCBhaXAgPSBrbGFzczEuYXR0cmlidXRlSW5pdGlhbGl6YXRpb25Qcm9ncmFtO1xyXG4gICAgICAgICAgICBpZiAoYWlwLnN0YXRlbWVudHMubGVuZ3RoID4gMCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuZXhlY3V0ZUltbWVkaWF0ZWx5SW5OZXdTdGFja2ZyYW1lKGFpcCwgW3ZhbHVlXSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGtsYXNzMSA9IGtsYXNzMS5iYXNlQ2xhc3M7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY29uc3RydWN0b3IgPSBrbGFzcy5nZXRNZXRob2RCeVNpZ25hdHVyZShrbGFzcy5pZGVudGlmaWVyICsgXCIoKVwiKTtcclxuICAgICAgICBpZiAoY29uc3RydWN0b3IgIT0gbnVsbCAmJiBjb25zdHJ1Y3Rvci5wcm9ncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gbGV0IHByb2dyYW1XaXRob3V0UmV0dXJuU3RhdGVtZW50OiBQcm9ncmFtID0ge1xyXG4gICAgICAgICAgICAvLyAgICAgbGFiZWxNYW5hZ2VyOiBudWxsLFxyXG4gICAgICAgICAgICAvLyAgICAgbW9kdWxlOiBjb25zdHJ1Y3Rvci5wcm9ncmFtLm1vZHVsZSxcclxuICAgICAgICAgICAgLy8gICAgIHN0YXRlbWVudHM6IGNvbnN0cnVjdG9yLnByb2dyYW0uc3RhdGVtZW50cy5zbGljZSgwLCBjb25zdHJ1Y3Rvci5wcm9ncmFtLnN0YXRlbWVudHMubGVuZ3RoIC0gMSlcclxuICAgICAgICAgICAgLy8gfTtcclxuICAgICAgICAgICAgdGhpcy5leGVjdXRlSW1tZWRpYXRlbHlJbk5ld1N0YWNrZnJhbWUoY29uc3RydWN0b3IucHJvZ3JhbSwgW3ZhbHVlXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gb2JqZWN0O1xyXG5cclxuICAgIH1cclxuXHJcbn0iXX0=