"use client";

import Floor    from "./structure/Floor";
import Walls    from "./structure/Walls";
import Moulding from "./structure/Moulding";

import Desk           from "./furniture/Desk";
import Bed            from "./furniture/Bed";
import Storage, { DrawerChest } from "./furniture/Storage";
import SunbathingDog  from "./furniture/SunbathingDog";
import DogBowls       from "./furniture/DogBowls";
import Nightstand     from "./furniture/Nightstand";
import Trashcan       from "./furniture/Trashcan";
import Plants         from "./decorations/Plants";

export default function Room() {
  return (
    <group>
      <Floor />
      <Walls />
      <Moulding />
      <Desk />
      <Bed />
      <Nightstand />
      <Trashcan />
      <DrawerChest />
      <Storage />
      <SunbathingDog />
      <DogBowls />
      <Plants />
    </group>
  );
}
