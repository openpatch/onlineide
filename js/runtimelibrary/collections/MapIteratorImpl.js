import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
export class MapIteratorImplClass extends Klass {
    static getIterator(MapHelper, interpreter, module, kind) {
        let klass = module.typeStore.getType("MapIteratorImpl");
        let rt = new RuntimeObject(klass);
        rt.intrinsicData["MapIteratorHelper"] = new MapIteratorHelper(MapHelper, interpreter, kind);
        return {
            value: rt,
            type: klass
        };
    }
    constructor(module) {
        super("MapIteratorImpl", module);
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
            let ah = o.intrinsicData["MapIteratorHelper"];
            return ah.hasNext();
        }, true, false, "Gibt genau dann true zurück, wenn sich noch mindestens ein weiteres Element in der Collection befindet."));
        this.addMethod(new Method("next", new Parameterlist([]), typeE, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["MapIteratorHelper"];
            return ah.next();
        }, true, false, "Gibt das nächste Element der Collection zurück."));
        this.addMethod(new Method("remove", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["MapIteratorHelper"];
            return ah.remove();
        }, true, false, "Löscht das letzte durch next zurückgegebene Objekt. Diese Methode beeinflusst nicht, welches Element als nächstes durch next zurückgegeben wird."));
    }
}
class MapIteratorHelper {
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
//# sourceMappingURL=MapIteratorImpl.js.map