import { AdhocCompiler } from "../../../compiler/AdhocCompiler.js";
import { InterpreterState } from "../../../interpreter/Interpreter.js";
import { ConsoleEntry } from "./ConsoleEntry.js";
import { Main } from "../../Main.js";
import { TokenType } from "../../../compiler/lexer/Token.js";
import { Helper } from "../Helper.js";
export class MyConsole {
    constructor(main, $bottomDiv) {
        this.main = main;
        this.$bottomDiv = $bottomDiv;
        this.history = [];
        this.historyPos = 0;
        this.isDirty = false;
        this.readyToExecute = false;
        this.consoleEntries = [];
        this.errorDecoration = [];
        if ($bottomDiv == null)
            return; // Console is only used to highlight exceptions
        this.$consoleTabHeading = $bottomDiv.find('.jo_tabheadings>.jo_console-tab');
        this.$consoleTab = $bottomDiv.find('.jo_tabs>.jo_consoleTab');
    }
    initConsoleClearButton() {
        let that = this;
        let $consoleClear = this.$consoleTabHeading.parent().find('.jo_console-clear');
        this.$consoleTab.on('myshow', () => {
            $consoleClear.show();
            that.editor.layout();
        });
        this.$consoleTab.on('myhide', () => {
            $consoleClear.hide();
        });
        $consoleClear.on('mousedown', (e) => {
            e.stopPropagation();
            that.clear();
        });
    }
    initGUI() {
        if (this.$bottomDiv == null)
            return;
        this.initConsoleClearButton();
        let $editorDiv = this.$consoleTab.find('.jo_commandline');
        this.editor = monaco.editor.create($editorDiv[0], {
            value: [
                ''
            ].join('\n'),
            automaticLayout: false,
            renderLineHighlight: "none",
            renderIndentGuides: false,
            overviewRulerLanes: 0,
            lineNumbers: 'off',
            glyphMargin: false,
            folding: false,
            // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
            lineDecorationsWidth: 0,
            lineNumbersMinChars: 0,
            fixedOverflowWidgets: true,
            language: 'myJava',
            fontSize: 14,
            fontFamily: "Roboto Mono",
            fontWeight: "500",
            roundedSelection: true,
            occurrencesHighlight: false,
            suggest: {
                localityBonus: true,
                snippetsPreventQuickSuggestions: false
            },
            minimap: {
                enabled: false
            },
            scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden'
            },
            theme: "myCustomThemeDark"
        });
        this.editor.layout();
        let that = this;
        this.editor.addCommand(monaco.KeyCode.Enter, () => {
            that.compileIfDirty();
            if (that.readyToExecute) {
                let command = that.editor.getModel().getValue(monaco.editor.EndOfLinePreference.LF, false);
                if (command == "") {
                    return;
                }
                that.history.push(command);
                that.historyPos = 0;
                that.execute();
                that.editor.setValue("");
            }
            else {
                // TODO: Fehlermeldung!
            }
        }, "!suggestWidgetVisible");
        this.editor.addCommand(monaco.KeyCode.UpArrow, () => {
            let nextHistoryPos = that.history.length - (that.historyPos + 1);
            if (nextHistoryPos >= 0) {
                that.historyPos++;
                let text = that.history[nextHistoryPos];
                that.editor.setValue(text);
                that.editor.setPosition({
                    lineNumber: 1,
                    column: text.length + 1
                });
            }
        }, "!suggestWidgetVisible");
        this.editor.addCommand(monaco.KeyCode.DownArrow, () => {
            let nextHistoryPos = that.history.length - (that.historyPos - 1);
            if (nextHistoryPos <= that.history.length - 1) {
                that.historyPos--;
                let text = that.history[nextHistoryPos];
                that.editor.setValue(text);
                that.editor.setPosition({
                    lineNumber: 1,
                    column: text.length + 1
                });
            }
            else {
                that.editor.setValue("");
                that.historyPos = 0;
            }
        }, "!suggestWidgetVisible");
        this.compiler = new AdhocCompiler(this.main);
        let model = this.editor.getModel();
        let lastVersionId = 0;
        model.onDidChangeContent(() => {
            let versionId = model.getAlternativeVersionId();
            if (versionId != lastVersionId) {
                that.isDirty = true;
                lastVersionId = versionId;
            }
        });
        this.startTimer();
        this.$consoleTabHeading.on("mousedown", () => {
            Helper.showHelper("consoleHelper", this.main);
            setTimeout(() => {
                that.editor.focus();
            }, 500);
        });
    }
    startTimer() {
        this.stopTimer();
        let that = this;
        this.timerHandle = setInterval(() => {
            that.compileIfDirty();
        }, 500);
    }
    stopTimer() {
        if (this.timerHandle != null) {
            clearInterval(this.timerHandle);
            this.timerHandle = null;
        }
    }
    compileIfDirty() {
        if (this.isDirty) {
            let command = this.editor.getModel().getValue(monaco.editor.EndOfLinePreference.LF, false);
            let moduleStore = this.main.getCurrentWorkspace().moduleStore;
            let symbolTable = this.main.getDebugger().lastSymboltable;
            let heap = this.main.getInterpreter().heap;
            if (command.length > 0 && moduleStore != null) {
                let compilation = this.compiler.compile(command, moduleStore, heap, symbolTable);
                this.readyToExecute = compilation.errors.length == 0;
                this.showErrors(compilation.errors);
                this.isDirty = false;
            }
            else {
                this.showErrors([]);
            }
        }
    }
    showErrors(errors) {
        let markers = [];
        for (let error of errors) {
            markers.push({
                startLineNumber: error.position.line,
                startColumn: error.position.column,
                endLineNumber: error.position.line,
                endColumn: error.position.column + error.position.length,
                message: error.text,
                severity: monaco.MarkerSeverity.Error
            });
        }
        monaco.editor.setModelMarkers(this.editor.getModel(), 'Fehler', markers);
    }
    execute() {
        let interpreter = this.main.getInterpreter();
        let module = this.compiler.module;
        let command = this.editor.getModel().getValue(monaco.editor.EndOfLinePreference.LF, false);
        let program = module.mainProgram;
        monaco.editor.colorize(command, 'myJava', { tabSize: 3 }).then((command) => {
            // if(this.programHasMethodCalls(program)){
            // this.executeInStepMode(interpreter, program, command);
            // } else {
            this.executeRapidly(interpreter, program, command);
            // }
        });
    }
    programHasMethodCalls(program) {
        for (let statement of program.statements) {
            if (statement.type == TokenType.callMethod && statement.method.invoke == null) {
                return true;
            }
        }
        return false;
    }
    executeInStepMode(interpreter, program, command) {
        interpreter.pushCurrentProgram();
        interpreter.currentProgram = program;
        interpreter.currentProgramPosition = 0;
        let stacksizeBefore = interpreter.stack.length;
        let oldInterpreterState = interpreter.state;
        interpreter.setState(InterpreterState.paused);
        interpreter.start(() => {
            let stackTop;
            if (interpreter.stack.length > stacksizeBefore) {
                stackTop = interpreter.stack.pop();
                while (interpreter.stack.length > stacksizeBefore) {
                    interpreter.stack.pop();
                }
            }
            this.writeConsoleEntry(command, stackTop);
            interpreter.setState(oldInterpreterState);
            if (oldInterpreterState == InterpreterState.paused) {
                interpreter.showProgramPointerAndVariables();
            }
        });
    }
    executeRapidly(interpreter, program, command) {
        let result = interpreter.evaluate(program);
        if (result.error == null) {
            this.writeConsoleEntry(command, result.value);
        }
        else {
            let $entry = jQuery('<div><div>' + command + '</div></div>');
            $entry.append(jQuery('<div class="jo_console-error"> ' + result.error + '</div>'));
            this.writeConsoleEntry($entry, null);
        }
    }
    showTab() {
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        this.$consoleTabHeading.trigger(mousePointer + "down");
    }
    writeConsoleEntry(command, stackTop, color = null) {
        if (this.$consoleTab == null) {
            return;
        }
        let consoleTop = this.$consoleTab.find('.jo_console-top');
        let commandEntry = new ConsoleEntry(command, null, null, null, stackTop == null, color);
        this.consoleEntries.push(commandEntry);
        consoleTop.append(commandEntry.$consoleEntry);
        if (stackTop != null) {
            let resultEntry = new ConsoleEntry(null, stackTop, null, null, true, color);
            this.consoleEntries.push(resultEntry);
            consoleTop.append(resultEntry.$consoleEntry);
        }
        var height = consoleTop[0].scrollHeight;
        consoleTop.scrollTop(height);
    }
    clear() {
        let consoleTop = this.$consoleTab.find('.jo_console-top');
        consoleTop.children().remove(); // empty();
        this.consoleEntries = [];
    }
    detachValues() {
        for (let ce of this.consoleEntries) {
            ce.detachValue();
        }
    }
    showError(m, position) {
        var _a, _b, _c;
        if (this.main instanceof Main) {
            if (((_a = m === null || m === void 0 ? void 0 : m.file) === null || _a === void 0 ? void 0 : _a.name) != ((_c = (_b = this.main.projectExplorer.getCurrentlyEditedModule()) === null || _b === void 0 ? void 0 : _b.file) === null || _c === void 0 ? void 0 : _c.name)) {
                this.main.editor.dontDetectLastChange();
                this.main.projectExplorer.setModuleActive(m);
            }
        }
        let range = {
            startColumn: position.column, startLineNumber: position.line,
            endColumn: position.column + position.length, endLineNumber: position.line
        };
        this.main.getMonacoEditor().revealRangeInCenter(range);
        this.errorDecoration = this.main.getMonacoEditor().deltaDecorations(this.errorDecoration, [
            {
                range: range,
                options: { className: 'jo_revealError' }
            },
            {
                range: range,
                options: { className: 'jo_revealErrorWholeLine', isWholeLine: true }
            }
        ]);
    }
    clearErrors() {
        this.errorDecoration = this.main.getMonacoEditor().deltaDecorations(this.errorDecoration, []);
    }
    clearExceptions() {
        if (this.$bottomDiv == null)
            return;
        let $consoleTop = this.$consoleTab.find('.jo_console-top');
        $consoleTop.find('.jo_exception').parents('.jo_consoleEntry').remove();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlDb25zb2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9jb25zb2xlL015Q29uc29sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFHbkUsT0FBTyxFQUFFLGdCQUFnQixFQUFlLE1BQU0scUNBQXFDLENBQUM7QUFDcEYsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFckMsT0FBTyxFQUFnQixTQUFTLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUUzRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBR3RDLE1BQU0sT0FBTyxTQUFTO0lBa0JsQixZQUFvQixJQUFjLEVBQVMsVUFBK0I7UUFBdEQsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUFTLGVBQVUsR0FBVixVQUFVLENBQXFCO1FBZjFFLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFDdkIsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUd2QixZQUFPLEdBQVksS0FBSyxDQUFDO1FBQ3pCLG1CQUFjLEdBQVksS0FBSyxDQUFDO1FBSWhDLG1CQUFjLEdBQW1CLEVBQUUsQ0FBQztRQUVwQyxvQkFBZSxHQUFhLEVBQUUsQ0FBQztRQUszQixJQUFHLFVBQVUsSUFBSSxJQUFJO1lBQUUsT0FBTyxDQUFDLCtDQUErQztRQUU5RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxzQkFBc0I7UUFFbEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhC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QUFDLGVBQWUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3RGO2dCQUNJLEtBQUssRUFBRSxLQUFLO2dCQUNaLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRTthQUUzQztZQUNEO2dCQUNJLEtBQUssRUFBRSxLQUFLO2dCQUNaLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSx5QkFBeUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFO2FBRXZFO1NBQ0osQ0FBQyxDQUFDO0lBR1AsQ0FBQztJQUVELFdBQVc7UUFDUCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUN6RixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsZUFBZTtRQUNYLElBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJO1lBQUUsT0FBTztRQUNuQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzNELFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDM0UsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRob2NDb21waWxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21waWxlci9BZGhvY0NvbXBpbGVyLmpzXCI7XHJcbmltcG9ydCB7IEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL2xleGVyL0xleGVyLmpzXCI7XHJcbmltcG9ydCB7IEhlYXAsIFZhbHVlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyU3RhdGUsIEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IENvbnNvbGVFbnRyeSB9IGZyb20gXCIuL0NvbnNvbGVFbnRyeS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uLy4uL01haW4uanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgVGV4dFBvc2l0aW9uLCBUb2tlblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgUHJvZ3JhbSB9IGZyb20gXCIuLi8uLi8uLi9jb21waWxlci9wYXJzZXIvUHJvZ3JhbS5qc1wiO1xyXG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vSGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uLy4uL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTXlDb25zb2xlIHtcclxuXHJcbiAgICBlZGl0b3I6IG1vbmFjby5lZGl0b3IuSVN0YW5kYWxvbmVDb2RlRWRpdG9yO1xyXG4gICAgaGlzdG9yeTogc3RyaW5nW10gPSBbXTtcclxuICAgIGhpc3RvcnlQb3M6IG51bWJlciA9IDA7XHJcblxyXG4gICAgdGltZXJIYW5kbGU6IGFueTtcclxuICAgIGlzRGlydHk6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHJlYWR5VG9FeGVjdXRlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgY29tcGlsZXI6IEFkaG9jQ29tcGlsZXI7XHJcblxyXG4gICAgY29uc29sZUVudHJpZXM6IENvbnNvbGVFbnRyeVtdID0gW107XHJcblxyXG4gICAgZXJyb3JEZWNvcmF0aW9uOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgJGNvbnNvbGVUYWJIZWFkaW5nOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJGNvbnNvbGVUYWI6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluQmFzZSwgcHVibGljICRib3R0b21EaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4pe1xyXG4gICAgICAgIGlmKCRib3R0b21EaXYgPT0gbnVsbCkgcmV0dXJuOyAvLyBDb25zb2xlIGlzIG9ubHkgdXNlZCB0byBoaWdobGlnaHQgZXhjZXB0aW9uc1xyXG5cclxuICAgICAgICB0aGlzLiRjb25zb2xlVGFiSGVhZGluZyA9ICRib3R0b21EaXYuZmluZCgnLmpvX3RhYmhlYWRpbmdzPi5qb19jb25zb2xlLXRhYicpO1xyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVUYWIgPSAkYm90dG9tRGl2LmZpbmQoJy5qb190YWJzPi5qb19jb25zb2xlVGFiJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdENvbnNvbGVDbGVhckJ1dHRvbigpe1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCAkY29uc29sZUNsZWFyID0gdGhpcy4kY29uc29sZVRhYkhlYWRpbmcucGFyZW50KCkuZmluZCgnLmpvX2NvbnNvbGUtY2xlYXInKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29uc29sZVRhYi5vbignbXlzaG93JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAkY29uc29sZUNsZWFyLnNob3coKTtcclxuICAgICAgICAgICAgdGhhdC5lZGl0b3IubGF5b3V0KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVUYWIub24oJ215aGlkZScsICgpID0+IHtcclxuICAgICAgICAgICAgJGNvbnNvbGVDbGVhci5oaWRlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICRjb25zb2xlQ2xlYXIub24oJ21vdXNlZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoYXQuY2xlYXIoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuXHJcbiAgICAgICAgaWYodGhpcy4kYm90dG9tRGl2ID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0Q29uc29sZUNsZWFyQnV0dG9uKCk7XHJcblxyXG4gICAgICAgIGxldCAkZWRpdG9yRGl2ID0gdGhpcy4kY29uc29sZVRhYi5maW5kKCcuam9fY29tbWFuZGxpbmUnKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBtb25hY28uZWRpdG9yLmNyZWF0ZSgkZWRpdG9yRGl2WzBdLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBbXHJcbiAgICAgICAgICAgICAgICAnJ1xyXG4gICAgICAgICAgICBdLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICBhdXRvbWF0aWNMYXlvdXQ6IGZhbHNlLFxyXG4gICAgICAgICAgICByZW5kZXJMaW5lSGlnaGxpZ2h0OiBcIm5vbmVcIixcclxuICAgICAgICAgICAgcmVuZGVySW5kZW50R3VpZGVzOiBmYWxzZSxcclxuICAgICAgICAgICAgb3ZlcnZpZXdSdWxlckxhbmVzOiAwLFxyXG4gICAgICAgICAgICBsaW5lTnVtYmVyczogJ29mZicsXHJcbiAgICAgICAgICAgIGdseXBoTWFyZ2luOiBmYWxzZSxcclxuICAgICAgICAgICAgZm9sZGluZzogZmFsc2UsXHJcbiAgICAgICAgICAgIC8vIFVuZG9jdW1lbnRlZCBzZWUgaHR0cHM6Ly9naXRodWIuY29tL01pY3Jvc29mdC92c2NvZGUvaXNzdWVzLzMwNzk1I2lzc3VlY29tbWVudC00MTA5OTg4ODJcclxuICAgICAgICAgICAgbGluZURlY29yYXRpb25zV2lkdGg6IDAsXHJcbiAgICAgICAgICAgIGxpbmVOdW1iZXJzTWluQ2hhcnM6IDAsXHJcbiAgICAgICAgICAgIGZpeGVkT3ZlcmZsb3dXaWRnZXRzOiB0cnVlLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogJ215SmF2YScsXHJcblxyXG4gICAgICAgICAgICBmb250U2l6ZTogMTQsXHJcbiAgICAgICAgICAgIGZvbnRGYW1pbHk6IFwiUm9ib3RvIE1vbm9cIixcclxuICAgICAgICAgICAgZm9udFdlaWdodDogXCI1MDBcIixcclxuICAgICAgICAgICAgcm91bmRlZFNlbGVjdGlvbjogdHJ1ZSxcclxuICAgICAgICAgICAgb2NjdXJyZW5jZXNIaWdobGlnaHQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBzdWdnZXN0OiB7IFxyXG4gICAgICAgICAgICAgICAgbG9jYWxpdHlCb251czogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNuaXBwZXRzUHJldmVudFF1aWNrU3VnZ2VzdGlvbnM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG1pbmltYXA6IHtcclxuICAgICAgICAgICAgICAgIGVuYWJsZWQ6IGZhbHNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNjcm9sbGJhcjoge1xyXG4gICAgICAgICAgICAgICAgdmVydGljYWw6ICdoaWRkZW4nLFxyXG4gICAgICAgICAgICAgICAgaG9yaXpvbnRhbDogJ2hpZGRlbidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGhlbWU6IFwibXlDdXN0b21UaGVtZURhcmtcIlxyXG5cclxuICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IubGF5b3V0KCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvci5hZGRDb21tYW5kKG1vbmFjby5LZXlDb2RlLkVudGVyLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICB0aGF0LmNvbXBpbGVJZkRpcnR5KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhhdC5yZWFkeVRvRXhlY3V0ZSkge1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSB0aGF0LmVkaXRvci5nZXRNb2RlbCgpLmdldFZhbHVlKG1vbmFjby5lZGl0b3IuRW5kT2ZMaW5lUHJlZmVyZW5jZS5MRiwgZmFsc2UpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKGNvbW1hbmQgPT0gXCJcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuaGlzdG9yeS5wdXNoKGNvbW1hbmQpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaXN0b3J5UG9zID0gMDtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmV4ZWN1dGUoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmVkaXRvci5zZXRWYWx1ZShcIlwiKTtcclxuXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiBGZWhsZXJtZWxkdW5nIVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICB9LCBcIiFzdWdnZXN0V2lkZ2V0VmlzaWJsZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IuYWRkQ29tbWFuZChtb25hY28uS2V5Q29kZS5VcEFycm93LCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgbmV4dEhpc3RvcnlQb3MgPSB0aGF0Lmhpc3RvcnkubGVuZ3RoIC0gKHRoYXQuaGlzdG9yeVBvcyArIDEpO1xyXG4gICAgICAgICAgICBpZiAobmV4dEhpc3RvcnlQb3MgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaXN0b3J5UG9zKys7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGV4dCA9IHRoYXQuaGlzdG9yeVtuZXh0SGlzdG9yeVBvc107XHJcbiAgICAgICAgICAgICAgICB0aGF0LmVkaXRvci5zZXRWYWx1ZSh0ZXh0KTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldFBvc2l0aW9uKHtcclxuICAgICAgICAgICAgICAgICAgICBsaW5lTnVtYmVyOiAxLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbHVtbjogdGV4dC5sZW5ndGggKyAxXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0sIFwiIXN1Z2dlc3RXaWRnZXRWaXNpYmxlXCIpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvci5hZGRDb21tYW5kKG1vbmFjby5LZXlDb2RlLkRvd25BcnJvdywgKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgbGV0IG5leHRIaXN0b3J5UG9zID0gdGhhdC5oaXN0b3J5Lmxlbmd0aCAtICh0aGF0Lmhpc3RvcnlQb3MgLSAxKTtcclxuICAgICAgICAgICAgaWYgKG5leHRIaXN0b3J5UG9zIDw9IHRoYXQuaGlzdG9yeS5sZW5ndGggLSAxKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lmhpc3RvcnlQb3MtLTtcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gdGhhdC5oaXN0b3J5W25leHRIaXN0b3J5UG9zXTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldFZhbHVlKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5lZGl0b3Iuc2V0UG9zaXRpb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uOiB0ZXh0Lmxlbmd0aCArIDFcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmVkaXRvci5zZXRWYWx1ZShcIlwiKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuaGlzdG9yeVBvcyA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgXCIhc3VnZ2VzdFdpZGdldFZpc2libGVcIik7XHJcblxyXG4gICAgICAgIHRoaXMuY29tcGlsZXIgPSBuZXcgQWRob2NDb21waWxlcih0aGlzLm1haW4pO1xyXG5cclxuICAgICAgICBsZXQgbW9kZWwgPSB0aGlzLmVkaXRvci5nZXRNb2RlbCgpO1xyXG4gICAgICAgIGxldCBsYXN0VmVyc2lvbklkID0gMDtcclxuXHJcbiAgICAgICAgbW9kZWwub25EaWRDaGFuZ2VDb250ZW50KCgpID0+IHtcclxuICAgICAgICAgICAgbGV0IHZlcnNpb25JZCA9IG1vZGVsLmdldEFsdGVybmF0aXZlVmVyc2lvbklkKCk7XHJcblxyXG4gICAgICAgICAgICBpZiAodmVyc2lvbklkICE9IGxhc3RWZXJzaW9uSWQpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuaXNEaXJ0eSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBsYXN0VmVyc2lvbklkID0gdmVyc2lvbklkO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuc3RhcnRUaW1lcigpO1xyXG5cclxuICAgICAgICB0aGlzLiRjb25zb2xlVGFiSGVhZGluZy5vbihcIm1vdXNlZG93blwiLCAoKT0+e1xyXG4gICAgICAgICAgICBIZWxwZXIuc2hvd0hlbHBlcihcImNvbnNvbGVIZWxwZXJcIiwgdGhpcy5tYWluKTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5lZGl0b3IuZm9jdXMoKTtcclxuICAgICAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRUaW1lcigpIHtcclxuICAgICAgICB0aGlzLnN0b3BUaW1lcigpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy50aW1lckhhbmRsZSA9IHNldEludGVydmFsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoYXQuY29tcGlsZUlmRGlydHkoKTtcclxuXHJcbiAgICAgICAgfSwgNTAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RvcFRpbWVyKCkge1xyXG4gICAgICAgIGlmICh0aGlzLnRpbWVySGFuZGxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnRpbWVySGFuZGxlKTtcclxuICAgICAgICAgICAgdGhpcy50aW1lckhhbmRsZSA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgY29tcGlsZUlmRGlydHkoKSB7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmlzRGlydHkpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBjb21tYW5kID0gdGhpcy5lZGl0b3IuZ2V0TW9kZWwoKS5nZXRWYWx1ZShtb25hY28uZWRpdG9yLkVuZE9mTGluZVByZWZlcmVuY2UuTEYsIGZhbHNlKTtcclxuICAgICAgICAgICAgbGV0IG1vZHVsZVN0b3JlID0gdGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5tb2R1bGVTdG9yZTtcclxuICAgICAgICAgICAgbGV0IHN5bWJvbFRhYmxlID0gdGhpcy5tYWluLmdldERlYnVnZ2VyKCkubGFzdFN5bWJvbHRhYmxlO1xyXG4gICAgICAgICAgICBsZXQgaGVhcCA9IHRoaXMubWFpbi5nZXRJbnRlcnByZXRlcigpLmhlYXA7XHJcblxyXG4gICAgICAgICAgICBpZiAoY29tbWFuZC5sZW5ndGggPiAwICYmIG1vZHVsZVN0b3JlICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY29tcGlsYXRpb24gPSB0aGlzLmNvbXBpbGVyLmNvbXBpbGUoY29tbWFuZCwgbW9kdWxlU3RvcmUsIGhlYXAsIHN5bWJvbFRhYmxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlYWR5VG9FeGVjdXRlID0gY29tcGlsYXRpb24uZXJyb3JzLmxlbmd0aCA9PSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9ycyhjb21waWxhdGlvbi5lcnJvcnMpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuaXNEaXJ0eSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2hvd0Vycm9ycyhbXSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzaG93RXJyb3JzKGVycm9yczogRXJyb3JbXSkge1xyXG5cclxuICAgICAgICBsZXQgbWFya2VyczogbW9uYWNvLmVkaXRvci5JTWFya2VyRGF0YVtdID0gW107XHJcblxyXG4gICAgICAgIGZvciAobGV0IGVycm9yIG9mIGVycm9ycykge1xyXG4gICAgICAgICAgICBtYXJrZXJzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBlcnJvci5wb3NpdGlvbi5saW5lLFxyXG4gICAgICAgICAgICAgICAgc3RhcnRDb2x1bW46IGVycm9yLnBvc2l0aW9uLmNvbHVtbixcclxuICAgICAgICAgICAgICAgIGVuZExpbmVOdW1iZXI6IGVycm9yLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICBlbmRDb2x1bW46IGVycm9yLnBvc2l0aW9uLmNvbHVtbiArIGVycm9yLnBvc2l0aW9uLmxlbmd0aCxcclxuICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLnRleHQsXHJcbiAgICAgICAgICAgICAgICBzZXZlcml0eTogbW9uYWNvLk1hcmtlclNldmVyaXR5LkVycm9yXHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIG1vbmFjby5lZGl0b3Iuc2V0TW9kZWxNYXJrZXJzKHRoaXMuZWRpdG9yLmdldE1vZGVsKCksICdGZWhsZXInLCBtYXJrZXJzKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZSgpIHtcclxuXHJcbiAgICAgICAgbGV0IGludGVycHJldGVyID0gdGhpcy5tYWluLmdldEludGVycHJldGVyKCk7XHJcbiAgICAgICAgbGV0IG1vZHVsZSA9IHRoaXMuY29tcGlsZXIubW9kdWxlO1xyXG4gICAgICAgIGxldCBjb21tYW5kID0gdGhpcy5lZGl0b3IuZ2V0TW9kZWwoKS5nZXRWYWx1ZShtb25hY28uZWRpdG9yLkVuZE9mTGluZVByZWZlcmVuY2UuTEYsIGZhbHNlKTtcclxuICAgICAgICBsZXQgcHJvZ3JhbSA9IG1vZHVsZS5tYWluUHJvZ3JhbTtcclxuXHJcbiAgICAgICAgbW9uYWNvLmVkaXRvci5jb2xvcml6ZShjb21tYW5kLCAnbXlKYXZhJywgeyB0YWJTaXplOiAzIH0pLnRoZW4oKGNvbW1hbmQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIC8vIGlmKHRoaXMucHJvZ3JhbUhhc01ldGhvZENhbGxzKHByb2dyYW0pKXtcclxuICAgICAgICAgICAgICAgIC8vIHRoaXMuZXhlY3V0ZUluU3RlcE1vZGUoaW50ZXJwcmV0ZXIsIHByb2dyYW0sIGNvbW1hbmQpO1xyXG4gICAgICAgICAgICAvLyB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5leGVjdXRlUmFwaWRseShpbnRlcnByZXRlciwgcHJvZ3JhbSwgY29tbWFuZCk7XHJcbiAgICAgICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG4gICAgcHJvZ3JhbUhhc01ldGhvZENhbGxzKHByb2dyYW06IFByb2dyYW0pOiBib29sZWFuIHtcclxuICAgICAgICBcclxuICAgICAgICBmb3IobGV0IHN0YXRlbWVudCBvZiBwcm9ncmFtLnN0YXRlbWVudHMpe1xyXG4gICAgICAgICAgICBpZihzdGF0ZW1lbnQudHlwZSA9PSBUb2tlblR5cGUuY2FsbE1ldGhvZCAmJiBzdGF0ZW1lbnQubWV0aG9kLmludm9rZSA9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZUluU3RlcE1vZGUoaW50ZXJwcmV0ZXI6IEludGVycHJldGVyLCBwcm9ncmFtOiBQcm9ncmFtLCBjb21tYW5kOiBzdHJpbmcgKXtcclxuXHJcbiAgICAgICAgaW50ZXJwcmV0ZXIucHVzaEN1cnJlbnRQcm9ncmFtKCk7XHJcblxyXG4gICAgICAgIGludGVycHJldGVyLmN1cnJlbnRQcm9ncmFtID0gcHJvZ3JhbTtcclxuICAgICAgICBpbnRlcnByZXRlci5jdXJyZW50UHJvZ3JhbVBvc2l0aW9uID0gMDtcclxuXHJcbiAgICAgICAgbGV0IHN0YWNrc2l6ZUJlZm9yZSA9IGludGVycHJldGVyLnN0YWNrLmxlbmd0aDtcclxuICAgICAgICBsZXQgb2xkSW50ZXJwcmV0ZXJTdGF0ZSA9IGludGVycHJldGVyLnN0YXRlO1xyXG5cclxuICAgICAgICBpbnRlcnByZXRlci5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLnBhdXNlZCk7XHJcblxyXG4gICAgICAgIGludGVycHJldGVyLnN0YXJ0KCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBzdGFja1RvcDogVmFsdWU7XHJcbiAgICAgICAgICAgIGlmIChpbnRlcnByZXRlci5zdGFjay5sZW5ndGggPiBzdGFja3NpemVCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgIHN0YWNrVG9wID0gaW50ZXJwcmV0ZXIuc3RhY2sucG9wKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgd2hpbGUgKGludGVycHJldGVyLnN0YWNrLmxlbmd0aCA+IHN0YWNrc2l6ZUJlZm9yZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGludGVycHJldGVyLnN0YWNrLnBvcCgpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy53cml0ZUNvbnNvbGVFbnRyeShjb21tYW5kLCBzdGFja1RvcCk7XHJcblxyXG4gICAgICAgICAgICBpbnRlcnByZXRlci5zZXRTdGF0ZShvbGRJbnRlcnByZXRlclN0YXRlKTtcclxuICAgICAgICAgICAgaWYgKG9sZEludGVycHJldGVyU3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpIHtcclxuICAgICAgICAgICAgICAgIGludGVycHJldGVyLnNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlUmFwaWRseShpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXIsIHByb2dyYW06IFByb2dyYW0sIGNvbW1hbmQ6IHN0cmluZyApe1xyXG5cclxuICAgICAgICBsZXQgcmVzdWx0ID0gaW50ZXJwcmV0ZXIuZXZhbHVhdGUocHJvZ3JhbSk7XHJcblxyXG4gICAgICAgIGlmKHJlc3VsdC5lcnJvciA9PSBudWxsKXtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVDb25zb2xlRW50cnkoY29tbWFuZCwgcmVzdWx0LnZhbHVlKTtcclxuXHJcbiAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgIGxldCAkZW50cnkgPSBqUXVlcnkoJzxkaXY+PGRpdj4nICsgY29tbWFuZCArICc8L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgJGVudHJ5LmFwcGVuZChqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19jb25zb2xlLWVycm9yXCI+ICcgKyByZXN1bHQuZXJyb3IgKyAnPC9kaXY+JykpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy53cml0ZUNvbnNvbGVFbnRyeSgkZW50cnksIG51bGwpXHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNob3dUYWIoKXtcclxuICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVUYWJIZWFkaW5nLnRyaWdnZXIobW91c2VQb2ludGVyICsgXCJkb3duXCIpO1xyXG4gICAgfVxyXG5cclxuICAgIHdyaXRlQ29uc29sZUVudHJ5KGNvbW1hbmQ6IHN0cmluZ3xKUXVlcnk8SFRNTEVsZW1lbnQ+LCBzdGFja1RvcDogVmFsdWUsIGNvbG9yOiBzdHJpbmcgPSBudWxsKSB7XHJcblxyXG4gICAgICAgIGlmKHRoaXMuJGNvbnNvbGVUYWIgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0IGNvbnNvbGVUb3AgPSB0aGlzLiRjb25zb2xlVGFiLmZpbmQoJy5qb19jb25zb2xlLXRvcCcpO1xyXG5cclxuICAgICAgICBsZXQgY29tbWFuZEVudHJ5ID0gbmV3IENvbnNvbGVFbnRyeShjb21tYW5kLCBudWxsLCBudWxsLCBudWxsLCBzdGFja1RvcCA9PSBudWxsLCBjb2xvcik7XHJcbiAgICAgICAgdGhpcy5jb25zb2xlRW50cmllcy5wdXNoKGNvbW1hbmRFbnRyeSk7XHJcbiAgICAgICAgY29uc29sZVRvcC5hcHBlbmQoY29tbWFuZEVudHJ5LiRjb25zb2xlRW50cnkpO1xyXG5cclxuICAgICAgICBpZihzdGFja1RvcCAhPSBudWxsKXtcclxuICAgICAgICAgICAgbGV0IHJlc3VsdEVudHJ5ID0gbmV3IENvbnNvbGVFbnRyeShudWxsLCBzdGFja1RvcCwgbnVsbCwgbnVsbCwgdHJ1ZSwgY29sb3IpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbnNvbGVFbnRyaWVzLnB1c2gocmVzdWx0RW50cnkpO1xyXG4gICAgICAgICAgICBjb25zb2xlVG9wLmFwcGVuZChyZXN1bHRFbnRyeS4kY29uc29sZUVudHJ5KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciBoZWlnaHQgPSBjb25zb2xlVG9wWzBdLnNjcm9sbEhlaWdodDtcclxuICAgICAgICBjb25zb2xlVG9wLnNjcm9sbFRvcChoZWlnaHQpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjbGVhcigpIHtcclxuICAgICAgICBsZXQgY29uc29sZVRvcCA9IHRoaXMuJGNvbnNvbGVUYWIuZmluZCgnLmpvX2NvbnNvbGUtdG9wJyk7XHJcbiAgICAgICAgY29uc29sZVRvcC5jaGlsZHJlbigpLnJlbW92ZSgpOyAvLyBlbXB0eSgpO1xyXG4gICAgICAgIHRoaXMuY29uc29sZUVudHJpZXMgPSBbXTtcclxuICAgIH1cclxuXHJcbiAgICBkZXRhY2hWYWx1ZXMoKSB7XHJcbiAgICAgICAgZm9yKGxldCBjZSBvZiB0aGlzLmNvbnNvbGVFbnRyaWVzKXtcclxuICAgICAgICAgICAgY2UuZGV0YWNoVmFsdWUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd0Vycm9yKG06IE1vZHVsZSwgcG9zaXRpb246IFRleHRQb3NpdGlvbikge1xyXG5cclxuICAgICAgICBpZih0aGlzLm1haW4gaW5zdGFuY2VvZiBNYWluKXtcclxuICAgICAgICAgICAgaWYgKG0/LmZpbGU/Lm5hbWUgIT0gdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKT8uZmlsZT8ubmFtZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLmVkaXRvci5kb250RGV0ZWN0TGFzdENoYW5nZSgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5zZXRNb2R1bGVBY3RpdmUobSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBsZXQgcmFuZ2UgPSB7XHJcbiAgICAgICAgICAgIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZSxcclxuICAgICAgICAgICAgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gKyBwb3NpdGlvbi5sZW5ndGgsIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkucmV2ZWFsUmFuZ2VJbkNlbnRlcihyYW5nZSk7XHJcbiAgICAgICAgdGhpcy5lcnJvckRlY29yYXRpb24gPSB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuZGVsdGFEZWNvcmF0aW9ucyh0aGlzLmVycm9yRGVjb3JhdGlvbiwgW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2UsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7IGNsYXNzTmFtZTogJ2pvX3JldmVhbEVycm9yJyB9XHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2UsXHJcbiAgICAgICAgICAgICAgICBvcHRpb25zOiB7IGNsYXNzTmFtZTogJ2pvX3JldmVhbEVycm9yV2hvbGVMaW5lJywgaXNXaG9sZUxpbmU6IHRydWUgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJFcnJvcnMoKXtcclxuICAgICAgICB0aGlzLmVycm9yRGVjb3JhdGlvbiA9IHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKS5kZWx0YURlY29yYXRpb25zKHRoaXMuZXJyb3JEZWNvcmF0aW9uLCBbXHJcbiAgICAgICAgXSk7XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXJFeGNlcHRpb25zKCl7XHJcbiAgICAgICAgaWYodGhpcy4kYm90dG9tRGl2ID09IG51bGwpIHJldHVybjtcclxuICAgICAgICBsZXQgJGNvbnNvbGVUb3AgPSB0aGlzLiRjb25zb2xlVGFiLmZpbmQoJy5qb19jb25zb2xlLXRvcCcpO1xyXG4gICAgICAgICRjb25zb2xlVG9wLmZpbmQoJy5qb19leGNlcHRpb24nKS5wYXJlbnRzKCcuam9fY29uc29sZUVudHJ5JykucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG59Il19