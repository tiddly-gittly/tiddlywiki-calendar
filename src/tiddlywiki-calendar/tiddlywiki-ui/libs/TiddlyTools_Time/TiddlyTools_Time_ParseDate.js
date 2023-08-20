/**
''Defines filter operators that convert date-formatted input values to another date format.''

* parsedate[]
  converts date-formatted input values to 17-digit TWCore UTC datetime output
* parsedate[YYYY0MM0DD0hh0mm0ss0XXX]
  converts date-formatted input values to 17-digit TWCore local datetime output
* parsedate[outputformat]
  converts date-formatted input values to TWCore date-formatted text output
* unixtime[] (or parsedate[unixtime])
  converts date-formatted input values to "unix time" signed integer output.
* unixtime[outputformat] (or parsedate:unixtime[outputformat])
  converts "unix time" signed integer input values to TWCore date-formatted text output
* unixtime[YYYY0MM0DD0hh0mm0ss0XXX]
  converts "unix time" signed integer input values to 17-digit TWCore local datetime output
* parsedate:unixtime[]
  converts "unix time" signed integer input values to 17-digit TWCore UTC datetime output

See TiddlyTools/Time/Info for usage details
*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

exports.parsedate = function(source,operator,options) {
   var format  = operator.operand || "[UTC]YYYY0MM0DD0hh0mm0ss0XXX", dt, results = [];
   source(function(tiddler,title) {
      if (title.match(/^-?\d+$/)) dt=((operator.suffix=="unixtime")||(operator.suffix=="number"))?new Date(Number(title)):$tw.utils.parseDate(title);
      else                        dt=new Date(title.replace(/(\d+)(st|nd|rd|th)/g,"$1").replace(/,/g,""));
      if (format=="unixtime")    results.push(dt.getTime().toString());
      else if (format=="number") results.push(dt.getTime().toString());
      else                       results.push($tw.utils.formatDateString(dt,format));
   });
   return results;
};

exports.unixtime = function(source,operator,options) {
   var format  = operator.operand || "", dt, results = [];
   source(function(tiddler,title) {
      if (title.match(/^-?\d+$/)) dt=new Date(Number(title));
      else                        dt=new Date(title.replace(/(\d+)(st|nd|rd|th)/g,"$1").replace(/,/g,""));
      if (format=="") results.push(dt.getTime().toString());
      else            results.push($tw.utils.formatDateString(dt,format));
   });
   return results;
};

})();