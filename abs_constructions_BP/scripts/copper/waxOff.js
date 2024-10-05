//@ts-check
import { BlockPermutation, ItemUseOnBeforeEvent, system, world } from "@minecraft/server";
import { isInCopperCategory, isWaxed } from "./copperUtils";
import { isModItem } from "../utils/namespace";
import durability from "../utils/durability";

/**@param {ItemUseOnBeforeEvent} data*/
export default function waxOff(data){
    const id = data.block.typeId, itemId = data.itemStack?.typeId;
    if(
        isModItem(id) && isInCopperCategory(id) && isWaxed(id)
     && (
            itemId === "minecraft:wooden_axe"
         || itemId === "minecraft:stone_axe"
         || itemId === "minecraft:iron_axe"
         || itemId === "minecraft:golden_axe"
         || itemId === "minecraft:diamond_axe"
         || itemId === "minecraft:netherite_axe"
        )
    ) system.run(()=>{
        const 
            newPermutation = BlockPermutation.resolve(id.replaceAll("waxed_", ""), data.block.permutation.getAllStates()),
            /**@type {import("@minecraft/server").Vector3}*/
            center = {
                x: data.block.location.x + 0.5,
                y: data.block.location.y + 0.5,
                z: data.block.location.z + 0.5
            };
        data.block.setPermutation(newPermutation);
        durability(data.source);
        world.playSound("copper.wax.off", center);
        data.block.dimension.spawnParticle("abs:wax_off", center);
    });
}