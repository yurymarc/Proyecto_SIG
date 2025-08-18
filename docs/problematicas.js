// Inicializar mapa
var map = L.map("map");

// Capa base
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Cargar polígono del barrio
fetch("Pol_Barrio.geojson")
  .then(response => response.json())
  .then(data => {
    var barrio = L.geoJSON(data, {
      style: {
        color: "#003366",
        weight: 2,
        fillColor: "#66a3ff",
        fillOpacity: 0.3
      }
    }).addTo(map);

    // Centrar mapa al barrio
    map.fitBounds(barrio.getBounds());
  })
  .catch(err => console.error("Error cargando el polígono:", err));

