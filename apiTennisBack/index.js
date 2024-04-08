import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';
const app = express();
const port = 3006;

if (process.env.NODE_ENV) {
    dotenv.config({path: `./.env.${process.env.NODE_ENV}`});
} else {
    dotenv.config();
}
let apiTennisKey=process.env.API_TENNIS_KEY;
let urlPython=process.env.URL;
let apiGeonamesKey=process.env.API_GEONAMES_KEY;
// console.log("URL :", process.env.URL);
console.log("API KEY :", process.env.API_TENNIS_KEY);

app.use(cors());

app.get('/getMatchData', async (req, res) => {
    
    const today = new Date();
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    const formattedToday = today.toISOString().split('T')[0];
    const formattedAfterTomorrow = afterTomorrow.toISOString().split('T')[0];

    try {
        console.log("API KEY :", apiTennisKey);
        const response = await fetch(`https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey=${apiTennisKey}&date_start=${formattedToday}&date_stop=${formattedAfterTomorrow}`);
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
		// var eventTypeTypeObjects = data.result;
		var eventTypeTypeObjects = data.result.filter(obj =>
			obj.event_type_type === "Wta Singles" ||
			obj.event_type_type === "Itf Women Singles" ||
			obj.event_type_type === "Itf Women - Singles" ||
			obj.event_type_type === "Challenger Women Singles" ||
			obj.event_type_type === "Challenger Women - Singles"
		);
		
		if (eventTypeTypeObjects.length > 0) {
			var tournamentsData = [];
			
			for (const eventTypeTypeObject of eventTypeTypeObjects) {
				var tournamentName = eventTypeTypeObject.tournament_name;
				var eventDate = eventTypeTypeObject.event_date;
				var convertedHour = eventTypeTypeObject.event_time;
				var event_time_real = convertirHeureLocaleEnGMT(convertedHour);
				console.log("event_time_real", event_time_real);
				
				var paysfr;
				var flagPng = "";
				if (extractCountryNameByTournament(tournamentName).existeNomPays === true) {
					var countryFromTournament = extractCountryNameByTournament(tournamentName).nomPays;
					flagPng = await getCountryFlagByName(countryFromTournament);
					var translatedCountryName = await translateCountryName(countryFromTournament);
					
				} else {
					var tournamentPlace = extractTournamentLocation(tournamentName);
					var countryFromTournamentLocation = await getCountryByTournamentName(tournamentPlace);
					flagPng = await getCountryFlagByName(countryFromTournamentLocation);
					paysfr = await getCountryFlagByNamefr(countryFromTournamentLocation);
				}
				
				const odds = await fetchOdds(eventTypeTypeObject.event_key);
				const oddsLive = await fetchOddsLive(eventTypeTypeObject.event_key);
				console.log('flag: ', flagPng);
				tournamentsData.push({
					odds: odds,
					oddsLive: oddsLive,
					eventFirstPlayer: eventTypeTypeObject.event_first_player,
					eventSecondPlayer: eventTypeTypeObject.event_second_player,
					eventTime: event_time_real,
					eventLive: eventTypeTypeObject.event_live,
                    match_key: String(eventTypeTypeObject.event_key),					
                    event_date: eventTypeTypeObject.event_date,
					eventplayer_logo1: eventTypeTypeObject.event_first_player_logo ? eventTypeTypeObject.event_first_player_logo : '',
					eventplayer_logo2: eventTypeTypeObject.event_second_player_logo ? eventTypeTypeObject.event_second_player_logo : '',
					tournament_name: eventTypeTypeObject.tournament_name + "" + "(" + paysfr + ")",
					flagPng: flagPng,
				});
			}
			
			for (var key in tournamentsData) {
				if (tournamentsData.hasOwnProperty(key)) {
					async function insertMatchData(data) {
						try {
							const body = JSON.stringify({
								"odds": data.odds,
								"odds_live": data.oddsLive,
								"name_first_player": data.eventFirstPlayer,
								"name_second_player": data.eventSecondPlayer,
								"event_time": data.eventTime,
								"event_live": data.eventLive,
								"match_key": data.match_key,
								"event_date": data.event_date,
								"eventplayer_logo1": data.eventplayer_logo1,
								"eventplayer_logo2": data.eventplayer_logo2,
								"tournament_name": data.tournament_name,
								"flagPng": data.flagPng,
								"status": false,
								"result": "",
								"set1_joueuse1": "",
								"set1_joueuse2": "",
								"set2_joueuse1": "",
								"set2_joueuse2": "",
								"set3_joueuse1": "",
								"set3_joueuse2": ""
							});
							
							const response = await fetch(`${urlPython}api/match/create_match/`, {
								method: 'POST',
								headers: {
									'Content-Type': 'application/json',
								},
								body: body,
							});
							
							console.log(body); // Afficher le contenu du body dans la console
							const responseData = await response.json();
						} catch (error) {
							console.error('Une erreur s\'est produite', error);
						}
					}

                    async function verifyMatchData(data) {
                        try {
                            const response = await fetch(`${urlPython}api/match/get_match/?match_key=${data.match_key}`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            });
                            const responseData = await response.json();
                            console.log(responseData); // Afficher les résultats du fetch
                        } catch (error) {
                            console.error('Une erreur s\'est produite', error);
                        }
                    }
                    let matchExist=await verifyMatchData(tournamentsData[key]);
                    if (matchExist !==null) {
                        await insertMatchData(tournamentsData[key]);
                    }
                    else{
                        console.log(`le match ayant comme id: ${tournamentsData[key].match_key} existe`);
                    }
					// console.log(tournamentsData[key]);
				}
			}
		}
	}
}



async function fetchOdds(matchKey) {
    const oddsApiUrl = `https://api.api-tennis.com/tennis/?method=get_odds&APIkey=${apiTennisKey}&match_key=${matchKey}`;

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
    const oddsLiveApiUrl = `https://api.api-tennis.com/tennis/?method=get_odds&APIkey=${apiTennisKey}&match_key=${matchKey}`;

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

function convertirHeureLocaleEnGMT(heure) {
    const [heures, minutes] = heure.split(':').map(Number);
    const dateHeure = new Date();
    dateHeure.setHours(heures, minutes, 0);
    dateHeure.setHours(dateHeure.getHours() - 1 +  (getDecalageHoraireGMT()));//2
    const nouvellesHeures = dateHeure.getHours();
    const nouvellesMinutes = dateHeure.getMinutes();
    const heureSoustraite = `${nouvellesHeures.toString().padStart(2, '0')}:${nouvellesMinutes.toString().padStart(2, '0')}`;
    return heureSoustraite;
}

function getDecalageHoraireGMT() {
    var decalageMinutes = new Date().getTimezoneOffset();

    var decalageHeures = (decalageMinutes / 60) * (-1);

    return decalageHeures;
}

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});