/** @type {Record<CanOmitNamespace<BlockId>, (CanOmitNamespace<ItemId> | number)[]>} */
const crops_map = {
    "minecraft:carrots": ["minecraft:carrot", 7],
    "minecraft:potatoes": ["minecraft:potato", 7],
    "minecraft:wheat": ["minecraft:wheat_seeds", 7],
    "minecraft:beetroots": ["minecraft:beetroot_seeds", 7],
    "minecraft:nether_wart": ["minecraft:nether_wart", 3]
};

/** @type {CanOmitNamespace<ItemId>[]} */
const items_list = [
    "minecraft:carrot",
    "minecraft:potato",
    "minecraft:wheat",
    "minecraft:beetroot",
    "minecraft:nether_wart",
    "minecraft:poisonous_potato",
    "minecraft:wheat_seeds",
    "minecraft:beetroot_seeds"
];

const toggle = !GlobalVars.getBoolean("farm_toggle");
GlobalVars.putBoolean("farm_toggle", toggle);
if (toggle) {
    const first_pos = PositionCommon.createBlockPos(-7, 2, 14);
    const second_pos = PositionCommon.createBlockPos(1, 2, 22);
    if (first_pos.getY() != second_pos.getY()) {
        Chat.log(Chat.createTextBuilder().append("Error: ").withColor(255, 0, 0).
            append("Selected area is not flat.").withColor(255, 128, 128).build());
        GlobalVars.putBoolean("farm_toggle", false);
    } else {
        Chat.log(Chat.createTextBuilder().append("Auto farm ").withColor(200, 200, 200).
            append("Enabled").withColor(64, 255, 64).build());
        const storage_pos = PositionCommon.createBlockPos(-8, 2, 18);

        farm(first_pos, second_pos, storage_pos);
        Chat.log(Chat.createTextBuilder().append("Auto farm ").withColor(200, 200, 200).
            append("Disabled").withColor(255, 64, 64).build());
    }
}

function farm(first_pos, second_pos, storage_pos) {
    const player = Player.getPlayer();
    const grown_crops = [];
    const to_replant = [];
    let failed = [];

    /** @type {BlockPosHelper} */
    let crop;

    Chat.log("started farming");
    while (GlobalVars.getBoolean("farm_toggle")) {  // replace with toggle
        World.iterateBox(first_pos, second_pos, true, JavaWrapper.methodToJava((block) => {
            if (Object.keys(crops_map).includes(block.getId()) && block.getBlockState()["age"] == crops_map[block.getId()][1]) {
                const b = block.getBlockPos();
                grown_crops.push(PositionCommon.createBlockPos(b.getX(), b.getY(), b.getZ()));
            }
        }));
        while (grown_crops.length > 0) {
            grown_crops.sort((a, b) => {
                if (player.distanceTo(a) > player.distanceTo(b)) return 1;
                return -1;
            });

            crop = grown_crops.shift();

            if (player.distanceTo(crop) > 4) {
                failed = failed.concat(replant_crop(to_replant));
            }

            to_replant.push([World.getBlock(crop).getId(), PositionCommon.createBlockPos(crop.getX(), crop.getY() - 1, crop.getZ())]);
            break_crop(crop, grown_crops);
        }

        failed = failed.concat(replant_crop(to_replant));

        Client.waitTick(2);
        pick_items(first_pos, second_pos);

        replant_crop(failed);

        store_items(storage_pos);
    }
}
/**
 * Farm the fully grown block (break the block)
 * @param {BlockPosHelper} crop 
 */
function break_crop(crop) {
    // Player.openInventory().setSelectedHotbarSlotIndex(0)
    const player = Player.getPlayer();
    Client.waitTick(2);
    if (player.distanceTo(crop) > 4) {
        player.lookAt(crop.getX() + 0.5, crop.getY(), crop.getZ() + 0.5);
        KeyBind.keyBind("key.forward", true);
        while (player.distanceTo(crop) > 2) {
            Client.waitTick();
        }
    }
    KeyBind.keyBind("key.forward", false);
    Player.getInteractionManager().breakBlock(crop);
}

function replant_crop(to_replant) {
    Client.waitTick(5);
    const player = Player.getPlayer();
    let land;
    const inv = Player.openInventory();
    const failed = [];
    while (to_replant.length > 0) {
        land = to_replant.pop();
        if (player.getOffHand().getItemId() != crops_map[land[0]][0]) {
            let item = inv.findItem(crops_map[land[0]][0]);
            if (item.length == 0) {
                failed.push(land);
                continue;
            } else {
                inv.swapHotbar(item[0], 40);
            }
        }
        Player.getInteractionManager().interactBlock(land[1].getX(), land[1].getY(), land[1].getZ(), "up", true);
        Client.waitTick(2);
    }
    return failed;
}

function pick_items(first_pos, second_pos) {
    const player = Player.getPlayer();
    let items = World.getEntities();
    items = items.filter((item) => {
        if (item.getType() != "minecraft:item") return false;
        if (!items_list.includes(item.getNBT().get("Item").get("id").asString())) return false;
        if (item.getX() > first_pos.getX() - 2 && item.getX() < second_pos.getX() + 2 &&
            item.getY() > first_pos.getY() - 2 && item.getY() < second_pos.getY() + 2 &&
            item.getZ() > first_pos.getZ() - 2 && item.getZ() < second_pos.getZ() + 2) {
            return true;
        }
        return false;
    });
    while (items.length > 0) {
        let item = items.pop();
        player.lookAt(item.getX(), item.getY(), item.getZ());

        KeyBind.keyBind("key.forward", true);
        while (player.distanceTo(item.getPos()) > 1) {
            Client.waitTick();
        }
        KeyBind.keyBind("key.forward", false);
    }
}

function store_items(storage_pos) {
    const player = Player.getPlayer();
    let inv = Player.openInventory();
    let found = false;
    for (const item of items_list) {
        let findItem = inv.findItem(item);
        if (findItem.length > 1 || (findItem.length == 1 && findItem[0] != 45)) {
            found = true;
            break;
        }
    };
    if (!found) return;
    inv.closeAndDrop();
    if (player.distanceTo(storage_pos) > 3) {
        player.lookAt(storage_pos.getX() + 0.5, storage_pos.getY() + 0.5, storage_pos.getZ() + 0.5);
        KeyBind.keyBind("key.forward", true);
        while (player.distanceTo(storage_pos) > 3) {
            Client.waitTick();
        }
        KeyBind.keyBind("key.forward", false);
    }
    Player.getInteractionManager().interactBlock(storage_pos.getX(), storage_pos.getY(), storage_pos.getZ(), player.getFacingDirection().getName(), true);
    while (!Hud.isContainer) {
        Client.waitTick();
    }
    Client.waitTick(5);
    inv = Player.openInventory();
    const main_start_index = inv.getMap().main?.at(0);
    let empty_slots = 0;
    for (let i = 0; i < main_start_index; i++) {
        if (inv.getSlot(i).getItemId() == "minecraft:air") {
            empty_slots++;
        }
    }
    let crop_slots = [];
    for (let i = main_start_index; i < main_start_index + 36; i++) {
        if (items_list.includes(inv.getSlot(i).getItemId())) {
            crop_slots.push(i);
        }
    }
    // Client.waitTick(20);
    while (empty_slots > 0 && crop_slots.length > 0) {
        inv.quick(crop_slots.pop());
        Client.waitTick();
        empty_slots--;
    }
    Client.waitTick();
    inv.closeAndDrop();
    Client.waitTick();
}