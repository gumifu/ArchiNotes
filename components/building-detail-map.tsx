"use client";

import { AdvancedMarker, APIProvider, Map } from "@vis.gl/react-google-maps";

const DEFAULT_MAP_ID = "DEMO_MAP_ID";

type Props = {
  lat: number;
  lng: number;
  name: string;
};

export function BuildingDetailMap({ lat, lng, name }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return (
      <div className="bg-muted text-muted-foreground flex h-[200px] items-center justify-center rounded-lg text-sm">
        Map (API key required)
      </div>
    );
  }
  return (
    <div className="h-[200px] w-full overflow-hidden rounded-lg">
      <APIProvider apiKey={apiKey}>
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_MAP_ID}
          defaultCenter={{ lat, lng }}
          defaultZoom={16}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: "100%", height: "100%" }}
        >
          <AdvancedMarker position={{ lat, lng }} title={name} />
        </Map>
      </APIProvider>
    </div>
  );
}
