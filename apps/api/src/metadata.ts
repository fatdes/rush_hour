/* eslint-disable */
export default async () => {
    const t = {
        ["../../../libs/board/src/car"]: await import("../../../libs/board/src/car")
    };
    return { "@nestjs/swagger": { "models": [[import("./dto/game.dto"), { "MoveCarDto": { carId: { required: true, type: () => Number }, direction: { required: true, enum: t["../../../libs/board/src/car"].MovementDirection } } }]], "controllers": [[import("./gm.controller"), { "GMController": { "createBoard": { type: String } } }], [import("./health.controller"), { "HealthController": { "check": { type: Object } } }], [import("./player.controller"), { "PlayerController": { "startGame": { type: String }, "moveCar": { type: Boolean } } }]] } };
};