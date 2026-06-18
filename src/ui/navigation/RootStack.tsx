import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RegisterDeviceScreen } from '../screens/RegisterDeviceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useDevice } from '../../state/device-store';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Gate on device registration: an unregistered phone sees the onboarding/register flow; once a device
// key is stored, the app shows the settings/status screen.
export function RootStack() {
  const registered = useDevice((s) => s.registered);

  return (
    <Stack.Navigator>
      {registered ? (
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Lupira Health' }} />
      ) : (
        <Stack.Screen name="RegisterDevice" component={RegisterDeviceScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
