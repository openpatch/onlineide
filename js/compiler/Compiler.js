import { Lexer } from "./lexer/Lexer.js";
import { CodeGenerator } from "./parser/CodeGenerator.js";
import { Parser } from "./parser/Parser.js";
import { TypeResolver } from "./parser/TypeResolver.js";
import { MainEmbedded } from "../embedded/MainEmbedded.js";
export var CompilerStatus;
(function (CompilerStatus) {
    CompilerStatus[CompilerStatus["compiling"] = 0] = "compiling";
    CompilerStatus[CompilerStatus["error"] = 1] = "error";
    CompilerStatus[CompilerStatus["compiledButNothingToRun"] = 2] = "compiledButNothingToRun";
    CompilerStatus[CompilerStatus["readyToRun"] = 3] = "readyToRun";
})(CompilerStatus || (CompilerStatus = {}));
export class Compiler {
    constructor(main) {
        this.main = main;
        this.compilerStatus = CompilerStatus.compiledButNothingToRun;
    }
    compile(moduleStore) {
        var _a, _b;
        this.compilerStatus = CompilerStatus.compiling;
        let t0 = performance.now();
        moduleStore.clearUsagePositions();
        let lexer = new Lexer();
        // 1st pass: lexing
        for (let m of moduleStore.getModules(false)) {
            m.file.dirty = false;
            m.clear();
            let lexed = lexer.lex(m.getProgramTextFromMonacoModel());
            m.errors[0] = lexed.errors;
            m.tokenList = lexed.tokens;
            m.bracketError = lexed.bracketError;
            m.colorInformation = lexed.colorInformation;
            if (m.file.name == ((_b = (_a = this.main.getCurrentlyEditedModule()) === null || _a === void 0 ? void 0 : _a.file) === null || _b === void 0 ? void 0 : _b.name)) {
                if (this.main.getBottomDiv() != null)
                    this.main.getBottomDiv().errorManager.showParenthesisWarning(lexed.bracketError);
            }
        }
        // 2nd pass: parse tokenlist and generate AST
        this.main.getSemicolonAngel().startRegistering();
        let parser = new Parser(false);
        for (let m of moduleStore.getModules(false)) {
            parser.parse(m);
        }
        // 3rd pass: resolve types and populate typeStores; checks intermodular dependencies
        let typeResolver = new TypeResolver(this.main);
        // Klass.count = 0;
        // Interface.count = 0;
        typeResolver.start(moduleStore);
        // console.log("Klass-Klone: " + Klass.count + ", Interface-Klone: " + Interface.count);
        // 4th pass: code generation
        let codeGenerator = new CodeGenerator();
        for (let m of moduleStore.getModules(false)) {
            codeGenerator.start(m, moduleStore);
        }
        let errorfree = true;
        for (let m of moduleStore.getModules(false)) {
            m.dependsOnModulesWithErrors = m.hasErrors();
            if (m.dependsOnModulesWithErrors)
                errorfree = false;
        }
        let done = false;
        while (!done) {
            done = true;
            for (let m of moduleStore.getModules(false)) {
                if (!m.dependsOnModulesWithErrors)
                    for (let m1 of moduleStore.getModules(false)) {
                        if (m.dependsOnModules.get(m1) && m1.dependsOnModulesWithErrors) {
                            m.dependsOnModulesWithErrors = true;
                            done = false;
                            break;
                        }
                    }
            }
        }
        this.atLeastOneModuleIsStartable = false;
        for (let m of moduleStore.getModules(false)) {
            m.isStartable = m.hasMainProgram() && !m.dependsOnModulesWithErrors;
            if (m.isStartable) {
                this.atLeastOneModuleIsStartable = true;
            }
            if (!(this.main instanceof MainEmbedded) || this.main.config.withFileList) {
                m.renderStartButton();
            }
        }
        if (this.atLeastOneModuleIsStartable) {
            this.compilerStatus = CompilerStatus.readyToRun;
        }
        else {
            this.compilerStatus = errorfree ? CompilerStatus.error : CompilerStatus.compiledButNothingToRun;
        }
        let dt = performance.now() - t0;
        dt = Math.round(dt * 100) / 100;
        let message = "Compiled in " + dt + " ms.";
        this.main.getCurrentWorkspace().compilerMessage = message;
        this.main.getSemicolonAngel().healSemicolons();
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcGlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L2NvbXBpbGVyL0NvbXBpbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBUyxLQUFLLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQUNoRCxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFFMUQsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLG9CQUFvQixDQUFDO0FBQzVDLE9BQU8sRUFBRSxZQUFZLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUd4RCxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sNkJBQTZCLENBQUM7QUFJM0QsTUFBTSxDQUFOLElBQVksY0FFWDtBQUZELFdBQVksY0FBYztJQUN0Qiw2REFBUyxDQUFBO0lBQUUscURBQUssQ0FBQTtJQUFFLHlGQUF1QixDQUFBO0lBQUUsK0RBQVUsQ0FBQTtBQUN6RCxDQUFDLEVBRlcsY0FBYyxLQUFkLGNBQWMsUUFFekI7QUFFRCxNQUFNLE9BQU8sUUFBUTtJQU1qQixZQUFvQixJQUFjO1FBQWQsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUpsQyxtQkFBYyxHQUFtQixjQUFjLENBQUMsdUJBQXVCLENBQUM7SUFLeEUsQ0FBQztJQUVELE9BQU8sQ0FBQyxXQUF3Qjs7UUFFNUIsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDO1FBRS9DLElBQUksRUFBRSxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztRQUUzQixXQUFXLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztRQUVsQyxJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssRUFBRSxDQUFDO1FBRXhCLG1CQUFtQjtRQUNuQixLQUFLLElBQUksQ0FBQyxJQUFJLFdBQVcsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDekMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FB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LCBMZXhlciB9IGZyb20gXCIuL2xleGVyL0xleGVyLmpzXCI7XHJcbmltcG9ydCB7IENvZGVHZW5lcmF0b3IgfSBmcm9tIFwiLi9wYXJzZXIvQ29kZUdlbmVyYXRvci5qc1wiO1xyXG5pbXBvcnQgeyBGaWxlLCBNb2R1bGUsIE1vZHVsZVN0b3JlIH0gZnJvbSBcIi4vcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tIFwiLi9wYXJzZXIvUGFyc2VyLmpzXCI7XHJcbmltcG9ydCB7IFR5cGVSZXNvbHZlciB9IGZyb20gXCIuL3BhcnNlci9UeXBlUmVzb2x2ZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9tYWluL01haW4uanNcIjtcclxuaW1wb3J0IHsgTWFpbkJhc2UgfSBmcm9tIFwiLi4vbWFpbi9NYWluQmFzZS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluRW1iZWRkZWQgfSBmcm9tIFwiLi4vZW1iZWRkZWQvTWFpbkVtYmVkZGVkLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBJbnRlcmZhY2UgfSBmcm9tIFwiLi90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBTZW1pY29sb25BbmdlbCB9IGZyb20gXCIuL3BhcnNlci9TZW1pY29sb25BbmdlbC5qc1wiO1xyXG5cclxuZXhwb3J0IGVudW0gQ29tcGlsZXJTdGF0dXMge1xyXG4gICAgY29tcGlsaW5nLCBlcnJvciwgY29tcGlsZWRCdXROb3RoaW5nVG9SdW4sIHJlYWR5VG9SdW5cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIENvbXBpbGVyIHtcclxuXHJcbiAgICBjb21waWxlclN0YXR1czogQ29tcGlsZXJTdGF0dXMgPSBDb21waWxlclN0YXR1cy5jb21waWxlZEJ1dE5vdGhpbmdUb1J1bjtcclxuXHJcbiAgICBhdExlYXN0T25lTW9kdWxlSXNTdGFydGFibGU6IGJvb2xlYW47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluQmFzZSkge1xyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGUobW9kdWxlU3RvcmU6IE1vZHVsZVN0b3JlKTogRXJyb3JbXSB7XHJcblxyXG4gICAgICAgIHRoaXMuY29tcGlsZXJTdGF0dXMgPSBDb21waWxlclN0YXR1cy5jb21waWxpbmc7XHJcblxyXG4gICAgICAgIGxldCB0MCA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG5cclxuICAgICAgICBtb2R1bGVTdG9yZS5jbGVhclVzYWdlUG9zaXRpb25zKCk7XHJcblxyXG4gICAgICAgIGxldCBsZXhlciA9IG5ldyBMZXhlcigpO1xyXG5cclxuICAgICAgICAvLyAxc3QgcGFzczogbGV4aW5nXHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiBtb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICBtLmZpbGUuZGlydHkgPSBmYWxzZTtcclxuICAgICAgICAgICAgbS5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgbGV0IGxleGVkID0gbGV4ZXIubGV4KG0uZ2V0UHJvZ3JhbVRleHRGcm9tTW9uYWNvTW9kZWwoKSk7XHJcblxyXG4gICAgICAgICAgICBtLmVycm9yc1swXSA9IGxleGVkLmVycm9ycztcclxuICAgICAgICAgICAgbS50b2tlbkxpc3QgPSBsZXhlZC50b2tlbnM7XHJcbiAgICAgICAgICAgIG0uYnJhY2tldEVycm9yID0gbGV4ZWQuYnJhY2tldEVycm9yO1xyXG4gICAgICAgICAgICBtLmNvbG9ySW5mb3JtYXRpb24gPSBsZXhlZC5jb2xvckluZm9ybWF0aW9uO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYobS5maWxlLm5hbWUgPT0gdGhpcy5tYWluLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpPy5maWxlPy5uYW1lKXtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKSAhPSBudWxsKSB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCkuZXJyb3JNYW5hZ2VyLnNob3dQYXJlbnRoZXNpc1dhcm5pbmcobGV4ZWQuYnJhY2tldEVycm9yKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gMm5kIHBhc3M6IHBhcnNlIHRva2VubGlzdCBhbmQgZ2VuZXJhdGUgQVNUXHJcblxyXG4gICAgICAgIHRoaXMubWFpbi5nZXRTZW1pY29sb25BbmdlbCgpLnN0YXJ0UmVnaXN0ZXJpbmcoKTtcclxuXHJcbiAgICAgICAgbGV0IHBhcnNlcjogUGFyc2VyID0gbmV3IFBhcnNlcihmYWxzZSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgbW9kdWxlU3RvcmUuZ2V0TW9kdWxlcyhmYWxzZSkpIHtcclxuICAgICAgICAgICAgcGFyc2VyLnBhcnNlKG0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gM3JkIHBhc3M6IHJlc29sdmUgdHlwZXMgYW5kIHBvcHVsYXRlIHR5cGVTdG9yZXM7IGNoZWNrcyBpbnRlcm1vZHVsYXIgZGVwZW5kZW5jaWVzXHJcblxyXG4gICAgICAgIGxldCB0eXBlUmVzb2x2ZXI6IFR5cGVSZXNvbHZlciA9IG5ldyBUeXBlUmVzb2x2ZXIodGhpcy5tYWluKTtcclxuXHJcbiAgICAgICAgLy8gS2xhc3MuY291bnQgPSAwO1xyXG4gICAgICAgIC8vIEludGVyZmFjZS5jb3VudCA9IDA7XHJcbiAgICAgICAgdHlwZVJlc29sdmVyLnN0YXJ0KG1vZHVsZVN0b3JlKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIktsYXNzLUtsb25lOiBcIiArIEtsYXNzLmNvdW50ICsgXCIsIEludGVyZmFjZS1LbG9uZTogXCIgKyBJbnRlcmZhY2UuY291bnQpO1xyXG5cclxuICAgICAgICAvLyA0dGggcGFzczogY29kZSBnZW5lcmF0aW9uXHJcblxyXG4gICAgICAgIGxldCBjb2RlR2VuZXJhdG9yID0gbmV3IENvZGVHZW5lcmF0b3IoKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgbSBvZiBtb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKSkge1xyXG4gICAgICAgICAgICBjb2RlR2VuZXJhdG9yLnN0YXJ0KG0sIG1vZHVsZVN0b3JlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBlcnJvcmZyZWUgPSB0cnVlO1xyXG4gICAgICAgIGZvciAobGV0IG0gb2YgbW9kdWxlU3RvcmUuZ2V0TW9kdWxlcyhmYWxzZSkpIHtcclxuICAgICAgICAgICAgbS5kZXBlbmRzT25Nb2R1bGVzV2l0aEVycm9ycyA9IG0uaGFzRXJyb3JzKCk7XHJcbiAgICAgICAgICAgIGlmKG0uZGVwZW5kc09uTW9kdWxlc1dpdGhFcnJvcnMpIGVycm9yZnJlZSA9IGZhbHNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGRvbmUgPSBmYWxzZTtcclxuICAgICAgICB3aGlsZSghZG9uZSl7XHJcbiAgICAgICAgICAgIGRvbmUgPSB0cnVlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtIG9mIG1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICBpZighbS5kZXBlbmRzT25Nb2R1bGVzV2l0aEVycm9ycylcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IG0xIG9mIG1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYobS5kZXBlbmRzT25Nb2R1bGVzLmdldChtMSkgJiYgbTEuZGVwZW5kc09uTW9kdWxlc1dpdGhFcnJvcnMpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtLmRlcGVuZHNPbk1vZHVsZXNXaXRoRXJyb3JzID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9uZSA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9ICAgICAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9ICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHRoaXMuYXRMZWFzdE9uZU1vZHVsZUlzU3RhcnRhYmxlID0gZmFsc2U7ICAgICAgICBcclxuICAgICAgICBmb3IgKGxldCBtIG9mIG1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpKSB7XHJcbiAgICAgICAgICAgIG0uaXNTdGFydGFibGUgPSBtLmhhc01haW5Qcm9ncmFtKCkgJiYgIW0uZGVwZW5kc09uTW9kdWxlc1dpdGhFcnJvcnM7XHJcbiAgICAgICAgICAgIGlmKG0uaXNTdGFydGFibGUpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hdExlYXN0T25lTW9kdWxlSXNTdGFydGFibGUgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmKCEodGhpcy5tYWluIGluc3RhbmNlb2YgTWFpbkVtYmVkZGVkKSB8fCB0aGlzLm1haW4uY29uZmlnLndpdGhGaWxlTGlzdCl7XHJcbiAgICAgICAgICAgICAgICBtLnJlbmRlclN0YXJ0QnV0dG9uKCk7XHJcbiAgICAgICAgICAgIH0gXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5hdExlYXN0T25lTW9kdWxlSXNTdGFydGFibGUpIHtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29tcGlsZXJTdGF0dXMgPSBDb21waWxlclN0YXR1cy5yZWFkeVRvUnVuO1xyXG5cclxuICAgICAgICB9IGVsc2Uge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb21waWxlclN0YXR1cyA9IGVycm9yZnJlZSA/IENvbXBpbGVyU3RhdHVzLmVycm9yIDogQ29tcGlsZXJTdGF0dXMuY29tcGlsZWRCdXROb3RoaW5nVG9SdW47XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGR0ID0gcGVyZm9ybWFuY2Uubm93KCkgLSB0MDtcclxuICAgICAgICBkdCA9IE1hdGgucm91bmQoZHQgKiAxMDApIC8gMTAwO1xyXG5cclxuICAgICAgICBsZXQgbWVzc2FnZSA9IFwiQ29tcGlsZWQgaW4gXCIgKyBkdCArIFwiIG1zLlwiO1xyXG5cclxuICAgICAgICB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLmNvbXBpbGVyTWVzc2FnZSA9IG1lc3NhZ2U7XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi5nZXRTZW1pY29sb25BbmdlbCgpLmhlYWxTZW1pY29sb25zKCk7XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxufSJdfQ==