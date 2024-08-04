//@ts-check
import { BlockPermutation, ItemUseOnAfterEvent } from "@minecraft/server";
import { isInCopperCategory, isWaxed } from "./copperUtils";
import { isModItem } from "../utils/namespace";
/**@param {ItemUseOnAfterEvent} data*/
export default function waxOff(data){
    const id = data.block.typeId, itemId = data.itemStack.typeId;
    if(
        isModItem(id) && isInCopperCategory(id) && isWaxed(id)
     && (
            itemId == "minecraft:wooden_axe"
         || itemId == "minecraft:stone_axe"
         || itemId == "minecraft:iron_axe"
         || itemId == "minecraft:golden_axe"
         || itemId == "minecraft:diamond_axe"
         || itemId == "minecraft:netherite_axe"
        )
    ){
        const newPermutation = BlockPermutation.resolve(id.replace("waxed_", ""), data.block.permutation.getAllStates());
        data.block.setPermutation(newPermutation);
    }
}