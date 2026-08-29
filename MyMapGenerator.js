const startTime = performance.now() / 1000;

var hasmountains = true; // ← 1. declare FIRST
var maps = generateValidIsland(hasmountains); // ← 2. pass it in
renderIsland(maps.elevation, maps.moisture, hasmountains);
renderRivers(maps.elevation, hasmountains);

const endTime = performance.now() / 1000;
const executionTime = endTime - startTime;
document.getElementById("executionTime").textContent =
  `Execution time: ${executionTime.toFixed(2)} seconds`;
