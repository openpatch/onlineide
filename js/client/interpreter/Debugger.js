import { InterpreterState } from "./Interpreter.js";
import { DebuggerElement } from "./DebuggerElement.js";
import { Accordion, AccordionPanel } from "../main/gui/Accordion.js";
import { StaticClass } from "../compiler/types/Class.js";
import { WatcherElement } from "./WatcherElement.js";
export class Debugger {
    constructor(main, $debuggerDiv, $projectexplorerDiv) {
        this.main = main;
        this.$debuggerDiv = $debuggerDiv;
        this.$projectexplorerDiv = $projectexplorerDiv;
        this.lastDebuggerElements = [];
        this.accordion = new Accordion($debuggerDiv);
        this.variablePanel = new AccordionPanel(this.accordion, "Variablen", "3", null, null, "", false);
        this.variablePanel.$listElement.css('margin-left', '4px');
        this.watchPanel = new AccordionPanel(this.accordion, "Beobachten", "2", "img_add-dark", "Beobachtungsterm hinzufügen", "watcher", true);
        this.watchPanel.$listElement.css('margin-left', '4px');
        let that = this;
        this.watchPanel.newElementCallback = (accordionElement, callbackIfSuccesful) => {
            that.addWatchExpression(accordionElement);
            callbackIfSuccesful(accordionElement.externalElement);
            return null;
        };
        this.watchPanel.deleteCallback = (watchExpression, callbackIfSuccesful) => {
            that.deleteWatchExpression(watchExpression);
            callbackIfSuccesful();
        };
        this.watchPanel.renameCallback = (watchExpression, newName) => {
            that.renameWatchExpression(watchExpression, newName);
            return newName;
        };
        this.$debuggerDiv.hide();
    }
    enable() {
        if (this.$projectexplorerDiv != null) {
            this.$projectexplorerDiv.hide();
        }
        this.$debuggerDiv.show();
        this.$debuggerDiv.parent().find(".jo_alternativeText").hide();
    }
    disable() {
        if (this.$projectexplorerDiv != null) {
            this.$projectexplorerDiv.show();
        }
        this.$debuggerDiv.hide();
        this.$debuggerDiv.parent().find(".jo_alternativeText").show();
    }
    showData(currentProgram, textPosition, stack, stackframe, heap) {
        if (currentProgram.module.file == null)
            return; // inside command line
        let elementsToKeep = [];
        let module = currentProgram.module;
        let symbolTable = module.findSymbolTableAtPosition(textPosition.line, textPosition.column);
        let oldDebuggerElements = this.lastDebuggerElements;
        this.lastDebuggerElements = [];
        let $variableList = this.variablePanel.$listElement;
        let st = symbolTable;
        if (symbolTable == null)
            return;
        if (st.classContext != null) {
            let object = stack[stackframe];
            // same object context as before?
            if (oldDebuggerElements.length > 0 && oldDebuggerElements[0].value == object && oldDebuggerElements[0].variable == null) {
                // yes => keep old Debugger Element and html-Element
                this.lastDebuggerElements.push(oldDebuggerElements[0]);
                elementsToKeep.push(this.lastDebuggerElements[0].$debuggerElement[0]);
            }
            else {
                // no => make a new one
                let thisString = (st.classContext instanceof StaticClass) ? st.classContext.identifier : "this";
                let de = new DebuggerElement(null, null, thisString, object, st.classContext, null);
                this.lastDebuggerElements.push(de);
            }
        }
        // in nested scopes there may be a variable in inner scope with same
        // identifier as variable in outer scope. We only want to show the variable in 
        // the inner scope, so we iterate from inner scope to outer scope and keep
        // track of already shown variable names:
        let visibleVariablesMap = {};
        // iterate over SymbolTable from inside to outside
        while (st != null) {
            st.variableMap.forEach((variable, identifier) => {
                // had there been a variable with same identifier in inner scope?
                if (visibleVariablesMap[variable.identifier] == null) {
                    // no
                    visibleVariablesMap[variable.identifier] = true;
                    let de;
                    // Reuse old Debugger Element vor variable, if present
                    for (let oldDe of oldDebuggerElements) {
                        if (oldDe.variable == variable) {
                            de = oldDe;
                            elementsToKeep.push(de.$debuggerElement[0]);
                            if (de.value == null && de.variable != null) {
                                de.value = stack[stackframe + de.variable.stackPos];
                            }
                        }
                    }
                    // no old debugger element present, so make a new one
                    if (de == null) {
                        let value = stack[stackframe + variable.stackPos];
                        de = new DebuggerElement(null, null, identifier, value, variable.type, variable);
                    }
                    this.lastDebuggerElements.push(de);
                }
            }, this);
            // next outer symbol table
            st = st.parent;
        }
        // if we are outside class context, then variables on heap are visible:
        if (symbolTable.classContext == null) {
            for (let identifier in heap) {
                let variable = heap[identifier];
                if (visibleVariablesMap[variable.identifier] != true) {
                    visibleVariablesMap[variable.identifier] = true;
                    let de;
                    for (let oldDe of oldDebuggerElements) {
                        if (oldDe.variable == variable) {
                            de = oldDe;
                            elementsToKeep.push(de.$debuggerElement[0]);
                            de.value = de.variable.value;
                        }
                    }
                    if (de == null) {
                        let value = variable.value;
                        de = new DebuggerElement(null, null, identifier, value, variable.type, variable);
                    }
                    this.lastDebuggerElements.push(de);
                }
            }
        }
        // remove unused elements from html DOM:
        for (let child of $variableList.children()) {
            if (!(elementsToKeep.indexOf(child) >= 0)) {
                child.remove();
            }
        }
        // inject new values into debugger elements:
        for (let de of this.lastDebuggerElements) {
            if (de.variable != null) {
                if (de.variable.stackPos != null) {
                    de.value = stack[stackframe + de.variable.stackPos];
                }
                else {
                    de.value = de.variable.value;
                }
            }
            de.render();
            // if html element corresponding to debugger element is not already present in Browser-DOM
            // then append it to DOM
            if (elementsToKeep.indexOf(de.$debuggerElement[0]) < 0) {
                $variableList.append(de.$debuggerElement);
            }
        }
        this.lastSymboltable = symbolTable;
        // this.evaluateWatcherExpressions(currentProgram, textPosition, stack, stackframe);
        this.evaluateWatcherExpressions();
    }
    renameWatchExpression(watcherElement, newName) {
        watcherElement.expression = newName;
        monaco.editor.colorize(newName, 'myJava', { tabSize: 3 }).then((command) => {
            let $div = watcherElement.accordionElement.$htmlFirstLine.find('.jo_filename');
            command = '<span class="jo_watcherExpression">' + command + "</span>";
            $div.html(command);
            $div.attr('title', watcherElement.expression);
        });
        if (this.main.getInterpreter().state == InterpreterState.paused) {
            watcherElement.evaluate();
        }
    }
    deleteWatchExpression(watchExpression) {
        // nothing to do
    }
    addWatchExpression(accordionElement) {
        accordionElement.$htmlSecondLine = jQuery('<div></div>');
        let $rightTextAfterFilename = accordionElement.$htmlFirstLine.parent().find('.jo_textAfterName').first();
        let we = new WatcherElement(accordionElement.name, accordionElement, this.main, accordionElement.$htmlSecondLine, $rightTextAfterFilename);
        accordionElement.externalElement = we;
        monaco.editor.colorize(accordionElement.name, 'myJava', { tabSize: 3 }).then((command) => {
            let $div = accordionElement.$htmlFirstLine.find('.jo_filename');
            command = '<span class="jo_watcherExpression">' + command + "</span>";
            $div.html(command);
            $div.attr('title', accordionElement.externalElement.expression);
        });
        we.evaluate();
    }
    evaluateWatcherExpressions() {
        for (let ae of this.watchPanel.elements) {
            let we = ae.externalElement;
            we.evaluate();
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRGVidWdnZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L2ludGVycHJldGVyL0RlYnVnZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBb0MsZ0JBQWdCLEVBQUUsTUFBTSxrQkFBa0IsQ0FBQztBQU90RixPQUFPLEVBQUUsZUFBZSxFQUFFLE1BQU0sc0JBQXNCLENBQUM7QUFDdkQsT0FBTyxFQUFFLFNBQVMsRUFBRSxjQUFjLEVBQW9CLE1BQU0sMEJBQTBCLENBQUM7QUFDdkYsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRXpELE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxxQkFBcUIsQ0FBQztBQUdyRCxNQUFNLE9BQU8sUUFBUTtJQVdqQixZQUFvQixJQUFjLEVBQVUsWUFBaUMsRUFBVSxtQkFBeUM7UUFBNUcsU0FBSSxHQUFKLElBQUksQ0FBVTtRQUFVLGlCQUFZLEdBQVosWUFBWSxDQUFxQjtRQUFVLHdCQUFtQixHQUFuQixtQkFBbUIsQ0FBc0I7UUFSaEkseUJBQW9CLEdBQXNCLEVBQUUsQ0FBQztRQVV6QyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVksQ0FBQyxDQUFDO1FBRTdDLElBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxXQUFXLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2pHLElBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFMUQsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQ2xFLGNBQWMsRUFBRSw2QkFBNkIsRUFDN0MsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3JCLElBQUksQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFdkQsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2hCLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsRUFBRSxFQUFFO1lBQzNFLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQzFDLG1CQUFtQixDQUFDLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQ3RELE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUMsQ0FBQztRQUVGLElBQUksQ0FBQyxVQUFVLENBQUMsY0FBYyxHQUFHLENBQUMsZUFBZSxFQUFFLG1CQUFtQixFQUFFLEVBQUU7WUFDdEUsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsQ0FBQyxDQUFDO1lBQzVDLG1CQUFtQixFQUFFLENBQUM7UUFDMUIsQ0FBQyxDQUFDO1FBRUYsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLEdBQUcsQ0FBQyxlQUFlLEVBQUUsT0FBTyxFQUFFLEVBQUU7WUFDMUQsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGVBQWUsRUFBRSxPQUFPLENBQUMsQ0FBQztZQUNyRCxPQUFPLE9BQU8sQ0FBQztRQUNuQixDQUFDLENBQUE7UUFFRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzdCLENBQUM7SUFFTSxNQUFNO1FBQ1QsSUFBSSxJQUFJLENBQUMsbUJBQW1CLElBQUksSUFBSSxFQUFFO1lBQ2xDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNuQztRQUNELElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDekIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNsRSxDQUFDO0lBRU0sT0FBTztRQUNWLElBQUksSUFBSSxDQUFDLG1CQUFtQixJQUFJLElBQUksRUFBRTtZQUNsQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLENBQUM7U0FDbkM7UUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3pCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLHFCQUFxQixDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7SUFDbEUsQ0FBQztJQUVELFFBQVEsQ0FBQyxjQUF1QixFQUFFLFlBQTBCLEVBQ3hELEtBQWMsRUFBRSxVQUFrQixFQUFFLElBQVU7UUFFOUMsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxJQUFJO1lBQUUsT0FBTyxDQUFDLHNCQUFzQjtRQUV0RSxJQUFJLGNBQWMsR0FBa0IsRUFBRSxDQUFDO1FBRXZDLElBQUksTUFBTSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7UUFDbkMsSUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLHlCQUF5QixDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRTNGLElBQUksbUJBQW1CLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDO1FBRXBELElBQUksQ0FBQyxvQkFBb0IsR0FBRyxFQUFFLENBQUM7UUFDL0IsSUFBSSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUM7UUFFcEQsSUFBSSxFQUFFLEdBQUcsV0FBVyxDQUFDO1FBRXJCLElBQUcsV0FBVyxJQUFJLElBQUk7WUFBRSxPQUFPO1FBRS9CLElBQUksRUFBRSxDQUFDLFlBQVksSUFBSSxJQUFJLEVBQUU7WUFFekIsSUFBSSxNQUFNLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQy9CLGlDQUFpQztZQUNqQyxJQUFJLG1CQUFtQixDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLE1BQU0sSUFBSSxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLElBQUksSUFBSSxFQUFFO2dCQUNySCxvREFBb0Q7Z0JBQ3BELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDdkQsY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN6RTtpQkFBTTtnQkFDSCx1QkFBdUI7Z0JBQ3ZCLElBQUksVUFBVSxHQUFHLENBQUMsRUFBRSxDQUFDLFlBQVksWUFBWSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztnQkFDaEcsSUFBSSxFQUFFLEdBQW9CLElBQUksZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO2dCQUNyRyxJQUFJLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ3RDO1NBRUo7UUFFRCxvRUFBb0U7UUFDcEUsK0VBQStFO1FBQy9FLDBFQUEwRTtRQUMxRSx5Q0FBeUM7UUFDekMsSUFBSSxtQkFBbUIsR0FBc0MsRUFBRSxDQUFDO1FBRWhFLGtEQUFrRDtRQUNsRCxPQUFPLEVBQUUsSUFBSSxJQUFJLEVBQUU7WUFFZixFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsRUFBRTtnQkFFNUMsaUVBQWlFO2dCQUNqRSxJQUFJLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsSUFBSSxJQUFJLEVBQUU7b0JBQ2xELEtBQUs7b0JBQ0wsbUJBQW1CLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxHQUFHLElBQUksQ0FBQztvQkFFaEQsSUFBSSxFQUFtQixDQUFDO29CQUV4QixzREFBc0Q7b0JBQ3RELEtBQUssSUFBSSxLQUFLLElBQUksbUJBQW1CLEVBQUU7d0JBQ25DLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUU7NEJBQzVCLEVBQUUsR0FBRyxLQUFLLENBQUM7NEJBQ1gsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFFNUMsSUFBSSxFQUFFLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxFQUFFLENBQUMsUUFBUSxJQUFJLElBQUksRUFBRTtnQ0FDekMsRUFBRSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7NkJBQ3ZEO3lCQUVKO3FCQUNKO29CQUVELHFEQUFxRDtvQkFDckQsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO3dCQUNaLElBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO3dCQUNsRCxFQUFFLEdBQUcsSUFBSSxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7cUJBQ3BGO29CQUVELElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7aUJBRXRDO1lBRUwsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRVQsMEJBQTBCO1lBQzFCLEVBQUUsR0FBRyxFQUFFLENBQUMsTUFBTSxDQUFDO1NBQ2xCO1FBRUQsdUVBQXVFO1FBQ3ZFLElBQUksV0FBVyxDQUFDLFlBQVksSUFBSSxJQUFJLEVBQUU7WUFDbEMsS0FBSyxJQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7Z0JBRXpCLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztnQkFFaEMsSUFBSSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksSUFBSSxFQUFFO29CQUVsRCxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEdBQUcsSUFBSSxDQUFDO29CQUVoRCxJQUFJLEVBQW1CLENBQUM7b0JBRXhCLEtBQUssSUFBSSxLQUFLLElBQUksbUJBQW1CLEVBQUU7d0JBQ25DLElBQUksS0FBSyxDQUFDLFFBQVEsSUFBSSxRQUFRLEVBQUU7NEJBQzVCLEVBQUUsR0FBRyxLQUFLLENBQUM7NEJBQ1gsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs0QkFFNUMsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQzt5QkFFaEM7cUJBQ0o7b0JBRUQsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO3dCQUNaLElBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7d0JBQzNCLEVBQUUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztxQkFDcEY7b0JBRUQsSUFBSSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztpQkFFdEM7YUFDSjtTQUNKO1FBRUQsd0NBQXdDO1FBQ3hDLEtBQUssSUFBSSxLQUFLLElBQUksYUFBYSxDQUFDLFFBQVEsRUFBRSxFQUFFO1lBQ3hDLElBQUksQ0FBQyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUU7Z0JBQ3ZDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQzthQUNsQjtTQUNKO1FBRUQsNENBQTRDO1FBQzVDLEtBQUssSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBRXRDLElBQUksRUFBRSxDQUFDLFFBQVEsSUFBSSxJQUFJLEVBQUU7Z0JBQ3JCLElBQUksRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLElBQUksSUFBSSxFQUFFO29CQUM5QixFQUFFLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDdkQ7cUJBQU07b0JBQ0gsRUFBRSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQztpQkFDaEM7YUFDSjtZQUVELEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUVaLDBGQUEwRjtZQUMxRix3QkFBd0I7WUFDeEIsSUFBSSxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDcEQsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzthQUM3QztTQUNKO1FBRUQsSUFBSSxDQUFDLGVBQWUsR0FBRyxXQUFXLENBQUM7UUFFbkMsb0ZBQW9GO1FBQ3BGLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO0lBRXRDLENBQUM7SUFFRCxxQkFBcUIsQ0FBQyxjQUE4QixFQUFFLE9BQWU7UUFDakUsY0FBYyxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7UUFFcEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBRXZFLElBQUksSUFBSSxHQUFHLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQy9FLE9BQU8sR0FBRyxxQ0FBcUMsR0FBRyxPQUFPLEdBQUcsU0FBUyxDQUFDO1lBQ3RFLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDbkIsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRWxELENBQUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7WUFDN0QsY0FBYyxDQUFDLFFBQVEsRUFBRSxDQUFDO1NBQzdCO0lBR0wsQ0FBQztJQUVELHFCQUFxQixDQUFDLGVBQW9CO1FBQ3RDLGdCQUFnQjtJQUNwQixDQUFDO0lBRUQsa0JBQWtCLENBQUMsZ0JBQWtDO1FBRWpELGdCQUFnQixDQUFDLGVBQWUsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7UUFDekQsSUFBSSx1QkFBdUIsR0FBRyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFekcsSUFBSSxFQUFFLEdBQUcsSUFBSSxjQUFjLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUMvRCxJQUFJLENBQUMsSUFBSSxFQUFFLGdCQUFnQixDQUFDLGVBQWUsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO1FBRTFFLGdCQUFnQixDQUFDLGVBQWUsR0FBRyxFQUFFLENBQUM7UUFFdEMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBRXJGLElBQUksSUFBSSxHQUFHLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDaEUsT0FBTyxHQUFHLHFDQUFxQyxHQUFHLE9BQU8sR0FBRyxTQUFTLENBQUM7WUFDdEUsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFcEUsQ0FBQyxDQUFDLENBQUM7UUFFSCxFQUFFLENBQUMsUUFBUSxFQUFFLENBQUM7SUFFbEIsQ0FBQztJQUVELDBCQUEwQjtRQUV0QixLQUFLLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFO1lBQ3JDLElBQUksRUFBRSxHQUFtQixFQUFFLENBQUMsZUFBZSxDQUFDO1lBQzVDLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztTQUNqQjtJQUdMLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEludGVycHJldGVyLCBQcm9ncmFtU3RhY2tFbGVtZW50LCBJbnRlcnByZXRlclN0YXRlIH0gZnJvbSBcIi4vSW50ZXJwcmV0ZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9tYWluL01haW4uanNcIjtcclxuaW1wb3J0IHsgVmFsdWUsIEhlYXAgfSBmcm9tIFwiLi4vY29tcGlsZXIvdHlwZXMvVHlwZXMuanNcIjtcclxuaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgVGV4dFBvc2l0aW9uIH0gZnJvbSBcIi4uL2NvbXBpbGVyL2xleGVyL1Rva2VuLmpzXCI7XHJcbmltcG9ydCB7IFByb2dyYW0gfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL1Byb2dyYW0uanNcIjtcclxuaW1wb3J0IHsgU3ltYm9sVGFibGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL1N5bWJvbFRhYmxlLmpzXCI7XHJcbmltcG9ydCB7IERlYnVnZ2VyRWxlbWVudCB9IGZyb20gXCIuL0RlYnVnZ2VyRWxlbWVudC5qc1wiO1xyXG5pbXBvcnQgeyBBY2NvcmRpb24sIEFjY29yZGlvblBhbmVsLCBBY2NvcmRpb25FbGVtZW50IH0gZnJvbSBcIi4uL21haW4vZ3VpL0FjY29yZGlvbi5qc1wiO1xyXG5pbXBvcnQgeyBTdGF0aWNDbGFzcyB9IGZyb20gXCIuLi9jb21waWxlci90eXBlcy9DbGFzcy5qc1wiO1xyXG5pbXBvcnQgeyBBZGhvY0NvbXBpbGVyIH0gZnJvbSBcIi4uL2NvbXBpbGVyL0FkaG9jQ29tcGlsZXIuanNcIjtcclxuaW1wb3J0IHsgV2F0Y2hlckVsZW1lbnQgfSBmcm9tIFwiLi9XYXRjaGVyRWxlbWVudC5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9tYWluL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgRGVidWdnZXIge1xyXG5cclxuICAgIGxhc3RTeW1ib2x0YWJsZTogU3ltYm9sVGFibGU7XHJcbiAgICBsYXN0RGVidWdnZXJFbGVtZW50czogRGVidWdnZXJFbGVtZW50W10gPSBbXTtcclxuICAgIGFjY29yZGlvbjogQWNjb3JkaW9uO1xyXG5cclxuICAgIHZhcmlhYmxlUGFuZWw6IEFjY29yZGlvblBhbmVsO1xyXG5cclxuICAgIHdhdGNoUGFuZWw6IEFjY29yZGlvblBhbmVsO1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1haW46IE1haW5CYXNlLCBwcml2YXRlICRkZWJ1Z2dlckRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50PiwgcHJpdmF0ZSAkcHJvamVjdGV4cGxvcmVyRGl2PzogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuICAgICAgICB0aGlzLmFjY29yZGlvbiA9IG5ldyBBY2NvcmRpb24oJGRlYnVnZ2VyRGl2KTtcclxuXHJcbiAgICAgICAgdGhpcy52YXJpYWJsZVBhbmVsID0gbmV3IEFjY29yZGlvblBhbmVsKHRoaXMuYWNjb3JkaW9uLCBcIlZhcmlhYmxlblwiLCBcIjNcIiwgbnVsbCwgbnVsbCwgXCJcIiwgZmFsc2UpO1xyXG4gICAgICAgIHRoaXMudmFyaWFibGVQYW5lbC4kbGlzdEVsZW1lbnQuY3NzKCdtYXJnaW4tbGVmdCcsICc0cHgnKTtcclxuXHJcbiAgICAgICAgdGhpcy53YXRjaFBhbmVsID0gbmV3IEFjY29yZGlvblBhbmVsKHRoaXMuYWNjb3JkaW9uLCBcIkJlb2JhY2h0ZW5cIiwgXCIyXCIsXHJcbiAgICAgICAgICAgIFwiaW1nX2FkZC1kYXJrXCIsIFwiQmVvYmFjaHR1bmdzdGVybSBoaW56dWbDvGdlblwiLFxyXG4gICAgICAgICAgICBcIndhdGNoZXJcIiwgdHJ1ZSk7XHJcbiAgICAgICAgdGhpcy53YXRjaFBhbmVsLiRsaXN0RWxlbWVudC5jc3MoJ21hcmdpbi1sZWZ0JywgJzRweCcpO1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgdGhpcy53YXRjaFBhbmVsLm5ld0VsZW1lbnRDYWxsYmFjayA9IChhY2NvcmRpb25FbGVtZW50LCBjYWxsYmFja0lmU3VjY2VzZnVsKSA9PiB7XHJcbiAgICAgICAgICAgIHRoYXQuYWRkV2F0Y2hFeHByZXNzaW9uKGFjY29yZGlvbkVsZW1lbnQpO1xyXG4gICAgICAgICAgICBjYWxsYmFja0lmU3VjY2VzZnVsKGFjY29yZGlvbkVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50KTtcclxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy53YXRjaFBhbmVsLmRlbGV0ZUNhbGxiYWNrID0gKHdhdGNoRXhwcmVzc2lvbiwgY2FsbGJhY2tJZlN1Y2Nlc2Z1bCkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LmRlbGV0ZVdhdGNoRXhwcmVzc2lvbih3YXRjaEV4cHJlc3Npb24pO1xyXG4gICAgICAgICAgICBjYWxsYmFja0lmU3VjY2VzZnVsKCk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy53YXRjaFBhbmVsLnJlbmFtZUNhbGxiYWNrID0gKHdhdGNoRXhwcmVzc2lvbiwgbmV3TmFtZSkgPT4ge1xyXG4gICAgICAgICAgICB0aGF0LnJlbmFtZVdhdGNoRXhwcmVzc2lvbih3YXRjaEV4cHJlc3Npb24sIG5ld05hbWUpO1xyXG4gICAgICAgICAgICByZXR1cm4gbmV3TmFtZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuJGRlYnVnZ2VyRGl2LmhpZGUoKTtcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW5hYmxlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLiRwcm9qZWN0ZXhwbG9yZXJEaXYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLiRwcm9qZWN0ZXhwbG9yZXJEaXYuaGlkZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLiRkZWJ1Z2dlckRpdi5zaG93KCk7XHJcbiAgICAgICAgdGhpcy4kZGVidWdnZXJEaXYucGFyZW50KCkuZmluZChcIi5qb19hbHRlcm5hdGl2ZVRleHRcIikuaGlkZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBkaXNhYmxlKCkge1xyXG4gICAgICAgIGlmICh0aGlzLiRwcm9qZWN0ZXhwbG9yZXJEaXYgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLiRwcm9qZWN0ZXhwbG9yZXJEaXYuc2hvdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLiRkZWJ1Z2dlckRpdi5oaWRlKCk7XHJcbiAgICAgICAgdGhpcy4kZGVidWdnZXJEaXYucGFyZW50KCkuZmluZChcIi5qb19hbHRlcm5hdGl2ZVRleHRcIikuc2hvdygpO1xyXG4gICAgfVxyXG5cclxuICAgIHNob3dEYXRhKGN1cnJlbnRQcm9ncmFtOiBQcm9ncmFtLCB0ZXh0UG9zaXRpb246IFRleHRQb3NpdGlvbixcclxuICAgICAgICBzdGFjazogVmFsdWVbXSwgc3RhY2tmcmFtZTogbnVtYmVyLCBoZWFwOiBIZWFwKSB7XHJcblxyXG4gICAgICAgIGlmIChjdXJyZW50UHJvZ3JhbS5tb2R1bGUuZmlsZSA9PSBudWxsKSByZXR1cm47IC8vIGluc2lkZSBjb21tYW5kIGxpbmVcclxuXHJcbiAgICAgICAgbGV0IGVsZW1lbnRzVG9LZWVwOiBIVE1MRWxlbWVudFtdID0gW107XHJcblxyXG4gICAgICAgIGxldCBtb2R1bGUgPSBjdXJyZW50UHJvZ3JhbS5tb2R1bGU7XHJcbiAgICAgICAgbGV0IHN5bWJvbFRhYmxlID0gbW9kdWxlLmZpbmRTeW1ib2xUYWJsZUF0UG9zaXRpb24odGV4dFBvc2l0aW9uLmxpbmUsIHRleHRQb3NpdGlvbi5jb2x1bW4pO1xyXG5cclxuICAgICAgICBsZXQgb2xkRGVidWdnZXJFbGVtZW50cyA9IHRoaXMubGFzdERlYnVnZ2VyRWxlbWVudHM7XHJcblxyXG4gICAgICAgIHRoaXMubGFzdERlYnVnZ2VyRWxlbWVudHMgPSBbXTtcclxuICAgICAgICBsZXQgJHZhcmlhYmxlTGlzdCA9IHRoaXMudmFyaWFibGVQYW5lbC4kbGlzdEVsZW1lbnQ7XHJcblxyXG4gICAgICAgIGxldCBzdCA9IHN5bWJvbFRhYmxlO1xyXG5cclxuICAgICAgICBpZihzeW1ib2xUYWJsZSA9PSBudWxsKSByZXR1cm47XHJcblxyXG4gICAgICAgIGlmIChzdC5jbGFzc0NvbnRleHQgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IG9iamVjdCA9IHN0YWNrW3N0YWNrZnJhbWVdO1xyXG4gICAgICAgICAgICAvLyBzYW1lIG9iamVjdCBjb250ZXh0IGFzIGJlZm9yZT9cclxuICAgICAgICAgICAgaWYgKG9sZERlYnVnZ2VyRWxlbWVudHMubGVuZ3RoID4gMCAmJiBvbGREZWJ1Z2dlckVsZW1lbnRzWzBdLnZhbHVlID09IG9iamVjdCAmJiBvbGREZWJ1Z2dlckVsZW1lbnRzWzBdLnZhcmlhYmxlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIC8vIHllcyA9PiBrZWVwIG9sZCBEZWJ1Z2dlciBFbGVtZW50IGFuZCBodG1sLUVsZW1lbnRcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdERlYnVnZ2VyRWxlbWVudHMucHVzaChvbGREZWJ1Z2dlckVsZW1lbnRzWzBdKTtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnRzVG9LZWVwLnB1c2godGhpcy5sYXN0RGVidWdnZXJFbGVtZW50c1swXS4kZGVidWdnZXJFbGVtZW50WzBdKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIC8vIG5vID0+IG1ha2UgYSBuZXcgb25lXHJcbiAgICAgICAgICAgICAgICBsZXQgdGhpc1N0cmluZyA9IChzdC5jbGFzc0NvbnRleHQgaW5zdGFuY2VvZiBTdGF0aWNDbGFzcykgPyBzdC5jbGFzc0NvbnRleHQuaWRlbnRpZmllciA6IFwidGhpc1wiO1xyXG4gICAgICAgICAgICAgICAgbGV0IGRlOiBEZWJ1Z2dlckVsZW1lbnQgPSBuZXcgRGVidWdnZXJFbGVtZW50KG51bGwsIG51bGwsIHRoaXNTdHJpbmcsIG9iamVjdCwgc3QuY2xhc3NDb250ZXh0LCBudWxsKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubGFzdERlYnVnZ2VyRWxlbWVudHMucHVzaChkZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpbiBuZXN0ZWQgc2NvcGVzIHRoZXJlIG1heSBiZSBhIHZhcmlhYmxlIGluIGlubmVyIHNjb3BlIHdpdGggc2FtZVxyXG4gICAgICAgIC8vIGlkZW50aWZpZXIgYXMgdmFyaWFibGUgaW4gb3V0ZXIgc2NvcGUuIFdlIG9ubHkgd2FudCB0byBzaG93IHRoZSB2YXJpYWJsZSBpbiBcclxuICAgICAgICAvLyB0aGUgaW5uZXIgc2NvcGUsIHNvIHdlIGl0ZXJhdGUgZnJvbSBpbm5lciBzY29wZSB0byBvdXRlciBzY29wZSBhbmQga2VlcFxyXG4gICAgICAgIC8vIHRyYWNrIG9mIGFscmVhZHkgc2hvd24gdmFyaWFibGUgbmFtZXM6XHJcbiAgICAgICAgbGV0IHZpc2libGVWYXJpYWJsZXNNYXA6IHsgW2lkZW50aWZpZXI6IHN0cmluZ106IGJvb2xlYW4gfSA9IHt9O1xyXG5cclxuICAgICAgICAvLyBpdGVyYXRlIG92ZXIgU3ltYm9sVGFibGUgZnJvbSBpbnNpZGUgdG8gb3V0c2lkZVxyXG4gICAgICAgIHdoaWxlIChzdCAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICBzdC52YXJpYWJsZU1hcC5mb3JFYWNoKCh2YXJpYWJsZSwgaWRlbnRpZmllcikgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vIGhhZCB0aGVyZSBiZWVuIGEgdmFyaWFibGUgd2l0aCBzYW1lIGlkZW50aWZpZXIgaW4gaW5uZXIgc2NvcGU/XHJcbiAgICAgICAgICAgICAgICBpZiAodmlzaWJsZVZhcmlhYmxlc01hcFt2YXJpYWJsZS5pZGVudGlmaWVyXSA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm9cclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlVmFyaWFibGVzTWFwW3ZhcmlhYmxlLmlkZW50aWZpZXJdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlOiBEZWJ1Z2dlckVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vIFJldXNlIG9sZCBEZWJ1Z2dlciBFbGVtZW50IHZvciB2YXJpYWJsZSwgaWYgcHJlc2VudFxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9sZERlIG9mIG9sZERlYnVnZ2VyRWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZERlLnZhcmlhYmxlID09IHZhcmlhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZSA9IG9sZERlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHNUb0tlZXAucHVzaChkZS4kZGVidWdnZXJFbGVtZW50WzBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGUudmFsdWUgPT0gbnVsbCAmJiBkZS52YXJpYWJsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGUudmFsdWUgPSBzdGFja1tzdGFja2ZyYW1lICsgZGUudmFyaWFibGUuc3RhY2tQb3NdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gbm8gb2xkIGRlYnVnZ2VyIGVsZW1lbnQgcHJlc2VudCwgc28gbWFrZSBhIG5ldyBvbmVcclxuICAgICAgICAgICAgICAgICAgICBpZiAoZGUgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWUgPSBzdGFja1tzdGFja2ZyYW1lICsgdmFyaWFibGUuc3RhY2tQb3NdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZSA9IG5ldyBEZWJ1Z2dlckVsZW1lbnQobnVsbCwgbnVsbCwgaWRlbnRpZmllciwgdmFsdWUsIHZhcmlhYmxlLnR5cGUsIHZhcmlhYmxlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGFzdERlYnVnZ2VyRWxlbWVudHMucHVzaChkZSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfSwgdGhpcyk7XHJcblxyXG4gICAgICAgICAgICAvLyBuZXh0IG91dGVyIHN5bWJvbCB0YWJsZVxyXG4gICAgICAgICAgICBzdCA9IHN0LnBhcmVudDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmIHdlIGFyZSBvdXRzaWRlIGNsYXNzIGNvbnRleHQsIHRoZW4gdmFyaWFibGVzIG9uIGhlYXAgYXJlIHZpc2libGU6XHJcbiAgICAgICAgaWYgKHN5bWJvbFRhYmxlLmNsYXNzQ29udGV4dCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGlkZW50aWZpZXIgaW4gaGVhcCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCB2YXJpYWJsZSA9IGhlYXBbaWRlbnRpZmllcl07XHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKHZpc2libGVWYXJpYWJsZXNNYXBbdmFyaWFibGUuaWRlbnRpZmllcl0gIT0gdHJ1ZSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2aXNpYmxlVmFyaWFibGVzTWFwW3ZhcmlhYmxlLmlkZW50aWZpZXJdID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGRlOiBEZWJ1Z2dlckVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGZvciAobGV0IG9sZERlIG9mIG9sZERlYnVnZ2VyRWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9sZERlLnZhcmlhYmxlID09IHZhcmlhYmxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZSA9IG9sZERlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudHNUb0tlZXAucHVzaChkZS4kZGVidWdnZXJFbGVtZW50WzBdKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZS52YWx1ZSA9IGRlLnZhcmlhYmxlLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRlID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlID0gdmFyaWFibGUudmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlID0gbmV3IERlYnVnZ2VyRWxlbWVudChudWxsLCBudWxsLCBpZGVudGlmaWVyLCB2YWx1ZSwgdmFyaWFibGUudHlwZSwgdmFyaWFibGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXN0RGVidWdnZXJFbGVtZW50cy5wdXNoKGRlKTtcclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIHJlbW92ZSB1bnVzZWQgZWxlbWVudHMgZnJvbSBodG1sIERPTTpcclxuICAgICAgICBmb3IgKGxldCBjaGlsZCBvZiAkdmFyaWFibGVMaXN0LmNoaWxkcmVuKCkpIHtcclxuICAgICAgICAgICAgaWYgKCEoZWxlbWVudHNUb0tlZXAuaW5kZXhPZihjaGlsZCkgPj0gMCkpIHtcclxuICAgICAgICAgICAgICAgIGNoaWxkLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBpbmplY3QgbmV3IHZhbHVlcyBpbnRvIGRlYnVnZ2VyIGVsZW1lbnRzOlxyXG4gICAgICAgIGZvciAobGV0IGRlIG9mIHRoaXMubGFzdERlYnVnZ2VyRWxlbWVudHMpIHtcclxuXHJcbiAgICAgICAgICAgIGlmIChkZS52YXJpYWJsZSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoZGUudmFyaWFibGUuc3RhY2tQb3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGRlLnZhbHVlID0gc3RhY2tbc3RhY2tmcmFtZSArIGRlLnZhcmlhYmxlLnN0YWNrUG9zXTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGUudmFsdWUgPSBkZS52YXJpYWJsZS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZGUucmVuZGVyKCk7XHJcblxyXG4gICAgICAgICAgICAvLyBpZiBodG1sIGVsZW1lbnQgY29ycmVzcG9uZGluZyB0byBkZWJ1Z2dlciBlbGVtZW50IGlzIG5vdCBhbHJlYWR5IHByZXNlbnQgaW4gQnJvd3Nlci1ET01cclxuICAgICAgICAgICAgLy8gdGhlbiBhcHBlbmQgaXQgdG8gRE9NXHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50c1RvS2VlcC5pbmRleE9mKGRlLiRkZWJ1Z2dlckVsZW1lbnRbMF0pIDwgMCkge1xyXG4gICAgICAgICAgICAgICAgJHZhcmlhYmxlTGlzdC5hcHBlbmQoZGUuJGRlYnVnZ2VyRWxlbWVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubGFzdFN5bWJvbHRhYmxlID0gc3ltYm9sVGFibGU7XHJcblxyXG4gICAgICAgIC8vIHRoaXMuZXZhbHVhdGVXYXRjaGVyRXhwcmVzc2lvbnMoY3VycmVudFByb2dyYW0sIHRleHRQb3NpdGlvbiwgc3RhY2ssIHN0YWNrZnJhbWUpO1xyXG4gICAgICAgIHRoaXMuZXZhbHVhdGVXYXRjaGVyRXhwcmVzc2lvbnMoKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVuYW1lV2F0Y2hFeHByZXNzaW9uKHdhdGNoZXJFbGVtZW50OiBXYXRjaGVyRWxlbWVudCwgbmV3TmFtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgd2F0Y2hlckVsZW1lbnQuZXhwcmVzc2lvbiA9IG5ld05hbWU7XHJcblxyXG4gICAgICAgIG1vbmFjby5lZGl0b3IuY29sb3JpemUobmV3TmFtZSwgJ215SmF2YScsIHsgdGFiU2l6ZTogMyB9KS50aGVuKChjb21tYW5kKSA9PiB7XHJcblxyXG4gICAgICAgICAgICBsZXQgJGRpdiA9IHdhdGNoZXJFbGVtZW50LmFjY29yZGlvbkVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX2ZpbGVuYW1lJyk7XHJcbiAgICAgICAgICAgIGNvbW1hbmQgPSAnPHNwYW4gY2xhc3M9XCJqb193YXRjaGVyRXhwcmVzc2lvblwiPicgKyBjb21tYW5kICsgXCI8L3NwYW4+XCI7XHJcbiAgICAgICAgICAgICRkaXYuaHRtbChjb21tYW5kKTtcclxuICAgICAgICAgICAgJGRpdi5hdHRyKCd0aXRsZScsIHdhdGNoZXJFbGVtZW50LmV4cHJlc3Npb24pO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubWFpbi5nZXRJbnRlcnByZXRlcigpLnN0YXRlID09IEludGVycHJldGVyU3RhdGUucGF1c2VkKSB7XHJcbiAgICAgICAgICAgIHdhdGNoZXJFbGVtZW50LmV2YWx1YXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZGVsZXRlV2F0Y2hFeHByZXNzaW9uKHdhdGNoRXhwcmVzc2lvbjogYW55KSB7XHJcbiAgICAgICAgLy8gbm90aGluZyB0byBkb1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFdhdGNoRXhwcmVzc2lvbihhY2NvcmRpb25FbGVtZW50OiBBY2NvcmRpb25FbGVtZW50KSB7XHJcblxyXG4gICAgICAgIGFjY29yZGlvbkVsZW1lbnQuJGh0bWxTZWNvbmRMaW5lID0galF1ZXJ5KCc8ZGl2PjwvZGl2PicpO1xyXG4gICAgICAgIGxldCAkcmlnaHRUZXh0QWZ0ZXJGaWxlbmFtZSA9IGFjY29yZGlvbkVsZW1lbnQuJGh0bWxGaXJzdExpbmUucGFyZW50KCkuZmluZCgnLmpvX3RleHRBZnRlck5hbWUnKS5maXJzdCgpO1xyXG5cclxuICAgICAgICBsZXQgd2UgPSBuZXcgV2F0Y2hlckVsZW1lbnQoYWNjb3JkaW9uRWxlbWVudC5uYW1lLCBhY2NvcmRpb25FbGVtZW50LFxyXG4gICAgICAgICAgICB0aGlzLm1haW4sIGFjY29yZGlvbkVsZW1lbnQuJGh0bWxTZWNvbmRMaW5lLCAkcmlnaHRUZXh0QWZ0ZXJGaWxlbmFtZSk7XHJcblxyXG4gICAgICAgIGFjY29yZGlvbkVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50ID0gd2U7XHJcblxyXG4gICAgICAgIG1vbmFjby5lZGl0b3IuY29sb3JpemUoYWNjb3JkaW9uRWxlbWVudC5uYW1lLCAnbXlKYXZhJywgeyB0YWJTaXplOiAzIH0pLnRoZW4oKGNvbW1hbmQpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGxldCAkZGl2ID0gYWNjb3JkaW9uRWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fZmlsZW5hbWUnKTtcclxuICAgICAgICAgICAgY29tbWFuZCA9ICc8c3BhbiBjbGFzcz1cImpvX3dhdGNoZXJFeHByZXNzaW9uXCI+JyArIGNvbW1hbmQgKyBcIjwvc3Bhbj5cIjtcclxuICAgICAgICAgICAgJGRpdi5odG1sKGNvbW1hbmQpO1xyXG4gICAgICAgICAgICAkZGl2LmF0dHIoJ3RpdGxlJywgYWNjb3JkaW9uRWxlbWVudC5leHRlcm5hbEVsZW1lbnQuZXhwcmVzc2lvbik7XHJcblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB3ZS5ldmFsdWF0ZSgpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBldmFsdWF0ZVdhdGNoZXJFeHByZXNzaW9ucygpIHtcclxuXHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy53YXRjaFBhbmVsLmVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgIGxldCB3ZTogV2F0Y2hlckVsZW1lbnQgPSBhZS5leHRlcm5hbEVsZW1lbnQ7XHJcbiAgICAgICAgICAgIHdlLmV2YWx1YXRlKCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==