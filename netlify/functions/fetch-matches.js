const fetch = require('node-fetch');

// API'den gelen isteklere gecikme eklemek için yardımcı fonksiyon
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

exports.handler = async function (event, context) {
    const { date } = event.queryStringParameters;
    const API_KEY = process.env.API_FOOTBALL_KEY;
    const season = 2023;

    // Sorgulanacak popüler liglerin ID'leri
    const leagueIds = [
        203, // Turkey - Süper Lig
        39,  // England - Premier League
        140, // Spain - La Liga
        78,  // Germany - Bundesliga
        135, // Italy - Serie A
        61,  // France - Ligue 1
        2,   // UEFA - Champions League
        88,  // Netherlands - Eredivisie
        94,  // Portugal - Primeira Liga
        207  // Belgium - Jupiler Pro League
    ]; 

    const headers = {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
    };
    
    let allMatches = [];

    // Promise.all yerine, API'ye yük bindirmemek için sıralı istek yapıyoruz.
    for (const leagueId of leagueIds) {
        try {
            const response = await fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?league=${leagueId}&season=${season}&date=${date}`, { headers });
            
            if (response.ok) {
                const data = await response.json();
                if (data.response) {
                    allMatches = allMatches.concat(data.response);
                }
            } else {
                console.warn(`Lig ${leagueId} için API isteği başarısız oldu: ${response.statusText}`);
            }

            // API rate limit'e takılmamak için her istek arasına küçük bir gecikme ekliyoruz.
            await delay(200);

        } catch (error) {
            console.error(`Lig ${leagueId} için istekte ciddi bir hata oluştu:`, error);
        }
    }

    try {
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
