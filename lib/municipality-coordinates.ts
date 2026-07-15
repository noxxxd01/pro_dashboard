// Coordinates for Surigao del Norte municipalities.
// Bacuag, Mainit, and Malimono are area-weighted polygon centroids computed
// from official municipal boundary GeoJSON. The rest are approximate
// town-center estimates (good enough for province-scale marker placement,
// not survey-grade) pending boundary data for the remaining municipalities.
export const MUNICIPALITY_COORDINATES: Record<string, [number, number]> = {
  // District 1 (Siargao / Bucas Grande island group)
  Burgos: [9.7, 126.1667],
  Dapa: [9.7597, 126.0522],
  'Del Carmen': [9.8564, 125.9989],
  'General Luna': [9.7833, 126.1667],
  Pilar: [9.8931, 125.9764],
  'San Benito': [9.9575, 125.9578],
  'San Isidro': [9.6167, 126.1167],
  'Santa Monica': [9.8931, 126.0464],
  Socorro: [9.6167, 125.9667],

  // District 2 (mainland Surigao del Norte)
  Alegria: [9.6667, 125.5],
  Bacuag: [9.5711, 125.629],
  Claver: [9.5833, 125.8167],
  Gigaquit: [9.5667, 125.7],
  Mainit: [9.5646, 125.4995],
  Malimono: [9.5737, 125.4349],
  Placer: [9.6667, 125.5667],
  'San Francisco': [9.4667, 125.5333],
  'Surigao City': [9.7833, 125.4917],
  Sison: [9.3667, 125.5667],
  'Tagana-an': [9.6833, 125.5333],
  Tubod: [9.4167, 125.5333],
};
