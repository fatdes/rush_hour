/* eslint-disable */
export default async () => {
    const t = {
        ["./dto/game.dto"]: await import("./dto/game.dto")
    };
    return { "@nestjs/swagger": { "models": [[import("./dto/game.dto"), { "MoveCarDto": { carId: { required: true, type: () => Number }, direction: { required: true, enum: t["./dto/game.dto"].MovementDirection } } }]], "controllers": [[import("./gm.controller"), { "GMController": { "createBoard": { type: String } } }], [import("./health.controller"), { "HealthController": { "check": { type: Object } } }], [import("./player.controller"), { "PlayerController": { "startGame": { type: String }, "moveCar": { type: Boolean } } }]] } };
};