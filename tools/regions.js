// Approximate assignment of a glacier polygon (centroid lon x, lat y, area km2) to an RGI first-order region.
// 0 = Greenland / Antarctic ice sheet (not part of the glacier regions).
exports.rgi = function (x, y, a) {
  if (y < -60) return a > 20000 ? 0 : 19;
  if (y < -45.5 && !(x > -80 && x < -60) && !(x > 160 && y > -48)) return 19;
  if ((x > 160 || x < -170) && y < -30 && y > -50) return 18;
  if (x > -82 && x < -60 && y < -25) return 17;
  if (y > -25 && y < 25 && !(x > 60 && x < 110 && y > 20)) return 16;
  // North America
  if (x < -100 && y > 30 && y < 72) {
    if (x < -136.5) return 1;
    if (y > 55.6 && y < 60.2 && x < -129.6) return 1;
    return 2;
  }
  if (x > -130 && x < -10 && y > 57) {
    // Iceland
    if (x > -25.5 && y < 67.2) return 6;
    var green = y >= 78.3 ? x > -75 + (y - 78.3) * 3.75 : (y >= 74 ? x > -74.5 : x > -59);
    if (green) return a > 100000 ? 0 : 5;
    return y >= 74 ? 3 : 4;
  }
  if (x > -12 && x < 36 && y > 70) return 7;
  if (x > 3 && x < 36 && y > 57) return 8;
  if ((x >= 35 && x < 70 && y > 70) || (x >= 70 && x < 115 && y > 77)) return 9;
  if (x > -11 && x < 27 && y > 40 && y < 49) return 11;
  if (x > 30 && x < 57 && y > 29 && y < 46) return 12;
  if (x > 57 && y > 46) return 10;
  if (x > 125 && y > 30) return 10;
  if (x > 60 && x < 110 && y > 25) {
    if (x < 80.5) {
      var top = x < 74 ? 37.3 : 36.0;
      return y < top ? 14 : 13;
    }
    var pts = [[80.5,30.8],[84,29.6],[88,28.8],[92,28.9],[94.5,29.4],[97.5,29.7],[97.5,33],[110,33]];
    var f = 33;
    for (var i = 0; i < pts.length - 1; i++) {
      if (x >= pts[i][0] && x <= pts[i+1][0]) {
        var t = (pts[i+1][0] === pts[i][0]) ? 0 : (x - pts[i][0]) / (pts[i+1][0] - pts[i][0]);
        f = pts[i][1] + t * (pts[i+1][1] - pts[i][1]);
      }
    }
    return y < f ? 15 : 13;
  }
  return -1;
};
