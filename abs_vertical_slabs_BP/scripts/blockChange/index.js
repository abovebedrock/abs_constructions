//@ts-check
import { world } from "@minecraft/server";
import placeWater from "./placeWater";
import placeBlock from "./placeBlock";
import collectWater from "./collectWater";
import breakBlockInit from "./breakBlock";

export default function blockChangeInit(){
    world.beforeEvents.itemUseOn.subscribe(placeWater);
    world.beforeEvents.playerPlaceBlock.subscribe(placeBlock);
    //world.beforeEvents.itemUseOn.subscribe(collectWater);
    breakBlockInit();
}