'use client';

import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { MUNICIPALITY_COORDINATES } from '@/lib/municipality-coordinates';

interface ProjectCount {
  projectName: string;
  count: number;
}

interface MunicipalityData {
  municipality: string;
  count: number;
  projects: ProjectCount[];
}

interface ActivityMapLeafletProps {
  district1: MunicipalityData[];
  district2: MunicipalityData[];
}

const MIN_RADIUS = 8;
const MAX_RADIUS = 26;

function radiusFor(count: number, maxCount: number) {
  if (maxCount === 0) return MIN_RADIUS;
  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * (count / maxCount);
}

export default function ActivityMapLeaflet({
  district1,
  district2,
}: ActivityMapLeafletProps) {
  const municipalities = [
    ...district1.map((m) => ({ ...m, district: 'district1' as const })),
    ...district2.map((m) => ({ ...m, district: 'district2' as const })),
  ];

  const maxCount = Math.max(0, ...municipalities.map((m) => m.count));
  const bounds = Object.values(MUNICIPALITY_COORDINATES);

  return (
    <MapContainer
      bounds={bounds}
      boundsOptions={{ padding: [24, 24] }}
      className='h-96 w-full rounded-md'
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
      />
      {municipalities.map((m) => {
        const coords = MUNICIPALITY_COORDINATES[m.municipality];
        if (!coords) return null;

        const color =
          m.district === 'district1' ? 'var(--chart-2)' : 'var(--chart-1)';

        return (
          <CircleMarker
            key={m.municipality}
            center={coords}
            radius={radiusFor(m.count, maxCount)}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.6 }}
          >
            <Popup>
              <div className='flex flex-col gap-1 text-xs'>
                <span className='font-medium'>{m.municipality}</span>
                <span>
                  {m.count} completed{' '}
                  {m.count === 1 ? 'activity' : 'activities'}
                </span>
                {m.projects.length > 0 && (
                  <ul className='list-disc pl-4'>
                    {m.projects.map((p) => (
                      <li key={p.projectName}>
                        {p.projectName}: {p.count}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
