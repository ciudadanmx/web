import { calculateFareFromMetersSeconds } from './fare';

export function getRouteAndFareUsingDirections(directionsService, origin, destination, fareOpts = {}) {
  return new Promise((resolve, reject) => {
    if (!directionsService) return reject(new Error('No directionsService disponible'));
    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result && result.routes && result.routes.length) {
          try {
            const leg = result.routes[0].legs[0];
            const distanceMeters = leg.distance.value; // metros
            const durationSeconds = leg.duration.value; // segundos
            const fareResult = calculateFareFromMetersSeconds(distanceMeters, durationSeconds, fareOpts);
            resolve({
              distanceMeters,
              durationSeconds,
              directions: result,
              fare: fareResult.fare,
              breakdown: fareResult.breakdown,
            });
          } catch (err) {
            reject(err);
          }
        } else {
          return reject(new Error('Directions API error: ' + status));
        }
      }
    );
  });
}