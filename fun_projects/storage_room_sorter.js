const player = Player.getPlayer();
const RegistryHelper = Java.type('xyz.wagyourtail.jsmacros.client.api.classes.RegistryHelper');
const rawItems = new RegistryHelper().getItems();
const ITEMS = [];

for (const item of rawItems) {
    ITEMS.push([item.getId().split(':')[1], item.getName().toLowerCase()]);
}

// if script is running
if (GlobalVars.getBoolean('storageSorterRunning')) {
    // if script is enabled disable it and sho a message
    if (GlobalVars.getBoolean('storageSorterToggle')) {
        Chat.log(Chat.createTextBuilder().append('Storage Sorter ').withColor(255, 255, 255)
            .append('Disabled').withColor(192, 0, 0));
        GlobalVars.putBoolean('storageSorterToggle', false);
    }
} else { // if script is not running, run it
    GlobalVars.putBoolean('storageSorterToggle', true);
    GlobalVars.putBoolean('storageSorterRunning', true);
    Chat.log(Chat.createTextBuilder().append('Storage Sorter ').withColor(255, 255, 255)
        .append('Enabled').withColor(0, 192, 0));
    sort();
}

/**
 * Check if storage sorter is disabled
 * @returns {boolean} true if storage sorter is disabled
 */
function stop() {
    return !GlobalVars.getBoolean('storageSorterToggle');
}

/**
 * Checks if a given point is inside a box defined by two other points.
 *
 * @param {Pos3D} point - The point to check.
 * @param {Pos3D} min - The minimum coordinates of the box.
 * @param {Pos3D} max - The maximum coordinates of the box.
 * @returns {boolean} True if the point is inside the box, false otherwise.
 */
function isInsideBox(point, min, max) {
    return point.x >= min.x && point.x <= max.x &&
        point.y >= min.y && point.y <= max.y &&
        point.z >= min.z && point.z <= max.z;
}

/**
 * Smoothly rotates the player's head to the specified coordinates.
 *
 * @param {number} x - The x-coordinate of the target position.
 * @param {number} y - The y
 * @param {number} z - The z
 * @param {number} [speed=2] - The speed at which the player's head rotates.
 */
function smoothLook(x, y, z, speed = 2) {
    const playerPos = player.getEyePos();

    // Calculate the yaw and pitch rotations
    let yaw = -Math.atan2(x + 0.5 - playerPos.x, z + 0.5 - playerPos.z) * 180 / Math.PI;
    const pitch = -Math.atan2(y + 0.5 - playerPos.y,
        Math.sqrt((x + 0.5 - playerPos.x) ** 2 + (z + 0.5 - playerPos.z) ** 2)) * 180 / Math.PI;

    // Player's current yaw and pitch
    let oldYaw = Player.getPlayer().getYaw();
    const oldPitch = Player.getPlayer().getPitch();

    let midYaw;
    let midPitch;

    // yaw and old_yaw correction
    if (yaw < oldYaw) yaw += 360;
    if (yaw - oldYaw > 180) oldYaw += 360;

    const dominant = (Math.max(Math.abs(oldYaw - yaw), Math.abs(oldPitch - pitch)));
    const steps = Math.floor(dominant / speed); // number of steps needed

    // smoothly rotate the player with a small delay in between
    for (let i = 0; i < steps; i++) {
        midYaw = oldYaw + (yaw - oldYaw) / steps * (i + 1);
        midPitch = oldPitch + (pitch - oldPitch) / steps * (i + 1);
        player.lookAt(midYaw, midPitch);
        Time.sleep(10);
    }
}

/**
 * return an array of x, y, z from a Pos3D object
 * @param {Pos3D} pos
 * @returns {number[]}
 */
function pos3dToArray(pos) {
    return [pos.x, pos.y, pos.z];
}

/**
 * finds all signs in 3 chunk radius around the player that contains the given text
 * @param {string} text
 * @returns {Pos3D[]} a list of all signs that have the text
 */
function findSign(text) {
    // world scanner for wall signs and scanning 3 chunk radius around the player
    const scanner = World.getWorldScanner().withStringBlockFilter().contains('wall_sign').build();
    const signs = scanner.scanAroundPlayer(3);

    /** @type {Pos3D[]} */
    const matches = [];

    // loop through each signs found
    for (const sign of signs) {
        // get the front text of each sign
        const linesNBT = World.getBlock(sign).getNBT().resolve('front_text.messages').at(0).asListHelper();
        for (let i = 0; i < linesNBT.length(); i++) {
            const line = linesNBT.get(i).asString().replaceAll('"', '').toLowerCase();
            // check if sign includes the given text
            if (line.includes(text.toLowerCase())) {
                matches.push(sign);
            }
        }
    }

    return matches;
}

