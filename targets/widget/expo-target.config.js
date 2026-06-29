/** @type {import('@bacons/apple-targets').Config} */
module.exports = {
  type: 'widget',
  name: 'GoodForFree',
  // iOS 17+ for the modern WidgetKit container background + lock-screen accessories.
  deploymentTarget: '17.0',
  frameworks: ['SwiftUI', 'WidgetKit'],
};
