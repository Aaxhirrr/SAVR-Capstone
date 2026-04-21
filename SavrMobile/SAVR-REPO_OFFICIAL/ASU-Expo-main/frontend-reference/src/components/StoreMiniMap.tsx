import { useEffect, useRef } from 'react';
// import type { GeoJSON } from 'geojson';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type Coordinate = { lat: number; lon: number };

interface StoreMiniMapProps {
  origin: Coordinate | null;
  destination: Coordinate | null;
  route?: GeoJSON.LineString | null;
  token?: string | null;
  fallbackSrc?: string;
  alt?: string;
}

const ENV_TOKEN = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
const MAP_STYLE = 'mapbox://styles/mapbox/streets-v12';

export default function StoreMiniMap({
  origin,
  destination,
  route,
  token,
  fallbackSrc = '/assets/store-placeholder.png',
  alt = 'Store map',
}: StoreMiniMapProps) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const effectiveToken = token || ENV_TOKEN;

  useEffect(() => {
    if (!mapNode.current || !origin || !destination || !effectiveToken) {
      return;
    }

    mapboxgl.accessToken = effectiveToken;

    const map = new mapboxgl.Map({
      container: mapNode.current,
      style: MAP_STYLE,
      center: [(origin.lon + destination.lon) / 2, (origin.lat + destination.lat) / 2],
      zoom: 12,
      interactive: false,
      attributionControl: false,
      preserveDrawingBuffer: false,
    });

    map.on('load', () => {
      const geometry: GeoJSON.LineString =
        route && route.type === 'LineString' && Array.isArray(route.coordinates) && route.coordinates.length
          ? route
          : {
              type: 'LineString',
              coordinates: [
                [origin.lon, origin.lat],
                [destination.lon, destination.lat],
              ],
            };

      const routeFeature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry,
        properties: {},
      };

      map.addSource('store-route', {
        type: 'geojson',
        data: routeFeature,
      });

      map.addLayer({
        id: 'store-route-line',
        type: 'line',
        source: 'store-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#0E8072',
          'line-width': 3,
          'line-opacity': 0.85,
        },
      });

      new mapboxgl.Marker({ color: '#16a34a' })
        .setLngLat([origin.lon, origin.lat])
        .addTo(map);
      new mapboxgl.Marker({ color: '#f97316' })
        .setLngLat([destination.lon, destination.lat])
        .addTo(map);

      const bounds = new mapboxgl.LngLatBounds();
      geometry.coordinates.forEach(([lng, lat]) => bounds.extend([lng, lat]));
      if (bounds.isEmpty()) {
        bounds.extend([origin.lon, origin.lat]);
        bounds.extend([destination.lon, destination.lat]);
      }

      map.fitBounds(bounds, {
        padding: 24,
        maxZoom: 15,
        duration: 0,
      });
    });

    mapRef.current = map;
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [origin, destination, route, effectiveToken]);

  if (!effectiveToken || !origin || !destination) {
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className="h-full w-full object-cover"
        loading="lazy"
      />
    );
  }

  return <div ref={mapNode} className="h-full w-full" />;
}


