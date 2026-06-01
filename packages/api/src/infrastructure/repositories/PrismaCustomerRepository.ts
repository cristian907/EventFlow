import Customer from '../../core/entities/Customer';
import { ITransactionContext } from '../../core/interfaces/ITransactionContext';
import ICustomerRepository, {
    CustomerUpsertData,
} from '../../core/interfaces/repositories/ICustomerRepository';
import { PrismaClient, Customer as PrismaCustomer } from '../../generated/prisma/client';

import { getClient } from './prismaTransactionHelper';

export default class PrismaCustomerRepository implements ICustomerRepository {
    constructor(private readonly prisma: PrismaClient) {}

    private mapToEntity(record: PrismaCustomer): Customer {
        return new Customer(
            record.id,
            record.idNumber,
            record.fullName,
            record.phone,
            record.email,
            record.createdAt,
            record.updatedAt,
        );
    }

    async findByIdNumber(idNumber: string, tx?: ITransactionContext): Promise<Customer | null> {
        const client = getClient(this.prisma, tx);
        const found = await client.customer.findUnique({ where: { idNumber } });
        return found ? this.mapToEntity(found) : null;
    }

    async upsertByIdNumber(data: CustomerUpsertData, tx?: ITransactionContext): Promise<Customer> {
        const client = getClient(this.prisma, tx);
        const record = await client.customer.upsert({
            where: { idNumber: data.idNumber },
            update: {
                fullName: data.fullName,
                phone: data.phone ?? null,
                email: data.email ?? null,
            },
            create: {
                idNumber: data.idNumber,
                fullName: data.fullName,
                phone: data.phone ?? null,
                email: data.email ?? null,
            },
        });
        return this.mapToEntity(record);
    }
}
