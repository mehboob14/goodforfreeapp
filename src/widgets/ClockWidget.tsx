import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { widgetColors } from './widgetData';

export interface ClockWidgetProps {
  time: string;
  date: string;
  accent: string;
  dark: boolean;
}

// A clean digital clock widget. Tapping it opens the app.
export function ClockWidget({ time, date, accent, dark }: ClockWidgetProps) {
  const c = widgetColors(dark);
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: c.bg as `#${string}`,
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <TextWidget
        text={time}
        style={{ fontSize: 44, fontWeight: '300', color: c.text as `#${string}` }}
      />
      <TextWidget
        text={date}
        maxLines={1}
        truncate="END"
        style={{ fontSize: 14, color: c.muted as `#${string}`, marginTop: 2 }}
      />
      <FlexWidget
        style={{
          height: 3,
          width: 44,
          borderRadius: 2,
          marginTop: 10,
          backgroundColor: accent as `#${string}`,
        }}
      />
    </FlexWidget>
  );
}
