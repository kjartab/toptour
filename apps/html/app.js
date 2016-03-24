
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

    viewer.scene.globe.depthTestAgainstTerrain = true;
// addWmts();

function addWms() {

    // var wmsLayer = new Cesium.ImageryLayer(new Cesium.WebMapServiceImageryProvider({
    //             parameters : {TRANSPARENT: true, format:'png'},
    //             url: 'http://gridwms.nve.no/wms_server/wms_server.aspx',
    //             layers: 'sdfsw'
    //         }));
    // viewer.scene.imageryLay ers.add(wmsLayer);
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

function addHeights(geojson, callback) {

    var positions = _.map(geojson.coordinates, function(pos) {
        return Cesium.Cartographic.fromDegrees(pos[0], pos[1]);
    });

    var promise = Cesium.sampleTerrain(cesiumTerrainProvider, 11, positions);
    Cesium.when(promise, function(updatedPositions) {
            geojson.coordinates = _.map(updatedPositions, function(pos) {
                return [ Cesium.Math.toDegrees(pos.longitude), Cesium.Math.toDegrees(pos.latitude), pos.height+20];
            });

        callback(geojson);
    });

}

function addGeoJson(geojson) {
    
    addHeights(geojson, function(geojson) {
            data = viewer.dataSources.add(Cesium.GeoJsonDataSource.load(geojson, {
                stroke: Cesium.Color.HOTPINK,
                fill: Cesium.Color.PINK,
                strokeWidth: 3,
                markerSymbol: '?'
            }));
        });
}



// var promise = Cesium.sampleTerrain(cesiumTerrainProvider, 11, positions);
// Cesium.when(promise, function(updatedPositions) {
//     // positions[0].height and positions[1].height have been updated.
//     // updatedPositions is just a reference to positions.
//     console.log(updatedPositions);
// });


function removeWms(id) {
    // viewer.getLayers(id).remove();
    console.log("removing " + id);
}


function removeWmts(id) {
    // viewer.getLayers(id).remove();
    console.log("removing " + id);
}
