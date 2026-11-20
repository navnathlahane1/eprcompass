"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";


export default function MapSection({ officeLocations }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const L = require("leaflet");
    const locations = Array.isArray(officeLocations) && officeLocations.length > 0
      ? officeLocations
      : [];
    const center = locations[0].coordinates || DEFAULT_CENTER;
    const container = mapContainerRef.current;
    if (!container) return;

    // Extra guard for Fast Refresh/StrictMode where Leaflet may see stale state.
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const markerIcon = new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
      shadowSize: [41, 41],
    });

    const map = L.map(container, {
      center,
      zoom: 13,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    locations.forEach((loc) => {
      const marker = L.marker(loc.coordinates || DEFAULT_CENTER, { icon: markerIcon }).addTo(map);
      const popupHtml = loc.address
        ? `<strong>${loc.city}</strong><br/>${loc.address}`
        : `<strong>${loc.city}</strong>`;
      marker.bindPopup(popupHtml);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [officeLocations]);

  return (
    <div
      className="w-full h-[32rem] rounded-2xl overflow-hidden shadow-lg bg-white dark:bg-gray-900 z-0"
      style={{ position: "relative" }}
    >
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  );
}
