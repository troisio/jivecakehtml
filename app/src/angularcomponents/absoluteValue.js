export default ['$window', function($window) {
  return function(value) {
    return $window.Math.abs(value);
  };
}];