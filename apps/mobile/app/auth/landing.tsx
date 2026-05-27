import { Redirect } from 'expo-router';

/** Signed-out users go to sign-in; project gallery is the home tab after auth. */
export default function AuthLandingRoute() {
  return <Redirect href="/auth/sign-in" />;
}
