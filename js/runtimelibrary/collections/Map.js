import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
export class MapClass extends Interface {
    constructor(module) {
        super("Map", module, "Interface mit Methoden einer Map (Schlüssel-Wert-Speicher)");
        let objectType = module.typeStore.getType("Object");
        let typeK = objectType.clone();
        typeK.identifier = "K";
        typeK.isTypeVariable = true;
        let tvK = {
            identifier: "K",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeK
        };
        this.typeVariables.push(tvK);
        let typeV = objectType.clone();
        typeV.identifier = "V";
        typeV.isTypeVariable = true;
        let tvV = {
            identifier: "V",
            scopeFrom: { line: 1, column: 1, length: 1 },
            scopeTo: { line: 1, column: 1, length: 1 },
            type: typeV
        };
        this.typeVariables.push(tvV);
        this.addMethod(new Method("size", new Parameterlist([]), intPrimitiveType, null, // no implementation!
        true, false, "Gibt die Anzahl der Elemente der Map zurück."));
        this.addMethod(new Method("isEmpty", new Parameterlist([]), booleanPrimitiveType, null, // no implementation!
        true, false, "Testet, ob die Map leer ist."));
        this.addMethod(new Method("containsKey", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Gibt genau dann true zurück, wenn die Map zum Schlüssel key einen Wert enthält."));
        this.addMethod(new Method("containsValue", new Parameterlist([
            { identifier: "value", type: typeV, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Gibt genau dann true zurück, wenn die Map den Wert enthält."));
        this.addMethod(new Method("get", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true }
        ]), typeV, null, // no implementation!
        true, false, "Gibt den Wert zum Schlüssel key zurück. Gibt null zurück, falls die Map zum Schlüssel key keinen Wert enthält."));
        this.addMethod(new Method("put", new Parameterlist([
            { identifier: "key", type: typeK, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "value", type: typeV, declaration: null, usagePositions: null, isFinal: true }
        ]), typeV, null, // no implementation!
        true, false, "Speichert das key-value pair in der Map. Falls zum key vorher schon ein Value gespeichert war, wird dieser zurückgegeben. In der Map wird er dann durch den neuen Value überschrieben. Falls es zum key noch keinen value in der Map gab, wird null zurückgegeben."));
        this.addMethod(new Method("clear", new Parameterlist([]), null, null, // no implementation!
        true, false, "Entfernt alle Element aus dieser Map."));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9jb2xsZWN0aW9ucy9NYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUN0RSxPQUFPLEVBQUUsU0FBUyxFQUF1QixNQUFNLCtCQUErQixDQUFDO0FBQy9FLE9BQU8sRUFBcUIsb0JBQW9CLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUVuSCxNQUFNLE9BQU8sUUFBUyxTQUFRLFNBQVM7SUFFbkMsWUFBWSxNQUFjO1FBRXRCLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLDREQUE0RCxDQUFDLENBQUM7UUFFbkYsSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFcEQsSUFBSSxLQUFLLEdBQWtCLFVBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUN2QixLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUU1QixJQUFJLEdBQUcsR0FBaUI7WUFDcEIsVUFBVSxFQUFFLEdBQUc7WUFDZixTQUFTLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtZQUM1QyxPQUFPLEVBQUUsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRTtZQUMxQyxJQUFJLEVBQUUsS0FBSztTQUNkLENBQUM7UUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUU3QixJQUFJLEtBQUssR0FBa0IsVUFBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQy9DLEtBQUssQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO1FBQ3ZCLEtBQUssQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO1FBRTVCLElBQUksR0FBRyxHQUFpQjtZQUNwQixVQUFVLEVBQUUsR0FBRztZQUNmLFNBQVMsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFO1lBQzVDLE9BQU8sRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFO1lBQzFDLElBQUksRUFBRSxLQUFLO1NBQ2QsQ0FBQztRQUNGLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTdCLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksYUFBYSxDQUFDLEVBQ25ELENBQUMsRUFBRSxnQkFBZ0IsRUFDaEIsSUFBSSxFQUFHLHFCQUFxQjtRQUM1QixJQUFJLEVBQUUsS0FBSyxFQUFFLDhDQUE4QyxDQUFDLENBQUMsQ0FBQztRQUVsRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLGFBQWEsQ0FBQyxFQUN0RCxDQUFDLEVBQUUsb0JBQW9CLEVBQ3BCLElBQUksRUFBRyxxQkFBcUI7UUFDNUIsSUFBSSxFQUFFLEtBQUssRUFBRSw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7UUFFbEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDdkQsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7U0FDN0YsQ0FBQyxFQUFFLG9CQUFvQixFQUNwQixJQUFJLEVBQUcscUJBQXFCO1FBQzVCLElBQUksRUFBRSxLQUFLLEVBQUUsaUZBQWlGLENBQUMsQ0FBQyxDQUFDO1FBRXJHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsZUFBZSxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ3pELEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO1NBQy9GLENBQUMsRUFBRSxvQkFBb0IsRUFDcEIsSUFBSSxFQUFHLHFCQUFxQjtRQUM1QixJQUFJLEVBQUUsS0FBSyxFQUFFLDZEQUE2RCxDQUFDLENBQUMsQ0FBQztRQUVqRixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLGFBQWEsQ0FBQztZQUMvQyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUM3RixDQUFDLEVBQUUsS0FBSyxFQUNMLElBQUksRUFBRyxxQkFBcUI7UUFDNUIsSUFBSSxFQUFFLEtBQUssRUFBRSxnSEFBZ0gsQ0FBQyxDQUFDLENBQUM7UUFFcEksSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxLQUFLLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDL0MsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7WUFDMUYsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7U0FDL0YsQ0FBQyxFQUFFLEtBQUssRUFDTCxJQUFJLEVBQUcscUJBQXFCO1FBQzVCLElBQUksRUFBRSxLQUFLLEVBQUUsb1FBQW9RLENBQUMsQ0FBQyxDQUFDO1FBRXhSLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsT0FBTyxFQUFFLElBQUksYUFBYSxDQUFDLEVBQ3BELENBQUMsRUFBRSxJQUFJLEVBQ0osSUFBSSxFQUFHLHFCQUFxQjtRQUM1QixJQUFJLEVBQUUsS0FBSyxFQUFFLHVDQUF1QyxDQUFDLENBQUMsQ0FBQztJQUUvRCxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJmYWNlLCBUeXBlVmFyaWFibGUsIEtsYXNzIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IHZvaWRQcmltaXRpdmVUeXBlLCBib29sZWFuUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE1hcENsYXNzIGV4dGVuZHMgSW50ZXJmYWNlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBzdXBlcihcIk1hcFwiLCBtb2R1bGUsIFwiSW50ZXJmYWNlIG1pdCBNZXRob2RlbiBlaW5lciBNYXAgKFNjaGzDvHNzZWwtV2VydC1TcGVpY2hlcilcIik7XHJcblxyXG4gICAgICAgIGxldCBvYmplY3RUeXBlID0gbW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpO1xyXG5cclxuICAgICAgICBsZXQgdHlwZUs6IEtsYXNzID0gKDxLbGFzcz5vYmplY3RUeXBlKS5jbG9uZSgpO1xyXG4gICAgICAgIHR5cGVLLmlkZW50aWZpZXIgPSBcIktcIjtcclxuICAgICAgICB0eXBlSy5pc1R5cGVWYXJpYWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIGxldCB0dks6IFR5cGVWYXJpYWJsZSA9IHtcclxuICAgICAgICAgICAgaWRlbnRpZmllcjogXCJLXCIsXHJcbiAgICAgICAgICAgIHNjb3BlRnJvbTogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgICAgICBzY29wZVRvOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAxIH0sXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGVLXHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnR5cGVWYXJpYWJsZXMucHVzaCh0dkspO1xyXG5cclxuICAgICAgICBsZXQgdHlwZVY6IEtsYXNzID0gKDxLbGFzcz5vYmplY3RUeXBlKS5jbG9uZSgpO1xyXG4gICAgICAgIHR5cGVWLmlkZW50aWZpZXIgPSBcIlZcIjtcclxuICAgICAgICB0eXBlVi5pc1R5cGVWYXJpYWJsZSA9IHRydWU7XHJcblxyXG4gICAgICAgIGxldCB0dlY6IFR5cGVWYXJpYWJsZSA9IHtcclxuICAgICAgICAgICAgaWRlbnRpZmllcjogXCJWXCIsXHJcbiAgICAgICAgICAgIHNjb3BlRnJvbTogeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMSB9LFxyXG4gICAgICAgICAgICBzY29wZVRvOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAxIH0sXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGVWXHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnR5cGVWYXJpYWJsZXMucHVzaCh0dlYpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2l6ZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiR2lidCBkaWUgQW56YWhsIGRlciBFbGVtZW50ZSBkZXIgTWFwIHp1csO8Y2suXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImlzRW1wdHlcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJUZXN0ZXQsIG9iIGRpZSBNYXAgbGVlciBpc3QuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImNvbnRhaW5zS2V5XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImtleVwiLCB0eXBlOiB0eXBlSywgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiR2lidCBnZW5hdSBkYW5uIHRydWUgenVyw7xjaywgd2VubiBkaWUgTWFwIHp1bSBTY2hsw7xzc2VsIGtleSBlaW5lbiBXZXJ0IGVudGjDpGx0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJjb250YWluc1ZhbHVlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInZhbHVlXCIsIHR5cGU6IHR5cGVWLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJHaWJ0IGdlbmF1IGRhbm4gdHJ1ZSB6dXLDvGNrLCB3ZW5uIGRpZSBNYXAgZGVuIFdlcnQgZW50aMOkbHQuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJrZXlcIiwgdHlwZTogdHlwZUssIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIHR5cGVWLFxyXG4gICAgICAgICAgICBudWxsLCAgLy8gbm8gaW1wbGVtZW50YXRpb24hXHJcbiAgICAgICAgICAgIHRydWUsIGZhbHNlLCBcIkdpYnQgZGVuIFdlcnQgenVtIFNjaGzDvHNzZWwga2V5IHp1csO8Y2suIEdpYnQgbnVsbCB6dXLDvGNrLCBmYWxscyBkaWUgTWFwIHp1bSBTY2hsw7xzc2VsIGtleSBrZWluZW4gV2VydCBlbnRow6RsdC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicHV0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImtleVwiLCB0eXBlOiB0eXBlSywgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ2YWx1ZVwiLCB0eXBlOiB0eXBlViwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgdHlwZVYsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiU3BlaWNoZXJ0IGRhcyBrZXktdmFsdWUgcGFpciBpbiBkZXIgTWFwLiBGYWxscyB6dW0ga2V5IHZvcmhlciBzY2hvbiBlaW4gVmFsdWUgZ2VzcGVpY2hlcnQgd2FyLCB3aXJkIGRpZXNlciB6dXLDvGNrZ2VnZWJlbi4gSW4gZGVyIE1hcCB3aXJkIGVyIGRhbm4gZHVyY2ggZGVuIG5ldWVuIFZhbHVlIMO8YmVyc2NocmllYmVuLiBGYWxscyBlcyB6dW0ga2V5IG5vY2gga2VpbmVuIHZhbHVlIGluIGRlciBNYXAgZ2FiLCB3aXJkIG51bGwgenVyw7xja2dlZ2ViZW4uXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImNsZWFyXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJFbnRmZXJudCBhbGxlIEVsZW1lbnQgYXVzIGRpZXNlciBNYXAuXCIpKTtcclxuXHJcbiAgICB9XHJcblxyXG59XHJcbiJdfQ==