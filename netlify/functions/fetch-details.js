const fetch = require('node-fetch');

const formatOdds = (oddsResponse) => {
    const odds = { match_winner: [], over_under: [], btts: [] };
    if (!oddsResponse || !oddsResponse.response || oddsResponse.response.length === 0) {
        return odds;
    }
    const bookmaker = oddsResponse.response[0].bookmakers.find(b => b.id === 8); // Bet365
    if (!bookmaker) return odds;

    const matchWinnerBet = bookmaker.bets.find(b => b.id === 1);
    if (matchWinnerBet) {
        odds.match_winner.push({ type: 'home_win', label: '1', odd: matchWinnerBet.values.find(v => v.value === 'Home')?.odd || '-' });
        odds.match_winner.push({ type: 'draw', label: 'X', odd: matchWinnerBet.values.find(v => v.value === 'Draw')?.odd || '-' });
        odds.match_winner.push({ type: 'away_win', label: '2', odd: matchWinnerBet.values.find(v => v.value === 'Away')?.odd || '-' });
    }

    const overUnderBet = bookmaker.bets.find(b => b.id === 5); // Goals Over/Under
    if (overUnderBet) {
        odds.over_under = overUnderBet.values.map(v => ({
            type: `${v.value.toLowerCase().replace(' ', '_')}`,
            label: v.value,
            value: parseFloat(v.value.split(' ')[1]),
            odd: v.odd
        }));
    }

    const bttsBet = bookmaker.bets.find(b => b.id === 8); // Both Teams to Score
    if (bttsBet) {
        odds.btts.push({ type: 'btts_yes', label: 'VAR', odd: bttsBet.values.find(v => v.value === 'Yes')?.odd || '-' });
        odds.btts.push({ type: 'btts_no', label: 'YOK', odd: bttsBet.values.find(v => v.value === 'No')?.odd || '-' });
    }
    
    return odds;
};


exports.handler = async function (event, context) {
    const { matchId, leagueId, season } = event.queryStringParameters;
    const API_KEY = process.env.API_FOOTBALL_KEY;
    const finalSeason = season || new Date().getFullYear();

    const headers = {
        'x-rapidapi-host': 'api-football-v1.p.rapidapi.com',
        'x-rapidapi-key': API_KEY,
    };

    try {
        const [eventsRes, standingsRes, oddsRes] = await Promise.all([
            fetch(`https://api-football-v1.p.rapidapi.com/v3/fixtures?id=${matchId}`, { headers }),
            fetch(`https://api-football-v1.p.rapidapi.com/v3/standings?league=${leagueId}&season=${finalSeason}`, { headers }),
            fetch(`https://api-football-v1.p.rapidapi.com/v3/odds?fixture=${matchId}`, { headers })
        ]);

        if (!eventsRes.ok || !standingsRes.ok) {
            throw new Error('Detay verileri çekilirken bir API hatası oluştu.');
        }

        const eventsData = await eventsRes.json();
        const standingsData = await standingsRes.json();
        const oddsData = await oddsRes.json();

        const fixtureData = eventsData.response[0];
        let details = { events: [], stats: [], lineups: [], standings: [], odds: {} };

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
                return { type: hs.type, home: homeVal, away: awayVal, homePercentage: total > 0 ? (homeVal / total) * 100 : 50 };
            }).filter(s => s.home !== null || s.away !== null);
        }

        if (standingsData.response[0] && standingsData.response[0].league && standingsData.response[0].league.standings) {
             details.standings = standingsData.response[0].league.standings[0] || [];
        }
        
        details.odds = formatOdds(oddsData);

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
