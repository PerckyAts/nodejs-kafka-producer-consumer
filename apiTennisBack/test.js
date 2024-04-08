import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 3005;

app.use(cors());

app.get('/getMatchData', async (req, res) => {
    const apiKey = 'API_TENNIS_KEY';
    
    const today = new Date();
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    const formattedToday = today.toISOString().split('T')[0];
    const formattedAfterTomorrow = afterTomorrow.toISOString().split('T')[0];

    try {
        const response = await fetch(`https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey=${apiKey}&date_start=${formattedToday}&date_stop=${formattedAfterTomorrow}`);
        const data = await response.json();
        var dataProcessed=await displayEventDetails(data);
        res.json(dataProcessed);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});





async function displayEventDetails(data) {
    if (data && data.result && data.result.length > 0) {
        var eventTypeTypeObjects = data.result.filter(obj =>
            obj.event_type_type === "Wta Singles" ||
            obj.event_type_type === "Itf Women Singles" ||
            obj.event_type_type === "Itf Women - Singles" ||
            obj.event_type_type === "Challenger Women Singles" ||
            obj.event_type_type === "Challenger Women - Singles"
          );
        var odds ;
        
        if (eventTypeTypeObjects.length > 0) {
            var tournamentsData = {};

            for (const eventTypeTypeObject of eventTypeTypeObjects) {
                var tournamentName = eventTypeTypeObject.tournament_name;
                var eventDate = eventTypeTypeObject.event_date;

                if (!tournamentsData[tournamentName]) {
                    tournamentsData[tournamentName] = {};
                }

                if (!tournamentsData[tournamentName][eventDate]) {
                    tournamentsData[tournamentName][eventDate] = [];
                }
                var paysfr ;
                var flagPng = "";
                if (extractCountryNameByTournament(tournamentName).existeNomPays === true) {
                    var countryFromTournament = extractCountryNameByTournament(tournamentName).nomPays;
                    flagPng = await getCountryFlagByName(countryFromTournament);
                    var translatedCountryName=await translateCountryName(countryFromTournament)
                    if(translatedCountryName!=="Traduction non disponible"){
                        titleElement.textContent=tournamentName.replace(countryFromTournament,await translateCountryName(countryFromTournament) );
                    }
                    
                } else {
                    var tournamentPlace = extractTournamentLocation(tournamentName);
                    // console.log("ROGELLA",tournamentPlace);
                    var countryFromTournamentLocation = await getCountryByTournamentName(tournamentPlace);
                    flagPng = await getCountryFlagByName(countryFromTournamentLocation);
                    // console.log("ROGELLA",flagPng);
                    paysfr = await getCountryFlagByNamefr(countryFromTournamentLocation);
                    // console.log("ROGELLA",paysfr);
                }

                const odds = await fetchOdds(eventTypeTypeObject.event_key);
                const oddsLive = await fetchOddsLive(eventTypeTypeObject.event_key);
                
                tournamentsData[tournamentName][eventDate].push({
                    odds: odds,
                    oddsLive: oddsLive,
                    eventFirstPlayer: eventTypeTypeObject.event_first_player,
                    eventSecondPlayer: eventTypeTypeObject.event_second_player,
                    eventTime: eventTypeTypeObject.event_time,
                    eventLive: eventTypeTypeObject.event_live,
                    match_key: eventTypeTypeObject.event_key,
                    event_date: eventTypeTypeObject.event_date,
                    eventplayer_logo1: eventTypeTypeObject.event_first_player_logo,
                    eventplayer_logo2: eventTypeTypeObject.event_second_player_logo,
                    tournament_name: eventTypeTypeObject.tournament_name +""+"(" +paysfr+")",
                    flagPng: flagPng
                });
            }

            for (var tournamentName in tournamentsData) {

                var tournamentDates = tournamentsData[tournamentName];
                var hasData = false; 

                for (var eventDate in tournamentDates) {
                    var dateDataArray = tournamentDates[eventDate];
                    if (dateDataArray.length > 0) {
                        hasData = true;
                        break; 
                    }
                }

                if (hasData) { 
              

                    for (var eventDate in tournamentDates) {
                        var dateDataArray = tournamentDates[eventDate];
                        console.log('dateDataArray', dateDataArray);
   
                    }

                }
            }
        } else {
        }
    } else {
    }
}


async function fetchOdds(matchKey) {
    const apiKey = 'API_TENNIS_KEY';
    const oddsApiUrl = `https://api.api-tennis.com/tennis/?method=get_odds&APIkey=${apiKey}&match_key=${matchKey}`;

    try {
        const response = await fetch(oddsApiUrl);
        const oddsData = await response.json();
        let homeOdds, awayOdds;

        if (oddsData.result[matchKey]["Home/Away"].Home.Marathon) {
            homeOdds = oddsData.result[matchKey]["Home/Away"].Home.Marathon;
        } else {
            homeOdds = oddsData.result[matchKey]["Home/Away"].Home["1xbet"];
        }

        if (oddsData.result[matchKey]["Home/Away"].Away.Marathon) {
            awayOdds = oddsData.result[matchKey]["Home/Away"].Away.Marathon;
        } else {
            awayOdds = oddsData.result[matchKey]["Home/Away"].Away["1xbet"];
        }

        if (homeOdds === undefined || awayOdds === undefined) {
            return "Non disponible";
        } else {
            return `${homeOdds} / ${awayOdds}`;
        }
    } catch (error) {
        return "Non disponible";
    }
}

async function fetchOddsLive(matchKey) {
    const apiKey = 'API_TENNIS_KEY';
    const oddsLiveApiUrl = `https://api.api-tennis.com/tennis/?method=get_odds&APIkey=${apiKey}&match_key=${matchKey}`;

    try {
        const response = await fetch(oddsLiveApiUrl);
        const oddsData = await response.json();

        let homeOddsLive, awayOddsLive;

        if (oddsData.result[matchKey]["Home/Away (1st Set)"].Home.Marathon) {
            homeOddsLive = oddsData.result[matchKey]["Home/Away (1st Set)"].Home.Marathon;
        } else {
            homeOddsLive = oddsData.result[matchKey]["Home/Away (1st Set)"].Home["1xbet"];
        }

        if (oddsData.result[matchKey]["Home/Away (1st Set)"].Away.Marathon) {
            awayOddsLive = oddsData.result[matchKey]["Home/Away (1st Set)"].Away.Marathon;
        } else {
            awayOddsLive = oddsData.result[matchKey]["Home/Away (1st Set)"].Away["1xbet"];
        }

        return `${homeOddsLive} / ${awayOddsLive}`;
    } catch (error) {
        return "Non disponible";
    }
}
function extractCountryNameByTournament(tournamentName) {
    const regex = /\(([^)]+)\)/;
    const match = tournamentName.match(regex);
    
    if (match && match[1]) {
        const countryName = match[1].trim();
        const replacedTournamentName = tournamentName.replace(/\([^)]+\)/, translateCountryName(countryName));
        return { nomPays: countryName, existeNomPays: true, tournamentName: replacedTournamentName };
    } else {
        const lieu = tournamentName.split(' ').slice(1, -2).join(' ').trim();
        return { lieu: lieu, existeNomPays: false, tournamentName: tournamentName };
    }
}
async function getCountryFlagByName(countryName) {
    const getFlagUrl = `https://restcountries.com/v3.1/name/${countryName}`;
    try {
        const response = await fetch(getFlagUrl);
        const flagData = await response.json();
    if (flagData.length > 0) {
        const flags = flagData[0].flags;
        if (flags && flags.png) {
            return flags.png; // Retourne l'URL du drapeau au format PNG
        }
    }
    return "Drapeau non disponible";
    }
    catch (error) {
        return "Drapeau non disponible";
    }
}

