import ApiService from '../services/api.js';

export default {
    props: ['match'],
    emits: ['track-bet'],
    data() {
        return {
            isLoadingDetails: true,
            detailError: null,
            activeTab: 'bet2rack',
            activeBettingTab: 'Maç Sonucu', // YENİ: BET2RACK için iç sekme
            selectedBet: this.match.trackedBet,
            details: { events: [], stats: [], lineups: [], standings: [], odds: {} }, 
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
            const odds = this.details.odds || {};

            const matchWinnerOptions = odds.match_winner ? odds.match_winner.map(bet => ({ type: bet.type, label: bet.label, odd: bet.odd })) : [{type: 'home_win', label: '1'}, {type: 'draw', label: 'X'}, {type: 'away_win', label: '2'}];
            const bttsOptions = odds.btts ? odds.btts.map(bet => ({ type: bet.type, label: bet.label, odd: bet.odd })) : [{type: 'btts_yes', label: 'VAR'}, {type: 'btts_no', label: 'YOK'}];
            
            let overUnderOptions = [];
            if (odds.over_under) {
                 overUnderOptions = odds.over_under.filter(bet => totalGoals === -1 || bet.value > totalGoals).map(bet => ({ type: bet.type, label: bet.label, odd: bet.odd }));
            } else {
                 const defaultOverUnder = [0.5, 1.5, 2.5, 3.5, 4.5];
                 defaultOverUnder.forEach(val => {
                     if(totalGoals === -1 || val > totalGoals) {
                         overUnderOptions.push({type: `over_${val}`, label: `${val} Üst`});
                         overUnderOptions.push({type: `under_${val}`, label: `${val} Alt`});
                     }
                 });
            }

            return [
                { name: 'Maç Sonucu', options: matchWinnerOptions },
                { name: 'Toplam Gol', options: overUnderOptions },
                { name: 'Karşılıklı Gol', options: bttsOptions },
                { name: 'Toplam Korner', options: [{type: 'corner_over_8.5', label: '8.5 Korner Üst'}, {type: 'corner_under_8.5', label: '8.5 Korner Alt'}] }
            ];
        },
        formattedTrackedBet() {
            const allBetOptions = this.availableBets.flatMap(c => c.options);
            const bet = allBetOptions.find(b => b.type === this.match.trackedBet);
            return bet ? bet.label : 'Bilinmeyen Bahis';
        },
        bettingTabs() {
            return this.availableBets.filter(cat => cat.options.length > 0);
        }
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
                
                <div v-if="activeTab === 'bet2rack'" class="p-4">
                    <!-- YENİ: Alt Sekme Grubu -->
                    <div class="flex items-center border-b border-gray-200 mb-4">
                        <button v-for="betTab in bettingTabs" :key="betTab.name" @click="activeBettingTab = betTab.name"
                                :class="activeBettingTab === betTab.name ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'"
                                class="px-3 py-2 text-sm font-medium border-b-2">
                            {{ betTab.name }}
                        </button>
                    </div>

                    <div v-if="match.betStatus !== 'default' && match.betStatus !== 'tracking'" class="text-center p-4 mb-4 rounded-lg" :class="{'bg-green-50 text-green-800': match.betStatus === 'won', 'bg-red-50 text-red-800': match.betStatus === 'lost', 'bg-yellow-50 text-yellow-800': match.betStatus === 'tracking'}">
                        <p>Bu maça oynadığınız <strong class="font-bold">{{ formattedTrackedBet }}</strong> bahsi <strong class="font-bold">{{ match.betStatus === 'won' ? 'KAZANDI' : (match.betStatus === 'lost' ? 'KAYBETTİ' : 'BEKLİYOR') }}</strong>.</p>
                    </div>
                    
                    <div v-for="category in bettingTabs" v-show="activeBettingTab === category.name">
                        <div v-if="category.name === 'Maç Sonucu'" class="grid grid-cols-3 gap-2">
                            <button v-for="bet in category.options" @click="selectedBet = bet.type" class="bet-option p-4 rounded-lg border-2 flex flex-col items-center justify-center" :class="selectedBet === bet.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'">
                                <span class="font-semibold text-gray-600">{{ bet.label }}</span>
                                <span v-if="bet.odd" class="font-bold text-lg text-blue-700 mt-1">{{ bet.odd }}</span>
                            </button>
                        </div>
                        <div v-else class="space-y-2">
                            <button v-for="bet in category.options" @click="selectedBet = bet.type" class="bet-option w-full text-left p-4 rounded-lg border-2 flex justify-between items-center" :class="selectedBet === bet.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'">
                                <span class="font-semibold">{{ bet.label }}</span>
                                <span v-if="bet.odd" class="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-sm">{{ bet.odd }}</span>
                            </button>
                        </div>
                    </div>
                     <div class="mt-6">
                         <button @click="$emit('track-bet', selectedBet)" :disabled="!selectedBet"
                                 class="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                             {{ match.betStatus !== 'default' ? 'BAHSİ GÜNCELLE' : 'BU BAHSİ TAKİP ET' }}
                         </button>
                    </div>
                </div>

                <div v-else class="p-4">
                    <div v-if="isLoadingDetails" class="text-center py-8 text-gray-500">Detaylar yükleniyor...</div>
                    <div v-if="!isLoadingDetails && detailError" class="text-center py-8 text-red-500">{{ detailError }}</div>
                    <transition name="tab-content" mode="out-in">
                        <div :key="activeTab">
                            <div v-if="activeTab === 'summary'"><!-- Özet içeriği --></div>
                            <div v-if="activeTab === 'stats'"><!-- İstatistik içeriği --></div>
                            <div v-if="activeTab === 'lineups'"><!-- Kadro içeriği --></div>
                            <div v-if="activeTab === 'standings'"><!-- Puan durumu içeriği --></div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    `
};
