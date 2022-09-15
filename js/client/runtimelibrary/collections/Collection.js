import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { Interface } from "../../compiler/types/Class.js";
import { booleanPrimitiveType, intPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
export class CollectionClass extends Interface {
    constructor(module) {
        super("Collection", module, "Interface für Listen, Maps, Sets usw. mit Methoden zum Einfügen von Objekten, Zugriff auf Objekte und zur Ermittlung der Anzahl der Objekte");
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
        let iterableInterface = module.typeStore.getType("Iterable").clone();
        iterableInterface.typeVariables = [tvE];
        this.extends.push(iterableInterface);
        this.addMethod(new Method("add", new Parameterlist([
            { identifier: "element", type: typeE, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Fügt der Collection ein Element hinzu. Gibt genau dann true zurück, wenn sich der Zustand der Collection dadurch geändert hat."));
        this.addMethod(new Method("addAll", new Parameterlist([
            { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Fügt alle Elemente von c dieser Collection hinzu."));
        // TODO: Implement
        // this.addMethod(new Method("removeAll", new Parameterlist([
        //     { identifier: "c", type: this, declaration: null, usagePositions: null, isFinal: true }
        // ]), booleanPrimitiveType,
        //     null,  // no implementation!
        //     true, false, "Löscht alle Elemente aus dieser Collection, die in c enthalten sind."));
        this.addMethod(new Method("clear", new Parameterlist([]), null, null, // no implementation!
        true, false, "Entfernt alle Element aus dieser Collection."));
        this.addMethod(new Method("contains", new Parameterlist([
            { identifier: "o", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Testet, ob die Collection das Element enthält."));
        this.addMethod(new Method("remove", new Parameterlist([
            { identifier: "o", type: objectType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, null, // no implementation!
        true, false, "Entfernt das Element o aus der Collection. Gibt true zurück, wenn die Collection das Element enthalten hatte."));
        this.addMethod(new Method("isEmpty", new Parameterlist([]), booleanPrimitiveType, null, // no implementation!
        true, false, "Testet, ob die Collection das leer ist."));
        this.addMethod(new Method("size", new Parameterlist([]), intPrimitiveType, null, // no implementation!
        true, false, "Gibt die Anzahl der Elemente der Collection zurück."));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvQ29sbGVjdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3RFLE9BQU8sRUFBRSxTQUFTLEVBQXVCLE1BQU0sK0JBQStCLENBQUM7QUFDL0UsT0FBTyxFQUFxQixvQkFBb0IsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBRW5ILE1BQU0sT0FBTyxlQUFnQixTQUFRLFNBQVM7SUFFMUMsWUFBWSxNQUFjO1FBRXRCLEtBQUssQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLDZJQUE2SSxDQUFDLENBQUM7UUFFM0ssSUFBSSxVQUFVLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFcEQsSUFBSSxLQUFLLEdBQWtCLFVBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUMvQyxLQUFLLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztRQUN2QixLQUFLLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztRQUU1QixJQUFJLEdBQUcsR0FBaUI7WUFDcEIsVUFBVSxFQUFFLEdBQUc7WUFDZixTQUFTLEVBQUUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQztZQUMxQyxPQUFPLEVBQUUsRUFBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBQztZQUN4QyxJQUFJLEVBQUUsS0FBSztTQUNkLENBQUM7UUFDRixJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUU3QixJQUFJLGlCQUFpQixH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QUFDO0lBSTdFLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IE1ldGhvZCwgUGFyYW1ldGVybGlzdCB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcmZhY2UsIFR5cGVWYXJpYWJsZSwgS2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgdm9pZFByaW1pdGl2ZVR5cGUsIGJvb2xlYW5QcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29sbGVjdGlvbkNsYXNzIGV4dGVuZHMgSW50ZXJmYWNlIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG4gICAgICAgIFxyXG4gICAgICAgIHN1cGVyKFwiQ29sbGVjdGlvblwiLCBtb2R1bGUsIFwiSW50ZXJmYWNlIGbDvHIgTGlzdGVuLCBNYXBzLCBTZXRzIHVzdy4gbWl0IE1ldGhvZGVuIHp1bSBFaW5mw7xnZW4gdm9uIE9iamVrdGVuLCBadWdyaWZmIGF1ZiBPYmpla3RlIHVuZCB6dXIgRXJtaXR0bHVuZyBkZXIgQW56YWhsIGRlciBPYmpla3RlXCIpO1xyXG5cclxuICAgICAgICBsZXQgb2JqZWN0VHlwZSA9IG1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKTtcclxuXHJcbiAgICAgICAgbGV0IHR5cGVFOiBLbGFzcyA9ICg8S2xhc3M+b2JqZWN0VHlwZSkuY2xvbmUoKTtcclxuICAgICAgICB0eXBlRS5pZGVudGlmaWVyID0gXCJFXCI7XHJcbiAgICAgICAgdHlwZUUuaXNUeXBlVmFyaWFibGUgPSB0cnVlO1xyXG5cclxuICAgICAgICBsZXQgdHZFOiBUeXBlVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiRVwiLFxyXG4gICAgICAgICAgICBzY29wZUZyb206IHtsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMX0sXHJcbiAgICAgICAgICAgIHNjb3BlVG86IHtsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMX0sXHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGVFXHJcbiAgICAgICAgfTtcclxuICAgICAgICB0aGlzLnR5cGVWYXJpYWJsZXMucHVzaCh0dkUpO1xyXG5cclxuICAgICAgICBsZXQgaXRlcmFibGVJbnRlcmZhY2UgPSAoPEludGVyZmFjZT5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJJdGVyYWJsZVwiKSkuY2xvbmUoKTtcclxuICAgICAgICBpdGVyYWJsZUludGVyZmFjZS50eXBlVmFyaWFibGVzID0gW3R2RV07XHJcblxyXG4gICAgICAgIHRoaXMuZXh0ZW5kcy5wdXNoKGl0ZXJhYmxlSW50ZXJmYWNlKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiZWxlbWVudFwiLCB0eXBlOiB0eXBlRSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiRsO8Z3QgZGVyIENvbGxlY3Rpb24gZWluIEVsZW1lbnQgaGluenUuIEdpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gc2ljaCBkZXIgWnVzdGFuZCBkZXIgQ29sbGVjdGlvbiBkYWR1cmNoIGdlw6RuZGVydCBoYXQuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImFkZEFsbFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjXCIsIHR5cGU6IHRoaXMsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICBudWxsLCAgLy8gbm8gaW1wbGVtZW50YXRpb24hXHJcbiAgICAgICAgICAgIHRydWUsIGZhbHNlLCBcIkbDvGd0IGFsbGUgRWxlbWVudGUgdm9uIGMgZGllc2VyIENvbGxlY3Rpb24gaGluenUuXCIpKTtcclxuXHJcbiAgICAgICAgLy8gVE9ETzogSW1wbGVtZW50XHJcbiAgICAgICAgLy8gdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJlbW92ZUFsbFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgLy8gICAgIHsgaWRlbnRpZmllcjogXCJjXCIsIHR5cGU6IHRoaXMsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgLy8gXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgIC8vICAgICBudWxsLCAgLy8gbm8gaW1wbGVtZW50YXRpb24hXHJcbiAgICAgICAgLy8gICAgIHRydWUsIGZhbHNlLCBcIkzDtnNjaHQgYWxsZSBFbGVtZW50ZSBhdXMgZGllc2VyIENvbGxlY3Rpb24sIGRpZSBpbiBjIGVudGhhbHRlbiBzaW5kLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJjbGVhclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiRW50ZmVybnQgYWxsZSBFbGVtZW50IGF1cyBkaWVzZXIgQ29sbGVjdGlvbi5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29udGFpbnNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwib1wiLCB0eXBlOiBvYmplY3RUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJUZXN0ZXQsIG9iIGRpZSBDb2xsZWN0aW9uIGRhcyBFbGVtZW50IGVudGjDpGx0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZW1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwib1wiLCB0eXBlOiBvYmplY3RUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgbnVsbCwgIC8vIG5vIGltcGxlbWVudGF0aW9uIVxyXG4gICAgICAgICAgICB0cnVlLCBmYWxzZSwgXCJFbnRmZXJudCBkYXMgRWxlbWVudCBvIGF1cyBkZXIgQ29sbGVjdGlvbi4gR2lidCB0cnVlIHp1csO8Y2ssIHdlbm4gZGllIENvbGxlY3Rpb24gZGFzIEVsZW1lbnQgZW50aGFsdGVuIGhhdHRlLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJpc0VtcHR5XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIG51bGwsICAvLyBubyBpbXBsZW1lbnRhdGlvbiFcclxuICAgICAgICAgICAgdHJ1ZSwgZmFsc2UsIFwiVGVzdGV0LCBvYiBkaWUgQ29sbGVjdGlvbiBkYXMgbGVlciBpc3QuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNpemVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICBudWxsLCAgLy8gbm8gaW1wbGVtZW50YXRpb24hXHJcbiAgICAgICAgICAgIHRydWUsIGZhbHNlLCBcIkdpYnQgZGllIEFuemFobCBkZXIgRWxlbWVudGUgZGVyIENvbGxlY3Rpb24genVyw7xjay5cIikpO1xyXG5cclxuXHJcbiAgICBcclxuICAgIH1cclxuXHJcbn1cclxuIl19