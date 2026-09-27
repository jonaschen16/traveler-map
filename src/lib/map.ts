// Center the map on a point in the part of the map not covered by the panel:
// the 400px side panel on desktop, the bottom sheet (60% height) on phones.
export function centerBesidePanel(map: google.maps.Map, latLng: google.maps.LatLngLiteral) {
  map.setCenter(latLng);
  if (window.innerWidth >= 640) map.panBy(-200, 0);
  else map.panBy(0, window.innerHeight * 0.25);
}
