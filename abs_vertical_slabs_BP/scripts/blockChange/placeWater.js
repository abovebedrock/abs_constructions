//@ts-check
import { EntityEquippableComponent, EquipmentSlot, GameMode, ItemStack, ItemUseOnBeforeEvent, system, world } from "@minecraft/server";
import { isModItem } from "../utils/namespace";

/**@param {ItemUseOnBeforeEvent} data*/
export default function placeWater(data){
    if(data.source.typeId === "minecraft:player" && data.source.getGameMode() != GameMode.adventure && data.itemStack.typeId === "minecraft:water_bucket" && isModItem(data.block.typeId)){
        data.cancel = true;
        const player = data.source, mode = player.getGameMode();
        //只在生存模式下清空桶
        if(mode === GameMode.survival){
            const equipment = /**@type {EntityEquippableComponent | undefined}*/ (data.source.getComponent("minecraft:equippable"));
            if(equipment) system.run(()=>{
                equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(new ItemStack("minecraft:bucket", 1));
                world.playSound("bucket.empty_water", data.block.location);
            });
        }
        const direction = /**@type {"north" | "south" | "west" | "east"}*/ (data.block.permutation.getState("minecraft:cardinal_direction"));
        /**@type {"0_degrees" | "90_degrees" | "180_degrees" | "270_degrees" | ""}*/
        let rotation = "";
        switch(direction){
            case "north":
                rotation = "0_degrees";
                break;
            case "south":
                rotation = "180_degrees";
                break;
            case "west":
                rotation = "270_degrees";
                break;
            case "east":
                rotation = "90_degrees";
                break;
            default:
                console.error(`Cardinal direction get other cases: ${direction}`);
                world.sendMessage("§e您有一条新的 bug 消息，请及时查收！");
                break;
        }
        player.runCommandAsync(`structure load ${data.block.typeId.replace("abs:", "")} ${data.block.location.x} ${data.block.location.y} ${data.block.location.z} ${rotation}`);
    }
}