/**
 * Finds storage locations for items based on wall signs found within a 3 chunk radius of the player.
 *
 * @return {Record<String, Pos3D[]>} A record of item IDs as keys and arrays of Pos3D objects as values,
 * representing the storage locations for each item.
 */
function findItemsStorage() {
    // world scanner for wall signs and scanning 3 chunk radius around the player
    const scanner = World.getWorldScanner().withStringBlockFilter().contains('wall_sign').build();
    const signs = scanner.scanAroundPlayer(3);

    /** @type {Record<String,Pos3D>} */
    const storages = {};

    // loop through each signs found
    for (const sign of signs) {
        const linesNBT = World.getBlock(sign).getNBT().resolve('front_text.messages').at(0).asListHelper();
        for (let i = 0; i < linesNBT.length(); i++) {
            const line = linesNBT.get(i).asString().replaceAll('"', '').toLowerCase();
            let itemId;
            if (ITEMS.some(e => {
                if (e.includes(line)) {
                    itemId = e[0];
                    return true;
                }
                return false;
            })) {
                if (Object.hasOwn(storages, itemId)) {
                    storages[itemId].push(signToChest(sign));
                } else {
                    storages[itemId] = [signToChest(sign)];
                }
            }
        }
    }
    return storages;
}

/**
 * simply walk to coords provided by pos in a straight line
 * returns true if walked
 * @param {Pos3D} pos  the position to move to
 * @returns {boolean} true if player moved
 */
function moveTo(pos) {
    // if player is close enough, no need to move
    if (player.distanceTo(pos) > 4) {
        // create a player input (forward, sideways, yaw, pitch, jump, sneak, sprint)
        const input = Player.createPlayerInput(1, 0, player.getYaw(), player.getPitch(), false, false, false);

        // move the player until close enough
        while (player.distanceTo(pos) > 3) {
            if (stop()) return;
            Player.clearInputs();
            Player.addInput(input);
            Client.waitTick();
        }
        return true;
    }
    return false;
}

/**
 * walk to and open the chest at given position
 * @param {Pos3D} chest the position of the chest
 */
function openChest(chest) {
    if (stop()) return;

    // turn toward the chest an move to
    smoothLook(...pos3dToArray(chest));
    Client.waitTick();
    if (moveTo(chest)) smoothLook(...pos3dToArray(chest));
    if (stop()) return;

    // interact with the chest
    Player.getInteractionManager().interactBlock(chest.x, chest.y, chest.z, player.getFacingDirection().getName(), false);
}

/**
* get the position of a chest that the given sign is attached to
* @param {Pos3D} sign position of the sign
* @returns {Pos3D} position of the chest that sign is attached to
*/
function signToChest(sign) {
    const faceMap = {
        north: [0, 0, 1], // facing: [dx, dy, dz]
        south: [0, 0, -1],
        west: [1, 0, 0],
        east: [-1, 0, 0]
    };
    return sign.add(...faceMap[World.getBlock(sign).getBlockState().get('facing')]);
}

/**
 * Finds the slot index of items that are in player's main/hotbar inventory
 * @param {CanOmitNamespace<ItemId>} item the item to search for
 * @returns {number[]} found item slots
 */
function findItemInPlayer(item, inv) {
    if (stop()) return;
    Client.waitTick();
    const result = [];

    // add minecraft namespace to the item
    if (!item.startsWith('minecraft:')) {
        item = 'minecraft:' + item;
    }

    // loop through the inventory
    const firstSlot = inv.getMap().main.at(0);
    for (let i = firstSlot; i < firstSlot + 36; i++) {
        if (inv.getSlot(i).getItemId() == item) {
            result.push(i);
        }
    }
    return result;
}

/**
 * Check if inventory is empty of interesting items
 * @param {Inventory<*>} inv
 * @param {Record<String, Pos3D[]>} itemChests
 * @returns
 */
function isContainerEmpty(inv, itemChests) {
    for (const i of inv.getMap().container) {
        if (Object.keys(itemChests).includes(inv.getSlot(i).getItemId().split(':')[1])) {
            return false;
        }
    }
    return true;
}

