import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapContainer, TileLayer, useMap, Popup, CircleMarker } from "react-leaflet";
import type { GeoStat } from "../api";

// Fix default marker icon issue in Leaflet + React
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface HeatmapLayerProps {
  data: GeoStat[];
}

function HeatmapLayer({ data }: HeatmapLayerProps) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    // Invalidate size in case container size changed
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    if (!map || !data.length) return;

    // Filter points with coordinates
    // We boost the intensity more aggressively for small numbers
    const points = data
      .filter((d) => d.latitude !== null && d.longitude !== null)
      .map((d) => [
        d.latitude as number, 
        d.longitude as number, 
        Math.max(50, d.totalCases * 100) // Much higher intensity for low numbers
      ]);

    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }

    if (points.length > 0) {
      // @ts-ignore - leaflet.heat adds heatLayer to L
      heatLayerRef.current = (L as any).heatLayer(points, {
        radius: 35,
        blur: 15,
        maxZoom: 10,
        max: 500, // Lower max makes points look hotter
        gradient: {
          0.1: "#3b82f6", // Blue
          0.3: "#22c55e", // Green
          0.6: "#eab308", // Yellow
          0.8: "#f97316", // Orange
          1.0: "#ef4444", // Red
        },
      }).addTo(map);

      // Fit map to points if there are any
      const bounds = L.latLngBounds(points.map(p => [p[0], p[1]] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, data]);

  return (
    <>
      {data
        .filter((d) => d.latitude !== null && d.longitude !== null)
        .map((d, idx) => (
          <CircleMarker
            key={`${d.district}-${idx}`}
            center={[d.latitude!, d.longitude!]}
            radius={8}
            pathOptions={{ 
                fillColor: '#000', 
                fillOpacity: 0.1, 
                color: '#fff', 
                weight: 1 
            }}
          >
            <Popup>
              <div className="p-1">
                <h4 className="font-bold border-b pb-1 mb-1">{d.district}</h4>
                <div className="text-xs space-y-1">
                  <p className="flex justify-between gap-4"><span>Cases:</span> <span className="font-semibold text-red-600">{d.totalCases}</span></p>
                  <p className="flex justify-between gap-4"><span>Deaths:</span> <span className="font-semibold">{d.totalDeaths}</span></p>
                  <p className="flex justify-between gap-4"><span>Reports:</span> <span className="font-semibold">{d.reportCount}</span></p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
    </>
  );
}

export function Heatmap({ data }: HeatmapLayerProps) {
  // Ethiopia center
  const center: [number, number] = [9.145, 40.4896];

  if (!data?.length) {
    return (
      <div className="h-[600px] w-full rounded-xl border bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 font-medium italic">No regional data available to visualize</div>
      </div>
    );
  }

  return (
    <div className="h-[600px] w-full rounded-xl overflow-hidden border shadow-inner bg-slate-50 relative z-0">
      <MapContainer
        center={center}
        zoom={6}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <HeatmapLayer data={data} />
      </MapContainer>
    </div>
  );
}
