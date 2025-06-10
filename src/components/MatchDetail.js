import ApiService from '../services/api.js';

export default {
    props: ['match'],
    emits: ['track-bet'],
    data() {
        return {
            isLoadingDetails: true,
            detailError: null,
            activeTab: 'bet2rack',
            selectedBet: this.match.trackedBet,
            details: { events: [], stats: [], lineups: [], standings: [] },
            tabs: [
                { key: 'bet2rack', label: 'BET2RACK' },
                { key: 'summary', label: 'ÖZET' },
                { key: 'stats', label: 'İSTATİSTİKLER' },
                { key: 'lineups', label: 'KADROLAR' },
                { key: 'standings', label: 'PUAN DURUMU' }
            ]
        }
    },
    methods: {
        async fetchDetails() {
            this.isLoadingDetails = true;
            this.detailError = null;
            try {
                this.details = await ApiService.fetchDetails(this.match.id, this.match.leagueId);
            } catch (e) {
                this.detailError = e.message;
            } finally {
                this.isLoadingDetails = false;
            }
        }
    },
    computed: {
        availableBets() { /* ... öncekiyle aynı ... */ },
        formattedTrackedBet() { /* ... öncekiyle aynı ... */ }
    },
    mounted() {
        this.fetchDetails();
    },
    template: `
        <div class="flex flex-col h-full">
            <div class="text-center py-4 bg-white rounded-lg shadow-md mb-4"><!-- ... Skor alanı ... --></div>
            <div class="flex-grow bg-white rounded-lg shadow-md">
                <div class="flex border-b border-gray-200 overflow-x-auto">
                     <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" :class="activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="flex-shrink-0 px-4 py-3 font-semibold border-b-2 transition-colors duration-200 text-sm">{{ tab.label }}</button>
                </div>
                <div class="p-4"><!-- ... Sekme içerikleri ... --></div>
            </div>
        </div>
    `
};