import { escapeHtml } from "./StringTools.js";
export function makeEditable(elementWithText, elementToReplace, renameDoneCallback, selectionRange = null) {
    let mousePointer = window.PointerEvent ? "pointer" : "mouse";
    if (elementToReplace == null) {
        elementToReplace = elementWithText;
    }
    let $input = jQuery('<input type="text" class="jo_inplaceeditor" spellcheck="false">');
    $input.css({
        width: elementToReplace.css('width'),
        height: elementToReplace.css('height'),
        color: elementToReplace.css('color'),
        position: elementToReplace.css('position'),
        "background-color": elementToReplace.css('background-color'),
        "font-size": elementToReplace.css('font-size'),
        "font-weight": elementToReplace.css('font-weight'),
        "box-sizing": "border-box"
    });
    $input.val(elementWithText.text());
    $input.on(mousePointer + "down", (e) => { e.stopPropagation(); });
    if (selectionRange != null) {
        $input[0].setSelectionRange(selectionRange.start, selectionRange.end);
    }
    elementToReplace.after($input);
    elementToReplace.hide();
    setTimeout(() => {
        $input.focus();
    }, 300);
    $input.on("keydown.me", (ev) => {
        if (ev.key == "Enter" || ev.key == "Escape") {
            $input.off("keydown.me");
            $input.off("focusout.me");
            $input.remove();
            elementToReplace.show();
            let newValue = escapeHtml($input.val());
            renameDoneCallback(newValue);
            return;
        }
    });
    $input.on("focusout.me", (ev) => {
        $input.off("keydown.me");
        $input.off("focusout.me");
        $input.remove();
        elementToReplace.show();
        let newValue = escapeHtml($input.val());
        renameDoneCallback(newValue);
        return;
    });
}
export function openContextMenu(items, x, y) {
    let mousePointer = window.PointerEvent ? "pointer" : "mouse";
    let $contextMenu = jQuery('<div class="jo_contextmenu"></div>');
    let $openSubMenu = null;
    let parentMenuItem = null;
    for (let mi of items) {
        let caption = mi.caption;
        if (mi.link != null) {
            caption = `<a href="${mi.link}" target="_blank" class="jo_menulink">${mi.caption}</a>`;
        }
        let $item = jQuery('<div>' + caption + (mi.subMenu != null ? '<span style="float: right"> &nbsp; &nbsp; &gt;</span>' : "") + '</div>');
        if (mi.color != null) {
            $item.css('color', mi.color);
        }
        if (mi.link == null) {
            $item.on(mousePointer + 'up.contextmenu', (ev) => {
                ev.stopPropagation();
                jQuery('.jo_contextmenu').remove();
                jQuery(document).off(mousePointer + "up.contextmenu");
                jQuery(document).off(mousePointer + "down.contextmenu");
                jQuery(document).off("keydown.contextmenu");
                mi.callback();
            });
            $item.on(mousePointer + 'down.contextmenu', (ev) => {
                ev.stopPropagation();
            });
        }
        else {
            let $link = $item.find('a');
            $link.on(mousePointer + "up", (event) => {
                event.stopPropagation();
                setTimeout(() => {
                    $item.hide();
                }, 500);
            });
            $link.on(mousePointer + "down", (event) => {
                event.stopPropagation();
            });
        }
        $item.on(mousePointer + 'move.contextmenu', () => {
            if (mi != parentMenuItem && $openSubMenu != null) {
                $openSubMenu.remove();
                parentMenuItem = null;
                $openSubMenu = null;
            }
            if (mi.subMenu != null) {
                $openSubMenu = openContextMenu(mi.subMenu, $item.offset().left + $item.width(), $item.offset().top);
            }
        });
        $contextMenu.append($item);
    }
    jQuery(document).on(mousePointer + "down.contextmenu", (e) => {
        jQuery(document).off(mousePointer + "down.contextmenu");
        jQuery(document).off("keydown.contextmenu");
        jQuery('.jo_contextmenu').remove();
    });
    jQuery(document).on("keydown.contextmenu", (ev) => {
        if (ev.key == "Escape") {
            jQuery(document).off(mousePointer + "up.contextmenu");
            jQuery(document).off("keydown.contextmenu");
            jQuery('.jo_contextmenu').remove();
        }
    });
    let leftRight = x > window.innerWidth * 0.8 ? "right" : "left";
    let xp = x > window.innerWidth * 0.8 ? window.innerWidth - x : x;
    let topBottom = y > window.innerHeight * 0.8 ? "bottom" : "top";
    let yp = y > window.innerHeight * 0.8 ? window.innerHeight - y : y;
    let css = {};
    css[leftRight] = xp + "px";
    css[topBottom] = yp + "px";
    $contextMenu.css(css);
    jQuery("body").append($contextMenu);
    $contextMenu.show();
    return $contextMenu;
}
export function makeTabs(tabDiv) {
    let headings = tabDiv.find('.jo_tabheadings>div').not('.jo_noHeading');
    let tabs = tabDiv.find('.jo_tabs>div');
    let mousePointer = window.PointerEvent ? "pointer" : "mouse";
    headings.on(mousePointer + "down", (ev) => {
        let target = jQuery(ev.target);
        headings.removeClass('jo_active');
        target.addClass('jo_active');
        let tab = tabDiv.find('.' + target.data('target'));
        tabs.removeClass('jo_active');
        tabs.trigger('myhide');
        tab.addClass('jo_active');
        tab.trigger('myshow');
    });
}
export function convertPxToNumber(pxString) {
    pxString = pxString.replace('px', '').trim();
    return Number.parseInt(pxString);
}
export function makeDiv(id, klass = "", text = "", css) {
    let s = "";
    if (id != null && id != "")
        s += ` id="${id}"`;
    if (klass != null && klass != "")
        s += ` class="${klass}"`;
    let div = jQuery(`<div${s}></div>`);
    if (css != null) {
        div.css(css);
    }
    if (text != null && text != "") {
        div.text(text);
    }
    return div;
}
export function setSelectItems($selectElement, items, activeItemValue) {
    $selectElement.empty();
    items.forEach(item => {
        let selected = (item.value == activeItemValue) ? ' selected="selected"' : "";
        let element = jQuery(`<option value=${item.value}${selected}>${item.caption}</option>`);
        $selectElement.append(element);
        element.data('object', item.object);
    });
    $selectElement.data('items', items);
}
export function getSelectedObject($selectDiv) {
    var _a;
    let items = $selectDiv.data('items');
    let selectedValue = $selectDiv.val();
    return (_a = items.find(item => item.value == selectedValue)) === null || _a === void 0 ? void 0 : _a.object;
}
export var jo_mouseDetected = false;
export function checkIfMousePresent() {
    if (matchMedia('(pointer:fine)').matches) {
        jo_mouseDetected = true;
    }
}
export function animateToTransparent($element, cssProperty, startColorRgb, duration) {
    let colorPraefix = 'rgba(' + startColorRgb[0] + ", " + startColorRgb[1] + ", " + startColorRgb[2] + ", ";
    let value = 1.0;
    let delta = value / (duration / 20);
    let animate = () => {
        $element.css(cssProperty, colorPraefix + value + ")");
        value -= delta;
        if (value < 0) {
            $element.css(cssProperty, "");
        }
        else {
            setTimeout(animate, 20);
        }
    };
    animate();
}
export function downloadFile(obj, filename, isBlob = false) {
    var blob = isBlob ? obj : new Blob([JSON.stringify(obj)], { type: 'text/plain' });
    //@ts-ignore
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        //@ts-ignore
        window.navigator.msSaveOrOpenBlob(blob, filename);
    }
    else {
        var e = document.createEvent('MouseEvents'), a = document.createElement('a');
        a.download = filename;
        a.href = window.URL.createObjectURL(blob);
        a.dataset.downloadurl = ['text/plain', a.download, a.href].join(':');
        //@ts-ignore
        e.initEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        a.dispatchEvent(e);
        a.remove();
    }
}
function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;
    // Avoid scrolling to bottom
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        var successful = document.execCommand('copy');
    }
    catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
}
export function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSHRtbFRvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NsaWVudC90b29scy9IdG1sVG9vbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLGtCQUFrQixDQUFDO0FBRTlDLE1BQU0sVUFBVSxZQUFZLENBQUMsZUFBb0MsRUFDN0QsZ0JBQXFDLEVBQ3JDLGtCQUFnRCxFQUFFLGlCQUFpRCxJQUFJO0lBRXZHLElBQUksWUFBWSxHQUFHLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0lBRTdELElBQUksZ0JBQWdCLElBQUksSUFBSSxFQUFFO1FBQzFCLGdCQUFnQixHQUFHLGVBQWUsQ0FBQztLQUN0QztJQUVELElBQUksTUFBTSxHQUFHLE1BQU0sQ0FBQyxpRUFBaUUsQ0FBQyxDQUFDO0lBQ3ZGLE1BQU0sQ0FBQyxHQUFHLENBQUM7UUFDUCxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUN0QyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxRQUFRLEVBQUUsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztRQUMxQyxrQkFBa0IsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsa0JBQWtCLENBQUM7UUFDNUQsV0FBVyxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUM7UUFDOUMsYUFBYSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUM7UUFDbEQsWUFBWSxFQUFFLFlBQVk7S0FDN0IsQ0FBQyxDQUFDO0lBQ0gsTUFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUNu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RSxHQUFHLENBQUMsQ0FBQztLQUN4RDtJQUVELFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3hDLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsSUFBSTtJQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsRUFBRTtRQUN0QiwyQkFBMkIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxPQUFPO0tBQ1Y7SUFDRCxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDekMsQ0FBQyxFQUFFLFVBQVUsR0FBRztRQUNaLE9BQU8sQ0FBQyxLQUFLLENBQUMsOEJBQThCLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdkQsQ0FBQyxDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXNjYXBlSHRtbCB9IGZyb20gXCIuL1N0cmluZ1Rvb2xzLmpzXCI7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gbWFrZUVkaXRhYmxlKGVsZW1lbnRXaXRoVGV4dDogSlF1ZXJ5PEhUTUxFbGVtZW50PixcclxuICAgIGVsZW1lbnRUb1JlcGxhY2U6IEpRdWVyeTxIVE1MRWxlbWVudD4sXHJcbiAgICByZW5hbWVEb25lQ2FsbGJhY2s6IChuZXdDb250ZW50OiBzdHJpbmcpID0+IHZvaWQsIHNlbGVjdGlvblJhbmdlOiB7IHN0YXJ0OiBudW1iZXIsIGVuZDogbnVtYmVyIH0gPSBudWxsKSB7XHJcblxyXG4gICAgbGV0IG1vdXNlUG9pbnRlciA9IHdpbmRvdy5Qb2ludGVyRXZlbnQgPyBcInBvaW50ZXJcIiA6IFwibW91c2VcIjtcclxuXHJcbiAgICBpZiAoZWxlbWVudFRvUmVwbGFjZSA9PSBudWxsKSB7XHJcbiAgICAgICAgZWxlbWVudFRvUmVwbGFjZSA9IGVsZW1lbnRXaXRoVGV4dDtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgJGlucHV0ID0galF1ZXJ5KCc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImpvX2lucGxhY2VlZGl0b3JcIiBzcGVsbGNoZWNrPVwiZmFsc2VcIj4nKTtcclxuICAgICRpbnB1dC5jc3Moe1xyXG4gICAgICAgIHdpZHRoOiBlbGVtZW50VG9SZXBsYWNlLmNzcygnd2lkdGgnKSxcclxuICAgICAgICBoZWlnaHQ6IGVsZW1lbnRUb1JlcGxhY2UuY3NzKCdoZWlnaHQnKSxcclxuICAgICAgICBjb2xvcjogZWxlbWVudFRvUmVwbGFjZS5jc3MoJ2NvbG9yJyksXHJcbiAgICAgICAgcG9zaXRpb246IGVsZW1lbnRUb1JlcGxhY2UuY3NzKCdwb3NpdGlvbicpLFxyXG4gICAgICAgIFwiYmFja2dyb3VuZC1jb2xvclwiOiBlbGVtZW50VG9SZXBsYWNlLmNzcygnYmFja2dyb3VuZC1jb2xvcicpLFxyXG4gICAgICAgIFwiZm9udC1zaXplXCI6IGVsZW1lbnRUb1JlcGxhY2UuY3NzKCdmb250LXNpemUnKSxcclxuICAgICAgICBcImZvbnQtd2VpZ2h0XCI6IGVsZW1lbnRUb1JlcGxhY2UuY3NzKCdmb250LXdlaWdodCcpLFxyXG4gICAgICAgIFwiYm94LXNpemluZ1wiOiBcImJvcmRlci1ib3hcIlxyXG4gICAgfSk7XHJcbiAgICAkaW5wdXQudmFsKGVsZW1lbnRXaXRoVGV4dC50ZXh0KCkpO1xyXG4gICAgJGlucHV0Lm9uKG1vdXNlUG9pbnRlciArIFwiZG93blwiLCAoZSkgPT4geyBlLnN0b3BQcm9wYWdhdGlvbigpOyB9KVxyXG5cclxuICAgIGlmIChzZWxlY3Rpb25SYW5nZSAhPSBudWxsKSB7XHJcbiAgICAgICAgKDxIVE1MSW5wdXRFbGVtZW50PiRpbnB1dFswXSkuc2V0U2VsZWN0aW9uUmFuZ2Uoc2VsZWN0aW9uUmFuZ2Uuc3RhcnQsIHNlbGVjdGlvblJhbmdlLmVuZCk7XHJcbiAgICB9XHJcblxyXG4gICAgZWxlbWVudFRvUmVwbGFjZS5hZnRlcigkaW5wdXQpO1xyXG4gICAgZWxlbWVudFRvUmVwbGFjZS5oaWRlKCk7XHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAkaW5wdXQuZm9jdXMoKTtcclxuICAgIH0sIDMwMCk7XHJcblxyXG4gICAgJGlucHV0Lm9uKFwia2V5ZG93bi5tZVwiLCAoZXYpID0+IHtcclxuICAgICAgICBpZiAoZXYua2V5ID09IFwiRW50ZXJcIiB8fCBldi5rZXkgPT0gXCJFc2NhcGVcIikge1xyXG4gICAgICAgICAgICAkaW5wdXQub2ZmKFwia2V5ZG93bi5tZVwiKTtcclxuICAgICAgICAgICAgJGlucHV0Lm9mZihcImZvY3Vzb3V0Lm1lXCIpO1xyXG4gICAgICAgICAgICAkaW5wdXQucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgIGVsZW1lbnRUb1JlcGxhY2Uuc2hvdygpO1xyXG4gICAgICAgICAgICBsZXQgbmV3VmFsdWUgPSBlc2NhcGVIdG1sKDxzdHJpbmc+JGlucHV0LnZhbCgpKTtcclxuICAgICAgICAgICAgcmVuYW1lRG9uZUNhbGxiYWNrKG5ld1ZhbHVlKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgICRpbnB1dC5vbihcImZvY3Vzb3V0Lm1lXCIsIChldikgPT4ge1xyXG4gICAgICAgICRpbnB1dC5vZmYoXCJrZXlkb3duLm1lXCIpO1xyXG4gICAgICAgICRpbnB1dC5vZmYoXCJmb2N1c291dC5tZVwiKTtcclxuICAgICAgICAkaW5wdXQucmVtb3ZlKCk7XHJcbiAgICAgICAgZWxlbWVudFRvUmVwbGFjZS5zaG93KCk7XHJcbiAgICAgICAgbGV0IG5ld1ZhbHVlID0gZXNjYXBlSHRtbCg8c3RyaW5nPiRpbnB1dC52YWwoKSk7XHJcbiAgICAgICAgcmVuYW1lRG9uZUNhbGxiYWNrKG5ld1ZhbHVlKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIENvbnRleHRNZW51SXRlbSA9IHtcclxuICAgIGNhcHRpb246IHN0cmluZztcclxuICAgIGNvbG9yPzogc3RyaW5nO1xyXG4gICAgY2FsbGJhY2s6ICgpID0+IHZvaWQ7XHJcbiAgICBsaW5rPzogc3RyaW5nO1xyXG4gICAgc3ViTWVudT86IENvbnRleHRNZW51SXRlbVtdXHJcbn07XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gb3BlbkNvbnRleHRNZW51KGl0ZW1zOiBDb250ZXh0TWVudUl0ZW1bXSwgeDogbnVtYmVyLCB5OiBudW1iZXIpOiBKUXVlcnk8SFRNTEVsZW1lbnQ+IHtcclxuXHJcbiAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG5cclxuICAgIGxldCAkY29udGV4dE1lbnUgPSBqUXVlcnkoJzxkaXYgY2xhc3M9XCJqb19jb250ZXh0bWVudVwiPjwvZGl2PicpO1xyXG5cclxuICAgIGxldCAkb3BlblN1Yk1lbnU6IEpRdWVyeTxIVE1MRWxlbWVudD4gPSBudWxsO1xyXG4gICAgbGV0IHBhcmVudE1lbnVJdGVtOiBDb250ZXh0TWVudUl0ZW0gPSBudWxsO1xyXG5cclxuICAgIGZvciAobGV0IG1pIG9mIGl0ZW1zKSB7XHJcbiAgICAgICAgbGV0IGNhcHRpb246IHN0cmluZyA9IG1pLmNhcHRpb247XHJcbiAgICAgICAgaWYgKG1pLmxpbmsgIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBjYXB0aW9uID0gYDxhIGhyZWY9XCIke21pLmxpbmt9XCIgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3M9XCJqb19tZW51bGlua1wiPiR7bWkuY2FwdGlvbn08L2E+YDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbGV0ICRpdGVtID0galF1ZXJ5KCc8ZGl2PicgKyBjYXB0aW9uICsgKG1pLnN1Yk1lbnUgIT0gbnVsbCA/ICc8c3BhbiBzdHlsZT1cImZsb2F0OiByaWdodFwiPiAmbmJzcDsgJm5ic3A7ICZndDs8L3NwYW4+JyA6IFwiXCIpICsgJzwvZGl2PicpO1xyXG4gICAgICAgIGlmIChtaS5jb2xvciAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICRpdGVtLmNzcygnY29sb3InLCBtaS5jb2xvcik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChtaS5saW5rID09IG51bGwpIHtcclxuICAgICAgICAgICAgJGl0ZW0ub24obW91c2VQb2ludGVyICsgJ3VwLmNvbnRleHRtZW51JywgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnLmpvX2NvbnRleHRtZW51JykucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9mZihtb3VzZVBvaW50ZXIgKyBcInVwLmNvbnRleHRtZW51XCIpO1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5vZmYobW91c2VQb2ludGVyICsgXCJkb3duLmNvbnRleHRtZW51XCIpO1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KGRvY3VtZW50KS5vZmYoXCJrZXlkb3duLmNvbnRleHRtZW51XCIpO1xyXG4gICAgICAgICAgICAgICAgbWkuY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICRpdGVtLm9uKG1vdXNlUG9pbnRlciArICdkb3duLmNvbnRleHRtZW51JywgKGV2KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGV0ICRsaW5rID0gJGl0ZW0uZmluZCgnYScpO1xyXG4gICAgICAgICAgICAkbGluay5vbihtb3VzZVBvaW50ZXIgKyBcInVwXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAkaXRlbS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICB9LCA1MDApO1xyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAkbGluay5vbihtb3VzZVBvaW50ZXIgKyBcImRvd25cIiwgKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSlcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAkaXRlbS5vbihtb3VzZVBvaW50ZXIgKyAnbW92ZS5jb250ZXh0bWVudScsICgpID0+IHtcclxuICAgICAgICAgICAgaWYgKG1pICE9IHBhcmVudE1lbnVJdGVtICYmICRvcGVuU3ViTWVudSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAkb3BlblN1Yk1lbnUucmVtb3ZlKCk7XHJcbiAgICAgICAgICAgICAgICBwYXJlbnRNZW51SXRlbSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAkb3BlblN1Yk1lbnUgPSBudWxsO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtaS5zdWJNZW51ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICRvcGVuU3ViTWVudSA9IG9wZW5Db250ZXh0TWVudShtaS5zdWJNZW51LCAkaXRlbS5vZmZzZXQoKS5sZWZ0ICsgJGl0ZW0ud2lkdGgoKSwgJGl0ZW0ub2Zmc2V0KCkudG9wKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAkY29udGV4dE1lbnUuYXBwZW5kKCRpdGVtKTtcclxuICAgIH1cclxuXHJcbiAgICBqUXVlcnkoZG9jdW1lbnQpLm9uKG1vdXNlUG9pbnRlciArIFwiZG93bi5jb250ZXh0bWVudVwiLCAoZSkgPT4ge1xyXG4gICAgICAgIGpRdWVyeShkb2N1bWVudCkub2ZmKG1vdXNlUG9pbnRlciArIFwiZG93bi5jb250ZXh0bWVudVwiKTtcclxuICAgICAgICBqUXVlcnkoZG9jdW1lbnQpLm9mZihcImtleWRvd24uY29udGV4dG1lbnVcIik7XHJcbiAgICAgICAgalF1ZXJ5KCcuam9fY29udGV4dG1lbnUnKS5yZW1vdmUoKTtcclxuICAgIH0pXHJcblxyXG4gICAgalF1ZXJ5KGRvY3VtZW50KS5vbihcImtleWRvd24uY29udGV4dG1lbnVcIiwgKGV2KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2LmtleSA9PSBcIkVzY2FwZVwiKSB7XHJcbiAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkub2ZmKG1vdXNlUG9pbnRlciArIFwidXAuY29udGV4dG1lbnVcIik7XHJcbiAgICAgICAgICAgIGpRdWVyeShkb2N1bWVudCkub2ZmKFwia2V5ZG93bi5jb250ZXh0bWVudVwiKTtcclxuICAgICAgICAgICAgalF1ZXJ5KCcuam9fY29udGV4dG1lbnUnKS5yZW1vdmUoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBsZXQgbGVmdFJpZ2h0ID0geCA+IHdpbmRvdy5pbm5lcldpZHRoICogMC44ID8gXCJyaWdodFwiIDogXCJsZWZ0XCI7XHJcbiAgICBsZXQgeHAgPSB4ID4gd2luZG93LmlubmVyV2lkdGggKiAwLjggPyB3aW5kb3cuaW5uZXJXaWR0aCAtIHggOiB4O1xyXG4gICAgbGV0IHRvcEJvdHRvbSA9IHkgPiB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjggPyBcImJvdHRvbVwiIDogXCJ0b3BcIjtcclxuICAgIGxldCB5cCA9IHkgPiB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjggPyB3aW5kb3cuaW5uZXJIZWlnaHQgLSB5IDogeTtcclxuXHJcbiAgICBsZXQgY3NzID0ge307XHJcbiAgICBjc3NbbGVmdFJpZ2h0XSA9IHhwICsgXCJweFwiO1xyXG4gICAgY3NzW3RvcEJvdHRvbV0gPSB5cCArIFwicHhcIjtcclxuXHJcbiAgICAkY29udGV4dE1lbnUuY3NzKGNzcyk7XHJcblxyXG5cclxuICAgIGpRdWVyeShcImJvZHlcIikuYXBwZW5kKCRjb250ZXh0TWVudSk7XHJcbiAgICAkY29udGV4dE1lbnUuc2hvdygpO1xyXG5cclxuICAgIHJldHVybiAkY29udGV4dE1lbnU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBtYWtlVGFicyh0YWJEaXY6IEpRdWVyeTxIVE1MRWxlbWVudD4pIHtcclxuICAgIGxldCBoZWFkaW5ncyA9IHRhYkRpdi5maW5kKCcuam9fdGFiaGVhZGluZ3M+ZGl2Jykubm90KCcuam9fbm9IZWFkaW5nJyk7XHJcbiAgICBsZXQgdGFicyA9IHRhYkRpdi5maW5kKCcuam9fdGFicz5kaXYnKTtcclxuXHJcbiAgICBsZXQgbW91c2VQb2ludGVyID0gd2luZG93LlBvaW50ZXJFdmVudCA/IFwicG9pbnRlclwiIDogXCJtb3VzZVwiO1xyXG5cclxuICAgIGhlYWRpbmdzLm9uKG1vdXNlUG9pbnRlciArIFwiZG93blwiLCAoZXYpID0+IHtcclxuICAgICAgICBsZXQgdGFyZ2V0ID0galF1ZXJ5KGV2LnRhcmdldCk7XHJcbiAgICAgICAgaGVhZGluZ3MucmVtb3ZlQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgIHRhcmdldC5hZGRDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgbGV0IHRhYiA9IHRhYkRpdi5maW5kKCcuJyArIHRhcmdldC5kYXRhKCd0YXJnZXQnKSk7XHJcbiAgICAgICAgdGFicy5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgdGFicy50cmlnZ2VyKCdteWhpZGUnKTtcclxuICAgICAgICB0YWIuYWRkQ2xhc3MoJ2pvX2FjdGl2ZScpO1xyXG4gICAgICAgIHRhYi50cmlnZ2VyKCdteXNob3cnKTtcclxuICAgIH0pO1xyXG5cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbnZlcnRQeFRvTnVtYmVyKHB4U3RyaW5nOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gICAgcHhTdHJpbmcgPSBweFN0cmluZy5yZXBsYWNlKCdweCcsICcnKS50cmltKCk7XHJcbiAgICByZXR1cm4gTnVtYmVyLnBhcnNlSW50KHB4U3RyaW5nKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VEaXYoaWQ6IHN0cmluZywga2xhc3M6IHN0cmluZyA9IFwiXCIsIHRleHQ6IHN0cmluZyA9IFwiXCIsIGNzcz86IHsgW2lkOiBzdHJpbmddOiBhbnkgfSk6IEpRdWVyeTxIVE1MRGl2RWxlbWVudD4ge1xyXG5cclxuICAgIGxldCBzID0gXCJcIjtcclxuICAgIGlmIChpZCAhPSBudWxsICYmIGlkICE9IFwiXCIpIHMgKz0gYCBpZD1cIiR7aWR9XCJgO1xyXG5cclxuICAgIGlmIChrbGFzcyAhPSBudWxsICYmIGtsYXNzICE9IFwiXCIpIHMgKz0gYCBjbGFzcz1cIiR7a2xhc3N9XCJgO1xyXG5cclxuICAgIGxldCBkaXYgPSBqUXVlcnkoYDxkaXYke3N9PjwvZGl2PmApO1xyXG5cclxuICAgIGlmIChjc3MgIT0gbnVsbCkge1xyXG4gICAgICAgIGRpdi5jc3MoY3NzKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGV4dCAhPSBudWxsICYmIHRleHQgIT0gXCJcIikge1xyXG4gICAgICAgIGRpdi50ZXh0KHRleHQpO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiA8YW55PmRpdjtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCB0eXBlIFNlbGVjdEl0ZW0gPSB7XHJcbiAgICB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyLFxyXG4gICAgb2JqZWN0OiBhbnksXHJcbiAgICBjYXB0aW9uOiBzdHJpbmdcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIHNldFNlbGVjdEl0ZW1zKCRzZWxlY3RFbGVtZW50OiBKUXVlcnk8SFRNTFNlbGVjdEVsZW1lbnQ+LCBpdGVtczogU2VsZWN0SXRlbVtdLCBhY3RpdmVJdGVtVmFsdWU/OiBzdHJpbmcgfCBudW1iZXIpIHtcclxuICAgICRzZWxlY3RFbGVtZW50LmVtcHR5KCk7XHJcbiAgICBpdGVtcy5mb3JFYWNoKGl0ZW0gPT4ge1xyXG4gICAgICAgIGxldCBzZWxlY3RlZDogc3RyaW5nID0gKGl0ZW0udmFsdWUgPT0gYWN0aXZlSXRlbVZhbHVlKSA/ICcgc2VsZWN0ZWQ9XCJzZWxlY3RlZFwiJyA6IFwiXCI7XHJcbiAgICAgICAgbGV0IGVsZW1lbnQgPSBqUXVlcnkoYDxvcHRpb24gdmFsdWU9JHtpdGVtLnZhbHVlfSR7c2VsZWN0ZWR9PiR7aXRlbS5jYXB0aW9ufTwvb3B0aW9uPmApO1xyXG4gICAgICAgICRzZWxlY3RFbGVtZW50LmFwcGVuZChlbGVtZW50KTtcclxuICAgICAgICBlbGVtZW50LmRhdGEoJ29iamVjdCcsIGl0ZW0ub2JqZWN0KTtcclxuICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgJHNlbGVjdEVsZW1lbnQuZGF0YSgnaXRlbXMnLCBpdGVtcyk7XHJcblxyXG5cclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFNlbGVjdGVkT2JqZWN0KCRzZWxlY3REaXY6IEpRdWVyeTxIVE1MU2VsZWN0RWxlbWVudD4pIHtcclxuXHJcbiAgICBsZXQgaXRlbXM6IFNlbGVjdEl0ZW1bXSA9ICRzZWxlY3REaXYuZGF0YSgnaXRlbXMnKTtcclxuXHJcbiAgICBsZXQgc2VsZWN0ZWRWYWx1ZSA9ICRzZWxlY3REaXYudmFsKCk7XHJcblxyXG4gICAgcmV0dXJuIGl0ZW1zLmZpbmQoaXRlbSA9PiBpdGVtLnZhbHVlID09IHNlbGVjdGVkVmFsdWUpPy5vYmplY3Q7XHJcblxyXG59XHJcblxyXG5leHBvcnQgdmFyIGpvX21vdXNlRGV0ZWN0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcclxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrSWZNb3VzZVByZXNlbnQoKSB7XHJcbiAgICBpZiAobWF0Y2hNZWRpYSgnKHBvaW50ZXI6ZmluZSknKS5tYXRjaGVzKSB7XHJcbiAgICAgICAgam9fbW91c2VEZXRlY3RlZCA9IHRydWU7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBhbmltYXRlVG9UcmFuc3BhcmVudCgkZWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50PiwgY3NzUHJvcGVydHk6IHN0cmluZywgc3RhcnRDb2xvclJnYjogbnVtYmVyW10sIGR1cmF0aW9uOiBudW1iZXIpIHtcclxuICAgIGxldCBjb2xvclByYWVmaXggPSAncmdiYSgnICsgc3RhcnRDb2xvclJnYlswXSArIFwiLCBcIiArIHN0YXJ0Q29sb3JSZ2JbMV0gKyBcIiwgXCIgKyBzdGFydENvbG9yUmdiWzJdICsgXCIsIFwiO1xyXG4gICAgbGV0IHZhbHVlID0gMS4wO1xyXG4gICAgbGV0IGRlbHRhID0gdmFsdWUgLyAoZHVyYXRpb24gLyAyMCk7XHJcblxyXG4gICAgbGV0IGFuaW1hdGUgPSAoKSA9PiB7XHJcbiAgICAgICAgJGVsZW1lbnQuY3NzKGNzc1Byb3BlcnR5LCBjb2xvclByYWVmaXggKyB2YWx1ZSArIFwiKVwiKTtcclxuICAgICAgICB2YWx1ZSAtPSBkZWx0YTtcclxuICAgICAgICBpZiAodmFsdWUgPCAwKSB7XHJcbiAgICAgICAgICAgICRlbGVtZW50LmNzcyhjc3NQcm9wZXJ0eSwgXCJcIik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2V0VGltZW91dChhbmltYXRlLCAyMCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFuaW1hdGUoKTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGRvd25sb2FkRmlsZShvYmo6IGFueSwgZmlsZW5hbWU6IHN0cmluZywgaXNCbG9iOiBib29sZWFuID0gZmFsc2UpIHtcclxuICAgIHZhciBibG9iID0gaXNCbG9iPyBvYmogOiBuZXcgQmxvYihbSlNPTi5zdHJpbmdpZnkob2JqKV0sIHsgdHlwZTogJ3RleHQvcGxhaW4nIH0pO1xyXG4gICAgLy9AdHMtaWdub3JlXHJcbiAgICBpZiAod2luZG93Lm5hdmlnYXRvciAmJiB3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IpIHtcclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICB3aW5kb3cubmF2aWdhdG9yLm1zU2F2ZU9yT3BlbkJsb2IoYmxvYiwgZmlsZW5hbWUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgZSA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdNb3VzZUV2ZW50cycpLFxyXG4gICAgICAgICAgICBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpO1xyXG4gICAgICAgIGEuZG93bmxvYWQgPSBmaWxlbmFtZTtcclxuICAgICAgICBhLmhyZWYgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBhLmRhdGFzZXQuZG93bmxvYWR1cmwgPSBbJ3RleHQvcGxhaW4nLCBhLmRvd25sb2FkLCBhLmhyZWZdLmpvaW4oJzonKTtcclxuICAgICAgICAvL0B0cy1pZ25vcmVcclxuICAgICAgICBlLmluaXRFdmVudCgnY2xpY2snLCB0cnVlLCBmYWxzZSwgd2luZG93LCAwLCAwLCAwLCAwLCAwLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCBmYWxzZSwgMCwgbnVsbCk7XHJcbiAgICAgICAgYS5kaXNwYXRjaEV2ZW50KGUpO1xyXG4gICAgICAgIGEucmVtb3ZlKCk7XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBmYWxsYmFja0NvcHlUZXh0VG9DbGlwYm9hcmQodGV4dCkge1xyXG4gICAgdmFyIHRleHRBcmVhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInRleHRhcmVhXCIpO1xyXG4gICAgdGV4dEFyZWEudmFsdWUgPSB0ZXh0O1xyXG5cclxuICAgIC8vIEF2b2lkIHNjcm9sbGluZyB0byBib3R0b21cclxuICAgIHRleHRBcmVhLnN0eWxlLnRvcCA9IFwiMFwiO1xyXG4gICAgdGV4dEFyZWEuc3R5bGUubGVmdCA9IFwiMFwiO1xyXG4gICAgdGV4dEFyZWEuc3R5bGUucG9zaXRpb24gPSBcImZpeGVkXCI7XHJcblxyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh0ZXh0QXJlYSk7XHJcbiAgICB0ZXh0QXJlYS5mb2N1cygpO1xyXG4gICAgdGV4dEFyZWEuc2VsZWN0KCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgICB2YXIgc3VjY2Vzc2Z1bCA9IGRvY3VtZW50LmV4ZWNDb21tYW5kKCdjb3B5Jyk7XHJcbiAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWxsYmFjazogT29wcywgdW5hYmxlIHRvIGNvcHknLCBlcnIpO1xyXG4gICAgfVxyXG5cclxuICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQodGV4dEFyZWEpO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY29weVRleHRUb0NsaXBib2FyZCh0ZXh0KSB7XHJcbiAgICBpZiAoIW5hdmlnYXRvci5jbGlwYm9hcmQpIHtcclxuICAgICAgICBmYWxsYmFja0NvcHlUZXh0VG9DbGlwYm9hcmQodGV4dCk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgbmF2aWdhdG9yLmNsaXBib2FyZC53cml0ZVRleHQodGV4dCkudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICB9LCBmdW5jdGlvbiAoZXJyKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignQXN5bmM6IENvdWxkIG5vdCBjb3B5IHRleHQ6ICcsIGVycik7XHJcbiAgICB9KTtcclxufVxyXG4iXX0=