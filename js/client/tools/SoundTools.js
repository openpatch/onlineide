export class SoundTools {
    static init() {
        for (let sound of SoundTools.sounds) {
            //@ts-ignore
            sound.player = new Howl({ src: [sound.url], preload: true });
            SoundTools.soundMap.set(sound.name, sound);
        }
    }
    static play(name) {
        let st = SoundTools.soundMap.get(name);
        if (st != null) {
            st.player.play();
        }
    }
}
SoundTools.sounds = [
    {
        url: "assets/mp3/nearby_explosion_with_debris.mp3",
        name: "nearby_explosion_with_debris",
        description: "nahe Explosion mit herabfallenden Trümmern"
    },
    {
        url: "assets/mp3/nearby_explosion.mp3",
        name: "nearby_explosion",
        description: "nahe Explosion"
    },
    {
        url: "assets/mp3/far_bomb.mp3",
        name: "far_bomb",
        description: "fernes Geräusch einer Bombe"
    },
    {
        url: "assets/mp3/cannon_boom.mp3",
        name: "cannon_boom",
        description: "einzelner Kanonendonner"
    },
    {
        url: "assets/mp3/far_explosion.mp3",
        name: "far_explosion",
        description: "ferne Explosion"
    },
    {
        url: "assets/mp3/laser_shoot.mp3",
        name: "laser_shoot",
        description: "Laserschuss (oder was man dafür hält...)"
    },
    {
        url: "assets/mp3/short_bell.mp3",
        name: "short_bell",
        description: "kurzes Klingeln (wie bei alter Landenkasse)"
    },
    {
        url: "assets/mp3/flamethrower.mp3",
        name: "flamethrower",
        description: "Flammenwerfer"
    },
    {
        url: "assets/mp3/digging.mp3",
        name: "digging",
        description: "Geräusch beim Sandschaufeln"
    },
    {
        url: "assets/mp3/short_digging.mp3",
        name: "short_digging",
        description: "kurzes Geräusch beim Sandschaufeln"
    },
    {
        url: "assets/mp3/shoot.mp3",
        name: "shoot",
        description: "Schussgeräusch"
    },
    {
        url: "assets/mp3/short_shoot.mp3",
        name: "short_shoot",
        description: "ein kurzer Schuss"
    },
    {
        url: "assets/mp3/step.mp3",
        name: "step",
        description: "ein Schritt"
    },
    {
        url: "assets/mp3/boulder.mp3",
        name: "boulder",
        description: "Geräusch eines Steins, der auf einen zweiten fällt"
    },
    {
        url: "assets/mp3/pong_d5.wav",
        name: "pong_d",
        description: "Tiefer Pong-Ton"
    },
    {
        url: "assets/mp3/pong_f5.wav",
        name: "pong_f",
        description: "Hoher Pong-Ton"
    },
];
SoundTools.soundMap = new Map();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU291bmRUb29scy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NyYy9jbGllbnQvdG9vbHMvU291bmRUb29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFRQSxNQUFNLE9BQU8sVUFBVTtJQXVGWixNQUFNLENBQUMsSUFBSTtRQUVkLEtBQUksSUFBSSxLQUFLLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBQztZQUMvQixZQUFZO1lBQ1osS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxFQUFDLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQTtZQUMxRCxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzlDO0lBRUwsQ0FBQztJQUVNLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBWTtRQUMzQixJQUFJLEVBQUUsR0FBYyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsRCxJQUFHLEVBQUUsSUFBSSxJQUFJLEVBQUM7WUFDVixFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDO1NBQ3BCO0lBQ0wsQ0FBQzs7QUFwR00saUJBQU0sR0FBZ0I7SUFDekI7UUFDSSxHQUFHLEVBQUUsNkNBQTZDO1FBQ2xELElBQUksRUFBRSw4QkFBOEI7UUFDcEMsV0FBVyxFQUFFLDRDQUE0QztLQUM1RDtJQUNEO1FBQ0ksR0FBRyxFQUFFLGlDQUFpQztRQUN0QyxJQUFJLEVBQUUsa0JBQWtCO1FBQ3hCLFdBQVcsRUFBRSxnQkFBZ0I7S0FDaEM7SUFDRDtRQUNJLEdBQUcsRUFBRSx5QkFBeUI7UUFDOUIsSUFBSSxFQUFFLFVBQVU7UUFDaEIsV0FBVyxFQUFFLDZCQUE2QjtLQUM3QztJQUNEO1FBQ0ksR0FBRyxFQUFFLDRCQUE0QjtRQUNqQyxJQUFJLEVBQUUsYUFBYTtRQUNuQixXQUFXLEVBQUUseUJBQXlCO0tBQ3pDO0lBQ0Q7UUFDSSxHQUFHLEVBQUUsOEJBQThCO1FBQ25DLElBQUksRUFBRSxlQUFlO1FBQ3JCLFdBQVcsRUFBRSxpQkFBaUI7S0FDakM7SUFDRDtRQUNJLEdBQUcsRUFBRSw0QkFBNEI7UUFDakMsSUFBSSxFQUFFLGFBQWE7UUFDbkIsV0FBVyxFQUFFLDBDQUEwQztLQUMxRDtJQUNEO1FBQ0ksR0FBRyxFQUFFLDJCQUEyQjtRQUNoQyxJQUFJLEVBQUUsWUFBWTtRQUNsQixXQUFXLEVBQUUsNkNBQTZDO0tBQzdEO0lBQ0Q7UUFDSSxHQUFHLEVBQUUsNkJBQTZCO1FBQ2xDLElBQUksRUFBRSxjQUFjO1FBQ3BCLFdBQVcsRUFBRSxlQUFlO0tBQy9CO0lBQ0Q7UUFDSSxHQUFHLEVBQUUsd0JBQXdCO1FBQzdCLElBQUksRUFBRSxTQUFTO1FBQ2YsV0FBVyxFQUFFLDZCQUE2QjtLQUM3QztJQUNEO1FBQ0ksR0FBRyxFQUFFLDhCQUE4QjtRQUNuQyxJQUFJLEVBQUUsZUFBZTtRQUNyQixXQUFXLEVBQUUsb0NBQW9DO0tBQ3BEO0lBQ0Q7UUFDSSxHQUFHLEVBQUUsc0JBQXNCO1FBQzNCLElBQUksRUFBRSxPQUFPO1FBQ2IsV0FBVyxFQUFFLGdCQUFnQjtLQUNoQztJQUNEO1FBQ0ksR0FBRyxFQUFFLDRCQUE0QjtRQUNqQyxJQUFJLEVBQUUsYUFBYTtRQUNuQixXQUFXLEVBQUUsbUJBQW1CO0tBQ25DO0lBQ0Q7UUFDSSxHQUFHLEVBQUUscUJBQXFCO1FBQzFCLElBQUksRUFBRSxNQUFNO1FBQ1osV0FBVyxFQUFFLGFBQWE7S0FDN0I7SUFDRDtRQUNJLEdBQUcsRUFBRSx3QkFBd0I7UUFDN0IsSUFBSSxFQUFFLFNBQVM7UUFDZixXQUFXLEVBQUUsb0RBQW9EO0tBQ3BFO0lBQ0Q7UUFDSSxHQUFHLEVBQUUsd0JBQXdCO1FBQzdCLElBQUksRUFBRSxRQUFRO1FBQ2QsV0FBVyxFQUFFLGlCQUFpQjtLQUNqQztJQUNEO1FBQ0ksR0FBRyxFQUFFLHdCQUF3QjtRQUM3QixJQUFJLEVBQUUsUUFBUTtRQUNkLFdBQVcsRUFBRSxnQkFBZ0I7S0FDaEM7Q0FDSixDQUFBO0FBRU0sbUJBQVEsR0FBMkIsSUFBSSxHQUFHLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCB0eXBlIFNvdW5kVHlwZSA9IHtcclxuICAgIHVybDogc3RyaW5nLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgLy9AdHMtaWdub3JlXHJcbiAgICBwbGF5ZXI/OiBIb3dsLFxyXG4gICAgZGVzY3JpcHRpb246IHN0cmluZ1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgU291bmRUb29scyB7XHJcblxyXG4gICAgc3RhdGljIHNvdW5kczogU291bmRUeXBlW10gPSBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IFwiYXNzZXRzL21wMy9uZWFyYnlfZXhwbG9zaW9uX3dpdGhfZGVicmlzLm1wM1wiLFxyXG4gICAgICAgICAgICBuYW1lOiBcIm5lYXJieV9leHBsb3Npb25fd2l0aF9kZWJyaXNcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwibmFoZSBFeHBsb3Npb24gbWl0IGhlcmFiZmFsbGVuZGVuIFRyw7xtbWVyblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL25lYXJieV9leHBsb3Npb24ubXAzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwibmVhcmJ5X2V4cGxvc2lvblwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJuYWhlIEV4cGxvc2lvblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL2Zhcl9ib21iLm1wM1wiLFxyXG4gICAgICAgICAgICBuYW1lOiBcImZhcl9ib21iXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImZlcm5lcyBHZXLDpHVzY2ggZWluZXIgQm9tYmVcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IFwiYXNzZXRzL21wMy9jYW5ub25fYm9vbS5tcDNcIixcclxuICAgICAgICAgICAgbmFtZTogXCJjYW5ub25fYm9vbVwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJlaW56ZWxuZXIgS2Fub25lbmRvbm5lclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL2Zhcl9leHBsb3Npb24ubXAzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiZmFyX2V4cGxvc2lvblwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJmZXJuZSBFeHBsb3Npb25cIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IFwiYXNzZXRzL21wMy9sYXNlcl9zaG9vdC5tcDNcIixcclxuICAgICAgICAgICAgbmFtZTogXCJsYXNlcl9zaG9vdFwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJMYXNlcnNjaHVzcyAob2RlciB3YXMgbWFuIGRhZsO8ciBow6RsdC4uLilcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IFwiYXNzZXRzL21wMy9zaG9ydF9iZWxsLm1wM1wiLFxyXG4gICAgICAgICAgICBuYW1lOiBcInNob3J0X2JlbGxcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwia3VyemVzIEtsaW5nZWxuICh3aWUgYmVpIGFsdGVyIExhbmRlbmthc3NlKVwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL2ZsYW1ldGhyb3dlci5tcDNcIixcclxuICAgICAgICAgICAgbmFtZTogXCJmbGFtZXRocm93ZXJcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiRmxhbW1lbndlcmZlclwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL2RpZ2dpbmcubXAzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwiZGlnZ2luZ1wiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJHZXLDpHVzY2ggYmVpbSBTYW5kc2NoYXVmZWxuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdXJsOiBcImFzc2V0cy9tcDMvc2hvcnRfZGlnZ2luZy5tcDNcIixcclxuICAgICAgICAgICAgbmFtZTogXCJzaG9ydF9kaWdnaW5nXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcImt1cnplcyBHZXLDpHVzY2ggYmVpbSBTYW5kc2NoYXVmZWxuXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdXJsOiBcImFzc2V0cy9tcDMvc2hvb3QubXAzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwic2hvb3RcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiU2NodXNzZ2Vyw6R1c2NoXCJcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgdXJsOiBcImFzc2V0cy9tcDMvc2hvcnRfc2hvb3QubXAzXCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwic2hvcnRfc2hvb3RcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiZWluIGt1cnplciBTY2h1c3NcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IFwiYXNzZXRzL21wMy9zdGVwLm1wM1wiLFxyXG4gICAgICAgICAgICBuYW1lOiBcInN0ZXBcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiZWluIFNjaHJpdHRcIlxyXG4gICAgICAgIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICB1cmw6IFwiYXNzZXRzL21wMy9ib3VsZGVyLm1wM1wiLFxyXG4gICAgICAgICAgICBuYW1lOiBcImJvdWxkZXJcIixcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiR2Vyw6R1c2NoIGVpbmVzIFN0ZWlucywgZGVyIGF1ZiBlaW5lbiB6d2VpdGVuIGbDpGxsdFwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL3BvbmdfZDUud2F2XCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwicG9uZ19kXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIlRpZWZlciBQb25nLVRvblwiXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHVybDogXCJhc3NldHMvbXAzL3BvbmdfZjUud2F2XCIsXHJcbiAgICAgICAgICAgIG5hbWU6IFwicG9uZ19mXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkhvaGVyIFBvbmctVG9uXCJcclxuICAgICAgICB9LFxyXG4gICAgXVxyXG5cclxuICAgIHN0YXRpYyBzb3VuZE1hcDogTWFwPHN0cmluZywgU291bmRUeXBlPiA9IG5ldyBNYXAoKTtcclxuXHJcbiAgICBwdWJsaWMgc3RhdGljIGluaXQoKXtcclxuXHJcbiAgICAgICAgZm9yKGxldCBzb3VuZCBvZiBTb3VuZFRvb2xzLnNvdW5kcyl7XHJcbiAgICAgICAgICAgIC8vQHRzLWlnbm9yZVxyXG4gICAgICAgICAgICBzb3VuZC5wbGF5ZXIgPSBuZXcgSG93bCh7c3JjOiBbc291bmQudXJsXSwgcHJlbG9hZDogdHJ1ZX0pXHJcbiAgICAgICAgICAgIFNvdW5kVG9vbHMuc291bmRNYXAuc2V0KHNvdW5kLm5hbWUsIHNvdW5kKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzdGF0aWMgcGxheShuYW1lOiBzdHJpbmcpe1xyXG4gICAgICAgIGxldCBzdDogU291bmRUeXBlID0gU291bmRUb29scy5zb3VuZE1hcC5nZXQobmFtZSk7XHJcbiAgICAgICAgaWYoc3QgIT0gbnVsbCl7XHJcbiAgICAgICAgICAgIHN0LnBsYXllci5wbGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxufSJdfQ==