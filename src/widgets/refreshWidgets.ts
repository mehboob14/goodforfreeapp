import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Pushes fresh data into any widgets the user has on their home screen.
// Call this when settings change or new content is loaded.
//
// Guarded so it is a no-op on iOS, web, and inside Expo Go (where the native
// widget module isn't present) — importing the module there would crash.
export async function refreshAllWidgets(): Promise<void> {
  if (Platform.OS !== 'android') return;
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;

  try {
    // Lazy require so the native module is only touched in a real build.
    const { requestWidgetUpdate } = require('react-native-android-widget');
    const React = require('react');
    const { ClockWidget } = require('./ClockWidget');
    const { FeaturedArticleWidget } = require('./FeaturedArticleWidget');
    const { ClockFeaturedWidget } = require('./ClockFeaturedWidget');
    const { getWidgetSettings, getLatestArticle, formatWidgetTime } = require('./widgetData');

    const settings = await getWidgetSettings();
    const { time, date } = formatWidgetTime(settings.use24Hour);

    await requestWidgetUpdate({
      widgetName: 'Clock',
      renderWidget: () =>
        React.createElement(ClockWidget, {
          time,
          date,
          accent: settings.accent,
          dark: settings.dark,
        }),
      widgetNotFound: () => {},
    });

    const article = await getLatestArticle();

    await requestWidgetUpdate({
      widgetName: 'Featured',
      renderWidget: () =>
        React.createElement(FeaturedArticleWidget, {
          article,
          accent: settings.accent,
          dark: settings.dark,
        }),
      widgetNotFound: () => {},
    });

    await requestWidgetUpdate({
      widgetName: 'ClockFeatured',
      renderWidget: () =>
        React.createElement(ClockFeaturedWidget, {
          time,
          date,
          article,
          accent: settings.accent,
          dark: settings.dark,
        }),
      widgetNotFound: () => {},
    });
  } catch (e) {
    console.warn('refreshAllWidgets failed', e);
  }
}
