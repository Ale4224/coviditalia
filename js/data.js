let regioni = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "P.A. Bolzano", "P.A. Trento", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Umbria", "Valle d'Aosta", "Veneto"]

let getData = async function() {
    let urlRegioni = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json'
    let urlItalia = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale.json'
    await Promise.all([fetch(urlItalia)
        .then(response => response.json())
        .then(json => popolateData(json, ''))
        .catch(error => console.error(error)),
        fetch(urlRegioni)
        .then(response => response.json())
        .then(popolateDataRegione)
        .catch(error => console.error(error))
    ])
}

let totaleToGiornaliero = function(list) {
    l = []
    for (d in list) {
        if (d == 0) {
            l.push(list[d])
            continue
        }
        l.push(list[d] - list[d - 1])
    }
    return l
}

let listAvg = function(listIn, avgNumber, decimal) {
    list = [...listIn].reverse()
    let l = []
    let length = list.length
    let somma = 0;
    for (i in list) {
        somma += list[i]
        if (i != 0 && (Number(i) + 1) % avgNumber == 0) {
            l.push(somma / avgNumber)
            somma = 0
            continue
        }
        if (i == length - 1) {
            l.push(somma / (length % avgNumber))
            break
        }
    }
    if (!decimal)
        decimal = 0
    return l.map(x => Number(x.toFixed(decimal))).reverse()
}

let rateoListe = function(list1, list2, scale) {
    return list1.map((e, i) => parseInt((e / list2[i]) * scale))
}

let popolateDataRegione = function(dati_covid) {
    for (const r of regioni) {
        popolateData(dati_covid.filter(a => a.denominazione_regione == r), r)
    }
}

let calcoloRT = function(lista_infetti) {
    let A = 1.87
    let B = 0.28
    let result = []
    let gammaResults = libR.Gamma().dgamma([...Array(lista_infetti.length).keys()], A, B);
    for (t in lista_infetti) {
        if (t == 0) {
            result.push(0)
            continue
        }
        let sum = 0
        for (let s = 1; s <= t; s++) {
            let gamma = gammaResults[s]
            sum += gamma * lista_infetti[t - s]
        }
        result.push(lista_infetti[t] / sum)
    }
    return result.map(x => Number(x.toFixed(2)));
}

let popolateData = function(dati_covid, regione) {

    if (regione == '')
        date = {
            avg_1: dati_covid.map(a => new Date(a.data)),
            avg_3: dati_covid.map(a => new Date(a.data)).filter((a, index) => index % 3 == 0),
            avg_7: dati_covid.map(a => new Date(a.data)).filter((a, index) => index % 7 == 0),
            avg_15: dati_covid.map(a => new Date(a.data)).filter((a, index) => index % 15 == 0),
            avg_30: dati_covid.map(a => new Date(a.data)).filter((a, index) => index % 30 == 0),
        }

    let nuovi_positivi = dati_covid.map(a => a.nuovi_positivi)
    let ricoverati_con_sintomi = dati_covid.map(a => a.ricoverati_con_sintomi)
    let terapia_intensiva = dati_covid.map(a => a.terapia_intensiva)

    let totale_deceduti = dati_covid.map(a => a.deceduti)
    let totale_ospedalizzati = dati_covid.map(a => a.totale_ospedalizzati)
    let totale_tamponi = dati_covid.map(a => a.tamponi)
    let totale_dimessi_guariti = dati_covid.map(a => a.dimessi_guariti)
    let totale_casi = dati_covid.map(a => a.totale_casi)
    let totale_positivi = dati_covid.map(a => a.totale_positivi)
    let deceduti = totaleToGiornaliero(totale_deceduti)
    let tamponi = totaleToGiornaliero(totale_tamponi)
    let dimessi_guariti = totaleToGiornaliero(totale_dimessi_guariti)

    let rateo_tamponi_nuovi_positivi = rateoListe(nuovi_positivi, tamponi, 1000)

    let variazione_nuovi_positivi = totaleToGiornaliero(nuovi_positivi)

    let calcolo_r_t = calcoloRT(nuovi_positivi)

    addToDataset('nuovi_positivi', regione, 'Nuovi positivi', nuovi_positivi)
    addToDataset('tamponi', regione, 'Tamponi', tamponi)
    addToDataset('rateo_tamponi_nuovi_positivi', regione, 'Nuovi positivi per mille tamponi', rateo_tamponi_nuovi_positivi)
    addToDataset('deceduti', regione, 'Deceduti', deceduti)
    addToDataset('variazione_nuovi_positivi', regione, 'Variazione nuovi positivi', variazione_nuovi_positivi)
    addToDataset('ricoverati_con_sintomi', regione, 'Ricoverati con sintomi', ricoverati_con_sintomi)
    addToDataset('terapia_intensiva', regione, 'Terapia intensiva', terapia_intensiva)
    addToDataset('ospedalizzati', regione, 'Ospedalizzati', totale_ospedalizzati)
    addToDataset('dimessi_guariti', regione, 'Guariti', dimessi_guariti)
    addToDataset('totale_casi', regione, 'Totale casi', totale_casi)
    addToDataset('totale_positivi', regione, 'Totale positivi', totale_positivi)
    addToDataset('totale_deceduti', regione, 'Totale deceduti', totale_deceduti)
    addToDataset('calcolo_r_t', regione, 'Calcolo Rt (beta)', calcolo_r_t, 'https://it.wikipedia.org/wiki/Numero_di_riproduzione_di_base#Numero_di_riproduzione_netto_al_tempo_t', 2)
}

let addToDataset = function(id, regione, title, list, link, decimal) {

    let ds = {
        title,
        id,
        link,
        avg_1: list,
        avg_3: listAvg(list, 3, decimal),
        avg_7: listAvg(list, 7, decimal),
        avg_15: listAvg(list, 15, decimal),
        avg_30: listAvg(list, 30, decimal),
    }

    if (regione == '') {
        datasets[id] = ds
        datasets[id].regioni = {}
        return
    }
    ds.regione = regione
    ds.title += ' ' + regione
    datasets[id].regioni[regione] = ds

}

let date = {}

let datasets = {}