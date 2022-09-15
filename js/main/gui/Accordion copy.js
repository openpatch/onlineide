import { openContextMenu, makeEditable, jo_mouseDetected } from "../../tools/HtmlTools.js";
import { Helper } from "./Helper.js";
import { escapeHtml } from "../../tools/StringTools.js";
export class AccordionPanel {
    constructor(accordion, caption, flexWeight, newButtonClass, buttonNewTitle, defaultIconClass, withDeleteButton) {
        this.accordion = accordion;
        this.caption = caption;
        this.flexWeight = flexWeight;
        this.newButtonClass = newButtonClass;
        this.buttonNewTitle = buttonNewTitle;
        this.defaultIconClass = defaultIconClass;
        this.withDeleteButton = withDeleteButton;
        this.elements = [];
        this.dontSortElements = false;
        accordion.addPanel(this);
    }
    remove() {
        this.$captionElement.remove();
        this.$listElement.remove();
    }
    setFixed(fixed) {
        this.fixed = fixed;
        if (this.fixed) {
            this.grow();
            this.$captionElement.addClass('jo_fixed');
        }
        else {
            this.$captionElement.removeClass('jo_fixed');
        }
    }
    //     <div class="jo_leftpanelcaption expanded" id="workspace" data-panel="filelistouter">
    //     <span>WORKSPACE</span>
    //     <div class="jo_actions"><img id="buttonNewFile" title="Neue Datei hinzufügen"
    //             src="assets/projectexplorer/add-file-dark.svg"></div>
    // </div>
    // <div id="filelistouter" class="jo_projectexplorerdiv scrollable" data-grow="3"
    //     style="flex-grow: 3">
    //     <div id="filelist"></div>
    // </div>
    enableNewButton(enabled) {
        if (this.$buttonNew != null) {
            if (enabled) {
                this.$buttonNew.show();
            }
            else {
                this.$buttonNew.hide();
            }
        }
    }
    renderOuterHtmlElements($accordionDiv) {
        let that = this;
        this.$captionElement = jQuery(`<div class="jo_leftpanelcaption jo_expanded">
        <span>` + this.caption + `</span><div class="jo_actions"></div></div>`);
        if (this.newButtonClass != null) {
            this.$buttonNew = jQuery('<div class="jo_button jo_active ' + this.newButtonClass + '" title="' + this.buttonNewTitle + '">');
            this.$captionElement.find('.jo_actions').append(this.$buttonNew);
            let mousePointer = window.PointerEvent ? "pointer" : "mouse";
            this.$buttonNew.on(mousePointer + 'down', (ev) => {
                Helper.close();
                ev.stopPropagation();
                let ae = {
                    name: "Neu"
                };
                that.elements.push(ae);
                let $element = that.renderElement(ae);
                that.$listElement.prepend($element);
                that.$listElement.scrollTop(0);
                that.renameElement(ae, () => {
                    that.newElementCallback(ae, (externalElement) => {
                        ae.externalElement = externalElement;
                        if (ae.$htmlSecondLine != null) {
                            ae.$htmlSecondLine.insertAfter($element);
                        }
                        if (that.selectCallback != null)
                            that.select(ae.externalElement);
                    });
                });
            });
        }
        let $listOuter = jQuery('<div id="filelistouter" class="jo_projectexplorerdiv jo_scrollable" data-grow="'
            + this.flexWeight + '" style="flex-grow: ' + this.flexWeight + '"></div>');
        this.$listElement = jQuery('<div class="jo_filelist"></div>');
        $listOuter.append(this.$listElement);
        $accordionDiv.append(this.$captionElement);
        $accordionDiv.append($listOuter);
        let $ce = this.$captionElement;
        let $li = this.$listElement.parent();
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        $ce.on(mousePointer + 'down', (ev) => {
            if (ev.button != 0) {
                return;
            }
            if (!this.fixed) {
                let targetGrow = $li.data('grow');
                if ($ce.hasClass('jo_expanded')) {
                    if (that.accordion.parts.length > 1) {
                        $li.animate({
                            'flex-grow': 0.001
                        }, 1000, () => { $ce.toggleClass('jo_expanded'); });
                    }
                }
                else {
                    $ce.toggleClass('jo_expanded');
                    $li.animate({
                        'flex-grow': targetGrow
                    }, 1000);
                }
            }
        });
    }
    grow() {
        let $li = this.$listElement.parent();
        let targetGrow = $li.data('grow');
        $li.css('flex-grow', targetGrow);
        this.$captionElement.addClass('jo_expanded');
    }
    addElement(element) {
        this.elements.push(element);
        element.$htmlFirstLine = this.renderElement(element);
        this.$listElement.prepend(element.$htmlFirstLine);
    }
    sortElements() {
        if (this.dontSortElements)
            return;
        this.elements.sort((a, b) => {
            let aName = a.sortName ? a.sortName : a.name;
            let bName = b.sortName ? b.sortName : b.name;
            return (aName.localeCompare(bName));
        });
        this.elements.forEach((element) => { this.$listElement.append(element.$htmlFirstLine); });
    }
    setTextAfterFilename(element, text, cssClass) {
        let $div = element.$htmlFirstLine.find('.jo_textAfterName');
        $div.addClass(cssClass);
        $div.html(text);
    }
    addAction($element) {
        this.$captionElement.find('.jo_actions').prepend($element);
    }
    renderElement(element) {
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        let that = this;
        if (element.iconClass == null)
            element.iconClass = this.defaultIconClass;
        element.$htmlFirstLine = jQuery(`<div class="jo_file jo_${element.iconClass}">
        <div class="jo_fileimage"></div><div class="jo_filename">${escapeHtml(element.name)}</div>
           <div class="jo_textAfterName"></div>
           <div class="jo_additionalButtonHomework"></div>
           <div class="jo_additionalButtonStart"></div>
           <div class="jo_additionalButtonRepository"></div>
           ${this.withDeleteButton ? '<div class="jo_delete img_delete jo_button jo_active' + (false ? " jo_delete_always" : "") + '"></div>' : ""}
           ${!jo_mouseDetected ? '<div class="jo_settings_button img_ellipsis-dark jo_button jo_active"></div>' : ""}
           </div>`);
        if (this.addElementActionCallback != null) {
            let $elementAction = this.addElementActionCallback(element);
            element.$htmlFirstLine.append($elementAction);
        }
        element.$htmlFirstLine.on(mousePointer + 'down', (ev) => {
            if (ev.button == 0 && that.selectCallback != null) {
                that.selectCallback(element.externalElement);
                for (let ae of that.elements) {
                    if (ae != element && ae.$htmlFirstLine.hasClass('jo_active')) {
                        ae.$htmlFirstLine.removeClass('jo_active');
                    }
                }
                element.$htmlFirstLine.addClass('jo_active');
            }
        });
        let contextmenuHandler = function (event) {
            let contextMenuItems = [];
            if (that.renameCallback != null) {
                contextMenuItems.push({
                    caption: "Umbenennen",
                    callback: () => {
                        that.renameElement(element);
                    }
                });
            }
            if (that.contextMenuProvider != null) {
                for (let cmi of that.contextMenuProvider(element)) {
                    contextMenuItems.push({
                        caption: cmi.caption,
                        callback: () => {
                            cmi.callback(element);
                        },
                        color: cmi.color,
                        subMenu: cmi.subMenu == null ? null : cmi.subMenu.map((mi) => {
                            return {
                                caption: mi.caption,
                                callback: () => {
                                    mi.callback(element);
                                },
                                color: mi.color
                            };
                        })
                    });
                }
            }
            if (contextMenuItems.length > 0) {
                event.preventDefault();
                event.stopPropagation();
                openContextMenu(contextMenuItems, event.pageX, event.pageY);
            }
        };
        element.$htmlFirstLine[0].addEventListener("contextmenu", contextmenuHandler, false);
        // long press for touch devices
        let pressTimer;
        if (!jo_mouseDetected) {
            element.$htmlFirstLine.on('pointerup', () => {
                clearTimeout(pressTimer);
                return false;
            }).on('pointerdown', (event) => {
                pressTimer = window.setTimeout(() => {
                    contextmenuHandler(event);
                }, 500);
                return false;
            });
        }
        if (!jo_mouseDetected) {
            element.$htmlFirstLine.find('.jo_settings_button').on('pointerdown', (e) => {
                contextmenuHandler(e);
            });
            element.$htmlFirstLine.find('.jo_settings_button').on('mousedown click', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        }
        if (that.withDeleteButton) {
            element.$htmlFirstLine.find('.jo_delete').on(mousePointer + 'down', (ev) => {
                ev.preventDefault();
                openContextMenu([{
                        caption: "Abbrechen",
                        callback: () => {
                            // nothing to do.
                        }
                    }, {
                        caption: "Ich bin mir sicher: löschen!",
                        color: "#ff6060",
                        callback: () => {
                            that.deleteCallback(element.externalElement, () => {
                                element.$htmlFirstLine.remove();
                                if (element.$htmlSecondLine != null)
                                    element.$htmlSecondLine.remove();
                                that.elements.splice(that.elements.indexOf(element), 1);
                                if (that.selectCallback != null) {
                                    if (that.elements.length > 0) {
                                        that.select(that.elements[0].externalElement);
                                    }
                                    else {
                                        that.select(null);
                                    }
                                }
                            });
                        }
                    }], ev.pageX + 2, ev.pageY + 2);
                ev.stopPropagation();
            });
        }
        return element.$htmlFirstLine;
    }
    renameElement(element, callback) {
        let that = this;
        let $div = element.$htmlFirstLine.find('.jo_filename');
        let pointPos = element.name.indexOf('.');
        let selection = pointPos == null ? null : { start: 0, end: pointPos };
        this.dontSortElements = true;
        makeEditable($div, $div, (newText) => {
            if (element.externalElement != null)
                newText = that.renameCallback(element.externalElement, newText);
            element.name = newText;
            $div.html(element.name);
            if (callback != null)
                callback();
            that.sortElements();
            $div[0].scrollIntoView();
            this.dontSortElements = false;
        }, selection);
    }
    select(externalElement, invokeCallback = true, scrollIntoView = false) {
        if (externalElement == null) {
            for (let ae1 of this.elements) {
                if (ae1.$htmlFirstLine.hasClass('jo_active'))
                    ae1.$htmlFirstLine.removeClass('jo_active');
            }
        }
        else {
            let ae = this.findElement(externalElement);
            if (ae != null) {
                for (let ae1 of this.elements) {
                    if (ae1.$htmlFirstLine.hasClass('jo_active'))
                        ae1.$htmlFirstLine.removeClass('jo_active');
                }
                ae.$htmlFirstLine.addClass('jo_active');
                if (scrollIntoView) {
                    ae.$htmlFirstLine[0].scrollIntoView();
                }
            }
        }
        if (invokeCallback && this.selectCallback != null)
            this.selectCallback(externalElement);
    }
    setElementClass(element, iconClass) {
        var _a;
        if (element != null) {
            (_a = element.$htmlFirstLine) === null || _a === void 0 ? void 0 : _a.removeClass("jo_" + element.iconClass).addClass("jo_" + iconClass);
            element.iconClass = iconClass;
        }
    }
    findElement(externalElement) {
        for (let ae of this.elements) {
            if (ae.externalElement == externalElement) {
                return ae;
            }
        }
        return null;
    }
    removeElement(externalElement) {
        for (let ae of this.elements) {
            if (ae.externalElement == externalElement) {
                ae.$htmlFirstLine.remove();
                if (ae.$htmlSecondLine != null)
                    ae.$htmlSecondLine.remove();
                this.elements.splice(this.elements.indexOf(ae), 1);
                if (this.selectCallback != null) {
                    if (this.elements.length > 0) {
                        this.select(this.elements[0].externalElement);
                    }
                    else {
                        this.select(null);
                    }
                }
                return;
            }
        }
    }
    clear() {
        this.$listElement.empty();
        this.elements = [];
    }
    setCaption(text) {
        this.$captionElement.find('span').html(text);
    }
    getSelectedElementData() {
        for (let ae of this.elements) {
            if (ae.$htmlFirstLine.hasClass('jo_active')) {
                return ae;
            }
        }
        return null;
    }
}
export class Accordion {
    constructor($html) {
        this.parts = [];
        this.$html = $html;
        $html.addClass('jo_leftpanelinner');
    }
    addPanel(panel) {
        panel.renderOuterHtmlElements(this.$html);
        this.parts.push(panel);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNjb3JkaW9uIGNvcHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL0FjY29yZGlvbiBjb3B5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFtQixnQkFBZ0IsRUFBRSxNQUFNLDBCQUEwQixDQUFDO0FBQzVHLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFDckMsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBa0J4RCxNQUFNLE9BQU8sY0FBYztJQW1CdkIsWUFBb0IsU0FBb0IsRUFBVSxPQUFlLEVBQVUsVUFBa0IsRUFDakYsY0FBc0IsRUFBVSxjQUFzQixFQUN0RCxnQkFBd0IsRUFBVSxnQkFBeUI7UUFGbkQsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUFVLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBVSxlQUFVLEdBQVYsVUFBVSxDQUFRO1FBQ2pGLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1FBQVUsbUJBQWMsR0FBZCxjQUFjLENBQVE7UUFDdEQscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFRO1FBQVUscUJBQWdCLEdBQWhCLGdCQUFnQixDQUFTO1FBbkJ2RSxhQUFRLEdBQXVCLEVBQUUsQ0FBQztRQVFsQyxxQkFBZ0IsR0FBWSxLQUFLLENBQUM7UUFhOUIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUU3QixDQUFDO0lBRUQsTUFBTTtRQUNGLElBQUksQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDOUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsQ0FBQztJQUMvQixDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQWM7UUFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1osSUFBSSxD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SztRQUNELElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDMUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDdkIsQ0FBQztJQUVELFVBQVUsQ0FBQyxJQUFZO1FBQ25CLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsc0JBQXNCO1FBQ2xCLEtBQUssSUFBSSxFQUFFLElBQUksSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUMxQixJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFO2dCQUN6QyxPQUFPLEVBQUUsQ0FBQzthQUNiO1NBQ0o7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0NBRUo7QUFHRCxNQUFNLE9BQU8sU0FBUztJQUtsQixZQUFZLEtBQTBCO1FBSHRDLFVBQUssR0FBcUIsRUFBRSxDQUFDO1FBSXpCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLEtBQUssQ0FBQyxRQUFRLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUN4QyxDQUFDO0lBRUQsUUFBUSxDQUFDLEtBQXFCO1FBQzFCLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDMUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsQ0FBQztDQUlKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgb3BlbkNvbnRleHRNZW51LCBtYWtlRWRpdGFibGUsIENvbnRleHRNZW51SXRlbSwgam9fbW91c2VEZXRlY3RlZCB9IGZyb20gXCIuLi8uLi90b29scy9IdG1sVG9vbHMuanNcIjtcclxuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4vSGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IGVzY2FwZUh0bWwgfSBmcm9tIFwiLi4vLi4vdG9vbHMvU3RyaW5nVG9vbHMuanNcIjtcclxuXHJcbmV4cG9ydCB0eXBlIEFjY29yZGlvbkVsZW1lbnQgPSB7XHJcbiAgICBuYW1lOiBzdHJpbmc7XHJcbiAgICBzb3J0TmFtZT86IHN0cmluZzsgICAgICAvLyBpZiBzb3J0TmFtZSA9PSBudWxsLCB0aGVuIG5hbWUgd2lsbCBiZSB1c2VkIHdoZW4gc29ydGluZ1xyXG4gICAgZXh0ZXJuYWxFbGVtZW50PzogYW55O1xyXG4gICAgaWNvbkNsYXNzPzogc3RyaW5nO1xyXG4gICAgJGh0bWxGaXJzdExpbmU/OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJGh0bWxTZWNvbmRMaW5lPzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQWNjb3JkaW9uQ29udGV4dE1lbnVJdGVtID0ge1xyXG4gICAgY2FwdGlvbjogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBzdHJpbmc7XHJcbiAgICBjYWxsYmFjazogKHBhbmVsOiBBY2NvcmRpb25FbGVtZW50KSA9PiB2b2lkO1xyXG4gICAgc3ViTWVudT86IEFjY29yZGlvbkNvbnRleHRNZW51SXRlbVtdXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBY2NvcmRpb25QYW5lbCB7XHJcblxyXG4gICAgZWxlbWVudHM6IEFjY29yZGlvbkVsZW1lbnRbXSA9IFtdO1xyXG5cclxuICAgICRjYXB0aW9uRWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRidXR0b25OZXc6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkbGlzdEVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgcHJpdmF0ZSBmaXhlZDogYm9vbGVhbjtcclxuXHJcbiAgICBkb250U29ydEVsZW1lbnRzOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgbmV3RWxlbWVudENhbGxiYWNrOiAoYWU6IEFjY29yZGlvbkVsZW1lbnQsIGNhbGxiYWNrSWZTdWNjZXNzZnVsOiAoZXh0ZXJuYWxFbGVtZW50OiBhbnkpID0+IHZvaWQpID0+IHZvaWQ7XHJcbiAgICByZW5hbWVDYWxsYmFjazogKGV4dGVybmFsRWxlbWVudDogYW55LCBuZXdOYW1lOiBzdHJpbmcpID0+IHN0cmluZztcclxuICAgIGRlbGV0ZUNhbGxiYWNrOiAoZXh0ZXJuYWxFbGVtZW50OiBhbnksIGNhbGxiYWNrSWZTdWNjZXNzZnVsOiAoKSA9PiB2b2lkKSA9PiB2b2lkO1xyXG4gICAgc2VsZWN0Q2FsbGJhY2s6IChleHRlcm5hbEVsZW1lbnQ6IGFueSkgPT4gdm9pZDtcclxuICAgIGFkZEVsZW1lbnRBY3Rpb25DYWxsYmFjazogKGFjY29yZGlvbkVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQpID0+IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICBjb250ZXh0TWVudVByb3ZpZGVyOiAoZXh0ZXJuYWxFbGVtZW50OiBhbnkpID0+IEFjY29yZGlvbkNvbnRleHRNZW51SXRlbVtdO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYWNjb3JkaW9uOiBBY2NvcmRpb24sIHByaXZhdGUgY2FwdGlvbjogc3RyaW5nLCBwcml2YXRlIGZsZXhXZWlnaHQ6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIG5ld0J1dHRvbkNsYXNzOiBzdHJpbmcsIHByaXZhdGUgYnV0dG9uTmV3VGl0bGU6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIGRlZmF1bHRJY29uQ2xhc3M6IHN0cmluZywgcHJpdmF0ZSB3aXRoRGVsZXRlQnV0dG9uOiBib29sZWFuKSB7XHJcblxyXG4gICAgICAgIGFjY29yZGlvbi5hZGRQYW5lbCh0aGlzKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlKCkge1xyXG4gICAgICAgIHRoaXMuJGNhcHRpb25FbGVtZW50LnJlbW92ZSgpO1xyXG4gICAgICAgIHRoaXMuJGxpc3RFbGVtZW50LnJlbW92ZSgpO1xyXG4gICAgfVxyXG5cclxuICAgIHNldEZpeGVkKGZpeGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgdGhpcy5maXhlZCA9IGZpeGVkO1xyXG4gICAgICAgIGlmICh0aGlzLmZpeGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZ3JvdygpO1xyXG4gICAgICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5hZGRDbGFzcygnam9fZml4ZWQnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5yZW1vdmVDbGFzcygnam9fZml4ZWQnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vICAgICA8ZGl2IGNsYXNzPVwiam9fbGVmdHBhbmVsY2FwdGlvbiBleHBhbmRlZFwiIGlkPVwid29ya3NwYWNlXCIgZGF0YS1wYW5lbD1cImZpbGVsaXN0b3V0ZXJcIj5cclxuICAgIC8vICAgICA8c3Bhbj5XT1JLU1BBQ0U8L3NwYW4+XHJcbiAgICAvLyAgICAgPGRpdiBjbGFzcz1cImpvX2FjdGlvbnNcIj48aW1nIGlkPVwiYnV0dG9uTmV3RmlsZVwiIHRpdGxlPVwiTmV1ZSBEYXRlaSBoaW56dWbDvGdlblwiXHJcbiAgICAvLyAgICAgICAgICAgICBzcmM9XCJhc3NldHMvcHJvamVjdGV4cGxvcmVyL2FkZC1maWxlLWRhcmsuc3ZnXCI+PC9kaXY+XHJcbiAgICAvLyA8L2Rpdj5cclxuICAgIC8vIDxkaXYgaWQ9XCJmaWxlbGlzdG91dGVyXCIgY2xhc3M9XCJqb19wcm9qZWN0ZXhwbG9yZXJkaXYgc2Nyb2xsYWJsZVwiIGRhdGEtZ3Jvdz1cIjNcIlxyXG4gICAgLy8gICAgIHN0eWxlPVwiZmxleC1ncm93OiAzXCI+XHJcbiAgICAvLyAgICAgPGRpdiBpZD1cImZpbGVsaXN0XCI+PC9kaXY+XHJcbiAgICAvLyA8L2Rpdj5cclxuXHJcblxyXG4gICAgZW5hYmxlTmV3QnV0dG9uKGVuYWJsZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICBpZiAodGhpcy4kYnV0dG9uTmV3ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgaWYgKGVuYWJsZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5ldy5zaG93KCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXcuaGlkZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICByZW5kZXJPdXRlckh0bWxFbGVtZW50cygkYWNjb3JkaW9uRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudCA9IGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX2xlZnRwYW5lbGNhcHRpb24gam9fZXhwYW5kZWRcIj5cclxuICAgICAgICA8c3Bhbj5gICsgdGhpcy5jYXB0aW9uICsgYDwvc3Bhbj48ZGl2IGNsYXNzPVwiam9fYWN0aW9uc1wiPjwvZGl2PjwvZGl2PmApO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5uZXdCdXR0b25DbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5ldyA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2J1dHRvbiBqb19hY3RpdmUgJyArIHRoaXMubmV3QnV0dG9uQ2xhc3MgKyAnXCIgdGl0bGU9XCInICsgdGhpcy5idXR0b25OZXdUaXRsZSArICdcIj4nKTtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuZmluZCgnLmpvX2FjdGlvbnMnKS5hcHBlbmQodGhpcy4kYnV0dG9uTmV3KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcbiAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5ldy5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChldikgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIEhlbHBlci5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFlOiBBY2NvcmRpb25FbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiTmV1XCJcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmVsZW1lbnRzLnB1c2goYWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCAkZWxlbWVudCA9IHRoYXQucmVuZGVyRWxlbWVudChhZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LiRsaXN0RWxlbWVudC5wcmVwZW5kKCRlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LiRsaXN0RWxlbWVudC5zY3JvbGxUb3AoMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5yZW5hbWVFbGVtZW50KGFlLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubmV3RWxlbWVudENhbGxiYWNrKGFlLCAoZXh0ZXJuYWxFbGVtZW50OiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFlLmV4dGVybmFsRWxlbWVudCA9IGV4dGVybmFsRWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZS4kaHRtbFNlY29uZExpbmUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWUuJGh0bWxTZWNvbmRMaW5lLmluc2VydEFmdGVyKCRlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkgdGhhdC5zZWxlY3QoYWUuZXh0ZXJuYWxFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgJGxpc3RPdXRlciA9IGpRdWVyeSgnPGRpdiBpZD1cImZpbGVsaXN0b3V0ZXJcIiBjbGFzcz1cImpvX3Byb2plY3RleHBsb3JlcmRpdiBqb19zY3JvbGxhYmxlXCIgZGF0YS1ncm93PVwiJ1xyXG4gICAgICAgICAgICArIHRoaXMuZmxleFdlaWdodCArICdcIiBzdHlsZT1cImZsZXgtZ3JvdzogJyArIHRoaXMuZmxleFdlaWdodCArICdcIj48L2Rpdj4nKTtcclxuICAgICAgICB0aGlzLiRsaXN0RWxlbWVudCA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2ZpbGVsaXN0XCI+PC9kaXY+JylcclxuXHJcbiAgICAgICAgJGxpc3RPdXRlci5hcHBlbmQodGhpcy4kbGlzdEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAkYWNjb3JkaW9uRGl2LmFwcGVuZCh0aGlzLiRjYXB0aW9uRWxlbWVudCk7XHJcbiAgICAgICAgJGFjY29yZGlvbkRpdi5hcHBlbmQoJGxpc3RPdXRlcik7XHJcblxyXG4gICAgICAgIGxldCAkY2UgPSB0aGlzLiRjYXB0aW9uRWxlbWVudDtcclxuICAgICAgICBsZXQgJGxpID0gdGhpcy4kbGlzdEVsZW1lbnQucGFyZW50KCk7XHJcbiAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuXHJcbiAgICAgICAgJGNlLm9uKG1vdXNlUG9pbnRlciArICdkb3duJywgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZml4ZWQpIHtcclxuICAgICAgICAgICAgICAgIGxldCB0YXJnZXRHcm93ID0gJGxpLmRhdGEoJ2dyb3cnKTtcclxuICAgICAgICAgICAgICAgIGlmICgkY2UuaGFzQ2xhc3MoJ2pvX2V4cGFuZGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5hY2NvcmRpb24ucGFydHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkbGkuYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxleC1ncm93JzogMC4wMDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCwgKCkgPT4geyAkY2UudG9nZ2xlQ2xhc3MoJ2pvX2V4cGFuZGVkJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGNlLnRvZ2dsZUNsYXNzKCdqb19leHBhbmRlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICRsaS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2ZsZXgtZ3Jvdyc6IHRhcmdldEdyb3dcclxuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ3Jvdygpe1xyXG4gICAgICAgIGxldCAkbGkgPSB0aGlzLiRsaXN0RWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgICBsZXQgdGFyZ2V0R3JvdyA9ICRsaS5kYXRhKCdncm93Jyk7XHJcbiAgICAgICAgJGxpLmNzcygnZmxleC1ncm93JywgdGFyZ2V0R3Jvdyk7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuYWRkQ2xhc3MoJ2pvX2V4cGFuZGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRWxlbWVudChlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50KSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUgPSB0aGlzLnJlbmRlckVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQucHJlcGVuZChlbGVtZW50LiRodG1sRmlyc3RMaW5lKTtcclxuICAgIH1cclxuXHJcbiAgICBzb3J0RWxlbWVudHMoKXtcclxuICAgICAgICBpZih0aGlzLmRvbnRTb3J0RWxlbWVudHMpIHJldHVybjtcclxuICAgICAgICB0aGlzLmVsZW1lbnRzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFOYW1lID0gYS5zb3J0TmFtZSA/IGEuc29ydE5hbWUgOiBhLm5hbWU7XHJcbiAgICAgICAgICAgIGxldCBiTmFtZSA9IGIuc29ydE5hbWUgPyBiLnNvcnROYW1lIDogYi5uYW1lO1xyXG4gICAgICAgICAgICByZXR1cm4gKGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHt0aGlzLiRsaXN0RWxlbWVudC5hcHBlbmQoZWxlbWVudC4kaHRtbEZpcnN0TGluZSl9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUZXh0QWZ0ZXJGaWxlbmFtZShlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50LCB0ZXh0OiBzdHJpbmcsIGNzc0NsYXNzOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgJGRpdiA9IGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX3RleHRBZnRlck5hbWUnKTtcclxuICAgICAgICAkZGl2LmFkZENsYXNzKGNzc0NsYXNzKTtcclxuICAgICAgICAkZGl2Lmh0bWwodGV4dCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFkZEFjdGlvbigkZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIHRoaXMuJGNhcHRpb25FbGVtZW50LmZpbmQoJy5qb19hY3Rpb25zJykucHJlcGVuZCgkZWxlbWVudCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbmRlckVsZW1lbnQoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCk6IEpRdWVyeTxIVE1MRWxlbWVudD4ge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoZWxlbWVudC5pY29uQ2xhc3MgPT0gbnVsbCkgZWxlbWVudC5pY29uQ2xhc3MgPSB0aGlzLmRlZmF1bHRJY29uQ2xhc3M7XHJcblxyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19maWxlIGpvXyR7ZWxlbWVudC5pY29uQ2xhc3N9XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImpvX2ZpbGVpbWFnZVwiPjwvZGl2PjxkaXYgY2xhc3M9XCJqb19maWxlbmFtZVwiPiR7ZXNjYXBlSHRtbChlbGVtZW50Lm5hbWUpfTwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb190ZXh0QWZ0ZXJOYW1lXCI+PC9kaXY+XHJcbiAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2FkZGl0aW9uYWxCdXR0b25Ib21ld29ya1wiPjwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19hZGRpdGlvbmFsQnV0dG9uU3RhcnRcIj48L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fYWRkaXRpb25hbEJ1dHRvblJlcG9zaXRvcnlcIj48L2Rpdj5cclxuICAgICAgICAgICAke3RoaXMud2l0aERlbGV0ZUJ1dHRvbiA/ICc8ZGl2IGNsYXNzPVwiam9fZGVsZXRlIGltZ19kZWxldGUgam9fYnV0dG9uIGpvX2FjdGl2ZScgKyAoZmFsc2UgPyBcIiBqb19kZWxldGVfYWx3YXlzXCIgOiBcIlwiKSArJ1wiPjwvZGl2PicgOiBcIlwifVxyXG4gICAgICAgICAgICR7IWpvX21vdXNlRGV0ZWN0ZWQgPyAnPGRpdiBjbGFzcz1cImpvX3NldHRpbmdzX2J1dHRvbiBpbWdfZWxsaXBzaXMtZGFyayBqb19idXR0b24gam9fYWN0aXZlXCI+PC9kaXY+JyA6IFwiXCJ9XHJcbiAgICAgICAgICAgPC9kaXY+YCk7XHJcbiAgICAgICAgICAgXHJcbiAgICAgICAgICAgaWYgKHRoaXMuYWRkRWxlbWVudEFjdGlvbkNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgbGV0ICRlbGVtZW50QWN0aW9uID0gdGhpcy5hZGRFbGVtZW50QWN0aW9uQ2FsbGJhY2soZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYXBwZW5kKCRlbGVtZW50QWN0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChldikgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSAwICYmIHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RDYWxsYmFjayhlbGVtZW50LmV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhhdC5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhZSAhPSBlbGVtZW50ICYmIGFlLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZS4kaHRtbEZpcnN0TGluZS5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYWRkQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBjb250ZXh0bWVudUhhbmRsZXIgPSAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgY29udGV4dE1lbnVJdGVtczogQ29udGV4dE1lbnVJdGVtW10gPSBbXTtcclxuICAgICAgICAgICAgaWYgKHRoYXQucmVuYW1lQ2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dE1lbnVJdGVtcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlVtYmVuZW5uZW5cIixcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbmFtZUVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQuY29udGV4dE1lbnVQcm92aWRlciAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY21pIG9mIHRoYXQuY29udGV4dE1lbnVQcm92aWRlcihlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRNZW51SXRlbXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IGNtaS5jYXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21pLmNhbGxiYWNrKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY21pLmNvbG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJNZW51OiBjbWkuc3ViTWVudSA9PSBudWxsID8gbnVsbCA6IGNtaS5zdWJNZW51Lm1hcCgobWkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogbWkuY2FwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaS5jYWxsYmFjayhlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBtaS5jb2xvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0TWVudUl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIG9wZW5Db250ZXh0TWVudShjb250ZXh0TWVudUl0ZW1zLCBldmVudC5wYWdlWCwgZXZlbnQucGFnZVkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZVswXS5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgY29udGV4dG1lbnVIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIC8vIGxvbmcgcHJlc3MgZm9yIHRvdWNoIGRldmljZXNcclxuICAgICAgICBsZXQgcHJlc3NUaW1lcjogbnVtYmVyO1xyXG4gICAgICAgIGlmKCFqb19tb3VzZURldGVjdGVkKXtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5vbigncG9pbnRlcnVwJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHByZXNzVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KS5vbigncG9pbnRlcmRvd24nLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHByZXNzVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dG1lbnVIYW5kbGVyKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH0sIDUwMCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIWpvX21vdXNlRGV0ZWN0ZWQpe1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmZpbmQoJy5qb19zZXR0aW5nc19idXR0b24nKS5vbigncG9pbnRlcmRvd24nLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dG1lbnVIYW5kbGVyKGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fc2V0dGluZ3NfYnV0dG9uJykub24oJ21vdXNlZG93biBjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGF0LndpdGhEZWxldGVCdXR0b24pIHtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fZGVsZXRlJykub24obW91c2VQb2ludGVyICsgJ2Rvd24nLCAoZXYpID0+IHtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBvcGVuQ29udGV4dE1lbnUoW3tcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkFiYnJlY2hlblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG8uXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiSWNoIGJpbiBtaXIgc2ljaGVyOiBsw7ZzY2hlbiFcIixcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjZmY2MDYwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kZWxldGVDYWxsYmFjayhlbGVtZW50LmV4dGVybmFsRWxlbWVudCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LiRodG1sU2Vjb25kTGluZSAhPSBudWxsKSBlbGVtZW50LiRodG1sU2Vjb25kTGluZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZWxlbWVudHMuc3BsaWNlKHRoYXQuZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSwgMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LmVsZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZWxlY3QodGhhdC5lbGVtZW50c1swXS5leHRlcm5hbEVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV0sIGV2LnBhZ2VYICsgMiwgZXYucGFnZVkgKyAyKTtcclxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50LiRodG1sRmlyc3RMaW5lO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW5hbWVFbGVtZW50KGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBsZXQgJGRpdiA9IGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX2ZpbGVuYW1lJyk7XHJcbiAgICAgICAgbGV0IHBvaW50UG9zID0gZWxlbWVudC5uYW1lLmluZGV4T2YoJy4nKTtcclxuICAgICAgICBsZXQgc2VsZWN0aW9uID0gcG9pbnRQb3MgPT0gbnVsbCA/IG51bGwgOiB7IHN0YXJ0OiAwLCBlbmQ6IHBvaW50UG9zIH07XHJcbiAgICAgICAgdGhpcy5kb250U29ydEVsZW1lbnRzID0gdHJ1ZTtcclxuICAgICAgICBtYWtlRWRpdGFibGUoJGRpdiwgJGRpdiwgKG5ld1RleHQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5leHRlcm5hbEVsZW1lbnQgIT0gbnVsbCkgbmV3VGV4dCA9IHRoYXQucmVuYW1lQ2FsbGJhY2soZWxlbWVudC5leHRlcm5hbEVsZW1lbnQsIG5ld1RleHQpO1xyXG4gICAgICAgICAgICBlbGVtZW50Lm5hbWUgPSBuZXdUZXh0O1xyXG4gICAgICAgICAgICAkZGl2Lmh0bWwoZWxlbWVudC5uYW1lKTtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwpIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIHRoYXQuc29ydEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICRkaXZbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5kb250U29ydEVsZW1lbnRzID0gZmFsc2U7XHJcbiAgICAgICAgfSwgc2VsZWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3QoZXh0ZXJuYWxFbGVtZW50OiBhbnksIGludm9rZUNhbGxiYWNrOiBib29sZWFuID0gdHJ1ZSwgc2Nyb2xsSW50b1ZpZXc6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cclxuICAgICAgICBpZiAoZXh0ZXJuYWxFbGVtZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgYWUxIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhZTEuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSBhZTEuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGFlID0gdGhpcy5maW5kRWxlbWVudChleHRlcm5hbEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgaWYoYWUgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhZTEgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhZTEuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSBhZTEuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgICAgICAgICBhZS4kaHRtbEZpcnN0TGluZS5hZGRDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICBpZihzY3JvbGxJbnRvVmlldyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmVbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnZva2VDYWxsYmFjayAmJiB0aGlzLnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHRoaXMuc2VsZWN0Q2FsbGJhY2soZXh0ZXJuYWxFbGVtZW50KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0RWxlbWVudENsYXNzKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQsIGljb25DbGFzczogc3RyaW5nKXtcclxuICAgICAgICBpZihlbGVtZW50ICE9IG51bGwpe1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lPy5yZW1vdmVDbGFzcyhcImpvX1wiICsgZWxlbWVudC5pY29uQ2xhc3MpLmFkZENsYXNzKFwiam9fXCIgKyBpY29uQ2xhc3MpO1xyXG4gICAgICAgICAgICBlbGVtZW50Lmljb25DbGFzcyA9IGljb25DbGFzcztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgZmluZEVsZW1lbnQoZXh0ZXJuYWxFbGVtZW50OiBhbnkpOiBBY2NvcmRpb25FbGVtZW50IHtcclxuICAgICAgICBmb3IgKGxldCBhZSBvZiB0aGlzLmVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgIGlmIChhZS5leHRlcm5hbEVsZW1lbnQgPT0gZXh0ZXJuYWxFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVFbGVtZW50KGV4dGVybmFsRWxlbWVudDogYW55KSB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuZXh0ZXJuYWxFbGVtZW50ID09IGV4dGVybmFsRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWUuJGh0bWxTZWNvbmRMaW5lICE9IG51bGwpIGFlLiRodG1sU2Vjb25kTGluZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudHMuc3BsaWNlKHRoaXMuZWxlbWVudHMuaW5kZXhPZihhZSksIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZWxlbWVudHNbMF0uZXh0ZXJuYWxFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnRzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2FwdGlvbih0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5maW5kKCdzcGFuJykuaHRtbCh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRTZWxlY3RlZEVsZW1lbnREYXRhKCk6IGFueSB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEFjY29yZGlvbiB7XHJcblxyXG4gICAgcGFydHM6IEFjY29yZGlvblBhbmVsW10gPSBbXTtcclxuICAgICRodG1sOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCRodG1sOiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgdGhpcy4kaHRtbCA9ICRodG1sO1xyXG4gICAgICAgICRodG1sLmFkZENsYXNzKCdqb19sZWZ0cGFuZWxpbm5lcicpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFBhbmVsKHBhbmVsOiBBY2NvcmRpb25QYW5lbCkge1xyXG4gICAgICAgIHBhbmVsLnJlbmRlck91dGVySHRtbEVsZW1lbnRzKHRoaXMuJGh0bWwpO1xyXG4gICAgICAgIHRoaXMucGFydHMucHVzaChwYW5lbCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn0iXX0=