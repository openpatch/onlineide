import { ajax } from "../communication/AjaxHelper.js";
import { InterpreterState } from "../interpreter/Interpreter.js";
import { SoundTools } from "../tools/SoundTools.js";
import { UserMenu } from "./gui/UserMenu.js";
import { escapeHtml } from "../tools/StringTools.js";
export class Login {
    constructor(main) {
        this.main = main;
    }
    initGUI() {
        let that = this;
        this.startAnimations();
        let $loginSpinner = jQuery('#login-spinner>img');
        jQuery('#login-username').focus();
        jQuery('#login-username').on('keydown', (e) => {
            if (e.key == "Enter") {
                jQuery('#login-password').focus();
            }
        });
        jQuery('#login-password').on('keydown', (e) => {
            if (e.key == "Enter") {
                jQuery('#login-button').trigger('click');
            }
        });
        jQuery('#login-password').on('keydown', (e) => {
            if (e.key == "Tab") {
                e.preventDefault();
                jQuery('#login-button').focus();
                jQuery('#login-button').addClass('jo_active');
            }
            if (e.key == "Enter") {
                jQuery('#login-button').trigger('click');
            }
        });
        jQuery('#login-button').on('keydown', (e) => {
            if (e.key == "Tab") {
                e.preventDefault();
                jQuery('#login-username').focus();
                jQuery('#login-button').removeClass('jo_active');
            }
            else {
                jQuery('#login-button').trigger('click');
            }
        });
        jQuery('#jo_testuser-login-button').on('click', () => {
            jQuery('#login-username').val('Testuser');
            jQuery('#login-password').val('');
            jQuery('#login-button').trigger('click');
        });
        // Avoid double login when user does doubleclick:
        let loginHappened = false;
        jQuery('#login-button').on('click', () => {
            SoundTools.init();
            $loginSpinner.show();
            if (loginHappened)
                return;
            loginHappened = true;
            setTimeout(() => {
                loginHappened = false;
            }, 1000);
            let loginRequest = {
                username: jQuery('#login-username').val(),
                password: jQuery('#login-password').val(),
                language: 0
            };
            ajax('login', loginRequest, (response) => {
                if (!response.success) {
                    jQuery('#login-message').html('Fehler: Benutzername und/oder Passwort ist falsch.');
                }
                else {
                    // We don't do this anymore for security reasons - see AjaxHelper.ts
                    // Alternatively we now set a long expiry interval for cookie.
                    // credentials.username = loginRequest.username;
                    // credentials.password = loginRequest.password;
                    jQuery('#login').hide();
                    jQuery('#main').css('visibility', 'visible');
                    jQuery('#bitteWartenText').html('Bitte warten ...');
                    jQuery('#bitteWarten').css('display', 'flex');
                    let user = response.user;
                    user.is_testuser = loginRequest.username == "Testuser" && loginRequest.password == "";
                    if (user.settings == null || user.settings.helperHistory == null) {
                        user.settings = {
                            helperHistory: {
                                consoleHelperDone: false,
                                newFileHelperDone: false,
                                newWorkspaceHelperDone: false,
                                speedControlHelperDone: false,
                                homeButtonHelperDone: false,
                                stepButtonHelperDone: false,
                                repositoryButtonDone: false
                            },
                            viewModes: null,
                            classDiagram: null
                        };
                    }
                    this.main.waitForGUICallback = () => {
                        var _a, _b, _c, _d;
                        that.main.mainMenu.initGUI(user);
                        jQuery('#bitteWarten').hide();
                        $loginSpinner.hide();
                        jQuery('#menupanel-username').html(escapeHtml(user.rufname) + " " + escapeHtml(user.familienname));
                        new UserMenu(that.main).init();
                        if (user.is_teacher) {
                            that.main.initTeacherExplorer(response.classdata);
                        }
                        that.main.user = user;
                        that.main.restoreWorkspaces(response.workspaces);
                        that.main.workspacesOwnerId = user.id;
                        that.main.networkManager.initializeTimer();
                        that.main.projectExplorer.fileListPanel.setFixed(!user.is_teacher);
                        that.main.projectExplorer.workspaceListPanel.setFixed(!user.is_teacher);
                        (_b = (_a = that.main.rightDiv) === null || _a === void 0 ? void 0 : _a.classDiagram) === null || _b === void 0 ? void 0 : _b.clear();
                        if (user.settings.classDiagram != null) {
                            (_d = (_c = that.main.rightDiv) === null || _c === void 0 ? void 0 : _c.classDiagram) === null || _d === void 0 ? void 0 : _d.deserialize(user.settings.classDiagram);
                        }
                        that.main.viewModeController.initViewMode();
                        that.main.bottomDiv.hideHomeworkTab();
                    };
                    if (this.main.startupComplete == 0) {
                        this.main.waitForGUICallback();
                        this.main.waitForGUICallback = null;
                    }
                }
            }, (errorMessage) => {
                jQuery('#login-message').html('Login gescheitert: ' + errorMessage);
            });
        });
        jQuery('#buttonLogout').on('click', () => {
            if (that.main.user.is_testuser) {
                that.showLoginForm();
                return;
            }
            jQuery('#bitteWartenText').html('Bitte warten, der letzte Bearbeitungsstand wird noch gespeichert ...');
            jQuery('#bitteWarten').css('display', 'flex');
            if (this.main.workspacesOwnerId != this.main.user.id) {
                this.main.projectExplorer.onHomeButtonClicked();
            }
            this.main.networkManager.sendUpdates(() => {
                var _a;
                this.main.rightDiv.classDiagram.clearAfterLogout();
                let logoutRequest = {
                    currentWorkspaceId: (_a = this.main.currentWorkspace) === null || _a === void 0 ? void 0 : _a.id
                };
                ajax('logout', logoutRequest, () => {
                    // window.location.href = 'index.html';
                    that.showLoginForm();
                });
            });
        });
    }
    showLoginForm() {
        var _a, _b;
        jQuery('#login').show();
        jQuery('#main').css('visibility', 'hidden');
        jQuery('#bitteWarten').css('display', 'none');
        jQuery('#login-message').empty();
        this.main.interpreter.setState(InterpreterState.not_initialized);
        this.main.getMonacoEditor().setModel(monaco.editor.createModel("", "myJava"));
        this.main.projectExplorer.fileListPanel.clear();
        this.main.projectExplorer.fileListPanel.setCaption('');
        this.main.projectExplorer.workspaceListPanel.clear();
        (_b = (_a = this.main.bottomDiv) === null || _a === void 0 ? void 0 : _a.console) === null || _b === void 0 ? void 0 : _b.clear();
        this.main.interpreter.printManager.clear();
        if (this.main.user.is_teacher) {
            this.main.teacherExplorer.removePanels();
            this.main.teacherExplorer = null;
        }
        this.main.currentWorkspace = null;
        this.main.user = null;
    }
    startAnimations() {
        // let $loginAnimationDiv = $('#jo_login_animations');
        // $loginAnimationDiv.empty();
        // let $gifAnimation = $('<img src="assets/startpage/code_1.gif" class="jo_gif_animation">');
        // $loginAnimationDiv.append($gifAnimation);
        // let left = Math.trunc(Math.random()*(screen.width - 400)) + "px";
        // let top = Math.trunc(Math.random()*(screen.height - 400)) + "px";
        // $gifAnimation.css({
        //     "left": left,
        //     "top": top
        // })
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9naW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vTG9naW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBSXRELE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLCtCQUErQixDQUFDO0FBRWpFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx3QkFBd0IsQ0FBQztBQUNwRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFDN0MsT0FBTyxFQUFFLFVBQVUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRXJELE1BQU0sT0FBTyxLQUFLO0lBR2QsWUFBb0IsSUFBVTtRQUFWLFNBQUksR0FBSixJQUFJLENBQU07SUFFOUIsQ0FBQztJQUVELE9BQU87UUFFSCxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7UUFFaEIsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXZCLElBQUksYUFBYSxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRWpELE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRWxDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUMxQyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksT0FBTyxFQUFFO2dCQUNsQixNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQzthQUNyQztRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQzFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUU7Z0JBQ2xCLE1BQU0sQ0FBQyxlQUFl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Q3JELFlBQUEsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLDBDQUFFLE9BQU8sMENBQUUsS0FBSyxHQUFHO1FBQ3RDLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUUzQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxZQUFZLEVBQUUsQ0FBQztZQUN6QyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7U0FDcEM7UUFFRCxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixHQUFHLElBQUksQ0FBQztRQUNsQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7SUFFMUIsQ0FBQztJQUdELGVBQWU7UUFDWCxzREFBc0Q7UUFDdEQsOEJBQThCO1FBRzlCLDZGQUE2RjtRQUM3Riw0Q0FBNEM7UUFFNUMsb0VBQW9FO1FBQ3BFLG9FQUFvRTtRQUVwRSxzQkFBc0I7UUFDdEIsb0JBQW9CO1FBQ3BCLGlCQUFpQjtRQUNqQixLQUFLO0lBQ1QsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgTG9naW5SZXF1ZXN0LCBMb2dpblJlc3BvbnNlLCBMb2dvdXRSZXF1ZXN0LCBVc2VyRGF0YSB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgTWFpbiB9IGZyb20gXCIuL01haW4uanNcIjtcclxuaW1wb3J0IHsgSGVscGVyIH0gZnJvbSBcIi4vZ3VpL0hlbHBlci5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlclN0YXRlIH0gZnJvbSBcIi4uL2ludGVycHJldGVyL0ludGVycHJldGVyLmpzXCI7XHJcbmltcG9ydCB7IHVzZXJJbmZvIH0gZnJvbSBcIm9zXCI7XHJcbmltcG9ydCB7IFNvdW5kVG9vbHMgfSBmcm9tIFwiLi4vdG9vbHMvU291bmRUb29scy5qc1wiO1xyXG5pbXBvcnQgeyBVc2VyTWVudSB9IGZyb20gXCIuL2d1aS9Vc2VyTWVudS5qc1wiO1xyXG5pbXBvcnQgeyBlc2NhcGVIdG1sIH0gZnJvbSBcIi4uL3Rvb2xzL1N0cmluZ1Rvb2xzLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTG9naW4ge1xyXG5cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIG1haW46IE1haW4pIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgaW5pdEdVSSgpIHtcclxuXHJcbiAgICAgICAgbGV0IHRoYXQgPSB0aGlzO1xyXG5cclxuICAgICAgICB0aGlzLnN0YXJ0QW5pbWF0aW9ucygpO1xyXG5cclxuICAgICAgICBsZXQgJGxvZ2luU3Bpbm5lciA9IGpRdWVyeSgnI2xvZ2luLXNwaW5uZXI+aW1nJyk7XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luLXVzZXJuYW1lJykuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgalF1ZXJ5KCcjbG9naW4tdXNlcm5hbWUnKS5vbigna2V5ZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PSBcIkVudGVyXCIpIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLXBhc3N3b3JkJykuZm9jdXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLm9uKCdrZXlkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09IFwiRW50ZXJcIikge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tYnV0dG9uJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLm9uKCdrZXlkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09IFwiVGFiXCIpIHtcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLWJ1dHRvbicpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS5hZGRDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGUua2V5ID09IFwiRW50ZXJcIikge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tYnV0dG9uJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS5vbigna2V5ZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PSBcIlRhYlwiKSB7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi11c2VybmFtZScpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBqUXVlcnkoJyNqb190ZXN0dXNlci1sb2dpbi1idXR0b24nKS5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLXVzZXJuYW1lJykudmFsKCdUZXN0dXNlcicpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLWJ1dHRvbicpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIC8vIEF2b2lkIGRvdWJsZSBsb2dpbiB3aGVuIHVzZXIgZG9lcyBkb3VibGVjbGljazpcclxuICAgICAgICBsZXQgbG9naW5IYXBwZW5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luLWJ1dHRvbicpLm9uKCdjbGljaycsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIFNvdW5kVG9vbHMuaW5pdCgpO1xyXG5cclxuICAgICAgICAgICAgJGxvZ2luU3Bpbm5lci5zaG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobG9naW5IYXBwZW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBsb2dpbkhhcHBlbmVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9naW5IYXBwZW5lZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9LCAxMDAwKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBsb2dpblJlcXVlc3Q6IExvZ2luUmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgIHVzZXJuYW1lOiA8c3RyaW5nPmpRdWVyeSgnI2xvZ2luLXVzZXJuYW1lJykudmFsKCksXHJcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogPHN0cmluZz5qUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLnZhbCgpLFxyXG4gICAgICAgICAgICAgICAgbGFuZ3VhZ2U6IDBcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgYWpheCgnbG9naW4nLCBsb2dpblJlcXVlc3QsIChyZXNwb25zZTogTG9naW5SZXNwb25zZSkgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLW1lc3NhZ2UnKS5odG1sKCdGZWhsZXI6IEJlbnV0emVybmFtZSB1bmQvb2RlciBQYXNzd29ydCBpc3QgZmFsc2NoLicpO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gV2UgZG9uJ3QgZG8gdGhpcyBhbnltb3JlIGZvciBzZWN1cml0eSByZWFzb25zIC0gc2VlIEFqYXhIZWxwZXIudHNcclxuICAgICAgICAgICAgICAgICAgICAvLyBBbHRlcm5hdGl2ZWx5IHdlIG5vdyBzZXQgYSBsb25nIGV4cGlyeSBpbnRlcnZhbCBmb3IgY29va2llLlxyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWRlbnRpYWxzLnVzZXJuYW1lID0gbG9naW5SZXF1ZXN0LnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGNyZWRlbnRpYWxzLnBhc3N3b3JkID0gbG9naW5SZXF1ZXN0LnBhc3N3b3JkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNtYWluJykuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCcjYml0dGVXYXJ0ZW5UZXh0JykuaHRtbCgnQml0dGUgd2FydGVuIC4uLicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnI2JpdHRlV2FydGVuJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVzZXI6IFVzZXJEYXRhID0gcmVzcG9uc2UudXNlcjtcclxuICAgICAgICAgICAgICAgICAgICB1c2VyLmlzX3Rlc3R1c2VyID0gbG9naW5SZXF1ZXN0LnVzZXJuYW1lID09IFwiVGVzdHVzZXJcIiAmJiBsb2dpblJlcXVlc3QucGFzc3dvcmQgPT0gXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXIuc2V0dGluZ3MgPT0gbnVsbCB8fCB1c2VyLnNldHRpbmdzLmhlbHBlckhpc3RvcnkgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyLnNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGVscGVySGlzdG9yeToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGVIZWxwZXJEb25lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGaWxlSGVscGVyRG9uZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3V29ya3NwYWNlSGVscGVyRG9uZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlZWRDb250cm9sSGVscGVyRG9uZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9tZUJ1dHRvbkhlbHBlckRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXBCdXR0b25IZWxwZXJEb25lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXBvc2l0b3J5QnV0dG9uRG9uZTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3TW9kZXM6IG51bGwsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc0RpYWdyYW06IG51bGxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLndhaXRGb3JHVUlDYWxsYmFjayA9ICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5tYWluTWVudS5pbml0R1VJKHVzZXIpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgalF1ZXJ5KCcjYml0dGVXYXJ0ZW4nKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICRsb2dpblNwaW5uZXIuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNtZW51cGFuZWwtdXNlcm5hbWUnKS5odG1sKGVzY2FwZUh0bWwodXNlci5ydWZuYW1lKSArIFwiIFwiICsgZXNjYXBlSHRtbCh1c2VyLmZhbWlsaWVubmFtZSkpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgbmV3IFVzZXJNZW51KHRoYXQubWFpbikuaW5pdCgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXIuaXNfdGVhY2hlcikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLmluaXRUZWFjaGVyRXhwbG9yZXIocmVzcG9uc2UuY2xhc3NkYXRhKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLnVzZXIgPSB1c2VyO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLnJlc3RvcmVXb3Jrc3BhY2VzKHJlc3BvbnNlLndvcmtzcGFjZXMpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ud29ya3NwYWNlc093bmVySWQgPSB1c2VyLmlkO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLmluaXRpYWxpemVUaW1lcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLnByb2plY3RFeHBsb3Jlci5maWxlTGlzdFBhbmVsLnNldEZpeGVkKCF1c2VyLmlzX3RlYWNoZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucHJvamVjdEV4cGxvcmVyLndvcmtzcGFjZUxpc3RQYW5lbC5zZXRGaXhlZCghdXNlci5pc190ZWFjaGVyKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5yaWdodERpdj8uY2xhc3NEaWFncmFtPy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVzZXIuc2V0dGluZ3MuY2xhc3NEaWFncmFtICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5yaWdodERpdj8uY2xhc3NEaWFncmFtPy5kZXNlcmlhbGl6ZSh1c2VyLnNldHRpbmdzLmNsYXNzRGlhZ3JhbSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi52aWV3TW9kZUNvbnRyb2xsZXIuaW5pdFZpZXdNb2RlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5ib3R0b21EaXYuaGlkZUhvbWV3b3JrVGFiKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMubWFpbi5zdGFydHVwQ29tcGxldGUgPT0gMCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1haW4ud2FpdEZvckdVSUNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi53YWl0Rm9yR1VJQ2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9LCAoZXJyb3JNZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLW1lc3NhZ2UnKS5odG1sKCdMb2dpbiBnZXNjaGVpdGVydDogJyArIGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2J1dHRvbkxvZ291dCcpLm9uKCdjbGljaycsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoYXQubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2hvd0xvZ2luRm9ybSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlblRleHQnKS5odG1sKCdCaXR0ZSB3YXJ0ZW4sIGRlciBsZXR6dGUgQmVhcmJlaXR1bmdzc3RhbmQgd2lyZCBub2NoIGdlc3BlaWNoZXJ0IC4uLicpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlbicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5tYWluLndvcmtzcGFjZXNPd25lcklkICE9IHRoaXMubWFpbi51c2VyLmlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLm9uSG9tZUJ1dHRvbkNsaWNrZWQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmRVcGRhdGVzKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4ucmlnaHREaXYuY2xhc3NEaWFncmFtLmNsZWFyQWZ0ZXJMb2dvdXQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbG9nb3V0UmVxdWVzdDogTG9nb3V0UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50V29ya3NwYWNlSWQ6IHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlPy5pZFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFqYXgoJ2xvZ291dCcsIGxvZ291dFJlcXVlc3QsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICdpbmRleC5odG1sJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zaG93TG9naW5Gb3JtKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgc2hvd0xvZ2luRm9ybSgpe1xyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luJykuc2hvdygpO1xyXG4gICAgICAgIGpRdWVyeSgnI21haW4nKS5jc3MoJ3Zpc2liaWxpdHknLCAnaGlkZGVuJyk7XHJcbiAgICAgICAgalF1ZXJ5KCcjYml0dGVXYXJ0ZW4nKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luLW1lc3NhZ2UnKS5lbXB0eSgpO1xyXG4gICAgICAgIHRoaXMubWFpbi5pbnRlcnByZXRlci5zZXRTdGF0ZShJbnRlcnByZXRlclN0YXRlLm5vdF9pbml0aWFsaXplZCk7XHJcbiAgICAgICAgdGhpcy5tYWluLmdldE1vbmFjb0VkaXRvcigpLnNldE1vZGVsKG1vbmFjby5lZGl0b3IuY3JlYXRlTW9kZWwoXCJcIiwgXCJteUphdmFcIikpO1xyXG4gICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuZmlsZUxpc3RQYW5lbC5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIuZmlsZUxpc3RQYW5lbC5zZXRDYXB0aW9uKCcnKTtcclxuICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLndvcmtzcGFjZUxpc3RQYW5lbC5jbGVhcigpO1xyXG4gICAgICAgIHRoaXMubWFpbi5ib3R0b21EaXY/LmNvbnNvbGU/LmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5tYWluLmludGVycHJldGVyLnByaW50TWFuYWdlci5jbGVhcigpO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5tYWluLnVzZXIuaXNfdGVhY2hlcikge1xyXG4gICAgICAgICAgICB0aGlzLm1haW4udGVhY2hlckV4cGxvcmVyLnJlbW92ZVBhbmVscygpO1xyXG4gICAgICAgICAgICB0aGlzLm1haW4udGVhY2hlckV4cGxvcmVyID0gbnVsbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlID0gbnVsbDtcclxuICAgICAgICB0aGlzLm1haW4udXNlciA9IG51bGw7XHJcblxyXG4gICAgfVxyXG5cclxuXHJcbiAgICBzdGFydEFuaW1hdGlvbnMoKSB7XHJcbiAgICAgICAgLy8gbGV0ICRsb2dpbkFuaW1hdGlvbkRpdiA9ICQoJyNqb19sb2dpbl9hbmltYXRpb25zJyk7XHJcbiAgICAgICAgLy8gJGxvZ2luQW5pbWF0aW9uRGl2LmVtcHR5KCk7XHJcblxyXG5cclxuICAgICAgICAvLyBsZXQgJGdpZkFuaW1hdGlvbiA9ICQoJzxpbWcgc3JjPVwiYXNzZXRzL3N0YXJ0cGFnZS9jb2RlXzEuZ2lmXCIgY2xhc3M9XCJqb19naWZfYW5pbWF0aW9uXCI+Jyk7XHJcbiAgICAgICAgLy8gJGxvZ2luQW5pbWF0aW9uRGl2LmFwcGVuZCgkZ2lmQW5pbWF0aW9uKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBsZXQgbGVmdCA9IE1hdGgudHJ1bmMoTWF0aC5yYW5kb20oKSooc2NyZWVuLndpZHRoIC0gNDAwKSkgKyBcInB4XCI7XHJcbiAgICAgICAgLy8gbGV0IHRvcCA9IE1hdGgudHJ1bmMoTWF0aC5yYW5kb20oKSooc2NyZWVuLmhlaWdodCAtIDQwMCkpICsgXCJweFwiO1xyXG5cclxuICAgICAgICAvLyAkZ2lmQW5pbWF0aW9uLmNzcyh7XHJcbiAgICAgICAgLy8gICAgIFwibGVmdFwiOiBsZWZ0LFxyXG4gICAgICAgIC8vICAgICBcInRvcFwiOiB0b3BcclxuICAgICAgICAvLyB9KVxyXG4gICAgfVxyXG5cclxuXHJcbn0iXX0=