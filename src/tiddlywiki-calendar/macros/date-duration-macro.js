/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/**
Get duration as 1D 2H 3M 4S

<<date-duration-macro startDate:"20230103223000000" endDate:"20230104033000000" >>
*/

exports.name = 'date-duration-macro';

const msPerHour = 1000 * 60 * 60;
const msPerMinute = 1000 * 60;

exports.params = [
  { name: 'startDate', default: '' },
  { name: 'endDate', default: '' },
];

exports.run = (startDateString, endDateString) => {
  const startDate = $tw.utils.parseDate(startDateString);
  const endDate = $tw.utils.parseDate(endDateString);
  const diff = endDate - startDate;
  return `${String(Math.floor(diff / msPerHour)).padStart(2, '0')}:${String(Math.floor((diff % msPerHour) / msPerMinute)).padStart(2, '0')}`;
};
