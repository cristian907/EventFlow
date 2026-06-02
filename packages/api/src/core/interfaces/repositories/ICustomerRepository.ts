import Customer from '../../entities/Customer';
import { ITransactionContext } from '../ITransactionContext';

export interface CustomerUpsertData {
    idNumber: string;
    fullName: string;
    phone?: string;
    email?: string;
}

export default interface ICustomerRepository {
    findByIdNumber(idNumber: string, tx?: ITransactionContext): Promise<Customer | null>;
    upsertByIdNumber(data: CustomerUpsertData, tx?: ITransactionContext): Promise<Customer>;
}
