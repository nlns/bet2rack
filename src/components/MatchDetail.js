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
            const homeScore = parseInt(this.match.homeScore); const awayScore = parseInt(this.match.awayScore); const allTotalBets = [ { value: 0.5, type: 'over_0.5', label: '0.5 Gol Üst' }, { value: 0.5, type: 'under_0.5', label: '0.5 Gol Alt' }, { value: 1.5, type: 'over_1.5', label: '1.5 Gol Üst' }, { value: 1.5, type: 'under_1.5', label: '1.5 Gol Alt' }, { value: 2.5, type: 'over_2.5', label: '2.5 Gol Üst' }, { value: 2.5, type: 'under_2.5', label: '2.5 Gol Alt' }, { value: 3.5, type: 'over_3.5', label: '3.5 Gol Üst' }, { value: 3.5, type: 'under_3.5', label: '3.5 Gol Alt' }, { value: 4.5, type: 'over_4.5', label: '4.5 Gol Üst' }, { value: 4.5, type: 'under_4.5', label: '4.5 Gol Alt' }, ]; let filteredTotalBets; if (!isNaN(homeScore) && !isNaN(awayScore)) { const totalGoals = homeScore + awayScore; filteredTotalBets = allTotalBets.filter(bet => bet.value > totalGoals); } else { filteredTotalBets = allTotalBets; } return [ { name: 'Taraf Bahsi', options: [{ type: 'home_win', label: '1 (Ev Sahibi Kazanır)' }, { type: 'draw', label: 'X (Beraberlik)' }, { type: 'away_win', label: '2 (Deplasman Kazanır)' }] }, { name: 'Toplam Gol', options: filteredTotalBets }, { name: 'Karşılıklı Gol', options: [{ type: 'btts_yes', label: 'VAR' }, { type: 'btts_no', label: 'YOK' }] }, { name: 'Toplam Korner', options: [{ type: 'corner_over_8.5', label: '8.5 Korner Üst' }, { type: 'corner_under_8.5', label: '8.5 Korner Alt' }] } ];
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
                                <div class="space-y-3">
                                    <template v-for="category in availableBets">
                                         <div v-if="category.options.length > 0">
                                            <h3 class="font-semibold text-gray-500 uppercase mb-2 text-sm">{{ category.name }}</h3>
                                            <button v-for="bet in category.options" :key="bet.type" @click="selectedBet = bet.type" 
                                                    class="bet-option w-full text-left p-4 rounded-lg border-2"
                                                    :class="selectedBet === bet.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'">
                                                <span class="font-semibold">{{ bet.label }}</span>
                                            </button>
                                        </div>
                                    </template>
                                </div>
                                <div class="mt-6">
                                     <button @click="$emit('track-bet', selectedBet)" :disabled="!selectedBet"
                                             class="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                                         {{ match.betStatus !== 'default' ? 'BAHSİ GÜNCELLE' : 'BU BAHSİ TAKİP ET' }}
                                     </button>
                                </div>
                            </div>
                            <div v-if="activeTab === 'summary'" class="space-y-4">
                                <div v-for="event in details.events" class="flex items-center text-sm">
                                    <span class="w-12 text-center font-bold">{{ event.time.elapsed }}'</span>
                                    <div class="flex items-center">
                                        <img v-if="event.type === 'Goal' || event.type === 'Card'" :src="event.team.logo" class="w-4 h-4 mr-2" @error.once="$event.target.style.display='none'"/>
                                        <span v-if="event.type === 'Goal'" class="text-2xl mr-2">⚽</span>
                                        <span v-if="event.type === 'Card' && event.detail === 'Yellow Card'" class="w-3 h-4 bg-yellow-400 rounded-sm mr-2"></span>
                                        <span v-if="event.type === 'Card' && event.detail === 'Red Card'" class="w-3 h-4 bg-red-500 rounded-sm mr-2"></span>
                                        <div>
                                            <p class="font-semibold">{{ event.player.name }}</p>
                                            <p class="text-xs text-gray-500">{{ event.detail }}</p>
                                        </div>
                                    </div>
                                </div>
                                <p v-if="!details.events || details.events.length === 0" class="text-center text-gray-400 py-4">Maçta önemli bir olay kaydedilmedi.</p>
                            </div>
                            <div v-if="activeTab === 'stats'" class="space-y-3">
                                <div v-for="stat in details.stats" class="text-sm">
                                    <div class="flex justify-between items-center mb-1">
                                        <span class="font-semibold">{{ stat.home }}</span>
                                        <span class="text-gray-500 font-bold">{{ stat.type }}</span>
                                        <span class="font-semibold">{{ stat.away }}</span>
                                    </div>
                                    <div class="flex items-center">
                                        <div class="bg-gray-200 h-2 w-full rounded-full" :class="{'bg-blue-200': stat.home > stat.away}">
                                            <div class="bg-blue-500 h-2 rounded-full" :style="{ width: stat.homePercentage + '%' }"></div>
                                        </div>
                                    </div>
                                </div>
                                 <p v-if="!details.stats || details.stats.length === 0" class="text-center text-gray-400 py-4">İstatistik verisi bulunamadı.</p>
                            </div>
                            <div v-if="activeTab === 'lineups'" class="grid grid-cols-2 gap-4 text-sm">
                                <div v-for="team in details.lineups" :key="team.team.id">
                                    <h4 class="font-bold mb-2">{{ team.team.name }} <span class="text-xs text-gray-500">({{team.formation}})</span></h4>
                                    <p class="font-semibold text-xs mb-1">İlk 11</p>
                                    <ul><li v-for="player in team.startXI">{{ player.player.name }}</li></ul>
                                    <p class="font-semibold text-xs mt-3 mb-1">Yedekler</p>
                                    <ul><li v-for="player in team.substitutes">{{ player.player.name }}</li></ul>
                                </div>
                                <p v-if="!details.lineups || details.lineups.length === 0" class="col-span-2 text-center text-gray-400 py-4">Kadro verisi bulunamadı.</p>
                            </div>
                            <div v-if="activeTab === 'standings'" class="overflow-x-auto">
                               <table class="w-full text-left text-xs">
                                    <thead><tr class="text-gray-500"><th class="p-2">#</th><th class="p-2">Takım</th><th class="p-2">O</th><th class="p-2">G</th><th class="p-2">B</th><th class="p-2">M</th><th class="p-2">P</th></tr></thead>
                                    <tbody>
                                        <tr v-for="t in details.standings" :class="{'bg-blue-50 font-bold': t.team.id === match.homeId || t.team.id === match.awayId}">
                                            <td class="p-2">{{ t.rank }}</td>
                                            <td class="p-2">{{ t.team.name }}</td>
                                            <td class="p-2">{{ t.all.played }}</td>
                                            <td class="p-2">{{ t.all.win }}</td>
                                            <td class="p-2">{{ t.all.draw }}</td>
                                            <td class="p-2">{{ t.all.lose }}</td>
                                            <td class="p-2">{{ t.points }}</td>
                                        </tr>
                                    </tbody>
                               </table>
                               <p v-if="!details.standings || details.standings.length === 0" class="text-center text-gray-400 py-4">Puan durumu verisi bulunamadı.</p>
                            </div>
                        </div>
                    </transition>
                </div>
            </div>
        </div>
    `
};