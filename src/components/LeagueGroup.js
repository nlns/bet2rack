import MatchCardComponent from './MatchCard.js';

export default {
    props: ['leagueName', 'matches', 'isLive'],
    emits: ['match-selected'],
    components: {
        'match-card': MatchCardComponent
    },
    template: `
        <div class="mb-6">
            <div class="flex items-center mb-3">
                 <h2 class="text-sm font-bold uppercase text-gray-500 ml-1">{{ leagueName }}</h2>
                 <span v-if="isLive" class="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">CANLI</span>
            </div>
            <match-card 
                v-for="match in matches" 
                :key="match.id" 
                :match="match"
                @match-selected="(selectedMatch) => $emit('match-selected', selectedMatch)">
            </match-card>
        </div>`
};
