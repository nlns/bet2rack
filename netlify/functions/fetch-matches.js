const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const { date } = event.queryStringParameters;
    const API_KEY = process.env.API_FOOTBALL_KEY;
    // YENİ: Sezon bilgisi artık dinamik olarak tarihten alınıyor
    const season = new Date(date).getFullYear();

    // API'ye tek ve genel bir istek yapıyoruz
    const url = `https://api-football-v1.p.rapidapi.com/v3/fixtures?season=${season}&date=${date}`;

    const headers = {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
    };

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
             return {
                statusCode: response.status,
                body: JSON.stringify({ error: `API Hatası: ${response.statusText}` }),
            };
        }

        const data = await response.json();
        
        if (data.errors && Object.keys(data.errors).length > 0) {
            // API'den gelen spesifik hata mesajını göster
            const errorMessage = data.errors.requests || JSON.stringify(data.errors);
            throw new Error(`API tarafından hata bildirildi: ${errorMessage}`);
        }

        const formattedMatches = data.response.map(item => {
            const status = item.fixture.status;
            let time;
            if (status.short === 'FT' || status.short === 'AET' || status.short === 'PEN') time = 'BİTTİ';
            else if (status.short === 'HT') time = 'DEVRE';
            else if (status.short === 'NS') time = new Date(item.fixture.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
            else time = status.elapsed + "'";

            return {
                id: item.fixture.id, 
                leagueId: item.league.id,
                // YENİ: Sezon bilgisi de frontend'e gönderiliyor
                season: item.league.season,
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


