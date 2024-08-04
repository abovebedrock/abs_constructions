//@ts-check
import { world } from "@minecraft/server";
import placeWater from "./placeWater";
import placeBlock from "./placeBlock";
import collectWater from "./collectWater";

export default function waterlogInit(){
    world.beforeEvents.itemUseOn.subscribe(placeWater);
    //@ts-ignore 纯粹是扩展更新不过来的事情
    world.beforeEvents.playerPlaceBlock.subscribe(placeBlock);
    //world.beforeEvents.itemUseOn.subscribe(collectWater);
}