const map = L.map('map');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
}).addTo(map);

// URLs
const barriosURL = 'https://bogota-laburbano.opendatasoft.com/api/explore/v2.1/catalog/datasets/barrios-bogota/exports/geojson';
const localidadesURL = 'https://sig.car.gov.co/arcgis/rest/services/visor/Division_Territorial/MapServer/5/query?where=1%3D1&outFields=*&f=geojson';

// Unir polígonos
async function unirPoligonos(features) {
  if (!features.length) return null;
  let unionPoly = features[0];
  for (let i = 1; i < features.length; i++) {
    try {
      unionPoly = turf.union(unionPoly, features[i]);
    } catch (e) {
      console.warn('Error uniendo polígonos', e);
    }
  }
  return unionPoly;
}

// Cargar datos
fetch(localidadesURL)
  .then(res => res.json())
  .then(data => unirPoligonos(data.features))
  .then(limiteUnido => {
    if (!limiteUnido) throw new Error('No se pudo unir polígonos de localidades');

    const limiteLayer = L.geoJSON(limiteUnido, {
      style: {
        color: '#FF0000',
        weight: 3,
        fillOpacity: 0,
        dashArray: '10 6'
      }
    }).addTo(map);

    map.fitBounds(limiteLayer.getBounds());

    return fetch(barriosURL);
  })
  .then(res => res.json())
  .then(data => {
    const filtered = data.features.filter(f => {
      const n = f.properties && f.properties.nombre;
      return n && n.toLowerCase().includes('palermo sur');
    });

    if (!filtered.length) {
      alert('No se encontró el barrio "Palermo Sur"');
      return;
    }

    const geojsonFiltered = {
      type: 'FeatureCollection',
      features: filtered
    };

    L.geoJSON(geojsonFiltered, {
      style: {
        color: '#004080',
        weight: 3,
        fillColor: '#ff6600',
        fillOpacity: 0.5
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties?.nombre) {
          layer.bindPopup(`<strong>${feature.properties.nombre}</strong>`);
        }
      }
    }).addTo(map);
  })
  .catch(err => {
    console.error(err);
    alert('Error cargando datos geográficos');
  });
