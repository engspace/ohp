import { ForbiddenError, UserInputError } from 'apollo-server-koa';
import validator from 'validator';
import { Id, UserInput, User } from '@engspace/core';
import { UserControl, ApiContext } from '@engspace/server-api';
import { OhpDaoSet } from '../dao';

export class OhpUserControl extends UserControl<OhpDaoSet> {
    constructor(dao: OhpDaoSet) {
        super(dao);
    }

    async update(ctx: ApiContext, userId: Id, input: UserInput): Promise<User> {
        const self = userId === ctx.auth.userId;
        if (!self) {
            throw new ForbiddenError('can only update self, not others');
        }
        if (!validator.isEmail(input.email)) {
            throw new UserInputError(`"${input.email}" is not a valid email address`);
        }

        const user = await this.dao.user.byId(ctx.db, userId);
        if (user.name === input.name) {
            return this.dao.user.update(ctx.db, userId, input);
        }

        return ctx.db.transaction((db) => {
            return Promise.all([
                this.dao.organization.rename(db, { from: user.name, to: input.name }),
                this.dao.user.update(db, userId, input),
            ])[1];
        });
    }
}
