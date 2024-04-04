import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const port = 3005;

app.use(cors());

app.get('/getMatchData', async (req, res) => {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
    
    const today = new Date();
    const afterTomorrow = new Date();
    afterTomorrow.setDate(today.getDate() + 2);
    const formattedToday = today.toISOString().split('T')[0];
    const formattedAfterTomorrow = afterTomorrow.toISOString().split('T')[0];

    try {
        const response = await fetch(`https://api.api-tennis.com/tennis/?method=get_fixtures&APIkey=${apiKey}&date_start=${formattedToday}&date_stop=${formattedAfterTomorrow}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});

app.get('/getOdds', async (req, res) => {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
    const matchKey = req.query.matchKey;
    const apiUrl = `https://api.api-tennis.com/tennis/?method=get_odds&APIkey=${apiKey}&match_key=${matchKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data); 
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});

app.get('/getOddsLive', async (req, res) => {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
    const matchKey = req.query.matchKey;
    const apiUrl = `https://api.api-tennis.com/tennis/?method=get_odds&APIkey=${apiKey}&match_key=${matchKey}`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data); 
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});

app.get('/getMatchData', async (req, res) => {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
    const { matchKey } = req.query;

    try {
        const apiUrl = `https://api.api-tennis.com/tennis/?method=get_fixtures&match_key=${matchKey}&APIkey=${apiKey}`;
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
});


app.get('/getMatchLive', async (req, res) => {
    const apiKey = 'b7979b39a429ec061fa9ffbef7847263d7a4e5a5112453159f24f9d8aeb7c67c';
    const matchKey = req.query.matchKey; // Récupérer matchKey de la requête GET
    const apiUrl = `https://api.api-tennis.com/tennis/?method=get_livescore&match_key=${matchKey}&APIkey=${apiKey}`;
    // const apiUrl = `https://api.api-tennis.com/tennis/?method=get_fixtures&match_key=${matchKey}&APIkey=${apiKey}`;


    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        res.json(data); // Envoyer directement la réponse JSON
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "An error occurred while fetching data" });
    }
});