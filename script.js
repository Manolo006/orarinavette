// === Carica i dati dal file JSON ===
let SCHEDULES = {};
let fakeNow = null; // se impostato, sostituisce ora reale

// === Mappa ===
let map, routeLayer, busMarker;

function inizializzaMappa() {
  // Se la mappa esiste già, non ricrearla
  if (map) {
    console.warn("Mappa già inizializzata — salto reinizializzazione");
    return;
  }

  map = L.map("map").setView([41.964795, 12.107508], 13);
  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 25,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
  }).addTo(map);
  routeLayer = L.layerGroup().addTo(map);

  // === Modalità aggiunta fermate ===
  let addStopMode = false;
  const outputBox = document.getElementById("outputStops");
  const stopsList = [];

  document.getElementById("addStopMode").addEventListener("click", () => {
    addStopMode = !addStopMode;
    if (addStopMode) {
      document.getElementById("addStopMode").textContent =
        "🔴 Disattiva modalità fermate";
    } else {
      document.getElementById("addStopMode").textContent =
        "🟢 Modalità aggiunta fermate";
    }
  });

  // ora mappa pronta → ascolta i click
  map.on("click", (e) => {
    if (!addStopMode) return;

    const lat = e.latlng.lat.toFixed(6);
    const lon = e.latlng.lng.toFixed(6);

    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(`Fermata<br>Lat: ${lat}<br>Lon: ${lon}`)
      .openPopup();

    stopsList.push({ lat: Number(lat), lng: Number(lon) });
    outputBox.textContent += `        "lat": ${lat},\n        "lng": ${lon}\n\n`;
  });
}



// === UI elementi ===
const lineSelect = document.getElementById("lineSelect");
const tripSelect = document.getElementById("tripSelect");
const stopSelect = document.getElementById("stopSelect");
const nextRunEl = document.getElementById("nextRun");
const etaEl = document.getElementById("eta");
const statusSelectedEl = document.getElementById("statusSelected");

// === Popolamento ===
function popolaLinee() {
  Object.keys(SCHEDULES).forEach(key => {
    const opt = document.createElement("option");
    opt.value = key;
    opt.textContent = SCHEDULES[key].nome;
    lineSelect.appendChild(opt);
  });
  if (lineSelect.options.length) {
    lineSelect.selectedIndex = 0;
    aggiornaTratteEStops();
  }
}

