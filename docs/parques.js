// Inicializar mapa
var map = L.map("map");

// Capa base
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Cargar GeoJSON
fetch("INSUMOS/Parques_P.geojson")
  .then(response => response.json())
  .then(data => {
    // Agregar GeoJSON con estilo verde
    var parquesLayer = L.geoJSON(data, {
      style: {
        color: "green",
        weight: 2,
        fillColor: "lightgreen",
        fillOpacity: 0.5
      },
      onEachFeature: function (feature, layer) {
        // Tooltip al pasar el mouse
        layer.bindTooltip(feature.properties.NOMBRE_PAR);

        // Evento click
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

          // Centrar y hacer zoom en el parque seleccionado
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


