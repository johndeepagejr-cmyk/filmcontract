import { useEffect } from "react";
import { router } from "expo-router";

export default function ActorsTab() {
  useEffect(() => {
    router.replace("/actors");
  }, []);

  return null;
}
