/** @type {Record<CanOmitNamespace<BlockId>, (CanOmitNamespace<ItemId> | number)[]>} */
const crops_map = {
    "minecraft:carrots": ["minecraft:carrot", 7],
    "minecraft:potatoes": ["minecraft:potato", 7],
    "minecraft:wheat": ["minecraft:wheat_seeds", 7],
    "minecraft:beetroots": ["minecraft:beetroot_seeds", 3],
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
Hud.clearDraw3Ds();
const d3d = Hud.createDraw3D().register();
const toggle = !GlobalVars.getBoolean("farm_toggle");
GlobalVars.putBoolean("farm_toggle", toggle);
if (toggle) {
    const poses = [];
    Chat.log(Chat.createTextBuilder().append("Click on the first corner of the farm").withColor(0x2).build());

    /** @type {Box} */
    let area_box;
    const box_event = JsMacros.on("Key", true, JavaWrapper.methodToJava((event, ctx) => {
        if (event.key == "key.mouse.left" && event.action == 1) {
            event.cancel();
            ctx.releaseLock();
            const block = Player.getInteractionManager().getTargetedBlock().toPos3D();
            if (poses.length == 0 && block != null) {
                area_box = Hud.createDraw3D().boxBuilder().pos1(block.x, block.y, block.z).pos2(block.x + 1, block.y + 1, block.z + 1).
                    color(0x88FF88).alpha(0x50).fillColor(0x1888FF88).fill(true).build();
                d3d.addBox(area_box);
                poses.push(block.x, block.y, block.z);
                Chat.log(Chat.createTextBuilder().append("Click on the second corner of the farm (it should be a flat area)").withColor(0x2).build());
            } else if (poses.length == 3 && block != null) {
                if (area_box.pos.y1 != block.y) {
                    Chat.log(Chat.createTextBuilder().append("Error: ").withColor(255, 0, 0).
                        append("Selected area is not flat.").withColor(255, 128, 128).build());
                    box_event.off();
                    d3d.unregister();
                    GlobalVars.putBoolean("farm_toggle", false);
                } else {
                    poses.push(block.x, block.y, block.z);
                    area_box.setPos(Math.min(poses[0], poses[3]), poses[1], Math.min(poses[2], poses[5]),
                        Math.max(poses[0], poses[3]) + 1, poses[1] + 1, Math.max(poses[2], poses[5]) + 1);
                    Chat.log(Chat.createTextBuilder().append("Click on the storage block").withColor(0x2).build());
                }
            } else if (block != null) {
                const storage_box = Hud.createDraw3D().boxBuilder().color(0xFF8800).alpha(0x50).fillColor(0x18FF8800).fill(true).build();
                storage_box.setPosToBlock(block.toBlockPos());
                d3d.addBox(storage_box);
                poses.push(block.x, block.y, block.z);
                prepare(poses);
                box_event.off();
            }
        }
    }));
}

function prepare(poses) {
    Chat.log(Chat.createTextBuilder().append("Auto farm ").withColor(200, 200, 200).
        append("Enabled").withColor(64, 255, 64).build());
    const storage_pos = PositionCommon.createBlockPos(poses[6], poses[7], poses[8]);
    const first_pos = PositionCommon.createBlockPos(Math.min(poses[0], poses[3]), poses[1], Math.min(poses[2], poses[5]));
    const second_pos = PositionCommon.createBlockPos(Math.max(poses[0], poses[3]), poses[1], Math.max(poses[2], poses[5]));
    farm(first_pos, second_pos, storage_pos);
    Chat.log(Chat.createTextBuilder().append("Auto farm ").withColor(200, 200, 200).
        append("Disabled").withColor(255, 64, 64).build());
}

function farm(first_pos, second_pos, storage_pos) {
    const player = Player.getPlayer();
    const grown_crops = [];
    const to_replant = [];
    let failed = [];
    const inv = Player.openInventory();

    // switch to a fortune tool if available
    if (!player.getMainHand().hasEnchantment("minecraft:fortune")) {
        loop: for (let level = 3; level > 0; level--) {
            for (let i = 0; i < 36; i++) {
                if (inv.getSlot(i).hasEnchantment("fortune") && inv.getSlot(i).getEnchantment("Fortune").getLevel() == level) {
                    inv.swapHotbar(i, inv.getSelectedHotbarSlotIndex());
                    Client.waitTick();
                    break loop;
                }
            }
        }
    }

    /** @type {BlockPosHelper} */
    let crop;

    Chat.actionbar(Chat.createTextBuilder().append("credits: ").withColor(0x2).append("Funzen").withColor(0x6).build());
    while (GlobalVars.getBoolean("farm_toggle")) {
        World.iterateBox(first_pos, second_pos, true, JavaWrapper.methodToJava((block) => {
            if (Object.keys(crops_map).includes(block.getId()) && block.getBlockState()["age"] == crops_map[block.getId()][1]) {
                const b = block.getBlockPos();
                grown_crops.push(PositionCommon.createBlockPos(b.getX(), b.getY(), b.getZ()));
            }
        }));
        while (grown_crops.length > 0) {
            if (!GlobalVars.getBoolean("farm_toggle")) return;
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
    const player = Player.getPlayer();
    Client.waitTick(2);
    if (player.distanceTo(crop) > 4) {
        player.lookAt(crop.getX() + 0.5, crop.getY(), crop.getZ() + 0.5);
        KeyBind.keyBind("key.forward", true);
        while (player.distanceTo(crop) > 2) {
            if (!GlobalVars.getBoolean("farm_toggle")) {
                KeyBind.keyBind("key.forward", false);
                return;
            };
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
        if (!GlobalVars.getBoolean("farm_toggle")) return;
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
        if (player.distanceTo(land[1]) > 4) {
            player.lookAt(land[1].getX() + 0.5, land[1].getY(), land[1].getZ() + 0.5);
            KeyBind.keyBind("key.forward", true);
            while (player.distanceTo(land[1]) > 2) {
                if (!GlobalVars.getBoolean("farm_toggle")) {
                    KeyBind.keyBind("key.forward", false);
                    return;
                };
                Client.waitTick();
            }
        }
        KeyBind.keyBind("key.forward", false);
        Player.getInteractionManager().interactBlock(land[1].getX(), land[1].getY(), land[1].getZ(), "up", true);
        Client.waitTick(2);
    }
    return failed;
}

/**
 * 
 * @param {BlockPosHelper} first_pos 
 * @param {BlockPosHelper} second_pos 
 */
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
        if (!GlobalVars.getBoolean("farm_toggle")) return;
        let item = items.shift();
        player.lookAt(item.getX(), item.getY(), item.getZ());

        KeyBind.keyBind("key.forward", true);
        while (player.distanceTo(item.getPos()) > 1) {
            if (!GlobalVars.getBoolean("farm_toggle")) {
                KeyBind.keyBind("key.forward", false);
                return;
            };
            Client.waitTick();
        }
        KeyBind.keyBind("key.forward", false);
        items.sort((a, b) => {
            if (player.distanceTo(a) > player.distanceTo(b)) return 1;
            return -1;
        });
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
            if (!GlobalVars.getBoolean("farm_toggle")) {
                KeyBind.keyBind("key.forward", false);
                return;
            };
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
    while (empty_slots > 0 && crop_slots.length > 0) {
        inv.quick(crop_slots.pop());
        Client.waitTick();
        empty_slots--;
    }
    Client.waitTick();
    inv.closeAndDrop();
    Client.waitTick();
}