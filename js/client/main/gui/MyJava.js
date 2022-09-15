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
                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
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
            { open: '"', close: '"' },
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
            'class', 'enum', 'interface'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlKYXZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9NeUphdmEudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztnR0FHZ0c7QUFDaEcsTUFBTSxVQUFVLFlBQVk7SUFDeEIsTUFBTSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLEVBQUUsUUFBUTtRQUN4QyxVQUFVLEVBQUUsQ0FBQyxZQUFZLENBQUM7S0FFekIsQ0FBQyxDQUFDO0lBRUgsSUFBSSxJQUFJLEdBQTJDO1FBQy9DLGdCQUFnQixFQUFFO1lBQ2Qsb0JBQW9CO1lBQ3BCLHFCQUFxQixFQUFFLG9CQUFvQjtZQUMzQyxnQkFBZ0I7WUFDaEIscUJBQXFCLEVBQUUsZUFBZTtTQUN6QztRQUNELFlBQVksRUFBRTtZQUNWO2dCQUNJLGdCQUFnQjtnQkFDaEIsVUFBVSxFQUFFLG9DQUFvQztnQkFDaEQsU0FBUyxFQUFFLFdBQVc7Z0JBQ3RCLE1BQU0sRUFBRSxFQUFFLFlBQVksRUFBRSxNQUFNLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRTthQUMzRjtZQUNEO2dCQUNJLGdCQUFnQjtnQkFDaEIsVUFBVSxFQUFFLG9DQUFvQztnQkFDaEQsTUFBTSxFQUFFLEVBQUUsWUFBWSxFQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFO2FBQ2xGO1lBQ0Q7Z0JBQ0ksZUFBZTtnQkFDZixVQUFVLEVBQUUsMENBQTBDO2dCQUN0RCxNQUFNLEVBQUUsRUFBRSxZQUFZLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUU7YUFDakY7WUFDRDtnQkFDSSxZQUFZO2dCQUNaLFVBQVUsRUFBRSx5QkFBeUI7Z0JBQ3JDLE1BQU0sRUFBRSxFQUFF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SUFFRixZQUFZO0lBQ1osTUFBTSxDQUFDLFNBQVMsQ0FBQyx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUQsWUFBWTtJQUNaLE1BQU0sQ0FBQyxTQUFTLENBQUMsd0JBQXdCLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRTlELDZGQUE2RjtJQUM3RixxREFBcUQ7SUFDckQsNkVBQTZFO0lBQzdFLCtDQUErQztJQUMvQyxvREFBb0Q7SUFDcEQsa0NBQWtDO0lBQ2xDLDhCQUE4QjtJQUM5QixrREFBa0Q7SUFDbEQseUNBQXlDO0lBQ3pDLGNBQWM7SUFFZCxzRUFBc0U7SUFDdEUsbUJBQW1CO0lBQ25CLDZCQUE2QjtJQUM3QiwwQ0FBMEM7SUFDMUMsb0JBQW9CO0lBQ3BCLGtEQUFrRDtJQUNsRCwwRUFBMEU7SUFDMUUsbUVBQW1FO0lBQ25FLGdGQUFnRjtJQUNoRiwrQkFBK0I7SUFDL0IsZ0VBQWdFO0lBQ2hFLDhEQUE4RDtJQUM5RCx3REFBd0Q7SUFDeEQscURBQXFEO0lBQ3JELHdCQUF3QjtJQUN4QixzQ0FBc0M7SUFDdEMsZ0JBQWdCO0lBQ2hCLGFBQWE7SUFDYixRQUFRO0lBQ1IsTUFBTTtBQUdWLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG4gKiAgQ29weXJpZ2h0IChjKSBNaWNyb3NvZnQgQ29ycG9yYXRpb24uIEFsbCByaWdodHMgcmVzZXJ2ZWQuXHJcbiAqICBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIExpY2Vuc2UuIFNlZSBMaWNlbnNlLnR4dCBpbiB0aGUgcHJvamVjdCByb290IGZvciBsaWNlbnNlIGluZm9ybWF0aW9uLlxyXG4gKi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZU15SmF2YSgpIHtcclxuICAgIG1vbmFjby5sYW5ndWFnZXMucmVnaXN0ZXIoeyBpZDogJ215SmF2YScsIFxyXG4gICAgZXh0ZW5zaW9uczogWycubGVhcm5KYXZhJ10sXHJcbiAgICAvLyAgbWltZXR5cGVzOiBbXCJ0ZXh0L3gtamF2YS1zb3VyY2VcIiwgXCJ0ZXh0L3gtamF2YVwiXSAgXHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgY29uZjogbW9uYWNvLmxhbmd1YWdlcy5MYW5ndWFnZUNvbmZpZ3VyYXRpb24gPSB7XHJcbiAgICAgICAgaW5kZW50YXRpb25SdWxlczoge1xyXG4gICAgICAgICAgICAvLyBeKC4qXFwqLyk/XFxzKlxcfS4qJFxyXG4gICAgICAgICAgICBkZWNyZWFzZUluZGVudFBhdHRlcm46IC9eKC4qXFwqXFwvKT9cXHMqXFx9LiokLyxcclxuICAgICAgICAgICAgLy8gXi4qXFx7W159XCInXSokXHJcbiAgICAgICAgICAgIGluY3JlYXNlSW5kZW50UGF0dGVybjogL14uKlxce1tefVwiJ10qJC9cclxuICAgICAgICB9LFxyXG4gICAgICAgIG9uRW50ZXJSdWxlczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBlLmcuIC8qKiB8ICovXHJcbiAgICAgICAgICAgICAgICBiZWZvcmVUZXh0OiAvXlxccypcXC9cXCpcXCooPyFcXC8pKFteXFwqXXxcXCooPyFcXC8pKSokLyxcclxuICAgICAgICAgICAgICAgIGFmdGVyVGV4dDogL15cXHMqXFwqXFwvJC8sXHJcbiAgICAgICAgICAgICAgICBhY3Rpb246IHsgaW5kZW50QWN0aW9uOiBtb25hY28ubGFuZ3VhZ2VzLkluZGVudEFjdGlvbi5JbmRlbnRPdXRkZW50LCBhcHBlbmRUZXh0OiAnICogJyB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGUuZy4gLyoqIC4uLnxcclxuICAgICAgICAgICAgICAgIGJlZm9yZVRleHQ6IC9eXFxzKlxcL1xcKlxcKig/IVxcLykoW15cXCpdfFxcKig/IVxcLykpKiQvLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiB7IGluZGVudEFjdGlvbjogbW9uYWNvLmxhbmd1YWdlcy5JbmRlbnRBY3Rpb24uTm9uZSwgYXBwZW5kVGV4dDogJyAqICcgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBlLmcuICAqIC4uLnxcclxuICAgICAgICAgICAgICAgIGJlZm9yZVRleHQ6IC9eKFxcdHwoXFwgXFwgKSkqXFwgXFwqKFxcIChbXlxcKl18XFwqKD8hXFwvKSkqKT8kLyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogeyBpbmRlbnRBY3Rpb246IG1vbmFjby5sYW5ndWFnZXMuSW5kZW50QWN0aW9uLk5vbmUsIGFwcGVuZFRleHQ6ICcqICcgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyBlLmcuICAqL3xcclxuICAgICAgICAgICAgICAgIGJlZm9yZVRleHQ6IC9eKFxcdHwoXFwgXFwgKSkqXFwgXFwqXFwvXFxzKiQvLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiB7IGluZGVudEFjdGlvbjogbW9uYWNvLmxhbmd1YWdlcy5JbmRlbnRBY3Rpb24uTm9uZSwgcmVtb3ZlVGV4dDogMSB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIC8vIGUuZy4gICotLS0tLSovfFxyXG4gICAgICAgICAgICAgICAgYmVmb3JlVGV4dDogL14oXFx0fChcXCBcXCApKSpcXCBcXCpbXi9dKlxcKlxcL1xccyokLyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbjogeyBpbmRlbnRBY3Rpb246IG1vbmFjby5sYW5ndWFnZXMuSW5kZW50QWN0aW9uLk5vbmUsIHJlbW92ZVRleHQ6IDEgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICAvLyB0aGUgZGVmYXVsdCBzZXBhcmF0b3JzIGV4Y2VwdCBgQCRgXHJcbiAgICAgICAgd29yZFBhdHRlcm46IC8oLT9cXGQqXFwuXFxkXFx3Kil8KFteXFxgXFx+XFwhXFwjXFwlXFxeXFwmXFwqXFwoXFwpXFwtXFw9XFwrXFxbXFx7XFxdXFx9XFxcXFxcfFxcO1xcOlxcJ1xcXCJcXCxcXC5cXDxcXD5cXC9cXD9cXHNdKykvZyxcclxuICAgICAgICBjb21tZW50czoge1xyXG4gICAgICAgICAgICBsaW5lQ29tbWVudDogJy8vJyxcclxuICAgICAgICAgICAgYmxvY2tDb21tZW50OiBbJy8qJywgJyovJ10sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBicmFja2V0czogW1xyXG4gICAgICAgICAgICBbJ3snLCAnfSddLFxyXG4gICAgICAgICAgICBbJ1snLCAnXSddLFxyXG4gICAgICAgICAgICBbJygnLCAnKSddLFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgYXV0b0Nsb3NpbmdQYWlyczogW1xyXG4gICAgICAgICAgICB7IG9wZW46ICd7JywgY2xvc2U6ICd9JyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICdbJywgY2xvc2U6ICddJyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICcoJywgY2xvc2U6ICcpJyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICdcIicsIGNsb3NlOiAnXCInIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ1xcJycsIGNsb3NlOiAnXFwnJyB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgc3Vycm91bmRpbmdQYWlyczogW1xyXG4gICAgICAgICAgICB7IG9wZW46ICd7JywgY2xvc2U6ICd9JyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICdbJywgY2xvc2U6ICddJyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICcoJywgY2xvc2U6ICcpJyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICdcIicsIGNsb3NlOiAnXCInIH0sXHJcbiAgICAgICAgICAgIHsgb3BlbjogJ1xcJycsIGNsb3NlOiAnXFwnJyB9LFxyXG4gICAgICAgICAgICB7IG9wZW46ICc8JywgY2xvc2U6ICc+JyB9LFxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgZm9sZGluZzoge1xyXG4gICAgICAgICAgICBtYXJrZXJzOiB7XHJcbiAgICAgICAgICAgICAgICBzdGFydDogbmV3IFJlZ0V4cChcIl5cXFxccyovL1xcXFxzKig/Oig/OiM/cmVnaW9uXFxcXGIpfCg/OjxlZGl0b3ItZm9sZFxcXFxiKSlcIiksXHJcbiAgICAgICAgICAgICAgICBlbmQ6IG5ldyBSZWdFeHAoXCJeXFxcXHMqLy9cXFxccyooPzooPzojP2VuZHJlZ2lvblxcXFxiKXwoPzo8L2VkaXRvci1mb2xkPikpXCIpXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG5cclxuICAgIH07XHJcbiAgICBsZXQgbGFuZ3VhZ2UgPSB7XHJcbiAgICAgICAgZGVmYXVsdFRva2VuOiAnJyxcclxuICAgICAgICB0b2tlblBvc3RmaXg6ICcuamF2YScsXHJcbiAgICAgICAga2V5d29yZHM6IFtcclxuICAgICAgICAgICAgJ2Fic3RyYWN0JywgJ2NvbnRpbnVlJywgJ25ldycsICdzd2l0Y2gnLCAnYXNzZXJ0JywgJ2RlZmF1bHQnLFxyXG4gICAgICAgICAgICAnZ290bycsICdwYWNrYWdlJywgJ3N5bmNocm9uaXplZCcsICdwcml2YXRlJyxcclxuICAgICAgICAgICAgJ3RoaXMnLCAnaW1wbGVtZW50cycsICdwcm90ZWN0ZWQnLCAndGhyb3cnLFxyXG4gICAgICAgICAgICAnaW1wb3J0JywgJ3B1YmxpYycsICd0aHJvd3MnLCAnY2FzZScsICdpbnN0YW5jZW9mJywgJ3JldHVybicsXHJcbiAgICAgICAgICAgICd0cmFuc2llbnQnLCAnY2F0Y2gnLCAnZXh0ZW5kcycsICd0cnknLCAnZmluYWwnLFxyXG4gICAgICAgICAgICAnc3RhdGljJywgJ2ZpbmFsbHknLCAnc3RyaWN0ZnAnLFxyXG4gICAgICAgICAgICAndm9sYXRpbGUnLCAnY29uc3QnLCAnbmF0aXZlJywgJ3N1cGVyJywgJ3RydWUnLCAnZmFsc2UnLCAnbnVsbCdcclxuICAgICAgICBdLFxyXG4gICAgICAgIHByaW50OiBbJ3ByaW50JywgJ3ByaW50bG4nXSxcclxuICAgICAgICBzdGF0ZW1lbnRzOiBbJ2ZvcicsICd3aGlsZScsICdpZicsICd0aGVuJywgJ2Vsc2UnLCAnZG8nLCAnYnJlYWsnLCAnY29udGludWUnXSxcclxuICAgICAgICB0eXBlczogWydpbnQnLCAnYm9vbGVhbicsICdjaGFyJywgJ2Zsb2F0JywgJ2RvdWJsZScsICdsb25nJywgJ3ZvaWQnLCAnYnl0ZScsICdzaG9ydCcsXHJcbiAgICAgICAgJ2NsYXNzJywgJ2VudW0nLCAnaW50ZXJmYWNlJ10sXHJcbiAgICAgICAgb3BlcmF0b3JzOiBbXHJcbiAgICAgICAgICAgICc9JywgJz4nLCAnPCcsICchJywgJ34nLCAnPycsICc6JyxcclxuICAgICAgICAgICAgJz09JywgJzw9JywgJz49JywgJyE9JywgJyYmJywgJ3x8JywgJysrJywgJy0tJyxcclxuICAgICAgICAgICAgJysnLCAnLScsICcqJywgJy8nLCAnJicsICd8JywgJ14nLCAnJScsICc8PCcsXHJcbiAgICAgICAgICAgICc+PicsICc+Pj4nLCAnKz0nLCAnLT0nLCAnKj0nLCAnLz0nLCAnJj0nLCAnfD0nLFxyXG4gICAgICAgICAgICAnXj0nLCAnJT0nLCAnPDw9JywgJz4+PScsICc+Pj49J1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgLy8gd2UgaW5jbHVkZSB0aGVzZSBjb21tb24gcmVndWxhciBleHByZXNzaW9uc1xyXG4gICAgICAgIHN5bWJvbHM6IC9bPT48IX4/OiZ8K1xcLSpcXC9cXF4lXSsvLFxyXG4gICAgICAgIGVzY2FwZXM6IC9cXFxcKD86W2FiZm5ydHZcXFxcXCInXXx4WzAtOUEtRmEtZl17MSw0fXx1WzAtOUEtRmEtZl17NH18VVswLTlBLUZhLWZdezh9KS8sXHJcbiAgICAgICAgZGlnaXRzOiAvXFxkKyhfK1xcZCspKi8sXHJcbiAgICAgICAgb2N0YWxkaWdpdHM6IC9bMC03XSsoXytbMC03XSspKi8sXHJcbiAgICAgICAgYmluYXJ5ZGlnaXRzOiAvWzAtMV0rKF8rWzAtMV0rKSovLFxyXG4gICAgICAgIGhleGRpZ2l0czogL1tbMC05YS1mQS1GXSsoXytbMC05YS1mQS1GXSspKi8sXHJcbiAgICAgICAgLy8gVGhlIG1haW4gdG9rZW5pemVyIGZvciBvdXIgbGFuZ3VhZ2VzXHJcbiAgICAgICAgdG9rZW5pemVyOiB7XHJcbiAgICAgICAgICAgIHJvb3Q6IFtcclxuICAgICAgICAgICAgICAgIC8vIGlkZW50aWZpZXJzIGFuZCBrZXl3b3Jkc1xyXG4gICAgICAgICAgICAgICAgLy8gWy9bYS16QS1aXyRdW1xcdyRdKi8sIHtcclxuICAgICAgICAgICAgICAgIFsvW2Etel8kw6TDtsO8XVtcXHckw6TDtsO8w5/DhMOWw5xdKig/PVxcKCkvLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BrZXl3b3Jkcyc6IHsgdG9rZW46ICdrZXl3b3JkLiQwJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQHN0YXRlbWVudHMnOiB7IHRva2VuOiAnc3RhdGVtZW50LiQwJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQHR5cGVzJzogeyB0b2tlbjogJ3R5cGUuJDAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAcHJpbnQnOiB7IHRva2VuOiAncHJpbnQuJDAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAZGVmYXVsdCc6ICdtZXRob2QnXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICBbL1thLXpfJMOkw7bDvMOfXVtcXHckw6TDtsO8w5/DhMOWw5xdKi8sIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGtleXdvcmRzJzogeyB0b2tlbjogJ2tleXdvcmQuJDAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAc3RhdGVtZW50cyc6IHsgdG9rZW46ICdzdGF0ZW1lbnQuJDAnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdAdHlwZXMnOiB7IHRva2VuOiAndHlwZS4kMCcgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ0BkZWZhdWx0JzogJ2lkZW50aWZpZXInXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICBbL1tBLVokw4TDlsOcXVtcXHckw6TDtsO8w5/DhMOWw5xdKi8sICdjbGFzcyddLFxyXG4gICAgICAgICAgICAgICAgLy8gd2hpdGVzcGFjZVxyXG4gICAgICAgICAgICAgICAgeyBpbmNsdWRlOiAnQHdoaXRlc3BhY2UnIH0sXHJcbiAgICAgICAgICAgICAgICAvLyBkZWxpbWl0ZXJzIGFuZCBvcGVyYXRvcnNcclxuICAgICAgICAgICAgICAgIFsvW3t9KClcXFtcXF1dLywgJ0BicmFja2V0cyddLFxyXG4gICAgICAgICAgICAgICAgWy9bPD5dKD8hQHN5bWJvbHMpLywgJ0BicmFja2V0cyddLFxyXG4gICAgICAgICAgICAgICAgWy9Ac3ltYm9scy8sIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXNlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQG9wZXJhdG9ycyc6ICdkZWxpbWl0ZXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAnQGRlZmF1bHQnOiAnJ1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgLy8gQCBhbm5vdGF0aW9ucy5cclxuICAgICAgICAgICAgICAgIFsvQFxccypbYS16QS1aX1xcJF1bXFx3XFwkXSovLCAnYW5ub3RhdGlvbiddLFxyXG4gICAgICAgICAgICAgICAgLy8gbnVtYmVyc1xyXG4gICAgICAgICAgICAgICAgWy8oQGRpZ2l0cylbZUVdKFtcXC0rXT8oQGRpZ2l0cykpP1tmRmREXT8vLCAnbnVtYmVyLmZsb2F0J10sXHJcbiAgICAgICAgICAgICAgICBbLyhAZGlnaXRzKVxcLihAZGlnaXRzKShbZUVdW1xcLStdPyhAZGlnaXRzKSk/W2ZGZERdPy8sICdudW1iZXIuZmxvYXQnXSxcclxuICAgICAgICAgICAgICAgIFsvMFt4WF0oQGhleGRpZ2l0cylbTGxdPy8sICdudW1iZXIuaGV4J10sXHJcbiAgICAgICAgICAgICAgICBbLzAoQG9jdGFsZGlnaXRzKVtMbF0/LywgJ251bWJlci5vY3RhbCddLFxyXG4gICAgICAgICAgICAgICAgWy8wW2JCXShAYmluYXJ5ZGlnaXRzKVtMbF0/LywgJ251bWJlci5iaW5hcnknXSxcclxuICAgICAgICAgICAgICAgIFsvKEBkaWdpdHMpW2ZGZERdLywgJ251bWJlci5mbG9hdCddLFxyXG4gICAgICAgICAgICAgICAgWy8oQGRpZ2l0cylbbExdPy8sICdudW1iZXInXSxcclxuICAgICAgICAgICAgICAgIC8vIGRlbGltaXRlcjogYWZ0ZXIgbnVtYmVyIGJlY2F1c2Ugb2YgLlxcZCBmbG9hdHNcclxuICAgICAgICAgICAgICAgIFsvWzssLl0vLCAnZGVsaW1pdGVyJ10sXHJcbiAgICAgICAgICAgICAgICAvLyBzdHJpbmdzXHJcbiAgICAgICAgICAgICAgICBbL1wiKFteXCJcXFxcXXxcXFxcLikqJC8sICdzdHJpbmcuaW52YWxpZCddLFxyXG4gICAgICAgICAgICAgICAgWy9cIi8sICdzdHJpbmcnLCAnQHN0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgLy8gY2hhcmFjdGVyc1xyXG4gICAgICAgICAgICAgICAgWy8nW15cXFxcJ10nLywgJ3N0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgWy8oJykoQGVzY2FwZXMpKCcpLywgWydzdHJpbmcnLCAnc3RyaW5nLmVzY2FwZScsICdzdHJpbmcnXV0sXHJcbiAgICAgICAgICAgICAgICBbLycvLCAnc3RyaW5nLmludmFsaWQnXVxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICB3aGl0ZXNwYWNlOiBbXHJcbiAgICAgICAgICAgICAgICBbL1sgXFx0XFxyXFxuXSsvLCAnJ10sXHJcbiAgICAgICAgICAgICAgICBbL1xcL1xcKlxcKig/IVxcLykvLCAnY29tbWVudC5kb2MnLCAnQGphdmFkb2MnXSxcclxuICAgICAgICAgICAgICAgIFsvXFwvXFwqLywgJ2NvbW1lbnQnLCAnQGNvbW1lbnQnXSxcclxuICAgICAgICAgICAgICAgIFsvXFwvXFwvLiokLywgJ2NvbW1lbnQnXSxcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgY29tbWVudDogW1xyXG4gICAgICAgICAgICAgICAgWy9bXlxcLypdKy8sICdjb21tZW50J10sXHJcbiAgICAgICAgICAgICAgICAvLyBbL1xcL1xcKi8sICdjb21tZW50JywgJ0BwdXNoJyBdLCAgICAvLyBuZXN0ZWQgY29tbWVudCBub3QgYWxsb3dlZCA6LShcclxuICAgICAgICAgICAgICAgIC8vIFsvXFwvXFwqLywgICAgJ2NvbW1lbnQuaW52YWxpZCcgXSwgICAgLy8gdGhpcyBicmVha3MgYmxvY2sgY29tbWVudHMgaW4gdGhlIHNoYXBlIG9mIC8qIC8vKi9cclxuICAgICAgICAgICAgICAgIFsvXFwqXFwvLywgJ2NvbW1lbnQnLCAnQHBvcCddLFxyXG4gICAgICAgICAgICAgICAgWy9bXFwvKl0vLCAnY29tbWVudCddXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIC8vSWRlbnRpY2FsIGNvcHkgb2YgY29tbWVudCBhYm92ZSwgZXhjZXB0IGZvciB0aGUgYWRkaXRpb24gb2YgLmRvY1xyXG4gICAgICAgICAgICBqYXZhZG9jOiBbXHJcbiAgICAgICAgICAgICAgICBbL1teXFwvKl0rLywgJ2NvbW1lbnQuZG9jJ10sXHJcbiAgICAgICAgICAgICAgICAvLyBbL1xcL1xcKi8sICdjb21tZW50LmRvYycsICdAcHVzaCcgXSwgICAgLy8gbmVzdGVkIGNvbW1lbnQgbm90IGFsbG93ZWQgOi0oXHJcbiAgICAgICAgICAgICAgICBbL1xcL1xcKi8sICdjb21tZW50LmRvYy5pbnZhbGlkJ10sXHJcbiAgICAgICAgICAgICAgICBbL1xcKlxcLy8sICdjb21tZW50LmRvYycsICdAcG9wJ10sXHJcbiAgICAgICAgICAgICAgICBbL1tcXC8qXS8sICdjb21tZW50LmRvYyddXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHN0cmluZzogW1xyXG4gICAgICAgICAgICAgICAgWy9bXlxcXFxcIl0rLywgJ3N0cmluZyddLFxyXG4gICAgICAgICAgICAgICAgWy9AZXNjYXBlcy8sICdzdHJpbmcuZXNjYXBlJ10sXHJcbiAgICAgICAgICAgICAgICBbL1xcXFwuLywgJ3N0cmluZy5lc2NhcGUuaW52YWxpZCddLFxyXG4gICAgICAgICAgICAgICAgWy9cIi8sICdzdHJpbmcnLCAnQHBvcCddXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgfSxcclxuICAgIH07XHJcblxyXG4gICAgLy9AdHMtaWdub3JlXHJcbiAgICBtb25hY28ubGFuZ3VhZ2VzLnNldExhbmd1YWdlQ29uZmlndXJhdGlvbignbXlKYXZhJywgY29uZik7XHJcbiAgICAvL0B0cy1pZ25vcmVcclxuICAgIG1vbmFjby5sYW5ndWFnZXMuc2V0TW9uYXJjaFRva2Vuc1Byb3ZpZGVyKCdteUphdmEnLCBsYW5ndWFnZSk7XHJcblxyXG4gICAgLy8gbW9uYWNvLmxhbmd1YWdlcy5yZWdpc3RlckNvbXBsZXRpb25JdGVtUHJvdmlkZXIoXCJteUphdmFcIiwgeyAgICAvLyBPciBhbnkgb3RoZXIgbGFuZ3VhZ2UuLi5cclxuICAgIC8vICAgICBwcm92aWRlQ29tcGxldGlvbkl0ZW1zOiAobW9kZWwsIHBvc2l0aW9uKSA9PiB7XHJcbiAgICAvLyAgICAgICAgIC8vIFJldHJpZXZlIHRoZSB0ZXh0IHVudGlsIHRoZSBjdXJyZW50IGN1cnNvcidzIHBvc2l0aW9uLCBhbnl0aGluZ1xyXG4gICAgLy8gICAgICAgICAvLyBhZnRlciB0aGF0IGRvZXNuJ3QgcmVhbGx5IG1hdHRlci5cclxuICAgIC8vICAgICAgICAgdmFyIHRleHRUb01hdGNoID0gbW9kZWwuZ2V0VmFsdWVJblJhbmdlKHtcclxuICAgIC8vICAgICAgICAgICAgIHN0YXJ0TGluZU51bWJlcjogMSxcclxuICAgIC8vICAgICAgICAgICAgIHN0YXJ0Q29sdW1uOiAxLFxyXG4gICAgLy8gICAgICAgICAgICAgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlcixcclxuICAgIC8vICAgICAgICAgICAgIGVuZENvbHVtbjogcG9zaXRpb24uY29sdW1uXHJcbiAgICAvLyAgICAgICAgIH0pO1xyXG5cclxuICAgIC8vICAgICAgICAgLy8gUmV0dXJuIEpTT04gYXJyYXkgY29udGFpbmluZyBhbGwgY29tcGxldGlvbiBzdWdnZXN0aW9ucy5cclxuICAgIC8vICAgICAgICAgcmV0dXJuIHtcclxuICAgIC8vICAgICAgICAgICAgIHN1Z2dlc3Rpb25zOiBbXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgLy8gRXhhbXBsZTogaW8ud3JpdGUgKClcclxuICAgIC8vICAgICAgICAgICAgICAgICB7XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcImlvLndyaXRlIChzdHJpbmcpXCIsXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IG1vbmFjby5sYW5ndWFnZXMuQ29tcGxldGlvbkl0ZW1LaW5kLkZ1bmN0aW9uLFxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICBkb2N1bWVudGF0aW9uOiBcIldyaXRlcyBhIHN0cmluZyB0byBzdGRvdXQuXCIsXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgIGluc2VydFRleHQ6IFwiaW8ud3JpdGUgKFxcXCJcXFwiKVwiLCAgLy8gRXNjYXBlIEpTT04gYXMgbmVlZGVkLlxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICByYW5nZToge1xyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRMaW5lTnVtYmVyOiBwb3NpdGlvbi5saW5lTnVtYmVyLFxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICAgICAgZW5kTGluZU51bWJlcjogcG9zaXRpb24ubGluZU51bWJlcixcclxuICAgIC8vICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0Q29sdW1uOiBwb3NpdGlvbi5jb2x1bW4sXHJcbiAgICAvLyAgICAgICAgICAgICAgICAgICAgICAgICBlbmRDb2x1bW46IHBvc2l0aW9uLmNvbHVtblxyXG4gICAgLy8gICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAvLyAgICAgICAgICAgICAgICAgfSwgIC8vIE90aGVyIGl0ZW1zLlxyXG4gICAgLy8gICAgICAgICAgICAgXVxyXG4gICAgLy8gICAgICAgICB9O1xyXG4gICAgLy8gICAgIH1cclxuICAgIC8vIH0pO1xyXG5cclxuXHJcbn0iXX0=