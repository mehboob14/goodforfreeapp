import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { ClockWidget } from './ClockWidget';
import { FeaturedArticleWidget } from './FeaturedArticleWidget';
import { ClockFeaturedWidget } from './ClockFeaturedWidget';
import { getWidgetSettings, getLatestArticle, formatWidgetTime } from './widgetData';

// Called by Android whenever a widget is added, updated, resized, or clicked.
// Clicks (OPEN_APP / OPEN_URI) are handled natively, so we only need to render.
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, widgetAction, renderWidget } = props;
  const name = widgetInfo.widgetName;

  if (widgetAction === 'WIDGET_DELETED' || widgetAction === 'WIDGET_CLICK') {
    return;
  }

  const settings = await getWidgetSettings();
  const { time, date } = formatWidgetTime(settings.use24Hour);

  if (name === 'Clock') {
    renderWidget(
      <ClockWidget time={time} date={date} accent={settings.accent} dark={settings.dark} />
    );
    return;
  }

  // Article-based widgets need the latest post.
  const article = await getLatestArticle();

  if (name === 'Featured') {
    renderWidget(
      <FeaturedArticleWidget article={article} accent={settings.accent} dark={settings.dark} />
    );
  } else if (name === 'ClockFeatured') {
    renderWidget(
      <ClockFeaturedWidget
        time={time}
        date={date}
        article={article}
        accent={settings.accent}
        dark={settings.dark}
      />
    );
  } else {
    // Unknown widget name — render the clock as a safe fallback.
    renderWidget(
      <ClockWidget time={time} date={date} accent={settings.accent} dark={settings.dark} />
    );
  }
}
