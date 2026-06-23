import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App)
// and ensures the environment is set up appropriately for both Expo Go and native builds.
registerRootComponent(App);

// Home-screen widgets are Android-only and require a development/production build.
// They do NOT run in Expo Go, so we guard the native import to avoid crashing
// the app in Expo Go, on iOS, or on web.
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (Platform.OS === 'android' && !inExpoGo) {
  try {
    const { registerWidgetTaskHandler } = require('react-native-android-widget');
    const { widgetTaskHandler } = require('./src/widgets/widget-task-handler');
    registerWidgetTaskHandler(widgetTaskHandler);
  } catch (e) {
    console.warn('Widget task handler not registered:', e);
  }
}
