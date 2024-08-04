//@ts-check
import { Block, GameMode, ItemUseOnBeforeEvent, world } from "@minecraft/server";
import { isModItem } from "../utils/namespace";
/**@param {ItemUseOnBeforeEvent} data*/
export default function collectWater(data){
    world.sendMessage(meetConversionConditions(data.block)?"true":"false");
    if( //为非冒险模式玩家
        data.source.typeId == "minecraft:player" && data.source.getGameMode() != GameMode.adventure
        //为空桶和模组方块
     && data.itemStack.typeId == "minecraft:bucket" && isModItem(data.block.typeId)
        //模组方块满足无限水条件
     && meetConversionConditions(data.block)
    ){
        world.sendMessage("$23");
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
        data.source.runCommandAsync(`structure load ${data.block.typeId.replace("abs:", "")} ${data.block.location.x} ${data.block.location.y} ${data.block.location.z} ${rotation}`);
    }
}

/**判断模组方块处是否生成无限水。
 * @param {Block} block
 * @returns {boolean}
 */
function meetConversionConditions(block){
    const above = block.above(1);
    if(above) return(
        //@ts-ignore 又是另一个扩展没更新的问题
        block.isWaterlogged
        //@ts-ignore
     && (above.isWaterlogged || above.typeId == "minecraft:water")
     && (   //@ts-ignore
            (block.north(1) && (block.north(1).isWaterlogged || block.north(1).typeId == "minecraft:water"))
            //@ts-ignore
         || (block.south(1) && (block.south(1).isWaterlogged || block.south(1).typeId == "minecraft:water"))
            //@ts-ignore
         || (block.west(1) && (block.west(1).isWaterlogged || block.west(1).typeId == "minecraft:water"))
            //@ts-ignore
         || (block.east(1) && (block.east(1).isWaterlogged || block.east(1).typeId == "minecraft:water"))
        )
    );
    else return false;
}