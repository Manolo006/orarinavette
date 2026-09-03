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
  let stopMarkersMap = {}; // Maps stopId -> L.Marker for fast, flicker-free active pin updates

  // Dynamic contrast calculation (WCAG AA compliant)
  // Relative luminance: L = 0.2126*R + 0.7152*G + 0.0722*B. If L > 0.18 use dark (#0f172a), else white (#ffffff)
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

  // === CARTO BASEMAPS API KEY CONFIGURATION ===
  // Da agosto 2026 CARTO richiede una API key gratuita (https://carto.com/basemaps/apikey) per i suoi tile.
  // Senza chiave, viene mostrata la filigrana "API KEY REQUIRED".
  let cartoApiKey = localStorage.getItem("carto_api_key") || "cb1_2vji_1_325c3790be83c78e3c85fe40";

  // Active Map Tiles State
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
    // "positron" di default: se c'è la chiave usa Carto Positron, altrimenti OpenStreetMap pulito senza filigrana
    return cartoApiKey
      ? `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png${keyParam}`
      : "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
  }

  // Favorites with error-resilient storage
  function getStoredFavorites() {
    try {
      return JSON.parse(localStorage.getItem("bus_favorites") || "[]");
    } catch {
      return [];
    }
  }
  let favorites = getStoredFavorites();

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

    const badgeTextColor = getContrastTextColor(linea.colore);
    heroLineBadge.innerHTML = `<i class="fa-solid fa-bus" aria-hidden="true"></i> ${linea.nome || 'Linea ' + lineSelect.value}`;
    if (linea.colore) {
      heroLineBadge.style.backgroundColor = linea.colore;
      heroLineBadge.style.color = badgeTextColor;
    } else {
      heroLineBadge.style.backgroundColor = "";
      heroLineBadge.style.color = "";
    }

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
    stopMarkersMap = {};

    const linea = getCurrentLine();
    if (!linea) return;

    // 1. Draw stop markers synchronously so stopMarkersMap is populated immediately
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
        selectStop(s.id, true);
      });

      stopMarkersMap[s.id] = m;
    });

    fitMapToCurrentRouteOrStops();

    // 2. Determine and render route polyline
    const selectedTripId = tripSelect.value;
    let tratta = selectedTripId 
      ? (linea.tratte || []).find((t) => t.id === selectedTripId) 
      : (linea.tratte || [])[0];

    let pathCoords = null;

    if (tratta && Array.isArray(tratta.path) && tratta.path.length > 1) {
      pathCoords = tratta.path;
    } else if (linea.stops && linea.stops.length > 1) {
      // Draw straight-line fallback while fetching OSRM road geometry
      const fallbackPolyline = L.polyline((linea.stops || []).map(s => [s.lat, s.lng]), {
        color: linea.colore || "#2563eb",
        weight: 5,
        opacity: 0.85
      }).addTo(staticLayer);

      pathCoords = await fetchOSRMRoute(linea.stops);
      if (pathCoords && pathCoords.length > 1) {
        staticLayer.removeLayer(fallbackPolyline);
        L.polyline(pathCoords, {
          color: linea.colore || "#2563eb",
          weight: 5,
          opacity: 0.85
        }).addTo(staticLayer);
      }
      return;
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
  }

  // Fast, flicker-free active pin updating without redrawing the layer
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

  // Helpers for intermediate on-demand stops without fixed times
  function isIntermediateOnDemandStop(linea, stopId) {
    if (!linea || !linea.tratte || !linea.tratte.length) return false;
    return !linea.tratte.some((t) => t.stopTimes && t.stopTimes[stopId]);
  }

  function findActiveOrNextTrattaForLine(linea, nowDate, tripIdSpecific = "") {
    if (!linea || !linea.tratte || !linea.tratte.length) return null;
    const sorted = [...linea.tratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));
    if (tripIdSpecific) {
      const specific = sorted.find((t) => t.id === tripIdSpecific);
      if (specific) return specific;
    }

    const nowMin = nowDate.getHours() * 60 + nowDate.getMinutes();

    // 1. Detect if a trip is currently in progress (between departure and last stop arrival)
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

    // 2. Detect next scheduled departure today
    for (const t of sorted) {
      if (t.partenza && hhmmToMinutes(t.partenza) >= nowMin) {
        return t;
      }
    }

    // 3. Fallback to first departure tomorrow
    return sorted[0];
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

      const [h, m] = String(st).split(":").map(Number);
      const dateStop = new Date(nowDate);
      dateStop.setHours(h, m, 0, 0);
      let isTomorrow = false;
      if (dateStop < nowDate) {
        dateStop.setDate(dateStop.getDate() + 1);
        isTomorrow = true;
      }
      const diffMin = Math.round((dateStop - nowDate) / 60000);
      return { tratta: t, stopTime: st, dateStop, diffMin, forced: true, tomorrow: isTomorrow };
    }

    // Find next upcoming stop time today
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

    // Fallback: first scheduled trip tomorrow
    const first = sorted.find((t) => t.stopTimes?.[stopId]);
    if (!first) return null;

    const st = first.stopTimes[stopId];
    const [h, m] = String(st).split(":").map(Number);
    const dateStop = new Date(nowDate);
    dateStop.setDate(dateStop.getDate() + 1);
    dateStop.setHours(h, m, 0, 0);

    const diffMin = Math.round((dateStop - nowDate) / 60000);
    return { tratta: first, stopTime: st, dateStop, diffMin, forced: false, tomorrow: true };
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

    const points = (linea.stops || [])
      .map((s) => {
        const t = tratta.stopTimes?.[s.id];
        if (!t) return null;
        const [h, m] = String(t).split(":").map(Number);
        const d = new Date(tripBaseDate);
        d.setHours(h, m, 0, 0);
        if (tratta.partenza && hhmmToMinutes(t) < hhmmToMinutes(tratta.partenza)) {
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
      // Keep marker at destination for up to 5 min after arrival
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

    const stopTimes = currentTratta ? (currentTratta.stopTimes || {}) : {};

    const tripBaseDate = new Date(now);
    if (isTomorrow) {
      tripBaseDate.setDate(tripBaseDate.getDate() + 1);
    }

    linea.stops.forEach((stop, index) => {
      const explicitTime = stopTimes[stop.id];
      let timeDisplayHtml = "";
      if (explicitTime) {
        timeDisplayHtml = `<i class="fa-regular fa-clock" aria-hidden="true"></i> ${explicitTime}`;
      } else if (currentTratta) {
        timeDisplayHtml = `<span class="badge-on-demand"><i class="fa-solid fa-hand" aria-hidden="true"></i> A richiesta</span>`;
      } else {
        timeDisplayHtml = `<i class="fa-regular fa-clock" aria-hidden="true"></i> --:--`;
      }

      const isSelected = stop.id === stopSelect.value;
      
      let isPassed = false;
      if (currentTratta && explicitTime) {
        const [h, m] = String(explicitTime).split(":").map(Number);
        const stopDate = new Date(tripBaseDate);
        stopDate.setHours(h, m, 0, 0);
        if (currentTratta.partenza && hhmmToMinutes(explicitTime) < hhmmToMinutes(currentTratta.partenza)) {
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
          <div class="stop-row-time">${timeDisplayHtml}</div>
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
    if (!upcomingList || !linea || !linea.tratte) return;
    upcomingList.innerHTML = "";

    const sorted = [...linea.tratte].sort((a, b) => (a.partenza || "").localeCompare(b.partenza || ""));
    const isOnDemand = isIntermediateOnDemandStop(linea, stopId);

    if (isOnDemand) {
      const infoCard = document.createElement("div");
      infoCard.className = "on-demand-card";
      infoCard.innerHTML = `
        <div style="font-weight: 700; font-size: 0.88rem; color: var(--text-main); display: flex; align-items: center; gap: 0.4rem;">
          <i class="fa-solid fa-circle-info" style="color: var(--warning);" aria-hidden="true"></i>
          Fermata a richiesta
        </div>
        <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
          Questa fermata viene servita al passaggio della navetta lungo il percorso. Fai un chiaro cenno all'autista con congruo anticipo.
        </div>
      `;
      upcomingList.appendChild(infoCard);

      const headerDiv = document.createElement("div");
      headerDiv.style.cssText = "font-weight: 700; font-size: 0.8rem; color: var(--text-muted); margin: 0.75rem 0 0.5rem 0; text-transform: uppercase;";
      headerDiv.textContent = "Partenze della linea da capolinea";
      upcomingList.appendChild(headerDiv);

      sorted.forEach((tratta) => {
        const depTime = tratta.partenza;
        if (!depTime) return;
        const [h, m] = String(depTime).split(":").map(Number);
        const dateDep = new Date(now);
        dateDep.setHours(h, m, 0, 0);
        const diffMin = Math.round((dateDep - now) / 60000);
        const isPassed = diffMin < 0;

        const row = document.createElement("div");
        row.className = "timeline-row";
        row.style.opacity = isPassed ? "0.6" : "1";
        row.innerHTML = `
          <div class="stop-badge-num" style="background: var(--primary-hover);"><i class="fa-solid fa-bus" aria-hidden="true"></i></div>
          <div class="stop-row-info">
            <div class="stop-row-name">Corsa ${tratta.id}</div>
            <div class="stop-row-time">Partenza capolinea: ore ${depTime}</div>
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
      return;
    }

    sorted.forEach((tratta) => {
      const st = tratta.stopTimes?.[stopId];
      if (!st) return;

      const [h, m] = String(st).split(":").map(Number);
      const dateStop = new Date(now);
      dateStop.setHours(h, m, 0, 0);
      const diffMin = Math.round((dateStop - now) / 60000);
      const isPassed = diffMin < 0;

      const row = document.createElement("div");
      row.className = "timeline-row";
      row.style.opacity = isPassed ? "0.6" : "1";
      row.innerHTML = `
        <div class="stop-badge-num" style="background: var(--primary-hover);"><i class="fa-solid fa-bus" aria-hidden="true"></i></div>
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
        const time = t.stopTimes?.[s.id];
        if (time) {
          html += `<td>${time}</td>`;
        } else {
          html += `<td><span style="color: var(--text-muted); font-size: 0.72rem;" title="Fermata a richiesta">a rich.</span></td>`;
        }
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
      if (isIntermediateOnDemandStop(linea, stopId)) {
        heroEtaBadge.textContent = "A richiesta";
        heroEtaBadge.style.fontSize = "0.85rem";
        heroNextTime.textContent = "Fermata a richiesta (passaggio lungo la tratta)";
        const activeTratta = findActiveOrNextTrattaForLine(linea, now, tripIdSpecific);
        let isTomorrow = false;
        if (activeTratta && activeTratta.partenza) {
          const depMin = hhmmToMinutes(activeTratta.partenza);
          const nowMin = now.getHours() * 60 + now.getMinutes();
          if (nowMin > depMin) {
            let maxStopMin = depMin;
            if (activeTratta.stopTimes) {
              Object.values(activeTratta.stopTimes).forEach(st => {
                const sm = hhmmToMinutes(st);
                if (sm > maxStopMin) maxStopMin = sm;
              });
            }
            if (nowMin > maxStopMin) {
              isTomorrow = true;
            }
          }
        }
        if (activeTratta) {
          updateBusMarkerForTratta(activeTratta, now, isTomorrow);
        } else if (busMarker && dynamicLayer) {
          dynamicLayer.removeLayer(busMarker);
          busMarker = null;
        }
        renderTimeline(linea, activeTratta, now, isTomorrow);
        renderUpcomingTrips(linea, stopId, now);
      } else {
        if (busMarker && dynamicLayer) {
          dynamicLayer.removeLayer(busMarker);
          busMarker = null;
        }
        heroEtaBadge.textContent = "—";
        heroEtaBadge.style.fontSize = "";
        heroNextTime.textContent = "Nessuna corsa";
        renderTimeline(linea, null, now, false);
        renderUpcomingTrips(linea, stopId, now);
      }
      updateActiveStopMarkerPin(stopId);
      return;
    }

    heroEtaBadge.style.fontSize = "";
    const orarioTesto = info.dateStop.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    heroNextTime.textContent = info.tomorrow ? `Domani ore ${orarioTesto}` : `Previsto ore ${orarioTesto}`;
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

  // === TAB NAVIGATION SYSTEM (MOBILE & DESKTOP) ===
  function setActiveTab(tab) {
    const isDesktop = window.innerWidth >= 768;

    // On desktop, the floating sidebar stays open; fallback 'map' to 'timeline'
    if (isDesktop && tab === "map") {
      tab = "timeline";
    }

    // Update bottom nav items
    navItems.forEach(i => {
      const match = i.getAttribute("data-tab") === tab;
      i.classList.toggle("active", match);
    });

    // Update sidebar tab buttons
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
        // Swiped UP -> expand bottom sheet
        bottomSheet.classList.add("expanded");
        const activeNav = document.querySelector(".nav-item.active");
        if (activeNav && activeNav.getAttribute("data-tab") === "map") {
          setActiveTab("timeline");
        }
      } else if (deltaY > 35) {
        // Swiped DOWN -> collapse bottom sheet
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

    // Modals
    btnTimetable?.addEventListener("click", openTimetableMatrix);
    closeTimetableModal?.addEventListener("click", () => timetableModal.classList.remove("active"));
    closeAdminModal?.addEventListener("click", () => adminModal.classList.remove("active"));

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

    // Escape key closes modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        searchModal?.classList.remove("active");
        timetableModal?.classList.remove("active");
        adminModal?.classList.remove("active");
      }
    });

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
