var geometry = 
    /* color: #d63000 */
    /* shown: false */
    /* displayProperties: [
      {
        "type": "rectangle"
      }
    ] */
    ee.Geometry.Polygon(
        [[[-7.074224136021883, 37.21440506353648],
          [-7.074224136021883, 36.97286823912673],
          [-6.626531264928133, 36.97286823912673],
          [-6.626531264928133, 37.21440506353648]]], null, false);

//var l8 = ee.ImageCollection("LANDSAT/LC08/C01/T1_SR");

// Function to cloud mask from the pixel_qa band of Landsat 8 SR data.
function maskL8sr(image) {
  // Bits 3 and 5 are cloud shadow and cloud, respectively.
  var cloudShadowBitMask = 1 << 3;
  var cloudsBitMask = 1 << 5;

  // Get the pixel QA band.
  var qa = image.select('pixel_qa');

  // Both flags should be set to zero, indicating clear conditions.
  var mask = qa.bitwiseAnd(cloudShadowBitMask).eq(0)
      .and(qa.bitwiseAnd(cloudsBitMask).eq(0));

  // Return the masked image, scaled to reflectance, without the QA bands.
  return image.updateMask(mask).divide(10000)
      .select("B[0-9]*")
      .copyProperties(image, ["system:time_start"]);
}

// Map the function over one year of data.
var collection = ee.ImageCollection('LANDSAT/LC08/C01/T1_SR')
    .filterDate('2020-01-01', '2020-01-31')
    .map(maskL8sr)

var composite = collection.median();

// Display the results.


// Get the median over time, in each band, in each pixel.
//var median = l8.filterDate('2020-01-01', '2020-12-31').median();
// Make a handy variable of visualization parameters.
var visParams = {bands: ['B6', 'B5', 'B4'], min: 100, max: 3500};

// Load or import the Hansen et al. forest change dataset.
var hansenImage = ee.Image('UMD/hansen/global_forest_change_2015');

// Select the land/water mask.
var datamask = hansenImage.select('datamask');

// Create a binary mask.
var mask = datamask.eq(1);
//var mask = datamask.eq(1);

// Update the composite mask with the water mask.
var maskedComposite = composite.updateMask(mask);
//Map.addLayer(maskedComposite, visParams, 'masked');


// Make a water image out of the mask.
var water = mask.not();
var land = mask.eq(1);

// Mask water with itself to mask all the zeros (non-water).
water = water.mask(water);
land = land.mask(land);

// Load the Sentinel-1 ImageCollection.
var sentinel1 = ee.ImageCollection('COPERNICUS/S1_GRD');

// Filter by metadata properties.
var vh_2020 = sentinel1
  // Filter to get images with VH polarization.
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
  // Filter to get images collected in interferometric wide swath mode.
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filterDate("2021-01-01","2021-01-07");

// Filter to get images from different look angles.
var vhAscending = vh_2020.filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'));
var vhDescending = vh_2020.filter(ee.Filter.eq('orbitProperties_pass', 'DESCENDING'));

var radar_2020 = vhAscending.select('VH').merge(vhDescending.select('VH')).max().mask(water);


// Map composite over the Channel
Map.centerObject(geometry, 12);
Map.addLayer(radar_2020, {min: -15, max: 0}, 'Radar Merge 2020');


composite = composite.mask(land);
Map.addLayer(composite, {bands: ['B5', 'B4', 'B3'], min: 0, max: 0.3}, 'Landsat composite');