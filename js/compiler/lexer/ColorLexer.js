export class ColorLexer {
    constructor() {
        this.hexColorRegExp = /^#([a-fA-F0-9]{6})$/;
        this.rgbColorRegExp = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
        this.rgbaColorRegExp = /^rgba\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d*(?:\.\d+)?)\)$/;
    }
    getColorInfo(s) {
        if (s.startsWith('#')) {
            let m1 = s.match(this.hexColorRegExp);
            if (m1 == null)
                return null;
            let value = Number.parseInt(m1[1], 16);
            return {
                red: (value >> 16) / 255,
                green: ((value >> 8) & 0xff) / 255,
                blue: (value & 0xff) / 255,
                alpha: 1
            };
        }
        else if (s.startsWith('rgb')) {
            if (s.startsWith('rgba')) {
                let m2 = s.match(this.rgbaColorRegExp);
                if (m2 == null)
                    return null;
                return {
                    red: Number.parseInt(m2[1]) / 255,
                    green: Number.parseInt(m2[2]) / 255,
                    blue: Number.parseInt(m2[3]) / 255,
                    alpha: Number.parseFloat(m2[4])
                };
            }
            else {
                let m3 = s.match(this.rgbColorRegExp);
                if (m3 == null)
                    return null;
                return {
                    red: Number.parseInt(m3[1]) / 255,
                    green: Number.parseInt(m3[2]) / 255,
                    blue: Number.parseInt(m3[3]) / 255,
                    alpha: 1
                };
            }
        }
        return null;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sb3JMZXhlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvY29tcGlsZXIvbGV4ZXIvQ29sb3JMZXhlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLE9BQU8sVUFBVTtJQUF2QjtRQUNJLG1CQUFjLEdBQUcscUJBQXFCLENBQUM7UUFDdkMsbUJBQWMsR0FBRyw4Q0FBOEMsQ0FBQztRQUNoRSxvQkFBZSxHQUFHLGtFQUFrRSxDQUFDO0lBZ0R6RixDQUFDO0lBOUNHLFlBQVksQ0FBQyxDQUFTO1FBRWxCLElBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBQztZQUNqQixJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0QyxJQUFHLEVBQUUsSUFBSSxJQUFJO2dCQUFFLE9BQU8sSUFBSSxDQUFDO1lBRTNCLElBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLE9BQU87Z0JBQ0gsR0FBRyxFQUFFLENBQUMsS0FBSyxJQUFJLEVBQUUsQ0FBQyxHQUFDLEdBQUc7Z0JBQ3RCLEtBQUssRUFBRSxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUc7Z0JBQ2xDLElBQUksRUFBRSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBQyxHQUFHO2dCQUN4QixLQUFLLEVBQUUsQ0FBQzthQUNYLENBQUE7U0FFSjthQUFNLElBQUcsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBQztZQUUxQixJQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUM7Z0JBQ3BCLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2dCQUN2QyxJQUFHLEVBQUUsSUFBSSxJQUFJO29CQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUUzQixPQUFPO29CQUNILEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUc7b0JBQy9CLEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUc7b0JBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUc7b0JBQ2hDLEtBQUssRUFBRSxNQUFNLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDbEMsQ0FBQTthQUNKO2lCQUFNO2dCQUNILElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO2dCQUN0QyxJQUFHLEVBQUUsSUFBSSxJQUFJO29CQUFFLE9BQU8sSUFBSSxDQUFDO2dCQUUzQixPQUFPO29CQUNILEdBQUcsRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUc7b0JBQy9CLEtBQUssRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUc7b0JBQ25DLElBQUksRUFBRSxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFDLEdBQUc7b0JBQ2hDLEtBQUssRUFBRSxDQUFDO2lCQUNYLENBQUE7YUFHSjtTQUVKO1FBRUQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIENvbG9yTGV4ZXIge1xyXG4gICAgaGV4Q29sb3JSZWdFeHAgPSAvXiMoW2EtZkEtRjAtOV17Nn0pJC87XHJcbiAgICByZ2JDb2xvclJlZ0V4cCA9IC9ecmdiXFwoKFxcZHsxLDN9KSxcXHMqKFxcZHsxLDN9KSxcXHMqKFxcZHsxLDN9KVxcKSQvO1xyXG4gICAgcmdiYUNvbG9yUmVnRXhwID0gL15yZ2JhXFwoKFxcZHsxLDN9KSxcXHMqKFxcZHsxLDN9KSxcXHMqKFxcZHsxLDN9KSxcXHMqKFxcZCooPzpcXC5cXGQrKT8pXFwpJC87XHJcblxyXG4gICAgZ2V0Q29sb3JJbmZvKHM6IHN0cmluZyk6IG1vbmFjby5sYW5ndWFnZXMuSUNvbG9yIHtcclxuXHJcbiAgICAgICAgaWYocy5zdGFydHNXaXRoKCcjJykpe1xyXG4gICAgICAgICAgICBsZXQgbTEgPSBzLm1hdGNoKHRoaXMuaGV4Q29sb3JSZWdFeHApO1xyXG4gICAgICAgICAgICBpZihtMSA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIGxldCB2YWx1ZSA9IE51bWJlci5wYXJzZUludChtMVsxXSwgMTYpO1xyXG4gICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgcmVkOiAodmFsdWUgPj4gMTYpLzI1NSxcclxuICAgICAgICAgICAgICAgIGdyZWVuOiAoKHZhbHVlID4+IDgpICYgMHhmZikgLyAyNTUsXHJcbiAgICAgICAgICAgICAgICBibHVlOiAodmFsdWUgJiAweGZmKS8yNTUsXHJcbiAgICAgICAgICAgICAgICBhbHBoYTogMVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH0gZWxzZSBpZihzLnN0YXJ0c1dpdGgoJ3JnYicpKXtcclxuXHJcbiAgICAgICAgICAgIGlmKHMuc3RhcnRzV2l0aCgncmdiYScpKXtcclxuICAgICAgICAgICAgICAgIGxldCBtMiA9IHMubWF0Y2godGhpcy5yZ2JhQ29sb3JSZWdFeHApO1xyXG4gICAgICAgICAgICAgICAgaWYobTIgPT0gbnVsbCkgcmV0dXJuIG51bGw7XHJcblxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgICAgICByZWQ6IE51bWJlci5wYXJzZUludChtMlsxXSkvMjU1LFxyXG4gICAgICAgICAgICAgICAgICAgIGdyZWVuOiBOdW1iZXIucGFyc2VJbnQobTJbMl0pIC8gMjU1LFxyXG4gICAgICAgICAgICAgICAgICAgIGJsdWU6IE51bWJlci5wYXJzZUludChtMlszXSkvMjU1LFxyXG4gICAgICAgICAgICAgICAgICAgIGFscGhhOiBOdW1iZXIucGFyc2VGbG9hdChtMls0XSlcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGxldCBtMyA9IHMubWF0Y2godGhpcy5yZ2JDb2xvclJlZ0V4cCk7XHJcbiAgICAgICAgICAgICAgICBpZihtMyA9PSBudWxsKSByZXR1cm4gbnVsbDtcclxuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlZDogTnVtYmVyLnBhcnNlSW50KG0zWzFdKS8yNTUsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JlZW46IE51bWJlci5wYXJzZUludChtM1syXSkgLyAyNTUsXHJcbiAgICAgICAgICAgICAgICAgICAgYmx1ZTogTnVtYmVyLnBhcnNlSW50KG0zWzNdKS8yNTUsXHJcbiAgICAgICAgICAgICAgICAgICAgYWxwaGE6IDFcclxuICAgICAgICAgICAgICAgIH1cclxuICAgIFxyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBudWxsO1xyXG4gICAgfVxyXG5cclxuXHJcbn0iXX0=