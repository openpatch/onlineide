import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { Klass } from "../Class.js";
import { booleanPrimitiveType, charPrimitiveType, intPrimitiveType, stringPrimitiveType } from "../PrimitiveTypes.js";
import { Method, Parameterlist } from "../Types.js";
export class CharacterClass extends Klass {
    constructor(baseClass) {
        super("Character", null, "Wrapper-Klasse, um char-Werte in Collections verenden zu können.");
        this.unboxableAs = [];
        this.baseClass = baseClass;
        this.staticClass.setupAttributeIndicesRecursive();
        this.staticClass.classObject = new RuntimeObject(this.staticClass);
    }
    canCastTo(type) {
        return this.unboxableAs.indexOf(type) >= 0 || super.canCastTo(type);
    }
    init() {
        this.unboxableAs = [charPrimitiveType, stringPrimitiveType];
        this.addMethod(new Method("Character", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), null, (parameters) => {
            parameters[0].value = parameters[1].value;
        }, false, false, "Instanziert ein neues Character-Objekt", true));
        this.addMethod(new Method("charValue", new Parameterlist([]), charPrimitiveType, (parameters) => { return parameters[0].value; }, false, false, "Wandelt das Character-Objekt in einen char-Wert um"));
        this.addMethod(new Method("compareTo", new Parameterlist([
            { identifier: "anotherCharacter", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            let v0 = parameters[0].value;
            let v1 = parameters[1].value;
            if (v0 > v1)
                return 1;
            if (v0 < v1)
                return -1;
            return 0;
        }, false, false, "Ist der Wert größer als der übergebene Wert, so wird +1 zurückgegeben. Ist er kleiner, so wird -1 zurückgegeben. Sind die Werte gleich, so wird 0 zurückgegeben."));
        this.addMethod(new Method("equals", new Parameterlist([
            { identifier: "anotherCharacter", type: this, declaration: null, usagePositions: null, isFinal: true }
        ]), booleanPrimitiveType, (parameters) => {
            return parameters[0].value == parameters[1].value;
        }, false, false, "Gibt genau dann true zurück, wenn der Wert gleich dem übergebenen Wert ist."));
        this.addMethod(new Method("toString", new Parameterlist([]), stringPrimitiveType, (parameters) => {
            return parameters[0].value;
        }, false, false, "Gibt den Wert des Objekts als String-Wert zurück."));
        this.addMethod(new Method("hashCode", new Parameterlist([]), intPrimitiveType, (parameters) => {
            return parameters[0].value.charCodeAt(0);
        }, false, false, "Gibt den hashCode des Objekts zurück."));
        this.addMethod(new Method("charValue", new Parameterlist([]), charPrimitiveType, (parameters) => {
            return parameters[0].value;
        }, false, false, "Gibt den char-Wert des Objekts zurück."));
        this.addMethod(new Method("digit", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "radix", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return Number.parseInt(parameters[1].value, parameters[2].value);
        }, false, true, "Gibt den numerischen Wert des Zeichens zur Basis radix zurück."));
        this.addMethod(new Method("forDigit", new Parameterlist([
            { identifier: "int-value", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "radix", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), charPrimitiveType, (parameters) => {
            return parameters[1].value.toString(parameters[2].value).charAt(0);
        }, false, true, "Gibt den übergebenen Wert als Ziffer im Zahlensystem zur Basis radix zurück."));
        this.addMethod(new Method("getNumericValue", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), intPrimitiveType, (parameters) => {
            return parameters[1].value.charCodeAt(0);
        }, false, true, "Wandelt das Zeichen in einen numerischen Wert (Unicode-Wert) um."));
        this.addMethod(new Method("isLetter", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType, (parameters) => {
            return parameters[1].value.match(/[a-zäöüß]/i) != null;
        }, false, true, "Gibt genau dann true zurück, wenn das Zeichen ein deutsches Alphabet-Zeichen ist."));
        this.addMethod(new Method("isLetterOrDigit", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType, (parameters) => {
            return parameters[1].value.match(/[a-zäöüß0-9]/i) != null;
        }, false, true, "Gibt genau dann true zurück, wenn das Zeichen ein deutsches Alphabet-Zeichen oder eine Ziffer ist."));
        this.addMethod(new Method("isDigit", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType, (parameters) => {
            return parameters[1].value.match(/[0-9]/i) != null;
        }, false, true, "Gibt genau dann true zurück, wenn das Zeichen eine Ziffer ist."));
        this.addMethod(new Method("isWhitespace", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), booleanPrimitiveType, (parameters) => {
            return parameters[1].value.match(/[ \r\n\t]/i) != null;
        }, false, true, "Gibt genau dann true zurück, wenn das Zeichen ein Leerzeichen, Tabulatorzeichen oder Zeilenumbruch ist."));
        this.addMethod(new Method("toUpperCase", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), charPrimitiveType, (parameters) => {
            return parameters[1].value.toLocaleUpperCase();
        }, false, true, "Wandelt das Zeichen in Großschreibung um."));
        this.addMethod(new Method("toLowerCase", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), charPrimitiveType, (parameters) => {
            return parameters[1].value.toLocaleLowerCase();
        }, false, true, "Wandelt das Zeichen in Kleinschreibung um."));
        this.addMethod(new Method("valueOf", new Parameterlist([
            { identifier: "char-value", type: charPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), this, (parameters) => {
            return parameters[1].value;
        }, false, true, "Wandelt den char-Wert in ein Character-Objekt um."));
    }
    debugOutput(value) {
        return "" + value.value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2hhcmFjdGVyQ2xhc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL3R5cGVzL2JveGVkVHlwZXMvQ2hhcmFjdGVyQ2xhc3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLHVDQUF1QyxDQUFDO0FBQ3RFLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDcEMsT0FBTyxFQUFFLG9CQUFvQixFQUFFLGlCQUFpQixFQUFFLGdCQUFnQixFQUFFLG1CQUFtQixFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDdEgsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQWUsTUFBTSxhQUFhLENBQUM7QUFHakUsTUFBTSxPQUFPLGNBQWUsU0FBUSxLQUFLO0lBSXJDLFlBQVksU0FBZ0I7UUFDeEIsS0FBSyxDQUFDLFdBQVcsRUFBRSxJQUFJLEVBQUUsa0VBQWtFLENBQUMsQ0FBQztRQUhqRyxnQkFBVyxHQUFHLEVBQUUsQ0FBQztRQUliLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxXQUFXLENBQUMsOEJBQThCLEVBQUUsQ0FBQztRQUVsRCxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7SUFFdkUsQ0FBQztJQUVELFNBQVMsQ0FBQyxJQUFVO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEUsQ0FBQztJQUVELElBQUk7UUFFQSxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUU1RCxJQUFJLENBQUMsU0FBUyxDQUFDLElB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VSxFQUFFLFlBQVksRUFBRSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7U0FDaEgsQ0FBQyxFQUFFLGlCQUFpQixFQUNqQixDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ1gsT0FBZ0IsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQU0sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1FBQzdELENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLDRDQUE0QyxDQUFDLENBQUMsQ0FBQztRQUVuRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLFNBQVMsRUFBRSxJQUFJLGFBQWEsQ0FBQztZQUNuRCxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsSUFBSSxFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO1NBQ2hILENBQUMsRUFBRSxJQUFJLEVBQ0osQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUNYLE9BQU8sVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztRQUMvQixDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxtREFBbUQsQ0FBQyxDQUFDLENBQUM7SUFHOUUsQ0FBQztJQUVNLFdBQVcsQ0FBQyxLQUFZO1FBQzNCLE9BQU8sRUFBRSxHQUFXLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDcEMsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUnVudGltZU9iamVjdCB9IGZyb20gXCIuLi8uLi8uLi9pbnRlcnByZXRlci9SdW50aW1lT2JqZWN0LmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzIH0gZnJvbSBcIi4uL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBjaGFyUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFR5cGUsIFZhbHVlIH0gZnJvbSBcIi4uL1R5cGVzLmpzXCI7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIENoYXJhY3RlckNsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIHVuYm94YWJsZUFzID0gW107XHJcblxyXG4gICAgY29uc3RydWN0b3IoYmFzZUNsYXNzOiBLbGFzcykge1xyXG4gICAgICAgIHN1cGVyKFwiQ2hhcmFjdGVyXCIsIG51bGwsIFwiV3JhcHBlci1LbGFzc2UsIHVtIGNoYXItV2VydGUgaW4gQ29sbGVjdGlvbnMgdmVyZW5kZW4genUga8O2bm5lbi5cIik7XHJcbiAgICAgICAgdGhpcy5iYXNlQ2xhc3MgPSBiYXNlQ2xhc3M7XHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5zZXR1cEF0dHJpYnV0ZUluZGljZXNSZWN1cnNpdmUoKTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGF0aWNDbGFzcy5jbGFzc09iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KHRoaXMuc3RhdGljQ2xhc3MpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjYW5DYXN0VG8odHlwZTogVHlwZSk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnVuYm94YWJsZUFzLmluZGV4T2YodHlwZSkgPj0gMCB8fCBzdXBlci5jYW5DYXN0VG8odHlwZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdCgpIHtcclxuXHJcbiAgICAgICAgdGhpcy51bmJveGFibGVBcyA9IFtjaGFyUHJpbWl0aXZlVHlwZSwgc3RyaW5nUHJpbWl0aXZlVHlwZV07XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJDaGFyYWN0ZXJcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY2hhci12YWx1ZVwiLCB0eXBlOiBjaGFyUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzWzBdLnZhbHVlID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJJbnN0YW56aWVydCBlaW4gbmV1ZXMgQ2hhcmFjdGVyLU9iamVrdFwiLCB0cnVlKSk7XHJcblxyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY2hhclZhbHVlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtdKSwgY2hhclByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7IHJldHVybiBwYXJhbWV0ZXJzWzBdLnZhbHVlOyB9LCBmYWxzZSwgZmFsc2UsIFwiV2FuZGVsdCBkYXMgQ2hhcmFjdGVyLU9iamVrdCBpbiBlaW5lbiBjaGFyLVdlcnQgdW1cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29tcGFyZVRvXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImFub3RoZXJDaGFyYWN0ZXJcIiwgdHlwZTogdGhpcywgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCB2MCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgdjEgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYwID4gdjEpIHJldHVybiAxO1xyXG4gICAgICAgICAgICAgICAgaWYgKHYwIDwgdjEpIHJldHVybiAtMTtcclxuICAgICAgICAgICAgICAgIHJldHVybiAwO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiSXN0IGRlciBXZXJ0IGdyw7bDn2VyIGFscyBkZXIgw7xiZXJnZWJlbmUgV2VydCwgc28gd2lyZCArMSB6dXLDvGNrZ2VnZWJlbi4gSXN0IGVyIGtsZWluZXIsIHNvIHdpcmQgLTEgenVyw7xja2dlZ2ViZW4uIFNpbmQgZGllIFdlcnRlIGdsZWljaCwgc28gd2lyZCAwIHp1csO8Y2tnZWdlYmVuLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJlcXVhbHNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiYW5vdGhlckNoYXJhY3RlclwiLCB0eXBlOiB0aGlzLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfVxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBwYXJhbWV0ZXJzWzBdLnZhbHVlID09IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgXCJHaWJ0IGdlbmF1IGRhbm4gdHJ1ZSB6dXLDvGNrLCB3ZW5uIGRlciBXZXJ0IGdsZWljaCBkZW0gw7xiZXJnZWJlbmVuIFdlcnQgaXN0LlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJ0b1N0cmluZ1wiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIHN0cmluZ1ByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIkdpYnQgZGVuIFdlcnQgZGVzIE9iamVrdHMgYWxzIFN0cmluZy1XZXJ0IHp1csO8Y2suXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImhhc2hDb2RlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgaW50UHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoPHN0cmluZz5wYXJhbWV0ZXJzWzBdLnZhbHVlKS5jaGFyQ29kZUF0KDApO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsIFwiR2lidCBkZW4gaGFzaENvZGUgZGVzIE9iamVrdHMgenVyw7xjay5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY2hhclZhbHVlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgY2hhclByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCBcIkdpYnQgZGVuIGNoYXItV2VydCBkZXMgT2JqZWt0cyB6dXLDvGNrLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJkaWdpdFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjaGFyLXZhbHVlXCIsIHR5cGU6IGNoYXJQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInJhZGl4XCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9XHJcbiAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gTnVtYmVyLnBhcnNlSW50KHBhcmFtZXRlcnNbMV0udmFsdWUsIHBhcmFtZXRlcnNbMl0udmFsdWUpO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSwgdHJ1ZSwgXCJHaWJ0IGRlbiBudW1lcmlzY2hlbiBXZXJ0IGRlcyBaZWljaGVucyB6dXIgQmFzaXMgcmFkaXggenVyw7xjay5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZm9yRGlnaXRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiaW50LXZhbHVlXCIsIHR5cGU6IGludFByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwicmFkaXhcIiwgdHlwZTogaW50UHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH1cclxuICAgICAgICBdKSwgY2hhclByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKDxudW1iZXI+cGFyYW1ldGVyc1sxXS52YWx1ZSkudG9TdHJpbmcocGFyYW1ldGVyc1syXS52YWx1ZSkuY2hhckF0KDApO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSwgdHJ1ZSwgXCJHaWJ0IGRlbiDDvGJlcmdlYmVuZW4gV2VydCBhbHMgWmlmZmVyIGltIFphaGxlbnN5c3RlbSB6dXIgQmFzaXMgcmFkaXggenVyw7xjay5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiZ2V0TnVtZXJpY1ZhbHVlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNoYXItdmFsdWVcIiwgdHlwZTogY2hhclByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBpbnRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICg8c3RyaW5nPnBhcmFtZXRlcnNbMV0udmFsdWUpLmNoYXJDb2RlQXQoMCk7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIldhbmRlbHQgZGFzIFplaWNoZW4gaW4gZWluZW4gbnVtZXJpc2NoZW4gV2VydCAoVW5pY29kZS1XZXJ0KSB1bS5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXNMZXR0ZXJcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY2hhci12YWx1ZVwiLCB0eXBlOiBjaGFyUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIGJvb2xlYW5QcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICg8c3RyaW5nPnBhcmFtZXRlcnNbMV0udmFsdWUpLm1hdGNoKC9bYS16w6TDtsO8w59dL2kpICE9IG51bGw7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIkdpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gZGFzIFplaWNoZW4gZWluIGRldXRzY2hlcyBBbHBoYWJldC1aZWljaGVuIGlzdC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXNMZXR0ZXJPckRpZ2l0XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNoYXItdmFsdWVcIiwgdHlwZTogY2hhclByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoPHN0cmluZz5wYXJhbWV0ZXJzWzFdLnZhbHVlKS5tYXRjaCgvW2EtesOkw7bDvMOfMC05XS9pKSAhPSBudWxsO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSwgdHJ1ZSwgXCJHaWJ0IGdlbmF1IGRhbm4gdHJ1ZSB6dXLDvGNrLCB3ZW5uIGRhcyBaZWljaGVuIGVpbiBkZXV0c2NoZXMgQWxwaGFiZXQtWmVpY2hlbiBvZGVyIGVpbmUgWmlmZmVyIGlzdC5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXNEaWdpdFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjaGFyLXZhbHVlXCIsIHR5cGU6IGNoYXJQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgYm9vbGVhblByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gKDxzdHJpbmc+cGFyYW1ldGVyc1sxXS52YWx1ZSkubWF0Y2goL1swLTldL2kpICE9IG51bGw7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIkdpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gZGFzIFplaWNoZW4gZWluZSBaaWZmZXIgaXN0LlwiKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiaXNXaGl0ZXNwYWNlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNoYXItdmFsdWVcIiwgdHlwZTogY2hhclByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBib29sZWFuUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoPHN0cmluZz5wYXJhbWV0ZXJzWzFdLnZhbHVlKS5tYXRjaCgvWyBcXHJcXG5cXHRdL2kpICE9IG51bGw7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIkdpYnQgZ2VuYXUgZGFubiB0cnVlIHp1csO8Y2ssIHdlbm4gZGFzIFplaWNoZW4gZWluIExlZXJ6ZWljaGVuLCBUYWJ1bGF0b3J6ZWljaGVuIG9kZXIgWmVpbGVudW1icnVjaCBpc3QuXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInRvVXBwZXJDYXNlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNoYXItdmFsdWVcIiwgdHlwZTogY2hhclByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBjaGFyUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAoPHN0cmluZz5wYXJhbWV0ZXJzWzFdLnZhbHVlKS50b0xvY2FsZVVwcGVyQ2FzZSgpO1xyXG4gICAgICAgICAgICB9LCBmYWxzZSwgdHJ1ZSwgXCJXYW5kZWx0IGRhcyBaZWljaGVuIGluIEdyb8Ofc2NocmVpYnVuZyB1bS5cIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwidG9Mb3dlckNhc2VcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY2hhci12YWx1ZVwiLCB0eXBlOiBjaGFyUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIGNoYXJQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICg8c3RyaW5nPnBhcmFtZXRlcnNbMV0udmFsdWUpLnRvTG9jYWxlTG93ZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIldhbmRlbHQgZGFzIFplaWNoZW4gaW4gS2xlaW5zY2hyZWlidW5nIHVtLlwiKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJ2YWx1ZU9mXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNoYXItdmFsdWVcIiwgdHlwZTogY2hhclByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCB0aGlzLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCB0cnVlLCBcIldhbmRlbHQgZGVuIGNoYXItV2VydCBpbiBlaW4gQ2hhcmFjdGVyLU9iamVrdCB1bS5cIikpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGRlYnVnT3V0cHV0KHZhbHVlOiBWYWx1ZSk6IHN0cmluZyB7XHJcbiAgICAgICAgcmV0dXJuIFwiXCIgKyA8bnVtYmVyPnZhbHVlLnZhbHVlO1xyXG4gICAgfVxyXG5cclxuXHJcbn1cclxuIl19