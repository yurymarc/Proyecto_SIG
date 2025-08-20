// Token de Cesium
Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJiZTQ4OWZjMi1hZTc0LTQwZTAtODM3MS00ODJmZjlkZWI4NTkiLCJpZCI6MzMxMzYwLCJpYXQiOjE3NTUwNDI1NjV9.tuXtvIQKeq0hz8Em6bpv3GctChxnN05tKnFKdS049GU';

// Inicializar el visor de Cesium
const viewer = new Cesium.Viewer('cesiumContainer', {
    sceneMode: Cesium.SceneMode.SCENE3D,
    baseLayerPicker: true,
    timeline: true,
    animation: true,
    homeButton: true,
    navigationHelpButton: true,
    infoBox: false,
    selectionIndicator: false
});

const alturaPorPiso = 3;

// Cargar edificios extruidos
async function loadPredios() {
    try {
        const predios = await Cesium.GeoJsonDataSource.load('INSUMOS/CONST_PALERMO_SUR.geojson', {
            clampToGround: false
        });
        viewer.dataSources.add(predios);

        predios.entities.values.forEach(e => {
            const pol = e.polygon;
            if (!pol) return;

            const props = e.properties || {};
            const pisos = props.CONNPISOS && !isNaN(+props.CONNPISOS.getValue?.()) ? +props.CONNPISOS.getValue() : 2;
            const altura = pisos * alturaPorPiso;

            pol.material = Cesium.Color.fromCssColorString("#7a8a50").withAlpha(0.9);
            pol.outline = true;
            pol.outlineColor = Cesium.Color.BLACK;
            pol.extrudedHeight = altura;
            pol.extrudedHeightReference = Cesium.HeightReference.RELATIVE_TO_GROUND;
        });
    } catch (error) {
        console.error("Error al cargar los predios:", error);
    }
}

// Cargar rutas y muñeco caminante
async function loadWalkerFollowRoute() {
    try {
        const rutas = await Cesium.GeoJsonDataSource.load('INSUMOS/RUTAS_GEO/RUTAS.geojson', {
            clampToGround: true
        });
        viewer.dataSources.add(rutas);

        // Dibujar rutas
        rutas.entities.values.forEach(e => {
            if (e.polyline) {
                e.polyline.material = Cesium.Color.RED;
                e.polyline.width = 3;
            }
        });

        const sampledPos = new Cesium.SampledPositionProperty();
        let currentTime = Cesium.JulianDate.now();
        const secondsStep = 1;

        for (const ruta of rutas.entities.values) {
            let coords = [];
            if (ruta.polyline && ruta.polyline.positions) {
                coords = ruta.polyline.positions.getValue(currentTime);
            } else if (ruta.geometry?.type === "LineString") {
                coords = ruta.geometry.coordinates;
            }

            if (!coords || coords.length === 0) continue;

            for (const pos of coords) {
                const cart = Array.isArray(pos) ?
                    Cesium.Cartesian3.fromDegrees(pos[0], pos[1], pos[2] || 0) :
                    pos;
                sampledPos.addSample(currentTime, cart);
                currentTime = Cesium.JulianDate.addSeconds(currentTime, secondsStep, new Cesium.JulianDate());
            }
        }

        // Crear muñeco
        const walker = viewer.entities.add({
            position: sampledPos,
            orientation: new Cesium.VelocityOrientationProperty(sampledPos),
            model: {
                uri: 'INSUMOS/Cesium_Man.glb', // Aquí se carga el modelo del muñeco
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

    } catch (error) {
        console.error("Error al cargar las rutas o el caminante:", error);
    }
}

// Ejecutar funciones de carga
loadPredios();
loadWalkerFollowRoute();

// Vista inicial
viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(-74.11023496302883, 4.541232778615113, 1200),
    orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45)
    }
});