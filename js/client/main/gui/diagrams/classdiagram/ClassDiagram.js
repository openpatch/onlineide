import { Interface, Klass } from "../../../../compiler/types/Class.js";
import { Diagram, DiagramUnitCm } from "../Diagram.js";
import { ClassBox } from "./ClassBox.js";
import { DiagramArrow } from "./DiagramArrow.js";
import { openContextMenu } from "../../../../tools/HtmlTools.js";
export class ClassDiagram extends Diagram {
    constructor($htmlElement, main) {
        super($htmlElement, main);
        this.$htmlElement = $htmlElement;
        this.classBoxesRepository = {};
        this.arrows = [];
        this.currentWorkspaceId = null;
        this.version = 0;
        this.straightArrowSectionAfterRectangle = 2;
        this.distanceFromRectangles = 2;
        this.slotDistance = 2;
        this.dirty = false;
        let that = this;
        this.$menuButton.on('click', (ev) => {
            ev.preventDefault();
            let displaysSystemClasses = that.currentClassBoxes.displaySystemClasses == true;
            let parametersWithTypes = that.currentClassBoxes.parametersWithTypes == true;
            openContextMenu([
                {
                    caption: displaysSystemClasses ? "Systemklassen ausblenden" : "Systemklassen einblenden",
                    callback: () => {
                        that.currentClassBoxes.displaySystemClasses = !displaysSystemClasses;
                        that.drawDiagram(that.currentWorkspace, false);
                    }
                },
                {
                    caption: parametersWithTypes ? "Parameter ausblenden" : "Parameter einblenden",
                    callback: () => {
                        that.currentClassBoxes.parametersWithTypes = !parametersWithTypes;
                        that.currentClassBoxes.active.forEach((cb) => { cb.hashedSignature = -1; });
                        that.drawDiagram(that.currentWorkspace, false);
                    }
                },
            ], ev.pageX + 2, ev.pageY + 2);
            ev.stopPropagation();
        });
    }
    clearAfterLogout() {
        this.classBoxesRepository = {};
        this.arrows.forEach((arrow) => { arrow.remove(); });
        $(this.svgElement).empty();
    }
    serialize() {
        if (this.currentClassBoxes == null)
            return;
        let scd = {
            classBoxes: [],
            displaySystemClasses: this.currentClassBoxes.displaySystemClasses,
            parametersWithTypes: this.currentClassBoxes.parametersWithTypes
        };
        for (let workspaceId in this.classBoxesRepository) {
            let classBox = this.classBoxesRepository[workspaceId];
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
            let classBoxes = this.classBoxesRepository[cb.workspaceId];
            if (classBoxes == null) {
                classBoxes = {
                    active: [],
                    inactive: [],
                    displaySystemClasses: false,
                    parametersWithTypes: false
                };
                this.classBoxesRepository[cb.workspaceId] = classBoxes;
            }
            classBoxes.inactive.push(ClassBox.deserialize(this, cb));
            classBoxes.displaySystemClasses = serializedClassDiagram.displaySystemClasses;
            classBoxes.parametersWithTypes = serializedClassDiagram.parametersWithTypes;
        }
    }
    adjustClassDiagramSize() {
        let classBoxes = this.classBoxesRepository[this.currentWorkspaceId];
        this.adjustSizeAndElements(classBoxes.active);
    }
    getClassBoxes(workspace) {
        let cb = this.classBoxesRepository[workspace.id];
        if (cb == null) {
            cb = {
                active: [],
                inactive: [],
                displaySystemClasses: false,
                parametersWithTypes: false
            };
            this.classBoxesRepository[workspace.id] = cb;
        }
        return cb;
    }
    switchToWorkspace(workspace) {
        let cbs1 = this.getClassBoxes(workspace);
        if (this.currentWorkspaceId != workspace.id) {
            if (this.currentWorkspaceId != null) {
                let cbs = this.classBoxesRepository[this.currentWorkspaceId];
                if (cbs != null) {
                    for (let cb of cbs.active) {
                        cb.detach();
                    }
                    for (let cb of cbs.inactive) {
                        cb.detach();
                    }
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
        var _a;
        if (workspace == null)
            return;
        this.currentWorkspace = workspace;
        this.currentClassBoxes = this.switchToWorkspace(workspace);
        let moduleStore = workspace.moduleStore;
        let newClassBoxes = [];
        let anyTypelistThere = false;
        let newClassesToDraw = [];
        let usedSystemClasses = [];
        for (let module of moduleStore.getModules(false)) {
            let typeList = (_a = module === null || module === void 0 ? void 0 : module.typeStore) === null || _a === void 0 ? void 0 : _a.typeList;
            if (typeList == null)
                continue;
            anyTypelistThere = true;
            typeList.filter((type) => {
                return type instanceof Klass ||
                    type instanceof Interface;
            }).forEach((klass) => {
                let cb = this.findAndEnableClass(klass, this.currentClassBoxes, newClassesToDraw);
                if (cb != null)
                    newClassBoxes.push(cb);
                if (klass instanceof Klass) {
                    klass.registerUsedSystemClasses(usedSystemClasses);
                }
            });
        }
        // recursively register system classes that are used by other system classes
        let uscList1 = [];
        while (uscList1.length < usedSystemClasses.length) {
            uscList1 = usedSystemClasses.slice(0);
            for (let usc of uscList1) {
                if (usc instanceof Klass) {
                    usc.registerUsedSystemClasses(usedSystemClasses);
                }
            }
        }
        if (this.currentClassBoxes.displaySystemClasses) {
            for (let usc of usedSystemClasses) {
                let cb = this.findAndEnableClass(usc, this.currentClassBoxes, newClassesToDraw);
                if (cb != null)
                    newClassBoxes.push(cb);
            }
        }
        this.dirty = this.dirty || newClassesToDraw.length > 0;
        for (let klass of newClassesToDraw) {
            let cb = new ClassBox(this, Math.random() * 10 * DiagramUnitCm, Math.random() * 10 * DiagramUnitCm, klass);
            cb.renderLines();
            let freePos = this.findFreeSpace(newClassBoxes, cb.widthCm, cb.heightCm, this.minDistance);
            cb.moveTo(freePos.x, freePos.y, true);
            newClassBoxes.push(cb);
        }
        if (newClassesToDraw.length > 0) {
            this.adjustSizeAndElements(newClassBoxes);
        }
        if (!anyTypelistThere)
            return;
        for (let cb of this.currentClassBoxes.active) {
            cb.hide();
            cb.active = false;
            this.currentClassBoxes.inactive.push(cb);
        }
        this.currentClassBoxes.active = newClassBoxes;
        if (!onlyUpdateIdentifiers) {
            this.adjustClassDiagramSize();
            this.updateArrows();
        }
    }
    updateArrows() {
        this.$htmlElement.find('.jo_classdiagram-spinner').hide();
        // return;
        let colors = ["#0075dc", "#993f00", "#005c31", "#ff5005", "#2bce48",
            "#0000ff", "#ffa405", '#ffa8bb', '#740aff', '#990000', '#ff0000'];
        let colorIndex = 0;
        let routingInput = this.drawArrows();
        this.version++;
        routingInput.version = this.version;
        if (this.routingWorker != null) {
            this.routingWorker.terminate();
        }
        this.routingWorker = new Worker('js/main/gui/diagrams/classdiagram/Router.js');
        let that = this;
        this.routingWorker.onmessage = function (e) {
            // when worker finished:
            let ro = e.data;
            if (ro.version == that.version) {
                that.$htmlElement.find('.jo_classdiagram-spinner').hide();
                that.arrows.forEach((arrow) => { arrow.remove(); });
                let arrowIdentifierToColorMap = {};
                let arrowsWithoutColor = ro.arrows.length + 1;
                let arrowsWithoutColorLast;
                do {
                    arrowsWithoutColorLast = arrowsWithoutColor;
                    arrowsWithoutColor = 0;
                    ro.arrows.forEach((arrow) => {
                        if (arrow.color == null) {
                            arrowsWithoutColor++;
                            if (arrow.endsOnArrowWithIdentifier == null) {
                                arrow.color = colors[colorIndex];
                                arrowIdentifierToColorMap[arrow.identifier] = arrow.color;
                                colorIndex++;
                                if (colorIndex > colors.length - 1)
                                    colorIndex = 0;
                            }
                            else {
                                arrow.color = arrowIdentifierToColorMap[arrow.endsOnArrowWithIdentifier];
                            }
                        }
                    });
                } while (arrowsWithoutColor < arrowsWithoutColorLast);
                ro.arrows.forEach((arrow) => {
                    if (arrow.color == null) {
                        arrow.color = "#ff0000";
                    }
                });
                ro.arrows.forEach((arrow) => {
                    let da = new DiagramArrow(that.svgElement, arrow, arrow.color);
                    da.render();
                    that.arrows.push(da);
                });
            }
        };
        this.routingWorker.postMessage(routingInput); // start worker!
        this.$htmlElement.find('.jo_classdiagram-spinner').show();
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
        let classBoxes = this.classBoxesRepository[this.currentWorkspaceId];
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
        let classBoxes = this.classBoxesRepository[this.currentWorkspaceId];
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
        let cb = this.classBoxesRepository[this.currentWorkspaceId];
        if (cb != null) {
            for (let c of cb.active) {
                c.detach();
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2xhc3NEaWFncmFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9kaWFncmFtcy9jbGFzc2RpYWdyYW0vQ2xhc3NEaWFncmFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLE1BQU0scUNBQXFDLENBQUM7QUFHdkUsT0FBTyxFQUFFLE9BQU8sRUFBRSxhQUFhLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDdkQsT0FBTyxFQUFFLFFBQVEsRUFBc0IsTUFBTSxlQUFlLENBQUM7QUFDN0QsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBR2pELE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxnQ0FBZ0MsQ0FBQztBQWdCakUsTUFBTSxPQUFPLFlBQWEsU0FBUSxPQUFPO0lBbUJyQyxZQUFvQixZQUFpQyxFQUFFLElBQWM7UUFDakUsS0FBSyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQztRQURWLGlCQUFZLEdBQVosWUFBWSxDQUFxQjtRQWpCckQseUJBQW9CLEdBQTBDLEVBQUUsQ0FBQztRQUVqRSxXQUFNLEdBQW1CLEVBQUUsQ0FBQztRQUU1Qix1QkFBa0IsR0FBVyxJQUFJLENBQUM7UUFJbEMsWUFBTyxHQUFXLENBQUMsQ0FBQztRQUVwQix1Q0FBa0MsR0FBRyxDQUFDLENBQUM7UUFDdkMsMkJBQXNCLEdBQUcsQ0FBQyxDQUFDO1FBQzNCLGlCQUFZLEdBQUcsQ0FBQyxDQUFDO1FBRWpCLFVBQUssR0FBWSxLQUFLLENBQUM7UUFNbkIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFO1lBQ2hDLEVBQUUsQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUNwQixJQUFJLHFCQUFxQixHQUFH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Li8uLi8uLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vLi4vLi4vLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uLy4uLy4uL01haW4uanNcIjtcclxuaW1wb3J0IHsgRGlhZ3JhbSwgRGlhZ3JhbVVuaXRDbSB9IGZyb20gXCIuLi9EaWFncmFtLmpzXCI7XHJcbmltcG9ydCB7IENsYXNzQm94LCBTZXJpYWxpemVkQ2xhc3NCb3ggfSBmcm9tIFwiLi9DbGFzc0JveC5qc1wiO1xyXG5pbXBvcnQgeyBEaWFncmFtQXJyb3cgfSBmcm9tIFwiLi9EaWFncmFtQXJyb3cuanNcIjtcclxuaW1wb3J0IHsgUm91dGluZ0lucHV0LCBSb3V0aW5nT3V0cHV0IH0gZnJvbSBcIi4vUm91dGVyLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uLy4uLy4uL01haW5CYXNlLmpzXCI7XHJcbmltcG9ydCB7IG9wZW5Db250ZXh0TWVudSB9IGZyb20gXCIuLi8uLi8uLi8uLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgVGVhY2hlcnNXaXRoQ2xhc3Nlc01JIH0gZnJvbSBcIi4uLy4uLy4uLy4uL2FkbWluaXN0cmF0aW9uL1RlYWNoZXJzV2l0aENsYXNzZXMuanNcIjtcclxuXHJcbnR5cGUgQ2xhc3NCb3hlcyA9IHtcclxuICAgIGFjdGl2ZTogQ2xhc3NCb3hbXSxcclxuICAgIGluYWN0aXZlOiBDbGFzc0JveFtdLFxyXG4gICAgZGlzcGxheVN5c3RlbUNsYXNzZXM6IGJvb2xlYW4sXHJcbiAgICBwYXJhbWV0ZXJzV2l0aFR5cGVzOiBib29sZWFuXHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBTZXJpYWxpemVkQ2xhc3NEaWFncmFtID0ge1xyXG4gICAgY2xhc3NCb3hlczogU2VyaWFsaXplZENsYXNzQm94W10sXHJcbiAgICBkaXNwbGF5U3lzdGVtQ2xhc3NlczogYm9vbGVhbixcclxuICAgIHBhcmFtZXRlcnNXaXRoVHlwZXM6IGJvb2xlYW5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENsYXNzRGlhZ3JhbSBleHRlbmRzIERpYWdyYW0ge1xyXG5cclxuICAgIGNsYXNzQm94ZXNSZXBvc2l0b3J5OiB7IFt3b3Jrc3BhY2VJZDogbnVtYmVyXTogQ2xhc3NCb3hlcyB9ID0ge307XHJcblxyXG4gICAgYXJyb3dzOiBEaWFncmFtQXJyb3dbXSA9IFtdO1xyXG5cclxuICAgIGN1cnJlbnRXb3Jrc3BhY2VJZDogbnVtYmVyID0gbnVsbDtcclxuICAgIGN1cnJlbnRXb3Jrc3BhY2U6IFdvcmtzcGFjZTtcclxuICAgIGN1cnJlbnRDbGFzc0JveGVzOiBDbGFzc0JveGVzO1xyXG5cclxuICAgIHZlcnNpb246IG51bWJlciA9IDA7XHJcblxyXG4gICAgc3RyYWlnaHRBcnJvd1NlY3Rpb25BZnRlclJlY3RhbmdsZSA9IDI7XHJcbiAgICBkaXN0YW5jZUZyb21SZWN0YW5nbGVzID0gMjtcclxuICAgIHNsb3REaXN0YW5jZSA9IDI7XHJcblxyXG4gICAgZGlydHk6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHJvdXRpbmdXb3JrZXI6IFdvcmtlcjtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlICRodG1sRWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50PiwgbWFpbjogTWFpbkJhc2UpIHtcclxuICAgICAgICBzdXBlcigkaHRtbEVsZW1lbnQsIG1haW4pO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy4kbWVudUJ1dHRvbi5vbignY2xpY2snLCAoZXYpID0+IHtcclxuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgbGV0IGRpc3BsYXlzU3lzdGVtQ2xhc3NlcyA9IHRoYXQuY3VycmVudENsYXNzQm94ZXMuZGlzcGxheVN5c3RlbUNsYXNzZXMgPT0gdHJ1ZTtcclxuICAgICAgICAgICAgbGV0IHBhcmFtZXRlcnNXaXRoVHlwZXMgPSB0aGF0LmN1cnJlbnRDbGFzc0JveGVzLnBhcmFtZXRlcnNXaXRoVHlwZXMgPT0gdHJ1ZTtcclxuICAgICAgICAgICAgb3BlbkNvbnRleHRNZW51KFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBkaXNwbGF5c1N5c3RlbUNsYXNzZXMgPyBcIlN5c3RlbWtsYXNzZW4gYXVzYmxlbmRlblwiIDogXCJTeXN0ZW1rbGFzc2VuIGVpbmJsZW5kZW5cIixcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRDbGFzc0JveGVzLmRpc3BsYXlTeXN0ZW1DbGFzc2VzID0gIWRpc3BsYXlzU3lzdGVtQ2xhc3NlcztcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kcmF3RGlhZ3JhbSh0aGF0LmN1cnJlbnRXb3Jrc3BhY2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246IHBhcmFtZXRlcnNXaXRoVHlwZXMgPyBcIlBhcmFtZXRlciBhdXNibGVuZGVuXCIgOiBcIlBhcmFtZXRlciBlaW5ibGVuZGVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50Q2xhc3NCb3hlcy5wYXJhbWV0ZXJzV2l0aFR5cGVzID0gIXBhcmFtZXRlcnNXaXRoVHlwZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuY3VycmVudENsYXNzQm94ZXMuYWN0aXZlLmZvckVhY2goKGNiKSA9PiB7Y2IuaGFzaGVkU2lnbmF0dXJlID0gLTF9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kcmF3RGlhZ3JhbSh0aGF0LmN1cnJlbnRXb3Jrc3BhY2UsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdLCBldi5wYWdlWCArIDIsIGV2LnBhZ2VZICsgMik7XHJcbiAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyQWZ0ZXJMb2dvdXQoKSB7XHJcbiAgICAgICAgdGhpcy5jbGFzc0JveGVzUmVwb3NpdG9yeSA9IHt9O1xyXG4gICAgICAgIHRoaXMuYXJyb3dzLmZvckVhY2goKGFycm93KSA9PiB7IGFycm93LnJlbW92ZSgpOyB9KTtcclxuICAgICAgICAkKHRoaXMuc3ZnRWxlbWVudCkuZW1wdHkoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXJpYWxpemUoKTogU2VyaWFsaXplZENsYXNzRGlhZ3JhbSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMuY3VycmVudENsYXNzQm94ZXMgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgc2NkOiBTZXJpYWxpemVkQ2xhc3NEaWFncmFtID0ge1xyXG4gICAgICAgICAgICBjbGFzc0JveGVzOiBbXSxcclxuICAgICAgICAgICAgZGlzcGxheVN5c3RlbUNsYXNzZXM6IHRoaXMuY3VycmVudENsYXNzQm94ZXMuZGlzcGxheVN5c3RlbUNsYXNzZXMsXHJcbiAgICAgICAgICAgIHBhcmFtZXRlcnNXaXRoVHlwZXM6IHRoaXMuY3VycmVudENsYXNzQm94ZXMucGFyYW1ldGVyc1dpdGhUeXBlc1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQgd29ya3NwYWNlSWQgaW4gdGhpcy5jbGFzc0JveGVzUmVwb3NpdG9yeSkge1xyXG4gICAgICAgICAgICBsZXQgY2xhc3NCb3ggPSB0aGlzLmNsYXNzQm94ZXNSZXBvc2l0b3J5W3dvcmtzcGFjZUlkXTtcclxuICAgICAgICAgICAgZm9yIChsZXQgY2Igb2YgY2xhc3NCb3guYWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY2JzID0gY2Iuc2VyaWFsaXplKCk7XHJcbiAgICAgICAgICAgICAgICBjYnMud29ya3NwYWNlSWQgPSBOdW1iZXIucGFyc2VJbnQod29ya3NwYWNlSWQpO1xyXG4gICAgICAgICAgICAgICAgc2NkLmNsYXNzQm94ZXMucHVzaChjYnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gc2NkO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBkZXNlcmlhbGl6ZShzZXJpYWxpemVkQ2xhc3NEaWFncmFtOiBTZXJpYWxpemVkQ2xhc3NEaWFncmFtKSB7XHJcbiAgICAgICAgZm9yIChsZXQgY2Igb2Ygc2VyaWFsaXplZENsYXNzRGlhZ3JhbS5jbGFzc0JveGVzKSB7XHJcbiAgICAgICAgICAgIGxldCBjbGFzc0JveGVzOiBDbGFzc0JveGVzID0gdGhpcy5jbGFzc0JveGVzUmVwb3NpdG9yeVtjYi53b3Jrc3BhY2VJZF07XHJcbiAgICAgICAgICAgIGlmIChjbGFzc0JveGVzID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNsYXNzQm94ZXMgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYWN0aXZlOiBbXSxcclxuICAgICAgICAgICAgICAgICAgICBpbmFjdGl2ZTogW10sXHJcbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheVN5c3RlbUNsYXNzZXM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNXaXRoVHlwZXM6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsYXNzQm94ZXNSZXBvc2l0b3J5W2NiLndvcmtzcGFjZUlkXSA9IGNsYXNzQm94ZXM7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgY2xhc3NCb3hlcy5pbmFjdGl2ZS5wdXNoKENsYXNzQm94LmRlc2VyaWFsaXplKHRoaXMsIGNiKSk7XHJcbiAgICAgICAgICAgIGNsYXNzQm94ZXMuZGlzcGxheVN5c3RlbUNsYXNzZXMgPSBzZXJpYWxpemVkQ2xhc3NEaWFncmFtLmRpc3BsYXlTeXN0ZW1DbGFzc2VzO1xyXG4gICAgICAgICAgICBjbGFzc0JveGVzLnBhcmFtZXRlcnNXaXRoVHlwZXMgPSBzZXJpYWxpemVkQ2xhc3NEaWFncmFtLnBhcmFtZXRlcnNXaXRoVHlwZXM7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhZGp1c3RDbGFzc0RpYWdyYW1TaXplKCkge1xyXG4gICAgICAgIGxldCBjbGFzc0JveGVzID0gdGhpcy5jbGFzc0JveGVzUmVwb3NpdG9yeVt0aGlzLmN1cnJlbnRXb3Jrc3BhY2VJZF07XHJcbiAgICAgICAgdGhpcy5hZGp1c3RTaXplQW5kRWxlbWVudHMoY2xhc3NCb3hlcy5hY3RpdmUpO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENsYXNzQm94ZXMod29ya3NwYWNlOiBXb3Jrc3BhY2UpOiBDbGFzc0JveGVzIHtcclxuICAgICAgICBsZXQgY2I6IENsYXNzQm94ZXMgPSB0aGlzLmNsYXNzQm94ZXNSZXBvc2l0b3J5W3dvcmtzcGFjZS5pZF07XHJcbiAgICAgICAgaWYgKGNiID09IG51bGwpIHtcclxuICAgICAgICAgICAgY2IgPSB7XHJcbiAgICAgICAgICAgICAgICBhY3RpdmU6IFtdLFxyXG4gICAgICAgICAgICAgICAgaW5hY3RpdmU6IFtdLFxyXG4gICAgICAgICAgICAgICAgZGlzcGxheVN5c3RlbUNsYXNzZXM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyc1dpdGhUeXBlczogZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmNsYXNzQm94ZXNSZXBvc2l0b3J5W3dvcmtzcGFjZS5pZF0gPSBjYjtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGNiO1xyXG4gICAgfVxyXG5cclxuICAgIHN3aXRjaFRvV29ya3NwYWNlKHdvcmtzcGFjZTogV29ya3NwYWNlKTogQ2xhc3NCb3hlcyB7XHJcbiAgICAgICAgbGV0IGNiczEgPSB0aGlzLmdldENsYXNzQm94ZXMod29ya3NwYWNlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdvcmtzcGFjZUlkICE9IHdvcmtzcGFjZS5pZCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5jdXJyZW50V29ya3NwYWNlSWQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNicyA9IHRoaXMuY2xhc3NCb3hlc1JlcG9zaXRvcnlbdGhpcy5jdXJyZW50V29ya3NwYWNlSWRdO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNicyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgY2Igb2YgY2JzLmFjdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYi5kZXRhY2goKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgY2Igb2YgY2JzLmluYWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNiLmRldGFjaCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgY2Igb2YgY2JzMS5hY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc3ZnRWxlbWVudC5hcHBlbmRDaGlsZChjYi4kZWxlbWVudFswXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZm9yIChsZXQgY2Igb2YgY2JzMS5pbmFjdGl2ZSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNiLiRlbGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnN2Z0VsZW1lbnQuYXBwZW5kQ2hpbGQoY2IuJGVsZW1lbnRbMF0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmFkanVzdFNpemVBbmRFbGVtZW50cyhjYnMxLmFjdGl2ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmN1cnJlbnRXb3Jrc3BhY2VJZCA9IHdvcmtzcGFjZS5pZDtcclxuXHJcbiAgICAgICAgcmV0dXJuIGNiczE7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdEaWFncmFtKHdvcmtzcGFjZTogV29ya3NwYWNlLCBvbmx5VXBkYXRlSWRlbnRpZmllcnM6IGJvb2xlYW4pIHtcclxuXHJcbiAgICAgICAgaWYgKHdvcmtzcGFjZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5jdXJyZW50V29ya3NwYWNlID0gd29ya3NwYWNlO1xyXG4gICAgICAgIHRoaXMuY3VycmVudENsYXNzQm94ZXMgPSB0aGlzLnN3aXRjaFRvV29ya3NwYWNlKHdvcmtzcGFjZSk7XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGVTdG9yZSA9IHdvcmtzcGFjZS5tb2R1bGVTdG9yZTtcclxuXHJcbiAgICAgICAgbGV0IG5ld0NsYXNzQm94ZXM6IENsYXNzQm94W10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IGFueVR5cGVsaXN0VGhlcmU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgICAgICBsZXQgbmV3Q2xhc3Nlc1RvRHJhdzogKEtsYXNzIHwgSW50ZXJmYWNlKVtdID0gW107XHJcbiAgICAgICAgbGV0IHVzZWRTeXN0ZW1DbGFzc2VzOiAoS2xhc3MgfCBJbnRlcmZhY2UpW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIG1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgIGxldCB0eXBlTGlzdCA9IG1vZHVsZT8udHlwZVN0b3JlPy50eXBlTGlzdDtcclxuICAgICAgICAgICAgaWYgKHR5cGVMaXN0ID09IG51bGwpIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICBhbnlUeXBlbGlzdFRoZXJlID0gdHJ1ZTtcclxuXHJcblxyXG4gICAgICAgICAgICB0eXBlTGlzdC5maWx0ZXIoKHR5cGUpID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0eXBlIGluc3RhbmNlb2YgS2xhc3MgfHxcclxuICAgICAgICAgICAgICAgICAgICB0eXBlIGluc3RhbmNlb2YgSW50ZXJmYWNlXHJcbiAgICAgICAgICAgIH0pLmZvckVhY2goKGtsYXNzOiBLbGFzcyB8IEludGVyZmFjZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNiOiBDbGFzc0JveCA9IHRoaXMuZmluZEFuZEVuYWJsZUNsYXNzKGtsYXNzLCB0aGlzLmN1cnJlbnRDbGFzc0JveGVzLCBuZXdDbGFzc2VzVG9EcmF3KTtcclxuICAgICAgICAgICAgICAgIGlmIChjYiAhPSBudWxsKSBuZXdDbGFzc0JveGVzLnB1c2goY2IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGtsYXNzIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgICAgICAgICBrbGFzcy5yZWdpc3RlclVzZWRTeXN0ZW1DbGFzc2VzKHVzZWRTeXN0ZW1DbGFzc2VzKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyByZWN1cnNpdmVseSByZWdpc3RlciBzeXN0ZW0gY2xhc3NlcyB0aGF0IGFyZSB1c2VkIGJ5IG90aGVyIHN5c3RlbSBjbGFzc2VzXHJcbiAgICAgICAgbGV0IHVzY0xpc3QxOiAoS2xhc3MgfCBJbnRlcmZhY2UpW10gPSBbXTtcclxuICAgICAgICB3aGlsZSAodXNjTGlzdDEubGVuZ3RoIDwgdXNlZFN5c3RlbUNsYXNzZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHVzY0xpc3QxID0gdXNlZFN5c3RlbUNsYXNzZXMuc2xpY2UoMCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IHVzYyBvZiB1c2NMaXN0MSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKHVzYyBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdXNjLnJlZ2lzdGVyVXNlZFN5c3RlbUNsYXNzZXModXNlZFN5c3RlbUNsYXNzZXMpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Q2xhc3NCb3hlcy5kaXNwbGF5U3lzdGVtQ2xhc3Nlcykge1xyXG4gICAgICAgICAgICBmb3IgKGxldCB1c2Mgb2YgdXNlZFN5c3RlbUNsYXNzZXMpIHtcclxuICAgICAgICAgICAgICAgIGxldCBjYjogQ2xhc3NCb3ggPSB0aGlzLmZpbmRBbmRFbmFibGVDbGFzcyh1c2MsIHRoaXMuY3VycmVudENsYXNzQm94ZXMsIG5ld0NsYXNzZXNUb0RyYXcpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNiICE9IG51bGwpIG5ld0NsYXNzQm94ZXMucHVzaChjYik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZGlydHkgPSB0aGlzLmRpcnR5IHx8IG5ld0NsYXNzZXNUb0RyYXcubGVuZ3RoID4gMDtcclxuXHJcbiAgICAgICAgZm9yIChsZXQga2xhc3Mgb2YgbmV3Q2xhc3Nlc1RvRHJhdykge1xyXG4gICAgICAgICAgICBsZXQgY2IgPSBuZXcgQ2xhc3NCb3godGhpcywgTWF0aC5yYW5kb20oKSAqIDEwICogRGlhZ3JhbVVuaXRDbSwgTWF0aC5yYW5kb20oKSAqIDEwICogRGlhZ3JhbVVuaXRDbSwga2xhc3MpO1xyXG5cclxuICAgICAgICAgICAgY2IucmVuZGVyTGluZXMoKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBmcmVlUG9zID0gdGhpcy5maW5kRnJlZVNwYWNlKG5ld0NsYXNzQm94ZXMsIGNiLndpZHRoQ20sIGNiLmhlaWdodENtLCB0aGlzLm1pbkRpc3RhbmNlKTtcclxuXHJcbiAgICAgICAgICAgIGNiLm1vdmVUbyhmcmVlUG9zLngsIGZyZWVQb3MueSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgICAgICBuZXdDbGFzc0JveGVzLnB1c2goY2IpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChuZXdDbGFzc2VzVG9EcmF3Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3RTaXplQW5kRWxlbWVudHMobmV3Q2xhc3NCb3hlcyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWFueVR5cGVsaXN0VGhlcmUpIHJldHVybjtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgY2Igb2YgdGhpcy5jdXJyZW50Q2xhc3NCb3hlcy5hY3RpdmUpIHtcclxuICAgICAgICAgICAgY2IuaGlkZSgpO1xyXG4gICAgICAgICAgICBjYi5hY3RpdmUgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5jdXJyZW50Q2xhc3NCb3hlcy5pbmFjdGl2ZS5wdXNoKGNiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY3VycmVudENsYXNzQm94ZXMuYWN0aXZlID0gbmV3Q2xhc3NCb3hlcztcclxuXHJcbiAgICAgICAgaWYgKCFvbmx5VXBkYXRlSWRlbnRpZmllcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5hZGp1c3RDbGFzc0RpYWdyYW1TaXplKCk7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQXJyb3dzKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVBcnJvd3MoKSB7XHJcbiAgICAgICAgdGhpcy4kaHRtbEVsZW1lbnQuZmluZCgnLmpvX2NsYXNzZGlhZ3JhbS1zcGlubmVyJykuaGlkZSgpO1xyXG5cclxuICAgICAgICAvLyByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBjb2xvcnM6IHN0cmluZ1tdID0gW1wiIzAwNzVkY1wiLCBcIiM5OTNmMDBcIiwgXCIjMDA1YzMxXCIsIFwiI2ZmNTAwNVwiLCBcIiMyYmNlNDhcIixcclxuICAgICAgICAgICAgXCIjMDAwMGZmXCIsIFwiI2ZmYTQwNVwiLCAnI2ZmYThiYicsICcjNzQwYWZmJywgJyM5OTAwMDAnLCAnI2ZmMDAwMCddO1xyXG4gICAgICAgIGxldCBjb2xvckluZGV4ID0gMDtcclxuXHJcbiAgICAgICAgbGV0IHJvdXRpbmdJbnB1dCA9IHRoaXMuZHJhd0Fycm93cygpO1xyXG5cclxuICAgICAgICB0aGlzLnZlcnNpb24rKztcclxuICAgICAgICByb3V0aW5nSW5wdXQudmVyc2lvbiA9IHRoaXMudmVyc2lvbjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMucm91dGluZ1dvcmtlciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucm91dGluZ1dvcmtlci50ZXJtaW5hdGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMucm91dGluZ1dvcmtlciA9IG5ldyBXb3JrZXIoJ2pzL21haW4vZ3VpL2RpYWdyYW1zL2NsYXNzZGlhZ3JhbS9Sb3V0ZXIuanMnKTtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy5yb3V0aW5nV29ya2VyLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAgIC8vIHdoZW4gd29ya2VyIGZpbmlzaGVkOlxyXG4gICAgICAgICAgICBsZXQgcm86IFJvdXRpbmdPdXRwdXQgPSBlLmRhdGE7XHJcbiAgICAgICAgICAgIGlmIChyby52ZXJzaW9uID09IHRoYXQudmVyc2lvbikge1xyXG4gICAgICAgICAgICAgICAgdGhhdC4kaHRtbEVsZW1lbnQuZmluZCgnLmpvX2NsYXNzZGlhZ3JhbS1zcGlubmVyJykuaGlkZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuYXJyb3dzLmZvckVhY2goKGFycm93KSA9PiB7IGFycm93LnJlbW92ZSgpOyB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJyb3dJZGVudGlmaWVyVG9Db2xvck1hcDogeyBbaWRlbnRpZmllcjogc3RyaW5nXTogc3RyaW5nIH0gPSB7fTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXJyb3dzV2l0aG91dENvbG9yOiBudW1iZXIgPSByby5hcnJvd3MubGVuZ3RoICsgMTtcclxuICAgICAgICAgICAgICAgIGxldCBhcnJvd3NXaXRob3V0Q29sb3JMYXN0OiBudW1iZXI7XHJcbiAgICAgICAgICAgICAgICBkbyB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXJyb3dzV2l0aG91dENvbG9yTGFzdCA9IGFycm93c1dpdGhvdXRDb2xvcjtcclxuICAgICAgICAgICAgICAgICAgICBhcnJvd3NXaXRob3V0Q29sb3IgPSAwO1xyXG4gICAgICAgICAgICAgICAgICAgIHJvLmFycm93cy5mb3JFYWNoKChhcnJvdykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyb3cuY29sb3IgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3dzV2l0aG91dENvbG9yKys7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYXJyb3cuZW5kc09uQXJyb3dXaXRoSWRlbnRpZmllciA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3cuY29sb3IgPSBjb2xvcnNbY29sb3JJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3dJZGVudGlmaWVyVG9Db2xvck1hcFthcnJvdy5pZGVudGlmaWVyXSA9IGFycm93LmNvbG9yO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9ySW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29sb3JJbmRleCA+IGNvbG9ycy5sZW5ndGggLSAxKSBjb2xvckluZGV4ID0gMDtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJyb3cuY29sb3IgPSBhcnJvd0lkZW50aWZpZXJUb0NvbG9yTWFwW2Fycm93LmVuZHNPbkFycm93V2l0aElkZW50aWZpZXJdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IHdoaWxlIChhcnJvd3NXaXRob3V0Q29sb3IgPCBhcnJvd3NXaXRob3V0Q29sb3JMYXN0KTtcclxuXHJcbiAgICAgICAgICAgICAgICByby5hcnJvd3MuZm9yRWFjaCgoYXJyb3cpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYXJyb3cuY29sb3IgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcnJvdy5jb2xvciA9IFwiI2ZmMDAwMFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIHJvLmFycm93cy5mb3JFYWNoKChhcnJvdykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYTogRGlhZ3JhbUFycm93ID0gbmV3IERpYWdyYW1BcnJvdyh0aGF0LnN2Z0VsZW1lbnQsIGFycm93LCBhcnJvdy5jb2xvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgZGEucmVuZGVyKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5hcnJvd3MucHVzaChkYSk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLnJvdXRpbmdXb3JrZXIucG9zdE1lc3NhZ2Uocm91dGluZ0lucHV0KTsgLy8gc3RhcnQgd29ya2VyIVxyXG4gICAgICAgIHRoaXMuJGh0bWxFbGVtZW50LmZpbmQoJy5qb19jbGFzc2RpYWdyYW0tc3Bpbm5lcicpLnNob3coKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0Fycm93cygpOiBSb3V0aW5nSW5wdXQge1xyXG5cclxuICAgICAgICBsZXQgcm91dGluZ0lucHV0OiBSb3V0aW5nSW5wdXQgPSB7XHJcbiAgICAgICAgICAgIHJlY3RhbmdsZXM6IFtdLFxyXG4gICAgICAgICAgICBhcnJvd3M6IFtdLFxyXG4gICAgICAgICAgICB4TWF4OiBNYXRoLmNlaWwodGhpcy53aWR0aENtIC8gRGlhZ3JhbVVuaXRDbSksXHJcbiAgICAgICAgICAgIHlNYXg6IE1hdGguY2VpbCh0aGlzLmhlaWdodENtIC8gRGlhZ3JhbVVuaXRDbSksXHJcbiAgICAgICAgICAgIHN0cmFpZ2h0QXJyb3dTZWN0aW9uQWZ0ZXJSZWN0YW5nbGU6IHRoaXMuc3RyYWlnaHRBcnJvd1NlY3Rpb25BZnRlclJlY3RhbmdsZSxcclxuICAgICAgICAgICAgZGlzdGFuY2VGcm9tUmVjdGFuZ2xlczogdGhpcy5kaXN0YW5jZUZyb21SZWN0YW5nbGVzLFxyXG4gICAgICAgICAgICBzbG90RGlzdGFuY2U6IHRoaXMuc2xvdERpc3RhbmNlXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgY2xhc3NCb3hlcyA9IHRoaXMuY2xhc3NCb3hlc1JlcG9zaXRvcnlbdGhpcy5jdXJyZW50V29ya3NwYWNlSWRdO1xyXG5cclxuICAgICAgICBjbGFzc0JveGVzLmFjdGl2ZS5mb3JFYWNoKChjYikgPT4ge1xyXG4gICAgICAgICAgICByb3V0aW5nSW5wdXQucmVjdGFuZ2xlcy5wdXNoKGNiLmdldFJvdXRpbmdSZWN0YW5nbGUoKSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNsYXNzQm94ZXMuYWN0aXZlLmZvckVhY2goKGNiKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBpZiAoY2Iua2xhc3MgaW5zdGFuY2VvZiBLbGFzcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGNiLmtsYXNzLmJhc2VDbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNiMSA9IHRoaXMuZmluZENsYXNzYm94KGNiLmtsYXNzLmJhc2VDbGFzcywgY2xhc3NCb3hlcy5hY3RpdmUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChjYjEgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmRyYXdBcnJ3b3coY2IsIGNiMSwgXCJpbmhlcml0YW5jZVwiLCByb3V0aW5nSW5wdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGludGYgb2YgY2Iua2xhc3MuaW1wbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjYjEgPSB0aGlzLmZpbmRDbGFzc2JveChpbnRmLCBjbGFzc0JveGVzLmFjdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiMSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0FycndvdyhjYiwgY2IxLCBcInJlYWxpemF0aW9uXCIsIHJvdXRpbmdJbnB1dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY2Qgb2YgY2Iua2xhc3MuZ2V0Q29tcG9zaXRlRGF0YSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGNiMSA9IHRoaXMuZmluZENsYXNzYm94KGNkLmtsYXNzLCBjbGFzc0JveGVzLmFjdGl2ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNiMSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZHJhd0FycndvdyhjYjEsIGNiLCBcImNvbXBvc2l0aW9uXCIsIHJvdXRpbmdJbnB1dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIHJldHVybiByb3V0aW5nSW5wdXQ7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGRyYXdBcnJ3b3coY2IxOiBDbGFzc0JveCwgY2IyOiBDbGFzc0JveCwgYXJyb3dUeXBlOiBzdHJpbmcsIHJvdXRpbmdJbnB1dDogUm91dGluZ0lucHV0KSB7XHJcblxyXG4gICAgICAgIGxldCByZWN0MSA9IGNiMS5nZXRSb3V0aW5nUmVjdGFuZ2xlKCk7XHJcbiAgICAgICAgbGV0IHJlY3QyID0gY2IyLmdldFJvdXRpbmdSZWN0YW5nbGUoKTtcclxuXHJcbiAgICAgICAgbGV0IGNsYXNzQm94ZXMgPSB0aGlzLmNsYXNzQm94ZXNSZXBvc2l0b3J5W3RoaXMuY3VycmVudFdvcmtzcGFjZUlkXTtcclxuXHJcbiAgICAgICAgcm91dGluZ0lucHV0LmFycm93cy5wdXNoKHtcclxuICAgICAgICAgICAgYXJyb3dUeXBlOiBhcnJvd1R5cGUsXHJcblxyXG4gICAgICAgICAgICBkZXN0UmVjdGFuZ2xlSW5kZXg6IGNsYXNzQm94ZXMuYWN0aXZlLmluZGV4T2YoY2IyKSxcclxuXHJcbiAgICAgICAgICAgIHNvdXJjZVJlY3RhbmdsZUluZGV4OiBjbGFzc0JveGVzLmFjdGl2ZS5pbmRleE9mKGNiMSksXHJcblxyXG4gICAgICAgICAgICBkZXN0aW5hdGlvbklkZW50aWZpZXI6IGNiMi5jbGFzc05hbWUsXHJcbiAgICAgICAgICAgIGlkZW50aWZpZXI6IGNiMS5jbGFzc05hbWUgKyBcIihleHRlbmRzKVwiICsgY2IyLmNsYXNzTmFtZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBmaW5kQ2xhc3Nib3goa2xhc3M6IEtsYXNzIHwgSW50ZXJmYWNlLCBjbGFzc0JveGVzOiBDbGFzc0JveFtdKTogQ2xhc3NCb3gge1xyXG5cclxuICAgICAgICBmb3IgKGxldCBjYiBvZiBjbGFzc0JveGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChjYi5rbGFzcyA9PSBrbGFzcykgcmV0dXJuIGNiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZpbmRBbmRFbmFibGVDbGFzcyhrbGFzczogS2xhc3MgfCBJbnRlcmZhY2UsIGNsYXNzQm94ZXM6IENsYXNzQm94ZXMsIG5ld0NsYXNzZXNUb0RyYXc6IChLbGFzcyB8IEludGVyZmFjZSlbXSk6IENsYXNzQm94IHtcclxuICAgICAgICBsZXQgaSA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPCBjbGFzc0JveGVzLmFjdGl2ZS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgbGV0IGsgPSBjbGFzc0JveGVzLmFjdGl2ZVtpXTtcclxuICAgICAgICAgICAgaWYgKGsuY2xhc3NOYW1lID09IGtsYXNzLmlkZW50aWZpZXIgfHwgay5oYXNTaWduYXR1cmVBbmRGaWxlT2Yoa2xhc3MpKSB7XHJcbiAgICAgICAgICAgICAgICBrLmF0dGFjaFRvQ2xhc3Moa2xhc3MpO1xyXG4gICAgICAgICAgICAgICAgY2xhc3NCb3hlcy5hY3RpdmUuc3BsaWNlKGksIDEpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaSA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPCBjbGFzc0JveGVzLmluYWN0aXZlLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgayA9IGNsYXNzQm94ZXMuaW5hY3RpdmVbaV07XHJcbiAgICAgICAgICAgIGlmIChrLmNsYXNzTmFtZSA9PSBrbGFzcy5pZGVudGlmaWVyIHx8IGsuaGFzU2lnbmF0dXJlQW5kRmlsZU9mKGtsYXNzKSkge1xyXG4gICAgICAgICAgICAgICAgY2xhc3NCb3hlcy5pbmFjdGl2ZS5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBrLmtsYXNzID0ga2xhc3M7XHJcbiAgICAgICAgICAgICAgICBrLnJlbmRlckxpbmVzKCk7XHJcbiAgICAgICAgICAgICAgICBrLnNob3coKTtcclxuICAgICAgICAgICAgICAgIGsuYWN0aXZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbmV3Q2xhc3Nlc1RvRHJhdy5wdXNoKGtsYXNzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcblxyXG4gICAgICAgIGxldCBjYiA9IHRoaXMuY2xhc3NCb3hlc1JlcG9zaXRvcnlbdGhpcy5jdXJyZW50V29ya3NwYWNlSWRdO1xyXG4gICAgICAgIGlmIChjYiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGMgb2YgY2IuYWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICBjLmRldGFjaCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbn0iXX0=