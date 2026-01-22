/**
 * Map module for NYC Rent Map
 * Handles Leaflet map initialization, layer management, and interactions
 */

const MapModule = {
    map: null,
    geojsonLayer: null,
    geojsonData: null,
    selectedZipcode: null,
    selectedLayer: null,

    /**
     * Initialize the Leaflet map
     */
    init: function() {
        this.map = L.map('map', {
            center: [40.7128, -74.0060],
            zoom: 11,
            minZoom: 10,
            maxZoom: 16,
            zoomControl: false
        });

        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 20
        }).addTo(this.map);

        return this;
    },

    /**
     * Style function for GeoJSON features
     */
    style: function(feature) {
        const zipcode = feature.properties.zipcode;
        const rent = DataUtils.getEndRentForZip(zipcode);

        return {
            fillColor: DataUtils.getColor(rent),
            weight: 1,
            opacity: 1,
            color: '#666',
            fillOpacity: 0.7
        };
    },

    /**
     * Highlight a feature on hover
     */
    highlightFeature: function(e) {
        const layer = e.target;

        if (MapModule.selectedLayer === layer) return;

        layer.setStyle({
            weight: 2,
            color: '#333',
            fillOpacity: 0.85
        });

        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }

        if (MapModule.selectedLayer) {
            MapModule.selectedLayer.bringToFront();
        }

        MapModule.updateHoverDisplay(layer.feature.properties);
    },

    /**
     * Reset feature highlight on mouseout
     */
    resetHighlight: function(e) {
        const layer = e.target;

        if (MapModule.selectedLayer === layer) return;

        MapModule.geojsonLayer.resetStyle(layer);
        MapModule.updateHoverDisplay(null);
    },

    /**
     * Handle click on a zip code
     */
    selectFeature: function(e) {
        const layer = e.target;
        const props = layer.feature.properties;

        if (MapModule.selectedZipcode === props.zipcode) {
            MapModule.deselectFeature();
            return;
        }

        if (MapModule.selectedLayer) {
            MapModule.geojsonLayer.resetStyle(MapModule.selectedLayer);
        }

        MapModule.selectedZipcode = props.zipcode;
        MapModule.selectedLayer = layer;

        layer.setStyle({
            weight: 3,
            color: '#e74c3c',
            fillOpacity: 0.9
        });

        layer.bringToFront();
        MapModule.updateDetailPanel(props);

        MapModule.map.fitBounds(layer.getBounds(), {
            padding: [100, 100],
            maxZoom: 14
        });
    },

    /**
     * Deselect current feature
     */
    deselectFeature: function() {
        if (MapModule.selectedLayer) {
            MapModule.geojsonLayer.resetStyle(MapModule.selectedLayer);
        }
        MapModule.selectedZipcode = null;
        MapModule.selectedLayer = null;
        MapModule.hideDetailPanel();
    },

    /**
     * Attach event listeners to each feature
     */
    onEachFeature: function(_feature, layer) {
        layer.on({
            mouseover: MapModule.highlightFeature,
            mouseout: MapModule.resetHighlight,
            click: MapModule.selectFeature
        });
    },

    /**
     * Add GeoJSON data to the map
     */
    addGeoJSON: function(data) {
        this.geojsonData = data;
        this.geojsonLayer = L.geoJson(data, {
            style: this.style,
            onEachFeature: this.onEachFeature
        }).addTo(this.map);

        return this;
    },

    /**
     * Update map colors based on end date
     */
    updateMapColors: function() {
        if (!this.geojsonLayer) return;

        this.geojsonLayer.eachLayer(function(layer) {
            const zipcode = layer.feature.properties.zipcode;
            const rent = DataUtils.getEndRentForZip(zipcode);
            const newColor = DataUtils.getColor(rent);

            if (MapModule.selectedLayer === layer) {
                layer.setStyle({
                    fillColor: newColor,
                    weight: 3,
                    color: '#e74c3c',
                    fillOpacity: 0.9
                });
            } else {
                layer.setStyle({
                    fillColor: newColor,
                    weight: 1,
                    color: '#666',
                    fillOpacity: 0.7
                });
            }
        });

        if (this.selectedZipcode && this.selectedLayer) {
            this.updateDetailPanel(this.selectedLayer.feature.properties);
        } else {
            // Update aggregated NYC data when no zip code is selected
            this.updateHoverDisplay(null);
        }
    },

    /**
     * Update hover display in sidebar
     */
    updateHoverDisplay: function(props) {
        const hoverPanel = document.getElementById('hover-panel');

        if (!props) {
            // Show aggregated NYC data when not hovering
            const nycData = DataUtils.getNYCAggregateData();
            const changeClass = nycData.percentChange !== null ? (nycData.percentChange >= 0 ? 'change-positive' : 'change-negative') : '';

            hoverPanel.innerHTML = `
                <div class="hover-info">
                    <h3>All NYC</h3>
                    <p class="neighborhood">Average across ${nycData.zipCount} zip codes</p>
                    <div class="hover-rent-row end-rent">
                        <span class="hover-rent-label">End:</span>
                        <span class="hover-rent-value">${DataUtils.formatRent(nycData.endRent)}</span>
                    </div>
                    <div class="hover-rent-row">
                        <span class="hover-rent-label">Start:</span>
                        <span class="hover-rent-value">${DataUtils.formatRent(nycData.startRent)}</span>
                    </div>
                    <div class="hover-rent-row">
                        <span class="hover-rent-label">Change:</span>
                        <span class="hover-rent-value ${changeClass}">${DataUtils.formatPercentChange(nycData.percentChange)}</span>
                    </div>
                </div>
                <p class="instruction">Hover over a zip code to see details</p>
                <p class="instruction">Click to pin and see yearly data</p>
            `;
            return;
        }

        const startRent = DataUtils.getStartRentForZip(props.zipcode);
        const endRent = DataUtils.getEndRentForZip(props.zipcode);
        const percentChange = DataUtils.getPercentChange(startRent, endRent);
        const changeClass = percentChange !== null ? (percentChange >= 0 ? 'change-positive' : 'change-negative') : '';
        const neighborhood = props.PO_NAME || props.neighborhood || '';
        const borough = props.borough || '';

        hoverPanel.innerHTML = `
            <div class="hover-info">
                <h3>${props.zipcode}</h3>
                ${neighborhood ? `<p class="neighborhood">${neighborhood}</p>` : ''}
                ${borough ? `<p class="borough">${borough}</p>` : ''}
                <div class="hover-rent-row end-rent">
                    <span class="hover-rent-label">End:</span>
                    <span class="hover-rent-value">${DataUtils.formatRent(endRent)}</span>
                </div>
                <div class="hover-rent-row">
                    <span class="hover-rent-label">Start:</span>
                    <span class="hover-rent-value">${DataUtils.formatRent(startRent)}</span>
                </div>
                <div class="hover-rent-row">
                    <span class="hover-rent-label">Change:</span>
                    <span class="hover-rent-value ${changeClass}">${DataUtils.formatPercentChange(percentChange)}</span>
                </div>
            </div>
        `;
    },

    /**
     * Update detail panel with selected zip code info
     */
    updateDetailPanel: function(props) {
        const detailPanel = document.getElementById('detail-panel');
        const hoverPanel = document.getElementById('hover-panel');

        detailPanel.classList.remove('hidden');
        hoverPanel.classList.add('hidden');

        document.getElementById('detail-zipcode').textContent = props.zipcode;

        const neighborhood = props.PO_NAME || props.neighborhood || '';
        const borough = props.borough || '';
        document.getElementById('detail-neighborhood').textContent = neighborhood;
        document.getElementById('detail-borough').textContent = borough;

        const startRent = DataUtils.getStartRentForZip(props.zipcode);
        const endRent = DataUtils.getEndRentForZip(props.zipcode);
        const percentChange = DataUtils.getPercentChange(startRent, endRent);

        document.getElementById('detail-start-rent').textContent = DataUtils.formatRent(startRent);
        document.getElementById('detail-end-rent').textContent = DataUtils.formatRent(endRent);

        const changeEl = document.getElementById('detail-percent-change');
        changeEl.textContent = DataUtils.formatPercentChange(percentChange);
        changeEl.className = 'change-value ' + (percentChange !== null ? (percentChange >= 0 ? 'change-positive' : 'change-negative') : '');

        const yearlyList = document.getElementById('yearly-list');
        const yearlyAvg = props.yearly_avg || {};

        let yearlyHtml = '';
        const years = Object.keys(yearlyAvg).sort().reverse();

        for (const year of years) {
            const avgRent = yearlyAvg[year];
            yearlyHtml += `
                <div class="yearly-item">
                    <span class="year">${year}</span>
                    <span class="yearly-rent">${DataUtils.formatRent(avgRent)}</span>
                </div>
            `;
        }

        if (years.length === 0) {
            yearlyHtml = '<p class="no-data">No historical data available</p>';
        }

        yearlyList.innerHTML = yearlyHtml;
    },

    /**
     * Hide detail panel and show hover panel
     */
    hideDetailPanel: function() {
        const detailPanel = document.getElementById('detail-panel');
        const hoverPanel = document.getElementById('hover-panel');

        detailPanel.classList.add('hidden');
        hoverPanel.classList.remove('hidden');

        this.updateHoverDisplay(null);
    },

    /**
     * Create and add legend control to map
     */
    createLegend: function() {
        const legend = L.control({ position: 'bottomright' });

        legend.onAdd = function() {
            const div = L.DomUtil.create('div', 'map-legend');
            const items = DataUtils.getLegendItems();

            let html = '<h4>Rent Scale</h4>';
            for (const item of items) {
                html += `
                    <div class="legend-item">
                        <span class="legend-color" style="background:${item.color}"></span>
                        <span class="legend-label">${item.label}</span>
                    </div>
                `;
            }

            div.innerHTML = html;
            return div;
        };

        legend.addTo(this.map);
    }
};
