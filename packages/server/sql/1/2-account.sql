
CREATE TABLE account_type (
    id text PRIMARY KEY
);

INSERT INTO account_type (id) VALUES
    ('LOCAL'),
    ('GOOGLE');

CREATE TABLE account (
    id serial PRIMARY KEY,
    type_id text NOT NULL,
    active boolean NOT NULL,
    user_id integer NOT NULL,
    refresh_token bytea,
    password text,
    provider_id text,

    registered timestamptz NOT NULL,
    last_signin timestamptz,

    UNIQUE(user_id),

    FOREIGN KEY(type_id) REFERENCES account_type(id),
    FOREIGN KEY(user_id) REFERENCES "user"(id)
);

CREATE INDEX account_refresh_token ON account USING HASH(refresh_token);
