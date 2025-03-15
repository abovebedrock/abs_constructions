import { world } from "@minecraft/server";
import deoxidizeCB from "./deoxidize";
import waxOn from "./waxOn";
import waxOff from "./waxOff";
import lightningDeoxidize from "./lightningDeoxidize";
import oxidizeInit from "./oxidize";

export default function copperInit(){
    world.beforeEvents.itemUseOn.subscribe(deoxidizeCB);
    world.beforeEvents.itemUseOn.subscribe(waxOn);
    world.beforeEvents.itemUseOn.subscribe(waxOff);
    world.afterEvents.entitySpawn.subscribe(lightningDeoxidize);
    oxidizeInit();
}