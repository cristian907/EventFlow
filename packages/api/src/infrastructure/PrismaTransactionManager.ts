import { ITransactionContext } from '../core/interfaces/ITransactionContext';
import ITransactionManager from '../core/interfaces/ITransactionManager';
import { PrismaClient } from '../generated/prisma/client';

export default class PrismaTransactionManager implements ITransactionManager {
    constructor(private readonly prisma: PrismaClient) {}

    async runInTransaction<T>(callback: (tx: ITransactionContext) => Promise<T>): Promise<T> {
        return this.prisma.$transaction(async (prismaTx: unknown) => {
            return callback(prismaTx as ITransactionContext);
        });
    }
}
