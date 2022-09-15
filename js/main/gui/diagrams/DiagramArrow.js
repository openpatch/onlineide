import { DiagramUnitCm } from "./Diagram.js";
import { ArrowHead } from "./ArrowHead.js";
export class DiagramArrow {
    constructor(parent, routingArrow) {
        this.parent = parent;
        this.routingArrow = routingArrow;
    }
    show() {
        if (this.$element == null)
            return;
        this.$element.show();
    }
    hide() {
        if (this.$element == null)
            return;
        this.$element.hide();
    }
    detach() {
        if (this.$element == null)
            return;
        this.$element.detach();
    }
    remove() {
        if (this.$element == null)
            return;
        this.$element.remove();
    }
    appendTo($element) {
        $element.append(this.$element);
    }
    clear() {
        if (this.$element == null)
            return;
        this.$element.empty();
    }
    createElement(name, parent = null, attributes) {
        let ns = 'http://www.w3.org/2000/svg';
        let $element = $(document.createElementNS(ns, name));
        if (attributes != null)
            $element.attr(attributes);
        if (parent != null)
            parent.appendChild($element[0]);
        return $element;
    }
    createTextElement(text, parent = null, attributes) {
        let $element = this.createElement("text", parent, {
            font: "16px Roboto",
            "font-family": "sans-serif",
            fill: "#000",
            "alignment-baseline": "hanging"
        });
        if (attributes != null)
            $element.attr(attributes);
        $element.text(text);
        return $element;
    }
    getTextMetrics(textElement) {
        let bbox = textElement[0].getBBox();
        return {
            height: bbox.height * DiagramArrow.cmPerPx,
            width: bbox.width * DiagramArrow.cmPerPx
        };
    }
    render() {
        let $group = this.$element;
        if ($group == null) {
            $group = this.createElement("g", this.parent);
            this.$element = $group;
        }
        else {
            $group.empty();
        }
        let points = this.routingArrow.minimalPoints;
        if (points == null || points.length < 2) {
            return;
        }
        let path = "M " + this.getPathCoordinates(points[0]);
        for (let i = 1; i < points.length; i++) {
            path += " L " + this.getPathCoordinates(points[i]);
        }
        let arrowData = ArrowHead.arrows[this.routingArrow.arrowType];
        let $path = this.createElement("path", $group[0], { d: path });
        $path.css({
            stroke: "#000000",
            "stroke-width": "0.2 cm",
            "fill": "none",
            "stroke-dasharray": arrowData["stroke-dasharray"]
        });
        while (points.length > 1 && points[points.length - 1].x == points[points.length - 2].x &&
            points[points.length - 1].y == points[points.length - 2].y) {
            points.pop();
        }
        if (points.length > 1 && this.routingArrow.endsOnArrowWithIdentifier == null) {
            let head = ArrowHead.makeHead(points[points.length - 2], points[points.length - 1], this.routingArrow.arrowType);
            let $head = this.createElement("path", $group[0], { d: head.path });
            $head.css({
                stroke: head.stroke,
                "stroke-width": "0.2 cm",
                "fill": head.fill
            });
        }
    }
    getPathCoordinates(point) {
        let x = point.x * DiagramUnitCm / DiagramArrow.cmPerPx;
        let y = point.y * DiagramUnitCm / DiagramArrow.cmPerPx;
        return "" + x + " " + y;
    }
}
DiagramArrow.cmPerPx = 2.54 / 96;
//# sourceMappingURL=DiagramArrow.js.map