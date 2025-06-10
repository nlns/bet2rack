const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const { date } = event.queryStringParameters;
    const API_KEY = process.env.API_FOOTBALL_KEY;
    const season = 2023;

    // Sorgulanacak popüler liglerin ID'leri
    const leagueIds = [203, 39, 140, 78, 135, 61]; 

    const headers = {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
    };

    // Her lig için ayrı bir API isteği oluşturuyoruz
    const requests = leagueIds.map(leagueId => 
        fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=${season}&date=${date}`, { headers })
    );

    try {
        const responses = await Promise.all(requests);
        let allMatches = [];

        for (const response of responses) {
            if (response.ok) {
                const data = await response.json();
                if (data.response) {
                    allMatches = allMatches.concat(data.response);
                }
            } else {
                console.warn(`Bir lig için API isteği başarısız oldu: ${response.statusText}`);
            }
        }
        
        const formattedMatches = allMatches.map(item => {
            const status = item.fixture.status;
            let time;
            if (status.short === 'FT' || status.short === 'AET' || status.short === 'PEN') time = 'BİTTİ';
            else if (status.short === 'HT') time = 'DEVRE';
            else if (status.short === 'NS') time = new Date(item.fixture.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            else time = status.elapsed + "'";

            return {
                id: item.fixture.id, leagueId: item.league.id,
                homeId: item.teams.home.id, awayId: item.teams.away.id,
                homeTeam: item.teams.home.name, awayTeam: item.teams.away.name,
                homeLogo: item.teams.home.logo, awayLogo: item.teams.away.logo,
                homeScore: item.goals.home !== null ? item.goals.home : '-',
                awayScore: item.goals.away !== null ? item.goals.away : '-',
                time: time,
                leagueName: item.league.name,
                leagueCountry: item.league.country,
            };
        });

        return {
            statusCode: 200,
            body: JSON.stringify(formattedMatches),
        };

    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message }),
        };
    }
};