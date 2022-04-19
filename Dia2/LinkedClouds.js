// Display a grid of linked maps, each with a different visualization.
var newclouds = ee.ImageCollection("COPERNICUS/S2_CLOUD_PROBABILITY")
  .filterDate('2018-05-01', '2018-05-05');

var s2sr = ee.ImageCollection("COPERNICUS/S2_SR")
  .select(['MSK_CLDPRB'])
  .filterDate('2018-05-01', '2018-05-05');

function greater(image) {
  var mask = image.gte(50)
  
  return image.updateMask(mask).eq(0)
}
  
var nclouds = newclouds.map(greater);
var srclouds = s2sr.map(greater);


function maskS2clouds(image) {
  var qa = image.select('QA60');

  // Bits 10 and 11 are clouds and cirrus, respectively.
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudBitMask).neq(0)
      //.and(qa.bitwiseAnd(cirrusBitMask).eq(0));

  return mask.updateMask(mask);
}

var s2 = ee.ImageCollection('COPERNICUS/S2')
                  .filterDate('2018-05-01', '2018-05-05')
                  //.map(maskS2clouds);
                  
//var q60 = s2.first().select(['QA60']);
//var q60_mask = q60.eq(1)

var q60_clouds = s2.map(maskS2clouds);

var rgbVis = {
  min: 0.0,
  max: 5000,
  bands: ['B4', 'B3', 'B2'],
};


//Creación y linkeo entre mapas
var PanelMapas = [];
//Object.keys(ComposicionesRGB).forEach(function(name) {
var Map1 = ui.Map();
Map1.add(ui.Label('New Clouds Probability'));
Map1.addLayer(s2, rgbVis, 'S2 Image');
Map1.addLayer(nclouds, {'min':0, 'max':100, 'palette':['yellow']}, 'New_Cloud Prob');
Map1.setControlVisibility(false);
PanelMapas.push(Map1);

var Map2 = ui.Map();
Map2.add(ui.Label('Surface Reflectance Clouds'));
Map2.addLayer(s2, rgbVis, 'S2 Image');
Map2.addLayer(srclouds, {'min':0, 'max':100, 'palette':['red']}, 'SR Clouds');
Map2.setControlVisibility(false);
PanelMapas.push(Map2);

var Map3 = ui.Map();
Map3.add(ui.Label('S2 TOA Image Masked'));
Map3.addLayer(s2, rgbVis, 'S2 Image');
Map3.addLayer(q60_clouds, {'palette':['blue']}, 'TOA Q60 Mask');
Map3.setControlVisibility(false);
PanelMapas.push(Map3);

var Map4 = ui.Map();
Map4.add(ui.Label('S2 Image'));
Map4.addLayer(s2, rgbVis, 'S2 Image');
Map4.setControlVisibility(false);
PanelMapas.push(Map4);

var linker = ui.Map.Linker(PanelMapas);

//Configuración de la posición de los 4 mapas sobre la vista
var mapGrid = ui.Panel([
      ui.Panel([PanelMapas[0]], null, {stretch: 'both'}),
      ui.Panel([PanelMapas[1]], null, {stretch: 'both'}),
      ui.Panel([PanelMapas[2]], null, {stretch: 'both'}),
      ui.Panel([PanelMapas[3]], null, {stretch: 'both'}),],
      ui.Panel.Layout.Flow('horizontal'), {stretch: 'both'});


// Controladores de título y escala-zoom para el primer mapa
PanelMapas[0].setControlVisibility({zoomControl: true});
PanelMapas[0].setControlVisibility({scaleControl: true});
var Titulo = ui.Label('Clouds Compare Sentinel 2', {
  stretch: 'horizontal',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '15 px'});


// Centrado del mapa en localización y carga de títulos y mapas en vertical
PanelMapas[0].setCenter(-16.4695, 28.28,  10);
ui.root.widgets().reset([Titulo, mapGrid]);
ui.root.setLayout(ui.Panel.Layout.Flow('vertical'));