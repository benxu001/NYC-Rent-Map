/**
 * Main application initialization for NYC Rent Map
 */

const App = {
    startSlider: null,
    endSlider: null,
    startDateDisplay: null,
    endDateDisplay: null,
    percentChangeDisplay: null,

    /**
     * Initialize the application
     */
    init: async function() {
        this.startSlider = document.getElementById('start-slider');
        this.endSlider = document.getElementById('end-slider');
        this.startDateDisplay = document.getElementById('start-date');
        this.endDateDisplay = document.getElementById('end-date');
        this.percentChangeDisplay = document.getElementById('percent-change');

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

        // Create top 10 panel
        MapModule.createTop10Control();

        // Setup event listeners
        this.setupEventListeners();

        // Log summary
        console.log(`NYC Rent Map loaded: ${geoData.features.length} zip codes`);
        console.log(`Date range: ${DataUtils.availableDates[0]} to ${DataUtils.availableDates[DataUtils.availableDates.length - 1]}`);
    },

    /**
     * Setup the time range sliders
     */
    setupSlider: function() {
        const dates = DataUtils.availableDates;

        if (dates.length === 0) {
            console.error('No dates available');
            return;
        }

        const maxIndex = dates.length - 1;

        this.startSlider.min = 0;
        this.startSlider.max = maxIndex;
        this.startSlider.value = 0;

        this.endSlider.min = 0;
        this.endSlider.max = maxIndex;
        this.endSlider.value = maxIndex;

        document.getElementById('slider-min').textContent = DataUtils.formatDateShort(dates[0]);
        document.getElementById('slider-max').textContent = DataUtils.formatDateShort(dates[maxIndex]);

        this.updateDateDisplay();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners: function() {
        // Start slider change event
        this.startSlider.addEventListener('input', (e) => {
            let startVal = parseInt(e.target.value);
            let endVal = parseInt(this.endSlider.value);

            // Prevent start from exceeding end
            if (startVal > endVal) {
                startVal = endVal;
                this.startSlider.value = startVal;
            }

            DataUtils.startDateIndex = startVal;
            this.updateDateDisplay();
            MapModule.updateMapColors();
        });

        // End slider change event
        this.endSlider.addEventListener('input', (e) => {
            let endVal = parseInt(e.target.value);
            let startVal = parseInt(this.startSlider.value);

            // Prevent end from going below start
            if (endVal < startVal) {
                endVal = startVal;
                this.endSlider.value = endVal;
            }

            DataUtils.endDateIndex = endVal;
            this.updateDateDisplay();
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
     * Update the date range display
     */
    updateDateDisplay: function() {
        const startDate = DataUtils.getStartDate();
        const endDate = DataUtils.getEndDate();

        this.startDateDisplay.textContent = DataUtils.formatDate(startDate);
        this.endDateDisplay.textContent = DataUtils.formatDate(endDate);

        // Update overall percentage change (average across all zip codes with data)
        this.updateOverallPercentChange();
    },

    /**
     * Update the overall percentage change display
     */
    updateOverallPercentChange: function() {
        if (!DataUtils.timeSeries) {
            this.percentChangeDisplay.textContent = '--';
            return;
        }

        let totalStartRent = 0;
        let totalEndRent = 0;
        let count = 0;

        for (const zipcode in DataUtils.timeSeries) {
            const startRent = DataUtils.getStartRentForZip(zipcode);
            const endRent = DataUtils.getEndRentForZip(zipcode);

            if (startRent !== null && endRent !== null) {
                totalStartRent += startRent;
                totalEndRent += endRent;
                count++;
            }
        }

        if (count > 0) {
            const avgStartRent = totalStartRent / count;
            const avgEndRent = totalEndRent / count;
            const percentChange = DataUtils.getPercentChange(avgStartRent, avgEndRent);
            const formatted = DataUtils.formatPercentChange(percentChange);

            this.percentChangeDisplay.textContent = formatted;
            this.percentChangeDisplay.className = percentChange >= 0 ? 'change-positive' : 'change-negative';
        } else {
            this.percentChangeDisplay.textContent = 'N/A';
            this.percentChangeDisplay.className = '';
        }
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
