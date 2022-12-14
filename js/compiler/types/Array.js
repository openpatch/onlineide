import { Attribute, Type } from "./Types.js";
import { TokenType } from "../lexer/Token.js";
import { intPrimitiveType } from "./PrimitiveTypes.js";
import { Visibility } from "./Class.js";
export class ArrayType extends Type {
    constructor(arrayOfType) {
        super();
        this.arrayOfType = arrayOfType;
        this.identifier = "Array";
        if (arrayOfType != null) {
            this.identifier = arrayOfType.identifier + "[]";
        }
        this.lengthAttribute = new Attribute("length", intPrimitiveType, (object) => {
            return object.value.length;
        }, false, Visibility.public, true);
    }
    equals(type) {
        return (type instanceof ArrayType) && type.arrayOfType.equals(this.arrayOfType);
    }
    get id() {
        return this.arrayOfType.identifier + "[]";
    }
    getResultType(operation, secondOperandType) {
        if (operation == TokenType.referenceElement) {
            return this.arrayOfType;
        }
        return null;
    }
    compute(operation, firstOperand, secondOperand) {
        if (operation == TokenType.referenceElement) {
            return firstOperand.value[secondOperand.value];
        }
    }
    getMethod(identifier, signature) {
        return null;
    }
    getAttribute(identifier) {
        if (identifier == "length") {
            return this.lengthAttribute;
        }
        return null;
    }
    canCastTo(type) {
        if (!(type instanceof ArrayType)) {
            return false;
        }
        return this.arrayOfType.canCastTo(type.arrayOfType);
    }
    castTo(value, type) {
        let array = value.value.slice();
        let destType = type.arrayOfType;
        for (let a of array) {
            this.arrayOfType.castTo(a, destType);
        }
        return {
            type: type,
            value: array
        };
    }
    debugOutput(value, maxLength = 40) {
        let length = 0;
        if (value.value != null) {
            let s = "[";
            let a = value.value;
            for (let i = 0; i < a.length; i++) {
                let v = a[i];
                let s1 = v.type.debugOutput(v, maxLength / 2);
                s += s1;
                if (i < a.length - 1)
                    s += ",&nbsp;";
                length += s1.length;
                if (length > maxLength)
                    break;
            }
            return s + "]";
        }
        else
            return "null";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXJyYXkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL3R5cGVzL0FycmF5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBVSxTQUFTLEVBQVMsSUFBSSxFQUFnQyxNQUFNLFlBQVksQ0FBQztBQUMxRixPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDOUMsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0scUJBQXFCLENBQUM7QUFDdkQsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUV4QyxNQUFNLE9BQU8sU0FBVSxTQUFRLElBQUk7SUFLL0IsWUFBWSxXQUFpQjtRQUN6QixLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1FBQy9CLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO1FBRTFCLElBQUcsV0FBVyxJQUFJLElBQUksRUFBQztZQUNuQixJQUFJLENBQUMsVUFBVSxHQUFHLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO1NBQ25EO1FBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFhLEVBQUUsRUFBRTtZQUMvRSxPQUFlLE1BQU0sQ0FBQyxLQUFNLENBQUMsTUFBTSxDQUFDO1FBQ3hDLENBQUMsRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRU0sTUFBTSxDQUFDLElBQVM7UUFDbkIsT0FBTyxDQUFDLElBQUksWUFBWSxTQUFTLENBQUMsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDcEYsQ0FBQztJQUVELElBQVcsRUFBRTtRQUNULE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0lBQzlDLENBQUM7SUFFTSxhQUFhLENBQUMsU0FBb0IsRUFBRSxpQkFBd0I7UUFDL0QsSUFBRyxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFDO1lBQ3ZDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUMzQjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBRWhCLENBQUM7SUFFTSxPQUFPLENBQUMsU0FBb0IsRUFBRSxZQUFtQixFQUFFLGFBQXFCO1FBRTNFLElBQUcsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBQztZQUN2QyxPQUFjLFlBQVksQ0FBQyxLQUFLLENBQVMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ2pFO0lBRUwsQ0FBQztJQUVNLFNBQVMsQ0FBQyxVQUFrQixFQUFFLFNBQXdCO1FBQ3pELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxZQUFZLENBQUMsVUFBa0I7UUFDbEMsSUFBRyxVQUFVLElBQUksUUFBUSxFQUFDO1lBQ3RCLE9BQU8sSUFBSSxDQUFDLGVBQWUsQ0FBQztTQUMvQjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxTQUFTLENBQUMsSUFBVTtRQUV2QixJQUFHLENBQUMsQ0FBQyxJQUFJLFlBQVksU0FBUyxDQUFDLEVBQUM7WUFDNUIsT0FBTyxLQUFLLENBQUM7U0FDaEI7UUFFRCxPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRU0sTUFBTSxDQUFDLEtBQVksRUFBRSxJQUFVO1FBRWxDLElBQUksS0FBSyxHQUFhLEtBQUssQ0FBQyxLQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDM0MsSUFBSSxRQUFRLEdBQXdCLElBQUssQ0FBQyxXQUFXLENBQUM7UUFFdEQsS0FBSSxJQUFJLENBQUMsSUFBSSxLQUFLLEVBQUM7WUFDZixJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDeEM7UUFFRCxPQUFPO1lBQ0gsSUFBSSxFQUFFLElBQUk7WUFDVixLQUFLLEVBQUUsS0FBSztTQUNmLENBQUE7SUFFTCxDQUFDO0lBRU0sV0FBVyxDQUFDLEtBQVksRUFBRSxZQUFvQixFQUFFO1FBRW5ELElBQUksTUFBTSxHQUFXLENBQUMsQ0FBQztRQUV2QixJQUFHLEtBQUssQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFDO1lBRW5CLElBQUksQ0FBQyxHQUFXLEdBQUcsQ0FBQztZQUVoQixJQUFJLENBQUMsR0FBcUIsS0FBSyxDQUFDLEtBQUssQ0FBQztZQUV0QyxLQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBQztnQkFFN0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUViLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxTQUFTLEdBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1IsSUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sR0FBRyxDQUFDO29CQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7Z0JBQ3BDLE1BQU0sSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUVwQixJQUFHLE1BQU0sR0FBRyxTQUFTO29CQUFFLE1BQU07YUFFaEM7WUFFTCxPQUFPLENBQUMsR0FBRyxHQUFHLENBQUE7U0FFakI7O1lBQU0sT0FBTyxNQUFNLENBQUM7SUFHekIsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWV0aG9kLCBBdHRyaWJ1dGUsIFZhbHVlLCBUeXBlLCBQYXJhbWV0ZXJsaXN0LCBQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4vVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgVG9rZW5UeXBlIH0gZnJvbSBcIi4uL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IGludFByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBWaXNpYmlsaXR5IH0gZnJvbSBcIi4vQ2xhc3MuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBBcnJheVR5cGUgZXh0ZW5kcyBUeXBlIHtcclxuXHJcbiAgICBwdWJsaWMgYXJyYXlPZlR5cGU6IFR5cGU7XHJcbiAgICBwcml2YXRlIGxlbmd0aEF0dHJpYnV0ZTogQXR0cmlidXRlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGFycmF5T2ZUeXBlOiBUeXBlKXtcclxuICAgICAgICBzdXBlcigpO1xyXG4gICAgICAgIHRoaXMuYXJyYXlPZlR5cGUgPSBhcnJheU9mVHlwZTtcclxuICAgICAgICB0aGlzLmlkZW50aWZpZXIgPSBcIkFycmF5XCI7XHJcblxyXG4gICAgICAgIGlmKGFycmF5T2ZUeXBlICE9IG51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLmlkZW50aWZpZXIgPSBhcnJheU9mVHlwZS5pZGVudGlmaWVyICsgXCJbXVwiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5sZW5ndGhBdHRyaWJ1dGUgPSBuZXcgQXR0cmlidXRlKFwibGVuZ3RoXCIsIGludFByaW1pdGl2ZVR5cGUsIChvYmplY3Q6IFZhbHVlKSA9PiB7XHJcbiAgICAgICAgICAgIHJldHVybiAoPGFueVtdPm9iamVjdC52YWx1ZSkubGVuZ3RoO1xyXG4gICAgICAgIH0sIGZhbHNlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSk7XHJcbiAgICB9ICAgXHJcblxyXG4gICAgcHVibGljIGVxdWFscyh0eXBlOlR5cGUpOiBib29sZWFue1xyXG4gICAgICAgIHJldHVybiAodHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkgJiYgdHlwZS5hcnJheU9mVHlwZS5lcXVhbHModGhpcy5hcnJheU9mVHlwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldCBpZCgpOnN0cmluZ3tcclxuICAgICAgICByZXR1cm4gdGhpcy5hcnJheU9mVHlwZS5pZGVudGlmaWVyICsgXCJbXVwiO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRSZXN1bHRUeXBlKG9wZXJhdGlvbjogVG9rZW5UeXBlLCBzZWNvbmRPcGVyYW5kVHlwZT86IFR5cGUpOiBUeXBlIHtcclxuICAgICAgICBpZihvcGVyYXRpb24gPT0gVG9rZW5UeXBlLnJlZmVyZW5jZUVsZW1lbnQpe1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hcnJheU9mVHlwZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY29tcHV0ZShvcGVyYXRpb246IFRva2VuVHlwZSwgZmlyc3RPcGVyYW5kOiBWYWx1ZSwgc2Vjb25kT3BlcmFuZD86IFZhbHVlKTogYW55IHtcclxuXHJcbiAgICAgICAgaWYob3BlcmF0aW9uID09IFRva2VuVHlwZS5yZWZlcmVuY2VFbGVtZW50KXtcclxuICAgICAgICAgICAgcmV0dXJuIDxhbnlbXT5maXJzdE9wZXJhbmQudmFsdWVbPG51bWJlcj5zZWNvbmRPcGVyYW5kLnZhbHVlXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBnZXRNZXRob2QoaWRlbnRpZmllcjogc3RyaW5nLCBzaWduYXR1cmU6IFBhcmFtZXRlcmxpc3QpOiBNZXRob2R7XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGdldEF0dHJpYnV0ZShpZGVudGlmaWVyOiBzdHJpbmcpOiBBdHRyaWJ1dGV7XHJcbiAgICAgICAgaWYoaWRlbnRpZmllciA9PSBcImxlbmd0aFwiKXtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMubGVuZ3RoQXR0cmlidXRlO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgY2FuQ2FzdFRvKHR5cGU6IFR5cGUpOiBib29sZWFue1xyXG5cclxuICAgICAgICBpZighKHR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUpKXtcclxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYXJyYXlPZlR5cGUuY2FuQ2FzdFRvKHR5cGUuYXJyYXlPZlR5cGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBjYXN0VG8odmFsdWU6IFZhbHVlLCB0eXBlOiBUeXBlKTogVmFsdWUge1xyXG5cclxuICAgICAgICBsZXQgYXJyYXkgPSAoPFZhbHVlW10+dmFsdWUudmFsdWUpLnNsaWNlKCk7XHJcbiAgICAgICAgbGV0IGRlc3RUeXBlID0gKDxBcnJheVR5cGU+PHVua25vd24+dHlwZSkuYXJyYXlPZlR5cGU7XHJcblxyXG4gICAgICAgIGZvcihsZXQgYSBvZiBhcnJheSl7XHJcbiAgICAgICAgICAgIHRoaXMuYXJyYXlPZlR5cGUuY2FzdFRvKGEsIGRlc3RUeXBlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHR5cGU6IHR5cGUsXHJcbiAgICAgICAgICAgIHZhbHVlOiBhcnJheVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYnVnT3V0cHV0KHZhbHVlOiBWYWx1ZSwgbWF4TGVuZ3RoOiBudW1iZXIgPSA0MCk6c3RyaW5nIHtcclxuXHJcbiAgICAgICAgbGV0IGxlbmd0aDogbnVtYmVyID0gMDtcclxuXHJcbiAgICAgICAgaWYodmFsdWUudmFsdWUgIT0gbnVsbCl7XHJcblxyXG4gICAgICAgICAgICBsZXQgczogc3RyaW5nID0gXCJbXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGE6IFZhbHVlW10gPSA8VmFsdWVbXT52YWx1ZS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IobGV0IGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKyl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCB2ID0gYVtpXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHMxID0gdi50eXBlLmRlYnVnT3V0cHV0KHYsIG1heExlbmd0aC8yKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgcyArPSBzMTtcclxuICAgICAgICAgICAgICAgICAgICBpZihpIDwgYS5sZW5ndGggLSAxKSBzICs9IFwiLCZuYnNwO1wiO1xyXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aCArPSBzMS5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmKGxlbmd0aCA+IG1heExlbmd0aCkgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHMgKyBcIl1cIlxyXG5cclxuICAgICAgICB9IGVsc2UgcmV0dXJuIFwibnVsbFwiO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxufVxyXG4iXX0=