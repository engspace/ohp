import { ForbiddenError, UserInputError } from 'apollo-server-koa';
import validator from 'validator';
import { Id, UserInput, User } from '@engspace/core';
import { UserControl } from '@engspace/server-api';
import { OhpContext } from '..';

export class OhpUserControl extends UserControl {
    async update(
        { db, auth, runtime: { dao } }: OhpContext,
        userId: Id,
        input: UserInput
    ): Promise<User> {
        const self = userId === auth.userId;
        if (!self) {
            throw new ForbiddenError('can only update self, not others');
        }
        if (!validator.isEmail(input.email)) {
            throw new UserInputError(`"${input.email}" is not a valid email address`);
        }

        const user = await dao.user.byId(db, userId);
        if (user.name === input.name) {
            return dao.user.update(db, userId, input);
        }

        return db.transaction((transacDb) => {
            return Promise.all([
                dao.organization.rename(transacDb, { from: user.name, to: input.name }),
                dao.user.update(transacDb, userId, input),
            ])[1];
        });
    }
}
