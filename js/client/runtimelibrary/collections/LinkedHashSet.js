import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType, stringPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { SetIteratorImplClass } from "./SetIteratorImpl.js";
import { SetHelper } from "./SetHelper.js";
export class LinkedHashSetClass extends Klass {
    constructor(module) {
        super("LinkedHashSet", module, "Ein LinkedHashSet speichert jedes Element nur genau ein Mal.");
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
        let setInterface = module.typeStore.getType("Set").clone();
        setInterface.typeVariables = [tvE];
        this.implements.push(setInterface);
        let iteratorType = module.typeStore.getType("Iterator").clone();
        iteratorType.typeVariables = [tvE];
        this.addMethod(new Method("LinkedHashSet", new Parameterlist([
        // { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let mh = new SetHelper(o, module.main.getInterpreter(), module);
            o.intrinsicData["MapHelper"] = mh;
        }, false, false, 'Instanziert ein neues LinkedHashSet', true));
        this.addMethod(new Method("iterator", new Parameterlist([]), iteratorType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return SetIteratorImplClass.getIterator(ah, ah.interpreter, module, "ascending").value;
        }, false, false, "Gibt einen Iterator über die Elemente dieser Collection zurück."));
        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let r = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.addToSet(r);
        }, false, false, "Fügt der Liste ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Liste dadurch geändert hat."));
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
            { identifier: "o", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let object = parameters[1];
            let ah = o.intrinsicData["ListHelper"];
            return ah.contains(object);
        }, false, false, "Testet, ob die Collection das Element enthält."));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: typeE, declaration: null, usagePositions: null, isFinal: true }
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
        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["ListHelper"];
            return ah.to_String();
        }, false, false));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlua2VkSGFzaFNldC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvTGlua2VkSGFzaFNldC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQWEsS0FBSyxFQUFnQixNQUFNLCtCQUErQixDQUFDO0FBQy9FLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQ3JILE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFTLE1BQU0sK0JBQStCLENBQUM7QUFFN0UsT0FBTyxFQUFFLG9CQUFvQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDNUQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBRTNDLE1BQU0sT0FBTyxrQkFBbUIsU0FBUSxLQUFLO0lBRXpDLFlBQVksTUFBYztRQUV0QixLQUFLLENBQUMsZUFBZSxFQUFFLE1BQU0sRUFBRSw4REFBOEQsQ0FBQyxDQUFDO1FBRS9GLElBQUksVUFBVSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXBELElBQUksQ0FBQyxZQUFZLENBQVEsVUFBVSxDQUFDLENBQUM7UUFFckMsSUFBSSxLQUFLLEdBQWtCLFVBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUN2QixLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUU1QixJQUFJLEdBQUcsR0FBaUI7WUFDcEIsVUFBVSxFQUFFLEdBQUc7WUFDZixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtZQUM1QyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FB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Ii4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJmYWNlLCBLbGFzcywgVHlwZVZhcmlhYmxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IE1ldGhvZCwgUGFyYW1ldGVybGlzdCwgVmFsdWUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IFNldEl0ZXJhdG9ySW1wbENsYXNzIH0gZnJvbSBcIi4vU2V0SXRlcmF0b3JJbXBsLmpzXCI7XHJcbmltcG9ydCB7IFNldEhlbHBlciB9IGZyb20gXCIuL1NldEhlbHBlci5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIExpbmtlZEhhc2hTZXRDbGFzcyBleHRlbmRzIEtsYXNzIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBzdXBlcihcIkxpbmtlZEhhc2hTZXRcIiwgbW9kdWxlLCBcIkVpbiBMaW5rZWRIYXNoU2V0IHNwZWljaGVydCBqZWRlcyBFbGVtZW50IG51ciBnZW5hdSBlaW4gTWFsLlwiKTtcclxuXHJcbiAgICAgICAgbGV0IG9iamVjdFR5cGUgPSBtb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJPYmplY3RcIik7XHJcblxyXG4gICAgICAgIHRoaXMuc2V0QmFzZUNsYXNzKDxLbGFzcz5vYmplY3RUeXBlKTtcclxuXHJcbiAgICAgICAgbGV0IHR5cGVFOiBLbGFzcyA9ICg8S2xhc3M+b2JqZWN0VHlwZSkuY2xvbmUoKTtcclxuICAgICAgICB0eXBlRS5pZGVudGlmaWVyID0gXCJFXCI7XHJcbiAgICAgICAgdHlwZUUuaXNUeXBlVmFyaWFibGUgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgdHZFOiBUeXBlVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiRVwiLFxyXG4gICAgICAgICAgICBzY29wZUZyb206IHsgbGluZTogMSwgY29sdW1uOiAxLCBsZW5ndGg6IDEgfSxcclxuICAgICAgICAgICAgc2NvcGVUbzogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgICAgICB0eXBlOiB0eXBlRVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMudHlwZVZhcmlhYmxlcy5wdXNoKHR2RSk7XHJcblxyXG4gICAgICAgIGxldCBzZXRJbnRlcmZhY2UgPSAoPEludGVyZmFjZT5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJTZXRcIikpLmNsb25lKCk7XHJcbiAgICAgICAgc2V0SW50ZXJmYWNlLnR5cGVWYXJpYWJsZXMgPSBbdHZFXTtcclxuXHJcbiAgICAgICAgdGhpcy5pbXBsZW1lbnRzLnB1c2goc2V0SW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgbGV0IGl0ZXJhdG9yVHlwZSA9ICg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiSXRlcmF0b3JcIikpLmNsb25lKCk7XHJcbiAgICAgICAgaXRlcmF0b3JUeXBlLnR5cGVWYXJpYWJsZXMgPSBbdHZFXTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIkxpbmtlZEhhc2hTZXRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICAvLyB7IGlkZW50aWZpZXI6IFwibXhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBtaCA9IG5ldyBTZXRIZWxwZXIobywgbW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbW9kdWxlKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIk1hcEhlbHBlclwiXSA9IG1oO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnSW5zdGFuemllcnQgZWluIG5ldWVzIExpbmtlZEhhc2hTZXQnLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJpdGVyYXRvclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGl0ZXJhdG9yVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IFNldEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFNldEl0ZXJhdG9ySW1wbENsYXNzLmdldEl0ZXJhdG9yKGFoLCBhaC5pbnRlcnByZXRlciwgbW9kdWxlLCBcImFzY2VuZGluZ1wiKS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJHaWJ0IGVpbmVuIEl0ZXJhdG9yIMO8YmVyIGRpZSBFbGVtZW50ZSBkaWVzZXIgQ29sbGVjdGlvbiB6dXLDvGNrLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZWxlbWVudFwiLCB0eXBlOiB0eXBlRSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHI6IFZhbHVlID0gcGFyYW1ldGVyc1sxXTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogU2V0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguYWRkVG9TZXQocik7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiRsO8Z3QgZGVyIExpc3RlIGVpbiBFbGVtZW50IGhpbnp1LiBHaWJ0IGdlbmF1IGRhbm4gdHJ1ZSB6dXLDvGNrLCB3ZW5uIHNpY2ggZGVyIFp1c3RhbmQgZGVyIExpc3RlIGRhZHVyY2ggZ2XDpG5kZXJ0IGhhdC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiYWRkQWxsXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNcIiwgdHlwZTogdGhpcywgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IG9iamVjdDogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IFNldEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmFkQWxsKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiRsO8Z3QgYWxsZSBFbGVtZW50ZSB2b24gYyBkaWVzZXIgQ29sbGVjdGlvbiBoaW56dS5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY2xlYXJcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogU2V0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguY2xlYXIoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJFbnRmZXJudCBhbGxlIEVsZW1lbnQgYXVzIGRpZXNlciBDb2xsZWN0aW9uLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJjb250YWluc1wiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJvXCIsIHR5cGU6IHR5cGVFLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgb2JqZWN0OiBWYWx1ZSA9IHBhcmFtZXRlcnNbMV07XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IFNldEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmNvbnRhaW5zKG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiVGVzdGV0LCBvYiBkaWUgQ29sbGVjdGlvbiBkYXMgRWxlbWVudCBlbnRow6RsdC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVtb3ZlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIm9cIiwgdHlwZTogdHlwZUUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBvYmplY3Q6IFZhbHVlID0gcGFyYW1ldGVyc1sxXTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogU2V0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWgucmVtb3ZlT2JqZWN0KG9iamVjdCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiRW50ZmVybnQgZGFzIEVsZW1lbnQgbyBhdXMgZGVyIENvbGxlY3Rpb24uIEdpYnQgdHJ1ZSB6dXLDvGNrLCB3ZW5uIGRpZSBDb2xsZWN0aW9uIGRhcyBFbGVtZW50IGVudGhhbHRlbiBoYXR0ZS5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXNFbXB0eVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogU2V0SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiTGlzdEhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWguaXNFbXB0eSgpO1xyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgZmFsc2UsIGZhbHNlLCBcIlRlc3RldCwgb2IgZGllIENvbGxlY3Rpb24gZGFzIGxlZXIgaXN0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzaXplXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IFNldEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLnNpemUoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJHaWJ0IGRpZSBBbnphaGwgZGVyIEVsZW1lbnRlIGRlciBDb2xsZWN0aW9uIHp1csO8Y2suXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInRvU3RyaW5nXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtdKSwgc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IFNldEhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkxpc3RIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLnRvX1N0cmluZygpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlKSk7XHJcblxyXG4gICAgfVxyXG5cclxufVxyXG5cclxuIl19