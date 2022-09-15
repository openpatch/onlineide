import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { polygonBerührtPolygon } from "../../tools/MatheTools.js";
export class TurtleClass extends Klass {
    constructor(module) {
        super("Turtle", module, "Turtle-Klasse zum Zeichnen von Streckenzügen oder gefüllten Figuren. Wichtig sind vor allem die Methoden forward(double length) und turn(double angleDeg), die die Turtle nach vorne bewegen bzw. ihre Blickrichtung ändern.");
        this.setBaseClass(module.typeStore.getType("FilledShape"));
        this.addMethod(new Method("Turtle", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let x = parameters[1].value;
            let y = parameters[2].value;
            let ph = new TurtleHelper(x, y, false, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = ph;
        }, false, false, 'Instanziert ein neues Turtle-Objekt ohne Punkte. Die Turtle blickt anfangs nach rechts. Am Ende des Streckenzugs wird eine "Schildkröte" (kleines Dreieck) gezeichnet.', true));
        this.addMethod(new Method("Turtle", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "showTurtle", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let x = parameters[1].value;
            let y = parameters[2].value;
            let showTurtle = parameters[3].value;
            let ph = new TurtleHelper(x, y, showTurtle, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = ph;
        }, false, false, 'Instanziert ein neues Turtle-Objekt ohne Punkte. Die Turtle blickt anfangs nach rechts. Falls showTurtle == true, wird am Ende des Streckenzuges eine "Schildkröte" (kleines Dreieck) gezeichnet.', true));
        this.addMethod(new Method("forward", new Parameterlist([
            { identifier: "length", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let length = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("forward"))
                return;
            sh.forward(length);
        }, false, false, 'Weist die Turtle an, die angegebene Länge vorwärts zu gehen. Ihr zurückgelegter Weg wird als gerade Strecke mit der aktuellen BorderColor gezeichnet. Mit setBorderColor(null) bewirkst Du, dass ein Stück ihres Weges nicht gezeichnet wird.', false));
        this.addMethod(new Method("turn", new Parameterlist([
            { identifier: "angleInDeg", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let angle = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("turn"))
                return;
            sh.turn(angle);
        }, false, false, 'Bewirkt, dass sich die Turtle um den angegebenen Winkel (in Grad!) dreht, d.h. ihre Blickrichtung ändert. Ein positiver Winkel bewirkt eine Drehung gegen den Uhrzeigersinn. Diese Methode wirkt sich NICHT auf die bisher gezeichneten Strecken aus. Willst Du alles bisher Gezeichnete inklusive Turtle drehen, so nutze die Methode rotate.', false));
        this.addMethod(new Method("penUp", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("penUp"))
                return;
            sh.penIsDown = false;
        }, false, false, 'Bewirkt, dass die Turtle beim Gehen ab jetzt nicht mehr zeichnet.', false));
        this.addMethod(new Method("penDown", new Parameterlist([]), null, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("penDown"))
                return;
            sh.penIsDown = true;
        }, false, false, 'Bewirkt, dass die Turtle beim Gehen ab jetzt wieder zeichnet.', false));
        this.addMethod(new Method("closeAndFill", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let closeAndFill = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("closeAndFill"))
                return;
            sh.closeAndFill(closeAndFill);
        }, false, false, 'closeAndFill == true bewirkt, dass das von der Turtlezeichnung umschlossene Gebiet gefüllt wird.', false));
        this.addMethod(new Method("showTurtle", new Parameterlist([
            { identifier: "showTurtle", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let showTurtle = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("showTurtle"))
                return;
            sh.setShowTurtle(showTurtle);
        }, false, false, 'showTurtle == true bewirkt, dass am Ort der Turtle ein rotes Dreieck gezeichnet wird.', false));
        this.addMethod(new Method("copy", new Parameterlist([]), this, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("copy"))
                return;
            return sh.getCopy(o.class);
        }, false, false, 'Erstellt eine Kopie des Turtle-Objekts und gibt es zurück.', false));
    }
}
export class TurtleHelper extends FilledShapeHelper {
    constructor(xStart, yStart, showTurtle, interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.showTurtle = showTurtle;
        this.lineElements = [];
        this.angle = 0;
        this.isFilled = false;
        this.xSum = 0;
        this.ySum = 0;
        this.initialHitPolygonDirty = true;
        this.turtleSize = 40;
        this.penIsDown = true;
        this.lineElements.push({
            x: xStart,
            y: yStart,
            color: 0,
            alpha: 1,
            lineWidth: 1
        });
        this.calculateCenter();
        this.borderColor = 0xffffff;
        this.hitPolygonInitial = [];
        let container = new PIXI.Container();
        this.displayObject = container;
        this.lineGraphic = new PIXI.Graphics();
        container.addChild(this.lineGraphic);
        this.turtle = new PIXI.Graphics();
        container.addChild(this.turtle);
        this.turtle.visible = this.showTurtle;
        this.drawTurtle(xStart, yStart, this.angle);
        // let g: PIXI.Graphics = <any>this.displayObject;
        this.worldHelper.stage.addChild(this.displayObject);
        this.addToDefaultGroup();
    }
    calculateCenter() {
        let length = this.lineElements.length;
        let lastLineElement = this.lineElements[length - 1];
        this.xSum += lastLineElement.x;
        this.ySum += lastLineElement.y;
        this.centerXInitial = this.xSum / length;
        this.centerYInitial = this.ySum / length;
    }
    closeAndFill(closeAndFill) {
        if (closeAndFill != this.isFilled) {
            this.isFilled = closeAndFill;
            this.render();
            this.initialHitPolygonDirty = true;
        }
    }
    setShowTurtle(show) {
        this.turtle.visible = show;
    }
    turn(angle) {
        this.angle -= angle / 180 * Math.PI;
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        this.drawTurtle(lastLineElement.x, lastLineElement.y, this.angle);
    }
    rotate(angleInDegrees, cx, cy) {
        this.turn(this.angle);
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        this.drawTurtle(lastLineElement.x, lastLineElement.y, this.angle);
        super.rotate(angleInDegrees, cx, cy);
    }
    getCopy(klass) {
        let ro = new RuntimeObject(klass);
        let rh = new TurtleHelper(this.lineElements[0].x, this.lineElements[0].y, this.showTurtle, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;
        rh.copyFrom(this);
        rh.render();
        return ro;
    }
    forward(length) {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let newLineElement = {
            x: lastLineElement.x + length * Math.cos(this.angle),
            y: lastLineElement.y + length * Math.sin(this.angle),
            color: this.penIsDown ? this.borderColor : null,
            alpha: this.borderAlpha,
            lineWidth: this.borderWidth
        };
        this.lineElements.push(newLineElement);
        if (this.isFilled) {
            this.render();
        }
        else {
            if (this.borderColor != null) {
                this.lineGraphic.moveTo(lastLineElement.x, lastLineElement.y);
                this.lineGraphic.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
                this.lineGraphic.lineTo(newLineElement.x, newLineElement.y);
            }
        }
        this.hitPolygonDirty = true;
        this.initialHitPolygonDirty = true;
        this.calculateCenter();
        this.drawTurtle(newLineElement.x, newLineElement.y, this.angle);
    }
    moveTo(x, y) {
        let newLineElement = {
            x: x,
            y: y,
            color: null,
            alpha: this.borderAlpha,
            lineWidth: this.borderWidth
        };
        this.lineElements.push(newLineElement);
        this.hitPolygonDirty = true;
        this.initialHitPolygonDirty = true;
        this.calculateCenter();
        this.drawTurtle(newLineElement.x, newLineElement.y, this.angle);
    }
    drawTurtle(x, y, angle) {
        this.turtle.clear();
        this.turtle.lineStyle(3, 0xff0000, 1, 0.5);
        this.turtle.moveTo(x, y);
        let vx = Math.cos(angle);
        let vy = Math.sin(angle);
        let vxp = -Math.sin(angle);
        let vyp = Math.cos(angle);
        let lengthForward = this.turtleSize / 2;
        let lengthBackward = this.turtleSize / 4;
        let lengthBackwardP = this.turtleSize / 4;
        this.turtle.moveTo(x + vx * lengthForward, y + vy * lengthForward);
        this.turtle.lineTo(x - vx * lengthBackward + vxp * lengthBackwardP, y - vy * lengthBackward + vyp * lengthBackwardP);
        this.turtle.lineTo(x - vx * lengthBackward - vxp * lengthBackwardP, y - vy * lengthBackward - vyp * lengthBackwardP);
        this.turtle.lineTo(x + vx * lengthForward, y + vy * lengthForward);
    }
    render() {
        let g = this.lineGraphic;
        if (this.displayObject == null) {
            g = new PIXI.Graphics();
            this.displayObject = g;
            this.worldHelper.stage.addChild(g);
        }
        else {
            g.clear();
        }
        if (this.fillColor != null && this.isFilled) {
            g.beginFill(this.fillColor, this.fillAlpha);
        }
        let firstPoint = this.lineElements[0];
        g.moveTo(firstPoint.x, firstPoint.y);
        if (this.isFilled) {
            g.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
        }
        for (let i = 1; i < this.lineElements.length; i++) {
            let le = this.lineElements[i];
            if (le.color != null) {
                if (!this.isFilled) {
                    g.lineStyle(le.lineWidth, le.color, le.alpha, 0.5);
                }
                g.lineTo(le.x, le.y);
            }
            else {
                g.moveTo(le.x, le.y);
            }
        }
        if (this.isFilled) {
            g.closePath();
        }
        if (this.fillColor != null && this.isFilled) {
            g.endFill();
        }
    }
    ;
    collidesWith(shapeHelper) {
        if (shapeHelper instanceof TurtleHelper && shapeHelper.initialHitPolygonDirty) {
            shapeHelper.setupInitialHitPolygon();
        }
        if (this.initialHitPolygonDirty) {
            this.setupInitialHitPolygon();
        }
        let bb = this.displayObject.getBounds();
        let bb1 = shapeHelper.displayObject.getBounds();
        if (bb.left > bb1.right || bb1.left > bb.right)
            return false;
        if (bb.top > bb1.bottom || bb1.top > bb.bottom)
            return false;
        if (shapeHelper["shapes"]) {
            return shapeHelper.collidesWith(this);
        }
        if (this.hitPolygonInitial == null || shapeHelper.hitPolygonInitial == null)
            return true;
        // boundig boxes collide, so check further:
        if (this.hitPolygonDirty)
            this.transformHitPolygon();
        if (shapeHelper.hitPolygonDirty)
            shapeHelper.transformHitPolygon();
        return polygonBerührtPolygon(this.hitPolygonTransformed, shapeHelper.hitPolygonTransformed);
    }
    setupInitialHitPolygon() {
        this.hitPolygonInitial = this.lineElements.map((le) => { return { x: le.x, y: le.y }; });
    }
    clear() {
        this.lineElements = [];
        this.lineElements.push({
            x: 100,
            y: 200,
            color: 0,
            alpha: 1,
            lineWidth: 1
        });
        this.calculateCenter();
        this.hitPolygonInitial = [];
        this.angle = 0;
        this.borderColor = 0;
        this.turtleSize = 40;
        this.render();
        this.drawTurtle(100, 200, 0);
    }
    touchesAtLeastOneFigure() {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        for (let sh of this.worldHelper.shapes) {
            if (sh.containsPoint(x, y) && sh != this) {
                return true;
            }
        }
    }
    touchesColor(farbe) {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        for (let sh of this.worldHelper.shapes) {
            if (sh.containsPoint(x, y) && sh != this) {
                if (sh instanceof FilledShapeHelper && sh.fillColor == farbe)
                    return true;
                // if(sh instanceof TurtleHelper) TODO
            }
        }
    }
    touchesShape(shape) {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        return shape.containsPoint(x, y);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHVydGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9UdXJ0bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3RELE9BQU8sRUFBRSxtQkFBbUIsRUFBb0Isb0JBQW9CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUNySCxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLCtCQUErQixDQUFDO0FBQzdFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNuRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUVyRCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUdsRSxNQUFNLE9BQU8sV0FBWSxTQUFRLEtBQUs7SUFFbEMsWUFBWSxNQUFjO1FBRXRCLEtBQUssQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLDhOQUE4TixDQUFDLENBQUM7UUFFeFAsSUFBSSxDQUFDLFlBQVksQ0FBUSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBRWxFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ2xELEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7WUFDdEcsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtT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QUNKO0lBQ0wsQ0FBQztJQUVELFlBQVksQ0FBQyxLQUFhO1FBQ3RCLElBQUksZUFBZSxHQUFnQixJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ25GLElBQUksQ0FBQyxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUUxQixLQUFJLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFDO1lBQ2xDLElBQUcsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLElBQUksRUFBQztnQkFDcEMsSUFBRyxFQUFFLFlBQVksaUJBQWlCLElBQUksRUFBRSxDQUFDLFNBQVMsSUFBSSxLQUFLO29CQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUN6RSxzQ0FBc0M7YUFDekM7U0FDSjtJQUNMLENBQUM7SUFFRCxZQUFZLENBQUMsS0FBa0I7UUFDM0IsSUFBSSxlQUFlLEdBQWdCLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDbkYsSUFBSSxDQUFDLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQztRQUMxQixJQUFJLENBQUMsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUlKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgZG91YmxlUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgYm9vbGVhblByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuaW1wb3J0IHsgRmlsbGVkU2hhcGVIZWxwZXIgfSBmcm9tIFwiLi9GaWxsZWRTaGFwZS5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBwb2x5Z29uQmVyw7xocnRQb2x5Z29uIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL01hdGhlVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgU2hhcGVIZWxwZXIgfSBmcm9tIFwiLi9TaGFwZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFR1cnRsZUNsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiVHVydGxlXCIsIG1vZHVsZSwgXCJUdXJ0bGUtS2xhc3NlIHp1bSBaZWljaG5lbiB2b24gU3RyZWNrZW56w7xnZW4gb2RlciBnZWbDvGxsdGVuIEZpZ3VyZW4uIFdpY2h0aWcgc2luZCB2b3IgYWxsZW0gZGllIE1ldGhvZGVuIGZvcndhcmQoZG91YmxlIGxlbmd0aCkgdW5kIHR1cm4oZG91YmxlIGFuZ2xlRGVnKSwgZGllIGRpZSBUdXJ0bGUgbmFjaCB2b3JuZSBiZXdlZ2VuIGJ6dy4gaWhyZSBCbGlja3JpY2h0dW5nIMOkbmRlcm4uXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiRmlsbGVkU2hhcGVcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiVHVydGxlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBoID0gbmV3IFR1cnRsZUhlbHBlcih4LCB5LCBmYWxzZSwgbW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbyk7XHJcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHBoO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnSW5zdGFuemllcnQgZWluIG5ldWVzIFR1cnRsZS1PYmpla3Qgb2huZSBQdW5rdGUuIERpZSBUdXJ0bGUgYmxpY2t0IGFuZmFuZ3MgbmFjaCByZWNodHMuIEFtIEVuZGUgZGVzIFN0cmVja2VuenVncyB3aXJkIGVpbmUgXCJTY2hpbGRrcsO2dGVcIiAoa2xlaW5lcyBEcmVpZWNrKSBnZXplaWNobmV0LicsIHRydWUpKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJUdXJ0bGVcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInlcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJzaG93VHVydGxlXCIsIHR5cGU6IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgeDogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB5OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNob3dUdXJ0bGU6IGJvb2xlYW4gPSBwYXJhbWV0ZXJzWzNdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwaCA9IG5ldyBUdXJ0bGVIZWxwZXIoeCwgeSwgc2hvd1R1cnRsZSwgbW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbyk7XHJcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHBoO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnSW5zdGFuemllcnQgZWluIG5ldWVzIFR1cnRsZS1PYmpla3Qgb2huZSBQdW5rdGUuIERpZSBUdXJ0bGUgYmxpY2t0IGFuZmFuZ3MgbmFjaCByZWNodHMuIEZhbGxzIHNob3dUdXJ0bGUgPT0gdHJ1ZSwgd2lyZCBhbSBFbmRlIGRlcyBTdHJlY2tlbnp1Z2VzIGVpbmUgXCJTY2hpbGRrcsO2dGVcIiAoa2xlaW5lcyBEcmVpZWNrKSBnZXplaWNobmV0LicsIHRydWUpKTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJmb3J3YXJkXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImxlbmd0aFwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgbGVuZ3RoOiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUdXJ0bGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImZvcndhcmRcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBzaC5mb3J3YXJkKGxlbmd0aCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdXZWlzdCBkaWUgVHVydGxlIGFuLCBkaWUgYW5nZWdlYmVuZSBMw6RuZ2Ugdm9yd8OkcnRzIHp1IGdlaGVuLiBJaHIgenVyw7xja2dlbGVndGVyIFdlZyB3aXJkIGFscyBnZXJhZGUgU3RyZWNrZSBtaXQgZGVyIGFrdHVlbGxlbiBCb3JkZXJDb2xvciBnZXplaWNobmV0LiBNaXQgc2V0Qm9yZGVyQ29sb3IobnVsbCkgYmV3aXJrc3QgRHUsIGRhc3MgZWluIFN0w7xjayBpaHJlcyBXZWdlcyBuaWNodCBnZXplaWNobmV0IHdpcmQuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInR1cm5cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiYW5nbGVJbkRlZ1wiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgYW5nbGU6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IFR1cnRsZUhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwidHVyblwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLnR1cm4oYW5nbGUpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnQmV3aXJrdCwgZGFzcyBzaWNoIGRpZSBUdXJ0bGUgdW0gZGVuIGFuZ2VnZWJlbmVuIFdpbmtlbCAoaW4gR3JhZCEpIGRyZWh0LCBkLmguIGlocmUgQmxpY2tyaWNodHVuZyDDpG5kZXJ0LiBFaW4gcG9zaXRpdmVyIFdpbmtlbCBiZXdpcmt0IGVpbmUgRHJlaHVuZyBnZWdlbiBkZW4gVWhyemVpZ2Vyc2lubi4gRGllc2UgTWV0aG9kZSB3aXJrdCBzaWNoIE5JQ0hUIGF1ZiBkaWUgYmlzaGVyIGdlemVpY2huZXRlbiBTdHJlY2tlbiBhdXMuIFdpbGxzdCBEdSBhbGxlcyBiaXNoZXIgR2V6ZWljaG5ldGUgaW5rbHVzaXZlIFR1cnRsZSBkcmVoZW4sIHNvIG51dHplIGRpZSBNZXRob2RlIHJvdGF0ZS4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicGVuVXBcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogVHVydGxlSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJwZW5VcFwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLnBlbklzRG93biA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnQmV3aXJrdCwgZGFzcyBkaWUgVHVydGxlIGJlaW0gR2VoZW4gYWIgamV0enQgbmljaHQgbWVociB6ZWljaG5ldC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwicGVuRG93blwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUdXJ0bGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcInBlbkRvd25cIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBzaC5wZW5Jc0Rvd24gPSB0cnVlO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnQmV3aXJrdCwgZGFzcyBkaWUgVHVydGxlIGJlaW0gR2VoZW4gYWIgamV0enQgd2llZGVyIHplaWNobmV0LicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJjbG9zZUFuZEZpbGxcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY2xvc2VBbmRGaWxsXCIsIHR5cGU6IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2xvc2VBbmRGaWxsOiBib29sZWFuID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogVHVydGxlSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJjbG9zZUFuZEZpbGxcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBzaC5jbG9zZUFuZEZpbGwoY2xvc2VBbmRGaWxsKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ2Nsb3NlQW5kRmlsbCA9PSB0cnVlIGJld2lya3QsIGRhc3MgZGFzIHZvbiBkZXIgVHVydGxlemVpY2hudW5nIHVtc2NobG9zc2VuZSBHZWJpZXQgZ2Vmw7xsbHQgd2lyZC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2hvd1R1cnRsZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJzaG93VHVydGxlXCIsIHR5cGU6IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hvd1R1cnRsZTogYm9vbGVhbiA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IFR1cnRsZUhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwic2hvd1R1cnRsZVwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLnNldFNob3dUdXJ0bGUoc2hvd1R1cnRsZSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdzaG93VHVydGxlID09IHRydWUgYmV3aXJrdCwgZGFzcyBhbSBPcnQgZGVyIFR1cnRsZSBlaW4gcm90ZXMgRHJlaWVjayBnZXplaWNobmV0IHdpcmQuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImNvcHlcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgIF0pLCB0aGlzLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogVHVydGxlSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJjb3B5XCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldENvcHkoPEtsYXNzPm8uY2xhc3MpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnRXJzdGVsbHQgZWluZSBLb3BpZSBkZXMgVHVydGxlLU9iamVrdHMgdW5kIGdpYnQgZXMgenVyw7xjay4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG50eXBlIExpbmVFbGVtZW50ID0ge1xyXG4gICAgeDogbnVtYmVyLFxyXG4gICAgeTogbnVtYmVyLFxyXG4gICAgY29sb3I6IG51bWJlcixcclxuICAgIGFscGhhOiBudW1iZXIsXHJcbiAgICBsaW5lV2lkdGg6IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVHVydGxlSGVscGVyIGV4dGVuZHMgRmlsbGVkU2hhcGVIZWxwZXIge1xyXG5cclxuICAgIGxpbmVFbGVtZW50czogTGluZUVsZW1lbnRbXSA9IFtdO1xyXG4gICAgYW5nbGU6IG51bWJlciA9IDA7XHJcblxyXG4gICAgaXNGaWxsZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICB0dXJ0bGU6IFBJWEkuR3JhcGhpY3M7XHJcbiAgICBsaW5lR3JhcGhpYzogUElYSS5HcmFwaGljcztcclxuXHJcbiAgICB4U3VtOiBudW1iZXIgPSAwO1xyXG4gICAgeVN1bTogbnVtYmVyID0gMDtcclxuXHJcbiAgICBpbml0aWFsSGl0UG9seWdvbkRpcnR5OiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICB0dXJ0bGVTaXplOiBudW1iZXIgPSA0MDtcclxuXHJcbiAgICBwZW5Jc0Rvd246IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHhTdGFydDogbnVtYmVyLCB5U3RhcnQ6IG51bWJlciwgcHJpdmF0ZSBzaG93VHVydGxlOiBib29sZWFuLFxyXG4gICAgICAgIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5saW5lRWxlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgIHg6IHhTdGFydCxcclxuICAgICAgICAgICAgeTogeVN0YXJ0LFxyXG4gICAgICAgICAgICBjb2xvcjogMCxcclxuICAgICAgICAgICAgYWxwaGE6IDEsXHJcbiAgICAgICAgICAgIGxpbmVXaWR0aDogMVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ2VudGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSAweGZmZmZmZjtcclxuXHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgY29udGFpbmVyID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5T2JqZWN0ID0gY29udGFpbmVyO1xyXG5cclxuICAgICAgICB0aGlzLmxpbmVHcmFwaGljID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcclxuICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQodGhpcy5saW5lR3JhcGhpYyk7XHJcblxyXG4gICAgICAgIHRoaXMudHVydGxlID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcclxuICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQodGhpcy50dXJ0bGUpO1xyXG4gICAgICAgIHRoaXMudHVydGxlLnZpc2libGUgPSB0aGlzLnNob3dUdXJ0bGU7XHJcbiAgICAgICAgdGhpcy5kcmF3VHVydGxlKHhTdGFydCwgeVN0YXJ0LCB0aGlzLmFuZ2xlKTtcclxuXHJcblxyXG4gICAgICAgIC8vIGxldCBnOiBQSVhJLkdyYXBoaWNzID0gPGFueT50aGlzLmRpc3BsYXlPYmplY3Q7XHJcblxyXG4gICAgICAgIHRoaXMud29ybGRIZWxwZXIuc3RhZ2UuYWRkQ2hpbGQodGhpcy5kaXNwbGF5T2JqZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRUb0RlZmF1bHRHcm91cCgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjYWxjdWxhdGVDZW50ZXIoKSB7XHJcbiAgICAgICAgbGV0IGxlbmd0aCA9IHRoaXMubGluZUVsZW1lbnRzLmxlbmd0aDtcclxuICAgICAgICBsZXQgbGFzdExpbmVFbGVtZW50ID0gdGhpcy5saW5lRWxlbWVudHNbbGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy54U3VtICs9IGxhc3RMaW5lRWxlbWVudC54O1xyXG4gICAgICAgIHRoaXMueVN1bSArPSBsYXN0TGluZUVsZW1lbnQueTtcclxuICAgICAgICB0aGlzLmNlbnRlclhJbml0aWFsID0gdGhpcy54U3VtIC8gbGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuY2VudGVyWUluaXRpYWwgPSB0aGlzLnlTdW0gLyBsZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY2xvc2VBbmRGaWxsKGNsb3NlQW5kRmlsbDogYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChjbG9zZUFuZEZpbGwgIT0gdGhpcy5pc0ZpbGxlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmlzRmlsbGVkID0gY2xvc2VBbmRGaWxsO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxIaXRQb2x5Z29uRGlydHkgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRTaG93VHVydGxlKHNob3c6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLnR1cnRsZS52aXNpYmxlID0gc2hvdztcclxuICAgIH1cclxuXHJcbiAgICB0dXJuKGFuZ2xlOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLmFuZ2xlIC09IGFuZ2xlIC8gMTgwICogTWF0aC5QSTtcclxuICAgICAgICBsZXQgbGFzdExpbmVFbGVtZW50OiBMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzW3RoaXMubGluZUVsZW1lbnRzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIHRoaXMuZHJhd1R1cnRsZShsYXN0TGluZUVsZW1lbnQueCwgbGFzdExpbmVFbGVtZW50LnksIHRoaXMuYW5nbGUpO1xyXG4gICAgfVxyXG5cclxuICAgIHJvdGF0ZShhbmdsZUluRGVncmVlczogbnVtYmVyLCBjeD86IG51bWJlciwgY3k/OiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnR1cm4odGhpcy5hbmdsZSk7XHJcbiAgICAgICAgbGV0IGxhc3RMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzW3RoaXMubGluZUVsZW1lbnRzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIHRoaXMuZHJhd1R1cnRsZShsYXN0TGluZUVsZW1lbnQueCwgbGFzdExpbmVFbGVtZW50LnksIHRoaXMuYW5nbGUpO1xyXG4gICAgICAgIHN1cGVyLnJvdGF0ZShhbmdsZUluRGVncmVlcywgY3gsIGN5KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb3B5KGtsYXNzOiBLbGFzcyk6IFJ1bnRpbWVPYmplY3Qge1xyXG5cclxuICAgICAgICBsZXQgcm86IFJ1bnRpbWVPYmplY3QgPSBuZXcgUnVudGltZU9iamVjdChrbGFzcyk7XHJcbiAgICAgICAgbGV0IHJoOiBUdXJ0bGVIZWxwZXIgPSBuZXcgVHVydGxlSGVscGVyKHRoaXMubGluZUVsZW1lbnRzWzBdLngsIHRoaXMubGluZUVsZW1lbnRzWzBdLnksXHJcbiAgICAgICAgICAgIHRoaXMuc2hvd1R1cnRsZSwgdGhpcy53b3JsZEhlbHBlci5pbnRlcnByZXRlciwgcm8pO1xyXG4gICAgICAgIHJvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHJoO1xyXG5cclxuICAgICAgICByaC5jb3B5RnJvbSh0aGlzKTtcclxuICAgICAgICByaC5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvO1xyXG4gICAgfVxyXG5cclxuICAgIGZvcndhcmQobGVuZ3RoOiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgbGV0IGxhc3RMaW5lRWxlbWVudDogTGluZUVsZW1lbnQgPSB0aGlzLmxpbmVFbGVtZW50c1t0aGlzLmxpbmVFbGVtZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICBsZXQgbmV3TGluZUVsZW1lbnQ6IExpbmVFbGVtZW50ID0ge1xyXG4gICAgICAgICAgICB4OiBsYXN0TGluZUVsZW1lbnQueCArIGxlbmd0aCAqIE1hdGguY29zKHRoaXMuYW5nbGUpLFxyXG4gICAgICAgICAgICB5OiBsYXN0TGluZUVsZW1lbnQueSArIGxlbmd0aCAqIE1hdGguc2luKHRoaXMuYW5nbGUpLFxyXG4gICAgICAgICAgICBjb2xvcjogdGhpcy5wZW5Jc0Rvd24gPyB0aGlzLmJvcmRlckNvbG9yIDogbnVsbCxcclxuICAgICAgICAgICAgYWxwaGE6IHRoaXMuYm9yZGVyQWxwaGEsXHJcbiAgICAgICAgICAgIGxpbmVXaWR0aDogdGhpcy5ib3JkZXJXaWR0aFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5saW5lRWxlbWVudHMucHVzaChuZXdMaW5lRWxlbWVudCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuYm9yZGVyQ29sb3IgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5saW5lR3JhcGhpYy5tb3ZlVG8obGFzdExpbmVFbGVtZW50LngsIGxhc3RMaW5lRWxlbWVudC55KTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGluZUdyYXBoaWMubGluZVN0eWxlKHRoaXMuYm9yZGVyV2lkdGgsIHRoaXMuYm9yZGVyQ29sb3IsIHRoaXMuYm9yZGVyQWxwaGEsIDAuNSlcclxuICAgICAgICAgICAgICAgIHRoaXMubGluZUdyYXBoaWMubGluZVRvKG5ld0xpbmVFbGVtZW50LngsIG5ld0xpbmVFbGVtZW50LnkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmhpdFBvbHlnb25EaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsSGl0UG9seWdvbkRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZUNlbnRlcigpO1xyXG4gICAgICAgIHRoaXMuZHJhd1R1cnRsZShuZXdMaW5lRWxlbWVudC54LCBuZXdMaW5lRWxlbWVudC55LCB0aGlzLmFuZ2xlKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVRvKHg6IG51bWJlciwgeTogbnVtYmVyKSB7XHJcbiAgICAgICAgbGV0IG5ld0xpbmVFbGVtZW50OiBMaW5lRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgeTogeSxcclxuICAgICAgICAgICAgY29sb3I6IG51bGwsXHJcbiAgICAgICAgICAgIGFscGhhOiB0aGlzLmJvcmRlckFscGhhLFxyXG4gICAgICAgICAgICBsaW5lV2lkdGg6IHRoaXMuYm9yZGVyV2lkdGhcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGluZUVsZW1lbnRzLnB1c2gobmV3TGluZUVsZW1lbnQpO1xyXG5cclxuICAgICAgICB0aGlzLmhpdFBvbHlnb25EaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5pbml0aWFsSGl0UG9seWdvbkRpcnR5ID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZUNlbnRlcigpO1xyXG4gICAgICAgIHRoaXMuZHJhd1R1cnRsZShuZXdMaW5lRWxlbWVudC54LCBuZXdMaW5lRWxlbWVudC55LCB0aGlzLmFuZ2xlKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZHJhd1R1cnRsZSh4OiBudW1iZXIsIHk6IG51bWJlciwgYW5nbGU6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudHVydGxlLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy50dXJ0bGUubGluZVN0eWxlKDMsIDB4ZmYwMDAwLCAxLCAwLjUpO1xyXG4gICAgICAgIHRoaXMudHVydGxlLm1vdmVUbyh4LCB5KTtcclxuXHJcbiAgICAgICAgbGV0IHZ4ID0gTWF0aC5jb3MoYW5nbGUpO1xyXG4gICAgICAgIGxldCB2eSA9IE1hdGguc2luKGFuZ2xlKTtcclxuXHJcbiAgICAgICAgbGV0IHZ4cCA9IC1NYXRoLnNpbihhbmdsZSk7XHJcbiAgICAgICAgbGV0IHZ5cCA9IE1hdGguY29zKGFuZ2xlKTtcclxuXHJcbiAgICAgICAgbGV0IGxlbmd0aEZvcndhcmQgPSB0aGlzLnR1cnRsZVNpemUgLyAyO1xyXG4gICAgICAgIGxldCBsZW5ndGhCYWNrd2FyZCA9IHRoaXMudHVydGxlU2l6ZSAvIDQ7XHJcbiAgICAgICAgbGV0IGxlbmd0aEJhY2t3YXJkUCA9IHRoaXMudHVydGxlU2l6ZSAvIDQ7XHJcblxyXG4gICAgICAgIHRoaXMudHVydGxlLm1vdmVUbyh4ICsgdnggKiBsZW5ndGhGb3J3YXJkLCB5ICsgdnkgKiBsZW5ndGhGb3J3YXJkKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5saW5lVG8oeCAtIHZ4ICogbGVuZ3RoQmFja3dhcmQgKyB2eHAgKiBsZW5ndGhCYWNrd2FyZFAsIHkgLSB2eSAqIGxlbmd0aEJhY2t3YXJkICsgdnlwICogbGVuZ3RoQmFja3dhcmRQKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5saW5lVG8oeCAtIHZ4ICogbGVuZ3RoQmFja3dhcmQgLSB2eHAgKiBsZW5ndGhCYWNrd2FyZFAsIHkgLSB2eSAqIGxlbmd0aEJhY2t3YXJkIC0gdnlwICogbGVuZ3RoQmFja3dhcmRQKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5saW5lVG8oeCArIHZ4ICogbGVuZ3RoRm9yd2FyZCwgeSArIHZ5ICogbGVuZ3RoRm9yd2FyZCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyKCk6IHZvaWQge1xyXG5cclxuICAgICAgICBsZXQgZzogUElYSS5HcmFwaGljcyA9IHRoaXMubGluZUdyYXBoaWM7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmRpc3BsYXlPYmplY3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBnID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5T2JqZWN0ID0gZztcclxuICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5zdGFnZS5hZGRDaGlsZChnKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZy5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZmlsbENvbG9yICE9IG51bGwgJiYgdGhpcy5pc0ZpbGxlZCkge1xyXG4gICAgICAgICAgICBnLmJlZ2luRmlsbCh0aGlzLmZpbGxDb2xvciwgdGhpcy5maWxsQWxwaGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZpcnN0UG9pbnQgPSB0aGlzLmxpbmVFbGVtZW50c1swXTtcclxuICAgICAgICBnLm1vdmVUbyhmaXJzdFBvaW50LngsIGZpcnN0UG9pbnQueSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIGcubGluZVN0eWxlKHRoaXMuYm9yZGVyV2lkdGgsIHRoaXMuYm9yZGVyQ29sb3IsIHRoaXMuYm9yZGVyQWxwaGEsIDAuNSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGxlOiBMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAobGUuY29sb3IgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZy5saW5lU3R5bGUobGUubGluZVdpZHRoLCBsZS5jb2xvciwgbGUuYWxwaGEsIDAuNSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGcubGluZVRvKGxlLngsIGxlLnkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZy5tb3ZlVG8obGUueCwgbGUueSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIGcuY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5maWxsQ29sb3IgIT0gbnVsbCAmJiB0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIGcuZW5kRmlsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgY29sbGlkZXNXaXRoKHNoYXBlSGVscGVyOiBhbnkpIHtcclxuXHJcbiAgICAgICAgaWYgKHNoYXBlSGVscGVyIGluc3RhbmNlb2YgVHVydGxlSGVscGVyICYmIHNoYXBlSGVscGVyLmluaXRpYWxIaXRQb2x5Z29uRGlydHkpIHtcclxuICAgICAgICAgICAgc2hhcGVIZWxwZXIuc2V0dXBJbml0aWFsSGl0UG9seWdvbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbEhpdFBvbHlnb25EaXJ0eSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldHVwSW5pdGlhbEhpdFBvbHlnb24oKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBiYiA9IHRoaXMuZGlzcGxheU9iamVjdC5nZXRCb3VuZHMoKTtcclxuICAgICAgICBsZXQgYmIxID0gc2hhcGVIZWxwZXIuZGlzcGxheU9iamVjdC5nZXRCb3VuZHMoKTtcclxuXHJcbiAgICAgICAgaWYgKGJiLmxlZnQgPiBiYjEucmlnaHQgfHwgYmIxLmxlZnQgPiBiYi5yaWdodCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoYmIudG9wID4gYmIxLmJvdHRvbSB8fCBiYjEudG9wID4gYmIuYm90dG9tKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGlmIChzaGFwZUhlbHBlcltcInNoYXBlc1wiXSkge1xyXG4gICAgICAgICAgICByZXR1cm4gc2hhcGVIZWxwZXIuY29sbGlkZXNXaXRoKHRoaXMpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaGl0UG9seWdvbkluaXRpYWwgPT0gbnVsbCB8fCBzaGFwZUhlbHBlci5oaXRQb2x5Z29uSW5pdGlhbCA9PSBudWxsKSByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICAgICAgLy8gYm91bmRpZyBib3hlcyBjb2xsaWRlLCBzbyBjaGVjayBmdXJ0aGVyOlxyXG4gICAgICAgIGlmICh0aGlzLmhpdFBvbHlnb25EaXJ0eSkgdGhpcy50cmFuc2Zvcm1IaXRQb2x5Z29uKCk7XHJcbiAgICAgICAgaWYgKHNoYXBlSGVscGVyLmhpdFBvbHlnb25EaXJ0eSkgc2hhcGVIZWxwZXIudHJhbnNmb3JtSGl0UG9seWdvbigpO1xyXG5cclxuICAgICAgICByZXR1cm4gcG9seWdvbkJlcsO8aHJ0UG9seWdvbih0aGlzLmhpdFBvbHlnb25UcmFuc2Zvcm1lZCwgc2hhcGVIZWxwZXIuaGl0UG9seWdvblRyYW5zZm9ybWVkKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0dXBJbml0aWFsSGl0UG9seWdvbigpIHtcclxuICAgICAgICB0aGlzLmhpdFBvbHlnb25Jbml0aWFsID0gdGhpcy5saW5lRWxlbWVudHMubWFwKChsZSkgPT4geyByZXR1cm4geyB4OiBsZS54LCB5OiBsZS55IH0gfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy5saW5lRWxlbWVudHMgPSBbXTtcclxuICAgICAgICB0aGlzLmxpbmVFbGVtZW50cy5wdXNoKHtcclxuICAgICAgICAgICAgeDogMTAwLFxyXG4gICAgICAgICAgICB5OiAyMDAsXHJcbiAgICAgICAgICAgIGNvbG9yOiAwLFxyXG4gICAgICAgICAgICBhbHBoYTogMSxcclxuICAgICAgICAgICAgbGluZVdpZHRoOiAxXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVDZW50ZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmFuZ2xlID0gMDtcclxuICAgICAgICB0aGlzLmJvcmRlckNvbG9yID0gMDtcclxuICAgICAgICB0aGlzLnR1cnRsZVNpemUgPSA0MDtcclxuICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgIHRoaXMuZHJhd1R1cnRsZSgxMDAsIDIwMCwgMCk7XHJcbiAgICB9XHJcblxyXG4gICAgXHJcbiAgICB0b3VjaGVzQXRMZWFzdE9uZUZpZ3VyZSgpOiBib29sZWFuIHtcclxuICAgICAgICBsZXQgbGFzdExpbmVFbGVtZW50OiBMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzW3RoaXMubGluZUVsZW1lbnRzLmxlbmd0aCAtIDFdO1xyXG4gICAgICAgIGxldCB4ID0gbGFzdExpbmVFbGVtZW50Lng7XHJcbiAgICAgICAgbGV0IHkgPSBsYXN0TGluZUVsZW1lbnQueTtcclxuXHJcbiAgICAgICAgZm9yKGxldCBzaCBvZiB0aGlzLndvcmxkSGVscGVyLnNoYXBlcyl7XHJcbiAgICAgICAgICAgIGlmKHNoLmNvbnRhaW5zUG9pbnQoeCwgeSkgJiYgc2ggIT0gdGhpcyl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0b3VjaGVzQ29sb3IoZmFyYmU6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBsYXN0TGluZUVsZW1lbnQ6IExpbmVFbGVtZW50ID0gdGhpcy5saW5lRWxlbWVudHNbdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgbGV0IHggPSBsYXN0TGluZUVsZW1lbnQueDtcclxuICAgICAgICBsZXQgeSA9IGxhc3RMaW5lRWxlbWVudC55O1xyXG5cclxuICAgICAgICBmb3IobGV0IHNoIG9mIHRoaXMud29ybGRIZWxwZXIuc2hhcGVzKXtcclxuICAgICAgICAgICAgaWYoc2guY29udGFpbnNQb2ludCh4LCB5KSAmJiBzaCAhPSB0aGlzKXtcclxuICAgICAgICAgICAgICAgIGlmKHNoIGluc3RhbmNlb2YgRmlsbGVkU2hhcGVIZWxwZXIgJiYgc2guZmlsbENvbG9yID09IGZhcmJlKSByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIC8vIGlmKHNoIGluc3RhbmNlb2YgVHVydGxlSGVscGVyKSBUT0RPXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdG91Y2hlc1NoYXBlKHNoYXBlOiBTaGFwZUhlbHBlcil7XHJcbiAgICAgICAgbGV0IGxhc3RMaW5lRWxlbWVudDogTGluZUVsZW1lbnQgPSB0aGlzLmxpbmVFbGVtZW50c1t0aGlzLmxpbmVFbGVtZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICBsZXQgeCA9IGxhc3RMaW5lRWxlbWVudC54O1xyXG4gICAgICAgIGxldCB5ID0gbGFzdExpbmVFbGVtZW50Lnk7XHJcbiAgICAgICAgcmV0dXJuIHNoYXBlLmNvbnRhaW5zUG9pbnQoeCwgeSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuIl19