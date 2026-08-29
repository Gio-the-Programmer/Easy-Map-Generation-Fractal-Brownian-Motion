// function renderRivers(elevation, hasmountains) {
//   var canvas = document.getElementById("mapCanvas");
//   var ctx = canvas.getContext("2d");
//   var W = canvas.width;
//   var H = canvas.height;
//   var cx = Math.floor(W / 2);
//   var cy = Math.floor(H / 2);

//   // --- Build full-res heightmap (must match renderIsland exactly) ---
//   var h = new Float32Array(W * H);
//   for (var y = 0; y < H; y++) {
//     for (var x = 0; x < W; x++) {
//       var idx = y * W + x;
//       var e_raw = parseFloat(elevation[idx]);

//       var dx = x - cx,
//         dy = y - cy;
//       var dist = Math.sqrt(dx * dx + dy * dy);
//       var maxR = W * 1.1;

//       var mask = Math.max(0, 1 - dist / maxR);
//       mask = Math.pow(mask, 1.2);
//       e_raw *= mask;

//       if (hasmountains) {
//         var boost = Math.max(0, 1 - dist / (W * 0.09)) * 0.45;
//         e_raw += boost;
//         if (e_raw > 1.0) e_raw = 1.0;
//       }

//       var em = W * 0.06;
//       var ef = 1.0;
//       if (x < em) ef = x / em;
//       if (x > W - em) ef = Math.min(ef, (W - x) / em);
//       if (y < em) ef = Math.min(ef, y / em);
//       if (y > H - em) ef = Math.min(ef, (H - y) / em);
//       e_raw *= ef;

//       var e = e_raw;
//       if (e < 0.35) e *= 0.3;
//       else if (e < 0.42) e = 0.35 + (e - 0.35) * 0.5;
//       else e = 0.4 + (e - 0.42) * 1.6;

//       if (!hasmountains && e > 0.7) e = 0.7;

//       h[idx] = e;
//     }
//   }

//   function getH(x, y) {
//     x = Math.floor(x);
//     y = Math.floor(y);
//     if (x < 0 || x >= W || y < 0 || y >= H) return -1;
//     return h[y * W + x];
//   }

//   function isLand(x, y) {
//     return getH(x, y) >= 0.38;
//   }
//   function isWater(x, y) {
//     return getH(x, y) < 0.38;
//   }

//   // ============================================================
//   // 1. FIND REAL COASTLINE (land pixels that touch water)
//   // ============================================================
//   var coastBySide = { north: [], south: [], east: [], west: [] };

//   for (var y = 1; y < H - 1; y++) {
//     for (var x = 1; x < W - 1; x++) {
//       if (!isLand(x, y)) continue;

//       // Must touch water on at least one cardinal neighbor
//       var touchesWater =
//         isWater(x + 1, y) ||
//         isWater(x - 1, y) ||
//         isWater(x, y + 1) ||
//         isWater(x, y - 1);
//       if (!touchesWater) continue;

//       // Classify by dominant direction from center
//       var sdx = x - cx,
//         sdy = y - cy;
//       var side =
//         Math.abs(sdy) > Math.abs(sdx)
//           ? sdy < 0
//             ? "north"
//             : "south"
//           : sdx < 0
//             ? "west"
//             : "east";

//       coastBySide[side].push({ x: x, y: y });
//     }
//   }

//   // ============================================================
//   // 2. DECIDE HOW MANY RIVERS
//   // ============================================================
//   var totalRivers = hasmountains
//     ? Math.floor(Math.random() * 6) + 2 // 2 .. 7
//     : Math.floor(Math.random() * 3) + 1; // 1 .. 3

//   var sides = ["north", "south", "east", "west"];
//   sides.sort(function () {
//     return Math.random() - 0.5;
//   });

//   var sideCounts = { north: 0, south: 0, east: 0, west: 0 };
//   var placed = 0;
//   while (placed < totalRivers) {
//     var any = false;
//     for (var i = 0; i < sides.length; i++) {
//       if (placed >= totalRivers) break;
//       var s = sides[i];
//       if (sideCounts[s] < 3 && coastBySide[s].length > sideCounts[s]) {
//         sideCounts[s]++;
//         placed++;
//         any = true;
//       }
//     }
//     if (!any) break; // ran out of viable coast
//   }

//   console.log("Rivers:", placed, sideCounts);

//   // ============================================================
//   // 3. PICK MOUTHS FROM THE REAL COASTLINE
//   // ============================================================
//   var mouths = [];
//   var margin = Math.floor(Math.min(W, H) * 0.15);

//   for (var i = 0; i < sides.length; i++) {
//     var side = sides[i];
//     var pool = coastBySide[side];

