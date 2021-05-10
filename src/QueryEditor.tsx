import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { MultiSelect, InlineFieldRow, InlineField, AsyncSelect, Input } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, MyQuery, PropertiesMap } from './types';

// This is a temporary work-around for a styling issue related to the new Input component.
// For more information, refer to https://github.com/grafana/grafana/issues/26512.
import {} from '@emotion/core';

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
      .filter((station) => station.active)
      .map((station) => {
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

  onPropertiesChange = (v: Array<SelectableValue<string>>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, properties: v.map((_) => _.value!) ?? [] });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { station, latitude, longitude, properties } = query;

    return (
      <>
        <InlineFieldRow>
          <InlineField label="Weather station" labelWidth={15}>
            <AsyncSelect
              width={30}
              isClearable
              value={station}
              isLoading={this.state.isLoadingStations}
              loadOptions={this.searchStations}
              noOptionsMessage="No stations found"
              onChange={this.onSearchStationSelected}
            />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Latitude" labelWidth={10}>
            <Input width={30} value={latitude || ''} onChange={this.onLatitudeChange} />
          </InlineField>
          <InlineField label="Longitude" labelWidth={10}>
            <Input width={30} value={longitude || ''} onChange={this.onLongitudeChange} />
          </InlineField>
        </InlineFieldRow>
        <InlineFieldRow>
          <InlineField label="Properties" labelWidth={10}>
            <MultiSelect
              width={71}
              value={properties}
              onChange={(v) => this.onPropertiesChange(v)}
              placeholder="Property"
              options={Object.values(PropertiesMap)}
            />
          </InlineField>
        </InlineFieldRow>
      </>
    );
  }
}
