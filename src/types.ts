import { DataQuery, DataSourceJsonData, FieldType, SelectableValue } from '@grafana/data';

export interface MyQuery extends DataQuery {
  station: SelectableValue;
  latitude?: number;
  longitude?: number;
  properties: string[];
}

export const AverageTemperatureProperties: Array<{ label: string; value: string; type: FieldType }> = [
  { label: 'Average Temperature (°C)', value: 'tavg', type: FieldType.number },
  { label: 'Minimum Temperature (°C)', value: 'tmin', type: FieldType.number },
  { label: 'Maximum Temperature (°C)', value: 'tmax', type: FieldType.number },
];

export const PropertiesMap: { [key: string]: { label: string; value: string; type: FieldType } } = {
  temp: { label: 'Temperature (°C)', value: 'temp', type: FieldType.number },
  rhum: { label: 'Relative Humidity (%)', value: 'rhum', type: FieldType.number },
  dwpt: { label: 'Dew Point (°C)', value: 'dwpt', type: FieldType.number },
  prcp: { label: 'Precipitation (mm)', value: 'prcp', type: FieldType.number },
  snow: { label: 'Snow (mm)', value: 'snow', type: FieldType.number },
  wdir: { label: 'Wind Direction (°)', value: 'wdir', type: FieldType.number },
  wspd: { label: 'Wind Speed (km/h)', value: 'wspd', type: FieldType.number },
  wpgt: { label: 'Peak Wind Gust (km/h)', value: 'wpgt', type: FieldType.number },
  pres: { label: 'Sea Level Air Pressure (hPa)', value: 'pres', type: FieldType.number },
  tsun: { label: 'One Hour Total Sunshine (minutes)', value: 'tsun', type: FieldType.number },
  coco: { label: 'Weather Condition Code', value: 'coco', type: FieldType.number },
};

export const defaultQuery: Partial<MyQuery> = {
  properties: [PropertiesMap.temp.value],
};

export interface HourlyApiResponse {
  meta: { source: string; exec_time: string; generated: string };
  data: Array<{
    time: string;
    time_local: string;
    temp: string;
    rhum: string;
    dwpt: string;
    prcp: string;
    snow: string;
    wdir: string;
    wspd: string;
    wpgt: string;
    pres: string;
    tsun: string;
    coco: string;
  }>;
}

export interface DailyApiResponse {
  meta: { source: string; exec_time: string; generated: string };
  data: Array<{
    date: string;
    tavg: string;
    tmin: string;
    tmax: string;
    prcp: string;
    snow: string;
    wdir: string;
    wspd: string;
    wpgt: string;
    pres: string;
    tsun: string;
  }>;
}

export interface ApiSearchStationResponse {
  meta: { exec_time: string; generated: string };
  data: Array<{
    id: string;
    name: {
      [languageKey: string]: string;
    };
    country: string;
    region: string;
    national: string;
    wmo: string;
    icao: string;
    iata: string;
    latitude: number;
    longitude: number;
    elevation: number;
    timezone: string;
    active: boolean;
  }>;
}

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
