//test l8 no clouds
 function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = (1 << 3);
  var cloudsBitMask = (1 << 5);
  // Get the pixel QA band.
  var qa = image.select('pixel_qa');
  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
                 .and(qa.bitwiseAnd(cloudsBitMask).eq(0));
  return image.updateMask(mask);
}

// Load Landsat 8 data

//var l7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_SR')
  //.filter(ee.Filter.or(
      //ee.Filter.and(ee.Filter.eq('WRS_PATH', 202),         
                    //ee.Filter.eq('WRS_ROW', 34)),
      //ee.Filter.and(ee.Filter.eq('WRS_PATH', 202), 
                    //ee.Filter.eq('WRS_ROW', 35))));
                    
var l5 = ee.ImageCollection('LANDSAT/LT05/C01/T1_SR')
  .select(['B1', 'B2', 'B3', 'B4', 'B5', 'B7', 'pixel_qa'], ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'pixel_qa'])
  //.rename(['B2', 'B3', 'B4', 'B5', 'B6', 'B7'])
  .filter(ee.Filter.or(
    ee.Filter.and(ee.Filter.eq('WRS_PATH', 202),         
                  ee.Filter.eq('WRS_ROW', 34))));
    //ee.Filter.and(ee.Filter.eq('WRS_PATH', 202), 
                  //ee.Filter.eq('WRS_ROW', 35))));

                  
var l8 = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
  .filter(ee.Filter.or(
      ee.Filter.and(ee.Filter.eq('WRS_PATH', 202),         
                    ee.Filter.eq('WRS_ROW', 34))));
      //ee.Filter.and(ee.Filter.eq('WRS_PATH', 202), 
                    //ee.Filter.eq('WRS_ROW', 35))));
                    
var merge = l8.merge(l5);

// Collection with all year data
var start = '2010-01-01';
var end = '2011-01-01';

//landsat collection es la escena de referencia
var landsatCollection = merge
                  .filterDate(start, end)
                  .map(maskL8sr)
                  .filterBounds(mosaico);
                  //.clip(mosaico);

/*var l7 = ee.ImageCollection('LANDSAT/LE07/C01/T1_TOA')
  
  .filterDate('1999-07-01', '2018-11-30')
  .filter(ee.Filter.lt('CLOUD_COVER', 20))
  .filter(ee.Filter.eq('WRS_PATH', 202))
  .filter(ee.Filter.eq('WRS_ROW', 34));
*/

// Compute the median in each band, each pixel.
// Band names are B1_median, B2_median, etc.

var ndwi = landsatCollection.map(function(image) {
  return image.select().addBands(image.normalizedDifference(['B5', 'B3']));
});

var max = ndwi.reduce(ee.Reducer.min());

var ndwiSum = ndwi.reduce(ee.Reducer.sum());

var ndwiMasked = max.updateMask(max.lte(0.1));

/*
var aewinsh = landsatCollection.map(function(image) {
  return image.select().expression(
    '4 * (RED - NIR) - (0.25 * RED + 2.75 * SWIR2)', {
      'NIR': image.select('B5'),
      'RED': image.select('B4'),
      'SWIR2': image.select('B7')
})});
*/

//var maxAewinsh = aewinsh.reduce(ee.Reducer.max());

//var aewiMasked = max.updateMask(max.gte(0));
//var maxAewi = aewiMasked.reduce(ee.Reducer.sum());

//var medianRGB = collection.reduce(ee.Reducer.median());

var vis = {min: -100, max: 100, palette: [
  '0000FF', 'F8ECE0', 'FCD163', '66A000', '207401',
  '056201', '004C00', '023B01', '012E01', '011301'
]};

var visaewi = {min: -5000, max: 5000, palette: [
  '0000FF', 'F8ECE0', 'FCD163', '66A000', '207401',
  '056201', '004C00', '023B01', '012E01', '011301'
]};

var ndwiViz = {min: -1, max: 1, palette: ['00FFFF', '0000FF']};
var ndwiMask = {min: 0,  max: 1, palette: ['00FFFF', '0000FF']};
// The output is an Image.  Add it to the map.
//var vis_param = {min: 0.05, max: 0.95, bands: ['B5_median', 'B4_median', 'B3_median'], 'vis':vis, gamma: 1.6};
Map.setCenter(-6.3355, 36.7924, 10);

//Map.addLayer(medianRGB,vis_param, 'RGB');
Map.addLayer(ndwiSum.clip(mosaico), vis, 'ndwi_sum');
Map.addLayer(max.clip(mosaico), ndwiViz, 'NDWI max');
Map.addLayer(ndwiMasked.clip(mosaico), ndwiMask, 'MAXSH');