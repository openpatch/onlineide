import { Diagram, DiagramUnitCm } from "./Diagram.js";
import { ClassBox } from "./ClassBox.js";
import { Klass, Interface } from "../../../compiler/types/Class.js";
import { DiagramArrow } from "./DiagramArrow.js";
export class ClassDiagram extends Diagram {
    constructor($htmlElement, main) {
        super($htmlElement);
        this.main = main;
        this.classBoxes = {};
        this.arrows = [];
        this.currentWorkspaceId = null;
        this.version = 0;
        this.straightArrowSectionAfterRectangle = 2;
        this.distanceFromRectangles = 2;
        this.slotDistance = 2;
        this.dirty = false;
    }
    serialize() {
        let scd = {
            classBoxes: []
        };
        for (let workspaceId in this.classBoxes) {
            let classBox = this.classBoxes[workspaceId];
            for (let cb of classBox.active) {
                let cbs = cb.serialize();
                cbs.workspaceId = Number.parseInt(workspaceId);
                scd.classBoxes.push(cbs);
            }
        }
        return scd;
    }
    deserialize(serializedClassDiagram) {
        for (let cb of serializedClassDiagram.classBoxes) {
            let classBoxes = this.classBoxes[cb.workspaceId];
            if (classBoxes == null) {
                classBoxes = {
                    active: [],
                    inactive: []
                };
                this.classBoxes[cb.workspaceId] = classBoxes;
            }
            classBoxes.inactive.push(ClassBox.deserialize(this, cb));
        }
    }
    adjustClassDiagramSize() {
        let classBoxes = this.classBoxes[this.currentWorkspaceId];
        this.adjustSizeAndElements(classBoxes.active);
    }
    getClassBoxes(workspace) {
        let cb = this.classBoxes[workspace.id];
        if (cb == null) {
            cb = {
                active: [],
                inactive: []
            };
            this.classBoxes[workspace.id] = cb;
        }
        return cb;
    }
    switchToWorkspace(workspace) {
        let cbs1 = this.getClassBoxes(workspace);
        if (this.currentWorkspaceId != workspace.id) {
            if (this.currentWorkspaceId != null) {
                let cbs = this.classBoxes[this.currentWorkspaceId];
                for (let cb of cbs.active) {
                    cb.detach();
                }
                for (let cb of cbs.inactive) {
                    cb.detach();
                }
            }
            for (let cb of cbs1.active) {
                this.svgElement.appendChild(cb.$element[0]);
            }
            for (let cb of cbs1.inactive) {
                if (cb.$element != null) {
                    this.svgElement.appendChild(cb.$element[0]);
                }
            }
            this.adjustSizeAndElements(cbs1.active);
        }
        this.currentWorkspaceId = workspace.id;
        return cbs1;
    }
    drawDiagram(workspace, onlyUpdateIdentifiers) {
        var _a, _b;
        let classBoxes;
        if (workspace == null)
            return;
        classBoxes = this.switchToWorkspace(workspace);
        let moduleStore = workspace.moduleStore;
        let newClassBoxes = [];
        let anyTypelistThere = false;
        let newClassesToDraw = [];
        let usedSystemClasses = [];
        for (let module of moduleStore.getModules(false)) {
            let typeList = (_b = (_a = module) === null || _a === void 0 ? void 0 : _a.typeStore) === null || _b === void 0 ? void 0 : _b.typeList;
            if (typeList == null)
                continue;
            anyTypelistThere = true;
            typeList.filter((type) => {
                return type instanceof Klass ||
                    type instanceof Interface;
            }).forEach((klass) => {
                let cb = this.findAndEnableClass(klass, classBoxes, newClassesToDraw);
                if (cb != null)
                    newClassBoxes.push(cb);
                if (klass instanceof Klass) {
                    klass.registerUsedSystemClasses(usedSystemClasses);
                }
            });
        }
        let uscList1 = [];
        while (uscList1.length < usedSystemClasses.length) {
            uscList1 = usedSystemClasses.slice(0);
            for (let usc of uscList1) {
                if (usc instanceof Klass) {
                    usc.registerUsedSystemClasses(usedSystemClasses);
                }
            }
        }
        for (let usc of usedSystemClasses) {
            let cb = this.findAndEnableClass(usc, classBoxes, newClassesToDraw);
            if (cb != null)
                newClassBoxes.push(cb);
        }
        this.dirty = this.dirty || newClassesToDraw.length > 0;
        for (let klass of newClassesToDraw) {
            let cb = new ClassBox(this, Math.random() * 10 * DiagramUnitCm, Math.random() * 10 * DiagramUnitCm, klass);
            cb.renderLines();
            let freePos = this.findFreeSpace(newClassBoxes, cb.widthCm, cb.heightCm, this.marginCm);
            cb.moveTo(freePos.x, freePos.y, true);
            newClassBoxes.push(cb);
        }
        if (newClassesToDraw.length > 0) {
            this.adjustSizeAndElements(newClassBoxes);
        }
        if (!anyTypelistThere)
            return;
        for (let cb of classBoxes.active) {
            cb.hide();
            cb.active = false;
            classBoxes.inactive.push(cb);
        }
        classBoxes.active = newClassBoxes;
        if (!onlyUpdateIdentifiers) {
            this.adjustClassDiagramSize();
            this.updateArrows();
        }
    }
    updateArrows() {
        let routingInput = this.drawArrows();
        this.version++;
        routingInput.version = this.version;
        let routingWorker = new Worker('js/main/gui/diagrams/Router.js');
        let that = this;
        routingWorker.onmessage = function (e) {
            // when worker finished:
            let ro = e.data;
            if (ro.version == that.version) {
                $('#classdiagram-spinner').hide();
                that.arrows.forEach((arrow) => { arrow.remove(); });
                ro.arrows.forEach((arrow) => {
                    let da = new DiagramArrow(that.svgElement, arrow);
                    da.render();
                    that.arrows.push(da);
                });
            }
        };
        routingWorker.postMessage(routingInput); // start worker!
        $('#classdiagram-spinner').show();
    }
    drawArrows() {
        let routingInput = {
            rectangles: [],
            arrows: [],
            xMax: Math.ceil(this.widthCm / DiagramUnitCm),
            yMax: Math.ceil(this.heightCm / DiagramUnitCm),
            straightArrowSectionAfterRectangle: this.straightArrowSectionAfterRectangle,
            distanceFromRectangles: this.distanceFromRectangles,
            slotDistance: this.slotDistance
        };
        let classBoxes = this.classBoxes[this.currentWorkspaceId];
        classBoxes.active.forEach((cb) => {
            routingInput.rectangles.push(cb.getRoutingRectangle());
        });
        classBoxes.active.forEach((cb) => {
            if (cb.klass instanceof Klass) {
                if (cb.klass.baseClass != null) {
                    let cb1 = this.findClassbox(cb.klass.baseClass, classBoxes.active);
                    if (cb1 != null) {
                        this.drawArrwow(cb, cb1, "inheritance", routingInput);
                    }
                }
                for (let intf of cb.klass.implements) {
                    let cb1 = this.findClassbox(intf, classBoxes.active);
                    if (cb1 != null) {
                        this.drawArrwow(cb, cb1, "realization", routingInput);
                    }
                }
                for (let cd of cb.klass.getCompositeData()) {
                    let cb1 = this.findClassbox(cd.klass, classBoxes.active);
                    if (cb1 != null) {
                        this.drawArrwow(cb1, cb, "composition", routingInput);
                    }
                }
            }
        });
        return routingInput;
    }
    drawArrwow(cb1, cb2, arrowType, routingInput) {
        let rect1 = cb1.getRoutingRectangle();
        let rect2 = cb2.getRoutingRectangle();
        let classBoxes = this.classBoxes[this.currentWorkspaceId];
        routingInput.arrows.push({
            arrowType: arrowType,
            destRectangleIndex: classBoxes.active.indexOf(cb2),
            sourceRectangleIndex: classBoxes.active.indexOf(cb1),
            destinationIdentifier: cb2.className,
            identifier: cb1.className + "(extends)" + cb2.className
        });
    }
    findClassbox(klass, classBoxes) {
        for (let cb of classBoxes) {
            if (cb.klass == klass)
                return cb;
        }
        return null;
    }
    findAndEnableClass(klass, classBoxes, newClassesToDraw) {
        let i = 0;
        while (i < classBoxes.active.length) {
            let k = classBoxes.active[i];
            if (k.className == klass.identifier || k.hasSignatureAndFileOf(klass)) {
                k.attachToClass(klass);
                classBoxes.active.splice(i, 1);
                return k;
            }
            i++;
        }
        i = 0;
        while (i < classBoxes.inactive.length) {
            let k = classBoxes.inactive[i];
            if (k.className == klass.identifier || k.hasSignatureAndFileOf(klass)) {
                classBoxes.inactive.splice(i, 1);
                k.klass = klass;
                k.renderLines();
                k.show();
                k.active = true;
                this.dirty = true;
                return k;
            }
            i++;
        }
        newClassesToDraw.push(klass);
        return null;
    }
    clear() {
        let cb = this.classBoxes[this.currentWorkspaceId];
        if (cb != null) {
            for (let c of cb.active) {
                c.detach();
            }
        }
    }
}
//# sourceMappingURL=ClassDiagram.js.map