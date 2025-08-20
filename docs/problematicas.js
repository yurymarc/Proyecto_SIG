// Problemas del barrio
const problemas = [
  { titulo: "Inseguridad", descripcion: "Robos y violencia en locales y personas preocupan a la comunidad." },
  { titulo: "Violencia", descripcion: "Casos de violencia intrafamiliar y acoso en colegios." },
  { titulo: "Urbanización ilegal", descripcion: "Zonas invadidas de alto riesgo afectan servicios básicos." },
  { titulo: "Pobreza", descripcion: "Falta de acceso a servicios y hacinamiento en viviendas." },
  { titulo: "Conflictos sociales", descripcion: "Agresiones entre grupos y altos casos de homicidio." }
];

// Generar tarjetas dinámicamente
const container = document.getElementById('cards-container');
problemas.forEach(p => {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <div class="card-inner">
      <div class="card-front">${p.titulo}</div>
      <div class="card-back">${p.descripcion}</div>
    </div>
  `;
  container.appendChild(card);
});

// Inicializar mapa
const map = L.map('map');

// Capa base OSM
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// --- Agregar título centrado al mapa ---
const mapTitle = L.control({position: 'topright'});
mapTitle.onAdd = function(map) {
  const div = L.DomUtil.create('div', 'map-title');
  div.style.background = 'rgba(255,255,255,0.8)';
  div.style.padding = '6px 12px';
  div.style.borderRadius = '8px';
  div.style.fontWeight = 'bold';
  div.style.fontSize = '16px';
  div.style.textAlign = 'center';
  div.style.pointerEvents = 'none';
  div.innerHTML = "Concentración PM10";
  return div;
};
mapTitle.addTo(map);

// Función para asignar color según PM10
function getPM10Color(pm) {
  return pm > 45 ? '#800026' :
         pm > 40 ? '#BD0026' :
         pm > 35 ? '#E31A1C' :
         pm > 30 ? '#FC4E2A' :
         pm > 25 ? '#FD8D3C' :
         pm > 20 ? '#FEB24C' :
         pm > 15 ? '#FED976' :
                   '#FFEDA0';
}

// Cargar polígono del barrio
fetch("INSUMOS/Pol_Barrio.geojson")
  .then(res => res.json())
  .then(barrioGeoJSON => {

    // Polígono solo borde
    const barrioLayer = L.geoJSON(barrioGeoJSON, {
      style: { color: "#003366", weight: 3, fillOpacity: 0 }
    }).addTo(map);

    map.fitBounds(barrioLayer.getBounds());

    // Cargar PM10
    fetch("INSUMOS/PM10.geojson")
      .then(res => res.json())
      .then(pmData => {

        // Filtrar celdas que intersectan con el barrio
        const celdasBarrio = pmData.features.filter(f => {
          try {
            return turf.booleanIntersects(f, barrioGeoJSON.features[0]);
          } catch {
            return false;
          }
        });

        // Calcular promedio PM10 del barrio
        const sumaPM = celdasBarrio.reduce((acc,f) => acc + f.properties.conc_pm10, 0);
        const promPM = celdasBarrio.length ? sumaPM / celdasBarrio.length : 0;

        // Polígono barrio con relleno según promedio
        L.geoJSON(barrioGeoJSON, {
          style: {
            color: "#003366",
            weight: 3,
            fillColor: getPM10Color(promPM),
            fillOpacity: 0.4
          },
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(`PM10 promedio: ${promPM.toFixed(1)} μg/m³`, {sticky:true});
          }
        }).addTo(map);

        // Celdas PM10 individuales
        L.geoJSON(celdasBarrio, {
          style: feature => ({
            fillColor: getPM10Color(feature.properties.conc_pm10),
            color: '#555',
            weight: 0.5,
            fillOpacity: 0.7
          }),
          onEachFeature: (feature, layer) => {
            layer.bindTooltip(
              `PM10: ${feature.properties.conc_pm10} μg/m³`,
              {sticky: true, direction: 'top'}
            );
          }
        }).addTo(map);

        // Leyenda
        const legend = L.control({position: 'bottomright'});
        legend.onAdd = function(map) {
          const div = L.DomUtil.create('div', 'info legend');
          div.style.background = 'rgba(255,255,255,0.9)';
          div.style.padding = '10px';
          div.style.borderRadius = '8px';
          div.innerHTML = '<b>PM10 μg/m³</b><br>';

          const ranges = [0, 15, 20, 25, 30, 35, 40, 45];
          for (let i = 0; i < ranges.length; i++) {
            const from = ranges[i];
            const to = ranges[i + 1];
            if (to) {
              div.innerHTML +=
                `<i style="background:${getPM10Color(from + 1)};width:18px;height:18px;display:inline-block;margin-right:6px;"></i> ${from} &ndash; ${to}<br>`;
            } else {
              div.innerHTML +=
                `<i style="background:${getPM10Color(from + 1)};width:18px;height:18px;display:inline-block;margin-right:6px;"></i> ${from}+<br>`;
            }
          }
          div.innerHTML += `<hr><i style="background:${getPM10Color(promPM)};width:18px;height:18px;display:inline-block;margin-right:6px;"></i> PM10 promedio barrio`;
          return div;
        };
        legend.addTo(map);

      })
      .catch(err => console.error("Error cargando PM10:", err));

  })
  .catch(err => console.error("Error cargando polígono:", err));
