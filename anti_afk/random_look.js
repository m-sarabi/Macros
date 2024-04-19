const player = Player.getPlayer();
var start = true;
var velocity = [0.0, 0.0];
var counter = 0;
while (true) {
    Client.waitTick(Math.floor(Math.random() * 1200 + 600));
    while (player.hasStatusEffect("weakness") || counter > 0) {
        if (start === true) {
            Chat.log("Weakness is your weakness!!");
            counter = Math.floor(500);
            start = false;
            KeyBind.keyBind("key.sneak", true);
            KeyBind.keyBind("key.forward", true);
        }
        counter -= 1;
        var rotation = [player.getYaw(), player.getPitch()];
        velocity[0] = Math.max(-2, Math.min(2, rotation[0] + (Math.random() - 0.5) * 0.1));
        //velocity[1] = Math.max(-1, Math.min(1, rotation[1] + (Math.random() - 0.5) * 0.01));
        rotation[0] = rotation[0] + velocity[0];
        if (rotation[0] > 180) {
            rotation[0] = rotation[0] - 360;
        } else if (rotation[0] < -180) {
            rotation[0] = 360 + rotation[0];
        }
        //rotation[1] = rotation[1] + velocity[1];
        player.lookAt(rotation[0], rotation[1]);
        Time.sleep(20);
    }
    start = true;
    KeyBind.keyBind("key.forward", false);
    KeyBind.keyBind("key.sneak", false);
}