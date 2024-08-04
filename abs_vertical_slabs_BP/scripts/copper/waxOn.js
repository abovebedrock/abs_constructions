//@ts-check
import { BlockPermutation, ItemUseOnAfterEvent } from "@minecraft/server";
import { isInCopperCategory, isWaxed } from "./copperUtils";
import { isModItem } from "../utils/namespace";
/**@param {ItemUseOnAfterEvent} data*/
export default function waxOn(data){
    const id = data.block.typeId;
    if(isModItem(id) && isInCopperCategory(id) && !isWaxed(id) && data.itemStack.typeId == "minecraft:honeycomb"){
        const newPermutation = BlockPermutation.resolve(`abs:waxed_${id.substring(4, id.length)}`, data.block.permutation.getAllStates());
        data.block.setPermutation(newPermutation);
    }
}