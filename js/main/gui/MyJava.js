/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
export function defineMyJava() {
    monaco.languages.register({ id: 'myJava',
        extensions: ['.learnJava'],
    });
    let conf = {
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
        onEnterRules: [
            {
                // e.g. /** | */
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                afterText: /^\s*\*\/$/,
                action: { indentAction: monaco.languages.IndentAction.IndentOutdent, appendText: ' * ' }
            },
            {
                // e.g. /** ...|
                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                action: { indentAction: monaco.languages.IndentAction.None, appendText: ' * ' }
            },
            {
                // e.g.  * ...|
                // beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                beforeText: /^(\t|(\ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                action: { indentAction: monaco.languages.IndentAction.None, appendText: '* ' }
            },
            {
                // e.g.  */|
                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
            },
            {
                // e.g.  *-----*/|
                beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                action: { indentAction: monaco.languages.IndentAction.None, removeText: 1 }
            }
        ],
        // the default separators except `@$`
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/'],
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        autoClosingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            // { open: '"', close: '"' },
            { open: '\'', close: '\'' },
        ],
        surroundingPairs: [
            { open: '{', close: '}' },
            { open: '[', close: ']' },
            { open: '(', close: ')' },
            { open: '"', close: '"' },
            { open: '\'', close: '\'' },
            { open: '<', close: '>' },
        ],
        folding: {
            markers: {
                start: new RegExp("^\\s*//\\s*(?:(?:#?region\\b)|(?:<editor-fold\\b))"),
                end: new RegExp("^\\s*//\\s*(?:(?:#?endregion\\b)|(?:</editor-fold>))")
            }
        },
    };
    let language = {
        defaultToken: '',
        tokenPostfix: '.java',
        keywords: [
            'abstract', 'continue', 'new', 'switch', 'assert', 'default',
            'goto', 'package', 'synchronized', 'private',
            'this', 'implements', 'protected', 'throw',
            'import', 'public', 'throws', 'case', 'instanceof', 'return',
            'transient', 'catch', 'extends', 'try', 'final',
            'static', 'finally', 'strictfp',
            'volatile', 'const', 'native', 'super', 'true', 'false', 'null'
        ],
        print: ['print', 'println'],
        statements: ['for', 'while', 'if', 'then', 'else', 'do', 'break', 'continue'],
        types: ['int', 'boolean', 'char', 'float', 'double', 'long', 'void', 'byte', 'short',
            'class', 'enum', 'interface', 'var'],
        operators: [
            '=', '>', '<', '!', '~', '?', ':',
            '==', '<=', '>=', '!=', '&&', '||', '++', '--',
            '+', '-', '*', '/', '&', '|', '^', '%', '<<',
            '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
            '^=', '%=', '<<=', '>>=', '>>>='
        ],
        // we include these common regular expressions
        symbols: /[=><!~?:&|+\-*\/\^%]+/,
        escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
        digits: /\d+(_+\d+)*/,
        octaldigits: /[0-7]+(_+[0-7]+)*/,
        binarydigits: /[0-1]+(_+[0-1]+)*/,
        hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,
        // The main tokenizer for our languages
        tokenizer: {
            root: [
                // identifiers and keywords
                // [/[a-zA-Z_$][\w$]*/, {
                [/\.[A-Z$ÄÖÜ][\w$äöüßÄÖÜ]*(?=\()/, {
                        cases: {
                            '@default': 'method'
                        }
                    }],
                [/[a-z_$äöü][\w$äöüßÄÖÜ]*(?=\()/, {
                        cases: {
                            '@keywords': { token: 'keyword.$0' },
                            '@statements': { token: 'statement.$0' },
                            '@types': { token: 'type.$0' },
                            '@print': { token: 'print.$0' },
                            '@default': 'method'
                        }
                    }],
                [/[a-z_$äöüß][\w$äöüßÄÖÜ]*/, {
                        cases: {
                            '@keywords': { token: 'keyword.$0' },
                            '@statements': { token: 'statement.$0' },
                            '@types': { token: 'type.$0' },
                            '@default': 'identifier'
                        }
                    }],
                [/[A-Z$ÄÖÜ][\w$äöüßÄÖÜ]*/, 'class'],
                // whitespace
                { include: '@whitespace' },
                // delimiters and operators
                [/[{}()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                        cases: {
                            '@operators': 'delimiter',
                            '@default': ''
                        }
                    }],
                // @ annotations.
                [/@\s*[a-zA-Z_\$][\w\$]*/, 'annotation'],
                // numbers
                [/(@digits)[eE]([\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/(@digits)\.(@digits)([eE][\-+]?(@digits))?[fFdD]?/, 'number.float'],
                [/0[xX](@hexdigits)[Ll]?/, 'number.hex'],
                [/0(@octaldigits)[Ll]?/, 'number.octal'],
                [/0[bB](@binarydigits)[Ll]?/, 'number.binary'],
                [/(@digits)[fFdD]/, 'number.float'],
                [/(@digits)[lL]?/, 'number'],
                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],
                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"""/, 'string', '@string'],
                [/"/, 'string', '@string'],
                // characters
                [/'[^\\']'/, 'string'],
                [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                [/'/, 'string.invalid']
            ],
            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/\/\*\*(?!\/)/, 'comment.doc', '@javadoc'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],
            comment: [
                [/[^\/*]+/, 'comment'],
                // [/\/\*/, 'comment', '@push' ],    // nested comment not allowed :-(
                // [/\/\*/,    'comment.invalid' ],    // this breaks block comments in the shape of /* //*/
                [/\*\//, 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],
            //Identical copy of comment above, except for the addition of .doc
            javadoc: [
                [/[^\/*]+/, 'comment.doc'],
                // [/\/\*/, 'comment.doc', '@push' ],    // nested comment not allowed :-(
                [/\/\*/, 'comment.doc.invalid'],
                [/\*\//, 'comment.doc', '@pop'],
                [/[\/*]/, 'comment.doc']
            ],
            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"""/, 'string', '@pop'],
                [/"/, 'string', '@pop']
            ],
        },
    };
    //@ts-ignore
    monaco.languages.setLanguageConfiguration('myJava', conf);
    //@ts-ignore
    monaco.languages.setMonarchTokensProvider('myJava', language);
    // monaco.languages.registerCompletionItemProvider("myJava", {    // Or any other language...
    //     provideCompletionItems: (model, position) => {
    //         // Retrieve the text until the current cursor's position, anything
    //         // after that doesn't really matter.
    //         var textToMatch = model.getValueInRange({
    //             startLineNumber: 1,
    //             startColumn: 1,
    //             endLineNumber: position.lineNumber,
    //             endColumn: position.column
    //         });
    //         // Return JSON array containing all completion suggestions.
    //         return {
    //             suggestions: [
    //                 // Example: io.write ()
    //                 {
    //                     label: "io.write (string)",
    //                     kind: monaco.languages.CompletionItemKind.Function,
    //                     documentation: "Writes a string to stdout.",
    //                     insertText: "io.write (\"\")",  // Escape JSON as needed.
    //                     range: {
    //                         startLineNumber: position.lineNumber,
    //                         endLineNumber: position.lineNumber,
    //                         startColumn: position.column,
    //                         endColumn: position.column
    //                     }
    //                 },  // Other items.
    //             ]
    //         };
    //     }
    // });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlKYXZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9NeUphdmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7QUFDaEcsTUFBTSxVQUFVLFlBQVk7SUFDeEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUTtRQUN4QyxVQUFVLEVBQUUsQ0FBQyxZQUFZLENBQUM7S0FFekIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxJQUFJLEdBQTJDO1FBQy9DLGdCQUFnQixFQUFFO1lBQ2Qsb0JBQW9CO1lBQ3BCLHFCQUFxQixFQUFFLG9CQUFvQjtZQUMzQyxnQkFBZ0I7WUFDaEIscUJBQXFCLEVBQUUsZUFBZTtTQUN6QztRQUNELFlBQVksRUFBRTtZQUNWO2dCQUNJLGdCQUFnQjtnQkFDaEIsVUFBVSxFQUFFLG9DQUFvQztnQkFDaEQsU0FBUyxFQUFFLFdBQVc7Z0JBQ3RCLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTthQUMzRjtZQUNEO2dCQUNJLGdCQUFnQjtnQkFDaEIsVUFBVSxFQUFFLG9DQUFvQztnQkFDaEQsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO2FBQ2xGO1lBQ0Q7Z0JBQ0ksZUFBZTtnQkFDZiwwREFBMEQ7Z0JBQzFELFVBQVUsRUFBRSx3Q0FBd0M7Z0JBQ3BELE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBRTthQUNqRjtZQUNEO2dCQUNJLFlBQVk7Z0JBQ1osVUFBVSxFQUFFLHlCQUF5QjtnQkFDckMsTUFB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ZSxDQUFDO2dCQUM3QixDQUFDLEtBQUssRUFBRSx1QkFBdUIsQ0FBQztnQkFDaEMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQztnQkFDekIsQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLE1BQU0sQ0FBQzthQUMxQjtTQUVKO0tBQ0osQ0FBQztJQUVGLFlBQVk7SUFDWixNQUFNLENBQUMsU0FBUyxDQUFDLHdCQUF3QixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMxRCxZQUFZO0lBQ1osTUFBTSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFOUQsNkZBQTZGO0lBQzdGLHFEQUFxRDtJQUNyRCw2RUFBNkU7SUFDN0UsK0NBQStDO0lBQy9DLG9EQUFvRDtJQUNwRCxrQ0FBa0M7SUFDbEMsOEJBQThCO0lBQzlCLGtEQUFrRDtJQUNsRCx5Q0FBeUM7SUFDekMsY0FBYztJQUVkLHNFQUFzRTtJQUN0RSxtQkFBbUI7SUFDbkIsNkJBQTZCO0lBQzdCLDBDQUEwQztJQUMxQyxvQkFBb0I7SUFDcEIsa0RBQWtEO0lBQ2xELDBFQUEwRTtJQUMxRSxtRUFBbUU7SUFDbkUsZ0ZBQWdGO0lBQ2hGLCtCQUErQjtJQUMvQixnRUFBZ0U7SUFDaEUsOERBQThEO0lBQzlELHdEQUF3RDtJQUN4RCxxREFBcUQ7SUFDckQsd0JBQXdCO0lBQ3hCLHNDQUFzQztJQUN0QyxnQkFBZ0I7SUFDaEIsYUFBYTtJQUNiLFFBQVE7SUFDUixNQUFNO0FBR1YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXHJcbiAqICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cclxuICogIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZS4gU2VlIExpY2Vuc2UudHh0IGluIHRoZSBwcm9qZWN0IHJvb3QgZm9yIGxpY2Vuc2UgaW5mb3JtYXRpb24uXHJcbiAqLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVmaW5lTXlKYXZhKCkge1xyXG4gICAgbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3Rlcih7IGlkOiAnbXlKYXZhJywgXHJcbiAgICBleHRlbnNpb25zOiBbJy5sZWFybkphdmEnXSxcclxuICAgIC8vICBtaW1ldHlwZXM6IFtcInRleHQveC1qYXZhLXNvdXJjZVwiLCBcInRleHQveC1qYXZhXCJdICBcclxuICAgIH0pO1xyXG5cclxuICAgIGxldCBjb25mOiBtb25hY28ubGFuZ3VhZ2VzLkxhbmd1YWdlQ29uZmlndXJhdGlvbiA9IHtcclxuICAgICAgICBpbmRlbnRhdGlvblJ1bGVzOiB7XHJcbiAgICAgICAgICAgIC8vIF4oLipcXCovKT9cXHMqXFx9LiokXHJcbiAgICAgICAgICAgIGRlY3JlYXNlSW5kZW50UGF0dGVybjogL14oLipcXCpcXC8pP1xccypcXH0uKiQvLFxyXG4gICAgICAgICAgICAvLyBeLipcXHtbXn1cIiddKiRcclxuICAgICAgICAgICAgaW5jcmVhc2VJbmRlbnRQYXR0ZXJuOiAvXi4qXFx7W159XCInXSokL1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb25FbnRlclJ1bGVzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGUuZy4gLyoqIHwgKi9cclxuICAgICAgICAgICAgICAgIGJlZm9yZVRleHQ6IC9eXFxzKlxcL1xcKlxcKig/IVxcLykoW15cXCpdfFxcKig/IVxcLykpKiQvLFxyXG4gICAgICAgICAgICAgICAgYWZ0ZXJUZXh0OiAvXlxccypcXCpcXC8kLyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogeyBpbmRlbnRBY3Rpb246IG1vbmFjby5sYW5ndWFnZXMuSW5kZW50QWN0aW9uLkluZGVudE91dGRlbnQsIGFwcGVuZFRleHQ6ICcgKiAnIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gZS5nLiAvKiogLi4ufFxyXG4gICAgICAgICAgICAgICAgYmVmb3JlVGV4dDogL15cXHMqXFwvXFwqXFwqKD8hXFwvKShbXlxcKl18XFwqKD8hXFwvKSkqJC8sXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IHsgaW5kZW50QWN0aW9uOiBtb25hY28ubGFuZ3VhZ2VzLkluZGVudEFjdGlvbi5Ob25lLCBhcHBlbmRUZXh0OiAnICogJyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGUuZy4gICogLi4ufFxyXG4gICAgICAgICAgICAgICAgLy8gYmVmb3JlVGV4dDogL14oXFx0fChcXCBcXCApKSpcXCBcXCooXFwgKFteXFwqXXxcXCooPyFcXC8pKSopPyQvLFxyXG4gICAgICAgICAgICAgICAgYmVmb3JlVGV4dDogL14oXFx0fChcXCApKSpcXCBcXCooXFwgKFteXFwqXXxcXCooPyFcXC8pKSopPyQvLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiB7IGluZGVudEFjdGlvbjogbW9uYWNvLmxhbmd1YWdlcy5JbmRlbnRBY3Rpb24uTm9uZSwgYXBwZW5kVGV4dDogJyogJyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGUuZy4gICovfFxyXG4gICAgICAgICAgICAgICAgYmVmb3JlVGV4dDogL14oXFx0fChcXCBcXCApKSpcXCBcXCpcXC9cXHMqJC8sXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IHsgaW5kZW50QWN0aW9uOiBtb25hY28ubGFuZ3VhZ2VzLkluZGVudEFjdGlvbi5Ob25lLCByZW1vdmVUZXh0OiAxIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgLy8gZS5nLiAgKi0tLS0tKi98XHJcbiAgICAgICAgICAgICAgICBiZWZvcmVUZXh0OiAvXihcXHR8KFxcIFxcICkpKlxcIFxcKlteL10qXFwqXFwvXFxzKiQvLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiB7IGluZGVudEFjdGlvbjogbW9uYWNvLmxhbmd1YWdlcy5JbmRlbnRBY3Rpb24uTm9uZSwgcmVtb3ZlVGV4dDogMSB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIC8vIHRoZSBkZWZhdWx0IHNlcGFyYXRvcnMgZXhjZXB0IGBAJGBcclxuICAgICAgICB3b3JkUGF0dGVybjogLygtP1xcZCpcXC5cXGRcXHcqKXwoW15cXGBcXH5cXCFcXCNcXCVcXF5cXCZcXCpcXChcXClcXC1cXD1cXCtcXFtcXHtcXF1cXH1cXFxcXFx8XFw7XFw6XFwnXFxcIlxcLFxcLlxcPFxcPlxcL1xcP1xcc10rKS9nLFxyXG4gICAgICAgIGNvbW1lbnRzOiB7XHJcbiAgICAgICAgICAgIGxpbmVDb21tZW50OiAnLy8nLFxyXG4gICAgICAgICAgICBibG9ja0NvbW1lbnQ6IFsnLyonLCAnKi8nXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGJyYWNrZXRzOiBbXHJcbiAgICAgICAgICAgIFsneycsICd9J10sXHJcbiAgICAgICAgICAgIFsnWycsICddJ10sXHJcbiAgICAgICAgICAgIFsnKCcsICcpJ10sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBhdXRvQ2xvc2luZ1BhaXJzOiBbXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ3snLCBjbG9zZTogJ30nIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ1snLCBjbG9zZTogJ10nIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJygnLCBjbG9zZTogJyknIH0sXHJcbiAgICAgICAgICAgIC8vIHsgb3BlbjogJ1wiJywgY2xvc2U6ICdcIicgfSxcclxuICAgICAgICAgICAgeyBvcGVuOiAnXFwnJywgY2xvc2U6ICdcXCcnIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBzdXJyb3VuZGluZ1BhaXJzOiBbXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ3snLCBjbG9zZTogJ30nIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ1snLCBjbG9zZTogJ10nIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJygnLCBjbG9zZTogJyknIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ1wiJywgY2xvc2U6ICdcIicgfSxcclxuICAgICAgICAgICAgeyBvcGVuOiAnXFwnJywgY2xvc2U6ICdcXCcnIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJzwnLCBjbG9zZTogJz4nIH0sXHJcbiAgICAgICAgXSxcclxuICAgICAgICBmb2xkaW5nOiB7XHJcbiAgICAgICAgICAgIG1hcmtlcnM6IHtcclxuICAgICAgICAgICAgICAgIHN0YXJ0OiBuZXcgUmVnRXhwKFwiXlxcXFxzKi8vXFxcXHMqKD86KD86Iz9yZWdpb25cXFxcYil8KD86PGVkaXRvci1mb2xkXFxcXGIpKVwiKSxcclxuICAgICAgICAgICAgICAgIGVuZDogbmV3IFJlZ0V4cChcIl5cXFxccyovL1xcXFxzKig/Oig/OiM/ZW5kcmVnaW9uXFxcXGIpfCg/OjwvZWRpdG9yLWZvbGQ+KSlcIilcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcblxyXG4gICAgfTtcclxuICAgIGxldCBsYW5ndWFnZSA9IHtcclxuICAgICAgICBkZWZhdWx0VG9rZW46ICcnLFxyXG4gICAgICAgIHRva2VuUG9zdGZpeDogJy5qYXZhJyxcclxuICAgICAgICBrZXl3b3JkczogW1xyXG4gICAgICAgICAgICAnYWJzdHJhY3QnLCAnY29udGludWUnLCAnbmV3JywgJ3N3aXRjaCcsICdhc3NlcnQnLCAnZGVmYXVsdCcsXHJcbiAgICAgICAgICAgICdnb3RvJywgJ3BhY2thZ2UnLCAnc3luY2hyb25pemVkJywgJ3ByaXZhdGUnLFxyXG4gICAgICAgICAgICAndGhpcycsICdpbXBsZW1lbnRzJywgJ3Byb3RlY3RlZCcsICd0aHJvdycsXHJcbiAgICAgICAgICAgICdpbXBvcnQnLCAncHVibGljJywgJ3Rocm93cycsICdjYXNlJywgJ2luc3RhbmNlb2YnLCAncmV0dXJuJyxcclxuICAgICAgICAgICAgJ3RyYW5zaWVudCcsICdjYXRjaCcsICdleHRlbmRzJywgJ3RyeScsICdmaW5hbCcsXHJcbiAgICAgICAgICAgICdzdGF0aWMnLCAnZmluYWxseScsICdzdHJpY3RmcCcsXHJcbiAgICAgICAgICAgICd2b2xhdGlsZScsICdjb25zdCcsICduYXRpdmUnLCAnc3VwZXInLCAndHJ1ZScsICdmYWxzZScsICdudWxsJ1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcHJpbnQ6IFsncHJpbnQnLCAncHJpbnRsbiddLFxyXG4gICAgICAgIHN0YXRlbWVudHM6IFsnZm9yJywgJ3doaWxlJywgJ2lmJywgJ3RoZW4nLCAnZWxzZScsICdkbycsICdicmVhaycsICdjb250aW51ZSddLFxyXG4gICAgICAgIHR5cGVzOiBbJ2ludCcsICdib29sZWFuJywgJ2NoYXInLCAnZmxvYXQnLCAnZG91YmxlJywgJ2xvbmcnLCAndm9pZCcsICdieXRlJywgJ3Nob3J0JyxcclxuICAgICAgICAnY2xhc3MnLCAnZW51bScsICdpbnRlcmZhY2UnLCAndmFyJ10sXHJcbiAgICAgICAgb3BlcmF0b3JzOiBbXHJcbiAgICAgICAgICAgICc9JywgJz4nLCAnPCcsICchJywgJ34nLCAnPycsICc6JyxcclxuICAgICAgICAgICAgJz09JywgJzw9JywgJz49JywgJyE9JywgJyYmJywgJ3x8JywgJysrJywgJy0tJyxcclxuICAgICAgICAgICAgJysnLCAnLScsICcqJywgJy8nLCAnJicsICd8JywgJ14nLCAnJScsICc8PCcsXHJcbiAgICAgICAgICAgICc+PicsICc+Pj4nLCAnKz0nLCAnLT0nLCAnKj0nLCAnLz0nLCAnJj0nLCAnfD0nLFxyXG4gICAgICAgICAgICAnXj0nLCAnJT0nLCAnPDw9JywgJz4+PScsICc+Pj49J1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgLy8gd2UgaW5jbHVkZSB0aGVzZSBjb21tb24gcmVndWxhciBleHByZXNzaW9uc1xyXG4gICAgICAgIHN5bWJvbHM6IC9bPT48IX4/OiZ8K1xcLSpcXC9cXF4lXSsvLFxyXG4gICAgICAgIGVzY2FwZXM6IC9cXFxcKD86W2FiZm5ydHZcXFxcXCInXXx4WzAtOUEtRmEtZl17MSw0fXx1WzAtOUEtRmEtZl17NH18VVswLTlBLUZhLWZdezh9KS8sXHJcbiAgICAgICAgZGlnaXRzOiAvXFxkKyhfK1xcZCspKi8sXHJcbiAgICAgICAgb2N0YWxkaWdpdHM6IC9bMC03XSsoXytbMC03XSspKi8sXHJcbiAgICAgICAgYmluYXJ5ZGlnaXRzOiAvWzAtMV0rKF8rWzAtMV0rKSovLFxyXG4gICAgICAgIGhleGRpZ2l0czogL1tbMC05YS1mQS1GXSsoXytbMC05YS1mQS1GXSspKi8sXHJcbiAgICAgICAgLy8gVGhlIG1haW4gdG9rZW5pemVyIGZvciBvdXIgbGFuZ3VhZ2VzXHJcbiAgICAgICAgdG9rZW5pemVyOiB7XHJcbiAgICAgICAgICAgIHJvb3Q6IFtcclxuICAgICAgICAgICAgICAgIC8vIGlkZW50aWZpZXJzIGFuZCBrZXl3b3Jkc1xyXG4gICAgICAgICAgICAgICAgLy8gWy9bYS16QS1aXyRdW1xcdyRdKi8sIHtcclxuICAgICAgICAgICAgICAgIFsvXFwuW0EtWiTDhMOWw5xdW1xcdyTDpMO2w7zDn8OEw5bDnF0qKD89XFwoKS8sIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnbWV0aG9kJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgWy9bYS16XyTDpMO2w7xdW1xcdyTDpMO2w7zDn8OEw5bDnF0qKD89XFwoKS8sIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGtleXdvcmRzJzogeyB0b2tlbjogJ2tleXdvcmQuJDAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAc3RhdGVtZW50cyc6IHsgdG9rZW46ICdzdGF0ZW1lbnQuJDAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAdHlwZXMnOiB7IHRva2VuOiAndHlwZS4kMCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BwcmludCc6IHsgdG9rZW46ICdwcmludC4kMCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ21ldGhvZCdcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFsvW2Etel8kw6TDtsO8w59dW1xcdyTDpMO2w7zDn8OEw5bDnF0qLywge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAa2V5d29yZHMnOiB7IHRva2VuOiAna2V5d29yZC4kMCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BzdGF0ZW1lbnRzJzogeyB0b2tlbjogJ3N0YXRlbWVudC4kMCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0B0eXBlcyc6IHsgdG9rZW46ICd0eXBlLiQwJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnaWRlbnRpZmllcidcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIFsvW0EtWiTDhMOWw5xdW1xcdyTDpMO2w7zDn8OEw5bDnF0qLywgJ2NsYXNzJ10sXHJcbiAgICAgICAgICAgICAgICAvLyB3aGl0ZXNwYWNlXHJcbiAgICAgICAgICAgICAgICB7IGluY2x1ZGU6ICdAd2hpdGVzcGFjZScgfSxcclxuICAgICAgICAgICAgICAgIC8vIGRlbGltaXRlcnMgYW5kIG9wZXJhdG9yc1xyXG4gICAgICAgICAgICAgICAgWy9be30oKVxcW1xcXV0vLCAnQGJyYWNrZXRzJ10sXHJcbiAgICAgICAgICAgICAgICBbL1s8Pl0oPyFAc3ltYm9scykvLCAnQGJyYWNrZXRzJ10sXHJcbiAgICAgICAgICAgICAgICBbL0BzeW1ib2xzLywge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAb3BlcmF0b3JzJzogJ2RlbGltaXRlcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAvLyBAIGFubm90YXRpb25zLlxyXG4gICAgICAgICAgICAgICAgWy9AXFxzKlthLXpBLVpfXFwkXVtcXHdcXCRdKi8sICdhbm5vdGF0aW9uJ10sXHJcbiAgICAgICAgICAgICAgICAvLyBudW1iZXJzXHJcbiAgICAgICAgICAgICAgICBbLyhAZGlnaXRzKVtlRV0oW1xcLStdPyhAZGlnaXRzKSk/W2ZGZERdPy8sICdudW1iZXIuZmxvYXQnXSxcclxuICAgICAgICAgICAgICAgIFsvKEBkaWdpdHMpXFwuKEBkaWdpdHMpKFtlRV1bXFwtK10/KEBkaWdpdHMpKT9bZkZkRF0/LywgJ251bWJlci5mbG9hdCddLFxyXG4gICAgICAgICAgICAgICAgWy8wW3hYXShAaGV4ZGlnaXRzKVtMbF0/LywgJ251bWJlci5oZXgnXSxcclxuICAgICAgICAgICAgICAgIFsvMChAb2N0YWxkaWdpdHMpW0xsXT8vLCAnbnVtYmVyLm9jdGFsJ10sXHJcbiAgICAgICAgICAgICAgICBbLzBbYkJdKEBiaW5hcnlkaWdpdHMpW0xsXT8vLCAnbnVtYmVyLmJpbmFyeSddLFxyXG4gICAgICAgICAgICAgICAgWy8oQGRpZ2l0cylbZkZkRF0vLCAnbnVtYmVyLmZsb2F0J10sXHJcbiAgICAgICAgICAgICAgICBbLyhAZGlnaXRzKVtsTF0/LywgJ251bWJlciddLFxyXG4gICAgICAgICAgICAgICAgLy8gZGVsaW1pdGVyOiBhZnRlciBudW1iZXIgYmVjYXVzZSBvZiAuXFxkIGZsb2F0c1xyXG4gICAgICAgICAgICAgICAgWy9bOywuXS8sICdkZWxpbWl0ZXInXSxcclxuICAgICAgICAgICAgICAgIC8vIHN0cmluZ3NcclxuICAgICAgICAgICAgICAgIFsvXCIoW15cIlxcXFxdfFxcXFwuKSokLywgJ3N0cmluZy5pbnZhbGlkJ10sXHJcbiAgICAgICAgICAgICAgICBbL1wiXCJcIi8sICdzdHJpbmcnLCAnQHN0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgWy9cIi8sICdzdHJpbmcnLCAnQHN0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgLy8gY2hhcmFjdGVyc1xyXG4gICAgICAgICAgICAgICAgWy8nW15cXFxcJ10nLywgJ3N0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgWy8oJykoQGVzY2FwZXMpKCcpLywgWydzdHJpbmcnLCAnc3RyaW5nLmVzY2FwZScsICdzdHJpbmcnXV0sXHJcbiAgICAgICAgICAgICAgICBbLycvLCAnc3RyaW5nLmludmFsaWQnXVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB3aGl0ZXNwYWNlOiBbXHJcbiAgICAgICAgICAgICAgICBbL1sgXFx0XFxyXFxuXSsvLCAnJ10sXHJcbiAgICAgICAgICAgICAgICBbL1xcL1xcKlxcKig/IVxcLykvLCAnY29tbWVudC5kb2MnLCAnQGphdmFkb2MnXSxcclxuICAgICAgICAgICAgICAgIFsvXFwvXFwqLywgJ2NvbW1lbnQnLCAnQGNvbW1lbnQnXSxcclxuICAgICAgICAgICAgICAgIFsvXFwvXFwvLiokLywgJ2NvbW1lbnQnXSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgY29tbWVudDogW1xyXG4gICAgICAgICAgICAgICAgWy9bXlxcLypdKy8sICdjb21tZW50J10sXHJcbiAgICAgICAgICAgICAgICAvLyBbL1xcL1xcKi8sICdjb21tZW50JywgJ0BwdXNoJyBdLCAgICAvLyBuZXN0ZWQgY29tbWVudCBub3QgYWxsb3dlZCA6LShcclxuICAgICAgICAgICAgICAgIC8vIFsvXFwvXFwqLywgICAgJ2NvbW1lbnQuaW52YWxpZCcgXSwgICAgLy8gdGhpcyBicmVha3MgYmxvY2sgY29tbWVudHMgaW4gdGhlIHNoYXBlIG9mIC8qIC8vKi9cclxuICAgICAgICAgICAgICAgIFsvXFwqXFwvLywgJ2NvbW1lbnQnLCAnQHBvcCddLFxyXG4gICAgICAgICAgICAgICAgWy9bXFwvKl0vLCAnY29tbWVudCddXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIC8vSWRlbnRpY2FsIGNvcHkgb2YgY29tbWVudCBhYm92ZSwgZXhjZXB0IGZvciB0aGUgYWRkaXRpb24gb2YgLmRvY1xyXG4gICAgICAgICAgICBqYXZhZG9jOiBbXHJcbiAgICAgICAgICAgICAgICBbL1teXFwvKl0rLywgJ2NvbW1lbnQuZG9jJ10sXHJcbiAgICAgICAgICAgICAgICAvLyBbL1xcL1xcKi8sICdjb21tZW50LmRvYycsICdAcHVzaCcgXSwgICAgLy8gbmVzdGVkIGNvbW1lbnQgbm90IGFsbG93ZWQgOi0oXHJcbiAgICAgICAgICAgICAgICBbL1xcL1xcKi8sICdjb21tZW50LmRvYy5pbnZhbGlkJ10sXHJcbiAgICAgICAgICAgICAgICBbL1xcKlxcLy8sICdjb21tZW50LmRvYycsICdAcG9wJ10sXHJcbiAgICAgICAgICAgICAgICBbL1tcXC8qXS8sICdjb21tZW50LmRvYyddXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHN0cmluZzogW1xyXG4gICAgICAgICAgICAgICAgWy9bXlxcXFxcIl0rLywgJ3N0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgWy9AZXNjYXBlcy8sICdzdHJpbmcuZXNjYXBlJ10sXHJcbiAgICAgICAgICAgICAgICBbL1xcXFwuLywgJ3N0cmluZy5lc2NhcGUuaW52YWxpZCddLFxyXG4gICAgICAgICAgICAgICAgWy9cIlwiXCIvLCAnc3RyaW5nJywgJ0Bwb3AnXSxcclxuICAgICAgICAgICAgICAgIFsvXCIvLCAnc3RyaW5nJywgJ0Bwb3AnXVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9LFxyXG4gICAgfTtcclxuXHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIG1vbmFjby5sYW5ndWFnZXMuc2V0TGFuZ3VhZ2VDb25maWd1cmF0aW9uKCdteUphdmEnLCBjb25mKTtcclxuICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgbW9uYWNvLmxhbmd1YWdlcy5zZXRNb25hcmNoVG9rZW5zUHJvdmlkZXIoJ215SmF2YScsIGxhbmd1YWdlKTtcclxuXHJcbiAgICAvLyBtb25hY28ubGFuZ3VhZ2VzLnJlZ2lzdGVyQ29tcGxldGlvbkl0ZW1Qcm92aWRlcihcIm15SmF2YVwiLCB7ICAgIC8vIE9yIGFueSBvdGhlciBsYW5ndWFnZS4uLlxyXG4gICAgLy8gICAgIHByb3ZpZGVDb21wbGV0aW9uSXRlbXM6IChtb2RlbCwgcG9zaXRpb24pID0+IHtcclxuICAgIC8vICAgICAgICAgLy8gUmV0cmlldmUgdGhlIHRleHQgdW50aWwgdGhlIGN1cnJlbnQgY3Vyc29yJ3MgcG9zaXRpb24sIGFueXRoaW5nXHJcbiAgICAvLyAgICAgICAgIC8vIGFmdGVyIHRoYXQgZG9lc24ndCByZWFsbHkgbWF0dGVyLlxyXG4gICAgLy8gICAgICAgICB2YXIgdGV4dFRvTWF0Y2ggPSBtb2RlbC5nZXRWYWx1ZUluUmFuZ2Uoe1xyXG4gICAgLy8gICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiAxLFxyXG4gICAgLy8gICAgICAgICAgICAgc3RhcnRDb2x1bW46IDEsXHJcbiAgICAvLyAgICAgICAgICAgICBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLFxyXG4gICAgLy8gICAgICAgICAgICAgZW5kQ29sdW1uOiBwb3NpdGlvbi5jb2x1bW5cclxuICAgIC8vICAgICAgICAgfSk7XHJcblxyXG4gICAgLy8gICAgICAgICAvLyBSZXR1cm4gSlNPTiBhcnJheSBjb250YWluaW5nIGFsbCBjb21wbGV0aW9uIHN1Z2dlc3Rpb25zLlxyXG4gICAgLy8gICAgICAgICByZXR1cm4ge1xyXG4gICAgLy8gICAgICAgICAgICAgc3VnZ2VzdGlvbnM6IFtcclxuICAgIC8vICAgICAgICAgICAgICAgICAvLyBFeGFtcGxlOiBpby53cml0ZSAoKVxyXG4gICAgLy8gICAgICAgICAgICAgICAgIHtcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiaW8ud3JpdGUgKHN0cmluZylcIixcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAga2luZDogbW9uYWNvLmxhbmd1YWdlcy5Db21wbGV0aW9uSXRlbUtpbmQuRnVuY3Rpb24sXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGRvY3VtZW50YXRpb246IFwiV3JpdGVzIGEgc3RyaW5nIHRvIHN0ZG91dC5cIixcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgaW5zZXJ0VGV4dDogXCJpby53cml0ZSAoXFxcIlxcXCIpXCIsICAvLyBFc2NhcGUgSlNPTiBhcyBuZWVkZWQuXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBzdGFydExpbmVOdW1iZXI6IHBvc2l0aW9uLmxpbmVOdW1iZXIsXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBlbmRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLFxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRDb2x1bW46IHBvc2l0aW9uLmNvbHVtbixcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgIC8vICAgICAgICAgICAgICAgICB9LCAgLy8gT3RoZXIgaXRlbXMuXHJcbiAgICAvLyAgICAgICAgICAgICBdXHJcbiAgICAvLyAgICAgICAgIH07XHJcbiAgICAvLyAgICAgfVxyXG4gICAgLy8gfSk7XHJcblxyXG5cclxufSJdfQ==