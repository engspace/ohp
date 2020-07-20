CREATE TABLE account_type (
    id text PRIMARY KEY
);

CREATE TABLE account (
    id serial PRIMARY KEY,
    type_id text NOT NULL,
    active boolean NOT NULL,
    user_id integer NOT NULL,
    verif text NOT NULL,

    FOREIGN KEY(type_id) REFERENCES account_type(id),
    FOREIGN KEY(user_id) REFERENCES "user"(id)
);

CREATE TABLE organization (
    id serial PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL
);
