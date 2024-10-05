//@ts-check
import { EquipmentSlot, GameMode, ItemStack, ItemUseOnBeforeEvent, system, world } from "@minecraft/server";
import { isModItem } from "../utils/namespace";

/**@param {ItemUseOnBeforeEvent} data*/
export default async function placeWater(data){
    if(data.source.getGameMode() !== GameMode.adventure && data.itemStack.typeId === "minecraft:water_bucket" && isModItem(data.block.typeId)){
        data.cancel = true;
        const
            player = data.source,
            mode = player.getGameMode(),
            block = data.block;
        //只在生存模式下清空桶
        if(mode === GameMode.survival){
            const equipment = player.getComponent("minecraft:equippable");
            if(equipment) system.run(()=>equipment.getEquipmentSlot(EquipmentSlot.Mainhand).setItem(new ItemStack("minecraft:bucket", 1)));
        }
        system.run(()=>world.playSound("bucket.empty_water", block.location));
        const
            direction = /**@type {import("./placeBlock").FourDirection}*/ (block.permutation.getState("minecraft:cardinal_direction")),
            verticalHalf = /**@type {import("./placeBlock").VerticalHalf}*/ (block.permutation.getState("minecraft:vertical_half"));
        /**@type {"0_degrees" | "90_degrees" | "180_degrees" | "270_degrees" | ""}*/
        let rotation = "";
        if(direction) switch(direction){
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
        const waitForCommand = await player.runCommandAsync(`structure load ${block.typeId.replace("abs:", "")} ${block.location.x} ${block.location.y} ${block.location.z}${rotation === "" ? "" : ` ${rotation}`}`);
        if(verticalHalf && waitForCommand.successCount > 0) block.setPermutation(block.permutation.withState("minecraft:vertical_half", verticalHalf));
    }
}