/**
 * ORARI NAVETTE & BUS - CORE APPLICATION LOGIC
 * Includes: Real-time tracking, OSRM free road routing, Visual Timeline,
 * Timetable Matrix, Fuzzy Search, Favorites system & GPS Admin Tools.
 */

(() => {
  // === STATE VARIABLES ===
  let SCHEDULES = {};
  let map = null;
  let staticLayer = null;
  let dynamicLayer = null;
  let busMarker = null;
  let userMarker = null;
  let autoUpdateInterval = null;
  let osrmCache = {}; // Cache for OSRM routes

  // GPS Recording State
  let isRecordingGPS = false;
  let recordedGPSPath = [];
  let gpsWatchId = null;
  let lastGpsSaveTime = 0;

  // Active Map Tiles
  let currentTileLayer = null;
  const MAP_TILES = {
    positron: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  // User Preferences
  let favorites = JSON.parse(localStorage.getItem("bus_favorites") || "[]");

  // === DOM ELEMENTS ===
  const lineSelect = document.getElementById("lineSelect");
  const tripSelect = document.getElementById("tripSelect");
  const stopSelect = document.getElementById("stopSelect");
  
  const etaBadge = document.getElementById("etaBadge");
  const nextRunTime = document.getElementById("nextRunTime");
  const tripStatus = document.getElementById("tripStatus");
  const lineBadge = document.getElementById("lineBadge");
  const btnFavorite = document.getElementById("btnFavorite");

  const timelineList = document.getElementById("timelineList");
  const timelineCount = document.getElementById("timelineCount");
  const upcomingList = document.getElementById("upcomingList");
  const favoritesList = document.getElementById("favoritesList");

  const btnNearestStop = document.getElementById("btnNearestStop");
  const btnZoomRoute = document.getElementById("btnZoomRoute");
  const btnThemeToggle = document.getElementById("btnThemeToggle");

  // Search
  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const clearSearchBtn = document.getElementById("clearSearch");

  // Modals
  const timetableModal = document.getElementById("timetableModal");
  const btnTimetable = document.getElementById("btnTimetable");
  const closeTimetableModal = document.getElementById("closeTimetableModal");
  const timetableMatrix = document.getElementById("timetableMatrix");
  const modalLineTitle = document.getElementById("modalLineTitle");

  const adminModal = document.getElementById("adminModal");
  const btnAdminTools = document.getElementById("btnAdminTools");
  const closeAdminModal = document.getElementById("closeAdminModal");
  const btnGenerateOSRM = document.getElementById("btnGenerateOSRM");
  const btnRecordGPS = document.getElementById("btnRecordGPS");
  const adminOutput = document.getElementById("adminOutput");
  const btnCopyAdminOutput = document.getElementById("btnCopyAdminOutput");

  // Floating Bus Card
  const mapBusCard = document.getElementById("mapBusCard");
  const mapBusLine = document.getElementById("mapBusLine");
  const mapBusNextStop = document.getElementById("mapBusNextStop");
  const mapBusEta = document.getElementById("mapBusEta");

  // Mobile Drawer
  const sidebarPanel = document.getElementById("sidebarPanel");
  const drawerHandle = document.getElementById("drawerHandle");

  // === INITIALIZATION ===
  async function init() {
    initTheme();
    initMap();
    wireEvents();
    wireTabSystem();
    wireMobileDrawer();

    try {
      const res = await fetch("linee.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      SCHEDULES = await res.json();
      populateLinee();
      renderFavorites();
      startAutoUpdate();
    } catch (err) {
      console.error("Errore caricamento linee.json:", err);
      etaBadge.textContent = "Errore";
      tripStatus.textContent = "Impossibile caricare linee.json";
    }
  }

  // === THEME MANAGEMENT ===
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

    // Sync map tiles with theme if on default
    if (newTheme === "dark") {
      switchMapTile("dark");
    } else {
      switchMapTile("positron");
    }
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
      zoomControl: false
    }).setView([41.964795, 12.107508], 13);

    // Zoom control position
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const initialTheme = document.documentElement.getAttribute("data-theme");
    const defaultTile = initialTheme === "dark" ? "dark" : "positron";
    switchMapTile(defaultTile);

    staticLayer = L.featureGroup().addTo(map);
    dynamicLayer = L.layerGroup().addTo(map);

    window.addEventListener("resize", () => map.invalidateSize());
  }

  function switchMapTile(type) {
    if (!map) return;
    if (currentTileLayer) map.removeLayer(currentTileLayer);

    const url = MAP_TILES[type] || MAP_TILES.positron;
    const attrib = type === "satellite" 
      ? "&copy; ESRI World Imagery" 
      : "&copy; OpenStreetMap contributors &copy; CARTO";

    currentTileLayer = L.tileLayer(url, { maxZoom: 19, attribution: attrib }).addTo(map);

    // Update active button state
    document.querySelectorAll(".layer-btn").forEach(btn => btn.classList.remove("active"));
    if (type === "positron") document.getElementById("btnLayerPositron")?.classList.add("active");
    if (type === "dark") document.getElementById("btnLayerDark")?.classList.add("active");
    if (type === "satellite") document.getElementById("btnLayerSatellite")?.classList.add("active");
  }

  // === OSRM FREE ROUTING ENGINE ===
  /**
   * Fetches road route polyline from Open Source Routing Machine (OSRM)
   * 100% Free - No API Key Required!
   */
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
        // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
        const latLngs = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        osrmCache[cacheKey] = latLngs;
        return latLngs;
      }
    } catch (err) {
      console.warn("OSRM routing fallito, fallback a linee rette:", err);
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
    if (diffMin > 1) return `Tra ${diffMin} min`;
    if (diffMin === 1) return "Tra 1 min";
    if (diffMin === 0) return "In arrivo";
    const ago = Math.abs(diffMin);
    return ago === 1 ? "1 min fa" : `${ago} min fa`;
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

    lineBadge.textContent = linea.nome || `Linea ${lineSelect.value}`;
    if (linea.colore) lineBadge.style.backgroundColor = linea.colore;

    tripSelect.innerHTML = '<option value="">(Usa corsa attuale in tempo reale)</option>';
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

    // 1. Check if explicit manual path exists
    if (tratta && Array.isArray(tratta.path) && tratta.path.length > 1) {
      pathCoords = tratta.path;
    } 
    // 2. Otherwise fetch road path via OSRM API
    else if (linea.stops && linea.stops.length > 1) {
      pathCoords = await fetchOSRMRoute(linea.stops);
    }

    // Fallback: draw straight lines between stops if no path found
    if (!pathCoords) {
      pathCoords = (linea.stops || []).map(s => [s.lat, s.lng]);
    }

    if (pathCoords && pathCoords.length > 1) {
      L.polyline(pathCoords, {
        color: linea.colore || "#2563eb",
        weight: 5,
        opacity: 0.85,
        smoothFactor: 1.5
      }).addTo(staticLayer);
    }

    // Draw Stop Markers with Custom HTML Badges
    (linea.stops || []).forEach((s, idx) => {
      const isSelected = s.id === stopSelect.value;
      const markerHtml = `<div class="stop-marker-pin ${isSelected ? 'active' : ''}">${idx + 1}</div>`;
      
      const customIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const m = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(staticLayer);
      m.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px;">
          <strong style="font-size: 0.95rem; color: #0f172a;">${s.nome}</strong><br>
          <span style="font-size: 0.8rem; color: #64748b;">Fermata #${idx + 1} • Linea ${linea.nome || ''}</span>
        </div>
      `);

      m.on("click", () => {
        stopSelect.value = s.id;
        updateAllDisplays();
      });
    });

    fitMapToCurrentRouteOrStops();
  }

  function fitMapToCurrentRouteOrStops() {
    if (!map || !staticLayer) return;
    try {
      const bounds = staticLayer.getBounds();
      if (bounds && bounds.isValid()) {
        map.fitBounds(bounds.pad(0.15));
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

    // Render Custom Bus DivIcon
    const busIcon = L.divIcon({
      className: 'bus-marker-wrapper',
      html: `<div class="bus-marker-icon"><i class="fa-solid fa-bus"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(dynamicLayer);
    busMarker.bindPopup(`
      <div style="font-family: Inter, sans-serif; padding: 4px;">
        <strong style="color: #2563eb;">Bus Corsa: ${tratta.id}</strong><br>
        Prossima fermata: <b>${next.nome}</b><br>
        Stato: ${formatDiffText(diffMin)}
      </div>
    `);

    // Update Floating Bus Card on Map
    if (mapBusCard) {
      mapBusCard.style.display = "block";
      mapBusLine.textContent = `Corsa ${tratta.id}`;
      mapBusNextStop.textContent = `Prossima: ${next.nome}`;
      mapBusEta.textContent = formatDiffText(diffMin);
    }
  }

  // === RENDER TIMELINE ===
  function renderTimeline(linea, currentTratta, now) {
    if (!timelineList || !linea || !linea.stops) return;

    timelineList.innerHTML = "";
    timelineCount.textContent = `${linea.stops.length} fermate`;

    const stopTimes = currentTratta ? (currentTratta.stopTimes || {}) : {};

    linea.stops.forEach((stop, index) => {
      const timeStr = stopTimes[stop.id] || "--:--";
      const isSelected = stop.id === stopSelect.value;
      
      let isPassed = false;
      if (currentTratta && stopTimes[stop.id]) {
        const stopDate = hhmmToDateOnOrAfter(stopTimes[stop.id], now);
        if (stopDate < now) isPassed = true;
      }

      const item = document.createElement("div");
      item.className = `timeline-item ${isSelected ? 'active' : ''} ${isPassed ? 'passed' : ''}`;
      item.innerHTML = `
        <div class="timeline-marker">${isPassed ? '<i class="fa-solid fa-check"></i>' : index + 1}</div>
        <div class="timeline-info">
          <span class="timeline-stop-name">${stop.nome}</span>
          <span class="timeline-stop-time"><i class="fa-regular fa-clock"></i> Orario: ${timeStr}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        stopSelect.value = stop.id;
        updateAllDisplays();
        zoomToSelectedStop();
      });

      timelineList.appendChild(item);
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

      const item = document.createElement("div");
      item.className = "upcoming-item";
      item.style.opacity = isPassed ? "0.6" : "1";
      item.innerHTML = `
        <div>
          <strong>${tratta.id}</strong> - Partenza ${tratta.partenza}<br>
          <small style="color: var(--text-muted);">Arrivo alla fermata: ${st}</small>
        </div>
        <span class="line-badge" style="font-size: 0.75rem;">${formatDiffText(diffMin)}</span>
      `;

      item.addEventListener("click", () => {
        tripSelect.value = tratta.id;
        drawRouteForSelectedTripOrDefault();
        updateAllDisplays();
      });

      upcomingList.appendChild(item);
    });
  }

  // === FAVORITES SYSTEM ===
  function updateFavoriteButtonState() {
    if (!btnFavorite) return;
    const lineKey = lineSelect.value;
    const stopId = stopSelect.value;
    const favKey = `${lineKey}:${stopId}`;

    const isFav = favorites.some(f => f.key === favKey);
    btnFavorite.classList.toggle("active", isFav);
    btnFavorite.innerHTML = isFav 
      ? '<i class="fa-solid fa-star" style="color: var(--warning);"></i>' 
      : '<i class="fa-regular fa-star"></i>';
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
      favoritesList.innerHTML = `
        <div class="empty-state">
          <i class="fa-regular fa-star"></i>
          <p>Nessun preferito salvato.<br>Clicca la stella per salvare linee e fermate!</p>
        </div>
      `;
      return;
    }

    favoritesList.innerHTML = "";
    favorites.forEach(fav => {
      const item = document.createElement("div");
      item.className = "fav-item";
      item.innerHTML = `
        <div>
          <strong style="color: var(--primary);">${fav.lineName}</strong><br>
          <small>${fav.stopName}</small>
        </div>
        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;"></i>
      `;

      item.addEventListener("click", () => {
        lineSelect.value = fav.lineId;
        aggiornaTratteEStops();
        stopSelect.value = fav.stopId;
        updateAllDisplays();
        zoomToSelectedStop();
      });

      favoritesList.appendChild(item);
    });
  }

  // === SEARCH AUTOCOMPLETE ===
  function handleSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) {
      searchResults.style.display = "none";
      clearSearchBtn.style.display = "none";
      return;
    }

    clearSearchBtn.style.display = "block";
    searchResults.innerHTML = "";

    const results = [];

    // Search Lines
    Object.keys(SCHEDULES).forEach(key => {
      const linea = SCHEDULES[key];
      const name = linea.nome || key;
      if (name.toLowerCase().includes(query)) {
        results.push({ type: "line", lineId: key, title: name, subtitle: "Linea navetta" });
      }

      // Search Stops inside Lines
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
      searchResults.innerHTML = `<div class="search-result-item" style="color: var(--text-muted);">Nessun risultato trovato</div>`;
    } else {
      results.slice(0, 8).forEach(res => {
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.innerHTML = `
          <i class="${res.type === 'line' ? 'fa-solid fa-route' : 'fa-solid fa-location-dot'}"></i>
          <div>
            <div class="sr-title">${res.title}</div>
            <div class="sr-subtitle">${res.subtitle}</div>
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
          searchResults.style.display = "none";
          searchInput.value = "";
        });

        searchResults.appendChild(item);
      });
    }

    searchResults.style.display = "block";
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

  // === ADMIN & OSRM FREE ROUTING GENERATOR ===
  async function generateOSRMRouteForCurrentLine() {
    const linea = getCurrentLine();
    if (!linea || !linea.stops || linea.stops.length < 2) {
      alert("Seleziona una linea con almeno 2 fermate!");
      return;
    }

    btnGenerateOSRM.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calcolo percorso OSRM in corso...';

    const pathCoords = await fetchOSRMRoute(linea.stops);
    btnGenerateOSRM.innerHTML = '<i class="fa-solid fa-bolt"></i> Calcola percorso stradale per la linea selezionata';

    if (!pathCoords) {
      alert("Impossibile calcolare il percorso OSRM.");
      return;
    }

    const formattedJson = `"path": [\n${pathCoords.map(p => `  [${p[0].toFixed(6)}, ${p[1].toFixed(6)}]`).join(",\n")}\n]`;
    adminOutput.value = formattedJson;

    // Draw on map preview
    if (staticLayer) {
      L.polyline(pathCoords, { color: "#10b981", weight: 6, opacity: 0.9 }).addTo(staticLayer);
    }
  }

  function toggleGPSRecording() {
    if (!isRecordingGPS) {
      isRecordingGPS = true;
      recordedGPSPath = [];
      btnRecordGPS.innerHTML = '<i class="fa-solid fa-stop"></i> Ferma registrazione GPS';
      btnRecordGPS.classList.replace("btn-secondary", "btn-primary");
      lastGpsSaveTime = 0;

      if (navigator.geolocation) {
        gpsWatchId = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const now = Date.now();
            if (now - lastGpsSaveTime >= 5000 || recordedGPSPath.length === 0) {
              recordedGPSPath.push([Number(latitude.toFixed(6)), Number(longitude.toFixed(6))]);
              lastGpsSaveTime = now;
              console.log("📍 Punto GPS salvato:", latitude, longitude);
            }
          },
          (err) => alert(`Errore GPS: ${err.message}`),
          { enableHighAccuracy: true, timeout: 5000 }
        );
      } else {
        alert("Geolocalizzazione non supportata!");
      }
    } else {
      isRecordingGPS = false;
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      gpsWatchId = null;
      btnRecordGPS.innerHTML = '<i class="fa-solid fa-play"></i> Inizia registrazione GPS';
      btnRecordGPS.classList.replace("btn-primary", "btn-secondary");

      const formattedJson = `"path": [\n${recordedGPSPath.map(p => `  [${p[0]}, ${p[1]}]`).join(",\n")}\n]`;
      adminOutput.value = formattedJson;
    }
  }

  // === MAIN DISPLAY UPDATE LOOP ===
  function updateAllDisplays() {
    const now = getNow();
    const lineKey = lineSelect.value;
    const stopId = stopSelect.value;
    const tripIdSpecific = tripSelect.value || "";

    if (!lineKey || !stopId) {
      etaBadge.textContent = "—";
      nextRunTime.textContent = "—";
      tripStatus.textContent = "";
      return;
    }

    const linea = getCurrentLine();
    const info = findNextTrattaForStop(lineKey, stopId, now, tripIdSpecific);

    if (!info) {
      etaBadge.textContent = "—";
      nextRunTime.textContent = "Nessuna corsa";
      tripStatus.textContent = "Nessun orario previsto per oggi";
      renderTimeline(linea, null, now);
      return;
    }

    const orarioTesto = info.dateStop.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    nextRunTime.textContent = info.tomorrow ? `${orarioTesto} (domani)` : orarioTesto;
    etaBadge.textContent = formatDiffText(info.diffMin);
    tripStatus.textContent = info.forced 
      ? `Corsa selezionata: ${info.tratta.id}` 
      : `Prossima corsa automatica: ${info.tratta.id}`;

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

  // === UI EVENT BINDINGS ===
  function wireEvents() {
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

    // Tile map selectors
    document.getElementById("btnLayerPositron")?.addEventListener("click", () => switchMapTile("positron"));
    document.getElementById("btnLayerDark")?.addEventListener("click", () => switchMapTile("dark"));
    document.getElementById("btnLayerSatellite")?.addEventListener("click", () => switchMapTile("satellite"));

    // Search events
    searchInput?.addEventListener("input", handleSearch);
    clearSearchBtn?.addEventListener("click", () => {
      searchInput.value = "";
      searchResults.style.display = "none";
      clearSearchBtn.style.display = "none";
    });

    // Modals
    btnTimetable?.addEventListener("click", openTimetableMatrix);
    closeTimetableModal?.addEventListener("click", () => timetableModal.classList.remove("active"));
    timetableModal?.addEventListener("click", (e) => {
      if (e.target === timetableModal) timetableModal.classList.remove("active");
    });

    btnAdminTools?.addEventListener("click", () => adminModal.classList.add("active"));
    closeAdminModal?.addEventListener("click", () => adminModal.classList.remove("active"));
    adminModal?.addEventListener("click", (e) => {
      if (e.target === adminModal) adminModal.classList.remove("active");
    });

    btnGenerateOSRM?.addEventListener("click", generateOSRMRouteForCurrentLine);
    btnRecordGPS?.addEventListener("click", toggleGPSRecording);
    btnCopyAdminOutput?.addEventListener("click", () => {
      navigator.clipboard.writeText(adminOutput.value).then(() => {
        alert("✅ JSON registrato/generato copiato negli appunti!");
      });
    });

    // Nearest Stop Geolocation Button
    if (btnNearestStop) {
      btnNearestStop.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert("La geolocalizzazione non è supportata dal browser.");
          return;
        }

        btnNearestStop.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Localizzazione...';

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            btnNearestStop.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Trova fermata più vicina';
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

            if (userMarker) dynamicLayer.removeLayer(userMarker);
            userMarker = L.marker([latitude, longitude], { title: "La tua posizione" })
              .addTo(dynamicLayer)
              .bindPopup(`<b>Sei qui</b><br>Fermata vicina: <b>${nearestStop.nome}</b> (${Math.round(nearestDistance)} metri)`)
              .openPopup();
          },
          (err) => {
            btnNearestStop.innerHTML = '<i class="fa-solid fa-crosshairs"></i> Trova fermata più vicina';
            alert(`Impossibile ottenere la posizione: ${err.message}`);
          }
        );
      });
    }
  }

  // === TAB SWITCHER ===
  function wireTabSystem() {
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-tab");
        tabBtns.forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(`tab-${targetTab}`)?.classList.add("active");
      });
    });
  }

  // === MOBILE DRAWER TOGGLE ===
  function wireMobileDrawer() {
    if (drawerHandle && sidebarPanel) {
      drawerHandle.addEventListener("click", () => {
        sidebarPanel.classList.toggle("expanded");
      });
    }
  }

  // Start app
  init();
})();
