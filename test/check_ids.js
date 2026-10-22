const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const ids = [
  'resultCard',
  'resDistanceText',
  'resDurationText',
  'resFareAmount',
  'resFareSubtext',
  'resRoutingModeBadge',
  'resVehicleNotice',
  'resVehicleNoticeText',
  'resNegotiationScript',
  'resUberMotoFare',
  'resUberCngFare',
  'resUberCarFare',
  'resUberTipText',
  'optionsComparisonGrid',
  'journeyStepsCard',
  'journeyStepsList',
  'selectedOptionBadge',
  'fareBreakdownBox',
  'bargainingAdviceBox',
  'startInput',
  'endInput',
  'startClearBtn',
  'endClearBtn',
  'startSuggestions',
  'endSuggestions',
  'routeNoMatchAlert',
  'routeNoMatchMsg',
  'dropdownFallbackContainer',
  'dropdownChevronIcon',
  'startSelect',
  'endSelect',
  'quickPillsContainer',
  'routeValidationNotice',
  'routeValidationText',
  'mapRouteStatusBadge',
  'routeMap',
  'btnCalculateFare'
];

ids.forEach(id => {
  const inHtml = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  console.log(`${id}: ${inHtml ? 'FOUND' : 'MISSING'}`);
});
