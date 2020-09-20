# Grafana Meteostat Data Source Plugin
This repository contains a grafana datasource plugin for the weather api [meteostat](http://meteostat.net/).

## Installing
> Prerequesites: You need to have a valid meteostat api key. Request one here https://auth.meteostat.net/ 

TODO: documentation on how to install this grafana plugin

### Configuring
Go to the grafana dashboard and click on **Add data source**. Select **Meteostat** as the datasource and enter your personal API key.  
Test the datasource and click on **Save & Test**.

In order to use the data source, create a new query and select the newly created **Meteostat** data source.  
Then either search for a weather station, or use latitude and longitude in order to query weather data.  
You should be able to see weather data for the selected time frame. 


## Start Developing
1. Install dependencies
```BASH
yarn install
```
2. Build plugin in development mode or run in watch mode
```BASH
yarn dev
```
or
```BASH
yarn watch
```
3. Build plugin in production mode
```BASH
yarn build
```

## Learn more
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
- [Grafana documentation](https://grafana.com/docs/)
- [Grafana Tutorials](https://grafana.com/tutorials/) - Grafana Tutorials are step-by-step guides that help you make the most of Grafana
- [Grafana UI Library](https://developers.grafana.com/ui) - UI components to help you build interfaces using Grafana Design System
