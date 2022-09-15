import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType, StringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, PrimitiveType } from "../../compiler/types/Types.js";
import { TokenType } from "../../compiler/lexer/Token.js";
import { ListIteratorImplClass } from "./ListIteratorImpl.js";
export class ArrayListClass extends Klass {
    constructor(module) {
        super("ArrayList", module);
        let objectType = module.typeStore.getType("Object");
        this.setBaseClass(objectType);
        let typeA = objectType.clone();
        typeA.identifier = "A";
        typeA.isTypeVariable = true;
        let tvA = {
            identifier: "A",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeA
        };
        this.typeVariables.push(tvA);
        let listInterface = module.typeStore.getType("List").clone();
        listInterface.typeVariables = [tvA];
        this.implements.push(listInterface);
        let iteratorType = module.typeStore.getType("Iterator").clone();
        iteratorType.typeVariables = [tvA];
        this.addMethod(new Method("ArrayList", new Parameterlist([
        // { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = new ListHelper(o, module.main.getInterpreter(), module);
            o.intrinsicData["ListHelper"] = ah;
        }, false, false, 'Instanziert eine neue ArrayList', true));
        this.addMethod(new Method("iterator", new Parameterlist([]), iteratorType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ListIteratorImplClass.getIterator(ah, ah.interpreter, module).value;
        }, true, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));
        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let r = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.add(r);
        }, false, false, "Fügt der Liste ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));
        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeA, (parameters) => {
            let o = parameters[0].value;
            let index = parameters[1].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.get(index).value;
        }, false, false, "Gibt das i-te Element der Liste zurück."));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let index = parameters[1].value;
            let ah = o.intrinsicData["ListHelper"];
            ah.remove(index).value;
            return null;
        }, true, false, "Entfernt das Element an der Stelle index. WICHTIG: Das erste Element hat den Index 0. Es ist 0 <= index < size()"));
        this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.indexOf(object);
        }, true, false, "Gibt den Index des Elements o zurück. Gibt -1 zurück, wenn die Liste das Element o nicht enthält. WICHTIG: Das erste Element hat den Index 0, das letzte den Index size() - 1. "));
        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.adAll(object);
        }, true, false, "Fügt alle Elemente von c dieser Collection hinzu."));
        this.addMethod(new Method("clear", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.clear();
        }, true, false, "Entfernt alle Element aus dieser Collection."));
        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.contains(object);
        }, true, false, "Testet, ob die Collection das Element enthält."));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.removeObject(object);
        }, true, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));
        this.addMethod(new Method("isEmpty", new Parameterlist([]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.isEmpty();
        }, true, false, "Testet, ob die Collection das leer ist."));
        this.addMethod(new Method("size", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.size();
        }, true, false, "Gibt die Anzahl der Elemente der Collection zurück."));
        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.to_String();
        }, false, false));
    }
}
export class ListHelper {
    constructor(runtimeObject, interpreter, module) {
        this.runtimeObject = runtimeObject;
        this.interpreter = interpreter;
        this.module = module;
        this.valueArray = [];
        this.objectArray = []; // wird mitgeführt, um schnelle indexOf-Operationen zu ermöglichen
    }
    allElementsPrimitive() {
        for (let v of this.valueArray) {
            if (!(v.type instanceof PrimitiveType || v.type instanceof String)) {
                return false;
                break;
            }
        }
        return true;
    }
    to_String() {
        if (this.allElementsPrimitive()) {
            return "[" + this.objectArray.map(o => "" + o).join(", ") + "]";
        }
        let position = {
            line: 1,
            column: 1,
            length: 1
        };
        let statements = [
            {
                type: TokenType.noOp,
                position: position,
                stepFinished: false
            },
            {
                type: TokenType.pushConstant,
                dataType: stringPrimitiveType,
                value: "[",
                position: position,
                stepFinished: false
            },
        ];
        let toStringParameters = new Parameterlist([]);
        for (let i = 0; i < this.valueArray.length; i++) {
            let value = this.valueArray[i];
            if (value.type instanceof PrimitiveType || value.type instanceof StringPrimitiveType) {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: stringPrimitiveType,
                    value: value.type.castTo(value, stringPrimitiveType).value,
                    position: position,
                    stepFinished: false
                });
            }
            else {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: value.type,
                    value: value.value,
                    stepFinished: false,
                    position: position
                });
                statements.push({
                    type: TokenType.callMethod,
                    method: value.type.getMethod("toString", toStringParameters),
                    isSuperCall: false,
                    stackframeBegin: -1,
                    stepFinished: false,
                    position: position
                });
            }
            statements.push({
                type: TokenType.binaryOp,
                operator: TokenType.plus,
                stepFinished: false,
                position: position
            });
            if (i < this.valueArray.length - 1) {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: stringPrimitiveType,
                    value: ", ",
                    position: position,
                    stepFinished: false
                });
                statements.push({
                    type: TokenType.binaryOp,
                    operator: TokenType.plus,
                    stepFinished: false,
                    position: position
                });
            }
        }
        statements.push({
            type: TokenType.pushConstant,
            dataType: stringPrimitiveType,
            value: "]",
            position: position,
            stepFinished: false
        });
        statements.push({
            type: TokenType.binaryOp,
            operator: TokenType.plus,
            stepFinished: false,
            position: position
        });
        statements.push({
            type: TokenType.binaryOp,
            operator: TokenType.plus,
            stepFinished: false,
            position: position
        });
        statements.push({
            type: TokenType.return,
            copyReturnValueToStackframePos0: false,
            leaveThisObjectOnStack: true,
            stepFinished: false,
            position: position,
            methodWasInjected: true
        });
        let program = {
            module: this.module,
            statements: statements,
            labelManager: null
        };
        let method = new Method("toString", new Parameterlist([]), stringPrimitiveType, program, false, false);
        this.interpreter.runTimer(method, [], () => console.log("List.toString fertig!"));
        return "";
    }
    adAll(object) {
        let ah = object.intrinsicData["ListHelper"];
        if (ah != null) {
            this.valueArray = this.valueArray.concat(ah.valueArray);
            this.objectArray = this.objectArray.concat(ah.objectArray);
        }
        return true;
    }
    get(index) {
        if (index >= 0 && index < this.valueArray.length) {
            return this.valueArray[index];
        }
        this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ");
        return null;
    }
    remove(index) {
        if (index >= 0 && index < this.valueArray.length) {
            this.valueArray.splice(index, 1);
            this.objectArray.splice(index, 1);
            return null;
        }
        this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ");
        return null;
    }
    add(r) {
        this.valueArray.push(r);
        this.objectArray.push(r.value);
        return true;
    }
    pop() {
        if (this.objectArray.length == 0) {
            this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ");
            return null;
        }
        else {
            this.valueArray.pop();
            return this.objectArray.pop();
        }
    }
    peek() {
        if (this.objectArray.length == 0) {
            this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ");
            return null;
        }
        else {
            return this.objectArray[this.objectArray.length - 1];
        }
    }
    indexOf(o) {
        return this.objectArray.indexOf(o.value);
    }
    size() {
        return this.objectArray.length;
    }
    isEmpty() {
        return this.valueArray.length == 0;
    }
    removeObject(object) {
        let index = this.objectArray.indexOf(object.value);
        if (index >= 0) {
            this.objectArray.splice(index, 1);
            this.valueArray.splice(index, 1);
        }
    }
    contains(object) {
        return this.objectArray.indexOf(object.value) >= 0;
    }
    clear() {
        this.valueArray = [];
        this.objectArray = [];
    }
}
//# sourceMappingURL=ArrayList copy.js.map