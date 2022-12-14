import { Enum } from "../../compiler/types/Enum.js";
import { TokenType } from "../../compiler/lexer/Token.js";
export class SpriteLibraryClass extends Enum {
    constructor(module) {
        super("SpriteLibrary", module, SpriteLibrary.filter((sle) => {
            return sle.index == null || sle.index == 0;
        }).map((sle) => {
            return {
                type: TokenType.pushEnumValue,
                position: null,
                identifier: sle.name
            };
        }));
        this.documentation = "Aufzählung der Sprite-Grafiken";
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3ByaXRlTGlicmFyeUVudW0uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zcmMvY2xpZW50L3J1bnRpbWVsaWJyYXJ5L2dyYXBoaWNzL1Nwcml0ZUxpYnJhcnlFbnVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUVwRCxPQUFPLEVBQUUsU0FBUyxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFVMUQsTUFBTSxPQUFPLGtCQUFtQixTQUFRLElBQUk7SUFFeEMsWUFBWSxNQUFjO1FBQ3RCLEtBQUssQ0FBQyxlQUFlLEVBQUUsTUFBTSxFQUV6QixhQUFhLENBQUMsTUFBTSxDQUNoQixDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQ0osT0FBTyxHQUFHLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQTtRQUM5QyxDQUFDLENBQ0osQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUF1QixFQUFFLEVBQUU7WUFDOUIsT0FBTztnQkFDSCxJQUFJLEVBQUUsU0FBUyxDQUFDLGFBQWE7Z0JBQzdCLFFBQVEsRUFBRSxJQUFJO2dCQUNkLFVBQVUsRUFBRSxHQUFHLENBQUMsSUFBSTthQUN2QixDQUFDO1FBRU4sQ0FBQyxDQUFDLENBRUwsQ0FBQztRQUNGLElBQUksQ0FBQyxhQUFhLEdBQUcsZ0NBQWdDLENBQUE7SUFDekQsQ0FBQztDQUVKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgRW51bSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9FbnVtLmpzXCI7XHJcbmltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IFRva2VuVHlwZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9sZXhlci9Ub2tlbi5qc1wiO1xyXG5cclxudHlwZSBTcHJpdGVMaWJyYXJ5RW50cnkgPSB7XHJcbiAgICBmaWxlbmFtZTogc3RyaW5nLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgaW5kZXg/OiBudW1iZXJcclxufVxyXG5cclxuZGVjbGFyZSB2YXIgU3ByaXRlTGlicmFyeTogU3ByaXRlTGlicmFyeUVudHJ5W107XHJcblxyXG5leHBvcnQgY2xhc3MgU3ByaXRlTGlicmFyeUNsYXNzIGV4dGVuZHMgRW51bSB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICBzdXBlcihcIlNwcml0ZUxpYnJhcnlcIiwgbW9kdWxlLFxyXG5cclxuICAgICAgICAgICAgU3ByaXRlTGlicmFyeS5maWx0ZXIoXHJcbiAgICAgICAgICAgICAgICAoc2xlKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHNsZS5pbmRleCA9PSBudWxsIHx8IHNsZS5pbmRleCA9PSAwXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICkubWFwKChzbGU6IFNwcml0ZUxpYnJhcnlFbnRyeSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICB0eXBlOiBUb2tlblR5cGUucHVzaEVudW1WYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICBwb3NpdGlvbjogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICBpZGVudGlmaWVyOiBzbGUubmFtZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgIH0pXHJcblxyXG4gICAgICAgICk7XHJcbiAgICAgICAgdGhpcy5kb2N1bWVudGF0aW9uID0gXCJBdWZ6w6RobHVuZyBkZXIgU3ByaXRlLUdyYWZpa2VuXCJcclxuICAgIH1cclxuXHJcbn0iXX0=