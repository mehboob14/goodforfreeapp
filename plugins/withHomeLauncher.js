// Config plugin: makes MainActivity eligible as an Android home launcher by
// adding a MAIN + HOME + DEFAULT intent-filter. The user still has to choose
// GoodForFree as their default Home app (we open that settings screen in-app).
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withHomeLauncher(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app || !app.activity) return cfg;

    const main = app.activity.find(
      (a) => a.$?.['android:name'] === '.MainActivity'
    );
    if (!main) return cfg;

    main['intent-filter'] = main['intent-filter'] || [];

    const alreadyHasHome = main['intent-filter'].some((f) =>
      (f.category || []).some(
        (c) => c.$?.['android:name'] === 'android.intent.category.HOME'
      )
    );
    if (alreadyHasHome) return cfg;

    main['intent-filter'].push({
      action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
      category: [
        { $: { 'android:name': 'android.intent.category.HOME' } },
        { $: { 'android:name': 'android.intent.category.DEFAULT' } },
      ],
    });

    return cfg;
  });
};
