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
            if (sh.testdestroyed("empty"))
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
    }
}
export class GroupHelper extends ShapeHelper {
    constructor(interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.shapes = [];
        this.displayObject = new PIXI.Container();
        this.worldHelper.stage.addChild(this.displayObject);
        this.addToDefaultGroup();
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
        shapeHelper.belongsToGroup = this;
        let inverse = new PIXI.Matrix().copyFrom(this.displayObject.transform.worldTransform);
        inverse.invert();
        shapeHelper.displayObject.localTransform.prepend(inverse.prepend(this.worldHelper.stage.localTransform));
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
    collidesWith(shapeHelper) {
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
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR3JvdXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL0dyb3VwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDbEUsT0FBTyxFQUF1QixnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3hJLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFTLFNBQVMsRUFBUSxNQUFNLCtCQUErQixDQUFDO0FBQzlGLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUluRSxPQUFPLEVBQUUsV0FBVyxFQUFjLE1BQU0sWUFBWSxDQUFDO0FBRXJELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUsxRCxNQUFNLE9BQU8sa0JBQW1CLFNBQVEsS0FBSztJQUV6QyxZQUFZLE1BQWM7UUFFdEIsS0FBSyxDQUFDLGVBQWUsRUFBRSxNQUFNLEVBQUUseUlBQXlJLENBQUMsQ0FBQztRQUUxSyxJQUFJLENBQUMsWUFBWSxDQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsU0FBUyxFQUMvQyxDQUFDLEtBQUssRUFBRSxFQUFFO1lBRU4sSUFBSSxHQUFHLEdBQWtCLEtBQUssQ0FBQyxNQUFNLENBQUM7WUFDdEMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlDLENBQUMsRUFBRSxL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QUFhLENBQUM7d0JBQ3pELGNBQWMsQ0FBQyxJQUFJLENBQUM7NEJBQ2hCLElBQUksRUFBRSxpQkFBaUI7NEJBQ3ZCLEtBQUssRUFBRSxHQUFHO3lCQUNiLENBQUMsQ0FBQztxQkFDTjtvQkFFRCxJQUFJLHVCQUF1QixFQUFFO3dCQUN6QixNQUFNO3FCQUNUO2lCQUNKO2FBQ0o7U0FDSjtRQUVELE9BQU8sY0FBYyxDQUFDO0lBRTFCLENBQUM7SUFFRCxvQkFBb0IsQ0FBQyxVQUF5QjtRQUMxQyxJQUFJLEVBQUUsR0FBRyxVQUFVLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzNDLElBQUksRUFBRSxZQUFZLFdBQVcsRUFBRTtZQUMzQixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLDhDQUE4QyxDQUFDLENBQUM7Z0JBQzVGLE9BQU8sSUFBSSxDQUFDO2FBQ2Y7aUJBQU07Z0JBQ0gsS0FBSyxJQUFJLEtBQUssSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFO29CQUN6QixJQUFJLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDbEMsT0FBTyxJQUFJLENBQUM7cUJBQ2Y7b0JBQUEsQ0FBQztpQkFDTDthQUNKO1NBQ0o7UUFDRCxPQUFPLEtBQUssQ0FBQztJQUNqQixDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcywgVmlzaWJpbGl0eSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBkb3VibGVQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBib29sZWFuUHJpbWl0aXZlVHlwZSwgdm9pZFByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSwgQXR0cmlidXRlLCBUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBGaWxsZWRTaGFwZUhlbHBlciB9IGZyb20gXCIuL0ZpbGxlZFNoYXBlLmpzXCI7XHJcbmltcG9ydCB7IFdvcmxkSGVscGVyIH0gZnJvbSBcIi4vV29ybGQuanNcIjtcclxuaW1wb3J0IHsgRW51bVJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvRW51bS5qc1wiO1xyXG5pbXBvcnQgeyBTaGFwZUhlbHBlciwgU2hhcGVDbGFzcyB9IGZyb20gXCIuL1NoYXBlLmpzXCI7XHJcbmltcG9ydCB7IEhpdFBvbHlnb25TdG9yZSB9IGZyb20gXCIuL1BvbHlnb25TdG9yZS5qc1wiO1xyXG5pbXBvcnQgeyBBcnJheVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQXJyYXkuanNcIjtcclxuaW1wb3J0IHsgUG9pbnQsIFBSRUNJU0lPTiwgVGlsaW5nU3ByaXRlIH0gZnJvbSBcInBpeGkuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJwcmV0ZXIgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQ29sbGlzaW9uUGFpckNsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiQ29sbGlzaW9uUGFpclwiLCBtb2R1bGUsIFwiU3BlaWNoZXJ0IGRpZSBSZWZlcmVuemVuIGF1ZiB6d2VpIEZpZ3VyZW4sIGRpZSBnZXJhZGUga29sbGlkaWVydCBzaW5kLiBEaWVzZSBLbGFzc2Ugdm9uIGRlbiBLb2xsaXNpb25zbWV0aGRlbiBkZXIgS2xhc3NlIEdyb3VwIGJlbnV0enQuXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpKTtcclxuXHJcbiAgICAgICAgbGV0IHNoYXBlVHlwZSA9IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIlNoYXBlXCIpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwic2hhcGVBXCIsIHNoYXBlVHlwZSxcclxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJ0bzogUnVudGltZU9iamVjdCA9IHZhbHVlLm9iamVjdDtcclxuICAgICAgICAgICAgICAgIHZhbHVlLnZhbHVlID0gcnRvLmludHJpbnNpY0RhdGFbXCJTaGFwZUFcIl07XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiRXJzdGVzIGFuIGRlciBLb2xsaXNpb24gYmV0ZWlsaWd0ZXMgU2hhcGVcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwic2hhcGVCXCIsIHNoYXBlVHlwZSxcclxuICAgICAgICAgICAgKHZhbHVlKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJ0bzogUnVudGltZU9iamVjdCA9IHZhbHVlLm9iamVjdDtcclxuICAgICAgICAgICAgICAgIHZhbHVlLnZhbHVlID0gcnRvLmludHJpbnNpY0RhdGFbXCJTaGFwZUJcIl07XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgVmlzaWJpbGl0eS5wdWJsaWMsIHRydWUsIFwiWndlaXRlcyBhbiBkZXIgS29sbGlzaW9uIGJldGVpbGlndGVzIFNoYXBlXCIpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBBdHRyaWJ1dGVJbmRpY2VzUmVjdXJzaXZlKCk7XHJcblxyXG4gICAgfVxyXG59XHJcblxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBHcm91cENsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiR3JvdXBcIiwgbW9kdWxlLCBcIktsYXNzZSB6dW0gR3J1cHBpZXJlbiBncmFmaXNjaGVyIEVsZW1lbnRlLiBEaWUgZ3J1cHBpZXJ0ZW4gRWxlbWVudGUga8O2bm5lbiBtaXRlaW5hbmRlciB2ZXJzY2hvYmVuLCBnZWRyZWh0LCBnZXN0cmVja3Qgc293aWUgZWluLSB1bmQgYXVzZ2VibGVuZGV0IHdlcmRlbi4gWnVkZW0gYmVzaXR6dCBkaWUgS2xhc3NlIE1ldGhvZGVuIHp1ciBzY2huZWxsZW4gRXJrZW5udW5nIHZvbiBLb2xsaXNpb24gbWl0IEVsZW1lbnRlbiBhdcOfZXJoYWxiIGRlciBHcnVwcGUuXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIikpO1xyXG5cclxuICAgICAgICBsZXQgY29sbGlzaW9uUGFpclR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJDb2xsaXNpb25QYWlyXCIpO1xyXG4gICAgICAgIGxldCBjb2xsaXNpb25QYWlyQXJyYXlUeXBlID0gbmV3IEFycmF5VHlwZShjb2xsaXNpb25QYWlyVHlwZSk7XHJcbiAgICAgICAgbGV0IHNoYXBlVHlwZSA9IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIlNoYXBlXCIpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIkdyb3VwXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHJoID0gbmV3IEdyb3VwSGVscGVyKG1vZHVsZS5tYWluLmdldEludGVycHJldGVyKCksIG8pO1xyXG4gICAgICAgICAgICAgICAgby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSByaDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbmUgbmV1ZSBHcnVwcGUuIElociBrw7ZubmVuIG1pdCBkZXIgTWV0aG9kZSBhZGQgRWxlbWVudGUgaGluenVnZWbDvGd0IHdlcmRlbiwgZGllIGRhbm4gbWl0IGRlciBHcnVwcGUgdmVyc2Nob2JlbiwgZ2VkcmVodCwgLi4uIHdlcmRlbi4nLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJHcm91cFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJzaGFwZXNcIiwgdHlwZTogbmV3IEFycmF5VHlwZShtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJTaGFwZVwiKSksIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSwgaXNFbGxpcHNpczogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZXM6IFZhbHVlW10gPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCByaCA9IG5ldyBHcm91cEhlbHBlcihtb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gcmg7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgcyBvZiBzaGFwZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICByaC5hZGQocy52YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdJbnN0YW56aWVydCBlaW5lIG5ldWUgR3J1cHBlIHVuZCBmw7xndCBkaWUgw7xiZXJnZWJlbmVuIEdyYWZpa29iamVrdGUgZGVyIEdydXBwZSBoaW56dS4gRGVyIEdydXBwZSBrw7ZubmVuIG1pdCBkZXIgTWV0aG9kZSBhZGQgd2VpdGVyZSBHcmFmaWtvYmpla3RlIGhpbnp1Z2Vmw7xndCB3ZXJkZW4sIGRpZSBkYW5uIG1pdCBkZXIgR3J1cHBlIHZlcnNjaG9iZW4sIGdlZHJlaHQsIC4uLiB3ZXJkZW4uJywgdHJ1ZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiYWRkXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNoYXBlc1wiLCB0eXBlOiBuZXcgQXJyYXlUeXBlKHNoYXBlVHlwZSksIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSwgaXNFbGxpcHNpczogdHJ1ZSB9LFxyXG5cclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hhcGVzOiBWYWx1ZVtdID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJhZGRcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBzIG9mIHNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHNoLmFkZChzLnZhbHVlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0bDvGd0IGRpZSBHcmFmaWtvYmpla3RlIGRlciBHcnVwcGUgaGluenUuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJpbmRleFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuXHJcbiAgICAgICAgXSksIHNoYXBlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgaW5kZXg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IEdyb3VwSGVscGVyID0gPEdyb3VwSGVscGVyPm8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiZ2V0XCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldEVsZW1lbnQoaW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnR2lidCBkYXMgR3JhZmlrZWxlbWVudCBkZXIgR3J1cHBlIG1pdCBkZW0gZW50c3ByZWNoZW5kZW4gSW5kZXggenVyw7xjay4gVk9SU0lDSFQ6IERhcyBlcnN0ZSBFbGVtZW50IGhhdCBJbmRleCAwIScsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZW1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaW5kZXhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcblxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgc2gucmVtb3ZlRWxlbWVudEF0KGluZGV4KTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0VudGZlcm50IGRhcyBHcmFmaWtlbGVtZW50IGF1cyBkZXIgR3J1cHBlIG1pdCBkZW0gZW50c3ByZWNoZW5kZW4gSW5kZXgsIHplcnN0w7ZydCBlcyBqZWRvY2ggbmljaHQuIFZPUlNJQ0hUOiBEYXMgZXJzdGUgRWxlbWVudCBoYXQgSW5kZXggMCEnLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVtb3ZlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNoYXBlXCIsIHR5cGU6IHNoYXBlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcblxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZTogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IEdyb3VwSGVscGVyID0gPEdyb3VwSGVscGVyPm8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwicmVtb3ZlXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2gucmVtb3ZlKHNoYXBlKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0VudGZlcm50IGRhcyDDvGJlcmdlYmVuZSBHcmFmaWtlbGVtZW50IGF1cyBkZXIgR3J1cHBlLCB6ZXJzdMO2cnQgZXMgamVkb2NoIG5pY2h0LicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgICAgICBsZXQgc2hhcGVBcnJheVR5cGUgPSBuZXcgQXJyYXlUeXBlKHNoYXBlVHlwZSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJnZXRDb2xsaWRpbmdTaGFwZXNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwic2hhcGVcIiwgdHlwZTogbW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiU2hhcGVcIiksIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG5cclxuICAgICAgICBdKSwgc2hhcGVBcnJheVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoYXBlOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSA8R3JvdXBIZWxwZXI+by5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJnZXRDb2xsaWRpbmdTaGFwZXNcIikgfHwgc2hhcGUgPT0gbnVsbCkgcmV0dXJuIFtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZXM6IFJ1bnRpbWVPYmplY3RbXSA9IHNoLmdldENvbGxpZGluZ09iamVjdHMoc2hhcGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB2YWx1ZXM6IFZhbHVlW10gPSBbXTtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHNoIG9mIHNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogc2hhcGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZTogc2hcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnR2lidCBkaWUgT2JqZWt0ZSBkZXIgR3J1cHBlIHp1csO8Y2ssIGRpZSBtaXQgZGVtIMO8YmVyZ2ViZW5lbiBTaGFwZSBrb2xsaWRpZXJlbi4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0Q29sbGlzaW9uUGFpcnNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZ3JvdXBcIiwgdHlwZTogdGhpcywgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJtYXhPbmVDb2xsaXNpb25QZXJTaGFwZVwiLCB0eXBlOiBib29sZWFuUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIGNvbGxpc2lvblBhaXJBcnJheVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGdyb3VwMjogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWF4T25lQ29sbGlzaW9uUGVyU2hhcGU6IGJvb2xlYW4gPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBHcm91cEhlbHBlciA9IDxHcm91cEhlbHBlcj5vLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgICAgIGxldCBncm91cEhlbHBlcjI6IEdyb3VwSGVscGVyID0gPEdyb3VwSGVscGVyPmdyb3VwMi5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJnZXRDb2xsaWRpbmdTaGFwZXNcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2guZ2V0Q29sbGlkaW5nT2JqZWN0czIoZ3JvdXBIZWxwZXIyLCBjb2xsaXNpb25QYWlyVHlwZSwgbWF4T25lQ29sbGlzaW9uUGVyU2hhcGUpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnw5xiZXJwcsO8ZnQsIHdlbGNoZSBPYmpla3RlIGRlciBHcnVwcGUgbWl0IHdlbGNoZW4gZGVyIGFuZGVyZW4ga29sbGlkaWVyZW4uJyArXHJcbiAgICAgICAgICAgICcgR2lidCBmw7xyIGplZGUgS29sbGlzaW9uIGVpbiBDb2xsaXNpb25wYWlyLU9iamVrdCB6dXLDvGNrLCBkYXMgZGllIGJlaWRlbiBrb2xsaWRpZXJlbmRlbiBPYmpla3RlIGVudGjDpGx0LicgK1xyXG4gICAgICAgICcgRmFsbHMgbWF4T25lQ29sbGlzaW9uUGVyU2hhcGUgPT0gdHJ1ZSBpc3QgamVkZXMgT2JqZWt0IGRhYmVpIGFiZXIgbnVyIGluIG1heC4gZWluZW0gQ29sbGlzaW9ucGFpci1PYmpla3QgZW50aGFsdGVuLicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2l6ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBHcm91cEhlbHBlciA9IDxHcm91cEhlbHBlcj5vLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcInNpemVcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2guc2hhcGVzLmxlbmd0aDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgenVyw7xjaywgd2llIHZpZWxlIEVsZW1lbnRlIGluIGRlciBHcnVwcGUgZW50aGFsdGVuIHNpbmQuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImVtcHR5XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBHcm91cEhlbHBlciA9IDxHcm91cEhlbHBlcj5vLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImVtcHR5XCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2gucmVtb3ZlQWxsQ2hpZHJlbigpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnRW50ZmVybnQgYWxsZSBFbGVtZW50ZSBhdXMgZGVyIEdydXBwZSwgbMO2c2NodCBkaWUgRWxlbWVudGUgYWJlciBuaWNodC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZGVzdHJveUFsbENoaWxkcmVuXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgdm9pZFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBHcm91cEhlbHBlciA9IDxHcm91cEhlbHBlcj5vLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImVtcHR5XCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2guZGVzdHJveUNoaWxkcmVuKCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdMw7ZzY2h0IGFsbGUgRWxlbWVudGUgZGVyIEdydXBwZSwgbmljaHQgYWJlciBkaWUgR3J1cHBlIHNlbGJzdC4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICAgICAgKDxLbGFzcz5zaGFwZVR5cGUpLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0Q29sbGlkaW5nU2hhcGVzXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImdyb3VwXCIsIHR5cGU6IHRoaXMsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBzaGFwZUFycmF5VHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgZ3JvdXA6IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGdyb3VwSGVscGVyOiBHcm91cEhlbHBlciA9IGdyb3VwLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogU2hhcGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImdldENvbGxpZGluZ1NoYXBlc1wiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBzaC5nZXRDb2xsaWRpbmdTaGFwZXMoZ3JvdXBIZWxwZXIsIHNoYXBlVHlwZSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGFsbGUgU2hhcGVzIGRlciBHcnVwcGUgZ3JvdXAgenVyw7xjaywgZGllIG1pdCBkZW0gU2hhcGUga29sbGlkaWVyZW4uJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImNvcHlcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCB0aGlzLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogR3JvdXBIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImNvcHlcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2guZ2V0Q29weSg8S2xhc3M+by5jbGFzcyk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdFcnN0ZWxsdCBlaW5lIEtvcGllIGRlcyBHcm91cC1PYmpla3RzICh1bmQgYWxsZXIgc2VpbmVyIGVudGhhbHRlbmVuIEdyYWZpa29iamVrdGUhKSB1bmQgZ2l0IHNpZSB6dXLDvGNrLicsIGZhbHNlKSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBHcm91cEhlbHBlciBleHRlbmRzIFNoYXBlSGVscGVyIHtcclxuXHJcbiAgICBzaGFwZXM6IFJ1bnRpbWVPYmplY3RbXSA9IFtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuICAgICAgICB0aGlzLmRpc3BsYXlPYmplY3QgPSBuZXcgUElYSS5Db250YWluZXIoKTtcclxuICAgICAgICB0aGlzLndvcmxkSGVscGVyLnN0YWdlLmFkZENoaWxkKHRoaXMuZGlzcGxheU9iamVjdCk7XHJcbiAgICAgICAgdGhpcy5hZGRUb0RlZmF1bHRHcm91cCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVFbGVtZW50QXQoaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5zaGFwZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJJbiBkZXIgR3J1cHBlIGdpYnQgZXMga2VpbiBFbGVtZW50IG1pdCBJbmRleCBcIiArIGluZGV4ICsgXCIuXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgc2hhcGUgPSB0aGlzLnNoYXBlc1tpbmRleF07XHJcbiAgICAgICAgdGhpcy5yZW1vdmUoc2hhcGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEVsZW1lbnQoaW5kZXg6IG51bWJlcik6IFJ1bnRpbWVPYmplY3Qge1xyXG4gICAgICAgIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0gdGhpcy5zaGFwZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJJbiBkZXIgR3J1cHBlIGdpYnQgZXMga2VpbiBFbGVtZW50IG1pdCBJbmRleCBcIiArIGluZGV4ICsgXCIuXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLnNoYXBlc1tpbmRleF07XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29weShrbGFzczogS2xhc3MpOiBSdW50aW1lT2JqZWN0IHtcclxuXHJcbiAgICAgICAgbGV0IHJvOiBSdW50aW1lT2JqZWN0ID0gbmV3IFJ1bnRpbWVPYmplY3Qoa2xhc3MpO1xyXG4gICAgICAgIGxldCBncm91cEhlbHBlckNvcHk6IEdyb3VwSGVscGVyID0gbmV3IEdyb3VwSGVscGVyKHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIsIHJvKTtcclxuICAgICAgICByby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSBncm91cEhlbHBlckNvcHk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHJvIG9mIHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSByby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICBsZXQgcm9Db3B5OiBSdW50aW1lT2JqZWN0ID0gc2hhcGVIZWxwZXIuZ2V0Q29weSg8S2xhc3M+cm8uY2xhc3MpXHJcbiAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlckNvcHk6IFNoYXBlSGVscGVyID0gcm9Db3B5LmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgIGdyb3VwSGVscGVyQ29weS5zaGFwZXMucHVzaChyb0NvcHkpO1xyXG5cclxuICAgICAgICAgICAgc2hhcGVIZWxwZXJDb3B5LmJlbG9uZ3NUb0dyb3VwID0gZ3JvdXBIZWxwZXJDb3B5O1xyXG5cclxuICAgICAgICAgICAgKDxQSVhJLkNvbnRhaW5lcj5ncm91cEhlbHBlckNvcHkuZGlzcGxheU9iamVjdCkuYWRkQ2hpbGQoc2hhcGVIZWxwZXJDb3B5LmRpc3BsYXlPYmplY3QpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGdyb3VwSGVscGVyQ29weS5jb3B5RnJvbSh0aGlzKTtcclxuICAgICAgICBncm91cEhlbHBlckNvcHkucmVuZGVyKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBybztcclxuICAgIH1cclxuXHJcbiAgICBzZXRUaW1lclBhdXNlZCh0cDogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMudGltZXJQYXVzZWQgPSB0cDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgc2hhcGUgb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zaGFwZS5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIHNoLnRpbWVyUGF1c2VkID0gdHA7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgYWRkKHNoYXBlOiBSdW50aW1lT2JqZWN0KSB7XHJcblxyXG4gICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSA8U2hhcGVIZWxwZXI+c2hhcGUuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICBpZiAoc2hhcGVIZWxwZXIuaXNEZXN0cm95ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlci50aHJvd0V4Y2VwdGlvbihcIkVpbiBzY2hvbiB6ZXJzdMO2cnRlcyBPYmpla3Qga2FubiBrZWluZXIgR3J1cHBlIGhpbnp1Z2Vmw7xndCB3ZXJkZW4uXCIpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5oYXNDaXJjdWxhclJlZmVyZW5jZShzaGFwZSkpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5zaGFwZXMucHVzaChzaGFwZSk7XHJcblxyXG4gICAgICAgIGlmIChzaGFwZUhlbHBlci5iZWxvbmdzVG9Hcm91cCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHNoYXBlSGVscGVyLmJlbG9uZ3NUb0dyb3VwLnJlbW92ZShzaGFwZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzaGFwZUhlbHBlci5iZWxvbmdzVG9Hcm91cCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBpbnZlcnNlID0gbmV3IFBJWEkuTWF0cml4KCkuY29weUZyb20odGhpcy5kaXNwbGF5T2JqZWN0LnRyYW5zZm9ybS53b3JsZFRyYW5zZm9ybSk7XHJcbiAgICAgICAgaW52ZXJzZS5pbnZlcnQoKTtcclxuICAgICAgICBzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0LmxvY2FsVHJhbnNmb3JtLnByZXBlbmQoaW52ZXJzZS5wcmVwZW5kKHRoaXMud29ybGRIZWxwZXIuc3RhZ2UubG9jYWxUcmFuc2Zvcm0pKTtcclxuICAgICAgICBzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0LnRyYW5zZm9ybS5vbkNoYW5nZSgpO1xyXG5cclxuICAgICAgICAoPFBJWEkuQ29udGFpbmVyPnRoaXMuZGlzcGxheU9iamVjdCkuYWRkQ2hpbGQoc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdCk7XHJcbiAgICAgICAgc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC51cGRhdGVUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAgICAgbGV0IHhTdW06IG51bWJlciA9IDA7XHJcbiAgICAgICAgbGV0IHlTdW06IG51bWJlciA9IDA7XHJcblxyXG4gICAgICAgIGZvciAobGV0IHNoYXBlIG9mIHRoaXMuc2hhcGVzKSB7XHJcbiAgICAgICAgICAgIGxldCBzaDogU2hhcGVIZWxwZXIgPSA8U2hhcGVIZWxwZXI+c2hhcGUuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG4gICAgICAgICAgICB4U3VtICs9IHNoLmdldENlbnRlclgoKTtcclxuICAgICAgICAgICAgeVN1bSArPSBzaC5nZXRDZW50ZXJZKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgeCA9IHhTdW0gLyB0aGlzLnNoYXBlcy5sZW5ndGg7XHJcbiAgICAgICAgbGV0IHkgPSB5U3VtIC8gdGhpcy5zaGFwZXMubGVuZ3RoO1xyXG5cclxuICAgICAgICB0aGlzLmRpc3BsYXlPYmplY3QudXBkYXRlVHJhbnNmb3JtKCk7XHJcbiAgICAgICAgbGV0IHAxOiBQSVhJLlBvaW50ID0gdGhpcy5kaXNwbGF5T2JqZWN0LndvcmxkVHJhbnNmb3JtLmFwcGx5SW52ZXJzZShuZXcgUElYSS5Qb2ludCh4LCB5KSk7XHJcblxyXG4gICAgICAgIHRoaXMuY2VudGVyWEluaXRpYWwgPSBwMS54O1xyXG4gICAgICAgIHRoaXMuY2VudGVyWUluaXRpYWwgPSBwMS55O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZW1vdmVBbGxDaGlkcmVuKCkge1xyXG4gICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gMDtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICB0aGlzLmRlcmVnaXN0ZXIoc2hhcGUsIGluZGV4KyspO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNoYXBlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZW1vdmUoc2hhcGU6IFJ1bnRpbWVPYmplY3QpIHtcclxuICAgICAgICBsZXQgaW5kZXggPSB0aGlzLnNoYXBlcy5pbmRleE9mKHNoYXBlKTtcclxuICAgICAgICBpZiAoaW5kZXggPj0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnNoYXBlcy5zcGxpY2UoaW5kZXgsIDEpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5kZXJlZ2lzdGVyKHNoYXBlLCBpbmRleCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgZGVyZWdpc3RlcihzaGFwZTogUnVudGltZU9iamVjdCwgaW5kZXg6IG51bWJlcikge1xyXG4gICAgICAgIGxldCBzaGFwZUhlbHBlcjogU2hhcGVIZWxwZXIgPSBzaGFwZS5pbnRyaW5zaWNEYXRhWydBY3RvciddO1xyXG5cclxuICAgICAgICBsZXQgdHJhbnNmb3JtID0gbmV3IFBJWEkuTWF0cml4KCkuY29weUZyb20oc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC50cmFuc2Zvcm0ud29ybGRUcmFuc2Zvcm0pO1xyXG5cclxuICAgICAgICAoPFBJWEkuQ29udGFpbmVyPnRoaXMuZGlzcGxheU9iamVjdCkucmVtb3ZlQ2hpbGRBdChpbmRleCk7XHJcblxyXG4gICAgICAgIGxldCBpbnZlcnNlU3RhZ2VUcmFuc2Zvcm0gPSBuZXcgUElYSS5NYXRyaXgoKS5jb3B5RnJvbSh0aGlzLndvcmxkSGVscGVyLnN0YWdlLmxvY2FsVHJhbnNmb3JtKTtcclxuICAgICAgICBpbnZlcnNlU3RhZ2VUcmFuc2Zvcm0uaW52ZXJ0KCk7XHJcbiAgICAgICAgc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC5sb2NhbFRyYW5zZm9ybS5pZGVudGl0eSgpO1xyXG4gICAgICAgIHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QubG9jYWxUcmFuc2Zvcm0uYXBwZW5kKHRyYW5zZm9ybS5wcmVwZW5kKGludmVyc2VTdGFnZVRyYW5zZm9ybSkpO1xyXG4gICAgICAgIHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QudHJhbnNmb3JtLm9uQ2hhbmdlKCk7XHJcbiAgICAgICAgdGhpcy53b3JsZEhlbHBlci5zdGFnZS5hZGRDaGlsZChzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0KTtcclxuICAgICAgICBzaGFwZUhlbHBlci5kaXNwbGF5T2JqZWN0LnVwZGF0ZVRyYW5zZm9ybSgpO1xyXG4gICAgICAgIHNoYXBlSGVscGVyLmJlbG9uZ3NUb0dyb3VwID0gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHB1YmxpYyByZW5kZXIoKTogdm9pZCB7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3koKTogdm9pZCB7XHJcbiAgICAgICAgdGhpcy5kZXN0cm95Q2hpbGRyZW4oKTtcclxuICAgICAgICBzdXBlci5kZXN0cm95KCk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlc3Ryb3lDaGlsZHJlbigpOiB2b2lkIHtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcy5zbGljZSgwKSkge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgc2guZGVzdHJveSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnNoYXBlcyA9IFtdO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjb2xsaWRlc1dpdGgoc2hhcGVIZWxwZXI6IFNoYXBlSGVscGVyKSB7XHJcbiAgICAgICAgZm9yIChsZXQgc2hhcGUgb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zaGFwZS5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIGlmIChzaC5jb2xsaWRlc1dpdGgoc2hhcGVIZWxwZXIpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0SGl0UG9seWdvbkRpcnR5KGRpcnR5OiBib29sZWFuKSB7XHJcbiAgICAgICAgZm9yIChsZXQgc2hhcGUgb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zaGFwZS5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgIHNoLnNldEhpdFBvbHlnb25EaXJ0eShkaXJ0eSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNvbnRhaW5zUG9pbnQoeDogbnVtYmVyLCB5OiBudW1iZXIpIHtcclxuICAgICAgICBmb3IgKGxldCBzaGFwZSBvZiB0aGlzLnNoYXBlcykge1xyXG4gICAgICAgICAgICBsZXQgc2g6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgaWYgKHNoLmNvbnRhaW5zUG9pbnQoeCwgeSkpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb2xsaWRpbmdPYmplY3RzKHNoYXBlOiBSdW50aW1lT2JqZWN0KTogUnVudGltZU9iamVjdFtdIHtcclxuXHJcbiAgICAgICAgbGV0IGNvbGxpZGluZ1NoYXBlczogUnVudGltZU9iamVjdFtdID0gW107XHJcbiAgICAgICAgbGV0IHNoYXBlSGVscGVyOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zaGFwZS5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgIGZvciAobGV0IHMgb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoOiBTaGFwZUhlbHBlciA9IDxTaGFwZUhlbHBlcj5zLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgaWYgKHNoLmNvbGxpZGVzV2l0aChzaGFwZUhlbHBlcikpIHtcclxuICAgICAgICAgICAgICAgIGNvbGxpZGluZ1NoYXBlcy5wdXNoKHMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29sbGlkaW5nU2hhcGVzO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRDb2xsaWRpbmdPYmplY3RzMihncm91cEhlbHBlcjI6IEdyb3VwSGVscGVyLCBjb2xsaXNpb25QYWlyVHlwZTogVHlwZSxcclxuICAgICAgICBtYXhPbmVDb2xsaXNpb25QZXJTaGFwZTogYm9vbGVhbik6IFZhbHVlW10ge1xyXG5cclxuICAgICAgICBsZXQgY29sbGlzaW9uUGFpcnM6IFZhbHVlW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGFscmVhZHlDb2xsaWRlZEhlbHBlcnMyOiBNYXA8U2hhcGVIZWxwZXIsIGJvb2xlYW4+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzaGFwZTEgb2YgdGhpcy5zaGFwZXMpIHtcclxuICAgICAgICAgICAgbGV0IHNoYXBlSGVscGVyMTogU2hhcGVIZWxwZXIgPSA8U2hhcGVIZWxwZXI+c2hhcGUxLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgc2hhcGUyIG9mIGdyb3VwSGVscGVyMi5zaGFwZXMpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzaGFwZUhlbHBlcjI6IFNoYXBlSGVscGVyID0gPFNoYXBlSGVscGVyPnNoYXBlMi5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcbiAgICAgICAgICAgICAgICBpZiAoc2hhcGVIZWxwZXIxLmNvbGxpZGVzV2l0aChzaGFwZUhlbHBlcjIpKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghbWF4T25lQ29sbGlzaW9uUGVyU2hhcGUgfHwgYWxyZWFkeUNvbGxpZGVkSGVscGVyczIuZ2V0KHNoYXBlSGVscGVyMikgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbHJlYWR5Q29sbGlkZWRIZWxwZXJzMi5zZXQoc2hhcGVIZWxwZXIyLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHJ0bzogUnVudGltZU9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KDxLbGFzcz5jb2xsaXNpb25QYWlyVHlwZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBydG8uaW50cmluc2ljRGF0YVtcIlNoYXBlQVwiXSA9IHNoYXBlSGVscGVyMS5ydW50aW1lT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBydG8uaW50cmluc2ljRGF0YVtcIlNoYXBlQlwiXSA9IHNoYXBlSGVscGVyMi5ydW50aW1lT2JqZWN0O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsaXNpb25QYWlycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGNvbGxpc2lvblBhaXJUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJ0b1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXhPbmVDb2xsaXNpb25QZXJTaGFwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBjb2xsaXNpb25QYWlycztcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaGFzQ2lyY3VsYXJSZWZlcmVuY2Uoc2hhcGVUb0FkZDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIGxldCBnaCA9IHNoYXBlVG9BZGQuaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG4gICAgICAgIGlmIChnaCBpbnN0YW5jZW9mIEdyb3VwSGVscGVyKSB7XHJcbiAgICAgICAgICAgIGlmIChnaCA9PSB0aGlzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkSGVscGVyLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRWluZSBHcm91cCBkYXJmIHNpY2ggbmljaHQgc2VsYnN0IGVudGhhbHRlbiFcIik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHNoYXBlIG9mIGdoLnNoYXBlcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmhhc0NpcmN1bGFyUmVmZXJlbmNlKHNoYXBlKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbn1cclxuIl19