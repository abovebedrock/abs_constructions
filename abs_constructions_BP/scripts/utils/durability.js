import { EntityComponentTypes, EquipmentSlot, GameMode, ItemComponentTypes, ItemDurabilityComponent, Player, world } from "@minecraft/server";
import { decide } from "./random";

const
    toolTiers = ["wooden", "stone", "iron", "golden", "diamond", "netherite"],
    toolNames = ["axe", "hoe", "pickaxe", "shovel", "sword"];
let tools = [
    "trident",
    "mace",
    //"shears"
];
for(let i = 0; i < toolTiers.length; i++) for(let j = 0; j < toolNames.length; j++) tools.push(`${toolTiers[i]}_${toolNames[j]}`);
tools = tools.map(value=>`minecraft:${value}`);

/**对玩家主手上的物品执行一次成功挖掘物品的耐久降低机制。
 * 
 * 原则上仅供挖掘物品！不要在其他地方未经确认地使用这个方法！
 * 
 * **由于奇怪的bug，剪刀会被原版计算耐久，因此这里会直接忽略剪刀！**
 * @param {Player} player
 */
export default function durability(player){
    const
        slot = player.getComponent(EntityComponentTypes.Equippable).getEquipmentSlot(EquipmentSlot.Mainhand), item = slot.getItem(),
        gamemode = player.getGameMode();
    if((gamemode === GameMode.survival || gamemode === GameMode.adventure) && item && tools.includes(item.typeId)){
        const unbreakingLevel = item.getComponent(ItemComponentTypes.Enchantable)?.getEnchantment("minecraft:unbreaking")?.level ?? 0;
        if(decide(1 / (unbreakingLevel + 1))){
            const dura = item.getComponent(ItemComponentTypes.Durability);
            let delta = 1;
            if(item.typeId.includes("sword") || item.typeId.includes("mace") || item.typeId.includes("trident")) delta = 2;
            if(dura.damage >= dura.maxDurability - delta + 1){
                slot?.setItem();
                player.dimension.playSound("random.break", player.location, {
                    pitch: 0.9,
                    volume: 1.0
                });
            }
            else{
                dura.damage += delta;
                slot?.setItem(item);
            }
        }
    }
}