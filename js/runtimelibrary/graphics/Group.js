import { Klass, Visibility } from "../../compiler/types/Class.js";
import { intPrimitiveType, booleanPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist, Attribute } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { ShapeHelper } from "./Shape.js";
import { ArrayType } from "../../compiler/types/Array.js";
export class CollisionPairClass extends Klass {
    constructor(module) {
        super("CollisionPair", module, "Speichert die Referenzen auf zwei Figuren, die gerade kollidiert sind. Diese Klasse von den Kollisionsmethden der Klasse Group benutzt.");
        this.setBaseClass(module.typeStore.getType("Object"));
        let shapeType = module.typeStore.getType("Shape");
        this.addAttribute(new Attribute("shapeA", shapeType, (value) => {
            let rto = value.object;
            value.value = rto.intrinsicData["ShapeA"];
        }, false, Visibility.public, true, "Erstes an der Kollision beteiligtes Shape"));
        this.addAttribute(new Attribute("shapeB", shapeType, (value) => {
            let rto = value.object;
            value.value = rto.intrinsicData["ShapeB"];
        }, false, Visibility.public, true, "Zweites an der Kollision beteiligtes Shape"));
        this.setupAttributeIndicesRecursive();
    }
}
export class GroupClass extends Klass {
    constructor(module) {
        super("Group", module, "Klasse zum Gruppieren grafischer Elemente. Die gruppierten Elemente können miteinander verschoben, gedreht, gestreckt sowie ein- und ausgeblendet werden. Zudem besitzt die Klasse Methoden zur schnellen Erkennung von Kollision mit Elementen außerhalb der Gruppe.");
        this.setBaseClass(module.typeStore.getType("Shape"));
        let collisionPairType = module.typeStore.getType("CollisionPair");
        let collisionPairArrayType = new ArrayType(collisionPairType);
        let shapeType = module.typeStore.getType("Shape");
        this.addMethod(new Method("Group", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let rh = new GroupHelper(module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert eine neue Gruppe. Ihr können mit der Methode add Elemente hinzugefügt werden, die dann mit der Gruppe verschoben, gedreht, ... werden.', true));
        this.addMethod(new Method("Group", new Parameterlist([
            { identifier: "shapes", type: new ArrayType(module.typeStore.getType("Shape")), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let shapes = parameters[1].value;
            let rh = new GroupHelper(module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = rh;
            for (let s of shapes) {
                rh.add(s.value);
            }
        }, false, false, 'Instanziert eine neue Gruppe und fügt die übergebenen Grafikobjekte der Gruppe hinzu. Der Gruppe können mit der Methode add weitere Grafikobjekte hinzugefügt werden, die dann mit der Gruppe verschoben, gedreht, ... werden.', true));
        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "shapes", type: new ArrayType(shapeType), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let shapes = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("add"))
                return;
            for (let s of shapes) {
                sh.add(s.value);
            }
        }, false, false, 'Fügt die Grafikobjekte der Gruppe hinzu.', false));
        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), shapeType, (parameters) => {
            let o = parameters[0].value;
            let index = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("get"))
                return;
            return sh.getElement(index);
        }, false, false, 'Gibt das Grafikelement der Gruppe mit dem entsprechenden Index zurück. VORSICHT: Das erste Element hat Index 0!', false));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "index", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let index = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            sh.removeElementAt(index);
        }, false, false, 'Entfernt das Grafikelement aus der Gruppe mit dem entsprechenden Index, zerstört es jedoch nicht. VORSICHT: Das erste Element hat Index 0!', false));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "shape", type: shapeType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let shape = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("remove"))
                return;
            sh.remove(shape);
            sh.worldHelper.shapes.push(shape.intrinsicData["Actor"]);
        }, false, false, 'Entfernt das übergebene Grafikelement aus der Gruppe, zerstört es jedoch nicht.', false));
        let shapeArrayType = new ArrayType(shapeType);
        this.addMethod(new Method("getCollidingShapes", new Parameterlist([
            { identifier: "shape", type: module.typeStore.getType("Shape"), declaration: null, usagePositions: null, isFinal: true },
        ]), shapeArrayType, (parameters) => {
            let o = parameters[0].value;
            let shape = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("getCollidingShapes") || shape == null)
                return [];
            let shapes = sh.getCollidingObjects(shape);
            let values = [];
            for (let sh of shapes) {
                values.push({
                    type: shapeType,
                    value: sh
                });
            }
            return values;
        }, false, false, 'Gibt die Objekte der Gruppe zurück, die mit dem übergebenen Shape kollidieren.', false));
        this.addMethod(new Method("getCollisionPairs", new Parameterlist([
            { identifier: "group", type: this, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "maxOneCollisionPerShape", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), collisionPairArrayType, (parameters) => {
            let o = parameters[0].value;
            let group2 = parameters[1].value;
            let maxOneCollisionPerShape = parameters[2].value;
            let sh = o.intrinsicData["Actor"];
            let groupHelper2 = group2.intrinsicData["Actor"];
            if (sh.testdestroyed("getCollidingShapes"))
                return;
            return sh.getCollidingObjects2(groupHelper2, collisionPairType, maxOneCollisionPerShape);
        }, false, false, 'Überprüft, welche Objekte der Gruppe mit welchen der anderen kollidieren.' +
            ' Gibt für jede Kollision ein Collisionpair-Objekt zurück, das die beiden kollidierenden Objekte enthält.' +
            ' Falls maxOneCollisionPerShape == true ist jedes Objekt dabei aber nur in max. einem Collisionpair-Objekt enthalten.', false));
        this.addMethod(new Method("size", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("size"))
                return;
            return sh.shapes.length;
        }, false, false, 'Gibt zurück, wie viele Elemente in der Gruppe enthalten sind.', false));
        this.addMethod(new Method("empty", new Parameterlist([]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("empty"))
                return;
            sh.removeAllChidren();
        }, false, false, 'Entfernt alle Elemente aus der Gruppe, löscht die Elemente aber nicht.', false));
        this.addMethod(new Method("destroyAllChildren", new Parameterlist([]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("destroyAllChildren"))
                return;
            sh.destroyChildren();
        }, false, false, 'Löscht alle Elemente der Gruppe, nicht aber die Gruppe selbst.', false));
        shapeType.addMethod(new Method("getCollidingShapes", new Parameterlist([
            { identifier: "group", type: this, declaration: null, usagePositions: null, isFinal: true },
        ]), shapeArrayType, (parameters) => {
            let o = parameters[0].value;
            let group = parameters[1].value;
            let groupHelper = group.intrinsicData["Actor"];
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("getCollidingShapes"))
                return;
            return sh.getCollidingShapes(groupHelper, shapeType);
        }, false, false, 'Gibt alle Shapes der Gruppe group zurück, die mit dem Shape kollidieren.', false));
        this.addMethod(new Method("copy", new Parameterlist([]), this, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("copy"))
                return;
            return sh.getCopy(o.class);
        }, false, false, 'Erstellt eine Kopie des Group-Objekts (und aller seiner enthaltenen Grafikobjekte!) und git sie zurück.', false));
        this.addMethod(new Method("renderAsStaticBitmap", new Parameterlist([
            { identifier: "renderAsStaticBitmap", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            let doCache = parameters[1].value;
            if (sh.testdestroyed("renderAsStaticBitmap"))
                return;
            sh.cacheAsBitmap(doCache);
            return;
        }, false, false, 'Zeichnet alle Objekte dieser Group in ein Bild und verwendet fortan nur noch dieses Bild, ohne die Kindelemente der Group erneut zu zeichnen. Mit dieser Methode können komplexe Bilder (z.B. ein Sternenhimmel) aufgebaut und dann statisch gemacht werden. Nach dem Aufbau brauchen sie daher kaum mehr Rechenzeit.', false));
    }
}
export class GroupHelper extends ShapeHelper {
    constructor(interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.shapes = [];
        this.displayObject = new PIXI.Container();
        this.worldHelper.stage.addChild(this.displayObject);
        this.addToDefaultGroupAndSetDefaultVisibility();
    }
    cacheAsBitmap(doCache) {
        let container = this.displayObject;
        // If you set doCache to false and shortly afterwards to true: 
        // make shure there's at least one rendercycle in between.
        if (doCache) {
            setTimeout(() => {
                container.cacheAsBitmap = true;
            }, 300);
        }
        else {
            container.cacheAsBitmap = doCache;
        }
    }
    removeElementAt(index) {
        if (index < 0 || index >= this.shapes.length) {
            this.worldHelper.interpreter.throwException("In der Gruppe gibt es kein Element mit Index " + index + ".");
            return;
        }
        let shape = this.shapes[index];
        this.remove(shape);
    }
    getElement(index) {
        if (index < 0 || index >= this.shapes.length) {
            this.worldHelper.interpreter.throwException("In der Gruppe gibt es kein Element mit Index " + index + ".");
            return;
        }
        return this.shapes[index];
    }
    getCopy(klass) {
        let ro = new RuntimeObject(klass);
        let groupHelperCopy = new GroupHelper(this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = groupHelperCopy;
        for (let ro of this.shapes) {
            let shapeHelper = ro.intrinsicData["Actor"];
            let roCopy = shapeHelper.getCopy(ro.class);
            let shapeHelperCopy = roCopy.intrinsicData["Actor"];
            groupHelperCopy.shapes.push(roCopy);
            shapeHelperCopy.belongsToGroup = groupHelperCopy;
            groupHelperCopy.displayObject.addChild(shapeHelperCopy.displayObject);
        }
        groupHelperCopy.copyFrom(this);
        groupHelperCopy.render();
        return ro;
    }
    setTimerPaused(tp) {
        this.timerPaused = tp;
        for (let shape of this.shapes) {
            let sh = shape.intrinsicData["Actor"];
            sh.timerPaused = tp;
        }
    }
    add(shape) {
        if (shape == null)
            return;
        let shapeHelper = shape.intrinsicData["Actor"];
        if (shapeHelper.isDestroyed) {
            this.worldHelper.interpreter.throwException("Ein schon zerstörtes Objekt kann keiner Gruppe hinzugefügt werden.");
            return;
        }
        if (this.hasCircularReference(shape)) {
            return;
        }
        this.shapes.push(shape);
        if (shapeHelper.belongsToGroup != null) {
            shapeHelper.belongsToGroup.remove(shape);
        }
        else {
            let index = this.worldHelper.shapes.indexOf(shapeHelper);
            if (index >= 0)
                this.worldHelper.shapes.splice(index, 1);
        }
        shapeHelper.belongsToGroup = this;
        this.displayObject.parent.updateTransform();
        let inverse = new PIXI.Matrix().copyFrom(this.displayObject.transform.worldTransform);
        inverse.invert();
        shapeHelper.displayObject.localTransform.prepend(inverse.prepend(this.worldHelper.stage.localTransform));
        //@ts-ignore
        shapeHelper.displayObject.transform.onChange();
        this.displayObject.addChild(shapeHelper.displayObject);
        shapeHelper.displayObject.updateTransform();
        let xSum = 0;
        let ySum = 0;
        for (let shape of this.shapes) {
            let sh = shape.intrinsicData["Actor"];
            xSum += sh.getCenterX();
            ySum += sh.getCenterY();
        }
        let x = xSum / this.shapes.length;
        let y = ySum / this.shapes.length;
        this.displayObject.updateTransform();
        let p1 = this.displayObject.worldTransform.applyInverse(new PIXI.Point(x, y));
        this.centerXInitial = p1.x;
        this.centerYInitial = p1.y;
    }
    removeAllChidren() {
        let index = 0;
        for (let shape of this.shapes) {
            this.deregister(shape, index++);
        }
        this.shapes = [];
    }
    remove(shape) {
        let index = this.shapes.indexOf(shape);
        if (index >= 0) {
            this.shapes.splice(index, 1);
            this.deregister(shape, index);
        }
    }
    deregister(shape, index) {
        let shapeHelper = shape.intrinsicData['Actor'];
        let transform = new PIXI.Matrix().copyFrom(shapeHelper.displayObject.transform.worldTransform);
        this.displayObject.removeChildAt(index);
        let inverseStageTransform = new PIXI.Matrix().copyFrom(this.worldHelper.stage.localTransform);
        inverseStageTransform.invert();
        shapeHelper.displayObject.localTransform.identity();
        shapeHelper.displayObject.localTransform.append(transform.prepend(inverseStageTransform));
        //@ts-ignore
        shapeHelper.displayObject.transform.onChange();
        this.worldHelper.stage.addChild(shapeHelper.displayObject);
        shapeHelper.displayObject.updateTransform();
        shapeHelper.belongsToGroup = null;
    }
    render() {
    }
    destroy() {
        this.destroyChildren();
        super.destroy();
    }
    destroyChildren() {
        for (let shape of this.shapes.slice(0)) {
            let sh = shape.intrinsicData["Actor"];
            sh.destroy();
        }
        this.shapes = [];
    }
    hasOverlappingBoundingBoxWith(shapeHelper) {
        this.displayObject.updateTransform();
        shapeHelper.displayObject.updateTransform();
        let bb = this.displayObject.getBounds();
        let bb1 = shapeHelper.displayObject.getBounds();
        if (bb.left > bb1.right || bb1.left > bb.right)
            return false;
        if (bb.top > bb1.bottom || bb1.top > bb.bottom)
            return false;
        return true;
    }
    collidesWith(shapeHelper) {
        if (!this.hasOverlappingBoundingBoxWith(shapeHelper)) {
            return false;
        }
        for (let shape of this.shapes) {
            let sh = shape.intrinsicData["Actor"];
            if (sh.collidesWith(shapeHelper)) {
                return true;
            }
        }
        return false;
    }
    setHitPolygonDirty(dirty) {
        for (let shape of this.shapes) {
            let sh = shape.intrinsicData["Actor"];
            sh.setHitPolygonDirty(dirty);
        }
    }
    containsPoint(x, y) {
        this.displayObject.updateTransform();
        let bb = this.displayObject.getBounds();
        if (x < bb.left || x > bb.left + bb.width || y < bb.top || y > bb.top + bb.height) {
            return false;
        }
        for (let shape of this.shapes) {
            let sh = shape.intrinsicData["Actor"];
            if (sh.containsPoint(x, y)) {
                return true;
            }
        }
        return false;
    }
    getCollidingObjects(shape) {
        let collidingShapes = [];
        let shapeHelper = shape.intrinsicData["Actor"];
        for (let s of this.shapes) {
            let sh = s.intrinsicData["Actor"];
            if (sh.collidesWith(shapeHelper)) {
                collidingShapes.push(s);
            }
        }
        return collidingShapes;
    }
    getCollidingObjects2(groupHelper2, collisionPairType, maxOneCollisionPerShape) {
        let collisionPairs = [];
        let alreadyCollidedHelpers2 = new Map();
        for (let shape1 of this.shapes) {
            let shapeHelper1 = shape1.intrinsicData["Actor"];
            for (let shape2 of groupHelper2.shapes) {
                let shapeHelper2 = shape2.intrinsicData["Actor"];
                if (shapeHelper1.collidesWith(shapeHelper2)) {
                    if (!maxOneCollisionPerShape || alreadyCollidedHelpers2.get(shapeHelper2) == null) {
                        alreadyCollidedHelpers2.set(shapeHelper2, true);
                        let rto = new RuntimeObject(collisionPairType);
                        rto.intrinsicData["ShapeA"] = shapeHelper1.runtimeObject;
                        rto.intrinsicData["ShapeB"] = shapeHelper2.runtimeObject;
                        collisionPairs.push({
                            type: collisionPairType,
                            value: rto
                        });
                    }
                    if (maxOneCollisionPerShape) {
                        break;
                    }
                }
            }
        }
        return collisionPairs;
    }
    hasCircularReference(shapeToAdd) {
        let gh = shapeToAdd.intrinsicData["Actor"];
        if (gh instanceof GroupHelper) {
            if (gh == this) {
                this.worldHelper.interpreter.throwException("Eine Group darf sich nicht selbst enthalten!");
                return true;
            }
            else {
                for (let shape of gh.shapes) {
                    if (this.hasCircularReference(shape)) {
                        return true;
                    }
                    ;
                }
            }
        }
        return false;
    }
    tint(color) {
        for (let child of this.shapes) {
            child.intrinsicData["Actor"].tint(color);
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0dyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDbEUsT0FBTyxFQUF1QixnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3hJLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFTLFNBQVMsRUFBUSxNQUFNLCtCQUErQixDQUFDO0FBQzlGLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUluRSxPQUFPLEVBQUUsV0FBVyxFQUFjLE1BQU0sWUFBWSxDQUFDO0FBRXJELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUcxRCxNQUFNLE9BQU8sa0JBQW1CLFNBQVEsS0FBSztJQUV6QyxZQUFZLE1BQWM7UUFFdEIsS0FBSyxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUseUlBQXlJLENBQUMsQ0FBQztRQUUxSyxJQUFJLENBQUMsWUFBWSxDQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUMvQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBRU4sSUFBSSxHQUFHLEdBQWtCLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDdEMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLENBQUMsRUFBRSxLQUFL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QUksQ0FBQyxNQUFNLEVBQUU7WUFDYixLQUFLLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMzRDtJQUNMLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBWaXNpYmlsaXR5IH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGludFByaW1pdGl2ZVR5cGUsIGJvb2xlYW5QcmltaXRpdmVUeXBlLCB2b2lkUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlLCBBdHRyaWJ1dGUsIFR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IEZpbGxlZFNoYXBlSGVscGVyIH0gZnJvbSBcIi4vRmlsbGVkU2hhcGUuanNcIjtcclxuaW1wb3J0IHsgV29ybGRIZWxwZXIgfSBmcm9tIFwiLi9Xb3JsZC5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9FbnVtLmpzXCI7XHJcbmltcG9ydCB7IFNoYXBlSGVscGVyLCBTaGFwZUNsYXNzIH0gZnJvbSBcIi4vU2hhcGUuanNcIjtcclxuaW1wb3J0IHsgSGl0UG9seWdvblN0b3JlIH0gZnJvbSBcIi4vUG9seWdvblN0b3JlLmpzXCI7XHJcbmltcG9ydCB7IEFycmF5VHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9BcnJheS5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIENvbGxpc2lvblBhaXJDbGFzcyBleHRlbmRzIEtsYXNzIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBzdXBlcihcIkNvbGxpc2lvblBhaXJcIiwgbW9kdWxlLCBcIlNwZWljaGVydCBkaWUgUmVmZXJlbnplbiBhdWYgendlaSBGaWd1cmVuLCBkaWUgZ2VyYWRlIGtvbGxpZGllcnQgc2luZC4gRGllc2UgS2xhc3NlIHZvbiBkZW4gS29sbGlzaW9uc21ldGhkZW4gZGVyIEtsYXNzZSBHcm91cCBiZW51dHp0LlwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKSk7XHJcblxyXG4gICAgICAgIGxldCBzaGFwZVR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJTaGFwZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcInNoYXBlQVwiLCBzaGFwZVR5cGUsXHJcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBydG86IFJ1bnRpbWVPYmplY3QgPSB2YWx1ZS5vYmplY3Q7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS52YWx1ZSA9IHJ0by5pbnRyaW5zaWNEYXRhW1wiU2hhcGVBXCJdO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIFZpc2liaWxpdHkucHVibGljLCB0cnVlLCBcIkVyc3RlcyBhbiBkZXIgS29sbGlzaW9uIGJldGVpbGlndGVzIFNoYXBlXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRBdHRyaWJ1dGUobmV3IEF0dHJpYnV0ZShcInNoYXBlQlwiLCBzaGFwZVR5cGUsXHJcbiAgICAgICAgICAgICh2YWx1ZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBydG86IFJ1bnRpbWVPYmplY3QgPSB2YWx1ZS5vYmplY3Q7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZS52YWx1ZSA9IHJ0by5pbnRyaW5zaWNEYXRhW1wiU2hhcGVCXCJdO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIFZpc2liaWxpdHkucHVibGljLCB0cnVlLCBcIlp3ZWl0ZXMgYW4gZGVyIEtvbGxpc2lvbiBiZXRlaWxpZ3RlcyBTaGFwZVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0dXBBdHRyaWJ1dGVJbmRpY2VzUmVjdXJzaXZlKCk7XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBHcm91cENsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiR3JvdXBcIiwgbW9kdWxlLCBcIktsYXNzZSB6dW0gR3J1cHBpZXJlbiBncmFmaXNjaGVyIEVsZW1lbnRlLiBEaWUgZ3J1cHBpZXJ0ZW4gRWxlbWVudGUga8O2bm5lbiBtaXRlaW5hbmRlciB2ZXJzY2hvYmVuLCBnZWRyZWh0LCBnZXN0cmVja3Qgc293aWUgZWluLSB1bmQgYXVzZ2VibGVuZGV0IHdlcmRlbi4gWnVkZW0gYmVzaXR6dCBkaWUgS2xhc3NlIE1ldGhvZGVuIHp1ciBzY2huZWxsZW4gRXJrZW5udW5nIHZvbiBLb2xsaXNpb24gbWl0IEVsZW1lbnRlbiBhdcOfZXJoYWxiIGRlciBHcnVwcGUuXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIikpO1xyXG5cclxuICAgICAgICBsZXQgY29sbGlzaW9uUGFpclR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJDb2xsaXNpb25QYWlyXCIpO1xyXG4gICAgICAgIGxldCBjb2xsaXNpb25QYWlyQXJyYXlUeXBlID0gbmV3IEFycmF5VHlwZShjb2xsaXNpb25QYWlyVHlwZSk7XHJcbiAgICAgICAgbGV0IHNoYXBlVHlwZSA9IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIlNoYXBlXCIpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIkdyb3VwXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJoID0gbmV3IEdyb3VwSGVscGVyKG1vZHVsZS5tYWluLmdldEludGVycHJldGVyKCksIG8pO1xyXG4gICAgICAgICAgICAgICAgby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSByaDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbmUgbmV1ZSBHcnVwcGUuIElociBrw7ZubmVuIG1pdCBkZXIgTWV0aG9kZSBhZGQgRWxlbWVudGUgaGluenVnZWbDvGd0IHdlcmRlbiwgZGllIGRhbm4gbWl0IGRlciBHcnVwcGUgdmVyc2Nob2JlbiwgZ2VkcmVodCwgLi4uIHdlcmRlbi4nLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJHcm91cFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJzaGFwZXNcIiwgdHlwZTogbmV3IEFycmF5VHlwZShtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJTaGFwZVwiKSksIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSwgaXNFbGxpcHNpczogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZXM6IFZhbHVlW10gPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByaCA9IG5ldyBHcm91cEhlbHBlcihtb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gcmg7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcyBvZiBzaGFwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICByaC5hZGQocy52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdJbnN0YW56aWVydCBlaW5lIG5ldWUgR3J1cHBlIHVuZCBmw7xndCBkaWUgw7xiZXJnZWJlbmVuIEdyYWZpa29iamVrdGUgZGVyIEdydXBwZSBoaW56dS4gRGVyIEdydXBwZSBrw7ZubmVuIG1pdCBkZXIgTWV0aG9kZSBhZGQgd2VpdGVyZSBHcmFmaWtvYmpla3RlIGhpbnp1Z2Vmw7xndCB3ZXJkZW4sIGRpZSBkYW5uIG1pdCBkZXIgR3J1cHBlIHZlcnNjaG9iZW4sIGdlZHJlaHQsIC4uLiB3ZXJkZW4uJywgdHJ1ZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiYWRkXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNoYXBlc1wiLCB0eXBlOiBuZXcgQXJyYXlUeXBlKHNoYXBlVHlwZSksIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSwgaXNFbGxpcHNpczogdHJ1ZSB9LFxyXG5cclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hhcGVzOiBWYWx1ZVtdID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJhZGRcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzIG9mIHNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoLmFkZChzLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0bDvGd0IGRpZSBHcmFmaWtvYmpla3RlIGRlciBHcnVwcGUgaGluenUuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJpbmRleFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuXHJcbiAgICAgICAgXSksIHNoYXBlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IEdyb3VwSGVscGVyID0gPEdyb3VwSGVscGVyPm8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiZ2V0XCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldEVsZW1lbnQoaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnR2lidCBkYXMgR3JhZmlrZWxlbWVudCBkZXIgR3J1cHBlIG1pdCBkZW0gZW50c3ByZWNoZW5kZW4gSW5kZXggenVyw7xjay4gVk9SU0lDSFQ6IERhcyBlcnN0ZSBFbGVtZW50IGhhdCBJbmRleCAwIScsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZW1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaW5kZXhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcblxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgc2gucmVtb3ZlRWxlbWVudEF0KGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0VudGZlcm50IGRhcyBHcmFmaWtlbGVtZW50IGF1cyBkZXIgR3J1cHBlIG1pdCBkZW0gZW50c3ByZWNoZW5kZW4gSW5kZXgsIHplcnN0w7ZydCBlcyBqZWRvY2ggbmljaHQuIFZPUlNJQ0hUOiBEYXMgZXJzdGUgRWxlbWVudCBoYXQgSW5kZXggMCEnLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVtb3ZlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNoYXBlXCIsIHR5cGU6IHNoYXBlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcblxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZTogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IEdyb3VwSGVscGVyID0gPEdyb3VwSGVscGVyPm8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwicmVtb3ZlXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2gucmVtb3ZlKHNoYXBlKTtcclxuICAgICAgICAgICAgICAgIHNoLndvcmxkSGVscGVyLnNoYXBlcy5wdXNoKHNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdFbnRmZXJudCBkYXMgw7xiZXJnZWJlbmUgR3JhZmlrZWxlbWVudCBhdXMgZGVyIEdydXBwZSwgemVyc3TDtnJ0IGVzIGplZG9jaCBuaWNodC4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICAgICAgbGV0IHNoYXBlQXJyYXlUeXBlID0gbmV3IEFycmF5VHlwZShzaGFwZVR5cGUpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0Q29sbGlkaW5nU2hhcGVzXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNoYXBlXCIsIHR5cGU6IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIlNoYXBlXCIpLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuXHJcbiAgICAgICAgXSksIHNoYXBlQXJyYXlUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZTogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IEdyb3VwSGVscGVyID0gPEdyb3VwSGVscGVyPm8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiZ2V0Q29sbGlkaW5nU2hhcGVzXCIpIHx8IHNoYXBlID09IG51bGwpIHJldHVybiBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgc2hhcGVzOiBSdW50aW1lT2JqZWN0W10gPSBzaC5nZXRDb2xsaWRpbmdPYmplY3RzKHNoYXBlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZVtdID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzaCBvZiBzaGFwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHNoYXBlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHNoXHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlcztcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgZGllIE9iamVrdGUgZGVyIEdydXBwZSB6dXLDvGNrLCBkaWUgbWl0IGRlbSDDvGJlcmdlYmVuZW4gU2hhcGUga29sbGlkaWVyZW4uJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldENvbGxpc2lvblBhaXJzXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImdyb3VwXCIsIHR5cGU6IHRoaXMsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwibWF4T25lQ29sbGlzaW9uUGVyU2hhcGVcIiwgdHlwZTogYm9vbGVhblByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBjb2xsaXNpb25QYWlyQXJyYXlUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBncm91cDI6IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1heE9uZUNvbGxpc2lvblBlclNoYXBlOiBib29sZWFuID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXBIZWxwZXIyOiBHcm91cEhlbHBlciA9IDxHcm91cEhlbHBlcj5ncm91cDIuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiZ2V0Q29sbGlkaW5nU2hhcGVzXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldENvbGxpZGluZ09iamVjdHMyKGdyb3VwSGVscGVyMiwgY29sbGlzaW9uUGFpclR5cGUsIG1heE9uZUNvbGxpc2lvblBlclNoYXBlKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ8OcYmVycHLDvGZ0LCB3ZWxjaGUgT2JqZWt0ZSBkZXIgR3J1cHBlIG1pdCB3ZWxjaGVuIGRlciBhbmRlcmVuIGtvbGxpZGllcmVuLicgK1xyXG4gICAgICAgICAgICAnIEdpYnQgZsO8ciBqZWRlIEtvbGxpc2lvbiBlaW4gQ29sbGlzaW9ucGFpci1PYmpla3QgenVyw7xjaywgZGFzIGRpZSBiZWlkZW4ga29sbGlkaWVyZW5kZW4gT2JqZWt0ZSBlbnRow6RsdC4nICtcclxuICAgICAgICAnIEZhbGxzIG1heE9uZUNvbGxpc2lvblBlclNoYXBlID09IHRydWUgaXN0IGplZGVzIE9iamVrdCBkYWJlaSBhYmVyIG51ciBpbiBtYXguIGVpbmVtIENvbGxpc2lvbnBhaXItT2JqZWt0IGVudGhhbHRlbi4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNpemVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJzaXplXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLnNoYXBlcy5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IHp1csO8Y2ssIHdpZSB2aWVsZSBFbGVtZW50ZSBpbiBkZXIgR3J1cHBlIGVudGhhbHRlbiBzaW5kLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJlbXB0eVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJlbXB0eVwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLnJlbW92ZUFsbENoaWRyZW4oKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0VudGZlcm50IGFsbGUgRWxlbWVudGUgYXVzIGRlciBHcnVwcGUsIGzDtnNjaHQgZGllIEVsZW1lbnRlIGFiZXIgbmljaHQuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImRlc3Ryb3lBbGxDaGlsZHJlblwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJkZXN0cm95QWxsQ2hpbGRyZW5cIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBzaC5kZXN0cm95Q2hpbGRyZW4oKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0zDtnNjaHQgYWxsZSBFbGVtZW50ZSBkZXIgR3J1cHBlLCBuaWNodCBhYmVyIGRpZSBHcnVwcGUgc2VsYnN0LicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgICAgICAoPEtsYXNzPnNoYXBlVHlwZSkuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJnZXRDb2xsaWRpbmdTaGFwZXNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZ3JvdXBcIiwgdHlwZTogdGhpcywgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHNoYXBlQXJyYXlUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBncm91cDogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXBIZWxwZXI6IEdyb3VwSGVscGVyID0gZ3JvdXAuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBTaGFwZUhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiZ2V0Q29sbGlkaW5nU2hhcGVzXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldENvbGxpZGluZ1NoYXBlcyhncm91cEhlbHBlciwgc2hhcGVUeXBlKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgYWxsZSBTaGFwZXMgZGVyIEdydXBwZSBncm91cCB6dXLDvGNrLCBkaWUgbWl0IGRlbSBTaGFwZSBrb2xsaWRpZXJlbi4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29weVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIHRoaXMsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBHcm91cEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiY29weVwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBzaC5nZXRDb3B5KDxLbGFzcz5vLmNsYXNzKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0Vyc3RlbGx0IGVpbmUgS29waWUgZGVzIEdyb3VwLU9iamVrdHMgKHVuZCBhbGxlciBzZWluZXIgZW50aGFsdGVuZW4gR3JhZmlrb2JqZWt0ZSEpIHVuZCBnaXQgc2llIHp1csO8Y2suJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJlbmRlckFzU3RhdGljQml0bWFwXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInJlbmRlckFzU3RhdGljQml0bWFwXCIsIHR5cGU6IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgdGhpcyxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IEdyb3VwSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgICAgICBsZXQgZG9DYWNoZTogYm9vbGVhbiA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJyZW5kZXJBc1N0YXRpY0JpdG1hcFwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLmNhY2hlQXNCaXRtYXAoZG9DYWNoZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnWmVpY2huZXQgYWxsZSBPYmpla3RlIGRpZXNlciBHcm91cCBpbiBlaW4gQmlsZCB1bmQgdmVyd2VuZGV0IGZvcnRhbiBudXIgbm9jaCBkaWVzZXMgQmlsZCwgb2huZSBkaWUgS2luZGVsZW1lbnRlIGRlciBHcm91cCBlcm5ldXQgenUgemVpY2huZW4uIE1pdCBkaWVzZXIgTWV0aG9kZSBrw7ZubmVuIGtvbXBsZXhlIEJpbGRlciAoei5CLiBlaW4gU3Rlcm5lbmhpbW1lbCkgYXVmZ2ViYXV0IHVuZCBkYW5uIHN0YXRpc2NoIGdlbWFjaHQgd2VyZGVuLiBOYWNoIGRlbSBBdWZiYXUgYnJhdWNoZW4gc2llIGRhaGVyIGthdW0gbWVociBSZWNoZW56ZWl0LicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcm91cEhlbHBlciBleHRlbmRzIFNoYXBlSGVscGVyIHtcclxuXHJcbiAgICBzaGFwZXM6IFJ1bnRpbWVPYmplY3RbXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuICAgICAgICB0aGlzLmRpc3BsYXlPYmplY3QgPSBuZXcgUElYSS5Db250YWluZXIoKTtcclxuICAgICAgICB0aGlzLndvcmxkSGVscGVyLnN0YWdlLmFkZENoaWxkKHRoaXMuZGlzcGxheU9iamVjdCk7XHJcbiAgICAgICAgdGhpcy5hZGRUb0RlZmF1bHRHcm91cEFuZFNldERlZmF1bHRWaXNpYmlsaXR5KCk7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjYWNoZUFzQml0bWFwKGRvQ2FjaGU6IGJvb2xlYW4pIHtcclxuICAgICAgICBsZXQgY29udGFpbmVyID0gPFBJWEkuQ29udGFpbmVyPnRoaXMuZGlzcGxheU9iamVjdDtcclxuXHJcbiAgICAgICAgLy8gSWYgeW91IHNldCBkb0NhY2hlIHRvIGZhbHNlIGFuZCBzaG9ydGx5IGFmdGVyd2FyZHMgdG8gdHJ1ZTogXHJcbiAgICAgICAgLy8gbWFrZSBzaHVyZSB0aGVyZSdzIGF0IGxlYXN0IG9uZSByZW5kZXJjeWNsZSBpbiBiZXR3ZWVuLlxyXG4gICAgICAgIGlmIChkb0NhY2hlKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29udGFpbmVyLmNhY2hlQXNCaXRtYXAgPSB0cnVlO1xyXG4gICAgICAgICAgICB9LCAzMDApO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNvbnRhaW5lci5jYWNoZUFzQml0bWFwID0gZG9DYWNoZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJlbW92ZUVsZW1lbnRBdChpbmRleDogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnNoYXBlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkluIGRlciBHcnVwcGUgZ2lidCBlcyBrZWluIEVsZW1lbnQgbWl0IEluZGV4IFwiICsgaW5kZXggKyBcIi5cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzaGFwZSA9IHRoaXMuc2hhcGVzW2luZGV4XTtcclxuICAgICAgICB0aGlzLnJlbW92ZShzaGFwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0RWxlbWVudChpbmRleDogbnVtYmVyKTogUnVudGltZU9iamVjdCB7XHJcbiAgICAgICAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB0aGlzLnNoYXBlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkluIGRlciBHcnVwcGUgZ2lidCBlcyBrZWluIEVsZW1lbnQgbWl0IEluZGV4IFwiICsgaW5kZXggKyBcIi5cIik7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuc2hhcGVzW2luZGV4XTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb3B5KGtsYXNzOiBLbGFzcyk6IFJ1bnRpbWVPYmplY3Qge1xyXG5cclxuICAgICAgICBsZXQgcm86IFJ1bnRpbWVPYmplY3QgPSBuZXcgUnVudGltZU9iamVjdChrbGFzcyk7XHJcbiAgICAgICAgbGV0IGdyb3VwSGVscGVyQ29weTogR3JvdXBIZWxwZXIgPSBuZXcgR3JvdXBIZWxwZXIodGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlciwgcm8pO1xyXG4gICAgICAgIHJvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IGdyb3VwSGVscGVyQ29weTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgcm8gb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlciA9IHJvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgIGxldCByb0NvcHk6IFJ1bnRpbWVPYmplY3QgPSBzaGFwZUhlbHBlci5nZXRDb3B5KDxLbGFzcz5yby5jbGFzcylcclxuICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyQ29weTogU2hhcGVIZWxwZXIgPSByb0NvcHkuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgZ3JvdXBIZWxwZXJDb3B5LnNoYXBlcy5wdXNoKHJvQ29weSk7XHJcblxyXG4gICAgICAgICAgICBzaGFwZUhlbHBlckNvcHkuYmVsb25nc1RvR3JvdXAgPSBncm91cEhlbHBlckNvcHk7XHJcblxyXG4gICAgICAgICAgICAoPFBJWEkuQ29udGFpbmVyPmdyb3VwSGVscGVyQ29weS5kaXNwbGF5T2JqZWN0KS5hZGRDaGlsZChzaGFwZUhlbHBlckNvcHkuZGlzcGxheU9iamVjdCk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZ3JvdXBIZWxwZXJDb3B5LmNvcHlGcm9tKHRoaXMpO1xyXG4gICAgICAgIGdyb3VwSGVscGVyQ29weS5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFRpbWVyUGF1c2VkKHRwOiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy50aW1lclBhdXNlZCA9IHRwO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgc2gudGltZXJQYXVzZWQgPSB0cDtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhZGQoc2hhcGU6IFJ1bnRpbWVPYmplY3QpIHtcclxuXHJcbiAgICAgICAgaWYoc2hhcGUgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgc2hhcGVIZWxwZXI6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgaWYgKHNoYXBlSGVscGVyLmlzRGVzdHJveWVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJFaW4gc2Nob24gemVyc3TDtnJ0ZXMgT2JqZWt0IGthbm4ga2VpbmVyIEdydXBwZSBoaW56dWdlZsO8Z3Qgd2VyZGVuLlwiKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaGFzQ2lyY3VsYXJSZWZlcmVuY2Uoc2hhcGUpKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuc2hhcGVzLnB1c2goc2hhcGUpO1xyXG5cclxuICAgICAgICBpZiAoc2hhcGVIZWxwZXIuYmVsb25nc1RvR3JvdXAgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBzaGFwZUhlbHBlci5iZWxvbmdzVG9Hcm91cC5yZW1vdmUoc2hhcGUpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBpbmRleCA9IHRoaXMud29ybGRIZWxwZXIuc2hhcGVzLmluZGV4T2Yoc2hhcGVIZWxwZXIpO1xyXG4gICAgICAgICAgICBpZiAoaW5kZXggPj0gMCkgdGhpcy53b3JsZEhlbHBlci5zaGFwZXMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHNoYXBlSGVscGVyLmJlbG9uZ3NUb0dyb3VwID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwbGF5T2JqZWN0LnBhcmVudC51cGRhdGVUcmFuc2Zvcm0oKTtcclxuICAgICAgICBsZXQgaW52ZXJzZSA9IG5ldyBQSVhJLk1hdHJpeCgpLmNvcHlGcm9tKHRoaXMuZGlzcGxheU9iamVjdC50cmFuc2Zvcm0ud29ybGRUcmFuc2Zvcm0pO1xyXG4gICAgICAgIGludmVyc2UuaW52ZXJ0KCk7XHJcbiAgICAgICAgc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC5sb2NhbFRyYW5zZm9ybS5wcmVwZW5kKGludmVyc2UucHJlcGVuZCh0aGlzLndvcmxkSGVscGVyLnN0YWdlLmxvY2FsVHJhbnNmb3JtKSk7XHJcbiAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC50cmFuc2Zvcm0ub25DaGFuZ2UoKTtcclxuXHJcbiAgICAgICAgKDxQSVhJLkNvbnRhaW5lcj50aGlzLmRpc3BsYXlPYmplY3QpLmFkZENoaWxkKHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QpO1xyXG4gICAgICAgIHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QudXBkYXRlVHJhbnNmb3JtKCk7XHJcblxyXG4gICAgICAgIGxldCB4U3VtOiBudW1iZXIgPSAwO1xyXG4gICAgICAgIGxldCB5U3VtOiBudW1iZXIgPSAwO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgeFN1bSArPSBzaC5nZXRDZW50ZXJYKCk7XHJcbiAgICAgICAgICAgIHlTdW0gKz0gc2guZ2V0Q2VudGVyWSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHggPSB4U3VtIC8gdGhpcy5zaGFwZXMubGVuZ3RoO1xyXG4gICAgICAgIGxldCB5ID0geVN1bSAvIHRoaXMuc2hhcGVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgdGhpcy5kaXNwbGF5T2JqZWN0LnVwZGF0ZVRyYW5zZm9ybSgpO1xyXG4gICAgICAgIGxldCBwMTogUElYSS5Qb2ludCA9IHRoaXMuZGlzcGxheU9iamVjdC53b3JsZFRyYW5zZm9ybS5hcHBseUludmVyc2UobmV3IFBJWEkuUG9pbnQoeCwgeSkpO1xyXG4gICAgICAgIHRoaXMuY2VudGVyWEluaXRpYWwgPSBwMS54O1xyXG4gICAgICAgIHRoaXMuY2VudGVyWUluaXRpYWwgPSBwMS55O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZW1vdmVBbGxDaGlkcmVuKCkge1xyXG4gICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gMDtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICB0aGlzLmRlcmVnaXN0ZXIoc2hhcGUsIGluZGV4KyspO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNoYXBlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZW1vdmUoc2hhcGU6IFJ1bnRpbWVPYmplY3QpIHtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLnNoYXBlcy5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5kZXJlZ2lzdGVyKHNoYXBlLCBpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGVyZWdpc3RlcihzaGFwZTogUnVudGltZU9iamVjdCwgaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSBzaGFwZS5pbnRyaW5zaWNEYXRhWydBY3RvciddO1xyXG5cclxuICAgICAgICBsZXQgdHJhbnNmb3JtID0gbmV3IFBJWEkuTWF0cml4KCkuY29weUZyb20oc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC50cmFuc2Zvcm0ud29ybGRUcmFuc2Zvcm0pO1xyXG5cclxuICAgICAgICAoPFBJWEkuQ29udGFpbmVyPnRoaXMuZGlzcGxheU9iamVjdCkucmVtb3ZlQ2hpbGRBdChpbmRleCk7XHJcblxyXG4gICAgICAgIGxldCBpbnZlcnNlU3RhZ2VUcmFuc2Zvcm0gPSBuZXcgUElYSS5NYXRyaXgoKS5jb3B5RnJvbSh0aGlzLndvcmxkSGVscGVyLnN0YWdlLmxvY2FsVHJhbnNmb3JtKTtcclxuICAgICAgICBpbnZlcnNlU3RhZ2VUcmFuc2Zvcm0uaW52ZXJ0KCk7XHJcbiAgICAgICAgc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC5sb2NhbFRyYW5zZm9ybS5pZGVudGl0eSgpO1xyXG4gICAgICAgIHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QubG9jYWxUcmFuc2Zvcm0uYXBwZW5kKHRyYW5zZm9ybS5wcmVwZW5kKGludmVyc2VTdGFnZVRyYW5zZm9ybSkpO1xyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QudHJhbnNmb3JtLm9uQ2hhbmdlKCk7XHJcbiAgICAgICAgdGhpcy53b3JsZEhlbHBlci5zdGFnZS5hZGRDaGlsZChzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0KTtcclxuICAgICAgICBzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0LnVwZGF0ZVRyYW5zZm9ybSgpO1xyXG4gICAgICAgIHNoYXBlSGVscGVyLmJlbG9uZ3NUb0dyb3VwID0gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyByZW5kZXIoKTogdm9pZCB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95Q2hpbGRyZW4oKTtcclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3lDaGlsZHJlbigpOiB2b2lkIHtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcy5zbGljZSgwKSkge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgc2guZGVzdHJveSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNoYXBlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIGhhc092ZXJsYXBwaW5nQm91bmRpbmdCb3hXaXRoKHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlcik6IGJvb2xlYW4ge1xyXG4gICAgICAgIHRoaXMuZGlzcGxheU9iamVjdC51cGRhdGVUcmFuc2Zvcm0oKTtcclxuICAgICAgICBzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0LnVwZGF0ZVRyYW5zZm9ybSgpO1xyXG5cclxuICAgICAgICBsZXQgYmIgPSB0aGlzLmRpc3BsYXlPYmplY3QuZ2V0Qm91bmRzKCk7XHJcbiAgICAgICAgbGV0IGJiMSA9IHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QuZ2V0Qm91bmRzKCk7XHJcblxyXG4gICAgICAgIGlmIChiYi5sZWZ0ID4gYmIxLnJpZ2h0IHx8IGJiMS5sZWZ0ID4gYmIucmlnaHQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGJiLnRvcCA+IGJiMS5ib3R0b20gfHwgYmIxLnRvcCA+IGJiLmJvdHRvbSkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjb2xsaWRlc1dpdGgoc2hhcGVIZWxwZXI6IFNoYXBlSGVscGVyKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmhhc092ZXJsYXBwaW5nQm91bmRpbmdCb3hXaXRoKHNoYXBlSGVscGVyKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgaWYgKHNoLmNvbGxpZGVzV2l0aChzaGFwZUhlbHBlcikpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRIaXRQb2x5Z29uRGlydHkoZGlydHk6IGJvb2xlYW4pIHtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgc2guc2V0SGl0UG9seWdvbkRpcnR5KGRpcnR5KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29udGFpbnNQb2ludCh4OiBudW1iZXIsIHk6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuZGlzcGxheU9iamVjdC51cGRhdGVUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAgICAgbGV0IGJiID0gdGhpcy5kaXNwbGF5T2JqZWN0LmdldEJvdW5kcygpO1xyXG5cclxuICAgICAgICBpZiAoeCA8IGJiLmxlZnQgfHwgeCA+IGJiLmxlZnQgKyBiYi53aWR0aCB8fCB5IDwgYmIudG9wIHx8IHkgPiBiYi50b3AgKyBiYi5oZWlnaHQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgc2hhcGUgb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zaGFwZS5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIGlmIChzaC5jb250YWluc1BvaW50KHgsIHkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29sbGlkaW5nT2JqZWN0cyhzaGFwZTogUnVudGltZU9iamVjdCk6IFJ1bnRpbWVPYmplY3RbXSB7XHJcblxyXG4gICAgICAgIGxldCBjb2xsaWRpbmdTaGFwZXM6IFJ1bnRpbWVPYmplY3RbXSA9IFtdO1xyXG4gICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSA8U2hhcGVIZWxwZXI+c2hhcGUuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzIG9mIHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgICAgIGxldCBzaDogU2hhcGVIZWxwZXIgPSA8U2hhcGVIZWxwZXI+cy5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIGlmIChzaC5jb2xsaWRlc1dpdGgoc2hhcGVIZWxwZXIpKSB7XHJcbiAgICAgICAgICAgICAgICBjb2xsaWRpbmdTaGFwZXMucHVzaChzKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGNvbGxpZGluZ1NoYXBlcztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29sbGlkaW5nT2JqZWN0czIoZ3JvdXBIZWxwZXIyOiBHcm91cEhlbHBlciwgY29sbGlzaW9uUGFpclR5cGU6IFR5cGUsXHJcbiAgICAgICAgbWF4T25lQ29sbGlzaW9uUGVyU2hhcGU6IGJvb2xlYW4pOiBWYWx1ZVtdIHtcclxuXHJcbiAgICAgICAgbGV0IGNvbGxpc2lvblBhaXJzOiBWYWx1ZVtdID0gW107XHJcblxyXG4gICAgICAgIGxldCBhbHJlYWR5Q29sbGlkZWRIZWxwZXJzMjogTWFwPFNoYXBlSGVscGVyLCBib29sZWFuPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgc2hhcGUxIG9mIHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjE6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlMS5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIGZvciAobGV0IHNoYXBlMiBvZiBncm91cEhlbHBlcjIuc2hhcGVzKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hhcGVIZWxwZXIyOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zaGFwZTIuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNoYXBlSGVscGVyMS5jb2xsaWRlc1dpdGgoc2hhcGVIZWxwZXIyKSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoIW1heE9uZUNvbGxpc2lvblBlclNoYXBlIHx8IGFscmVhZHlDb2xsaWRlZEhlbHBlcnMyLmdldChzaGFwZUhlbHBlcjIpID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWxyZWFkeUNvbGxpZGVkSGVscGVyczIuc2V0KHNoYXBlSGVscGVyMiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBydG86IFJ1bnRpbWVPYmplY3QgPSBuZXcgUnVudGltZU9iamVjdCg8S2xhc3M+Y29sbGlzaW9uUGFpclR5cGUpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgcnRvLmludHJpbnNpY0RhdGFbXCJTaGFwZUFcIl0gPSBzaGFwZUhlbHBlcjEucnVudGltZU9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcnRvLmludHJpbnNpY0RhdGFbXCJTaGFwZUJcIl0gPSBzaGFwZUhlbHBlcjIucnVudGltZU9iamVjdDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGlzaW9uUGFpcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBjb2xsaXNpb25QYWlyVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBydG9cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAobWF4T25lQ29sbGlzaW9uUGVyU2hhcGUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29sbGlzaW9uUGFpcnM7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGhhc0NpcmN1bGFyUmVmZXJlbmNlKHNoYXBlVG9BZGQ6IFJ1bnRpbWVPYmplY3QpIHtcclxuICAgICAgICBsZXQgZ2ggPSBzaGFwZVRvQWRkLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICBpZiAoZ2ggaW5zdGFuY2VvZiBHcm91cEhlbHBlcikge1xyXG4gICAgICAgICAgICBpZiAoZ2ggPT0gdGhpcykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkVpbmUgR3JvdXAgZGFyZiBzaWNoIG5pY2h0IHNlbGJzdCBlbnRoYWx0ZW4hXCIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiBnaC5zaGFwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5oYXNDaXJjdWxhclJlZmVyZW5jZShzaGFwZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHRpbnQoY29sb3I6IHN0cmluZykge1xyXG4gICAgICAgIGZvciAobGV0IGNoaWxkIG9mIHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgICAgICg8U2hhcGVIZWxwZXI+Y2hpbGQuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdKS50aW50KGNvbG9yKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxufVxyXG4iXX0=