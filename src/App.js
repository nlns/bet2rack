import { state } from './services/state.js';
import ApiService from './services/api.js';
import LeagueGroupComponent from './components/LeagueGroup.js';
import MatchDetailComponent from './components/MatchDetail.js';

export default {
    components: {
        'league-group': LeagueGroupComponent,
        'match-detail': MatchDetailComponent
    },
    data() {
        return {
            loading: true, 
            error: null, 
            matchesData: { leagues: [], isLive: false, message: '' },
            trackedBets: {}, 
            refreshInterval: null,
            topLeagueIds: [203, 39, 140, 78, 135, 61],
            sharedState: state
        }
    },
    computed: {
        currentView() { return this.sharedState.currentView; },
        selectedMatch() { return this.sharedState.selectedMatch; },
        topLeagues() {
            return this.matchesData.leagues.filter(l => this.topLeagueIds.includes(l.matches[0]?.leagueId));
        },
        otherLeagues() {
            return this.matchesData.leagues.filter(l => !this.topLeagueIds.includes(l.matches[0]?.leagueId));
        }
    },
    methods: {
        async fetchMatches(isRefresh = false) {
            if (!isRefresh) this.loading = true;
            this.error = null;
            try {
                const data = await ApiService.fetchMatches();
                
                const formattedMatches = data.matches.map(item => {
                    let trackedInfo = this.trackedBets[item.id];
                    if (item.time === 'BİTTİ' && trackedInfo && trackedInfo.betStatus === 'tracking') {
                        trackedInfo.betStatus = this.checkBetResult(item, trackedInfo.trackedBet);
                    }
                    return { ...item, betStatus: trackedInfo ? trackedInfo.betStatus : 'default', trackedBet: trackedInfo ? trackedInfo.trackedBet : null, };
                });
                
                const grouped = formattedMatches.reduce((acc, match) => {
                    const leagueName = `${match.leagueCountry} - ${match.leagueName}`;
                    (acc[leagueName] = acc[leagueName] || []).push(match);
                    return acc;
                }, {});

                this.matchesData.leagues = Object.entries(grouped).map(([name, matches]) => ({name, matches}));
                this.matchesData.isLive = data.isLive;
                this.matchesData.message = data.message;
                
                this.saveTrackedBets();
            } catch (e) {
                this.error = e.message;
            } finally {
                if (!isRefresh) this.loading = false;
            }
        },
        checkBetResult(match, trackedBetType) {
            const hs = parseInt(match.homeScore); const as = parseInt(match.awayScore);
            if(isNaN(hs) || isNaN(as)) return 'lost';
            const totalGoals = hs + as;
            switch(trackedBetType) {
                case 'home_win': return hs > as ? 'won' : 'lost';
                case 'away_win': return as > hs ? 'won' : 'lost';
                case 'draw': return hs === as ? 'won' : 'lost';
                case 'btts_yes': return hs > 0 && as > 0 ? 'won' : 'lost';
                case 'btts_no': return hs === 0 || as === 0 ? 'won' : 'lost';
                default:
                    if (trackedBetType.startsWith('over_')) { const value = parseFloat(trackedBetType.split('_')[1]); return totalGoals > value ? 'won' : 'lost'; }
                    if (trackedBetType.startsWith('under_')) { const value = parseFloat(trackedBetType.split('_')[1]); return totalGoals < value ? 'won' : 'lost'; }
                    return 'lost';
            }
        },
        showDetailView(match) { this.sharedState.showDetailView(match); },
        showListView() { this.sharedState.showListView(); this.fetchMatches(true); },
        trackBet(betType) {
             if (this.selectedMatch) {
                const allLeagues = [...this.matchesData.top, ...this.matchesData.other];
                const matchToUpdate = allLeagues.flatMap(l => l.matches).find(m => m.id === this.selectedMatch.id);
                if (matchToUpdate) {
                    matchToUpdate.betStatus = 'tracking';
                    matchToUpdate.trackedBet = betType;
                    this.trackedBets[matchToUpdate.id] = { betStatus: 'tracking', trackedBet: betType };
                    this.saveTrackedBets();
                }
                this.showListView();
            }
        },
        saveTrackedBets() { localStorage.setItem('bet2rack_tracked_bets', JSON.stringify(this.trackedBets)); },
        loadTrackedBets() {
            const savedBets = localStorage.getItem('bet2rack_tracked_bets');
            if (savedBets) { this.trackedBets = JSON.parse(savedBets); }
        },
        startAutoRefresh() {
            this.stopAutoRefresh();
            this.refreshInterval = setInterval(() => this.fetchMatches(true), 60000);
        },
        stopAutoRefresh() {
            if (this.refreshInterval) clearInterval(this.refreshInterval);
        }
    },
    mounted() { 
        this.loadTrackedBets(); 
        this.fetchMatches();
        this.startAutoRefresh();
    },
    beforeUnmount() {
        this.stopAutoRefresh();
    },
    template: `
        <header class="bg-white shadow-sm sticky top-0 z-10">
            <div class="container mx-auto px-4 py-3 flex justify-between items-center relative">
                <div class="w-1/3">
                    <button v-if="currentView === 'detail'" @click="showListView" class="text-gray-500 hover:text-blue-600 z-20">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                </div>
                <div class="w-1/3 text-center">
                    <h1 class="text-2xl font-bold text-gray-900">Be<span class="text-blue-600">t<sup>2</sup></span>rack</h1>
                </div>
                <div class="w-1/3 flex justify-end items-center gap-x-2 z-20">
                     <button @click="fetchMatches()" class="text-gray-500 hover:text-blue-600" :disabled="loading">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" :class="{ 'animate-spin': loading }" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h5M20 20v-5h-5M4 4l5 5M20 20l-5-5" /></svg>
                    </button>
                </div>
            </div>
        </header>

        <main class="container mx-auto p-4">
            <div v-if="loading" class="text-center py-16"><p class="text-gray-500 font-semibold">Maçlar yükleniyor...</p></div>
            <div v-if="!loading && error" class="text-center py-16 px-4"><p class="text-red-500 font-semibold">{{ error }}</p></div>

            <transition name="fade" mode="out-in">
                <div v-if="currentView === 'list' && !loading && !error" key="list-view">
                    <div class="text-center mb-4 text-lg font-semibold text-gray-700">{{ matchesData.message }}</div>
                    <div v-if="topLeagues.length > 0">
                        <h2 class="text-lg font-bold text-blue-600 mb-2 border-b-2 border-blue-200 pb-1">Popüler Ligler</h2>
                        <league-group v-for="league in topLeagues" :key="league.name" :league-name="league.name" :matches="league.matches" @match-selected="showDetailView" :is-live="matchesData.isLive"></league-group>
                    </div>
                    <div v-if="otherLeagues.length > 0" class="mt-8">
                        <h2 class="text-lg font-bold text-gray-700 mb-2 border-b-2 border-gray-300 pb-1">Diğer Ligler</h2>
                        <league-group v-for="league in otherLeagues" :key="league.name" :league-name="league.name" :matches="league.matches" @match-selected="showDetailView" :is-live="matchesData.isLive"></league-group>
                    </div>
                    <p v-if="!topLeagues.length && !otherLeagues.length" class="text-center text-gray-500 py-16">Gösterilecek maç bulunamadı.</p>
                </div>
                <match-detail v-else-if="currentView === 'detail'" key="detail-view" :match="selectedMatch" @track-bet="trackBet"></match-detail>
            </transition>
        </main>
    `
};