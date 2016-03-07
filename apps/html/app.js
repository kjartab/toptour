
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
addWms();

function removeWms(id) {
    // viewer.getLayers(id).remove();
    console.log("removing " + id);
}


function removeWmts(id) {
    // viewer.getLayers(id).remove();
    console.log("removing " + id);

}
