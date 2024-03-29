let regioni = ["Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna", "Friuli Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche", "Molise", "P.A. Bolzano", "P.A. Trento", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana", "Umbria", "Valle d'Aosta", "Veneto"]
let codiciRegioni = ["ABR", "BAS", "CAL", "CAM", "EMR", "FVG", "LAZ", "LIG", "LOM", "MAR", "MOL", "PAB", "PAT", "PIE", "PUG", "SAR", "SIC", "TOS", "UMB", "VDA", "VEN"]

let regioni_abitanti = JSON.parse('{"":59641488,"Abruzzo":1293941,"Basilicata":553254,"Calabria":1894110,"Campania":5712143,"Emilia-Romagna":4464119,"Friuli Venezia Giulia":1206216,"Lazio":5755700,"Liguria":1524826,"Lombardia":10027602,"Marche":1512672,"Molise":300516,"P.A. Bolzano":532644,"P.A. Trento":545425,"Piemonte":4311217,"Puglia":3953305,"Sardegna":1611621,"Sicilia":4875290,"Toscana":3692555,"Umbria":870165,"Valle d\'Aosta":125034,"Veneto":4879133}')

let rawData = {}

let getData = async function () {
    let urlRegioni = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-regioni.json'
    let urlItalia = 'https://raw.githubusercontent.com/pcm-dpc/COVID-19/master/dati-json/dpc-covid19-ita-andamento-nazionale.json'
    let urlVaccini = 'https://raw.githubusercontent.com/italia/covid19-opendata-vaccini/master/dati/somministrazioni-vaccini-summary-latest.json'
    await Promise.all([fetch(urlItalia)
        .then(response => response.json())
        .then(json => popolateData(json, ''))
        .catch(error => console.error(error)),
    fetch(urlRegioni)
        .then(response => response.json())
        .then(popolateDataRegione)
        .catch(error => console.error(error))
    ])
    await Promise.all([fetch(urlVaccini)
        .then(response => response.json())
        .then(json => popolaVaccini(json))
        .catch(error => console.error(error))
    ])
}

let totaleToGiornaliero = function (list, ignoreNaN) {
    let l = []
    for (d in list) {
        if (d == 0) {
            l.push(list[d])
            continue
        }
        let giornaliero = list[d] - list[d - 1]
        if (ignoreNaN)
            l.push(giornaliero)
        else
            l.push(giornaliero >= 0 ? giornaliero : NaN)
    }
    return l
}

let giornalieroToTotale = function (list) {
    const result = []
    let sum = 0
    for (d of list) {
        let dd = isNaN(d) ? 0 : d
        result.push(dd + sum)
        sum += dd
    }
    return result;
}

let listAvg = function (listIn, avgNumber, decimal, limit) {
    list = [...listIn].reverse()
    if (limit)
        list = list.filter((_, i) => i >= limit)
    if (avgNumber == 1)
        return list.map(x => Number(x.toFixed(decimal))).reverse()
    let l = []
    let length = list.length
    let somma = 0;
    let NaNCounter = 0;
    for (i in list) {

        if (isNaN(list[i])) {
            NaNCounter++
        } else {
            somma += list[i]
        }

        if (i != 0 && (Number(i) + 1) % avgNumber == 0) {
            l.push(somma / (avgNumber - NaNCounter))
            somma = 0
            NaNCounter = 0
            continue
        }
        if (i == length - 1) {
            l.push(somma / ((length % avgNumber) - NaNCounter))
            break
        }
    }
    if (!decimal)
        decimal = 0
    return l.map(x => Number(x.toFixed(decimal))).reverse()
}

let rateoListe = function (list1, list2, scale, decimal) {
    return list1.map((e, i) => Number(((e / list2[i]) * scale).toFixed(decimal)))
}
let popolateDataRegione = function (dati_covid) {
    for (const r of regioni) {
        dati_regionali = dati_covid.filter(a => a.denominazione_regione == r)
        rawData[r] = dati_regionali
        popolateData(dati_regionali, r)
    }
}

const A = 1.87
const B = 0.28
const gammaResults = libR.Gamma().dgamma([...Array(2000).keys()], A, B)
let calcoloRT = function (lista_infetti) {
    let result = []
    for (t in lista_infetti) {
        if (t == 0) {
            result.push(0)
            continue
        }
        let sum = 0
        for (let s = 1; s <= t; s++) {
            sum += gammaResults[s] * lista_infetti[t - s]
        }
        result.push(lista_infetti[t] / sum)
    }
    return result.map(x => Number(x.toFixed(2)));
}

let popolateData = function (dati_covid, regione) {
    if (regione == '')
        rawData.nazionale = dati_covid

    dati_covid = dati_covid.filter((v, i, a) => a.findIndex(t => (t.data === v.data)) === i)

    date = date || {
        str: dati_covid.map(a => new Date(a.data).toLocaleDateString()),
        avg_1: dati_covid.map(a => new Date(a.data)),
        getAvg: (avg, limit) => dati_covid.map(a => new Date(a.data))
            .reverse()
            .filter((_, i) => i >= (limit || 0))
            .filter((_, i) => i % avg == 0)
            .reverse(),
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

    let variazione_nuovi_positivi = totaleToGiornaliero(nuovi_positivi, true)

    let calcolo_r_t = calcoloRT(nuovi_positivi)

    addToDataset('nuovi_positivi', regione, 'Nuovi positivi', nuovi_positivi)
    addToDataset('totale_positivi', regione, 'Totale positivi', totale_positivi)
    addToDataset('rateo_tamponi_nuovi_positivi', regione, 'Nuovi positivi per 1.000 tamponi', rateo_tamponi_nuovi_positivi)
    addToDataset('tamponi', regione, 'Tamponi', tamponi)
    addToDataset('totale_tamponi', regione, 'Totale Tamponi', totale_tamponi)
    addToDataset('variazione_nuovi_positivi', regione, 'Variazione nuovi positivi', variazione_nuovi_positivi)
    addToDataset('deceduti', regione, 'Deceduti', deceduti)
    addToDataset('totale_deceduti', regione, 'Totale deceduti', totale_deceduti)
    addToDataset('totale_casi', regione, 'Totale casi', totale_casi)
    addToDataset('ricoverati_con_sintomi', regione, 'Ricoverati con sintomi', ricoverati_con_sintomi)
    addToDataset('terapia_intensiva', regione, 'Terapia intensiva', terapia_intensiva)
    addToDataset('ospedalizzati', regione, 'Ospedalizzati', totale_ospedalizzati)
    addToDataset('dimessi_guariti', regione, 'Guariti', dimessi_guariti)
    addToDataset('calcolo_r_t', regione, 'Calcolo Rt', calcolo_r_t, 'https://it.wikipedia.org/wiki/Numero_di_riproduzione_di_base#Numero_di_riproduzione_netto_al_tempo_t', 2)
}

function getDataByYear(list) {
    res = {}

    let firstDate = date.avg_1[0]
    let startDate = new Date(firstDate)
    startDate.setMonth(0)
    startDate.setDate(1)
    res[firstDate.getFullYear()] = new Array(Math.round((firstDate - startDate) / (1000 * 60 * 60 * 24))).fill(0)
    for (let i in list) {
        let d = date.avg_1[i]
        let year = d.getFullYear()
        if ((((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0)) && d.getDate() === 28 && d.getMonth() === 1) {
            continue
        }
        if (!res[year])
            res[year] = []
        res[year].push(list[i])
    }

    return res
}

let addToDataset = function (id, regione, title, list, link, decimal) {

    let ds = {
        title,
        id,
        link,
        avg_1: list,
        getAvg: (avg, limit) => (listAvg(list, avg, decimal, limit)),
        getRateoAbitanti: (avg, limit) => {
            let ret = listAvg(list, avg, decimal, limit)
            ret = rateoListe(ret, new Array(ret.length).fill(regioni_abitanti[regione]), 100, 4)
            return ret
        },
        getDataByYear: (avg, limit) => {
            let ret = listAvg(list, 1, decimal, limit)
            ret = getDataByYear(ret)
            Object.keys(ret).forEach(key => {
                ret[key] = listAvg(ret[key], avg, decimal)
            })
            return ret
        },
        getDataByYearRateoAbitanti: (avg, limit) => {
            let ret = listAvg(list, 1, decimal, limit)
            ret = rateoListe(ret, new Array(ret.length).fill(regioni_abitanti[regione]), 100, 4)
            ret = getDataByYear(ret)
            Object.keys(ret).forEach(key => {
                ret[key] = listAvg(ret[key], avg, 4)
            })
            return ret
        },
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

const datiParsati = []
let popolaVaccini = function (datiVaccini) {
    rawData.vaccini = datiVaccini.data
    let datiItalia = []

    for (const i in codiciRegioni) {
        let dati = datiVaccini.data
            .filter(d => d.area == codiciRegioni[i])
            .map(d => {
                return {
                    data: d.data, 
                    prima_dose: d.d1, 
                    seconda_dose: d.d2,
                    dose_addizionale_booster: d.db1,
                    seconda_dose_addizionale_booster: d.db2,
                } 
            })
            .sort((a, b) => a.data.localeCompare(b.data))
        let regione = regioni[i]
        datiParsati.push({ regione, dati })
        dati.forEach(d => {
            if (datiItalia.find(di => di.data == d.data)){
                datiItalia.find(di => di.data == d.data).prima_dose += d.prima_dose
                datiItalia.find(di => di.data == d.data).seconda_dose += d.seconda_dose
                datiItalia.find(di => di.data == d.data).dose_addizionale_booster += d.dose_addizionale_booster
                datiItalia.find(di => di.data == d.data).seconda_dose_addizionale_booster += d.seconda_dose_addizionale_booster
            }
            else
                datiItalia.push({
                    data: d.data, 
                    prima_dose: d.prima_dose, 
                    seconda_dose: d.seconda_dose,
                    dose_addizionale_booster: d.dose_addizionale_booster,
                    seconda_dose_addizionale_booster: d.seconda_dose_addizionale_booster,
                })
        })
    }
    datiItalia = datiItalia.sort((a, b) => a.data.localeCompare(b.data))
    addVacciniToDataset(datiItalia, '')

    for (const dati of datiParsati) {
        addVacciniToDataset(dati.dati, dati.regione)
    }
}

let addVacciniToDataset = function (dati, regione) {
    let vaccini_prima_dose = normalizeDatiVaccini(dati, 'prima_dose')
    let totale_vaccini_prima_dose = giornalieroToTotale(vaccini_prima_dose)
    addToDataset('vaccini_prima_dose', regione, 'Vaccini prima dose', vaccini_prima_dose)
    addToDataset('totale_vaccini_prima_dose', regione, 'Totale Vaccini prima dose', totale_vaccini_prima_dose)

    let vaccini_seconda_dose = normalizeDatiVaccini(dati, 'seconda_dose')
    let totale_vaccini_seconda_dose = giornalieroToTotale(vaccini_seconda_dose)
    addToDataset('vaccini_seconda_dose', regione, 'Vaccini seconda dose', vaccini_seconda_dose)
    addToDataset('totale_vaccini_seconda_dose', regione, 'Totale Vaccini seconda dose', totale_vaccini_seconda_dose)

    let dose_addizionale_booster = normalizeDatiVaccini(dati, 'dose_addizionale_booster')
    let totale_dose_addizionale_booster = giornalieroToTotale(dose_addizionale_booster)
    addToDataset('dose_addizionale_booster', regione, 'Vaccini dose addizionale booster', dose_addizionale_booster)
    addToDataset('totale_dose_addizionale_booster', regione, 'Totale Vaccini dose addizionale booster', totale_dose_addizionale_booster)

    let seconda_dose_addizionale_booster = normalizeDatiVaccini(dati, 'seconda_dose_addizionale_booster')
    let totale_seconda_dose_addizionale_booster = giornalieroToTotale(seconda_dose_addizionale_booster)
    addToDataset('seconda_dose_addizionale_booster', regione, 'Vaccini seconda dose addizionale booster', seconda_dose_addizionale_booster)
    addToDataset('totale_seconda_dose_addizionale_booster', regione, 'Totale Vaccini seconda dose addizionale booster', totale_seconda_dose_addizionale_booster)
}

let normalizeDatiVaccini = function (dati, dose) {
    dati = [...dati]
    const result = []
    for (data of date.str) {
        if (dati[0] && data == new Date(dati[0].data).toLocaleDateString())
            result.push(dati.shift()[dose])
        else
            result.push(0)
    }

    return result
}

let date

const datasets = {}