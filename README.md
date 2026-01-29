# NYC Rent Map by Zip Code

An interactive web-based map application visualizing average rent prices across New York City ZIP codes from January 2015 to December 2025. The app allows users to explore rent levels, geographic patterns, and long-term rent growth through a dynamic, map-driven interface.

* **Project type:** lightweight front-end data visualization  
* **Primary deliverable:** an interactive choropleth map you can explore in the browser

## Project Overview

New York City’s rental market has changed dramatically over the past decade. This project turns ZIP-code–level rent data into an interactive web map that makes it easy to:

- Compare average rent levels across neighborhoods  
- Explore how rents change over time  
- Identify ZIP codes with the fastest rent growth  
- Understand spatial rent patterns at a citywide scale  


<img width="1667" height="1143" alt="image" src="https://github.com/user-attachments/assets/070f9aa0-3b3c-447d-96e9-7acebe7e2ed3" />


## Application Features

### 🗺️ Interactive NYC ZIP Code Map
- Choropleth map displaying average rent by ZIP code  
- Color scale ranges from under $1,500 to $4,500+  
- Gray areas indicate missing or unavailable data  

### 📆 Dynamic Date Range Selector
- Users can select any start and end date between 2015–2025  
- All rent values and summary metrics update instantly  

### 📈 Rent Change Summary
- Displays citywide average rent  
- Shows starting vs. ending rent  
- Automatically calculates percent change for the selected range  

### 🔝 Top 10 ZIP Codes by Rent Growth
- Highlights ZIP codes with the largest percentage increase  
- Useful for spotting rapid growth and gentrification patterns  

### 🧭 Hover & Pin Interactions
- Hover over ZIP codes to see rent details  
- Pin ZIP codes to view year-by-year trends

## Key Insights

- NYC-wide average rent increased approximately **49%** between 2015 and 2025  
- Brooklyn ZIP codes dominate the top rent growth rankings, with several exceeding **100% growth**  
- Manhattan remains the most expensive borough overall, but outer boroughs experienced faster relative growth  
- Rent growth varies significantly even between neighboring ZIP codes, highlighting localized housing pressures  
- Pre **COVID**, average rent peaked in September 2019, and bottomed during COVID in February 2021 for a 11.9% drop. Current rent is now 30.7% higher than the pre COVID peak and 47.4% higher than the COVID bottom.

## Tech Stack

- **JavaScript / HTML / CSS** (front-end map + UI)
- **Python** (data cleaning / transformation scripts)

## Skills Demonstrated

- **Frontend Data Visualization**
  - Interactive geospatial mapping  
  - Dynamic filtering and UI state management  

- **Data Analysis**
  - Time-series aggregation  
  - Percent change calculations  

- **Data Preparation**
  - Cleaning and reshaping time-series data  
  - Handling missing geographic values  

- **Product Thinking**
  - Designing intuitive user controls  
  - Building a deployable, shareable data product  

## Live App

https://benxu001.github.io/NYC-Rent-Map/


## Data

https://www.zillow.com/research/data/




