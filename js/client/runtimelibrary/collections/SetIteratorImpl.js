import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
export class SetIteratorImplClass extends Klass {
    static getIterator(MapHelper, interpreter, module, kind) {
        let klass = module.typeStore.getType("SetIteratorImpl");
        let rt = new RuntimeObject(klass);
        rt.intrinsicData["SetIteratorHelper"] = new SetIteratorHelper(MapHelper, interpreter, kind);
        return {
            value: rt,
            type: klass
        };
    }
    constructor(module) {
        super("SetIteratorImpl", module);
        let objectType = module.typeStore.getType("Object");
        this.setBaseClass(objectType);
        let typeE = objectType.clone();
        typeE.identifier = "E";
        typeE.isTypeVariable = true;
        let tvE = {
            identifier: "E",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeE
        };
        this.typeVariables.push(tvE);
        let iteratorInterface = module.typeStore.getType("Iterator").clone();
        iteratorInterface.typeVariables = [tvE];
        this.implements.push(iteratorInterface);
        this.addMethod(new Method("hasNext", new Parameterlist([]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["SetIteratorHelper"];
            return ah.hasNext();
        }, false, false, "Gibt genau dann true zurück, wenn sich noch mindestens ein weiteres Element in der Collection befindet."));
        this.addMethod(new Method("next", new Parameterlist([]), typeE, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["SetIteratorHelper"];
            return ah.next();
        }, false, false, "Gibt das nächste Element der Collection zurück."));
        this.addMethod(new Method("remove", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["SetIteratorHelper"];
            return ah.remove();
        }, false, false, "Löscht das letzte durch next zurückgegebene Objekt. Diese Methode beeinflusst nicht, welches Element als nächstes durch next zurückgegeben wird."));
    }
}
class SetIteratorHelper {
    constructor(MapHelper, interpreter, kind) {
        this.MapHelper = MapHelper;
        this.interpreter = interpreter;
        this.kind = kind;
        switch (kind) {
            case "ascending":
                this.nextPos = 0;
                break;
            case "descending":
                this.nextPos = MapHelper.valueArray.length - 1;
                break;
        }
    }
    remove() {
        switch (this.kind) {
            case "ascending":
                if (this.nextPos == 0) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl noch nie next() aufgerufen wurde.");
                }
                else if (this.nextPos > this.MapHelper.valueArray.length - 1) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                }
                else {
                    this.MapHelper.removeObject(this.MapHelper.valueArray[this.nextPos - 1].value);
                    this.nextPos -= 1;
                }
                break;
            case "descending":
                if (this.nextPos == this.MapHelper.valueArray.length - 1) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl noch nie next() aufgerufen wurde.");
                }
                else if (this.nextPos < 0) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                }
                else {
                    this.MapHelper.removeObject(this.MapHelper.valueArray[this.nextPos + 1].value);
                    this.nextPos += 1;
                }
                break;
        }
    }
    next() {
        switch (this.kind) {
            case "ascending":
                if (this.nextPos > this.MapHelper.valueArray.length - 1) {
                    this.interpreter.throwException("Die Methode next() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                    return null;
                }
                return this.MapHelper.valueArray[this.nextPos++];
            case "descending":
                if (this.nextPos < 0) {
                    this.interpreter.throwException("Die Methode next() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                    return null;
                }
                return this.MapHelper.valueArray[this.nextPos--];
        }
    }
    hasNext() {
        switch (this.kind) {
            case "ascending":
                return this.nextPos < this.MapHelper.valueArray.length;
            case "descending":
                return this.nextPos >= 0;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0SXRlcmF0b3JJbXBsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9TZXRJdGVyYXRvckltcGwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFhLEtBQUssRUFBZ0IsTUFBTSwrQkFBK0IsQ0FBQztBQUMvRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUM5RSxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLCtCQUErQixDQUFDO0FBRTdFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUtuRSxNQUFNLE9BQU8sb0JBQXFCLFNBQVEsS0FBSztJQUVwQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQW9CLEVBQUUsV0FBd0IsRUFBRSxNQUFjLEVBQUUsSUFBa0I7UUFFeEcsSUFBSSxLQUFLLEdBQVUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUMvRCxJQUFJLEVBQUUsR0FBa0IsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDakQsRUFBRSxDQUFDLGFBQWEsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLElBQUksaUJBQWlCLENBQUMsU0FBUyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RixPQUFPO1lBQ0gsS0FBSyxFQUFFLEVBQUU7WUFDVCxJQUFJLEVBQUUsS0FBSztTQUNkLENBQUE7SUFDTCxDQUFDO0lBRUQsWUFBWSxNQUFjO1FBRXRCLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVqQyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVwRCxJQUFJLENBQUMsWUFBWSxDQUFRLFVBQVUsQ0FBQyxDQUFDO1FB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cGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcmZhY2UsIEtsYXNzLCBUeXBlVmFyaWFibGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgYm9vbGVhblByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuaW1wb3J0IHsgU2V0SGVscGVyIH0gZnJvbSBcIi4vU2V0SGVscGVyLmpzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBJdGVyYXRvcktpbmQgPSBcImRlc2NlbmRpbmdcIiB8IFwiYXNjZW5kaW5nXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgU2V0SXRlcmF0b3JJbXBsQ2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBnZXRJdGVyYXRvcihNYXBIZWxwZXI6IFNldEhlbHBlciwgaW50ZXJwcmV0ZXI6IEludGVycHJldGVyLCBtb2R1bGU6IE1vZHVsZSwga2luZDogSXRlcmF0b3JLaW5kKTogVmFsdWUge1xyXG5cclxuICAgICAgICBsZXQga2xhc3MgPSA8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiU2V0SXRlcmF0b3JJbXBsXCIpO1xyXG4gICAgICAgIGxldCBydDogUnVudGltZU9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KGtsYXNzKTtcclxuICAgICAgICBydC5pbnRyaW5zaWNEYXRhW1wiU2V0SXRlcmF0b3JIZWxwZXJcIl0gPSBuZXcgU2V0SXRlcmF0b3JIZWxwZXIoTWFwSGVscGVyLCBpbnRlcnByZXRlciwga2luZCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBydCxcclxuICAgICAgICAgICAgdHlwZToga2xhc3NcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoXCJTZXRJdGVyYXRvckltcGxcIiwgbW9kdWxlKTtcclxuXHJcbiAgICAgICAgbGV0IG9iamVjdFR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJPYmplY3RcIik7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0QmFzZUNsYXNzKDxLbGFzcz5vYmplY3RUeXBlKTtcclxuXHJcbiAgICAgICAgbGV0IHR5cGVFOiBLbGFzcyA9ICg8S2xhc3M+b2JqZWN0VHlwZSkuY2xvbmUoKTtcclxuICAgICAgICB0eXBlRS5pZGVudGlmaWVyID0gXCJFXCI7XHJcbiAgICAgICAgdHlwZUUuaXNUeXBlVmFyaWFibGUgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgdHZFOiBUeXBlVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiRVwiLFxyXG4gICAgICAgICAgICBzY29wZUZyb206IHsgbGluZTogMSwgY29sdW1uOiAxLCBsZW5ndGg6IDEgfSxcclxuICAgICAgICAgICAgc2NvcGVUbzogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgICAgICB0eXBlOiB0eXBlRVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudHlwZVZhcmlhYmxlcy5wdXNoKHR2RSk7XHJcblxyXG4gICAgICAgIGxldCBpdGVyYXRvckludGVyZmFjZSA9ICg8SW50ZXJmYWNlPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIkl0ZXJhdG9yXCIpKS5jbG9uZSgpO1xyXG4gICAgICAgIGl0ZXJhdG9ySW50ZXJmYWNlLnR5cGVWYXJpYWJsZXMgPSBbdHZFXTtcclxuXHJcbiAgICAgICAgdGhpcy5pbXBsZW1lbnRzLnB1c2goaXRlcmF0b3JJbnRlcmZhY2UpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaGFzTmV4dFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogU2V0SXRlcmF0b3JIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJTZXRJdGVyYXRvckhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguaGFzTmV4dCgpO1xyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIkdpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gc2ljaCBub2NoIG1pbmRlc3RlbnMgZWluIHdlaXRlcmVzIEVsZW1lbnQgaW4gZGVyIENvbGxlY3Rpb24gYmVmaW5kZXQuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIm5leHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCB0eXBlRSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IFNldEl0ZXJhdG9ySGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiU2V0SXRlcmF0b3JIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLm5leHQoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJHaWJ0IGRhcyBuw6RjaHN0ZSBFbGVtZW50IGRlciBDb2xsZWN0aW9uIHp1csO8Y2suXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJlbW92ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBTZXRJdGVyYXRvckhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIlNldEl0ZXJhdG9ySGVscGVyXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhaC5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJMw7ZzY2h0IGRhcyBsZXR6dGUgZHVyY2ggbmV4dCB6dXLDvGNrZ2VnZWJlbmUgT2JqZWt0LiBEaWVzZSBNZXRob2RlIGJlZWluZmx1c3N0IG5pY2h0LCB3ZWxjaGVzIEVsZW1lbnQgYWxzIG7DpGNoc3RlcyBkdXJjaCBuZXh0IHp1csO8Y2tnZWdlYmVuIHdpcmQuXCIpKTtcclxuXHJcblxyXG5cclxuICAgIH1cclxufVxyXG5cclxuY2xhc3MgU2V0SXRlcmF0b3JIZWxwZXIge1xyXG5cclxuICAgIG5leHRQb3M6IG51bWJlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIE1hcEhlbHBlcjogU2V0SGVscGVyLCBwcml2YXRlIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcHJpdmF0ZSBraW5kOiBJdGVyYXRvcktpbmQpIHtcclxuICAgICAgICBzd2l0Y2ggKGtpbmQpIHtcclxuICAgICAgICAgICAgY2FzZSBcImFzY2VuZGluZ1wiOiB0aGlzLm5leHRQb3MgPSAwOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjogdGhpcy5uZXh0UG9zID0gTWFwSGVscGVyLnZhbHVlQXJyYXkubGVuZ3RoIC0gMTsgYnJlYWs7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSgpIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMua2luZCkge1xyXG4gICAgICAgICAgICBjYXNlIFwiYXNjZW5kaW5nXCI6XHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5uZXh0UG9zID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIE1ldGhvZGUgcmVtb3ZlKCkgZGVzIEl0ZXJhdG9ycyB3dXJkZSBhdWZnZXJ1ZmVuLCBvYndvaGwgbm9jaCBuaWUgbmV4dCgpIGF1ZmdlcnVmZW4gd3VyZGUuXCIpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubmV4dFBvcyA+IHRoaXMuTWFwSGVscGVyLnZhbHVlQXJyYXkubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJEaWUgTWV0aG9kZSByZW1vdmUoKSBkZXMgSXRlcmF0b3JzIHd1cmRlIGF1ZmdlcnVmZW4sIG9id29obCBkYXMgbGV0enRlIEVsZW1lbnQgc2Nob24gYmVpbSB2b3JoZXJpZ2VuIEF1ZnJ1ZiB6dXLDvGNrZ2VnZWJlbiB3b3JkZW4gd2FyLlwiKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLk1hcEhlbHBlci5yZW1vdmVPYmplY3QodGhpcy5NYXBIZWxwZXIudmFsdWVBcnJheVt0aGlzLm5leHRQb3MgLSAxXS52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0UG9zIC09IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRQb3MgPT0gdGhpcy5NYXBIZWxwZXIudmFsdWVBcnJheS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkRpZSBNZXRob2RlIHJlbW92ZSgpIGRlcyBJdGVyYXRvcnMgd3VyZGUgYXVmZ2VydWZlbiwgb2J3b2hsIG5vY2ggbmllIG5leHQoKSBhdWZnZXJ1ZmVuIHd1cmRlLlwiKVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLm5leHRQb3MgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkRpZSBNZXRob2RlIHJlbW92ZSgpIGRlcyBJdGVyYXRvcnMgd3VyZGUgYXVmZ2VydWZlbiwgb2J3b2hsIGRhcyBsZXR6dGUgRWxlbWVudCBzY2hvbiBiZWltIHZvcmhlcmlnZW4gQXVmcnVmIHp1csO8Y2tnZWdlYmVuIHdvcmRlbiB3YXIuXCIpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuTWFwSGVscGVyLnJlbW92ZU9iamVjdCh0aGlzLk1hcEhlbHBlci52YWx1ZUFycmF5W3RoaXMubmV4dFBvcyArIDFdLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLm5leHRQb3MgKz0gMTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBuZXh0KCk6IGFueSB7XHJcbiAgICAgICAgc3dpdGNoICh0aGlzLmtpbmQpIHtcclxuICAgICAgICAgICAgY2FzZSBcImFzY2VuZGluZ1wiOlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dFBvcyA+IHRoaXMuTWFwSGVscGVyLnZhbHVlQXJyYXkubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJEaWUgTWV0aG9kZSBuZXh0KCkgZGVzIEl0ZXJhdG9ycyB3dXJkZSBhdWZnZXJ1ZmVuLCBvYndvaGwgZGFzIGxldHp0ZSBFbGVtZW50IHNjaG9uIGJlaW0gdm9yaGVyaWdlbiBBdWZydWYgenVyw7xja2dlZ2ViZW4gd29yZGVuIHdhci5cIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLk1hcEhlbHBlci52YWx1ZUFycmF5W3RoaXMubmV4dFBvcysrXTtcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRQb3MgPCAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkRpZSBNZXRob2RlIG5leHQoKSBkZXMgSXRlcmF0b3JzIHd1cmRlIGF1ZmdlcnVmZW4sIG9id29obCBkYXMgbGV0enRlIEVsZW1lbnQgc2Nob24gYmVpbSB2b3JoZXJpZ2VuIEF1ZnJ1ZiB6dXLDvGNrZ2VnZWJlbiB3b3JkZW4gd2FyLlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuTWFwSGVscGVyLnZhbHVlQXJyYXlbdGhpcy5uZXh0UG9zLS1dO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBoYXNOZXh0KCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5raW5kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJhc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRQb3MgPCB0aGlzLk1hcEhlbHBlci52YWx1ZUFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRQb3MgPj0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn0iXX0=