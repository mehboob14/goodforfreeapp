import React from 'react';
import { FlexWidget, TextWidget, ImageWidget } from 'react-native-android-widget';
import type { ImageWidgetSource } from 'react-native-android-widget';
import { Article } from '../api/wordpress';
import { widgetColors } from './widgetData';

export interface FeaturedArticleWidgetProps {
  article: Article | null;
  accent: string;
  dark: boolean;
}

// Advertises the latest article. Tapping deep-links into that article in the app.
export function FeaturedArticleWidget({ article, accent, dark }: FeaturedArticleWidgetProps) {
  const c = widgetColors(dark);

  if (!article) {
    return (
      <FlexWidget
        clickAction="OPEN_APP"
        style={{
          height: 'match_parent',
          width: 'match_parent',
          backgroundColor: c.surface as `#${string}`,
          borderRadius: 24,
          padding: 16,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget
          text="GoodForFree"
          style={{ fontSize: 16, fontWeight: 'bold', color: c.text as `#${string}` }}
        />
        <TextWidget
          text="Tap to open"
          style={{ fontSize: 13, color: c.muted as `#${string}`, marginTop: 4 }}
        />
      </FlexWidget>
    );
  }

  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri: `goodforfree://article/${article.id}` }}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.surface as `#${string}`,
        borderRadius: 24,
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {article.imageUrl ? (
        <ImageWidget
          image={article.imageUrl as ImageWidgetSource}
          imageWidth={500}
          imageHeight={260}
          style={{ height: 120, width: 'match_parent' }}
        />
      ) : null}
      <FlexWidget style={{ flexDirection: 'column', padding: 12 }}>
        <TextWidget
          text={(article.categories[0] || 'Featured').toUpperCase()}
          maxLines={1}
          style={{ fontSize: 11, fontWeight: 'bold', color: accent as `#${string}` }}
        />
        <TextWidget
          text={article.title}
          maxLines={2}
          truncate="END"
          style={{ fontSize: 15, fontWeight: '600', color: c.text as `#${string}`, marginTop: 4 }}
        />
        <TextWidget
          text="Read on GoodForFree →"
          maxLines={1}
          style={{ fontSize: 12, color: c.muted as `#${string}`, marginTop: 8 }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
