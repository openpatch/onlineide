import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType, StringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, PrimitiveType } from "../../compiler/types/Types.js";
import { TokenType } from "../../compiler/lexer/Token.js";
import { ListIteratorImplClass } from "./ListIteratorImpl.js";
export class ArrayListClass extends Klass {
    constructor(module) {
        super("ArrayList", module, "Liste mit Zugriff auf das n-te Objekt in konstanter Zeit, Einfügen in konstanter Zeit und Suchen in linearer Zeit");
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
            return ListIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;
        }, true, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));
        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let r = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.add(r);
        }, false, false, "Fügt der Liste ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));
        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "element", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let index = parameters[1].value;
            let r = parameters[2];
            let ah = o.intrinsicData["ListHelper"];
            return ah.add(r, index);
        }, false, false, "Ändert das Element an der Position index der Liste. Tipp: Das erste Element der Liste hat index == 0."));
        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeA, (parameters) => {
            var _a;
            let o = parameters[0].value;
            let index = parameters[1].value;
            let ah = o.intrinsicData["ListHelper"];
            return (_a = ah.get(index)) === null || _a === void 0 ? void 0 : _a.value;
        }, false, false, "Gibt das i-te Element der Liste zurück."));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let index = parameters[1].value;
            let ah = o.intrinsicData["ListHelper"];
            ah.remove(index);
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
            if (!(v.type instanceof PrimitiveType || ["String", "_Double", "Integer", "Boolean", "Character"].indexOf(v.type.identifier) >= 0)) {
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
            if (value.value == null || value.type instanceof PrimitiveType || value.type instanceof StringPrimitiveType) {
                statements.push({
                    type: TokenType.pushConstant,
                    dataType: stringPrimitiveType,
                    value: value.value == null ? "null" : value.type.castTo(value, stringPrimitiveType).value,
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
                leftType: stringPrimitiveType,
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
                    leftType: stringPrimitiveType,
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
            leftType: stringPrimitiveType,
            stepFinished: false,
            position: position
        });
        // statements.push({
        //     type: TokenType.binaryOp,
        //     operator: TokenType.plus,
        //     leftType: stringPrimitiveType,
        //     stepFinished: false,
        //     position: position
        // });
        statements.push({
            type: TokenType.return,
            copyReturnValueToStackframePos0: true,
            leaveThisObjectOnStack: false,
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
        this.interpreter.runTimer(method, [], () => { }, true);
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
    add(r, index) {
        if (index == null) {
            this.valueArray.push(r);
            this.objectArray.push(r.value);
        }
        else {
            if (index < this.objectArray.length && index >= 0) {
                this.valueArray[index] = r;
                this.objectArray[index] = r.value;
            }
            else {
                this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ");
            }
        }
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
    peek_last_or_null() {
        if (this.objectArray.length == 0) {
            return null;
        }
        else {
            return this.objectArray[this.objectArray.length - 1];
        }
    }
    peek_first_or_null() {
        if (this.objectArray.length == 0) {
            return null;
        }
        else {
            return this.objectArray[0];
        }
    }
    removeLast_or_error() {
        if (this.objectArray.length == 0) {
            return null;
        }
        else {
            this.valueArray.pop();
            return this.objectArray.pop();
        }
    }
    ;
    addLast(object) {
        this.valueArray.push(object);
        this.objectArray.push(object.value);
        return true;
    }
    addFirst(object) {
        this.valueArray.splice(0, 0, object);
        this.objectArray.splice(0, 0, object.value);
        return true;
    }
    removeFirstOccurrence(object) {
        let index = this.objectArray.indexOf(object.value);
        if (index >= 0) {
            this.valueArray.splice(index, 1);
            this.objectArray.splice(index, 1);
            return true;
        }
        return false;
    }
    peek_or_null() {
        if (this.objectArray.length == 0) {
            return null;
        }
        else {
            return this.objectArray[this.objectArray.length - 1];
        }
    }
    poll_or_null() {
        if (this.objectArray.length == 0) {
            return null;
        }
        else {
            this.valueArray.pop();
            return this.objectArray.pop();
        }
    }
    removeFirst_or_error() {
        if (this.objectArray.length == 0) {
            this.interpreter.throwException("Der ArrayList-Index ist außerhalb des Intervalls von 0 bis " + (this.valueArray.length - 1) + ". ");
        }
        else {
            let object = this.objectArray[0];
            this.objectArray.splice(0, 1);
            this.valueArray.splice(0, 1);
            return object;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXJyYXlMaXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9BcnJheUxpc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFhLEtBQUssRUFBZ0IsTUFBTSwrQkFBK0IsQ0FBQztBQUMvRSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsbUJBQW1CLEVBQWMsbUJBQW1CLEVBQWMsTUFBTSx3Q0FBd0MsQ0FBQztBQUNsSyxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBUyxhQUFhLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUk1RixPQUFPLEVBQUUsU0FBUyxFQUFnQixNQUFNLCtCQUErQixDQUFDO0FBRXhFLE9BQU8sRUFBRSxxQkFBcUIsRUFBRSxNQUFNLHVCQUF1QixDQUFDO0FBRzlELE1BQU0sT0FBTyxjQUFlLFNBQVEsS0FBSztJQUVyQyxZQUFZLE1BQWM7UUFFdEIsS0FBSyxDQUFDLFdBQVcsRUFBRSxNQUFNLEVBQUUsbUhBQW1ILENBQUMsQ0FBQztRQUVoSixJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVwRCxJQUFJLENBQUMsWUFBWSxDQUFRLFVBQVUsQ0FBQyxDQUFDO1FBRXJDLElBQUksS0FBSyxHQUFrQixVQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7UUFDdkIsS0FBSyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFFNUIsSUFBSSxHQUFHLEdBQWlCO1lBQ3BCLFVBQVUsRUFBRSxHQUFHO1lBQ2YsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFDNUMsT0FBTyxFQUFFLEVBQUUs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RyxDQUFDLENBQUMsQ0FBQztTQUN4RDtJQUNMLENBQUM7SUFFRCxZQUFZO1FBQ1IsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUU7WUFDOUIsT0FBTyxJQUFJLENBQUM7U0FDZjthQUFNO1lBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztZQUN0QixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDakM7SUFDTCxDQUFDO0lBRUQsb0JBQW9CO1FBQ2hCLElBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFDO1lBQzVCLElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLDZEQUE2RCxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUE7U0FDdkk7YUFBTTtZQUNILElBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDakMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzlCLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztZQUM3QixPQUFPLE1BQU0sQ0FBQztTQUNqQjtJQUNMLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IEludGVyZmFjZSwgS2xhc3MsIFR5cGVWYXJpYWJsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBib29sZWFuUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZSwgb2JqZWN0VHlwZSwgU3RyaW5nUHJpbWl0aXZlVHlwZSwgRG91YmxlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlLCBQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtLCBTdGF0ZW1lbnQgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL1Byb2dyYW0uanNcIjtcclxuaW1wb3J0IHsgVG9rZW5UeXBlLCBUZXh0UG9zaXRpb24gfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0FycmF5LmpzXCI7XHJcbmltcG9ydCB7IExpc3RJdGVyYXRvckltcGxDbGFzcyB9IGZyb20gXCIuL0xpc3RJdGVyYXRvckltcGwuanNcIjtcclxuaW1wb3J0IHsgRW51bSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9FbnVtLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQXJyYXlMaXN0Q2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoXCJBcnJheUxpc3RcIiwgbW9kdWxlLCBcIkxpc3RlIG1pdCBadWdyaWZmIGF1ZiBkYXMgbi10ZSBPYmpla3QgaW4ga29uc3RhbnRlciBaZWl0LCBFaW5mw7xnZW4gaW4ga29uc3RhbnRlciBaZWl0IHVuZCBTdWNoZW4gaW4gbGluZWFyZXIgWmVpdFwiKTtcclxuXHJcbiAgICAgICAgbGV0IG9iamVjdFR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJPYmplY3RcIik7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0QmFzZUNsYXNzKDxLbGFzcz5vYmplY3RUeXBlKTtcclxuXHJcbiAgICAgICAgbGV0IHR5cGVBOiBLbGFzcyA9ICg8S2xhc3M+b2JqZWN0VHlwZSkuY2xvbmUoKTtcclxuICAgICAgICB0eXBlQS5pZGVudGlmaWVyID0gXCJBXCI7XHJcbiAgICAgICAgdHlwZUEuaXNUeXBlVmFyaWFibGUgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgdHZBOiBUeXBlVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiQVwiLFxyXG4gICAgICAgICAgICBzY29wZUZyb206IHsgbGluZTogMSwgY29sdW1uOiAxLCBsZW5ndGg6IDEgfSxcclxuICAgICAgICAgICAgc2NvcGVUbzogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgICAgICB0eXBlOiB0eXBlQVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudHlwZVZhcmlhYmxlcy5wdXNoKHR2QSk7XHJcblxyXG4gICAgICAgIGxldCBsaXN0SW50ZXJmYWNlID0gKDxJbnRlcmZhY2U+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiTGlzdFwiKSkuY2xvbmUoKTtcclxuICAgICAgICBsaXN0SW50ZXJmYWNlLnR5cGVWYXJpYWJsZXMgPSBbdHZBXTtcclxuXHJcbiAgICAgICAgdGhpcy5pbXBsZW1lbnRzLnB1c2gobGlzdEludGVyZmFjZSk7XHJcblxyXG4gICAgICAgIGxldCBpdGVyYXRvclR5cGUgPSAoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIkl0ZXJhdG9yXCIpKS5jbG9uZSgpO1xyXG4gICAgICAgIGl0ZXJhdG9yVHlwZS50eXBlVmFyaWFibGVzID0gW3R2QV07XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJBcnJheUxpc3RcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICAvLyB7IGlkZW50aWZpZXI6IFwibXhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhaCA9IG5ldyBMaXN0SGVscGVyKG8sIG1vZHVsZS5tYWluLmdldEludGVycHJldGVyKCksIG1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJMaXN0SGVscGVyXCJdID0gYWg7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdJbnN0YW56aWVydCBlaW5lIG5ldWUgQXJyYXlMaXN0JywgdHJ1ZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXRlcmF0b3JcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpdGVyYXRvclR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTGlzdEl0ZXJhdG9ySW1wbENsYXNzLmdldEl0ZXJhdG9yKGFoLCBhaC5pbnRlcnByZXRlciwgbW9kdWxlLCBcImFzY2VuZGluZ1wiKS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIH0sIHRydWUsIGZhbHNlLCBcIkdpYnQgZWluZW4gSXRlcmF0b3Igw7xiZXIgZGllIEVsZW1lbnRlIGRpZXNlciBDb2xsZWN0aW9uIHp1csO8Y2suXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImFkZFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJlbGVtZW50XCIsIHR5cGU6IHR5cGVBLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgcjogVmFsdWUgPSBwYXJhbWV0ZXJzWzFdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguYWRkKHIpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIkbDvGd0IGRlciBMaXN0ZSBlaW4gRWxlbWVudCBoaW56dS4gR2lidCBnZW5hdSBkYW5uIHRydWUgenVyw7xjaywgd2VubiBzaWNoIGRlciBadXN0YW5kIGRlciBMaXN0ZSBkYWR1cmNoIGdlw6RuZGVydCBoYXQuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImFkZFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJpbmRleFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImVsZW1lbnRcIiwgdHlwZTogdHlwZUEsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCByOiBWYWx1ZSA9IHBhcmFtZXRlcnNbMl07XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IExpc3RIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJMaXN0SGVscGVyXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhaC5hZGQociwgaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIsOEbmRlcnQgZGFzIEVsZW1lbnQgYW4gZGVyIFBvc2l0aW9uIGluZGV4IGRlciBMaXN0ZS4gVGlwcDogRGFzIGVyc3RlIEVsZW1lbnQgZGVyIExpc3RlIGhhdCBpbmRleCA9PSAwLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJnZXRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaW5kZXhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgdHlwZUEsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmdldChpbmRleCk/LnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIkdpYnQgZGFzIGktdGUgRWxlbWVudCBkZXIgTGlzdGUgenVyw7xjay5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVtb3ZlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImluZGV4XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBhaC5yZW1vdmUoaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICAgICAgfSwgdHJ1ZSwgZmFsc2UsIFwiRW50ZmVybnQgZGFzIEVsZW1lbnQgYW4gZGVyIFN0ZWxsZSBpbmRleC4gV0lDSFRJRzogRGFzIGVyc3RlIEVsZW1lbnQgaGF0IGRlbiBJbmRleCAwLiBFcyBpc3QgMCA8PSBpbmRleCA8IHNpemUoKVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJpbmRleE9mXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIm9cIiwgdHlwZTogdHlwZUEsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdDogVmFsdWUgPSBwYXJhbWV0ZXJzWzFdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguaW5kZXhPZihvYmplY3QpO1xyXG5cclxuICAgICAgICAgICAgfSwgdHJ1ZSwgZmFsc2UsIFwiR2lidCBkZW4gSW5kZXggZGVzIEVsZW1lbnRzIG8genVyw7xjay4gR2lidCAtMSB6dXLDvGNrLCB3ZW5uIGRpZSBMaXN0ZSBkYXMgRWxlbWVudCBvIG5pY2h0IGVudGjDpGx0LiBXSUNIVElHOiBEYXMgZXJzdGUgRWxlbWVudCBoYXQgZGVuIEluZGV4IDAsIGRhcyBsZXR6dGUgZGVuIEluZGV4IHNpemUoKSAtIDEuIFwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRBbGxcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY1wiLCB0eXBlOiB0aGlzLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0OiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmFkQWxsKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJGw7xndCBhbGxlIEVsZW1lbnRlIHZvbiBjIGRpZXNlciBDb2xsZWN0aW9uIGhpbnp1LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJjbGVhclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRydWUsIGZhbHNlLCBcIkVudGZlcm50IGFsbGUgRWxlbWVudCBhdXMgZGllc2VyIENvbGxlY3Rpb24uXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImNvbnRhaW5zXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIm9cIiwgdHlwZTogdHlwZUEsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBvYmplY3Q6IFZhbHVlID0gcGFyYW1ldGVyc1sxXTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmNvbnRhaW5zKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJUZXN0ZXQsIG9iIGRpZSBDb2xsZWN0aW9uIGRhcyBFbGVtZW50IGVudGjDpGx0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZW1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwib1wiLCB0eXBlOiB0eXBlQSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdDogVmFsdWUgPSBwYXJhbWV0ZXJzWzFdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWgucmVtb3ZlT2JqZWN0KG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJFbnRmZXJudCBkYXMgRWxlbWVudCBvIGF1cyBkZXIgQ29sbGVjdGlvbi4gR2lidCB0cnVlIHp1csO8Y2ssIHdlbm4gZGllIENvbGxlY3Rpb24gZGFzIEVsZW1lbnQgZW50aGFsdGVuIGhhdHRlLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJpc0VtcHR5XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguaXNFbXB0eSgpO1xyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiVGVzdGV0LCBvYiBkaWUgQ29sbGVjdGlvbiBkYXMgbGVlciBpc3QuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNpemVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLnNpemUoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHRydWUsIGZhbHNlLCBcIkdpYnQgZGllIEFuemFobCBkZXIgRWxlbWVudGUgZGVyIENvbGxlY3Rpb24genVyw7xjay5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwidG9TdHJpbmdcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW10pLCBzdHJpbmdQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLnRvX1N0cmluZygpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlKSk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIExpc3RIZWxwZXIge1xyXG5cclxuICAgIHZhbHVlQXJyYXk6IFZhbHVlW10gPSBbXTtcclxuICAgIG9iamVjdEFycmF5OiBhbnlbXSA9IFtdOyAvLyB3aXJkIG1pdGdlZsO8aHJ0LCB1bSBzY2huZWxsZSBpbmRleE9mLU9wZXJhdGlvbmVuIHp1IGVybcO2Z2xpY2hlblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCwgcHVibGljIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcHJpdmF0ZSBtb2R1bGU6IE1vZHVsZSkge1xyXG4gICAgfVxyXG5cclxuICAgIGFsbEVsZW1lbnRzUHJpbWl0aXZlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGZvciAobGV0IHYgb2YgdGhpcy52YWx1ZUFycmF5KSB7XHJcbiAgICAgICAgICAgIGlmICghKHYudHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUgfHwgW1wiU3RyaW5nXCIsIFwiX0RvdWJsZVwiLCBcIkludGVnZXJcIiwgXCJCb29sZWFuXCIgLFwiQ2hhcmFjdGVyXCJdLmluZGV4T2Yodi50eXBlLmlkZW50aWZpZXIpID49IDApKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICB0b19TdHJpbmcoKTogYW55IHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuYWxsRWxlbWVudHNQcmltaXRpdmUoKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJbXCIgKyB0aGlzLm9iamVjdEFycmF5Lm1hcChvID0+IFwiXCIgKyBvKS5qb2luKFwiLCBcIikgKyBcIl1cIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwb3NpdGlvbjogVGV4dFBvc2l0aW9uID0ge1xyXG4gICAgICAgICAgICBsaW5lOiAxLFxyXG4gICAgICAgICAgICBjb2x1bW46IDEsXHJcbiAgICAgICAgICAgIGxlbmd0aDogMVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN0YXRlbWVudHM6IFN0YXRlbWVudFtdID0gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUubm9PcCxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgIHN0ZXBGaW5pc2hlZDogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hDb25zdGFudCxcclxuICAgICAgICAgICAgICAgIGRhdGFUeXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgdmFsdWU6IFwiW1wiLFxyXG4gICAgICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF07XHJcblxyXG4gICAgICAgIGxldCB0b1N0cmluZ1BhcmFtZXRlcnMgPSBuZXcgUGFyYW1ldGVybGlzdChbXSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy52YWx1ZUFycmF5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IHRoaXMudmFsdWVBcnJheVtpXTtcclxuICAgICAgICAgICAgaWYgKHZhbHVlLnZhbHVlID09IG51bGwgfHwgdmFsdWUudHlwZSBpbnN0YW5jZW9mIFByaW1pdGl2ZVR5cGUgfHwgdmFsdWUudHlwZSBpbnN0YW5jZW9mIFN0cmluZ1ByaW1pdGl2ZVR5cGUpIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hDb25zdGFudCxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUudmFsdWUgPT0gbnVsbCA/IFwibnVsbFwiIDogdmFsdWUudHlwZS5jYXN0VG8odmFsdWUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUpLnZhbHVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hDb25zdGFudCxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogdmFsdWUudHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdmFsdWUudmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUuY2FsbE1ldGhvZCxcclxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICg8S2xhc3MgfCBJbnRlcmZhY2UgfCBFbnVtPnZhbHVlLnR5cGUpLmdldE1ldGhvZChcInRvU3RyaW5nXCIsIHRvU3RyaW5nUGFyYW1ldGVycyksXHJcbiAgICAgICAgICAgICAgICAgICAgaXNTdXBlckNhbGw6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrZnJhbWVCZWdpbjogLTEsXHJcbiAgICAgICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb25cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5iaW5hcnlPcCxcclxuICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBUb2tlblR5cGUucGx1cyxcclxuICAgICAgICAgICAgICAgIGxlZnRUeXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGlmIChpIDwgdGhpcy52YWx1ZUFycmF5Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hDb25zdGFudCxcclxuICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogXCIsIFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLmJpbmFyeU9wLFxyXG4gICAgICAgICAgICAgICAgICAgIG9wZXJhdG9yOiBUb2tlblR5cGUucGx1cyxcclxuICAgICAgICAgICAgICAgICAgICBsZWZ0VHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBwb3NpdGlvblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3RhdGVtZW50cy5wdXNoKHtcclxuICAgICAgICAgICAgdHlwZTogVG9rZW5UeXBlLnB1c2hDb25zdGFudCxcclxuICAgICAgICAgICAgZGF0YVR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIHZhbHVlOiBcIl1cIixcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5iaW5hcnlPcCxcclxuICAgICAgICAgICAgb3BlcmF0b3I6IFRva2VuVHlwZS5wbHVzLFxyXG4gICAgICAgICAgICBsZWZ0VHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAgICAgcG9zaXRpb246IHBvc2l0aW9uXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgLy8gICAgIHR5cGU6IFRva2VuVHlwZS5iaW5hcnlPcCxcclxuICAgICAgICAvLyAgICAgb3BlcmF0b3I6IFRva2VuVHlwZS5wbHVzLFxyXG4gICAgICAgIC8vICAgICBsZWZ0VHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAvLyAgICAgc3RlcEZpbmlzaGVkOiBmYWxzZSxcclxuICAgICAgICAvLyAgICAgcG9zaXRpb246IHBvc2l0aW9uXHJcbiAgICAgICAgLy8gfSk7XHJcblxyXG4gICAgICAgIHN0YXRlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgIHR5cGU6IFRva2VuVHlwZS5yZXR1cm4sXHJcbiAgICAgICAgICAgIGNvcHlSZXR1cm5WYWx1ZVRvU3RhY2tmcmFtZVBvczA6IHRydWUsXHJcbiAgICAgICAgICAgIGxlYXZlVGhpc09iamVjdE9uU3RhY2s6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdGVwRmluaXNoZWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBwb3NpdGlvbjogcG9zaXRpb24sXHJcbiAgICAgICAgICAgIG1ldGhvZFdhc0luamVjdGVkOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBwcm9ncmFtOiBQcm9ncmFtID0ge1xyXG4gICAgICAgICAgICBtb2R1bGU6IHRoaXMubW9kdWxlLFxyXG4gICAgICAgICAgICBzdGF0ZW1lbnRzOiBzdGF0ZW1lbnRzLFxyXG4gICAgICAgICAgICBsYWJlbE1hbmFnZXI6IG51bGxcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtZXRob2Q6IE1ldGhvZCA9IG5ldyBNZXRob2QoXCJ0b1N0cmluZ1wiLCBuZXcgUGFyYW1ldGVybGlzdChbXSksIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIHByb2dyYW0sIGZhbHNlLCBmYWxzZSk7XHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci5ydW5UaW1lcihtZXRob2QsIFtdLCAoKSA9PiB7fSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBcIlwiO1xyXG4gICAgfVxyXG5cclxuICAgIGFkQWxsKG9iamVjdDogUnVudGltZU9iamVjdCk6IGJvb2xlYW4ge1xyXG5cclxuICAgICAgICBsZXQgYWg6IExpc3RIZWxwZXIgPSBvYmplY3QuaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcbiAgICAgICAgaWYgKGFoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZUFycmF5ID0gdGhpcy52YWx1ZUFycmF5LmNvbmNhdChhaC52YWx1ZUFycmF5KTtcclxuICAgICAgICAgICAgdGhpcy5vYmplY3RBcnJheSA9IHRoaXMub2JqZWN0QXJyYXkuY29uY2F0KGFoLm9iamVjdEFycmF5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXQoaW5kZXg6IG51bWJlcik6IFZhbHVlIHtcclxuICAgICAgICBpZiAoaW5kZXggPj0gMCAmJiBpbmRleCA8IHRoaXMudmFsdWVBcnJheS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVBcnJheVtpbmRleF07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJEZXIgQXJyYXlMaXN0LUluZGV4IGlzdCBhdcOfZXJoYWxiIGRlcyBJbnRlcnZhbGxzIHZvbiAwIGJpcyBcIiArICh0aGlzLnZhbHVlQXJyYXkubGVuZ3RoIC0gMSkgKyBcIi4gXCIpXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKGluZGV4OiBudW1iZXIpOiBWYWx1ZSB7XHJcblxyXG4gICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy52YWx1ZUFycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlQXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgdGhpcy5vYmplY3RBcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJEZXIgQXJyYXlMaXN0LUluZGV4IGlzdCBhdcOfZXJoYWxiIGRlcyBJbnRlcnZhbGxzIHZvbiAwIGJpcyBcIiArICh0aGlzLnZhbHVlQXJyYXkubGVuZ3RoIC0gMSkgKyBcIi4gXCIpXHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZChyOiBWYWx1ZSwgaW5kZXg/KTogYm9vbGVhbiB7XHJcbiAgICAgICAgaWYoaW5kZXggPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVBcnJheS5wdXNoKHIpO1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdEFycmF5LnB1c2goci52YWx1ZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYoaW5kZXggPCB0aGlzLm9iamVjdEFycmF5Lmxlbmd0aCAmJiBpbmRleCA+PSAwKXtcclxuICAgICAgICAgICAgICAgIHRoaXMudmFsdWVBcnJheVtpbmRleF0gPSByO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vYmplY3RBcnJheVtpbmRleF0gPSByLnZhbHVlO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkRlciBBcnJheUxpc3QtSW5kZXggaXN0IGF1w59lcmhhbGIgZGVzIEludGVydmFsbHMgdm9uIDAgYmlzIFwiICsgKHRoaXMudmFsdWVBcnJheS5sZW5ndGggLSAxKSArIFwiLiBcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwb3AoKTogYW55IHtcclxuICAgICAgICBpZiAodGhpcy5vYmplY3RBcnJheS5sZW5ndGggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGVyIEFycmF5TGlzdC1JbmRleCBpc3QgYXXDn2VyaGFsYiBkZXMgSW50ZXJ2YWxscyB2b24gMCBiaXMgXCIgKyAodGhpcy52YWx1ZUFycmF5Lmxlbmd0aCAtIDEpICsgXCIuIFwiKVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnZhbHVlQXJyYXkucG9wKCk7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9iamVjdEFycmF5LnBvcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwZWVrKCk6IGFueSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2JqZWN0QXJyYXkubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkRlciBBcnJheUxpc3QtSW5kZXggaXN0IGF1w59lcmhhbGIgZGVzIEludGVydmFsbHMgdm9uIDAgYmlzIFwiICsgKHRoaXMudmFsdWVBcnJheS5sZW5ndGggLSAxKSArIFwiLiBcIilcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0QXJyYXlbdGhpcy5vYmplY3RBcnJheS5sZW5ndGggLSAxXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaW5kZXhPZihvOiBWYWx1ZSk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0QXJyYXkuaW5kZXhPZihvLnZhbHVlKTtcclxuICAgIH1cclxuXHJcbiAgICBzaXplKCk6IG51bWJlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0QXJyYXkubGVuZ3RoO1xyXG4gICAgfVxyXG5cclxuICAgIGlzRW1wdHkoKTogYm9vbGVhbiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMudmFsdWVBcnJheS5sZW5ndGggPT0gMDtcclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVPYmplY3Qob2JqZWN0OiBWYWx1ZSkge1xyXG4gICAgICAgIGxldCBpbmRleCA9IHRoaXMub2JqZWN0QXJyYXkuaW5kZXhPZihvYmplY3QudmFsdWUpO1xyXG4gICAgICAgIGlmIChpbmRleCA+PSAwKSB7XHJcbiAgICAgICAgICAgIHRoaXMub2JqZWN0QXJyYXkuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZUFycmF5LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnRhaW5zKG9iamVjdDogVmFsdWUpOiBhbnkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm9iamVjdEFycmF5LmluZGV4T2Yob2JqZWN0LnZhbHVlKSA+PSAwO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMudmFsdWVBcnJheSA9IFtdO1xyXG4gICAgICAgIHRoaXMub2JqZWN0QXJyYXkgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBwZWVrX2xhc3Rfb3JfbnVsbCgpOiBhbnkge1xyXG4gICAgICAgIGlmICh0aGlzLm9iamVjdEFycmF5Lmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLm9iamVjdEFycmF5W3RoaXMub2JqZWN0QXJyYXkubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcGVla19maXJzdF9vcl9udWxsKCk6IGFueSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2JqZWN0QXJyYXkubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0QXJyYXlbMF07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW1vdmVMYXN0X29yX2Vycm9yKCl7XHJcbiAgICAgICAgaWYgKHRoaXMub2JqZWN0QXJyYXkubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZUFycmF5LnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RBcnJheS5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGFkZExhc3Qob2JqZWN0OiBWYWx1ZSkge1xyXG4gICAgICAgIHRoaXMudmFsdWVBcnJheS5wdXNoKG9iamVjdCk7XHJcbiAgICAgICAgdGhpcy5vYmplY3RBcnJheS5wdXNoKG9iamVjdC52YWx1ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICBhZGRGaXJzdChvYmplY3Q6IFZhbHVlKTogYW55IHtcclxuICAgICAgICB0aGlzLnZhbHVlQXJyYXkuc3BsaWNlKDAsIDAsIG9iamVjdCk7XHJcbiAgICAgICAgdGhpcy5vYmplY3RBcnJheS5zcGxpY2UoMCwgMCwgb2JqZWN0LnZhbHVlKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIHJlbW92ZUZpcnN0T2NjdXJyZW5jZShvYmplY3Q6IFZhbHVlKTogYm9vbGVhbiB7XHJcbiAgICAgICAgbGV0IGluZGV4ID0gdGhpcy5vYmplY3RBcnJheS5pbmRleE9mKG9iamVjdC52YWx1ZSk7XHJcbiAgICAgICAgaWYoaW5kZXggPj0gMCl7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVBcnJheS5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgICAgICB0aGlzLm9iamVjdEFycmF5LnNwbGljZShpbmRleCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgcGVla19vcl9udWxsKCk6IGFueSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2JqZWN0QXJyYXkubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMub2JqZWN0QXJyYXlbdGhpcy5vYmplY3RBcnJheS5sZW5ndGggLSAxXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcG9sbF9vcl9udWxsKCk6IGFueSB7XHJcbiAgICAgICAgaWYgKHRoaXMub2JqZWN0QXJyYXkubGVuZ3RoID09IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy52YWx1ZUFycmF5LnBvcCgpO1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5vYmplY3RBcnJheS5wb3AoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlRmlyc3Rfb3JfZXJyb3IoKTogYW55IHtcclxuICAgICAgICBpZih0aGlzLm9iamVjdEFycmF5Lmxlbmd0aCA9PSAwKXtcclxuICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkRlciBBcnJheUxpc3QtSW5kZXggaXN0IGF1w59lcmhhbGIgZGVzIEludGVydmFsbHMgdm9uIDAgYmlzIFwiICsgKHRoaXMudmFsdWVBcnJheS5sZW5ndGggLSAxKSArIFwiLiBcIilcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgb2JqZWN0ID0gdGhpcy5vYmplY3RBcnJheVswXTtcclxuICAgICAgICAgICAgdGhpcy5vYmplY3RBcnJheS5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgICAgIHRoaXMudmFsdWVBcnJheS5zcGxpY2UoMCwgMSk7XHJcbiAgICAgICAgICAgIHJldHVybiBvYmplY3Q7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuIl19