const map = L.map('map').setView([4.617, -74.070], 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const barriosURL = 'https://bogota-laburbano.opendatasoft.com/api/explore/v2.1/catalog/datasets/barrios-bogota/exports/geojson';
const rutasZonalesURL = 'https://gis.transmilenio.gov.co/arcgis/rest/services/Zonal/consulta_rutas_zonales/FeatureServer/0/query?where=1=1&outFields=*&f=geojson';

let barrioFeatureGlobal = null;

fetch(barriosURL)
    .then(res => res.json())
    .then(data => {
        const barrioFeature = data.features.find(f =>
            f.properties.nombre.toLowerCase().includes('palermo sur')
        );
        if (!barrioFeature) {
            alert('No se encontró el barrio Palermo Sur');
            return;
        }
        barrioFeatureGlobal = barrioFeature;

        const barrioLayer = L.geoJSON(barrioFeature, {
            style: {
                color: '#004080',
                weight: 3,
                fillOpacity: 0,
                dashArray: '6 6'
            }
        }).addTo(map);

        map.fitBounds(barrioLayer.getBounds());

        cargarRutasRecortadas(barrioFeature);
        cargarParaderosFiltrados(barrioFeature);
    })
    .catch(e => {
        alert('Error cargando polígono barrio: ' + e);
    });

function cargarRutasRecortadas(barrioFeature) {
    fetch(rutasZonalesURL)
        .then(res => res.json())
        .then(data => {
            const barrioPolygon = turf.feature(barrioFeature.geometry);
            const rutasRecortadas = [];

            data.features.forEach(ruta => {
                try {
                    const rutaFeature = turf.feature(ruta.geometry);
                    if (turf.booleanIntersects(barrioPolygon, rutaFeature)) {
                        const splitted = turf.lineSplit(rutaFeature, barrioPolygon);
                        splitted.features.forEach(lineSegment => {
                            const centroide = turf.centroid(lineSegment);
                            if (turf.booleanPointInPolygon(centroide, barrioPolygon)) {
                                lineSegment.properties = ruta.properties;
                                rutasRecortadas.push(lineSegment);
                            }
                        });
                    }
                } catch (e) {
                    console.warn('Error procesando ruta', e);
                }
            });

            L.geoJSON(rutasRecortadas, {
                style: {
                    color: '#00AA00',
                    weight: 3
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties && feature.properties.nombre_ruta) {
                        layer.bindPopup(`<strong>Ruta:</strong> ${feature.properties.nombre_ruta}`);
                    }
                }
            }).addTo(map);
        })
        .catch(e => {
            alert('Error cargando rutas zonales: ' + e);
        });
}

function cargarParaderosFiltrados(barrioFeature) {
    fetch('INSUMOS/Paraderos_Zonales_del_SITP.geojson')
        .then(res => res.json())
        .then(data => {
            const barrioPolygon = turf.feature(barrioFeature.geometry);
            const paraderosDentro = data.features.filter(f => {
                if (f.geometry && f.geometry.type === 'Point') {
                    return turf.booleanPointInPolygon(f, barrioPolygon);
                }
                return false;
            });

            L.geoJSON(paraderosDentro, {
                pointToLayer: (feature, latlng) => {
                    return L.marker(latlng, {
                        icon: L.icon({
                            iconUrl: 'https://cdn-icons-png.flaticon.com/512/252/252025.png',
                            iconSize: [30, 42],
                            iconAnchor: [15, 42],
                            popupAnchor: [0, -40]
                        })
                    });
                },
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let popupContent = `<div class="popup-image-placeholder">Espacio para imagen futura</div>`;
                        popupContent += `<strong>Barrio:</strong> ${barrioFeature.properties.nombre || 'N/D'}<br>`;
                        popupContent += `<strong>Dirección bandera:</strong> ${feature.properties.direccion_bandera || 'N/D'}<br>`;
                        popupContent += `<strong>Cenefa:</strong> ${feature.properties.cenefa || 'N/D'}<br>`;
                        popupContent += `<strong>Horario L-D:</strong> 6-4PM<br>`;
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
        })
        .catch(e => {
            alert('Error cargando archivo de paraderos: ' + e);
        });
}
