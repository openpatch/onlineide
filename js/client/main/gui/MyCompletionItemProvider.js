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
                    label: "if(){} else {}",
                    insertText: "if($1){\n\t$2\n}\nelse {\n\t$0\n}",
                    detail: "Zweiseitige Bedingung",
                    filterText: 'if',
                    command: {
                        id: "editor.action.triggerParameterHints",
                        title: '123',
                        arguments: []
                    },
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlDb21wbGV0aW9uSXRlbVByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9NeUNvbXBsZXRpb25JdGVtUHJvdmlkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBRUEsT0FBTyxFQUFFLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFlLE1BQU0sK0JBQStCLENBQUM7QUFJN0csT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBRTFELE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUUxRCxNQUFNLE9BQU8sd0JBQXdCO0lBTWpDLFlBQW9CLElBQWM7UUFBZCxTQUFJLEdBQUosSUFBSSxDQUFVO1FBRjNCLHNCQUFpQixHQUFhLENBQUMsR0FBRyxFQUFFLDhEQUE4RCxFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBS2hILFVBQUssR0FBWSxJQUFJLENBQUM7SUFGdEIsQ0FBQztJQUdELHNCQUFzQixDQUFDLEtBQStCLEVBQUUsUUFBeUIsRUFBRSxPQUEyQyxFQUFFLEtBQStCOztRQUUzSixVQUFVLENBQUMsR0FBRyxFQUFFO1lBQ1osWUFBWTtZQUNaLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsZUFBZSxDQUFDLDZCQUE2QixDQUFDLENBQUMsTUFBTSxDQUFDO1lBQzNGLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtnQkFDWixFQUFFLENBQUMsYUFBYSxFQUFFLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQ3RCO1lBQ0QsZ0NBQWdDO1lBQ2hDLHFGQUFxRjtZQUNyRiw0RUFBNEU7WUFDNUUsc0ZBQXNGO1FBQzFGLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUVSLElBQUksWUFBWSxxQkFBRyxJQUFJLENBQUMsSUFBSSxDQUFD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QUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM3RCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzNDLFVBQVUsSUFBSSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsVUFBVSxDQUFDO2dCQUNwRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsaUJBQWlCLEVBQUUsR0FBRyxDQUFDLEVBQUU7b0JBQy9CLFVBQVUsSUFBSSxJQUFJLENBQUM7aUJBQ3RCO2FBQ0o7WUFDRCxVQUFVLElBQUksY0FBYyxDQUFDO1lBRTdCLHNCQUFzQixDQUFDLElBQUksQ0FDdkI7Z0JBQ0ksS0FBSyxFQUFFLEtBQUs7Z0JBQ1osTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxHQUFHLGNBQWMsR0FBRyxLQUFLLEdBQUcsbUJBQW1CO2dCQUMxRyxVQUFVLEVBQUUsVUFBVTtnQkFDdEIsVUFBVSxFQUFFLFVBQVU7Z0JBQ3RCLGVBQWUsRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLDRCQUE0QixDQUFDLGVBQWU7Z0JBQzlFLElBQUksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLGtCQUFrQixDQUFDLE9BQU87Z0JBQ2pELEtBQUssRUFBRSxTQUFTO2FBQ25CLENBQ0osQ0FBQztTQUVMO1FBRUQsT0FBTyxzQkFBc0IsQ0FBQztJQUVsQyxDQUFDO0NBRUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBFZGl0b3IgfSBmcm9tIFwiLi9FZGl0b3IuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgS2xhc3MsIGdldFZpc2liaWxpdHlVcFRvLCBJbnRlcmZhY2UsIFZpc2liaWxpdHksIFN0YXRpY0NsYXNzIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IFN5bWJvbFRhYmxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9TeW1ib2xUYWJsZS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL01haW4uanNcIjtcclxuaW1wb3J0IHsgTWV0aG9kIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1R5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEFycmF5VHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9BcnJheS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9NYWluQmFzZS5qc1wiO1xyXG5pbXBvcnQgeyBUb2tlblR5cGUgfSBmcm9tIFwiLi4vLi4vY29tcGlsZXIvbGV4ZXIvVG9rZW4uanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBNeUNvbXBsZXRpb25JdGVtUHJvdmlkZXIgaW1wbGVtZW50cyBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtUHJvdmlkZXIge1xyXG5cclxuICAgIGlzQ29uc29sZTogYm9vbGVhbjtcclxuXHJcbiAgICBwdWJsaWMgdHJpZ2dlckNoYXJhY3RlcnM6IHN0cmluZ1tdID0gWycuJywgJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6w6TDtsO8w59fQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVrDhMOWw5wnLCAnICddO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbkJhc2UpIHtcclxuICAgIH1cclxuXHJcbiAgICBmaXJzdDogYm9vbGVhbiA9IHRydWU7XHJcbiAgICBwcm92aWRlQ29tcGxldGlvbkl0ZW1zKG1vZGVsOiBtb25hY28uZWRpdG9yLklUZXh0TW9kZWwsIHBvc2l0aW9uOiBtb25hY28uUG9zaXRpb24sIGNvbnRleHQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkNvbnRleHQsIHRva2VuOiBtb25hY28uQ2FuY2VsbGF0aW9uVG9rZW4pOiBtb25hY28ubGFuZ3VhZ2VzLlByb3ZpZGVyUmVzdWx0PG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkxpc3Q+IHtcclxuXHJcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICBsZXQgc3cgPSB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuX2NvbnRlbnRXaWRnZXRzW1wiZWRpdG9yLndpZGdldC5zdWdnZXN0V2lkZ2V0XCJdLndpZGdldDtcclxuICAgICAgICAgICAgaWYgKHRoaXMuZmlyc3QpIHtcclxuICAgICAgICAgICAgICAgIHN3LnRvZ2dsZURldGFpbHMoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZmlyc3QgPSBmYWxzZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBzdy50b2dnbGVTdWdnZXN0aW9uRGV0YWlscygpO1xyXG4gICAgICAgICAgICAvLyB0aGlzLm1haW4ubW9uYWNvLnRyaWdnZXIoJ2tleWJvYXJkJywgJ2VkaXRvci5hY3Rpb24udG9nZ2xlU3VnZ2VzdGlvbkRldGFpbHMnLCB7fSk7XHJcbiAgICAgICAgICAgIC8vIHRoaXMubWFpbi5tb25hY28udHJpZ2dlcigna2V5Ym9hcmQnLCAnZWRpdG9yLmFjdGlvbi50cmlnZ2VyU3VnZ2VzdCcsIHt9KTtcclxuICAgICAgICAgICAgLy8gdGhpcy5tYWluLm1vbmFjby50cmlnZ2VyKG1vbmFjby5LZXlNb2QuQ3RybENtZCArIG1vbmFjby5LZXlDb2RlLlNwYWNlLCAndHlwZScsIHt9KTtcclxuICAgICAgICB9LCAzMDApO1xyXG5cclxuICAgICAgICBsZXQgY29uc29sZU1vZGVsID0gdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlPy5lZGl0b3I/LmdldE1vZGVsKCk7XHJcbiAgICAgICAgdGhpcy5pc0NvbnNvbGUgPSBtb2RlbCA9PSBjb25zb2xlTW9kZWw7XHJcblxyXG4gICAgICAgIGxldCBpc01haW5XaW5kb3cgPSBtb2RlbCA9PSB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuZ2V0TW9kZWwoKTtcclxuXHJcbiAgICAgICAgaWYgKCEodGhpcy5pc0NvbnNvbGUgfHwgaXNNYWluV2luZG93KSkgcmV0dXJuO1xyXG5cclxuICAgICAgICBsZXQgbW9kdWxlOiBNb2R1bGUgPSB0aGlzLmlzQ29uc29sZSA/IHRoaXMubWFpbi5nZXRCb3R0b21EaXYoKT8uY29uc29sZT8uY29tcGlsZXIubW9kdWxlIDpcclxuICAgICAgICAgICAgdGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5nZXRNb2R1bGVCeU1vbmFjb01vZGVsKG1vZGVsKTtcclxuXHJcbiAgICAgICAgaWYgKG1vZHVsZSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMuaXNTdHJpbmdMaXRlcmFsKG1vZHVsZSwgcG9zaXRpb24pKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgbGV0IHRleHRVbnRpbFBvc2l0aW9uID0gbW9kZWwuZ2V0VmFsdWVJblJhbmdlKHsgc3RhcnRMaW5lTnVtYmVyOiAxLCBzdGFydENvbHVtbjogMSwgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlciwgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW4gfSk7XHJcbiAgICAgICAgbGV0IHRleHRBZnRlclBvc2l0aW9uID0gbW9kZWwuZ2V0VmFsdWVJblJhbmdlKHsgc3RhcnRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLCBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uLCBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyICsgNSwgZW5kQ29sdW1uOiAxIH0pO1xyXG5cclxuICAgICAgICBpZiAoY29udGV4dC50cmlnZ2VyQ2hhcmFjdGVyID09IFwiIFwiKSB7XHJcbiAgICAgICAgICAgIGxldCBuZXdNYXRjaCA9IHRleHRVbnRpbFBvc2l0aW9uLm1hdGNoKC8uKihuZXcgKSQvKTtcclxuICAgICAgICAgICAgaWYgKG5ld01hdGNoICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvbXBsZXRpb25JdGVtc0FmdGVyTmV3KG1vZHVsZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbGV0IGNsYXNzTWF0Y2ggPSB0ZXh0VW50aWxQb3NpdGlvbi5tYXRjaCgvLiooY2xhc3MgKVtcXHfDtsOkw7zDlsOEw5zDnzw+ICxdKltcXHfDtsOkw7zDlsOEw5zDnzw+IF0gJC8pO1xyXG4gICAgICAgICAgICBpZiAoY2xhc3NNYXRjaCAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGNsYXNzSW5kZXggPSB0ZXh0VW50aWxQb3NpdGlvbi5sYXN0SW5kZXhPZignY2xhc3MnKTtcclxuICAgICAgICAgICAgICAgIGxldCBjb3VudExvd2VyID0gMDtcclxuICAgICAgICAgICAgICAgIGxldCBjb3VudEdyZWF0ZXIgPSAwO1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IGNsYXNzSW5kZXg7IGkgPCB0ZXh0VW50aWxQb3NpdGlvbi5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBjID0gdGV4dFVudGlsUG9zaXRpb24uY2hhckF0KGkpO1xyXG4gICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoYykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXNlICc8JzogY291bnRMb3dlcisrOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnPic6IGNvdW50R3JlYXRlcisrOyBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcGxldGlvbkl0ZW1zQWZ0ZXJDbGFzcyhtb2R1bGUsIGNvdW50TG93ZXIgPiBjb3VudEdyZWF0ZXIsIHRleHRBZnRlclBvc2l0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBpYk1hdGNoID0gdGV4dEFmdGVyUG9zaXRpb24ubWF0Y2goL14oW1xcd8O2w6TDvMOWw4TDnMOfXSpcXCg/KS8pO1xyXG4gICAgICAgIGxldCBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yID0gXCJcIjtcclxuICAgICAgICBpZiAoaWJNYXRjaCAhPSBudWxsICYmIGliTWF0Y2gubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yID0gaWJNYXRjaFswXTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSA9IGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IuZW5kc1dpdGgoXCIoXCIpO1xyXG5cclxuICAgICAgICAvLyBGaXJzdCBndWVzczogIGRvdCBmb2xsb3dlZCBieSBwYXJ0IG9mIElkZW50aWZpZXI/XHJcbiAgICAgICAgbGV0IGRvdE1hdGNoID0gdGV4dFVudGlsUG9zaXRpb24ubWF0Y2goLy4qKFxcLikoW1xcd8O2w6TDvMOWw4TDnMOfXSopJC8pO1xyXG4gICAgICAgIGlmIChkb3RNYXRjaCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQ29uc29sZSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLmdldEJvdHRvbURpdigpPy5jb25zb2xlPy5jb21waWxlSWZEaXJ0eSgpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5tYWluLmNvbXBpbGVJZkRpcnR5KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBzeW1ib2xUYWJsZSA9IHRoaXMuaXNDb25zb2xlID8gdGhpcy5tYWluLmdldERlYnVnZ2VyKCkubGFzdFN5bWJvbHRhYmxlIDogbW9kdWxlLmZpbmRTeW1ib2xUYWJsZUF0UG9zaXRpb24ocG9zaXRpb24ubGluZU51bWJlciwgcG9zaXRpb24uY29sdW1uKTtcclxuICAgICAgICBsZXQgY2xhc3NDb250ZXh0ID0gc3ltYm9sVGFibGUgPT0gbnVsbCA/IG51bGwgOiBzeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQ7XHJcblxyXG5cclxuICAgICAgICBpZiAoZG90TWF0Y2ggIT0gbnVsbCkge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb21wbGV0aW9uSXRlbXNBZnRlckRvdChkb3RNYXRjaCwgcG9zaXRpb24sIG1vZHVsZSxcclxuICAgICAgICAgICAgICAgIGlkZW50aWZpZXJBbmRCcmFja2V0QWZ0ZXJDdXJzb3IsIGNsYXNzQ29udGV4dCwgbGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHZhck9yQ2xhc3NNYXRjaCA9IHRleHRVbnRpbFBvc2l0aW9uLm1hdGNoKC8uKlteXFx3w7bDpMO8w5bDhMOcw59dKFtcXHfDtsOkw7zDlsOEw5zDn10qKSQvKTtcclxuXHJcbiAgICAgICAgaWYgKHZhck9yQ2xhc3NNYXRjaCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIHZhck9yQ2xhc3NNYXRjaCA9IHRleHRVbnRpbFBvc2l0aW9uLm1hdGNoKC9eKFtcXHfDtsOkw7zDlsOEw5zDn10qKSQvKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh2YXJPckNsYXNzTWF0Y2ggIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0Q29tcGxldGlvbkl0ZW1zSW5zaWRlSWRlbnRpZmllcih2YXJPckNsYXNzTWF0Y2gsIHBvc2l0aW9uLCBtb2R1bGUsXHJcbiAgICAgICAgICAgICAgICBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLCBjbGFzc0NvbnRleHQsIGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlLCBzeW1ib2xUYWJsZSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGlzU3RyaW5nTGl0ZXJhbChtb2R1bGU6IE1vZHVsZSwgcG9zaXRpb246IG1vbmFjby5Qb3NpdGlvbikge1xyXG5cclxuICAgICAgICBsZXQgdG9rZW5MaXN0ID0gbW9kdWxlLnRva2VuTGlzdDtcclxuICAgICAgICBpZiAodG9rZW5MaXN0ID09IG51bGwgfHwgdG9rZW5MaXN0Lmxlbmd0aCA9PSAwKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIGxldCBwb3NNaW4gPSAwO1xyXG4gICAgICAgIGxldCBwb3NNYXggPSB0b2tlbkxpc3QubGVuZ3RoIC0gMTtcclxuICAgICAgICBsZXQgcG9zOiBudW1iZXI7XHJcblxyXG4gICAgICAgIGxldCB3YXRjaERvZyA9IDEwMDA7XHJcblxyXG4gICAgICAgIHdoaWxlICh0cnVlKSB7XHJcbiAgICAgICAgICAgIGxldCBwb3NPbGQgPSBwb3M7XHJcbiAgICAgICAgICAgIHBvcyA9IE1hdGgucm91bmQoKHBvc01heCArIHBvc01pbikgLyAyKTtcclxuXHJcbiAgICAgICAgICAgIGlmIChwb3NPbGQgPT0gcG9zKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgICAgICB3YXRjaERvZy0tO1xyXG4gICAgICAgICAgICBpZiAod2F0Y2hEb2cgPT0gMCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgbGV0IHQgPSB0b2tlbkxpc3RbcG9zXTtcclxuICAgICAgICAgICAgbGV0IHAgPSB0LnBvc2l0aW9uO1xyXG5cclxuICAgICAgICAgICAgaWYgKHAubGluZSA8IHBvc2l0aW9uLmxpbmVOdW1iZXIgfHwgcC5saW5lID09IHBvc2l0aW9uLmxpbmVOdW1iZXIgJiYgcC5jb2x1bW4gKyBwLmxlbmd0aCA8IHBvc2l0aW9uLmNvbHVtbikge1xyXG4gICAgICAgICAgICAgICAgcG9zTWluID0gcG9zO1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChwLmxpbmUgPiBwb3NpdGlvbi5saW5lTnVtYmVyIHx8IHAubGluZSA9PSBwb3NpdGlvbi5saW5lTnVtYmVyICYmIHAuY29sdW1uID4gcG9zaXRpb24uY29sdW1uKSB7XHJcbiAgICAgICAgICAgICAgICBwb3NNYXggPSBwb3M7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcmV0dXJuIHQudHQgPT0gVG9rZW5UeXBlLnN0cmluZ0NvbnN0YW50O1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtc0FmdGVyTmV3KG1vZHVsZTogTW9kdWxlKTogbW9uYWNvLmxhbmd1YWdlcy5Qcm92aWRlclJlc3VsdDxtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25MaXN0PiB7XHJcbiAgICAgICAgbGV0IGNvbXBsZXRpb25JdGVtczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdID0gW107XHJcblxyXG4gICAgICAgIGNvbXBsZXRpb25JdGVtcyA9IGNvbXBsZXRpb25JdGVtcy5jb25jYXQodGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5tb2R1bGVTdG9yZS5nZXRUeXBlQ29tcGxldGlvbkl0ZW1zKG1vZHVsZSwgdW5kZWZpbmVkKSk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcGxldGlvbkl0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gY29tcGxldGlvbkl0ZW1zW2ldO1xyXG4gICAgICAgICAgICBpZiAoaXRlbS5kZXRhaWwubWF0Y2goJ1ByaW1pdGl2JykpIHtcclxuICAgICAgICAgICAgICAgIGNvbXBsZXRpb25JdGVtcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICBpLS07XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoaXRlbVtcImdlbmVyaWNcIl0pIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0uaW5zZXJ0VGV4dCArPSBcIjw+KCQwKVwiO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaXRlbS5pbnNlcnRUZXh0ICs9IFwiKCQwKVwiO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGl0ZW0uaW5zZXJ0VGV4dFJ1bGVzID0gbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldDtcclxuICAgICAgICAgICAgaXRlbS5jb21tYW5kID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgc3VnZ2VzdGlvbnM6IGNvbXBsZXRpb25JdGVtc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtc0FmdGVyQ2xhc3MobW9kdWxlOiBNb2R1bGUsIGluc2lkZUdlbmVyaWNQYXJhbWV0ZXJEZWZpbml0aW9uOiBib29sZWFuLCB0ZXh0QWZ0ZXJQb3NpdGlvbjogc3RyaW5nKTogbW9uYWNvLmxhbmd1YWdlcy5Qcm92aWRlclJlc3VsdDxtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25MaXN0PiB7XHJcbiAgICAgICAgbGV0IGNvbXBsZXRpb25JdGVtczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdID0gW107XHJcblxyXG4gICAgICAgIGxldCBzdGFydHNXaXRoQ3VybHlCcmFjZTogYm9vbGVhbiA9IHRleHRBZnRlclBvc2l0aW9uLnRyaW1MZWZ0KCkuc3RhcnRzV2l0aChcIntcIik7XHJcblxyXG4gICAgICAgIGNvbXBsZXRpb25JdGVtcyA9IGNvbXBsZXRpb25JdGVtcy5jb25jYXQoW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJleHRlbmRzXCIsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImV4dGVuZHMgJDFcIiArIChpbnNpZGVHZW5lcmljUGFyYW1ldGVyRGVmaW5pdGlvbiB8fCBzdGFydHNXaXRoQ3VybHlCcmFjZSA/IFwiXCIgOiBcIiB7XFxuXFx0JDBcXG59XCIpLFxyXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcImV4dGVuZHMtT3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclN1Z2dlc3RcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJpbXBsZW1lbnRzXCIsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImltcGxlbWVudHMgJDFcIiArIChpbnNpZGVHZW5lcmljUGFyYW1ldGVyRGVmaW5pdGlvbiB8fCBzdGFydHNXaXRoQ3VybHlCcmFjZSA/IFwiXCIgOiBcIiB7XFxuXFx0JDBcXG59XCIpLFxyXG4gICAgICAgICAgICAgICAgZGV0YWlsOiBcImltcGxlbWVudHMtT3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclN1Z2dlc3RcIixcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJ7fVwiLFxyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJ7XFxuXFx0JDBcXG59XCIsXHJcbiAgICAgICAgICAgICAgICBkZXRhaWw6IFwiS2xhc3NlbnJ1bXBmXCIsXHJcbiAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIF0pO1xyXG5cclxuICAgICAgICAvLyBjb21wbGV0aW9uSXRlbXMgPSBjb21wbGV0aW9uSXRlbXMuY29uY2F0KHRoaXMubWFpbi5nZXRDdXJyZW50V29ya3NwYWNlKCkubW9kdWxlU3RvcmUuZ2V0VHlwZUNvbXBsZXRpb25JdGVtcyhtb2R1bGUsIHVuZGVmaW5lZCkpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgc3VnZ2VzdGlvbnM6IGNvbXBsZXRpb25JdGVtc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGdldENvbXBsZXRpb25JdGVtc0luc2lkZUlkZW50aWZpZXIodmFyT3JDbGFzc01hdGNoOiBSZWdFeHBNYXRjaEFycmF5LCBwb3NpdGlvbjogbW9uYWNvLlBvc2l0aW9uLCBtb2R1bGU6IE1vZHVsZSwgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcjogc3RyaW5nLCBjbGFzc0NvbnRleHQ6IEtsYXNzIHwgU3RhdGljQ2xhc3MsXHJcbiAgICAgICAgbGVmdEJyYWNrZXRBbHJlYWR5VGhlcmU6IGJvb2xlYW4sIHN5bWJvbFRhYmxlOiBTeW1ib2xUYWJsZSk6IG1vbmFjby5sYW5ndWFnZXMuUHJvdmlkZXJSZXN1bHQ8bW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uTGlzdD4ge1xyXG4gICAgICAgIGxldCB0ZXh0ID0gdmFyT3JDbGFzc01hdGNoWzFdO1xyXG5cclxuICAgICAgICBsZXQgcmFuZ2VUb1JlcGxhY2U6IG1vbmFjby5JUmFuZ2UgPVxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLCBzdGFydENvbHVtbjogcG9zaXRpb24uY29sdW1uIC0gdGV4dC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVOdW1iZXIsIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uICsgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvci5sZW5ndGhcclxuICAgICAgICB9XHJcblxyXG5cclxuXHJcbiAgICAgICAgbGV0IGNvbXBsZXRpb25JdGVtczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdID0gW107XHJcblxyXG4gICAgICAgIGlmIChzeW1ib2xUYWJsZT8uY2xhc3NDb250ZXh0ICE9IG51bGwgJiYgc3ltYm9sVGFibGU/Lm1ldGhvZCA9PSBudWxsICYmIHN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcbiAgICAgICAgICAgIGNvbXBsZXRpb25JdGVtcyA9IGNvbXBsZXRpb25JdGVtcy5jb25jYXQodGhpcy5nZXRPdmVycmlkYWJsZU1ldGhvZHNDb21wbGV0aW9uKHN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHN5bWJvbFRhYmxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdChzeW1ib2xUYWJsZS5nZXRMb2NhbFZhcmlhYmxlQ29tcGxldGlvbkl0ZW1zKHJhbmdlVG9SZXBsYWNlKS5tYXAoY2kgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2kuc29ydFRleHQgPSBcImFhYVwiICsgY2kubGFiZWw7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gY2k7XHJcbiAgICAgICAgICAgIH0pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbXBsZXRpb25JdGVtcyA9IGNvbXBsZXRpb25JdGVtcy5jb25jYXQodGhpcy5tYWluLmdldEN1cnJlbnRXb3Jrc3BhY2UoKS5tb2R1bGVTdG9yZS5nZXRUeXBlQ29tcGxldGlvbkl0ZW1zKG1vZHVsZSwgcmFuZ2VUb1JlcGxhY2UpKTtcclxuXHJcbiAgICAgICAgaWYgKGNsYXNzQ29udGV4dCAhPSBudWxsICYmIHN5bWJvbFRhYmxlPy5tZXRob2QgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjb21wbGV0aW9uSXRlbXMgPSBjb21wbGV0aW9uSXRlbXMuY29uY2F0KFxyXG4gICAgICAgICAgICAgICAgY2xhc3NDb250ZXh0LmdldENvbXBsZXRpb25JdGVtcyhWaXNpYmlsaXR5LnByaXZhdGUsIGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlLCBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLCByYW5nZVRvUmVwbGFjZSwgc3ltYm9sVGFibGUubWV0aG9kKVxyXG4gICAgICAgICAgICAgICAgICAgIC5tYXAoY2kgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaS5zb3J0VGV4dCA9IFwiYWFcIiArIGNpLmxhYmVsO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY2k7XHJcbiAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgY29tcGxldGlvbkl0ZW1zLnB1c2goXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwic3VwZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcInN1cGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJzdXBlci5cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiQXVmcnVmIGVpbmVyIE1ldGhvZGUgZWluZXIgQmFzaXNrbGFzc2VcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyU3VnZ2VzdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gVXNlIGZpbGVuYW1lIHRvIGdlbmVyYXRlIGNvbXBsZXRpb24taXRlbSBmb3IgY2xhc3MgLi4uID9cclxuICAgICAgICAgICAgbGV0IG5hbWUgPSBtb2R1bGUuZmlsZT8ubmFtZTtcclxuICAgICAgICAgICAgaWYgKG5hbWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKG5hbWUuZW5kc1dpdGgoXCIuamF2YVwiKSkgbmFtZSA9IG5hbWUuc3Vic3RyKDAsIG5hbWUuaW5kZXhPZihcIi5qYXZhXCIpKTtcclxuICAgICAgICAgICAgICAgIGxldCBtID0gbmFtZS5tYXRjaCgvKFtcXHfDtsOkw7zDlsOEw5zDn10qKSQvKTtcclxuICAgICAgICAgICAgICAgIGlmIChtb2R1bGUuY2xhc3NEZWZpbml0aW9uc0FTVC5sZW5ndGggPT0gMCAmJiBtICE9IG51bGwgJiYgbS5sZW5ndGggPiAwICYmIG1bMF0gPT0gbmFtZSAmJiBuYW1lLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lID0gbmFtZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIG5hbWUuc3Vic3RyaW5nKDEpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbXBsZXRpb25JdGVtcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiY2xhc3MgXCIgKyBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcImNsYXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwiY2xhc3MgJHsxOlwiICsgbmFtZSArIFwifSB7XFxuXFx0JDBcXG59XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJEZWZpbml0aW9uIGRlciBLbGFzc2UgXCIgKyBuYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29tcGxldGlvbkl0ZW1zID0gY29tcGxldGlvbkl0ZW1zLmNvbmNhdCh0aGlzLmdldEtleXdvcmRDb21wbGV0aW9uKHN5bWJvbFRhYmxlKSk7XHJcblxyXG5cclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhcIkNvbXBsZXRlIHZhcmlhYmxlL0NsYXNzL0tleXdvcmQgXCIgKyB0ZXh0KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiBjb21wbGV0aW9uSXRlbXNcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRDb21wbGV0aW9uSXRlbXNBZnRlckRvdChkb3RNYXRjaDogUmVnRXhwTWF0Y2hBcnJheSwgcG9zaXRpb246IG1vbmFjby5Qb3NpdGlvbiwgbW9kdWxlOiBNb2R1bGUsXHJcbiAgICAgICAgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvcjogc3RyaW5nLCBjbGFzc0NvbnRleHQ6IEtsYXNzIHwgU3RhdGljQ2xhc3MsXHJcbiAgICAgICAgbGVmdEJyYWNrZXRBbHJlYWR5VGhlcmU6IGJvb2xlYW4pOiBtb25hY28ubGFuZ3VhZ2VzLlByb3ZpZGVyUmVzdWx0PG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkxpc3Q+IHtcclxuICAgICAgICBsZXQgdGV4dEFmdGVyRG90ID0gZG90TWF0Y2hbMl07XHJcbiAgICAgICAgbGV0IGRvdENvbHVtbiA9IHBvc2l0aW9uLmNvbHVtbiAtIHRleHRBZnRlckRvdC5sZW5ndGggLSAxO1xyXG4gICAgICAgIGxldCB0U3RhdGljID0gbW9kdWxlLmdldFR5cGVBdFBvc2l0aW9uKHBvc2l0aW9uLmxpbmVOdW1iZXIsIGRvdENvbHVtbik7XHJcbiAgICAgICAgbGV0IHJhbmdlVG9SZXBsYWNlOiBtb25hY28uSVJhbmdlID1cclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlciwgc3RhcnRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbiAtIHRleHRBZnRlckRvdC5sZW5ndGgsXHJcbiAgICAgICAgICAgIGVuZExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVOdW1iZXIsIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uICsgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvci5sZW5ndGhcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0U3RhdGljID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgeyB0eXBlLCBpc1N0YXRpYyB9ID0gdFN0YXRpYztcclxuXHJcblxyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKFwiQ29tcGxldGUgZWxlbWVudC5wcmFlZml4OyBwcmFlZml4OiBcIiArIHRleHRBZnRlckRvdCArIFwiLCBUeXBlOiBcIiArICh0eXBlID09IG51bGwgPyBudWxsIDogdHlwZS5pZGVudGlmaWVyKSk7XHJcblxyXG5cclxuICAgICAgICBpZiAodHlwZSBpbnN0YW5jZW9mIEtsYXNzKSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgdmlzaWJpbGl0eVVwVG8gPSBnZXRWaXNpYmlsaXR5VXBUbyh0eXBlLCBjbGFzc0NvbnRleHQpO1xyXG5cclxuICAgICAgICAgICAgaWYgKGlzU3RhdGljKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcclxuICAgICAgICAgICAgICAgICAgICBzdWdnZXN0aW9uczogdHlwZS5zdGF0aWNDbGFzcy5nZXRDb21wbGV0aW9uSXRlbXModmlzaWJpbGl0eVVwVG8sIGxlZnRCcmFja2V0QWxyZWFkeVRoZXJlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyQW5kQnJhY2tldEFmdGVyQ3Vyc29yLCByYW5nZVRvUmVwbGFjZSlcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgc3VnZ2VzdGlvbnM6IHR5cGUuZ2V0Q29tcGxldGlvbkl0ZW1zKHZpc2liaWxpdHlVcFRvLCBsZWZ0QnJhY2tldEFscmVhZHlUaGVyZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvciwgcmFuZ2VUb1JlcGxhY2UsIG51bGwpXHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBJbnRlcmZhY2UpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICBzdWdnZXN0aW9uczogdHlwZS5nZXRDb21wbGV0aW9uSXRlbXMobGVmdEJyYWNrZXRBbHJlYWR5VGhlcmUsXHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllckFuZEJyYWNrZXRBZnRlckN1cnNvciwgcmFuZ2VUb1JlcGxhY2UpXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHR5cGUgaW5zdGFuY2VvZiBBcnJheVR5cGUpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XHJcbiAgICAgICAgICAgICAgICBzdWdnZXN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwibGVuZ3RoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwibGVuZ3RoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLkZpZWxkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImxlbmd0aFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByYW5nZTogcmFuZ2VUb1JlcGxhY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlOiBcIkFuemFobCBkZXIgRWxlbWVudGUgZGVzIEFycmF5c1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0S2V5d29yZENvbXBsZXRpb24oc3ltYm9sVGFibGU6IFN5bWJvbFRhYmxlKTogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdIHtcclxuICAgICAgICBsZXQga2V5d29yZENvbXBsZXRpb25JdGVtczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdID0gW107XHJcbiAgICAgICAgaWYgKCF0aGlzLmlzQ29uc29sZSAmJiAoc3ltYm9sVGFibGU/LmNsYXNzQ29udGV4dCA9PSBudWxsIHx8IHN5bWJvbFRhYmxlPy5tZXRob2QgIT0gbnVsbCkpXHJcbiAgICAgICAgICAgIGtleXdvcmRDb21wbGV0aW9uSXRlbXMgPSBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zLmNvbmNhdChbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwid2hpbGUoQmVkaW5ndW5nKXtBbndlaXN1bmdlbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwid2hpbGUtV2llZGVyaG9sdW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ3doaWxlJyxcclxuICAgICAgICAgICAgICAgICAgICAvLyBpbnNlcnRUZXh0OiBcIndoaWxlKCR7MTpCZWRpbmd1bmd9KXtcXG5cXHQkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcIndoaWxlKCQxKXtcXG5cXHQkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJmb3IoKXt9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zZXJ0VGV4dDogXCJmb3IoJHsxOlN0YXJ0YW53ZWlzdW5nfTskezI6U29sYW5nZS1CZWRpbmd1bmd9OyR7MzpOYWNoX2plZGVyX1dpZWRlcmhvbHVuZ30pe1xcblxcdCR7MDpBbndlaXN1bmdlbn1cXG59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJmb3IoICQxIDsgJDIgOyAkMyApe1xcblxcdCQwXFxufVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJmb3ItV2llZGVyaG9sdW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ2ZvcicsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgICAgICAgICAvLyB9LCAgICBcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImZvcihpbnQgaSA9IDA7IGkgPCAxMDsgaSsrKXt9XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zZXJ0VGV4dDogXCJmb3IoJHsxOlN0YXJ0YW53ZWlzdW5nfTskezI6U29sYW5nZS1CZWRpbmd1bmd9OyR7MzpOYWNoX2plZGVyX1dpZWRlcmhvbHVuZ30pe1xcblxcdCR7MDpBbndlaXN1bmdlbn1cXG59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJmb3IoaW50ICR7MTppfSA9IDA7ICR7MTppfSA8ICR7MjoxMH07ICR7MTppfSsrKXtcXG5cXHQkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiWsOkaGwtV2llZGVyaG9sdW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ2ZvcicsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgICAgICAgICAvLyB9LCAgICBcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInN3aXRjaCgpe2Nhc2UuLi59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5zZXJ0VGV4dDogXCJzd2l0Y2goJHsxOlNlbGVrdG9yfSl7XFxuXFx0Y2FzZSAkezI6V2VydF8xfToge1xcblxcdFxcdCAkezM6QW53ZWlzdW5nZW59XFxuXFx0XFx0fVxcblxcdGNhc2UgJHs0OldlcnRfMn06IHtcXG5cXHRcXHQgJHswOkFud2Vpc3VuZ2VufVxcblxcdFxcdH1cXG59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJzd2l0Y2goJDEpe1xcblxcdGNhc2UgJDI6XFxuXFx0XFx0ICQzXFxuXFx0XFx0YnJlYWs7XFxuXFx0Y2FzZSAkNDpcXG5cXHRcXHQgJDVcXG5cXHRcXHRicmVhaztcXG5cXHRkZWZhdWx0OlxcblxcdFxcdCAkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwic3dpdGNoLUFud2Vpc3VuZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6ICdzd2l0Y2gnLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICcxMjMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImlmKCl7fVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGluc2VydFRleHQ6IFwiaWYoJHsxOkJlZGluZ3VuZ30pe1xcblxcdCR7MDpBbndlaXN1bmdlbn1cXG59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJpZigkMSl7XFxuXFx0JDBcXG59XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIkJlZGluZ3VuZ1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6ICdpZicsXHJcbiAgICAgICAgICAgICAgICAgICAgY29tbWFuZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJzEyMycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3VtZW50czogW11cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiaWYoKXt9IGVsc2Uge31cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImlmKCQxKXtcXG5cXHQkMlxcbn1cXG5lbHNlIHtcXG5cXHQkMFxcbn1cIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiWndlaXNlaXRpZ2UgQmVkaW5ndW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogJ2lmJyxcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfV0pO1xyXG5cclxuICAgICAgICBpZiAoc3ltYm9sVGFibGU/LmNsYXNzQ29udGV4dCA9PSBudWxsIHx8IHN5bWJvbFRhYmxlPy5tZXRob2QgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAga2V5d29yZENvbXBsZXRpb25JdGVtcyA9IGtleXdvcmRDb21wbGV0aW9uSXRlbXMuY29uY2F0KFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJpbnN0YW5jZW9mXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJpbnN0YW5jZW9mICQwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcImluc3RhbmNlb2YtT3BlcmF0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInByaW50XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJwcmludCgkMSk7JDBcIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiQXVzZ2FiZSAoZ2dmLiBtaXQgRmFyYmUgXFxuYWxzIHp3ZWl0ZW0gUGFyYW1ldGVyKVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNvbW1hbmQ6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiZWRpdG9yLmFjdGlvbi50cmlnZ2VyUGFyYW1ldGVySGludHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGl0bGU6ICcxMjMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcmd1bWVudHM6IFtdXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInByaW50bG5cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcInByaW50bG4oJDEpOyQwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIkF1c2dhYmUgbWl0IFplaWxlbnVtYnJ1Y2ggKGdnZi4gbWl0IFxcbkZhcmJlIGFscyB6d2VpdGVtIFBhcmFtZXRlcilcIixcclxuICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcImVkaXRvci5hY3Rpb24udHJpZ2dlclBhcmFtZXRlckhpbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnMTIzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXJndW1lbnRzOiBbXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuXHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmlzQ29uc29sZSAmJiAoc3ltYm9sVGFibGUgPT0gbnVsbCB8fCBzeW1ib2xUYWJsZS5jbGFzc0NvbnRleHQgPT0gbnVsbCkpIHtcclxuICAgICAgICAgICAga2V5d29yZENvbXBsZXRpb25JdGVtcyA9IGtleXdvcmRDb21wbGV0aW9uSXRlbXMuY29uY2F0KFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJjbGFzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwiY2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcImNsYXNzICR7MTpCZXplaWNobmVyfSB7XFxuXFx0JDBcXG59XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIktsYXNzZW5kZWZpbml0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwdWJsaWMgY2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBmaWx0ZXJUZXh0OiBcInB1YmxpYyBjbGFzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwicHVibGljIGNsYXNzICR7MTpCZXplaWNobmVyfSB7XFxuXFx0JDBcXG59XFxuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIsOWZmZlbnRsaWNoZSBLbGFzc2VuZGVmaW5pdGlvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoIXRoaXMuaXNDb25zb2xlICYmIHN5bWJvbFRhYmxlPy5tZXRob2QgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zID0ga2V5d29yZENvbXBsZXRpb25JdGVtcy5jb25jYXQoW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInB1YmxpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwicHVibGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJwdWJsaWMgXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIlNjaGzDvHNzZWx3b3J0IHB1YmxpY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicHVibGljIHZvaWQgbWV0aG9kKCl7fVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwicHVibGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJwdWJsaWMgJHsxOnZvaWR9ICR7MjpCZXplaWNobmVyfSgkezM6UGFyYW1ldGVyfSkge1xcblxcdCQwXFxufVxcblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJNZXRob2RlbmRlZmluaXRpb25cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcInByb3RlY3RlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IFwicHJvdGVjdGVkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJwcm90ZWN0ZWQgXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsOiBcIlNjaGzDvHNzZWx3b3J0IHByb3RlY3RlZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGluc2VydFRleHRSdWxlczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUluc2VydFRleHRSdWxlLkluc2VydEFzU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtS2luZC5TbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIHJhbmdlOiB1bmRlZmluZWRcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwic3RhdGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogXCJzdGF0aWNcIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcInN0YXRpYyBcIixcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IFwiU2NobMO8c3NlbHdvcnQgc3RhdGljXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJwcml2YXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogXCJwcml2YXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJwcml2YXRlIFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJTY2hsw7xzc2Vsd29ydCBwcml2YXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dFJ1bGVzOiBtb25hY28ubGFuZ3VhZ2VzLkNvbXBsZXRpb25JdGVtSW5zZXJ0VGV4dFJ1bGUuSW5zZXJ0QXNTbmlwcGV0LFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLlNuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgcmFuZ2U6IHVuZGVmaW5lZFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzeW1ib2xUYWJsZSAhPSBudWxsICYmIHN5bWJvbFRhYmxlLm1ldGhvZCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGtleXdvcmRDb21wbGV0aW9uSXRlbXMgPSBrZXl3b3JkQ29tcGxldGlvbkl0ZW1zLmNvbmNhdChbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwicmV0dXJuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZmlsdGVyVGV4dDogXCJyZXR1cm5cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0OiBcInJldHVyblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbDogXCJTY2hsw7xzc2Vsd29ydCByZXR1cm5cIixcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXdvcmRDb21wbGV0aW9uSXRlbXM7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdldE92ZXJyaWRhYmxlTWV0aG9kc0NvbXBsZXRpb24oY2xhc3NDb250ZXh0OiBLbGFzcykge1xyXG5cclxuICAgICAgICBsZXQga2V5d29yZENvbXBsZXRpb25JdGVtczogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbVtdID0gW107XHJcblxyXG4gICAgICAgIGxldCBtZXRob2RzOiBNZXRob2RbXSA9IFtdO1xyXG4gICAgICAgIGxldCBjID0gY2xhc3NDb250ZXh0LmJhc2VDbGFzcztcclxuICAgICAgICB3aGlsZSAoYyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZHMgPSBtZXRob2RzLmNvbmNhdChjLm1ldGhvZHMuZmlsdGVyKChtKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAobS5pc0Fic3RyYWN0IHx8IChtLnByb2dyYW0gPT0gbnVsbCAmJiBtLmludm9rZSA9PSBudWxsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KSk7XHJcbiAgICAgICAgICAgIGMgPSBjLmJhc2VDbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IGkgb2YgY2xhc3NDb250ZXh0LmltcGxlbWVudHMpIHtcclxuICAgICAgICAgICAgbWV0aG9kcyA9IG1ldGhvZHMuY29uY2F0KGkuZ2V0TWV0aG9kcygpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZvciAobGV0IG0gb2YgbWV0aG9kcykge1xyXG5cclxuICAgICAgICAgICAgbGV0IGFscmVhZHlJbXBsZW1lbnRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICBmb3IgKGxldCBtMSBvZiBjbGFzc0NvbnRleHQubWV0aG9kcykge1xyXG4gICAgICAgICAgICAgICAgaWYgKG0xLnNpZ25hdHVyZSA9PSBtLnNpZ25hdHVyZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGFscmVhZHlJbXBsZW1lbnRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChhbHJlYWR5SW1wbGVtZW50ZWQpIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgICAgbGV0IGxhYmVsOiBzdHJpbmcgPSAobS5pc0Fic3RyYWN0ID8gXCJpbXBsZW1lbnQgXCIgOiBcIm92ZXJyaWRlIFwiKSArIG0uZ2V0Q29tcGxldGlvbkxhYmVsKCk7XHJcbiAgICAgICAgICAgIGxldCBmaWx0ZXJUZXh0ID0gbS5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICBsZXQgaW5zZXJ0VGV4dCA9IFZpc2liaWxpdHlbbS52aXNpYmlsaXR5XSArIFwiIFwiICsgKG0uZ2V0UmV0dXJuVHlwZSgpID09IG51bGwgPyBcInZvaWRcIiA6IG0uZ2V0UmV0dXJuVHlwZSgpLmlkZW50aWZpZXIpICsgXCIgXCI7XHJcbiAgICAgICAgICAgIGluc2VydFRleHQgKz0gbS5pZGVudGlmaWVyICsgXCIoXCI7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbS5nZXRQYXJhbWV0ZXJMaXN0KCkucGFyYW1ldGVycy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IHAgPSBtLmdldFBhcmFtZXRlckxpc3QoKS5wYXJhbWV0ZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSBtLmdldFBhcmFtZXRlclR5cGUoaSkuaWRlbnRpZmllciArIFwiIFwiICsgcC5pZGVudGlmaWVyO1xyXG4gICAgICAgICAgICAgICAgaWYgKGkgPCBtLmdldFBhcmFtZXRlckNvdW50KCkgLSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSBcIiwgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaW5zZXJ0VGV4dCArPSBcIikge1xcblxcdCQwXFxufVwiO1xyXG5cclxuICAgICAgICAgICAga2V5d29yZENvbXBsZXRpb25JdGVtcy5wdXNoKFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBsYWJlbCxcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWw6IChtLmlzQWJzdHJhY3QgPyBcIkltcGxlbWVudGllcmUgXCIgOiBcIsOcYmVyc2NocmVpYmUgXCIpICsgXCJkaWUgTWV0aG9kZSBcIiArIGxhYmVsICsgXCIgZGVyIEJhc2lza2xhc3NlLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGZpbHRlclRleHQ6IGZpbHRlclRleHQsXHJcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogaW5zZXJ0VGV4dCxcclxuICAgICAgICAgICAgICAgICAgICBpbnNlcnRUZXh0UnVsZXM6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1JbnNlcnRUZXh0UnVsZS5JbnNlcnRBc1NuaXBwZXQsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuU25pcHBldCxcclxuICAgICAgICAgICAgICAgICAgICByYW5nZTogdW5kZWZpbmVkXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIGtleXdvcmRDb21wbGV0aW9uSXRlbXM7XHJcblxyXG4gICAgfVxyXG5cclxufSJdfQ==