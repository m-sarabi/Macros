// a simple smooth rotation function
function smooth_look(yaw, pitch, steps = 60, duration = 300, shake = true) {
    var old_yaw = Player.getPlayer().getYaw();
    var old_pitch = Player.getPlayer().getPitch();

    var mid_yaw;
    var mid_pitch;

    if (yaw < old_yaw) {
        yaw = yaw + 360;
    }

    if (yaw - old_yaw > 180) {
        var positive = false;
    } else {
        var positive = true;
    }
    if (positive) {
        for (var i = 0; i < steps; i++) {
            mid_yaw = old_yaw + (yaw - old_yaw) / steps * (i + 1);
            mid_pitch = old_pitch + (pitch - old_pitch) / steps * (i + 1);
            if (shake && i < steps - 1 && Math.random() + 0.5) {
                mid_yaw += Math.random() * 2;
                mid_pitch += Math.random() * 2;
            }
            Player.getPlayer().lookAt(mid_yaw, mid_pitch);
            Time.sleep(Math.floor(duration / steps));
        }
    } else {
        mid_yaw = old_yaw - (360 + old_yaw - yaw) / steps * (i + 1);
        mid_pitch = old_pitch + (pitch - old_pitch) / steps * (i + 1);
        if (shake && i < steps - 1 && Math.random() + 0.5) {
            mid_yaw += Math.random() * 2;
            mid_pitch += Math.random() * 2;
        }
        for (var i = 0; i < steps; i++) {
            Player.getPlayer().lookAt(mid_yaw, mid_pitch);
            Time.sleep(Math.floor(duration / steps));
        }
    }
}

// initial vars
const player = Player.getPlayer();
const inv = Player.openInventory();
var yaw;
var pitch = player.getPitch();;
var dest;
var last_slot;


for (var i = 0; i < 31; i++) {
    // first row
    Client.waitTick(5);
    KeyBind.keyBind("key.attack", true);
    Client.waitTick(5);
    KeyBind.keyBind("key.forward", true);
    Client.waitTick(20);
    while (true) {
        if (World.getBlock(Math.floor(player.getX()), Math.floor(player.getY()), Math.floor(player.getZ() + 1)).getId().includes("deepslate")) {
            KeyBind.keyBind("key.forward", false);
            KeyBind.keyBind("key.attack", false);
            break;
        }
        Client.waitTick(5);
    }

    // preparing for second row
    Client.waitTick(5);
    yaw = player.getYaw();
    smooth_look(yaw + 180, pitch);
    Client.waitTick(5);
    KeyBind.keyBind("key.back", true);
    KeyBind.keyBind("key.sneak", true);
    dest = Math.floor(player.getX()) + 2;
    Client.waitTick(10);
    KeyBind.keyBind("key.right", true);
    while (true) {
        if (player.getX() > dest + 0.3) {
            KeyBind.keyBind("key.right", false);
            break;
        }
    }
    while (true) {
        if (player.getX() < dest + 0.45) {
            KeyBind.keyBind("key.right", true);
            Client.waitTick(1);
            KeyBind.keyBind("key.right", false);
            Client.waitTick(8);
        } else if (player.getX() > dest + 0.55) {
            KeyBind.keyBind("key.left", true);
            Client.waitTick(1);
            KeyBind.keyBind("key.left", false);
            Client.waitTick(8);
        } else {
            break;
        }
    }
    KeyBind.keyBind("key.sneak", false);

    // second row
    Client.waitTick(5);
    KeyBind.keyBind("key.attack", true);
    Client.waitTick(2);
    KeyBind.keyBind("key.back", false);
    Client.waitTick(5);
    KeyBind.keyBind("key.forward", true);
    Client.waitTick(20);
    while (true) {
        if (World.getBlock(player.getPos()).getId().includes("deepslate")) {
            KeyBind.keyBind("key.forward", false);
            KeyBind.keyBind("key.attack", false);
            break;
        }
        Client.waitTick(5);
    }

    Chat.log(`Row ${i + 1} Completed`);

    // preparing for first row again
    if (i >= 30) break;  // except on last row
    Client.waitTick(5);
    yaw = player.getYaw();
    smooth_look(yaw + 180, pitch);
    Client.waitTick(5);
    KeyBind.keyBind("key.sneak", true);
    dest = Math.floor(player.getX()) + 1;
    Client.waitTick(10);
    KeyBind.keyBind("key.left", true);
    while (true) {
        if (player.getX() > dest + 0.3) {
            KeyBind.keyBind("key.left", false);
            break;
        }
    }
    while (true) {
        if (player.getX() < dest + 0.45) {
            KeyBind.keyBind("key.left", true);
            Client.waitTick(1);
            KeyBind.keyBind("key.left", false);
            Client.waitTick(8);
        } else if (player.getX() > dest + 0.55) {
            KeyBind.keyBind("key.right", true);
            Client.waitTick(1);
            KeyBind.keyBind("key.right", false);
            Client.waitTick(8);
        } else {
            break;
        }
    }
    KeyBind.keyBind("key.back", false);
    KeyBind.keyBind("key.sneak", false);

    // switching tool if it is close to break
    if (player.getMainHand().getDurability() < 200) {
        Client.waitTick(5);
        inv.setSelectedHotbarSlotIndex(inv.getSelectedHotbarSlotIndex() - 1);
        Client.waitTick(10);
    }

    // eat if hungry
    if (player.getFoodLevel() <= 12) {
        last_slot = inv.getSelectedHotbarSlotIndex();
        inv.setSelectedHotbarSlotIndex(8);
        Player.interactions().holdInteract(true);
        while (true) {
            if (Player.getPlayer().getFoodLevel() > 13) {
                Player.interactions().holdInteract(false);
                break;
            }
            Client.waitTick(2);
        }
        Client.waitTick(5);
        inv.setSelectedHotbarSlotIndex(last_slot);
        Client.waitTick(5);
    }
}
World.playSound("entity.ender_dragon.death", 100, 1.5);