export default {
    props: ['match'],
    emits: ['match-selected'],
    computed: {
        cardClasses() {
            switch (this.match.betStatus) {
                case 'tracking': return 'bg-yellow-50 border border-yellow-300';
                case 'won': return 'bg-green-50 border border-green-300';
                case 'lost': return 'bg-red-50 border border-red-300';
                default: return 'bg-white';
            }
        },
        textClasses() {
            switch (this.match.betStatus) {
                case 'tracking': return 'text-yellow-900';
                case 'won': return 'text-green-900';
                case 'lost': return 'text-red-900';
                default: return 'text-gray-800';
            }
        },
        timeClasses() {
            switch (this.match.betStatus) {
                case 'tracking': return 'text-yellow-700 font-bold';
                case 'won': return 'text-green-600';
                case 'lost': return 'text-red-600';
                default: return 'text-gray-500';
            }
        },
        catEmoji() {
            switch (this.match.betStatus) {
                case 'tracking': return '�';
                case 'won': return '😸';
                case 'lost': return '😿';
                default: return '🐱';
            }
        }
    },
    template: `
        <div class="match-card rounded-lg shadow p-4 mb-3 flex items-center" :class="cardClasses" @click="$emit('match-selected', match)">
            <div class="w-16 text-center text-sm font-semibold" :class="timeClasses">{{ match.time }}</div>
            <div class="flex-grow mx-2">
                <div class="flex items-center mb-1"><img :src="match.homeLogo" class="w-4 h-4 mr-2" alt="home logo" @error.once="$event.target.style.display='none'"> <span class="font-semibold" :class="textClasses">{{ match.homeTeam }}</span></div>
                <div class="flex items-center"><img :src="match.awayLogo" class="w-4 h-4 mr-2" alt="away logo" @error.once="$event.target.style.display='none'"> <span class="font-semibold" :class="textClasses">{{ match.awayTeam }}</span></div>
            </div>
            <div class="flex items-center justify-end">
                <div class="text-3xl mr-2" :class="textClasses">{{ catEmoji }}</div>
                <div class="w-16 text-center text-2xl font-bold" :class="textClasses">
                    <div>{{ match.homeScore }}</div>
                    <div>{{ match.awayScore }}</div>
                </div>
            </div>
        </div>`
};
