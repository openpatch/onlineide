import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { ListHelper } from "./ArrayList.js";
import { ListIteratorImplClass } from "./ListIteratorImpl.js";
export class VectorClass extends Klass {
    constructor(module) {
        super("Vector", module, "Liste mit Zugriff auf das n-te Element in konstanter Zeit");
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
        this.addMethod(new Method("Vector", new Parameterlist([
        // { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = new ListHelper(o, module.main.getInterpreter(), module);
            o.intrinsicData["ListHelper"] = ah;
        }, false, false, 'Instanziert ein neues Vector-Objekt', true));
        this.addMethod(new Method("iterator", new Parameterlist([]), iteratorType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ListIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;
        }, false, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));
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
        }, false, false, "Entfernt das Element an der Stelle index. WICHTIG: Das erste Element hat den Index 0. Es ist 0 <= index < size()"));
        this.addMethod(new Method("indexOf", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.indexOf(object);
        }, false, false, "Gibt den Index des Elements o zurück. Gibt -1 zurück, wenn die Liste das Element o nicht enthält. WICHTIG: Das erste Element hat den Index 0, das letzte den Index size() - 1. "));
        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.adAll(object);
        }, false, false, "Fügt alle Elemente von c dieser Collection hinzu."));
        this.addMethod(new Method("clear", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.clear();
        }, false, false, "Entfernt alle Element aus dieser Collection."));
        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.contains(object);
        }, false, false, "Testet, ob die Collection das Element enthält."));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeA, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.removeObject(object);
        }, false, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));
        this.addMethod(new Method("isEmpty", new Parameterlist([]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.isEmpty();
        }, false, false, "Testet, ob die Collection das leer ist."));
        this.addMethod(new Method("size", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.size();
        }, false, false, "Gibt die Anzahl der Elemente der Collection zurück."));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmVjdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9WZWN0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBMkIsTUFBTSwrQkFBK0IsQ0FBQztBQUMvRSxPQUFPLEVBQXVCLG9CQUFvQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDckgsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQVMsTUFBTSwrQkFBK0IsQ0FBQztBQUk3RSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFFLHFCQUFxQixFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFOUQsTUFBTSxPQUFPLFdBQVksU0FBUSxLQUFLO0lBRWxDLFlBQVksTUFBYztRQUV0QixLQUFLLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSwyREFBMkQsQ0FBQyxDQUFDO1FBRXJGLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXBELElBQUksQ0FBQyxZQUFZLENBQVEsVUFBVSxDQUFDLENBQUM7UUFFckMsSUFBSSxLQUFLLEdBQWtCLFVBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUN2QixLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUU1QixJQUFJLEdBQUcsR0FBaUI7WUFDcEIsVUFBVSxFQUFFLEdBQUc7WUFDZixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtZQUM1QyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUs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QyxVQUFVLEVBQUUsRUFBRTtZQUVYLElBQUksQ0FBQyxHQUFrQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksRUFBRSxHQUFlLENBQUMsQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLENBQUM7WUFFbkQsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFckIsQ0FBQyxFQUNELEtBQUssRUFBRSxLQUFLLEVBQUUscURBQXFELENBQUMsQ0FBQyxDQUFDO0lBSzlFLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBUeXBlVmFyaWFibGUsIEludGVyZmFjZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBkb3VibGVQcmltaXRpdmVUeXBlLCBib29sZWFuUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBUaWxpbmdTcHJpdGUgfSBmcm9tIFwicGl4aS5qc1wiO1xyXG5pbXBvcnQgeyBMaXN0SGVscGVyIH0gZnJvbSBcIi4vQXJyYXlMaXN0LmpzXCI7XHJcbmltcG9ydCB7IExpc3RJdGVyYXRvckltcGxDbGFzcyB9IGZyb20gXCIuL0xpc3RJdGVyYXRvckltcGwuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBWZWN0b3JDbGFzcyBleHRlbmRzIEtsYXNzIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBzdXBlcihcIlZlY3RvclwiLCBtb2R1bGUsIFwiTGlzdGUgbWl0IFp1Z3JpZmYgYXVmIGRhcyBuLXRlIEVsZW1lbnQgaW4ga29uc3RhbnRlciBaZWl0XCIpO1xyXG5cclxuICAgICAgICBsZXQgb2JqZWN0VHlwZSA9IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm9iamVjdFR5cGUpO1xyXG5cclxuICAgICAgICBsZXQgdHlwZUE6IEtsYXNzID0gKDxLbGFzcz5vYmplY3RUeXBlKS5jbG9uZSgpO1xyXG4gICAgICAgIHR5cGVBLmlkZW50aWZpZXIgPSBcIkFcIjtcclxuICAgICAgICB0eXBlQS5pc1R5cGVWYXJpYWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIGxldCB0dkE6IFR5cGVWYXJpYWJsZSA9IHtcclxuICAgICAgICAgICAgaWRlbnRpZmllcjogXCJBXCIsXHJcbiAgICAgICAgICAgIHNjb3BlRnJvbTogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgICAgICBzY29wZVRvOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAxIH0sXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGVBXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy50eXBlVmFyaWFibGVzLnB1c2godHZBKTtcclxuXHJcbiAgICAgICAgbGV0IGxpc3RJbnRlcmZhY2UgPSAoPEludGVyZmFjZT5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJMaXN0XCIpKS5jbG9uZSgpO1xyXG4gICAgICAgIGxpc3RJbnRlcmZhY2UudHlwZVZhcmlhYmxlcyA9IFt0dkFdO1xyXG5cclxuICAgICAgICB0aGlzLmltcGxlbWVudHMucHVzaChsaXN0SW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgbGV0IGl0ZXJhdG9yVHlwZSA9ICg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiSXRlcmF0b3JcIikpLmNsb25lKCk7XHJcbiAgICAgICAgaXRlcmF0b3JUeXBlLnR5cGVWYXJpYWJsZXMgPSBbdHZBXTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIlZlY3RvclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIC8vIHsgaWRlbnRpZmllcjogXCJteFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFoID0gbmV3IExpc3RIZWxwZXIobywgbW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbW9kdWxlKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl0gPSBhaDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbiBuZXVlcyBWZWN0b3ItT2JqZWt0JywgdHJ1ZSkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIml0ZXJhdG9yXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgXSksIGl0ZXJhdG9yVHlwZSxcclxuICAgICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBMaXN0SXRlcmF0b3JJbXBsQ2xhc3MuZ2V0SXRlcmF0b3IoYWgsIGFoLmludGVycHJldGVyLCBtb2R1bGUsIFwiYXNjZW5kaW5nXCIpLnZhbHVlO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiR2lidCBlaW5lbiBJdGVyYXRvciDDvGJlciBkaWUgRWxlbWVudGUgZGllc2VyIENvbGxlY3Rpb24genVyw7xjay5cIikpO1xyXG4gICAgXHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZWxlbWVudFwiLCB0eXBlOiB0eXBlQSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHI6IFZhbHVlID0gcGFyYW1ldGVyc1sxXTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmFkZChyKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJGw7xndCBkZXIgTGlzdGUgZWluIEVsZW1lbnQgaGluenUuIEdpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gc2ljaCBkZXIgWnVzdGFuZCBkZXIgTGlzdGUgZGFkdXJjaCBnZcOkbmRlcnQgaGF0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJnZXRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaW5kZXhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgdHlwZUEsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGluZGV4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguZ2V0KGluZGV4KS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJHaWJ0IGRhcyBpLXRlIEVsZW1lbnQgZGVyIExpc3RlIHp1csO8Y2suXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJlbW92ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJpbmRleFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBpbmRleDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgYWgucmVtb3ZlKGluZGV4KS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJFbnRmZXJudCBkYXMgRWxlbWVudCBhbiBkZXIgU3RlbGxlIGluZGV4LiBXSUNIVElHOiBEYXMgZXJzdGUgRWxlbWVudCBoYXQgZGVuIEluZGV4IDAuIEVzIGlzdCAwIDw9IGluZGV4IDwgc2l6ZSgpXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImluZGV4T2ZcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwib1wiLCB0eXBlOiB0eXBlQSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0OiBWYWx1ZSA9IHBhcmFtZXRlcnNbMV07XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IExpc3RIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJMaXN0SGVscGVyXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhaC5pbmRleE9mKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiR2lidCBkZW4gSW5kZXggZGVzIEVsZW1lbnRzIG8genVyw7xjay4gR2lidCAtMSB6dXLDvGNrLCB3ZW5uIGRpZSBMaXN0ZSBkYXMgRWxlbWVudCBvIG5pY2h0IGVudGjDpGx0LiBXSUNIVElHOiBEYXMgZXJzdGUgRWxlbWVudCBoYXQgZGVuIEluZGV4IDAsIGRhcyBsZXR6dGUgZGVuIEluZGV4IHNpemUoKSAtIDEuIFwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRBbGxcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY1wiLCB0eXBlOiB0aGlzLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0OiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmFkQWxsKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiRsO8Z3QgYWxsZSBFbGVtZW50ZSB2b24gYyBkaWVzZXIgQ29sbGVjdGlvbiBoaW56dS5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY2xlYXJcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiRW50ZmVybnQgYWxsZSBFbGVtZW50IGF1cyBkaWVzZXIgQ29sbGVjdGlvbi5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29udGFpbnNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwib1wiLCB0eXBlOiB0eXBlQSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdDogVmFsdWUgPSBwYXJhbWV0ZXJzWzFdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguY29udGFpbnMob2JqZWN0KTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJUZXN0ZXQsIG9iIGRpZSBDb2xsZWN0aW9uIGRhcyBFbGVtZW50IGVudGjDpGx0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZW1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwib1wiLCB0eXBlOiB0eXBlQSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdDogVmFsdWUgPSBwYXJhbWV0ZXJzWzFdO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWgucmVtb3ZlT2JqZWN0KG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiRW50ZmVybnQgZGFzIEVsZW1lbnQgbyBhdXMgZGVyIENvbGxlY3Rpb24uIEdpYnQgdHJ1ZSB6dXLDvGNrLCB3ZW5uIGRpZSBDb2xsZWN0aW9uIGRhcyBFbGVtZW50IGVudGhhbHRlbiBoYXR0ZS5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXNFbXB0eVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogTGlzdEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmlzRW1wdHkoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJUZXN0ZXQsIG9iIGRpZSBDb2xsZWN0aW9uIGRhcyBsZWVyIGlzdC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2l6ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBMaXN0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguc2l6ZSgpO1xyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIkdpYnQgZGllIEFuemFobCBkZXIgRWxlbWVudGUgZGVyIENvbGxlY3Rpb24genVyw7xjay5cIikpO1xyXG5cclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbn1cclxuXHJcbiJdfQ==