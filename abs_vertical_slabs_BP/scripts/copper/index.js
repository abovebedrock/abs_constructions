//@ts-check
import { system, world } from "@minecraft/server";
import oxidize from "./oxidize";
import deoxidize from "./deoxidize";
import waxOn from "./waxOn";
import waxOff from "./waxOff";
import lightningDeoxidize from "./lightningDeoxidize";
export default function copperInit(){
    system.afterEvents.scriptEventReceive.subscribe(oxidize);
    world.afterEvents.itemUseOn.subscribe(deoxidize);
    world.afterEvents.itemUseOn.subscribe(waxOn);
    world.afterEvents.itemUseOn.subscribe(waxOff);
    world.afterEvents.entitySpawn.subscribe(lightningDeoxidize);
}