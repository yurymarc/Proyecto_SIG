Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxYTE1ODFiZS05OTNhLTQ2ZDMtYWQyZi0yNDIyMDc1MjFiZWEiLCJpZCI6MzMxMzE4LCJpYXQiOjE3NTUwMjU4NTd9.mRc9Kqm3aGWap7lYt4nQcw2UKRFlVFNYFwPelgX1L_M';

const viewer = new Cesium.Viewer('cesiumContainer', {
  sceneMode: Cesium.SceneMode.SCENE3D,
  baseLayerPicker: true,
  timeline: false,
  animation: false,
  homeButton: true,
  navigationHelpButton: true,
  infoBox: false,
  selectionIndicator: false
});

const alturaPorPiso = 3; // metros por piso

async function loadGeoJSON() {
  try {
    const predios = await Cesium.GeoJsonDataSource.load('INSUMOS/CONST_PALERMO_SUR.geojson', {
      clampToGround: false
    });
    viewer.dataSources.add(predios);

    predios.entities.values.forEach(e => {
      const pol = e.polygon;
      if (!pol) return;
      const props = e.properties || {};
      const pisos = props.CONNPISOS && !isNaN(+props.CONNPISOS.getValue?.())
                    ? +props.CONNPISOS.getValue()
                    : 2; // fallback 2 pisos
      const altura = pisos * alturaPorPiso;

      pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.9);
      pol.outline = true;
      pol.outlineColor = Cesium.Color.BLACK;

      pol.heightReference = Cesium.HeightReference.CLAMP_TO_GROUND;
      pol.extrudedHeight = altura;
      pol.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
    });

    viewer.flyTo(predios);
    console.log("GeoJSON cargado y extruido correctamente");
  } catch (err) {
    console.error("Error cargando GeoJSON:", err);
  }
}

loadGeoJSON();

viewer.camera.flyTo({
  destination: Cesium.Cartesian3.fromDegrees(-74.11023496302883, 4.541232778615113, 1200),
  orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45) }
});
