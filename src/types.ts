import { DataQuery, DataSourceJsonData, FieldType } from '@grafana/data';

export interface MyQuery extends DataQuery {
  stationId?: string;
  latitude?: number;
  longitude?: number;
  properties: string[];
}

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

export interface ApiResponse {
  meta: { source: string; exec_time: string; generated: string };
  data: Array<{
    time: string;
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
