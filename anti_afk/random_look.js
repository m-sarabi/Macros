function smooth_look(yaw, pitch, steps = 60, duration = 300) {
    var old_yaw = Player.getPlayer().getYaw();
    var old_pitch = Player.getPlayer().getPitch();

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
            Player.getPlayer().lookAt(old_yaw + (yaw - old_yaw) / steps * (i + 1),
                old_pitch + (pitch - old_pitch) / steps * (i + 1));
            Time.sleep(Math.floor(duration / steps));
        }
    } else {
        for (var i = 0; i < steps; i++) {
            Player.getPlayer().lookAt(old_yaw - (360 + old_yaw - yaw) / steps * (i + 1),
                old_pitch + (pitch - old_pitch) / steps * (i + 1));
            Time.sleep(Math.floor(duration / steps));
        }
    }
}

var player = Player.getPlayer();
var count = 5;

// check if player has weakness
while (true) {
    if (player.hasStatusEffect("weakness") && count >= 0) {
        smooth_look(Math.random() * 360, Math.random() * 170 - 85);
        Client.waitTick(Math.floor(Math.random() * 40 + 20));
        count--;
    }
    Client.waitTick(Math.floor(Math.random() * 3600 + 600));
    count = 5;
}