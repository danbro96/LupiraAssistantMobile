// Must be first: polyfill global `crypto` (for uuid) before any module that mints an id loads.
import './src/polyfills/crypto';

// gesture-handler must be imported once, before any react-native rendering, in the entry file.
import 'react-native-gesture-handler';

// Register the background TaskManager tasks at module top level (BEFORE React renders). The OS may
// spin up a bare JS context to run these with no app UI, so the defineTask() calls must run during
// the cold start of that context — importing them here guarantees that.
import './src/collector/location-task';
import './src/sync/background-upload-task';

import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App) and sets up the
// environment for both Expo Go and native builds.
registerRootComponent(App);
