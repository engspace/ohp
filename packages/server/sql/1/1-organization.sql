
CREATE TABLE organization (
    id serial PRIMARY KEY,
    name text NOT NULL,
    description text NOT NULL,

    UNIQUE(name)
);

CREATE TABLE organization_member(
    id serial PRIMARY KEY,
    organization_id integer NOT NULL,
    user_id integer NOT NULL,
    roles text,

    UNIQUE(organization_id, user_id),

    FOREIGN KEY(organization_id) REFERENCES organization(id),
    FOREIGN KEY(user_id) REFERENCES "user"(id)
);
