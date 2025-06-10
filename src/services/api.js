const ApiService = {
    async fetchMatches(date) {
        const response = await fetch(`/.netlify/functions/fetch-matches?date=${date}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Sunucu Hatası: ${response.status}`);
        }
        return await response.json();
    },

    async fetchDetails(matchId, leagueId) {
        const response = await fetch(`/.netlify/functions/fetch-details?matchId=${matchId}&leagueId=${leagueId}`);
        if (!response.ok) {
            throw new Error('Detay verileri çekilemedi.');
        }
        return await response.json();
    }
};

export default ApiService;