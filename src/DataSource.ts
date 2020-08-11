import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { ApiResponse, defaultQuery, MyDataSourceOptions, MyQuery, PropertiesMap } from './types';

export class DataSource extends DataSourceApi<MyQuery, MyDataSourceOptions> {
  url: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
    this.url = instanceSettings.url!;
  }

  async query(options: DataQueryRequest<MyQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.format('YYYY-MM-DD');
    const to = range!.to.format('YYYY-MM-DD');

    const data = await Promise.all(
      options.targets.map(async target => {
        const query = defaults(target, defaultQuery);
        let fetchedData: ApiResponse;
        if (query.stationId) {
          fetchedData = await this.fetchByStationId(query.stationId, from, to);
        } else if (query.latitude && query.longitude) {
          fetchedData = await this.fetchByCoordinates(query.latitude, query.longitude, from, to);
        } else {
          throw new Error('Either station id or coordinates have to be provided');
        }
        const { properties } = query;
        const source = {
          refId: query.refId,
          fields: [
            { name: 'Time', values: fetchedData.data.map((data: { time: string }) => data.time), type: FieldType.time },
          ],
        };
        properties.forEach(property => {
          if (PropertiesMap[property]) {
            source.fields.push({
              name: PropertiesMap[property].label,
              values: fetchedData.data.map((data: { [x: string]: any }) => data[property]),
              type: PropertiesMap[property].type,
            });
          }
        });
        return new MutableDataFrame(source);
      })
    );

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }

  async fetchByStationId(stationId: string, start: string, end: string): Promise<ApiResponse> {
    return this.doRequest('/v2/stations/hourly', { station: stationId, start, end });
  }

  async fetchByCoordinates(latitude: number, longitude: number, start: string, end: string): Promise<ApiResponse> {
    return this.doRequest('/v2/point/hourly', { lat: latitude, lon: longitude, start, end });
  }

  async doRequest(url: string, parameters: { [key: string]: any }, maxRetries = 1): Promise<any> {
    return getBackendSrv()
      .get(this.url + '/meteostat' + url, parameters)
      .catch((error: any) => {
        if (maxRetries > 0) {
          return this.doRequest(url, parameters, maxRetries - 1);
        }
        throw error;
      });
  }
}
