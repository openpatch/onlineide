import { Method, Parameterlist, Attribute } from "../compiler/types/Types.js";
import { Klass, Visibility } from "../compiler/types/Class.js";
import { doublePrimitiveType, floatPrimitiveType, intPrimitiveType } from "../compiler/types/PrimitiveTypes.js";
import { RuntimeObject } from "../interpreter/RuntimeObject.js";
export class MathClass extends Klass {
    constructor(module) {
        super("Math", module);
        this.setBaseClass(module.typeStore.getType("Object"));
        this.addAttribute(new Attribute("PI", doublePrimitiveType, (value) => { value.value = Math.PI; }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addAttribute(new Attribute("E", doublePrimitiveType, (value) => { value.value = Math.E; }, true, Visibility.public, true, "Die Eulersche Zahl e"));
        this.staticClass.classObject = new RuntimeObject(this.staticClass);
        this.staticClass.classObject.initializeAttributeValues();
        this.addMethod(new Method("round", new Parameterlist([
            { identifier: "Wert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return Math.round(parameters[1].value);
        }, false, true, "**Rundet** den Wert"));
        this.addMethod(new Method("floor", new Parameterlist([
            { identifier: "Wert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return Math.floor(parameters[1].value);
        }, false, true, "Rundet den Wert ab, sucht also die **nächstkleinere** ganze Zahl"));
        this.addMethod(new Method("ceil", new Parameterlist([
            { identifier: "Wert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return Math.ceil(parameters[1].value);
        }, false, true, "Rundet den Wert auf, sucht also die **nächstgrößere** Zahl."));
        this.addMethod(new Method("signum", new Parameterlist([
            { identifier: "Wert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return Math.sign(parameters[1].value);
        }, false, true, "Gibt das Vorzeichen der Zahl zurück, d.h. \n  - -1, falls die Zahl **negativ** ist,\n  - 0, falls die Zahl **0** ist und\n  - +1, falls die Zahl **positiv** ist."));
        this.addMethod(new Method("sqrt", new Parameterlist([
            { identifier: "Wert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.sqrt(parameters[1].value);
        }, false, true, "Gibt die **Quadratwurzel** der Zahl zurück. Für andere Wurzeln benutze Math.pow(a, b), z.B. Math.pow(10, 1.0/3.0) für die Kubikwurzel aus 10."));
        this.addMethod(new Method("random", new Parameterlist([]), doublePrimitiveType, (parameters) => {
            return Math.random();
        }, false, true, "Gibt eine Zufallszahl aus dem Intervall [0;1[ zurück."));
        this.addMethod(new Method("pow", new Parameterlist([
            { identifier: "Basis", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "Exponent", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.pow(parameters[1].value, parameters[2].value);
        }, false, true, 'Math.pow(a, b) gibt "a hoch b" zurück.'));
        this.addMethod(new Method("toDegrees", new Parameterlist([
            { identifier: "WinkelInRad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return parameters[1].value / 180 * Math.PI;
        }, false, true, "Wandelt einen Winkel von Rad in Grad um, d.h. berechnet Winkel/Pi*180."));
        this.addMethod(new Method("toRadians", new Parameterlist([
            { identifier: "WinkelInGrad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return parameters[1].value / Math.PI * 180;
        }, false, true, "Wandelt einen Winkel von Grad in Rad um, d.h. berechnet Winkel/180*Pi."));
        this.addMethod(new Method("exp", new Parameterlist([
            { identifier: "Zahl", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.exp(parameters[1].value);
        }, false, true, 'Berechnet "e hoch die Zahl".'));
        this.addMethod(new Method("log", new Parameterlist([
            { identifier: "Zahl", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.log(parameters[1].value);
        }, false, true, "Berechnet den natürlichen Logarithmus der Zahl."));
        this.addMethod(new Method("log10", new Parameterlist([
            { identifier: "Zahl", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.log10(parameters[1].value);
        }, false, true, "Berechnet den Zehnerlogarithmus der Zahl."));
        this.addMethod(new Method("sin", new Parameterlist([
            { identifier: "WinkelInRad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.sin(parameters[1].value);
        }, false, true, "Berechnet den Sinus des Winkels."));
        this.addMethod(new Method("cos", new Parameterlist([
            { identifier: "WinkelInRad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.cos(parameters[1].value);
        }, false, true, "Berechnet den Cosinus des Winkels."));
        this.addMethod(new Method("tan", new Parameterlist([
            { identifier: "WinkelInRad", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.tan(parameters[1].value);
        }, false, true, "Berechnet den Tangens des Winkels."));
        this.addMethod(new Method("asin", new Parameterlist([
            { identifier: "WertDesSinus", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.asin(parameters[1].value);
        }, false, true, "Berechnet den Arcus-Sinus des Wertes in Rad."));
        this.addMethod(new Method("acos", new Parameterlist([
            { identifier: "WertDesCosinus", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.acos(parameters[1].value);
        }, false, true, "Berechnet den Arcus-Cosinus des Wertes in Rad."));
        this.addMethod(new Method("atan", new Parameterlist([
            { identifier: "WertDesTangens", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.atan(parameters[1].value);
        }, false, true, "Berechnet den Arcus-Tangens des Wertes in Rad."));
        this.addMethod(new Method("atan2", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.atan2(parameters[1].value, parameters[2].value);
        }, false, true, "Sind (x, y) die kartesischen Koordinaten eines Punktes, so ist Math.atan2(x, y) der Winkel alpha der Polarkoordinaten (alpha, r) des Punktes. \n**Bem.: **Alpha wird in Rad berechnet."));
        this.addMethod(new Method("abs", new Parameterlist([
            { identifier: "Wert", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), doublePrimitiveType, (parameters) => {
            return Math.abs(parameters[1].value);
        }, false, true, "Berechnet den Betrag des Wertes."));
        this.addMethod(new Method("abs", new Parameterlist([
            { identifier: "Wert", type: floatPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), floatPrimitiveType, (parameters) => {
            return Math.abs(parameters[1].value);
        }, false, true, "Berechnet den Betrag des Wertes."));
        this.addMethod(new Method("abs", new Parameterlist([
            { identifier: "Wert", type: intPrimitiveType, declaration: null, usagePositions: null, isFinal: true }
        ]), intPrimitiveType, (parameters) => {
            return Math.abs(parameters[1].value);
        }, false, true, "Berechnet den Betrag des Wertes."));
    }
}
//# sourceMappingURL=Math.js.map