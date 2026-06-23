import { NativeModule, requireNativeModule } from 'expo';

declare class GffnativeModule extends NativeModule<{}> {}

export default requireNativeModule<GffnativeModule>('Gffnative');
