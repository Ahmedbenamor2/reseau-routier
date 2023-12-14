import React, { useEffect, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import Geolocation from 'ol/Geolocation';
import Overlay from 'ol/Overlay';
import { toLonLat, fromLonLat } from 'ol/proj';
import styles from './Map.module.css';
import addIncident from './addIncident';


const MapComponent = () => {
  const [imgUrl, setImgUrl] = useState(null);
  const [selectedMapType, setSelectedMapType] = useState('');

  useEffect(() => {
    const map = new Map({
      target: 'map',
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

  
    const markerElement = document.createElement('div');
    markerElement.className = styles.marker;
    markerElement.innerHTML = '<img src="https://assets.mapquestapi.com/icon/v2/marker-sm-7B0099.png" alt="marker" />';
    markerElement.className = `${styles.marker}`;

    const markerOverlay = new Overlay({
      element: markerElement,
      positioning: 'bottom-center',
      stopEvent: false,
    });

    map.addOverlay(markerOverlay);

    const geolocation = new Geolocation({
      tracking: true,
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: map.getView().getProjection(),
    });

    geolocation.on('change:position', () => {
      const coordinates = geolocation.getPosition();
      if (coordinates) {
        map.getView().animate({ center: coordinates, zoom: 12 });
        markerOverlay.setPosition(coordinates);
      }
    });

    
    let incidentOverlays = [];

    const displayIncidents=async()=>{
      const response=await fetch('http://localhost:3001/incidents');
      const data=await response.json();
      data.forEach((incident) => {
        const incidentLongitude = parseFloat(incident.lng);
        const incidentLatitude = parseFloat(incident.lat);
        const incidentCoord = fromLonLat([incidentLongitude, incidentLatitude]);

        const incidentMarkerElement = document.createElement('div');
        incidentMarkerElement.innerHTML = `<img src="http://content.mqcdn.com/mqtraffic/incid_min.png" alt="marker" />`;
        incidentMarkerElement.className = `${styles.markerElt}`;
        incidentMarkerElement.setAttribute('data-desc', incident.shortDesc);

        const incidentMarkerOverlay = new Overlay({
          element: incidentMarkerElement,
          positioning: 'bottom-center',
          stopEvent: false,
        });

        map.addOverlay(incidentMarkerOverlay);
        incidentMarkerOverlay.setPosition(incidentCoord);

        incidentOverlays.push(incidentMarkerOverlay);
    })}
    

    const addNewIncident = async (latitude, longitude, costomDesc, costomType) => {
      try {
        // Send a request to add the new incident to the backend
        await addIncident({ lat: latitude, lng: longitude, shortDesc: costomDesc, type: costomType });

        // Display incidents after adding the new incident
        displayIncidents();
      } catch (error) {
        console.error('Error adding new incident:', error);
      }
    };


    displayIncidents();

    map.on('click', async (event) => {
      const clickedCoord = event.coordinate;
      const lonLat = toLonLat(clickedCoord);
      const longitude = lonLat[0].toFixed(2);
      const latitude = lonLat[1].toFixed(2);
      console.log(`Longitude:${longitude}, Latitude:${latitude}`);
      markerOverlay.setPosition(clickedCoord);
      map.getView().animate({ center: clickedCoord, zoom: 12 });
      const apikey = 'Rpjq5JCntJIWfJZd6RbXb4urlfU796yS';
      if (selectedMapType === 'Traffic') {
        const apiUrl = `https://www.mapquestapi.com/traffic/v2/flow?key=${apikey}&mapLat=${latitude}&mapLng=${longitude}&mapHeight=800&mapWidth=1000&mapScale=108335`;

        try {
          const response = await fetch(apiUrl);
          const data = await response.blob();
          const url = URL.createObjectURL(data);
          setImgUrl(url);

          // Remove the image after 5 seconds
          setTimeout(() => {
            setImgUrl(null);
          }, 5000);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
      else if (selectedMapType === 'Ancidents') {
        incidentOverlays.forEach((Overlay) => {
          map.removeOverlay(Overlay);
        })

        const apiUrl = `https://www.mapquestapi.com/traffic/v2/incidents?key=${apikey}&boundingBox=${latitude - 0.01},${longitude - 0.01},${parseInt(latitude) + 0.01},${parseInt(longitude) + 0.01}&filters=construction,incidents`;
        try {
          const response = await fetch(apiUrl);
          const data = await response.json();
          const { incidents } = data;
          console.log(incidents);
          incidents.forEach((incident) => {
            const incidentLongitude = incident.lng;
            const incidentLatitude = incident.lat;
            const incidentCoord = fromLonLat([incidentLongitude, incidentLatitude]);

            const incidentMarkerElement = document.createElement('div');
            incidentMarkerElement.innerHTML = `<img src="${incident.iconURL}" alt="marker" />`;
            incidentMarkerElement.className=`${styles.markerElt}`;
            incidentMarkerElement.setAttribute('data-desc',incident.shortDesc)

            const incidentMarkerOverlay = new Overlay({
              element: incidentMarkerElement,
              positioning: 'bottom-center',
              stopEvent: false,
            });

            map.addOverlay(incidentMarkerOverlay);
            incidentMarkerOverlay.setPosition(incidentCoord);

            incidentOverlays.push(incidentMarkerOverlay);
          });

        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
      else if(selectedMapType==='Add incident'){
        displayIncidents();
        const costomDesc=window.prompt('Enter a short description');
        const costomType=window.prompt('Enter the type of the incident');

        addNewIncident(latitude, longitude, costomDesc, costomType);
      }
    });
    

    return () => {
      map.dispose();
    };
  }, [selectedMapType]);

  const handleSelectedMapChange = (event) => {
    setSelectedMapType(event.target.value);
  }

  return (
    <>
      <select className={styles.selectMapType} value={selectedMapType} onChange={handleSelectedMapChange}>
        <option>select option...</option>
        <option>Traffic</option>
        <option>Ancidents</option>
        <option>Add incident</option>
      </select>
      <div id="map" style={{ width: '100%', height: '100vh' }}></div>
      {imgUrl && <img src={imgUrl} className={styles.img} alt="Map" />}

    </>
  );
};

export default MapComponent;
