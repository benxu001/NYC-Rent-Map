/**
 * Data utilities for NYC Rent Map
 * Handles color scales, data loading, and formatting
 */

const DataUtils = {
    // Time series data storage
    timeSeries: null,
    availableDates: [],
    startDateIndex: 0,
    endDateIndex: 0,

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
            this.startDateIndex = 0;
            this.endDateIndex = this.availableDates.length - 1;
            return true;
        } catch (error) {
            console.error('Error loading time series:', error);
            return false;
        }
    },

    /**
     * Get start date
     */
    getStartDate: function() {
        return this.availableDates[this.startDateIndex] || '';
    },

    /**
     * Get end date
     */
    getEndDate: function() {
        return this.availableDates[this.endDateIndex] || '';
    },

    /**
     * Get rent for a specific zip code at start date
     */
    getStartRentForZip: function(zipcode) {
        if (!this.timeSeries || !this.timeSeries[zipcode]) {
            return null;
        }
        const startDate = this.getStartDate();
        return this.timeSeries[zipcode][startDate] || null;
    },

    /**
     * Get rent for a specific zip code at end date
     */
    getEndRentForZip: function(zipcode) {
        if (!this.timeSeries || !this.timeSeries[zipcode]) {
            return null;
        }
        const endDate = this.getEndDate();
        return this.timeSeries[zipcode][endDate] || null;
    },

    /**
     * Calculate percentage change between start and end rent
     */
    getPercentChange: function(startRent, endRent) {
        if (startRent === null || endRent === null || startRent === 0) {
            return null;
        }
        return ((endRent - startRent) / startRent) * 100;
    },

    /**
     * Format percentage change
     */
    formatPercentChange: function(percent) {
        if (percent === null) {
            return 'N/A';
        }
        const sign = percent >= 0 ? '+' : '';
        return `${sign}${percent.toFixed(1)}%`;
    },

    /**
     * Get aggregated NYC-wide rent data
     */
    getNYCAggregateData: function() {
        if (!this.timeSeries) {
            return { startRent: null, endRent: null, percentChange: null };
        }

        let totalStartRent = 0;
        let totalEndRent = 0;
        let count = 0;

        for (const zipcode in this.timeSeries) {
            const startRent = this.getStartRentForZip(zipcode);
            const endRent = this.getEndRentForZip(zipcode);

            if (startRent !== null && endRent !== null) {
                totalStartRent += startRent;
                totalEndRent += endRent;
                count++;
            }
        }

        if (count === 0) {
            return { startRent: null, endRent: null, percentChange: null, zipCount: 0 };
        }

        const avgStartRent = totalStartRent / count;
        const avgEndRent = totalEndRent / count;
        const percentChange = this.getPercentChange(avgStartRent, avgEndRent);

        return {
            startRent: avgStartRent,
            endRent: avgEndRent,
            percentChange: percentChange,
            zipCount: count
        };
    },

    /**
     * Get top 10 zip codes by absolute percentage change
     */
    getTop10ByChange: function() {
        if (!this.timeSeries) {
            return [];
        }

        const changes = [];

        for (const zipcode in this.timeSeries) {
            const startRent = this.getStartRentForZip(zipcode);
            const endRent = this.getEndRentForZip(zipcode);
            const percentChange = this.getPercentChange(startRent, endRent);

            if (percentChange !== null) {
                changes.push({
                    zipcode: zipcode,
                    percentChange: percentChange,
                    absChange: Math.abs(percentChange)
                });
            }
        }

        // Sort by absolute change descending
        changes.sort((a, b) => b.absChange - a.absChange);

        // Return top 10
        return changes.slice(0, 10);
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
