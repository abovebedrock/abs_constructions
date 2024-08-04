//@ts-check
import { system, world } from "@minecraft/server";
import copperInit from "./copper/index";
import waterlogInit from "./blockChange/index";

copperInit();
waterlogInit();

//world.beforeEvents.entityRemove.subscribe(data=>{
//    if(data.removedEntity.typeId == "minecraft:fireworks_rocket"){
//        const e = data.removedEntity.dimension, t = data.removedEntity.location;
//        system.run(()=>{
//            e.createExplosion(t, 10, {
//                allowUnderwater: true,
//                breaksBlocks: true,
//                causesFire: true
//            });
//        });
//    }
//});