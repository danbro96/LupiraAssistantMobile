import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RegisterDeviceScreen } from '../screens/RegisterDeviceScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { useDevice } from '../../state/device-store';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Gated on device registration: register flow until a device key is stored, then settings.
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
