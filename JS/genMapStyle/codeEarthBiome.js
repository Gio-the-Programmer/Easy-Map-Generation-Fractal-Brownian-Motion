// ============================================================
// RENDER LOOP (Earth biomes)
// ============================================================

function renderEarthBiome(elevation, moisture) {
  const canvas = document.getElementById("mapCanvas");
  const ctx = canvas.getContext("2d");
  var widthMap = canvas.width;
  var heightMap = canvas.height;

  for (var i = 0; i < elevation.length; i++) {
    var e_raw = parseFloat(elevation[i]); // keep original for power-curve
    var m = parseFloat(moisture[i]);
    var screenY = Math.floor(i / widthMap);
    var screenX = i % widthMap;

    // --- FIX 1: Sharpen latitude curve (cube it) ---
    // This concentrates cold at the very edges instead of a wide band
    var normalizedY = screenY / heightMap;
    var latitude = Math.abs(normalizedY - 0.5) * 2; // 0..1 linear
    latitude = Math.pow(latitude, 3); // 0..1 but sharp curve
    // Now: equator=0, 75% from center=0.42, edge=1.0

    // --- FIX 2: Stronger elevation penalty for temperature ---
    // Mountains get colder, but low coast stays warmer until VERY near pole
    var temperature = 1.0 - latitude - e_raw * 0.6;

    // --- FIX 3: Power-curve elevation (your existing logic) ---
    var e = e_raw;
    if (e < 0.35) {
      e = e * 0.3;
    } else if (e < 0.42) {
      e = 0.35 + (e - 0.35) * 0.5;
    } else {
      e = 0.4 + (e - 0.42) * 1.6;
    }

    // --- FIX 4: Re-ordered biomes with tundra transition ---
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
      b = 130; // Beach (unaffected by latitude — sand is sand)
    } else if (temperature < -0.2) {
      // Deep ice cap (only at extreme poles + any elevation)
      r = 230;
      g = 240;
      b = 250;
    } else if (temperature < 0.15) {
      // Tundra / cold grass (transition zone, not pure snow)
      r = 180;
      g = 195;
      b = 175;
    } else if (e > 0.72) {
      // Rocky mountain (only if not frozen)
      r = 110;
      g = 100;
      b = 90;
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
