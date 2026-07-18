mapboxgl.accessToken = mapToken;

const coordinates = listing?.geometry?.coordinates;
const mapContainer = document.getElementById("map");

if (mapContainer && Array.isArray(coordinates) && coordinates.length === 2) {
    const map = new mapboxgl.Map({
        container: "map",
        style: "mapbox://styles/mapbox/standard-satellite",
        projection: "globe",
        zoom: 12,
        center: coordinates,
    });

    const marker = new mapboxgl.Marker({ color: "black" })
        .setLngLat(coordinates)
        .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
                <h4>${listing.title}</h4>
                <p>Exact location provided after booking</p>
            `)
        )
        .addTo(map);
} else {
    console.warn("Listing coordinates are missing or invalid.");
    if (mapContainer) {
        mapContainer.innerHTML = "<div class='alert alert-secondary mt-2'>Location map is unavailable for this listing.</div>";
    }
}