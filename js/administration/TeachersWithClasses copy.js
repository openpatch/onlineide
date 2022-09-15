import { AdminMenuItem } from "./AdminMenuItem.js";
export class TeachersWithClassesMI extends AdminMenuItem {
    checkPermission(user) {
        return user.is_schooladmin;
    }
    getButtonIdentifier() {
        return "Lehrkräfte mit Klassen";
    }
    onMenuButtonPressed() {
    }
}
//# sourceMappingURL=TeachersWithClasses copy.js.map