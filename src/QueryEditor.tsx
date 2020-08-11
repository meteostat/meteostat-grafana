import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { Button, LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery, PropertiesMap } from './types';

const { FormField, Select } = LegacyForms;

type Props = QueryEditorProps<DataSource, MyQuery, MyDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onStationIdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, stationId: event.target.value });
    onRunQuery();
  };

  onLatitudeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, latitude: parseFloat(event.target.value) });
    // executes the query
    onRunQuery();
  };

  onLongitudeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, longitude: parseFloat(event.target.value) });
    // executes the query
    onRunQuery();
  };

  onPropertyChange = (event: SelectableValue, index: number) => {
    const { onChange, query, onRunQuery } = this.props;
    const properties = JSON.parse(JSON.stringify(query.properties));
    properties[index] = event.value;
    onChange({ ...query, properties });
    // executes the query
    onRunQuery();
  };

  onPropertyRemoved = (index: number) => {
    const { onChange, query, onRunQuery } = this.props;
    const propertiesBefore = query.properties.slice(0, index);
    const propertiesAfter = query.properties.slice(index + 1);
    onChange({ ...query, properties: [...propertiesBefore, ...propertiesAfter] });
    // executes the query
    onRunQuery();
  };

  onAddProperty = () => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, properties: [...query.properties, ''] });
    // executes the query
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { stationId, latitude, longitude, properties } = query;

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
          <FormField
            width={10}
            value={stationId}
            onChange={this.onStationIdChange}
            label="StationId"
            placeholder="Weather Station Id"
            type="string"
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
