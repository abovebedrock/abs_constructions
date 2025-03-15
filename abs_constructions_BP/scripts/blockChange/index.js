import { world } from "@minecraft/server";
import placeWater from "./placeWater";
import { combineBlock } from "./placeBlock";
import breakBlockInit from "./breakBlock";

export default function blockChangeInit(){
    world.beforeEvents.itemUseOn.subscribe(placeWater);
    world.beforeEvents.itemUseOn.subscribe(combineBlock);
    breakBlockInit();
}