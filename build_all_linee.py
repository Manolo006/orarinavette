import json

# ==============================================================================
# GENERATORE UFFICIALE LINEE E ORARI NAVETTE - CERVETERI & LADISPOLI
# Basato sui fogli orari ufficiali e sulle rotte stradali complete (21.jpg - 33.jpg)
# ==============================================================================

# Calendario festività in cui il servizio è completamente sospeso (da no corse.jpg)
CALENDARIO_SERVIZIO = {
    "giorni_sospensione": [
        "01-01",  # Capodanno
        "01-06",  # Epifania
        "04-25",  # Festa della Liberazione
        "05-01",  # Festa del Lavoro
        "06-02",  # Festa della Repubblica
        "08-15",  # Ferragosto
        "11-01",  # Ognissanti
        "12-08",  # Immacolata Concezione
        "12-25",  # Natale
        "12-26"   # Santo Stefano
    ],
    "chiusura_anticipata_19": [
        "12-24",  # Vigilia di Natale (termina ore 19:00)
        "12-31"   # San Silvestro (termina ore 19:00)
    ],
    "note_pasqua": "Il servizio è sospeso il giorno di Pasqua e il Lunedì dell'Angelo (Pasquetta)."
}

linee_data = {
    # --------------------------------------------------------------------------
    # LINEA 21
    # Viale Manzoni (Cerveteri) — Sasso — Cerenova FS — Poliambulatorio — Viale Manzoni
    # --------------------------------------------------------------------------
    "21": {
        "nome": "21 - Cerveteri - Sasso - Cerenova FS - Poliambulatorio",
        "colore": "#2563eb",
        "percorso_ufficiale": "Viale Manzoni (capolinea) - Via Mura Castellane - Via della Necropoli - Via del Sasso - Via Furbara Sasso - Piazza del Fico (capolinea) - Via Furbara Sasso - Via Aurelia - Viale Campo di Mare - Stazione FS Marina di Cerveteri - Viale Campo di Mare - Via S. Angelucci - Via Caere Vetus - Via Fontana Morella - Via Aurelia (Poliambulatorio) - Via Settevene Palo - Via Ceretana - Via Mura Castellane - Viale Manzoni (capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) al ritorno effettua deviazione all'ISIS Enrico Mattei",
            "(b) Nei giorni scolastici (lun-ven) la corsa inizia all'Ist. Mattei (via Borsellino) alle 13.45",
            "(c) All'andata effettua deviazione in via Fosso di Centocorvi, via della Piscina, via dell'Isolotto"
        ],
        "stops": [
            { "id": "21_s1", "nome": "Viale Manzoni (Capolinea Cerveteri)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True },
            { "id": "21_s2", "nome": "Via Mura Castellane", "lat": 41.994200, "lng": 12.091200, "via": "Via Mura Castellane", "timing": False },
            { "id": "21_s3", "nome": "Via della Necropoli", "lat": 41.997500, "lng": 12.093500, "via": "Via della Necropoli", "timing": False },
            { "id": "21_s4", "nome": "Via del Sasso", "lat": 42.015000, "lng": 12.078000, "via": "Via del Sasso", "timing": False },
            { "id": "21_s5", "nome": "Via Furbara Sasso", "lat": 42.025000, "lng": 12.073000, "via": "Via Furbara Sasso", "timing": False },
            { "id": "21_s6", "nome": "Piazza del Fico (Sasso Capolinea)", "lat": 42.036800, "lng": 12.067500, "via": "Piazza del Fico", "timing": True },
            { "id": "21_s7", "nome": "Via Furbara Sasso (Ritorno Sasso)", "lat": 42.025000, "lng": 12.073000, "via": "Via Furbara Sasso", "timing": False },
            { "id": "21_s8", "nome": "Via Aurelia / Bivio Sasso", "lat": 41.988000, "lng": 12.052000, "via": "Via Aurelia", "timing": False },
            { "id": "21_s9", "nome": "Viale Campo di Mare", "lat": 41.964000, "lng": 12.083000, "via": "Viale Campo di Mare", "timing": False },
            { "id": "21_s10", "nome": "Stazione FS Marina di Cerveteri (Cerenova)", "lat": 41.960693, "lng": 12.082584, "via": "Viale Campo di Mare", "timing": True },
            { "id": "21_s11", "nome": "Viale Campo di Mare (Ritorno FS)", "lat": 41.963500, "lng": 12.083000, "via": "Viale Campo di Mare", "timing": False },
            { "id": "21_s12", "nome": "Via S. Angelucci", "lat": 41.965500, "lng": 12.084500, "via": "Via S. Angelucci", "timing": False },
            { "id": "21_s13", "nome": "Via Caere Vetus", "lat": 41.967500, "lng": 12.083500, "via": "Via Caere Vetus", "timing": False },
            { "id": "21_s14", "nome": "Via Fontana Morella", "lat": 41.972000, "lng": 12.083000, "via": "Via Fontana Morella", "timing": False },
            { "id": "21_s15", "nome": "Via Aurelia (Poliambulatorio Cerveteri)", "lat": 41.970301, "lng": 12.081321, "via": "Via Aurelia", "timing": True },
            { "id": "21_s16", "nome": "Via Settevene Palo (Salita Cerveteri)", "lat": 41.985000, "lng": 12.089000, "via": "Via Settevene Palo", "timing": False },
            { "id": "21_s17", "nome": "Via Ceretana", "lat": 41.993500, "lng": 12.095000, "via": "Via Ceretana", "timing": False },
            { "id": "21_s18", "nome": "Via Mura Castellane (Ritorno)", "lat": 41.994200, "lng": 12.091200, "via": "Via Mura Castellane", "timing": False },
            { "id": "21_s19", "nome": "Viale Manzoni (Arrivo Capolinea)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "21-LV-1", "partenza": "06:00", "stopTimes": { "21_s1": "06:00", "21_s6": "06:20", "21_s10": "06:35", "21_s15": "06:42", "21_s19": "06:50" } },
                { "id": "21-LV-2", "partenza": "07:00", "note": "(a-c)", "stopTimes": { "21_s1": "07:00", "21_s6": "07:25", "21_s10": "07:45", "21_s15": "07:55", "21_s19": "08:05" } },
                { "id": "21-LV-3", "partenza": "08:05", "note": "(c)", "stopTimes": { "21_s1": "08:05", "21_s6": "08:30", "21_s10": "08:50", "21_s15": "09:00", "21_s19": "09:10" } },
                { "id": "21-LV-4", "partenza": "10:15", "stopTimes": { "21_s1": "10:15", "21_s6": "10:35", "21_s10": "10:50", "21_s15": "10:58", "21_s19": "11:05" } },
                { "id": "21-LV-5", "partenza": "11:05", "stopTimes": { "21_s1": "11:05", "21_s6": "11:25", "21_s10": "11:40", "21_s15": "11:48", "21_s19": "11:55" } },
                { "id": "21-LV-6", "partenza": "12:00", "note": "(c)", "stopTimes": { "21_s1": "12:00", "21_s6": "12:25", "21_s10": "12:40", "21_s15": "12:48", "21_s19": "12:55" } },
                { "id": "21-LV-7", "partenza": "13:45", "note": "(a-b-c)", "stopTimes": { "21_s1": "13:45", "21_s6": "14:10", "21_s10": "14:30", "21_s15": "14:40", "21_s19": "14:50" } },
                { "id": "21-LV-8", "partenza": "14:50", "note": "(c)", "stopTimes": { "21_s1": "14:50", "21_s6": "15:15", "21_s10": "15:30", "21_s15": "15:38", "21_s19": "15:45" } },
                { "id": "21-LV-9", "partenza": "16:40", "stopTimes": { "21_s1": "16:40", "21_s6": "17:00", "21_s10": "17:15", "21_s15": "17:22", "21_s19": "17:30" } },
                { "id": "21-LV-10", "partenza": "17:40", "stopTimes": { "21_s1": "17:40", "21_s6": "18:00", "21_s10": "18:15", "21_s15": "18:22", "21_s19": "18:30" } },
                { "id": "21-LV-11", "partenza": "18:40", "stopTimes": { "21_s1": "18:40", "21_s6": "19:00", "21_s10": "19:15", "21_s15": "19:22", "21_s19": "19:30" } },
                { "id": "21-LV-12", "partenza": "19:40", "stopTimes": { "21_s1": "19:40", "21_s6": "20:00", "21_s10": "20:15", "21_s15": "20:22", "21_s19": "20:30" } }
            ],
            "sabato": [
                { "id": "21-SA-1", "partenza": "06:00", "stopTimes": { "21_s1": "06:00", "21_s6": "06:20", "21_s10": "06:35", "21_s15": "06:42", "21_s19": "06:50" } },
                { "id": "21-SA-2", "partenza": "07:00", "note": "(c)", "stopTimes": { "21_s1": "07:00", "21_s6": "07:25", "21_s10": "07:45", "21_s15": "07:55", "21_s19": "08:05" } },
                { "id": "21-SA-3", "partenza": "08:05", "note": "(c)", "stopTimes": { "21_s1": "08:05", "21_s6": "08:30", "21_s10": "08:50", "21_s15": "09:00", "21_s19": "09:10" } },
                { "id": "21-SA-4", "partenza": "10:05", "stopTimes": { "21_s1": "10:05", "21_s6": "10:25", "21_s10": "10:45", "21_s15": "10:55", "21_s19": "11:05" } },
                { "id": "21-SA-5", "partenza": "11:05", "stopTimes": { "21_s1": "11:05", "21_s6": "11:25", "21_s10": "11:40", "21_s15": "11:48", "21_s19": "11:55" } },
                { "id": "21-SA-6", "partenza": "12:00", "note": "(c)", "stopTimes": { "21_s1": "12:00", "21_s6": "12:25", "21_s10": "12:40", "21_s15": "12:48", "21_s19": "12:55" } },
                { "id": "21-SA-7", "partenza": "13:45", "note": "(c)", "stopTimes": { "21_s1": "13:45", "21_s6": "14:10", "21_s10": "14:25", "21_s15": "14:32", "21_s19": "14:40" } },
                { "id": "21-SA-8", "partenza": "14:50", "note": "(c)", "stopTimes": { "21_s1": "14:50", "21_s6": "15:15", "21_s10": "15:30", "21_s15": "15:38", "21_s19": "15:45" } },
                { "id": "21-SA-9", "partenza": "16:40", "stopTimes": { "21_s1": "16:40", "21_s6": "17:00", "21_s10": "17:15", "21_s15": "17:22", "21_s19": "17:30" } },
                { "id": "21-SA-10", "partenza": "17:40", "stopTimes": { "21_s1": "17:40", "21_s6": "18:00", "21_s10": "18:15", "21_s15": "18:22", "21_s19": "18:30" } },
                { "id": "21-SA-11", "partenza": "18:40", "stopTimes": { "21_s1": "18:40", "21_s6": "19:00", "21_s10": "19:15", "21_s15": "19:22", "21_s19": "19:30" } },
                { "id": "21-SA-12", "partenza": "19:40", "stopTimes": { "21_s1": "19:40", "21_s6": "20:00", "21_s10": "20:15", "21_s15": "20:22", "21_s19": "20:30" } }
            ],
            "domenica": [
                { "id": "21-DO-1", "partenza": "07:00", "stopTimes": { "21_s1": "07:00", "21_s6": "07:20", "21_s19": "07:50" } },
                { "id": "21-DO-2", "partenza": "09:00", "stopTimes": { "21_s1": "09:00", "21_s6": "09:20", "21_s19": "09:50" } },
                { "id": "21-DO-3", "partenza": "11:00", "stopTimes": { "21_s1": "11:00", "21_s6": "11:20", "21_s19": "11:50" } },
                { "id": "21-DO-4", "partenza": "13:00", "stopTimes": { "21_s1": "13:00", "21_s6": "13:20", "21_s19": "13:50" } },
                { "id": "21-DO-5", "partenza": "15:10", "stopTimes": { "21_s1": "15:10", "21_s6": "15:30", "21_s19": "16:00" } },
                { "id": "21-DO-6", "partenza": "17:05", "stopTimes": { "21_s1": "17:05", "21_s6": "17:25", "21_s19": "17:55" } },
                { "id": "21-DO-7", "partenza": "19:00", "stopTimes": { "21_s1": "19:00", "21_s6": "19:20", "21_s19": "19:50" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 22
    # Viale Manzoni (Cerveteri) — Ceri — I Terzi — Ceri — Viale Manzoni
    # --------------------------------------------------------------------------
    "22": {
        "nome": "22 - Cerveteri - Ceri - I Terzi",
        "colore": "#7c3aed",
        "percorso_ufficiale": "Viale Manzoni (capolinea) - Via Settevene Palo - Via S. Paolo - Via di Ceri - Via Doganale - Via C. Mattei - I Terzi - Piazza Cardinal Tisserant (Capolinea) - I Terzi - Via C. Mattei - Via Doganale - Via di Ceri - Via S. Paolo - Via Settevene Palo - Viale Manzoni (capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) al ritorno effettua deviazione all'ISIS Enrico Mattei",
            "(b) Nei giorni scolastici (lun-ven) effettua coincidenza con la Linea 23 alla fermata di via Doganale (ang. Via Casetta Mattei)",
            "(c) All'andata effettua deviazione fino a Borgo S. Martino nei giorni scolastici (lun-ven)",
            "(d) Nei giorni scolastici (lun-ven) all'andata effettua deviazione all'ISIS Enrico Mattei",
            "N.B.: La domenica e nei giorni festivi la linea 22 NON effettua servizio."
        ],
        "stops": [
            { "id": "22_s1", "nome": "Viale Manzoni (Capolinea Cerveteri)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True },
            { "id": "22_s2", "nome": "Via Settevene Palo / Via Ceretana", "lat": 41.992279, "lng": 12.090225, "via": "Via Settevene Palo", "timing": False },
            { "id": "22_s3", "nome": "Via S. Paolo", "lat": 41.991000, "lng": 12.115000, "via": "Via S. Paolo", "timing": False },
            { "id": "22_s4", "nome": "Via di Ceri", "lat": 41.994000, "lng": 12.135000, "via": "Via di Ceri", "timing": False },
            { "id": "22_s5", "nome": "Borgo di Ceri (Bivio/Piazza)", "lat": 41.995400, "lng": 12.148700, "via": "Via di Ceri", "timing": False },
            { "id": "22_s6", "nome": "Via Doganale / Incrocio Casetta Mattei", "lat": 41.991500, "lng": 12.152000, "via": "Via Doganale", "timing": False },
            { "id": "22_s7", "nome": "Via C. Mattei", "lat": 41.994500, "lng": 12.158000, "via": "Via C. Mattei", "timing": False },
            { "id": "22_s8", "nome": "I Terzi (Piazza Cardinal Tisserant Capolinea)", "lat": 41.998000, "lng": 12.165000, "via": "Piazza Cardinal Tisserant", "timing": True },
            { "id": "22_s9", "nome": "I Terzi (Ritorno)", "lat": 41.997000, "lng": 12.163000, "via": "I Terzi", "timing": False },
            { "id": "22_s10", "nome": "Via C. Mattei (Ritorno)", "lat": 41.994500, "lng": 12.158000, "via": "Via C. Mattei", "timing": False },
            { "id": "22_s11", "nome": "Via Doganale (Ritorno)", "lat": 41.991500, "lng": 12.152000, "via": "Via Doganale", "timing": False },
            { "id": "22_s12", "nome": "Via di Ceri (Ritorno)", "lat": 41.994000, "lng": 12.135000, "via": "Via di Ceri", "timing": False },
            { "id": "22_s13", "nome": "Via S. Paolo (Ritorno)", "lat": 41.991000, "lng": 12.115000, "via": "Via S. Paolo", "timing": False },
            { "id": "22_s14", "nome": "Via Settevene Palo (Rientro Cerveteri)", "lat": 41.992279, "lng": 12.090225, "via": "Via Settevene Palo", "timing": False },
            { "id": "22_s15", "nome": "Viale Manzoni (Arrivo Capolinea)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "22-LS-1", "partenza": "06:55", "note": "(a-b)", "stopTimes": { "22_s1": "06:55", "22_s5": "07:15", "22_s8": "07:25", "22_s15": "08:00" } },
                { "id": "22-LS-2", "partenza": "09:05", "stopTimes": { "22_s1": "09:05", "22_s5": "09:25", "22_s8": "09:35", "22_s15": "10:05" } },
                { "id": "22-LS-3", "partenza": "11:10", "stopTimes": { "22_s1": "11:10", "22_s5": "11:30", "22_s8": "11:40", "22_s15": "12:10" } },
                { "id": "22-LS-4", "partenza": "14:30", "note": "(c-d)", "stopTimes": { "22_s1": "14:30", "22_s5": "14:55", "22_s8": "15:10", "22_s15": "15:40" } },
                { "id": "22-LS-5", "partenza": "17:00", "stopTimes": { "22_s1": "17:00", "22_s5": "17:25", "22_s8": "17:35", "22_s15": "18:10" } },
                { "id": "22-LS-6", "partenza": "19:25", "stopTimes": { "22_s1": "19:25", "22_s5": "19:50", "22_s8": "20:00", "22_s15": "20:35" } }
            ],
            "sabato": [
                { "id": "22-LS-1", "partenza": "06:55", "note": "(a-b)", "stopTimes": { "22_s1": "06:55", "22_s5": "07:15", "22_s8": "07:25", "22_s15": "08:00" } },
                { "id": "22-LS-2", "partenza": "09:05", "stopTimes": { "22_s1": "09:05", "22_s5": "09:25", "22_s8": "09:35", "22_s15": "10:05" } },
                { "id": "22-LS-3", "partenza": "11:10", "stopTimes": { "22_s1": "11:10", "22_s5": "11:30", "22_s8": "11:40", "22_s15": "12:10" } },
                { "id": "22-LS-4", "partenza": "14:30", "stopTimes": { "22_s1": "14:30", "22_s5": "14:55", "22_s8": "15:10", "22_s15": "15:40" } },
                { "id": "22-LS-5", "partenza": "17:00", "stopTimes": { "22_s1": "17:00", "22_s5": "17:25", "22_s8": "17:35", "22_s15": "18:10" } },
                { "id": "22-LS-6", "partenza": "19:25", "stopTimes": { "22_s1": "19:25", "22_s5": "19:50", "22_s8": "20:00", "22_s15": "20:35" } }
            ],
            "domenica": []  # Nessun servizio nei festivi
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 23
    # Viale Manzoni (Cerveteri) — Stazione FS Ladispoli — Valcanneto — Stazione FS Ladispoli — Viale Manzoni
    # --------------------------------------------------------------------------
    "23": {
        "nome": "23 - Cerveteri - FS Ladispoli - Valcanneto",
        "colore": "#0077cc",
        "percorso_ufficiale": "Viale Manzoni (capolinea) - Via Settevene Palo - Via Aurelia (Poliambulatorio) - Via Settevene Palo Nord - Via Taranto (Stazione FS) - Via Flavia - Via Milazzo - Viale Italia - Stazione FS Ladispoli - Via Amalfi - Via Trieste - Via Odescalchi - Via Palo Laziale - Via Aurelia - Via Doganale - Largo Monteverdi - Via Pergolesi - Via Vivaldi - Largo Vivaldi - Via Vivaldi - Via A. Boito - Via U. Giordano - Via Doganale - Via Aurelia - Via Palo Laziale - Via Genova - Stazione FS Ladispoli - Via Taranto - Via Settevene Palo Nord - Via Aurelia - Via Settevene Palo - Piazza Aldo Moro - Viale Manzoni (capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) al ritorno effettua deviazione a Palidoro FS",
            "(b) Nei giorni scolastici (lun-ven) al ritorno effettua deviazione all'ISIS Enrico Mattei",
            "(c) All'andata deviata all'ufficio postale di Ladispoli (via Sironi)",
            "(d) Al ritorno deviata all'ufficio postale di Ladispoli (via Sironi)",
            "(e) Nei giorni scolastici (lun-ven) all'andata effettua deviazione all'ISIS Enrico Mattei",
            "(f) Dopo Valcanneto transita a Borgo S. Martino",
            "(g) Nei giorni scolastici (lun-ven) all'andata effettua deviazione a Palidoro FS"
        ],
        "stops": [
            { "id": "23_s1", "nome": "Viale Manzoni (Capolinea Cerveteri)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True },
            { "id": "23_s2", "nome": "Via Settevene Palo / Ceretana", "lat": 41.992279, "lng": 12.090225, "via": "Via Settevene Palo", "timing": False },
            { "id": "23_s3", "nome": "Via Aurelia (Poliambulatorio Cerveteri)", "lat": 41.970301, "lng": 12.081321, "via": "Via Aurelia", "timing": False },
            { "id": "23_s4", "nome": "Via Settevene Palo Nord (Ladispoli)", "lat": 41.963500, "lng": 12.086000, "via": "Via Settevene Palo Nord", "timing": False },
            { "id": "23_s5", "nome": "Via Taranto (Stazione FS)", "lat": 41.955500, "lng": 12.083000, "via": "Via Taranto", "timing": False },
            { "id": "23_s6", "nome": "Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "23_s7", "nome": "Via Milazzo", "lat": 41.953000, "lng": 12.079500, "via": "Via Milazzo", "timing": False },
            { "id": "23_s8", "nome": "Viale Italia (Centro)", "lat": 41.952000, "lng": 12.078500, "via": "Viale Italia", "timing": False },
            { "id": "23_s9", "nome": "Stazione FS Ladispoli (Andata)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "23_s10", "nome": "Via Amalfi", "lat": 41.950500, "lng": 12.078000, "via": "Via Amalfi", "timing": False },
            { "id": "23_s11", "nome": "Via Trieste", "lat": 41.949000, "lng": 12.077000, "via": "Via Trieste", "timing": False },
            { "id": "23_s12", "nome": "Via Odescalchi", "lat": 41.948387, "lng": 12.080904, "via": "Via Odescalchi", "timing": False },
            { "id": "23_s13", "nome": "Via Palo Laziale", "lat": 41.945000, "lng": 12.081000, "via": "Via Palo Laziale", "timing": False },
            { "id": "23_s14", "nome": "Via Aurelia Sud", "lat": 41.940000, "lng": 12.095000, "via": "Via Aurelia", "timing": False },
            { "id": "23_s15", "nome": "Via Doganale / Bivio Valcanneto", "lat": 41.948370, "lng": 12.153723, "via": "Via Doganale", "timing": False },
            { "id": "23_s16", "nome": "Largo Monteverdi (Valcanneto Transito)", "lat": 41.947363, "lng": 12.155786, "via": "Largo Monteverdi", "timing": True },
            { "id": "23_s17", "nome": "Via Pergolesi", "lat": 41.949368, "lng": 12.155753, "via": "Via Pergolesi", "timing": False },
            { "id": "23_s18", "nome": "Via Vivaldi / Largo Vivaldi", "lat": 41.946474, "lng": 12.159243, "via": "Via Vivaldi", "timing": False },
            { "id": "23_s19", "nome": "Via A. Boito / Via U. Giordano", "lat": 41.954997, "lng": 12.159437, "via": "Via A. Boito", "timing": False },
            { "id": "23_s20", "nome": "Via Doganale (Ritorno)", "lat": 41.948370, "lng": 12.153723, "via": "Via Doganale", "timing": False },
            { "id": "23_s21", "nome": "Via Aurelia / Palo Laziale", "lat": 41.945000, "lng": 12.081000, "via": "Via Aurelia", "timing": False },
            { "id": "23_s22", "nome": "Via Genova", "lat": 41.951000, "lng": 12.080500, "via": "Via Genova", "timing": False },
            { "id": "23_s23", "nome": "Stazione FS Ladispoli (Ritorno)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "23_s24", "nome": "Via Taranto (Ritorno)", "lat": 41.955500, "lng": 12.083000, "via": "Via Taranto", "timing": False },
            { "id": "23_s25", "nome": "Via Settevene Palo Nord", "lat": 41.963500, "lng": 12.086000, "via": "Via Settevene Palo Nord", "timing": False },
            { "id": "23_s26", "nome": "Via Aurelia / Bivio Cerveteri", "lat": 41.970301, "lng": 12.081321, "via": "Via Aurelia", "timing": False },
            { "id": "23_s27", "nome": "Via Settevene Palo (Salita Cerveteri)", "lat": 41.985000, "lng": 12.089000, "via": "Via Settevene Palo", "timing": False },
            { "id": "23_s28", "nome": "Piazza Aldo Moro", "lat": 41.996100, "lng": 12.100800, "via": "Piazza Aldo Moro", "timing": False },
            { "id": "23_s29", "nome": "Viale Manzoni (Arrivo Capolinea)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "23-LV-1", "partenza": "05:25", "stopTimes": { "23_s1": "05:25", "23_s9": "05:40", "23_s16": "06:00", "23_s23": "06:15", "23_s29": "06:40" } },
                { "id": "23-LV-2", "partenza": "06:15", "note": "(a-b)", "stopTimes": { "23_s1": "06:15", "23_s9": "06:30", "23_s16": "06:50", "23_s23": "07:30", "23_s29": "07:45" } },
                { "id": "23-LV-3", "partenza": "06:40", "note": "(b)", "stopTimes": { "23_s1": "06:40", "23_s9": "06:55", "23_s16": "07:15", "23_s23": "07:30", "23_s29": "08:05" } },
                { "id": "23-LV-4", "partenza": "07:45", "note": "(c)", "stopTimes": { "23_s1": "07:45", "23_s9": "08:00", "23_s16": "08:30", "23_s23": "08:45", "23_s29": "09:15" } },
                { "id": "23-LV-5", "partenza": "08:25", "note": "(e-f)", "stopTimes": { "23_s1": "08:25", "23_s9": "08:40", "23_s16": "09:05", "23_s23": "09:25", "23_s29": "09:55" } },
                { "id": "23-LV-6", "partenza": "09:00", "note": "Scolastica (f)", "stopTimes": { "23_s1": "09:00", "23_s9": "09:15", "23_s16": "09:40", "23_s23": "10:00", "23_s29": "10:30" } },
                { "id": "23-LV-7", "partenza": "09:35", "note": "(f)", "stopTimes": { "23_s1": "09:35", "23_s9": "09:50", "23_s16": "10:15", "23_s23": "10:35", "23_s29": "11:05" } },
                { "id": "23-LV-8", "partenza": "10:10", "stopTimes": { "23_s1": "10:10", "23_s9": "10:25", "23_s16": "10:50", "23_s23": "11:05", "23_s29": "11:35" } },
                { "id": "23-LV-9", "partenza": "10:45", "note": "Scolastica", "stopTimes": { "23_s1": "10:45", "23_s9": "11:00", "23_s16": "11:25", "23_s23": "11:40", "23_s29": "12:10" } },
                { "id": "23-LV-10", "partenza": "11:15", "stopTimes": { "23_s1": "11:15", "23_s9": "11:30", "23_s16": "11:55", "23_s23": "12:10", "23_s29": "12:40" } },
                { "id": "23-LV-11", "partenza": "11:45", "stopTimes": { "23_s1": "11:45", "23_s9": "12:00", "23_s16": "12:20", "23_s23": "13:15", "23_s29": "13:45" } },
                { "id": "23-LV-12", "partenza": "13:00", "note": "(d-e-f)", "stopTimes": { "23_s1": "13:00", "23_s9": "13:15", "23_s16": "13:45", "23_s23": "14:05", "23_s29": "14:40" } },
                { "id": "23-LV-13", "partenza": "13:45", "note": "(c-e-f)", "stopTimes": { "23_s1": "13:45", "23_s9": "14:00", "23_s16": "14:40", "23_s23": "15:00", "23_s29": "15:25" } },
                { "id": "23-LV-14", "partenza": "14:40", "note": "(e-f)", "stopTimes": { "23_s1": "14:40", "23_s9": "14:55", "23_s16": "15:25", "23_s23": "15:45", "23_s29": "16:15" } },
                { "id": "23-LV-15", "partenza": "15:25", "stopTimes": { "23_s1": "15:25", "23_s9": "15:40", "23_s16": "16:05", "23_s23": "16:20", "23_s29": "16:50" } },
                { "id": "23-LV-16", "partenza": "15:55", "note": "Scolastica", "stopTimes": { "23_s1": "15:55", "23_s9": "16:10", "23_s16": "16:35", "23_s23": "16:50", "23_s29": "17:20" } },
                { "id": "23-LV-17", "partenza": "16:25", "stopTimes": { "23_s1": "16:25", "23_s9": "16:40", "23_s16": "17:05", "23_s23": "17:20", "23_s29": "17:50" } },
                { "id": "23-LV-18", "partenza": "17:05", "stopTimes": { "23_s1": "17:05", "23_s9": "17:20", "23_s16": "17:45", "23_s23": "18:00", "23_s29": "18:30" } },
                { "id": "23-LV-19", "partenza": "17:35", "note": "Scolastica (f)", "stopTimes": { "23_s1": "17:35", "23_s9": "17:50", "23_s16": "18:15", "23_s23": "18:35", "23_s29": "19:05" } },
                { "id": "23-LV-20", "partenza": "18:10", "note": "(g)", "stopTimes": { "23_s1": "18:10", "23_s9": "18:25", "23_s16": "18:55", "23_s23": "19:10", "23_s29": "19:40" } },
                { "id": "23-LV-21", "partenza": "19:00", "note": "(g)", "stopTimes": { "23_s1": "19:00", "23_s9": "19:15", "23_s16": "19:55", "23_s23": "20:10", "23_s29": "20:40" } },
                { "id": "23-LV-22", "partenza": "19:20", "note": "Scolastica", "stopTimes": { "23_s1": "19:20", "23_s9": "19:35", "23_s16": "20:00", "23_s23": "20:15", "23_s29": "20:45" } },
                { "id": "23-LV-23", "partenza": "19:55", "stopTimes": { "23_s1": "19:55", "23_s9": "20:10", "23_s16": "20:35" } }
            ],
            "sabato": [
                { "id": "23-SA-1", "partenza": "05:25", "stopTimes": { "23_s1": "05:25", "23_s9": "05:40", "23_s16": "06:00", "23_s23": "06:15", "23_s29": "06:40" } },
                { "id": "23-SA-2", "partenza": "06:15", "stopTimes": { "23_s1": "06:15", "23_s9": "06:30", "23_s16": "06:50", "23_s23": "07:05", "23_s29": "07:30" } },
                { "id": "23-SA-3", "partenza": "06:45", "stopTimes": { "23_s1": "06:45", "23_s9": "07:00", "23_s16": "07:20", "23_s23": "07:35", "23_s29": "08:00" } },
                { "id": "23-SA-4", "partenza": "07:35", "note": "(d)", "stopTimes": { "23_s1": "07:35", "23_s9": "07:50", "23_s16": "08:10", "23_s23": "08:25", "23_s29": "08:50" } },
                { "id": "23-SA-5", "partenza": "08:00", "note": "(e-f)", "stopTimes": { "23_s1": "08:00", "23_s9": "08:15", "23_s16": "08:35", "23_s23": "08:55", "23_s29": "09:25" } },
                { "id": "23-SA-6", "partenza": "08:55", "note": "(f)", "stopTimes": { "23_s1": "08:55", "23_s9": "09:10", "23_s16": "09:30", "23_s23": "09:50", "23_s29": "10:20" } },
                { "id": "23-SA-7", "partenza": "09:30", "note": "(f)", "stopTimes": { "23_s1": "09:30", "23_s9": "09:45", "23_s16": "10:05", "23_s23": "10:25", "23_s29": "10:55" } },
                { "id": "23-SA-8", "partenza": "10:30", "stopTimes": { "23_s1": "10:30", "23_s9": "10:50", "23_s16": "11:05", "23_s23": "11:20", "23_s29": "11:45" } },
                { "id": "23-SA-9", "partenza": "11:05", "stopTimes": { "23_s1": "11:05", "23_s9": "11:20", "23_s16": "11:40", "23_s23": "11:55", "23_s29": "12:25" } },
                { "id": "23-SA-10", "partenza": "11:50", "stopTimes": { "23_s1": "11:50", "23_s9": "12:05", "23_s16": "12:25", "23_s23": "12:40", "23_s29": "13:05" } },
                { "id": "23-SA-11", "partenza": "12:45", "stopTimes": { "23_s1": "12:45", "23_s9": "13:00", "23_s16": "13:20", "23_s23": "13:35", "23_s29": "14:00" } },
                { "id": "23-SA-12", "partenza": "13:30", "note": "(d-f)", "stopTimes": { "23_s1": "13:30", "23_s9": "13:45", "23_s16": "14:05", "23_s23": "14:25", "23_s29": "14:50" } },
                { "id": "23-SA-13", "partenza": "14:05", "note": "(f)", "stopTimes": { "23_s1": "14:05", "23_s9": "14:20", "23_s16": "14:40", "23_s23": "15:00", "23_s29": "15:30" } },
                { "id": "23-SA-14", "partenza": "15:00", "note": "(f)", "stopTimes": { "23_s1": "15:00", "23_s9": "15:15", "23_s16": "15:35", "23_s23": "15:55", "23_s29": "16:25" } },
                { "id": "23-SA-15", "partenza": "15:35", "stopTimes": { "23_s1": "15:35", "23_s9": "15:50", "23_s16": "16:10", "23_s23": "16:25", "23_s29": "16:50" } },
                { "id": "23-SA-16", "partenza": "16:30", "stopTimes": { "23_s1": "16:30", "23_s9": "16:45", "23_s16": "17:05", "23_s23": "17:20", "23_s29": "17:45" } },
                { "id": "23-SA-17", "partenza": "17:00", "stopTimes": { "23_s1": "17:00", "23_s9": "17:15", "23_s16": "17:35", "23_s23": "17:50", "23_s29": "18:15" } },
                { "id": "23-SA-18", "partenza": "17:50", "note": "(f)", "stopTimes": { "23_s1": "17:50", "23_s9": "18:05", "23_s16": "18:25", "23_s23": "18:40", "23_s29": "19:15" } },
                { "id": "23-SA-19", "partenza": "18:25", "stopTimes": { "23_s1": "18:25", "23_s9": "18:40", "23_s16": "19:00", "23_s23": "19:15", "23_s29": "19:40" } },
                { "id": "23-SA-20", "partenza": "19:20", "stopTimes": { "23_s1": "19:20", "23_s9": "19:35", "23_s16": "19:55", "23_s23": "20:10", "23_s29": "20:35" } }
            ],
            "domenica": [
                { "id": "23-DO-1", "partenza": "07:00", "stopTimes": { "23_s1": "07:00", "23_s9": "07:15", "23_s16": "07:35", "23_s23": "07:50", "23_s29": "08:15" } },
                { "id": "23-DO-2", "partenza": "08:55", "stopTimes": { "23_s1": "08:55", "23_s9": "09:10", "23_s16": "09:30", "23_s23": "09:45", "23_s29": "10:10" } },
                { "id": "23-DO-3", "partenza": "10:50", "stopTimes": { "23_s1": "10:50", "23_s9": "11:05", "23_s16": "11:25", "23_s23": "11:40", "23_s29": "12:05" } },
                { "id": "23-DO-4", "partenza": "12:15", "stopTimes": { "23_s1": "12:15", "23_s9": "12:30", "23_s16": "12:50", "23_s23": "13:05", "23_s29": "13:30" } },
                { "id": "23-DO-5", "partenza": "14:00", "stopTimes": { "23_s1": "14:00", "23_s9": "14:15", "23_s16": "14:35", "23_s23": "14:50", "23_s29": "15:15" } },
                { "id": "23-DO-6", "partenza": "15:55", "stopTimes": { "23_s1": "15:55", "23_s9": "16:10", "23_s16": "16:30", "23_s23": "16:45", "23_s29": "17:10" } },
                { "id": "23-DO-7", "partenza": "17:50", "stopTimes": { "23_s1": "17:50", "23_s9": "18:05", "23_s16": "18:25", "23_s23": "18:40", "23_s29": "19:05" } },
                { "id": "23-DO-8", "partenza": "19:15", "stopTimes": { "23_s1": "19:15", "23_s9": "19:30", "23_s16": "19:50", "23_s23": "20:05", "23_s29": "20:30" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 24
    # Viale Manzoni (Cerveteri) — Tirsenia — Cerenova FS — Campo di Mare — Cerenova FS — Tirsenia — Viale Manzoni
    # --------------------------------------------------------------------------
    "24": {
        "nome": "24 - Cerveteri - Tirsenia - Cerenova FS - Campo di Mare",
        "colore": "#059669",
        "percorso_ufficiale": "Viale Manzoni (capolinea) - Via Mura Castellane - Via Settevene Palo - Via Chirieletti - Via F. Morella - Largo Roma - Via Agilla - Viale Angelucci - Viale Campo di Mare - Via G. Marini - Via Oriolo - Via Satrico - Via Chiusi - Via Fregene - Via Capua - Via Suessola - Via P. Alfani - Piazza R. Fagnani - Via Oriolo - Via Eufronius - Viale Campo di Mare - Viale Mediterraneo - Lungomare Dei Navigatori Etruschi - Viale Adriatico - Stazione FS Cerenova (capolinea) - Via P. Alfani - Via Sessuola - Via Capua - Via Fregene - Via Chiusi - Via Satrico - Via Oriolo - Via G. Marini - Viale Angelucci - Via Caere Vetus - Via F. Morella - Via Chirieletti - Via Settevene Palo - Via Ceretana - Viale Manzoni (capolinea)",
        "note": [
            "(a) Transita al C.C. Coop all'andata e al ritorno",
            "(b) Transita allo Stadio Galli e al C.C. Coop all'andata e al ritorno",
            "N.B.: La domenica e nei giorni festivi la linea 24 NON effettua servizio."
        ],
        "stops": [
            { "id": "24_s1", "nome": "Viale Manzoni (Capolinea Cerveteri)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True },
            { "id": "24_s2", "nome": "Via Mura Castellane", "lat": 41.994200, "lng": 12.091200, "via": "Via Mura Castellane", "timing": False },
            { "id": "24_s3", "nome": "Via Settevene Palo (Discesa)", "lat": 41.988000, "lng": 12.089000, "via": "Via Settevene Palo", "timing": False },
            { "id": "24_s4", "nome": "Via Chirieletti", "lat": 41.980000, "lng": 12.088000, "via": "Via Chirieletti", "timing": False },
            { "id": "24_s5", "nome": "Via F. Morella (Tirsenia)", "lat": 41.972000, "lng": 12.083000, "via": "Via Fontana Morella", "timing": False },
            { "id": "24_s6", "nome": "Largo Roma", "lat": 41.967500, "lng": 12.083500, "via": "Largo Roma", "timing": False },
            { "id": "24_s7", "nome": "Via Agilla", "lat": 41.966000, "lng": 12.084500, "via": "Via Agilla", "timing": False },
            { "id": "24_s8", "nome": "Viale Angelucci", "lat": 41.964500, "lng": 12.084000, "via": "Viale Angelucci", "timing": False },
            { "id": "24_s9", "nome": "Viale Campo di Mare", "lat": 41.962500, "lng": 12.083500, "via": "Viale Campo di Mare", "timing": False },
            { "id": "24_s10", "nome": "Via G. Marini", "lat": 41.963500, "lng": 12.079000, "via": "Via G. Marini", "timing": False },
            { "id": "24_s11", "nome": "Via Oriolo", "lat": 41.962800, "lng": 12.076000, "via": "Via Oriolo", "timing": False },
            { "id": "24_s12", "nome": "Via Satrico", "lat": 41.961500, "lng": 12.074000, "via": "Via Satrico", "timing": False },
            { "id": "24_s13", "nome": "Via Chiusi", "lat": 41.959500, "lng": 12.073000, "via": "Via Chiusi", "timing": False },
            { "id": "24_s14", "nome": "Via Fregene", "lat": 41.958000, "lng": 12.075000, "via": "Via Fregene", "timing": False },
            { "id": "24_s15", "nome": "Via Capua / Via Suessola", "lat": 41.956500, "lng": 12.078000, "via": "Via Capua", "timing": False },
            { "id": "24_s16", "nome": "Via P. Alfani", "lat": 41.958500, "lng": 12.080500, "via": "Via P. Alfani", "timing": False },
            { "id": "24_s17", "nome": "Piazza R. Fagnani", "lat": 41.961000, "lng": 12.077500, "via": "Piazza R. Fagnani", "timing": False },
            { "id": "24_s18", "nome": "Via Eufronius", "lat": 41.959000, "lng": 12.071500, "via": "Via Eufronius", "timing": False },
            { "id": "24_s19", "nome": "Viale Mediterraneo", "lat": 41.955000, "lng": 12.071000, "via": "Viale Mediterraneo", "timing": False },
            { "id": "24_s20", "nome": "Lungomare dei Navigatori Etruschi", "lat": 41.952500, "lng": 12.069000, "via": "Lungomare Navigatori Etruschi", "timing": False },
            { "id": "24_s21", "nome": "Viale Adriatico", "lat": 41.954000, "lng": 12.074000, "via": "Viale Adriatico", "timing": False },
            { "id": "24_s22", "nome": "Stazione FS Cerenova (Arrivo/Partenza)", "lat": 41.960693, "lng": 12.082584, "via": "Viale Campo di Mare", "timing": True },
            { "id": "24_s23", "nome": "Via Caere Vetus (Ritorno)", "lat": 41.967500, "lng": 12.083500, "via": "Via Caere Vetus", "timing": False },
            { "id": "24_s24", "nome": "Via F. Morella (Ritorno)", "lat": 41.972000, "lng": 12.083000, "via": "Via Fontana Morella", "timing": False },
            { "id": "24_s25", "nome": "Via Chirieletti (Ritorno)", "lat": 41.980000, "lng": 12.088000, "via": "Via Chirieletti", "timing": False },
            { "id": "24_s26", "nome": "Via Settevene Palo (Salita)", "lat": 41.988000, "lng": 12.089000, "via": "Via Settevene Palo", "timing": False },
            { "id": "24_s27", "nome": "Via Ceretana", "lat": 41.993500, "lng": 12.095000, "via": "Via Ceretana", "timing": False },
            { "id": "24_s28", "nome": "Viale Manzoni (Arrivo Capolinea)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "24-LS-1", "partenza": "06:00", "note": "(a)", "stopTimes": { "24_s1": "06:00", "24_s22": "06:30", "24_s28": "06:55" } },
                { "id": "24-LS-2", "partenza": "08:05", "note": "(a)", "stopTimes": { "24_s1": "08:05", "24_s22": "08:35", "24_s28": "09:00" } },
                { "id": "24-LS-3", "partenza": "10:10", "note": "(a)", "stopTimes": { "24_s1": "10:10", "24_s22": "10:40", "24_s28": "11:05" } },
                { "id": "24-LS-4", "partenza": "12:15", "note": "(a)", "stopTimes": { "24_s1": "12:15", "24_s22": "12:45", "24_s28": "13:10" } },
                { "id": "24-LS-5", "partenza": "13:30", "note": "(a)", "stopTimes": { "24_s1": "13:30", "24_s22": "14:00", "24_s28": "14:25" } },
                { "id": "24-LS-6", "partenza": "15:45", "note": "(b)", "stopTimes": { "24_s1": "15:45", "24_s22": "16:20", "24_s28": "16:50" } },
                { "id": "24-LS-7", "partenza": "18:15", "note": "(b)", "stopTimes": { "24_s1": "18:15", "24_s22": "18:50", "24_s28": "19:20" } }
            ],
            "sabato": [
                { "id": "24-LS-1", "partenza": "06:00", "note": "(a)", "stopTimes": { "24_s1": "06:00", "24_s22": "06:30", "24_s28": "06:55" } },
                { "id": "24-LS-2", "partenza": "08:05", "note": "(a)", "stopTimes": { "24_s1": "08:05", "24_s22": "08:35", "24_s28": "09:00" } },
                { "id": "24-LS-3", "partenza": "10:10", "note": "(a)", "stopTimes": { "24_s1": "10:10", "24_s22": "10:40", "24_s28": "11:05" } },
                { "id": "24-LS-4", "partenza": "12:15", "note": "(a)", "stopTimes": { "24_s1": "12:15", "24_s22": "12:45", "24_s28": "13:10" } },
                { "id": "24-LS-5", "partenza": "13:30", "note": "(a)", "stopTimes": { "24_s1": "13:30", "24_s22": "14:00", "24_s28": "14:25" } },
                { "id": "24-LS-6", "partenza": "15:45", "note": "(b)", "stopTimes": { "24_s1": "15:45", "24_s22": "16:20", "24_s28": "16:50" } },
                { "id": "24-LS-7", "partenza": "18:15", "note": "(b)", "stopTimes": { "24_s1": "18:15", "24_s22": "18:50", "24_s28": "19:20" } }
            ],
            "domenica": []  # Nessun servizio nei festivi
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 25
    # Viale Manzoni (Cerveteri) — Tirsenia — Cerenova FS — Campo di Mare — Cerenova FS — Tirsenia — Viale Manzoni
    # --------------------------------------------------------------------------
    "25": {
        "nome": "25 - Cerveteri - Tirsenia - Cerenova FS",
        "colore": "#d97706",
        "percorso_ufficiale": "Viale Manzoni (capolinea) - Via Mura Castellane - Viale Manzoni - Via Settevene Palo - Via Chirieletti - Via F. Morella - Largo Roma - Via Agilla - Viale Angelucci - Viale Campo di Mare - Stazione FS Cerenova - Viale Mediterraneo - Lungomare Navigatori Etruschi - Viale Adriatico - Stazione FS Cerenova (capolinea) - Viale Campo di Mare - Viale Angelucci - Via Caere Vetus - Via F. Morella - Via Chirieletti - Via Settevene Palo - Via Ceretana - Viale Manzoni (capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) al ritorno effettua deviazione all'ISIS Enrico Mattei",
            "(b) Nei giorni scolastici (lun-ven) all'andata effettua deviazione all'ISIS Enrico Mattei",
            "(c) Dal martedì al sabato prolungata alla Necropoli al ritorno",
            "(d) Prolungata alla Necropoli al ritorno (domenica)"
        ],
        "stops": [
            { "id": "25_s1", "nome": "Viale Manzoni (Capolinea Cerveteri)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True },
            { "id": "25_s2", "nome": "Via Mura Castellane", "lat": 41.994200, "lng": 12.091200, "via": "Via Mura Castellane", "timing": False },
            { "id": "25_s3", "nome": "Via Settevene Palo", "lat": 41.988000, "lng": 12.089000, "via": "Via Settevene Palo", "timing": False },
            { "id": "25_s4", "nome": "Via Chirieletti", "lat": 41.980000, "lng": 12.088000, "via": "Via Chirieletti", "timing": False },
            { "id": "25_s5", "nome": "Via F. Morella", "lat": 41.972000, "lng": 12.083000, "via": "Via Fontana Morella", "timing": False },
            { "id": "25_s6", "nome": "Largo Roma", "lat": 41.967500, "lng": 12.083500, "via": "Largo Roma", "timing": False },
            { "id": "25_s7", "nome": "Via Agilla", "lat": 41.966000, "lng": 12.084500, "via": "Via Agilla", "timing": False },
            { "id": "25_s8", "nome": "Viale Angelucci", "lat": 41.964500, "lng": 12.084000, "via": "Viale Angelucci", "timing": False },
            { "id": "25_s9", "nome": "Viale Campo di Mare", "lat": 41.962500, "lng": 12.083500, "via": "Viale Campo di Mare", "timing": False },
            { "id": "25_s10", "nome": "Stazione FS Cerenova (Transito Andata)", "lat": 41.960693, "lng": 12.082584, "via": "Viale Campo di Mare", "timing": False },
            { "id": "25_s11", "nome": "Viale Mediterraneo", "lat": 41.955000, "lng": 12.071000, "via": "Viale Mediterraneo", "timing": False },
            { "id": "25_s12", "nome": "Lungomare Navigatori Etruschi", "lat": 41.952500, "lng": 12.069000, "via": "Lungomare Navigatori Etruschi", "timing": False },
            { "id": "25_s13", "nome": "Viale Adriatico", "lat": 41.954000, "lng": 12.074000, "via": "Viale Adriatico", "timing": False },
            { "id": "25_s14", "nome": "Stazione FS Cerenova (Capolinea Transito)", "lat": 41.960693, "lng": 12.082584, "via": "Viale Campo di Mare", "timing": True },
            { "id": "25_s15", "nome": "Viale Campo di Mare (Ritorno)", "lat": 41.962500, "lng": 12.083500, "via": "Viale Campo di Mare", "timing": False },
            { "id": "25_s16", "nome": "Viale Angelucci (Ritorno)", "lat": 41.964500, "lng": 12.084000, "via": "Viale Angelucci", "timing": False },
            { "id": "25_s17", "nome": "Via Caere Vetus", "lat": 41.967500, "lng": 12.083500, "via": "Via Caere Vetus", "timing": False },
            { "id": "25_s18", "nome": "Via F. Morella (Ritorno)", "lat": 41.972000, "lng": 12.083000, "via": "Via Fontana Morella", "timing": False },
            { "id": "25_s19", "nome": "Via Chirieletti (Ritorno)", "lat": 41.980000, "lng": 12.088000, "via": "Via Chirieletti", "timing": False },
            { "id": "25_s20", "nome": "Via Settevene Palo (Salita)", "lat": 41.988000, "lng": 12.089000, "via": "Via Settevene Palo", "timing": False },
            { "id": "25_s21", "nome": "Via Ceretana", "lat": 41.993500, "lng": 12.095000, "via": "Via Ceretana", "timing": False },
            { "id": "25_s22", "nome": "Viale Manzoni (Arrivo Capolinea)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "25-LV-1", "partenza": "05:40", "stopTimes": { "25_s1": "05:40", "25_s14": "06:05", "25_s22": "06:20" } },
                { "id": "25-LV-2", "partenza": "06:20", "stopTimes": { "25_s1": "06:20", "25_s14": "06:45", "25_s22": "07:00" } },
                { "id": "25-LV-3", "partenza": "07:00", "note": "(a)", "stopTimes": { "25_s1": "07:00", "25_s14": "07:25", "25_s22": "07:50" } },
                { "id": "25-LV-4", "partenza": "07:50", "note": "(b)", "stopTimes": { "25_s1": "07:50", "25_s14": "08:20", "25_s22": "08:35" } },
                { "id": "25-LV-5", "partenza": "09:00", "note": "(c)", "stopTimes": { "25_s1": "09:00", "25_s14": "09:25", "25_s22": "09:50" } },
                { "id": "25-LV-6", "partenza": "10:00", "note": "(c)", "stopTimes": { "25_s1": "10:00", "25_s14": "10:30", "25_s22": "10:55" } },
                { "id": "25-LV-7", "partenza": "11:00", "note": "(c)", "stopTimes": { "25_s1": "11:00", "25_s14": "11:30", "25_s22": "11:45" } },
                { "id": "25-LV-8", "partenza": "11:50", "stopTimes": { "25_s1": "11:50", "25_s14": "12:15", "25_s22": "12:30" } },
                { "id": "25-LV-9", "partenza": "12:50", "note": "(b)", "stopTimes": { "25_s1": "12:50", "25_s14": "13:20", "25_s22": "13:35" } },
                { "id": "25-LV-10", "partenza": "13:40", "note": "(b)", "stopTimes": { "25_s1": "13:40", "25_s14": "14:10", "25_s22": "14:25" } },
                { "id": "25-LV-11", "partenza": "14:40", "note": "(b-c)", "stopTimes": { "25_s1": "14:40", "25_s14": "15:10", "25_s22": "15:35" } },
                { "id": "25-LV-12", "partenza": "15:50", "note": "(c)", "stopTimes": { "25_s1": "15:50", "25_s14": "16:20", "25_s22": "16:45" } },
                { "id": "25-LV-13", "partenza": "17:00", "note": "(c)", "stopTimes": { "25_s1": "17:00", "25_s14": "17:30", "25_s22": "17:45" } },
                { "id": "25-LV-14", "partenza": "18:00", "stopTimes": { "25_s1": "18:00", "25_s14": "18:25", "25_s22": "18:40" } },
                { "id": "25-LV-15", "partenza": "19:00", "stopTimes": { "25_s1": "19:00", "25_s14": "19:25", "25_s22": "19:40" } },
                { "id": "25-LV-16", "partenza": "20:00", "stopTimes": { "25_s1": "20:00", "25_s14": "20:25", "25_s22": "20:40" } }
            ],
            "sabato": [
                { "id": "25-SA-1", "partenza": "06:00", "stopTimes": { "25_s1": "06:00", "25_s14": "06:25", "25_s22": "06:40" } },
                { "id": "25-SA-2", "partenza": "06:40", "stopTimes": { "25_s1": "06:40", "25_s14": "07:05", "25_s22": "07:20" } },
                { "id": "25-SA-3", "partenza": "07:40", "stopTimes": { "25_s1": "07:40", "25_s14": "08:05", "25_s22": "08:20" } },
                { "id": "25-SA-4", "partenza": "08:20", "stopTimes": { "25_s1": "08:20", "25_s14": "08:45", "25_s22": "09:00" } },
                { "id": "25-SA-5", "partenza": "09:20", "note": "(c)", "stopTimes": { "25_s1": "09:20", "25_s14": "09:45", "25_s22": "10:10" } },
                { "id": "25-SA-6", "partenza": "10:20", "note": "(c)", "stopTimes": { "25_s1": "10:20", "25_s14": "10:50", "25_s22": "11:15" } },
                { "id": "25-SA-7", "partenza": "11:20", "note": "(c)", "stopTimes": { "25_s1": "11:20", "25_s14": "11:50", "25_s22": "12:05" } },
                { "id": "25-SA-8", "partenza": "12:20", "stopTimes": { "25_s1": "12:20", "25_s14": "12:45", "25_s22": "13:00" } },
                { "id": "25-SA-9", "partenza": "13:20", "stopTimes": { "25_s1": "13:20", "25_s14": "13:45", "25_s22": "14:00" } },
                { "id": "25-SA-10", "partenza": "14:20", "stopTimes": { "25_s1": "14:20", "25_s14": "14:45", "25_s22": "15:00" } },
                { "id": "25-SA-11", "partenza": "15:00", "note": "(c)", "stopTimes": { "25_s1": "15:00", "25_s14": "15:25", "25_s22": "15:50" } },
                { "id": "25-SA-12", "partenza": "16:05", "note": "(c)", "stopTimes": { "25_s1": "16:05", "25_s14": "16:35", "25_s22": "17:00" } },
                { "id": "25-SA-13", "partenza": "17:20", "stopTimes": { "25_s1": "17:20", "25_s14": "17:50", "25_s22": "18:05" } },
                { "id": "25-SA-14", "partenza": "18:20", "stopTimes": { "25_s1": "18:20", "25_s14": "18:45", "25_s22": "19:00" } },
                { "id": "25-SA-15", "partenza": "19:20", "stopTimes": { "25_s1": "19:20", "25_s14": "19:45", "25_s22": "20:00" } }
            ],
            "domenica": [
                { "id": "25-DO-1", "partenza": "08:00", "stopTimes": { "25_s1": "08:00", "25_s14": "08:25", "25_s22": "08:40" } },
                { "id": "25-DO-2", "partenza": "10:00", "note": "(d)", "stopTimes": { "25_s1": "10:00", "25_s14": "10:25", "25_s22": "10:50" } },
                { "id": "25-DO-3", "partenza": "12:00", "note": "(d)", "stopTimes": { "25_s1": "12:00", "25_s14": "12:30", "25_s22": "12:55" } },
                { "id": "25-DO-4", "partenza": "14:10", "note": "(d)", "stopTimes": { "25_s1": "14:10", "25_s14": "14:40", "25_s22": "15:05" } },
                { "id": "25-DO-5", "partenza": "16:05", "note": "(d)", "stopTimes": { "25_s1": "16:05", "25_s14": "16:35", "25_s22": "17:00" } },
                { "id": "25-DO-6", "partenza": "18:00", "stopTimes": { "25_s1": "18:00", "25_s14": "18:20", "25_s22": "18:50" } },
                { "id": "25-DO-7", "partenza": "20:00", "stopTimes": { "25_s1": "20:00", "25_s14": "20:25", "25_s22": "20:40" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 26
    # Viale Manzoni (Cerveteri) — Cimitero — Viale Manzoni (Cerveteri)
    # --------------------------------------------------------------------------
    "26": {
        "nome": "26 - Cerveteri - Cimitero",
        "colore": "#6b7280",
        "percorso_ufficiale": "Viale Manzoni (Capolinea) - Via Rosati - Via Merlini - Via Matteotti - Via S. Pietro - P.zza S. Pietro - Via Piave - Via Po - Via S. Angelo - Via dei Vignali - Piazzale del Cimitero (Capolinea) - Via dei Vignali - Via S. Angelo - V. Manzoni (capolinea)",
        "note": [],
        "stops": [
            { "id": "26_s1", "nome": "Viale Manzoni (Capolinea Cerveteri)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True },
            { "id": "26_s2", "nome": "Via Rosati", "lat": 41.996500, "lng": 12.094000, "via": "Via Rosati", "timing": False },
            { "id": "26_s3", "nome": "Via Merlini", "lat": 41.997200, "lng": 12.096500, "via": "Via Merlini", "timing": False },
            { "id": "26_s4", "nome": "Via Matteotti", "lat": 41.998000, "lng": 12.098500, "via": "Via Matteotti", "timing": False },
            { "id": "26_s5", "nome": "Via S. Pietro", "lat": 41.998500, "lng": 12.099500, "via": "Via S. Pietro", "timing": False },
            { "id": "26_s6", "nome": "Piazza S. Pietro", "lat": 41.998800, "lng": 12.100200, "via": "Piazza S. Pietro", "timing": False },
            { "id": "26_s7", "nome": "Via Piave", "lat": 41.997800, "lng": 12.102000, "via": "Via Piave", "timing": False },
            { "id": "26_s8", "nome": "Via Po", "lat": 41.996000, "lng": 12.103500, "via": "Via Po", "timing": False },
            { "id": "26_s9", "nome": "Via S. Angelo", "lat": 41.993000, "lng": 12.105000, "via": "Via S. Angelo", "timing": False },
            { "id": "26_s10", "nome": "Via dei Vignali", "lat": 41.992000, "lng": 12.106000, "via": "Via dei Vignali", "timing": False },
            { "id": "26_s11", "nome": "Piazzale del Cimitero (Capolinea Transito)", "lat": 41.991200, "lng": 12.107000, "via": "Piazzale Cimitero", "timing": True },
            { "id": "26_s12", "nome": "Via dei Vignali (Ritorno)", "lat": 41.992000, "lng": 12.106000, "via": "Via dei Vignali", "timing": False },
            { "id": "26_s13", "nome": "Via S. Angelo (Ritorno)", "lat": 41.993000, "lng": 12.105000, "via": "Via S. Angelo", "timing": False },
            { "id": "26_s14", "nome": "Viale Manzoni (Arrivo Capolinea)", "lat": 41.995641, "lng": 12.092690, "via": "Viale Manzoni", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "26-LV-1", "partenza": "09:25", "stopTimes": { "26_s1": "09:25", "26_s11": "09:35", "26_s14": "10:10" } },
                { "id": "26-LV-2", "partenza": "15:50", "stopTimes": { "26_s1": "15:50", "26_s11": "16:00", "26_s14": "16:35" } }
            ],
            "sabato": [
                { "id": "26-SA-1", "partenza": "09:15", "stopTimes": { "26_s1": "09:15", "26_s11": "09:25", "26_s14": "10:00" } },
                { "id": "26-SA-2", "partenza": "15:50", "stopTimes": { "26_s1": "15:50", "26_s11": "16:00", "26_s14": "16:35" } }
            ],
            "domenica": [
                { "id": "26-DO-1", "partenza": "08:25", "stopTimes": { "26_s1": "08:25", "26_s11": "08:35", "26_s14": "08:45" } },
                { "id": "26-DO-2", "partenza": "10:20", "stopTimes": { "26_s1": "10:20", "26_s11": "10:30", "26_s14": "10:40" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 27
    # Stazione FS Ladispoli — Centro — Poste — Poliambulatorio — Miami — Poste — Centro — Stazione FS Ladispoli
    # --------------------------------------------------------------------------
    "27": {
        "nome": "27 - FS Ladispoli - Centro - Poliambulatorio - Miami",
        "colore": "#ec4899",
        "percorso_ufficiale": "Stazione FS Ladispoli (capolinea) - Via Amalfi - Via Trieste - Via Ancona - Via Flavia - Via Firenze - Piazza Falcone - Via De Begnac - Via Caltagirone (Poste-Istituto Alberghiero) - cavalcavia 9 novembre - Viale Europa - Via Settevene Palo Nord - Via Costantini (Cimitero) - Via A. Moro (Poliambulatorio) - Via Berlinguer (Zona Artigianale) - Via Costantini - Via Settevene Palo Nord - Viale California - Via Alabama - Via Georgia - Viale America - Via Settevene Palo Nord - Viale Mediterraneo - Via Parigi - Via Dublino - Via Reykjavik - Via Londra - Via Stoccolma - Via Atene - Via Tirana - Via Budapest - Via Nicosia - Via Praga - Via Mosca - Viale Mediterraneo - Via Dei Narcisi - Via Dei Gelsomini - Via Dei Mughetti - Via Delle Camelie - Via Delle Mimose - Via delle Primule - Via Dele Rose - Via del campo sportivo - Via Settevene Palo Nord - Viale Europa - Via Caltagirone (Poste-Istituto Alberghiero) - Via Firenze - Via Flavia - Via Odescalchi - Via Genova - Stazione FS Ladispoli (capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) transita in tutti gli istituti scolastici",
            "(b) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini (entrambe le sedi)",
            "(c) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini (no Nazario Sauro) all'Ist. Di Vittorio"
        ],
        "stops": [
            { "id": "27_s1", "nome": "Stazione FS Ladispoli (Capolinea Partenza)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "27_s2", "nome": "Via Amalfi", "lat": 41.950500, "lng": 12.078000, "via": "Via Amalfi", "timing": False },
            { "id": "27_s3", "nome": "Via Trieste", "lat": 41.949000, "lng": 12.077000, "via": "Via Trieste", "timing": False },
            { "id": "27_s4", "nome": "Via Ancona", "lat": 41.951500, "lng": 12.075000, "via": "Via Ancona", "timing": False },
            { "id": "27_s5", "nome": "Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "27_s6", "nome": "Via Firenze / Piazza Falcone", "lat": 41.956500, "lng": 12.082000, "via": "Via Firenze", "timing": False },
            { "id": "27_s7", "nome": "Via De Begnac", "lat": 41.957500, "lng": 12.083500, "via": "Via De Begnac", "timing": False },
            { "id": "27_s8", "nome": "Via Caltagirone (Poste / Ist. Alberghiero)", "lat": 41.959000, "lng": 12.085000, "via": "Via Caltagirone", "timing": False },
            { "id": "27_s9", "nome": "Cavalcavia 9 Novembre / Viale Europa", "lat": 41.961000, "lng": 12.087000, "via": "Viale Europa", "timing": False },
            { "id": "27_s10", "nome": "Via Settevene Palo Nord", "lat": 41.963500, "lng": 12.086000, "via": "Via Settevene Palo Nord", "timing": False },
            { "id": "27_s11", "nome": "Via Costantini (Cimitero Ladispoli)", "lat": 41.965500, "lng": 12.084000, "via": "Via Costantini", "timing": False },
            { "id": "27_s12", "nome": "Via A. Moro (Poliambulatorio Ladispoli Transito)", "lat": 41.970301, "lng": 12.081321, "via": "Via Aldo Moro", "timing": True },
            { "id": "27_s13", "nome": "Via Berlinguer (Zona Artigianale)", "lat": 41.966000, "lng": 12.088000, "via": "Via Berlinguer", "timing": False },
            { "id": "27_s14", "nome": "Viale California / Via Alabama / Georgia", "lat": 41.962000, "lng": 12.091000, "via": "Viale California", "timing": False },
            { "id": "27_s15", "nome": "Viale America", "lat": 41.960500, "lng": 12.091500, "via": "Viale America", "timing": False },
            { "id": "27_s16", "nome": "Viale Mediterraneo (Quartiere Miami)", "lat": 41.958000, "lng": 12.093500, "via": "Viale Mediterraneo", "timing": False },
            { "id": "27_s17", "nome": "Via Parigi / Dublino / Reykjavik / Londra", "lat": 41.959500, "lng": 12.095000, "via": "Via Parigi", "timing": False },
            { "id": "27_s18", "nome": "Via Stoccolma / Atene / Tirana / Budapest", "lat": 41.957000, "lng": 12.096500, "via": "Via Budapest", "timing": False },
            { "id": "27_s19", "nome": "Via Nicosia / Praga / Mosca", "lat": 41.955500, "lng": 12.094500, "via": "Via Mosca", "timing": False },
            { "id": "27_s20", "nome": "Via Dei Narcisi / Dei Gelsomini (Cerreto)", "lat": 41.954000, "lng": 12.090000, "via": "Via Dei Narcisi", "timing": False },
            { "id": "27_s21", "nome": "Via Dei Mughetti / Delle Camelie / Mimose", "lat": 41.952500, "lng": 12.091500, "via": "Via Delle Mimose", "timing": False },
            { "id": "27_s22", "nome": "Via delle Primule / Via Delle Rose", "lat": 41.951500, "lng": 12.089500, "via": "Via Delle Rose", "timing": False },
            { "id": "27_s23", "nome": "Via del Campo Sportivo", "lat": 41.953500, "lng": 12.087500, "via": "Via Campo Sportivo", "timing": False },
            { "id": "27_s24", "nome": "Viale Europa (Ritorno)", "lat": 41.961000, "lng": 12.087000, "via": "Viale Europa", "timing": False },
            { "id": "27_s25", "nome": "Via Caltagirone (Poste Ritorno)", "lat": 41.959000, "lng": 12.085000, "via": "Via Caltagirone", "timing": False },
            { "id": "27_s26", "nome": "Via Odescalchi", "lat": 41.948387, "lng": 12.080904, "via": "Via Odescalchi", "timing": False },
            { "id": "27_s27", "nome": "Via Genova", "lat": 41.951000, "lng": 12.080500, "via": "Via Genova", "timing": False },
            { "id": "27_s28", "nome": "Stazione FS Ladispoli (Arrivo Capolinea)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "27-LV-1", "partenza": "06:20", "stopTimes": { "27_s1": "06:20", "27_s12": "06:35", "27_s28": "07:10" } },
                { "id": "27-LV-2", "partenza": "07:10", "note": "(a)", "stopTimes": { "27_s1": "07:10", "27_s12": "07:35", "27_s28": "08:20" } },
                { "id": "27-LV-3", "partenza": "08:30", "stopTimes": { "27_s1": "08:30", "27_s12": "08:45", "27_s28": "09:30" } },
                { "id": "27-LV-4", "partenza": "09:35", "stopTimes": { "27_s1": "09:35", "27_s12": "09:50", "27_s28": "10:35" } },
                { "id": "27-LV-5", "partenza": "10:45", "stopTimes": { "27_s1": "10:45", "27_s12": "11:00", "27_s28": "11:45" } },
                { "id": "27-LV-6", "partenza": "11:50", "stopTimes": { "27_s1": "11:50", "27_s12": "12:05", "27_s28": "12:50" } },
                { "id": "27-LV-7", "partenza": "13:20", "note": "(b)", "stopTimes": { "27_s1": "13:20", "27_s12": "13:35", "27_s28": "14:20" } },
                { "id": "27-LV-8", "partenza": "14:20", "note": "(a)", "stopTimes": { "27_s1": "14:20", "27_s12": "14:35", "27_s28": "15:20" } },
                { "id": "27-LV-9", "partenza": "15:20", "note": "(c)", "stopTimes": { "27_s1": "15:20", "27_s12": "15:35", "27_s28": "16:20" } },
                { "id": "27-LV-10", "partenza": "16:30", "stopTimes": { "27_s1": "16:30", "27_s12": "16:45", "27_s28": "17:30" } },
                { "id": "27-LV-11", "partenza": "17:35", "stopTimes": { "27_s1": "17:35", "27_s12": "17:50", "27_s28": "18:35" } },
                { "id": "27-LV-12", "partenza": "18:45", "stopTimes": { "27_s1": "18:45", "27_s12": "19:00", "27_s28": "19:45" } }
            ],
            "sabato": [
                { "id": "27-SA-1", "partenza": "06:20", "stopTimes": { "27_s1": "06:20", "27_s12": "06:35", "27_s28": "07:20" } },
                { "id": "27-SA-2", "partenza": "08:20", "stopTimes": { "27_s1": "08:20", "27_s12": "08:35", "27_s28": "09:20" } },
                { "id": "27-SA-3", "partenza": "10:45", "stopTimes": { "27_s1": "10:45", "27_s12": "11:00", "27_s28": "11:45" } },
                { "id": "27-SA-4", "partenza": "13:30", "stopTimes": { "27_s1": "13:30", "27_s12": "13:45", "27_s28": "14:30" } },
                { "id": "27-SA-5", "partenza": "15:45", "stopTimes": { "27_s1": "15:45", "27_s12": "16:00", "27_s28": "16:45" } },
                { "id": "27-SA-6", "partenza": "17:50", "stopTimes": { "27_s1": "17:50", "27_s12": "18:05", "27_s28": "18:50" } }
            ],
            "domenica": [
                { "id": "27-DO-1", "partenza": "07:00", "stopTimes": { "27_s1": "07:00", "27_s12": "07:15", "27_s28": "07:45" } },
                { "id": "27-DO-2", "partenza": "08:50", "stopTimes": { "27_s1": "08:50", "27_s12": "09:05", "27_s28": "09:35" } },
                { "id": "27-DO-3", "partenza": "10:40", "stopTimes": { "27_s1": "10:40", "27_s12": "10:55", "27_s28": "11:25" } },
                { "id": "27-DO-4", "partenza": "12:30", "stopTimes": { "27_s1": "12:30", "27_s12": "12:45", "27_s28": "13:15" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 28
    # Stazione FS Ladispoli — Piazza Domitilla — Centro — Marina di S. Nicola — Centro — Piazza Domitilla — Stazione FS Ladispoli
    # --------------------------------------------------------------------------
    "28": {
        "nome": "28 - FS Ladispoli - Marina di S. Nicola",
        "colore": "#0284c7",
        "percorso_ufficiale": "Stazione FS Ladispoli (capolinea) - Via Taranto - Via Flavia - Via Firenze - Via Claudia - Via Nettuno - Via Roma - Via Odescalchi - Via Palo Laziale - Via Aurelia - Marina San Nicola - Via Orione - Piazza Orsa Maggiore - Via Giove - Largo Selene - Cavalcavia FS - Largo delle Sirenette - Via Saturno - Largo Saturno - Via Marte - Via Venere - Largo delle Sirenette - Via del Sole - Cavalcavia Aurelia - Via Aurelia - Via Palo Laziale - Via Ancona - Via Roma - Via Nettuno - Via Claudia - Via Firenze - Via Flavia - Via Milazzo - Viale Italia - Stazione FS Ladispoli (capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) transita in tutti gli istituti scolastici",
            "(b) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini (entrambe le sedi)",
            "(c) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini (no Nazario Sauro) all'Ist. Di Vittorio"
        ],
        "stops": [
            { "id": "28_s1", "nome": "Stazione FS Ladispoli (Capolinea Partenza)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "28_s2", "nome": "Via Taranto", "lat": 41.955500, "lng": 12.083000, "via": "Via Taranto", "timing": False },
            { "id": "28_s3", "nome": "Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "28_s4", "nome": "Via Firenze", "lat": 41.955500, "lng": 12.079000, "via": "Via Firenze", "timing": False },
            { "id": "28_s5", "nome": "Via Claudia", "lat": 41.956000, "lng": 12.076000, "via": "Via Claudia", "timing": False },
            { "id": "28_s6", "nome": "Via Nettuno", "lat": 41.952500, "lng": 12.072500, "via": "Via Nettuno", "timing": False },
            { "id": "28_s7", "nome": "Via Roma", "lat": 41.950000, "lng": 12.074000, "via": "Via Roma", "timing": False },
            { "id": "28_s8", "nome": "Via Odescalchi / Piazza Domitilla", "lat": 41.945000, "lng": 12.082000, "via": "Piazza Domitilla", "timing": False },
            { "id": "28_s9", "nome": "Via Palo Laziale", "lat": 41.941000, "lng": 12.086000, "via": "Via Palo Laziale", "timing": False },
            { "id": "28_s10", "nome": "Via Aurelia Sud", "lat": 41.938000, "lng": 12.105000, "via": "Via Aurelia", "timing": False },
            { "id": "28_s11", "nome": "Marina di San Nicola (Ingresso Transito)", "lat": 41.934620, "lng": 12.117870, "via": "Via Aurelia", "timing": True },
            { "id": "28_s12", "nome": "Via Orione / Piazza Orsa Maggiore", "lat": 41.932500, "lng": 12.119000, "via": "Piazza Orsa Maggiore", "timing": False },
            { "id": "28_s13", "nome": "Via Giove / Largo Selene", "lat": 41.931000, "lng": 12.121000, "via": "Largo Selene", "timing": False },
            { "id": "28_s14", "nome": "Largo delle Sirenette", "lat": 41.929500, "lng": 12.123500, "via": "Largo Sirenette", "timing": False },
            { "id": "28_s15", "nome": "Via Saturno / Largo Saturno", "lat": 41.928000, "lng": 12.125000, "via": "Via Saturno", "timing": False },
            { "id": "28_s16", "nome": "Via Marte / Via Venere", "lat": 41.927000, "lng": 12.126500, "via": "Via Marte", "timing": False },
            { "id": "28_s17", "nome": "Via del Sole", "lat": 41.931500, "lng": 12.124500, "via": "Via del Sole", "timing": False },
            { "id": "28_s18", "nome": "Via Aurelia (Ritorno)", "lat": 41.938000, "lng": 12.105000, "via": "Via Aurelia", "timing": False },
            { "id": "28_s19", "nome": "Via Palo Laziale (Ritorno)", "lat": 41.945000, "lng": 12.081000, "via": "Via Palo Laziale", "timing": False },
            { "id": "28_s20", "nome": "Via Ancona", "lat": 41.951500, "lng": 12.075000, "via": "Via Ancona", "timing": False },
            { "id": "28_s21", "nome": "Via Milazzo", "lat": 41.953000, "lng": 12.079500, "via": "Via Milazzo", "timing": False },
            { "id": "28_s22", "nome": "Viale Italia", "lat": 41.952000, "lng": 12.078500, "via": "Viale Italia", "timing": False },
            { "id": "28_s23", "nome": "Stazione FS Ladispoli (Arrivo Capolinea)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "28-LV-1", "partenza": "05:35", "stopTimes": { "28_s1": "05:35", "28_s11": "05:50", "28_s23": "06:20" } },
                { "id": "28-LV-2", "partenza": "06:15", "stopTimes": { "28_s1": "06:15", "28_s11": "06:30", "28_s23": "07:00" } },
                { "id": "28-LV-3", "partenza": "07:10", "note": "(a)", "stopTimes": { "28_s1": "07:10", "28_s11": "07:25", "28_s23": "08:00" } },
                { "id": "28-LV-4", "partenza": "08:15", "stopTimes": { "28_s1": "08:15", "28_s11": "08:30", "28_s23": "09:00" } },
                { "id": "28-LV-5", "partenza": "09:15", "stopTimes": { "28_s1": "09:15", "28_s11": "09:30", "28_s23": "10:00" } },
                { "id": "28-LV-6", "partenza": "10:15", "stopTimes": { "28_s1": "10:15", "28_s11": "10:30", "28_s23": "11:00" } },
                { "id": "28-LV-7", "partenza": "11:15", "stopTimes": { "28_s1": "11:15", "28_s11": "11:30", "28_s23": "12:00" } },
                { "id": "28-LV-8", "partenza": "12:15", "stopTimes": { "28_s1": "12:15", "28_s11": "12:30", "28_s23": "13:00" } },
                { "id": "28-LV-9", "partenza": "13:20", "note": "(b)", "stopTimes": { "28_s1": "13:20", "28_s11": "13:35", "28_s23": "14:10" } },
                { "id": "28-LV-10", "partenza": "14:10", "note": "(a)", "stopTimes": { "28_s1": "14:10", "28_s11": "14:25", "28_s23": "15:00" } },
                { "id": "28-LV-11", "partenza": "15:10", "note": "(c)", "stopTimes": { "28_s1": "15:10", "28_s11": "15:25", "28_s23": "16:00" } },
                { "id": "28-LV-12", "partenza": "16:15", "stopTimes": { "28_s1": "16:15", "28_s11": "16:30", "28_s23": "17:00" } },
                { "id": "28-LV-13", "partenza": "17:15", "stopTimes": { "28_s1": "17:15", "28_s11": "17:30", "28_s23": "18:00" } },
                { "id": "28-LV-14", "partenza": "18:15", "stopTimes": { "28_s1": "18:15", "28_s11": "18:30", "28_s23": "19:00" } },
                { "id": "28-LV-15", "partenza": "19:15", "stopTimes": { "28_s1": "19:15", "28_s11": "19:30", "28_s23": "20:00" } },
                { "id": "28-LV-16", "partenza": "19:50", "stopTimes": { "28_s1": "19:50", "28_s11": "20:05", "28_s23": "20:35" } }
            ],
            "sabato": [
                { "id": "28-SA-1", "partenza": "05:35", "stopTimes": { "28_s1": "05:35", "28_s11": "05:50", "28_s23": "06:20" } },
                { "id": "28-SA-2", "partenza": "06:15", "stopTimes": { "28_s1": "06:15", "28_s11": "06:30", "28_s23": "07:00" } },
                { "id": "28-SA-3", "partenza": "07:10", "stopTimes": { "28_s1": "07:10", "28_s11": "07:25", "28_s23": "08:00" } },
                { "id": "28-SA-4", "partenza": "08:15", "stopTimes": { "28_s1": "08:15", "28_s11": "08:30", "28_s23": "09:00" } },
                { "id": "28-SA-5", "partenza": "09:15", "stopTimes": { "28_s1": "09:15", "28_s11": "09:30", "28_s23": "10:00" } },
                { "id": "28-SA-6", "partenza": "10:15", "stopTimes": { "28_s1": "10:15", "28_s11": "10:30", "28_s23": "11:00" } },
                { "id": "28-SA-7", "partenza": "11:15", "stopTimes": { "28_s1": "11:15", "28_s11": "11:30", "28_s23": "12:00" } },
                { "id": "28-SA-8", "partenza": "12:15", "stopTimes": { "28_s1": "12:15", "28_s11": "12:30", "28_s23": "13:00" } },
                { "id": "28-SA-9", "partenza": "13:20", "stopTimes": { "28_s1": "13:20", "28_s11": "13:35", "28_s23": "14:05" } },
                { "id": "28-SA-10", "partenza": "14:15", "stopTimes": { "28_s1": "14:15", "28_s11": "14:30", "28_s23": "15:00" } },
                { "id": "28-SA-11", "partenza": "15:15", "stopTimes": { "28_s1": "15:15", "28_s11": "15:30", "28_s23": "16:00" } },
                { "id": "28-SA-12", "partenza": "16:15", "stopTimes": { "28_s1": "16:15", "28_s11": "16:30", "28_s23": "17:00" } },
                { "id": "28-SA-13", "partenza": "17:15", "stopTimes": { "28_s1": "17:15", "28_s11": "17:30", "28_s23": "18:00" } },
                { "id": "28-SA-14", "partenza": "18:15", "stopTimes": { "28_s1": "18:15", "28_s11": "18:30", "28_s23": "19:00" } },
                { "id": "28-SA-15", "partenza": "19:15", "stopTimes": { "28_s1": "19:15", "28_s11": "19:30", "28_s23": "20:00" } },
                { "id": "28-SA-16", "partenza": "19:50", "stopTimes": { "28_s1": "19:50", "28_s11": "20:05", "28_s23": "20:35" } }
            ],
            "domenica": [
                { "id": "28-DO-1", "partenza": "07:55", "stopTimes": { "28_s1": "07:55", "28_s11": "08:10", "28_s23": "08:40" } },
                { "id": "28-DO-2", "partenza": "09:45", "stopTimes": { "28_s1": "09:45", "28_s11": "10:00", "28_s23": "10:30" } },
                { "id": "28-DO-3", "partenza": "11:35", "stopTimes": { "28_s1": "11:35", "28_s11": "11:50", "28_s23": "12:20" } },
                { "id": "28-DO-4", "partenza": "13:25", "stopTimes": { "28_s1": "13:25", "28_s11": "13:40", "28_s23": "14:10" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 29
    # Stazione FS Ladispoli — Marina di Palo — Stazione FS Ladispoli — Caere Vetus — Cerenova — Poliambulatorio — Centro — Stazione FS Ladispoli
    # --------------------------------------------------------------------------
    "29": {
        "nome": "29 - FS Ladispoli - Marina di Palo - Cerenova",
        "colore": "#8b5cf6",
        "percorso_ufficiale": "Stazione FS Ladispoli (Capolinea) - Via Trieste - Via Odescalchi - Via Palo Laziale - Via dei Delfini - Lungomare Marina di Palo - Via del Tritone - Via Ancona - Via Genova - Stazione FS Ladispoli - Via Taranto - Via Caltagirone (Poste) - Via Castellammare di Stabia - Via Firenze - Via Claudia - Via Ugo Foscolo - Via Benedetto Croce - Via F.lli Bandiera - Piazza Nazario Sauro - Via Claudia - Via Giovanni XXIII - Via Claudia - Via Nettuno - Via Roma (Torre Flavia) - Via Fontana Morella - Via B. Marini - Viale Campo di Mare - Via S. Angelucci - Caere Vetus - Via Fontana Morella - Via Aurelia - Poliambulatorio - Cimitero - Via Settevene Palo nord - Via Taranto - Via Flavia - Via Odescalchi - Via Genova - Stazione FS Ladispoli (Capolinea)",
        "note": [
            "(a) Nei giorni scolastici (lun-ven) transita in tutti gli istituti scolastici",
            "(b) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini (entrambe le sedi)",
            "(c) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini all'Ist. Di Vittorio"
        ],
        "stops": [
            { "id": "29_s1", "nome": "Stazione FS Ladispoli (Capolinea Partenza)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "29_s2", "nome": "Via Trieste", "lat": 41.949000, "lng": 12.077000, "via": "Via Trieste", "timing": False },
            { "id": "29_s3", "nome": "Via Odescalchi", "lat": 41.948387, "lng": 12.080904, "via": "Via Odescalchi", "timing": False },
            { "id": "29_s4", "nome": "Via Palo Laziale", "lat": 41.945000, "lng": 12.081000, "via": "Via Palo Laziale", "timing": False },
            { "id": "29_s5", "nome": "Via dei Delfini", "lat": 41.941500, "lng": 12.079000, "via": "Via dei Delfini", "timing": False },
            { "id": "29_s6", "nome": "Lungomare Marina di Palo", "lat": 41.939000, "lng": 12.081000, "via": "Lungomare Marina di Palo", "timing": False },
            { "id": "29_s7", "nome": "Via del Tritone", "lat": 41.943000, "lng": 12.079500, "via": "Via del Tritone", "timing": False },
            { "id": "29_s8", "nome": "Via Ancona", "lat": 41.951500, "lng": 12.075000, "via": "Via Ancona", "timing": False },
            { "id": "29_s9", "nome": "Via Genova", "lat": 41.951000, "lng": 12.080500, "via": "Via Genova", "timing": False },
            { "id": "29_s10", "nome": "Stazione FS Ladispoli (Transito Intermedio)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": False },
            { "id": "29_s11", "nome": "Via Taranto", "lat": 41.955500, "lng": 12.083000, "via": "Via Taranto", "timing": False },
            { "id": "29_s12", "nome": "Via Caltagirone (Poste)", "lat": 41.959000, "lng": 12.085000, "via": "Via Caltagirone", "timing": False },
            { "id": "29_s13", "nome": "Via Castellammare di Stabia", "lat": 41.958000, "lng": 12.081000, "via": "Via Castellammare di Stabia", "timing": False },
            { "id": "29_s14", "nome": "Via Firenze", "lat": 41.955500, "lng": 12.079000, "via": "Via Firenze", "timing": False },
            { "id": "29_s15", "nome": "Via Claudia", "lat": 41.956000, "lng": 12.076000, "via": "Via Claudia", "timing": False },
            { "id": "29_s16", "nome": "Via Ugo Foscolo / Benedetto Croce", "lat": 41.958500, "lng": 12.073000, "via": "Via Ugo Foscolo", "timing": False },
            { "id": "29_s17", "nome": "Via F.lli Bandiera / Piazza Nazario Sauro", "lat": 41.960000, "lng": 12.071500, "via": "Piazza Nazario Sauro", "timing": False },
            { "id": "29_s18", "nome": "Via Giovanni XXIII", "lat": 41.958000, "lng": 12.074500, "via": "Via Giovanni XXIII", "timing": False },
            { "id": "29_s19", "nome": "Via Nettuno / Via Roma (Torre Flavia)", "lat": 41.961500, "lng": 12.069000, "via": "Via Roma", "timing": False },
            { "id": "29_s20", "nome": "Via Fontana Morella (Ingresso Cerenova)", "lat": 41.965000, "lng": 12.077000, "via": "Via Fontana Morella", "timing": False },
            { "id": "29_s21", "nome": "Via B. Marini", "lat": 41.963500, "lng": 12.079000, "via": "Via B. Marini", "timing": False },
            { "id": "29_s22", "nome": "Viale Campo di Mare (Cerenova FS Transito)", "lat": 41.960693, "lng": 12.082584, "via": "Viale Campo di Mare", "timing": True },
            { "id": "29_s23", "nome": "Via S. Angelucci / Caere Vetus", "lat": 41.966000, "lng": 12.083000, "via": "Via Caere Vetus", "timing": False },
            { "id": "29_s24", "nome": "Via Fontana Morella (Ritorno)", "lat": 41.972000, "lng": 12.083000, "via": "Via Fontana Morella", "timing": False },
            { "id": "29_s25", "nome": "Poliambulatorio / Via Aurelia", "lat": 41.970301, "lng": 12.081321, "via": "Via Aurelia", "timing": False },
            { "id": "29_s26", "nome": "Cimitero / Via Settevene Palo Nord", "lat": 41.965500, "lng": 12.084000, "via": "Via Settevene Palo Nord", "timing": False },
            { "id": "29_s27", "nome": "Via Taranto / Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "29_s28", "nome": "Via Odescalchi / Via Genova", "lat": 41.951000, "lng": 12.080500, "via": "Via Genova", "timing": False },
            { "id": "29_s29", "nome": "Stazione FS Ladispoli (Arrivo Capolinea)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "29-LV-1", "partenza": "06:20", "stopTimes": { "29_s1": "06:20", "29_s22": "06:45", "29_s29": "07:10" } },
                { "id": "29-LV-2", "partenza": "07:20", "note": "(a)", "stopTimes": { "29_s1": "07:20", "29_s22": "07:45", "29_s29": "08:15" } },
                { "id": "29-LV-3", "partenza": "08:20", "stopTimes": { "29_s1": "08:20", "29_s22": "08:45", "29_s29": "09:10" } },
                { "id": "29-LV-4", "partenza": "09:20", "stopTimes": { "29_s1": "09:20", "29_s22": "09:45", "29_s29": "10:10" } },
                { "id": "29-LV-5", "partenza": "10:20", "stopTimes": { "29_s1": "10:20", "29_s22": "10:45", "29_s29": "11:10" } },
                { "id": "29-LV-6", "partenza": "11:20", "stopTimes": { "29_s1": "11:20", "29_s22": "11:45", "29_s29": "12:10" } },
                { "id": "29-LV-7", "partenza": "12:20", "stopTimes": { "29_s1": "12:20", "29_s22": "12:45", "29_s29": "13:10" } },
                { "id": "29-LV-8", "partenza": "13:20", "note": "(b)", "stopTimes": { "29_s1": "13:20", "29_s22": "13:45", "29_s29": "14:10" } },
                { "id": "29-LV-9", "partenza": "14:20", "note": "(a)", "stopTimes": { "29_s1": "14:20", "29_s22": "14:45", "29_s29": "15:15" } },
                { "id": "29-LV-10", "partenza": "15:15", "note": "(c)", "stopTimes": { "29_s1": "15:15", "29_s22": "15:40", "29_s29": "16:10" } },
                { "id": "29-LV-11", "partenza": "16:20", "stopTimes": { "29_s1": "16:20", "29_s22": "16:45", "29_s29": "17:10" } },
                { "id": "29-LV-12", "partenza": "17:20", "stopTimes": { "29_s1": "17:20", "29_s22": "17:45", "29_s29": "18:10" } },
                { "id": "29-LV-13", "partenza": "18:20", "stopTimes": { "29_s1": "18:20", "29_s22": "18:45", "29_s29": "19:10" } },
                { "id": "29-LV-14", "partenza": "19:20", "stopTimes": { "29_s1": "19:20", "29_s22": "19:45", "29_s29": "20:10" } }
            ],
            "sabato": [
                { "id": "29-SA-1", "partenza": "06:20", "stopTimes": { "29_s1": "06:20", "29_s22": "06:45", "29_s29": "07:10" } },
                { "id": "29-SA-2", "partenza": "07:20", "stopTimes": { "29_s1": "07:20", "29_s22": "07:45", "29_s29": "08:10" } },
                { "id": "29-SA-3", "partenza": "08:20", "stopTimes": { "29_s1": "08:20", "29_s22": "08:45", "29_s29": "09:10" } },
                { "id": "29-SA-4", "partenza": "09:20", "stopTimes": { "29_s1": "09:20", "29_s22": "09:45", "29_s29": "10:10" } },
                { "id": "29-SA-5", "partenza": "10:20", "stopTimes": { "29_s1": "10:20", "29_s22": "10:45", "29_s29": "11:10" } },
                { "id": "29-SA-6", "partenza": "11:20", "stopTimes": { "29_s1": "11:20", "29_s22": "11:45", "29_s29": "12:10" } },
                { "id": "29-SA-7", "partenza": "12:20", "stopTimes": { "29_s1": "12:20", "29_s22": "12:45", "29_s29": "13:10" } },
                { "id": "29-SA-8", "partenza": "13:20", "stopTimes": { "29_s1": "13:20", "29_s22": "13:45", "29_s29": "14:10" } },
                { "id": "29-SA-9", "partenza": "14:20", "stopTimes": { "29_s1": "14:20", "29_s22": "14:45", "29_s29": "15:10" } },
                { "id": "29-SA-10", "partenza": "15:20", "stopTimes": { "29_s1": "15:20", "29_s22": "15:45", "29_s29": "16:10" } },
                { "id": "29-SA-11", "partenza": "16:20", "stopTimes": { "29_s1": "16:20", "29_s22": "16:45", "29_s29": "17:10" } },
                { "id": "29-SA-12", "partenza": "17:20", "stopTimes": { "29_s1": "17:20", "29_s22": "17:45", "29_s29": "18:10" } },
                { "id": "29-SA-13", "partenza": "18:20", "stopTimes": { "29_s1": "18:20", "29_s22": "18:45", "29_s29": "19:10" } },
                { "id": "29-SA-14", "partenza": "19:20", "stopTimes": { "29_s1": "19:20", "29_s22": "19:45", "29_s29": "20:10" } }
            ],
            "domenica": [
                { "id": "29-DO-1", "partenza": "07:00", "stopTimes": { "29_s1": "07:00", "29_s22": "07:25", "29_s29": "07:50" } },
                { "id": "29-DO-2", "partenza": "09:00", "stopTimes": { "29_s1": "09:00", "29_s22": "09:25", "29_s29": "09:50" } },
                { "id": "29-DO-3", "partenza": "11:15", "stopTimes": { "29_s1": "11:15", "29_s22": "11:40", "29_s29": "12:05" } },
                { "id": "29-DO-4", "partenza": "13:25", "stopTimes": { "29_s1": "13:25", "29_s22": "13:50", "29_s29": "14:15" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 30
    # Stazione FS Ladispoli — Centro — Monteroni — Poste — Centro — Stazione FS Ladispoli
    # --------------------------------------------------------------------------
    "30": {
        "nome": "30 - FS Ladispoli - Monteroni - Poste",
        "colore": "#14b8a6",
        "percorso_ufficiale": "Stazione FS Ladispoli (capolinea) - Via Trieste - Via Ancona - Via Flavia - Via Milazzo - Via Cagliari - Via Settevene Palo nord - Via Costantini - Via Aldo Moro (Zona Artigianale) - Poliambulatorio - Via Aurelia - Via del Boietto - Via dei Vigneti - Via dell'Olmetto - Via delle Carciofete - Via Casal dei Venti - Via dei Monteroni - Via Acquedotto Statua - Via Aurelia - Cimitero - Via Costantini - Via A. Moro (Zona Artigianale) - Poliambulatorio - Via Settevene Palo Nord - Via Taranto - Via Caltagirone (Poste) - Via Castellammare di Stabia - Via Firenze - Via Flavia - Via Odescalchi - Via Genova - Stazione FS Ladispoli (capolinea)",
        "note": [
            "(a) Transita in via del Laghetto",
            "(b) Transita in zona artigianale e Poliambulatorio",
            "(c) Nei giorni scolastici (lun-ven) transita in tutti gli istituti scolastici",
            "(d) Nei giorni scolastici (lun-ven) transita all'Ist. Pertini (no Nazario Sauro)",
            "(f) Transita al Poliambulatorio"
        ],
        "stops": [
            { "id": "30_s1", "nome": "Stazione FS Ladispoli (Capolinea Partenza)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "30_s2", "nome": "Via Trieste", "lat": 41.949000, "lng": 12.077000, "via": "Via Trieste", "timing": False },
            { "id": "30_s3", "nome": "Via Ancona", "lat": 41.951500, "lng": 12.075000, "via": "Via Ancona", "timing": False },
            { "id": "30_s4", "nome": "Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "30_s5", "nome": "Via Milazzo / Via Cagliari", "lat": 41.955500, "lng": 12.081000, "via": "Via Cagliari", "timing": False },
            { "id": "30_s6", "nome": "Via Settevene Palo Nord", "lat": 41.963500, "lng": 12.086000, "via": "Via Settevene Palo Nord", "timing": False },
            { "id": "30_s7", "nome": "Via Costantini", "lat": 41.965500, "lng": 12.084000, "via": "Via Costantini", "timing": False },
            { "id": "30_s8", "nome": "Via Aldo Moro (Zona Artigianale)", "lat": 41.966000, "lng": 12.088000, "via": "Via Aldo Moro", "timing": False },
            { "id": "30_s9", "nome": "Poliambulatorio Ladispoli", "lat": 41.970301, "lng": 12.081321, "via": "Via Aurelia", "timing": False },
            { "id": "30_s10", "nome": "Via Aurelia / Bivio Boietto", "lat": 41.972000, "lng": 12.091000, "via": "Via Aurelia", "timing": False },
            { "id": "30_s11", "nome": "Via del Boietto / Via dei Vigneti", "lat": 41.975000, "lng": 12.098000, "via": "Via del Boietto", "timing": False },
            { "id": "30_s12", "nome": "Via dell'Olmetto / Via delle Carciofete", "lat": 41.978000, "lng": 12.105000, "via": "Via dell'Olmetto", "timing": False },
            { "id": "30_s13", "nome": "Via Casal dei Venti", "lat": 41.980000, "lng": 12.112000, "via": "Via Casal dei Venti", "timing": False },
            { "id": "30_s14", "nome": "Via dei Monteroni (Transito Intermedio)", "lat": 41.975000, "lng": 12.110000, "via": "Via dei Monteroni", "timing": True },
            { "id": "30_s15", "nome": "Via Acquedotto Statua", "lat": 41.969000, "lng": 12.102000, "via": "Via Acquedotto Statua", "timing": False },
            { "id": "30_s16", "nome": "Via Aurelia / Cimitero Ladispoli", "lat": 41.967000, "lng": 12.087000, "via": "Via Aurelia", "timing": False },
            { "id": "30_s17", "nome": "Via Costantini (Ritorno)", "lat": 41.965500, "lng": 12.084000, "via": "Via Costantini", "timing": False },
            { "id": "30_s18", "nome": "Via A. Moro / Poliambulatorio", "lat": 41.970301, "lng": 12.081321, "via": "Via Aldo Moro", "timing": False },
            { "id": "30_s19", "nome": "Via Settevene Palo Nord / Via Taranto", "lat": 41.957000, "lng": 12.084000, "via": "Via Taranto", "timing": False },
            { "id": "30_s20", "nome": "Via Caltagirone (Poste)", "lat": 41.959000, "lng": 12.085000, "via": "Via Caltagirone", "timing": False },
            { "id": "30_s21", "nome": "Via Castellammare di Stabia", "lat": 41.958000, "lng": 12.081000, "via": "Via Castellammare di Stabia", "timing": False },
            { "id": "30_s22", "nome": "Via Firenze / Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "30_s23", "nome": "Via Odescalchi / Via Genova", "lat": 41.951000, "lng": 12.080500, "via": "Via Genova", "timing": False },
            { "id": "30_s24", "nome": "Stazione FS Ladispoli (Arrivo Capolinea)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "30-LV-1", "partenza": "06:10", "stopTimes": { "30_s1": "06:10", "30_s14": "06:30", "30_s24": "07:00" } },
                { "id": "30-LV-2", "partenza": "07:00", "note": "(a-c)", "stopTimes": { "30_s1": "07:00", "30_s14": "07:20", "30_s24": "08:00" } },
                { "id": "30-LV-3", "partenza": "08:10", "note": "(a-b)", "stopTimes": { "30_s1": "08:10", "30_s14": "08:30", "30_s24": "09:20" } },
                { "id": "30-LV-4", "partenza": "09:40", "note": "(b)", "stopTimes": { "30_s1": "09:40", "30_s14": "10:00", "30_s24": "10:45" } },
                { "id": "30-LV-5", "partenza": "11:00", "note": "(a-b)", "stopTimes": { "30_s1": "11:00", "30_s14": "11:20", "30_s24": "12:10" } },
                { "id": "30-LV-6", "partenza": "12:20", "note": "(b)", "stopTimes": { "30_s1": "12:20", "30_s14": "12:40", "30_s24": "13:25" } },
                { "id": "30-LV-7", "partenza": "13:30", "note": "(C)", "stopTimes": { "30_s1": "13:30", "30_s14": "13:50", "30_s24": "14:30" } },
                { "id": "30-LV-8", "partenza": "14:30", "note": "(a-c)", "stopTimes": { "30_s1": "14:30", "30_s14": "14:50", "30_s24": "15:35" } },
                { "id": "30-LV-9", "partenza": "15:40", "note": "(d)", "stopTimes": { "30_s1": "15:40", "30_s14": "16:00", "30_s24": "16:30" } },
                { "id": "30-LV-10", "partenza": "16:40", "stopTimes": { "30_s1": "16:40", "30_s14": "17:00", "30_s24": "17:30" } },
                { "id": "30-LV-11", "partenza": "17:40", "stopTimes": { "30_s1": "17:40", "30_s14": "18:00", "30_s24": "18:30" } },
                { "id": "30-LV-12", "partenza": "19:00", "stopTimes": { "30_s1": "19:00", "30_s14": "19:20", "30_s24": "19:50" } }
            ],
            "sabato": [
                { "id": "30-SA-1", "partenza": "07:20", "stopTimes": { "30_s1": "07:20", "30_s14": "07:40", "30_s24": "08:10" } },
                { "id": "30-SA-2", "partenza": "09:25", "note": "(a-b)", "stopTimes": { "30_s1": "09:25", "30_s14": "09:45", "30_s24": "10:35" } },
                { "id": "30-SA-3", "partenza": "11:50", "stopTimes": { "30_s1": "11:50", "30_s14": "12:10", "30_s24": "12:40" } },
                { "id": "30-SA-4", "partenza": "14:35", "note": "(a-b)", "stopTimes": { "30_s1": "14:35", "30_s14": "14:55", "30_s24": "15:45" } },
                { "id": "30-SA-5", "partenza": "16:50", "stopTimes": { "30_s1": "16:50", "30_s14": "17:10", "30_s24": "17:40" } },
                { "id": "30-SA-6", "partenza": "18:55", "stopTimes": { "30_s1": "18:55", "30_s14": "19:15", "30_s24": "19:45" } }
            ],
            "domenica": [
                { "id": "30-DO-1", "partenza": "08:00", "stopTimes": { "30_s1": "08:00", "30_s14": "08:20", "30_s24": "08:50" } },
                { "id": "30-DO-2", "partenza": "10:00", "note": "(f)", "stopTimes": { "30_s1": "10:00", "30_s14": "10:20", "30_s24": "11:05" } },
                { "id": "30-DO-3", "partenza": "12:15", "note": "(f)", "stopTimes": { "30_s1": "12:15", "30_s14": "12:35", "30_s24": "13:15" } }
            ]
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 32
    # Stazione FS Ladispoli — Piazza Domitilla — Centro — Marina di San Nicola (via Aurelia) — Ospedale Bambin Gesù — Marina di San Nicola (via Aurelia) — Centro — Piazza Domitilla — Stazione FS Ladispoli
    # --------------------------------------------------------------------------
    "32": {
        "nome": "32 - FS Ladispoli - Ospedale Bambin Gesù (Palidoro)",
        "colore": "#f43f5e",
        "percorso_ufficiale": "Stazione FS Ladispoli (capolinea) - Via Taranto - Via Flavia - Via Firenze - Via Claudia - Via Nettuno - Via Roma - Via Odescalchi - Via Palo Laziale - Via Aurelia - Via S. Carlo a Palidoro - Via Torre a Palidoro - Ospedale Bambin Gesù - Via Torre a Palidoro - Via S. Carlo a Palidoro - Via Aurelia - Via Palo Laziale - Via Ancona - Via Roma - Via Nettuno - Via Claudia - Via Firenze - Via Flavia - Via Milazzo - Viale Italia - Stazione FS Ladispoli (Capolinea)",
        "note": [
            "N.B.: La domenica e nei giorni festivi la linea 32 NON effettua servizio."
        ],
        "stops": [
            { "id": "32_s1", "nome": "Stazione FS Ladispoli (Capolinea Partenza)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True },
            { "id": "32_s2", "nome": "Via Taranto", "lat": 41.955500, "lng": 12.083000, "via": "Via Taranto", "timing": False },
            { "id": "32_s3", "nome": "Via Flavia", "lat": 41.954000, "lng": 12.077000, "via": "Via Flavia", "timing": False },
            { "id": "32_s4", "nome": "Via Firenze", "lat": 41.955500, "lng": 12.079000, "via": "Via Firenze", "timing": False },
            { "id": "32_s5", "nome": "Via Claudia", "lat": 41.956000, "lng": 12.076000, "via": "Via Claudia", "timing": False },
            { "id": "32_s6", "nome": "Via Nettuno", "lat": 41.952500, "lng": 12.072500, "via": "Via Nettuno", "timing": False },
            { "id": "32_s7", "nome": "Via Roma", "lat": 41.950000, "lng": 12.074000, "via": "Via Roma", "timing": False },
            { "id": "32_s8", "nome": "Via Odescalchi / Piazza Domitilla", "lat": 41.945000, "lng": 12.082000, "via": "Piazza Domitilla", "timing": False },
            { "id": "32_s9", "nome": "Via Palo Laziale", "lat": 41.941000, "lng": 12.086000, "via": "Via Palo Laziale", "timing": False },
            { "id": "32_s10", "nome": "Marina di San Nicola (Bivio Via Aurelia)", "lat": 41.934620, "lng": 12.117870, "via": "Via Aurelia", "timing": False },
            { "id": "32_s11", "nome": "Via S. Carlo a Palidoro", "lat": 41.921485, "lng": 12.170641, "via": "Via S. Carlo a Palidoro", "timing": False },
            { "id": "32_s12", "nome": "Via Torre a Palidoro", "lat": 41.920500, "lng": 12.155000, "via": "Via Torre a Palidoro", "timing": False },
            { "id": "32_s13", "nome": "Ospedale Bambin Gesù Palidoro (Arrivo/Partenza)", "lat": 41.919232, "lng": 12.141720, "via": "Via Torre a Palidoro", "timing": True },
            { "id": "32_s14", "nome": "Via Torre a Palidoro (Ritorno)", "lat": 41.920500, "lng": 12.155000, "via": "Via Torre a Palidoro", "timing": False },
            { "id": "32_s15", "nome": "Via S. Carlo a Palidoro (Ritorno)", "lat": 41.921485, "lng": 12.170641, "via": "Via S. Carlo a Palidoro", "timing": False },
            { "id": "32_s16", "nome": "Via Aurelia (Ritorno)", "lat": 41.934620, "lng": 12.117870, "via": "Via Aurelia", "timing": False },
            { "id": "32_s17", "nome": "Via Palo Laziale (Ritorno)", "lat": 41.941000, "lng": 12.086000, "via": "Via Palo Laziale", "timing": False },
            { "id": "32_s18", "nome": "Via Ancona", "lat": 41.951500, "lng": 12.075000, "via": "Via Ancona", "timing": False },
            { "id": "32_s19", "nome": "Via Roma / Via Nettuno", "lat": 41.952500, "lng": 12.072500, "via": "Via Roma", "timing": False },
            { "id": "32_s20", "nome": "Via Claudia / Via Firenze", "lat": 41.955500, "lng": 12.079000, "via": "Via Firenze", "timing": False },
            { "id": "32_s21", "nome": "Via Flavia / Via Milazzo", "lat": 41.953000, "lng": 12.079500, "via": "Via Milazzo", "timing": False },
            { "id": "32_s22", "nome": "Viale Italia", "lat": 41.952000, "lng": 12.078500, "via": "Viale Italia", "timing": False },
            { "id": "32_s23", "nome": "Stazione FS Ladispoli (Arrivo Capolinea)", "lat": 41.953229, "lng": 12.081469, "via": "Piazzale Roma", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "32-LS-1", "partenza": "06:20", "stopTimes": { "32_s1": "06:20", "32_s13": "06:50", "32_s23": "07:20" } },
                { "id": "32-LS-2", "partenza": "07:20", "stopTimes": { "32_s1": "07:20", "32_s13": "07:50", "32_s23": "08:20" } },
                { "id": "32-LS-3", "partenza": "08:40", "stopTimes": { "32_s1": "08:40", "32_s13": "09:10", "32_s23": "09:40" } },
                { "id": "32-LS-4", "partenza": "10:05", "stopTimes": { "32_s1": "10:05", "32_s13": "10:35", "32_s23": "11:05" } },
                { "id": "32-LS-5", "partenza": "11:30", "stopTimes": { "32_s1": "11:30", "32_s13": "12:00", "32_s23": "12:30" } },
                { "id": "32-LS-6", "partenza": "12:50", "stopTimes": { "32_s1": "12:50", "32_s13": "13:20", "32_s23": "13:50" } },
                { "id": "32-LS-7", "partenza": "14:15", "stopTimes": { "32_s1": "14:15", "32_s13": "14:45", "32_s23": "15:15" } },
                { "id": "32-LS-8", "partenza": "15:45", "stopTimes": { "32_s1": "15:45", "32_s13": "16:15", "32_s23": "16:45" } },
                { "id": "32-LS-9", "partenza": "17:00", "stopTimes": { "32_s1": "17:00", "32_s13": "17:30", "32_s23": "18:00" } },
                { "id": "32-LS-10", "partenza": "18:15", "stopTimes": { "32_s1": "18:15", "32_s13": "18:45", "32_s23": "19:15" } },
                { "id": "32-LS-11", "partenza": "19:30", "stopTimes": { "32_s1": "19:30", "32_s13": "20:00", "32_s23": "20:30" } }
            ],
            "sabato": [
                { "id": "32-LS-1", "partenza": "06:20", "stopTimes": { "32_s1": "06:20", "32_s13": "06:50", "32_s23": "07:20" } },
                { "id": "32-LS-2", "partenza": "07:20", "stopTimes": { "32_s1": "07:20", "32_s13": "07:50", "32_s23": "08:20" } },
                { "id": "32-LS-3", "partenza": "08:40", "stopTimes": { "32_s1": "08:40", "32_s13": "09:10", "32_s23": "09:40" } },
                { "id": "32-LS-4", "partenza": "10:05", "stopTimes": { "32_s1": "10:05", "32_s13": "10:35", "32_s23": "11:05" } },
                { "id": "32-LS-5", "partenza": "11:30", "stopTimes": { "32_s1": "11:30", "32_s13": "12:00", "32_s23": "12:30" } },
                { "id": "32-LS-6", "partenza": "12:50", "stopTimes": { "32_s1": "12:50", "32_s13": "13:20", "32_s23": "13:50" } },
                { "id": "32-LS-7", "partenza": "14:15", "stopTimes": { "32_s1": "14:15", "32_s13": "14:45", "32_s23": "15:15" } },
                { "id": "32-LS-8", "partenza": "15:45", "stopTimes": { "32_s1": "15:45", "32_s13": "16:15", "32_s23": "16:45" } },
                { "id": "32-LS-9", "partenza": "17:00", "stopTimes": { "32_s1": "17:00", "32_s13": "17:30", "32_s23": "18:00" } },
                { "id": "32-LS-10", "partenza": "18:15", "stopTimes": { "32_s1": "18:15", "32_s13": "18:45", "32_s23": "19:15" } },
                { "id": "32-LS-11", "partenza": "19:30", "stopTimes": { "32_s1": "19:30", "32_s13": "20:00", "32_s23": "20:30" } }
            ],
            "domenica": []  # Nessun servizio nei festivi
        }
    },

    # --------------------------------------------------------------------------
    # LINEA 33
    # Largo Monteverdi (Valcanneto) — Stazione FS Palidoro — Largo Monteverdi (Valcanneto)
    # --------------------------------------------------------------------------
    "33": {
        "nome": "33 - Valcanneto - Stazione FS Palidoro",
        "path": [[41.94776, 12.15605], [41.94779, 12.15606], [41.94794, 12.15607], [41.94815, 12.15605], [41.94815, 12.15604], [41.94816, 12.15604], [41.94832, 12.15596], [41.94832, 12.15595], [41.94855, 12.1558], [41.94929, 12.15539], [41.94949, 12.15532], [41.9497, 12.1553], [41.94984, 12.15532], [41.95002, 12.15537], [41.9503, 12.1555], [41.95053, 12.15564], [41.95072, 12.15578], [41.95108, 12.15613], [41.95125, 12.15634], [41.95125, 12.15636], [41.95123, 12.1564], [41.95123, 12.15642], [41.95122, 12.15644], [41.95122, 12.15656], [41.95123, 12.15658], [41.95123, 12.1566], [41.95125, 12.15665], [41.95078, 12.15718], [41.95029, 12.15778], [41.94989, 12.1582], [41.94975, 12.15829], [41.94957, 12.15835], [41.94947, 12.15837], [41.94931, 12.15838], [41.94865, 12.15838], [41.9485, 12.15837], [41.94816, 12.15841], [41.94799, 12.15847], [41.94783, 12.15854], [41.94769, 12.15862], [41.94755, 12.15876], [41.94739, 12.15889], [41.94726, 12.15897], [41.94725, 12.15898], [41.94712, 12.15905], [41.94694, 12.15908], [41.94673, 12.15908], [41.94655, 12.15905], [41.94647, 12.15905], [41.9464, 12.15904], [41.94608, 12.15904], [41.94599, 12.15909], [41.94606, 12.15918], [41.94636, 12.15944], [41.94636, 12.15935], [41.94637, 12.15927], [41.94641, 12.15915], [41.94647, 12.15905], [41.94655, 12.15905], [41.94673, 12.15908], [41.94694, 12.15908], [41.94712, 12.15905], [41.94725, 12.15898], [41.94726, 12.15897], [41.94739, 12.15889], [41.94755, 12.15876], [41.94769, 12.15862], [41.94783, 12.15854], [41.94799, 12.15847], [41.94816, 12.15841], [41.9485, 12.15837], [41.94865, 12.15838], [41.94931, 12.15838], [41.94947, 12.15837], [41.94957, 12.15835], [41.94975, 12.15829], [41.94989, 12.1582], [41.95029, 12.15778], [41.95078, 12.15718], [41.95125, 12.15665], [41.95126, 12.15666], [41.95127, 12.15668], [41.95129, 12.15669], [41.95132, 12.15672], [41.95134, 12.15673], [41.95135, 12.15674], [41.95138, 12.15674], [41.9514, 12.15675], [41.95141, 12.15674], [41.95144, 12.15674], [41.95146, 12.15673], [41.95147, 12.15673], [41.95149, 12.15672], [41.95154, 12.15667], [41.95176, 12.15689], [41.95228, 12.15749], [41.95259, 12.15795], [41.95299, 12.15876], [41.95307, 12.15887], [41.95318, 12.15896], [41.95334, 12.15907], [41.95368, 12.15927], [41.95373, 12.15931], [41.95377, 12.15933], [41.95379, 12.15935], [41.95388, 12.15947], [41.95402, 12.1597], [41.95407, 12.15985], [41.95409, 12.1601], [41.95408, 12.16039], [41.95403, 12.16083], [41.954, 12.16099], [41.954, 12.16106], [41.95399, 12.16111], [41.95399, 12.1613], [41.95401, 12.16145], [41.95404, 12.16153], [41.95405, 12.16158], [41.95413, 12.16175], [41.95425, 12.16191], [41.95438, 12.16205], [41.95561, 12.1631], [41.9557, 12.16319], [41.95583, 12.16327], [41.95595, 12.1633], [41.95604, 12.16329], [41.95612, 12.16326], [41.95627, 12.16318], [41.95723, 12.16239], [41.95735, 12.16227], [41.9574, 12.1622], [41.95745, 12.1621], [41.9575, 12.16192], [41.95751, 12.1619], [41.95767, 12.16052], [41.95767, 12.16039], [41.95766, 12.1603], [41.95763, 12.16021], [41.95754, 12.16003], [41.95748, 12.15996], [41.9574, 12.1599], [41.95719, 12.15985], [41.95708, 12.15984], [41.95688, 12.15979], [41.95485, 12.1594], [41.95454, 12.1592], [41.95441, 12.15908], [41.95352, 12.15776], [41.9535, 12.15774], [41.95234, 12.15595], [41.95225, 12.15576], [41.95225, 12.15568], [41.95224, 12.15567], [41.95224, 12.15565], [41.95223, 12.15564], [41.95223, 12.15563], [41.95222, 12.15563], [41.95222, 12.15562], [41.95221, 12.15561], [41.95221, 12.1556], [41.9522, 12.1556], [41.95219, 12.15559], [41.95213, 12.15521], [41.95194, 12.15305], [41.95199, 12.15234], [41.95168, 12.15226], [41.95159, 12.15221], [41.95063, 12.15184], [41.95061, 12.15184], [41.94988, 12.15158], [41.9498, 12.15157], [41.94978, 12.15156], [41.94962, 12.15155], [41.94919, 12.15156], [41.94793, 12.15169], [41.94676, 12.15168], [41.94468, 12.1517], [41.94131, 12.15178], [41.94075, 12.15185], [41.94062, 12.15189], [41.94056, 12.1519], [41.94047, 12.15196], [41.94029, 12.15213], [41.93971, 12.15279], [41.93923, 12.15328], [41.93895, 12.15352], [41.93884, 12.1536], [41.93882, 12.15361], [41.93878, 12.15365], [41.93862, 12.15376], [41.93851, 12.15379], [41.93844, 12.1538], [41.93839, 12.1538], [41.9379, 12.15389], [41.9378, 12.15389], [41.93755, 12.15392], [41.93733, 12.15393], [41.93726, 12.15394], [41.93719, 12.15394], [41.93715, 12.15395], [41.93705, 12.15395], [41.93701, 12.15396], [41.93647, 12.154], [41.93618, 12.154], [41.93609, 12.15399], [41.93601, 12.15397], [41.93593, 12.15396], [41.9356, 12.15388], [41.93535, 12.15384], [41.93529, 12.15385], [41.93551, 12.15473], [41.9356, 12.15522], [41.93563, 12.15552], [41.93564, 12.15598], [41.93558, 12.15657], [41.93555, 12.15673], [41.93555, 12.15688], [41.93395, 12.16346], [41.93395, 12.16348], [41.9332, 12.16656], [41.93103, 12.17454], [41.93102, 12.17455], [41.93099, 12.17468], [41.93088, 12.17499], [41.93071, 12.17537], [41.93064, 12.1754], [41.93062, 12.17542], [41.93053, 12.17554], [41.9305, 12.1756], [41.9297, 12.17651], [41.92967, 12.17653], [41.92964, 12.17656], [41.92961, 12.17657], [41.92958, 12.17659], [41.92945, 12.17662], [41.92936, 12.1766], [41.92929, 12.1766], [41.9292, 12.17664], [41.92916, 12.17668], [41.92915, 12.17671], [41.92911, 12.17679], [41.9291, 12.17683], [41.9291, 12.17694], [41.92911, 12.17697], [41.92911, 12.177], [41.92912, 12.17701], [41.92908, 12.17719], [41.92906, 12.17723], [41.92904, 12.17729], [41.929, 12.17737], [41.92879, 12.17767], [41.92876, 12.17773], [41.92875, 12.17773], [41.92869, 12.1778], [41.9286, 12.17786], [41.92839, 12.17795], [41.92837, 12.17793], [41.92835, 12.17792], [41.92834, 12.17791], [41.92826, 12.17791], [41.92819, 12.17797], [41.92815, 12.17804], [41.92813, 12.1781], [41.92813, 12.17813], [41.92812, 12.17815], [41.92812, 12.17816], [41.92816, 12.17825], [41.9282, 12.17829], [41.92822, 12.1783], [41.92823, 12.1783], [41.92824, 12.17831], [41.92832, 12.17831], [41.92838, 12.17828], [41.92839, 12.17827], [41.9284, 12.17825], [41.92842, 12.17823], [41.92844, 12.17818], [41.92844, 12.17816], [41.92845, 12.17814], [41.92845, 12.17811], [41.92875, 12.17784], [41.92882, 12.17773], [41.92886, 12.17768], [41.92905, 12.17738], [41.92906, 12.17735], [41.92908, 12.17733], [41.92909, 12.17731], [41.92911, 12.17729], [41.92913, 12.17728], [41.92914, 12.17727], [41.92921, 12.17724], [41.92927, 12.17723], [41.92939, 12.17739], [41.92945, 12.17745], [41.92947, 12.17746], [41.92948, 12.17747], [41.9295, 12.17748], [41.92953, 12.17748], [41.92954, 12.17749], [41.92956, 12.17749], [41.92962, 12.17747], [41.92975, 12.17734], [41.92976, 12.17732], [41.92978, 12.1773], [41.92979, 12.17728], [41.9298, 12.17727], [41.92983, 12.17722], [41.92986, 12.17712], [41.92986, 12.17708], [41.92984, 12.17699], [41.92984, 12.17697], [41.92982, 12.17693], [41.92973, 12.17681], [41.9296, 12.1767], [41.92945, 12.17662], [41.92936, 12.1766], [41.92929, 12.1766], [41.9292, 12.17664], [41.92918, 12.17666], [41.92898, 12.17666], [41.92896, 12.17665], [41.9289, 12.17664], [41.92885, 12.17666], [41.92742, 12.17605], [41.92722, 12.17598], [41.92703, 12.17589], [41.92702, 12.17588], [41.92635, 12.17557], [41.92627, 12.17551], [41.926, 12.17536], [41.9257, 12.17523], [41.92559, 12.17527], [41.92548, 12.17553], [41.92546, 12.17561], [41.92546, 12.17569], [41.92547, 12.17575], [41.9255, 12.17583], [41.92557, 12.17591], [41.92562, 12.17593], [41.92567, 12.17594], [41.92571, 12.17593], [41.92573, 12.17592], [41.92588, 12.17588], [41.92595, 12.17588], [41.92601, 12.17589], [41.92607, 12.17594], [41.92664, 12.17655], [41.92659, 12.17677], [41.92636, 12.17748], [41.92612, 12.17809], [41.92612, 12.17811], [41.92571, 12.17915], [41.92571, 12.17916], [41.9257, 12.17918], [41.92569, 12.17919], [41.92551, 12.17957], [41.92549, 12.1796], [41.92549, 12.17961], [41.92506, 12.18038], [41.92505, 12.18039], [41.92465, 12.18163], [41.92463, 12.18166], [41.92441, 12.18232], [41.92408, 12.18307], [41.92406, 12.1831], [41.92404, 12.18311], [41.92378, 12.18374], [41.92378, 12.1839], [41.92372, 12.18408], [41.92336, 12.18377], [41.92324, 12.18368], [41.92325, 12.18363], [41.92325, 12.18355], [41.92324, 12.18352], [41.92322, 12.18349], [41.92319, 12.18346], [41.92316, 12.18345], [41.92313, 12.18346], [41.92311, 12.18346], [41.92308, 12.18348], [41.92304, 12.18352], [41.92304, 12.18363], [41.92306, 12.18369], [41.92308, 12.18372], [41.92312, 12.18373], [41.92314, 12.18374], [41.92316, 12.18374], [41.92317, 12.18373], [41.92322, 12.1837], [41.92324, 12.18368], [41.92336, 12.18377], [41.92372, 12.18408], [41.92378, 12.1839], [41.92378, 12.18374], [41.92404, 12.18311], [41.92406, 12.1831], [41.92408, 12.18307], [41.92441, 12.18232], [41.92463, 12.18166], [41.92465, 12.18163], [41.92505, 12.18039], [41.92506, 12.18038], [41.92549, 12.17961], [41.92549, 12.1796], [41.92551, 12.17957], [41.92569, 12.17919], [41.9257, 12.17918], [41.92571, 12.17916], [41.92571, 12.17915], [41.92612, 12.17811], [41.92612, 12.17809], [41.92636, 12.17748], [41.92659, 12.17677], [41.92664, 12.17655], [41.92607, 12.17594], [41.92601, 12.17589], [41.92595, 12.17588], [41.92588, 12.17588], [41.92573, 12.17592], [41.92571, 12.17593], [41.92567, 12.17594], [41.92562, 12.17593], [41.92557, 12.17591], [41.9255, 12.17583], [41.92547, 12.17575], [41.92546, 12.17569], [41.92546, 12.17561], [41.92548, 12.17553], [41.92554, 12.17539], [41.9257, 12.17536], [41.92584, 12.17537], [41.92625, 12.17556], [41.92635, 12.17557], [41.92702, 12.17588], [41.92703, 12.17589], [41.92722, 12.17598], [41.92742, 12.17605], [41.92885, 12.17666], [41.92888, 12.17669], [41.92892, 12.17671], [41.92894, 12.17673], [41.92897, 12.17675], [41.92901, 12.17679], [41.92903, 12.17682], [41.92905, 12.17684], [41.92906, 12.17686], [41.9291, 12.17689], [41.9291, 12.17694], [41.92911, 12.17697], [41.92911, 12.177], [41.92912, 12.17701], [41.92916, 12.17709], [41.92924, 12.1772], [41.92927, 12.17723], [41.92939, 12.17739], [41.92945, 12.17745], [41.92947, 12.17746], [41.92948, 12.17747], [41.9295, 12.17748], [41.92953, 12.17748], [41.92954, 12.17749], [41.92956, 12.17749], [41.92962, 12.17747], [41.92975, 12.17734], [41.92976, 12.17732], [41.92978, 12.1773], [41.92979, 12.17728], [41.9298, 12.17727], [41.92983, 12.17722], [41.92986, 12.17712], [41.92995, 12.17708], [41.93001, 12.17704], [41.93009, 12.177], [41.9301, 12.17698], [41.93012, 12.17697], [41.93016, 12.17692], [41.93029, 12.17672], [41.93031, 12.17667], [41.93044, 12.17643], [41.93055, 12.17619], [41.93072, 12.17572], [41.93087, 12.17516], [41.93088, 12.17514], [41.93088, 12.17499], [41.93099, 12.17468], [41.93102, 12.17455], [41.93103, 12.17454], [41.9332, 12.16656], [41.93395, 12.16348], [41.93395, 12.16346], [41.93555, 12.15688], [41.93559, 12.15675], [41.9356, 12.15674], [41.93568, 12.15606], [41.93569, 12.15571], [41.93563, 12.15506], [41.93556, 12.15471], [41.93556, 12.15468], [41.93544, 12.15422], [41.93545, 12.15408], [41.93546, 12.15406], [41.93546, 12.15404], [41.93547, 12.15402], [41.93549, 12.154], [41.93551, 12.15397], [41.9356, 12.15388], [41.93593, 12.15396], [41.93601, 12.15397], [41.93609, 12.15399], [41.93618, 12.154], [41.93647, 12.154], [41.93701, 12.15396], [41.93705, 12.15395], [41.93715, 12.15395], [41.93719, 12.15394], [41.93726, 12.15394], [41.93733, 12.15393], [41.93755, 12.15392], [41.9378, 12.15389], [41.9379, 12.15389], [41.93839, 12.1538], [41.93844, 12.1538], [41.93851, 12.15379], [41.93862, 12.15376], [41.93878, 12.15365], [41.93882, 12.15361], [41.93884, 12.1536], [41.93895, 12.15352], [41.93923, 12.15328], [41.93971, 12.15279], [41.94029, 12.15213], [41.94047, 12.15196], [41.94056, 12.1519], [41.94062, 12.15189], [41.94075, 12.15185], [41.94131, 12.15178], [41.94468, 12.1517], [41.94793, 12.15169], [41.94919, 12.15156], [41.94943, 12.15155], [41.9493, 12.1521], [41.94922, 12.15255], [41.94915, 12.15276], [41.94902, 12.15302], [41.94855, 12.15371], [41.94841, 12.15389], [41.94831, 12.15404], [41.94829, 12.15405], [41.94811, 12.15432], [41.94809, 12.15434], [41.94784, 12.1547], [41.94765, 12.15509], [41.94746, 12.15553], [41.94739, 12.15563], [41.94733, 12.15568], [41.94723, 12.15581], [41.94718, 12.1559], [41.94719, 12.15593], [41.94719, 12.15596], [41.94721, 12.15599], [41.94726, 12.156], [41.94744, 12.15597], [41.94769, 12.15604]],
        "colore": "#a855f7",
        "percorso_ufficiale": "Largo Monteverdi (Capolinea) - Via Pergolesi - Via Vivaldi - Largo Vivaldi - Via Vivaldi - Via Scarlatti - Via A. Boito - Via U. Giordano - Via Doganale - Via Aurelia - Via S. Carlo a Palidoro - Via dei Tre Denari - Stazione FS Palidoro - Via dei Tre Denari - Via S. Carlo a Palidoro - Via Aurelia - Via Doganale - Via C. Monteverdi - Largo Monteverdi (Capolinea)",
        "note": [
            "(A) Corsa effettuata dalla linea 23",
            "(B) La corsa parte alle 06:30 da Borgo San Martino",
            "N.B.: Il sabato, la domenica e nei giorni festivi la linea 33 NON effettua servizio."
        ],
        "stops": [
            { "id": "33_s1", "nome": "Largo Monteverdi (Valcanneto Capolinea Partenza)", "lat": 41.947363, "lng": 12.155786, "via": "Largo Monteverdi", "timing": True },
            { "id": "33_s2", "nome": "Via Pergolesi", "lat": 41.949368, "lng": 12.155753, "via": "Via Pergolesi", "timing": False },
            { "id": "33_s3", "nome": "Via Vivaldi / Largo Vivaldi", "lat": 41.946474, "lng": 12.159243, "via": "Largo Vivaldi", "timing": False },
            { "id": "33_s4", "nome": "Via Scarlatti", "lat": 41.951524, "lng": 12.156492, "via": "Via Scarlatti", "timing": False },
            { "id": "33_s5", "nome": "Via A. Boito / Via U. Giordano", "lat": 41.954997, "lng": 12.159437, "via": "Via A. Boito", "timing": False },
            { "id": "33_s6", "nome": "Via Doganale (Uscita Valcanneto)", "lat": 41.948370, "lng": 12.153723, "via": "Via Doganale", "timing": False },
            { "id": "33_s7", "nome": "Via Doganale (Bivio Aurelia)", "lat": 41.936500, "lng": 12.151000, "via": "Via Doganale", "timing": False },
            { "id": "33_s8", "nome": "Via Aurelia Sud", "lat": 41.928000, "lng": 12.158000, "via": "Via Aurelia", "timing": False },
            { "id": "33_s9", "nome": "Via S. Carlo a Palidoro", "lat": 41.921485, "lng": 12.170641, "via": "Via S. Carlo a Palidoro", "timing": False },
            { "id": "33_s10", "nome": "Stazione FS Palidoro (Arrivo/Partenza)", "lat": 41.924273, "lng": 12.183337, "via": "Via della Stazione di Palidoro", "timing": True },
            { "id": "33_s11", "nome": "Via dei Tre Denari (Ritorno)", "lat": 41.922000, "lng": 12.178000, "via": "Via dei Tre Denari", "timing": False },
            { "id": "33_s12", "nome": "Via S. Carlo a Palidoro (Ritorno)", "lat": 41.921485, "lng": 12.170641, "via": "Via S. Carlo a Palidoro", "timing": False },
            { "id": "33_s13", "nome": "Via Aurelia (Ritorno)", "lat": 41.928000, "lng": 12.158000, "via": "Via Aurelia", "timing": False },
            { "id": "33_s14", "nome": "Via Doganale (Ritorno Valcanneto)", "lat": 41.936500, "lng": 12.151000, "via": "Via Doganale", "timing": False },
            { "id": "33_s15", "nome": "Via C. Monteverdi (Ingresso Valcanneto)", "lat": 41.948370, "lng": 12.153723, "via": "Via C. Monteverdi", "timing": False },
            { "id": "33_s16", "nome": "Largo Monteverdi (Arrivo Capolinea)", "lat": 41.947363, "lng": 12.155786, "via": "Largo Monteverdi", "timing": True }
        ],
        "orari": {
            "lun_ven": [
                { "id": "33-LV-1", "partenza": "06:40", "note": "(B)", "stopTimes": { "33_s1": "06:40", "33_s10": "06:55", "33_s16": "07:15" } },
                { "id": "33-LV-2", "partenza": "06:50", "note": "(A)", "stopTimes": { "33_s1": "06:50", "33_s10": "07:05" } },
                { "id": "33-LV-3", "partenza": "07:20", "stopTimes": { "33_s1": "07:20", "33_s10": "07:35", "33_s16": "07:55" } },
                { "id": "33-LV-4", "partenza": "07:55", "stopTimes": { "33_s1": "07:55", "33_s10": "08:15", "33_s16": "08:30" } },
                { "id": "33-LV-5", "partenza": "08:30", "stopTimes": { "33_s1": "08:30", "33_s10": "08:50", "33_s16": "09:05" } },
                { "id": "33-LV-6", "partenza": "13:00", "stopTimes": { "33_s1": "13:00", "33_s10": "13:20", "33_s16": "14:05" } },
                { "id": "33-LV-7", "partenza": "14:10", "stopTimes": { "33_s1": "14:10", "33_s10": "14:25", "33_s16": "15:00" } },
                { "id": "33-LV-8", "partenza": "15:00", "stopTimes": { "33_s1": "15:00", "33_s10": "15:20", "33_s16": "15:55" } },
                { "id": "33-LV-9", "partenza": "18:40", "note": "(A)", "stopTimes": { "33_s10": "18:40", "33_s16": "18:55" } },
                { "id": "33-LV-10", "partenza": "19:40", "note": "(A)", "stopTimes": { "33_s10": "19:40", "33_s16": "19:55" } }
            ],
            "sabato": [],     # Nessun servizio il sabato
            "domenica": []   # Nessun servizio la domenica
        }
    }
}

# Per garantire retrocompatibilità trasparente con il codice attuale:
# Copiamo 'orari.lun_ven' nel campo piatto 'tratte', così che qualsiasi codice che legge linea.tratte continui a funzionare!
for line_id, line_obj in linee_data.items():
    line_obj["tratte"] = line_obj["orari"]["lun_ven"]

# Salviamo in linee.json con indentazione pulita e utf-8
output_data = {
    "calendario_servizio": CALENDARIO_SERVIZIO,
    "linee": linee_data
}

# Manteniamo anche la struttura al livello radice per compatibilità diretta se SCHEDULES[lineKey] legge direttamente da root:
for line_id, line_obj in linee_data.items():
    output_data[line_id] = line_obj

with open("linee.json", "w", encoding="utf-8") as f:
    json.dump(output_data, f, ensure_ascii=False, indent=2)

print(f"SUCCESS: Generato linee.json con {len(linee_data)} linee complete e dettagliate!")
for line_id, line_obj in linee_data.items():
    stops_cnt = len(line_obj["stops"])
    lv_cnt = len(line_obj["orari"]["lun_ven"])
    sa_cnt = len(line_obj["orari"]["sabato"])
    do_cnt = len(line_obj["orari"]["domenica"])
    print(f" - Linea {line_id}: {stops_cnt} fermate | Corse: LV={lv_cnt}, SA={sa_cnt}, DO={do_cnt}")
