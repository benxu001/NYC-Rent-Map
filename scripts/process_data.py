#!/usr/bin/env python3
"""
Process NYC zip code boundaries and Zillow rent data.
Merges the datasets with historical time series from 2015.
"""

import json
import csv
import os

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
RAW_DIR = os.path.join(PROJECT_DIR, 'data', 'raw')
PROCESSED_DIR = os.path.join(PROJECT_DIR, 'data', 'processed')

GEOJSON_PATH = os.path.join(RAW_DIR, 'nyc_zipcodes.geojson')
ZILLOW_PATH = os.path.join(RAW_DIR, 'zillow_zori.csv')
OUTPUT_GEOJSON_PATH = os.path.join(PROCESSED_DIR, 'nyc_rent_data.geojson')
OUTPUT_TIMESERIES_PATH = os.path.join(PROCESSED_DIR, 'rent_timeseries.json')

# NYC zip code prefixes
NYC_PREFIXES = ('100', '101', '102', '103', '104', '110', '111', '112', '113', '114', '116')


def load_geojson():
    """Load NYC zip code boundaries GeoJSON."""
    with open(GEOJSON_PATH, 'r') as f:
        return json.load(f)


def load_zillow_timeseries():
    """
    Load Zillow ZORI data with full time series from 2015.
    Returns:
        - rent_data: dict mapping zipcode -> {date: rent_value}
        - available_dates: sorted list of date strings
    """
    rent_data = {}
    all_dates = set()

    with open(ZILLOW_PATH, 'r') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        # Find all date columns (format: YYYY-MM-DD) from 2015 onwards
        date_columns = [col for col in fieldnames if col.startswith('20')]
        recent_dates = [d for d in date_columns if int(d[:4]) >= 2015]

        print(f"Found {len(date_columns)} total date columns")
        print(f"Using {len(recent_dates)} dates from 2015 onwards")

        for row in reader:
            zipcode = row['RegionName']
            state = row.get('State', '')

            # Filter to NY state and NYC zip codes
            if state == 'NY' and zipcode.startswith(NYC_PREFIXES):
                rent_data[zipcode] = {}

                for date_col in recent_dates:
                    rent_value = row.get(date_col, '')
                    if rent_value:
                        try:
                            rent_data[zipcode][date_col] = round(float(rent_value), 0)
                            all_dates.add(date_col)
                        except ValueError:
                            pass

    available_dates = sorted(list(all_dates))
    print(f"Found rent data for {len(rent_data)} NYC zip codes")
    print(f"Date range: {available_dates[0]} to {available_dates[-1]}")

    return rent_data, available_dates


def compute_yearly_averages(timeseries):
    """Compute average rent by year from time series data."""
    yearly_data = {}

    for date_str, rent in timeseries.items():
        year = date_str[:4]
        if year not in yearly_data:
            yearly_data[year] = []
        yearly_data[year].append(rent)

    # Compute averages
    yearly_avg = {}
    for year, rents in sorted(yearly_data.items()):
        yearly_avg[year] = round(sum(rents) / len(rents), 0)

    return yearly_avg


def merge_data(geojson, rent_data, available_dates):
    """Merge rent time series data into GeoJSON properties."""
    matched = 0
    unmatched = 0

    # Get most recent date for default display
    latest_date = available_dates[-1] if available_dates else None

    for feature in geojson['features']:
        props = feature['properties']

        # Get zip code
        zipcode = str(props.get('postalCode', props.get('ZIPCODE', props.get('ZCTA5CE10', ''))))
        props['zipcode'] = zipcode

        if zipcode in rent_data and rent_data[zipcode]:
            timeseries = rent_data[zipcode]

            # Store latest rent for initial display
            props['avg_rent'] = timeseries.get(latest_date)

            # Compute yearly averages
            props['yearly_avg'] = compute_yearly_averages(timeseries)

            matched += 1
        else:
            props['avg_rent'] = None
            props['yearly_avg'] = {}
            unmatched += 1

    print(f"Matched: {matched} zip codes, Unmatched: {unmatched} zip codes")
    return geojson


def save_output(geojson, rent_data, available_dates):
    """Save processed GeoJSON and time series data."""
    os.makedirs(PROCESSED_DIR, exist_ok=True)

    # Save GeoJSON (for map polygons and basic info)
    with open(OUTPUT_GEOJSON_PATH, 'w') as f:
        json.dump(geojson, f)

    size_kb = os.path.getsize(OUTPUT_GEOJSON_PATH) / 1024
    print(f"Saved GeoJSON to: {OUTPUT_GEOJSON_PATH} ({size_kb:.1f} KB)")

    # Save time series data separately (for slider functionality)
    timeseries_output = {
        'dates': available_dates,
        'data': rent_data
    }

    with open(OUTPUT_TIMESERIES_PATH, 'w') as f:
        json.dump(timeseries_output, f)

    size_kb = os.path.getsize(OUTPUT_TIMESERIES_PATH) / 1024
    print(f"Saved time series to: {OUTPUT_TIMESERIES_PATH} ({size_kb:.1f} KB)")


def main():
    print("=" * 50)
    print("NYC Rent Map Data Processing (with Time Series)")
    print("=" * 50)

    # Load data
    print("\n1. Loading GeoJSON boundaries...")
    geojson = load_geojson()
    print(f"   Loaded {len(geojson['features'])} zip code polygons")

    print("\n2. Loading Zillow rent data (from 2015)...")
    rent_data, available_dates = load_zillow_timeseries()

    # Merge
    print("\n3. Merging datasets...")
    merged = merge_data(geojson, rent_data, available_dates)

    # Save
    print("\n4. Saving processed data...")
    save_output(merged, rent_data, available_dates)

    print("\n" + "=" * 50)
    print("Processing complete!")
    print("=" * 50)


if __name__ == '__main__':
    main()
