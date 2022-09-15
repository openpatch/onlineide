import { Compiler, CompilerStatus } from "../compiler/Compiler.js";
import { Module } from "../compiler/parser/Module.js";
import { Debugger } from "../interpreter/Debugger.js";
import { Interpreter, InterpreterState } from "../interpreter/Interpreter.js";
import { ActionManager } from "../main/gui/ActionManager.js";
import { BottomDiv } from "../main/gui/BottomDiv.js";
import { Editor } from "../main/gui/Editor.js";
import { ProgramControlButtons } from "../main/gui/ProgramControlButtons.js";
import { RightDiv } from "../main/gui/RightDiv.js";
import { Workspace } from "../workspace/Workspace.js";
import { makeTabs, openContextMenu } from "../tools/HtmlTools.js";
import { EmbeddedSlider } from "./EmbeddedSlider.js";
import { EmbeddedFileExplorer } from "./EmbeddedFileExplorer.js";
import { EmbeddedIndexedDB } from "./EmbeddedIndexedDB.js";
import { SemicolonAngel } from "../compiler/parser/SemicolonAngel.js";
export class MainEmbedded {
    constructor($div, scriptList) {
        this.scriptList = scriptList;
        this.programPointerDecoration = [];
        this.programIsExecutable = false;
        this.version = 0;
        this.compileRunsAfterCodeReset = 0;
        this.readConfig($div);
        this.initGUI($div);
        this.initScripts();
        this.indexedDB = new EmbeddedIndexedDB();
        this.indexedDB.open(() => {
            if (this.config.id != null) {
                this.readScripts();
            }
        });
        this.semicolonAngel = new SemicolonAngel(this);
    }
    isEmbedded() { return true; }
    jumpToDeclaration(module, declaration) { }
    ;
    getCompiler() {
        return this.compiler;
    }
    getInterpreter() {
        return this.interpreter;
    }
    getCurrentWorkspace() {
        return this.currentWorkspace;
    }
    getDebugger() {
        return this.debugger;
    }
    getMonacoEditor() {
        return this.editor.editor;
    }
    getRightDiv() {
        return this.rightDiv;
    }
    getBottomDiv() {
        return this.bottomDiv;
    }
    getActionManager() {
        return this.actionManager;
    }
    getCurrentlyEditedModule() {
        var _a;
        if (this.config.withFileList) {
            return (_a = this.fileExplorer.currentFile) === null || _a === void 0 ? void 0 : _a.module;
        }
        else {
            return this.currentWorkspace.moduleStore.getFirstModule();
        }
    }
    initScripts() {
        var _a;
        (_a = this.fileExplorer) === null || _a === void 0 ? void 0 : _a.removeAllFiles();
        this.initWorkspace(this.scriptList);
        if (this.config.withFileList) {
            this.fileExplorer = new EmbeddedFileExplorer(this.currentWorkspace.moduleStore, this.$filesListDiv, this);
            this.fileExplorer.setFirstFileActive();
            this.scriptList.filter((script) => script.type == "hint").forEach((script) => this.fileExplorer.addHint(script));
        }
        else {
            this.setModuleActive(this.currentWorkspace.moduleStore.getFirstModule());
        }
    }
    readConfig($div) {
        let configJson = $div.data("java-online");
        if (configJson != null && typeof configJson == "string") {
            this.config = JSON.parse(configJson.split("'").join('"'));
        }
        else {
            this.config = {};
        }
        if (this.config.withFileList == null)
            this.config.withFileList = true;
        if (this.config.withPCode == null)
            this.config.withPCode = true;
        if (this.config.withConsole == null)
            this.config.withConsole = true;
        if (this.config.withErrorList == null)
            this.config.withErrorList = true;
        if (this.config.withBottomPanel == null)
            this.config.withBottomPanel = true;
        if (!(this.config.withConsole || this.config.withPCode || this.config.withFileList || this.config.withErrorList)) {
            this.config.withBottomPanel = false;
        }
        if (!this.config.withBottomPanel) {
            this.config.withFileList = false;
            this.config.withPCode = false;
            this.config.withConsole = false;
            this.config.withErrorList = false;
        }
        if (this.config.speed == null)
            this.config.speed = 9;
    }
    setModuleActive(module) {
        if (this.config.withFileList && this.fileExplorer.currentFile != null) {
            this.fileExplorer.currentFile.module.editorState = this.getMonacoEditor().saveViewState();
        }
        if (this.config.withFileList) {
            this.fileExplorer.markFile(module);
        }
        /**
         * WICHTIG: Die Reihenfolge der beiden Operationen ist extrem wichtig.
         * Falls das Model im readonly-Zustand gesetzt wird, funktioniert <Strg + .>
         * nicht und die Lightbulbs werden nicht angezeigt, selbst dann, wenn
         * später readonly = false gesetzt wird.
         */
        this.getMonacoEditor().updateOptions({
            readOnly: false,
            lineNumbersMinChars: 4
        });
        this.editor.editor.setModel(module.model);
        if (module.editorState != null) {
            this.getMonacoEditor().restoreViewState(module.editorState);
        }
        module.renderBreakpointDecorators();
    }
    readScripts() {
        let modules = this.currentWorkspace.moduleStore.getModules(false);
        let that = this;
        this.indexedDB.getScript(this.config.id, (scriptListJSon) => {
            var _a;
            if (scriptListJSon == null) {
                setInterval(() => {
                    that.saveScripts();
                }, 1000);
            }
            else {
                let scriptList = JSON.parse(scriptListJSon);
                let countDown = scriptList.length;
                for (let module of modules) {
                    (_a = that.fileExplorer) === null || _a === void 0 ? void 0 : _a.removeModule(module);
                    that.removeModule(module);
                }
                for (let name of scriptList) {
                    let scriptId = this.config.id + name;
                    this.indexedDB.getScript(scriptId, (script) => {
                        var _a, _b;
                        if (script != null) {
                            let module = that.addModule({
                                title: name,
                                text: script,
                                type: "java"
                            });
                            (_a = that.fileExplorer) === null || _a === void 0 ? void 0 : _a.addModule(module);
                            that.$resetButton.fadeIn(1000);
                            // console.log("Retrieving script " + scriptId);
                        }
                        countDown--;
                        if (countDown == 0) {
                            setInterval(() => {
                                that.saveScripts();
                            }, 1000);
                            (_b = that.fileExplorer) === null || _b === void 0 ? void 0 : _b.setFirstFileActive();
                            if (that.fileExplorer == null) {
                                let modules = that.currentWorkspace.moduleStore.getModules(false);
                                if (modules.length > 0)
                                    that.setModuleActive(modules[0]);
                            }
                        }
                    });
                }
            }
        });
    }
    saveScripts() {
        let modules = this.currentWorkspace.moduleStore.getModules(false);
        let scriptList = [];
        let oneNotSaved = false;
        modules.forEach(m => oneNotSaved = oneNotSaved || !m.file.saved);
        if (oneNotSaved) {
            for (let module of modules) {
                scriptList.push(module.file.name);
                let scriptId = this.config.id + module.file.name;
                this.indexedDB.writeScript(scriptId, module.getProgramTextFromMonacoModel());
                module.file.saved = true;
                // console.log("Saving script " + scriptId);
            }
            this.indexedDB.writeScript(this.config.id, JSON.stringify(scriptList));
        }
    }
    deleteScriptsInDB() {
        this.indexedDB.getScript(this.config.id, (scriptListJSon) => {
            if (scriptListJSon == null) {
                return;
            }
            else {
                let scriptList = JSON.parse(scriptListJSon);
                for (let name of scriptList) {
                    let scriptId = this.config.id + name;
                    this.indexedDB.removeScript(scriptId);
                }
                this.indexedDB.removeScript(this.config.id);
            }
        });
    }
    initWorkspace(scriptList) {
        this.currentWorkspace = new Workspace("Embedded-Workspace", this, 0);
        let i = 0;
        for (let script of scriptList) {
            if (script.type == "java") {
                this.addModule(script);
            }
        }
    }
    addModule(script) {
        let module = Module.restoreFromData({
            id: this.currentWorkspace.moduleStore.getModules(true).length,
            name: script.title,
            text: script.text,
            text_before_revision: null,
            submitted_date: null,
            student_edited_after_revision: false,
            version: 1,
            workspace_id: 0,
            forceUpdate: false,
            identical_to_repository_version: false,
            file_type: 0
        }, this);
        this.currentWorkspace.moduleStore.putModule(module);
        let that = this;
        module.model.onDidChangeContent(() => {
            that.considerShowingCodeResetButton();
        });
        return module;
    }
    removeModule(module) {
        this.currentWorkspace.moduleStore.removeModule(module);
    }
    initGUI($div) {
        // let $leftDiv = jQuery('<div class="joe_leftDiv"></div>');
        $div.css({
            "background-image": "none",
            "background-size": "100%"
        });
        let $centerDiv = jQuery('<div class="joe_centerDiv"></div>');
        let $resetModalWindow = this.makeCodeResetModalWindow($div);
        let $rightDiv = this.makeRightDiv();
        let $editorDiv = jQuery('<div class="joe_editorDiv"></div>');
        this.$monacoDiv = jQuery('<div class="joe_monacoDiv"></div>');
        this.$hintDiv = jQuery('<div class="joe_hintDiv jo_scrollable"></div>');
        this.$resetButton = jQuery('<div class="joe_resetButton jo_button jo_active" title="Code auf Ausgangszustand zurücksetzen">Code Reset</div>');
        $editorDiv.append(this.$monacoDiv, this.$hintDiv, this.$resetButton);
        let $bracketErrorDiv = this.makeBracketErrorDiv();
        $editorDiv.append($bracketErrorDiv);
        this.$resetButton.hide();
        this.$resetButton.on("click", () => { $resetModalWindow.show(); });
        this.$hintDiv.hide();
        let $controlsDiv = jQuery('<div class="joe_controlsDiv"></div>');
        let $bottomDivInner = jQuery('<div class="joe_bottomDivInner"></div>');
        if (this.config.withBottomPanel) {
            let $bottomDiv = jQuery('<div class="joe_bottomDiv"></div>');
            this.makeBottomDiv($bottomDivInner, $controlsDiv);
            $bottomDiv.append($bottomDivInner);
            if (this.config.withFileList) {
                let $filesDiv = this.makeFilesDiv();
                $bottomDiv.prepend($filesDiv);
                new EmbeddedSlider($filesDiv, false, false, () => { });
            }
            makeTabs($bottomDivInner);
            $centerDiv.append($editorDiv, $bottomDiv);
            new EmbeddedSlider($bottomDiv, true, true, () => { this.editor.editor.layout(); });
        }
        else {
            $centerDiv.prepend($editorDiv);
        }
        if (!this.config.withBottomPanel) {
            $centerDiv.prepend($controlsDiv);
            $controlsDiv.addClass('joe_controlPanel_top');
            $editorDiv.css({
                'position': 'relative',
                'height': '1px'
            });
        }
        $div.addClass('joe_javaOnlineDiv');
        $div.append($centerDiv, $rightDiv);
        new EmbeddedSlider($rightDiv, true, false, () => {
            jQuery('.jo_graphics').trigger('sizeChanged');
            this.editor.editor.layout();
        });
        this.editor = new Editor(this, false, true);
        this.editor.initGUI(this.$monacoDiv);
        this.$monacoDiv.find('.monaco-editor').css('z-index', '10');
        if ($div.attr('tabindex') == null)
            $div.attr('tabindex', "0");
        this.actionManager = new ActionManager($div, this);
        this.actionManager.init();
        this.bottomDiv = new BottomDiv(this, $bottomDivInner, $div);
        this.bottomDiv.initGUI();
        this.rightDiv = new RightDiv(this, this.$rightDivInner);
        this.rightDiv.initGUI();
        let $rightSideContainer = jQuery('<div class="jo_rightdiv-rightside-container">');
        let $coordinates = jQuery('<div class="jo_coordinates">(0/0)</div>');
        this.$rightDivInner.append($rightSideContainer);
        $rightSideContainer.append($coordinates);
        this.debugger = new Debugger(this, this.$debuggerDiv, null);
        this.interpreter = new Interpreter(this, this.debugger, new ProgramControlButtons($controlsDiv, $editorDiv), this.$runDiv);
        let $infoButton = jQuery('<div class="jo_button jo_active img_ellipsis-dark" style="margin-left: 16px"></div>');
        $controlsDiv.append($infoButton);
        $infoButton.on('mousedown', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            openContextMenu([{
                    caption: "Über die Online-IDE ...",
                    link: "https://www.online-ide.de",
                    callback: () => {
                        // nothing to do.
                    }
                }], ev.pageX + 2, ev.pageY + 2);
        });
        setTimeout(() => {
            this.interpreter.initGUI();
            this.editor.editor.layout();
            this.compiler = new Compiler(this);
            this.interpreter.controlButtons.speedControl.setSpeedInStepsPerSecond(this.config.speed);
            this.startTimer();
        }, 200);
    }
    makeBracketErrorDiv() {
        return jQuery(`
        <div class="jo_parenthesis_warning" title="Klammerwarnung!" style="bottom: 55px">
        <div class="jo_warning_light"></div>
        <div class="jo_pw_heading">{ }</div>
        <div title="Letzten Schritt rückgängig" 
            class="jo_pw_undo img_undo jo_button jo_active"></div>
        </div>
        `);
    }
    makeCodeResetModalWindow($parent) {
        let $window = jQuery(`
            <div class="joe_codeResetModal">
            <div style="flex: 1"></div>
            <div style="display: flex">
                <div style="flex: 1"></div>
                <div style="padding-left: 30px;">
                <div style="color: red; margin-bottom: 10px; font-weight: bold">Warnung:</div>
                <div>Soll der Code wirklich auf den Ausgangszustand zurückgesetzt werden?</div>
                <div>Alle von Dir gemachten Änderungen werden damit verworfen.</div>
                </div>
                <div style="flex: 1"></div>
            </div>
            <div class="joe_codeResetModalButtons">
            <div class="joe_codeResetModalCancel jo_button jo_active">Abbrechen</div>
            <div class="joe_codeResetModalOK jo_button jo_active">OK</div>
            </div>
            <div style="flex: 2"></div>
            </div>
        `);
        $window.hide();
        $parent.append($window);
        jQuery(".joe_codeResetModalCancel").on("click", () => {
            $window.hide();
        });
        jQuery(".joe_codeResetModalOK").on("click", () => {
            this.initScripts();
            this.deleteScriptsInDB();
            $window.hide();
            this.$resetButton.hide();
            this.compileRunsAfterCodeReset = 1;
        });
        return $window;
    }
    showProgramPointerPosition(file, position) {
        if (file == null) {
            return;
        }
        if (this.config.withFileList) {
            let fileData = this.fileExplorer.files.find((fileData) => fileData.module.file == file);
            if (fileData == null) {
                return;
            }
            if (fileData.module != this.getCurrentlyEditedModule()) {
                this.setModuleActive(fileData.module);
            }
            this.programPointerModule = fileData.module;
        }
        else {
            this.programPointerModule = this.currentWorkspace.moduleStore.getFirstModule();
        }
        let range = {
            startColumn: position.column, startLineNumber: position.line,
            endColumn: position.column + position.length, endLineNumber: position.line
        };
        this.getMonacoEditor().revealRangeInCenterIfOutsideViewport(range);
        this.programPointerDecoration = this.getMonacoEditor().deltaDecorations(this.programPointerDecoration, [
            {
                range: range,
                options: { className: 'jo_revealProgramPointer', isWholeLine: true }
            },
            {
                range: range,
                options: { beforeContentClassName: 'jo_revealProgramPointerBefore' }
            }
        ]);
    }
    hideProgramPointerPosition() {
        if (this.getCurrentlyEditedModule() == this.programPointerModule) {
            this.getMonacoEditor().deltaDecorations(this.programPointerDecoration, []);
        }
        this.programPointerModule = null;
        this.programPointerDecoration = [];
    }
    makeFilesDiv() {
        let $filesDiv = jQuery('<div class="joe_bottomDivFiles jo_scrollable"></div>');
        let $filesHeader = jQuery('<div class="joe_filesHeader jo_tabheading jo_active"  style="line-height: 24px">Programmdateien</div>');
        this.$filesListDiv = jQuery('<div class="joe_filesList jo_scrollable"></div>');
        // for (let index = 0; index < 20; index++) {            
        //     let $file = jQuery('<div class="jo_file jo_java"><div class="jo_fileimage"></div><div class="jo_filename"></div></div></div>');
        //     $filesList.append($file);
        // }
        $filesDiv.append($filesHeader, this.$filesListDiv);
        return $filesDiv;
    }
    startTimer() {
        if (this.timerHandle != null) {
            clearInterval(this.timerHandle);
        }
        let that = this;
        this.timerHandle = setInterval(() => {
            that.compileIfDirty();
        }, 500);
    }
    compileIfDirty() {
        var _a, _b;
        if (this.currentWorkspace == null)
            return;
        if (this.currentWorkspace.moduleStore.isDirty() &&
            this.compiler.compilerStatus != CompilerStatus.compiling
            && this.interpreter.state != InterpreterState.running
            && this.interpreter.state != InterpreterState.paused) {
            try {
                this.compiler.compile(this.currentWorkspace.moduleStore);
                let errors = (_b = (_a = this.
                    bottomDiv) === null || _a === void 0 ? void 0 : _a.errorManager) === null || _b === void 0 ? void 0 : _b.showErrors(this.currentWorkspace);
                this.editor.onDidChangeCursorPosition(null); // mark occurrencies of symbol under cursor
                this.printProgram();
                this.version++;
                let startable = this.interpreter.getStartableModule(this.currentWorkspace.moduleStore) != null;
                if (startable &&
                    this.interpreter.state == InterpreterState.not_initialized) {
                    this.copyExecutableModuleStoreToInterpreter();
                    this.interpreter.setState(InterpreterState.done);
                    // this.interpreter.init();
                }
                if (!startable &&
                    (this.interpreter.state == InterpreterState.done || this.interpreter.state == InterpreterState.error)) {
                    this.interpreter.setState(InterpreterState.not_initialized);
                }
                // this.drawClassDiagrams(!this.rightDiv.isClassDiagramEnabled());
            }
            catch (e) {
                console.error(e);
                this.compiler.compilerStatus = CompilerStatus.error;
            }
        }
    }
    considerShowingCodeResetButton() {
        this.compileRunsAfterCodeReset++;
        if (this.compileRunsAfterCodeReset == 3) {
            this.$resetButton.fadeIn(1000);
        }
    }
    printProgram() {
        this.bottomDiv.printModuleToBottomDiv(this.currentWorkspace, this.getCurrentlyEditedModule());
    }
    drawClassDiagrams(onlyUpdateIdentifiers) {
        // clearTimeout(this.debounceDiagramDrawing);
        // this.debounceDiagramDrawing = setTimeout(() => {
        //     this.rightDiv?.classDiagram?.drawDiagram(this.currentWorkspace, onlyUpdateIdentifiers);
        // }, 500);
    }
    copyExecutableModuleStoreToInterpreter() {
        let ms = this.currentWorkspace.moduleStore.copy();
        this.interpreter.moduleStore = ms;
        this.interpreter.moduleStoreVersion = this.version;
        if (this.interpreter.state == InterpreterState.not_initialized && this.programIsExecutable) {
            this.interpreter.setState(InterpreterState.done);
        }
    }
    makeBottomDiv($bottomDiv, $buttonDiv) {
        let $tabheadings = jQuery('<div class="jo_tabheadings"></div>');
        $tabheadings.css('position', 'relative');
        let $thRightSide = jQuery('<div class="joe_tabheading-right jo_noHeading"></div>');
        if (this.config.withConsole) {
            let $thConsoleClear = jQuery('<div class="img_clear-dark jo_button jo_active jo_console-clear"' +
                'style="display: none; margin-right: 8px;" title="Console leeren"></div>');
            $thRightSide.append($thConsoleClear);
        }
        $thRightSide.append($buttonDiv);
        if (this.config.withErrorList) {
            let $thErrors = jQuery('<div class="jo_tabheading jo_active" data-target="jo_errorsTab" style="line-height: 24px">Fehler</div>');
            $tabheadings.append($thErrors);
        }
        if (this.config.withConsole) {
            let $thConsole = jQuery('<div class="jo_tabheading jo_console-tab" data-target="jo_consoleTab" style="line-height: 24px">Console</div>');
            $tabheadings.append($thConsole);
        }
        if (this.config.withPCode) {
            let $thPCode = jQuery('<div class="jo_tabheading" data-target="jo_pcodeTab" style="line-height: 24px">PCode</div>');
            $tabheadings.append($thPCode);
        }
        $tabheadings.append($thRightSide);
        $bottomDiv.append($tabheadings);
        let $tabs = jQuery('<div class="jo_tabs jo_scrollable"></div>');
        if (this.config.withErrorList) {
            let $tabError = jQuery('<div class="jo_active jo_scrollable jo_errorsTab"></div>');
            $tabs.append($tabError);
        }
        if (this.config.withConsole) {
            let $tabConsole = jQuery(`
        <div class="jo_editorFontSize jo_consoleTab">
        <div class="jo_console-inner">
            <div class="jo_scrollable jo_console-top"></div>
            <div class="jo_commandline"></div>
        </div>
        </div>
    `);
            $tabs.append($tabConsole);
        }
        if (this.config.withPCode) {
            let $tabPCode = jQuery('<div class="jo_scrollable jo_pcodeTab">PCode</div>');
            $tabs.append($tabPCode);
        }
        $bottomDiv.append($tabs);
    }
    makeRightDiv() {
        let $rightDiv = jQuery('<div class="joe_rightDiv"></div>');
        this.$rightDivInner = jQuery('<div class="joe_rightDivInner"></div>');
        $rightDiv.append(this.$rightDivInner);
        let $tabheadings = jQuery('<div class="jo_tabheadings"></div>');
        $tabheadings.css('position', 'relative');
        let $thRun = jQuery('<div class="jo_tabheading jo_active" data-target="jo_run" style="line-height: 24px">Ausgabe</div>');
        let $thVariables = jQuery('<div class="jo_tabheading jo_console-tab" data-target="jo_variablesTab" style="line-height: 24px">Variablen</div>');
        $tabheadings.append($thRun, $thVariables);
        this.$rightDivInner.append($tabheadings);
        let $tabs = jQuery('<div class="jo_tabs jo_scrollable"></div>');
        let $vd = jQuery('<div class="jo_scrollable jo_editorFontSize jo_variablesTab"></div>');
        this.$debuggerDiv = jQuery('<div class="joe_debuggerDiv"></div>');
        let $alternativeText = jQuery(`
            <div class="jo_alternativeText jo_scrollable">
            <div style="font-weight: bold">Tipp:</div>
            Die Variablen sind nur dann sichtbar, wenn das Programm
            <ul>
            <li>im Einzelschrittmodus ausgeführt wird(Klick auf <span class="img_step-over-dark jo_inline-image"></span>),</li>
            <li>an einem Breakpoint hält (Setzen eines Breakpoints mit Mausklick links neben den Zeilennummern und anschließendes Starten des Programms mit 
            <span class="img_start-dark jo_inline-image"></span>) oder </li>
            <li>in sehr niedriger Geschwindigkeit ausgeführt wird (weniger als 10 Schritte/s).
            </ul>
            </div>
        `);
        $vd.append(this.$debuggerDiv, $alternativeText);
        this.$runDiv = jQuery(`
<div class="jo_tab jo_active jo_run">
<div class="jo_run-programend">Programm beendet</div>
<div class="jo_run-input">
    <div>
        <div>
            <div class="jo_run-input-message" class="jo_rix">Bitte geben Sie eine Zahl ein!</div>
            <input class="jo_run-input-input" type="text" class="jo_rix">
            <div class="jo_run-input-button-outer" class="jo_rix">
                <div class="jo_run-input-button" class="jo_rix">OK</div>
            </div>

            <div class="jo_run-input-error" class="jo_rix"></div>
        </div>
    </div>
</div> 
<div class="jo_run-inner">
    <div class="jo_graphics"></div>
    <div class="jo_output jo_scrollable"></div>
</div>

</div>

`);
        $tabs.append(this.$runDiv, $vd);
        this.$rightDivInner.append($tabs);
        makeTabs($rightDiv);
        return $rightDiv;
    }
    getSemicolonAngel() {
        return this.semicolonAngel;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbkVtYmVkZGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9lbWJlZGRlZC9NYWluRW1iZWRkZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFFBQVEsRUFBRSxjQUFjLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUNuRSxPQUFPLEVBQUUsTUFBTSxFQUFRLE1BQU0sOEJBQThCLENBQUM7QUFDNUQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBQ3RELE9BQU8sRUFBRSxXQUFXLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUM5RSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFDN0QsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUMvQyxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQUM3RSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0seUJBQXlCLENBQUM7QUFFbkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRXRELE9BQU8sRUFBVyxRQUFRLEVBQUUsZUFBZSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFDM0UsT0FBTyxFQUFFLGNBQWMsRUFBRSxNQUFNLHFCQUFxQixDQUFDO0FBRXJELE9BQU8sRUFBRSxvQkFBb0IsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRWpFLE9BQU8sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLHdCQUF3QixDQUFDO0FBQzNELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxzQ0FBc0MsQ0FBQztBQWF0RSxNQUFNLE9BQU8sWUFBWTtJQW1GckIsWUFBWSxJQUF5QixFQUFVLFVBQXNCO1FBQXRCLGVBQVUsR0FBVixVQUFVLENBQVk7UUF2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QUMsQ0FBQztRQUNoQyxJQUFJLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVsQyxRQUFRLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFcEIsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVELGlCQUFpQjtRQUNiLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQztJQUMvQixDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb21waWxlciwgQ29tcGlsZXJTdGF0dXMgfSBmcm9tIFwiLi4vY29tcGlsZXIvQ29tcGlsZXIuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlLCBGaWxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgRGVidWdnZXIgfSBmcm9tIFwiLi4vaW50ZXJwcmV0ZXIvRGVidWdnZXIuanNcIjtcclxuaW1wb3J0IHsgSW50ZXJwcmV0ZXIsIEludGVycHJldGVyU3RhdGUgfSBmcm9tIFwiLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuaW1wb3J0IHsgQWN0aW9uTWFuYWdlciB9IGZyb20gXCIuLi9tYWluL2d1aS9BY3Rpb25NYW5hZ2VyLmpzXCI7XHJcbmltcG9ydCB7IEJvdHRvbURpdiB9IGZyb20gXCIuLi9tYWluL2d1aS9Cb3R0b21EaXYuanNcIjtcclxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcIi4uL21haW4vZ3VpL0VkaXRvci5qc1wiO1xyXG5pbXBvcnQgeyBQcm9ncmFtQ29udHJvbEJ1dHRvbnMgfSBmcm9tIFwiLi4vbWFpbi9ndWkvUHJvZ3JhbUNvbnRyb2xCdXR0b25zLmpzXCI7XHJcbmltcG9ydCB7IFJpZ2h0RGl2IH0gZnJvbSBcIi4uL21haW4vZ3VpL1JpZ2h0RGl2LmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL21haW4vTWFpbkJhc2UuanNcIjtcclxuaW1wb3J0IHsgV29ya3NwYWNlIH0gZnJvbSBcIi4uL3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgSk9TY3JpcHQgfSBmcm9tIFwiLi9FbWJlZGRlZFN0YXJ0ZXIuanNcIjtcclxuaW1wb3J0IHsgbWFrZURpdiwgbWFrZVRhYnMsIG9wZW5Db250ZXh0TWVudSB9IGZyb20gXCIuLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgRW1iZWRkZWRTbGlkZXIgfSBmcm9tIFwiLi9FbWJlZGRlZFNsaWRlci5qc1wiO1xyXG5pbXBvcnQgeyBUaWxpbmdTcHJpdGUgfSBmcm9tIFwicGl4aS5qc1wiO1xyXG5pbXBvcnQgeyBFbWJlZGRlZEZpbGVFeHBsb3JlciB9IGZyb20gXCIuL0VtYmVkZGVkRmlsZUV4cGxvcmVyLmpzXCI7XHJcbmltcG9ydCB7IFRleHRQb3NpdGlvbiB9IGZyb20gXCIuLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xyXG5pbXBvcnQgeyBFbWJlZGRlZEluZGV4ZWREQiB9IGZyb20gXCIuL0VtYmVkZGVkSW5kZXhlZERCLmpzXCI7XHJcbmltcG9ydCB7IFNlbWljb2xvbkFuZ2VsIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9TZW1pY29sb25BbmdlbC5qc1wiO1xyXG5pbXBvcnQgeyBUZXh0UG9zaXRpb25XaXRoTW9kdWxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcblxyXG50eXBlIEphdmFPbmxpbmVDb25maWcgPSB7XHJcbiAgICB3aXRoRmlsZUxpc3Q/OiBib29sZWFuLFxyXG4gICAgd2l0aFBDb2RlPzogYm9vbGVhbixcclxuICAgIHdpdGhDb25zb2xlPzogYm9vbGVhbixcclxuICAgIHdpdGhFcnJvckxpc3Q/OiBib29sZWFuLFxyXG4gICAgd2l0aEJvdHRvbVBhbmVsPzogYm9vbGVhbixcclxuICAgIHNwZWVkPzogbnVtYmVyIHwgXCJtYXhcIixcclxuICAgIGlkPzogc3RyaW5nXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNYWluRW1iZWRkZWQgaW1wbGVtZW50cyBNYWluQmFzZSB7XHJcbiAgICBpc0VtYmVkZGVkKCk6IGJvb2xlYW4geyByZXR1cm4gdHJ1ZTsgfVxyXG5cclxuICAgIGp1bXBUb0RlY2xhcmF0aW9uKG1vZHVsZTogTW9kdWxlLCBkZWNsYXJhdGlvbjogVGV4dFBvc2l0aW9uV2l0aE1vZHVsZSl7fTtcclxuXHJcbiAgICBnZXRDb21waWxlcigpOiBDb21waWxlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXI7XHJcbiAgICB9XHJcbiAgICBnZXRJbnRlcnByZXRlcigpOiBJbnRlcnByZXRlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuaW50ZXJwcmV0ZXI7XHJcbiAgICB9XHJcbiAgICBnZXRDdXJyZW50V29ya3NwYWNlKCk6IFdvcmtzcGFjZSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuY3VycmVudFdvcmtzcGFjZTtcclxuICAgIH1cclxuICAgIGdldERlYnVnZ2VyKCk6IERlYnVnZ2VyIHtcclxuICAgICAgICByZXR1cm4gdGhpcy5kZWJ1Z2dlcjtcclxuICAgIH1cclxuICAgIGdldE1vbmFjb0VkaXRvcigpOiBtb25hY28uZWRpdG9yLklTdGFuZGFsb25lQ29kZUVkaXRvciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuZWRpdG9yLmVkaXRvcjtcclxuICAgIH1cclxuXHJcbiAgICBnZXRSaWdodERpdigpOiBSaWdodERpdiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMucmlnaHREaXY7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Qm90dG9tRGl2KCk6IEJvdHRvbURpdiB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYm90dG9tRGl2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFjdGlvbk1hbmFnZXIoKTogQWN0aW9uTWFuYWdlciB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMuYWN0aW9uTWFuYWdlcjtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKTogTW9kdWxlIHtcclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aEZpbGVMaXN0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpbGVFeHBsb3Jlci5jdXJyZW50RmlsZT8ubW9kdWxlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUuZ2V0Rmlyc3RNb2R1bGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uZmlnOiBKYXZhT25saW5lQ29uZmlnO1xyXG5cclxuICAgIGVkaXRvcjogRWRpdG9yO1xyXG4gICAgcHJvZ3JhbVBvaW50ZXJEZWNvcmF0aW9uOiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgcHJvZ3JhbVBvaW50ZXJNb2R1bGU6IE1vZHVsZTtcclxuXHJcbiAgICBjdXJyZW50V29ya3NwYWNlOiBXb3Jrc3BhY2U7XHJcbiAgICBhY3Rpb25NYW5hZ2VyOiBBY3Rpb25NYW5hZ2VyO1xyXG5cclxuICAgIGNvbXBpbGVyOiBDb21waWxlcjtcclxuXHJcbiAgICBpbnRlcnByZXRlcjogSW50ZXJwcmV0ZXI7XHJcbiAgICAkcnVuRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIGRlYnVnZ2VyOiBEZWJ1Z2dlcjtcclxuICAgICRkZWJ1Z2dlckRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICBib3R0b21EaXY6IEJvdHRvbURpdjtcclxuICAgICRmaWxlc0xpc3REaXY6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgJGhpbnREaXY6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkbW9uYWNvRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJHJlc2V0QnV0dG9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIHByb2dyYW1Jc0V4ZWN1dGFibGUgPSBmYWxzZTtcclxuICAgIHZlcnNpb246IG51bWJlciA9IDA7XHJcblxyXG4gICAgdGltZXJIYW5kbGU6IGFueTtcclxuXHJcbiAgICByaWdodERpdjogUmlnaHREaXY7XHJcbiAgICAkcmlnaHREaXZJbm5lcjogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICBmaWxlRXhwbG9yZXI6IEVtYmVkZGVkRmlsZUV4cGxvcmVyO1xyXG5cclxuICAgIGRlYm91bmNlRGlhZ3JhbURyYXdpbmc6IGFueTtcclxuXHJcbiAgICBpbmRleGVkREI6IEVtYmVkZGVkSW5kZXhlZERCO1xyXG5cclxuICAgIGNvbXBpbGVSdW5zQWZ0ZXJDb2RlUmVzZXQ6IG51bWJlciA9IDA7XHJcblxyXG4gICAgc2VtaWNvbG9uQW5nZWw6IFNlbWljb2xvbkFuZ2VsO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCRkaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4sIHByaXZhdGUgc2NyaXB0TGlzdDogSk9TY3JpcHRbXSkge1xyXG5cclxuICAgICAgICB0aGlzLnJlYWRDb25maWcoJGRpdik7XHJcblxyXG4gICAgICAgIHRoaXMuaW5pdEdVSSgkZGl2KTtcclxuXHJcbiAgICAgICAgdGhpcy5pbml0U2NyaXB0cygpO1xyXG5cclxuICAgICAgICB0aGlzLmluZGV4ZWREQiA9IG5ldyBFbWJlZGRlZEluZGV4ZWREQigpO1xyXG4gICAgICAgIHRoaXMuaW5kZXhlZERCLm9wZW4oKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLmlkICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVhZFNjcmlwdHMoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5zZW1pY29sb25BbmdlbCA9IG5ldyBTZW1pY29sb25BbmdlbCh0aGlzKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdFNjcmlwdHMoKSB7XHJcblxyXG4gICAgICAgIHRoaXMuZmlsZUV4cGxvcmVyPy5yZW1vdmVBbGxGaWxlcygpO1xyXG5cclxuICAgICAgICB0aGlzLmluaXRXb3Jrc3BhY2UodGhpcy5zY3JpcHRMaXN0KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLndpdGhGaWxlTGlzdCkge1xyXG4gICAgICAgICAgICB0aGlzLmZpbGVFeHBsb3JlciA9IG5ldyBFbWJlZGRlZEZpbGVFeHBsb3Jlcih0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUsIHRoaXMuJGZpbGVzTGlzdERpdiwgdGhpcyk7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsZUV4cGxvcmVyLnNldEZpcnN0RmlsZUFjdGl2ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLnNjcmlwdExpc3QuZmlsdGVyKChzY3JpcHQpID0+IHNjcmlwdC50eXBlID09IFwiaGludFwiKS5mb3JFYWNoKChzY3JpcHQpID0+IHRoaXMuZmlsZUV4cGxvcmVyLmFkZEhpbnQoc2NyaXB0KSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5zZXRNb2R1bGVBY3RpdmUodGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldEZpcnN0TW9kdWxlKCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHJlYWRDb25maWcoJGRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCBjb25maWdKc29uOiBzdHJpbmcgfCBvYmplY3QgPSAkZGl2LmRhdGEoXCJqYXZhLW9ubGluZVwiKTtcclxuICAgICAgICBpZiAoY29uZmlnSnNvbiAhPSBudWxsICYmIHR5cGVvZiBjb25maWdKc29uID09IFwic3RyaW5nXCIpIHtcclxuICAgICAgICAgICAgdGhpcy5jb25maWcgPSBKU09OLnBhcnNlKGNvbmZpZ0pzb24uc3BsaXQoXCInXCIpLmpvaW4oJ1wiJykpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnID0ge31cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy53aXRoRmlsZUxpc3QgPT0gbnVsbCkgdGhpcy5jb25maWcud2l0aEZpbGVMaXN0ID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aFBDb2RlID09IG51bGwpIHRoaXMuY29uZmlnLndpdGhQQ29kZSA9IHRydWU7XHJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLndpdGhDb25zb2xlID09IG51bGwpIHRoaXMuY29uZmlnLndpdGhDb25zb2xlID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aEVycm9yTGlzdCA9PSBudWxsKSB0aGlzLmNvbmZpZy53aXRoRXJyb3JMaXN0ID0gdHJ1ZTtcclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aEJvdHRvbVBhbmVsID09IG51bGwpIHRoaXMuY29uZmlnLndpdGhCb3R0b21QYW5lbCA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICghKHRoaXMuY29uZmlnLndpdGhDb25zb2xlIHx8IHRoaXMuY29uZmlnLndpdGhQQ29kZSB8fCB0aGlzLmNvbmZpZy53aXRoRmlsZUxpc3QgfHwgdGhpcy5jb25maWcud2l0aEVycm9yTGlzdCkpIHtcclxuICAgICAgICAgICAgdGhpcy5jb25maWcud2l0aEJvdHRvbVBhbmVsID0gZmFsc2U7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLndpdGhCb3R0b21QYW5lbCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy53aXRoRmlsZUxpc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5jb25maWcud2l0aFBDb2RlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLndpdGhDb25zb2xlID0gZmFsc2U7XHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLndpdGhFcnJvckxpc3QgPSBmYWxzZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKHRoaXMuY29uZmlnLnNwZWVkID09IG51bGwpIHRoaXMuY29uZmlnLnNwZWVkID0gOTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldE1vZHVsZUFjdGl2ZShtb2R1bGU6IE1vZHVsZSkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aEZpbGVMaXN0ICYmIHRoaXMuZmlsZUV4cGxvcmVyLmN1cnJlbnRGaWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy5maWxlRXhwbG9yZXIuY3VycmVudEZpbGUubW9kdWxlLmVkaXRvclN0YXRlID0gdGhpcy5nZXRNb25hY29FZGl0b3IoKS5zYXZlVmlld1N0YXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aEZpbGVMaXN0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuZmlsZUV4cGxvcmVyLm1hcmtGaWxlKG1vZHVsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBXSUNIVElHOiBEaWUgUmVpaGVuZm9sZ2UgZGVyIGJlaWRlbiBPcGVyYXRpb25lbiBpc3QgZXh0cmVtIHdpY2h0aWcuXHJcbiAgICAgICAgICogRmFsbHMgZGFzIE1vZGVsIGltIHJlYWRvbmx5LVp1c3RhbmQgZ2VzZXR6dCB3aXJkLCBmdW5rdGlvbmllcnQgPFN0cmcgKyAuPiBcclxuICAgICAgICAgKiBuaWNodCB1bmQgZGllIExpZ2h0YnVsYnMgd2VyZGVuIG5pY2h0IGFuZ2V6ZWlndCwgc2VsYnN0IGRhbm4sIHdlbm5cclxuICAgICAgICAgKiBzcMOkdGVyIHJlYWRvbmx5ID0gZmFsc2UgZ2VzZXR6dCB3aXJkLlxyXG4gICAgICAgICAqL1xyXG4gICAgICAgIHRoaXMuZ2V0TW9uYWNvRWRpdG9yKCkudXBkYXRlT3B0aW9ucyh7XHJcbiAgICAgICAgICAgIHJlYWRPbmx5OiBmYWxzZSxcclxuICAgICAgICAgICAgbGluZU51bWJlcnNNaW5DaGFyczogNFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWRpdG9yLmVkaXRvci5zZXRNb2RlbChtb2R1bGUubW9kZWwpO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKG1vZHVsZS5lZGl0b3JTdGF0ZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0TW9uYWNvRWRpdG9yKCkucmVzdG9yZVZpZXdTdGF0ZShtb2R1bGUuZWRpdG9yU3RhdGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbW9kdWxlLnJlbmRlckJyZWFrcG9pbnREZWNvcmF0b3JzKCk7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG4gICAgcmVhZFNjcmlwdHMoKSB7XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGVzID0gdGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXMoZmFsc2UpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIHRoaXMuaW5kZXhlZERCLmdldFNjcmlwdCh0aGlzLmNvbmZpZy5pZCwgKHNjcmlwdExpc3RKU29uKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChzY3JpcHRMaXN0SlNvbiA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zYXZlU2NyaXB0cygpO1xyXG4gICAgICAgICAgICAgICAgfSwgMTAwMCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHNjcmlwdExpc3Q6IHN0cmluZ1tdID0gSlNPTi5wYXJzZShzY3JpcHRMaXN0SlNvbik7XHJcbiAgICAgICAgICAgICAgICBsZXQgY291bnREb3duID0gc2NyaXB0TGlzdC5sZW5ndGg7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgbW9kdWxlIG9mIG1vZHVsZXMpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmZpbGVFeHBsb3Jlcj8ucmVtb3ZlTW9kdWxlKG1vZHVsZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW1vdmVNb2R1bGUobW9kdWxlKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBuYW1lIG9mIHNjcmlwdExpc3QpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcmlwdElkID0gdGhpcy5jb25maWcuaWQgKyBuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlZERCLmdldFNjcmlwdChzY3JpcHRJZCwgKHNjcmlwdCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2NyaXB0ICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbW9kdWxlID0gdGhhdC5hZGRNb2R1bGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IHNjcmlwdCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImphdmFcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlRXhwbG9yZXI/LmFkZE1vZHVsZShtb2R1bGUpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC4kcmVzZXRCdXR0b24uZmFkZUluKDEwMDApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUmV0cmlldmluZyBzY3JpcHQgXCIgKyBzY3JpcHRJZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY291bnREb3duLS07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3VudERvd24gPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2F2ZVNjcmlwdHMoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5maWxlRXhwbG9yZXI/LnNldEZpcnN0RmlsZUFjdGl2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuZmlsZUV4cGxvcmVyID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbW9kdWxlcyA9IHRoYXQuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRNb2R1bGVzKGZhbHNlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAobW9kdWxlcy5sZW5ndGggPiAwKSB0aGF0LnNldE1vZHVsZUFjdGl2ZShtb2R1bGVzWzBdKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzYXZlU2NyaXB0cygpIHtcclxuXHJcbiAgICAgICAgbGV0IG1vZHVsZXMgPSB0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUuZ2V0TW9kdWxlcyhmYWxzZSk7XHJcblxyXG4gICAgICAgIGxldCBzY3JpcHRMaXN0OiBzdHJpbmdbXSA9IFtdO1xyXG4gICAgICAgIGxldCBvbmVOb3RTYXZlZDogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgICAgICBtb2R1bGVzLmZvckVhY2gobSA9PiBvbmVOb3RTYXZlZCA9IG9uZU5vdFNhdmVkIHx8ICFtLmZpbGUuc2F2ZWQpO1xyXG5cclxuICAgICAgICBpZiAob25lTm90U2F2ZWQpIHtcclxuXHJcbiAgICAgICAgICAgIGZvciAobGV0IG1vZHVsZSBvZiBtb2R1bGVzKSB7XHJcbiAgICAgICAgICAgICAgICBzY3JpcHRMaXN0LnB1c2gobW9kdWxlLmZpbGUubmFtZSk7XHJcbiAgICAgICAgICAgICAgICBsZXQgc2NyaXB0SWQgPSB0aGlzLmNvbmZpZy5pZCArIG1vZHVsZS5maWxlLm5hbWU7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluZGV4ZWREQi53cml0ZVNjcmlwdChzY3JpcHRJZCwgbW9kdWxlLmdldFByb2dyYW1UZXh0RnJvbU1vbmFjb01vZGVsKCkpO1xyXG4gICAgICAgICAgICAgICAgbW9kdWxlLmZpbGUuc2F2ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJTYXZpbmcgc2NyaXB0IFwiICsgc2NyaXB0SWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLmluZGV4ZWREQi53cml0ZVNjcmlwdCh0aGlzLmNvbmZpZy5pZCwgSlNPTi5zdHJpbmdpZnkoc2NyaXB0TGlzdCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZGVsZXRlU2NyaXB0c0luREIoKSB7XHJcbiAgICAgICAgdGhpcy5pbmRleGVkREIuZ2V0U2NyaXB0KHRoaXMuY29uZmlnLmlkLCAoc2NyaXB0TGlzdEpTb24pID0+IHtcclxuICAgICAgICAgICAgaWYgKHNjcmlwdExpc3RKU29uID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgc2NyaXB0TGlzdDogc3RyaW5nW10gPSBKU09OLnBhcnNlKHNjcmlwdExpc3RKU29uKTtcclxuXHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBuYW1lIG9mIHNjcmlwdExpc3QpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHNjcmlwdElkID0gdGhpcy5jb25maWcuaWQgKyBuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5kZXhlZERCLnJlbW92ZVNjcmlwdChzY3JpcHRJZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5pbmRleGVkREIucmVtb3ZlU2NyaXB0KHRoaXMuY29uZmlnLmlkKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0V29ya3NwYWNlKHNjcmlwdExpc3Q6IEpPU2NyaXB0W10pIHtcclxuICAgICAgICB0aGlzLmN1cnJlbnRXb3Jrc3BhY2UgPSBuZXcgV29ya3NwYWNlKFwiRW1iZWRkZWQtV29ya3NwYWNlXCIsIHRoaXMsIDApO1xyXG5cclxuICAgICAgICBsZXQgaSA9IDA7XHJcbiAgICAgICAgZm9yIChsZXQgc2NyaXB0IG9mIHNjcmlwdExpc3QpIHtcclxuICAgICAgICAgICAgaWYgKHNjcmlwdC50eXBlID09IFwiamF2YVwiKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1vZHVsZShzY3JpcHQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgYWRkTW9kdWxlKHNjcmlwdDogSk9TY3JpcHQpOiBNb2R1bGUge1xyXG4gICAgICAgIGxldCBtb2R1bGU6IE1vZHVsZSA9IE1vZHVsZS5yZXN0b3JlRnJvbURhdGEoe1xyXG4gICAgICAgICAgICBpZDogdGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLmdldE1vZHVsZXModHJ1ZSkubGVuZ3RoLFxyXG4gICAgICAgICAgICBuYW1lOiBzY3JpcHQudGl0bGUsXHJcbiAgICAgICAgICAgIHRleHQ6IHNjcmlwdC50ZXh0LFxyXG4gICAgICAgICAgICB0ZXh0X2JlZm9yZV9yZXZpc2lvbjogbnVsbCxcclxuICAgICAgICAgICAgc3VibWl0dGVkX2RhdGU6IG51bGwsXHJcbiAgICAgICAgICAgIHN0dWRlbnRfZWRpdGVkX2FmdGVyX3JldmlzaW9uOiBmYWxzZSxcclxuICAgICAgICAgICAgdmVyc2lvbjogMSxcclxuICAgICAgICAgICAgd29ya3NwYWNlX2lkOiAwLFxyXG4gICAgICAgICAgICBmb3JjZVVwZGF0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGlkZW50aWNhbF90b19yZXBvc2l0b3J5X3ZlcnNpb246IGZhbHNlLFxyXG4gICAgICAgICAgICBmaWxlX3R5cGU6IDBcclxuICAgICAgICB9LCB0aGlzKTtcclxuXHJcbiAgICAgICAgdGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLnB1dE1vZHVsZShtb2R1bGUpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIG1vZHVsZS5tb2RlbC5vbkRpZENoYW5nZUNvbnRlbnQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LmNvbnNpZGVyU2hvd2luZ0NvZGVSZXNldEJ1dHRvbigpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gbW9kdWxlO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZU1vZHVsZShtb2R1bGU6IE1vZHVsZSkge1xyXG4gICAgICAgIHRoaXMuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5yZW1vdmVNb2R1bGUobW9kdWxlKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaW5pdEdVSSgkZGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcblxyXG4gICAgICAgIC8vIGxldCAkbGVmdERpdiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvZV9sZWZ0RGl2XCI+PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgICRkaXYuY3NzKHtcclxuICAgICAgICAgICAgXCJiYWNrZ3JvdW5kLWltYWdlXCI6IFwibm9uZVwiLFxyXG4gICAgICAgICAgICBcImJhY2tncm91bmQtc2l6ZVwiOiBcIjEwMCVcIlxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIGxldCAkY2VudGVyRGl2ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9lX2NlbnRlckRpdlwiPjwvZGl2PicpO1xyXG4gICAgICAgIGxldCAkcmVzZXRNb2RhbFdpbmRvdyA9IHRoaXMubWFrZUNvZGVSZXNldE1vZGFsV2luZG93KCRkaXYpO1xyXG5cclxuICAgICAgICBsZXQgJHJpZ2h0RGl2ID0gdGhpcy5tYWtlUmlnaHREaXYoKTtcclxuXHJcbiAgICAgICAgbGV0ICRlZGl0b3JEaXYgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb2VfZWRpdG9yRGl2XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdGhpcy4kbW9uYWNvRGl2ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9lX21vbmFjb0RpdlwiPjwvZGl2PicpO1xyXG4gICAgICAgIHRoaXMuJGhpbnREaXYgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb2VfaGludERpdiBqb19zY3JvbGxhYmxlXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdGhpcy4kcmVzZXRCdXR0b24gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb2VfcmVzZXRCdXR0b24gam9fYnV0dG9uIGpvX2FjdGl2ZVwiIHRpdGxlPVwiQ29kZSBhdWYgQXVzZ2FuZ3N6dXN0YW5kIHp1csO8Y2tzZXR6ZW5cIj5Db2RlIFJlc2V0PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgICRlZGl0b3JEaXYuYXBwZW5kKHRoaXMuJG1vbmFjb0RpdiwgdGhpcy4kaGludERpdiwgdGhpcy4kcmVzZXRCdXR0b24pO1xyXG5cclxuICAgICAgICBsZXQgJGJyYWNrZXRFcnJvckRpdiA9IHRoaXMubWFrZUJyYWNrZXRFcnJvckRpdigpO1xyXG4gICAgICAgICRlZGl0b3JEaXYuYXBwZW5kKCRicmFja2V0RXJyb3JEaXYpO1xyXG5cclxuICAgICAgICB0aGlzLiRyZXNldEJ1dHRvbi5oaWRlKCk7XHJcblxyXG4gICAgICAgIHRoaXMuJHJlc2V0QnV0dG9uLm9uKFwiY2xpY2tcIiwgKCkgPT4geyAkcmVzZXRNb2RhbFdpbmRvdy5zaG93KCk7IH0pXHJcblxyXG4gICAgICAgIHRoaXMuJGhpbnREaXYuaGlkZSgpO1xyXG5cclxuICAgICAgICBsZXQgJGNvbnRyb2xzRGl2ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9lX2NvbnRyb2xzRGl2XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgbGV0ICRib3R0b21EaXZJbm5lciA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvZV9ib3R0b21EaXZJbm5lclwiPjwvZGl2PicpO1xyXG5cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLndpdGhCb3R0b21QYW5lbCkge1xyXG4gICAgICAgICAgICBsZXQgJGJvdHRvbURpdiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvZV9ib3R0b21EaXZcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgdGhpcy5tYWtlQm90dG9tRGl2KCRib3R0b21EaXZJbm5lciwgJGNvbnRyb2xzRGl2KTtcclxuICAgICAgICAgICAgJGJvdHRvbURpdi5hcHBlbmQoJGJvdHRvbURpdklubmVyKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlnLndpdGhGaWxlTGlzdCkge1xyXG4gICAgICAgICAgICAgICAgbGV0ICRmaWxlc0RpdiA9IHRoaXMubWFrZUZpbGVzRGl2KCk7XHJcbiAgICAgICAgICAgICAgICAkYm90dG9tRGl2LnByZXBlbmQoJGZpbGVzRGl2KTtcclxuICAgICAgICAgICAgICAgIG5ldyBFbWJlZGRlZFNsaWRlcigkZmlsZXNEaXYsIGZhbHNlLCBmYWxzZSwgKCkgPT4geyB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtYWtlVGFicygkYm90dG9tRGl2SW5uZXIpO1xyXG5cclxuXHJcbiAgICAgICAgICAgICRjZW50ZXJEaXYuYXBwZW5kKCRlZGl0b3JEaXYsICRib3R0b21EaXYpO1xyXG4gICAgICAgICAgICBuZXcgRW1iZWRkZWRTbGlkZXIoJGJvdHRvbURpdiwgdHJ1ZSwgdHJ1ZSwgKCkgPT4geyB0aGlzLmVkaXRvci5lZGl0b3IubGF5b3V0KCk7IH0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICRjZW50ZXJEaXYucHJlcGVuZCgkZWRpdG9yRGl2KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgXHJcblxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY29uZmlnLndpdGhCb3R0b21QYW5lbCkge1xyXG4gICAgICAgICAgICAkY2VudGVyRGl2LnByZXBlbmQoJGNvbnRyb2xzRGl2KTtcclxuICAgICAgICAgICAgJGNvbnRyb2xzRGl2LmFkZENsYXNzKCdqb2VfY29udHJvbFBhbmVsX3RvcCcpO1xyXG4gICAgICAgICAgICAkZWRpdG9yRGl2LmNzcyh7XHJcbiAgICAgICAgICAgICAgICAncG9zaXRpb24nOiAncmVsYXRpdmUnLFxyXG4gICAgICAgICAgICAgICAgJ2hlaWdodCc6ICcxcHgnXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGRpdi5hZGRDbGFzcygnam9lX2phdmFPbmxpbmVEaXYnKTtcclxuICAgICAgICAkZGl2LmFwcGVuZCgkY2VudGVyRGl2LCAkcmlnaHREaXYpO1xyXG4gICAgICAgIG5ldyBFbWJlZGRlZFNsaWRlcigkcmlnaHREaXYsIHRydWUsIGZhbHNlLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnLmpvX2dyYXBoaWNzJykudHJpZ2dlcignc2l6ZUNoYW5nZWQnKTtcclxuICAgICAgICAgICAgdGhpcy5lZGl0b3IuZWRpdG9yLmxheW91dCgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmVkaXRvciA9IG5ldyBFZGl0b3IodGhpcywgZmFsc2UsIHRydWUpO1xyXG4gICAgICAgIHRoaXMuZWRpdG9yLmluaXRHVUkodGhpcy4kbW9uYWNvRGl2KTtcclxuICAgICAgICB0aGlzLiRtb25hY29EaXYuZmluZCgnLm1vbmFjby1lZGl0b3InKS5jc3MoJ3otaW5kZXgnLCAnMTAnKTtcclxuXHJcbiAgICAgICAgaWYgKCRkaXYuYXR0cigndGFiaW5kZXgnKSA9PSBudWxsKSAkZGl2LmF0dHIoJ3RhYmluZGV4JywgXCIwXCIpO1xyXG4gICAgICAgIHRoaXMuYWN0aW9uTWFuYWdlciA9IG5ldyBBY3Rpb25NYW5hZ2VyKCRkaXYsIHRoaXMpO1xyXG4gICAgICAgIHRoaXMuYWN0aW9uTWFuYWdlci5pbml0KCk7XHJcblxyXG4gICAgICAgIHRoaXMuYm90dG9tRGl2ID0gbmV3IEJvdHRvbURpdih0aGlzLCAkYm90dG9tRGl2SW5uZXIsICRkaXYpO1xyXG4gICAgICAgIHRoaXMuYm90dG9tRGl2LmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgdGhpcy5yaWdodERpdiA9IG5ldyBSaWdodERpdih0aGlzLCB0aGlzLiRyaWdodERpdklubmVyKTtcclxuICAgICAgICB0aGlzLnJpZ2h0RGl2LmluaXRHVUkoKTtcclxuXHJcbiAgICAgICAgbGV0ICRyaWdodFNpZGVDb250YWluZXIgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19yaWdodGRpdi1yaWdodHNpZGUtY29udGFpbmVyXCI+Jyk7XHJcbiAgICAgICAgbGV0ICRjb29yZGluYXRlcyA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2Nvb3JkaW5hdGVzXCI+KDAvMCk8L2Rpdj4nKTtcclxuICAgICAgICB0aGlzLiRyaWdodERpdklubmVyLmFwcGVuZCgkcmlnaHRTaWRlQ29udGFpbmVyKTtcclxuICAgICAgICAkcmlnaHRTaWRlQ29udGFpbmVyLmFwcGVuZCgkY29vcmRpbmF0ZXMpO1xyXG5cclxuICAgICAgICB0aGlzLmRlYnVnZ2VyID0gbmV3IERlYnVnZ2VyKHRoaXMsIHRoaXMuJGRlYnVnZ2VyRGl2LCBudWxsKTtcclxuXHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlciA9IG5ldyBJbnRlcnByZXRlcih0aGlzLCB0aGlzLmRlYnVnZ2VyLFxyXG4gICAgICAgICAgICBuZXcgUHJvZ3JhbUNvbnRyb2xCdXR0b25zKCRjb250cm9sc0RpdiwgJGVkaXRvckRpdiksXHJcbiAgICAgICAgICAgIHRoaXMuJHJ1bkRpdik7XHJcblxyXG4gICAgICAgIGxldCAkaW5mb0J1dHRvbiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2J1dHRvbiBqb19hY3RpdmUgaW1nX2VsbGlwc2lzLWRhcmtcIiBzdHlsZT1cIm1hcmdpbi1sZWZ0OiAxNnB4XCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgJGNvbnRyb2xzRGl2LmFwcGVuZCgkaW5mb0J1dHRvbik7XHJcblxyXG4gICAgICAgICRpbmZvQnV0dG9uLm9uKCdtb3VzZWRvd24nLCAoZXYpID0+IHtcclxuICAgICAgICAgICAgZXYucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIG9wZW5Db250ZXh0TWVudShbe1xyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogXCLDnGJlciBkaWUgT25saW5lLUlERSAuLi5cIixcclxuICAgICAgICAgICAgICAgIGxpbms6IFwiaHR0cHM6Ly93d3cub25saW5lLWlkZS5kZVwiLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvLlxyXG4gICAgICAgICAgICAgICAgfX1dLCBldi5wYWdlWCArIDIsIGV2LnBhZ2VZICsgMik7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLmluaXRHVUkoKTtcclxuICAgICAgICAgICAgdGhpcy5lZGl0b3IuZWRpdG9yLmxheW91dCgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVyID0gbmV3IENvbXBpbGVyKHRoaXMpO1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLmNvbnRyb2xCdXR0b25zLnNwZWVkQ29udHJvbC5zZXRTcGVlZEluU3RlcHNQZXJTZWNvbmQodGhpcy5jb25maWcuc3BlZWQpO1xyXG4gICAgICAgICAgICB0aGlzLnN0YXJ0VGltZXIoKTtcclxuICAgICAgICB9LCAyMDApO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgbWFrZUJyYWNrZXRFcnJvckRpdigpOiBKUXVlcnk8SFRNTEVsZW1lbnQ+IHtcclxuICAgICAgICByZXR1cm4galF1ZXJ5KGBcclxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9fcGFyZW50aGVzaXNfd2FybmluZ1wiIHRpdGxlPVwiS2xhbW1lcndhcm51bmchXCIgc3R5bGU9XCJib3R0b206IDU1cHhcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9fd2FybmluZ19saWdodFwiPjwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb19wd19oZWFkaW5nXCI+eyB9PC9kaXY+XHJcbiAgICAgICAgPGRpdiB0aXRsZT1cIkxldHp0ZW4gU2Nocml0dCByw7xja2fDpG5naWdcIiBcclxuICAgICAgICAgICAgY2xhc3M9XCJqb19wd191bmRvIGltZ191bmRvIGpvX2J1dHRvbiBqb19hY3RpdmVcIj48L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICBgKTtcclxuICAgIH1cclxuXHJcbiAgICBtYWtlQ29kZVJlc2V0TW9kYWxXaW5kb3coJHBhcmVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pik6IEpRdWVyeTxIVE1MRWxlbWVudD4ge1xyXG4gICAgICAgIGxldCAkd2luZG93ID0galF1ZXJ5KFxyXG4gICAgICAgICAgICBgXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2VfY29kZVJlc2V0TW9kYWxcIj5cclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZsZXg6IDFcIj48L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBzdHlsZT1cImRpc3BsYXk6IGZsZXhcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmbGV4OiAxXCI+PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IHN0eWxlPVwicGFkZGluZy1sZWZ0OiAzMHB4O1wiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImNvbG9yOiByZWQ7IG1hcmdpbi1ib3R0b206IDEwcHg7IGZvbnQtd2VpZ2h0OiBib2xkXCI+V2FybnVuZzo8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXY+U29sbCBkZXIgQ29kZSB3aXJrbGljaCBhdWYgZGVuIEF1c2dhbmdzenVzdGFuZCB6dXLDvGNrZ2VzZXR6dCB3ZXJkZW4/PC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PkFsbGUgdm9uIERpciBnZW1hY2h0ZW4gw4RuZGVydW5nZW4gd2VyZGVuIGRhbWl0IHZlcndvcmZlbi48L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBzdHlsZT1cImZsZXg6IDFcIj48L2Rpdj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2VfY29kZVJlc2V0TW9kYWxCdXR0b25zXCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb2VfY29kZVJlc2V0TW9kYWxDYW5jZWwgam9fYnV0dG9uIGpvX2FjdGl2ZVwiPkFiYnJlY2hlbjwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9lX2NvZGVSZXNldE1vZGFsT0sgam9fYnV0dG9uIGpvX2FjdGl2ZVwiPk9LPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8ZGl2IHN0eWxlPVwiZmxleDogMlwiPjwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICBgXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgJHdpbmRvdy5oaWRlKCk7XHJcblxyXG4gICAgICAgICRwYXJlbnQuYXBwZW5kKCR3aW5kb3cpO1xyXG5cclxuICAgICAgICBqUXVlcnkoXCIuam9lX2NvZGVSZXNldE1vZGFsQ2FuY2VsXCIpLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICAkd2luZG93LmhpZGUoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgalF1ZXJ5KFwiLmpvZV9jb2RlUmVzZXRNb2RhbE9LXCIpLm9uKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgdGhpcy5pbml0U2NyaXB0cygpO1xyXG4gICAgICAgICAgICB0aGlzLmRlbGV0ZVNjcmlwdHNJbkRCKCk7XHJcblxyXG4gICAgICAgICAgICAkd2luZG93LmhpZGUoKTtcclxuICAgICAgICAgICAgdGhpcy4kcmVzZXRCdXR0b24uaGlkZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVSdW5zQWZ0ZXJDb2RlUmVzZXQgPSAxO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuICR3aW5kb3c7XHJcbiAgICB9XHJcblxyXG4gICAgc2hvd1Byb2dyYW1Qb2ludGVyUG9zaXRpb24oZmlsZTogRmlsZSwgcG9zaXRpb246IFRleHRQb3NpdGlvbikge1xyXG5cclxuICAgICAgICBpZiAoZmlsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy53aXRoRmlsZUxpc3QpIHtcclxuICAgICAgICAgICAgbGV0IGZpbGVEYXRhID0gdGhpcy5maWxlRXhwbG9yZXIuZmlsZXMuZmluZCgoZmlsZURhdGEpID0+IGZpbGVEYXRhLm1vZHVsZS5maWxlID09IGZpbGUpO1xyXG4gICAgICAgICAgICBpZiAoZmlsZURhdGEgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoZmlsZURhdGEubW9kdWxlICE9IHRoaXMuZ2V0Q3VycmVudGx5RWRpdGVkTW9kdWxlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc2V0TW9kdWxlQWN0aXZlKGZpbGVEYXRhLm1vZHVsZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMucHJvZ3JhbVBvaW50ZXJNb2R1bGUgPSBmaWxlRGF0YS5tb2R1bGU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9ncmFtUG9pbnRlck1vZHVsZSA9IHRoaXMuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5nZXRGaXJzdE1vZHVsZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJhbmdlID0ge1xyXG4gICAgICAgICAgICBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uLCBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmUsXHJcbiAgICAgICAgICAgIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uICsgcG9zaXRpb24ubGVuZ3RoLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5nZXRNb25hY29FZGl0b3IoKS5yZXZlYWxSYW5nZUluQ2VudGVySWZPdXRzaWRlVmlld3BvcnQocmFuZ2UpO1xyXG4gICAgICAgIHRoaXMucHJvZ3JhbVBvaW50ZXJEZWNvcmF0aW9uID0gdGhpcy5nZXRNb25hY29FZGl0b3IoKS5kZWx0YURlY29yYXRpb25zKHRoaXMucHJvZ3JhbVBvaW50ZXJEZWNvcmF0aW9uLCBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHsgY2xhc3NOYW1lOiAnam9fcmV2ZWFsUHJvZ3JhbVBvaW50ZXInLCBpc1dob2xlTGluZTogdHJ1ZSB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZSxcclxuICAgICAgICAgICAgICAgIG9wdGlvbnM6IHsgYmVmb3JlQ29udGVudENsYXNzTmFtZTogJ2pvX3JldmVhbFByb2dyYW1Qb2ludGVyQmVmb3JlJyB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdKTtcclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBoaWRlUHJvZ3JhbVBvaW50ZXJQb3NpdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5nZXRDdXJyZW50bHlFZGl0ZWRNb2R1bGUoKSA9PSB0aGlzLnByb2dyYW1Qb2ludGVyTW9kdWxlKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ2V0TW9uYWNvRWRpdG9yKCkuZGVsdGFEZWNvcmF0aW9ucyh0aGlzLnByb2dyYW1Qb2ludGVyRGVjb3JhdGlvbiwgW10pO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnByb2dyYW1Qb2ludGVyTW9kdWxlID0gbnVsbDtcclxuICAgICAgICB0aGlzLnByb2dyYW1Qb2ludGVyRGVjb3JhdGlvbiA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIG1ha2VGaWxlc0RpdigpOiBKUXVlcnk8SFRNTEVsZW1lbnQ+IHtcclxuXHJcblxyXG4gICAgICAgIGxldCAkZmlsZXNEaXYgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb2VfYm90dG9tRGl2RmlsZXMgam9fc2Nyb2xsYWJsZVwiPjwvZGl2PicpO1xyXG5cclxuICAgICAgICBsZXQgJGZpbGVzSGVhZGVyID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9lX2ZpbGVzSGVhZGVyIGpvX3RhYmhlYWRpbmcgam9fYWN0aXZlXCIgIHN0eWxlPVwibGluZS1oZWlnaHQ6IDI0cHhcIj5Qcm9ncmFtbWRhdGVpZW48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgdGhpcy4kZmlsZXNMaXN0RGl2ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9lX2ZpbGVzTGlzdCBqb19zY3JvbGxhYmxlXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgLy8gZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IDIwOyBpbmRleCsrKSB7ICAgICAgICAgICAgXHJcbiAgICAgICAgLy8gICAgIGxldCAkZmlsZSA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2ZpbGUgam9famF2YVwiPjxkaXYgY2xhc3M9XCJqb19maWxlaW1hZ2VcIj48L2Rpdj48ZGl2IGNsYXNzPVwiam9fZmlsZW5hbWVcIj48L2Rpdj48L2Rpdj48L2Rpdj4nKTtcclxuICAgICAgICAvLyAgICAgJGZpbGVzTGlzdC5hcHBlbmQoJGZpbGUpO1xyXG4gICAgICAgIC8vIH1cclxuXHJcbiAgICAgICAgJGZpbGVzRGl2LmFwcGVuZCgkZmlsZXNIZWFkZXIsIHRoaXMuJGZpbGVzTGlzdERpdik7XHJcblxyXG4gICAgICAgIHJldHVybiAkZmlsZXNEaXY7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnRUaW1lcigpIHtcclxuICAgICAgICBpZiAodGhpcy50aW1lckhhbmRsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lckhhbmRsZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy50aW1lckhhbmRsZSA9IHNldEludGVydmFsKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIHRoYXQuY29tcGlsZUlmRGlydHkoKTtcclxuXHJcbiAgICAgICAgfSwgNTAwKTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNvbXBpbGVJZkRpcnR5KCkge1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50V29ya3NwYWNlID09IG51bGwpIHJldHVybjtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFdvcmtzcGFjZS5tb2R1bGVTdG9yZS5pc0RpcnR5KCkgJiZcclxuICAgICAgICAgICAgdGhpcy5jb21waWxlci5jb21waWxlclN0YXR1cyAhPSBDb21waWxlclN0YXR1cy5jb21waWxpbmdcclxuICAgICAgICAgICAgJiYgdGhpcy5pbnRlcnByZXRlci5zdGF0ZSAhPSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmdcclxuICAgICAgICAgICAgJiYgdGhpcy5pbnRlcnByZXRlci5zdGF0ZSAhPSBJbnRlcnByZXRlclN0YXRlLnBhdXNlZCkge1xyXG4gICAgICAgICAgICB0cnkge1xyXG5cclxuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZXIuY29tcGlsZSh0aGlzLmN1cnJlbnRXb3Jrc3BhY2UubW9kdWxlU3RvcmUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBlcnJvcnMgPSB0aGlzLlxyXG4gICAgICAgICAgICAgICAgYm90dG9tRGl2Py5lcnJvck1hbmFnZXI/LnNob3dFcnJvcnModGhpcy5jdXJyZW50V29ya3NwYWNlKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLmVkaXRvci5vbkRpZENoYW5nZUN1cnNvclBvc2l0aW9uKG51bGwpOyAvLyBtYXJrIG9jY3VycmVuY2llcyBvZiBzeW1ib2wgdW5kZXIgY3Vyc29yXHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5wcmludFByb2dyYW0oKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLnZlcnNpb24rKztcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgc3RhcnRhYmxlID0gdGhpcy5pbnRlcnByZXRlci5nZXRTdGFydGFibGVNb2R1bGUodGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlKSAhPSBudWxsO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChzdGFydGFibGUgJiZcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb3B5RXhlY3V0YWJsZU1vZHVsZVN0b3JlVG9JbnRlcnByZXRlcigpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW50ZXJwcmV0ZXIuc2V0U3RhdGUoSW50ZXJwcmV0ZXJTdGF0ZS5kb25lKTtcclxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzLmludGVycHJldGVyLmluaXQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAoIXN0YXJ0YWJsZSAmJlxyXG4gICAgICAgICAgICAgICAgICAgICh0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUuZG9uZSB8fCB0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUuZXJyb3IpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5pbnRlcnByZXRlci5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gdGhpcy5kcmF3Q2xhc3NEaWFncmFtcyghdGhpcy5yaWdodERpdi5pc0NsYXNzRGlhZ3JhbUVuYWJsZWQoKSk7XHJcblxyXG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb21waWxlci5jb21waWxlclN0YXR1cyA9IENvbXBpbGVyU3RhdHVzLmVycm9yO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcbiAgICBjb25zaWRlclNob3dpbmdDb2RlUmVzZXRCdXR0b24oKSB7XHJcbiAgICAgICAgdGhpcy5jb21waWxlUnVuc0FmdGVyQ29kZVJlc2V0Kys7XHJcbiAgICAgICAgaWYgKHRoaXMuY29tcGlsZVJ1bnNBZnRlckNvZGVSZXNldCA9PSAzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJHJlc2V0QnV0dG9uLmZhZGVJbigxMDAwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBwcmludFByb2dyYW0oKSB7XHJcblxyXG4gICAgICAgIHRoaXMuYm90dG9tRGl2LnByaW50TW9kdWxlVG9Cb3R0b21EaXYodGhpcy5jdXJyZW50V29ya3NwYWNlLCB0aGlzLmdldEN1cnJlbnRseUVkaXRlZE1vZHVsZSgpKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZHJhd0NsYXNzRGlhZ3JhbXMob25seVVwZGF0ZUlkZW50aWZpZXJzOiBib29sZWFuKSB7XHJcbiAgICAgICAgLy8gY2xlYXJUaW1lb3V0KHRoaXMuZGVib3VuY2VEaWFncmFtRHJhd2luZyk7XHJcbiAgICAgICAgLy8gdGhpcy5kZWJvdW5jZURpYWdyYW1EcmF3aW5nID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgLy8gICAgIHRoaXMucmlnaHREaXY/LmNsYXNzRGlhZ3JhbT8uZHJhd0RpYWdyYW0odGhpcy5jdXJyZW50V29ya3NwYWNlLCBvbmx5VXBkYXRlSWRlbnRpZmllcnMpO1xyXG4gICAgICAgIC8vIH0sIDUwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29weUV4ZWN1dGFibGVNb2R1bGVTdG9yZVRvSW50ZXJwcmV0ZXIoKSB7XHJcbiAgICAgICAgbGV0IG1zID0gdGhpcy5jdXJyZW50V29ya3NwYWNlLm1vZHVsZVN0b3JlLmNvcHkoKTtcclxuICAgICAgICB0aGlzLmludGVycHJldGVyLm1vZHVsZVN0b3JlID0gbXM7XHJcbiAgICAgICAgdGhpcy5pbnRlcnByZXRlci5tb2R1bGVTdG9yZVZlcnNpb24gPSB0aGlzLnZlcnNpb247XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmludGVycHJldGVyLnN0YXRlID09IEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkICYmIHRoaXMucHJvZ3JhbUlzRXhlY3V0YWJsZSkge1xyXG4gICAgICAgICAgICB0aGlzLmludGVycHJldGVyLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUuZG9uZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxuICAgIG1ha2VCb3R0b21EaXYoJGJvdHRvbURpdjogSlF1ZXJ5PEhUTUxFbGVtZW50PiwgJGJ1dHRvbkRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuICAgICAgICBsZXQgJHRhYmhlYWRpbmdzID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fdGFiaGVhZGluZ3NcIj48L2Rpdj4nKTtcclxuICAgICAgICAkdGFiaGVhZGluZ3MuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIGxldCAkdGhSaWdodFNpZGUgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb2VfdGFiaGVhZGluZy1yaWdodCBqb19ub0hlYWRpbmdcIj48L2Rpdj4nKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLndpdGhDb25zb2xlKSB7XHJcbiAgICAgICAgICAgIGxldCAkdGhDb25zb2xlQ2xlYXIgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJpbWdfY2xlYXItZGFyayBqb19idXR0b24gam9fYWN0aXZlIGpvX2NvbnNvbGUtY2xlYXJcIicgK1xyXG4gICAgICAgICAgICAgICAgJ3N0eWxlPVwiZGlzcGxheTogbm9uZTsgbWFyZ2luLXJpZ2h0OiA4cHg7XCIgdGl0bGU9XCJDb25zb2xlIGxlZXJlblwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICAkdGhSaWdodFNpZGUuYXBwZW5kKCR0aENvbnNvbGVDbGVhcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkdGhSaWdodFNpZGUuYXBwZW5kKCRidXR0b25EaXYpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aEVycm9yTGlzdCkge1xyXG4gICAgICAgICAgICBsZXQgJHRoRXJyb3JzID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fdGFiaGVhZGluZyBqb19hY3RpdmVcIiBkYXRhLXRhcmdldD1cImpvX2Vycm9yc1RhYlwiIHN0eWxlPVwibGluZS1oZWlnaHQ6IDI0cHhcIj5GZWhsZXI8L2Rpdj4nKTtcclxuICAgICAgICAgICAgJHRhYmhlYWRpbmdzLmFwcGVuZCgkdGhFcnJvcnMpO1xyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy53aXRoQ29uc29sZSkge1xyXG4gICAgICAgICAgICBsZXQgJHRoQ29uc29sZSA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX3RhYmhlYWRpbmcgam9fY29uc29sZS10YWJcIiBkYXRhLXRhcmdldD1cImpvX2NvbnNvbGVUYWJcIiBzdHlsZT1cImxpbmUtaGVpZ2h0OiAyNHB4XCI+Q29uc29sZTwvZGl2PicpO1xyXG4gICAgICAgICAgICAkdGFiaGVhZGluZ3MuYXBwZW5kKCR0aENvbnNvbGUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuY29uZmlnLndpdGhQQ29kZSkge1xyXG4gICAgICAgICAgICBsZXQgJHRoUENvZGUgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb190YWJoZWFkaW5nXCIgZGF0YS10YXJnZXQ9XCJqb19wY29kZVRhYlwiIHN0eWxlPVwibGluZS1oZWlnaHQ6IDI0cHhcIj5QQ29kZTwvZGl2PicpO1xyXG4gICAgICAgICAgICAkdGFiaGVhZGluZ3MuYXBwZW5kKCR0aFBDb2RlKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICR0YWJoZWFkaW5ncy5hcHBlbmQoJHRoUmlnaHRTaWRlKTtcclxuXHJcbiAgICAgICAgJGJvdHRvbURpdi5hcHBlbmQoJHRhYmhlYWRpbmdzKTtcclxuXHJcbiAgICAgICAgbGV0ICR0YWJzID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fdGFicyBqb19zY3JvbGxhYmxlXCI+PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmNvbmZpZy53aXRoRXJyb3JMaXN0KSB7XHJcbiAgICAgICAgICAgIGxldCAkdGFiRXJyb3IgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19hY3RpdmUgam9fc2Nyb2xsYWJsZSBqb19lcnJvcnNUYWJcIj48L2Rpdj4nKTtcclxuICAgICAgICAgICAgJHRhYnMuYXBwZW5kKCR0YWJFcnJvcik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aENvbnNvbGUpIHtcclxuICAgICAgICAgICAgbGV0ICR0YWJDb25zb2xlID0galF1ZXJ5KFxyXG4gICAgICAgICAgICAgICAgYFxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb19lZGl0b3JGb250U2l6ZSBqb19jb25zb2xlVGFiXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImpvX2NvbnNvbGUtaW5uZXJcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX3Njcm9sbGFibGUgam9fY29uc29sZS10b3BcIj48L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2NvbW1hbmRsaW5lXCI+PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICBgKTtcclxuXHJcbiAgICAgICAgICAgICR0YWJzLmFwcGVuZCgkdGFiQ29uc29sZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jb25maWcud2l0aFBDb2RlKSB7XHJcbiAgICAgICAgICAgIGxldCAkdGFiUENvZGUgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19zY3JvbGxhYmxlIGpvX3Bjb2RlVGFiXCI+UENvZGU8L2Rpdj4nKTtcclxuICAgICAgICAgICAgJHRhYnMuYXBwZW5kKCR0YWJQQ29kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkYm90dG9tRGl2LmFwcGVuZCgkdGFicyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG1ha2VSaWdodERpdigpOiBKUXVlcnk8SFRNTEVsZW1lbnQ+IHtcclxuXHJcbiAgICAgICAgbGV0ICRyaWdodERpdiA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvZV9yaWdodERpdlwiPjwvZGl2PicpO1xyXG4gICAgICAgIHRoaXMuJHJpZ2h0RGl2SW5uZXIgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb2VfcmlnaHREaXZJbm5lclwiPjwvZGl2PicpO1xyXG4gICAgICAgICRyaWdodERpdi5hcHBlbmQodGhpcy4kcmlnaHREaXZJbm5lcik7XHJcblxyXG5cclxuICAgICAgICBsZXQgJHRhYmhlYWRpbmdzID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fdGFiaGVhZGluZ3NcIj48L2Rpdj4nKTtcclxuICAgICAgICAkdGFiaGVhZGluZ3MuY3NzKCdwb3NpdGlvbicsICdyZWxhdGl2ZScpO1xyXG4gICAgICAgIGxldCAkdGhSdW4gPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb190YWJoZWFkaW5nIGpvX2FjdGl2ZVwiIGRhdGEtdGFyZ2V0PVwiam9fcnVuXCIgc3R5bGU9XCJsaW5lLWhlaWdodDogMjRweFwiPkF1c2dhYmU8L2Rpdj4nKTtcclxuICAgICAgICBsZXQgJHRoVmFyaWFibGVzID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fdGFiaGVhZGluZyBqb19jb25zb2xlLXRhYlwiIGRhdGEtdGFyZ2V0PVwiam9fdmFyaWFibGVzVGFiXCIgc3R5bGU9XCJsaW5lLWhlaWdodDogMjRweFwiPlZhcmlhYmxlbjwvZGl2PicpO1xyXG4gICAgICAgICR0YWJoZWFkaW5ncy5hcHBlbmQoJHRoUnVuLCAkdGhWYXJpYWJsZXMpO1xyXG4gICAgICAgIHRoaXMuJHJpZ2h0RGl2SW5uZXIuYXBwZW5kKCR0YWJoZWFkaW5ncyk7XHJcblxyXG4gICAgICAgIGxldCAkdGFicyA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX3RhYnMgam9fc2Nyb2xsYWJsZVwiPjwvZGl2PicpO1xyXG4gICAgICAgIGxldCAkdmQgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19zY3JvbGxhYmxlIGpvX2VkaXRvckZvbnRTaXplIGpvX3ZhcmlhYmxlc1RhYlwiPjwvZGl2PicpO1xyXG4gICAgICAgIHRoaXMuJGRlYnVnZ2VyRGl2ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9lX2RlYnVnZ2VyRGl2XCI+PC9kaXY+Jyk7XHJcblxyXG4gICAgICAgIGxldCAkYWx0ZXJuYXRpdmVUZXh0ID0galF1ZXJ5KGBcclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2FsdGVybmF0aXZlVGV4dCBqb19zY3JvbGxhYmxlXCI+XHJcbiAgICAgICAgICAgIDxkaXYgc3R5bGU9XCJmb250LXdlaWdodDogYm9sZFwiPlRpcHA6PC9kaXY+XHJcbiAgICAgICAgICAgIERpZSBWYXJpYWJsZW4gc2luZCBudXIgZGFubiBzaWNodGJhciwgd2VubiBkYXMgUHJvZ3JhbW1cclxuICAgICAgICAgICAgPHVsPlxyXG4gICAgICAgICAgICA8bGk+aW0gRWluemVsc2Nocml0dG1vZHVzIGF1c2dlZsO8aHJ0IHdpcmQoS2xpY2sgYXVmIDxzcGFuIGNsYXNzPVwiaW1nX3N0ZXAtb3Zlci1kYXJrIGpvX2lubGluZS1pbWFnZVwiPjwvc3Bhbj4pLDwvbGk+XHJcbiAgICAgICAgICAgIDxsaT5hbiBlaW5lbSBCcmVha3BvaW50IGjDpGx0IChTZXR6ZW4gZWluZXMgQnJlYWtwb2ludHMgbWl0IE1hdXNrbGljayBsaW5rcyBuZWJlbiBkZW4gWmVpbGVubnVtbWVybiB1bmQgYW5zY2hsaWXDn2VuZGVzIFN0YXJ0ZW4gZGVzIFByb2dyYW1tcyBtaXQgXHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaW1nX3N0YXJ0LWRhcmsgam9faW5saW5lLWltYWdlXCI+PC9zcGFuPikgb2RlciA8L2xpPlxyXG4gICAgICAgICAgICA8bGk+aW4gc2VociBuaWVkcmlnZXIgR2VzY2h3aW5kaWdrZWl0IGF1c2dlZsO8aHJ0IHdpcmQgKHdlbmlnZXIgYWxzIDEwIFNjaHJpdHRlL3MpLlxyXG4gICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICBgKTtcclxuXHJcbiAgICAgICAgJHZkLmFwcGVuZCh0aGlzLiRkZWJ1Z2dlckRpdiwgJGFsdGVybmF0aXZlVGV4dCk7XHJcblxyXG4gICAgICAgIHRoaXMuJHJ1bkRpdiA9IGpRdWVyeShcclxuICAgICAgICAgICAgYFxyXG48ZGl2IGNsYXNzPVwiam9fdGFiIGpvX2FjdGl2ZSBqb19ydW5cIj5cclxuPGRpdiBjbGFzcz1cImpvX3J1bi1wcm9ncmFtZW5kXCI+UHJvZ3JhbW0gYmVlbmRldDwvZGl2PlxyXG48ZGl2IGNsYXNzPVwiam9fcnVuLWlucHV0XCI+XHJcbiAgICA8ZGl2PlxyXG4gICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19ydW4taW5wdXQtbWVzc2FnZVwiIGNsYXNzPVwiam9fcml4XCI+Qml0dGUgZ2ViZW4gU2llIGVpbmUgWmFobCBlaW4hPC9kaXY+XHJcbiAgICAgICAgICAgIDxpbnB1dCBjbGFzcz1cImpvX3J1bi1pbnB1dC1pbnB1dFwiIHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJqb19yaXhcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX3J1bi1pbnB1dC1idXR0b24tb3V0ZXJcIiBjbGFzcz1cImpvX3JpeFwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX3J1bi1pbnB1dC1idXR0b25cIiBjbGFzcz1cImpvX3JpeFwiPk9LPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX3J1bi1pbnB1dC1lcnJvclwiIGNsYXNzPVwiam9fcml4XCI+PC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICA8L2Rpdj5cclxuPC9kaXY+IFxyXG48ZGl2IGNsYXNzPVwiam9fcnVuLWlubmVyXCI+XHJcbiAgICA8ZGl2IGNsYXNzPVwiam9fZ3JhcGhpY3NcIj48L2Rpdj5cclxuICAgIDxkaXYgY2xhc3M9XCJqb19vdXRwdXQgam9fc2Nyb2xsYWJsZVwiPjwvZGl2PlxyXG48L2Rpdj5cclxuXHJcbjwvZGl2PlxyXG5cclxuYCk7XHJcblxyXG4gICAgICAgICR0YWJzLmFwcGVuZCh0aGlzLiRydW5EaXYsICR2ZCk7XHJcbiAgICAgICAgdGhpcy4kcmlnaHREaXZJbm5lci5hcHBlbmQoJHRhYnMpO1xyXG5cclxuICAgICAgICBtYWtlVGFicygkcmlnaHREaXYpO1xyXG5cclxuICAgICAgICByZXR1cm4gJHJpZ2h0RGl2O1xyXG4gICAgfVxyXG5cclxuICAgIGdldFNlbWljb2xvbkFuZ2VsKCk6IFNlbWljb2xvbkFuZ2Vse1xyXG4gICAgICAgIHJldHVybiB0aGlzLnNlbWljb2xvbkFuZ2VsO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbiJdfQ==