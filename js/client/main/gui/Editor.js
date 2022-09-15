import { InterpreterState } from "../../interpreter/Interpreter.js";
import { Main } from "../Main.js";
import { MyCompletionItemProvider } from "./MyCompletionItemProvider.js";
import { defineMyJava } from "./MyJava.js";
import { MySignatureHelpProvider } from "./MySignatureHelpProvider.js";
import { Klass, Interface } from "../../compiler/types/Class.js";
import { Method, Attribute } from "../../compiler/types/Types.js";
import { MyHoverProvider } from "./MyHoverProvider.js";
import { MyCodeActionProvider } from "./MyCodeActionProvider.js";
import { MyReferenceProvider } from "./MyReferenceProvider.js";
import { Enum } from "../../compiler/types/Enum.js";
export class Editor {
    constructor(main, showMinimap, isEmbedded) {
        this.main = main;
        this.showMinimap = showMinimap;
        this.isEmbedded = isEmbedded;
        this.highlightCurrentMethod = true;
        this.cw = null;
        this.dontPushNextCursorMove = 0;
        this.lastPushTime = 0;
        this.lastTime = 0;
        this.elementDecoration = [];
    }
    initGUI($element) {
        defineMyJava();
        monaco.editor.defineTheme('myCustomThemeDark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'method', foreground: 'dcdcaa', fontStyle: 'italic' },
                { token: 'print', foreground: 'dcdcaa', fontStyle: 'italic bold' },
                { token: 'class', foreground: '3DC9B0' },
                { token: 'number', foreground: 'b5cea8' },
                { token: 'type', foreground: '499cd6' },
                { token: 'identifier', foreground: '9cdcfe' },
                { token: 'statement', foreground: 'bb96c0', fontStyle: 'bold' },
                { token: 'keyword', foreground: '68bed4', fontStyle: 'bold' },
            ],
            colors: {
                "editor.background": "#1e1e1e",
                "jo_highlightMethod": "#2b2b7d"
            }
        });
        monaco.editor.defineTheme('myCustomThemeLight', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: 'method', foreground: '694E16', fontStyle: 'italic bold' },
                { token: 'print', foreground: '811f3f', fontStyle: 'italic bold' },
                { token: 'class', foreground: 'a03030' },
                { token: 'number', foreground: '404040' },
                { token: 'type', foreground: '0000ff', fontStyle: 'bold' },
                { token: 'identifier', foreground: '001080' },
                { token: 'statement', foreground: '8000e0', fontStyle: 'bold' },
                { token: 'keyword', foreground: '00a000', fontStyle: 'bold' },
                { token: 'comment', foreground: '808080', fontStyle: 'italic' },
            ],
            colors: {
                "editor.background": "#FFFFFF",
                "editor.foreground": "#000000",
                "editor.inactiveSelectionBackground": "#E5EBF1",
                "editorIndentGuide.background": "#D3D3D3",
                "editorIndentGuide.activeBackground": "#939393",
                "editor.selectionHighlightBackground": "#ADD6FF80",
                "editorSuggestWidget.background": "#F3F3F3",
                "activityBarBadge.background": "#007ACC",
                "sideBarTitle.foreground": "#6F6F6F",
                "list.hoverBackground": "#E8E8E8",
                "input.placeholderForeground": "#767676",
                "searchEditor.textInputBorder": "#CECECE",
                "settings.textInputBorder": "#CECECE",
                "settings.numberInputBorder": "#CECECE",
                "statusBarItem.remoteForeground": "#FFF",
                "statusBarItem.remoteBackground": "#16825D",
                "jo_highlightMethod": "#babaec"
            }
        });
        this.editor = monaco.editor.create($element[0], {
            // value: [
            //     'function x() {',
            //     '\tconsole.log("Hello world!");',
            //     '}'
            // ].join('\n'),
            // language: 'myJava',
            language: 'myJava',
            lightbulb: {
                enabled: true
            },
            // gotoLocation: {
            //     multipleReferences: "gotoAndPeek"
            // },
            lineDecorationsWidth: 0,
            peekWidgetDefaultFocus: "tree",
            fixedOverflowWidgets: true,
            quickSuggestions: true,
            quickSuggestionsDelay: 10,
            fontSize: 14,
            fontFamily: "Consolas, Roboto Mono",
            fontWeight: "500",
            roundedSelection: true,
            selectOnLineNumbers: false,
            // selectionHighlight: false,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            occurrencesHighlight: false,
            autoIndent: "full",
            dragAndDrop: true,
            formatOnType: true,
            formatOnPaste: true,
            suggestFontSize: 16,
            suggestLineHeight: 22,
            suggest: {
                localityBonus: true,
            },
            parameterHints: { enabled: true, cycle: true },
            // //@ts-ignore
            // contribInfo: {
            //     suggestSelection: 'recentlyUsedByPrefix',
            // },
            mouseWheelZoom: this.isEmbedded,
            minimap: {
                enabled: this.showMinimap
            },
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto'
            },
            theme: "myCustomThemeDark",
        });
        this.editor.onKeyDown((e) => {
            let state = this.main.getInterpreter().state;
            if ([InterpreterState.done, InterpreterState.error, InterpreterState.not_initialized].indexOf(state) < 0) {
                if (e.code.indexOf("Arrow") >= 0 || e.code.indexOf("Page") >= 0)
                    return; // don't react to Cursor keys
                this.main.getActionManager().trigger("interpreter.stop");
            }
        });
        // this.uri = monaco.Uri.from({ path: '/file1.java', scheme: 'file' })
        // this.modelJava = monaco.editor.createModel("", "myJava", this.uri);
        // this.editor.setModel(this.modelJava);
        let that = this;
        let mouseWheelListener = (event) => {
            if (event.ctrlKey === true) {
                that.changeEditorFontSize(Math.sign(event.deltaY), true);
                event.preventDefault();
            }
        };
        if (!this.isEmbedded) {
            let _main = this.main;
            _main.windowStateManager.registerBackButtonListener((event) => {
                let historyEntry = event.state;
                if (event.state == null)
                    return;
                let workspace = _main.workspaceList.find((ws) => ws.id == historyEntry.workspace_id);
                if (workspace == null)
                    return;
                let module = workspace.moduleStore.findModuleById(historyEntry.module_id);
                if (module == null)
                    return;
                // console.log("Processing pop state event, returning to module " + historyEntry.module_id);
                if (workspace != _main.currentWorkspace) {
                    that.dontPushNextCursorMove++;
                    _main.projectExplorer.setWorkspaceActive(workspace);
                    that.dontPushNextCursorMove--;
                }
                if (module != _main.getCurrentlyEditedModule()) {
                    that.dontPushNextCursorMove++;
                    _main.projectExplorer.setModuleActive(module);
                    that.dontPushNextCursorMove--;
                }
                that.dontPushNextCursorMove++;
                that.editor.setPosition(historyEntry.position);
                that.editor.revealPosition(historyEntry.position);
                that.dontPushNextCursorMove--;
                that.pushHistoryState(true, historyEntry);
            });
        }
        this.editor.onDidChangeConfiguration((event) => {
            if (event.hasChanged(monaco.editor.EditorOption.fontInfo) && this.isEmbedded) {
                this.main.getBottomDiv().errorManager.registerLightbulbOnClickFunctions();
            }
        });
        this.editor.onDidChangeCursorPosition((event) => {
            var _a;
            let currentModelId = this.main.getCurrentlyEditedModule().file.id;
            let pushNeeded = this.lastPosition == null
                || event.source == "api"
                || currentModelId != this.lastPosition.module_id
                || Math.abs(this.lastPosition.position.lineNumber - event.position.lineNumber) > 20;
            if (pushNeeded && this.dontPushNextCursorMove == 0) {
                this.pushHistoryState(false, this.getPositionForHistory());
            }
            else if (currentModelId == ((_a = history.state) === null || _a === void 0 ? void 0 : _a.module_id)) {
                this.pushHistoryState(true, this.getPositionForHistory());
            }
            that.onDidChangeCursorPosition(event.position);
            that.onEvaluateSelectedText(event);
        });
        // We need this to set our model after user uses Strg+click on identifier
        this.editor.onDidChangeModel((event) => {
            let element = $element.find('.monaco-editor')[0];
            element.removeEventListener("wheel", mouseWheelListener);
            element.addEventListener("wheel", mouseWheelListener, { passive: false });
            if (this.main.getCurrentWorkspace() == null)
                return;
            let module = this.main.getCurrentWorkspace().getModuleByMonacoModel(this.editor.getModel());
            if (this.main instanceof Main && module != null) {
                // if(!this.dontPushHistoryStateOnNextModelChange){
                //     this.lastPosition = {
                //         position: this.editor.getPosition(),
                //         workspace_id: this.main.getCurrentWorkspace().id,
                //         module_id: module.file.id
                //     }
                //     this.pushHistoryState(false);
                // }
                // this.dontPushHistoryStateOnNextModelChange = false;
                this.main.projectExplorer.setActiveAfterExternalModelSet(module);
                let pushNeeded = this.lastPosition == null
                    || module.file.id != this.lastPosition.module_id;
                if (pushNeeded && this.dontPushNextCursorMove == 0) {
                    this.pushHistoryState(false, this.getPositionForHistory());
                }
            }
        });
        monaco.languages.registerRenameProvider('myJava', this);
        monaco.languages.registerDefinitionProvider('myJava', {
            provideDefinition: (model, position, cancellationToken) => {
                return that.provideDefinition(model, position, cancellationToken);
            }
        });
        monaco.languages.registerHoverProvider('myJava', new MyHoverProvider(this));
        monaco.languages.registerCompletionItemProvider('myJava', new MyCompletionItemProvider(this.main));
        monaco.languages.registerCodeActionProvider('myJava', new MyCodeActionProvider(this.main));
        monaco.languages.registerReferenceProvider('myJava', new MyReferenceProvider(this.main));
        monaco.languages.registerSignatureHelpProvider('myJava', new MySignatureHelpProvider(this.main));
        this.editor.onMouseDown((e) => {
            const data = e.target.detail;
            if (e.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN &&
                e.target.type !== monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS || data.isAfterLines) {
                return;
            }
            that.onMarginMouseDown(e.target.position.lineNumber);
            return;
        });
        // If editor is instantiated before fonts are loaded then indentation-lines
        // are misplaced, see https://github.com/Microsoft/monaco-editor/issues/392
        // so:
        setTimeout(() => {
            monaco.editor.remeasureFonts();
        }, 2000);
        this.addActions();
        //@ts-ignore
        this.editor.onDidType((text) => { that.onDidType(text); });
        return this.editor;
    }
    getPositionForHistory() {
        return {
            position: this.editor.getPosition(),
            workspace_id: this.main.getCurrentWorkspace().id,
            module_id: this.main.getCurrentlyEditedModule().file.id
        };
    }
    pushHistoryState(replace, historyEntry) {
        if (this.main.isEmbedded())
            return;
        if (replace) {
            history.replaceState(historyEntry, ""); //`Java-Online, ${module.file.name} (Zeile ${this.lastPosition.position.lineNumber}, Spalte ${this.lastPosition.position.column})`);
            // console.log("Replace History state with workspace-id: " + historyEntry.workspace_id + ", module-id: " + historyEntry.module_id);
        }
        else {
            let time = new Date().getTime();
            if (time - this.lastPushTime > 200) {
                history.pushState(historyEntry, ""); //`Java-Online, ${module.file.name} (Zeile ${historyEntry.position.lineNumber}, Spalte ${historyEntry.position.column})`);
            }
            else {
                history.replaceState(historyEntry, "");
            }
            this.lastPushTime = time;
            // console.log("Pushed History state with workspace-id: " + historyEntry.workspace_id + ", module-id: " + historyEntry.module_id);
        }
        this.lastPosition = historyEntry;
    }
    onDidType(text) {
        //        const endOfCommentText = " * \n */";
        const insertEndOfComment = (pos, insertText, newLine, newColumn) => {
            const range = new monaco.Range(pos.lineNumber, pos.column, pos.lineNumber, pos.column);
            this.editor.executeEdits("new-bullets", [
                { range, text: insertText }
            ]);
            // Set position after bulletText
            this.editor.setPosition({
                lineNumber: newLine,
                column: newColumn
            });
        };
        if (text === "\n") {
            const model = this.editor.getModel();
            const position = this.editor.getPosition();
            const prevLine = model.getLineContent(position.lineNumber - 1);
            if (prevLine.trim().indexOf("/*") === 0 && !prevLine.trimRight().endsWith("*/")) {
                const nextLine = position.lineNumber < model.getLineCount() ? model.getLineContent(position.lineNumber + 1) : "";
                if (!nextLine.trim().startsWith("*")) {
                    let spacesAtBeginningOfLine = prevLine.substr(0, prevLine.length - prevLine.trimLeft().length);
                    if (prevLine.trim().indexOf("/**") === 0) {
                        insertEndOfComment(position, "\n" + spacesAtBeginningOfLine + " */", position.lineNumber, position.column + 3 + spacesAtBeginningOfLine.length);
                    }
                    else {
                        insertEndOfComment(position, " * \n" + spacesAtBeginningOfLine + " */", position.lineNumber, position.column + 3 + spacesAtBeginningOfLine.length);
                    }
                }
            }
        }
    }
    setFontSize(fontSizePx) {
        // console.log("Set font size: " + fontSizePx);
        let time = new Date().getTime();
        if (time - this.lastTime < 150)
            return;
        this.lastTime = time;
        let editorfs = this.editor.getOptions().get(monaco.editor.EditorOption.fontSize);
        if (this.main instanceof Main) {
            this.main.viewModeController.saveFontSize(fontSizePx);
        }
        if (fontSizePx != editorfs) {
            this.editor.updateOptions({
                fontSize: fontSizePx
            });
            // editor does not set fontSizePx, but fontSizePx * zoomfactor with unknown zoom factor, so 
            // we have to do this dirty workaround:
            let newEditorfs = this.editor.getOptions().get(monaco.editor.EditorOption.fontSize);
            let factor = newEditorfs / fontSizePx;
            this.editor.updateOptions({
                fontSize: fontSizePx / factor
            });
            let bottomDiv1 = this.main.getBottomDiv();
            if (bottomDiv1 != null && bottomDiv1.console != null) {
                bottomDiv1.console.editor.updateOptions({
                    fontSize: fontSizePx / factor
                });
            }
        }
        let bottomDiv = this.main.getBottomDiv();
        if (bottomDiv != null && bottomDiv.console != null) {
            let $commandLine = bottomDiv.$bottomDiv.find('.jo_commandline');
            $commandLine.css({
                height: (fontSizePx * 1.1 + 4) + "px",
                "line-height": (fontSizePx * 1.1 + 4) + "px"
            });
            bottomDiv.console.editor.layout();
        }
        // let newEditorfs = this.editor.getOptions().get(monaco.editor.EditorOption.fontSize);
        // console.log({editorFS: editorfs, newFs: fontSizePx, newEditorFs: newEditorfs});
        jQuery('.jo_editorFontSize').css('font-size', fontSizePx + "px");
        jQuery('.jo_editorFontSize').css('line-height', (fontSizePx + 2) + "px");
        document.documentElement.style.setProperty('--breakpoint-size', fontSizePx + 'px');
        document.documentElement.style.setProperty('--breakpoint-radius', fontSizePx / 2 + 'px');
        this.main.getBottomDiv().errorManager.registerLightbulbOnClickFunctions();
    }
    changeEditorFontSize(delta, dynamic = true) {
        let editorfs = this.editor.getOptions().get(monaco.editor.EditorOption.fontSize);
        if (dynamic) {
            if (editorfs < 10) {
                delta *= 1;
            }
            else if (editorfs < 20) {
                delta *= 2;
            }
            else {
                delta *= 4;
            }
        }
        let newEditorFs = editorfs + delta;
        if (newEditorFs >= 6 && newEditorFs <= 80) {
            this.setFontSize(newEditorFs);
        }
    }
    addActions() {
        this.editor.addAction({
            // An unique identifier of the contributed action.
            id: 'Find bracket',
            // A label of the action that will be presented to the user.
            label: 'Finde korrespondierende Klammer',
            // An optional array of keybindings for the action.
            keybindings: [
                monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_K
            ],
            // A precondition for this action.
            precondition: null,
            // A rule to evaluate on top of the precondition in order to dispatch the keybindings.
            keybindingContext: null,
            contextMenuGroupId: 'navigation',
            contextMenuOrder: 1.5,
            // Method that will be executed when the action is triggered.
            // @param editor The editor instance is passed in as a convinience
            run: function (ed) {
                ed.getAction('editor.action.jumpToBracket').run();
                return null;
            }
        });
        //console.log(this.editor.getSupportedActions());
    }
    onEvaluateSelectedText(event) {
        let that = this;
        if (that.cw != null) {
            that.editor.removeContentWidget(that.cw);
            that.cw = null;
        }
        if (that.main.getInterpreter().state == InterpreterState.paused) {
            let model = that.editor.getModel();
            let text = model.getValueInRange(that.editor.getSelection());
            if (text != null && text.length > 0) {
                let evaluator = this.main.getCurrentWorkspace().evaluator;
                let result = evaluator.evaluate(text);
                if (result.error == null && result.value != null) {
                    let v = result.value.type.debugOutput(result.value);
                    monaco.editor.colorize(text + ": ", 'myJava', { tabSize: 3 }).then((text) => {
                        if (text.endsWith("<br/>"))
                            text = text.substr(0, text.length - 5);
                        that.cw = {
                            getId: function () {
                                return 'my.content.widget';
                            },
                            getDomNode: function () {
                                let dn = jQuery('<div class="jo_editorTooltip jo_codeFont">' + text + v + '</div>');
                                return dn[0];
                            },
                            getPosition: function () {
                                return {
                                    position: event.position,
                                    preference: [monaco.editor.ContentWidgetPositionPreference.ABOVE, monaco.editor.ContentWidgetPositionPreference.BELOW]
                                };
                            }
                        };
                        that.editor.addContentWidget(that.cw);
                    });
                }
            }
        }
    }
    onMarginMouseDown(lineNumber) {
        let module = this.getCurrentlyEditedModule();
        if (module == null) {
            return;
        }
        module.toggleBreakpoint(lineNumber, true);
        if (this.main.getInterpreter().moduleStore != null) {
            let runningModule = this.main.getInterpreter().moduleStore.findModuleByFile(module.file);
            if (runningModule != null)
                runningModule.toggleBreakpoint(lineNumber, false);
        }
    }
    onDidChangeCursorPosition(position) {
        if (position == null)
            position = this.editor.getPosition();
        let module = this.getCurrentlyEditedModule();
        if (module == null) {
            this.elementDecoration = this.editor.deltaDecorations(this.elementDecoration, []);
            return;
        }
        let element = module.getElementAtPosition(position.lineNumber, position.column);
        let decorations = [];
        if (element != null) {
            let usagePositions = element.usagePositions;
            let upInCurrentModule = usagePositions.get(module);
            if (upInCurrentModule != null) {
                for (let up of upInCurrentModule) {
                    decorations.push({
                        range: { startColumn: up.column, startLineNumber: up.line, endColumn: up.column + up.length, endLineNumber: up.line },
                        options: {
                            className: 'jo_revealSyntaxElement', isWholeLine: false, overviewRuler: {
                                color: { id: "editorIndentGuide.background" },
                                darkColor: { id: "editorIndentGuide.activeBackground" },
                                position: monaco.editor.OverviewRulerLane.Left
                            }
                        }
                    });
                }
            }
        }
        if (this.highlightCurrentMethod) {
            let method = module.getMethodDeclarationAtPosition(position);
            if (method != null) {
                decorations.push({
                    range: { startColumn: 0, startLineNumber: method.position.line, endColumn: 100, endLineNumber: method.scopeTo.line },
                    options: {
                        className: 'jo_highlightMethod', isWholeLine: true, overviewRuler: {
                            color: { id: "jo_highlightMethod" },
                            darkColor: { id: "jo_highlightMethod" },
                            position: monaco.editor.OverviewRulerLane.Left
                        },
                        minimap: {
                            color: { id: 'jo_highlightMethod' },
                            position: monaco.editor.MinimapPosition.Inline
                        },
                        zIndex: -100
                    }
                });
            }
        }
        this.elementDecoration = this.editor.deltaDecorations(this.elementDecoration, decorations);
    }
    getCurrentlyEditedModule() {
        return this.main.getCurrentlyEditedModule();
    }
    dontDetectLastChange() {
        // this.dontDetectLastChanging = true;
    }
    provideRenameEdits(model, position, newName, token) {
        let currentlyEditedModule = this.getCurrentlyEditedModule();
        if (currentlyEditedModule == null) {
            return null;
        }
        let element = currentlyEditedModule.getElementAtPosition(position.lineNumber, position.column);
        if (element == null) {
            return;
        }
        let usagePositions = element.usagePositions;
        //06.06.2020
        let resourceEdits = [];
        usagePositions.forEach((usagePositionsInModule, module) => {
            if (usagePositionsInModule != null) {
                let edits = [];
                for (let up of usagePositionsInModule) {
                    resourceEdits.push({
                        resource: module.uri, edit: {
                            range: { startColumn: up.column, startLineNumber: up.line, endLineNumber: up.line, endColumn: up.column + up.length },
                            text: newName
                        }
                    });
                }
                if (edits.length > 0) {
                    module.file.dirty = true;
                    module.file.saved = false;
                    module.file.identical_to_repository_version = false;
                }
            }
        });
        return {
            edits: resourceEdits
        };
    }
    provideDefinition(model, position, cancellationToken) {
        let module = this.main.getCurrentWorkspace().getModuleByMonacoModel(model);
        if (module == null) {
            return null;
        }
        let element = module.getElementAtPosition(position.lineNumber, position.column);
        if (element == null)
            return null;
        let decl = element.declaration;
        if (decl == null) {
            // class from Base-Module? Let definition point to current position, so that ctrl + click opens peek references widget
            if (element instanceof Klass || element instanceof Enum || element instanceof Interface || element instanceof Method || element instanceof Attribute) {
                return Promise.resolve({
                    range: {
                        startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                        startColumn: position.column, endColumn: position.column + element.identifier.length
                    },
                    uri: module.uri
                });
            }
            else {
                return null;
            }
        }
        return Promise.resolve({
            range: {
                startLineNumber: decl.position.line, endLineNumber: decl.position.line,
                startColumn: decl.position.column, endColumn: decl.position.column + decl.position.length
            },
            uri: decl.module.uri
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRWRpdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9FZGl0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDcEUsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUNsQyxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUN6RSxPQUFPLEVBQUUsWUFBWSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBQzNDLE9BQU8sRUFBRSx1QkFBdUIsRUFBRSxNQUFNLDhCQUE4QixDQUFDO0FBQ3ZFLE9BQU8sRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDakUsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQWlCLE1BQU0sK0JBQStCLENBQUM7QUFFakYsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHNCQUFzQixDQUFDO0FBRXZELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBQ2pFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQy9ELE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQVVwRCxNQUFNLE9BQU8sTUFBTTtJQVdmLFlBQW1CLElBQWMsRUFBVSxXQUFvQixFQUFVLFVBQW1CO1FBQXpFLFNBQUksR0FBSixJQUFJLENBQVU7UUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUFVLGVBQVUsR0FBVixVQUFVLENBQVM7UUFQNUYsMkJBQXNCLEdBQVksSUFBSSxDQUFDO1FBRXZDLE9BQUUsR0FBaUMsSUFBSSxDQUFDO1FBR3hDLDJCQUFzQixHQUFXLENBQUMsQ0FBQztRQTZTbkMsaUJBQVksR0FBVyxDQUFDLENBQUM7UUErRHpCLGFBQVEsR0FBVyxDQUFDLENB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LE9BQU8sWUFBWSxTQUFTLElBQUksT0FBTyxZQUFZLE1BQU0sSUFBSSxPQUFPLFlBQVksU0FBUyxFQUFFO2dCQUNsSixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7b0JBQ25CLEtBQUssRUFBRTt3QkFDSCxlQUFlLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFDLFVBQVU7d0JBQ3hFLFdBQVcsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTTtxQkFDdkY7b0JBQ0QsR0FBRyxFQUFFLE1BQU0sQ0FBQyxHQUFHO2lCQUNsQixDQUFDLENBQUM7YUFDTjtpQkFBTTtnQkFDSCxPQUFPLElBQUksQ0FBQzthQUNmO1NBQ0o7UUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUM7WUFDbkIsS0FBSyxFQUFFO2dCQUNILGVBQWUsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJO2dCQUN0RSxXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsTUFBTTthQUM1RjtZQUNELEdBQUcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUc7U0FDdkIsQ0FBQyxDQUFDO0lBRVAsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJwcmV0ZXJTdGF0ZSB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL01haW4uanNcIjtcclxuaW1wb3J0IHsgTXlDb21wbGV0aW9uSXRlbVByb3ZpZGVyIH0gZnJvbSBcIi4vTXlDb21wbGV0aW9uSXRlbVByb3ZpZGVyLmpzXCI7XHJcbmltcG9ydCB7IGRlZmluZU15SmF2YSB9IGZyb20gXCIuL015SmF2YS5qc1wiO1xyXG5pbXBvcnQgeyBNeVNpZ25hdHVyZUhlbHBQcm92aWRlciB9IGZyb20gXCIuL015U2lnbmF0dXJlSGVscFByb3ZpZGVyLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBJbnRlcmZhY2UgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kLCBBdHRyaWJ1dGUsIFByaW1pdGl2ZVR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgZ2V0RGVjbGFyYXRpb25Bc1N0cmluZyB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9EZWNsYXJhdGlvbkhlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBNeUhvdmVyUHJvdmlkZXIgfSBmcm9tIFwiLi9NeUhvdmVyUHJvdmlkZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbkJhc2UgfSBmcm9tIFwiLi4vTWFpbkJhc2UuanNcIjtcclxuaW1wb3J0IHsgTXlDb2RlQWN0aW9uUHJvdmlkZXIgfSBmcm9tIFwiLi9NeUNvZGVBY3Rpb25Qcm92aWRlci5qc1wiO1xyXG5pbXBvcnQgeyBNeVJlZmVyZW5jZVByb3ZpZGVyIH0gZnJvbSBcIi4vTXlSZWZlcmVuY2VQcm92aWRlci5qc1wiO1xyXG5pbXBvcnQgeyBFbnVtIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0VudW0uanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uLy4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgU3lzdGVtIH0gZnJvbSBcInBpeGkuanNcIjtcclxuXHJcbmV4cG9ydCB0eXBlIEhpc3RvcnlFbnRyeSA9IHtcclxuICAgIG1vZHVsZV9pZDogbnVtYmVyLFxyXG4gICAgd29ya3NwYWNlX2lkOiBudW1iZXIsXHJcbiAgICBwb3NpdGlvbjogbW9uYWNvLlBvc2l0aW9uO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgRWRpdG9yIGltcGxlbWVudHMgbW9uYWNvLmxhbmd1YWdlcy5SZW5hbWVQcm92aWRlciB7XHJcblxyXG4gICAgZWRpdG9yOiBtb25hY28uZWRpdG9yLklTdGFuZGFsb25lQ29kZUVkaXRvcjtcclxuXHJcbiAgICBoaWdobGlnaHRDdXJyZW50TWV0aG9kOiBib29sZWFuID0gdHJ1ZTtcclxuXHJcbiAgICBjdzogbW9uYWNvLmVkaXRvci5JQ29udGVudFdpZGdldCA9IG51bGw7XHJcblxyXG4gICAgbGFzdFBvc2l0aW9uOiBIaXN0b3J5RW50cnk7XHJcbiAgICBkb250UHVzaE5leHRDdXJzb3JNb3ZlOiBudW1iZXIgPSAwO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtYWluOiBNYWluQmFzZSwgcHJpdmF0ZSBzaG93TWluaW1hcDogYm9vbGVhbiwgcHJpdmF0ZSBpc0VtYmVkZGVkOiBib29sZWFuKSB7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgkZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuXHJcblxyXG4gICAgICAgIGRlZmluZU15SmF2YSgpO1xyXG5cclxuICAgICAgICBtb25hY28uZWRpdG9yLmRlZmluZVRoZW1lKCdteUN1c3RvbVRoZW1lRGFyaycsIHtcclxuICAgICAgICAgICAgYmFzZTogJ3ZzLWRhcmsnLCAvLyBjYW4gYWxzbyBiZSB2cy1kYXJrIG9yIGhjLWJsYWNrXHJcbiAgICAgICAgICAgIGluaGVyaXQ6IHRydWUsIC8vIGNhbiBhbHNvIGJlIGZhbHNlIHRvIGNvbXBsZXRlbHkgcmVwbGFjZSB0aGUgYnVpbHRpbiBydWxlc1xyXG4gICAgICAgICAgICBydWxlczogW1xyXG4gICAgICAgICAgICAgICAgeyB0b2tlbjogJ21ldGhvZCcsIGZvcmVncm91bmQ6ICdkY2RjYWEnLCBmb250U3R5bGU6ICdpdGFsaWMnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAncHJpbnQnLCBmb3JlZ3JvdW5kOiAnZGNkY2FhJywgZm9udFN0eWxlOiAnaXRhbGljIGJvbGQnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAnY2xhc3MnLCBmb3JlZ3JvdW5kOiAnM0RDOUIwJyB9LFxyXG4gICAgICAgICAgICAgICAgeyB0b2tlbjogJ251bWJlcicsIGZvcmVncm91bmQ6ICdiNWNlYTgnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAndHlwZScsIGZvcmVncm91bmQ6ICc0OTljZDYnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAnaWRlbnRpZmllcicsIGZvcmVncm91bmQ6ICc5Y2RjZmUnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAnc3RhdGVtZW50JywgZm9yZWdyb3VuZDogJ2JiOTZjMCcsIGZvbnRTdHlsZTogJ2JvbGQnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAna2V5d29yZCcsIGZvcmVncm91bmQ6ICc2OGJlZDQnLCBmb250U3R5bGU6ICdib2xkJyB9LFxyXG4gICAgICAgICAgICAgICAgLy8geyB0b2tlbjogJ2NvbW1lbnQuanMnLCBmb3JlZ3JvdW5kOiAnMDA4ODAwJywgZm9udFN0eWxlOiAnYm9sZCBpdGFsaWMgdW5kZXJsaW5lJyB9LFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBjb2xvcnM6IHtcclxuICAgICAgICAgICAgICAgIFwiZWRpdG9yLmJhY2tncm91bmRcIjogXCIjMWUxZTFlXCIsXHJcbiAgICAgICAgICAgICAgICBcImpvX2hpZ2hsaWdodE1ldGhvZFwiOiBcIiMyYjJiN2RcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG1vbmFjby5lZGl0b3IuZGVmaW5lVGhlbWUoJ215Q3VzdG9tVGhlbWVMaWdodCcsIHtcclxuICAgICAgICAgICAgYmFzZTogJ3ZzJywgLy8gY2FuIGFsc28gYmUgdnMtZGFyayBvciBoYy1ibGFja1xyXG4gICAgICAgICAgICBpbmhlcml0OiB0cnVlLCAvLyBjYW4gYWxzbyBiZSBmYWxzZSB0byBjb21wbGV0ZWx5IHJlcGxhY2UgdGhlIGJ1aWx0aW4gcnVsZXNcclxuICAgICAgICAgICAgcnVsZXM6IFtcclxuICAgICAgICAgICAgICAgIHsgdG9rZW46ICdtZXRob2QnLCBmb3JlZ3JvdW5kOiAnNjk0RTE2JywgZm9udFN0eWxlOiAnaXRhbGljIGJvbGQnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAncHJpbnQnLCBmb3JlZ3JvdW5kOiAnODExZjNmJywgZm9udFN0eWxlOiAnaXRhbGljIGJvbGQnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAnY2xhc3MnLCBmb3JlZ3JvdW5kOiAnYTAzMDMwJyB9LFxyXG4gICAgICAgICAgICAgICAgeyB0b2tlbjogJ251bWJlcicsIGZvcmVncm91bmQ6ICc0MDQwNDAnIH0sXHJcbiAgICAgICAgICAgICAgICB7IHRva2VuOiAndHlwZScsIGZvcmVncm91bmQ6ICcwMDAwZmYnLCBmb250U3R5bGU6ICdib2xkJyB9LFxyXG4gICAgICAgICAgICAgICAgeyB0b2tlbjogJ2lkZW50aWZpZXInLCBmb3JlZ3JvdW5kOiAnMDAxMDgwJyB9LFxyXG4gICAgICAgICAgICAgICAgeyB0b2tlbjogJ3N0YXRlbWVudCcsIGZvcmVncm91bmQ6ICc4MDAwZTAnLCBmb250U3R5bGU6ICdib2xkJyB9LFxyXG4gICAgICAgICAgICAgICAgeyB0b2tlbjogJ2tleXdvcmQnLCBmb3JlZ3JvdW5kOiAnMDBhMDAwJywgZm9udFN0eWxlOiAnYm9sZCcgfSxcclxuICAgICAgICAgICAgICAgIHsgdG9rZW46ICdjb21tZW50JywgZm9yZWdyb3VuZDogJzgwODA4MCcsIGZvbnRTdHlsZTogJ2l0YWxpYycgfSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgY29sb3JzOiB7XHJcbiAgICAgICAgICAgICAgICBcImVkaXRvci5iYWNrZ3JvdW5kXCI6IFwiI0ZGRkZGRlwiLFxyXG4gICAgICAgICAgICAgICAgXCJlZGl0b3IuZm9yZWdyb3VuZFwiOiBcIiMwMDAwMDBcIixcclxuICAgICAgICAgICAgICAgIFwiZWRpdG9yLmluYWN0aXZlU2VsZWN0aW9uQmFja2dyb3VuZFwiOiBcIiNFNUVCRjFcIixcclxuICAgICAgICAgICAgICAgIFwiZWRpdG9ySW5kZW50R3VpZGUuYmFja2dyb3VuZFwiOiBcIiNEM0QzRDNcIixcclxuICAgICAgICAgICAgICAgIFwiZWRpdG9ySW5kZW50R3VpZGUuYWN0aXZlQmFja2dyb3VuZFwiOiBcIiM5MzkzOTNcIixcclxuICAgICAgICAgICAgICAgIFwiZWRpdG9yLnNlbGVjdGlvbkhpZ2hsaWdodEJhY2tncm91bmRcIjogXCIjQURENkZGODBcIixcclxuICAgICAgICAgICAgICAgIFwiZWRpdG9yU3VnZ2VzdFdpZGdldC5iYWNrZ3JvdW5kXCI6IFwiI0YzRjNGM1wiLFxyXG4gICAgICAgICAgICAgICAgXCJhY3Rpdml0eUJhckJhZGdlLmJhY2tncm91bmRcIjogXCIjMDA3QUNDXCIsXHJcbiAgICAgICAgICAgICAgICBcInNpZGVCYXJUaXRsZS5mb3JlZ3JvdW5kXCI6IFwiIzZGNkY2RlwiLFxyXG4gICAgICAgICAgICAgICAgXCJsaXN0LmhvdmVyQmFja2dyb3VuZFwiOiBcIiNFOEU4RThcIixcclxuICAgICAgICAgICAgICAgIFwiaW5wdXQucGxhY2Vob2xkZXJGb3JlZ3JvdW5kXCI6IFwiIzc2NzY3NlwiLFxyXG4gICAgICAgICAgICAgICAgXCJzZWFyY2hFZGl0b3IudGV4dElucHV0Qm9yZGVyXCI6IFwiI0NFQ0VDRVwiLFxyXG4gICAgICAgICAgICAgICAgXCJzZXR0aW5ncy50ZXh0SW5wdXRCb3JkZXJcIjogXCIjQ0VDRUNFXCIsXHJcbiAgICAgICAgICAgICAgICBcInNldHRpbmdzLm51bWJlcklucHV0Qm9yZGVyXCI6IFwiI0NFQ0VDRVwiLFxyXG4gICAgICAgICAgICAgICAgXCJzdGF0dXNCYXJJdGVtLnJlbW90ZUZvcmVncm91bmRcIjogXCIjRkZGXCIsXHJcbiAgICAgICAgICAgICAgICBcInN0YXR1c0Jhckl0ZW0ucmVtb3RlQmFja2dyb3VuZFwiOiBcIiMxNjgyNURcIixcclxuICAgICAgICAgICAgICAgIFwiam9faGlnaGxpZ2h0TWV0aG9kXCI6IFwiI2JhYmFlY1wiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yID0gbW9uYWNvLmVkaXRvci5jcmVhdGUoJGVsZW1lbnRbMF0sIHtcclxuICAgICAgICAgICAgLy8gdmFsdWU6IFtcclxuICAgICAgICAgICAgLy8gICAgICdmdW5jdGlvbiB4KCkgeycsXHJcbiAgICAgICAgICAgIC8vICAgICAnXFx0Y29uc29sZS5sb2coXCJIZWxsbyB3b3JsZCFcIik7JyxcclxuICAgICAgICAgICAgLy8gICAgICd9J1xyXG4gICAgICAgICAgICAvLyBdLmpvaW4oJ1xcbicpLFxyXG4gICAgICAgICAgICAvLyBsYW5ndWFnZTogJ215SmF2YScsXHJcbiAgICAgICAgICAgIGxhbmd1YWdlOiAnbXlKYXZhJyxcclxuICAgICAgICAgICAgbGlnaHRidWxiOiB7XHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIC8vIGdvdG9Mb2NhdGlvbjoge1xyXG4gICAgICAgICAgICAvLyAgICAgbXVsdGlwbGVSZWZlcmVuY2VzOiBcImdvdG9BbmRQZWVrXCJcclxuICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgbGluZURlY29yYXRpb25zV2lkdGg6IDAsXHJcbiAgICAgICAgICAgIHBlZWtXaWRnZXREZWZhdWx0Rm9jdXM6IFwidHJlZVwiLFxyXG4gICAgICAgICAgICBmaXhlZE92ZXJmbG93V2lkZ2V0czogdHJ1ZSxcclxuICAgICAgICAgICAgcXVpY2tTdWdnZXN0aW9uczogdHJ1ZSxcclxuICAgICAgICAgICAgcXVpY2tTdWdnZXN0aW9uc0RlbGF5OiAxMCxcclxuICAgICAgICAgICAgZm9udFNpemU6IDE0LFxyXG4gICAgICAgICAgICBmb250RmFtaWx5OiBcIkNvbnNvbGFzLCBSb2JvdG8gTW9ub1wiLFxyXG4gICAgICAgICAgICBmb250V2VpZ2h0OiBcIjUwMFwiLFxyXG4gICAgICAgICAgICByb3VuZGVkU2VsZWN0aW9uOiB0cnVlLFxyXG4gICAgICAgICAgICBzZWxlY3RPbkxpbmVOdW1iZXJzOiBmYWxzZSxcclxuICAgICAgICAgICAgLy8gc2VsZWN0aW9uSGlnaGxpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgYXV0b21hdGljTGF5b3V0OiB0cnVlLFxyXG4gICAgICAgICAgICBzY3JvbGxCZXlvbmRMYXN0TGluZTogZmFsc2UsXHJcbiAgICAgICAgICAgIG9jY3VycmVuY2VzSGlnaGxpZ2h0OiBmYWxzZSxcclxuICAgICAgICAgICAgYXV0b0luZGVudDogXCJmdWxsXCIsXHJcbiAgICAgICAgICAgIGRyYWdBbmREcm9wOiB0cnVlLFxyXG4gICAgICAgICAgICBmb3JtYXRPblR5cGU6IHRydWUsXHJcbiAgICAgICAgICAgIGZvcm1hdE9uUGFzdGU6IHRydWUsXHJcbiAgICAgICAgICAgIHN1Z2dlc3RGb250U2l6ZTogMTYsXHJcbiAgICAgICAgICAgIHN1Z2dlc3RMaW5lSGVpZ2h0OiAyMixcclxuICAgICAgICAgICAgc3VnZ2VzdDoge1xyXG4gICAgICAgICAgICAgICAgbG9jYWxpdHlCb251czogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIC8vIHNuaXBwZXRzUHJldmVudFF1aWNrU3VnZ2VzdGlvbnM6IGZhbHNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHBhcmFtZXRlckhpbnRzOiB7IGVuYWJsZWQ6IHRydWUsIGN5Y2xlOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIC8vIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICAvLyBjb250cmliSW5mbzoge1xyXG4gICAgICAgICAgICAvLyAgICAgc3VnZ2VzdFNlbGVjdGlvbjogJ3JlY2VudGx5VXNlZEJ5UHJlZml4JyxcclxuICAgICAgICAgICAgLy8gfSxcclxuXHJcbiAgICAgICAgICAgIG1vdXNlV2hlZWxab29tOiB0aGlzLmlzRW1iZWRkZWQsXHJcblxyXG4gICAgICAgICAgICBtaW5pbWFwOiB7XHJcbiAgICAgICAgICAgICAgICBlbmFibGVkOiB0aGlzLnNob3dNaW5pbWFwXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNjcm9sbGJhcjoge1xyXG4gICAgICAgICAgICAgICAgdmVydGljYWw6ICdhdXRvJyxcclxuICAgICAgICAgICAgICAgIGhvcml6b250YWw6ICdhdXRvJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB0aGVtZTogXCJteUN1c3RvbVRoZW1lRGFya1wiLFxyXG4gICAgICAgICAgICAvLyBhdXRvbWF0aWNMYXlvdXQ6IHRydWVcclxuXHJcblxyXG4gICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvci5vbktleURvd24oKGU6IG1vbmFjby5JS2V5Ym9hcmRFdmVudCkgPT4ge1xyXG4gICAgICAgICAgICBsZXQgc3RhdGUgPSB0aGlzLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKS5zdGF0ZTtcclxuXHJcbiAgICAgICAgICAgIGlmIChbSW50ZXJwcmV0ZXJTdGF0ZS5kb25lLCBJbnRlcnByZXRlclN0YXRlLmVycm9yLCBJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZF0uaW5kZXhPZihzdGF0ZSkgPCAwKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGUuY29kZS5pbmRleE9mKFwiQXJyb3dcIikgPj0gMCB8fCBlLmNvZGUuaW5kZXhPZihcIlBhZ2VcIikgPj0gMCkgcmV0dXJuOyAvLyBkb24ndCByZWFjdCB0byBDdXJzb3Iga2V5c1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5nZXRBY3Rpb25NYW5hZ2VyKCkudHJpZ2dlcihcImludGVycHJldGVyLnN0b3BcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gdGhpcy51cmkgPSBtb25hY28uVXJpLmZyb20oeyBwYXRoOiAnL2ZpbGUxLmphdmEnLCBzY2hlbWU6ICdmaWxlJyB9KVxyXG4gICAgICAgIC8vIHRoaXMubW9kZWxKYXZhID0gbW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlwiLCBcIm15SmF2YVwiLCB0aGlzLnVyaSk7XHJcbiAgICAgICAgLy8gdGhpcy5lZGl0b3Iuc2V0TW9kZWwodGhpcy5tb2RlbEphdmEpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBtb3VzZVdoZWVsTGlzdGVuZXIgPSAoZXZlbnQ6IFdoZWVsRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50LmN0cmxLZXkgPT09IHRydWUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmNoYW5nZUVkaXRvckZvbnRTaXplKE1hdGguc2lnbihldmVudC5kZWx0YVkpLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmlzRW1iZWRkZWQpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBfbWFpbjogTWFpbiA9IDxNYWluPnRoaXMubWFpbjtcclxuXHJcbiAgICAgICAgICAgIF9tYWluLndpbmRvd1N0YXRlTWFuYWdlci5yZWdpc3RlckJhY2tCdXR0b25MaXN0ZW5lcigoZXZlbnQ6IFBvcFN0YXRlRXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCBoaXN0b3J5RW50cnk6IEhpc3RvcnlFbnRyeSA9IDxIaXN0b3J5RW50cnk+ZXZlbnQuc3RhdGU7XHJcbiAgICAgICAgICAgICAgICBpZihldmVudC5zdGF0ZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBsZXQgd29ya3NwYWNlOiBXb3Jrc3BhY2UgPSBfbWFpbi53b3Jrc3BhY2VMaXN0LmZpbmQoKHdzKSA9PiB3cy5pZCA9PSBoaXN0b3J5RW50cnkud29ya3NwYWNlX2lkKTtcclxuICAgICAgICAgICAgICAgIGlmKHdvcmtzcGFjZSA9PSBudWxsKSByZXR1cm47XHJcbiAgICAgICAgICAgICAgICBsZXQgbW9kdWxlOiBNb2R1bGUgPSB3b3Jrc3BhY2UubW9kdWxlU3RvcmUuZmluZE1vZHVsZUJ5SWQoaGlzdG9yeUVudHJ5Lm1vZHVsZV9pZCk7XHJcbiAgICAgICAgICAgICAgICBpZihtb2R1bGUgPT0gbnVsbCkgcmV0dXJuOyBcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlByb2Nlc3NpbmcgcG9wIHN0YXRlIGV2ZW50LCByZXR1cm5pbmcgdG8gbW9kdWxlIFwiICsgaGlzdG9yeUVudHJ5Lm1vZHVsZV9pZCk7XHJcblxyXG4gICAgICAgICAgICAgICAgaWYod29ya3NwYWNlICE9IF9tYWluLmN1cnJlbnRXb3Jrc3BhY2UpIFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZG9udFB1c2hOZXh0Q3Vyc29yTW92ZSsrO1xyXG4gICAgICAgICAgICAgICAgICAgIF9tYWluLnByb2plY3RFeHBsb3Jlci5zZXRXb3Jrc3BhY2VBY3RpdmUod29ya3NwYWNlKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmRvbnRQdXNoTmV4dEN1cnNvck1vdmUtLTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmKG1vZHVsZSAhPSBfbWFpbi5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5kb250UHVzaE5leHRDdXJzb3JNb3ZlKys7XHJcbiAgICAgICAgICAgICAgICAgICAgX21haW4ucHJvamVjdEV4cGxvcmVyLnNldE1vZHVsZUFjdGl2ZShtb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQuZG9udFB1c2hOZXh0Q3Vyc29yTW92ZS0tO1xyXG4gICAgICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgICAgIHRoYXQuZG9udFB1c2hOZXh0Q3Vyc29yTW92ZSsrO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5lZGl0b3Iuc2V0UG9zaXRpb24oaGlzdG9yeUVudHJ5LnBvc2l0aW9uKTtcclxuICAgICAgICAgICAgICAgIHRoYXQuZWRpdG9yLnJldmVhbFBvc2l0aW9uKGhpc3RvcnlFbnRyeS5wb3NpdGlvbik7XHJcbiAgICAgICAgICAgICAgICB0aGF0LmRvbnRQdXNoTmV4dEN1cnNvck1vdmUtLTtcclxuICAgICAgICAgICAgICAgIHRoYXQucHVzaEhpc3RvcnlTdGF0ZSh0cnVlLCBoaXN0b3J5RW50cnkpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yLm9uRGlkQ2hhbmdlQ29uZmlndXJhdGlvbigoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKGV2ZW50Lmhhc0NoYW5nZWQobW9uYWNvLmVkaXRvci5FZGl0b3JPcHRpb24uZm9udEluZm8pICYmIHRoaXMuaXNFbWJlZGRlZCkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKS5lcnJvck1hbmFnZXIucmVnaXN0ZXJMaWdodGJ1bGJPbkNsaWNrRnVuY3Rpb25zKCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yLm9uRGlkQ2hhbmdlQ3Vyc29yUG9zaXRpb24oKGV2ZW50KSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgY3VycmVudE1vZGVsSWQgPSB0aGlzLm1haW4uZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkuZmlsZS5pZDtcclxuICAgICAgICAgICAgbGV0IHB1c2hOZWVkZWQgPSB0aGlzLmxhc3RQb3NpdGlvbiA9PSBudWxsXHJcbiAgICAgICAgICAgICAgICB8fCBldmVudC5zb3VyY2UgPT0gXCJhcGlcIlxyXG4gICAgICAgICAgICAgICAgfHwgY3VycmVudE1vZGVsSWQgIT0gdGhpcy5sYXN0UG9zaXRpb24ubW9kdWxlX2lkXHJcbiAgICAgICAgICAgICAgICB8fCBNYXRoLmFicyh0aGlzLmxhc3RQb3NpdGlvbi5wb3NpdGlvbi5saW5lTnVtYmVyIC0gZXZlbnQucG9zaXRpb24ubGluZU51bWJlcikgPiAyMDtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGlmKHB1c2hOZWVkZWQgJiYgdGhpcy5kb250UHVzaE5leHRDdXJzb3JNb3ZlID09IDApe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoSGlzdG9yeVN0YXRlKGZhbHNlLCB0aGlzLmdldFBvc2l0aW9uRm9ySGlzdG9yeSgpKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmKGN1cnJlbnRNb2RlbElkID09IGhpc3Rvcnkuc3RhdGU/Lm1vZHVsZV9pZCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEhpc3RvcnlTdGF0ZSh0cnVlLCB0aGlzLmdldFBvc2l0aW9uRm9ySGlzdG9yeSgpKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhhdC5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKGV2ZW50LnBvc2l0aW9uKTtcclxuXHJcbiAgICAgICAgICAgIHRoYXQub25FdmFsdWF0ZVNlbGVjdGVkVGV4dChldmVudCk7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBXZSBuZWVkIHRoaXMgdG8gc2V0IG91ciBtb2RlbCBhZnRlciB1c2VyIHVzZXMgU3RyZytjbGljayBvbiBpZGVudGlmaWVyXHJcbiAgICAgICAgdGhpcy5lZGl0b3Iub25EaWRDaGFuZ2VNb2RlbCgoZXZlbnQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCBlbGVtZW50OiBIVE1MRGl2RWxlbWVudCA9IDxhbnk+JGVsZW1lbnQuZmluZCgnLm1vbmFjby1lZGl0b3InKVswXTtcclxuICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgbW91c2VXaGVlbExpc3RlbmVyKTtcclxuICAgICAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKFwid2hlZWxcIiwgbW91c2VXaGVlbExpc3RlbmVyLCB7IHBhc3NpdmU6IGZhbHNlIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkgPT0gbnVsbCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgbGV0IG1vZHVsZSA9IHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkuZ2V0TW9kdWxlQnlNb25hY29Nb2RlbCh0aGlzLmVkaXRvci5nZXRNb2RlbCgpKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMubWFpbiBpbnN0YW5jZW9mIE1haW4gJiYgbW9kdWxlICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBpZighdGhpcy5kb250UHVzaEhpc3RvcnlTdGF0ZU9uTmV4dE1vZGVsQ2hhbmdlKXtcclxuICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLmxhc3RQb3NpdGlvbiA9IHtcclxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgcG9zaXRpb246IHRoaXMuZWRpdG9yLmdldFBvc2l0aW9uKCksXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHdvcmtzcGFjZV9pZDogdGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5pZCxcclxuICAgICAgICAgICAgICAgIC8vICAgICAgICAgbW9kdWxlX2lkOiBtb2R1bGUuZmlsZS5pZFxyXG4gICAgICAgICAgICAgICAgLy8gICAgIH1cclxuICAgICAgICAgICAgICAgIC8vICAgICB0aGlzLnB1c2hIaXN0b3J5U3RhdGUoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kb250UHVzaEhpc3RvcnlTdGF0ZU9uTmV4dE1vZGVsQ2hhbmdlID0gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5zZXRBY3RpdmVBZnRlckV4dGVybmFsTW9kZWxTZXQobW9kdWxlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcHVzaE5lZWRlZCA9IHRoaXMubGFzdFBvc2l0aW9uID09IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB8fCBtb2R1bGUuZmlsZS5pZCAhPSB0aGlzLmxhc3RQb3NpdGlvbi5tb2R1bGVfaWQ7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIGlmKHB1c2hOZWVkZWQgJiYgdGhpcy5kb250UHVzaE5leHRDdXJzb3JNb3ZlID09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHVzaEhpc3RvcnlTdGF0ZShmYWxzZSwgdGhpcy5nZXRQb3NpdGlvbkZvckhpc3RvcnkoKSk7XHJcbiAgICAgICAgICAgICAgICB9ICAgIFxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlclJlbmFtZVByb3ZpZGVyKCdteUphdmEnLCB0aGlzKTtcclxuXHJcbiAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckRlZmluaXRpb25Qcm92aWRlcignbXlKYXZhJywge1xyXG4gICAgICAgICAgICBwcm92aWRlRGVmaW5pdGlvbjogKG1vZGVsLCBwb3NpdGlvbiwgY2FuY2VsbGF0aW9uVG9rZW4pID0+IHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGF0LnByb3ZpZGVEZWZpbml0aW9uKG1vZGVsLCBwb3NpdGlvbiwgY2FuY2VsbGF0aW9uVG9rZW4pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG1vbmFjby5sYW5ndWFnZXMucmVnaXN0ZXJIb3ZlclByb3ZpZGVyKCdteUphdmEnLCBuZXcgTXlIb3ZlclByb3ZpZGVyKHRoaXMpKTtcclxuXHJcbiAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckNvbXBsZXRpb25JdGVtUHJvdmlkZXIoJ215SmF2YScsIG5ldyBNeUNvbXBsZXRpb25JdGVtUHJvdmlkZXIodGhpcy5tYWluKSk7XHJcbiAgICAgICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckNvZGVBY3Rpb25Qcm92aWRlcignbXlKYXZhJywgbmV3IE15Q29kZUFjdGlvblByb3ZpZGVyKHRoaXMubWFpbikpO1xyXG4gICAgICAgIG1vbmFjby5sYW5ndWFnZXMucmVnaXN0ZXJSZWZlcmVuY2VQcm92aWRlcignbXlKYXZhJywgbmV3IE15UmVmZXJlbmNlUHJvdmlkZXIodGhpcy5tYWluKSk7XHJcblxyXG5cclxuICAgICAgICBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVyU2lnbmF0dXJlSGVscFByb3ZpZGVyKCdteUphdmEnLCBuZXcgTXlTaWduYXR1cmVIZWxwUHJvdmlkZXIodGhpcy5tYWluKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZWRpdG9yLm9uTW91c2VEb3duKChlOiBtb25hY28uZWRpdG9yLklFZGl0b3JNb3VzZUV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IGRhdGEgPSBlLnRhcmdldC5kZXRhaWw7XHJcbiAgICAgICAgICAgIGlmIChlLnRhcmdldC50eXBlICE9PSBtb25hY28uZWRpdG9yLk1vdXNlVGFyZ2V0VHlwZS5HVVRURVJfR0xZUEhfTUFSR0lOICYmXHJcbiAgICAgICAgICAgICAgICBlLnRhcmdldC50eXBlICE9PSBtb25hY28uZWRpdG9yLk1vdXNlVGFyZ2V0VHlwZS5HVVRURVJfTElORV9OVU1CRVJTIHx8IGRhdGEuaXNBZnRlckxpbmVzKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgdGhhdC5vbk1hcmdpbk1vdXNlRG93bihlLnRhcmdldC5wb3NpdGlvbi5saW5lTnVtYmVyKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICAgICAgLy8gSWYgZWRpdG9yIGlzIGluc3RhbnRpYXRlZCBiZWZvcmUgZm9udHMgYXJlIGxvYWRlZCB0aGVuIGluZGVudGF0aW9uLWxpbmVzXHJcbiAgICAgICAgLy8gYXJlIG1pc3BsYWNlZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9NaWNyb3NvZnQvbW9uYWNvLWVkaXRvci9pc3N1ZXMvMzkyXHJcbiAgICAgICAgLy8gc286XHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIG1vbmFjby5lZGl0b3IucmVtZWFzdXJlRm9udHMoKTtcclxuICAgICAgICB9LCAyMDAwKTtcclxuXHJcbiAgICAgICAgdGhpcy5hZGRBY3Rpb25zKCk7XHJcblxyXG4gICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgIHRoaXMuZWRpdG9yLm9uRGlkVHlwZSgodGV4dCkgPT4geyB0aGF0Lm9uRGlkVHlwZSh0ZXh0KSB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFBvc2l0aW9uRm9ySGlzdG9yeSgpOiBIaXN0b3J5RW50cnkge1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIHBvc2l0aW9uOiB0aGlzLmVkaXRvci5nZXRQb3NpdGlvbigpLFxyXG4gICAgICAgICAgICB3b3Jrc3BhY2VfaWQ6IHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkuaWQsXHJcbiAgICAgICAgICAgIG1vZHVsZV9pZDogdGhpcy5tYWluLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpLmZpbGUuaWRcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgbGFzdFB1c2hUaW1lOiBudW1iZXIgPSAwO1xyXG4gICAgcHVzaEhpc3RvcnlTdGF0ZShyZXBsYWNlOiBib29sZWFuLCBoaXN0b3J5RW50cnk6IEhpc3RvcnlFbnRyeSl7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYodGhpcy5tYWluLmlzRW1iZWRkZWQoKSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBpZihyZXBsYWNlKXtcclxuICAgICAgICAgICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoaGlzdG9yeUVudHJ5LCBcIlwiKTsgLy9gSmF2YS1PbmxpbmUsICR7bW9kdWxlLmZpbGUubmFtZX0gKFplaWxlICR7dGhpcy5sYXN0UG9zaXRpb24ucG9zaXRpb24ubGluZU51bWJlcn0sIFNwYWx0ZSAke3RoaXMubGFzdFBvc2l0aW9uLnBvc2l0aW9uLmNvbHVtbn0pYCk7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUmVwbGFjZSBIaXN0b3J5IHN0YXRlIHdpdGggd29ya3NwYWNlLWlkOiBcIiArIGhpc3RvcnlFbnRyeS53b3Jrc3BhY2VfaWQgKyBcIiwgbW9kdWxlLWlkOiBcIiArIGhpc3RvcnlFbnRyeS5tb2R1bGVfaWQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCB0aW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XHJcbiAgICAgICAgICAgIGlmKHRpbWUgLSB0aGlzLmxhc3RQdXNoVGltZSA+IDIwMCl7XHJcbiAgICAgICAgICAgICAgICBoaXN0b3J5LnB1c2hTdGF0ZShoaXN0b3J5RW50cnksIFwiXCIpOyAvL2BKYXZhLU9ubGluZSwgJHttb2R1bGUuZmlsZS5uYW1lfSAoWmVpbGUgJHtoaXN0b3J5RW50cnkucG9zaXRpb24ubGluZU51bWJlcn0sIFNwYWx0ZSAke2hpc3RvcnlFbnRyeS5wb3NpdGlvbi5jb2x1bW59KWApO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaGlzdG9yeS5yZXBsYWNlU3RhdGUoaGlzdG9yeUVudHJ5LCBcIlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmxhc3RQdXNoVGltZSA9IHRpbWU7XHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUHVzaGVkIEhpc3Rvcnkgc3RhdGUgd2l0aCB3b3Jrc3BhY2UtaWQ6IFwiICsgaGlzdG9yeUVudHJ5LndvcmtzcGFjZV9pZCArIFwiLCBtb2R1bGUtaWQ6IFwiICsgaGlzdG9yeUVudHJ5Lm1vZHVsZV9pZCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmxhc3RQb3NpdGlvbiA9IGhpc3RvcnlFbnRyeTtcclxuICAgIH1cclxuXHJcbiAgICBvbkRpZFR5cGUodGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgLy8gICAgICAgIGNvbnN0IGVuZE9mQ29tbWVudFRleHQgPSBcIiAqIFxcbiAqL1wiO1xyXG5cclxuICAgICAgICBjb25zdCBpbnNlcnRFbmRPZkNvbW1lbnQgPSAocG9zLCBpbnNlcnRUZXh0OiBzdHJpbmcsIG5ld0xpbmU6IG51bWJlciwgbmV3Q29sdW1uOiBudW1iZXIpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgcmFuZ2UgPSBuZXcgbW9uYWNvLlJhbmdlKFxyXG4gICAgICAgICAgICAgICAgcG9zLmxpbmVOdW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwb3MuY29sdW1uLFxyXG4gICAgICAgICAgICAgICAgcG9zLmxpbmVOdW1iZXIsXHJcbiAgICAgICAgICAgICAgICBwb3MuY29sdW1uXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLmV4ZWN1dGVFZGl0cyhcIm5ldy1idWxsZXRzXCIsIFtcclxuICAgICAgICAgICAgICAgIHsgcmFuZ2UsIHRleHQ6IGluc2VydFRleHQgfVxyXG4gICAgICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgICAgIC8vIFNldCBwb3NpdGlvbiBhZnRlciBidWxsZXRUZXh0XHJcbiAgICAgICAgICAgIHRoaXMuZWRpdG9yLnNldFBvc2l0aW9uKHtcclxuICAgICAgICAgICAgICAgIGxpbmVOdW1iZXI6IG5ld0xpbmUsXHJcbiAgICAgICAgICAgICAgICBjb2x1bW46IG5ld0NvbHVtblxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAodGV4dCA9PT0gXCJcXG5cIikge1xyXG4gICAgICAgICAgICBjb25zdCBtb2RlbCA9IHRoaXMuZWRpdG9yLmdldE1vZGVsKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0UG9zaXRpb24oKTtcclxuICAgICAgICAgICAgY29uc3QgcHJldkxpbmUgPSBtb2RlbC5nZXRMaW5lQ29udGVudChwb3NpdGlvbi5saW5lTnVtYmVyIC0gMSk7XHJcbiAgICAgICAgICAgIGlmIChwcmV2TGluZS50cmltKCkuaW5kZXhPZihcIi8qXCIpID09PSAwICYmICFwcmV2TGluZS50cmltUmlnaHQoKS5lbmRzV2l0aChcIiovXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBuZXh0TGluZSA9IHBvc2l0aW9uLmxpbmVOdW1iZXIgPCBtb2RlbC5nZXRMaW5lQ291bnQoKSA/IG1vZGVsLmdldExpbmVDb250ZW50KHBvc2l0aW9uLmxpbmVOdW1iZXIgKyAxKSA6IFwiXCI7XHJcbiAgICAgICAgICAgICAgICBpZighbmV4dExpbmUudHJpbSgpLnN0YXJ0c1dpdGgoXCIqXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgc3BhY2VzQXRCZWdpbm5pbmdPZkxpbmU6IHN0cmluZyA9IHByZXZMaW5lLnN1YnN0cigwLCBwcmV2TGluZS5sZW5ndGggLSBwcmV2TGluZS50cmltTGVmdCgpLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHByZXZMaW5lLnRyaW0oKS5pbmRleE9mKFwiLyoqXCIpID09PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydEVuZE9mQ29tbWVudChwb3NpdGlvbiwgXCJcXG5cIiArIHNwYWNlc0F0QmVnaW5uaW5nT2ZMaW5lICsgXCIgKi9cIiwgcG9zaXRpb24ubGluZU51bWJlciwgcG9zaXRpb24uY29sdW1uICsgMyArIHNwYWNlc0F0QmVnaW5uaW5nT2ZMaW5lLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0RW5kT2ZDb21tZW50KHBvc2l0aW9uLCBcIiAqIFxcblwiICsgc3BhY2VzQXRCZWdpbm5pbmdPZkxpbmUgKyBcIiAqL1wiLCBwb3NpdGlvbi5saW5lTnVtYmVyLCBwb3NpdGlvbi5jb2x1bW4gKyAzICsgc3BhY2VzQXRCZWdpbm5pbmdPZkxpbmUubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbiAgICBsYXN0VGltZTogbnVtYmVyID0gMDtcclxuICAgIHNldEZvbnRTaXplKGZvbnRTaXplUHg6IG51bWJlcikge1xyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIlNldCBmb250IHNpemU6IFwiICsgZm9udFNpemVQeCk7XHJcbiAgICAgICAgbGV0IHRpbWUgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcclxuICAgICAgICBpZiAodGltZSAtIHRoaXMubGFzdFRpbWUgPCAxNTApIHJldHVybjtcclxuICAgICAgICB0aGlzLmxhc3RUaW1lID0gdGltZTtcclxuXHJcbiAgICAgICAgbGV0IGVkaXRvcmZzID0gdGhpcy5lZGl0b3IuZ2V0T3B0aW9ucygpLmdldChtb25hY28uZWRpdG9yLkVkaXRvck9wdGlvbi5mb250U2l6ZSk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW4gaW5zdGFuY2VvZiBNYWluKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi52aWV3TW9kZUNvbnRyb2xsZXIuc2F2ZUZvbnRTaXplKGZvbnRTaXplUHgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGZvbnRTaXplUHggIT0gZWRpdG9yZnMpIHtcclxuICAgICAgICAgICAgdGhpcy5lZGl0b3IudXBkYXRlT3B0aW9ucyh7XHJcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogZm9udFNpemVQeFxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIC8vIGVkaXRvciBkb2VzIG5vdCBzZXQgZm9udFNpemVQeCwgYnV0IGZvbnRTaXplUHggKiB6b29tZmFjdG9yIHdpdGggdW5rbm93biB6b29tIGZhY3Rvciwgc28gXHJcbiAgICAgICAgICAgIC8vIHdlIGhhdmUgdG8gZG8gdGhpcyBkaXJ0eSB3b3JrYXJvdW5kOlxyXG4gICAgICAgICAgICBsZXQgbmV3RWRpdG9yZnMgPSB0aGlzLmVkaXRvci5nZXRPcHRpb25zKCkuZ2V0KG1vbmFjby5lZGl0b3IuRWRpdG9yT3B0aW9uLmZvbnRTaXplKTtcclxuICAgICAgICAgICAgbGV0IGZhY3RvciA9IG5ld0VkaXRvcmZzIC8gZm9udFNpemVQeDtcclxuICAgICAgICAgICAgdGhpcy5lZGl0b3IudXBkYXRlT3B0aW9ucyh7XHJcbiAgICAgICAgICAgICAgICBmb250U2l6ZTogZm9udFNpemVQeCAvIGZhY3RvclxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBib3R0b21EaXYxID0gdGhpcy5tYWluLmdldEJvdHRvbURpdigpO1xyXG4gICAgICAgICAgICBpZiAoYm90dG9tRGl2MSAhPSBudWxsICYmIGJvdHRvbURpdjEuY29uc29sZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBib3R0b21EaXYxLmNvbnNvbGUuZWRpdG9yLnVwZGF0ZU9wdGlvbnMoe1xyXG4gICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiBmb250U2l6ZVB4IC8gZmFjdG9yXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBib3R0b21EaXYgPSB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk7XHJcbiAgICAgICAgaWYgKGJvdHRvbURpdiAhPSBudWxsICYmIGJvdHRvbURpdi5jb25zb2xlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0ICRjb21tYW5kTGluZSA9IGJvdHRvbURpdi4kYm90dG9tRGl2LmZpbmQoJy5qb19jb21tYW5kbGluZScpO1xyXG4gICAgICAgICAgICAkY29tbWFuZExpbmUuY3NzKHtcclxuICAgICAgICAgICAgICAgIGhlaWdodDogKGZvbnRTaXplUHggKiAxLjEgKyA0KSArIFwicHhcIixcclxuICAgICAgICAgICAgICAgIFwibGluZS1oZWlnaHRcIjogKGZvbnRTaXplUHggKiAxLjEgKyA0KSArIFwicHhcIlxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICBib3R0b21EaXYuY29uc29sZS5lZGl0b3IubGF5b3V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy8gbGV0IG5ld0VkaXRvcmZzID0gdGhpcy5lZGl0b3IuZ2V0T3B0aW9ucygpLmdldChtb25hY28uZWRpdG9yLkVkaXRvck9wdGlvbi5mb250U2l6ZSk7XHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHtlZGl0b3JGUzogZWRpdG9yZnMsIG5ld0ZzOiBmb250U2l6ZVB4LCBuZXdFZGl0b3JGczogbmV3RWRpdG9yZnN9KTtcclxuXHJcblxyXG4gICAgICAgIGpRdWVyeSgnLmpvX2VkaXRvckZvbnRTaXplJykuY3NzKCdmb250LXNpemUnLCBmb250U2l6ZVB4ICsgXCJweFwiKTtcclxuICAgICAgICBqUXVlcnkoJy5qb19lZGl0b3JGb250U2l6ZScpLmNzcygnbGluZS1oZWlnaHQnLCAoZm9udFNpemVQeCArIDIpICsgXCJweFwiKTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLWJyZWFrcG9pbnQtc2l6ZScsIGZvbnRTaXplUHggKyAncHgnKTtcclxuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tYnJlYWtwb2ludC1yYWRpdXMnLCBmb250U2l6ZVB4IC8gMiArICdweCcpO1xyXG5cclxuXHJcbiAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpLmVycm9yTWFuYWdlci5yZWdpc3RlckxpZ2h0YnVsYk9uQ2xpY2tGdW5jdGlvbnMoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgY2hhbmdlRWRpdG9yRm9udFNpemUoZGVsdGE6IG51bWJlciwgZHluYW1pYzogYm9vbGVhbiA9IHRydWUpIHtcclxuICAgICAgICBsZXQgZWRpdG9yZnMgPSB0aGlzLmVkaXRvci5nZXRPcHRpb25zKCkuZ2V0KG1vbmFjby5lZGl0b3IuRWRpdG9yT3B0aW9uLmZvbnRTaXplKTtcclxuXHJcbiAgICAgICAgaWYgKGR5bmFtaWMpIHtcclxuICAgICAgICAgICAgaWYgKGVkaXRvcmZzIDwgMTApIHtcclxuICAgICAgICAgICAgICAgIGRlbHRhICo9IDE7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWRpdG9yZnMgPCAyMCkge1xyXG4gICAgICAgICAgICAgICAgZGVsdGEgKj0gMjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGRlbHRhICo9IDQ7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBuZXdFZGl0b3JGcyA9IGVkaXRvcmZzICsgZGVsdGE7XHJcbiAgICAgICAgaWYgKG5ld0VkaXRvckZzID49IDYgJiYgbmV3RWRpdG9yRnMgPD0gODApIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRGb250U2l6ZShuZXdFZGl0b3JGcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBhZGRBY3Rpb25zKCkge1xyXG4gICAgICAgIHRoaXMuZWRpdG9yLmFkZEFjdGlvbih7XHJcbiAgICAgICAgICAgIC8vIEFuIHVuaXF1ZSBpZGVudGlmaWVyIG9mIHRoZSBjb250cmlidXRlZCBhY3Rpb24uXHJcbiAgICAgICAgICAgIGlkOiAnRmluZCBicmFja2V0JyxcclxuXHJcbiAgICAgICAgICAgIC8vIEEgbGFiZWwgb2YgdGhlIGFjdGlvbiB0aGF0IHdpbGwgYmUgcHJlc2VudGVkIHRvIHRoZSB1c2VyLlxyXG4gICAgICAgICAgICBsYWJlbDogJ0ZpbmRlIGtvcnJlc3BvbmRpZXJlbmRlIEtsYW1tZXInLFxyXG5cclxuICAgICAgICAgICAgLy8gQW4gb3B0aW9uYWwgYXJyYXkgb2Yga2V5YmluZGluZ3MgZm9yIHRoZSBhY3Rpb24uXHJcbiAgICAgICAgICAgIGtleWJpbmRpbmdzOiBbXHJcbiAgICAgICAgICAgICAgICBtb25hY28uS2V5TW9kLkN0cmxDbWQgfCBtb25hY28uS2V5Q29kZS5LRVlfS10sXHJcblxyXG4gICAgICAgICAgICAvLyBBIHByZWNvbmRpdGlvbiBmb3IgdGhpcyBhY3Rpb24uXHJcbiAgICAgICAgICAgIHByZWNvbmRpdGlvbjogbnVsbCxcclxuXHJcbiAgICAgICAgICAgIC8vIEEgcnVsZSB0byBldmFsdWF0ZSBvbiB0b3Agb2YgdGhlIHByZWNvbmRpdGlvbiBpbiBvcmRlciB0byBkaXNwYXRjaCB0aGUga2V5YmluZGluZ3MuXHJcbiAgICAgICAgICAgIGtleWJpbmRpbmdDb250ZXh0OiBudWxsLFxyXG5cclxuICAgICAgICAgICAgY29udGV4dE1lbnVHcm91cElkOiAnbmF2aWdhdGlvbicsXHJcblxyXG4gICAgICAgICAgICBjb250ZXh0TWVudU9yZGVyOiAxLjUsXHJcblxyXG4gICAgICAgICAgICAvLyBNZXRob2QgdGhhdCB3aWxsIGJlIGV4ZWN1dGVkIHdoZW4gdGhlIGFjdGlvbiBpcyB0cmlnZ2VyZWQuXHJcbiAgICAgICAgICAgIC8vIEBwYXJhbSBlZGl0b3IgVGhlIGVkaXRvciBpbnN0YW5jZSBpcyBwYXNzZWQgaW4gYXMgYSBjb252aW5pZW5jZVxyXG4gICAgICAgICAgICBydW46IGZ1bmN0aW9uIChlZCkge1xyXG4gICAgICAgICAgICAgICAgZWQuZ2V0QWN0aW9uKCdlZGl0b3IuYWN0aW9uLmp1bXBUb0JyYWNrZXQnKS5ydW4oKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vY29uc29sZS5sb2codGhpcy5lZGl0b3IuZ2V0U3VwcG9ydGVkQWN0aW9ucygpKTtcclxuICAgIH1cclxuXHJcbiAgICBvbkV2YWx1YXRlU2VsZWN0ZWRUZXh0KGV2ZW50OiBtb25hY28uZWRpdG9yLklDdXJzb3JQb3NpdGlvbkNoYW5nZWRFdmVudCkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmICh0aGF0LmN3ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhhdC5lZGl0b3IucmVtb3ZlQ29udGVudFdpZGdldCh0aGF0LmN3KTtcclxuICAgICAgICAgICAgdGhhdC5jdyA9IG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhhdC5tYWluLmdldEludGVycHJldGVyKCkuc3RhdGUgPT0gSW50ZXJwcmV0ZXJTdGF0ZS5wYXVzZWQpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBtb2RlbCA9IHRoYXQuZWRpdG9yLmdldE1vZGVsKCk7XHJcbiAgICAgICAgICAgIGxldCB0ZXh0ID0gbW9kZWwuZ2V0VmFsdWVJblJhbmdlKHRoYXQuZWRpdG9yLmdldFNlbGVjdGlvbigpKTtcclxuICAgICAgICAgICAgaWYgKHRleHQgIT0gbnVsbCAmJiB0ZXh0Lmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGxldCBldmFsdWF0b3IgPSB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLmV2YWx1YXRvcjtcclxuICAgICAgICAgICAgICAgIGxldCByZXN1bHQgPSBldmFsdWF0b3IuZXZhbHVhdGUodGV4dCk7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzdWx0LmVycm9yID09IG51bGwgJiYgcmVzdWx0LnZhbHVlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdiA9IHJlc3VsdC52YWx1ZS50eXBlLmRlYnVnT3V0cHV0KHJlc3VsdC52YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1vbmFjby5lZGl0b3IuY29sb3JpemUodGV4dCArIFwiOiBcIiwgJ215SmF2YScsIHsgdGFiU2l6ZTogMyB9KS50aGVuKCh0ZXh0KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXh0LmVuZHNXaXRoKFwiPGJyLz5cIikpIHRleHQgPSB0ZXh0LnN1YnN0cigwLCB0ZXh0Lmxlbmd0aCAtIDUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmN3ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0SWQ6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJ215LmNvbnRlbnQud2lkZ2V0JztcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBnZXREb21Ob2RlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGRuID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fZWRpdG9yVG9vbHRpcCBqb19jb2RlRm9udFwiPicgKyB0ZXh0ICsgdiArICc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZG5bMF07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2V0UG9zaXRpb246IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogZXZlbnQucG9zaXRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZWZlcmVuY2U6IFttb25hY28uZWRpdG9yLkNvbnRlbnRXaWRnZXRQb3NpdGlvblByZWZlcmVuY2UuQUJPVkUsIG1vbmFjby5lZGl0b3IuQ29udGVudFdpZGdldFBvc2l0aW9uUHJlZmVyZW5jZS5CRUxPV11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmVkaXRvci5hZGRDb250ZW50V2lkZ2V0KHRoYXQuY3cpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9uTWFyZ2luTW91c2VEb3duKGxpbmVOdW1iZXI6IG51bWJlcikge1xyXG4gICAgICAgIGxldCBtb2R1bGUgPSB0aGlzLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpO1xyXG4gICAgICAgIGlmIChtb2R1bGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtb2R1bGUudG9nZ2xlQnJlYWtwb2ludChsaW5lTnVtYmVyLCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFpbi5nZXRJbnRlcnByZXRlcigpLm1vZHVsZVN0b3JlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IHJ1bm5pbmdNb2R1bGUgPSB0aGlzLm1haW4uZ2V0SW50ZXJwcmV0ZXIoKS5tb2R1bGVTdG9yZS5maW5kTW9kdWxlQnlGaWxlKG1vZHVsZS5maWxlKTtcclxuICAgICAgICAgICAgaWYgKHJ1bm5pbmdNb2R1bGUgIT0gbnVsbCkgcnVubmluZ01vZHVsZS50b2dnbGVCcmVha3BvaW50KGxpbmVOdW1iZXIsIGZhbHNlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGVsZW1lbnREZWNvcmF0aW9uOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgb25EaWRDaGFuZ2VDdXJzb3JQb3NpdGlvbihwb3NpdGlvbjogeyBsaW5lTnVtYmVyOiBudW1iZXIsIGNvbHVtbjogbnVtYmVyIH0pIHtcclxuXHJcbiAgICAgICAgaWYgKHBvc2l0aW9uID09IG51bGwpIHBvc2l0aW9uID0gdGhpcy5lZGl0b3IuZ2V0UG9zaXRpb24oKTtcclxuXHJcbiAgICAgICAgbGV0IG1vZHVsZSA9IHRoaXMuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICAgICAgaWYgKG1vZHVsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZWxlbWVudERlY29yYXRpb24gPSB0aGlzLmVkaXRvci5kZWx0YURlY29yYXRpb25zKHRoaXMuZWxlbWVudERlY29yYXRpb24sIFtdKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBtb2R1bGUuZ2V0RWxlbWVudEF0UG9zaXRpb24ocG9zaXRpb24ubGluZU51bWJlciwgcG9zaXRpb24uY29sdW1uKTtcclxuXHJcbiAgICAgICAgbGV0IGRlY29yYXRpb25zOiBtb25hY28uZWRpdG9yLklNb2RlbERlbHRhRGVjb3JhdGlvbltdID0gW107XHJcblxyXG4gICAgICAgIGlmIChlbGVtZW50ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgbGV0IHVzYWdlUG9zaXRpb25zID0gZWxlbWVudC51c2FnZVBvc2l0aW9ucztcclxuICAgICAgICAgICAgbGV0IHVwSW5DdXJyZW50TW9kdWxlID0gdXNhZ2VQb3NpdGlvbnMuZ2V0KG1vZHVsZSk7XHJcbiAgICAgICAgICAgIGlmICh1cEluQ3VycmVudE1vZHVsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB1cCBvZiB1cEluQ3VycmVudE1vZHVsZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogeyBzdGFydENvbHVtbjogdXAuY29sdW1uLCBzdGFydExpbmVOdW1iZXI6IHVwLmxpbmUsIGVuZENvbHVtbjogdXAuY29sdW1uICsgdXAubGVuZ3RoLCBlbmRMaW5lTnVtYmVyOiB1cC5saW5lIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZTogJ2pvX3JldmVhbFN5bnRheEVsZW1lbnQnLCBpc1dob2xlTGluZTogZmFsc2UsIG92ZXJ2aWV3UnVsZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogeyBpZDogXCJlZGl0b3JJbmRlbnRHdWlkZS5iYWNrZ3JvdW5kXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXJrQ29sb3I6IHsgaWQ6IFwiZWRpdG9ySW5kZW50R3VpZGUuYWN0aXZlQmFja2dyb3VuZFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zaXRpb246IG1vbmFjby5lZGl0b3IuT3ZlcnZpZXdSdWxlckxhbmUuTGVmdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaGlnaGxpZ2h0Q3VycmVudE1ldGhvZCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IG1ldGhvZCA9IG1vZHVsZS5nZXRNZXRob2REZWNsYXJhdGlvbkF0UG9zaXRpb24ocG9zaXRpb24pO1xyXG4gICAgICAgICAgICBpZiAobWV0aG9kICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGRlY29yYXRpb25zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7IHN0YXJ0Q29sdW1uOiAwLCBzdGFydExpbmVOdW1iZXI6IG1ldGhvZC5wb3NpdGlvbi5saW5lLCBlbmRDb2x1bW46IDEwMCwgZW5kTGluZU51bWJlcjogbWV0aG9kLnNjb3BlVG8ubGluZSB9LFxyXG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnam9faGlnaGxpZ2h0TWV0aG9kJywgaXNXaG9sZUxpbmU6IHRydWUsIG92ZXJ2aWV3UnVsZXI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiB7IGlkOiBcImpvX2hpZ2hsaWdodE1ldGhvZFwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXJrQ29sb3I6IHsgaWQ6IFwiam9faGlnaGxpZ2h0TWV0aG9kXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBvc2l0aW9uOiBtb25hY28uZWRpdG9yLk92ZXJ2aWV3UnVsZXJMYW5lLkxlZnRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWluaW1hcDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IHsgaWQ6ICdqb19oaWdobGlnaHRNZXRob2QnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbW9uYWNvLmVkaXRvci5NaW5pbWFwUG9zaXRpb24uSW5saW5lXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHpJbmRleDogLTEwMFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmVsZW1lbnREZWNvcmF0aW9uID0gdGhpcy5lZGl0b3IuZGVsdGFEZWNvcmF0aW9ucyh0aGlzLmVsZW1lbnREZWNvcmF0aW9uLCBkZWNvcmF0aW9ucyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpOiBNb2R1bGUge1xyXG4gICAgICAgIHJldHVybiB0aGlzLm1haW4uZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZG9udERldGVjdExhc3RDaGFuZ2UoKSB7XHJcbiAgICAgICAgLy8gdGhpcy5kb250RGV0ZWN0TGFzdENoYW5naW5nID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBwcm92aWRlUmVuYW1lRWRpdHMobW9kZWw6IG1vbmFjby5lZGl0b3IuSVRleHRNb2RlbCwgcG9zaXRpb246IG1vbmFjby5Qb3NpdGlvbixcclxuICAgICAgICBuZXdOYW1lOiBzdHJpbmcsIHRva2VuOiBtb25hY28uQ2FuY2VsbGF0aW9uVG9rZW4pOlxyXG4gICAgICAgIG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5Xb3Jrc3BhY2VFZGl0ICYgbW9uYWNvLmxhbmd1YWdlcy5SZWplY3Rpb24+IHtcclxuXHJcbiAgICAgICAgbGV0IGN1cnJlbnRseUVkaXRlZE1vZHVsZSA9IHRoaXMuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRseUVkaXRlZE1vZHVsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBjdXJyZW50bHlFZGl0ZWRNb2R1bGUuZ2V0RWxlbWVudEF0UG9zaXRpb24ocG9zaXRpb24ubGluZU51bWJlciwgcG9zaXRpb24uY29sdW1uKTtcclxuICAgICAgICBpZiAoZWxlbWVudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB1c2FnZVBvc2l0aW9ucyA9IGVsZW1lbnQudXNhZ2VQb3NpdGlvbnM7XHJcblxyXG4gICAgICAgIC8vMDYuMDYuMjAyMFxyXG4gICAgICAgIGxldCByZXNvdXJjZUVkaXRzOiBtb25hY28ubGFuZ3VhZ2VzLldvcmtzcGFjZVRleHRFZGl0W10gPSBbXTtcclxuXHJcbiAgICAgICAgdXNhZ2VQb3NpdGlvbnMuZm9yRWFjaCgodXNhZ2VQb3NpdGlvbnNJbk1vZHVsZSwgbW9kdWxlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh1c2FnZVBvc2l0aW9uc0luTW9kdWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGxldCBlZGl0czogbW9uYWNvLmxhbmd1YWdlcy5UZXh0RWRpdFtdID0gW107XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB1cCBvZiB1c2FnZVBvc2l0aW9uc0luTW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzb3VyY2VFZGl0cy5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZTogbW9kdWxlLnVyaSwgZWRpdDpcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogeyBzdGFydENvbHVtbjogdXAuY29sdW1uLCBzdGFydExpbmVOdW1iZXI6IHVwLmxpbmUsIGVuZExpbmVOdW1iZXI6IHVwLmxpbmUsIGVuZENvbHVtbjogdXAuY29sdW1uICsgdXAubGVuZ3RoIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogbmV3TmFtZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChlZGl0cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUuZGlydHkgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZS5maWxlLnNhdmVkID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUuaWRlbnRpY2FsX3RvX3JlcG9zaXRvcnlfdmVyc2lvbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZWRpdHM6IHJlc291cmNlRWRpdHNcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByb3ZpZGVEZWZpbml0aW9uKG1vZGVsOiBtb25hY28uZWRpdG9yLklUZXh0TW9kZWwsIHBvc2l0aW9uOiBtb25hY28uUG9zaXRpb24sIGNhbmNlbGxhdGlvblRva2VuOiBtb25hY28uQ2FuY2VsbGF0aW9uVG9rZW4pOlxyXG4gICAgICAgIG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5EZWZpbml0aW9uPiB7XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGU6IE1vZHVsZSA9IHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkuZ2V0TW9kdWxlQnlNb25hY29Nb2RlbChtb2RlbCk7XHJcblxyXG4gICAgICAgIGlmIChtb2R1bGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBlbGVtZW50ID0gbW9kdWxlLmdldEVsZW1lbnRBdFBvc2l0aW9uKHBvc2l0aW9uLmxpbmVOdW1iZXIsIHBvc2l0aW9uLmNvbHVtbik7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCBkZWNsID0gZWxlbWVudC5kZWNsYXJhdGlvbjtcclxuXHJcbiAgICAgICAgaWYgKGRlY2wgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBjbGFzcyBmcm9tIEJhc2UtTW9kdWxlPyBMZXQgZGVmaW5pdGlvbiBwb2ludCB0byBjdXJyZW50IHBvc2l0aW9uLCBzbyB0aGF0IGN0cmwgKyBjbGljayBvcGVucyBwZWVrIHJlZmVyZW5jZXMgd2lkZ2V0XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50IGluc3RhbmNlb2YgS2xhc3MgfHwgZWxlbWVudCBpbnN0YW5jZW9mIEVudW0gfHwgZWxlbWVudCBpbnN0YW5jZW9mIEludGVyZmFjZSB8fCBlbGVtZW50IGluc3RhbmNlb2YgTWV0aG9kIHx8IGVsZW1lbnQgaW5zdGFuY2VvZiBBdHRyaWJ1dGUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlciwgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbiwgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gKyBlbGVtZW50LmlkZW50aWZpZXIubGVuZ3RoXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB1cmk6IG1vZHVsZS51cmlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICByYW5nZToge1xyXG4gICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBkZWNsLnBvc2l0aW9uLmxpbmUsIGVuZExpbmVOdW1iZXI6IGRlY2wucG9zaXRpb24ubGluZSxcclxuICAgICAgICAgICAgICAgIHN0YXJ0Q29sdW1uOiBkZWNsLnBvc2l0aW9uLmNvbHVtbiwgZW5kQ29sdW1uOiBkZWNsLnBvc2l0aW9uLmNvbHVtbiArIGRlY2wucG9zaXRpb24ubGVuZ3RoXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHVyaTogZGVjbC5tb2R1bGUudXJpXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxufSJdfQ==