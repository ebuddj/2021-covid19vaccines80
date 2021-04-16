import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson-client';

import * as d3 from 'd3';

import constants from './Constants.jsx';

let timer, g, path;

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = getHashValue('l') ? getHashValue('l') : 'en';
const area = getHashValue('area') ? getHashValue('area') : '';

const projection = (area === 'erno') ? d3.geoAzimuthalEquidistant().center([25,46]).scale(3000) : d3.geoAzimuthalEquidistant().center([33,57]).scale(800);
const data_file_name = (area === 'erno') ? 'data - data.csv' : 'data - data.csv';
const multiplier = (area === 'erno') ? 8 : 3;

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{}
    }
  }
  componentDidMount() {
    d3.csv('./data/' + data_file_name).then((data) => {
      this.setState((state, props) => ({
        data:data,
        type:'first_dose',
        show:'name',
        title:'First Dose, people over the age of 80'
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 720;
    let height = 720;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/europe.topojson').then((topology) => {
      g.selectAll('path').data(topojson.feature(topology, topology.objects.europe).features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('class', style.path)
        .style('stroke', (d, i) => {
          return '#999';
        })
        .attr('fill', (d, i) => {
          return this.getAreaColor(d.properties.NAME);
        });

      g.append('path').datum({type:'Polygon',properties:{'NAME':'Kosovo'},coordinates:constants.kosovo})
        .attr('d', path)
        .attr('fill', '#f5f5f5')
        .attr('class', style.kosovo)

      g.selectAll('circle').data(this.state.data)
        .enter()
        .append('circle')
        .attr('cx', (d, i) => {
          return projection([constants.areaInfo[d.country].Long, constants.areaInfo[d.country].Lat])[0];
        })
        .attr('cy', (d, i) => {
          return projection([constants.areaInfo[d.country].Long, constants.areaInfo[d.country].Lat])[1];
        })
        .attr('r', (d, i) => {
          return 0;
        })
        .attr('class', style.circle)
        .style('fill', 'rgba(255, 82, 51, 0.75)');

      g.selectAll('text').data(this.state.data)
        .enter()
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('alignment-baseline', 'central')
        .attr('class', style.number)
        .attr('x', (d, i) => {
          return projection([constants.areaInfo[d.country].Long, constants.areaInfo[d.country].Lat])[0] + 0.3;
        })
        .attr('y', (d, i) => {
          return projection([constants.areaInfo[d.country].Long, constants.areaInfo[d.country].Lat])[1] + 1;
        })
        .html('')

      // Show single dose and country name
      this.changeAreaAttributes();

      // Show single dose and value
      timer = setTimeout(() => {
        this.setState((state, props) => ({
          show:'value'
        }), this.changeAreaAttributes);
        timer = setTimeout(() => {
          // Show single dose and value
          this.setState((state, props) => ({
            type:'full_vaccination',
            show:'name',
            title:'Full Vaccination, people over the age of 80'
          }), this.changeAreaAttributes);
          timer = setTimeout(() => {
            this.setState((state, props) => ({
              show:'value'
            }), this.changeAreaAttributes);
          }, 3000);
        }, 6000);
      }, 3000);
    });
  }
  changeAreaAttributes() {
    // Change fill color.
    g.selectAll('path')
      .attr('fill', (d, i) => {
        return this.getAreaColor(d.properties.NAME);
      });
    g.selectAll('circle')
      .attr('r', (d, i) => {
        return Math.sqrt(d[this.state.type]) * multiplier;
      });
    g.selectAll('text')
      .style('font-size', (d, i) => {
        return (Math.sqrt(d[this.state.type]) * (multiplier - 0.5)) + 'px';
      })
      .html((d, i) => {
        if (this.state.show === 'name') {
          return constants.areaInfo[d.country].abbr;
        }
        else if (this.state.show === 'value') {
          return parseInt(d[this.state.type]);
        }
        else {
          return '';
        }
      });
  }
  getAreaColor(area) {
    if (_.find(this.state.data, (item) => { return item.country === area; }) && _.find(this.state.data, (item) => { return item.country === area; })[this.state.type] > 0) {
      return '#f5f5f5';
    }
    else {
      return '#fff';
    }
  }
  componentWillUnMount() {
  }
  render() {
    return (
      <div className={style.plus}>
        <h3>{this.state.title} as of 14.4.2021</h3>
        <div className={style.map_container}></div>
      </div>
    );
  }
}
export default App;