/**
 * ORARI NAVETTE & BUS - MOBILE-FIRST JAVASCRIPT ENGINE (V2.0)
 * Gestione completa linee, fermate sequenziali, orari feriali/sabato/festivi,
 * calendario festività, rotte OSRM con senso di marcia e ricerca avanzata.
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
  let stopMarkersMap = {}; // Maps stopId -> L.Marker

  // Route Editor State
  let isEditorActive = false;
  let editorWaypoints = [];
  let editorSnappedPath = [];
  let editorSnapEnabled = true;
  let editorLayerGroup = null;
  let editorPolyline = null;

  function getCustomRoutePath(lineKey) {
    if (!lineKey) return null;
    try {
      const stored = localStorage.getItem(`custom_route_path_${lineKey}`);
      if (stored) return JSON.parse(stored);
    } catch {
      return null;
    }
    return null;
  }

  // Day filter: 'oggi' | 'lun_ven' | 'sabato' | 'domenica'
  let selectedDayFilter = "oggi";
  let currentModalDayTab = "lun_ven";

  // Dynamic contrast calculation (WCAG AA compliant)
  function getContrastTextColor(hexColor) {
    if (!hexColor) return "#ffffff";
    let hex = hexColor.replace("#", "").trim();
    if (hex.length === 3) {
      hex = hex.split("").map(c => c + c).join("");
    }
    if (hex.length !== 6) return "#ffffff";
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    const L = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    return L > 0.18 ? "#0f172a" : "#ffffff";
  }

  // GPS State
  let isRecordingGPS = false;
  let recordedGPSPath = [];
  let gpsWatchId = null;

  // CARTO Basemaps API Key Configuration
  let cartoApiKey = localStorage.getItem("carto_api_key") || "cb1_2vji_1_325c3790be83c78e3c85fe40";
  let currentTileLayer = null;
  let currentTileType = "positron";

  function getMapTileUrl(type) {
    const keyParam = cartoApiKey ? `?key=${encodeURIComponent(cartoApiKey)}` : "";
    if (type === "dark") {
      return cartoApiKey
        ? `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png${keyParam}`
        : `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`;
    }
    if (type === "satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    if (type === "osm") {
      return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
    return cartoApiKey
      ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${keyParam}`
      : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  }

  // Storage for Favorites
  function getStoredFavorites() {
    try {
      return JSON.parse(localStorage.getItem("bus_favorites") || "[]");
    } catch {
      return [];
    }
  }
  let favorites = getStoredFavorites();

  // Storage for OSRM Cache across reloads
  function initOsrmCache() {
    try {
      const stored = localStorage.getItem("bus_osrm_cache");
      if (stored) osrmCache = JSON.parse(stored);
    } catch {
      osrmCache = {};
    }
  }
  function saveOsrmCache() {
    try {
      localStorage.setItem("bus_osrm_cache", JSON.stringify(osrmCache));
    } catch (e) {
      console.warn("Storage quota per OSRM superata:", e);
    }
  }
  initOsrmCache();

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

  // Day buttons
  const dayPillBtns = document.querySelectorAll(".day-pill-btn");
  const serviceAlertBanner = document.getElementById("serviceAlertBanner");
  const serviceAlertText = document.getElementById("serviceAlertText");

  // Route Details Card
  const btnToggleRouteDetails = document.getElementById("btnToggleRouteDetails");
  const routeDetailsBody = document.getElementById("routeDetailsBody");
  const routeDetailsChevron = document.getElementById("routeDetailsChevron");
  const routeFullPathText = document.getElementById("routeFullPathText");
  const routeNotesWrapper = document.getElementById("routeNotesWrapper");
  const routeNotesList = document.getElementById("routeNotesList");

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

  // Timetable Modal
  const timetableModal = document.getElementById("timetableModal");
  const btnTimetable = document.getElementById("btnTimetable");
  const closeTimetableModal = document.getElementById("closeTimetableModal");
  const timetableMatrix = document.getElementById("timetableMatrix");
  const modalLineTitle = document.getElementById("modalLineTitle");
  const modalTimetableTabs = document.querySelectorAll("#modalTimetableTabs .modal-tab-btn");
  const timetableEmptyMsg = document.getElementById("timetableEmptyMsg");
  const timetableNotesContainer = document.getElementById("timetableNotesContainer");
  const timetableNotesList = document.getElementById("timetableNotesList");

  // Admin Modal
  const adminModal = document.getElementById("adminModal");
  const closeAdminModal = document.getElementById("closeAdminModal");
  const btnGenerateOSRM = document.getElementById("btnGenerateOSRM");
  const btnRecordGPS = document.getElementById("btnRecordGPS");
  const adminOutput = document.getElementById("adminOutput");
  const btnCopyAdminOutput = document.getElementById("btnCopyAdminOutput");

  // Route Editor Elements
  const btnRouteEditor = document.getElementById("btnRouteEditor");
  const routeEditorToolbar = document.getElementById("routeEditorToolbar");
  const editorLineName = document.getElementById("editorLineName");
  const editorPointCount = document.getElementById("editorPointCount");
  const btnCloseEditor = document.getElementById("btnCloseEditor");
  const btnEditorUndo = document.getElementById("btnEditorUndo");
  const btnEditorSnap = document.getElementById("btnEditorSnap");
  const btnEditorClear = document.getElementById("btnEditorClear");
  const btnEditorSave = document.getElementById("btnEditorSave");
  const editorHintText = document.getElementById("editorHintText");

  // Route Saved Modal Elements
  const routeSavedModal = document.getElementById("routeSavedModal");
  const closeRouteSavedModal = document.getElementById("closeRouteSavedModal");
  const savedRouteLineTitle = document.getElementById("savedRouteLineTitle");
  const btnCopySavedRouteJson = document.getElementById("btnCopySavedRouteJson");
  const btnDownloadSavedRouteGeoJson = document.getElementById("btnDownloadSavedRouteGeoJson");
  const btnResetCustomRoute = document.getElementById("btnResetCustomRoute");

  // === EASTER / PASQUETTA COMPUTUS ===
  function getEasterAndPasquetta(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    const easter = new Date(year, month - 1, day);
    const pasquetta = new Date(year, month - 1, day + 1);
    return { easter, pasquetta };
  }

  // === HOLIDAY & SUSPENSION CHECKER (da no corse.jpg) ===
  function checkHolidayStatus(date) {
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const mmdd = `${mm}-${dd}`;
    const year = date.getFullYear();

    const sospensioniFisse = [
      "01-01", // Capodanno
      "01-06", // Epifania
      "04-25", // Liberazione
      "05-01", // Festa Lavoro
      "06-02", // Festa Repubblica
      "08-15", // Ferragosto
      "11-01", // Ognissanti
      "12-08", // Immacolata
      "12-25", // Natale
      "12-26"  // Santo Stefano
    ];

    if (sospensioniFisse.includes(mmdd)) {
      return { suspended: true, reason: "Giorno festivo: nessun servizio navette (come da orario ufficiale)" };
    }

    // Controllo Pasqua e Pasquetta
    const { easter, pasquetta } = getEasterAndPasquetta(year);
    if (
      (date.getMonth() === easter.getMonth() && date.getDate() === easter.getDate()) ||
      (date.getMonth() === pasquetta.getMonth() && date.getDate() === pasquetta.getDate())
    ) {
      return { suspended: true, reason: "Pasqua / Lunedì dell'Angelo: nessun servizio navette" };
    }

    // Chiusura anticipata 24 e 31 dicembre
    if (mmdd === "12-24" || mmdd === "12-31") {
      return { suspended: false, earlyClose: true, reason: "Vigilia: il servizio termina anticipatamente alle ore 19:00" };
    }

    return { suspended: false, earlyClose: false, reason: "" };
  }

  // Resolves the effective schedule key: 'lun_ven' | 'sabato' | 'domenica'
  function resolveEffectiveDayKey(nowDate = new Date()) {
    if (selectedDayFilter === "lun_ven") return "lun_ven";
    if (selectedDayFilter === "sabato") return "sabato";
    if (selectedDayFilter === "domenica") return "domenica";

    // 'oggi' in tempo reale:
    const dayOfWeek = nowDate.getDay();
    if (dayOfWeek === 0) return "domenica";
    if (dayOfWeek === 6) return "sabato";
    return "lun_ven";
  }

  // === INIT ===
  async function init() {
    initTheme();
    initMap();
    wireMobileEvents();
    wireNavSystem();
    wireBottomSheetEvents();
    wireDayFilterEvents();
    wireRouteDetailsToggle();

    try {
      const res = await fetch("linee.json", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      SCHEDULES = json.linee || json;
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
        ? '<i class="fa-solid fa-sun" aria-hidden="true"></i>' 
        : '<i class="fa-solid fa-moon" aria-hidden="true"></i>';
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
    const url = getMapTileUrl(type);
    currentTileLayer = L.tileLayer(url, { maxZoom: 19 }).addTo(map);
  }

  function cycleMapTile() {
    if (currentTileType === "positron" || currentTileType === "osm") switchMapTile("dark");
    else if (currentTileType === "dark") switchMapTile("satellite");
    else switchMapTile("positron");
  }

  // === OSRM FREE ROAD ROUTING ENGINE WITH DIRECTION PRESERVATION ===
  async function fetchOSRMRoute(stops) {
    if (!stops || stops.length < 2) return null;

    // Create a stable cache key based on the ordered stops sequence
    const cacheKey = stops.map(s => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`).join(";");
    if (osrmCache[cacheKey]) return osrmCache[cacheKey];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      // Limita il campionamento a massimo 25 waypoints per rispettare l'URL OSRM garantendo precisione
      let sampledStops = stops;
      if (stops.length > 25) {
        sampledStops = [];
        const step = (stops.length - 1) / 24;
        for (let i = 0; i < 25; i++) {
          const idx = Math.min(stops.length - 1, Math.round(i * step));
          if (!sampledStops.includes(stops[idx])) {
            sampledStops.push(stops[idx]);
          }
        }
        if (sampledStops[sampledStops.length - 1] !== stops[stops.length - 1]) {
          sampledStops.push(stops[stops.length - 1]);
        }
      }

      const coordinatesParam = sampledStops.map(s => `${s.lng.toFixed(6)},${s.lat.toFixed(6)}`).join(";");
      const url = `https://router.project-osrm.org/route/v1/driving/${coordinatesParam}?overview=full&geometries=geojson`;

      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) throw new Error("OSRM Routing failed");

      const data = await response.json();
      if (data.routes && data.routes.length > 0) {
        const latLngs = data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
        osrmCache[cacheKey] = latLngs;
        saveOsrmCache();
        return latLngs;
      }
    } catch (err) {
      console.warn("OSRM routing fallito o timeout, uso tracciato sequenziale nativo:", err);
    }
    return null;
  }

  // === TIME HELPERS ===
  function getNow() {
    return new Date();
  }

  function hhmmToMinutes(hhmm) {
    if (!hhmm) return 0;
    const clean = String(hhmm).replace(/[^0-9:]/g, "");
    const [h, m] = clean.split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function minutesToHHMM(totalMinutes) {
    const normalized = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
    const h = String(Math.floor(normalized / 60)).padStart(2, "0");
    const m = String(normalized % 60).padStart(2, "0");
    return `${h}:${m}`;
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

  // Returns trips array for current line and current active day key
  function getActiveTratteForCurrentLine() {
    const linea = getCurrentLine();
    if (!linea) return [];
    const dayKey = resolveEffectiveDayKey();
    if (linea.orari && Array.isArray(linea.orari[dayKey])) {
      return linea.orari[dayKey];
    }
    return linea.tratte || [];
  }

  // Estimates intermediate stop arrival time proportionally between timing points
  function getEstimatedStopTime(tratta, stopId, linea) {
    if (!tratta || !tratta.stopTimes || !linea || !linea.stops) return null;

    // 1. Explicit time
    if (tratta.stopTimes[stopId]) {
      return { time: tratta.stopTimes[stopId], estimated: false };
    }

    // 2. Linear proportional interpolation between timing points
    const stops = linea.stops;
    const targetIdx = stops.findIndex(s => s.id === stopId);
    if (targetIdx === -1) return null;

    // Find previous timing stop with known time
    let prevIdx = -1;
    let prevTimeMin = null;
    for (let i = targetIdx - 1; i >= 0; i--) {
      if (tratta.stopTimes[stops[i].id]) {
        prevIdx = i;
        prevTimeMin = hhmmToMinutes(tratta.stopTimes[stops[i].id]);
        break;
      }
    }

    // Find next timing stop with known time
    let nextIdx = -1;
    let nextTimeMin = null;
    for (let i = targetIdx + 1; i < stops.length; i++) {
      if (tratta.stopTimes[stops[i].id]) {
        nextIdx = i;
        nextTimeMin = hhmmToMinutes(tratta.stopTimes[stops[i].id]);
        break;
      }
    }

    if (prevIdx !== -1 && nextIdx !== -1 && nextTimeMin !== null && prevTimeMin !== null) {
      if (nextTimeMin < prevTimeMin) nextTimeMin += 1440; // Midnight rollover
      const fraction = (targetIdx - prevIdx) / (nextIdx - prevIdx);
      const estMin = prevTimeMin + fraction * (nextTimeMin - prevTimeMin);
      return { time: minutesToHHMM(estMin), estimated: true };
    }

    if (prevIdx !== -1 && prevTimeMin !== null) {
      return { time: minutesToHHMM(prevTimeMin + (targetIdx - prevIdx) * 2), estimated: true };
    }

    return null;
  }

  // === POPULATE SELECTORS & UI ===
  function populateLinee() {
    lineSelect.innerHTML = "";

    const keys = Object.keys(SCHEDULES).filter(k => k !== "calendario_servizio");
    keys.forEach((key) => {
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

    // Update Line Badge Color
    const badgeTextColor = getContrastTextColor(linea.colore);
    heroLineBadge.innerHTML = `<i class="fa-solid fa-bus" aria-hidden="true"></i> ${linea.nome || 'Linea ' + lineSelect.value}`;
    if (linea.colore) {
      heroLineBadge.style.backgroundColor = linea.colore;
      heroLineBadge.style.color = badgeTextColor;
    } else {
      heroLineBadge.style.backgroundColor = "";
      heroLineBadge.style.color = "";
    }

    // Update Route Details Card
    if (routeFullPathText) {
      routeFullPathText.textContent = linea.percorso_ufficiale || "Percorso circolare ordinario.";
    }
    if (routeNotesList && routeNotesWrapper) {
      if (Array.isArray(linea.note) && linea.note.length > 0) {
        routeNotesWrapper.style.display = "block";
        routeNotesList.innerHTML = linea.note.map(n => `<li>${n}</li>`).join("");
      } else {
        routeNotesWrapper.style.display = "none";
        routeNotesList.innerHTML = "";
      }
    }

    // Populate Trips for Active Day
    const activeTratte = getActiveTratteForCurrentLine();
    tripSelect.innerHTML = '<option value="">(Corsa in tempo reale)</option>';
    activeTratte.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      const noteBadge = t.note ? ` ${t.note}` : "";
      opt.textContent = `${t.id} - Partenza ore ${t.partenza || "--:--"}${noteBadge}`;
      tripSelect.appendChild(opt);
    });

    // Populate Stops in strict chronological order
    stopSelect.innerHTML = "";
    (linea.stops || []).forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = s.nome;
      stopSelect.appendChild(opt);
    });

    updateServiceAlertBanner();
    updateFavoriteButtonState();
    drawRouteForSelectedTripOrDefault();
    updateAllDisplays();
  }

  // Updates Service Status Banner (Holidays, Sunday closures, Early termination)
  function updateServiceAlertBanner() {
    if (!serviceAlertBanner || !serviceAlertText) return;

    const now = getNow();
    const holidayInfo = checkHolidayStatus(now);
    const dayKey = resolveEffectiveDayKey(now);
    const linea = getCurrentLine();
    const tratte = getActiveTratteForCurrentLine();

    if (selectedDayFilter === "oggi" && holidayInfo.suspended) {
      serviceAlertBanner.style.display = "flex";
      serviceAlertBanner.className = "service-alert-banner alert-danger";
      serviceAlertText.textContent = holidayInfo.reason;
      return;
    }

    if (tratte.length === 0) {
      serviceAlertBanner.style.display = "flex";
      serviceAlertBanner.className = "service-alert-banner alert-warning";
      const dayLabel = dayKey === "domenica" ? "la domenica e nei giorni festivi" : (dayKey === "sabato" ? "il sabato" : "nei giorni selezionati");
      serviceAlertText.textContent = `Nessun servizio programmato per la ${linea?.nome || 'linea'} ${dayLabel}.`;
      return;
    }

    if (selectedDayFilter === "oggi" && holidayInfo.earlyClose) {
      serviceAlertBanner.style.display = "flex";
      serviceAlertBanner.className = "service-alert-banner alert-info";
      serviceAlertText.textContent = holidayInfo.reason;
      return;
    }

    serviceAlertBanner.style.display = "none";
    serviceAlertText.textContent = "";
  }

  // === DRAW MAP ROUTE & STOPS IN DIRECTION OF TRAVEL ===
  async function drawRouteForSelectedTripOrDefault() {
    if (!staticLayer) return;
    staticLayer.clearLayers();
    if (dynamicLayer) dynamicLayer.clearLayers();
    busMarker = null;
    stopMarkersMap = {};

    const linea = getCurrentLine();
    if (!linea) return;

    // 1. Draw stop markers sequentially
    (linea.stops || []).forEach((s, idx) => {
      const isSelected = s.id === stopSelect.value;
      const isTimingPoint = Boolean(s.timing);
      const pinClass = `stop-marker-pin ${isSelected ? 'active' : ''} ${isTimingPoint ? 'timing-point' : ''}`;
      const markerHtml = `<div class="${pinClass}">${idx + 1}</div>`;
      
      const customIcon = L.divIcon({
        className: 'custom-stop-icon',
        html: markerHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const m = L.marker([s.lat, s.lng], { icon: customIcon }).addTo(staticLayer);
      const timingLabel = isTimingPoint ? ' <span style="color:var(--primary); font-weight:700;">(Fermata Oraria)</span>' : '';
      m.bindPopup(`<b>${s.nome}</b>${timingLabel}<br><small style="color:var(--text-muted);">Fermata #${idx + 1} • ${s.via || ''}</small>`);

      m.on("click", () => {
        selectStop(s.id, true);
      });

      stopMarkersMap[s.id] = m;
    });

    fitMapToCurrentRouteOrStops();

    // 2. Trace route polyline with direction flow
    const activeTratte = getActiveTratteForCurrentLine();
    const selectedTripId = tripSelect.value;
    let tratta = selectedTripId 
      ? activeTratte.find((t) => t.id === selectedTripId) 
      : activeTratte[0];

    let pathCoords = null;

    // A. Check for user-customized path first (highest priority)
    const customPath = getCustomRoutePath(lineSelect.value);
    if (customPath && customPath.length > 1) {
      pathCoords = customPath;
    } else if (tratta && Array.isArray(tratta.path) && tratta.path.length > 1) {
      pathCoords = tratta.path;
    } else if (linea && Array.isArray(linea.path) && linea.path.length > 1) {
      pathCoords = linea.path;
    }

    if (pathCoords && pathCoords.length > 1) {
      // Base road line
      L.polyline(pathCoords, {
        color: linea.colore || "#2563eb",
        weight: 5,
        opacity: 0.88,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(staticLayer);

      // Direction flow dashes
      L.polyline(pathCoords, {
        color: "#ffffff",
        weight: 2,
        opacity: 0.7,
        dashArray: "6, 12",
        className: "animated-route-flow"
      }).addTo(staticLayer);
      return;
    }

    if (linea.stops && linea.stops.length > 1) {
      // Draw fallback straight lines along sequential stops
      const fallbackPolyline = L.polyline((linea.stops || []).map(s => [s.lat, s.lng]), {
        color: linea.colore || "#2563eb",
        weight: 5,
        opacity: 0.85,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(staticLayer);

      // Asynchronously fetch road-following geometry
      pathCoords = await fetchOSRMRoute(linea.stops);
      if (pathCoords && pathCoords.length > 1) {
        staticLayer.removeLayer(fallbackPolyline);
        
        // Base road line
        L.polyline(pathCoords, {
          color: linea.colore || "#2563eb",
          weight: 5,
          opacity: 0.88,
          lineCap: "round",
          lineJoin: "round"
        }).addTo(staticLayer);

        // Direction flow dashes
        L.polyline(pathCoords, {
          color: "#ffffff",
          weight: 2,
          opacity: 0.7,
          dashArray: "6, 12",
          className: "animated-route-flow"
        }).addTo(staticLayer);
      }
      return;
    }
  }

  // Fast, flicker-free active pin updating
  function updateActiveStopMarkerPin(selectedStopId) {
    if (!stopMarkersMap) return;
    Object.keys(stopMarkersMap).forEach((stopId) => {
      const marker = stopMarkersMap[stopId];
      if (!marker) return;
      const el = marker.getElement ? marker.getElement() : marker._icon;
      if (el) {
        const pin = el.querySelector(".stop-marker-pin");
        if (pin) {
          if (stopId === selectedStopId) {
            pin.classList.add("active");
            el.style.zIndex = "1000";
          } else {
            pin.classList.remove("active");
            el.style.zIndex = "";
          }
        }
      }
    });
  }

  // === NEXT TRATTA CALCULATOR ===
  function findActiveOrNextTrattaForLine(linea, nowDate, tripIdSpecific = "") {
    const activeTratte = getActiveTratteForCurrentLine();
    if (!activeTratte.length) return null;

    const sorted = [...activeTratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));
    if (tripIdSpecific) {
      const specific = sorted.find((t) => t.id === tripIdSpecific);
      if (specific) return specific;
    }

    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

    // 1. Detect if a trip is currently in progress
    for (const t of sorted) {
      const depMin = t.partenza ? hhmmToMinutes(t.partenza) : null;
      if (depMin !== null) {
        let maxStopMin = depMin;
        if (t.stopTimes) {
          Object.values(t.stopTimes).forEach((st) => {
            const sm = hhmmToMinutes(st);
            if (sm > maxStopMin) maxStopMin = sm;
          });
        }
        if (nowMin >= depMin && nowMin <= maxStopMin) {
          return t;
        }
      }
    }

    // 2. Next departure today
    for (const t of sorted) {
      if (t.partenza && hhmmToMinutes(t.partenza) >= nowMin) {
        return t;
      }
    }

    // 3. Fallback to first trip
    return sorted[0];
  }

  function findNextTrattaForStop(lineKey, stopId, nowDate, tripIdSpecific = "") {
    const linea = SCHEDULES[lineKey];
    if (!linea) return null;
    const activeTratte = getActiveTratteForCurrentLine();
    if (!activeTratte.length) return null;

    const sorted = [...activeTratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));
    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

    if (tripIdSpecific) {
      const t = sorted.find((x) => x.id === tripIdSpecific);
      if (!t) return null;

      const timeInfo = getEstimatedStopTime(t, stopId, linea);
      if (!timeInfo) return null;

      const [h, m] = String(timeInfo.time).split(":").map(Number);
      const dateStop = new Date(nowDate);
      dateStop.setHours(h, m, 0, 0);
      let isTomorrow = false;
      if (dateStop < nowDate) {
        dateStop.setDate(dateStop.getDate() + 1);
        isTomorrow = true;
      }
      const diffMin = Math.round((dateStop - nowDate) / 60000);
      return { tratta: t, stopTime: timeInfo.time, estimated: timeInfo.estimated, dateStop, diffMin, forced: true, tomorrow: isTomorrow };
    }

    // Find next upcoming trip today for this stop
    for (const t of sorted) {
      const timeInfo = getEstimatedStopTime(t, stopId, linea);
      if (!timeInfo) continue;

      const stopMin = hhmmToMinutes(timeInfo.time);
      if (stopMin >= nowMin) {
        const dateStop = new Date(nowDate);
        dateStop.setHours(Math.floor(stopMin / 60), stopMin % 60, 0, 0);
        const diffMin = stopMin - nowMin;
        return { tratta: t, stopTime: timeInfo.time, estimated: timeInfo.estimated, dateStop, diffMin, forced: false, tomorrow: false };
      }
    }

    // Fallback: first trip tomorrow
    const first = sorted[0];
    const timeInfo = getEstimatedStopTime(first, stopId, linea);
    if (!timeInfo) return null;

    const stopMin = hhmmToMinutes(timeInfo.time);
    const dateStop = new Date(nowDate);
    dateStop.setDate(dateStop.getDate() + 1);
    dateStop.setHours(Math.floor(stopMin / 60), stopMin % 60, 0, 0);

    const diffMin = Math.round((dateStop - nowDate) / 60000);
    return { tratta: first, stopTime: timeInfo.time, estimated: timeInfo.estimated, dateStop, diffMin, forced: false, tomorrow: true };
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

  // === BUS POSITION & ANIMATION ===
  function updateBusMarkerForTratta(tratta, now, isTomorrow = false) {
    if (!dynamicLayer) return;

    if (busMarker) {
      dynamicLayer.removeLayer(busMarker);
      busMarker = null;
    }

    const linea = getCurrentLine();
    if (!linea || !tratta) return;

    const tripBaseDate = new Date(now);
    if (isTomorrow) {
      tripBaseDate.setDate(tripBaseDate.getDate() + 1);
    }

    // Interpolate bus along all sequential stops that have resolved times
    const points = (linea.stops || [])
      .map((s) => {
        const timeInfo = getEstimatedStopTime(tratta, s.id, linea);
        if (!timeInfo) return null;
        const [h, m] = String(timeInfo.time).split(":").map(Number);
        const d = new Date(tripBaseDate);
        d.setHours(h, m, 0, 0);
        if (tratta.partenza && hhmmToMinutes(timeInfo.time) < hhmmToMinutes(tratta.partenza)) {
          d.setDate(d.getDate() + 1);
        }
        return {
          id: s.id,
          nome: s.nome,
          lat: s.lat,
          lng: s.lng,
          date: d
        };
      })
      .filter(Boolean);

    if (points.length === 0) return;

    if (points.length === 1) {
      const busIcon = L.divIcon({
        className: 'bus-marker-wrapper',
        html: `<div class="bus-marker-icon"><i class="fa-solid fa-bus" aria-hidden="true"></i></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });
      busMarker = L.marker([points[0].lat, points[0].lng], { icon: busIcon }).addTo(dynamicLayer);
      busMarker.bindPopup(`<b>Corsa ${tratta.id}</b><br>Fermata: ${points[0].nome}`);
      return;
    }

    let lat, lng, nextStopName;
    if (now < points[0].date) {
      lat = points[0].lat;
      lng = points[0].lng;
      nextStopName = `Partenza ore ${points[0].date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}: ${points[0].nome}`;
    } else if (now > points[points.length - 1].date) {
      if (now - points[points.length - 1].date > 5 * 60 * 1000) {
        return;
      }
      lat = points[points.length - 1].lat;
      lng = points[points.length - 1].lng;
      nextStopName = `Arrivato al capolinea: ${points[points.length - 1].nome}`;
    } else {
      let prev = points[0];
      let next = points[1];
      for (let i = 0; i < points.length - 1; i += 1) {
        if (points[i].date <= now && now <= points[i + 1].date) {
          prev = points[i];
          next = points[i + 1];
          break;
        }
      }

      let percent = 0;
      const span = next.date.getTime() - prev.date.getTime();
      if (span > 0) {
        percent = (now.getTime() - prev.date.getTime()) / span;
        percent = Math.max(0, Math.min(1, percent));
      }

      lat = prev.lat + (next.lat - prev.lat) * percent;
      lng = prev.lng + (next.lng - prev.lng) * percent;
      nextStopName = `In viaggio verso: ${next.nome}`;
    }

    const busIcon = L.divIcon({
      className: 'bus-marker-wrapper',
      html: `<div class="bus-marker-icon"><i class="fa-solid fa-bus" aria-hidden="true"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    busMarker = L.marker([lat, lng], { icon: busIcon }).addTo(dynamicLayer);
    busMarker.bindPopup(`<b>Corsa ${tratta.id}</b><br>${nextStopName}`);
  }

  // === RENDER TIMELINE ===
  function renderTimeline(linea, currentTratta, now, isTomorrow = false) {
    if (!timelineList || !linea || !linea.stops) return;
    timelineList.innerHTML = "";

    const activeTratte = getActiveTratteForCurrentLine();
    if (activeTratte.length === 0) {
      timelineList.innerHTML = `<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.9rem;">
        <i class="fa-solid fa-ban" style="font-size:1.6rem; color:var(--warning); display:block; margin-bottom:0.5rem;" aria-hidden="true"></i>
        Nessuna corsa programmata per questo giorno.
      </div>`;
      return;
    }

    const tripBaseDate = new Date(now);
    if (isTomorrow) {
      tripBaseDate.setDate(tripBaseDate.getDate() + 1);
    }

    linea.stops.forEach((stop, index) => {
      const timeInfo = currentTratta ? getEstimatedStopTime(currentTratta, stop.id, linea) : null;
      let timeDisplayHtml = "";

      if (timeInfo && !timeInfo.estimated) {
        timeDisplayHtml = `<i class="fa-regular fa-clock" aria-hidden="true"></i> <b>${timeInfo.time}</b>`;
      } else if (timeInfo && timeInfo.estimated) {
        timeDisplayHtml = `<span class="badge-estimated" title="Orario stimato di passaggio"><i class="fa-solid fa-clock-rotate-left" aria-hidden="true"></i> ~${timeInfo.time}</span>`;
      } else {
        timeDisplayHtml = `<span class="badge-on-demand"><i class="fa-solid fa-hand" aria-hidden="true"></i> A richiesta</span>`;
      }

      const isSelected = stop.id === stopSelect.value;
      
      let isPassed = false;
      if (currentTratta && timeInfo) {
        const [h, m] = String(timeInfo.time).split(":").map(Number);
        const stopDate = new Date(tripBaseDate);
        stopDate.setHours(h, m, 0, 0);
        if (currentTratta.partenza && hhmmToMinutes(timeInfo.time) < hhmmToMinutes(currentTratta.partenza)) {
          stopDate.setDate(stopDate.getDate() + 1);
        }
        if (stopDate < now) isPassed = true;
      }

      const row = document.createElement("div");
      row.className = `timeline-row ${isSelected ? 'active' : ''} ${isPassed ? 'passed' : ''}`;
      row.innerHTML = `
        <div class="stop-badge-num">${isPassed ? '<i class="fa-solid fa-check" aria-hidden="true"></i>' : index + 1}</div>
        <div class="stop-row-info">
          <div class="stop-row-name">${stop.nome}</div>
          <div class="stop-row-time">${timeDisplayHtml} • <span style="font-size:0.75rem; color:var(--text-muted);">${stop.via || ''}</span></div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;" aria-hidden="true"></i>
      `;

      row.addEventListener("click", () => {
        selectStop(stop.id, true);
      });

      timelineList.appendChild(row);
    });
  }

  // === RENDER UPCOMING TRIPS ===
  function renderUpcomingTrips(linea, stopId, now) {
    if (!upcomingList || !linea) return;
    upcomingList.innerHTML = "";

    const activeTratte = getActiveTratteForCurrentLine();
    if (activeTratte.length === 0) {
      upcomingList.innerHTML = `<div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); font-size:0.9rem;">
        <i class="fa-solid fa-ban" style="font-size:1.6rem; color:var(--warning); display:block; margin-bottom:0.5rem;" aria-hidden="true"></i>
        Nessuna partenza per il giorno selezionato.
      </div>`;
      return;
    }

    const sorted = [...activeTratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));

    sorted.forEach((tratta) => {
      const timeInfo = getEstimatedStopTime(tratta, stopId, linea);
      if (!timeInfo) return;

      const [h, m] = String(timeInfo.time).split(":").map(Number);
      const dateStop = new Date(now);
      dateStop.setHours(h, m, 0, 0);
      const diffMin = Math.round((dateStop - now) / 60000);
      const isPassed = diffMin < 0;

      const noteText = tratta.note ? ` <span class="trip-note-badge">${tratta.note}</span>` : "";

      const row = document.createElement("div");
      row.className = "timeline-row";
      row.style.opacity = isPassed ? "0.6" : "1";
      row.innerHTML = `
        <div class="stop-badge-num" style="background: var(--primary-hover);"><i class="fa-solid fa-bus" aria-hidden="true"></i></div>
        <div class="stop-row-info">
          <div class="stop-row-name">Corsa ${tratta.id}${noteText} (Partenza ${tratta.partenza || '--:--'})</div>
          <div class="stop-row-time">Passaggio fermata: <b>${timeInfo.time}</b> ${timeInfo.estimated ? '<small>(stimato)</small>' : ''}</div>
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
      ? '<i class="fa-solid fa-star" style="color: var(--warning);" aria-hidden="true"></i> Preferito' 
      : '<i class="fa-regular fa-star" aria-hidden="true"></i> Preferito';
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
        <div class="stop-badge-num" style="background: var(--warning);"><i class="fa-solid fa-star" aria-hidden="true"></i></div>
        <div class="stop-row-info">
          <div class="stop-row-name">${fav.lineName}</div>
          <div class="stop-row-time">${fav.stopName}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); font-size: 0.8rem;" aria-hidden="true"></i>
      `;

      row.addEventListener("click", () => {
        lineSelect.value = fav.lineId;
        aggiornaTratteEStops();
        selectStop(fav.stopId, true);
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
      if (key === "calendario_servizio") return;
      const linea = SCHEDULES[key];
      const name = linea.nome || key;
      const routeText = linea.percorso_ufficiale || "";

      if (name.toLowerCase().includes(query) || routeText.toLowerCase().includes(query)) {
        results.push({ type: "line", lineId: key, title: name, subtitle: "Linea Navetta Circolare" });
      }

      (linea.stops || []).forEach(stop => {
        const stopName = (stop.nome || "").toLowerCase();
        const stopVia = (stop.via || "").toLowerCase();
        if (stopName.includes(query) || stopVia.includes(query)) {
          results.push({ 
            type: "stop", 
            lineId: key, 
            stopId: stop.id, 
            title: stop.nome, 
            subtitle: `Fermata #${(linea.stops.indexOf(stop) + 1)} • ${name} (${stop.via || ''})` 
          });
        }
      });
    });

    if (results.length === 0) {
      searchResults.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); text-align: center;">Nessun risultato trovato</div>`;
    } else {
      results.slice(0, 15).forEach(res => {
        const item = document.createElement("div");
        item.className = "timeline-row";
        item.style.marginBottom = "0.5rem";
        item.innerHTML = `
          <div class="stop-badge-num" style="background: var(--primary);"><i class="${res.type === 'line' ? 'fa-solid fa-route' : 'fa-solid fa-location-dot'}" aria-hidden="true"></i></div>
          <div class="stop-row-info">
            <div class="stop-row-name">${res.title}</div>
            <div class="stop-row-time">${res.subtitle}</div>
          </div>
        `;

        item.addEventListener("click", () => {
          lineSelect.value = res.lineId;
          aggiornaTratteEStops();
          if (res.type === "stop") {
            selectStop(res.stopId, true);
          }
          searchModal.classList.remove("active");
        });

        searchResults.appendChild(item);
      });
    }
  }

  // === TIMETABLE MATRIX MODAL WITH MULTI-DAY TABS ===
  function openTimetableMatrix() {
    const linea = getCurrentLine();
    if (!linea || !timetableMatrix) return;

    modalLineTitle.textContent = linea.nome || `Linea ${lineSelect.value}`;

    // Select tab matching current day filter
    const effectiveDay = resolveEffectiveDayKey();
    currentModalDayTab = (selectedDayFilter === "oggi") ? effectiveDay : selectedDayFilter;

    updateModalDayTabs();
    renderTimetableMatrixForTab(currentModalDayTab);

    timetableModal.classList.add("active");
  }

  function updateModalDayTabs() {
    modalTimetableTabs.forEach(btn => {
      const match = btn.getAttribute("data-modaltab") === currentModalDayTab;
      btn.classList.toggle("active", match);
      btn.setAttribute("aria-selected", match ? "true" : "false");
    });
  }

  function renderTimetableMatrixForTab(dayTab) {
    const linea = getCurrentLine();
    if (!linea) return;

    const tratte = (linea.orari && linea.orari[dayTab]) ? linea.orari[dayTab] : [];
    const stops = linea.stops || [];

    if (tratte.length === 0) {
      timetableMatrix.style.display = "none";
      timetableEmptyMsg.style.display = "block";
      const dayName = dayTab === "domenica" ? "la domenica e nei giorni festivi" : (dayTab === "sabato" ? "il sabato" : "nei giorni feriali");
      timetableEmptyMsg.innerHTML = `<i class="fa-solid fa-ban" style="font-size:1.8rem; color:var(--warning); display:block; margin-bottom:0.5rem;" aria-hidden="true"></i>
        Nessuna corsa effettuata ${dayName} per la ${linea.nome || 'linea'}.`;
    } else {
      timetableEmptyMsg.style.display = "none";
      timetableMatrix.style.display = "table";

      let html = `<thead><tr><th>Fermata</th>`;
      tratte.forEach(t => {
        const noteBadge = t.note ? ` <small style="color:var(--primary); font-weight:bold;">${t.note}</small>` : '';
        html += `<th>${t.id}${noteBadge}<br><small style="font-weight: normal;">ore ${t.partenza || ''}</small></th>`;
      });
      html += `</tr></thead><tbody>`;

      stops.forEach(s => {
        const timingClass = s.timing ? 'timing-cell' : '';
        html += `<tr><td class="stop-name-cell ${timingClass}">${s.nome}</td>`;
        tratte.forEach(t => {
          const timeInfo = getEstimatedStopTime(t, s.id, linea);
          if (timeInfo && !timeInfo.estimated) {
            html += `<td><b>${timeInfo.time}</b></td>`;
          } else if (timeInfo && timeInfo.estimated) {
            html += `<td><span style="color: var(--text-muted); font-size: 0.75rem;" title="Orario stimato di passaggio">~${timeInfo.time}</span></td>`;
          } else {
            html += `<td><span style="color: var(--text-muted); font-size: 0.72rem;" title="Fermata a richiesta">a rich.</span></td>`;
          }
        });
        html += `</tr>`;
      });

      html += `</tbody>`;
      timetableMatrix.innerHTML = html;
    }

    // Populate notes
    if (timetableNotesContainer && timetableNotesList) {
      if (Array.isArray(linea.note) && linea.note.length > 0) {
        timetableNotesContainer.style.display = "block";
        timetableNotesList.innerHTML = linea.note.map(n => `<li>${n}</li>`).join("");
      } else {
        timetableNotesContainer.style.display = "none";
        timetableNotesList.innerHTML = "";
      }
    }
  }

  // === ADMIN & OSRM GENERATOR ===
  async function generateOSRMRouteForCurrentLine() {
    const linea = getCurrentLine();
    if (!linea || !linea.stops || linea.stops.length < 2) {
      alert("Seleziona una linea con almeno 2 fermate!");
      return;
    }

    btnGenerateOSRM.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Calcolo OSRM...';

    const pathCoords = await fetchOSRMRoute(linea.stops);
    btnGenerateOSRM.innerHTML = '<i class="fa-solid fa-bolt" aria-hidden="true"></i> Genera rotta stradale OSRM';

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
      btnRecordGPS.innerHTML = '<i class="fa-solid fa-stop" aria-hidden="true"></i> Stop registrazione GPS';
      
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
      btnRecordGPS.innerHTML = '<i class="fa-solid fa-play" aria-hidden="true"></i> Registra traccia GPS';

      const formattedJson = `"path": [\n${recordedGPSPath.map(p => `  [${p[0]}, ${p[1]}]`).join(",\n")}\n]`;
      adminOutput.value = formattedJson;
    }
  }

  // === INTERACTIVE ROUTE EDITOR (VISUAL TRACCIATORE STRADALE) ===
  function toggleRouteEditor() {
    const linea = getCurrentLine();
    if (!linea) {
      alert("Seleziona prima una linea!");
      return;
    }

    isEditorActive = !isEditorActive;
    const mapContainer = document.querySelector(".map-container");

    if (isEditorActive) {
      mapContainer?.classList.add("editor-mode");
      if (routeEditorToolbar) routeEditorToolbar.style.display = "flex";
      if (editorLineName) editorLineName.textContent = linea.nome || `Linea ${lineSelect.value}`;
      if (bottomSheet) bottomSheet.classList.remove("expanded");

      if (!editorLayerGroup) {
        editorLayerGroup = L.featureGroup().addTo(map);
      } else {
        editorLayerGroup.clearLayers();
      }

      // Check if custom path already exists for this line
      const existingCustom = getCustomRoutePath(lineSelect.value);
      if (existingCustom && existingCustom.length > 0) {
        editorSnappedPath = [...existingCustom];
        editorWaypoints = (linea.stops || []).map(s => [s.lat, s.lng]);
      } else {
        // Start fresh with current stops as reference waypoints
        editorWaypoints = (linea.stops || []).map(s => [s.lat, s.lng]);
        editorSnappedPath = [];
      }

      redrawEditorLayers();
      map.on("click", onMapEditorClick);
      if (editorHintText) {
        editorHintText.innerHTML = '<i class="fa-solid fa-mouse-pointer" aria-hidden="true"></i> Clicca sulle strade per aggiungere tappe del percorso.';
      }
    } else {
      exitRouteEditor();
    }
  }

  function exitRouteEditor() {
    isEditorActive = false;
    const mapContainer = document.querySelector(".map-container");
    mapContainer?.classList.remove("editor-mode");
    if (routeEditorToolbar) routeEditorToolbar.style.display = "none";
    if (editorLayerGroup) {
      editorLayerGroup.clearLayers();
    }
    if (map) map.off("click", onMapEditorClick);
    drawRouteForSelectedTripOrDefault();
  }

  async function onMapEditorClick(e) {
    if (!isEditorActive || !map) return;

    const lat = Number(e.latlng.lat.toFixed(6));
    const lng = Number(e.latlng.lng.toFixed(6));
    const newPt = [lat, lng];

    const prevPt = editorWaypoints.length > 0 ? editorWaypoints[editorWaypoints.length - 1] : null;
    editorWaypoints.push(newPt);

    if (editorSnapEnabled && prevPt) {
      if (editorHintText) {
        editorHintText.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Aggancio alla strada in corso...';
      }
      const segmentCoords = await fetchOSRMSegment(prevPt, newPt);
      if (segmentCoords && segmentCoords.length > 0) {
        if (editorSnappedPath.length > 0) {
          editorSnappedPath.push(...segmentCoords.slice(1));
        } else {
          editorSnappedPath.push(...segmentCoords);
        }
      } else {
        editorSnappedPath.push(newPt);
      }
      if (editorHintText) {
        editorHintText.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--success);" aria-hidden="true"></i> Tratto agganciato alla strada!';
      }
    } else {
      editorSnappedPath.push(newPt);
    }

    redrawEditorLayers();
  }

  async function fetchOSRMSegment(p1, p2) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${p1[1].toFixed(6)},${p1[0].toFixed(6)};${p2[1].toFixed(6)},${p2[0].toFixed(6)}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      }
    } catch {
      return null;
    }
    return null;
  }

  function redrawEditorLayers() {
    if (!editorLayerGroup) return;
    editorLayerGroup.clearLayers();

    const linea = getCurrentLine();
    const lineColor = linea?.colore || "#2563eb";

    // 1. Draw waypoints
    editorWaypoints.forEach((pt, idx) => {
      const icon = L.divIcon({
        className: 'editor-waypoint-wrapper',
        html: `<div class="editor-waypoint-icon" title="Tappa ${idx + 1} (clicca per rimuovere)">${idx + 1}</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const m = L.marker(pt, { icon, draggable: true }).addTo(editorLayerGroup);
      m.on("click", (evt) => {
        L.DomEvent.stopPropagation(evt);
        editorWaypoints.splice(idx, 1);
        recalculateEditorPath();
      });
      m.on("dragend", (evt) => {
        const pos = evt.target.getLatLng();
        editorWaypoints[idx] = [Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6))];
        recalculateEditorPath();
      });
    });

    // 2. Draw polyline
    const displayCoords = editorSnappedPath.length > 1 ? editorSnappedPath : editorWaypoints;
    if (displayCoords.length > 1) {
      editorPolyline = L.polyline(displayCoords, {
        color: lineColor,
        weight: 6,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round"
      }).addTo(editorLayerGroup);

      L.polyline(displayCoords, {
        color: "#ffffff",
        weight: 2,
        opacity: 0.8,
        dashArray: "6, 12",
        className: "animated-route-flow"
      }).addTo(editorLayerGroup);
    }

    if (editorPointCount) {
      editorPointCount.textContent = `${editorWaypoints.length} tappe (${displayCoords.length} pts)`;
    }
  }

  async function recalculateEditorPath() {
    if (editorWaypoints.length < 2) {
      editorSnappedPath = [...editorWaypoints];
      redrawEditorLayers();
      return;
    }

    if (!editorSnapEnabled) {
      editorSnappedPath = [...editorWaypoints];
      redrawEditorLayers();
      return;
    }

    if (editorHintText) {
      editorHintText.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Ricalcolo percorso stradale...';
    }
    let full = [];
    for (let i = 0; i < editorWaypoints.length - 1; i++) {
      const seg = await fetchOSRMSegment(editorWaypoints[i], editorWaypoints[i + 1]);
      if (seg && seg.length > 0) {
        if (full.length > 0) full.push(...seg.slice(1));
        else full.push(...seg);
      } else {
        if (full.length === 0) full.push(editorWaypoints[i]);
        full.push(editorWaypoints[i + 1]);
      }
    }
    editorSnappedPath = full;
    if (editorHintText) {
      editorHintText.innerHTML = '<i class="fa-solid fa-circle-check" style="color:var(--success);" aria-hidden="true"></i> Percorso ricalcolato!';
    }
    redrawEditorLayers();
  }

  function editorUndo() {
    if (editorWaypoints.length === 0) return;
    editorWaypoints.pop();
    recalculateEditorPath();
  }

  function editorClear() {
    if (confirm("Vuoi davvero svuotare tutti i punti del percorso disegnato?")) {
      editorWaypoints = [];
      editorSnappedPath = [];
      redrawEditorLayers();
    }
  }

  function editorToggleSnap() {
    editorSnapEnabled = !editorSnapEnabled;
    if (btnEditorSnap) btnEditorSnap.classList.toggle("active", editorSnapEnabled);
    if (editorSnapEnabled) {
      if (editorHintText) editorHintText.innerHTML = '<i class="fa-solid fa-route" aria-hidden="true"></i> Snap Strade ATTIVO: i punti si agganciano all\'asfalto reale.';
      recalculateEditorPath();
    } else {
      if (editorHintText) editorHintText.innerHTML = '<i class="fa-solid fa-pen" aria-hidden="true"></i> Snap Strade DISATTIVATO: linee dirette manuali.';
      editorSnappedPath = [...editorWaypoints];
      redrawEditorLayers();
    }
  }

  function editorSaveRoute() {
    const finalPath = editorSnappedPath.length > 1 ? editorSnappedPath : editorWaypoints;
    if (finalPath.length < 2) {
      alert("Disegna almeno 2 punti prima di salvare il percorso!");
      return;
    }

    const lineKey = lineSelect.value;
    const linea = getCurrentLine();

    localStorage.setItem(`custom_route_path_${lineKey}`, JSON.stringify(finalPath));
    if (linea) linea.custom_path = finalPath;

    // Open route saved modal
    if (savedRouteLineTitle) savedRouteLineTitle.textContent = linea ? linea.nome : `Linea ${lineKey}`;
    if (routeSavedModal) routeSavedModal.classList.add("active");

    exitRouteEditor();
  }

  function resetCustomRoute() {
    const lineKey = lineSelect.value;
    if (confirm(`Vuoi ripristinare il tracciato predefinito per la Linea ${lineKey}?`)) {
      localStorage.removeItem(`custom_route_path_${lineKey}`);
      const linea = getCurrentLine();
      if (linea) delete linea.custom_path;
      if (routeSavedModal) routeSavedModal.classList.remove("active");
      drawRouteForSelectedTripOrDefault();
      alert("✅ Percorso predefinito ripristinato!");
    }
  }

  function copySavedRouteJson() {
    const lineKey = lineSelect.value;
    const path = getCustomRoutePath(lineKey);
    if (!path) {
      alert("Nessun percorso personalizzato salvato per questa linea.");
      return;
    }
    const jsonStr = `"path": [\n${path.map(p => `  [${p[0].toFixed(6)}, ${p[1].toFixed(6)}]`).join(",\n")}\n]`;
    navigator.clipboard.writeText(jsonStr).then(() => {
      alert("✅ Coordinate JSON copiate negli appunti!");
    });
  }

  function downloadSavedRouteGeoJson() {
    const lineKey = lineSelect.value;
    const path = getCustomRoutePath(lineKey);
    const linea = getCurrentLine();
    if (!path) {
      alert("Nessun percorso salvato da esportare.");
      return;
    }

    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            lineId: lineKey,
            lineName: linea?.nome || `Linea ${lineKey}`,
            exportedAt: new Date().toISOString()
          },
          geometry: {
            type: "LineString",
            coordinates: path.map(p => [p[1], p[0]]) // GeoJSON requires [lng, lat]
          }
        }
      ]
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `percorso_linea_${lineKey}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

    const activeTratte = getActiveTratteForCurrentLine();

    if (activeTratte.length === 0) {
      if (busMarker && dynamicLayer) {
        dynamicLayer.removeLayer(busMarker);
        busMarker = null;
      }
      heroEtaBadge.textContent = "—";
      heroEtaBadge.style.fontSize = "";
      heroNextTime.textContent = "Nessun servizio oggi";
      renderTimeline(linea, null, now, false);
      renderUpcomingTrips(linea, stopId, now);
      updateActiveStopMarkerPin(stopId);
      return;
    }

    const info = findNextTrattaForStop(lineKey, stopId, now, tripIdSpecific);

    if (!info) {
      if (busMarker && dynamicLayer) {
        dynamicLayer.removeLayer(busMarker);
        busMarker = null;
      }
      heroEtaBadge.textContent = "—";
      heroEtaBadge.style.fontSize = "";
      heroNextTime.textContent = "Nessuna corsa imminente";
      renderTimeline(linea, null, now, false);
      renderUpcomingTrips(linea, stopId, now);
      updateActiveStopMarkerPin(stopId);
      return;
    }

    heroEtaBadge.style.fontSize = "";
    const orarioTesto = info.dateStop.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const estLabel = info.estimated ? " (stimato)" : "";
    heroNextTime.textContent = info.tomorrow ? `Domani ore ${orarioTesto}${estLabel}` : `Previsto ore ${orarioTesto}${estLabel}`;
    heroEtaBadge.textContent = formatDiffText(info.diffMin);

    updateBusMarkerForTratta(info.tratta, now, Boolean(info.tomorrow));
    renderTimeline(linea, info.tratta, now, Boolean(info.tomorrow));
    renderUpcomingTrips(linea, stopId, now);
    updateActiveStopMarkerPin(stopId);
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

  // Unified helper to select a stop across all interactions
  function selectStop(stopId, shouldZoom = true) {
    if (!stopId) return;
    stopSelect.value = stopId;
    updateAllDisplays();
    updateFavoriteButtonState();
    if (shouldZoom) zoomToSelectedStop();
  }

  // === DAY FILTER SYSTEM ===
  function wireDayFilterEvents() {
    dayPillBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const dayMode = btn.getAttribute("data-day");
        selectedDayFilter = dayMode;

        dayPillBtns.forEach(b => {
          const match = b === btn;
          b.classList.toggle("active", match);
          b.setAttribute("aria-pressed", match ? "true" : "false");
        });

        aggiornaTratteEStops();
      });
    });
  }

  // === ROUTE DETAILS TOGGLE ===
  function wireRouteDetailsToggle() {
    if (!btnToggleRouteDetails || !routeDetailsBody) return;

    btnToggleRouteDetails.addEventListener("click", () => {
      const isExpanded = btnToggleRouteDetails.getAttribute("aria-expanded") === "true";
      const nextState = !isExpanded;
      btnToggleRouteDetails.setAttribute("aria-expanded", String(nextState));
      routeDetailsBody.style.display = nextState ? "block" : "none";
      if (routeDetailsChevron) {
        routeDetailsChevron.style.transform = nextState ? "rotate(180deg)" : "none";
      }
    });
  }

  // === TAB NAVIGATION SYSTEM (MOBILE & DESKTOP) ===
  function setActiveTab(tab) {
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop && tab === "map") {
      tab = "timeline";
    }

    navItems.forEach(i => {
      const match = i.getAttribute("data-tab") === tab;
      i.classList.toggle("active", match);
    });

    const sidebarTabBtns = document.querySelectorAll(".sidebar-tab-btn");
    sidebarTabBtns.forEach(btn => {
      const match = btn.getAttribute("data-tab") === tab;
      btn.classList.toggle("active", match);
      btn.setAttribute("aria-selected", match ? "true" : "false");
    });

    if (tab === "map") {
      bottomSheet.classList.remove("expanded");
    } else {
      bottomSheet.classList.add("expanded");

      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      if (tab === "timeline") document.getElementById("paneTimeline")?.classList.add("active");
      if (tab === "upcoming") document.getElementById("paneUpcoming")?.classList.add("active");
      if (tab === "favorites") document.getElementById("paneFavorites")?.classList.add("active");
    }
  }

  function wireNavSystem() {
    navItems.forEach(item => {
      item.addEventListener("click", () => {
        const tab = item.getAttribute("data-tab");
        setActiveTab(tab);
      });
    });

    const sidebarTabBtns = document.querySelectorAll(".sidebar-tab-btn");
    sidebarTabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-tab");
        setActiveTab(tab);
      });
    });
  }

  // === BOTTOM SHEET TOUCH & SWIPE EVENTS ===
  function wireBottomSheetEvents() {
    let startY = 0;
    let deltaY = 0;
    let isTouching = false;
    let isSwiped = false;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      startY = e.touches[0].clientY;
      deltaY = 0;
      isTouching = true;
      isSwiped = false;
    };

    const onTouchMove = (e) => {
      if (!isTouching) return;
      const currentY = e.touches[0].clientY;
      deltaY = currentY - startY;
      if (Math.abs(deltaY) > 8) {
        isSwiped = true;
      }
    };

    const onTouchEnd = () => {
      if (!isTouching) return;
      isTouching = false;

      if (deltaY < -35) {
        bottomSheet.classList.add("expanded");
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav && activeNav.getAttribute("data-tab") === "map") {
          setActiveTab("timeline");
        }
      } else if (deltaY > 35) {
        bottomSheet.classList.remove("expanded");
        setActiveTab("map");
      }
    };

    const setupTouchHandle = (el) => {
      if (!el) return;
      el.addEventListener("touchstart", (e) => {
        if (window.innerWidth >= 768) return;
        onTouchStart(e);
      }, { passive: true });

      el.addEventListener("touchmove", (e) => {
        if (window.innerWidth >= 768) return;
        onTouchMove(e);
      }, { passive: true });

      el.addEventListener("touchend", () => {
        if (window.innerWidth >= 768) return;
        onTouchEnd();
      });

      el.addEventListener("touchcancel", () => { isTouching = false; });

      el.addEventListener("click", (e) => {
        if (window.innerWidth >= 768) return;
        if (isSwiped) {
          isSwiped = false;
          return;
        }
        if (e.target.closest("button") || e.target.closest("a") || e.target.closest("select")) return;

        bottomSheet.classList.toggle("expanded");
        if (!bottomSheet.classList.contains("expanded")) {
          setActiveTab("map");
        } else {
          const activeNav = document.querySelector(".nav-item.active");
          if (activeNav && activeNav.getAttribute("data-tab") === "map") {
            setActiveTab("timeline");
          }
        }
      });
    };

    setupTouchHandle(sheetHandle);
    setupTouchHandle(sheetHero);
  }

  // === EVENT BINDINGS ===
  function wireMobileEvents() {
    lineSelect.addEventListener("change", aggiornaTratteEStops);
    tripSelect.addEventListener("change", () => {
      drawRouteForSelectedTripOrDefault();
      updateAllDisplays();
    });
    stopSelect.addEventListener("change", () => {
      selectStop(stopSelect.value, true);
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

    // Timetable Modal
    btnTimetable?.addEventListener("click", openTimetableMatrix);
    closeTimetableModal?.addEventListener("click", () => timetableModal.classList.remove("active"));
    closeAdminModal?.addEventListener("click", () => adminModal.classList.remove("active"));

    // Modal Timetable Day Tabs
    modalTimetableTabs.forEach(btn => {
      btn.addEventListener("click", () => {
        currentModalDayTab = btn.getAttribute("data-modaltab");
        updateModalDayTabs();
        renderTimetableMatrixForTab(currentModalDayTab);
      });
    });

    // Modal backdrop click handlers
    timetableModal?.addEventListener("click", (e) => {
      if (e.target === timetableModal) timetableModal.classList.remove("active");
    });
    adminModal?.addEventListener("click", (e) => {
      if (e.target === adminModal) adminModal.classList.remove("active");
    });
    searchModal?.addEventListener("click", (e) => {
      if (e.target === searchModal || e.target === searchResults) searchModal.classList.remove("active");
    });

    // Escape key closes modals and exits editor
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchModal?.classList.remove("active");
        timetableModal?.classList.remove("active");
        adminModal?.classList.remove("active");
        routeSavedModal?.classList.remove("active");
        if (isEditorActive) exitRouteEditor();
      }
    });

    // Route Editor Toolbar Events
    btnRouteEditor?.addEventListener("click", toggleRouteEditor);
    btnCloseEditor?.addEventListener("click", exitRouteEditor);
    btnEditorUndo?.addEventListener("click", editorUndo);
    btnEditorSnap?.addEventListener("click", editorToggleSnap);
    btnEditorClear?.addEventListener("click", editorClear);
    btnEditorSave?.addEventListener("click", editorSaveRoute);

    // Route Saved Modal Events
    closeRouteSavedModal?.addEventListener("click", () => routeSavedModal?.classList.remove("active"));
    routeSavedModal?.addEventListener("click", (e) => {
      if (e.target === routeSavedModal) routeSavedModal.classList.remove("active");
    });
    btnCopySavedRouteJson?.addEventListener("click", copySavedRouteJson);
    btnDownloadSavedRouteGeoJson?.addEventListener("click", downloadSavedRouteGeoJson);
    btnResetCustomRoute?.addEventListener("click", resetCustomRoute);

    // Keyboard accessibility for bottom sheet handle
    sheetHandle?.addEventListener("keydown", (e) => {
      if (window.innerWidth >= 768) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        bottomSheet.classList.toggle("expanded");
      }
    });

    btnGenerateOSRM?.addEventListener("click", generateOSRMRouteForCurrentLine);
    btnRecordGPS?.addEventListener("click", toggleGPSRecording);
    btnCopyAdminOutput?.addEventListener("click", () => {
      navigator.clipboard.writeText(adminOutput.value).then(() => {
        alert("✅ JSON copiato negli appunti!");
      });
    });

    // CARTO Basemaps API Key Settings
    const cartoApiKeyInput = document.getElementById("cartoApiKeyInput");
    const btnSaveCartoKey = document.getElementById("btnSaveCartoKey");

    if (cartoApiKeyInput) {
      cartoApiKeyInput.value = cartoApiKey;
    }

    btnSaveCartoKey?.addEventListener("click", () => {
      const newKey = cartoApiKeyInput ? cartoApiKeyInput.value.trim() : "";
      cartoApiKey = newKey;
      if (newKey) {
        localStorage.setItem("carto_api_key", newKey);
        alert("✅ Chiave CARTO salvata! I tile Positron/Dark verranno caricati con la chiave.");
      } else {
        localStorage.removeItem("carto_api_key");
        alert("ℹ️ Chiave rimossa: la mappa userà OpenStreetMap gratuito senza filigrane.");
      }
      switchMapTile(currentTileType);
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

          selectStop(nearestStop.id, true);

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
