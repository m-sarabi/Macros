while (true) {
    if (Player.getPlayer().getPitch() == 90.0) {
        break;
    }
    var entity;
    Client.runOnMainThread(JavaWrapper.methodToJava(() => {
        entity = Player.rayTraceEntity(7);
    }));
    Time.sleep(25);
    if (entity != null && entity.getType().includes("allay") && Player.getPlayer().distanceTo(entity) > 3.6 && entity.getVehicle() == null) {
        if (Player.getPlayer().getMainHand().getItemId() == "minecraft:egg") {
            if (Hud.getOpenScreen() != null) {
                Client.waitTick(10);
                continue;
            }
            const block = Player.rayTraceBlock(4.8, false);
            if (block && block.getId() == "minecraft:bamboo_trapdoor") {
                Client.waitTick(1);
                continue;
            }
            KeyBind.pressKeyBind("key.use");
            KeyBind.releaseKeyBind("key.use");
            Client.waitTick(7);
        }
    }
}
Chat.log("Done");