//     // Shuffle so we don't always pick the same spot
//     for (var j = pool.length - 1; j > 0; j--) {
//       var k = Math.floor(Math.random() * (j + 1));
//       var tmp = pool[j];
//       pool[j] = pool[k];
//       pool[k] = tmp;
//     }

//     var count = 0;
//     for (var j = 0; j < pool.length && count < sideCounts[side]; j++) {
//       var p = pool[j];
//       // Respect the margin (keep away from corners)
//       if (
//         p.x < margin ||
//         p.x >= W - margin ||
//         p.y < margin ||
//         p.y >= H - margin
//       )
//         continue;

//       // Simple spacing check so two rivers don't start on top of each other
//       var tooClose = false;
//       for (var m = 0; m < mouths.length; m++) {
//         var ddx = mouths[m].x - p.x,
//           ddy = mouths[m].y - p.y;
//         if (Math.sqrt(ddx * ddx + ddy * ddy) < 40) {
//           tooClose = true;
//           break;
//         }
//       }
//       if (tooClose) continue;

//       mouths.push({ x: p.x, y: p.y, side: side });
//       count++;
//     }
//   }

//   // ============================================================
//   // 4. WALK UPHILL (gradient ascent + center pull + meander)
//   // ============================================================
//   var dirs = [
//     { dx: 0, dy: -1 },
//     { dx: 1, dy: -1 },
//     { dx: 1, dy: 0 },
//     { dx: 1, dy: 1 },
//     { dx: 0, dy: 1 },
//     { dx: -1, dy: 1 },
//     { dx: -1, dy: 0 },
//     { dx: -1, dy: -1 },
//   ];

//   for (var m = 0; m < mouths.length; m++) {
//     var x = mouths[m].x,
//       y = mouths[m].y;
//     var path = [];
//     var visited = new Uint8Array(W * H);

//     var mouthDist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
//     var targetProgress = hasmountains ? 1.0 : 0.6 + Math.random() * 0.3; // 60-90%
//     var minDistToCenter = mouthDist * (1 - targetProgress);

//     for (var step = 0; step < W * H; step++) {
//       var idx = y * W + x;
//       if (visited[idx]) break;
//       visited[idx] = 1;
//       path.push({ x: x, y: y });

//       var distToCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
//       if (distToCenter < Math.max(minDistToCenter, 6)) break;

//       var currentH = getH(x, y);
//       var scores = [],
//         total = 0;

//       for (var d = 0; d < 8; d++) {
//         var nx = x + dirs[d].dx,
//           ny = y + dirs[d].dy;
//         if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;

//         var nidx = ny * W + nx;
//         if (visited[nidx]) continue;

//         var nh = getH(nx, ny);
//         if (nh < 0.38) continue; // never step into water
//         if (nh < currentH - 0.05) continue; // strongly discourage going downhill

//         var ndcx = nx - cx,
//           ndcy = ny - cy;
//         var newDist = Math.sqrt(ndcx * ndcx + ndcy * ndcy);

//         var score = (distToCenter - newDist) * 90; // pull toward center
//         score += Math.max(0, nh - currentH) * 35; // uphill bias
//         score += Math.random() * 55; // natural meander

//         scores.push({ nx: nx, ny: ny, s: score });
//         total += score;
//       }

//       if (scores.length === 0) break;

//       var pick = Math.random() * total,
//         cum = 0,
//         chosen = scores[0];
//       for (var s = 0; s < scores.length; s++) {
//         cum += scores[s].s;
//         if (pick <= cum) {
//           chosen = scores[s];
//           break;
//         }
//       }
//       x = chosen.nx;
//       y = chosen.ny;
//     }

//     // ============================================================
//     // 5. DRAW (source → mouth, thin → thick)
//     // ============================================================
//     if (path.length < 4) continue; // too short, skip

//     for (var i = path.length - 1; i >= 0; i--) {
//       var px = path[i].x,
//         py = path[i].y;
//       var progress = (path.length - 1 - i) / (path.length || 1);

//       var w = 2;
//       if (progress > 0.15) w = 3;
//       if (progress > 0.4) w = 4;
//       if (progress > 0.7) w = 5;

//       var riverH = getH(px, py);
//       var baseR = 90,
//         baseG = 160,
//         baseB = 235;
//       if (progress > 0.8) {
//         baseR = 130;
//         baseG = 195;
//         baseB = 250;
//       }

//       var blend = Math.max(0, Math.min(1, (riverH - 0.58) / 0.17));
//       var iceR = 205,
//         iceG = 225,
//         iceB = 245;

