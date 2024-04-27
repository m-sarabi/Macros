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

const player = Player.getPlayer();
const yaw = player.getYaw();
const pitch = player.getPitch();

smooth_look(yaw + 180, pitch);