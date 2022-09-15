import { AdminMenuItem } from "./AdminMenuItem.js";
export class SchoolsWithAdminsMI extends AdminMenuItem {
    checkPermission(user) {
        return user.is_admin;
    }
    getButtonIdentifier() {
        return "Schulen mit Administratoren";
    }
    onMenuButtonPressed() {
    }
}
//# sourceMappingURL=SchoolsWithAdminsMI copy.js.map