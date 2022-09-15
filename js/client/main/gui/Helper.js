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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSGVscGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9tYWluL2d1aS9IZWxwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLFlBQVksQ0FBQztBQUtsQyxNQUFNLE9BQU8sTUFBTTtJQUVSLE1BQU0sQ0FBQyxVQUFVLENBQUMsSUFBWSxFQUFFLGFBQWtDLEVBQUUsU0FBMEI7UUFFakcsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ3RDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7UUFFNUcsT0FBTyxDQUFDLFFBQVEsQ0FBQyxlQUFlLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFFOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRTFELElBQUksRUFBRSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQztRQUNoQyxJQUFJLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFFdkIsSUFBSSxLQUFLLEdBQVcsRUFBRSxDQUFDO1FBRXZCLFFBQVEsU0FBUyxFQUFFO1lBQ2YsS0FBSyxRQUFRO2dCQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUM7b0JBQ3ZCLElBQUksRUFBRSxFQUFFLENBQUMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsS0FBSztvQkFDakQsTUFBTSxFQUFFLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsR0FBRyxHQUFHLEtBQUs7aUJBQ3RDLENBQUMsQ0FBQztnQkFD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QUFNLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDaEQ7U0FFSjtJQUVMLENBQUM7Q0FJSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBNYWluQmFzZSB9IGZyb20gXCIuLi9NYWluQmFzZS5qc1wiO1xyXG5cclxuZXhwb3J0IHR5cGUgSGVscGVyRGlyZWN0aW9uID0gXCJ0b3BcIiB8IFwiYm90dG9tXCIgfCBcImxlZnRcIiB8IFwicmlnaHRcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBIZWxwZXIge1xyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgb3BlbkhlbHBlcih0ZXh0OiBzdHJpbmcsIHRhcmdldEVsZW1lbnQ6IEpRdWVyeTxIVE1MRWxlbWVudD4sIGRpcmVjdGlvbjogSGVscGVyRGlyZWN0aW9uKSB7XHJcblxyXG4gICAgICAgIGxldCAkaGVscGVyID0galF1ZXJ5KCcuam9fYXJyb3dfYm94Jyk7XHJcbiAgICAgICAgJGhlbHBlci5yZW1vdmVDbGFzcyhbJ2pvX2Fycm93X2JveF9sZWZ0JywgJ2pvX2Fycm93X2JveF9yaWdodCcsICdqb19hcnJvd19ib3hfdG9wJywgJ2pvX2Fycm93X2JveF9ib3R0b20nXSk7XHJcblxyXG4gICAgICAgICRoZWxwZXIuYWRkQ2xhc3MoJ2pvX2Fycm93X2JveF8nICsgZGlyZWN0aW9uKTtcclxuXHJcbiAgICAgICAgJGhlbHBlci5jc3MoeyBsZWZ0OiAnJywgcmlnaHQ6ICcnLCB0b3A6ICcnLCBib3R0b206ICcnIH0pO1xyXG5cclxuICAgICAgICBsZXQgdG8gPSB0YXJnZXRFbGVtZW50Lm9mZnNldCgpO1xyXG4gICAgICAgIGxldCBiID0galF1ZXJ5KCdib2R5Jyk7XHJcblxyXG4gICAgICAgIGxldCBkZWx0YTogbnVtYmVyID0gMzQ7XHJcblxyXG4gICAgICAgIHN3aXRjaCAoZGlyZWN0aW9uKSB7XHJcbiAgICAgICAgICAgIGNhc2UgXCJib3R0b21cIjogJGhlbHBlci5jc3Moe1xyXG4gICAgICAgICAgICAgICAgbGVmdDogdG8ubGVmdCArIHRhcmdldEVsZW1lbnQud2lkdGgoKSAvIDIgLSBkZWx0YSxcclxuICAgICAgICAgICAgICAgIGJvdHRvbTogYi5oZWlnaHQoKSAtIHRvLnRvcCArIGRlbHRhXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJ0b3BcIjogJGhlbHBlci5jc3Moe1xyXG4gICAgICAgICAgICAgICAgbGVmdDogdG8ubGVmdCArIHRhcmdldEVsZW1lbnQud2lkdGgoKSAvIDIgLSBkZWx0YSxcclxuICAgICAgICAgICAgICAgIHRvcDogdG8udG9wICsgdGFyZ2V0RWxlbWVudC5oZWlnaHQoKSArIDI2XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGNhc2UgXCJsZWZ0XCI6ICRoZWxwZXIuY3NzKHtcclxuICAgICAgICAgICAgICAgIGxlZnQ6IHRvLmxlZnQgKyB0YXJnZXRFbGVtZW50LndpZHRoKCkgKyBkZWx0YSxcclxuICAgICAgICAgICAgICAgIHRvcDogdG8udG9wICsgdGFyZ2V0RWxlbWVudC5oZWlnaHQoKSAvIDIgLSBkZWx0YVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIFwicmlnaHRcIjogJGhlbHBlci5jc3Moe1xyXG4gICAgICAgICAgICAgICAgcmlnaHQ6IGIud2lkdGgoKSAtIHRvLmxlZnQsXHJcbiAgICAgICAgICAgICAgICB0b3A6IHRvLnRvcCArIHRhcmdldEVsZW1lbnQuaGVpZ2h0KCkgLyAyIC0gZGVsdGFcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgICRoZWxwZXIuZmluZCgnc3BhbicpLmh0bWwodGV4dCk7XHJcblxyXG4gICAgICAgIGxldCAkYnV0dG9uID0gJGhlbHBlci5maW5kKCcuam9fYnV0dG9uJyk7XHJcbiAgICAgICAgJGJ1dHRvbi5vbignY2xpY2snLCAoZSkgPT4ge1xyXG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAkYnV0dG9uLm9mZignY2xpY2snKTtcclxuICAgICAgICAgICAgSGVscGVyLmNsb3NlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICRoZWxwZXIuZmFkZUluKDgwMCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHN0YXRpYyBjbG9zZSgpIHtcclxuICAgICAgICBsZXQgJGhlbHBlciA9IGpRdWVyeSgnLmpvX2Fycm93X2JveCcpO1xyXG4gICAgICAgICRoZWxwZXIuZmFkZU91dCg4MDApO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICBzdGF0aWMgc2hvd0hlbHBlcihpZDogc3RyaW5nLCBtYWluQmFzZTogTWFpbkJhc2UsICRlbGVtZW50PzogSlF1ZXJ5PEhUTUxFbGVtZW50Pikge1xyXG5cclxuICAgICAgICBsZXQgbWFpbjogTWFpbjtcclxuICAgICAgICBpZihtYWluQmFzZSBpbnN0YW5jZW9mIE1haW4pe1xyXG4gICAgICAgICAgICBtYWluID0gbWFpbkJhc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGhlbHBlckhpc3RvcnkgPSBtYWluLnVzZXIuc2V0dGluZ3MhLmhlbHBlckhpc3Rvcnk7XHJcblxyXG4gICAgICAgIGlmIChpZCA9PSBcInNwZWVkQ29udHJvbEhlbHBlclwiICYmIGhlbHBlckhpc3RvcnlbXCJzcGVlZENvbnRyb2xIZWxwZXJEb25lXCJdKSB7XHJcbiAgICAgICAgICAgIGlkID0gXCJzdGVwQnV0dG9uSGVscGVyXCI7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgZmxhZyA9IGlkICsgXCJEb25lXCI7XHJcblxyXG4gICAgICAgIGlmIChoZWxwZXJIaXN0b3J5ICE9IG51bGwgJiYgKGhlbHBlckhpc3RvcnlbZmxhZ10gPT0gbnVsbCB8fCAhaGVscGVySGlzdG9yeVtmbGFnXSkpIHtcclxuICAgICAgICAgICAgaGVscGVySGlzdG9yeVtmbGFnXSA9IHRydWU7XHJcbiAgICAgICAgICAgIG1haW4ubmV0d29ya01hbmFnZXIuc2VuZFVwZGF0ZVVzZXJTZXR0aW5ncygoKSA9PiB7IH0pO1xyXG5cclxuICAgICAgICAgICAgbGV0IHRleHQ6IHN0cmluZyA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxldCBkaXJlY3Rpb246IEhlbHBlckRpcmVjdGlvbiA9IFwibGVmdFwiO1xyXG5cclxuICAgICAgICAgICAgc3dpdGNoIChpZCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInJlcG9zaXRvcnlCdXR0b25cIjpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gYFdlbm4gZGVyIGFrdHVlbGxlIFdvcmtzcGFjZSBtaXQgZWluZW0gUmVwb3NpdG9yeSB2ZXJrbsO8ZnQgaXN0LCBlcnNjaGVpbnQgaGllciBkZXIgXCJTeW5jaHJvbmlzaWVyZW4tQnV0dG9uXCIuIEVpbiBLbGljayBkYXJhdWYgw7ZmZm5ldCBlaW5lbiBEaWFsb2csIGluIGRlbSBkaWUgRGF0ZWllbiBkZXMgV29ya3NwYWNlIG1pdCBkZW5lbiBkZXMgUmVwb3NpdG9yeXMgYWJnZWdsaWNoZW4gd2VyZGVuIGvDtm5uZW4uYDtcclxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBcInRvcFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInNwZWVkQ29udHJvbEhlbHBlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBgTWl0IGRlbSBHZXNjaHdpbmRpZ2tlaXRzcmVnbGVyIGvDtm5uZW4gIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgU2llIGVpbnN0ZWxsZW4sIHdpZSBzY2huZWxsIGRhcyBQcm9ncmFtbSBhYmzDpHVmdC4gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBCZWkgR2VzY2h3aW5kaWdrZWl0ZW4gYmlzIDEwIFN0ZXBzL3Mgd2lyZCBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHfDpGhyZW5kIGRlcyBQcm9ncmFtbWFibGF1ZnMgZGVyIFByb2dyYW16ZWlnZXIgZ2V6ZWlndFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdW5kIGRpZSBBbnplaWdlIGRlciBWYXJpYWJsZW4gYXVmIGRlciBsaW5rZW4gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBTZWl0ZSBzdGV0cyBha3R1YWxpc2llcnQuYDtcclxuICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb24gPSBcInRvcFwiO1xyXG4gICAgICAgICAgICAgICAgICAgICRlbGVtZW50ID0gbWFpbi5pbnRlcnByZXRlci5jb250cm9sQnV0dG9ucy5zcGVlZENvbnRyb2wuJGdyaXA7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwibmV3RmlsZUhlbHBlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBgRXMgZ2lidCBub2NoIGtlaW5lIFByb2dyYW1tZGF0ZWkgaW0gV29ya3NwYWNlLiA8YnI+IE51dHplbiBTaWUgZGVuIEJ1dHRvbiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9J2ltZ19hZGQtZmlsZS1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiB1bSBlaW5lIFByb2dyYW1tZGF0ZWkgYW56dWxlZ2VuLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFwibGVmdFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcIm5ld1dvcmtzcGFjZUhlbHBlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBgRXMgZ2lidCBub2NoIGtlaW5lbiBXb3Jrc3BhY2UuIDxicj4gTnV0emVuIFNpZSBkZW4gQnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPSdpbWdfYWRkLXdvcmtzcGFjZS1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiB1bSBlaW5lbiBXb3Jrc3BhY2UgYW56dWxlZ2VuLlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFwibGVmdFwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImhvbWVCdXR0b25IZWxwZXJcIjpcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0ID0gXCJNaXQgZGVtIEhvbWUtQnV0dG9uIDxzcGFuIGNsYXNzPSdpbWdfaG9tZS1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiBrw7ZubmVuIFNpZSB3aWVkZXIgenUgSWhyZW4gZWlnZW5lbiBXb3Jrc3BhY2VzIHdlY2hzZWxuLlwiO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFwidG9wXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQgPSBqUXVlcnkoJy5pbWdfaG9tZS1kYXJrJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlIFwic3RlcEJ1dHRvbkhlbHBlclwiOlxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQgPSBgTWl0IGRlbiBCdXR0b25zIFwiU3RlcCBvdmVyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDxzcGFuIGNsYXNzPSdpbWdfc3RlcC1vdmVyLWRhcmsgam9faW5saW5lLWltYWdlJz48L3NwYW4+LCBUYXN0ZSBGOCksIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIlN0ZXAgaW50b1wiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAoPHNwYW4gY2xhc3M9J2ltZ19zdGVwLWludG8tZGFyayBqb19pbmxpbmUtaW1hZ2UnPjwvc3Bhbj4sIFRhc3RlIEY3KSB1bmQgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiU3RlcCBvdXRcIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKDxzcGFuIGNsYXNzPSdpbWdfc3RlcC1vdXQtZGFyayBqb19pbmxpbmUtaW1hZ2UnPjwvc3Bhbj4sIFRhc3RlIEY5KSAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGvDtm5uZW4gU2llIGRhcyBQcm9ncmFtbSBzY2hyaXR0d2Vpc2UgYXVzZsO8aHJlbiB1bmQgc2ljaCBuYWNoIGplZGVtIFNjaHJpdHQgZGllIEJlbGVndW5nIGRlciBWYXJpYWJsZW4gYW5zZWhlbi4gPGJyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8dWw+PGxpPjxzcGFuIGNsYXNzPSdpbWdfc3RlcC1vdmVyLWRhcmsgam9faW5saW5lLWltYWdlJz48L3NwYW4+IFN0ZXAgb3ZlciBmw7xocnQgZGVuIG7DpGNoc3RlbiBTY2hyaXR0IGF1cywgaW5zYmVzb25kZXJlIHdlcmRlbiBNZXRob2RlbmF1ZnJ1ZmUgaW4gZWluZW0gU2Nocml0dCBkdXJjaGdlZsO8aHJ0LjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48c3BhbiBjbGFzcz0naW1nX3N0ZXAtaW50by1kYXJrIGpvX2lubGluZS1pbWFnZSc+PC9zcGFuPiBTdGVwIGludG8gZsO8aHJ0IGF1Y2ggZGVuIG7DpGNoc3RlbiBTY2hyaXR0IGF1cywgZ2VodCBiZWkgTWV0aG9kZW5hdWZydWZlbiBhYmVyIGluIGRpZSBNZXRob2RlIGhpbmVpbiB1bmQgZsO8aHJ0IGF1Y2ggZGllIEFud2Vpc3VuZ2VuIGlubmVyaGFsYiBkZXIgTWV0aG9kZSBzY2hyaXR0d2Vpc2UgYXVzLjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaT48c3BhbiBjbGFzcz0naW1nX3N0ZXAtb3V0LWRhcmsgam9faW5saW5lLWltYWdlJz48L3NwYW4+IEJlZmluZGV0IHNpY2ggZGllIFByb2dyYW1tYXVzZsO8aHJ1bmcgaW5uZXJoYWxiIGVpbmVyIE1ldGhvZGUsIHNvIGJld2lya3QgZWluIEtsaWNrIGF1ZiBTdGVwIG91dCwgZGFzcyBkZXIgUmVzdCBkZXIgTWV0aG9kZSBhdXNnZWbDvGhydCB3aXJkIHVuZCBkaWUgUHJvZ3JhbW1hdXNmw7xocnVuZyBlcnN0IG5hY2ggZGVyIEF1ZnJ1ZnN0ZWxsZSBkZXIgTWV0aG9kZSBhbmjDpGx0LjwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGA7XHJcbiAgICAgICAgICAgICAgICAgICAgZGlyZWN0aW9uID0gXCJ0b3BcIjtcclxuICAgICAgICAgICAgICAgICAgICAkZWxlbWVudCA9IG1haW4uaW50ZXJwcmV0ZXIuY29udHJvbEJ1dHRvbnMuJGJ1dHRvblN0ZXBPdmVyO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImNvbnNvbGVIZWxwZXJcIjogXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dD1gXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEhpZXIga8O2bm5lbiBTaWUgQW53ZWlzdW5nZW4gb2RlciBUZXJtZSBlaW5nZWJlbiwgZGllIG5hY2ggQmVzdMOkdGlndW5nIG1pdCBkZXIgRW50ZXItVGFzdGUgYXVzZ2Vmw7xocnQvYXVzZ2V3ZXJ0ZXQgd2VyZGVuLiBEYXMgRXJnZWJuaXMgc2VoZW4gU2llIGltIEJlcmVpY2ggw7xiZXIgZGVyIEVpbmdhYmV6ZWlsZS4gPGJyPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBGYWxscyBkYXMgUHJvZ3JhbW0gZ2VyYWRlIHBhdXNpZXJ0ICh6LkIuIGJlaSBBdXNmw7xocnVuZyBpbiBFaW56ZWxzY2hyaXR0ZW4pIGvDtm5uZW4gU2llIGF1Y2ggYXVmIGRpZSBWYXJpYWJsZW4gZGVzIGFrdHVlbGxlbiBTaWNodGJhcmtlaXRzYmVyZWljaGVzIHp1Z3JlaWZlbi5cclxuICAgICAgICAgICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpcmVjdGlvbiA9IFwiYm90dG9tXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgJGVsZW1lbnQgPSBtYWluLmJvdHRvbURpdi5jb25zb2xlLiRjb25zb2xlVGFiLmZpbmQoJy5qb19tb25hY28tZWRpdG9yJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGlmICh0ZXh0ICE9IFwiXCIgJiYgJGVsZW1lbnQgIT0gbnVsbCAmJiAkZWxlbWVudC5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgICAgICBIZWxwZXIub3BlbkhlbHBlcih0ZXh0LCAkZWxlbWVudCwgZGlyZWN0aW9uKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuXHJcblxyXG59Il19