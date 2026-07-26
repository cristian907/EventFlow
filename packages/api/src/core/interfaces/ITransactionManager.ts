import { ITransactionContext } from './ITransactionContext';

export default interface ITransactionManager {
    runInTransaction<T>(callback: (tx: ITransactionContext) => Promise<T>): Promise<T>;
}
