import { Klass } from "../../compiler/types/Class.js";
import { doublePrimitiveType, booleanPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
import { RuntimeObject } from "../../interpreter/RuntimeObject.js";
import { FilledShapeHelper } from "./FilledShape.js";
import { ArrayType } from "../../compiler/types/Array.js";
export class PolygonClass extends Klass {
    constructor(module) {
        super("Polygon", module, "Wahlweise geschlossenes Polygon (mit Füllung und Rand) oder offener Streckenzug");
        this.setBaseClass(module.typeStore.getType("FilledShape"));
        // this.addAttribute(new Attribute("PI", doublePrimitiveType, (object) => { return Math.PI }, true, Visibility.public, true, "Die Kreiszahl Pi (3.1415...)"));
        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let closeAndFill = parameters[1].value;
            let points = parameters[2].value;
            let pointsNumber = [];
            points.forEach(v => pointsNumber.push(v.value));
            let ph = new PolygonHelper(pointsNumber, closeAndFill, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = ph;
        }, false, false, 'Instanziert ein neues Polygon. Die Punkte werden als Array von double-Werten der Form {x1, y1, x2, y2, ...} übergeben.', true));
        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true, isEllipsis: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let closeAndFill = parameters[1].value;
            let points = parameters[2].value;
            let pointsNumber = [];
            points.forEach(v => pointsNumber.push(v.value));
            let ph = new PolygonHelper(pointsNumber, closeAndFill, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = ph;
        }, false, false, 'Instanziert ein neues Polygon. Die Punkte werden als double-Werte der Form x1, y1, x2, y2, ... übergeben.', true));
        this.addMethod(new Method("Polygon", new Parameterlist([
            { identifier: "closeAndFill", type: booleanPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let closeAndFill = parameters[1].value;
            let pointsNumber = [];
            let ph = new PolygonHelper(pointsNumber, closeAndFill, module.main.getInterpreter(), o);
            o.intrinsicData["Actor"] = ph;
        }, false, false, 'Instanziert ein neues Polygon ohne Punkte.', true));
        this.addMethod(new Method("addPoint", new Parameterlist([
            { identifier: "x", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "y", type: doublePrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let x = parameters[1].value;
            let y = parameters[2].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("addPoint"))
                return;
            sh.addPoint(x, y);
        }, false, false, 'Fügt dem Polygon einen Punkt hinzu."', false));
        this.addMethod(new Method("addPoints", new Parameterlist([
            { identifier: "points", type: new ArrayType(doublePrimitiveType), declaration: null, usagePositions: null, isFinal: true },
        ]), null, (parameters) => {
            let o = parameters[0].value;
            let points = parameters[1].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("addPoints"))
                return;
            let p;
            for (let i = 0; i < points.length - 1; i += 2) {
                sh.addPoint(points[i].value, points[i + 1].value, i >= points.length - 2);
            }
        }, false, false, 'Fügt dem Polygon mehrere Punkte hinzu. Diese werden in einem double[] übergeben, das abwechselnd die x- und y-Koordinaten enthält."', false));
        this.addMethod(new Method("copy", new Parameterlist([]), this, (parameters) => {
            let o = parameters[0].value;
            let sh = o.intrinsicData["Actor"];
            if (sh.testdestroyed("copy"))
                return;
            return sh.getCopy(o.class);
        }, false, false, 'Erstellt eine Kopie des Polygon-Objekts und git sie zurück.', false));
    }
}
export class PolygonHelper extends FilledShapeHelper {
    constructor(points, closeAndFill, interpreter, runtimeObject) {
        super(interpreter, runtimeObject);
        this.closeAndFill = closeAndFill;
        let xSum = 0;
        let ySum = 0;
        this.hitPolygonInitial = [];
        for (let i = 0; i < points.length;) {
            let x = points[i++];
            let y = points[i++];
            xSum += x;
            ySum += y;
            this.hitPolygonInitial.push({ x: x, y: y });
        }
        if (points.length > 1) {
            this.centerXInitial = xSum / this.hitPolygonInitial.length;
            this.centerYInitial = ySum / this.hitPolygonInitial.length;
        }
        if (!closeAndFill) {
            this.borderColor = 0x0000ff;
        }
        this.render();
        this.addToDefaultGroup();
    }
    getCopy(klass) {
        let ro = new RuntimeObject(klass);
        let rh = new PolygonHelper([], this.closeAndFill, this.worldHelper.interpreter, ro);
        ro.intrinsicData["Actor"] = rh;
        rh.copyFrom(this);
        rh.render();
        return ro;
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
        if (this.fillColor != null && this.closeAndFill) {
            g.beginFill(this.fillColor, this.fillAlpha);
        }
        if (this.borderColor != null) {
            g.lineStyle(this.borderWidth, this.borderColor, this.borderAlpha, 0.5);
        }
        if (this.hitPolygonInitial.length > 0) {
            g.moveTo(this.hitPolygonInitial[0].x, this.hitPolygonInitial[0].y);
            for (let i = 1; i < this.hitPolygonInitial.length; i++) {
                g.lineTo(this.hitPolygonInitial[i].x, this.hitPolygonInitial[i].y);
            }
        }
        if (this.closeAndFill) {
            g.closePath();
        }
        if (this.fillColor != null && this.closeAndFill) {
            g.endFill();
        }
    }
    ;
    addPoint(x, y, render = true) {
        let p = new PIXI.Point(x, y);
        this.displayObject.transform.worldTransform.applyInverse(p, p);
        this.hitPolygonInitial.push({ x: p.x, y: p.y });
        this.hitPolygonDirty = true;
        if (render)
            this.render();
    }
    setPoint(x, y, index) {
        if (index == 0 || index == 1) {
            this.hitPolygonInitial[index] = { x: x, y: y };
            this.hitPolygonDirty = true;
            this.render();
        }
    }
    setPoints(x1, y1, x2, y2) {
        this.hitPolygonInitial = [{ x: x1, y: y1 }, { x: x2, y: y2 }];
        this.hitPolygonDirty = true;
        this.render();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUG9seWdvbiBjb3B5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9ncmFwaGljcy9Qb2x5Z29uIGNvcHkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBQ3RELE9BQU8sRUFBRSxtQkFBbUIsRUFBb0Isb0JBQW9CLEVBQUUsTUFBTSx3Q0FBd0MsQ0FBQztBQUNySCxPQUFPLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBUyxNQUFNLCtCQUErQixDQUFDO0FBQzdFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxvQ0FBb0MsQ0FBQztBQUNuRSxPQUFPLEVBQUUsaUJBQWlCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUVyRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFJMUQsTUFBTSxPQUFPLFlBQWEsU0FBUSxLQUFLO0lBRW5DLFlBQVksTUFBYztRQUV0QixLQUFLLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxpRkFBaUYsQ0FBQyxDQUFDO1FBRTVHLElBQUksQ0FBQyxZQUFZLENBQVEsTUFBTSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztRQUVsRSw4SkFBOEo7UUFFOUosSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxTQUFTLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDbkQsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtZQUNsSCxFQUFFLFVBQVUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksU0FBUyxDQUFDLG1CQUFtQixDQUFDLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxj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QUFFLEVBQUUsRUFBQyxDQUFDLEVBQUUsRUFBRSxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsRUFBRSxFQUFDLENBQUMsRUFBRSxFQUFFLEVBQUMsQ0FBQyxDQUFDO1FBQ3hELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUNsQixDQUFDO0NBSUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcyB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBkb3VibGVQcmltaXRpdmVUeXBlLCBpbnRQcmltaXRpdmVUeXBlLCBib29sZWFuUHJpbWl0aXZlVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9QcmltaXRpdmVUeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QsIFBhcmFtZXRlcmxpc3QsIFZhbHVlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBGaWxsZWRTaGFwZUhlbHBlciB9IGZyb20gXCIuL0ZpbGxlZFNoYXBlLmpzXCI7XHJcbmltcG9ydCB7IFdvcmxkSGVscGVyIH0gZnJvbSBcIi4vV29ybGQuanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0FycmF5LmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IEhpdFBvbHlnb25TdG9yZSB9IGZyb20gXCIuL1BvbHlnb25TdG9yZS5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIFBvbHlnb25DbGFzcyBleHRlbmRzIEtsYXNzIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBzdXBlcihcIlBvbHlnb25cIiwgbW9kdWxlLCBcIldhaGx3ZWlzZSBnZXNjaGxvc3NlbmVzIFBvbHlnb24gKG1pdCBGw7xsbHVuZyB1bmQgUmFuZCkgb2RlciBvZmZlbmVyIFN0cmVja2VuenVnXCIpO1xyXG5cclxuICAgICAgICB0aGlzLnNldEJhc2VDbGFzcyg8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiRmlsbGVkU2hhcGVcIikpO1xyXG5cclxuICAgICAgICAvLyB0aGlzLmFkZEF0dHJpYnV0ZShuZXcgQXR0cmlidXRlKFwiUElcIiwgZG91YmxlUHJpbWl0aXZlVHlwZSwgKG9iamVjdCkgPT4geyByZXR1cm4gTWF0aC5QSSB9LCB0cnVlLCBWaXNpYmlsaXR5LnB1YmxpYywgdHJ1ZSwgXCJEaWUgS3JlaXN6YWhsIFBpICgzLjE0MTUuLi4pXCIpKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcIlBvbHlnb25cIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiY2xvc2VBbmRGaWxsXCIsIHR5cGU6IGJvb2xlYW5QcmltaXRpdmVUeXBlLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInBvaW50c1wiLCB0eXBlOiBuZXcgQXJyYXlUeXBlKGRvdWJsZVByaW1pdGl2ZVR5cGUpLCBkZWNsYXJhdGlvbjogbnVsbCwgdXNhZ2VQb3NpdGlvbnM6IG51bGwsIGlzRmluYWw6IHRydWUgfSxcclxuICAgICAgICBdKSwgbnVsbCxcclxuICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2xvc2VBbmRGaWxsOiBib29sZWFuID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBwb2ludHM6IFZhbHVlW10gPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwb2ludHNOdW1iZXI6IG51bWJlcltdID0gW107XHJcbiAgICAgICAgICAgICAgICBwb2ludHMuZm9yRWFjaCh2ID0+IHBvaW50c051bWJlci5wdXNoKHYudmFsdWUpKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcGggPSBuZXcgUG9seWdvbkhlbHBlcihwb2ludHNOdW1iZXIsIGNsb3NlQW5kRmlsbCwgbW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbyk7XHJcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHBoO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnSW5zdGFuemllcnQgZWluIG5ldWVzIFBvbHlnb24uIERpZSBQdW5rdGUgd2VyZGVuIGFscyBBcnJheSB2b24gZG91YmxlLVdlcnRlbiBkZXIgRm9ybSB7eDEsIHkxLCB4MiwgeTIsIC4uLn0gw7xiZXJnZWJlbi4nLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJQb2x5Z29uXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNsb3NlQW5kRmlsbFwiLCB0eXBlOiBib29sZWFuUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJwb2ludHNcIiwgdHlwZTogbmV3IEFycmF5VHlwZShkb3VibGVQcmltaXRpdmVUeXBlKSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlLCBpc0VsbGlwc2lzOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNsb3NlQW5kRmlsbDogYm9vbGVhbiA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgcG9pbnRzOiBWYWx1ZVtdID0gcGFyYW1ldGVyc1syXS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcG9pbnRzTnVtYmVyOiBudW1iZXJbXSA9IFtdO1xyXG4gICAgICAgICAgICAgICAgcG9pbnRzLmZvckVhY2godiA9PiBwb2ludHNOdW1iZXIucHVzaCh2LnZhbHVlKSk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBoID0gbmV3IFBvbHlnb25IZWxwZXIocG9pbnRzTnVtYmVyLCBjbG9zZUFuZEZpbGwsIG1vZHVsZS5tYWluLmdldEludGVycHJldGVyKCksIG8pO1xyXG4gICAgICAgICAgICAgICAgby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSBwaDtcclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0luc3RhbnppZXJ0IGVpbiBuZXVlcyBQb2x5Z29uLiBEaWUgUHVua3RlIHdlcmRlbiBhbHMgZG91YmxlLVdlcnRlIGRlciBGb3JtIHgxLCB5MSwgeDIsIHkyLCAuLi4gw7xiZXJnZWJlbi4nLCB0cnVlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJQb2x5Z29uXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcImNsb3NlQW5kRmlsbFwiLCB0eXBlOiBib29sZWFuUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIG51bGwsXHJcbiAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNsb3NlQW5kRmlsbDogYm9vbGVhbiA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHBvaW50c051bWJlcjogbnVtYmVyW10gPSBbXTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcGggPSBuZXcgUG9seWdvbkhlbHBlcihwb2ludHNOdW1iZXIsIGNsb3NlQW5kRmlsbCwgbW9kdWxlLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKSwgbyk7XHJcbiAgICAgICAgICAgICAgICBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXSA9IHBoO1xyXG5cclxuICAgICAgICAgICAgfSwgZmFsc2UsIGZhbHNlLCAnSW5zdGFuemllcnQgZWluIG5ldWVzIFBvbHlnb24gb2huZSBQdW5rdGUuJywgdHJ1ZSkpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImFkZFBvaW50XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcInhcIiwgdHlwZTogZG91YmxlUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJ5XCIsIHR5cGU6IGRvdWJsZVByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB4OiBudW1iZXIgPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHk6IG51bWJlciA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2g6IFBvbHlnb25IZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoc2gudGVzdGRlc3Ryb3llZChcImFkZFBvaW50XCIpKSByZXR1cm47XHJcblxyXG4gICAgICAgICAgICAgICAgc2guYWRkUG9pbnQoeCwgeSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdGw7xndCBkZW0gUG9seWdvbiBlaW5lbiBQdW5rdCBoaW56dS5cIicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgIHRoaXMuYWRkTWV0aG9kKG5ldyBNZXRob2QoXCJhZGRQb2ludHNcIiwgbmV3IFBhcmFtZXRlcmxpc3QoW1xyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwicG9pbnRzXCIsIHR5cGU6IG5ldyBBcnJheVR5cGUoZG91YmxlUHJpbWl0aXZlVHlwZSksIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgIF0pLCBudWxsLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBwb2ludHM6IFZhbHVlW10gPSBwYXJhbWV0ZXJzWzFdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IHNoOiBQb2x5Z29uSGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHNoLnRlc3RkZXN0cm95ZWQoXCJhZGRQb2ludHNcIikpIHJldHVybjtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcDoge3g6IG51bWJlciwgeTogbnVtYmVyfVtdO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvcihsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoIC0gMTsgaSArPSAyKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2guYWRkUG9pbnQocG9pbnRzW2ldLnZhbHVlLCBwb2ludHNbaSsxXS52YWx1ZSwgaSA+PSBwb2ludHMubGVuZ3RoIC0yKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ0bDvGd0IGRlbSBQb2x5Z29uIG1laHJlcmUgUHVua3RlIGhpbnp1LiBEaWVzZSB3ZXJkZW4gaW4gZWluZW0gZG91YmxlW10gw7xiZXJnZWJlbiwgZGFzIGFid2VjaHNlbG5kIGRpZSB4LSB1bmQgeS1Lb29yZGluYXRlbiBlbnRow6RsdC5cIicsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwiY29weVwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIF0pLCB0aGlzLFxyXG4gICAgICAgICAgICAgICAgKHBhcmFtZXRlcnMpID0+IHtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc2g6IFBvbHlnb25IZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJBY3RvclwiXTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzaC50ZXN0ZGVzdHJveWVkKFwiY29weVwiKSkgcmV0dXJuO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNoLmdldENvcHkoPEtsYXNzPm8uY2xhc3MpO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdFcnN0ZWxsdCBlaW5lIEtvcGllIGRlcyBQb2x5Z29uLU9iamVrdHMgdW5kIGdpdCBzaWUgenVyw7xjay4nLCBmYWxzZSkpO1xyXG5cclxuICAgICBcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBQb2x5Z29uSGVscGVyIGV4dGVuZHMgRmlsbGVkU2hhcGVIZWxwZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBvaW50czogbnVtYmVyW10sIHByaXZhdGUgY2xvc2VBbmRGaWxsOiBib29sZWFuLFxyXG4gICAgICAgIGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcnVudGltZU9iamVjdDogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHN1cGVyKGludGVycHJldGVyLCBydW50aW1lT2JqZWN0KTtcclxuXHJcbiAgICAgICAgbGV0IHhTdW0gPSAwOyBsZXQgeVN1bSA9IDA7XHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbCA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBvaW50cy5sZW5ndGg7KSB7XHJcbiAgICAgICAgICAgIGxldCB4ID0gcG9pbnRzW2krK107XHJcbiAgICAgICAgICAgIGxldCB5ID0gcG9pbnRzW2krK107XHJcbiAgICAgICAgICAgIHhTdW0gKz0geDtcclxuICAgICAgICAgICAgeVN1bSArPSB5O1xyXG4gICAgICAgICAgICB0aGlzLmhpdFBvbHlnb25Jbml0aWFsLnB1c2goeyB4OiB4LCB5OiB5IH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBvaW50cy5sZW5ndGggPiAxKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2VudGVyWEluaXRpYWwgPSB4U3VtIC8gdGhpcy5oaXRQb2x5Z29uSW5pdGlhbC5sZW5ndGg7XHJcbiAgICAgICAgICAgIHRoaXMuY2VudGVyWUluaXRpYWwgPSB5U3VtIC8gdGhpcy5oaXRQb2x5Z29uSW5pdGlhbC5sZW5ndGg7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZighY2xvc2VBbmRGaWxsKXtcclxuICAgICAgICAgICAgdGhpcy5ib3JkZXJDb2xvciA9IDB4MDAwMGZmO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcclxuICAgICAgICB0aGlzLmFkZFRvRGVmYXVsdEdyb3VwKCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldENvcHkoa2xhc3M6IEtsYXNzKTogUnVudGltZU9iamVjdCB7XHJcblxyXG4gICAgICAgIGxldCBybzogUnVudGltZU9iamVjdCA9IG5ldyBSdW50aW1lT2JqZWN0KGtsYXNzKTtcclxuICAgICAgICBsZXQgcmg6IFBvbHlnb25IZWxwZXIgPSBuZXcgUG9seWdvbkhlbHBlcihbXSwgdGhpcy5jbG9zZUFuZEZpbGwsIHRoaXMud29ybGRIZWxwZXIuaW50ZXJwcmV0ZXIsIHJvKTtcclxuICAgICAgICByby5pbnRyaW5zaWNEYXRhW1wiQWN0b3JcIl0gPSByaDtcclxuXHJcbiAgICAgICAgcmguY29weUZyb20odGhpcyk7XHJcbiAgICAgICAgcmgucmVuZGVyKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBybztcclxuICAgIH1cclxuXHJcblxyXG4gICAgcmVuZGVyKCk6IHZvaWQge1xyXG5cclxuICAgICAgICBsZXQgZzogUElYSS5HcmFwaGljcyA9IDxhbnk+dGhpcy5kaXNwbGF5T2JqZWN0O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5kaXNwbGF5T2JqZWN0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgZyA9IG5ldyBQSVhJLkdyYXBoaWNzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzcGxheU9iamVjdCA9IGc7XHJcbiAgICAgICAgICAgIHRoaXMud29ybGRIZWxwZXIuc3RhZ2UuYWRkQ2hpbGQoZyk7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGcuY2xlYXIoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmZpbGxDb2xvciAhPSBudWxsICYmIHRoaXMuY2xvc2VBbmRGaWxsKSB7XHJcbiAgICAgICAgICAgIGcuYmVnaW5GaWxsKHRoaXMuZmlsbENvbG9yLCB0aGlzLmZpbGxBbHBoYSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLmJvcmRlckNvbG9yICE9IG51bGwpIHtcclxuICAgICAgICAgICAgZy5saW5lU3R5bGUodGhpcy5ib3JkZXJXaWR0aCwgdGhpcy5ib3JkZXJDb2xvciwgdGhpcy5ib3JkZXJBbHBoYSwgMC41KVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGhpcy5oaXRQb2x5Z29uSW5pdGlhbC5sZW5ndGggPiAwKXtcclxuICAgICAgICAgICAgZy5tb3ZlVG8odGhpcy5oaXRQb2x5Z29uSW5pdGlhbFswXS54LCB0aGlzLmhpdFBvbHlnb25Jbml0aWFsWzBdLnkpO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHRoaXMuaGl0UG9seWdvbkluaXRpYWwubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGcubGluZVRvKHRoaXMuaGl0UG9seWdvbkluaXRpYWxbaV0ueCwgdGhpcy5oaXRQb2x5Z29uSW5pdGlhbFtpXS55KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VBbmRGaWxsKSB7XHJcbiAgICAgICAgICAgIGcuY2xvc2VQYXRoKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5maWxsQ29sb3IgIT0gbnVsbCAmJiB0aGlzLmNsb3NlQW5kRmlsbCkge1xyXG4gICAgICAgICAgICBnLmVuZEZpbGwoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGFkZFBvaW50KHg6IG51bWJlciwgeTogbnVtYmVyLCByZW5kZXI6IGJvb2xlYW4gPSB0cnVlKSB7XHJcbiAgICAgICAgbGV0IHAgPSBuZXcgUElYSS5Qb2ludCh4LCB5KTtcclxuICAgICAgICB0aGlzLmRpc3BsYXlPYmplY3QudHJhbnNmb3JtLndvcmxkVHJhbnNmb3JtLmFwcGx5SW52ZXJzZShwLCBwKTtcclxuICAgICAgICB0aGlzLmhpdFBvbHlnb25Jbml0aWFsLnB1c2goeyB4OiBwLngsIHk6IHAueSB9KTtcclxuICAgICAgICB0aGlzLmhpdFBvbHlnb25EaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgaWYgKHJlbmRlcikgdGhpcy5yZW5kZXIoKTtcclxuICAgIH1cclxuICAgIFxyXG4gICAgc2V0UG9pbnQoeDogbnVtYmVyLCB5OiBudW1iZXIsIGluZGV4OiBudW1iZXIpIHtcclxuICAgICAgICBpZihpbmRleCA9PSAwIHx8IGluZGV4ID09IDEpe1xyXG4gICAgICAgICAgICB0aGlzLmhpdFBvbHlnb25Jbml0aWFsW2luZGV4XSA9IHt4OiB4LCB5OiB5fTtcclxuICAgICAgICAgICAgdGhpcy5oaXRQb2x5Z29uRGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBzZXRQb2ludHMoeDE6IG51bWJlciwgeTE6IG51bWJlciwgeDI6IG51bWJlciwgeTI6IG51bWJlcikge1xyXG4gICAgICAgIHRoaXMuaGl0UG9seWdvbkluaXRpYWwgPSBbe3g6IHgxLHk6IHkxfSwge3g6IHgyLHk6IHkyfV07XHJcbiAgICAgICAgdGhpcy5oaXRQb2x5Z29uRGlydHkgPSB0cnVlO1xyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuIl19