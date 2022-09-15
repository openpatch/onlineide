import { ArrayType } from "../types/Array.js";
export class SymbolTable {
    constructor(parentSymbolTable, positionFrom, positionTo) {
        this.id = SymbolTable.maxId++;
        this.beginsNewStackframe = false;
        this.childSymbolTables = [];
        this.variableMap = new Map();
        this.classContext = null;
        this.method = null;
        this.parent = parentSymbolTable;
        this.positionFrom = positionFrom;
        this.positionTo = positionTo;
        this.classContext = parentSymbolTable == null ? null : parentSymbolTable.classContext;
        if (this.parent != null) {
            this.parent.childSymbolTables.push(this);
            this.method = this.parent.method;
        }
    }
    getImitation() {
        let imitation = new SymbolTable(null, { line: 1, column: 1, length: 0 }, { line: 1, column: 10000, length: 0 });
        imitation.beginsNewStackframe = true;
        let st = this;
        let maxStackPos = -1;
        while (st != null) {
            if (st.classContext != null) {
                imitation.classContext = st.classContext;
            }
            st.variableMap.forEach((variable, identifier) => {
                if (imitation.variableMap.get(identifier) == null) {
                    imitation.variableMap.set(identifier, variable);
                }
                if (variable.stackPos > maxStackPos) {
                    maxStackPos = variable.stackPos;
                }
            });
            st = st.parent;
        }
        imitation.stackframeSize = maxStackPos + 1;
        return imitation;
    }
    getLocalVariableCompletionItems(rangeToReplace) {
        let completionItems = [];
        this.variableMap.forEach((variable, identifier) => {
            //@ts-ignore
            if (identifier == 0)
                return;
            // TODO: Zu einem Objekt mit identifier == 0 kommt es, wenn man ArrayList<In tippt und dann <Strg + Leertaste>.
            if (variable != null && variable.type != null && variable.type instanceof ArrayType) {
                completionItems.push({
                    label: identifier + "[]",
                    insertText: identifier + "[$0]",
                    documentation: "Element des Arrays",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: rangeToReplace
                });
            }
            completionItems.push({
                label: identifier,
                insertText: identifier,
                kind: monaco.languages.CompletionItemKind.Variable,
                range: rangeToReplace
            });
        });
        if (this.parent != null && this.parent.classContext == this.classContext) {
            completionItems = completionItems.concat(this.parent.getLocalVariableCompletionItems(rangeToReplace));
        }
        return completionItems;
    }
    findTableAtPosition(line, column) {
        if (!this.containsPosition(line, column)) {
            return null;
        }
        let shortestSymbolTableContainingPosition = null;
        let shortestPosition = 10000000;
        for (let st of this.childSymbolTables) {
            if (st.containsPosition(line, column)) {
                let st1 = st.findTableAtPosition(line, column);
                if (st1.positionTo.line - st1.positionFrom.line < shortestPosition) {
                    shortestSymbolTableContainingPosition = st1;
                    shortestPosition = st1.positionTo.line - st1.positionFrom.line;
                }
            }
            // if(st.containsPosition(line, column) && st.positionTo.line - st.positionFrom.line < shortestPosition){
            //     shortestSymbolTableContainingPosition = st;
            //     shortestPosition = st.positionTo.line - st.positionFrom.line;
            // }
        }
        if (shortestSymbolTableContainingPosition != null) {
            return shortestSymbolTableContainingPosition;
        }
        else {
            return this;
        }
    }
    containsPosition(line, column) {
        if (line < this.positionFrom.line || line > this.positionTo.line) {
            return false;
        }
        if (line == this.positionFrom.line)
            return column >= this.positionFrom.column;
        if (line == this.positionTo.line)
            return column <= this.positionTo.column;
        return true;
    }
}
SymbolTable.maxId = 0;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3ltYm9sVGFibGUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL3BhcnNlci9TeW1ib2xUYWJsZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFHOUMsTUFBTSxPQUFPLFdBQVc7SUFvQnBCLFlBQVksaUJBQThCLEVBQUUsWUFBMEIsRUFBRSxVQUF3QjtRQWhCekYsT0FBRSxHQUFHLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQU1oQyx3QkFBbUIsR0FBWSxLQUFLLENBQUM7UUFHckMsc0JBQWlCLEdBQWtCLEVBQUUsQ0FBQztRQUV0QyxnQkFBVyxHQUEwQixJQUFJLEdBQUcsRUFBRSxDQUFDO1FBRS9DLGlCQUFZLEdBQXdCLElBQUksQ0FBQztRQUN6QyxXQUFNLEdBQVcsSUFBSSxDQUFDO1FBSWxCLElBQUksQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUM7UUFFaEMsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7UUFDakMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFFN0IsSUFBSSxDQUFDLFlBQVksR0FBRyxpQkFBaUIsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsWUFBWSxDQUFDO1FBRXRGLElBQUksSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLEVBQUU7WUFDckIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQztTQUNwQztJQUNMLENBQUM7SUFFRCxZQUFZO1FBQ1IsSUFBSSxTQUFTLEdBQUcsSUFBSSxXQUFXLENBQUMsSUFBSSxFQUFFLEVBQUUsSUFBSSxFQUFFLENB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QUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJO1lBQUUsT0FBTyxNQUFNLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7UUFFMUUsT0FBTyxJQUFJLENBQUM7SUFFaEIsQ0FBQzs7QUF0Sk0saUJBQUssR0FBVyxDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUZXh0UG9zaXRpb24gfSBmcm9tIFwiLi4vbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgVHlwZSwgVmFyaWFibGUsIE1ldGhvZCB9IGZyb20gXCIuLi90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcywgU3RhdGljQ2xhc3MgfSBmcm9tIFwiLi4vdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4uL3R5cGVzL0FycmF5LmpzXCI7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIFN5bWJvbFRhYmxlIHtcclxuXHJcbiAgICBzdGF0aWMgbWF4SWQ6IG51bWJlciA9IDA7XHJcblxyXG4gICAgcHVibGljIGlkID0gU3ltYm9sVGFibGUubWF4SWQrKztcclxuXHJcbiAgICBwYXJlbnQ6IFN5bWJvbFRhYmxlOyAvLyBTeW1ib2xUYWJsZSBvZiBwYXJlbnQgc2NvcGVcclxuICAgIHBvc2l0aW9uRnJvbTogVGV4dFBvc2l0aW9uO1xyXG4gICAgcG9zaXRpb25UbzogVGV4dFBvc2l0aW9uO1xyXG5cclxuICAgIGJlZ2luc05ld1N0YWNrZnJhbWU6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHN0YWNrZnJhbWVTaXplOiBudW1iZXI7XHJcblxyXG4gICAgY2hpbGRTeW1ib2xUYWJsZXM6IFN5bWJvbFRhYmxlW10gPSBbXTtcclxuXHJcbiAgICB2YXJpYWJsZU1hcDogTWFwPHN0cmluZywgVmFyaWFibGU+ID0gbmV3IE1hcCgpO1xyXG5cclxuICAgIGNsYXNzQ29udGV4dDogS2xhc3MgfCBTdGF0aWNDbGFzcyA9IG51bGw7XHJcbiAgICBtZXRob2Q6IE1ldGhvZCA9IG51bGw7XHJcblxyXG4gICAgY29uc3RydWN0b3IocGFyZW50U3ltYm9sVGFibGU6IFN5bWJvbFRhYmxlLCBwb3NpdGlvbkZyb206IFRleHRQb3NpdGlvbiwgcG9zaXRpb25UbzogVGV4dFBvc2l0aW9uKSB7XHJcblxyXG4gICAgICAgIHRoaXMucGFyZW50ID0gcGFyZW50U3ltYm9sVGFibGU7XHJcblxyXG4gICAgICAgIHRoaXMucG9zaXRpb25Gcm9tID0gcG9zaXRpb25Gcm9tO1xyXG4gICAgICAgIHRoaXMucG9zaXRpb25UbyA9IHBvc2l0aW9uVG87XHJcblxyXG4gICAgICAgIHRoaXMuY2xhc3NDb250ZXh0ID0gcGFyZW50U3ltYm9sVGFibGUgPT0gbnVsbCA/IG51bGwgOiBwYXJlbnRTeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQ7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLnBhcmVudCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGFyZW50LmNoaWxkU3ltYm9sVGFibGVzLnB1c2godGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMubWV0aG9kID0gdGhpcy5wYXJlbnQubWV0aG9kO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRJbWl0YXRpb24oKTogU3ltYm9sVGFibGUge1xyXG4gICAgICAgIGxldCBpbWl0YXRpb24gPSBuZXcgU3ltYm9sVGFibGUobnVsbCwgeyBsaW5lOiAxLCBjb2x1bW46IDEsIGxlbmd0aDogMCB9LCB7IGxpbmU6IDEsIGNvbHVtbjogMTAwMDAsIGxlbmd0aDogMCB9KTtcclxuXHJcbiAgICAgICAgaW1pdGF0aW9uLmJlZ2luc05ld1N0YWNrZnJhbWUgPSB0cnVlO1xyXG4gICAgICAgIGxldCBzdDogU3ltYm9sVGFibGUgPSB0aGlzO1xyXG5cclxuICAgICAgICBsZXQgbWF4U3RhY2tQb3MgPSAtMTtcclxuXHJcbiAgICAgICAgd2hpbGUgKHN0ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKHN0LmNsYXNzQ29udGV4dCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpbWl0YXRpb24uY2xhc3NDb250ZXh0ID0gc3QuY2xhc3NDb250ZXh0O1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBzdC52YXJpYWJsZU1hcC5mb3JFYWNoKCh2YXJpYWJsZSwgaWRlbnRpZmllcikgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChpbWl0YXRpb24udmFyaWFibGVNYXAuZ2V0KGlkZW50aWZpZXIpID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbWl0YXRpb24udmFyaWFibGVNYXAuc2V0KGlkZW50aWZpZXIsIHZhcmlhYmxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodmFyaWFibGUuc3RhY2tQb3MgPiBtYXhTdGFja1Bvcykge1xyXG4gICAgICAgICAgICAgICAgICAgIG1heFN0YWNrUG9zID0gdmFyaWFibGUuc3RhY2tQb3M7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIHN0ID0gc3QucGFyZW50O1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGltaXRhdGlvbi5zdGFja2ZyYW1lU2l6ZSA9IG1heFN0YWNrUG9zICsgMTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGltaXRhdGlvbjtcclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIGdldExvY2FsVmFyaWFibGVDb21wbGV0aW9uSXRlbXMocmFuZ2VUb1JlcGxhY2U6IG1vbmFjby5JUmFuZ2UpOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10ge1xyXG5cclxuICAgICAgICBsZXQgY29tcGxldGlvbkl0ZW1zOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgdGhpcy52YXJpYWJsZU1hcC5mb3JFYWNoKCh2YXJpYWJsZSwgaWRlbnRpZmllcikgPT4ge1xyXG5cclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGlmKGlkZW50aWZpZXIgPT0gMCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgLy8gVE9ETzogWnUgZWluZW0gT2JqZWt0IG1pdCBpZGVudGlmaWVyID09IDAga29tbXQgZXMsIHdlbm4gbWFuIEFycmF5TGlzdDxJbiB0aXBwdCB1bmQgZGFubiA8U3RyZyArIExlZXJ0YXN0ZT4uXHJcblxyXG4gICAgICAgICAgICBpZiAodmFyaWFibGUgIT0gbnVsbCAmJiB2YXJpYWJsZS50eXBlICE9IG51bGwgJiYgdmFyaWFibGUudHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkge1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBpZGVudGlmaWVyICsgXCJbXVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IGlkZW50aWZpZXIgKyBcIlskMF1cIixcclxuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudGF0aW9uOiBcIkVsZW1lbnQgZGVzIEFycmF5c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBjb21wbGV0aW9uSXRlbXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogaWRlbnRpZmllcixcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IGlkZW50aWZpZXIsXHJcbiAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5WYXJpYWJsZSxcclxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZVxyXG4gICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wYXJlbnQgIT0gbnVsbCAmJiB0aGlzLnBhcmVudC5jbGFzc0NvbnRleHQgPT0gdGhpcy5jbGFzc0NvbnRleHQpIHtcclxuICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdCh0aGlzLnBhcmVudC5nZXRMb2NhbFZhcmlhYmxlQ29tcGxldGlvbkl0ZW1zKHJhbmdlVG9SZXBsYWNlKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gY29tcGxldGlvbkl0ZW1zO1xyXG4gICAgfVxyXG5cclxuICAgIGZpbmRUYWJsZUF0UG9zaXRpb24obGluZTogbnVtYmVyLCBjb2x1bW46IG51bWJlcik6IFN5bWJvbFRhYmxlIHtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmNvbnRhaW5zUG9zaXRpb24obGluZSwgY29sdW1uKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzaG9ydGVzdFN5bWJvbFRhYmxlQ29udGFpbmluZ1Bvc2l0aW9uID0gbnVsbDtcclxuICAgICAgICBsZXQgc2hvcnRlc3RQb3NpdGlvbiA9IDEwMDAwMDAwO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBzdCBvZiB0aGlzLmNoaWxkU3ltYm9sVGFibGVzKSB7XHJcbiAgICAgICAgICAgIGlmIChzdC5jb250YWluc1Bvc2l0aW9uKGxpbmUsIGNvbHVtbikpIHtcclxuICAgICAgICAgICAgICAgIGxldCBzdDEgPSBzdC5maW5kVGFibGVBdFBvc2l0aW9uKGxpbmUsIGNvbHVtbik7XHJcbiAgICAgICAgICAgICAgICBpZiAoc3QxLnBvc2l0aW9uVG8ubGluZSAtIHN0MS5wb3NpdGlvbkZyb20ubGluZSA8IHNob3J0ZXN0UG9zaXRpb24pIHtcclxuICAgICAgICAgICAgICAgICAgICBzaG9ydGVzdFN5bWJvbFRhYmxlQ29udGFpbmluZ1Bvc2l0aW9uID0gc3QxO1xyXG4gICAgICAgICAgICAgICAgICAgIHNob3J0ZXN0UG9zaXRpb24gPSBzdDEucG9zaXRpb25Uby5saW5lIC0gc3QxLnBvc2l0aW9uRnJvbS5saW5lO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIGlmKHN0LmNvbnRhaW5zUG9zaXRpb24obGluZSwgY29sdW1uKSAmJiBzdC5wb3NpdGlvblRvLmxpbmUgLSBzdC5wb3NpdGlvbkZyb20ubGluZSA8IHNob3J0ZXN0UG9zaXRpb24pe1xyXG4gICAgICAgICAgICAvLyAgICAgc2hvcnRlc3RTeW1ib2xUYWJsZUNvbnRhaW5pbmdQb3NpdGlvbiA9IHN0O1xyXG4gICAgICAgICAgICAvLyAgICAgc2hvcnRlc3RQb3NpdGlvbiA9IHN0LnBvc2l0aW9uVG8ubGluZSAtIHN0LnBvc2l0aW9uRnJvbS5saW5lO1xyXG4gICAgICAgICAgICAvLyB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc2hvcnRlc3RTeW1ib2xUYWJsZUNvbnRhaW5pbmdQb3NpdGlvbiAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBzaG9ydGVzdFN5bWJvbFRhYmxlQ29udGFpbmluZ1Bvc2l0aW9uO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY29udGFpbnNQb3NpdGlvbihsaW5lOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyKSB7XHJcbiAgICAgICAgaWYgKGxpbmUgPCB0aGlzLnBvc2l0aW9uRnJvbS5saW5lIHx8IGxpbmUgPiB0aGlzLnBvc2l0aW9uVG8ubGluZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobGluZSA9PSB0aGlzLnBvc2l0aW9uRnJvbS5saW5lKSByZXR1cm4gY29sdW1uID49IHRoaXMucG9zaXRpb25Gcm9tLmNvbHVtbjtcclxuICAgICAgICBpZiAobGluZSA9PSB0aGlzLnBvc2l0aW9uVG8ubGluZSkgcmV0dXJuIGNvbHVtbiA8PSB0aGlzLnBvc2l0aW9uVG8uY29sdW1uO1xyXG5cclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuIl19