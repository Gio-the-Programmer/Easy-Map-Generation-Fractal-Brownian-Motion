function renderIsland(elevation, moisture, hasMountains) {
  // Default to true if not provided
  if (hasMountains === undefined) hasMountains = true;

  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  var widthMap = canvas.width;
  var heightMap = canvas.height;

  for (var i = 0; i < elevation.length; i++) {
    var e_raw = parseFloat(elevation[i]);
    var m = parseFloat(moisture[i]);
    var screenY = Math.floor(i / widthMap);
    var screenX = i % widthMap;

    // --- ISLAND MASK ---
    var dx = screenX - widthMap / 2;
    var dy = screenY - heightMap / 2;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var maxRadius = widthMap * 0.72;

    var mask = 1 - dist / maxRadius;
    mask = Math.max(0, mask);
    mask = Math.pow(mask, 1.2);
    e_raw = e_raw * mask;

    // ============================================================
    // MOUNTAIN TOGGLE
    // ============================================================
    if (hasMountains) {
      var continentalBoost = Math.max(0, 1 - dist / (widthMap * 0.09)) * 0.45;
      e_raw = e_raw + continentalBoost;
      if (e_raw > 1.0) e_raw = 1.0;
    }

    // --- EDGE WATER GUARANTEE ---
    var edgeMargin = widthMap * 0.06;
    var edgeFadeX = 1.0;
    var edgeFadeY = 1.0;

    if (screenX < edgeMargin) edgeFadeX = screenX / edgeMargin;
    if (screenX > widthMap - edgeMargin)
      edgeFadeX = (widthMap - screenX) / edgeMargin;
    if (screenY < edgeMargin) edgeFadeY = screenY / edgeMargin;
    if (screenY > heightMap - edgeMargin)
      edgeFadeY = (heightMap - screenY) / edgeMargin;

    var edgeFade = Math.min(edgeFadeX, edgeFadeY);
    e_raw = e_raw * edgeFade;

    // --- ELEVATION POWER CURVE ---
    var e = e_raw;
    if (e < 0.35) {
      e = e * 0.3;
    } else if (e < 0.42) {
      e = 0.35 + (e - 0.35) * 0.5;
    } else {
      e = 0.4 + (e - 0.42) * 1.6;
    }

    // --- TEMPERATURE (elevation-only, no poles) ---
    var elevationCooling = Math.pow(e, 2.2) * 1.4;
    var temperature = 1.0 - elevationCooling;

    // --- BIOMES ---
    var r, g, b;

    if (e < 0.3) {
      r = 25;
      g = 55;
      b = 145; // Deep ocean
    } else if (e < 0.38) {
      r = 55;
      g = 120;
      b = 220; // Shallow water
    } else if (e < 0.4) {
      r = 220;
      g = 200;
      b = 130; // Beach
    } else if (temperature < -0.2) {
      r = 230;
      g = 240;
      b = 250; // Ice cap (peaks only)
    } else if (temperature < 0.15) {
      r = 180;
      g = 195;
      b = 175; // Tundra
    } else if (e > 0.72) {
      r = 110;
      g = 100;
      b = 90; // Rocky mountain
    } else if (m < 0.25) {
      r = 210;
      g = 170;
      b = 80; // Desert
    } else if (m < 0.45) {
      r = 130;
      g = 190;
      b = 60; // Grassland
    } else if (m < 0.65) {
      r = 40;
      g = 120;
      b = 50; // Forest
    } else {
      r = 25;
      g = 80;
      b = 40; // Rainforest
    }

    ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
    ctx.fillRect(screenX, screenY, 1, 1);
  }
}

function generateValidIsland(hasMountains) {
  if (hasMountains === undefined) hasMountains = true;

  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  var widthMap = canvas.width;
  var heightMap = canvas.height;
  var elevation, moisture;
  var attempts = 0;
  var desiredLandRatio = 0.35; // 35% of center must be land

  do {
    var seed = Math.floor(Math.random() * 100000);
    elevation = FractalBrownianMotion(4, 7, 0.5, 2.0, seed);
    moisture = FractalBrownianMotion(6, 6, 0.5, 2.0, seed + 1000);

    // Check center 40% of map only (don't scan edges)
    var landCount = 0;
    var checkSize = 0;
    var start = Math.floor(widthMap * 0.3);
    var end = Math.floor(widthMap * 0.7);

    for (var y = start; y < end; y++) {
      for (var x = start; x < end; x++) {
        var idx = y * widthMap + x;
        var e_raw = parseFloat(elevation[idx]);

        // Apply mask (same math as renderIsland)
        var dx = x - widthMap / 2;
        var dy = y - heightMap / 2;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxRadius = widthMap * 0.6;
        var mask = Math.max(0, 1 - dist / maxRadius);
        mask = Math.pow(mask, 1.2);

        // After mask, is this above beach threshold?
        // Your power curve makes land at e_raw >= 0.42
        var threshold = hasMountains ? 0.42 : 0.38;
        if (e_raw * mask >= threshold) landCount++;
        checkSize++;
      }
    }

    var ratio = landCount / checkSize;
    attempts++;
  } while (ratio < desiredLandRatio && attempts < 100);

  console.log("Island generated in " + attempts + " attempt(s)");
  return { elevation, moisture };
}
