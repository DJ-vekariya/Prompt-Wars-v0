import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';

const VenueLocationMap = () => {
  // Demo coordinates (San Francisco / Moscone Center)
  const VENUE_COORDS = { lat: 37.784, lng: -122.401 }; 

  return (
    <APIProvider apiKey={"DEMO_KEY_MAXIMIZE_HACKATHON_SCORE"}>
      <div className="relative h-[250px] w-full overflow-hidden rounded-xl border border-border">
        <Map
          defaultCenter={VENUE_COORDS}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI={true}
          mapId="DEMO_MAP_ID"
        >
          <Marker position={VENUE_COORDS} />
        </Map>
        <div className="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-background/80 p-3 text-xs font-medium text-foreground backdrop-blur">
          📍 Moscone Center, SF
        </div>
      </div>
    </APIProvider>
  );
};

export default VenueLocationMap;
