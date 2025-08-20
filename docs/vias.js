const map = L.map('map').setView([4.617, -74.070], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

let selectedMarker = null;

const selectedIcon = L.divIcon({
  className: 'selected-marker'
});

let viasLayer = L.geoJSON(null, {
  style: {
    color: '#ff6600',
    weight: 4,
    opacity: 0.8
  },
  onEachFeature: function (feature, layer) {
    layer.on('click', (e) => {
      if (selectedMarker) {
        map.removeLayer(selectedMarker);
      }
      selectedMarker = L.marker(e.latlng, { icon: selectedIcon }).addTo(map);
      mostrarInfoVia(e.latlng);
    });
  }
}).addTo(map);

const barriosURL = 'https://bogota-laburbano.opendatasoft.com/api/explore/v2.1/catalog/datasets/barrios-bogota/exports/geojson';

fetch(barriosURL)
  .then(res => res.json())
  .then(data => {
    const barrioFeatureRaw = data.features.find(f => f.properties.nombre.toLowerCase().includes('palermo sur'));
    if (!barrioFeatureRaw) {
      alert('No se encontró el barrio Palermo Sur');
      return;
    }
    if (!barrioFeatureRaw.geometry) {
      alert('No se encontró geometría válida');
      return;
    }

    const barrioGeoJSON = {
      type: 'Feature',
      properties: barrioFeatureRaw.properties,
      geometry: barrioFeatureRaw.geometry
    };

    const barrioLayer = L.geoJSON(barrioGeoJSON, {
      style: {
        color: '#004080',
        weight: 3,
        fillOpacity: 0,
        dashArray: '6 6'
      }
    }).addTo(map);

    map.fitBounds(barrioLayer.getBounds());

    const esriGeometry = barrioFeatureRaw.geometry;

    const featureLayer = L.esri.featureLayer({
      url: 'https://services2.arcgis.com/NEwhEo9GGSHXcRXV/arcgis/rest/services/Malla_Vial_Integral_Bogota_D_C/FeatureServer/0'
    });

    featureLayer.query()
      .within(esriGeometry)
      .run(function (error, featureCollection) {
        if (error) {
          alert('Error en consulta de vías: ' + error);
          return;
        }
        viasLayer.clearLayers();
        viasLayer.addData(featureCollection);
        if (viasLayer.getBounds().isValid()) {
          map.fitBounds(viasLayer.getBounds());
        }
      });
  })
  .catch(e => {
    alert('Error cargando polígono barrio: ' + e);
  });

function mostrarInfoVia(latlng) {
  const infoDiv = document.getElementById('info');
  infoDiv.innerHTML = `<h2>Buscando dirección...</h2>
                       <p><strong>Latitud:</strong> ${latlng.lat.toFixed(6)}<br>
                       <strong>Longitud:</strong> ${latlng.lng.toFixed(6)}</p>
                       <p>Consultando dirección...</p>`;

  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latlng.lat}&lon=${latlng.lng}`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && data.display_name) {
        infoDiv.innerHTML = `
          <h2>Dirección encontrada</h2>
          <p><strong>Latitud:</strong> ${latlng.lat.toFixed(6)}<br>
          <strong>Longitud:</strong> ${latlng.lng.toFixed(6)}</p>
          <p><strong>Dirección:</strong> ${data.display_name}</p>
        `;
      } else {
        infoDiv.innerHTML += `<p>No se encontró dirección.</p>`;
      }
    })
    .catch(() => {
      infoDiv.innerHTML += `<p>Error al consultar dirección.</p>`;
    });
}
