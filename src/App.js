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
            loading: true, error: null, 
            leagues: { top: [], other: [] },
            selectedDate: '2023-05-28', 
            trackedBets: {}, 
            refreshInterval: null,
            topLeagueIds: [203, 39, 140, 78, 135, 61], // TR, EN, ES, DE, IT, FR
            sharedState: state
        }
    },
    computed: {
        currentView() {
            return this.sharedState.currentView;
        },
        selectedMatch() {
            return this.sharedState.selectedMatch;
        }
    },
    methods: {
        async fetchMatches(isRefresh = false) {
            if (!isRefresh) this.loading = true;
            this.error = null;
            try {
                const data = await ApiService.fetchMatches(this.selectedDate);
                // ... Geri kalan fetchMatches mantığı öncekiyle aynı
            } catch (e) {
                this.error = e.message;
            } finally {
                if (!isRefresh) this.loading = false;
            }
        },
        checkBetResult(match, trackedBetType) { /* ... öncekiyle aynı ... */ },
        showDetailView(match) { this.sharedState.showDetailView(match); },
        showListView() { this.sharedState.showListView(); this.fetchMatches(true); },
        trackBet(betType) { /* ... öncekiyle aynı ... */ },
        saveTrackedBets() { /* ... öncekiyle aynı ... */ },
        loadTrackedBets() { /* ... öncekiyle aynı ... */ },
        startAutoRefresh() { /* ... öncekiyle aynı ... */ },
        stopAutoRefresh() { /* ... öncekiyle aynı ... */ }
    },
    watch: { 
        selectedDate() { this.fetchMatches(); }
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
                    <input type="date" v-model="selectedDate" class="bg-gray-100 border-gray-200 border-2 rounded-md p-1.5 text-sm font-semibold text-gray-600 focus:ring-blue-500 focus:border-blue-500">
                </div>
            </div>
        </header>

        <main class="container mx-auto p-4">
            <div v-if="loading" class="text-center py-16"><p class="text-gray-500 font-semibold">Maçlar yükleniyor...</p></div>
            <div v-if="!loading && error" class="text-center py-16 px-4"><p class="text-red-500 font-semibold">{{ error }}</p></div>

            <transition name="fade" mode="out-in">
                <div v-if="currentView === 'list' && !loading && !error" key="list-view">
                    <div v-if="leagues.top.length > 0">
                        <h2 class="text-lg font-bold text-blue-600 mb-2 border-b-2 border-blue-200 pb-1">Popüler Ligler</h2>
                        <league-group v-for="league in leagues.top" :key="league.name" :league-name="league.name" :matches="league.matches" @match-selected="showDetailView"></league-group>
                    </div>
                    <div v-if="leagues.other.length > 0" class="mt-8">
                        <h2 class="text-lg font-bold text-gray-700 mb-2 border-b-2 border-gray-300 pb-1">Diğer Ligler</h2>
                        <league-group v-for="league in leagues.other" :key="league.name" :league-name="league.name" :matches="league.matches" @match-selected="showDetailView"></league-group>
                    </div>
                    <p v-if="!leagues.top.length && !leagues.other.length" class="text-center text-gray-500 py-16">Seçilen tarih için gösterilecek maç bulunamadı.</p>
                </div>
                <match-detail v-else-if="currentView === 'detail'" key="detail-view" :match="selectedMatch" @track-bet="trackBet"></match-detail>
            </transition>
        </main>
    `
};

