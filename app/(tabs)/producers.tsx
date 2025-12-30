import { useEffect } from "react";
import { router } from "expo-router";

export default function ProducersTab() {
  useEffect(() => {
    router.replace("/producers");
  }, []);

  return null;
}