function aggiornaTratteEStops() {
  const linea = SCHEDULES[lineSelect.value];
  if (!linea) return;

  // Popola le tratte
  tripSelect.innerHTML = '<option value="">(Usa ora attuale)</option>';
  (linea.tratte || []).forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.id} — partenza ${t.partenza}`;
    tripSelect.appendChild(opt);
  });

  // Popola fermate
  stopSelect.innerHTML = "";
  (linea.stops || []).forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.nome;
    stopSelect.appendChild(opt);
  });

  // Disegna rotta
  drawRouteForSelectedTripOrDefault();
  updateAllDisplays();
}

function getNow() {
  return fakeNow ? new Date(fakeNow) : new Date();
}

// === Eventi UI ===
lineSelect.addEventListener("change", () => {
  aggiornaTratteEStops();
});

tripSelect.addEventListener("change", () => {
  drawRouteForSelectedTripOrDefault();
  updateAllDisplays();
});

stopSelect.addEventListener("change", () => {
  updateAllDisplays();
  zoomToSelectedStop();
});

document.getElementById("zoomRoute").addEventListener("click", () => {
  fitMapToCurrentRouteOrStops();
});

// === Funzioni mappa ===
function drawRouteForSelectedTripOrDefault() {
  routeLayer.clearLayers();

  const linea = SCHEDULES[lineSelect.value];
  const selectedTripId = tripSelect.value;

  let tratta = null;
  if (selectedTripId) {
    tratta = linea.tratte.find(t => t.id === selectedTripId);
  } else if (linea.tratte?.length) {
    tratta = linea.tratte[0]; // default: prima tratta
  }

  try {
    // === 1️⃣ Disegna la linea ===
    if (tratta && tratta.path) {
      // Se la tratta ha un percorso "path" definito nel JSON
      L.polyline(tratta.path, { color: linea.colore, weight: 5 }).addTo(routeLayer);
      map.fitBounds(tratta.path);
    } else if (tratta) {
      // Se non c’è path → collega le fermate della tratta
      const coords = Object.keys(tratta.stopTimes)
        .map(id => {
          const s = linea.stops.find(x => x.id === id);
          return s ? [s.lat, s.lng] : null;
        })
        .filter(Boolean);

      if (coords.length > 1) {
        L.polyline(coords, { color: linea.colore, weight: 4, dashArray: "6 6" }).addTo(routeLayer);
        map.fitBounds(coords);
      }
    } else {
      drawStopsOnly(); // fallback se nessuna tratta
    }

    // === 2️⃣ Disegna solo le fermate della tratta ===
    if (tratta) {
      Object.keys(tratta.stopTimes).forEach(stopId => {
        const s = linea.stops.find(x => x.id === stopId);
        if (s) {
          L.marker([s.lat, s.lng])
            .addTo(routeLayer)
            .bindPopup(`<b>${s.nome}</b>`);
        }
      });
    } else {
      // Se nessuna tratta, mostra tutte le fermate della linea
      (linea.stops || []).forEach(s => {
        L.marker([s.lat, s.lng])
          .addTo(routeLayer)
          .bindPopup(`<b>${s.nome}</b>`);
      });
    }

  } catch (e) {
    console.error("Errore caricamento route:", e);
    drawStopsOnly();
  }
}


function drawStopsOnly() {
  const linea = SCHEDULES[lineSelect.value];
  const latlngs = (linea.stops || []).map(s => [s.lat, s.lng]);
  if (latlngs.length) {
    L.polyline(latlngs, { color: linea.colore, weight: 4, dashArray: "6 6" }).addTo(routeLayer);
    map.fitBounds(latlngs);
  }
}

function zoomToSelectedStop() {
  const linea = SCHEDULES[lineSelect.value];
  const stop = linea.stops.find(s => s.id === stopSelect.value);
  if (stop) map.setView([stop.lat, stop.lng], 15);
}

function fitMapToCurrentRouteOrStops() {
  if (!routeLayer) return;
  try {
    const bounds = routeLayer.getBounds();
    if (bounds.isValid()) {
      // Added padding (0.1 = 10%) to show the entire route with some margin
      map.fitBounds(bounds.pad(0.2));
      // Added a slight zoom out to ensure the entire route is visible
      setTimeout(() => {
        map.setZoom(map.getZoom() - 1);
      }, 5);
    }
  } catch (e) {
    console.warn("fitBounds fallito:", e);
    // Fallback: zoom out to show more of the map
    map.setZoom(13);
  }
}

// === Gestione orari ===
function findNextTrattaForStop(lineKey, stopId, nowDate, tripIdSpecific = "") {
  const linea = SCHEDULES[lineKey];
  if (!linea) return null;

  const tratte = linea.tratte || [];
  if (!tratte.length) return null;

  // Ordina le tratte in base all'orario di partenza
  const sorted = [...tratte].sort((a, b) => {
    const [ah, am] = a.partenza.split(":").map(Number);
    const [bh, bm] = b.partenza.split(":").map(Number);
    return ah * 60 + am - (bh * 60 + bm);
  });

  // Se è selezionata una tratta specifica
  if (tripIdSpecific) {
    const t = sorted.find(x => x.id === tripIdSpecific);
    if (!t) return null;
    const st = t.stopTimes[stopId];
    if (!st) return null;
    const dateStop = hhmmToDateOnOrAfter(st, nowDate);
    const diffMin = Math.round((dateStop - nowDate) / 60000);
    return { tratta: t, stopTime: st, dateStop, diffMin, forced: true };
  }

  // 🧠 Cerca la prossima corsa ancora valida oggi
  let nextTrip = null;
  let minDiff = Infinity;

  for (let t of sorted) {
    const st = t.stopTimes[stopId];
    if (!st) continue;
    const [h, m] = st.split(":").map(Number);
    const dateStop = new Date(nowDate);
    dateStop.setHours(h, m, 0, 0);

    const diffMin = Math.round((dateStop - nowDate) / 60000);
    if (diffMin >= 0 && diffMin < minDiff) {
      nextTrip = { tratta: t, stopTime: st, dateStop, diffMin, forced: false };
      minDiff = diffMin;
    }
  }

  // Se non c’è più nessuna corsa oggi → prendi la prima di domani
  if (!nextTrip && sorted.length) {
    const t = sorted[0];
    const st = t.stopTimes[stopId];
    const dateStop = hhmmToDateOnOrAfter(st, nowDate);
    const diffMin = Math.round((dateStop - nowDate) / 60000);
    nextTrip = { tratta: t, stopTime: st, dateStop, diffMin, forced: false, tomorrow: true };
  }

  return nextTrip;
}


function formatDiffText(diffMin) {
  if (diffMin > 1) return `Tra ${diffMin} min`;
  if (diffMin === 1) return "Tra 1 min";
  if (diffMin === 0) return "In arrivo";
  const ago = Math.abs(diffMin);
  return ago === 1 ? "1 min fa" : `${ago} min fa`;
}

// === Aggiornamento UI ===
function updateAllDisplays() {
  const now = getNow();
  const lineKey = lineSelect.value;
  const stopId = stopSelect.value;
  const tripIdSpecific = tripSelect.value || "";

  const info = findNextTrattaForStop(lineKey, stopId, now, tripIdSpecific);

  if (!info) {
    nextRunEl.textContent = "—";
    etaEl.textContent = "Nessuna corsa trovata";
    statusSelectedEl.textContent = "";
    return;
  }

  const orarioTesto = info.dateStop.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  nextRunEl.textContent = info.tomorrow ? `${orarioTesto} (domani)` : orarioTesto;
  etaEl.textContent = formatDiffText(info.diffMin);
  statusSelectedEl.textContent = info.forced
    ? `Corsa selezionata: ${info.tratta.id}`
    : `Prossima corsa: ${info.tratta.id}`;

  updateBusMarkerForTratta(info.tratta, info.dateStop, info.diffMin, now, stopId);
}

// === Marker bus ===
function updateBusMarkerForTratta(tratta, dateStop, diffMin, now, stopIdSelected) {
  if (busMarker) {
    routeLayer.removeLayer(busMarker);
    busMarker = null;
  }

  const linea = SCHEDULES[lineSelect.value];
  const stops = linea.stops;
  const times = tratta.stopTimes;

  const points = stops.map(s => {
    const t = times[s.id];
    if (!t) return null;
    const d = hhmmToDateOnOrAfter(t, now);
    return { id: s.id, lat: s.lat, lng: s.lng, date: d };
  }).filter(Boolean);

  if (points.length < 2) return;

  let prev = points[0], next = points[points.length - 1];
  for (let i = 0; i < points.length; i++) {
    if (points[i].date >= now) {
      next = points[i];
      prev = i > 0 ? points[i - 1] : points[i];
      break;
    }
  }

  let percent = 0;
  if (next.date > prev.date) percent = (now - prev.date) / (next.date - prev.date);
  percent = Math.max(0, Math.min(1, percent));

  const lat = prev.lat + (next.lat - prev.lat) * percent;
  const lng = prev.lng + (next.lng - prev.lng) * percent;

  busMarker = L.marker([lat, lng], { title: `Navetta ${tratta.id}` }).addTo(routeLayer);
  const popupText = `<b>${tratta.id}</b><br>Arrivo: ${dateStop.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}<br>${formatDiffText(diffMin)}`;
  busMarker.bindPopup(popupText);
}

// === Aggiornamento automatico ===
let autoUpdateInterval = null;
function startAutoUpdate() {
  if (autoUpdateInterval) clearInterval(autoUpdateInterval);
  autoUpdateInterval = setInterval(() => {
    // aggiorna "fakeNow" se è attiva la simulazione
    if (fakeNow) fakeNow = new Date(fakeNow.getTime() + 500);
    updateAllDisplays(); // aggiorna ETA e prossima corsa
  }, 500); // aggiorna ogni mezzo secondo
}

// === Event listeners ===
// Importante: questi devono essere registrati *dopo* che la pagina è pronta e SCHEDULES caricato

lineSelect.addEventListener("change", () => {
  aggiornaTratteEStops();           // ricarica fermate e tratte
  drawRouteForSelectedTripOrDefault(); // ridisegna la rotta GeoJSON
  updateAllDisplays();              // aggiorna i dati visivi
});

tripSelect.addEventListener("change", () => {
  drawRouteForSelectedTripOrDefault(); // ricarica la rotta per la tratta scelta
  updateAllDisplays();
});

stopSelect.addEventListener("change", () => {
  updateAllDisplays(); // aggiorna ETA e prossima corsa
});

// === Caricamento iniziale ===
fetch("linee.json")
  .then(res => res.json())
  .then(data => {
    SCHEDULES = data;
    inizializzaMappa();
    popolaLinee();  // genera subito la prima linea
    startAutoUpdate();
    const firstStop = stopSelect.options[0];
    if (firstStop) {
      stopSelect.value = firstStop.value;
      updateAllDisplays(); // mostra subito la prima navetta disponibile
    }

    startAutoUpdate();
  })
  .catch(err => console.error("Errore nel caricamento linee.json", err));

document.getElementById("btnNearestStop").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("La geolocalizzazione non è supportata dal tuo browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const userLatLng = L.latLng(latitude, longitude);

    const linea = SCHEDULES[lineSelect.value];
    if (!linea || !linea.stops?.length) {
      alert("Nessuna linea o fermata disponibile.");
      return;
    }

    // Trova la fermata più vicina
    let nearestStop = null;
    let nearestDistance = Infinity;

    linea.stops.forEach(stop => {
      const stopLatLng = L.latLng(stop.lat, stop.lng);
      const distance = userLatLng.distanceTo(stopLatLng); // in metri
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestStop = stop;
      }
    });

    if (nearestStop) {
      stopSelect.value = nearestStop.id;
      updateAllDisplays();
      zoomToSelectedStop();
      L.marker([latitude, longitude], { title: "La tua posizione" })
        .addTo(map)
        .bindPopup(`📍 Tu sei qui<br>Fermata più vicina: <b>${nearestStop.nome}</b><br>(${Math.round(nearestDistance)} m)`)
        .openPopup();
    }
  }, err => {
    alert("Impossibile ottenere la posizione: " + err.message);
  });
});

// === Registrazione del percorso GPS ===
let recording = false;
let recordedPath = [];
let recordInterval = null;

// Bottone per registrare percorso
const recordBtn = document.createElement("button");
recordBtn.textContent = "▶️ Inizia registrazione percorso";
recordBtn.style.marginTop = "10px";
document.querySelector(".panel").appendChild(recordBtn);

recordBtn.addEventListener("click", () => {
  if (!recording) {
    // Avvia registrazione
    recording = true;
    recordedPath = [];
    recordBtn.textContent = "⏹️ Stop registrazione";

    if (navigator.geolocation) {
      // Registra subito un primo punto
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        recordedPath.push([latitude.toFixed(6), longitude.toFixed(6)]);
        console.log("📍 Primo punto:", latitude, longitude);
      });

      // Poi continua ogni 30 secondi (30000 ms)
      recordInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            recordedPath.push([latitude.toFixed(6), longitude.toFixed(6)]);
            console.log("Nuovo punto:", latitude, longitude);
          },
          (err) => console.error("Errore GPS:", err),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 1000 }
        );
      }, 30000); // <-- Cambia qui per regolare la frequenza
    } else {
      alert("Geolocalizzazione non supportata");
    }
  } else {
    // Ferma registrazione
    recording = false;
    clearInterval(recordInterval);
    recordInterval = null;
    recordBtn.textContent = "▶️ Inizia registrazione percorso";

    // Formatta il percorso in JSON pronto
    const jsonPath = `"path": [\n${recordedPath
      .map((p) => `  [${p[0]}, ${p[1]}]`)
      .join(",\n")}\n]`;

    // Copia automaticamente negli appunti
    navigator.clipboard.writeText(jsonPath).then(() => {
      alert("✅ Percorso copiato negli appunti!\nIncollalo nel file JSON della linea.");
      console.log("Percorso copiato:\n", jsonPath);
    });
  }
});
