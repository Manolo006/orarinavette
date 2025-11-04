// === Registrazione del percorso GPS ===
let recording = false;
let recordedPath = [];
let watchId = null;
let lastSaveTime = 0;

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
    lastSaveTime = 0;

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const now = Date.now();

          // Salva solo ogni 30 secondi
          if (now - lastSaveTime >= 5000 || recordedPath.length === 0) {
            recordedPath.push([latitude.toFixed(6), longitude.toFixed(6)]);
            lastSaveTime = now;
            console.log("📍 Punto salvato:", latitude, longitude);
          }
        },
        (err) => console.error("Errore GPS:", err),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    } else {
      alert("Geolocalizzazione non supportata");
    }
  } else {
    // Ferma registrazione
    recording = false;
    if (watchId) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    recordBtn.textContent = "▶️ Inizia registrazione percorso";

    // Formatta il percorso in JSON pronto
    const jsonPath = `"path": [\n${recordedPath
      .map((p) => `  [${p[0]}, ${p[1]}]`)
      .join(",\n")}\n]`;

    navigator.clipboard.writeText(jsonPath).then(() => {
      alert("✅ Percorso copiato negli appunti!\nIncollalo nel file JSON della linea.");
      console.log("Percorso copiato:\n", jsonPath);
    });
  }
});
