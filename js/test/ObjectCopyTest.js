jQuery(() => {
    let t = new Test();
    t.list.push(new E(10));
    t.w = "Eins";
    console.log(t);
    let t1 = Object.create(t);
    console.log(t1);
    console.log(t1.w);
    t1.w = "Zwei";
    console.log(t1.w);
    console.log(t1.printW());
});
class Test {
    constructor() {
        this.list = [];
    }
    toString() {
        return this.list.toString();
    }
    printW() {
        return this.w;
    }
}
class E {
    constructor(a) {
        this.a = a;
    }
    toString() {
        return "" + this.a;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT2JqZWN0Q29weVRlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY2xpZW50L3Rlc3QvT2JqZWN0Q29weVRlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQ0EsTUFBTSxDQUFDLEdBQUcsRUFBRTtJQUNSLElBQUksQ0FBQyxHQUFTLElBQUksSUFBSSxFQUFFLENBQUM7SUFDekIsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUN2QixDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztJQUNiLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFZixJQUFJLEVBQUUsR0FBUyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDaEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEIsRUFBRSxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDZCxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNsQixPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0FBQzdCLENBQUMsQ0FBQyxDQUFDO0FBSUgsTUFBTSxJQUFJO0lBS047UUFIQSxTQUFJLEdBQVEsRUFBRSxDQUFDO0lBS2YsQ0FBQztJQUVELFFBQVE7UUFDSixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDaEMsQ0FBQztJQUVELE1BQU07UUFDRixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEIsQ0FBQztDQUVKO0FBRUQsTUFBTSxDQUFDO0lBQ0gsWUFBbUIsQ0FBUztRQUFULE1BQUMsR0FBRCxDQUFDLENBQVE7SUFFNUIsQ0FBQztJQUVELFFBQVE7UUFDSixPQUFPLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQ3ZCLENBQUM7Q0FDSiIsInNvdXJjZXNDb250ZW50IjpbIlxyXG5qUXVlcnkoKCkgPT4ge1xyXG4gICAgbGV0IHQ6IFRlc3QgPSBuZXcgVGVzdCgpO1xyXG4gICAgdC5saXN0LnB1c2gobmV3IEUoMTApKTtcclxuICAgIHQudyA9IFwiRWluc1wiO1xyXG4gICAgY29uc29sZS5sb2codCk7XHJcblxyXG4gICAgbGV0IHQxOiBUZXN0ID0gT2JqZWN0LmNyZWF0ZSh0KTtcclxuICAgIGNvbnNvbGUubG9nKHQxKTtcclxuICAgIGNvbnNvbGUubG9nKHQxLncpO1xyXG4gICAgdDEudyA9IFwiWndlaVwiO1xyXG4gICAgY29uc29sZS5sb2codDEudyk7XHJcbiAgICBjb25zb2xlLmxvZyh0MS5wcmludFcoKSk7XHJcbn0pO1xyXG5cclxuXHJcblxyXG5jbGFzcyBUZXN0IHtcclxuXHJcbiAgICBsaXN0OiBFW10gPSBbXTtcclxuICAgIHc6IHN0cmluZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcigpe1xyXG5cclxuICAgIH1cclxuXHJcbiAgICB0b1N0cmluZygpOiBzdHJpbmcge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmxpc3QudG9TdHJpbmcoKTtcclxuICAgIH1cclxuXHJcbiAgICBwcmludFcoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gdGhpcy53O1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuY2xhc3MgRSB7XHJcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgYTogbnVtYmVyKXtcclxuXHJcbiAgICB9XHJcblxyXG4gICAgdG9TdHJpbmcoKTogc3RyaW5nIHtcclxuICAgICAgICByZXR1cm4gXCJcIiArIHRoaXMuYTtcclxuICAgIH1cclxufSJdfQ==