var geometry2 = /* color: #98ff00 */ee.Geometry.Point([-6.30287513732901, 37.441115780341605]);

var landsat = ee.ImageCollection("LANDSAT/LC08/C01/T1")
    .filterDate('2016-01-01', '2017-01-01')
    .filterBounds(geometry2)
    
var ndvi = landsat.map(function(image) {
  var result = image.normalizedDifference(["B5", "B4"]).rename("ndvi")
  return image.addBands(result);
})

var maxNDVI = ndvi.max().select("ndvi");

// The region over which to gather stats.
var region = geometry2.buffer(30000)

// Create zones from each 200m of elevation.
var elevation = ee.Image("USGS/SRTMGL1_003")
var zones = ee.Image.constant(1)
    .where(maxNDVI.gt(0.1), 1)
    .where(maxNDVI.gt(0.2), 2)
    .where(maxNDVI.gt(0.3), 3)
    .updateMask(elevation.neq(0))
    .clip(region)
    
// Create zones from each 200m of elevation.
var elevation_reclass = ee.Image(0)
    .where(elevation.gt(5), 1)
    .where(elevation.gt(10), 2)
    .where(elevation.gt(100), 3)
    .where(elevation.gt(500), 4)
    .where(elevation.gt(1000), 5)
    .updateMask(elevation.neq(0))
    .clip(geometry2.buffer(75000))

Map.addLayer(maxNDVI, {min:0, max:1}, "Max NDVI")
//Map.addLayer(region, {color: "yellow"}, "Region")
Map.addLayer(elevation_reclass, {palette: ['cyan', 'green', 'orange', 'brown', 'purple']}, "Elevation zones")
Map.addLayer(zones, {palette: ['white', 'green']}, "Elevation zones")
Map.centerObject(geometry2, 10)

var stats = elevation.addBands(zones).reduceRegion({
  reducer: ee.Reducer.mean().group(1),
  geometry: region,
  scale: 30,
  maxPixels: 1e11
})
print(stats)
Map.centerObject(geometry2, 10)