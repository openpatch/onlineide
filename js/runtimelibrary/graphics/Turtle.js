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
            let ph = new TurtleHelper(x, y, true, module.main.getInterpreter(), o);
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
        this.addMethod(new Method("clear", new Parameterlist([]), this, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("clear"))
                return;
            return sh.clear();
        }, false, false, 'Löscht alle bis jetzt mit der Turtle gezeichneten Strecken.', false));
    }
}
export class TurtleHelper extends FilledShapeHelper {
    constructor(xStart, yStart, showTurtle, interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.showTurtle = showTurtle;
        this.lineElements = [];
        this.turtleAngleDeg = 0; // in Rad
        this.isFilled = false;
        this.xSum = 0;
        this.ySum = 0;
        this.initialHitPolygonDirty = true;
        this.turtleSize = 40;
        this.penIsDown = true;
        this.lastLineWidth = 0;
        this.lastColor = 0;
        this.lastAlpha = 0;
        this.lastTurtleAngleDeg = 0; // angle in Rad
        this.renderJobPresent = false;
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
        this.lineGraphic.moveTo(xStart, yStart);
        this.turtle = new PIXI.Graphics();
        container.addChild(this.turtle);
        this.turtle.visible = this.showTurtle;
        this.initTurtle(0, 0, this.turtleAngleDeg);
        this.moveTurtleTo(xStart, yStart, this.turtleAngleDeg);
        // let g: PIXI.Graphics = <any>this.displayObject;
        this.worldHelper.stage.addChild(this.displayObject);
        this.addToDefaultGroupAndSetDefaultVisibility();
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
    turn(angleDeg) {
        this.turtleAngleDeg -= angleDeg;
        if (Math.abs(this.turtleAngleDeg) > 360) {
            this.turtleAngleDeg -= Math.floor(this.turtleAngleDeg / 360) * 360;
        }
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        this.moveTurtleTo(lastLineElement.x, lastLineElement.y, this.turtleAngleDeg);
    }
    rotate(angleInDegrees, cx, cy) {
        // this.turn(angleInDegrees);
        super.rotate(angleInDegrees, cx, cy);
    }
    getCopy(klass) {
        let ro = new RuntimeObject(klass);
        let rh = new TurtleHelper(this.lineElements[0].x, this.lineElements[0].y, this.showTurtle, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;
        rh.turtleAngleDeg = this.turtleAngleDeg;
        rh.copyFrom(this);
        rh.render();
        return ro;
    }
    forward(length) {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let turtleAngleRad = this.turtleAngleDeg / 180.0 * Math.PI;
        let newLineElement = {
            x: lastLineElement.x + length * Math.cos(turtleAngleRad),
            y: lastLineElement.y + length * Math.sin(turtleAngleRad),
            color: this.penIsDown ? this.borderColor : null,
            alpha: this.borderAlpha,
            lineWidth: this.borderWidth
        };
        this.lineElements.push(newLineElement);
        // if (this.isFilled) {
        //     this.render();
        // } else {
        //     if (this.borderColor != null) {
        //         // this.lineGraphic.moveTo(lastLineElement.x, lastLineElement.y);
        //         this.lineGraphic.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
        //         this.lineGraphic.lineTo(newLineElement.x, newLineElement.y);
        //         console.log("LineTo: " + newLineElement.x + ", " + newLineElement.y);
        //     } else {
        //         this.lineGraphic.moveTo(newLineElement.x, newLineElement.y);
        //         console.log("MoveTo: " + newLineElement.x + ", " + newLineElement.y);
        //     }
        // }
        this.hitPolygonDirty = true;
        this.initialHitPolygonDirty = true;
        this.calculateCenter();
        this.newTurtleX = newLineElement.x;
        this.newTurtleY = newLineElement.y;
        this.newAngleDeg = this.turtleAngleDeg;
        // don't render more frequent than every 1/100 s
        if (!this.renderJobPresent) {
            this.renderJobPresent = true;
            setTimeout(() => {
                this.renderJobPresent = false;
                this.render();
                this.moveTurtleTo(this.newTurtleX, this.newTurtleY, this.turtleAngleDeg);
            }, 100);
        }
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
        this.moveTurtleTo(newLineElement.x, newLineElement.y, this.turtleAngleDeg);
    }
    initTurtle(x, y, angleDeg) {
        this.turtle.clear();
        this.turtle.lineStyle(3, 0xff0000, 1, 0.5);
        this.turtle.moveTo(x, y);
        let angleRad = angleDeg / 180.0 * Math.PI;
        let vx = Math.cos(angleRad);
        let vy = Math.sin(angleRad);
        let vxp = -Math.sin(angleRad);
        let vyp = Math.cos(angleRad);
        let lengthForward = this.turtleSize / 2;
        let lengthBackward = this.turtleSize / 4;
        let lengthBackwardP = this.turtleSize / 4;
        this.turtle.moveTo(x + vx * lengthForward, y + vy * lengthForward);
        this.turtle.lineTo(x - vx * lengthBackward + vxp * lengthBackwardP, y - vy * lengthBackward + vyp * lengthBackwardP);
        this.turtle.lineTo(x - vx * lengthBackward - vxp * lengthBackwardP, y - vy * lengthBackward - vyp * lengthBackwardP);
        this.turtle.lineTo(x + vx * lengthForward, y + vy * lengthForward);
    }
    moveTurtleTo(x, y, angleDeg) {
        this.turtle.localTransform.identity();
        this.turtle.localTransform.rotate(angleDeg / 180.0 * Math.PI);
        this.turtle.localTransform.translate(x, y);
        // this.turtle.localTransform.translate(-this.turtleX, -this.turtleY);
        // this.turtle.localTransform.rotate((angleDeg - this.lastTurtleAngleDeg)/180.0*Math.PI);
        // this.turtle.localTransform.translate(x, y);
        //@ts-ignore
        this.turtle.transform.onChange();
        this.turtle.updateTransform();
        this.lastTurtleAngleDeg = this.turtleAngleDeg;
    }
    render() {
        let g = this.lineGraphic;
        this.lastLineWidth = 0;
        this.lastColor = 0;
        this.lastAlpha = 0;
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
                    if (le.lineWidth != this.lastLineWidth || le.color != this.lastColor || le.alpha != this.lastAlpha) {
                        g.lineStyle(le.lineWidth, le.color, le.alpha, 0.5);
                        this.lastLineWidth = le.lineWidth;
                        this.lastColor = le.color;
                        this.lastAlpha = le.alpha;
                    }
                }
                g.lineTo(le.x, le.y);
                // console.log("LineTo: " + le.x + ", " + le.y);
            }
            else {
                g.moveTo(le.x, le.y);
                // console.log("MoveTo: " + le.x + ", " + le.y);
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
            this.transformHitPolygon();
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
    clear(x = null, y = null, angle = null) {
        let lastLineElement = this.lineElements.pop();
        if (x == null)
            x = lastLineElement.x;
        if (y == null)
            y = lastLineElement.y;
        this.lineElements = [];
        this.lineElements.push({
            x: x,
            y: y,
            color: 0,
            alpha: 1,
            lineWidth: 1
        });
        this.calculateCenter();
        this.hitPolygonInitial = [];
        if (angle != null) {
            this.turtleAngleDeg = angle;
            this.lastTurtleAngleDeg = 0;
            this.borderColor = 0;
            this.turtleSize = 40;
        }
        this.render();
        if (angle != null) {
            this.moveTurtleTo(x, y, angle);
        }
    }
    touchesAtLeastOneFigure() {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        for (let sh of this.worldHelper.shapes) {
            if (sh != this && sh.containsPoint(x, y)) {
                return true;
            }
        }
    }
    touchesColor(farbe) {
        let lastLineElement = this.lineElements[this.lineElements.length - 1];
        let x = lastLineElement.x;
        let y = lastLineElement.y;
        for (let sh of this.worldHelper.shapes) {
            if (sh != this && sh.containsPoint(x, y)) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHVydGxlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9UdXJ0bGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3RELE9BQU8sRUFBRSxtQkFBbUIsRUFBb0Isb0JBQW9CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUNySCxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLCtCQUErQixDQUFDO0FBQzdFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNuRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUVyRCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSwyQkFBMkIsQ0FBQztBQUdsRSxNQUFNLE9BQU8sV0FBWSxTQUFRLEtBQUs7SUFFbEMsWUFBWSxNQUFjO1FBRXRCLEtBQUssQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLDhOQUE4TixDQUFDLENBQUM7UUFFeFAsSUFBSSxDQUFDLFlBQVksQ0FBUSxNQUFNLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1FBRWxFLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxNQUFNLENBQUMsUUFBUSxFQUFFLElBQUksYUFBYSxDQUFDO1lBQ2xELEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7WUFDdEcsRUFBRSxVQUFVLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtTQUN6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QixJQUFJLENBQUMsR0FBRyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBQzFCLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDckMsQ0FBQztDQUlKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgZG91YmxlUHJpbWl0aXZlVHlwZSwgaW50UHJpbWl0aXZlVHlwZSwgYm9vbGVhblByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvUHJpbWl0aXZlVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuaW1wb3J0IHsgRmlsbGVkU2hhcGVIZWxwZXIgfSBmcm9tIFwiLi9GaWxsZWRTaGFwZS5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBwb2x5Z29uQmVyw7xocnRQb2x5Z29uIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL01hdGhlVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgU2hhcGVIZWxwZXIgfSBmcm9tIFwiLi9TaGFwZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFR1cnRsZUNsYXNzIGV4dGVuZHMgS2xhc3Mge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKG1vZHVsZTogTW9kdWxlKSB7XHJcblxyXG4gICAgICAgIHN1cGVyKFwiVHVydGxlXCIsIG1vZHVsZSwgXCJUdXJ0bGUtS2xhc3NlIHp1bSBaZWljaG5lbiB2b24gU3RyZWNrZW56w7xnZW4gb2RlciBnZWbDvGxsdGVuIEZpZ3VyZW4uIFdpY2h0aWcgc2luZCB2b3IgYWxsZW0gZGllIE1ldGhvZGVuIGZvcndhcmQoZG91YmxlIGxlbmd0aCkgdW5kIHR1cm4oZG91YmxlIGFuZ2xlRGVnKSwgZGllIGRpZSBUdXJ0bGUgbmFjaCB2b3JuZSBiZXdlZ2VuIGJ6dy4gaWhyZSBCbGlja3JpY2h0dW5nIMOkbmRlcm4uXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiRmlsbGVkU2hhcGVcIikpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiVHVydGxlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBoID0gbmV3IFR1cnRsZUhlbHBlcih4LCB5LCB0cnVlLCBtb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gcGg7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdJbnN0YW56aWVydCBlaW4gbmV1ZXMgVHVydGxlLU9iamVrdCBvaG5lIFB1bmt0ZS4gRGllIFR1cnRsZSBibGlja3QgYW5mYW5ncyBuYWNoIHJlY2h0cy4gQW0gRW5kZSBkZXMgU3RyZWNrZW56dWdzIHdpcmQgZWluZSBcIlNjaGlsZGtyw7Z0ZVwiIChrbGVpbmVzIERyZWllY2spIGdlemVpY2huZXQuJywgdHJ1ZSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIlR1cnRsZVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ4XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwieVwiLCB0eXBlOiBkb3VibGVQcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNob3dUdXJ0bGVcIiwgdHlwZTogYm9vbGVhblByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2hvd1R1cnRsZTogYm9vbGVhbiA9IHBhcmFtZXRlcnNbM10udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBoID0gbmV3IFR1cnRsZUhlbHBlcih4LCB5LCBzaG93VHVydGxlLCBtb2R1bGUubWFpbi5nZXRJbnRlcnByZXRlcigpLCBvKTtcclxuICAgICAgICAgICAgICAgIG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdID0gcGg7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdJbnN0YW56aWVydCBlaW4gbmV1ZXMgVHVydGxlLU9iamVrdCBvaG5lIFB1bmt0ZS4gRGllIFR1cnRsZSBibGlja3QgYW5mYW5ncyBuYWNoIHJlY2h0cy4gRmFsbHMgc2hvd1R1cnRsZSA9PSB0cnVlLCB3aXJkIGFtIEVuZGUgZGVzIFN0cmVja2VuenVnZXMgZWluZSBcIlNjaGlsZGtyw7Z0ZVwiIChrbGVpbmVzIERyZWllY2spIGdlemVpY2huZXQuJywgdHJ1ZSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImZvcndhcmRcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwibGVuZ3RoXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBsZW5ndGg6IG51bWJlciA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IFR1cnRsZUhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiZm9yd2FyZFwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLmZvcndhcmQobGVuZ3RoKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ1dlaXN0IGRpZSBUdXJ0bGUgYW4sIGRpZSBhbmdlZ2ViZW5lIEzDpG5nZSB2b3J3w6RydHMgenUgZ2VoZW4uIElociB6dXLDvGNrZ2VsZWd0ZXIgV2VnIHdpcmQgYWxzIGdlcmFkZSBTdHJlY2tlIG1pdCBkZXIgYWt0dWVsbGVuIEJvcmRlckNvbG9yIGdlemVpY2huZXQuIE1pdCBzZXRCb3JkZXJDb2xvcihudWxsKSBiZXdpcmtzdCBEdSwgZGFzcyBlaW4gU3TDvGNrIGlocmVzIFdlZ2VzIG5pY2h0IGdlemVpY2huZXQgd2lyZC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwidHVyblwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJhbmdsZUluRGVnXCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBhbmdsZTogbnVtYmVyID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogVHVydGxlSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJ0dXJuXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2gudHVybihhbmdsZSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdCZXdpcmt0LCBkYXNzIHNpY2ggZGllIFR1cnRsZSB1bSBkZW4gYW5nZWdlYmVuZW4gV2lua2VsIChpbiBHcmFkISkgZHJlaHQsIGQuaC4gaWhyZSBCbGlja3JpY2h0dW5nIMOkbmRlcnQuIEVpbiBwb3NpdGl2ZXIgV2lua2VsIGJld2lya3QgZWluZSBEcmVodW5nIGdlZ2VuIGRlbiBVaHJ6ZWlnZXJzaW5uLiBEaWVzZSBNZXRob2RlIHdpcmt0IHNpY2ggTklDSFQgYXVmIGRpZSBiaXNoZXIgZ2V6ZWljaG5ldGVuIFN0cmVja2VuIGF1cy4gV2lsbHN0IER1IGFsbGVzIGJpc2hlciBHZXplaWNobmV0ZSBpbmtsdXNpdmUgVHVydGxlIGRyZWhlbiwgc28gbnV0emUgZGllIE1ldGhvZGUgcm90YXRlLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJwZW5VcFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUdXJ0bGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcInBlblVwXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2gucGVuSXNEb3duID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdCZXdpcmt0LCBkYXNzIGRpZSBUdXJ0bGUgYmVpbSBHZWhlbiBhYiBqZXR6dCBuaWNodCBtZWhyIHplaWNobmV0LicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJwZW5Eb3duXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IFR1cnRsZUhlbHBlciA9IG8uaW50cmluc2ljRGF0YVtcIkFjdG9yXCJdO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwicGVuRG93blwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLnBlbklzRG93biA9IHRydWU7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdCZXdpcmt0LCBkYXNzIGRpZSBUdXJ0bGUgYmVpbSBHZWhlbiBhYiBqZXR6dCB3aWVkZXIgemVpY2huZXQuJywgZmFsc2UpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImNsb3NlQW5kRmlsbFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJjbG9zZUFuZEZpbGxcIiwgdHlwZTogYm9vbGVhblByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBjbG9zZUFuZEZpbGw6IGJvb2xlYW4gPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUdXJ0bGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImNsb3NlQW5kRmlsbFwiKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgICAgIHNoLmNsb3NlQW5kRmlsbChjbG9zZUFuZEZpbGwpO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnY2xvc2VBbmRGaWxsID09IHRydWUgYmV3aXJrdCwgZGFzcyBkYXMgdm9uIGRlciBUdXJ0bGV6ZWljaG51bmcgdW1zY2hsb3NzZW5lIEdlYmlldCBnZWbDvGxsdCB3aXJkLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJzaG93VHVydGxlXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInNob3dUdXJ0bGVcIiwgdHlwZTogYm9vbGVhblByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaG93VHVydGxlOiBib29sZWFuID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBzaDogVHVydGxlSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJzaG93VHVydGxlXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2guc2V0U2hvd1R1cnRsZShzaG93VHVydGxlKTtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ3Nob3dUdXJ0bGUgPT0gdHJ1ZSBiZXdpcmt0LCBkYXNzIGFtIE9ydCBkZXIgVHVydGxlIGVpbiByb3RlcyBEcmVpZWNrIGdlemVpY2huZXQgd2lyZC4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29weVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIHRoaXMsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUdXJ0bGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImNvcHlcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gc2guZ2V0Q29weSg8S2xhc3M+by5jbGFzcyk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdFcnN0ZWxsdCBlaW5lIEtvcGllIGRlcyBUdXJ0bGUtT2JqZWt0cyB1bmQgZ2lidCBlcyB6dXLDvGNrLicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJjbGVhclwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgXSksIHRoaXMsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBUdXJ0bGVIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImNsZWFyXCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHNoLmNsZWFyKCk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdMw7ZzY2h0IGFsbGUgYmlzIGpldHp0IG1pdCBkZXIgVHVydGxlIGdlemVpY2huZXRlbiBTdHJlY2tlbi4nLCBmYWxzZSkpO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG59XHJcblxyXG50eXBlIExpbmVFbGVtZW50ID0ge1xyXG4gICAgeDogbnVtYmVyLFxyXG4gICAgeTogbnVtYmVyLFxyXG4gICAgY29sb3I6IG51bWJlcixcclxuICAgIGFscGhhOiBudW1iZXIsXHJcbiAgICBsaW5lV2lkdGg6IG51bWJlclxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgVHVydGxlSGVscGVyIGV4dGVuZHMgRmlsbGVkU2hhcGVIZWxwZXIge1xyXG5cclxuICAgIGxpbmVFbGVtZW50czogTGluZUVsZW1lbnRbXSA9IFtdO1xyXG4gICAgdHVydGxlQW5nbGVEZWc6IG51bWJlciA9IDA7IC8vIGluIFJhZFxyXG5cclxuICAgIGlzRmlsbGVkOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgdHVydGxlOiBQSVhJLkdyYXBoaWNzO1xyXG4gICAgbGluZUdyYXBoaWM6IFBJWEkuR3JhcGhpY3M7XHJcblxyXG4gICAgeFN1bTogbnVtYmVyID0gMDtcclxuICAgIHlTdW06IG51bWJlciA9IDA7XHJcblxyXG4gICAgaW5pdGlhbEhpdFBvbHlnb25EaXJ0eTogYm9vbGVhbiA9IHRydWU7XHJcblxyXG4gICAgdHVydGxlU2l6ZTogbnVtYmVyID0gNDA7XHJcblxyXG4gICAgcGVuSXNEb3duOiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICBsYXN0TGluZVdpZHRoOiBudW1iZXIgPSAwO1xyXG4gICAgbGFzdENvbG9yOiBudW1iZXIgPSAwO1xyXG4gICAgbGFzdEFscGhhOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIGxhc3RUdXJ0bGVBbmdsZURlZzogbnVtYmVyID0gMDsgLy8gYW5nbGUgaW4gUmFkXHJcblxyXG4gICAgcmVuZGVySm9iUHJlc2VudDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHhTdGFydDogbnVtYmVyLCB5U3RhcnQ6IG51bWJlciwgcHJpdmF0ZSBzaG93VHVydGxlOiBib29sZWFuLFxyXG4gICAgICAgIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuXHJcbiAgICAgICAgdGhpcy5saW5lRWxlbWVudHMucHVzaCh7XHJcbiAgICAgICAgICAgIHg6IHhTdGFydCxcclxuICAgICAgICAgICAgeTogeVN0YXJ0LFxyXG4gICAgICAgICAgICBjb2xvcjogMCxcclxuICAgICAgICAgICAgYWxwaGE6IDEsXHJcbiAgICAgICAgICAgIGxpbmVXaWR0aDogMVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuY2FsY3VsYXRlQ2VudGVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYm9yZGVyQ29sb3IgPSAweGZmZmZmZjtcclxuXHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgY29udGFpbmVyID0gbmV3IFBJWEkuQ29udGFpbmVyKCk7XHJcbiAgICAgICAgdGhpcy5kaXNwbGF5T2JqZWN0ID0gY29udGFpbmVyO1xyXG5cclxuICAgICAgICB0aGlzLmxpbmVHcmFwaGljID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcclxuICAgICAgICBjb250YWluZXIuYWRkQ2hpbGQodGhpcy5saW5lR3JhcGhpYyk7XHJcbiAgICAgICAgdGhpcy5saW5lR3JhcGhpYy5tb3ZlVG8oeFN0YXJ0LCB5U3RhcnQpO1xyXG5cclxuICAgICAgICB0aGlzLnR1cnRsZSA9IG5ldyBQSVhJLkdyYXBoaWNzKCk7XHJcbiAgICAgICAgY29udGFpbmVyLmFkZENoaWxkKHRoaXMudHVydGxlKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS52aXNpYmxlID0gdGhpcy5zaG93VHVydGxlO1xyXG4gICAgICAgIHRoaXMuaW5pdFR1cnRsZSgwLCAwLCB0aGlzLnR1cnRsZUFuZ2xlRGVnKTtcclxuICAgICAgICB0aGlzLm1vdmVUdXJ0bGVUbyh4U3RhcnQsIHlTdGFydCwgdGhpcy50dXJ0bGVBbmdsZURlZyk7XHJcblxyXG5cclxuICAgICAgICAvLyBsZXQgZzogUElYSS5HcmFwaGljcyA9IDxhbnk+dGhpcy5kaXNwbGF5T2JqZWN0O1xyXG5cclxuICAgICAgICB0aGlzLndvcmxkSGVscGVyLnN0YWdlLmFkZENoaWxkKHRoaXMuZGlzcGxheU9iamVjdCk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkVG9EZWZhdWx0R3JvdXBBbmRTZXREZWZhdWx0VmlzaWJpbGl0eSgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjYWxjdWxhdGVDZW50ZXIoKSB7XHJcbiAgICAgICAgbGV0IGxlbmd0aCA9IHRoaXMubGluZUVsZW1lbnRzLmxlbmd0aDtcclxuICAgICAgICBsZXQgbGFzdExpbmVFbGVtZW50ID0gdGhpcy5saW5lRWxlbWVudHNbbGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy54U3VtICs9IGxhc3RMaW5lRWxlbWVudC54O1xyXG4gICAgICAgIHRoaXMueVN1bSArPSBsYXN0TGluZUVsZW1lbnQueTtcclxuICAgICAgICB0aGlzLmNlbnRlclhJbml0aWFsID0gdGhpcy54U3VtIC8gbGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuY2VudGVyWUluaXRpYWwgPSB0aGlzLnlTdW0gLyBsZW5ndGg7XHJcbiAgICB9XHJcblxyXG4gICAgY2xvc2VBbmRGaWxsKGNsb3NlQW5kRmlsbDogYm9vbGVhbikge1xyXG4gICAgICAgIGlmIChjbG9zZUFuZEZpbGwgIT0gdGhpcy5pc0ZpbGxlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmlzRmlsbGVkID0gY2xvc2VBbmRGaWxsO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgICAgICB0aGlzLmluaXRpYWxIaXRQb2x5Z29uRGlydHkgPSB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRTaG93VHVydGxlKHNob3c6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLnR1cnRsZS52aXNpYmxlID0gc2hvdztcclxuICAgIH1cclxuXHJcbiAgICB0dXJuKGFuZ2xlRGVnOiBudW1iZXIpIHtcclxuICAgICAgICB0aGlzLnR1cnRsZUFuZ2xlRGVnIC09IGFuZ2xlRGVnO1xyXG4gICAgICAgIGlmKE1hdGguYWJzKHRoaXMudHVydGxlQW5nbGVEZWcpID4gMzYwKXtcclxuICAgICAgICAgICAgdGhpcy50dXJ0bGVBbmdsZURlZyAtPSBNYXRoLmZsb29yKHRoaXMudHVydGxlQW5nbGVEZWcvMzYwKSozNjA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBsYXN0TGluZUVsZW1lbnQ6IExpbmVFbGVtZW50ID0gdGhpcy5saW5lRWxlbWVudHNbdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgdGhpcy5tb3ZlVHVydGxlVG8obGFzdExpbmVFbGVtZW50LngsIGxhc3RMaW5lRWxlbWVudC55LCB0aGlzLnR1cnRsZUFuZ2xlRGVnKTtcclxuICAgIH1cclxuXHJcbiAgICByb3RhdGUoYW5nbGVJbkRlZ3JlZXM6IG51bWJlciwgY3g/OiBudW1iZXIsIGN5PzogbnVtYmVyKSB7XHJcbiAgICAgICAgLy8gdGhpcy50dXJuKGFuZ2xlSW5EZWdyZWVzKTtcclxuICAgICAgICBzdXBlci5yb3RhdGUoYW5nbGVJbkRlZ3JlZXMsIGN4LCBjeSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29weShrbGFzczogS2xhc3MpOiBSdW50aW1lT2JqZWN0IHtcclxuXHJcbiAgICAgICAgbGV0IHJvOiBSdW50aW1lT2JqZWN0ID0gbmV3IFJ1bnRpbWVPYmplY3Qoa2xhc3MpO1xyXG4gICAgICAgIGxldCByaDogVHVydGxlSGVscGVyID0gbmV3IFR1cnRsZUhlbHBlcih0aGlzLmxpbmVFbGVtZW50c1swXS54LCB0aGlzLmxpbmVFbGVtZW50c1swXS55LFxyXG4gICAgICAgICAgICB0aGlzLnNob3dUdXJ0bGUsIHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIsIHJvKTtcclxuICAgICAgICByby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSByaDtcclxuXHJcbiAgICAgICAgcmgudHVydGxlQW5nbGVEZWcgPSB0aGlzLnR1cnRsZUFuZ2xlRGVnO1xyXG5cclxuICAgICAgICByaC5jb3B5RnJvbSh0aGlzKTtcclxuICAgICAgICByaC5yZW5kZXIoKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJvO1xyXG4gICAgfVxyXG5cclxuICAgIG5ld1R1cnRsZVg6IG51bWJlcjtcclxuICAgIG5ld1R1cnRsZVk6IG51bWJlcjtcclxuICAgIG5ld0FuZ2xlRGVnOiBudW1iZXI7XHJcblxyXG4gICAgZm9yd2FyZChsZW5ndGg6IG51bWJlcikge1xyXG5cclxuICAgICAgICBsZXQgbGFzdExpbmVFbGVtZW50OiBMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzW3RoaXMubGluZUVsZW1lbnRzLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgICBsZXQgdHVydGxlQW5nbGVSYWQgPSB0aGlzLnR1cnRsZUFuZ2xlRGVnLzE4MC4wKk1hdGguUEk7XHJcblxyXG4gICAgICAgIGxldCBuZXdMaW5lRWxlbWVudDogTGluZUVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgIHg6IGxhc3RMaW5lRWxlbWVudC54ICsgbGVuZ3RoICogTWF0aC5jb3ModHVydGxlQW5nbGVSYWQpLFxyXG4gICAgICAgICAgICB5OiBsYXN0TGluZUVsZW1lbnQueSArIGxlbmd0aCAqIE1hdGguc2luKHR1cnRsZUFuZ2xlUmFkKSxcclxuICAgICAgICAgICAgY29sb3I6IHRoaXMucGVuSXNEb3duID8gdGhpcy5ib3JkZXJDb2xvciA6IG51bGwsXHJcbiAgICAgICAgICAgIGFscGhhOiB0aGlzLmJvcmRlckFscGhhLFxyXG4gICAgICAgICAgICBsaW5lV2lkdGg6IHRoaXMuYm9yZGVyV2lkdGhcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGluZUVsZW1lbnRzLnB1c2gobmV3TGluZUVsZW1lbnQpO1xyXG5cclxuICAgICAgICAvLyBpZiAodGhpcy5pc0ZpbGxlZCkge1xyXG4gICAgICAgIC8vICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgIC8vIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgIGlmICh0aGlzLmJvcmRlckNvbG9yICE9IG51bGwpIHtcclxuICAgICAgICAvLyAgICAgICAgIC8vIHRoaXMubGluZUdyYXBoaWMubW92ZVRvKGxhc3RMaW5lRWxlbWVudC54LCBsYXN0TGluZUVsZW1lbnQueSk7XHJcbiAgICAgICAgLy8gICAgICAgICB0aGlzLmxpbmVHcmFwaGljLmxpbmVTdHlsZSh0aGlzLmJvcmRlcldpZHRoLCB0aGlzLmJvcmRlckNvbG9yLCB0aGlzLmJvcmRlckFscGhhLCAwLjUpO1xyXG4gICAgICAgIC8vICAgICAgICAgdGhpcy5saW5lR3JhcGhpYy5saW5lVG8obmV3TGluZUVsZW1lbnQueCwgbmV3TGluZUVsZW1lbnQueSk7XHJcbiAgICAgICAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcIkxpbmVUbzogXCIgKyBuZXdMaW5lRWxlbWVudC54ICsgXCIsIFwiICsgbmV3TGluZUVsZW1lbnQueSk7XHJcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy8gICAgICAgICB0aGlzLmxpbmVHcmFwaGljLm1vdmVUbyhuZXdMaW5lRWxlbWVudC54LCBuZXdMaW5lRWxlbWVudC55KTtcclxuICAgICAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiTW92ZVRvOiBcIiArIG5ld0xpbmVFbGVtZW50LnggKyBcIiwgXCIgKyBuZXdMaW5lRWxlbWVudC55KTtcclxuICAgICAgICAvLyAgICAgfVxyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uRGlydHkgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbEhpdFBvbHlnb25EaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVDZW50ZXIoKTtcclxuXHJcbiAgICAgICAgdGhpcy5uZXdUdXJ0bGVYID0gbmV3TGluZUVsZW1lbnQueDtcclxuICAgICAgICB0aGlzLm5ld1R1cnRsZVkgPSBuZXdMaW5lRWxlbWVudC55O1xyXG4gICAgICAgIHRoaXMubmV3QW5nbGVEZWcgPSB0aGlzLnR1cnRsZUFuZ2xlRGVnO1xyXG5cclxuICAgICAgICAvLyBkb24ndCByZW5kZXIgbW9yZSBmcmVxdWVudCB0aGFuIGV2ZXJ5IDEvMTAwIHNcclxuICAgICAgICBpZiAoIXRoaXMucmVuZGVySm9iUHJlc2VudCkge1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlckpvYlByZXNlbnQgPSB0cnVlO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVySm9iUHJlc2VudCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubW92ZVR1cnRsZVRvKHRoaXMubmV3VHVydGxlWCwgdGhpcy5uZXdUdXJ0bGVZLCB0aGlzLnR1cnRsZUFuZ2xlRGVnKTtcclxuICAgICAgICAgICAgfSwgMTAwKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG1vdmVUbyh4OiBudW1iZXIsIHk6IG51bWJlcikge1xyXG4gICAgICAgIGxldCBuZXdMaW5lRWxlbWVudDogTGluZUVsZW1lbnQgPSB7XHJcbiAgICAgICAgICAgIHg6IHgsXHJcbiAgICAgICAgICAgIHk6IHksXHJcbiAgICAgICAgICAgIGNvbG9yOiBudWxsLFxyXG4gICAgICAgICAgICBhbHBoYTogdGhpcy5ib3JkZXJBbHBoYSxcclxuICAgICAgICAgICAgbGluZVdpZHRoOiB0aGlzLmJvcmRlcldpZHRoXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxpbmVFbGVtZW50cy5wdXNoKG5ld0xpbmVFbGVtZW50KTtcclxuXHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uRGlydHkgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMuaW5pdGlhbEhpdFBvbHlnb25EaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgdGhpcy5jYWxjdWxhdGVDZW50ZXIoKTtcclxuICAgICAgICB0aGlzLm1vdmVUdXJ0bGVUbyhuZXdMaW5lRWxlbWVudC54LCBuZXdMaW5lRWxlbWVudC55LCB0aGlzLnR1cnRsZUFuZ2xlRGVnKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaW5pdFR1cnRsZSh4OiBudW1iZXIsIHk6IG51bWJlciwgYW5nbGVEZWc6IG51bWJlcik6IHZvaWQge1xyXG4gICAgICAgIHRoaXMudHVydGxlLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy50dXJ0bGUubGluZVN0eWxlKDMsIDB4ZmYwMDAwLCAxLCAwLjUpO1xyXG4gICAgICAgIHRoaXMudHVydGxlLm1vdmVUbyh4LCB5KTtcclxuXHJcbiAgICAgICAgbGV0IGFuZ2xlUmFkID0gYW5nbGVEZWcvMTgwLjAqTWF0aC5QSTtcclxuXHJcbiAgICAgICAgbGV0IHZ4ID0gTWF0aC5jb3MoYW5nbGVSYWQpO1xyXG4gICAgICAgIGxldCB2eSA9IE1hdGguc2luKGFuZ2xlUmFkKTtcclxuXHJcbiAgICAgICAgbGV0IHZ4cCA9IC1NYXRoLnNpbihhbmdsZVJhZCk7XHJcbiAgICAgICAgbGV0IHZ5cCA9IE1hdGguY29zKGFuZ2xlUmFkKTtcclxuXHJcbiAgICAgICAgbGV0IGxlbmd0aEZvcndhcmQgPSB0aGlzLnR1cnRsZVNpemUgLyAyO1xyXG4gICAgICAgIGxldCBsZW5ndGhCYWNrd2FyZCA9IHRoaXMudHVydGxlU2l6ZSAvIDQ7XHJcbiAgICAgICAgbGV0IGxlbmd0aEJhY2t3YXJkUCA9IHRoaXMudHVydGxlU2l6ZSAvIDQ7XHJcblxyXG4gICAgICAgIHRoaXMudHVydGxlLm1vdmVUbyh4ICsgdnggKiBsZW5ndGhGb3J3YXJkLCB5ICsgdnkgKiBsZW5ndGhGb3J3YXJkKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5saW5lVG8oeCAtIHZ4ICogbGVuZ3RoQmFja3dhcmQgKyB2eHAgKiBsZW5ndGhCYWNrd2FyZFAsIHkgLSB2eSAqIGxlbmd0aEJhY2t3YXJkICsgdnlwICogbGVuZ3RoQmFja3dhcmRQKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5saW5lVG8oeCAtIHZ4ICogbGVuZ3RoQmFja3dhcmQgLSB2eHAgKiBsZW5ndGhCYWNrd2FyZFAsIHkgLSB2eSAqIGxlbmd0aEJhY2t3YXJkIC0gdnlwICogbGVuZ3RoQmFja3dhcmRQKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5saW5lVG8oeCArIHZ4ICogbGVuZ3RoRm9yd2FyZCwgeSArIHZ5ICogbGVuZ3RoRm9yd2FyZCk7XHJcbiAgICB9XHJcblxyXG4gICAgbW92ZVR1cnRsZVRvKHg6IG51bWJlciwgeTogbnVtYmVyLCBhbmdsZURlZzogbnVtYmVyKXtcclxuICAgICAgICB0aGlzLnR1cnRsZS5sb2NhbFRyYW5zZm9ybS5pZGVudGl0eSgpO1xyXG4gICAgICAgIHRoaXMudHVydGxlLmxvY2FsVHJhbnNmb3JtLnJvdGF0ZShhbmdsZURlZy8xODAuMCpNYXRoLlBJKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS5sb2NhbFRyYW5zZm9ybS50cmFuc2xhdGUoeCwgeSk7XHJcblxyXG4gICAgICAgIC8vIHRoaXMudHVydGxlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSgtdGhpcy50dXJ0bGVYLCAtdGhpcy50dXJ0bGVZKTtcclxuICAgICAgICAvLyB0aGlzLnR1cnRsZS5sb2NhbFRyYW5zZm9ybS5yb3RhdGUoKGFuZ2xlRGVnIC0gdGhpcy5sYXN0VHVydGxlQW5nbGVEZWcpLzE4MC4wKk1hdGguUEkpO1xyXG4gICAgICAgIC8vIHRoaXMudHVydGxlLmxvY2FsVHJhbnNmb3JtLnRyYW5zbGF0ZSh4LCB5KTtcclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICB0aGlzLnR1cnRsZS50cmFuc2Zvcm0ub25DaGFuZ2UoKTtcclxuICAgICAgICB0aGlzLnR1cnRsZS51cGRhdGVUcmFuc2Zvcm0oKTtcclxuXHJcbiAgICAgICAgdGhpcy5sYXN0VHVydGxlQW5nbGVEZWcgPSB0aGlzLnR1cnRsZUFuZ2xlRGVnO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpOiB2b2lkIHtcclxuXHJcbiAgICAgICAgbGV0IGc6IFBJWEkuR3JhcGhpY3MgPSB0aGlzLmxpbmVHcmFwaGljO1xyXG5cclxuICAgICAgICB0aGlzLmxhc3RMaW5lV2lkdGggPSAwO1xyXG4gICAgICAgIHRoaXMubGFzdENvbG9yID0gMDtcclxuICAgICAgICB0aGlzLmxhc3RBbHBoYSA9IDA7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmRpc3BsYXlPYmplY3QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBnID0gbmV3IFBJWEkuR3JhcGhpY3MoKTtcclxuICAgICAgICAgICAgdGhpcy5kaXNwbGF5T2JqZWN0ID0gZztcclxuICAgICAgICAgICAgdGhpcy53b3JsZEhlbHBlci5zdGFnZS5hZGRDaGlsZChnKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZy5jbGVhcigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuZmlsbENvbG9yICE9IG51bGwgJiYgdGhpcy5pc0ZpbGxlZCkge1xyXG4gICAgICAgICAgICBnLmJlZ2luRmlsbCh0aGlzLmZpbGxDb2xvciwgdGhpcy5maWxsQWxwaGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGZpcnN0UG9pbnQgPSB0aGlzLmxpbmVFbGVtZW50c1swXTtcclxuICAgICAgICBnLm1vdmVUbyhmaXJzdFBvaW50LngsIGZpcnN0UG9pbnQueSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIGcubGluZVN0eWxlKHRoaXMuYm9yZGVyV2lkdGgsIHRoaXMuYm9yZGVyQ29sb3IsIHRoaXMuYm9yZGVyQWxwaGEsIDAuNSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGxlOiBMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzW2ldO1xyXG4gICAgICAgICAgICBpZiAobGUuY29sb3IgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGxlLmxpbmVXaWR0aCAhPSB0aGlzLmxhc3RMaW5lV2lkdGggfHwgbGUuY29sb3IgIT0gdGhpcy5sYXN0Q29sb3IgfHwgbGUuYWxwaGEgIT0gdGhpcy5sYXN0QWxwaGEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZy5saW5lU3R5bGUobGUubGluZVdpZHRoLCBsZS5jb2xvciwgbGUuYWxwaGEsIDAuNSlcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0TGluZVdpZHRoID0gbGUubGluZVdpZHRoO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RDb2xvciA9IGxlLmNvbG9yO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhc3RBbHBoYSA9IGxlLmFscGhhO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGcubGluZVRvKGxlLngsIGxlLnkpO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJMaW5lVG86IFwiICsgbGUueCArIFwiLCBcIiArIGxlLnkpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgZy5tb3ZlVG8obGUueCwgbGUueSk7XHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIk1vdmVUbzogXCIgKyBsZS54ICsgXCIsIFwiICsgbGUueSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIGcuY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5maWxsQ29sb3IgIT0gbnVsbCAmJiB0aGlzLmlzRmlsbGVkKSB7XHJcbiAgICAgICAgICAgIGcuZW5kRmlsbCgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgY29sbGlkZXNXaXRoKHNoYXBlSGVscGVyOiBhbnkpIHtcclxuXHJcbiAgICAgICAgaWYgKHNoYXBlSGVscGVyIGluc3RhbmNlb2YgVHVydGxlSGVscGVyICYmIHNoYXBlSGVscGVyLmluaXRpYWxIaXRQb2x5Z29uRGlydHkpIHtcclxuICAgICAgICAgICAgc2hhcGVIZWxwZXIuc2V0dXBJbml0aWFsSGl0UG9seWdvbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaW5pdGlhbEhpdFBvbHlnb25EaXJ0eSkge1xyXG4gICAgICAgICAgICB0aGlzLnNldHVwSW5pdGlhbEhpdFBvbHlnb24oKTtcclxuICAgICAgICAgICAgdGhpcy50cmFuc2Zvcm1IaXRQb2x5Z29uKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYmIgPSB0aGlzLmRpc3BsYXlPYmplY3QuZ2V0Qm91bmRzKCk7XHJcbiAgICAgICAgbGV0IGJiMSA9IHNoYXBlSGVscGVyLmRpc3BsYXlPYmplY3QuZ2V0Qm91bmRzKCk7XHJcblxyXG4gICAgICAgIGlmIChiYi5sZWZ0ID4gYmIxLnJpZ2h0IHx8IGJiMS5sZWZ0ID4gYmIucmlnaHQpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKGJiLnRvcCA+IGJiMS5ib3R0b20gfHwgYmIxLnRvcCA+IGJiLmJvdHRvbSkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICBpZiAoc2hhcGVIZWxwZXJbXCJzaGFwZXNcIl0pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHNoYXBlSGVscGVyLmNvbGxpZGVzV2l0aCh0aGlzKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmhpdFBvbHlnb25Jbml0aWFsID09IG51bGwgfHwgc2hhcGVIZWxwZXIuaGl0UG9seWdvbkluaXRpYWwgPT0gbnVsbCkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIC8vIGJvdW5kaWcgYm94ZXMgY29sbGlkZSwgc28gY2hlY2sgZnVydGhlcjpcclxuICAgICAgICBpZiAodGhpcy5oaXRQb2x5Z29uRGlydHkpIHRoaXMudHJhbnNmb3JtSGl0UG9seWdvbigpO1xyXG4gICAgICAgIGlmIChzaGFwZUhlbHBlci5oaXRQb2x5Z29uRGlydHkpIHNoYXBlSGVscGVyLnRyYW5zZm9ybUhpdFBvbHlnb24oKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHBvbHlnb25CZXLDvGhydFBvbHlnb24odGhpcy5oaXRQb2x5Z29uVHJhbnNmb3JtZWQsIHNoYXBlSGVscGVyLmhpdFBvbHlnb25UcmFuc2Zvcm1lZCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldHVwSW5pdGlhbEhpdFBvbHlnb24oKSB7XHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IHRoaXMubGluZUVsZW1lbnRzLm1hcCgobGUpID0+IHsgcmV0dXJuIHsgeDogbGUueCwgeTogbGUueSB9IH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKHg6IG51bWJlciA9IG51bGwsIHk6IG51bWJlciA9IG51bGwsIGFuZ2xlOiBudW1iZXIgPSBudWxsKSB7XHJcbiAgICAgICAgbGV0IGxhc3RMaW5lRWxlbWVudCA9IHRoaXMubGluZUVsZW1lbnRzLnBvcCgpO1xyXG4gICAgICAgIGlmKHggPT0gbnVsbCkgeCA9IGxhc3RMaW5lRWxlbWVudC54O1xyXG4gICAgICAgIGlmKHkgPT0gbnVsbCkgeSA9IGxhc3RMaW5lRWxlbWVudC55O1xyXG5cclxuICAgICAgICB0aGlzLmxpbmVFbGVtZW50cyA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLmxpbmVFbGVtZW50cy5wdXNoKHtcclxuICAgICAgICAgICAgeDogeCxcclxuICAgICAgICAgICAgeTogeSxcclxuICAgICAgICAgICAgY29sb3I6IDAsXHJcbiAgICAgICAgICAgIGFscGhhOiAxLFxyXG4gICAgICAgICAgICBsaW5lV2lkdGg6IDFcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmNhbGN1bGF0ZUNlbnRlcigpO1xyXG5cclxuICAgICAgICB0aGlzLmhpdFBvbHlnb25Jbml0aWFsID0gW107XHJcbiAgICAgICAgaWYoYW5nbGUgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMudHVydGxlQW5nbGVEZWcgPSBhbmdsZTtcclxuICAgICAgICAgICAgdGhpcy5sYXN0VHVydGxlQW5nbGVEZWcgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmJvcmRlckNvbG9yID0gMDtcclxuICAgICAgICAgICAgdGhpcy50dXJ0bGVTaXplID0gNDA7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICAgICAgaWYoYW5nbGUgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHRoaXMubW92ZVR1cnRsZVRvKHgsIHksIGFuZ2xlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHRvdWNoZXNBdExlYXN0T25lRmlndXJlKCk6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBsYXN0TGluZUVsZW1lbnQ6IExpbmVFbGVtZW50ID0gdGhpcy5saW5lRWxlbWVudHNbdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgbGV0IHggPSBsYXN0TGluZUVsZW1lbnQueDtcclxuICAgICAgICBsZXQgeSA9IGxhc3RMaW5lRWxlbWVudC55O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzaCBvZiB0aGlzLndvcmxkSGVscGVyLnNoYXBlcykge1xyXG4gICAgICAgICAgICBpZiAoc2ggIT0gdGhpcyAmJiBzaC5jb250YWluc1BvaW50KHgsIHkpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0b3VjaGVzQ29sb3IoZmFyYmU6IG51bWJlcik6IGJvb2xlYW4ge1xyXG4gICAgICAgIGxldCBsYXN0TGluZUVsZW1lbnQ6IExpbmVFbGVtZW50ID0gdGhpcy5saW5lRWxlbWVudHNbdGhpcy5saW5lRWxlbWVudHMubGVuZ3RoIC0gMV07XHJcbiAgICAgICAgbGV0IHggPSBsYXN0TGluZUVsZW1lbnQueDtcclxuICAgICAgICBsZXQgeSA9IGxhc3RMaW5lRWxlbWVudC55O1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzaCBvZiB0aGlzLndvcmxkSGVscGVyLnNoYXBlcykge1xyXG4gICAgICAgICAgICBpZiAoc2ggIT0gdGhpcyAmJiBzaC5jb250YWluc1BvaW50KHgsIHkpKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2ggaW5zdGFuY2VvZiBGaWxsZWRTaGFwZUhlbHBlciAmJiBzaC5maWxsQ29sb3IgPT0gZmFyYmUpIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy8gaWYoc2ggaW5zdGFuY2VvZiBUdXJ0bGVIZWxwZXIpIFRPRE9cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0b3VjaGVzU2hhcGUoc2hhcGU6IFNoYXBlSGVscGVyKSB7XHJcbiAgICAgICAgbGV0IGxhc3RMaW5lRWxlbWVudDogTGluZUVsZW1lbnQgPSB0aGlzLmxpbmVFbGVtZW50c1t0aGlzLmxpbmVFbGVtZW50cy5sZW5ndGggLSAxXTtcclxuICAgICAgICBsZXQgeCA9IGxhc3RMaW5lRWxlbWVudC54O1xyXG4gICAgICAgIGxldCB5ID0gbGFzdExpbmVFbGVtZW50Lnk7XHJcbiAgICAgICAgcmV0dXJuIHNoYXBlLmNvbnRhaW5zUG9pbnQoeCwgeSk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuIl19