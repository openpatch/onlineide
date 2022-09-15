import { Klass } from "../compiler/types/Class.js";
import { doublePrimitiveType, intPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../compiler/types/Types.js";
export class RandomClass extends Klass {
    constructor(module) {
        super("Random", module, "Zufallszahlengenerator");
        this.setBaseClass(module.typeStore.getType("Object"));
        this.setupAttributeIndicesRecursive();
        this.addMethod(new Method("nextInt", new Parameterlist([
            { identifier: "bound", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let bound = parameters[1].value;
            return Math.floor(Math.random() * bound);
        }, false, false, 'Gibt eine ganzzahlige Zufallszahl aus der Menge {0, 1, ..., bound - 1} zurück.', false));
        this.addMethod(new Method("randint", new Parameterlist([
            { identifier: "from", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
            { identifier: "to", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), intPrimitiveType, (parameters) => {
            let from = parameters[1].value;
            let to = parameters[2].value;
            return Math.floor(Math.random() * (to - from + 1) + from);
        }, false, true, 'Gibt eine ganzzahlige Zufallszahl aus der Menge {from, from + 1, ..., to} zurück.', false));
        this.addMethod(new Method("randdouble", new Parameterlist([
            { identifier: "from", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
            { identifier: "to", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true, isEllipsis: false },
        ]), doublePrimitiveType, (parameters) => {
            let from = parameters[1].value;
            let to = parameters[2].value;
            return Math.random() * (to - from) + from;
        }, false, true, 'Gibt eine Zufallszahl aus dem Intervall [from, to[ zurück.', false));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUmFuZG9tLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9SYW5kb20udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBYyxNQUFNLDRCQUE0QixDQUFDO0FBQy9ELE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxnQkFBZ0IsRUFBdUIsTUFBTSxxQ0FBcUMsQ0FBQztBQUNqSCxPQUFPLEVBQWEsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLDRCQUE0QixDQUFDO0FBR3JGLE1BQU0sT0FBTyxXQUFZLFNBQVEsS0FBSztJQUVsQyxZQUFZLE1BQWM7UUFFdEIsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsd0JBQXdCLENBQUMsQ0FBQztRQUVsRCxJQUFJLENBQUMsWUFBWSxDQUFRLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFFN0QsSUFBSSxDQUFDLDhCQUE4QixFQUFFLENBQUM7UUFHdEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDbkQsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO1NBQzdILENBQUMsRUFBRSxnQkFBZ0IsRUFDaEIsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUVYLElBQUksQ0FBQyxHQUFrQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksS0FBSyxHQUFXLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFeEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBQyxLQUFLLENBQUMsQ0FBQztRQUUzQyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxnRkFBZ0YsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBRS9HLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ25ELEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTtZQUN6SCxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7U0FDMUgsQ0FBQyxFQUFFLGdCQUFnQixFQUNoQixDQUFDLFVBQVUsRUFBRSxFQUFFO1lBRVgsSUFBSSxJQUFJLEdBQVcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztZQUN2QyxJQUFJLEVBQUUsR0FBVyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBRXJDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBRTVELENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLG1GQUFtRixFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFFakgsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxZQUFZLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDdEQsRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO1lBQzVILEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTtTQUM3SCxDQUFDLEVBQUUsbUJBQW1CLEVBQ25CLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFFWCxJQUFJLElBQUksR0FBVyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQ3ZDLElBQUksRUFBRSxHQUFXLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7WUFFckMsT0FBTyxJQUFJLENBQUMsTUFBTSxFQUFFLEdBQUMsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBRTVDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLDREQUE0RCxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFJOUYsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcbmltcG9ydCB7IEtsYXNzLCBWaXNpYmlsaXR5IH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XG5pbXBvcnQgeyBkb3VibGVQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBzdHJpbmdQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XG5pbXBvcnQgeyBBdHRyaWJ1dGUsIE1ldGhvZCwgUGFyYW1ldGVybGlzdCwgVmFsdWUgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xuXG5leHBvcnQgY2xhc3MgUmFuZG9tQ2xhc3MgZXh0ZW5kcyBLbGFzcyB7XG5cbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xuXG4gICAgICAgIHN1cGVyKFwiUmFuZG9tXCIsIG1vZHVsZSwgXCJadWZhbGxzemFobGVuZ2VuZXJhdG9yXCIpO1xuXG4gICAgICAgIHRoaXMuc2V0QmFzZUNsYXNzKDxLbGFzcz5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJPYmplY3RcIikpO1xuXG4gICAgICAgIHRoaXMuc2V0dXBBdHRyaWJ1dGVJbmRpY2VzUmVjdXJzaXZlKCk7XG5cblxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwibmV4dEludFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiYm91bmRcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlLCBpc0VsbGlwc2lzOiBmYWxzZSB9LFxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XG5cbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XG4gICAgICAgICAgICAgICAgbGV0IGJvdW5kOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSpib3VuZCk7XG5cbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0dpYnQgZWluZSBnYW56emFobGlnZSBadWZhbGxzemFobCBhdXMgZGVyIE1lbmdlIHswLCAxLCAuLi4sIGJvdW5kIC0gMX0genVyw7xjay4nLCBmYWxzZSkpO1xuXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyYW5kaW50XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJmcm9tXCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSwgaXNFbGxpcHNpczogZmFsc2UgfSxcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ0b1wiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUsIGlzRWxsaXBzaXM6IGZhbHNlIH0sXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcblxuICAgICAgICAgICAgICAgIGxldCBmcm9tOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xuICAgICAgICAgICAgICAgIGxldCB0bzogbnVtYmVyID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKHRvIC0gZnJvbSArIDEpICsgZnJvbSk7XG5cbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCAnR2lidCBlaW5lIGdhbnp6YWhsaWdlIFp1ZmFsbHN6YWhsIGF1cyBkZXIgTWVuZ2Uge2Zyb20sIGZyb20gKyAxLCAuLi4sIHRvfSB6dXLDvGNrLicsIGZhbHNlKSk7XG5cbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJhbmRkb3VibGVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImZyb21cIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlLCBpc0VsbGlwc2lzOiBmYWxzZSB9LFxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInRvXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSwgaXNFbGxpcHNpczogZmFsc2UgfSxcbiAgICAgICAgXSksIGRvdWJsZVByaW1pdGl2ZVR5cGUsXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xuXG4gICAgICAgICAgICAgICAgbGV0IGZyb206IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XG4gICAgICAgICAgICAgICAgbGV0IHRvOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkqKHRvIC0gZnJvbSkgKyBmcm9tO1xuXG4gICAgICAgICAgICB9LCBmYWxzZSwgdHJ1ZSwgJ0dpYnQgZWluZSBadWZhbGxzemFobCBhdXMgZGVtIEludGVydmFsbCBbZnJvbSwgdG9bIHp1csO8Y2suJywgZmFsc2UpKTtcblxuXG5cbiAgICB9XG5cbn1cblxuXG4iXX0=