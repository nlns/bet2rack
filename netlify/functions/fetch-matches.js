const fetch = require('node-fetch');

// API'den gelen veriyi bizim uygulamamızın anlayacağı formata çeviren yardımcı fonksiyon
const formatMatches = (apiResponse) => {
    if (!apiResponse || !apiResponse.response || apiResponse.response.length === 0) {
        return [];
    }
    return apiResponse.response.map(item => {
        const { fixture, league, teams, goals } = item;
        const status = fixture.status;
        let time;
        if (['FT', 'AET', 'PEN'].includes(status.short)) time = 'BİTTİ';
        else if (status.short === 'HT') time = 'DEVRE';
        else if (status.short === 'NS') time = new Date(fixture.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        else time = status.elapsed + "'";

        return {
            id: fixture.id,
            leagueId: league.id,
            season: league.season,
            homeId: teams.home.id,
            awayId: teams.away.id,
            homeTeam: teams.home.name,
            awayTeam: teams.away.name,
            homeLogo: teams.home.logo,
            awayLogo: teams.away.logo,
            homeScore: goals.home,
            awayScore: goals.away,
            time: time,
            leagueName: league.name,
            leagueCountry: league.country,
        };
    });
};

exports.handler = async function (event, context) {
    const API_KEY = process.env.API_FOOTBALL_KEY;
    const headers = {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
    };

    try {
        let response = await fetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', { headers });
        let data = await response.json();

        if (data.response && data.response.length > 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    matches: formatMatches(data),
                    isLive: true,
                    message: `Şu an Oynanan Canlı Maçlar (${data.results})`
                }),
            };
        }

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateString = tomorrow.toISOString().slice(0, 10);
        const season = tomorrow.getFullYear();
        
        response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?season=${season}&date=${dateString}`, { headers });
        data = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify({
                matches: formatMatches(data),
                isLive: false,
                message: `Yarının Fikstürü (${dateString})`
            }),
        };

    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message }),
        };
    }
};
