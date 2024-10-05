//@ts-check
import { world } from "@minecraft/server";
import placeWater from "./placeWater";
import { combineBlock, checkWater } from "./placeBlock";
import breakBlockInit from "./breakBlock";

export default function blockChangeInit(){
    world.beforeEvents.itemUseOn.subscribe(placeWater);
    world.beforeEvents.itemUseOn.subscribe(combineBlock);
    world.beforeEvents.playerPlaceBlock.subscribe(checkWater);
    breakBlockInit();
}