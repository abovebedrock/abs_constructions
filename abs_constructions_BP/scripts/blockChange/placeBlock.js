//@ts-check
import { Block, Direction, ItemUseOnBeforeEvent, world, BlockPermutation, system, EntityComponentTypes, EquipmentSlot, GameMode, Player, PlayerPlaceBlockBeforeEvent } from "@minecraft/server";
import { isModItem } from "../utils/namespace";
import { combineHorizontal, combineVertical, getPlaceSoundId } from "../utils/double";
import { isHorizontalSlab, isVerticalSlab } from "../utils/slab";
import { isStairs } from "../utils/stairs";

/**@typedef {"north" | "south" | "west" | "east"} FourDirection*/

/**@typedef {"bottom" | "top"} VerticalHalf*/

world.beforeEvents.worldInitialize.subscribe(data=>data.blockComponentRegistry.registerCustomComponent("abs:dynamic_cardinal", {
    beforeOnPlayerPlace: data=>{
        if(data.player){
            const
                originDirection = /**@type {FourDirection}*/ (data.permutationToPlace.getState("minecraft:cardinal_direction")),
                baseBlock = getBaseBlock(data.block, data.face),
                blockFace = getFaceLocation(baseBlock, data.face, data.player.getHeadLocation(), data.player.getViewDirection()),
                betterDirection = getBetterDirection(data.face, blockFace, originDirection, baseBlock),
                needWaterlog = (data.block.typeId === "minecraft:water" && data.block.permutation.getState("liquid_depth") === 0) || data.block.isWaterlogged;
            //world.sendMessage(`${blockFace.x} ${blockFace.y} ${blockFace.z}`);
            if(betterDirection !== originDirection) data.permutationToPlace = data.permutationToPlace.withState("minecraft:cardinal_direction", betterDirection);
            if(needWaterlog) addWater(data.player, data.block.location, data.permutationToPlace.type.id, betterDirection);
        }
    }
}));

/**@param {PlayerPlaceBlockBeforeEvent} data*/
export function checkWater(data){
    const typeId = data.permutationBeingPlaced.type.id;
    if(isModItem(typeId)){
        //竖砖被abs:dynamic_cardinal一起处理了，这里不需要处理它们
        if(isVerticalSlab(typeId)) return;
        else if((data.block.typeId === "minecraft:water" && data.block.permutation.getState("liquid_depth") === 0) || data.block.isWaterlogged){
            if(isHorizontalSlab(typeId)) addWater(data.player, data.block.location, typeId, undefined, /**@type {VerticalHalf}*/ (data.permutationBeingPlaced.getState("minecraft:vertical_half")));
            else if(isStairs(typeId)) addWater(data.player, data.block.location, typeId, /**@type {FourDirection}*/ (data.permutationBeingPlaced.getState("minecraft:cardinal_direction")), /**@type {VerticalHalf}*/ (data.permutationBeingPlaced.getState("minecraft:vertical_half")));
        }
    }
}

/**获得玩家实际需要放置的地方。
 * @param {Direction} face
 * @param {import("@minecraft/server").Vector3} faceLocation
 * @param {FourDirection} originDirection
 * @param {Block} baseBlock
 * @returns {FourDirection}
 */
function getBetterDirection(face, faceLocation, originDirection, baseBlock){
    //修复能在竖砖上下放置方向完全相反的竖砖，让自己爬的bug
    if(isVerticalSlab(baseBlock.typeId) && baseBlock.permutation.getState("minecraft:cardinal_direction") === originDirection) return originDirection;
    else switch(originDirection){
        case "north": return face === Direction.South ? "north" : faceLocation.z >= 0.5 ? "south" : "north";
        case "south": return face === Direction.North ? "south" : faceLocation.z >= 0.5 ? "south" : "north";
        case "west": return face === Direction.East ? "west" : faceLocation.x >= 0.5 ? "east" : "west";
        case "east": return face === Direction.West ? "east" : faceLocation.x >= 0.5 ? "east" : "west";
    }
}

