'use strict';

angular.module('esgApp.version', [
  'esgApp.version.interpolate-filter',
  'esgApp.version.version-directive'
])

.value('version', '0.1');
