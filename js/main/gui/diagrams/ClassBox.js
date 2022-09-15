import { DiagramElement, Alignment } from "./DiagramElement.js";
import { Klass, Visibility, Interface } from "../../../compiler/types/Class.js";
import { getDeclarationAsString } from "../../../compiler/types/DeclarationHelper.js";
import { hash } from "../../../tools/StringTools.js";
export class ClassBox extends DiagramElement {
    constructor(diagram, leftCm, topCm, klass) {
        super(diagram.svgElement);
        this.diagram = diagram;
        this.active = true;
        this.withMethods = true;
        this.withAttributes = true;
        this.klass = klass;
        if (klass != null) {
            this.attachToClass(this.klass);
            this.isSystemClass = klass.module.isSystemModule;
            this.withAttributes = !this.isSystemClass;
            this.withMethods = !this.isSystemClass;
        }
        this.moveTo(leftCm, topCm, true);
    }
    serialize() {
        return {
            className: this.className,
            filename: this.filename,
            hashedSignature: this.hashedSignature,
            withAttributes: this.withAttributes,
            withMethods: this.withMethods,
            isSystemClass: this.isSystemClass,
            leftCm: this.leftCm,
            topCm: this.topCm
        };
    }
    static deserialize(diagram, scb) {
        let cb = new ClassBox(diagram, scb.leftCm, scb.topCm, null);
        cb.hashedSignature = scb.hashedSignature;
        cb.className = scb.className;
        cb.filename = scb.filename;
        cb.withAttributes = scb.withAttributes;
        cb.withMethods = scb.withMethods;
        cb.isSystemClass = scb.isSystemClass;
        return cb;
    }
    attachToClass(klass) {
        this.klass = klass;
        let klassSignature = this.getSignature(klass);
        if (this.className != klass.identifier || this.hashedSignature != klassSignature || this.widthCm < 0.7) {
            this.isSystemClass = klass.module.isSystemModule;
            this.renderLines();
        }
        else {
            this.addMouseEvents();
        }
        this.className = klass.identifier;
        this.filename = klass.module.file.name;
        this.hashedSignature = klassSignature;
    }
    renderLines() {
        this.clear();
        this.addTextLine({
            type: "text",
            text: (this.klass instanceof Interface ? "<<interface>> " : "") + this.klass.identifier,
            tooltip: getDeclarationAsString(this.klass, "", true),
            alignment: Alignment.center,
            bold: true,
            italics: this.klass instanceof Interface
        });
        if (this.klass instanceof Klass && this.withAttributes) {
            this.addTextLine({
                type: "line",
                thicknessCm: 0.05
            });
            for (let a of this.klass.attributes) {
                let text = this.getVisibilityText(a.visibility) + a.identifier;
                text += ":" + a.type.identifier;
                this.addTextLine({
                    type: "text",
                    text: text,
                    tooltip: getDeclarationAsString(a),
                    alignment: Alignment.left
                });
            }
        }
        if (this.withMethods) {
            this.addTextLine({
                type: "line",
                thicknessCm: 0.05
            });
            for (let m of this.klass.methods) {
                let text = this.getVisibilityText(m.visibility) + m.identifier + "()";
                this.addTextLine({
                    type: "text",
                    text: text,
                    tooltip: getDeclarationAsString(m),
                    alignment: Alignment.left,
                    italics: this.klass instanceof Interface
                });
            }
        }
        this.render();
        let color = this.isSystemClass ? "#aaaaaa" : "#ffffff";
        this.$element.find("rect").css("fill", color);
        this.$dropdownTriangle = this.createElement("path", this.$element[0], {
            d: this.getTrianglePath(),
            class: "dropdown-triangle",
            style: "transform: " + "translate(" + (this.widthCm - 0.35) + "cm,0.05cm)",
        });
        this.addMouseEvents();
    }
    getTrianglePath() {
        if (this.withMethods) {
            return "M 3 6 L 11 6 L 7 2 L 3 6";
        }
        else {
            return "M 3 2 L 11 2 L 7 6 L 3 2";
        }
    }
    detach() {
        var _a;
        (_a = this.$element) === null || _a === void 0 ? void 0 : _a.off('mousedown.diagramElement');
        $(document).off('mouseup.diagramElement');
        $(document).off('mousemove.diagramElement');
        super.detach();
    }
    addMouseEvents() {
        let that = this;
        if (this.$dropdownTriangle != null) {
            this.$dropdownTriangle.off("mouseup.dropdowntriangle");
            this.$dropdownTriangle.off("mousedown.dropdowntriangle");
        }
        this.$dropdownTriangle.on("mousedown.dropdowntriangle", (e) => {
            e.stopPropagation();
        });
        this.$dropdownTriangle.on("mouseup.dropdowntriangle", (e) => {
            e.stopPropagation();
            this.withMethods = !this.withMethods;
            this.withAttributes = !this.withAttributes;
            this.$dropdownTriangle.attr("d", this.getTrianglePath());
            this.renderLines();
            this.diagram.adjustClassDiagramSize();
            this.diagram.updateArrows();
        });
        this.$element.on('mousedown.diagramElement', (event) => {
            if (event.button != 0)
                return;
            let x = event.screenX;
            let y = event.screenY;
            that.$element.find('rect').addClass('dragging');
            $(document).off('mouseup.diagramElement');
            $(document).off('mousemove.diagramElement');
            $(document).on('mousemove.diagramElement', (event) => {
                let cmPerPixel = 1 / 96 * 2.36 / this.diagram.zoomfactor;
                let dx = (event.screenX - x) * cmPerPixel;
                let dy = (event.screenY - y) * cmPerPixel;
                x = event.screenX;
                y = event.screenY;
                that.move(dx, dy, true);
                clearTimeout(that.inDebounce);
                that.inDebounce = setTimeout(() => {
                    let classDiagram = that.diagram;
                    classDiagram.updateArrows();
                }, 200);
            });
            $(document).on('mouseup.diagramElement', () => {
                that.move(0, 0, true, true);
                let classDiagram = that.diagram;
                classDiagram.adjustClassDiagramSize();
                classDiagram.updateArrows();
                that.$element.find('rect').removeClass('dragging');
                $(document).off('mouseup.diagramElement');
                $(document).off('mousemove.diagramElement');
                classDiagram.dirty = true;
            });
        });
    }
    getVisibilityText(visibility) {
        switch (visibility) {
            case Visibility.private: return "-";
            case Visibility.protected: return "#";
            case Visibility.public: return "+";
        }
    }
    getSignature(klass) {
        let s = "";
        if (klass instanceof Klass && this.withAttributes && klass.attributes.length > 0) {
            for (let a of klass.attributes)
                s += this.getVisibilityText(a.visibility) + a.identifier;
        }
        if (this.withMethods && klass.methods.length > 0) {
            for (let m of klass.methods) {
                if (m.isConstructor)
                    continue;
                s += this.getVisibilityText(m.visibility) + m.identifier + "()";
            }
        }
        return hash(s);
    }
    hasSignatureAndFileOf(klass) {
        return klass.module.file.name == this.filename &&
            this.getSignature(klass) == this.hashedSignature;
    }
}
//# sourceMappingURL=ClassBox.js.map