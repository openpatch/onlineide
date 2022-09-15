export class MyReferenceProvider {
    constructor(main) {
        this.main = main;
    }
    provideReferences(model, position, context, token) {
        let module = this.main.getCurrentWorkspace().getModuleByMonacoModel(model);
        if (module == null)
            return null;
        let element = module.getElementAtPosition(position.lineNumber, position.column);
        if (element == null) {
            return;
        }
        let usagePositions = element.usagePositions;
        //06.06.2020
        let referencePositions = [];
        usagePositions.forEach((upInCurrentModule, module) => {
            if (upInCurrentModule != null) {
                for (let up of upInCurrentModule) {
                    referencePositions.push({
                        uri: module.uri,
                        range: { startColumn: up.column, startLineNumber: up.line, endLineNumber: up.line, endColumn: up.column + up.length }
                    });
                }
            }
        });
        return referencePositions;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTXlSZWZlcmVuY2VQcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9jbGllbnQvbWFpbi9ndWkvTXlSZWZlcmVuY2VQcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFJQSxNQUFNLE9BQU8sbUJBQW1CO0lBRTVCLFlBQW9CLElBQWM7UUFBZCxTQUFJLEdBQUosSUFBSSxDQUFVO0lBRWxDLENBQUM7SUFFRCxpQkFBaUIsQ0FBQyxLQUErQixFQUFFLFFBQXlCLEVBQUUsT0FBMEMsRUFBRSxLQUErQjtRQUdySixJQUFJLE1BQU0sR0FBVyxJQUFJLENBQUMsSUFBSSxDQUFDLG1CQUFtQixFQUFFLENBQUMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFbkYsSUFBSSxNQUFNLElBQUksSUFBSTtZQUFFLE9BQU8sSUFBSSxDQUFDO1FBRWhDLElBQUksT0FBTyxHQUFHLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRixJQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7WUFDakIsT0FBTztTQUNWO1FBRUQsSUFBSSxjQUFjLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQztRQUU1QyxZQUFZO1FBQ1osSUFBSSxrQkFBa0IsR0FBZ0MsRUFBRSxDQUFDO1FBRXpELGNBQWMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsRUFBRTtZQUNqRCxJQUFJLGlCQUFpQixJQUFJLElBQUksRUFBRTtnQkFDM0IsS0FBSyxJQUFJLEVBQUUsSUFBSSxpQkFBaUIsRUFBRTtvQkFDOUIsa0JBQWtCLENBQUMsSUFBSSxDQUNuQjt3QkFDSSxHQUFHLEVBQUUsTUFBTSxDQUFDLEdBQUc7d0JBQ2YsS0FBSyxFQUFFLEVBQUUsV0FBVyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEVBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsYUFBYSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEVBQUUsQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDLE1BQU0sRUFBRTtxQkFDeEgsQ0FBQyxDQUFDO2lCQUNWO2FBQ0o7UUFFTCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sa0JBQWtCLENBQUM7SUFFOUIsQ0FBQztDQUdKIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTW9kdWxlIH0gZnJvbSBcIi4uLy4uL2NvbXBpbGVyL3BhcnNlci9Nb2R1bGUuanNcIjtcclxuaW1wb3J0IHsgRWRpdG9yIH0gZnJvbSBcIi4vRWRpdG9yLmpzXCI7XHJcbmltcG9ydCB7IE1haW5CYXNlIH0gZnJvbSBcIi4uL01haW5CYXNlLmpzXCI7XHJcblxyXG5leHBvcnQgY2xhc3MgTXlSZWZlcmVuY2VQcm92aWRlciBpbXBsZW1lbnRzIG1vbmFjby5sYW5ndWFnZXMuUmVmZXJlbmNlUHJvdmlkZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgbWFpbjogTWFpbkJhc2UpIHtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgcHJvdmlkZVJlZmVyZW5jZXMobW9kZWw6IG1vbmFjby5lZGl0b3IuSVRleHRNb2RlbCwgcG9zaXRpb246IG1vbmFjby5Qb3NpdGlvbiwgY29udGV4dDogbW9uYWNvLmxhbmd1YWdlcy5SZWZlcmVuY2VDb250ZXh0LCB0b2tlbjogbW9uYWNvLkNhbmNlbGxhdGlvblRva2VuKTpcclxuICAgICAgICBtb25hY28ubGFuZ3VhZ2VzLlByb3ZpZGVyUmVzdWx0PG1vbmFjby5sYW5ndWFnZXMuTG9jYXRpb25bXT4ge1xyXG5cclxuICAgICAgICBsZXQgbW9kdWxlOiBNb2R1bGUgPSB0aGlzLm1haW4uZ2V0Q3VycmVudFdvcmtzcGFjZSgpLmdldE1vZHVsZUJ5TW9uYWNvTW9kZWwobW9kZWwpO1xyXG5cclxuICAgICAgICBpZiAobW9kdWxlID09IG51bGwpIHJldHVybiBudWxsO1xyXG5cclxuICAgICAgICBsZXQgZWxlbWVudCA9IG1vZHVsZS5nZXRFbGVtZW50QXRQb3NpdGlvbihwb3NpdGlvbi5saW5lTnVtYmVyLCBwb3NpdGlvbi5jb2x1bW4pO1xyXG4gICAgICAgIGlmIChlbGVtZW50ID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHVzYWdlUG9zaXRpb25zID0gZWxlbWVudC51c2FnZVBvc2l0aW9ucztcclxuXHJcbiAgICAgICAgLy8wNi4wNi4yMDIwXHJcbiAgICAgICAgbGV0IHJlZmVyZW5jZVBvc2l0aW9uczogbW9uYWNvLmxhbmd1YWdlcy5Mb2NhdGlvbltdID0gW107XHJcblxyXG4gICAgICAgIHVzYWdlUG9zaXRpb25zLmZvckVhY2goKHVwSW5DdXJyZW50TW9kdWxlLCBtb2R1bGUpID0+IHtcclxuICAgICAgICAgICAgaWYgKHVwSW5DdXJyZW50TW9kdWxlICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHVwIG9mIHVwSW5DdXJyZW50TW9kdWxlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVmZXJlbmNlUG9zaXRpb25zLnB1c2goXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVyaTogbW9kdWxlLnVyaSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlOiB7IHN0YXJ0Q29sdW1uOiB1cC5jb2x1bW4sIHN0YXJ0TGluZU51bWJlcjogdXAubGluZSwgZW5kTGluZU51bWJlcjogdXAubGluZSwgZW5kQ29sdW1uOiB1cC5jb2x1bW4gKyB1cC5sZW5ndGggfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHJlZmVyZW5jZVBvc2l0aW9ucztcclxuXHJcbiAgICB9XHJcblxyXG5cclxufVxyXG5cclxuXHJcbiJdfQ==