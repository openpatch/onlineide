import { Workspace } from "./Workspace.js";
import { Module } from "../compiler/parser/Module.js";
export function getMockupWorkspace(main) {
    let ws = new Workspace("Mockup-Workspace", main, 0);
    let file1 = {
        name: "Punkt.java",
        // text: "",
        text: `
// Berechnung von Primzahlzwillingen
int max = 100000;
boolean[] isPrime = new boolean[max];
for(int i = 0; i < max; i++){
    isPrime[i] = true;
}

int i = 2;
while(i < max){
    // Vielfache von i streichen
    int j = 2*i;
    while(j < max){
        isPrime[j] = false;
        j += i;
    }

    i++;
    while(i < max && !isPrime[i]){
        i++;
    }
}

int k = 0;
for(int i = 0; i < max - 2; i++){
    if(isPrime[i] && isPrime[i+2]) { 
        print(i + "/" + (i + 2) + "; ");
        k++;
    }
    if(k % 10 == 0) println("");
}

println();
println(k + " Primzahlzwillinge gefunden!");`,
        dirty: true,
        saved: true,
        version: 1
    };
    let file2 = {
        name: "Test.java",
        text: `Test t = new Test();
t.a = 12;
t.print1();

class Test {
    int a;
    int[] b = new int[8];
    
    void print1(){
        print(a);
    }
}
`,
        dirty: true,
        saved: true,
        version: 1
    };
    let file3 = {
        name: "Test.java",
        text: `println("Test".toUpperCase());
println("Test".toLowerCase());
println("Test".length());
println("Test".substring(2, 4));
println("Test".substring(2));
println("Test".equalsIgnoreCase("test"));
println("Test".equalsIgnoreCase("test1"));
println("Test".equals("test"));
println("Test".equals("Test"));
println("Test".endsWith("st"));
println("Test".endsWith("ew"));
println("   Test   ".trim());
println("Apples are juicy and Apples are red.".replaceAll("Apples", "Oranges"));

String[] teile = "Apples are juicy and Apples are red".split("e");
for(int i = 0; i < teile.length; i++){
    println(teile[i]);
}

println(teile.length)
`,
        dirty: true,
        saved: true,
        version: 1
    };
    let file4 = {
        name: "Test.java",
        text: `int i = 0;

while(true){
    i++;

    if(i % 100 == 0){
        print(i);
    }

    if(i % 1000 == 0){
        println("");
    }

}`,
        dirty: true,
        saved: true,
        version: 1
    };
    ws.moduleStore.putModule(new Module(file1, main));
    // ws.moduleStore.putModule(new Module(file2, main));
    // ws.moduleStore.putModule(new Module(file3, main));
    // ws.moduleStore.putModule(new Module(file4, main));
    return ws;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTmV0d29ya01vY2t1cC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvd29ya3NwYWNlL05ldHdvcmtNb2NrdXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxFQUFFLFNBQVMsRUFBRSxNQUFNLGdCQUFnQixDQUFDO0FBQzNDLE9BQU8sRUFBUSxNQUFNLEVBQUUsTUFBTSw4QkFBOEIsQ0FBQztBQUc1RCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBVTtJQUV6QyxJQUFJLEVBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFcEQsSUFBSSxLQUFLLEdBQVE7UUFDYixJQUFJLEVBQUUsWUFBWTtRQUMxQixZQUFZO1FBQ1osSUFBSSxFQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7NkNBaUN3QztRQUNyQyxLQUFLLEVBQUUsSUFBSTtRQUNYLEtBQUssRUFBRSxJQUFJO1FBQ1gsT0FBTyxFQUFFLENBQUM7S0FDYixDQUFDO0lBRUYsSUFBSSxLQUFLLEdBQVE7UUFDYixJQUFJLEVBQUUsV0FBVztRQUNqQixJQUFJLEVBQ1o7Ozs7Ozs7Ozs7OztDQVlDO1FBQ08sS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsSUFBSTtRQUNYLE9BQU8sRUFBRSxDQUFDO0tBQ2IsQ0FBQztJQUVGLElBQUksS0FBSyxHQUFRO1FBQ2IsSUFBSSxFQUFFLFdBQVc7UUFDakIsSUFBSSxFQUNaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CQztRQUNPLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxPQUFPLEVBQUUsQ0FBQztLQUNiLENBQUM7SUFFRixJQUFJLEtBQUssR0FBUTtRQUNiLElBQUksRUFBRSxXQUFXO1FBQ2pCLElBQUksRUFDWjs7Ozs7Ozs7Ozs7OztFQWFFO1FBQ00sS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsSUFBSTtRQUNYLE9BQU8sRUFBRSxDQUFDO0tBQ2IsQ0FBQztJQUVGLEVBQUUsQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ2xELHFEQUFxRDtJQUNyRCxxREFBcUQ7SUFDckQscURBQXFEO0lBRXJELE9BQU8sRUFBRSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFdvcmtzcGFjZSB9IGZyb20gXCIuL1dvcmtzcGFjZS5qc1wiO1xyXG5pbXBvcnQgeyBGaWxlLCBNb2R1bGUgfSBmcm9tIFwiLi4vY29tcGlsZXIvcGFyc2VyL01vZHVsZS5qc1wiO1xyXG5pbXBvcnQgeyBNYWluIH0gZnJvbSBcIi4uL21haW4vTWFpbi5qc1wiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vY2t1cFdvcmtzcGFjZShtYWluOiBNYWluKTpXb3Jrc3BhY2Uge1xyXG5cclxuICAgIGxldCB3cyA9IG5ldyBXb3Jrc3BhY2UoXCJNb2NrdXAtV29ya3NwYWNlXCIsIG1haW4sIDApO1xyXG5cclxuICAgIGxldCBmaWxlMTpGaWxlID0ge1xyXG4gICAgICAgIG5hbWU6IFwiUHVua3QuamF2YVwiLFxyXG4vLyB0ZXh0OiBcIlwiLFxyXG50ZXh0OmBcclxuLy8gQmVyZWNobnVuZyB2b24gUHJpbXphaGx6d2lsbGluZ2VuXHJcbmludCBtYXggPSAxMDAwMDA7XHJcbmJvb2xlYW5bXSBpc1ByaW1lID0gbmV3IGJvb2xlYW5bbWF4XTtcclxuZm9yKGludCBpID0gMDsgaSA8IG1heDsgaSsrKXtcclxuICAgIGlzUHJpbWVbaV0gPSB0cnVlO1xyXG59XHJcblxyXG5pbnQgaSA9IDI7XHJcbndoaWxlKGkgPCBtYXgpe1xyXG4gICAgLy8gVmllbGZhY2hlIHZvbiBpIHN0cmVpY2hlblxyXG4gICAgaW50IGogPSAyKmk7XHJcbiAgICB3aGlsZShqIDwgbWF4KXtcclxuICAgICAgICBpc1ByaW1lW2pdID0gZmFsc2U7XHJcbiAgICAgICAgaiArPSBpO1xyXG4gICAgfVxyXG5cclxuICAgIGkrKztcclxuICAgIHdoaWxlKGkgPCBtYXggJiYgIWlzUHJpbWVbaV0pe1xyXG4gICAgICAgIGkrKztcclxuICAgIH1cclxufVxyXG5cclxuaW50IGsgPSAwO1xyXG5mb3IoaW50IGkgPSAwOyBpIDwgbWF4IC0gMjsgaSsrKXtcclxuICAgIGlmKGlzUHJpbWVbaV0gJiYgaXNQcmltZVtpKzJdKSB7IFxyXG4gICAgICAgIHByaW50KGkgKyBcIi9cIiArIChpICsgMikgKyBcIjsgXCIpO1xyXG4gICAgICAgIGsrKztcclxuICAgIH1cclxuICAgIGlmKGsgJSAxMCA9PSAwKSBwcmludGxuKFwiXCIpO1xyXG59XHJcblxyXG5wcmludGxuKCk7XHJcbnByaW50bG4oayArIFwiIFByaW16YWhsendpbGxpbmdlIGdlZnVuZGVuIVwiKTtgLFxyXG4gICAgICAgIGRpcnR5OiB0cnVlLFxyXG4gICAgICAgIHNhdmVkOiB0cnVlLFxyXG4gICAgICAgIHZlcnNpb246IDFcclxuICAgIH07XHJcblxyXG4gICAgbGV0IGZpbGUyOkZpbGUgPSB7XHJcbiAgICAgICAgbmFtZTogXCJUZXN0LmphdmFcIixcclxuICAgICAgICB0ZXh0OiBcclxuYFRlc3QgdCA9IG5ldyBUZXN0KCk7XHJcbnQuYSA9IDEyO1xyXG50LnByaW50MSgpO1xyXG5cclxuY2xhc3MgVGVzdCB7XHJcbiAgICBpbnQgYTtcclxuICAgIGludFtdIGIgPSBuZXcgaW50WzhdO1xyXG4gICAgXHJcbiAgICB2b2lkIHByaW50MSgpe1xyXG4gICAgICAgIHByaW50KGEpO1xyXG4gICAgfVxyXG59XHJcbmAsXHJcbiAgICAgICAgZGlydHk6IHRydWUsXHJcbiAgICAgICAgc2F2ZWQ6IHRydWUsXHJcbiAgICAgICAgdmVyc2lvbjogMVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgZmlsZTM6RmlsZSA9IHtcclxuICAgICAgICBuYW1lOiBcIlRlc3QuamF2YVwiLFxyXG4gICAgICAgIHRleHQ6IFxyXG5gcHJpbnRsbihcIlRlc3RcIi50b1VwcGVyQ2FzZSgpKTtcclxucHJpbnRsbihcIlRlc3RcIi50b0xvd2VyQ2FzZSgpKTtcclxucHJpbnRsbihcIlRlc3RcIi5sZW5ndGgoKSk7XHJcbnByaW50bG4oXCJUZXN0XCIuc3Vic3RyaW5nKDIsIDQpKTtcclxucHJpbnRsbihcIlRlc3RcIi5zdWJzdHJpbmcoMikpO1xyXG5wcmludGxuKFwiVGVzdFwiLmVxdWFsc0lnbm9yZUNhc2UoXCJ0ZXN0XCIpKTtcclxucHJpbnRsbihcIlRlc3RcIi5lcXVhbHNJZ25vcmVDYXNlKFwidGVzdDFcIikpO1xyXG5wcmludGxuKFwiVGVzdFwiLmVxdWFscyhcInRlc3RcIikpO1xyXG5wcmludGxuKFwiVGVzdFwiLmVxdWFscyhcIlRlc3RcIikpO1xyXG5wcmludGxuKFwiVGVzdFwiLmVuZHNXaXRoKFwic3RcIikpO1xyXG5wcmludGxuKFwiVGVzdFwiLmVuZHNXaXRoKFwiZXdcIikpO1xyXG5wcmludGxuKFwiICAgVGVzdCAgIFwiLnRyaW0oKSk7XHJcbnByaW50bG4oXCJBcHBsZXMgYXJlIGp1aWN5IGFuZCBBcHBsZXMgYXJlIHJlZC5cIi5yZXBsYWNlQWxsKFwiQXBwbGVzXCIsIFwiT3Jhbmdlc1wiKSk7XHJcblxyXG5TdHJpbmdbXSB0ZWlsZSA9IFwiQXBwbGVzIGFyZSBqdWljeSBhbmQgQXBwbGVzIGFyZSByZWRcIi5zcGxpdChcImVcIik7XHJcbmZvcihpbnQgaSA9IDA7IGkgPCB0ZWlsZS5sZW5ndGg7IGkrKyl7XHJcbiAgICBwcmludGxuKHRlaWxlW2ldKTtcclxufVxyXG5cclxucHJpbnRsbih0ZWlsZS5sZW5ndGgpXHJcbmAsXHJcbiAgICAgICAgZGlydHk6IHRydWUsXHJcbiAgICAgICAgc2F2ZWQ6IHRydWUsXHJcbiAgICAgICAgdmVyc2lvbjogMVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgZmlsZTQ6RmlsZSA9IHtcclxuICAgICAgICBuYW1lOiBcIlRlc3QuamF2YVwiLFxyXG4gICAgICAgIHRleHQ6IFxyXG5gaW50IGkgPSAwO1xyXG5cclxud2hpbGUodHJ1ZSl7XHJcbiAgICBpKys7XHJcblxyXG4gICAgaWYoaSAlIDEwMCA9PSAwKXtcclxuICAgICAgICBwcmludChpKTtcclxuICAgIH1cclxuXHJcbiAgICBpZihpICUgMTAwMCA9PSAwKXtcclxuICAgICAgICBwcmludGxuKFwiXCIpO1xyXG4gICAgfVxyXG5cclxufWAsXHJcbiAgICAgICAgZGlydHk6IHRydWUsIFxyXG4gICAgICAgIHNhdmVkOiB0cnVlLFxyXG4gICAgICAgIHZlcnNpb246IDFcclxuICAgIH07XHJcblxyXG4gICAgd3MubW9kdWxlU3RvcmUucHV0TW9kdWxlKG5ldyBNb2R1bGUoZmlsZTEsIG1haW4pKTtcclxuICAgIC8vIHdzLm1vZHVsZVN0b3JlLnB1dE1vZHVsZShuZXcgTW9kdWxlKGZpbGUyLCBtYWluKSk7XHJcbiAgICAvLyB3cy5tb2R1bGVTdG9yZS5wdXRNb2R1bGUobmV3IE1vZHVsZShmaWxlMywgbWFpbikpO1xyXG4gICAgLy8gd3MubW9kdWxlU3RvcmUucHV0TW9kdWxlKG5ldyBNb2R1bGUoZmlsZTQsIG1haW4pKTtcclxuXHJcbiAgICByZXR1cm4gd3M7XHJcbn1cclxuXHJcbiJdfQ==