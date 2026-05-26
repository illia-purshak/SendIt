import { useProfileQuery } from "@/api/auth";
import ProfilePage from "./ProfilePage";
import { ProfileRouteProvider } from "./profile-context.tsx";

const ProfileRoute = () => {
  const profileQuery = useProfileQuery();

  return (
    <ProfileRouteProvider value={profileQuery}>
      <ProfilePage />
    </ProfileRouteProvider>
  );
};
export default ProfileRoute;
