import { openContextMenu, makeEditable, jo_mouseDetected, animateToTransparent } from "../../tools/HtmlTools.js";
import { Helper } from "./Helper.js";
import { escapeHtml } from "../../tools/StringTools.js";
import { WorkspaceImporter } from "./WorkspaceImporter.js";
export class AccordionPanel {
    constructor(accordion, caption, flexWeight, newButtonClass, buttonNewTitle, defaultIconClass, withDeleteButton, withFolders, kind, enableDrag, acceptDropKinds) {
        this.accordion = accordion;
        this.caption = caption;
        this.flexWeight = flexWeight;
        this.newButtonClass = newButtonClass;
        this.buttonNewTitle = buttonNewTitle;
        this.defaultIconClass = defaultIconClass;
        this.withDeleteButton = withDeleteButton;
        this.withFolders = withFolders;
        this.kind = kind;
        this.enableDrag = enableDrag;
        this.acceptDropKinds = acceptDropKinds;
        this.elements = [];
        this.dontSortElements = false;
        accordion.addPanel(this);
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        if (withFolders) {
            let that = this;
            this.$newFolderAction = jQuery('<div class="img_add-folder-dark jo_button jo_active" style="margin-right: 4px"' +
                ' title="Neuen Ordner auf oberster Ebene anlegen">');
            this.$newFolderAction.on(mousePointer + 'down', (e) => {
                e.stopPropagation();
                e.preventDefault();
                let pathArray = [];
                this.addFolder("Neuer Ordner", pathArray, (newElement) => {
                    this.newFolderCallback(newElement, () => {
                        this.sortElements();
                        newElement.$htmlFirstLine[0].scrollIntoView();
                        animateToTransparent(newElement.$htmlFirstLine.find('.jo_filename'), 'background-color', [0, 255, 0], 2000);
                    });
                });
            });
            this.addAction(this.$newFolderAction);
            let $collapseAllAction = jQuery('<div class="img_collapse-all-dark jo_button jo_active" style="margin-right: 4px"' +
                ' title="Alle Ordner zusammenfalten">');
            $collapseAllAction.on(mousePointer + 'down', (e) => {
                e.stopPropagation();
                e.preventDefault();
                that.collapseAll();
            });
            this.addAction($collapseAllAction);
        }
    }
    collapseAll() {
        for (let element of this.elements) {
            if (element.isFolder) {
                if (element.$htmlFirstLine.hasClass('jo_expanded')) {
                    element.$htmlFirstLine.removeClass('jo_expanded');
                    element.$htmlFirstLine.addClass('jo_collapsed');
                }
            }
            if (element.path.length > 0) {
                element.$htmlFirstLine.slideUp(200);
            }
        }
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
    getCurrentlySelectedPath() {
        let pathArray = [];
        let selectedElement = this.getSelectedElement();
        if (selectedElement != null) {
            pathArray = selectedElement.path.slice(0);
            if (selectedElement.isFolder)
                pathArray.push(selectedElement.name);
        }
        return pathArray;
    }
    compareWithPath(name1, path1, isFolder1, name2, path2, isFolder2) {
        path1 = path1.slice();
        path1.push(name1);
        name1 = "";
        path2 = path2.slice();
        path2.push(name2);
        name2 = "";
        let i = 0;
        while (i < path1.length && i < path2.length) {
            let cmp = path1[i].localeCompare(path2[i]);
            if (cmp != 0)
                return cmp;
            i++;
        }
        if (path1.length < path2.length)
            return -1;
        if (path1.length > path2.length)
            return 1;
        return name1.localeCompare(name2);
        // let nameWithPath1 = path1.join("/");
        // if (nameWithPath1 != "" && name1 != "") nameWithPath1 += "/";
        // nameWithPath1 += name1;
        // let nameWithPath2 = path2.join("/");
        // if (nameWithPath2 != "" && name2 != "") nameWithPath2 += "/";
        // nameWithPath2 += name2;
        // return nameWithPath1.localeCompare(nameWithPath2);
    }
    getElementIndex(name, path, isFolder) {
        for (let i = 0; i < this.elements.length; i++) {
            let element = this.elements[i];
            if (this.compareWithPath(name, path, isFolder, element.name, element.path, element.isFolder) < 0)
                return i;
        }
        return this.elements.length;
    }
    insertElement(ae) {
        let insertIndex = this.getElementIndex(ae.name, ae.path, ae.isFolder);
        // if (ae.path.length == 0) insertIndex = this.elements.length;
        this.elements.splice(insertIndex, 0, ae);
        let $elements = this.$listElement.find('.jo_file');
        if (insertIndex == 0) {
            this.$listElement.prepend(ae.$htmlFirstLine);
        }
        else if (insertIndex == $elements.length) {
            this.$listElement.append(ae.$htmlFirstLine);
        }
        else {
            let elementAtIndex = $elements.get(insertIndex);
            jQuery(elementAtIndex).before(ae.$htmlFirstLine);
        }
    }
    addFolder(name, path, callback) {
        let ae = {
            name: name,
            isFolder: true,
            path: path
        };
        let $element = this.renderElement(ae, true);
        this.insertElement(ae);
        $element[0].scrollIntoView();
        this.renameElement(ae, () => {
            callback(ae);
        });
    }
    renderOuterHtmlElements($accordionDiv) {
        let that = this;
        this.$captionElement = jQuery(`<div class="jo_leftpanelcaption jo_expanded">
        <div class="jo_captiontext">` + this.caption + `</div><div class="jo_actions"></div></div>`);
        if (this.newButtonClass != null) {
            this.$buttonNew = jQuery('<div class="jo_button jo_active ' + this.newButtonClass + '" title="' + this.buttonNewTitle + '">');
            this.$captionElement.find('.jo_actions').append(this.$buttonNew);
            let mousePointer = window.PointerEvent ? "pointer" : "mouse";
            this.$buttonNew.on(mousePointer + 'down', (ev) => {
                Helper.close();
                ev.stopPropagation();
                let path = that.getCurrentlySelectedPath();
                let ae = {
                    name: "Neu",
                    isFolder: false,
                    path: path
                };
                let insertIndex = this.getElementIndex("", path, false);
                this.elements.splice(insertIndex, 0, ae);
                let $element = this.renderElement(ae, true);
                if (insertIndex == 0) {
                    this.$listElement.prepend($element);
                }
                else {
                    let elementAtIndex = this.$listElement.find('.jo_file').get(insertIndex - 1);
                    jQuery(elementAtIndex).after($element);
                }
                $element[0].scrollIntoView();
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
        $ce.on('dragover', (event) => {
            if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                $ce.addClass('jo_file_dragover');
                event.preventDefault();
            }
        });
        $ce.on('dragleave', (event) => {
            $ce.removeClass('jo_file_dragover');
        });
        $ce.on('drop', (event) => {
            if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                event.preventDefault();
                $ce.removeClass('jo_file_dragover');
                let element1 = AccordionPanel.currentlyDraggedElement;
                if (element1 != null) {
                    that.moveElement(element1, null);
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
    addElement(element, expanded) {
        // this.elements.push(element);
        // element.$htmlFirstLine = this.renderElement(element, expanded);
        // this.$listElement.prepend(element.$htmlFirstLine);
        element.$htmlFirstLine = this.renderElement(element, expanded);
        this.insertElement(element);
    }
    sortElements() {
        if (this.dontSortElements)
            return;
        this.elements.sort((a, b) => {
            let aName = a.sortName ? a.sortName : a.name;
            let bName = b.sortName ? b.sortName : b.name;
            return this.compareWithPath(aName, a.path, a.isFolder, bName, b.path, b.isFolder);
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
    renderElement(element, expanded) {
        let mousePointer = window.PointerEvent ? "pointer" : "mouse";
        let that = this;
        let expandedCollapsed = "";
        if (element.iconClass == null)
            element.iconClass = this.defaultIconClass;
        if (element.isFolder) {
            element.iconClass = "folder";
            expandedCollapsed = expanded ? " jo_expanded" : " jo_collapsed";
        }
        let pathHtml = "";
        if (element.path == null)
            element.path = [];
        for (let i = 0; i < element.path.length; i++) {
            pathHtml += '<div class="jo_folderline"></div>';
        }
        element.$htmlFirstLine = jQuery(`<div class="jo_file jo_${element.iconClass} ${expandedCollapsed}">
        <div class="jo_folderlines">${pathHtml}</div>
           <div class="jo_fileimage"></div>
           <div class="jo_filename">${escapeHtml(element.name)}</div>
           <div class="jo_textAfterName"></div>
           <div class="jo_additionalButtonHomework"></div>
           <div class="jo_additionalButtonStart"></div>
           <div class="jo_additionalButtonRepository"></div>
           ${this.withDeleteButton ? '<div class="jo_delete img_delete jo_button jo_active' + (false ? " jo_delete_always" : "") + '"></div>' : ""}
           ${!jo_mouseDetected ? '<div class="jo_settings_button img_ellipsis-dark jo_button jo_active"></div>' : ""}
           </div>`);
        if (!expanded && element.path.length > 0) {
            element.$htmlFirstLine.hide();
        }
        if (this.addElementActionCallback != null) {
            let $elementAction = this.addElementActionCallback(element);
            element.$htmlFirstLine.append($elementAction);
        }
        if (this.withFolders) {
            if (element.isFolder) {
                element.$htmlFirstLine.on('dragover', (event) => {
                    if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                        element.$htmlFirstLine.addClass('jo_file_dragover');
                        event.preventDefault();
                    }
                });
                element.$htmlFirstLine.on('dragleave', (event) => {
                    element.$htmlFirstLine.removeClass('jo_file_dragover');
                });
                element.$htmlFirstLine.on('drop', (event) => {
                    if (AccordionPanel.currentlyDraggedElementKind == that.kind) {
                        event.preventDefault();
                        element.$htmlFirstLine.removeClass('jo_file_dragover');
                        let element1 = AccordionPanel.currentlyDraggedElement;
                        AccordionPanel.currentlyDraggedElement = null;
                        if (element1 != null) {
                            that.moveElement(element1, element);
                        }
                    }
                });
            }
        }
        if (this.withFolders || this.enableDrag) {
            let $filedragpart = element.$htmlFirstLine.find('.jo_filename');
            $filedragpart.attr('draggable', 'true');
            $filedragpart.on('dragstart', (event) => {
                AccordionPanel.currentlyDraggedElement = element;
                AccordionPanel.currentlyDraggedElementKind = that.kind;
                event.originalEvent.dataTransfer.effectAllowed = element.isFolder ? "move" : "copyMove";
            });
        }
        if (this.acceptDropKinds != null && this.acceptDropKinds.length > 0) {
            if (!element.isFolder) {
                element.$htmlFirstLine.on('dragover', (event) => {
                    if (this.acceptDropKinds.indexOf(AccordionPanel.currentlyDraggedElementKind) >= 0) {
                        element.$htmlFirstLine.addClass('jo_file_dragover');
                        if (event.ctrlKey) {
                            event.originalEvent.dataTransfer.dropEffect = "copy";
                        }
                        else {
                            event.originalEvent.dataTransfer.dropEffect = "move";
                        }
                        event.preventDefault();
                    }
                });
                element.$htmlFirstLine.on('dragleave', (event) => {
                    element.$htmlFirstLine.removeClass('jo_file_dragover');
                });
                element.$htmlFirstLine.on('drop', (event) => {
                    if (this.acceptDropKinds.indexOf(AccordionPanel.currentlyDraggedElementKind) >= 0) {
                        event.preventDefault();
                        element.$htmlFirstLine.removeClass('jo_file_dragover');
                        let element1 = AccordionPanel.currentlyDraggedElement;
                        AccordionPanel.currentlyDraggedElement = null;
                        if (element1 != null) {
                            if (that.dropElementCallback != null)
                                that.dropElementCallback(element, element1, event.ctrlKey ? "copy" : "move");
                        }
                    }
                });
            }
        }
        element.$htmlFirstLine.on(mousePointer + 'up', (ev) => {
            if (ev.button == 0 && that.selectCallback != null) {
                that.selectCallback(element.externalElement);
                for (let ae of that.elements) {
                    if (ae != element && ae.$htmlFirstLine.hasClass('jo_active')) {
                        ae.$htmlFirstLine.removeClass('jo_active');
                    }
                }
                element.$htmlFirstLine.addClass('jo_active');
                if (element.isFolder) {
                    if (element.$htmlFirstLine.hasClass('jo_expanded')) {
                        element.$htmlFirstLine.removeClass('jo_expanded');
                        element.$htmlFirstLine.addClass('jo_collapsed');
                    }
                    else {
                        element.$htmlFirstLine.addClass('jo_expanded');
                        element.$htmlFirstLine.removeClass('jo_collapsed');
                    }
                    let pathIsCollapsed = {};
                    for (let e of this.elements) {
                        if (e.isFolder) {
                            let path = e.path.join("/");
                            if (path != "")
                                path += "/";
                            path += e.name;
                            pathIsCollapsed[path] = e.$htmlFirstLine.hasClass('jo_collapsed');
                            if (pathIsCollapsed[e.path.join("/")])
                                pathIsCollapsed[path] = true;
                        }
                    }
                    pathIsCollapsed[""] = false;
                    for (let e of this.elements) {
                        if (pathIsCollapsed[e.path.join("/")]) {
                            e.$htmlFirstLine.slideUp(200);
                        }
                        else {
                            e.$htmlFirstLine.slideDown(200);
                        }
                    }
                }
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
            let mousePointer = window.PointerEvent ? "pointer" : "mouse";
            if (element.isFolder) {
                contextMenuItems = contextMenuItems.concat([
                    {
                        caption: "Neuen Unterordner anlegen (unterhalb '" + element.name + "')...",
                        callback: () => {
                            that.select(element.externalElement);
                            // that.$newFolderAction.trigger(mousePointer + 'down');
                            let pathArray = that.getCurrentlySelectedPath();
                            that.addFolder("Neuer Ordner", pathArray, (newElement) => {
                                that.newFolderCallback(newElement, () => {
                                    that.sortElements();
                                    newElement.$htmlFirstLine[0].scrollIntoView();
                                    animateToTransparent(newElement.$htmlFirstLine.find('.jo_filename'), 'background-color', [0, 255, 0], 2000);
                                });
                            });
                        }
                    }, {
                        caption: "Neuer Workspace...",
                        callback: () => {
                            that.select(element.externalElement);
                            that.$buttonNew.trigger(mousePointer + 'down');
                        }
                    }, {
                        caption: "Workspace importieren...",
                        callback: () => {
                            new WorkspaceImporter(that.accordion.main, element.path.concat([element.name])).show();
                        }
                    }
                ]);
            }
            if (that.contextMenuProvider != null && !element.isFolder) {
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
                            if (element.isFolder) {
                                if (that.getChildElements(element).length > 0) {
                                    alert('Dieser Ordner kann nicht gelöscht werden, da er nicht leer ist.');
                                    return;
                                }
                            }
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
    moveElement(elementToMove, destinationFolder) {
        let destinationPath = destinationFolder == null ? [] : destinationFolder.path.slice(0).concat([destinationFolder.name]);
        if (elementToMove.isFolder) {
            let movedElements = [elementToMove];
            let sourcePath = elementToMove.path.concat([elementToMove.name]).join("/");
            if (destinationPath.join('/').indexOf(sourcePath) == 0)
                return;
            let oldPathLength = elementToMove.path.length;
            elementToMove.path = destinationPath.slice(0);
            for (let element of this.elements) {
                if (element.path.join("/").startsWith(sourcePath)) {
                    element.path.splice(0, oldPathLength);
                    element.path = destinationPath.concat(element.path);
                    movedElements.push(element);
                }
            }
            for (let el of movedElements) {
                el.$htmlFirstLine.remove();
                this.elements.splice(this.elements.indexOf(el), 1);
            }
            for (let el of movedElements) {
                this.renderElement(el, true);
                this.insertElement(el);
            }
            this.moveCallback(movedElements);
        }
        else {
            elementToMove.path = destinationPath;
            elementToMove.$htmlFirstLine.remove();
            this.elements.splice(this.elements.indexOf(elementToMove), 1);
            this.renderElement(elementToMove, true);
            this.insertElement(elementToMove);
            this.select(elementToMove.externalElement);
            elementToMove.$htmlFirstLine[0].scrollIntoView();
            this.moveCallback(elementToMove);
        }
    }
    getChildElements(folder) {
        let path = folder.path.slice(0).concat(folder.name).join("/");
        return this.elements.filter((element) => element.path.join("/").startsWith(path));
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
                    let pathString = ae.path.join("/");
                    for (let el of this.elements) {
                        let elPath = el.path.slice(0);
                        if (pathString.startsWith(elPath.join("/"))) {
                            if (el.isFolder) {
                                elPath.push(el.name);
                                if (pathString.startsWith(elPath.join("/"))) {
                                    el.$htmlFirstLine.removeClass("jo_collapsed");
                                    el.$htmlFirstLine.addClass("jo_expanded");
                                }
                            }
                            el.$htmlFirstLine.show();
                        }
                    }
                    ae.$htmlFirstLine[0].scrollIntoView();
                }
            }
        }
        if (invokeCallback && this.selectCallback != null)
            this.selectCallback(externalElement);
    }
    getPathString(ae) {
        let ps = ae.path.join("/");
        if (ae.isFolder) {
            if (ps != "")
                ps += "/";
            ps += ae.name;
        }
        return ps;
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
        this.$captionElement.find('.jo_captiontext').html(text);
    }
    getSelectedElement() {
        for (let ae of this.elements) {
            if (ae.$htmlFirstLine.hasClass('jo_active')) {
                return ae;
            }
        }
        return null;
    }
}
export class Accordion {
    constructor(main, $html) {
        this.main = main;
        this.parts = [];
        this.$html = $html;
        $html.addClass('jo_leftpanelinner');
    }
    addPanel(panel) {
        panel.renderOuterHtmlElements(this.$html);
        this.parts.push(panel);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWNjb3JkaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9BY2NvcmRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQW1CLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLE1BQU0sMEJBQTBCLENBQUM7QUFDbEksT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLGFBQWEsQ0FBQztBQUNyQyxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sNEJBQTRCLENBQUM7QUFFeEQsT0FBTyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUF1QjNELE1BQU0sT0FBTyxjQUFjO0lBMkJ2QixZQUFvQixTQUFvQixFQUFVLE9BQWUsRUFBVSxVQUFrQixFQUNqRixjQUFzQixFQUFVLGNBQXNCLEVBQ3RELGdCQUF3QixFQUFVLGdCQUF5QixFQUFVLFdBQW9CLEVBQ3pGLElBQWdELEVBQVUsVUFBbUIsRUFBVSxlQUF5QjtRQUh4RyxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQVUsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUFVLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDakYsbUJBQWMsR0FBZCxjQUFjLENBQVE7UUFBVSxtQkFBYyxHQUFkLGNBQWMsQ0FBUTtRQUN0RCxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVE7UUFBVSxxQkFBZ0IsR0FBaEIsZ0JBQWdCLENBQVM7UUFBVSxnQkFBVyxHQUFYLFdBQVcsQ0FBUztRQUN6RixTQUFJLEdBQUosSUFBSSxDQUE0QztRQUFVLGVBQVUsR0FBVixVQUFVLENBQVM7UUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBVTtRQTVCNUgsYUFBUSxHQUF1QixFQUFFLENBQUM7UUFRbEMscUJBQWdCLEdBQVksS0FBSyxDQUFDO1FBc0I5QixTQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXpCLElBQUksWUFB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QztDQUlKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgb3BlbkNvbnRleHRNZW51LCBtYWtlRWRpdGFibGUsIENvbnRleHRNZW51SXRlbSwgam9fbW91c2VEZXRlY3RlZCwgYW5pbWF0ZVRvVHJhbnNwYXJlbnQgfSBmcm9tIFwiLi4vLi4vdG9vbHMvSHRtbFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IEhlbHBlciB9IGZyb20gXCIuL0hlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBlc2NhcGVIdG1sIH0gZnJvbSBcIi4uLy4uL3Rvb2xzL1N0cmluZ1Rvb2xzLmpzXCI7XHJcbmltcG9ydCB7IGlzSlNEb2NUaGlzVGFnLCBpc1RoaXNUeXBlTm9kZSB9IGZyb20gXCJ0eXBlc2NyaXB0XCI7XHJcbmltcG9ydCB7IFdvcmtzcGFjZUltcG9ydGVyIH0gZnJvbSBcIi4vV29ya3NwYWNlSW1wb3J0ZXIuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBBY2NvcmRpb25FbGVtZW50ID0ge1xyXG4gICAgbmFtZTogc3RyaW5nO1xyXG4gICAgc29ydE5hbWU/OiBzdHJpbmc7ICAgICAgLy8gaWYgc29ydE5hbWUgPT0gbnVsbCwgdGhlbiBuYW1lIHdpbGwgYmUgdXNlZCB3aGVuIHNvcnRpbmdcclxuICAgIGV4dGVybmFsRWxlbWVudD86IGFueTtcclxuICAgIGljb25DbGFzcz86IHN0cmluZztcclxuICAgICRodG1sRmlyc3RMaW5lPzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRodG1sU2Vjb25kTGluZT86IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgaXNGb2xkZXI6IGJvb2xlYW47XHJcbiAgICBwYXRoOiBzdHJpbmdbXTtcclxufVxyXG5cclxuZXhwb3J0IHR5cGUgQWNjb3JkaW9uQ29udGV4dE1lbnVJdGVtID0ge1xyXG4gICAgY2FwdGlvbjogc3RyaW5nO1xyXG4gICAgY29sb3I/OiBzdHJpbmc7XHJcbiAgICBjYWxsYmFjazogKHBhbmVsOiBBY2NvcmRpb25FbGVtZW50KSA9PiB2b2lkO1xyXG4gICAgc3ViTWVudT86IEFjY29yZGlvbkNvbnRleHRNZW51SXRlbVtdXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBY2NvcmRpb25QYW5lbCB7XHJcblxyXG4gICAgZWxlbWVudHM6IEFjY29yZGlvbkVsZW1lbnRbXSA9IFtdO1xyXG5cclxuICAgICRjYXB0aW9uRWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgICRidXR0b25OZXc6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcbiAgICAkbGlzdEVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD47XHJcblxyXG4gICAgcHJpdmF0ZSBmaXhlZDogYm9vbGVhbjtcclxuXHJcbiAgICBkb250U29ydEVsZW1lbnRzOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgc3RhdGljIGN1cnJlbnRseURyYWdnZWRFbGVtZW50OiBBY2NvcmRpb25FbGVtZW50O1xyXG4gICAgc3RhdGljIGN1cnJlbnRseURyYWdnZWRFbGVtZW50S2luZDogc3RyaW5nO1xyXG5cclxuICAgIG5ld0VsZW1lbnRDYWxsYmFjazogKGFlOiBBY2NvcmRpb25FbGVtZW50LCBjYWxsYmFja0lmU3VjY2Vzc2Z1bDogKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiB2b2lkKSA9PiB2b2lkO1xyXG4gICAgbmV3Rm9sZGVyQ2FsbGJhY2s6IChhZTogQWNjb3JkaW9uRWxlbWVudCwgY2FsbGJhY2tJZlN1Y2Nlc3NmdWw6IChleHRlcm5hbEVsZW1lbnQ6IGFueSkgPT4gdm9pZCkgPT4gdm9pZDtcclxuICAgIHJlbmFtZUNhbGxiYWNrOiAoZXh0ZXJuYWxFbGVtZW50OiBhbnksIG5ld05hbWU6IHN0cmluZykgPT4gc3RyaW5nO1xyXG4gICAgZGVsZXRlQ2FsbGJhY2s6IChleHRlcm5hbEVsZW1lbnQ6IGFueSwgY2FsbGJhY2tJZlN1Y2Nlc3NmdWw6ICgpID0+IHZvaWQpID0+IHZvaWQ7XHJcbiAgICBzZWxlY3RDYWxsYmFjazogKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiB2b2lkO1xyXG4gICAgYWRkRWxlbWVudEFjdGlvbkNhbGxiYWNrOiAoYWNjb3JkaW9uRWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4gSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGNvbnRleHRNZW51UHJvdmlkZXI6IChleHRlcm5hbEVsZW1lbnQ6IGFueSkgPT4gQWNjb3JkaW9uQ29udGV4dE1lbnVJdGVtW107XHJcbiAgICBtb3ZlQ2FsbGJhY2s6IChhZTogQWNjb3JkaW9uRWxlbWVudCB8IEFjY29yZGlvbkVsZW1lbnRbXSkgPT4gdm9pZDtcclxuICAgIGRyb3BFbGVtZW50Q2FsbGJhY2s6IChkZXN0OiBBY2NvcmRpb25FbGVtZW50LCBkcm9wcGVkRWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCwgZHJvcEVmZmVrdDogXCJjb3B5XCIgfCBcIm1vdmVcIikgPT4gdm9pZDtcclxuXHJcbiAgICAkbmV3Rm9sZGVyQWN0aW9uOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgYWNjb3JkaW9uOiBBY2NvcmRpb24sIHByaXZhdGUgY2FwdGlvbjogc3RyaW5nLCBwcml2YXRlIGZsZXhXZWlnaHQ6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIG5ld0J1dHRvbkNsYXNzOiBzdHJpbmcsIHByaXZhdGUgYnV0dG9uTmV3VGl0bGU6IHN0cmluZyxcclxuICAgICAgICBwcml2YXRlIGRlZmF1bHRJY29uQ2xhc3M6IHN0cmluZywgcHJpdmF0ZSB3aXRoRGVsZXRlQnV0dG9uOiBib29sZWFuLCBwcml2YXRlIHdpdGhGb2xkZXJzOiBib29sZWFuLFxyXG4gICAgICAgIHByaXZhdGUga2luZDogXCJ3b3Jrc3BhY2VcIiB8IFwiZmlsZVwiIHwgXCJjbGFzc1wiIHwgXCJzdHVkZW50XCIsIHByaXZhdGUgZW5hYmxlRHJhZzogYm9vbGVhbiwgcHJpdmF0ZSBhY2NlcHREcm9wS2luZHM6IHN0cmluZ1tdKSB7XHJcblxyXG4gICAgICAgIGFjY29yZGlvbi5hZGRQYW5lbCh0aGlzKTtcclxuXHJcbiAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuXHJcbiAgICAgICAgaWYgKHdpdGhGb2xkZXJzKSB7XHJcbiAgICAgICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICAgICAgdGhpcy4kbmV3Rm9sZGVyQWN0aW9uID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiaW1nX2FkZC1mb2xkZXItZGFyayBqb19idXR0b24gam9fYWN0aXZlXCIgc3R5bGU9XCJtYXJnaW4tcmlnaHQ6IDRweFwiJyArXHJcbiAgICAgICAgICAgICAgICAnIHRpdGxlPVwiTmV1ZW4gT3JkbmVyIGF1ZiBvYmVyc3RlciBFYmVuZSBhbmxlZ2VuXCI+Jyk7XHJcbiAgICAgICAgICAgIHRoaXMuJG5ld0ZvbGRlckFjdGlvbi5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBwYXRoQXJyYXk6IHN0cmluZ1tdID0gW107XHJcblxyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRGb2xkZXIoXCJOZXVlciBPcmRuZXJcIiwgcGF0aEFycmF5LCAobmV3RWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubmV3Rm9sZGVyQ2FsbGJhY2sobmV3RWxlbWVudCwgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNvcnRFbGVtZW50cygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuZXdFbGVtZW50LiRodG1sRmlyc3RMaW5lWzBdLnNjcm9sbEludG9WaWV3KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFuaW1hdGVUb1RyYW5zcGFyZW50KG5ld0VsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX2ZpbGVuYW1lJyksICdiYWNrZ3JvdW5kLWNvbG9yJywgWzAsIDI1NSwgMF0sIDIwMDApO1xyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgdGhpcy5hZGRBY3Rpb24odGhpcy4kbmV3Rm9sZGVyQWN0aW9uKTtcclxuXHJcblxyXG4gICAgICAgICAgICBsZXQgJGNvbGxhcHNlQWxsQWN0aW9uID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiaW1nX2NvbGxhcHNlLWFsbC1kYXJrIGpvX2J1dHRvbiBqb19hY3RpdmVcIiBzdHlsZT1cIm1hcmdpbi1yaWdodDogNHB4XCInICtcclxuICAgICAgICAgICAgICAgICcgdGl0bGU9XCJBbGxlIE9yZG5lciB6dXNhbW1lbmZhbHRlblwiPicpO1xyXG4gICAgICAgICAgICAkY29sbGFwc2VBbGxBY3Rpb24ub24obW91c2VQb2ludGVyICsgJ2Rvd24nLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGF0LmNvbGxhcHNlQWxsKCk7XHJcblxyXG4gICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgdGhpcy5hZGRBY3Rpb24oJGNvbGxhcHNlQWxsQWN0aW9uKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb2xsYXBzZUFsbCgpIHtcclxuICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgaWYgKGVsZW1lbnQuaXNGb2xkZXIpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19leHBhbmRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5yZW1vdmVDbGFzcygnam9fZXhwYW5kZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmFkZENsYXNzKCdqb19jb2xsYXBzZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5wYXRoLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuc2xpZGVVcCgyMDApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlbW92ZSgpIHtcclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5yZW1vdmUoKTtcclxuICAgICAgICB0aGlzLiRsaXN0RWxlbWVudC5yZW1vdmUoKTtcclxuICAgIH1cclxuXHJcbiAgICBzZXRGaXhlZChmaXhlZDogYm9vbGVhbikge1xyXG4gICAgICAgIHRoaXMuZml4ZWQgPSBmaXhlZDtcclxuICAgICAgICBpZiAodGhpcy5maXhlZCkge1xyXG4gICAgICAgICAgICB0aGlzLmdyb3coKTtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuYWRkQ2xhc3MoJ2pvX2ZpeGVkJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2pvX2ZpeGVkJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLyAgICAgPGRpdiBjbGFzcz1cImpvX2xlZnRwYW5lbGNhcHRpb24gZXhwYW5kZWRcIiBpZD1cIndvcmtzcGFjZVwiIGRhdGEtcGFuZWw9XCJmaWxlbGlzdG91dGVyXCI+XHJcbiAgICAvLyAgICAgPHNwYW4+V09SS1NQQUNFPC9zcGFuPlxyXG4gICAgLy8gICAgIDxkaXYgY2xhc3M9XCJqb19hY3Rpb25zXCI+PGltZyBpZD1cImJ1dHRvbk5ld0ZpbGVcIiB0aXRsZT1cIk5ldWUgRGF0ZWkgaGluenVmw7xnZW5cIlxyXG4gICAgLy8gICAgICAgICAgICAgc3JjPVwiYXNzZXRzL3Byb2plY3RleHBsb3Jlci9hZGQtZmlsZS1kYXJrLnN2Z1wiPjwvZGl2PlxyXG4gICAgLy8gPC9kaXY+XHJcbiAgICAvLyA8ZGl2IGlkPVwiZmlsZWxpc3RvdXRlclwiIGNsYXNzPVwiam9fcHJvamVjdGV4cGxvcmVyZGl2IHNjcm9sbGFibGVcIiBkYXRhLWdyb3c9XCIzXCJcclxuICAgIC8vICAgICBzdHlsZT1cImZsZXgtZ3JvdzogM1wiPlxyXG4gICAgLy8gICAgIDxkaXYgaWQ9XCJmaWxlbGlzdFwiPjwvZGl2PlxyXG4gICAgLy8gPC9kaXY+XHJcblxyXG5cclxuICAgIGVuYWJsZU5ld0J1dHRvbihlbmFibGVkOiBib29sZWFuKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuJGJ1dHRvbk5ldyAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGlmIChlbmFibGVkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLiRidXR0b25OZXcuc2hvdygpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV3LmhpZGUoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRDdXJyZW50bHlTZWxlY3RlZFBhdGgoKTogc3RyaW5nW10ge1xyXG4gICAgICAgIGxldCBwYXRoQXJyYXk6IHN0cmluZ1tdID0gW107XHJcbiAgICAgICAgbGV0IHNlbGVjdGVkRWxlbWVudCA9IHRoaXMuZ2V0U2VsZWN0ZWRFbGVtZW50KCk7XHJcbiAgICAgICAgaWYgKHNlbGVjdGVkRWxlbWVudCAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHBhdGhBcnJheSA9IHNlbGVjdGVkRWxlbWVudC5wYXRoLnNsaWNlKDApO1xyXG4gICAgICAgICAgICBpZiAoc2VsZWN0ZWRFbGVtZW50LmlzRm9sZGVyKSBwYXRoQXJyYXkucHVzaChzZWxlY3RlZEVsZW1lbnQubmFtZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBwYXRoQXJyYXk7XHJcbiAgICB9XHJcblxyXG4gICAgY29tcGFyZVdpdGhQYXRoKG5hbWUxOiBzdHJpbmcsIHBhdGgxOiBzdHJpbmdbXSwgaXNGb2xkZXIxOiBib29sZWFuLCBuYW1lMjogc3RyaW5nLCBwYXRoMjogc3RyaW5nW10sIGlzRm9sZGVyMjogYm9vbGVhbikge1xyXG5cclxuICAgICAgICBwYXRoMSA9IHBhdGgxLnNsaWNlKCk7XHJcbiAgICAgICAgcGF0aDEucHVzaChuYW1lMSk7XHJcbiAgICAgICAgbmFtZTEgPSBcIlwiO1xyXG5cclxuICAgICAgICBwYXRoMiA9IHBhdGgyLnNsaWNlKCk7XHJcbiAgICAgICAgcGF0aDIucHVzaChuYW1lMik7XHJcbiAgICAgICAgbmFtZTIgPSBcIlwiO1xyXG5cclxuICAgICAgICBsZXQgaSA9IDA7XHJcbiAgICAgICAgd2hpbGUgKGkgPCBwYXRoMS5sZW5ndGggJiYgaSA8IHBhdGgyLmxlbmd0aCkge1xyXG4gICAgICAgICAgICBsZXQgY21wID0gcGF0aDFbaV0ubG9jYWxlQ29tcGFyZShwYXRoMltpXSk7XHJcbiAgICAgICAgICAgIGlmIChjbXAgIT0gMCkgcmV0dXJuIGNtcDtcclxuICAgICAgICAgICAgaSsrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHBhdGgxLmxlbmd0aCA8IHBhdGgyLmxlbmd0aCkgcmV0dXJuIC0xO1xyXG4gICAgICAgIGlmIChwYXRoMS5sZW5ndGggPiBwYXRoMi5sZW5ndGgpIHJldHVybiAxO1xyXG5cclxuICAgICAgICByZXR1cm4gbmFtZTEubG9jYWxlQ29tcGFyZShuYW1lMik7XHJcblxyXG5cclxuICAgICAgICAvLyBsZXQgbmFtZVdpdGhQYXRoMSA9IHBhdGgxLmpvaW4oXCIvXCIpO1xyXG4gICAgICAgIC8vIGlmIChuYW1lV2l0aFBhdGgxICE9IFwiXCIgJiYgbmFtZTEgIT0gXCJcIikgbmFtZVdpdGhQYXRoMSArPSBcIi9cIjtcclxuICAgICAgICAvLyBuYW1lV2l0aFBhdGgxICs9IG5hbWUxO1xyXG5cclxuICAgICAgICAvLyBsZXQgbmFtZVdpdGhQYXRoMiA9IHBhdGgyLmpvaW4oXCIvXCIpO1xyXG4gICAgICAgIC8vIGlmIChuYW1lV2l0aFBhdGgyICE9IFwiXCIgJiYgbmFtZTIgIT0gXCJcIikgbmFtZVdpdGhQYXRoMiArPSBcIi9cIjtcclxuICAgICAgICAvLyBuYW1lV2l0aFBhdGgyICs9IG5hbWUyO1xyXG5cclxuICAgICAgICAvLyByZXR1cm4gbmFtZVdpdGhQYXRoMS5sb2NhbGVDb21wYXJlKG5hbWVXaXRoUGF0aDIpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBnZXRFbGVtZW50SW5kZXgobmFtZTogc3RyaW5nLCBwYXRoOiBzdHJpbmdbXSwgaXNGb2xkZXI6IGJvb2xlYW4pOiBudW1iZXIge1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZWxlbWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgbGV0IGVsZW1lbnQgPSB0aGlzLmVsZW1lbnRzW2ldO1xyXG5cclxuICAgICAgICAgICAgaWYgKHRoaXMuY29tcGFyZVdpdGhQYXRoKG5hbWUsIHBhdGgsIGlzRm9sZGVyLCBlbGVtZW50Lm5hbWUsIGVsZW1lbnQucGF0aCwgZWxlbWVudC5pc0ZvbGRlcikgPCAwKSByZXR1cm4gaTtcclxuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzLmxlbmd0aDtcclxuICAgIH1cclxuXHJcbiAgICBpbnNlcnRFbGVtZW50KGFlOiBBY2NvcmRpb25FbGVtZW50KSB7XHJcbiAgICAgICAgbGV0IGluc2VydEluZGV4ID0gdGhpcy5nZXRFbGVtZW50SW5kZXgoYWUubmFtZSwgYWUucGF0aCwgYWUuaXNGb2xkZXIpO1xyXG4gICAgICAgIC8vIGlmIChhZS5wYXRoLmxlbmd0aCA9PSAwKSBpbnNlcnRJbmRleCA9IHRoaXMuZWxlbWVudHMubGVuZ3RoO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudHMuc3BsaWNlKGluc2VydEluZGV4LCAwLCBhZSk7XHJcblxyXG4gICAgICAgIGxldCAkZWxlbWVudHMgPSB0aGlzLiRsaXN0RWxlbWVudC5maW5kKCcuam9fZmlsZScpO1xyXG5cclxuICAgICAgICBpZiAoaW5zZXJ0SW5kZXggPT0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLiRsaXN0RWxlbWVudC5wcmVwZW5kKGFlLiRodG1sRmlyc3RMaW5lKTtcclxuICAgICAgICB9IGVsc2UgaWYoaW5zZXJ0SW5kZXggPT0gJGVsZW1lbnRzLmxlbmd0aCl7XHJcbiAgICAgICAgICAgIHRoaXMuJGxpc3RFbGVtZW50LmFwcGVuZChhZS4kaHRtbEZpcnN0TGluZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0IGVsZW1lbnRBdEluZGV4ID0gJGVsZW1lbnRzLmdldChpbnNlcnRJbmRleCk7XHJcbiAgICAgICAgICAgIGpRdWVyeShlbGVtZW50QXRJbmRleCkuYmVmb3JlKGFlLiRodG1sRmlyc3RMaW5lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGFkZEZvbGRlcihuYW1lOiBzdHJpbmcsIHBhdGg6IHN0cmluZ1tdLCBjYWxsYmFjazogKG5ld1BhbmVsOiBBY2NvcmRpb25FbGVtZW50KSA9PiB2b2lkKSB7XHJcblxyXG4gICAgICAgIGxldCBhZTogQWNjb3JkaW9uRWxlbWVudCA9IHtcclxuICAgICAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgaXNGb2xkZXI6IHRydWUsXHJcbiAgICAgICAgICAgIHBhdGg6IHBhdGhcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCAkZWxlbWVudCA9IHRoaXMucmVuZGVyRWxlbWVudChhZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIHRoaXMuaW5zZXJ0RWxlbWVudChhZSk7XHJcblxyXG4gICAgICAgICRlbGVtZW50WzBdLnNjcm9sbEludG9WaWV3KCk7XHJcblxyXG4gICAgICAgIHRoaXMucmVuYW1lRWxlbWVudChhZSwgKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgY2FsbGJhY2soYWUpO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuXHJcblxyXG5cclxuXHJcbiAgICByZW5kZXJPdXRlckh0bWxFbGVtZW50cygkYWNjb3JkaW9uRGl2OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudCA9IGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX2xlZnRwYW5lbGNhcHRpb24gam9fZXhwYW5kZWRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9fY2FwdGlvbnRleHRcIj5gICsgdGhpcy5jYXB0aW9uICsgYDwvZGl2PjxkaXYgY2xhc3M9XCJqb19hY3Rpb25zXCI+PC9kaXY+PC9kaXY+YCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm5ld0J1dHRvbkNsYXNzICE9IG51bGwpIHtcclxuICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV3ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fYnV0dG9uIGpvX2FjdGl2ZSAnICsgdGhpcy5uZXdCdXR0b25DbGFzcyArICdcIiB0aXRsZT1cIicgKyB0aGlzLmJ1dHRvbk5ld1RpdGxlICsgJ1wiPicpO1xyXG4gICAgICAgICAgICB0aGlzLiRjYXB0aW9uRWxlbWVudC5maW5kKCcuam9fYWN0aW9ucycpLmFwcGVuZCh0aGlzLiRidXR0b25OZXcpO1xyXG5cclxuICAgICAgICAgICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuICAgICAgICAgICAgdGhpcy4kYnV0dG9uTmV3Lm9uKG1vdXNlUG9pbnRlciArICdkb3duJywgKGV2KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgSGVscGVyLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IHRoYXQuZ2V0Q3VycmVudGx5U2VsZWN0ZWRQYXRoKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFlOiBBY2NvcmRpb25FbGVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiTmV1XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaXNGb2xkZXI6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHBhdGhcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgaW5zZXJ0SW5kZXggPSB0aGlzLmdldEVsZW1lbnRJbmRleChcIlwiLCBwYXRoLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZShpbnNlcnRJbmRleCwgMCwgYWUpO1xyXG4gICAgICAgICAgICAgICAgbGV0ICRlbGVtZW50ID0gdGhpcy5yZW5kZXJFbGVtZW50KGFlLCB0cnVlKTtcclxuXHJcblxyXG4gICAgICAgICAgICAgICAgaWYgKGluc2VydEluZGV4ID09IDApIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLiRsaXN0RWxlbWVudC5wcmVwZW5kKCRlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGVsZW1lbnRBdEluZGV4ID0gdGhpcy4kbGlzdEVsZW1lbnQuZmluZCgnLmpvX2ZpbGUnKS5nZXQoaW5zZXJ0SW5kZXggLSAxKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoZWxlbWVudEF0SW5kZXgpLmFmdGVyKCRlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAkZWxlbWVudFswXS5zY3JvbGxJbnRvVmlldygpO1xyXG5cclxuICAgICAgICAgICAgICAgIHRoYXQucmVuYW1lRWxlbWVudChhZSwgKCkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm5ld0VsZW1lbnRDYWxsYmFjayhhZSwgKGV4dGVybmFsRWxlbWVudDogYW55KSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZS5leHRlcm5hbEVsZW1lbnQgPSBleHRlcm5hbEVsZW1lbnQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWUuJGh0bWxTZWNvbmRMaW5lICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFlLiRodG1sU2Vjb25kTGluZS5pbnNlcnRBZnRlcigkZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHRoYXQuc2VsZWN0KGFlLmV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0ICRsaXN0T3V0ZXIgPSBqUXVlcnkoJzxkaXYgaWQ9XCJmaWxlbGlzdG91dGVyXCIgY2xhc3M9XCJqb19wcm9qZWN0ZXhwbG9yZXJkaXYgam9fc2Nyb2xsYWJsZVwiIGRhdGEtZ3Jvdz1cIidcclxuICAgICAgICAgICAgKyB0aGlzLmZsZXhXZWlnaHQgKyAnXCIgc3R5bGU9XCJmbGV4LWdyb3c6ICcgKyB0aGlzLmZsZXhXZWlnaHQgKyAnXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgdGhpcy4kbGlzdEVsZW1lbnQgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19maWxlbGlzdFwiPjwvZGl2PicpXHJcblxyXG4gICAgICAgICRsaXN0T3V0ZXIuYXBwZW5kKHRoaXMuJGxpc3RFbGVtZW50KTtcclxuXHJcbiAgICAgICAgJGFjY29yZGlvbkRpdi5hcHBlbmQodGhpcy4kY2FwdGlvbkVsZW1lbnQpO1xyXG4gICAgICAgICRhY2NvcmRpb25EaXYuYXBwZW5kKCRsaXN0T3V0ZXIpO1xyXG5cclxuICAgICAgICBsZXQgJGNlID0gdGhpcy4kY2FwdGlvbkVsZW1lbnQ7XHJcbiAgICAgICAgbGV0ICRsaSA9IHRoaXMuJGxpc3RFbGVtZW50LnBhcmVudCgpO1xyXG4gICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcblxyXG4gICAgICAgICRjZS5vbihtb3VzZVBvaW50ZXIgKyAnZG93bicsIChldikgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXYuYnV0dG9uICE9IDApIHtcclxuICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmZpeGVkKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGFyZ2V0R3JvdyA9ICRsaS5kYXRhKCdncm93Jyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoJGNlLmhhc0NsYXNzKCdqb19leHBhbmRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuYWNjb3JkaW9uLnBhcnRzLmxlbmd0aCA+IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgJGxpLmFuaW1hdGUoe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2ZsZXgtZ3Jvdyc6IDAuMDAxXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwMDAsICgpID0+IHsgJGNlLnRvZ2dsZUNsYXNzKCdqb19leHBhbmRlZCcpOyB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICRjZS50b2dnbGVDbGFzcygnam9fZXhwYW5kZWQnKTtcclxuICAgICAgICAgICAgICAgICAgICAkbGkuYW5pbWF0ZSh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICdmbGV4LWdyb3cnOiB0YXJnZXRHcm93XHJcbiAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJGNlLm9uKCdkcmFnb3ZlcicsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoQWNjb3JkaW9uUGFuZWwuY3VycmVudGx5RHJhZ2dlZEVsZW1lbnRLaW5kID09IHRoYXQua2luZCkge1xyXG4gICAgICAgICAgICAgICAgJGNlLmFkZENsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgJGNlLm9uKCdkcmFnbGVhdmUnLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgJGNlLnJlbW92ZUNsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcbiAgICAgICAgfSlcclxuXHJcbiAgICAgICAgJGNlLm9uKCdkcm9wJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChBY2NvcmRpb25QYW5lbC5jdXJyZW50bHlEcmFnZ2VkRWxlbWVudEtpbmQgPT0gdGhhdC5raW5kKSB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgJGNlLnJlbW92ZUNsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcbiAgICAgICAgICAgICAgICBsZXQgZWxlbWVudDEgPSBBY2NvcmRpb25QYW5lbC5jdXJyZW50bHlEcmFnZ2VkRWxlbWVudDtcclxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50MSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tb3ZlRWxlbWVudChlbGVtZW50MSwgbnVsbCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBncm93KCkge1xyXG4gICAgICAgIGxldCAkbGkgPSB0aGlzLiRsaXN0RWxlbWVudC5wYXJlbnQoKTtcclxuICAgICAgICBsZXQgdGFyZ2V0R3JvdyA9ICRsaS5kYXRhKCdncm93Jyk7XHJcbiAgICAgICAgJGxpLmNzcygnZmxleC1ncm93JywgdGFyZ2V0R3Jvdyk7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuYWRkQ2xhc3MoJ2pvX2V4cGFuZGVkJyk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkRWxlbWVudChlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50LCBleHBhbmRlZDogYm9vbGVhbikge1xyXG4gICAgICAgIC8vIHRoaXMuZWxlbWVudHMucHVzaChlbGVtZW50KTtcclxuICAgICAgICAvLyBlbGVtZW50LiRodG1sRmlyc3RMaW5lID0gdGhpcy5yZW5kZXJFbGVtZW50KGVsZW1lbnQsIGV4cGFuZGVkKTtcclxuICAgICAgICAvLyB0aGlzLiRsaXN0RWxlbWVudC5wcmVwZW5kKGVsZW1lbnQuJGh0bWxGaXJzdExpbmUpO1xyXG4gICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUgPSB0aGlzLnJlbmRlckVsZW1lbnQoZWxlbWVudCwgZXhwYW5kZWQpO1xyXG4gICAgICAgIHRoaXMuaW5zZXJ0RWxlbWVudChlbGVtZW50KTtcclxuICAgIH1cclxuXHJcbiAgICBzb3J0RWxlbWVudHMoKSB7XHJcbiAgICAgICAgaWYgKHRoaXMuZG9udFNvcnRFbGVtZW50cykgcmV0dXJuO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudHMuc29ydCgoYSwgYikgPT4ge1xyXG4gICAgICAgICAgICBsZXQgYU5hbWUgPSBhLnNvcnROYW1lID8gYS5zb3J0TmFtZSA6IGEubmFtZTtcclxuICAgICAgICAgICAgbGV0IGJOYW1lID0gYi5zb3J0TmFtZSA/IGIuc29ydE5hbWUgOiBiLm5hbWU7XHJcblxyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb21wYXJlV2l0aFBhdGgoYU5hbWUsIGEucGF0aCwgYS5pc0ZvbGRlciwgYk5hbWUsIGIucGF0aCwgYi5pc0ZvbGRlcik7XHJcblxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHRoaXMuZWxlbWVudHMuZm9yRWFjaCgoZWxlbWVudCkgPT4geyB0aGlzLiRsaXN0RWxlbWVudC5hcHBlbmQoZWxlbWVudC4kaHRtbEZpcnN0TGluZSkgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0VGV4dEFmdGVyRmlsZW5hbWUoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCwgdGV4dDogc3RyaW5nLCBjc3NDbGFzczogc3RyaW5nKSB7XHJcbiAgICAgICAgbGV0ICRkaXYgPSBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmZpbmQoJy5qb190ZXh0QWZ0ZXJOYW1lJyk7XHJcbiAgICAgICAgJGRpdi5hZGRDbGFzcyhjc3NDbGFzcyk7XHJcbiAgICAgICAgJGRpdi5odG1sKHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIGFkZEFjdGlvbigkZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG4gICAgICAgIHRoaXMuJGNhcHRpb25FbGVtZW50LmZpbmQoJy5qb19hY3Rpb25zJykucHJlcGVuZCgkZWxlbWVudCk7XHJcbiAgICB9XHJcblxyXG4gICAgcmVuZGVyRWxlbWVudChlbGVtZW50OiBBY2NvcmRpb25FbGVtZW50LCBleHBhbmRlZDogYm9vbGVhbik6IEpRdWVyeTxIVE1MRWxlbWVudD4ge1xyXG5cclxuICAgICAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuXHJcbiAgICAgICAgbGV0IGV4cGFuZGVkQ29sbGFwc2VkID0gXCJcIjtcclxuXHJcbiAgICAgICAgaWYgKGVsZW1lbnQuaWNvbkNsYXNzID09IG51bGwpIGVsZW1lbnQuaWNvbkNsYXNzID0gdGhpcy5kZWZhdWx0SWNvbkNsYXNzO1xyXG4gICAgICAgIGlmIChlbGVtZW50LmlzRm9sZGVyKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuaWNvbkNsYXNzID0gXCJmb2xkZXJcIjtcclxuICAgICAgICAgICAgZXhwYW5kZWRDb2xsYXBzZWQgPSBleHBhbmRlZCA/IFwiIGpvX2V4cGFuZGVkXCIgOiBcIiBqb19jb2xsYXBzZWRcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBwYXRoSHRtbCA9IFwiXCI7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQucGF0aCA9PSBudWxsKSBlbGVtZW50LnBhdGggPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVsZW1lbnQucGF0aC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBwYXRoSHRtbCArPSAnPGRpdiBjbGFzcz1cImpvX2ZvbGRlcmxpbmVcIj48L2Rpdj4nO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZSA9IGpRdWVyeShgPGRpdiBjbGFzcz1cImpvX2ZpbGUgam9fJHtlbGVtZW50Lmljb25DbGFzc30gJHtleHBhbmRlZENvbGxhcHNlZH1cIj5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiam9fZm9sZGVybGluZXNcIj4ke3BhdGhIdG1sfTwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19maWxlaW1hZ2VcIj48L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fZmlsZW5hbWVcIj4ke2VzY2FwZUh0bWwoZWxlbWVudC5uYW1lKX08L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fdGV4dEFmdGVyTmFtZVwiPjwvZGl2PlxyXG4gICAgICAgICAgIDxkaXYgY2xhc3M9XCJqb19hZGRpdGlvbmFsQnV0dG9uSG9tZXdvcmtcIj48L2Rpdj5cclxuICAgICAgICAgICA8ZGl2IGNsYXNzPVwiam9fYWRkaXRpb25hbEJ1dHRvblN0YXJ0XCI+PC9kaXY+XHJcbiAgICAgICAgICAgPGRpdiBjbGFzcz1cImpvX2FkZGl0aW9uYWxCdXR0b25SZXBvc2l0b3J5XCI+PC9kaXY+XHJcbiAgICAgICAgICAgJHt0aGlzLndpdGhEZWxldGVCdXR0b24gPyAnPGRpdiBjbGFzcz1cImpvX2RlbGV0ZSBpbWdfZGVsZXRlIGpvX2J1dHRvbiBqb19hY3RpdmUnICsgKGZhbHNlID8gXCIgam9fZGVsZXRlX2Fsd2F5c1wiIDogXCJcIikgKyAnXCI+PC9kaXY+JyA6IFwiXCJ9XHJcbiAgICAgICAgICAgJHsham9fbW91c2VEZXRlY3RlZCA/ICc8ZGl2IGNsYXNzPVwiam9fc2V0dGluZ3NfYnV0dG9uIGltZ19lbGxpcHNpcy1kYXJrIGpvX2J1dHRvbiBqb19hY3RpdmVcIj48L2Rpdj4nIDogXCJcIn1cclxuICAgICAgICAgICA8L2Rpdj5gKTtcclxuXHJcbiAgICAgICAgaWYgKCFleHBhbmRlZCAmJiBlbGVtZW50LnBhdGgubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmhpZGUoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmFkZEVsZW1lbnRBY3Rpb25DYWxsYmFjayAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIGxldCAkZWxlbWVudEFjdGlvbiA9IHRoaXMuYWRkRWxlbWVudEFjdGlvbkNhbGxiYWNrKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmFwcGVuZCgkZWxlbWVudEFjdGlvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy53aXRoRm9sZGVycykge1xyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5pc0ZvbGRlcikge1xyXG4gICAgICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5vbignZHJhZ292ZXInLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQWNjb3JkaW9uUGFuZWwuY3VycmVudGx5RHJhZ2dlZEVsZW1lbnRLaW5kID09IHRoYXQua2luZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmFkZENsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLm9uKCdkcmFnbGVhdmUnLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLnJlbW92ZUNsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG5cclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUub24oJ2Ryb3AnLCAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoQWNjb3JkaW9uUGFuZWwuY3VycmVudGx5RHJhZ2dlZEVsZW1lbnRLaW5kID09IHRoYXQua2luZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLnJlbW92ZUNsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtZW50MSA9IEFjY29yZGlvblBhbmVsLmN1cnJlbnRseURyYWdnZWRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBY2NvcmRpb25QYW5lbC5jdXJyZW50bHlEcmFnZ2VkRWxlbWVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50MSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1vdmVFbGVtZW50KGVsZW1lbnQxLCBlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy53aXRoRm9sZGVycyB8fCB0aGlzLmVuYWJsZURyYWcpIHtcclxuICAgICAgICAgICAgbGV0ICRmaWxlZHJhZ3BhcnQgPSBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmZpbmQoJy5qb19maWxlbmFtZScpO1xyXG4gICAgICAgICAgICAkZmlsZWRyYWdwYXJ0LmF0dHIoJ2RyYWdnYWJsZScsICd0cnVlJyk7XHJcbiAgICAgICAgICAgICRmaWxlZHJhZ3BhcnQub24oJ2RyYWdzdGFydCcsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgQWNjb3JkaW9uUGFuZWwuY3VycmVudGx5RHJhZ2dlZEVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgQWNjb3JkaW9uUGFuZWwuY3VycmVudGx5RHJhZ2dlZEVsZW1lbnRLaW5kID0gdGhhdC5raW5kO1xyXG4gICAgICAgICAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZWZmZWN0QWxsb3dlZCA9IGVsZW1lbnQuaXNGb2xkZXIgPyBcIm1vdmVcIiA6IFwiY29weU1vdmVcIjtcclxuICAgICAgICAgICAgfSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLmFjY2VwdERyb3BLaW5kcyAhPSBudWxsICYmIHRoaXMuYWNjZXB0RHJvcEtpbmRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgaWYgKCFlbGVtZW50LmlzRm9sZGVyKSB7XHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLm9uKCdkcmFnb3ZlcicsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0aGlzLmFjY2VwdERyb3BLaW5kcy5pbmRleE9mKEFjY29yZGlvblBhbmVsLmN1cnJlbnRseURyYWdnZWRFbGVtZW50S2luZCkgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLmFkZENsYXNzKCdqb19maWxlX2RyYWdvdmVyJyk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXZlbnQuY3RybEtleSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwiY29weVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXZlbnQub3JpZ2luYWxFdmVudC5kYXRhVHJhbnNmZXIuZHJvcEVmZmVjdCA9IFwibW92ZVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5vbignZHJhZ2xlYXZlJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5yZW1vdmVDbGFzcygnam9fZmlsZV9kcmFnb3ZlcicpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLm9uKCdkcm9wJywgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuYWNjZXB0RHJvcEtpbmRzLmluZGV4T2YoQWNjb3JkaW9uUGFuZWwuY3VycmVudGx5RHJhZ2dlZEVsZW1lbnRLaW5kKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2ZpbGVfZHJhZ292ZXInKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlbGVtZW50MSA9IEFjY29yZGlvblBhbmVsLmN1cnJlbnRseURyYWdnZWRFbGVtZW50O1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBBY2NvcmRpb25QYW5lbC5jdXJyZW50bHlEcmFnZ2VkRWxlbWVudCA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50MSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5kcm9wRWxlbWVudENhbGxiYWNrICE9IG51bGwpIHRoYXQuZHJvcEVsZW1lbnRDYWxsYmFjayhlbGVtZW50LCBlbGVtZW50MSwgZXZlbnQuY3RybEtleSA/IFwiY29weVwiIDogXCJtb3ZlXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLm9uKG1vdXNlUG9pbnRlciArICd1cCcsIChldikgPT4ge1xyXG5cclxuICAgICAgICAgICAgaWYgKGV2LmJ1dHRvbiA9PSAwICYmIHRoYXQuc2VsZWN0Q2FsbGJhY2sgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgdGhhdC5zZWxlY3RDYWxsYmFjayhlbGVtZW50LmV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhhdC5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChhZSAhPSBlbGVtZW50ICYmIGFlLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZS4kaHRtbEZpcnN0TGluZS5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYWRkQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LmlzRm9sZGVyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19leHBhbmRlZCcpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2V4cGFuZGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYWRkQ2xhc3MoJ2pvX2NvbGxhcHNlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuYWRkQ2xhc3MoJ2pvX2V4cGFuZGVkJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoJ2pvX2NvbGxhcHNlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHBhdGhJc0NvbGxhcHNlZDogeyBbcGF0aDogc3RyaW5nXTogYm9vbGVhbiB9ID0ge307XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZSBvZiB0aGlzLmVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlLmlzRm9sZGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aCA9IGUucGF0aC5qb2luKFwiL1wiKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwYXRoICE9IFwiXCIpIHBhdGggKz0gXCIvXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoICs9IGUubmFtZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGhJc0NvbGxhcHNlZFtwYXRoXSA9IGUuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2NvbGxhcHNlZCcpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhJc0NvbGxhcHNlZFtlLnBhdGguam9pbihcIi9cIildKSBwYXRoSXNDb2xsYXBzZWRbcGF0aF0gPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGhJc0NvbGxhcHNlZFtcIlwiXSA9IGZhbHNlO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGxldCBlIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhJc0NvbGxhcHNlZFtlLnBhdGguam9pbihcIi9cIildKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLiRodG1sRmlyc3RMaW5lLnNsaWRlVXAoMjAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGUuJGh0bWxGaXJzdExpbmUuc2xpZGVEb3duKDIwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgbGV0IGNvbnRleHRtZW51SGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG5cclxuICAgICAgICAgICAgbGV0IGNvbnRleHRNZW51SXRlbXM6IENvbnRleHRNZW51SXRlbVtdID0gW107XHJcbiAgICAgICAgICAgIGlmICh0aGF0LnJlbmFtZUNhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHRNZW51SXRlbXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJVbWJlbmVubmVuXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5yZW5hbWVFbGVtZW50KGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxldCBtb3VzZVBvaW50ZXIgPSB3aW5kb3cuUG9pbnRlckV2ZW50ID8gXCJwb2ludGVyXCIgOiBcIm1vdXNlXCI7XHJcblxyXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5pc0ZvbGRlcikge1xyXG4gICAgICAgICAgICAgICAgY29udGV4dE1lbnVJdGVtcyA9IGNvbnRleHRNZW51SXRlbXMuY29uY2F0KFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiTmV1ZW4gVW50ZXJvcmRuZXIgYW5sZWdlbiAodW50ZXJoYWxiICdcIiArIGVsZW1lbnQubmFtZSArIFwiJykuLi5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0KGVsZW1lbnQuZXh0ZXJuYWxFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoYXQuJG5ld0ZvbGRlckFjdGlvbi50cmlnZ2VyKG1vdXNlUG9pbnRlciArICdkb3duJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aEFycmF5ID0gdGhhdC5nZXRDdXJyZW50bHlTZWxlY3RlZFBhdGgoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmFkZEZvbGRlcihcIk5ldWVyIE9yZG5lclwiLCBwYXRoQXJyYXksIChuZXdFbGVtZW50OiBBY2NvcmRpb25FbGVtZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5uZXdGb2xkZXJDYWxsYmFjayhuZXdFbGVtZW50LCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc29ydEVsZW1lbnRzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0VsZW1lbnQuJGh0bWxGaXJzdExpbmVbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5pbWF0ZVRvVHJhbnNwYXJlbnQobmV3RWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fZmlsZW5hbWUnKSwgJ2JhY2tncm91bmQtY29sb3InLCBbMCwgMjU1LCAwXSwgMjAwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiTmV1ZXIgV29ya3NwYWNlLi4uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdChlbGVtZW50LmV4dGVybmFsRWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LiRidXR0b25OZXcudHJpZ2dlcihtb3VzZVBvaW50ZXIgKyAnZG93bicpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIldvcmtzcGFjZSBpbXBvcnRpZXJlbi4uLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFdvcmtzcGFjZUltcG9ydGVyKDxNYWluPnRoYXQuYWNjb3JkaW9uLm1haW4sIGVsZW1lbnQucGF0aC5jb25jYXQoW2VsZW1lbnQubmFtZV0pKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdKVxyXG4gICAgICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICAgICAgaWYgKHRoYXQuY29udGV4dE1lbnVQcm92aWRlciAhPSBudWxsICYmICFlbGVtZW50LmlzRm9sZGVyKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgY21pIG9mIHRoYXQuY29udGV4dE1lbnVQcm92aWRlcihlbGVtZW50KSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHRNZW51SXRlbXMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhcHRpb246IGNtaS5jYXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY21pLmNhbGxiYWNrKGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xvcjogY21pLmNvbG9yLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJNZW51OiBjbWkuc3ViTWVudSA9PSBudWxsID8gbnVsbCA6IGNtaS5zdWJNZW51Lm1hcCgobWkpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogbWkuY2FwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtaS5jYWxsYmFjayhlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbG9yOiBtaS5jb2xvclxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmIChjb250ZXh0TWVudUl0ZW1zLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIG9wZW5Db250ZXh0TWVudShjb250ZXh0TWVudUl0ZW1zLCBldmVudC5wYWdlWCwgZXZlbnQucGFnZVkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZVswXS5hZGRFdmVudExpc3RlbmVyKFwiY29udGV4dG1lbnVcIiwgY29udGV4dG1lbnVIYW5kbGVyLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIC8vIGxvbmcgcHJlc3MgZm9yIHRvdWNoIGRldmljZXNcclxuICAgICAgICBsZXQgcHJlc3NUaW1lcjogbnVtYmVyO1xyXG4gICAgICAgIGlmICgham9fbW91c2VEZXRlY3RlZCkge1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lLm9uKCdwb2ludGVydXAnLCAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQocHJlc3NUaW1lcik7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgIH0pLm9uKCdwb2ludGVyZG93bicsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcHJlc3NUaW1lciA9IHdpbmRvdy5zZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICBjb250ZXh0bWVudUhhbmRsZXIoZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIWpvX21vdXNlRGV0ZWN0ZWQpIHtcclxuICAgICAgICAgICAgZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fc2V0dGluZ3NfYnV0dG9uJykub24oJ3BvaW50ZXJkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnRleHRtZW51SGFuZGxlcihlKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX3NldHRpbmdzX2J1dHRvbicpLm9uKCdtb3VzZWRvd24gY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhhdC53aXRoRGVsZXRlQnV0dG9uKSB7XHJcbiAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUuZmluZCgnLmpvX2RlbGV0ZScpLm9uKG1vdXNlUG9pbnRlciArICdkb3duJywgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBldi5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICAgICAgb3BlbkNvbnRleHRNZW51KFt7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJBYmJyZWNoZW5cIixcclxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBub3RoaW5nIHRvIGRvLlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkljaCBiaW4gbWlyIHNpY2hlcjogbMO2c2NoZW4hXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY29sb3I6IFwiI2ZmNjA2MFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiAoKSA9PiB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC5pc0ZvbGRlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuZ2V0Q2hpbGRFbGVtZW50cyhlbGVtZW50KS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWxlcnQoJ0RpZXNlciBPcmRuZXIga2FubiBuaWNodCBnZWzDtnNjaHQgd2VyZGVuLCBkYSBlciBuaWNodCBsZWVyIGlzdC4nKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuZGVsZXRlQ2FsbGJhY2soZWxlbWVudC5leHRlcm5hbEVsZW1lbnQsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQuJGh0bWxGaXJzdExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWxlbWVudC4kaHRtbFNlY29uZExpbmUgIT0gbnVsbCkgZWxlbWVudC4kaHRtbFNlY29uZExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmVsZW1lbnRzLnNwbGljZSh0aGF0LmVsZW1lbnRzLmluZGV4T2YoZWxlbWVudCksIDEpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0aGF0LnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGhhdC5lbGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc2VsZWN0KHRoYXQuZWxlbWVudHNbMF0uZXh0ZXJuYWxFbGVtZW50KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnNlbGVjdChudWxsKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1dLCBldi5wYWdlWCArIDIsIGV2LnBhZ2VZICsgMik7XHJcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlbWVudC4kaHRtbEZpcnN0TGluZTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgbW92ZUVsZW1lbnQoZWxlbWVudFRvTW92ZTogQWNjb3JkaW9uRWxlbWVudCwgZGVzdGluYXRpb25Gb2xkZXI6IEFjY29yZGlvbkVsZW1lbnQpIHtcclxuICAgICAgICBsZXQgZGVzdGluYXRpb25QYXRoOiBzdHJpbmdbXSA9IGRlc3RpbmF0aW9uRm9sZGVyID09IG51bGwgPyBbXSA6IGRlc3RpbmF0aW9uRm9sZGVyLnBhdGguc2xpY2UoMCkuY29uY2F0KFtkZXN0aW5hdGlvbkZvbGRlci5uYW1lXSk7XHJcbiAgICAgICAgaWYgKGVsZW1lbnRUb01vdmUuaXNGb2xkZXIpIHtcclxuICAgICAgICAgICAgbGV0IG1vdmVkRWxlbWVudHM6IEFjY29yZGlvbkVsZW1lbnRbXSA9IFtlbGVtZW50VG9Nb3ZlXTtcclxuXHJcbiAgICAgICAgICAgIGxldCBzb3VyY2VQYXRoID0gZWxlbWVudFRvTW92ZS5wYXRoLmNvbmNhdChbZWxlbWVudFRvTW92ZS5uYW1lXSkuam9pbihcIi9cIik7XHJcblxyXG4gICAgICAgICAgICBpZihkZXN0aW5hdGlvblBhdGguam9pbignLycpLmluZGV4T2Yoc291cmNlUGF0aCkgPT0gMCkgcmV0dXJuO1xyXG5cclxuICAgICAgICAgICAgbGV0IG9sZFBhdGhMZW5ndGggPSBlbGVtZW50VG9Nb3ZlLnBhdGgubGVuZ3RoO1xyXG4gICAgICAgICAgICBlbGVtZW50VG9Nb3ZlLnBhdGggPSBkZXN0aW5hdGlvblBhdGguc2xpY2UoMCk7XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBlbGVtZW50IG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgIGlmIChlbGVtZW50LnBhdGguam9pbihcIi9cIikuc3RhcnRzV2l0aChzb3VyY2VQYXRoKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucGF0aC5zcGxpY2UoMCwgb2xkUGF0aExlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5wYXRoID0gZGVzdGluYXRpb25QYXRoLmNvbmNhdChlbGVtZW50LnBhdGgpO1xyXG4gICAgICAgICAgICAgICAgICAgIG1vdmVkRWxlbWVudHMucHVzaChlbGVtZW50KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZm9yIChsZXQgZWwgb2YgbW92ZWRFbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgZWwuJGh0bWxGaXJzdExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZSh0aGlzLmVsZW1lbnRzLmluZGV4T2YoZWwpLCAxKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCBlbCBvZiBtb3ZlZEVsZW1lbnRzKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlckVsZW1lbnQoZWwsIHRydWUpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5pbnNlcnRFbGVtZW50KGVsKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5tb3ZlQ2FsbGJhY2sobW92ZWRFbGVtZW50cyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZWxlbWVudFRvTW92ZS5wYXRoID0gZGVzdGluYXRpb25QYXRoO1xyXG4gICAgICAgICAgICBlbGVtZW50VG9Nb3ZlLiRodG1sRmlyc3RMaW5lLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZSh0aGlzLmVsZW1lbnRzLmluZGV4T2YoZWxlbWVudFRvTW92ZSksIDEpO1xyXG4gICAgICAgICAgICB0aGlzLnJlbmRlckVsZW1lbnQoZWxlbWVudFRvTW92ZSwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaW5zZXJ0RWxlbWVudChlbGVtZW50VG9Nb3ZlKTtcclxuICAgICAgICAgICAgdGhpcy5zZWxlY3QoZWxlbWVudFRvTW92ZS5leHRlcm5hbEVsZW1lbnQpO1xyXG4gICAgICAgICAgICBlbGVtZW50VG9Nb3ZlLiRodG1sRmlyc3RMaW5lWzBdLnNjcm9sbEludG9WaWV3KCk7XHJcbiAgICAgICAgICAgIHRoaXMubW92ZUNhbGxiYWNrKGVsZW1lbnRUb01vdmUpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBnZXRDaGlsZEVsZW1lbnRzKGZvbGRlcjogQWNjb3JkaW9uRWxlbWVudCk6IEFjY29yZGlvbkVsZW1lbnRbXSB7XHJcbiAgICAgICAgbGV0IHBhdGggPSBmb2xkZXIucGF0aC5zbGljZSgwKS5jb25jYXQoZm9sZGVyLm5hbWUpLmpvaW4oXCIvXCIpO1xyXG4gICAgICAgIHJldHVybiB0aGlzLmVsZW1lbnRzLmZpbHRlcigoZWxlbWVudCkgPT4gZWxlbWVudC5wYXRoLmpvaW4oXCIvXCIpLnN0YXJ0c1dpdGgocGF0aCkpO1xyXG4gICAgfVxyXG5cclxuICAgIHJlbmFtZUVsZW1lbnQoZWxlbWVudDogQWNjb3JkaW9uRWxlbWVudCwgY2FsbGJhY2s/OiAoKSA9PiB2b2lkKSB7XHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGxldCAkZGl2ID0gZWxlbWVudC4kaHRtbEZpcnN0TGluZS5maW5kKCcuam9fZmlsZW5hbWUnKTtcclxuICAgICAgICBsZXQgcG9pbnRQb3MgPSBlbGVtZW50Lm5hbWUuaW5kZXhPZignLicpO1xyXG4gICAgICAgIGxldCBzZWxlY3Rpb24gPSBwb2ludFBvcyA9PSBudWxsID8gbnVsbCA6IHsgc3RhcnQ6IDAsIGVuZDogcG9pbnRQb3MgfTtcclxuICAgICAgICB0aGlzLmRvbnRTb3J0RWxlbWVudHMgPSB0cnVlO1xyXG4gICAgICAgIG1ha2VFZGl0YWJsZSgkZGl2LCAkZGl2LCAobmV3VGV4dDogc3RyaW5nKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlbGVtZW50LmV4dGVybmFsRWxlbWVudCAhPSBudWxsKSBuZXdUZXh0ID0gdGhhdC5yZW5hbWVDYWxsYmFjayhlbGVtZW50LmV4dGVybmFsRWxlbWVudCwgbmV3VGV4dCk7XHJcbiAgICAgICAgICAgIGVsZW1lbnQubmFtZSA9IG5ld1RleHQ7XHJcbiAgICAgICAgICAgICRkaXYuaHRtbChlbGVtZW50Lm5hbWUpO1xyXG4gICAgICAgICAgICBpZiAoY2FsbGJhY2sgIT0gbnVsbCkgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgdGhhdC5zb3J0RWxlbWVudHMoKTtcclxuICAgICAgICAgICAgJGRpdlswXS5zY3JvbGxJbnRvVmlldygpO1xyXG4gICAgICAgICAgICB0aGlzLmRvbnRTb3J0RWxlbWVudHMgPSBmYWxzZTtcclxuICAgICAgICB9LCBzZWxlY3Rpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIHNlbGVjdChleHRlcm5hbEVsZW1lbnQ6IGFueSwgaW52b2tlQ2FsbGJhY2s6IGJvb2xlYW4gPSB0cnVlLCBzY3JvbGxJbnRvVmlldzogYm9vbGVhbiA9IGZhbHNlKSB7XHJcblxyXG4gICAgICAgIGlmIChleHRlcm5hbEVsZW1lbnQgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBhZTEgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgaWYgKGFlMS4kaHRtbEZpcnN0TGluZS5oYXNDbGFzcygnam9fYWN0aXZlJykpIGFlMS4kaHRtbEZpcnN0TGluZS5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBsZXQgYWUgPSB0aGlzLmZpbmRFbGVtZW50KGV4dGVybmFsRWxlbWVudCk7XHJcblxyXG4gICAgICAgICAgICBpZiAoYWUgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgZm9yIChsZXQgYWUxIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoYWUxLiRodG1sRmlyc3RMaW5lLmhhc0NsYXNzKCdqb19hY3RpdmUnKSkgYWUxLiRodG1sRmlyc3RMaW5lLnJlbW92ZUNsYXNzKCdqb19hY3RpdmUnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBhZS4kaHRtbEZpcnN0TGluZS5hZGRDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgICAgICBpZiAoc2Nyb2xsSW50b1ZpZXcpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgcGF0aFN0cmluZyA9IGFlLnBhdGguam9pbihcIi9cIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgZWwgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsZXQgZWxQYXRoID0gZWwucGF0aC5zbGljZSgwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGhTdHJpbmcuc3RhcnRzV2l0aChlbFBhdGguam9pbihcIi9cIikpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuaXNGb2xkZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbFBhdGgucHVzaChlbC5uYW1lKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aFN0cmluZy5zdGFydHNXaXRoKGVsUGF0aC5qb2luKFwiL1wiKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuJGh0bWxGaXJzdExpbmUucmVtb3ZlQ2xhc3MoXCJqb19jb2xsYXBzZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsLiRodG1sRmlyc3RMaW5lLmFkZENsYXNzKFwiam9fZXhwYW5kZWRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWwuJGh0bWxGaXJzdExpbmUuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgYWUuJGh0bWxGaXJzdExpbmVbMF0uc2Nyb2xsSW50b1ZpZXcoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChpbnZva2VDYWxsYmFjayAmJiB0aGlzLnNlbGVjdENhbGxiYWNrICE9IG51bGwpIHRoaXMuc2VsZWN0Q2FsbGJhY2soZXh0ZXJuYWxFbGVtZW50KTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgZ2V0UGF0aFN0cmluZyhhZTogQWNjb3JkaW9uRWxlbWVudCkge1xyXG4gICAgICAgIGxldCBwczogc3RyaW5nID0gYWUucGF0aC5qb2luKFwiL1wiKTtcclxuICAgICAgICBpZiAoYWUuaXNGb2xkZXIpIHtcclxuICAgICAgICAgICAgaWYgKHBzICE9IFwiXCIpIHBzICs9IFwiL1wiO1xyXG4gICAgICAgICAgICBwcyArPSBhZS5uYW1lO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcHM7XHJcbiAgICB9XHJcblxyXG4gICAgc2V0RWxlbWVudENsYXNzKGVsZW1lbnQ6IEFjY29yZGlvbkVsZW1lbnQsIGljb25DbGFzczogc3RyaW5nKSB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBlbGVtZW50LiRodG1sRmlyc3RMaW5lPy5yZW1vdmVDbGFzcyhcImpvX1wiICsgZWxlbWVudC5pY29uQ2xhc3MpLmFkZENsYXNzKFwiam9fXCIgKyBpY29uQ2xhc3MpO1xyXG4gICAgICAgICAgICBlbGVtZW50Lmljb25DbGFzcyA9IGljb25DbGFzcztcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGZpbmRFbGVtZW50KGV4dGVybmFsRWxlbWVudDogYW55KTogQWNjb3JkaW9uRWxlbWVudCB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuZXh0ZXJuYWxFbGVtZW50ID09IGV4dGVybmFsRWxlbWVudCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcmVtb3ZlRWxlbWVudChleHRlcm5hbEVsZW1lbnQ6IGFueSkge1xyXG4gICAgICAgIGZvciAobGV0IGFlIG9mIHRoaXMuZWxlbWVudHMpIHtcclxuICAgICAgICAgICAgaWYgKGFlLmV4dGVybmFsRWxlbWVudCA9PSBleHRlcm5hbEVsZW1lbnQpIHtcclxuICAgICAgICAgICAgICAgIGFlLiRodG1sRmlyc3RMaW5lLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGFlLiRodG1sU2Vjb25kTGluZSAhPSBudWxsKSBhZS4kaHRtbFNlY29uZExpbmUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVsZW1lbnRzLnNwbGljZSh0aGlzLmVsZW1lbnRzLmluZGV4T2YoYWUpLCAxKTtcclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5zZWxlY3RDYWxsYmFjayAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMuZWxlbWVudHMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlbGVjdCh0aGlzLmVsZW1lbnRzWzBdLmV4dGVybmFsRWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZWxlY3QobnVsbCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNsZWFyKCkge1xyXG4gICAgICAgIHRoaXMuJGxpc3RFbGVtZW50LmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy5lbGVtZW50cyA9IFtdO1xyXG4gICAgfVxyXG5cclxuICAgIHNldENhcHRpb24odGV4dDogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy4kY2FwdGlvbkVsZW1lbnQuZmluZCgnLmpvX2NhcHRpb250ZXh0JykuaHRtbCh0ZXh0KTtcclxuICAgIH1cclxuXHJcbiAgICBnZXRTZWxlY3RlZEVsZW1lbnQoKTogQWNjb3JkaW9uRWxlbWVudCB7XHJcbiAgICAgICAgZm9yIChsZXQgYWUgb2YgdGhpcy5lbGVtZW50cykge1xyXG4gICAgICAgICAgICBpZiAoYWUuJGh0bWxGaXJzdExpbmUuaGFzQ2xhc3MoJ2pvX2FjdGl2ZScpKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIEFjY29yZGlvbiB7XHJcblxyXG4gICAgcGFydHM6IEFjY29yZGlvblBhbmVsW10gPSBbXTtcclxuICAgICRodG1sOiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBtYWluOiBNYWluQmFzZSwgJGh0bWw6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuICAgICAgICB0aGlzLiRodG1sID0gJGh0bWw7XHJcbiAgICAgICAgJGh0bWwuYWRkQ2xhc3MoJ2pvX2xlZnRwYW5lbGlubmVyJyk7XHJcbiAgICB9XHJcblxyXG4gICAgYWRkUGFuZWwocGFuZWw6IEFjY29yZGlvblBhbmVsKSB7XHJcbiAgICAgICAgcGFuZWwucmVuZGVyT3V0ZXJIdG1sRWxlbWVudHModGhpcy4kaHRtbCk7XHJcbiAgICAgICAgdGhpcy5wYXJ0cy5wdXNoKHBhbmVsKTtcclxuICAgIH1cclxuXHJcblxyXG5cclxufSJdfQ==