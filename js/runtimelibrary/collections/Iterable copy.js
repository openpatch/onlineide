import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface } from "../../compiler/types/Class.js";
export class ListClass extends Interface {
    constructor(module) {
        super("Iterable", module);
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
        let iteratorType = module.typeStore.getType("Iterator").clone();
        iteratorType.typeVariables = this.typeVariables;
        this.addMethod(new Method("iterator", new Parameterlist([]), iteratorType, null, // no implementation!
        true, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));
    }
}
//# sourceMappingURL=Iterable copy.js.map