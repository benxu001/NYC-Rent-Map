/**
 * Main application initialization for NYC Rent Map
 */

const App = {
    slider: null,
    currentMonthDisplay: null,

    /**
     * Initialize the application
     */
    init: async function() {
        this.slider = document.getElementById('time-slider');
        this.currentMonthDisplay = document.getElementById('current-month');

        // Initialize the map
        MapModule.init();

        // Load data
        const [geoData, timeSeriesLoaded] = await Promise.all([
            DataUtils.loadGeoJSON('data/processed/nyc_rent_data.geojson'),
            DataUtils.loadTimeSeries('data/processed/rent_timeseries.json')
        ]);

        if (!geoData || !timeSeriesLoaded) {
            this.showError('Failed to load data. Please ensure data files exist.');
            return;
        }

        // Setup slider
        this.setupSlider();

        // Add GeoJSON to map
        MapModule.addGeoJSON(geoData);

        // Create legend
        MapModule.createLegend();

        // Setup event listeners
        this.setupEventListeners();

        // Log summary
        console.log(`NYC Rent Map loaded: ${geoData.features.length} zip codes`);
        console.log(`Date range: ${DataUtils.availableDates[0]} to ${DataUtils.availableDates[DataUtils.availableDates.length - 1]}`);
    },

    /**
     * Setup the time slider
     */
    setupSlider: function() {
        const dates = DataUtils.availableDates;

        if (dates.length === 0) {
            console.error('No dates available');
            return;
        }

        this.slider.min = 0;
        this.slider.max = dates.length - 1;
        this.slider.value = dates.length - 1;

        document.getElementById('slider-start').textContent = DataUtils.formatDateShort(dates[0]);
        document.getElementById('slider-end').textContent = DataUtils.formatDateShort(dates[dates.length - 1]);

        this.updateCurrentMonthDisplay();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Slider change event
        this.slider.addEventListener('input', (e) => {
            DataUtils.currentDateIndex = parseInt(e.target.value);
            this.updateCurrentMonthDisplay();
            MapModule.updateMapColors();
        });

        // Close detail panel button
        document.getElementById('close-detail').addEventListener('click', () => {
            MapModule.deselectFeature();
        });

        // Click outside map to deselect
        document.getElementById('sidebar').addEventListener('click', (e) => {
            if (e.target.id === 'sidebar' || e.target.classList.contains('sidebar-header')) {
                MapModule.deselectFeature();
            }
        });
    },

    /**
     * Update the current month display
     */
    updateCurrentMonthDisplay: function() {
        const currentDate = DataUtils.getCurrentDate();
        this.currentMonthDisplay.textContent = DataUtils.formatDate(currentDate);
    },

    /**
     * Show error message
     */
    showError: function(message) {
        const hoverPanel = document.getElementById('hover-panel');
        hoverPanel.innerHTML = `
            <div class="error-message">
                <h3>Error</h3>
                <p>${message}</p>
            </div>
        `;
        console.error(message);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
