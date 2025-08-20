// Inicializar mapa
var map = L.map("map");

// Capa base
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// --------------------
// Mostrar polígono del barrio (solo visual)
const barriosURL = 'https://bogota-laburbano.opendatasoft.com/api/explore/v2.1/catalog/datasets/barrios-bogota/exports/geojson';
fetch(barriosURL)
  .then(res => res.json())
  .then(data => {
    const barrioFeature = data.features.find(f => f.properties.nombre.toLowerCase().includes('palermo sur'));
    if (!barrioFeature) return;

    L.geoJSON(barrioFeature, {
      style: {
        color: '#004080',
        weight: 3,
        fillOpacity: 0,
        dashArray: '6 6'
      },
      interactive: false
    }).addTo(map);
  })
  .catch(e => console.error('Error cargando polígono barrio:', e));

// Cargar GeoJSON de parques
fetch("INSUMOS/Parques_P.geojson")
  .then(response => response.json())
  .then(data => {
    var parquesLayer = L.geoJSON(data, {
      style: {
        color: "green",
        weight: 2,
        fillColor: "lightgreen",
        fillOpacity: 0.5
      },
      onEachFeature: function (feature, layer) {
        layer.bindTooltip(feature.properties.NOMBRE_PAR);
        layer.on("click", function () {
          const infoWindow = document.getElementById("info-window");
          const infoTitle = document.getElementById("info-title");
          const infoContent = document.getElementById("info-content");

          infoTitle.textContent = feature.properties.NOMBRE_PAR;
          infoContent.innerHTML = `
            <p>${feature.properties.DESCRIP}</p>
            <img src="INSUMOS/${feature.properties.NOMBRE_PAR}.jpg" 
                 alt="${feature.properties.NOMBRE_PAR}" 
                 style="width:100%; margin-top:10px; border-radius:8px;">
          `;
          infoWindow.style.display = "block";
          map.fitBounds(layer.getBounds(), { maxZoom: 18 });
        });
      }
    }).addTo(map);

    // Ajustar vista inicial al barrio (todos los parques)
    map.fitBounds(parquesLayer.getBounds());
  });

// Botón de cerrar ventana
document.getElementById("close-btn").addEventListener("click", function () {
  document.getElementById("info-window").style.display = "none";
});



