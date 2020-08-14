import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { AsyncSelect, Button, LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery, PropertiesMap } from './types';

const { FormField, Select } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  state = {
    isLoadingStations: false,
  };

  onSearchStationSelected = async (station: SelectableValue) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, station });
    onRunQuery();
  };

  searchStations = async (searchTerm: string): Promise<Array<SelectableValue<string>>> => {
    const { datasource } = this.props;
    if (searchTerm.length < 3) {
      return [];
    }
    this.setState({ ...this.state, isLoadingStations: true });
    const result = await datasource.fetchStations(searchTerm);
    this.setState({ ...this.state, isLoadingStations: false });
    return result.data
      .filter(station => station.active)
      .map(station => {
        return { label: station.name['en'], value: station.id, id: station.id };
      });
  };

  onLatitudeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, latitude: parseFloat(event.target.value) });
    onRunQuery();
  };

  onLongitudeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, longitude: parseFloat(event.target.value) });
    onRunQuery();
  };

  onPropertyChange = (event: SelectableValue, index: number) => {
    const { onChange, query, onRunQuery } = this.props;
    const properties = JSON.parse(JSON.stringify(query.properties));
    properties[index] = event.value;
    onChange({ ...query, properties });
    onRunQuery();
  };

  onPropertyRemoved = (index: number) => {
    const { onChange, query, onRunQuery } = this.props;
    const propertiesBefore = query.properties.slice(0, index);
    const propertiesAfter = query.properties.slice(index + 1);
    onChange({ ...query, properties: [...propertiesBefore, ...propertiesAfter] });
    onRunQuery();
  };

  onAddProperty = () => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, properties: [...query.properties, ''] });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { station, latitude, longitude, properties } = query;

    const renderProperties = properties.map((property, index) => {
      return (
        <div className="gf-form-inline">
          <Select
            width={10}
            value={PropertiesMap[property]}
            onChange={event => this.onPropertyChange(event, index)}
            placeholder="Property"
            options={Object.values(PropertiesMap)}
          />
          <Button onClick={() => this.onPropertyRemoved(index)}>-</Button>
        </div>
      );
    });

    return (
      <div className="gf-form">
        <div className="gf-form-group">
          <AsyncSelect
            width={30}
            isClearable
            value={station}
            isLoading={this.state.isLoadingStations}
            loadOptions={this.searchStations}
            noOptionsMessage="No stations found"
            onChange={this.onSearchStationSelected}
            placeholder="Weather Station"
          />
          <div className="gf-form-inline">
            <FormField
              labelWidth={10}
              value={latitude || ''}
              onChange={this.onLatitudeChange}
              label="Latitude"
              placeholder="Latitude"
            />
            <FormField
              labelWidth={10}
              value={longitude || ''}
              onChange={this.onLongitudeChange}
              label="Longitude"
              placeholder="Longitude"
            />
          </div>
          Properties
          {renderProperties}
          <Button onClick={this.onAddProperty}>+</Button>
        </div>
      </div>
    );
  }
}
