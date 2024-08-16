//@ts-check
import { ItemUseOnBeforeEvent, system, world } from "@minecraft/server";
import { canDeoxidize, getStage, setStage } from "./copperUtils";
import { isModItem } from "../utils/namespace";
import durability from "../utils/durability";
import { randomInt } from "../utils/random";

/**@param {ItemUseOnBeforeEvent} data*/
export default function deoxidize(data){
    const id = data.block.typeId;
    if(
        data.itemStack && isModItem(id) && canDeoxidize(id)
     && (
            data.itemStack.typeId === "minecraft:wooden_axe"
         || data.itemStack.typeId === "minecraft:stone_axe"
         || data.itemStack.typeId === "minecraft:iron_axe"
         || data.itemStack.typeId === "minecraft:golden_axe"
         || data.itemStack.typeId === "minecraft:diamond_axe"
         || data.itemStack.typeId === "minecraft:netherite_axe"
        )
    ) system.run(()=>{
        setStage(data.block, /**@type {import("./copperUtils").stageNumber}*/ (getStage(data.block.typeId) - 1));
        durability(data.source);
        /**@type {import("@minecraft/server").Vector3}*/
        const center = {
            x: data.block.location.x + 0.5,
            y: data.block.location.y + 0.5,
            z: data.block.location.z + 0.5
        };
        world.playSound("scrape", center, {
            volume: 1.0,
            pitch: randomInt(8, 12) / 10
        });
        data.block.dimension.spawnParticle("abs:deoxidize", center);
    });
}