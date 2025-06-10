import { reactive } from 'vue';

export const state = reactive({
    currentView: 'list', // list veya detail
    selectedMatch: null,

    showDetailView(match) {
        this.selectedMatch = match;
        this.currentView = 'detail';
    },

    showListView() {
        this.selectedMatch = null;
        this.currentView = 'list';
    }
});
