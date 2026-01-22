/**
 * Data utilities for NYC Rent Map
 * Handles color scales, data loading, and formatting
 */

const DataUtils = {
    // Time series data storage
    timeSeries: null,
    availableDates: [],
    currentDateIndex: 0,

    // Color scale configuration - sequential blue palette (colorblind-friendly)
    colorScale: {
        colors: ['#f7fbff', '#deebf7', '#c6dbef', '#9ecae1',
                 '#6baed6', '#4292c6', '#2171b5', '#084594'],
        breaks: [1500, 2000, 2500, 3000, 3500, 4000, 4500, 5000]
    },

    /**
     * Get color for a rent value
     */
    getColor: function(rent) {
        if (rent === null || rent === undefined) {
            return '#cccccc';
        }
        const { colors, breaks } = this.colorScale;
        for (let i = 0; i < breaks.length; i++) {
            if (rent < breaks[i]) {
                return colors[i];
            }
        }
        return colors[colors.length - 1];
    },

    /**
     * Format rent value as currency
     */
    formatRent: function(rent) {
        if (rent === null || rent === undefined) {
            return 'No data';
        }
        return '$' + Math.round(rent).toLocaleString();
    },

    /**
     * Format date string to readable format
     */
    formatDate: function(dateStr) {
        if (!dateStr) return '';
        const [year, month] = dateStr.split('-');
        const months = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[parseInt(month) - 1]} ${year}`;
    },

    /**
     * Format date string to short format
     */
    formatDateShort: function(dateStr) {
        if (!dateStr) return '';
        const [year, month] = dateStr.split('-');
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[parseInt(month) - 1]} ${year}`;
    },

    /**
     * Load GeoJSON data from URL
     */
    loadGeoJSON: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
            return null;
        }
    },

    /**
     * Load time series data
     */
    loadTimeSeries: async function(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            const data = await response.json();
            this.timeSeries = data.data;
            this.availableDates = data.dates;
            this.currentDateIndex = this.availableDates.length - 1;
            return true;
        } catch (error) {
            console.error('Error loading time series:', error);
            return false;
        }
    },

    /**
     * Get current selected date
     */
    getCurrentDate: function() {
        return this.availableDates[this.currentDateIndex] || '';
    },

    /**
     * Get rent for a specific zip code at current date
     */
    getRentForZip: function(zipcode) {
        if (!this.timeSeries || !this.timeSeries[zipcode]) {
            return null;
        }
        const currentDate = this.getCurrentDate();
        return this.timeSeries[zipcode][currentDate] || null;
    },

    /**
     * Get legend items for the color scale
     */
    getLegendItems: function() {
        const { colors, breaks } = this.colorScale;
        const items = [];

        for (let i = 0; i < colors.length; i++) {
            let label;
            if (i === 0) {
                label = `< $${breaks[0].toLocaleString()}`;
            } else if (i === colors.length - 1) {
                label = `$${breaks[i - 1].toLocaleString()}+`;
            } else {
                label = `$${breaks[i - 1].toLocaleString()} - $${breaks[i].toLocaleString()}`;
            }

            items.push({
                color: colors[i],
                label: label
            });
        }

        items.push({
            color: '#cccccc',
            label: 'No data'
        });

        return items;
    }
};
