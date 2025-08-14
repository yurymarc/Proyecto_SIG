const map = L.map('map').setView([4.617, -74.070], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

const defaultTitle = "Descripción general";
const defaultText = "Este espacio está reservado para mostrar información general sobre el barrio Palermo Sur o cualquier contenido que quieras incluir.";

// Función para transformar coordenadas si están en EPSG:3857
function transformCoordinates(coordinates) {
  if (typeof coordinates[0] === 'number') {
    return proj4('EPSG:3857', 'EPSG:4326', coordinates);
  } else {
    return coordinates.map(transformCoordinates);
  }
}

// --------------------
// 1️⃣ Mostrar polígono del barrio (solo visual)
// --------------------
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

// --------------------
// 2️⃣ Cargar parques interactivos
// --------------------
fetch('INSUMOS/Parques_Palermo.geojson')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(feature => {
      if (feature.geometry.type === "Polygon" || feature.geometry.type === "MultiPolygon") {
        feature.geometry.coordinates = transformCoordinates(feature.geometry.coordinates);
      }
    });

    const parquesLayer = L.geoJSON(data, {
      style: {
        color: 'green',
        weight: 2,
        fillOpacity: 0.3
      },
      onEachFeature: function(feature, layer) {
        layer.on('click', (e) => {
          document.getElementById('info-title').textContent = "Parque Palermo Sur";
          document.getElementById('info-text').textContent = "Se debe registrar";
          e.originalEvent.stopPropagation();
        });
      }
    }).addTo(map);

    map.fitBounds(parquesLayer.getBounds());
  })
  .catch(err => console.error('Error cargando GeoJSON de parques:', err));

// --------------------
// 3️⃣ Click fuera de parques resetea panel
// --------------------
map.on('click', () => {
  document.getElementById('info-title').textContent = defaultTitle;
  document.getElementById('info-text').textContent = defaultText;
});
