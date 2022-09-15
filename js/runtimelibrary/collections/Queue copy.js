import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface } from "../../compiler/types/Class.js";
import { booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
export class QueueClass extends Interface {
    constructor(module) {
        super("Queue", module);
        let objectType = module.typeStore.getType("Object");
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
        let collectionInterface = module.typeStore.getType("Collection").clone();
        collectionInterface.typeVariables = [tvE];
        this.extends.push(collectionInterface);
        this.addMethod(new Method("offer", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Fügt der Collection ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Collection dadurch geändert hat."));
        this.addMethod(new Method("remove", new Parameterlist([]), typeE, null, // no implementation!
        true, false, "Entfernt das Element am Kopf der Liste und gibt es zurück. Führt zum Fehler, wenn die Liste leer ist."));
        this.addMethod(new Method("poll", new Parameterlist([]), typeE, null, // no implementation!
        true, false, "Entfernt das Element am Kopf der Liste und gibt es zurück. Gibt null zurück, wenn die Liste leer ist."));
        this.addMethod(new Method("element", new Parameterlist([]), typeE, null, // no implementation!
        true, false, "Gibt das Element am Kopf der Liste zurück, entfernt es aber nicht. Führt zum Fehler, wenn die Liste leer ist."));
        this.addMethod(new Method("peek", new Parameterlist([]), typeE, null, // no implementation!
        true, false, "Gibt das Element am Kopf der Liste zurück, entfernt es aber nicht. Gib null zurück, wenn die Liste leer ist."));
    }
}
//# sourceMappingURL=Queue copy.js.map