import { Dialog } from "./Dialog.js";
export class WorkspaceSettings {
    constructor(workspace, main) {
        this.workspace = workspace;
        this.main = main;
        this.libraries = [
            { identifier: "gng", description: "Graphics'n Games-Bibliothek zu den Informatikbüchern des Cornelsen-Verlages für das Land Bayern" }
        ];
    }
    open() {
        let dialog = new Dialog();
        dialog.init();
        dialog.heading("Einstellungen zum Workspace " + this.workspace.name);
        dialog.subHeading("A. Verwendete Bibliotheken:");
        this.workspace.
            for(let, library, of, this.libraries);
        {
            let cbs = dialog.addCheckbox(library.description);
        }
        dialog.buttons([
            {
                caption: "Abbrechen",
                color: "#a00000",
                callback: () => { dialog.close(); }
            },
            {
                caption: "OK",
                color: "green",
                callback: () => {
                    dialog.close();
                }
            },
        ]);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV29ya3NwYWNlU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L21haW4vZ3VpL1dvcmtzcGFjZVNldHRpbmdzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE9BQU8sRUFBaUIsTUFBTSxFQUFFLE1BQU0sYUFBYSxDQUFDO0FBU3BELE1BQU0sT0FBTyxpQkFBaUI7SUFNMUIsWUFBb0IsU0FBb0IsRUFBVSxJQUFjO1FBQTVDLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFBVSxTQUFJLEdBQUosSUFBSSxDQUFVO1FBSmhFLGNBQVMsR0FBYztZQUNuQixFQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLGlHQUFpRyxFQUFDO1NBQ3RJLENBQUE7SUFJRCxDQUFDO0lBRUQsSUFBSTtRQUNBLElBQUksTUFBTSxHQUFHLElBQUksTUFBTSxFQUFFLENBQUM7UUFDMUIsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ2QsTUFBTSxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3JFLE1BQU0sQ0FBQyxVQUFVLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUVqRCxJQUFJLENBQUMsU0FBUztZQUVkLEdBQUcsQ0FBQyxHQUFHLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUE7UUFBQTtZQUM5QixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUcsQ0FBQTtTQUN0RDtRQUdELE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDWDtnQkFDSSxPQUFPLEVBQUUsV0FBVztnQkFDcEIsS0FBSyxFQUFFLFNBQVM7Z0JBQ2hCLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRSxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUEsQ0FBQSxDQUFDO2FBQ25DO1lBQ0Q7Z0JBQ0ksT0FBTyxFQUFFLElBQUk7Z0JBQ2IsS0FBSyxFQUFFLE9BQU87Z0JBQ2QsUUFBUSxFQUFFLEdBQUcsRUFBRTtvQkFFWCxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ25CLENBQUM7YUFDSjtTQUNKLENBQUMsQ0FBQTtJQUdOLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdvcmtzcGFjZSB9IGZyb20gXCJzcmMvY2xpZW50L3dvcmtzcGFjZS9Xb3Jrc3BhY2UuanNcIjtcclxuaW1wb3J0IHsgTWFpbkJhc2UgfSBmcm9tIFwiLi4vTWFpbkJhc2UuanNcIjtcclxuaW1wb3J0IHsgQ2hlY2tib3hTdGF0ZSwgRGlhbG9nIH0gZnJvbSBcIi4vRGlhbG9nLmpzXCI7XHJcblxyXG5cclxudHlwZSBMaWJyYXJ5ID0ge1xyXG4gICAgaWRlbnRpZmllcjogc3RyaW5nLFxyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZyxcclxuICAgIGNoZWNrYm94U3RhdGU/OiBDaGVja2JveFN0YXRlXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBXb3Jrc3BhY2VTZXR0aW5nc3tcclxuXHJcbiAgICBsaWJyYXJpZXM6IExpYnJhcnlbXSA9IFtcclxuICAgICAgICB7aWRlbnRpZmllcjogXCJnbmdcIiwgZGVzY3JpcHRpb246IFwiR3JhcGhpY3MnbiBHYW1lcy1CaWJsaW90aGVrIHp1IGRlbiBJbmZvcm1hdGlrYsO8Y2hlcm4gZGVzIENvcm5lbHNlbi1WZXJsYWdlcyBmw7xyIGRhcyBMYW5kIEJheWVyblwifVxyXG4gICAgXVxyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgd29ya3NwYWNlOiBXb3Jrc3BhY2UsIHByaXZhdGUgbWFpbjogTWFpbkJhc2Upe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBvcGVuKCl7XHJcbiAgICAgICAgbGV0IGRpYWxvZyA9IG5ldyBEaWFsb2coKTtcclxuICAgICAgICBkaWFsb2cuaW5pdCgpO1xyXG4gICAgICAgIGRpYWxvZy5oZWFkaW5nKFwiRWluc3RlbGx1bmdlbiB6dW0gV29ya3NwYWNlIFwiICsgdGhpcy53b3Jrc3BhY2UubmFtZSk7XHJcbiAgICAgICAgZGlhbG9nLnN1YkhlYWRpbmcoXCJBLiBWZXJ3ZW5kZXRlIEJpYmxpb3RoZWtlbjpcIik7XHJcblxyXG4gICAgICAgIHRoaXMud29ya3NwYWNlLlxyXG5cclxuICAgICAgICBmb3IobGV0IGxpYnJhcnkgb2YgdGhpcy5saWJyYXJpZXMpe1xyXG4gICAgICAgICAgICBsZXQgY2JzID0gZGlhbG9nLmFkZENoZWNrYm94KGxpYnJhcnkuZGVzY3JpcHRpb24sIClcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICBkaWFsb2cuYnV0dG9ucyhbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNhcHRpb246IFwiQWJicmVjaGVuXCIsXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogXCIjYTAwMDAwXCIsXHJcbiAgICAgICAgICAgICAgICBjYWxsYmFjazogKCkgPT4ge2RpYWxvZy5jbG9zZSgpfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIk9LXCIsXHJcbiAgICAgICAgICAgICAgICBjb2xvcjogXCJncmVlblwiLFxyXG4gICAgICAgICAgICAgICAgY2FsbGJhY2s6ICgpID0+IHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgZGlhbG9nLmNsb3NlKCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgXSlcclxuIFxyXG5cclxuICAgIH1cclxufSJdfQ==