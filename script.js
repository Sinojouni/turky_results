const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
});

const esriLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
  attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
  maxZoom: 19
});

const map = L.map('map', {
  center: [33.15, 35.43],
  zoom: 15,
  layers: [osmLayer]
});

let currentBaseLayer = 'osm';

document.getElementById('toggleBasemap').addEventListener('click', () => {
  if (currentBaseLayer === 'esri') {
    map.removeLayer(esriLayer);
    map.addLayer(osmLayer);
    currentBaseLayer = 'osm';
  } else {
    map.removeLayer(osmLayer);
    map.addLayer(esriLayer);
    currentBaseLayer = 'esri';
  }
});

let overlay;
let slider = document.getElementById("slider");
let thresholdValue = document.getElementById("thresholdValue");

Promise.all([
  fetch('https://sinojhony.pythonanywhere.com/bounds').then(res => res.json()),
  fetch('https://sinojhony.pythonanywhere.com/minmax').then(res => res.json())
]).then(([bounds, minmax]) => {
  const imageBounds = [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east]
  ];
  map.fitBounds(imageBounds);

  slider.min = minmax.min;
  slider.max = minmax.max;
  slider.step = 0.1;
  slider.value = (parseFloat(minmax.min) + parseFloat(minmax.max)) / 2;
  thresholdValue.innerText = parseFloat(slider.value).toFixed(2);

  updateOverlay(slider.value, imageBounds);

  slider.addEventListener("input", () => {
    thresholdValue.innerText = parseFloat(slider.value).toFixed(2);
    updateOverlay(slider.value, imageBounds);
  });

});

function updateOverlay(threshold, bounds) {
  if (overlay) {
    map.removeLayer(overlay);
  }
  const overlayUrl = `https://sinojhony.pythonanywhere.com/overlay?threshold=${threshold}`;
  overlay = L.imageOverlay(overlayUrl, bounds, { opacity: 0.5 }).addTo(map);
}

let groundTruthLayer;
let groundTruthVisible = false;

const toggleGTButton = document.getElementById('toggle-gt');
toggleGTButton.addEventListener('click', () => {
    if (!groundTruthLayer) {
        // Load KML only once
        groundTruthLayer = omnivore.kml('static/gt.kml')
            .on('ready', function () {
                this.eachLayer(function(layer) {
                    layer.setStyle({
                        color: 'blue',
                        weight: 2,
                        opacity: 0.8
                    });
                });
                map.addLayer(groundTruthLayer);
                groundTruthVisible = true;
            });
    } else {
        if (groundTruthVisible) {
            map.removeLayer(groundTruthLayer);
        } else {
            map.addLayer(groundTruthLayer);
        }
        groundTruthVisible = !groundTruthVisible;
    }
});

