// ============================================================
// 1. BROWNIAN MOTION — Classic Random Walk
// ============================================================
// Returns a cumulative sum of random steps.
// When rendered as a canvas, each row shows a segment of the wandering path.
function BrownianMotion(stepSize = 0.05) {
  var canvas = document.getElementById("mapCanvas");
  var width = canvas.width;
  var height = canvas.height;

  var sizeMap = width * height;
  var arrFinalNoise = [];
  var position = 0;

  // 1. Generate the random walk
  for (var i = 0; i < sizeMap; i++) {
    position += (Math.random() - 0.5) * stepSize;
    arrFinalNoise.push(position);
  }

  // 2. Normalize to 0.0 .. 1.0 (BM is unbounded, so we remap)
  var min = arrFinalNoise[0];
  var max = arrFinalNoise[0];
  for (var i = 1; i < sizeMap; i++) {
    if (arrFinalNoise[i] < min) min = arrFinalNoise[i];
    if (arrFinalNoise[i] > max) max = arrFinalNoise[i];
  }
  var range = max - min || 1;

  for (var i = 0; i < sizeMap; i++) {
    arrFinalNoise[i] = ((arrFinalNoise[i] - min) / range).toFixed(4);
  }

  return arrFinalNoise;
}

// ============================================================
// FRACTAL BROWNIAN MOTION (with seedOffset for multiple passes)
// ============================================================
function FractalBrownianMotion(
  gridSize = 4,
  octaves = 7,
  persistence = 0.5,
  lacunarity = 2.0,
  seedOffset = Math.random() * 1000,
) {
  var canvas = document.getElementById("mapCanvas");
  var width = canvas.width;
  var height = canvas.height;
  var arrFinalNoise = [];

  function hash1D(n) {
    var x = Math.sin((n + seedOffset) * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function hash2D(x, y) {
    var n =
      Math.sin((x + seedOffset) * 127.1 + (y + seedOffset) * 311.7) *
      43758.5453;
    return n - Math.floor(n);
  }

  function smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function valueNoise2D(x, y) {
    var x0 = Math.floor(x),
      x1 = x0 + 1;
    var y0 = Math.floor(y),
      y1 = y0 + 1;
    var sx = smoothstep(x - x0);
    var sy = smoothstep(y - y0);
    var n00 = hash2D(x0, y0);
    var n10 = hash2D(x1, y0);
    var n01 = hash2D(x0, y1);
    var n11 = hash2D(x1, y1);
    return lerp(lerp(n00, n10, sx), lerp(n01, n11, sx), sy);
  }

  function fbm2D(x, y) {
    var total = 0.0;
    var amplitude = 1.0;
    var frequency = 1.0;
    var maxValue = 0.0;
    for (var o = 0; o < octaves; o++) {
      total += valueNoise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return total / maxValue;
  }

  for (var screenY = 0; screenY < height; screenY++) {
    for (var screenX = 0; screenX < width; screenX++) {
      var nx = (screenX / width) * gridSize;
      var ny = (screenY / height) * gridSize;
      arrFinalNoise.push(fbm2D(nx, ny).toFixed(4));
    }
  }

  return arrFinalNoise;
}
