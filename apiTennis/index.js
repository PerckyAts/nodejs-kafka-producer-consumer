import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = 3005;

app.get('/getMatch', async (req, res) => {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
    const today = new Date();
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    const formattedToday = today.toISOString().split('T')[0];
    const formattedAfterTomorrow = afterTomorrow.toISOString().split('T')[0];

    const apiUrl = `https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey=${apiKey}&date_start=${formattedToday}&date_stop=${formattedAfterTomorrow}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        data.result.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        var result = await displayEventDetails(data);
        console.log(JSON.stringify(result));
        res.json(JSON.stringify(result));
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
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
        var odds;
        if (eventTypeTypeObjects.length > 0) {
            var tournamentsData = {};
            var odds;
            for (const eventTypeTypeObject of eventTypeTypeObjects) {
                var tournamentName = eventTypeTypeObject.tournament_name;
                var eventDate = eventTypeTypeObject.event_date;

                if (!tournamentsData[tournamentName]) {
                    tournamentsData[tournamentName] = {};
                }

                if (!tournamentsData[tournamentName][eventDate]) {
                    tournamentsData[tournamentName][eventDate] = [];
                }
                odds=await fetchOdds(eventTypeTypeObject.event_key);
                // console.log("odds,",odds);
                tournamentsData[tournamentName][eventDate].push({
                    odds:odds,
                    eventFirstPlayer: eventTypeTypeObject.event_first_player,
                    eventSecondPlayer: eventTypeTypeObject.event_second_player,
                    eventTime: eventTypeTypeObject.event_time,
                    eventLive: eventTypeTypeObject.event_live,
                    match_key: eventTypeTypeObject.event_key,
                    event_date: eventTypeTypeObject.event_date,
                    eventplayer_logo1: eventTypeTypeObject.event_first_player_logo,
                    eventplayer_logo2: eventTypeTypeObject.event_second_player_logo
                });
            }

            // Parcourir les tournois et les dates pour récupérer les cotes

            return tournamentsData; // Ajout du retour
        } 
    } 
    
    return {}; // Retourner un objet vide si aucune donnée n'est disponible
}

async function fetchOdds(matchKey) {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
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
