function renderRivers(elevation) {
  var canvas = document.getElementById("mapCanvas");
  var ctx = canvas.getContext("2d");
  var W = canvas.width;
  var H = canvas.height;
  var cx = W / 2;
  var cy = H / 2;

  // 1. Low-res heightmap (same as your island)
  var scale = 0.75;
  var lowW = Math.floor(W * scale);
  var lowH = Math.floor(H * scale);
  var lowSize = lowW * lowH;
  var h = new Float32Array(lowSize);

  for (var ly = 0; ly < lowH; ly++) {
    for (var lx = 0; lx < lowW; lx++) {
      var fx = Math.floor(lx / scale);
      var fy = Math.floor(ly / scale);
      var e_raw = parseFloat(elevation[fy * W + fx]);

      var dx = fx - cx,
        dy = fy - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var maxR = W * 1.1;

      var mask = Math.max(0, 1 - dist / maxR);
      mask = Math.pow(mask, 1.2);
      e_raw *= mask;

      var boost = Math.max(0, 1 - dist / (W * 0.09)) * 0.45;
      e_raw += boost;
      if (e_raw > 1.0) e_raw = 1.0;

      var em = W * 0.06;
      var ef = 1.0;
      if (fx < em) ef = fx / em;
      if (fx > W - em) ef = Math.min(ef, (W - fx) / em);
      if (fy < em) ef = Math.min(ef, fy / em);
      if (fy > H - em) ef = Math.min(ef, (H - fy) / em);
      e_raw *= ef;

      var e = e_raw;
      if (e < 0.35) e *= 0.3;
      else if (e < 0.42) e = 0.35 + (e - 0.35) * 0.5;
      else e = 0.4 + (e - 0.42) * 1.6;

      h[ly * lowW + lx] = e;
    }
  }

  function getH(x, y) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || x >= lowW || y < 0 || y >= lowH) return -1;
    return h[y * lowW + x];
  }

  var lowCx = Math.floor(lowW / 2);
  var lowCy = Math.floor(lowH / 2);

  // 2. Find mouths by marching from each edge toward center
  var mouths = [];
  function findMouth(startX, startY, stepX, stepY, scanAxis) {
    var range = scanAxis === "x" ? lowW : lowH;
    var center = scanAxis === "x" ? lowCx : lowCy;
    for (var offset = 0; offset < range; offset++) {
      var checks = offset === 0 ? [center] : [center + offset, center - offset];
      for (var c = 0; c < checks.length; c++) {
        var pos = checks[c];
        if (pos < 0 || pos >= range) continue;
        var mx = startX,
          my = startY;
        if (scanAxis === "x") mx = pos;
        else my = pos;
        for (var i = 0; i < Math.max(lowW, lowH); i++) {
          if (mx < 0 || mx >= lowW || my < 0 || my >= lowH) break;
          if (getH(mx, my) >= 0.3)
            return { x: Math.floor(mx), y: Math.floor(my) };
          mx += stepX;
          my += stepY;
        }
      }
    }
    return null;
  }

  var n = findMouth(lowCx, 0, 0, 1, "x");
  var s = findMouth(lowCx, lowH - 1, 0, -1, "x");
  var w = findMouth(0, lowCy, 1, 0, "y");
  var e = findMouth(lowW - 1, lowCy, -1, 0, "y");

  if (n) mouths.push(n);
  if (s) mouths.push(s);
  if (w) mouths.push(w);
  if (e) mouths.push(e);
  if (mouths.length === 0) return;

  // 3. 8-direction vectors
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

  var xScale = W / lowW;
  var yScale = H / lowH;

  // 4. For each mouth, stumble uphill toward the white peak
  for (var m = 0; m < mouths.length; m++) {
    var x = mouths[m].x;
    var y = mouths[m].y;
    var path = [];
    var visited = new Uint8Array(lowSize);

    for (var step = 0; step < lowSize; step++) {
      var idx = y * lowW + x;
      if (visited[idx]) break;
      visited[idx] = 1;

      path.push({ x: x, y: y });

      // STOP when very close to center (guaranteed white mountain there)
      var dcx = x - lowCx;
      var dcy = y - lowCy;
      var distToCenter = Math.sqrt(dcx * dcx + dcy * dcy);
      if (distToCenter < 6) break;

      // Build 8 neighbor scores
      var scores = [];
      var total = 0;

      for (var d = 0; d < 8; d++) {
        var nx = x + dirs[d].dx;
        var ny = y + dirs[d].dy;
        if (nx < 0 || nx >= lowW || ny < 0 || ny >= lowH) continue;

        var nh = getH(nx, ny);
        if (nh < 0.25) continue; // don't walk into deep ocean

        // A. Pull toward center (strongest force)
        var ndcx = nx - lowCx;
        var ndcy = ny - lowCy;
        var newDist = Math.sqrt(ndcx * ndcx + ndcy * ndcy);
        var towardCenter = distToCenter - newDist;
        var score = towardCenter * 90;

        // B. Uphill bias (gentle)
        var uphill = nh - getH(x, y);
        score += uphill * 30;

        // C. Lateral jitter (the "Brownian" curve)
        score += Math.random() * 70;

        scores.push({ d: d, nx: nx, ny: ny, s: score });
        total += score;
      }

      if (scores.length === 0) break;

      // Roulette pick
      var pick = Math.random() * total;
      var cum = 0;
      var chosen = scores[0];
      for (var s = 0; s < scores.length; s++) {
        cum += scores[s].s;
        if (pick <= cum) {
          chosen = scores[s];
          break;
        }
      }

      x = chosen.nx;
      y = chosen.ny;
    }

    // 5. Draw reversed: pale ice at peak → rich blue at coast
    for (var i = path.length - 1; i >= 0; i--) {
      var px = Math.floor(path[i].x * xScale);
      var py = Math.floor(path[i].y * yScale);
      var progress = (path.length - 1 - i) / (path.length || 1);

      // Width grows from source to mouth
      var w = 2;
      if (progress > 0.15) w = 3;
      if (progress > 0.4) w = 4;
      if (progress > 0.7) w = 5;

      // ============================================================
      // RIVER COLOR: blend into mountain snow/tundra
      // ============================================================
      var riverH = getH(path[i].x, path[i].y);

      // Base river color (coastal blue)
      var baseR = 90,
        baseG = 160,
        baseB = 235;
      if (progress > 0.8) {
        baseR = 130;
        baseG = 195;
        baseB = 250;
      }

      // Mountain blend: 0 at h=0.58, 1 at h=0.75 (snow peak)
      var blend = Math.max(0, Math.min(1, (riverH - 0.58) / 0.17));

      // Pale ice-blue target: visible against white snow but seamless
      var iceR = 205,
        iceG = 225,
        iceB = 245;

      // Mix toward ice as we climb
      var rc = Math.floor(baseR + (iceR - baseR) * blend);
      var gc = Math.floor(baseG + (iceG - baseG) * blend);
      var bc = Math.floor(baseB + (iceB - baseB) * blend);

      ctx.fillStyle = "rgb(" + rc + "," + gc + "," + bc + ")";
      ctx.fillRect(px, py, w, w);
    }
  }
}
