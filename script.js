/**
 * ORARI NAVETTE & BUS - MOBILE-FIRST JAVASCRIPT ENGINE
 * Handles touch gestures, bottom sheet drawer, bottom navigation bar,
 * OSRM road routing, live bus tracking, and mobile UI modals.
 */

(() => {
  // === APPLICATION STATE ===
  let SCHEDULES = {};
  let map = null;
  let staticLayer = null;
  let dynamicLayer = null;
  let busMarker = null;
  let userMarker = null;
  let autoUpdateInterval = null;
  let osrmCache = {};

  // GPS State
  let isRecordingGPS = false;
  let recordedGPSPath = [];
  let gpsWatchId = null;

  // Active Map Tiles State
  let currentTileLayer = null;
  let currentTileType = "positron";
  const MAP_TILES = {
    positron: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  // Favorites
  let favorites = JSON.parse(localStorage.getItem("bus_favorites") || "[]");

  // === DOM ELEMENTS ===
  const lineSelect = document.getElementById("lineSelect");
  const tripSelect = document.getElementById("tripSelect");
  const stopSelect = document.getElementById("stopSelect");

  const heroLineBadge = document.getElementById("heroLineBadge");
  const heroStopName = document.getElementById("heroStopName");
  const heroEtaBadge = document.getElementById("heroEtaBadge");
  const heroNextTime = document.getElementById("heroNextTime");

  const timelineList = document.getElementById("timelineList");
  const upcomingList = document.getElementById("upcomingList");
  const favoritesList = document.getElementById("favoritesList");

  const btnFavorite = document.getElementById("btnFavorite");
  const btnZoomRoute = document.getElementById("btnZoomRoute");
  const btnThemeToggle = document.getElementById("btnThemeToggle");

  // FABs & Map Controls
  const fabLocate = document.getElementById("fabLocate");
  const fabLayer = document.getElementById("fabLayer");
  const fabAdmin = document.getElementById("fabAdmin");

  // Bottom Sheet Drawer
  const bottomSheet = document.getElementById("bottomSheet");
  const sheetHandle = document.getElementById("sheetHandle");
  const sheetHero = document.getElementById("sheetHero");

  // Bottom Navigation Bar
  const navItems = document.querySelectorAll(".nav-item");

  // Search Overlay
  const searchModal = document.getElementById("searchModal");
  const btnOpenSearch = document.getElementById("btnOpenSearch");
  const btnCloseSearch = document.getElementById("btnCloseSearch");
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");

  // Modals
  const timetableModal = document.getElementById("timetableModal");
  const btnTimetable = document.getElementById("btnTimetable");
  const closeTimetableModal = document.getElementById("closeTimetableModal");
  const timetableMatrix = document.getElementById("timetableMatrix");
  const modalLineTitle = document.getElementById("modalLineTitle");

  const adminModal = document.getElementById("adminModal");
  const closeAdminModal = document.getElementById("closeAdminModal");
  const btnGenerateOSRM = document.getElementById("btnGenerateOSRM");
  const btnRecordGPS = document.getElementById("btnRecordGPS");
  const adminOutput = document.getElementById("adminOutput");
  const btnCopyAdminOutput = document.getElementById("btnCopyAdminOutput");

  // === INIT ===
  async function init() {
    initTheme();
    initMap();
    wireMobileEvents();
    wireNavSystem();
    wireBottomSheetEvents();

    try {
      const res = await fetch("linee.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      SCHEDULES = await res.json();
      populateLinee();
      renderFavorites();
      startAutoUpdate();
    } catch (err) {
      console.error("Errore caricamento linee.json:", err);
      heroEtaBadge.textContent = "Err";
      heroStopName.textContent = "Errore dati linee.json";
    }
  }

  // === THEME SYSTEM ===
  function initTheme() {
    const savedTheme = localStorage.getItem("bus_theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
    updateThemeIcon(savedTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("bus_theme", newTheme);
    updateThemeIcon(newTheme);

    switchMapTile(newTheme === "dark" ? "dark" : "positron");
  }

  function updateThemeIcon(theme) {
    if (btnThemeToggle) {
      btnThemeToggle.innerHTML = theme === "dark" 
        ? '<i class="fa-solid fa-sun"></i>' 
        : '<i class="fa-solid fa-moon"></i>';
    }
  }

  // === MAP INITIALIZATION & TILES ===
  function initMap() {
    if (map) return;

    map = L.map("map", {
      preferCanvas: true,
      zoomControl: false,
      attributionControl: false
    }).setView([41.964795, 12.107508], 13);

    const initialTheme = document.documentElement.getAttribute("data-theme");
    switchMapTile(initialTheme === "dark" ? "dark" : "positron");

    staticLayer = L.featureGroup().addTo(map);
    dynamicLayer = L.layerGroup().addTo(map);

    window.addEventListener("resize", () => map.invalidateSize());
  }

  function switchMapTile(type) {
    if (!map) return;
    if (currentTileLayer) map.removeLayer(currentTileLayer);

    currentTileType = type;
    const url = MAP_TILES[type] || MAP_TILES.positron;
    currentTileLayer = L.tileLayer(url, { maxZoom: 19 }).addTo(map);
  }

  function cycleMapTile() {
    if (currentTileType === "positron") switchMapTile("dark");
    else if (currentTileType === "dark") switchMapTile("satellite");
    else switchMapTile("positron");
  }

  // === OSRM FREE ROAD ROUTING ENGINE ===
  async function fetchOSRMRoute(stops) {
    if (!stops || stops.length < 2) return null;

    const cacheKey = stops.map(s => `${s.lat.toFixed(5)},${s.lng.toFixed(5)}`).join(";");
    if (osrmCache[cacheKey]) return osrmCache[cacheKey];

    try {
      const coordinatesParam = stops.map(s => `${s.lng},${s.lat}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesParam}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) throw new Error("OSRM Routing failed");

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const latLngs = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        osrmCache[cacheKey] = latLngs;
        return latLngs;
      }
    } catch (err) {
      console.warn("OSRM routing fallito, fallback:", err);
    }
    return null;
  }

  // === TIME HELPERS ===
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
    if (diffMin > 1) return `${diffMin} min`;
    if (diffMin === 1) return "1 min";
    if (diffMin === 0) return "In arrivo";
    const ago = Math.abs(diffMin);
    return `${ago}m fa`;
  }

  function getCurrentLine() {
    return SCHEDULES[lineSelect.value] || null;
  }

  // === POPULATE SELECTORS ===
  function populateLinee() {
    lineSelect.innerHTML = "";

    Object.keys(SCHEDULES).forEach((key) => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = SCHEDULES[key].nome || `Linea ${key}`;
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

    heroLineBadge.innerHTML = `<i class="fa-solid fa-bus"></i> ${linea.nome || 'Linea ' + lineSelect.value}`;
    if (linea.colore) heroLineBadge.style.backgroundColor = linea.colore;

    tripSelect.innerHTML = '<option value="">(Corsa in tempo reale)</option>';
    (linea.tratte || []).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.id} - Partenza ore ${t.partenza || "--:--"}`;
      tripSelect.appendChild(opt);
    });

    stopSelect.innerHTML = "";
    (linea.stops || []).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.nome;
      stopSelect.appendChild(opt);
    });

    updateFavoriteButtonState();
    drawRouteForSelectedTripOrDefault();
    updateAllDisplays();
  }

  // === DRAW MAP ROUTE & STOPS ===
  async function drawRouteForSelectedTripOrDefault() {
    if (!staticLayer) return;
    staticLayer.clearLayers();
    if (dynamicLayer) dynamicLayer.clearLayers();
    busMarker = null;

    const linea = getCurrentLine();
    if (!linea) return;

    const selectedTripId = tripSelect.value;
    let tratta = selectedTripId 
      ? (linea.tratte || []).find((t) => t.id === selectedTripId) 
      : (linea.tratte || [])[0];

    let pathCoords = null;

    if (tratta && Array.isArray(tratta.path) && tratta.path.length > 1) {
      pathCoords = tratta.path;
    } else if (linea.stops && linea.stops.length > 1) {
      pathCoords = await fetchOSRMRoute(linea.stops);
    }

    if (!pathCoords) {
      pathCoords = (linea.stops || []).map(s => [s.lat, s.lng]);
    }

    if (pathCoords && pathCoords.length > 1) {
      L.polyline(pathCoords, {
        color: linea.colore || "#2563eb",
        weight: 5,
        opacity: 0.85
      }).addTo(staticLayer);
    }

    (linea.stops || []).forEach((s, idx) => {
      const isSelected = s.id === stopSelect.value;
      const markerHtml = `<div class="stop-marker-pin ${isSelected ? 'active' : ''}">${idx + 1}</div>`;
      
      const customIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: markerHtml,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const m = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(staticLayer);
      m.bindPopup(`<b>${s.nome}</b><br>Fermata #${idx + 1}`);

      m.on("click", () => {
        stopSelect.value = s.id;
        updateAllDisplays();
        zoomToSelectedStop();
      });
    });

    fitMapToCurrentRouteOrStops();
  }

  function fitMapToCurrentRouteOrStops() {
    if (!map || !staticLayer) return;
    try {
      const bounds = staticLayer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.18));
      }
    } catch (err) {
      console.warn("fitBounds fallito:", err);
    }
  }

  // === NEXT TRATTA CALCULATOR ===
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

    const first = sorted.find((t) => t.stopTimes?.[stopId]);
    if (!first) return null;

    const st = first.stopTimes[stopId];
    const dateStop = hhmmToDateOnOrAfter(st, nowDate);
    if (dateStop < nowDate) dateStop.setDate(dateStop.getDate() + 1);

    const diffMin = Math.round((dateStop - nowDate) / 60000);
    return { tratta: first, stopTime: st, dateStop, diffMin, forced: false, tomorrow: true };
  }

  // === BUS POSITION & ANIMATION ===
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
          id: s.id,
          nome: s.nome,
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

    const busIcon = L.divIcon({
      className: 'bus-marker-wrapper',
      html: `<div class="bus-marker-icon"><i class="fa-solid fa-bus"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(dynamicLayer);
    busMarker.bindPopup(`<b>Corsa ${tratta.id}</b><br>Prossima: ${next.nome}`);
  }

  // === RENDER TIMELINE ===
  function renderTimeline(linea, currentTratta, now) {
    if (!timelineList || !linea || !linea.stops) return;
    timelineList.innerHTML = "";

    const stopTimes = currentTratta ? (currentTratta.stopTimes || {}) : {};

    linea.stops.forEach((stop, index) => {
      const timeStr = stopTimes[stop.id] || "--:--";
      const isSelected = stop.id === stopSelect.value;
      
      let isPassed = false;
      if (currentTratta && stopTimes[stop.id]) {
        const stopDate = hhmmToDateOnOrAfter(stopTimes[stop.id], now);
        if (stopDate < now) isPassed = true;
      }

      const row = document.createElement("div");
      row.className = `timeline-row ${isSelected ? 'active' : ''} ${isPassed ? 'passed' : ''}`;
      row.innerHTML = `
        <div class="stop-badge-num">${isPassed ? '<i class="fa-solid fa-check"></i>' : index + 1}</div>
        <div class="stop-row-info">
          <div class="stop-row-name">${stop.nome}</div>
          <div class="stop-row-time"><i class="fa-regular fa-clock"></i> ${timeStr}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
      `;

      row.addEventListener("click", () => {
        stopSelect.value = stop.id;
        updateAllDisplays();
        zoomToSelectedStop();
      });

      timelineList.appendChild(row);
    });
  }

  // === RENDER UPCOMING TRIPS ===
  function renderUpcomingTrips(linea, stopId, now) {
    if (!upcomingList || !linea || !linea.tratte) return;
    upcomingList.innerHTML = "";

    const sorted = [...linea.tratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));

    sorted.forEach((tratta) => {
      const st = tratta.stopTimes?.[stopId];
      if (!st) return;

      const dateStop = hhmmToDateOnOrAfter(st, now);
      const diffMin = Math.round((dateStop - now) / 60000);
      const isPassed = diffMin < 0;

      const row = document.createElement("div");
      row.className = "timeline-row";
      row.style.opacity = isPassed ? "0.6" : "1";
      row.innerHTML = `
        <div class="stop-badge-num" style="background: var(--primary-hover);"><i class="fa-solid fa-bus"></i></div>
        <div class="stop-row-info">
          <div class="stop-row-name">Corsa ${tratta.id} (Partenza ${tratta.partenza})</div>
          <div class="stop-row-time">Arrivo alla fermata: ${st}</div>
        </div>
        <span class="hero-line-tag" style="font-size: 0.75rem;">${formatDiffText(diffMin)}</span>
      `;

      row.addEventListener("click", () => {
        tripSelect.value = tratta.id;
        drawRouteForSelectedTripOrDefault();
        updateAllDisplays();
      });

      upcomingList.appendChild(row);
    });
  }

  // === FAVORITES SYSTEM ===
  function updateFavoriteButtonState() {
    if (!btnFavorite) return;
    const lineKey = lineSelect.value;
    const stopId = stopSelect.value;
    const favKey = `${lineKey}:${stopId}`;

    const isFav = favorites.some(f => f.key === favKey);
    btnFavorite.innerHTML = isFav 
      ? '<i class="fa-solid fa-star" style="color: var(--warning);"></i> Preferito' 
      : '<i class="fa-regular fa-star"></i> Preferito';
  }

  function toggleFavorite() {
    const lineKey = lineSelect.value;
    const stopId = stopSelect.value;
    const linea = getCurrentLine();
    if (!linea) return;

    const stop = (linea.stops || []).find(s => s.id === stopId);
    const favKey = `${lineKey}:${stopId}`;

    const idx = favorites.findIndex(f => f.key === favKey);
    if (idx >= 0) {
      favorites.splice(idx, 1);
    } else {
      favorites.push({
        key: favKey,
        lineId: lineKey,
        lineName: linea.nome || lineKey,
        stopId: stopId,
        stopName: stop ? stop.nome : stopId
      });
    }

    localStorage.setItem("bus_favorites", JSON.stringify(favorites));
    updateFavoriteButtonState();
    renderFavorites();
  }

  function renderFavorites() {
    if (!favoritesList) return;

    if (favorites.length === 0) {
      favoritesList.innerHTML = `<div style="text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.88rem;">Nessun preferito salvato. Clicca ⭐ Preferito per salvare!</div>`;
      return;
    }

    favoritesList.innerHTML = "";
    favorites.forEach(fav => {
      const row = document.createElement("div");
      row.className = "timeline-row";
      row.innerHTML = `
        <div class="stop-badge-num" style="background: var(--warning);"><i class="fa-solid fa-star"></i></div>
        <div class="stop-row-info">
          <div class="stop-row-name">${fav.lineName}</div>
          <div class="stop-row-time">${fav.stopName}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
      `;

      row.addEventListener("click", () => {
        lineSelect.value = fav.lineId;
        aggiornaTratteEStops();
        stopSelect.value = fav.stopId;
        updateAllDisplays();
        zoomToSelectedStop();
      });

      favoritesList.appendChild(row);
    });
  }

  // === SEARCH AUTOCOMPLETE ===
  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
      searchResults.innerHTML = "";
      return;
    }

    searchResults.innerHTML = "";
    const results = [];

    Object.keys(SCHEDULES).forEach(key => {
      const linea = SCHEDULES[key];
      const name = linea.nome || key;
      if (name.toLowerCase().includes(query)) {
        results.push({ type: "line", lineId: key, title: name, subtitle: "Linea Navetta" });
      }

      (linea.stops || []).forEach(stop => {
        if (stop.nome.toLowerCase().includes(query)) {
          results.push({ 
            type: "stop", 
            lineId: key, 
            stopId: stop.id, 
            title: stop.nome, 
            subtitle: `Fermata • ${name}` 
          });
        }
      });
    });

    if (results.length === 0) {
      searchResults.innerHTML = `<div style="padding: 1rem; color: var(--text-muted);">Nessun risultato</div>`;
    } else {
      results.slice(0, 10).forEach(res => {
        const item = document.createElement("div");
        item.className = "timeline-row";
        item.style.marginBottom = "0.5rem";
        item.innerHTML = `
          <div class="stop-badge-num" style="background: var(--primary);"><i class="${res.type === 'line' ? 'fa-solid fa-route' : 'fa-solid fa-location-dot'}"></i></div>
          <div class="stop-row-info">
            <div class="stop-row-name">${res.title}</div>
            <div class="stop-row-time">${res.subtitle}</div>
          </div>
        `;

        item.addEventListener("click", () => {
          lineSelect.value = res.lineId;
          aggiornaTratteEStops();
          if (res.type === "stop") {
            stopSelect.value = res.stopId;
            updateAllDisplays();
            zoomToSelectedStop();
          }
          searchModal.classList.remove("active");
        });

        searchResults.appendChild(item);
      });
    }
  }

  // === TIMETABLE MATRIX MODAL ===
  function openTimetableMatrix() {
    const linea = getCurrentLine();
    if (!linea || !timetableMatrix) return;

    modalLineTitle.textContent = linea.nome || `Linea ${lineSelect.value}`;

    const tratte = [...(linea.tratte || [])].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));
    const stops = linea.stops || [];

    let html = `<thead><tr><th>Fermata</th>`;
    tratte.forEach(t => {
      html += `<th>${t.id}<br><small style="font-weight: normal;">ore ${t.partenza || ''}</small></th>`;
    });
    html += `</tr></thead><tbody>`;

    stops.forEach(s => {
      html += `<tr><td class="stop-name-cell">${s.nome}</td>`;
      tratte.forEach(t => {
        const time = t.stopTimes?.[s.id] || "—";
        html += `<td>${time}</td>`;
      });
      html += `</tr>`;
    });

    html += `</tbody>`;
    timetableMatrix.innerHTML = html;

    timetableModal.classList.add("active");
  }

  // === ADMIN & OSRM GENERATOR ===
  async function generateOSRMRouteForCurrentLine() {
    const linea = getCurrentLine();
    if (!linea || !linea.stops || linea.stops.length < 2) {
      alert("Seleziona una linea con almeno 2 fermate!");
      return;
    }

    btnGenerateOSRM.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calcolo OSRM...';

    const pathCoords = await fetchOSRMRoute(linea.stops);
    btnGenerateOSRM.innerHTML = '<i class="fa-solid fa-bolt"></i> Genera rotta stradale OSRM';

    if (!pathCoords) {
      alert("Impossibile calcolare il percorso OSRM.");
      return;
    }

    const formattedJson = `"path": [\n${pathCoords.map(p => `  [${p[0].toFixed(6)}, ${p[1].toFixed(6)}]`).join(",\n")}\n]`;
    adminOutput.value = formattedJson;

    if (staticLayer) {
      L.polyline(pathCoords, { color: "#10b981", weight: 6 }).addTo(staticLayer);
    }
  }

  function toggleGPSRecording() {
    if (!isRecordingGPS) {
      isRecordingGPS = true;
      recordedGPSPath = [];
      btnRecordGPS.innerHTML = '<i class="fa-solid fa-stop"></i> Stop registrazione GPS';
      
      if (navigator.geolocation) {
        gpsWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            recordedGPSPath.push([Number(latitude.toFixed(6)), Number(longitude.toFixed(6))]);
          },
          (err) => alert(`Errore GPS: ${err.message}`),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
    } else {
      isRecordingGPS = false;
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
      btnRecordGPS.innerHTML = '<i class="fa-solid fa-play"></i> Registra traccia GPS';

      const formattedJson = `"path": [\n${recordedGPSPath.map(p => `  [${p[0]}, ${p[1]}]`).join(",\n")}\n]`;
      adminOutput.value = formattedJson;
    }
  }

  // === MAIN DISPLAY LOOP ===
  function updateAllDisplays() {
    const now = getNow();
    const lineKey = lineSelect.value;
    const stopId = stopSelect.value;
    const tripIdSpecific = tripSelect.value || "";

    if (!lineKey || !stopId) return;

    const linea = getCurrentLine();
    const stop = (linea?.stops || []).find(s => s.id === stopId);
    if (stop) heroStopName.textContent = stop.nome;

    const info = findNextTrattaForStop(lineKey, stopId, now, tripIdSpecific);

    if (!info) {
      heroEtaBadge.textContent = "—";
      heroNextTime.textContent = "Nessuna corsa";
      renderTimeline(linea, null, now);
      return;
    }

    const orarioTesto = info.dateStop.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    heroNextTime.textContent = info.tomorrow ? `Domani ore ${orarioTesto}` : `Previsto ore ${orarioTesto}`;
    heroEtaBadge.textContent = formatDiffText(info.diffMin);

    updateBusMarkerForTratta(info.tratta, info.dateStop, info.diffMin, now);
    renderTimeline(linea, info.tratta, now);
    renderUpcomingTrips(linea, stopId, now);
  }

  function startAutoUpdate() {
    if (autoUpdateInterval) clearInterval(autoUpdateInterval);
    autoUpdateInterval = setInterval(updateAllDisplays, 2000);
  }

  function zoomToSelectedStop() {
    const linea = getCurrentLine();
    if (!linea) return;

    const stop = (linea.stops || []).find((s) => s.id === stopSelect.value);
    if (stop && map) map.setView([stop.lat, stop.lng], 16);
  }

  // === BOTTOM NAV SYSTEM ===
  function wireNavSystem() {
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-tab");

        navItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        if (tab === "map") {
          bottomSheet.classList.remove("expanded");
        } else {
          bottomSheet.classList.add("expanded");

          document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
          if (tab === "timeline") document.getElementById("paneTimeline")?.classList.add("active");
          if (tab === "upcoming") document.getElementById("paneUpcoming")?.classList.add("active");
          if (tab === "favorites") document.getElementById("paneFavorites")?.classList.add("active");
        }
      });
    });
  }

  // === BOTTOM SHEET TOUCH EVENTS ===
  function wireBottomSheetEvents() {
    let startY = 0;
    let currentY = 0;

    sheetHandle?.addEventListener("click", () => {
      bottomSheet.classList.toggle("expanded");
    });

    sheetHero?.addEventListener("click", () => {
      bottomSheet.classList.toggle("expanded");
    });
  }

  // === EVENT BINDINGS ===
  function wireMobileEvents() {
    lineSelect.addEventListener("change", aggiornaTratteEStops);
    tripSelect.addEventListener("change", () => {
      drawRouteForSelectedTripOrDefault();
      updateAllDisplays();
    });
    stopSelect.addEventListener("change", () => {
      updateAllDisplays();
      updateFavoriteButtonState();
      zoomToSelectedStop();
    });

    if (btnZoomRoute) btnZoomRoute.addEventListener("click", fitMapToCurrentRouteOrStops);
    if (btnFavorite) btnFavorite.addEventListener("click", toggleFavorite);
    if (btnThemeToggle) btnThemeToggle.addEventListener("click", toggleTheme);

    fabLayer?.addEventListener("click", cycleMapTile);
    fabAdmin?.addEventListener("click", () => adminModal.classList.add("active"));

    // Search overlay
    btnOpenSearch?.addEventListener("click", () => {
      searchModal.classList.add("active");
      searchInput.focus();
    });
    btnCloseSearch?.addEventListener("click", () => searchModal.classList.remove("active"));
    searchInput?.addEventListener("input", handleSearch);

    // Modals
    btnTimetable?.addEventListener("click", openTimetableMatrix);
    closeTimetableModal?.addEventListener("click", () => timetableModal.classList.remove("active"));
    closeAdminModal?.addEventListener("click", () => adminModal.classList.remove("active"));

    btnGenerateOSRM?.addEventListener("click", generateOSRMRouteForCurrentLine);
    btnRecordGPS?.addEventListener("click", toggleGPSRecording);
    btnCopyAdminOutput?.addEventListener("click", () => {
      navigator.clipboard.writeText(adminOutput.value).then(() => {
        alert("✅ JSON copiato negli appunti!");
      });
    });

    // Locate Me FAB
    fabLocate?.addEventListener("click", () => {
      if (!navigator.geolocation) {
        alert("Geolocalizzazione non supportata.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const userLatLng = L.latLng(latitude, longitude);
          const linea = getCurrentLine();

          if (!linea || !linea.stops || !linea.stops.length) return;

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

          if (userMarker) dynamicLayer.removeLayer(userMarker);
          userMarker = L.marker([latitude, longitude])
            .addTo(dynamicLayer)
            .bindPopup(`<b>Sei qui</b><br>Fermata vicina: ${nearestStop.nome} (${Math.round(nearestDistance)} m)`)
            .openPopup();
        },
        (err) => alert(`Impossibile trovare posizione: ${err.message}`)
      );
    });
  }

  // Start app
  init();
})();
