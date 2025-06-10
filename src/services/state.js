import { reactive } from 'vue';

export const state = reactive({
    currentView: 'list', 
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