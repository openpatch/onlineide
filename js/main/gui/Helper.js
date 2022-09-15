import { Main } from "../Main.js";
export class Helper {
    static openHelper(text, targetElement, direction) {
        let $helper = jQuery('.jo_arrow_box');
        $helper.removeClass(['jo_arrow_box_left', 'jo_arrow_box_right', 'jo_arrow_box_top', 'jo_arrow_box_bottom']);
        $helper.addClass('jo_arrow_box_' + direction);
        $helper.css({ left: '', right: '', top: '', bottom: '' });
        let to = targetElement.offset();
        let b = jQuery('body');
        let delta = 34;
        switch (direction) {
            case "bottom":
                $helper.css({
                    left: to.left + targetElement.width() / 2 - delta,
                    bottom: b.height() - to.top + delta
                });
                break;
            case "top":
                $helper.css({
                    left: to.left + targetElement.width() / 2 - delta,
                    top: to.top + targetElement.height() + 26
                });
                break;
            case "left":
                $helper.css({
                    left: to.left + targetElement.width() + delta,
                    top: to.top + targetElement.height() / 2 - delta
                });
                break;
            case "right":
                $helper.css({
                    right: b.width() - to.left,
                    top: to.top + targetElement.height() / 2 - delta
                });
                break;
        }
        $helper.find('span').html(text);
        let $button = $helper.find('.jo_button');
        $button.on('click', (e) => {
            e.stopPropagation();
            $button.off('click');
            Helper.close();
        });
        $helper.fadeIn(800);
    }
    static close() {
        let $helper = jQuery('.jo_arrow_box');
        $helper.fadeOut(800);
    }
    static showHelper(id, mainBase, $element) {
        let main;
        if (mainBase instanceof Main) {
            main = mainBase;
        }
        else {
            return;
        }
        let helperHistory = main.user.settings.helperHistory;
        if (id == "speedControlHelper" && helperHistory["speedControlHelperDone"]) {
            id = "stepButtonHelper";
        }
        let flag = id + "Done";
        if (helperHistory != null && (helperHistory[flag] == null || !helperHistory[flag])) {
            helperHistory[flag] = true;
            main.networkManager.sendUpdateUserSettings(() => { });
            let text = "";
            let direction = "left";
            switch (id) {
                case "folderButton":
                    text = `Mit diesem Button können Sie in der Liste der Workspaces Ordner anlegen. 
                    <ul>
                    <li>Bestehende Workspaces lassen sich mit der Maus in Ordner ziehen.</li>
                    <li>Wollen Sie einen Workspace in die oberste Ordnerebene bringen, so ziehen Sie ihn einfach auf den "Workspaces"-Balken.</li>
                    <li>Über das Kontextmenü der Ordner lassen sich Workspaces und Unterordner anlegen.</li>
                    </ul>`,
                        direction = "top";
                    break;
                case "repositoryButton":
                    text = `Wenn der aktuelle Workspace mit einem Repository verknüft ist, erscheint hier der "Synchronisieren-Button". Ein Klick darauf öffnet einen Dialog, in dem die Dateien des Workspace mit denen des Repositorys abgeglichen werden können.`;
                    direction = "top";
                    break;
                case "speedControlHelper":
                    text = `Mit dem Geschwindigkeitsregler können  
                            Sie einstellen, wie schnell das Programm abläuft. 
                            Bei Geschwindigkeiten bis 10 Steps/s wird 
                            während des Programmablaufs der Programzeiger gezeigt
                            und die Anzeige der Variablen auf der linken 
                            Seite stets aktualisiert.`;
                    direction = "top";
                    $element = main.interpreter.controlButtons.speedControl.$grip;
                    break;
                case "newFileHelper":
                    text = `Es gibt noch keine Programmdatei im Workspace. <br> Nutzen Sie den Button 
                        <span class='img_add-file-dark jo_inline-image'></span> um eine Programmdatei anzulegen.
                        `;
                    direction = "left";
                    break;
                case "newWorkspaceHelper":
                    text = `Es gibt noch keinen Workspace. <br> Nutzen Sie den Button
                        <span class='img_add-workspace-dark jo_inline-image'></span> um einen Workspace anzulegen.
                        `;
                    direction = "left";
                    break;
                case "homeButtonHelper":
                    text = "Mit dem Home-Button <span class='img_home-dark jo_inline-image'></span> können Sie wieder zu Ihren eigenen Workspaces wechseln.";
                    direction = "top";
                    $element = jQuery('.img_home-dark');
                    break;
                case "stepButtonHelper":
                    text = `Mit den Buttons "Step over"
                        (<span class='img_step-over-dark jo_inline-image'></span>, Taste F8), 
                        "Step into" 
                        (<span class='img_step-into-dark jo_inline-image'></span>, Taste F7) und 
                        "Step out" 
                        (<span class='img_step-out-dark jo_inline-image'></span>, Taste F9)  
                        können Sie das Programm schrittweise ausführen und sich nach jedem Schritt die Belegung der Variablen ansehen. <br>
                        <ul><li><span class='img_step-over-dark jo_inline-image'></span> Step over führt den nächsten Schritt aus, insbesondere werden Methodenaufrufe in einem Schritt durchgeführt.</li>
                        <li><span class='img_step-into-dark jo_inline-image'></span> Step into führt auch den nächsten Schritt aus, geht bei Methodenaufrufen aber in die Methode hinein und führt auch die Anweisungen innerhalb der Methode schrittweise aus.</li>
                        <li><span class='img_step-out-dark jo_inline-image'></span> Befindet sich die Programmausführung innerhalb einer Methode, so bewirkt ein Klick auf Step out, dass der Rest der Methode ausgeführt wird und die Programmausführung erst nach der Aufrufstelle der Methode anhält.</li>
                        </ul>
                        `;
                    direction = "top";
                    $element = main.interpreter.controlButtons.$buttonStepOver;
                    break;
                case "consoleHelper":
                    text = `
                        Hier können Sie Anweisungen oder Terme eingeben, die nach Bestätigung mit der Enter-Taste ausgeführt/ausgewertet werden. Das Ergebnis sehen Sie im Bereich über der Eingabezeile. <br>
                        Falls das Programm gerade pausiert (z.B. bei Ausführung in Einzelschritten) können Sie auch auf die Variablen des aktuellen Sichtbarkeitsbereiches zugreifen.
                    `;
                    direction = "bottom";
                    $element = main.bottomDiv.console.$consoleTab.find('.jo_monaco-editor');
            }
            if (text != "" && $element != null && $element.length > 0) {
                Helper.openHelper(text, $element, direction);
            }
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGVscGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9IZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUtsQyxNQUFNLE9BQU8sTUFBTTtJQUVSLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBWSxFQUFFLGFBQWtDLEVBQUUsU0FBMEI7UUFFakcsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFFNUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFFOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTFELElBQUksRUFBRSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFdkIsSUFBSSxLQUFLLEdBQVcsRUFBRSxDQUFDO1FBRXZCLFFBQVEsU0FBUyxFQUFFO1lBQ2YsS0FBSyxRQUFRO2dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUM7b0JBQ3ZCLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsS0FBSztvQkFDakQsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUs7aUJBQ3RDLENBQUMsQ0FBQztnQkFDQyxN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QUFJLElBQUksRUFBRSxJQUFJLFFBQVEsSUFBSSxJQUFJLElBQUksUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3ZELE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQzthQUNoRDtTQUVKO0lBRUwsQ0FBQztDQUlKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuLi9NYWluLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgdHlwZSBIZWxwZXJEaXJlY3Rpb24gPSBcInRvcFwiIHwgXCJib3R0b21cIiB8IFwibGVmdFwiIHwgXCJyaWdodFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIEhlbHBlciB7XHJcblxyXG4gICAgcHVibGljIHN0YXRpYyBvcGVuSGVscGVyKHRleHQ6IHN0cmluZywgdGFyZ2V0RWxlbWVudDogSlF1ZXJ5PEhUTUxFbGVtZW50PiwgZGlyZWN0aW9uOiBIZWxwZXJEaXJlY3Rpb24pIHtcclxuXHJcbiAgICAgICAgbGV0ICRoZWxwZXIgPSBqUXVlcnkoJy5qb19hcnJvd19ib3gnKTtcclxuICAgICAgICAkaGVscGVyLnJlbW92ZUNsYXNzKFsnam9fYXJyb3dfYm94X2xlZnQnLCAnam9fYXJyb3dfYm94X3JpZ2h0JywgJ2pvX2Fycm93X2JveF90b3AnLCAnam9fYXJyb3dfYm94X2JvdHRvbSddKTtcclxuXHJcbiAgICAgICAgJGhlbHBlci5hZGRDbGFzcygnam9fYXJyb3dfYm94XycgKyBkaXJlY3Rpb24pO1xyXG5cclxuICAgICAgICAkaGVscGVyLmNzcyh7IGxlZnQ6ICcnLCByaWdodDogJycsIHRvcDogJycsIGJvdHRvbTogJycgfSk7XHJcblxyXG4gICAgICAgIGxldCB0byA9IHRhcmdldEVsZW1lbnQub2Zmc2V0KCk7XHJcbiAgICAgICAgbGV0IGIgPSBqUXVlcnkoJ2JvZHknKTtcclxuXHJcbiAgICAgICAgbGV0IGRlbHRhOiBudW1iZXIgPSAzNDtcclxuXHJcbiAgICAgICAgc3dpdGNoIChkaXJlY3Rpb24pIHtcclxuICAgICAgICAgICAgY2FzZSBcImJvdHRvbVwiOiAkaGVscGVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiB0by5sZWZ0ICsgdGFyZ2V0RWxlbWVudC53aWR0aCgpIC8gMiAtIGRlbHRhLFxyXG4gICAgICAgICAgICAgICAgYm90dG9tOiBiLmhlaWdodCgpIC0gdG8udG9wICsgZGVsdGFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcInRvcFwiOiAkaGVscGVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgICBsZWZ0OiB0by5sZWZ0ICsgdGFyZ2V0RWxlbWVudC53aWR0aCgpIC8gMiAtIGRlbHRhLFxyXG4gICAgICAgICAgICAgICAgdG9wOiB0by50b3AgKyB0YXJnZXRFbGVtZW50LmhlaWdodCgpICsgMjZcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgY2FzZSBcImxlZnRcIjogJGhlbHBlci5jc3Moe1xyXG4gICAgICAgICAgICAgICAgbGVmdDogdG8ubGVmdCArIHRhcmdldEVsZW1lbnQud2lkdGgoKSArIGRlbHRhLFxyXG4gICAgICAgICAgICAgICAgdG9wOiB0by50b3AgKyB0YXJnZXRFbGVtZW50LmhlaWdodCgpIC8gMiAtIGRlbHRhXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJyaWdodFwiOiAkaGVscGVyLmNzcyh7XHJcbiAgICAgICAgICAgICAgICByaWdodDogYi53aWR0aCgpIC0gdG8ubGVmdCxcclxuICAgICAgICAgICAgICAgIHRvcDogdG8udG9wICsgdGFyZ2V0RWxlbWVudC5oZWlnaHQoKSAvIDIgLSBkZWx0YVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgJGhlbHBlci5maW5kKCdzcGFuJykuaHRtbCh0ZXh0KTtcclxuXHJcbiAgICAgICAgbGV0ICRidXR0b24gPSAkaGVscGVyLmZpbmQoJy5qb19idXR0b24nKTtcclxuICAgICAgICAkYnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgICRidXR0b24ub2ZmKCdjbGljaycpO1xyXG4gICAgICAgICAgICBIZWxwZXIuY2xvc2UoKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgJGhlbHBlci5mYWRlSW4oODAwKTtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgc3RhdGljIGNsb3NlKCkge1xyXG4gICAgICAgIGxldCAkaGVscGVyID0galF1ZXJ5KCcuam9fYXJyb3dfYm94Jyk7XHJcbiAgICAgICAgJGhlbHBlci5mYWRlT3V0KDgwMCk7XHJcbiAgICB9XHJcblxyXG5cclxuICAgIHN0YXRpYyBzaG93SGVscGVyKGlkOiBzdHJpbmcsIG1haW5CYXNlOiBNYWluQmFzZSwgJGVsZW1lbnQ/OiBKUXVlcnk8SFRNTEVsZW1lbnQ+KSB7XHJcblxyXG4gICAgICAgIGxldCBtYWluOiBNYWluO1xyXG4gICAgICAgIGlmKG1haW5CYXNlIGluc3RhbmNlb2YgTWFpbil7XHJcbiAgICAgICAgICAgIG1haW4gPSBtYWluQmFzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgaGVscGVySGlzdG9yeSA9IG1haW4udXNlci5zZXR0aW5ncyEuaGVscGVySGlzdG9yeTtcclxuXHJcbiAgICAgICAgaWYgKGlkID09IFwic3BlZWRDb250cm9sSGVscGVyXCIgJiYgaGVscGVySGlzdG9yeVtcInNwZWVkQ29udHJvbEhlbHBlckRvbmVcIl0pIHtcclxuICAgICAgICAgICAgaWQgPSBcInN0ZXBCdXR0b25IZWxwZXJcIjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCBmbGFnID0gaWQgKyBcIkRvbmVcIjtcclxuXHJcbiAgICAgICAgaWYgKGhlbHBlckhpc3RvcnkgIT0gbnVsbCAmJiAoaGVscGVySGlzdG9yeVtmbGFnXSA9PSBudWxsIHx8ICFoZWxwZXJIaXN0b3J5W2ZsYWddKSkge1xyXG4gICAgICAgICAgICBoZWxwZXJIaXN0b3J5W2ZsYWddID0gdHJ1ZTtcclxuICAgICAgICAgICAgbWFpbi5uZXR3b3JrTWFuYWdlci5zZW5kVXBkYXRlVXNlclNldHRpbmdzKCgpID0+IHsgfSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgdGV4dDogc3RyaW5nID0gXCJcIjtcclxuICAgICAgICAgICAgbGV0IGRpcmVjdGlvbjogSGVscGVyRGlyZWN0aW9uID0gXCJsZWZ0XCI7XHJcblxyXG4gICAgICAgICAgICBzd2l0Y2ggKGlkKSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiZm9sZGVyQnV0dG9uXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGBNaXQgZGllc2VtIEJ1dHRvbiBrw7ZubmVuIFNpZSBpbiBkZXIgTGlzdGUgZGVyIFdvcmtzcGFjZXMgT3JkbmVyIGFubGVnZW4uIFxyXG4gICAgICAgICAgICAgICAgICAgIDx1bD5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+QmVzdGVoZW5kZSBXb3Jrc3BhY2VzIGxhc3NlbiBzaWNoIG1pdCBkZXIgTWF1cyBpbiBPcmRuZXIgemllaGVuLjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPldvbGxlbiBTaWUgZWluZW4gV29ya3NwYWNlIGluIGRpZSBvYmVyc3RlIE9yZG5lcmViZW5lIGJyaW5nZW4sIHNvIHppZWhlbiBTaWUgaWhuIGVpbmZhY2ggYXVmIGRlbiBcIldvcmtzcGFjZXNcIi1CYWxrZW4uPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+w5xiZXIgZGFzIEtvbnRleHRtZW7DvCBkZXIgT3JkbmVyIGxhc3NlbiBzaWNoIFdvcmtzcGFjZXMgdW5kIFVudGVyb3JkbmVyIGFubGVnZW4uPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8L3VsPmAsXHJcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gXCJ0b3BcIjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJyZXBvc2l0b3J5QnV0dG9uXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IGBXZW5uIGRlciBha3R1ZWxsZSBXb3Jrc3BhY2UgbWl0IGVpbmVtIFJlcG9zaXRvcnkgdmVya27DvGZ0IGlzdCwgZXJzY2hlaW50IGhpZXIgZGVyIFwiU3luY2hyb25pc2llcmVuLUJ1dHRvblwiLiBFaW4gS2xpY2sgZGFyYXVmIMO2ZmZuZXQgZWluZW4gRGlhbG9nLCBpbiBkZW0gZGllIERhdGVpZW4gZGVzIFdvcmtzcGFjZSBtaXQgZGVuZW4gZGVzIFJlcG9zaXRvcnlzIGFiZ2VnbGljaGVuIHdlcmRlbiBrw7ZubmVuLmA7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gXCJ0b3BcIjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJzcGVlZENvbnRyb2xIZWxwZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYE1pdCBkZW0gR2VzY2h3aW5kaWdrZWl0c3JlZ2xlciBrw7ZubmVuICBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFNpZSBlaW5zdGVsbGVuLCB3aWUgc2NobmVsbCBkYXMgUHJvZ3JhbW0gYWJsw6R1ZnQuIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQmVpIEdlc2Nod2luZGlna2VpdGVuIGJpcyAxMCBTdGVwcy9zIHdpcmQgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3w6RocmVuZCBkZXMgUHJvZ3JhbW1hYmxhdWZzIGRlciBQcm9ncmFtemVpZ2VyIGdlemVpZ3RcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVuZCBkaWUgQW56ZWlnZSBkZXIgVmFyaWFibGVuIGF1ZiBkZXIgbGlua2VuIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2VpdGUgc3RldHMgYWt0dWFsaXNpZXJ0LmA7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gXCJ0b3BcIjtcclxuICAgICAgICAgICAgICAgICAgICAkZWxlbWVudCA9IG1haW4uaW50ZXJwcmV0ZXIuY29udHJvbEJ1dHRvbnMuc3BlZWRDb250cm9sLiRncmlwO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIm5ld0ZpbGVIZWxwZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYEVzIGdpYnQgbm9jaCBrZWluZSBQcm9ncmFtbWRhdGVpIGltIFdvcmtzcGFjZS4gPGJyPiBOdXR6ZW4gU2llIGRlbiBCdXR0b24gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSdpbWdfYWRkLWZpbGUtZGFyayBqb19pbmxpbmUtaW1hZ2UnPjwvc3Bhbj4gdW0gZWluZSBQcm9ncmFtbWRhdGVpIGFuenVsZWdlbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBcImxlZnRcIjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJuZXdXb3Jrc3BhY2VIZWxwZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYEVzIGdpYnQgbm9jaCBrZWluZW4gV29ya3NwYWNlLiA8YnI+IE51dHplbiBTaWUgZGVuIEJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz0naW1nX2FkZC13b3Jrc3BhY2UtZGFyayBqb19pbmxpbmUtaW1hZ2UnPjwvc3Bhbj4gdW0gZWluZW4gV29ya3NwYWNlIGFuenVsZWdlbi5cclxuICAgICAgICAgICAgICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBcImxlZnRcIjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJob21lQnV0dG9uSGVscGVyXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dCA9IFwiTWl0IGRlbSBIb21lLUJ1dHRvbiA8c3BhbiBjbGFzcz0naW1nX2hvbWUtZGFyayBqb19pbmxpbmUtaW1hZ2UnPjwvc3Bhbj4ga8O2bm5lbiBTaWUgd2llZGVyIHp1IElocmVuIGVpZ2VuZW4gV29ya3NwYWNlcyB3ZWNoc2Vsbi5cIjtcclxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBcInRvcFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICRlbGVtZW50ID0galF1ZXJ5KCcuaW1nX2hvbWUtZGFyaycpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInN0ZXBCdXR0b25IZWxwZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYE1pdCBkZW4gQnV0dG9ucyBcIlN0ZXAgb3ZlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICg8c3BhbiBjbGFzcz0naW1nX3N0ZXAtb3Zlci1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiwgVGFzdGUgRjgpLCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJTdGVwIGludG9cIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDxzcGFuIGNsYXNzPSdpbWdfc3RlcC1pbnRvLWRhcmsgam9faW5saW5lLWltYWdlJz48L3NwYW4+LCBUYXN0ZSBGNykgdW5kIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlN0ZXAgb3V0XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICg8c3BhbiBjbGFzcz0naW1nX3N0ZXAtb3V0LWRhcmsgam9faW5saW5lLWltYWdlJz48L3NwYW4+LCBUYXN0ZSBGOSkgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBrw7ZubmVuIFNpZSBkYXMgUHJvZ3JhbW0gc2Nocml0dHdlaXNlIGF1c2bDvGhyZW4gdW5kIHNpY2ggbmFjaCBqZWRlbSBTY2hyaXR0IGRpZSBCZWxlZ3VuZyBkZXIgVmFyaWFibGVuIGFuc2VoZW4uIDxicj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHVsPjxsaT48c3BhbiBjbGFzcz0naW1nX3N0ZXAtb3Zlci1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiBTdGVwIG92ZXIgZsO8aHJ0IGRlbiBuw6RjaHN0ZW4gU2Nocml0dCBhdXMsIGluc2Jlc29uZGVyZSB3ZXJkZW4gTWV0aG9kZW5hdWZydWZlIGluIGVpbmVtIFNjaHJpdHQgZHVyY2hnZWbDvGhydC48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PHNwYW4gY2xhc3M9J2ltZ19zdGVwLWludG8tZGFyayBqb19pbmxpbmUtaW1hZ2UnPjwvc3Bhbj4gU3RlcCBpbnRvIGbDvGhydCBhdWNoIGRlbiBuw6RjaHN0ZW4gU2Nocml0dCBhdXMsIGdlaHQgYmVpIE1ldGhvZGVuYXVmcnVmZW4gYWJlciBpbiBkaWUgTWV0aG9kZSBoaW5laW4gdW5kIGbDvGhydCBhdWNoIGRpZSBBbndlaXN1bmdlbiBpbm5lcmhhbGIgZGVyIE1ldGhvZGUgc2Nocml0dHdlaXNlIGF1cy48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8bGk+PHNwYW4gY2xhc3M9J2ltZ19zdGVwLW91dC1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiBCZWZpbmRldCBzaWNoIGRpZSBQcm9ncmFtbWF1c2bDvGhydW5nIGlubmVyaGFsYiBlaW5lciBNZXRob2RlLCBzbyBiZXdpcmt0IGVpbiBLbGljayBhdWYgU3RlcCBvdXQsIGRhc3MgZGVyIFJlc3QgZGVyIE1ldGhvZGUgYXVzZ2Vmw7xocnQgd2lyZCB1bmQgZGllIFByb2dyYW1tYXVzZsO8aHJ1bmcgZXJzdCBuYWNoIGRlciBBdWZydWZzdGVsbGUgZGVyIE1ldGhvZGUgYW5ow6RsdC48L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFwidG9wXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQgPSBtYWluLmludGVycHJldGVyLmNvbnRyb2xCdXR0b25zLiRidXR0b25TdGVwT3ZlcjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgXCJjb25zb2xlSGVscGVyXCI6IFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ9YFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBIaWVyIGvDtm5uZW4gU2llIEFud2Vpc3VuZ2VuIG9kZXIgVGVybWUgZWluZ2ViZW4sIGRpZSBuYWNoIEJlc3TDpHRpZ3VuZyBtaXQgZGVyIEVudGVyLVRhc3RlIGF1c2dlZsO8aHJ0L2F1c2dld2VydGV0IHdlcmRlbi4gRGFzIEVyZ2VibmlzIHNlaGVuIFNpZSBpbSBCZXJlaWNoIMO8YmVyIGRlciBFaW5nYWJlemVpbGUuIDxicj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgRmFsbHMgZGFzIFByb2dyYW1tIGdlcmFkZSBwYXVzaWVydCAoei5CLiBiZWkgQXVzZsO8aHJ1bmcgaW4gRWluemVsc2Nocml0dGVuKSBrw7ZubmVuIFNpZSBhdWNoIGF1ZiBkaWUgVmFyaWFibGVuIGRlcyBha3R1ZWxsZW4gU2ljaHRiYXJrZWl0c2JlcmVpY2hlcyB6dWdyZWlmZW4uXHJcbiAgICAgICAgICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBcImJvdHRvbVwiO1xyXG4gICAgICAgICAgICAgICAgICAgICRlbGVtZW50ID0gbWFpbi5ib3R0b21EaXYuY29uc29sZS4kY29uc29sZVRhYi5maW5kKCcuam9fbW9uYWNvLWVkaXRvcicpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBpZiAodGV4dCAhPSBcIlwiICYmICRlbGVtZW50ICE9IG51bGwgJiYgJGVsZW1lbnQubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICAgICAgSGVscGVyLm9wZW5IZWxwZXIodGV4dCwgJGVsZW1lbnQsIGRpcmVjdGlvbik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH1cclxuXHJcblxyXG5cclxufSJdfQ==