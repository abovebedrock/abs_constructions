//@ts-check
import { ItemUseOnAfterEvent } from "@minecraft/server";
import { canDeoxidize, getStage, setStage } from "./copperUtils";
import { isModItem } from "../utils/namespace";
/**@param {ItemUseOnAfterEvent} data*/
export default function deoxidize(data){
    const id = data.block.typeId;
    if(
        isModItem(id) && canDeoxidize(id) && getStage(id) > 0
     && (
            data.itemStack.typeId == "minecraft:wooden_axe"
         || data.itemStack.typeId == "minecraft:stone_axe"
         || data.itemStack.typeId == "minecraft:iron_axe"
         || data.itemStack.typeId == "minecraft:golden_axe"
         || data.itemStack.typeId == "minecraft:diamond_axe"
         || data.itemStack.typeId == "minecraft:netherite_axe"
        )
    ) setStage(data.block, /**@type {import("./copperUtils").stageNumber}*/ (getStage(data.block.typeId) - 1));
}