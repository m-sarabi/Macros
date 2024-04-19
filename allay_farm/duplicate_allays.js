const allays = [];
const allays_id = [];
count = 0;
KeyBind.keyBind("key.right", true);
if (Math.abs(Player.getPlayer().getYaw()) < 90.0) {
    Player.getPlayer().lookAt(0, 16.0);
} else {
    Player.getPlayer().lookAt(180.0, 16.0);
}
while (count < 11) {
    var entity;
    var pitch;
    Client.runOnMainThread(JavaWrapper.methodToJava(() => {
        entity = Player.rayTraceEntity(3);
        pitch = Player.getPlayer().getPitch();
    }));
    Time.sleep(25);
    if (pitch == 90.0) {
        break;
    }
    if (entity != null && entity.getVehicle() != null && entity.getType().includes("allay")) {
        const uuid = entity.getUUID();
        if (!allays_id.includes(uuid)) {
            KeyBind.keyBind("key.right", false);
            allays.push(entity);
            allays_id.push(uuid);
            count = count + 1;
            Client.waitTick(4);
            KeyBind.pressKeyBind("key.use");
            KeyBind.releaseKeyBind("key.use");
            Client.waitTick(4);
            KeyBind.keyBind("key.right", true);
        }
    }
}
KeyBind.keyBind("key.right", false);
Time.sleep(200);
Chat.log("Done");