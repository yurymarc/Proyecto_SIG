// Token real de Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTQ4OWZjMi1hZTc0LTQwZTAtODM3MS00ODJmZjlkZWI4NTkiLCJpZCI6MzMxMzYwLCJpYXQiOjE3NTUwNDI1NjV9.tuXtvIQKeq0hz8Em6bpv3GctChxnN05tKnFKdS049GU';

// ==================== Crear el visor ====================
var viewer = new Cesium.Viewer("cesiumContainer", {
  imageryProvider: new Cesium.OpenStreetMapImageryProvider({
    url: "https://a.tile.openstreetmap.org/",
    credit: "© OpenStreetMap contributors"
  }),
  baseLayerPicker: false
});

// Centrar en Palermo Sur (Bogotá)
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(-74.125, 4.55, 3000.0)
});

const alturaPorPiso = 3;

// ==================== Cargar edificios extruidos ====================
async function loadPredios() {
  const predios = await Cesium.GeoJsonDataSource.load(
    'INSUMOS/CONST_PALERMO_SUR.geojson',
    { clampToGround: false }
  );
  viewer.dataSources.add(predios);

  predios.entities.values.forEach(e => {
    const pol = e.polygon;
    if (!pol) return;

    const props = e.properties || {};
    const pisos = props.CONNPISOS && !isNaN(+props.CONNPISOS.getValue?.())
      ? +props.CONNPISOS.getValue()
      : 2;

    const altura = pisos * alturaPorPiso;

    pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.9);
    pol.outline = true;
    pol.outlineColor = Cesium.Color.BLACK;

    pol.extrudedHeight = altura;
    pol.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
  });
}

// ==================== Cargar rutas y muñeco caminante ====================
async function loadWalkerFollowRoute() {
  const rutas = await Cesium.GeoJsonDataSource.load(
    'INSUMOS/RUTAS_GEO/RUTAS_Palermo_Sur_Ajustadas_2.geojson',
    { clampToGround: true }
  );
  viewer.dataSources.add(rutas);

  // Estilo de las rutas
  rutas.entities.values.forEach(e => {
    if (e.polyline) {
      e.polyline.material = Cesium.Color.RED;
      e.polyline.width = 3;
    }
  });

  const sampledPos = new Cesium.SampledPositionProperty();
  let currentTime = Cesium.JulianDate.now();
  const secondsStep = 2; // velocidad del muñeco

  rutas.entities.values.forEach(ruta => {
    if (!ruta.polyline) return;
    const positions = ruta.polyline.positions.getValue(Cesium.JulianDate.now());
    if (!positions) return;

    positions.forEach(pos => {
      sampledPos.addSample(currentTime, pos);
      currentTime = Cesium.JulianDate.addSeconds(currentTime, secondsStep, new Cesium.JulianDate());
    });
  });

  const start = Cesium.JulianDate.now();
  const stop = currentTime;
  viewer.clock.startTime = start.clone();
  viewer.clock.stopTime = stop.clone();
  viewer.clock.currentTime = start.clone();
  viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  viewer.clock.multiplier = 1;

  const walker = viewer.entities.add({
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({ start, stop })]),
    position: sampledPos,
    orientation: new Cesium.VelocityOrientationProperty(sampledPos),
    model: {
      uri: 'INSUMOS/Cesium_Man.glb',
      scale: 1.5,
      runAnimations: true
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.3,
        color: Cesium.Color.YELLOW
      }),
      width: 3
    }
  });

  viewer.trackedEntity = walker;
}

// ==================== Ejecutar funciones ====================
loadPredios();
loadWalkerFollowRoute();

// ==================== Vista inicial ====================
viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-74.11023496302883, 4.541232778615113, 1200),
  orientation: {
    heading: 0,
    pitch: Cesium.Math.toRadians(-45)
  }
});
