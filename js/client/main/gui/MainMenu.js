import { PasswordChanger } from "./UserMenu.js";
export class MainMenu {
    constructor(main) {
        this.main = main;
        this.currentSubmenu = {};
        this.openSubmenusOnMousemove = false;
    }
    initGUI(user) {
        let that = this;
        let editor = this.main.getMonacoEditor();
        let mainMenu = {
            items: [
                {
                    identifier: "Datei", subMenu: {
                        items: [
                            {
                                identifier: "Speichern und Beenden",
                                action: () => { jQuery('#buttonLogout').trigger("click"); }
                            },
                        ]
                    }
                },
                {
                    identifier: "Bearbeiten", subMenu: {
                        items: [
                            { identifier: "Rückgängig (Strg + z)", action: () => { editor.trigger(".", "undo", {}); } },
                            { identifier: "Wiederholen (Strg + y)", action: () => { editor.trigger(".", "redo", {}); } },
                            { identifier: "-" },
                            { identifier: "Kopieren (Strg + c)", action: () => { editor.getAction("editor.action.clipboardCopyAction").run(); } },
                            { identifier: "Ausschneiden (Strg + x)", action: () => { editor.getAction("editor.action.clipboardCutAction").run(); } },
                            { identifier: "Nach oben kopieren (Alt + Shift + Pfeil rauf)", action: () => { editor.getAction("editor.action.copyLinesUpAction").run(); } },
                            { identifier: "Nach unten kopieren (Alt + Shift + Pfeil runter)", action: () => { editor.getAction("editor.action.copyLinesDownAction").run(); } },
                            { identifier: "Nach oben verschieben (Alt + Pfeil rauf)", action: () => { editor.getAction("editor.action.moveLinesUpAction").run(); } },
                            { identifier: "Nach unten verschieben (Alt + Pfeil runter)", action: () => { editor.getAction("editor.action.moveLinesDownAction").run(); } },
                            { identifier: "-" },
                            { identifier: "Suchen... (Strg + f)", action: () => { editor.getAction("actions.find").run(); } },
                            { identifier: "Ersetzen... (Strg + h)", action: () => { editor.getAction("editor.action.startFindReplaceAction").run(); } },
                            { identifier: "-" },
                            { identifier: "Aus-/Einkommentieren (Strg + #)", action: () => { editor.getAction("editor.action.commentLine").run(); } },
                            { identifier: "Dokument formatieren (Alt + Shift + f)", action: () => { editor.getAction("editor.action.formatDocument").run(); } },
                            { identifier: "-" },
                            { identifier: "Finde zugehörige Klammer (Strg + k)", action: () => { editor.getAction("editor.action.jumpToBracket").run(); } },
                            { identifier: "-" },
                            { identifier: "Alles zusammenfalten", action: () => { editor.getAction("editor.foldAll").run(); } },
                            { identifier: "Alles auffalten", action: () => { editor.getAction("editor.unfoldAll").run(); } },
                            { identifier: "-" },
                            {
                                identifier: "Vorschlag auslösen (Strg + Leertaste)", action: () => {
                                    editor.focus();
                                    setTimeout(() => {
                                        editor.getAction("editor.action.triggerSuggest").run();
                                    }, 200);
                                }
                            },
                            { identifier: "Parameterhilfe (Strg + Shift + Leertaste)", action: () => { editor.getAction("editor.action.triggerParameterHints").run(); } },
                            {
                                identifier: "Gehe zur Definition (Strg + Click)", action: () => {
                                    editor.focus();
                                    setTimeout(() => {
                                        editor.getAction("editor.action.revealDefinition").run();
                                    }, 200);
                                }
                            },
                        ]
                    }
                },
                {
                    identifier: "Ansicht", subMenu: {
                        items: [
                            {
                                identifier: "Theme",
                                subMenu: {
                                    items: [
                                        {
                                            identifier: "Dark",
                                            action: () => {
                                                that.switchTheme("dark");
                                            }
                                        },
                                        {
                                            identifier: "Light",
                                            action: () => {
                                                that.switchTheme("light");
                                            }
                                        }
                                    ]
                                }
                            },
                            { identifier: "-" },
                            { identifier: "Hoher Kontrast im Editor ein/aus", action: () => { editor.getAction("editor.action.toggleHighContrast").run(); } },
                            { identifier: "-" },
                            { identifier: "Zoom out (Strg + Mausrad)", action: () => { this.main.editor.changeEditorFontSize(-4); } },
                            { identifier: "Zoom normal", action: () => { this.main.editor.setFontSize(14); } },
                            { identifier: "Zoom in (Strg + Mausrad)", action: () => { this.main.editor.changeEditorFontSize(4); } },
                        ]
                    }
                },
                {
                    identifier: "Repository", subMenu: {
                        items: [
                            {
                                identifier: "Eigene Repositories verwalten ...",
                                action: () => { this.main.repositoryUpdateManager.show(null); }
                            },
                            {
                                identifier: "Workspace mit Repository verbinden (checkout) ...",
                                action: () => { this.main.repositoryCheckoutManager.show(null); }
                            },
                        ]
                    }
                },
                {
                    identifier: "Hilfe", subMenu: {
                        items: [
                            {
                                identifier: "Kurze Video-Tutorials zur Bedienung dieser IDE",
                                link: "https://www.learnj.de/doku.php?id=api:ide_manual:start"
                            },
                            {
                                identifier: "Interaktives Java-Tutorial mit vielen Beispielen",
                                link: "https://www.learnj.de/doku.php"
                            },
                            { identifier: "-" },
                            {
                                identifier: "API-Dokumentation",
                                link: "https://www.learnj.de/doku.php?id=api:documentation:start"
                                // link: "api_documentation.html"
                            },
                            {
                                identifier: "API-Verzeichnis",
                                //link: "https://www.learnj.de/doku.php?id=api:documentation:start"
                                link: "api_documentation.html"
                            },
                            { identifier: "-" },
                            {
                                identifier: "Sprite-Bilderübersicht",
                                link: "spriteLibrary.html"
                            },
                            { identifier: "-" },
                            {
                                identifier: "Tastaturkommandos (Shortcuts)",
                                link: "shortcuts.html"
                            },
                            { identifier: "-" },
                            {
                                identifier: "Java-Online Changelog",
                                link: "https://www.learnj.de/doku.php?id=javaonline:changelog"
                            },
                            {
                                identifier: "Java-Online Roadmap",
                                link: "https://www.learnj.de/doku.php?id=javaonline:roadmap"
                            },
                            { identifier: "-" },
                            {
                                identifier: "Befehlspalette",
                                action: () => {
                                    setTimeout(() => {
                                        editor.getAction("editor.action.quickCommand").run();
                                    }, 500);
                                }
                            },
                            { identifier: "-" },
                            {
                                identifier: "Passwort ändern...",
                                action: () => {
                                    let passwortChanger = new PasswordChanger(that.main);
                                    passwortChanger.show();
                                }
                            },
                            { identifier: "-" },
                            {
                                identifier: "Über die Online-IDE...",
                                link: "https://www.learnj.de/doku.php?id=javaonline:ueber"
                            }
                        ]
                    }
                },
            ]
        };
        if (user != null && (user.is_admin || user.is_schooladmin || user.is_teacher)) {
            mainMenu.items[0].subMenu.items.push({
                identifier: "Schulen/Klassen/Benutzer ...",
                link: "administration_mc.html"
            });
        }
        if (user != null && (user.is_admin)) {
            mainMenu.items[0].subMenu.items.push({
                identifier: "Serverauslastung ...",
                link: "statistics.html"
            });
        }
        jQuery('#mainmenu').empty();
        this.initMenu(mainMenu, 0);
    }
    switchTheme(theme) {
        this.main.viewModeController.setTheme(theme);
    }
    initMenu(menu, level) {
        menu.level = level;
        if (level == 0) {
            menu.$element = jQuery('#mainmenu');
        }
        else {
            menu.$element = jQuery('<div class="jo_submenu"></div>');
            jQuery('body').append(menu.$element);
        }
        menu.$element.data('model', menu);
        for (let mi of menu.items) {
            if (mi.identifier == '-') {
                mi.$element = jQuery('<div class="jo_menuitemdivider"></div>');
            }
            else {
                mi.$element = jQuery('<div>' + mi.identifier + '</div>');
                if (mi.link != null) {
                    let $link = jQuery('<a href="' + mi.link + '" target="_blank" class="jo_menulink"></a>');
                    $link.on("mousedown", (event) => {
                        event.stopPropagation();
                        setTimeout(() => {
                            menu.$element.hide();
                        }, 500);
                    });
                    $link.append(mi.$element);
                    mi.$element = $link;
                }
                if (mi.subMenu != null) {
                    this.initMenu(mi.subMenu, level + 1);
                }
                this.initMenuitemCallbacks(menu, mi);
                if (level == 0) {
                    mi.$element.addClass('jo_mainmenuitem');
                }
            }
            menu.$element.append(mi.$element);
            mi.$element.data('model', mi);
        }
        let that = this;
        jQuery(document).on('mousedown', () => {
            for (let i = 0; i < 5; i++) {
                if (that.currentSubmenu[i] != null) {
                    that.currentSubmenu[i].hide();
                    that.currentSubmenu[i] = null;
                }
            }
            that.openSubmenusOnMousemove = false;
        });
    }
    initMenuitemCallbacks(menu, mi) {
        let that = this;
        if (mi.action != null) {
            mi.$element.on('mousedown', (ev) => { mi.action(mi.identifier); });
        }
        if (mi.subMenu != null) {
            mi.$element.on('mousedown', (ev) => {
                that.opensubmenu(mi);
                that.openSubmenusOnMousemove = true;
                ev.stopPropagation();
            });
            mi.$element.on('mousemove.mainmenu', () => {
                if (that.openSubmenusOnMousemove) {
                    that.opensubmenu(mi);
                }
                else {
                    if (that.currentSubmenu[menu.level + 1] != null) {
                        that.currentSubmenu[menu.level + 1].hide();
                        that.currentSubmenu[menu.level + 1] = null;
                    }
                }
            });
        }
        else {
            mi.$element.on('mousemove.mainmenu', () => {
                if (that.currentSubmenu[menu.level + 1] != null) {
                    that.currentSubmenu[menu.level + 1].hide();
                    that.currentSubmenu[menu.level + 1] = null;
                }
            });
        }
    }
    opensubmenu(mi) {
        let subMenu = mi.subMenu;
        let left;
        let top;
        if (subMenu.level == 1) {
            left = mi.$element.position().left;
            top = 30;
        }
        else {
            left = mi.$element.offset().left + mi.$element.width();
            top = mi.$element.offset().top;
        }
        subMenu.$element.css({
            top: "" + top + "px",
            left: "" + left + "px"
        });
        if (this.currentSubmenu[subMenu.level] != null) {
            this.currentSubmenu[subMenu.level].hide();
        }
        subMenu.$element.show();
        this.currentSubmenu[subMenu.level] = subMenu.$element;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbk1lbnUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL01haW5NZW51LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFrQmhELE1BQU0sT0FBTyxRQUFRO0lBRWpCLFlBQW9CLElBQVU7UUFBVixTQUFJLEdBQUosSUFBSSxDQUFNO1FBSzlCLG1CQUFjLEdBQTZDLEVBQUUsQ0FBQztRQUM5RCw0QkFBdUIsR0FBWSxLQUFLLENBQUM7SUFKekMsQ0FBQztJQU1ELE9BQU8sQ0FBQyxJQUFjO1FBRWxCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXpDLElBQUksUUFBUSxHQUFTO1lBQ2pCLEtBQUssRUFBRTtnQkFDSDtvQkFDSSxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFDNUI7d0JBQ0ksS0FBSyxFQUFFOzRCQUNIO2dDQUNJLFVBQVUsRUFBRSx1QkFBdUI7Z0NBQ25DLE1BQU0sRUFBRSxHQUFHLEVBQUUsR0FBRyxNQUFNLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzs2QkFDOUQ7eUJBRUo7cUJBQ0o7aUJBQ0o7Z0JBQ0Q7b0JBQ0ksVUFBVSxFQUFFLFlBQVksRUFBRSxPQUFPLEVBQ2pDO3dCQUNJLEtBQUssRUFBRTs0QkFDSCxFQUFFLFVBQVUsRUFBRSx1QkFBdUIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFOzRCQUMzRixFQUFFLFVBQVUsRUFBRSx3QkFBd0IsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcs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SSxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkQsR0FBRyxHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDO1NBQ2xDO1FBRUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7WUFDakIsR0FBRyxFQUFFLEVBQUUsR0FBRyxHQUFHLEdBQUcsSUFBSTtZQUNwQixJQUFJLEVBQUUsRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJO1NBQ3pCLENBQUMsQ0FBQTtRQUVGLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksSUFBSSxFQUFFO1lBQzVDLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1NBQzdDO1FBRUQsT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDO0lBQzFELENBQUM7Q0FJSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1haW4gfSBmcm9tIFwiLi4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBVc2VyRGF0YSB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgUGFzc3dvcmRDaGFuZ2VyIH0gZnJvbSBcIi4vVXNlck1lbnUuanNcIjtcclxuXHJcbmV4cG9ydCB0eXBlIEFjdGlvbiA9IChpZGVudGlmaWVyOiBzdHJpbmcpID0+IHZvaWQ7XHJcblxyXG50eXBlIE1lbnUgPSB7XHJcbiAgICBpdGVtczogTWVudUl0ZW1bXTtcclxuICAgICRlbGVtZW50PzogSlF1ZXJ5PEhUTUxFbGVtZW50PjtcclxuICAgIGxldmVsPzogbnVtYmVyO1xyXG59XHJcblxyXG50eXBlIE1lbnVJdGVtID0ge1xyXG4gICAgaWRlbnRpZmllcjogc3RyaW5nO1xyXG4gICAgJGVsZW1lbnQ/OiBKUXVlcnk8SFRNTEVsZW1lbnQ+O1xyXG4gICAgYWN0aW9uPzogQWN0aW9uO1xyXG4gICAgbGluaz86IHN0cmluZztcclxuICAgIHN1Yk1lbnU/OiBNZW51O1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgTWFpbk1lbnUge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbikge1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgY3VycmVudFN1Ym1lbnU6IHsgW2xldmVsOiBudW1iZXJdOiBKUXVlcnk8SFRNTEVsZW1lbnQ+IH0gPSB7fTtcclxuICAgIG9wZW5TdWJtZW51c09uTW91c2Vtb3ZlOiBib29sZWFuID0gZmFsc2U7XHJcblxyXG4gICAgaW5pdEdVSSh1c2VyOiBVc2VyRGF0YSkge1xyXG5cclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcbiAgICAgICAgbGV0IGVkaXRvciA9IHRoaXMubWFpbi5nZXRNb25hY29FZGl0b3IoKTtcclxuXHJcbiAgICAgICAgbGV0IG1haW5NZW51OiBNZW51ID0ge1xyXG4gICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiRGF0ZWlcIiwgc3ViTWVudTpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJTcGVpY2hlcm4gdW5kIEJlZW5kZW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHsgalF1ZXJ5KCcjYnV0dG9uTG9nb3V0JykudHJpZ2dlcihcImNsaWNrXCIpOyB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJCZWFyYmVpdGVuXCIsIHN1Yk1lbnU6XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIlLDvGNrZ8OkbmdpZyAoU3RyZyArIHopXCIsIGFjdGlvbjogKCkgPT4geyBlZGl0b3IudHJpZ2dlcihcIi5cIiwgXCJ1bmRvXCIsIHt9KTsgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIldpZWRlcmhvbGVuIChTdHJnICsgeSlcIiwgYWN0aW9uOiAoKSA9PiB7IGVkaXRvci50cmlnZ2VyKFwiLlwiLCBcInJlZG9cIiwge30pOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiLVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiS29waWVyZW4gKFN0cmcgKyBjKVwiLCBhY3Rpb246ICgpID0+IHsgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5hY3Rpb24uY2xpcGJvYXJkQ29weUFjdGlvblwiKS5ydW4oKTsgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIkF1c3NjaG5laWRlbiAoU3RyZyArIHgpXCIsIGFjdGlvbjogKCkgPT4geyBlZGl0b3IuZ2V0QWN0aW9uKFwiZWRpdG9yLmFjdGlvbi5jbGlwYm9hcmRDdXRBY3Rpb25cIikucnVuKCk7IH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJOYWNoIG9iZW4ga29waWVyZW4gKEFsdCArIFNoaWZ0ICsgUGZlaWwgcmF1ZilcIiwgYWN0aW9uOiAoKSA9PiB7IGVkaXRvci5nZXRBY3Rpb24oXCJlZGl0b3IuYWN0aW9uLmNvcHlMaW5lc1VwQWN0aW9uXCIpLnJ1bigpOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTmFjaCB1bnRlbiBrb3BpZXJlbiAoQWx0ICsgU2hpZnQgKyBQZmVpbCBydW50ZXIpXCIsIGFjdGlvbjogKCkgPT4geyBlZGl0b3IuZ2V0QWN0aW9uKFwiZWRpdG9yLmFjdGlvbi5jb3B5TGluZXNEb3duQWN0aW9uXCIpLnJ1bigpOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiTmFjaCBvYmVuIHZlcnNjaGllYmVuIChBbHQgKyBQZmVpbCByYXVmKVwiLCBhY3Rpb246ICgpID0+IHsgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5hY3Rpb24ubW92ZUxpbmVzVXBBY3Rpb25cIikucnVuKCk7IH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJOYWNoIHVudGVuIHZlcnNjaGllYmVuIChBbHQgKyBQZmVpbCBydW50ZXIpXCIsIGFjdGlvbjogKCkgPT4geyBlZGl0b3IuZ2V0QWN0aW9uKFwiZWRpdG9yLmFjdGlvbi5tb3ZlTGluZXNEb3duQWN0aW9uXCIpLnJ1bigpOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiLVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiU3VjaGVuLi4uIChTdHJnICsgZilcIiwgYWN0aW9uOiAoKSA9PiB7IGVkaXRvci5nZXRBY3Rpb24oXCJhY3Rpb25zLmZpbmRcIikucnVuKCk7IH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJFcnNldHplbi4uLiAoU3RyZyArIGgpXCIsIGFjdGlvbjogKCkgPT4geyBlZGl0b3IuZ2V0QWN0aW9uKFwiZWRpdG9yLmFjdGlvbi5zdGFydEZpbmRSZXBsYWNlQWN0aW9uXCIpLnJ1bigpOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiLVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiQXVzLS9FaW5rb21tZW50aWVyZW4gKFN0cmcgKyAjKVwiLCBhY3Rpb246ICgpID0+IHsgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5hY3Rpb24uY29tbWVudExpbmVcIikucnVuKCk7IH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJEb2t1bWVudCBmb3JtYXRpZXJlbiAoQWx0ICsgU2hpZnQgKyBmKVwiLCBhY3Rpb246ICgpID0+IHsgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5hY3Rpb24uZm9ybWF0RG9jdW1lbnRcIikucnVuKCk7IH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCItXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJGaW5kZSB6dWdlaMO2cmlnZSBLbGFtbWVyIChTdHJnICsgaylcIiwgYWN0aW9uOiAoKSA9PiB7IGVkaXRvci5nZXRBY3Rpb24oXCJlZGl0b3IuYWN0aW9uLmp1bXBUb0JyYWNrZXRcIikucnVuKCk7IH0gfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCItXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJBbGxlcyB6dXNhbW1lbmZhbHRlblwiLCBhY3Rpb246ICgpID0+IHsgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5mb2xkQWxsXCIpLnJ1bigpOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiQWxsZXMgYXVmZmFsdGVuXCIsIGFjdGlvbjogKCkgPT4geyBlZGl0b3IuZ2V0QWN0aW9uKFwiZWRpdG9yLnVuZm9sZEFsbFwiKS5ydW4oKTsgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIi1cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiVm9yc2NobGFnIGF1c2zDtnNlbiAoU3RyZyArIExlZXJ0YXN0ZSlcIiwgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5mb2N1cygpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVkaXRvci5nZXRBY3Rpb24oXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJTdWdnZXN0XCIpLnJ1bigpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAyMDApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiUGFyYW1ldGVyaGlsZmUgKFN0cmcgKyBTaGlmdCArIExlZXJ0YXN0ZSlcIiwgYWN0aW9uOiAoKSA9PiB7IGVkaXRvci5nZXRBY3Rpb24oXCJlZGl0b3IuYWN0aW9uLnRyaWdnZXJQYXJhbWV0ZXJIaW50c1wiKS5ydW4oKTsgfSB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiR2VoZSB6dXIgRGVmaW5pdGlvbiAoU3RyZyArIENsaWNrKVwiLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5hY3Rpb24ucmV2ZWFsRGVmaW5pdGlvblwiKS5ydW4oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMjAwKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJBbnNpY2h0XCIsIHN1Yk1lbnU6XHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiVGhlbWVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdWJNZW51OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJEYXJrXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQuc3dpdGNoVGhlbWUoXCJkYXJrXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJMaWdodFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0LnN3aXRjaFRoZW1lKFwibGlnaHRcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCItXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJIb2hlciBLb250cmFzdCBpbSBFZGl0b3IgZWluL2F1c1wiLCBhY3Rpb246ICgpID0+IHsgZWRpdG9yLmdldEFjdGlvbihcImVkaXRvci5hY3Rpb24udG9nZ2xlSGlnaENvbnRyYXN0XCIpLnJ1bigpOyB9IH0sXHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIi1cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIlpvb20gb3V0IChTdHJnICsgTWF1c3JhZClcIiwgYWN0aW9uOiAoKSA9PiB7IHRoaXMubWFpbi5lZGl0b3IuY2hhbmdlRWRpdG9yRm9udFNpemUoLTQpOyB9IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiWm9vbSBub3JtYWxcIiwgYWN0aW9uOiAoKSA9PiB7IHRoaXMubWFpbi5lZGl0b3Iuc2V0Rm9udFNpemUoMTQpOyB9fSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJab29tIGluIChTdHJnICsgTWF1c3JhZClcIiwgYWN0aW9uOiAoKSA9PiB7IHRoaXMubWFpbi5lZGl0b3IuY2hhbmdlRWRpdG9yRm9udFNpemUoNCk7IH0gfSxcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiUmVwb3NpdG9yeVwiLCBzdWJNZW51OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJFaWdlbmUgUmVwb3NpdG9yaWVzIHZlcndhbHRlbiAuLi5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHt0aGlzLm1haW4ucmVwb3NpdG9yeVVwZGF0ZU1hbmFnZXIuc2hvdyhudWxsKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJXb3Jrc3BhY2UgbWl0IFJlcG9zaXRvcnkgdmVyYmluZGVuIChjaGVja291dCkgLi4uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB7dGhpcy5tYWluLnJlcG9zaXRvcnlDaGVja291dE1hbmFnZXIuc2hvdyhudWxsKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiSGlsZmVcIiwgc3ViTWVudTpcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJLdXJ6ZSBWaWRlby1UdXRvcmlhbHMgenVyIEJlZGllbnVuZyBkaWVzZXIgSURFXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluazogXCJodHRwczovL3d3dy5sZWFybmouZGUvZG9rdS5waHA/aWQ9YXBpOmlkZV9tYW51YWw6c3RhcnRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcIkludGVyYWt0aXZlcyBKYXZhLVR1dG9yaWFsIG1pdCB2aWVsZW4gQmVpc3BpZWxlblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiaHR0cHM6Ly93d3cubGVhcm5qLmRlL2Rva3UucGhwXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiLVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJBUEktRG9rdW1lbnRhdGlvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiaHR0cHM6Ly93d3cubGVhcm5qLmRlL2Rva3UucGhwP2lkPWFwaTpkb2N1bWVudGF0aW9uOnN0YXJ0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBsaW5rOiBcImFwaV9kb2N1bWVudGF0aW9uLmh0bWxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcIkFQSS1WZXJ6ZWljaG5pc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vbGluazogXCJodHRwczovL3d3dy5sZWFybmouZGUvZG9rdS5waHA/aWQ9YXBpOmRvY3VtZW50YXRpb246c3RhcnRcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiYXBpX2RvY3VtZW50YXRpb24uaHRtbFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIi1cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiU3ByaXRlLUJpbGRlcsO8YmVyc2ljaHRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcInNwcml0ZUxpYnJhcnkuaHRtbFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIi1cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiVGFzdGF0dXJrb21tYW5kb3MgKFNob3J0Y3V0cylcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcInNob3J0Y3V0cy5odG1sXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiLVwiIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJKYXZhLU9ubGluZSBDaGFuZ2Vsb2dcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcImh0dHBzOi8vd3d3LmxlYXJuai5kZS9kb2t1LnBocD9pZD1qYXZhb25saW5lOmNoYW5nZWxvZ1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiSmF2YS1PbmxpbmUgUm9hZG1hcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiaHR0cHM6Ly93d3cubGVhcm5qLmRlL2Rva3UucGhwP2lkPWphdmFvbmxpbmU6cm9hZG1hcFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIi1cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiQmVmZWhsc3BhbGV0dGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZGl0b3IuZ2V0QWN0aW9uKFwiZWRpdG9yLmFjdGlvbi5xdWlja0NvbW1hbmRcIikucnVuKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDUwMCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCItXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcIlBhc3N3b3J0IMOkbmRlcm4uLi5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHBhc3N3b3J0Q2hhbmdlciA9IG5ldyBQYXNzd29yZENoYW5nZXIodGhhdC5tYWluKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFzc3dvcnRDaGFuZ2VyLnNob3coKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIi1cIiB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkZW50aWZpZXI6IFwiw5xiZXIgZGllIE9ubGluZS1JREUuLi5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW5rOiBcImh0dHBzOi8vd3d3LmxlYXJuai5kZS9kb2t1LnBocD9pZD1qYXZhb25saW5lOnVlYmVyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG5cclxuICAgICAgICAgICAgICAgIC8vICxcclxuICAgICAgICAgICAgICAgIC8vIHtcclxuICAgICAgICAgICAgICAgIC8vICAgICBpZGVudGlmaWVyOiBcIkJlYXJiZWl0ZW5cIiwgc3ViTWVudTpcclxuICAgICAgICAgICAgICAgIC8vICAgICB7XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiVW5kb1wiIH0sXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiUmVkb1wiIH0sXHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwiS29waWVyZW5cIiB9LFxyXG4gICAgICAgICAgICAgICAgLy8gICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIkZvcm1hdGllcmVuXCJ9XHJcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIC8vICAgICB9XHJcbiAgICAgICAgICAgICAgICAvLyB9LFxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHVzZXIgIT0gbnVsbCAmJiAodXNlci5pc19hZG1pbiB8fCB1c2VyLmlzX3NjaG9vbGFkbWluIHx8IHVzZXIuaXNfdGVhY2hlcikpIHtcclxuICAgICAgICAgICAgbWFpbk1lbnUuaXRlbXNbMF0uc3ViTWVudS5pdGVtcy5wdXNoKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBcIlNjaHVsZW4vS2xhc3Nlbi9CZW51dHplciAuLi5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxpbms6IFwiYWRtaW5pc3RyYXRpb25fbWMuaHRtbFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHVzZXIgIT0gbnVsbCAmJiAodXNlci5pc19hZG1pbiApKSB7XHJcbiAgICAgICAgICAgIG1haW5NZW51Lml0ZW1zWzBdLnN1Yk1lbnUuaXRlbXMucHVzaChcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWRlbnRpZmllcjogXCJTZXJ2ZXJhdXNsYXN0dW5nIC4uLlwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGluazogXCJzdGF0aXN0aWNzLmh0bWxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIClcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI21haW5tZW51JykuZW1wdHkoKTtcclxuICAgICAgICB0aGlzLmluaXRNZW51KG1haW5NZW51LCAwKTtcclxuICAgIH1cclxuXHJcbiAgICBzd2l0Y2hUaGVtZSh0aGVtZTogc3RyaW5nKSB7XHJcbiAgICAgICAgdGhpcy5tYWluLnZpZXdNb2RlQ29udHJvbGxlci5zZXRUaGVtZSh0aGVtZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaW5pdE1lbnUobWVudTogTWVudSwgbGV2ZWw/OiBudW1iZXIpIHtcclxuXHJcbiAgICAgICAgbWVudS5sZXZlbCA9IGxldmVsO1xyXG5cclxuICAgICAgICBpZiAobGV2ZWwgPT0gMCkge1xyXG4gICAgICAgICAgICBtZW51LiRlbGVtZW50ID0galF1ZXJ5KCcjbWFpbm1lbnUnKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtZW51LiRlbGVtZW50ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fc3VibWVudVwiPjwvZGl2PicpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJ2JvZHknKS5hcHBlbmQobWVudS4kZWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZW51LiRlbGVtZW50LmRhdGEoJ21vZGVsJywgbWVudSk7XHJcbiAgICAgICAgZm9yIChsZXQgbWkgb2YgbWVudS5pdGVtcykge1xyXG4gICAgICAgICAgICBpZiAobWkuaWRlbnRpZmllciA9PSAnLScpIHtcclxuICAgICAgICAgICAgICAgIG1pLiRlbGVtZW50ID0galF1ZXJ5KCc8ZGl2IGNsYXNzPVwiam9fbWVudWl0ZW1kaXZpZGVyXCI+PC9kaXY+Jyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBtaS4kZWxlbWVudCA9IGpRdWVyeSgnPGRpdj4nICsgbWkuaWRlbnRpZmllciArICc8L2Rpdj4nKTtcclxuICAgICAgICAgICAgICAgIGlmIChtaS5saW5rICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgJGxpbmsgPSBqUXVlcnkoJzxhIGhyZWY9XCInICsgbWkubGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIiBjbGFzcz1cImpvX21lbnVsaW5rXCI+PC9hPicpO1xyXG4gICAgICAgICAgICAgICAgICAgICRsaW5rLm9uKFwibW91c2Vkb3duXCIsIChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW51LiRlbGVtZW50LmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSwgNTAwKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgICRsaW5rLmFwcGVuZChtaS4kZWxlbWVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgbWkuJGVsZW1lbnQgPSAkbGluaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChtaS5zdWJNZW51ICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmluaXRNZW51KG1pLnN1Yk1lbnUsIGxldmVsICsgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB0aGlzLmluaXRNZW51aXRlbUNhbGxiYWNrcyhtZW51LCBtaSk7XHJcbiAgICAgICAgICAgICAgICBpZiAobGV2ZWwgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgIG1pLiRlbGVtZW50LmFkZENsYXNzKCdqb19tYWlubWVudWl0ZW0nKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBtZW51LiRlbGVtZW50LmFwcGVuZChtaS4kZWxlbWVudCk7XHJcbiAgICAgICAgICAgIG1pLiRlbGVtZW50LmRhdGEoJ21vZGVsJywgbWkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG4gICAgICAgIGpRdWVyeShkb2N1bWVudCkub24oJ21vdXNlZG93bicsICgpID0+IHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCA1OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGF0LmN1cnJlbnRTdWJtZW51W2ldICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRTdWJtZW51W2ldLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRTdWJtZW51W2ldID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGF0Lm9wZW5TdWJtZW51c09uTW91c2Vtb3ZlID0gZmFsc2U7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGluaXRNZW51aXRlbUNhbGxiYWNrcyhtZW51OiBNZW51LCBtaTogTWVudUl0ZW0pIHtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGlmIChtaS5hY3Rpb24gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICBtaS4kZWxlbWVudC5vbignbW91c2Vkb3duJywgKGV2KSA9PiB7IG1pLmFjdGlvbihtaS5pZGVudGlmaWVyKTsgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWkuc3ViTWVudSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIG1pLiRlbGVtZW50Lm9uKCdtb3VzZWRvd24nLCAoZXYpID0+IHtcclxuICAgICAgICAgICAgICAgIHRoYXQub3BlbnN1Ym1lbnUobWkpO1xyXG4gICAgICAgICAgICAgICAgdGhhdC5vcGVuU3VibWVudXNPbk1vdXNlbW92ZSA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICBldi5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICBtaS4kZWxlbWVudC5vbignbW91c2Vtb3ZlLm1haW5tZW51JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQub3BlblN1Ym1lbnVzT25Nb3VzZW1vdmUpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm9wZW5zdWJtZW51KG1pKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoYXQuY3VycmVudFN1Ym1lbnVbbWVudS5sZXZlbCArIDFdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50U3VibWVudVttZW51LmxldmVsICsgMV0uaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRTdWJtZW51W21lbnUubGV2ZWwgKyAxXSA9IG51bGw7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBtaS4kZWxlbWVudC5vbignbW91c2Vtb3ZlLm1haW5tZW51JywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoYXQuY3VycmVudFN1Ym1lbnVbbWVudS5sZXZlbCArIDFdICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0LmN1cnJlbnRTdWJtZW51W21lbnUubGV2ZWwgKyAxXS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5jdXJyZW50U3VibWVudVttZW51LmxldmVsICsgMV0gPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIG9wZW5zdWJtZW51KG1pOiBNZW51SXRlbSkge1xyXG5cclxuICAgICAgICBsZXQgc3ViTWVudSA9IG1pLnN1Yk1lbnU7XHJcblxyXG4gICAgICAgIGxldCBsZWZ0OiBudW1iZXI7XHJcbiAgICAgICAgbGV0IHRvcDogbnVtYmVyO1xyXG4gICAgICAgIGlmIChzdWJNZW51LmxldmVsID09IDEpIHtcclxuICAgICAgICAgICAgbGVmdCA9IG1pLiRlbGVtZW50LnBvc2l0aW9uKCkubGVmdDtcclxuICAgICAgICAgICAgdG9wID0gMzA7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgbGVmdCA9IG1pLiRlbGVtZW50Lm9mZnNldCgpLmxlZnQgKyBtaS4kZWxlbWVudC53aWR0aCgpO1xyXG4gICAgICAgICAgICB0b3AgPSBtaS4kZWxlbWVudC5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBzdWJNZW51LiRlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgICAgIHRvcDogXCJcIiArIHRvcCArIFwicHhcIixcclxuICAgICAgICAgICAgbGVmdDogXCJcIiArIGxlZnQgKyBcInB4XCJcclxuICAgICAgICB9KVxyXG5cclxuICAgICAgICBpZiAodGhpcy5jdXJyZW50U3VibWVudVtzdWJNZW51LmxldmVsXSAhPSBudWxsKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFN1Ym1lbnVbc3ViTWVudS5sZXZlbF0uaGlkZSgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgc3ViTWVudS4kZWxlbWVudC5zaG93KCk7XHJcbiAgICAgICAgdGhpcy5jdXJyZW50U3VibWVudVtzdWJNZW51LmxldmVsXSA9IHN1Yk1lbnUuJGVsZW1lbnQ7XHJcbiAgICB9XHJcblxyXG5cclxuXHJcbn1cclxuIl19