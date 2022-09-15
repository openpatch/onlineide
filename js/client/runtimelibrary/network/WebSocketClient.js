import { Klass } from "../../compiler/types/Class.js";
import { intPrimitiveType, stringPrimitiveType, voidPrimitiveType } from "../../compiler/types/PrimitiveTypes.js";
import { Method, Parameterlist } from "../../compiler/types/Types.js";
export class WebSocketClientClass extends Klass {
    constructor(module) {
        super("WebSocketClient", module, "Ein Objekt der Klasse WebSocketClient repräsentiert einen anderen Rechner, mit dem dieser Rechner über den WebSocket in Kontakt steht.");
        let objectType = module.typeStore.getType("Object");
        this.setBaseClass(objectType);
        this.addMethod(new Method("send", new Parameterlist([
            { identifier: "message", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "messageType", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["Helper"];
            let message = parameters[1].value;
            let messageType = parameters[2].value;
            wh.send(message, messageType);
        }, false, false, 'Sendet Daten (message) an diesen Client. Den messageType kannst Du frei wählen. Die client bekommt ihn zusammen mit den Daten übermittelt. Tipp: Du kannst auch Objekte senden, musst sie dazu aber vorher serialisieren, d.h. mithilfe der Methode toJson in eine Zeichenkette verwandeln.', false));
        this.addMethod(new Method("setUserData", new Parameterlist([
            { identifier: "schlüssel", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
            { identifier: "wert", type: objectType, declaration: null, usagePositions: null, isFinal: true },
        ]), voidPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["Helper"];
            let key = parameters[1].value;
            let value = parameters[2].value;
            wh.setUserData(key, value);
        }, false, false, 'Mit dieser Methode kannst Du beliebige Objektreferenzen in diesem WebSocketClient-Objekt speichern. Den Schlüssel kannst Du dabei frei wählen und später nutzen, um den Wert durch die Methode getUserData wieder zu holen.', false));
        this.addMethod(new Method("getUserData", new Parameterlist([
            { identifier: "schlüssel", type: stringPrimitiveType, declaration: null, usagePositions: null, isFinal: true },
        ]), objectType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["Helper"];
            let key = parameters[1].value;
            return wh.getUserData(key);
        }, false, false, 'Mit dieser Methode kannst Du eine Objektreferenz erhalten, die Du zuvor mit der Methode setUserData gespeichert hast. Bemerkung1: Diese Methode entfernt die Objekreferenz nicht aus dem WebSocketClient-Objekt. Bemerkung2: Damit Du alle Methoden des erhaltenen Objekts aufrufen kannst, musst Du dem Computer mitteilen, von welcher Klasse es ist ("casten"). Das geht für die Klasse MeineNutzerDaten bspw. so: MeineNutzerDaten mnd = (MeineNutzerDaten)client.getUserData("schlüssel");', false));
        let getterList = [{ att: "rufname", getter: "getFirstName", help: "Rufnamen" },
            { att: "familienname", getter: "getLastName", help: "Familiennamen" },
            { att: "username", getter: "getUsername", help: "Benutzernamen" }, { att: "nickname", getter: "getNickname", help: "Spielernamen" }];
        for (let getter of getterList) {
            this.addMethod(new Method(getter.getter, new Parameterlist([]), stringPrimitiveType, (parameters) => {
                let o = parameters[0].value;
                let wh = o.intrinsicData["Helper"];
                return wh[getter.att];
            }, false, false, 'Gibt den ' + getter.help + " des Clients zurück.", false));
        }
        this.addMethod(new Method("getIndex", new Parameterlist([]), intPrimitiveType, (parameters) => {
            let o = parameters[0].value;
            let wh = o.intrinsicData["Helper"];
            return wh.index;
        }, false, false, 'Gehört ein Client zu einer mit findClient bzw. findClients gefundenen Gruppe, so erhältst Du mit dieser Methode die "Rangfolge" dieses Clients in dieser Gruppe. Allen Clients wird dieselbe Rangfolgeordnung vom Server mitgeteilt. So lässt sich bspw. einfach festlegen, welcher Client eine besondere Rolle (Server) in der Gruppe erhalten soll (z.B. Client mit Index 1). Bemerkung: Der Index ist eine Zahl zwischen 1 und der Anzahl der Clients in der Gruppe.', false));
    }
}
export class WebSocketClientHelper {
    constructor(runtimeObject, webSocketHelper, id, rufname, familienname, username, nickname) {
        this.runtimeObject = runtimeObject;
        this.webSocketHelper = webSocketHelper;
        this.id = id;
        this.rufname = rufname;
        this.familienname = familienname;
        this.username = username;
        this.nickname = nickname;
        this.keyValueStore = {};
        this.index = 0;
        this.connected = true;
    }
    send(message, messageType) {
        this.webSocketHelper.sendToClient(this.id, message, messageType);
    }
    getUserData(key) {
        return this.keyValueStore[key];
    }
    setUserData(key, value) {
        this.keyValueStore[key] = value;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2ViU29ja2V0Q2xpZW50LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL2NsaWVudC9ydW50aW1lbGlicmFyeS9uZXR3b3JrL1dlYlNvY2tldENsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFDQSxPQUFPLEVBQUUsS0FBSyxFQUFjLE1BQU0sK0JBQStCLENBQUM7QUFDbEUsT0FBTyxFQUFFLGdCQUFnQixFQUFjLG1CQUFtQixFQUFFLGlCQUFpQixFQUFFLE1BQU0sd0NBQXdDLENBQUM7QUFDOUgsT0FBTyxFQUFhLE1BQU0sRUFBRSxhQUFhLEVBQVMsTUFBTSwrQkFBK0IsQ0FBQztBQU14RixNQUFNLE9BQU8sb0JBQXFCLFNBQVEsS0FBSztJQUUzQyxZQUFZLE1BQWM7UUFDdEIsS0FBSyxDQUFDLGlCQUFpQixFQUFFLE1BQU0sRUFBRSx3SUFBd0ksQ0FBQyxDQUFDO1FBRTNLLElBQUksVUFBVSxHQUFVLE1BQU0sQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNELElBQUksQ0FBQyxZQUFZLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFOUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLEVBQUUsSUFBSSxhQUFhLENBQUM7WUFDaEQsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRTtZQUM1RyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsY0FBYyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO1NBQ25ILENBQUMsRUFBRSxpQkFBaUIsRUFDakIsQ0FBQyxVQUFVLEVBQUUsRUFBRTtZQUVYLElBQUksQ0FBQyxHQUFrQixV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Z0I7UUFEMUcsa0JBQWEsR0FBYixhQUFhLENBQWU7UUFBVSxvQkFBZSxHQUFmLGVBQWUsQ0FBaUI7UUFDN0UsT0FBRSxHQUFGLEVBQUUsQ0FBUTtRQUFTLFlBQU8sR0FBUCxPQUFPLENBQVE7UUFBUyxpQkFBWSxHQUFaLFlBQVksQ0FBUTtRQUFTLGFBQVEsR0FBUixRQUFRLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFRO1FBTjdILGtCQUFhLEdBQW1DLEVBQUUsQ0FBQztRQUNuRCxVQUFLLEdBQVcsQ0FBQyxDQUFDO1FBRVgsY0FBUyxHQUFZLElBQUksQ0FBQztJQUtqQyxDQUFDO0lBRUQsSUFBSSxDQUFDLE9BQWUsRUFBRSxXQUFtQjtRQUNyQyxJQUFJLENBQUMsZUFBZSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNyRSxDQUFDO0lBRUQsV0FBVyxDQUFDLEdBQVc7UUFDbkIsT0FBTyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ25DLENBQUM7SUFFRCxXQUFXLENBQUMsR0FBVyxFQUFFLEtBQW9CO1FBQ3pDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ3BDLENBQUM7Q0FHSiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vZHVsZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci9wYXJzZXIvTW9kdWxlLmpzXCI7XHJcbmltcG9ydCB7IEtsYXNzLCBWaXNpYmlsaXR5IH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL0NsYXNzLmpzXCI7XHJcbmltcG9ydCB7IGludFByaW1pdGl2ZVR5cGUsIG9iamVjdFR5cGUsIHN0cmluZ1ByaW1pdGl2ZVR5cGUsIHZvaWRQcmltaXRpdmVUeXBlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3R5cGVzL1ByaW1pdGl2ZVR5cGVzLmpzXCI7XHJcbmltcG9ydCB7IEF0dHJpYnV0ZSwgTWV0aG9kLCBQYXJhbWV0ZXJsaXN0LCBWYWx1ZSB9IGZyb20gXCIuLi8uLi9jb21waWxlci90eXBlcy9UeXBlcy5qc1wiO1xyXG5pbXBvcnQgeyBJbnRlcnByZXRlciB9IGZyb20gXCIuLi8uLi9pbnRlcnByZXRlci9JbnRlcnByZXRlci5qc1wiO1xyXG5pbXBvcnQgeyBSdW50aW1lT2JqZWN0IH0gZnJvbSBcIi4uLy4uL2ludGVycHJldGVyL1J1bnRpbWVPYmplY3QuanNcIjtcclxuaW1wb3J0IHsgV2ViU29ja2V0UmVxdWVzdENvbm5lY3QsIFdlYlNvY2tldFJlcXVlc3REaXNjb25uZWN0LCBXZWJTb2NrZXRSZXF1ZXN0U2VuZFRvQWxsLCBXZWJTb2NrZXRSZXF1ZXN0U2VuZFRvQ2xpZW50LCBXZWJTb2NrZXRSZXNwb25zZU90aGVyQ2xpZW50RGlzY29ubmVjdGVkLCBXZWJTb2NrZXRSZXNwb25zZU1lc3NhZ2UsIFdlYlNvY2tldFJlc3BvbnNlTmV3Q2xpZW50LCBXZWJTb2NrZXRSZXNwb25zZSB9IGZyb20gXCIuLi8uLi9jb21tdW5pY2F0aW9uL0RhdGEuanNcIjtcclxuaW1wb3J0IHsgV2ViU29ja2V0SGVscGVyIH0gZnJvbSBcIi4vV2ViU29ja2V0LmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgV2ViU29ja2V0Q2xpZW50Q2xhc3MgZXh0ZW5kcyBLbGFzcyB7XHJcblxyXG4gICAgY29uc3RydWN0b3IobW9kdWxlOiBNb2R1bGUpIHtcclxuICAgICAgICBzdXBlcihcIldlYlNvY2tldENsaWVudFwiLCBtb2R1bGUsIFwiRWluIE9iamVrdCBkZXIgS2xhc3NlIFdlYlNvY2tldENsaWVudCByZXByw6RzZW50aWVydCBlaW5lbiBhbmRlcmVuIFJlY2huZXIsIG1pdCBkZW0gZGllc2VyIFJlY2huZXIgw7xiZXIgZGVuIFdlYlNvY2tldCBpbiBLb250YWt0IHN0ZWh0LlwiKTtcclxuXHJcbiAgICAgICAgbGV0IG9iamVjdFR5cGUgPSA8S2xhc3M+bW9kdWxlLnR5cGVTdG9yZS5nZXRUeXBlKFwiT2JqZWN0XCIpO1xyXG4gICAgICAgIHRoaXMuc2V0QmFzZUNsYXNzKG9iamVjdFR5cGUpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKFwic2VuZFwiLCBuZXcgUGFyYW1ldGVybGlzdChbXHJcbiAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJtZXNzYWdlXCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGlkZW50aWZpZXI6IFwibWVzc2FnZVR5cGVcIiwgdHlwZTogc3RyaW5nUHJpbWl0aXZlVHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgXSksIHZvaWRQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG5cclxuICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCB3aDogV2ViU29ja2V0Q2xpZW50SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiSGVscGVyXCJdO1xyXG4gICAgICAgICAgICAgICAgbGV0IG1lc3NhZ2U6IHN0cmluZyA9IHBhcmFtZXRlcnNbMV0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICBsZXQgbWVzc2FnZVR5cGU6IHN0cmluZyA9IHBhcmFtZXRlcnNbMl0udmFsdWU7XHJcblxyXG4gICAgICAgICAgICAgICAgd2guc2VuZChtZXNzYWdlLCBtZXNzYWdlVHlwZSk7XHJcblxyXG4gICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdTZW5kZXQgRGF0ZW4gKG1lc3NhZ2UpIGFuIGRpZXNlbiBDbGllbnQuIERlbiBtZXNzYWdlVHlwZSBrYW5uc3QgRHUgZnJlaSB3w6RobGVuLiBEaWUgY2xpZW50IGJla29tbXQgaWhuIHp1c2FtbWVuIG1pdCBkZW4gRGF0ZW4gw7xiZXJtaXR0ZWx0LiBUaXBwOiBEdSBrYW5uc3QgYXVjaCBPYmpla3RlIHNlbmRlbiwgbXVzc3Qgc2llIGRhenUgYWJlciB2b3JoZXIgc2VyaWFsaXNpZXJlbiwgZC5oLiBtaXRoaWxmZSBkZXIgTWV0aG9kZSB0b0pzb24gaW4gZWluZSBaZWljaGVua2V0dGUgdmVyd2FuZGVsbi4nLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcInNldFVzZXJEYXRhXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJzY2hsw7xzc2VsXCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICAgICAgeyBpZGVudGlmaWVyOiBcIndlcnRcIiwgdHlwZTogb2JqZWN0VHlwZSwgZGVjbGFyYXRpb246IG51bGwsIHVzYWdlUG9zaXRpb25zOiBudWxsLCBpc0ZpbmFsOiB0cnVlIH0sXHJcbiAgICAgICAgICAgIF0pLCB2b2lkUHJpbWl0aXZlVHlwZSxcclxuICAgICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdoOiBXZWJTb2NrZXRDbGllbnRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJIZWxwZXJcIl07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGtleTogc3RyaW5nID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWU6IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzJdLnZhbHVlO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgd2guc2V0VXNlckRhdGEoa2V5LCB2YWx1ZSk7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgIH0sIGZhbHNlLCBmYWxzZSwgJ01pdCBkaWVzZXIgTWV0aG9kZSBrYW5uc3QgRHUgYmVsaWViaWdlIE9iamVrdHJlZmVyZW56ZW4gaW4gZGllc2VtIFdlYlNvY2tldENsaWVudC1PYmpla3Qgc3BlaWNoZXJuLiBEZW4gU2NobMO8c3NlbCBrYW5uc3QgRHUgZGFiZWkgZnJlaSB3w6RobGVuIHVuZCBzcMOkdGVyIG51dHplbiwgdW0gZGVuIFdlcnQgZHVyY2ggZGllIE1ldGhvZGUgZ2V0VXNlckRhdGEgd2llZGVyIHp1IGhvbGVuLicsIGZhbHNlKSk7XHJcbiAgICBcclxuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldFVzZXJEYXRhXCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgICAgIHsgaWRlbnRpZmllcjogXCJzY2hsw7xzc2VsXCIsIHR5cGU6IHN0cmluZ1ByaW1pdGl2ZVR5cGUsIGRlY2xhcmF0aW9uOiBudWxsLCB1c2FnZVBvc2l0aW9uczogbnVsbCwgaXNGaW5hbDogdHJ1ZSB9LFxyXG4gICAgICAgICAgICBdKSwgb2JqZWN0VHlwZSxcclxuICAgICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICBcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbzogUnVudGltZU9iamVjdCA9IHBhcmFtZXRlcnNbMF0udmFsdWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IHdoOiBXZWJTb2NrZXRDbGllbnRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJIZWxwZXJcIl07XHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IGtleTogc3RyaW5nID0gcGFyYW1ldGVyc1sxXS52YWx1ZTtcclxuICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB3aC5nZXRVc2VyRGF0YShrZXkpO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdNaXQgZGllc2VyIE1ldGhvZGUga2FubnN0IER1IGVpbmUgT2JqZWt0cmVmZXJlbnogZXJoYWx0ZW4sIGRpZSBEdSB6dXZvciBtaXQgZGVyIE1ldGhvZGUgc2V0VXNlckRhdGEgZ2VzcGVpY2hlcnQgaGFzdC4gQmVtZXJrdW5nMTogRGllc2UgTWV0aG9kZSBlbnRmZXJudCBkaWUgT2JqZWtyZWZlcmVueiBuaWNodCBhdXMgZGVtIFdlYlNvY2tldENsaWVudC1PYmpla3QuIEJlbWVya3VuZzI6IERhbWl0IER1IGFsbGUgTWV0aG9kZW4gZGVzIGVyaGFsdGVuZW4gT2JqZWt0cyBhdWZydWZlbiBrYW5uc3QsIG11c3N0IER1IGRlbSBDb21wdXRlciBtaXR0ZWlsZW4sIHZvbiB3ZWxjaGVyIEtsYXNzZSBlcyBpc3QgKFwiY2FzdGVuXCIpLiBEYXMgZ2VodCBmw7xyIGRpZSBLbGFzc2UgTWVpbmVOdXR6ZXJEYXRlbiBic3B3LiBzbzogTWVpbmVOdXR6ZXJEYXRlbiBtbmQgPSAoTWVpbmVOdXR6ZXJEYXRlbiljbGllbnQuZ2V0VXNlckRhdGEoXCJzY2hsw7xzc2VsXCIpOycsIGZhbHNlKSk7XHJcblxyXG4gICAgICAgICAgICBsZXQgZ2V0dGVyTGlzdDogeyBhdHQ6IHN0cmluZywgZ2V0dGVyOiBzdHJpbmcsIGhlbHA6IHN0cmluZ31bXSA9IFt7YXR0OiBcInJ1Zm5hbWVcIiwgZ2V0dGVyOiBcImdldEZpcnN0TmFtZVwiLCBoZWxwOiBcIlJ1Zm5hbWVuXCJ9LFxyXG4gICAgICAgICAgICAge2F0dDogXCJmYW1pbGllbm5hbWVcIiwgZ2V0dGVyOiBcImdldExhc3ROYW1lXCIsIGhlbHA6IFwiRmFtaWxpZW5uYW1lblwifSwgXHJcbiAgICAgICAgICAgIHthdHQ6IFwidXNlcm5hbWVcIiwgZ2V0dGVyOiBcImdldFVzZXJuYW1lXCIsIGhlbHA6IFwiQmVudXR6ZXJuYW1lblwifSwge2F0dDogXCJuaWNrbmFtZVwiLCBnZXR0ZXI6IFwiZ2V0Tmlja25hbWVcIiwgaGVscDogXCJTcGllbGVybmFtZW5cIn0gIF07XHJcblxyXG4gICAgICAgICAgICBmb3IoIGxldCBnZXR0ZXIgb2YgZ2V0dGVyTGlzdCl7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZE1ldGhvZChuZXcgTWV0aG9kKGdldHRlci5nZXR0ZXIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgICAgIF0pLCBzdHJpbmdQcmltaXRpdmVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIChwYXJhbWV0ZXJzKSA9PiB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBvOiBSdW50aW1lT2JqZWN0ID0gcGFyYW1ldGVyc1swXS52YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHdoOiBXZWJTb2NrZXRDbGllbnRIZWxwZXIgPSBvLmludHJpbnNpY0RhdGFbXCJIZWxwZXJcIl07XHJcbiAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3aFtnZXR0ZXIuYXR0XTtcclxuICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHaWJ0IGRlbiAnICsgZ2V0dGVyLmhlbHAgKyBcIiBkZXMgQ2xpZW50cyB6dXLDvGNrLlwiLCBmYWxzZSkpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdGhpcy5hZGRNZXRob2QobmV3IE1ldGhvZChcImdldEluZGV4XCIsIG5ldyBQYXJhbWV0ZXJsaXN0KFtcclxuICAgICAgICAgICAgXSksIGludFByaW1pdGl2ZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAocGFyYW1ldGVycykgPT4ge1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG86IFJ1bnRpbWVPYmplY3QgPSBwYXJhbWV0ZXJzWzBdLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCB3aDogV2ViU29ja2V0Q2xpZW50SGVscGVyID0gby5pbnRyaW5zaWNEYXRhW1wiSGVscGVyXCJdO1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHdoLmluZGV4O1xyXG4gICAgXHJcbiAgICAgICAgICAgICAgICB9LCBmYWxzZSwgZmFsc2UsICdHZWjDtnJ0IGVpbiBDbGllbnQgenUgZWluZXIgbWl0IGZpbmRDbGllbnQgYnp3LiBmaW5kQ2xpZW50cyBnZWZ1bmRlbmVuIEdydXBwZSwgc28gZXJow6RsdHN0IER1IG1pdCBkaWVzZXIgTWV0aG9kZSBkaWUgXCJSYW5nZm9sZ2VcIiBkaWVzZXMgQ2xpZW50cyBpbiBkaWVzZXIgR3J1cHBlLiBBbGxlbiBDbGllbnRzIHdpcmQgZGllc2VsYmUgUmFuZ2ZvbGdlb3JkbnVuZyB2b20gU2VydmVyIG1pdGdldGVpbHQuIFNvIGzDpHNzdCBzaWNoIGJzcHcuIGVpbmZhY2ggZmVzdGxlZ2VuLCB3ZWxjaGVyIENsaWVudCBlaW5lIGJlc29uZGVyZSBSb2xsZSAoU2VydmVyKSBpbiBkZXIgR3J1cHBlIGVyaGFsdGVuIHNvbGwgKHouQi4gQ2xpZW50IG1pdCBJbmRleCAxKS4gQmVtZXJrdW5nOiBEZXIgSW5kZXggaXN0IGVpbmUgWmFobCB6d2lzY2hlbiAxIHVuZCBkZXIgQW56YWhsIGRlciBDbGllbnRzIGluIGRlciBHcnVwcGUuJywgZmFsc2UpKTtcclxuXHJcbiAgICBcclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgV2ViU29ja2V0Q2xpZW50SGVscGVyIHtcclxuXHJcbiAgICBrZXlWYWx1ZVN0b3JlOiB7W2tleTogc3RyaW5nXTogUnVudGltZU9iamVjdH0gPSB7fTtcclxuICAgIGluZGV4OiBudW1iZXIgPSAwO1xyXG5cclxuICAgIHB1YmxpYyBjb25uZWN0ZWQ6IGJvb2xlYW4gPSB0cnVlO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBydW50aW1lT2JqZWN0OiBSdW50aW1lT2JqZWN0LCBwcml2YXRlIHdlYlNvY2tldEhlbHBlcjogV2ViU29ja2V0SGVscGVyLCBcclxuICAgICAgICBwcml2YXRlIGlkOiBudW1iZXIsIHB1YmxpYyBydWZuYW1lOiBzdHJpbmcsIHB1YmxpYyBmYW1pbGllbm5hbWU6IHN0cmluZywgcHVibGljIHVzZXJuYW1lOiBzdHJpbmcsIHB1YmxpYyBuaWNrbmFtZTogc3RyaW5nKSB7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHNlbmQobWVzc2FnZTogc3RyaW5nLCBtZXNzYWdlVHlwZTogc3RyaW5nKXtcclxuICAgICAgICB0aGlzLndlYlNvY2tldEhlbHBlci5zZW5kVG9DbGllbnQodGhpcy5pZCwgbWVzc2FnZSwgbWVzc2FnZVR5cGUpOyAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICBnZXRVc2VyRGF0YShrZXk6IHN0cmluZyk6IGFueSB7XHJcbiAgICAgICAgcmV0dXJuIHRoaXMua2V5VmFsdWVTdG9yZVtrZXldO1xyXG4gICAgfVxyXG5cclxuICAgIHNldFVzZXJEYXRhKGtleTogc3RyaW5nLCB2YWx1ZTogUnVudGltZU9iamVjdCkge1xyXG4gICAgICAgIHRoaXMua2V5VmFsdWVTdG9yZVtrZXldID0gdmFsdWU7XHJcbiAgICB9XHJcblxyXG5cclxufSJdfQ==