/**根据玩家的状态和方块表面，计算指向的精确方块内子坐标。
 * @param {import("@minecraft/server").Vector3} blockLocation
 * @param {Direction} face
 * @param {import("@minecraft/server").Vector3} headLocation
 * @param {import("@minecraft/server").Vector3} viewDirection
 * @returns {import("@minecraft/server").Vector3}
 */
function getFaceLocation(blockLocation, face, headLocation, viewDirection){
    switch(face){
        case Direction.Down: {//y是bL.y,>hL.y
            //headLocation.y = playerLocation.y + (headLocation.y - playerLocation.y) * 0.94;
            //world.sendMessage(`方块：${blockLocation.x} ${blockLocation.y} ${blockLocation.z}\n头：${headLocation.x} ${headLocation.y} ${headLocation.z}\n单位向量：${viewDirection.x} ${viewDirection.y} ${viewDirection.z} `);
            const factor = (blockLocation.y - headLocation.y) / viewDirection.y;
            //world.sendMessage(`factor应该是：${(blockLocation.x - headLocation.x) / viewDirection.x} y比例：${(headLocation.y - playerLocation.y) / (blockLocation.y - (((blockLocation.x - headLocation.x) / viewDirection.x) * viewDirection.y) - playerLocation.y)}`);
            //world.sendMessage(`因数：${factor}`);
            //world.sendMessage(`结果：${headLocation.x - blockLocation.x + factor * viewDirection.x} ${headLocation.y - blockLocation.y + factor * viewDirection.y} ${headLocation.z - blockLocation.z + factor * viewDirection.z}`);
            //world.sendMessage(`x轴信息：${headLocation.x} ${blockLocation.x}`);
            return {
                x: headLocation.x - blockLocation.x + factor * viewDirection.x,
                y: 0,
                z: headLocation.z - blockLocation.z + factor * viewDirection.z
            };
        }
        case Direction.East: {
            const factor = Math.abs((headLocation.x - blockLocation.x - 1) / viewDirection.x);
            return {
                x: 1,
                y: headLocation.y - blockLocation.y + factor * viewDirection.y,
                z: headLocation.z - blockLocation.z + factor * viewDirection.z
            };
        }
        case Direction.North: {
            const factor = (blockLocation.z - headLocation.z) / viewDirection.z;
            return {
                x: headLocation.x - blockLocation.x + factor * viewDirection.x,
                y: headLocation.y - blockLocation.y + factor * viewDirection.y,
                z: 0
            };
        }
        case Direction.South: {
            const factor = Math.abs((headLocation.z - blockLocation.z - 1) / viewDirection.z);
            return {
                x: headLocation.x - blockLocation.x + factor * viewDirection.x,
                y: headLocation.y - blockLocation.y + factor * viewDirection.y,
                z: 1
            };
        }
        case Direction.Up: {
            const factor = Math.abs((headLocation.y - blockLocation.y - 1) / viewDirection.y);
            //world.sendMessage(`方块${blockLocation.x} ${blockLocation.y} ${blockLocation.z}`);
            //world.sendMessage(`看${viewDirection.x} ${viewDirection.y} ${viewDirection.z}`);
            //world.sendMessage(`头${headLocation.x} ${headLocation.y} ${headLocation.z}`);
            //world.sendMessage(`预计${headLocation.x + factor * viewDirection.x} ${headLocation.y + factor * viewDirection.y} ${headLocation.z + factor * viewDirection.z}`);
            //world.sendMessage(`${factor}`);
            return {
                x: headLocation.x - blockLocation.x + factor * viewDirection.x,
                y: 1,
                z: headLocation.z - blockLocation.z + factor * viewDirection.z
            };
        }
        case Direction.West: {
            const factor = (blockLocation.x - headLocation.x) / viewDirection.x;
            return {
                x: 0,
                y: headLocation.y - blockLocation.y + factor * viewDirection.y,
                z: headLocation.z - blockLocation.z + factor * viewDirection.z
            };
        }
    }
}

/**获得放置操作的基方块。
 * @param {Block} block
 * @param {Direction} face
 * @return {Block}
 */
function getBaseBlock(block, face){
    switch(face){
        case Direction.Down: return block.above(1);
        case Direction.East: return block.west(1);
        case Direction.North: return block.south(1);
        case Direction.South: return block.north(1);
        case Direction.Up: return block.below(1);
        case Direction.West: return block.east(1);
    }
}

