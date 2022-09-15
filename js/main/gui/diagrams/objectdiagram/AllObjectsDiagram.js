import { ObjectDiagramVariant } from "./ObjectDiagramVariant";
import { ObjectElement } from "./ObjectElement";
import { Klass } from "../../../../compiler/types/Class";
import { ArrayType } from "../../../../compiler/types/Array";
export class AllObjectsDiagram extends ObjectDiagramVariant {
    constructor(main, objectDiagram) {
        super(main, objectDiagram);
        this.objectToElementMap = new Map();
        this.objectReferences = [];
        this.objectRows = [];
        this.rowHeightCm = 3;
        this.rowWidthCm = 12;
    }
    getSettingsElement() {
        return $('<div></div>');
    }
    updateDiagram() {
        let crawlResult = this.crawlObjects();
        this.renderNewElements(crawlResult.newElements);
        this.updateObjectReferences(crawlResult.referenceMap);
    }
    crawlObjects() {
        let newObjectToElementMap = new Map();
        let referenceMap = new Map();
        let newElements = [];
        let interpreter = this.main.interpreter;
        let heap = interpreter.heap;
        for (let identifier in heap) {
            let variable = heap[identifier];
            if (variable.value != null) {
                this.fetchObject(variable.value, newObjectToElementMap, newElements, referenceMap, null, variable.identifier);
            }
        }
        this.objectToElementMap.forEach((objectElement, runtimeObject) => {
            objectElement.remove();
        });
        this.objectToElementMap = newObjectToElementMap;
        return {
            newElements: newElements,
            referenceMap: referenceMap
        };
    }
    fetchObject(value, newObjectToElementMap, newElements, referenceMap, referencedFrom, identifier) {
        if (value.value == null)
            return;
        let type = value.type;
        if (type instanceof Klass) {
            let oe = newObjectToElementMap.get(value.value);
            if (oe != null) {
                let oe = this.objectToElementMap.get(value.value);
                if (oe != null) {
                    this.objectToElementMap.delete(value.value);
                }
                else {
                    oe = new ObjectElement(this.objectDiagram, value.value);
                    newElements.push(oe);
                }
                newObjectToElementMap.set(value.value, oe);
                let rto = value.value;
                for (let classIdentifier in rto.attributeValues) {
                    let vmap = rto.attributeValues[classIdentifier];
                    for (let variableIdentifier in vmap) {
                        let variable = vmap[variableIdentifier];
                        if (variable.value != null) {
                            if (variable.type instanceof Klass || variable.type instanceof ArrayType) {
                                this.fetchObject(variable.value, newObjectToElementMap, newElements, referenceMap, oe, variable.identifier);
                            }
                        }
                    }
                }
            }
            if (referencedFrom != null) {
                let rmEntry = referenceMap.get(referencedFrom);
                if (rmEntry == null) {
                    rmEntry = [];
                    referenceMap.set(referencedFrom, rmEntry);
                }
                rmEntry.push(oe);
            }
        }
        else if (type instanceof ArrayType) {
            type = type.arrayOfType;
            if (type instanceof Klass || type instanceof ArrayType) {
                let arr = value.value;
                if (arr != null) {
                    for (let v of arr) {
                        this.fetchObject(v, newObjectToElementMap, newElements, referenceMap, referencedFrom);
                    }
                }
            }
        }
    }
    clear() {
    }
}
//# sourceMappingURL=AllObjectsDiagram.js.map