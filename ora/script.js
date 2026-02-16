(() => {
  // === Stato applicazione ===
  let SCHEDULES = {};
  let map = null;
  let staticLayer = null;
  let dynamicLayer = null;
  let busMarker = null;
  let autoUpdateInterval = null;

  let addStopMode = false;
  const addedStops = [];

  // === UI ===
  const lineSelect = document.getElementById("lineSelect");
  const tripSelect = document.getElementById("tripSelect");
  const stopSelect = document.getElementById("stopSelect");
  const nextRunEl = document.getElementById("nextRun");
  const etaEl = document.getElementById("eta");
  const statusSelectedEl = document.getElementById("statusSelected");
  const zoomRouteBtn = document.getElementById("zoomRoute");
  const addStopModeBtn = document.getElementById("addStopMode");
  const outputStopsEl = document.getElementById("outputStops");
  const nearestStopBtn = document.getElementById("btnNearestStop");

  function initMap() {
    if (map) return;

    map = L.map("map", {
      preferCanvas: true,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false
    }).setView([41.964795, 12.107508], 13);

    const baseLayers = {
      "OpenStreetMap": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors"
      }),
      "Carto Positron": L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        subdomains: "abcd",
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
      })
    };

    baseLayers["OpenStreetMap"].addTo(map);
    L.control.layers(baseLayers, null, { collapsed: true }).addTo(map);

    staticLayer = L.featureGroup().addTo(map);
    dynamicLayer = L.layerGroup().addTo(map);

    map.on("click", (e) => {
      if (!addStopMode) return;
      const lat = Number(e.latlng.lat.toFixed(6));
      const lng = Number(e.latlng.lng.toFixed(6));

      L.circleMarker([lat, lng], { radius: 5, color: "#2ca02c" }).addTo(dynamicLayer);
      addedStops.push({ lat, lng });
      if (outputStopsEl) {
        outputStopsEl.textContent = JSON.stringify(addedStops, null, 2);
      }
    });

    window.addEventListener("resize", () => map.invalidateSize());
  }

  function getNow() {
    return new Date();
  }

  function hhmmToDateOnOrAfter(hhmm, nowDate) {
    const [h, m] = String(hhmm).split(":").map(Number);
    const d = new Date(nowDate);
    d.setHours(h, m, 0, 0);
    if (d < nowDate) d.setDate(d.getDate() + 1);
    return d;
  }

  function hhmmToMinutes(hhmm) {
    const [h, m] = String(hhmm).split(":").map(Number);
    return h * 60 + m;
  }

  function formatDiffText(diffMin) {
    if (diffMin > 1) return `Tra ${diffMin} min`;
    if (diffMin === 1) return "Tra 1 min";
    if (diffMin === 0) return "In arrivo";
    const ago = Math.abs(diffMin);
    return ago === 1 ? "1 min fa" : `${ago} min fa`;
  }

  function getCurrentLine() {
    return SCHEDULES[lineSelect.value] || null;
  }

  function populateLinee() {
    lineSelect.innerHTML = "";

    Object.keys(SCHEDULES).forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = SCHEDULES[key].nome || key;
      lineSelect.appendChild(opt);
    });

    if (lineSelect.options.length > 0) {
      lineSelect.selectedIndex = 0;
      aggiornaTratteEStops();
    }
  }

  function aggiornaTratteEStops() {
    const linea = getCurrentLine();
    if (!linea) return;

    tripSelect.innerHTML = '<option value="">(Usa ora attuale)</option>';
    (linea.tratte || []).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.id} - partenza ${t.partenza || "--:--"}`;
      tripSelect.appendChild(opt);
    });

    stopSelect.innerHTML = "";
    (linea.stops || []).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.nome;
      stopSelect.appendChild(opt);
    });

    drawRouteForSelectedTripOrDefault();
    updateAllDisplays();
  }

  function drawStopsForTratta(linea, tratta) {
    const ids = Object.keys(tratta.stopTimes || {});
    ids.forEach((stopId) => {
      const s = (linea.stops || []).find((x) => x.id === stopId);
      if (!s) return;
      L.marker([s.lat, s.lng]).addTo(staticLayer).bindPopup(`<b>${s.nome}</b>`);
    });
  }

  function drawAllStops(linea) {
    (linea.stops || []).forEach((s) => {
      L.marker([s.lat, s.lng]).addTo(staticLayer).bindPopup(`<b>${s.nome}</b>`);
    });
  }

  function drawRouteForSelectedTripOrDefault() {
    if (!staticLayer) return;
    staticLayer.clearLayers();
    if (dynamicLayer) dynamicLayer.clearLayers();
    busMarker = null;

    const linea = getCurrentLine();
    if (!linea) return;

    const selectedTripId = tripSelect.value;
    let tratta = null;

    if (selectedTripId) {
      tratta = (linea.tratte || []).find((t) => t.id === selectedTripId) || null;
    } else {
      tratta = (linea.tratte || [])[0] || null;
    }

    try {
      if (tratta && Array.isArray(tratta.path) && tratta.path.length > 1) {
        L.polyline(tratta.path, {
          color: linea.colore || "#0077cc",
          weight: 5,
          smoothFactor: 2
        }).addTo(staticLayer);
        drawStopsForTratta(linea, tratta);
        fitMapToCurrentRouteOrStops();
        return;
      }

      if (tratta && tratta.stopTimes) {
        const coords = Object.keys(tratta.stopTimes)
          .map((id) => {
            const s = (linea.stops || []).find((x) => x.id === id);
            return s ? [s.lat, s.lng] : null;
          })
          .filter(Boolean);

        if (coords.length > 1) {
          L.polyline(coords, {
            color: linea.colore || "#0077cc",
            weight: 4,
            dashArray: "6 6",
            smoothFactor: 2
          }).addTo(staticLayer);
        }

        drawStopsForTratta(linea, tratta);
        fitMapToCurrentRouteOrStops();
        return;
      }

      const allCoords = (linea.stops || []).map((s) => [s.lat, s.lng]);
      if (allCoords.length > 1) {
        L.polyline(allCoords, {
          color: linea.colore || "#0077cc",
          weight: 4,
          dashArray: "6 6",
          smoothFactor: 2
        }).addTo(staticLayer);
      }

      drawAllStops(linea);
      fitMapToCurrentRouteOrStops();
    } catch (err) {
      console.error("Errore disegno mappa:", err);
    }
  }

  function fitMapToCurrentRouteOrStops() {
    if (!map || !staticLayer) return;
    try {
      const bounds = staticLayer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.2));
      }
    } catch (err) {
      console.warn("fitBounds fallito:", err);
    }
  }

  function zoomToSelectedStop() {
    const linea = getCurrentLine();
    if (!linea) return;

    const stop = (linea.stops || []).find((s) => s.id === stopSelect.value);
    if (stop) map.setView([stop.lat, stop.lng], 15);
  }

  function findNextTrattaForStop(lineKey, stopId, nowDate, tripIdSpecific = "") {
    const linea = SCHEDULES[lineKey];
    if (!linea || !linea.tratte || !linea.tratte.length) return null;

    const sorted = [...linea.tratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));
    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

    if (tripIdSpecific) {
      const t = sorted.find((x) => x.id === tripIdSpecific);
      if (!t) return null;

      const st = t.stopTimes?.[stopId];
      if (!st) return null;

      const dateStop = hhmmToDateOnOrAfter(st, nowDate);
      const diffMin = Math.round((dateStop - nowDate) / 60000);
      return { tratta: t, stopTime: st, dateStop, diffMin, forced: true };
    }

    // Cerca prima una corsa ancora valida oggi.
    for (const t of sorted) {
      const st = t.stopTimes?.[stopId];
      if (!st) continue;

      const stopMin = hhmmToMinutes(st);
      if (stopMin >= nowMin) {
        const dateStop = new Date(nowDate);
        const [h, m] = String(st).split(":").map(Number);
        dateStop.setHours(h, m, 0, 0);
        const diffMin = stopMin - nowMin;
        return { tratta: t, stopTime: st, dateStop, diffMin, forced: false, tomorrow: false };
      }
    }

    // Se oggi non c'e piu nulla, prendi la prima corsa di domani.
    const first = sorted.find((t) => t.stopTimes?.[stopId]);
    if (!first) return null;

    const st = first.stopTimes[stopId];
    const dateStop = hhmmToDateOnOrAfter(st, nowDate);
    if (dateStop < nowDate) dateStop.setDate(dateStop.getDate() + 1);

    const diffMin = Math.round((dateStop - nowDate) / 60000);
    return { tratta: first, stopTime: st, dateStop, diffMin, forced: false, tomorrow: true };
  }

  function updateBusMarkerForTratta(tratta, dateStop, diffMin, now) {
    if (!dynamicLayer) return;

    if (busMarker) {
      dynamicLayer.removeLayer(busMarker);
      busMarker = null;
    }

    const linea = getCurrentLine();
    if (!linea) return;

    const points = (linea.stops || [])
      .map((s) => {
        const t = tratta.stopTimes?.[s.id];
        if (!t) return null;
        return {
          lat: s.lat,
          lng: s.lng,
          date: hhmmToDateOnOrAfter(t, now)
        };
      })
      .filter(Boolean);

    if (points.length < 2) return;

    let prev = points[0];
    let next = points[points.length - 1];

    for (let i = 0; i < points.length; i += 1) {
      if (points[i].date >= now) {
        next = points[i];
        prev = i > 0 ? points[i - 1] : points[i];
        break;
      }
    }

    let percent = 0;
    if (next.date > prev.date) {
      percent = (now - prev.date) / (next.date - prev.date);
      percent = Math.max(0, Math.min(1, percent));
    }

    const lat = prev.lat + (next.lat - prev.lat) * percent;
    const lng = prev.lng + (next.lng - prev.lng) * percent;

    busMarker = L.circleMarker([lat, lng], {
      radius: 7,
      color: "#e03131",
      fillColor: "#e03131",
      fillOpacity: 0.9
    }).addTo(dynamicLayer);
    busMarker.bindPopup(
      `<b>${tratta.id}</b><br>Arrivo: ${dateStop.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}<br>${formatDiffText(diffMin)}`
    );
  }

  function updateAllDisplays() {
    const now = getNow();
    const lineKey = lineSelect.value;
    const stopId = stopSelect.value;
    const tripIdSpecific = tripSelect.value || "";

    if (!lineKey || !stopId) {
      nextRunEl.textContent = "-";
      etaEl.textContent = "-";
      statusSelectedEl.textContent = "";
      return;
    }

    const info = findNextTrattaForStop(lineKey, stopId, now, tripIdSpecific);

    if (!info) {
      nextRunEl.textContent = "-";
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

    updateBusMarkerForTratta(info.tratta, info.dateStop, info.diffMin, now);
  }

  function startAutoUpdate() {
    if (autoUpdateInterval) clearInterval(autoUpdateInterval);
    autoUpdateInterval = setInterval(updateAllDisplays, 2000);
  }

  function wireEvents() {
    lineSelect.addEventListener("change", aggiornaTratteEStops);

    tripSelect.addEventListener("change", () => {
      drawRouteForSelectedTripOrDefault();
      updateAllDisplays();
    });

    stopSelect.addEventListener("change", () => {
      updateAllDisplays();
      zoomToSelectedStop();
    });

    if (zoomRouteBtn) {
      zoomRouteBtn.addEventListener("click", fitMapToCurrentRouteOrStops);
    }

    if (addStopModeBtn) {
      addStopModeBtn.addEventListener("click", () => {
        addStopMode = !addStopMode;
        addStopModeBtn.textContent = addStopMode
          ? "Disattiva modalita fermate"
          : "Modalita aggiunta fermate";
      });
    }

    if (nearestStopBtn) {
      nearestStopBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert("La geolocalizzazione non e supportata dal browser.");
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const userLatLng = L.latLng(latitude, longitude);
            const linea = getCurrentLine();

            if (!linea || !linea.stops || !linea.stops.length) {
              alert("Nessuna linea o fermata disponibile.");
              return;
            }

            let nearestStop = null;
            let nearestDistance = Infinity;

            linea.stops.forEach((stop) => {
              const d = userLatLng.distanceTo(L.latLng(stop.lat, stop.lng));
              if (d < nearestDistance) {
                nearestDistance = d;
                nearestStop = stop;
              }
            });

            if (!nearestStop) return;

            stopSelect.value = nearestStop.id;
            updateAllDisplays();
            zoomToSelectedStop();

            L.marker([latitude, longitude], { title: "La tua posizione" })
              .addTo(dynamicLayer)
              .bindPopup(`Tu sei qui<br>Fermata vicina: <b>${nearestStop.nome}</b><br>(${Math.round(nearestDistance)} m)`)
              .openPopup();
          },
          (err) => alert(`Impossibile ottenere la posizione: ${err.message}`)
        );
      });
    }
  }

  async function init() {
    if (typeof L === "undefined") {
      console.error("Leaflet non caricato");
      nextRunEl.textContent = "Errore mappa";
      etaEl.textContent = "-";
      statusSelectedEl.textContent = "Leaflet non raggiungibile (controlla rete/CDN)";
      return;
    }

    initMap();
    wireEvents();

    try {
      const res = await fetch("linee.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      SCHEDULES = await res.json();
      populateLinee();
      startAutoUpdate();

      setTimeout(() => {
        if (map) map.invalidateSize();
      }, 200);
    } catch (err) {
      console.error("Errore nel caricamento linee.json:", err);
      nextRunEl.textContent = "Errore caricamento dati";
      etaEl.textContent = "-";
      statusSelectedEl.textContent = "Controlla server locale e JSON";
    }
  }

  init();
})();
