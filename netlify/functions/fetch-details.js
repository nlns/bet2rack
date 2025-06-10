const fetch = require('node-fetch');

exports.handler = async function (event, context) {
    const { matchId, leagueId, season } = event.queryStringParameters;
    const API_KEY = process.env.API_FOOTBALL_KEY;
    
    // YENİ: Sezon bilgisi artık dinamik olarak alınıyor
    const finalSeason = season || new Date().getFullYear();

    const headers = {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
    };

    try {
        const [eventsRes, standingsRes] = await Promise.all([
            fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${matchId}`, { headers }),
            fetch(`https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${finalSeason}`, { headers }),
        ]);

        if (!eventsRes.ok || !standingsRes.ok) {
            throw new Error('Detay verileri çekilirken bir API hatası oluştu.');
        }

        const eventsData = await eventsRes.json();
        const standingsData = await standingsRes.json();

        const fixtureData = eventsData.response[0];
        let details = { events: [], stats: [], lineups: [], standings: [] };

        if (fixtureData) {
            details.events = fixtureData.events;
            details.lineups = fixtureData.lineups;
            const homeStats = fixtureData.statistics.find(s => s.team.id === fixtureData.teams.home.id)?.statistics || [];
            const awayStats = fixtureData.statistics.find(s => s.team.id === fixtureData.teams.away.id)?.statistics || [];
            
            details.stats = homeStats.map(hs => {
                const as = awayStats.find(s => s.type === hs.type);
                const homeVal = hs.value || 0;
                const awayVal = as?.value || 0;
                const total = (typeof homeVal === 'number' && typeof awayVal === 'number') ? (homeVal + awayVal) : 1;
                return {
                    type: hs.type, home: homeVal, away: awayVal,
                    homePercentage: total > 0 ? (homeVal / total) * 100 : 50
                };
            }).filter(s => s.home !== null || s.away !== null);
        }

        // Puan durumu verisi bazen boş gelebilir, bunu kontrol ediyoruz.
        if (standingsData.response[0] && standingsData.response[0].league && standingsData.response[0].league.standings) {
             details.standings = standingsData.response[0].league.standings[0] || [];
        }

        return {
            statusCode: 200,
            body: JSON.stringify(details),
        };

    } catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: e.message }),
        };
    }
};
