import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  dateTime,
  DateTime,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import {
  HourlyApiResponse,
  ApiSearchStationResponse,
  defaultQuery,
  MyDataSourceOptions,
  MyQuery,
  PropertiesMap,
  DailyApiResponse,
  AverageTemperatureProperties,
} from './types';

const TEST_STATION_ID = '10702';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  url: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url!;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const rangeIsMoreThanTenDays = range!.to.diff(range!.from, 'days') >= 10;

    const data = await Promise.all(
      options.targets.map(async target => {
        const query = defaults(target, defaultQuery);
        let fetchedData: any;
        if (query.station.id) {
          fetchedData = await this.fetchByStationId(query.station.id, range!.from, range!.to, rangeIsMoreThanTenDays);
        } else if (query.latitude && query.longitude) {
          fetchedData = await this.fetchByCoordinates(
            query.latitude,
            query.longitude,
            range!.from,
            range!.to,
            rangeIsMoreThanTenDays
          );
        } else {
          throw new Error('Either station id or coordinates have to be provided');
        }
        const { properties } = query;
        const source = {
          refId: query.refId,
          fields: [
            {
              name: 'Time',
              values: fetchedData.data.map(
                (data: { time?: string; time_local?: string; date?: string }) =>
                  data.time_local || data.time || data.date
              ),
              type: FieldType.time,
            },
          ],
        };
        properties.forEach(property => {
          if (PropertiesMap[property]) {
            let propertiesToAdd = [PropertiesMap[property]];
            if (property === 'temp' && rangeIsMoreThanTenDays) {
              propertiesToAdd = AverageTemperatureProperties;
            }
            propertiesToAdd.forEach(property => {
              source.fields.push({
                name: property.label,
                values: fetchedData.data.map((data: { [x: string]: any }) => data[property.value]),
                type: property.type,
              });
            });
          }
        });
        return new MutableDataFrame(source);
      })
    );

    return { data };
  }

  async testDatasource() {
    const now = dateTime();
    await this.fetchByStationId(TEST_STATION_ID, now, now.subtract(1, 'days'), false);
    return {
      status: 'success',
      message: 'Success',
    };
  }

  async fetchByStationId(
    stationId: string,
    start: DateTime,
    end: DateTime,
    rangeIsMoreThanTenDays: boolean
  ): Promise<HourlyApiResponse> {
    return this.fetchWeatherData('/v2/stations', { station: stationId }, start, end, rangeIsMoreThanTenDays);
  }

  async fetchByCoordinates(
    latitude: number,
    longitude: number,
    start: DateTime,
    end: DateTime,
    rangeIsMoreThanTenDays: boolean
  ): Promise<HourlyApiResponse> {
    return this.fetchWeatherData('/v2/point', { lat: latitude, lon: longitude }, start, end, rangeIsMoreThanTenDays);
  }

  async fetchWeatherData(
    url: string,
    parameters: { [p: string]: any },
    start: DateTime,
    end: DateTime,
    rangeIsMoreThanTenDays: boolean
  ): Promise<any> {
    const startFormatted = start.format('YYYY-MM-DD');
    const endFormatted = end.format('YYYY-MM-DD');
    if (rangeIsMoreThanTenDays) {
      return this.doRequest(`${url}/daily`, { ...parameters, start: startFormatted, end: endFormatted }) as Promise<
        DailyApiResponse
      >;
    }
    return this.doRequest(`${url}/hourly`, { ...parameters, start: startFormatted, end: endFormatted }) as Promise<
      HourlyApiResponse
    >;
  }

  async fetchStations(searchTerm: string): Promise<ApiSearchStationResponse> {
    return this.doRequest('/v2/stations/search', { query: searchTerm });
  }

  async doRequest(url: string, parameters: { [key: string]: any }, maxRetries = 1): Promise<any> {
    return getBackendSrv()
      .get(this.url + '/meteostat' + url, parameters)
      .catch((error: any) => {
        if (maxRetries > 0) {
          return this.doRequest(url, parameters, maxRetries - 1);
        }
        console.error(error);
        throw error;
      });
  }
}