/**放水。
 * @param {Player} player
 * @param {import("@minecraft/server").Vector3} location
 * @param {string} typeId 需要放的东西。
 * @param {FourDirection} [direction]
 * @param {VerticalHalf} [vertical]
 */
async function addWater(player, location, typeId, direction, vertical){
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
    const waitForCommand = await player.runCommandAsync(`structure load ${typeId.replace("abs:", "")} ${location.x} ${location.y} ${location.z}${rotation === "" ? "" : ` ${rotation}`}`);
    if(vertical && waitForCommand.successCount > 0){
        const block = player.dimension.getBlock(location);
        if(block) block.setPermutation(block.permutation.withState("minecraft:vertical_half", vertical));
    }
}

/**@param {ItemUseOnBeforeEvent} data*/
export function combineBlock(data){
    if(data.isFirstEvent && isModItem(data.itemStack.typeId)){
        const
            target = getPlacingBlock(data.block, data.blockFace),
            item = data.itemStack,
            gamemode = data.source.getGameMode(),
            hand = data.source.getComponent(EntityComponentTypes.Equippable).getEquipmentSlot(EquipmentSlot.Mainhand);
        if(target && isModItem(target.typeId)){
            if(isVerticalSlab(target.typeId)){
                //note:【临时】不允许混合台阶，下同
                if(target.typeId === item.typeId){
                    data.cancel = true;
                    system.run(()=>{
                        target.setPermutation(BlockPermutation.resolve(combineVertical(target.typeId, item.typeId)));
                        target.dimension.playSound(getPlaceSoundId(item.typeId), {
                            x: target.location.x + 0.5,
                            y: target.location.y + 0.5,
                            z: target.location.z + 0.5,
                        });
                        if(gamemode === GameMode.adventure || gamemode === GameMode.survival){
                            if(item.amount > 1){
                                const newItem = item.clone();
                                newItem.amount--;
                                hand?.setItem(newItem);
                            }
                            else hand?.setItem();
                        }
                    });
                }
            }
            else if(isHorizontalSlab(target.typeId)){
                if(target.typeId === item.typeId){
                    data.cancel = true;
                    system.run(()=>{
                        target.setPermutation(BlockPermutation.resolve(combineHorizontal(target.typeId, item.typeId)));
                        target.dimension.playSound(getPlaceSoundId(item.typeId), {
                            x: target.location.x + 0.5,
                            y: target.location.y + 0.5,
                            z: target.location.z + 0.5,
                        });
                        if(gamemode === GameMode.adventure || gamemode === GameMode.survival){
                            if(item.amount > 1){
                                const newItem = item.clone();
                                newItem.amount--;
                                hand?.setItem(newItem);
                            }
                            else hand?.setItem();
                        }
                    });
                }
            }
        }
    }
}

/**获得方块某面延伸出去的方块，如果是模组方块不完整表面，则为本方块。
 * @param {Block} block
 * @param {Direction} face
 * @returns {Block | undefined}
 */
function getPlacingBlock(block, face){
    if(isModItem(block.typeId)){
        if(isVerticalSlab(block.typeId)){
            const direction = /**@type {FourDirection}*/ (block.permutation.getState("minecraft:cardinal_direction"));
            if(
                (direction === "east" && face === Direction.West)
             || (direction === "west" && face === Direction.East)
             || (direction === "north" && face === Direction.South)
             || (direction === "south" && face === Direction.North)
            ) return block;
        }
        else if(isHorizontalSlab(block.typeId)){
            const half = /**@type {VerticalHalf}*/ (block.permutation.getState("minecraft:vertical_half"));
            if((half === "bottom" && face === Direction.Up) || (half === "top" && face === Direction.Down)) return block;
        }
    }
    switch(face){
        case Direction.Down: return block.below(1);
        case Direction.East: return block.east(1);
        case Direction.North: return block.north(1);
        case Direction.South: return block.south(1);
        case Direction.Up: return block.above(1);
        case Direction.West: return block.west(1);
    }
}