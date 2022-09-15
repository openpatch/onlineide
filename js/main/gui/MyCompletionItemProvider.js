import { Klass, getVisibilityUpTo, Interface, Visibility } from "../../compiler/types/Class.js";
import { ArrayType } from "../../compiler/types/Array.js";
import { TokenType } from "../../compiler/lexer/Token.js";
export class MyCompletionItemProvider {
    constructor(main) {
        this.main = main;
        this.triggerCharacters = ['.', 'abcdefghijklmnopqrstuvwxyzäöüß_ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ', ' '];
        this.first = true;
    }
    provideCompletionItems(model, position, context, token) {
        var _a, _b, _c, _d, _e, _f, _g;
        setTimeout(() => {
            var _a;
            //@ts-ignore
            let sw = (_a = this.main.getMonacoEditor()._contentWidgets["editor.widget.suggestWidget"]) === null || _a === void 0 ? void 0 : _a.widget;
            if (sw != null && sw._widget != null && this.first) {
                sw._widget.toggleDetails();
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
        if (this.isStringLiteral(module, position))
            return null;
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
                return this.getCompletionItemsAfterClass(module, countLower > countGreater, textAfterPosition);
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
    isStringLiteral(module, position) {
        let tokenList = module.tokenList;
        if (tokenList == null || tokenList.length == 0)
            return false;
        let posMin = 0;
        let posMax = tokenList.length - 1;
        let pos;
        let watchDog = 1000;
        while (true) {
            let posOld = pos;
            pos = Math.round((posMax + posMin) / 2);
            if (posOld == pos)
                return false;
            watchDog--;
            if (watchDog == 0)
                return false;
            let t = tokenList[pos];
            let p = t.position;
            if (p.line < position.lineNumber || p.line == position.lineNumber && p.column + p.length < position.column) {
                posMin = pos;
                continue;
            }
            if (p.line > position.lineNumber || p.line == position.lineNumber && p.column > position.column) {
                posMax = pos;
                continue;
            }
            return t.tt == TokenType.stringConstant;
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
    getCompletionItemsAfterClass(module, insideGenericParameterDefinition, textAfterPosition) {
        let completionItems = [];
        let startsWithCurlyBrace = textAfterPosition.trimLeft().startsWith("{");
        completionItems = completionItems.concat([
            {
                label: "extends",
                insertText: "extends $1" + (insideGenericParameterDefinition || startsWithCurlyBrace ? "" : " {\n\t$0\n}"),
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
                insertText: "implements $1" + (insideGenericParameterDefinition || startsWithCurlyBrace ? "" : " {\n\t$0\n}"),
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
        var _a;
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
            completionItems = completionItems.concat(symbolTable.getLocalVariableCompletionItems(rangeToReplace).map(ci => {
                ci.sortText = "aaa" + ci.label;
                return ci;
            }));
        }
        completionItems = completionItems.concat(this.main.getCurrentWorkspace().moduleStore.getTypeCompletionItems(module, rangeToReplace));
        if (classContext != null && (symbolTable === null || symbolTable === void 0 ? void 0 : symbolTable.method) != null) {
            completionItems = completionItems.concat(classContext.getCompletionItems(Visibility.private, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace, symbolTable.method)
                .map(ci => {
                ci.sortText = "aa" + ci.label;
                return ci;
            }));
            completionItems.push({
                label: "super",
                filterText: "super",
                insertText: "super.",
                detail: "Aufruf einer Methode einer Basisklasse",
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                kind: monaco.languages.CompletionItemKind.Snippet,
                range: undefined,
                command: {
                    id: "editor.action.triggerSuggest",
                    title: '123',
                    arguments: []
                }
            });
        }
        else {
            // Use filename to generate completion-item for class ... ?
            let name = (_a = module.file) === null || _a === void 0 ? void 0 : _a.name;
            if (name != null) {
                if (name.endsWith(".java"))
                    name = name.substr(0, name.indexOf(".java"));
                let m = name.match(/([\wöäüÖÄÜß]*)$/);
                if (module.classDefinitionsAST.length == 0 && m != null && m.length > 0 && m[0] == name && name.length > 0) {
                    name = name.charAt(0).toUpperCase() + name.substring(1);
                    completionItems.push({
                        label: "class " + name,
                        filterText: "class",
                        insertText: "class ${1:" + name + "} {\n\t$0\n}\n",
                        detail: "Definition der Klasse " + name,
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        range: undefined
                    });
                }
            }
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
                    suggestions: type.getCompletionItems(visibilityUpTo, leftBracketAlreadyThere, identifierAndBracketAfterCursor, rangeToReplace, null)
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
                    // insertText: "while(${1:Bedingung}){\n\t$0\n}",
                    insertText: "while($1){\n\t$0\n}",
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
                    label: "for(){}",
                    // insertText: "for(${1:Startanweisung};${2:Solange-Bedingung};${3:Nach_jeder_Wiederholung}){\n\t${0:Anweisungen}\n}",
                    insertText: "for( $1 ; $2 ; $3 ){\n\t$0\n}",
                    detail: "for-Wiederholung",
                    filterText: 'for',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },    
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "for(int i = 0; i < 10; i++){}",
                    // insertText: "for(${1:Startanweisung};${2:Solange-Bedingung};${3:Nach_jeder_Wiederholung}){\n\t${0:Anweisungen}\n}",
                    insertText: "for(int ${1:i} = 0; ${1:i} < ${2:10}; ${1:i}++){\n\t$0\n}",
                    detail: "Zähl-Wiederholung",
                    filterText: 'for',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },    
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "switch(){case...}",
                    // insertText: "switch(${1:Selektor}){\n\tcase ${2:Wert_1}: {\n\t\t ${3:Anweisungen}\n\t\t}\n\tcase ${4:Wert_2}: {\n\t\t ${0:Anweisungen}\n\t\t}\n}",
                    insertText: "switch($1){\n\tcase $2:\n\t\t $3\n\t\tbreak;\n\tcase $4:\n\t\t $5\n\t\tbreak;\n\tdefault:\n\t\t $0\n}",
                    detail: "switch-Anweisung",
                    filterText: 'switch',
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
                    label: "if(){}",
                    // insertText: "if(${1:Bedingung}){\n\t${0:Anweisungen}\n}",
                    insertText: "if($1){\n\t$0\n}",
                    detail: "Bedingung",
                    filterText: 'if',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "if(){} else {}",
                    insertText: "if($1){\n\t$2\n}\nelse {\n\t$0\n}",
                    detail: "Zweiseitige Bedingung",
                    filterText: 'if',
                    // command: {
                    //     id: "editor.action.triggerParameterHints",
                    //     title: '123',
                    //     arguments: []
                    // },
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
                {
                    label: "else {}",
                    insertText: "else {\n\t$0\n}",
                    detail: "else-Zweig",
                    filterText: 'el',
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                    kind: monaco.languages.CompletionItemKind.Snippet,
                    range: undefined
                },
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
                    insertText: "print($1);$0",
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
                    insertText: "println($1);$0",
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
                    label: "static",
                    filterText: "static",
                    insertText: "static ",
                    detail: "Schlüsselwort static",
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
                if (m.isAbstract || (m.program == null && m.invoke == null) || m.identifier.startsWith('onMouse') || m.identifier.startsWith('onKey')) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlDb21wbGV0aW9uSXRlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9NeUNvbXBsZXRpb25JdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFlLE1BQU0sK0JBQStCLENBQUM7QUFJN0csT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBRTFELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUxRCxNQUFNLE9BQU8sd0JBQXdCO0lBTWpDLFlBQW9CLElBQWM7UUFBZCxTQUFJLEdBQUosSUFBSSxDQUFVO1FBRjNCLHNCQUFpQixHQUFhLENBQUMsR0FBRyxFQUFFLDhEQUE4RCxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBS2hILFVBQUssR0FBWSxJQUFJLENBQUM7SUFGdEIsQ0FBQztJQUdELHNCQUFzQixDQUFDLEtBQStCLEVBQUUsUUFBeUIsRUFBRSxPQUEyQyxFQUFFLEtBQStCOztRQUUzSixVQUFVLENBQUMsR0FBRyxFQUFFOztZQUNaLFlBQVk7WUFDWixJQUFJLEVBQUUsU0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLGVBQWUsQ0FBQyw2QkFBNkIsQ0FBQywwQ0FBRSxNQUFNLENBQUM7WUFDNUYsSUFBSSxFQUFFLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQyxPQUFPLElBQUksSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7Z0JBQ2hELEVBQUUsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQzNCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ3RCO1lBQ0QsZ0NBQWdDO1lBQ2hDLHFGQUFxRjtZQUNyRiw0RUFBNEU7WUFDNUUsc0ZBQXNGO1FBQzFGLENBQUMs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QTRCLENBQUMsZUFBZTtnQkFDOUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsa0JBQWtCLENBQUMsT0FBTztnQkFDakQsS0FBSyxFQUFFLFNBQVM7YUFDbkIsQ0FDSixDQUFDO1NBRUw7UUFFRCxPQUFPLHNCQUFzQixDQUFDO0lBRWxDLENBQUM7Q0FFSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEVkaXRvciB9IGZyb20gXCIuL0VkaXRvci5qc1wiO1xyXG5pbXBvcnQgeyBNb2R1bGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBLbGFzcywgZ2V0VmlzaWJpbGl0eVVwVG8sIEludGVyZmFjZSwgVmlzaWJpbGl0eSwgU3RhdGljQ2xhc3MgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvQ2xhc3MuanNcIjtcclxuaW1wb3J0IHsgU3ltYm9sVGFibGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvcGFyc2VyL1N5bWJvbFRhYmxlLmpzXCI7XHJcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBNZXRob2QgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgQXJyYXlUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0FycmF5LmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL01haW5CYXNlLmpzXCI7XHJcbmltcG9ydCB7IFRva2VuVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE15Q29tcGxldGlvbkl0ZW1Qcm92aWRlciBpbXBsZW1lbnRzIG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1Qcm92aWRlciB7XHJcblxyXG4gICAgaXNDb25zb2xlOiBib29sZWFuO1xyXG5cclxuICAgIHB1YmxpYyB0cmlnZ2VyQ2hhcmFjdGVyczogc3RyaW5nW10gPSBbJy4nLCAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXrDpMO2w7zDn19BQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWsOEw5bDnCcsICcgJ107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBtYWluOiBNYWluQmFzZSkge1xyXG4gICAgfVxyXG5cclxuICAgIGZpcnN0OiBib29sZWFuID0gdHJ1ZTtcclxuICAgIHByb3ZpZGVDb21wbGV0aW9uSXRlbXMobW9kZWw6IG1vbmFjby5lZGl0b3IuSVRleHRNb2RlbCwgcG9zaXRpb246IG1vbmFjby5Qb3NpdGlvbiwgY29udGV4dDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uQ29udGV4dCwgdG9rZW46IG1vbmFjby5DYW5jZWxsYXRpb25Ub2tlbik6IG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uTGlzdD4ge1xyXG5cclxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgLy9AdHMtaWdub3JlXHJcbiAgICAgICAgICAgIGxldCBzdyA9IHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKS5fY29udGVudFdpZGdldHNbXCJlZGl0b3Iud2lkZ2V0LnN1Z2dlc3RXaWRnZXRcIl0/LndpZGdldDtcclxuICAgICAgICAgICAgaWYgKHN3ICE9IG51bGwgJiYgc3cuX3dpZGdldCAhPSBudWxsICYmIHRoaXMuZmlyc3QpIHtcclxuICAgICAgICAgICAgICAgIHN3Ll93aWRnZXQudG9nZ2xlRGV0YWlscygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5maXJzdCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIHN3LnRvZ2dsZVN1Z2dlc3Rpb25EZXRhaWxzKCk7XHJcbiAgICAgICAgICAgIC8vIHRoaXMubWFpbi5tb25hY28udHJpZ2dlcigna2V5Ym9hcmQnLCAnZWRpdG9yLmFjdGlvbi50b2dnbGVTdWdnZXN0aW9uRGV0YWlscycsIHt9KTtcclxuICAgICAgICAgICAgLy8gdGhpcy5tYWluLm1vbmFjby50cmlnZ2VyKCdrZXlib2FyZCcsICdlZGl0b3IuYWN0aW9uLnRyaWdnZXJTdWdnZXN0Jywge30pO1xyXG4gICAgICAgICAgICAvLyB0aGlzLm1haW4ubW9uYWNvLnRyaWdnZXIobW9uYWNvLktleU1vZC5DdHJsQ21kICsgbW9uYWNvLktleUNvZGUuU3BhY2UsICd0eXBlJywge30pO1xyXG4gICAgICAgIH0sIDMwMCk7XHJcblxyXG4gICAgICAgIGxldCBjb25zb2xlTW9kZWwgPSB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LmVkaXRvcj8uZ2V0TW9kZWwoKTtcclxuICAgICAgICB0aGlzLmlzQ29uc29sZSA9IG1vZGVsID09IGNvbnNvbGVNb2RlbDtcclxuXHJcbiAgICAgICAgbGV0IGlzTWFpbldpbmRvdyA9IG1vZGVsID09IHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKS5nZXRNb2RlbCgpO1xyXG5cclxuICAgICAgICBpZiAoISh0aGlzLmlzQ29uc29sZSB8fCBpc01haW5XaW5kb3cpKSByZXR1cm47XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGU6IE1vZHVsZSA9IHRoaXMuaXNDb25zb2xlID8gdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlPy5jb21waWxlci5tb2R1bGUgOlxyXG4gICAgICAgICAgICB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLmdldE1vZHVsZUJ5TW9uYWNvTW9kZWwobW9kZWwpO1xyXG5cclxuICAgICAgICBpZiAobW9kdWxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5pc1N0cmluZ0xpdGVyYWwobW9kdWxlLCBwb3NpdGlvbikpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgdGV4dFVudGlsUG9zaXRpb24gPSBtb2RlbC5nZXRWYWx1ZUluUmFuZ2UoeyBzdGFydExpbmVOdW1iZXI6IDEsIHN0YXJ0Q29sdW1uOiAxLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLCBlbmRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbiB9KTtcclxuICAgICAgICBsZXQgdGV4dEFmdGVyUG9zaXRpb24gPSBtb2RlbC5nZXRWYWx1ZUluUmFuZ2UoeyBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVOdW1iZXIsIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVOdW1iZXIgKyA1LCBlbmRDb2x1bW46IDEgfSk7XHJcblxyXG4gICAgICAgIGlmIChjb250ZXh0LnRyaWdnZXJDaGFyYWN0ZXIgPT0gXCIgXCIpIHtcclxuICAgICAgICAgICAgbGV0IG5ld01hdGNoID0gdGV4dFVudGlsUG9zaXRpb24ubWF0Y2goLy4qKG5ldyApJC8pO1xyXG4gICAgICAgICAgICBpZiAobmV3TWF0Y2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcGxldGlvbkl0ZW1zQWZ0ZXJOZXcobW9kdWxlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBsZXQgY2xhc3NNYXRjaCA9IHRleHRVbnRpbFBvc2l0aW9uLm1hdGNoKC8uKihjbGFzcyApW1xcd8O2w6TDvMOWw4TDnMOfPD4gLF0qW1xcd8O2w6TDvMOWw4TDnMOfPD4gXSAkLyk7XHJcbiAgICAgICAgICAgIGlmIChjbGFzc01hdGNoICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgY2xhc3NJbmRleCA9IHRleHRVbnRpbFBvc2l0aW9uLmxhc3RJbmRleE9mKCdjbGFzcycpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvdW50TG93ZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgbGV0IGNvdW50R3JlYXRlciA9IDA7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gY2xhc3NJbmRleDsgaSA8IHRleHRVbnRpbFBvc2l0aW9uLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGMgPSB0ZXh0VW50aWxQb3NpdGlvbi5jaGFyQXQoaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc3dpdGNoIChjKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJzwnOiBjb3VudExvd2VyKys7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICc+JzogY291bnRHcmVhdGVyKys7IGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wbGV0aW9uSXRlbXNBZnRlckNsYXNzKG1vZHVsZSwgY291bnRMb3dlciA+IGNvdW50R3JlYXRlciwgdGV4dEFmdGVyUG9zaXRpb24pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGliTWF0Y2ggPSB0ZXh0QWZ0ZXJQb3NpdGlvbi5tYXRjaCgvXihbXFx3w7bDpMO8w5bDhMOcw59dKlxcKD8pLyk7XHJcbiAgICAgICAgbGV0IGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IgPSBcIlwiO1xyXG4gICAgICAgIGlmIChpYk1hdGNoICE9IG51bGwgJiYgaWJNYXRjaC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IgPSBpYk1hdGNoWzBdO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlID0gaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvci5lbmRzV2l0aChcIihcIik7XHJcblxyXG4gICAgICAgIC8vIEZpcnN0IGd1ZXNzOiAgZG90IGZvbGxvd2VkIGJ5IHBhcnQgb2YgSWRlbnRpZmllcj9cclxuICAgICAgICBsZXQgZG90TWF0Y2ggPSB0ZXh0VW50aWxQb3NpdGlvbi5tYXRjaCgvLiooXFwuKShbXFx3w7bDpMO8w5bDhMOcw59dKikkLyk7XHJcbiAgICAgICAgaWYgKGRvdE1hdGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMuaXNDb25zb2xlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4uZ2V0Qm90dG9tRGl2KCk/LmNvbnNvbGU/LmNvbXBpbGVJZkRpcnR5KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4uY29tcGlsZUlmRGlydHkoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHN5bWJvbFRhYmxlID0gdGhpcy5pc0NvbnNvbGUgPyB0aGlzLm1haW4uZ2V0RGVidWdnZXIoKS5sYXN0U3ltYm9sdGFibGUgOiBtb2R1bGUuZmluZFN5bWJvbFRhYmxlQXRQb3NpdGlvbihwb3NpdGlvbi5saW5lTnVtYmVyLCBwb3NpdGlvbi5jb2x1bW4pO1xyXG4gICAgICAgIGxldCBjbGFzc0NvbnRleHQgPSBzeW1ib2xUYWJsZSA9PSBudWxsID8gbnVsbCA6IHN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dDtcclxuXHJcblxyXG4gICAgICAgIGlmIChkb3RNYXRjaCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbXBsZXRpb25JdGVtc0FmdGVyRG90KGRvdE1hdGNoLCBwb3NpdGlvbiwgbW9kdWxlLFxyXG4gICAgICAgICAgICAgICAgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvciwgY2xhc3NDb250ZXh0LCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdmFyT3JDbGFzc01hdGNoID0gdGV4dFVudGlsUG9zaXRpb24ubWF0Y2goLy4qW15cXHfDtsOkw7zDlsOEw5zDn10oW1xcd8O2w6TDvMOWw4TDnMOfXSopJC8pO1xyXG5cclxuICAgICAgICBpZiAodmFyT3JDbGFzc01hdGNoID09IG51bGwpIHtcclxuICAgICAgICAgICAgdmFyT3JDbGFzc01hdGNoID0gdGV4dFVudGlsUG9zaXRpb24ubWF0Y2goL14oW1xcd8O2w6TDvMOWw4TDnMOfXSopJC8pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHZhck9yQ2xhc3NNYXRjaCAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wbGV0aW9uSXRlbXNJbnNpZGVJZGVudGlmaWVyKHZhck9yQ2xhc3NNYXRjaCwgcG9zaXRpb24sIG1vZHVsZSxcclxuICAgICAgICAgICAgICAgIGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IsIGNsYXNzQ29udGV4dCwgbGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUsIHN5bWJvbFRhYmxlKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgaXNTdHJpbmdMaXRlcmFsKG1vZHVsZTogTW9kdWxlLCBwb3NpdGlvbjogbW9uYWNvLlBvc2l0aW9uKSB7XHJcblxyXG4gICAgICAgIGxldCB0b2tlbkxpc3QgPSBtb2R1bGUudG9rZW5MaXN0O1xyXG4gICAgICAgIGlmICh0b2tlbkxpc3QgPT0gbnVsbCB8fCB0b2tlbkxpc3QubGVuZ3RoID09IDApIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgbGV0IHBvc01pbiA9IDA7XHJcbiAgICAgICAgbGV0IHBvc01heCA9IHRva2VuTGlzdC5sZW5ndGggLSAxO1xyXG4gICAgICAgIGxldCBwb3M6IG51bWJlcjtcclxuXHJcbiAgICAgICAgbGV0IHdhdGNoRG9nID0gMTAwMDtcclxuXHJcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcclxuICAgICAgICAgICAgbGV0IHBvc09sZCA9IHBvcztcclxuICAgICAgICAgICAgcG9zID0gTWF0aC5yb3VuZCgocG9zTWF4ICsgcG9zTWluKSAvIDIpO1xyXG5cclxuICAgICAgICAgICAgaWYgKHBvc09sZCA9PSBwb3MpIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICAgICAgICAgIHdhdGNoRG9nLS07XHJcbiAgICAgICAgICAgIGlmICh3YXRjaERvZyA9PSAwKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICBsZXQgdCA9IHRva2VuTGlzdFtwb3NdO1xyXG4gICAgICAgICAgICBsZXQgcCA9IHQucG9zaXRpb247XHJcblxyXG4gICAgICAgICAgICBpZiAocC5saW5lIDwgcG9zaXRpb24ubGluZU51bWJlciB8fCBwLmxpbmUgPT0gcG9zaXRpb24ubGluZU51bWJlciAmJiBwLmNvbHVtbiArIHAubGVuZ3RoIDwgcG9zaXRpb24uY29sdW1uKSB7XHJcbiAgICAgICAgICAgICAgICBwb3NNaW4gPSBwb3M7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHAubGluZSA+IHBvc2l0aW9uLmxpbmVOdW1iZXIgfHwgcC5saW5lID09IHBvc2l0aW9uLmxpbmVOdW1iZXIgJiYgcC5jb2x1bW4gPiBwb3NpdGlvbi5jb2x1bW4pIHtcclxuICAgICAgICAgICAgICAgIHBvc01heCA9IHBvcztcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdC50dCA9PSBUb2tlblR5cGUuc3RyaW5nQ29uc3RhbnQ7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29tcGxldGlvbkl0ZW1zQWZ0ZXJOZXcobW9kdWxlOiBNb2R1bGUpOiBtb25hY28ubGFuZ3VhZ2VzLlByb3ZpZGVyUmVzdWx0PG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkxpc3Q+IHtcclxuICAgICAgICBsZXQgY29tcGxldGlvbkl0ZW1zOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdCh0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLm1vZHVsZVN0b3JlLmdldFR5cGVDb21wbGV0aW9uSXRlbXMobW9kdWxlLCB1bmRlZmluZWQpKTtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wbGV0aW9uSXRlbXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGl0ZW0gPSBjb21wbGV0aW9uSXRlbXNbaV07XHJcbiAgICAgICAgICAgIGlmIChpdGVtLmRldGFpbC5tYXRjaCgnUHJpbWl0aXYnKSkge1xyXG4gICAgICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zLnNwbGljZShpLCAxKTtcclxuICAgICAgICAgICAgICAgIGktLTtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChpdGVtW1wiZ2VuZXJpY1wiXSkge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5pbnNlcnRUZXh0ICs9IFwiPD4oJDApXCI7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBpdGVtLmluc2VydFRleHQgKz0gXCIoJDApXCI7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaXRlbS5pbnNlcnRUZXh0UnVsZXMgPSBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0O1xyXG4gICAgICAgICAgICBpdGVtLmNvbW1hbmQgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgdGl0bGU6ICcxMjMnLFxyXG4gICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICBzdWdnZXN0aW9uczogY29tcGxldGlvbkl0ZW1zXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29tcGxldGlvbkl0ZW1zQWZ0ZXJDbGFzcyhtb2R1bGU6IE1vZHVsZSwgaW5zaWRlR2VuZXJpY1BhcmFtZXRlckRlZmluaXRpb246IGJvb2xlYW4sIHRleHRBZnRlclBvc2l0aW9uOiBzdHJpbmcpOiBtb25hY28ubGFuZ3VhZ2VzLlByb3ZpZGVyUmVzdWx0PG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkxpc3Q+IHtcclxuICAgICAgICBsZXQgY29tcGxldGlvbkl0ZW1zOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgbGV0IHN0YXJ0c1dpdGhDdXJseUJyYWNlOiBib29sZWFuID0gdGV4dEFmdGVyUG9zaXRpb24udHJpbUxlZnQoKS5zdGFydHNXaXRoKFwie1wiKTtcclxuXHJcbiAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdChbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBcImV4dGVuZHNcIixcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwiZXh0ZW5kcyAkMVwiICsgKGluc2lkZUdlbmVyaWNQYXJhbWV0ZXJEZWZpbml0aW9uIHx8IHN0YXJ0c1dpdGhDdXJseUJyYWNlID8gXCJcIiA6IFwiIHtcXG5cXHQkMFxcbn1cIiksXHJcbiAgICAgICAgICAgICAgICBkZXRhaWw6IFwiZXh0ZW5kcy1PcGVyYXRvclwiLFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyU3VnZ2VzdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBcImltcGxlbWVudHNcIixcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwiaW1wbGVtZW50cyAkMVwiICsgKGluc2lkZUdlbmVyaWNQYXJhbWV0ZXJEZWZpbml0aW9uIHx8IHN0YXJ0c1dpdGhDdXJseUJyYWNlID8gXCJcIiA6IFwiIHtcXG5cXHQkMFxcbn1cIiksXHJcbiAgICAgICAgICAgICAgICBkZXRhaWw6IFwiaW1wbGVtZW50cy1PcGVyYXRvclwiLFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyU3VnZ2VzdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGxhYmVsOiBcInt9XCIsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcIntcXG5cXHQkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgIGRldGFpbDogXCJLbGFzc2VucnVtcGZcIixcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXSk7XHJcblxyXG4gICAgICAgIC8vIGNvbXBsZXRpb25JdGVtcyA9IGNvbXBsZXRpb25JdGVtcy5jb25jYXQodGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5tb2R1bGVTdG9yZS5nZXRUeXBlQ29tcGxldGlvbkl0ZW1zKG1vZHVsZSwgdW5kZWZpbmVkKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICBzdWdnZXN0aW9uczogY29tcGxldGlvbkl0ZW1zXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0Q29tcGxldGlvbkl0ZW1zSW5zaWRlSWRlbnRpZmllcih2YXJPckNsYXNzTWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXksIHBvc2l0aW9uOiBtb25hY28uUG9zaXRpb24sIG1vZHVsZTogTW9kdWxlLCBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yOiBzdHJpbmcsIGNsYXNzQ29udGV4dDogS2xhc3MgfCBTdGF0aWNDbGFzcyxcclxuICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbiwgc3ltYm9sVGFibGU6IFN5bWJvbFRhYmxlKTogbW9uYWNvLmxhbmd1YWdlcy5Qcm92aWRlclJlc3VsdDxtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25MaXN0PiB7XHJcbiAgICAgICAgbGV0IHRleHQgPSB2YXJPckNsYXNzTWF0Y2hbMV07XHJcblxyXG4gICAgICAgIGxldCByYW5nZVRvUmVwbGFjZTogbW9uYWNvLklSYW5nZSA9XHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVOdW1iZXIsIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gLSB0ZXh0Lmxlbmd0aCxcclxuICAgICAgICAgICAgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlciwgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gKyBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLmxlbmd0aFxyXG4gICAgICAgIH1cclxuXHJcblxyXG5cclxuICAgICAgICBsZXQgY29tcGxldGlvbkl0ZW1zOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKHN5bWJvbFRhYmxlPy5jbGFzc0NvbnRleHQgIT0gbnVsbCAmJiBzeW1ib2xUYWJsZT8ubWV0aG9kID09IG51bGwgJiYgc3ltYm9sVGFibGUuY2xhc3NDb250ZXh0IGluc3RhbmNlb2YgS2xhc3MpIHtcclxuICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdCh0aGlzLmdldE92ZXJyaWRhYmxlTWV0aG9kc0NvbXBsZXRpb24oc3ltYm9sVGFibGUuY2xhc3NDb250ZXh0KSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3ltYm9sVGFibGUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb21wbGV0aW9uSXRlbXMgPSBjb21wbGV0aW9uSXRlbXMuY29uY2F0KHN5bWJvbFRhYmxlLmdldExvY2FsVmFyaWFibGVDb21wbGV0aW9uSXRlbXMocmFuZ2VUb1JlcGxhY2UpLm1hcChjaSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjaS5zb3J0VGV4dCA9IFwiYWFhXCIgKyBjaS5sYWJlbDtcclxuICAgICAgICAgICAgICAgIHJldHVybiBjaTtcclxuICAgICAgICAgICAgfSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdCh0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLm1vZHVsZVN0b3JlLmdldFR5cGVDb21wbGV0aW9uSXRlbXMobW9kdWxlLCByYW5nZVRvUmVwbGFjZSkpO1xyXG5cclxuICAgICAgICBpZiAoY2xhc3NDb250ZXh0ICE9IG51bGwgJiYgc3ltYm9sVGFibGU/Lm1ldGhvZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRpb25JdGVtcyA9IGNvbXBsZXRpb25JdGVtcy5jb25jYXQoXHJcbiAgICAgICAgICAgICAgICBjbGFzc0NvbnRleHQuZ2V0Q29tcGxldGlvbkl0ZW1zKFZpc2liaWxpdHkucHJpdmF0ZSwgbGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUsIGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IsIHJhbmdlVG9SZXBsYWNlLCBzeW1ib2xUYWJsZS5tZXRob2QpXHJcbiAgICAgICAgICAgICAgICAgICAgLm1hcChjaSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNpLnNvcnRUZXh0ID0gXCJhYVwiICsgY2kubGFiZWw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjaTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICBjb21wbGV0aW9uSXRlbXMucHVzaChcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJzdXBlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwic3VwZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcInN1cGVyLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJBdWZydWYgZWluZXIgTWV0aG9kZSBlaW5lciBCYXNpc2tsYXNzZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJTdWdnZXN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIH0gICAgXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBVc2UgZmlsZW5hbWUgdG8gZ2VuZXJhdGUgY29tcGxldGlvbi1pdGVtIGZvciBjbGFzcyAuLi4gP1xyXG4gICAgICAgICAgICBsZXQgbmFtZSA9IG1vZHVsZS5maWxlPy5uYW1lO1xyXG4gICAgICAgICAgICBpZiAobmFtZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAobmFtZS5lbmRzV2l0aChcIi5qYXZhXCIpKSBuYW1lID0gbmFtZS5zdWJzdHIoMCwgbmFtZS5pbmRleE9mKFwiLmphdmFcIikpO1xyXG4gICAgICAgICAgICAgICAgbGV0IG0gPSBuYW1lLm1hdGNoKC8oW1xcd8O2w6TDvMOWw4TDnMOfXSopJC8pO1xyXG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZS5jbGFzc0RlZmluaXRpb25zQVNULmxlbmd0aCA9PSAwICYmIG0gIT0gbnVsbCAmJiBtLmxlbmd0aCA+IDAgJiYgbVswXSA9PSBuYW1lICYmIG5hbWUubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWUgPSBuYW1lLmNoYXJBdCgwKS50b1VwcGVyQ2FzZSgpICsgbmFtZS5zdWJzdHJpbmcoMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJjbGFzcyBcIiArIG5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwiY2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJjbGFzcyAkezE6XCIgKyBuYW1lICsgXCJ9IHtcXG5cXHQkMFxcbn1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIkRlZmluaXRpb24gZGVyIEtsYXNzZSBcIiArIG5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb21wbGV0aW9uSXRlbXMgPSBjb21wbGV0aW9uSXRlbXMuY29uY2F0KHRoaXMuZ2V0S2V5d29yZENvbXBsZXRpb24oc3ltYm9sVGFibGUpKTtcclxuXHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29tcGxldGUgdmFyaWFibGUvQ2xhc3MvS2V5d29yZCBcIiArIHRleHQpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgc3VnZ2VzdGlvbnM6IGNvbXBsZXRpb25JdGVtc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtc0FmdGVyRG90KGRvdE1hdGNoOiBSZWdFeHBNYXRjaEFycmF5LCBwb3NpdGlvbjogbW9uYWNvLlBvc2l0aW9uLCBtb2R1bGU6IE1vZHVsZSxcclxuICAgICAgICBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yOiBzdHJpbmcsIGNsYXNzQ29udGV4dDogS2xhc3MgfCBTdGF0aWNDbGFzcyxcclxuICAgICAgICBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZTogYm9vbGVhbik6IG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uTGlzdD4ge1xyXG4gICAgICAgIGxldCB0ZXh0QWZ0ZXJEb3QgPSBkb3RNYXRjaFsyXTtcclxuICAgICAgICBsZXQgZG90Q29sdW1uID0gcG9zaXRpb24uY29sdW1uIC0gdGV4dEFmdGVyRG90Lmxlbmd0aCAtIDE7XHJcbiAgICAgICAgbGV0IHRTdGF0aWMgPSBtb2R1bGUuZ2V0VHlwZUF0UG9zaXRpb24ocG9zaXRpb24ubGluZU51bWJlciwgZG90Q29sdW1uKTtcclxuICAgICAgICBsZXQgcmFuZ2VUb1JlcGxhY2U6IG1vbmFjby5JUmFuZ2UgPVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLCBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uIC0gdGV4dEFmdGVyRG90Lmxlbmd0aCxcclxuICAgICAgICAgICAgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlciwgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gKyBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLmxlbmd0aFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRTdGF0aWMgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgIGxldCB7IHR5cGUsIGlzU3RhdGljIH0gPSB0U3RhdGljO1xyXG5cclxuXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coXCJDb21wbGV0ZSBlbGVtZW50LnByYWVmaXg7IHByYWVmaXg6IFwiICsgdGV4dEFmdGVyRG90ICsgXCIsIFR5cGU6IFwiICsgKHR5cGUgPT0gbnVsbCA/IG51bGwgOiB0eXBlLmlkZW50aWZpZXIpKTtcclxuXHJcblxyXG4gICAgICAgIGlmICh0eXBlIGluc3RhbmNlb2YgS2xhc3MpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCB2aXNpYmlsaXR5VXBUbyA9IGdldFZpc2liaWxpdHlVcFRvKHR5cGUsIGNsYXNzQ29udGV4dCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoaXNTdGF0aWMpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xyXG4gICAgICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiB0eXBlLnN0YXRpY0NsYXNzLmdldENvbXBsZXRpb25JdGVtcyh2aXNpYmlsaXR5VXBUbywgbGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IsIHJhbmdlVG9SZXBsYWNlKVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uczogdHlwZS5nZXRDb21wbGV0aW9uSXRlbXModmlzaWJpbGl0eVVwVG8sIGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLCByYW5nZVRvUmVwbGFjZSwgbnVsbClcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEludGVyZmFjZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiB0eXBlLmdldENvbXBsZXRpb25JdGVtcyhsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSxcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLCByYW5nZVRvUmVwbGFjZSlcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEFycmF5VHlwZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJsZW5ndGhcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogXCJsZW5ndGhcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuRmllbGQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwibGVuZ3RoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiByYW5nZVRvUmVwbGFjZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnRhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IFwiQW56YWhsIGRlciBFbGVtZW50ZSBkZXMgQXJyYXlzXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgIH1cclxuXHJcbiAgICBnZXRLZXl3b3JkQ29tcGxldGlvbihzeW1ib2xUYWJsZTogU3ltYm9sVGFibGUpOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10ge1xyXG4gICAgICAgIGxldCBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtW10gPSBbXTtcclxuICAgICAgICBpZiAoIXRoaXMuaXNDb25zb2xlICYmIChzeW1ib2xUYWJsZT8uY2xhc3NDb250ZXh0ID09IG51bGwgfHwgc3ltYm9sVGFibGU/Lm1ldGhvZCAhPSBudWxsKSlcclxuICAgICAgICAgICAga2V5d29yZENvbXBsZXRpb25JdGVtcyA9IGtleXdvcmRDb21wbGV0aW9uSXRlbXMuY29uY2F0KFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJ3aGlsZShCZWRpbmd1bmcpe0Fud2Vpc3VuZ2VufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJ3aGlsZS1XaWVkZXJob2x1bmdcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiAnd2hpbGUnLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGluc2VydFRleHQ6IFwid2hpbGUoJHsxOkJlZGluZ3VuZ30pe1xcblxcdCQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwid2hpbGUoJDEpe1xcblxcdCQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICcxMjMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImZvcigpe31cIixcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbnNlcnRUZXh0OiBcImZvcigkezE6U3RhcnRhbndlaXN1bmd9OyR7MjpTb2xhbmdlLUJlZGluZ3VuZ307JHszOk5hY2hfamVkZXJfV2llZGVyaG9sdW5nfSl7XFxuXFx0JHswOkFud2Vpc3VuZ2VufVxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImZvciggJDEgOyAkMiA7ICQzICl7XFxuXFx0JDBcXG59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcImZvci1XaWVkZXJob2x1bmdcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiAnZm9yJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIH0sICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiZm9yKGludCBpID0gMDsgaSA8IDEwOyBpKyspe31cIixcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbnNlcnRUZXh0OiBcImZvcigkezE6U3RhcnRhbndlaXN1bmd9OyR7MjpTb2xhbmdlLUJlZGluZ3VuZ307JHszOk5hY2hfamVkZXJfV2llZGVyaG9sdW5nfSl7XFxuXFx0JHswOkFud2Vpc3VuZ2VufVxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImZvcihpbnQgJHsxOml9ID0gMDsgJHsxOml9IDwgJHsyOjEwfTsgJHsxOml9Kyspe1xcblxcdCQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJaw6RobC1XaWVkZXJob2x1bmdcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiAnZm9yJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIH0sICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwic3dpdGNoKCl7Y2FzZS4uLn1cIixcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbnNlcnRUZXh0OiBcInN3aXRjaCgkezE6U2VsZWt0b3J9KXtcXG5cXHRjYXNlICR7MjpXZXJ0XzF9OiB7XFxuXFx0XFx0ICR7MzpBbndlaXN1bmdlbn1cXG5cXHRcXHR9XFxuXFx0Y2FzZSAkezQ6V2VydF8yfToge1xcblxcdFxcdCAkezA6QW53ZWlzdW5nZW59XFxuXFx0XFx0fVxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcInN3aXRjaCgkMSl7XFxuXFx0Y2FzZSAkMjpcXG5cXHRcXHQgJDNcXG5cXHRcXHRicmVhaztcXG5cXHRjYXNlICQ0OlxcblxcdFxcdCAkNVxcblxcdFxcdGJyZWFrO1xcblxcdGRlZmF1bHQ6XFxuXFx0XFx0ICQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJzd2l0Y2gtQW53ZWlzdW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ3N3aXRjaCcsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiaWYoKXt9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zZXJ0VGV4dDogXCJpZigkezE6QmVkaW5ndW5nfSl7XFxuXFx0JHswOkFud2Vpc3VuZ2VufVxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImlmKCQxKXtcXG5cXHQkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiQmVkaW5ndW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ2lmJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJpZigpe30gZWxzZSB7fVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwiaWYoJDEpe1xcblxcdCQyXFxufVxcbmVsc2Uge1xcblxcdCQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJad2Vpc2VpdGlnZSBCZWRpbmd1bmdcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiAnaWYnLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbW1hbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICAvLyAgICAgdGl0bGU6ICcxMjMnLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gfSxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImVsc2Uge31cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImVsc2Uge1xcblxcdCQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJlbHNlLVp3ZWlnXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ2VsJyxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBdKTtcclxuXHJcbiAgICAgICAgaWYgKHN5bWJvbFRhYmxlPy5jbGFzc0NvbnRleHQgPT0gbnVsbCB8fCBzeW1ib2xUYWJsZT8ubWV0aG9kICE9IG51bGwpIHtcclxuXHJcbiAgICAgICAgICAgIGtleXdvcmRDb21wbGV0aW9uSXRlbXMgPSBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zLmNvbmNhdChbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiaW5zdGFuY2VvZlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwiaW5zdGFuY2VvZiAkMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJpbnN0YW5jZW9mLU9wZXJhdG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwcmludFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwicHJpbnQoJDEpOyQwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIkF1c2dhYmUgKGdnZi4gbWl0IEZhcmJlIFxcbmFscyB6d2VpdGVtIFBhcmFtZXRlcilcIixcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwcmludGxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJwcmludGxuKCQxKTskMFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJBdXNnYWJlIG1pdCBaZWlsZW51bWJydWNoIChnZ2YuIG1pdCBcXG5GYXJiZSBhbHMgendlaXRlbSBQYXJhbWV0ZXIpXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcblxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghdGhpcy5pc0NvbnNvbGUgJiYgKHN5bWJvbFRhYmxlID09IG51bGwgfHwgc3ltYm9sVGFibGUuY2xhc3NDb250ZXh0ID09IG51bGwpKSB7XHJcbiAgICAgICAgICAgIGtleXdvcmRDb21wbGV0aW9uSXRlbXMgPSBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zLmNvbmNhdChbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiY2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcImNsYXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJjbGFzcyAkezE6QmV6ZWljaG5lcn0ge1xcblxcdCQwXFxufVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJLbGFzc2VuZGVmaW5pdGlvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicHVibGljIGNsYXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogXCJwdWJsaWMgY2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcInB1YmxpYyBjbGFzcyAkezE6QmV6ZWljaG5lcn0ge1xcblxcdCQwXFxufVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCLDlmZmZW50bGljaGUgS2xhc3NlbmRlZmluaXRpb25cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9IGVsc2UgaWYgKCF0aGlzLmlzQ29uc29sZSAmJiBzeW1ib2xUYWJsZT8ubWV0aG9kID09IG51bGwpIHtcclxuICAgICAgICAgICAga2V5d29yZENvbXBsZXRpb25JdGVtcyA9IGtleXdvcmRDb21wbGV0aW9uSXRlbXMuY29uY2F0KFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwdWJsaWNcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcInB1YmxpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwicHVibGljIFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJTY2hsw7xzc2Vsd29ydCBwdWJsaWNcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInB1YmxpYyB2b2lkIG1ldGhvZCgpe31cIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcInB1YmxpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwicHVibGljICR7MTp2b2lkfSAkezI6QmV6ZWljaG5lcn0oJHszOlBhcmFtZXRlcn0pIHtcXG5cXHQkMFxcbn1cXG5cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiTWV0aG9kZW5kZWZpbml0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwcm90ZWN0ZWRcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcInByb3RlY3RlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwicHJvdGVjdGVkIFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJTY2hsw7xzc2Vsd29ydCBwcm90ZWN0ZWRcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInN0YXRpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwic3RhdGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJzdGF0aWMgXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIlNjaGzDvHNzZWx3b3J0IHN0YXRpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicHJpdmF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwicHJpdmF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwicHJpdmF0ZSBcIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiU2NobMO8c3NlbHdvcnQgcHJpdmF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoc3ltYm9sVGFibGUgIT0gbnVsbCAmJiBzeW1ib2xUYWJsZS5tZXRob2QgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zID0ga2V5d29yZENvbXBsZXRpb25JdGVtcy5jb25jYXQoW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInJldHVyblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwicmV0dXJuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJyZXR1cm5cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiU2NobMO8c3NlbHdvcnQgcmV0dXJuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBnZXRPdmVycmlkYWJsZU1ldGhvZHNDb21wbGV0aW9uKGNsYXNzQ29udGV4dDogS2xhc3MpIHtcclxuXHJcbiAgICAgICAgbGV0IGtleXdvcmRDb21wbGV0aW9uSXRlbXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1bXSA9IFtdO1xyXG5cclxuICAgICAgICBsZXQgbWV0aG9kczogTWV0aG9kW10gPSBbXTtcclxuICAgICAgICBsZXQgYyA9IGNsYXNzQ29udGV4dC5iYXNlQ2xhc3M7XHJcbiAgICAgICAgd2hpbGUgKGMgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBtZXRob2RzID0gbWV0aG9kcy5jb25jYXQoYy5tZXRob2RzLmZpbHRlcigobSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0uaXNBYnN0cmFjdCB8fCAobS5wcm9ncmFtID09IG51bGwgJiYgbS5pbnZva2UgPT0gbnVsbCkgfHwgbS5pZGVudGlmaWVyLnN0YXJ0c1dpdGgoJ29uTW91c2UnKSB8fCBtLmlkZW50aWZpZXIuc3RhcnRzV2l0aCgnb25LZXknKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIGMgPSBjLmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgb2YgY2xhc3NDb250ZXh0LmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgbWV0aG9kcyA9IG1ldGhvZHMuY29uY2F0KGkuZ2V0TWV0aG9kcygpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgbWV0aG9kcykge1xyXG5cclxuICAgICAgICAgICAgbGV0IGFscmVhZHlJbXBsZW1lbnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtMSBvZiBjbGFzc0NvbnRleHQubWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0xLnNpZ25hdHVyZSA9PSBtLnNpZ25hdHVyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFscmVhZHlJbXBsZW1lbnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhbHJlYWR5SW1wbGVtZW50ZWQpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGxhYmVsOiBzdHJpbmcgPSAobS5pc0Fic3RyYWN0ID8gXCJpbXBsZW1lbnQgXCIgOiBcIm92ZXJyaWRlIFwiKSArIG0uZ2V0Q29tcGxldGlvbkxhYmVsKCk7XHJcbiAgICAgICAgICAgIGxldCBmaWx0ZXJUZXh0ID0gbS5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICBsZXQgaW5zZXJ0VGV4dCA9IFZpc2liaWxpdHlbbS52aXNpYmlsaXR5XSArIFwiIFwiICsgKG0uZ2V0UmV0dXJuVHlwZSgpID09IG51bGwgPyBcInZvaWRcIiA6IG0uZ2V0UmV0dXJuVHlwZSgpLmlkZW50aWZpZXIpICsgXCIgXCI7XHJcbiAgICAgICAgICAgIGluc2VydFRleHQgKz0gbS5pZGVudGlmaWVyICsgXCIoXCI7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbS5nZXRQYXJhbWV0ZXJMaXN0KCkucGFyYW1ldGVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHAgPSBtLmdldFBhcmFtZXRlckxpc3QoKS5wYXJhbWV0ZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSBtLmdldFBhcmFtZXRlclR5cGUoaSkuaWRlbnRpZmllciArIFwiIFwiICsgcC5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBtLmdldFBhcmFtZXRlckNvdW50KCkgLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSBcIiwgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSBcIikge1xcblxcdCQwXFxufVwiO1xyXG5cclxuICAgICAgICAgICAga2V5d29yZENvbXBsZXRpb25JdGVtcy5wdXNoKFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbCxcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IChtLmlzQWJzdHJhY3QgPyBcIkltcGxlbWVudGllcmUgXCIgOiBcIsOcYmVyc2NocmVpYmUgXCIpICsgXCJkaWUgTWV0aG9kZSBcIiArIGxhYmVsICsgXCIgZGVyIEJhc2lza2xhc3NlLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IGZpbHRlclRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogaW5zZXJ0VGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXdvcmRDb21wbGV0aW9uSXRlbXM7XHJcblxyXG4gICAgfVxyXG5cclxufSJdfQ==