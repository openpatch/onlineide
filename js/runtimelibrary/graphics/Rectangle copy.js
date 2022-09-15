import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { FilledShapeHelper } from "./FilledShape.js";
export class RectangleClass extends Klass {
    constructor(module) {
        super("Rectangle", module);
        this.setBaseClass(module.typeStore.getType("FilledShape"));
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("Rectangle", new Parameterlist([
            { identifier: "left", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "top", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "width", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "height", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let left = parameters[1].value;
            let top = parameters[2].value;
            let width = parameters[3].value;
            let height = parameters[4].value;
            let rh = new RectangleHelper(left, top, width, height, module.main.interpreter, o);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert ein neues, achsenparalleles Rechteck-Objekt. (left, top) sind die Koordinaten der linken oberen Ecke.', true));
        this.addMethod(new Method("getWidth", new Parameterlist([]), doublePrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("getWidth"))
                return;
            return sh.width * sh.displayObject.scale.x;
        }, false, false, "Gibt die Breite zurück.", false));
        this.addMethod(new Method("getHeight", new Parameterlist([]), doublePrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("getHeight"))
                return;
            return sh.height * sh.displayObject.scale.y;
        }, false, false, "Gibt die Höhe zurück.", false));
    }
}
export class RectangleHelper extends FilledShapeHelper {
    constructor(left, top, width, height, interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.left = left;
        this.top = top;
        this.width = width;
        this.height = height;
        this.centerXInitial = left + width / 2;
        this.centerYInitial = top + height / 2;
        this.hitPolygonInitial = [
            { x: left, y: top }, { x: left, y: top + height }, { x: left + width, y: top + height }, { x: left + width, y: top }
        ];
        this.render();
    }
    render() {
        let g = this.displayObject;
        if (this.displayObject == null) {
            g = new PIXI.Graphics();
            this.displayObject = g;
            this.worldHelper.stage.addChild(g);
        }
        else {
            g.clear();
        }
        if (this.fillColor != null) {
            g.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            g.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
        }
        g.moveTo(this.left, this.top);
        g.lineTo(this.left + this.width, this.top);
        g.lineTo(this.left + this.width, this.top + this.height);
        g.lineTo(this.left, this.top + this.height);
        g.closePath();
        if (this.fillColor != null) {
            g.endFill();
        }
    }
    ;
}
//# sourceMappingURL=Rectangle copy.js.map