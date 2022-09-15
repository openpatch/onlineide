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
        this.$captionElement = jQuery(`<div class="jo_leftpanelcaption jo_expanded" id="workspace">
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9BY2NvcmRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQW1CLGdCQUFnQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDNUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFrQnhELE1BQU0sT0FBTyxjQUFjO0lBbUJ2QixZQUFvQixTQUFvQixFQUFVLE9BQWUsRUFBVSxVQUFrQixFQUNqRixjQUFzQixFQUFVLGNBQXNCLEVBQ3RELGdCQUF3QixFQUFVLGdCQUF5QjtRQUZuRCxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUFVLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDakYsbUJBQWMsR0FBZCxjQUFjLENBQVE7UUFBVSxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtRQUN0RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7UUFBVSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVM7UUFuQnZFLGFBQVEsR0FBdUIsRUFBRSxDQUFDO1FBUWxDLHFCQUFnQixHQUFZLEtBQUssQ0FBQztRQWE5QixTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBRTdCLENBQUM7SUFFRCxNQUFNO1FBQ0YsSUFBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUM5QixJQUFJLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQy9CLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBYztRQUNuQixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixJQUFJLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDWixJQUFJLENBQUMsZUFB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QUFDLGNBQWMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ3pDLE9BQU8sRUFBRSxDQUFDO2FBQ2I7U0FDSjtRQUNELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7Q0FFSjtBQUdELE1BQU0sT0FBTyxTQUFTO0lBS2xCLFlBQVksS0FBMEI7UUFIdEMsVUFBSyxHQUFxQixFQUFFLENBQUM7UUFJekIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQ3hDLENBQUM7SUFFRCxRQUFRLENBQUMsS0FBcUI7UUFDMUIsS0FBSyxDQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixDQUFDO0NBSUoiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBvcGVuQ29udGV4dE1lbnUsIG1ha2VFZGl0YWJsZSwgQ29udGV4dE1lbnVJdGVtLCBqb19tb3VzZURldGVjdGVkIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL0h0bWxUb29scy5qc1wiO1xyXG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi9IZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgZXNjYXBlSHRtbCB9IGZyb20gXCIuLi8uLi90b29scy9TdHJpbmdUb29scy5qc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgQWNjb3JkaW9uRWxlbWVudCA9IHtcclxuICAgIG5hbWU6IHN0cmluZztcclxuICAgIHNvcnROYW1lPzogc3RyaW5nOyAgICAgIC8vIGlmIHNvcnROYW1lID09IG51bGwsIHRoZW4gbmFtZSB3aWxsIGJlIHVzZWQgd2hlbiBzb3J0aW5nXHJcbiAgICBleHRlcm5hbEVsZW1lbnQ/OiBhbnk7XHJcbiAgICBpY29uQ2xhc3M/OiBzdHJpbmc7XHJcbiAgICAkaHRtbEZpcnN0TGluZT86IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkaHRtbFNlY29uZExpbmU/OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG59XHJcblxyXG5leHBvcnQgdHlwZSBBY2NvcmRpb25Db250ZXh0TWVudUl0ZW0gPSB7XHJcbiAgICBjYXB0aW9uOiBzdHJpbmc7XHJcbiAgICBjb2xvcj86IHN0cmluZztcclxuICAgIGNhbGxiYWNrOiAocGFuZWw6IEFjY29yZGlvbkVsZW1lbnQpID0+IHZvaWQ7XHJcbiAgICBzdWJNZW51PzogQWNjb3JkaW9uQ29udGV4dE1lbnVJdGVtW11cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEFjY29yZGlvblBhbmVsIHtcclxuXHJcbiAgICBlbGVtZW50czogQWNjb3JkaW9uRWxlbWVudFtdID0gW107XHJcblxyXG4gICAgJGNhcHRpb25FbGVtZW50OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJGJ1dHRvbk5ldzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRsaXN0RWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICBwcml2YXRlIGZpeGVkOiBib29sZWFuO1xyXG5cclxuICAgIGRvbnRTb3J0RWxlbWVudHM6IGJvb2xlYW4gPSBmYWxzZTtcclxuXHJcbiAgICBuZXdFbGVtZW50Q2FsbGJhY2s6IChhZTogQWNjb3JkaW9uRWxlbWVudCwgY2FsbGJhY2tJZlN1Y2Nlc3NmdWw6IChleHRlcm5hbEVsZW1lbnQ6IGFueSkgPT4gdm9pZCkgPT4gdm9pZDtcclxuICAgIHJlbmFtZUNhbGxiYWNrOiAoZXh0ZXJuYWxFbGVtZW50OiBhbnksIG5ld05hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xyXG4gICAgZGVsZXRlQ2FsbGJhY2s6IChleHRlcm5hbEVsZW1lbnQ6IGFueSwgY2FsbGJhY2tJZlN1Y2Nlc3NmdWw6ICgpID0+IHZvaWQpID0+IHZvaWQ7XHJcbiAgICBzZWxlY3RDYWxsYmFjazogKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiB2b2lkO1xyXG4gICAgYWRkRWxlbWVudEFjdGlvbkNhbGxiYWNrOiAoYWNjb3JkaW9uRWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4gSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGNvbnRleHRNZW51UHJvdmlkZXI6IChleHRlcm5hbEVsZW1lbnQ6IGFueSkgPT4gQWNjb3JkaW9uQ29udGV4dE1lbnVJdGVtW107XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBhY2NvcmRpb246IEFjY29yZGlvbiwgcHJpdmF0ZSBjYXB0aW9uOiBzdHJpbmcsIHByaXZhdGUgZmxleFdlaWdodDogc3RyaW5nLFxyXG4gICAgICAgIHByaXZhdGUgbmV3QnV0dG9uQ2xhc3M6IHN0cmluZywgcHJpdmF0ZSBidXR0b25OZXdUaXRsZTogc3RyaW5nLFxyXG4gICAgICAgIHByaXZhdGUgZGVmYXVsdEljb25DbGFzczogc3RyaW5nLCBwcml2YXRlIHdpdGhEZWxldGVCdXR0b246IGJvb2xlYW4pIHtcclxuXHJcbiAgICAgICAgYWNjb3JkaW9uLmFkZFBhbmVsKHRoaXMpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmUoKSB7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQucmVtb3ZlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Rml4ZWQoZml4ZWQ6IGJvb2xlYW4pIHtcclxuICAgICAgICB0aGlzLmZpeGVkID0gZml4ZWQ7XHJcbiAgICAgICAgaWYgKHRoaXMuZml4ZWQpIHtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuYWRkQ2xhc3MoJ2pvX2ZpeGVkJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2pvX2ZpeGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyAgICAgPGRpdiBjbGFzcz1cImpvX2xlZnRwYW5lbGNhcHRpb24gZXhwYW5kZWRcIiBpZD1cIndvcmtzcGFjZVwiIGRhdGEtcGFuZWw9XCJmaWxlbGlzdG91dGVyXCI+XHJcbiAgICAvLyAgICAgPHNwYW4+V09SS1NQQUNFPC9zcGFuPlxyXG4gICAgLy8gICAgIDxkaXYgY2xhc3M9XCJqb19hY3Rpb25zXCI+PGltZyBpZD1cImJ1dHRvbk5ld0ZpbGVcIiB0aXRsZT1cIk5ldWUgRGF0ZWkgaGluenVmw7xnZW5cIlxyXG4gICAgLy8gICAgICAgICAgICAgc3JjPVwiYXNzZXRzL3Byb2plY3RleHBsb3Jlci9hZGQtZmlsZS1kYXJrLnN2Z1wiPjwvZGl2PlxyXG4gICAgLy8gPC9kaXY+XHJcbiAgICAvLyA8ZGl2IGlkPVwiZmlsZWxpc3RvdXRlclwiIGNsYXNzPVwiam9fcHJvamVjdGV4cGxvcmVyZGl2IHNjcm9sbGFibGVcIiBkYXRhLWdyb3c9XCIzXCJcclxuICAgIC8vICAgICBzdHlsZT1cImZsZXgtZ3JvdzogM1wiPlxyXG4gICAgLy8gICAgIDxkaXYgaWQ9XCJmaWxlbGlzdFwiPjwvZGl2PlxyXG4gICAgLy8gPC9kaXY+XHJcblxyXG5cclxuICAgIGVuYWJsZU5ld0J1dHRvbihlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuJGJ1dHRvbk5ldyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXcuc2hvdygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV3LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcmVuZGVyT3V0ZXJIdG1sRWxlbWVudHMoJGFjY29yZGlvbkRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19sZWZ0cGFuZWxjYXB0aW9uIGpvX2V4cGFuZGVkXCIgaWQ9XCJ3b3Jrc3BhY2VcIj5cclxuICAgICAgICA8c3Bhbj5gICsgdGhpcy5jYXB0aW9uICsgYDwvc3Bhbj48ZGl2IGNsYXNzPVwiam9fYWN0aW9uc1wiPjwvZGl2PjwvZGl2PmApO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5uZXdCdXR0b25DbGFzcyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5ldyA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2J1dHRvbiBqb19hY3RpdmUgJyArIHRoaXMubmV3QnV0dG9uQ2xhc3MgKyAnXCIgdGl0bGU9XCInICsgdGhpcy5idXR0b25OZXdUaXRsZSArICdcIj4nKTtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuZmluZCgnLmpvX2FjdGlvbnMnKS5hcHBlbmQodGhpcy4kYnV0dG9uTmV3KTtcclxuXHJcbiAgICAgICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcbiAgICAgICAgICAgIHRoaXMuJGJ1dHRvbk5ldy5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChldikgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIEhlbHBlci5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgICAgZXYuc3RvcFByb3BhZ2F0aW9uKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFlOiBBY2NvcmRpb25FbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiTmV1XCJcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmVsZW1lbnRzLnB1c2goYWUpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCAkZWxlbWVudCA9IHRoYXQucmVuZGVyRWxlbWVudChhZSk7XHJcbiAgICAgICAgICAgICAgICB0aGF0LiRsaXN0RWxlbWVudC5wcmVwZW5kKCRlbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LiRsaXN0RWxlbWVudC5zY3JvbGxUb3AoMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5yZW5hbWVFbGVtZW50KGFlLCAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubmV3RWxlbWVudENhbGxiYWNrKGFlLCAoZXh0ZXJuYWxFbGVtZW50OiBhbnkpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFlLmV4dGVybmFsRWxlbWVudCA9IGV4dGVybmFsRWxlbWVudDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhZS4kaHRtbFNlY29uZExpbmUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWUuJGh0bWxTZWNvbmRMaW5lLmluc2VydEFmdGVyKCRlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkgdGhhdC5zZWxlY3QoYWUuZXh0ZXJuYWxFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgJGxpc3RPdXRlciA9IGpRdWVyeSgnPGRpdiBpZD1cImZpbGVsaXN0b3V0ZXJcIiBjbGFzcz1cImpvX3Byb2plY3RleHBsb3JlcmRpdiBqb19zY3JvbGxhYmxlXCIgZGF0YS1ncm93PVwiJ1xyXG4gICAgICAgICAgICArIHRoaXMuZmxleFdlaWdodCArICdcIiBzdHlsZT1cImZsZXgtZ3JvdzogJyArIHRoaXMuZmxleFdlaWdodCArICdcIj48L2Rpdj4nKTtcclxuICAgICAgICB0aGlzLiRsaXN0RWxlbWVudCA9IGpRdWVyeSgnPGRpdiBjbGFzcz1cImpvX2ZpbGVsaXN0XCI+PC9kaXY+JylcclxuXHJcbiAgICAgICAgJGxpc3RPdXRlci5hcHBlbmQodGhpcy4kbGlzdEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAkYWNjb3JkaW9uRGl2LmFwcGVuZCh0aGlzLiRjYXB0aW9uRWxlbWVudCk7XHJcbiAgICAgICAgJGFjY29yZGlvbkRpdi5hcHBlbmQoJGxpc3RPdXRlcik7XHJcblxyXG4gICAgICAgIGxldCAkY2UgPSB0aGlzLiRjYXB0aW9uRWxlbWVudDtcclxuICAgICAgICBsZXQgJGxpID0gdGhpcy4kbGlzdEVsZW1lbnQucGFyZW50KCk7XHJcbiAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuXHJcbiAgICAgICAgJGNlLm9uKG1vdXNlUG9pbnRlciArICdkb3duJywgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gIT0gMCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoIXRoaXMuZml4ZWQpIHtcclxuICAgICAgICAgICAgICAgIGxldCB0YXJnZXRHcm93ID0gJGxpLmRhdGEoJ2dyb3cnKTtcclxuICAgICAgICAgICAgICAgIGlmICgkY2UuaGFzQ2xhc3MoJ2pvX2V4cGFuZGVkJykpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5hY2NvcmRpb24ucGFydHMubGVuZ3RoID4gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAkbGkuYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnZmxleC1ncm93JzogMC4wMDFcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCwgKCkgPT4geyAkY2UudG9nZ2xlQ2xhc3MoJ2pvX2V4cGFuZGVkJyk7IH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJGNlLnRvZ2dsZUNsYXNzKCdqb19leHBhbmRlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICRsaS5hbmltYXRlKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJ2ZsZXgtZ3Jvdyc6IHRhcmdldEdyb3dcclxuICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcbiAgICB9XHJcblxyXG4gICAgYWRkRWxlbWVudChlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50KSB7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50cy5wdXNoKGVsZW1lbnQpO1xyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUgPSB0aGlzLnJlbmRlckVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQucHJlcGVuZChlbGVtZW50LiRodG1sRmlyc3RMaW5lKTtcclxuICAgIH1cclxuXHJcbiAgICBzb3J0RWxlbWVudHMoKXtcclxuICAgICAgICBpZih0aGlzLmRvbnRTb3J0RWxlbWVudHMpIHJldHVybjtcclxuICAgICAgICB0aGlzLmVsZW1lbnRzLnNvcnQoKGEsIGIpID0+IHtcclxuICAgICAgICAgICAgbGV0IGFOYW1lID0gYS5zb3J0TmFtZSA/IGEuc29ydE5hbWUgOiBhLm5hbWU7XHJcbiAgICAgICAgICAgIGxldCBiTmFtZSA9IGIuc29ydE5hbWUgPyBiLnNvcnROYW1lIDogYi5uYW1lO1xyXG4gICAgICAgICAgICByZXR1cm4gKGFOYW1lLmxvY2FsZUNvbXBhcmUoYk5hbWUpKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLmVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHt0aGlzLiRsaXN0RWxlbWVudC5hcHBlbmQoZWxlbWVudC4kaHRtbEZpcnN0TGluZSl9KTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRUZXh0QWZ0ZXJGaWxlbmFtZShlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50LCB0ZXh0OiBzdHJpbmcsIGNzc0NsYXNzOiBzdHJpbmcpIHtcclxuICAgICAgICBsZXQgJGRpdiA9IGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX3RleHRBZnRlck5hbWUnKTtcclxuICAgICAgICAkZGl2LmFkZENsYXNzKGNzc0NsYXNzKTtcclxuICAgICAgICAkZGl2Lmh0bWwodGV4dCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGFkZEFjdGlvbigkZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIHRoaXMuJGNhcHRpb25FbGVtZW50LmZpbmQoJy5qb19hY3Rpb25zJykucHJlcGVuZCgkZWxlbWVudCk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIHJlbmRlckVsZW1lbnQoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCk6IEpRdWVyeTxIVE1MRWxlbWVudD4ge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICBpZiAoZWxlbWVudC5pY29uQ2xhc3MgPT0gbnVsbCkgZWxlbWVudC5pY29uQ2xhc3MgPSB0aGlzLmRlZmF1bHRJY29uQ2xhc3M7XHJcblxyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19maWxlIGpvXyR7ZWxlbWVudC5pY29uQ2xhc3N9XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzcz1cImpvX2ZpbGVpbWFnZVwiPjwvZGl2PjxkaXYgY2xhc3M9XCJqb19maWxlbmFtZVwiPiR7ZXNjYXBlSHRtbChlbGVtZW50Lm5hbWUpfTwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb190ZXh0QWZ0ZXJOYW1lXCI+PC9kaXY+XHJcbiAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2FkZGl0aW9uYWxCdXR0b25Ib21ld29ya1wiPjwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19hZGRpdGlvbmFsQnV0dG9uU3RhcnRcIj48L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fYWRkaXRpb25hbEJ1dHRvblJlcG9zaXRvcnlcIj48L2Rpdj5cclxuICAgICAgICAgICAke3RoaXMud2l0aERlbGV0ZUJ1dHRvbiA/ICc8ZGl2IGNsYXNzPVwiam9fZGVsZXRlIGltZ19kZWxldGUgam9fYnV0dG9uIGpvX2FjdGl2ZScgKyAoZmFsc2UgPyBcIiBqb19kZWxldGVfYWx3YXlzXCIgOiBcIlwiKSArJ1wiPjwvZGl2PicgOiBcIlwifVxyXG4gICAgICAgICAgICR7IWpvX21vdXNlRGV0ZWN0ZWQgPyAnPGRpdiBjbGFzcz1cImpvX3NldHRpbmdzX2J1dHRvbiBpbWdfZWxsaXBzaXMtZGFyayBqb19idXR0b24gam9fYWN0aXZlXCI+PC9kaXY+JyA6IFwiXCJ9XHJcbiAgICAgICAgICAgPC9kaXY+YCk7XHJcbiAgICAgICAgICAgXHJcbiAgICAgICAgICAgaWYgKHRoaXMuYWRkRWxlbWVudEFjdGlvbkNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgbGV0ICRlbGVtZW50QWN0aW9uID0gdGhpcy5hZGRFbGVtZW50QWN0aW9uQ2FsbGJhY2soZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYXBwZW5kKCRlbGVtZW50QWN0aW9uKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChldikgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSAwICYmIHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RDYWxsYmFjayhlbGVtZW50LmV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhhdC5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhZSAhPSBlbGVtZW50ICYmIGFlLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZS4kaHRtbEZpcnN0TGluZS5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYWRkQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCBjb250ZXh0bWVudUhhbmRsZXIgPSAgZnVuY3Rpb24gKGV2ZW50KSB7XHJcblxyXG4gICAgICAgICAgICBsZXQgY29udGV4dE1lbnVJdGVtczogQ29udGV4dE1lbnVJdGVtW10gPSBbXTtcclxuICAgICAgICAgICAgaWYgKHRoYXQucmVuYW1lQ2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dE1lbnVJdGVtcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlVtYmVuZW5uZW5cIixcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnJlbmFtZUVsZW1lbnQoZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQuY29udGV4dE1lbnVQcm92aWRlciAhPSBudWxsKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY21pIG9mIHRoYXQuY29udGV4dE1lbnVQcm92aWRlcihlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRNZW51SXRlbXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IGNtaS5jYXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21pLmNhbGxiYWNrKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY21pLmNvbG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJNZW51OiBjbWkuc3ViTWVudSA9PSBudWxsID8gbnVsbCA6IGNtaS5zdWJNZW51Lm1hcCgobWkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogbWkuY2FwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaS5jYWxsYmFjayhlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBtaS5jb2xvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0TWVudUl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIG9wZW5Db250ZXh0TWVudShjb250ZXh0TWVudUl0ZW1zLCBldmVudC5wYWdlWCwgZXZlbnQucGFnZVkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZVswXS5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgY29udGV4dG1lbnVIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIC8vIGxvbmcgcHJlc3MgZm9yIHRvdWNoIGRldmljZXNcclxuICAgICAgICBsZXQgcHJlc3NUaW1lcjogbnVtYmVyO1xyXG4gICAgICAgIGlmKCFqb19tb3VzZURldGVjdGVkKXtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5vbigncG9pbnRlcnVwJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHByZXNzVGltZXIpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KS5vbigncG9pbnRlcmRvd24nLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIHByZXNzVGltZXIgPSB3aW5kb3cuc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dG1lbnVIYW5kbGVyKGV2ZW50KTtcclxuICAgICAgICAgICAgICAgIH0sIDUwMCk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoIWpvX21vdXNlRGV0ZWN0ZWQpe1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmZpbmQoJy5qb19zZXR0aW5nc19idXR0b24nKS5vbigncG9pbnRlcmRvd24nLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dG1lbnVIYW5kbGVyKGUpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fc2V0dGluZ3NfYnV0dG9uJykub24oJ21vdXNlZG93biBjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGF0LndpdGhEZWxldGVCdXR0b24pIHtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fZGVsZXRlJykub24obW91c2VQb2ludGVyICsgJ2Rvd24nLCAoZXYpID0+IHtcclxuICAgICAgICAgICAgICAgIGV2LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBvcGVuQ29udGV4dE1lbnUoW3tcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkFiYnJlY2hlblwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5vdGhpbmcgdG8gZG8uXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiSWNoIGJpbiBtaXIgc2ljaGVyOiBsw7ZzY2hlbiFcIixcclxuICAgICAgICAgICAgICAgICAgICBjb2xvcjogXCIjZmY2MDYwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5kZWxldGVDYWxsYmFjayhlbGVtZW50LmV4dGVybmFsRWxlbWVudCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LiRodG1sU2Vjb25kTGluZSAhPSBudWxsKSBlbGVtZW50LiRodG1sU2Vjb25kTGluZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZWxlbWVudHMuc3BsaWNlKHRoYXQuZWxlbWVudHMuaW5kZXhPZihlbGVtZW50KSwgMSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LmVsZW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5zZWxlY3QodGhhdC5lbGVtZW50c1swXS5leHRlcm5hbEVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0KG51bGwpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfV0sIGV2LnBhZ2VYICsgMiwgZXYucGFnZVkgKyAyKTtcclxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBlbGVtZW50LiRodG1sRmlyc3RMaW5lO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW5hbWVFbGVtZW50KGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQsIGNhbGxiYWNrPzogKCkgPT4gdm9pZCkge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBsZXQgJGRpdiA9IGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX2ZpbGVuYW1lJyk7XHJcbiAgICAgICAgbGV0IHBvaW50UG9zID0gZWxlbWVudC5uYW1lLmluZGV4T2YoJy4nKTtcclxuICAgICAgICBsZXQgc2VsZWN0aW9uID0gcG9pbnRQb3MgPT0gbnVsbCA/IG51bGwgOiB7IHN0YXJ0OiAwLCBlbmQ6IHBvaW50UG9zIH07XHJcbiAgICAgICAgdGhpcy5kb250U29ydEVsZW1lbnRzID0gdHJ1ZTtcclxuICAgICAgICBtYWtlRWRpdGFibGUoJGRpdiwgJGRpdiwgKG5ld1RleHQ6IHN0cmluZykgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5leHRlcm5hbEVsZW1lbnQgIT0gbnVsbCkgbmV3VGV4dCA9IHRoYXQucmVuYW1lQ2FsbGJhY2soZWxlbWVudC5leHRlcm5hbEVsZW1lbnQsIG5ld1RleHQpO1xyXG4gICAgICAgICAgICBlbGVtZW50Lm5hbWUgPSBuZXdUZXh0O1xyXG4gICAgICAgICAgICAkZGl2Lmh0bWwoZWxlbWVudC5uYW1lKTtcclxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrICE9IG51bGwpIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIHRoYXQuc29ydEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICRkaXZbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgICAgICAgdGhpcy5kb250U29ydEVsZW1lbnRzID0gZmFsc2U7XHJcbiAgICAgICAgfSwgc2VsZWN0aW9uKTtcclxuICAgIH1cclxuXHJcbiAgICBzZWxlY3QoZXh0ZXJuYWxFbGVtZW50OiBhbnksIGludm9rZUNhbGxiYWNrOiBib29sZWFuID0gdHJ1ZSwgc2Nyb2xsSW50b1ZpZXc6IGJvb2xlYW4gPSBmYWxzZSkge1xyXG5cclxuICAgICAgICBpZiAoZXh0ZXJuYWxFbGVtZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgYWUxIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChhZTEuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSBhZTEuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGFlID0gdGhpcy5maW5kRWxlbWVudChleHRlcm5hbEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgaWYoYWUgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBhZTEgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhZTEuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSBhZTEuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgICAgICAgICBhZS4kaHRtbEZpcnN0TGluZS5hZGRDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICBpZihzY3JvbGxJbnRvVmlldyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmVbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnZva2VDYWxsYmFjayAmJiB0aGlzLnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHRoaXMuc2VsZWN0Q2FsbGJhY2soZXh0ZXJuYWxFbGVtZW50KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc2V0RWxlbWVudENsYXNzKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQsIGljb25DbGFzczogc3RyaW5nKXtcclxuICAgICAgICBpZihlbGVtZW50ICE9IG51bGwpe1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lPy5yZW1vdmVDbGFzcyhcImpvX1wiICsgZWxlbWVudC5pY29uQ2xhc3MpLmFkZENsYXNzKFwiam9fXCIgKyBpY29uQ2xhc3MpO1xyXG4gICAgICAgICAgICBlbGVtZW50Lmljb25DbGFzcyA9IGljb25DbGFzcztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgZmluZEVsZW1lbnQoZXh0ZXJuYWxFbGVtZW50OiBhbnkpOiBBY2NvcmRpb25FbGVtZW50IHtcclxuICAgICAgICBmb3IgKGxldCBhZSBvZiB0aGlzLmVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgIGlmIChhZS5leHRlcm5hbEVsZW1lbnQgPT0gZXh0ZXJuYWxFbGVtZW50KSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICByZW1vdmVFbGVtZW50KGV4dGVybmFsRWxlbWVudDogYW55KSB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuZXh0ZXJuYWxFbGVtZW50ID09IGV4dGVybmFsRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWUuJGh0bWxTZWNvbmRMaW5lICE9IG51bGwpIGFlLiRodG1sU2Vjb25kTGluZS5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuZWxlbWVudHMuc3BsaWNlKHRoaXMuZWxlbWVudHMuaW5kZXhPZihhZSksIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5lbGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2VsZWN0KHRoaXMuZWxlbWVudHNbMF0uZXh0ZXJuYWxFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2xlYXIoKSB7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmVsZW1lbnRzID0gW107XHJcbiAgICB9XHJcblxyXG4gICAgc2V0Q2FwdGlvbih0ZXh0OiBzdHJpbmcpIHtcclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5maW5kKCdzcGFuJykuaHRtbCh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRTZWxlY3RlZEVsZW1lbnREYXRhKCk6IGFueSB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEFjY29yZGlvbiB7XHJcblxyXG4gICAgcGFydHM6IEFjY29yZGlvblBhbmVsW10gPSBbXTtcclxuICAgICRodG1sOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCRodG1sOiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgdGhpcy4kaHRtbCA9ICRodG1sO1xyXG4gICAgICAgICRodG1sLmFkZENsYXNzKCdqb19sZWZ0cGFuZWxpbm5lcicpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZFBhbmVsKHBhbmVsOiBBY2NvcmRpb25QYW5lbCkge1xyXG4gICAgICAgIHBhbmVsLnJlbmRlck91dGVySHRtbEVsZW1lbnRzKHRoaXMuJGh0bWwpO1xyXG4gICAgICAgIHRoaXMucGFydHMucHVzaChwYW5lbCk7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn0iXX0=