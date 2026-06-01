import { ITransactionContext } from '../../core/interfaces/ITransactionContext';
import { PrismaClient } from '../../generated/prisma/client';

type PrismaTransactionClient = Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export function getClient(prisma: PrismaClient, tx?: ITransactionContext): PrismaTransactionClient {
    return tx ? (tx as unknown as PrismaTransactionClient) : prisma;
}
