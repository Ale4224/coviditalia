getData = async function() {
    await fetch('https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale.json')
        .then(response => response.json())
        .then(popolateData)
        .catch(error => console.error(error))
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
            l.push(somma / avgNumber)
            somma = 0
            continue
        }
        if (i == length - 1) {
            l.push(somma / (length - parseInt(length / avgNumber) * avgNumber))
            break
        }
    }
    return l
}

rateoListe = function(list1, list2) {
    return list1.map((e, i) => e / list2[i])
}

let popolateData = function(dati_covid) {

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
    let deceduti = totaleToGiornaliero(totale_deceduti)
    let ospedalizzati = totaleToGiornaliero(totale_ospedalizzati)
    let tamponi = totaleToGiornaliero(totale_tamponi)

    let rateo_tamponi_nuovi_positivi = rateoListe(nuovi_positivi, tamponi)

    datasets['nuovi_positivi'] = {
        title: 'Nuovi positivi',
        id: 'nuovi_positivi',
        avg_1: nuovi_positivi,
        avg_3: listAvg(nuovi_positivi, 3),
        avg_7: listAvg(nuovi_positivi, 7),
    }
    datasets['ricoverati_con_sintomi'] = {
        title: 'Ricoverati con sintomi',
        id: 'ricoverati_con_sintomi',
        avg_1: ricoverati_con_sintomi,
        avg_3: listAvg(ricoverati_con_sintomi, 3),
        avg_7: listAvg(ricoverati_con_sintomi, 7),
    }
    datasets['terapia_intensiva'] = {
        title: 'Terapia intensiva',
        id: 'terapia_intensiva',
        avg_1: terapia_intensiva,
        avg_3: listAvg(terapia_intensiva, 3),
        avg_7: listAvg(terapia_intensiva, 7),
    }


    datasets['tamponi'] = {
        title: 'Tamponi',
        id: 'tamponi',
        avg_1: tamponi,
        avg_3: listAvg(tamponi, 3),
        avg_7: listAvg(tamponi, 7),
    }
    datasets['ospedalizzati'] = {
        title: 'Ospedalizzati',
        id: 'ospedalizzati',
        avg_1: ospedalizzati,
        avg_3: listAvg(ospedalizzati, 3),
        avg_7: listAvg(ospedalizzati, 7),
    }
    datasets['deceduti'] = {
        title: 'Deceduti',
        id: 'deceduti',
        avg_1: deceduti,
        avg_3: listAvg(deceduti, 3),
        avg_7: listAvg(deceduti, 7),
    }

    datasets['rateo_tamponi_nuovi_positivi'] = {
        title: 'Rateo nuovi positivi per tampone',
        id: 'rateo_tamponi_nuovi_positivi',
        avg_1: rateo_tamponi_nuovi_positivi,
        avg_3: listAvg(rateo_tamponi_nuovi_positivi, 3),
        avg_7: listAvg(rateo_tamponi_nuovi_positivi, 7),
    }
}

let date = {}

let datasets = {}