//       var rc = Math.floor(baseR + (iceR - baseR) * blend);
//       var gc = Math.floor(baseG + (iceG - baseG) * blend);
//       var bc = Math.floor(baseB + (iceB - baseB) * blend);

//       ctx.fillStyle = "rgb(" + rc + "," + gc + "," + bc + ")";
//       ctx.fillRect(px, py, w, w);
//     }
//   }
// }

function renderRivers(elevation, hasmountains) {
  var canvas = document.getElementById("mapCanvas");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;
  var cx = Math.floor(W / 2);
  var cy = Math.floor(H / 2);

  // --- Build full-res heightmap (must match renderIsland exactly) ---
  var h = new Float32Array(W * H);
  for (var y = 0; y < H; y++) {
    for (var x = 0; x < W; x++) {
      var idx = y * W + x;
      var e_raw = parseFloat(elevation[idx]);

      var dx = x - cx,
        dy = y - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxR = W * 1.1;

      var mask = Math.max(0, 1 - dist / maxR);
      mask = Math.pow(mask, 1.2);
      e_raw *= mask;

      if (hasmountains) {
        var boost = Math.max(0, 1 - dist / (W * 0.09)) * 0.45;
        e_raw += boost;
        if (e_raw > 1.0) e_raw = 1.0;
      }

      var em = W * 0.06;
      var ef = 1.0;
      if (x < em) ef = x / em;
      if (x > W - em) ef = Math.min(ef, (W - x) / em);
      if (y < em) ef = Math.min(ef, y / em);
      if (y > H - em) ef = Math.min(ef, (H - y) / em);
      e_raw *= ef;

      var e = e_raw;
      if (e < 0.35) e *= 0.3;
      else if (e < 0.42) e = 0.35 + (e - 0.35) * 0.5;
      else e = 0.4 + (e - 0.42) * 1.6;

      if (!hasmountains && e > 0.7) e = 0.7;

      h[idx] = e;
    }
  }

  function getH(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return -1;
    return h[y * W + x];
  }

  function isLand(x, y) {
    return getH(x, y) >= 0.38;
  }
  function isWater(x, y) {
    return getH(x, y) < 0.38;
  }

  // ============================================================
  // 1. FIND REAL COASTLINE
  // ============================================================
  var coastBySide = { north: [], south: [], east: [], west: [] };

  for (var y = 1; y < H - 1; y++) {
    for (var x = 1; x < W - 1; x++) {
      if (!isLand(x, y)) continue;
      var touchesWater =
        isWater(x + 1, y) ||
        isWater(x - 1, y) ||
        isWater(x, y + 1) ||
        isWater(x, y - 1);
      if (!touchesWater) continue;

      var sdx = x - cx,
        sdy = y - cy;
      var side =
        Math.abs(sdy) > Math.abs(sdx)
          ? sdy < 0
            ? "north"
            : "south"
          : sdx < 0
            ? "west"
            : "east";

      coastBySide[side].push({ x: x, y: y });
    }
  }

  // ============================================================
  // 2. DECIDE HOW MANY RIVERS
  // ============================================================
  var totalRivers = hasmountains
    ? Math.floor(Math.random() * 6) + 2
    : Math.floor(Math.random() * 3) + 1;

  var sides = ["north", "south", "east", "west"];
  sides.sort(function () {
    return Math.random() - 0.5;
  });

  var sideCounts = { north: 0, south: 0, east: 0, west: 0 };
  var placed = 0;
  while (placed < totalRivers) {
    var any = false;
    for (var i = 0; i < sides.length; i++) {
      if (placed >= totalRivers) break;
      var s = sides[i];
      if (sideCounts[s] < 3 && coastBySide[s].length > sideCounts[s]) {
        sideCounts[s]++;
        placed++;
        any = true;
      }
    }
    if (!any) break;
  }

  console.log("Rivers:", placed, sideCounts);

  // ============================================================
  // 3. PICK MOUTHS FROM REAL COASTLINE
  // ============================================================
  var mouths = [];
  var margin = Math.floor(Math.min(W, H) * 0.15);

  for (var i = 0; i < sides.length; i++) {
    var side = sides[i];
    var pool = coastBySide[side];

    for (var j = pool.length - 1; j > 0; j--) {
      var k = Math.floor(Math.random() * (j + 1));
      var tmp = pool[j];
      pool[j] = pool[k];
      pool[k] = tmp;
    }

    var count = 0;
    for (var j = 0; j < pool.length && count < sideCounts[side]; j++) {
      var p = pool[j];
      if (
        p.x < margin ||
        p.x >= W - margin ||
        p.y < margin ||
        p.y >= H - margin
      )
        continue;

      var tooClose = false;
      for (var m = 0; m < mouths.length; m++) {
        var ddx = mouths[m].x - p.x,
          ddy = mouths[m].y - p.y;
        if (Math.sqrt(ddx * ddx + ddy * ddy) < 40) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      mouths.push({ x: p.x, y: p.y, side: side });
      count++;
    }
  }

  // ============================================================
  // 4. HYBRID WALK
  // ============================================================
  var dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 1, dy: 1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: -1, dy: -1 },
  ];

  for (var m = 0; m < mouths.length; m++) {
    var x = mouths[m].x,
      y = mouths[m].y;
    var path = [];
    var visited = new Uint8Array(W * H);
    var lastDir = -1;

    var mouthDist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
    var targetDist = hasmountains
      ? 6
      : mouthDist * (1 - (0.6 + Math.random() * 0.3));
    var totalDist = mouthDist - targetDist;

    for (var step = 0; step < W * H; step++) {
      var idx = y * W + x;
      if (visited[idx]) break;
      visited[idx] = 1;
      path.push({ x: x, y: y });

      var distToCenter = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (distToCenter < Math.max(targetDist, 6)) break;

      var distTraveled = mouthDist - distToCenter;
      var progress = Math.max(0, Math.min(1, distTraveled / totalDist));

      // --- Determine phase ---
      var mode;
      if (hasmountains) {
        if (progress < 0.2) mode = "strict";
        else if (progress < 0.45) mode = "straight";
        else if (progress < 0.6) mode = "curvy";
        else mode = "straight";
      } else {
        if (progress < 0.35) mode = "strict";
        else if (progress < 0.6) mode = "straight";
        else mode = "curvy";
      }

      var currentH = getH(x, y);
      var scores = [],
        total = 0;

      for (var d = 0; d < 8; d++) {
        var nx = x + dirs[d].dx,
          ny = y + dirs[d].dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;

        var nidx = ny * W + nx;
        if (visited[nidx]) continue;

        var nh = getH(nx, ny);
        if (nh < 0.38) continue;
        if (nh < currentH - 0.05) continue;

        var ndcx = nx - cx,
          ndcy = ny - cy;
        var newDist = Math.sqrt(ndcx * ndcx + ndcy * ndcy);

        var score = 0;

        if (mode === "strict") {
          score += (distToCenter - newDist) * 180;
          score += Math.max(0, nh - currentH) * 40;
          score += Math.random() * 5;
        } else if (mode === "straight") {
          score += (distToCenter - newDist) * 100;
          score += Math.max(0, nh - currentH) * 35;
          score += Math.random() * 20;
        } else {
          var momentum = 0;
          if (lastDir >= 0) {
            var diff = Math.abs(d - lastDir);
            if (diff > 4) diff = 8 - diff;
            momentum = (4 - diff) * 75;
          }
          score += (distToCenter - newDist) * 30;
          score += Math.max(0, nh - currentH) * 12;
          score += momentum;
          score += Math.random() * 95;
        }

        scores.push({ nx: nx, ny: ny, s: score, dir: d });
        total += score;
      }

      if (scores.length === 0) break;

      var pick = Math.random() * total,
        cum = 0,
        chosen = scores[0];
      for (var s = 0; s < scores.length; s++) {
        cum += scores[s].s;
        if (pick <= cum) {
          chosen = scores[s];
          break;
        }
      }

      x = chosen.nx;
      y = chosen.ny;
      lastDir = chosen.dir;
    }

    // ============================================================
    // 5. DRAW
    // ============================================================
    if (path.length < 4) continue;

    for (var i = path.length - 1; i >= 0; i--) {
      var px = path[i].x,
        py = path[i].y;
      var progress = (path.length - 1 - i) / (path.length || 1);

      var w = 2;
      if (progress > 0.15) w = 3;
      if (progress > 0.4) w = 4;
      if (progress > 0.7) w = 5;

      var riverH = getH(px, py);
      var baseR = 90,
        baseG = 160,
        baseB = 235;
      if (progress > 0.8) {
        baseR = 130;
        baseG = 195;
        baseB = 250;
      }

      var blend = Math.max(0, Math.min(1, (riverH - 0.58) / 0.17));
      var iceR = 205,
        iceG = 225,
        iceB = 245;

      var rc = Math.floor(baseR + (iceR - baseR) * blend);
      var gc = Math.floor(baseG + (iceG - baseG) * blend);
      var bc = Math.floor(baseB + (iceB - baseB) * blend);

      ctx.fillStyle = "rgb(" + rc + "," + gc + "," + bc + ")";
      ctx.fillRect(px, py, w, w);
    }
  }
}
