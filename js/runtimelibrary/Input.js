import { Method, Parameterlist } from "../compiler/types/Types.js";
import { Klass } from "../compiler/types/Class.js";
import { stringPrimitiveType, doublePrimitiveType, floatPrimitiveType, intPrimitiveType, charPrimitiveType, booleanPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
export class InputClass extends Klass {
    constructor(module) {
        super("Input", module, "Klasse mit statischen Methoden zur Eingabe von Text per Tastatur");
        this.setBaseClass(module.typeStore.getType("Object"));
        this.addMethod(new Method("readChar", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), charPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp char"));
        this.addMethod(new Method("readInt", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp int"));
        this.addMethod(new Method("readString", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), stringPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp String"));
        this.addMethod(new Method("readFloat", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), floatPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp float"));
        this.addMethod(new Method("readDouble", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp double"));
        this.addMethod(new Method("readBoolean", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Defaultwert", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp boolean"));
        /**
         * Same methods without default value:
         */
        this.addMethod(new Method("readChar", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), charPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp char"));
        this.addMethod(new Method("readInt", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp int"));
        this.addMethod(new Method("readString", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), stringPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp String"));
        this.addMethod(new Method("readFloat", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), floatPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp float"));
        this.addMethod(new Method("readDouble", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), doublePrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp double"));
        this.addMethod(new Method("readBoolean", new Parameterlist([
            { identifier: "Meldungstext", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType, (parameters) => {
            return null; // done by compiler magic in class Interpreter!
        }, false, true, "Erwartet vom Benutzer die Eingabe eines Wertes vom Datentyp boolean"));
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L0lucHV0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBUSxNQUFNLEVBQUUsYUFBYSxFQUFvQixNQUFNLDRCQUE0QixDQUFDO0FBQzNGLE9BQU8sRUFBRSxLQUFLLEVBQWMsTUFBTSw0QkFBNEIsQ0FBQztBQUMvRCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CLEVBQUUsTUFBTSxxQ0FBcUMsQ0FBQztBQUk5SyxNQUFNLE9BQU8sVUFBVyxTQUFRLEtBQUs7SUFFakMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLGtFQUFrRSxDQUFDLENBQUM7UUFFM0YsSUFBSSxDQUFDLFlBQVksQ0FBUSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO1FBRTdELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsVUFBVSxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ3BELEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7WUFDakgsRUFBRSxVQUFVLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUM3RyxDQUFDLEVBQUUsaUJBQWlCLEVBQ3JCLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDWCxPQUFPLElBQUksQ0FBQyxDQUFDLCtDQUErQztRQUNoRSxDQUFDLEVBQ0wsS0FBSyxF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QUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUNoSCxDQUFDLEVBQUUsbUJBQW1CLEVBQ3ZCLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDWCxPQUFPLElBQUksQ0FBQyxDQUFDLCtDQUErQztRQUNoRSxDQUFDLEVBQ0wsS0FBSyxFQUFFLElBQUksRUFBRSxvRUFBb0UsQ0FBQyxDQUFDLENBQUM7UUFFcEYsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxhQUFhLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDdkQsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUNoSCxDQUFDLEVBQUUsb0JBQW9CLEVBQ3hCLENBQUMsVUFBVSxFQUFFLEVBQUU7WUFDWCxPQUFPLElBQUksQ0FBQyxDQUFDLCtDQUErQztRQUNoRSxDQUFDLEVBQ0wsS0FBSyxFQUFFLElBQUksRUFBRSxxRUFBcUUsQ0FBQyxDQUFDLENBQUM7SUFFekYsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVHlwZSwgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSwgQXR0cmlidXRlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBWaXNpYmlsaXR5IH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRvdWJsZVByaW1pdGl2ZVR5cGUsIGZsb2F0UHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgY2hhclByaW1pdGl2ZVR5cGUsIGJvb2xlYW5QcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IFByaW50TWFuYWdlciB9IGZyb20gXCIuLi9tYWluL2d1aS9QcmludE1hbmFnZXIuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBJbnB1dENsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcbiAgICAgICAgc3VwZXIoXCJJbnB1dFwiLCBtb2R1bGUsIFwiS2xhc3NlIG1pdCBzdGF0aXNjaGVuIE1ldGhvZGVuIHp1ciBFaW5nYWJlIHZvbiBUZXh0IHBlciBUYXN0YXR1clwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXRCYXNlQ2xhc3MoPEtsYXNzPm1vZHVsZS50eXBlU3RvcmUuZ2V0VHlwZShcIk9iamVjdFwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZWFkQ2hhclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNZWxkdW5nc3RleHRcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJEZWZhdWx0d2VydFwiLCB0eXBlOiBjaGFyUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICAgICAgXSksIGNoYXJQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIGRvbmUgYnkgY29tcGlsZXIgbWFnaWMgaW4gY2xhc3MgSW50ZXJwcmV0ZXIhXHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgIGZhbHNlLCB0cnVlLCBcIkVyd2FydGV0IHZvbSBCZW51dHplciBkaWUgRWluZ2FiZSBlaW5lcyBXZXJ0ZXMgdm9tIERhdGVudHlwIGNoYXJcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVhZEludFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNZWxkdW5nc3RleHRcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJEZWZhdWx0d2VydFwiLCB0eXBlOiBpbnRQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBkb25lIGJ5IGNvbXBpbGVyIG1hZ2ljIGluIGNsYXNzIEludGVycHJldGVyIVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICBmYWxzZSwgdHJ1ZSwgXCJFcndhcnRldCB2b20gQmVudXR6ZXIgZGllIEVpbmdhYmUgZWluZXMgV2VydGVzIHZvbSBEYXRlbnR5cCBpbnRcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVhZFN0cmluZ1wiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNZWxkdW5nc3RleHRcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJEZWZhdWx0d2VydFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgICAgICBdKSwgc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBkb25lIGJ5IGNvbXBpbGVyIG1hZ2ljIGluIGNsYXNzIEludGVycHJldGVyIVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICBmYWxzZSwgdHJ1ZSwgXCJFcndhcnRldCB2b20gQmVudXR6ZXIgZGllIEVpbmdhYmUgZWluZXMgV2VydGVzIHZvbSBEYXRlbnR5cCBTdHJpbmdcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVhZEZsb2F0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1lbGR1bmdzdGV4dFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIkRlZmF1bHR3ZXJ0XCIsIHR5cGU6IGZsb2F0UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICAgICAgXSksIGZsb2F0UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBkb25lIGJ5IGNvbXBpbGVyIG1hZ2ljIGluIGNsYXNzIEludGVycHJldGVyIVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICBmYWxzZSwgdHJ1ZSwgXCJFcndhcnRldCB2b20gQmVudXR6ZXIgZGllIEVpbmdhYmUgZWluZXMgV2VydGVzIHZvbSBEYXRlbnR5cCBmbG9hdFwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZWFkRG91YmxlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1lbGR1bmdzdGV4dFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIkRlZmF1bHR3ZXJ0XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgICAgIF0pLCBkb3VibGVQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIGRvbmUgYnkgY29tcGlsZXIgbWFnaWMgaW4gY2xhc3MgSW50ZXJwcmV0ZXIhXHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgIGZhbHNlLCB0cnVlLCBcIkVyd2FydGV0IHZvbSBCZW51dHplciBkaWUgRWluZ2FiZSBlaW5lcyBXZXJ0ZXMgdm9tIERhdGVudHlwIGRvdWJsZVwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZWFkQm9vbGVhblwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJNZWxkdW5nc3RleHRcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJEZWZhdWx0d2VydFwiLCB0eXBlOiBib29sZWFuUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIGRvbmUgYnkgY29tcGlsZXIgbWFnaWMgaW4gY2xhc3MgSW50ZXJwcmV0ZXIhXHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgIGZhbHNlLCB0cnVlLCBcIkVyd2FydGV0IHZvbSBCZW51dHplciBkaWUgRWluZ2FiZSBlaW5lcyBXZXJ0ZXMgdm9tIERhdGVudHlwIGJvb2xlYW5cIikpO1xyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBTYW1lIG1ldGhvZHMgd2l0aG91dCBkZWZhdWx0IHZhbHVlOlxyXG4gICAgICAgICAqL1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVhZENoYXJcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTWVsZHVuZ3N0ZXh0XCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICBdKSwgY2hhclByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gZG9uZSBieSBjb21waWxlciBtYWdpYyBpbiBjbGFzcyBJbnRlcnByZXRlciFcclxuICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgZmFsc2UsIHRydWUsIFwiRXJ3YXJ0ZXQgdm9tIEJlbnV0emVyIGRpZSBFaW5nYWJlIGVpbmVzIFdlcnRlcyB2b20gRGF0ZW50eXAgY2hhclwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZWFkSW50XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1lbGR1bmdzdGV4dFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gZG9uZSBieSBjb21waWxlciBtYWdpYyBpbiBjbGFzcyBJbnRlcnByZXRlciFcclxuICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgZmFsc2UsIHRydWUsIFwiRXJ3YXJ0ZXQgdm9tIEJlbnV0emVyIGRpZSBFaW5nYWJlIGVpbmVzIFdlcnRlcyB2b20gRGF0ZW50eXAgaW50XCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJlYWRTdHJpbmdcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTWVsZHVuZ3N0ZXh0XCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICBdKSwgc3RyaW5nUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBkb25lIGJ5IGNvbXBpbGVyIG1hZ2ljIGluIGNsYXNzIEludGVycHJldGVyIVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICBmYWxzZSwgdHJ1ZSwgXCJFcndhcnRldCB2b20gQmVudXR6ZXIgZGllIEVpbmdhYmUgZWluZXMgV2VydGVzIHZvbSBEYXRlbnR5cCBTdHJpbmdcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicmVhZEZsb2F0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1lbGR1bmdzdGV4dFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgXSksIGZsb2F0UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsOyAvLyBkb25lIGJ5IGNvbXBpbGVyIG1hZ2ljIGluIGNsYXNzIEludGVycHJldGVyIVxyXG4gICAgICAgICAgICB9LCBcclxuICAgICAgICBmYWxzZSwgdHJ1ZSwgXCJFcndhcnRldCB2b20gQmVudXR6ZXIgZGllIEVpbmdhYmUgZWluZXMgV2VydGVzIHZvbSBEYXRlbnR5cCBmbG9hdFwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJyZWFkRG91YmxlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1lbGR1bmdzdGV4dFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgXSksIGRvdWJsZVByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDsgLy8gZG9uZSBieSBjb21waWxlciBtYWdpYyBpbiBjbGFzcyBJbnRlcnByZXRlciFcclxuICAgICAgICAgICAgfSwgXHJcbiAgICAgICAgZmFsc2UsIHRydWUsIFwiRXJ3YXJ0ZXQgdm9tIEJlbnV0emVyIGRpZSBFaW5nYWJlIGVpbmVzIFdlcnRlcyB2b20gRGF0ZW50eXAgZG91YmxlXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInJlYWRCb29sZWFuXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIk1lbGR1bmdzdGV4dFwiLCB0eXBlOiBzdHJpbmdQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7IC8vIGRvbmUgYnkgY29tcGlsZXIgbWFnaWMgaW4gY2xhc3MgSW50ZXJwcmV0ZXIhXHJcbiAgICAgICAgICAgIH0sIFxyXG4gICAgICAgIGZhbHNlLCB0cnVlLCBcIkVyd2FydGV0IHZvbSBCZW51dHplciBkaWUgRWluZ2FiZSBlaW5lcyBXZXJ0ZXMgdm9tIERhdGVudHlwIGJvb2xlYW5cIikpO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG59Il19