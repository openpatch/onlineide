import { ArrayType } from "../../../compiler/types/Array.js";
import { Klass, Visibility, StaticClass, Interface } from "../../../compiler/types/Class.js";
import { Enum } from "../../../compiler/types/Enum.js";
import { RuntimeObject } from "../../../interpreter/RuntimeObject.js";
import { stringPrimitiveType } from "../../../compiler/types/PrimitiveTypes.js";
export class ConsoleEntry {
    constructor(caption, value, identifier, parent, withBottomBorder, color = null) {
        this.withBottomBorder = withBottomBorder;
        this.color = color;
        this.isOpen = false;
        this.caption = caption;
        this.parent = parent;
        if (parent != null) {
            parent.children.push(this);
        }
        this.value = value;
        this.identifier = identifier;
        this.render();
    }
    getLevel() {
        return this.parent == null ? 0 : this.parent.getLevel() + 1;
    }
    getIndent() {
        // return this.getLevel() * 15;
        return this.getLevel() == 0 ? 0 : 15;
    }
    render() {
        this.$consoleEntry = jQuery('<div>');
        this.$consoleEntry.addClass("jo_consoleEntry");
        this.$consoleEntry.css('margin-left', '' + this.getIndent() + 'px');
        if (this.color != null) {
            this.$consoleEntry.css('background-color', this.color);
        }
        if (this.withBottomBorder) {
            this.$consoleEntry.addClass('jo_withBorder');
        }
        let $deFirstLine = jQuery('<div class="jo_ceFirstline"></div>');
        this.$consoleEntry.append($deFirstLine);
        if (this.value != null && this.value.type != null && (this.value.type instanceof ArrayType ||
            (this.value.type instanceof Klass && !(this.value.type instanceof Enum) && !(this.value.type == stringPrimitiveType))
            || this.value.type instanceof Interface)) {
            this.canOpen = true;
            this.$consoleEntry.addClass('jo_canOpen');
            this.$consoleEntry.append(jQuery('<div class="jo_ceChildContainer"></div>'));
            this.$consoleEntry.find('.jo_ceFirstline').on('mousedown', (event) => {
                if (this.value != null && this.value.value != null) {
                    if (this.children == null) {
                        this.onFirstOpening();
                    }
                    this.$consoleEntry.toggleClass('jo_expanded');
                    this.isOpen = !this.isOpen;
                }
                else {
                    this.children = null;
                }
                event.stopPropagation();
            });
        }
        else {
            if (this.caption == null && this.getLevel() == 0) {
                this.$consoleEntry.addClass('jo_cannotOpen');
            }
        }
        this.renderValue();
    }
    onFirstOpening() {
        this.children = [];
        let type = this.value.type;
        if (type instanceof Klass) {
            for (let a of this.value.type.getAttributes(Visibility.private)) {
                let ro = this.value.value;
                let de = new ConsoleEntry(null, ro.getValue(a.index), a.identifier, this, false);
                de.render();
                this.$consoleEntry.find('.jo_ceChildContainer').append(de.$consoleEntry);
            }
        }
        else if (type instanceof ArrayType) {
            let a = this.value.value;
            let $childContainer = this.$consoleEntry.find('.jo_ceChildContainer');
            for (let i = 0; i < a.length && i < 100; i++) {
                let de = new ConsoleEntry(null, a[i], "[" + i + "]", this, false);
                de.render();
                $childContainer.append(de.$consoleEntry);
            }
        }
        else if (type instanceof StaticClass) {
            let $childContainer = this.$consoleEntry.find('.jo_ceChildContainer');
            for (let a of type.getAttributes(Visibility.private)) {
                let ro = type.classObject;
                let de = new ConsoleEntry(null, ro.getValue(a.index), a.identifier, this, false);
                de.render();
                $childContainer.append(de.$consoleEntry);
            }
        }
        else if (type instanceof Interface) {
            if (this.value.value != null && this.value.value instanceof RuntimeObject) {
                let $childContainer = this.$consoleEntry.find('.jo_ceChildContainer');
                let ro = this.value.value;
                for (let a of ro.class.getAttributes(Visibility.private)) {
                    let de = new ConsoleEntry(null, ro.getValue(a.index), a.identifier, this, false);
                    de.render();
                    $childContainer.append(de.$consoleEntry);
                }
            }
            else {
                this.children == null;
            }
        }
    }
    renderValue() {
        let $firstLine = this.$consoleEntry.find('.jo_ceFirstline');
        let v = this.value;
        if (v == null) {
            if (this.caption != null) {
                if (typeof this.caption == "string") {
                    $firstLine.append(jQuery('<span class="jo_ceCaption">' + this.caption + "</span>"));
                }
                else {
                    let span = jQuery('<span class="jo_ceCaption"></span>');
                    span.append(this.caption);
                    $firstLine.append(span);
                }
            }
            else {
                $firstLine.append(jQuery('<span class="jo_ceNoValue">Kein Wert zur??ckgegeben.</span>'));
            }
            return;
        }
        let valueString = "";
        if (v.value == null) {
            valueString = "null";
        }
        else {
            valueString = v.type.debugOutput(v, 400);
        }
        if (this.identifier != null) {
            $firstLine.append(jQuery('<span class="jo_ceIdentifier">' + this.identifier + ":&nbsp;</span>"));
        }
        $firstLine.append(jQuery('<span class="jo_ceValue">' + valueString + "</span>"));
    }
    detachValue() {
        this.value = undefined;
        this.$consoleEntry.removeClass('jo_canOpen');
        if (this.getLevel() == 0 && this.caption == null) {
            this.$consoleEntry.addClass('jo_cannotOpen');
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29uc29sZUVudHJ5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9jb25zb2xlL0NvbnNvbGVFbnRyeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDN0QsT0FBTyxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxNQUFNLGtDQUFrQyxDQUFDO0FBQzdGLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxpQ0FBaUMsQ0FBQztBQUN2RCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sdUNBQXVDLENBQUM7QUFDdEUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sMkNBQTJDLENBQUM7QUFFaEYsTUFBTSxPQUFPLFlBQVk7SUFnQnJCLFlBQVksT0FBbUMsRUFBRSxLQUFZLEVBQUUsVUFBa0IsRUFBRSxNQUFvQixFQUMzRixnQkFBeUIsRUFBVSxRQUFnQixJQUFJO1FBQXZELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUztRQUFVLFVBQUssR0FBTCxLQUFLLENBQWU7UUFSbkUsV0FBTSxHQUFZLEtBQUssQ0FBQztRQVNwQixJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztRQUN2QixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQztRQUNyQixJQUFJLE1BQU0sSUFBSSxJQUFJLEVBQUU7WUFDaEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDOUI7UUFDRCxJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUVuQixJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztRQUU3QixJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDbEIsQ0FBQztJQUVELFFBQVE7UUFDSixPQUFPLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFD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RjtZQUNELE9BQU87U0FDVjtRQUVELElBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQztRQUNyQixJQUFJLENBQUMsQ0FBQyxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ2pCLFdBQVcsR0FBRyxNQUFNLENBQUM7U0FDeEI7YUFBTTtZQUNILFdBQVcsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDNUM7UUFFRCxJQUFHLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxFQUFDO1lBQ3ZCLFVBQVUsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLGdDQUFnQyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO1NBQ3BHO1FBQ0QsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsMkJBQTJCLEdBQUcsV0FBVyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDckYsQ0FBQztJQUVELFdBQVc7UUFDUCxJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztRQUN2QixJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUM3QyxJQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLEVBQUM7WUFDNUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUM7U0FDaEQ7SUFDTCxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBWYWx1ZSB9IGZyb20gXCIuLi8uLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBBcnJheVR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tcGlsZXIvdHlwZXMvQXJyYXkuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MsIFZpc2liaWxpdHksIFN0YXRpY0NsYXNzLCBJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgRW51bSB9IGZyb20gXCIuLi8uLi8uLi9jb21waWxlci90eXBlcy9FbnVtLmpzXCI7XHJcbmltcG9ydCB7IFJ1bnRpbWVPYmplY3QgfSBmcm9tIFwiLi4vLi4vLi4vaW50ZXJwcmV0ZXIvUnVudGltZU9iamVjdC5qc1wiO1xyXG5pbXBvcnQgeyBzdHJpbmdQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgQ29uc29sZUVudHJ5IHtcclxuXHJcbiAgICBjYXB0aW9uOiBzdHJpbmd8SlF1ZXJ5PEhUTUxFbGVtZW50PjsgLy8gb25seSB1c2VkIGZvciByb290IGVsZW1lbnRzLCBlLmcuIFwiTG9jYWwgdmFyaWFibGVzXCJcclxuICAgIC8vIGlmIGNhcHRpb24gaXMgc2V0IHRoZW4gdmFsdWUgPT0gbnVsbCBhbmQgcGFyZW50ID09IG51bGxcclxuXHJcbiAgICBwYXJlbnQ6IENvbnNvbGVFbnRyeTtcclxuICAgIGNoaWxkcmVuOiBDb25zb2xlRW50cnlbXTtcclxuXHJcbiAgICBjYW5PcGVuOiBib29sZWFuO1xyXG4gICAgaXNPcGVuOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgaWRlbnRpZmllcjogc3RyaW5nO1xyXG4gICAgdmFsdWU6IFZhbHVlO1xyXG5cclxuICAgICRjb25zb2xlRW50cnk6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgY29uc3RydWN0b3IoY2FwdGlvbjogc3RyaW5nfEpRdWVyeTxIVE1MRWxlbWVudD4sIHZhbHVlOiBWYWx1ZSwgaWRlbnRpZmllcjogc3RyaW5nLCBwYXJlbnQ6IENvbnNvbGVFbnRyeSwgXHJcbiAgICAgICAgcHJpdmF0ZSB3aXRoQm90dG9tQm9yZGVyOiBib29sZWFuLCBwcml2YXRlIGNvbG9yOiBzdHJpbmcgPSBudWxsICkge1xyXG4gICAgICAgIHRoaXMuY2FwdGlvbiA9IGNhcHRpb247XHJcbiAgICAgICAgdGhpcy5wYXJlbnQgPSBwYXJlbnQ7XHJcbiAgICAgICAgaWYgKHBhcmVudCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHBhcmVudC5jaGlsZHJlbi5wdXNoKHRoaXMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XHJcblxyXG4gICAgICAgIHRoaXMuaWRlbnRpZmllciA9IGlkZW50aWZpZXI7XHJcblxyXG4gICAgICAgIHRoaXMucmVuZGVyKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0TGV2ZWwoKTogbnVtYmVyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5wYXJlbnQgPT0gbnVsbCA/IDAgOiB0aGlzLnBhcmVudC5nZXRMZXZlbCgpICsgMTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRJbmRlbnQoKTogbnVtYmVyIHtcclxuICAgICAgICAvLyByZXR1cm4gdGhpcy5nZXRMZXZlbCgpICogMTU7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0TGV2ZWwoKSA9PSAwID8gMCA6IDE1O1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlcigpIHtcclxuXHJcbiAgICAgICAgdGhpcy4kY29uc29sZUVudHJ5ID0galF1ZXJ5KCc8ZGl2PicpO1xyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVFbnRyeS5hZGRDbGFzcyhcImpvX2NvbnNvbGVFbnRyeVwiKTtcclxuICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuY3NzKCdtYXJnaW4tbGVmdCcsICcnICsgdGhpcy5nZXRJbmRlbnQoKSArICdweCcpO1xyXG5cclxuICAgICAgICBpZih0aGlzLmNvbG9yICE9IG51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuY3NzKCdiYWNrZ3JvdW5kLWNvbG9yJywgdGhpcy5jb2xvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLndpdGhCb3R0b21Cb3JkZXIpe1xyXG4gICAgICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuYWRkQ2xhc3MoJ2pvX3dpdGhCb3JkZXInKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCAkZGVGaXJzdExpbmUgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19jZUZpcnN0bGluZVwiPjwvZGl2PicpO1xyXG5cclxuICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuYXBwZW5kKCRkZUZpcnN0TGluZSk7XHJcblxyXG5cclxuICAgICAgICBpZiAodGhpcy52YWx1ZSAhPSBudWxsICYmIHRoaXMudmFsdWUudHlwZSAhPSBudWxsICYmICh0aGlzLnZhbHVlLnR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUgfHxcclxuICAgICAgICAgICAgKHRoaXMudmFsdWUudHlwZSBpbnN0YW5jZW9mIEtsYXNzICYmICEodGhpcy52YWx1ZS50eXBlIGluc3RhbmNlb2YgRW51bSkgJiYgISh0aGlzLnZhbHVlLnR5cGUgPT0gc3RyaW5nUHJpbWl0aXZlVHlwZSkpXHJcbiAgICAgICAgICAgIHx8IHRoaXMudmFsdWUudHlwZSBpbnN0YW5jZW9mIEludGVyZmFjZVxyXG4gICAgICAgICAgICApKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FuT3BlbiA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuJGNvbnNvbGVFbnRyeS5hZGRDbGFzcygnam9fY2FuT3BlbicpO1xyXG4gICAgICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuYXBwZW5kKGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2NlQ2hpbGRDb250YWluZXJcIj48L2Rpdj4nKSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuZmluZCgnLmpvX2NlRmlyc3RsaW5lJykub24oJ21vdXNlZG93bicsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMudmFsdWUgIT0gbnVsbCAmJiB0aGlzLnZhbHVlLnZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5jaGlsZHJlbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub25GaXJzdE9wZW5pbmcoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy4kY29uc29sZUVudHJ5LnRvZ2dsZUNsYXNzKCdqb19leHBhbmRlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaXNPcGVuID0gIXRoaXMuaXNPcGVuO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmNoaWxkcmVuID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBpZih0aGlzLmNhcHRpb24gPT0gbnVsbCAmJiB0aGlzLmdldExldmVsKCkgPT0gMCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuYWRkQ2xhc3MoJ2pvX2Nhbm5vdE9wZW4nKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5yZW5kZXJWYWx1ZSgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvbkZpcnN0T3BlbmluZygpIHtcclxuXHJcbiAgICAgICAgdGhpcy5jaGlsZHJlbiA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgdHlwZSA9IHRoaXMudmFsdWUudHlwZTtcclxuXHJcbiAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBLbGFzcykge1xyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgYSBvZiAoPEtsYXNzPnRoaXMudmFsdWUudHlwZSkuZ2V0QXR0cmlidXRlcyhWaXNpYmlsaXR5LnByaXZhdGUpKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcm8gPSA8UnVudGltZU9iamVjdD50aGlzLnZhbHVlLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGRlID0gbmV3IENvbnNvbGVFbnRyeShudWxsLCByby5nZXRWYWx1ZShhLmluZGV4KSwgYS5pZGVudGlmaWVyLCB0aGlzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBkZS5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGNvbnNvbGVFbnRyeS5maW5kKCcuam9fY2VDaGlsZENvbnRhaW5lcicpLmFwcGVuZChkZS4kY29uc29sZUVudHJ5KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBhID0gPFZhbHVlW10+dGhpcy52YWx1ZS52YWx1ZTtcclxuXHJcbiAgICAgICAgICAgIGxldCAkY2hpbGRDb250YWluZXIgPSB0aGlzLiRjb25zb2xlRW50cnkuZmluZCgnLmpvX2NlQ2hpbGRDb250YWluZXInKTtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhLmxlbmd0aCAmJiBpIDwgMTAwOyBpKyspIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgZGUgPSBuZXcgQ29uc29sZUVudHJ5KG51bGwsIGFbaV0sIFwiW1wiICsgaSArIFwiXVwiLCB0aGlzLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICBkZS5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICRjaGlsZENvbnRhaW5lci5hcHBlbmQoZGUuJGNvbnNvbGVFbnRyeSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSBpbnN0YW5jZW9mIFN0YXRpY0NsYXNzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgJGNoaWxkQ29udGFpbmVyID0gdGhpcy4kY29uc29sZUVudHJ5LmZpbmQoJy5qb19jZUNoaWxkQ29udGFpbmVyJyk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGEgb2YgdHlwZS5nZXRBdHRyaWJ1dGVzKFZpc2liaWxpdHkucHJpdmF0ZSkpIHtcclxuICAgICAgICAgICAgICAgIGxldCBybyA9IHR5cGUuY2xhc3NPYmplY3Q7XHJcbiAgICAgICAgICAgICAgICBsZXQgZGUgPSBuZXcgQ29uc29sZUVudHJ5KG51bGwsIHJvLmdldFZhbHVlKGEuaW5kZXgpLCBhLmlkZW50aWZpZXIsIHRoaXMsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgIGRlLnJlbmRlcigpO1xyXG4gICAgICAgICAgICAgICAgJGNoaWxkQ29udGFpbmVyLmFwcGVuZChkZS4kY29uc29sZUVudHJ5KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9IGVsc2UgaWYgKHR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoaXMudmFsdWUudmFsdWUgIT0gbnVsbCAmJiB0aGlzLnZhbHVlLnZhbHVlIGluc3RhbmNlb2YgUnVudGltZU9iamVjdCl7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0ICRjaGlsZENvbnRhaW5lciA9IHRoaXMuJGNvbnNvbGVFbnRyeS5maW5kKCcuam9fY2VDaGlsZENvbnRhaW5lcicpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBybzogUnVudGltZU9iamVjdCA9IHRoaXMudmFsdWUudmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYSBvZiAoPEtsYXNzPnJvLmNsYXNzKS5nZXRBdHRyaWJ1dGVzKFZpc2liaWxpdHkucHJpdmF0ZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgZGUgPSBuZXcgQ29uc29sZUVudHJ5KG51bGwsIHJvLmdldFZhbHVlKGEuaW5kZXgpLCBhLmlkZW50aWZpZXIsIHRoaXMsIGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICBkZS5yZW5kZXIoKTtcclxuICAgICAgICAgICAgICAgICAgICAkY2hpbGRDb250YWluZXIuYXBwZW5kKGRlLiRjb25zb2xlRW50cnkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2hpbGRyZW4gPT0gbnVsbDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbmRlclZhbHVlKCkge1xyXG5cclxuICAgICAgICBsZXQgJGZpcnN0TGluZSA9IHRoaXMuJGNvbnNvbGVFbnRyeS5maW5kKCcuam9fY2VGaXJzdGxpbmUnKTtcclxuXHJcbiAgICAgICAgbGV0IHYgPSB0aGlzLnZhbHVlO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICh2ID09IG51bGwpIHtcclxuICAgICAgICAgICAgaWYodGhpcy5jYXB0aW9uICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgaWYodHlwZW9mIHRoaXMuY2FwdGlvbiA9PSBcInN0cmluZ1wiICl7XHJcbiAgICAgICAgICAgICAgICAgICAgJGZpcnN0TGluZS5hcHBlbmQoalF1ZXJ5KCc8c3BhbiBjbGFzcz1cImpvX2NlQ2FwdGlvblwiPicgKyB0aGlzLmNhcHRpb24gKyBcIjwvc3Bhbj5cIikpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3BhbiA9IGpRdWVyeSgnPHNwYW4gY2xhc3M9XCJqb19jZUNhcHRpb25cIj48L3NwYW4+Jyk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3Bhbi5hcHBlbmQodGhpcy5jYXB0aW9uKTtcclxuICAgICAgICAgICAgICAgICAgICAkZmlyc3RMaW5lLmFwcGVuZChzcGFuKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICRmaXJzdExpbmUuYXBwZW5kKGpRdWVyeSgnPHNwYW4gY2xhc3M9XCJqb19jZU5vVmFsdWVcIj5LZWluIFdlcnQgenVyw7xja2dlZ2ViZW4uPC9zcGFuPicpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCB2YWx1ZVN0cmluZyA9IFwiXCI7XHJcbiAgICAgICAgaWYgKHYudmFsdWUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICB2YWx1ZVN0cmluZyA9IFwibnVsbFwiO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHZhbHVlU3RyaW5nID0gdi50eXBlLmRlYnVnT3V0cHV0KHYsIDQwMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKHRoaXMuaWRlbnRpZmllciAhPSBudWxsKXtcclxuICAgICAgICAgICAgJGZpcnN0TGluZS5hcHBlbmQoalF1ZXJ5KCc8c3BhbiBjbGFzcz1cImpvX2NlSWRlbnRpZmllclwiPicgKyB0aGlzLmlkZW50aWZpZXIgKyBcIjombmJzcDs8L3NwYW4+XCIpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgJGZpcnN0TGluZS5hcHBlbmQoalF1ZXJ5KCc8c3BhbiBjbGFzcz1cImpvX2NlVmFsdWVcIj4nICsgdmFsdWVTdHJpbmcgKyBcIjwvc3Bhbj5cIikpO1xyXG4gICAgfVxyXG5cclxuICAgIGRldGFjaFZhbHVlKCkge1xyXG4gICAgICAgIHRoaXMudmFsdWUgPSB1bmRlZmluZWQ7XHJcbiAgICAgICAgdGhpcy4kY29uc29sZUVudHJ5LnJlbW92ZUNsYXNzKCdqb19jYW5PcGVuJyk7XHJcbiAgICAgICAgaWYodGhpcy5nZXRMZXZlbCgpID09IDAgJiYgdGhpcy5jYXB0aW9uID09IG51bGwpe1xyXG4gICAgICAgICAgICB0aGlzLiRjb25zb2xlRW50cnkuYWRkQ2xhc3MoJ2pvX2Nhbm5vdE9wZW4nKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG59Il19