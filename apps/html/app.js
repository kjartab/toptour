
var viewer = new Cesium.Viewer('map', config);


var imageryLayers = viewer.imageryLayers;

function addWmts() {
    var url='http://gridwms.nve.no/wms_server/wms_server.aspx?request=getcapabilities&srs=4326'; //Geoserver URL
    var layers = viewer.scene.globe.imageryLayers;
        layers.removeAll();
        layers.addImageryProvider(new Cesium.WebMapServiceImageryProvider({
            url : url,        
            layers: 'GIS_Demo'// Here just give layer name
        }));
}

// addWmts();

function addWms() {

    var wmsLayer = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider({
                parameters : {TRANSPARENT: true, format:'png'},
                url: 'http://gridwms.nve.no/wms_server/wms_server.aspx',
                layers: 'sdfsw'
            }));
    viewer.scene.imageryLayers.add(wmsLayer);
}
// addWms();

    
// Add the terrain provider (AGI)
var cesiumTerrainProvider = new Cesium.CesiumTerrainProvider({
    url : '//assets.agi.com/stk-terrain/world',
    requestVertexNormals : true,
    requestWaterMask: false
});
viewer.terrainProvider = cesiumTerrainProvider;

var data;

function addGeoJson(geojson) {

    data = viewer.dataSources.add(Cesium.GeoJsonDataSource.load(geojson, {
        stroke: Cesium.Color.HOTPINK,
        fill: Cesium.Color.PINK,
        strokeWidth: 3,
        markerSymbol: '?'
    }));
} 

function dd(positions) {

    var promise = Cesium.sampleTerrain(cesiumTerrainProvider, 11, positions);
    Cesium.when(promise, function(updatedPositions) {
        // positions[0].height and positions[1].height have been updated.
        // updatedPositions is just a reference to positions.
    });
}

function removeWms(id) {
    // viewer.getLayers(id).remove();
    console.log("removing " + id);
}


function removeWmts(id) {
    // viewer.getLayers(id).remove();
    console.log("removing " + id);
}
