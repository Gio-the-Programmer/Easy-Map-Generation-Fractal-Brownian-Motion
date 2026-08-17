function PerlinNoise(isGradient = true, gridSize = 10) {
  var canvas = document.getElementById("mapCanvas");
  var width = canvas.width;
  var height = canvas.height;
  var sizeMap = width * height;

  // 1. Define how many grid tiles you want across the screen (e.g., a 10x10 grid);
  var gridWidth = gridSize + 1;
  var gridHeight = gridSize + 1;

  // 2. Generate gradient vectors for the grid intersections
  var arrGradientVectors = [];
  for (var i = 0; i < gridWidth * gridHeight; i++) {
    var radians = Math.random() * Math.PI * 2; // Generate radians directly
    arrGradientVectors.push([Math.cos(radians), Math.sin(radians)]);
  }
  var arrFinalNoise = [];

  // Helper function to get gradient at a specific grid coordinate (X, Y)
  function getGradient(gridX, gridY) {
    var index = gridY * gridWidth + gridX;
    return arrGradientVectors[index];
  }

  // Fade curve formula
  var formulaFadeCurve = (t) => 6 * t ** 5 - 15 * t ** 4 + 10 * t ** 3;

  // 3. Loop through every pixel on the canvas
  for (var screenY = 0; screenY < height; screenY++) {
    for (var screenX = 0; screenX < width; screenX++) {
      // Map screen pixel (0 to width) to grid coordinates (0 to gridSize)
      var noiseX = (screenX / width) * gridSize;
      var noiseY = (screenY / height) * gridSize;
      // PIXELATED MODIFICATION:
      // If pixelated, clamp the noise coordinate to the center of the grid tile
      if (!isGradient) {
        noiseX = Math.floor(noiseX) + 0.5;
        noiseY = Math.floor(noiseY) + 0.5;
      }

      // Find the integer coordinates of the 4 surrounding grid corners
      var x0 = Math.floor(noiseX);
      var x1 = x0 + 1;
      var y0 = Math.floor(noiseY);
      var y1 = y0 + 1;

      // Find the relative fractional distance inside the current tile (0.0 to 1.0)
      var tx = noiseX - x0;
      var ty = noiseY - y0;

      // Distance vectors from the 4 corners to the inner point
      var botLeftDist = [tx - 0, ty - 0];
      var botRightDist = [tx - 1, ty - 0];
      var topLeftDist = [tx - 0, ty - 1];
      var topRightDist = [tx - 1, ty - 1];

      // Get the shared gradients for these specific grid corners
      var gBL = getGradient(x0, y0);
      var gBR = getGradient(x1, y0);
      var gTL = getGradient(x0, y1);
      var gTR = getGradient(x1, y1);

      // Calculate Dot Products
      var dotBotLeft = botLeftDist[0] * gBL[0] + botLeftDist[1] * gBL[1];
      var dotBotRight = botRightDist[0] * gBR[0] + botRightDist[1] * gBR[1];
      var dotTopLeft = topLeftDist[0] * gTL[0] + topLeftDist[1] * gTL[1];
      var dotTopRight = topRightDist[0] * gTR[0] + topRightDist[1] * gTR[1];

      // Smooth the distance weights using the fade curve
      var fadeX = formulaFadeCurve(tx);
      var fadeY = formulaFadeCurve(ty);

      // LERP horizontally (Left to Right)
      var lerpBottom = dotBotLeft + fadeX * (dotBotRight - dotBotLeft);
      var lerpTop = dotTopLeft + fadeX * (dotTopRight - dotTopLeft);

      // LERP vertically (Bottom to Top)
      var finalNoiseValue = lerpBottom + fadeY * (lerpTop - lerpBottom);

      // Perlin output sits roughly between -0.7 and 0.7.
      // Map it to a 0.0 to 1.0 range for easier color rendering.
      var normalizedNoise = (finalNoiseValue + 0.707) / 1.414;

      // Clamp values just in case of slight math overflows
      normalizedNoise = Math.max(0, Math.min(1, normalizedNoise));

      arrFinalNoise.push(normalizedNoise.toFixed(4));
    }
  }
  return arrFinalNoise;
}
