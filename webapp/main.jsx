'use strict';
var React = require('react');
var ReactDOM = require('react-dom');

var LeafletMap = require('./components/LeafletMap.jsx');
var _ = require('underscore');

breweries = _.filter(breweries.features, function (brewery) {
    return brewery.geometry.type === 'Point';
});

require('bootstrap_css');

ReactDOM.render(<LeafletMap breweries={{features: breweries}}/>, document.getElementById('wrapper'));


