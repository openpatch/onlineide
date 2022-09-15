import { DiagramUnitCm } from "./Diagram.js";
export var Alignment;
(function (Alignment) {
    Alignment[Alignment["left"] = 0] = "left";
    Alignment[Alignment["center"] = 1] = "center";
    Alignment[Alignment["right"] = 2] = "right";
})(Alignment || (Alignment = {}));
export class DiagramElement {
    constructor(parent) {
        this.parent = parent;
        this.xCm = 0; // x-Koordinate in cm
        this.yCm = 0; // y-Koordinate in cm
        this.lines = [];
    }
    getRasterBoundingBox() {
        return {
            x: this.xCm / DiagramUnitCm,
            y: this.yCm / DiagramUnitCm,
            width: this.widthCm / DiagramUnitCm,
            height: this.heightCm / DiagramUnitCm
        };
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
    appendTo($element) {
        $element.append(this.$element);
    }
    clear() {
        if (this.$element == null)
            return;
        this.$element.empty();
        this.lines = [];
    }
    move(xCm, yCm, withRaster) {
        this.xCm += xCm;
        this.yCm += yCm;
        let x = this.xCm;
        let y = this.yCm;
        if (withRaster) {
            x = Math.round(x / DiagramUnitCm) * DiagramUnitCm;
            y = Math.round(y / DiagramUnitCm) * DiagramUnitCm;
        }
        $(this.$element).css("transform", "translate(" + x + "cm," + y + "cm)");
    }
    moveTo(xCm, yCm, withRaster) {
        this.move(xCm - this.xCm, yCm - this.yCm, withRaster);
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
            height: bbox.height * DiagramElement.cmPerPx,
            width: bbox.width * DiagramElement.cmPerPx
        };
    }
    addTextLine(line) {
        this.lines.push(line);
        if (line.type == "text") {
            if (line.alignment == null)
                line.alignment = Alignment.left;
            if (line.bold == null)
                line.bold = false;
            if (line.italics == null)
                line.italics = false;
        }
    }
    render() {
        let $group = this.$element;
        if ($group == null) {
            $group = this.createElement("g", this.parent);
            $group.addClass("svg_draggable");
            $group.addClass("svg_all_pointer_events");
            this.$element = $group;
        }
        let $rect = this.createElement("rect", $group[0]);
        let textPosYCm = 0.1;
        let maxWidthCm = 0;
        let first = true;
        for (let line of this.lines) {
            if (line.type == "text") {
                if (first)
                    textPosYCm += 0.1;
                first = false;
                line.yCm = textPosYCm;
                line.$element = this.createTextElement(line.text, $group[0], {
                    "font-weight": line.bold ? "bold" : "normal",
                    "font-size": "12pt",
                    "font-style": line.italics ? "italic" : "normal",
                    "text-anchor": line.alignment == Alignment.left ? "start" : line.alignment == Alignment.center ? "middle" : "end"
                });
                line.$element.css("transform", "translate(0cm," + textPosYCm + "cm)");
                let metrics = this.getTextMetrics(line.$element);
                line.textHeightCm = metrics.height;
                line.textWidthCm = metrics.width;
                maxWidthCm = Math.max(maxWidthCm, line.textWidthCm);
                textPosYCm += line.textHeightCm;
            }
            else {
                line.yCm = textPosYCm + line.thicknessCm / 2;
                textPosYCm += line.thicknessCm;
                first = true;
            }
        }
        let width = 2 * 0.05 + 2 * 0.2 + maxWidthCm;
        this.widthCm = (Math.trunc(width / DiagramUnitCm) + 1) * DiagramUnitCm;
        this.heightCm = (Math.trunc(textPosYCm / DiagramUnitCm) + 1) * DiagramUnitCm;
        let textLeft = 0.05 + 0.2;
        let textCenter = width / 2;
        let textRight = width - textLeft;
        $rect.css({
            width: this.widthCm + "cm",
            height: this.heightCm + "cm",
            fill: "#fff",
            stroke: "#000",
            "stroke-width": "0.05cm"
        });
        for (let line of this.lines) {
            if (line.type == "text") {
                let x;
                switch (line.alignment) {
                    case Alignment.center:
                        x = textCenter;
                        break;
                    case Alignment.left:
                        x = textLeft;
                        break;
                    case Alignment.right:
                        x = textRight;
                        break;
                }
                line.$element.css("transform", "translate(" + x + "cm," + line.yCm + "cm)");
            }
            else {
                line.$element = this.createElement("line", $group[0], {
                    x1: "0",
                    y1: line.yCm + "cm",
                    x2: this.widthCm + "cm",
                    y2: line.yCm + "cm"
                });
                line.$element.css({
                    stroke: "#000",
                    "stroke-width": line.thicknessCm + "cm"
                });
            }
        }
    }
}
DiagramElement.cmPerPx = 2.54 / 96;
//# sourceMappingURL=DiagramElement copy.js.map