import type { Route } from "./+types/home";
import { Dashboard } from "../pages/dashboard";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Gym Tracker" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <Dashboard />;
}