/*GET COUNTRY FR */
async function getCountryFlagByNamefr(countryName) {
    const getFlagUrl = `https://restcountries.com/v3.1/name/${countryName}`;
    try {
        const response = await fetch(getFlagUrl);
        const flagData = await response.json();

        if (flagData.length > 0) {
        const translations = flagData[0].translations.fra.common;
            if (translations){
                return translations;
            } 

        }
    return "Pays non disponible";
    }
    catch (error) {
        return "Pays non disponible";
    }
}
/*ENDGET COUNTRY FR */
async function getCountryByTournamentName(tournamentPlace) {
    const apiGeonamesKey = "percky";
    const getFlagUrl = `https://secure.geonames.org/searchJSON?q=${encodeURIComponent(tournamentPlace)}&maxRows=1&username=${apiGeonamesKey}`;
    try {
        const response = await fetch(getFlagUrl);
        if (!response.ok) {
            throw new Error("Erreur lors de la récupération des données");
        }
        const countryData = await response.json();
        if (countryData.geonames && countryData.geonames.length > 0) {
            const countryName = countryData.geonames[0].countryName;
            return countryName;
        } else {
            throw new Error("Pays non disponible");
        }
    } catch (error) {
        console.error(error.message);
        return "Pays non disponible";
    }
}
function extractTournamentLocation(tournamentName) {
    const tabToTournamentName = tournamentName.split(' ');

    if(tabToTournamentName.length > 2 && (tabToTournamentName[tabToTournamentName.length-2]+" "+tabToTournamentName[tabToTournamentName.length-1]==="Challenger Women")){
        return tabToTournamentName[0]; 
    }
    else if(tabToTournamentName.length > 2 && (tabToTournamentName[0]==="ITF")){
        return tabToTournamentName[2]; 
    }
    else if (tabToTournamentName.length > 2) {
        return tabToTournamentName.slice(1).join(' ').trim();
    }
    else {
        return tabToTournamentName[1];
    }
}


async function translateCountryName(countryName) {
    const getFlagUrl = `https://restcountries.com/v3.1/name/${countryName}`;
    
    try {
        const response = await fetch(getFlagUrl);
        const countryData = await response.json();

        if (countryData.length > 0) {
            const translatedCountryName = countryData[0];
            if (translatedCountryName) {
                return translatedCountryName.translations.fra.common;
            }
        }
        return "Traduction non disponible";
    } catch (error) {
        return "Traduction non disponible";
    }
}

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});