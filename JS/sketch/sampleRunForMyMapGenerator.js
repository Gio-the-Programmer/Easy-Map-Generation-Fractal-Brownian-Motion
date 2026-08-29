// PERLIN NOISE

// var pixelValues = PerlinNoise(true);
// // alert(pixelValues);

// const canvas = document.getElementById("mapCanvas");
// const ctx = canvas.getContext("2d");
// var widthMap = canvas.width;

// for (var i = 0; i < pixelValues.length; i++) {
//   var intensity = Math.abs(pixelValues[i]);
//   ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
//   ctx.fillRect(i % widthMap, Math.floor(i / widthMap), 1, 1);
// }

// BROWNIAN MOTION

// var pixelValues = BrownianMotion();
// alert(pixelValues);

// const canvas = document.getElementById("mapCanvas");
// const ctx = canvas.getContext("2d");
// var widthMap = canvas.width;

// for (var i = 0; i < pixelValues.length; i++) {
//   var intensity = Math.abs(pixelValues[i]);
//   ctx.fillStyle = `rgba(255, 255, 255, ${intensity})`;
//   ctx.fillRect(i % widthMap, Math.floor(i / widthMap), 1, 1);
// }

// FRACTAL BROWNIAN MOTION

// var pixelValues = FractalBrownianMotion();
// alert(pixelValues[1]);

// ============================================================
// GENERATE TWO NOISE FIELDS
// ============================================================
// var elevation = FractalBrownianMotion(); // Big continents
// var moisture = FractalBrownianMotion(6, 6, 0.5, 2.0, 1000); // Rainfall pattern
