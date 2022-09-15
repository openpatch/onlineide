/*
 * Convex hull algorithm - Library (TypeScript)
 *
 * Copyright (c) 2020 Project Nayuki
 * https://www.nayuki.io/page/convex-hull-algorithm
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program (see COPYING.txt and COPYING.LESSER.txt).
 * If not, see <http://www.gnu.org/licenses/>.
 */
export var convexhull;
(function (convexhull) {
    // Returns a new array of points representing the convex hull of
    // the given set of points. The convex hull excludes collinear points.
    // This algorithm runs in O(n log n) time.
    function makeHull(points) {
        let newPoints = points.slice();
        newPoints.sort(convexhull.POINT_COMPARATOR);
        return convexhull.makeHullPresorted(newPoints);
    }
    convexhull.makeHull = makeHull;
    // Returns the convex hull, assuming that each points[i] <= points[i + 1]. Runs in O(n) time.
    function makeHullPresorted(points) {
        if (points.length <= 1)
            return points.slice();
        // Andrew's monotone chain algorithm. Positive y coordinates correspond to "up"
        // as per the mathematical convention, instead of "down" as per the computer
        // graphics convention. This doesn't affect the correctness of the result.
        let upperHull = [];
        for (let i = 0; i < points.length; i++) {
            const p = points[i];
            while (upperHull.length >= 2) {
                const q = upperHull[upperHull.length - 1];
                const r = upperHull[upperHull.length - 2];
                if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x))
                    upperHull.pop();
                else
                    break;
            }
            upperHull.push(p);
        }
        upperHull.pop();
        let lowerHull = [];
        for (let i = points.length - 1; i >= 0; i--) {
            const p = points[i];
            while (lowerHull.length >= 2) {
                const q = lowerHull[lowerHull.length - 1];
                const r = lowerHull[lowerHull.length - 2];
                if ((q.x - r.x) * (p.y - r.y) >= (q.y - r.y) * (p.x - r.x))
                    lowerHull.pop();
                else
                    break;
            }
            lowerHull.push(p);
        }
        lowerHull.pop();
        if (upperHull.length == 1 && lowerHull.length == 1 && upperHull[0].x == lowerHull[0].x && upperHull[0].y == lowerHull[0].y)
            return upperHull;
        else
            return upperHull.concat(lowerHull);
    }
    convexhull.makeHullPresorted = makeHullPresorted;
    function POINT_COMPARATOR(a, b) {
        if (a.x < b.x)
            return -1;
        else if (a.x > b.x)
            return +1;
        else if (a.y < b.y)
            return -1;
        else if (a.y > b.y)
            return +1;
        else
            return 0;
    }
    convexhull.POINT_COMPARATOR = POINT_COMPARATOR;
})(convexhull || (convexhull = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29udmV4SHVsbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvdG9vbHMvQ29udmV4SHVsbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1CRztBQUtILE1BQU0sS0FBVyxVQUFVLENBMkUxQjtBQTNFRCxXQUFpQixVQUFVO0lBTTFCLGdFQUFnRTtJQUNoRSxzRUFBc0U7SUFDdEUsMENBQTBDO0lBQzFDLFNBQWdCLFFBQVEsQ0FBa0IsTUFBZ0I7UUFDekQsSUFBSSxTQUFTLEdBQWEsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ3pDLFNBQVMsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFDNUMsT0FBTyxVQUFVLENBQUMsaUJBQWlCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEQsQ0FBQztJQUplLG1CQUFRLFdBSXZCLENBQUE7SUFHRCw2RkFBNkY7SUFDN0YsU0FBZ0IsaUJBQWlCLENBQWtCLE1BQWdCO1FBQ2xFLElBQUksTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDO1lBQ3JCLE9BQU8sTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBRXZCLCtFQUErRTtRQUMvRSw0RUFBNEU7UUFDNUUsMEVBQTBFO1FBRTFFLElBQUksU0FBUyxHQUFhLEVBQUUsQ0FBQztRQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN2QyxNQUFNLENBQUMsR0FBTSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkIsT0FBTyxTQUFTLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRTtnQkFDN0IsTUFBTSxDQUFDLEdBQU0sU0FBUyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdDLE1BQU0sQ0FBQyxHQUFNLFNBQVMsQ0FB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IENvbnZleCBodWxsIGFsZ29yaXRobSAtIExpYnJhcnkgKFR5cGVTY3JpcHQpXG4gKiBcbiAqIENvcHlyaWdodCAoYykgMjAyMCBQcm9qZWN0IE5heXVraVxuICogaHR0cHM6Ly93d3cubmF5dWtpLmlvL3BhZ2UvY29udmV4LWh1bGwtYWxnb3JpdGhtXG4gKiBcbiAqIFRoaXMgcHJvZ3JhbSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG4gKiBpdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBMZXNzZXIgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbiAqIHRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4gKiAoYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuICogXG4gKiBUaGlzIHByb2dyYW0gaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbiAqIGJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG4gKiBNRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG4gKiBHTlUgTGVzc2VyIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cbiAqIFxuICogWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIExlc3NlciBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG4gKiBhbG9uZyB3aXRoIHRoaXMgcHJvZ3JhbSAoc2VlIENPUFlJTkcudHh0IGFuZCBDT1BZSU5HLkxFU1NFUi50eHQpLlxuICogSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuICovXG5cblxuXG5cbmV4cG9ydCBuYW1lc3BhY2UgY29udmV4aHVsbCB7XG4gICAgXG4gICAgZXhwb3J0IGludGVyZmFjZSBQb2ludCB7XG4gICAgICAgIHg6IG51bWJlcjtcbiAgICAgICAgeTogbnVtYmVyO1xuICAgIH1cblx0Ly8gUmV0dXJucyBhIG5ldyBhcnJheSBvZiBwb2ludHMgcmVwcmVzZW50aW5nIHRoZSBjb252ZXggaHVsbCBvZlxuXHQvLyB0aGUgZ2l2ZW4gc2V0IG9mIHBvaW50cy4gVGhlIGNvbnZleCBodWxsIGV4Y2x1ZGVzIGNvbGxpbmVhciBwb2ludHMuXG5cdC8vIFRoaXMgYWxnb3JpdGhtIHJ1bnMgaW4gTyhuIGxvZyBuKSB0aW1lLlxuXHRleHBvcnQgZnVuY3Rpb24gbWFrZUh1bGw8UCBleHRlbmRzIFBvaW50Pihwb2ludHM6IEFycmF5PFA+KTogQXJyYXk8UD4ge1xuXHRcdGxldCBuZXdQb2ludHM6IEFycmF5PFA+ID0gcG9pbnRzLnNsaWNlKCk7XG5cdFx0bmV3UG9pbnRzLnNvcnQoY29udmV4aHVsbC5QT0lOVF9DT01QQVJBVE9SKTtcblx0XHRyZXR1cm4gY29udmV4aHVsbC5tYWtlSHVsbFByZXNvcnRlZChuZXdQb2ludHMpO1xuXHR9XG5cdFxuXHRcblx0Ly8gUmV0dXJucyB0aGUgY29udmV4IGh1bGwsIGFzc3VtaW5nIHRoYXQgZWFjaCBwb2ludHNbaV0gPD0gcG9pbnRzW2kgKyAxXS4gUnVucyBpbiBPKG4pIHRpbWUuXG5cdGV4cG9ydCBmdW5jdGlvbiBtYWtlSHVsbFByZXNvcnRlZDxQIGV4dGVuZHMgUG9pbnQ+KHBvaW50czogQXJyYXk8UD4pOiBBcnJheTxQPiB7XG5cdFx0aWYgKHBvaW50cy5sZW5ndGggPD0gMSlcblx0XHRcdHJldHVybiBwb2ludHMuc2xpY2UoKTtcblx0XHRcblx0XHQvLyBBbmRyZXcncyBtb25vdG9uZSBjaGFpbiBhbGdvcml0aG0uIFBvc2l0aXZlIHkgY29vcmRpbmF0ZXMgY29ycmVzcG9uZCB0byBcInVwXCJcblx0XHQvLyBhcyBwZXIgdGhlIG1hdGhlbWF0aWNhbCBjb252ZW50aW9uLCBpbnN0ZWFkIG9mIFwiZG93blwiIGFzIHBlciB0aGUgY29tcHV0ZXJcblx0XHQvLyBncmFwaGljcyBjb252ZW50aW9uLiBUaGlzIGRvZXNuJ3QgYWZmZWN0IHRoZSBjb3JyZWN0bmVzcyBvZiB0aGUgcmVzdWx0LlxuXHRcdFxuXHRcdGxldCB1cHBlckh1bGw6IEFycmF5PFA+ID0gW107XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBwb2ludHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdGNvbnN0IHA6IFAgPSBwb2ludHNbaV07XG5cdFx0XHR3aGlsZSAodXBwZXJIdWxsLmxlbmd0aCA+PSAyKSB7XG5cdFx0XHRcdGNvbnN0IHE6IFAgPSB1cHBlckh1bGxbdXBwZXJIdWxsLmxlbmd0aCAtIDFdO1xuXHRcdFx0XHRjb25zdCByOiBQID0gdXBwZXJIdWxsW3VwcGVySHVsbC5sZW5ndGggLSAyXTtcblx0XHRcdFx0aWYgKChxLnggLSByLngpICogKHAueSAtIHIueSkgPj0gKHEueSAtIHIueSkgKiAocC54IC0gci54KSlcblx0XHRcdFx0XHR1cHBlckh1bGwucG9wKCk7XG5cdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdH1cblx0XHRcdHVwcGVySHVsbC5wdXNoKHApO1xuXHRcdH1cblx0XHR1cHBlckh1bGwucG9wKCk7XG5cdFx0XG5cdFx0bGV0IGxvd2VySHVsbDogQXJyYXk8UD4gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gcG9pbnRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG5cdFx0XHRjb25zdCBwOiBQID0gcG9pbnRzW2ldO1xuXHRcdFx0d2hpbGUgKGxvd2VySHVsbC5sZW5ndGggPj0gMikge1xuXHRcdFx0XHRjb25zdCBxOiBQID0gbG93ZXJIdWxsW2xvd2VySHVsbC5sZW5ndGggLSAxXTtcblx0XHRcdFx0Y29uc3QgcjogUCA9IGxvd2VySHVsbFtsb3dlckh1bGwubGVuZ3RoIC0gMl07XG5cdFx0XHRcdGlmICgocS54IC0gci54KSAqIChwLnkgLSByLnkpID49IChxLnkgLSByLnkpICogKHAueCAtIHIueCkpXG5cdFx0XHRcdFx0bG93ZXJIdWxsLnBvcCgpO1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHR9XG5cdFx0XHRsb3dlckh1bGwucHVzaChwKTtcblx0XHR9XG5cdFx0bG93ZXJIdWxsLnBvcCgpO1xuXHRcdFxuXHRcdGlmICh1cHBlckh1bGwubGVuZ3RoID09IDEgJiYgbG93ZXJIdWxsLmxlbmd0aCA9PSAxICYmIHVwcGVySHVsbFswXS54ID09IGxvd2VySHVsbFswXS54ICYmIHVwcGVySHVsbFswXS55ID09IGxvd2VySHVsbFswXS55KVxuXHRcdFx0cmV0dXJuIHVwcGVySHVsbDtcblx0XHRlbHNlXG5cdFx0XHRyZXR1cm4gdXBwZXJIdWxsLmNvbmNhdChsb3dlckh1bGwpO1xuXHR9XG5cdFxuXHRcblx0ZXhwb3J0IGZ1bmN0aW9uIFBPSU5UX0NPTVBBUkFUT1IoYTogUG9pbnQsIGI6IFBvaW50KTogbnVtYmVyIHtcblx0XHRpZiAoYS54IDwgYi54KVxuXHRcdFx0cmV0dXJuIC0xO1xuXHRcdGVsc2UgaWYgKGEueCA+IGIueClcblx0XHRcdHJldHVybiArMTtcblx0XHRlbHNlIGlmIChhLnkgPCBiLnkpXG5cdFx0XHRyZXR1cm4gLTE7XG5cdFx0ZWxzZSBpZiAoYS55ID4gYi55KVxuXHRcdFx0cmV0dXJuICsxO1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiAwO1xuXHR9XG5cdFxufSJdfQ==