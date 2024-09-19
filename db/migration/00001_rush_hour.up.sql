CREATE SEQUENCE board_seq;

CREATE TABLE board (
    id          TEXT PRIMARY KEY NOT NULL DEFAULT 'BOARD-' || nextval('board_seq'),
    hash        TEXT NOT NULL,
    h           TEXT NOT NULL,
    v           TEXT NOT NULL,
    created_at  TIMESTAMPTZ,
    updated_at  TIMESTAMPTZ
);

ALTER SEQUENCE board_seq OWNED BY board.id;

CREATE UNIQUE INDEX board_hash ON board (hash);
