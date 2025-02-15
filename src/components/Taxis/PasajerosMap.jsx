if (googleMapsLoaded && window.google) {
    const mapInstance = new window.google.maps.Map(document.getElementById('map'), {
      center: fromCoordinates,
      zoom: 17,
    });

    const fromMarker = new window.google.maps.Marker({
      map: mapInstance,
      position: fromCoordinates,
    });

    const toMarker = new window.google.maps.Marker({
      map: mapInstance,
      position: toCoordinates,
    });

    window.google.maps.event.addListener(mapInstance, 'click', (event) => {
      const { latLng } = event;
      const newLat = latLng.lat();
      const newLng = latLng.lng();

      setFromCoordinates({ lat: newLat, lng: newLng });
      setToCoordinates({ lat: newLat, lng: newLng });
      setFromMarkerPosition({ lat: newLat, lng: newLng });
      setToMarkerPosition({ lat: newLat, lng: newLng });

      fromMarker.setPosition({ lat: newLat, lng: newLng });
      toMarker.setPosition({ lat: newLat, lng: newLng });
    });

    // Usamos el helper para inicializar el Autocomplete en los inputs
    initAutocomplete({
      fromInputId: 'from-input',
      toInputId: 'to-input',
      onFromChanged: (fromPlace) => {
        const newFromLat = fromPlace.geometry.location.lat();
        const newFromLng = fromPlace.geometry.location.lng();

        setFromCoordinates({ lat: newFromLat, lng: newFromLng });
        setFromMarkerPosition({ lat: newFromLat, lng: newFromLng });
        fromMarker.setPosition({ lat: newFromLat, lng: newFromLng });

        setFromAddress(fromPlace.formatted_address);
        desde = fromPlace.formatted_address;
        console.log(`Origen: ${fromPlace.formatted_address}`);
      },
      onToChanged: (toPlace) => {
        const newToLat = toPlace.geometry.location.lat();
        const newToLng = toPlace.geometry.location.lng();

        setToCoordinates({ lat: newToLat, lng: newToLng });
        setToMarkerPosition({ lat: newToLat, lng: newToLng });
        toMarker.setPosition({ lat: newToLat, lng: newToLng });

        setToAddress(toPlace.formatted_address);
        hasta = toPlace.formatted_address;
        console.log(`Destino: ${toPlace.formatted_address}`);
      },
    });
  }