// === Tarifas oficiales CDMX ===
export const BASE_FARE = 9.19;
export const PER_KM = 5.84;
export const PER_MIN = 1.95;
export const SURGE_MULTIPLIER = 1;
export const MIN_FARE = 30;
export const ROUND_TO = 1;

// Conversores
export function metersToKm(meters) {
  return (meters || 0) / 1000;
}
export function secondsToMinutes(seconds) {
  return (seconds || 0) / 60;
}

// Cálculo principal
export function calculateFareFromMetersSeconds(meters, seconds, opts = {}) {
  const {
    baseFare = BASE_FARE,
    perKm = PER_KM,
    perMin = PER_MIN,
    surge = SURGE_MULTIPLIER,
    minFare = MIN_FARE,
    roundTo = ROUND_TO,
  } = opts;

  const km = metersToKm(meters);
  const minutes = secondsToMinutes(seconds);

  const raw = (baseFare + (perKm * km) + (perMin * minutes)) * surge;

  const rounded = Math.round(raw / roundTo) * roundTo;
  const fare = Math.max(minFare, rounded);

  return {
    fare,
    breakdown: {
      baseFare,
      perKm,
      perMin,
      km: Number(km.toFixed(3)),
      minutes: Number(minutes.toFixed(2)),
      surge,
      raw: Number(raw.toFixed(2)),
      rounded: Number(rounded.toFixed(2)),
      minFare,
    }
  };
}