/**
 * Check if inventory has no empty slot
 * @param {Inventory<*>} inv
 * @returns
 */
function isContainerFull(inv) {
    if (stop()) return;
    for (const i of inv.getMap().container) {
        if (inv.getSlot(i).getItemId() == 'minecraft:air') {
            return false;
        }
    }
    return true;
}

/**
 * cleans up the item_chests by removing a position from it
 * @param {Pos3D} pos the storage location to be removed
 * @param {Record<string,Pos3D[]>} itemChests
 */
function clean_item_chests(pos, itemChests) {
    for (const item in itemChests) {
        if (itemChests[item].some((e) => [e.x, e.y, e.z].every((v, i) => v == [pos.x, pos.y, pos.z][i]))) {
            itemChests[item].splice(itemChests[item].indexOf(pos), 1);
        }
    }
    const keys = Object.keys(itemChests);
    for (const key of keys) {
        if (itemChests[key].length == 0) {
            delete itemChests[key];
        }
    }
    return itemChests;
}

/**
 * Sorts the items stored in the chests based on the signs.
 * The sorting is done by picking the first chest from the list,
 * picking the item from the chest and putting it in the first
 * available storage location. If the storage is full, the
 * storage location is removed from the list of the item.
 *
 * The function stops when there are no more chests to sort or
 * when there are no items left to sort.
 */
function sort() {
    const sortChests = findSign('sort').map(signToChest); // list of chests to sort
    let itemChests = findItemsStorage(); // dictionary of storage locations for each item
    let inv;

    // Main loop for each chest sorting chest
    while (sortChests.length > 0) {
        if (stop()) return; // checks if script is being stopped/interrupted

        // open the chest and pick the items and keep track of them
        openChest(sortChests[0]);
        if (stop()) return;
        Client.waitTick(5);
        inv = Player.openInventory();
        Client.waitTick(5);
        const items = [];
        for (const slot of inv.getMap().container) {
            const item_id = inv.getSlot(slot).getItemId().split(':')[1];
            if (Object.keys(itemChests).includes(item_id)) {
                if (findItemInPlayer('minecraft:air', inv).length == 0) { // check if player inventory is full
                    break;
                }
                items.push(item_id);
                inv.quickAll(slot);
                Client.waitTick();
            }
        }

        // if there were no items to pick up, or inventory is empty, discard that chest
        if (items.length == 0 || isContainerEmpty(inv, itemChests)) {
            sortChests.shift();
        }
        Client.waitTick(5);
        inv.closeAndDrop();
        Client.waitTick(5);

        // loop through each item that needs to be sorted
        while (items.length > 0) {
            if (stop()) return;

            // if item is removed from sorting elsewhere, discard that
            if (!Object.hasOwn(itemChests, items[0])) {
                items.shift();
                continue;
            }

            const storage = itemChests[items[0]][0]; // pick the first storage location for the item and open it
            openChest(storage);
            Client.waitTick(5);
            const inv = Player.openInventory();
            Client.waitTick(5);

            // if storage is full, discard that and handle the items accordingly
            if (isContainerFull(inv)) {
                itemChests = clean_item_chests(storage, itemChests);
                if (!Object.hasOwn(itemChests, items[0])) {
                    items.shift();
                }
                Client.waitTick(5);
                inv.closeAndDrop();
                Client.waitTick(5);
                continue;
            }

            // Pick up the item from the player and put it in the storage
            inv.quickAll(findItemInPlayer(items[0], inv)[0]);
            if (findItemInPlayer(items[0], inv).length == 0) {
                items.shift();
                Client.waitTick(5);
                inv.closeAndDrop();
                Client.waitTick(5);
                continue;
            }
            Client.waitTick();

            // handle it when storage is full
            if (isContainerFull(inv)) {
                itemChests[items[0]].shift();
                if (itemChests[items[0]].length == 0) {
                    delete itemChests[items[0]];
                    items.shift();
                }
            }
            Client.waitTick(5);
            inv.closeAndDrop();
            Client.waitTick(5);
        }
    }
}
GlobalVars.putBoolean('storageSorterRunning', false);
if (GlobalVars.getBoolean('storageSorterToggle')) {
    Chat.log(Chat.createTextBuilder().append('Storage Sorter ').withColor(255, 255, 255)
        .append('Finished').withColor(215, 188, 0));
    GlobalVars.putBoolean('storageSorterToggle', false);
}

