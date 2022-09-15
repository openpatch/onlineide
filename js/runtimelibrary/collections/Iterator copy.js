import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface } from "../../compiler/types/Class.js";
import { booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
export class ListClass extends Interface {
    constructor(module) {
        super("Iterator", module);
        let typeA = module.typeStore.getType("Object").clone();
        typeA.identifier = "E";
        typeA.isTypeVariable = true;
        let tvE = {
            identifier: "E",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeA
        };
        this.typeVariables.push(tvE);
        this.addMethod(new Method("hasNext", new Parameterlist([]), booleanPrimitiveType, null, // no implementation!
        true, false, "Gibt genau dann true zurück, wenn sich noch mindestens ein weiteres Element in der Collection befindet."));
        this.addMethod(new Method("Next", new Parameterlist([
        // { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), typeA, null, // no implementation!
        true, false, "Gibt das nächste Element der Collection zurück."));
        this.addMethod(new Method("remove", new Parameterlist([
        // { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null, null, // no implementation!
        true, false, "Löscht das letzte durch next zurückgegebene Objekt. Diese Methode beeinflusst nicht, welches Element als nächstes durch next zurückgegeben wird."));
    }
}
//# sourceMappingURL=Iterator copy.js.map