import MatchCardComponent from './MatchCard.js';

export default {
    props: ['leagueName', 'matches'],
    emits: ['match-selected'],
    components: {
        'match-card': MatchCardComponent
    },
    template: `
        <div class="mb-6">
            <h2 class="text-sm font-bold uppercase text-gray-500 mb-3 ml-1">{{ leagueName }}</h2>
            <match-card 
                v-for="match in matches" 
                :key="match.id" 
                :match="match"
                @match-selected="(selectedMatch) => $emit('match-selected', selectedMatch)">
            </match-card>
        </div>`
};