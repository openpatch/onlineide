import { Lexer } from "./lexer/Lexer.js";
import { CodeGenerator } from "./parser/CodeGenerator.js";
import { Module, ModuleStore } from "./parser/Module.js";
import { Parser } from "./parser/Parser.js";
import { getArrayType } from "./parser/TypeResolver.js";
import { SymbolTable } from "./parser/SymbolTable.js";
import { TokenType } from "./lexer/Token.js";
export class AdhocCompiler {
    constructor(main) {
        this.main = main;
        this.moduleStore = new ModuleStore(this.main, true);
        this.lexer = new Lexer();
        this.parser = new Parser(true);
        this.codeGenerator = new CodeGenerator();
        this.module = new Module(null, main);
    }
    compile(code, moduleStore, heap, symbolTable) {
        let t0 = performance.now();
        let errors = [];
        this.module.clear();
        if (symbolTable == null) {
            symbolTable = new SymbolTable(null, { column: 1, line: 1, length: 0 }, { column: 1, line: 100, length: 0 });
            symbolTable.beginsNewStackframe = true;
        }
        else {
            symbolTable = symbolTable.getImitation();
        }
        // 1st pass: lexing
        let lexed = this.lexer.lex(code);
        errors = lexed.errors;
        this.module.tokenList = lexed.tokens;
        // 2nd pass: parse tokenlist and generate AST
        let parser = new Parser(true);
        parser.parse(this.module);
        errors = errors.concat(this.module.errors[1]);
        // 3rd pass: resolve types and populate typeStores
        for (let typenode of this.module.typeNodes) {
            if (typenode.resolvedType == null) {
                let resolvedTypeAndModule = moduleStore.getType(typenode.identifier);
                if (resolvedTypeAndModule == null) {
                    errors.push({
                        text: "Der Datentyp " + typenode.identifier + " ist nicht bekannt.",
                        position: typenode.position,
                        level: "error"
                    });
                }
                else {
                    typenode.resolvedType = getArrayType(resolvedTypeAndModule.type, typenode.arrayDimension);
                }
            }
        }
        // 4th pass: code generation
        // let codeGeneratorErrors = this.codeGenerator
        //     .startAdhocCompilation(this.module, this.moduleStore, symbolTable, heap);
        let codeGeneratorErrors = this.codeGenerator
            .startAdhocCompilation(this.module, moduleStore, symbolTable, heap);
        errors = errors.concat(codeGeneratorErrors);
        if (errors.length == 0) {
            let statements = this.module.mainProgram.statements;
            for (let statement of statements) {
                statement.stepFinished = false;
            }
            if (statements.length > 0 && statements[statements.length - 1].type == TokenType.programEnd) {
                statements.splice(statements.length - 1, 1);
            }
        }
        let dt = performance.now() - t0;
        dt = Math.round(dt * 100) / 100;
        return {
            program: this.module.mainProgram,
            errors: errors,
            symbolTable: symbolTable
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWRob2NDb21waWxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvY29tcGlsZXIvQWRob2NDb21waWxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQVMsS0FBSyxFQUFFLE1BQU0sa0JBQWtCLENBQUM7QUFDaEQsT0FBTyxFQUFFLGFBQWEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQzFELE9BQU8sRUFBUSxNQUFNLEVBQUUsV0FBVyxFQUFFLE1BQU0sb0JBQW9CLENBQUM7QUFDL0QsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQzVDLE9BQU8sRUFBZ0IsWUFBWSxFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDdEUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBS3RELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQVM3QyxNQUFNLE9BQU8sYUFBYTtJQVF0QixZQUFvQixJQUFjO1FBQWQsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUM5QixJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDL0IsSUFBSSxDQUFDLGFBQWEsR0FBRyxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ3pDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCxPQUFPLENBQUMsSUFBWSxFQUFFLFdBQXdCLEVBQUUsSUFBVSxFQUFFLFdBQXlCO1FBRWpGLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxH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Q0FBQyxDQUFDLENBQUM7YUFDL0M7U0FFSjtRQUVELElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7UUFDaEMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUVoQyxPQUFPO1lBQ0gsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVztZQUNoQyxNQUFNLEVBQUUsTUFBTTtZQUNkLFdBQVcsRUFBRSxXQUFXO1NBQzNCLENBQUM7SUFDTixDQUFDO0NBR0oiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFcnJvciwgTGV4ZXIgfSBmcm9tIFwiLi9sZXhlci9MZXhlci5qc1wiO1xyXG5pbXBvcnQgeyBDb2RlR2VuZXJhdG9yIH0gZnJvbSBcIi4vcGFyc2VyL0NvZGVHZW5lcmF0b3IuanNcIjtcclxuaW1wb3J0IHsgRmlsZSwgTW9kdWxlLCBNb2R1bGVTdG9yZSB9IGZyb20gXCIuL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSBcIi4vcGFyc2VyL1BhcnNlci5qc1wiO1xyXG5pbXBvcnQgeyBUeXBlUmVzb2x2ZXIsIGdldEFycmF5VHlwZSB9IGZyb20gXCIuL3BhcnNlci9UeXBlUmVzb2x2ZXIuanNcIjtcclxuaW1wb3J0IHsgU3ltYm9sVGFibGUgfSBmcm9tIFwiLi9wYXJzZXIvU3ltYm9sVGFibGUuanNcIjtcclxuaW1wb3J0IHsgUHJvZ3JhbSB9IGZyb20gXCIuL3BhcnNlci9Qcm9ncmFtLmpzXCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZSB9IGZyb20gXCIuLi93b3Jrc3BhY2UvV29ya3NwYWNlLmpzXCI7XHJcbmltcG9ydCB7IEhlYXAgfSBmcm9tIFwiLi90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBUb2tlblR5cGUgfSBmcm9tIFwiLi9sZXhlci9Ub2tlbi5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9tYWluL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBDb21waWxhdGlvbiA9IHtcclxuICAgIGVycm9yczogRXJyb3JbXSxcclxuICAgIHByb2dyYW06IFByb2dyYW0sXHJcbiAgICBzeW1ib2xUYWJsZTogU3ltYm9sVGFibGVcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFkaG9jQ29tcGlsZXIge1xyXG5cclxuICAgIG1vZHVsZVN0b3JlOiBNb2R1bGVTdG9yZTtcclxuICAgIGxleGVyOiBMZXhlcjtcclxuICAgIG1vZHVsZTogTW9kdWxlO1xyXG4gICAgcGFyc2VyOiBQYXJzZXI7XHJcbiAgICBjb2RlR2VuZXJhdG9yOiBDb2RlR2VuZXJhdG9yO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbkJhc2UpIHtcclxuICAgICAgICB0aGlzLm1vZHVsZVN0b3JlID0gbmV3IE1vZHVsZVN0b3JlKHRoaXMubWFpbiwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy5sZXhlciA9IG5ldyBMZXhlcigpO1xyXG4gICAgICAgIHRoaXMucGFyc2VyID0gbmV3IFBhcnNlcih0cnVlKTtcclxuICAgICAgICB0aGlzLmNvZGVHZW5lcmF0b3IgPSBuZXcgQ29kZUdlbmVyYXRvcigpO1xyXG4gICAgICAgIHRoaXMubW9kdWxlID0gbmV3IE1vZHVsZShudWxsLCBtYWluKTtcclxuICAgIH1cclxuXHJcbiAgICBjb21waWxlKGNvZGU6IHN0cmluZywgbW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlLCBoZWFwOiBIZWFwLCBzeW1ib2xUYWJsZT86IFN5bWJvbFRhYmxlKTogQ29tcGlsYXRpb24ge1xyXG5cclxuICAgICAgICBsZXQgdDAgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuXHJcbiAgICAgICAgbGV0IGVycm9yczogRXJyb3JbXSA9IFtdO1xyXG5cclxuICAgICAgICB0aGlzLm1vZHVsZS5jbGVhcigpO1xyXG4gICAgICAgIGlmIChzeW1ib2xUYWJsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHN5bWJvbFRhYmxlID0gbmV3IFN5bWJvbFRhYmxlKG51bGwsIHsgY29sdW1uOiAxLCBsaW5lOiAxLCBsZW5ndGg6IDAgfSwgeyBjb2x1bW46IDEsIGxpbmU6IDEwMCwgbGVuZ3RoOiAwIH0pO1xyXG4gICAgICAgICAgICBzeW1ib2xUYWJsZS5iZWdpbnNOZXdTdGFja2ZyYW1lID0gdHJ1ZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBzeW1ib2xUYWJsZSA9IHN5bWJvbFRhYmxlLmdldEltaXRhdGlvbigpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMXN0IHBhc3M6IGxleGluZ1xyXG4gICAgICAgIGxldCBsZXhlZCA9IHRoaXMubGV4ZXIubGV4KGNvZGUpO1xyXG4gICAgICAgIGVycm9ycyA9IGxleGVkLmVycm9ycztcclxuICAgICAgICB0aGlzLm1vZHVsZS50b2tlbkxpc3QgPSBsZXhlZC50b2tlbnM7XHJcblxyXG4gICAgICAgIC8vIDJuZCBwYXNzOiBwYXJzZSB0b2tlbmxpc3QgYW5kIGdlbmVyYXRlIEFTVFxyXG5cclxuICAgICAgICBsZXQgcGFyc2VyOiBQYXJzZXIgPSBuZXcgUGFyc2VyKHRydWUpO1xyXG4gICAgICAgIHBhcnNlci5wYXJzZSh0aGlzLm1vZHVsZSk7XHJcbiAgICAgICAgZXJyb3JzID0gZXJyb3JzLmNvbmNhdCh0aGlzLm1vZHVsZS5lcnJvcnNbMV0pO1xyXG5cclxuICAgICAgICAvLyAzcmQgcGFzczogcmVzb2x2ZSB0eXBlcyBhbmQgcG9wdWxhdGUgdHlwZVN0b3Jlc1xyXG5cclxuICAgICAgICBmb3IgKGxldCB0eXBlbm9kZSBvZiB0aGlzLm1vZHVsZS50eXBlTm9kZXMpIHtcclxuICAgICAgICAgICAgaWYgKHR5cGVub2RlLnJlc29sdmVkVHlwZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgcmVzb2x2ZWRUeXBlQW5kTW9kdWxlID0gbW9kdWxlU3RvcmUuZ2V0VHlwZSh0eXBlbm9kZS5pZGVudGlmaWVyKTtcclxuICAgICAgICAgICAgICAgIGlmIChyZXNvbHZlZFR5cGVBbmRNb2R1bGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVycm9ycy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJEZXIgRGF0ZW50eXAgXCIgKyB0eXBlbm9kZS5pZGVudGlmaWVyICsgXCIgaXN0IG5pY2h0IGJla2FubnQuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiB0eXBlbm9kZS5wb3NpdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV2ZWw6IFwiZXJyb3JcIlxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHR5cGVub2RlLnJlc29sdmVkVHlwZSA9IGdldEFycmF5VHlwZShyZXNvbHZlZFR5cGVBbmRNb2R1bGUudHlwZSwgdHlwZW5vZGUuYXJyYXlEaW1lbnNpb24pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyA0dGggcGFzczogY29kZSBnZW5lcmF0aW9uXHJcblxyXG4gICAgICAgIC8vIGxldCBjb2RlR2VuZXJhdG9yRXJyb3JzID0gdGhpcy5jb2RlR2VuZXJhdG9yXHJcbiAgICAgICAgLy8gICAgIC5zdGFydEFkaG9jQ29tcGlsYXRpb24odGhpcy5tb2R1bGUsIHRoaXMubW9kdWxlU3RvcmUsIHN5bWJvbFRhYmxlLCBoZWFwKTtcclxuICAgICAgICBsZXQgY29kZUdlbmVyYXRvckVycm9ycyA9IHRoaXMuY29kZUdlbmVyYXRvclxyXG4gICAgICAgICAgICAuc3RhcnRBZGhvY0NvbXBpbGF0aW9uKHRoaXMubW9kdWxlLCBtb2R1bGVTdG9yZSwgc3ltYm9sVGFibGUsIGhlYXApO1xyXG4gICAgICAgIGVycm9ycyA9IGVycm9ycy5jb25jYXQoY29kZUdlbmVyYXRvckVycm9ycyk7XHJcblxyXG5cclxuXHJcbiAgICAgICAgaWYgKGVycm9ycy5sZW5ndGggPT0gMCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IHN0YXRlbWVudHMgPSB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbS5zdGF0ZW1lbnRzO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBzdGF0ZW1lbnQgb2Ygc3RhdGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgc3RhdGVtZW50LnN0ZXBGaW5pc2hlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoc3RhdGVtZW50cy5sZW5ndGggPiAwICYmIHN0YXRlbWVudHNbc3RhdGVtZW50cy5sZW5ndGggLSAxXS50eXBlID09IFRva2VuVHlwZS5wcm9ncmFtRW5kKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0ZW1lbnRzLnNwbGljZShzdGF0ZW1lbnRzLmxlbmd0aCAtIDEsIDEpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGR0ID0gcGVyZm9ybWFuY2Uubm93KCkgLSB0MDtcclxuICAgICAgICBkdCA9IE1hdGgucm91bmQoZHQgKiAxMDApIC8gMTAwO1xyXG5cclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBwcm9ncmFtOiB0aGlzLm1vZHVsZS5tYWluUHJvZ3JhbSxcclxuICAgICAgICAgICAgZXJyb3JzOiBlcnJvcnMsXHJcbiAgICAgICAgICAgIHN5bWJvbFRhYmxlOiBzeW1ib2xUYWJsZVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==