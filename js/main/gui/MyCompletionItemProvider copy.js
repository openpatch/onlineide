import { Klass, getVisibilityUpTo, Interface, Visibility } from "../../compiler/types/Class.js";
import { ArrayType } from "../../compiler/types/Array.js";
export class MyCompletionItemProvider {
    constructor(main) {
        this.main = main;
        this.triggerCharacters = ['.', 'abcdefghijklmnopqrstuvwxyzäöüß_ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ', ' '];
        this.first = true;
    }
    provideCompletionItems(model, position, context, token) {
        var _a, _b, _c, _d, _e, _f, _g;
        setTimeout(() => {
            //@ts-ignore
            let sw = this.main.getMonacoEditor()._contentWidgets["editor.widget.suggestWidget"].widget;
            if (this.first) {
                sw.toggleDetails();
                this.first = false;
            }
            // sw.toggleSuggestionDetails();
            // this.main.monaco.trigger('keyboard', 'editor.action.toggleSuggestionDetails', {});
            // this.main.monaco.trigger('keyboard', 'editor.action.triggerSuggest', {});
            // this.main.monaco.trigger(monaco.KeyMod.CtrlCmd + monaco.KeyCode.Space, 'type', {});
        }, 300);
        let consoleModel = (_c = (_b = (_a = this.main.getBottomDiv()) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.editor) === null || _c === void 0 ? void 0 : _c.getModel();
        this.isConsole = model == consoleModel;
        let isMainWindow = model == this.main.getMonacoEditor().getModel();
        if (!(this.isConsole || isMainWindow))
            return;
        let module = this.isConsole ? (_e = (_d = this.main.getBottomDiv()) === null || _d === void 0 ? void 0 : _d.console) === null || _e === void 0 ? void 0 : _e.compiler.module :
            this.main.getCurrentWorkspace().getModuleByMonacoModel(model);
        if (module == null) {
            return null;
        }
        let textUntilPosition = model.getValueInRange({ startLineNumber: 1, startColumn: 1, endLineNumber: position.lineNumber, endColumn: position.column });
        let textAfterPosition = model.getValueInRange({ startLineNumber: position.lineNumber, startColumn: position.column, endLineNumber: position.lineNumber + 5, endColumn: 1 });
        if (context.triggerCharacter == " ") {
            let newMatch = textUntilPosition.match(/.*(new )$/);
            if (newMatch != null) {
                return this.getCompletionItemsAfterNew(module);
            }
            let classMatch = textUntilPosition.match(/.*(class )[\wöäüÖÄÜß<> ,]*[\wöäüÖÄÜß<> ] $/);
            if (classMatch != null) {
                let classIndex = textUntilPosition.lastIndexOf('class');
                let countLower = 0;
                let countGreater = 0;
                for (let i = classIndex; i < textUntilPosition.length; i++) {
                    let c = textUntilPosition.charAt(i);
                    switch (c) {
                        case '<':
                            countLower++;
                            break;
                        case '>':
                            countGreater++;
                            break;
                    }
                }
                return this.getCompletionItemsAfterClass(module, countLower > countGreater);
            }
            return null;
        }
        let ibMatch = textAfterPosition.match(/^([\wöäüÖÄÜß]*\(?)/);
        let identifierAndBracketAfterCursor = "";
        if (ibMatch != null && ibMatch.length > 0) {
            identifierAndBracketAfterCursor = ibMatch[0];
        }
        let leftBracketAlreadyThere = identifierAndBracketAfterCursor.endsWith("(");
        // First guess:  dot followed by part of Identifier?
        let dotMatch = textUntilPosition.match(/.*(\.)([\wöäüÖÄÜß]*)$/);
        if (dotMatch != null) {
            if (this.isConsole) {
                (_g = (_f = this.main.getBottomDiv()) === null || _f === void 0 ? void 0 : _f.console) === null || _g === void 0 ? void 0 : _g.compileIfDirty();
            }
            else {
                this.main.compileIfDirty();
            }
        }
        let symbolTable = this.isConsole ? this.main.getDebugger().lastSymboltable : module.findSymbolTableAtPosition(position.lineNumber, position.column);
        let classContext = symbolTable == null ? null : symbolTable.classContext;
        if (dotMatch != null) {
            return this.getCompletionItemsAfterDot(dotMatch, position, module, identifierAndBracketAfterCursor, classContext, leftBracketAlreadyThere);
        }
        let varOrClassMatch = textUntilPosition.match(/.*[^\wöäüÖÄÜß]([\wöäüÖÄÜß]*)$/);
        if (varOrClassMatch == null) {
            varOrClassMatch = textUntilPosition.match(/^([\wöäüÖÄÜß]*)$/);
        }
        if (varOrClassMatch != null) {
            return this.getCompletionItemsInsideIdentifier(varOrClassMatch, position, module, identifierAndBracketAfterCursor, classContext, leftBracketAlreadyThere, symbolTable);
        }
    }
    getCompletionItemsAfterNew(module) {
        let completionItems = [];
        completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, undefined));
        for (let i = 0; i < completionItems.length; i++) {
            let item = completionItems[i];
            if (item.detail.match('Primitiv')) {
                completionItems.splice(i, 1);
                i--;
                continue;
            }
            if (item["generic"]) {
                item.insertText += "<>($0)";
            }
            else {
                item.insertText += "($0)";
            }
            item.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            item.command = {
                id: "editor.action.triggerParameterHints",
                title: '123',
                arguments: []
            };
        }
        return Promise.resolve({
            suggestions: completionItems
        });
    }
    getCompletionItemsAfterClass(module, insideGenericParameterDefinition) {
        let completionItems = [];
        completionItems = completionItems.concat([
            {
                label: "extends",
                insertText: "extends $1" + (insideGenericParameterDefinition ? "" : " {\n\t$0\n}"),
                detail: "extends-Operator",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined,
                command: {
                    id: "editor.action.triggerSuggest",
                    title: '123',
                    arguments: []
                }
            },
            {
                label: "implements",
                insertText: "implements $1" + (insideGenericParameterDefinition ? "" : " {\n\t$0\n}"),
                detail: "implements-Operator",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined,
                command: {
                    id: "editor.action.triggerSuggest",
                    title: '123',
                    arguments: []
                }
            },
            {
                label: "{}",
                insertText: "{\n\t$0\n}",
                detail: "Klassenrumpf",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined
            },
        ]);
        // completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, undefined));
        return Promise.resolve({
            suggestions: completionItems
        });
    }
    getCompletionItemsInsideIdentifier(varOrClassMatch, position, module, identifierAndBracketAfterCursor, classContext, leftBracketAlreadyThere, symbolTable) {
        let text = varOrClassMatch[1];
        let rangeToReplace = {
            startLineNumber: position.lineNumber, startColumn: position.column - text.length,
            endLineNumber: position.lineNumber, endColumn: position.column + identifierAndBracketAfterCursor.length
        };
        let completionItems = [];
        if ((symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.classContext) != null && (symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.method) == null && symbolTable.classContext instanceof Klass) {
            completionItems = completionItems.concat(this.getOverridableMethodsCompletion(symbolTable.classContext));
        }
        if (symbolTable != null) {
            completionItems = completionItems.concat(symbolTable.getLocalVariableCompletionItems(rangeToReplace));
        }
        completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, rangeToReplace));
        if (classContext != null && (symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.method) != null) {
            completionItems = completionItems.concat(classContext.getCompletionItems(Visibility.private, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace));
        }
        completionItems = completionItems.concat(this.getKeywordCompletion(symbolTable));
        // console.log("Complete variable/Class/Keyword " + text);
        return Promise.resolve({
            suggestions: completionItems
        });
    }
    getCompletionItemsAfterDot(dotMatch, position, module, identifierAndBracketAfterCursor, classContext, leftBracketAlreadyThere) {
        let textAfterDot = dotMatch[2];
        let dotColumn = position.column - textAfterDot.length - 1;
        let tStatic = module.getTypeAtPosition(position.lineNumber, dotColumn);
        let rangeToReplace = {
            startLineNumber: position.lineNumber, startColumn: position.column - textAfterDot.length,
            endLineNumber: position.lineNumber, endColumn: position.column + identifierAndBracketAfterCursor.length
        };
        if (tStatic == null)
            return null;
        let { type, isStatic } = tStatic;
        // console.log("Complete element.praefix; praefix: " + textAfterDot + ", Type: " + (type == null ? null : type.identifier));
        if (type instanceof Klass) {
            let visibilityUpTo = getVisibilityUpTo(type, classContext);
            if (isStatic) {
                return Promise.resolve({
                    suggestions: type.staticClass.getCompletionItems(visibilityUpTo, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace)
                });
            }
            else {
                return Promise.resolve({
                    suggestions: type.getCompletionItems(visibilityUpTo, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace)
                });
            }
        }
        if (type instanceof Interface) {
            return Promise.resolve({
                suggestions: type.getCompletionItems(leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace)
            });
        }
        if (type instanceof ArrayType) {
            return Promise.resolve({
                suggestions: [
                    {
                        label: "length",
                        filterText: "length",
                        kind: monaco.languages.CompletionItemKind.Field,
                        insertText: "length",
                        range: rangeToReplace,
                        documentation: {
                            value: "Anzahl der Elemente des Arrays"
                        }
                    }
                ]
            });
        }
        return null;
    }
    getKeywordCompletion(symbolTable) {
        let keywordCompletionItems = [];
        if (!this.isConsole && ((symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.classContext) == null || (symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.method) != null))
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "while(Bedingung){Anweisungen}",
                    detail: "while-Wiederholung",
                    filterText: 'while',
                    insertText: "while(${1:Bedingung}){\n\t$0\n}",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "for(){}",
                    insertText: "for(${1:Startanweisung};${2:Solange-Bedingung};${3:Nach_jeder_Wiederholung}){\n\t${0:Anweisungen}\n}",
                    detail: "for-Wiederholung",
                    filterText: 'for',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "if(){}",
                    insertText: "if(${1:Bedingung}){\n\t${0:Anweisungen}\n}",
                    detail: "Bedingung",
                    filterText: 'if',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "if(){} else {}",
                    insertText: "if(${1:Bedingung}){\n\t${2:Anweisungen}\n}\nelse {\n\t${0:Anweisungen}\n}",
                    detail: "Zweiseitige Bedingung",
                    filterText: 'if',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                }
            ]);
        if ((symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.classContext) == null || (symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.method) != null) {
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "instanceof",
                    insertText: "instanceof $0",
                    detail: "instanceof-Operator",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "print",
                    insertText: "print($0);",
                    detail: "Ausgabe (ggf. mit Farbe \nals zweitem Parameter)",
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "println",
                    insertText: "println($0);",
                    detail: "Ausgabe mit Zeilenumbruch (ggf. mit \nFarbe als zweitem Parameter)",
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
            ]);
        }
        if (!this.isConsole && (symbolTable == null || symbolTable.classContext == null)) {
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "class",
                    filterText: "class",
                    insertText: "class ${1:Bezeichner} {\n\t$0\n}\n",
                    detail: "Klassendefinition",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "public class",
                    filterText: "public class",
                    insertText: "public class ${1:Bezeichner} {\n\t$0\n}\n",
                    detail: "Öffentliche Klassendefinition",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                }
            ]);
        }
        else if (!this.isConsole && (symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.method) == null) {
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "public",
                    filterText: "public",
                    insertText: "public ",
                    detail: "Schlüsselwort public",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "public void method(){}",
                    filterText: "public",
                    insertText: "public ${1:void} ${2:Bezeichner}(${3:Parameter}) {\n\t$0\n}\n",
                    detail: "Methodendefinition",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "protected",
                    filterText: "protected",
                    insertText: "protected ",
                    detail: "Schlüsselwort protected",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "private",
                    filterText: "private",
                    insertText: "private ",
                    detail: "Schlüsselwort private",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                }
            ]);
        }
        if (symbolTable != null && symbolTable.method != null) {
            keywordCompletionItems = keywordCompletionItems.concat([
                {
                    label: "return",
                    filterText: "return",
                    insertText: "return",
                    detail: "Schlüsselwort return",
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                }
            ]);
        }
        return keywordCompletionItems;
    }
    getOverridableMethodsCompletion(classContext) {
        let keywordCompletionItems = [];
        let methods = [];
        let c = classContext.baseClass;
        while (c != null) {
            methods = methods.concat(c.methods.filter((m) => {
                if (m.isAbstract || (m.program == null && m.invoke == null)) {
                    return true;
                }
                return false;
            }));
            c = c.baseClass;
        }
        for (let i of classContext.implements) {
            methods = methods.concat(i.getMethods());
        }
        for (let m of methods) {
            let alreadyImplemented = false;
            for (let m1 of classContext.methods) {
                if (m1.signature == m.signature) {
                    alreadyImplemented = true;
                    break;
                }
            }
            if (alreadyImplemented)
                continue;
            let label = (m.isAbstract ? "implement " : "override ") + m.getCompletionLabel();
            let filterText = m.identifier;
            let insertText = Visibility[m.visibility] + " " + (m.getReturnType() == null ? "void" : m.getReturnType().identifier) + " ";
            insertText += m.identifier + "(";
            for (let i = 0; i < m.getParameterList().parameters.length; i++) {
                let p = m.getParameterList().parameters[i];
                insertText += m.getParameterType(i).identifier + " " + p.identifier;
                if (i < m.getParameterCount() - 1) {
                    insertText += ", ";
                }
            }
            insertText += ") {\n\t$0\n}";
            keywordCompletionItems.push({
                label: label,
                detail: (m.isAbstract ? "Implementiere " : "Überschreibe ") + "die Methode " + label + " der Basisklasse.",
                filterText: filterText,
                insertText: insertText,
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined
            });
        }
        return keywordCompletionItems;
    }
}
//# sourceMappingURL=MyCompletionItemProvider copy.js.map