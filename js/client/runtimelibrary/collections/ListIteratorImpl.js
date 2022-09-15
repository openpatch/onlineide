import { Klass } from "../../compiler/types/Class.js";
import { booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
export class ListIteratorImplClass extends Klass {
    static getIterator(listHelper, interpreter, module, kind) {
        let klass = module.typeStore.getType("ListIteratorImpl");
        let rt = new RuntimeObject(klass);
        rt.intrinsicData["IteratorHelper"] = new IteratorHelper(listHelper, interpreter, kind);
        return {
            value: rt,
            type: klass
        };
    }
    constructor(module) {
        super("ListIteratorImpl", module);
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
        let iteratorInterface = module.typeStore.getType("Iterator").clone();
        iteratorInterface.typeVariables = [tvE];
        this.implements.push(iteratorInterface);
        this.addMethod(new Method("hasNext", new Parameterlist([]), booleanPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["IteratorHelper"];
            return ah.hasNext();
        }, false, false, "Gibt genau dann true zurück, wenn sich noch mindestens ein weiteres Element in der Collection befindet."));
        this.addMethod(new Method("next", new Parameterlist([]), typeE, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["IteratorHelper"];
            return ah.next();
        }, false, false, "Gibt das nächste Element der Collection zurück."));
        this.addMethod(new Method("remove", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let ah = o.intrinsicData["IteratorHelper"];
            return ah.remove();
        }, false, false, "Löscht das letzte durch next zurückgegebene Objekt. Diese Methode beeinflusst nicht, welches Element als nächstes durch next zurückgegeben wird."));
    }
}
class IteratorHelper {
    constructor(listHelper, interpreter, kind) {
        this.listHelper = listHelper;
        this.interpreter = interpreter;
        this.kind = kind;
        switch (kind) {
            case "ascending":
                this.nextPos = 0;
                break;
            case "descending":
                this.nextPos = listHelper.objectArray.length - 1;
                break;
        }
    }
    remove() {
        switch (this.kind) {
            case "ascending":
                if (this.nextPos == 0) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl noch nie next() aufgerufen wurde.");
                }
                else if (this.nextPos > this.listHelper.objectArray.length - 1) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                }
                else {
                    this.listHelper.valueArray.splice(this.nextPos - 1, 1);
                    this.listHelper.objectArray.splice(this.nextPos - 1, 1);
                    this.nextPos -= 1;
                }
                break;
            case "descending":
                if (this.nextPos == this.listHelper.objectArray.length - 1) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl noch nie next() aufgerufen wurde.");
                }
                else if (this.nextPos < 0) {
                    this.interpreter.throwException("Die Methode remove() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                }
                else {
                    this.listHelper.valueArray.splice(this.nextPos + 1, 1);
                    this.listHelper.objectArray.splice(this.nextPos + 1, 1);
                    this.nextPos += 1;
                }
                break;
        }
    }
    next() {
        switch (this.kind) {
            case "ascending":
                if (this.nextPos > this.listHelper.objectArray.length - 1) {
                    this.interpreter.throwException("Die Methode next() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                    return null;
                }
                return this.listHelper.objectArray[this.nextPos++];
            case "descending":
                if (this.nextPos < 0) {
                    this.interpreter.throwException("Die Methode next() des Iterators wurde aufgerufen, obwohl das letzte Element schon beim vorherigen Aufruf zurückgegeben worden war.");
                    return null;
                }
                return this.listHelper.objectArray[this.nextPos--];
        }
    }
    hasNext() {
        switch (this.kind) {
            case "ascending":
                return this.nextPos < this.listHelper.objectArray.length;
            case "descending":
                return this.nextPos >= 0;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTGlzdEl0ZXJhdG9ySW1wbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvcnVudGltZWxpYnJhcnkvY29sbGVjdGlvbnMvTGlzdEl0ZXJhdG9ySW1wbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQWEsS0FBSyxFQUFnQixNQUFNLCtCQUErQixDQUFDO0FBQy9FLE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLHdDQUF3QyxDQUFDO0FBQzlFLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFTLE1BQU0sK0JBQStCLENBQUM7QUFFN0UsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLG9DQUFvQyxDQUFDO0FBS25FLE1BQU0sT0FBTyxxQkFBc0IsU0FBUSxLQUFLO0lBRXJDLE1BQU0sQ0FBQyxXQUFXLENBQUMsVUFBc0IsRUFBRSxXQUF3QixFQUFFLE1BQWMsRUFBRSxJQUFrQjtRQUUxRyxJQUFJLEtBQUssR0FBVSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1FBQ2hFLElBQUksRUFBRSxHQUFrQixJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqRCxFQUFFLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsSUFBSSxjQUFjLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUV2RixPQUFPO1lBQ0gsS0FBSyxFQUFFLEVBQUU7WUFDVCxJQUFJLEVBQUUsS0FBSztTQUNkLENBQUE7SUFDTCxDQUFDO0lBRUQsWUFBWSxNQUFjO1FBRXRCLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVsQyxJQUFJLFVBQVUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVwRCxJQUFJLENBQUMsWUFBWSxDQUFRLFVBQVUsQ0FBQyxDQUFDO1FBRXJDLElBQUksS0FBSyxHQUFrQixVQUFXLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7UUFDdkIsS0FBSyxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7UUFFNUIsSUFBSSxHQUFHLEdBQWlCO1lBQ3BCLFVBQVUsRUFBRSxHQUFHO1lBQ2YsU0FBUyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFDNUMsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUU7WUFDMUMsSUFBSSxFQUFFLEtBQUs7U0FDZCxDQUFDO1FBRUYsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFN0IsSUFBSSxpQkFBaUIsR0FBZSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNsRixpQkFBaUIsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUV4QyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXhDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsU0FBUyxFQUFFLElBQUksYUFBYSxDQUFDLEVBQ3RELENBQUMsRUFBRSxvQkFBb0IsRUFDcEIsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUVYLElBQUksQ0FBQyxHQUFrQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksRUFBRSxHQUFtQixDQUFDLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFM0QsT0FBTyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFeEIsQ0FBQyxFQUNELEtBQUssRUFBRSxLQUFLLEVBQUUseUdBQXlHLENBQUMsQ0FBQyxDQUFDO1FBRTlILElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxFQUFFLElBQUksYUFBYSxDQUFDLEVBQ25ELENBQUMsRUFBRSxLQUFLLEVBQ0wsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUVYLElBQUksQ0FBQyxHQUFrQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksRUFBRSxHQUFtQixDQUFDLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFM0QsT0FBTyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7UUFFckIsQ0FBQyxFQUNELEtBQUssRUFBRSxLQUFLLEVBQUUsaURBQWlELENBQUMsQ0FBQyxDQUFDO1FBRXRFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksYUFBYSxDQUFDLEVBQ3JELENBQUMsRUFBRSxJQUFJLEVBQ0osQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUVYLElBQUksQ0FBQyxHQUFrQixVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1lBQzNDLElBQUksRUFBRSxHQUFtQixDQUFDLENBQUMsYUFBYSxDQUFDLGdCQUFnQixDQUFDLENBQUM7WUFFM0QsT0FBTyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFdkIsQ0FBQyxFQUNELEtBQUssRUFBRSxLQUFLLEVBQUUsa0pBQWtKLENBQUMsQ0FBQyxDQUFDO0lBSTNLLENBQUM7Q0FDSjtBQUVELE1BQU0sY0FBYztJQUloQixZQUFvQixVQUFzQixFQUFVLFdBQXdCLEVBQVUsSUFBa0I7UUFBcEYsZUFBVSxHQUFWLFVBQVUsQ0FBWTtRQUFVLGdCQUFXLEdBQVgsV0FBVyxDQUFhO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBYztRQUNwRyxRQUFRLElBQUksRUFBRTtZQUNWLEtBQUssV0FBVztnQkFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1lBQzFDLEtBQUssWUFBWTtnQkFBRSxJQUFJLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztnQkFBQyxNQUFNO1NBQzlFO0lBQ0wsQ0FBQztJQUVELE1BQU07UUFDRixRQUFRLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDZixLQUFLLFdBQVc7Z0JBQ1osSUFBSSxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsRUFBRTtvQkFDbkIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsK0ZBQStGLENBQUMsQ0FBQTtpQkFDbkk7cUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQzlELElBQUksQ0FBQyxXQUFXLENBQUMsY0FBYyxDQUFDLHVJQUF1SSxDQUFDLENBQUE7aUJBQzNLO3FCQUFNO29CQUNILElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztvQkFDdkQsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN4RCxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztpQkFDckI7Z0JBQ0QsTUFBTTtZQUNWLEtBQUssWUFBWTtnQkFDYixJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDeEQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsK0ZBQStGLENBQUMsQ0FBQTtpQkFDbkk7cUJBQU0sSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRTtvQkFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMsdUlBQXVJLENBQUMsQ0FBQTtpQkFDM0s7cUJBQU07b0JBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO29CQUN2RCxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7b0JBQ3hELElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDO2lCQUNyQjtnQkFDRCxNQUFNO1NBQ2I7SUFDTCxDQUFDO0lBRUQsSUFBSTtRQUNBLFFBQVEsSUFBSSxDQUFDLElBQUksRUFBRTtZQUNmLEtBQUssV0FBVztnQkFDWixJQUFJLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtvQkFDdkQsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMscUlBQXFJLENBQUMsQ0FBQTtvQkFDdEssT0FBTyxJQUFJLENBQUM7aUJBQ2Y7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUN2RCxLQUFLLFlBQVk7Z0JBQ2IsSUFBSSxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsRUFBRTtvQkFDbEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxjQUFjLENBQUMscUlBQXFJLENBQUMsQ0FBQTtvQkFDdEssT0FBTyxJQUFJLENBQUM7aUJBQ2Y7Z0JBQ0QsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztTQUMxRDtJQUNMLENBQUM7SUFFRCxPQUFPO1FBQ0gsUUFBUSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2YsS0FBSyxXQUFXO2dCQUNaLE9BQU8sSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUM7WUFDN0QsS0FBSyxZQUFZO2dCQUNiLE9BQU8sSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7U0FDaEM7SUFDTCxDQUFDO0NBSUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcmZhY2UsIEtsYXNzLCBUeXBlVmFyaWFibGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgYm9vbGVhblByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuaW1wb3J0IHsgTGlzdEhlbHBlciB9IGZyb20gXCIuL0FycmF5TGlzdC5qc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgSXRlcmF0b3JLaW5kID0gXCJkZXNjZW5kaW5nXCIgfCBcImFzY2VuZGluZ1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIExpc3RJdGVyYXRvckltcGxDbGFzcyBleHRlbmRzIEtsYXNzIHtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGdldEl0ZXJhdG9yKGxpc3RIZWxwZXI6IExpc3RIZWxwZXIsIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgbW9kdWxlOiBNb2R1bGUsIGtpbmQ6IEl0ZXJhdG9yS2luZCk6IFZhbHVlIHtcclxuXHJcbiAgICAgICAgbGV0IGtsYXNzID0gPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIkxpc3RJdGVyYXRvckltcGxcIik7XHJcbiAgICAgICAgbGV0IHJ0OiBSdW50aW1lT2JqZWN0ID0gbmV3IFJ1bnRpbWVPYmplY3Qoa2xhc3MpO1xyXG4gICAgICAgIHJ0LmludHJpbnNpY0RhdGFbXCJJdGVyYXRvckhlbHBlclwiXSA9IG5ldyBJdGVyYXRvckhlbHBlcihsaXN0SGVscGVyLCBpbnRlcnByZXRlciwga2luZCk7XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBydCxcclxuICAgICAgICAgICAgdHlwZToga2xhc3NcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuXHJcbiAgICAgICAgc3VwZXIoXCJMaXN0SXRlcmF0b3JJbXBsXCIsIG1vZHVsZSk7XHJcblxyXG4gICAgICAgIGxldCBvYmplY3RUeXBlID0gbW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+b2JqZWN0VHlwZSk7XHJcblxyXG4gICAgICAgIGxldCB0eXBlRTogS2xhc3MgPSAoPEtsYXNzPm9iamVjdFR5cGUpLmNsb25lKCk7XHJcbiAgICAgICAgdHlwZUUuaWRlbnRpZmllciA9IFwiRVwiO1xyXG4gICAgICAgIHR5cGVFLmlzVHlwZVZhcmlhYmxlID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgbGV0IHR2RTogVHlwZVZhcmlhYmxlID0ge1xyXG4gICAgICAgICAgICBpZGVudGlmaWVyOiBcIkVcIixcclxuICAgICAgICAgICAgc2NvcGVGcm9tOiB7IGxpbmU6IDEsIGNvbHVtbjogMSwgbGVuZ3RoOiAxIH0sXHJcbiAgICAgICAgICAgIHNjb3BlVG86IHsgbGluZTogMSwgY29sdW1uOiAxLCBsZW5ndGg6IDEgfSxcclxuICAgICAgICAgICAgdHlwZTogdHlwZUVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLnR5cGVWYXJpYWJsZXMucHVzaCh0dkUpO1xyXG5cclxuICAgICAgICBsZXQgaXRlcmF0b3JJbnRlcmZhY2UgPSAoPEludGVyZmFjZT5tb2R1bGUudHlwZVN0b3JlLmdldFR5cGUoXCJJdGVyYXRvclwiKSkuY2xvbmUoKTtcclxuICAgICAgICBpdGVyYXRvckludGVyZmFjZS50eXBlVmFyaWFibGVzID0gW3R2RV07XHJcblxyXG4gICAgICAgIHRoaXMuaW1wbGVtZW50cy5wdXNoKGl0ZXJhdG9ySW50ZXJmYWNlKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImhhc05leHRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYWg6IEl0ZXJhdG9ySGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiSXRlcmF0b3JIZWxwZXJcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFoLmhhc05leHQoKTtcclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGZhbHNlLCBmYWxzZSwgXCJHaWJ0IGdlbmF1IGRhbm4gdHJ1ZSB6dXLDvGNrLCB3ZW5uIHNpY2ggbm9jaCBtaW5kZXN0ZW5zIGVpbiB3ZWl0ZXJlcyBFbGVtZW50IGluIGRlciBDb2xsZWN0aW9uIGJlZmluZGV0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJuZXh0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgdHlwZUUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFoOiBJdGVyYXRvckhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkl0ZXJhdG9ySGVscGVyXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIHJldHVybiBhaC5uZXh0KCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiR2lidCBkYXMgbsOkY2hzdGUgRWxlbWVudCBkZXIgQ29sbGVjdGlvbiB6dXLDvGNrLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZW1vdmVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhaDogSXRlcmF0b3JIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJJdGVyYXRvckhlbHBlclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWgucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBmYWxzZSwgZmFsc2UsIFwiTMO2c2NodCBkYXMgbGV0enRlIGR1cmNoIG5leHQgenVyw7xja2dlZ2ViZW5lIE9iamVrdC4gRGllc2UgTWV0aG9kZSBiZWVpbmZsdXNzdCBuaWNodCwgd2VsY2hlcyBFbGVtZW50IGFscyBuw6RjaHN0ZXMgZHVyY2ggbmV4dCB6dXLDvGNrZ2VnZWJlbiB3aXJkLlwiKSk7XHJcblxyXG5cclxuXHJcbiAgICB9XHJcbn1cclxuXHJcbmNsYXNzIEl0ZXJhdG9ySGVscGVyIHtcclxuXHJcbiAgICBuZXh0UG9zOiBudW1iZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBsaXN0SGVscGVyOiBMaXN0SGVscGVyLCBwcml2YXRlIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcHJpdmF0ZSBraW5kOiBJdGVyYXRvcktpbmQpIHtcclxuICAgICAgICBzd2l0Y2ggKGtpbmQpIHtcclxuICAgICAgICAgICAgY2FzZSBcImFzY2VuZGluZ1wiOiB0aGlzLm5leHRQb3MgPSAwOyBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjogdGhpcy5uZXh0UG9zID0gbGlzdEhlbHBlci5vYmplY3RBcnJheS5sZW5ndGggLSAxOyBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKCkge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5raW5kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJhc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRQb3MgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJEaWUgTWV0aG9kZSByZW1vdmUoKSBkZXMgSXRlcmF0b3JzIHd1cmRlIGF1ZmdlcnVmZW4sIG9id29obCBub2NoIG5pZSBuZXh0KCkgYXVmZ2VydWZlbiB3dXJkZS5cIilcclxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5uZXh0UG9zID4gdGhpcy5saXN0SGVscGVyLm9iamVjdEFycmF5Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIE1ldGhvZGUgcmVtb3ZlKCkgZGVzIEl0ZXJhdG9ycyB3dXJkZSBhdWZnZXJ1ZmVuLCBvYndvaGwgZGFzIGxldHp0ZSBFbGVtZW50IHNjaG9uIGJlaW0gdm9yaGVyaWdlbiBBdWZydWYgenVyw7xja2dlZ2ViZW4gd29yZGVuIHdhci5cIilcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saXN0SGVscGVyLnZhbHVlQXJyYXkuc3BsaWNlKHRoaXMubmV4dFBvcyAtIDEsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdEhlbHBlci5vYmplY3RBcnJheS5zcGxpY2UodGhpcy5uZXh0UG9zIC0gMSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0UG9zIC09IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRQb3MgPT0gdGhpcy5saXN0SGVscGVyLm9iamVjdEFycmF5Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIE1ldGhvZGUgcmVtb3ZlKCkgZGVzIEl0ZXJhdG9ycyB3dXJkZSBhdWZnZXJ1ZmVuLCBvYndvaGwgbm9jaCBuaWUgbmV4dCgpIGF1ZmdlcnVmZW4gd3VyZGUuXCIpXHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMubmV4dFBvcyA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIE1ldGhvZGUgcmVtb3ZlKCkgZGVzIEl0ZXJhdG9ycyB3dXJkZSBhdWZnZXJ1ZmVuLCBvYndvaGwgZGFzIGxldHp0ZSBFbGVtZW50IHNjaG9uIGJlaW0gdm9yaGVyaWdlbiBBdWZydWYgenVyw7xja2dlZ2ViZW4gd29yZGVuIHdhci5cIilcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5saXN0SGVscGVyLnZhbHVlQXJyYXkuc3BsaWNlKHRoaXMubmV4dFBvcyArIDEsIDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdEhlbHBlci5vYmplY3RBcnJheS5zcGxpY2UodGhpcy5uZXh0UG9zICsgMSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5uZXh0UG9zICs9IDE7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbmV4dCgpOiBhbnkge1xyXG4gICAgICAgIHN3aXRjaCAodGhpcy5raW5kKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJhc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLm5leHRQb3MgPiB0aGlzLmxpc3RIZWxwZXIub2JqZWN0QXJyYXkubGVuZ3RoIC0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIudGhyb3dFeGNlcHRpb24oXCJEaWUgTWV0aG9kZSBuZXh0KCkgZGVzIEl0ZXJhdG9ycyB3dXJkZSBhdWZnZXJ1ZmVuLCBvYndvaGwgZGFzIGxldHp0ZSBFbGVtZW50IHNjaG9uIGJlaW0gdm9yaGVyaWdlbiBBdWZydWYgenVyw7xja2dlZ2ViZW4gd29yZGVuIHdhci5cIilcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmxpc3RIZWxwZXIub2JqZWN0QXJyYXlbdGhpcy5uZXh0UG9zKytdO1xyXG4gICAgICAgICAgICBjYXNlIFwiZGVzY2VuZGluZ1wiOlxyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubmV4dFBvcyA8IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnRocm93RXhjZXB0aW9uKFwiRGllIE1ldGhvZGUgbmV4dCgpIGRlcyBJdGVyYXRvcnMgd3VyZGUgYXVmZ2VydWZlbiwgb2J3b2hsIGRhcyBsZXR6dGUgRWxlbWVudCBzY2hvbiBiZWltIHZvcmhlcmlnZW4gQXVmcnVmIHp1csO8Y2tnZWdlYmVuIHdvcmRlbiB3YXIuXCIpXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5saXN0SGVscGVyLm9iamVjdEFycmF5W3RoaXMubmV4dFBvcy0tXTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaGFzTmV4dCgpOiBib29sZWFuIHtcclxuICAgICAgICBzd2l0Y2ggKHRoaXMua2luZCkge1xyXG4gICAgICAgICAgICBjYXNlIFwiYXNjZW5kaW5nXCI6XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5uZXh0UG9zIDwgdGhpcy5saXN0SGVscGVyLm9iamVjdEFycmF5Lmxlbmd0aDtcclxuICAgICAgICAgICAgY2FzZSBcImRlc2NlbmRpbmdcIjpcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLm5leHRQb3MgPj0gMDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuIl19