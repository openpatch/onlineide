import { ajax } from "../communication/AjaxHelper.js";
import { Helper } from "./gui/Helper.js";
import { InterpreterState } from "../interpreter/Interpreter.js";
import { SoundTools } from "../tools/SoundTools.js";
import { UserMenu } from "./gui/UserMenu.js";
import { escapeHtml } from "../tools/StringTools.js";
export class Login {
    constructor(main) {
        this.main = main;
    }
    initGUI(isLoginWithTicket) {
        let that = this;
        if (!isLoginWithTicket) {
            jQuery('#login').css('display', 'flex');
            jQuery('#bitteWarten').css('display', 'none');
            this.startAnimations();
        }
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
            this.sendLoginRequest(null);
        });
        jQuery('#buttonLogout').on('click', () => {
            if (that.main.user.is_testuser) {
                that.showLoginForm();
                return;
            }
            this.main.interpreter.closeAllWebsockets();
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
            this.main.networkManager.notifierClient.disconnect();
        });
    }
    sendLoginRequest(ticket) {
        let that = this;
        let servlet = "login";
        let loginRequest = {
            username: jQuery('#login-username').val(),
            password: jQuery('#login-password').val(),
            language: 0
        };
        if (ticket != null) {
            servlet = "ticketLogin";
            loginRequest = {
                ticket: ticket,
                language: 0
            };
        }
        ajax(servlet, loginRequest, (response) => {
            if (!response.success) {
                jQuery('#login-message').html('Fehler: Benutzername und/oder Passwort ist falsch.');
                jQuery('#login-spinner>img').hide();
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
                user.is_testuser = response.isTestuser;
                if (user.settings == null || user.settings.helperHistory == null) {
                    user.settings = {
                        helperHistory: {
                            consoleHelperDone: false,
                            newFileHelperDone: false,
                            newWorkspaceHelperDone: false,
                            speedControlHelperDone: false,
                            homeButtonHelperDone: false,
                            stepButtonHelperDone: false,
                            repositoryButtonDone: false,
                            folderButtonDone: false
                        },
                        viewModes: null,
                        classDiagram: null
                    };
                }
                that.main.user = user;
                this.main.waitForGUICallback = () => {
                    var _a, _b, _c, _d;
                    that.main.mainMenu.initGUI(user, "");
                    jQuery('#bitteWarten').hide();
                    let $loginSpinner = jQuery('#login-spinner>img');
                    $loginSpinner.hide();
                    jQuery('#menupanel-username').html(escapeHtml(user.rufname) + " " + escapeHtml(user.familienname));
                    new UserMenu(that.main).init();
                    if (user.is_teacher) {
                        that.main.initTeacherExplorer(response.classdata);
                    }
                    that.main.workspacesOwnerId = user.id;
                    that.main.restoreWorkspaces(response.workspaces, true);
                    that.main.networkManager.initializeTimer();
                    that.main.projectExplorer.fileListPanel.setFixed(!user.is_teacher);
                    that.main.projectExplorer.workspaceListPanel.setFixed(!user.is_teacher);
                    (_b = (_a = that.main.rightDiv) === null || _a === void 0 ? void 0 : _a.classDiagram) === null || _b === void 0 ? void 0 : _b.clear();
                    if (user.settings.classDiagram != null) {
                        (_d = (_c = that.main.rightDiv) === null || _c === void 0 ? void 0 : _c.classDiagram) === null || _d === void 0 ? void 0 : _d.deserialize(user.settings.classDiagram);
                    }
                    that.main.viewModeController.initViewMode();
                    that.main.bottomDiv.hideHomeworkTab();
                    if (!this.main.user.settings.helperHistory.folderButtonDone && that.main.projectExplorer.workspaceListPanel.elements.length > 5) {
                        Helper.showHelper("folderButton", this.main, jQuery('.img_add-folder-dark'));
                    }
                    that.main.networkManager.initializeNotifierClient();
                };
                if (this.main.startupComplete == 0) {
                    this.main.waitForGUICallback();
                    this.main.waitForGUICallback = null;
                }
            }
        }, (errorMessage) => {
            jQuery('#login-message').html('Login gescheitert: ' + errorMessage);
            jQuery('#login-spinner>img').hide();
        });
    }
    loginWithTicket(ticket) {
        jQuery('#login').hide();
        jQuery('#main').css('visibility', 'visible');
        jQuery('#bitteWartenText').html('Bitte warten ...');
        jQuery('#bitteWarten').css('display', 'flex');
        this.sendLoginRequest(ticket);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTG9naW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L21haW4vTG9naW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLGdDQUFnQyxDQUFDO0FBR3RELE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUN6QyxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSwrQkFBK0IsQ0FBQztBQUVqRSxPQUFPLEVBQUUsVUFBVSxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDcEQsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLG1CQUFtQixDQUFDO0FBQzdDLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUVyRCxNQUFNLE9BQU8sS0FBSztJQUdkLFlBQW9CLElBQVU7UUFBVixTQUFJLEdBQUosSUFBSSxDQUFNO0lBRTlCLENBQUM7SUFFRCxPQUFPLENBQUMsaUJBQTBCO1FBRTlCLElBQUksSUFBSSxHQUFHLElBQUksQ0FBQztRQUNoQixJQUFHLENBQUMsaUJBQWlCLEVBQUM7WUFDbEIsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLGNBQWMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEVBQUMsTUFBTSxDQUFDLENBQUM7WUFDN0MsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1NBQzFCO1FBRUQsSUFBSSxhQUFhLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFFakQsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7UUFFbEMsTUFBTSxDQUFDLGlCQUFpQixDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQzFDLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxP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b0VBQW9FO1FBQ3BFLG9FQUFvRTtRQUVwRSxzQkFBc0I7UUFDdEIsb0JBQW9CO1FBQ3BCLGlCQUFpQjtRQUNqQixLQUFLO0lBQ1QsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgYWpheCB9IGZyb20gXCIuLi9jb21tdW5pY2F0aW9uL0FqYXhIZWxwZXIuanNcIjtcclxuaW1wb3J0IHsgTG9naW5SZXF1ZXN0LCBMb2dpblJlc3BvbnNlLCBMb2dvdXRSZXF1ZXN0LCBUaWNrZXRMb2dpblJlcXVlc3QsIFVzZXJEYXRhIH0gZnJvbSBcIi4uL2NvbW11bmljYXRpb24vRGF0YS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4vTWFpbi5qc1wiO1xyXG5pbXBvcnQgeyBIZWxwZXIgfSBmcm9tIFwiLi9ndWkvSGVscGVyLmpzXCI7XHJcbmltcG9ydCB7IEludGVycHJldGVyU3RhdGUgfSBmcm9tIFwiLi4vaW50ZXJwcmV0ZXIvSW50ZXJwcmV0ZXIuanNcIjtcclxuaW1wb3J0IHsgdXNlckluZm8gfSBmcm9tIFwib3NcIjtcclxuaW1wb3J0IHsgU291bmRUb29scyB9IGZyb20gXCIuLi90b29scy9Tb3VuZFRvb2xzLmpzXCI7XHJcbmltcG9ydCB7IFVzZXJNZW51IH0gZnJvbSBcIi4vZ3VpL1VzZXJNZW51LmpzXCI7XHJcbmltcG9ydCB7IGVzY2FwZUh0bWwgfSBmcm9tIFwiLi4vdG9vbHMvU3RyaW5nVG9vbHMuanNcIjtcclxuXHJcbmV4cG9ydCBjbGFzcyBMb2dpbiB7XHJcblxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbikge1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBpbml0R1VJKGlzTG9naW5XaXRoVGlja2V0OiBib29sZWFuKSB7XHJcblxyXG4gICAgICAgIGxldCB0aGF0ID0gdGhpcztcclxuICAgICAgICBpZighaXNMb2dpbldpdGhUaWNrZXQpe1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNsb2dpbicpLmNzcygnZGlzcGxheScsJ2ZsZXgnKTtcclxuICAgICAgICAgICAgalF1ZXJ5KCcjYml0dGVXYXJ0ZW4nKS5jc3MoJ2Rpc3BsYXknLCdub25lJyk7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRBbmltYXRpb25zKCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgJGxvZ2luU3Bpbm5lciA9IGpRdWVyeSgnI2xvZ2luLXNwaW5uZXI+aW1nJyk7XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luLXVzZXJuYW1lJykuZm9jdXMoKTtcclxuXHJcbiAgICAgICAgalF1ZXJ5KCcjbG9naW4tdXNlcm5hbWUnKS5vbigna2V5ZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PSBcIkVudGVyXCIpIHtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLXBhc3N3b3JkJykuZm9jdXMoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLm9uKCdrZXlkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09IFwiRW50ZXJcIikge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tYnV0dG9uJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLm9uKCdrZXlkb3duJywgKGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKGUua2V5ID09IFwiVGFiXCIpIHtcclxuICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLWJ1dHRvbicpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS5hZGRDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKGUua2V5ID09IFwiRW50ZXJcIikge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tYnV0dG9uJykudHJpZ2dlcignY2xpY2snKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS5vbigna2V5ZG93bicsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChlLmtleSA9PSBcIlRhYlwiKSB7XHJcbiAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi11c2VybmFtZScpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS5yZW1vdmVDbGFzcygnam9fYWN0aXZlJyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1idXR0b24nKS50cmlnZ2VyKCdjbGljaycpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBqUXVlcnkoJyNqb190ZXN0dXNlci1sb2dpbi1idXR0b24nKS5vbignY2xpY2snLCAoKSA9PiB7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLXVzZXJuYW1lJykudmFsKCdUZXN0dXNlcicpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLnZhbCgnJyk7XHJcbiAgICAgICAgICAgIGpRdWVyeSgnI2xvZ2luLWJ1dHRvbicpLnRyaWdnZXIoJ2NsaWNrJyk7XHJcblxyXG4gICAgICAgIH0pXHJcblxyXG4gICAgICAgIC8vIEF2b2lkIGRvdWJsZSBsb2dpbiB3aGVuIHVzZXIgZG9lcyBkb3VibGVjbGljazpcclxuICAgICAgICBsZXQgbG9naW5IYXBwZW5lZCA9IGZhbHNlO1xyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luLWJ1dHRvbicpLm9uKCdjbGljaycsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIFNvdW5kVG9vbHMuaW5pdCgpO1xyXG5cclxuICAgICAgICAgICAgJGxvZ2luU3Bpbm5lci5zaG93KCk7XHJcblxyXG4gICAgICAgICAgICBpZiAobG9naW5IYXBwZW5lZCkgcmV0dXJuO1xyXG4gICAgICAgICAgICBsb2dpbkhhcHBlbmVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgbG9naW5IYXBwZW5lZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB9LCAxMDAwKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuc2VuZExvZ2luUmVxdWVzdChudWxsKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGpRdWVyeSgnI2J1dHRvbkxvZ291dCcpLm9uKCdjbGljaycsICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmKHRoYXQubWFpbi51c2VyLmlzX3Rlc3R1c2VyKXtcclxuICAgICAgICAgICAgICAgIHRoYXQuc2hvd0xvZ2luRm9ybSgpO1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB0aGlzLm1haW4uaW50ZXJwcmV0ZXIuY2xvc2VBbGxXZWJzb2NrZXRzKCk7XHJcblxyXG4gICAgICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlblRleHQnKS5odG1sKCdCaXR0ZSB3YXJ0ZW4sIGRlciBsZXR6dGUgQmVhcmJlaXR1bmdzc3RhbmQgd2lyZCBub2NoIGdlc3BlaWNoZXJ0IC4uLicpO1xyXG4gICAgICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlbicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XHJcblxyXG4gICAgICAgICAgICBpZiAodGhpcy5tYWluLndvcmtzcGFjZXNPd25lcklkICE9IHRoaXMubWFpbi51c2VyLmlkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4ucHJvamVjdEV4cGxvcmVyLm9uSG9tZUJ1dHRvbkNsaWNrZWQoKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyLnNlbmRVcGRhdGVzKCgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4ucmlnaHREaXYuY2xhc3NEaWFncmFtLmNsZWFyQWZ0ZXJMb2dvdXQoKTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgbG9nb3V0UmVxdWVzdDogTG9nb3V0UmVxdWVzdCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50V29ya3NwYWNlSWQ6IHRoaXMubWFpbi5jdXJyZW50V29ya3NwYWNlPy5pZFxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGFqYXgoJ2xvZ291dCcsIGxvZ291dFJlcXVlc3QsICgpID0+IHtcclxuICAgICAgICAgICAgICAgICAgICAvLyB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICdpbmRleC5odG1sJztcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5zaG93TG9naW5Gb3JtKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5tYWluLm5ldHdvcmtNYW5hZ2VyLm5vdGlmaWVyQ2xpZW50LmRpc2Nvbm5lY3QoKTtcclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBzZW5kTG9naW5SZXF1ZXN0KHRpY2tldDogc3RyaW5nKXtcclxuICAgICAgICBsZXQgdGhhdCA9IHRoaXM7XHJcblxyXG4gICAgICAgIGxldCBzZXJ2bGV0ID0gXCJsb2dpblwiO1xyXG5cclxuICAgICAgICBsZXQgbG9naW5SZXF1ZXN0OiBMb2dpblJlcXVlc3R8VGlja2V0TG9naW5SZXF1ZXN0ID0ge1xyXG4gICAgICAgICAgICB1c2VybmFtZTogPHN0cmluZz5qUXVlcnkoJyNsb2dpbi11c2VybmFtZScpLnZhbCgpLFxyXG4gICAgICAgICAgICBwYXNzd29yZDogPHN0cmluZz5qUXVlcnkoJyNsb2dpbi1wYXNzd29yZCcpLnZhbCgpLFxyXG4gICAgICAgICAgICBsYW5ndWFnZTogMFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYodGlja2V0ICE9IG51bGwpe1xyXG4gICAgICAgICAgICBzZXJ2bGV0ID0gXCJ0aWNrZXRMb2dpblwiO1xyXG4gICAgICAgICAgICBsb2dpblJlcXVlc3QgPSB7XHJcbiAgICAgICAgICAgICAgICB0aWNrZXQ6IHRpY2tldCxcclxuICAgICAgICAgICAgICAgIGxhbmd1YWdlOiAwXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGFqYXgoc2VydmxldCwgbG9naW5SZXF1ZXN0LCAocmVzcG9uc2U6IExvZ2luUmVzcG9uc2UpID0+IHtcclxuXHJcbiAgICAgICAgICAgIGlmICghcmVzcG9uc2Uuc3VjY2Vzcykge1xyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tbWVzc2FnZScpLmh0bWwoJ0ZlaGxlcjogQmVudXR6ZXJuYW1lIHVuZC9vZGVyIFBhc3N3b3J0IGlzdCBmYWxzY2guJyk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNsb2dpbi1zcGlubmVyPmltZycpLmhpZGUoKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBXZSBkb24ndCBkbyB0aGlzIGFueW1vcmUgZm9yIHNlY3VyaXR5IHJlYXNvbnMgLSBzZWUgQWpheEhlbHBlci50c1xyXG4gICAgICAgICAgICAgICAgLy8gQWx0ZXJuYXRpdmVseSB3ZSBub3cgc2V0IGEgbG9uZyBleHBpcnkgaW50ZXJ2YWwgZm9yIGNvb2tpZS5cclxuICAgICAgICAgICAgICAgIC8vIGNyZWRlbnRpYWxzLnVzZXJuYW1lID0gbG9naW5SZXF1ZXN0LnVzZXJuYW1lO1xyXG4gICAgICAgICAgICAgICAgLy8gY3JlZGVudGlhbHMucGFzc3dvcmQgPSBsb2dpblJlcXVlc3QucGFzc3dvcmQ7XHJcblxyXG4gICAgICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4nKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNtYWluJykuY3NzKCd2aXNpYmlsaXR5JywgJ3Zpc2libGUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlblRleHQnKS5odG1sKCdCaXR0ZSB3YXJ0ZW4gLi4uJyk7XHJcbiAgICAgICAgICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlbicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IHVzZXI6IFVzZXJEYXRhID0gcmVzcG9uc2UudXNlcjtcclxuICAgICAgICAgICAgICAgIHVzZXIuaXNfdGVzdHVzZXIgPSByZXNwb25zZS5pc1Rlc3R1c2VyO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmICh1c2VyLnNldHRpbmdzID09IG51bGwgfHwgdXNlci5zZXR0aW5ncy5oZWxwZXJIaXN0b3J5ID09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgICAgICB1c2VyLnNldHRpbmdzID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBoZWxwZXJIaXN0b3J5OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlSGVscGVyRG9uZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdGaWxlSGVscGVyRG9uZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdXb3Jrc3BhY2VIZWxwZXJEb25lOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNwZWVkQ29udHJvbEhlbHBlckRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9tZUJ1dHRvbkhlbHBlckRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RlcEJ1dHRvbkhlbHBlckRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3NpdG9yeUJ1dHRvbkRvbmU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9sZGVyQnV0dG9uRG9uZTogZmFsc2VcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmlld01vZGVzOiBudWxsLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc0RpYWdyYW06IG51bGxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHRoYXQubWFpbi51c2VyID0gdXNlcjtcclxuXHJcbiAgICAgICAgICAgICAgICB0aGlzLm1haW4ud2FpdEZvckdVSUNhbGxiYWNrID0gKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5tYWluTWVudS5pbml0R1VJKHVzZXIsIFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGpRdWVyeSgnI2JpdHRlV2FydGVuJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCAkbG9naW5TcGlubmVyID0galF1ZXJ5KCcjbG9naW4tc3Bpbm5lcj5pbWcnKTtcclxuICAgICAgICAgICAgICAgICAgICAkbG9naW5TcGlubmVyLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICBqUXVlcnkoJyNtZW51cGFuZWwtdXNlcm5hbWUnKS5odG1sKGVzY2FwZUh0bWwodXNlci5ydWZuYW1lKSArIFwiIFwiICsgZXNjYXBlSHRtbCh1c2VyLmZhbWlsaWVubmFtZSkpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBVc2VyTWVudSh0aGF0Lm1haW4pLmluaXQoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlci5pc190ZWFjaGVyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5pbml0VGVhY2hlckV4cGxvcmVyKHJlc3BvbnNlLmNsYXNzZGF0YSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIFxyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ud29ya3NwYWNlc093bmVySWQgPSB1c2VyLmlkO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5yZXN0b3JlV29ya3NwYWNlcyhyZXNwb25zZS53b3Jrc3BhY2VzLCB0cnVlKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLmluaXRpYWxpemVUaW1lcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucHJvamVjdEV4cGxvcmVyLmZpbGVMaXN0UGFuZWwuc2V0Rml4ZWQoIXVzZXIuaXNfdGVhY2hlcik7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLnByb2plY3RFeHBsb3Jlci53b3Jrc3BhY2VMaXN0UGFuZWwuc2V0Rml4ZWQoIXVzZXIuaXNfdGVhY2hlcik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHRoYXQubWFpbi5yaWdodERpdj8uY2xhc3NEaWFncmFtPy5jbGVhcigpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAodXNlci5zZXR0aW5ncy5jbGFzc0RpYWdyYW0gIT0gbnVsbCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4ucmlnaHREaXY/LmNsYXNzRGlhZ3JhbT8uZGVzZXJpYWxpemUodXNlci5zZXR0aW5ncy5jbGFzc0RpYWdyYW0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLnZpZXdNb2RlQ29udHJvbGxlci5pbml0Vmlld01vZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICB0aGF0Lm1haW4uYm90dG9tRGl2LmhpZGVIb21ld29ya1RhYigpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGlmICghdGhpcy5tYWluLnVzZXIuc2V0dGluZ3MuaGVscGVySGlzdG9yeS5mb2xkZXJCdXR0b25Eb25lICYmIHRoYXQubWFpbi5wcm9qZWN0RXhwbG9yZXIud29ya3NwYWNlTGlzdFBhbmVsLmVsZW1lbnRzLmxlbmd0aCA+IDUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEhlbHBlci5zaG93SGVscGVyKFwiZm9sZGVyQnV0dG9uXCIsIHRoaXMubWFpbiwgalF1ZXJ5KCcuaW1nX2FkZC1mb2xkZXItZGFyaycpKTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgdGhhdC5tYWluLm5ldHdvcmtNYW5hZ2VyLmluaXRpYWxpemVOb3RpZmllckNsaWVudCgpO1xyXG5cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5tYWluLnN0YXJ0dXBDb21wbGV0ZSA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5tYWluLndhaXRGb3JHVUlDYWxsYmFjaygpO1xyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWFpbi53YWl0Rm9yR1VJQ2FsbGJhY2sgPSBudWxsO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9LCAoZXJyb3JNZXNzYWdlOiBzdHJpbmcpID0+IHtcclxuICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tbWVzc2FnZScpLmh0bWwoJ0xvZ2luIGdlc2NoZWl0ZXJ0OiAnICsgZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICAgICAgalF1ZXJ5KCcjbG9naW4tc3Bpbm5lcj5pbWcnKS5oaWRlKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGxvZ2luV2l0aFRpY2tldCh0aWNrZXQ6IHN0cmluZykge1xyXG4gICAgICAgIGpRdWVyeSgnI2xvZ2luJykuaGlkZSgpO1xyXG4gICAgICAgIGpRdWVyeSgnI21haW4nKS5jc3MoJ3Zpc2liaWxpdHknLCAndmlzaWJsZScpO1xyXG5cclxuICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlblRleHQnKS5odG1sKCdCaXR0ZSB3YXJ0ZW4gLi4uJyk7XHJcbiAgICAgICAgalF1ZXJ5KCcjYml0dGVXYXJ0ZW4nKS5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpO1xyXG4gICAgICAgIHRoaXMuc2VuZExvZ2luUmVxdWVzdCh0aWNrZXQpO1xyXG5cclxuICAgIH1cclxuXHJcblxyXG4gICAgcHJpdmF0ZSBzaG93TG9naW5Gb3JtKCl7XHJcbiAgICAgICAgalF1ZXJ5KCcjbG9naW4nKS5zaG93KCk7XHJcbiAgICAgICAgalF1ZXJ5KCcjbWFpbicpLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcclxuICAgICAgICBqUXVlcnkoJyNiaXR0ZVdhcnRlbicpLmNzcygnZGlzcGxheScsICdub25lJyk7XHJcbiAgICAgICAgalF1ZXJ5KCcjbG9naW4tbWVzc2FnZScpLmVtcHR5KCk7XHJcbiAgICAgICAgdGhpcy5tYWluLmludGVycHJldGVyLnNldFN0YXRlKEludGVycHJldGVyU3RhdGUubm90X2luaXRpYWxpemVkKTtcclxuICAgICAgICB0aGlzLm1haW4uZ2V0TW9uYWNvRWRpdG9yKCkuc2V0TW9kZWwobW9uYWNvLmVkaXRvci5jcmVhdGVNb2RlbChcIlwiLCBcIm15SmF2YVwiKSk7XHJcbiAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5maWxlTGlzdFBhbmVsLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5tYWluLnByb2plY3RFeHBsb3Jlci5maWxlTGlzdFBhbmVsLnNldENhcHRpb24oJycpO1xyXG4gICAgICAgIHRoaXMubWFpbi5wcm9qZWN0RXhwbG9yZXIud29ya3NwYWNlTGlzdFBhbmVsLmNsZWFyKCk7XHJcbiAgICAgICAgdGhpcy5tYWluLmJvdHRvbURpdj8uY29uc29sZT8uY2xlYXIoKTtcclxuICAgICAgICB0aGlzLm1haW4uaW50ZXJwcmV0ZXIucHJpbnRNYW5hZ2VyLmNsZWFyKCk7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm1haW4udXNlci5pc190ZWFjaGVyKSB7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi50ZWFjaGVyRXhwbG9yZXIucmVtb3ZlUGFuZWxzKCk7XHJcbiAgICAgICAgICAgIHRoaXMubWFpbi50ZWFjaGVyRXhwbG9yZXIgPSBudWxsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5tYWluLmN1cnJlbnRXb3Jrc3BhY2UgPSBudWxsO1xyXG4gICAgICAgIHRoaXMubWFpbi51c2VyID0gbnVsbDtcclxuXHJcbiAgICB9XHJcblxyXG5cclxuICAgIHN0YXJ0QW5pbWF0aW9ucygpIHtcclxuICAgICAgICAvLyBsZXQgJGxvZ2luQW5pbWF0aW9uRGl2ID0gJCgnI2pvX2xvZ2luX2FuaW1hdGlvbnMnKTtcclxuICAgICAgICAvLyAkbG9naW5BbmltYXRpb25EaXYuZW1wdHkoKTtcclxuXHJcblxyXG4gICAgICAgIC8vIGxldCAkZ2lmQW5pbWF0aW9uID0gJCgnPGltZyBzcmM9XCJhc3NldHMvc3RhcnRwYWdlL2NvZGVfMS5naWZcIiBjbGFzcz1cImpvX2dpZl9hbmltYXRpb25cIj4nKTtcclxuICAgICAgICAvLyAkbG9naW5BbmltYXRpb25EaXYuYXBwZW5kKCRnaWZBbmltYXRpb24pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGxldCBsZWZ0ID0gTWF0aC50cnVuYyhNYXRoLnJhbmRvbSgpKihzY3JlZW4ud2lkdGggLSA0MDApKSArIFwicHhcIjtcclxuICAgICAgICAvLyBsZXQgdG9wID0gTWF0aC50cnVuYyhNYXRoLnJhbmRvbSgpKihzY3JlZW4uaGVpZ2h0IC0gNDAwKSkgKyBcInB4XCI7XHJcblxyXG4gICAgICAgIC8vICRnaWZBbmltYXRpb24uY3NzKHtcclxuICAgICAgICAvLyAgICAgXCJsZWZ0XCI6IGxlZnQsXHJcbiAgICAgICAgLy8gICAgIFwidG9wXCI6IHRvcFxyXG4gICAgICAgIC8vIH0pXHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==