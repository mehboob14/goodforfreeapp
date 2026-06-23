import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';
import type { ImageWidgetSource } from 'react-native-android-widget';
import { Article } from '../api/wordpress';
import { widgetColors } from './widgetData';

export interface ClockFeaturedWidgetProps {
  time: string;
  date: string;
  article: Article | null;
  accent: string;
  dark: boolean;
}

// The flagship widget: a clock on top + the latest article below (advertising).
// The clock area opens the app; the article area deep-links to that article.
export function ClockFeaturedWidget({
  time,
  date,
  article,
  accent,
  dark,
}: ClockFeaturedWidgetProps) {
  const c = widgetColors(dark);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.bg as `#${string}`,
        borderRadius: 24,
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Clock row */}
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text={time}
            style={{ fontSize: 30, fontWeight: '300', color: c.text as `#${string}` }}
          />
          <TextWidget
            text={date}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 12, color: c.muted as `#${string}`, marginTop: 2 }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            height: 34,
            width: 34,
            borderRadius: 17,
            backgroundColor: accent as `#${string}`,
          }}
        />
      </FlexWidget>

      {/* Article row */}
      {article ? (
        <FlexWidget
          clickAction="OPEN_URI"
          clickActionData={{ uri: `goodforfree://article/${article.id}` }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: c.surfaceAlt as `#${string}`,
            marginHorizontal: 10,
            marginBottom: 10,
            borderRadius: 16,
            padding: 10,
          }}
        >
          {article.imageUrl ? (
            <ImageWidget
              image={article.imageUrl as ImageWidgetSource}
              imageWidth={160}
              imageHeight={160}
              radius={12}
              style={{ height: 54, width: 54 }}
            />
          ) : null}
          <FlexWidget style={{ flex: 1, flexDirection: 'column', marginLeft: 10 }}>
            <TextWidget
              text={(article.categories[0] || 'Featured').toUpperCase()}
              maxLines={1}
              style={{ fontSize: 10, fontWeight: 'bold', color: accent as `#${string}` }}
            />
            <TextWidget
              text={article.title}
              maxLines={2}
              truncate="END"
              style={{ fontSize: 13, fontWeight: '600', color: c.text as `#${string}`, marginTop: 2 }}
            />
          </FlexWidget>
        </FlexWidget>
      ) : null}
    </FlexWidget>
  );
}
