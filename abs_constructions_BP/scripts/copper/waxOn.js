//@ts-check
import { BlockPermutation, EntityComponentTypes, EntityEquippableComponent, EquipmentSlot, ItemUseOnBeforeEvent, system, world } from "@minecraft/server";
import { isInCopperCategory, isWaxed } from "./copperUtils";
import { isModItem } from "../utils/namespace";

/**@param {ItemUseOnBeforeEvent} data*/
export default function waxOn(data){
    const id = data.block.typeId;
    if(isModItem(id) && isInCopperCategory(id) && !isWaxed(id) && data.itemStack && data.itemStack.typeId === "minecraft:honeycomb") system.run(()=>{
        const
            id = data.block.typeId,
            /**@type {import("@minecraft/server").Vector3}*/
            center = {
                x: data.block.location.x + 0.5,
                y: data.block.location.y + 0.5,
                z: data.block.location.z + 0.5
            },
            hand = data.source.getComponent(EntityComponentTypes.Equippable).getEquipmentSlot(EquipmentSlot.Mainhand),
            newPermutation = BlockPermutation.resolve(id.replace("abs:", "abs:waxed_").replace("__", "__waxed_"), data.block.permutation.getAllStates());
        data.block.setPermutation(newPermutation);
        world.playSound("copper.wax.on", center);
        data.block.dimension.spawnParticle("abs:wax_on", center);
        if(data.itemStack.amount > 1){
            const newItem = data.itemStack.clone();
            newItem.amount--;
            hand.setItem(newItem);
        }
        else hand.setItem();
    });
}