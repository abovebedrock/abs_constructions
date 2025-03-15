
import { Block, Direction, ItemUseOnBeforeEvent, world, BlockPermutation, system, EntityComponentTypes, EquipmentSlot, GameMode, Player } from "@minecraft/server";
import { isModItem } from "../utils/namespace";
import { combineHorizontal, combineVertical, getPlaceSoundId } from "../utils/double";
import { isHorizontalSlab, isVerticalSlab } from "../utils/slab";

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
            boundingBox = getSidingBoundingBox(data.block.location, betterDirection),
            collide = collidesWithPlayer(data.block, boundingBox);
            if(!collide){
                if(betterDirection !== originDirection) data.permutationToPlace = data.permutationToPlace.withState("minecraft:cardinal_direction", betterDirection);
            }
            else data.cancel = true;
        }
    }
}));

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

const playerRadius = 0.3;

/**判断位置是否和玩家碰撞箱重合。
 * 目前认为没有必要检测其他实体。
 * @param {Block} block
 * @param {[import("@minecraft/server").Vector3, import("@minecraft/server").Vector3]} boundingBox
 * @returns {boolean}
 */
function collidesWithPlayer(block, boundingBox){
    const
    [blockCenter, blockRadius] = boundingBox,
    entities = /**@type {Player[]}*/ (block.dimension.getEntities({maxDistance: 1.8, location: block.location, type: "minecraft:player"}));
    for(let i = 0; i < entities.length; i++){
        const
        pHeightRadius = getPlayerHeight(entities[i]) / 2,
        mDistance = getManhattanDistance(blockCenter, {
            x: entities[i].location.x,
            y: entities[i].location.y + pHeightRadius,
            z: entities[i].location.z
        });
        if(
            mDistance.x < playerRadius + blockRadius.x
         && mDistance.y < pHeightRadius + blockRadius.y
         && mDistance.z < playerRadius + blockRadius.z
        ) return true;
    }
    return false;
}

/**（从abs_command复制而来）获取玩家全身高度。
 * @param {Player} player
 * @returns {number}
 */
export function getPlayerHeight(player){
    const playerEyeHeight = (player.getHeadLocation().y - player.location.y).toFixed(1);
    if(playerEyeHeight === "1.5") return 1.8;
    else if(playerEyeHeight === "1.2") return 1.49;
    else if(playerEyeHeight === "0.3") return 0.6;
    //改：玩家骑乘东西的时候就会这样，我们暂且不管它，返回正常玩家高度
    else return 1.8;
}

/**（从abs_command复制而来）获得曼哈顿距离的**绝对值**。`[x, y, z]`
 * @param {import("@minecraft/server").Vector3} location1
 * @param {import("@minecraft/server").Vector3} location2
 * @returns {import("@minecraft/server").Vector3}
 */
export function getManhattanDistance(location1, location2){
    return {
        x: Math.abs(location1.x - location2.x),
        y: Math.abs(location1.y - location2.y),
        z: Math.abs(location1.z - location2.z)
    };
}

//竖砖
const lengthRadius = 0.5, widthRadius = 0.25, heightRadius = 0.5;

/**获得竖砖碰撞箱，`[<中心坐标>, <半径>]`。
 * @param {import("@minecraft/server").Vector3} location
 * @param {FourDirection} direction
 * @returns {[import("@minecraft/server").Vector3, import("@minecraft/server").Vector3]}
 */
function getSidingBoundingBox(location, direction){
    const y = location.y + heightRadius;
    switch(direction){
        case "north": return [
            {x: location.x + lengthRadius, y, z: location.z + widthRadius},
            {x: lengthRadius, y: heightRadius, z: widthRadius}
        ];
        case "south": return [
            {x: location.x + lengthRadius, y, z: location.z + 0.5 + widthRadius},
            {x: lengthRadius, y: heightRadius, z: widthRadius}
        ];
        case "west": return [
            {x: location.x + widthRadius, y, z: location.z + lengthRadius},
            {x: widthRadius, y: heightRadius, z: lengthRadius}
        ];
        case "east": return [
            {x: location.x + 0.5 + widthRadius, y, z: location.z + lengthRadius},
            {x: widthRadius, y: heightRadius, z: lengthRadius}
        ];
    }
}

//台阶
const horizontalRadius = 0.5, verticalRadius = 0.25;

/**获得台阶碰撞箱，`[<中心坐标>, <半径>]`。
 * @param {import("@minecraft/server").Vector3} location
 * @param {VerticalHalf} half
 * @returns {[import("@minecraft/server").Vector3, import("@minecraft/server").Vector3]}
 */
function getSlabBoundingBox(location, half){
    return [
        {x: location.x + horizontalRadius, y: location.y + verticalRadius + (half === "top" ? 0.5 : 0), z: location.z + horizontalRadius},
        {x: horizontalRadius, y: verticalRadius, z: horizontalRadius}
    ];
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
                    const
                    direction = /**@type {FourDirection}*/ (target.permutation.getState("minecraft:cardinal_direction")),
                    boundingBox = getSidingBoundingBox(target.location, direction === "east" ? "west" : direction === "west" ? "east" : direction === "north" ? "south" : "north"),
                    collide = collidesWithPlayer(target, boundingBox);
                    if(!collide) system.run(()=>{
                        //2025.3.14添加平滑石头双台阶的旋转
                        if(target.typeId === "abs:smooth_stone_slab") target.setPermutation(BlockPermutation.resolve(combineVertical(target.typeId, item.typeId), {
                            "minecraft:cardinal_direction": direction
                        }));
                        else target.setPermutation(BlockPermutation.resolve(combineVertical(target.typeId, item.typeId)));
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
                    const
                    half = /**@type {VerticalHalf}*/ (target.permutation.getState("minecraft:vertical_half")),
                    boundingBox = getSlabBoundingBox(target.location, half === "bottom" ? "top" : "bottom"),
                    collide = collidesWithPlayer(target, boundingBox);
                    if(!collide) system.run(()=>{
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