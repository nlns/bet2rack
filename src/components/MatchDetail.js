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
            details: { events: [], stats: [], lineups: [], standings: [], odds: {} }, // odds eklendi
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
                this.details = await ApiService.fetchDetails(this.match.id, this.match.leagueId, this.match.season);
            } catch (e) {
                this.detailError = e.message;
            } finally {
                this.isLoadingDetails = false;
            }
        }
    },
    computed: {
        availableBets() {
            const homeScore = parseInt(this.match.homeScore);
            const awayScore = parseInt(this.match.awayScore);
            const totalGoals = isNaN(homeScore) || isNaN(awayScore) ? -1 : homeScore + awayScore;

            // Odds verisinden yararlanarak bahisleri ve oranları birleştir
            const odds = this.details.odds || {};

            const matchWinnerOptions = (odds.match_winner || []).map(bet => ({
                type: bet.type,
                label: bet.label,
                odd: bet.odd
            }));

            const overUnderOptions = (odds.over_under || [])
                .filter(bet => totalGoals === -1 || bet.value > totalGoals)
                .map(bet => ({
                    type: bet.type,
                    label: bet.label,
                    odd: bet.odd
                }));

            const bttsOptions = (odds.btts || []).map(bet => ({
                type: bet.type,
                label: bet.label,
                odd: bet.odd
            }));

            return [
                { name: 'Maç Sonucu', options: matchWinnerOptions },
                { name: 'Toplam Gol', options: overUnderOptions },
                { name: 'Karşılıklı Gol', options: bttsOptions }
            ];
        },
        formattedTrackedBet() {
            const allBetOptions = this.availableBets.flatMap(c => c.options);
            const bet = allBetOptions.find(b => b.type === this.match.trackedBet);
            return bet ? bet.label : 'Bilinmeyen Bahis';
        }
    },
    mounted() {
        this.fetchDetails();
    },
    template: `
        <div class="flex flex-col h-full">
            <div class="text-center py-4 bg-white rounded-lg shadow-md mb-4">
                <div class="text-sm text-gray-500 mb-2">{{ match.leagueName }}</div>
                <div class="flex justify-around items-center mb-2 px-2">
                    <div class="flex flex-col items-center w-1/3 text-center">
                        <img :src="match.homeLogo" class="w-12 h-12 mb-1" alt="home logo" @error.once="$event.target.style.display='none'"/>
                        <span class="font-bold text-lg">{{ match.homeTeam }}</span>
                    </div>
                    <span class="font-bold text-4xl mx-4">{{ match.homeScore }} - {{ match.awayScore }}</span>
                    <div class="flex flex-col items-center w-1/3 text-center">
                        <img :src="match.awayLogo" class="w-12 h-12 mb-1" alt="away logo" @error.once="$event.target.style.display='none'"/>
                        <span class="font-bold text-lg">{{ match.awayTeam }}</span>
                    </div>
                </div>
                <div class="text-lg font-bold text-red-600">{{ match.time }}</div>
            </div>
            <div class="flex-grow bg-white rounded-lg shadow-md">
                <div class="flex border-b border-gray-200 overflow-x-auto">
                     <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key" :class="activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'" class="flex-shrink-0 px-4 py-3 font-semibold border-b-2 transition-colors duration-200 text-sm">{{ tab.label }}</button>
                </div>
                <div class="p-4">
                    <div v-if="isLoadingDetails && activeTab !== 'bet2rack'" class="text-center py-8 text-gray-500">Detaylar yükleniyor...</div>
                    <div v-if="!isLoadingDetails && detailError" class="text-center py-8 text-red-500">{{ detailError }}</div>
                    
                    <transition name="tab-content" mode="out-in">
                        <div :key="activeTab">
                            <div v-if="activeTab === 'bet2rack'">
                                <div v-if="match.betStatus !== 'default' && match.betStatus !== 'tracking'" class="text-center p-4 mb-4 rounded-lg" :class="{'bg-green-50 text-green-800': match.betStatus === 'won', 'bg-gray-100 text-gray-800': match.betStatus === 'lost'}">
                                    <p>Bu maça oynadığınız <strong class="font-bold">{{ formattedTrackedBet }}</strong> bahsi <strong class="font-bold">{{ match.betStatus === 'won' ? 'KAZANDI' : 'KAYBETTİ' }}</strong>.</p>
                                </div>
                                <div v-else-if="match.betStatus === 'tracking'" class="text-center p-4 mb-4 rounded-lg bg-blue-50 text-blue-800">
                                    <p>Bu maçı <strong class="font-bold">{{ formattedTrackedBet }}</strong> bahsiyle takip ediyorsunuz.</p>
                                </div>
                                
                                <div class="space-y-4">
                                    <div v-for="category in availableBets" :key="category.name">
                                         <div v-if="category.options.length > 0">
                                            <h3 class="font-semibold text-gray-500 uppercase mb-2 text-sm">{{ category.name }}</h3>
                                            <!-- Taraf Bahsi için özel 3'lü grid -->
                                            <div v-if="category.name === 'Maç Sonucu'" class="grid grid-cols-3 gap-2">
                                                <button v-for="bet in category.options" :key="bet.type" @click="selectedBet = bet.type" class="bet-option p-4 rounded-lg border-2 flex flex-col items-center justify-center" :class="selectedBet === bet.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'">
                                                    <span class="font-semibold text-gray-600">{{ bet.label }}</span>
                                                    <span class="font-bold text-lg text-blue-700 mt-1">{{ bet.odd }}</span>
                                                </button>
                                            </div>
                                            <!-- Diğer bahisler için liste görünümü -->
                                            <div v-else class="space-y-2">
                                                <button v-for="bet in category.options" :key="bet.type" @click="selectedBet = bet.type" class="bet-option w-full text-left p-4 rounded-lg border-2 flex justify-between items-center" :class="selectedBet === bet.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'">
                                                    <span class="font-semibold">{{ bet.label }}</span>
                                                    <span class="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">{{ bet.odd }}</span>
                                                </button>
                                            </div>
                                        </div>
                                    </template>
                                     <p v-if="availableBets.every(c => c.options.length === 0)" class="text-center text-gray-400 py-4">Bu maç için oran bilgisi bulunmamaktadır.</p>
                                </div>
                                <div class="mt-6">
                                     <button @click="$emit('track-bet', selectedBet)" :disabled="!selectedBet"
                                             class="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                                         {{ match.betStatus !== 'default' ? 'BAHSİ GÜNCELLE' : 'BU BAHSİ TAKİP ET' }}
                                     </button>
                                </div>
                            </div>
                            <!-- Diğer sekmelerin içerikleri öncekiyle aynı -->
                            <div v-if="activeTab === 'summary'"><!-- ... --></div>
                            <div v-if="activeTab === 'stats'"><!-- ... --></div>
                            <div v-if="activeTab === 'lineups'"><!-- ... --></div>
                            <div v-if="activeTab === 'standings'"><!-- ... --></div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    `
};