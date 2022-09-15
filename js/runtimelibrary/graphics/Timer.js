import { Method, Parameterlist } from "../compiler/types/Types.js";
import { Class, Interface } from "../compiler/types/Class.js";
import { intPrimitiveType, voidPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
import { InterpreterState } from "../interpreter/Interpreter.js";
export class Runnable extends Interface {
    constructor(module) {
        super("Runnable", module);
        this.addMethod(new Method("run", new Parameterlist([
        // { identifier: "deltaTimeInMs", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), voidPrimitiveType, null, // no implementation!
        false, false, "Wird vom Timer immer wieder aufgerufen"));
    }
}
export class TimerClass extends Class {
    constructor(module) {
        super("Timer", module);
        this.timerEntries = [];
        this.timerRunning = false;
        this.setBaseClass(module.typeStore.getType("Object"));
        this.staticClass.classObject = new RuntimeObject(this.staticClass);
        this.staticClass.classObject.initializeAttributeValues();
        this.addMethod(new Method("repeat", new Parameterlist([
            {
                identifier: "runnable", type: module.typeStore.getType("Runnable"),
                declaration: null, usagePositions: null, isFinal: true
            },
            {
                identifier: "deltaTimeInMs", type: intPrimitiveType,
                declaration: null, usagePositions: null, isFinal: true
            },
        ]), voidPrimitiveType, (parameters) => {
            let tl = parameters[1].value;
            let dt = parameters[2].value;
            let timerEntry = {
                timerListener: tl,
                dt: dt,
                lastTimeFired: 0,
                running: true,
                program: tl.class.getMethod("run", new Parameterlist([
                // {
                //     identifier: "deltaTimeInMs",
                //     type: intPrimitiveType,
                //     declaration: null,
                //     isFinal: true,
                //     usagePositions: null
                // }
                ])).program
            };
            this.timerEntries.push(timerEntry);
            console.log("TimerListener added with dt = " + dt + " ms.");
        }, false, true, "Fügt ein neues TimerListener-Objekt hinzu und ruft dessen tick-Methode immer wieder auf."));
        this.processTimerEntries();
    }
    processTimerEntries() {
        var _a, _b;
        let interpreter = (_b = (_a = this.module) === null || _a === void 0 ? void 0 : _a.main) === null || _b === void 0 ? void 0 : _b.interpreter;
        if (interpreter != null && !this.timerRunning) {
            switch (interpreter.state) {
                case InterpreterState.running:
                    let t = performance.now();
                    for (let timerentry of this.timerEntries) {
                        let dt = t - timerentry.lastTimeFired;
                        if (dt >= timerentry.dt) {
                            this.runEntry(timerentry, interpreter, Math.round(dt));
                            timerentry.lastTimeFired = t;
                        }
                    }
                    break;
                case InterpreterState.done:
                case InterpreterState.error:
                case InterpreterState.not_initialized:
                    this.timerEntries = [];
                    this.timerRunning = false;
                    break;
            }
        }
        let that = this;
        setTimeout(() => {
            that.processTimerEntries();
        }, 1);
    }
    runEntry(timerentry, interpreter, dt) {
        let stackElements = [
            {
                type: timerentry.timerListener.class,
                value: timerentry.timerListener
            },
        ];
        this.timerRunning = true;
        let that = this;
        interpreter.runTimer(timerentry.program, stackElements, (interpreter) => {
            that.timerRunning = false;
        });
    }
}
//# sourceMappingURL=Timer.js.map