//@ts-check
import { PlayerPlaceBlockBeforeEvent, world } from "@minecraft/server";
import { isModItem } from "../utils/namespace";

/**@param {PlayerPlaceBlockBeforeEvent} data*/
export default function placeBlock(data){
    if(isModItem(data.permutationBeingPlaced.type.id)){
        //1.判断在哪一半并放置那一半的半砖（计划1.2.0加入）
        //2.判断是否为合并操作（计划1.2.0加入）
        //判断是否需要含水
        if((data.block.typeId === "minecraft:water" && data.block.permutation.getState("liquid_depth") === 0) || data.block.isWaterlogged){
            const direction = /**@type {"north" | "south" | "west" | "east"}*/ (data.permutationBeingPlaced.getState("minecraft:cardinal_direction"));
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
            data.player.runCommandAsync(`structure load ${data.permutationBeingPlaced.type.id.replace("abs:", "")} ${data.block.location.x} ${data.block.location.y} ${data.block.location.z} ${rotation}`);
        }
    }
}