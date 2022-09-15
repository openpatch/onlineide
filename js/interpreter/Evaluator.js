import { AdhocCompiler } from "../compiler/AdhocCompiler.js";
export class Evaluator {
    constructor(workspace, main) {
        this.workspace = workspace;
        this.main = main;
        this.programMap = new Map();
        this.compiler = new AdhocCompiler(main);
    }
    compile(expression, symbolTable) {
        if (symbolTable == null)
            return;
        let pmEntry = this.programMap.get(expression);
        if (pmEntry != null) {
            let program = pmEntry.get(symbolTable.id);
            if (program != null) {
                return { error: null, program: program };
            }
        }
        else {
            pmEntry = new Map();
            this.programMap.set(expression, pmEntry);
        }
        let moduleStore = this.workspace.moduleStore;
        let heap = this.main.getInterpreter().heap;
        if (expression.length > 0 && moduleStore != null) {
            let compilation = this.compiler.compile(expression, moduleStore, heap, symbolTable);
            if (compilation.errors.length > 0) {
                return { error: compilation.errors[0].text, program: null };
            }
            else {
                pmEntry.set(symbolTable.id, compilation.program);
                return { error: null, program: compilation.program };
            }
        }
        else {
            return { error: "Leerer Ausdruck", program: null };
        }
    }
    evaluate(expression, symbolTable) {
        if (symbolTable == null)
            symbolTable = this.main.getDebugger().lastSymboltable;
        let c = this.compile(expression, symbolTable);
        if ((c === null || c === void 0 ? void 0 : c.error) != null) {
            return { error: c.error, value: null };
        }
        if (c == null) {
            return { error: "Fehler beim Kompilieren", value: null };
        }
        let interpreter = this.main.getInterpreter();
        return interpreter.evaluate(c.program);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRXZhbHVhdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC9pbnRlcnByZXRlci9FdmFsdWF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBUTdELE1BQU0sT0FBTyxTQUFTO0lBS2xCLFlBQW9CLFNBQW9CLEVBQVUsSUFBYztRQUE1QyxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQVUsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUh4RCxlQUFVLEdBQXNDLElBQUksR0FBRyxFQUFFLENBQUM7UUFJOUQsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsT0FBTyxDQUFDLFVBQWtCLEVBQUUsV0FBd0I7UUFFaEQsSUFBRyxXQUFXLElBQUksSUFBSTtZQUFFLE9BQU87UUFFL0IsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDOUMsSUFBRyxPQUFPLElBQUksSUFBSSxFQUFDO1lBQ2YsSUFBSSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDMUMsSUFBRyxPQUFPLElBQUksSUFBSSxFQUFDO2dCQUNmLE9BQU8sRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQzthQUMxQztTQUNKO2FBQU07WUFDSCxPQUFPLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDNUM7UUFFRCxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLFdBQVcsQ0FBQztRQUM3QyxJQUFJLElBQUksR0FBUyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLElBQUksQ0FBQztRQUVqRCxJQUFJLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLFdBQVcsSUFBSSxJQUFJLEVBQUU7WUFFOUMsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7WUFFcEYsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQy9CLE9BQU8sRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQyxDQUFDO2FBQzlEO2lCQUFNO2dCQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBRWpELE9BQU8sRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsT0FBTyxFQUFDLENBQUM7YUFDdEQ7U0FFSjthQUFNO1lBQ0gsT0FBTyxFQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUM7U0FDcEQ7SUFDTCxDQUFDO0lBRUQsUUFBUSxDQUFDLFVBQWtCLEVBQUUsV0FBeUI7UUFFbEQsSUFBRyxXQUFXLElBQUksSUFBSTtZQUFFLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLGVBQWUsQ0FBQztRQUU5RSxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUU5QyxJQUFHLENBQUEsQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLEtBQUssS0FBSSxJQUFJLEVBQUM7WUFDaEIsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQztTQUN6QztRQUVELElBQUcsQ0FBQyxJQUFJLElBQUksRUFBQztZQUNULE9BQU8sRUFBRSxLQUFLLEVBQUUseUJBQXlCLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBQyxDQUFDO1NBQzNEO1FBRUQsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUU3QyxPQUFPLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTNDLENBQUM7Q0FRSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkaG9jQ29tcGlsZXIgfSBmcm9tIFwiLi4vY29tcGlsZXIvQWRob2NDb21waWxlci5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9Qcm9ncmFtLmpzXCI7XHJcbmltcG9ydCB7IFN5bWJvbFRhYmxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9TeW1ib2xUYWJsZS5qc1wiO1xyXG5pbXBvcnQgeyBIZWFwLCBWYWx1ZSB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBXb3Jrc3BhY2UgfSBmcm9tIFwiLi4vd29ya3NwYWNlL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9tYWluL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRXZhbHVhdG9yIHtcclxuXHJcbiAgICBwcml2YXRlIHByb2dyYW1NYXA6IE1hcDxzdHJpbmcsIE1hcDxudW1iZXIsIFByb2dyYW0+PiA9IG5ldyBNYXAoKTtcclxuICAgIHByaXZhdGUgY29tcGlsZXI6IEFkaG9jQ29tcGlsZXI7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSB3b3Jrc3BhY2U6IFdvcmtzcGFjZSwgcHJpdmF0ZSBtYWluOiBNYWluQmFzZSl7XHJcbiAgICAgICAgdGhpcy5jb21waWxlciA9IG5ldyBBZGhvY0NvbXBpbGVyKG1haW4pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGUoZXhwcmVzc2lvbjogc3RyaW5nLCBzeW1ib2xUYWJsZTogU3ltYm9sVGFibGUpOiB7ZXJyb3I6IHN0cmluZywgcHJvZ3JhbTogUHJvZ3JhbX0ge1xyXG5cclxuICAgICAgICBpZihzeW1ib2xUYWJsZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBwbUVudHJ5ID0gdGhpcy5wcm9ncmFtTWFwLmdldChleHByZXNzaW9uKTtcclxuICAgICAgICBpZihwbUVudHJ5ICE9IG51bGwpe1xyXG4gICAgICAgICAgICBsZXQgcHJvZ3JhbSA9IHBtRW50cnkuZ2V0KHN5bWJvbFRhYmxlLmlkKTtcclxuICAgICAgICAgICAgaWYocHJvZ3JhbSAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7ZXJyb3I6IG51bGwsIHByb2dyYW06IHByb2dyYW19O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcG1FbnRyeSA9IG5ldyBNYXAoKTtcclxuICAgICAgICAgICAgdGhpcy5wcm9ncmFtTWFwLnNldChleHByZXNzaW9uLCBwbUVudHJ5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGVTdG9yZSA9IHRoaXMud29ya3NwYWNlLm1vZHVsZVN0b3JlO1xyXG4gICAgICAgIGxldCBoZWFwOiBIZWFwID0gdGhpcy5tYWluLmdldEludGVycHJldGVyKCkuaGVhcDtcclxuXHJcbiAgICAgICAgaWYgKGV4cHJlc3Npb24ubGVuZ3RoID4gMCAmJiBtb2R1bGVTdG9yZSAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgY29tcGlsYXRpb24gPSB0aGlzLmNvbXBpbGVyLmNvbXBpbGUoZXhwcmVzc2lvbiwgbW9kdWxlU3RvcmUsIGhlYXAsIHN5bWJvbFRhYmxlKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb21waWxhdGlvbi5lcnJvcnMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3I6IGNvbXBpbGF0aW9uLmVycm9yc1swXS50ZXh0LCBwcm9ncmFtOiBudWxsfTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICBwbUVudHJ5LnNldChzeW1ib2xUYWJsZS5pZCwgY29tcGlsYXRpb24ucHJvZ3JhbSk7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtlcnJvcjogbnVsbCwgcHJvZ3JhbTogY29tcGlsYXRpb24ucHJvZ3JhbX07XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtlcnJvcjogXCJMZWVyZXIgQXVzZHJ1Y2tcIiwgcHJvZ3JhbTogbnVsbH07XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGV2YWx1YXRlKGV4cHJlc3Npb246IHN0cmluZywgc3ltYm9sVGFibGU/OiBTeW1ib2xUYWJsZSk6IHsgZXJyb3I6IHN0cmluZywgdmFsdWU6IFZhbHVlIH0ge1xyXG5cclxuICAgICAgICBpZihzeW1ib2xUYWJsZSA9PSBudWxsKSBzeW1ib2xUYWJsZSA9IHRoaXMubWFpbi5nZXREZWJ1Z2dlcigpLmxhc3RTeW1ib2x0YWJsZTtcclxuXHJcbiAgICAgICAgbGV0IGMgPSB0aGlzLmNvbXBpbGUoZXhwcmVzc2lvbiwgc3ltYm9sVGFibGUpO1xyXG5cclxuICAgICAgICBpZihjPy5lcnJvciAhPSBudWxsKXtcclxuICAgICAgICAgICAgcmV0dXJuIHsgZXJyb3I6IGMuZXJyb3IsIHZhbHVlOiBudWxsfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGMgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybiB7IGVycm9yOiBcIkZlaGxlciBiZWltIEtvbXBpbGllcmVuXCIsIHZhbHVlOiBudWxsfTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBpbnRlcnByZXRlciA9IHRoaXMubWFpbi5nZXRJbnRlcnByZXRlcigpO1xyXG5cclxuICAgICAgICByZXR1cm4gaW50ZXJwcmV0ZXIuZXZhbHVhdGUoYy5wcm9ncmFtKTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcblxyXG59Il19