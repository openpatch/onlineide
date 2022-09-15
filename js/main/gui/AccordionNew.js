import { openContextMenu, makeEditable, jo_mouseDetected } from "../../tools/HtmlTools.js";
import { Helper } from "./Helper.js";
import { escapeHtml } from "../../tools/StringTools.js";
export class AccordionPanelNew {
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
export class AccordionNew {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNjb3JkaW9uTmV3LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9BY2NvcmRpb25OZXcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQW1CLGdCQUFnQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDNUcsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFrQnhELE1BQU0sT0FBTyxpQkFBaUI7SUFtQjFCLFlBQW9CLFNBQXVCLEVBQVUsT0FBZSxFQUFVLFVBQWtCLEVBQ3BGLGNBQXNCLEVBQVUsY0FBc0IsRUFDdEQsZ0JBQXdCLEVBQVUsZ0JBQXlCO1FBRm5ELGNBQVMsR0FBVCxTQUFTLENBQWM7UUFBVSxZQUFPLEdBQVAsT0FBTyxDQUFRO1FBQVUsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUNwRixtQkFBYyxHQUFkLGNBQWMsQ0FBUTtRQUFVLG1CQUFjLEdBQWQsY0FBYyxDQUFRO1FBQ3RELHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUTtRQUFVLHFCQUFnQixHQUFoQixnQkFBZ0IsQ0FBUztRQW5CdkUsYUFBUSxHQUEwQixFQUFFLENBQUM7UUFRckMscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBYTlCLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFN0IsQ0FBQztJQUVELE1BQU07UUFDRixJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1FBQzlCLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDL0IsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUFjO1FBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLElBQUksSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNaLElBQUksQ0FB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UUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxVQUFVLENBQUMsSUFBWTtRQUNuQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVELHNCQUFzQjtRQUNsQixLQUFLLElBQUksRUFBRSxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDMUIsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDekMsT0FBTyxFQUFFLENBQUM7YUFDYjtTQUNKO1FBQ0QsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUVKO0FBR0QsTUFBTSxPQUFPLFlBQVk7SUFLckIsWUFBWSxLQUEwQjtRQUh0QyxVQUFLLEdBQXdCLEVBQUUsQ0FBQztRQUk1QixJQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNuQixLQUFLLENBQUMsUUFBUSxDQUFDLG1CQUFtQixDQUFDLENBQUM7SUFDeEMsQ0FBQztJQUVELFFBQVEsQ0FBQyxLQUF3QjtRQUM3QixLQUFLLENBQUMsdUJBQXVCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLENBQUM7Q0FJSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IG9wZW5Db250ZXh0TWVudSwgbWFrZUVkaXRhYmxlLCBDb250ZXh0TWVudUl0ZW0sIGpvX21vdXNlRGV0ZWN0ZWQgfSBmcm9tIFwiLi4vLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL0hlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBlc2NhcGVIdG1sIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL1N0cmluZ1Rvb2xzLmpzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBBY2NvcmRpb25FbGVtZW50TmV3ID0ge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgc29ydE5hbWU/OiBzdHJpbmc7ICAgICAgLy8gaWYgc29ydE5hbWUgPT0gbnVsbCwgdGhlbiBuYW1lIHdpbGwgYmUgdXNlZCB3aGVuIHNvcnRpbmdcclxuICAgIGV4dGVybmFsRWxlbWVudD86IGFueTtcclxuICAgIGljb25DbGFzcz86IHN0cmluZztcclxuICAgICRodG1sRmlyc3RMaW5lPzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRodG1sU2Vjb25kTGluZT86IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIEFjY29yZGlvbkNvbnRleHRNZW51SXRlbU5ldyA9IHtcclxuICAgIGNhcHRpb246IHN0cmluZztcclxuICAgIGNvbG9yPzogc3RyaW5nO1xyXG4gICAgY2FsbGJhY2s6IChwYW5lbDogQWNjb3JkaW9uRWxlbWVudE5ldykgPT4gdm9pZDtcclxuICAgIHN1Yk1lbnU/OiBBY2NvcmRpb25Db250ZXh0TWVudUl0ZW1OZXdbXVxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQWNjb3JkaW9uUGFuZWxOZXcge1xyXG5cclxuICAgIGVsZW1lbnRzOiBBY2NvcmRpb25FbGVtZW50TmV3W10gPSBbXTtcclxuXHJcbiAgICAkY2FwdGlvbkVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkYnV0dG9uTmV3OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgJGxpc3RFbGVtZW50OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIHByaXZhdGUgZml4ZWQ6IGJvb2xlYW47XHJcblxyXG4gICAgZG9udFNvcnRFbGVtZW50czogYm9vbGVhbiA9IGZhbHNlO1xyXG5cclxuICAgIG5ld0VsZW1lbnRDYWxsYmFjazogKGFlOiBBY2NvcmRpb25FbGVtZW50TmV3LCBjYWxsYmFja0lmU3VjY2Vzc2Z1bDogKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiB2b2lkKSA9PiB2b2lkO1xyXG4gICAgcmVuYW1lQ2FsbGJhY2s6IChleHRlcm5hbEVsZW1lbnQ6IGFueSwgbmV3TmFtZTogc3RyaW5nKSA9PiBzdHJpbmc7XHJcbiAgICBkZWxldGVDYWxsYmFjazogKGV4dGVybmFsRWxlbWVudDogYW55LCBjYWxsYmFja0lmU3VjY2Vzc2Z1bDogKCkgPT4gdm9pZCkgPT4gdm9pZDtcclxuICAgIHNlbGVjdENhbGxiYWNrOiAoZXh0ZXJuYWxFbGVtZW50OiBhbnkpID0+IHZvaWQ7XHJcbiAgICBhZGRFbGVtZW50QWN0aW9uQ2FsbGJhY2s6IChhY2NvcmRpb25FbGVtZW50TmV3OiBBY2NvcmRpb25FbGVtZW50TmV3KSA9PiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgY29udGV4dE1lbnVQcm92aWRlcjogKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiBBY2NvcmRpb25Db250ZXh0TWVudUl0ZW1OZXdbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIGFjY29yZGlvbjogQWNjb3JkaW9uTmV3LCBwcml2YXRlIGNhcHRpb246IHN0cmluZywgcHJpdmF0ZSBmbGV4V2VpZ2h0OiBzdHJpbmcsXHJcbiAgICAgICAgcHJpdmF0ZSBuZXdCdXR0b25DbGFzczogc3RyaW5nLCBwcml2YXRlIGJ1dHRvbk5ld1RpdGxlOiBzdHJpbmcsXHJcbiAgICAgICAgcHJpdmF0ZSBkZWZhdWx0SWNvbkNsYXNzOiBzdHJpbmcsIHByaXZhdGUgd2l0aERlbGV0ZUJ1dHRvbjogYm9vbGVhbikge1xyXG5cclxuICAgICAgICBhY2NvcmRpb24uYWRkUGFuZWwodGhpcyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSgpIHtcclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLiRsaXN0RWxlbWVudC5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRGaXhlZChmaXhlZDogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMuZml4ZWQgPSBmaXhlZDtcclxuICAgICAgICBpZiAodGhpcy5maXhlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3coKTtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuYWRkQ2xhc3MoJ2pvX2ZpeGVkJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2pvX2ZpeGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyAgICAgPGRpdiBjbGFzcz1cImpvX2xlZnRwYW5lbGNhcHRpb24gZXhwYW5kZWRcIiBpZD1cIndvcmtzcGFjZVwiIGRhdGEtcGFuZWw9XCJmaWxlbGlzdG91dGVyXCI+XHJcbiAgICAvLyAgICAgPHNwYW4+V09SS1NQQUNFPC9zcGFuPlxyXG4gICAgLy8gICAgIDxkaXYgY2xhc3M9XCJqb19hY3Rpb25zXCI+PGltZyBpZD1cImJ1dHRvbk5ld0ZpbGVcIiB0aXRsZT1cIk5ldWUgRGF0ZWkgaGluenVmw7xnZW5cIlxyXG4gICAgLy8gICAgICAgICAgICAgc3JjPVwiYXNzZXRzL3Byb2plY3RleHBsb3Jlci9hZGQtZmlsZS1kYXJrLnN2Z1wiPjwvZGl2PlxyXG4gICAgLy8gPC9kaXY+XHJcbiAgICAvLyA8ZGl2IGlkPVwiZmlsZWxpc3RvdXRlclwiIGNsYXNzPVwiam9fcHJvamVjdGV4cGxvcmVyZGl2IHNjcm9sbGFibGVcIiBkYXRhLWdyb3c9XCIzXCJcclxuICAgIC8vICAgICBzdHlsZT1cImZsZXgtZ3JvdzogM1wiPlxyXG4gICAgLy8gICAgIDxkaXYgaWQ9XCJmaWxlbGlzdFwiPjwvZGl2PlxyXG4gICAgLy8gPC9kaXY+XHJcblxyXG5cclxuICAgIGVuYWJsZU5ld0J1dHRvbihlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuJGJ1dHRvbk5ldyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXcuc2hvdygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV3LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgcmVuZGVyT3V0ZXJIdG1sRWxlbWVudHMoJGFjY29yZGlvbkRpdjogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQgPSBqUXVlcnkoYDxkaXYgY2xhc3M9XCJqb19sZWZ0cGFuZWxjYXB0aW9uIGpvX2V4cGFuZGVkXCI+XHJcbiAgICAgICAgPHNwYW4+YCArIHRoaXMuY2FwdGlvbiArIGA8L3NwYW4+PGRpdiBjbGFzcz1cImpvX2FjdGlvbnNcIj48L2Rpdj48L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMubmV3QnV0dG9uQ2xhc3MgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICB0aGlzLiRidXR0b25OZXcgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19idXR0b24gam9fYWN0aXZlICcgKyB0aGlzLm5ld0J1dHRvbkNsYXNzICsgJ1wiIHRpdGxlPVwiJyArIHRoaXMuYnV0dG9uTmV3VGl0bGUgKyAnXCI+Jyk7XHJcbiAgICAgICAgICAgIHRoaXMuJGNhcHRpb25FbGVtZW50LmZpbmQoJy5qb19hY3Rpb25zJykuYXBwZW5kKHRoaXMuJGJ1dHRvbk5ldyk7XHJcblxyXG4gICAgICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG4gICAgICAgICAgICB0aGlzLiRidXR0b25OZXcub24obW91c2VQb2ludGVyICsgJ2Rvd24nLCAoZXYpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICBIZWxwZXIuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIGV2LnN0b3BQcm9wYWdhdGlvbigpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBhZTogQWNjb3JkaW9uRWxlbWVudE5ldyA9IHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIk5ldVwiXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC5lbGVtZW50cy5wdXNoKGFlKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgJGVsZW1lbnQgPSB0aGF0LnJlbmRlckVsZW1lbnQoYWUpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC4kbGlzdEVsZW1lbnQucHJlcGVuZCgkZWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgdGhhdC4kbGlzdEVsZW1lbnQuc2Nyb2xsVG9wKDApO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQucmVuYW1lRWxlbWVudChhZSwgKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm5ld0VsZW1lbnRDYWxsYmFjayhhZSwgKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZS5leHRlcm5hbEVsZW1lbnQgPSBleHRlcm5hbEVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWUuJGh0bWxTZWNvbmRMaW5lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFlLiRodG1sU2Vjb25kTGluZS5pbnNlcnRBZnRlcigkZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHRoYXQuc2VsZWN0KGFlLmV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0ICRsaXN0T3V0ZXIgPSBqUXVlcnkoJzxkaXYgaWQ9XCJmaWxlbGlzdG91dGVyXCIgY2xhc3M9XCJqb19wcm9qZWN0ZXhwbG9yZXJkaXYgam9fc2Nyb2xsYWJsZVwiIGRhdGEtZ3Jvdz1cIidcclxuICAgICAgICAgICAgKyB0aGlzLmZsZXhXZWlnaHQgKyAnXCIgc3R5bGU9XCJmbGV4LWdyb3c6ICcgKyB0aGlzLmZsZXhXZWlnaHQgKyAnXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19maWxlbGlzdFwiPjwvZGl2PicpXHJcblxyXG4gICAgICAgICRsaXN0T3V0ZXIuYXBwZW5kKHRoaXMuJGxpc3RFbGVtZW50KTtcclxuXHJcbiAgICAgICAgJGFjY29yZGlvbkRpdi5hcHBlbmQodGhpcy4kY2FwdGlvbkVsZW1lbnQpO1xyXG4gICAgICAgICRhY2NvcmRpb25EaXYuYXBwZW5kKCRsaXN0T3V0ZXIpO1xyXG5cclxuICAgICAgICBsZXQgJGNlID0gdGhpcy4kY2FwdGlvbkVsZW1lbnQ7XHJcbiAgICAgICAgbGV0ICRsaSA9IHRoaXMuJGxpc3RFbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcblxyXG4gICAgICAgICRjZS5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChldikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXYuYnV0dG9uICE9IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmZpeGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0R3JvdyA9ICRsaS5kYXRhKCdncm93Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJGNlLmhhc0NsYXNzKCdqb19leHBhbmRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuYWNjb3JkaW9uLnBhcnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGxpLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZsZXgtZ3Jvdyc6IDAuMDAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwMDAsICgpID0+IHsgJGNlLnRvZ2dsZUNsYXNzKCdqb19leHBhbmRlZCcpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICRjZS50b2dnbGVDbGFzcygnam9fZXhwYW5kZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkbGkuYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbGV4LWdyb3cnOiB0YXJnZXRHcm93XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIGdyb3coKXtcclxuICAgICAgICBsZXQgJGxpID0gdGhpcy4kbGlzdEVsZW1lbnQucGFyZW50KCk7XHJcbiAgICAgICAgbGV0IHRhcmdldEdyb3cgPSAkbGkuZGF0YSgnZ3JvdycpO1xyXG4gICAgICAgICRsaS5jc3MoJ2ZsZXgtZ3JvdycsIHRhcmdldEdyb3cpO1xyXG4gICAgICAgIHRoaXMuJGNhcHRpb25FbGVtZW50LmFkZENsYXNzKCdqb19leHBhbmRlZCcpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEVsZW1lbnQoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudE5ldykge1xyXG4gICAgICAgIHRoaXMuZWxlbWVudHMucHVzaChlbGVtZW50KTtcclxuICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lID0gdGhpcy5yZW5kZXJFbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgICAgIHRoaXMuJGxpc3RFbGVtZW50LnByZXBlbmQoZWxlbWVudC4kaHRtbEZpcnN0TGluZSk7XHJcbiAgICB9XHJcblxyXG4gICAgc29ydEVsZW1lbnRzKCl7XHJcbiAgICAgICAgaWYodGhpcy5kb250U29ydEVsZW1lbnRzKSByZXR1cm47XHJcbiAgICAgICAgdGhpcy5lbGVtZW50cy5zb3J0KChhLCBiKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBhTmFtZSA9IGEuc29ydE5hbWUgPyBhLnNvcnROYW1lIDogYS5uYW1lO1xyXG4gICAgICAgICAgICBsZXQgYk5hbWUgPSBiLnNvcnROYW1lID8gYi5zb3J0TmFtZSA6IGIubmFtZTtcclxuICAgICAgICAgICAgcmV0dXJuIChhTmFtZS5sb2NhbGVDb21wYXJlKGJOYW1lKSk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7dGhpcy4kbGlzdEVsZW1lbnQuYXBwZW5kKGVsZW1lbnQuJGh0bWxGaXJzdExpbmUpfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGV4dEFmdGVyRmlsZW5hbWUoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudE5ldywgdGV4dDogc3RyaW5nLCBjc3NDbGFzczogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0ICRkaXYgPSBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmZpbmQoJy5qb190ZXh0QWZ0ZXJOYW1lJyk7XHJcbiAgICAgICAgJGRpdi5hZGRDbGFzcyhjc3NDbGFzcyk7XHJcbiAgICAgICAgJGRpdi5odG1sKHRleHQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBhZGRBY3Rpb24oJGVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5maW5kKCcuam9fYWN0aW9ucycpLnByZXBlbmQoJGVsZW1lbnQpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZW5kZXJFbGVtZW50KGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnROZXcpOiBKUXVlcnk8SFRNTEVsZW1lbnQ+IHtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQuaWNvbkNsYXNzID09IG51bGwpIGVsZW1lbnQuaWNvbkNsYXNzID0gdGhpcy5kZWZhdWx0SWNvbkNsYXNzO1xyXG5cclxuICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lID0galF1ZXJ5KGA8ZGl2IGNsYXNzPVwiam9fZmlsZSBqb18ke2VsZW1lbnQuaWNvbkNsYXNzfVwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3M9XCJqb19maWxlaW1hZ2VcIj48L2Rpdj48ZGl2IGNsYXNzPVwiam9fZmlsZW5hbWVcIj4ke2VzY2FwZUh0bWwoZWxlbWVudC5uYW1lKX08L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fdGV4dEFmdGVyTmFtZVwiPjwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19hZGRpdGlvbmFsQnV0dG9uSG9tZXdvcmtcIj48L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fYWRkaXRpb25hbEJ1dHRvblN0YXJ0XCI+PC9kaXY+XHJcbiAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2FkZGl0aW9uYWxCdXR0b25SZXBvc2l0b3J5XCI+PC9kaXY+XHJcbiAgICAgICAgICAgJHt0aGlzLndpdGhEZWxldGVCdXR0b24gPyAnPGRpdiBjbGFzcz1cImpvX2RlbGV0ZSBpbWdfZGVsZXRlIGpvX2J1dHRvbiBqb19hY3RpdmUnICsgKGZhbHNlID8gXCIgam9fZGVsZXRlX2Fsd2F5c1wiIDogXCJcIikgKydcIj48L2Rpdj4nIDogXCJcIn1cclxuICAgICAgICAgICAkeyFqb19tb3VzZURldGVjdGVkID8gJzxkaXYgY2xhc3M9XCJqb19zZXR0aW5nc19idXR0b24gaW1nX2VsbGlwc2lzLWRhcmsgam9fYnV0dG9uIGpvX2FjdGl2ZVwiPjwvZGl2PicgOiBcIlwifVxyXG4gICAgICAgICAgIDwvZGl2PmApO1xyXG4gICAgICAgICAgIFxyXG4gICAgICAgICAgIGlmICh0aGlzLmFkZEVsZW1lbnRBY3Rpb25DYWxsYmFjayAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgIGxldCAkZWxlbWVudEFjdGlvbiA9IHRoaXMuYWRkRWxlbWVudEFjdGlvbkNhbGxiYWNrKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmFwcGVuZCgkZWxlbWVudEFjdGlvbik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUub24obW91c2VQb2ludGVyICsgJ2Rvd24nLCAoZXYpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmIChldi5idXR0b24gPT0gMCAmJiB0aGF0LnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0Q2FsbGJhY2soZWxlbWVudC5leHRlcm5hbEVsZW1lbnQpO1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGFlIG9mIHRoYXQuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWUgIT0gZWxlbWVudCAmJiBhZS4kaHRtbEZpcnN0TGluZS5oYXNDbGFzcygnam9fYWN0aXZlJykpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmFkZENsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBsZXQgY29udGV4dG1lbnVIYW5kbGVyID0gIGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGNvbnRleHRNZW51SXRlbXM6IENvbnRleHRNZW51SXRlbVtdID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGF0LnJlbmFtZUNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHRNZW51SXRlbXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJVbWJlbmVubmVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW5hbWVFbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGF0LmNvbnRleHRNZW51UHJvdmlkZXIgIT0gbnVsbCkge1xyXG5cclxuICAgICAgICAgICAgICAgIGZvciAobGV0IGNtaSBvZiB0aGF0LmNvbnRleHRNZW51UHJvdmlkZXIoZWxlbWVudCkpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0TWVudUl0ZW1zLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBjbWkuY2FwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNtaS5jYWxsYmFjayhlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29sb3I6IGNtaS5jb2xvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3ViTWVudTogY21pLnN1Yk1lbnUgPT0gbnVsbCA/IG51bGwgOiBjbWkuc3ViTWVudS5tYXAoKG1pKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IG1pLmNhcHRpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWkuY2FsbGJhY2soZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogbWkuY29sb3JcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAoY29udGV4dE1lbnVJdGVtcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBvcGVuQ29udGV4dE1lbnUoY29udGV4dE1lbnVJdGVtcywgZXZlbnQucGFnZVgsIGV2ZW50LnBhZ2VZKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmVbMF0uYWRkRXZlbnRMaXN0ZW5lcihcImNvbnRleHRtZW51XCIsIGNvbnRleHRtZW51SGFuZGxlciwgZmFsc2UpO1xyXG5cclxuICAgICAgICAvLyBsb25nIHByZXNzIGZvciB0b3VjaCBkZXZpY2VzXHJcbiAgICAgICAgbGV0IHByZXNzVGltZXI6IG51bWJlcjtcclxuICAgICAgICBpZigham9fbW91c2VEZXRlY3RlZCl7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUub24oJ3BvaW50ZXJ1cCcsICgpID0+IHtcclxuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChwcmVzc1RpbWVyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSkub24oJ3BvaW50ZXJkb3duJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBwcmVzc1RpbWVyID0gd2luZG93LnNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRtZW51SGFuZGxlcihldmVudCk7XHJcbiAgICAgICAgICAgICAgICB9LCA1MDApO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKCFqb19tb3VzZURldGVjdGVkKXtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fc2V0dGluZ3NfYnV0dG9uJykub24oJ3BvaW50ZXJkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHRtZW51SGFuZGxlcihlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX3NldHRpbmdzX2J1dHRvbicpLm9uKCdtb3VzZWRvd24gY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhhdC53aXRoRGVsZXRlQnV0dG9uKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX2RlbGV0ZScpLm9uKG1vdXNlUG9pbnRlciArICdkb3duJywgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgb3BlbkNvbnRleHRNZW51KFt7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJBYmJyZWNoZW5cIixcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvLlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkljaCBiaW4gbWlyIHNpY2hlcjogbMO2c2NoZW4hXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiI2ZmNjA2MFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGVsZXRlQ2FsbGJhY2soZWxlbWVudC5leHRlcm5hbEVsZW1lbnQsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC4kaHRtbFNlY29uZExpbmUgIT0gbnVsbCkgZWxlbWVudC4kaHRtbFNlY29uZExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmVsZW1lbnRzLnNwbGljZSh0aGF0LmVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCksIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5lbGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0KHRoYXQuZWxlbWVudHNbMF0uZXh0ZXJuYWxFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLCBldi5wYWdlWCArIDIsIGV2LnBhZ2VZICsgMik7XHJcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudC4kaHRtbEZpcnN0TGluZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVuYW1lRWxlbWVudChlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50TmV3LCBjYWxsYmFjaz86ICgpID0+IHZvaWQpIHtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgbGV0ICRkaXYgPSBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmZpbmQoJy5qb19maWxlbmFtZScpO1xyXG4gICAgICAgIGxldCBwb2ludFBvcyA9IGVsZW1lbnQubmFtZS5pbmRleE9mKCcuJyk7XHJcbiAgICAgICAgbGV0IHNlbGVjdGlvbiA9IHBvaW50UG9zID09IG51bGwgPyBudWxsIDogeyBzdGFydDogMCwgZW5kOiBwb2ludFBvcyB9O1xyXG4gICAgICAgIHRoaXMuZG9udFNvcnRFbGVtZW50cyA9IHRydWU7XHJcbiAgICAgICAgbWFrZUVkaXRhYmxlKCRkaXYsICRkaXYsIChuZXdUZXh0OiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50ICE9IG51bGwpIG5ld1RleHQgPSB0aGF0LnJlbmFtZUNhbGxiYWNrKGVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50LCBuZXdUZXh0KTtcclxuICAgICAgICAgICAgZWxlbWVudC5uYW1lID0gbmV3VGV4dDtcclxuICAgICAgICAgICAgJGRpdi5odG1sKGVsZW1lbnQubmFtZSk7XHJcbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAhPSBudWxsKSBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICB0aGF0LnNvcnRFbGVtZW50cygpO1xyXG4gICAgICAgICAgICAkZGl2WzBdLnNjcm9sbEludG9WaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMuZG9udFNvcnRFbGVtZW50cyA9IGZhbHNlO1xyXG4gICAgICAgIH0sIHNlbGVjdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgc2VsZWN0KGV4dGVybmFsRWxlbWVudDogYW55LCBpbnZva2VDYWxsYmFjazogYm9vbGVhbiA9IHRydWUsIHNjcm9sbEludG9WaWV3OiBib29sZWFuID0gZmFsc2UpIHtcclxuXHJcbiAgICAgICAgaWYgKGV4dGVybmFsRWxlbWVudCA9PSBudWxsKSB7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGFlMSBvZiB0aGlzLmVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoYWUxLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkgYWUxLiRodG1sRmlyc3RMaW5lLnJlbW92ZUNsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCBhZSA9IHRoaXMuZmluZEVsZW1lbnQoZXh0ZXJuYWxFbGVtZW50KTtcclxuXHJcbiAgICAgICAgICAgIGlmKGFlICE9IG51bGwpe1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYWUxIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWUxLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkgYWUxLiRodG1sRmlyc3RMaW5lLnJlbW92ZUNsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgIFxyXG4gICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmUuYWRkQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgICAgICAgICAgaWYoc2Nyb2xsSW50b1ZpZXcpe1xyXG4gICAgICAgICAgICAgICAgICAgIGFlLiRodG1sRmlyc3RMaW5lWzBdLnNjcm9sbEludG9WaWV3KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoaW52b2tlQ2FsbGJhY2sgJiYgdGhpcy5zZWxlY3RDYWxsYmFjayAhPSBudWxsKSB0aGlzLnNlbGVjdENhbGxiYWNrKGV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNldEVsZW1lbnRDbGFzcyhlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50TmV3LCBpY29uQ2xhc3M6IHN0cmluZyl7XHJcbiAgICAgICAgaWYoZWxlbWVudCAhPSBudWxsKXtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZT8ucmVtb3ZlQ2xhc3MoXCJqb19cIiArIGVsZW1lbnQuaWNvbkNsYXNzKS5hZGRDbGFzcyhcImpvX1wiICsgaWNvbkNsYXNzKTtcclxuICAgICAgICAgICAgZWxlbWVudC5pY29uQ2xhc3MgPSBpY29uQ2xhc3M7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIGZpbmRFbGVtZW50KGV4dGVybmFsRWxlbWVudDogYW55KTogQWNjb3JkaW9uRWxlbWVudE5ldyB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuZXh0ZXJuYWxFbGVtZW50ID09IGV4dGVybmFsRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlRWxlbWVudChleHRlcm5hbEVsZW1lbnQ6IGFueSkge1xyXG4gICAgICAgIGZvciAobGV0IGFlIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgaWYgKGFlLmV4dGVybmFsRWxlbWVudCA9PSBleHRlcm5hbEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIGFlLiRodG1sRmlyc3RMaW5lLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFlLiRodG1sU2Vjb25kTGluZSAhPSBudWxsKSBhZS4kaHRtbFNlY29uZExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZSh0aGlzLmVsZW1lbnRzLmluZGV4T2YoYWUpLCAxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RDYWxsYmFjayAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdCh0aGlzLmVsZW1lbnRzWzBdLmV4dGVybmFsRWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuJGxpc3RFbGVtZW50LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50cyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENhcHRpb24odGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuZmluZCgnc3BhbicpLmh0bWwodGV4dCk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0U2VsZWN0ZWRFbGVtZW50RGF0YSgpOiBhbnkge1xyXG4gICAgICAgIGZvciAobGV0IGFlIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgaWYgKGFlLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBBY2NvcmRpb25OZXcge1xyXG5cclxuICAgIHBhcnRzOiBBY2NvcmRpb25QYW5lbE5ld1tdID0gW107XHJcbiAgICAkaHRtbDogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigkaHRtbDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIHRoaXMuJGh0bWwgPSAkaHRtbDtcclxuICAgICAgICAkaHRtbC5hZGRDbGFzcygnam9fbGVmdHBhbmVsaW5uZXInKTtcclxuICAgIH1cclxuXHJcbiAgICBhZGRQYW5lbChwYW5lbDogQWNjb3JkaW9uUGFuZWxOZXcpIHtcclxuICAgICAgICBwYW5lbC5yZW5kZXJPdXRlckh0bWxFbGVtZW50cyh0aGlzLiRodG1sKTtcclxuICAgICAgICB0aGlzLnBhcnRzLnB1c2gocGFuZWwpO1xyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19