"use client";

import dynamic from "next/dynamic";

const DroneScene = dynamic(
  () => import("../3d/DroneScene").then((module) => module.DroneScene),
  {
    ssr: false,
    loading: () => (
      <div className="drone-scene drone-loading" aria-label="Загрузка трехмерной модели квадрокоптера">
        <span>3D / ЗАГРУЗКА</span>
      </div>
    ),
  },
);

export function DroneStage() {
  return <DroneScene />;
}
