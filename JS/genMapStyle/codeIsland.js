function renderIsland(elevation, moisture) {
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

    // 0.5 = tiny island, 0.65 = medium, 0.8 = huge island
    var maxRadius = widthMap * 1.1;

    var mask = 1 - dist / maxRadius;
    mask = Math.max(0, mask);

    // 1.0 = linear, 1.5 = steeper cliffs, 0.8 = very gradual
    mask = Math.pow(mask, 1.2);

    // Apply mask
    e_raw = e_raw * mask;

    // GUARANTEE LAND AT CENTER
    // Creates a guaranteed elevation that fades from center to edge
    var continentalBoost = Math.max(0, 1 - dist / (widthMap * 0.38)) * 0.45;
    e_raw = e_raw + continentalBoost;
    if (e_raw > 1.0) {
      e_raw = 1.0;
    }

    // --- LATITUDE TEMPERATURE ---
    var normalizedY = screenY / heightMap;
    var latitude = Math.abs(normalizedY - 0.5) * 2;
    latitude = Math.pow(latitude, 3);
    var temperature = 1.0 - latitude - e_raw * 0.6;

    // --- ELEVATION POWER CURVE ---
    var e = e_raw;
    if (e < 0.35) {
      e = e * 0.3;
    } else if (e < 0.42) {
      e = 0.35 + (e - 0.35) * 0.5;
    } else {
      e = 0.4 + (e - 0.42) * 1.6;
    }

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
      b = 250; // Ice cap
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

function generateValidIsland() {
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
        if (e_raw * mask >= 0.42) landCount++;
        checkSize++;
      }
    }

    var ratio = landCount / checkSize;
    attempts++;
  } while (ratio < desiredLandRatio && attempts < 100);

  console.log("Island generated in " + attempts + " attempt(s)");
  return { elevation, moisture };
}
