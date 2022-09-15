import { DiagramArrow } from "./DiagramArrow.js";
import { DiagramUnitCm } from "../Diagram.js";
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXJyb3dIZWFkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9kaWFncmFtcy9jbGFzc2RpYWdyYW0vQXJyb3dIZWFkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUNBLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sZUFBZSxDQUFDO0FBVTlDLE1BQU0sT0FBTyxTQUFTO0lBeUJsQixNQUFNLENBQUMsUUFBUSxDQUFDLFdBQWtCLEVBQUUsV0FBa0IsRUFBRSxJQUFZO1FBTWhFLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUN2QyxJQUFJLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFFdkMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUMsRUFBRSxHQUFDLEVBQUUsR0FBQyxFQUFFLENBQUMsQ0FBQztRQUUvQixJQUFHLENBQUMsR0FBRyxPQUFPO1lBQUUsT0FBTyxFQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFDLENBQUM7UUFFaEUsSUFBSSxFQUFFLEdBQUcsRUFBRSxHQUFDLENBQUMsQ0FBQztRQUNkLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBQyxDQUFDLENBQUM7UUFFZCxJQUFJLElBQUksR0FBVyxJQUFJLEdBQUcsV0FBVyxDQUFDLENBQUMsR0FBRyxhQUFhLEdBQUcsWUFBWSxDQUFDLE9BQU87Y0FDeEUsR0FBRyxHQUFHLFdBQVcsQ0FBQyxDQUFDLEdBQUcsYUFBYSxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUM7UUFFakUsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU5QixLQUFJLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUM7WUFDeEIsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztZQUNuQyxJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RCxJQUFJLEdBQUcsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN0RCxJQUFJLElBQUksS0FBSyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxPQUFPLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUM7WUFDaEcsRUFBRSxHQUFHLEdBQUcsQ0FBQztZQUNULEVBQUUsR0FBRyxHQUFHLENBQUM7U0FDWjtRQUVELE9BQU87WUFDSCxJQUFJLEVBQUUsSUFBSTtZQUNWLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSTtZQUNoQixNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU07U0FDdkIsQ0FBQTtJQUVMLENBQUM7O0FBM0RNLG9CQUFVLEdBQUcsRUFBRSxDQUFDO0FBQ2hCLGdCQUFNLEdBQTRCO0lBQ3JDLGFBQWEsRUFBRTtRQUNYLEtBQUssRUFBRSxDQUFDLEVBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUMsRUFBRSxFQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBQyxDQUFDO1FBQzdELE1BQU0sRUFBRSxTQUFTO1FBQ2pCLElBQUksRUFBRSxTQUFTO1FBQ2Ysa0JBQWtCLEVBQUUsU0FBUyxDQUFDLEtBQUs7S0FDdEM7SUFDRCxhQUFhLEVBQUU7UUFDWCxLQUFLLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUMsQ0FBQztRQUM3RCxNQUFNLEVBQUUsU0FBUztRQUNqQixJQUFJLEVBQUUsU0FBUztRQUNmLGtCQUFrQixFQUFFLEdBQUc7S0FDMUI7SUFDRCxhQUFhLEVBQUU7UUFDWCxLQUFLLEVBQUUsQ0FBQyxFQUFDLENBQUMsRUFBRSxFQUFFLEdBQUcsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFDLEVBQUUsRUFBQyxDQUFDLEVBQUUsR0FBRyxHQUFHLENBQUMsR0FBQyxTQUFTLENBQUMsVUFBVSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUM7WUFDcEYsRUFBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLFNBQVMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBQyxFQUFFLEVBQUMsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLEdBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFDLENBQUM7UUFDcEYsTUFBTSxFQUFFLFNBQVM7UUFDakIsSUFBSSxFQUFFLFNBQVM7UUFDZixrQkFBa0IsRUFBRSxTQUFTO0tBQ2hDO0NBQ0osQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvaW50IH0gZnJvbSBcIi4vUm91dGVyLmpzXCI7XHJcbmltcG9ydCB7IERpYWdyYW1BcnJvdyB9IGZyb20gXCIuL0RpYWdyYW1BcnJvdy5qc1wiO1xyXG5pbXBvcnQgeyBEaWFncmFtVW5pdENtIH0gZnJvbSBcIi4uL0RpYWdyYW0uanNcIjtcclxuXHJcbnR5cGUgU3RlcCA9IHtyOiBudW1iZXIsIGY6IG51bWJlcn07XHJcbnR5cGUgQXJyb3cgPSB7XHJcbiAgICBzdGVwczogU3RlcFtdLFxyXG4gICAgc3Ryb2tlOiBzdHJpbmcsXHJcbiAgICBmaWxsOiBzdHJpbmcsXHJcbiAgICBcInN0cm9rZS1kYXNoYXJyYXlcIjogc3RyaW5nXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBcnJvd0hlYWQge1xyXG5cclxuICAgIHN0YXRpYyByYXV0ZUFscGhhID0gNjA7XHJcbiAgICBzdGF0aWMgYXJyb3dzOiB7W3R5cGU6IHN0cmluZ106IEFycm93fSA9IHtcclxuICAgICAgICBcImluaGVyaXRhbmNlXCI6IHtcclxuICAgICAgICAgICAgc3RlcHM6IFt7cjogMTUwLCBmOiAwLjR9LCB7cjogMTIwLCBmOiAwLjR9LCB7cjogMTIwLCBmOiAwLjR9XSxcclxuICAgICAgICAgICAgc3Ryb2tlOiBcIiMwMDAwMDBcIixcclxuICAgICAgICAgICAgZmlsbDogXCIjZmZmZmZmXCIsXHJcbiAgICAgICAgICAgIFwic3Ryb2tlLWRhc2hhcnJheVwiOiB1bmRlZmluZWQgLy9cIjRcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgXCJyZWFsaXphdGlvblwiOiB7XHJcbiAgICAgICAgICAgIHN0ZXBzOiBbe3I6IDE1MCwgZjogMC40fSwge3I6IDEyMCwgZjogMC40fSwge3I6IDEyMCwgZjogMC40fV0sXHJcbiAgICAgICAgICAgIHN0cm9rZTogXCIjMDAwMDAwXCIsXHJcbiAgICAgICAgICAgIGZpbGw6IFwiIzgwODBmZlwiLFxyXG4gICAgICAgICAgICBcInN0cm9rZS1kYXNoYXJyYXlcIjogXCI0XCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIFwiY29tcG9zaXRpb25cIjoge1xyXG4gICAgICAgICAgICBzdGVwczogW3tyOiA5MCArIEFycm93SGVhZC5yYXV0ZUFscGhhLCBmOiAwLjN9LCB7cjogMTgwIC0gMipBcnJvd0hlYWQucmF1dGVBbHBoYSwgZjogMC4zfSxcclxuICAgICAgICAgICAgICAgICB7cjogMipBcnJvd0hlYWQucmF1dGVBbHBoYSwgZjogMC4zfSwge3I6IDE4MCAtIDIqQXJyb3dIZWFkLnJhdXRlQWxwaGEsIGY6IDAuM31dLFxyXG4gICAgICAgICAgICBzdHJva2U6IFwiIzAwMDAwMFwiLFxyXG4gICAgICAgICAgICBmaWxsOiBcIiNmZmZmZmZcIixcclxuICAgICAgICAgICAgXCJzdHJva2UtZGFzaGFycmF5XCI6IHVuZGVmaW5lZFxyXG4gICAgICAgIH0sXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIG1ha2VIZWFkKHBvc2l0aW9uMUNtOiBQb2ludCwgcG9zaXRpb24yQ206IFBvaW50LCB0eXBlOiBzdHJpbmcpOiB7XHJcbiAgICAgICAgcGF0aDogc3RyaW5nLFxyXG4gICAgICAgIHN0cm9rZTogc3RyaW5nLFxyXG4gICAgICAgIGZpbGw6IHN0cmluZyxcclxuICAgIH0ge1xyXG5cclxuICAgICAgICBsZXQgZHggPSBwb3NpdGlvbjJDbS54IC0gcG9zaXRpb24xQ20ueDtcclxuICAgICAgICBsZXQgZHkgPSBwb3NpdGlvbjJDbS55IC0gcG9zaXRpb24xQ20ueTtcclxuXHJcbiAgICAgICAgbGV0IGQgPSBNYXRoLnNxcnQoZHgqZHgrZHkqZHkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGQgPCAwLjAwMDAxKSByZXR1cm4ge3BhdGg6IFwiXCIsIHN0cm9rZTogXCJub25lXCIsIGZpbGw6IFwibm9uZVwifTtcclxuXHJcbiAgICAgICAgbGV0IGV4ID0gZHgvZDtcclxuICAgICAgICBsZXQgZXkgPSBkeS9kO1xyXG5cclxuICAgICAgICBsZXQgcGF0aDogc3RyaW5nID0gXCJNIFwiICsgcG9zaXRpb24yQ20ueCAqIERpYWdyYW1Vbml0Q20gLyBEaWFncmFtQXJyb3cuY21QZXJQeCBcclxuICAgICAgICAgICAgKyBcIiBcIiArIHBvc2l0aW9uMkNtLnkgKiBEaWFncmFtVW5pdENtIC8gRGlhZ3JhbUFycm93LmNtUGVyUHg7XHJcblxyXG4gICAgICAgIGxldCBhcnJvdyA9IHRoaXMuYXJyb3dzW3R5cGVdO1xyXG5cclxuICAgICAgICBmb3IobGV0IHN0ZXAgb2YgYXJyb3cuc3RlcHMpe1xyXG4gICAgICAgICAgICBsZXQgYW5nbGUgPSBzdGVwLnIgLyAxODAgKiBNYXRoLlBJO1xyXG4gICAgICAgICAgICBsZXQgZXgxID0gZXggKiBNYXRoLmNvcyhhbmdsZSkgLSBleSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgICAgICAgICAgbGV0IGV5MSA9IGV4ICogTWF0aC5zaW4oYW5nbGUpICsgZXkgKiBNYXRoLmNvcyhhbmdsZSk7XHJcbiAgICAgICAgICAgIHBhdGggKz0gXCIgbCBcIiArIGV4MSAqIHN0ZXAuZiAvIERpYWdyYW1BcnJvdy5jbVBlclB4ICsgXCIgXCIgKyBleTEgKiBzdGVwLmYgLyBEaWFncmFtQXJyb3cuY21QZXJQeDtcclxuICAgICAgICAgICAgZXggPSBleDE7XHJcbiAgICAgICAgICAgIGV5ID0gZXkxO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcGF0aDogcGF0aCxcclxuICAgICAgICAgICAgZmlsbDogYXJyb3cuZmlsbCxcclxuICAgICAgICAgICAgc3Ryb2tlOiBhcnJvdy5zdHJva2VcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19