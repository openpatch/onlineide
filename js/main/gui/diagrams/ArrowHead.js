import { DiagramArrow } from "./DiagramArrow.js";
import { DiagramUnitCm } from "./Diagram.js";
export class ArrowHead {
    static makeHead(position1Cm, position2Cm, type) {
        let dx = position2Cm.x - position1Cm.x;
        let dy = position2Cm.y - position1Cm.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d < 0.00001)
            return { path: "", stroke: "none", fill: "none" };
        let ex = dx / d;
        let ey = dy / d;
        let path = "M " + position2Cm.x * DiagramUnitCm / DiagramArrow.cmPerPx
            + " " + position2Cm.y * DiagramUnitCm / DiagramArrow.cmPerPx;
        let arrow = this.arrows[type];
        for (let step of arrow.steps) {
            let angle = step.r / 180 * Math.PI;
            let ex1 = ex * Math.cos(angle) - ey * Math.sin(angle);
            let ey1 = ex * Math.sin(angle) + ey * Math.cos(angle);
            path += " l " + ex1 * step.f / DiagramArrow.cmPerPx + " " + ey1 * step.f / DiagramArrow.cmPerPx;
            ex = ex1;
            ey = ey1;
        }
        return {
            path: path,
            fill: arrow.fill,
            stroke: arrow.stroke
        };
    }
}
ArrowHead.rauteAlpha = 60;
ArrowHead.arrows = {
    "inheritance": {
        steps: [{ r: 150, f: 0.4 }, { r: 120, f: 0.4 }, { r: 120, f: 0.4 }],
        stroke: "#000000",
        fill: "#ffffff",
        "stroke-dasharray": undefined //"4"
    },
    "realization": {
        steps: [{ r: 150, f: 0.4 }, { r: 120, f: 0.4 }, { r: 120, f: 0.4 }],
        stroke: "#000000",
        fill: "#8080ff",
        "stroke-dasharray": "4"
    },
    "composition": {
        steps: [{ r: 90 + ArrowHead.rauteAlpha, f: 0.3 }, { r: 180 - 2 * ArrowHead.rauteAlpha, f: 0.3 },
            { r: 2 * ArrowHead.rauteAlpha, f: 0.3 }, { r: 180 - 2 * ArrowHead.rauteAlpha, f: 0.3 }],
        stroke: "#000000",
        fill: "#ffffff",
        "stroke-dasharray": undefined
    },
};
//# sourceMappingURL=ArrowHead.js.map