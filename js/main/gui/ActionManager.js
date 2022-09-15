import { InterpreterState } from "../../interpreter/Interpreter.js";
import { SoundTools } from "../../tools/SoundTools.js";
export class ActionManager {
    constructor($mainElement, main) {
        this.$mainElement = $mainElement;
        this.main = main;
        this.actions = {};
        this.keyEntries = {};
        this.buttons = {};
    }
    init() {
        let $element = this.$mainElement;
        if ($element == null)
            $element = jQuery(document);
        let that = this;
        $element.on("keydown", function (event) {
            if (event != null) {
                that.executeKeyDownEvent(event);
                /*
                 * Event is bubbling down to body element
                 * when pressing space bar in embedded mode while program runs.
                 * This leads to scrolling page down. To prevent this:
                 */
                if (event.key == " " && that.main.isEmbedded() &&
                    that.main.getInterpreter().state == InterpreterState.running && !that.main.getMonacoEditor().hasTextFocus()) {
                    event.preventDefault();
                }
            }
        });
    }
    trigger(actionIdentifier) {
        let ae = this.actions[actionIdentifier];
        if (ae != null) {
            ae.action(actionIdentifier, null, "");
        }
    }
    registerAction(identifier, keys, action, text = "", button) {
        let ae = {
            action: action,
            identifier: identifier,
            keys: keys,
            text: text,
            active: true
        };
        this.actions[identifier] = ae;
        for (let key of keys) {
            if (this.keyEntries[key.toLowerCase()] == null) {
                this.keyEntries[key.toLowerCase()] = [];
            }
            this.keyEntries[key.toLowerCase()].push(ae);
        }
        if (button != null) {
            if (this.buttons[identifier] == null) {
                this.buttons[identifier] = [];
            }
            this.buttons[identifier].push(button);
            let t = text;
            if (keys.length > 0) {
                t += " [" + keys.join(", ") + "]";
            }
            button.attr("title", t);
            let mousePointer = window.PointerEvent ? "pointer" : "mouse";
            button.on(mousePointer + 'down', () => {
                if (ae.active) {
                    action(identifier, null, "mousedown");
                }
                if (identifier == "interpreter.start") {
                    SoundTools.init();
                }
            });
        }
    }
    isActive(actionIdentifier) {
        let ae = this.actions[actionIdentifier];
        if (ae == null)
            return false;
        return ae.active;
    }
    setActive(actionIdentifier, active) {
        let ae = this.actions[actionIdentifier];
        if (ae != null) {
            ae.active = active;
        }
        let buttons = this.buttons[actionIdentifier];
        if (buttons != null) {
            for (let button of buttons) {
                if (active) {
                    button.addClass('jo_active');
                }
                else {
                    button.removeClass('jo_active');
                }
            }
        }
    }
    executeKeyDownEvent(event) {
        if (document.activeElement.tagName.toLowerCase() == "input") {
            return;
        }
        if (event.keyCode <= 18 && event.keyCode >= 16) {
            return; // ctrl, alt, shift
        }
        let key = "";
        if (event.ctrlKey) {
            key += "ctrl+";
        }
        if (event.shiftKey) {
            key += "shift+";
        }
        if (event.altKey) {
            key += "alt+";
        }
        if (event.key != null) {
            key += event.key.toLowerCase();
        }
        let actionEntries = this.keyEntries[key];
        if (actionEntries != null) {
            for (let actionEntry of actionEntries) {
                if (actionEntry.active) {
                    event.stopPropagation();
                    event.preventDefault();
                    actionEntry.action(actionEntry.identifier, null, key);
                    break;
                }
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWN0aW9uTWFuYWdlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvbWFpbi9ndWkvQWN0aW9uTWFuYWdlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUNwRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sMkJBQTJCLENBQUM7QUFnQnZELE1BQU0sT0FBTyxhQUFhO0lBUXRCLFlBQW9CLFlBQWlDLEVBQVUsSUFBYztRQUF6RCxpQkFBWSxHQUFaLFlBQVksQ0FBcUI7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFVO1FBTjdFLFlBQU8sR0FBZ0QsRUFBRyxDQUFDO1FBRTNELGVBQVUsR0FBcUMsRUFBRSxDQUFDO1FBRWxELFlBQU8sR0FBMEQsRUFBRSxDQUFDO0lBSXBFLENBQUM7SUFFTSxJQUFJO1FBRVAsSUFBSSxRQUFRLEdBQWUsSUFBSSxDQUFDLFlBQVksQ0FBQztRQUU3QyxJQUFHLFFBQVEsSUFBSSxJQUFJO1lBQUUsUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVqRCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFDaEIsUUFBUSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsVUFBVSxLQUEwQjtZQUN2RCxJQUFHLEtBQUssSUFBSSxJQUFJLEVBQUM7Z0JBQ2IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUVoQzs7OzttQkFJRztnQkFDSCxJQUFHLEtBQUssQ0FBQyxHQUFHLElBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFO29CQUMxQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLEtBQUssSUFBSSxnQkFBZ0IsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDLFlBQVksRUFB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ekMsSUFBRyxhQUFhLElBQUksSUFBSSxFQUFDO1lBQ3JCLEtBQUksSUFBSSxXQUFXLElBQUksYUFBYSxFQUFDO2dCQUNqQyxJQUFJLFdBQVcsQ0FBQyxNQUFNLEVBQUU7b0JBQ3BCLEtBQUssQ0FBQyxlQUFlLEVBQUUsQ0FBQztvQkFDeEIsS0FBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUN2QixXQUFXLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO29CQUN0RCxNQUFNO2lCQUNUO2FBQ0o7U0FDSjtJQUdMLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEludGVycHJldGVyU3RhdGUgfSBmcm9tIFwiLi4vLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuaW1wb3J0IHsgU291bmRUb29scyB9IGZyb20gXCIuLi8uLi90b29scy9Tb3VuZFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9NYWluQmFzZS5qc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgQnV0dG9uVG9nZ2xlciA9IChzdGF0ZTogYm9vbGVhbikgPT4gdm9pZDtcclxuXHJcbmV4cG9ydCB0eXBlIEFjdGlvbiA9IChuYW1lOiBzdHJpbmcsIGJ1dHRvblRvZ2dsZXI/OiBCdXR0b25Ub2dnbGVyLCBwcmVzc2VkX2tleT86IHN0cmluZykgPT4gdm9pZDtcclxuXHJcbmV4cG9ydCB0eXBlIEFjdGlvbkVudHJ5ID0ge1xyXG4gICAgdGV4dD86IHN0cmluZyxcclxuICAgIGtleXM6IHN0cmluZ1tdLFxyXG4gICAgYWN0aW9uOiBBY3Rpb24sXHJcbiAgICBpZGVudGlmaWVyOiBzdHJpbmcsIC8vIG5hbWUgb2YgQWN0aW9uIGlzIGNvcGllZCBhdXRvbWF0aWNhbGx5IHRvIG5hbWUgb2YgQWN0aW9uRW50cnlcclxuICAgIGFjdGl2ZTogYm9vbGVhblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQWN0aW9uTWFuYWdlciB7XHJcblxyXG4gICAgYWN0aW9uczogeyBbYWN0aW9uSWRlbnRpZmllcjogc3RyaW5nXTogQWN0aW9uRW50cnkgfSA9IHsgfTtcclxuXHJcbiAgICBrZXlFbnRyaWVzOiB7IFtrZXk6IHN0cmluZ106IEFjdGlvbkVudHJ5W10gfSA9IHt9O1xyXG5cclxuICAgIGJ1dHRvbnM6IHsgW2FjdGlvbklkZW50aWZpZXI6IHN0cmluZ106IEpRdWVyeTxIVE1MRWxlbWVudD5bXSB9ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSAkbWFpbkVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD4sIHByaXZhdGUgbWFpbjogTWFpbkJhc2Upe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaW5pdCgpe1xyXG5cclxuICAgICAgICBsZXQgJGVsZW1lbnQ6SlF1ZXJ5PGFueT4gPSB0aGlzLiRtYWluRWxlbWVudDtcclxuICAgICAgICBcclxuICAgICAgICBpZigkZWxlbWVudCA9PSBudWxsKSAkZWxlbWVudCA9IGpRdWVyeShkb2N1bWVudCk7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAkZWxlbWVudC5vbihcImtleWRvd25cIiwgZnVuY3Rpb24gKGV2ZW50OiBKUXVlcnkuS2V5RG93bkV2ZW50KSB7IFxyXG4gICAgICAgICAgICBpZihldmVudCAhPSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHRoYXQuZXhlY3V0ZUtleURvd25FdmVudChldmVudCk7IFxyXG5cclxuICAgICAgICAgICAgICAgIC8qXHJcbiAgICAgICAgICAgICAgICAgKiBFdmVudCBpcyBidWJibGluZyBkb3duIHRvIGJvZHkgZWxlbWVudFxyXG4gICAgICAgICAgICAgICAgICogd2hlbiBwcmVzc2luZyBzcGFjZSBiYXIgaW4gZW1iZWRkZWQgbW9kZSB3aGlsZSBwcm9ncmFtIHJ1bnMuXHJcbiAgICAgICAgICAgICAgICAgKiBUaGlzIGxlYWRzIHRvIHNjcm9sbGluZyBwYWdlIGRvd24uIFRvIHByZXZlbnQgdGhpczpcclxuICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgaWYoZXZlbnQua2V5ID09IFwiIFwiICYmIHRoYXQubWFpbi5pc0VtYmVkZGVkKCkgJiYgXHJcbiAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4uZ2V0SW50ZXJwcmV0ZXIoKS5zdGF0ZSA9PSBJbnRlcnByZXRlclN0YXRlLnJ1bm5pbmcgJiYgIXRoYXQubWFpbi5nZXRNb25hY29FZGl0b3IoKS5oYXNUZXh0Rm9jdXMoKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0cmlnZ2VyKGFjdGlvbklkZW50aWZpZXI6IHN0cmluZykge1xyXG4gICAgICAgIGxldCBhZSA9IHRoaXMuYWN0aW9uc1thY3Rpb25JZGVudGlmaWVyXTtcclxuICAgICAgICBpZihhZSAhPSBudWxsKXtcclxuICAgICAgICAgICAgYWUuYWN0aW9uKGFjdGlvbklkZW50aWZpZXIsIG51bGwsIFwiXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHVibGljIHJlZ2lzdGVyQWN0aW9uKGlkZW50aWZpZXI6IHN0cmluZywga2V5czogc3RyaW5nW10sIGFjdGlvbjogQWN0aW9uLCB0ZXh0OiBzdHJpbmcgPSBcIlwiLCBidXR0b24/OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KXtcclxuICAgICAgICBsZXQgYWU6IEFjdGlvbkVudHJ5ID0ge1xyXG4gICAgICAgICAgICBhY3Rpb246IGFjdGlvbixcclxuICAgICAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcclxuICAgICAgICAgICAga2V5czoga2V5cyxcclxuICAgICAgICAgICAgdGV4dDogdGV4dCxcclxuICAgICAgICAgICAgYWN0aXZlOiB0cnVlXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdGhpcy5hY3Rpb25zW2lkZW50aWZpZXJdID0gYWU7XHJcblxyXG4gICAgICAgIGZvcihsZXQga2V5IG9mIGtleXMpe1xyXG4gICAgICAgICAgICBpZih0aGlzLmtleUVudHJpZXNba2V5LnRvTG93ZXJDYXNlKCldID09IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgdGhpcy5rZXlFbnRyaWVzW2tleS50b0xvd2VyQ2FzZSgpXSA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMua2V5RW50cmllc1trZXkudG9Mb3dlckNhc2UoKV0ucHVzaChhZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZihidXR0b24gIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIGlmKHRoaXMuYnV0dG9uc1tpZGVudGlmaWVyXSA9PSBudWxsKXtcclxuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9uc1tpZGVudGlmaWVyXSA9IFtdO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuYnV0dG9uc1tpZGVudGlmaWVyXS5wdXNoKGJ1dHRvbik7XHJcblxyXG4gICAgICAgICAgICBsZXQgdCA9IHRleHQ7XHJcbiAgICAgICAgICAgIGlmKGtleXMubGVuZ3RoID4gMCl7XHJcbiAgICAgICAgICAgICAgICB0ICs9IFwiIFtcIiArIGtleXMuam9pbihcIiwgXCIpICsgXCJdXCI7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGJ1dHRvbi5hdHRyKFwidGl0bGVcIiwgdCk7XHJcblxyXG4gICAgICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG5cclxuICAgICAgICAgICAgYnV0dG9uLm9uKG1vdXNlUG9pbnRlciArICdkb3duJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYoYWUuYWN0aXZlKXtcclxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24oaWRlbnRpZmllciwgbnVsbCwgXCJtb3VzZWRvd25cIik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihpZGVudGlmaWVyID09IFwiaW50ZXJwcmV0ZXIuc3RhcnRcIil7XHJcbiAgICAgICAgICAgICAgICAgICAgU291bmRUb29scy5pbml0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBpc0FjdGl2ZShhY3Rpb25JZGVudGlmaWVyOiBzdHJpbmcpOiBib29sZWFuIHtcclxuXHJcbiAgICAgICAgbGV0IGFlOiBBY3Rpb25FbnRyeSA9IHRoaXMuYWN0aW9uc1thY3Rpb25JZGVudGlmaWVyXTtcclxuICAgICAgICBcclxuICAgICAgICBpZihhZSA9PSBudWxsKSByZXR1cm4gZmFsc2U7XHJcblxyXG4gICAgICAgIHJldHVybiBhZS5hY3RpdmU7XHJcbiAgICBcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgc2V0QWN0aXZlKGFjdGlvbklkZW50aWZpZXI6IHN0cmluZywgYWN0aXZlOiBib29sZWFuKXtcclxuICAgICAgICBsZXQgYWU6IEFjdGlvbkVudHJ5ID0gdGhpcy5hY3Rpb25zW2FjdGlvbklkZW50aWZpZXJdO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGFlICE9IG51bGwpe1xyXG4gICAgICAgICAgICBhZS5hY3RpdmUgPSBhY3RpdmU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYnV0dG9ucyA9IHRoaXMuYnV0dG9uc1thY3Rpb25JZGVudGlmaWVyXTtcclxuICAgICAgICBpZihidXR0b25zICE9IG51bGwpe1xyXG4gICAgICAgICAgICBmb3IobGV0IGJ1dHRvbiBvZiBidXR0b25zKXtcclxuICAgICAgICAgICAgICAgIGlmKGFjdGl2ZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uLmFkZENsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnV0dG9uLnJlbW92ZUNsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGV4ZWN1dGVLZXlEb3duRXZlbnQoZXZlbnQ6IEpRdWVyeS5LZXlEb3duRXZlbnQpIHtcclxuXHJcbiAgICAgICAgaWYoZG9jdW1lbnQuYWN0aXZlRWxlbWVudC50YWdOYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJpbnB1dFwiKXtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKGV2ZW50LmtleUNvZGUgPD0gMTggJiYgZXZlbnQua2V5Q29kZSA+PSAxNikge1xyXG4gICAgICAgICAgICByZXR1cm47IC8vIGN0cmwsIGFsdCwgc2hpZnRcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBrZXk6IHN0cmluZyA9IFwiXCI7XHJcblxyXG4gICAgICAgIGlmIChldmVudC5jdHJsS2V5KSB7XHJcbiAgICAgICAgICAgIGtleSArPSBcImN0cmwrXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXZlbnQuc2hpZnRLZXkpIHtcclxuICAgICAgICAgICAga2V5ICs9IFwic2hpZnQrXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoZXZlbnQuYWx0S2V5KSB7XHJcbiAgICAgICAgICAgIGtleSArPSBcImFsdCtcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKGV2ZW50LmtleSAhPSBudWxsKXtcclxuICAgICAgICAgICAga2V5ICs9IGV2ZW50LmtleS50b0xvd2VyQ2FzZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGFjdGlvbkVudHJpZXMgPSB0aGlzLmtleUVudHJpZXNba2V5XTtcclxuXHJcbiAgICAgICAgaWYoYWN0aW9uRW50cmllcyAhPSBudWxsKXtcclxuICAgICAgICAgICAgZm9yKGxldCBhY3Rpb25FbnRyeSBvZiBhY3Rpb25FbnRyaWVzKXtcclxuICAgICAgICAgICAgICAgIGlmIChhY3Rpb25FbnRyeS5hY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbkVudHJ5LmFjdGlvbihhY3Rpb25FbnRyeS5pZGVudGlmaWVyLCBudWxsLCBrZXkpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==