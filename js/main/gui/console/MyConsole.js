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
            guides: {
                bracketPairs: false,
                highlightActiveIndentation: false,
                indentation: false
            },
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
            //@ts-ignore
            fontFamily: window.javaOnlineFont == null ? "Consolas, Roboto Mono" : window.javaOnlineFont,
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
            interpreter.showProgramPointerAndVariables();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlDb25zb2xlLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9jb25zb2xlL015Q29uc29sZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sb0NBQW9DLENBQUM7QUFHbkUsT0FBTyxFQUFFLGdCQUFnQixFQUFlLE1BQU0scUNBQXFDLENBQUM7QUFDcEYsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQ2pELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFFckMsT0FBTyxFQUFnQixTQUFTLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUUzRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sY0FBYyxDQUFDO0FBR3RDLE1BQU0sT0FBTyxTQUFTO0lBa0JsQixZQUFvQixJQUFjLEVBQVMsVUFBK0I7UUFBdEQsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUFTLGVBQVUsR0FBVixVQUFVLENBQXFCO1FBZjFFLFlBQU8sR0FBYSxFQUFFLENBQUM7UUFDdkIsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUd2QixZQUFPLEdBQVksS0FBSyxDQUFDO1FBQ3pCLG1CQUFjLEdBQVksS0FBSyxDQUFDO1FBSWhDLG1CQUFjLEdBQW1CLEVBQUUsQ0FBQztRQUVwQyxvQkFBZSxHQUFhLEVBQUUsQ0FBQztRQUszQixJQUFHLFVBQVUsSUFBSSxJQUFJO1lBQUUsT0FBTyxDQUFDLCtDQUErQztRQUU5RSxJQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyxXQUFXLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQ2xFLENBQUM7SUFFRCxzQkFBc0I7UUFFbEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBRWhCLElBQUksYUFBYSxHQUFHLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztRQUUvRSxJQUFJLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFO1lBQy9CLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNyQixJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ3pCLENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRTtZQUMvQixhQUFhLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7UUFFSCxhQUFhLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ2hDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDakIsQ0FBQyxDQUFDLENBQUM7SUFFUCxDQUFDO0lBRUQsT0FBTztRQUVILElBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJO1lBQUUsT0FBTztRQUVuQyxJQUFJLENBQUMsc0JBQXNCLEVBQUUsQ0FBQztRQUU5QixJQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRTFELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFFO1lBQzlDLEtBQUssRUFBRTtnQkFDSCxFQUFFO2FBQ0wsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ1osZUFBZSxFQUFFLEtBQUs7WUFDdEIsbUJBQW1CLEVBQUUsTUFBTTtZQUMzQixNQUFNLEVBQUU7Z0JBQ0osWUFBWSxFQUFFLEtBQUs7Z0JBQ25CLDBCQUEwQixFQUFFLEtBQUs7Z0JBQ2pDLFdBQVcsRUFBRSxLQUFLO2FBQ3JCO1lBQ0Qsa0JBQWtCLEVBQUUsQ0FBQztZQUNyQixXQUFXLEVBQUUsS0FBSztZQUNsQixXQUFXLEVBQUUsS0FBSztZQUNsQixPQUFPLEVBQUUsS0FBSztZQUNkLDJGQUEyRjtZQUMzRixvQkFBb0IsRUFBRSxDQUFDO1lBQ3ZCLG1CQUFtQixFQUFFLENBQUM7WUFDdEIsb0JBQW9CLEVBQUUsSUFBSTtZQUMxQixRQUFRLEVBQUUsUUFBUTtZQUVsQixRQUFRLEVBQUUsRUFBRTtZQUNaLFlBQVk7WUFDWixVQUFVLEVBQUUsTUFBTSxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLHVCQUF1QixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsY0FBYztZQUMzRixVQUFVLEVBQUUsS0FBSztZQUNqQixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLG9CQUFvQixFQUFFLEtBQUs7WUFDM0IsT0FBTyxFQUFFO2dCQUNMLGFBQWEsRUFBRSxJQUFJO2dCQUNuQiwrQkFBK0IsRUFBRSxLQUFLO2FBQ3pDO1lBQ0QsT0FBTyxFQUFFO2dCQUNMLE9BQU8sRUFBRSxLQUFLO2FBQ2pCO1lBQ0QsU0FBUyxFQUFFO2dCQUNQLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixVQUFVLEVBQUUsUUFBUTthQUN2QjtZQUNELEtBQUssRUFBRSxtQkFBbUI7U0FFN0IsQ0FDQSxDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUVyQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFFaEIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFO1lBRTlDLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztZQUV0QixJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUU7Z0JBQ3JCLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsbUJBQW1CLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUUzRixJQUFHLE9BQU8sSUFBSSxFQUFFLEVBQUM7b0JBQ2IsT0FBTztpQkFDVjtnQkFFRCxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7Z0JBRXBCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztnQkFFZixJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUU1QjtpQkFBTTtnQkFDSCx1QkFBdUI7YUFDMUI7UUFHTCxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUU1QixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUU7WUFFaEQsSUFBSSxjQUFjLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLElBQUksY0FBYyxJQUFJLENBQUMsRUFBRTtnQkFDckIsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNsQixJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN4QyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUM7b0JBQ3BCLFVBQVUsRUFBRSxDQUFDO29CQUNiLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUM7aUJBQzFCLENBQUMsQ0FBQTthQUNMO1FBRUwsQ0FBQyxFQUFFLHVCQUF1QixDQUFDLENBQUM7UUFFNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsR0FBRyxFQUFFO1lBRWxELElBQUksY0FBYyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUNqRSxJQUFJLGNBQWMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQzNDLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztnQkFDbEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDO29CQUNwQixVQUFVLEVBQUUsQ0FBQztvQkFDYixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDO2lCQUMxQixDQUFDLENBQUE7YUFDTDtpQkFBTTtnQkFDSCxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDekIsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUM7YUFDdkI7UUFFTCxDQUFDLEVBQUUsdUJBQXVCLENBQUMsQ0FBQztRQUU1QixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksYUFBYSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUU3QyxJQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQ25DLElBQUksYUFBYSxHQUFHLENBQUMsQ0FBQztRQUV0QixLQUFLLENBQUMsa0JBQWtCLENBQUMsR0FBRyxFQUFFO1lBQzFCLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBRWhELElBQUksU0FBUyxJQUFJLGFBQWEsRUFBRTtnQkFDNUIsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7Z0JBQ3BCLGFBQWEsR0FBRyxTQUFTLENBQUM7YUFDN0I7UUFDTCxDQUFDLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUVsQixJQUFJLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxHQUFFLEVBQUU7WUFDeEMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTlDLFVBQVUsQ0FBQyxHQUFHLEVBQUU7Z0JBQ1osSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztZQUN4QixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDWixDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFFRCxVQUFVO1FBQ04sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBRWpCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQyxHQUFHLEVBQUU7WUFFaEMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDO1FBRTFCLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUVaLENBQUM7SUFFRCxTQUFTO1FBQ0wsSUFBSSxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksRUFBRTtZQUMxQixhQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1lBQ2hDLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1NBQzNCO0lBRUwsQ0FBQztJQUdELGNBQWM7UUFFVixJQUFJLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFFZCxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLG1CQUFtQixDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMzRixJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsV0FBVyxDQUFDO1lBQzlELElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUMsZUFBZSxDQUFDO1lBQzFELElBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUMsSUFBSSxDQUFDO1lBRTNDLElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksV0FBVyxJQUFJLElBQUksRUFBRTtnQkFFM0MsSUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsV0FBVyxDQUFDLENBQUM7Z0JBRWpGLElBQUksQ0FBQyxjQUFjLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO2dCQUVyRCxJQUFJLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztnQkFFcEMsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7YUFFeEI7aUJBQU07Z0JBQ0gsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUN2QjtTQUVKO0lBRUwsQ0FBQztJQUVELFVBQVUsQ0FBQyxNQUFlO1FBRXRCLElBQUksT0FBTyxHQUFnQyxFQUFFLENBQUM7UUFFOUMsS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEVBQUU7WUFDdEIsT0FBTyxDQUFDLElBQUksQ0FBQztnQkFDVCxlQUFlLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUNwQyxXQUFXLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNO2dCQUNsQyxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUNsQyxTQUFTLEVBQUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNO2dCQUN4RCxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ25CLFFBQVEsRUFBRSxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUs7YUFDeEMsQ0FBQyxDQUFDO1NBRU47UUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUU3RSxDQUFDO0lBRUQsT0FBTztRQUVILElBQUksV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7UUFDN0MsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDbEMsSUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0YsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLFdBQVcsQ0FBQztRQUVqQyxNQUFNLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFFdkUsMkNBQTJDO1lBQ3ZDLHlEQUF5RDtZQUM3RCxXQUFXO1lBQ1AsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ25ELFdBQVcsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO1lBQ2pELElBQUk7UUFFUixDQUFDLENBQUMsQ0FBQztJQUVQLENBQUM7SUFDRCxxQkFBcUIsQ0FBQyxPQUFnQjtRQUVsQyxLQUFJLElBQUksU0FBUyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUM7WUFDcEMsSUFBRyxTQUFTLENBQUMsSUFBSSxJQUFJLFNBQVMsQ0FBQyxVQUFVLElBQUksU0FBUyxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFDO2dCQUN6RSxPQUFPLElBQUksQ0FBQzthQUNmO1NBQ0o7UUFFRCxPQUFPLEtBQUssQ0FBQztJQUVqQixDQUFDO0lBRUQsaUJBQWlCLENBQUMsV0FBd0IsRUFBRSxPQUFnQixFQUFFLE9BQWU7UUFFekUsV0FBVyxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFFakMsV0FBVyxDQUFDLGNBQWMsR0FBRyxPQUFPLENBQUM7UUFDckMsV0FBVyxDQUFDLHNCQUFzQixHQUFHLENBQUMsQ0FBQztRQUV2QyxJQUFJLGVBQWUsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQztRQUMvQyxJQUFJLG1CQUFtQixHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFFNUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU5QyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRTtZQUVuQixJQUFJLFFBQWUsQ0FBQztZQUNwQixJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLGVBQWUsRUFBRTtnQkFDNUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBRW5DLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsZUFBZSxFQUFFO29CQUMvQyxXQUFXLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO2lCQUMzQjthQUVKO1lBRUQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztZQUUxQyxXQUFXLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDMUMsSUFBSSxtQkFBbUIsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7Z0JBQ2hELFdBQVcsQ0FBQyw4QkFBOEIsRUFBRSxDQUFDO2FBQ2hEO1FBRUwsQ0FBQyxDQUFDLENBQUM7SUFFUCxDQUFDO0lBRUQsY0FBYyxDQUFDLFdBQXdCLEVBQUUsT0FBZ0IsRUFBRSxPQUFlO1FBRXRFLElBQUksTUFBTSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7UUFFM0MsSUFBRyxNQUFNLENBQUMsS0FBSyxJQUFJLElBQUksRUFBQztZQUVwQixJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUVqRDthQUFNO1lBRUgsSUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksR0FBRyxPQUFPLEdBQUcsY0FBYyxDQUFDLENBQUM7WUFDN0QsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsaUNBQWlDLEdBQUcsTUFBTSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBRW5GLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FFdkM7SUFHTCxDQUFDO0lBRUQsT0FBTztRQUNILElBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQzdELElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxPQUFtQyxFQUFFLFFBQWUsRUFBRSxRQUFnQixJQUFJO1FBRXhGLElBQUcsSUFBSSxDQUFDLFdBQVcsSUFBSSxJQUFJLEVBQUM7WUFDeEIsT0FBTztTQUNWO1FBQ0QsSUFBSSxVQUFVLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUUxRCxJQUFJLFlBQVksR0FBRyxJQUFJLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsUUFBUSxJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN4RixJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUN2QyxVQUFVLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUU5QyxJQUFHLFFBQVEsSUFBSSxJQUFJLEVBQUM7WUFDaEIsSUFBSSxXQUFXLEdBQUcsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM1RSxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztZQUN0QyxVQUFVLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUNoRDtRQUVELElBQUksTUFBTSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUM7UUFDeEMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUVqQyxDQUFDO0lBRUQsS0FBSztRQUNELElBQUksVUFBVSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDMUQsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsV0FBVztRQUMzQyxJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQztJQUM3QixDQUFDO0lBRUQsWUFBWTtRQUNSLEtBQUksSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLGNBQWMsRUFBQztZQUM5QixFQUFFLENBQUMsV0FBVyxFQUFFLENBQUM7U0FDcEI7SUFDTCxDQUFDO0lBRUQsU0FBUyxDQUFDLENBQVMsRUFBRSxRQUFzQjs7UUFFdkMsSUFBRyxJQUFJLENBQUMsSUFBSSxZQUFZLElBQUksRUFBQztZQUN6QixJQUFJLE9BQUEsQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLElBQUksMENBQUUsSUFBSSxrQkFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyx3QkFBd0IsRUFBRSwwQ0FBRSxJQUFJLDBDQUFFLElBQUksQ0FBQSxFQUFFO2dCQUNuRixJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDaEQ7U0FDSjtRQUdELElBQUksS0FBSyxHQUFHO1lBQ1IsV0FBVyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1lBQzVELFNBQVMsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLFFBQVEsQ0FBQyxJQUFJO1NBQzdFLENBQUM7UUFFRixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZELElBQUksQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFO1lBQ3RGO2dCQUNJLEtBQUssRUFBRSxLQUFLO2dCQUNaLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxnQkFBZ0IsRUFBRTthQUUzQztZQUNEO2dCQUNJLEtBQUssRUFBRSxLQUFLO2dCQUNaLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSx5QkFBeUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFO2FBRXZFO1NBQ0osQ0FBQyxDQUFDO0lBR1AsQ0FBQztJQUVELFdBQVc7UUFDUCxJQUFJLENBQUMsZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxFQUN6RixDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsZUFBZTtRQUNYLElBQUcsSUFBSSxDQUFDLFVBQVUsSUFBSSxJQUFJO1lBQUUsT0FBTztRQUNuQyxJQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQzNELFdBQVcsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLGtCQUFrQixDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDM0UsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQWRob2NDb21waWxlciB9IGZyb20gXCIuLi8uLi8uLi9jb21waWxlci9BZGhvY0NvbXBpbGVyLmpzXCI7XHJcbmltcG9ydCB7IEVycm9yIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL2xleGVyL0xleGVyLmpzXCI7XHJcbmltcG9ydCB7IEhlYXAsIFZhbHVlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyU3RhdGUsIEludGVycHJldGVyIH0gZnJvbSBcIi4uLy4uLy4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IENvbnNvbGVFbnRyeSB9IGZyb20gXCIuL0NvbnNvbGVFbnRyeS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uLy4uL01haW4uanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgVGV4dFBvc2l0aW9uLCBUb2tlblR5cGUgfSBmcm9tIFwiLi4vLi4vLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuaW1wb3J0IHsgUHJvZ3JhbSB9IGZyb20gXCIuLi8uLi8uLi9jb21waWxlci9wYXJzZXIvUHJvZ3JhbS5qc1wiO1xyXG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi4vSGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uLy4uL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTXlDb25zb2xlIHtcclxuXHJcbiAgICBlZGl0b3I6IG1vbmFjby5lZGl0b3IuSVN0YW5kYWxvbmVDb2RlRWRpdG9yO1xyXG4gICAgaGlzdG9yeTogc3RyaW5nW10gPSBbXTtcclxuICAgIGhpc3RvcnlQb3M6IG51bWJlciA9IDA7XHJcblxyXG4gICAgdGltZXJIYW5kbGU6IGFueTtcclxuICAgIGlzRGlydHk6IGJvb2xlYW4gPSBmYWxzZTtcclxuICAgIHJlYWR5VG9FeGVjdXRlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgY29tcGlsZXI6IEFkaG9jQ29tcGlsZXI7XHJcblxyXG4gICAgY29uc29sZUVudHJpZXM6IENvbnNvbGVFbnRyeVtdID0gW107XHJcblxyXG4gICAgZXJyb3JEZWNvcmF0aW9uOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgJGNvbnNvbGVUYWJIZWFkaW5nOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJGNvbnNvbGVUYWI6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluQmFzZSwgcHVibGljICRib3R0b21EaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4pe1xyXG4gICAgICAgIGlmKCRib3R0b21EaXYgPT0gbnVsbCkgcmV0dXJuOyAvLyBDb25zb2xlIGlzIG9ubHkgdXNlZCB0byBoaWdobGlnaHQgZXhjZXB0aW9uc1xyXG5cclxuICAgICAgICB0aGlzLiRjb25zb2xlVGFiSGVhZGluZyA9ICRib3R0b21EaXYuZmluZCgnLmpvX3RhYmhlYWRpbmdzPi5qb19jb25zb2xlLXRhYicpO1xyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVUYWIgPSAkYm90dG9tRGl2LmZpbmQoJy5qb190YWJzPi5qb19jb25zb2xlVGFiJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdENvbnNvbGVDbGVhckJ1dHRvbigpe1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCAkY29uc29sZUNsZWFyID0gdGhpcy4kY29uc29sZVRhYkhlYWRpbmcucGFyZW50KCkuZmluZCgnLmpvX2NvbnNvbGUtY2xlYXInKTtcclxuXHJcbiAgICAgICAgdGhpcy4kY29uc29sZVRhYi5vbignbXlzaG93JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAkY29uc29sZUNsZWFyLnNob3coKTtcclxuICAgICAgICAgICAgdGhhdC5lZGl0b3IubGF5b3V0KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVUYWIub24oJ215aGlkZScsICgpID0+IHtcclxuICAgICAgICAgICAgJGNvbnNvbGVDbGVhci5oaWRlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICRjb25zb2xlQ2xlYXIub24oJ21vdXNlZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIHRoYXQuY2xlYXIoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuXHJcbiAgICAgICAgaWYodGhpcy4kYm90dG9tRGl2ID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0Q29uc29sZUNsZWFyQnV0dG9uKCk7XHJcblxyXG4gICAgICAgIGxldCAkZWRpdG9yRGl2ID0gdGhpcy4kY29uc29sZVRhYi5maW5kKCcuam9fY29tbWFuZGxpbmUnKTtcclxuXHJcbiAgICAgICAgdGhpcy5lZGl0b3IgPSBtb25hY28uZWRpdG9yLmNyZWF0ZSgkZWRpdG9yRGl2WzBdLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBbXHJcbiAgICAgICAgICAgICAgICAnJ1xyXG4gICAgICAgICAgICBdLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICBhdXRvbWF0aWNMYXlvdXQ6IGZhbHNlLFxyXG4gICAgICAgICAgICByZW5kZXJMaW5lSGlnaGxpZ2h0OiBcIm5vbmVcIixcclxuICAgICAgICAgICAgZ3VpZGVzOiB7XHJcbiAgICAgICAgICAgICAgICBicmFja2V0UGFpcnM6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaGlnaGxpZ2h0QWN0aXZlSW5kZW50YXRpb246IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgaW5kZW50YXRpb246IGZhbHNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIG92ZXJ2aWV3UnVsZXJMYW5lczogMCxcclxuICAgICAgICAgICAgbGluZU51bWJlcnM6ICdvZmYnLFxyXG4gICAgICAgICAgICBnbHlwaE1hcmdpbjogZmFsc2UsXHJcbiAgICAgICAgICAgIGZvbGRpbmc6IGZhbHNlLFxyXG4gICAgICAgICAgICAvLyBVbmRvY3VtZW50ZWQgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvdnNjb2RlL2lzc3Vlcy8zMDc5NSNpc3N1ZWNvbW1lbnQtNDEwOTk4ODgyXHJcbiAgICAgICAgICAgIGxpbmVEZWNvcmF0aW9uc1dpZHRoOiAwLFxyXG4gICAgICAgICAgICBsaW5lTnVtYmVyc01pbkNoYXJzOiAwLFxyXG4gICAgICAgICAgICBmaXhlZE92ZXJmbG93V2lkZ2V0czogdHJ1ZSxcclxuICAgICAgICAgICAgbGFuZ3VhZ2U6ICdteUphdmEnLFxyXG5cclxuICAgICAgICAgICAgZm9udFNpemU6IDE0LFxyXG4gICAgICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICAgICAgZm9udEZhbWlseTogd2luZG93LmphdmFPbmxpbmVGb250ID09IG51bGwgPyBcIkNvbnNvbGFzLCBSb2JvdG8gTW9ub1wiIDogd2luZG93LmphdmFPbmxpbmVGb250LFxyXG4gICAgICAgICAgICBmb250V2VpZ2h0OiBcIjUwMFwiLFxyXG4gICAgICAgICAgICByb3VuZGVkU2VsZWN0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICBvY2N1cnJlbmNlc0hpZ2hsaWdodDogZmFsc2UsXHJcbiAgICAgICAgICAgIHN1Z2dlc3Q6IHsgXHJcbiAgICAgICAgICAgICAgICBsb2NhbGl0eUJvbnVzOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc25pcHBldHNQcmV2ZW50UXVpY2tTdWdnZXN0aW9uczogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbWluaW1hcDoge1xyXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2Nyb2xsYmFyOiB7XHJcbiAgICAgICAgICAgICAgICB2ZXJ0aWNhbDogJ2hpZGRlbicsXHJcbiAgICAgICAgICAgICAgICBob3Jpem9udGFsOiAnaGlkZGVuJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aGVtZTogXCJteUN1c3RvbVRoZW1lRGFya1wiXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvci5sYXlvdXQoKTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yLmFkZENvbW1hbmQobW9uYWNvLktleUNvZGUuRW50ZXIsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoYXQuY29tcGlsZUlmRGlydHkoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0LnJlYWR5VG9FeGVjdXRlKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgY29tbWFuZCA9IHRoYXQuZWRpdG9yLmdldE1vZGVsKCkuZ2V0VmFsdWUobW9uYWNvLmVkaXRvci5FbmRPZkxpbmVQcmVmZXJlbmNlLkxGLCBmYWxzZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYoY29tbWFuZCA9PSBcIlwiKXtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5oaXN0b3J5LnB1c2goY29tbWFuZCk7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lmhpc3RvcnlQb3MgPSAwO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuZXhlY3V0ZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldFZhbHVlKFwiXCIpO1xyXG5cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIFRPRE86IEZlaGxlcm1lbGR1bmchXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH0sIFwiIXN1Z2dlc3RXaWRnZXRWaXNpYmxlXCIpO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvci5hZGRDb21tYW5kKG1vbmFjby5LZXlDb2RlLlVwQXJyb3csICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBuZXh0SGlzdG9yeVBvcyA9IHRoYXQuaGlzdG9yeS5sZW5ndGggLSAodGhhdC5oaXN0b3J5UG9zICsgMSk7XHJcbiAgICAgICAgICAgIGlmIChuZXh0SGlzdG9yeVBvcyA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICB0aGF0Lmhpc3RvcnlQb3MrKztcclxuICAgICAgICAgICAgICAgIGxldCB0ZXh0ID0gdGhhdC5oaXN0b3J5W25leHRIaXN0b3J5UG9zXTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldFZhbHVlKHRleHQpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5lZGl0b3Iuc2V0UG9zaXRpb24oe1xyXG4gICAgICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IDEsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sdW1uOiB0ZXh0Lmxlbmd0aCArIDFcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSwgXCIhc3VnZ2VzdFdpZGdldFZpc2libGVcIik7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yLmFkZENvbW1hbmQobW9uYWNvLktleUNvZGUuRG93bkFycm93LCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgbmV4dEhpc3RvcnlQb3MgPSB0aGF0Lmhpc3RvcnkubGVuZ3RoIC0gKHRoYXQuaGlzdG9yeVBvcyAtIDEpO1xyXG4gICAgICAgICAgICBpZiAobmV4dEhpc3RvcnlQb3MgPD0gdGhhdC5oaXN0b3J5Lmxlbmd0aCAtIDEpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuaGlzdG9yeVBvcy0tO1xyXG4gICAgICAgICAgICAgICAgbGV0IHRleHQgPSB0aGF0Lmhpc3RvcnlbbmV4dEhpc3RvcnlQb3NdO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5lZGl0b3Iuc2V0VmFsdWUodGV4dCk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmVkaXRvci5zZXRQb3NpdGlvbih7XHJcbiAgICAgICAgICAgICAgICAgICAgbGluZU51bWJlcjogMSxcclxuICAgICAgICAgICAgICAgICAgICBjb2x1bW46IHRleHQubGVuZ3RoICsgMVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuZWRpdG9yLnNldFZhbHVlKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5oaXN0b3J5UG9zID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCBcIiFzdWdnZXN0V2lkZ2V0VmlzaWJsZVwiKTtcclxuXHJcbiAgICAgICAgdGhpcy5jb21waWxlciA9IG5ldyBBZGhvY0NvbXBpbGVyKHRoaXMubWFpbik7XHJcblxyXG4gICAgICAgIGxldCBtb2RlbCA9IHRoaXMuZWRpdG9yLmdldE1vZGVsKCk7XHJcbiAgICAgICAgbGV0IGxhc3RWZXJzaW9uSWQgPSAwO1xyXG5cclxuICAgICAgICBtb2RlbC5vbkRpZENoYW5nZUNvbnRlbnQoKCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgdmVyc2lvbklkID0gbW9kZWwuZ2V0QWx0ZXJuYXRpdmVWZXJzaW9uSWQoKTtcclxuXHJcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uSWQgIT0gbGFzdFZlcnNpb25JZCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5pc0RpcnR5ID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIGxhc3RWZXJzaW9uSWQgPSB2ZXJzaW9uSWQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5zdGFydFRpbWVyKCk7XHJcblxyXG4gICAgICAgIHRoaXMuJGNvbnNvbGVUYWJIZWFkaW5nLm9uKFwibW91c2Vkb3duXCIsICgpPT57XHJcbiAgICAgICAgICAgIEhlbHBlci5zaG93SGVscGVyKFwiY29uc29sZUhlbHBlclwiLCB0aGlzLm1haW4pO1xyXG5cclxuICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmVkaXRvci5mb2N1cygpO1xyXG4gICAgICAgICAgICB9LCA1MDApO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdGFydFRpbWVyKCkge1xyXG4gICAgICAgIHRoaXMuc3RvcFRpbWVyKCk7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICB0aGlzLnRpbWVySGFuZGxlID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhhdC5jb21waWxlSWZEaXJ0eSgpO1xyXG5cclxuICAgICAgICB9LCA1MDApO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBzdG9wVGltZXIoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudGltZXJIYW5kbGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKHRoaXMudGltZXJIYW5kbGUpO1xyXG4gICAgICAgICAgICB0aGlzLnRpbWVySGFuZGxlID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBjb21waWxlSWZEaXJ0eSgpIHtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNEaXJ0eSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGNvbW1hbmQgPSB0aGlzLmVkaXRvci5nZXRNb2RlbCgpLmdldFZhbHVlKG1vbmFjby5lZGl0b3IuRW5kT2ZMaW5lUHJlZmVyZW5jZS5MRiwgZmFsc2UpO1xyXG4gICAgICAgICAgICBsZXQgbW9kdWxlU3RvcmUgPSB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLm1vZHVsZVN0b3JlO1xyXG4gICAgICAgICAgICBsZXQgc3ltYm9sVGFibGUgPSB0aGlzLm1haW4uZ2V0RGVidWdnZXIoKS5sYXN0U3ltYm9sdGFibGU7XHJcbiAgICAgICAgICAgIGxldCBoZWFwID0gdGhpcy5tYWluLmdldEludGVycHJldGVyKCkuaGVhcDtcclxuXHJcbiAgICAgICAgICAgIGlmIChjb21tYW5kLmxlbmd0aCA+IDAgJiYgbW9kdWxlU3RvcmUgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBjb21waWxhdGlvbiA9IHRoaXMuY29tcGlsZXIuY29tcGlsZShjb21tYW5kLCBtb2R1bGVTdG9yZSwgaGVhcCwgc3ltYm9sVGFibGUpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMucmVhZHlUb0V4ZWN1dGUgPSBjb21waWxhdGlvbi5lcnJvcnMubGVuZ3RoID09IDA7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3JzKGNvbXBpbGF0aW9uLmVycm9ycyk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pc0RpcnR5ID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zaG93RXJyb3JzKFtdKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNob3dFcnJvcnMoZXJyb3JzOiBFcnJvcltdKSB7XHJcblxyXG4gICAgICAgIGxldCBtYXJrZXJzOiBtb25hY28uZWRpdG9yLklNYXJrZXJEYXRhW10gPSBbXTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgZXJyb3Igb2YgZXJyb3JzKSB7XHJcbiAgICAgICAgICAgIG1hcmtlcnMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IGVycm9yLnBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgICAgICBzdGFydENvbHVtbjogZXJyb3IucG9zaXRpb24uY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgZW5kTGluZU51bWJlcjogZXJyb3IucG9zaXRpb24ubGluZSxcclxuICAgICAgICAgICAgICAgIGVuZENvbHVtbjogZXJyb3IucG9zaXRpb24uY29sdW1uICsgZXJyb3IucG9zaXRpb24ubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IudGV4dCxcclxuICAgICAgICAgICAgICAgIHNldmVyaXR5OiBtb25hY28uTWFya2VyU2V2ZXJpdHkuRXJyb3JcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbW9uYWNvLmVkaXRvci5zZXRNb2RlbE1hcmtlcnModGhpcy5lZGl0b3IuZ2V0TW9kZWwoKSwgJ0ZlaGxlcicsIG1hcmtlcnMpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBleGVjdXRlKCkge1xyXG5cclxuICAgICAgICBsZXQgaW50ZXJwcmV0ZXIgPSB0aGlzLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKTtcclxuICAgICAgICBsZXQgbW9kdWxlID0gdGhpcy5jb21waWxlci5tb2R1bGU7XHJcbiAgICAgICAgbGV0IGNvbW1hbmQgPSB0aGlzLmVkaXRvci5nZXRNb2RlbCgpLmdldFZhbHVlKG1vbmFjby5lZGl0b3IuRW5kT2ZMaW5lUHJlZmVyZW5jZS5MRiwgZmFsc2UpO1xyXG4gICAgICAgIGxldCBwcm9ncmFtID0gbW9kdWxlLm1haW5Qcm9ncmFtO1xyXG5cclxuICAgICAgICBtb25hY28uZWRpdG9yLmNvbG9yaXplKGNvbW1hbmQsICdteUphdmEnLCB7IHRhYlNpemU6IDMgfSkudGhlbigoY29tbWFuZCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgLy8gaWYodGhpcy5wcm9ncmFtSGFzTWV0aG9kQ2FsbHMocHJvZ3JhbSkpe1xyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5leGVjdXRlSW5TdGVwTW9kZShpbnRlcnByZXRlciwgcHJvZ3JhbSwgY29tbWFuZCk7XHJcbiAgICAgICAgICAgIC8vIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmV4ZWN1dGVSYXBpZGx5KGludGVycHJldGVyLCBwcm9ncmFtLCBjb21tYW5kKTtcclxuICAgICAgICAgICAgICAgIGludGVycHJldGVyLnNob3dQcm9ncmFtUG9pbnRlckFuZFZhcmlhYmxlcygpO1xyXG4gICAgICAgICAgICAvLyB9XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuICAgIHByb2dyYW1IYXNNZXRob2RDYWxscyhwcm9ncmFtOiBQcm9ncmFtKTogYm9vbGVhbiB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgZm9yKGxldCBzdGF0ZW1lbnQgb2YgcHJvZ3JhbS5zdGF0ZW1lbnRzKXtcclxuICAgICAgICAgICAgaWYoc3RhdGVtZW50LnR5cGUgPT0gVG9rZW5UeXBlLmNhbGxNZXRob2QgJiYgc3RhdGVtZW50Lm1ldGhvZC5pbnZva2UgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGV4ZWN1dGVJblN0ZXBNb2RlKGludGVycHJldGVyOiBJbnRlcnByZXRlciwgcHJvZ3JhbTogUHJvZ3JhbSwgY29tbWFuZDogc3RyaW5nICl7XHJcblxyXG4gICAgICAgIGludGVycHJldGVyLnB1c2hDdXJyZW50UHJvZ3JhbSgpO1xyXG5cclxuICAgICAgICBpbnRlcnByZXRlci5jdXJyZW50UHJvZ3JhbSA9IHByb2dyYW07XHJcbiAgICAgICAgaW50ZXJwcmV0ZXIuY3VycmVudFByb2dyYW1Qb3NpdGlvbiA9IDA7XHJcblxyXG4gICAgICAgIGxldCBzdGFja3NpemVCZWZvcmUgPSBpbnRlcnByZXRlci5zdGFjay5sZW5ndGg7XHJcbiAgICAgICAgbGV0IG9sZEludGVycHJldGVyU3RhdGUgPSBpbnRlcnByZXRlci5zdGF0ZTtcclxuXHJcbiAgICAgICAgaW50ZXJwcmV0ZXIuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpO1xyXG5cclxuICAgICAgICBpbnRlcnByZXRlci5zdGFydCgoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgc3RhY2tUb3A6IFZhbHVlO1xyXG4gICAgICAgICAgICBpZiAoaW50ZXJwcmV0ZXIuc3RhY2subGVuZ3RoID4gc3RhY2tzaXplQmVmb3JlKSB7XHJcbiAgICAgICAgICAgICAgICBzdGFja1RvcCA9IGludGVycHJldGVyLnN0YWNrLnBvcCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIHdoaWxlIChpbnRlcnByZXRlci5zdGFjay5sZW5ndGggPiBzdGFja3NpemVCZWZvcmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBpbnRlcnByZXRlci5zdGFjay5wb3AoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVDb25zb2xlRW50cnkoY29tbWFuZCwgc3RhY2tUb3ApO1xyXG5cclxuICAgICAgICAgICAgaW50ZXJwcmV0ZXIuc2V0U3RhdGUob2xkSW50ZXJwcmV0ZXJTdGF0ZSk7XHJcbiAgICAgICAgICAgIGlmIChvbGRJbnRlcnByZXRlclN0YXRlID09IEludGVycHJldGVyU3RhdGUucGF1c2VkKSB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnByZXRlci5zaG93UHJvZ3JhbVBvaW50ZXJBbmRWYXJpYWJsZXMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZXhlY3V0ZVJhcGlkbHkoaW50ZXJwcmV0ZXI6IEludGVycHJldGVyLCBwcm9ncmFtOiBQcm9ncmFtLCBjb21tYW5kOiBzdHJpbmcgKXtcclxuXHJcbiAgICAgICAgbGV0IHJlc3VsdCA9IGludGVycHJldGVyLmV2YWx1YXRlKHByb2dyYW0pO1xyXG5cclxuICAgICAgICBpZihyZXN1bHQuZXJyb3IgPT0gbnVsbCl7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB0aGlzLndyaXRlQ29uc29sZUVudHJ5KGNvbW1hbmQsIHJlc3VsdC52YWx1ZSk7XHJcblxyXG4gICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgJGVudHJ5ID0galF1ZXJ5KCc8ZGl2PjxkaXY+JyArIGNvbW1hbmQgKyAnPC9kaXY+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgICRlbnRyeS5hcHBlbmQoalF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fY29uc29sZS1lcnJvclwiPiAnICsgcmVzdWx0LmVycm9yICsgJzwvZGl2PicpKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMud3JpdGVDb25zb2xlRW50cnkoJGVudHJ5LCBudWxsKVxyXG5cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzaG93VGFiKCl7XHJcbiAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuICAgICAgICB0aGlzLiRjb25zb2xlVGFiSGVhZGluZy50cmlnZ2VyKG1vdXNlUG9pbnRlciArIFwiZG93blwiKTtcclxuICAgIH1cclxuXHJcbiAgICB3cml0ZUNvbnNvbGVFbnRyeShjb21tYW5kOiBzdHJpbmd8SlF1ZXJ5PEhUTUxFbGVtZW50Piwgc3RhY2tUb3A6IFZhbHVlLCBjb2xvcjogc3RyaW5nID0gbnVsbCkge1xyXG5cclxuICAgICAgICBpZih0aGlzLiRjb25zb2xlVGFiID09IG51bGwpe1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGxldCBjb25zb2xlVG9wID0gdGhpcy4kY29uc29sZVRhYi5maW5kKCcuam9fY29uc29sZS10b3AnKTtcclxuXHJcbiAgICAgICAgbGV0IGNvbW1hbmRFbnRyeSA9IG5ldyBDb25zb2xlRW50cnkoY29tbWFuZCwgbnVsbCwgbnVsbCwgbnVsbCwgc3RhY2tUb3AgPT0gbnVsbCwgY29sb3IpO1xyXG4gICAgICAgIHRoaXMuY29uc29sZUVudHJpZXMucHVzaChjb21tYW5kRW50cnkpO1xyXG4gICAgICAgIGNvbnNvbGVUb3AuYXBwZW5kKGNvbW1hbmRFbnRyeS4kY29uc29sZUVudHJ5KTtcclxuXHJcbiAgICAgICAgaWYoc3RhY2tUb3AgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIGxldCByZXN1bHRFbnRyeSA9IG5ldyBDb25zb2xlRW50cnkobnVsbCwgc3RhY2tUb3AsIG51bGwsIG51bGwsIHRydWUsIGNvbG9yKTtcclxuICAgICAgICAgICAgdGhpcy5jb25zb2xlRW50cmllcy5wdXNoKHJlc3VsdEVudHJ5KTtcclxuICAgICAgICAgICAgY29uc29sZVRvcC5hcHBlbmQocmVzdWx0RW50cnkuJGNvbnNvbGVFbnRyeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB2YXIgaGVpZ2h0ID0gY29uc29sZVRvcFswXS5zY3JvbGxIZWlnaHQ7XHJcbiAgICAgICAgY29uc29sZVRvcC5zY3JvbGxUb3AoaGVpZ2h0KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgbGV0IGNvbnNvbGVUb3AgPSB0aGlzLiRjb25zb2xlVGFiLmZpbmQoJy5qb19jb25zb2xlLXRvcCcpO1xyXG4gICAgICAgIGNvbnNvbGVUb3AuY2hpbGRyZW4oKS5yZW1vdmUoKTsgLy8gZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmNvbnNvbGVFbnRyaWVzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgZGV0YWNoVmFsdWVzKCkge1xyXG4gICAgICAgIGZvcihsZXQgY2Ugb2YgdGhpcy5jb25zb2xlRW50cmllcyl7XHJcbiAgICAgICAgICAgIGNlLmRldGFjaFZhbHVlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHNob3dFcnJvcihtOiBNb2R1bGUsIHBvc2l0aW9uOiBUZXh0UG9zaXRpb24pIHtcclxuXHJcbiAgICAgICAgaWYodGhpcy5tYWluIGluc3RhbmNlb2YgTWFpbil7XHJcbiAgICAgICAgICAgIGlmIChtPy5maWxlPy5uYW1lICE9IHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk/LmZpbGU/Lm5hbWUpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5lZGl0b3IuZG9udERldGVjdExhc3RDaGFuZ2UoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuc2V0TW9kdWxlQWN0aXZlKG0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgbGV0IHJhbmdlID0ge1xyXG4gICAgICAgICAgICBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uLCBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uICsgcG9zaXRpb24ubGVuZ3RoLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnJldmVhbFJhbmdlSW5DZW50ZXIocmFuZ2UpO1xyXG4gICAgICAgIHRoaXMuZXJyb3JEZWNvcmF0aW9uID0gdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLmRlbHRhRGVjb3JhdGlvbnModGhpcy5lcnJvckRlY29yYXRpb24sIFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmFuZ2U6IHJhbmdlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogeyBjbGFzc05hbWU6ICdqb19yZXZlYWxFcnJvcicgfVxyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgcmFuZ2U6IHJhbmdlLFxyXG4gICAgICAgICAgICAgICAgb3B0aW9uczogeyBjbGFzc05hbWU6ICdqb19yZXZlYWxFcnJvcldob2xlTGluZScsIGlzV2hvbGVMaW5lOiB0cnVlIH1cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdKTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyRXJyb3JzKCl7XHJcbiAgICAgICAgdGhpcy5lcnJvckRlY29yYXRpb24gPSB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuZGVsdGFEZWNvcmF0aW9ucyh0aGlzLmVycm9yRGVjb3JhdGlvbiwgW1xyXG4gICAgICAgIF0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyRXhjZXB0aW9ucygpe1xyXG4gICAgICAgIGlmKHRoaXMuJGJvdHRvbURpdiA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgbGV0ICRjb25zb2xlVG9wID0gdGhpcy4kY29uc29sZVRhYi5maW5kKCcuam9fY29uc29sZS10b3AnKTtcclxuICAgICAgICAkY29uc29sZVRvcC5maW5kKCcuam9fZXhjZXB0aW9uJykucGFyZW50cygnLmpvX2NvbnNvbGVFbnRyeScpLnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxufSJdfQ==