import {DataSource} from "../src/DataSource";
import {DataSourceInstanceSettings} from "@grafana/data/types/datasource";
import {MyDataSourceOptions, MyQuery} from "../src/types";
import {CoreApp, DataQueryRequest, dateTime, MutableDataFrame} from "@grafana/data";

describe('Meteostat Datasource', () => {

  const DUMMY_INSTANCE_SETTING: DataSourceInstanceSettings<MyDataSourceOptions> = {
    id: 1,
    uid: '1',
    type: 'mh...',
    name: 'meteostat',
    meta: require('../src/plugin.json'),
    jsonData: {}
  }

  describe('query', () => {

   let dummyQuery: DataQueryRequest<MyQuery>;
   let dataSource: DataSource;
   let doRequestSpy: any;
   beforeEach(() => {
     dummyQuery = {
       requestId: '1',
       dashboardId: 1,
       interval: '1',
       panelId: 1,
       range: {
         from: dateTime('2020-02-01T01:00:00.000Z'),
         to: dateTime('2020-02-03T01:00:00.000Z'),
         raw: {
           from: dateTime('2020-02-01T01:00:00.000Z'),
           to: dateTime('2020-02-03T01:00:00.000Z')
         }
       },
       scopedVars: {},
       targets: [],
       timezone: 'utc',
       app: CoreApp.Dashboard,
       startTime: 0,
     };
     dataSource = new DataSource(DUMMY_INSTANCE_SETTING);
     doRequestSpy = jest.spyOn(dataSource, 'doRequest')
   })

    it('should return an empty array when no targets are set', async () => {
      dummyQuery.targets = [
        {
          refId: '1',
          station: { id: undefined },
          latitude: undefined,
          longitude: undefined,
          properties: [
            'temp'
          ]
        }
      ];
      expect(dataSource.query(dummyQuery)).rejects.toThrow();
    });

    it('should throw an error if neither station nor coordinates are provided', async () => {
      dummyQuery.targets = [];
      const data = await dataSource.query(dummyQuery);
      expect(doRequestSpy).not.toHaveBeenCalled();
      expect(data).toEqual({data: []});
    });

    it('should call the station api to fetch hourly data', async () => {
      doRequestSpy.mockResolvedValueOnce({data: [
          {
            "time": "2020-02-01 00:00:00",
            "temp": 21,
            "dwpt": 17,
            "rhum": 78
          },
          {
            "time": "2020-02-01 01:00:00",
            "temp": 22,
            "dwpt": 16,
            "rhum": 77
          }
        ]})
      dummyQuery.targets = [
        {
          refId: '1',
          station: { id: 'TEST_ID' },
          latitude: undefined,
          longitude: undefined,
          properties: [
            'temp'
          ]
        }
      ];
      const result = await dataSource.query(dummyQuery);
      expect(doRequestSpy).toHaveBeenCalledWith('/v2/stations/hourly', {station: 'TEST_ID', start: '2020-02-01', end: '2020-02-03'});
      expect(result.data.length).toEqual(1);
      expect(result.data[0]).toBeInstanceOf(MutableDataFrame);
      expect(result.data[0].toJSON()).toEqual(
        expect.objectContaining({
          refId: '1',
          fields: [
            expect.objectContaining({type: 'time', values: ['2020-02-01 00:00:00', '2020-02-01 01:00:00']}),
            expect.objectContaining({name: expect.stringContaining('Temperature'), type: 'number', values: [21, 22]})
          ]
        }))
    });

    it('should call the station api to fetch daily data', async () => {
      doRequestSpy.mockResolvedValueOnce({data: [
          {
            "date": "2020-02-01",
            "tavg": 18.5,
            "tmin": 12,
            "tmax": 22,
            "dwpt": 17,
            "rhum": 78
          },
          {
            "date": "2020-02-11",
            "tavg": 18,
            "tmin": 14,
            "tmax": 24,
            "dwpt": 16,
            "rhum": 77
          }
        ]})
      dummyQuery.targets = [
        {
          refId: '1',
          station: { id: 'TEST_ID' },
          latitude: undefined,
          longitude: undefined,
          properties: [
            'temp'
          ]
        }
      ];
      dummyQuery.range = {
        from: dateTime('2020-02-01T01:00:00.000Z'),
        to: dateTime('2020-02-11T01:00:00.000Z'),
        raw: {
          from: dateTime('2020-02-01T01:00:00.000Z'),
          to: dateTime('2020-02-11T01:00:00.000Z')
        }
      }
      const result = await dataSource.query(dummyQuery);
      expect(doRequestSpy).toHaveBeenCalledWith('/v2/stations/daily', {station: 'TEST_ID', start: '2020-02-01', end: '2020-02-11'});
      expect(result.data.length).toEqual(1);
      expect(result.data[0]).toBeInstanceOf(MutableDataFrame);
      expect(result.data[0].toJSON()).toEqual(
        expect.objectContaining({
          refId: '1',
          fields: [
            expect.objectContaining({type: 'time', values: ['2020-02-01', '2020-02-11']}),
            expect.objectContaining({name: expect.stringContaining('Average Temperature'), type: 'number', values: [18.5, 18]}),
            expect.objectContaining({name: expect.stringContaining('Minimum Temperature'), type: 'number', values: [12, 14]}),
            expect.objectContaining({name: expect.stringContaining('Maximum Temperature'), type: 'number', values: [22, 24]})
          ]
        }))
    });

    it('should call the station api twice in order because of two targets', async () => {
      doRequestSpy.mockResolvedValueOnce({data: [
          {
            "time": "2020-02-01 00:00:00",
            "temp": 21,
            "dwpt": 17,
            "rhum": 78
          },
          {
            "time": "2020-02-01 01:00:00",
            "temp": 22,
            "dwpt": 16,
            "rhum": 77
          }
        ]})
      doRequestSpy.mockResolvedValueOnce({data: [
          {
            "time": "2020-02-01 00:00:00",
            "temp": 19,
            "dwpt": 15,
            "rhum": 76
          },
          {
            "time": "2020-02-01 01:00:00",
            "temp": 20,
            "dwpt": 14,
            "rhum": 75
          }
        ]})
      dummyQuery.targets = [
        {
          refId: '1',
          station: { id: 'TEST_ID' },
          latitude: undefined,
          longitude: undefined,
          properties: [
            'temp'
          ]
        },
        {
          refId: '2',
          station: { id: 'OTHER_ID' },
          latitude: undefined,
          longitude: undefined,
          properties: [
            'temp'
          ]
        }
      ];
      const result = await dataSource.query(dummyQuery);
      expect(doRequestSpy).toHaveBeenCalledWith('/v2/stations/hourly', {station: 'TEST_ID', start: '2020-02-01', end: '2020-02-03'});
      expect(doRequestSpy).toHaveBeenCalledWith('/v2/stations/hourly', {station: 'OTHER_ID', start: '2020-02-01', end: '2020-02-03'});
      expect(result.data.length).toEqual(2);
      expect(result.data[0]).toBeInstanceOf(MutableDataFrame);
      expect(result.data[0].toJSON()).toEqual(
        expect.objectContaining({
          refId: '1',
          fields: [
            expect.objectContaining({type: 'time', values: ['2020-02-01 00:00:00', '2020-02-01 01:00:00']}),
            expect.objectContaining({name: expect.stringContaining('Temperature'), type: 'number', values: [21, 22]})
          ]
        }))
      expect(result.data[1]).toBeInstanceOf(MutableDataFrame);
      expect(result.data[1].toJSON()).toEqual(
        expect.objectContaining({
          refId: '2',
          fields: [
            expect.objectContaining({type: 'time', values: ['2020-02-01 00:00:00', '2020-02-01 01:00:00']}),
            expect.objectContaining({name: expect.stringContaining('Temperature'), type: 'number', values: [19, 20]})
          ]
        }))
    });

    it('should call the point api to fetch hourly data', async () => {
      doRequestSpy.mockResolvedValueOnce({data: [
          {
            "time": "2020-02-01 00:00:00",
            "temp": 21,
            "dwpt": 17,
            "rhum": 78
          },
          {
            "time": "2020-02-01 01:00:00",
            "temp": 22,
            "dwpt": 16,
            "rhum": 77
          }
        ]})
      dummyQuery.targets = [
        {
          refId: '1',
          station: {id: undefined},
          latitude: 1234,
          longitude: 5678,
          properties: [
            'temp'
          ]
        }
      ];
      const result = await dataSource.query(dummyQuery);
      expect(doRequestSpy).toHaveBeenCalledWith('/v2/point/hourly', {start: '2020-02-01', end: '2020-02-03', lat: 1234, lon: 5678});
      expect(result.data.length).toEqual(1);
      expect(result.data[0]).toBeInstanceOf(MutableDataFrame);
      expect(result.data[0].toJSON()).toEqual(
        expect.objectContaining({
          refId: '1',
          fields: [
            expect.objectContaining({type: 'time', values: ['2020-02-01 00:00:00', '2020-02-01 01:00:00']}),
            expect.objectContaining({name: expect.stringContaining('Temperature'), type: 'number', values: [21, 22]})
          ]
        }))
    });

  });

  describe('fetchStations', () => {
    let dataSource: DataSource;
    let doRequestSpy: any;
    beforeEach(() => {
      dataSource = new DataSource(DUMMY_INSTANCE_SETTING);
      doRequestSpy = jest.spyOn(dataSource, 'doRequest')
    })
    it('should make a request to the stations api', async () => {
      const response = {
        data: [
          {
            "id": "LRFT0",
            "name": {
              "en": "Fetesti (mil)"
            },
            "country": "RO",
            "region": "CL",
            "national": null,
            "wmo": null,
            "icao": "LRFT",
            "iata": null,
            "latitude": 44.3922,
            "longitude": 27.7267,
            "elevation": 26,
            "timezone": "Europe/Bucharest",
            "active": true
          },
          {
            "id": "15444",
            "name": {
              "en": "Fetesti"
            },
            "country": "RO",
            "region": "IM",
            "national": null,
            "wmo": "15444",
            "icao": null,
            "iata": null,
            "latitude": 44.3667,
            "longitude": 27.85,
            "elevation": 58,
            "timezone": "Europe/Bucharest",
            "active": false
          }
        ]
      }
      doRequestSpy.mockResolvedValueOnce(response);

      const result = await dataSource.fetchStations('test');
      expect(doRequestSpy).toHaveBeenCalledWith('/v2/stations/search', {query: 'test'});
      expect(result).toEqual(response);
    });
  });

  describe('testDatasource', () => {
    let dataSource: DataSource;
    let fetchByStationId: any;
    beforeEach(() => {
      dataSource = new DataSource(DUMMY_INSTANCE_SETTING);
      fetchByStationId = jest.spyOn(dataSource, 'fetchByStationId')
    })
    it('should make a request to the stations api', async () => {

      fetchByStationId.mockResolvedValueOnce([]);

      const result = await dataSource.testDatasource();
      expect(fetchByStationId).toHaveBeenCalledWith('10702', expect.anything(), expect.anything(), false);
      expect(result).toEqual({
        status: 'success',
        message: 'Success',
      });
    });
  });
});
