let regioni = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "P.A. Bolzano", "P.A. Trento", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Umbria", "Valle d'Aosta", "Veneto"]

getData = async function() {
    let urlRegioni = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json'
    let urlItalia = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale.json'
    await Promise.all([fetch(urlItalia)
        .then(response => response.json())
        .then(json => popolateData(json, ''))
        .catch(error => console.error(error)), fetch(urlRegioni)
        .then(response => response.json())
        .then(popolateDataRegione)
        .catch(error => console.error(error))
    ])
}

totaleToGiornaliero = function(list) {
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

listAvg = function(list, avgNumber) {
    let l = []
    let length = list.length
    let somma = 0;
    for (i in list) {
        somma += list[i]
        if (i != 0 && (Number(i) + 1) % avgNumber == 0) {
            l.push(parseInt(somma / avgNumber))
            somma = 0
            continue
        }
        if (i == length - 1) {
            l.push(parseInt(somma / (length - parseInt(length / avgNumber) * avgNumber)))
            break
        }
    }
    return l
}

rateoListe = function(list1, list2, scale) {
    return list1.map((e, i) => parseInt((e / list2[i]) * scale))
}

let popolateDataRegione = function(dati_covid) {
    for (const r of regioni) {
        popolateData(dati_covid.filter(a => a.denominazione_regione == r), r)
    }
}

let popolateData = function(dati_covid, regione) {

    if (regione == '')
        date = {
            avg_1: dati_covid.map(a => new Date(a.data).toLocaleDateString()),
            avg_3: dati_covid.map(a => new Date(a.data).toLocaleDateString()).filter((a, index) => index % 3 == 0),
            avg_7: dati_covid.map(a => new Date(a.data).toLocaleDateString()).filter((a, index) => index % 7 == 0),
        }

    let nuovi_positivi = dati_covid.map(a => a.nuovi_positivi)
    let ricoverati_con_sintomi = dati_covid.map(a => a.ricoverati_con_sintomi)
    let terapia_intensiva = dati_covid.map(a => a.terapia_intensiva)

    let totale_deceduti = dati_covid.map(a => a.deceduti)
    let totale_ospedalizzati = dati_covid.map(a => a.totale_ospedalizzati)
    let totale_tamponi = dati_covid.map(a => a.tamponi)
    let totale_dimessi_guariti = dati_covid.map(a => a.dimessi_guariti)
    let deceduti = totaleToGiornaliero(totale_deceduti)
    let ospedalizzati = totaleToGiornaliero(totale_ospedalizzati)
    let tamponi = totaleToGiornaliero(totale_tamponi)
    let dimessi_guariti = totaleToGiornaliero(totale_dimessi_guariti)

    let rateo_tamponi_nuovi_positivi = rateoListe(nuovi_positivi, tamponi, 1000)

    datasets['nuovi_positivi' + regione] = {
        title: 'Nuovi positivi ' + regione,
        id: 'nuovi_positivi' + regione,
        avg_1: nuovi_positivi,
    }
    datasets['ricoverati_con_sintomi' + regione] = {
        title: 'Ricoverati con sintomi ' + regione,
        id: 'ricoverati_con_sintomi' + regione,
        avg_1: ricoverati_con_sintomi,
    }
    datasets['terapia_intensiva' + regione] = {
        title: 'Terapia intensiva ' + regione,
        id: 'terapia_intensiva' + regione,
        avg_1: terapia_intensiva,
    }


    datasets['tamponi' + regione] = {
        title: 'Tamponi ' + regione,
        id: 'tamponi' + regione,
        avg_1: tamponi,
    }
    datasets['ospedalizzati' + regione] = {
        title: 'Ospedalizzati ' + regione,
        id: 'ospedalizzati' + regione,
        avg_1: ospedalizzati,
    }
    datasets['deceduti' + regione] = {
        title: 'Deceduti ' + regione,
        id: 'deceduti' + regione,
        avg_1: deceduti,
    }
    datasets['dimessi_guariti' + regione] = {
        title: 'Guariti ' + regione,
        id: 'dimessi_guariti' + regione,
        avg_1: dimessi_guariti,
    }

    datasets['rateo_tamponi_nuovi_positivi' + regione] = {
        title: 'Nuovi positivi per mille tamponi ' + regione,
        id: 'rateo_tamponi_nuovi_positivi' + regione,
        avg_1: rateo_tamponi_nuovi_positivi,
    }

    for (ds in datasets) {
        datasets[ds].avg_3 = listAvg(datasets[ds].avg_1, 3)
        datasets[ds].avg_7 = listAvg(datasets[ds].avg_1, 7)
    }
}

let date = {}

let datasets = {}