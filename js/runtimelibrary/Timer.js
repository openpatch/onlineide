import { Method, Parameterlist } from "../compiler/types/Types.js";
import { Klass, Interface } from "../compiler/types/Class.js";
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
export class TimerClass extends Klass {
    constructor(module) {
        super("Timer", module, "Timer Klasse zur periodischen Ausführung von Methoden");
        this.timerEntries = [];
        this.timerRunning = false;
        this.timerStarted = false;
        this.setBaseClass(module.typeStore.getType("Object"));
        this.staticClass.classObject = new RuntimeObject(this.staticClass);
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
                method: tl.class.getMethod("run", new Parameterlist([
                // {
                //     identifier: "deltaTimeInMs",
                //     type: intPrimitiveType,
                //     declaration: null,
                //     isFinal: true,
                //     usagePositions: null
                // }
                ]))
            };
            this.timerEntries.push(timerEntry);
            // console.log("TimerListener added with dt = " + dt + " ms.");
        }, false, true, "Fügt ein neues TimerListener-Objekt hinzu und ruft dessen tick-Methode immer wieder auf."));
    }
    startTimer() {
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.processTimerEntries();
        }
    }
    stopTimer() {
        this.timerStarted = false;
    }
    processTimerEntries() {
        var _a, _b;
        if (!this.timerStarted) {
            return;
        }
        if (this.timerEntries.length > 0) {
            let interpreter = (_b = (_a = this.module) === null || _a === void 0 ? void 0 : _a.main) === null || _b === void 0 ? void 0 : _b.getInterpreter();
            if (interpreter != null) {
                if (!this.timerRunning && interpreter.state == InterpreterState.running) {
                    let t = performance.now();
                    for (let timerentry of this.timerEntries) {
                        let dt = t - timerentry.lastTimeFired;
                        if (dt >= timerentry.dt) {
                            this.runEntry(timerentry, interpreter, Math.round(dt));
                            timerentry.lastTimeFired = t;
                        }
                    }
                }
                switch (interpreter.state) {
                    case InterpreterState.done:
                    case InterpreterState.error:
                    case InterpreterState.not_initialized:
                        this.timerEntries = [];
                        this.timerRunning = false;
                        break;
                }
            }
        }
        let that = this;
        setTimeout(() => {
            that.processTimerEntries();
        }, 10);
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
        interpreter.runTimer(timerentry.method, stackElements, (interpreter) => {
            that.timerRunning = false;
        }, false);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVGltZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L1RpbWVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBUSxNQUFNLEVBQUUsYUFBYSxFQUFvQixNQUFNLDRCQUE0QixDQUFDO0FBQzNGLE9BQU8sRUFBRSxLQUFLLEVBQWMsU0FBUyxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFDMUUsT0FBTyxFQUFnRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHFDQUFxQyxDQUFDO0FBR3hKLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUVoRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQWUsTUFBTSwrQkFBK0IsQ0FBQztBQUk5RSxNQUFNLE9BQU8sUUFBUyxTQUFRLFNBQVM7SUFFbkMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFMUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxhQUFhLENBQUM7UUFDL0Msa0hBQWtIO1NBQ3JILENBQUMsRUFBRSxpQkFBaUIsRUFDakIsSUFBSSxFQUFHLHFCQUFxQjtRQUM1QixLQUFLLEVBQUUsS0FBSyxFQUFFLHdDQUF3QyxDQUFDLENBQUMsQ0FBQztJQUNqRSxDQUFDO0NBRUo7QUFVRCxNQUFNLE9BQU8sVUFBVyxTQUFRLEtBQUs7SUFPakMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLHVEQUF1RCxDQUFDLENBQUM7UUFOcEYsaUJBQVksR0FBaUIsRUFBRSxDQUFDO1FBQ2hDLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBRTlCLGlCQUFZLEdBQVksS0FBSyxDQUFDO1FBSzFCLElBQUksQ0FBQyxZQUFZLENBQVEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxD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QUM7eUJBQ2hDO3FCQUNKO2lCQUNKO2dCQUVELFFBQVEsV0FBVyxDQUFDLEtBQUssRUFBRTtvQkFDdkIsS0FBSyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7b0JBQzNCLEtBQUssZ0JBQWdCLENBQUMsS0FBSyxDQUFDO29CQUM1QixLQUFLLGdCQUFnQixDQUFDLGVBQWU7d0JBQ2pDLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO3dCQUN2QixJQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQzt3QkFDMUIsTUFBTTtpQkFDYjthQUVKO1NBRUo7UUFHRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsVUFBVSxDQUFDLEdBQUcsRUFBRTtZQUNaLElBQUksQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQy9CLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVYLENBQUM7SUFFRCxRQUFRLENBQUMsVUFBc0IsRUFBRSxXQUF3QixFQUFFLEVBQVU7UUFDakUsSUFBSSxhQUFhLEdBQVk7WUFDekI7Z0JBQ0ksSUFBSSxFQUFFLFVBQVUsQ0FBQyxhQUFhLENBQUMsS0FBSztnQkFDcEMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxhQUFhO2FBQ2xDO1NBS0osQ0FBQztRQUVGLElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO1FBQ3pCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUVoQixXQUFXLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDbkUsSUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7UUFDOUIsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2QsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHlwZSwgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSwgQXR0cmlidXRlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBWaXNpYmlsaXR5LCBJbnRlcmZhY2UgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgc3RyaW5nUHJpbWl0aXZlVHlwZSwgZG91YmxlUHJpbWl0aXZlVHlwZSwgZmxvYXRQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBQcmludE1hbmFnZXIgfSBmcm9tIFwiLi4vbWFpbi9ndWkvUHJpbnRNYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL0VudW0uanNcIjtcclxuaW1wb3J0IHsgSW50ZXJwcmV0ZXJTdGF0ZSwgSW50ZXJwcmV0ZXIgfSBmcm9tIFwiLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuaW1wb3J0IHsgUHJvZ3JhbSB9IGZyb20gXCIuLi9jb21waWxlci9wYXJzZXIvUHJvZ3JhbS5qc1wiO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBSdW5uYWJsZSBleHRlbmRzIEludGVyZmFjZSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICBzdXBlcihcIlJ1bm5hYmxlXCIsIG1vZHVsZSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJydW5cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICAvLyB7IGlkZW50aWZpZXI6IFwiZGVsdGFUaW1lSW5Nc1wiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiV2lyZCB2b20gVGltZXIgaW1tZXIgd2llZGVyIGF1ZmdlcnVmZW5cIikpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxudHlwZSBUaW1lckVudHJ5ID0ge1xyXG4gICAgdGltZXJMaXN0ZW5lcjogUnVudGltZU9iamVjdCxcclxuICAgIGR0OiBudW1iZXIsXHJcbiAgICBydW5uaW5nOiBib29sZWFuLFxyXG4gICAgbGFzdFRpbWVGaXJlZDogbnVtYmVyLFxyXG4gICAgbWV0aG9kOiBNZXRob2RcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIFRpbWVyQ2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgdGltZXJFbnRyaWVzOiBUaW1lckVudHJ5W10gPSBbXTtcclxuICAgIHRpbWVyUnVubmluZzogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIHRpbWVyU3RhcnRlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcbiAgICAgICAgc3VwZXIoXCJUaW1lclwiLCBtb2R1bGUsIFwiVGltZXIgS2xhc3NlIHp1ciBwZXJpb2Rpc2NoZW4gQXVzZsO8aHJ1bmcgdm9uIE1ldGhvZGVuXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5jbGFzc09iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KHRoaXMuc3RhdGljQ2xhc3MpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVwZWF0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJydW5uYWJsZVwiLCB0eXBlOiBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJSdW5uYWJsZVwiKSxcclxuICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcImRlbHRhVGltZUluTXNcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdGw6IFJ1bnRpbWVPYmplY3QgPSA8UnVudGltZU9iamVjdD5wYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGR0OiBudW1iZXIgPSA8bnVtYmVyPnBhcmFtZXRlcnNbMl0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHRpbWVyRW50cnk6IFRpbWVyRW50cnkgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGltZXJMaXN0ZW5lcjogdGwsXHJcbiAgICAgICAgICAgICAgICAgICAgZHQ6IGR0LFxyXG4gICAgICAgICAgICAgICAgICAgIGxhc3RUaW1lRmlyZWQ6IDAsXHJcbiAgICAgICAgICAgICAgICAgICAgcnVubmluZzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IHRsLmNsYXNzLmdldE1ldGhvZChcInJ1blwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlkZW50aWZpZXI6IFwiZGVsdGFUaW1lSW5Nc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgdHlwZTogaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIGRlY2xhcmF0aW9uOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAgICAgaXNGaW5hbDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gICAgIHVzYWdlUG9zaXRpb25zOiBudWxsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIH1cclxuICAgICAgICAgICAgICAgICAgICBdKSlcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnRpbWVyRW50cmllcy5wdXNoKHRpbWVyRW50cnkpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiVGltZXJMaXN0ZW5lciBhZGRlZCB3aXRoIGR0ID0gXCIgKyBkdCArIFwiIG1zLlwiKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIkbDvGd0IGVpbiBuZXVlcyBUaW1lckxpc3RlbmVyLU9iamVrdCBoaW56dSB1bmQgcnVmdCBkZXNzZW4gdGljay1NZXRob2RlIGltbWVyIHdpZWRlciBhdWYuXCIpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRUaW1lcigpe1xyXG4gICAgICAgIGlmKCF0aGlzLnRpbWVyU3RhcnRlZCl7XHJcbiAgICAgICAgICAgIHRoaXMudGltZXJTdGFydGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5wcm9jZXNzVGltZXJFbnRyaWVzKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICBzdG9wVGltZXIoKXtcclxuICAgICAgICB0aGlzLnRpbWVyU3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NUaW1lckVudHJpZXMoKSB7XHJcblxyXG4gICAgICAgIGlmKCF0aGlzLnRpbWVyU3RhcnRlZCl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnRpbWVyRW50cmllcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGxldCBpbnRlcnByZXRlciA9IHRoaXMubW9kdWxlPy5tYWluPy5nZXRJbnRlcnByZXRlcigpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGludGVycHJldGVyICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICghdGhpcy50aW1lclJ1bm5pbmcgJiYgaW50ZXJwcmV0ZXIuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5ydW5uaW5nKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHQ6IG51bWJlciA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IHRpbWVyZW50cnkgb2YgdGhpcy50aW1lckVudHJpZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGR0ID0gdCAtIHRpbWVyZW50cnkubGFzdFRpbWVGaXJlZDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGR0ID49IHRpbWVyZW50cnkuZHQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucnVuRW50cnkodGltZXJlbnRyeSwgaW50ZXJwcmV0ZXIsIE1hdGgucm91bmQoZHQpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpbWVyZW50cnkubGFzdFRpbWVGaXJlZCA9IHQ7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgc3dpdGNoIChpbnRlcnByZXRlci5zdGF0ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgSW50ZXJwcmV0ZXJTdGF0ZS5kb25lOlxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgSW50ZXJwcmV0ZXJTdGF0ZS5lcnJvcjpcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVyRW50cmllcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnRpbWVyUnVubmluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnByb2Nlc3NUaW1lckVudHJpZXMoKTtcclxuICAgICAgICB9LCAxMCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJ1bkVudHJ5KHRpbWVyZW50cnk6IFRpbWVyRW50cnksIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgZHQ6IG51bWJlcikge1xyXG4gICAgICAgIGxldCBzdGFja0VsZW1lbnRzOiBWYWx1ZVtdID0gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiB0aW1lcmVudHJ5LnRpbWVyTGlzdGVuZXIuY2xhc3MsXHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogdGltZXJlbnRyeS50aW1lckxpc3RlbmVyXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgLy8gICAgIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIC8vICAgICB2YWx1ZTogZHRcclxuICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIHRoaXMudGltZXJSdW5uaW5nID0gdHJ1ZTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGludGVycHJldGVyLnJ1blRpbWVyKHRpbWVyZW50cnkubWV0aG9kLCBzdGFja0VsZW1lbnRzLCAoaW50ZXJwcmV0ZXIpID0+IHtcclxuICAgICAgICAgICAgdGhhdC50aW1lclJ1bm5pbmcgPSBmYWxzZTtcclxuICAgICAgICB9LCBmYWxzZSk7XHJcbiAgICB9XHJcblxyXG59Il19