import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { FilledShapeHelper } from "./FilledShape.js";
export class CircleClass extends Klass {
    constructor(module) {
        super("Circle", module);
        this.setBaseClass(module.typeStore.getType("FilledShape"));
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("Circle", new Parameterlist([
            { identifier: "mx", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "my", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "r", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let mx = parameters[1].value;
            let my = parameters[2].value;
            let r = parameters[3].value;
            let rh = new CircleHelper(mx, my, r, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = rh;
        }, false, false, 'Instanziert einen neuen Kreis. (mx, my) ist der Mittelpunt, r sein Radius.', true));
        this.addMethod(new Method("setRadius", new Parameterlist([
            { identifier: "radius", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let r = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("setRadius"))
                return;
            sh.setRadius(r);
        }, false, false, 'Setzt den Radius des Kreises."', false));
        this.addMethod(new Method("getRadius", new Parameterlist([]), doublePrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("getRadius"))
                return;
            return sh.r * sh.displayObject.scale.x;
        }, false, false, "Gibt den Radius zurück.", false));
    }
}
export class CircleHelper extends FilledShapeHelper {
    constructor(mx, my, r, interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.mx = mx;
        this.my = my;
        this.r = r;
        this.centerXInitial = mx;
        this.centerYInitial = my;
        this.hitPolygonInitial = [];
        let deltaAlpha = Math.PI / 8;
        for (let i = 0; i < 16; i++) {
            let alpha = deltaAlpha * i;
            this.hitPolygonInitial.push({
                x: mx + r * Math.cos(alpha),
                y: my + r * Math.sin(alpha)
            });
        }
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
        g.drawCircle(this.mx, this.my, this.r);
        g.closePath();
        if (this.fillColor != null) {
            g.endFill();
        }
    }
    ;
    setRadius(r) {
        this.r = r;
        this.render();
    }
    isOutsideView() {
        return super.isOutsideView();
    }
    containsPoint(x, y) {
        if (!this.displayObject.getBounds().contains(x, y))
            return false;
        let p = new PIXI.Point(x, y);
        let m = this.displayObject.transform.worldTransform;
        m.applyInverse(p, p);
        let dx = p.x - this.mx;
        let dy = p.y - this.my;
        return dx * dx + dy * dy <= this.r * this.r;
    }
}
//# sourceMappingURL=Circle copy.js.map